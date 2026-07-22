// English translation strings for Citizen Fraud Shield.
// This file is the structural source of truth — hi.ts must mirror this shape.

const en = {
  common: {
    brandLine1: 'Citizen',
    brandLine2: 'Fraud Shield',
    aiOnline: 'AI ONLINE',
    scanNow: 'Scan Now',
    toggleMenu: 'Toggle menu',
  },

  nav: {
    home: 'Home',
    analyze: 'Analyze',
    dashboard: 'Dashboard',
    about: 'About',
  },

  footer: {
    tagline: 'AI-powered scam detection protecting citizens from online fraud. Built for the community, by the community.',
    quickLinksHeading: 'Quick Links',
    quickLinks: {
      home: 'Home',
      analyze: 'Analyze Message',
      dashboard: 'Dashboard',
      about: 'About Us',
    },
    resourcesHeading: 'Resources',
    resources: ['Report Scam', 'How It Works', 'Privacy Policy', 'Terms of Use', 'Contact'],
    copyright: '© 2025 Citizen Fraud Shield. All rights reserved.',
    madeWith: 'Made with',
    madeWithSuffix: 'for a safer internet',
  },

  landing: {
    badge: 'AI-Powered Fraud Detection — Free & Instant',
    headlinePrefix: 'Protect Yourself From',
    headlineHighlight: 'Online Scams',
    headlineSuffix: 'In Seconds',
    subtitle: 'Paste a suspicious message or upload a screenshot. Our AI instantly detects phishing, fraud, and scam patterns — before they hurt you.',
    ctaAnalyze: 'Analyze a Message',
    ctaDashboard: 'View Dashboard',
    trustIndicators: ['No signup required', 'Free forever', 'Privacy-first'],
    aiStatus: {
      title: 'AI Threat Engine',
      status: 'System Operational',
      metrics: [
        { label: 'Detection Accuracy', value: '98.7%' },
        { label: 'Threats Blocked Today', value: '1,204' },
        { label: 'Avg. Response Time', value: '< 2s' },
      ],
    },
    howItWorks: {
      titlePrefix: 'How It',
      titleHighlight: 'Works',
      subtitle: 'Three simple steps to know if a message is safe',
      steps: [
        { num: '01', title: 'Paste or Upload', desc: 'Paste suspicious text or upload a screenshot' },
        { num: '02', title: 'AI Scans', desc: 'Our AI engine analyzes 50+ threat patterns instantly' },
        { num: '03', title: 'Get Results', desc: 'Receive a detailed risk report with actionable advice' },
      ],
    },
    features: {
      titlePrefix: 'Powerful',
      titleHighlight: 'Features',
      subtitle: 'Everything you need to stay protected from modern online fraud',
      items: [
        { title: 'Paste & Analyze', desc: 'Paste any suspicious text message, email, or SMS for instant AI analysis.' },
        { title: 'Screenshot Upload', desc: 'Upload screenshots of suspicious messages for visual pattern analysis.' },
        { title: 'AI Threat Detection', desc: 'Advanced pattern recognition identifies phishing, scams, and social engineering.' },
        { title: 'Risk Scoring', desc: 'Get a detailed threat score with breakdown of every suspicious element detected.' },
        { title: '100% Private', desc: 'Your messages are analyzed locally. Nothing is stored or shared.' },
        { title: 'Global Scam Database', desc: 'Cross-referenced with thousands of known scam patterns from around the world.' },
      ],
    },
    ctaBanner: {
      title: "Don't Be the Next Victim",
      desc: "Scammers are getting smarter every day. Our AI stays ahead of them. Scan any suspicious message right now — it's completely free.",
      button: 'Start Scanning Free',
    },
  },

  analyze: {
    badge: 'Instant AI Analysis',
    titlePrefix: 'Analyze',
    titleHighlight: 'Suspicious Content',
    subtitle: 'Paste a message, upload a screenshot, or enter a URL to get an instant scam risk assessment.',
    modes: {
      text: { label: 'Text Message', desc: 'Paste suspicious text or email' },
      image: { label: 'Screenshot', desc: 'Upload an image to scan' },
      url: { label: 'URL / Link', desc: 'Check a suspicious link' },
    },
    exampleMessages: [
      'URGENT: Your bank account has been suspended! Click here immediately to verify your identity: bit.ly/secure-verify',
      "Congratulations! You've won $5,000. Claim your prize now by entering your SSN and credit card details.",
      'Dear Customer, your Netflix subscription expired. Update payment: http://netfix-billing.com',
      'IRS FINAL NOTICE: Arrest warrant issued. Call 1-800-IRS-FAKE immediately or face legal action!!!',
    ],
    textMode: {
      label: 'Paste suspicious message',
      chars: 'chars',
      placeholder: 'Paste the suspicious email, text message, or social media post here...',
      tryExample: 'Try an example:',
      example: 'Example',
    },
    imageMode: {
      dropHere: 'Drop screenshot here',
      browseHint: 'or click to browse • PNG, JPG, WEBP',
      kb: 'KB',
    },
    urlMode: {
      label: 'Enter suspicious URL or link',
      placeholder: 'https://suspicious-link.com/claim-prize',
      warning: 'Never visit suspicious URLs directly. Paste them here to analyze safely.',
    },
    errors: {
      invalidImage: 'Please upload an image file.',
      emptyText: 'Please paste a message to analyze.',
      emptyUrl: 'Please enter a URL to analyze.',
      noImage: 'Please upload an image.',
      ocrFailed: "We couldn't process that screenshot. Please check your connection and try again with a clearer image.",
    },
    scanButton: {
      scanning: 'Scanning...',
      idle: 'Scan for Threats',
    },
    infoCards: [
      { title: 'AI-Powered', desc: '50+ threat patterns' },
      { title: 'Instant Results', desc: 'Analysis in < 2 seconds' },
      { title: '100% Private', desc: 'Nothing is stored' },
    ],
  },

  scanAnimation: {
    title: 'Analyzing Content',
    subtitle: 'AI scanning for threat patterns...',
  },

  threatBadge: {
    safe: 'SAFE',
    low: 'LOW RISK',
    medium: 'SUSPICIOUS',
    high: 'HIGH RISK',
    critical: 'CRITICAL',
  },

  results: {
    backLink: 'Analyze another message',
    heading: 'Analysis Report',
    aiSummary: 'AI Summary',
    redFlags: 'Red Flags',
    moreIndicators: 'more indicators...',
    safeSignals: 'Safe Signals',
    recommendation: 'Recommendation',
    reportButton: 'Report to Cyber Crime',
    reportSubtitle: 'Complaints are filed directly on the official Government of India Cyber Crime Reporting Portal (cybercrime.gov.in), not through this app.',
    analyzedContent: 'Analyzed Content',
    ocrSectionTitle: 'Screenshot Analysis (OCR)',
    uploadedImage: 'Uploaded Image',
    extractedText: 'Extracted Text',
    ocrConfidence: 'OCR Confidence',
    detectedLanguage: 'Detected Language',
    threatIndicators: 'Threat Indicators',
    copyReport: 'Copy Report',
    copied: 'Copied!',
    scanAnother: 'Scan Another',
    reportTemplate: {
      heading: 'CITIZEN FRAUD SHIELD — ANALYSIS REPORT',
      score: 'Score',
      level: 'Level',
      redFlags: 'Red Flags',
      recommendation: 'Recommendation',
    },
    modal: {
      title: 'Report to Cyber Crime',
      close: 'Close',
      body1Prefix: "You'll be redirected to the Government of India's official",
      body1Highlight: 'National Cyber Crime Reporting Portal',
      body1Suffix: 'to file your complaint.',
      body2Prefix: 'This will open',
      body2Suffix: "in a new tab. No details from this analysis are sent automatically — you'll enter the information yourself on the official site.",
      cancel: 'Cancel',
      continue: 'Continue to Portal',
    },
  },

  dashboard: {
    titlePrefix: 'Threat',
    titleHighlight: 'Dashboard',
    subtitle: 'Real-time fraud detection analytics and history',
    newScan: 'New Scan',
    stats: {
      totalScans: { label: 'Total Scans', sub: 'All time' },
      flagged: { label: 'Flagged', sub: 'Threats detected' },
      clean: { label: 'Clean', sub: 'Safe messages' },
      accuracy: { label: 'Accuracy', sub: 'Detection rate' },
    },
    aiRecommendation: {
      heading: 'AI Recommendation',
      message: 'Elevated phishing activity detected this week, mostly impersonating delivery and banking services.',
      suggestedActionLabel: 'Suggested action:',
      suggestedAction: 'Review flagged scans below',
      confidence: 'Confidence: 94%',
    },
    weeklyActivity: {
      title: 'Weekly Activity',
      last7Days: 'Last 7 days',
      legendTotal: 'Total Scans',
      legendFlagged: 'Flagged',
      scansLabel: 'scans',
    },
    scamTypes: {
      title: 'Scam Types',
      types: [
        { name: 'Phishing', value: 38 },
        { name: 'Financial Fraud', value: 25 },
        { name: 'Lottery Scam', value: 18 },
        { name: 'Impersonation', value: 12 },
        { name: 'Other', value: 7 },
      ],
    },
    recentScans: {
      title: 'Recent Scans',
      total: 'total',
      screenshotFallback: '[Screenshot analysis]',
    },
  },

  about: {
    badge: 'Our Mission',
    heroTitlePrefix: 'Fighting Fraud,',
    heroTitleHighlight: 'One Scan at a Time',
    heroSubtitle: 'Citizen Fraud Shield was built because online scammers target real people — the elderly, the vulnerable, the unsuspecting. We believe everyone deserves free, powerful AI protection.',
    howAiWorks: {
      titlePrefix: 'How Our',
      titleHighlight: 'AI Detection',
      titleSuffix: 'Works',
      subtitle: 'A multi-layer analysis pipeline ensures nothing slips through',
      stepLabel: 'STEP',
      steps: [
        { title: 'Content Extraction', desc: 'Text is extracted from your input — whether typed, pasted, or from an uploaded screenshot via OCR.' },
        { title: 'Pattern Analysis', desc: 'Our AI scans for 50+ scam indicators including urgency tactics, credential requests, suspicious URLs, and social engineering language.' },
        { title: 'Database Cross-Reference', desc: 'Content is compared against our continuously updated database of known scam patterns from global fraud databases.' },
        { title: 'Risk Scoring', desc: 'Each indicator is weighted by severity. A final threat score (0–100) is calculated with confidence metrics.' },
        { title: 'Report Generation', desc: 'A detailed report with specific flagged elements, risk level, and actionable recommendations is generated instantly.' },
      ],
    },
    values: {
      titlePrefix: 'Our',
      titleHighlight: 'Values',
      items: [
        { title: 'Protection First', desc: 'We build every feature with user safety as the primary objective, not afterthought.' },
        { title: 'Privacy by Design', desc: 'Zero data collection. Your messages stay on your device.' },
        { title: 'Community Driven', desc: 'Built for everyone, especially those most vulnerable to online fraud.' },
        { title: 'Free Forever', desc: 'Core protection features will always be free — safety is a human right.' },
      ],
    },
    techStack: {
      titlePrefix: 'Built With',
      titleHighlight: 'Cutting-Edge Tech',
      items: [
        { name: 'AI/ML Engine', desc: 'Pattern recognition & NLP' },
        { name: 'React + TypeScript', desc: 'Frontend framework' },
        { name: 'Threat Database', desc: '50K+ known patterns' },
        { name: 'Privacy-First', desc: 'Zero data retention' },
        { name: 'Real-time API', desc: 'Sub-second analysis' },
        { name: 'Global Coverage', desc: 'Multi-language support' },
      ],
    },
    faq: {
      titlePrefix: 'Frequently Asked',
      titleHighlight: 'Questions',
      items: [
        {
          q: 'How does Citizen Fraud Shield detect scams?',
          a: 'Our AI uses a multi-layer analysis engine that checks for known scam patterns, suspicious keywords, urgency tactics, credential harvesting attempts, malicious URL indicators, and social engineering techniques. It cross-references thousands of known fraud patterns updated daily.',
        },
        {
          q: 'Is my data safe and private?',
          a: 'Absolutely. Your messages are analyzed in-session and never stored on our servers. We do not log, track, or share any content you submit. Your privacy is our top priority.',
        },
        {
          q: 'How accurate is the detection?',
          a: "Our system achieves 98.7% accuracy on known scam patterns. Like any AI system, it may occasionally produce false positives. Always use your judgment alongside our results — especially for borderline cases.",
        },
        {
          q: 'Can it analyze screenshots?',
          a: 'Yes! Upload any screenshot and our system will extract text using OCR technology and run it through the same AI detection pipeline as text inputs.',
        },
        {
          q: 'Is Citizen Fraud Shield free to use?',
          a: 'Yes, completely free. Our mission is to protect citizens from online fraud, not to monetize safety. The core detection features will always be free.',
        },
        {
          q: 'What types of scams can it detect?',
          a: 'We detect phishing emails, SMS scams, lottery/prize fraud, romance scams, tech support fraud, IRS/government impersonation, advance-fee fraud, investment scams, and more.',
        },
      ],
    },
    cta: {
      title: 'Ready to Stay Safe?',
      desc: 'Scan your first suspicious message — completely free, no signup needed.',
      button: 'Start Protecting Yourself',
    },
  },
};

export default en;
export type Locale = typeof en;
