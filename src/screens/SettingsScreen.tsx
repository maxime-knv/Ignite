import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { ToggleRow } from '../components/ToggleRow';
import { Colors, Radius, Spacing, Typography } from '../theme';
import * as Notifications from 'expo-notifications';

const HOURS = Array.from({ length: 7 }, (_, i) => i + 15); // 15h → 23h

export const SettingsScreen: React.FC = () => {
  const {
    userName, setUserName,
    closeHour, setCloseHour,
    notificationsEnabled, motivationEnabled, pomodoroSound,
    toggleNotifications, toggleMotivation, togglePomodoroSound,
    currentStreak, bestStreak, dayLogs, clearDayTasks,
  } = useStore();

  const [nameInput, setNameInput] = useState(userName);
  const [nameSaved, setNameSaved] = useState(false);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert('Nom invalide', 'Veuillez entrer un prénom.');
      return;
    }
    setUserName(trimmed);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const handleScheduleNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Notifications désactivées',
        'Activez les notifications dans les réglages de votre téléphone pour recevoir des rappels.'
      );
      return;
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    const messages = [
      "🔥 Ta flamme n'attend que toi — une tâche à la fois !",
      "💪 Tu es capable de tout accomplir aujourd'hui.",
      "⚡ Chaque effort compte. Continue !",
      "🎯 Reste concentré(e), ta journée est entre tes mains.",
      "🌟 Les grands résultats viennent des petites habitudes quotidiennes.",
    ];

    // Schedule reminders every 2h from 9h to 19h
    const reminderHours = [9, 11, 13, 15, 17, 19];
    for (const hour of reminderHours) {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Ignite 🔥',
          body: msg,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute: 0,
        },
      });
    }

    Alert.alert('✅ Notifications activées', 'Vous recevrez des rappels de motivation tout au long de la journée.');
  };

  const handleCancelNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    Alert.alert('Notifications annulées', 'Vous ne recevrez plus de rappels.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.brand}>Ignite.</Text>
          <Text style={styles.headerSub}>Paramètres</Text>
        </View>

        {/* Profile */}
        <Text style={styles.sectionLabel}>MON PROFIL</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Prénom</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={nameInput}
              onChangeText={(t) => { setNameInput(t); setNameSaved(false); }}
              placeholder="Votre prénom..."
              placeholderTextColor={Colors.textMuted}
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            <TouchableOpacity
              style={[styles.saveBtn, nameSaved && styles.saveBtnDone]}
              onPress={handleSaveName}
            >
              <Text style={styles.saveBtnText}>{nameSaved ? '✓' : 'OK'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Close hour */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>CLÔTURE DE JOURNÉE</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Heure minimale pour clôturer</Text>
          <Text style={styles.fieldHint}>
            Actuellement : à partir de <Text style={{ color: Colors.flame, fontWeight: '700' }}>{closeHour}h00</Text>
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.hourScroll}
            contentContainerStyle={styles.hourScrollContent}
          >
            {HOURS.map(h => (
              <TouchableOpacity
                key={h}
                style={[styles.hourChip, h === closeHour && styles.hourChipSelected]}
                onPress={() => setCloseHour(h)}
              >
                <Text style={[styles.hourChipText, h === closeHour && styles.hourChipTextSelected]}>
                  {h}h
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Notifications */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>NOTIFICATIONS</Text>
        <ToggleRow
          label="Notifications push"
          subtitle="Rappels de motivation tout au long de la journée"
          value={notificationsEnabled}
          onToggle={toggleNotifications}
        />
        <ToggleRow
          label="Messages de motivation IA"
          subtitle="Messages personnalisés selon vos tâches"
          value={motivationEnabled}
          onToggle={toggleMotivation}
        />

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={notificationsEnabled ? handleScheduleNotifications : handleCancelNotifications}
          >
            <Text style={styles.notifBtnText}>
              {notificationsEnabled ? '📲 Programmer les rappels' : '🔕 Annuler les rappels'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.notifHint}>
            Les rappels sont envoyés toutes les 2h entre 9h et 19h.
          </Text>
        </View>

        {/* Pomodoro */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>FOCUS</Text>
        <ToggleRow
          label="Son de fin de session"
          subtitle="Vibration à la fin du minuteur Pomodoro"
          value={pomodoroSound}
          onToggle={togglePomodoroSound}
        />

        {/* Stats summary */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>MES STATISTIQUES</Text>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Série actuelle</Text>
            <Text style={styles.statValue}>{currentStreak} 🔥</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Meilleure série</Text>
            <Text style={styles.statValue}>{bestStreak} ⚡</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Jours complétés</Text>
            <Text style={styles.statValue}>{dayLogs.filter(l => l.completed).length} ✅</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  brand: { fontSize: 22, fontWeight: '800', color: Colors.flame },
  headerSub: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  sectionLabel: {
    fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase',
    letterSpacing: 1, fontWeight: '600',
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  card: {
    marginHorizontal: Spacing.lg, backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: 8,
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  fieldHint: { fontSize: 12, color: Colors.textMuted, marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1, backgroundColor: Colors.surface2, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 10,
    color: Colors.text, fontSize: 15,
  },
  saveBtn: {
    backgroundColor: Colors.flame, borderRadius: Radius.sm,
    paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDone: { backgroundColor: Colors.green },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  hourScroll: { marginTop: 4 },
  hourScrollContent: { gap: 8, paddingVertical: 4 },
  hourChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Radius.full, backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border,
  },
  hourChipSelected: { backgroundColor: Colors.flame, borderColor: Colors.flame },
  hourChipText: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  hourChipTextSelected: { color: Colors.white, fontWeight: '700' },
  notifBtn: {
    backgroundColor: Colors.surface2, borderRadius: Radius.sm,
    padding: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  notifBtnText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  notifHint: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  statsCard: {
    marginHorizontal: Spacing.lg, backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md,
  },
  statLabel: { fontSize: 14, color: Colors.textMuted },
  statValue: { fontSize: 16, fontWeight: '700', color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
});
