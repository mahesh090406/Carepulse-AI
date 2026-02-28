import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import TrendIndicator from '../../components/TrendIndicator';
import { BorderRadius, Typography, Spacing } from '../../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Data ──────────────────────────────────────────────────────────────────────
const DATA = {
    weekly: {
        labels: { en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], ta: ['திங்', 'செவ்', 'புத', 'வியா', 'வெள்', 'சனி', 'ஞாயி'] },
        bp: [122, 128, 135, 130, 142, 138, 148],
        sugar: [118, 130, 145, 138, 160, 155, 172],
        hr: [72, 76, 80, 78, 88, 84, 92],
        risk: [48, 52, 58, 55, 66, 62, 70],
    },
    monthly: {
        labels: { en: ['W1', 'W2', 'W3', 'W4'], ta: ['வா1', 'வா2', 'வா3', 'வா4'] },
        bp: [125, 131, 139, 148],
        sugar: [122, 138, 152, 170],
        hr: [74, 79, 84, 91],
        risk: [50, 56, 63, 70],
    },
    yearly: {
        labels: {
            en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            ta: ['ஜன', 'பிப', 'மார்', 'ஏப்', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக', 'செப்', 'அக்', 'நவ', 'டிச']
        },
        bp: [118, 120, 123, 126, 130, 133, 136, 138, 141, 144, 146, 148],
        sugar: [111, 116, 121, 126, 132, 138, 144, 148, 155, 160, 165, 170],
        hr: [71, 72, 73, 75, 76, 78, 80, 82, 84, 87, 89, 91],
        risk: [42, 44, 47, 50, 53, 56, 59, 61, 64, 66, 68, 70],
    },
};

const PERIODS = [
    { key: 'weekly', en: 'Weekly', ta: 'வாராந்திர' },
    { key: 'monthly', en: 'Monthly', ta: 'மாதாந்திர' },
    { key: 'yearly', en: 'Yearly', ta: 'வருடாந்திர' },
];

const METRICS = [
    { key: 'bp', iconName: 'fitness', colorKey: 'high', en: 'Blood Pressure', ta: 'ரத்த அழுத்தம்', unit: 'mmHg' },
    { key: 'sugar', iconName: 'water', colorKey: 'medium', en: 'Blood Sugar', ta: 'ரத்த சர்க்கரை', unit: 'mg/dL' },
    { key: 'hr', iconName: 'heart', colorKey: 'high', en: 'Heart Rate', ta: 'இதய துடிப்பு', unit: 'bpm' },
    { key: 'risk', iconName: 'analytics', colorKey: 'primary', en: 'Risk Score', ta: 'ஆபத்து மதிப்பு', unit: '/100' },
];

// ── Animated Bar Chart ─────────────────────────────────────────────────────────
function AnimatedBarChart({ values, labels, color, theme }) {
    const max = Math.max(...values, 1);
    // Create one Animated.Value per bar — stable because the component
    // fully remounts (key changes) whenever period or metric changes
    const anims = useRef(values.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        // Reset all to 0 first, then animate up
        anims.forEach(a => a.setValue(0));
        const animations = anims.map((a, i) =>
            Animated.timing(a, {
                toValue: 1,
                duration: 480,
                delay: i * 55,
                useNativeDriver: false,
            })
        );
        Animated.stagger(40, animations).start();
    }, []);

    const barW = Math.max(10, Math.floor((SCREEN_W - Spacing.xl * 4) / values.length) - 6);

    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: 3, marginTop: 10 }}>
            {values.map((val, i) => {
                const targetH = Math.max(6, (val / max) * 66);
                const animH = anims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [4, targetH],
                });
                const animOp = anims[i].interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0.2, 0.7, 1],
                });
                return (
                    <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 80 }}>
                        <Animated.View style={{
                            width: barW,
                            height: animH,
                            backgroundColor: color,
                            borderRadius: 5,
                            opacity: animOp,
                        }} />
                        <Text style={{ fontSize: 8, color: theme.textMuted, marginTop: 3 }} numberOfLines={1}>
                            {labels[i]}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

// ── Summary Stats Row ─────────────────────────────────────────────────────────
function StatPill({ label, value, color }) {
    return (
        <View style={[styles.statPill, { backgroundColor: `${color}15` }]}>
            <Text style={{ fontSize: 10, color, fontWeight: 'bold' }}>{value}</Text>
            <Text style={{ fontSize: 9, color, opacity: 0.7 }}>{label}</Text>
        </View>
    );
}

