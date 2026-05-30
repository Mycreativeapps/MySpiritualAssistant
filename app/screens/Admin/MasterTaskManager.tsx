import React, { useState, useEffect } from 'react';
import { View, FlatList, Alert, ScrollView, Platform } from 'react-native';
import {
  Text,
  List,
  FAB,
  Portal,
  Modal,
  TextInput,
  Button,
  IconButton,
  Card,
  useTheme,
  Divider,
  RadioButton,
} from 'react-native-paper';
import Icon from '@react-native-vector-icons/material-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useThemeColors } from '../../config/styles';
import adminService from '../../services/admin';
import taskService from '../../services/task';

const MasterTaskManager: React.FC = () => {
  const colors = useThemeColors();
  const theme = useTheme();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  // Form state
  const [taskName, setTaskName] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Date state
  const [scheduleType, setScheduleType] = useState('daily');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Structured score inputs
  const [optionsList, setOptionsList] = useState<{ label: string }[]>([
    { label: '' },
    { label: '' },
  ]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await taskService.getMasterTasks();
      if (response.data.success) {
        setTasks(response.data.data);
      }
    } catch (error) {
      console.error('Fetch tasks error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSave = async () => {
    if (!taskName) {
      Alert.alert('Error', 'Task name is mandatory');
      return;
    }

    if (optionsList.length < 2 || optionsList.length > 10) {
      Alert.alert('Error', 'Tasks must have between 2 and 10 options.');
      return;
    }

    const options: Record<string, string> = {};
    const n = optionsList.length;

    optionsList.forEach((opt, index) => {
      if (!opt.label.trim()) {
        Alert.alert('Error', 'All options must have a label completed.');
        return;
      }

      let allocatedScore: number;
      if (n === 2) {
        allocatedScore = index === 0 ? 1 : 10;
      } else {
        allocatedScore = Math.round(1 + (index * 9) / (n - 1));
      }

      options[allocatedScore.toString()] = opt.label;
    });

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
      // Format as YYYY-MM-DD
      start_date_str = startDate.toISOString().split('T')[0];
      end_date_str = endDate.toISOString().split('T')[0];
    }

    const payload = {
      task_name: taskName,
      scheduled_time: scheduledTime || null,
      options: options,
      ...(start_date_str ? { start_date: start_date_str } : {}),
      ...(end_date_str ? { end_date: end_date_str } : {}),
    };

    try {
      if (editingTask) {
        await adminService.updateMasterTask(editingTask.id, payload);
      } else {
        await adminService.createMasterTask(payload);
      }
      setModalVisible(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to save task');
    }
  };

  const resetForm = () => {
    setEditingTask(null);
    setTaskName('');
    setScheduledTime('');
    setScheduleType('daily');
    setStartDate(null);
    setEndDate(null);
    setShowTimePicker(false);
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
    setOptionsList([{ label: '' }, { label: '' }]);
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setTaskName(task.task_name);
    setScheduledTime(task.scheduled_time || '');

    if (task.start_date && task.end_date) {
      setScheduleType('date_range');
      setStartDate(new Date(task.start_date));
      setEndDate(new Date(task.end_date));
    } else {
      setScheduleType('daily');
      setStartDate(null);
      setEndDate(null);
    }

    if (task.options) {
      // Sort tasks by score to keep distribution in visual order
      const list = Object.entries(task.options)
        .sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10))
        .map(([_, label]) => ({
          label: String(label),
        }));
      setOptionsList(list.length >= 2 ? list : [{ label: '' }, { label: '' }]);
    } else {
      setOptionsList([{ label: '' }, { label: '' }]);
    }
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Deactivate',
      'Are you sure you want to deactivate this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deactivateMasterTask(id);
              fetchTasks();
            } catch (error) {
              Alert.alert('Error', 'Failed to deactivate task');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={tasks}
        contentContainerStyle={{ padding: 16 }}
        keyExtractor={item => item.id.toString()}
        refreshing={loading}
        onRefresh={fetchTasks}
        renderItem={({ item }) => (
          <Card
            style={{
              marginBottom: 16,
              elevation: 2,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Card.Title
              title={item.task_name}
              subtitle={
                item.scheduled_time
                  ? `Scheduled: ${item.scheduled_time}`
                  : 'No fixed time'
              }
              titleStyle={{
                fontSize: 18,
                fontWeight: 'bold',
                color: colors.text,
              }}
              subtitleStyle={{ color: colors.subtext }}
              right={props => (
                <View style={{ flexDirection: 'row' }}>
                  <IconButton
                    icon={({ size, color }) => (
                      <Icon name="edit" size={size} color={color} />
                    )}
                    iconColor={colors.primary}
                    onPress={() => handleEdit(item)}
                  />
                  <IconButton
                    icon={({ size, color }) => (
                      <Icon name="delete" size={size} color={color} />
                    )}
                    iconColor={colors.error}
                    onPress={() => handleDelete(item.id)}
                  />
                </View>
              )}
            />
            <Divider style={{ backgroundColor: colors.border }} />
            <Card.Content style={{ marginTop: 8 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {Object.entries(item.options || {}).map(
                  ([key, value]: [string, any]) => (
                    <View
                      key={key}
                      style={{
                        backgroundColor: colors.primary + '75',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        margin: 2,
                      }}
                    >
                      <Text variant="labelSmall" style={{ color: colors.text }}>
                        {key}: {value}
                      </Text>
                    </View>
                  ),
                )}
              </View>
            </Card.Content>
          </Card>
        )}
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={{
            backgroundColor: colors.surface,
            margin: 20,
            borderRadius: 16,
            maxHeight: '80%',
            borderWidth: 1,
            borderColor: colors.primary + '50',
          }}
        >
          <ScrollView contentContainerStyle={{ padding: 24 }}>
            <Text
              variant="headlineSmall"
              style={{
                marginBottom: 4,
                fontWeight: 'bold',
                color: colors.primary,
              }}
            >
              {editingTask ? 'Edit Master Task' : 'Create New Task'}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: colors.subtext, marginBottom: 24 }}
            >
              Define the requirements and scoring for this spiritual activity.
            </Text>

            <View style={{ marginBottom: 24 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Icon
                  name="info"
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  variant="titleMedium"
                  style={{ fontWeight: 'bold', color: colors.text }}
                >
                  General Information
                </Text>
              </View>

              <TextInput
                label="Task Name"
                placeholder="e.g., Japa Chanting"
                value={taskName}
                onChangeText={setTaskName}
                mode="outlined"
                style={{ marginBottom: 16, backgroundColor: colors.surface }}
                textColor={colors.text}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 16,
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 4,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <RadioButton
                    value="daily"
                    status={scheduleType === 'daily' ? 'checked' : 'unchecked'}
                    onPress={() => setScheduleType('daily')}
                    color={colors.primary}
                  />
                  <Text style={{ color: colors.text }}>Daily Routine</Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <RadioButton
                    value="date_range"
                    status={
                      scheduleType === 'date_range' ? 'checked' : 'unchecked'
                    }
                    onPress={() => setScheduleType('date_range')}
                    color={colors.primary}
                  />
                  <Text style={{ color: colors.text }}>Specific Dates</Text>
                </View>
              </View>

              {scheduleType === 'date_range' && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <Button
                    mode="outlined"
                    onPress={() => setShowStartDatePicker(true)}
                    style={{
                      flex: 1,
                      marginRight: 8,
                      borderColor: colors.border,
                    }}
                    textColor={colors.text}
                  >
                    {startDate
                      ? startDate.toISOString().split('T')[0]
                      : 'Start Date'}
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => setShowEndDatePicker(true)}
                    style={{
                      flex: 1,
                      marginLeft: 8,
                      borderColor: colors.border,
                    }}
                    textColor={colors.text}
                  >
                    {endDate ? endDate.toISOString().split('T')[0] : 'End Date'}
                  </Button>
                </View>
              )}

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
                minimumDate={startDate || undefined}
                onConfirm={date => {
                  setEndDate(date);
                  setShowEndDatePicker(false);
                }}
                onCancel={() => setShowEndDatePicker(false)}
              />

              <Button
                mode="outlined"
                onPress={() => setShowTimePicker(true)}
                icon="clock-outline"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  justifyContent: 'flex-start',
                }}
                textColor={scheduledTime ? colors.text : colors.subtext}
                contentStyle={{
                  justifyContent: 'flex-start',
                  paddingVertical: 8,
                }}
              >
                {scheduledTime ? scheduledTime : 'Scheduled Time (Optional)'}
              </Button>

              <DateTimePickerModal
                isVisible={showTimePicker}
                mode="time"
                onConfirm={date => {
                  const hours = date.getHours().toString().padStart(2, '0');
                  const minutes = date.getMinutes().toString().padStart(2, '0');
                  setScheduledTime(`${hours}:${minutes}`);
                  setShowTimePicker(false);
                }}
                onCancel={() => setShowTimePicker(false)}
              />
            </View>

            <Divider
              style={{ marginBottom: 24, backgroundColor: colors.border }}
            />

            <View style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Icon
                  name="stars"
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  variant="titleMedium"
                  style={{ fontWeight: 'bold', color: colors.text }}
                >
                  Scoring Configuration
                </Text>
              </View>
              <Text
                variant="bodySmall"
                style={{ color: colors.subtext, marginBottom: 16 }}
              >
                Define between 2 and 10 options. Scores will automatically
                evaluate between 1 and 10 based on position.
              </Text>

              {optionsList.map((item, idx) => {
                let allocatedScore: number;
                const n = optionsList.length;
                if (n === 2) {
                  allocatedScore = idx === 0 ? 1 : 10;
                } else {
                  allocatedScore = Math.round(1 + (idx * 9) / (n - 1));
                }

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
                      placeholder={`Enter label`}
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
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                marginTop: 24,
                paddingBottom: 20,
              }}
            >
              <Button
                onPress={() => setModalVisible(false)}
                style={{ marginRight: 8 }}
                labelStyle={{ color: colors.subtext }}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                style={{ borderRadius: 8, paddingHorizontal: 16 }}
              >
                {editingTask ? 'Update Task' : 'Add Activity'}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      <FAB
        icon={({ size, color }) => (
          <Icon name="add" size={size} color={color} />
        )}
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          bottom: 16,
          backgroundColor: colors.primary,
        }}
        color="white"
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      />
    </View>
  );
};

export default MasterTaskManager;
