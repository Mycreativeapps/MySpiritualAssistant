import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { MultiSelect, Dropdown } from 'react-native-element-dropdown';
import { AntDesign } from '@react-native-vector-icons/ant-design';
import AppStyle from '../config/styles';
import { useThemeColors } from '../config/styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Scale factors based on screen size
const isSmallScreen = SCREEN_WIDTH < 375; // iPhone SE, small Android phones
const isTablet = SCREEN_WIDTH >= 768; // iPad, tablets

const getResponsiveSize = (size: number): number => {
  if (isTablet) return size * 1.3;
  if (isSmallScreen) return size * 0.8;
  return size;
};

interface CustomDropdownProps {
  multi?: boolean;
  data: DataStructure[] | any[];
  multiValue?: (string | number)[] | null | undefined;
  value?: string | null | undefined | any;
  dropdown?: StyleProp<ViewStyle> | undefined;
  placeholderStyle?: StyleProp<TextStyle> | undefined;
  selectedTextStyle?: StyleProp<TextStyle> | undefined;
  inputSearchStyle?: StyleProp<TextStyle> | undefined;
  itemTextStyle?: StyleProp<TextStyle> | undefined;
  container?: StyleProp<ViewStyle> | undefined;
  containerStyle?: StyleProp<ViewStyle> | undefined;
  itemContainerStyle?: StyleProp<ViewStyle> | undefined;
  onChange: (item: DataStructure | (string | number)[] | any) => void;
  searchPlaceholder?: string;
  placeholder?: string;
  selectedStyle?: StyleProp<ViewStyle>;
  search?: boolean;
  maxHeight?: number;
  onChangeData?: (item: (string | number)[]) => void;
  label?: string;
  required?: boolean;
  labelColor?: string;
  labelStyle?: StyleProp<TextStyle> | undefined;
  disabled?: boolean;
  error?: string;
  customIcon?: React.ReactNode;
  iconColor?: string;
  textSelectedStyle?: StyleProp<TextStyle> | undefined;
}

