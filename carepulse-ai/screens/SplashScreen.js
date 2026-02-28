import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Typography, Spacing } from '../constants/theme';

export default function SplashScreen({ navigation }) {
    const { theme } = useTheme();
    const { t } = useLanguage();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.7)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        ]).start();

        const timer = setTimeout(() => {
            navigation.replace('Language');
        }, 2400);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: '#0D1B3E' }]}>
            <Animated.View
                style={[styles.logoBlock, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
            >
                <View style={styles.iconCircle}>
                    <Ionicons name="pulse" size={52} color="#4A8FFF" />
                </View>
                <Text style={styles.appName}>{t('app_name')}</Text>
                <Text style={styles.tagline}>{t('tagline')}</Text>
            </Animated.View>

            <Animated.Text style={[styles.loading, { opacity: fadeAnim, color: '#6B7280' }]}>
                {t('splash_loading')}
            </Animated.Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xxxl,
    },
    logoBlock: {
        alignItems: 'center',
        gap: Spacing.lg,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1A2A5E',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#4A8FFF44',
    },
    appName: {
        fontSize: Typography.fontSizes.xxxl,
        fontWeight: Typography.fontWeights.extraBold,
        color: '#F0F4FF',
        letterSpacing: 0.5,
    },
    tagline: {
        fontSize: Typography.fontSizes.md,
        color: '#9BA3B5',
        fontWeight: Typography.fontWeights.medium,
        letterSpacing: 0.3,
    },
    loading: {
        fontSize: Typography.fontSizes.sm,
        letterSpacing: 1,
    },
});
