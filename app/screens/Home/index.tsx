import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  FlatList,
  SectionList,
  Pressable,
  View,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import {
  Text,
  Button,
  Checkbox,
  Card,
  Avatar,
  FAB,
  Portal,
  Modal,
  TextInput,
  Divider,
  IconButton,
  useTheme,
  RadioButton,
} from 'react-native-paper';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import Slider from '@react-native-community/slider';
import Icon from '@react-native-vector-icons/material-icons';
import NavigationService from '../../navigation/NavigationService';
import { useThemeColors } from '../../config/styles';
import { useUserStore, useTaskStore } from '../../store';
import createStyles from './styles';
import { useNavigation } from '@react-navigation/native';
import { Logo } from '../../assets/images/exports';
import CreateTaskModal from './CreateTaskModal';

interface DailyTaskCardProps {
  item: any;
  colors: any;
  styles: any;
  formatTime: (timeStr: string) => string;
  getTimeIcon: (timeStr: string) => any;
  handleUpdateScore: (taskId: number, score: number) => void;
}

const DailyTaskCard: React.FC<DailyTaskCardProps> = React.memo(({
  item,
  colors,
  styles,
  formatTime,
  getTimeIcon,
  handleUpdateScore,
}) => {
  const isCompleted = !!item.completed_at;
  
  const options = useMemo(() => {
    return item.options
      ? typeof item.options === 'string'
        ? JSON.parse(item.options)
        : item.options
      : null;
  }, [item.options]);

  const availableScores = useMemo(() => {
    if (!options) return [];
    return Object.keys(options)
      .map(k => parseInt(k, 10))
      .sort((a, b) => a - b);
  }, [options]);

  const numOptions = availableScores.length;

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [item.daily_task_id, numOptions]);

  if (isCompleted) {
    return (
      <Card
        style={[styles.dailyTaskCard, styles.completedCard]}
        mode="elevated"
      >
        <Card.Content style={{ paddingVertical: 12 }}>
          <View style={styles.taskHeaderRow}>
            <View
              style={[
                styles.iconWrapper,
                {
                  backgroundColor: colors.subtext + '15',
                },
              ]}
            >
              <Icon
                name={getTimeIcon(item.scheduled_time)}
                size={24}
                color={colors.subtext}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.dailyTaskName, styles.completedTaskName]}>
                {item.task_name}
              </Text>
              <Text style={[styles.dailyTaskTime, { color: colors.subtext }]}>
                {formatTime(item.scheduled_time)}
              </Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreValue}>{item.score}</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  const safeIndex = Math.max(0, Math.min(currentIndex, numOptions - 1));
  const currentScore = availableScores[safeIndex] || 0;

  return (
    <Card style={styles.dailyTaskCard} mode="elevated">
      <Card.Content style={{ paddingVertical: 12 }}>
        <View style={styles.taskHeaderRow}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: colors.primary + '15',
              },
            ]}
          >
            <Icon
              name={getTimeIcon(item.scheduled_time)}
              size={24}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.dailyTaskName}>{item.task_name}</Text>
            <Text style={styles.dailyTaskTime}>
              {formatTime(item.scheduled_time)}
            </Text>
          </View>
        </View>
      </Card.Content>

      {options && numOptions > 0 && (
        <Card.Content style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
          <View style={styles.optionsContainer}>
            <Text
              style={{
                textAlign: 'center',
                fontSize: 16,
                fontWeight: 'bold',
                color: colors.primary,
                marginBottom: 8,
              }}
            >
              {options[currentScore.toString()] || ''}
            </Text>

            <Slider
              style={{ width: '100%', height: 20 }}
              minimumValue={0}
              maximumValue={numOptions - 1}
              step={1}
              value={safeIndex}
              onValueChange={setCurrentIndex}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />

            <Text
              style={{
                textAlign: 'center',
                fontSize: 14,
                color: colors.subtext,
                marginTop: 4,
                minHeight: 20,
              }}
            >
              Score: {currentScore}
            </Text>

            <Button
              mode="contained"
              style={{ marginTop: 16, borderRadius: 8 }}
              onPress={() => handleUpdateScore(item.daily_task_id, currentScore)}
            >
              Submit Score
            </Button>
          </View>
        </Card.Content>
      )}
    </Card>
  );
});

