import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Input, Select, Button, Modal, Drawer, Form, Space, message, Card, Popconfirm, Avatar, Image, Divider, Tooltip } from 'antd';
import { SearchOutlined, UserOutlined, EditOutlined, StopOutlined, CheckCircleOutlined, EyeOutlined, ReloadOutlined, CameraOutlined, EnvironmentOutlined, FolderOutlined, ThunderboltOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Option } = Select;

const UserManagementTable = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 8, total: 0 });
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Debounce search input for real-time live typing filter
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
        }, 250);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Modal & Drawer States
    const [editRoleUser, setEditRoleUser] = useState(null);
    const [roleModalVisible, setRoleModalVisible] = useState(false);
    const [selectedRole, setSelectedRole] = useState('');

    const [viewUser, setViewUser] = useState(null);
    const [drawerVisible, setDrawerVisible] = useState(false);

    const fetchUsers = useCallback(async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users', {
                params: {
                    page,
                    limit: pageSize,
                    search,
                    role: roleFilter,
                    status: statusFilter
                }
            });

            if (res.data && res.data.data) {
                const { users: fetchedUsers, pagination: pg } = res.data.data;
                setUsers(fetchedUsers);
                setPagination({
                    current: pg.page,
                    pageSize: pg.limit,
                    total: pg.total
                });
            }
        } catch (err) {
            console.error('Fetch users error:', err);
            message.error(err.response?.data?.message || 'Failed to fetch user list');
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter, statusFilter]);

    useEffect(() => {
        fetchUsers(1, pagination.pageSize);
    }, [fetchUsers, pagination.pageSize]);

    const handleTableChange = (pag) => {
        fetchUsers(pag.current, pag.pageSize);
    };

    // Helper function to render Icon-Only permission badges with Tooltip (Color = Allowed, Grayscale B&W = Denied)
    const renderPermissionIcon = (name, icon, status, colorCode) => {
        let isAllowed = status === 'on' || status === 'granted' || status === true;

        const titleText = `${name}: ${isAllowed ? 'ALLOWED (Granted)' : 'DENIED (Blocked)'}`;

        return (
            <Tooltip title={titleText} placement="top">
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        fontSize: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: isAllowed ? 'rgba(30, 41, 59, 0.9)' : '#0f172a',
                        border: isAllowed ? `1.5px solid ${colorCode}` : '1px solid #334155',
                        color: isAllowed ? colorCode : '#64748b',
                        filter: isAllowed ? 'none' : 'grayscale(100%)',
                        opacity: isAllowed ? 1 : 0.5,
                        boxShadow: isAllowed ? `0 0 12px ${colorCode}44` : 'none',
                    }}
                >
                    {icon}
                </div>
            </Tooltip>
        );
    };



    // Update Role Action
    const handleRoleUpdate = async () => {
        if (!editRoleUser || !selectedRole) return;
        try {
            await api.patch(`/admin/users/${editRoleUser.id}/role`, { role: selectedRole });
            message.success(`User role updated to ${selectedRole.toUpperCase()}!`);
            setRoleModalVisible(false);
            fetchUsers(pagination.current, pagination.pageSize);
        } catch (err) {
            message.error(err.response?.data?.message || 'Failed to update role');
        }
    };

    // Toggle Active Status (Block / Unblock)
    const handleToggleStatus = async (userRecord) => {
        const newStatus = !userRecord.is_active;
        try {
            await api.patch(`/admin/users/${userRecord.id}/status`, { is_active: newStatus });
            message.success(`User ${newStatus ? 'activated' : 'suspended'} successfully!`);
            fetchUsers(pagination.current, pagination.pageSize);
        } catch (err) {
            message.error(err.response?.data?.message || 'Failed to update user status');
        }
    };

    const getRoleTag = (role) => {
        switch (role) {
            case 'super-admin':
                return <Tag color="purple" key={role}>SUPER-ADMIN</Tag>;
            case 'admin':
                return <Tag color="gold" key={role}>ADMIN</Tag>;
            default:
                return <Tag color="blue" key={role}>DEVOTEE</Tag>;
        }
    };

    const columns = [
        {
            title: 'User Name',
            dataIndex: 'name',
            key: 'name',
            width: '26%',
            render: (text, record) => (
                <Space align="center">
                    {record.profile_url ? (
                        <Image
                            src={record.profile_url}
                            width={38}
                            height={38}
                            style={{ borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '1px solid #6366f1' }}
                            preview={{ mask: <EyeOutlined style={{ fontSize: '12px' }} /> }}
                        />
                    ) : (
                        <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#6366f1' }} />
                    )}
                    <div>
                        <div style={{ fontWeight: '600', color: '#f8fafc' }}>{text}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {record.email} {record.app_version && <Tag color="purple" style={{ fontSize: '10px', margin: 0, padding: '0 4px' }}>{record.app_version}</Tag>}
                        </div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Phone',
            dataIndex: 'phone_number',
            key: 'phone_number',
            width: '16%',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            width: '14%',
            render: (role) => getRoleTag(role),
        },
        {
            title: 'Status',
            dataIndex: 'is_active',
            key: 'is_active',
            width: '14%',
            render: (isActive) => (
                isActive ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">Active</Tag>
                ) : (
                    <Tag icon={<StopOutlined />} color="error">Suspended</Tag>
                )
            ),
        },
        {
            title: 'Joined',
            dataIndex: 'created_at',
            key: 'created_at',
            width: '12%',
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: '18%',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setViewUser(record);
                            setDrawerVisible(true);
                        }}
                    >
                        View
                    </Button>

                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined style={{ color: '#6366f1' }} />}
                        onClick={() => {
                            setEditRoleUser(record);
                            setSelectedRole(record.role);
                            setRoleModalVisible(true);
                        }}
                    >
                        Role
                    </Button>

                    <Popconfirm
                        title={`${record.is_active ? 'Suspend' : 'Activate'} User`}
                        description={`Are you sure you want to ${record.is_active ? 'suspend' : 'activate'} ${record.name}?`}
                        onConfirm={() => handleToggleStatus(record)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="text"
                            size="small"
                            danger={record.is_active}
                            icon={record.is_active ? <StopOutlined /> : <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        >
                            {record.is_active ? 'Suspend' : 'Activate'}
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Card style={{ marginBottom: '10px', borderRadius: '12px' }}>
                <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Input.Search
                        placeholder="Search by Name, Email, Phone"
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onSearch={(val) => setSearch(val)}
                        style={{ width: 320 }}
                    />

                    <Space wrap size="middle">
                        <Select
                            placeholder="Filter by Role"
                            allowClear
                            style={{ width: 160 }}
                            size="large"
                            onChange={(val) => setRoleFilter(val || '')}
                        >
                            <Option value="devotee">Devotee</Option>
                            <Option value="admin">Admin</Option>
                            <Option value="super-admin">Super-Admin</Option>
                        </Select>

                        <Select
                            placeholder="Filter by Status"
                            allowClear
                            style={{ width: 160 }}
                            size="large"
                            onChange={(val) => setStatusFilter(val || '')}
                        >
                            <Option value="active">Active</Option>
                            <Option value="suspended">Suspended</Option>
                        </Select>

                        <Button
                            icon={<ReloadOutlined />}
                            size="large"
                            onClick={() => fetchUsers(pagination.current, pagination.pageSize)}
                        >
                            Refresh
                        </Button>
                    </Space>
                </Space>
            </Card>

            <Card style={{ borderRadius: '12px' }} bodyStyle={{ padding: '12px 16px' }}>
                <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="id"
                    pagination={pagination}
                    loading={loading}
                    onChange={handleTableChange}
                />
            </Card>

            {/* Role Change Modal */}
            <Modal
                title={`Change Role: ${editRoleUser?.name}`}
                open={roleModalVisible}
                onOk={handleRoleUpdate}
                onCancel={() => setRoleModalVisible(false)}
                okText="Update Role"
            >
                <Form layout="vertical">
                    <Form.Item label="Select New Role">
                        <Select
                            value={selectedRole}
                            onChange={(val) => setSelectedRole(val)}
                            style={{ width: '100%' }}
                        >
                            <Option value="devotee">Devotee (Standard User)</Option>
                            <Option value="admin">Admin (Operational Mobile Admin)</Option>
                            <Option value="super-admin">Super-Admin (Full Web & Mobile Access)</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* User Profile View Drawer */}
            <Drawer
                title="Devotee Profile Details"
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width={420}
                footerStyle={{ backgroundColor: '#151c2c', borderColor: '#232f48', padding: '12px 16px' }}
                drawerStyle={{ backgroundColor: '#151c2c' }}
                footer={
                    viewUser && (
                        <div style={{ background: '#151c2c' }}>
                            <div style={{ fontWeight: '600', color: '#94a3b8', marginBottom: '8px', fontSize: '12px' }}>
                                📱 Mobile Device Permissions:
                            </div>
                            <Space size="middle" align="center">
                                {renderPermissionIcon('Camera', <CameraOutlined />, viewUser.permissions_status?.camera, '#38bdf8')}
                                {renderPermissionIcon('Location', <EnvironmentOutlined />, viewUser.permissions_status?.location, '#10b981')}
                                {renderPermissionIcon('Media / Storage', <FolderOutlined />, viewUser.permissions_status?.media, '#f59e0b')}
                                {renderPermissionIcon('Battery Optimization', <ThunderboltOutlined />, viewUser.permissions_status?.battery, '#a855f7')}
                            </Space>
                        </div>
                    )
                }
            >
                {viewUser && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                            {viewUser.profile_url ? (
                                <Image
                                    src={viewUser.profile_url}
                                    width={100}
                                    height={100}
                                    style={{ borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '3px solid #6366f1' }}
                                    preview={{ mask: <Space><EyeOutlined /> Zoom</Space> }}
                                />
                            ) : (
                                <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#6366f1' }} />
                            )}
                            <h3 style={{ margin: '12px 0 4px 0', color: '#f8fafc' }}>{viewUser.name}</h3>
                            {getRoleTag(viewUser.role)}
                        </div>

                        <div><strong>App Version:</strong> <Tag color="purple" style={{ fontWeight: '600' }}>{viewUser.app_version || 'v1.0.0'}</Tag></div>
                        <div><strong>Email:</strong> {viewUser.email}</div>
                        <div><strong>Phone:</strong> {viewUser.phone_number}</div>
                        <div><strong>Gender:</strong> {viewUser.gender ? viewUser.gender.toUpperCase() : 'Not specified'}</div>
                        <div>
                            <strong>Age:</strong>{' '}
                            {viewUser.year_of_birth
                                ? `${new Date().getFullYear() - viewUser.year_of_birth} Years (${viewUser.year_of_birth})`
                                : 'Not specified'}
                        </div>
                        <div><strong>Time Zone:</strong> {viewUser.timezone || 'UTC'}</div>
                        <div>
                            <strong>Login Status:</strong>{' '}
                            {viewUser.is_logged_in ? (
                                <Tag icon={<CheckCircleOutlined />} color="success">Logged In</Tag>
                            ) : (
                                <Tag color="default">Logged Out</Tag>
                            )}
                        </div>

                        <Divider style={{ margin: '8px 0', borderColor: '#232f48' }} />

                        <div><strong>Account Status:</strong> {viewUser.is_active ? 'Active' : 'Suspended'}</div>
                        <div><strong>Registered On:</strong> {new Date(viewUser.created_at).toLocaleString()}</div>
                        <div><strong>Last App Opened:</strong> {viewUser.last_app_opened ? new Date(viewUser.last_app_opened).toLocaleString() : 'N/A'}</div>
                    </div>
                )}
            </Drawer>

        </div>
    );
};

export default UserManagementTable;
