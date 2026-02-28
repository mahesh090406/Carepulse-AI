import React, { useState, useMemo } from 'react';
import {
    View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAlerts } from '../../context/AlertContext';
import PatientCard from '../../components/PatientCard';
import { BorderRadius, Typography, Spacing } from '../../constants/theme';
import { DOCTOR, PATIENTS } from '../../constants/dummyData';
import { runAIModel } from '../../services/aiModel';

function getGreeting(t) {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting_morning');
    if (hour < 17) return t('greeting_afternoon');
    return t('greeting_evening');
}

function SummaryCard({ label, value, icon, color, theme, onPress }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={onPress ? 0.75 : 1}
            style={[styles.summaryCard, { backgroundColor: theme.surface, ...theme.cardShadow, borderBottomWidth: 2, borderBottomColor: `${color}40` }]}
        >
            <View style={[styles.summaryIcon, { backgroundColor: `${color}18` }]}>
                <Ionicons name={icon} size={18} color={color} />
            </View>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{value}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{label}</Text>
            {onPress && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Text style={{ fontSize: 10, color: color, fontWeight: '600' }}>View </Text>
                    <Ionicons name="chevron-forward" size={10} color={color} />
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function DoctorDashboard({ navigation }) {
    const { theme } = useTheme();
    const { t, language } = useLanguage();
    const [isTriageMode, setIsTriageMode] = useState(false);

    const { alerts: dynamicAlerts } = useAlerts();
    const { alerts: liveAlerts } = useAlerts();
    const totalUnread = (liveAlerts.length) + 0; // static will be counted in NotificationsScreen
    const doctorName = language === 'ta' ? DOCTOR.nameTa : DOCTOR.name;


    const activePatients = useMemo(() => {
        return PATIENTS.map(p => {
            const ai = runAIModel({
                systolicBP: p.iotLive?.systolicBP ?? parseFloat(p.bp) ?? 130,
                bloodSugar: p.iotLive?.bloodSugar ?? p.bloodSugar ?? 130,
                adherence: p.adherence ?? 70,
                hba1c: p.labs?.hba1c ?? 6.0,
                heartRate: p.iotLive?.heartRate ?? p.heartRate ?? 80,
            });
            return { ...p, calculatedScore: ai.score, calculatedLevel: ai.level };
        });
    }, []);

    const totalPatients = activePatients.length;
    const highRisk = activePatients.filter(p => p.calculatedLevel === 'high').length;
    const medRisk = activePatients.filter(p => p.calculatedLevel === 'medium').length;
    const stable = activePatients.filter(p => p.calculatedLevel === 'low').length;
    const critical = activePatients.filter(p => p.calculatedLevel === 'critical');
    const connected = activePatients.filter(p => p.iotLive).length;
    const liveAbnormal = activePatients.reduce((sum, p) => sum + (p.iotLive?.abnormalCount ?? 0), 0);

    const sortedPatients = [...activePatients].sort((a, b) => b.calculatedScore - a.calculatedScore);
    const displayedPatients = isTriageMode ? sortedPatients : sortedPatients.slice(0, 5);

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>


                <View style={styles.headerRow}>
                    <View>
                        <Text style={[styles.greeting, { color: theme.textSecondary }]}>{getGreeting(t)},</Text>
                        <Text style={[styles.docName, { color: theme.text }]} numberOfLines={1}>{doctorName}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Notifications')}
                        style={[styles.notifBtn, { backgroundColor: theme.surface }]}
                    >
                        <Ionicons name="notifications" size={22} color={theme.primary} />
                        {(dynamicAlerts.length > 0) && (
                            <View style={[styles.notifBadge]}>
                                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
                                    {dynamicAlerts.length > 9 ? '9+' : dynamicAlerts.length}
                                </Text>
                            </View>
                        )}
                        {dynamicAlerts.length === 0 && <View style={styles.notifDot} />}
                    </TouchableOpacity>
                </View>


                {critical.length > 0 && (
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Alerts')}
                        style={styles.criticalBanner}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="warning" size={20} color="#fff" />
                        <Text style={styles.criticalText}>
                            {critical.length} {t('doc_critical_banner_msg')} — {t('doc_critical_banner')}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="#fff" />
                    </TouchableOpacity>
                )}


                <View style={styles.summaryGrid}>
                    <SummaryCard
                        label={t('doc_total_patients')} value={totalPatients}
                        icon="people" color={theme.primary} theme={theme}
                        onPress={() => navigation.navigate('Patients', { filter: 'all' })}
                    />
                    <SummaryCard
                        label={t('doc_high_risk')} value={highRisk + critical.length}
                        icon="warning" color={theme.risk.high} theme={theme}
                        onPress={() => navigation.navigate('Patients', { filter: 'high' })}
                    />
                    <SummaryCard
                        label={t('doc_medium_risk')} value={medRisk}
                        icon="alert-circle" color={theme.risk.medium} theme={theme}
                        onPress={() => navigation.navigate('Patients', { filter: 'medium' })}
                    />
                    <SummaryCard
                        label={t('doc_stable')} value={stable}
                        icon="checkmark-circle" color={theme.risk.low} theme={theme}
                        onPress={() => navigation.navigate('Patients', { filter: 'low' })}
                    />
                </View>


                <View style={styles.sectionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
                            {isTriageMode ? (t('doc_triage_queue') || 'OP Triage Queue') : t('doc_priority_patients')}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isTriageMode ? theme.risk.critical + '20' : theme.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: isTriageMode ? theme.risk.critical : theme.textSecondary, marginRight: 4 }}>
                                TRIAGE
                            </Text>
                            <Switch
                                value={isTriageMode}
                                onValueChange={setIsTriageMode}
                                trackColor={{ false: theme.border, true: theme.risk.critical }}
                                thumbColor={'#fff'}
                                style={{ transform: [{ scale: 0.7 }] }}
                            />
                        </View>
                    </View>
                    {!isTriageMode && (
                        <TouchableOpacity onPress={() => navigation.navigate('Patients')}>
                            <Text style={[styles.viewAll, { color: theme.primary }]}>{t('doc_view_all')}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {displayedPatients.map((patient, index) => (
                    <View key={patient.id}>
                        {isTriageMode && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, marginLeft: 4 }}>
                                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: index < 3 ? theme.risk.critical + '20' : theme.surface, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: index < 3 ? theme.risk.critical : theme.textSecondary }}>{index + 1}</Text>
                                </View>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>
                                    Queue Position
                                </Text>
                            </View>
                        )}
                        <PatientCard
                            patient={patient}
                            onPress={() => navigation.navigate('PatientDetail', { patient })}
                        />
                    </View>
                ))}


                <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.md }]}>
                    {t('doc_iot_summary')}
                </Text>
                <View style={[styles.iotSummaryCard, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
                    <View style={styles.iotSummaryRow}>
                        <View style={[styles.iotIconBox, { backgroundColor: `${theme.risk.low}18` }]}>
                            <Ionicons name="wifi" size={18} color={theme.risk.low} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.iotNum, { color: theme.text }]}>
                                {connected} <Text style={[styles.iotUnit, { color: theme.textSecondary }]}>{t('doc_iot_connected')}</Text>
                            </Text>
                            <Text style={[styles.iotSub, { color: theme.textMuted }]}>
                                {t('doc_iot_last_sync')}: just now
                            </Text>
                        </View>
                        <View style={[styles.iotAlertBadge, { backgroundColor: liveAbnormal > 0 ? `${theme.risk.high}18` : `${theme.risk.low}18` }]}>
                            <Ionicons name={liveAbnormal > 0 ? 'warning' : 'checkmark-circle'} size={14}
                                color={liveAbnormal > 0 ? theme.risk.high : theme.risk.low} />
                            <Text style={[styles.iotAlertText, { color: liveAbnormal > 0 ? theme.risk.high : theme.risk.low }]}>
                                {liveAbnormal} {t('doc_iot_alerts_live')}
                            </Text>
                        </View>
                    </View>
                    {dynamicAlerts.length > 0 && (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Alerts')}
                            style={[styles.iotAlertBtn, { borderTopColor: theme.border }]}
                        >
                            <Ionicons name="notifications" size={14} color={theme.risk.high} />
                            <Text style={[styles.iotAlertBtnText, { color: theme.risk.high }]}>
                                {dynamicAlerts.length} new live alerts — tap to review
                            </Text>
                            <Ionicons name="chevron-forward" size={14} color={theme.risk.high} />
                        </TouchableOpacity>
                    )}
                </View>


                <Text style={[styles.sectionTitle, { color: theme.text, marginTop: Spacing.md }]}>
                    Smart Inventory Alerts
                </Text>
                <View style={[styles.iotSummaryCard, { backgroundColor: theme.surface, ...theme.cardShadow, marginBottom: Spacing.xl }]}>
                    <View style={styles.iotSummaryRow}>
                        <View style={[styles.iotIconBox, { backgroundColor: '#E74C3C18' }]}>
                            <Ionicons name="medical" size={18} color="#E74C3C" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.iotNum, { color: theme.text, fontSize: 15 }]}>Metformin 500mg</Text>
                            <Text style={[styles.iotSub, { color: theme.textSecondary }]}>45 patients prescribed</Text>
                        </View>
                        <View style={[styles.iotAlertBadge, { backgroundColor: '#E74C3C18' }]}>
                            <Text style={[styles.iotAlertText, { color: '#E74C3C' }]}>12 strips left</Text>
                        </View>
                    </View>
                    <View style={[styles.iotSummaryRow, { borderTopWidth: 1, borderTopColor: theme.border }]}>
                        <View style={[styles.iotIconBox, { backgroundColor: '#F39C1218' }]}>
                            <Ionicons name="medical" size={18} color="#F39C12" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.iotNum, { color: theme.text, fontSize: 15 }]}>Amlodipine 5mg</Text>
                            <Text style={[styles.iotSub, { color: theme.textSecondary }]}>32 patients prescribed</Text>
                        </View>
                        <View style={[styles.iotAlertBadge, { backgroundColor: '#F39C1218' }]}>
                            <Text style={[styles.iotAlertText, { color: '#F39C12' }]}>40 strips left</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: Spacing.xl, paddingBottom: Spacing.section },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.xl,
    },
    greeting: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.medium },
    docName: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold, maxWidth: 220 },
    notifBtn: {
        width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
    },
    notifDot: {
        position: 'absolute', top: 8, right: 8,
        width: 8, height: 8, borderRadius: 4, backgroundColor: '#E74C3C',
    },
    notifBadge: {
        position: 'absolute', top: 5, right: 5,
        minWidth: 16, height: 16, borderRadius: 8,
        backgroundColor: '#E74C3C', alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 3,
    },
    criticalBanner: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        backgroundColor: '#C0392B', borderRadius: BorderRadius.lg,
        padding: Spacing.lg, marginBottom: Spacing.xl,
    },
    criticalText: {
        flex: 1, color: '#fff',
        fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semiBold,
    },
    summaryGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl,
    },
    summaryCard: {
        width: '47%', borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.sm,
    },
    summaryIcon: {
        width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    },
    summaryValue: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold },
    summaryLabel: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.medium },
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md,
    },
    sectionTitle: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, marginBottom: Spacing.md },
    viewAll: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semiBold },
    // IoT Summary
    iotSummaryCard: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginBottom: Spacing.xl },
    iotSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
    iotIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    iotNum: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold },
    iotUnit: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.regular },
    iotSub: { fontSize: Typography.fontSizes.xs, marginTop: 2 },
    iotAlertBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: BorderRadius.full },
    iotAlertText: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semiBold },
    iotAlertBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderTopWidth: 1 },
    iotAlertBtnText: { flex: 1, fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.medium },
});
