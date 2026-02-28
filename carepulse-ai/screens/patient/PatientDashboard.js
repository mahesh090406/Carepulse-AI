import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Network from 'expo-network';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAlerts, evaluateAlerts } from '../../context/AlertContext';
import { useIoTSimulator } from '../../services/iotSimulator';
import { useRiskEngine } from '../../hooks/useRiskEngine';
import { getAIRecommendation } from '../../services/geminiService';
import RiskScoreCard from '../../components/RiskScoreCard';
import VoiceButton from '../../components/VoiceButton';
import { BorderRadius, Typography, Spacing } from '../../constants/theme';
import { PATIENT_USER } from '../../constants/dummyData';

function formatSync(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return iso; }
}


function PulsingDot({ color }) {
    const scale = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(Animated.sequence([
            Animated.timing(scale, { toValue: 1.7, duration: 700, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1.0, duration: 700, useNativeDriver: true }),
        ])).start();
    }, []);
    return (
        <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={{
                position: 'absolute', width: 12, height: 12, borderRadius: 6,
                backgroundColor: `${color}40`, transform: [{ scale }],
            }} />
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        </View>
    );
}

function IoTMetricRow({ icon, label, value, unit, color, theme }) {
    return (
        <View style={styles.iotMetricRow}>
            <View style={[styles.iotMetricIcon, { backgroundColor: `${color}18` }]}>
                <Ionicons name={icon} size={14} color={color} />
            </View>
            <Text style={[styles.iotMetricLabel, { color: theme.textSecondary }]}>{label}</Text>
            <Text style={[styles.iotMetricValue, { color: theme.text }]}>
                <Text style={{ color }}>{value}</Text> {unit}
            </Text>
        </View>
    );
}

