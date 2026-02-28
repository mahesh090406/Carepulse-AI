import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { BorderRadius, Typography, Spacing } from '../constants/theme';

const TYPE_CONFIG = {
    critical: {
        icon: 'warning',
        iconColor: '#E74C3C',
        border: '#E74C3C',
        bg: '#E74C3C0F',
    },
    deteriorating: {
        icon: 'trending-up',
        iconColor: '#F39C12',
        border: '#F39C12',
        bg: '#F39C120F',
    },
    non_adherent: {
        icon: 'medical',
        iconColor: '#2980B9',
        border: '#2980B9',
        bg: '#2980B90F',
    },
    iot_spike: {
        icon: 'wifi',
        iconColor: '#E74C3C',
        border: '#E74C3C',
        bg: '#E74C3C0F',
    },
};

export default function AlertCard({ alert, language }) {
    const { theme } = useTheme();
    const config = TYPE_CONFIG[alert.type] || TYPE_CONFIG.deteriorating;

    const patientName = language === 'ta' && alert.patientNameTa
        ? alert.patientNameTa
        : alert.patientName;

    const message = language === 'ta' && alert.messageTa
        ? alert.messageTa
        : alert.message;

    const time = language === 'ta' && alert.timeTa
        ? alert.timeTa
        : alert.time;

    return (
        <View style={[
            styles.card,
            {
                backgroundColor: config.bg,
                borderLeftColor: config.border,
                borderColor: theme.border,
            },
        ]}>
            <View style={[styles.iconWrap, { backgroundColor: `${config.iconColor}22` }]}>
                <Ionicons name={config.icon} size={18} color={config.iconColor} />
            </View>
            <View style={styles.textBlock}>
                <Text style={[styles.patientName, { color: theme.text }]}>{patientName}</Text>
                <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
                <Text style={[styles.time, { color: theme.textMuted }]}>{time}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        borderLeftWidth: 4,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 2,
    },
    textBlock: {
        flex: 1,
        gap: Spacing.xs,
    },
    patientName: {
        fontSize: Typography.fontSizes.md,
        fontWeight: Typography.fontWeights.semiBold,
    },
    message: {
        fontSize: Typography.fontSizes.sm,
        lineHeight: 20,
    },
    time: {
        fontSize: Typography.fontSizes.xs,
        marginTop: 2,
    },
});
