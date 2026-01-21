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

  const params = new URLSearchParams({ network: 'MTN', recipient: '0546591622', capacity: '4' });
  const body = params.toString();
  const method = 'POST';
  const pathCandidates = ['/api/v1/orders', '/v1/orders', '/orders'];
  const tsCandidates = [
    () => Math.floor(Date.now() / 1000).toString(),
    () => Date.now().toString()
  ];
  const messageFormats = [
    (ts, method, path, bodyStr) => `${ts}:${method}:${path}:${bodyStr}`,
    (ts, method, path, bodyStr) => `${method}:${path}:${ts}:${bodyStr}`
  ];

  for (const path of pathCandidates) {
    for (const tsFn of tsCandidates) {
      const ts = tsFn();
      for (const fmt of messageFormats) {
        const bodyStr = body; // already form-encoded
        // Also try the newline-separated message format used in production code
        const newlineMessage = `${ts}\n${method}\n${path}\n${bodyStr}`;
        const message = fmt(ts, method, path, bodyStr);
        const signatureHex = crypto.createHmac('sha256', apiSecret).update(message).digest('hex');
        const signatureB64 = crypto.createHmac('sha256', apiSecret).update(message).digest('base64');
        const signatureNewlineHex = crypto.createHmac('sha256', apiSecret).update(newlineMessage).digest('hex');
        const signatureNewlineB64 = crypto.createHmac('sha256', apiSecret).update(newlineMessage).digest('base64');
        const sigCandidates = [signatureHex, signatureB64];

        // prefer newline-encoded signatures first (match production format)
        sigCandidates.unshift(signatureNewlineHex, signatureNewlineB64);

        for (const signature of sigCandidates) {

          try {
            const res = await fetch(endpoint, {
              method,
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'X-Timestamp': ts,
                'X-Signature': signature,
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (resellershubprogh)'
              },
              body: bodyStr
            });

            console.log('--- Attempt ---');
            console.log('path:', path, 'tsType:', tsFn === tsCandidates[0] ? 'seconds' : 'ms', 'formatIndex:', messageFormats.indexOf(fmt), 'sigType:', signature === signatureHex ? 'hex' : 'base64');
            console.log('Status:', res.status);
            console.log('Headers:', Object.fromEntries(res.headers.entries()));
            const text = await res.text();
            try { console.log('Body:', JSON.parse(text)); } catch (e) { console.log('Body (raw):', text); }

            if (res.status === 201 || res.status === 200) {
              console.log('Success with these parameters — stopping further attempts.');
              return;
            }
          } catch (err) {
            console.error('Request error:', err);
          }
        }
      }
    }
  }
}

run();
