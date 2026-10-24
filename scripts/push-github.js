const fs = require('fs');
const path = require('path');
const https = require('https');

const mcpConfig = JSON.parse(fs.readFileSync('C:\\Users\\onehe\\.gemini\\antigravity\\mcp_config.json', 'utf8'));
const token = mcpConfig.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const owner = 'Lukman829';
const repo = 'epilketos-smkn4';

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

function ghRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Antigravity-Agent',
        'Accept': 'application/vnd.github+json',
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        } : {})
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function isBinaryFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ['.ico', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.woff', '.woff2', '.ttf'].includes(ext);
}

async function main() {
  console.log(`Pushing codebase to https://github.com/${owner}/${repo}...`);

  // 1. Check if main ref exists
  let baseCommitSha = null;
  const refRes = await ghRequest('GET', `/repos/${owner}/${repo}/git/ref/heads/main`);
  if (refRes.status === 200) {
    baseCommitSha = refRes.data.object.sha;
    console.log('Existing base commit SHA:', baseCommitSha);
  } else {
    console.log('Repository is currently empty. Initializing root commit...');
  }

  // 2. Scan files
  const filePaths = scan('.');
  console.log(`Found ${filePaths.length} files to push.`);

  // 3. Create blobs
  const treeItems = [];
  for (let i = 0; i < filePaths.length; i++) {
    const relPath = filePaths[i];
    const isBin = isBinaryFile(relPath);
    let blobRes;

    if (isBin) {
      const b64 = fs.readFileSync(relPath).toString('base64');
      blobRes = await ghRequest('POST', `/repos/${owner}/${repo}/git/blobs`, {
        content: b64,
        encoding: 'base64'
      });
    } else {
      const text = fs.readFileSync(relPath, 'utf8');
      blobRes = await ghRequest('POST', `/repos/${owner}/${repo}/git/blobs`, {
        content: text,
        encoding: 'utf-8'
      });
    }

    if (blobRes.status !== 201) {
      console.error(`Failed to create blob for ${relPath}:`, blobRes.status, blobRes.raw);
      process.exit(1);
    }

    treeItems.push({
      path: relPath,
      mode: '100644',
      type: 'blob',
      sha: blobRes.data.sha
    });

    if ((i + 1) % 10 === 0 || i === filePaths.length - 1) {
      console.log(`Uploaded blobs: ${i + 1}/${filePaths.length}`);
    }
  }

  // 4. Create tree
  console.log('Creating Git Tree...');
  const treePayload = baseCommitSha ? { base_tree: baseCommitSha, tree: treeItems } : { tree: treeItems };
  const treeRes = await ghRequest('POST', `/repos/${owner}/${repo}/git/trees`, treePayload);

  if (treeRes.status !== 201) {
    console.error('Failed to create tree:', treeRes.status, treeRes.raw);
    process.exit(1);
  }
  const newTreeSha = treeRes.data.sha;
  console.log('New Tree SHA:', newTreeSha);

  // 5. Create commit
  console.log('Creating commit...');
  const commitMsg = 'feat: per-class excel distribution with header metadata, voting instructions, and uncensored attendance table';
  const commitPayload = {
    message: commitMsg,
    tree: newTreeSha,
    parents: baseCommitSha ? [baseCommitSha] : []
  };
  const commitRes = await ghRequest('POST', `/repos/${owner}/${repo}/git/commits`, commitPayload);

  if (commitRes.status !== 201) {
    console.error('Failed to create commit:', commitRes.status, commitRes.raw);
    process.exit(1);
  }
  const newCommitSha = commitRes.data.sha;
  console.log('New Commit SHA:', newCommitSha);

  // 6. Update or Create heads/main ref
  if (baseCommitSha) {
    console.log('Updating heads/main ref...');
    const updateRes = await ghRequest('PATCH', `/repos/${owner}/${repo}/git/refs/heads/main`, {
      sha: newCommitSha
    });
    if (updateRes.status !== 200) {
      console.error('Failed to update ref:', updateRes.status, updateRes.raw);
      process.exit(1);
    }
  } else {
    console.log('Creating refs/heads/main...');
    const createRefRes = await ghRequest('POST', `/repos/${owner}/${repo}/git/refs`, {
      ref: 'refs/heads/main',
      sha: newCommitSha
    });
    if (createRefRes.status !== 201) {
      console.error('Failed to create ref:', createRefRes.status, createRefRes.raw);
      process.exit(1);
    }
  }

  console.log('\n=============================================');
  console.log('🎉 GitHub Repository Successfully Updated!');
  console.log(`Repo: https://github.com/${owner}/${repo}`);
  console.log(`Commit: ${newCommitSha}`);
  console.log('=============================================\n');
}

main().catch(err => {
  console.error('Error pushing to GitHub:', err);
  process.exit(1);
});
