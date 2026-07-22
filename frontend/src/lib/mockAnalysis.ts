export type ThreatLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';
export type Language = 'en' | 'hi';

export interface ThreatIndicator {
  type: string;
  description: string;
  severity: ThreatLevel;
  found: string[];
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  input: string;
  inputType: 'text' | 'image' | 'url';
  score: number; // 0–100
  threatLevel: ThreatLevel;
  label: string;
  summary: string;
  indicators: ThreatIndicator[];
  redFlags: string[];
  safeSignals: string[];
  recommendation: string;
  // Present for screenshot scans that went through the real OCR pipeline.
  sourceFilename?: string;
  extractedText?: string;
  ocrConfidence?: number; // 0–1
  detectedLanguage?: string;
  imageUrl?: string;
}

// Stable pattern ids used to look up localized copy at render time.
type PatternId =
  | 'urgency' | 'suspiciousLink' | 'accountPhishing' | 'lotteryScam' | 'credentialTheft'
  | 'paymentScam' | 'baitOffer' | 'authorityImpersonation' | 'accountThreat' | 'shortenedUrl'
  | 'financialLure' | 'secrecyRequest' | 'advanceFeeFraud' | 'malwareDistribution' | 'genericSalutation';

type SafeSignalId = 'knownSenderDomain' | 'unsubscribeOption' | 'privacyPolicyRef';

const SCAM_PATTERNS: { id: PatternId; regex: RegExp; severity: ThreatLevel }[] = [
  { id: 'urgency', regex: /urgent|urgently|immediately|act now|limited time/gi, severity: 'high' },
  { id: 'suspiciousLink', regex: /click here|click link|click below/gi, severity: 'high' },
  { id: 'accountPhishing', regex: /verify your account|confirm your identity|validate your/gi, severity: 'critical' },
  { id: 'lotteryScam', regex: /won|winner|congratulations|you have been selected|lottery/gi, severity: 'critical' },
  { id: 'credentialTheft', regex: /bank account|credit card|social security|SSN|password/gi, severity: 'critical' },
  { id: 'paymentScam', regex: /wire transfer|western union|moneygram|bitcoin|crypto|gift card/gi, severity: 'critical' },
  { id: 'baitOffer', regex: /free gift|free money|claim your prize|reward/gi, severity: 'high' },
  { id: 'authorityImpersonation', regex: /IRS|IRS agent|tax refund|government|official notice/gi, severity: 'critical' },
  { id: 'accountThreat', regex: /suspended|blocked|locked|access denied|deactivated/gi, severity: 'high' },
  { id: 'shortenedUrl', regex: /http:\/\/|bit\.ly|tinyurl|t\.co\/[a-z]/gi, severity: 'medium' },
  { id: 'financialLure', regex: /\$\d+|\d+\s*dollars?|cash|money|payment/gi, severity: 'medium' },
  { id: 'secrecyRequest', regex: /do not share|secret|confidential|private/gi, severity: 'medium' },
  { id: 'advanceFeeFraud', regex: /nigerian|prince|inheritance|million dollars/gi, severity: 'critical' },
  { id: 'malwareDistribution', regex: /download|install|update now|software|app/gi, severity: 'high' },
  { id: 'genericSalutation', regex: /dear customer|dear user|dear account holder/gi, severity: 'low' },
];

const SAFE_PATTERNS: { id: SafeSignalId; regex: RegExp }[] = [
  { id: 'knownSenderDomain', regex: /from:\s*[\w.]+@[\w.]+\.(com|org|gov|edu)/gi },
  { id: 'unsubscribeOption', regex: /unsubscribe/gi },
  { id: 'privacyPolicyRef', regex: /privacy policy/gi },
];

interface AnalysisI18n {
  patternType: Record<PatternId, string>;
  patternDesc: Record<PatternId, string>;
  safeSignal: Record<SafeSignalId, string>;
  labels: Record<ThreatLevel, string>;
  summaries: Record<ThreatLevel, string>;
  recommendations: Record<ThreatLevel, string>;
  excessiveCaps: string;
  multipleExclamation: string;
}

