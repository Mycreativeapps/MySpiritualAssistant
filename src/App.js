import React from 'react';
import { Spin, ConfigProvider, theme } from 'antd';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

const MainApp = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: '#0b0f19'
            }}>
                <Spin size="large" tip="Verifying Super-Admin Session..." />
            </div>
        );
    }

    return user ? <DashboardPage /> : <LoginPage />;
};

function App() {
    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#6366f1',
                    borderRadius: 10,
                    colorBgLayout: '#0b0f19',
                    colorBgContainer: '#151c2c',
                    colorBgElevated: '#151c2c',
                    colorBorder: '#232f48',
                    colorBorderSecondary: '#232f48',
                    colorText: '#f8fafc',
                    colorTextSecondary: '#94a3b8',
                },
            }}
        >
            <AuthProvider>
                <MainApp />
            </AuthProvider>
        </ConfigProvider>
    );
}

export default App;
