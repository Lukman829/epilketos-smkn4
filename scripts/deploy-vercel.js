const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// 1. Read OAuth token
const tokenConfigPath = 'C:\\Users\\onehe\\.gemini\\antigravity\\mcp_oauth_tokens.json';
const tokenConfig = JSON.parse(fs.readFileSync(tokenConfigPath, 'utf8'));
const token = tokenConfig['https://mcp.vercel.com'].token.access_token;
console.log('Using Vercel OAuth Token:', token.slice(0, 8) + '...' + token.slice(-4));

const EXCLUDE_DIRS = new Set(['node_modules', '.next', '.git', '.gemini', 'coverage']);
const EXCLUDE_FILES = new Set(['.env.local']);

function scan(dir, base = '') {
  let list = [];
  for (const item of fs.readdirSync(dir)) {
    if (EXCLUDE_DIRS.has(item) || EXCLUDE_FILES.has(item)) continue;
    const full = path.join(dir, item);
    const rel = (base ? base + '/' + item : item).replace(/\\/g, '/');
    const s = fs.statSync(full);
    if (s.isDirectory()) {
      list = list.concat(scan(full, rel));
    } else {
      list.push(rel);
    }
  }
  return list;
}

function requestJson(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: null, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      if (Buffer.isBuffer(body)) {
        req.write(body);
      } else if (typeof body === 'object') {
        req.write(JSON.stringify(body));
      } else {
        req.write(body);
      }
    }
    req.end();
  });
}

function uploadFile(content, sha) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.vercel.com',
      path: '/v2/files',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/octet-stream',
        'Content-Length': content.length,
        'x-vercel-digest': sha
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', reject);
    req.write(content);
    req.end();
  });
}

async function main() {
  const filePaths = scan('.');
  console.log(`Scanning complete: ${filePaths.length} files detected.`);

  const deploymentFiles = [];
  let uploadedCount = 0;
  let reusedCount = 0;

  for (const relPath of filePaths) {
    const content = fs.readFileSync(relPath);
    const sha = crypto.createHash('sha1').update(content).digest('hex');
    const size = content.length;

    deploymentFiles.push({
      file: relPath,
      sha: sha,
      size: size
    });

    const res = await uploadFile(content, sha);
    if (res.status === 200) {
      uploadedCount++;
    } else {
      console.warn(`File ${relPath} upload returned status ${res.status}:`, res.data);
    }
  }

  console.log(`Uploaded/verified ${deploymentFiles.length} files to Vercel.`);

  console.log('Triggering production deployment for project "epilketos-smkn4"...');

  const deployPayload = {
    name: 'epilketos-smkn4',
    project: 'epilketos-smkn4',
    target: 'production',
    projectSettings: {
      framework: 'nextjs'
    },
    files: deploymentFiles
  };

  const deployRes = await requestJson({
    hostname: 'api.vercel.com',
    path: '/v13/deployments',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  }, deployPayload);

  if (deployRes.status !== 200 && deployRes.status !== 201) {
    console.error('Deployment failed with status:', deployRes.status, deployRes.raw);
    process.exit(1);
  }

  const deployment = deployRes.data;
  console.log(`Deployment created successfully!`);
  console.log(`ID: ${deployment.id}`);
  console.log(`URL: https://${deployment.url}`);
  console.log(`State: ${deployment.readyState || deployment.status}`);

  console.log('Monitoring build progress...');
  let currentStatus = deployment.readyState || deployment.status;

  while (currentStatus === 'BUILDING' || currentStatus === 'INITIALIZING' || currentStatus === 'QUEUED') {
    await new Promise(r => setTimeout(r, 4000));
    const checkRes = await requestJson({
      hostname: 'api.vercel.com',
      path: `/v13/deployments/${deployment.id}`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    if (checkRes.status === 200) {
      currentStatus = checkRes.data.readyState || checkRes.data.status;
      console.log(`[Status: ${currentStatus}]`);
      if (currentStatus === 'READY') {
        console.log('\n=============================================');
        console.log('🚀 DEPLOYMENT IS READY AND LIVE!');
        console.log(`Primary Domain: https://epilketos-smkn4.vercel.app`);
        console.log(`Deployment URL: https://${checkRes.data.url}`);
        console.log('=============================================\n');
        return;
      } else if (currentStatus === 'ERROR' || currentStatus === 'CANCELED') {
        console.error('\nDeployment failed with state:', currentStatus);
        console.error('Error details:', checkRes.data.error || checkRes.data);
        process.exit(1);
      }
    } else {
      console.warn('Check returned status:', checkRes.status);
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
