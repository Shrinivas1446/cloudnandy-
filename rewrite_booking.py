import sys

js_code = """// ── Supabase Setup ─────────────────────────────────────────────────────────
const supabaseConfig = window.CLOUD_NANDY_SUPABASE;
const supabaseClient =
  window.supabase && supabaseConfig
    ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.key)
    : null;

// ── Helpers ────────────────────────────────────────────────────────────────
const today = new Date();
today.setHours(0, 0, 0, 0);

const dateToInputValue = (d) => d.toISOString().split("T")[0];
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const formatRupees = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const formatRupeesRaw = (n) => Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 });
const escapeHtml = (v) => String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

const roomRates = {};
let propertiesCache = [];
let cart = null; // We only allow 1 room in cart at a time based on the screenshot summary design

// ── Supabase Fetch ──────────────────────────────────────────────────────────
const normalizeProperty = (p) => ({
  id: p.id,
  name: p.name,
  type: p.type,
  price: Number(p.price),
  description: p.description,
  guests_allowed: p.guests_allowed,
  image_urls: (p.image_urls && p.image_urls.length) ? p.image_urls : [p.image_url || p.image].filter(Boolean),
  image: p.image_url || (p.image_urls && p.image_urls[0]) || p.image,
  abbreviation: p.name.split(' ').map(w => w[0]).join('').substring(0,3).toUpperCase() + "-STD (CP)" // Fake abbreviation for the screenshot
});

const fetchProperties = async () => {
  if (!supabaseClient) throw new Error("Supabase not configured.");
  const { data, error } = await supabaseClient
    .from(supabaseConfig.table)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(normalizeProperty);
};

// ── DOM Elements ────────────────────────────────────────────────────────────
const checkIn = document.querySelector("#checkIn");
const checkOut = document.querySelector("#checkOut");
const roomsCount = document.querySelector("#roomsCount");
const grid = document.querySelector("#bookingPropertyGrid");
const sidebar = document.querySelector("#bookingSidebar");
const overlay = document.querySelector("#bookingFormOverlay");
const closeBtn = document.querySelector("#closeBookingModal");
const bookingForm = document.querySelector("#bookingForm");
const formMessage = document.querySelector("#formMessage");

const params = new URLSearchParams(window.location.search);

// ── Date Defaults ───────────────────────────────────────────────────────────
const defaultCheckIn = addDays(today, 1);
const defaultCheckOut = addDays(today, 2);

checkIn.min = dateToInputValue(today);
checkIn.value = params.get("checkIn") || dateToInputValue(defaultCheckIn);
checkOut.min = dateToInputValue(addDays(defaultCheckIn, 1));
checkOut.value = params.get("checkOut") || dateToInputValue(defaultCheckOut);

const getNightCount = () => {
  const s = new Date(`${checkIn.value}T00:00:00`);
  const e = new Date(`${checkOut.value}T00:00:00`);
  return Math.max(Math.round((e - s) / 86400000), 1);
};

const syncCheckOut = () => {
  const s = new Date(`${checkIn.value}T00:00:00`);
  const minOut = addDays(s, 1);
  checkOut.min = dateToInputValue(minOut);
  if (new Date(`${checkOut.value}T00:00:00`) <= s) {
    checkOut.value = dateToInputValue(minOut);
  }
  renderSidebar();
};
checkIn.addEventListener("change", syncCheckOut);
checkOut.addEventListener("change", renderSidebar);

// ── Icons ──────────────────────────────────────────────────────────────
const personSVG = (n) => {
  const single = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;"><circle cx="12" cy="7" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
  return Array(n).fill(single).join("");
};
const childSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;"><circle cx="12" cy="8" r="3.5"/><path d="M7 21c0-3 2.5-5.5 5-5.5s5 2.5 5 5.5"/></svg>`;
const extraPersonSVG = `Ex. ${personSVG(1)}`;

// ── Render Rooms ───────────────────────────────────────────────────────────
const renderRooms = () => {
  grid.innerHTML = "";
  if (!propertiesCache.length) {
    grid.innerHTML = '<p class="empty-list">No rooms found. Please add properties from the admin panel.</p>';
    return;
  }

  grid.innerHTML = propertiesCache.map((p, i) => {
    roomRates[p.name] = p.price;
    const extraChild = Math.round(p.price * 0.2);
    
    // Check if this room is in cart
    const inCart = cart && cart.name === p.name;
    const roomsLeft = inCart ? 0 : 1;
    
    // Image slider
    const images = p.image_urls && p.image_urls.length ? p.image_urls : [p.image];
    const hasMultiple = images.length > 1;
    const imgSlider = `
      <div class="room-img-slider" id="slider-${i}">
        <div class="room-img-track">
          ${images.map((url, idx) => `<img src="${escapeHtml(url)}" alt="${escapeHtml(p.name)}" class="room-slide-img" data-idx="${idx}" style="${idx > 0 ? 'display:none' : ''}" />`).join("")}
        </div>
        ${hasMultiple ? `
          <button class="slider-btn slider-prev" data-slider="${i}" aria-label="Previous">&#10094;</button>
          <button class="slider-btn slider-next" data-slider="${i}" aria-label="Next">&#10095;</button>
        ` : ""}
      </div>
    `;

    return `
      <div class="skyrooms-card">
        <div class="skyrooms-title-bar">
          <h3>${escapeHtml(p.name)}</h3>
        </div>
        <div class="skyrooms-body">
          <div class="skyrooms-left">
            ${imgSlider}
            <div class="skyrooms-facilities">
              <h4>Facilities</h4>
              <div class="facilities-list">
                <div class="fac-item"><span class="fac-lbl">TV</span></div>
                <div class="fac-item"><span class="fac-lbl">ADVANCED HEATER</span></div>
                <div class="fac-item"><span class="fac-lbl">TOWEL</span></div>
                <div class="fac-item"><span class="fac-lbl">WATER BOTTLE</span></div>
              </div>
            </div>
          </div>
          <div class="skyrooms-right">
            <div class="std-badge-wrapper">
              <span class="std-text">STD <small>(With Breakfast)</small></span>
              <span class="std-badge-price">${formatRupees(p.price).replace('₹','')}</span>
            </div>
            
            <div class="skyrooms-table-wrap">
              <table class="skyrooms-rate-table">
                <thead>
                  <tr>
                    <th style="text-align: left; width: 60px;">Pax</th>
                    <th>${personSVG(1)}</th>
                    <th>${personSVG(2)}</th>
                    <th>${childSVG}</th>
                    <th>${extraPersonSVG}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="text-align: left;">Rate</td>
                    <td>${formatRupees(p.price)}</td>
                    <td>${formatRupees(p.price)}</td>
                    <td>${formatRupees(extraChild)}</td>
                    <td>₹0</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p class="skyrooms-tax-note"><span style="color:red">*</span> Taxes added to Actual Rates depending on No.of Sleeps</p>
            
            <div class="skyrooms-info-bar">
              <div class="info-left">
                <span class="info-icon">i</span> Room Info
              </div>
              <div class="info-right">
                ${roomsLeft} Room(s) Left 
                ${!inCart ? `<button type="button" class="skyrooms-book-btn" data-property-id="${p.id}">Book Room</button>` : `<span style="color:#d4af37; font-weight:bold;">In Cart</span>`}
              </div>
            </div>
            
            <div class="skyrooms-config-bar">
              <div class="config-col">
                <label>Rooms</label>
                <div class="config-val">1</div>
              </div>
              <div class="config-col">
                <label>Adult <small>(Pax Per Room)</small></label>
                <select class="skyrooms-select" data-role="adults" data-property-id="${p.id}">
                  <option value="1">1</option>
                  <option value="2" selected>2</option>
                  <option value="3">3</option>
                </select>
              </div>
              <div class="config-col">
                <label>Child <small>(Total Pax)</small></label>
                <select class="skyrooms-select" data-role="children" data-property-id="${p.id}">
                  <option value="0" selected>0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
              </div>
              <div class="config-col">
                <label>Extra <small>(Total Pax)</small></label>
                <select class="skyrooms-select" data-role="extra" data-property-id="${p.id}">
                  <option value="0" selected>0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Slider logic
  document.querySelectorAll(".slider-prev, .slider-next").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const sliderId = btn.dataset.slider;
      const slider = document.getElementById(`slider-${sliderId}`);
      const imgs = slider.querySelectorAll(".room-slide-img");
      let current = [...imgs].findIndex(img => img.style.display !== "none");
      imgs[current].style.display = "none";
      const dir = btn.classList.contains("slider-next") ? 1 : -1;
      const next = (current + dir + imgs.length) % imgs.length;
      imgs[next].style.display = "block";
    });
  });

  // Config change listener to update cart if already in cart
  document.querySelectorAll(".skyrooms-select").forEach(sel => {
    sel.addEventListener("change", (e) => {
      const pid = e.target.dataset.propertyId;
      if (cart && cart.id === pid) {
        // Update cart with new config
        const card = e.target.closest('.skyrooms-card');
        cart.adults = parseInt(card.querySelector('[data-role="adults"]').value, 10);
        cart.children = parseInt(card.querySelector('[data-role="children"]').value, 10);
        cart.extra = parseInt(card.querySelector('[data-role="extra"]').value, 10);
        renderSidebar();
      }
    });
  });

  if (window.initScrollAnimations) window.initScrollAnimations();
};

// ── Sidebar Logic ───────────────────────────────────────────────────────────
const renderSidebar = () => {
  if (!cart) {
    sidebar.style.display = "none";
    return;
  }
  
  const nights = getNightCount();
  const cin = checkIn.value.split("-").reverse().join("-");
  const cout = checkOut.value.split("-").reverse().join("-");
  
  // Pricing Math
  const baseRate = cart.price;
  const extraChildCost = Math.round(baseRate * 0.2) * cart.children;
  // Based on your screenshot, base room rent is just the base rate. We assume extra pax adds to room rent.
  const roomRentTotal = (baseRate + extraChildCost) * nights; 
  
  // 5% Tax calculation as shown in screenshot (238.09 on 4761.90)
  const tax = roomRentTotal * 0.05;
  
  // Calculate roundoff to nearest whole number
  const exactTotal = roomRentTotal + tax;
  const finalTotal = Math.round(exactTotal);
  let roundoff = finalTotal - exactTotal;
  const roundoffStr = (roundoff >= 0 ? "+ " : "- ") + Math.abs(roundoff).toFixed(2);
  
  sidebar.innerHTML = `
    <div class="sidebar-header">Booking Summary</div>
    <div class="sidebar-body">
      <div class="sb-dates"><strong>Dates</strong> ${cin} to ${cout}</div>
      
      <div class="sb-item-header">
        <strong>${escapeHtml(cart.abbreviation)}</strong>
        <button class="sb-remove" title="Remove Room">X</button>
      </div>
      
      <table class="sb-config-table">
        <thead>
          <tr><th>Room</th><th>Adult</th><th>Child</th><th>Extra</th></tr>
        </thead>
        <tbody>
          <tr><td>1</td><td>${cart.adults}</td><td>${cart.children}</td><td>${cart.extra}</td></tr>
        </tbody>
      </table>
      
      <div class="sb-price-details-toggle">Price Details <span class="caret">▲</span></div>
      
      <div class="sb-price-breakdown">
        <div class="sb-row total-rent-row">
          <strong>Total rent</strong>
          <strong>${formatRupeesRaw(roomRentTotal)}</strong>
        </div>
        <div class="sb-row sb-italic">
          <small>Type 1 - Room 1 : ${nights} days X ${formatRupeesRaw(baseRate + extraChildCost)}</small>
        </div>
        <div class="sb-row">
          <span>Room Rent</span>
          <span>${formatRupeesRaw(roomRentTotal)}</span>
        </div>
        <div class="sb-row">
          <span>Tax</span>
          <span>${formatRupeesRaw(tax)}</span>
        </div>
        <div class="sb-row">
          <span>Roundoff</span>
          <span>${roundoffStr}</span>
        </div>
      </div>
      
      <div class="sb-grand-total">
        <span>Total</span>
        <span>${finalTotal}.00/-</span>
      </div>
      
      <button class="sb-reserve-btn">RESERVE</button>
    </div>
  `;
  sidebar.style.display = "block";
  
  // Remove button
  sidebar.querySelector('.sb-remove').addEventListener('click', () => {
    cart = null;
    renderSidebar();
    renderRooms(); // Re-render to show "Book Room" button again
  });
  
  // Reserve button
  sidebar.querySelector('.sb-reserve-btn').addEventListener('click', () => {
    openCheckoutModal();
  });
};

// ── Checkout Modal ──────────────────────────────────────────────────────────
const openCheckoutModal = () => {
  document.querySelector("#selectedRoomType").value = cart.name;
  document.querySelector("#selectedCheckIn").value = checkIn.value;
  document.querySelector("#selectedCheckOut").value = checkOut.value;
  document.querySelector("#selectedRooms").value = 1;
  document.querySelector("#selectedAdults").value = cart.adults;
  document.querySelector("#selectedChildren").value = cart.children;

  overlay.style.display = "flex";
  document.body.style.overflow = "hidden";
};

const closeModal = () => {
  overlay.style.display = "none";
  document.body.style.overflow = "";
  formMessage.textContent = "";
  formMessage.classList.remove("error", "success");
};

if (closeBtn) closeBtn.addEventListener("click", closeModal);
if (overlay) overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

// Delegation for "Book Room" button on cards
if (grid) {
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".skyrooms-book-btn");
    if (!btn) return;
    const pid = btn.dataset.propertyId;
    const prop = propertiesCache.find(p => p.id === pid);
    const card = btn.closest(".skyrooms-card");
    
    cart = {
      id: prop.id,
      name: prop.name,
      abbreviation: prop.abbreviation,
      price: prop.price,
      adults: parseInt(card.querySelector('[data-role="adults"]').value, 10),
      children: parseInt(card.querySelector('[data-role="children"]').value, 10),
      extra: parseInt(card.querySelector('[data-role="extra"]').value, 10)
    };
    
    renderRooms();
    renderSidebar();
  });
}

// ── Form Submit ─────────────────────────────────────────────────────────────
if (bookingForm) {
  bookingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    formMessage.classList.remove("error", "success");

    const booking = {
      name: document.querySelector("#guestName").value.trim(),
      email: document.querySelector("#guestEmail").value.trim(),
      phone: document.querySelector("#guestPhone").value.trim(),
      room: cart.name,
      checkIn: checkIn.value,
      checkOut: checkOut.value,
      adults: cart.adults,
      children: cart.children,
      bookedAt: new Date().toISOString(),
    };

    localStorage.setItem("cloudNandyLatestBooking", JSON.stringify(booking));
    formMessage.classList.add("success");
    formMessage.textContent = `✅ Booking confirmed for ${booking.name}! We'll contact you on ${booking.phone} shortly.`;
    setTimeout(() => {
      closeModal();
      cart = null;
      renderRooms();
      renderSidebar();
      bookingForm.reset();
    }, 3000);
  });
}

// ── Init ────────────────────────────────────────────────────────────────────
(async () => {
  try {
    propertiesCache = await fetchProperties();
    renderRooms();
  } catch (err) {
    grid.innerHTML = `<p class="empty-list">Could not load rooms: ${escapeHtml(err.message)}</p>`;
  }
})();
"""

with open("outputs/booking.js", "w") as f:
    f.write(js_code)
