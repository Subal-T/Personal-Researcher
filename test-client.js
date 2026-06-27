const http = require('http');

/**
 * Sends a POST request to localhost:3000/api/research
 */
function makeRequest(body) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/research',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, body: err.message });
    });

    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('==================================================');
  console.log(' Running Client-side HTTP Verification Tests');
  console.log('==================================================');

  // Test 1: Empty topic validation
  console.log('\n[TEST 1] Sending empty topic...');
  const res1 = await makeRequest({ topic: '', context: '' });
  console.log('Status Code:', res1.status);
  console.log('Response:', res1.body);

  // Test 2: Max topic length validation
  console.log('\n[TEST 2] Sending topic exceeding 200 characters...');
  const res2 = await makeRequest({ topic: 'a'.repeat(210), context: '' });
  console.log('Status Code:', res2.status);
  console.log('Response:', res2.body);

  // Test 3: Placeholder API key error handling
  console.log('\n[TEST 3] Sending valid payload (expecting API key check)...');
  const res3 = await makeRequest({ topic: 'Robotics', context: 'Automotive Industry' });
  console.log('Status Code:', res3.status);
  console.log('Response:', res3.body);

  console.log('\n==================================================');
}

run();
