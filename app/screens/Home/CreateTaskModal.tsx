import React, { useState, memo } from 'react';
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
} from 'react-native-paper';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Icon from '@react-native-vector-icons/material-icons';
import { useTaskStore } from '../../store';
import { useThemeColors } from '../../config/styles';

interface CreateTaskModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  onDismiss,
  onSuccess,
}) => {
  const colors = useThemeColors();
  const { createCustomTask, loading } = useTaskStore();

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

  const handleCreateCustomTask = async () => {
    if (!taskName) {
      Alert.alert('Error', 'Task name is mandatory.');
      return;
    }

    if (!scheduledTime) {
      Alert.alert('Error', 'Scheduled time is mandatory.');
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
      options,
      ...(start_date_str ? { start_date: start_date_str } : {}),
      ...(end_date_str ? { end_date: end_date_str } : {}),
    };

    const success = await createCustomTask(payload);
    if (success) {
      resetForm();
      onSuccess();
    } else {
      Alert.alert('Error', 'Failed to create personal task.');
    }
  };

  const resetForm = () => {
    setTaskName('');
    setScheduledTime('');
    setScheduleType('daily');
    setStartDate(null);
    setEndDate(null);
    setOptionsList([{ label: '' }, { label: '' }]);
  };

  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={{
          backgroundColor: colors.surface,
          margin: 20,
          borderRadius: 16,
          maxHeight: '80%',
          borderWidth: 1,
          borderColor: colors.primary + '50',
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ padding: 24 }}>
              <Text
                variant="headlineSmall"
                style={{
                  marginBottom: 4,
                  fontWeight: 'bold',
                  color: colors.primary,
                }}
              >
                Create Personal Task
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: colors.subtext, marginBottom: 24 }}
              >
                Add a custom spiritual activity to your daily routine.
              </Text>

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
                        const newList = [...optionsList];
                        newList[idx].label = val;
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
                  onPress={handleDismiss}
                  style={{ marginRight: 8 }}
                  labelStyle={{ color: colors.subtext }}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleCreateCustomTask}
                  style={{ borderRadius: 8, paddingHorizontal: 16 }}
                  loading={loading}
                  disabled={loading}
                >
                  Create Task
                </Button>
              </View>
            </View>
        </ScrollView>
      </Modal>

      <DateTimePickerModal
        isVisible={showStartDatePicker}
        mode="date"
        date={startDate || new Date()}
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
