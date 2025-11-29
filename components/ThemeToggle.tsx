import React from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing } from '@/constants/theme';

export function ThemeToggle() {
    const { isDark, toggleTheme, colorScheme } = useTheme();
    const [rotateAnim] = React.useState(new Animated.Value(0));

    const handleToggle = () => {
        // Animate icon rotation
        Animated.spring(rotateAnim, {
            toValue: isDark ? 0 : 1,
            useNativeDriver: true,
            friction: 8,
        }).start();

        toggleTheme();
    };

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: colorScheme.surface }]}
            onPress={handleToggle}
            activeOpacity={0.7}
        >
            <Animated.View style={{ transform: [{ rotate }] }}>
                <MaterialIcons
                    name={isDark ? 'wb-sunny' : 'nightlight-round'}
                    size={24}
                    color={colorScheme.textPrimary}
                />
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
});
