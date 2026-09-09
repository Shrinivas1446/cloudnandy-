import sys

with open("outputs/styles.css", "r") as f:
    lines = f.readlines()

start_idx = -1
for i, line in enumerate(lines):
    if "NATIVE BOOKING PAGE" in line:
        start_idx = i - 1
        break

if start_idx == -1:
    print("Could not find booking css section")
    sys.exit(1)

new_css = """
/* ═══════════════════════════════════════════════════════════════
   NATIVE BOOKING PAGE  — exact match of Skyrooms light layout
   ═══════════════════════════════════════════════════════════════ */
body.booking-page {
  background-color: #f5f2f0 !important;
  background-image: none !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
}

.native-booking-container {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 100px 20px 60px;
}

/* ── Availability Bar ── */
.availability-bar {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  padding: 20px;
  margin-bottom: 30px;
}
.availability-bar h3 {
  font-size: 1.1rem;
  font-weight: bold;
  color: #3b2616;
  margin: 0 0 16px 0;
  display: inline-block;
  border-bottom: 2px solid #5a4231;
  padding-bottom: 4px;
}
.availability-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}
.avail-field, .avail-field--small {
  flex: 1;
}
.avail-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  color: #333;
  font-size: 0.9rem;
  background: #fff;
}
.avail-check-btn {
  background: #e6cd85;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.avail-check-btn:hover { background: #d4b868; }

/* ── Cards ── */
.native-booking-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.skyrooms-card {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.skyrooms-title-bar {
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
}
.skyrooms-title-bar h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #3b2616;
  margin: 0;
}

.skyrooms-body {
  display: flex;
  padding: 20px;
  gap: 20px;
}

/* ── Left ── */
.skyrooms-left {
  flex: 0 0 260px;
}
.room-img-slider {
  position: relative;
  margin-bottom: 15px;
}
.room-slide-img {
  width: 100%;
  aspect-ratio: 16/10;
  object-fit: cover;
}
.skyrooms-facilities h4 {
  font-size: 0.95rem;
  color: #3b2616;
  font-weight: 600;
  border-bottom: 2px solid #5a4231;
  display: inline-block;
  margin: 0 0 15px 0;
  padding-bottom: 4px;
}
.facilities-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 5px;
}
.fac-lbl {
  font-size: 0.75rem;
  font-weight: bold;
  color: #555;
  text-transform: uppercase;
}

/* ── Right ── */
.skyrooms-right {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.std-badge-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}
.std-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: #3b2616;
  margin-right: 10px;
}
.std-badge-price {
  background: #3b2616;
  color: #fff;
  padding: 3px 10px;
  font-size: 0.85rem;
  font-weight: bold;
  border-radius: 4px;
  position: relative;
}
.std-badge-price::before {
  content: "";
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  border-width: 5px 6px 5px 0;
  border-style: solid;
  border-color: transparent #3b2616 transparent transparent;
}

/* Rate Table */
.skyrooms-rate-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  border: 1px solid #ccc;
  margin-bottom: 15px;
}
.skyrooms-rate-table th, .skyrooms-rate-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
  color: #333;
}
.skyrooms-rate-table th {
  background: #ffffff;
}

.skyrooms-tax-note {
  font-size: 0.75rem;
  color: #555;
  margin: 0 0 15px 0;
}

/* Info Bar */
.skyrooms-info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #eee;
  padding-top: 15px;
  margin-bottom: 15px;
}
.info-left {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 5px;
}
.info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #333;
  color: #fff;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 0.6rem;
}
.info-right {
  font-size: 0.85rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 15px;
}
.skyrooms-book-btn {
  background: #e6cd85;
  color: #fff;
  border: none;
  padding: 6px 15px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}
.skyrooms-book-btn:hover { background: #d4b868; }

/* Config Bar */
.skyrooms-config-bar {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  border: 1px solid #ddd;
}
.config-col {
  display: flex;
  flex-direction: column;
}
.config-col label {
  background: #ebd48e;
  color: #fff;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 5px;
  text-align: center;
  border-bottom: 1px solid #ddd;
  border-right: 1px solid #ddd;
}
.config-col:last-child label { border-right: none; }
.config-val, .skyrooms-select {
  padding: 8px;
  text-align: center;
  border: none;
  border-right: 1px solid #ddd;
  background: #fdfdfd;
  font-size: 0.85rem;
  color: #333;
}
.config-col:last-child .skyrooms-select { border-right: none; }
.skyrooms-select { outline: none; }

/* Modal */
.booking-form-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 9999;
}
.booking-form-modal {
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  position: relative;
}
.close-modal {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #555;
}

@media (max-width: 768px) {
  .skyrooms-body { flex-direction: column; }
  .skyrooms-left { flex: 0 0 auto; }
}
"""

with open("outputs/styles.css", "w") as f:
    f.writelines(lines[:start_idx])
    f.write(new_css)