const I18N: Record<Language, AnalysisI18n> = {
  en: {
    patternType: {
      urgency: 'Urgency Tactic',
      suspiciousLink: 'Suspicious Link',
      accountPhishing: 'Account Phishing',
      lotteryScam: 'Lottery Scam',
      credentialTheft: 'Credential Theft',
      paymentScam: 'Payment Scam',
      baitOffer: 'Bait Offer',
      authorityImpersonation: 'Authority Impersonation',
      accountThreat: 'Account Threat',
      shortenedUrl: 'Shortened URL',
      financialLure: 'Financial Lure',
      secrecyRequest: 'Secrecy Request',
      advanceFeeFraud: 'Advance Fee Fraud',
      malwareDistribution: 'Malware Distribution',
      genericSalutation: 'Generic Salutation',
    },
    patternDesc: {
      urgency: 'Detected urgency tactic pattern',
      suspiciousLink: 'Detected suspicious link pattern',
      accountPhishing: 'Detected account phishing pattern',
      lotteryScam: 'Detected lottery scam pattern',
      credentialTheft: 'Detected credential theft pattern',
      paymentScam: 'Detected payment scam pattern',
      baitOffer: 'Detected bait offer pattern',
      authorityImpersonation: 'Detected authority impersonation pattern',
      accountThreat: 'Detected account threat pattern',
      shortenedUrl: 'Detected shortened url pattern',
      financialLure: 'Detected financial lure pattern',
      secrecyRequest: 'Detected secrecy request pattern',
      advanceFeeFraud: 'Detected advance fee fraud pattern',
      malwareDistribution: 'Detected malware distribution pattern',
      genericSalutation: 'Detected generic salutation pattern',
    },
    safeSignal: {
      knownSenderDomain: 'Known sender domain',
      unsubscribeOption: 'Contains unsubscribe option',
      privacyPolicyRef: 'References privacy policy',
    },
    labels: {
      safe: '✅ Clean — No Threats Detected',
      low: '🟡 Low Risk — Minor Concerns',
      medium: '🟠 Suspicious — Use Caution',
      high: '🔴 High Risk — Likely Scam',
      critical: '🚨 CRITICAL — Confirmed Scam Pattern',
    },
    summaries: {
      safe: 'Our AI analysis found no significant threat indicators in this message.',
      low: 'A few minor red flags were detected. The message may be legitimate but warrants verification.',
      medium: 'Multiple suspicious patterns detected. This message shares characteristics with known scams.',
      high: 'This message strongly matches known scam templates. Multiple high-risk indicators present.',
      critical: 'CONFIRMED SCAM: This message matches critical fraud patterns used in active scam campaigns.',
    },
    recommendations: {
      safe: 'This message appears legitimate. No immediate action needed, but always remain vigilant.',
      low: 'Exercise caution. Verify the sender through official channels before taking any action.',
      medium: 'Do NOT click any links or share personal information. Verify independently.',
      high: 'HIGH RISK: Do not respond, click links, or share any information. Block the sender.',
      critical: 'SCAM CONFIRMED: Block immediately, report to authorities, and do not engage under any circumstances.',
    },
    excessiveCaps: 'Excessive capitalization detected',
    multipleExclamation: 'Multiple exclamation marks',
  },
  hi: {
    patternType: {
      urgency: 'तात्कालिकता की रणनीति',
      suspiciousLink: 'संदिग्ध लिंक',
      accountPhishing: 'खाता फ़िशिंग',
      lotteryScam: 'लॉटरी घोटाला',
      credentialTheft: 'क्रेडेंशियल चोरी',
      paymentScam: 'भुगतान घोटाला',
      baitOffer: 'प्रलोभन ऑफ़र',
      authorityImpersonation: 'प्राधिकरण प्रतिरूपण',
      accountThreat: 'खाता धमकी',
      shortenedUrl: 'छोटा किया गया URL',
      financialLure: 'वित्तीय प्रलोभन',
      secrecyRequest: 'गोपनीयता अनुरोध',
      advanceFeeFraud: 'अग्रिम शुल्क धोखाधड़ी',
      malwareDistribution: 'मैलवेयर वितरण',
      genericSalutation: 'सामान्य अभिवादन',
    },
    patternDesc: {
      urgency: 'तात्कालिकता की रणनीति पैटर्न का पता चला',
      suspiciousLink: 'संदिग्ध लिंक पैटर्न का पता चला',
      accountPhishing: 'खाता फ़िशिंग पैटर्न का पता चला',
      lotteryScam: 'लॉटरी घोटाला पैटर्न का पता चला',
      credentialTheft: 'क्रेडेंशियल चोरी पैटर्न का पता चला',
      paymentScam: 'भुगतान घोटाला पैटर्न का पता चला',
      baitOffer: 'प्रलोभन ऑफ़र पैटर्न का पता चला',
      authorityImpersonation: 'प्राधिकरण प्रतिरूपण पैटर्न का पता चला',
      accountThreat: 'खाता धमकी पैटर्न का पता चला',
      shortenedUrl: 'छोटा किया गया URL पैटर्न का पता चला',
      financialLure: 'वित्तीय प्रलोभन पैटर्न का पता चला',
      secrecyRequest: 'गोपनीयता अनुरोध पैटर्न का पता चला',
      advanceFeeFraud: 'अग्रिम शुल्क धोखाधड़ी पैटर्न का पता चला',
      malwareDistribution: 'मैलवेयर वितरण पैटर्न का पता चला',
      genericSalutation: 'सामान्य अभिवादन पैटर्न का पता चला',
    },
    safeSignal: {
      knownSenderDomain: 'ज्ञात प्रेषक डोमेन',
      unsubscribeOption: 'सदस्यता समाप्ति विकल्प शामिल है',
      privacyPolicyRef: 'गोपनीयता नीति का संदर्भ देता है',
    },
    labels: {
      safe: '✅ स्वच्छ — कोई खतरा नहीं मिला',
      low: '🟡 कम जोखिम — मामूली चिंताएँ',
      medium: '🟠 संदिग्ध — सावधानी बरतें',
      high: '🔴 उच्च जोखिम — संभावित घोटाला',
      critical: '🚨 गंभीर — पुष्ट घोटाला पैटर्न',
    },
    summaries: {
      safe: 'हमारे AI विश्लेषण में इस संदेश में कोई महत्वपूर्ण खतरा संकेतक नहीं मिला।',
      low: 'कुछ मामूली चेतावनी संकेत मिले हैं। संदेश वैध हो सकता है लेकिन सत्यापन आवश्यक है।',
      medium: 'कई संदिग्ध पैटर्न मिले हैं। यह संदेश ज्ञात घोटालों की विशेषताएं साझा करता है।',
      high: 'यह संदेश ज्ञात घोटाला टेम्पलेट्स से काफी मेल खाता है। कई उच्च-जोखिम संकेतक मौजूद हैं।',
      critical: 'पुष्ट घोटाला: यह संदेश सक्रिय घोटाला अभियानों में उपयोग किए जाने वाले गंभीर धोखाधड़ी पैटर्न से मेल खाता है।',
    },
    recommendations: {
      safe: 'यह संदेश वैध प्रतीत होता है। तत्काल कोई कार्रवाई आवश्यक नहीं है, लेकिन हमेशा सतर्क रहें।',
      low: 'सावधानी बरतें। कोई भी कार्रवाई करने से पहले आधिकारिक माध्यमों से प्रेषक की पुष्टि करें।',
      medium: 'किसी भी लिंक पर क्लिक न करें या व्यक्तिगत जानकारी साझा न करें। स्वतंत्र रूप से सत्यापित करें।',
      high: 'उच्च जोखिम: जवाब न दें, लिंक पर क्लिक न करें, या कोई जानकारी साझा न करें। प्रेषक को ब्लॉक करें।',
      critical: 'घोटाला पुष्ट: तुरंत ब्लॉक करें, अधिकारियों को रिपोर्ट करें, और किसी भी परिस्थिति में शामिल न हों।',
    },
    excessiveCaps: 'अत्यधिक बड़े अक्षरों का उपयोग पाया गया',
    multipleExclamation: 'कई विस्मयादिबोधक चिह्न',
  },
};

