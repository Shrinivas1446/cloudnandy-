import sys

with open("outputs/styles.css", "r") as f:
    lines = f.readlines()

# Find where the native booking page css starts
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
   NATIVE BOOKING PAGE  — matches Cloud Nandy home page design
   Uses: --paper, --white, --ink, --muted, --forest, --accent,
         --line, --shadow, --body-font
   ═══════════════════════════════════════════════════════════════ */

/* ── Page container ──────────────────────────────────────────── */
.native-booking-container {
  width: min(1060px, calc(100% - 48px));
  margin: 0 auto;
  padding: 110px 0 80px;
}

/* ── Availability Bar ─────────────────────────────────────────── */
.availability-bar {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 20px 24px;
  margin-bottom: 28px;
  box-shadow: var(--shadow);
  position: sticky;
  top: 74px;
  z-index: 80;
}
.availability-bar h3 {
  font-family: var(--display-font);
  font-size: 1rem;
  font-weight: 700;
  color: var(--forest);
  margin: 0 0 4px;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.availability-bar h3::after {
  content: "";
  display: block;
  width: 36px;
  height: 2px;
  background: var(--accent);
  margin-top: 5px;
  margin-bottom: 14px;
}
.availability-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
.avail-field { flex: 1; min-width: 130px; }
.avail-field--small { flex: 0 0 80px; min-width: 60px; }
.avail-input {
  width: 100%;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 10px 14px;
  color: var(--ink);
  font-size: 0.88rem;
  font-family: var(--body-font);
  outline: none;
  transition: border-color .2s;
}
.avail-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(180,95,60,.08); }
.avail-check-btn {
  background: var(--accent);
  color: var(--white);
  border: none;
  border-radius: 6px;
  padding: 11px 22px;
  font-weight: 800;
  font-size: 0.88rem;
  font-family: var(--body-font);
  cursor: pointer;
  white-space: nowrap;
  transition: background .2s, transform .15s;
}
.avail-check-btn:hover { background: var(--accent-dark); transform: translateY(-1px); }
.avail-check-btn.w-full { width: 100%; }

/* ── Loading ──────────────────────────────────────────────────── */
.booking-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px;
  color: var(--muted);
  gap: 16px;
  font-family: var(--body-font);
}
.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(180,95,60,0.15);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: nb-spin .8s linear infinite;
}
@keyframes nb-spin { to { transform: rotate(360deg); } }

/* ── Room card (Clean UI) ─────────────────────────────────────── */
.native-booking-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.room-booking-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(31,59,51,0.05);
  display: flex;
  transition: box-shadow .22s, transform .22s;
}
.room-booking-card:hover {
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}

/* ── Left Image ────────────────────────────────────────────────── */
.room-booking-left {
  flex: 0 0 340px;
  position: relative;
  background: #f0ece1;
}
.room-img-slider {
  height: 100%;
  position: relative;
}
.room-slide-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.slider-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(31,59,51,0.55);
  color: #fff;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: background .2s;
  margin: 0 8px;
}
.slider-btn:hover { background: var(--accent); }
.slider-prev { left: 0; }
.slider-next { right: 0; }

/* ── Right Content ─────────────────────────────────────────────── */
.room-booking-right {
  flex: 1;
  padding: 28px;
  display: flex;
  flex-direction: column;
}

.room-booking-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 16px;
}
.room-booking-header h3 {
  font-family: var(--display-font);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 4px;
}
.room-subtitle {
  color: var(--muted);
  font-size: 0.85rem;
  margin: 0;
}

.room-price-block {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.price-label {
  font-size: 0.75rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .05em;
  font-weight: 600;
}
.price-amount {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--forest);
  line-height: 1.2;
}
.price-night {
  font-size: 0.8rem;
  color: var(--muted);
}

.room-facilities-clean {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}
.fac-badge {
  background: var(--paper);
  border: 1px solid var(--line);
  color: var(--forest);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
}

.room-config-row {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--paper);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.config-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
.config-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ink);
}
.clean-select {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 6px 12px;
  font-family: var(--body-font);
  font-size: 0.85rem;
  color: var(--ink);
  outline: none;
  cursor: pointer;
}
.clean-select:focus { border-color: var(--accent); }
.tax-info-text {
  font-size: 0.75rem;
  color: var(--muted);
  margin: 0;
  margin-left: auto;
}

.room-action-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}
.room-availability-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--ink);
  font-weight: 600;
}
.status-dot {
  width: 8px;
  height: 8px;
  background: #27ae60;
  border-radius: 50%;
}
.book-room-btn {
  background: var(--accent);
  color: var(--white);
  border: none;
  border-radius: 6px;
  padding: 12px 32px;
  font-weight: 800;
  font-size: 0.95rem;
  font-family: var(--body-font);
  cursor: pointer;
  transition: background .2s, transform .15s;
}
.book-room-btn:hover { background: var(--accent-dark); transform: translateY(-2px); }

/* ── Booking Modal ───────────────────────────────────────────── */
.booking-form-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10,20,15,0.7);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.booking-form-modal {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 36px;
  width: 100%;
  max-width: 540px;
  position: relative;
  box-shadow: var(--shadow-strong);
  max-height: 90vh;
  overflow-y: auto;
}
.close-modal {
  position: absolute;
  top: 14px;
  right: 18px;
  background: none;
  border: none;
  color: var(--muted);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}
.close-modal:hover { color: var(--ink); }
.modal-header h2 {
  margin: 0 0 6px;
  font-family: var(--display-font);
  font-size: 1.4rem;
  color: var(--forest);
}
.modal-summary { color: var(--muted); font-size: 0.88rem; margin: 0 0 20px; }

/* Native form */
.native-form { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { display: flex; flex-direction: column; gap: 5px; }
.form-group label { font-size: 0.78rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
.native-form .form-input,
.native-form textarea {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 6px;
  color: var(--ink);
  padding: 10px 14px;
  font-size: 0.88rem;
  font-family: var(--body-font);
  outline: none;
  transition: border-color .2s, box-shadow .2s;
  resize: vertical;
  width: 100%;
}
.native-form .form-input:focus,
.native-form textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(180,95,60,.1);
}

/* Price summary block */
.booking-price-summary {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
  font-size: 0.82rem;
}
.price-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  color: var(--muted);
}
.total-row {
  border-top: 1px solid var(--line);
  margin-top: 8px;
  padding-top: 10px !important;
  font-weight: 800 !important;
  color: var(--accent) !important;
  font-size: 1rem;
}

/* form message */
.form-message {
  font-size: 0.82rem;
  text-align: center;
  padding: 10px;
  border-radius: 6px;
  margin: 0;
}
.form-message.error { color: #c0392b; background: rgba(192,57,43,.08); }
.form-message.success { color: #27ae60; background: rgba(39,174,96,.08); }

/* ── Responsive ───────────────────────────────────────────────── */
@media (max-width: 800px) {
  .room-booking-card { flex-direction: column; }
  .room-booking-left { flex: 0 0 240px; max-width: 100%; }
  .room-booking-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .room-price-block { text-align: left; align-items: flex-start; }
  .tax-info-text { margin-left: 0; width: 100%; }
}
@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
  .native-booking-container { padding-top: 90px; }
  .availability-bar { top: 60px; }
}
"""

with open("outputs/styles.css", "w") as f:
    f.writelines(lines[:start_idx])
    f.write(new_css)
