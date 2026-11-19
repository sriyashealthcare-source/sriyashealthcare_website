import React from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import SmartActionLink from './SmartActionLink';
import ResponsiveMediaImage from './ResponsiveMediaImage';

function renderClickablePhones(phoneStr, isPreview) {
  if (!phoneStr) return null;
  // Support both single phone numbers and compound strings like "+91 96008 04456 · +91 93677 72801"
  const tokens = phoneStr.split(/\s*([·/,|])\s*/);
  return tokens.map((token, idx) => {
    if (/^[·/,|]$/.test(token)) {
      return (
        <span key={idx} className="hp-cta-phone-sep" style={{ opacity: 0.65 }}>
          {' '}{token}{' '}
        </span>
      );
    }
    const cleanNumber = token.replace(/[^\d+]/g, '');
    if (!cleanNumber) return <span key={idx}>{token}</span>;
    const telHref = cleanNumber.startsWith('+') ? cleanNumber : `+${cleanNumber}`;
    return (
      <a
        key={idx}
        href={`tel:${telHref}`}
        className="hp-cta-contact-link"
        onClick={isPreview ? (e) => e.preventDefault() : undefined}
        aria-label={`Call Sriyas Healthcare at ${token}`}
      >
        {token}
      </a>
    );
  });
}

export default function CtaSection({
  callToAction = {},
  animationSettings = {},
  isPreview = false,
  forceMobile = false
}) {
  const scrollRevealEnabled = animationSettings.scrollRevealEnabled !== false;
  const [sectionRef, isVisible] = useRevealOnScroll({
    immediate: isPreview || !scrollRevealEnabled,
    disabled: !scrollRevealEnabled
  });

  if (callToAction.enabled === false) return null;

  const hasBackground = Boolean(
    callToAction.backgroundImage?.url || callToAction.backgroundImage?.mobileUrl
  );

  return (
    <section
      ref={sectionRef}
      id="cta-connect"
      className={`hp-section hp-cta-section ${isVisible ? 'is-revealed' : ''}`}
      aria-labelledby="cta-heading"
    >
      {hasBackground && (
        <div className="hp-cta-custom-bg" aria-hidden="true">
          <ResponsiveMediaImage
            media={callToAction.backgroundImage}
            alt={callToAction.backgroundImage?.alt || ''}
            forceMobile={forceMobile}
          />
          <div className="hp-cta-bg-scrim" />
        </div>
      )}

      <div className="hp-cta-glow" aria-hidden="true" />
      <div className="hp-container">
        <div className="hp-cta-card hp-reveal-child" style={{ '--reveal-delay': '0ms' }}>
          {callToAction.eyebrow && (
            <span className="hp-eyebrow hp-eyebrow--light">{callToAction.eyebrow}</span>
          )}
          <h2 id="cta-heading" className="hp-cta-heading hp-reveal-heading">
            {callToAction.heading || 'Partnering for Better Healthcare.'}
          </h2>
          {callToAction.supportingText && (
            <p className="hp-cta-sub hp-reveal-text">{callToAction.supportingText}</p>
          )}

          <div className="hp-cta-actions">
            {callToAction.primaryButtonText && (
              <SmartActionLink
                to={callToAction.primaryButtonLink || '/products'}
                isPreview={isPreview}
                className="hp-btn-gold"
              >
                <span>{callToAction.primaryButtonText}</span>
                <span aria-hidden="true">→</span>
              </SmartActionLink>
            )}

            {callToAction.secondaryButtonText && (
              <SmartActionLink
                to={callToAction.secondaryButtonLink || '/contact'}
                isPreview={isPreview}
                className="hp-btn-outline hp-btn-outline--light"
              >
                <span>{callToAction.secondaryButtonText}</span>
                <span aria-hidden="true">→</span>
              </SmartActionLink>
            )}
          </div>

          {callToAction.showContactDetails !== false &&
            (callToAction.contactPhone ||
              callToAction.contactEmail ||
              callToAction.contactAddress) && (
              <div className="hp-cta-contact-strip">
                {callToAction.contactPhone && (
                  <div className="hp-cta-contact-item">
                    <span aria-hidden="true">📞</span>
                    <span>{renderClickablePhones(callToAction.contactPhone, isPreview)}</span>
                  </div>
                )}
                {callToAction.contactEmail && (
                  <div className="hp-cta-contact-item">
                    <span>✉</span>
                    <a
                      href={`mailto:${callToAction.contactEmail}`}
                      onClick={isPreview ? (e) => e.preventDefault() : undefined}
                    >
                      {callToAction.contactEmail}
                    </a>
                  </div>
                )}
                {callToAction.contactAddress && (
                  <div className="hp-cta-contact-item hp-cta-contact-address">
                    <span>📍</span>
                    <span>{callToAction.contactAddress}</span>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </section>
  );
}
