import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Text, Avatar, Searchbar, useTheme } from 'react-native-paper';
import Icon from '@react-native-vector-icons/material-icons';
import AppStyle, { useThemeColors } from '../../config/styles';
import { getMentees } from '../../services/hierarchy';
import NavigationService from '../../navigation/NavigationService';

interface Mentee {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  profile_url?: string;
  gender: string;
  lifetime_score: number;
}

const MenteesList: React.FC = () => {
  const colors = useThemeColors();
  const theme = useTheme();
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchMentees = async () => {
    try {
      const response = await getMentees();
      if (response.data.success) {
        setMentees(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch mentees:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMentees();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMentees();
  };

  const filteredMentees = useMemo(() => {
    return mentees.filter(
      m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [mentees, searchQuery]);

  const renderMentee = ({ item }: { item: Mentee }) => {
    const initials = item.name.trim().charAt(0).toUpperCase();

    return (
      <Pressable
        style={styles.menteeCard}
        onPress={() =>
          NavigationService.navigate('PersonDetails', {
            personData: {
              id: item.id,
              name: item.name,
              email: item.email,
              phone: item.phone_number,
              gender: item.gender,
              profile_url: item.profile_url,
              func: 'assign_task',
            },
          })
        }
      >
        <View style={styles.cardContent}>
          {item.profile_url ? (
            <Avatar.Image size={50} source={{ uri: item.profile_url }} />
          ) : (
            <Avatar.Text
              size={50}
              label={initials}
              style={{ backgroundColor: colors.primary }}
              labelStyle={{ fontWeight: 'bold', color: 'white' }}
            />
          )}
          <View style={styles.infoContainer}>
            <Text style={styles.nameText}>{item.name}</Text>
            <Text style={styles.subText}>{item.email}</Text>
            <View style={styles.badgeContainer}>
              <View
                style={[styles.scoreBadge, { backgroundColor: colors.primary + '15' }]}
              >
                <Icon name="stars" size={14} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {item.lifetime_score || 0} Points
                </Text>
              </View>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color={colors.subtext} />
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search mentees..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        icon={({ size, color }) => (
          <Icon name="search" size={size} color={color} />
        )}
        clearIcon={({ size, color }) =>
          searchQuery ? <Icon name="clear" size={size} color={color} /> : null
        }
        onClearIconPress={() => setSearchQuery('')}
        iconColor={colors.primary}
        placeholderTextColor={colors.subtext}
        inputStyle={{
          minHeight: 0,
          color: colors.text,
        }}
      />
      <FlatList
        data={filteredMentees}
        renderItem={renderMentee}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="group-off" size={64} color={colors.subtext} />
            <Text style={styles.emptyText}>No mentees found</Text>
            <Text style={styles.emptySubText}>
              Connect with others via QR code to see them here.
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppStyle.color.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    margin: 16,
    borderRadius: 16,
    elevation: 4,
    backgroundColor: AppStyle.color.surface,
    borderWidth: 1,
    borderColor: AppStyle.color.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  menteeCard: {
    backgroundColor: AppStyle.color.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: AppStyle.color.border,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '800',
    color: AppStyle.color.text,
    letterSpacing: -0.5,
  },
  subText: {
    fontSize: 13,
    color: AppStyle.color.subtext,
    marginTop: 2,
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: AppStyle.color.primary + '40',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppStyle.color.text,
    marginTop: 20,
    letterSpacing: -0.5,
  },
  emptySubText: {
    fontSize: 15,
    color: AppStyle.color.subtext,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
});

export default MenteesList;
