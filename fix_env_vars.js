// Fix: replace $env.SUPABASE_URL/$env.SUPABASE_SERVICE_KEY in all n8n workflows
// Uses the existing Supabase credential (vJDmNbpHYvOLNNxk) instead of env vars

const https = require('https');

const N8N_HOST = 'n8n-n8n.vaax5y.easypanel.host';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMTgwYWZhMi1jMzRjLTQ5OGYtODliNC05NTIyMGRlZjA2ODgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiN2M5MWM3NjEtN2ZmNC00NGJkLTk4NDYtNGY5NmM4YTQ4NTlmIiwiaWF0IjoxNzcxODc4OTE5fQ.A3ZQvcS3VxPlZ82u5iG5CkTSr9luJlOk2tzUj1jKsj4';
const SUPABASE_URL = 'https://bmvqtzxdrnbioxhiiosr.supabase.co';
const SUPABASE_CRED_ID = 'vJDmNbpHYvOLNNxk';
const SUPABASE_CRED_NAME = 'Supabase account';

const WORKFLOW_IDS = [
  '4WCjwjdzrzfISdQN',
  '1YJROEHdnAebULrC',
  'JVtUytFjnuqArnkB',
  'NuCshHPPBMt2JHSo',
  'Ds3iGnCsLUtGQEi3',
  '73ce635Aw0Y7kyug',
];

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: N8N_HOST,
      port: 443,
      path,
      method,
      headers: {
        'X-N8N-API-KEY': N8N_KEY,
        'Content-Type': 'application/json',
      },
      rejectUnauthorized: false,
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function fixNode(nodeOrig) {
  if (nodeOrig.type !== 'n8n-nodes-base.httpRequest') return nodeOrig;

  // Deep clone to avoid mutating original (important for change detection)
  const node = JSON.parse(JSON.stringify(nodeOrig));
  const params = node.parameters || {};

  let modified = false;

  // Fix URL: replace $env.SUPABASE_URL with hardcoded value
  if (params.url && params.url.includes('SUPABASE_URL')) {
    params.url = params.url.replace(/=\{\{\s*\$env\.SUPABASE_URL\s*\}\}/g, SUPABASE_URL);
    params.url = params.url.replace(/\$env\.SUPABASE_URL/g, SUPABASE_URL);
    modified = true;
  }

  // Check if this node calls Supabase
  const isSupabase = params.url && params.url.includes('supabase.co');
  if (!isSupabase) return nodeOrig;

  // Remove manual apikey/Authorization headers with $env.SUPABASE_SERVICE_KEY
  if (params.headerParameters && params.headerParameters.parameters) {
    const before = params.headerParameters.parameters.length;
    params.headerParameters.parameters = params.headerParameters.parameters.filter(h => {
      if (h.value && h.value.toString().includes('SUPABASE_SERVICE_KEY')) return false;
      return true;
    });
    if (params.headerParameters.parameters.length !== before) modified = true;
    if (params.headerParameters.parameters.length === 0) {
      delete params.headerParameters;
      params.sendHeaders = false;
    }
  }

  // Switch to predefined credential auth
  if (params.authentication !== 'predefinedCredentialType') {
    params.authentication = 'predefinedCredentialType';
    params.nodeCredentialType = 'supabaseApi';
    modified = true;
  }

  // Set credential
  if (!node.credentials) node.credentials = {};
  if (!node.credentials.supabaseApi) {
    node.credentials.supabaseApi = { id: SUPABASE_CRED_ID, name: SUPABASE_CRED_NAME };
    modified = true;
  }

  node.parameters = params;
  return modified ? node : nodeOrig;
}

async function processWorkflow(id) {
  const { status: getStatus, body: wf } = await request('GET', `/api/v1/workflows/${id}`);
  if (getStatus !== 200) {
    console.error(`  GET ${id} failed: ${getStatus}`);
    return false;
  }

  const name = wf.name || id;
  console.log(`\nProcessing: ${name}`);

  const originalNodes = wf.nodes || [];
  const fixedNodes = originalNodes.map(fixNode);

  // Count actual changes by comparing serialized versions
  let changed = 0;
  for (let i = 0; i < originalNodes.length; i++) {
    const origStr = JSON.stringify(originalNodes[i]);
    const fixedStr = JSON.stringify(fixedNodes[i]);
    if (origStr !== fixedStr) {
      changed++;
      console.log(`  Fixed node: "${fixedNodes[i].name}"`);
    }
  }

  if (changed === 0) {
    console.log('  No changes needed');
    return true;
  }

  const payload = {
    name: wf.name,
    nodes: fixedNodes,
    connections: wf.connections,
    settings: wf.settings,
    staticData: wf.staticData || null,
  };

  const { status: putStatus, body: putResp } = await request('PUT', `/api/v1/workflows/${id}`, payload);
  if (putStatus === 200) {
    console.log(`  Uploaded OK (${changed} node(s) fixed)`);
    return true;
  } else {
    console.error(`  PUT failed ${putStatus}:`, JSON.stringify(putResp).slice(0, 300));
    return false;
  }
}

async function main() {
  console.log('Fixing $env.SUPABASE_* references in n8n workflows...\n');
  let ok = 0;
  for (const id of WORKFLOW_IDS) {
    const success = await processWorkflow(id);
    if (success) ok++;
  }
  console.log(`\nDone: ${ok}/${WORKFLOW_IDS.length} workflows updated`);
}

main().catch(console.error);
