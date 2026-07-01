import React, { useMemo, useEffect, useState, useLayoutEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
  Pressable,
} from 'react-native';
import {
  Text,
  Avatar,
  Card,
  Button,
  Portal,
  Modal,
  Checkbox,
  IconButton,
  Divider,
  TextInput,
  RadioButton,
} from 'react-native-paper';
import Icon from '@react-native-vector-icons/material-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../../config/styles';
import { getUserStatsById, getUserScoreHistoryById } from '../../services/auth';
import { assignMentor, getMentees } from '../../services/hierarchy';
import {
  getMasterTasks,
  assignTaskToMentee,
  createRoutineForMentee,
} from '../../services/task';
import { Notifier, NotifierComponents } from 'react-native-notifier';
import { useUserStore } from '../../store';
import createStyles from './styles';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { updateUserRole } from '../../services/admin';
import WeeklyProgress from '../../components/Dashboard/WeeklyProgress';

interface PersonData {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  profile_url?: string;
  assign_mentor?: boolean;
  func?: string;
}

const PersonDetails: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const currentUser = useUserStore(state => state.user);
  const personData: PersonData = route.params?.personData;
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mentorLoading, setMentorLoading] = useState(false);
  const [isMentee, setIsMentee] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [masterTasks, setMasterTasks] = useState<any[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState<'master' | 'custom'>(
    'master',
  );

  // Custom Task Form State
  const [taskName, setTaskName] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [scheduleType, setScheduleType] = useState('daily');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [optionsList, setOptionsList] = useState<{ label: string }[]>([
    { label: '' },
    { label: '' },
  ]);
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const GlobalStyles = useMemo(() => createStyles(colors), [colors]);
  const styles = useMemo(() => createLocalStyles(colors), [colors]);

  useLayoutEffect(() => {
    if (personData?.func) {
      let title = personData.func
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      if (personData.func === 'assign_task') {
        title = 'Mentee Profile';
      }
      navigation.setOptions({ title });
    }
  }, [navigation, personData?.func]);

  const isOwnProfile = currentUser?.id === personData?.id;

  useEffect(() => {
    const fetchStats = async () => {
      if (!personData?.id) return;
      setLoading(true);
      if (personData.func === 'assign_task') {
        setHistoryLoading(true);
      }
      try {
        const promises: Promise<any>[] = [
          getUserStatsById(personData.id),
          getMentees(),
        ];

        if (personData.func === 'assign_task') {
          promises.push(getUserScoreHistoryById(personData.id));
        }

        const [statsRes, menteesRes, historyRes] = await Promise.all(promises);

        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }

        if (menteesRes.data.success) {
          const mentees = menteesRes.data.data;
          setIsMentee(mentees.some((m: any) => m.id === personData.id));
        }

        if (historyRes && historyRes.data.success) {
          setScoreHistory(historyRes.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch person stats:', error);
      } finally {
        setLoading(false);
        setHistoryLoading(false);
      }
    };

    fetchStats();
  }, [personData?.id]);

  const fetchMasterTasksList = async () => {
    try {
      const res = await getMasterTasks();
      if (res.data.success) {
        setMasterTasks(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch master tasks:', err);
    }
  };

  const toggleTaskSelection = (id: number) => {
    setSelectedTaskIds(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id],
    );
  };

  const handleAssignTasksToMentee = async () => {
    if (selectedTaskIds.length === 0) {
      return Alert.alert(
        'Selection Required',
        'Please select at least one task.',
      );
    }

    setAssigningLoading(true);
    try {
      const res = await assignTaskToMentee(personData.id, selectedTaskIds);
      if (res.data.success) {
        Notifier.showNotification({
          title: 'Success',
          description: `Routines pushed to ${personData.name} successfully.`,
          Component: NotifierComponents.Alert,
          componentProps: { alertType: 'success' },
        });
        setShowTaskModal(false);
        setSelectedTaskIds([]);
      }
    } catch (error: any) {
      Notifier.showNotification({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to assign tasks.',
        Component: NotifierComponents.Alert,
        componentProps: { alertType: 'error' },
      });
    } finally {
      setAssigningLoading(false);
    }
  };

  const handleCreateCustomRoutine = async () => {
    if (!taskName || !scheduledTime) {
      return Alert.alert(
        'Mandatory Fields',
        'Task name and scheduled time are mandatory.',
      );
    }

    if (optionsList.length < 2) {
      return Alert.alert(
        'Options Required',
        'At least 2 options are required.',
      );
    }

    const options: Record<string, string> = {};
    const n = optionsList.length;
    let hasError = false;

    optionsList.forEach((opt, index) => {
      if (!opt.label.trim()) {
        hasError = true;
        return;
      }
      let allocatedScore =
        n === 2
          ? index === 0
            ? 1
            : 10
          : Math.round(1 + (index * 9) / (n - 1));
      options[allocatedScore.toString()] = opt.label;
    });

    if (hasError)
      return Alert.alert('Empty Options', 'All options must have a label.');

    let start_date_str: string | undefined = undefined;
    let end_date_str: string | undefined = undefined;

    if (scheduleType === 'date_range') {
      if (!startDate || !endDate)
        return Alert.alert(
          'Dates Required',
          'Please select both start and end dates.',
        );
      start_date_str = startDate.toISOString().split('T')[0];
      end_date_str = endDate.toISOString().split('T')[0];
    }

    const payload = {
      task_name: taskName,
      scheduled_time: scheduledTime,
      options,
      ...(start_date_str ? { start_date: start_date_str } : {}),
      ...(end_date_str ? { end_date: end_date_str } : {}),
    };

    setAssigningLoading(true);
    try {
      const res = await createRoutineForMentee(personData.id, payload);
      if (res.data.success) {
        Notifier.showNotification({
          title: 'Success',
          description: `Custom routine created for ${personData.name}.`,
          Component: NotifierComponents.Alert,
          componentProps: { alertType: 'success' },
        });
        setShowTaskModal(false);
        setTaskName('');
        setScheduledTime('');
        setOptionsList([{ label: '' }, { label: '' }]);
      }
    } catch (error: any) {
      Notifier.showNotification({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to create routine.',
        Component: NotifierComponents.Alert,
        componentProps: { alertType: 'error' },
      });
    } finally {
      setAssigningLoading(false);
    }
  };

  const handlePromoteAdmin = async () => {
    try {
      const response = await updateUserRole(personData.id, 'admin');
      if (response.data.success) {
        Notifier.showNotification({
          title: 'Success',
          description: `${personData.name} is now an admin.`,
          Component: NotifierComponents.Alert,
          componentProps: { alertType: 'success' },
        });
        navigation.goBack();
      }
    } catch (error: any) {
      Notifier.showNotification({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to promote user to admin.',
        Component: NotifierComponents.Alert,
        componentProps: { alertType: 'error' },
      });
    }
  };

  const handleSetMentor = async () => {
    if (isOwnProfile)
      return Notifier.showNotification({
        title: 'Error',
        description: 'You cannot be your own mentor',
        Component: NotifierComponents.Alert,
        componentProps: { alertType: 'error' },
      });
    if (!personData?.id) return;
    setMentorLoading(true);
    try {
      const response = await assignMentor(personData.id);
      if (response.data.success) {
        Notifier.showNotification({
          title: 'Success',
          description: `You are now connected with ${personData.name} as your mentor.`,
          Component: NotifierComponents.Alert,
          componentProps: { alertType: 'success' },
        });
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Failed to assign mentor';
      Notifier.showNotification({
        title: 'Error',
        description: message,
        Component: NotifierComponents.Alert,
        componentProps: { alertType: 'error' },
      });
    } finally {
      setMentorLoading(false);
    }
  };

  const userInitials = useMemo(() => {
    const name = stats?.name || personData?.name;
    if (!name) return 'U';
    return name.trim().charAt(0).toUpperCase();
  }, [stats?.name, personData?.name]);

  const InfoRow = ({
    icon,
    label,
    value,
    onPress,
  }: {
    icon: string;
    label: string;
    value: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={GlobalStyles.infoRow}
      onPress={onPress}
      disabled={!onPress} // Disables the touch effect if no function is passed
      activeOpacity={0.7}
    >
      <View
        style={[
          GlobalStyles.iconWrapper,
          { backgroundColor: colors.primary + '15' },
        ]}
      >
        <Icon name={icon as any} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={GlobalStyles.infoLabel}>{label}</Text>
        <Text style={GlobalStyles.infoValue}>{value || 'Not provided'}</Text>
      </View>
    </TouchableOpacity>
  );

  if (!personData) {
    return (
      <View style={GlobalStyles.container}>
        <Text>No data available</Text>
      </View>
    );
  }

  const profileUrl = stats?.profile_url || personData?.profile_url;

  return (
    <ScrollView
      style={GlobalStyles.container}
      contentContainerStyle={GlobalStyles.scrollContent}
    >
      <View style={styles.header}>
        <View style={GlobalStyles.avatarContainer}>
          {profileUrl ? (
            <Avatar.Image
              size={120}
              source={{ uri: profileUrl }}
              style={GlobalStyles.avatar}
            />
          ) : (
            <Avatar.Text
              size={120}
              label={userInitials}
              style={GlobalStyles.avatar}
              labelStyle={{ fontSize: 48, fontWeight: 'bold' }}
            />
          )}
        </View>
        <Text style={GlobalStyles.userName}>
          {stats?.name || personData.name}
        </Text>
      </View>

      <Card style={GlobalStyles.infoCard} mode="elevated">
        <Card.Content>
          <Text style={GlobalStyles.sectionTitle}>Contact Information</Text>
          <InfoRow
            icon="email"
            label="Email"
            value={personData.email}
            onPress={() => {
              if (personData.email) {
                Linking.openURL(`mailto:${personData.email}`);
              }
            }}
          />
          <InfoRow
            icon="phone"
            label="Phone"
            value={personData.phone}
            onPress={() => {
              if (personData.phone) {
                Linking.openURL(`tel:${personData.phone}`);
              }
            }}
          />
          <InfoRow
            icon="person-outline"
            label="Gender"
            value={
              personData.gender
                ? personData.gender === 'male'
                  ? 'Prabhu'
                  : 'Mathaji'
                : ''
            }
          />
          {stats?.join_date && (
            <InfoRow
              icon="calendar-today"
              label="Member Since"
              value={new Date(stats.join_date).toLocaleDateString()}
            />
          )}
        </Card.Content>
      </Card>

      {personData.func === 'assign_task' && (
        <Card
          style={[GlobalStyles.infoCard, { marginTop: 16 }]}
          mode="elevated"
        >
          <Card.Content>
            <Text style={GlobalStyles.sectionTitle}>Activity Summary</Text>
            {loading ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ padding: 20 }}
              />
            ) : (
              <View style={GlobalStyles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={GlobalStyles.statValue}>
                    {stats?.tasks_completed || 0}
                  </Text>
                  <Text style={{ color: colors.text }}>Tasks</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statBox}>
                  <Text style={GlobalStyles.statValue}>
                    {stats?.lifetime_score || 0}
                  </Text>
                  <Text style={{ color: colors.text }}>Score</Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {personData.func === 'assign_task' && (
        <View style={{ marginTop: 16 }}>
          {historyLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ padding: 20 }}
            />
          ) : (
            <WeeklyProgress history={scoreHistory || []} />
          )}
        </View>
      )}

      {/* {personData.func === 'assign_task' && (
        <Button
          mode="contained"
          onPress={() => {
            fetchMasterTasksList();
            setShowTaskModal(true);
          }}
          style={{
            marginTop: 16,
            borderRadius: 12,
            backgroundColor: colors.primary,
          }}
          icon="assignment"
          textColor="white"
        >
          Assign Task
        </Button>
      )} */}

      {personData.func === 'assign_mentor' && (
        <Button
          mode="contained"
          onPress={handleSetMentor}
          loading={mentorLoading}
          disabled={mentorLoading}
          style={{ marginTop: 24, borderRadius: 12 }}
          buttonColor={isOwnProfile ? colors.primary + '90' : colors.primary}
          icon={isOwnProfile ? 'person-off' : 'person-add'}
          textColor="white"
        >
          {isOwnProfile ? 'You cannot be your own mentor' : 'Set as My Mentor'}
        </Button>
      )}

      {personData.func === 'promote_admin' && (
        <Button
          mode="contained"
          onPress={handlePromoteAdmin}
          loading={mentorLoading}
          disabled={mentorLoading}
          style={{ marginTop: 24, borderRadius: 12 }}
          buttonColor={isOwnProfile ? colors.primary + '90' : colors.primary}
          icon={isOwnProfile ? 'person-off' : 'admin-panel-settings'}
          textColor="white"
        >
          {isOwnProfile ? 'You cannot be your own admin' : 'Promote to Admin'}
        </Button>
      )}

      <Portal>
        <Modal
          visible={showTaskModal}
          onDismiss={() => setShowTaskModal(false)}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: colors.surface },
          ]}
        >
          <View style={styles.modalHeader}>
            <View>
              <Text
                variant="headlineSmall"
                style={{
                  marginBottom: 4,
                  fontWeight: 'bold',
                  color: colors.primary,
                }}
              >
                Assign Task
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: colors.subtext, marginBottom: 24 }}
              >
                Assign a {assignmentMode} spiritual activity to{' '}
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                  {personData.name}
                </Text>
              </Text>
            </View>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setShowTaskModal(false)}
            />
          </View>

          <View style={styles.tabContainer}>
            <Pressable
              style={[
                styles.tab,
                assignmentMode === 'master' && styles.activeTab,
                { borderColor: colors.primary },
              ]}
              onPress={() => setAssignmentMode('master')}
            >
              <Text
                style={[
                  GlobalStyles.tabText,
                  assignmentMode === 'master' && { color: colors.primary },
                ]}
              >
                Master
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tab,
                assignmentMode === 'custom' && styles.activeTab,
                { borderColor: colors.primary },
              ]}
              onPress={() => setAssignmentMode('custom')}
            >
              <Text
                style={[
                  GlobalStyles.tabText,
                  assignmentMode === 'custom' && { color: colors.primary },
                ]}
              >
                Custom
              </Text>
            </Pressable>
          </View>

          {assignmentMode === 'master' ? (
            <>
              <Text style={GlobalStyles.modalSubtitle}>
                Select spiritual tasks for {personData.name}
              </Text>

              <ScrollView
                style={GlobalStyles.taskList}
                showsVerticalScrollIndicator={false}
              >
                {masterTasks.map(task => (
                  <View key={task.id}>
                    <Pressable
                      onPress={() => toggleTaskSelection(task.id)}
                      style={[
                        GlobalStyles.taskItem,
                        selectedTaskIds.includes(task.id) && {
                          backgroundColor: colors.primary,
                        },
                      ]}
                    >
                      <View style={styles.taskInfo}>
                        <Text style={GlobalStyles.taskName}>
                          {task.task_name}
                        </Text>
                        <Text
                          style={[
                            GlobalStyles.taskTime,
                            selectedTaskIds.includes(task.id) && {
                              color: colors.secondary,
                            },
                          ]}
                        >
                          {task.scheduled_time}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>

              <Button
                mode="contained"
                onPress={handleAssignTasksToMentee}
                loading={assigningLoading}
                disabled={assigningLoading || selectedTaskIds.length === 0}
                style={styles.modalButton}
              >
                Push to Mentee
              </Button>
            </>
          ) : (
            <ScrollView style={styles.customForm}>
              <TextInput
                label="Task Name"
                placeholder="e.g., Evening Reading"
                value={taskName}
                onChangeText={setTaskName}
                mode="outlined"
                style={{ marginBottom: 16, backgroundColor: colors.surface }}
                textColor={colors.text}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              <Pressable onPress={() => setShowTimePicker(true)}>
                <View pointerEvents="none">
                  <TextInput
                    label="Scheduled Time"
                    value={scheduledTime}
                    mode="outlined"
                    placeholder="e.g., 08:00 AM"
                    style={{
                      backgroundColor: colors.surface,
                      marginBottom: 24,
                    }}
                    textColor={colors.text}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    left={
                      <TextInput.Icon
                        icon={() => (
                          <Icon
                            name="access-time"
                            size={20}
                            color={colors.subtext}
                          />
                        )}
                      />
                    }
                  />
                </View>
              </Pressable>

              <DateTimePickerModal
                isVisible={showTimePicker}
                mode="time"
                onConfirm={date => {
                  const hours = date.getHours();
                  const minutes = date.getMinutes();
                  // We need it in standard 24-hr format HH:mm as per database format.
                  const formattedHours = hours.toString().padStart(2, '0');
                  const formattedMinutes = minutes.toString().padStart(2, '0');
                  setScheduledTime(`${formattedHours}:${formattedMinutes}`);
                  setShowTimePicker(false);
                }}
                onCancel={() => setShowTimePicker(false)}
              />

              <Divider
                style={{ marginBottom: 16, backgroundColor: colors.border }}
              />

              <Text
                variant="titleMedium"
                style={{
                  fontWeight: 'bold',
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Scheduling Type
              </Text>
              <RadioButton.Group
                onValueChange={newValue => setScheduleType(newValue)}
                value={scheduleType}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <RadioButton value="daily" color={colors.primary} />
                  <Text style={{ color: colors.text, marginLeft: 8 }}>
                    Daily (Repeat indefinitely)
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <RadioButton value="date_range" color={colors.primary} />
                  <Text style={{ color: colors.text, marginLeft: 8 }}>
                    Select Dates
                  </Text>
                </View>
              </RadioButton.Group>

              {scheduleType === 'date_range' && (
                <View style={{ marginBottom: 24 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}
                  >
                    <Pressable
                      style={{ flex: 1 }}
                      onPress={() => setShowStartDatePicker(true)}
                    >
                      <TextInput
                        label="Start Date"
                        value={
                          startDate ? startDate.toISOString().split('T')[0] : ''
                        }
                        mode="outlined"
                        editable={false}
                        placeholder="Select"
                        style={{ backgroundColor: colors.surface }}
                        textColor={colors.text}
                        outlineColor={colors.border}
                        right={<TextInput.Icon icon="calendar-today" />}
                      />
                    </Pressable>
                    <Pressable
                      style={{ flex: 1 }}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <TextInput
                        label="End Date"
                        value={
                          endDate ? endDate.toISOString().split('T')[0] : ''
                        }
                        mode="outlined"
                        editable={false}
                        placeholder="Select"
                        style={{ backgroundColor: colors.surface }}
                        textColor={colors.text}
                        outlineColor={colors.border}
                        right={<TextInput.Icon icon="calendar-today" />}
                      />
                    </Pressable>
                  </View>
                </View>
              )}

              <Divider
                style={{ marginBottom: 24, backgroundColor: colors.border }}
              />

              <Divider
                style={{ marginBottom: 24, backgroundColor: colors.border }}
              />

              <Text
                variant="titleMedium"
                style={{
                  fontWeight: 'bold',
                  color: colors.text,
                  marginBottom: 8,
                }}
              >
                Scoring Configuration
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: colors.subtext, marginBottom: 16 }}
              >
                Define between 2 and 10 options. Scores will automatically
                evaluate between 1 and 10 based on position.
              </Text>

              {optionsList.map((opt, idx) => {
                const n = optionsList.length;
                const allocatedScore =
                  n === 2
                    ? idx === 0
                      ? 1
                      : 10
                    : Math.round(1 + (idx * 9) / (n - 1));

                return (
                  <View key={idx} style={styles.optionRow}>
                    <TextInput
                      label={`Score ${allocatedScore}`}
                      value={opt.label}
                      onChangeText={text => {
                        const newList = [...optionsList];
                        newList[idx].label = text;
                        setOptionsList(newList);
                      }}
                      mode="outlined"
                      style={[GlobalStyles.input, { flex: 1, marginBottom: 0 }]}
                    />

                    <View
                      style={{
                        flexDirection: 'column',
                        marginLeft: 4,
                        height: 50,
                        justifyContent: 'center',
                      }}
                    >
                      <IconButton
                        icon="keyboard-arrow-up"
                        size={18}
                        iconColor={colors.primary}
                        onPress={() => {
                          const newList = [...optionsList];
                          const temp = newList[idx - 1];
                          newList[idx - 1] = newList[idx];
                          newList[idx] = temp;
                          setOptionsList(newList);
                        }}
                        disabled={idx === 0}
                        style={{ margin: 0, padding: 0, height: 22 }}
                      />
                      <IconButton
                        icon="keyboard-arrow-down"
                        size={18}
                        iconColor={colors.primary}
                        onPress={() => {
                          const newList = [...optionsList];
                          const temp = newList[idx + 1];
                          newList[idx + 1] = newList[idx];
                          newList[idx] = temp;
                          setOptionsList(newList);
                        }}
                        disabled={idx === optionsList.length - 1}
                        style={{ margin: 0, padding: 0, height: 22 }}
                      />
                    </View>

                    <IconButton
                      icon="close"
                      onPress={() => {
                        const newList = [...optionsList];
                        newList.splice(idx, 1);
                        setOptionsList(newList);
                      }}
                      disabled={optionsList.length <= 2}
                    />
                  </View>
                );
              })}
              {optionsList.length < 10 && (
                <Button
                  onPress={() =>
                    setOptionsList([...optionsList, { label: '' }])
                  }
                >
                  + Add Option
                </Button>
              )}

              <Button
                mode="contained"
                onPress={handleCreateCustomRoutine}
                loading={assigningLoading}
                disabled={assigningLoading}
                style={[styles.modalButton, { marginTop: 20 }]}
              >
                Create for Mentee
              </Button>
            </ScrollView>
          )}
        </Modal>
      </Portal>

      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        onConfirm={time => {
          setScheduledTime(
            time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          );
          setShowTimePicker(false);
        }}
        onCancel={() => setShowTimePicker(false)}
      />

      <DateTimePickerModal
        isVisible={showStartDatePicker}
        mode="date"
        onConfirm={date => {
          setStartDate(date);
          setShowStartDatePicker(false);
        }}
        onCancel={() => setShowStartDatePicker(false)}
      />

      <DateTimePickerModal
        isVisible={showEndDatePicker}
        mode="date"
        onConfirm={date => {
          setEndDate(date);
          setShowEndDatePicker(false);
        }}
        onCancel={() => setShowEndDatePicker(false)}
        minimumDate={startDate || undefined}
      />
    </ScrollView>
  );
};

const createLocalStyles = (colors: any) => StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  modalContent: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  taskTime: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: 2,
  },
  modalButton: {
    marginTop: 10,
    borderRadius: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeTab: {
    backgroundColor: colors.primary + '10',
    borderWidth: 2,
  },
  customForm: {
    marginTop: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.subtext,
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dateRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
});

export default PersonDetails;
