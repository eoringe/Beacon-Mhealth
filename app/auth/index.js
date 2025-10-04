import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('login');

  // Login state
  const [email, setEmail] = useState('Loisbecket@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Signup state
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const handleLogin = () => {
    router.push('/(tabs)/dashboard');
  };

  const handleSignup = () => {
    router.push('/(tabs)/dashboard');
  };

  const LoginForm = () => (
    <View style={styles.form}>
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
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Feather
              name={showPassword ? "eye" : "eye-off"}
              size={20}
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
            {rememberMe && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
          </View>
          <Text style={styles.rememberMeText}>Remember me</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.forgotPasswordText}>Forgot Password ?</Text>
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleLogin}
      >
        <Text style={styles.primaryButtonText}>Log In</Text>
      </TouchableOpacity>
    </View>
  );

  const SignupForm = () => (
    <View style={styles.form}>
      {/* Full Name Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
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
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={signupPassword}
            onChangeText={setSignupPassword}
            secureTextEntry={!showSignupPassword}
            placeholder="Enter your password"
          />
          <TouchableOpacity onPress={() => setShowSignupPassword(!showSignupPassword)}>
            <Feather
              name={showSignupPassword ? "eye" : "eye-off"}
              size={20}
              color="#999"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign Up Button */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSignup}
      >
        <Text style={styles.primaryButtonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.content}>
            {/* Header with Logo */}
            <View style={styles.header}>
              <Image
                source={require('../../assets/images/beacon.jpg')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Get Started now</Text>
              <Text style={styles.subtitle}>Create an account or log in to explore about our app</Text>
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
            {activeTab === 'login' ? <LoginForm /> : <SignupForm />}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  logo: {
    width: 100,
    height: 75,
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 14,
  },
  form: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 5,
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 12,
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 12,
    color: '#333333',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 2,
    marginRight: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2E5BFF',
    borderColor: '#2E5BFF',
  },
  rememberMeText: {
    fontSize: 10,
    color: '#333333',
  },
  forgotPasswordText: {
    fontSize: 10,
    color: '#2E5BFF',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#2E5BFF',
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    marginHorizontal: 16,
    borderRadius: 4,
    padding: 2,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 4,
    alignItems: 'center',
    borderRadius: 2,
  },
  activeTab: {
    backgroundColor: '#2E5BFF',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
