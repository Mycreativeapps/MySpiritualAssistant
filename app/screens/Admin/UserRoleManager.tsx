import { View, FlatList, Alert } from 'react-native';
import {
  Text,
  List,
  Searchbar,
  Avatar,
  Button,
  Chip,
  IconButton,
} from 'react-native-paper';
import { useThemeColors } from '../../config/styles';
import adminService from '../../services/admin';
import NavigationService from '../../navigation/NavigationService';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/material-icons';
import { useState, useEffect } from 'react';

const UserRoleManager: React.FC = () => {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAllUsers();
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [navigation]);

  const handleUpdateRole = (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'devotee' : 'admin';
    const actionText =
      newRole === 'admin' ? 'promote to Admin' : 'demote to Devotee';

    Alert.alert('Update Role', `Are you sure you want to ${actionText}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await adminService.updateUserRole(userId, newRole);
            fetchUsers();
          } catch (error) {
            Alert.alert('Error', 'Failed to update user role');
          }
        },
      },
    ]);
  };

  const filteredUsers = users
    .filter(user => user.role === 'admin')
    .filter(
      user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 8 }}
      >
        <Searchbar
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{
            flex: 1,
            margin: 10,
            backgroundColor: colors.surface,
            elevation: 2,
            borderRadius: 8,
          }}
          inputStyle={{ color: colors.text }}
          icon={({ size, color }) => (
            <Icon name="search" size={size} color={color} />
          )}
          clearIcon={({ size, color }) =>
            searchQuery ? <Icon name="clear" size={size} color={color} /> : null
          }
          onClearIconPress={() => setSearchQuery('')}
          iconColor={colors.primary}
          placeholderTextColor={colors.subtext}
        />
        <IconButton
          icon={({ color }) => (
            <Icon name="qr-code-scanner" size={28} color={color} />
          )}
          iconColor={colors.primary}
          size={28}
          style={{
            backgroundColor: colors.surface,
            elevation: 2,
            borderRadius: 8,
          }}
          onPress={() =>
            NavigationService.navigate('ScanQR', { mode: 'promote_admin' })
          }
        />
      </View>
      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.id}
        refreshing={loading}
        onRefresh={fetchUsers}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            titleStyle={{ color: colors.text, fontWeight: 'bold' }}
            description={`${item.email}\nJoined: ${new Date(
              item.created_at,
            ).toLocaleDateString()}`}
            descriptionStyle={{ color: colors.subtext }}
            left={props => (
              <View style={{ alignSelf: 'center', marginLeft: 10 }}>
                {item.profile_url ? (
                  <Avatar.Image size={40} source={{ uri: item.profile_url }} />
                ) : (
                  <Avatar.Text
                    size={40}
                    label={item.name.substring(0, 2).toUpperCase()}
                    style={{
                      backgroundColor:
                        item.role === 'admin' ? colors.primary : colors.subtext,
                    }}
                    labelStyle={{ color: 'white' }}
                  />
                )}
              </View>
            )}
            right={props => (
              <View style={{ justifyContent: 'center' }}>
                <Chip
                  mode="flat"
                  onPress={() => handleUpdateRole(item.id, item.role)}
                  style={{
                    backgroundColor: colors.primary + '20',
                  }}
                  selectedColor={colors.primary}
                >
                  ADMIN
                </Chip>
              </View>
            )}
            style={{
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              backgroundColor: colors.card,
            }}
          />
        )}
      />
    </View>
  );
};

export default UserRoleManager;
