import React, { useState, memo, useEffect } from 'react';
import { View, Pressable, Alert, ScrollView } from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Divider,
  IconButton,
  Portal,
  Modal,
  RadioButton,
  Switch,
  Checkbox,
  ActivityIndicator,
} from 'react-native-paper';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icon from '@react-native-vector-icons/material-icons';
import moment from 'moment';
import { useTaskStore } from '../../store';
import { useThemeColors } from '../../config/styles';

interface CreateTaskModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
  taskToEdit?: any;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  onDismiss,
  onSuccess,
  taskToEdit,
}) => {
  const colors = useThemeColors();
  const { createCustomTask, updateCustomTask, loading } = useTaskStore();

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [useScheduledTime, setUseScheduledTime] = useState(true);
  const [notificationTimes, setNotificationTimes] = useState<string[]>([]);
  const [showNotificationTimePicker, setShowNotificationTimePicker] = useState(false);
  const [editingNotificationIndex, setEditingNotificationIndex] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setIsReady(true), 150);
      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
    }
  }, [visible]);

  useEffect(() => {
    if (taskToEdit) {
      setTaskName(taskToEdit.task_name || '');
      
      // format scheduled time (e.g., "08:00:00" to "08:00")
      let st = taskToEdit.scheduled_time || '';
      if (st.length > 5) {
        st = st.substring(0, 5);
      }
      setScheduledTime(st);
      
      setNotificationsEnabled(taskToEdit.notifications_enabled ?? true);
      
      let nTimes = taskToEdit.notification_times || [];
      if (typeof nTimes === 'string') {
        try { nTimes = JSON.parse(nTimes); } catch(e) { nTimes = []; }
      }
      if (!Array.isArray(nTimes)) nTimes = [];
      setNotificationTimes(nTimes);
      setUseScheduledTime(nTimes.length === 0);
      
      // Handle options
      let parsedOptions = taskToEdit.options || {};
      if (typeof parsedOptions === 'string') {
        try { parsedOptions = JSON.parse(parsedOptions); } catch(e) {}
      }
      
      const optionsArr = [];
      const keys = Object.keys(parsedOptions).map(Number).sort((a,b)=>a-b);
      for (const k of keys) {
        optionsArr.push({ label: parsedOptions[k] });
      }
      if (optionsArr.length < 2) {
        optionsArr.push({ label: '' });
        optionsArr.push({ label: '' });
      }
      setOptionsList(optionsArr);
      
      // Schedule type mapping logic could be expanded if start/end dates are used, for now assume daily
      setScheduleType('daily');
    } else {
      resetForm();
    }
  }, [taskToEdit, visible]);

  const handleCreateCustomTask = async () => {
    if (!taskName) {
      Alert.alert('Error', 'Task name is mandatory.');
      return;
    }

    if (optionsList.length < 2 || optionsList.length > 10) {
      Alert.alert('Error', 'Tasks must have between 2 and 10 options.');
      return;
    }

    const options: Record<string, string> = {};
    const n = optionsList.length;

    let hasError = false;
    optionsList.forEach((opt, index) => {
      if (!opt.label.trim()) {
        Alert.alert('Error', 'All options must have a label completed.');
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

    if (hasError) return;

    let start_date_str: string | undefined = undefined;
    let end_date_str: string | undefined = undefined;

    if (scheduleType === 'date_range') {
      if (!startDate || !endDate) {
        Alert.alert('Error', 'Please select both Start Date and End Date.');
        return;
      }
      if (startDate > endDate) {
        Alert.alert('Error', 'Start Date cannot be after End Date.');
        return;
      }
      start_date_str = startDate.toISOString().split('T')[0];
      end_date_str = endDate.toISOString().split('T')[0];
    }

    const payload = {
      task_name: taskName,
      scheduled_time: scheduledTime || '',
      notification_times: notificationTimes,
      options,
      ...(start_date_str ? { start_date: start_date_str } : {}),
      ...(end_date_str ? { end_date: end_date_str } : {}),
      notifications_enabled: notificationsEnabled,
    };

    let success = false;
    if (taskToEdit) {
      success = await updateCustomTask(taskToEdit.routine_id, payload);
    } else {
      success = await createCustomTask(payload);
    }

    if (success) {
      resetForm();
      onSuccess();
    } else {
      Alert.alert('Error', taskToEdit ? 'Failed to update task.' : 'Failed to create personal task.');
    }
  };

  const resetForm = () => {
    setTaskName('');
    setScheduledTime('');
    setScheduleType('daily');
    setStartDate(null);
    setEndDate(null);
    setOptionsList([{ label: '' }, { label: '' }]);
    setNotificationsEnabled(true);
    setUseScheduledTime(true);
    setNotificationTimes([]);
  };

  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={{
          backgroundColor: colors.background,
          margin: 20,
          borderRadius: 16,
          maxHeight: '80%',
          borderWidth: 1,
          borderColor: colors.primary + '50',
        }}
      >
        {!isReady ? (
          <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ padding: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text
                    variant="headlineSmall"
                    style={{
                      marginBottom: 4,
                      fontWeight: 'bold',
                      color: colors.primary,
                    }}
                  >
                    {taskToEdit ? 'Edit Personal Task' : 'Create Personal Task'}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: colors.subtext, marginBottom: 24 }}
                  >
                    {taskToEdit ? 'Update your personal spiritual activity.' : 'Add a custom spiritual activity to your daily routine.'}
                  </Text>
                </View>
              </View>

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
                    value={scheduledTime ? moment(scheduledTime, 'HH:mm').format('hh:mm A') : ''}
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

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 10,
                  paddingHorizontal: 4,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  backgroundColor: colors.surface,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon
                    name={notificationsEnabled ? 'notifications-active' : 'notifications-off'}
                    size={22}
                    color={notificationsEnabled ? colors.primary : colors.subtext}
                  />
                  <Text style={{ color: colors.text, fontSize: 14 }}>Notifications</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  color={colors.primary}
                />
              </View>

              <DateTimePickerModal
                isVisible={showTimePicker}
                mode="time"
                onConfirm={date => {
                  const hours = date.getHours();
                  const minutes = date.getMinutes();
                  const formattedHours = hours.toString().padStart(2, '0');
                  const formattedMinutes = minutes.toString().padStart(2, '0');
                  setScheduledTime(`${formattedHours}:${formattedMinutes}`);
                  setShowTimePicker(false);
                }}
                onCancel={() => setShowTimePicker(false)}
              />

              <Divider style={{ marginBottom: 16, backgroundColor: colors.border }} />

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 }}>
                <Icon name="notifications-active" size={18} color={colors.primary} />
                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: colors.text }}>
                  Notification Times
                </Text>
              </View>
              <Text variant="bodySmall" style={{ color: colors.subtext, marginBottom: 12 }}>
                {scheduledTime
                  ? "Scheduled time is notified by default. Add extra reminders below."
                  : "Add notification reminders below for this task."}
              </Text>

              {scheduledTime ? (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  backgroundColor: colors.primary + '18',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.primary + '50',
                  marginBottom: 8,
                  gap: 8,
                }}>
                  <Icon name="alarm-on" size={16} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15, flex: 1 }}>
                    {moment(scheduledTime, 'HH:mm').format('hh:mm A')}
                  </Text>
                  <Text style={{ color: colors.primary, fontSize: 11, opacity: 0.7 }}>default</Text>
                </View>
              ) : null}

              {notificationTimes.map((timeStr, index) => (
                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Pressable
                    onPress={() => {
                      setEditingNotificationIndex(index);
                      setShowNotificationTimePicker(true);
                    }}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                      gap: 8,
                    }}
                  >
                    <Icon name="alarm-add" size={16} color={colors.subtext} />
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>
                      {moment(timeStr, 'HH:mm').format('hh:mm A')}
                    </Text>
                  </Pressable>
                  <IconButton
                    icon="close"
                    size={18}
                    iconColor={colors.error}
                    onPress={() => {
                      const newTimes = [...notificationTimes];
                      newTimes.splice(index, 1);
                      setNotificationTimes(newTimes);
                    }}
                  />
                </View>
              ))}

              <Pressable
                onPress={() => {
                  setEditingNotificationIndex(null);
                  setShowNotificationTimePicker(true);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 10,
                  marginBottom: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: colors.border,
                  gap: 6,
                }}
              >
                <Icon name="add-alarm" size={17} color={colors.subtext} />
                <Text style={{ color: colors.subtext, fontWeight: '600', fontSize: 13 }}>
                  {scheduledTime || notificationTimes.length > 0 ? "Add Extra Reminder" : "Add Reminder"}
                </Text>
              </Pressable>

              <DateTimePickerModal
                isVisible={showNotificationTimePicker}
                mode="time"
                onConfirm={date => {
                  const hours = date.getHours().toString().padStart(2, '0');
                  const minutes = date.getMinutes().toString().padStart(2, '0');
                  const newTime = `${hours}:${minutes}`;

                  if (newTime === scheduledTime) {
                    Alert.alert('Duplicate Time', 'This time is already set as the default scheduled time.');
                    setShowNotificationTimePicker(false);
                    setEditingNotificationIndex(null);
                    return;
                  }

                  const isDuplicate = notificationTimes.some(
                    (time, index) => time === newTime && index !== editingNotificationIndex
                  );
                  
                  if (isDuplicate) {
                    Alert.alert('Duplicate Time', 'You have already added this notification time.');
                    setShowNotificationTimePicker(false);
                    setEditingNotificationIndex(null);
                    return;
                  }

                  const newTimes = [...notificationTimes];
                  if (editingNotificationIndex !== null) {
                    newTimes[editingNotificationIndex] = newTime;
                  } else {
                    newTimes.push(newTime);
                  }
                  setNotificationTimes(newTimes);
                  setShowNotificationTimePicker(false);
                  setEditingNotificationIndex(null);
                }}
                onCancel={() => {
                  setShowNotificationTimePicker(false);
                  setEditingNotificationIndex(null);
                }}
              />

              <Divider style={{ marginBottom: 16, backgroundColor: colors.border }} />

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
                      <View pointerEvents="none">
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
                      </View>
                    </Pressable>
                    <Pressable
                      style={{ flex: 1 }}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <View pointerEvents="none">
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
                      </View>
                    </Pressable>
                  </View>
                </View>
              )}

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

              {optionsList.map((item, idx) => {
                const n = optionsList.length;
                const allocatedScore =
                  n === 2
                    ? idx === 0
                      ? 1
                      : 10
                    : Math.round(1 + (idx * 9) / (n - 1));

                return (
                  <View
                    key={idx}
                    style={{
                      marginBottom: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 48,
                        borderRadius: 4,
                        backgroundColor: colors.primary + '15',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 8,
                        borderWidth: 1,
                        borderColor: colors.primary + '30',
                      }}
                    >
                      <Text
                        style={{ color: colors.primary, fontWeight: 'bold' }}
                      >
                        {allocatedScore}
                      </Text>
                    </View>
                    <TextInput
                      label="Label"
                      value={item.label}
                      onChangeText={val => {
                        const newList = optionsList.map((o, i) =>
                          i === idx ? { ...o, label: val } : { ...o },
                        );
                        setOptionsList(newList);
                      }}
                      mode="outlined"
                      style={{ flex: 1, backgroundColor: colors.surface }}
                      textColor={colors.text}
                      outlineColor={colors.border}
                      activeOutlineColor={colors.primary}
                      placeholder={`Enter option`}
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
                    {optionsList.length > 2 && (
                      <IconButton
                        icon="close"
                        size={20}
                        iconColor={colors.error}
                        onPress={() => {
                          const newList = [...optionsList];
                          newList.splice(idx, 1);
                          setOptionsList(newList);
                        }}
                        style={{ margin: 0 }}
                      />
                    )}
                  </View>
                );
              })}
              {optionsList.length < 10 && (
                <Button
                  mode="outlined"
                  icon="add"
                  onPress={() =>
                    setOptionsList([...optionsList, { label: '' }])
                  }
                  style={{ marginTop: 8 }}
                >
                  Add Option
                </Button>
              )}

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  marginTop: 24,
                }}
              >
                <Button
                  mode="text"
                  onPress={onDismiss}
                  style={{ flex: 1 }}
                  textColor={colors.subtext}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleCreateCustomTask}
                  style={{ flex: 1 }}
                  buttonColor={colors.primary}
                  disabled={loading}
                  loading={loading}
                >
                  {taskToEdit ? 'Save Changes' : 'Create Task'}
                </Button>
              </View>
            </View>
          </ScrollView>
        )}
      </Modal>

      <DateTimePickerModal
        isVisible={showStartDatePicker}
        mode="date"
        date={startDate || new Date()}
        minimumDate={new Date()}
        onConfirm={date => {
          setStartDate(date);
          setShowStartDatePicker(false);
          if (endDate && date > endDate) {
            setEndDate(date);
          }
        }}
        onCancel={() => setShowStartDatePicker(false)}
      />
      <DateTimePickerModal
        isVisible={showEndDatePicker}
        mode="date"
        date={endDate || startDate || new Date()}
        minimumDate={startDate || undefined}
        onConfirm={date => {
          setEndDate(date);
          setShowEndDatePicker(false);
        }}
        onCancel={() => setShowEndDatePicker(false)}
      />
    </Portal>
  );
};

export default memo(CreateTaskModal);
