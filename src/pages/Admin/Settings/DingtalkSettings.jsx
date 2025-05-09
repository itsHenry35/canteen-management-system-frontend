import React, { useState } from 'react';
import { 
  Form, Input, Button, Typography, Space, Divider, 
  message, Card, Modal, Progress, 
  Spin,
  Alert
} from 'antd';
import {
  SettingOutlined, SyncOutlined, ExclamationCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { updateSettings, rebuildParentStudentMapping, getRebuildMappingLogs } from '../../../api/setting';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

const DingtalkSettings = ({ settings, onSettingsUpdated }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  
  // 重建映射相关状态
  const [rebuildModalVisible, setRebuildModalVisible] = useState(false);
  const [rebuildCountdown, setRebuildCountdown] = useState(5);
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [countdownInterval, setCountdownInterval] = useState(null);

  // 日志相关状态
  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // 设置表单初始值
  React.useEffect(() => {
    if (settings && settings.dingtalk) {
      form.setFieldsValue({
        dingtalk: settings.dingtalk
      });
    }
  }, [form, settings]);

  // 清除定时器
  React.useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [countdownInterval]);

  // 提交钉钉配置表单
  const handleDingtalkSubmit = async (values) => {
    try {
      setSubmitting(true);
      
      // 合并当前修改的钉钉配置和现有的其他配置
      const updatedSettings = {
        website: settings.website,
        dingtalk: values.dingtalk,
        scheduler: settings.scheduler
      };
      
      // 提交完整的配置
      await updateSettings(updatedSettings);
      message.success('钉钉设置更新成功');
      
      // 通知父组件设置已更新
      if (onSettingsUpdated) {
        onSettingsUpdated();
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      message.error('更新钉钉设置失败');
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

  // 显示日志对话框
  const showLogsModal = () => {
    setLogsModalVisible(true);
    fetchRebuildLogs();
  };

  // 获取重建日志
  const fetchRebuildLogs = async () => {
    try {
      setLogsLoading(true);
      const response = await getRebuildMappingLogs();
      if (response && response.logs) {
        setLogs(response.logs);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('获取重建日志失败:', error);
      message.error('获取重建日志失败');
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
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

  // 刷新日志
  const handleRefreshLogs = () => {
    fetchRebuildLogs();
  };

  return (
    <>
      <Form
        form={form}
        onFinish={handleDingtalkSubmit}
        layout="vertical"
        initialValues={{ dingtalk: settings.dingtalk }}
      >
        <Card bordered={false}>
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
                <Space wrap>
                    <Button 
                    type="primary"
                    icon={<FileTextOutlined />} 
                    onClick={showLogsModal}
                    >
                    查看日志与状态
                    </Button>
                    <Button 
                    danger 
                    type="primary" 
                    icon={<SyncOutlined />} 
                    onClick={showRebuildModal}
                    >
                    重建映射关系
                    </Button>
                </Space>
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
            保存钉钉设置
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
            此操作会导致：
          </Paragraph>
          <ul>
            <li>学生暂时无法使用钉钉登录</li>
            <li>达到钉钉接口月调用限制（频繁调用）</li>
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

      {/* 日志查看对话框 */}
      <Modal
        title="重建家长-学生映射关系日志"
        visible={logsModalVisible}
        onCancel={() => setLogsModalVisible(false)}
        width={700}
        footer={[
          <Button 
            key="refresh" 
            type="primary"
            onClick={handleRefreshLogs}
            loading={logsLoading}
          >
            刷新
          </Button>,
          <Button 
            key="close" 
            onClick={() => setLogsModalVisible(false)}
          >
            关闭
          </Button>
        ]}
      >
        <Spin spinning={logsLoading}>
          {logs.length > 0 ? (
            <Input.TextArea
              value={logs.join('\n')}
              readOnly
              autoSize={{ minRows: 15, maxRows: 20 }}
              style={{ fontFamily: 'monospace' }}
            />
          ) : (
            <Alert
              message="暂无日志数据"
              description="系统未找到重建家长-学生映射关系的日志记录。"
              type="info"
              showIcon
            />
          )}
        </Spin>
      </Modal>
    </>
  );
};

export default DingtalkSettings;