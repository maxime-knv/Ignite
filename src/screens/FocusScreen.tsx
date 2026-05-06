import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Vibration, AppState, AppStateStatus, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useStore } from '../store/useStore';
import { ToggleRow } from '../components/ToggleRow';
import { Colors, Radius, Spacing, Typography } from '../theme';

// ─── Constants ───────────────────────────────────────────────────────────────

const WORK_DURATION  = 25 * 60;
const SHORT_BREAK    =  5 * 60;
const LONG_BREAK     = 15 * 60;
const SESSIONS_TOTAL = 4;

const RING_RADIUS   = 90;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const KEY_END_TIME  = 'pomodoro_endTime';
const KEY_REMAINING = 'pomodoro_remaining';
const KEY_PHASE     = 'pomodoro_phase';
const KEY_SESSION   = 'pomodoro_sessionIdx';

const CATEGORY_POMODORO = 'POMODORO';
const ACTION_SKIP_BREAK = 'SKIP_BREAK';
const ACTION_STOP       = 'STOP_TIMER';

type Phase = 'work' | 'short_break' | 'long_break';

// ─── Audio setup ─────────────────────────────────────────────────────────────

async function playWorkEndSound() {
  if (Platform.OS === 'ios') {
    try {
      // Utiliser un son système iOS pour la fin du travail (son de cloche)
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: 'default' }, // Son système iOS par défaut (cloche)
        { shouldPlay: true }
      );

      // Attendre que le son se termine
      setTimeout(() => {
        sound.unloadAsync();
      }, 2000);
    } catch (error) {
      console.log('Error playing work end sound:', error);
    }
  }
}

async function playBreakEndSound() {
  if (Platform.OS === 'ios') {
    try {
      // Utiliser un son système iOS différent pour la fin de pause (plus doux)
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: 'default' }, // Son système iOS par défaut (pour différencier, on pourrait utiliser un autre son système)
        { shouldPlay: true }
      );

      // Attendre que le son se termine
      setTimeout(() => {
        sound.unloadAsync();
      }, 2000);
    } catch (error) {
      console.log('Error playing break end sound:', error);
    }
  }
}

// ─── Notification setup ───────────────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldPlaySound:  true,
    shouldSetBadge:   false,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

async function registerCategory() {
  await Notifications.setNotificationCategoryAsync(CATEGORY_POMODORO, [
    {
      identifier: ACTION_SKIP_BREAK,
      buttonTitle: '⏭ Passer la pause',
      options: { opensAppToForeground: false },
    },
    {
      identifier: ACTION_STOP,
      buttonTitle: '⏹ Arrêter',
      options: { opensAppToForeground: true, isDestructive: true },
    },
  ]);
}

async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return status === 'granted';
}

