import React, { useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAlerts, evaluateAlerts } from '../../context/AlertContext';
import { useIoTSimulator } from '../../services/iotSimulator';
import { useRiskEngine } from '../../hooks/useRiskEngine';
import MetricCard from '../../components/MetricCard';
import VoiceButton from '../../components/VoiceButton';
import RiskScoreCard from '../../components/RiskScoreCard';
import TrendIndicator from '../../components/TrendIndicator';
import { BorderRadius, Typography, Spacing } from '../../constants/theme';


function formatSync(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return iso; }
}


function SectionTitle({ text, theme }) {
    return <Text style={[styles.sectionTitle, { color: theme.text }]}>{text}</Text>;
}

function InfoRow({ label, value, theme }) {
    return (
        <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
        </View>
    );
}

function LabBadge({ label, value, unit, threshold, theme }) {
    const isAbnormal = value > threshold;
    const color = isAbnormal ? theme.risk.high : theme.risk.low;
    return (
        <View style={[styles.labBadge, { backgroundColor: `${color}12`, borderColor: `${color}30` }]}>
            <Text style={[styles.labLabel, { color: theme.textSecondary }]}>{label}</Text>
            <Text style={[styles.labValue, { color }]}>{value} {unit}</Text>
            {isAbnormal && <Ionicons name="warning" size={10} color={color} />}
        </View>
    );
}

