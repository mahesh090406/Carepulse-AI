
const THRESHOLDS = {
    systolicBP: { safe: 80, danger: 180 },  
    bloodSugar: { safe: 60, danger: 300 },  
    heartRate: { safe: 40, danger: 140 },  
    adherence: { safe: 100, danger: 20 },  
    hba1c: { safe: 4.0, danger: 12.0 }, 
};


const WEIGHTS = {
    systolicBP: 0.25,
    bloodSugar: 0.20,
    hba1c: 0.22,
    adherence: 0.20,
    heartRate: 0.13,
};


const FEATURE_META = {
    systolicBP: { label: 'systolic BP', labelTa: 'சிஸ்டோலிக் BP' },
    bloodSugar: { label: 'blood sugar', labelTa: 'இரத்த சர்க்கரை' },
    adherence: { label: 'medication adherence', labelTa: 'மருந்து இணக்கம்' },
    hba1c: { label: 'HbA1c level', labelTa: 'HbA1c அளவு' },
    heartRate: { label: 'heart rate', labelTa: 'இதய துடிப்பு' },
};


function normalizeFeature(key, value) {
    const { safe, warn, danger } = THRESHOLDS[key];
    if (key === 'adherence') {
        
        const clamped = Math.min(safe, Math.max(danger, value));
        return (safe - clamped) / (safe - danger);
    }
    const clamped = Math.min(danger, Math.max(safe, value));
    return (clamped - safe) / (danger - safe);
}

function levelFromScore(score) {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
}

/**
 * 
 *
 * @returns {{
 *   score: number,           // 0–100
 *   probability: number,     // 0.00–1.00
 *   level: string,           // 'low' | 'medium' | 'high' | 'critical'
 *   contributions: Array,    // sorted by absolute contribution
 *   topFactors: Array,       // top 2 contributors
 * }}
 */
export function runAIModel({ systolicBP, bloodSugar, adherence, hba1c, heartRate }) {
    const inputs = {
        systolicBP: systolicBP ?? 120,
        bloodSugar: bloodSugar ?? 120,
        adherence: adherence ?? 70,
        hba1c: hba1c ?? 5.7,
        heartRate: heartRate ?? 75,
    };

 
    let probability = 0.10;
    const rawContributions = {};
    for (const key of Object.keys(WEIGHTS)) {
        const norm = normalizeFeature(key, inputs[key]);
        const contribution = norm * WEIGHTS[key];
        rawContributions[key] = contribution;
        probability += contribution;
    }
   
    probability = Math.min(0.98, Math.max(0.05, probability));
    const score = Math.round(probability * 100);
    const level = levelFromScore(score);


    const totalAbs = Object.values(rawContributions).reduce((s, v) => s + Math.abs(v), 0) || 1;
    const contributions = Object.entries(rawContributions)
        .map(([key, value]) => ({
            key,
            label: FEATURE_META[key].label,
            labelTa: FEATURE_META[key].labelTa,
            contribution: value,
            pct: Math.round((Math.abs(value) / totalAbs) * 100),
            direction: value >= 0 ? 'increases' : 'decreases',
        }))
        .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    const topFactors = contributions.slice(0, 2);
    return { score, probability, level, contributions, topFactors };
}



export function buildAIExplanation(topFactors, score, language) {
    if (!topFactors || topFactors.length === 0) {
        return language === 'ta'
            ? 'AI மாதிரி போதுமான தரவு இல்லாமல் அபாயத்தை கணிக்க முடியவில்லை.'
            : 'AI model could not compute risk due to insufficient data.';
    }

    const [f1, f2] = topFactors;
    const levelWord = score >= 80 ? (language === 'ta' ? 'அவசர' : 'critical')
        : score >= 60 ? (language === 'ta' ? 'அதிக' : 'elevated')
            : score >= 40 ? (language === 'ta' ? 'மிதமான' : 'moderate')
                : (language === 'ta' ? 'குறைந்த' : 'low');

    if (language === 'ta') {
        const factors = f2
            ? `${f1.labelTa} மற்றும் ${f2.labelTa}`
            : f1.labelTa;
        return `AI மாதிரி ${factors} காரணமாக குறுகிய கால ${levelWord} ஆபத்தை கணிக்கிறது.`;
    }

    const factors = f2
        ? `high ${f1.label} and elevated ${f2.label}`
        : `high ${f1.label}`;
    return `AI model predicts ${levelWord} short-term risk primarily due to ${factors}.`;
}
