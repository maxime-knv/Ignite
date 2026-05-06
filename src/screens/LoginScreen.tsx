import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { Colors, Radius, Spacing, Typography } from '../theme';

export const LoginScreen: React.FC = () => {
  const { setUserName, setHasOnboarded } = useStore();
  const [name, setName] = useState('');

  const handleStart = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    setHasOnboarded(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* Logo */}
          <View style={styles.logoWrap}>
            <Text style={styles.logo}>🔥</Text>
            <Text style={styles.brand}>Ignite.</Text>
            <Text style={styles.tagline}>Allume ta flamme quotidienne</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bienvenue !</Text>
            <Text style={styles.cardSubtitle}>
              Comment souhaitez-vous être appelé(e) ?
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Votre prénom..."
              placeholderTextColor={Colors.textMuted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleStart}
              maxLength={30}
            />
            <TouchableOpacity
              style={[styles.btn, !name.trim() && styles.btnDisabled]}
              onPress={handleStart}
              activeOpacity={0.85}
              disabled={!name.trim()}
            >
              <Text style={styles.btnText}>Commencer 🔥</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Votre progression est sauvegardée localement sur votre téléphone.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  kav: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.xl },
  logoWrap: { alignItems: 'center', gap: 6 },
  logo: { fontSize: 64 },
  brand: { fontSize: 36, fontWeight: '800', color: Colors.flame, letterSpacing: -1 },
  tagline: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  cardSubtitle: { fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginBottom: 4 },
  input: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  btn: {
    backgroundColor: Colors.flame,
    borderRadius: Radius.full,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  footer: { fontSize: 12, color: Colors.textDim, textAlign: 'center', lineHeight: 18 },
});
