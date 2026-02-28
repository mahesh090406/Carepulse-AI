import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { BorderRadius, Typography, Spacing } from '../constants/theme';

export default function RoleScreen({ navigation }) {
    const { theme } = useTheme();
    const { t } = useLanguage();

    const selectRole = (role) => {
        navigation.navigate('Auth', { role });
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.text }]}>{t('role_select_title')}</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        {t('role_select_subtitle')}
                    </Text>
                </View>

                <View style={styles.cards}>
                    <TouchableOpacity
                        onPress={() => selectRole('doctor')}
                        style={[styles.roleCard, { backgroundColor: theme.surface, ...theme.cardShadow }]}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.roleIcon, { backgroundColor: `${theme.primary}18` }]}>
                            <Ionicons name="medkit" size={40} color={theme.primary} />
                        </View>
                        <Text style={[styles.roleLabel, { color: theme.text }]}>{t('role_doctor')}</Text>
                        <Text style={[styles.roleDesc, { color: theme.textSecondary }]}>
                            {t('role_doctor_desc')}
                        </Text>
                        <View style={[styles.arrowBtn, { backgroundColor: theme.primary }]}>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => selectRole('patient')}
                        style={[styles.roleCard, { backgroundColor: theme.surface, ...theme.cardShadow }]}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.roleIcon, { backgroundColor: `${theme.accent}18` }]}>
                            <Ionicons name="person" size={40} color={theme.accent} />
                        </View>
                        <Text style={[styles.roleLabel, { color: theme.text }]}>{t('role_patient')}</Text>
                        <Text style={[styles.roleDesc, { color: theme.textSecondary }]}>
                            {t('role_patient_desc')}
                        </Text>
                        <View style={[styles.arrowBtn, { backgroundColor: theme.accent }]}>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xxl,
        gap: Spacing.xxxl,
    },
    header: {
        alignItems: 'center',
        gap: Spacing.sm,
    },
    title: {
        fontSize: Typography.fontSizes.xxxl,
        fontWeight: Typography.fontWeights.extraBold,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: Typography.fontSizes.md,
        textAlign: 'center',
    },
    cards: {
        width: '100%',
        gap: Spacing.lg,
    },
    roleCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xxl,
        alignItems: 'center',
        gap: Spacing.md,
    },
    roleIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roleLabel: {
        fontSize: Typography.fontSizes.xl,
        fontWeight: Typography.fontWeights.bold,
    },
    roleDesc: {
        fontSize: Typography.fontSizes.sm,
        textAlign: 'center',
        lineHeight: 20,
    },
    arrowBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.xs,
    },
});
