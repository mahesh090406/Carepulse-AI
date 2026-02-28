import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { BorderRadius, Typography, Spacing } from '../constants/theme';

export default function LanguageScreen({ navigation }) {
    const { theme } = useTheme();
    const { t, setLanguage } = useLanguage();

    const selectLanguage = (lang) => {
        setLanguage(lang);
        navigation.navigate('Role');
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}18` }]}>
                        <Ionicons name="language" size={36} color={theme.primary} />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>{t('lang_select_title')}</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        {t('lang_select_subtitle')}
                    </Text>
                </View>

                <View style={styles.cards}>
                    <TouchableOpacity
                        onPress={() => selectLanguage('en')}
                        style={[styles.langCard, { backgroundColor: theme.surface, ...theme.cardShadow }]}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.flag}>🇬🇧</Text>
                        <Text style={[styles.langLabel, { color: theme.text }]}>{t('lang_english')}</Text>
                        <Text style={[styles.langSub, { color: theme.textSecondary }]}>English</Text>
                        <View style={[styles.selectBtn, { backgroundColor: theme.primary }]}>
                            <Text style={styles.selectBtnText}>Select</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => selectLanguage('ta')}
                        style={[styles.langCard, { backgroundColor: theme.surface, ...theme.cardShadow }]}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.flag}>🇮🇳</Text>
                        <Text style={[styles.langLabel, { color: theme.text }]}>{t('lang_tamil')}</Text>
                        <Text style={[styles.langSub, { color: theme.textSecondary }]}>தமிழ்</Text>
                        <View style={[styles.selectBtn, { backgroundColor: theme.accent }]}>
                            <Text style={styles.selectBtnText}>தேர்வு</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={[styles.powerBadge, { backgroundColor: theme.surface }]}>
                    <Ionicons name="pulse" size={14} color={theme.primary} />
                    <Text style={[styles.powerText, { color: theme.textMuted }]}>{t('app_name')}</Text>
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
        gap: Spacing.md,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    title: {
        fontSize: Typography.fontSizes.xxl,
        fontWeight: Typography.fontWeights.bold,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: Typography.fontSizes.md,
        textAlign: 'center',
    },
    cards: {
        flexDirection: 'row',
        gap: Spacing.lg,
        width: '100%',
    },
    langCard: {
        flex: 1,
        alignItems: 'center',
        padding: Spacing.xl,
        borderRadius: BorderRadius.xl,
        gap: Spacing.sm,
    },
    flag: {
        fontSize: 40,
    },
    langLabel: {
        fontSize: Typography.fontSizes.xl,
        fontWeight: Typography.fontWeights.bold,
    },
    langSub: {
        fontSize: Typography.fontSizes.sm,
        marginBottom: Spacing.xs,
    },
    selectBtn: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        marginTop: Spacing.xs,
    },
    selectBtnText: {
        color: '#fff',
        fontSize: Typography.fontSizes.sm,
        fontWeight: Typography.fontWeights.semiBold,
    },
    powerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    powerText: {
        fontSize: Typography.fontSizes.xs,
        fontWeight: Typography.fontWeights.medium,
    },
});
