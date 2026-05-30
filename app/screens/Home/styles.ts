import { StyleSheet, Platform } from 'react-native';
import { ThemeColors } from '../../config/styles';

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
    },
    heading: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 2,
    },
    subtitle: {
      top: 0,
      fontSize: 14,
      color: colors.subtext,
      // marginBottom: 16,
    },
    profileButton: {
      marginRight: 10,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerLogo: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginRight: 12,
    },
    textContainer: {
      flexDirection: 'column',
      justifyContent: 'center',
    },
    // Premium Selection styles
    selectionHeader: {
      paddingBottom: 16,
      marginBottom: 8,
    },
    searchBarWrapper: {
      marginBottom: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.border + '15',
      borderRadius: 14,
      paddingHorizontal: 16,
      height: 48,
      borderWidth: 1,
      borderColor: colors.border + '30',
    },
    searchIcon: {
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      paddingVertical: 8,
    },
    selectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    selectionTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: -0.5,
      flex: 1,
    },
    selectAllButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    selectAllText: {
      fontSize: 12,
      fontWeight: '800',
      color: 'white',
      textTransform: 'uppercase',
    },
    selectionSubtitle: {
      fontSize: 15,
      color: colors.subtext,
      lineHeight: 22,
      marginTop: 4,
    },
    progressContainer: {
      height: 6,
      backgroundColor: colors.border + '40',
      borderRadius: 3,
      marginTop: 12,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    progressText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
      marginTop: 6,
    },
    categoryHeader: {
      backgroundColor: colors.background,
      paddingVertical: 12,
      marginVertical: 4,
    },
    sectionHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
    },
    categoryTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    sectionBadge: {
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      marginLeft: 8,
    },
    sectionBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    taskItem: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 18,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border + '30', // Very subtle border
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    taskItemSelected: {
      borderWidth: 1.5,
    },
    taskContent: {
      flex: 1,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      backgroundColor: colors.border + '15', // Subtle pill background
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      alignSelf: 'flex-start',
    },
    taskName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.3,
    },
    taskTime: {
      fontSize: 12,
      color: colors.subtext,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    selectionIndicator: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.border + '60',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
      backgroundColor: 'transparent',
    },
    selectionIndicatorActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 5,
    },
    footer: {
      padding: 20,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border + '50',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 10,
        },
      }),
    },
    assignButton: {
      borderRadius: 14,
      paddingVertical: 8,
    },
    // Daily Task Card Enhancements
    dailyTaskCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border + '20',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.05,
          shadowRadius: 15,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    taskInfo: {
      flex: 1,
    },
    dailyTaskName: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.4,
    },
    dailyTaskCategory: {
      fontSize: 12,
      color: colors.primary,
      textTransform: 'uppercase',
      fontWeight: '800',
      marginTop: 4,
      letterSpacing: 0.5,
    },
    taskHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dailyTaskTime: {
      fontSize: 13,
      color: colors.subtext,
      fontWeight: '600',
      marginTop: 2,
    },
    scoreCard: {
      backgroundColor: colors.primary + '10',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      alignItems: 'center',
      minWidth: 60,
    },
    scoreValue: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.primary,
    },
    scoreLabel: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    // Inline Options Styles (Professional Button Design)
    optionsContainer: {
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border + '15',
      // paddingTop: 16,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1.5,
      borderColor: colors.border + '40',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    optionScoreBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    optionScoreText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.primary,
    },
    optionLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    completedCard: {
      opacity: 0.6,
      borderWidth: 0,
      backgroundColor: colors.border + '05',
    },
    completedTaskName: {
      textDecorationLine: 'line-through',
      color: colors.subtext,
    },
    emptyContainer: {
      padding: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 10,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 16,
      color: colors.subtext,
      textAlign: 'center',
      marginBottom: 28,
      lineHeight: 24,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoLabel: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 16,
      color: colors.text,
      fontWeight: 'bold',
    },
    iconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '10', // 10% opacity
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    avatar: {
      backgroundColor: colors.primary,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    avatarContainer: {
      position: 'relative',
    },
    statsGrid: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.subtext,
      marginBottom: 20,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.subtext,
    },
    taskList: {
      paddingVertical: 20,
    },
    input: {
      marginBottom: 12,
      backgroundColor: colors.surface,
    },
  });

export default createStyles;
