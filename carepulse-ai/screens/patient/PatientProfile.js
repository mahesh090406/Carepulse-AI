import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, Switch, StyleSheet, ScrollView,
    TextInput, Linking, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { BorderRadius, Typography, Spacing } from '../../constants/theme';
import { PATIENT_USER } from '../../constants/dummyData';

const CARE_CONTACTS_KEY = 'carepulse_care_contacts';

const RELATIONS = {
    en: ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Friend', 'Other'],
    ta: ['மனைவி/கணவர்', 'மகன்', 'மகள்', 'தந்தை', 'தாய்', 'சகோதரன்', 'சகோதரி', 'நண்பர்', 'மற்றவர்'],
};
const RELATION_ICONS = ['heart', 'man', 'woman', 'man', 'woman', 'man', 'woman', 'people', 'person'];

// ── Settings Row ──────────────────────────────────────────────────────────────
function SettingsRow({ icon, label, right, theme, last }) {
    return (
        <View style={[styles.settingsRow, { borderBottomColor: theme.border }, last && { borderBottomWidth: 0 }]}>
            <View style={[styles.settingsIcon, { backgroundColor: `${theme.primary}18` }]}>
                <Ionicons name={icon} size={18} color={theme.primary} />
            </View>
            <Text style={[styles.settingsLabel, { color: theme.text }]}>{label}</Text>
            <View>{right}</View>
        </View>
    );
}

