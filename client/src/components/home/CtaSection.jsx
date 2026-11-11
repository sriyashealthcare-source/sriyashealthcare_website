import React from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';
import SmartActionLink from './SmartActionLink';

export default function CtaSection({ callToAction = {}, isPreview = false }) {
  const [sectionRef, isVisible] = useRevealOnScroll({ immediate: isPreview });

  if (callToAction.enabled === false) return null;

  return (
    <section
      ref={sectionRef}
      id="cta-connect"
      className={`hp-section hp-cta-section ${isVisible ? 'is-revealed' : ''}`}
      aria-labelledby="cta-heading"
    >
      <div className="hp-cta-glow" aria-hidden="true" />
      <div className="hp-container">
        <div className="hp-cta-card hp-reveal-child" style={{ '--reveal-delay': '0ms' }}>
          {callToAction.eyebrow && (
            <span className="hp-eyebrow hp-eyebrow--light">{callToAction.eyebrow}</span>
          )}
          <h2 id="cta-heading" className="hp-cta-heading">
            {callToAction.heading || "Let's Build Better Healthcare Together."}
          </h2>
          {callToAction.supportingText && (
            <p className="hp-cta-sub">{callToAction.supportingText}</p>
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
        </div>
      </div>
    </section>
  );
}

