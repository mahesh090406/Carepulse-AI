import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Animated,
    StatusBar, BackHandler, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { PATIENT_USER, DOCTOR } from '../../constants/dummyData';

// Unique room name per patient-doctor pair (no spaces, URL-safe)
const JITSI_ROOM = `CarePulse-${PATIENT_USER.id}-${DOCTOR.id}`;
const JITSI_URL = `https://meet.jit.si/${JITSI_ROOM}`;

// Jitsi iframe configuration injected via postMessage
const JITSI_CONFIG_JS = `
(function() {
    // Wait for Jitsi iframe API to be ready
    var checkInterval = setInterval(function() {
        try {
            if (window.JitsiMeetExternalAPI) {
                clearInterval(checkInterval);
            }
        } catch(e) {}
    }, 500);
    true;
})();
`;

export default function VideoCallScreen({ navigation }) {
    const { theme } = useTheme();
    const { language } = useLanguage();
    const [callState, setCallState] = useState('idle'); // idle | connecting | connected | ended
    const [elapsedSecs, setElapsedSecs] = useState(0);
    const timerRef = useRef(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const isTa = language === 'ta';

    // ── Labels ──────────────────────────────────────────────────────────────
    const lbl = {
        title: isTa ? 'மருத்துவர் வீடியோ அழைப்பு' : 'Doctor Video Call',
        connecting: isTa ? 'இணைக்கிறோம்...' : 'Connecting...',
        connected: isTa ? 'நேரடி அழைப்பு' : 'Live Call',
        endCall: isTa ? 'அழைப்பை முடி' : 'End Call',
        startCall: isTa ? 'அழைப்பை தொடங்கு' : 'Start Call',
        doctorName: isTa ? DOCTOR.nameTa : DOCTOR.name,
        specialty: isTa ? DOCTOR.specialtyTa : DOCTOR.specialty,
        testTip: isTa
            ? 'சோதிக்க: மற்றொரு சாதனத்தில் இந்த லிங்கைத் திற:'
            : 'To test: Open this link on another device:',
        ended: isTa ? 'அழைப்பு முடிந்தது' : 'Call Ended',
        endedSub: isTa ? 'டாக்டரிடம் பேசியதற்கு நன்றி' : 'Thank you for consulting the doctor',
        backToDash: isTa ? 'டாஷ்போர்டுக்கு திரும்பு' : 'Back to Dashboard',
    };

    // Pulsing animation for live dot
    useEffect(() => {
        if (callState === 'connected') {
            Animated.loop(Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.6, duration: 600, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
            ])).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [callState]);

    // Timer
    useEffect(() => {
        if (callState === 'connected') {
            timerRef.current = setInterval(() => setElapsedSecs(s => s + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [callState]);

    // Android back button guard during call
    useEffect(() => {
        const handler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (callState === 'connected') {
                Alert.alert(
                    isTa ? 'அழைப்பை முடிக்கவா?' : 'End Call?',
                    isTa ? 'நீங்கள் உண்மையிலேயே வெளியேற விரும்புகிறீர்களா?' : 'Are you sure you want to leave the call?',
                    [
                        { text: isTa ? 'தொடர்' : 'Stay', style: 'cancel' },
                        { text: isTa ? 'முடி' : 'End', style: 'destructive', onPress: handleEndCall },
                    ]
                );
                return true;
            }
            return false;
        });
        return () => handler.remove();
    }, [callState]);

    const handleStartCall = () => {
        setCallState('connecting');
        setTimeout(() => setCallState('connected'), 2000);
    };

    const handleEndCall = () => {
        setCallState('ended');
        setElapsedSecs(0);
    };

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    // ── Idle screen ─────────────────────────────────────────────────────────
    if (callState === 'idle' || callState === 'ended') {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
                <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />

                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>{lbl.title}</Text>
                </View>

                {/* Doctor Card */}
                <View style={styles.centerContent}>
                    <View style={[styles.doctorAvatar, { backgroundColor: `${theme.primary}20`, borderColor: theme.primary }]}>
                        <Ionicons name="person" size={52} color={theme.primary} />
                    </View>
                    <Text style={[styles.doctorName, { color: theme.text }]}>{lbl.doctorName}</Text>
                    <Text style={[styles.doctorSpec, { color: theme.textSecondary }]}>{lbl.specialty}</Text>

                    {callState === 'ended' && (
                        <View style={[styles.endedBadge, { backgroundColor: `${theme.risk.low}18`, borderColor: theme.risk.low }]}>
                            <Ionicons name="checkmark-circle" size={16} color={theme.risk.low} />
                            <Text style={{ color: theme.risk.low, fontWeight: 'bold', fontSize: 13 }}>{lbl.ended}</Text>
                        </View>
                    )}
                    {callState === 'ended' && (
                        <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 4 }}>{lbl.endedSub}</Text>
                    )}

                    {/* Test Link */}
                    <View style={[styles.testBox, { backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}30` }]}>
                        <Ionicons name="link" size={14} color={theme.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 11, color: theme.textSecondary }}>{lbl.testTip}</Text>
                            <Text style={{ fontSize: 11, color: theme.primary, fontWeight: 'bold', marginTop: 2 }} selectable>
                                {JITSI_URL}
                            </Text>
                        </View>
                    </View>

                    {/* Start / Back button */}
                    {callState === 'ended' ? (
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={[styles.callBtn, { backgroundColor: theme.primary }]}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="home" size={20} color="#fff" />
                            <Text style={styles.callBtnText}>{lbl.backToDash}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={handleStartCall}
                            style={[styles.callBtn, { backgroundColor: '#25D34A' }]}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="videocam" size={20} color="#fff" />
                            <Text style={styles.callBtnText}>{lbl.startCall}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    // ── Connecting screen ────────────────────────────────────────────────────
    if (callState === 'connecting') {
        return (
            <View style={[styles.safe, styles.darkOverlay]}>
                <StatusBar barStyle="light-content" />
                <View style={styles.connectingBox}>
                    <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulseAnim }] }]} />
                    <View style={styles.connectingAvatar}>
                        <Ionicons name="person" size={40} color="#fff" />
                    </View>
                    <Text style={styles.connectingName}>{lbl.doctorName}</Text>
                    <Text style={styles.connectingStatus}>{lbl.connecting}</Text>
                    <TouchableOpacity onPress={() => setCallState('idle')} style={styles.endBtnSmall}>
                        <Ionicons name="call" size={24} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ── Active call screen (Jitsi WebView) ───────────────────────────────────
    return (
        <View style={[styles.safe, { backgroundColor: '#000' }]}>
            <StatusBar barStyle="light-content" hidden />

            {/* Live status bar */}
            <View style={styles.liveBar}>
                <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
                <Text style={styles.liveLabel}>{lbl.connected}</Text>
                <Text style={styles.liveTimer}>{formatTime(elapsedSecs)}</Text>
                <TouchableOpacity onPress={handleEndCall} style={styles.endCallBtn} activeOpacity={0.85}>
                    <Ionicons name="call" size={18} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                    <Text style={styles.endCallText}>{lbl.endCall}</Text>
                </TouchableOpacity>
            </View>

            {/* Jitsi WebView */}
            <WebView
                source={{ uri: JITSI_URL }}
                style={{ flex: 1 }}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                injectedJavaScript={JITSI_CONFIG_JS}
                onError={() => Alert.alert('Error', 'Could not load video call. Check internet connection.')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 17, fontWeight: '700' },
    centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
    doctorAvatar: {
        width: 110, height: 110, borderRadius: 55,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, marginBottom: 8,
    },
    doctorName: { fontSize: 22, fontWeight: '800' },
    doctorSpec: { fontSize: 14, marginTop: -4 },
    endedBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1, marginTop: 8,
    },
    testBox: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        borderRadius: 12, borderWidth: 1,
        padding: 12, marginTop: 4, width: '100%',
    },
    callBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 32, paddingVertical: 14,
        borderRadius: 32, marginTop: 16,
    },
    callBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    // Connecting screen
    darkOverlay: { backgroundColor: '#0a0a1a', alignItems: 'center', justifyContent: 'center' },
    connectingBox: { alignItems: 'center', gap: 14 },
    avatarRing: {
        position: 'absolute', width: 140, height: 140, borderRadius: 70,
        backgroundColor: '#25D34A30',
    },
    connectingAvatar: {
        width: 110, height: 110, borderRadius: 55,
        backgroundColor: '#25D34A', alignItems: 'center', justifyContent: 'center',
    },
    connectingName: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 12 },
    connectingStatus: { color: '#aaa', fontSize: 15 },
    endBtnSmall: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: '#E74C3C', alignItems: 'center', justifyContent: 'center', marginTop: 20,
    },
    // Active call bar
    liveBar: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#111', paddingHorizontal: 14, paddingVertical: 10,
    },
    liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#25D34A' },
    liveLabel: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 },
    liveTimer: { color: '#bbb', fontSize: 13, fontFamily: 'monospace' },
    endCallBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#E74C3C', borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 6,
    },
    endCallText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
