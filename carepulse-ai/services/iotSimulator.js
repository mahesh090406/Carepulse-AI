
import { useState, useEffect, useRef } from 'react';


const BOUNDS = {
    systolicBP: { min: 80, max: 220 },
    diastolicBP: { min: 50, max: 140 },
    heartRate: { min: 40, max: 180 },
    bloodSugar: { min: 60, max: 400 },
};

function clamp(value, key) {
    const { min, max } = BOUNDS[key];
    return Math.round(Math.min(max, Math.max(min, value)));
}


const ABNORMAL = {
    systolicBP: 140,
    diastolicBP: 90,
    heartRate: 100,
    bloodSugar: 180,
};

function isReadingAbnormal(reading) {
    return (
        reading.systolicBP > ABNORMAL.systolicBP ||
        reading.diastolicBP > ABNORMAL.diastolicBP ||
        reading.heartRate > ABNORMAL.heartRate ||
        reading.bloodSugar > ABNORMAL.bloodSugar
    );
}


export function useIoTSimulator(patient, intervalMs = 5000, active = true) {
    const iot = patient?.iotLive ?? {};
    const adherence = patient?.adherence ?? 70;

    const [vitals, setVitals] = useState({
        systolicBP: iot.systolicBP ?? 120,
        diastolicBP: iot.diastolicBP ?? 80,
        heartRate: iot.heartRate ?? 75,
        bloodSugar: iot.bloodSugar ?? 120,
        lastSync: new Date().toISOString(),
        isAbnormal: false,
        history: [],
    });

    const countRef = useRef(0);

    useEffect(() => {
        if (!active) return; // Don't poll if IoT is stopped by user

        const tick = () => {
            setVitals(prev => {
                countRef.current += 1;


                const isWorsening = adherence < 50;
                const isImproving = adherence >= 70;

                const bpDrift = isWorsening ? 0.8 : isImproving ? -0.5 : 0.2;
                const sugarDrift = isWorsening ? 1.2 : isImproving ? -0.8 : 0.3;
                const hrDrift = isWorsening ? 0.5 : isImproving ? -0.3 : 0.1;


                const noise = () => (Math.random() - 0.45);

                const rawSystolic = prev.systolicBP + bpDrift + noise() * 2;
                const rawDiastolic = prev.diastolicBP + bpDrift * 0.6 + noise();

                const bpFactor = Math.max(0, (rawSystolic - 120) / 80);
                const rawHR = prev.heartRate + hrDrift + noise() * 1.5 + bpFactor * 0.8;
                const rawSugar = prev.bloodSugar + sugarDrift + noise() * 2.5;

                const newVitals = {
                    systolicBP: clamp(rawSystolic, 'systolicBP'),
                    diastolicBP: clamp(rawDiastolic, 'diastolicBP'),
                    heartRate: clamp(rawHR, 'heartRate'),
                    bloodSugar: clamp(rawSugar, 'bloodSugar'),
                };

                const abnormal = isReadingAbnormal(newVitals);


                const newHistory = [
                    ...prev.history.slice(-2),
                    { ...newVitals, ts: Date.now() },
                ];

                return {
                    ...newVitals,
                    lastSync: new Date().toISOString(),
                    isAbnormal: abnormal,
                    history: newHistory,
                };
            });
        };

        const id = setInterval(tick, intervalMs);
        return () => clearInterval(id);
    }, [adherence, intervalMs, active]);

    return vitals;
}
