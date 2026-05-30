import React from 'react';
import {
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { TextInput } from 'react-native-paper';
import Icon from '@react-native-vector-icons/fontawesome';
import AppStyle from '../config/styles';

interface DatePickerProps {
  visible: boolean;
  onConfirm(date: Date): void;
  onCancel(): void;
  dateValue: string;
  onPress(): void;
  maxDate?: Date;
  minDate?: Date;
  date?: Date;
  containerStyle?: StyleProp<ViewStyle> | undefined;
  icon?: boolean;
  iconSize?: number;
  DateInputStyle?: StyleProp<TextStyle> | undefined;
  iconStyle?: any;
  mode?: 'flat' | 'outlined';
  placeholder?: string;
  label?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  visible,
  onConfirm,
  onCancel,
  maxDate,
  date,
  minDate,
  containerStyle,
  dateValue,
  onPress,
  DateInputStyle,
  mode,
  placeholder,
  label,
}) => {
  return (
    <View style={[{ flexDirection: 'row' }, containerStyle]}>
      <TouchableOpacity onPress={onPress}>
        <TextInput
          right={
            <TextInput.Icon
              icon={() => (
                <Icon
                  name="calendar-plus-o"
                  size={20}
                  color={AppStyle.light.subtext}
                  onPress={onPress}
                />
              )}
            />
          }
          style={DateInputStyle}
          placeholder={placeholder}
          placeholderTextColor={AppStyle.light.subtext}
          value={dateValue}
          editable={false}
          mode={mode}
          label={label}
        />
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={visible}
        onConfirm={onConfirm}
        onCancel={onCancel}
        maximumDate={maxDate}
        date={date}
        minimumDate={minDate}
      />
    </View>
  );
};

export default DatePicker;
