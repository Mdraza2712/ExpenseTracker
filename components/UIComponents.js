import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { COLORS, SIZES, SHADOWS } from "../utils/theme";
import { getInitials } from "../utils/helpers";

// Avatar Component
export const Avatar = ({ name, size = 40, color, style }) => {
  const bgColor = color || COLORS.primary;
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
        },
        style,
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
};

// Button Component
export const Button = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  icon,
}) => {
  const btnStyles = [
    styles.btn,
    variant === "primary" && styles.btnPrimary,
    variant === "secondary" && styles.btnSecondary,
    variant === "outline" && styles.btnOutline,
    variant === "danger" && styles.btnDanger,
    variant === "ghost" && styles.btnGhost,
    size === "sm" && styles.btnSm,
    size === "lg" && styles.btnLg,
    (disabled || loading) && styles.btnDisabled,
    style,
  ];

  const textStyles = [
    styles.btnText,
    variant === "outline" && styles.btnOutlineText,
    variant === "ghost" && styles.btnGhostText,
    size === "sm" && styles.btnSmText,
  ];

  return (
    <TouchableOpacity
      style={btnStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? COLORS.primary : COLORS.white}
        />
      ) : (
        <View style={styles.btnContent}>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Card Component
export const Card = ({ children, style, onPress }) => {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

// Badge Component
export const Badge = ({ label, color, textColor, style }) => (
  <View
    style={[
      styles.badge,
      { backgroundColor: color || COLORS.primaryLight + "30" },
      style,
    ]}
  >
    <Text
      style={[
        styles.badgeText,
        { color: textColor || color || COLORS.primary },
      ]}
    >
      {label}
    </Text>
  </View>
);

// Input Component
export const Input = ({ label, error, style, containerStyle, ...props }) => (
  <View style={[styles.inputContainer, containerStyle]}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <TextInput
      style={[styles.input, error && styles.inputError, style]}
      placeholderTextColor={COLORS.textMuted}
      {...props}
    />
    {error && <Text style={styles.inputErrorText}>{error}</Text>}
  </View>
);

// Section Header
export const SectionHeader = ({ title, action, actionLabel }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={action}>
        <Text style={styles.sectionAction}>{actionLabel || "See all"}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Empty State
export const EmptyState = ({ icon, title, subtitle, action, actionLabel }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>{icon || "📭"}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    {action && (
      <Button
        title={actionLabel || "Add Now"}
        onPress={action}
        style={styles.emptyButton}
      />
    )}
  </View>
);

// Divider
export const Divider = ({ style }) => <View style={[styles.divider, style]} />;

// Chip
export const Chip = ({ label, selected, onPress, color }) => (
  <TouchableOpacity
    style={[
      styles.chip,
      selected && { backgroundColor: color || COLORS.primary },
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: SIZES.borderRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  btnSecondary: {
    backgroundColor: COLORS.surfaceLight,
  },
  btnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  btnDanger: {
    backgroundColor: COLORS.danger,
  },
  btnGhost: {
    backgroundColor: "transparent",
  },
  btnSm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  btnLg: {
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "600",
  },
  btnOutlineText: {
    color: COLORS.primary,
  },
  btnGhostText: {
    color: COLORS.textSecondary,
  },
  btnSmText: {
    fontSize: 13,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: SIZES.md,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: SIZES.borderRadiusSm,
    paddingHorizontal: SIZES.md,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  inputErrorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.sm,
    marginTop: SIZES.md,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "700",
  },
  sectionAction: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: SIZES.xxl,
    paddingHorizontal: SIZES.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SIZES.md,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SIZES.md,
  },
  emptyButton: {
    marginTop: SIZES.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SIZES.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginRight: SIZES.sm,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  chipTextSelected: {
    color: COLORS.white,
    fontWeight: "600",
  },
});
