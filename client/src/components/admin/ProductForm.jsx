import React, { useState, useEffect, useRef } from 'react';
import { productService } from '../../services/productService';
import { resolveAssetUrl } from '../../utils/session';

function formatSpecsToLines(specs = []) {
  if (!Array.isArray(specs)) return '';
  return specs
    .map(s => {
      if (typeof s === 'string') return s;
      if (s.name && s.value) return `${s.name}: ${s.value}`;
      return s.value || s.name || '';
    })
    .filter(Boolean)
    .join('\n');
}

export default function ProductForm({ initialData = null, onSubmit, submitting = false, onCancel }) {
  const isEdit = Boolean(initialData && initialData._id);

  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [useCustomCategory, setUseCustomCategory] = useState(false);

  const [name, setName] = useState('');
  const [brandId, setBrandId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [cardCategory, setCardCategory] = useState('');
  const [detailCategory, setDetailCategory] = useState('');
  const [shortSpecification, setShortSpecification] = useState('');
  const [description, setDescription] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [specsText, setSpecsText] = useState('');
  const [appsText, setAppsText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState('');

  // Existing images (for edit mode)
  const [existingImages, setExistingImages] = useState([]);
  // Newly selected image files
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [replaceAllImages, setReplaceAllImages] = useState(false);

  // Brochure PDF state
  const [existingBrochure, setExistingBrochure] = useState(null);
  const [removeBrochure, setRemoveBrochure] = useState(false);
  const [brochureFile, setBrochureFile] = useState(null);

  const [formError, setFormError] = useState('');
  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [bRes, cRes] = await Promise.all([
          productService.getAdminBrands(),
          productService.getAdminCategories()
        ]);
        const bList = bRes.brands || [];
        const cList = cRes.categories || [];
        setBrands(bList);
        setCategories(cList);

        if (!isEdit && bList.length > 0 && !brandId) {
          const defaultBrandId = String(bList[0]._id);
          setBrandId(defaultBrandId);
          const matchingCats = cList.filter(c => String(c.brand?._id || c.brand) === defaultBrandId);
          if (matchingCats.length > 0) {
            setCategoryId(String(matchingCats[0]._id));
          }
        }
      } catch (err) {
        console.error('Failed to load brands/categories for product form:', err);
      }
    }
    loadMeta();
  }, [isEdit]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      const bId = String(initialData.brand?._id || initialData.brand || '');
      const cId = String(initialData.category?._id || initialData.category || '');
      setBrandId(bId);
      setCategoryId(cId);
      setCardCategory(initialData.cardCategory || '');
      setDetailCategory(initialData.detailCategory || '');
      setShortSpecification(initialData.shortSpecification || '');
      setDescription(initialData.description || '');
      setFeaturesText((initialData.features || []).join('\n'));
      setSpecsText(formatSpecsToLines(initialData.specifications || []));
      setAppsText((initialData.applications || []).join('\n'));
      setIsActive(initialData.isActive !== false);
      setDisplayOrder(initialData.displayOrder !== undefined ? String(initialData.displayOrder) : '');
      setExistingImages(initialData.images || []);
      setExistingBrochure(
        initialData.brochure && initialData.brochure.url ? initialData.brochure : null
      );
    }
  }, [initialData]);

  // Filter categories for selected brand
  const brandCategories = categories.filter(
    c => !brandId || String(c.brand?._id || c.brand) === String(brandId)
  );

  const handleBrandChange = (nextBrandId) => {
    setBrandId(nextBrandId);
    const matching = categories.filter(
      c => String(c.brand?._id || c.brand) === String(nextBrandId)
    );
    if (matching.length > 0) {
      setCategoryId(String(matching[0]._id));
      setUseCustomCategory(false);
    } else {
      setCategoryId('');
    }
  };

  const handleNewImagesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = [];
    const previews = [];

    for (const file of files) {
      if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
        setFormError('Only PNG, JPG, JPEG, and WEBP images are supported.');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFormError(`Image "${file.name}" exceeds the 10 MB limit.`);
        continue;
      }
      validFiles.push(file);
      previews.push({
        name: file.name,
        url: URL.createObjectURL(file)
      });
    }

    setNewImageFiles(prev => [...prev, ...validFiles]);
    setNewImagePreviews(prev => [...prev, ...previews]);
    setFormError('');
  };

  const removeNewImageAt = (index) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImageAt = (index) => {
    setExistingImages(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some(img => img.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  };

  const setPrimaryExistingImage = (index) => {
    setExistingImages(prev =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    );
  };

  const handleBrochureSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setFormError('Only PDF files (.pdf) are allowed for brochures.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setFormError('Brochure PDF exceeds the 15 MB size limit.');
      return;
    }
    setBrochureFile(file);
    setRemoveBrochure(false);
    setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    const cleanName = name.trim();
    const resolvedCategory = useCustomCategory ? customCategoryName.trim() : categoryId;

    if (!cleanName) {
      setFormError('Product name is required.');
      return;
    }
    if (!brandId) {
      setFormError('Please select a brand.');
      return;
    }
    if (!resolvedCategory) {
      setFormError('Please select or enter a category.');
      return;
    }

    const formData = new FormData();
    formData.append('name', cleanName);
    formData.append('brand', brandId);
    formData.append('category', resolvedCategory);
    formData.append('cardCategory', cardCategory.trim());
    formData.append('detailCategory', detailCategory.trim());
    formData.append('shortSpecification', shortSpecification.trim());
    formData.append('description', description.trim());
    formData.append('features', featuresText);
    formData.append('specifications', specsText);
    formData.append('applications', appsText);
    formData.append('isActive', String(isActive));
    if (displayOrder !== '') {
      formData.append('displayOrder', String(displayOrder));
    }

    if (isEdit) {
      formData.append('existingImages', JSON.stringify(existingImages));
      formData.append('replaceAllImages', String(replaceAllImages));
      if (removeBrochure) {
        formData.append('removeBrochure', 'true');
      }
    }

    newImageFiles.forEach(file => {
      formData.append('images', file);
    });

    if (brochureFile) {
      formData.append('brochure', brochureFile);
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="admin-card">
      {formError && (
        <div
          role="alert"
          style={{
            background: 'var(--status-danger-bg)',
            color: 'var(--status-danger)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            fontSize: '0.88rem',
            fontWeight: 500
          }}
        >
          {formError}
        </div>
      )}

      <div className="admin-form-grid">
        <div className="admin-field">
          <label htmlFor="pf-name">Product Name *</label>
          <input
            id="pf-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. I-Col™ or GORE® BIO-A® Tissue Reinforcement"
            required
          />
        </div>

        <div className="admin-field">
          <label htmlFor="pf-brand">Brand *</label>
          <select
            id="pf-brand"
            value={brandId}
            onChange={(e) => handleBrandChange(e.target.value)}
            required
          >
            <option value="">Select Brand...</option>
            {brands.map((b) => (
              <option key={b._id} value={b._id}>
                {b.icon} {b.name} {!b.isActive ? '(Inactive)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-form-grid">
        <div className="admin-field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label htmlFor="pf-category">Category Section *</label>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gold-deep)',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '4px'
              }}
              onClick={() => setUseCustomCategory(!useCustomCategory)}
            >
              {useCustomCategory ? 'Choose Existing Category' : '+ New Category Name'}
            </button>
          </div>

          {useCustomCategory ? (
            <input
              id="pf-category"
              type="text"
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              placeholder="Enter new category name (e.g. Synthetic Absorbable Sutures)"
              required
            />
          ) : (
            <select
              id="pf-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="">Select Category...</option>
              {brandCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {!c.isActive ? '(Inactive)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="admin-field">
          <label htmlFor="pf-card-cat">Card Subtitle Tag</label>
          <input
            id="pf-card-cat"
            type="text"
            value={cardCategory}
            onChange={(e) => setCardCategory(e.target.value)}
            placeholder="e.g. Braided · Polyglycolic Acid"
          />
          <div className="admin-field-hint">Displayed above the product title on catalogue cards.</div>
        </div>
      </div>

      <div className="admin-form-grid">
        <div className="admin-field">
          <label htmlFor="pf-short-spec">Short Specification (Card Summary)</label>
          <input
            id="pf-short-spec"
            type="text"
            value={shortSpecification}
            onChange={(e) => setShortSpecification(e.target.value)}
            placeholder="e.g. PGA · Coated · Absorption 60–75 Days"
          />
        </div>

        <div className="admin-field">
          <label htmlFor="pf-detail-cat">Detail Page Category Header</label>
          <input
            id="pf-detail-cat"
            type="text"
            value={detailCategory}
            onChange={(e) => setDetailCategory(e.target.value)}
            placeholder="e.g. Synthetic Absorbable Suture · Braided · Polyglycolic Acid"
          />
        </div>
      </div>

      <div className="admin-field">
        <label htmlFor="pf-desc">Full Product Description</label>
        <textarea
          id="pf-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Comprehensive clinical and technical product description..."
          rows={4}
        />
      </div>

      {/* Product Images Section */}
      <div className="admin-field">
        <label>Product Images (Main Image &amp; Gallery)</label>
        <div
          className="admin-upload-dropzone"
          onClick={() => imageInputRef.current && imageInputRef.current.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              imageInputRef.current && imageInputRef.current.click();
            }
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>🖼️</div>
          <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.9rem' }}>
            Click to select product image(s)
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-mute)', marginTop: '4px' }}>
            Supports PNG, JPG, WEBP up to 10 MB each. First or Primary image appears on the product card.
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple
            style={{ display: 'none' }}
            onChange={handleNewImagesSelect}
          />
        </div>

        {isEdit && existingImages.length > 0 && newImageFiles.length > 0 && (
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              id="pf-replace-imgs"
              type="checkbox"
              checked={replaceAllImages}
              onChange={(e) => setReplaceAllImages(e.target.checked)}
            />
            <label htmlFor="pf-replace-imgs" style={{ margin: 0, textTransform: 'none', fontSize: '0.82rem' }}>
              Replace all existing images with the newly uploaded image(s)
            </label>
          </div>
        )}

        {/* Existing Images Grid */}
        {existingImages.length > 0 && !replaceAllImages && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-mute)', marginBottom: '6px' }}>
              Current Product Images ({existingImages.length}):
            </div>
            <div className="admin-image-preview-grid">
              {existingImages.map((img, idx) => (
                <div
                  key={`${img.url}-${idx}`}
                  className={`admin-image-preview-item ${img.isPrimary ? 'primary' : ''}`}
                >
                  <img src={resolveAssetUrl(img.url)} alt={`Existing ${idx + 1}`} />
                  <div className="admin-image-actions">
                    {img.isPrimary ? (
                      <span className="admin-image-badge">Primary</span>
                    ) : (
                      <button
                        type="button"
                        className="adm-btn adm-btn-secondary adm-btn-sm"
                        style={{ padding: '2px 6px', fontSize: '0.65rem' }}
                        onClick={() => setPrimaryExistingImage(idx)}
                      >
                        Set Main
                      </button>
                    )}
                    <button
                      type="button"
                      className="adm-btn adm-btn-danger adm-btn-sm"
                      style={{ padding: '2px 6px', fontSize: '0.65rem' }}
                      onClick={() => removeExistingImageAt(idx)}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Image Previews Grid */}
        {newImagePreviews.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--status-success)', marginBottom: '6px' }}>
              New Images Ready to Upload ({newImagePreviews.length}):
            </div>
            <div className="admin-image-preview-grid">
              {newImagePreviews.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="admin-image-preview-item">
                  <img src={item.url} alt={item.name} />
                  <div className="admin-image-actions">
                    <span
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-mute)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.name}
                    </span>
                    <button
                      type="button"
                      className="adm-btn adm-btn-danger adm-btn-sm"
                      style={{ padding: '2px 6px', fontSize: '0.65rem' }}
                      onClick={() => removeNewImageAt(idx)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Features, Specifications, Applications */}
      <div className="admin-field">
        <label htmlFor="pf-features">Key Features (One per line)</label>
        <textarea
          id="pf-features"
          value={featuresText}
          onChange={(e) => setFeaturesText(e.target.value)}
          placeholder={'High initial strength with moderated absorption kinetics\nExcellent knot reliability and security\nHigh biocompatibility — minimal tissue reaction'}
          rows={5}
        />
      </div>

      <div className="admin-form-grid">
        <div className="admin-field">
          <label htmlFor="pf-specs">Technical Specifications (One per line, e.g. Label: Value)</label>
          <textarea
            id="pf-specs"
            value={specsText}
            onChange={(e) => setSpecsText(e.target.value)}
            placeholder={'Material: Polyglycolic Acid (PGA) — Braided\nOptimal Strength Duration: 28–35 Days\nTotal Absorption Time: 60–75 Days'}
            rows={5}
          />
        </div>

        <div className="admin-field">
          <label htmlFor="pf-apps">Applications / Clinical Uses (One per line)</label>
          <textarea
            id="pf-apps"
            value={appsText}
            onChange={(e) => setAppsText(e.target.value)}
            placeholder={'Bowel Anastomosis\nCholecystectomy\nAppendectomy\nHysterectomy'}
            rows={5}
          />
        </div>
      </div>

      {/* Brochure PDF Management */}
      <div className="admin-form-grid">
        <div className="admin-field">
          <label>Product Brochure (PDF, Optional)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="adm-btn adm-btn-secondary adm-btn-sm"
              onClick={() => pdfInputRef.current && pdfInputRef.current.click()}
            >
              📄 {existingBrochure || brochureFile ? 'Replace Brochure PDF' : 'Upload Brochure PDF'}
            </button>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={handleBrochureSelect}
            />

            {brochureFile && (
              <span style={{ fontSize: '0.82rem', color: 'var(--status-success)', fontWeight: 500 }}>
                Selected: {brochureFile.name}
                <button
                  type="button"
                  style={{
                    marginLeft: '8px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--status-danger)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setBrochureFile(null)}
                >
                  Remove
                </button>
              </span>
            )}

            {!brochureFile && existingBrochure && !removeBrochure && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-dark)' }}>
                Current:{' '}
                <a
                  href={resolveAssetUrl(existingBrochure.url)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--gold-deep)', fontWeight: 600 }}
                >
                  {existingBrochure.filename || 'View Brochure PDF'}
                </a>
                <button
                  type="button"
                  style={{
                    marginLeft: '10px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--status-danger)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: 600
                  }}
                  onClick={() => setRemoveBrochure(true)}
                >
                  Remove PDF
                </button>
              </span>
            )}

            {removeBrochure && (
              <span style={{ fontSize: '0.8rem', color: 'var(--status-danger)' }}>
                Brochure will be removed upon saving.{' '}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
                  onClick={() => setRemoveBrochure(false)}
                >
                  Undo
                </button>
              </span>
            )}
          </div>
        </div>

        <div className="admin-form-grid" style={{ gap: '12px' }}>
          <div className="admin-field">
            <label htmlFor="pf-status">Visibility Status</label>
            <select
              id="pf-status"
              value={isActive ? 'active' : 'inactive'}
              onChange={(e) => setIsActive(e.target.value === 'active')}
            >
              <option value="active">Active (Visible on Website)</option>
              <option value="inactive">Inactive (Hidden from Public)</option>
            </select>
          </div>

          <div className="admin-field">
            <label htmlFor="pf-order">Display Order</label>
            <input
              id="pf-order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              placeholder="Auto"
            />
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '18px',
          borderTop: '1px solid rgba(169, 130, 44, 0.16)'
        }}
      >
        {onCancel && (
          <button
            type="button"
            className="adm-btn adm-btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
        <button type="submit" className="adm-btn adm-btn-primary" disabled={submitting}>
          {submitting
            ? 'Saving Product...'
            : isEdit
            ? 'Save Product Changes'
            : 'Publish Product'}
        </button>
      </div>
    </form>
  );
}

