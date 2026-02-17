export const socialProofLogos = [
  'Northwind Legal',
  'Acme Ventures',
  'Solaris Health',
  'Beacon Realty',
  'Atlas Finance',
  'Bluebird Energy'
];

export const socialProofStats = [
  {
    label: 'Docs decoded',
    value: '42k+'
  },
  {
    label: 'Average time saved',
    value: '3.4 hrs'
  },
  {
    label: 'Risk flags identified',
    value: '128k+'
  }
];

export const howItWorksSteps = [
  {
    title: 'Upload or open a PDF',
    description: 'Drop in a contract, policy, or report. No setup required.'
  },
  {
    title: 'Decode with AI',
    description: 'We translate the text, highlight obligations, and surface risks.'
  },
  {
    title: 'Act with clarity',
    description: 'Export notes or send for signature only when you are ready.'
  }
];

export const featureGridItems = [
  {
    title: 'Plain-language summaries',
    description: 'Every section is rewritten into clear, actionable language.'
  },
  {
    title: 'Risk and obligation flags',
    description: 'Spot penalties, expiry traps, and one-sided clauses fast.'
  },
  {
    title: 'Side-by-side evidence',
    description: 'See the original text next to the AI explanation.'
  },
  {
    title: 'Shareable decision reports',
    description: 'Create a clean, board-ready summary in one click.'
  },
  {
    title: 'Structured highlights',
    description: 'Tag sections as financial, legal, or operational.'
  },
  {
    title: 'Secure by design',
    description: 'Free mode never stores files. Pro adds private vaults.'
  }
];

