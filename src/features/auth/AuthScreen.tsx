import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { login, register, resetPassword, authErrorMessage } from '../../data/services/auth';
import { isValidEmail, isValidPassword } from './validation';

const GREEN = '#0B6B5D';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m);
    setError('');
    setInfo('');
  };

  const submit = async () => {
    setError('');
    setInfo('');
    if (mode === 'signup' && name.trim().length < 2) return setError('Entrez votre nom.');
    if (!isValidEmail(email)) return setError('Adresse email invalide.');
    if (!isValidPassword(password)) return setError('6 caractères minimum.');
    setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name.trim(), email, password);
      // Redirection automatique via onAuthStateChanged (App.tsx)
    } catch (e: any) {
      setError(authErrorMessage(e?.code ?? '') + ' [' + (e?.code ?? 'sans code') + ']');
    } finally {
      setLoading(false);
    }
  };

  const forgot = async () => {
    setError('');
    setInfo('');
    if (!isValidEmail(email)) return setError("Entrez d'abord votre email.");
    try {
      await resetPassword(email);
      setInfo('Email envoyé. Consultez votre boîte mail.');
    } catch (e: any) {
      setError(authErrorMessage(e?.code ?? ''));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Services Immobilier</Text>
        <Text style={s.subtitle}>Trouvez, publiez et échangez des biens près de chez vous.</Text>

        <View style={s.tabs}>
          {(['login', 'signup'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[s.tab, mode === m && s.tabActive]}
              onPress={() => switchMode(m)}
            >
              <Text style={[s.tabText, mode === m && s.tabTextActive]}>
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'signup' && (
          <>
            <Text style={s.label}>Nom</Text>
            <TextInput style={s.input} placeholder="Votre nom" value={name} onChangeText={setName} />
          </>
        )}

        <Text style={s.label}>Email</Text>
        <TextInput
          style={s.input}
          placeholder="nom@exemple.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={s.label}>Mot de passe</Text>
        <TextInput
          style={s.input}
          placeholder="6 caractères minimum"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {mode === 'login' && (
          <TouchableOpacity onPress={forgot}>
            <Text style={s.link}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        )}

        {!!error && <Text style={s.error}>{error}</Text>}
        {!!info && <Text style={s.info}>{info}</Text>}

        <TouchableOpacity
          style={[s.button, loading && { opacity: 0.6 }]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>{mode === 'login' ? 'Se connecter' : "S'inscrire"}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { padding: 30, paddingTop: 80, flexGrow: 1 },
  title: { fontSize: 34, fontWeight: '800', color: GREEN },
  subtitle: { fontSize: 17, color: '#4b5563', marginTop: 8, marginBottom: 28 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e5e7eb', marginBottom: 24 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabActive: { borderBottomWidth: 3, borderColor: GREEN },
  tabText: { fontSize: 18, color: '#4b5563' },
  tabTextActive: { color: GREEN, fontWeight: '700' },
  label: { color: '#4b5563', marginBottom: 8, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 14, padding: 16, fontSize: 17 },
  link: { color: GREEN, textDecorationLine: 'underline', textAlign: 'right', marginVertical: 18 },
  error: { color: '#dc2626', marginBottom: 12 },
  info: { color: GREEN, marginBottom: 12 },
  button: { backgroundColor: GREEN, borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});