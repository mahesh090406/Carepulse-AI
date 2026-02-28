import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, StyleSheet, Linking, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { parseVoiceInput } from '../../services/geminiService';
import { PATIENT_USER } from '../../constants/dummyData';

const WA_GREEN = '#075E54';
const WA_LIGHT = '#DCF8C6';

export default function WhatsAppSimulator({ navigation }) {
    const { theme } = useTheme();
    const { language } = useLanguage();
    const scrollViewRef = useRef();

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const isTa = language === 'ta';

    useEffect(() => {
        
        setTimeout(() => {
            const greeting = isTa
                ? `வணக்கம் ${PATIENT_USER.nameTa}, நான் *Govt Health Bot*.\nஇன்று உங்கள் சர்க்கரை அளவு மற்றும் ரத்த அழுத்தத்தை பதிவு செய்யலாமா?`
                : `Hello ${PATIENT_USER.name}, I am the *Govt Health Bot*.\nCan we log your blood sugar and blood pressure for today?`;

            setMessages([{ id: 1, text: greeting, sender: 'bot', time: new Date() }]);
        }, 500);
    }, [isTa]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsg = { id: Date.now(), text: inputText, sender: 'user', time: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

      
        setTimeout(async () => {
            try {
                
                let extracted = { intent: "unknown", replyText: null, systolicBP: null, diastolicBP: null, bloodSugar: null, heartRate: null, medTaken: null };
                try {
                    extracted = await parseVoiceInput(userMsg.text, language);
                } catch (parseErr) {
                    console.log("Gemini parse failed:", parseErr);
                }

                let response = "";

        
                if (extracted?.replyText && extracted.intent !== "log_vitals") {
                    response = extracted.replyText;
                }
               
                else if (extracted?.intent === "log_vitals" || extracted?.systolicBP || extracted?.bloodSugar || extracted?.heartRate || extracted?.medTaken !== null) {
                    response = isTa ? "நன்றி. உங்கள் தரவு பதிவு செய்யப்பட்டது:\n" : "Thank you. Your data is logged:\n";

                    if (extracted?.systolicBP && extracted?.diastolicBP) {
                        response += `• BP: ${extracted.systolicBP}/${extracted.diastolicBP} mmHg\n`;
                    }
                    if (extracted?.bloodSugar) {
                        response += `• Sugar: ${extracted.bloodSugar} mg/dL\n`;
                    }
                    if (extracted?.heartRate) {
                        response += `• Heart Rate: ${extracted.heartRate} bpm\n`;
                    }
                    if (extracted?.medTaken !== null && extracted?.medTaken !== undefined) {
                        response += `• Medicine: ${extracted.medTaken ? 'Yes' : 'No'}\n`;
                    }
                }
              
                else {
                    response = isTa
                        ? "மன்னிக்கவும், எனக்குப் புரியவில்லை. நான் ஒரு AI உதவியாளர் மட்டுமே."
                        : "Sorry, I didn't understand that. I am a health assistant bot.";
                }

                const isEmergency = extracted?.intent === 'emergency';

                setMessages(prev => [...prev, {
                    id: Date.now(),
                    text: response.trim(),
                    sender: 'bot',
                    time: new Date(),
                    isEmergency: isEmergency
                }]);
            } catch (e) {
                console.error("Critical WhatsApp Bot Error:", e);
                setMessages(prev => [...prev, { id: Date.now(), text: isTa ? "பிழை ஏற்பட்டது." : "An error occurred handling your request.", sender: 'bot', time: new Date() }]);
            } finally {
                setIsTyping(false);
            }
        }, 1500);
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const openRealWhatsApp = async () => {
        
        const botNumber = "919876543210";
        const message = isTa ? "வணக்கம், எனது பரிசோதனை விவரங்களை பதிவு செய்ய வேண்டும்." : "Hi, I would like to log my health vitals.";

        const url = `whatsapp://send?phone=${botNumber}&text=${encodeURIComponent(message)}`;

        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                Alert.alert("WhatsApp not installed", "Please install WhatsApp to use this feature.");
            }
        } catch (error) {
            console.error("Error opening WhatsApp:", error);
            Alert.alert("Error", "Could not open WhatsApp.");
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
           
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Govt Health Bot</Text>
                    <Text style={styles.headerSubtitle}>online</Text>
                </View>
                <TouchableOpacity onPress={openRealWhatsApp} style={{ padding: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1EBEA5', borderRadius: 20, paddingHorizontal: 12 }}>
                    <Ionicons name="logo-whatsapp" size={16} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Open App</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
               
                <ScrollView
                    style={styles.chatArea}
                    contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
                    ref={scrollViewRef}
                    onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
                >
                    <View style={styles.encryptionNotice}>
                        <Ionicons name="lock-closed" size={12} color="#F3C34B" />
                        <Text style={styles.encryptionText}>
                            Messages are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
                        </Text>
                    </View>

                    {messages.map(msg => (
                        <View key={msg.id} style={[
                            styles.messageBubble,
                            msg.sender === 'user' ? styles.userBubble : styles.botBubble,
                            msg.isEmergency && { backgroundColor: '#ffebe6', borderColor: '#ff4d4f', borderWidth: 1 }
                        ]}>
                            {msg.isEmergency && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                    <Ionicons name="warning-outline" size={16} color="#ff4d4f" style={{ marginRight: 4 }} />
                                    <Text style={{ color: '#ff4d4f', fontSize: 12, fontWeight: 'bold' }}>CRITICAL ALERT</Text>
                                </View>
                            )}
                            <Text style={[styles.messageText, msg.isEmergency && { color: '#cf1322' }]}>{msg.text}</Text>
                            <Text style={[styles.timeText, msg.isEmergency && { color: '#ff4d4f' }]}>
                                {formatTime(msg.time)}
                                {msg.sender === 'user' && <Ionicons name="checkmark-done" size={14} color="#34B7F1" style={{ marginLeft: 4 }} />}
                            </Text>
                        </View>
                    ))}

                    {isTyping && (
                        <View style={[styles.messageBubble, styles.botBubble, { width: 60 }]}>
                            <Text style={styles.messageText}>...</Text>
                        </View>
                    )}
                </ScrollView>

                
                <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
                    <TouchableOpacity style={styles.attachBtn}>
                        <Ionicons name="add" size={28} color="#007AFF" />
                    </TouchableOpacity>
                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                        placeholder={isTa ? "செய்தியை உள்ளிடவும்..." : "Message Health Bot..."}
                        placeholderTextColor={theme.textMuted}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    {inputText.trim() ? (
                        <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
                            <Ionicons name="send" size={16} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.sendBtnVoice}>
                            <Ionicons name="mic" size={20} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#E5DDD5' },
    header: {
        backgroundColor: WA_GREEN,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
    },
    headerTitleContainer: { flex: 1, marginLeft: 10 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    headerSubtitle: { color: '#E0E0E0', fontSize: 12 },
    kav: { flex: 1 },
    chatArea: { flex: 1 },
    encryptionNotice: {
        backgroundColor: '#FCF3C3',
        padding: 8,
        borderRadius: 8,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        width: '90%',
    },
    encryptionText: { color: '#544A43', fontSize: 11, textAlign: 'center', marginLeft: 5, flex: 1 },
    messageBubble: {
        maxWidth: '80%', padding: 10, borderRadius: 10, marginBottom: 10,
    },
    userBubble: {
        alignSelf: 'flex-end', backgroundColor: WA_LIGHT, borderTopRightRadius: 0,
    },
    botBubble: {
        alignSelf: 'flex-start', backgroundColor: '#fff', borderTopLeftRadius: 0,
    },
    messageText: { fontSize: 15, color: '#000' },
    timeText: { fontSize: 11, color: '#888', alignSelf: 'flex-end', marginTop: 4 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'flex-end', padding: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    },
    attachBtn: { padding: 4, marginRight: 4, marginBottom: 4 },
    input: {
        flex: 1, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1,
        paddingHorizontal: 15, paddingVertical: 10, paddingTop: 10, minHeight: 40, maxHeight: 100, fontSize: 15,
    },
    sendBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF',
        alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginBottom: 4,
    },
    sendBtnVoice: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#128C7E',
        alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginBottom: 4,
    },
});
