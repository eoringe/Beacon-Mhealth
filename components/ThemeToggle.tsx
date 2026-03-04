import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing } from '@/constants/theme';

export function ThemeToggle() {
    const { isDark, toggleTheme, colorScheme } = useTheme();
    const anim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: isDark ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [isDark]);

    const rotate = anim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    // Sun fades in when dark (to show "switch to light"), moon fades in when light
    const sunOpacity = anim;
    const moonOpacity = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
    });

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: colorScheme.surface }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
        >
            <Animated.View style={{ transform: [{ rotate }] }}>
                <View style={styles.iconContainer}>
                    <Animated.View style={[styles.iconAbsolute, { opacity: sunOpacity }]}>
                        <MaterialIcons
                            name="wb-sunny"
                            size={24}
                            color={colorScheme.textPrimary}
                        />
                    </Animated.View>
                    <Animated.View style={[styles.iconAbsolute, { opacity: moonOpacity }]}>
                        <MaterialIcons
                            name="nightlight-round"
                            size={24}
                            color={colorScheme.textPrimary}
                        />
                    </Animated.View>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.sm,
    },
    iconContainer: {
        width: 24,
        height: 24,
    },
    iconAbsolute: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
});
