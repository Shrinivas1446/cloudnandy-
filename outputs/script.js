const API_BASE = window.CLOUD_NANDY_API_BASE || "https://cloud-nandy-api.onrender.com";

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
  image_urls: property.image_urls?.length
    ? property.image_urls
    : [property.image_url || property.image].filter(Boolean),
  image: property.image_url || property.image_urls?.[0] || property.image,
  image_url: property.image_url || property.image_urls?.[0] || property.image,
  createdAt: property.created_at || property.createdAt,
});

const fetchProperties = async () => {
  const response = await fetch(`${API_BASE}/api/properties`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.map(normalizeProperty);
};

const quickBookingForm = document.querySelector("#quickBookingForm");
const quickCheckIn = document.querySelector("#quickCheckIn");
const quickCheckOut = document.querySelector("#quickCheckOut");
const quickGuests = document.querySelector("#quickGuests");
const roomGrid = document.querySelector(".room-grid");
const weatherTemp = document.querySelector("#weatherTemp");
const weatherCondition = document.querySelector("#weatherCondition");
const weatherMeta = document.querySelector("#weatherMeta");

const defaultCheckIn = addDays(today, 1);
const defaultCheckOut = addDays(today, 2);

[quickCheckIn].forEach((input) => {
  input.min = dateToInputValue(today);
  input.value = dateToInputValue(defaultCheckIn);
});

[quickCheckOut].forEach((input) => {
  input.min = dateToInputValue(addDays(defaultCheckIn, 1));
  input.value = dateToInputValue(defaultCheckOut);
});

const buildBookingUrl = (params = {}) => {
  const url = new URL("./booking.html", window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });
  return url.toString();
};

const renderPublicUploadedProperties = async () => {
  roomGrid.innerHTML = '<p class="empty-list">Loading properties from Supabase...</p>';

  try {
    const properties = await fetchProperties();

    if (!properties.length) {
      roomGrid.innerHTML =
        '<p class="empty-list">No properties found in Supabase. Add one from the admin panel.</p>';
      return;
    }

    roomGrid.innerHTML = properties
      .map(
        (property) => `
          <article class="room-card" data-room-card data-room="${escapeHtml(property.name)}">
            <a href="./property.html?id=${property.id}">
              <img src="${property.image}" alt="${escapeHtml(property.name)}" />
            </a>
            <div class="room-body">
              <div>
                <a href="./property.html?id=${property.id}">
                  <h3>${escapeHtml(property.name)}</h3>
                </a>
                <p>${escapeHtml(property.description)}</p>
                <p>${property.image_urls.length} image(s)</p>
              </div>
              <div class="room-meta">
                <span>${formatRupees(property.price)}/night</span>
                <div class="room-card-actions">
                  <a class="text-button" href="./property.html?id=${property.id}">Details</a>
                  <button class="text-button" type="button" data-room-select="${escapeHtml(
                    property.name,
                  )}">
                    Select
                  </button>
                </div>
              </div>
            </div>
          </article>
        `,
      )
      .join("");
  } catch (error) {
    roomGrid.innerHTML = `<p class="empty-list">Unable to load Supabase properties. ${escapeHtml(
      error.message,
    )}</p>`;
  }
};

const weatherLabels = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with hail",
};

const getWeatherTheme = (code) => {
  if ([0, 1].includes(code)) return "weather-clear";
  if ([2, 3].includes(code)) return "weather-cloudy";
  if ([45, 48].includes(code)) return "weather-misty";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) {
    return "weather-rainy";
  }
  return "weather-cloudy";
};

const applyWeatherTheme = (theme) => {
  document.body.classList.remove(
    "weather-clear",
    "weather-cloudy",
    "weather-rainy",
    "weather-misty",
  );
  document.body.classList.add(theme);
};

const getTemperatureTheme = (temperature) => {
  if (temperature < 16) return "temp-cool";
  if (temperature < 23) return "temp-mild";
  if (temperature < 29) return "temp-warm";
  return "temp-hot";
};

const applyTemperatureTheme = (temperature) => {
  document.body.classList.remove("temp-cool", "temp-mild", "temp-warm", "temp-hot");
  document.body.classList.add(getTemperatureTheme(temperature));
};

const loadKodaikanalWeather = async () => {
  const url =
    "https://api.open-meteo.com/v1/forecast?latitude=10.2381&longitude=77.4892&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=Asia%2FKolkata";

  applyWeatherTheme("weather-cloudy");
  applyTemperatureTheme(20);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Weather service unavailable");
    }

    const data = await response.json();
    const current = data.current;
    const code = Number(current.weather_code);
    const temperature = Math.round(Number(current.temperature_2m));
    const condition = weatherLabels[code] || "Pleasant hill weather";

    weatherTemp.textContent = `${temperature}\u00B0C`;
    weatherCondition.textContent = condition;
    weatherMeta.textContent = `Humidity ${current.relative_humidity_2m}% | Wind ${Math.round(
      Number(current.wind_speed_10m),
    )} km/h`;
    applyWeatherTheme(getWeatherTheme(code));
    applyTemperatureTheme(temperature);
  } catch {
    weatherTemp.textContent = "Kodaikanal";
    weatherCondition.textContent = "Weather unavailable";
    weatherMeta.textContent = "Hero animation is using the default cloudy theme";
    applyWeatherTheme("weather-cloudy");
    applyTemperatureTheme(20);
  }
};

quickCheckIn.addEventListener("change", () => {
  const selectedCheckIn = new Date(`${quickCheckIn.value}T00:00:00`);
  const minCheckout = addDays(selectedCheckIn, 1);
  quickCheckOut.min = dateToInputValue(minCheckout);

  if (new Date(`${quickCheckOut.value}T00:00:00`) <= selectedCheckIn) {
    quickCheckOut.value = dateToInputValue(minCheckout);
  }
});

quickBookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  window.location.href = buildBookingUrl({
    checkIn: quickCheckIn.value,
    checkOut: quickCheckOut.value,
    guests: quickGuests.value,
  });
});

roomGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-room-select]");

  if (button) {
    window.location.href = buildBookingUrl({ room: button.dataset.roomSelect });
  }
});

renderPublicUploadedProperties();
loadKodaikanalWeather();
