const fs = require('fs');
const src = fs.readFileSync('outputs/booking2.js','utf8');

// Fake DOM stubs 
global.window = {
  CLOUD_NANDY_SUPABASE: { url: '', key: '', table: 'properties' },
  supabase: { createClient: () => ({
    from: () => ({ select: () => ({ order: async () => ({ data: [], error: null }) }) })
  }) },
  location: { search: '' }
};
const elStub = () => ({
  value: '', style: {}, classList: { toggle: ()=>{} },
  addEventListener: ()=>{},
  querySelectorAll: ()=>[],
  querySelector: ()=> elStub(),
  innerHTML: '',
});
global.location = window.location;
global.document = {
  getElementById: ()=> elStub(),
  addEventListener: ()=>{},
  body: { style: {} },
};
global.localStorage = { setItem: ()=>{} };

try {
  eval(src);
  console.log('No errors!');
} catch(e) {
  console.error('Error:', e.message, e.stack);
}
