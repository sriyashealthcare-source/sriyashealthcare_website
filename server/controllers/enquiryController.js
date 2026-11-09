const crypto = require('crypto');
const CustomerEnquiry = require('../models/CustomerEnquiry');
const AdminNote = require('../models/AdminNote');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const Product = require('../models/Product');

// Public: Submit enquiry (from Contact page or Product Quick Enquiry)
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
      productId = null
    } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your full name.' });
    }
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid contact phone number.' });
    }
    if (!email || !String(email).trim() || !String(email).includes('@')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your enquiry message or requirements.' });
    }

    let productOfInterest = {
      productId: null,
      productName: '',
      productSlug: ''
    };

    if (productId) {
      try {
        const prod = await Product.findById(productId).select('name slug');
        if (prod) {
          productOfInterest = {
            productId: prod._id,
            productName: prod.name,
            productSlug: prod.slug
          };
        }
      } catch (e) {
        // If not a valid ObjectId or not found, keep null
      }
    }

    // Pseudonymous hash of IP address for rate-limiting / spam prevention (never store raw IP)
    const rawIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ipHash = rawIp ? crypto.createHash('sha256').update(rawIp).digest('hex').slice(0, 16) : '';

    const enquiry = await CustomerEnquiry.create({
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      company: String(company).trim(),
      productOfInterest,
      subject: String(subject).trim() || (productOfInterest.productName ? `Enquiry for ${productOfInterest.productName}` : 'Healthcare Product & Equipment Enquiry'),
      message: String(message).trim(),
      sourcePage: String(sourcePage).trim(),
      visitorSessionId: String(visitorSessionId).trim(),
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
          pagePath: String(sourcePage).trim(),
          pageTitle: 'Customer Enquiry Submitted',
          productId: productOfInterest.productId,
          productNameSnapshot: productOfInterest.productName,
          metadata: { enquiryId: enquiry._id }
        });
      } catch (evtErr) {
        // Non-blocking for customer experience
      }
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for reaching out to Sriyas Healthcare. Your enquiry has been received and our medical solutions team will get in touch with you shortly.',
      enquiryId: enquiry._id
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
      search,
      productId,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (productId) {
      query['productOfInterest.productId'] = productId;
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { 'productOfInterest.productName': { $regex: q, $options: 'i' } }
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

    const headers = ['ID', 'Date', 'Customer Name', 'Phone', 'Email', 'Company', 'Product of Interest', 'Subject', 'Status', 'Message'];
    const rows = enquiries.map(e => [
      e._id,
      new Date(e.createdAt).toISOString().replace('T', ' ').slice(0, 19),
      `"${(e.name || '').replace(/"/g, '""')}"`,
      `"${(e.phone || '').replace(/"/g, '""')}"`,
      `"${(e.email || '').replace(/"/g, '""')}"`,
      `"${(e.company || '').replace(/"/g, '""')}"`,
      `"${(e.productOfInterest?.productName || '').replace(/"/g, '""')}"`,
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

