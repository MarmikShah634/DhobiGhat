import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Radius, Size, Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { Washerman } from '../../api/washermen';

interface WashermanCardProps {
  washerman: Washerman;
  onPress: () => void;
  onFavouriteToggle?: () => void;
  isFavourite?: boolean;
  startingPrice?: number;
}

function Stars({ rating }: { rating: number }) {
  return (
    <Text style={{ color: Colors.gold, fontSize: 13 }}>
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))} {rating.toFixed(1)}
    </Text>
  );
}

export function WashermanCard({
  washerman,
  onPress,
  onFavouriteToggle,
  isFavourite = false,
  startingPrice,
}: WashermanCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>
            {washerman.business_name.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{washerman.business_name}</Text>
          <Text style={styles.area}>{washerman.area}</Text>
          <View style={styles.row}>
            <Stars rating={washerman.avg_rating} />
            <Text style={styles.reviews}>({washerman.review_count})</Text>
          </View>
          {startingPrice !== undefined && (
            <View style={styles.priceChip}>
              <Text style={styles.priceText}>From ₹{(startingPrice / 100).toFixed(0)}</Text>
            </View>
          )}
        </View>
        <View style={styles.right}>
          <View style={[styles.dot, { backgroundColor: washerman.is_available ? Colors.success : Colors.textDisabled }]} />
          <Text style={[styles.availability, { color: washerman.is_available ? Colors.success : Colors.textDisabled }]}>
            {washerman.is_available ? 'Open' : 'Closed'}
          </Text>
          {onFavouriteToggle && (
            <TouchableOpacity onPress={onFavouriteToggle} style={styles.heart}>
              <Text style={{ fontSize: 20, color: isFavourite ? Colors.error : Colors.textDisabled }}>
                {isFavourite ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.card,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: `${Colors.gold}33`,
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  avatar: {
    width: Size.avatarMd,
    height: Size.avatarMd,
    borderRadius: Size.avatarMd / 2,
    backgroundColor: `${Colors.gold}33`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: `${Colors.gold}66`,
  },
  initials: {
    ...Typography.h4,
    color: Colors.gold,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  area: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviews: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  priceChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  priceText: {
    ...Typography.caption,
    color: Colors.gold,
    fontWeight: '600',
  },
  right: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availability: {
    ...Typography.tiny,
  },
  heart: {
    padding: 4,
    marginTop: 8,
  },
});
