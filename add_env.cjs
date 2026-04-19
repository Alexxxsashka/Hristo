const https = require('https');
const { execSync } = require('child_process');

// Get vercel auth token by running vercel CLI to print it
// Vercel stores auth in ~/.local or LOCALAPPDATA
const fs = require('fs');
const os = require('os');
const path = require('path');

// Try different config paths
const configPaths = [
  path.join(os.homedir(), '.config', 'vercel', 'auth.json'),
  path.join(process.env.LOCALAPPDATA || '', 'com.vercel.cli', 'auth.json'),
  path.join(os.homedir(), '.vercel', 'auth.json'),
];

let vercelToken = null;

for (const p of configPaths) {
  try {
    if (fs.existsSync(p)) {
      const auth = JSON.parse(fs.readFileSync(p, 'utf8'));
      vercelToken = auth.token;
      console.log('Found token in:', p);
      break;
    }
  } catch (e) {}
}

// Try to extract from vercel env pull if token not found
if (!vercelToken) {
  // List all config files from vercel
  const cliDir = path.join(process.env.LOCALAPPDATA || '', 'com.vercel.cli');
  console.log('CLI dir contents:');
  try {
    fs.readdirSync(cliDir, { recursive: true }).forEach(f => console.log(' ', f));
  } catch(e) {
    console.log('Error reading dir:', e.message);
  }
  
  console.error('Could not find Vercel token in config files');
  process.exit(1);
}

const TOKEN_VALUE = 'vercel_blob_rw_TvsCeVUy3n5IMbib_IEDX4s1AyWV2TVWfZhvDf2rzQdvKR8';
const PROJECT_ID = 'prj_Swp9r2EcIXktW4JxWOIGyLfEyhGO';
const TEAM_ID = 'team_m4KapBmmZT1VUPmuqLxXGJAo';

console.log('Adding env var via Vercel API...');
console.log('Token length:', TOKEN_VALUE.length);

const body = JSON.stringify({
  key: 'BLOB_READ_WRITE_TOKEN',
  value: TOKEN_VALUE,
  type: 'encrypted',
  target: ['production', 'preview', 'development']
});

const options = {
  hostname: 'api.vercel.com',
  path: `/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${vercelToken}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const parsed = JSON.parse(data);
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('SUCCESS! Env var added:', parsed.key);
    } else {
      console.log('Error:', JSON.stringify(parsed, null, 2));
    }
  });
});

req.on('error', (e) => console.error('Request error:', e));
req.write(body);
req.end();
