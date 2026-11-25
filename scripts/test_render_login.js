const https = require('https');

const postData = JSON.stringify({
  email: 'admin@sriyashealthcare.com',
  password: 'Sriyas@2026'
});

const req = https.request('https://sriyashealthcare-website.onrender.com/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (err) => console.error('Error:', err.message));
req.write(postData);
req.end();
