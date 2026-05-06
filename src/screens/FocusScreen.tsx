import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useStore } from '../store/useStore';
import { ToggleRow } from '../components/ToggleRow';
import { Colors, Radius, Spacing, Typography } from '../theme';

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;
const RING_RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type Phase = 'work' | 'break';

export const FocusScreen: React.FC = () => {
  const {
    tasks, pomodoroSound, togglePomodoroSound, incrementPomodoro,
    selectedPomodoroTaskIds, setSelectedPomodoroTaskIds,
  } = useStore();

  const [remaining, setRemaining] = useState(WORK_DURATION);
  const [maxTime, setMaxTime] = useState(WORK_DURATION);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>('work');
  const [sessions, setSessions] = useState([false, false, false, false]);
  const [sessionIdx, setSessionIdx] = useState(0);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = remaining / maxTime;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            Vibration.vibrate([0, 400, 200, 400]);
            if (phase === 'work') {
              incrementPomodoro();
              setSessions(prev => {
                const next = [...prev];
                next[sessionIdx] = true;
                return next;
              });
              setSessionIdx(i => Math.min(i + 1, 3));
              setPhase('break');
              setMaxTime(BREAK_DURATION);
              return BREAK_DURATION;
            } else {
              setPhase('work');
              setMaxTime(WORK_DURATION);
              return WORK_DURATION;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, phase]);

  const handleToggle = () => setRunning(r => !r);

  const handleReset = () => {
    setRunning(false);
    setPhase('work');
    setRemaining(WORK_DURATION);
    setMaxTime(WORK_DURATION);
  };

  const togglePomodoroTask = (id: string) => {
    const current = selectedPomodoroTaskIds;
    if (current.includes(id)) {
      setSelectedPomodoroTaskIds(current.filter(i => i !== id));
    } else {
      setSelectedPomodoroTaskIds([...current, id]);
    }
  };

  const pendingTasks = tasks.filter(t => !t.done);
  const selectedTasks = tasks.filter(t => selectedPomodoroTaskIds.includes(t.id));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.brand}>Ignite.</Text>
        </View>
        <Text style={styles.sectionLabel}>MINUTEUR POMODORO</Text>

        {/* Ring */}
        <View style={styles.ringWrap}>
          <Svg width={220} height={220} viewBox="0 0 220 220" style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={110} cy={110} r={RING_RADIUS} fill="none" stroke={Colors.surface2} strokeWidth={12} />
            <Circle
              cx={110} cy={110} r={RING_RADIUS}
              fill="none"
              stroke={phase === 'break' ? Colors.green : Colors.flame}
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={styles.timerText}>{formatTime(remaining)}</Text>
            <Text style={styles.phaseText}>{phase === 'work' ? 'Travail' : 'Pause'}</Text>
          </View>
        </View>

        {/* Session dots */}
        <View style={styles.dotsRow}>
          {sessions.map((done, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                done && styles.dotDone,
                i === sessionIdx && !done && styles.dotCurrent,
              ]}
            />
          ))}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.btnSecondary} onPress={handleReset}>
            <Text style={styles.btnSecondaryText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleToggle}>
            <Text style={styles.btnPrimaryText}>{running ? '⏸ Pause' : '▶ Démarrer'}</Text>
          </TouchableOpacity>
        </View>

        {/* Associated Tasks */}
        <View style={styles.taskSectionHeader}>
          <Text style={styles.sectionLabel}>TÂCHES ASSOCIÉES</Text>
          {tasks.length > 0 && (
            <TouchableOpacity onPress={() => setShowTaskPicker(v => !v)}>
              <Text style={styles.editLink}>{showTaskPicker ? 'Fermer' : 'Modifier'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Task picker */}
        {showTaskPicker && (
          <View style={styles.pickerCard}>
            <Text style={styles.pickerHint}>Sélectionnez une ou plusieurs tâches :</Text>
            {tasks.length === 0 ? (
              <Text style={styles.noTaskText}>Aucune tâche — ajoutez-en dans l'onglet Aujourd'hui.</Text>
            ) : (
              tasks.map(t => {
                const selected = selectedPomodoroTaskIds.includes(t.id);
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.pickerItem, selected && styles.pickerItemSelected]}
                    onPress={() => togglePomodoroTask(t.id)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.pickerCheck, selected && styles.pickerCheckSelected]}>
                      {selected && <Text style={styles.pickerCheckMark}>✓</Text>}
                    </View>
                    <Text style={[styles.pickerText, t.done && styles.pickerTextDone]}>
                      {t.text}
                    </Text>
                    {t.done && <Text style={styles.doneBadge}>✓</Text>}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Selected tasks display */}
        {!showTaskPicker && selectedTasks.length > 0 && (
          <>
            {selectedTasks.map(t => (
              <View key={t.id} style={[styles.taskChip, t.done && { opacity: 0.5 }]}>
                <View style={styles.chipDot} />
                <Text style={[styles.chipText, t.done && styles.pickerTextDone]}>{t.text}</Text>
                {t.done && <Text style={styles.doneBadge}>✓</Text>}
              </View>
            ))}
          </>
        )}

        {!showTaskPicker && selectedTasks.length === 0 && pendingTasks.length > 0 && (
          <TouchableOpacity style={styles.addTaskCta} onPress={() => setShowTaskPicker(true)}>
            <Text style={styles.addTaskCtaText}>+ Associer des tâches au minuteur</Text>
          </TouchableOpacity>
        )}

        {/* Settings */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>PARAMÈTRES FOCUS</Text>
        <ToggleRow
          label="Son de fin de session"
          subtitle="Vibration à la fin du minuteur"
          value={pomodoroSound}
          onToggle={togglePomodoroSound}
        />

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  brand: { fontSize: 22, fontWeight: '800', color: Colors.flame },
  sectionLabel: {
    fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase',
    letterSpacing: 1, fontWeight: '600',
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  ringWrap: {
    alignItems: 'center', justifyContent: 'center',
    marginVertical: Spacing.lg, position: 'relative',
  },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  timerText: { fontSize: 46, fontWeight: '800', color: Colors.text, letterSpacing: -2, lineHeight: 52 },
  phaseText: { fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: Spacing.xl },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border,
  },
  dotDone: { backgroundColor: Colors.flame, borderColor: Colors.flame },
  dotCurrent: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  controls: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 12, marginBottom: Spacing.xl, paddingHorizontal: Spacing.lg,
  },
  btnPrimary: {
    flex: 1, backgroundColor: Colors.flame,
    borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center',
  },
  btnPrimaryText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  btnSecondary: {
    paddingVertical: 14, paddingHorizontal: 28, borderRadius: Radius.full,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  btnSecondaryText: { color: Colors.text, fontSize: 16, fontWeight: '500' },
  taskSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  editLink: { fontSize: 12, color: Colors.flame, fontWeight: '600' },
  pickerCard: {
    marginHorizontal: Spacing.lg, backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.md, gap: 6,
  },
  pickerHint: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  noTaskText: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: 8 },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: Spacing.sm, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: 'transparent',
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(255,107,53,0.08)',
    borderColor: 'rgba(255,107,53,0.25)',
  },
  pickerCheck: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  pickerCheckSelected: { backgroundColor: Colors.flame, borderColor: Colors.flame },
  pickerCheckMark: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  pickerText: { flex: 1, fontSize: Typography.fontSizes.base, color: Colors.text },
  pickerTextDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  doneBadge: { fontSize: 12, color: Colors.green },
  taskChip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginHorizontal: Spacing.lg, marginBottom: 8,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.flame },
  chipText: { fontSize: Typography.fontSizes.base, color: Colors.text, flex: 1 },
  addTaskCta: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center',
  },
  addTaskCtaText: { fontSize: 13, color: Colors.textMuted },
});
