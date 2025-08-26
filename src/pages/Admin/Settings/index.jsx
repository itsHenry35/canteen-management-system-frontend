import React, {useEffect, useState} from 'react';
import {Card, Spin, Tabs, Typography} from 'antd';
import {DingdingOutlined, FieldTimeOutlined, GlobalOutlined} from '@ant-design/icons';
import PageLayout from '../../../components/PageLayout';
import WebsiteSettings from './WebsiteSettings';
import DingtalkSettings from './DingtalkSettings';
import SchedulerSettings from './SchedulerSettings';
import {getSettings} from '../../../api/setting';
import {Link, useSearchParams} from 'react-router-dom';

const {Title} = Typography;
const {TabPane} = Tabs;

const Settings = () => {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        website: {
            name: '',
            icp_beian: '',
            public_sec_beian: '',
            domain: ''
        },
        dingtalk: {
            app_key: '',
            app_secret: '',
            agent_id: '',
            corp_id: ''
        },
        scheduler: {
            enabled: false,
            cleanup_time: "02:00",
            reminder_before_end_hours: 6
        }
    });
    const [searchParams, setSearchParams] = useSearchParams();

    // 当前激活的标签页
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'website');

    // 获取系统设置
    const fetchSettings = async () => {
        try {
            setLoading(true);
            const data = await getSettings();
            setSettings(data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    // 组件挂载时获取数据
    useEffect(() => {
        fetchSettings();
    }, []);

    // 处理标签页切换
    const handleTabChange = (key) => {
        setActiveTab(key);
        setSearchParams({tab: key});
    };

    // 当设置更新后重新获取数据
    const handleSettingsUpdated = () => {
        fetchSettings();
    };

    return (
        <PageLayout breadcrumb={[<Link key="home" to="/admin">首页</Link>, '系统设置']}>
            <div className="page-title">
                <Title level={4}>系统设置</Title>
            </div>

            <Spin spinning={loading}>
                <Card>
                    <Tabs
                        activeKey={activeTab}
                        onChange={handleTabChange}
                        tabPosition="top"
                        type="card"
                    >
                        {/* 网站配置标签页 */}
                        <TabPane
                            tab={
                                <span>
                  <GlobalOutlined/>
                  网站配置
                </span>
                            }
                            key="website"
                        >
                            <WebsiteSettings
                                settings={settings}
                                onSettingsUpdated={handleSettingsUpdated}
                            />
                        </TabPane>

                        {/* 钉钉配置标签页 */}
                        <TabPane
                            tab={
                                <span>
                  <DingdingOutlined/>
                  钉钉配置
                </span>
                            }
                            key="dingtalk"
                        >
                            <DingtalkSettings
                                settings={settings}
                                onSettingsUpdated={handleSettingsUpdated}
                            />
                        </TabPane>

                        {/* 定时任务配置标签页 */}
                        <TabPane
                            tab={
                                <span>
                  <FieldTimeOutlined/>
                  定时任务配置
                </span>
                            }
                            key="scheduler"
                        >
                            <SchedulerSettings
                                settings={settings}
                                onSettingsUpdated={handleSettingsUpdated}
                            />
                        </TabPane>
                    </Tabs>
                </Card>
            </Spin>
        </PageLayout>
    );
};

export default Settings;