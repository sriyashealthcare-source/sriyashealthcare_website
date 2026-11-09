const crypto = require('crypto');
const ProductView = require('../models/ProductView');
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const AnalyticsVisitor = require('../models/AnalyticsVisitor');
const AnalyticsSession = require('../models/AnalyticsSession');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const CustomerEnquiry = require('../models/CustomerEnquiry');

function buildDateRangeFilter(query = {}, field = 'viewedAt') {
  const { range = '30d', startDate, endDate } = query;
  const now = new Date();
  let start = null;
  let end = new Date(now.getTime() + 60 * 1000);

  if (range === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else if (range === '7d') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === '30d') {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (range === '90d') {
    start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else if (range === 'custom') {
    if (startDate) {
      const s = new Date(startDate);
      if (!isNaN(s.getTime())) {
        s.setHours(0, 0, 0, 0);
        start = s;
      }
    }
    if (endDate) {
      const e = new Date(endDate);
      if (!isNaN(e.getTime())) {
        e.setHours(23, 59, 59, 999);
        end = e;
      }
    }
  } else if (range === 'all') {
    start = null;
  }

  if (!start && range !== 'custom') {
    return {};
  }

  const filter = {};
  if (start) filter.$gte = start;
  if (end) filter.$lte = end;
  return Object.keys(filter).length > 0 ? { [field]: filter } : {};
}

function formatDateKey(dateObj) {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC TRACKING APIS
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/analytics/session (Public session init / heartbeat)
const startAnalyticsSession = async (req, res) => {
  try {
    const {
      visitorId,
      sessionId,
      referrer = 'direct',
      landingPage = '/',
      deviceCategory = 'desktop',
      browser = 'Unknown',
      os = 'Unknown',
      country = 'India',
      utmSource = '',
      utmMedium = '',
      utmCampaign = '',
      utmTerm = '',
      utmContent = ''
    } = req.body || {};

    if (!visitorId || !sessionId) {
      return res.status(400).json({ success: false, message: 'visitorId and sessionId are required.' });
    }

    const cleanVisitorId = String(visitorId).trim().slice(0, 64);
    const cleanSessionId = String(sessionId).trim().slice(0, 64);

    let trafficType = 'direct';
    const cleanRef = String(referrer).trim().toLowerCase();
    if (utmSource || utmCampaign) {
      trafficType = 'campaign';
    } else if (cleanRef && cleanRef !== 'direct') {
      if (cleanRef.includes('google') || cleanRef.includes('bing') || cleanRef.includes('yahoo') || cleanRef.includes('duckduckgo')) {
        trafficType = 'organic_search';
      } else if (cleanRef.includes('linkedin') || cleanRef.includes('facebook') || cleanRef.includes('twitter') || cleanRef.includes('instagram') || cleanRef.includes('whatsapp')) {
        trafficType = 'social';
      } else {
        trafficType = 'referral';
      }
    }

    const now = new Date();

    // Upsert Visitor
    await AnalyticsVisitor.findOneAndUpdate(
      { visitorId: cleanVisitorId },
      {
        $setOnInsert: {
          firstVisitAt: now,
          deviceCategory: String(deviceCategory).toLowerCase(),
          browser,
          os,
          initialReferrer: referrer,
          initialLandingPage: landingPage
        },
        $set: { lastVisitAt: now },
        $inc: { sessionCount: 1 }
      },
      { upsert: true, new: true }
    );

    // Upsert Session
    const session = await AnalyticsSession.findOneAndUpdate(
      { sessionId: cleanSessionId },
      {
        $setOnInsert: {
          visitorId: cleanVisitorId,
          startedAt: now,
          landingPage,
          referrer,
          trafficType,
          utmSource,
          utmMedium,
          utmCampaign,
          utmTerm,
          utmContent,
          deviceCategory: String(deviceCategory).toLowerCase(),
          browser,
          os,
          country
        },
        $set: {
          lastActivityAt: now,
          exitPage: landingPage
        }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, sessionId: session.sessionId, trafficType });
  } catch (error) {
    console.warn('[Analytics] Session init error:', error.message);
    res.status(200).json({ success: false });
  }
};

// POST /api/analytics/event (Public lightweight event collector)
const recordAnalyticsEvent = async (req, res) => {
  try {
    const {
      eventType = 'page_view',
      pagePath = '/',
      pageTitle = '',
      visitorId,
      sessionId,
      productId = null,
      metadata = {}
    } = req.body || {};

    if (!visitorId || !sessionId || !pagePath) {
      return res.status(400).json({ success: false, message: 'visitorId, sessionId and pagePath are required.' });
    }

    const allowedTypes = ['page_view', 'product_view', 'category_view', 'brochure_download', 'enquiry_submit', 'contact_click'];
    if (!allowedTypes.includes(eventType)) {
      return res.status(400).json({ success: false, message: 'Invalid eventType.' });
    }

    const cleanVisitorId = String(visitorId).trim().slice(0, 64);
    const cleanSessionId = String(sessionId).trim().slice(0, 64);
    const cleanPath = String(pagePath).trim().slice(0, 200);
    const eventId = `evt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date();

    let productDoc = null;
    let productNameSnapshot = '';
    let productSlugSnapshot = '';
    let brandNameSnapshot = '';
    let categoryNameSnapshot = '';

    if (productId) {
      try {
        productDoc = await Product.findById(productId).populate('brand', 'name').populate('category', 'name');
        if (productDoc) {
          productNameSnapshot = productDoc.name;
          productSlugSnapshot = productDoc.slug;
          brandNameSnapshot = productDoc.brand?.name || '';
          categoryNameSnapshot = productDoc.category?.name || productDoc.cardCategory || '';
        }
      } catch (e) {
        // invalid ObjectId
      }
    }

    // Insert Event
    await AnalyticsEvent.create({
      eventId,
      visitorId: cleanVisitorId,
      sessionId: cleanSessionId,
      eventType,
      pagePath: cleanPath,
      pageTitle: String(pageTitle).slice(0, 150),
      productId: productDoc ? productDoc._id : null,
      productNameSnapshot,
      productSlugSnapshot,
      brandNameSnapshot,
      categoryNameSnapshot,
      metadata,
      timestamp: now
    });

    // Update Session
    const session = await AnalyticsSession.findOne({ sessionId: cleanSessionId });
    if (session) {
      const duration = Math.max(0, Math.floor((now.getTime() - new Date(session.startedAt).getTime()) / 1000));
      await AnalyticsSession.updateOne(
        { sessionId: cleanSessionId },
        {
          $set: { lastActivityAt: now, exitPage: cleanPath, durationSeconds: duration },
          $inc: { pageViewsCount: 1 }
        }
      );
    }

    // Update Visitor
    const incField = eventType === 'product_view' ? { totalPageViews: 1, totalProductViews: 1 } : { totalPageViews: 1 };
    await AnalyticsVisitor.updateOne(
      { visitorId: cleanVisitorId },
      { $set: { lastVisitAt: now }, $inc: incField }
    );

    // If product view, also record to ProductView for backward compatibility
    if (eventType === 'product_view' && productDoc) {
      await ProductView.create({
        productId: productDoc._id,
        productSlug: productDoc.slug || '',
        productName: productDoc.name,
        brandId: productDoc.brand ? productDoc.brand._id : null,
        brandName: brandNameSnapshot,
        categoryId: productDoc.category ? productDoc.category._id : null,
        categoryName: categoryNameSnapshot,
        visitorSessionId: cleanSessionId,
        viewedAt: now,
        source: req.body.source || 'direct'
      });
      await Product.findByIdAndUpdate(productDoc._id, {
        $inc: { viewCount: 1 },
        $set: { lastViewedAt: now }
      });
    }

    res.status(201).json({ success: true, eventId });
  } catch (error) {
    console.warn('[Analytics] Error recording event:', error.message);
    res.status(200).json({ success: false });
  }
};

// Legacy POST /api/analytics/product-view (Preserved for compatibility)
const recordProductView = async (req, res, next) => {
  try {
    const { productId, visitorSessionId, source, visitorId } = req.body || {};
    if (!productId) return res.status(400).json({ success: false, message: 'Product ID is required.' });

    const idStr = String(productId).trim();
    const product = await Product.findOne({
      isActive: true,
      deletedAt: null,
      $or: [{ _id: idStr }, { slug: idStr.toLowerCase() }]
    }).populate('brand', 'name slug').populate('category', 'name slug');

    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const sessionId = String(visitorSessionId || 'anon_session').trim().slice(0, 80);
    const now = new Date();

    await ProductView.create({
      productId: product._id,
      productSlug: product.slug || '',
      productName: product.name,
      brandId: product.brand ? product.brand._id : null,
      brandName: product.brand?.name || 'Sriyas Healthcare',
      categoryId: product.category ? product.category._id : null,
      categoryName: product.category?.name || product.cardCategory || 'General',
      visitorSessionId: sessionId,
      viewedAt: now,
      source: String(source || 'direct').slice(0, 160)
    });

    await Product.findByIdAndUpdate(product._id, {
      $inc: { viewCount: 1 },
      $set: { lastViewedAt: now }
    });

    res.status(201).json({ success: true, message: 'Product view recorded.' });
  } catch (error) {
    console.warn('[Analytics] Error in legacy product view:', error.message);
    res.status(200).json({ success: false });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ADMINISTRATOR ANALYTICS APIS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/analytics/overview (Executive KPI Summary)
const getAnalyticsOverview = async (req, res, next) => {
  try {
    const sessionDateFilter = buildDateRangeFilter(req.query, 'startedAt');
    const viewDateFilter = buildDateRangeFilter(req.query, 'viewedAt');
    const enquiryDateFilter = buildDateRangeFilter(req.query, 'createdAt');
    const eventDateFilter = buildDateRangeFilter(req.query, 'timestamp');

    const [
      allProducts,
      sessions,
      totalVisitors,
      allTimeVisitors,
      filteredEvents,
      filteredViews,
      enquiries,
      newEnquiriesCount
    ] = await Promise.all([
      Product.find({ deletedAt: null }).populate('brand', 'name slug').populate('category', 'name slug').lean(),
      AnalyticsSession.find(sessionDateFilter).lean(),
      AnalyticsVisitor.countDocuments(buildDateRangeFilter(req.query, 'lastVisitAt')),
      AnalyticsVisitor.countDocuments({}),
      AnalyticsEvent.find(eventDateFilter).lean(),
      ProductView.find(viewDateFilter).lean(),
      CustomerEnquiry.find(enquiryDateFilter).lean(),
      CustomerEnquiry.countDocuments({ status: 'new' })
    ]);

    const totalPageViews = filteredEvents.filter(e => e.eventType === 'page_view').length || filteredViews.length;
    const productViews = filteredViews.length;
    const uniqueSessionIds = new Set(sessions.map(s => s.sessionId));
    const uniqueVisitorsInPeriod = new Set(sessions.map(s => s.visitorId)).size || totalVisitors;
    const returningVisitors = sessions.filter(s => {
      // If session duration or count indicates returning
      return s.pageViewsCount > 2;
    }).length;

    const totalEnquiries = enquiries.length;
    const conversionRate = uniqueVisitorsInPeriod > 0
      ? Number(((totalEnquiries / uniqueVisitorsInPeriod) * 100).toFixed(2))
      : 0;

    // Rank products
    const productViewCounts = {};
    filteredViews.forEach(v => {
      const pid = String(v.productId);
      productViewCounts[pid] = (productViewCounts[pid] || 0) + 1;
    });

    const rankedProducts = allProducts.map(p => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
      brandName: p.brand?.name || 'Unknown',
      categoryName: p.category?.name || p.cardCategory || 'General',
      isActive: p.isActive,
      periodViews: productViewCounts[String(p._id)] || 0,
      totalViews: Number(p.viewCount) || 0,
      primaryImage: (p.images && p.images[0]) ? p.images[0].url : ''
    })).sort((a, b) => b.periodViews - a.periodViews);

    // Build trend chart
    const daysCount = req.query.range === '7d' ? 7 : req.query.range === 'today' ? 1 : 14;
    const dailyMap = {};
    const now = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = formatDateKey(d);
      dailyMap[key] = {
        dateKey: key,
        label: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        visitors: new Set(),
        pageViews: 0,
        productViews: 0,
        enquiries: 0
      };
    }

    sessions.forEach(s => {
      const k = formatDateKey(s.startedAt);
      if (dailyMap[k]) dailyMap[k].visitors.add(s.visitorId);
    });

    filteredEvents.forEach(e => {
      const k = formatDateKey(e.timestamp);
      if (dailyMap[k]) {
        if (e.eventType === 'page_view') dailyMap[k].pageViews++;
        if (e.eventType === 'product_view') dailyMap[k].productViews++;
      }
    });

    enquiries.forEach(eq => {
      const k = formatDateKey(eq.createdAt);
      if (dailyMap[k]) dailyMap[k].enquiries++;
    });

    const dailyTrends = Object.values(dailyMap).map(item => ({
      dateKey: item.dateKey,
      label: item.label,
      visitors: item.visitors.size,
      pageViews: item.pageViews,
      productViews: item.productViews,
      enquiries: item.enquiries
    }));

    res.status(200).json({
      success: true,
      overview: {
        totalVisitors: uniqueVisitorsInPeriod,
        uniqueVisitors: uniqueVisitorsInPeriod,
        allTimeVisitors,
        totalPageViews,
        productViews,
        totalEnquiries,
        newEnquiries: newEnquiriesCount,
        returningVisitors,
        conversionRate,
        mostViewedProduct: rankedProducts[0] || null,
        leastViewedProduct: rankedProducts[rankedProducts.length - 1] || null,
        topProducts: rankedProducts.slice(0, 6),
        dailyTrends
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/analytics/visitors (Visitor List)
const getVisitorsList = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [visitors, total] = await Promise.all([
      AnalyticsVisitor.find({})
        .sort({ lastVisitAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AnalyticsVisitor.countDocuments({})
    ]);

    const maskedVisitors = visitors.map(v => ({
      ...v,
      maskedVisitorId: `vis_${v.visitorId.slice(0, 4)}...${v.visitorId.slice(-4)}`
    }));

    res.status(200).json({
      success: true,
      visitors: maskedVisitors,
      total,
      page,
      pages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/analytics/journeys (Browsing Journey Timeline)
const getVisitorJourneys = async (req, res, next) => {
  try {
    const { visitorId, sessionId, productId, eventType, limit = 50 } = req.query;
    const filter = {};

    if (visitorId) filter.visitorId = visitorId;
    if (sessionId) filter.sessionId = sessionId;
    if (productId) filter.productId = productId;
    if (eventType && eventType !== 'all') filter.eventType = eventType;

    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

    const events = await AnalyticsEvent.find(filter)
      .sort({ timestamp: -1 })
      .limit(limitNum)
      .lean();

    // Group events by session if no specific session is requested
    const sessionsMap = {};
    events.forEach(e => {
      const sId = e.sessionId;
      if (!sessionsMap[sId]) {
        sessionsMap[sId] = {
          sessionId: sId,
          visitorId: e.visitorId,
          maskedVisitorId: `vis_${e.visitorId.slice(0, 4)}...${e.visitorId.slice(-4)}`,
          firstEventTime: e.timestamp,
          lastEventTime: e.timestamp,
          events: []
        };
      }
      sessionsMap[sId].events.push(e);
      if (new Date(e.timestamp) > new Date(sessionsMap[sId].lastEventTime)) {
        sessionsMap[sId].lastEventTime = e.timestamp;
      }
      if (new Date(e.timestamp) < new Date(sessionsMap[sId].firstEventTime)) {
        sessionsMap[sId].firstEventTime = e.timestamp;
      }
    });

    res.status(200).json({
      success: true,
      events,
      journeys: Object.values(sessionsMap)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/analytics/traffic-sources (Traffic Source Breakdown)
const getTrafficSources = async (req, res, next) => {
  try {
    const sessionDateFilter = buildDateRangeFilter(req.query, 'startedAt');
    const sessions = await AnalyticsSession.find(sessionDateFilter).lean();

    const trafficMap = {
      direct: { count: 0, label: 'Direct Traffic' },
      organic_search: { count: 0, label: 'Search Engines (Google/Bing)' },
      referral: { count: 0, label: 'Referral Websites' },
      social: { count: 0, label: 'Social Media' },
      campaign: { count: 0, label: 'Campaigns / Marketing' }
    };

    const referrerCounts = {};
    const campaignCounts = {};
    const landingPageCounts = {};

    sessions.forEach(s => {
      const type = s.trafficType || 'direct';
      if (trafficMap[type]) trafficMap[type].count++;

      const ref = s.referrer || 'direct';
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;

      if (s.utmCampaign) {
        campaignCounts[s.utmCampaign] = (campaignCounts[s.utmCampaign] || 0) + 1;
      }

      const lp = s.landingPage || '/';
      landingPageCounts[lp] = (landingPageCounts[lp] || 0) + 1;
    });

    const sources = Object.entries(trafficMap).map(([key, val]) => ({
      source: key,
      label: val.label,
      visitors: val.count,
      percentage: sessions.length > 0 ? Number(((val.count / sessions.length) * 100).toFixed(1)) : 0
    }));

    const topReferrers = Object.entries(referrerCounts)
      .map(([ref, count]) => ({ referrer: ref, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topLandingPages = Object.entries(landingPageCounts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    res.status(200).json({
      success: true,
      totalSessions: sessions.length,
      sources,
      topReferrers,
      topLandingPages,
      campaigns: Object.entries(campaignCounts).map(([c, count]) => ({ campaign: c, count }))
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/analytics/devices (Device & Tech Stack Breakdown)
const getDeviceAnalytics = async (req, res, next) => {
  try {
    const sessionDateFilter = buildDateRangeFilter(req.query, 'startedAt');
    const sessions = await AnalyticsSession.find(sessionDateFilter).lean();

    const deviceMap = { desktop: 0, mobile: 0, tablet: 0 };
    const browserMap = {};
    const osMap = {};

    sessions.forEach(s => {
      const dev = (s.deviceCategory || 'desktop').toLowerCase();
      deviceMap[dev] = (deviceMap[dev] || 0) + 1;

      const br = s.browser || 'Chrome';
      browserMap[br] = (browserMap[br] || 0) + 1;

      const os = s.os || 'Windows';
      osMap[os] = (osMap[os] || 0) + 1;
    });

    const total = sessions.length || 1;

    const devices = [
      { category: 'Desktop', count: deviceMap.desktop || 0, percentage: Number(((deviceMap.desktop / total) * 100).toFixed(1)) },
      { category: 'Mobile', count: deviceMap.mobile || 0, percentage: Number(((deviceMap.mobile / total) * 100).toFixed(1)) },
      { category: 'Tablet', count: deviceMap.tablet || 0, percentage: Number(((deviceMap.tablet / total) * 100).toFixed(1)) }
    ];

    const browsers = Object.entries(browserMap)
      .map(([name, count]) => ({ name, count, percentage: Number(((count / total) * 100).toFixed(1)) }))
      .sort((a, b) => b.count - a.count);

    const operatingSystems = Object.entries(osMap)
      .map(([name, count]) => ({ name, count, percentage: Number(((count / total) * 100).toFixed(1)) }))
      .sort((a, b) => b.count - a.count);

    res.status(200).json({
      success: true,
      totalSessions: sessions.length,
      devices,
      browsers,
      operatingSystems
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/analytics/reports (Consolidated reports & CSV generation)
const getReports = async (req, res, next) => {
  try {
    const { type = 'overview', format = 'json' } = req.query;

    if (type === 'products') {
      const products = await Product.find({ deletedAt: null })
        .populate('brand', 'name')
        .populate('category', 'name')
        .sort({ viewCount: -1 })
        .lean();

      if (format === 'csv') {
        const headers = ['Product ID', 'Name', 'Brand', 'Category', 'View Count', 'Last Viewed'];
        const rows = products.map(p => [
          p._id,
          `"${(p.name || '').replace(/"/g, '""')}"`,
          `"${(p.brand?.name || '').replace(/"/g, '""')}"`,
          `"${(p.category?.name || p.cardCategory || '').replace(/"/g, '""')}"`,
          p.viewCount || 0,
          p.lastViewedAt ? new Date(p.lastViewedAt).toISOString() : 'Never'
        ]);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="sriyas-products-report-${Date.now()}.csv"`);
        return res.status(200).send([headers.join(','), ...rows.map(r => r.join(','))].join('\n'));
      }
      return res.status(200).json({ success: true, products });
    }

    if (type === 'enquiries') {
      const enquiries = await CustomerEnquiry.find({}).sort({ createdAt: -1 }).lean();
      if (format === 'csv') {
        const headers = ['ID', 'Date', 'Customer Name', 'Phone', 'Email', 'Company', 'Product', 'Status'];
        const rows = enquiries.map(e => [
          e._id,
          new Date(e.createdAt).toISOString(),
          `"${(e.name || '').replace(/"/g, '""')}"`,
          `"${(e.phone || '').replace(/"/g, '""')}"`,
          `"${(e.email || '').replace(/"/g, '""')}"`,
          `"${(e.company || '').replace(/"/g, '""')}"`,
          `"${(e.productOfInterest?.productName || '').replace(/"/g, '""')}"`,
          e.status
        ]);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="sriyas-enquiries-report-${Date.now()}.csv"`);
        return res.status(200).send([headers.join(','), ...rows.map(r => r.join(','))].join('\n'));
      }
      return res.status(200).json({ success: true, enquiries });
    }

    // Default Overview Report
    const [totalProducts, totalVisitors, totalSessions, totalEnquiries] = await Promise.all([
      Product.countDocuments({ deletedAt: null }),
      AnalyticsVisitor.countDocuments({}),
      AnalyticsSession.countDocuments({}),
      CustomerEnquiry.countDocuments({})
    ]);

    res.status(200).json({
      success: true,
      summary: {
        totalProducts,
        totalVisitors,
        totalSessions,
        totalEnquiries
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PRESERVED PRODUCT & CATEGORY ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

const getProductAnalytics = async (req, res, next) => {
  try {
    const products = await Product.find({ deletedAt: null })
      .populate('brand', 'name slug')
      .populate('category', 'name slug')
      .sort({ viewCount: -1 });

    const totalViews = products.reduce((sum, p) => sum + (Number(p.viewCount) || 0), 0);

    res.status(200).json({
      success: true,
      totalProducts: products.length,
      totalViews,
      products: products.map(p => ({
        _id: p._id,
        name: p.name,
        slug: p.slug,
        brandName: p.brand?.name || 'Unknown',
        categoryName: p.category?.name || p.cardCategory || 'General',
        viewCount: Number(p.viewCount) || 0,
        lastViewedAt: p.lastViewedAt,
        primaryImage: (p.images && p.images[0]) ? p.images[0].url : ''
      }))
    });
  } catch (error) {
    next(error);
  }
};

const getBrandAnalytics = async (req, res, next) => {
  try {
    const brands = await Brand.find({ isActive: true });
    const products = await Product.find({ deletedAt: null }).lean();

    const brandStats = brands.map(b => {
      const bProds = products.filter(p => String(p.brand) === String(b._id));
      const totalViews = bProds.reduce((sum, p) => sum + (Number(p.viewCount) || 0), 0);
      return {
        _id: b._id,
        name: b.name,
        slug: b.slug,
        productCount: bProds.length,
        totalViews
      };
    }).sort((a, b) => b.totalViews - a.totalViews);

    res.status(200).json({ success: true, brands: brandStats });
  } catch (error) {
    next(error);
  }
};

const getCategoryAnalytics = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).populate('brand', 'name');
    const products = await Product.find({ deletedAt: null }).lean();

    const catStats = categories.map(c => {
      const cProds = products.filter(p => String(p.category) === String(c._id));
      const totalViews = cProds.reduce((sum, p) => sum + (Number(p.viewCount) || 0), 0);
      return {
        _id: c._id,
        name: c.name,
        slug: c.slug,
        brandName: c.brand?.name || '',
        productCount: cProds.length,
        totalViews
      };
    }).sort((a, b) => b.totalViews - a.totalViews);

    res.status(200).json({ success: true, categories: catStats });
  } catch (error) {
    next(error);
  }
};

const getViewTrends = async (req, res, next) => {
  try {
    const views = await ProductView.find({}).sort({ viewedAt: 1 }).lean();
    res.status(200).json({ success: true, count: views.length });
  } catch (error) {
    next(error);
  }
};

const getRecentViews = async (req, res, next) => {
  try {
    const views = await ProductView.find({}).sort({ viewedAt: -1 }).limit(30).lean();
    res.status(200).json({ success: true, recentViews: views });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startAnalyticsSession,
  recordAnalyticsEvent,
  recordProductView,
  getAnalyticsOverview,
  getVisitorsList,
  getVisitorJourneys,
  getTrafficSources,
  getDeviceAnalytics,
  getReports,
  getProductAnalytics,
  getBrandAnalytics,
  getCategoryAnalytics,
  getViewTrends,
  getRecentViews
};
