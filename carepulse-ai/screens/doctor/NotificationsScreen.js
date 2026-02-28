import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, FlatList,
    Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAlerts } from '../../context/AlertContext';
import { BorderRadius, Typography, Spacing } from '../../constants/theme';
import { ALERTS, PATIENTS } from '../../constants/dummyData';

const TYPE_CONFIG = {
    critical: { icon: 'warning', color: '#E74C3C', label: 'Critical', labelTa: 'அபாயம்' },
    deteriorating: { icon: 'trending-up', color: '#F39C12', label: 'Deteriorating', labelTa: 'மோசமடைகிறது' },
    non_adherent: { icon: 'medical', color: '#2980B9', label: 'Non-Adherent', labelTa: 'மருந்து இல்லை' },
    iot_spike: { icon: 'wifi', color: '#E74C3C', label: 'IoT Spike', labelTa: 'IoT அலர்ட்' },
};

function NotifItem({ item, onMarkRead, onDelete, onPress, theme }) {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.deteriorating;
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.notifCard,
                {
                    backgroundColor: item.read ? theme.surface : `${cfg.color}08`,
                    borderLeftColor: cfg.color,
                    borderColor: theme.border,
                    opacity: item.read ? 0.65 : 1,
                }
            ]}
            activeOpacity={0.8}
        >
            <View style={[styles.notifIcon, { backgroundColor: `${cfg.color}20` }]}>
                <Ionicons name={cfg.icon} size={18} color={cfg.color} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>{item.patientName}</Text>
                    {!item.read && <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: cfg.color }} />}
                </View>
                <Text style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 17 }}>{item.message}</Text>
                <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{item.time}</Text>
            </View>
            <View style={{ gap: 6 }}>
                {!item.read && (
                    <TouchableOpacity onPress={() => onMarkRead(item.id)}
                        style={[styles.actionBtn, { backgroundColor: `${theme.primary}15` }]}>
                        <Ionicons name="checkmark-done" size={14} color={theme.primary} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => onDelete(item.id)}
                    style={[styles.actionBtn, { backgroundColor: '#E74C3C15' }]}>
                    <Ionicons name="trash-outline" size={14} color="#E74C3C" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

export default function NotificationsScreen({ navigation }) {
    const { theme } = useTheme();
    const { language } = useLanguage();
    const { alerts: dynamicAlerts, clearAlert, clearAll } = useAlerts();
    const isTa = language === 'ta';

    // Merge static + dynamic, with read state
    const [staticAlerts, setStaticAlerts] = useState(
        ALERTS.map(a => ({ ...a, read: false, isDynamic: false }))
    );
    const [dynamicRead, setDynamicRead] = useState({});
    const [dynamicDeleted, setDynamicDeleted] = useState({});

    const dynamicItems = dynamicAlerts
        .filter(a => !dynamicDeleted[a.id])
        .map(a => ({ ...a, read: !!dynamicRead[a.id], isDynamic: true }));

    const allItems = [...dynamicItems, ...staticAlerts];
    const unreadCount = allItems.filter(a => !a.read).length;

    const handleMarkRead = (id) => {
        const isStatic = staticAlerts.some(a => a.id === id);
        if (isStatic) {
            setStaticAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
        } else {
            setDynamicRead(prev => ({ ...prev, [id]: true }));
        }
    };

    const handleMarkAllRead = () => {
        setStaticAlerts(prev => prev.map(a => ({ ...a, read: true })));
        const allDynamic = {};
        dynamicAlerts.forEach(a => allDynamic[a.id] = true);
        setDynamicRead(allDynamic);
    };

    const handleDelete = (id) => {
        const isStatic = staticAlerts.some(a => a.id === id);
        if (isStatic) {
            setStaticAlerts(prev => prev.filter(a => a.id !== id));
        } else {
            setDynamicDeleted(prev => ({ ...prev, [id]: true }));
            clearAlert(id);
        }
    };

    const handleClearAll = () => {
        Alert.alert(
            isTa ? 'அனைத்தையும் நீக்கவா?' : 'Clear All Notifications?',
            isTa ? 'இது மீட்டெடுக்க முடியாது.' : 'This cannot be undone.',
            [
                { text: isTa ? 'ரத்து' : 'Cancel', style: 'cancel' },
                {
                    text: isTa ? 'நீக்கு' : 'Clear All', style: 'destructive',
                    onPress: () => { setStaticAlerts([]); clearAll(); },
                },
            ]
        );
    };

    const handlePress = (item) => {
        const patient = PATIENTS.find(p => p.id === item.patientId);
        if (patient) {
            handleMarkRead(item.id);
            navigation.navigate('PatientDetail', { patient });
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: theme.text }]}>
                        {isTa ? 'அறிவிப்புகள்' : 'Notifications'}
                    </Text>
                    {unreadCount > 0 && (
                        <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                            {unreadCount} {isTa ? 'படிக்காதவை' : 'unread'}
                        </Text>
                    )}
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {unreadCount > 0 && (
                        <TouchableOpacity onPress={handleMarkAllRead}
                            style={[styles.headerAction, { backgroundColor: `${theme.primary}15` }]}>
                            <Ionicons name="checkmark-done-outline" size={16} color={theme.primary} />
                            <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '600' }}>
                                {isTa ? 'அனைத்தும் படி' : 'All Read'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    {allItems.length > 0 && (
                        <TouchableOpacity onPress={handleClearAll}
                            style={[styles.headerAction, { backgroundColor: '#E74C3C15' }]}>
                            <Ionicons name="trash-outline" size={16} color="#E74C3C" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {allItems.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Ionicons name="notifications-off-outline" size={52} color={theme.textMuted} />
                    <Text style={{ color: theme.textMuted, fontSize: 15, marginTop: 12 }}>
                        {isTa ? 'எந்த அறிவிப்பும் இல்லை' : 'No notifications'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={allItems}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm }}
                    renderItem={({ item }) => (
                        <NotifItem
                            item={item}
                            theme={theme}
                            onMarkRead={handleMarkRead}
                            onDelete={handleDelete}
                            onPress={() => handlePress(item)}
                        />
                    )}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    title: { fontSize: 18, fontWeight: '800' },
    headerAction: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
    },
    notifCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        padding: 14, borderRadius: BorderRadius.lg,
        borderLeftWidth: 4, borderWidth: 1,
    },
    notifIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    actionBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
