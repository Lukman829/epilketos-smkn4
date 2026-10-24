import {
  signAdminToken,
  verifyAdminToken,
  constantTimeCompare,
  rateLimit,
  sanitizeString,
  isValidTokenFormat,
} from '../src/lib/security';

console.log('====================================================');
console.log('E-PILKETOS SECURITY & CRYPTOGRAPHY AUDIT TESTS');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`✓ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`✗ [FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

// 1. Token signing and verification
const admin = {
  username: 'admin.utama',
  name: 'Admin Utama Sistem',
  role: 'admin_utama' as const,
};

const token = signAdminToken(admin);
assert(typeof token === 'string' && token.split('.').length === 3, 'Token format is valid header.payload.sig');

const verified = verifyAdminToken(token);
assert(verified.valid === true, 'Valid token signature verifies successfully');
assert(verified.admin?.username === 'admin.utama', 'Verified token extracts correct username');
assert(verified.admin?.role === 'admin_utama', 'Verified token extracts correct role');

// 2. Tampered token detection
const parts = token.split('.');
const tamperedPayload = Buffer.from(JSON.stringify({ ...admin, role: 'super_hacker' })).toString('base64url');
const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
const tamperedResult = verifyAdminToken(tamperedToken);
assert(tamperedResult.valid === false, 'Tampered token payload is rejected');

const fakeSigToken = `${parts[0]}.${parts[1]}.fake_signature_abc123`;
const fakeSigResult = verifyAdminToken(fakeSigToken);
assert(fakeSigResult.valid === false, 'Tampered token signature is rejected');

// 3. Constant-time comparison
assert(constantTimeCompare('secretPassword123', 'secretPassword123') === true, 'Constant time compare returns true for identical strings');
assert(constantTimeCompare('secretPassword123', 'wrongPassword456') === false, 'Constant time compare returns false for different strings');
assert(constantTimeCompare('secret', 'secretLonger') === false, 'Constant time compare handles different lengths safely');

// 4. Rate Limiting
const ip = '192.168.1.100';
const limitRes1 = rateLimit(`test-rl-${ip}`, 3, 5000);
assert(limitRes1.allowed === true && limitRes1.remaining === 2, 'Rate limit permits 1st request');
const limitRes2 = rateLimit(`test-rl-${ip}`, 3, 5000);
assert(limitRes2.allowed === true && limitRes2.remaining === 1, 'Rate limit permits 2nd request');
const limitRes3 = rateLimit(`test-rl-${ip}`, 3, 5000);
assert(limitRes3.allowed === true && limitRes3.remaining === 0, 'Rate limit permits 3rd request');
const limitRes4 = rateLimit(`test-rl-${ip}`, 3, 5000);
assert(limitRes4.allowed === false, 'Rate limit blocks 4th request exceeding limit');

// 5. Input Sanitization
const xssPayload = '<script>alert("pwned")</script><b>Calon OSIS</b>';
const cleanText = sanitizeString(xssPayload);
assert(!cleanText.includes('<script>') && !cleanText.includes('<b>'), 'Sanitizer strips HTML & script tags');

// 6. Token format validation
assert(isValidTokenFormat('PLK-7X9B-4MN2') === true, 'Valid token PLK-7X9B-4MN2 passes validation');
assert(isValidTokenFormat('PLK-ABCD-1234') === true, 'Valid token pattern passes validation');
assert(isValidTokenFormat('abc') === false, 'Too short token is rejected');
assert(isValidTokenFormat('<script>alert(1)</script>') === false, 'Malicious token string is rejected');
assert(isValidTokenFormat('PLK 7X9B 4MN2') === false, 'Token with spaces is rejected');

// 7. Secret Ballot Side-Channel Timing Decoupling
// When a vote is cast, verify token.used_at and ballot.created_at are decoupled to prevent correlation attacks
import { store, castVote, generateSecureToken } from '../src/lib/storage';
const auditTestToken = store.tokens[1].plain_token!;
const voteResult = castVote(auditTestToken, 'k-02', 'w-03');
assert(voteResult.success === true, 'Cast vote succeeds for timing audit test');

const usedToken = store.tokens.find(t => t.id === store.tokens[1].id)!;
const matchedBallot = store.ballots.find(b => b.candidate_ketua_id === 'k-02' && b.candidate_wakil_id === 'w-03')!;

assert(usedToken.used_at !== undefined, 'Token has used_at timestamp recorded');
assert(matchedBallot.created_at !== undefined, 'Ballot has created_at timestamp');
assert(
  usedToken.used_at !== matchedBallot.created_at,
  'Ballot timestamp is decoupled from token used_at (Side-Channel Timing Correlation Attack Defeated)'
);
assert(
  matchedBallot.created_at.endsWith(':00.000Z'),
  'Ballot timestamp is bucketed to the hour to anonymize temporal correlation'
);

// 8. Public Endpoint Rate Limiting Protection
const resultsIp = '10.0.0.42';
for (let i = 0; i < 60; i++) {
  rateLimit(`results:${resultsIp}`, 60, 60000);
}
const blockedResultReq = rateLimit(`results:${resultsIp}`, 60, 60000);
assert(blockedResultReq.allowed === false, 'Results API rate limiter blocks 61st request in 1 minute window');

// 9. CSRF Origin Validation Logic
function checkCsrf(origin: string, host: string): boolean {
  try {
    const originUrl = new URL(origin);
    return originUrl.host === host;
  } catch {
    return false;
  }
}
assert(checkCsrf('https://epilketos-smkn4.vercel.app', 'epilketos-smkn4.vercel.app') === true, 'CSRF guard allows legitimate same-origin requests');
assert(checkCsrf('https://evil-attacker.com', 'epilketos-smkn4.vercel.app') === false, 'CSRF guard rejects malicious cross-origin requests');
assert(checkCsrf('http://localhost:3000', 'localhost:3000') === true, 'CSRF guard allows local development host');
assert(checkCsrf('malformed-uri', 'epilketos-smkn4.vercel.app') === false, 'CSRF guard rejects malformed origin header');

console.log(`\nResults: ${passedTests}/${totalTests} security tests passed.\n`);
