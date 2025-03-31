// app/auth/login.tsx
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, Text, Input, useTheme } from '@rneui/themed';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useAuth();
  const { theme } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during login');
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
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/icon.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Text h3 h3Style={{ color: theme.colors.primary, marginTop: 20 }}>
            Blockchain Voting
          </Text>
          <Text style={{ color: theme.colors.grey3, marginTop: 10, textAlign: 'center' }}>
            Secure, transparent, and tamper-proof voting system
          </Text>
        </View>

        <View style={styles.formContainer}>
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

          {error ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          ) : null}

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            buttonStyle={[styles.button, { backgroundColor: theme.colors.primary }]}
            containerStyle={{ marginTop: 20 }}
          />

          <View style={styles.registerContainer}>
            <Text style={{ color: theme.colors.grey4 }}>
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={[styles.registerText, { color: theme.colors.primary }]}>
                Register
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
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    fontWeight: 'bold',
    marginLeft: 5,
  },
});