function ContributionBar({ label, pct, direction, theme }) {
    const color = direction === 'increases' ? theme.risk.high : theme.risk.low;
    return (
        <View style={styles.contribRow}>
            <Text style={[styles.contribLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                {label}
            </Text>
            <View style={[styles.contribTrack, { backgroundColor: theme.surfaceAlt }]}>
                <View style={[styles.contribFill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
            <Text style={[styles.contribPct, { color }]}>{pct}%</Text>
        </View>
    );
}

export default function PatientDetail({ navigation, route }) {
    const { theme } = useTheme();
    const { t, language } = useLanguage();
    const { addAlert } = useAlerts();
    const patient = route?.params?.patient ?? {};

    const name = language === 'ta' && patient.nameTa ? patient.nameTa : patient.name;
    const conditions = language === 'ta' && patient.conditionsTa
        ? patient.conditionsTa.join(', ')
        : (patient.conditions || []).join(', ');

   
    const liveIoT = useIoTSimulator(patient, 5000);
    const risk = useRiskEngine(patient, liveIoT, language);
    const aiText = language === 'ta' ? risk.explanationTa : risk.explanation;

    const prevScoreRef = useRef(risk.score);

    useEffect(() => {
        evaluateAlerts(patient, liveIoT, risk.score, addAlert);

       
        const prev = prevScoreRef.current;
        if (risk.score - prev > 15 && Array.isArray(patient.timeline)) {
            patient.timeline.unshift({
                id: `tc_${Date.now()}`,
                type: 'risk_change',
                source: 'EMR',
                timestamp: new Date().toISOString(),
                title: 'Risk Score Change',
                titleTa: 'ஆபத்து மதிப்பெண் மாற்றம்',
                detail: `Score jumped from ${prev} to ${risk.score} (+${risk.score - prev})`,
                detailTa: `மதிப்பெண் ${prev} இலிருந்து ${risk.score} ஆக உயர்ந்தது (+${risk.score - prev})`,
                riskImpact: `+${risk.score - prev}`,
                snapshot: {
                    previousScore: prev,
                    newScore: risk.score,
                    delta: risk.score - prev,
                    vitalsAtTime: {
                        bp: `${liveIoT.systolicBP}/${liveIoT.diastolicBP}`,
                        sugar: liveIoT.bloodSugar,
                        hr: liveIoT.heartRate,
                    },
                    contributingFactors: risk.topFactors?.map(f => f.label) ?? [],
                },
            });
        }
        prevScoreRef.current = risk.score;
    }, [liveIoT.isAbnormal, risk.score]);

    const actions = [t('detail_action_1'), t('detail_action_2'), t('detail_action_3')];
    const emr = patient.emr ?? {};
    const labs = patient.labs ?? {};

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
          
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={[styles.headerName, { color: theme.text }]} numberOfLines={1}>{name}</Text>
                    <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
                        {patient.age} {t('yrs')} · {conditions}
                    </Text>
                </View>
                <TrendIndicator trend={patient.trend} compact />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

               
                <View style={[styles.riskSection, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
                    <RiskScoreCard score={risk.score} level={risk.level} trend={patient.trend} />
                </View>

              
                <SectionTitle text={t('detail_iot_live')} theme={theme} />
                <View style={[styles.iotPanel, {
                    backgroundColor: theme.surface, ...theme.cardShadow,
                    borderLeftWidth: 3,
                    borderLeftColor: liveIoT.isAbnormal ? theme.risk.high : theme.risk.low,
                }]}>
                    <View style={styles.iotPanelHeader}>
                        <Ionicons name="wifi" size={16}
                            color={liveIoT.isAbnormal ? theme.risk.high : theme.risk.low} />
                        <Text style={[styles.iotDeviceTitle, { color: theme.text }]}>
                            {t('detail_iot_device_card')}
                        </Text>
                        <Text style={[styles.iotSyncText, { color: theme.textMuted }]}>
                            {formatSync(liveIoT.lastSync)}
                        </Text>
                        {liveIoT.isAbnormal && (
                            <View style={[styles.iotBadge, { backgroundColor: `${theme.risk.high}18` }]}>
                                <Text style={[styles.iotBadgeText, { color: theme.risk.high }]}>
                                    ⚠ {liveIoT.history?.length ?? 0} {t('detail_iot_abnormal_count')}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.metricsGrid}>
                        <MetricCard
                            icon="fitness" label={t('detail_bp')}
                            value={`${liveIoT.systolicBP}/${liveIoT.diastolicBP}`}
                            unit={t('detail_unit_mmhg')}
                            color={liveIoT.systolicBP > 140 ? theme.risk.high : theme.risk.low}
                        />
                        <MetricCard
                            icon="water" label={t('detail_blood_sugar')}
                            value={liveIoT.bloodSugar} unit={t('detail_unit_mgdl')}
                            color={liveIoT.bloodSugar > 180 ? theme.risk.medium : theme.risk.low}
                        />
                        <MetricCard
                            icon="heart" label={t('detail_heart_rate')}
                            value={liveIoT.heartRate} unit={t('detail_unit_bpm')}
                            color={liveIoT.heartRate > 100 ? theme.risk.high : theme.risk.low}
                        />
                        <MetricCard
                            icon="body" label={t('detail_bmi')}
                            value={patient.bmi ?? '—'} unit={t('detail_unit_kgm2')}
                            color={theme.primary}
                        />
                    </View>
                </View>

                <SectionTitle text={t('detail_emr_section')} theme={theme} />
                <View style={[styles.emrCard, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
                  
                    <Text style={[styles.emrSubtitle, { color: theme.textSecondary }]}>
                        {t('detail_diagnosis_history')}
                    </Text>
                    {(emr.diagnosisHistory ?? []).map((d, i) => (
                        <InfoRow key={i} label={d.date} value={d.diagnosis} theme={theme} />
                    ))}

                 
                    <Text style={[styles.emrSubtitle, { color: theme.textSecondary, marginTop: Spacing.md }]}>
                        {t('detail_medications')}
                    </Text>
                    {(emr.medications ?? []).map((m, i) => (
                        <InfoRow key={i} label={m.name} value={m.frequency} theme={theme} />
                    ))}

                 
                    {(emr.comorbidities ?? []).length > 0 && (
                        <>
                            <Text style={[styles.emrSubtitle, { color: theme.textSecondary, marginTop: Spacing.md }]}>
                                {t('detail_comorbidities')}
                            </Text>
                            <View style={styles.comorbRow}>
                                {emr.comorbidities.map((c, i) => (
                                    <View key={i} style={[styles.comorbTag, { backgroundColor: `${theme.primary}12` }]}>
                                        <Text style={[styles.comorbText, { color: theme.primary }]}>{c}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                </View>

                <SectionTitle text={t('detail_labs_section')} theme={theme} />
                <View style={[styles.labsCard, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
                    {labs.date && (
                        <Text style={[styles.labDate, { color: theme.textMuted }]}>
                            {t('detail_labs_date')}: {labs.date}
                        </Text>
                    )}
                    <View style={styles.labsGrid}>
                        <LabBadge label={t('detail_hba1c')} value={labs.hba1c ?? '—'}
                            unit={t('detail_lab_unit_pct')} threshold={7.0} theme={theme} />
                        <LabBadge label={t('detail_cholesterol')} value={labs.cholesterol ?? '—'}
                            unit={t('detail_lab_unit_mgdl')} threshold={200} theme={theme} />
                        <LabBadge label={t('detail_creatinine')} value={labs.creatinine ?? '—'}
                            unit={t('detail_lab_unit_mgdl_cr')} threshold={1.2} theme={theme} />
                        <View style={[styles.labBadge, { backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}30` }]}>
                            <Text style={[styles.labLabel, { color: theme.textSecondary }]}>{t('detail_ecg')}</Text>
                            <Text style={[styles.labValue, { color: theme.text, fontSize: Typography.fontSizes.xs }]}>
                                {labs.ecg ?? '—'}
                            </Text>
                        </View>
                    </View>
                </View>

                
                <View style={[styles.aiPanel, { backgroundColor: `${theme.primary}0C`, borderColor: `${theme.primary}30` }]}>
                 
                    <View style={styles.aiPanelHeader}>
                        <View style={[styles.aiIcon, { backgroundColor: `${theme.primary}20` }]}>
                            <Ionicons name="analytics" size={20} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.aiPanelTitle, { color: theme.text }]}>
                                {t('ai_insight_title')}
                            </Text>
                            <Text style={[styles.aiConfidence, { color: theme.textMuted }]}>
                                {t('ai_confidence')}: {Math.round((risk.probability ?? 0) * 100)}%
                            </Text>
                        </View>
                        <View style={[styles.aiBadgePanel, { backgroundColor: `${theme.primary}18` }]}>
                            <Text style={[styles.aiBadgePanelText, { color: theme.primary }]}>AI</Text>
                        </View>
                        <VoiceButton text={aiText || t('detail_ai_explanation')} compact />
                    </View>

               
                    <Text style={[styles.aiText, { color: theme.textSecondary }]}>
                        {aiText || t('detail_ai_explanation')}
                    </Text>

               
                    {risk.topFactors?.length > 0 && (
                        <View style={[styles.contribSection, { borderTopColor: theme.border }]}>
                            <Text style={[styles.contribTitle, { color: theme.textSecondary }]}>
                                {t('ai_primary_factor')}: {language === 'ta' ? risk.topFactors[0]?.labelTa : risk.topFactors[0]?.label}
                            </Text>
                            {risk.topFactors[1] && (
                                <Text style={[styles.contribTitle, { color: theme.textSecondary }]}>
                                    {t('ai_secondary_factor')}: {language === 'ta' ? risk.topFactors[1]?.labelTa : risk.topFactors[1]?.label}
                                </Text>
                            )}
                            {risk.topFactors.map((f, i) => (
                                <ContributionBar
                                    key={i}
                                    label={language === 'ta' ? f.labelTa : f.label}
                                    pct={f.pct}
                                    direction={f.direction}
                                    theme={theme}
                                />
                            ))}
                        </View>
                    )}
                </View>

        
                <SectionTitle text={t('detail_recommended_actions')} theme={theme} />
                <View style={[styles.actionsCard, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
                    {actions.map((action, idx) => (
                        <View key={idx} style={[styles.actionRow, idx < actions.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                            <View style={[styles.actionNum, { backgroundColor: `${theme.primary}18` }]}>
                                <Text style={[styles.actionNumText, { color: theme.primary }]}>{idx + 1}</Text>
                            </View>
                            <Text style={[styles.actionText, { color: theme.text }]}>{action}</Text>
                        </View>
                    ))}
                </View>

         
                <TouchableOpacity
                    onPress={() => navigation.navigate('HealthTimeline', {
                        timeline: patient.timeline ?? [],
                        patientName: name,
                    })}
                    style={[styles.timelineBtn, { backgroundColor: `${theme.primary}12`, borderColor: `${theme.primary}30` }]}
                    activeOpacity={0.85}
                >
                    <Ionicons name="time-outline" size={20} color={theme.primary} />
                    <Text style={[styles.timelineBtnText, { color: theme.primary }]}>{t('detail_view_timeline')}</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.primary} />
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderBottomWidth: 1 },
    backBtn: { padding: 4 },
    headerInfo: { flex: 1 },
    headerName: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semiBold },
    headerSub: { fontSize: Typography.fontSizes.xs },
    scroll: { padding: Spacing.xl, paddingBottom: Spacing.section, gap: Spacing.lg },
    riskSection: { alignItems: 'center', padding: Spacing.xxl, borderRadius: BorderRadius.xl },
    sectionTitle: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, marginTop: Spacing.xs },
   
    iotPanel: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
    iotPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.lg },
    iotDeviceTitle: { flex: 1, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semiBold },
    iotSyncText: { fontSize: Typography.fontSizes.xs },
    iotBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
    iotBadgeText: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semiBold },
    metricsGrid: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.lg, paddingTop: 0 },
    
    emrCard: { borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: 2 },
    emrSubtitle: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semiBold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
    infoLabel: { fontSize: Typography.fontSizes.xs, flex: 1 },
    infoValue: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.medium, flex: 1.5, textAlign: 'right' },
    comorbRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: 4 },
    comorbTag: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
    comorbText: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.medium },

    labsCard: { borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md },
    labDate: { fontSize: Typography.fontSizes.xs, fontStyle: 'italic' },
    labsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    labBadge: { borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.md, gap: 2, minWidth: '44%', flex: 1 },
    labLabel: { fontSize: Typography.fontSizes.xs },
    labValue: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.bold },
    
    aiPanel: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.xl, gap: Spacing.md },
    aiPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    aiIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    aiPanelTitle: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semiBold },
    aiConfidence: { fontSize: Typography.fontSizes.xs, marginTop: 1 },
    aiBadgePanel: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: BorderRadius.sm },
    aiBadgePanelText: { fontSize: 10, fontWeight: Typography.fontWeights.bold, letterSpacing: 0.5 },
    aiText: { fontSize: Typography.fontSizes.sm, lineHeight: 22 },

    contribSection: { borderTopWidth: 1, paddingTop: Spacing.md, gap: Spacing.sm },
    contribTitle: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semiBold, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
    contribRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    contribLabel: { width: 100, fontSize: Typography.fontSizes.xs },
    contribTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
    contribFill: { height: 6, borderRadius: 3 },
    contribPct: { width: 32, fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.bold, textAlign: 'right' },

    actionsCard: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
    actionNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    actionNumText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold },
    actionText: { flex: 1, fontSize: Typography.fontSizes.sm, lineHeight: 20 },
    
    timelineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 48, borderRadius: BorderRadius.lg, borderWidth: 1 },
    timelineBtnText: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semiBold },
});
