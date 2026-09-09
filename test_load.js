const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync("outputs/index.html", "utf8");

// Mock window.supabase to avoid cdn download
const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (e) => { console.error("JS Error:", e); });
virtualConsole.on("log", (m) => { console.log("JS Log:", m); });
virtualConsole.on("warn", (m) => { console.warn("JS Warn:", m); });

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable",
  virtualConsole
});