export default function PatientDashboard({ navigation }) {
    const { theme } = useTheme();
    const { t, language } = useLanguage();
    const { addAlert } = useAlerts();

    const name = language === 'ta' ? PATIENT_USER.nameTa : PATIENT_USER.name;
    const conditions = language === 'ta' ? PATIENT_USER.conditionsTa : PATIENT_USER.conditions;
    const medications = language === 'ta' ? PATIENT_USER.medicationsTa : PATIENT_USER.medications;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? t('greeting_morning') : hour < 17 ? t('greeting_afternoon') : t('greeting_evening');


    const [iotActive, setIotActive] = useState(false);
    const liveIoT = useIoTSimulator(PATIENT_USER, 5000, iotActive);
    const risk = useRiskEngine(PATIENT_USER, liveIoT, language);


    const [aiRec, setAiRec] = useState('');
    const [aiError, setAiError] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const lastRiskRef = useRef(null);
    const isFetchingRef = useRef(false);
    const hasMountedRef = useRef(false);

    // SOS Animation
    const sosAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(sosAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
                Animated.timing(sosAnim, { toValue: 0, duration: 800, useNativeDriver: false })
            ])
        ).start();
    }, [sosAnim]);

    const sosBgColor = sosAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(231, 76, 60, 0.05)', 'rgba(231, 76, 60, 0.25)'] // Light red to deeper red
    });
    const sosBorderColor = sosAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(231, 76, 60, 0.3)', 'rgba(231, 76, 60, 0.9)']
    });

    useEffect(() => {
        Network.getNetworkStateAsync().then(s => setIsOffline(!s.isConnected));
    }, []);

    const fetchAIRecommendation = useCallback(async () => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        setAiLoading(true);
        setAiError(false);
        try {
            const rec = await getAIRecommendation({
                name: PATIENT_USER.name,
                age: PATIENT_USER.age,
                conditions: PATIENT_USER.conditions,
                medications: PATIENT_USER.medications,
                systolicBP: liveIoT.systolicBP,
                diastolicBP: liveIoT.diastolicBP,
                bloodSugar: liveIoT.bloodSugar,
                heartRate: liveIoT.heartRate,
                adherence: PATIENT_USER.adherence,
                riskScore: risk.score,
                riskLevel: risk.level,
            }, language);
            setAiRec(rec);
        } catch (e) {
            setAiError(true);
        } finally {
            setAiLoading(false);
            isFetchingRef.current = false;
        }
    }, [liveIoT.systolicBP, liveIoT.bloodSugar, risk.score, language]);


    useEffect(() => {
        evaluateAlerts(PATIENT_USER, liveIoT, risk.score, addAlert);
    }, [liveIoT.isAbnormal, risk.score]);

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>


                <View style={styles.headerRow}>
                    <View>
                        <Text style={[styles.greeting, { color: theme.textSecondary }]}>{greeting},</Text>
                        <Text style={[styles.patName, { color: theme.text }]}>{name}</Text>
                    </View>
                    <View style={[styles.conditionBadge, { backgroundColor: `${theme.primary}15` }]}>
                        <Text style={[styles.conditionBadgeText, { color: theme.primary }]} numberOfLines={1}>
                            {conditions.slice(0, 2).join(' · ')}
                        </Text>
                    </View>
                </View>


                <View style={[styles.riskCard, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.riskLabel, { color: theme.textSecondary }]}>{t('pat_risk_label')}</Text>
                        {isOffline && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F39C1220', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 }}>
                                <Ionicons name="cloud-offline" size={14} color="#F39C12" />
                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#F39C12' }}>Calculated Offline</Text>
                            </View>
                        )}
                    </View>
                    <RiskScoreCard score={risk.score} level={risk.level} trend={PATIENT_USER.trend} />
                </View>


                {/* ── Emergency Connect (SOS) Card ─────────────────────────────────── */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('VideoCall')}
                    activeOpacity={0.85}
                >
                    <Animated.View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 14,
                        backgroundColor: sosBgColor, padding: Spacing.lg,
                        borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: sosBorderColor,
                    }}>
                        <View style={{
                            width: 48, height: 48, borderRadius: 24,
                            backgroundColor: '#E74C3C25', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Ionicons name="call" size={24} color="#E74C3C" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: Typography.fontSizes.md, fontWeight: 'bold', color: '#E74C3C' }}>
                                {language === 'ta' ? 'அவசர இணைப்பு (SOS)' : 'Emergency Connect (SOS)'}
                            </Text>
                            <Text style={{ fontSize: Typography.fontSizes.sm, color: theme.textSecondary, marginTop: 2 }}>
                                {language === 'ta' ? 'உடனடியாக டாக்டரை அழைக்கவும்' : 'Instantly call your doctor'}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E74C3C20', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E74C3C' }} />
                            <Text style={{ fontSize: 11, color: '#E74C3C', fontWeight: 'bold' }}>
                                {language === 'ta' ? 'நேரலை' : 'Live'}
                            </Text>
                        </View>
                    </Animated.View>
                </TouchableOpacity>

                <View style={[styles.iotCard, {

                    backgroundColor: theme.surface, ...theme.cardShadow,
                    borderLeftWidth: 3, borderLeftColor: theme.risk.low,
                }]}>
                    <View style={styles.iotHeader}>
                        <View style={[styles.iotIconBox, { backgroundColor: `${theme.risk.low}18` }]}>
                            <Ionicons name="wifi" size={18} color={theme.risk.low} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.iotTitle, { color: theme.text }]}>{t('pat_iot_card_title')}</Text>
                            <View style={styles.iotSyncRow}>
                                <PulsingDot color={theme.risk.low} />
                                <Text style={[styles.iotSync, { color: theme.textMuted }]}>
                                    {liveIoT.isAbnormal
                                        ? t('pat_iot_pulsing')
                                        : `${t('pat_iot_last_sync')}: ${formatSync(liveIoT.lastSync)}`}
                                </Text>
                            </View>
                        </View>
                        {liveIoT.isAbnormal && (
                            <View style={[styles.abnormalBadge, { backgroundColor: `${theme.risk.high}18` }]}>
                                <Ionicons name="warning" size={12} color={theme.risk.high} />
                            </View>
                        )}
                        <TouchableOpacity
                            onPress={() => setIotActive(v => !v)}
                            style={{
                                flexDirection: 'row', alignItems: 'center', gap: 5,
                                backgroundColor: iotActive ? `${theme.risk.high}18` : `${theme.risk.low}18`,
                                borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 6,
                            }}
                        >
                            <Ionicons name={iotActive ? 'stop-circle' : 'play-circle'} size={16} color={iotActive ? theme.risk.high : theme.risk.low} />
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: iotActive ? theme.risk.high : theme.risk.low }}>
                                {iotActive ? 'Stop' : 'Start'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.iotMetrics, { borderTopColor: theme.border }]}>
                        <IoTMetricRow icon="fitness" label={t('detail_bp')}
                            value={`${liveIoT.systolicBP}/${liveIoT.diastolicBP}`}
                            unit={t('detail_unit_mmhg')}
                            color={liveIoT.systolicBP > 140 ? theme.risk.high : theme.risk.low} theme={theme} />
                        <IoTMetricRow icon="water" label={t('detail_blood_sugar')}
                            value={liveIoT.bloodSugar} unit={t('detail_unit_mgdl')}
                            color={liveIoT.bloodSugar > 180 ? theme.risk.medium : theme.risk.low} theme={theme} />
                        <IoTMetricRow icon="heart" label={t('detail_heart_rate')}
                            value={liveIoT.heartRate} unit={t('detail_unit_bpm')}
                            color={liveIoT.heartRate > 100 ? theme.risk.high : theme.risk.low} theme={theme} />
                    </View>
                </View>


                <View style={[styles.aiCard, {
                    backgroundColor: `${theme.primary}09`,
                    borderColor: `${theme.primary}25`, borderWidth: 1,
                }]}>
                    <View style={styles.aiHeader}>
                        <View style={[styles.aiIcon, { backgroundColor: `${theme.primary}20` }]}>
                            {aiLoading
                                ? <ActivityIndicator size="small" color={theme.primary} />
                                : <Ionicons name="sparkles" size={18} color={theme.primary} />
                            }
                        </View>
                        <Text style={[styles.aiTitle, { color: theme.text }]}>{t('pat_ai_recommendation')}</Text>
                        {aiRec ? <VoiceButton text={aiRec} compact /> : null}
                        <TouchableOpacity onPress={fetchAIRecommendation} style={styles.refreshBtn} disabled={aiLoading}>
                            <Ionicons name="refresh" size={16} color={theme.textMuted}
                                style={aiLoading ? { opacity: 0.3 } : {}} />
                        </TouchableOpacity>
                    </View>

                    {aiLoading ? (
                        <View style={styles.aiLoadingRow}>
                            <View style={[styles.shimmer, { backgroundColor: theme.border }]} />
                            <View style={[styles.shimmer, { backgroundColor: theme.border, width: '70%' }]} />
                        </View>
                    ) : aiError ? (
                        <TouchableOpacity onPress={fetchAIRecommendation} style={styles.aiErrorRow}>
                            <Ionicons name="cloud-offline-outline" size={16} color={theme.textMuted} />
                            <Text style={[styles.aiErrorText, { color: theme.textMuted }]}>
                                {language === 'ta' ? 'மீண்டும் முயற்சிக்க தட்டவும்' : 'Tap to retry'}
                            </Text>
                        </TouchableOpacity>
                    ) : aiRec ? (
                        <Text style={[styles.aiText, { color: theme.textSecondary }]}>{aiRec}</Text>
                    ) : (

                        <TouchableOpacity onPress={fetchAIRecommendation} style={styles.aiPromptBtn} activeOpacity={0.8}>
                            <Ionicons name="sparkles-outline" size={16} color={theme.primary} />
                            <Text style={[styles.aiPromptText, { color: theme.primary }]}>
                                {language === 'ta'
                                    ? 'AI ஆலோசனை பெற தட்டவும் ✨'
                                    : 'Tap to get AI recommendation ✨'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>


                <View style={[styles.medCard, { backgroundColor: `${theme.accent}0D`, borderColor: `${theme.accent}30`, borderWidth: 1 }]}>
                    <View style={styles.medHeader}>
                        <Ionicons name="medical" size={18} color={theme.accent} />
                        <Text style={[styles.medTitle, { color: theme.text }]}>{t('pat_medication_reminder')}</Text>
                    </View>
                    <Text style={[styles.medSubtitle, { color: theme.textSecondary }]}>{t('pat_medication_due')}</Text>
                    <View style={styles.medList}>
                        {medications.map((med, i) => (
                            <View key={i} style={[styles.medItem, { backgroundColor: theme.surface }]}>
                                <View style={[styles.medDot, { backgroundColor: theme.accent }]} />
                                <Text style={[styles.medText, { color: theme.text }]}>{med}</Text>
                            </View>
                        ))}
                    </View>
                </View>


                <View style={[styles.trendCard, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
                    <Text style={[styles.trendTitle, { color: theme.text }]}>{t('pat_trend_summary')}</Text>
                    <View style={[styles.trendBar, { backgroundColor: theme.surfaceAlt }]}>
                        {[62, 65, 68, 67, 70, 72, risk.score].map((val, i) => {
                            const height = (val / 100) * 48;
                            const color = val >= 70 ? theme.risk.high : val >= 50 ? theme.risk.medium : theme.risk.low;
                            return (
                                <View key={i} style={styles.barColumn}>
                                    <View style={[styles.barFill, { height, backgroundColor: color }]} />
                                </View>
                            );
                        })}
                    </View>
                    <Text style={[styles.trendSub, { color: theme.textMuted }]}>{t('trends_week')}</Text>
                </View>


                <TouchableOpacity
                    onPress={() => navigation.navigate('HealthTimeline', {
                        timeline: PATIENT_USER.timeline, patientName: name,
                    })}
                    style={[styles.timelineBtn, { borderColor: theme.primary }]}
                    activeOpacity={0.85}
                >
                    <Ionicons name="time-outline" size={20} color={theme.primary} />
                    <Text style={[styles.timelineBtnText, { color: theme.primary }]}>{t('pat_view_timeline')}</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.primary} />
                </TouchableOpacity>


                <TouchableOpacity
                    onPress={() => navigation.navigate('LogHealth')}
                    style={[styles.quickLogBtn, { backgroundColor: theme.primary }]}
                    activeOpacity={0.85}
                >
                    <Ionicons name="add-circle" size={22} color="#fff" />
                    <Text style={styles.quickLogText}>{t('pat_log_health')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: Spacing.xl, paddingBottom: Spacing.section, gap: Spacing.xl },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    greeting: { fontSize: Typography.fontSizes.sm },
    patName: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold },
    conditionBadge: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, maxWidth: 140 },
    conditionBadgeText: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semiBold },
    riskCard: { borderRadius: BorderRadius.xl, padding: Spacing.xxl, alignItems: 'center', gap: Spacing.lg },
    riskLabel: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.medium },

    iotCard: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
    iotHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
    iotIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    iotTitle: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semiBold },
    iotSyncRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    iotSync: { fontSize: Typography.fontSizes.xs },
    abnormalBadge: { padding: 6, borderRadius: BorderRadius.full },
    iotMetrics: { borderTopWidth: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm },
    iotMetricRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    iotMetricIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    iotMetricLabel: { flex: 1, fontSize: Typography.fontSizes.sm },
    iotMetricValue: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semiBold },

    aiCard: { borderRadius: BorderRadius.lg, padding: Spacing.xl, gap: Spacing.md },
    aiHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    aiIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    aiTitle: { flex: 1, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semiBold },
    refreshBtn: { padding: 4 },
    aiText: { fontSize: Typography.fontSizes.sm, lineHeight: 23 },
    aiLoadingRow: { gap: Spacing.sm },
    shimmer: { height: 12, borderRadius: 6, width: '100%' },
    aiErrorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.sm },
    aiErrorText: { fontSize: Typography.fontSizes.sm },
    aiPromptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
    aiPromptText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semiBold },

    medCard: { borderRadius: BorderRadius.lg, padding: Spacing.xl, gap: Spacing.sm },
    medHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    medTitle: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semiBold },
    medSubtitle: { fontSize: Typography.fontSizes.sm },
    medList: { gap: Spacing.xs, marginTop: 4 },
    medItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md },
    medDot: { width: 8, height: 8, borderRadius: 4 },
    medText: { fontSize: Typography.fontSizes.sm },

    trendCard: { borderRadius: BorderRadius.lg, padding: Spacing.xl, gap: Spacing.md },
    trendTitle: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semiBold },
    trendBar: { flexDirection: 'row', alignItems: 'flex-end', height: 60, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm, paddingVertical: 4, gap: 4 },
    barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 48 },
    barFill: { width: '70%', borderRadius: 3, minHeight: 4 },
    trendSub: { fontSize: Typography.fontSizes.xs },

    timelineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 48, borderRadius: BorderRadius.lg, borderWidth: 1.5 },
    timelineBtnText: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semiBold },
    quickLogBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 54, borderRadius: BorderRadius.lg },
    quickLogText: { color: '#fff', fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semiBold },
});
