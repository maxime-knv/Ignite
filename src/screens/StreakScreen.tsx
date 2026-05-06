import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { Colors, Radius, Spacing, Typography } from '../theme';

const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const RANKS = [
  { emoji: '🕯️', name: 'Étincelle', days: 7, desc: 'Le voyage commence.' },
  { emoji: '🔥', name: 'Flamme Ardente', days: 30, desc: 'La routine prend forme.' },
  { emoji: '🌋', name: 'Inferno', days: 90, desc: 'Rien ne vous arrête.' },
  { emoji: '⚡', name: 'Légende', days: 365, desc: 'Le rang ultime. Peu y accèdent.' },
];

const getCurrentRank = (streak: number) => {
  let rank = RANKS[0];
  for (const r of RANKS) { if (streak >= r.days) rank = r; }
  return rank;
};

const getNextRank = (streak: number) => {
  for (const r of RANKS) { if (streak < r.days) return r; }
  return null;
};

export const StreakScreen: React.FC = () => {
  const { currentStreak, bestStreak, dayLogs } = useStore();
  const { width } = useWindowDimensions();
  const totalCompleted = dayLogs.filter(l => l.completed).length;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDate = now.getDate();

  const firstDow = new Date(year, month, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const completedDates = new Set(
    dayLogs
      .filter(l => l.completed)
      .map(l => {
        const d = new Date(l.date);
        if (d.getFullYear() === year && d.getMonth() === month) return d.getDate();
        return null;
      })
      .filter(Boolean)
  );

  const currentRank = getCurrentRank(currentStreak);
  const nextRank = getNextRank(currentStreak);

  // Calculate cell size based on screen width
  const calPadding = Spacing.lg * 2 + Spacing.lg * 2; // card margins + internal padding
  const calWidth = width - calPadding;
  const cellSize = Math.floor(calWidth / 7);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.brand}>Ignite.</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Série actuelle</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{bestStreak}</Text>
            <Text style={styles.statLabel}>Meilleure série</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{totalCompleted}</Text>
            <Text style={styles.statLabel}>Jours complétés</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calCard}>
          <Text style={styles.calTitle}>{MONTHS[month]} {year}</Text>
          {/* Week header */}
          <View style={styles.weekRow}>
            {WEEK_DAYS.map((d, i) => (
              <View key={i} style={[styles.cellBase, { width: cellSize, height: 24 }]}>
                <Text style={styles.weekDay}>{d}</Text>
              </View>
            ))}
          </View>
          {/* Days grid */}
          <View style={styles.grid}>
            {Array(offset).fill(0).map((_, i) => (
              <View key={`e-${i}`} style={{ width: cellSize, height: cellSize }} />
            ))}
            {Array(daysInMonth).fill(0).map((_, i) => {
              const day = i + 1;
              const isDone = completedDates.has(day);
              const isToday = day === todayDate;
              return (
                <View
                  key={day}
                  style={[
                    styles.dayCell,
                    { width: cellSize, height: cellSize },
                    isDone && styles.dayCellDone,
                    isToday && styles.dayCellToday,
                  ]}
                >
                  {isDone ? (
                    <Text style={[styles.dayCellFlame, { fontSize: Math.min(cellSize * 0.55, 22) }]}>🔥</Text>
                  ) : (
                    <Text style={[styles.dayCellNum, isToday && { color: Colors.flame }, { fontSize: Math.min(cellSize * 0.38, 14) }]}>
                      {day}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Rank */}
        <Text style={styles.sectionLabel}>RANG ACTUEL</Text>
        <View style={[styles.rankCard, styles.rankCurrent]}>
          <Text style={styles.rankEmoji}>{currentRank.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.rankName}>{currentRank.name}</Text>
            <Text style={styles.rankDesc}>{currentRank.desc}</Text>
          </View>
        </View>

        {/* Next ranks */}
        {RANKS.filter(r => r.days > currentStreak).length > 0 && (
          <Text style={styles.sectionLabel}>PROCHAINS RANGS</Text>
        )}
        {RANKS.filter(r => r.days > currentStreak).map((r, i) => (
          <View key={i} style={[styles.rankCard, { opacity: Math.max(0.4 - i * 0.08, 0.15) }]}>
            <Text style={styles.rankEmoji}>{r.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rankName}>{r.name}</Text>
              <Text style={styles.rankDesc}>{r.days - currentStreak} jours restants</Text>
            </View>
          </View>
        ))}

        {nextRank && (
          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <Text style={styles.progressLabel}>Vers {nextRank.name}</Text>
              <Text style={styles.progressPct}>{currentStreak}/{nextRank.days}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min((currentStreak / nextRank.days) * 100, 100)}%` as any }]} />
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  brand: { fontSize: 22, fontWeight: '800', color: Colors.flame, marginBottom: Spacing.base },
  statsRow: { flexDirection: 'row', marginHorizontal: Spacing.lg, gap: 10, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, alignItems: 'center',
  },
  statNum: { fontSize: 28, fontWeight: '800', color: Colors.flame, lineHeight: 32 },
  statLabel: {
    fontSize: 9, color: Colors.textMuted, textTransform: 'uppercase',
    letterSpacing: 0.5, marginTop: 4, textAlign: 'center',
  },
  calCard: {
    marginHorizontal: Spacing.lg, backgroundColor: Colors.surface,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  calTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  cellBase: { alignItems: 'center', justifyContent: 'center' },
  weekDay: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 6, borderWidth: 1, borderColor: 'transparent',
  },
  dayCellDone: { backgroundColor: 'rgba(255,107,53,0.12)', borderColor: 'rgba(255,107,53,0.3)' },
  dayCellToday: { borderColor: Colors.flame },
  dayCellFlame: {},
  dayCellNum: { color: Colors.textMuted },
  sectionLabel: {
    fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase',
    letterSpacing: 1, fontWeight: '600',
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  rankCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginHorizontal: Spacing.lg, marginBottom: 8,
  },
  rankCurrent: { borderColor: 'rgba(255,107,53,0.4)', backgroundColor: 'rgba(255,107,53,0.05)' },
  rankEmoji: { fontSize: 28 },
  rankName: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  rankDesc: { fontSize: 12, color: Colors.textMuted },
  progressCard: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.base,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, color: Colors.textMuted },
  progressPct: { fontSize: 12, color: Colors.flame, fontWeight: '600' },
  progressBar: {
    height: 6, backgroundColor: Colors.surface2,
    borderRadius: Radius.full, overflow: 'hidden',
  },
  progressFill: { height: 6, backgroundColor: Colors.flame, borderRadius: Radius.full },
});
