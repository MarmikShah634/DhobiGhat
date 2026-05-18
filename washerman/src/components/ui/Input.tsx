import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { Radius, Size, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';

interface InputProps extends TextInputProps { label?: string; error?: string; containerStyle?: ViewStyle; }

export function Input({ label, error, containerStyle, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label && <Text style={{ ...Typography.bodyMedium, color: Colors.textSecondary }}>{label}</Text>}
      <View style={[styles.inputRow, focused && styles.focused, error ? styles.err : undefined]}>
        <TextInput style={styles.input} placeholderTextColor={Colors.textDisabled}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} {...props} />
      </View>
      {error && <Text style={{ ...Typography.caption, color: Colors.error }}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: { height: Size.inputHeight, backgroundColor: Colors.bgPrimary, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.surfaceBorder, paddingHorizontal: Spacing.base, justifyContent: 'center' },
  focused: { borderColor: Colors.gold },
  err: { borderColor: Colors.error },
  input: { ...Typography.bodyLarge, color: Colors.textPrimary, flex: 1 },
});
