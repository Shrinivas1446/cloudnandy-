import sys

with open("outputs/booking.html", "r") as f:
    booking_html = f.read()

# Extract the booking section
start_token = '<section class="section booking-page-section">'
end_token = '</section>'
start_idx = booking_html.find(start_token)
end_idx = booking_html.find(end_token, start_idx) + len(end_token)

if start_idx == -1 or end_idx == -1:
    print("Could not find booking section")
    sys.exit(1)

booking_section = booking_html[start_idx:end_idx]
booking_section = booking_section.replace('<section class="section booking-page-section">', '<section id="booking-section" class="section booking-page-section" style="background:#f5f2f0;">\n<div style="text-align:center; padding-top:40px;"><h2>Book Your Stay</h2><p>Select your dates and room configuration below.</p></div>')

with open("outputs/index.html", "r") as f:
    index_html = f.read()

# Replace links
index_html = index_html.replace('href="./booking.html"', 'href="#booking-section"')

# Inject booking section before <section id="rooms"
insert_token = '<section id="rooms"'
insert_idx = index_html.find(insert_token)
if insert_idx == -1:
    print("Could not find rooms section")
    sys.exit(1)

index_html = index_html[:insert_idx] + booking_section + "\n\n    " + index_html[insert_idx:]

# Inject scripts
script_token = '<script src="./animations.js?v=4"></script>'
script_idx = index_html.find(script_token)
if script_idx == -1:
    script_token = '<script src="./animations.js'
    script_idx = index_html.find(script_token)

scripts_to_add = """<script src="./supabase-config.js?v=4"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="./booking.js?v=4"></script>
    """

if script_idx != -1:
    index_html = index_html[:script_idx] + scripts_to_add + index_html[script_idx:]
else:
    # Append before </body>
    body_idx = index_html.find("</body>")
    index_html = index_html[:body_idx] + scripts_to_add + index_html[body_idx:]

with open("outputs/index.html", "w") as f:
    f.write(index_html)
