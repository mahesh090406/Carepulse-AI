import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, Typography, Spacing } from '../constants/theme';

export default function MetricCard({ icon, label, value, unit, color }) {
    const { theme } = useTheme();
    const accentColor = color || theme.primary;

    return (
        <View style={[styles.card, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
            <View style={[styles.iconWrap, { backgroundColor: `${accentColor}18` }]}>
                <Ionicons name={icon} size={22} color={accentColor} />
            </View>
            <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
            <Text style={[styles.unit, { color: theme.textMuted }]}>{unit}</Text>
            <Text style={[styles.label, { color: theme.textSecondary }]} numberOfLines={2}>
                {label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        gap: Spacing.xs,
        minWidth: 90,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    value: {
        fontSize: Typography.fontSizes.xl,
        fontWeight: Typography.fontWeights.bold,
    },
    unit: {
        fontSize: 10,
        fontWeight: Typography.fontWeights.medium,
    },
    label: {
        fontSize: Typography.fontSizes.xs,
        textAlign: 'center',
        fontWeight: Typography.fontWeights.medium,
        lineHeight: 16,
    },
});
