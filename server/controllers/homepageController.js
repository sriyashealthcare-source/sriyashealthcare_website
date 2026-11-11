const crypto = require('crypto');
const HomepageContent = require('../models/HomepageContent');
const {
  uploadBuffer,
  deleteAsset,
  listMediaLibrary,
  CLOUDINARY_FOLDERS
} = require('../config/cloudinary');
const {
  CANONICAL_SECTION_ORDER,
  createDefaultHomepagePayload,
  upgradeLegacySnapshotIfNeeded,
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

const ALLOWED_FOCAL_POINTS = new Set([
  'center center',
  'center top',
  'center bottom',
  'left center',
  'right center',
  'left top',
  'right top'
]);

const ALLOWED_ASPECT_RATIOS = new Set(['auto', '16/9', '4/3', '3/4', '1/1', '3/2']);

function cleanMediaRef(raw, fallback = {}) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const fb = fallback && typeof fallback === 'object' ? fallback : {};

  // Note: Explicit empty string '' clears media cleanly when admin removes an image!
  const url = typeof src.url === 'string' ? cleanUrl(src.url, '') : fb.url || '';
  const publicId =
    typeof src.publicId === 'string' ? cleanText(src.publicId, '', 300) : url ? fb.publicId || '' : '';

  const mobileUrl =
    typeof src.mobileUrl === 'string' ? cleanUrl(src.mobileUrl, '') : fb.mobileUrl || '';
  const mobilePublicId =
    typeof src.mobilePublicId === 'string'
      ? cleanText(src.mobilePublicId, '', 300)
      : mobileUrl
        ? fb.mobilePublicId || ''
        : '';

  return {
    url,
    publicId,
    mobileUrl,
    mobilePublicId,
    alt: cleanText(src.alt, fb.alt || '', 240),
    focalPoint: ALLOWED_FOCAL_POINTS.has(src.focalPoint)
      ? src.focalPoint
      : fb.focalPoint || 'center center',
    aspectRatio: ALLOWED_ASPECT_RATIOS.has(src.aspectRatio) ? src.aspectRatio : fb.aspectRatio || 'auto'
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
    .slice(0, 10)
    .map((img, idx) => {
      const item = img && typeof img === 'object' ? img : {};
      const media = cleanMediaRef(item);
      return {
        id: cleanText(item.id, '', 80) || makeItemId('about-img'),
        url: media.url,
        publicId: media.publicId,
        mobileUrl: media.mobileUrl,
        mobilePublicId: media.mobilePublicId,
        alt: media.alt,
        caption: cleanText(item.caption, '', 240),
        focalPoint: media.focalPoint,
        aspectRatio: media.aspectRatio,
        size: allowedSizes.has(item.size) ? item.size : 'primary',
        displayOrder: Number.isFinite(Number(item.displayOrder)) ? Number(item.displayOrder) : idx + 1
      };
    })
    .filter((img) => Boolean(img.url))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function sanitizeWorkplaceImages(rawImages) {
  if (!Array.isArray(rawImages)) return [];
  return rawImages
    .slice(0, 16)
    .map((img, idx) => {
      const item = img && typeof img === 'object' ? img : {};
      const media = cleanMediaRef(item);
      return {
        id: cleanText(item.id, '', 80) || makeItemId('wp-img'),
        url: media.url,
        publicId: media.publicId,
        mobileUrl: media.mobileUrl,
        mobilePublicId: media.mobilePublicId,
        alt: media.alt,
        title: cleanText(item.title, '', 140),
        caption: cleanText(item.caption, '', 280),
        category: cleanText(item.category, 'Workplace', 60) || 'Workplace',
        focalPoint: media.focalPoint,
        aspectRatio: media.aspectRatio,
        displayOrder: Number.isFinite(Number(item.displayOrder)) ? Number(item.displayOrder) : idx + 1,
        isActive: cleanBool(item.isActive, true)
      };
    })
    .filter((img) => Boolean(img.url))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function sanitizeProfileItems(rawItems, prefix) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .slice(0, 24)
    .map((entry, idx) => {
      const item = entry && typeof entry === 'object' ? entry : {};
      return {
        id: cleanText(item.id, '', 80) || makeItemId(prefix),
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
        displayOrder: Number.isFinite(Number(item.displayOrder)) ? Number(item.displayOrder) : idx + 1,
        isActive: cleanBool(item.isActive, true)
      };
    })
    .filter((item) => Boolean(item.title))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function sanitizeValueItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .slice(0, 12)
    .map((entry, idx) => {
      const item = entry && typeof entry === 'object' ? entry : {};
      return {
        id: cleanText(item.id, '', 80) || makeItemId('val'),
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

function sanitizeSnapshot(rawInput, fallbackSnapshot) {
  const base = upgradeLegacySnapshotIfNeeded(fallbackSnapshot || createDefaultHomepagePayload());
  const input = rawInput && typeof rawInput === 'object' ? rawInput : {};
  const allowedAboutPresets = new Set(['split-collage', 'editorial-stacked', 'centered-feature']);
  const allowedWorkplaceLayouts = new Set(['editorial-collage', 'gallery-grid']);

  const heroIn = input.hero && typeof input.hero === 'object' ? input.hero : base.hero;
  const aboutIn = input.about && typeof input.about === 'object' ? input.about : base.about;
  const wpIn = input.workplace && typeof input.workplace === 'object' ? input.workplace : base.workplace;
  const leadIn = input.leadership && typeof input.leadership === 'object' ? input.leadership : base.leadership;
  const teamIn = input.team && typeof input.team === 'object' ? input.team : base.team;
  const wwdIn = input.whatWeDo && typeof input.whatWeDo === 'object' ? input.whatWeDo : base.whatWeDo;
  const valIn = input.values && typeof input.values === 'object' ? input.values : base.values;
  const ctaIn = input.callToAction && typeof input.callToAction === 'object' ? input.callToAction : base.callToAction;

  return {
    hero: {
      companyName: cleanText(heroIn.companyName, base.hero.companyName, 80) || 'SRIYAS HEALTHCARE',
      companySubtitle: cleanText(heroIn.companySubtitle, base.hero.companySubtitle, 100),
      tagline: cleanText(heroIn.tagline, base.hero.tagline, 240),
      supportingIntro: cleanText(heroIn.supportingIntro, base.hero.supportingIntro, 600),
      valuesText: cleanText(heroIn.valuesText, base.hero.valuesText, 120),
      ctaText: cleanText(heroIn.ctaText, base.hero.ctaText, 60) || 'Explore Sriyas',
      ctaLink: cleanUrl(heroIn.ctaLink, base.hero.ctaLink) || '#about-sriyas',
      secondaryCtaText: cleanText(heroIn.secondaryCtaText, base.hero.secondaryCtaText, 60),
      secondaryCtaLink: cleanUrl(heroIn.secondaryCtaLink, base.hero.secondaryCtaLink) || '/products',
      showTagline: cleanBool(heroIn.showTagline, base.hero.showTagline),
      showValues: cleanBool(heroIn.showValues, base.hero.showValues),
      showSecondaryCta: cleanBool(heroIn.showSecondaryCta, base.hero.showSecondaryCta),
      logo: cleanMediaRef(heroIn.logo, base.hero.logo),
      backgroundImage: cleanMediaRef(heroIn.backgroundImage, base.hero.backgroundImage)
    },
    about: {
      enabled: cleanBool(aboutIn.enabled, base.about.enabled),
      eyebrow: cleanText(aboutIn.eyebrow, base.about.eyebrow, 80),
      heading: cleanText(aboutIn.heading, base.about.heading, 180),
      introduction: cleanText(aboutIn.introduction, base.about.introduction, 1500),
      supportingText: cleanText(aboutIn.supportingText, base.about.supportingText, 1500),
      hospitalCommitment: cleanText(aboutIn.hospitalCommitment, base.about.hospitalCommitment, 1500),
      vision: cleanText(aboutIn.vision, base.about.vision, 800),
      mission: cleanText(aboutIn.mission, base.about.mission, 800),
      layoutPreset: allowedAboutPresets.has(aboutIn.layoutPreset)
        ? aboutIn.layoutPreset
        : base.about.layoutPreset,
      images: Array.isArray(aboutIn.images) ? sanitizeAboutImages(aboutIn.images) : base.about.images
    },
    workplace: {
      enabled: cleanBool(wpIn.enabled, base.workplace.enabled),
      eyebrow: cleanText(wpIn.eyebrow, base.workplace.eyebrow, 80),
      heading: cleanText(wpIn.heading, base.workplace.heading, 180),
      subtitle: cleanText(wpIn.subtitle, base.workplace.subtitle, 500),
      layoutStyle: allowedWorkplaceLayouts.has(wpIn.layoutStyle)
        ? wpIn.layoutStyle
        : base.workplace.layoutStyle,
      images: Array.isArray(wpIn.images) ? sanitizeWorkplaceImages(wpIn.images) : base.workplace.images
    },
    leadership: {
      enabled: cleanBool(leadIn.enabled, base.leadership.enabled),
      eyebrow: cleanText(leadIn.eyebrow, base.leadership.eyebrow, 80),
      heading: cleanText(leadIn.heading, base.leadership.heading, 180),
      subtitle: cleanText(leadIn.subtitle, base.leadership.subtitle, 500),
      items: Array.isArray(leadIn.items) ? sanitizeProfileItems(leadIn.items, 'leader') : base.leadership.items
    },
    team: {
      enabled: cleanBool(teamIn.enabled, base.team.enabled),
      eyebrow: cleanText(teamIn.eyebrow, base.team.eyebrow, 80),
      heading: cleanText(teamIn.heading, base.team.heading, 180),
      subtitle: cleanText(teamIn.subtitle, base.team.subtitle, 500),
      items: Array.isArray(teamIn.items) ? sanitizeProfileItems(teamIn.items, 'team') : base.team.items
    },
    whatWeDo: {
      enabled: cleanBool(wwdIn.enabled, base.whatWeDo.enabled),
      eyebrow: cleanText(wwdIn.eyebrow, base.whatWeDo.eyebrow, 80),
      heading: cleanText(wwdIn.heading, base.whatWeDo.heading, 180),
      subtitle: cleanText(wwdIn.subtitle, base.whatWeDo.subtitle, 500),
      items: Array.isArray(wwdIn.items) ? sanitizeWhatWeDoItems(wwdIn.items) : base.whatWeDo.items
    },
    values: {
      enabled: cleanBool(valIn.enabled, base.values.enabled),
      eyebrow: cleanText(valIn.eyebrow, base.values.eyebrow, 80),
      heading: cleanText(valIn.heading, base.values.heading, 180),
      subtitle: cleanText(valIn.subtitle, base.values.subtitle, 500),
      featureImage: cleanMediaRef(valIn.featureImage, base.values.featureImage),
      items: Array.isArray(valIn.items) ? sanitizeValueItems(valIn.items) : base.values.items
    },
    callToAction: {
      enabled: cleanBool(ctaIn.enabled, base.callToAction.enabled),
      eyebrow: cleanText(ctaIn.eyebrow, base.callToAction.eyebrow, 80),
      heading: cleanText(ctaIn.heading, base.callToAction.heading, 200) || 'Partnering for Better Healthcare.',
      supportingText: cleanText(ctaIn.supportingText, base.callToAction.supportingText, 600),
      primaryButtonText:
        cleanText(ctaIn.primaryButtonText, base.callToAction.primaryButtonText, 60) ||
        'Explore Our Products',
      primaryButtonLink: cleanUrl(ctaIn.primaryButtonLink, base.callToAction.primaryButtonLink) || '/products',
      secondaryButtonText:
        cleanText(ctaIn.secondaryButtonText, base.callToAction.secondaryButtonText, 60) || 'Contact Us',
      secondaryButtonLink:
        cleanUrl(ctaIn.secondaryButtonLink, base.callToAction.secondaryButtonLink) || '/contact',
      showContactDetails: cleanBool(ctaIn.showContactDetails, base.callToAction.showContactDetails),
      contactPhone: cleanText(ctaIn.contactPhone, base.callToAction.contactPhone, 120),
      contactEmail: cleanText(ctaIn.contactEmail, base.callToAction.contactEmail, 160),
      contactAddress: cleanText(ctaIn.contactAddress, base.callToAction.contactAddress, 360),
      backgroundImage: cleanMediaRef(ctaIn.backgroundImage, base.callToAction.backgroundImage)
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
  if (typeof obj.mobilePublicId === 'string' && obj.mobilePublicId.trim()) {
    bucket.add(obj.mobilePublicId.trim());
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
  const activeIds = new Set([...collectPublicIds(currentDraft), ...collectPublicIds(currentPublished)]);

  const deletions = [];
  for (const pid of previousIds) {
    if ((pid.startsWith(`${CLOUDINARY_FOLDERS.website}/`) || pid.startsWith('local:')) && !activeIds.has(pid)) {
      deletions.push(deleteAsset(pid, 'image', true));
    }
  }
  if (deletions.length > 0) {
    await Promise.allSettled(deletions);
  }
}

function filterActiveSnapshotForDisplay(snapshot) {
  const plain = sanitizeSnapshot(snapshot, createDefaultHomepagePayload());
  if (plain.workplace && Array.isArray(plain.workplace.images)) {
    plain.workplace.images = plain.workplace.images.filter((item) => item.isActive !== false && item.url);
  }
  if (plain.leadership && Array.isArray(plain.leadership.items)) {
    plain.leadership.items = plain.leadership.items.filter((item) => item.isActive !== false && item.name);
  }
  if (plain.team && Array.isArray(plain.team.items)) {
    plain.team.items = plain.team.items.filter((item) => item.isActive !== false && item.name);
  }
  if (plain.whatWeDo && Array.isArray(plain.whatWeDo.items)) {
    plain.whatWeDo.items = plain.whatWeDo.items.filter((item) => item.isActive !== false && item.title);
  }
  if (plain.values && Array.isArray(plain.values.items)) {
    plain.values.items = plain.values.items.filter((item) => item.isActive !== false && item.title);
  }
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

// GET /api/homepage (Public — returns ONLY published content)
const getPublicHomepage = async (req, res, next) => {
  try {
    const doc = await ensureHomepageInitialized();
    const plainDoc = toPlainObject(doc);
    const homepage = filterActiveSnapshotForDisplay(plainDoc.published);

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

// GET /api/admin/homepage (Admin — returns full sanitized draft + published)
const getAdminHomepage = async (req, res, next) => {
  try {
    const doc = await ensureHomepageInitialized();
    const plainDoc = toPlainObject(doc);

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
      }
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
    const homepage = filterActiveSnapshotForDisplay(plainDoc.draft);

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

// PUT /api/admin/homepage/draft (Admin — saves draft ONLY without changing live site)
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

// POST /api/admin/homepage/publish (Admin — promotes draft to live published)
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

// POST /api/admin/homepage/discard (Admin — reverts draft back to published)
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

// GET /api/admin/homepage/media-library (Admin — lists Cloudinary sriyas/* assets & available site assets)
const getHomepageMediaLibrary = async (req, res, next) => {
  try {
    const items = await listMediaLibrary(60);
    res.status(200).json({
      success: true,
      count: items.length,
      items
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
  uploadHomepageImage,
  getHomepageMediaLibrary
};
