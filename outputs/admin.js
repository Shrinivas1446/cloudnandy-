const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "cloud123";
const SESSION_KEY = "cloudNandyAdminSession";

// ─── API base URL ─────────────────────────────────────────────────────────────
// In production, replace this with your Render API URL, e.g.:
//   const API_BASE = "https://cloud-nandy-api.onrender.com";
// During local development, the API runs on http://localhost:3000
const API_BASE = window.CLOUD_NANDY_API_BASE || "https://cloud-nandy-api.onrender.com";

// ─── DOM refs ──────────────────────────────────────────────────────────────────
const loginPanel = document.querySelector("#loginPanel");
const dashboardPanel = document.querySelector("#dashboardPanel");
const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const logoutButton = document.querySelector("#logoutButton");
const propertyForm = document.querySelector("#propertyForm");
const propertyName = document.querySelector("#propertyName");
const propertyPrice = document.querySelector("#propertyPrice");
const propertyType = document.querySelector("#propertyType");
const propertyDescription = document.querySelector("#propertyDescription");
const propertyImage = document.querySelector("#propertyImage");
const imagePreview = document.querySelector("#imagePreview");
const propertyList = document.querySelector("#propertyList");
const adminMessage = document.querySelector("#adminMessage");
const clearProperties = document.querySelector("#clearProperties");
const totalProperties = document.querySelector("#totalProperties");
const latestUpload = document.querySelector("#latestUpload");
const propertySubmitButton = document.querySelector("#propertySubmitButton");
const cancelEditButton = document.querySelector("#cancelEditButton");

let editingPropertyId = "";
let editingPropertyImages = [];
let currentProperties = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatRupees = (amount) => `\u20B9${Number(amount).toLocaleString("en-IN")}`;

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });

const normalizeProperty = (property) => ({
  id: property.id,
  name: property.name,
  type: property.type,
  price: Number(property.price),
  description: property.description,
  image_urls: property.image_urls?.length
    ? property.image_urls
    : [property.image_url || property.image].filter(Boolean),
  image: property.image_url || property.image_urls?.[0] || property.image,
  image_url: property.image_url || property.image_urls?.[0] || property.image,
  createdAt: property.created_at || property.createdAt,
});

/**
 * Fetch all properties from our backend API.
 */
const fetchProperties = async () => {
  const response = await fetch(`${API_BASE}/api/properties`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.map(normalizeProperty);
};

/**
 * Create a new property by sending multipart form data to the API.
 */
const createProperty = async ({ name, type, price, description }, imageFiles) => {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("type", type);
  formData.append("price", String(price));
  formData.append("description", description);
  imageFiles.forEach((file) => formData.append("images", file));

  const response = await fetch(`${API_BASE}/api/properties`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${response.status}`);
  }
  return normalizeProperty(await response.json());
};

/**
 * Update an existing property.
 * Pass new image files to replace images, or pass an empty array to keep existing ones.
 */
const updateProperty = async ({ id, name, type, price, description, image_urls }, imageFiles) => {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("type", type);
  formData.append("price", String(price));
  formData.append("description", description);

  if (imageFiles.length > 0) {
    imageFiles.forEach((file) => formData.append("images", file));
  } else {
    // Send existing URLs so the server keeps them
    formData.append("existing_image_urls", JSON.stringify(image_urls || []));
  }

  const response = await fetch(`${API_BASE}/api/properties/${id}`, {
    method: "PUT",
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${response.status}`);
  }
  return normalizeProperty(await response.json());
};

/**
 * Delete a property by ID.
 */
const deleteProperty = async (id) => {
  const response = await fetch(`${API_BASE}/api/properties/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${response.status}`);
  }
  return true;
};

// ─── UI helpers ───────────────────────────────────────────────────────────────
const showDashboard = () => {
  loginPanel.hidden = true;
  dashboardPanel.hidden = false;
  renderUploadedProperties();
};

const showLogin = () => {
  dashboardPanel.hidden = true;
  loginPanel.hidden = false;
};

const resetPropertyForm = () => {
  propertyForm.reset();
  editingPropertyId = "";
  editingPropertyImages = [];
  imagePreview.innerHTML = "<span>Image previews will appear here</span>";
  propertySubmitButton.textContent = "Publish Property";
  cancelEditButton.hidden = true;
  propertyImage.required = true;
};

const startEditProperty = (property) => {
  editingPropertyId = property.id;
  editingPropertyImages = property.image_urls?.length ? property.image_urls : [property.image].filter(Boolean);
  propertyName.value = property.name;
  propertyPrice.value = property.price;
  propertyType.value = property.type;
  propertyDescription.value = property.description;
  propertyImage.value = "";
  propertyImage.required = false;
  propertySubmitButton.textContent = "Save Changes";
  cancelEditButton.hidden = false;
  imagePreview.innerHTML = editingPropertyImages
    .map((imageUrl) => `<img src="${imageUrl}" alt="${escapeHtml(property.name)}" />`)
    .join("");
  adminMessage.classList.remove("error");
  adminMessage.textContent = `Editing "${property.name}". Upload new images only if you want to replace them.`;
  propertyForm.scrollIntoView({ behavior: "smooth", block: "start" });
};

