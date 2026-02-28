import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import PatientCard from '../../components/PatientCard';
import { BorderRadius, Typography, Spacing } from '../../constants/theme';
import { PATIENTS } from '../../constants/dummyData';

export default function PatientList({ navigation, route }) {
    const { theme } = useTheme();
    const { t, language } = useLanguage();
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState(route?.params?.filter || 'all');

    // Re-apply filter when navigated with a new param
    React.useEffect(() => {
        if (route?.params?.filter) setActiveFilter(route.params.filter);
    }, [route?.params?.filter]);

    const FILTER_CONFIG = {
        all: { label: 'All Patients', color: theme.primary, ta: 'அனைத்தும்' },
        high: { label: 'High Risk', color: theme.risk.high, ta: 'அதிக ஆபத்து' },
        medium: { label: 'Medium Risk', color: theme.risk.medium, ta: 'நடுத்தர ஆபத்து' },
        low: { label: 'Stable', color: theme.risk.low, ta: 'நிலையானவர்' },
    }

    const runAIModel = require('../../services/aiModel').runAIModel;

    const filtered = PATIENTS.filter(p => {
        const name = language === 'ta' && p.nameTa ? p.nameTa : p.name;
        const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
        if (activeFilter === 'all') return true;
        const ai = runAIModel({
            systolicBP: p.iotLive?.systolicBP ?? parseFloat(p.bp) ?? 130,
            bloodSugar: p.iotLive?.bloodSugar ?? p.bloodSugar ?? 130,
            adherence: p.adherence ?? 70,
            hba1c: p.labs?.hba1c ?? 6.0,
            heartRate: p.iotLive?.heartRate ?? p.heartRate ?? 80,
        });
        return ai.level === activeFilter;
    });

    const isTa = language === 'ta';
    const fc = FILTER_CONFIG[activeFilter];

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
            <View style={styles.container}>

                <View style={styles.headerRow}>
                    <Text style={[styles.title, { color: theme.text }]}>{t('patients_title')}</Text>
                    <View style={[styles.countBadge, { backgroundColor: `${fc.color}18` }]}>
                        <Text style={[styles.countText, { color: fc.color }]}>{filtered.length}</Text>
                    </View>
                </View>

                {/* Filter Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {Object.entries(FILTER_CONFIG).map(([key, cfg]) => (
                            <TouchableOpacity key={key} onPress={() => setActiveFilter(key)}
                                style={[styles.filterChip, {
                                    backgroundColor: activeFilter === key ? cfg.color : `${cfg.color}12`,
                                }]}>
                                <Text style={{
                                    fontSize: 12, fontWeight: '700',
                                    color: activeFilter === key ? '#fff' : cfg.color,
                                }}>{isTa ? cfg.ta : cfg.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>


                <View style={[styles.searchWrap, { backgroundColor: theme.surface, borderColor: theme.inputBorder }]}>
                    <Ionicons name="search" size={18} color={theme.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        value={search}
                        onChangeText={setSearch}
                        placeholder={t('patients_search')}
                        placeholderTextColor={theme.textMuted}
                    />
                    {search.length > 0 && (
                        <Ionicons name="close-circle" size={18} color={theme.textMuted} onPress={() => setSearch('')} />
                    )}
                </View>

                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <PatientCard
                            patient={item}
                            onPress={() => navigation.navigate('PatientDetail', { patient: item })}
                        />
                    )}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.list}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: { flex: 1, padding: Spacing.xl },
    headerRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg,
    },
    title: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold },
    countBadge: {
        paddingHorizontal: Spacing.md, paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    countText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold },
    searchWrap: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        borderRadius: BorderRadius.lg, borderWidth: 1,
        paddingHorizontal: Spacing.md, height: 46, marginBottom: Spacing.lg,
    },
    searchInput: { flex: 1, fontSize: Typography.fontSizes.md },
    filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full },
    list: { paddingBottom: Spacing.section },
});
