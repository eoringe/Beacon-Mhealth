import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Image,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { validatePassword, getPasswordStrength } from '@/utils/validation';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function AuthScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { login, loginWithGoogle, signup, loading, resendVerificationEmail, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('login');

    // Login state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Signup state
    const [fullName, setFullName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(null);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        try {
            const result = await login(email, password);

            if (result && result.requiresVerification) {
                Alert.alert(
                    'Email Not Verified',
                    'Please verify your email before logging in. Check your inbox for the verification link.',
                    [
                        {
                            text: 'Resend Email',
                            onPress: async () => {
                                try {
                                    await resendVerificationEmail();
                                    Alert.alert('Sent', 'Verification email sent! Please check your inbox.');
                                } catch (error) {
                                    Alert.alert('Error', 'Failed to send verification email: ' + error.message);
                                } finally {
                                    await logout();
                                }
                            }
                        },
                        {
                            text: 'Cancel',
                            onPress: async () => await logout(),
                            style: 'cancel'
                        }
                    ]
                );
                return;
            }

            router.replace('/(tabs)/dashboard');
        } catch (error) {
            Alert.alert('Login Failed', error.message);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await loginWithGoogle();
            if (result.success) {
                // Determine redirect based on user role/status if needed
                router.replace('/(tabs)/dashboard');
            }
        } catch (error) {
            Alert.alert('Google Login Failed', error.message);
        }
    };

    const handleSignup = async () => {
        if (!fullName || !signupEmail || !signupPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const passwordValidation = validatePassword(signupPassword);
        if (!passwordValidation.isValid) {
            Alert.alert('Weak Password', passwordValidation.errors.join('\n'));
            return;
        }

        if (signupPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        try {
            const result = await signup(signupEmail, signupPassword, fullName);
            Alert.alert('Success!', result.message, [
                { text: 'OK', onPress: () => setActiveTab('login') }
            ]);
        } catch (error) {
            Alert.alert('Signup Failed', error.message);
        }
    };

    const handlePasswordChange = (text) => {
        setSignupPassword(text);
        if (text) {
            setPasswordStrength(getPasswordStrength(text));
        } else {
            setPasswordStrength(null);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingView}
                >
                    <ScrollView
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.lg }]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header with Logo */}
                        <View style={styles.header}>
                            <Image
                                source={require('../../assets/images/beacon.jpg')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                            <Text style={styles.title}>Get Started now</Text>
                            <Text style={styles.subtitle}>Create an account or log in to explore</Text>
                        </View>

                        {/* Tab Switcher */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'login' && styles.activeTab]}
                                onPress={() => setActiveTab('login')}
                            >
                                <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
                                    Log In
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
                                onPress={() => setActiveTab('signup')}
                            >
                                <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>
                                    Sign Up
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Form Content */}
                        {activeTab === 'login' ? (
                            <Animated.View
                                key="login-form"
                                style={styles.form}
                                entering={FadeIn.duration(300)}
                                exiting={FadeOut.duration(150)}
                            >
                                {/* Email Input */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Email</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        placeholder="Enter your email"
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                {/* Password Input */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Password</Text>
                                    <View style={styles.passwordContainer}>
                                        <TextInput
                                            style={styles.passwordInput}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            placeholder="Enter your password"
                                            placeholderTextColor="#999"
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Feather
                                                name={showPassword ? "eye" : "eye-off"}
                                                size={18}
                                                color="#999"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Remember Me and Forgot Password */}
                                <View style={styles.optionsRow}>
                                    <TouchableOpacity
                                        style={styles.rememberMeContainer}
                                        onPress={() => setRememberMe(!rememberMe)}
                                    >
                                        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                                            {rememberMe && <MaterialIcons name="check" size={14} color="#FFFFFF" />}
                                        </View>
                                        <Text style={styles.rememberMeText}>Remember me</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity>
                                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Login Button */}
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleLogin}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Log In</Text>
                                    )}
                                </TouchableOpacity>

                                {/* Or login with */}
                                <Text style={styles.orText}>Or login with</Text>

                                {/* Social Login Buttons */}
                                <View style={styles.socialButtonsContainer}>
                                    <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
                                        <Image
                                            source={require('../../assets/images/google-logo.png')}
                                            style={{ width: 40, height: 40 }}
                                        />
                                        <Text style={styles.socialButtonText}>Continue with Google</Text>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        ) : (
                            <Animated.View
                                key="signup-form"
                                style={styles.form}
                                entering={FadeIn.duration(300)}
                                exiting={FadeOut.duration(150)}
                            >
                                {/* Full Name Input */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Full Name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={fullName}
                                        onChangeText={setFullName}
                                        placeholder="Enter your full name"
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                {/* Email Input */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Email</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={signupEmail}
                                        onChangeText={setSignupEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        placeholder="Enter your email"
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                {/* Password Input */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Password</Text>
                                    <View style={styles.passwordContainer}>
                                        <TextInput
                                            style={styles.passwordInput}
                                            value={signupPassword}
                                            onChangeText={handlePasswordChange}
                                            secureTextEntry={!showSignupPassword}
                                            placeholder="Create a strong password"
                                            placeholderTextColor="#999"
                                        />
                                        <TouchableOpacity onPress={() => setShowSignupPassword(!showSignupPassword)}>
                                            <Feather
                                                name={showSignupPassword ? "eye" : "eye-off"}
                                                size={18}
                                                color="#999"
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Password Strength Indicator */}
                                    {passwordStrength && (
                                        <View style={styles.strengthContainer}>
                                            <View style={styles.strengthBar}>
                                                <View
                                                    style={[
                                                        styles.strengthFill,
                                                        {
                                                            width: passwordStrength.level === 'weak' ? '33%' : passwordStrength.level === 'medium' ? '66%' : '100%',
                                                            backgroundColor: passwordStrength.color
                                                        }
                                                    ]}
                                                />
                                            </View>
                                            <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                                                {passwordStrength.text}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Confirm Password Input */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Confirm Password</Text>
                                    <View style={styles.passwordContainer}>
                                        <TextInput
                                            style={styles.passwordInput}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry={!showConfirmPassword}
                                            placeholder="Re-enter your password"
                                            placeholderTextColor="#999"
                                        />
                                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                            <Feather
                                                name={showConfirmPassword ? "eye" : "eye-off"}
                                                size={18}
                                                color="#999"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Sign Up Button */}
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleSignup}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Sign Up</Text>
                                    )}
                                </TouchableOpacity>

                                {/* Or login with */}
                                <Text style={styles.orText}>Or sign up with</Text>

                                {/* Social Login Buttons */}
                                <View style={styles.socialButtonsContainer}>
                                    <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
                                        <Image
                                            source={require('../../assets/images/google-logo.png')}
                                            style={{ width: 40, height: 40 }}
                                        />
                                        <Text style={styles.socialButtonText}>Continue with Google</Text>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
    },
    header: {
        alignItems: 'center',
        paddingVertical: Spacing.md,
    },
    logo: {
        width: 120,
        height: 90,
        marginBottom: Spacing.sm,
    },
    title: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        padding: 3,
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
    },
    tab: {
        flex: 1,
        paddingVertical: Spacing.sm + 2,
        alignItems: 'center',
        borderRadius: BorderRadius.sm + 2,
    },
    activeTab: {
        backgroundColor: Colors.primary,
    },
    tabText: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
        color: Colors.textSecondary,
    },
    activeTabText: {
        color: Colors.white,
        fontWeight: Typography.fontWeight.semibold,
    },
    form: {
        paddingTop: Spacing.md,
    },
    inputGroup: {
        marginBottom: Spacing.sm + 2,
    },
    inputLabel: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.medium,
        color: Colors.textPrimary,
        marginBottom: Spacing.sm - 2,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md + 2,
        paddingVertical: Spacing.sm + 3,
        fontSize: Typography.fontSize.base,
        color: Colors.textPrimary,
        backgroundColor: Colors.white,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md + 2,
        backgroundColor: Colors.white,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: Spacing.sm + 3,
        fontSize: Typography.fontSize.base,
        color: Colors.textPrimary,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 18,
        height: 18,
        borderWidth: 2,
        borderColor: Colors.border,
        borderRadius: BorderRadius.sm,
        marginRight: Spacing.sm - 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    rememberMeText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.textPrimary,
    },
    forgotPasswordText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.primary,
        fontWeight: Typography.fontWeight.medium,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        height: 48,
        justifyContent: 'center',
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginBottom: Spacing.sm + 2,
    },
    primaryButtonText: {
        color: Colors.white,
        fontSize: Typography.fontSize.md - 1,
        fontWeight: Typography.fontWeight.semibold,
    },
    orText: {
        textAlign: 'center',
        fontSize: Typography.fontSize.xs,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm + 2,
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        height: 48,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        gap: 12,
        width: '100%',
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    strengthContainer: {
        marginTop: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    strengthFill: {
        height: '100%',
    },
    strengthText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.semibold,
    },
});
