import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import TrendIndicator from './TrendIndicator';
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

export default function RiskScoreCard({ score, level, trend, showLabel = true }) {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const color = getRiskColor(level, theme.risk);

    useEffect(() => {
        if (level === 'critical') {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.06, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        }
    }, [level]);

    const outerRingSize = 160;
    const innerSize = 132;
    const ringWidth = 8;

    const riskLabelKey = `pat_risk_${level}`;

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.outerRing,
                    {
                        width: outerRingSize,
                        height: outerRingSize,
                        borderRadius: outerRingSize / 2,
                        borderColor: color,
                        borderWidth: ringWidth,
                        transform: [{ scale: level === 'critical' ? pulseAnim : 1 }],
                    },
                ]}
            >
                <View
                    style={[
                        styles.inner,
                        {
                            width: innerSize,
                            height: innerSize,
                            borderRadius: innerSize / 2,
                            backgroundColor: theme.surface,
                        },
                    ]}
                >
                    <Text style={[styles.score, { color }]}>{score}</Text>
                    <Text style={[styles.slash, { color: theme.textMuted }]}>/100</Text>
                </View>
            </Animated.View>

            {showLabel && (
                <View style={styles.labelRow}>
                    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
                        <Text style={[styles.levelText, { color }]}>{t(riskLabelKey)}</Text>
                    </View>
                    <TrendIndicator trend={trend} compact />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: Spacing.md,
    },
    outerRing: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    inner: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    score: {
        fontSize: Typography.fontSizes.display,
        fontWeight: Typography.fontWeights.extraBold,
        lineHeight: 56,
    },
    slash: {
        fontSize: Typography.fontSizes.sm,
        fontWeight: Typography.fontWeights.medium,
        marginTop: -4,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    badge: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
    },
    levelText: {
        fontSize: Typography.fontSizes.sm,
        fontWeight: Typography.fontWeights.bold,
        letterSpacing: 0.5,
    },
});
