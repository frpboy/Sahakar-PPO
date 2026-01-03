const http = require('http');

const endpoints = [
    '/order-requests',
    '/pending-items',
    '/rep-items',
    '/order-slips',
    '/analysis/ledger'
];

async function checkEndpoint(path) {
    return new Promise((resolve) => {
        http.get({
            hostname: 'localhost',
            port: 3001,
            path: path,
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ path, status: res.statusCode, bodySummary: data.substring(0, 100) });
            });
        }).on('error', (err) => {
            resolve({ path, status: 'ERROR', error: err.message });
        });
    });
}

(async () => {
    console.log('Verifying API Endpoints...');
    for (const ep of endpoints) {
        const res = await checkEndpoint(ep);
        console.log(`${res.path}: ${res.status} ${res.status === 200 ? '✅' : '❌'}`);
        if (res.status !== 200) console.log('  Error:', res.bodySummary || res.error);
    }
})();
