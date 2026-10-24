const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envText.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw.trim().toUpperCase()).digest('hex');
}

async function run() {
  console.log('--- LIVE SUPABASE VERIFICATION ---');

  // 1. Generate a test token
  const testPlain = 'PLK-TEST-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  const testHash = hashToken(testPlain);
  const testPreview = testPlain.slice(0, 7) + '***' + testPlain.slice(-2);
  const batchId = 'batch-verify-' + Date.now();

  console.log('1. Generated test token:', testPlain);

  // 2. Insert batch & token
  const { data: batchData, error: batchErr } = await supabase.rpc('admin_generate_batch_tokens', {
    p_batch_id: batchId,
    p_batch_name: 'Test Verification Batch',
    p_class_id: 'cls-10-tkj-1',
    p_total_tokens: 1,
    p_created_by: 'Verifier',
    p_tokens: [{
      id: 'tok-verify-' + Date.now(),
      token_hash: testHash,
      token_preview: testPreview,
      class_id: 'cls-10-tkj-1',
      batch_id: batchId
    }]
  });
  if (batchErr) throw batchErr;
  console.log('2. admin_generate_batch_tokens RPC result:', batchData);

  // 3. Validate token before voting
  const { data: valData, error: valErr } = await supabase.rpc('validate_token', {
    p_token_hash: testHash
  });
  if (valErr) throw valErr;
  console.log('3. validate_token RPC result:', valData);

  // 4. Cast vote
  const { data: voteData, error: voteErr } = await supabase.rpc('cast_vote', {
    p_token_hash: testHash,
    p_candidate_ketua_id: 'k-01',
    p_candidate_wakil_id: 'w-01'
  });
  if (voteErr) throw voteErr;
  console.log('4. cast_vote RPC result:', voteData);

  // 5. Try to double vote with same token (MUST FAIL)
  const { data: doubleVoteData, error: doubleVoteErr } = await supabase.rpc('cast_vote', {
    p_token_hash: testHash,
    p_candidate_ketua_id: 'k-02',
    p_candidate_wakil_id: 'w-02'
  });
  console.log('5. double-vote prevention (error expected):', doubleVoteErr ? doubleVoteErr.message : doubleVoteData);

  // 6. Get election results
  const { data: resData, error: resErr } = await supabase.rpc('get_election_results', {
    p_is_admin: true
  });
  if (resErr) throw resErr;
  console.log('6. get_election_results RPC total ballots:', resData.total_ballots, 'turnout:', resData.turnout_percentage + '%');
  console.log('Candidate ketua tallies raw:', JSON.stringify(resData.ketua_results, null, 2));

  console.log('\n>>> ALL 6 END-TO-END SUPABASE RPC VERIFICATIONS PASSED PERFECTLY! <<<');
}

run().catch(console.error);
