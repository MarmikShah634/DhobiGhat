import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';
import { customersApi } from '../../api/customers';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { customer, setCustomer } = useAuthStore();
  const [name, setName] = useState(customer?.name ?? '');
  const [address, setAddress] = useState(customer?.address ?? '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await customersApi.updateProfile({ name: name.trim(), address: address.trim() || undefined });
      setCustomer(res.data);
      Alert.alert('Saved', 'Profile updated successfully.');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Input label="Full Name" value={name} onChangeText={setName} placeholder="Your full name" autoCapitalize="words" />
        <Input label="Home Address" value={address} onChangeText={setAddress} placeholder="Your delivery address" multiline />
        <Button label="Save Changes" onPress={handleSave} disabled={!name.trim()} loading={loading} />
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.discard}>Discard Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { padding: Spacing.lg, gap: Spacing.sm },
  back: { ...Typography.body, color: Colors.gold },
  title: { ...Typography.h1, color: Colors.textPrimary },
  scroll: { padding: Spacing.lg, gap: Spacing.base },
  discard: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
});