export const useCases = [
  {
    slug: 'procurement-teams',
    title: 'Procurement teams',
    description: 'Speed up vendor reviews without missing hidden liabilities.',
    audience: 'Procurement',
    heroTitle: 'Review supplier contracts with less back-and-forth',
    heroDescription: 'Get clear obligations, risk hotspots, and negotiation points before legal and finance sign-off.',
    documentTypes: [
      'Master service agreements',
      'Order forms and pricing schedules',
      'Security and data processing addenda',
      'Renewal and termination terms'
    ],
    painPoints: [
      'Commercial terms are spread across annexes and riders.',
      'Auto-renewal and notice periods are easy to miss.',
      'Risk language is hard to summarize for non-legal stakeholders.',
      'Vendor redlines can hide one-sided liabilities.'
    ],
    workflow: [
      {
        step: 'Collect the vendor packet',
        detail: 'Open the MSA, order form, and policy addenda in one review flow.'
      },
      {
        step: 'Surface obligations by category',
        detail: 'Map payment, liability, security, and termination clauses into clear buckets.'
      },
      {
        step: 'Export a negotiation brief',
        detail: 'Share key risks, fallback language, and decision notes with legal and budget owners.'
      }
    ],
    deliverables: [
      'Clause-level summary for internal approvals',
      'Priority list of terms to negotiate',
      'Renewal and notice-date watchlist',
      'Decision-ready brief for leadership'
    ],
    highlights: [
      { label: 'Main outcome', value: 'Faster contract triage' },
      { label: 'Best for', value: 'High-volume vendor intake' },
      { label: 'Team fit', value: 'Procurement + Legal + Finance' }
    ],
    cta: {
      primaryLabel: 'Open procurement review',
      primaryTo: '/view',
      secondaryLabel: 'Talk to the team',
      secondaryTo: '/contact'
    }
  },
  {
    slug: 'startup-founders',
    title: 'Startup founders',
    description: 'Understand term sheets and SaaS agreements fast.',
    audience: 'Founders',
    heroTitle: 'Get investor and vendor terms into plain language quickly',
    heroDescription: 'Move faster in fundraising and operations without signing unclear clauses under pressure.',
    documentTypes: [
      'SAFE notes and term sheets',
      'SaaS contracts and procurement agreements',
      'Partnership and channel agreements',
      'Advisory and contractor contracts'
    ],
    painPoints: [
      'Legal wording slows decisions during fundraising windows.',
      'Operational agreements include hidden lock-ins.',
      'Founders need to brief co-founders and advisors quickly.',
      'Critical downside terms are buried in dense clauses.'
    ],
    workflow: [
      {
        step: 'Open the latest draft',
        detail: 'Load investor or vendor documents without changing your existing process.'
      },
      {
        step: 'Identify non-standard terms',
        detail: 'Highlight liquidation preferences, assignment terms, and exclusivity language.'
      },
      {
        step: 'Prepare founder decision notes',
        detail: 'Capture what to accept, what to renegotiate, and what needs external counsel.'
      }
    ],
    deliverables: [
      'Executive summary for co-founders',
      'Negotiation checklist before signature',
      'Risk flags with source text evidence',
      'Clear list of terms requiring legal review'
    ],
    highlights: [
      { label: 'Main outcome', value: 'Higher decision confidence' },
      { label: 'Best for', value: 'Lean teams with limited legal bandwidth' },
      { label: 'Team fit', value: 'Founders + Advisors' }
    ],
    cta: {
      primaryLabel: 'Open founder workflow',
      primaryTo: '/view',
      secondaryLabel: 'Ask a question',
      secondaryTo: '/contact'
    }
  },
  {
    slug: 'hr-people-ops',
    title: 'HR & people ops',
    description: 'Review contracts, handbooks, and compliance updates with confidence.',
    audience: 'People Ops',
    heroTitle: 'Reduce people-risk in employment documentation',
    heroDescription: 'Keep employment terms consistent and understandable across contracts, policies, and updates.',
    documentTypes: [
      'Employment contracts and offer letters',
      'Employee handbook updates',
      'Workplace policy and compliance notices',
      'Contractor and consultant agreements'
    ],
    painPoints: [
      'Policy updates are difficult to compare release to release.',
      'Employment terms can drift across templates and locations.',
      'Managers need concise summaries for practical application.',
      'Risk language must be tracked before rollout.'
    ],
    workflow: [
      {
        step: 'Review policy or contract drafts',
        detail: 'Analyze updates before distribution or employee signature.'
      },
      {
        step: 'Spot inconsistencies and edge cases',
        detail: 'Flag conflicting obligations, unclear wording, and potential compliance risk.'
      },
      {
        step: 'Ship a manager-friendly summary',
        detail: 'Provide plain-language guidance for leaders and HR business partners.'
      }
    ],
    deliverables: [
      'Policy change summary in plain language',
      'Inconsistency and ambiguity report',
      'Manager communication draft points',
      'Pre-release checklist for HR approval'
    ],
    highlights: [
      { label: 'Main outcome', value: 'More consistent policy rollouts' },
      { label: 'Best for', value: 'Distributed teams and frequent updates' },
      { label: 'Team fit', value: 'HR + Legal + Operations' }
    ],
    cta: {
      primaryLabel: 'Open HR review flow',
      primaryTo: '/view',
      secondaryLabel: 'Contact us',
      secondaryTo: '/contact'
    }
  },
  {
    slug: 'property-managers',
    title: 'Property managers',
    description: 'Decode leases, maintenance agreements, and building policies.',
    audience: 'Property',
    heroTitle: 'Handle lease and building terms with fewer surprises',
    heroDescription: 'Understand obligations across tenants, vendors, and owners before commitments become operational issues.',
    documentTypes: [
      'Commercial and residential lease agreements',
      'Maintenance and service contracts',
      'Building compliance and policy documents',
      'Owner and tenant amendments'
    ],
    painPoints: [
      'Obligations vary by lease template and special conditions.',
      'Maintenance responsibility language is often ambiguous.',
      'Penalty and default terms are hard to track at scale.',
      'Team handoffs create context loss between operations and legal.'
    ],
    workflow: [
      {
        step: 'Open lease and service agreements',
        detail: 'Review clauses that directly impact operations, timelines, and cost.'
      },
      {
        step: 'Map obligations by stakeholder',
        detail: 'Separate owner, tenant, and vendor responsibilities into clear action items.'
      },
      {
        step: 'Create an operational handoff',
        detail: 'Export key terms for facilities, finance, and portfolio managers.'
      }
    ],
    deliverables: [
      'Responsibility matrix by party',
      'Critical date and notice summary',
      'Risk flags for penalties and defaults',
      'Operations-ready implementation notes'
    ],
    highlights: [
      { label: 'Main outcome', value: 'Clearer cross-team execution' },
      { label: 'Best for', value: 'Multi-site lease portfolios' },
      { label: 'Team fit', value: 'Property + Facilities + Finance' }
    ],
    cta: {
      primaryLabel: 'Open lease review',
      primaryTo: '/view',
      secondaryLabel: 'Discuss your workflow',
      secondaryTo: '/contact'
    }
  },
  {
    slug: 'legal-teams',
    title: 'Legal teams',
    description: 'Review NDAs, IP agreements, and litigation documents.',
    audience: 'Legal',
    heroTitle: 'Accelerate first-pass review without sacrificing control',
    heroDescription: 'Triage high-volume legal documents so counsel can focus on strategy, exceptions, and negotiation.',
    documentTypes: [
      'NDAs and confidentiality agreements',
      'IP assignment and license contracts',
      'Supplier and customer agreements',
      'Pre-litigation and dispute documentation'
    ],
    painPoints: [
      'Document volume delays turnaround for business teams.',
      'Standard clauses still require repetitive first-pass checks.',
      'Counsel time is consumed by low-value extraction work.',
      'Stakeholders need evidence-backed summaries, not guesses.'
    ],
    workflow: [
      {
        step: 'Run first-pass analysis',
        detail: 'Extract obligations, carve-outs, and unusual terms across drafts.'
      },
      {
        step: 'Prioritize legal attention',
        detail: 'Escalate clauses by materiality so counsel focuses where judgment is required.'
      },
      {
        step: 'Deliver stakeholder brief',
        detail: 'Share concise legal findings with commercial and operational owners.'
      }
    ],
    deliverables: [
      'First-pass clause extraction pack',
      'Material-risk escalation shortlist',
      'Source-linked summary for business partners',
      'Review trail for team collaboration'
    ],
    highlights: [
      { label: 'Main outcome', value: 'Better legal throughput' },
      { label: 'Best for', value: 'High-volume contract teams' },
      { label: 'Team fit', value: 'Legal + Procurement + Sales Ops' }
    ],
    cta: {
      primaryLabel: 'Open legal review',
      primaryTo: '/view',
      secondaryLabel: 'Contact legal support',
      secondaryTo: '/contact'
    }
  },
  {
    slug: 'finance-teams',
    title: 'Finance teams',
    description: 'Analyze investment docs, loan agreements, and financial contracts.',
    audience: 'Finance',
    heroTitle: 'Understand financial obligations before they hit your model',
    heroDescription: 'Turn dense agreements into structured obligations that finance teams can validate and plan against.',
    documentTypes: [
      'Loan and debt agreements',
      'Investment and shareholder documents',
      'Revenue-share and pricing contracts',
      'Guarantee and covenant schedules'
    ],
    painPoints: [
      'Covenants and triggers are hard to map into planning cycles.',
      'Fee and penalty terms are easy to underestimate.',
      'Finance needs clear inputs from legal language.',
      'Decision deadlines are tight when documents are complex.'
    ],
    workflow: [
      {
        step: 'Analyze obligations and covenants',
        detail: 'Highlight repayment terms, reporting duties, and breach triggers.'
      },
      {
        step: 'Convert clauses into finance inputs',
        detail: 'Translate legal language into assumptions your team can model.'
      },
      {
        step: 'Share a risk-aware decision memo',
        detail: 'Align CFO, legal, and leadership on impact before acceptance.'
      }
    ],
    deliverables: [
      'Covenant and trigger register',
      'Financial risk summary with evidence',
      'Decision memo for leadership review',
      'Checklist for post-signature monitoring'
    ],
    highlights: [
      { label: 'Main outcome', value: 'Cleaner planning inputs' },
      { label: 'Best for', value: 'Debt and investment document review' },
      { label: 'Team fit', value: 'Finance + Legal + Executive' }
    ],
    cta: {
      primaryLabel: 'Open finance review',
      primaryTo: '/view',
      secondaryLabel: 'Talk to us',
      secondaryTo: '/contact'
    }
  }
];

