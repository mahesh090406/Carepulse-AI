
import { runAIModel, buildAIExplanation } from '../services/aiModel';


function computeSlope(values) {
    const n = values.length;
    if (n < 2) return 0;
    const sumX = values.reduce((s, _, i) => s + i, 0);
    const sumY = values.reduce((s, v) => s + v, 0);
    const sumXY = values.reduce((s, v, i) => s + i * v, 0);
    const sumX2 = values.reduce((s, _, i) => s + i * i, 0);
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

/**
 * 
 *
 * @returns {{
 *   score: number,
 *   probability: number,
 *   level: string,
 *   explanation: string,
 *   explanationTa: string,
 *   topFactors: Array,
 *   contributions: Array,
 *   slope: { bp, sugar, hr },
 * }}
 */
export function useRiskEngine(patient, liveIoT, language) {
    if (!patient) {
        return {
            score: 0, probability: 0, level: 'low',
            explanation: '', explanationTa: '',
            topFactors: [], contributions: [], slope: {},
        };
    }

    const labs = patient.labs ?? {};
    const adherence = patient.adherence ?? 70;
    const history = liveIoT?.history ?? [];

    const systolicBP = liveIoT?.systolicBP ?? patient.iotLive?.systolicBP ?? 120;
    const bloodSugar = liveIoT?.bloodSugar ?? patient.iotLive?.bloodSugar ?? 120;
    const heartRate = liveIoT?.heartRate ?? patient.iotLive?.heartRate ?? 75;
    const hba1c = labs.hba1c ?? 5.5;

   
    const aiResult = runAIModel({ systolicBP, bloodSugar, adherence, hba1c, heartRate });

 
    const explanation = buildAIExplanation(aiResult.topFactors, aiResult.score, 'en');
    const explanationTa = buildAIExplanation(aiResult.topFactors, aiResult.score, 'ta');

  
    const bpSlope = history.length >= 2 ? computeSlope(history.map(h => h.systolicBP)) : 0;
    const sugarSlope = history.length >= 2 ? computeSlope(history.map(h => h.bloodSugar)) : 0;
    const hrSlope = history.length >= 2 ? computeSlope(history.map(h => h.heartRate)) : 0;

    return {
        score: aiResult.score,
        probability: aiResult.probability,
        level: aiResult.level,
        explanation,
        explanationTa,
        topFactors: aiResult.topFactors,
        contributions: aiResult.contributions,
        slope: { bp: bpSlope, sugar: sugarSlope, hr: hrSlope },
    };
}
