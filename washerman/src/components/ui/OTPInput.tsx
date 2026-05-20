import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

export function OTPInput({ length = 6, onComplete }: { length?: number; onComplete: (otp: string) => void }) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    const updated = [...values];
    updated[index] = text.slice(-1);
    setValues(updated);
    if (text && index < length - 1) refs.current[index + 1]?.focus();
    if (updated.every(Boolean)) { refs.current[length - 1]?.blur(); onComplete(updated.join('')); }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !values[index] && index > 0) refs.current[index - 1]?.focus();
  };

  return (
    <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
      {Array(length).fill(null).map((_, i) => (
        <TextInput key={i} ref={(r) => { refs.current[i] = r; }}
          style={[styles.box, values[i] ? styles.filled : undefined]}
          value={values[i]} onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="numeric" maxLength={1} textAlign="center" selectTextOnFocus />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: 48, height: 56, backgroundColor: '#0A1628', borderRadius: 10, borderWidth: 1, borderColor: '#1E3A6E', ...Typography.h3, color: Colors.textPrimary },
  filled: { borderColor: Colors.gold },
});
