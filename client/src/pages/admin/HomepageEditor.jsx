import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { homepageService } from '../../services/homepageService';
import HeroEditorPanel from '../../components/admin/homepage/HeroEditorPanel';
import AboutEditorPanel from '../../components/admin/homepage/AboutEditorPanel';
import WorkplaceGalleryEditorPanel from '../../components/admin/homepage/WorkplaceGalleryEditorPanel';
import PeopleProfilesEditorPanel from '../../components/admin/homepage/PeopleProfilesEditorPanel';
import WhatWeDoEditorPanel from '../../components/admin/homepage/WhatWeDoEditorPanel';
import ValuesEditorPanel from '../../components/admin/homepage/ValuesEditorPanel';
import CtaEditorPanel from '../../components/admin/homepage/CtaEditorPanel';
import SectionOrderPanel from '../../components/admin/homepage/SectionOrderPanel';
import HomepagePreviewModal from '../../components/admin/homepage/HomepagePreviewModal';
import '../../styles/homepageEditor.css';

const TABS = [
  { id: 'hero', label: 'Hero Editor' },
  { id: 'about', label: 'About Editor', toggleKey: 'about' },
  { id: 'workplace', label: 'Company Gallery Editor', toggleKey: 'workplace' },
  { id: 'leadership', label: 'Leadership Editor', toggleKey: 'leadership' },
  { id: 'team', label: 'Team Members Editor', toggleKey: 'team' },
  { id: 'whatWeDo', label: 'What We Do Editor', toggleKey: 'whatWeDo' },
  { id: 'values', label: 'Values Editor', toggleKey: 'values' },
  { id: 'callToAction', label: 'CTA Editor', toggleKey: 'callToAction' },
  { id: 'sectionOrder', label: 'Section Order & Visibility' }
];

