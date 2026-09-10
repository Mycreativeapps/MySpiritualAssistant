import React, { useState, useEffect } from 'react';
import { Card, Input, Switch, Space, Typography, Tag, Row, Col, Alert, message, Spin, Statistic, Button, Divider } from 'antd';
import { ToolOutlined, ApiOutlined, CheckCircleOutlined, ThunderboltOutlined, CreditCardOutlined, SaveOutlined, PlusOutlined, DeleteOutlined, MailOutlined, StarOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Text } = Typography;

const DeveloperPanel = () => {
    const [settings, setSettings] = useState({});
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    // Donation Details state
    const [donationMethods, setDonationMethods] = useState([]);
    const [savingDonation, setSavingDonation] = useState(false);

    // Alert Emails state
    const [alertEmails, setAlertEmails] = useState([]);
    const [newEmailInput, setNewEmailInput] = useState('');
    const [savingEmails, setSavingEmails] = useState(false);

    // Task Score Labels state
    const [scoreLabels, setScoreLabels] = useState({});
    const [savingScores, setSavingScores] = useState(false);

    useEffect(() => {
        fetchDeveloperData();
    }, []);

    useEffect(() => {
        if (settings.donation_details) {
            let details = settings.donation_details;
            if (typeof details === 'string') {
                try { details = JSON.parse(details); } catch (e) { }
            }
            if (Array.isArray(details)) {
                setDonationMethods(details);
            }
        }

        if (settings.alert_emails) {
            let emails = settings.alert_emails;
            if (typeof emails === 'string') {
                try { emails = JSON.parse(emails); } catch (e) { }
            }
            if (Array.isArray(emails)) {
                setAlertEmails(emails);
            }
        }

        if (settings.task_score_labels) {
            let labels = settings.task_score_labels;
            if (typeof labels === 'string') {
                try { labels = JSON.parse(labels); } catch (e) { }
            }
            if (typeof labels === 'object' && labels !== null) {
                setScoreLabels(labels);
            }
        }
    }, [settings.donation_details, settings.alert_emails, settings.task_score_labels]);

    const fetchDeveloperData = async () => {
        setLoading(true);
        try {
            const [settingsRes, healthRes] = await Promise.all([
                api.get('/admin/developer/settings'),
                api.get('/admin/developer/health')
            ]);

            setSettings(settingsRes.data.data || {});
            setHealth(healthRes.data.data || null);
        } catch (err) {
            console.error('Fetch developer panel data failed:', err);
            message.error(err.response?.data?.message || 'Failed to load developer panel data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSetting = async (key, newValue) => {
        try {
            await api.post('/admin/developer/settings', { key, value: newValue });
            message.success(`Setting '${key}' updated successfully!`);
            setSettings(prev => ({ ...prev, [key]: newValue }));
        } catch (err) {
            message.error(err.response?.data?.message || 'Failed to update setting');
            fetchDeveloperData();
        }
    };

    // Donation Details Methods handlers
    const handleMethodChange = (methodIndex, field, value) => {
        setDonationMethods(prev => {
            const updated = [...prev];
            updated[methodIndex] = { ...updated[methodIndex], [field]: value };
            return updated;
        });
    };

    const handleDetailFieldChange = (methodIndex, detailIndex, field, value) => {
        setDonationMethods(prev => {
            const updated = [...prev];
            const method = { ...updated[methodIndex] };
            const details = [...method.details];
            details[detailIndex] = { ...details[detailIndex], [field]: value };
            method.details = details;
            updated[methodIndex] = method;
            return updated;
        });
    };

    const handleAddDetailField = (methodIndex) => {
        setDonationMethods(prev => {
            const updated = [...prev];
            const method = { ...updated[methodIndex] };
            method.details = [...method.details, { label: 'New Field', value: '' }];
            updated[methodIndex] = method;
            return updated;
        });
    };

    const handleRemoveDetailField = (methodIndex, detailIndex) => {
        setDonationMethods(prev => {
            const updated = [...prev];
            const method = { ...updated[methodIndex] };
            method.details = method.details.filter((_, idx) => idx !== detailIndex);
            updated[methodIndex] = method;
            return updated;
        });
    };

    const handleSaveDonationDetails = async () => {
        setSavingDonation(true);
        try {
            await handleUpdateSetting('donation_details', donationMethods);
        } finally {
            setSavingDonation(false);
        }
    };

    // Alert Emails Handlers
    const handleAddEmail = () => {
        if (!newEmailInput || !newEmailInput.includes('@')) {
            return message.error('Please enter a valid email address');
        }
        if (alertEmails.includes(newEmailInput.trim())) {
            return message.warning('Email address is already in the list');
        }
        setAlertEmails(prev => [...prev, newEmailInput.trim()]);
        setNewEmailInput('');
    };

    const handleRemoveEmail = (emailToRemove) => {
        setAlertEmails(prev => prev.filter(e => e !== emailToRemove));
    };

    const handleSaveAlertEmails = async () => {
        setSavingEmails(true);
        try {
            await handleUpdateSetting('alert_emails', alertEmails);
        } finally {
            setSavingEmails(false);
        }
    };

    // Task Score Labels Handlers
    const handleScoreLabelChange = (scoreKey, newLabel) => {
        setScoreLabels(prev => ({
            ...prev,
            [scoreKey]: newLabel
        }));
    };

    const handleSaveScoreLabels = async () => {
        setSavingScores(true);
        try {
            await handleUpdateSetting('task_score_labels', scoreLabels);
        } finally {
            setSavingScores(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px', color: '#64748b' }}>Loading Developer Control Panel...</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Alert
                message="Lead Developer Control Zone"
                description="This panel is strictly accessible to account 1782923913061_7e2b. Settings changed here directly affect the production backend DB configuration."
                type="warning"
                showIcon
                icon={<ToolOutlined />}
                style={{ borderRadius: '12px' }}
            />

            {/* System Health Overview */}
            {health && (
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                        <Card style={{ borderRadius: '12px' }}>
                            <Statistic
                                title="DB Latency"
                                value={health.dbLatencyMs}
                                suffix="ms"
                                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            />
                            <Tag color="success" style={{ marginTop: '8px' }}>{health.dbStatus}</Tag>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card style={{ borderRadius: '12px' }}>
                            <Statistic
                                title="Server Uptime"
                                value={Math.floor(health.uptimeSeconds / 60)}
                                suffix="mins"
                                prefix={<ThunderboltOutlined style={{ color: '#faad14' }} />}
                            />
                            <Tag color="blue" style={{ marginTop: '8px' }}>Node {health.nodeVersion}</Tag>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card style={{ borderRadius: '12px' }}>
                            <Statistic
                                title="Environment"
                                value={health.env.toUpperCase()}
                                prefix={<ApiOutlined style={{ color: '#722ed1' }} />}
                            />
                            <Tag color="purple" style={{ marginTop: '8px' }}>Active</Tag>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card style={{ borderRadius: '12px' }}>
                            <Statistic
                                title="Server Time"
                                value={new Date(health.serverTime).toLocaleTimeString()}
                            />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                {new Date(health.serverTime).toLocaleDateString()}
                            </Text>
                        </Card>
                    </Col>
                </Row>
            )}

            <Row gutter={[24, 24]}>
                {/* App Feature Settings */}
                <Col xs={24} lg={10}>
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <Card title={<Space><ToolOutlined /> Dynamic App Configuration</Space>} style={{ borderRadius: '12px' }}>
                            <Space direction="vertical" style={{ width: '100%' }} size="large">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>Mentor-Mentee System</div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Enable lot assignments & mentorship features</Text>
                                    </div>
                                    <Switch
                                        checked={Boolean(settings.mentor_mentee_enabled)}
                                        onChange={(checked) => handleUpdateSetting('mentor_mentee_enabled', checked)}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>Minimum Task Requirement</div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Default daily task target for new devotees</Text>
                                    </div>
                                    <Input
                                        type="number"
                                        style={{ width: '100px' }}
                                        defaultValue={settings.minimum_task || 1}
                                        onBlur={(e) => handleUpdateSetting('minimum_task', parseInt(e.target.value))}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>Max Users Registration Limit</div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Triggers admin alert when capacity is full</Text>
                                    </div>
                                    <Input
                                        key={settings.users_limit}
                                        type="number"
                                        style={{ width: '120px' }}
                                        defaultValue={settings.users_limit || 1000}
                                        onBlur={(e) => handleUpdateSetting('users_limit', parseInt(e.target.value))}
                                    />
                                </div>
                            </Space>
                        </Card>

                        {/* App Version & In-App Update Manager Card */}
                        <Card title={<Space><ThunderboltOutlined style={{ color: '#06b6d4' }} /> Mobile App Version & In-App Update Manager</Space>} style={{ borderRadius: '12px' }}>
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>Latest App Version</div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Prompts update if client version is lower</Text>
                                    </div>
                                    <Input
                                        style={{ width: '120px' }}
                                        defaultValue={settings.latest_app_version || '1.0.4'}
                                        placeholder="e.g. 1.0.5"
                                        onBlur={(e) => handleUpdateSetting('latest_app_version', e.target.value.trim())}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>Minimum Required Version</div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Forces update if client version is below this</Text>
                                    </div>
                                    <Input
                                        style={{ width: '120px' }}
                                        defaultValue={settings.min_required_version || '1.0.0'}
                                        placeholder="e.g. 1.0.0"
                                        onBlur={(e) => handleUpdateSetting('min_required_version', e.target.value.trim())}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '600' }}>Force Update Mode</div>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Blocks app usage until update is installed</Text>
                                    </div>
                                    <Switch
                                        checked={Boolean(settings.force_update_enabled)}
                                        onChange={(checked) => handleUpdateSetting('force_update_enabled', checked)}
                                    />
                                </div>

                                <div>
                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>Google Play Store URL</div>
                                    <Input
                                        defaultValue={settings.play_store_url || 'https://play.google.com/store/apps/details?id=com.myspiritualcoach'}
                                        placeholder="Play store link"
                                        onBlur={(e) => handleUpdateSetting('play_store_url', e.target.value.trim())}
                                    />
                                </div>
                            </Space>
                        </Card>


                        {/* System Alert Email Recipients (alert_emails) */}
                        <Card
                            title={<Space><MailOutlined style={{ color: '#e11d48' }} /> System Alert Email Recipients (`alert_emails`)</Space>}
                            style={{ borderRadius: '12px' }}
                            extra={
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    loading={savingEmails}
                                    onClick={handleSaveAlertEmails}
                                    style={{ backgroundColor: '#e11d48', borderColor: '#e11d48' }}
                                >
                                    Save Alert Emails
                                </Button>
                            }
                        >
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                                    These email addresses receive critical server notification alerts (e.g. capacity limits exceeded).
                                </div>

                                <Space wrap>
                                    {alertEmails.map((email) => (
                                        <Tag
                                            key={email}
                                            closable
                                            onClose={() => handleRemoveEmail(email)}
                                            color="volcano"
                                            style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '13px' }}
                                        >
                                            {email}
                                        </Tag>
                                    ))}
                                </Space>

                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <Input
                                        placeholder="Add new alert recipient email..."
                                        value={newEmailInput}
                                        onChange={(e) => setNewEmailInput(e.target.value)}
                                        onPressEnter={handleAddEmail}
                                    />
                                    <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddEmail}>
                                        Add
                                    </Button>
                                </div>
                            </Space>
                        </Card>
                    </Space>
                </Col>

                {/* Support Us & Task Score Labels Configuration */}
                <Col xs={24} lg={14}>
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <Card
                            title={<Space><CreditCardOutlined style={{ color: '#10b981' }} /> Mobile App 'Support Us' Donation Details (`donation_details`)</Space>}
                            style={{ borderRadius: '12px' }}
                            extra={
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    loading={savingDonation}
                                    onClick={handleSaveDonationDetails}
                                    style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                                >
                                    Save Donation Details
                                </Button>
                            }
                        >
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                {donationMethods.map((method, methodIdx) => (
                                    <Card
                                        key={method.id || methodIdx}
                                        type="inner"
                                        title={<Text style={{ color: '#f8fafc', fontWeight: '600' }}>Payment Method: {method.name}</Text>}
                                        style={{ backgroundColor: '#1e293b', borderRadius: '8px', borderColor: '#334155' }}
                                    >
                                        <Row gutter={[16, 12]}>
                                            <Col xs={24} sm={12}>
                                                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Method Name</div>
                                                <Input
                                                    value={method.name}
                                                    onChange={(e) => handleMethodChange(methodIdx, 'name', e.target.value)}
                                                />
                                            </Col>
                                            <Col xs={24} sm={12}>
                                                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Subtitle / Apps</div>
                                                <Input
                                                    value={method.sub}
                                                    onChange={(e) => handleMethodChange(methodIdx, 'sub', e.target.value)}
                                                />
                                            </Col>
                                        </Row>

                                        <Divider style={{ margin: '16px 0 12px 0', borderColor: '#334155' }} />

                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc', marginBottom: '8px' }}>
                                            Account & Payment Details Fields:
                                        </div>

                                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                                            {method.details?.map((det, detIdx) => (
                                                <Row gutter={[12, 8]} key={detIdx} align="middle">
                                                    <Col xs={10} sm={8}>
                                                        <Input
                                                            placeholder="Label (e.g. Account No)"
                                                            value={det.label}
                                                            onChange={(e) => handleDetailFieldChange(methodIdx, detIdx, 'label', e.target.value)}
                                                        />
                                                    </Col>
                                                    <Col xs={12} sm={14}>
                                                        <Input
                                                            placeholder="Value"
                                                            value={det.value}
                                                            onChange={(e) => handleDetailFieldChange(methodIdx, detIdx, 'value', e.target.value)}
                                                        />
                                                    </Col>
                                                    <Col xs={2} sm={2}>
                                                        <Button
                                                            type="text"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            onClick={() => handleRemoveDetailField(methodIdx, detIdx)}
                                                        />
                                                    </Col>
                                                </Row>
                                            ))}

                                            <Button
                                                type="dashed"
                                                icon={<PlusOutlined />}
                                                onClick={() => handleAddDetailField(methodIdx)}
                                                style={{ marginTop: '8px', width: '100%' }}
                                            >
                                                Add Detail Field
                                            </Button>
                                        </Space>
                                    </Card>
                                ))}
                            </Space>
                        </Card>

                        {/* Task Score Evaluation Labels (`task_score_labels`) */}
                        <Card
                            title={<Space><StarOutlined style={{ color: '#f59e0b' }} /> Daily Task Evaluation Score Labels (`task_score_labels`)</Space>}
                            style={{ borderRadius: '12px' }}
                            extra={
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    loading={savingScores}
                                    onClick={handleSaveScoreLabels}
                                    style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
                                >
                                    Save Score Labels
                                </Button>
                            }
                        >
                            <Space direction="vertical" style={{ width: '100%' }} size="small">
                                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                                    Descriptive labels used in the mobile app for daily devotee task ratings (1 - 10 scores).
                                </div>

                                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((scoreNum) => (
                                    <Row gutter={[12, 8]} key={scoreNum} align="middle">
                                        <Col xs={6} sm={4}>
                                            <Tag color="gold" style={{ width: '100%', textAlign: 'center', fontSize: '12px' }}>
                                                Score {scoreNum}
                                            </Tag>
                                        </Col>
                                        <Col xs={18} sm={20}>
                                            <Input
                                                value={scoreLabels[scoreNum] || ''}
                                                placeholder={`Label for score ${scoreNum}`}
                                                onChange={(e) => handleScoreLabelChange(scoreNum, e.target.value)}
                                            />
                                        </Col>
                                    </Row>
                                ))}
                            </Space>
                        </Card>
                    </Space>
                </Col>
            </Row>
        </div>
    );
};

export default DeveloperPanel;