async function scheduleEndNotif(
  endTimeMs: number,
  phase: Phase,
  count: number,
): Promise<string | null> {
  const granted = await requestPermissions();
  if (!granted) return null;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const secs = Math.max(1, Math.round((endTimeMs - Date.now()) / 1000));
  const isWork = phase === 'work';

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: isWork ? 'Session terminée !' : '🔥 C\'est reparti !',
      body:  isWork
        ? `Tu as complété ${count} pomodoro${count > 1 ? 's' : ''} aujourd'hui. Prends une pause ! 🎉`
        : `La pause est finie — concentration maximale ! (${count})`,
      sound: true,
      categoryIdentifier: isWork ? CATEGORY_POMODORO : undefined,
      ...(Platform.OS === 'ios'
        ? { subtitle: `Pomodoro ${count}/${SESSIONS_TOTAL}` }
        : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secs,
      repeats: false,
    },
  });
  return id;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (totalSec: number) => {
  const s   = Math.max(0, totalSec);
  const m   = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

const phaseLabel = (p: Phase) =>
  p === 'work' ? 'Travail' : p === 'short_break' ? 'Pause courte' : 'Pause longue';

const phaseColor = (p: Phase) => (p === 'work' ? Colors.flame : Colors.green);

const durationOf = (p: Phase) =>
  p === 'work' ? WORK_DURATION : p === 'short_break' ? SHORT_BREAK : LONG_BREAK;

// ─── Component ────────────────────────────────────────────────────────────────

export const FocusScreen: React.FC = () => {
  const {
    tasks, pomodoroSound, togglePomodoroSound,
    incrementPomodoro, selectedPomodoroTaskIds, setSelectedPomodoroTaskIds,
    pomodoroCount,
  } = useStore();

  const [remaining,      setRemaining]      = useState(WORK_DURATION);
  const [maxTime,        setMaxTime]        = useState(WORK_DURATION);
  const [running,        setRunning]        = useState(false);
  const [phase,          setPhase]          = useState<Phase>('work');
  const [sessions,       setSessions]       = useState([false, false, false, false]);
  const [sessionIdx,     setSessionIdx]     = useState(0);
  const [showTaskPicker, setShowTaskPicker] = useState(false);

  const runningRef    = useRef(false);
  const endTimeRef    = useRef<number | null>(null);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifIdRef    = useRef<string | null>(null);
  const phaseRef      = useRef<Phase>('work');
  const sessionIdxRef = useRef(0);

  runningRef.current    = running;
  phaseRef.current      = phase;
  sessionIdxRef.current = sessionIdx;

  // ── Notification category + response listener ──────────────────────────────
  useEffect(() => {
    registerCategory();

    const sub = Notifications.addNotificationResponseReceivedListener(resp => {
      const action = resp.actionIdentifier;
      if (action === ACTION_SKIP_BREAK) {
        startPhase('work', sessionIdxRef.current);
      } else if (action === ACTION_STOP) {
        handleReset();
      }
    });

    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── AppState: re-sync when foregrounded ───────────────────────────────────
  useEffect(() => {
    const onAppState = async (next: AppStateStatus) => {
      if (next !== 'active') return;
      const stored = await AsyncStorage.getItem(KEY_END_TIME);
      if (!stored) return;
      const endTime = parseInt(stored, 10);
      if (isNaN(endTime)) return;

      const leftMs = endTime - Date.now();
      if (leftMs <= 0) {
        await AsyncStorage.removeItem(KEY_END_TIME);
        handlePhaseEnd(phaseRef.current, sessionIdxRef.current);
      } else {
        endTimeRef.current = endTime;
        setRemaining(Math.ceil(leftMs / 1000));
      }
    };

    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tick (display only) ───────────────────────────────────────────────────
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        if (!endTimeRef.current) return;
        const left = Math.ceil((endTimeRef.current - Date.now()) / 1000);
        if (left <= 0) {
          clearInterval(intervalRef.current!);
          handlePhaseEnd(phaseRef.current, sessionIdxRef.current);
        } else {
          setRemaining(left);
        }
      }, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // ── Phase end ─────────────────────────────────────────────────────────────
  const handlePhaseEnd = useCallback(async (endedPhase: Phase, idx: number) => {
    clearInterval(intervalRef.current!);
    setRunning(false);
    endTimeRef.current = null;
    await AsyncStorage.removeItem(KEY_END_TIME);

    if (pomodoroSound) Vibration.vibrate([0, 400, 200, 400]);

    // Jouer le son approprié selon la phase terminée
    if (endedPhase === 'work') {
      await playWorkEndSound();
    } else {
      await playBreakEndSound();
    }

    if (endedPhase === 'work') {
      incrementPomodoro();
      setSessions(prev => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
      const nextIdx = Math.min(idx + 1, SESSIONS_TOTAL - 1);
      setSessionIdx(nextIdx);
      sessionIdxRef.current = nextIdx;
      const nextPhase: Phase = nextIdx % SESSIONS_TOTAL === 0 ? 'long_break' : 'short_break';
      startPhase(nextPhase, nextIdx);
    } else {
      startPhase('work', idx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoroSound, incrementPomodoro]);

  // ── Start phase ───────────────────────────────────────────────────────────
  const startPhase = useCallback(async (newPhase: Phase, idx: number) => {
    const dur     = durationOf(newPhase);
    const endTime = Date.now() + dur * 1000;

    endTimeRef.current = endTime;
    phaseRef.current   = newPhase;

    await AsyncStorage.multiSet([
      [KEY_END_TIME, endTime.toString()],
      [KEY_PHASE,    newPhase],
      [KEY_SESSION,  idx.toString()],
    ]);

    setPhase(newPhase);
    setMaxTime(dur);
    setRemaining(dur);
    setRunning(true);

    const id = await scheduleEndNotif(endTime, newPhase, pomodoroCount + 1);
    notifIdRef.current = id;
  }, [pomodoroCount]);

  // ── Toggle start/pause ────────────────────────────────────────────────────
  const handleToggle = useCallback(async () => {
    if (running) {
      const leftMs = endTimeRef.current ? endTimeRef.current - Date.now() : remaining * 1000;
      endTimeRef.current = null;
      setRunning(false);
      await AsyncStorage.multiSet([
        [KEY_REMAINING, leftMs.toString()],
        [KEY_END_TIME,  ''],
      ]);
      if (notifIdRef.current) {
        await Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
        notifIdRef.current = null;
      }
    } else {
      const stored   = await AsyncStorage.getItem(KEY_REMAINING);
      const leftMs   = stored ? parseInt(stored, 10) : remaining * 1000;
      const endTime  = Date.now() + leftMs;

      endTimeRef.current = endTime;
      await AsyncStorage.multiSet([
        [KEY_END_TIME,  endTime.toString()],
        [KEY_REMAINING, ''],
      ]);
      setRunning(true);

      const id = await scheduleEndNotif(endTime, phase, pomodoroCount + 1);
      notifIdRef.current = id;
    }
  }, [running, remaining, phase, pomodoroCount]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = useCallback(async () => {
    clearInterval(intervalRef.current!);
    setRunning(false);
    setPhase('work');
    setRemaining(WORK_DURATION);
    setMaxTime(WORK_DURATION);
    endTimeRef.current = null;
    await AsyncStorage.multiRemove([KEY_END_TIME, KEY_REMAINING, KEY_PHASE, KEY_SESSION]);
    if (notifIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
      notifIdRef.current = null;
    }
  }, []);

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const togglePomodoroTask = (id: string) => {
    setSelectedPomodoroTaskIds(
      selectedPomodoroTaskIds.includes(id)
        ? selectedPomodoroTaskIds.filter(i => i !== id)
        : [...selectedPomodoroTaskIds, id]
    );
  };

  const pendingTasks  = tasks.filter(t => !t.done);
  const selectedTasks = tasks.filter(t => selectedPomodoroTaskIds.includes(t.id));

  const progress       = remaining / maxTime;
  const dashOffset     = CIRCUMFERENCE * (1 - progress);
  const color          = phaseColor(phase);
  const isPaused       = !running && remaining < durationOf(phase);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.brand}>Ignite.</Text>
        </View>

        <Text style={styles.sectionLabel}>MINUTEUR POMODORO</Text>

        {/* Ring */}
        <View style={styles.ringWrap}>
          <Svg width={220} height={220} viewBox="0 0 220 220"
            style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={110} cy={110} r={RING_RADIUS}
              fill="none" stroke={Colors.surface2} strokeWidth={12} />
            <Circle
              cx={110} cy={110} r={RING_RADIUS}
              fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset}
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={styles.timerText}>{fmt(remaining)}</Text>
            <Text style={[styles.phaseText, { color }]}>{phaseLabel(phase)}</Text>
            {isPaused && <Text style={styles.pausedHint}>en pause</Text>}
          </View>
        </View>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {sessions.map((done, i) => (
            <View key={i} style={[
              styles.dot,
              done && styles.dotDone,
              i === sessionIdx && !done && styles.dotCurrent,
            ]} />
          ))}
        </View>

        <Text style={styles.countBadge}>
          {pomodoroCount} pomodoro{pomodoroCount !== 1 ? 's' : ''} aujourd'hui
        </Text>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.btnSecondary} onPress={handleReset}>
            <Text style={styles.btnSecondaryText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnPrimary, { backgroundColor: color }]}
            onPress={handleToggle}
          >
            <Text style={styles.btnPrimaryText}>
              {running ? '▐▐ Pause' : isPaused ? '▶︎ Reprendre' : '▶ Démarrer'}
            </Text>
          </TouchableOpacity>
        </View>


        {/* Tasks */}
        <View style={styles.taskSectionHeader}>
          <Text style={styles.sectionLabel}>TÂCHES ASSOCIÉES</Text>
          {tasks.length > 0 && (
            <TouchableOpacity onPress={() => setShowTaskPicker(v => !v)}>
              <Text style={styles.editLink}>{showTaskPicker ? 'Fermer' : 'Modifier'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {showTaskPicker && (
          <View style={styles.pickerCard}>
            <Text style={styles.pickerHint}>Sélectionnez une ou plusieurs tâches :</Text>
            {tasks.length === 0 ? (
              <Text style={styles.noTaskText}>Aucune tâche — ajoutez-en dans l'onglet Aujourd'hui.</Text>
            ) : tasks.map(t => {
              const sel = selectedPomodoroTaskIds.includes(t.id);
              return (
                <TouchableOpacity key={t.id}
                  style={[styles.pickerItem, sel && styles.pickerItemSelected]}
                  onPress={() => togglePomodoroTask(t.id)} activeOpacity={0.75}>
                  <View style={[styles.pickerCheck, sel && styles.pickerCheckSelected]}>
                    {sel && <Text style={styles.pickerCheckMark}>✓</Text>}
                  </View>
                  <Text style={[styles.pickerText, t.done && styles.pickerTextDone]}>{t.text}</Text>
                  {t.done && <Text style={styles.doneBadge}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {!showTaskPicker && selectedTasks.map(t => (
          <View key={t.id} style={[styles.taskChip, t.done && { opacity: 0.5 }]}>
            <View style={[styles.chipDot, { backgroundColor: color }]} />
            <Text style={[styles.chipText, t.done && styles.pickerTextDone]}>{t.text}</Text>
            {t.done && <Text style={styles.doneBadge}>✓</Text>}
          </View>
        ))}

        {!showTaskPicker && selectedTasks.length === 0 && pendingTasks.length > 0 && (
          <TouchableOpacity style={styles.addTaskCta} onPress={() => setShowTaskPicker(true)}>
            <Text style={styles.addTaskCtaText}>+ Associer des tâches au minuteur</Text>
          </TouchableOpacity>
        )}

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  brand:  { fontSize: 22, fontWeight: '800', color: Colors.flame },
  sectionLabel: {
    fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase',
    letterSpacing: 1, fontWeight: '600',
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  ringWrap: {
    alignItems: 'center', justifyContent: 'center',
    marginVertical: Spacing.lg, position: 'relative',
  },
  ringCenter:  { position: 'absolute', alignItems: 'center', gap: 2 },
  timerText:   { fontSize: 46, fontWeight: '800', color: Colors.text, letterSpacing: -2, lineHeight: 52 },
  phaseText:   { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
  bgHint:      { fontSize: 10, color: Colors.green, marginTop: 4, fontWeight: '500' },
  pausedHint:  { fontSize: 10, color: Colors.gold, marginTop: 4, fontWeight: '500' },
  dotsRow:     { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: Spacing.sm },
  dot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border },
  dotDone:     { backgroundColor: Colors.flame, borderColor: Colors.flame },
  dotCurrent:  { backgroundColor: Colors.gold, borderColor: Colors.gold },
  countBadge:  { textAlign: 'center', fontSize: 13, color: Colors.textMuted, fontWeight: '600', marginBottom: Spacing.lg },
  controls:    { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: Spacing.md, paddingHorizontal: Spacing.lg },
  btnPrimary:  { flex: 1, borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center' },
  btnPrimaryText:   { color: Colors.white, fontSize: 16, fontWeight: '700' },
  btnSecondary:     { paddingVertical: 14, paddingHorizontal: 28, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  btnSecondaryText: { color: Colors.text, fontSize: 16, fontWeight: '500' },
  infoBanner: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.xl,
    backgroundColor: 'rgba(255,107,53,0.07)',
    borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(255,107,53,0.2)',
    padding: Spacing.md,
  },
  infoText: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  taskSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  editLink:      { fontSize: 12, color: Colors.flame, fontWeight: '600' },
  pickerCard:    { marginHorizontal: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md, gap: 6 },
  pickerHint:    { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  noTaskText:    { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: 8 },
  pickerItem:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.sm, borderRadius: Radius.sm, borderWidth: 1, borderColor: 'transparent' },
  pickerItemSelected: { backgroundColor: 'rgba(255,107,53,0.08)', borderColor: 'rgba(255,107,53,0.25)' },
  pickerCheck:        { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  pickerCheckSelected: { backgroundColor: Colors.flame, borderColor: Colors.flame },
  pickerCheckMark: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  pickerText:      { flex: 1, fontSize: Typography.fontSizes.base, color: Colors.text },
  pickerTextDone:  { textDecorationLine: 'line-through', color: Colors.textMuted },
  doneBadge:       { fontSize: 12, color: Colors.green },
  taskChip:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginHorizontal: Spacing.lg, marginBottom: 8 },
  chipDot:         { width: 8, height: 8, borderRadius: 4 },
  chipText:        { fontSize: Typography.fontSizes.base, color: Colors.text, flex: 1 },
  addTaskCta:      { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  addTaskCtaText:  { fontSize: 13, color: Colors.textMuted },
});