import React, { useEffect, useState } from 'react';
import { ScrollView, View, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  Button,
  List,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from '@react-native-vector-icons/material-icons';
import { useThemeColors } from '../../config/styles';
import NavigationService from '../../navigation/NavigationService';
import adminService from '../../services/admin';

const AdminDashboard: React.FC = () => {
  const colors = useThemeColors();
  const [stats, setStats] = useState({
    admins: 0,
    devotees: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await adminService.getSystemStats();
      if (response.data.success) {
        setStats({
          admins: response.data.data.admins,
          devotees: response.data.data.devotees,
        });
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <View style={{ padding: 16 }}>
        <Text
          variant="headlineMedium"
          style={{ marginBottom: 8, fontWeight: 'bold' }}
        >
          Admin Dashboard
        </Text>
        <Text
          variant="bodyLarge"
          style={{ color: colors.subtext, marginBottom: 20 }}
        >
          Manage spiritual tasks and admins.
        </Text>

        <Card
          style={{ marginBottom: 16, backgroundColor: colors.card }}
          mode="elevated"
        >
          <Card.Title
            title="Task Management"
            subtitle="Add or edit master tasks"
            left={props => (
              <Icon name="task" size={24} color={colors.primary} />
            )}
          />
          <Card.Content>
            <Text variant="bodyMedium">
              Configure activities that will appear as default tasks for all new
              devotees in their "Select Task" list.
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => NavigationService.navigate('MasterTaskManager')}
            >
              Go to Tasks
            </Button>
          </Card.Actions>
        </Card>

        <Card
          style={{ marginBottom: 16, backgroundColor: colors.card }}
          mode="elevated"
        >
          <Card.Title
            title="Manage Admins"
            subtitle="View and manage administrative access"
            left={props => (
              <Icon name="security" size={24} color={colors.primary} />
            )}
          />
          <Card.Content>
            <Text variant="bodyMedium">
              Manage administrative permissions and oversee the core team.
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => NavigationService.navigate('UserRoleManager')}
            >
              Manage Admins
            </Button>
          </Card.Actions>
        </Card>

        <View style={{ marginTop: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text variant="titleMedium">System Overview</Text>
            {loading && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>

          <List.Item
            title="Total Devotees"
            description={`${stats.devotees} registered devotees`}
            left={props => (
              <List.Icon {...props} icon="people" color={colors.primary} />
            )}
            style={{
              backgroundColor: colors.card,
              marginBottom: 8,
              borderRadius: 8,
            }}
          />
          <List.Item
            title="Admin Users"
            description={`${stats.admins} active administrators`}
            left={props => (
              <List.Icon {...props} icon="security" color={colors.primary} />
            )}
            style={{
              backgroundColor: colors.card,
              marginBottom: 8,
              borderRadius: 8,
            }}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default AdminDashboard;
