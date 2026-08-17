const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const SECRET_KEY = "Telugumovies40SuperSecretKey";

// -------------------------------------------------------------
// 1. PUBLIC VERIFICATION GATEWAY (No OTP / Dynamic Challenge)
// -------------------------------------------------------------
app.get('/verify', (req, res) => {
    const { target, hash, img, title, bot } = req.query;

    if (!target || !hash) {
        return res.status(400).send("<h3>Access Denied: Missing Parameters</h3>");
    }

    // Security Token Integrity Check (No-Expiry Logic)
    const expectedHash = crypto.createHash('sha256').update(`${target}:${SECRET_KEY}`).digest('hex').substring(0, 16);
    if (hash !== expectedHash) {
        return res.status(403).send("<h2 style='color:red;text-align:center;'>Access Denied: Invalid Security Token</h2>");
    }

    const decodedTarget = Buffer.from(target, 'base64').toString('utf-8');
    const bannerImg = img || 'https://graph.org/file/925353b8e2c361e2af374-6341ee2574a1957000.jpg';
    const channelTitle = title || 'Telugumovies40';
    const redirectUrl = bot ? `https://t.me/${bot}?start=${decodedTarget}` : decodedTarget;

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${channelTitle} - Verification Gateway</title>
            <style>
                body { background-color: #0d1117; color: #ffffff; font-family: sans-serif; text-align: center; padding: 20px; margin:0; }
                .card { background: #161b22; border: 1px solid #30363d; border-radius: 12px; max-width: 400px; margin: 40px auto; padding: 25px; box-shadow: 0 8px 24px rgba(0,0,0,0.6); }
                .banner-img { width: 100%; border-radius: 8px; margin-bottom: 15px; }
                .brand-title { color: #f0a500; font-size: 26px; font-weight: bold; margin-bottom: 8px; }
                .loader { border: 4px solid #30363d; border-top: 4px solid #f0a500; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .status-text { font-size: 14px; color: #8b949e; margin-top: 15px; }
            </style>
            <script>
                setTimeout(function() {
                    document.getElementById('status').innerText = 'Verification Successful! Redirecting...';
                    window.location.href = "${redirectUrl}";
                }, 4000);
            </script>
        </head>
        <body>
            <div class="card">
                <img src="${bannerImg}" class="banner-img" alt="${channelTitle}">
                <div class="brand-title">🎬 ${channelTitle}</div>
                <p style="color:#c9d1d9; font-size: 14px;">Checking Security Parameters...</p>
                <div class="loader"></div>
                <div id="status" class="status-text">Verifying real user request (4s)...</div>
            </div>
        </body>
        </html>
    `);
});

// -------------------------------------------------------------
// 2. WEB ADMIN DASHBOARD
// -------------------------------------------------------------
app.get('/admin', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Telugumovies40 - Admin Dashboard</title>
            <style>
                body { background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 20px; margin: 0; }
                .container { max-width: 550px; margin: auto; background: #1e293b; padding: 30px; border-radius: 12px; border: 1px solid #334155; }
                h2 { color: #38bdf8; text-align: center; margin-bottom: 25px; margin-top:0; }
                label { font-size: 14px; color: #94a3b8; display: block; margin-top: 15px; }
                input, select { width: 100%; padding: 12px; margin-top: 5px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 6px; box-sizing: border-box; }
                button { width: 100%; margin-top: 25px; padding: 14px; background: #0284c7; color: white; font-weight: bold; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; }
                button:hover { background: #0369a1; }
                .result-box { margin-top: 25px; background: #0f172a; padding: 15px; border-radius: 6px; border: 1px solid #0284c7; display: none; word-break: break-all; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>🎬 Telugumovies40 Control Panel</h2>
                
                <label>Select Shortener</label>
                <select id="shortener">
                    <option value="gplinks">GPLinks</option>
                    <option value="vplinks">VPLinks</option>
                </select>

                <label>Shortener API Key</label>
                <input type="text" id="apiKey" placeholder="Paste GPLinks or VPLinks API Key">

                <label>Target File ID / Destination Link</label>
                <input type="text" id="target" placeholder="e.g. file_123 or https://t.me/yourfile">

                <label>Telegram Bot Username (Optional)</label>
                <input type="text" id="botUsername" placeholder="e.g. Telugumovies40_Bot">

                <label>Custom Banner Image URL</label>
                <input type="text" id="bannerUrl" value="https://graph.org/file/925353b8e2c361e2af374-6341ee2574a1957000.jpg">

                <button onclick="generateLink()">🚀 Generate Anti-Bypass Link</button>

                <div id="result" class="result-box">
                    <strong style="color:#38bdf8;">Shortened Protected Link:</strong><br><br>
                    <a id="shortLink" href="#" target="_blank" style="color:#4ade80;"></a>
                </div>
            </div>

            <script>
                async function generateLink() {
                    const shortener = document.getElementById('shortener').value;
                    const apiKey = document.getElementById('apiKey').value;
                    const target = document.getElementById('target').value;
                    const bot = document.getElementById('botUsername').value;
                    const img = document.getElementById('bannerUrl').value;

                    if (!apiKey || !target) {
                        alert("API Key and Target Link are required!");
                        return;
                    }

                    const res = await fetch('/api/create-link', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ shortener, apiKey, target, bot, img })
                    });

                    const data = await res.json();
                    if (data.success) {
                        document.getElementById('result').style.display = 'block';
                        const a = document.getElementById('shortLink');
                        a.href = data.shortUrl;
                        a.innerText = data.shortUrl;
                    } else {
                        alert("Error: " + data.message);
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// -------------------------------------------------------------
// 3. API ROUTE TO CONNECT GPLINKS / VPLINKS
// -------------------------------------------------------------
app.post('/api/create-link', async (req, res) => {
    try {
        const { shortener, apiKey, target, bot, img } = req.body;
        
        const encodedTarget = Buffer.from(target).toString('base64');
        const hash = crypto.createHash('sha256').update(`${encodedTarget}:${SECRET_KEY}`).digest('hex').substring(0, 16);

        const host = req.get('host');
        const protocol = req.protocol;
        
        let verifyUrl = `${protocol}://${host}/verify?target=${encodedTarget}&hash=${hash}`;
        if (img) verifyUrl += `&img=${encodeURIComponent(img)}`;
        if (bot) verifyUrl += `&bot=${bot}`;

        let shortenerApiUrl = "";
        if (shortener === "gplinks") {
            shortenerApiUrl = `https://gplinks.in/api?api=${apiKey}&url=${encodeURIComponent(verifyUrl)}`;
        } else if (shortener === "vplinks") {
            shortenerApiUrl = `https://vplink.in/api?api=${apiKey}&url=${encodeURIComponent(verifyUrl)}`;
        }

        const apiResponse = await axios.get(shortenerApiUrl);
        if (apiResponse.data && (apiResponse.data.shortenedUrl || apiResponse.data.url)) {
            return res.json({
                success: true,
                shortUrl: apiResponse.data.shortenedUrl || apiResponse.data.url
            });
        }

        return res.json({ success: false, message: "Shortener API failed to respond." });
    } catch (err) {
        return res.json({ success: false, message: err.message });
    }
});

app.listen(PORT, () => console.log(`✅ Telugumovies40 System Active on Port ${PORT}`));
