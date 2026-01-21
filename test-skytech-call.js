import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env.production' });

async function run() {
  const apiKey = process.env.SKYTECH_API_KEY;
  const apiSecret = process.env.SKYTECH_API_SECRET;
  const endpoint = process.env.SKYTECH_API_ENDPOINT || 'https://skytechgh.com/api/v1/orders';

  if (!apiKey || !apiSecret) {
    console.error('Missing SKYTECH_API_KEY or SKYTECH_API_SECRET in .env.production');
    process.exit(1);
  }

  console.log('\n🔧 Testing SkyTech API - Testing both approaches\n');
  console.log('Endpoint:', endpoint);
  console.log('API Key:', apiKey.substring(0, 10) + '...');
  console.log('---\n');

  const method = 'POST';
  const path = '/api/v1/orders';
  const ts = Math.floor(Date.now() / 1000).toString();
  
  // Test 1: Form-encoded
  console.log('═══════════════════════════════════════════════');
  console.log('TEST 1: Form-Encoded Data');
  console.log('═══════════════════════════════════════════════\n');
  
  const params = new URLSearchParams({
    network: 'MTN',
    recipient: '0546591622',
    capacity: '4',
    idempotency_key: 'test-form-' + Date.now()
  });
  const formBodyString = params.toString();
  const formMessage = `${ts}\n${method}\n${path}\n${formBodyString}`;
  const formSignature = crypto.createHmac('sha256', apiSecret).update(formMessage).digest('hex');

  console.log('📤 Form-Encoded Request:');
  console.log('Content-Type: application/x-www-form-urlencoded');
  console.log('Body:', formBodyString);
  console.log('Signature:', formSignature.substring(0, 16) + '...');
  console.log('');

  try {
    console.log('⏳ Sending form-encoded request...');
    const res = await fetch(endpoint, {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Timestamp': ts,
        'X-Signature': formSignature,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://resellershubprogh.com'
      },
      body: formBodyString
    });

    const text = await res.text();
    let body = {};
    try {
      body = JSON.parse(text);
    } catch (e) {
      body = text;
    }

    console.log('Status:', res.status);
    console.log('Response:', body);
    console.log('');

    if (res.status === 200 || res.status === 201) {
      console.log('✅ Form-encoded SUCCESS!\n');
      return;
    }
  } catch (err) {
    console.error('❌ Form-encoded error:', err.message);
    console.log('');
  }

  // Test 2: JSON
  console.log('═══════════════════════════════════════════════');
  console.log('TEST 2: JSON Data');
  console.log('═══════════════════════════════════════════════\n');
  
  const jsonBody = JSON.stringify({
    network: 'MTN',
    recipient: '0546591622',
    capacity: 4,
    idempotency_key: 'test-json-' + Date.now()
  });
  const jsonMessage = `${ts}\n${method}\n${path}\n${jsonBody}`;
  const jsonSignature = crypto.createHmac('sha256', apiSecret).update(jsonMessage).digest('hex');

  console.log('📤 JSON Request:');
  console.log('Content-Type: application/json');
  console.log('Body:', jsonBody);
  console.log('Signature:', jsonSignature.substring(0, 16) + '...');
  console.log('');

  try {
    console.log('⏳ Sending JSON request...');
    const res = await fetch(endpoint, {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Timestamp': ts,
        'X-Signature': jsonSignature,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://resellershubprogh.com'
      },
      body: jsonBody
    });

    console.log('\n📥 Response:');
    console.log('Status:', res.status);
    
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
      console.log('Body:', JSON.stringify(body, null, 2));
    } catch (e) {
      console.log('Body (raw):', text);
      body = text;
    }

    if (res.status === 200 || res.status === 201) {
      console.log('\n✅ JSON SUCCESS! Request accepted by SkyTech API');
      console.log('\n🎯 API uses JSON format for requests');
      return;
    } else if (res.status === 400) {
      console.log('\n⚠️  400 Bad Request');
    } else if (res.status === 403) {
      console.log('\n❌ 403 Forbidden - Signature or auth failed');
    } else {
      console.log(`\n⚠️  Unexpected status: ${res.status}`);
    }
  } catch (err) {
    console.error('\n❌ JSON request error:', err.message);
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('Neither approach was successful');
  console.log('═══════════════════════════════════════════════');
}

run();
