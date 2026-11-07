import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Sriyas Healthcare Pvt Ltd | Advanced Surgical & Medical Solutions';
  }, []);

  return (
    <section className="hero" id="home-section" aria-label="Hero Introduction">
      <div className="hero-content">
        <h1 className="sr-only">
          Sriyas Healthcare Pvt Ltd - Advanced Surgical Products &amp; Healthcare Solutions
        </h1>
        <img
          className="hero-logo"
          src="/assets/logos/sriyas-hero-logo.png"
          alt="Sriyas Healthcare Pvt Ltd"
        />
        <p className="hero-tagline">Empowering Healthcare with Care and Innovation</p>
        <div className="eyebrow-tag">Care &middot; Trust &middot; Innovation</div>
        <div className="hero-divider" />
        <button
          type="button"
          className="hero-cta"
          onClick={() => navigate('/contact')}
        >
          Get in Touch
        </button>
      </div>
    </section>
  );
}

