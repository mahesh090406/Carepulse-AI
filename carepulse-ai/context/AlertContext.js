import React, { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
    const [alerts, setAlerts] = useState([]);

    const addAlert = useCallback((alert) => {
        setAlerts(prev => {
           
            const exists = prev.some(a => a.patientId === alert.patientId && a.type === alert.type && a.subtype === alert.subtype);
            if (exists) return prev;
            return [{ ...alert, id: `dyn_${Date.now()}_${Math.random()}`, time: 'Just now', timeTa: 'இப்போதுதான்' }, ...prev];
        });
    }, []);

    const clearAlert = useCallback((id) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    }, []);

    const clearAll = useCallback(() => setAlerts([]), []);

    return (
        <AlertContext.Provider value={{ alerts, addAlert, clearAlert, clearAll }}>
            {children}
        </AlertContext.Provider>
    );
}

export function useAlerts() {
    const ctx = useContext(AlertContext);
    if (!ctx) throw new Error('useAlerts must be used within AlertProvider');
    return ctx;
}

/**
 * 
 * 
 *
 * @param {object} patient
 * @param {object} liveIoT   
 * @param {number} riskScore
 * @param {function} addAlert
 */
export function evaluateAlerts(patient, liveIoT, riskScore, addAlert) {
    if (!patient || !liveIoT || !addAlert) return;

    
    if (liveIoT.history?.length >= 3) {
        const lastThree = liveIoT.history.slice(-3);
        const allAbnormal = lastThree.every(h =>
            h.systolicBP > 140 || h.bloodSugar > 180 || h.heartRate > 100
        );
        if (allAbnormal) {
            addAlert({
                patientId: patient.id,
                patientName: patient.name,
                patientNameTa: patient.nameTa,
                type: 'critical',
                subtype: 'consecutive_abnormal',
                message: `3 consecutive abnormal IoT readings detected for ${patient.name}.`,
                messageTa: `${patient.nameTa} க்கு 3 தொடர்ச்சியான அசாதாரண IoT வாசிப்புகள் கண்டறியப்பட்டன.`,
            });
        }
    }

    
    if ((patient.adherence ?? 100) < 50) {
        addAlert({
            patientId: patient.id,
            patientName: patient.name,
            patientNameTa: patient.nameTa,
            type: 'non_adherent',
            subtype: 'low_adherence',
            message: `Medication adherence critically low: ${patient.adherence}%.`,
            messageTa: `மருந்து இணக்கம் ஆபத்தான அளவில் குறைவு: ${patient.adherence}%.`,
        });
    }

    
    if (liveIoT.systolicBP >= 180) {
        addAlert({
            patientId: patient.id,
            patientName: patient.name,
            patientNameTa: patient.nameTa,
            type: 'critical',
            subtype: 'bp_spike',
            message: `Severe hypertension spike: ${liveIoT.systolicBP}/${liveIoT.diastolicBP} mmHg.`,
            messageTa: `கடுமையான உயர் இரத்த அழுத்தம்: ${liveIoT.systolicBP}/${liveIoT.diastolicBP} mmHg.`,
        });
    }

    
    if (liveIoT.bloodSugar >= 280) {
        addAlert({
            patientId: patient.id,
            patientName: patient.name,
            patientNameTa: patient.nameTa,
            type: 'critical',
            subtype: 'sugar_spike',
            message: `Hyperglycemia risk: blood sugar ${liveIoT.bloodSugar} mg/dL.`,
            messageTa: `உயர் இரத்த சர்க்கரை ஆபத்து: ${liveIoT.bloodSugar} மி.கி/டி.எல்.`,
        });
    }

    
    if (riskScore >= 85) {
        addAlert({
            patientId: patient.id,
            patientName: patient.name,
            patientNameTa: patient.nameTa,
            type: 'deteriorating',
            subtype: 'high_risk_score',
            message: `Risk score critically high: ${riskScore}/100.`,
            messageTa: `அபாய மதிப்பெண் ஆபத்தான அளவில் உயர்ந்துள்ளது: ${riskScore}/100.`,
        });
    }
}
