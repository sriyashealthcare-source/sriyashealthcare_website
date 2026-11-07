const ProductView = require('../models/ProductView');
const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Category = require('../models/Category');

function buildDateRangeFilter(query = {}) {
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

  const viewedAtFilter = {};
  if (start) viewedAtFilter.$gte = start;
  if (end) viewedAtFilter.$lte = end;
  return Object.keys(viewedAtFilter).length > 0 ? { viewedAt: viewedAtFilter } : {};
}

function formatDateKey(dateObj) {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatWeekKey(dateObj) {
  const d = new Date(dateObj);
  const dayOfWeek = d.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return formatDateKey(monday);
}

function formatMonthKey(dateObj) {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// POST /api/analytics/product-view (Public)
const recordProductView = async (req, res, next) => {
  try {
    const { productId, visitorSessionId, source } = req.body || {};

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required.'
      });
    }

    const idStr = String(productId).trim();
    const product = await Product.findOne({
      isActive: true,
      deletedAt: null,
      $or: [
        { _id: idStr },
        { slug: idStr.toLowerCase() },
        { legacyId: idStr.toLowerCase() }
      ]
    })
      .populate('brand', 'name slug')
      .populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found for analytics tracking.'
      });
    }

    const sessionId = String(visitorSessionId || 'anon_session').trim().slice(0, 80);
    const cleanSource = String(source || 'direct').trim().slice(0, 160);

    // Duplicate protection: ignore repeat view from same session within 30 seconds
    const thirtySecsAgo = new Date(Date.now() - 30 * 1000);
    const recentDuplicate = await ProductView.findOne({
      productId: product._id,
      visitorSessionId: sessionId,
      viewedAt: { $gte: thirtySecsAgo }
    });

    if (recentDuplicate) {
      return res.status(200).json({
        success: true,
        deduplicated: true,
        message: 'Recent view already recorded for this session.'
      });
    }

    const now = new Date();
    const brandName = (product.brand && product.brand.name) ? product.brand.name : 'Sriyas Healthcare';
    const categoryName = (product.category && product.category.name) ? product.category.name : (product.cardCategory || 'General');

    await ProductView.create({
      productId: product._id,
      productSlug: product.slug || '',
      productName: product.name,
      brandId: product.brand ? product.brand._id : null,
      brandName,
      categoryId: product.category ? product.category._id : null,
      categoryName,
      visitorSessionId: sessionId,
      viewedAt: now,
      source: cleanSource
    });

    await Product.findByIdAndUpdate(product._id, {
      $inc: { viewCount: 1 },
      $set: { lastViewedAt: now }
    });

    res.status(201).json({
      success: true,
      deduplicated: false,
      message: 'Product view recorded.'
    });
  } catch (error) {
    // Fail gracefully for analytics requests
    console.warn('[Analytics] Error recording product view:', error.message);
    res.status(200).json({
      success: false,
      message: 'Could not record product view.'
    });
  }
};

