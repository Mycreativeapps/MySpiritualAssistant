import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions } from 'react-native';
import AppStyle from '../config/styles';

interface TabItem {
    title: string;
    value?: any;
    render?: () => React.ReactNode;
}

interface CustomTabsProps {
    tabs: TabItem[];
    activeTab: number;
    onChange: (index: number) => void;
    tabStyle?: any;
    containerStyle?: any;
    contentContainerStyle?: any;
}

const CustomTabs: React.FC<CustomTabsProps> = ({ tabs, activeTab, onChange, tabStyle, containerStyle, contentContainerStyle }) => {
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (tabs.length > 0 && activeTab >= 0 && activeTab < tabs.length) {
            flatListRef.current?.scrollToIndex({
                index: activeTab,
                animated: true,
                viewPosition: 0.5
            });
        }
    }, [activeTab, tabs]);

    const renderItem = ({ item, index }: { item: TabItem, index: number }) => {
        const isActive = activeTab === index;
        return (
            <TouchableOpacity
                onPress={() => onChange(index)}
                style={[
                    styles.tabItem,
                    { backgroundColor: AppStyle.color.grey30 },
                    isActive && {
                        backgroundColor: AppStyle.color.primary,
                        elevation: 3,
                        shadowColor: AppStyle.color.primary,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 3,
                    },
                    tabStyle
                ]}
                activeOpacity={0.7}
            >
                <Text style={[
                    styles.tabText,
                    { color: AppStyle.color.subtext },
                    isActive && styles.activeTabText
                ]}>
                    {item.title}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: AppStyle.color.background }, containerStyle]}>
            <View style={[styles.tabBarContainer, { backgroundColor: AppStyle.color.surface }]}>
                <FlatList
                    ref={flatListRef}
                    data={tabs}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={styles.tabBarContent}
                    onScrollToIndexFailed={(info) => {
                        setTimeout(() => {
                            if (flatListRef.current) {
                                flatListRef.current.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
                            }
                        }, 500);
                    }}
                    extraData={activeTab}
                />
            </View>
            <View style={[styles.contentContainer, { backgroundColor: AppStyle.color.background }, contentContainerStyle]}>
                {tabs[activeTab]?.render && tabs[activeTab].render()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabBarContainer: {
        paddingVertical: 10,
        elevation: 2,
        shadowColor: AppStyle.color.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tabBarContent: {
        paddingHorizontal: 15,
        alignItems: 'center',
    },
    tabItem: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        marginRight: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    activeTabText: {
        color: AppStyle.color.white,
        fontWeight: 'bold',
    },
    contentContainer: {
        flex: 1,
    }
});

export default CustomTabs;
