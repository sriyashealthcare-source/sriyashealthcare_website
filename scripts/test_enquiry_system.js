const path = require('path');
const fs = require('fs');

const serverDir = path.join(__dirname, '..', 'server');
const serverNodeModules = path.join(serverDir, 'node_modules');
if (fs.existsSync(serverNodeModules) && !module.paths.includes(serverNodeModules)) {
  module.paths.unshift(serverNodeModules);
}

const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(serverDir, '.env') });
process.env.USE_LOCAL_DB = 'true';

const { connectDatabase } = require('../server/config/database');
const CustomerEnquiry = require('../server/models/CustomerEnquiry');
const AnalyticsEvent = require('../server/models/AnalyticsEvent');
const Product = require('../server/models/Product');
const Brand = require('../server/models/Brand');
const enquiryController = require('../server/controllers/enquiryController');

function createMockReqRes(body = {}, query = {}, params = {}) {
  const req = {
    body,
    query,
    params,
    ip: '127.0.0.1',
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    admin: { _id: 'mock_admin_1', name: 'Test Administrator' }
  };

  let statusCode = 200;
  let responseData = null;
  const headers = {};

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    send(data) {
      responseData = data;
      return this;
    },
    setHeader(name, value) {
      headers[name] = value;
    },
    getStatus: () => statusCode,
    getData: () => responseData,
    getHeaders: () => headers
  };

  const next = (err) => {
    if (err) throw err;
  };

  return { req, res, next };
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  TESTING SRIYAS HEALTHCARE ENQUIRY SYSTEM');
  console.log('═══════════════════════════════════════════════════════════════');

  await connectDatabase();

  await CustomerEnquiry.deleteMany({ email: { $in: ['ramesh.kumar@apollo.test', 'anita.roy@fortis.test'] } });
  await AnalyticsEvent.deleteMany({ sessionId: { $in: ['sess_test_floating_123', 'sess_test_contact_456'] } });

  // Find a product and brand to test with
  const sampleProduct = await Product.findOne({}).populate('brand');
  const sampleBrand = sampleProduct ? sampleProduct.brand : await Brand.findOne({});

  console.log(`\nSample Brand: ${sampleBrand?.name || 'Peters Surgical'}`);
  console.log(`Sample Product: ${sampleProduct?.name || 'I-Col™'}`);

  // Test 1: Submit enquiry via Floating Product Enquiry Widget
  console.log('\n[Test 1] Submit enquiry via Floating Product Enquiry Widget...');
  const floatingReq = createMockReqRes({
    name: 'Dr. Ramesh Kumar',
    phone: '+91 98765 12345',
    email: 'ramesh.kumar@apollo.test',
    company: 'Apollo Hospitals Chennai',
    message: 'Requesting urgent technical brochure and quotation for batch supply of surgical sutures.',
    sourcePage: `/products/${sampleBrand?.slug || 'peters'}/${sampleProduct?.slug || 'i-col'}`,
    enquirySource: 'Floating Product Enquiry Widget',
    productId: sampleProduct?._id,
    productName: sampleProduct?.name,
    productSlug: sampleProduct?.slug,
    brandId: sampleBrand?._id,
    brandName: sampleBrand?.name,
    brandSlug: sampleBrand?.slug,
    visitorSessionId: 'sess_test_floating_123'
  });

  await enquiryController.submitCustomerEnquiry(floatingReq.req, floatingReq.res, floatingReq.next);
  console.log('  Status Code:', floatingReq.res.getStatus());
  const floatingResult = floatingReq.res.getData();
  console.log('  Response:', floatingResult);

  if (floatingReq.res.getStatus() !== 201 || !floatingResult.success) {
    throw new Error('Failed to submit floating enquiry.');
  }

  const floatingEnquiryDoc = await CustomerEnquiry.findById(floatingResult.enquiryId);
  console.log('  Verified DB Doc:');
  console.log('    ID:', floatingEnquiryDoc._id);
  console.log('    Name:', floatingEnquiryDoc.name);
  console.log('    Enquiry Source:', floatingEnquiryDoc.enquirySource);
  console.log('    Source Page:', floatingEnquiryDoc.sourcePage);
  console.log('    Product Of Interest:', floatingEnquiryDoc.productOfInterest);
  console.log('    Brand Of Interest:', floatingEnquiryDoc.brandOfInterest);

  if (floatingEnquiryDoc.enquirySource !== 'Floating Product Enquiry Widget') {
    throw new Error(`Expected enquirySource "Floating Product Enquiry Widget", got "${floatingEnquiryDoc.enquirySource}"`);
  }

  // Check Analytics Event (no double counting)
  const events = await AnalyticsEvent.find({ sessionId: 'sess_test_floating_123' });
  console.log(`  Analytics Events logged for session: ${events.length}`);
  if (events.length !== 1 || events[0].eventType !== 'enquiry_submit') {
    throw new Error(`Expected exactly 1 enquiry_submit analytics event, found ${events.length}`);
  }
  console.log('  ✓ Verified exactly 1 analytics event recorded, no double counting.');

  // Test 2: Submit enquiry via Contact Page
  console.log('\n[Test 2] Submit enquiry via Contact Page...');
  const contactReq = createMockReqRes({
    name: 'Sister Anita Roy',
    phone: '+91 91234 56789',
    email: 'anita.roy@fortis.test',
    company: 'Fortis Healthcare',
    message: 'General inquiry regarding medical equipment catalog and dealership.',
    sourcePage: '/contact',
    enquirySource: 'Contact Page',
    visitorSessionId: 'sess_test_contact_456'
  });

  await enquiryController.submitCustomerEnquiry(contactReq.req, contactReq.res, contactReq.next);
  const contactResult = contactReq.res.getData();
  console.log('  Status Code:', contactReq.res.getStatus());
  console.log('  Response:', contactResult);

  const contactEnquiryDoc = await CustomerEnquiry.findById(contactResult.enquiryId);
  console.log('  Verified DB Doc Enquiry Source:', contactEnquiryDoc.enquirySource);
  if (contactEnquiryDoc.enquirySource !== 'Contact Page') {
    throw new Error(`Expected enquirySource "Contact Page", got "${contactEnquiryDoc.enquirySource}"`);
  }

  // Test 3: Admin List Enquiries with Source Filter
  console.log('\n[Test 3] Admin filter by source: Floating Widget...');
  const filterFloatingReq = createMockReqRes({}, { source: 'floating', page: 1, limit: 10 });
  await enquiryController.getAdminEnquiries(filterFloatingReq.req, filterFloatingReq.res, filterFloatingReq.next);
  const filterFloatingData = filterFloatingReq.res.getData();
  console.log(`  Found ${filterFloatingData.enquiries.length} floating enquiries (Total: ${filterFloatingData.total})`);
  filterFloatingData.enquiries.forEach(e => {
    if (e.enquirySource !== 'Floating Product Enquiry Widget') {
      throw new Error(`Filter floating returned non-floating enquiry: ${e.enquirySource}`);
    }
  });
  console.log('  ✓ Filter "floating" returns only Floating Widget enquiries.');

  console.log('\n[Test 4] Admin filter by source: Contact Page...');
  const filterContactReq = createMockReqRes({}, { source: 'contact', page: 1, limit: 10 });
  await enquiryController.getAdminEnquiries(filterContactReq.req, filterContactReq.res, filterContactReq.next);
  const filterContactData = filterContactReq.res.getData();
  console.log(`  Found ${filterContactData.enquiries.length} contact page enquiries (Total: ${filterContactData.total})`);
  filterContactData.enquiries.forEach(e => {
    if (e.enquirySource !== 'Contact Page') {
      throw new Error(`Filter contact returned non-contact enquiry: ${e.enquirySource}`);
    }
  });
  console.log('  ✓ Filter "contact" returns only Contact Page enquiries.');

  // Test 5: Admin Enquiry by ID with Notes
  console.log('\n[Test 5] Get Single Enquiry Details by ID...');
  const getByIdReq = createMockReqRes({}, {}, { id: floatingResult.enquiryId });
  await enquiryController.getAdminEnquiryById(getByIdReq.req, getByIdReq.res, getByIdReq.next);
  const singleData = getByIdReq.res.getData();
  console.log('  Fetched Single Enquiry Name:', singleData.enquiry.name);
  console.log('  Enquiry Source:', singleData.enquiry.enquirySource);
  console.log('  Product Name:', singleData.enquiry.productOfInterest?.productName);

  // Test 6: Export Enquiries CSV
  console.log('\n[Test 6] Admin CSV Export...');
  const exportReq = createMockReqRes();
  await enquiryController.exportEnquiriesCsv(exportReq.req, exportReq.res, exportReq.next);
  const csvContent = exportReq.res.getData();
  const firstLines = csvContent.split('\n').slice(0, 3);
  console.log('  CSV Header:', firstLines[0]);
  console.log('  CSV Sample Row 1:', firstLines[1]);

  if (!firstLines[0].includes('Source') || !firstLines[0].includes('Brand / Manufacturer') || !firstLines[0].includes('Source Page')) {
    throw new Error('CSV Export missing required columns.');
  }
  console.log('  ✓ CSV Export contains Source, Brand / Manufacturer, and Source Page columns.');

  // Clean up test records
  await CustomerEnquiry.deleteMany({ _id: { $in: [floatingResult.enquiryId, contactResult.enquiryId] } });
  await AnalyticsEvent.deleteMany({ sessionId: { $in: ['sess_test_floating_123', 'sess_test_contact_456'] } });
  console.log('  ✓ Cleaned up test records from database.');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ALL BACKEND INTEGRATION TESTS PASSED!');
  console.log('═══════════════════════════════════════════════════════════════\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('[Integration Test Error]', err);
  process.exit(1);
});
