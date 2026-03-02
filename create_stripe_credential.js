// Create Stripe API credential in n8n and add public key to frontend .env
const https = require('https');
const fs = require('fs');
const path = require('path');

const N8N_HOST = 'n8n-n8n.vaax5y.easypanel.host';
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMTgwYWZhMi1jMzRjLTQ5OGYtODliNC05NTIyMGRlZjA2ODgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiN2M5MWM3NjEtN2ZmNC00NGJkLTk4NDYtNGY5NmM4YTQ4NTlmIiwiaWF0IjoxNzcxODc4OTE5fQ.A3ZQvcS3VxPlZ82u5iG5CkTSr9luJlOk2tzUj1jKsj4';

const STRIPE_SECRET = 'mk_1T5CwmRYb3JiSN33Fah3kB7H';
const STRIPE_PUBLIC = 'mk_1T5CvBRYb3JiSN33p1llM5Bt';

function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: N8N_HOST, port: 443, path: urlPath, method,
      headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
      rejectUnauthorized: false,
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
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

async function main() {
  // 1. Create Stripe credential in n8n
  console.log('Creating Stripe credential in n8n...');
  const credPayload = {
    name: 'Stripe account',
    type: 'stripeApi',
    data: {
      secretKey: STRIPE_SECRET,
    },
  };

  const { status, body } = await request('POST', '/api/v1/credentials', credPayload);
  console.log(`  Status: ${status}`);

  let stripeCredId = null;
  if (status === 200 || status === 201) {
    stripeCredId = body.id;
    console.log(`  Stripe credential created: ID=${stripeCredId}`);
  } else {
    console.log('  Response:', JSON.stringify(body).slice(0, 300));
    // Maybe stripeApi type doesn't exist, try httpHeaderAuth
    console.log('\nTrying httpHeaderAuth type...');
    const altPayload = {
      name: 'Stripe Secret Key',
      type: 'httpHeaderAuth',
      data: {
        name: 'Authorization',
        value: `Bearer ${STRIPE_SECRET}`,
      },
    };
    const { status: s2, body: b2 } = await request('POST', '/api/v1/credentials', altPayload);
    console.log(`  Status: ${s2}`);
    if (s2 === 200 || s2 === 201) {
      stripeCredId = b2.id;
      console.log(`  Credential created: ID=${stripeCredId}`);
    } else {
      console.log('  Response:', JSON.stringify(b2).slice(0, 300));
    }
  }

  // 2. Add Stripe public key to frontend .env files
  const envFiles = [
    'c:/Users/allin/lifeorganizacion/frontend/app/.env',
    'c:/Users/allin/lifeorganizacion/frontend/app/.env.local',
  ];

  for (const envFile of envFiles) {
    try {
      let content = fs.readFileSync(envFile, 'utf8');
      if (!content.includes('VITE_STRIPE_PUBLIC_KEY')) {
        content = content.trimEnd() + `\nVITE_STRIPE_PUBLIC_KEY=${STRIPE_PUBLIC}\n`;
        fs.writeFileSync(envFile, content);
        console.log(`\nAdded VITE_STRIPE_PUBLIC_KEY to ${envFile}`);
      } else {
        console.log(`\nVITE_STRIPE_PUBLIC_KEY already in ${envFile}`);
      }
    } catch (e) {
      console.error(`  Error with ${envFile}:`, e.message);
    }
  }

  console.log('\nDone!');
  if (stripeCredId) console.log(`Stripe credential ID for n8n: ${stripeCredId}`);
}

main().catch(console.error);
