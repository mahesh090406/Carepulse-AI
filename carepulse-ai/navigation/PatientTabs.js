import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import PatientDashboard from '../screens/patient/PatientDashboard';
import HealthEntry from '../screens/patient/HealthEntry';
import HealthTrends from '../screens/patient/HealthTrends';
import PatientProfile from '../screens/patient/PatientProfile';
import HealthTimelineScreen from '../screens/HealthTimelineScreen';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const Tab = createBottomTabNavigator();

export default function PatientTabs() {
    const { theme } = useTheme();
    const { t } = useLanguage();

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
                tabBarIcon: ({ focused, color }) => {
                    let iconName;
                    if (route.name === 'PatDashboard') iconName = focused ? 'heart' : 'heart-outline';
                    else if (route.name === 'LogHealth') iconName = focused ? 'add-circle' : 'add-circle-outline';
                    else if (route.name === 'Trends') iconName = focused ? 'trending-up' : 'trending-up-outline';
                    else if (route.name === 'Timeline') iconName = focused ? 'time' : 'time-outline';
                    else if (route.name === 'PatProfile') iconName = focused ? 'person' : 'person-outline';
                    return <Ionicons name={iconName} size={22} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="PatDashboard"
                component={PatientDashboard}
                options={{ tabBarLabel: t('tab_dashboard') }}
            />
            <Tab.Screen
                name="LogHealth"
                component={HealthEntry}
                options={{ tabBarLabel: t('tab_log') }}
            />
            <Tab.Screen
                name="Trends"
                component={HealthTrends}
                options={{ tabBarLabel: t('tab_trends') }}
            />
            <Tab.Screen
                name="Timeline"
                component={HealthTimelineScreen}
                options={{ tabBarLabel: t('tab_timeline') }}
            />
            <Tab.Screen
                name="PatProfile"
                component={PatientProfile}
                options={{ tabBarLabel: t('tab_profile') }}
            />
        </Tab.Navigator>
    );
}