const renderUploadedProperties = async () => {
  let properties = [];

  try {
    properties = await fetchProperties();
  } catch (error) {
    adminMessage.textContent = `Failed to load properties from server. ${error.message}`;
    adminMessage.classList.add("error");
  }

  currentProperties = properties;
  totalProperties.textContent = String(properties.length);
  latestUpload.textContent = properties[0]?.name || "None";

  if (!properties.length) {
    propertyList.innerHTML = '<p class="empty-list">No uploaded properties yet.</p>';
    return;
  }

  propertyList.innerHTML = properties
    .map(
      (property) => `
        <article class="property-item" data-property-id="${escapeHtml(property.id)}">
          <img src="${property.image}" alt="${escapeHtml(property.name)}" />
          <div>
            <h4>${escapeHtml(property.name)}</h4>
            <p>${escapeHtml(property.type)}</p>
            <p>${escapeHtml(property.description)}</p>
            <p>${property.image_urls.length} image(s)</p>
            <span class="property-price">${formatRupees(property.price)}/night</span>
            <div class="property-actions">
              <button class="text-button" type="button" data-edit-property="${escapeHtml(property.id)}">Edit</button>
              <button class="danger-button" type="button" data-delete-property="${escapeHtml(property.id)}">Delete</button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
};

// ─── Event listeners ──────────────────────────────────────────────────────────
loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loginMessage.classList.remove("error");

  const username = document.querySelector("#adminUsername").value.trim();
  const password = document.querySelector("#adminPassword").value;

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    loginMessage.textContent = "Invalid username or password.";
    loginMessage.classList.add("error");
    return;
  }

  sessionStorage.setItem(SESSION_KEY, "true");
  loginForm.reset();
  loginMessage.textContent = "";
  showDashboard();
});

logoutButton.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  showLogin();
});

propertyImage.addEventListener("change", () => {
  const files = Array.from(propertyImage.files || []);

  if (!files.length) {
    imagePreview.innerHTML = "<span>Image previews will appear here</span>";
    return;
  }

  imagePreview.innerHTML = "";

  files.forEach((file) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      imagePreview.insertAdjacentHTML(
        "beforeend",
        `<img src="${String(reader.result)}" alt="Selected property preview" />`,
      );
    });
    reader.readAsDataURL(file);
  });
});

propertyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  adminMessage.classList.remove("error");
  const imageFiles = Array.from(propertyImage.files || []);
  const isEditing = Boolean(editingPropertyId);

  if (!isEditing && !imageFiles.length) {
    adminMessage.textContent = "Please upload at least one property image.";
    adminMessage.classList.add("error");
    return;
  }

  const propertyData = {
    id: editingPropertyId,
    name: propertyName.value.trim(),
    type: propertyType.value,
    price: Number(propertyPrice.value),
    description: propertyDescription.value.trim(),
    image_urls: editingPropertyImages,
  };

  adminMessage.textContent = isEditing ? "Updating property..." : "Uploading property...";
  propertySubmitButton.disabled = true;

  (async () => {
    try {
      const saved = isEditing
        ? await updateProperty(propertyData, imageFiles)
        : await createProperty(propertyData, imageFiles);
      await renderUploadedProperties();
      adminMessage.classList.remove("error");
      adminMessage.textContent = isEditing
        ? `"${saved.name}" updated successfully.`
        : `"${saved.name}" published successfully.`;
      resetPropertyForm();
    } catch (error) {
      adminMessage.textContent = `Save failed: ${error.message}`;
      adminMessage.classList.add("error");
    } finally {
      propertySubmitButton.disabled = false;
    }
  })();
});

clearProperties.addEventListener("click", () => {
  renderUploadedProperties();
  adminMessage.textContent = "Property list refreshed.";
});

cancelEditButton.addEventListener("click", () => {
  resetPropertyForm();
  adminMessage.textContent = "Edit cancelled.";
});

propertyList.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-property]");
  const deleteButton = event.target.closest("[data-delete-property]");

  if (!editButton && !deleteButton) return;

  const propertyId = editButton?.dataset.editProperty || deleteButton?.dataset.deleteProperty;
  const property = currentProperties.find((item) => item.id === propertyId);

  if (!property) {
    adminMessage.textContent = "Property not found. Refresh the list and try again.";
    adminMessage.classList.add("error");
    return;
  }

  if (editButton) {
    startEditProperty(property);
    return;
  }

  const confirmed = window.confirm(`Delete "${property.name}"? This cannot be undone.`);
  if (!confirmed) return;

  adminMessage.classList.remove("error");
  adminMessage.textContent = "Deleting property...";

  (async () => {
    try {
      await deleteProperty(property.id);
      await renderUploadedProperties();
      resetPropertyForm();
      adminMessage.textContent = `"${property.name}" deleted successfully.`;
    } catch (error) {
      adminMessage.textContent = `Delete failed: ${error.message}`;
      adminMessage.classList.add("error");
    }
  })();
});

// ─── Init ─────────────────────────────────────────────────────────────────────
if (sessionStorage.getItem(SESSION_KEY) === "true") {
  showDashboard();
} else {
  showLogin();
}
