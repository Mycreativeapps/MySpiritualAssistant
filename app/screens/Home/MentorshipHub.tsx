import React, { useState, useLayoutEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppStyle, { useThemeColors } from '../../config/styles';
import MentorsList from './MentorsList';
import MenteesList from './MenteesList';
import NavigationService from '../../navigation/NavigationService';

const MentorshipHub: React.FC = () => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const route = useRoute<any>();
  
  const [activeTab, setActiveTab] = useState<'mentors' | 'mentees'>(
    route.params?.initialTab || 'mentors'
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      title: activeTab === 'mentors' ? 'My Mentors' : 'My Mentees',
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 8 }}>
          {activeTab === 'mentors' && (
            <TouchableOpacity
              onPress={() => NavigationService.navigate('ScanQR')}
              style={{ padding: 8 }}
            >
              <Icon name="qr-code-scanner" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      ),
    });
  }, [navigation, activeTab]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mentors' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
          onPress={() => setActiveTab('mentors')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'mentors' ? colors.primary : colors.subtext }]}>
            My Mentors
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mentees' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
          onPress={() => setActiveTab('mentees')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'mentees' ? colors.primary : colors.subtext }]}>
            My Mentees
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'mentors' ? <MentorsList /> : <MenteesList />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    elevation: 2,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
});

export default MentorshipHub;
