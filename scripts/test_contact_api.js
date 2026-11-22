const path = require('path');
const fs = require('fs');
const http = require('http');

// Ensure server/node_modules is loaded
const serverNodeModules = path.join(__dirname, '..', 'server', 'node_modules');
if (fs.existsSync(serverNodeModules) && !module.paths.includes(serverNodeModules)) {
  module.paths.unshift(serverNodeModules);
}

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
process.env.USE_LOCAL_DB = 'true'; // Enable local db engine for offline test

const jwt = require('jsonwebtoken');
const app = require('../server/app');
const { connectDatabase } = require('../server/config/database');
const { ensureContactInfoInitialized } = require('../server/controllers/contactController');
const { getJwtSecret } = require('../server/middleware/authMiddleware');
const Admin = require('../server/models/Admin');

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TESTING CONTACT INFORMATION MANAGEMENT API');
  console.log('═══════════════════════════════════════════════════════════');

  await connectDatabase();
  await ensureContactInfoInitialized();

  // Start in-memory HTTP server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Test Server] Running on ${baseUrl}`);

  try {
    // 1. Test Public API
    console.log('\n[Test 1] Testing Public GET /api/contact-information...');
    const r1 = await fetch(`${baseUrl}/api/contact-information`);
    const res1 = await r1.json();
    console.log('Status:', r1.status);
    console.log('Success:', res1.success);
    const contact = res1.contact;
    console.log('Company Name:', contact.companyName);
    console.log('Primary Phone:', contact.primaryPhone?.number);
    console.log('Primary Email:', contact.primaryEmail?.email);
    console.log('Primary Address:', contact.primaryAddress?.officeName);
    console.log('GSTIN:', contact.registrations?.find((r) => r.label === 'GSTIN')?.value);

    if (!res1.success || !contact.primaryPhone || contact.primaryPhone.number !== '9600804456') {
      throw new Error('Public API test failed or primary phone mismatch!');
    }
    console.log('✓ Public API successfully returned genuine seeded contact info.');

    // 2. Test Admin API without token (Should be 401)
    console.log('\n[Test 2] Testing Admin GET /api/admin/contact-information (unauthorized)...');
    const r2 = await fetch(`${baseUrl}/api/admin/contact-information`);
    console.log('Status:', r2.status, '(Expected 401)');
    if (r2.status !== 401) {
      throw new Error('Admin API should require authentication!');
    }
    console.log('✓ Unauthorized request was correctly rejected.');

    // Create an admin token for authorized tests
    let admin = await Admin.findOne({ email: 'admin@sriyashealthcare.com' });
    if (!admin) {
      admin = await Admin.create({
        name: 'Test Admin',
        email: 'admin@sriyashealthcare.com',
        password: 'password123',
        role: 'superadmin',
        isActive: true
      });
    }
    const token = jwt.sign(
      { id: String(admin._id), role: admin.role, email: admin.email },
      getJwtSecret(),
      { expiresIn: '2h' }
    );

    // 3. Test Admin API with token (Should be 200)
    console.log('\n[Test 3] Testing Admin GET /api/admin/contact-information (authorized)...');
    const r3 = await fetch(`${baseUrl}/api/admin/contact-information`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const res3 = await r3.json();
    console.log('Status:', r3.status);
    console.log('Admin Contact Phones count:', res3.contact?.phones?.length);
    if (r3.status !== 200 || !res3.contact) {
      throw new Error('Authorized Admin GET failed!');
    }
    console.log('✓ Admin API successfully authorized and returned full contact document.');

    // 4. Test Adding a New Phone and Testing Single Primary Constraint
    console.log('\n[Test 4] Testing Admin PUT /api/admin/contact-information (add phone & switch primary)...');
    const currentPhones = res3.contact.phones || [];
    const updatedPhones = [
      ...currentPhones,
      {
        id: 'phone-emergency',
        label: 'Emergency Surgical Dispatch',
        countryCode: '+91',
        number: '9600804457',
        purpose: 'Hospital 24/7 Dispatch',
        isPrimary: true, // Marking new phone as primary!
        isActive: true,
        showOnContactPage: true,
        showInFooter: true,
        enableClickToCall: true
      }
    ];

    const r4 = await fetch(`${baseUrl}/api/admin/contact-information`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...res3.contact,
        phones: updatedPhones
      })
    });
    const res4 = await r4.json();

    console.log('Update Status:', r4.status);
    console.log('Update Success:', res4.success);
    const savedPhones = res4.contact?.phones || [];
    console.log('Total phones after update:', savedPhones.length);
    const primaryPhoneInAdmin = savedPhones.find((p) => p.isPrimary);
    console.log('Primary Phone in Admin response:', primaryPhoneInAdmin?.label, primaryPhoneInAdmin?.number);

    if (primaryPhoneInAdmin?.number !== '9600804457') {
      throw new Error('Primary phone was not updated to emergency dispatch!');
    }

    // Verify that other phones were automatically demoted from primary
    const originalPhone = savedPhones.find((p) => p.number === '9600804456');
    console.log('Original phone isPrimary:', originalPhone?.isPrimary, '(Expected false)');
    if (originalPhone?.isPrimary !== false) {
      throw new Error('Single primary constraint failed! Multiple primaries exist.');
    }
    console.log('✓ Single primary constraint successfully enforced in database.');

    // 5. Test Public API Reflection
    console.log('\n[Test 5] Verifying Public API dynamically reflects updated primary phone...');
    const r5 = await fetch(`${baseUrl}/api/contact-information`);
    const res5 = await r5.json();
    console.log('Public Primary Phone:', res5.contact?.primaryPhone?.number);
    if (res5.contact?.primaryPhone?.number !== '9600804457') {
      throw new Error('Public API did not reflect updated primary phone!');
    }
    console.log('✓ Public API immediately returned the new primary phone.');

    // 6. Restore original phone as primary and clean up test phone
    console.log('\n[Test 6] Restoring original genuine Sriyas Healthcare contact info...');
    const restoredPhones = currentPhones.map((p) => ({
      ...p,
      isPrimary: p.number === '9600804456'
    }));

    await fetch(`${baseUrl}/api/admin/contact-information`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...res3.contact,
        phones: restoredPhones
      })
    });

    const rFinal = await fetch(`${baseUrl}/api/contact-information`);
    const finalPublic = await rFinal.json();
    console.log('Restored Public Primary Phone:', finalPublic.contact?.primaryPhone?.number);
    if (finalPublic.contact?.primaryPhone?.number !== '9600804456') {
      throw new Error('Failed to restore genuine primary phone!');
    }
    console.log('✓ Genuine Sriyas Healthcare contact information restored.');

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ALL BACKEND & DATABASE TESTS PASSED WITH 100% SUCCESS!');
    console.log('═══════════════════════════════════════════════════════════\n');
  } finally {
    server.close();
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  });
