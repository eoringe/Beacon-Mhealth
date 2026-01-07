import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography } from '@/constants/theme';

interface CustomLoadingProps {
    size?: number;
    color?: string;
    text?: string;
}

export const CustomLoading = ({ size = 40, color, text }: CustomLoadingProps) => {
    const { colorScheme } = useTheme();
    const primaryColor = color || colorScheme.primary;

    // Animation Values
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const startRotation = () => {
            rotateAnim.setValue(0);
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Standard Material deceleration curve
                    useNativeDriver: true,
                })
            ).start();
        };

        startRotation();
    }, [rotateAnim]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.spinner,
                    {
                        width: size,
                        height: size,
                        borderColor: `${primaryColor}30`, // Light track
                        borderTopColor: primaryColor, // Active segment
                        borderWidth: size / 10, // Proportional thickness
                        borderRadius: size / 2,
                        transform: [{ rotate: spin }],
                    },
                ]}
            />
            {text && (
                <Animated.Text
                    style={[
                        styles.text,
                        { color: colorScheme.textSecondary, marginTop: size / 2 }
                    ]}
                >
                    {text}
                </Animated.Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinner: {
        backgroundColor: 'transparent',
    },
    text: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
});
