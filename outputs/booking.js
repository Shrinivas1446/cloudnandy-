const roomRates = {};
const supabaseConfig = window.CLOUD_NANDY_SUPABASE;
const supabaseClient =
  window.supabase && supabaseConfig
    ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.key)
    : null;

const today = new Date();
today.setHours(0, 0, 0, 0);

const dateToInputValue = (date) => date.toISOString().split("T")[0];

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

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
  guests_allowed: property.guests_allowed,
  check_in: property.check_in,
  check_out: property.check_out,
  image_urls: (property.image_urls && property.image_urls.length)
    ? property.image_urls
    : [property.image_url || property.image].filter(Boolean),
  image: property.image_url || (property.image_urls && property.image_urls[0]) || property.image,
  image_url: property.image_url || (property.image_urls && property.image_urls[0]) || property.image,
  createdAt: property.created_at || property.createdAt,
});

const fetchProperties = async () => {
  if (!supabaseClient) throw new Error("Supabase is not configured.");

  const { data, error } = await supabaseClient
    .from(supabaseConfig.table)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(normalizeProperty);
};

const checkIn = document.querySelector("#checkIn");
const checkOut = document.querySelector("#checkOut");
const roomType = document.querySelector("#roomType");
const guests = document.querySelector("#guests");
const summaryNights = document.querySelector("#summaryNights");
const summaryTotal = document.querySelector("#summaryTotal");
const formMessage = document.querySelector("#formMessage");
const bookingForm = document.querySelector("#bookingForm");
const bookingPropertyGrid = document.querySelector("#bookingPropertyGrid");
const params = new URLSearchParams(window.location.search);

const defaultCheckIn = addDays(today, 1);
const defaultCheckOut = addDays(today, 2);

const addRoomOptions = (properties) => {
  roomType.innerHTML = "";

  if (!properties.length) {
    roomType.innerHTML = '<option value="">No Supabase properties found</option>';
    return;
  }

  properties.forEach((property) => {
    roomRates[property.name] = Number(property.price);
    const option = document.createElement("option");
    option.value = property.name;
    option.textContent = `${property.name} - ${formatRupees(property.price)}/night`;
    roomType.append(option);
  });
};

const updateSelectedPropertyCard = () => {
  document.querySelectorAll("[data-booking-property]").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.propertyName === roomType.value);
  });
};

const truncateText = (text, maxLength) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

const renderBookingProperties = (properties) => {
  bookingPropertyGrid.innerHTML = "";

  if (!properties.length) {
    bookingPropertyGrid.innerHTML =
      '<p class="empty-list">No properties found in Supabase. Add one from the admin panel.</p>';
    return;
  }

  bookingPropertyGrid.innerHTML = properties
    .map(
      (property, i) => `
        <article class="booking-property-card" data-reveal data-delay="${Math.min(i, 5)}" tabindex="0" role="button" aria-pressed="false" data-property-id="${escapeHtml(
          property.id,
        )}">
          <a href="#" class="lightbox-trigger" data-images="${escapeHtml(JSON.stringify(property.image_urls || [property.image]))}" data-index="0">
            <img src="${property.image}" alt="${escapeHtml(property.name)}" />
          </a>
          <div>
            <span>${escapeHtml(property.type || "Room")}</span>
            <h3>${escapeHtml(property.name)}</h3>
            <p>${escapeHtml(truncateText(property.description, 100))}</p>
            <div class="booking-card-footer">
              <div class="booking-card-price">
                <strong>${formatRupees(property.price)}/night</strong>
                <button class="text-button" type="button" data-property-select="${escapeHtml(
                  property.name,
                )}">Select</button>
              </div>
              <div class="booking-card-thumbs">
                ${(property.image_urls || [property.image]).slice(0, 3).map((url, idx) => `
                  <a href="#" class="lightbox-trigger" data-images="${escapeHtml(JSON.stringify(property.image_urls || [property.image]))}" data-index="${idx}">
                    <img src="${url}" alt="Room preview" />
                  </a>
                `).join('')}
                ${(property.image_urls || []).length > 3 ? `<span class="more-thumbs">+${property.image_urls.length - 3}</span>` : ''}
              </div>
            </div>
          </div>
        </article>
      `,
    )
    .join("");

  if (window.initScrollAnimations) window.initScrollAnimations();

  updateSelectedPropertyCard();
};

