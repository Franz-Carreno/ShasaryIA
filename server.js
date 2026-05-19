// Simple proxy server for local testing of chat replies.
// Reads GEMINI_API_KEY from .env and exposes POST /api/respond
const express = require('express');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(express.static(__dirname));

app.use(express.json());
// Simple CORS allowing local testing from other ports (e.g., Live Server :5500)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    return res.sendStatus(200);
  }
  next();
});

// Serve config containing Google Client ID to the frontend
app.get('/api/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || ""
  });
});

// Serve loading screen as default landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Shasary_IA_Loading_Screen.html'));
});

// Serve static files (your HTML) from this folder
app.use(express.static(__dirname));

app.post('/api/respond', async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'No message provided' });
  const key = process.env.GEMINI_API_KEY;

  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });

  async function getAccessToken() {
    try {
      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();
      return tokenResponse?.token || null;
    } catch (err) {
      console.warn('Could not obtain access token from GoogleAuth:', err.message);
      return null;
    }
  }

  const accessToken = await getAccessToken();
  if (!key && !accessToken) {
    return res.json({ reply: `No API key or service account credentials configured. Echo: ${message}` });
  }

  async function callGemini(model, payload, action = 'generateContent') {
    let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${action}`;
    if (!accessToken && key) {
      endpoint += `?key=${encodeURIComponent(key)}`;
    }

    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const r = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!r.ok) {
      const txt = await r.text();
      const err = new Error(`Remote API error: ${r.status} ${txt}`);
      err.status = r.status;
      err.body = txt;
      throw err;
    }
    return r.json();
  }

  const candidateRequests = [
    {
      model: 'gemini-2.5-flash',
      action: 'generateContent',
      payload: {
        contents: [{ parts: [{ text: message }] }],
        generationConfig: { temperature: 0.2 }
      },
      parser: 'gemini'
    },
    {
      model: 'gemini-1.5-flash',
      action: 'generateContent',
      payload: {
        contents: [{ parts: [{ text: message }] }],
        generationConfig: { temperature: 0.2 }
      },
      parser: 'gemini'
    },
    {
      model: 'gemini-2.0-flash',
      action: 'generateContent',
      payload: {
        contents: [{ parts: [{ text: message }] }],
        generationConfig: { temperature: 0.2 }
      },
      parser: 'gemini'
    },
    {
      model: 'gemini-1.5-pro',
      action: 'generateContent',
      payload: {
        contents: [{ parts: [{ text: message }] }],
        generationConfig: { temperature: 0.2 }
      },
      parser: 'gemini'
    }
  ];

  let lastError = null;
  for (const candidate of candidateRequests) {
    try {
      const data = await callGemini(candidate.model, candidate.payload, candidate.action);
      console.log(`Gemini reply from model ${candidate.model} action ${candidate.action}`);

      let reply = null;
      if (candidate.parser === 'gemini') {
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          reply = data.candidates[0].content.parts[0].text;
        }
      }
      
      if (!reply) {
        reply = JSON.stringify(data);
      }
      return res.json({ reply, model: candidate.model, action: candidate.action });
    } catch (err) {
      console.warn(`Model ${candidate.model} action ${candidate.action} failed:`, err.message);
      lastError = err;
    }
  }

  console.error('Gemini API error:', lastError);
  return res.status(500).json({ error: lastError?.message || 'Unknown error', reply: `Error calling Gemini: ${lastError?.message || 'Unknown error'}` });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Shasary proxy server running on http://localhost:${port}`);
});

module.exports = app;
