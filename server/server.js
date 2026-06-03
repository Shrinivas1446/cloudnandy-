require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");

// ─── Config ──────────────────────────────────────────────────────────────────

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  SUPABASE_BUCKET = "property-images",
  SUPABASE_TABLE = "properties",
  PORT = 3000,
  ALLOWED_ORIGIN = "*",
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "❌ Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_KEY"
  );
  process.exit(1);
}

// Service-role client → bypasses ALL Supabase RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// ─── Express setup ────────────────────────────────────────────────────────────

const app = express();

app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Multer: store uploaded files in memory so we can pipe them to Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB per file
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const normalizeProperty = (row) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  price: Number(row.price),
  description: row.description,
  image_url: row.image_url,
  image_urls: Array.isArray(row.image_urls) ? row.image_urls : [],
  createdAt: row.created_at,
});

/**
 * Upload one file buffer to Supabase Storage.
 * Returns the public URL string.
 */
const uploadFileToStorage = async (file) => {
  const ext = file.originalname.split(".").pop() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  const { data: urlData } = supabase.storage
    .from(SUPABASE_BUCKET)
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};

const sendError = (res, status, message) =>
  res.status(status).json({ error: message });

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// GET /api/properties — list all
app.get("/api/properties", async (_req, res) => {
  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return sendError(res, 500, error.message);
  res.json(data.map(normalizeProperty));
});

// GET /api/properties/:id — single property
app.get("/api/properties/:id", async (req, res) => {
  const { data, error } = await supabase
    .from(SUPABASE_TABLE)
    .select("*")
    .eq("id", req.params.id);

  if (error) return sendError(res, 500, error.message);
  if (!data || !data.length) return sendError(res, 404, "Property not found.");
  res.json(normalizeProperty(data[0]));
});

// POST /api/properties — create with image upload
app.post(
  "/api/properties",
  upload.array("images", 10),
  async (req, res) => {
    const { name, type, price, description } = req.body;

    if (!name || !type || !price || !description) {
      return sendError(res, 400, "Missing required fields: name, type, price, description");
    }

    if (!req.files || req.files.length === 0) {
      return sendError(res, 400, "At least one image file is required.");
    }

    let imageUrls;
    try {
      imageUrls = await Promise.all(req.files.map(uploadFileToStorage));
    } catch (err) {
      return sendError(res, 500, err.message);
    }

    const { error: insertError } = await supabase.from(SUPABASE_TABLE).insert({
      name,
      type,
      price: Number(price),
      description,
      image_url: imageUrls[0],
      image_urls: imageUrls,
    });

    if (insertError) {
      console.error("INSERT error:", insertError);
      return sendError(res, 500, insertError.message);
    }

    // Fetch the inserted row
    const { data, error: fetchError } = await supabase
      .from(SUPABASE_TABLE)
      .select("*")
      .eq("image_url", imageUrls[0])
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError) return sendError(res, 500, fetchError.message);
    if (!data || !data.length) return sendError(res, 500, "Insert may have been blocked by Supabase RLS. Please run supabase-setup.sql in your Supabase SQL Editor.");
    res.status(201).json(normalizeProperty(data[0]));
  }
);

// PUT /api/properties/:id — update (images optional)
app.put(
  "/api/properties/:id",
  upload.array("images", 10),
  async (req, res) => {
    const { id } = req.params;
    const { name, type, price, description } = req.body;

    if (!name || !type || !price || !description) {
      return sendError(res, 400, "Missing required fields: name, type, price, description");
    }

    // Resolve image URLs — use newly uploaded ones, or keep the existing list
    let imageUrls;
    if (req.files && req.files.length > 0) {
      try {
        imageUrls = await Promise.all(req.files.map(uploadFileToStorage));
      } catch (err) {
        return sendError(res, 500, err.message);
      }
    } else {
      // Fallback: read existing URLs from body (sent as JSON string)
      try {
        imageUrls = req.body.existing_image_urls
          ? JSON.parse(req.body.existing_image_urls)
          : [];
      } catch {
        imageUrls = [];
      }
    }

    const { data: updatedData, error: updateError } = await supabase
      .from(SUPABASE_TABLE)
      .update({
        name,
        type,
        price: Number(price),
        description,
        image_url: imageUrls[0] || null,
        image_urls: imageUrls,
      })
      .eq("id", id)
      .select();

    if (updateError) {
      console.error("UPDATE error:", updateError);
      return sendError(res, 500, updateError.message);
    }

    if (!updatedData || updatedData.length === 0) {
      console.error("UPDATE silent fail — RLS may be blocking writes. Run supabase-setup.sql.");
      return sendError(res, 403, "Update was blocked by Supabase RLS. Please run supabase-setup.sql in your Supabase SQL Editor and ensure your SUPABASE_SERVICE_KEY is the service_role key.");
    }

    console.log(`Updated property ${id} successfully`);
    res.json(normalizeProperty(updatedData[0]));
  }
);

// DELETE /api/properties/:id
app.delete("/api/properties/:id", async (req, res) => {
  const { data: deletedData, error } = await supabase
    .from(SUPABASE_TABLE)
    .delete()
    .eq("id", req.params.id)
    .select();

  if (error) {
    console.error("DELETE error:", error);
    return sendError(res, 500, error.message);
  }

  if (!deletedData || deletedData.length === 0) {
    console.error("DELETE silent fail — RLS may be blocking deletes. Run supabase-setup.sql.");
    return sendError(res, 403, "Delete was blocked by Supabase RLS. Please run supabase-setup.sql in your Supabase SQL Editor and ensure your SUPABASE_SERVICE_KEY is the service_role key.");
  }

  console.log(`Deleted property ${req.params.id} successfully`);
  res.json({ ok: true });
});

// ─── Global error handler ─────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅  Cloud Nandy API running on port ${PORT}`);
});