export const pricingPlans = [
  {
    name: 'Starter',
    description: 'For personal use and quick document checks.',
    monthlyPrice: 0,
    annualPrice: 0,
    cta: 'Start free',
    highlights: [
      '40k tokens/day AI budget',
      'Text-only PDF support',
      'No cloud storage (privacy-first)',
      'Basic risk highlighting'
    ]
  },
  {
    name: 'Pro',
    description: 'Advanced AI and private cloud storage.',
    monthlyPrice: 5,
    annualPrice: 60,
    cta: 'Upgrade to Pro',
    isPopular: true,
    highlights: [
      'Unlimited AI analysis',
      'OCR for scanned PDFs',
      '5GB private cloud storage',
      'Priority vision models'
    ]
  },
  {
    name: 'Business',
    description: 'For small teams needing shared visibility.',
    monthlyPrice: 50,
    annualPrice: 600,
    cta: 'Start Business',
    highlights: [
      'Everything in Pro',
      'Up to 5 worker accounts',
      'Shared team document vaults',
      'Consolidated billing'
    ]
  }
];

export const faqs = [
  {
    question: 'Can I use DecoDocs without uploading a file?',
    answer: 'Yes. The free workflow lets you open a PDF locally with no storage.'
  },
  {
    question: 'Do you replace legal advice?',
    answer: 'No. We provide clarity, risk highlighting, and summaries to speed review.'
  },
  {
    question: 'What happens to my documents?',
    answer: 'Free mode does not store files. Pro stores documents in a private vault you control.'
  },
  {
    question: 'Can I export my insights?',
    answer: 'Yes. Pro exports a summary report and key obligations list.'
  }
];

export const footerLinks = {
  product: [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Use cases', href: '#use-cases' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Open viewer', href: '/view' }
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' }
  ],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' }
  ]
};
