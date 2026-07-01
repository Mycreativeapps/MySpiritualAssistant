import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import Icon from '@react-native-vector-icons/material-icons';
import { useThemeColors } from '../../config/styles';

interface BhaktiScoreCardProps {
  lifetimeScore: number;
  loading?: boolean;
  enableMilestones?: boolean;
}

const BhaktiScoreCard: React.FC<BhaktiScoreCardProps> = ({
  lifetimeScore = 0,
  loading = false,
  enableMilestones = true,
}) => {
  const colors = useThemeColors();

  return (
    <Card style={[styles.card, { backgroundColor: colors.surface }]} mode="elevated">
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.primary }]}>
              Bhakti Health Score
            </Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>Your spiritual growth status</Text>
          </View>
        </View>

        <View style={[styles.scoreRow, { backgroundColor: colors.border + '30' }]}>
          <View style={[styles.scoreItem, !enableMilestones && { justifyContent: 'center' }]}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: colors.primary + '15' },
              ]}
            >
              <Icon name="stars" size={24} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.scoreValue, { color: colors.text }]}>{lifetimeScore}</Text>
              <Text style={[styles.scoreLabel, { color: colors.subtext }]}>Lifetime Score</Text>
            </View>
          </View>

          {enableMilestones && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.scoreItem}>
                <View style={[styles.iconBox, { backgroundColor: '#4CAF5015' }]}>
                  <Icon name="trending-up" size={24} color="#4CAF50" />
                </View>
                <View>
                  <Text style={[styles.scoreValue, { color: '#4CAF50' }]}>
                    {Math.floor(lifetimeScore / 100) + 1}
                  </Text>
                  <Text style={[styles.scoreLabel, { color: colors.subtext }]}>Milestones</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    marginVertical: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  scoreItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 30,
    marginHorizontal: 16,
  },
});

export default BhaktiScoreCard;
