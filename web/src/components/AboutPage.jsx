import React from 'react';
import { Link } from 'react-router-dom';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      <header className="App-header">
        <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
          <h1>DecoDocs</h1>
          <p><strong>Decode documents. Act with confidence.</strong></p>
        </Link>
      </header>

      <main className="about-main">
        <div className="about-container">
          {/* Header Section */}
          <section className="about-header">
            <h1>About SnapSign</h1>
            <p>
              SnapSign is a document intelligence product designed to help people understand what they are about to sign. 
              Before any signature, SnapSign explains documents in plain language, highlights caveats and unfair conditions, 
              flags logical inconsistencies, and provides translations when needed. Decodocs is the document analysis layer 
              of SnapSign. Our focus is clarity before commitment.
            </p>
          </section>

          {/* Product Philosophy */}
          <section className="product-philosophy">
            <h2>What We Believe</h2>
            <ul className="philosophy-list">
              <li>Documents should be understood before being signed</li>
              <li>AI should reduce information asymmetry, not introduce new ones</li>
              <li>Free users deserve real value, not crippled features</li>
              <li>We charge only for real costs: deeper analysis and storage</li>
              <li>Documents belong to users, not platforms</li>
            </ul>
          </section>

          {/* Scope Definition */}
          <section className="scope-definition">
            <h2>What SnapSign Is — and Is Not</h2>
            <div className="scope-columns">
              <div className="scope-column">
                <h3>Is</h3>
                <ul>
                  <li>Pre-signature document analysis</li>
                  <li>Plain-language explanation</li>
                  <li>Caveat and unfair-condition detection</li>
                  <li>Logical inconsistency checks</li>
                  <li>Ephemeral processing by default</li>
                </ul>
              </div>
              <div className="scope-column">
                <h3>Is Not</h3>
                <ul>
                  <li>A document editor</li>
                  <li>A document management system</li>
                  <li>A "sign now, think later" tool</li>
                  <li>A storage-first SaaS</li>
                  <li>A replacement for legal advice</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Decodocs Clarification */}
          <section className="decodocs-clarification">
            <h2>About Decodocs</h2>
            <p>
              Decodocs is the document analysis component of SnapSign. It provides structured document decoding, 
              analysis depth control, and optional storage for paid users. Decodocs is not a separate product; 
              it is the concrete implementation of SnapSign's core idea.
            </p>
          </section>

          {/* Team & Company */}
          <section className="team-company">
            <h2>Company</h2>
            <p>
              SnapSign is built by a small, focused team with backgrounds in software engineering, automation, 
              and privacy-first systems. We prioritize correctness, transparency, and long-term maintainability.
            </p>
            <div className="legal-block">
              <p>SnapSign Pty Ltd</p>
              <p>ABN 72 679 570 757</p>
              <p>Australia</p>
            </div>
          </section>

          {/* Collaboration & Contact */}
          <section className="collaboration-contact">
            <h2>Collaboration</h2>
            <p>
              We welcome serious collaboration and partnership enquiries. For certain discussions, 
              a Non-Disclosure Agreement (NDA) may be required before sharing internal details.
            </p>
            <div className="contact-info">
              <p>Email: <a href="mailto:partnerships@snapsign.com.au">partnerships@snapsign.com.au</a></p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="about-footer">
        <div className="footer-content">
          <p>© SnapSign Pty Ltd</p>
          <p>ABN 72 679 570 757</p>
          <div className="footer-links">
            <Link to="/about">About</Link>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;