export interface DataStructure {
  label: string;
  value: string | number;
  [key: string]: string | number;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  multi = false,
  data,
  dropdown,
  placeholderStyle,
  inputSearchStyle,
  selectedTextStyle,
  itemTextStyle,
  onChange,
  placeholder = 'Select Item',
  searchPlaceholder = 'Search',
  selectedStyle,
  search = true,
  maxHeight = 200,
  containerStyle,
  itemContainerStyle,
  multiValue,
  value,
  onChangeData,
  label,
  required = false,
  container,
  labelColor,
  disabled = false,
  error,
  labelStyle,
  customIcon,
  iconColor,
  textSelectedStyle,
}) => {
  // subscribe so the component re-renders on theme switch
  useThemeColors();

  // add open state to toggle right icon
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Helper to check if an item is selected (for multi)
  const isSelected = (val: string | number) => {
    if (!multiValue || !Array.isArray(multiValue)) return false;
    return multiValue.includes(val);
  };

  // Toggle handler for multi select items (keeps parent in control by calling onChange)
  const toggleMultiItem = (item: DataStructure) => {
    const current: any[] = Array.isArray(multiValue) ? [...multiValue] : [];
    const idx = current.indexOf(item.value);
    let next: any[] = [];
    if (idx > -1) {
      next = current.filter(v => v !== item.value);
    } else {
      next = [...current, item.value];
    }
    // notify parent
    onChange(next);
    if (onChangeData && Array.isArray(data)) {
      const datat = data
        .filter((d: any) => next.includes(d.value))
        .map((d: any) => d.label);
      onChangeData(datat);
    }
  };

  // Render item for MultiSelect: show checkbox + label, tapping toggles
  const renderMultiItem = (item: any) => {
    const checked = isSelected(item.value);
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => toggleMultiItem(item)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 6,
        }}
      >
        <AntDesign
          name={checked ? 'check-square' : 'border'}
          size={18}
          color={checked ? AppStyle.color.primary : AppStyle.color.lightGrey}
          style={{ marginRight: 10 }}
        />
        <Text
          allowFontScaling={false}
          style={{
            fontSize: getResponsiveSize(14),
            color: AppStyle.color.text,
          }}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderLabel = () => {
    if (label) {
      return (
        <>
          <Text
            style={[
              styles.label,
              {
                backgroundColor: labelColor ?? AppStyle.color.background,
                color: AppStyle.color.subtext,
              },
              labelStyle,
            ]}
            allowFontScaling={false}
          >
            {label}{' '}
            {required && (
              <Text
                allowFontScaling={false}
                style={{ color: AppStyle.color.error, fontSize: 14 }}
              >
                *
              </Text>
            )}
          </Text>
          {error && (
            <Text
              style={[styles.errorText, { color: AppStyle.color.error }]}
              allowFontScaling={false}
            >
              {error}
            </Text>
          )}
        </>
      );
    }
    return error ? (
      <Text
        style={[styles.errorText, { color: AppStyle.color.error }]}
        allowFontScaling={false}
      >
        {error}
      </Text>
    ) : null;
  };

  const dropdownStyle = [
    styles.dropdown,
    {
      borderColor: error ? AppStyle.color.error : AppStyle.color.primary,
      backgroundColor: AppStyle.color.surface,
    },
    dropdown,
    disabled && [
      styles.disabledDropdown,
      { backgroundColor: AppStyle.color.border },
    ],
  ];

  return multi ? (
    <View
      style={[
        { marginVertical: getResponsiveSize(10), width: '100%' },
        container,
      ]}
    >
      {renderLabel()}
      <MultiSelect
        style={dropdownStyle}
        disable={disabled}
        placeholderStyle={[
          styles.placeholderStyle,
          { color: AppStyle.color.subtext },
          placeholderStyle,
        ]}
        selectedTextStyle={[
          styles.selectedTextStyle,
          { color: AppStyle.color.text },
          selectedTextStyle,
        ]}
        inputSearchStyle={[
          styles.inputSearchStyle,
          {
            color: AppStyle.color.text,
            backgroundColor: AppStyle.color.surface,
            borderColor: AppStyle.color.border,
          },
          inputSearchStyle,
        ]}
        itemTextStyle={[
          { color: AppStyle.color.text, marginVertical: -10 },
          itemTextStyle,
        ]}
        activeColor={AppStyle.color.grey30}
        search={search}
        data={data}
        itemContainerStyle={[
          { paddingVertical: 0, backgroundColor: AppStyle.color.surface },
          itemContainerStyle,
        ]}
        containerStyle={[
          {
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            backgroundColor: AppStyle.color.surface,
            borderWidth: 1,
            borderColor: AppStyle.color.border,
          },
          containerStyle,
        ]}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        value={multiValue as any}
        // use our toggle handler and custom item renderer
        onChange={(values: any) => {
          // keep compatibility if parent directly updates MultiSelect (still call onChange/onChangeData)
          onChange(values);
          if (onChangeData && Array.isArray(data)) {
            const datat = data
              .filter((d: any) => values.includes(d.value))
              .map((d: any) => d.label);
            onChangeData(datat);
          }
        }}
        maxHeight={maxHeight}
        selectedStyle={[
          styles.selectedStyle,
          {
            backgroundColor: AppStyle.color.surface,
            shadowColor: AppStyle.color.black,
          },
          selectedStyle,
        ]}
        renderSelectedItem={(item, unSelect) => (
          <View
            style={[
              styles.selectedStyle,
              {
                backgroundColor: AppStyle.color.surface,
                shadowColor: AppStyle.color.black,
              },
            ]}
          >
            <Text
              style={[
                styles.textSelectedStyle,
                { color: AppStyle.color.subtext },
                textSelectedStyle,
              ]}
              allowFontScaling={false}
            >
              {item.label}
            </Text>
            <AntDesign
              allowFontScaling={false}
              color="red"
              name="delete"
              size={12}
              style={{ marginLeft: 10 }}
              onPress={() => unSelect && unSelect(item)}
            />
          </View>
        )}
        renderItem={renderMultiItem}
        // track open/close state and show right icon accordingly
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        renderRightIcon={() => {
          if (customIcon && React.isValidElement(customIcon)) {
            return customIcon as React.ReactElement;
          }
          return (
            <AntDesign
              name={isOpen ? 'close' : 'down'}
              size={16}
              color={iconColor || AppStyle.color.subtext}
            />
          );
        }}
      />
    </View>
  ) : (
    <View
      style={[
        { marginVertical: getResponsiveSize(10), width: '100%' },
        container,
      ]}
    >
      {renderLabel()}
      <Dropdown
        style={dropdownStyle}
        disable={disabled}
        // show close when open, down when closed
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        placeholderStyle={[
          styles.placeholderStyle,
          { color: AppStyle.color.subtext },
          placeholderStyle,
        ]}
        selectedTextStyle={[
          styles.selectedTextStyle,
          { color: AppStyle.color.text },
          selectedTextStyle,
        ]}
        inputSearchStyle={[
          styles.inputSearchStyle,
          {
            color: AppStyle.color.text,
            backgroundColor: AppStyle.color.surface,
            borderColor: AppStyle.color.border,
          },
          inputSearchStyle,
        ]}
        itemTextStyle={[{ color: AppStyle.color.text }, itemTextStyle]}
        data={data}
        search={search}
        maxHeight={maxHeight}
        activeColor={AppStyle.color.grey30}
        itemContainerStyle={[
          {
            paddingVertical: 0,
            marginVertical: -10,
            backgroundColor: AppStyle.color.surface,
          },
          itemContainerStyle,
        ]}
        searchField="label"
        containerStyle={[
          {
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            backgroundColor: AppStyle.color.surface,
            borderWidth: 1,
            borderColor: AppStyle.color.border,
          },
          containerStyle,
        ]}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        value={value}
        onChange={(item: any) => {
          onChange(item);
        }}
        renderRightIcon={() => {
          if (customIcon && React.isValidElement(customIcon)) {
            return customIcon as React.ReactElement;
          }
          return (
            <AntDesign
              name={isOpen ? 'up' : 'down'}
              size={14}
              color={iconColor || AppStyle.color.subtext}
            />
          );
        }}
      />
    </View>
  );
};

