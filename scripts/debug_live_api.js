const https = require('https');
const { URL } = require('url');

const endpoint = 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api/ppo/import/upload';

function makeRequest(method, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint);
        const options = {
            method: method,
            headers: headers,
            hostname: url.hostname,
            path: url.pathname,
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.end();
    });
}

async function debug() {
    console.log(`Checking ${endpoint}...`);

    try {
        // 1. Check CORS (OPTIONS)
        console.log('\n--- 1. Testing OPTIONS request (CORS) ---');
        const optionsRes = await makeRequest('OPTIONS', {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
        });
        console.log('Status:', optionsRes.statusCode);
        console.log('Access-Control-Allow-Origin:', optionsRes.headers['access-control-allow-origin']);
        console.log('Access-Control-Allow-Methods:', optionsRes.headers['access-control-allow-methods']);
        console.log('Access-Control-Allow-Credentials:', optionsRes.headers['access-control-allow-credentials']);

        // 2. Check Health (POST without body should fail nicely, not 500)
        console.log('\n--- 2. Testing POST request (Health) ---');
        const postRes = await makeRequest('POST', {
            'Origin': 'http://localhost:3000',
        });
        console.log('Status:', postRes.statusCode);
        console.log('Body:', postRes.body);

    } catch (e) {
        console.error('Network Error:', e.message);
    }
}

debug();
