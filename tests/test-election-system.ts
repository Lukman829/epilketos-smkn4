import {
  hashToken,
  generateSecureToken,
  validateTokenStatus,
  castVote,
  getElectionResults,
  adminToggleElectionStatus,
  adminPublishResults,
  adminGenerateBatchTokens,
  adminRevokeToken,
  store,
} from '../src/lib/storage';

console.log('====================================================');
console.log('E-PILKETOS SMKN 4 KOTA SERANG — INTEGRATION TESTS');
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

// TEST 1: Token hashing and format
const sampleToken = store.tokens[0].plain_token!;
const sampleHash = hashToken(sampleToken);
assert(sampleHash.length === 64, 'Token hash is valid SHA-256 (64 hex characters)');

const generated = generateSecureToken();
assert(
  /^PLK-[2-9A-Z]{4}-[2-9A-Z]{4}$/.test(generated),
  `Generated token matches PLK-XXXX-YYYY pattern: ${generated}`
);

// TEST 2: Valid token check
const validationResult = validateTokenStatus(sampleToken);
assert(validationResult.valid === true, `Token ${sampleToken} is recognized as valid`);
assert(validationResult.className === 'X TKJ 1', 'Token belongs to class X TKJ 1');

// TEST 3: Invalid token check
const invalidResult = validateTokenStatus('PLK-FAKE-9999');
assert(invalidResult.valid === false, 'Invalid token PLK-FAKE-9999 is rejected');

// TEST 4: Candidate Type Validation (Ketua cannot be Wakil, and vice versa)
const invalidKetuaVote = castVote(sampleToken, 'w-01', 'w-02'); // Using 'w-01' (wakil) as ketua
assert(invalidKetuaVote.success === false, 'Vote rejected when candidate type mismatch (wakil as ketua)');

const invalidWakilVote = castVote(sampleToken, 'k-01', 'k-02'); // Using 'k-02' (ketua) as wakil
assert(invalidWakilVote.success === false, 'Vote rejected when candidate type mismatch (ketua as wakil)');

// TEST 5: Atomic Vote Submission
const validVote = castVote(sampleToken, 'k-01', 'w-01');
assert(validVote.success === true, 'Valid vote for Ketua k-01 and Wakil w-01 is successfully accepted');

// TEST 6: Anti-Double Voting (Same token cannot vote twice)
const doubleVoteAttempt = castVote(sampleToken, 'k-02', 'w-02');
assert(doubleVoteAttempt.success === false, 'Double voting with already-used token is rejected');

// TEST 7: Ballot Secrecy Verification
const latestBallot = store.ballots[store.ballots.length - 1];
assert(
  !('token_id' in latestBallot) && !('token' in latestBallot) && !('student_id' in latestBallot),
  'Ballot record has NO reference to token or voter identity (Secret Ballot guaranteed)'
);

// TEST 8: Token Batch Generation & Class Quota
const batchResult = adminGenerateBatchTokens('cls-10-tkj-1', 5, 'Ketua Panitia');
assert(batchResult.generatedTokens.length === 5, 'Batch generation creates exactly 5 tokens');
const testBatchToken = batchResult.generatedTokens[0].token;
const batchVal = validateTokenStatus(testBatchToken);
assert(batchVal.valid === true, 'Newly generated batch token is immediately valid');

// TEST 9: Token Revocation and Replacement
const targetToRevoke = store.tokens.find((t) => t.plain_token === testBatchToken);
assert(Boolean(targetToRevoke), 'Target token found in store');
if (targetToRevoke) {
  const revokeRes = adminRevokeToken(
    targetToRevoke.id,
    'Kartu pemilih basah/rusak saat distribusi',
    true,
    'Ketua Panitia'
  );
  assert(revokeRes.success === true, 'Token revocation succeeded');
  assert(Boolean(revokeRes.replacementToken), 'Replacement token was generated');

  // Old revoked token must be rejected
  const revokedCheck = validateTokenStatus(testBatchToken);
  assert(revokedCheck.valid === false, 'Old revoked token is rejected from voting');
  assert(revokedCheck.status === 'revoked', 'Rejection reason states token is revoked');

  // New replacement token must be valid
  if (revokeRes.replacementToken) {
    const replacementCheck = validateTokenStatus(revokeRes.replacementToken);
    assert(replacementCheck.valid === true, 'Replacement token is valid for voting');
  }
}

// TEST 10: Election Status Enforcement (Closed election blocks votes)
adminToggleElectionStatus('closed', 'Admin Utama');
const closedVal = validateTokenStatus(batchResult.generatedTokens[1].token);
assert(closedVal.valid === false, 'Token rejected when election status is closed');

const closedVoteAttempt = castVote(batchResult.generatedTokens[1].token, 'k-02', 'w-02');
assert(closedVoteAttempt.success === false, 'Vote rejected when election is closed');

// Re-open election
adminToggleElectionStatus('ongoing', 'Admin Utama');

// TEST 11: Official Results Secrecy & Publication Policy
adminPublishResults(false, 'Ketua Panitia');
const publicResultsBefore = getElectionResults(false);
assert(
  publicResultsBefore.is_published === false && publicResultsBefore.ketua_results.length === 0,
  'Results are hidden from public before official publication'
);

adminPublishResults(true, 'Ketua Panitia');
const publicResultsAfter = getElectionResults(false);
assert(
  publicResultsAfter.is_published === true && publicResultsAfter.ketua_results.length > 0,
  'Results are published and visible to public after official authorization'
);
assert(
  publicResultsAfter.class_participation.length === 0,
  'Official public results do NOT expose class participation data'
);
const adminResults = getElectionResults(true);
assert(
  adminResults.class_participation.length > 0,
  'Admin results retain class participation for internal committee monitoring'
);

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('====================================================');
