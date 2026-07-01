import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Portal, Modal, IconButton, Button, Card, useTheme } from 'react-native-paper';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from '@react-native-vector-icons/material-icons';
import { useThemeColors } from '../config/styles';
import { Alert } from 'react-native';

interface SupportUsModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const DONATION_DETAILS = [
  {
    id: 'upi-india',
    icon: 'account-balance-wallet',
    name: 'UPI Transfer',
    sub: 'PhonePe · GPay · Paytm · Any UPI App',
    details: [
      { label: 'Name', value: 'Harsha Kumar' },
      { label: 'UPI Number', value: '8754035972' },
    ],
  },
  {
    id: 'bank-india',
    icon: 'account-balance',
    name: 'Bank Transfer',
    sub: 'NEFT / RTGS / IMPS',
    details: [
      { label: 'Account Name', value: 'Harsha Kumar' },
      { label: 'Account No.', value: '16404100000260' },
      { label: 'IFSC Code', value: 'FDRL0001640' },
      { label: 'Bank', value: 'Federal Bank' },
    ],
  },
];

const SupportUsModal: React.FC<SupportUsModalProps> = ({ visible, onDismiss }) => {
  const colors = useThemeColors();
  const theme = useTheme();

  const handleCopy = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${label} has been copied to clipboard.`);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        theme={{ colors: { backdrop: 'rgba(0, 0, 0, 0.85)' } }}
        contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.background }]}
      >
        <IconButton
          icon="close"
          size={24}
          onPress={onDismiss}
          style={styles.closeButton}
          iconColor={colors.primary}
        />
        
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Icon name="volunteer-activism" size={40} color={colors.primary} style={{ marginBottom: 12 }} />
            <Text style={[styles.title, { color: colors.text }]}>Support The Project</Text>
            <Text style={[styles.description, { color: colors.text }]}>
              Spiritual Health Coach is an effort to combine timeless wisdom with modern technology.
              Small daily improvements create lifelong transformation. Support the development of this
              app by contributing below.
            </Text>
          </View>

          {DONATION_DETAILS.map((method) => (
            <Card key={method.id} style={[styles.card, { backgroundColor: colors.surface }]} elevation={2}>
              <Card.Title
                title={method.name}
                subtitle={method.sub}
                titleStyle={{ fontWeight: 'bold', color: colors.text }}
                subtitleStyle={{ color: colors.text + '99' }}
                left={(props) => <Icon name={method.icon as any} size={props.size} color={colors.primary} />}
              />
              <Card.Content>
                {method.details.map((detail, index) => (
                  <View key={index} style={styles.detailRow}>
                    <View style={styles.detailTextContainer}>
                      <Text style={[styles.detailLabel, { color: colors.text + '99' }]}>{detail.label}</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{detail.value}</Text>
                    </View>
                    {detail.label !== 'Bank' && (
                      <IconButton
                        icon="content-copy"
                        size={20}
                        iconColor={colors.primary}
                        onPress={() => handleCopy(detail.value, detail.label)}
                        style={styles.copyButton}
                      />
                    )}
                  </View>
                ))}
              </Card.Content>
            </Card>
          ))}

          <Text style={[styles.footerNote, { color: colors.text + '80' }]}>
            🙏 Your contributions help cover development costs to bring this to spiritual seekers worldwide. Hare Krishna!
          </Text>
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  copyButton: {
    margin: 0,
    backgroundColor: 'rgba(100, 100, 100, 0.1)',
  },
  footerNote: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
    marginBottom: 10,
    lineHeight: 20,
  },
});

export default SupportUsModal;
