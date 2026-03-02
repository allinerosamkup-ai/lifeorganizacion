const https = require('https');
const N8N_HOST = 'n8n-n8n.vaax5y.easypanel.host';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMTgwYWZhMi1jMzRjLTQ5OGYtODliNC05NTIyMGRlZjA2ODgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiN2M5MWM3NjEtN2ZmNC00NGJkLTk4NDYtNGY5NmM4YTQ4NTlmIiwiaWF0IjoxNzcxODc4OTE5fQ.A3ZQvcS3VxPlZ82u5iG5CkTSr9luJlOk2tzUj1jKsj4';
const SUPABASE_URL = 'https://bmvqtzxdrnbioxhiiosr.supabase.co';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: N8N_HOST, port: 443, path, method,
      headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
      rejectUnauthorized: false,
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  const { body: wf } = await request('GET', '/api/v1/workflows/73ce635Aw0Y7kyug');

  const fixedNodes = wf.nodes.map(n => {
    if (n.type !== 'n8n-nodes-base.httpRequest') return n;
    const node = JSON.parse(JSON.stringify(n));
    const p = node.parameters || {};

    if (p.url && p.url.includes('SUPABASE_URL')) {
      p.url = p.url.replace('={{ $env.SUPABASE_URL }}', SUPABASE_URL);
    }
    if (p.url && p.url.includes('supabase.co')) {
      if (p.headerParameters && p.headerParameters.parameters) {
        p.headerParameters.parameters = p.headerParameters.parameters.filter(
          h => !h.value || !String(h.value).includes('SUPABASE_SERVICE_KEY')
        );
      }
      p.authentication = 'predefinedCredentialType';
      p.nodeCredentialType = 'supabaseApi';
      node.credentials = Object.assign({}, node.credentials, {
        supabaseApi: { id: 'vJDmNbpHYvOLNNxk', name: 'Supabase account' }
      });
    }
    node.parameters = p;
    return node;
  });

  // Only allowed settings fields
  const settings = {
    executionOrder: wf.settings.executionOrder,
    timezone: wf.settings.timezone,
    saveManualExecutions: wf.settings.saveManualExecutions,
    callerPolicy: wf.settings.callerPolicy,
    availableInMCP: wf.settings.availableInMCP,
  };

  const payload = {
    name: wf.name,
    nodes: fixedNodes,
    connections: wf.connections,
    settings,
    staticData: wf.staticData || null,
  };

  const { status, body } = await request('PUT', '/api/v1/workflows/73ce635Aw0Y7kyug', payload);
  console.log('Status:', status);
  if (status !== 200) console.log('Error:', JSON.stringify(body).slice(0, 300));
  else console.log('wf06 updated OK');
})().catch(console.error);