// ── Metric Card with Animation ────────────────────────────────────────────────
function MetricCard({ metric, period, language, theme }) {
    const values = DATA[period][metric.key];
    const labels = DATA[period].labels[language] ?? DATA[period].labels.en;
    const color = metric.colorKey === 'primary' ? theme.primary : theme.risk[metric.colorKey];
    const latest = values[values.length - 1];
    const prev = values[values.length - 2];
    const trend = latest > prev ? 'worsening' : latest < prev ? 'improving' : 'stable';
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const title = language === 'ta' ? metric.ta : metric.en;

    return (
        <View style={[styles.metricCard, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <View style={[styles.metricIcon, { backgroundColor: `${color}18` }]}>
                    <Ionicons name={metric.iconName} size={16} color={color} />
                </View>
                <Text style={[styles.metricTitle, { color: theme.text, flex: 1 }]}>{title}</Text>
                <TrendIndicator trend={trend} compact />
            </View>

            {/* Latest value */}
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                <Text style={{ fontSize: 34, fontWeight: 'bold', color }}>{latest}</Text>
                <Text style={{ fontSize: 13, color: theme.textMuted }}>{metric.unit}</Text>
            </View>

            {/* Bar Chart */}
            <AnimatedBarChart values={values} labels={labels} color={color} theme={theme} />

            {/* Summary stats pills */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <StatPill label={language === 'ta' ? 'சராசரி' : 'Avg'} value={avg} color={color} />
                <StatPill label={language === 'ta' ? 'குறைந்தது' : 'Min'} value={min} color={theme.risk.low} />
                <StatPill label={language === 'ta' ? 'அதிகமது' : 'Max'} value={max} color={theme.risk.high} />
            </View>
        </View>
    );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function HealthTrends() {
    const { theme } = useTheme();
    const { language } = useLanguage();
    const [period, setPeriod] = useState('weekly');

    const tabAnim = useRef(new Animated.Value(0)).current;
    const tabIdx = PERIODS.findIndex(p => p.key === period);

    const handlePeriod = (key) => {
        const idx = PERIODS.findIndex(p => p.key === key);
        setPeriod(key);
        Animated.spring(tabAnim, { toValue: idx, useNativeDriver: true, tension: 80, friction: 10 }).start();
    };

    const TAB_W = (SCREEN_W - Spacing.xl * 2 - 8) / PERIODS.length;
    const tabTranslate = tabAnim.interpolate({
        inputRange: [0, 1, 2],
        outputRange: [0, TAB_W, TAB_W * 2],
    });

    const titleText = language === 'ta' ? 'ஆரோக்கிய போக்குகள்' : 'Health Trends';
    const subtitleText = language === 'ta' ? 'உங்கள் உடல்நல அளவீடுகள் பகுப்பாய்வு' : 'Analysis of your health metrics over time';

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <Text style={[styles.title, { color: theme.text }]}>{titleText}</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitleText}</Text>

                {/* Period Selector */}
                <View style={[styles.tabContainer, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                    <Animated.View style={[styles.tabIndicator, {
                        width: TAB_W,
                        backgroundColor: theme.primary,
                        transform: [{ translateX: tabTranslate }],
                    }]} />
                    {PERIODS.map((p) => {
                        const active = period === p.key;
                        return (
                            <TouchableOpacity key={p.key} style={[styles.tab, { width: TAB_W }]} onPress={() => handlePeriod(p.key)} activeOpacity={0.8}>
                                <Text style={{ fontSize: 13, fontWeight: active ? 'bold' : '500', color: active ? '#fff' : theme.textSecondary }}>
                                    {language === 'ta' ? p.ta : p.en}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Metric Cards */}
                {METRICS.map((m) => (
                    <MetricCard key={`${m.key}-${period}`} metric={m} period={period} language={language} theme={theme} />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: Spacing.xl, paddingBottom: Spacing.section, gap: Spacing.lg },
    title: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold },
    subtitle: { fontSize: Typography.fontSizes.sm, marginTop: -Spacing.xs, lineHeight: 20 },
    tabContainer: {
        flexDirection: 'row', borderRadius: BorderRadius.lg,
        borderWidth: 1, padding: 4, position: 'relative', overflow: 'hidden',
    },
    tabIndicator: {
        position: 'absolute', top: 4, bottom: 4, left: 4,
        borderRadius: BorderRadius.md, zIndex: 0,
    },
    tab: {
        paddingVertical: 10, alignItems: 'center', justifyContent: 'center', zIndex: 1,
    },
    metricCard: {
        borderRadius: BorderRadius.xl, padding: Spacing.xl, gap: Spacing.xs,
    },
    metricIcon: {
        width: 32, height: 32, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
    },
    metricTitle: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semiBold },
    statPill: {
        flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: BorderRadius.md,
    },
});
