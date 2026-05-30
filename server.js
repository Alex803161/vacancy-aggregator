cat > server.js << 'EOF'
import http from 'http';
import url from 'url';

const CLIENT_ID = 'U2TQJEAFSCMHEVAH14ANFGSHFVSLLCGAOB2HTN3AJM1NGDK76NDIQV1AKNKNFOVA';
const CLIENT_SECRET = 'NJVT17K4OH48S8N6AJUIIK0RFOFTBEEQF4U0FKE3HE7OBF1L46TSSAND5SLALP45';
let accessToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://hh.ru/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
  return accessToken;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  const targetUrl = parsedUrl.query.url;
  if (!targetUrl) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Missing ?url parameter' }));
    return;
  }
  
  try {
    const token = await getAccessToken();
    const response = await fetch(targetUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const data = await response.json();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Failed to fetch data' }));
  }
});

server.listen(3000, () => {
  console.log('✅ Прокси работает на http://localhost:3000');
});
EOF
