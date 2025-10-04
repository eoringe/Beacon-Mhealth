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
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';

export default function AuthScreen() {
  const router = useRouter();
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
    router.push('/tour/welcome');
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
      >
        <Text style={styles.primaryButtonText}>Log In</Text>
      </TouchableOpacity>

      {/* Or login with */}
      <Text style={styles.orText}>Or login with</Text>

      {/* Social Login Buttons */}
      <View style={styles.socialButtonsContainer}>
        <TouchableOpacity style={styles.socialButton}>
          <MaterialIcons name="g-translate" size={20} color="#DB4437" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <MaterialIcons name="facebook" size={20} color="#4267B2" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <MaterialIcons name="apple" size={20} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <MaterialIcons name="phone" size={20} color="#333333" />
        </TouchableOpacity>
      </View>
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
            onChangeText={setSignupPassword}
            secureTextEntry={!showSignupPassword}
            placeholder="Enter your password"
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
      </View>

      {/* Sign Up Button */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSignup}
      >
        <Text style={styles.primaryButtonText}>Sign Up</Text>
      </TouchableOpacity>

      {/* Or login with */}
      <Text style={styles.orText}>Or sign up with</Text>

      {/* Social Login Buttons */}
      <View style={styles.socialButtonsContainer}>
        <TouchableOpacity style={styles.socialButton}>
          <MaterialIcons name="g-translate" size={20} color="#DB4437" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <MaterialIcons name="facebook" size={20} color="#4267B2" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <MaterialIcons name="apple" size={20} color="#000000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <MaterialIcons name="phone" size={20} color="#333333" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
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
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 15,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  logo: {
    width: 120,
    height: 90,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 3,
    marginTop: 8,
    marginBottom: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#2E5BFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  form: {
    flex: 1,
    paddingTop: 12,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
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
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 4,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2E5BFF',
    borderColor: '#2E5BFF',
  },
  rememberMeText: {
    fontSize: 13,
    color: '#333333',
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#2E5BFF',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#2E5BFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  orText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666666',
    marginBottom: 10,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
});