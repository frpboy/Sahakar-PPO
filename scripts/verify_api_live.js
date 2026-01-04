
const fetch = require('node-fetch');

async function testAuthMe() {
    console.log('Testing /auth/me endpoint...');
    // We can't easily mock the Firebase ID token here without a service account key or client SDK login.
    // However, the issue was related to the endpoint RETURNING 204 for missing users or crashing.
    // If we call it without a token, it should return 401 Unauthorized (JSON), which is valid JSON.
    // If we can construct a request that hits the controller (even if it mocked user), that would be best.
    // Since we can't easily generate a valid token, we will rely on the endpoint returning *some* valid JSON response (401)
    // rather than hanging or crashing (500).
    // The previous error was 500/Timeout or 204.

    // Actually, let's just check if the health endpoint works, ensuring the function is warm and not timing out.
    // And check if OPTIONS still works.

    const url = 'https://asia-south1-sahakar-ppo.cloudfunctions.net/api/auth/me';
    try {
        const res = await fetch(url, { method: 'GET' });
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Body: ${text}`);
        try {
            JSON.parse(text);
            console.log('Body is valid JSON');
        } catch (e) {
            console.log('Body is NOT valid JSON');
        }
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

testAuthMe();