// ── Contact Card ──────────────────────────────────────────────────────────────
function ContactCard({ contact, onDelete, theme }) {
    const handleCall = () => {
        Linking.openURL(`tel:${contact.phone}`).catch(() => Alert.alert('Error', 'Cannot open dialer'));
    };
    return (
        <View style={[styles.contactCard, { backgroundColor: theme.surfaceAlt, borderColor: `${theme.primary}25` }]}>
            <View style={[styles.contactAvatar, { backgroundColor: `${theme.accent}20` }]}>
                <Ionicons name={contact.icon || 'person'} size={20} color={theme.accent} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text }}>{contact.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.relBadge, { backgroundColor: `${theme.primary}15` }]}>
                        <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '600' }}>{contact.relation}</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: theme.textSecondary }}>{contact.phone}</Text>
                </View>
            </View>
            <TouchableOpacity onPress={handleCall} style={[styles.actionBtn, { backgroundColor: '#25D34A20' }]}>
                <Ionicons name="call" size={18} color="#25D34A" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(contact.id)} style={[styles.actionBtn, { backgroundColor: `${theme.risk.high}15` }]}>
                <Ionicons name="trash-outline" size={16} color={theme.risk.high} />
            </TouchableOpacity>
        </View>
    );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function PatientProfile({ navigation }) {
    const { theme, isDark, toggleTheme } = useTheme();
    const { t, language, setLanguage } = useLanguage();
    const isTa = language === 'ta';

    const name = isTa ? PATIENT_USER.nameTa : PATIENT_USER.name;
    const conditions = isTa ? PATIENT_USER.conditionsTa : PATIENT_USER.conditions;
    const gender = isTa ? PATIENT_USER.genderTa : PATIENT_USER.gender;

    // Care Tracker state
    const [contacts, setContacts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newRelIdx, setNewRelIdx] = useState(0);

    useEffect(() => {
        AsyncStorage.getItem(CARE_CONTACTS_KEY).then(raw => {
            if (raw) setContacts(JSON.parse(raw));
        });
    }, []);

    const saveContacts = (updated) => {
        setContacts(updated);
        AsyncStorage.setItem(CARE_CONTACTS_KEY, JSON.stringify(updated));
    };

    const handleAdd = () => {
        if (!newName.trim() || !newPhone.trim()) {
            Alert.alert(
                isTa ? 'தவறு' : 'Missing Info',
                isTa ? 'பெயர் மற்றும் தொலைபேசி எண் தேவை' : 'Please enter name and phone number'
            );
            return;
        }
        const relList = RELATIONS[isTa ? 'ta' : 'en'];
        saveContacts([...contacts, {
            id: `c_${Date.now()}`,
            name: newName.trim(),
            phone: newPhone.trim(),
            relation: relList[newRelIdx],
            icon: RELATION_ICONS[newRelIdx],
        }]);
        setNewName(''); setNewPhone(''); setNewRelIdx(0); setShowForm(false);
    };

    const handleDelete = (id) => {
        Alert.alert(
            isTa ? 'நீக்குகிறீர்களா?' : 'Remove Contact?',
            isTa ? 'இந்த அவசர தொடர்பை நீக்கவா?' : 'Remove this emergency contact?',
            [
                { text: isTa ? 'ரத்து' : 'Cancel', style: 'cancel' },
                { text: isTa ? 'நீக்கு' : 'Remove', style: 'destructive', onPress: () => saveContacts(contacts.filter(c => c.id !== id)) },
            ]
        );
    };

    const relationList = RELATIONS[isTa ? 'ta' : 'en'];

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.title, { color: theme.text }]}>{t('profile_title')}</Text>

                    {/* Avatar */}
                    <View style={[styles.avatarCard, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
                        <View style={[styles.avatarCircle, { backgroundColor: `${theme.accent}20` }]}>
                            <Ionicons name="person" size={36} color={theme.accent} />
                        </View>
                        <View style={styles.patientInfo}>
                            <Text style={[styles.patientName, { color: theme.text }]}>{name}</Text>
                            <Text style={[styles.patientMeta, { color: theme.textSecondary }]}>
                                {PATIENT_USER.age} {t('yrs')} · {gender}
                            </Text>
                        </View>
                    </View>

                    {/* Conditions */}
                    <View style={[styles.conditionsCard, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>{t('profile_conditions')}</Text>
                        <View style={styles.conditionsList}>
                            {conditions.map((c, i) => (
                                <View key={i} style={[styles.condTag, { backgroundColor: `${theme.primary}14` }]}>
                                    <Ionicons name="medical" size={12} color={theme.primary} />
                                    <Text style={[styles.condTagText, { color: theme.primary }]}>{c}</Text>
                                </View>
                            ))}
                        </View>
                        <View style={[styles.adherenceRow, { backgroundColor: theme.surfaceAlt }]}>
                            <Text style={[styles.adherenceLabel, { color: theme.textSecondary }]}>{t('patient_adherence')}</Text>
                            <Text style={[styles.adherenceValue, { color: PATIENT_USER.adherence >= 80 ? theme.risk.low : theme.risk.medium }]}>
                                {PATIENT_USER.adherence}%
                            </Text>
                        </View>
                    </View>

                    {/* ═══════════════════════════════════════════════════
                        CARE TRACKER
                        ═══════════════════════════════════════════════════ */}
                    <View style={[styles.careHeader, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
                        <View style={[styles.careIconBox, { backgroundColor: '#E74C3C18' }]}>
                            <Ionicons name="shield-checkmark" size={20} color="#E74C3C" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>
                                {isTa ? 'கேர் டிராக்கர்' : 'Care Tracker'}
                            </Text>
                            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 1 }}>
                                {isTa ? 'அவசர குடும்ப தொடர்புகள்' : 'Emergency family contacts'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowForm(v => !v)}
                            style={[styles.addBtn, { backgroundColor: showForm ? `${theme.risk.high}15` : '#E74C3C18' }]}
                        >
                            <Ionicons name={showForm ? 'close' : 'add'} size={22} color="#E74C3C" />
                        </TouchableOpacity>
                    </View>

                    {/* Add Contact Form — directly under Care Tracker header */}
                    {showForm && (
                        <View style={[styles.formCard, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
                            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                                {isTa ? 'பெயர்' : 'Contact Name'}
                            </Text>
                            <TextInput
                                value={newName} onChangeText={setNewName}
                                placeholder={isTa ? 'உதா: ரமேஷ் குமார்' : 'e.g. Ramesh Kumar'}
                                placeholderTextColor={theme.textMuted}
                                style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
                            />

                            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                                {isTa ? 'தொலைபேசி எண்' : 'Phone Number'}
                            </Text>
                            <TextInput
                                value={newPhone} onChangeText={setNewPhone}
                                placeholder={isTa ? 'உதா: 9876543210' : 'e.g. 9876543210'}
                                placeholderTextColor={theme.textMuted}
                                keyboardType="phone-pad"
                                style={[styles.input, { backgroundColor: theme.surfaceAlt, color: theme.text, borderColor: theme.border }]}
                            />

                            <Text style={[styles.formLabel, { color: theme.textSecondary }]}>
                                {isTa ? 'உறவு' : 'Relation'}
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {relationList.map((rel, i) => (
                                        <TouchableOpacity key={i} onPress={() => setNewRelIdx(i)}
                                            style={[styles.relChip, {
                                                backgroundColor: newRelIdx === i ? theme.primary : `${theme.primary}12`,
                                            }]}
                                        >
                                            <Ionicons name={RELATION_ICONS[i]} size={12} color={newRelIdx === i ? '#fff' : theme.primary} />
                                            <Text style={{ fontSize: 12, color: newRelIdx === i ? '#fff' : theme.primary, fontWeight: '600' }}>{rel}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>

                            <TouchableOpacity onPress={handleAdd} style={[styles.saveBtn, { backgroundColor: '#E74C3C' }]}>
                                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                                    {isTa ? 'தொடர்பை சேர்' : 'Add Contact'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Contact List — directly under Care Tracker header */}
                    {contacts.length === 0 && !showForm ? (
                        <View style={[styles.emptyBox, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                            <Ionicons name="people-outline" size={36} color={theme.textMuted} />
                            <Text style={{ color: theme.textMuted, textAlign: 'center', fontSize: 13, marginTop: 8, lineHeight: 20 }}>
                                {isTa
                                    ? 'இன்னும் அவசர தொடர்புகள் இல்லை.\nமேலே உள்ள + பொத்தானை அழுத்தவும்.'
                                    : 'No emergency contacts yet.\nTap + above to add one.'}
                            </Text>
                        </View>
                    ) : (
                        <View style={{ gap: Spacing.sm }}>
                            {contacts.map(c => (
                                <ContactCard key={c.id} contact={c} onDelete={handleDelete} theme={theme} />
                            ))}
                        </View>
                    )}

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
                        <SettingsRow icon="notifications" label={t('profile_notifications')} last theme={theme} right={
                            <Switch value={true} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#fff" />
                        } />
                    </View>

                    {/* Switch Account */}
                    <TouchableOpacity
                        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Role' }] })}
                        style={[styles.logoutBtn, { borderColor: theme.primary, marginBottom: -8 }]}
                    >
                        <Ionicons name="swap-horizontal-outline" size={20} color={theme.primary} />
                        <Text style={[styles.logoutText, { color: theme.primary }]}>
                            {isTa ? 'கணக்கை மாற்று' : 'Switch Account'}
                        </Text>
                    </TouchableOpacity>

                    {/* Logout */}
                    <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Splash' }] })}
                        style={[styles.logoutBtn, { borderColor: theme.risk.high }]}>
                        <Ionicons name="log-out-outline" size={20} color={theme.risk.high} />
                        <Text style={[styles.logoutText, { color: theme.risk.high }]}>{t('profile_logout')}</Text>
                    </TouchableOpacity>

                </ScrollView>


            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: Spacing.xl, paddingBottom: Spacing.section, gap: Spacing.xl },
    title: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold },
    avatarCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, borderRadius: BorderRadius.xl, padding: Spacing.xl },
    avatarCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
    patientInfo: { flex: 1, gap: 4 },
    patientName: { fontSize: Typography.fontSizes.xl, fontWeight: Typography.fontWeights.bold },
    patientMeta: { fontSize: Typography.fontSizes.sm },
    conditionsCard: { borderRadius: BorderRadius.xl, padding: Spacing.xl, gap: Spacing.md },
    cardTitle: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semiBold },
    conditionsList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    condTag: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full },
    condTagText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.medium },
    adherenceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.md },
    adherenceLabel: { fontSize: Typography.fontSizes.sm },
    adherenceValue: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold },
    sectionTitle: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semiBold },
    settingsCard: { borderRadius: BorderRadius.xl, overflow: 'hidden' },
    settingsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderBottomWidth: 1 },
    settingsIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    settingsLabel: { flex: 1, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.medium },
    langBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
    langBtnText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semiBold },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 52, borderRadius: BorderRadius.lg, borderWidth: 1.5 },
    logoutText: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semiBold },
    // Care Tracker
    careHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: BorderRadius.xl, padding: Spacing.lg },
    careIconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    formCard: { borderRadius: BorderRadius.xl, padding: Spacing.xl, gap: Spacing.sm },
    formLabel: { fontSize: Typography.fontSizes.sm, fontWeight: '600', marginBottom: 2 },
    input: { borderWidth: 1, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
    relChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.full },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: BorderRadius.lg, marginTop: 4 },
    contactCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: BorderRadius.lg, borderWidth: 1 },
    contactAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
    relBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    emptyBox: { alignItems: 'center', padding: Spacing.xl, borderRadius: BorderRadius.xl, borderWidth: 1, borderStyle: 'dashed' },
});
