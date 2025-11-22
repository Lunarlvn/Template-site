const express = require('express');
const path = require('path');
const axios = require('axios');
const { URLSearchParams } = require('url');
const dotenv = require('dotenv');
// Try to load .env explicitly from project root
dotenv.config({ path: path.join(__dirname, '.env') });

// Normalize env keys: handle cases where .env had a BOM (\uFEFF) or invisible chars in keys
Object.keys(process.env).forEach(key => {
    // if key contains BOM at start, create normalized key without BOM
    const normalized = key.replace(/^\uFEFF/, '').trim();
    if (normalized !== key && !(normalized in process.env)) {
        process.env[normalized] = process.env[key];
    }
});

// Mask helper for logs
function mask(value) {
    if (!value) return '<EMPTY>';
    if (value.length <= 6) return '****';
    return value.slice(0, 3) + '...' + value.slice(-3);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Serve a simple SVG favicon at /favicon.ico to avoid 404 errors
app.get('/favicon.ico', (req, res) => {
        res.type('image/svg+xml');
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
            <defs>
                <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stop-color="#3b82f6" />
                    <stop offset="1" stop-color="#8b5cf6" />
                </linearGradient>
            </defs>
            <rect width="64" height="64" rx="12" fill="url(#g)"/>
            <text x="50%" y="50%" text-anchor="middle" dy=".1em" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="#fff">W</text>
        </svg>`;
        res.send(svg);
});

// Read config from environment for safety
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI; // e.g. http://localhost:3000/auth/callback

if (!DISCORD_CLIENT_ID || !DISCORD_REDIRECT_URI) {
    console.warn('Warning: DISCORD_CLIENT_ID and DISCORD_REDIRECT_URI should be set in a .env file');
}

// Startup debug (masked) to confirm env vars loaded
console.log('Loaded DISCORD env: ', {
    DISCORD_CLIENT_ID: mask(DISCORD_CLIENT_ID),
    DISCORD_CLIENT_SECRET: mask(DISCORD_CLIENT_SECRET),
    DISCORD_REDIRECT_URI: DISCORD_REDIRECT_URI ? DISCORD_REDIRECT_URI : '<EMPTY>'
});

// Route to start OAuth login (builds redirect URL)
app.get('/auth/login', (req, res) => {
    const params = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID || '',
        redirect_uri: DISCORD_REDIRECT_URI || '',
        response_type: 'code',
        scope: 'identify email guilds'
    });
    res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

// OAuth2 callback - exchange code server-side for tokens and fetch user
app.get('/auth/callback', (req, res) => {
    const { code, error } = req.query;
    if (error) {
        console.error('Discord OAuth error (callback):', error);
        return res.redirect('/?error=discord_auth_failed');
    }
    if (!code) return res.redirect('/?error=no_code');

    // Redirect back to the frontend with the code so the frontend can call /auth/exchange
    return res.redirect('/?code=' + encodeURIComponent(code));
});

// Exchange code for token and return user + guilds (so frontend can show servers)
// Exchange code for tokens and return user + guilds
app.post('/auth/exchange', async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'code_required' });

        const body = new URLSearchParams();
        body.append('client_id', DISCORD_CLIENT_ID);
        body.append('client_secret', DISCORD_CLIENT_SECRET);
        body.append('grant_type', 'authorization_code');
        body.append('code', code);
        body.append('redirect_uri', DISCORD_REDIRECT_URI);

        const tokenResp = await axios.post('https://discord.com/api/oauth2/token', body.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const accessToken = tokenResp.data.access_token;

        // Get user info
        const userResp = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        // Get user's guilds (requires 'guilds' scope)
        let guilds = [];
        try {
            const guildsResp = await axios.get('https://discord.com/api/users/@me/guilds', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            guilds = guildsResp.data;
        } catch (gerr) {
            console.warn('Could not fetch user guilds (missing scope?):', gerr.response?.data || gerr.message);
        }

        return res.json({
            user: {
                id: userResp.data.id,
                username: userResp.data.username,
                discriminator: userResp.data.discriminator,
                avatar: userResp.data.avatar
            },
            access_token: accessToken,
            guilds
        });
    } catch (err) {
        console.error('POST /auth/exchange failed:', err.response?.data || err.message);
        return res.status(500).json({ error: 'exchange_failed', details: err.response?.data || err.message });
    }
});

// --- Admin / settings API ---
const fs = require('fs');
const DATA_FILE = path.join(__dirname, 'data', 'guild-settings.json');
const BOT_GUILDS = (process.env.DISCORD_BOT_GUILDS || '').split(',').filter(Boolean); // comma separated guild IDs where bot is present

// Ensure data directory
try { fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true }); } catch(e){}
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf8');

function readSettings() {
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '{}'); } catch(e){ return {}; }
}
function writeSettings(obj) { fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf8'); }

// Helper to validate token and return guilds list
async function fetchUserGuilds(accessToken) {
    const resp = await axios.get('https://discord.com/api/users/@me/guilds', { headers: { Authorization: `Bearer ${accessToken}` } });
    return resp.data;
}

// Returns servers where user is admin and bot is present
app.get('/api/my-servers', async (req, res) => {
    const auth = req.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '') || req.query.token || req.query.access_token;
    if (!token) return res.status(401).json({ error: 'no_token' });
    try {
        const guilds = await fetchUserGuilds(token);
        const result = guilds.map(g => {
            const isAdmin = Boolean((g.permissions || 0) & 0x8);
            const botPresent = BOT_GUILDS.includes(String(g.id));
            return {
                id: g.id,
                name: g.name,
                icon: g.icon,
                isAdmin,
                botPresent
            };
        }).filter(g => g.isAdmin); // return all servers where the user is admin, regardless of bot presence
        return res.json({ servers: result });
    } catch (err) {
        return res.status(500).json({ error: 'failed_fetch_guilds', details: err.response?.data || err.message });
    }
});

// Return mock channels for a guild (replace with bot API later)
app.get('/api/guild-channels', (req, res) => {
    const guildId = req.query.guildId;
    if (!guildId) return res.status(400).json({ error: 'guildId required' });
    // Mock: return sample text channels
    const channels = [
        { id: '1001', name: 'general', type: 'text' },
        { id: '1002', name: 'welcome', type: 'text' },
        { id: '1003', name: 'logs', type: 'text' },
        { id: '1004', name: 'tickets', type: 'text' }
    ];
    res.json({ channels });
});

// Get current settings for a guild
app.get('/api/get-settings', (req, res) => {
    const guildId = req.query.guildId;
    if (!guildId) return res.status(400).json({ error: 'guildId required' });
    const all = readSettings();
    res.json({ settings: all[guildId] || null });
});

// Save settings for a guild (requires token to check admin)
app.post('/api/save-settings', async (req, res) => {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.body.token;
    const { guildId, settings } = req.body;
    if (!token) return res.status(401).json({ error: 'no_token' });
    if (!guildId || !settings) return res.status(400).json({ error: 'guildId_and_settings_required' });

    try {
        const guilds = await fetchUserGuilds(token);
        const matching = guilds.find(g => String(g.id) === String(guildId));
        if (!matching) return res.status(403).json({ error: 'not_in_guild' });
        const isAdmin = Boolean((matching.permissions || 0) & 0x8);
        const botPresent = BOT_GUILDS.includes(String(guildId));
        if (!isAdmin) return res.status(403).json({ error: 'not_admin' });

        // persist settings regardless of whether the bot is present
        const all = readSettings();
        all[guildId] = settings;
        writeSettings(all);

        // In future: push settings to bot API / webhook if botPresent === true
        return res.json({ ok: true, botPresent });
    } catch (err) {
        return res.status(500).json({ error: 'save_failed', details: err.response?.data || err.message });
    }
});

// Helpful debug endpoint
app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, (err) => {
    if (err) { console.error('❌ Error starting server:', err); return; }
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
