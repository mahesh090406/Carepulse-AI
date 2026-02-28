import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, Switch, StyleSheet, ScrollView,
    TextInput, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { BorderRadius, Typography, Spacing } from '../../constants/theme';
import { DOCTOR } from '../../constants/dummyData';

const PROFILE_KEY = 'carepulse_doctor_profile';

const SPECIALTIES = [
    'Cardiologist', 'Diabetologist', 'Endocrinologist', 'Neurologist',
    'General Physician', 'Pulmonologist', 'Nephrologist',
];

function InfoRow({ icon, label, value, onEdit, theme }) {
    return (
        <TouchableOpacity onPress={onEdit} style={[styles.infoRow, { borderBottomColor: theme.border }]} activeOpacity={0.7}>
            <View style={[styles.infoIcon, { backgroundColor: `${theme.primary}18` }]}>
                <Ionicons name={icon} size={16} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: '500' }}>{label}</Text>
                <Text style={{ fontSize: 14, color: theme.text, fontWeight: '600', marginTop: 1 }}>{value}</Text>
            </View>
            <Ionicons name="pencil-outline" size={16} color={theme.textSecondary} />
        </TouchableOpacity>
    );
}

function EditModal({ visible, label, value, onSave, onCancel, theme, multiline }) {
    const [text, setText] = useState(value);
    useEffect(() => setText(value), [value]);
    if (!visible) return null;
    return (
        <View style={[styles.modalOverlay]}>
            <View style={[styles.modalBox, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 12 }}>{label}</Text>
                <TextInput
                    value={text}
                    onChangeText={setText}
                    multiline={multiline}
                    autoFocus
                    style={[styles.modalInput, {
                        backgroundColor: theme.surfaceAlt, color: theme.text,
                        borderColor: theme.border, height: multiline ? 80 : 46,
                    }]}
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <TouchableOpacity onPress={onCancel} style={[styles.modalBtn, { backgroundColor: theme.surfaceAlt }]}>
                        <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onSave(text)} style={[styles.modalBtn, { backgroundColor: theme.primary }]}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

function SpecialtyPicker({ visible, selected, onSelect, onClose, theme }) {
    if (!visible) return null;
    return (
        <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { backgroundColor: theme.surface }]}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 12 }}>Select Specialty</Text>
                {SPECIALTIES.map(s => (
                    <TouchableOpacity key={s} onPress={() => { onSelect(s); onClose(); }}
                        style={[styles.specItem, {
                            backgroundColor: selected === s ? `${theme.primary}20` : theme.surfaceAlt,
                            borderColor: selected === s ? theme.primary : 'transparent',
                        }]}>
                        <Text style={{ color: selected === s ? theme.primary : theme.text, fontWeight: selected === s ? '700' : '400' }}>{s}</Text>
                        {selected === s && <Ionicons name="checkmark" size={16} color={theme.primary} />}
                    </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={onClose} style={[styles.modalBtn, { backgroundColor: theme.surfaceAlt, marginTop: 10 }]}>
                    <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function SettingsRow({ icon, label, right, theme }) {
    return (
        <View style={[styles.settingsRow, { borderBottomColor: theme.border }]}>
            <View style={[styles.settingsIcon, { backgroundColor: `${theme.primary}18` }]}>
                <Ionicons name={icon} size={18} color={theme.primary} />
            </View>
            <Text style={[styles.settingsLabel, { color: theme.text }]}>{label}</Text>
            <View>{right}</View>
        </View>
    );
}

export default function DoctorProfile({ navigation }) {
    const { theme, isDark, toggleTheme } = useTheme();
    const { t, language, setLanguage } = useLanguage();

    const [profile, setProfile] = useState({
        name: DOCTOR.name,
        nameTa: DOCTOR.nameTa,
        specialty: DOCTOR.specialty,
        hospital: DOCTOR.hospital,
        phone: DOCTOR.phone || '+91 98765 43210',
        email: DOCTOR.email || 'dr.ananya@carepulse.in',
        regNo: DOCTOR.regNo || 'TN-MED-2018-04521',
        bio: DOCTOR.bio || 'Specialist in diabetology and endocrinology with 12+ years of experience.',
        avatar: null,
    });

    const [editField, setEditField] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [showSpecPicker, setShowSpecPicker] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(PROFILE_KEY).then(raw => {
            if (raw) setProfile(p => ({ ...p, ...JSON.parse(raw) }));
        });
    }, []);

    const save = (updates) => {
        const updated = { ...profile, ...updates };
        setProfile(updated);
        AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    };

    const openEdit = (field, value, multiline = false) => {
        setEditField({ field, label: field, multiline });
        setEditValue(value);
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow photo access to change profile picture.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [1, 1], quality: 0.7,
        });
        if (!result.canceled) save({ avatar: result.assets[0].uri });
    };

    const isTa = language === 'ta';
    const displayName = isTa ? profile.nameTa : profile.name;

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.title, { color: theme.text }]}>{t('profile_title')}</Text>

                    {/* Avatar */}
                    <View style={{ alignItems: 'center', marginBottom: 4 }}>
                        <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85}>
                            <View style={[styles.avatarWrap, { borderColor: theme.primary }]}>
                                {profile.avatar ? (
                                    <Image source={{ uri: profile.avatar }} style={styles.avatarImg} />
                                ) : (
                                    <View style={[styles.avatarFallback, { backgroundColor: `${theme.primary}20` }]}>
                                        <Ionicons name="medkit" size={42} color={theme.primary} />
                                    </View>
                                )}
                                <View style={[styles.cameraBtn, { backgroundColor: theme.primary }]}>
                                    <Ionicons name="camera" size={14} color="#fff" />
                                </View>
                            </View>
                        </TouchableOpacity>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text, marginTop: 10 }}>{displayName}</Text>
                        <Text style={{ fontSize: 13, color: theme.textSecondary }}>{profile.specialty}</Text>
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>{profile.hospital}</Text>
                    </View>

                    {/* Info Fields */}
                    <View style={[styles.card, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            {isTa ? 'தகவல்கள்' : 'Profile Info'}
                        </Text>
                        <InfoRow icon="person-outline" label={isTa ? 'ஆங்கில பெயர்' : 'Full Name (English)'}
                            value={profile.name} onEdit={() => openEdit('name', profile.name)} theme={theme} />
                        <InfoRow icon="text-outline" label={isTa ? 'தமிழ் பெயர்' : 'Full Name (Tamil)'}
                            value={profile.nameTa} onEdit={() => openEdit('nameTa', profile.nameTa)} theme={theme} />
                        <InfoRow icon="ribbon-outline" label={isTa ? 'சிறப்பு' : 'Specialty'}
                            value={profile.specialty} onEdit={() => setShowSpecPicker(true)} theme={theme} />
                        <InfoRow icon="business-outline" label={isTa ? 'மருத்துவமனை' : 'Hospital'}
                            value={profile.hospital} onEdit={() => openEdit('hospital', profile.hospital)} theme={theme} />
                        <InfoRow icon="call-outline" label={isTa ? 'தொலைபேசி' : 'Phone'}
                            value={profile.phone} onEdit={() => openEdit('phone', profile.phone)} theme={theme} />
                        <InfoRow icon="mail-outline" label={isTa ? 'மின்னஞ்சல்' : 'Email'}
                            value={profile.email} onEdit={() => openEdit('email', profile.email)} theme={theme} />
                        <InfoRow icon="id-card-outline" label={isTa ? 'பதிவு எண்' : 'Reg. Number'}
                            value={profile.regNo} onEdit={() => openEdit('regNo', profile.regNo)} theme={theme} />
                        <InfoRow icon="document-text-outline" label={isTa ? 'சுயவிவரம்' : 'Bio'}
                            value={profile.bio} onEdit={() => openEdit('bio', profile.bio, true)} theme={theme} />
                    </View>

                    {/* Settings */}
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('profile_settings')}</Text>
                    <View style={[styles.settingsCard, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
                        <SettingsRow icon="moon" label={t('profile_dark_mode')} theme={theme} right={
                            <Switch value={isDark} onValueChange={toggleTheme}
                                trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#fff" />
                        } />
                        <SettingsRow icon="language" label={t('profile_language')} theme={theme} right={
                            <TouchableOpacity onPress={() => setLanguage(language === 'en' ? 'ta' : 'en')}
                                style={[styles.langBtn, { backgroundColor: `${theme.primary}18` }]}>
                                <Text style={[styles.langBtnText, { color: theme.primary }]}>
                                    {language === 'en' ? 'தமிழ்' : 'English'}
                                </Text>
                            </TouchableOpacity>
                        } />
                        <SettingsRow icon="notifications" label={t('profile_notifications')} theme={theme} right={
                            <Switch value={true} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#fff" />
                        } />
                    </View>

                    {/* Logout */}
                    <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Splash' }] })}
                        style={[styles.logoutBtn, { borderColor: theme.risk.high }]}>
                        <Ionicons name="log-out-outline" size={20} color={theme.risk.high} />
                        <Text style={[styles.logoutText, { color: theme.risk.high }]}>{t('profile_logout')}</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Inline Edit Modal */}
            <EditModal
                visible={!!editField}
                label={editField?.label}
                value={editValue}
                multiline={editField?.multiline}
                theme={theme}
                onCancel={() => setEditField(null)}
                onSave={(val) => {
                    save({ [editField.field]: val });
                    setEditField(null);
                }}
            />
            <SpecialtyPicker
                visible={showSpecPicker}
                selected={profile.specialty}
                onSelect={(s) => save({ specialty: s })}
                onClose={() => setShowSpecPicker(false)}
                theme={theme}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: Spacing.xl, paddingBottom: Spacing.section, gap: Spacing.xl },
    title: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold },
    avatarWrap: {
        width: 100, height: 100, borderRadius: 50,
        borderWidth: 3, overflow: 'visible',
        alignItems: 'center', justifyContent: 'center',
    },
    avatarImg: { width: 96, height: 96, borderRadius: 48 },
    avatarFallback: { width: 94, height: 94, borderRadius: 47, alignItems: 'center', justifyContent: 'center' },
    cameraBtn: {
        position: 'absolute', bottom: 0, right: 0,
        width: 28, height: 28, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
    },
    card: { borderRadius: BorderRadius.xl, padding: Spacing.lg, gap: 2 },
    sectionTitle: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semiBold },
    infoRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 10, borderBottomWidth: 1,
    },
    infoIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    settingsCard: { borderRadius: BorderRadius.xl, overflow: 'hidden' },
    settingsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderBottomWidth: 1 },
    settingsIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    settingsLabel: { flex: 1, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.medium },
    langBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
    langBtnText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semiBold },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 52, borderRadius: BorderRadius.lg, borderWidth: 1.5 },
    logoutText: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semiBold },
    // Modal
    modalOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', zIndex: 99,
    },
    modalBox: { width: '88%', borderRadius: BorderRadius.xl, padding: 20 },
    modalInput: { borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
    modalBtn: { flex: 1, height: 42, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
    specItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 12, borderRadius: BorderRadius.md, marginBottom: 6, borderWidth: 1,
    },
});
