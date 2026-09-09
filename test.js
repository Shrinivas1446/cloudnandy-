const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('c:/Users/matha/Downloads/cloudnandy/outputs/index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously' });
dom.window.supabaseClient = {
  from: () => ({ select: () => ({ order: () => Promise.resolve({ data: [] }) }) })
};
dom.window.CLOUD_NANDY_SUPABASE = { table: 'rooms' };
const scriptContent = fs.readFileSync('c:/Users/matha/Downloads/cloudnandy/outputs/script.js', 'utf8');

// Catch any errors that happen on window
dom.window.addEventListener('error', (event) => {
  console.error("Window Error:", event.error);
});
dom.window.addEventListener('unhandledrejection', (event) => {
  console.error("Unhandled Promise Rejection:", event.reason);
});

const scriptEl = dom.window.document.createElement('script');
scriptEl.textContent = scriptContent;
dom.window.document.body.appendChild(scriptEl);

setTimeout(() => {
  console.log('Weather temp text:', dom.window.document.querySelector('#weatherTemp').textContent);
  console.log('Weather condition text:', dom.window.document.querySelector('#weatherCondition').textContent);
}, 2000);
