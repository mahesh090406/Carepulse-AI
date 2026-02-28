import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DoctorDashboard from '../screens/doctor/DoctorDashboard';
import PatientList from '../screens/doctor/PatientList';
import AlertsScreen from '../screens/doctor/AlertsScreen';
import DoctorProfile from '../screens/doctor/DoctorProfile';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAlerts } from '../context/AlertContext';
import { ALERTS } from '../constants/dummyData';

const Tab = createBottomTabNavigator();

export default function DoctorTabs() {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const { alerts } = useAlerts();
    const totalAlerts = alerts.length + ALERTS.length;
    const alertBadge = totalAlerts > 0 ? totalAlerts : undefined;

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.tabBar,
                    borderTopColor: theme.border,
                    borderTopWidth: 1,
                    height: 62,
                    paddingBottom: 8,
                    paddingTop: 4,
                },
                tabBarActiveTintColor: theme.tabBarActive,
                tabBarInactiveTintColor: theme.tabBarInactive,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'DocDashboard') iconName = focused ? 'grid' : 'grid-outline';
                    else if (route.name === 'Patients') iconName = focused ? 'people' : 'people-outline';
                    else if (route.name === 'Alerts') iconName = focused ? 'notifications' : 'notifications-outline';
                    else if (route.name === 'DocProfile') iconName = focused ? 'person' : 'person-outline';
                    return <Ionicons name={iconName} size={22} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="DocDashboard"
                component={DoctorDashboard}
                options={{ tabBarLabel: t('tab_dashboard') }}
            />
            <Tab.Screen
                name="Patients"
                component={PatientList}
                options={{ tabBarLabel: t('tab_patients') }}
            />
            <Tab.Screen
                name="Alerts"
                component={AlertsScreen}
                options={{
                    tabBarLabel: t('tab_alerts'),
                    tabBarBadge: alertBadge,
                    tabBarBadgeStyle: { backgroundColor: '#E74C3C', color: '#fff', fontSize: 10 },
                }}
            />
            <Tab.Screen
                name="DocProfile"
                component={DoctorProfile}
                options={{ tabBarLabel: t('tab_profile') }}
            />
        </Tab.Navigator>
    );
}
