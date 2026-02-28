import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, Switch, TouchableOpacity, ScrollView,
    StyleSheet, KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import RiskScoreCard from '../../components/RiskScoreCard';
import VoiceButton from '../../components/VoiceButton';
import { analyzeReportImage, getAIRecommendation } from '../../services/geminiService';
import { BorderRadius, Typography, Spacing } from '../../constants/theme';
import { PATIENT_USER } from '../../constants/dummyData';
import { loadHealthLogs, saveHealthLog } from '../../services/storage';

const MODE = { UPLOAD: 'upload', MANUAL: 'manual' };
const STEP = { IDLE: 'idle', ANALYZING: 'analyzing', SUBMITTING: 'submitting', DONE: 'done' };

export default function HealthEntry() {
    const { theme } = useTheme();
    const { t, language } = useLanguage();


    const [mode, setMode] = useState(MODE.UPLOAD);


    const [bp, setBp] = useState('');
    const [sugar, setSugar] = useState('');
    const [heartRate, setHeartRate] = useState('');
    const [medTaken, setMedTaken] = useState(false);


    const [reportUri, setReportUri] = useState(null);
    const [extractedData, setExtractedData] = useState(null);


    const [step, setStep] = useState(STEP.IDLE);
    const [errorMsg, setErrorMsg] = useState('');
    const [aiFeedback, setAiFeedback] = useState('');
    const [newRisk, setNewRisk] = useState(null);


    const [savedLogs, setSavedLogs] = useState([]);

    useEffect(() => {
        loadHealthLogs().then(setSavedLogs);
    }, []);

    const isAnalyzing = step === STEP.ANALYZING;
    const isSubmitting = step === STEP.SUBMITTING;
    const isDone = step === STEP.DONE;


    const switchMode = (next) => {
        setMode(next);
        setErrorMsg('');
        setReportUri(null);
        setExtractedData(null);
        setBp(''); setSugar(''); setHeartRate('');
        setStep(STEP.IDLE);
        setAiFeedback('');
        setNewRisk(null);
    };


    const analyzeFile = async (uri, mimeType) => {
        setStep(STEP.ANALYZING);
        setErrorMsg('');
        try {
            let finalUri = uri;
            if (mimeType.startsWith('image/')) {
                const compressed = await ImageManipulator.manipulateAsync(
                    uri,
                    [{ resize: { width: 800 } }],
                    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
                );
                finalUri = compressed.uri;
            }
            const base64 = await FileSystem.readAsStringAsync(finalUri, { encoding: 'base64' });
            const result = await analyzeReportImage(base64, 'image/jpeg', language);
            setExtractedData(result);

            if (result.systolicBP && result.diastolicBP) setBp(`${result.systolicBP}/${result.diastolicBP}`);
            if (result.bloodSugar) setSugar(String(result.bloodSugar));
            if (result.heartRate) setHeartRate(String(result.heartRate));
        } catch (e) {
            setErrorMsg(`${language === 'ta' ? 'பிழை' : 'Error'}: ${e?.message ?? 'Unknown'}`);
        } finally {
            setStep(STEP.IDLE);
        }
    };


    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg(language === 'ta' ? 'புகைப்பட அனுமதி தேவை.' : 'Photo library permission required.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], quality: 0.85,
        });
        if (!result.canceled) {
            const asset = result.assets[0];
            setReportUri(asset.uri);
            setExtractedData(null);
            setErrorMsg('');
            await analyzeFile(asset.uri, 'image/jpeg');
        }
    };


    const pickDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/pdf', copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets?.[0]) {
            const asset = result.assets[0];
            setReportUri(asset.uri);
            setExtractedData(null);
            setErrorMsg('');
            await analyzeFile(asset.uri, 'application/pdf');
        }
    };


    const handleSubmit = async () => {
        const hasData = bp.trim() || sugar.trim() || heartRate.trim() || extractedData;
        if (!hasData) {
            setErrorMsg(language === 'ta'
                ? 'குறைந்தது ஒரு மதிப்பை உள்ளிடவும் அல்லது அறிக்கையை பதிவேற்றவும்.'
                : 'Please enter at least one value or upload a report first.');
            return;
        }
        setStep(STEP.SUBMITTING);
        setErrorMsg('');
        try {
            const [systolic, diastolic] = bp.split('/').map(Number);
            const feedback = await getAIRecommendation({
                name: PATIENT_USER.name,
                age: PATIENT_USER.age,
                conditions: PATIENT_USER.conditions,
                medications: PATIENT_USER.medications,
                systolicBP: systolic || extractedData?.systolicBP || 130,
                diastolicBP: diastolic || extractedData?.diastolicBP || 84,
                bloodSugar: parseFloat(sugar) || extractedData?.bloodSugar || 130,
                heartRate: parseFloat(heartRate) || extractedData?.heartRate || 80,
                adherence: medTaken ? 100 : 40,
                riskScore: medTaken ? 55 : 70,
                riskLevel: medTaken ? 'medium' : 'high',
            }, language);
            setAiFeedback(feedback);
            setNewRisk(medTaken ? 55 : 70);


            const newEntry = {
                id: `log_${Date.now()}`,
                date: new Date().toISOString(),
                bp: bp || (extractedData ? `${extractedData.systolicBP}/${extractedData.diastolicBP}` : ''),
                sugar: sugar || String(extractedData?.bloodSugar ?? ''),
                heartRate: heartRate || String(extractedData?.heartRate ?? ''),
                medTaken,
                riskScore: medTaken ? 55 : 70,
                aiFeedback: feedback,
            };
            const updated = await saveHealthLog(newEntry);
            setSavedLogs(updated);

            setStep(STEP.DONE);
            // Don't auto-play — user can tap the Pause/Resume button
        } catch (e) {
            setErrorMsg(`AI error: ${e?.message ?? 'Unknown'}`);
            setStep(STEP.IDLE);
        }
    };


    const lbl = {
        upload: language === 'ta' ? 'படம் / PDF' : 'Upload Report',
        manual: language === 'ta' ? 'கைமுறை' : 'Manual Entry',
        pickImg: language === 'ta' ? '📷 படம்' : '📷 Image',
        pickPdf: language === 'ta' ? '📄 PDF' : '📄 PDF',
        analyzing: language === 'ta' ? 'AI பகுப்பாய்கிறது...' : 'AI is analyzing...',
        parsing: language === 'ta' ? 'AI மொழிபெயர்க்கிறது...' : 'AI is translating...',
        extracted: language === 'ta' ? '✅ AI பிரித்தெடுத்த மதிப்புகள்' : '✅ AI-Extracted Values',
        noData: language === 'ta' ? 'மதிப்புகள் எதுவும் பிரித்தெடுக்கப்படவில்லை' : 'No values found in report',
        submit: language === 'ta' ? 'சமர்ப்பி & பகுப்பாய்' : 'Submit & Analyze',
        submitting: language === 'ta' ? 'AI பகுப்பாய்கிறது...' : 'AI is analyzing...',
        result: language === 'ta' ? '🧠 AI ஆலோசனை' : '🧠 AI Recommendation',
        reenter: language === 'ta' ? 'மீண்டும் உள்ளிட' : 'Enter new data',
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    <Text style={[styles.title, { color: theme.text }]}>{t('entry_title')}</Text>


                    {!isDone && (
                        <View style={[styles.modeToggle, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                            {[MODE.UPLOAD, MODE.MANUAL].map((m) => {
                                const active = mode === m;
                                let iconName = 'create';
                                if (m === MODE.UPLOAD) iconName = 'cloud-upload';
                                return (
                                    <TouchableOpacity
                                        key={m}
                                        onPress={() => switchMode(m)}
                                        style={[styles.modeBtn, active && { backgroundColor: theme.primary, borderRadius: BorderRadius.lg }]}
                                        activeOpacity={0.85}
                                    >
                                        <Ionicons
                                            name={iconName}
                                            size={16}
                                            color={active ? '#fff' : theme.textSecondary}
                                        />
                                        <Text style={[styles.modeBtnText, { color: active ? '#fff' : theme.textSecondary }]}>
                                            {m === MODE.UPLOAD ? lbl.upload : lbl.manual}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}


                    {mode === MODE.UPLOAD && !isDone && (
                        <View style={[styles.card, { backgroundColor: `${theme.primary}08`, borderColor: `${theme.primary}25` }]}>


                            {!isAnalyzing && (
                                <View style={styles.pickRow}>
                                    <TouchableOpacity onPress={pickImage} style={[styles.pickBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
                                        <Ionicons name="image" size={18} color="#fff" />
                                        <Text style={styles.pickBtnText}>{lbl.pickImg}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={pickDocument} style={[styles.pickBtn, { backgroundColor: theme.accent }]} activeOpacity={0.85}>
                                        <Ionicons name="document-text" size={18} color="#fff" />
                                        <Text style={styles.pickBtnText}>{lbl.pickPdf}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}


                            {isAnalyzing && (
                                <View style={styles.analyzeRow}>
                                    <ActivityIndicator color={theme.primary} size="small" />
                                    <Text style={[styles.analyzeText, { color: theme.primary }]}>{lbl.analyzing}</Text>
                                </View>
                            )}


                            {reportUri && !isAnalyzing && (
                                <Image source={{ uri: reportUri }} style={[styles.preview, { borderColor: theme.border }]} resizeMode="cover" />
                            )}
                        </View>
                    )}


                    {(mode === MODE.UPLOAD) && extractedData && !isAnalyzing && !isDone && (
                        <View style={[styles.extractedBox, { backgroundColor: theme.surface, borderColor: theme.risk.low }]}>
                            <View style={styles.extractedHeader}>
                                <Ionicons name="checkmark-circle" size={16} color={theme.risk.low} />
                                <Text style={[styles.extractedTitle, { color: theme.risk.low }]}>{lbl.extracted}</Text>
                            </View>
                            {[
                                { label: 'BP', value: bp, icon: 'fitness' },
                                { label: language === 'ta' ? 'இர. சர்க்கரை' : 'Blood Sugar', value: sugar, icon: 'water' },
                                { label: language === 'ta' ? 'இதய துடிப்பு' : 'Heart Rate', value: heartRate, icon: 'heart' },
                            ].filter(f => f.value).map((f, i) => (
                                <View key={i} style={styles.extractedRow}>
                                    <Ionicons name={f.icon} size={14} color={theme.textMuted} />
                                    <Text style={[styles.extractedLabel, { color: theme.textSecondary }]}>{f.label}</Text>
                                    <Text style={[styles.extractedValue, { color: theme.text }]}>{f.value}</Text>
                                </View>
                            ))}
                            {extractedData.notes ? (
                                <Text style={[styles.extractedNote, { color: theme.textMuted }]}>💬 {extractedData.notes}</Text>
                            ) : null}
                            {!bp && !sugar && !heartRate && (
                                <Text style={[styles.extractedNote, { color: theme.textMuted }]}>{lbl.noData}</Text>
                            )}
                        </View>
                    )}


                    {(mode === MODE.UPLOAD) && errorMsg && !isDone ? (
                        <Text style={[styles.errorText, { color: theme.risk.high }]}>{errorMsg}</Text>
                    ) : null}


                    {mode === MODE.MANUAL && !isDone && (
                        <View style={[styles.card, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
                            <InputRow icon="fitness" label={t('entry_bp')}
                                value={bp} onChangeText={setBp}
                                placeholder={t('entry_bp_placeholder')} theme={theme} />
                            <InputRow icon="water" label={t('entry_sugar')}
                                value={sugar} onChangeText={setSugar}
                                placeholder={t('entry_sugar_placeholder')} keyboardType="numeric" theme={theme} />
                            <InputRow icon="heart" label={t('entry_heart_rate')}
                                value={heartRate} onChangeText={setHeartRate}
                                placeholder={t('entry_heart_rate_placeholder')} keyboardType="numeric" theme={theme} />

                            {errorMsg ? (
                                <Text style={[styles.errorText, { color: theme.risk.high }]}>{errorMsg}</Text>
                            ) : null}
                        </View>
                    )}


                    {!isDone && (
                        <View style={[styles.medRow, { backgroundColor: theme.surface, borderColor: theme.border, ...theme.cardShadow }]}>
                            <View style={[styles.medIcon, { backgroundColor: `${theme.accent}18` }]}>
                                <Ionicons name="medical" size={18} color={theme.accent} />
                            </View>
                            <Text style={[styles.medLabel, { color: theme.text }]}>{t('entry_medication')}</Text>
                            <Switch value={medTaken} onValueChange={setMedTaken}
                                trackColor={{ false: theme.border, true: theme.accent }}
                                thumbColor="#fff" />
                        </View>
                    )}


                    {!isDone && (
                        <TouchableOpacity
                            onPress={handleSubmit}
                            style={[styles.submitBtn, { backgroundColor: theme.primary, opacity: isAnalyzing ? 0.6 : 1 }]}
                            activeOpacity={0.85}
                            disabled={isAnalyzing || isSubmitting}
                        >
                            {isSubmitting
                                ? <><ActivityIndicator color="#fff" size="small" /><Text style={styles.submitText}>{lbl.submitting}</Text></>
                                : <><Ionicons name="analytics" size={20} color="#fff" /><Text style={styles.submitText}>{lbl.submit}</Text></>
                            }
                        </TouchableOpacity>
                    )}


                    {isDone && (
                        <View style={styles.resultBlock}>
                            <Text style={[styles.resultTitle, { color: theme.text }]}>{t('entry_updated_risk')}</Text>

                            <View style={[styles.resultCard, { backgroundColor: theme.surface, ...theme.cardShadow }]}>
                                <RiskScoreCard score={newRisk} level={newRisk >= 70 ? 'high' : 'medium'} trend="stable" />
                            </View>


                            <View style={[styles.feedbackCard, {
                                backgroundColor: `${theme.primary}09`,
                                borderColor: `${theme.primary}25`, borderWidth: 1,
                            }]}>
                                <View style={styles.feedbackHeader}>
                                    <Ionicons name="sparkles" size={18} color={theme.primary} />
                                    <Text style={[styles.feedbackTitle, { color: theme.text }]}>{lbl.result}</Text>
                                    <VoiceButton text={aiFeedback} compact />
                                </View>
                                <Text style={[styles.feedbackText, { color: theme.textSecondary }]}>{aiFeedback}</Text>
                            </View>


                            <TouchableOpacity
                                onPress={() => {
                                    setStep(STEP.IDLE); setAiFeedback(''); setNewRisk(null);
                                    setReportUri(null); setExtractedData(null);
                                    setBp(''); setSugar(''); setHeartRate('');
                                    setMode(MODE.UPLOAD);
                                }}
                                style={[styles.reenterBtn, { borderColor: theme.primary }]}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="refresh" size={18} color={theme.primary} />
                                <Text style={[styles.reenterText, { color: theme.primary }]}>{lbl.reenter}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function InputRow({ icon, label, value, onChangeText, placeholder, keyboardType = 'default', theme }) {
    return (
        <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{label}</Text>
            <View style={[styles.inputWrap, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
                <Ionicons name={icon} size={18} color={theme.textMuted} />
                <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={value} onChangeText={onChangeText}
                    placeholder={placeholder} placeholderTextColor={theme.textMuted}
                    keyboardType={keyboardType}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    kav: { flex: 1 },
    scroll: { padding: Spacing.xl, paddingBottom: Spacing.section, gap: Spacing.xl },
    title: { fontSize: Typography.fontSizes.xxl, fontWeight: Typography.fontWeights.bold },


    modeToggle: { flexDirection: 'row', borderRadius: BorderRadius.xl, borderWidth: 1, padding: 4, gap: 4 },
    modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
    modeBtnText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semiBold },


    card: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.xl, gap: Spacing.lg },


    pickRow: { flexDirection: 'row', gap: Spacing.md },
    pickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 52, borderRadius: BorderRadius.lg },
    pickBtnText: { color: '#fff', fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semiBold },
    analyzeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
    analyzeText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.medium },
    preview: { width: '100%', height: 130, borderRadius: BorderRadius.lg, borderWidth: 1 },


    extractedBox: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.md, gap: 6 },
    extractedHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    extractedTitle: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.semiBold },
    extractedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    extractedLabel: { flex: 1, fontSize: Typography.fontSizes.sm },
    extractedValue: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.bold },
    extractedNote: { fontSize: Typography.fontSizes.xs, marginTop: 4 },


    inputGroup: { gap: Spacing.xs },
    inputLabel: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.medium },
    inputWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: Spacing.md, height: 50 },
    input: { flex: 1, fontSize: Typography.fontSizes.md },


    medRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1 },
    medIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    medLabel: { flex: 1, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.medium },


    submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 54, borderRadius: BorderRadius.lg },
    submitText: { color: '#fff', fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.semiBold },
    errorText: { fontSize: Typography.fontSizes.sm, fontWeight: Typography.fontWeights.medium },


    resultBlock: { gap: Spacing.xl },
    resultTitle: { fontSize: Typography.fontSizes.lg, fontWeight: Typography.fontWeights.bold, textAlign: 'center' },
    resultCard: { borderRadius: BorderRadius.xl, padding: Spacing.xxl, alignItems: 'center' },
    feedbackCard: { borderRadius: BorderRadius.lg, padding: Spacing.xl, gap: Spacing.md },
    feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    feedbackTitle: { flex: 1, fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semiBold },
    feedbackText: { fontSize: Typography.fontSizes.sm, lineHeight: 23 },
    reenterBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 48, borderRadius: BorderRadius.lg, borderWidth: 1.5 },
    reenterText: { fontSize: Typography.fontSizes.md, fontWeight: Typography.fontWeights.semiBold },
});
