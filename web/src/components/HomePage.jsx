import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PublicLayout from './layouts/PublicLayout.jsx';
import Hero from './landing/Hero.jsx';
import SocialProof from './landing/SocialProof.jsx';
import HowItWorks from './landing/HowItWorks.jsx';
import FeatureGrid from './landing/FeatureGrid.jsx';
import UseCases from './landing/UseCases.jsx';
import Integrations from './landing/Integrations.jsx';
import SecureByDesign from './landing/SecureByDesign.jsx';
import AppDialog from './ui/AppDialog.jsx';

const HomePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dialog, setDialog] = useState(null);

  const openFilePicker = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setDialog({
        title: 'Unsupported file',
        message: 'Please select a valid PDF file.',
        primaryLabel: 'OK',
        primaryTo: null,
      });
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
    <PublicLayout showOneTap showDecor onOpenPdf={openFilePicker}>
      <AppDialog
        dialog={dialog}
        onCancel={() => setDialog(null)}
        onConfirm={() => setDialog(null)}
      />
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
      <section className="px-6 pb-4">
        <div className="mx-auto w-full max-w-6xl rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          DecoDocs provides informational analysis and is not legal advice. For legal decisions, consult a qualified professional.
        </div>
      </section>
      <UseCases />
      <SecureByDesign />
    </PublicLayout>
  );
};

export default HomePage;
