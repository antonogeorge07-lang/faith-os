const HIGH_RISK_DOMAINS = [
  {
    category: 'Annex III(1): Biometrics & Emotion Recognition',
    patterns: [/facial recognition/i, /emotion recognition/i, /gait analysis/i, /biometric categorization/i],
    friaRequired: true,
    riskLevel: 'HIGH_RISK'
  },
  {
    category: 'Annex III(2): Critical Infrastructure',
    patterns: [/grid management/i, /water supply control/i, /traffic signaling/i, /pipeline pressure/i],
    friaRequired: true,
    riskLevel: 'HIGH_RISK'
  },
  {
    category: 'Annex III(3): Education & Vocational Training',
    patterns: [/exam scoring/i, /admission scoring/i, /student evaluation/i, /cheating detection/i],
    friaRequired: true,
    riskLevel: 'HIGH_RISK'
  },
  {
    category: 'Annex III(4): Employment, HR & Worker Management',
    patterns: [/cv screening/i, /resume rank/i, /candidate evaluation/i, /termination prediction/i, /worker monitoring/i],
    friaRequired: true,
    riskLevel: 'HIGH_RISK'
  },
  {
    category: 'Annex III(5): Essential Services & Credit Scoring',
    patterns: [/credit score/i, /loan eligibility/i, /creditworthiness/i, /social benefit entitlement/i, /insurance risk triage/i],
    friaRequired: true,
    riskLevel: 'HIGH_RISK'
  },
  {
    category: 'Annex III(6): Law Enforcement & Crime Prediction',
    patterns: [/recidivism prediction/i, /polygraph/i, /crime profiling/i, /evidence evaluation/i],
    friaRequired: true,
    riskLevel: 'HIGH_RISK'
  }
];

function screenAnnex3Risk(text) {
  for (const domain of HIGH_RISK_DOMAINS) {
    for (const pattern of domain.patterns) {
      if (pattern.test(text)) {
        return {
          isHighRisk: true,
          matchedCategory: domain.category,
          riskLevel: domain.riskLevel,
          friaRequired: domain.friaRequired,
          complianceAction: 'MANDATORY_FRIA_AND_CONFORMITY_ASSESSMENT'
        };
      }
    }
  }

  return {
    isHighRisk: false,
    matchedCategory: 'Standard / Non-High-Risk (Title IV Transparency Scope Only)',
    riskLevel: 'LOW_TO_MEDIUM_RISK',
    friaRequired: false,
    complianceAction: 'ARTICLE_50_TRANSPARENCY_DUTY'
  };
}

module.exports = { screenAnnex3Risk };
