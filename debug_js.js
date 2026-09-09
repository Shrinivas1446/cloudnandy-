const jsCode = require('fs').readFileSync('outputs/booking.js', 'utf8');

global.window = {
    location: { search: '' },
    CLOUD_NANDY_SUPABASE: { url: '', key: '' },
    supabase: { createClient: () => ({ from: () => ({ select: () => ({ order: async () => ({ data: [], error: null }) }) }) }) }
};
global.document = {
    querySelector: (sel) => {
        return {
            value: '',
            addEventListener: () => {},
            style: {},
            classList: { remove: () => {}, add: () => {} }
        };
    },
    querySelectorAll: () => [],
    addEventListener: () => {}
};

try {
    eval(jsCode);
    console.log("No syntax/initialization errors!");
} catch (e) {
    console.error("Error during execution:");
    console.error(e);
}