const Home: React.FC = () => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const theme = useTheme();
  const navigation = useNavigation();

  // Stores
  const user = useUserStore(state => state.user);
  const { refreshProfile, loading: userLoading } = useUserStore();
  const {
    userTasks,
    masterTasks,
    loading: tasksLoading,
    hasInitiallyFetched,
    fetchUserTasks,
    fetchMasterTasks,
    assignUserTasks,
    createCustomTask,
  } = useTaskStore();

  const loading = tasksLoading || userLoading;

  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isAddingMore = userTasks.length > 0;

  const userInitials = useMemo(() => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }, [user?.name]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const tasks = [fetchUserTasks(), refreshProfile()];
      // Only fetch master tasks if selection is shown or masterTasks is empty
      if (showSelection || masterTasks.length === 0) {
        tasks.push(fetchMasterTasks());
      }
      await Promise.all(tasks);
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.token && !hasInitiallyFetched && !loading) {
      fetchUserTasks();
    }
  }, [user?.token, hasInitiallyFetched, loading]);

  // Handle the transition to selection view once tasks are loaded
  useEffect(() => {
    if (!loading && hasInitiallyFetched) {
      if (userTasks.length === 0) {
        setShowSelection(true);
        // Only fetch master tasks if we don't have them yet
        if (masterTasks.length === 0 && !loading) {
          fetchMasterTasks();
        }
      } else {
        setShowSelection(false);
      }
    }
  }, [userTasks.length, loading, hasInitiallyFetched, masterTasks]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            accessibilityLabel="Scan QR"
            onPress={() => NavigationService.navigate('ScanQR')}
            style={[styles.profileButton, { marginRight: 8 }]}
          >
            <Icon name="qr-code-scanner" size={24} color={colors.primary} />
          </Pressable>
          {user?.role === 'admin' && (
            <Pressable
              accessibilityLabel="Admin Dashboard"
              // onPress={() => NavigationService.navigate('Coming_soon')}
              onPress={() => NavigationService.navigate('AdminDashboard')}
              style={[styles.profileButton, { marginRight: 8 }]}
            >
              <Icon
                name="admin-panel-settings"
                size={24}
                color={colors.primary}
              />
            </Pressable>
          )}
          <Pressable
            accessibilityLabel="Go to profile"
            onPress={() => NavigationService.navigate('About')}
            style={styles.profileButton}
          >
            {user?.profile_url ? (
              <Avatar.Image
                size={32}
                source={{ uri: user.profile_url }}
                style={{ backgroundColor: colors.surface }}
              />
            ) : (
              <Avatar.Text
                size={32}
                label={userInitials}
                labelStyle={{ fontSize: 14, fontWeight: 'bold' }}
                style={{ backgroundColor: colors.primary }}
              />
            )}
          </Pressable>
        </View>
      ),
    });
  }, [
    navigation,
    colors.primary,
    colors.surface,
    user?.profile_url,
    user?.role,
    userInitials,
  ]);

  const allMasterTaskIds = useMemo(() => {
    return masterTasks.map(t => t.id);
  }, [masterTasks]);

  const toggleTaskSelection = (id: number) => {
    setSelectedTaskIds(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id],
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedTaskIds.length === allMasterTaskIds.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(allMasterTaskIds);
    }
  };

  const handleAssignTasks = async () => {
    if (!isAddingMore && selectedTaskIds.length < 5) {
      Alert.alert(
        'Selection Required',
        'Please select at least 5 tasks to continue.',
      );
      return;
    }

    if (isAddingMore && selectedTaskIds.length === 0) {
      Alert.alert(
        'Selection Required',
        'Please select at least 1 task to continue.',
      );
      return;
    }

    if (user?.token) {
      const success = await assignUserTasks(selectedTaskIds);
      if (success) {
        setSelectedTaskIds([]);
        await Promise.all([fetchUserTasks(), refreshProfile()]);
        setShowSelection(false);
        Alert.alert('Success', 'Your tasks have been assigned!');
      } else {
        Alert.alert('Error', 'Failed to assign tasks. Please try again.');
      }
    }
  };

  // handleCreateCustomTask removed - now handled in CreateTaskModal

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hours12 = h % 12 || 12;
      return `${hours12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const getTimeIcon = (timeStr: string): any => {
    if (!timeStr) return 'schedule';
    try {
      const hours = parseInt(timeStr.split(':')[0], 10);
      if (hours >= 4 && hours < 11) return 'wb-sunny'; // Morning
      if (hours >= 11 && hours < 16) return 'light-mode'; // Afternoon
      if (hours >= 16 && hours < 20) return 'wb-twilight'; // Evening
      return 'bedtime'; // Night
    } catch (e) {
      return 'schedule';
    }
  };

  const sortedUserTasks = useMemo(() => {
    return [...userTasks].sort((a, b) => {
      // 1. First by completion status (completed_at exists moves to end)
      const aDone = !!a.completed_at;
      const bDone = !!b.completed_at;
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;

      // 2. Then by scheduled time
      const timeA = a.scheduled_time || '00:00:00';
      const timeB = b.scheduled_time || '00:00:00';
      return timeA.localeCompare(timeB);
    });
  }, [userTasks]);

  const { updateTaskScore } = useTaskStore();

  const handleUpdateScore = (taskId: number, score: number) => {
    updateTaskScore(taskId, score);
  };

  const sortedMasterTasks = useMemo(() => {
    return [...masterTasks].sort((a, b) => {
      const timeA = a.scheduled_time || '00:00:00';
      const timeB = b.scheduled_time || '00:00:00';
      return timeA.localeCompare(timeB);
    });
  }, [masterTasks]);

  const renderMasterTask = ({ item }: { item: any }) => {
    const isSelected = selectedTaskIds.includes(item.id);
    return (
      <Pressable
        onPress={() => toggleTaskSelection(item.id)}
        style={[styles.taskItem, isSelected && styles.taskItemSelected]}
      >
        <View style={styles.taskContent}>
          <Text
            style={[
              styles.taskName,
              isSelected && { color: colors.primary, fontWeight: '700' },
            ]}
          >
            {item.task_name}
          </Text>
          <View style={styles.timeRow}>
            <Icon
              name={getTimeIcon(item.scheduled_time)}
              size={16}
              color={isSelected ? colors.primary : colors.subtext}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[styles.taskTime, isSelected && { color: colors.primary }]}
            >
              {formatTime(item.scheduled_time)}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.selectionIndicator,
            isSelected && styles.selectionIndicatorActive,
          ]}
        >
          {isSelected && <Icon name="check" size={16} color="white" />}
        </View>
      </Pressable>
    );
  };

  const renderDailyTask = ({ item }: { item: any }) => (
    <DailyTaskCard
      item={item}
      colors={colors}
      styles={styles}
      formatTime={formatTime}
      getTimeIcon={getTimeIcon}
      handleUpdateScore={handleUpdateScore}
    />
  );

  if (loading && userTasks.length === 0 && masterTasks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (showSelection) {
    const progress = Math.min(selectedTaskIds.length / 5, 1);

    return (
      <View style={styles.container}>
        <View style={[styles.content, styles.scrollContent]}>
          <View style={styles.selectionHeader}>
            <View style={styles.selectionHeaderRow}>
              <Text style={styles.selectionTitle}>Select Your Tasks</Text>
              <Pressable
                onPress={handleToggleSelectAll}
                style={styles.selectAllButton}
              >
                <Text style={styles.selectAllText}>
                  {selectedTaskIds.length === allMasterTaskIds.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.selectionSubtitle}>
              {isAddingMore
                ? 'Choose additional spiritual activities to include in your routine.'
                : 'Choose at least 5 spiritual activities to include in your daily routine.'}
            </Text>
            {!isAddingMore && (
              <>
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${progress * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {selectedTaskIds.length} of 5 tasks selected
                </Text>
              </>
            )}
          </View>

          <FlatList
            data={sortedMasterTasks}
            keyExtractor={item => item.id.toString()}
            renderItem={renderMasterTask}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 20 },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
              />
            }
          />
        </View>
        <View
          style={[
            styles.footer,
            isAddingMore && {
              flexDirection: 'row',
              justifyContent: 'space-between',
            },
          ]}
        >
          {isAddingMore && (
            <Button
              mode="outlined"
              onPress={() => setShowSelection(false)}
              style={[
                styles.assignButton,
                { flex: 1, marginRight: 8, borderColor: colors.primary },
              ]}
              labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
            >
              Cancel
            </Button>
          )}
          <Button
            mode="contained"
            onPress={handleAssignTasks}
            style={[
              styles.assignButton,
              isAddingMore && { flex: 1, marginLeft: 8 },
            ]}
            labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
            disabled={
              (!isAddingMore && selectedTaskIds.length < 5) ||
              (isAddingMore && selectedTaskIds.length === 0) ||
              loading
            }
            loading={loading}
          >
            {!isAddingMore && selectedTaskIds.length < 5
              ? `Select ${5 - selectedTaskIds.length} more`
              : `Assign ${selectedTaskIds.length} Tasks`}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedUserTasks}
        renderItem={renderDailyTask}
        keyExtractor={item => item.daily_task_id.toString()}
        extraData={userTasks}
        ListHeaderComponent={() => (
          <View style={styles.headerContainer}>
            <Image
              source={Logo}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={styles.textContainer}>
              <Text style={styles.heading}>Your Daily Tasks</Text>
              <Text style={styles.subtitle}>Track your progress for today</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="event-busy" size={64} color={colors.subtext} />
            <Text style={styles.emptyTitle}>No Tasks Found</Text>
            <Text style={styles.emptySubtitle}>
              You haven't assigned any tasks yet.
            </Text>
            <Button
              mode="contained"
              onPress={() => setShowCreateModal(true)}
              style={[styles.assignButton, { marginTop: 12 }]}
              icon="plus"
            >
              Create Personal Task
            </Button>
          </View>
        )}
      />
      {!showSelection && userTasks.length > 0 && (
        <FAB
          icon="add"
          style={{
            position: 'absolute',
            margin: 16,
            right: 0,
            bottom: 16,
            backgroundColor: colors.primary,
          }}
          color="white"
          onPress={() => {
            setShowCreateModal(true);
          }}
        />
      )}

      {showCreateModal && (
        <CreateTaskModal
          visible={showCreateModal}
          onDismiss={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            handleRefresh();
            Alert.alert('Success', 'Personal task created!');
          }}
        />
      )}
    </View>
  );
};

export default Home;