// GET /api/admin/analytics/overview
const getAnalyticsOverview = async (req, res, next) => {
  try {
    const dateFilter = buildDateRangeFilter(req.query);

    const allProducts = await Product.find({})
      .populate('brand', 'name slug')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    const nonArchivedProducts = allProducts.filter(p => !p.deletedAt);
    const totalProducts = nonArchivedProducts.length;
    const activeProducts = nonArchivedProducts.filter(p => p.isActive).length;
    const inactiveProducts = nonArchivedProducts.filter(p => !p.isActive).length;
    const archivedProducts = allProducts.filter(p => Boolean(p.deletedAt)).length;

    const allViews = await ProductView.find({}).sort({ viewedAt: -1 });
    const filteredViews = Object.keys(dateFilter).length > 0
      ? await ProductView.find(dateFilter).sort({ viewedAt: -1 })
      : allViews;

    const uniqueSessionSet = new Set(filteredViews.map(v => v.visitorSessionId).filter(Boolean));

    // Count views per product in the filtered period
    const periodViewMap = {};
    const lastViewedMap = {};
    for (const v of filteredViews) {
      const pid = String(v.productId);
      periodViewMap[pid] = (periodViewMap[pid] || 0) + 1;
      if (!lastViewedMap[pid] || new Date(v.viewedAt) > new Date(lastViewedMap[pid])) {
        lastViewedMap[pid] = v.viewedAt;
      }
    }

    // Rank products by views
    const rankedProducts = nonArchivedProducts.map(p => {
      const pid = String(p._id);
      return {
        _id: p._id,
        name: p.name,
        slug: p.slug,
        brandName: p.brand?.name || 'Unknown',
        categoryName: p.category?.name || p.cardCategory || 'General',
        isActive: p.isActive,
        totalViews: Number(p.viewCount) || 0,
        periodViews: periodViewMap[pid] || 0,
        lastViewedAt: lastViewedMap[pid] || p.lastViewedAt || null,
        primaryImage: (p.images && p.images[0]) ? p.images[0].url : ''
      };
    });

    const sortedByPeriodViews = [...rankedProducts].sort((a, b) => {
      if (b.periodViews !== a.periodViews) return b.periodViews - a.periodViews;
      return b.totalViews - a.totalViews;
    });

    const mostViewedProduct = sortedByPeriodViews[0] || null;
    const leastViewedProduct = sortedByPeriodViews.length > 0
      ? sortedByPeriodViews[sortedByPeriodViews.length - 1]
      : null;

    const recentlyAddedProducts = nonArchivedProducts.slice(0, 6).map(p => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
      brandName: p.brand?.name || '',
      categoryName: p.category?.name || p.cardCategory || '',
      isActive: p.isActive,
      viewCount: Number(p.viewCount) || 0,
      createdAt: p.createdAt,
      primaryImage: (p.images && p.images[0]) ? p.images[0].url : ''
    }));

    const recentlyViewedProducts = filteredViews.slice(0, 8).map(v => ({
      _id: v._id,
      productId: v.productId,
      productSlug: v.productSlug,
      productName: v.productName,
      brandName: v.brandName,
      categoryName: v.categoryName,
      visitorSessionId: v.visitorSessionId,
      viewedAt: v.viewedAt,
      source: v.source
    }));

    // Build daily trends for last N days (default 14 days if range is 30d/all, or 7 days if 7d)
    const daysCount = req.query.range === '7d' ? 7 : req.query.range === 'today' ? 1 : 14;
    const dailyMap = {};
    const now = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = formatDateKey(d);
      dailyMap[key] = {
        dateKey: key,
        label: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        views: 0,
        sessions: new Set()
      };
    }

    for (const v of filteredViews) {
      const key = formatDateKey(v.viewedAt);
      if (dailyMap[key]) {
        dailyMap[key].views += 1;
        if (v.visitorSessionId) dailyMap[key].sessions.add(v.visitorSessionId);
      }
    }

    const dailyTrends = Object.values(dailyMap).map(item => ({
      dateKey: item.dateKey,
      label: item.label,
      views: item.views,
      uniqueVisitors: item.sessions.size
    }));

    res.status(200).json({
      success: true,
      overview: {
        totalProducts,
        activeProducts,
        inactiveProducts,
        archivedProducts,
        totalViews: filteredViews.length,
        allTimeViews: allViews.length,
        uniqueSessions: uniqueSessionSet.size,
        mostViewedProduct,
        leastViewedProduct,
        recentlyAddedProducts,
        recentlyViewedProducts,
        topProducts: sortedByPeriodViews.slice(0, 8),
        dailyTrends
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/analytics/products
const getProductAnalytics = async (req, res, next) => {
  try {
    const { search = '', brand = '', category = '', sort = 'views-desc' } = req.query;
    const dateFilter = buildDateRangeFilter(req.query);

    const allProducts = await Product.find({})
      .populate('brand', 'name slug')
      .populate('category', 'name slug');

    const allViews = await ProductView.find({});
    const filteredViews = Object.keys(dateFilter).length > 0
      ? await ProductView.find(dateFilter)
      : allViews;

    // Aggregate views by productId (both existing and any historical deleted products)
    const periodStats = {};
    for (const v of filteredViews) {
      const pid = String(v.productId);
      if (!periodStats[pid]) {
        periodStats[pid] = {
          views: 0,
          sessions: new Set(),
          lastViewedAt: null,
          snapshotName: v.productName,
          snapshotBrand: v.brandName,
          snapshotCategory: v.categoryName
        };
      }
      periodStats[pid].views += 1;
      if (v.visitorSessionId) periodStats[pid].sessions.add(v.visitorSessionId);
      if (!periodStats[pid].lastViewedAt || new Date(v.viewedAt) > new Date(periodStats[pid].lastViewedAt)) {
        periodStats[pid].lastViewedAt = v.viewedAt;
      }
    }

    const allTimeStats = {};
    for (const v of allViews) {
      const pid = String(v.productId);
      if (!allTimeStats[pid]) {
        allTimeStats[pid] = { views: 0, lastViewedAt: null };
      }
      allTimeStats[pid].views += 1;
      if (!allTimeStats[pid].lastViewedAt || new Date(v.viewedAt) > new Date(allTimeStats[pid].lastViewedAt)) {
        allTimeStats[pid].lastViewedAt = v.viewedAt;
      }
    }

    let rows = allProducts.map(p => {
      const pid = String(p._id);
      const pStat = periodStats[pid] || { views: 0, sessions: new Set(), lastViewedAt: null };
      const aStat = allTimeStats[pid] || { views: Number(p.viewCount) || 0, lastViewedAt: p.lastViewedAt };

      return {
        _id: p._id,
        name: p.name,
        slug: p.slug,
        brandId: p.brand?._id || null,
        brandSlug: p.brand?.slug || '',
        brandName: p.brand?.name || 'Sriyas Healthcare',
        categoryId: p.category?._id || null,
        categorySlug: p.category?.slug || '',
        categoryName: p.category?.name || p.cardCategory || 'General',
        isActive: p.isActive && !p.deletedAt,
        isArchived: Boolean(p.deletedAt),
        totalViews: pStat.views,
        allTimeViews: Math.max(aStat.views, Number(p.viewCount) || 0),
        uniqueVisitors: pStat.sessions.size,
        lastViewedAt: pStat.lastViewedAt || aStat.lastViewedAt || p.lastViewedAt || null,
        primaryImage: (p.images && p.images[0]) ? p.images[0].url : ''
      };
    });

    // Include historical deleted products that have views in periodStats
    const existingIds = new Set(allProducts.map(p => String(p._id)));
    for (const [pid, stat] of Object.entries(periodStats)) {
      if (!existingIds.has(pid)) {
        rows.push({
          _id: pid,
          name: `${stat.snapshotName} (Removed)`,
          slug: '',
          brandId: null,
          brandSlug: '',
          brandName: stat.snapshotBrand || 'Archived',
          categoryId: null,
          categorySlug: '',
          categoryName: stat.snapshotCategory || 'Archived',
          isActive: false,
          isArchived: true,
          totalViews: stat.views,
          allTimeViews: allTimeStats[pid]?.views || stat.views,
          uniqueVisitors: stat.sessions.size,
          lastViewedAt: stat.lastViewedAt,
          primaryImage: ''
        });
      }
    }

    if (brand) {
      const bLower = String(brand).toLowerCase();
      rows = rows.filter(r =>
        String(r.brandId) === String(brand) ||
        r.brandSlug.toLowerCase() === bLower ||
        r.brandName.toLowerCase() === bLower
      );
    }

    if (category) {
      const cLower = String(category).toLowerCase();
      rows = rows.filter(r =>
        String(r.categoryId) === String(category) ||
        r.categorySlug.toLowerCase() === cLower ||
        r.categoryName.toLowerCase() === cLower
      );
    }

    if (search && String(search).trim()) {
      const q = String(search).trim().toLowerCase();
      rows = rows.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.brandName.toLowerCase().includes(q) ||
        r.categoryName.toLowerCase().includes(q)
      );
    }

    if (sort === 'views-asc') {
      rows.sort((a, b) => a.totalViews - b.totalViews || a.name.localeCompare(b.name));
    } else if (sort === 'recent') {
      rows.sort((a, b) => {
        const ta = a.lastViewedAt ? new Date(a.lastViewedAt).getTime() : 0;
        const tb = b.lastViewedAt ? new Date(b.lastViewedAt).getTime() : 0;
        return tb - ta;
      });
    } else if (sort === 'name') {
      rows.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      rows.sort((a, b) => b.totalViews - a.totalViews || b.allTimeViews - a.allTimeViews || a.name.localeCompare(b.name));
    }

    const sortedDesc = [...rows].sort((a, b) => b.totalViews - a.totalViews || a.name.localeCompare(b.name));
    const sortedAsc = [...rows].sort((a, b) => a.totalViews - b.totalViews || a.name.localeCompare(b.name));

    res.status(200).json({
      success: true,
      count: rows.length,
      totalViewsInPeriod: filteredViews.length,
      products: rows,
      mostViewed: sortedDesc.slice(0, 10),
      leastViewed: sortedAsc.slice(0, 10)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/analytics/brands
const getBrandAnalytics = async (req, res, next) => {
  try {
    const dateFilter = buildDateRangeFilter(req.query);
    const brands = await Brand.find({}).sort({ displayOrder: 1 });
    const products = await Product.find({ deletedAt: null });
    const views = Object.keys(dateFilter).length > 0
      ? await ProductView.find(dateFilter)
      : await ProductView.find({});

    const totalViews = views.length;
    const brandMap = {};

    for (const b of brands) {
      brandMap[b.name] = {
        _id: b._id,
        brandName: b.name,
        slug: b.slug,
        icon: b.icon,
        productCount: products.filter(p => String(p.brand) === String(b._id)).length,
        totalViews: 0,
        sessions: new Set()
      };
    }

    for (const v of views) {
      const bName = v.brandName || 'Other';
      if (!brandMap[bName]) {
        brandMap[bName] = {
          _id: v.brandId || bName,
          brandName: bName,
          slug: '',
          icon: '🔬',
          productCount: 0,
          totalViews: 0,
          sessions: new Set()
        };
      }
      brandMap[bName].totalViews += 1;
      if (v.visitorSessionId) brandMap[bName].sessions.add(v.visitorSessionId);
    }

    const result = Object.values(brandMap)
      .map(item => ({
        _id: item._id,
        brandName: item.brandName,
        slug: item.slug,
        icon: item.icon,
        productCount: item.productCount,
        totalViews: item.totalViews,
        uniqueVisitors: item.sessions.size,
        percentage: totalViews > 0 ? Number(((item.totalViews / totalViews) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.totalViews - a.totalViews || a.brandName.localeCompare(b.brandName));

    res.status(200).json({
      success: true,
      totalViews,
      brands: result
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/analytics/categories
const getCategoryAnalytics = async (req, res, next) => {
  try {
    const dateFilter = buildDateRangeFilter(req.query);
    const categories = await Category.find({}).populate('brand', 'name slug').sort({ displayOrder: 1 });
    const products = await Product.find({ deletedAt: null });
    const views = Object.keys(dateFilter).length > 0
      ? await ProductView.find(dateFilter)
      : await ProductView.find({});

    const totalViews = views.length;
    const catMap = {};

    for (const c of categories) {
      const key = String(c._id);
      catMap[key] = {
        _id: c._id,
        categoryName: c.name,
        slug: c.slug,
        brandName: c.brand?.name || '',
        productCount: products.filter(p => String(p.category) === key).length,
        totalViews: 0,
        sessions: new Set()
      };
    }

    for (const v of views) {
      const cid = v.categoryId ? String(v.categoryId) : null;
      const matchKey = (cid && catMap[cid])
        ? cid
        : Object.keys(catMap).find(k => catMap[k].categoryName === v.categoryName);

      if (matchKey && catMap[matchKey]) {
        catMap[matchKey].totalViews += 1;
        if (v.visitorSessionId) catMap[matchKey].sessions.add(v.visitorSessionId);
      } else {
        const fallbackKey = `snap_${v.categoryName || 'General'}`;
        if (!catMap[fallbackKey]) {
          catMap[fallbackKey] = {
            _id: fallbackKey,
            categoryName: v.categoryName || 'General',
            slug: '',
            brandName: v.brandName || '',
            productCount: 0,
            totalViews: 0,
            sessions: new Set()
          };
        }
        catMap[fallbackKey].totalViews += 1;
        if (v.visitorSessionId) catMap[fallbackKey].sessions.add(v.visitorSessionId);
      }
    }

    const result = Object.values(catMap)
      .map(item => ({
        _id: item._id,
        categoryName: item.categoryName,
        slug: item.slug,
        brandName: item.brandName,
        productCount: item.productCount,
        totalViews: item.totalViews,
        uniqueVisitors: item.sessions.size,
        percentage: totalViews > 0 ? Number(((item.totalViews / totalViews) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.totalViews - a.totalViews || a.categoryName.localeCompare(b.categoryName));

    res.status(200).json({
      success: true,
      totalViews,
      categories: result
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/analytics/trends
const getViewTrends = async (req, res, next) => {
  try {
    const { granularity = 'daily' } = req.query;
    const dateFilter = buildDateRangeFilter(req.query);
    const views = Object.keys(dateFilter).length > 0
      ? await ProductView.find(dateFilter).sort({ viewedAt: 1 })
      : await ProductView.find({}).sort({ viewedAt: 1 });

    const now = new Date();

    // 1. Daily series (last 14 or 30 days depending on range)
    const dailyDays = req.query.range === '7d' ? 7 : req.query.range === '90d' ? 30 : 14;
    const dailyBuckets = {};
    for (let i = dailyDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const k = formatDateKey(d);
      dailyBuckets[k] = {
        dateKey: k,
        label: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        views: 0,
        sessions: new Set()
      };
    }

    // 2. Weekly series (last 8 weeks)
    const weeklyBuckets = {};
    for (let w = 7; w >= 0; w--) {
      const d = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
      const wk = formatWeekKey(d);
      const wkDate = new Date(wk);
      weeklyBuckets[wk] = {
        dateKey: wk,
        label: `Wk of ${wkDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`,
        views: 0,
        sessions: new Set()
      };
    }

    // 3. Monthly series (last 6 months)
    const monthlyBuckets = {};
    for (let m = 5; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const mk = formatMonthKey(d);
      monthlyBuckets[mk] = {
        dateKey: mk,
        label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        views: 0,
        sessions: new Set()
      };
    }

    for (const v of views) {
      const dk = formatDateKey(v.viewedAt);
      if (dailyBuckets[dk]) {
        dailyBuckets[dk].views += 1;
        if (v.visitorSessionId) dailyBuckets[dk].sessions.add(v.visitorSessionId);
      }

      const wk = formatWeekKey(v.viewedAt);
      if (weeklyBuckets[wk]) {
        weeklyBuckets[wk].views += 1;
        if (v.visitorSessionId) weeklyBuckets[wk].sessions.add(v.visitorSessionId);
      }

      const mk = formatMonthKey(v.viewedAt);
      if (monthlyBuckets[mk]) {
        monthlyBuckets[mk].views += 1;
        if (v.visitorSessionId) monthlyBuckets[mk].sessions.add(v.visitorSessionId);
      }
    }

    const daily = Object.values(dailyBuckets).map(b => ({
      dateKey: b.dateKey,
      label: b.label,
      views: b.views,
      uniqueVisitors: b.sessions.size
    }));

    const weekly = Object.values(weeklyBuckets).map(b => ({
      dateKey: b.dateKey,
      label: b.label,
      views: b.views,
      uniqueVisitors: b.sessions.size
    }));

    const monthly = Object.values(monthlyBuckets).map(b => ({
      dateKey: b.dateKey,
      label: b.label,
      views: b.views,
      uniqueVisitors: b.sessions.size
    }));

    const activeSeries = granularity === 'weekly' ? weekly : granularity === 'monthly' ? monthly : daily;

    res.status(200).json({
      success: true,
      granularity,
      series: activeSeries,
      daily,
      weekly,
      monthly
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/analytics/recent-views
const getRecentViews = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const dateFilter = buildDateRangeFilter(req.query);

    const allFiltered = await ProductView.find(dateFilter).sort({ viewedAt: -1 });
    const total = allFiltered.length;
    const startIdx = (page - 1) * limit;
    const recentViews = allFiltered.slice(startIdx, startIdx + limit);

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      recentViews
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordProductView,
  getAnalyticsOverview,
  getProductAnalytics,
  getBrandAnalytics,
  getCategoryAnalytics,
  getViewTrends,
  getRecentViews
};

