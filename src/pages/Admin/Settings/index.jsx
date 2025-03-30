import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Input, Button, message, Typography, 
  Spin, Divider, Modal, Progress,
  Space
} from 'antd';
import {
  SettingOutlined,
  SyncOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import PageLayout from '../../../components/PageLayout';
import { getSettings, updateSettings, rebuildParentStudentMapping } from '../../../api/setting';
import { Link } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;
const { confirm } = Modal;

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState(null);
  const [form] = Form.useForm();
  
  // 重建映射相关状态
  const [rebuildModalVisible, setRebuildModalVisible] = useState(false);
  const [rebuildCountdown, setRebuildCountdown] = useState(5);
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [countdownInterval, setCountdownInterval] = useState(null);

  // 获取系统设置
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);
      
      // 设置表单初始值
      form.setFieldsValue({
        dingtalk: {
          app_key: data.dingtalk?.app_key || '',
          app_secret: data.dingtalk?.app_secret || '',
          agent_id: data.dingtalk?.agent_id || '',
          corp_id: data.dingtalk?.corp_id || ''
        }
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      message.error('获取系统设置失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchSettings();
  }, []);

  // 提交表单
  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      await updateSettings(values);
      message.success('系统设置更新成功');
      fetchSettings();
    } catch (error) {
      console.error('Failed to update settings:', error);
      message.error('更新系统设置失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 显示重建映射对话框
  const showRebuildModal = () => {
    confirm({
      title: '警告',
      icon: <ExclamationCircleOutlined />,
      content: '您即将重建家长-学生映射关系。此操作非常危险，可能导致系统不稳定。确定要继续吗？',
      onOk() {
        setRebuildModalVisible(true);
        startCountdown();
      },
      onCancel() {
      },
    });
  };

  // 开始倒计时
  const startCountdown = () => {
    setRebuildCountdown(5);
    const interval = setInterval(() => {
      setRebuildCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setCountdownInterval(interval);
  };

  // 取消重建映射
  const handleRebuildCancel = () => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    setRebuildModalVisible(false);
  };

  // 执行重建映射
  const handleRebuildMapping = async () => {
    try {
      setRebuildLoading(true);
      await rebuildParentStudentMapping();
      message.success('已成功启动重建映射过程，这可能需要一些时间');
      setRebuildModalVisible(false);
    } catch (error) {
      console.error('Failed to rebuild mapping:', error);
      message.error('重建映射失败');
    } finally {
      setRebuildLoading(false);
    }
  };

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [countdownInterval]);

  return (
    <PageLayout breadcrumb={[<Link key="home" to="/admin">首页</Link>, '系统设置']}>
      <div className="page-title">
        <Title level={4}>系统设置</Title>
      </div>
      
      <Spin spinning={loading}>
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          initialValues={settings}
        >
          <Card>
            <Paragraph>
              配置钉钉应用信息，用于学生通过钉钉登录和接收提醒。
            </Paragraph>
            
            <Form.Item
              name={['dingtalk', 'app_key']}
              label="应用AppKey"
            >
              <Input placeholder="请输入钉钉应用的AppKey" />
            </Form.Item>
            
            <Form.Item
              name={['dingtalk', 'app_secret']}
              label="应用AppSecret"
            >
              <Input.Password placeholder="请输入钉钉应用的AppSecret" />
            </Form.Item>
            
            <Form.Item
              name={['dingtalk', 'agent_id']}
              label="应用AgentID"
            >
              <Input placeholder="请输入钉钉应用的AgentID" />
            </Form.Item>
            
            <Form.Item
              name={['dingtalk', 'corp_id']}
              label="企业CorpID"
            >
              <Input placeholder="请输入钉钉企业的CorpID" />
            </Form.Item>
            
            <Divider />
            
            <Title level={5} style={{ color: '#cf1322' }}>高级操作</Title>
            <Card 
              type="inner" 
              style={{ borderColor: '#ffccc7', backgroundColor: '#fff2f0', marginBottom: 16 }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space align="start">
                  <ExclamationCircleOutlined style={{ color: '#cf1322', fontSize: 16 }} />
                  <div>
                    <Text strong style={{ color: '#cf1322' }}>重建家长-学生映射关系</Text>
                    <Paragraph style={{ marginTop: 8 }}>
                      此操作会从钉钉获取所有班级信息和家长-学生关系，并将其存储在系统数据库中。
                      <Text strong style={{ color: '#cf1322', display: 'block', marginTop: 4 }}>
                        警告：此操作极其危险，可能导致系统不稳定，仅在必要时执行！
                      </Text>
                    </Paragraph>
                  </div>
                </Space>
                <div style={{ textAlign: 'right' }}>
                  <Button 
                    danger 
                    type="primary" 
                    icon={<SyncOutlined />} 
                    onClick={showRebuildModal}
                  >
                    重建映射关系
                  </Button>
                </div>
              </Space>
            </Card>
          </Card>
          
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting}
              icon={<SettingOutlined />}
              size="large"
            >
              保存设置
            </Button>
          </div>
        </Form>
        
        {/* 重建映射对话框 */}
        <Modal
          title={
            <div style={{ color: '#cf1322' }}>
              <ExclamationCircleOutlined /> 危险操作确认
            </div>
          }
          visible={rebuildModalVisible}
          onCancel={handleRebuildCancel}
          footer={[
            <Button key="back" onClick={handleRebuildCancel}>
              取消
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              danger
              loading={rebuildLoading}
              disabled={rebuildCountdown > 0}
              onClick={handleRebuildMapping}
            >
              {rebuildCountdown > 0 ? `请等待 (${rebuildCountdown}s)` : '确认重建'}
            </Button>,
          ]}
        >
          <div style={{ marginBottom: 16 }}>
            <Typography.Title level={5} style={{ color: '#cf1322' }}>
              您正在执行一个极其危险的操作！
            </Typography.Title>
            <Paragraph>
              重建家长-学生映射关系将会：
            </Paragraph>
            <ul>
              <li>从钉钉获取所有班级信息</li>
              <li>获取所有家长与学生的关系</li>
              <li>重建系统数据库中的映射关系</li>
            </ul>
            <Paragraph strong style={{ color: '#cf1322' }}>
              此操作可能导致：
            </Paragraph>
            <ul>
              <li>系统暂时无响应</li>
              <li>钉钉接口调用频率限制</li>
              <li>数据临时不一致</li>
            </ul>
            <Paragraph>
              请确保您了解此操作的风险，并且确实需要执行此操作。
            </Paragraph>
            
            {rebuildCountdown > 0 && (
              <div style={{ marginTop: 16 }}>
                <Progress 
                  percent={(5 - rebuildCountdown) * 20} 
                  status="active" 
                  showInfo={false}
                  strokeColor="#cf1322"
                />
                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  冷静期：请等待 {rebuildCountdown} 秒再确认操作
                </div>
              </div>
            )}
          </div>
        </Modal>
      </Spin>
    </PageLayout>
  );
};

export default Settings;