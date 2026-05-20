import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { Colors } from '../../theme/colors';
import { Radius } from '../../theme/spacing';
import { Typography } from '../../theme/typography';

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
}

export function OTPInput({ length = 6, onComplete }: OTPInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      const digits = text.slice(0, length).split('');
      const updated = [...Array(length).fill('')];
      digits.forEach((d, i) => { updated[i] = d; });
      setValues(updated);
      const filled = digits.length;
      if (filled < length) refs.current[filled]?.focus();
      else {
        refs.current[length - 1]?.blur();
        onComplete(updated.join(''));
      }
      return;
    }
    const updated = [...values];
    updated[index] = text;
    setValues(updated);
    if (text && index < length - 1) refs.current[index + 1]?.focus();
    if (updated.every(Boolean)) {
      refs.current[length - 1]?.blur();
      onComplete(updated.join(''));
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !values[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {Array(length).fill(null).map((_, i) => (
        <TextInput
          key={i}
          ref={(r) => { refs.current[i] = r; }}
          style={[styles.box, values[i] ? styles.filled : undefined]}
          value={values[i]}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="numeric"
          maxLength={length}
          textAlign="center"
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  box: {
    width: 48,
    height: 56,
    backgroundColor: '#0A1628',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#1E3A6E',
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  filled: {
    borderColor: Colors.gold,
  },
});
