import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';
import { washermenApi } from '../../api/washermen';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { washerman, setWasherman } = useAuthStore();
  const [name, setName] = useState(washerman?.name ?? '');
  const [businessName, setBusinessName] = useState(washerman?.business_name ?? '');
  const [area, setArea] = useState(washerman?.area ?? '');
  const [address, setAddress] = useState(washerman?.address ?? '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !businessName.trim() || !area.trim()) {
      Alert.alert('Required', 'Name, business name, and area are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await washermenApi.updateProfile({
        name: name.trim(),
        business_name: businessName.trim(),
        area: area.trim(),
        address: address.trim() || undefined,
      });
      setWasherman(res.data);
      navigation.goBack();
    } catch { Alert.alert('Error', 'Could not save changes.'); }
    finally { setLoading(false); }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Input label="Full Name *" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
        <Input label="Business Name *" value={businessName} onChangeText={setBusinessName} placeholder="e.g. Ramesh Laundry" />
        <Input label="Service Area *" value={area} onChangeText={setArea} placeholder="e.g. Andheri West" />
        <Input label="Address (optional)" value={address} onChangeText={setAddress} placeholder="Your shop / home address" multiline />
        <Button label="Save Changes" onPress={handleSave} loading={loading} disabled={!name.trim() || !businessName.trim() || !area.trim()} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { padding: Spacing.lg, gap: Spacing.xs },
  back: { ...Typography.body, color: Colors.gold },
  title: { ...Typography.h2, color: Colors.textPrimary },
  scroll: { padding: Spacing.lg, paddingTop: 0, gap: Spacing.base, paddingBottom: 32 },
});
