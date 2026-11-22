import { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, font, radius, shadow } from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

// ---------- Bouton ----------

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'soft';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}

const buttonColors: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.primary, fg: '#fff' },
  outline: { bg: colors.surface, fg: colors.primary, border: colors.primary },
  ghost: { bg: 'transparent', fg: colors.primary },
  danger: { bg: colors.danger, fg: '#fff' },
  soft: { bg: colors.primarySoft, fg: colors.primary },
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  small,
  style,
}: ButtonProps) {
  const c = buttonColors[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: c.bg },
        c.border ? { borderWidth: 1.5, borderColor: c.border } : null,
        pressed && !off && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        off && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 16 : 19} color={c.fg} /> : null}
          <Text style={[styles.buttonText, small && { fontSize: 14 }, { color: c.fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

// ---------- Bouton rond avec icône ----------

interface IconButtonProps {
  icon: IconName;
  onPress?: () => void;
  color?: string;
  background?: string;
  size?: number;
  badge?: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  onPress,
  color = colors.text,
  background = colors.surface,
  size = 44,
  badge,
  label,
  style,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      <Ionicons name={icon} size={Math.round(size * 0.48)} color={color} />
      {badge ? (
        <View style={styles.badgeDot}>
          <Text style={styles.badgeDotText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// ---------- Puce (chip) ----------

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
}

export function Chip({ label, selected, onPress, icon }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
    >
      {icon ? (
        <Ionicons name={icon} size={15} color={selected ? '#fff' : colors.muted} />
      ) : null}
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

// ---------- Pastille ----------

type PillTone = 'primary' | 'accent' | 'danger' | 'neutral' | 'dark';

const pillTones: Record<PillTone, { bg: string; fg: string }> = {
  primary: { bg: colors.primarySoft, fg: colors.primary },
  accent: { bg: colors.accentSoft, fg: '#A2620B' },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  neutral: { bg: '#EEF1F3', fg: colors.muted },
  dark: { bg: 'rgba(20,33,43,0.72)', fg: '#fff' },
};

export function Pill({
  label,
  tone = 'primary',
  icon,
  style,
}: {
  label: string;
  tone?: PillTone;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const t = pillTones[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={t.fg} /> : null}
      <Text style={[styles.pillText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

// ---------- Avatar (initiales) ----------

export function Avatar({ name, size = 44 }: { name?: string; size?: number }) {
  const initials =
    (name ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || '?';
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

// ---------- État vide / erreur ----------

interface EmptyStateProps {
  icon: IconName;
  title: string;
  text?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'primary' | 'danger';
}

export function EmptyState({ icon, title, text, actionLabel, onAction, tone = 'primary' }: EmptyStateProps) {
  const danger = tone === 'danger';
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, danger && { backgroundColor: colors.dangerSoft }]}>
        <Ionicons name={icon} size={30} color={danger ? colors.danger : colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {text ? <Text style={styles.emptyText}>{text}</Text> : null}
      {actionLabel ? (
        <AppButton label={actionLabel} onPress={onAction} variant="outline" small style={{ marginTop: 8 }} />
      ) : null}
    </View>
  );
}

// ---------- Carte et titres ----------

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({
  title,
  action,
  onAction,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={[font.h3, style]}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Ligne icône + texte (ville, surface, pièces…). */
export function IconText({
  icon,
  text,
  color = colors.muted,
  size = 13,
}: {
  icon: IconName;
  text: string;
  color?: string;
  size?: number;
}) {
  return (
    <View style={styles.iconText}>
      <Ionicons name={icon} size={size + 1} color={color} />
      <Text style={{ fontSize: size, color }} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonSmall: { height: 42, paddingHorizontal: 16, borderRadius: radius.sm + 2 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(1),
  },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeDotText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13, fontWeight: '500' },
  chipTextOn: { color: '#fff', fontWeight: '700' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  pillText: { fontSize: 12, fontWeight: '700' },
  avatar: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarText: { color: colors.primary, fontWeight: '800' },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    ...shadow(1),
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionAction: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  iconText: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
});
