import React, { useEffect } from 'react';

export default function Contact() {
  useEffect(() => {
    document.title = 'Contact Us | Sriyas Healthcare Pvt Ltd';
  }, []);

  return (
    <section className="contact-section" id="contact-section" aria-label="Contact Information">
      <div className="contact-header">
        <div className="eyebrow">Reach Us</div>
        <h2>Contact Sriyas Healthcare</h2>
        <p>
          We&apos;re here to help. Reach out to us through any of the channels below and our team
          will get back to you promptly.
        </p>
      </div>

      <div className="contact-grid">
        <div className="contact-card">
          <div className="contact-icon">🏢</div>
          <h3>Company</h3>
          <p>Sriyas Healthcare Private Limited</p>
        </div>

        <div className="contact-card">
          <div className="contact-icon">📍</div>
          <h3>Address</h3>
          <p>
            Plot No.53A, First Floor,
            <br />
            East Facing, Oil Mill Road,
            <br />
            Maruthi Nagar, Karambakkam,
            <br />
            Thundalam, Chennai - 600077
          </p>
        </div>

        <div className="contact-card">
          <div className="contact-icon">📞</div>
          <h3>Phone</h3>
          <a href="tel:+919600804456">9600804456</a>
          <br />
          <a href="tel:+919367772801">9367772801</a>
        </div>

        <div className="contact-card">
          <div className="contact-icon">✉</div>
          <h3>Email</h3>
          <a href="mailto:Sriyashealthcare@gmail.com">Sriyashealthcare@gmail.com</a>
        </div>

        <div className="contact-card">
          <div className="contact-icon">🧾</div>
          <h3>GST</h3>
          <p>33ABQCS4744P1ZJ</p>
        </div>

        <div className="contact-card">
          <div className="contact-icon">📄</div>
          <h3>DL No</h3>
          <p>
            TN/Z04/20B/01443 &amp;
            <br />
            TN/Z04/21B/01443
          </p>
        </div>
      </div>

      <a
        className="map-wrap"
        href="https://maps.app.goo.gl/H981BLR5kQ2Yz1Sr7?g_st=iw"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open our location in Google Maps"
      >
        <img
          className="map-photo"
          src="/assets/contact/storefront-location.jpg"
          alt="Sriyas Healthcare storefront location"
          loading="lazy"
        />
        <span className="map-overlay">📍 View Location</span>
      </a>

      <div className="map-link-wrap">
        <a
          className="map-link"
          href="https://maps.app.goo.gl/H981BLR5kQ2Yz1Sr7?g_st=iw"
          target="_blank"
          rel="noopener noreferrer"
        >
          📍 Open in Google Maps
        </a>
      </div>
    </section>
  );
}

