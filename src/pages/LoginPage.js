import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, message } from 'antd';
import { UserOutlined, LockOutlined, CrownOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const LoginPage = () => {
    const { login } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const onFinish = async (values) => {
        setSubmitting(true);
        setErrorMessage('');
        try {
            await login(values.email, values.password);
            message.success('Welcome back, Super-Admin!');
        } catch (err) {
            setErrorMessage(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            maxHeight: '100vh',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #17212B 0%, #1E2B38 50%, #17212B 100%)',
            padding: '20px'
        }}>
            <Card
                style={{
                    width: '100%',
                    maxWidth: '440px',
                    borderRadius: '16px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    background: '#1E2B38',
                    border: '1px solid #232E3C'
                }}
                bodyStyle={{ padding: '40px 32px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #7961E4 0%, #5D45D3 100%)',
                        color: '#fff',
                        fontSize: '32px',
                        marginBottom: '16px',
                        boxShadow: '0 10px 15px -3px rgba(121, 97, 228, 0.4)'
                    }}>
                        <CrownOutlined />
                    </div>
                    <Title level={2} style={{ color: '#FFFFFF', margin: '0 0 8px 0', fontWeight: '700' }}>
                        My Spiritual Assistant Admin Panel
                    </Title>
                    <Text style={{ color: '#A0A8B8', fontSize: '14px' }}>
                        Strictly Reserved for Super-Administrators
                    </Text>
                </div>

                {errorMessage && (
                    <Alert
                        message="Access Restricted"
                        description={errorMessage}
                        type="error"
                        showIcon
                        style={{ marginBottom: '24px', borderRadius: '8px' }}
                    />
                )}

                <Form
                    name="admin_login"
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                    size="large"
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please input your email!' },
                            { type: 'email', message: 'Please enter a valid email address!' }
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: '#7F92A3' }} />}
                            placeholder="Email address"
                            style={{ borderRadius: '8px', background: '#17212B', borderColor: '#232E3C', color: '#FFFFFF' }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your password!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#7F92A3' }} />}
                            placeholder="Password"
                            style={{ borderRadius: '8px', background: '#17212B', borderColor: '#232E3C', color: '#FFFFFF' }}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginTop: '32px', marginBottom: 0 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            block
                            style={{
                                height: '48px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, #7961E4 0%, #5D45D3 100%)',
                                border: 'none',
                                fontWeight: '600',
                                fontSize: '16px',
                                boxShadow: '0 4px 14px 0 rgba(121, 97, 228, 0.39)'
                            }}
                        >
                            Sign In to Web Portal
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;
