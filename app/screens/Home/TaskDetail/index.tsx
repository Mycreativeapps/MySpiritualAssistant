import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { Text, Card, Button, Avatar, useTheme } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/material-icons';
import { useTaskStore } from '../../../store';
import { useThemeColors } from '../../../config/styles';
import createStyles from '../styles';

const TaskDetail: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { daily_task_id } = route.params || {};
  const { userTasks, updateTaskScore } = useTaskStore();

  const task = useMemo(() => {
    return userTasks.find(
      t => String(t.daily_task_id) === String(daily_task_id),
    );
  }, [userTasks, daily_task_id]);

  const options = useMemo(() => {
    if (!task?.options) return null;
    return typeof task.options === 'string'
      ? JSON.parse(task.options)
      : task.options;
  }, [task?.options]);

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hours12 = h % 12 || 12;
    return `${hours12}:${minutes} ${ampm}`;
  };

  const handleScoreUpdate = async (score: number) => {
    if (daily_task_id) {
      await updateTaskScore(daily_task_id, score);
      navigation.goBack();
    }
  };

  if (!task) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center', padding: 20 },
        ]}
      >
        <Icon name="error-outline" size={64} color={colors.subtext} />
        <Text style={{ fontSize: 18, color: colors.text, marginTop: 16 }}>
          Task not found
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 24 }}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
    >
      <Card style={[styles.dailyTaskCard, { opacity: 1 }]}>
        <Card.Title
          title={task.task_name}
          titleStyle={styles.dailyTaskName}
          subtitle={`Scheduled for ${formatTime(task.scheduled_time)}`}
          subtitleStyle={styles.dailyTaskTime}
          left={props => (
            <Avatar.Icon
              {...props}
              icon="schedule"
              color={colors.primary}
              style={{ backgroundColor: colors.primary + '15' }}
            />
          )}
        />
        <Card.Content style={{ marginTop: 16 }}>
          <Text style={[styles.heading, { fontSize: 18, marginBottom: 8 }]}>
            Select Progress
          </Text>
          <Text style={styles.subtitle}>
            How was your progress for this task?
          </Text>

          <View
            style={[
              styles.optionsContainer,
              { borderTopWidth: 0, paddingTop: 8 },
            ]}
          >
            {options &&
              Object.entries(options).map(([score, label]: [string, any]) => (
                <Button
                  key={score}
                  mode="outlined"
                  onPress={() => handleScoreUpdate(parseInt(score, 10))}
                  style={{
                    marginBottom: 12,
                    borderRadius: 12,
                    borderColor: colors.border,
                  }}
                  contentStyle={{
                    paddingVertical: 6,
                    justifyContent: 'flex-start',
                  }}
                  labelStyle={{ fontSize: 15, color: colors.text }}
                  icon={() => (
                    <View style={[styles.optionScoreBadge, { marginRight: 8 }]}>
                      <Text style={styles.optionScoreText}>{score}</Text>
                    </View>
                  )}
                >
                  {String(label)}
                </Button>
              ))}
          </View>
        </Card.Content>
      </Card>

      <Button
        mode="text"
        onPress={() => navigation.goBack()}
        style={{ marginTop: 16 }}
        labelStyle={{ color: colors.subtext }}
      >
        Cancel
      </Button>
    </ScrollView>
  );
};

export default TaskDetail;