function getSeverityScore(severity: ThreatLevel): number {
  const scores: Record<ThreatLevel, number> = { safe: 0, low: 10, medium: 20, high: 30, critical: 45 };
  return scores[severity];
}

function getThreatLevel(score: number): ThreatLevel {
  if (score <= 10) return 'safe';
  if (score <= 30) return 'low';
  if (score <= 55) return 'medium';
  if (score <= 75) return 'high';
  return 'critical';
}

export function analyzeMessage(input: string, inputType: 'text' | 'image' | 'url' = 'text', lang: Language = 'en'): AnalysisResult {
  const copy = I18N[lang];
  const indicators: ThreatIndicator[] = [];
  const redFlags: string[] = [];
  const safeSignals: string[] = [];
  let rawScore = 0;

  for (const pattern of SCAM_PATTERNS) {
    const matches = input.match(pattern.regex);
    if (matches) {
      const uniqueMatches = [...new Set(matches.map(m => m.toLowerCase()))];
      const localizedType = copy.patternType[pattern.id];
      indicators.push({
        type: localizedType,
        description: copy.patternDesc[pattern.id],
        severity: pattern.severity,
        found: uniqueMatches,
      });
      redFlags.push(`${localizedType}: "${uniqueMatches.slice(0, 2).join('", "')}"`);
      rawScore += getSeverityScore(pattern.severity);
    }
  }

  for (const pattern of SAFE_PATTERNS) {
    if (pattern.regex.test(input)) {
      safeSignals.push(copy.safeSignal[pattern.id]);
      rawScore = Math.max(0, rawScore - 10);
    }
  }

  // Check text length and character patterns
  if (input.length < 20) rawScore += 5;
  if (/[A-Z]{3,}/.test(input)) { rawScore += 5; redFlags.push(copy.excessiveCaps); }
  if (/!{2,}/.test(input)) { rawScore += 5; redFlags.push(copy.multipleExclamation); }

  const score = Math.min(100, rawScore);
  const level = getThreatLevel(score);

  return {
    id: Math.random().toString(36).substring(7),
    timestamp: new Date().toISOString(),
    input: input.substring(0, 200),
    inputType,
    score,
    threatLevel: level,
    label: copy.labels[level],
    summary: copy.summaries[level],
    indicators,
    redFlags,
    safeSignals,
    recommendation: copy.recommendations[level],
  };
}

const MOCK_INPUTS = [
  "Congratulations! You've won $500 gift card. Click here to claim your prize now: bit.ly/fake123",
  "Hello! Your account has been suspended. Verify your bank account details immediately to restore access.",
  "Dear customer, please review your recent order confirmation. Unsubscribe from our emails below.",
  "URGENT: IRS Agent calling. You owe back taxes. Pay via gift card NOW or be arrested immediately!!!",
  "Hey, are we still meeting at 3pm tomorrow? Just checking in!",
  "Your Netflix subscription expired. Update your credit card info at http://netfix-support.com",
];

export function getMockRecentScans(lang: Language = 'en'): AnalysisResult[] {
  return MOCK_INPUTS.map(input => analyzeMessage(input, 'text', lang));
}

// Backwards-compatible English default export.
export const MOCK_RECENT_SCANS: AnalysisResult[] = getMockRecentScans('en');
