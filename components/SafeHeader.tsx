import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useDrawer } from '@/contexts/DrawerContext';
import { Spacing, Typography, Layout } from '@/constants/theme';

interface SafeHeaderProps {
    title?: string;
    showBack?: boolean;
    showMenu?: boolean;
    onBackPress?: () => void;
    rightComponent?: React.ReactNode;
    backIconName?: string;
}

export function SafeHeader({
    title,
    showBack = false,
    showMenu = false,
    onBackPress,
    rightComponent,
    backIconName,
}: SafeHeaderProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colorScheme, isDark } = useTheme();
    const { openDrawer } = useDrawer();

    const handleBackPress = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(tabs)/dashboard');
            }
        }
    };

    return (
        <View
            style={[
                styles.container,
                {
                    paddingTop: insets.top,
                    backgroundColor: isDark ? colorScheme.surface : colorScheme.primary,
                    borderBottomColor: isDark ? colorScheme.border : colorScheme.primary,
                },
            ]}
        >
            <View style={styles.content}>
                {/* Left Side - Menu or Back Button */}
                <View style={styles.leftContainer}>
                    {showMenu ? (
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={openDrawer}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialIcons
                                name="menu"
                                size={24}
                                color="#FFFFFF"
                            />
                        </TouchableOpacity>
                    ) : showBack ? (
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBackPress}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialIcons
                                name={backIconName || "arrow-back"}
                                size={24}
                                color="#FFFFFF"
                            />
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Center - Title */}
                <View style={styles.centerContainer}>
                    {title && (
                        <Text
                            style={[styles.title, { color: '#FFFFFF' }]}
                            numberOfLines={1}
                        >
                            {title}
                        </Text>
                    )}
                </View>

                {/* Right Side - Custom Component */}
                <View style={styles.rightContainer}>
                    {rightComponent}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 1,
    },
    content: {
        height: Layout.headerHeight,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
    },
    leftContainer: {
        width: 40,
        justifyContent: 'center',
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightContainer: {
        width: 60,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    backButton: {
        padding: Spacing.xs,
    },
    title: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        textAlign: 'center',
    },
});
