import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import TrendIndicator from './TrendIndicator';
import { runAIModel } from '../services/aiModel';
import { BorderRadius, Typography, Spacing } from '../constants/theme';

function getRiskColor(level, riskColors) {
    switch (level) {
        case 'low': return riskColors.low;
        case 'medium': return riskColors.medium;
        case 'high': return riskColors.high;
        case 'critical': return riskColors.critical;
        default: return riskColors.medium;
    }
}

export default function PatientCard({ patient, onPress }) {
    const { theme } = useTheme();
    const { t, language } = useLanguage();

    
    const aiResult = runAIModel({
        systolicBP: patient.iotLive?.systolicBP ?? parseFloat(patient.bp) ?? 130,
        bloodSugar: patient.iotLive?.bloodSugar ?? patient.bloodSugar ?? 130,
        adherence: patient.adherence ?? 70,
        hba1c: patient.labs?.hba1c ?? 6.0,
        heartRate: patient.iotLive?.heartRate ?? patient.heartRate ?? 80,
    });

    const riskColor = getRiskColor(aiResult.level, theme.risk);
    const name = language === 'ta' && patient.nameTa ? patient.nameTa : patient.name;
    const conditions = language === 'ta' && patient.conditionsTa
        ? patient.conditionsTa
        : patient.conditions;

    const confidencePct = Math.round(aiResult.probability * 100);

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.card, { backgroundColor: theme.surface, ...theme.cardShadow }]}
            activeOpacity={0.8}
        >
          
            <View style={[styles.accentBar, { backgroundColor: riskColor }]} />

            <View style={styles.content}>
                <View style={styles.topRow}>
                    <View style={styles.nameBlock}>
                        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                            {name}
                        </Text>
                        <Text style={[styles.age, { color: theme.textSecondary }]}>
                            {patient.age} {t('yrs')}
                        </Text>
                    </View>

                    
                    <View style={styles.scoreBlock}>
                        
                        <View style={[styles.aiBadge, { backgroundColor: `${theme.primary}20` }]}>
                            <Text style={[styles.aiBadgeText, { color: theme.primary }]}>AI</Text>
                        </View>
                        <View style={[styles.scoreBadge, {
                            backgroundColor: `${riskColor}18`,
                            borderColor: `${riskColor}44`, borderWidth: 1,
                        }]}>
                            <Text style={[styles.scoreNum, { color: riskColor }]}>
                                {aiResult.score}
                            </Text>
                        </View>
                        <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>
                            {confidencePct}% {t('ai_confidence')}
                        </Text>
                    </View>
                </View>

                <View style={styles.conditionRow}>
                    {conditions.slice(0, 3).map((cond, i) => (
                        <View key={i} style={[styles.conditionTag, { backgroundColor: theme.badge }]}>
                            <Text style={[styles.conditionText, { color: theme.textSecondary }]}>
                                {cond}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={styles.bottomRow}>
                    <TrendIndicator trend={patient.trend} compact />
                    <View style={styles.adherenceBlock}>
                        <Ionicons name="medical" size={12} color={theme.textMuted} />
                        <Text style={[styles.adherenceText, { color: theme.textMuted }]}>
                            {patient.adherence}% {t('patient_adherence')}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.md,
        overflow: 'hidden',
    },
    accentBar: { width: 4 },
    content: { flex: 1, padding: Spacing.lg, gap: Spacing.sm },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    nameBlock: { flex: 1, gap: 2 },
    name: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semiBold },
    age: { fontSize: Typography.fontSizes.sm },
    scoreBlock: { alignItems: 'center', gap: 2 },
    aiBadge: {
        paddingHorizontal: 6, paddingVertical: 1,
        borderRadius: BorderRadius.sm, marginBottom: 2,
    },
    aiBadgeText: { fontSize: 9, fontWeight: Typography.fontWeights.bold, letterSpacing: 0.5 },
    scoreBadge: {
        width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
    },
    scoreNum: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold },
    scoreLabel: { fontSize: 9, textAlign: 'center', maxWidth: 52 },
    conditionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    conditionTag: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm },
    conditionText: { fontSize: Typography.fontSizes.xs, fontWeight: Typography.fontWeights.medium },
    bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
    adherenceBlock: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    adherenceText: { fontSize: Typography.fontSizes.xs },
});