const getNightCount = () => {
  const start = new Date(`${checkIn.value}T00:00:00`);
  const end = new Date(`${checkOut.value}T00:00:00`);
  const diff = Math.round((end - start) / 86400000);
  return Math.max(diff, 1);
};

const updateSummary = () => {
  const nights = getNightCount();
  const rate = roomRates[roomType.value] || 0;
  summaryNights.textContent = String(nights);
  summaryTotal.textContent = formatRupees(nights * rate);
  updateSelectedPropertyCard();
};

const syncCheckoutMinimum = () => {
  const selectedCheckIn = new Date(`${checkIn.value}T00:00:00`);
  const minCheckout = addDays(selectedCheckIn, 1);
  checkOut.min = dateToInputValue(minCheckout);

  if (new Date(`${checkOut.value}T00:00:00`) <= selectedCheckIn) {
    checkOut.value = dateToInputValue(minCheckout);
  }

  updateSummary();
};

checkIn.min = dateToInputValue(today);
checkIn.value = params.get("checkIn") || dateToInputValue(defaultCheckIn);
checkOut.min = dateToInputValue(addDays(defaultCheckIn, 1));
checkOut.value = params.get("checkOut") || dateToInputValue(defaultCheckOut);
guests.value = params.get("guests") || "2";

checkIn.addEventListener("change", syncCheckoutMinimum);
checkOut.addEventListener("change", updateSummary);
roomType.addEventListener("change", updateSummary);
guests.addEventListener("change", updateSummary);

bookingPropertyGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-property-select]");

  if (button) {
    roomType.value = button.dataset.propertySelect;
    updateSummary();
    bookingForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.classList.remove("error");

  if (!roomType.value) {
    formMessage.textContent = "Please add/select a Supabase property before booking.";
    formMessage.classList.add("error");
    return;
  }

  const start = new Date(`${checkIn.value}T00:00:00`);
  const end = new Date(`${checkOut.value}T00:00:00`);

  if (end <= start) {
    formMessage.textContent = "Please choose a check-out date after check-in.";
    formMessage.classList.add("error");
    return;
  }

  const booking = {
    name: document.querySelector("#guestName").value.trim(),
    email: document.querySelector("#guestEmail").value.trim(),
    checkIn: checkIn.value,
    checkOut: checkOut.value,
    room: roomType.value,
    guests: guests.value,
    requests: document.querySelector("#requests").value.trim(),
    nights: getNightCount(),
    total: summaryTotal.textContent,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem("cloudNandyLatestBooking", JSON.stringify(booking));
  formMessage.textContent = `Booking confirmed for ${booking.name}. ${booking.room}, ${booking.nights} night(s), ${booking.total}.`;
  bookingForm.reset();
  checkIn.value = booking.checkIn;
  checkOut.value = booking.checkOut;
  roomType.value = booking.room;
  guests.value = booking.guests;
  updateSummary();
});

const initializeBookingPage = async () => {
  try {
    const properties = await fetchProperties();
    addRoomOptions(properties);
    renderBookingProperties(properties);

    if (params.get("room") && roomRates[params.get("room")]) {
      roomType.value = params.get("room");
    }

    syncCheckoutMinimum();
  } catch (error) {
    roomType.innerHTML = '<option value="">Unable to load Supabase properties</option>';
    bookingPropertyGrid.innerHTML = `<p class="empty-list">Unable to load Supabase properties. ${escapeHtml(
      error.message,
    )}</p>`;
    updateSummary();
  }
};

initializeBookingPage();
