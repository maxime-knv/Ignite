import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { Colors, Radius, Spacing, Typography } from '../theme';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

export const TodayScreen: React.FC = () => {
  const {
    userName, tasks, addTask, toggleTask, deleteTask,
    currentStreak, closeDayLog, closeHour,
    dayLogs,
  } = useStore();

  const [input, setInput] = useState('');
  const [dayClosed, setDayClosed] = useState(false);

  const now = new Date();
  const dateStr = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`;
  const currentHour = now.getHours();
  const canClose = currentHour >= closeHour;
  const today = now.toISOString().split('T')[0];
  const alreadyClosedToday = dayLogs.some(l => l.date === today);

  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const handleAdd = () => {
    const text = input.trim();
    if (!text) return;
    addTask(text);
    setInput('');
  };

  const handleDelete = (id: string) => {
    Alert.alert('Supprimer la tâche ?', '', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteTask(id) },
    ]);
  };

  const handleCloseDay = () => {
    if (!canClose) {
      Alert.alert(
        '⏰ Trop tôt !',
        `Vous pouvez clôturer votre journée à partir de ${closeHour}h00.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const pctRatio = total > 0 ? done / total : 0;
    const willValidate = pctRatio >= 2 / 3;

    const message = total === 0
      ? 'Vous n\'avez aucune tâche aujourd\'hui. Voulez-vous quand même clôturer ?'
      : `${done}/${total} tâches accomplies (${pct}%).${
          willValidate
            ? '\n\n🔥 Votre flamme sera validée !'
            : '\n\n⚠️ Moins de 67% des tâches — la flamme ne sera pas comptée.'
        }`;

    Alert.alert('Clôturer la journée ?', message, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Clôturer',
        style: 'default',
        onPress: () => {
          const result = closeDayLog();
          setDayClosed(true);
          setTimeout(() => {
            Alert.alert(
              result.streakValidated ? '🔥 Flamme validée !' : '📋 Journée clôturée',
              result.streakValidated
                ? `Bravo ! ${result.tasksDone}/${result.tasksTotal} tâches. Série : ${currentStreak} jour${currentStreak > 1 ? 's' : ''} !`
                : `${result.tasksDone}/${result.tasksTotal} tâches. Continuez demain !`,
              [{ text: 'Super !', onPress: () => setDayClosed(false) }]
            );
          }, 100);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.brand}>Ignite.</Text>
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {currentStreak} jours</Text>
            </View>
          </View>
        </View>

        {/* Greeting card */}
        <View style={styles.greetingCard}>
          <Text style={styles.dateLabel}>Bonjour • {dateStr}</Text>
          <Text style={styles.greeting}>
            Bonjour <Text style={styles.flameText}>{userName}</Text>,{'\n'}
            qu'est-ce que vous planifiez{'\n'}de faire aujourd'hui ?
          </Text>
        </View>

        {/* Task input */}
        <Text style={styles.sectionLabel}>MES TÂCHES DU JOUR</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ajouter une tâche..."
            placeholderTextColor={Colors.textMuted}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Task list */}
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>Ajoutez votre première tâche !</Text>
          </View>
        ) : (
          tasks.map(task => (
            <View key={task.id} style={[styles.taskItem, task.done && styles.taskDone]}>
              <TouchableOpacity
                style={styles.taskLeft}
                onPress={() => toggleTask(task.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.check, task.done && styles.checkDone]}>
                  {task.done && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={[styles.taskText, task.done && styles.taskTextDone]}>
                  {task.text}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(task.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Progress */}
        {tasks.length > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <Text style={styles.progressLabel}>Progression</Text>
              <Text style={[
                styles.progressPct,
                pct >= 67 ? { color: Colors.green } : pct >= 40 ? { color: Colors.gold } : {},
              ]}>
                {pct}%
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[
                styles.progressFill,
                { width: `${pct}%` as any },
                pct >= 67 ? { backgroundColor: Colors.green } : {},
              ]} />
            </View>
            <Text style={styles.progressHint}>
              {pct >= 67
                ? '✅ Flamme assurée si vous clôturez !'
                : `⚡ ${Math.ceil(total * 2 / 3) - done} tâche${Math.ceil(total * 2 / 3) - done > 1 ? 's' : ''} de plus pour valider la flamme`}
            </Text>
          </View>
        )}

        {/* Close Day CTA */}
        <View style={styles.closeDayWrap}>
          <TouchableOpacity
            style={[
              styles.closeBtn,
              !canClose && styles.closeBtnDisabled,
              alreadyClosedToday && styles.closeBtnDone,
            ]}
            onPress={alreadyClosedToday ? undefined : handleCloseDay}
            activeOpacity={0.85}
          >
            <Text style={styles.closeBtnText}>
              {alreadyClosedToday
                ? '✅ Journée clôturée'
                : canClose
                ? '🔥 Clôturer ma journée'
                : `🌙 Disponible à partir de ${closeHour}h00`}
            </Text>
          </TouchableOpacity>
          {!canClose && !alreadyClosedToday && (
            <Text style={styles.closeBtnHint}>
              Revenez à {closeHour}h00 pour clôturer votre journée
            </Text>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.base,
  },
  brand: { fontSize: 22, fontWeight: '800', color: Colors.flame, letterSpacing: -0.5 },
  streakBadge: {
    backgroundColor: '#FFF0E8', borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  streakText: { color: Colors.flame, fontWeight: '600', fontSize: 13 },
  greetingCard: {
    margin: Spacing.lg, marginTop: 0, backgroundColor: Colors.surface,
    borderRadius: Radius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  dateLabel: {
    fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 6,
  },
  greeting: { fontSize: 20, fontWeight: '700', color: Colors.text, lineHeight: 28 },
  flameText: { color: Colors.flame },
  sectionLabel: {
    fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase',
    letterSpacing: 1, fontWeight: '600',
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  inputRow: {
    flexDirection: 'row', marginHorizontal: Spacing.lg,
    marginBottom: Spacing.base, gap: 8,
  },
  input: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
    color: Colors.text, fontSize: Typography.fontSizes.base,
  },
  addBtn: {
    width: 42, height: 42, borderRadius: Radius.md,
    backgroundColor: Colors.flame, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: Colors.white, fontSize: 24, fontWeight: '300', lineHeight: 28 },
  taskItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    marginHorizontal: Spacing.lg, marginBottom: 8,
    overflow: 'hidden',
  },
  taskLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.md },
  taskDone: { opacity: 0.55, borderColor: 'rgba(74,222,128,0.2)' },
  check: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkDone: { backgroundColor: Colors.green, borderColor: Colors.green },
  checkMark: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  taskText: { flex: 1, fontSize: Typography.fontSizes.base, color: Colors.text, lineHeight: 20 },
  taskTextDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  deleteBtn: {
    paddingHorizontal: 14, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  progressCard: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.base,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, color: Colors.textMuted },
  progressPct: { fontSize: 12, color: Colors.flame, fontWeight: '600' },
  progressBarBg: {
    height: 6, backgroundColor: Colors.surface2,
    borderRadius: Radius.full, overflow: 'hidden', marginBottom: 8,
  },
  progressFill: { height: 6, backgroundColor: Colors.flame, borderRadius: Radius.full },
  progressHint: { fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 30, marginHorizontal: Spacing.lg },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 13, color: Colors.textMuted },
  closeDayWrap: { marginHorizontal: Spacing.lg, marginTop: Spacing.xl, gap: 8 },
  closeBtn: {
    backgroundColor: Colors.flame, borderRadius: Radius.md,
    padding: 16, alignItems: 'center',
  },
  closeBtnDisabled: { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border },
  closeBtnDone: { backgroundColor: 'rgba(74,222,128,0.12)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  closeBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  closeBtnHint: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
});
