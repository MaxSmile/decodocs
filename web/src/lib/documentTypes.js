// DecoDocs document type registry
// Used for intake classification + user override UI.

export const DOC_CATEGORIES = {
  UNREADABLE: 'UNREADABLE',
  GENERAL: 'GENERAL',
  BUSINESS_LEGAL: 'BUSINESS_LEGAL',
};

/**
 * Keep this list practical: start coarse and expand.
 * id should be stable (used for persistence).
 */
export const DOCUMENT_TYPES = [
  // --- UNREADABLE / special ---
  {
    id: 'unreadable_broken',
    label: 'Unreadable / broken file',
    category: DOC_CATEGORIES.UNREADABLE,
    synonyms: ['corrupt', 'broken', 'invalid pdf', 'cannot open', 'damaged'],
  },
  {
    id: 'unreadable_encrypted',
    label: 'Password-protected / encrypted',
    category: DOC_CATEGORIES.UNREADABLE,
    synonyms: ['encrypted', 'password', 'protected'],
  },
  {
    id: 'unreadable_empty',
    label: 'Empty / blank document',
    category: DOC_CATEGORIES.UNREADABLE,
    synonyms: ['blank', 'empty', 'no text'],
  },

  // --- GENERAL ---
  {
    id: 'general_letter',
    label: 'Letter (general / personal)',
    category: DOC_CATEGORIES.GENERAL,
    synonyms: ['letter', 'correspondence', 'personal letter'],
  },
  {
    id: 'general_police_letter',
    label: 'Police letter / notice',
    category: DOC_CATEGORIES.GENERAL,
    synonyms: ['police', 'notice', 'infringement', 'fine', 'offence'],
  },
  {
    id: 'general_presentation',
    label: 'Presentation / pitch deck',
    category: DOC_CATEGORIES.GENERAL,
    synonyms: ['deck', 'slides', 'presentation', 'pitch'],
  },
  {
    id: 'general_marketing',
    label: 'Flyer / advertisement / marketing',
    category: DOC_CATEGORIES.GENERAL,
    synonyms: ['flyer', 'ad', 'advertisement', 'brochure', 'marketing'],
  },
  {
    id: 'general_book',
    label: 'Book / long-form text',
    category: DOC_CATEGORIES.GENERAL,
    synonyms: ['book', 'chapter', 'novel', 'story', 'longform'],
  },
  {
    id: 'general_notes',
    label: 'Notes / diary / journal',
    category: DOC_CATEGORIES.GENERAL,
    synonyms: ['notes', 'diary', 'journal', 'private notes'],
  },
  {
    id: 'general_schedule',
    label: 'Schedule / timetable',
    category: DOC_CATEGORIES.GENERAL,
    synonyms: ['schedule', 'timetable', 'calendar', 'rota'],
  },
  {
    id: 'general_resume_cv',
    label: 'Resume / CV',
    category: DOC_CATEGORIES.GENERAL,
    synonyms: ['resume', 'cv', 'curriculum vitae', 'work experience', 'education', 'skills'],
  },

  // --- BUSINESS / LEGAL ---
  {
    id: 'legal_job_offer',
    label: 'Job offer / offer letter',
    category: DOC_CATEGORIES.BUSINESS_LEGAL,
    synonyms: ['offer letter', 'job offer', 'employment offer', 'compensation', 'salary', 'starting date'],
  },

  // --- BUSINESS / LEGAL ---
  {
    id: 'legal_contract_generic',
    label: 'Contract / agreement (general)',
    category: DOC_CATEGORIES.BUSINESS_LEGAL,
    synonyms: ['agreement', 'contract', 'terms', 'conditions'],
  },
  {
    id: 'legal_employment_contract',
    label: 'Employment contract',
    category: DOC_CATEGORIES.BUSINESS_LEGAL,
    synonyms: ['employment', 'employee', 'employer', 'salary', 'position'],
  },
  {
    id: 'legal_nda',
    label: 'NDA / confidentiality agreement',
    category: DOC_CATEGORIES.BUSINESS_LEGAL,
    synonyms: ['nda', 'non-disclosure', 'confidentiality'],
  },
  {
    id: 'legal_lease_residential',
    label: 'Residential lease / tenancy agreement',
    category: DOC_CATEGORIES.BUSINESS_LEGAL,
    synonyms: ['lease', 'tenancy', 'rent', 'bond', 'landlord', 'tenant'],
  },
  {
    id: 'legal_lease_commercial',
    label: 'Commercial lease',
    category: DOC_CATEGORIES.BUSINESS_LEGAL,
    synonyms: ['commercial lease', 'premises', 'outgoings'],
  },
  {
    id: 'business_invoice',
    label: 'Invoice',
    category: DOC_CATEGORIES.BUSINESS_LEGAL,
    synonyms: ['invoice', 'tax invoice', 'payment due'],
  },
  {
    id: 'business_purchase_order',
    label: 'Purchase order',
    category: DOC_CATEGORIES.BUSINESS_LEGAL,
    synonyms: ['purchase order', 'po', 'order'],
  },
  {
    id: 'policy_privacy',
    label: 'Privacy policy',
    category: DOC_CATEGORIES.BUSINESS_LEGAL,
    synonyms: ['privacy policy', 'personal information', 'data collection'],
  },
  {
    id: 'policy_terms',
    label: 'Terms of service / website terms',
    category: DOC_CATEGORIES.BUSINESS_LEGAL,
    synonyms: ['terms of service', 'terms', 'conditions', 'website terms'],
  },
];

export const findDocumentTypes = (query) => {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return DOCUMENT_TYPES;

  const score = (t) => {
    const label = t.label.toLowerCase();
    if (label.includes(q)) return 100;
    const syn = (t.synonyms || []).join(' ').toLowerCase();
    if (syn.includes(q)) return 80;
    // crude fuzzy: all tokens appear
    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.length && tokens.every((tok) => label.includes(tok) || syn.includes(tok))) return 60;
    return 0;
  };

  return DOCUMENT_TYPES
    .map((t) => ({ t, s: score(t) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.t);
};
