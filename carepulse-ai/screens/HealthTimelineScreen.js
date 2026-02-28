import React, { useMemo, useRef, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { BorderRadius, Typography, Spacing } from '../constants/theme';
import { PATIENT_USER } from '../constants/dummyData';


const EVENT_CONFIG = {
    iot_alert: { icon: 'wifi', color: '#E74C3C', sourceBg: '#E74C3C22' },
    missed_med: { icon: 'medical', color: '#F39C12', sourceBg: '#F39C1222' },
    lab_entry: { icon: 'flask', color: '#2980B9', sourceBg: '#2980B922' },
    risk_change: { icon: 'trending-up', color: '#E67E22', sourceBg: '#E67E2222' },
    alert_triggered: { icon: 'warning', color: '#C0392B', sourceBg: '#C0392B22' },
};

const SOURCE_LABELS = { IoT: 'IoT', Lab: 'Lab', EMR: 'EMR', Manual: 'Manual' };
const SOURCE_LABELS_TA = { IoT: 'சாதனத் தரவு', Lab: 'ஆய்வக அறிக்கை', EMR: 'மருத்துவ பதிவுகள்', Manual: 'கைமுறை பதிவு' };

function formatTimestamp(ts, language) {
    const d = new Date(ts);
    if (isNaN(d)) return ts;
    const dateStr = d.toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString(language === 'ta' ? 'ta-IN' : 'en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
    return `${dateStr}  ${timeStr}`;
}

function RiskSnapshotCard({ snapshot, theme, t }) {
    if (!snapshot) return null;
    const { previousScore, newScore, delta, vitalsAtTime } = snapshot;
    const isUp = delta > 0;
    const deltaColor = isUp ? theme.risk.high : theme.risk.low;
    return (
        <View style={[styles.snapshot, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <View style={styles.snapshotRow}>
                <Text style={[styles.snapshotLabel, { color: theme.textSecondary }]}>
                    {t('timeline_prev_score')}
                </Text>
                <Text style={[styles.snapshotVal, { color: theme.text }]}>{previousScore}</Text>
                <Ionicons name={isUp ? 'arrow-up' : 'arrow-down'} size={14} color={deltaColor} />
                <Text style={[styles.snapshotVal, { color: deltaColor }]}>{newScore}</Text>
                <Text style={[styles.snapshotDelta, { color: deltaColor }]}>
                    ({isUp ? '+' : ''}{delta})
                </Text>
            </View>
            {vitalsAtTime && (
                <Text style={[styles.snapshotVitals, { color: theme.textMuted }]}>
                    BP {vitalsAtTime.bp} · {vitalsAtTime.sugar} mg/dL · {vitalsAtTime.hr} bpm
                </Text>
            )}
        </View>
    );
}

function TimelineItem({ item, isLast, theme, language, t }) {
    const cfg = EVENT_CONFIG[item.type] ?? EVENT_CONFIG.iot_alert;
    const title = language === 'ta' ? (item.titleTa ?? item.title) : item.title;
    const detail = language === 'ta' ? (item.detailTa ?? item.detail) : item.detail;
    const sourceLabel = language === 'ta'
        ? SOURCE_LABELS_TA[item.source] ?? item.source
        : SOURCE_LABELS[item.source] ?? item.source;

    const impactNum = parseInt(item.riskImpact, 10);
    const impactColor = impactNum > 0 ? theme.risk.high : theme.risk.low;
    const impactText = impactNum > 0 ? `+${impactNum}` : `${impactNum}`;

    return (
        <View style={styles.itemRow}>

            <View style={styles.connectorCol}>
                <View style={[styles.dot, { backgroundColor: cfg.color, borderColor: `${cfg.color}44` }]}>
                    <Ionicons name={cfg.icon} size={11} color="#fff" />
                </View>
                {!isLast && <View style={[styles.line, { backgroundColor: theme.border }]} />}
            </View>


            <View style={[styles.card, { backgroundColor: theme.surface, ...theme.cardShadow }]}>

                <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                        {title}
                    </Text>
                    <View style={[styles.impactBadge, { backgroundColor: `${impactColor}18` }]}>
                        <Text style={[styles.impactText, { color: impactColor }]}>{impactText}</Text>
                    </View>
                </View>


                <View style={styles.cardMeta}>
                    <View style={[styles.sourceBadge, { backgroundColor: cfg.sourceBg }]}>
                        <Text style={[styles.sourceText, { color: cfg.color }]}>{sourceLabel}</Text>
                    </View>
                    <Text style={[styles.timeText, { color: theme.textMuted }]}>
                        {formatTimestamp(item.timestamp, language)}
                    </Text>
                </View>


                <Text style={[styles.detail, { color: theme.textSecondary }]}>{detail}</Text>


                {item.snapshot && (
                    <RiskSnapshotCard snapshot={item.snapshot} theme={theme} t={t} />
                )}
            </View>
        </View>
    );
}

function AnimatedTimelineItem({ item, isLast, theme, language, t, index }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(28)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1, duration: 420,
                delay: index * 80, useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0, tension: 70, friction: 9,
                delay: index * 80, useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <TimelineItem item={item} isLast={isLast} theme={theme} language={language} t={t} />
        </Animated.View>
    );
}

export default function HealthTimelineScreen({ navigation, route }) {
    const { theme } = useTheme();
    const { t, language } = useLanguage();

    // If accessed from tab bar (no params), fall back to PATIENT_USER.timeline
    const rawTimeline = route?.params?.timeline ?? PATIENT_USER.timeline ?? [];


    const timeline = useMemo(() =>
        [...rawTimeline].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
        [rawTimeline],
    );

    const patientName = route?.params?.patientName ?? '';

    // Summary stats
    const highRiskCount = timeline.filter(e => e.type === 'iot_alert' || e.type === 'alert_triggered').length;
    const missedMedCount = timeline.filter(e => e.type === 'missed_med').length;
    const summaryCards = [
        { icon: 'time-outline', value: timeline.length, label: language === 'ta' ? 'மொத்த நிகழ்வுகள்' : 'Total Events', color: theme.primary },
        { icon: 'warning-outline', value: highRiskCount, label: language === 'ta' ? 'அதிக ஆபத்து' : 'High Risk', color: theme.risk.high },
        { icon: 'medical-outline', value: missedMedCount, label: language === 'ta' ? 'தவறிய மருந்துகள்' : 'Missed Meds', color: '#F39C12' },
    ];

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>

            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                {navigation.canGoBack() && (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={theme.text} />
                    </TouchableOpacity>
                )}
                <View style={{ flex: 1 }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        {t('timeline_title')}
                    </Text>
                    {patientName ? (
                        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
                            {patientName}
                        </Text>
                    ) : null}
                </View>
                <View style={[styles.countBadge, { backgroundColor: `${theme.primary}18` }]}>
                    <Text style={[styles.countText, { color: theme.primary }]}>{timeline.length}</Text>
                </View>
            </View>

            {/* Summary Stats */}
            {timeline.length > 0 && (
                <View style={styles.summaryRow}>
                    {summaryCards.map((s, i) => (
                        <View key={i} style={[styles.summaryCard, { backgroundColor: `${s.color}14`, borderColor: `${s.color}30` }]}>
                            <Ionicons name={s.icon} size={18} color={s.color} />
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: s.color }}>{s.value}</Text>
                            <Text style={{ fontSize: 10, color: s.color, opacity: 0.8, textAlign: 'center' }}>{s.label}</Text>
                        </View>
                    ))}
                </View>
            )}

            {timeline.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="time-outline" size={52} color={theme.textMuted} />
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('timeline_empty_title')}</Text>
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('timeline_empty_text')}</Text>
                </View>
            ) : (
                <FlatList
                    data={timeline}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }) => (
                        <AnimatedTimelineItem
                            item={item}
                            isLast={index === timeline.length - 1}
                            theme={theme}
                            language={language}
                            t={t}
                            index={index}
                        />
                    )}
                    ListHeaderComponent={
                        <Text style={[styles.listLabel, { color: theme.textMuted }]}>
                            {t('timeline_newest_first')}
                        </Text>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold },
    headerSub: { fontSize: Typography.fontSizes.xs, marginTop: 1 },
    countBadge: {
        paddingHorizontal: Spacing.sm, paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    countText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold },
    list: { padding: Spacing.xl, paddingBottom: Spacing.section },
    listLabel: { fontSize: Typography.fontSizes.xs, marginBottom: Spacing.lg, fontStyle: 'italic' },
    emptyState: {
        flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg,
        padding: Spacing.section,
    },
    emptyTitle: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semiBold },
    emptyText: { fontSize: Typography.fontSizes.sm, textAlign: 'center', lineHeight: 22 },

    itemRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
    connectorCol: { alignItems: 'center', width: 28 },
    dot: {
        width: 28, height: 28, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, zIndex: 1,
    },
    line: { width: 2, flex: 1, marginTop: 4 },

    card: {
        flex: 1, borderRadius: BorderRadius.lg,
        padding: Spacing.lg, gap: Spacing.sm,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    cardTitle: { flex: 1, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semiBold },
    impactBadge: {
        paddingHorizontal: Spacing.sm, paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    impactText: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.bold },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    sourceBadge: {
        paddingHorizontal: Spacing.sm, paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    sourceText: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semiBold },
    timeText: { fontSize: Typography.fontSizes.xs },
    detail: { fontSize: Typography.fontSizes.sm, lineHeight: 20 },

    snapshot: {
        borderRadius: BorderRadius.md, borderWidth: 1,
        padding: Spacing.md, marginTop: Spacing.xs, gap: 4,
    },
    snapshotRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    snapshotLabel: { fontSize: Typography.fontSizes.xs, flex: 1 },
    snapshotVal: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold },
    snapshotDelta: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semiBold },
    snapshotVitals: { fontSize: Typography.fontSizes.xs },
    summaryRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    summaryCard: {
        flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4,
        paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1,
    },
});
