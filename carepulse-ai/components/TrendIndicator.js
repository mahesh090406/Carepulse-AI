import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Typography, Spacing } from '../constants/theme';

function getTrendConfig(trend, riskColors) {
    switch (trend) {
        case 'improving':
            return { icon: 'arrow-down', color: riskColors.low, labelKey: 'trend_improving' };
        case 'worsening':
            return { icon: 'arrow-up', color: riskColors.high, labelKey: 'trend_worsening' };
        default:
            return { icon: 'remove', color: '#6B7280', labelKey: 'trend_stable' };
    }
}

export default function TrendIndicator({ trend, compact = false }) {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const config = getTrendConfig(trend, theme.risk);

    if (compact) {
        return (
            <View style={[styles.compactRow, { backgroundColor: `${config.color}18` }]}>
                <Ionicons name={config.icon} size={12} color={config.color} />
                <Text style={[styles.compactLabel, { color: config.color }]}>
                    {t(config.labelKey)}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.row}>
            <View style={[styles.iconWrapper, { backgroundColor: `${config.color}18` }]}>
                <Ionicons name={config.icon} size={16} color={config.color} />
            </View>
            <Text style={[styles.label, { color: config.color }]}>
                {t(config.labelKey)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    iconWrapper: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: Typography.fontSizes.sm,
        fontWeight: Typography.fontWeights.semiBold,
    },
    compactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    compactLabel: {
        fontSize: 11,
        fontWeight: Typography.fontWeights.semiBold,
    },
});
