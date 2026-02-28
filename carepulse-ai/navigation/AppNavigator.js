import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashScreen from '../screens/SplashScreen';
import LanguageScreen from '../screens/LanguageScreen';
import RoleScreen from '../screens/RoleScreen';
import AuthScreen from '../screens/AuthScreen';
import DoctorTabs from './DoctorTabs';
import PatientTabs from './PatientTabs';
import PatientDetail from '../screens/doctor/PatientDetail';
import HealthTimelineScreen from '../screens/HealthTimelineScreen';
import WhatsAppSimulator from '../screens/patient/WhatsAppSimulator';
import VideoCallScreen from '../screens/patient/VideoCallScreen';
import NotificationsScreen from '../screens/doctor/NotificationsScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator
                    initialRouteName="Splash"
                    screenOptions={{ headerShown: false }}
                >
                    <Stack.Screen name="Splash" component={SplashScreen} />
                    <Stack.Screen name="Language" component={LanguageScreen} />
                    <Stack.Screen name="Role" component={RoleScreen} />
                    <Stack.Screen name="Auth" component={AuthScreen} />
                    <Stack.Screen name="DoctorTabs" component={DoctorTabs} />
                    <Stack.Screen name="PatientTabs" component={PatientTabs} />
                    <Stack.Screen
                        name="PatientDetail"
                        component={PatientDetail}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="HealthTimeline"
                        component={HealthTimelineScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="WhatsAppSimulator"
                        component={WhatsAppSimulator}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="VideoCall"
                        component={VideoCallScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Notifications"
                        component={NotificationsScreen}
                        options={{ headerShown: false }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}
