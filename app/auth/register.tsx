// app/auth/register.tsx


import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, Text, Input, useTheme } from '@rneui/themed';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();
  const { theme } = useTheme();

  const handleRegister = async () => {
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await signUp(email, password, name);
      
      if (result.error) {
        setError(result.error);
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.black} />
          </TouchableOpacity>
          <Text h4 style={{ color: theme.colors.black }}>Create Account</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/icon.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Text style={{ color: theme.colors.grey3, marginTop: 10, textAlign: 'center' }}>
            Join our secure blockchain voting platform
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            leftIcon={<Ionicons name="person-outline" size={22} color={theme.colors.grey3} />}
            inputStyle={{ color: theme.colors.black }}
            inputContainerStyle={[
              styles.inputContainer,
              { borderColor: theme.colors.grey2, backgroundColor: theme.colors.white }
            ]}
          />

          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon={<Ionicons name="mail-outline" size={22} color={theme.colors.grey3} />}
            inputStyle={{ color: theme.colors.black }}
            inputContainerStyle={[
              styles.inputContainer,
              { borderColor: theme.colors.grey2, backgroundColor: theme.colors.white }
            ]}
          />

          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            leftIcon={<Ionicons name="lock-closed-outline" size={22} color={theme.colors.grey3} />}
            rightIcon={
              <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)}>
                <Ionicons 
                  name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'} 
                  size={22} 
                  color={theme.colors.grey3} 
                />
              </TouchableOpacity>
            }
            inputStyle={{ color: theme.colors.black }}
            inputContainerStyle={[
              styles.inputContainer,
              { borderColor: theme.colors.grey2, backgroundColor: theme.colors.white }
            ]}
          />

          <Input
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={confirmSecureTextEntry}
            leftIcon={<Ionicons name="lock-closed-outline" size={22} color={theme.colors.grey3} />}
            rightIcon={
              <TouchableOpacity onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}>
                <Ionicons 
                  name={confirmSecureTextEntry ? 'eye-outline' : 'eye-off-outline'} 
                  size={22} 
                  color={theme.colors.grey3} 
                />
              </TouchableOpacity>
            }
            inputStyle={{ color: theme.colors.black }}
            inputContainerStyle={[
              styles.inputContainer,
              { borderColor: theme.colors.grey2, backgroundColor: theme.colors.white }
            ]}
          />

          {error ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          ) : null}

          <Button
            title="Register"
            onPress={handleRegister}
            loading={loading}
            buttonStyle={[styles.button, { backgroundColor: theme.colors.primary }]}
            containerStyle={{ marginTop: 20 }}
          />

          <View style={styles.loginContainer}>
            <Text style={{ color: theme.colors.grey4 }}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={[styles.loginText, { color: theme.colors.primary }]}>
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  backButton: {
    padding: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 50,
  },
  button: {
    height: 50,
    borderRadius: 10,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 10,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    fontWeight: 'bold',
    marginLeft: 5,
  },
});