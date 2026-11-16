import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { login, register, resetPassword, authErrorMessage } from '../../data/services/auth';
import { isValidEmail, isValidPassword } from './validation';
import { AppButton, IconName } from '../../components/ui';
import BrandMark from '../../components/BrandMark';
import { colors, radius, shadow } from '../../theme';

function Field({
  icon,
  right,
  ...props
}: React.ComponentProps<typeof TextInput> & { icon: IconName; right?: React.ReactNode }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[s.inputBox, focused && s.inputFocused]}>
      <Ionicons name={icon} size={19} color={focused ? colors.primary : colors.muted} />
      <TextInput
        {...props}
        style={s.input}
        placeholderTextColor={colors.subtle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {right}
    </View>
  );
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setError(authErrorMessage(e?.code ?? ''));
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
      style={{ flex: 1, backgroundColor: colors.primary }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[s.hero, { paddingTop: insets.top + 36 }]}>
          <View style={s.circleA} />
          <View style={s.circleB} />
          <BrandMark size={72} light withName />
          <Text style={s.subtitle}>Trouvez, publiez et échangez des biens près de chez vous.</Text>
        </View>

        <View style={[s.sheet, { paddingBottom: insets.bottom + 28 }]}>
          <View style={s.inner}>
            <View style={s.tabs}>
              {(['login', 'signup'] as const).map((m) => (
                <Pressable
                  key={m}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: mode === m }}
                  style={[s.tab, mode === m && s.tabActive]}
                  onPress={() => switchMode(m)}
                >
                  <Text style={[s.tabText, mode === m && s.tabTextActive]}>
                    {m === 'login' ? 'Connexion' : 'Inscription'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={s.heading}>
              {mode === 'login' ? 'Bon retour parmi nous' : 'Créez votre compte'}
            </Text>

            {mode === 'signup' && (
              <>
                <Text style={s.label}>Nom</Text>
                <Field icon="person-outline" placeholder="Votre nom" value={name} onChangeText={setName} />
              </>
            )}

            <Text style={s.label}>Email</Text>
            <Field
              icon="mail-outline"
              placeholder="nom@exemple.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <Text style={s.label}>Mot de passe</Text>
            <Field
              icon="lock-closed-outline"
              placeholder="6 caractères minimum"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onSubmitEditing={submit}
              right={
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={8}
                  accessibilityLabel={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={19}
                    color={colors.muted}
                  />
                </Pressable>
              }
            />

            {mode === 'login' && (
              <Pressable onPress={forgot} style={{ alignSelf: 'flex-end' }} hitSlop={6}>
                <Text style={s.link}>Mot de passe oublié ?</Text>
              </Pressable>
            )}

            {!!error && (
              <View style={[s.notice, s.noticeError]}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={[s.noticeText, { color: colors.danger }]}>{error}</Text>
              </View>
            )}
            {!!info && (
              <View style={[s.notice, s.noticeInfo]}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={[s.noticeText, { color: colors.success }]}>{info}</Text>
              </View>
            )}

            <AppButton
              label={mode === 'login' ? 'Se connecter' : "S'inscrire"}
              icon={mode === 'login' ? 'log-in-outline' : 'person-add-outline'}
              loading={loading}
              onPress={submit}
              style={{ marginTop: 18 }}
            />

            <Pressable
              style={{ alignSelf: 'center', marginTop: 18 }}
              onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            >
              <Text style={s.switchText}>
                {mode === 'login' ? 'Pas encore de compte ? ' : 'Déjà inscrit ? '}
                <Text style={s.switchLink}>{mode === 'login' ? 'Inscrivez-vous' : 'Connectez-vous'}</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 48,
    overflow: 'hidden',
  },
  circleA: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -90,
    right: -80,
  },
  circleB: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(242,165,65,0.14)',
    bottom: -60,
    left: -50,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
    maxWidth: 320,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.canvas,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  inner: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#E6EBE9',
    borderRadius: radius.md,
    padding: 4,
    marginBottom: 22,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.surface, ...shadow(1) },
  tabText: { fontSize: 15, color: colors.muted, fontWeight: '600' },
  tabTextActive: { color: colors.primary, fontWeight: '800' },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 6 },
  label: { color: colors.muted, fontWeight: '600', fontSize: 13, marginBottom: 8, marginTop: 14 },
  inputBox: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  inputFocused: { borderColor: colors.primary },
  input: { flex: 1, height: '100%', fontSize: 16, color: colors.text },
  link: { color: colors.primary, fontWeight: '700', marginTop: 12 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: radius.sm,
    marginTop: 14,
  },
  noticeError: { backgroundColor: colors.dangerSoft },
  noticeInfo: { backgroundColor: colors.primarySoft },
  noticeText: { flex: 1, fontSize: 14, fontWeight: '600' },
  switchText: { color: colors.muted, fontSize: 14 },
  switchLink: { color: colors.primary, fontWeight: '800' },
});
