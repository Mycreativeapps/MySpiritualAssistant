import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Radio, Select, Space, Row, Col, Table, Tag, message, Tooltip, Typography, Avatar, Modal, List } from 'antd';
import { NotificationOutlined, SendOutlined, UserOutlined, TeamOutlined, HistoryOutlined, InfoCircleOutlined, TagOutlined, EyeOutlined, BellOutlined, StarOutlined, MobileOutlined, AimOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Option } = Select;
const { Text } = Typography;

const BroadcastPanel = () => {
    const [form] = Form.useForm();
    const [targetType, setTargetType] = useState('everyone');
    const [usersList, setUsersList] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [sending, setSending] = useState(false);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Modal state for viewing specific targeted recipients
    const [recipientsModalVisible, setRecipientsModalVisible] = useState(false);
    const [selectedBroadcastRecipients, setSelectedBroadcastRecipients] = useState([]);
    const [selectedBroadcastTitle, setSelectedBroadcastTitle] = useState('');

    useEffect(() => {
        fetchBroadcastHistory();
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await api.get('/admin/users', { params: { limit: 200 } });
            if (res.data && res.data.data) {
                setUsersList(res.data.data.users || []);
            }
        } catch (err) {
            console.error('Fetch users error:', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchBroadcastHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await api.get('/admin/broadcast/history');
            if (res.data && res.data.data) {
                setHistory(res.data.data);
            }
        } catch (err) {
            console.error('Fetch history error:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleQuickPreset = (presetTitle) => {
        const currentTitle = form.getFieldValue('title') || '';
        if (!currentTitle.includes(presetTitle)) {
            form.setFieldsValue({ title: `${presetTitle} ${currentTitle}`.trim() });
        }
    };

    const handleSendBroadcast = async (values) => {
        setSending(true);
        try {
            const payload = {
                target_type: targetType,
                target_role: values.target_role,
                target_user_ids: values.target_user_ids,
                title: values.title,
                body: values.body
            };

            const res = await api.post('/admin/broadcast', payload);
            if (res.data && res.data.success) {
                const { targetCount, activeTokensCount, successCount } = res.data.data;
                message.success(`Broadcast sent! Targeted ${targetCount} users (${activeTokensCount} active FCM devices). Success: ${successCount}.`);
                form.resetFields();
                setTargetType('everyone');
                fetchBroadcastHistory();
            }
        } catch (err) {
            console.error('Send broadcast failed:', err);
            message.error(err.response?.data?.message || 'Failed to dispatch broadcast notification');
        } finally {
            setSending(false);
        }
    };

    const columns = [
        {
            title: 'Sent Time',
            dataIndex: 'created_at',
            key: 'created_at',
            width: '16%',
            render: (date) => (
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {new Date(date).toLocaleString()}
                </div>
            )
        },
        {
            title: 'Sender',
            dataIndex: 'sender_name',
            key: 'sender_name',
            width: '14%',
            render: (text) => (
                <Space>
                    <Avatar size="small" style={{ backgroundColor: '#6366f1' }} icon={<UserOutlined />} />
                    <Text style={{ fontWeight: '500', color: '#f8fafc' }}>{text || 'Admin'}</Text>
                </Space>
            )
        },
        {
            title: 'Target Audience',
            key: 'target',
            width: '22%',
            render: (_, record) => {
                if (record.target_type === 'everyone') {
                    return <Tag icon={<TeamOutlined />} color="purple">EVERYONE ({record.target_count})</Tag>;
                } else if (record.target_type === 'role') {
                    return <Tag color="blue">{record.target_role?.toUpperCase()} ({record.target_count})</Tag>;
                } else {
                    return (
                        <Tooltip title="Click to view recipient details">
                            <Tag
                                color="gold"
                                icon={<EyeOutlined />}
                                style={{ cursor: 'pointer', padding: '2px 8px', borderRadius: '4px' }}
                                onClick={() => {
                                    let usersInfo = record.target_users_info || [];
                                    if (typeof usersInfo === 'string') {
                                        try { usersInfo = JSON.parse(usersInfo); } catch (e) { }
                                    }
                                    setSelectedBroadcastRecipients(Array.isArray(usersInfo) ? usersInfo : []);
                                    setSelectedBroadcastTitle(record.title);
                                    setRecipientsModalVisible(true);
                                }}
                            >
                                SPECIFIC USERS ({record.target_count})
                            </Tag>
                        </Tooltip>
                    );
                }
            }
        },
        {
            title: 'Notification Content',
            key: 'content',
            width: '34%',
            render: (_, record) => (
                <div>
                    <div style={{ fontWeight: '600', color: '#f8fafc' }}>{record.title}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{record.body}</div>
                </div>
            )
        },
        {
            title: 'Delivery Status',
            key: 'status',
            width: '14%',
            render: (_, record) => (
                <div>
                    <Tag color="success" style={{ marginBottom: '2px' }}>
                        Delivered: {record.success_count}/{record.target_count}
                    </Tag>
                </div>
            )
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Row gutter={[20, 20]}>
                {/* Send Broadcast Form */}
                <Col xs={24} lg={14}>
                    <Card
                        title={<Space><SendOutlined style={{ color: '#6366f1' }} /> Dispatch Push Broadcast</Space>}
                        style={{ borderRadius: '12px' }}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            initialValues={{ target_type: 'everyone' }}
                            onFinish={handleSendBroadcast}
                        >
                            {/* Audience Target Selector */}
                            <Form.Item label="Target Audience" required>
                                <Radio.Group
                                    value={targetType}
                                    onChange={(e) => setTargetType(e.target.value)}
                                    buttonStyle="solid"
                                    size="middle"
                                >
                                    <Radio.Button value="everyone">
                                        <Space><TeamOutlined /> Everyone ({usersList.length})</Space>
                                    </Radio.Button>
                                    <Radio.Button value="role">Filter by Role</Radio.Button>
                                    <Radio.Button value="users">Select Specific Users</Radio.Button>
                                </Radio.Group>
                            </Form.Item>

                            {/* Conditional Target Input */}
                            {targetType === 'role' && (
                                <Form.Item
                                    name="target_role"
                                    label="Select User Role"
                                    rules={[{ required: true, message: 'Please select a target role' }]}
                                >
                                    <Select placeholder="Choose target role">
                                        <Option value="devotee">Devotees Only</Option>
                                        <Option value="admin">Admins Only</Option>
                                        <Option value="super-admin">Super-Admins Only</Option>
                                    </Select>
                                </Form.Item>
                            )}

                            {targetType === 'users' && (
                                <Form.Item
                                    name="target_user_ids"
                                    label="Select Recipients"
                                    rules={[{ required: true, message: 'Please select at least one recipient' }]}
                                >
                                    <Select
                                        mode="multiple"
                                        placeholder="Search and select users..."
                                        loading={loadingUsers}
                                        optionFilterProp="children"
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                        style={{ width: '100%' }}
                                    >
                                        {usersList.map((user) => (
                                            <Option key={user.id} value={user.id} label={`${user.name} (${user.email})`}>
                                                <Space>
                                                    <Avatar size="small" src={user.profile_url} icon={<UserOutlined />} />
                                                    <span>{user.name}</span>
                                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>({user.email})</span>
                                                </Space>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            )}

                            {/* Quick Presets */}
                            <Form.Item label="Quick Preset Tags">
                                <Space wrap>
                                    <Button size="small" icon={<NotificationOutlined />} onClick={() => handleQuickPreset('[Announcement]')}>
                                        Announcement
                                    </Button>
                                    <Button size="small" icon={<BellOutlined />} onClick={() => handleQuickPreset('[Reminder]')}>
                                        Reminder
                                    </Button>
                                    <Button size="small" icon={<StarOutlined />} onClick={() => handleQuickPreset('[Special Update]')}>
                                        Special Update
                                    </Button>
                                    <Button size="small" icon={<TagOutlined />} onClick={() => handleQuickPreset('[Devotional]')}>
                                        Devotional
                                    </Button>
                                </Space>
                            </Form.Item>

                            {/* Title */}
                            <Form.Item
                                name="title"
                                label="Notification Title"
                                rules={[{ required: true, message: 'Notification title is required' }]}
                            >
                                <Input placeholder="e.g. Evening Satsang Live Stream Notice" size="large" maxLength={100} showCount />
                            </Form.Item>

                            {/* Body */}
                            <Form.Item
                                name="body"
                                label="Notification Message Body"
                                rules={[{ required: true, message: 'Notification body message is required' }]}
                            >
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Enter your push broadcast message..."
                                    maxLength={500}
                                    showCount
                                />
                            </Form.Item>

                            <Button
                                type="primary"
                                size="large"
                                loading={sending}
                                icon={<SendOutlined />}
                                block
                                htmlType="submit"
                                style={{ backgroundColor: '#6366f1', borderColor: '#6366f1', height: '44px', fontWeight: '600' }}
                            >
                                Dispatch Push Broadcast
                            </Button>
                        </Form>
                    </Card>
                </Col>

                {/* Broadcast Guide & Overview */}
                <Col xs={24} lg={10}>
                    <Card title={<Space><InfoCircleOutlined style={{ color: '#52c41a' }} /> Broadcast Guidelines</Space>} style={{ borderRadius: '12px' }}>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #6366f1' }}>
                                <Text style={{ color: '#f8fafc', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MobileOutlined style={{ color: '#6366f1' }} /> Mobile Push Notifications
                                </Text>
                                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                                    Broadcast notifications are delivered via FCM directly to all logged-in user mobile devices.
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #38bdf8' }}>
                                <Text style={{ color: '#f8fafc', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <AimOutlined style={{ color: '#38bdf8' }} /> Multi-User & Role Targeting
                                </Text>
                                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                                    Select <b>Everyone</b> to send to all registered devotees, or choose specific users using the multi-select dropdown.
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                                <Text style={{ color: '#f8fafc', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <BellOutlined style={{ color: '#f59e0b' }} /> Sound & Alert Priority
                                </Text>
                                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                                    All broadcast push notifications play the custom single bell sound on mobile devices.
                                </div>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>

            {/* Broadcast History Table */}
            <Card
                title={<Space><HistoryOutlined /> Broadcast History Log</Space>}
                style={{ borderRadius: '12px' }}
                extra={
                    <Button icon={<HistoryOutlined />} onClick={fetchBroadcastHistory} loading={loadingHistory}>
                        Refresh Logs
                    </Button>
                }
            >
                <Table
                    columns={columns}
                    dataSource={history}
                    rowKey="id"
                    loading={loadingHistory}
                    pagination={{ pageSize: 5 }}
                />
            </Card>

            {/* Modal to view targeted recipients for specific broadcast */}
            <Modal
                title={<Space><UserOutlined style={{ color: '#6366f1' }} /> Targeted Recipients ({selectedBroadcastRecipients.length})</Space>}
                open={recipientsModalVisible}
                onCancel={() => setRecipientsModalVisible(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setRecipientsModalVisible(false)}>
                        Close
                    </Button>
                ]}
            >
                <div style={{ marginBottom: '16px', padding: '12px', background: '#1e293b', borderRadius: '8px', borderLeft: '4px solid #6366f1' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Broadcast Title:</div>
                    <div style={{ color: '#f8fafc', fontWeight: '600' }}>{selectedBroadcastTitle}</div>
                </div>

                {selectedBroadcastRecipients.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        No specific recipient details recorded for this past broadcast.
                    </div>
                ) : (
                    <List
                        itemLayout="horizontal"
                        dataSource={selectedBroadcastRecipients}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<Avatar style={{ backgroundColor: '#6366f1' }} icon={<UserOutlined />} />}
                                    title={<span style={{ color: '#f8fafc', fontWeight: '600' }}>{item.name}</span>}
                                    description={<span style={{ color: '#94a3b8', fontSize: '12px' }}>{item.email}</span>}
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Modal>
        </div>
    );
};

export default BroadcastPanel;
