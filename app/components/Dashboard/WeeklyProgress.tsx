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

  const getBarColor = (value: number, max: number, isToday: boolean) => {
    if (value === 0) return colors.subtext + '55'; // visible muted color for empty bars
    const ratio = value / max;
    if (ratio >= 0.75) return colors.primary;
    if (ratio >= 0.4) return '#FFA726'; // Orange
    return colors.error;
  };

  const getBarOpacity = (value: number) => (value === 0 ? 0.5 : 1);

  return (
    <Card style={[styles.card, { backgroundColor: colors.surface }]} mode="elevated">
      <Card.Content>
        <Text style={[styles.title, { color: colors.primary }]}>
          Weekly Progress
        </Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>Scores from the last 7 days</Text>

        <View style={styles.chartContainer}>
          {last7Days.map((day, index) => {
            const barHeight = (day.value / maxScore) * chartHeight;
            return (
              <View key={index} style={styles.barWrapper}>
                {/* Score label above bar */}
                <Text
                  style={[
                    styles.scoreLabel,
                    { color: day.value > 0 ? getBarColor(day.value, maxScore, day.isToday) : 'transparent' },
                  ]}
                >
                  {day.value > 0 ? day.value : ''}
                </Text>
                <View
                  style={[
                    styles.barBackground,
                    {
                      backgroundColor: colors.border + '25',
                      borderWidth: 1,
                      borderColor: colors.border + '40',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: day.value === 0 ? 4 : barHeight,
                        backgroundColor: getBarColor(day.value, maxScore, day.isToday),
                        opacity: getBarOpacity(day.value),
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.dayLabel,
                    { color: colors.subtext },
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
            <Text style={[styles.legendText, { color: colors.subtext }]}>Good</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#FFA726' }]} />
            <Text style={[styles.legendText, { color: colors.subtext }]}>Average</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors.error }]} />
            <Text style={[styles.legendText, { color: colors.subtext }]}>Low</Text>
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
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
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
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 3,
    textAlign: 'center',
  },
  dayLabel: {
    marginTop: 8,
    fontSize: 12,
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
    fontWeight: '600',
  },
});

export default WeeklyProgress;
