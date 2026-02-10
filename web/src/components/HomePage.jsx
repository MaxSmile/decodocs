import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import LandingLayout from './landing/Layout.jsx';
import Hero from './landing/Hero.jsx';
import SocialProof from './landing/SocialProof.jsx';
import HowItWorks from './landing/HowItWorks.jsx';
import FeatureGrid from './landing/FeatureGrid.jsx';
import UseCases from './landing/UseCases.jsx';
import Integrations from './landing/Integrations.jsx';
import SecureByDesign from './landing/SecureByDesign.jsx';

const HomePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const openFilePicker = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      // eslint-disable-next-line no-alert
      alert('Please select a valid PDF file');
      event.target.value = '';
      return;
    }

    // Track analytics event
    if (window.gtag) {
      window.gtag('event', 'home_open_pdf_click', {
        event_category: 'engagement',
        event_label: 'landing_open_pdf',
      });
    }

    // Navigate to viewer with the PDF file in route state
    navigate('/view', {
      state: {
        document: {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          file,
        },
      },
    });

    // allow re-selecting the same file
    event.target.value = '';
  };

  return (
    <LandingLayout onOpenPdf={openFilePicker}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <Hero onOpenPdf={openFilePicker} />
      <SocialProof />
      <HowItWorks />
      <Integrations />
      <FeatureGrid />
      <UseCases />
      <SecureByDesign />
    </LandingLayout>
  );
};

export default HomePage;
