import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useThemeColors } from '../../config/styles';

const { width } = Dimensions.get('window');

interface WeeklyProgressProps {
  history: any[];
  loading?: boolean;
}

const WeeklyProgress: React.FC<WeeklyProgressProps> = ({
  history = [],
  loading = false,
}) => {
  const colors = useThemeColors();

  // Prepare 7 days of data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().split('T')[0];
    const match = history.find(h => h.day?.split('T')[0] === dayStr);
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' })[0],
      value: match ? parseInt(match.total_score, 10) : 0,
      fullDate: dayStr,
      isToday: i === 6,
    };
  });

  const maxScore = Math.max(...last7Days.map(d => d.value), 10);
  const chartHeight = 120;

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        <Text style={[styles.title, { color: colors.primary }]}>
          Weekly Progress
        </Text>
        <Text style={styles.subtitle}>Scores from the last 7 days</Text>

        <View style={styles.chartContainer}>
          {last7Days.map((day, index) => {
            const barHeight = (day.value / maxScore) * chartHeight;
            return (
              <View key={index} style={styles.barWrapper}>
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: barHeight,
                        backgroundColor: day.isToday
                          ? colors.primary
                          : colors.primary + '60',
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.dayLabel,
                    day.isToday && {
                      color: colors.primary,
                      fontWeight: 'bold',
                    },
                  ]}
                >
                  {day.label}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.dot, { backgroundColor: colors.primary + '60' }]}
            />
            <Text style={styles.legendText}>Past Days</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    marginBottom: 24,
    elevation: 4,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    marginBottom: 24,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    height: 160,
    paddingBottom: 10,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    width: 14,
    height: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  dayLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  legend: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
});

export default WeeklyProgress;
