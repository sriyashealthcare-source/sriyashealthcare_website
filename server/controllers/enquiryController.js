const crypto = require('crypto');
const CustomerEnquiry = require('../models/CustomerEnquiry');
const AdminNote = require('../models/AdminNote');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const Product = require('../models/Product');
const Brand = require('../models/Brand');

// Public: Submit enquiry (from Contact page or Floating Product Enquiry Widget)
const submitCustomerEnquiry = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      company = '',
      subject = '',
      message,
      sourcePage = '/contact',
      visitorSessionId = '',
      productId = null,
      productName = '',
      productSlug = '',
      brandId = null,
      brandName = '',
      brandSlug = '',
      enquirySource = ''
    } = req.body || {};

    const cleanName = String(name || '').trim().slice(0, 120);
    const cleanPhone = String(phone || '').trim().slice(0, 40);
    const cleanEmail = String(email || '').trim().toLowerCase().slice(0, 160);
    const cleanCompany = String(company || '').trim().slice(0, 160);
    const cleanMessage = String(message || '').trim().slice(0, 3000);
    const cleanSourcePage = String(sourcePage || '/contact').trim().slice(0, 250);

    if (!cleanName) {
      return res.status(400).json({ success: false, message: 'Please provide your full name.' });
    }
    if (!cleanPhone || cleanPhone.length < 5) {
      return res.status(400).json({ success: false, message: 'Please provide a valid contact phone number.' });
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!cleanMessage) {
      return res.status(400).json({ success: false, message: 'Please enter your enquiry message or requirements.' });
    }

    let resolvedEnquirySource = String(enquirySource || '').trim().slice(0, 100);
    if (!resolvedEnquirySource) {
      resolvedEnquirySource = cleanSourcePage === '/contact' ? 'Contact Page' : 'Floating Product Enquiry Widget';
    }

    let productOfInterest = {
      productId: null,
      productName: String(productName || '').trim().slice(0, 200),
      productSlug: String(productSlug || '').trim().slice(0, 100),
      brandName: String(brandName || '').trim().slice(0, 120)
    };

    let brandOfInterest = {
      brandId: null,
      brandName: String(brandName || '').trim().slice(0, 120),
      brandSlug: String(brandSlug || '').trim().slice(0, 100)
    };

    if (productId) {
      try {
        const prod = await Product.findById(productId).populate('brand', 'name slug');
        if (prod) {
          productOfInterest.productId = prod._id;
          productOfInterest.productName = prod.name;
          productOfInterest.productSlug = prod.slug;
          if (prod.brand) {
            productOfInterest.brandName = prod.brand.name || '';
            if (!brandOfInterest.brandName) {
              brandOfInterest.brandId = prod.brand._id;
              brandOfInterest.brandName = prod.brand.name;
              brandOfInterest.brandSlug = prod.brand.slug;
            }
          }
        }
      } catch (e) {
        // If not a valid ObjectId or not found, keep provided productName/Slug
      }
    }

    if (brandId && !brandOfInterest.brandId) {
      try {
        const b = await Brand.findById(brandId);
        if (b) {
          brandOfInterest.brandId = b._id;
          brandOfInterest.brandName = b.name;
          brandOfInterest.brandSlug = b.slug;
        }
      } catch (e) {}
    }

    let resolvedSubject = String(subject || '').trim().slice(0, 200);
    if (!resolvedSubject) {
      if (productOfInterest.productName) {
        resolvedSubject = `Enquiry for ${productOfInterest.productName}`;
      } else if (brandOfInterest.brandName) {
        resolvedSubject = `Enquiry for ${brandOfInterest.brandName} Products`;
      } else {
        resolvedSubject = 'Healthcare Product & Equipment Enquiry';
      }
    }

    // Pseudonymous hash of IP address for rate-limiting / spam prevention (never store raw IP)
    const rawIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ipHash = rawIp ? crypto.createHash('sha256').update(rawIp).digest('hex').slice(0, 16) : '';

    const enquiry = await CustomerEnquiry.create({
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      company: cleanCompany,
      productOfInterest,
      brandOfInterest,
      subject: resolvedSubject,
      message: cleanMessage,
      sourcePage: cleanSourcePage,
      enquirySource: resolvedEnquirySource,
      visitorSessionId: String(visitorSessionId || '').trim(),
      status: 'new',
      priority: 'medium',
      ipHash
    });

    // Record an analytics event if visitorSessionId is present
    if (visitorSessionId) {
      try {
        await AnalyticsEvent.create({
          eventId: `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
          visitorId: String(req.body.visitorId || visitorSessionId).trim(),
          sessionId: String(visitorSessionId).trim(),
          eventType: 'enquiry_submit',
          pagePath: cleanSourcePage,
          pageTitle: 'Customer Enquiry Submitted',
          productId: productOfInterest.productId,
          productNameSnapshot: productOfInterest.productName,
          metadata: {
            enquiryId: enquiry._id,
            enquirySource: resolvedEnquirySource
          }
        });
      } catch (evtErr) {
        // Non-blocking for customer experience
      }
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for reaching out to Sriyas Healthcare. Your enquiry has been received and our medical solutions team will get in touch with you shortly.',
      enquiryId: enquiry._id,
      enquirySource: resolvedEnquirySource
    });
  } catch (error) {
    next(error);
  }
};

// Admin: List enquiries with filters, pagination, and search
const getAdminEnquiries = async (req, res, next) => {
  try {
    const {
      status,
      source,
      search,
      productId,
      brandId,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (source && source !== 'all') {
      if (source === 'floating') {
        query.enquirySource = 'Floating Product Enquiry Widget';
      } else if (source === 'contact') {
        query.enquirySource = 'Contact Page';
      } else {
        query.enquirySource = source;
      }
    }

    if (productId) {
      query['productOfInterest.productId'] = productId;
    }

    if (brandId) {
      query['brandOfInterest.brandId'] = brandId;
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { 'productOfInterest.productName': { $regex: q, $options: 'i' } },
        { 'brandOfInterest.brandName': { $regex: q, $options: 'i' } },
        { enquirySource: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        query.createdAt.$lte = e;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [enquiries, total, statusCounts] = await Promise.all([
      CustomerEnquiry.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      CustomerEnquiry.countDocuments(query),
      CustomerEnquiry.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const counts = {
      all: 0,
      new: 0,
      contacted: 0,
      follow_up: 0,
      resolved: 0,
      closed: 0
    };
    statusCounts.forEach(c => {
      if (counts[c._id] !== undefined) counts[c._id] = c.count;
      counts.all += c.count;
    });

    res.status(200).json({
      success: true,
      enquiries,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      counts
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get single enquiry with its admin notes
const getAdminEnquiryById = async (req, res, next) => {
  try {
    const enquiry = await CustomerEnquiry.findById(req.params.id)
      .populate('productOfInterest.productId', 'name slug images brand category')
      .populate('brandOfInterest.brandId', 'name slug logoUrl tabLabel')
      .lean();

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    const notes = await AdminNote.find({ enquiryId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      enquiry,
      notes
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update enquiry status or priority
const updateEnquiryStatus = async (req, res, next) => {
  try {
    const { status, priority } = req.body;
    const update = {};
    if (status) update.status = status;
    if (priority) update.priority = priority;

    const enquiry = await CustomerEnquiry.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    res.status(200).json({
      success: true,
      message: `Enquiry status updated to "${enquiry.status}".`,
      enquiry
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Add note to an enquiry
const addAdminNote = async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note || !String(note).trim()) {
      return res.status(400).json({ success: false, message: 'Note text cannot be empty.' });
    }

    const enquiry = await CustomerEnquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    const adminNote = await AdminNote.create({
      enquiryId: enquiry._id,
      adminId: req.admin ? req.admin._id : null,
      adminName: req.admin ? req.admin.name : 'Administrator',
      note: String(note).trim()
    });

    res.status(201).json({
      success: true,
      message: 'Internal note added.',
      note: adminNote
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Export enquiries to CSV
const exportEnquiriesCsv = async (req, res, next) => {
  try {
    const enquiries = await CustomerEnquiry.find({})
      .sort({ createdAt: -1 })
      .lean();

    const headers = ['ID', 'Date', 'Source', 'Customer Name', 'Phone', 'Email', 'Company', 'Brand / Manufacturer', 'Product of Interest', 'Source Page', 'Subject', 'Status', 'Message'];
    const rows = enquiries.map(e => [
      e._id,
      new Date(e.createdAt).toISOString().replace('T', ' ').slice(0, 19),
      `"${(e.enquirySource || 'Contact Page').replace(/"/g, '""')}"`,
      `"${(e.name || '').replace(/"/g, '""')}"`,
      `"${(e.phone || '').replace(/"/g, '""')}"`,
      `"${(e.email || '').replace(/"/g, '""')}"`,
      `"${(e.company || '').replace(/"/g, '""')}"`,
      `"${(e.brandOfInterest?.brandName || e.productOfInterest?.brandName || '').replace(/"/g, '""')}"`,
      `"${(e.productOfInterest?.productName || '').replace(/"/g, '""')}"`,
      `"${(e.sourcePage || '').replace(/"/g, '""')}"`,
      `"${(e.subject || '').replace(/"/g, '""')}"`,
      e.status,
      `"${(e.message || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sriyas-enquiries-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitCustomerEnquiry,
  getAdminEnquiries,
  getAdminEnquiryById,
  updateEnquiryStatus,
  addAdminNote,
  exportEnquiriesCsv
};

