import React, { useState, useRef, useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { BorderRadius, Typography, Spacing } from '../constants/theme';

// TTS states
const TTS = { IDLE: 'idle', SPEAKING: 'speaking', PAUSED: 'paused' };

export default function VoiceButton({ text, compact = false }) {
    const { theme } = useTheme();
    const { language, t } = useLanguage();
    const [ttsState, setTtsState] = useState(TTS.IDLE);

    // Track approximate word position for resume-from-pause simulation
    const pausedWordRef = useRef(0);
    const wordCountRef = useRef(0);
    const startTimeRef = useRef(null);

    // Cleanup speech when component unmounts
    useEffect(() => {
        return () => { Speech.stop(); };
    }, []);

    const speak = (fromText) => {
        Speech.stop();
        startTimeRef.current = Date.now();
        setTtsState(TTS.SPEAKING);
        Speech.speak(fromText, {
            language: language === 'ta' ? 'ta-IN' : 'en-IN',
            pitch: 1.0,
            rate: 0.9,
            onDone: () => { setTtsState(TTS.IDLE); pausedWordRef.current = 0; },
            onStopped: () => { },
            onError: () => setTtsState(TTS.IDLE),
        });
    };

    const handlePress = () => {
        if (ttsState === TTS.IDLE) {
            // Fresh play
            pausedWordRef.current = 0;
            speak(text);
        } else if (ttsState === TTS.SPEAKING) {
            // Pause: stop speech and save approximate position
            Speech.stop();
            // Estimate how many words were spoken based on elapsed time (≈ 2.5 words/sec at rate 0.9)
            const elapsed = (Date.now() - startTimeRef.current) / 1000;
            const wordsSpoken = Math.floor(elapsed * 2.5);
            pausedWordRef.current = (pausedWordRef.current || 0) + wordsSpoken;
            setTtsState(TTS.PAUSED);
        } else if (ttsState === TTS.PAUSED) {
            // Resume: speak from the approximate paused word position
            const words = text.split(' ');
            const remainingText = words.slice(Math.min(pausedWordRef.current, words.length - 1)).join(' ');
            speak(remainingText || text);
        }
    };

    // Icon and color based on state
    const iconName = ttsState === TTS.SPEAKING
        ? 'pause-circle'
        : ttsState === TTS.PAUSED
            ? 'play-circle'
            : 'volume-high';

    const iconColor = ttsState === TTS.SPEAKING
        ? '#FF6B6B'
        : ttsState === TTS.PAUSED
            ? '#F39C12'
            : theme.primary;

    if (compact) {
        return (
            <TouchableOpacity
                onPress={handlePress}
                style={[styles.compactBtn, { backgroundColor: `${iconColor}18` }]}
                activeOpacity={0.7}
            >
                <Ionicons name={iconName} size={20} color={iconColor} />
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={[styles.btn, { backgroundColor: `${iconColor}15`, borderColor: `${iconColor}40` }]}
            activeOpacity={0.7}
        >
            <Ionicons name={iconName} size={18} color={iconColor} />
            <Text style={[styles.label, { color: iconColor }]}>
                {ttsState === TTS.SPEAKING
                    ? (language === 'ta' ? 'நிறுத்து' : 'Pause')
                    : ttsState === TTS.PAUSED
                        ? (language === 'ta' ? 'தொடர்' : 'Resume')
                        : t('detail_voice_read')}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    label: {
        fontSize: Typography.fontSizes.sm,
        fontWeight: Typography.fontWeights.semiBold,
    },
    compactBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

