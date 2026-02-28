
export const Colors = {
    
    primary: '#1A6FDB',
    primaryLight: '#4A8FFF',
    primaryDark: '#0D4DA1',
    accent: '#00C9A7',

   
    risk: {
        low: '#27AE60',
        medium: '#F39C12',
        high: '#E74C3C',
        critical: '#C0392B',
    },

   
    success: '#27AE60',
    warning: '#F39C12',
    danger: '#E74C3C',
    info: '#2980B9',

    
    white: '#FFFFFF',
    black: '#000000',
    gray100: '#F5F6FA',
    gray200: '#E8EBF0',
    gray300: '#D1D5DE',
    gray400: '#9BA3B5',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
};

export const LightTheme = {
    dark: false,
    background: Colors.gray100,
    surface: Colors.white,
    surfaceAlt: Colors.gray200,
    text: Colors.gray900,
    textSecondary: Colors.gray600,
    textMuted: Colors.gray400,
    border: Colors.gray200,
    primary: Colors.primary,
    primaryLight: Colors.primaryLight,
    accent: Colors.accent,
    cardShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    risk: Colors.risk,
    tabBar: Colors.white,
    tabBarActive: Colors.primary,
    tabBarInactive: Colors.gray400,
    header: Colors.white,
    headerText: Colors.gray900,
    inputBg: Colors.white,
    inputBorder: Colors.gray300,
    badge: Colors.gray200,
};

export const DarkTheme = {
    dark: true,
    background: '#0F1117',
    surface: '#1A1F2E',
    surfaceAlt: '#252B3B',
    text: '#F0F4FF',
    textSecondary: '#9BA3B5',
    textMuted: '#6B7280',
    border: '#2D3448',
    primary: Colors.primaryLight,
    primaryLight: Colors.primaryLight,
    accent: Colors.accent,
    cardShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    risk: Colors.risk,
    tabBar: '#1A1F2E',
    tabBarActive: Colors.primaryLight,
    tabBarInactive: '#6B7280',
    header: '#1A1F2E',
    headerText: '#F0F4FF',
    inputBg: '#252B3B',
    inputBorder: '#2D3448',
    badge: '#252B3B',
};

export const Typography = {
    fontSizes: {
        xs: 11,
        sm: 13,
        md: 15,
        lg: 17,
        xl: 20,
        xxl: 24,
        xxxl: 32,
        display: 48,
    },
    fontWeights: {
        regular: '400',
        medium: '500',
        semiBold: '600',
        bold: '700',
        extraBold: '800',
    },
    lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    section: 40,
};

export const BorderRadius = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    xxl: 28,
    full: 9999,
};