export default function HomepageEditor() {
  const outletCtx = useOutletContext() || {};
  const showToast = outletCtx.showToast;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');
  const [previewOpen, setPreviewOpen] = useState(false);

  const [draft, setDraft] = useState(null);
  const [meta, setMeta] = useState({
    draftVersion: 1,
    publishedVersion: 1,
    hasUnpublishedChanges: false,
    lastPublishedAt: null,
    lastPublishedBy: null
  });
  const [isDirty, setIsDirty] = useState(false);
  const [banner, setBanner] = useState(null);

  const notify = useCallback(
    (message, type = 'success') => {
      setBanner({ message, type });
      if (typeof showToast === 'function') {
        showToast(message, type);
      }
    },
    [showToast]
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await homepageService.getAdminHomepage();
      if (res?.homepageDoc) {
        setDraft(res.homepageDoc.draft);
        setMeta({
          draftVersion: res.homepageDoc.draftVersion || 1,
          publishedVersion: res.homepageDoc.publishedVersion || 1,
          hasUnpublishedChanges: Boolean(res.homepageDoc.hasUnpublishedChanges),
          lastPublishedAt: res.homepageDoc.lastPublishedAt || null,
          lastPublishedBy: res.homepageDoc.lastPublishedBy || null
        });
        setIsDirty(false);
      }
    } catch (err) {
      setBanner({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load Homepage Editor configuration.'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isDirty) return undefined;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const updateSection = (sectionKey, nextVal) => {
    setDraft((prev) => ({
      ...prev,
      [sectionKey]: nextVal
    }));
    setIsDirty(true);
  };

  const handleToggleSection = (sectionKey, enabled) => {
    setDraft((prev) => ({
      ...prev,
      [sectionKey]: {
        ...(prev[sectionKey] || {}),
        enabled
      }
    }));
    setIsDirty(true);
  };

  const handleSaveDraft = async () => {
    if (!draft) return;
    setSaving(true);
    setBanner(null);
    try {
      const res = await homepageService.saveDraft(draft);
      if (res?.homepageDoc) {
        setDraft(res.homepageDoc.draft);
        setMeta({
          draftVersion: res.homepageDoc.draftVersion,
          publishedVersion: res.homepageDoc.publishedVersion,
          hasUnpublishedChanges: Boolean(res.homepageDoc.hasUnpublishedChanges),
          lastPublishedAt: res.homepageDoc.lastPublishedAt,
          lastPublishedBy: res.homepageDoc.lastPublishedBy
        });
        setIsDirty(false);
      }
      notify('Draft saved safely. Live website remains unchanged until published.', 'success');
    } catch (err) {
      notify(err.response?.data?.message || 'Could not save homepage draft.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!draft) return;
    if (
      !window.confirm(
        'Publish these homepage changes live for all visitors on https://sriyashealthcare.com?'
      )
    ) {
      return;
    }

    setPublishing(true);
    setBanner(null);
    try {
      const res = await homepageService.publishHomepage(draft);
      if (res?.homepageDoc) {
        setDraft(res.homepageDoc.draft);
        setMeta({
          draftVersion: res.homepageDoc.draftVersion,
          publishedVersion: res.homepageDoc.publishedVersion,
          hasUnpublishedChanges: Boolean(res.homepageDoc.hasUnpublishedChanges),
          lastPublishedAt: res.homepageDoc.lastPublishedAt,
          lastPublishedBy: res.homepageDoc.lastPublishedBy
        });
        setIsDirty(false);
      }
      setPreviewOpen(false);
      notify('Homepage changes are now published live!', 'success');
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to publish homepage.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleDiscardDraft = async () => {
    if (
      !window.confirm(
        'Discard all draft changes and revert the editor back to the currently live published homepage?'
      )
    ) {
      return;
    }

    setDiscarding(true);
    setBanner(null);
    try {
      const res = await homepageService.discardDraft();
      if (res?.homepageDoc) {
        setDraft(res.homepageDoc.draft);
        setMeta({
          draftVersion: res.homepageDoc.draftVersion,
          publishedVersion: res.homepageDoc.publishedVersion,
          hasUnpublishedChanges: false,
          lastPublishedAt: res.homepageDoc.lastPublishedAt,
          lastPublishedBy: res.homepageDoc.lastPublishedBy
        });
        setIsDirty(false);
      }
      notify('Draft reset to match the currently published homepage.', 'success');
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to discard draft.', 'error');
    } finally {
      setDiscarding(false);
    }
  };

  if (loading) {
    return (
      <div className="state-container">
        <div className="spinner" />
        <p>Loading Homepage Editor...</p>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="admin-card" style={{ padding: '24px' }}>
        <h3>Unable to load Homepage Editor</h3>
        <p>{banner?.message || 'Please check backend API connectivity and try again.'}</p>
        <button type="button" className="adm-btn adm-btn-primary" onClick={loadData}>
          Retry
        </button>
      </div>
    );
  }

  const lastPubFormatted = meta.lastPublishedAt
    ? new Date(meta.lastPublishedAt).toLocaleString()
    : 'Not published yet';

  return (
    <div className="hp-editor-page">
      <div className="hp-editor-toolbar">
        <div className="hp-toolbar-meta">
          <div className="hp-toolbar-badges">
            {meta.hasUnpublishedChanges || isDirty ? (
              <span className="status-badge status-in_review">Unpublished Draft Changes</span>
            ) : (
              <span className="status-badge status-resolved">Live &amp; Published</span>
            )}
            {isDirty && <span className="status-badge status-new">Unsaved Local Edits</span>}
          </div>
          <div className="hp-toolbar-sub">
            Draft v{meta.draftVersion} · Published v{meta.publishedVersion} · Last published:{' '}
            {lastPubFormatted}
          </div>
        </div>

        <div className="hp-toolbar-actions">
          <button
            type="button"
            className="adm-btn adm-btn-ghost adm-btn-sm"
            onClick={handleDiscardDraft}
            disabled={discarding || saving || publishing}
          >
            {discarding ? 'Resetting...' : 'Discard Draft'}
          </button>

          <button
            type="button"
            className="adm-btn adm-btn-secondary adm-btn-sm"
            onClick={() => setPreviewOpen(true)}
            disabled={saving || publishing}
          >
            Preview Draft
          </button>

          <button
            type="button"
            className="adm-btn adm-btn-secondary adm-btn-sm"
            onClick={handleSaveDraft}
            disabled={saving || publishing}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            className="adm-btn adm-btn-primary adm-btn-sm"
            onClick={handlePublish}
            disabled={publishing || saving}
          >
            {publishing ? 'Publishing...' : 'Publish Live'}
          </button>
        </div>
      </div>

      {isDirty && (
        <div className="hp-inline-banner hp-inline-banner--warn" role="status">
          <span>
            You have unsaved local edits. Click <strong>Save Draft</strong> to store them or{' '}
            <strong>Publish Live</strong> to update the public homepage.
          </span>
        </div>
      )}

      {banner && (
        <div
          className={`hp-inline-banner hp-inline-banner--${
            banner.type === 'error' ? 'error' : 'success'
          }`}
          role="status"
        >
          <span>{banner.message}</span>
          <button
            type="button"
            className="adm-btn adm-btn-ghost adm-btn-sm"
            onClick={() => setBanner(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="hp-editor-layout">
        <aside className="hp-editor-nav" aria-label="Homepage Sections">
          {TABS.map((tab) => {
            const enabled = tab.toggleKey ? draft[tab.toggleKey]?.enabled !== false : true;
            return (
              <button
                key={tab.id}
                type="button"
                className={`hp-nav-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="hp-nav-tab-left">
                  {tab.toggleKey && (
                    <span
                      className={`hp-nav-dot ${enabled ? '' : 'hp-nav-dot--off'}`}
                      title={enabled ? 'Visible' : 'Hidden'}
                    />
                  )}
                  <span>{tab.label}</span>
                </span>
              </button>
            );
          })}
        </aside>

        <section>
          {activeTab === 'hero' && (
            <HeroEditorPanel
              hero={draft.hero}
              onChange={(nextHero) => updateSection('hero', nextHero)}
            />
          )}

          {activeTab === 'about' && (
            <AboutEditorPanel
              about={draft.about}
              onChange={(nextAbout) => updateSection('about', nextAbout)}
            />
          )}

          {activeTab === 'workplace' && (
            <WorkplaceGalleryEditorPanel
              workplace={draft.workplace}
              onChange={(nextWp) => updateSection('workplace', nextWp)}
            />
          )}

          {activeTab === 'leadership' && (
            <PeopleProfilesEditorPanel
              sectionData={draft.leadership}
              onChange={(nextLeadership) => updateSection('leadership', nextLeadership)}
              panelTitle="Leadership & Directors"
              panelDescription="Manage Founders, Directors, and key decision-makers. Upload crisp portraits, adjust Top Center focal framing, and publish authentic executive bios."
              itemLabel="Leader"
              defaultDesignation="Founder / Director"
              defaultPlaceholderPhoto="/assets/placeholders/portrait-leadership-placeholder.svg"
            />
          )}

          {activeTab === 'team' && (
            <PeopleProfilesEditorPanel
              sectionData={draft.team}
              onChange={(nextTeam) => updateSection('team', nextTeam)}
              panelTitle="Team Members"
              panelDescription="Showcase the clinical liaison, hospital coordination, and supply logistics team behind Sriyas Healthcare."
              itemLabel="Team Member"
              defaultDesignation="Clinical & Operations Specialist"
              defaultPlaceholderPhoto="/assets/placeholders/portrait-team-placeholder.svg"
            />
          )}

          {activeTab === 'whatWeDo' && (
            <WhatWeDoEditorPanel
              whatWeDo={draft.whatWeDo}
              onChange={(nextWwd) => updateSection('whatWeDo', nextWwd)}
            />
          )}

          {activeTab === 'values' && (
            <ValuesEditorPanel
              values={draft.values}
              onChange={(nextValues) => updateSection('values', nextValues)}
            />
          )}

          {activeTab === 'callToAction' && (
            <CtaEditorPanel
              callToAction={draft.callToAction}
              onChange={(nextCta) => updateSection('callToAction', nextCta)}
            />
          )}

          {activeTab === 'sectionOrder' && (
            <SectionOrderPanel
              draft={draft}
              onOrderChange={(nextOrder) => updateSection('sectionOrder', nextOrder)}
              onToggleSection={handleToggleSection}
              onNavigateTab={(tabId) => setActiveTab(tabId)}
            />
          )}
        </section>
      </div>

      <HomepagePreviewModal
        isOpen={previewOpen}
        draft={draft}
        onClose={() => setPreviewOpen(false)}
        onPublish={handlePublish}
        publishing={publishing}
      />
    </div>
  );
}