export default CustomDropdown;
// Static (non-color) styles only — theme-sensitive colors are applied inline at render time
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dropdown: {
    height: getResponsiveSize(45),
    borderWidth: 1,
    borderRadius: getResponsiveSize(5),
    paddingHorizontal: getResponsiveSize(8),
  },
  placeholderStyle: {
    fontSize: getResponsiveSize(12),
  },
  selectedTextStyle: {
    fontSize: getResponsiveSize(12),
  },
  inputSearchStyle: {
    height: getResponsiveSize(35),
    fontSize: getResponsiveSize(12),
  },
  iconStyle: {
    width: getResponsiveSize(20),
    height: getResponsiveSize(20),
  },
  icon: {
    marginRight: getResponsiveSize(5),
  },
  selectedStyle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: getResponsiveSize(14),
    marginTop: getResponsiveSize(5),
    marginRight: getResponsiveSize(10),
    paddingHorizontal: getResponsiveSize(12),
    paddingVertical: getResponsiveSize(8),
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    marginBottom: getResponsiveSize(5),
  },
  textSelectedStyle: {
    marginRight: getResponsiveSize(5),
    fontSize: getResponsiveSize(12),
  },
  item: {
    padding: getResponsiveSize(17),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    position: 'absolute',
    left: '2.5%',
    top: isTablet ? -12 : -8,
    zIndex: 999,
    paddingHorizontal: getResponsiveSize(8),
    fontSize: getResponsiveSize(14),
  },
  disabledDropdown: {
    opacity: 0.5,
  },
  errorDropdown: {},
  errorText: {
    fontSize: getResponsiveSize(12),
    marginTop: getResponsiveSize(5),
  },
});
