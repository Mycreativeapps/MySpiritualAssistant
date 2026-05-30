import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import AppStyle from '../config/styles';

interface FullScreenLoaderProps {
    visible: boolean;
}

const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ visible }) => {
    if (!visible) return null;

    return (
        <Modal
            transparent={true}
            animationType="fade"
            visible={visible}
            statusBarTranslucent
        >
            <View style={styles.container}>
                <ActivityIndicator size="large" color={AppStyle.color.white} />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AppStyle.color.transparentBlack,
    },
});

export default FullScreenLoader;
