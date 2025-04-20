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
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

export default function SignupScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Theme colors
  const theme = {
    colors: {
      primary: '#0066CC',
      secondary: isDark ? '#70A1FF' : '#4D96FF',
      background: isDark ? '#121212' : '#FFFFFF',
      card: isDark ? '#1E1E1E' : '#F5F7FA',
      text: isDark ? '#F5F5F5' : '#333333',
      border: isDark ? '#2A2A2A' : '#E1E5EA',
      disabled: isDark ? '#747D8C' : '#A4B0BE',
    }
  };
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [focusedInput, setFocusedInput] = useState(null);

  const handleSignup = () => {
    // Handle signup logic here
    router.push('/(tabs)/dashboard');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: theme.colors.primary }]}>
                BEACON CHILDREN CENTER
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.text }]}>
                Create your account
              </Text>
            </View>

            <View style={styles.form}>
              <View style={[
                styles.inputContainer, 
                { 
                  borderColor: focusedInput === 'fullName' ? theme.colors.primary : theme.colors.border,
                  backgroundColor: theme.colors.card
                }
              ]}>
                <MaterialIcons name="person" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Full Name"
                  placeholderTextColor={theme.colors.disabled}
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFocusedInput('fullName')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View style={[
                styles.inputContainer, 
                { 
                  borderColor: focusedInput === 'email' ? theme.colors.primary : theme.colors.border,
                  backgroundColor: theme.colors.card
                }
              ]}>
                <MaterialIcons name="email" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Email Address"
                  placeholderTextColor={theme.colors.disabled}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
              
              <View style={[
                styles.inputContainer, 
                { 
                  borderColor: focusedInput === 'phone' ? theme.colors.primary : theme.colors.border,
                  backgroundColor: theme.colors.card
                }
              ]}>
                <MaterialIcons name="phone" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Phone Number"
                  placeholderTextColor={theme.colors.disabled}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  onFocus={() => setFocusedInput('phone')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View style={[
                styles.inputContainer, 
                { 
                  borderColor: focusedInput === 'password' ? theme.colors.primary : theme.colors.border,
                  backgroundColor: theme.colors.card
                }
              ]}>
                <MaterialIcons name="lock" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Password"
                  placeholderTextColor={theme.colors.disabled}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather 
                    name={showPassword ? "eye" : "eye-off"} 
                    size={20} 
                    color={theme.colors.disabled} 
                  />
                </TouchableOpacity>
              </View>
              
              <View style={[
                styles.inputContainer, 
                { 
                  borderColor: focusedInput === 'confirmPassword' ? theme.colors.primary : theme.colors.border,
                  backgroundColor: theme.colors.card
                }
              ]}>
                <MaterialIcons name="lock" size={20} color={theme.colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Confirm Password"
                  placeholderTextColor={theme.colors.disabled}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  onFocus={() => setFocusedInput('confirmPassword')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Feather 
                    name={showConfirmPassword ? "eye" : "eye-off"} 
                    size={20} 
                    color={theme.colors.disabled} 
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.signupButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleSignup}
              >
                <Text style={styles.signupButtonText}>Sign Up</Text>
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={[styles.loginText, { color: theme.colors.text }]}>
                  Already have an account?
                </Text>
                <TouchableOpacity onPress={() => router.push('/auth/login')}>
                  <Text style={[styles.loginLink, { color: theme.colors.primary }]}>
                    Log In
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    paddingHorizontal: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 56,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  signupButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 24,
    marginTop: 8,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  loginText: {
    fontSize: 15,
    marginRight: 5,
  },
  loginLink: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});