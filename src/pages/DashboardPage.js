import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Tag, Button, Avatar, Card, Row, Col, Statistic, Image } from 'antd';
import {
    UserOutlined,
    DashboardOutlined,
    ToolOutlined,
    LogoutOutlined,
    TeamOutlined,
    CheckSquareOutlined,
    SafetyCertificateOutlined,
    NotificationOutlined,
    EyeOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import UserManagementTable from '../components/UserManagementTable';
import DeveloperPanel from '../components/DeveloperPanel';
import BroadcastPanel from '../components/BroadcastPanel';
import api from '../services/api';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const DashboardPage = () => {
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [selectedMenuKey, setSelectedMenuKey] = useState('users');

    // System overview stats state
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (selectedMenuKey === 'overview') {
            fetchStats();
        }
    }, [selectedMenuKey]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            setStats(res.data.data);
        } catch (err) {
            console.error('Fetch stats failed:', err);
        }
    };

    const menuItems = [
        {
            key: 'users',
            icon: <TeamOutlined />,
            label: 'User Management',
        },
        {
            key: 'broadcast',
            icon: <NotificationOutlined />,
            label: 'Broadcast Notifications',
        },
        {
            key: 'overview',
            icon: <DashboardOutlined />,
            label: 'System Overview',
        },
        ...(user?.isDeveloper ? [{
            key: 'developer',
            icon: <ToolOutlined />,
            label: 'Developer Panel',
        }] : []),
    ];

    return (
        <Layout style={{ height: '100vh', maxHeight: '100vh', overflow: 'hidden', background: '#0b0f19' }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={(value) => setCollapsed(value)}
                theme="dark"
                width={260}
                style={{
                    height: '100vh',
                    background: '#151c2c',
                    borderRight: '1px solid #232f48',
                    boxShadow: '4px 0 10px rgba(0,0,0,0.3)'
                }}
            >
                <div style={{
                    padding: '20px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderBottom: '1px solid #232f48'
                }}>
                    <img
                        src="/logo.png"
                        alt="Logo"
                        style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'contain',
                            borderRadius: '8px'
                        }}
                    />
                    {!collapsed && (
                        <div>
                            <div style={{ color: '#f8fafc', fontWeight: '700', fontSize: '15px', lineHeight: '1.2' }}>My Spiritual Assistant</div>
                            <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>Admin Panel</div>
                        </div>
                    )}
                </div>

                <Menu
                    theme="dark"
                    selectedKeys={[selectedMenuKey]}
                    mode="inline"
                    items={menuItems}
                    onClick={({ key }) => setSelectedMenuKey(key)}
                    style={{ background: '#151c2c', marginTop: '16px' }}
                />
            </Sider>

            <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Header style={{
                    padding: '0 24px',
                    background: '#151c2c',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 1px 4px 0 rgba(0, 0, 0, 0.4)',
                    borderBottom: '1px solid #232f48',
                    height: '64px',
                    lineHeight: 'normal',
                    flexShrink: 0,
                    zIndex: 10
                }}>
                    <Title level={4} style={{ margin: 0, color: '#f8fafc', fontWeight: '700', lineHeight: 1 }}>
                        {selectedMenuKey === 'users' && '👥 Devotee & User Management'}
                        {selectedMenuKey === 'broadcast' && '📢 Broadcast Push Notifications'}
                        {selectedMenuKey === 'overview' && '📊 System Overview & Analytics'}
                        {selectedMenuKey === 'developer' && '🛠️ Lead Developer Control Zone'}
                    </Title>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', lineHeight: 'normal' }}>
                            {user?.profile_url ? (
                                <Image
                                    src={user.profile_url}
                                    width={40}
                                    height={40}
                                    style={{ borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '2px solid #6366f1' }}
                                    preview={{ mask: <EyeOutlined style={{ fontSize: '12px' }} /> }}
                                />
                            ) : (
                                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#6366f1' }} size="medium" />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', justifyContent: 'center' }}>
                                <span style={{ color: '#f8fafc', fontWeight: '600', fontSize: '14px', lineHeight: '1' }}>
                                    {user?.name || 'Super-Admin'}
                                </span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <Tag color="purple" style={{ margin: 0, fontSize: '10px', lineHeight: '14px', padding: '0 6px', borderRadius: '4px' }}>SUPER-ADMIN</Tag>
                                    {user?.isDeveloper && <Tag color="gold" style={{ margin: 0, fontSize: '10px', lineHeight: '14px', padding: '0 6px', borderRadius: '4px' }}>DEV</Tag>}
                                </div>
                            </div>
                        </div>

                        <Button
                            type="default"
                            danger
                            icon={<LogoutOutlined />}
                            onClick={logout}
                            style={{ borderRadius: '8px', height: '36px', display: 'inline-flex', alignItems: 'center' }}
                        >
                            Sign Out
                        </Button>
                    </div>
                </Header>

                <Content style={{ padding: '12px 16px', flex: 1, overflowY: 'auto', background: '#0b0f19' }}>
                    {selectedMenuKey === 'users' && <UserManagementTable />}
                    {selectedMenuKey === 'broadcast' && <BroadcastPanel />}

                    {selectedMenuKey === 'overview' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <Row gutter={[24, 24]}>
                                <Col xs={24} sm={12} md={6}>
                                    <Card style={{ borderRadius: '12px' }}>
                                        <Statistic
                                            title="Total Registered Users"
                                            value={stats?.totalUsers || 0}
                                            prefix={<TeamOutlined style={{ color: '#6366f1' }} />}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Card style={{ borderRadius: '12px' }}>
                                        <Statistic
                                            title="Devotees"
                                            value={stats?.devotees || 0}
                                            prefix={<UserOutlined style={{ color: '#10b981' }} />}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Card style={{ borderRadius: '12px' }}>
                                        <Statistic
                                            title="Admins"
                                            value={stats?.admins || 0}
                                            prefix={<SafetyCertificateOutlined style={{ color: '#f59e0b' }} />}
                                        />
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Card style={{ borderRadius: '12px' }}>
                                        <Statistic
                                            title="Active Master Tasks"
                                            value={stats?.activeMasterTasks || 0}
                                            prefix={<CheckSquareOutlined style={{ color: '#8b5cf6' }} />}
                                        />
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    )}

                    {selectedMenuKey === 'developer' && user?.isDeveloper && <DeveloperPanel />}
                </Content>
            </Layout>
        </Layout>
    );
};

export default DashboardPage;
