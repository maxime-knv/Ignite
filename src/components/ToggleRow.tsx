import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme';

interface Props {
  label: string;
  subtitle?: string;
  value: boolean;
  onToggle: () => void;
}

export const ToggleRow: React.FC<Props> = ({ label, subtitle, value, onToggle }) => (
  <View style={styles.row}>
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      {subtitle && <Text style={styles.sub}>{subtitle}</Text>}
    </View>
    <TouchableOpacity onPress={onToggle} style={[styles.toggle, value && styles.toggleOn]}>
      <View style={[styles.dot, value && styles.dotOn]} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: { fontSize: Typography.fontSizes.base, color: Colors.text, fontWeight: Typography.fontWeights.medium },
  sub: { fontSize: Typography.fontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleOn: { backgroundColor: Colors.flame, borderColor: Colors.flame },
  dot: { width: 18, height: 18, borderRadius: Radius.full, backgroundColor: Colors.white, alignSelf: 'flex-start' },
  dotOn: { alignSelf: 'flex-end' },
});
