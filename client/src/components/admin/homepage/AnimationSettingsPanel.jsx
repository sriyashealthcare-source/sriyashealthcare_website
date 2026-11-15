import React from 'react';

export default function AnimationSettingsPanel({ animationSettings = {}, onChange }) {
  const current = {
    scrollRevealEnabled: animationSettings.scrollRevealEnabled !== false,
    galleryParallaxEnabled: animationSettings.galleryParallaxEnabled !== false,
    imageHoverEnabled: animationSettings.imageHoverEnabled !== false,
    counterAnimationEnabled: animationSettings.counterAnimationEnabled !== false
  };

  const handleToggle = (key, value) => {
    onChange({
      ...current,
      [key]: value
    });
  };

  const handleResetDefaults = () => {
    onChange({
      scrollRevealEnabled: true,
      galleryParallaxEnabled: true,
      imageHoverEnabled: true,
      counterAnimationEnabled: true
    });
  };

  const settingsList = [
    {
      key: 'scrollRevealEnabled',
      title: 'Scroll-Based Section Reveal Animations',
      badge: 'Feature 1',
      desc: 'Progressively reveals section headings, paragraphs, collage images, and cards as visitors scroll down the page using smooth, restrained fade-up transitions.'
    },
    {
      key: 'galleryParallaxEnabled',
      title: 'Company Gallery Subtle Parallax',
      badge: 'Feature 2',
      desc: 'Applies restrained vertical parallax movement (max ±14px) to alternating gallery images during scroll. Automatically disabled on mobile screens (<768px).'
    },
    {
      key: 'imageHoverEnabled',
      title: 'Premium Image Hover Interactions',
      badge: 'Feature 3',
      desc: 'Activates gentle zoom (scale 1.05) and luminous gold overlay sheen when hovering over gallery photos, leadership portraits, and team member images on desktop.'
    },
    {
      key: 'counterAnimationEnabled',
      title: 'Animated Statistics Counter',
      badge: 'Feature 4',
      desc: 'Smoothly counts numerical metrics from zero to their configured values with natural cubic deceleration when the statistics section enters the viewport.'
    }
  ];

  return (
    <div className="hp-panel">
      <div className="hp-panel-header">
        <div>
          <h2 className="hp-panel-title">Homepage Animation Settings</h2>
          <p className="hp-panel-desc">
            Configure the 4 core animation features across the Sriyas Healthcare homepage.
            All animations respect visitor OS accessibility settings (<code>prefers-reduced-motion</code>).
          </p>
        </div>
        <div>
          <button
            type="button"
            className="adm-btn adm-btn-secondary adm-btn-sm"
            onClick={handleResetDefaults}
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      <div className="hp-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {settingsList.map((item) => (
            <div
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '18px 20px',
                border: '1px solid #e7decd',
                borderRadius: '12px',
                background: current[item.key] ? '#ffffff' : '#faf8f5',
                transition: 'background 0.2s ease'
              }}
            >
              <div style={{ flex: 1, paddingRight: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(212, 175, 55, 0.15)',
                      color: '#8A6A1F',
                      fontWeight: 700,
                      fontSize: '0.74rem',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {item.badge}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 600, color: '#242424' }}>
                    {item.title}
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#666', lineHeight: 1.55 }}>
                  {item.desc}
                </p>
              </div>

              <div style={{ paddingTop: '4px' }}>
                <label className="hp-switch" aria-label={`Toggle ${item.title}`}>
                  <input
                    type="checkbox"
                    checked={current[item.key]}
                    onChange={(e) => handleToggle(item.key, e.target.checked)}
                  />
                  <span className="hp-switch-slider" />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

