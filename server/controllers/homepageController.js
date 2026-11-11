const crypto = require('crypto');
const HomepageContent = require('../models/HomepageContent');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { uploadBuffer, deleteAsset, CLOUDINARY_FOLDERS } = require('../config/cloudinary');
const {
  CANONICAL_SECTION_ORDER,
  createDefaultHomepagePayload,
  ensureHomepageInitialized,
  deepClone
} = require('../config/defaultHomepageContent');

function makeItemId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function cleanText(val, fallback = '', maxLen = 2000) {
  if (typeof val !== 'string') return fallback;
  return val.trim().slice(0, maxLen);
}

function cleanBool(val, fallback = true) {
  if (typeof val === 'boolean') return val;
  return fallback;
}

function cleanUrl(val, fallback = '') {
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  if (!trimmed) return '';
  if (/^(javascript|vbscript|data):/i.test(trimmed)) {
    return fallback;
  }
  return trimmed.slice(0, 1000);
}

function cleanMediaRef(raw, fallback = { url: '', publicId: '', alt: '' }) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    url: cleanUrl(src.url, fallback.url || ''),
    publicId: cleanText(src.publicId, fallback.publicId || '', 300),
    alt: cleanText(src.alt, fallback.alt || '', 240)
  };
}

function normalizeSectionOrder(rawOrder) {
  const incoming = Array.isArray(rawOrder) ? rawOrder.map(String) : [];
  const seen = new Set();
  const result = [];

  for (const key of incoming) {
    if (CANONICAL_SECTION_ORDER.includes(key) && !seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  for (const key of CANONICAL_SECTION_ORDER) {
    if (!seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  return result;
}

function sanitizeAboutImages(rawImages) {
  if (!Array.isArray(rawImages)) return [];
  const allowedSizes = new Set(['primary', 'secondary', 'accent']);
  return rawImages
    .slice(0, 8)
    .map((img, idx) => {
      const item = img && typeof img === 'object' ? img : {};
      return {
        id: cleanText(item.id, '', 80) || makeItemId('about-img'),
        url: cleanUrl(item.url, ''),
        publicId: cleanText(item.publicId, '', 300),
        caption: cleanText(item.caption, '', 240),
        size: allowedSizes.has(item.size) ? item.size : 'primary',
        displayOrder: Number.isFinite(Number(item.displayOrder)) ? Number(item.displayOrder) : idx + 1
      };
    })
    .filter((img) => Boolean(img.url))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function sanitizeWhatWeDoItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .slice(0, 12)
    .map((entry, idx) => {
      const item = entry && typeof entry === 'object' ? entry : {};
      return {
        id: cleanText(item.id, '', 80) || makeItemId('wwd'),
        title: cleanText(item.title, '', 160),
        description: cleanText(item.description, '', 600),
        icon: cleanText(item.icon, '🩺', 24) || '🩺',
        image: cleanMediaRef(item.image),
        linkUrl: cleanUrl(item.linkUrl, '/products') || '/products',
        displayOrder: Number.isFinite(Number(item.displayOrder)) ? Number(item.displayOrder) : idx + 1,
        isActive: cleanBool(item.isActive, true)
      };
    })
    .filter((item) => Boolean(item.title))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function sanitizeFounderItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .slice(0, 16)
    .map((entry, idx) => {
      const item = entry && typeof entry === 'object' ? entry : {};
      return {
        id: cleanText(item.id, '', 80) || makeItemId('founder'),
        name: cleanText(item.name, '', 140),
        designation: cleanText(item.designation, '', 160),
        bio: cleanText(item.bio, '', 1200),
        photo: cleanMediaRef(item.photo),
        linkedinUrl: cleanUrl(item.linkedinUrl, ''),
        email: cleanText(item.email, '', 180),
        displayOrder: Number.isFinite(Number(item.displayOrder)) ? Number(item.displayOrder) : idx + 1,
        isActive: cleanBool(item.isActive, true)
      };
    })
    .filter((item) => Boolean(item.name))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function sanitizeWhyChooseItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .slice(0, 12)
    .map((entry, idx) => {
      const item = entry && typeof entry === 'object' ? entry : {};
      return {
        id: cleanText(item.id, '', 80) || makeItemId('wcu'),
        title: cleanText(item.title, '', 160),
        description: cleanText(item.description, '', 600),
        icon: cleanText(item.icon, '✦', 24) || '✦',
        displayOrder: Number.isFinite(Number(item.displayOrder)) ? Number(item.displayOrder) : idx + 1,
        isActive: cleanBool(item.isActive, true)
      };
    })
    .filter((item) => Boolean(item.title))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function cleanIdList(rawIds, limit = 30) {
  if (!Array.isArray(rawIds)) return [];
  const seen = new Set();
  const out = [];
  for (const val of rawIds) {
    const str = String(val || '').trim();
    if (str && !seen.has(str)) {
      seen.add(str);
      out.push(str);
      if (out.length >= limit) break;
    }
  }
  return out;
}

function sanitizeSnapshot(rawInput, fallbackSnapshot) {
  const base = fallbackSnapshot ? deepClone(fallbackSnapshot) : createDefaultHomepagePayload();
  const input = rawInput && typeof rawInput === 'object' ? rawInput : {};
  const allowedPresets = new Set(['split-collage', 'editorial-stacked', 'centered-feature']);

  const heroIn = input.hero && typeof input.hero === 'object' ? input.hero : base.hero;
  const aboutIn = input.about && typeof input.about === 'object' ? input.about : base.about;
  const wwdIn = input.whatWeDo && typeof input.whatWeDo === 'object' ? input.whatWeDo : base.whatWeDo;
  const foundersIn = input.founders && typeof input.founders === 'object' ? input.founders : base.founders;
  const catIn =
    input.productCategories && typeof input.productCategories === 'object'
      ? input.productCategories
      : base.productCategories;
  const partnersIn = input.partners && typeof input.partners === 'object' ? input.partners : base.partners;
  const wcuIn = input.whyChooseUs && typeof input.whyChooseUs === 'object' ? input.whyChooseUs : base.whyChooseUs;
  const ctaIn = input.callToAction && typeof input.callToAction === 'object' ? input.callToAction : base.callToAction;

  const maxDisplayNum = Number(catIn.maxDisplay);
  const clampedMaxDisplay = Number.isFinite(maxDisplayNum) ? Math.min(24, Math.max(1, Math.round(maxDisplayNum))) : 8;

  return {
    hero: {
      companyName: cleanText(heroIn.companyName, base.hero.companyName, 80) || 'SRIYAS',
      companySubtitle: cleanText(heroIn.companySubtitle, base.hero.companySubtitle, 100),
      tagline: cleanText(heroIn.tagline, base.hero.tagline, 240),
      valuesText: cleanText(heroIn.valuesText, base.hero.valuesText, 120),
      ctaText: cleanText(heroIn.ctaText, base.hero.ctaText, 60) || 'Explore Sriyas',
      ctaLink: cleanUrl(heroIn.ctaLink, base.hero.ctaLink) || '#about-sriyas',
      secondaryCtaText: cleanText(heroIn.secondaryCtaText, base.hero.secondaryCtaText, 60),
      secondaryCtaLink: cleanUrl(heroIn.secondaryCtaLink, base.hero.secondaryCtaLink) || '/products',
      showTagline: cleanBool(heroIn.showTagline, base.hero.showTagline),
      showValues: cleanBool(heroIn.showValues, base.hero.showValues),
      showSecondaryCta: cleanBool(heroIn.showSecondaryCta, base.hero.showSecondaryCta),
      logo: cleanMediaRef(heroIn.logo, base.hero.logo)
    },
    about: {
      enabled: cleanBool(aboutIn.enabled, base.about.enabled),
      eyebrow: cleanText(aboutIn.eyebrow, base.about.eyebrow, 80),
      heading: cleanText(aboutIn.heading, base.about.heading, 180),
      introduction: cleanText(aboutIn.introduction, base.about.introduction, 1500),
      supportingText: cleanText(aboutIn.supportingText, base.about.supportingText, 1500),
      vision: cleanText(aboutIn.vision, base.about.vision, 800),
      mission: cleanText(aboutIn.mission, base.about.mission, 800),
      layoutPreset: allowedPresets.has(aboutIn.layoutPreset) ? aboutIn.layoutPreset : base.about.layoutPreset,
      images: Array.isArray(aboutIn.images) ? sanitizeAboutImages(aboutIn.images) : base.about.images
    },
    whatWeDo: {
      enabled: cleanBool(wwdIn.enabled, base.whatWeDo.enabled),
      eyebrow: cleanText(wwdIn.eyebrow, base.whatWeDo.eyebrow, 80),
      heading: cleanText(wwdIn.heading, base.whatWeDo.heading, 180),
      subtitle: cleanText(wwdIn.subtitle, base.whatWeDo.subtitle, 500),
      items: Array.isArray(wwdIn.items) ? sanitizeWhatWeDoItems(wwdIn.items) : base.whatWeDo.items
    },
    founders: {
      enabled: cleanBool(foundersIn.enabled, base.founders.enabled),
      eyebrow: cleanText(foundersIn.eyebrow, base.founders.eyebrow, 80),
      heading: cleanText(foundersIn.heading, base.founders.heading, 180),
      subtitle: cleanText(foundersIn.subtitle, base.founders.subtitle, 500),
      items: Array.isArray(foundersIn.items) ? sanitizeFounderItems(foundersIn.items) : base.founders.items
    },
    productCategories: {
      enabled: cleanBool(catIn.enabled, base.productCategories.enabled),
      eyebrow: cleanText(catIn.eyebrow, base.productCategories.eyebrow, 80),
      heading: cleanText(catIn.heading, base.productCategories.heading, 180),
      subtitle: cleanText(catIn.subtitle, base.productCategories.subtitle, 500),
      selectedCategoryIds: cleanIdList(catIn.selectedCategoryIds, 24),
      maxDisplay: clampedMaxDisplay,
      ctaText: cleanText(catIn.ctaText, base.productCategories.ctaText, 60) || 'Explore Product Catalogue',
      ctaLink: cleanUrl(catIn.ctaLink, base.productCategories.ctaLink) || '/products'
    },
    partners: {
      enabled: cleanBool(partnersIn.enabled, base.partners.enabled),
      eyebrow: cleanText(partnersIn.eyebrow, base.partners.eyebrow, 80),
      heading: cleanText(partnersIn.heading, base.partners.heading, 180),
      subtitle: cleanText(partnersIn.subtitle, base.partners.subtitle, 500),
      selectedBrandIds: cleanIdList(partnersIn.selectedBrandIds, 24),
      ctaText: cleanText(partnersIn.ctaText, base.partners.ctaText, 60) || 'Explore All Partners',
      ctaLink: cleanUrl(partnersIn.ctaLink, base.partners.ctaLink) || '/products'
    },
    whyChooseUs: {
      enabled: cleanBool(wcuIn.enabled, base.whyChooseUs.enabled),
      eyebrow: cleanText(wcuIn.eyebrow, base.whyChooseUs.eyebrow, 80),
      heading: cleanText(wcuIn.heading, base.whyChooseUs.heading, 180),
      subtitle: cleanText(wcuIn.subtitle, base.whyChooseUs.subtitle, 500),
      items: Array.isArray(wcuIn.items) ? sanitizeWhyChooseItems(wcuIn.items) : base.whyChooseUs.items
    },
    callToAction: {
      enabled: cleanBool(ctaIn.enabled, base.callToAction.enabled),
      eyebrow: cleanText(ctaIn.eyebrow, base.callToAction.eyebrow, 80),
      heading: cleanText(ctaIn.heading, base.callToAction.heading, 200),
      supportingText: cleanText(ctaIn.supportingText, base.callToAction.supportingText, 600),
      primaryButtonText: cleanText(ctaIn.primaryButtonText, base.callToAction.primaryButtonText, 60) || 'Explore Products',
      primaryButtonLink: cleanUrl(ctaIn.primaryButtonLink, base.callToAction.primaryButtonLink) || '/products',
      secondaryButtonText: cleanText(ctaIn.secondaryButtonText, base.callToAction.secondaryButtonText, 60) || 'Contact Us',
      secondaryButtonLink: cleanUrl(ctaIn.secondaryButtonLink, base.callToAction.secondaryButtonLink) || '/contact'
    },
    sectionOrder: normalizeSectionOrder(input.sectionOrder || base.sectionOrder)
  };
}

function toPlainObject(doc) {
  if (!doc) return null;
  return typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
}

function collectPublicIds(obj, bucket = new Set()) {
  if (!obj || typeof obj !== 'object') return bucket;
  if (Array.isArray(obj)) {
    for (const item of obj) collectPublicIds(item, bucket);
    return bucket;
  }
  if (typeof obj.publicId === 'string' && obj.publicId.trim()) {
    bucket.add(obj.publicId.trim());
  }
  for (const val of Object.values(obj)) {
    if (val && typeof val === 'object') {
      collectPublicIds(val, bucket);
    }
  }
  return bucket;
}

async function cleanupOrphanedAssets(previousIds, currentDraft, currentPublished) {
  if (!previousIds || previousIds.size === 0) return;
  const activeIds = new Set([
    ...collectPublicIds(currentDraft),
    ...collectPublicIds(currentPublished)
  ]);

  const deletions = [];
  for (const pid of previousIds) {
    if (pid.startsWith(`${CLOUDINARY_FOLDERS.website}/`) && !activeIds.has(pid)) {
      deletions.push(deleteAsset(pid, 'image', true));
    }
  }
  if (deletions.length > 0) {
    await Promise.allSettled(deletions);
  }
}

async function fetchCatalogueContext() {
  const [brands, categories, activeProducts] = await Promise.all([
    Brand.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }),
    Category.find({ isActive: true })
      .populate('brand', 'name slug tabLabel icon isActive')
      .sort({ displayOrder: 1, name: 1 }),
    Product.find({ isActive: true, deletedAt: null }).select('brand category')
  ]);

  const brandCounts = new Map();
  const categoryCounts = new Map();

  for (const prod of activeProducts) {
    const bId = prod.brand ? String(prod.brand._id || prod.brand) : '';
    const cId = prod.category ? String(prod.category._id || prod.category) : '';
    if (bId) brandCounts.set(bId, (brandCounts.get(bId) || 0) + 1);
    if (cId) categoryCounts.set(cId, (categoryCounts.get(cId) || 0) + 1);
  }

  const plainBrands = brands.map((b) => {
    const obj = toPlainObject(b);
    obj.productCount = brandCounts.get(String(obj._id)) || 0;
    return obj;
  });

  const plainCategories = categories.map((c) => {
    const obj = toPlainObject(c);
    obj.productCount = categoryCounts.get(String(obj._id)) || 0;
    return obj;
  });

  return { availableBrands: plainBrands, availableCategories: plainCategories };
}

function resolveSnapshotCatalogue(snapshot, catalogueContext) {
  const plain = deepClone(snapshot);
  const { availableBrands, availableCategories } = catalogueContext;

  const brandMap = new Map(availableBrands.map((b) => [String(b._id), b]));
  const categoryMap = new Map(availableCategories.map((c) => [String(c._id), c]));

  const selectedCatIds = Array.isArray(plain.productCategories?.selectedCategoryIds)
    ? plain.productCategories.selectedCategoryIds
    : [];
  const maxCategories = Number(plain.productCategories?.maxDisplay) || 8;

  let resolvedCategories = [];
  if (selectedCatIds.length > 0) {
    resolvedCategories = selectedCatIds
      .map((id) => categoryMap.get(String(id)))
      .filter(Boolean)
      .slice(0, maxCategories);
  }
  if (resolvedCategories.length === 0) {
    resolvedCategories = availableCategories.slice(0, maxCategories);
  }

  const selectedBrandIds = Array.isArray(plain.partners?.selectedBrandIds)
    ? plain.partners.selectedBrandIds
    : [];

  let resolvedPartners = [];
  if (selectedBrandIds.length > 0) {
    resolvedPartners = selectedBrandIds
      .map((id) => brandMap.get(String(id)))
      .filter(Boolean);
  }
  if (resolvedPartners.length === 0) {
    resolvedPartners = availableBrands;
  }

  // Keep only active items in customer-facing resolved snapshot
  if (plain.whatWeDo && Array.isArray(plain.whatWeDo.items)) {
    plain.whatWeDo.items = plain.whatWeDo.items.filter((item) => item.isActive !== false);
  }
  if (plain.founders && Array.isArray(plain.founders.items)) {
    plain.founders.items = plain.founders.items.filter((item) => item.isActive !== false);
  }
  if (plain.whyChooseUs && Array.isArray(plain.whyChooseUs.items)) {
    plain.whyChooseUs.items = plain.whyChooseUs.items.filter((item) => item.isActive !== false);
  }

  plain.resolvedCategories = resolvedCategories;
  plain.resolvedPartners = resolvedPartners;
  plain.sectionOrder = normalizeSectionOrder(plain.sectionOrder);
  return plain;
}

function buildActor(req) {
  if (!req.admin) return { id: '', name: 'Admin', email: '' };
  return {
    id: String(req.admin.id || req.admin._id || ''),
    name: String(req.admin.name || 'Admin'),
    email: String(req.admin.email || '')
  };
}

// GET /api/homepage (Public — returns ONLY published content + dynamically resolved Brands/Categories)
const getPublicHomepage = async (req, res, next) => {
  try {
    const doc = await ensureHomepageInitialized();
    const plainDoc = toPlainObject(doc);
    const catalogueContext = await fetchCatalogueContext();
    const homepage = resolveSnapshotCatalogue(plainDoc.published, catalogueContext);

    res.status(200).json({
      success: true,
      publishedVersion: plainDoc.publishedVersion || 1,
      lastPublishedAt: plainDoc.lastPublishedAt || plainDoc.updatedAt,
      homepage
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/homepage (Admin — returns full draft + published metadata + available brands/categories)
const getAdminHomepage = async (req, res, next) => {
  try {
    const doc = await ensureHomepageInitialized();
    const plainDoc = toPlainObject(doc);
    const catalogueContext = await fetchCatalogueContext();

    res.status(200).json({
      success: true,
      homepageDoc: {
        draft: sanitizeSnapshot(plainDoc.draft, createDefaultHomepagePayload()),
        published: sanitizeSnapshot(plainDoc.published, createDefaultHomepagePayload()),
        draftVersion: plainDoc.draftVersion || 1,
        publishedVersion: plainDoc.publishedVersion || 1,
        hasUnpublishedChanges: Boolean(plainDoc.hasUnpublishedChanges),
        lastPublishedAt: plainDoc.lastPublishedAt || null,
        lastPublishedBy: plainDoc.lastPublishedBy || null,
        updatedBy: plainDoc.updatedBy || null,
        updatedAt: plainDoc.updatedAt || null
      },
      availableBrands: catalogueContext.availableBrands,
      availableCategories: catalogueContext.availableCategories
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/homepage/preview (Admin — resolves draft content for live preview)
const getAdminHomepagePreview = async (req, res, next) => {
  try {
    const doc = await ensureHomepageInitialized();
    const plainDoc = toPlainObject(doc);
    const catalogueContext = await fetchCatalogueContext();
    const homepage = resolveSnapshotCatalogue(plainDoc.draft, catalogueContext);

    res.status(200).json({
      success: true,
      draftVersion: plainDoc.draftVersion || 1,
      publishedVersion: plainDoc.publishedVersion || 1,
      hasUnpublishedChanges: Boolean(plainDoc.hasUnpublishedChanges),
      homepage
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/homepage/draft (Admin — saves draft ONLY without changing live published site)
const saveHomepageDraft = async (req, res, next) => {
  try {
    const doc = await ensureHomepageInitialized();
    const plainDoc = toPlainObject(doc);
    const previousDraftIds = collectPublicIds(plainDoc.draft);

    const incomingDraft = req.body && req.body.draft ? req.body.draft : req.body;
    const sanitizedDraft = sanitizeSnapshot(incomingDraft, plainDoc.draft);
    const sanitizedPublished = sanitizeSnapshot(plainDoc.published, createDefaultHomepagePayload());
    const hasChanges = JSON.stringify(sanitizedDraft) !== JSON.stringify(sanitizedPublished);

    const updated = await HomepageContent.findOneAndUpdate(
      { singletonKey: 'main_homepage' },
      {
        $set: {
          draft: sanitizedDraft,
          draftVersion: (plainDoc.draftVersion || 1) + 1,
          hasUnpublishedChanges: hasChanges,
          updatedBy: buildActor(req)
        }
      },
      { new: true }
    );

    await cleanupOrphanedAssets(previousDraftIds, sanitizedDraft, sanitizedPublished);

    const updatedPlain = toPlainObject(updated);
    res.status(200).json({
      success: true,
      message: 'Homepage draft saved. Live website remains unchanged until you publish.',
      homepageDoc: {
        draft: updatedPlain.draft,
        published: updatedPlain.published,
        draftVersion: updatedPlain.draftVersion,
        publishedVersion: updatedPlain.publishedVersion,
        hasUnpublishedChanges: updatedPlain.hasUnpublishedChanges,
        lastPublishedAt: updatedPlain.lastPublishedAt,
        lastPublishedBy: updatedPlain.lastPublishedBy,
        updatedBy: updatedPlain.updatedBy,
        updatedAt: updatedPlain.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/homepage/publish (Admin — optionally accepts draft payload, validates, copies draft -> published)
const publishHomepage = async (req, res, next) => {
  try {
    const doc = await ensureHomepageInitialized();
    const plainDoc = toPlainObject(doc);
    const previousAllIds = new Set([
      ...collectPublicIds(plainDoc.draft),
      ...collectPublicIds(plainDoc.published)
    ]);

    const incomingDraft = req.body && req.body.draft ? req.body.draft : null;
    const nextDraft = incomingDraft
      ? sanitizeSnapshot(incomingDraft, plainDoc.draft)
      : sanitizeSnapshot(plainDoc.draft, createDefaultHomepagePayload());

    const actor = buildActor(req);
    const publishedSnapshot = deepClone(nextDraft);

    const updated = await HomepageContent.findOneAndUpdate(
      { singletonKey: 'main_homepage' },
      {
        $set: {
          draft: nextDraft,
          published: publishedSnapshot,
          draftVersion: incomingDraft ? (plainDoc.draftVersion || 1) + 1 : plainDoc.draftVersion || 1,
          publishedVersion: (plainDoc.publishedVersion || 1) + 1,
          hasUnpublishedChanges: false,
          lastPublishedAt: new Date(),
          lastPublishedBy: actor,
          updatedBy: actor
        }
      },
      { new: true }
    );

    await cleanupOrphanedAssets(previousAllIds, nextDraft, publishedSnapshot);

    const updatedPlain = toPlainObject(updated);
    res.status(200).json({
      success: true,
      message: 'Homepage changes published to the live website.',
      homepageDoc: {
        draft: updatedPlain.draft,
        published: updatedPlain.published,
        draftVersion: updatedPlain.draftVersion,
        publishedVersion: updatedPlain.publishedVersion,
        hasUnpublishedChanges: updatedPlain.hasUnpublishedChanges,
        lastPublishedAt: updatedPlain.lastPublishedAt,
        lastPublishedBy: updatedPlain.lastPublishedBy,
        updatedBy: updatedPlain.updatedBy,
        updatedAt: updatedPlain.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/homepage/discard (Admin — reverts draft back to current published snapshot)
const discardHomepageDraft = async (req, res, next) => {
  try {
    const doc = await ensureHomepageInitialized();
    const plainDoc = toPlainObject(doc);
    const previousDraftIds = collectPublicIds(plainDoc.draft);

    const publishedSnapshot = sanitizeSnapshot(plainDoc.published, createDefaultHomepagePayload());
    const revertedDraft = deepClone(publishedSnapshot);

    const updated = await HomepageContent.findOneAndUpdate(
      { singletonKey: 'main_homepage' },
      {
        $set: {
          draft: revertedDraft,
          draftVersion: (plainDoc.draftVersion || 1) + 1,
          hasUnpublishedChanges: false,
          updatedBy: buildActor(req)
        }
      },
      { new: true }
    );

    await cleanupOrphanedAssets(previousDraftIds, revertedDraft, publishedSnapshot);

    const updatedPlain = toPlainObject(updated);
    res.status(200).json({
      success: true,
      message: 'Draft changes discarded and reset to the currently published homepage.',
      homepageDoc: {
        draft: updatedPlain.draft,
        published: updatedPlain.published,
        draftVersion: updatedPlain.draftVersion,
        publishedVersion: updatedPlain.publishedVersion,
        hasUnpublishedChanges: updatedPlain.hasUnpublishedChanges,
        lastPublishedAt: updatedPlain.lastPublishedAt,
        lastPublishedBy: updatedPlain.lastPublishedBy,
        updatedBy: updatedPlain.updatedBy,
        updatedAt: updatedPlain.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/homepage/upload-image (Admin — uploads homepage asset directly to Cloudinary sriyas/website)
const uploadHomepageImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file was uploaded. Please select a PNG, JPG, or WEBP image.'
      });
    }

    const uploaded = await uploadBuffer(
      req.file.buffer,
      req.file.originalname,
      CLOUDINARY_FOLDERS.website,
      'image'
    );

    res.status(200).json({
      success: true,
      image: {
        url: uploaded.url,
        publicId: uploaded.publicId,
        format: uploaded.format,
        width: uploaded.width,
        height: uploaded.height
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicHomepage,
  getAdminHomepage,
  getAdminHomepagePreview,
  saveHomepageDraft,
  publishHomepage,
  discardHomepageDraft,
  uploadHomepageImage
};

