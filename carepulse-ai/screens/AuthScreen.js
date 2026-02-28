import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { BorderRadius, Typography, Spacing } from '../constants/theme';
import { PATIENTS, setActivePatient } from '../constants/dummyData';

// ─────────────────────────────────────────────
//  All demo accounts available for switching
// ─────────────────────────────────────────────
const DEMO_DOCTORS = [
    {
        id: 'doc_001',
        name: 'Dr. Ananya Krishnan',
        nameTa: 'டாக்டர் அனன்யா கிருஷ்ணன்',
        specialty: 'Cardiology & Diabetes',
        specialtyTa: 'இதயவியல் & நீரிழிவு',
        icon: 'medkit',
        color: '#2980B9',
        role: 'doctor',
    },
    {
        id: 'doc_002',
        name: 'Dr. Senthil Murugan',
        nameTa: 'டாக்டர் செந்தில் முருகன்',
        specialty: 'Neurologist',
        specialtyTa: 'நரம்பியல் நிபுணர்',
        icon: 'fitness',
        color: '#8E44AD',
        role: 'doctor',
    },
    {
        id: 'doc_003',
        name: 'Dr. Priya Nair',
        nameTa: 'டாக்டர் பிரியா நாயர்',
        specialty: 'Endocrinologist',
        specialtyTa: 'நாளமில்லா சுரப்பி நிபுணர்',
        icon: 'heart',
        color: '#E74C3C',
        role: 'doctor',
    },
];

const RISK_COLORS = {
    critical: '#C0392B',
    high: '#E74C3C',
    medium: '#F39C12',
    low: '#27AE60',
};

export default function AuthScreen({ navigation, route }) {
    const { theme } = useTheme();
    const { t, language } = useLanguage();
    const role = route?.params?.role || 'patient';
    const [loading, setLoading] = useState(null);
    const isTa = language === 'ta';

    const isDoctor = role === 'doctor';
    const accentColor = isDoctor ? theme.primary : '#27AE60';

    const loginAs = (account) => {
        setLoading(account.id);
        setTimeout(() => {
            setLoading(null);
            if (account.role === 'doctor') {
                navigation.replace('DoctorTabs');
            } else {
                setActivePatient(account);
                navigation.replace('PatientTabs', { patientId: account.id });
            }
        }, 600);
    };

    // ── DOCTOR DEMO SELECTOR ──────────────────────────
    if (isDoctor) {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
                        <Ionicons name="arrow-back" size={20} color={theme.primary} />
                        <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 14 }}>
                            {isTa ? 'பின்னே செல்' : 'Back'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.titleBlock}>
                        <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}18` }]}>
                            <Ionicons name="medkit" size={30} color={theme.primary} />
                        </View>
                        <Text style={[styles.title, { color: theme.text }]}>
                            {isTa ? 'டாக்டர் கணக்கு' : 'Doctor Login'}
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            {isTa ? 'ஒரு டெமோ டாக்டரை தேர்வு செய்யவும்' : 'Select a demo doctor account'}
                        </Text>
                    </View>

                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                        🩺 {isTa ? 'கிடைக்கும் டாக்டர்கள்' : 'Available Doctors'}
                    </Text>
                    {DEMO_DOCTORS.map(doc => (
                        <TouchableOpacity
                            key={doc.id}
                            onPress={() => loginAs(doc)}
                            activeOpacity={0.8}
                            style={[styles.accountCard, {
                                backgroundColor: theme.surface,
                                borderLeftColor: doc.color,
                                ...theme.cardShadow,
                                opacity: loading === doc.id ? 0.65 : 1,
                            }]}
                        >
                            <View style={[styles.cardIcon, { backgroundColor: `${doc.color}18` }]}>
                                <Ionicons name={doc.icon} size={22} color={doc.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>
                                    {isTa ? doc.nameTa : doc.name}
                                </Text>
                                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                                    {isTa ? doc.specialtyTa : doc.specialty}
                                </Text>
                            </View>
                            {loading === doc.id
                                ? <Text style={{ fontSize: 12, color: doc.color }}>Logging in...</Text>
                                : <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                            }
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ── PATIENT DEMO SELECTOR ─────────────────────────
    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backRow}>
                    <Ionicons name="arrow-back" size={20} color={accentColor} />
                    <Text style={{ color: accentColor, fontWeight: '600', fontSize: 14 }}>
                        {isTa ? 'பின்னே செல்' : 'Back'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.titleBlock}>
                    <View style={[styles.iconCircle, { backgroundColor: `${accentColor}18` }]}>
                        <Ionicons name="person" size={30} color={accentColor} />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>
                        {isTa ? 'நோயாளி கணக்கு' : 'Patient Login'}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        {isTa ? 'ஒரு டெமோ நோயாளியை தேர்வு செய்யவும்' : 'Tap any patient to log in as them'}
                    </Text>
                </View>

                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                    👤 {isTa ? 'கிடைக்கும் நோயாளிகள்' : 'Available Patients'}
                    <Text style={{ color: theme.textMuted }}> ({PATIENTS.length})</Text>
                </Text>

                {PATIENTS.map(p => {
                    const name = isTa && p.nameTa ? p.nameTa : p.name;
                    const cond = isTa && p.conditionsTa ? p.conditionsTa?.[0] : p.conditions?.[0];
                    const riskColor = RISK_COLORS[p.riskLevel] || RISK_COLORS.medium;
                    return (
                        <TouchableOpacity
                            key={p.id}
                            onPress={() => loginAs({ ...p, role: 'patient' })}
                            activeOpacity={0.8}
                            style={[styles.accountCard, {
                                backgroundColor: theme.surface,
                                borderLeftColor: riskColor,
                                ...theme.cardShadow,
                                opacity: loading === p.id ? 0.65 : 1,
                            }]}
                        >
                            <View style={[styles.cardIcon, { backgroundColor: `${riskColor}18` }]}>
                                <Text style={{ fontSize: 18 }}>
                                    {p.gender === 'Male' || p.gender === 'M' ? '👨' : '👩'}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{name}</Text>
                                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 1 }}>
                                    {isTa ? `வயது ${p.age} • ` : `Age ${p.age} • `}{cond}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                    <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: riskColor }} />
                                    <Text style={{ fontSize: 11, color: riskColor, fontWeight: '600', textTransform: 'capitalize' }}>
                                        {isTa
                                            ? (p.riskLevel === 'high' ? 'அதிக ஆபத்து' : p.riskLevel === 'medium' ? 'நடுத்தர' : p.riskLevel === 'critical' ? 'அபாயகரம்' : 'நிலையானது')
                                            : `${p.riskLevel} risk`
                                        }
                                    </Text>
                                    {p.adherence !== undefined && (
                                        <Text style={{ fontSize: 11, color: theme.textMuted }}>
                                            • {isTa ? 'இணக்கம்' : 'Adherence'}: {p.adherence}%
                                        </Text>
                                    )}
                                </View>
                            </View>
                            {loading === p.id
                                ? <Text style={{ fontSize: 12, color: riskColor }}>
                                    {isTa ? 'உள்நுழைகிறது...' : 'Logging in...'}
                                </Text>
                                : <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                            }
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: Spacing.xl, paddingBottom: 40, gap: Spacing.md },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    titleBlock: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
    iconCircle: {
        width: 64, height: 64, borderRadius: 32,
        alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold },
    subtitle: { fontSize: Typography.fontSizes.sm, textAlign: 'center' },
    sectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
    accountCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 14, borderRadius: BorderRadius.xl,
        borderLeftWidth: 4,
    },
    cardIcon: {
        width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center',
    },
});
