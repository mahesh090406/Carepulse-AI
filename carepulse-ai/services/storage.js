
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

const KEYS = {
    HEALTH_LOGS: 'carepulse_health_logs',
};



/**
 * 
 * @returns {Promise<Array>} 
 */
export async function loadHealthLogs() {
    try {
        const raw = await AsyncStorage.getItem(KEYS.HEALTH_LOGS);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.warn('[Storage] Failed to load health logs:', e);
        return [];
    }
}

/**
 * 
 * @param {object} entry  
 * @returns {Promise<Array>} 
 */
export async function saveHealthLog(entry) {
    try {
       
        const netInfo = await Network.getNetworkStateAsync();
        const isOffline = !netInfo.isConnected;

        const newEntry = {
            ...entry,
            isOfflineCalculated: isOffline,
            pendingSync: isOffline,
        };

        const existing = await loadHealthLogs();
        const updated = [newEntry, ...existing];
        await AsyncStorage.setItem(KEYS.HEALTH_LOGS, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.warn('[Storage] Failed to save health log:', e);
        return [];
    }
}

/**
 * 
 * @returns {Promise<number>} 
 */
export async function syncOfflineLogs() {
    try {
        const netInfo = await Network.getNetworkStateAsync();
        if (!netInfo.isConnected) return 0;

        const existing = await loadHealthLogs();
        const pending = existing.filter(e => e.pendingSync);
        if (pending.length === 0) return 0;

        
        await new Promise(r => setTimeout(r, 1200));

        const updated = existing.map(e =>
            e.pendingSync ? { ...e, pendingSync: false, syncedAt: new Date().toISOString() } : e
        );

        await AsyncStorage.setItem(KEYS.HEALTH_LOGS, JSON.stringify(updated));
        return pending.length;
    } catch (e) {
        console.warn('[Storage] Failed to sync offline logs:', e);
        return 0;
    }
}

/**
 * 
 */
export async function clearHealthLogs() {
    try {
        await AsyncStorage.removeItem(KEYS.HEALTH_LOGS);
    } catch (e) {
        console.warn('[Storage] Failed to clear health logs:', e);
    }
}
