import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAlerts } from '../../context/AlertContext';
import AlertCard from '../../components/AlertCard';
import { BorderRadius, Typography, Spacing } from '../../constants/theme';
import { ALERTS, PATIENTS } from '../../constants/dummyData';


function Section({ title, items, type, language, theme, emptyKey, t, navigation }) {
    const filtered = items.filter(a => a.type === type);
    const dotColor = type === 'critical' ? theme.risk.critical
        : type === 'deteriorating' ? theme.risk.medium
            : type === 'non_adherent' ? theme.primary
                : theme.risk.high;
    const handlePress = (alert) => {
        const patient = PATIENTS.find(p => p.id === alert.patientId);
        if (patient && navigation) navigation.navigate('PatientDetail', { patient });
    };
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: dotColor }]} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
                <View style={[styles.badge, { backgroundColor: theme.badge }]}>
                    <Text style={[styles.badgeText, { color: theme.textSecondary }]}>{filtered.length}</Text>
                </View>
            </View>
            {filtered.length === 0
                ? <Text style={[styles.emptyText, { color: theme.textMuted }]}>{t(emptyKey)}</Text>
                : filtered.map(a => (
                    <TouchableOpacity key={a.id} onPress={() => handlePress(a)} activeOpacity={0.8}>
                        <AlertCard alert={a} language={language} />
                    </TouchableOpacity>
                ))
            }
        </View>
    );
}

export default function AlertsScreen({ navigation }) {
    const { theme } = useTheme();
    const { t, language } = useLanguage();
    const { alerts: dynamicAlerts, clearAll } = useAlerts();


    const allAlerts = [...dynamicAlerts, ...ALERTS];
    const totalDynamic = dynamicAlerts.length;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>


                <View style={styles.titleRow}>
                    <Text style={[styles.title, { color: theme.text }]}>{t('alerts_title')}</Text>
                    <View style={styles.titleRight}>
                        {totalDynamic > 0 && (
                            <View style={[styles.liveBadge, { backgroundColor: `${theme.risk.high}18` }]}>
                                <View style={[styles.liveDot, { backgroundColor: theme.risk.high }]} />
                                <Text style={[styles.liveText, { color: theme.risk.high }]}>
                                    +{totalDynamic} {t('alerts_dynamic')}
                                </Text>
                            </View>
                        )}
                        {totalDynamic > 0 && (
                            <TouchableOpacity onPress={clearAll} style={[styles.clearBtn, { borderColor: theme.border }]}>
                                <Ionicons name="trash-outline" size={14} color={theme.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>


                <View style={[styles.totalBanner, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
                    <Ionicons name="notifications" size={18} color={theme.primary} />
                    <Text style={[styles.totalText, { color: theme.text }]}>
                        {t('alerts_total')}: <Text style={{ color: theme.primary, fontWeight: '700' }}>{allAlerts.length}</Text>
                    </Text>
                </View>

                <Section title={t('alerts_critical')} items={allAlerts} type="critical" emptyKey="alerts_no_critical" language={language} theme={theme} t={t} navigation={navigation} />
                <Section title={t('alerts_deteriorating')} items={allAlerts} type="deteriorating" emptyKey="alerts_no_deteriorating" language={language} theme={theme} t={t} navigation={navigation} />
                <Section title={t('alerts_non_adherent')} items={allAlerts} type="non_adherent" emptyKey="alerts_no_non_adherent" language={language} theme={theme} t={t} navigation={navigation} />
                <Section title={t('alerts_iot_spike')} items={allAlerts} type="iot_spike" emptyKey="alerts_no_iot" language={language} theme={theme} t={t} navigation={navigation} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: Spacing.xl, paddingBottom: Spacing.section },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
    title: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold, flex: 1 },
    titleRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full },
    liveDot: { width: 6, height: 6, borderRadius: 3 },
    liveText: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.semiBold },
    clearBtn: { padding: 6, borderRadius: BorderRadius.full, borderWidth: 1 },
    totalBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.lg, borderRadius: BorderRadius.lg, marginBottom: Spacing.xl },
    totalText: { fontSize: Typography.fontSizes.md },
    section: { marginBottom: Spacing.xxl },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
    sectionDot: { width: 10, height: 10, borderRadius: 5 },
    sectionTitle: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semiBold, flex: 1 },
    badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
    badgeText: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.bold },
    emptyText: { fontSize: Typography.fontSizes.sm },
});
