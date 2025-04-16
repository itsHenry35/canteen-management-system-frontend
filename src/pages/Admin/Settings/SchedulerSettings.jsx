import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Typography, Switch, TimePicker, 
  InputNumber, Space, message, Card, Modal, 
  Alert, Tag, List, Grid,
  Spin,
  Divider
} from 'antd';
import { 
  SettingOutlined, ReloadOutlined, 
  CheckCircleOutlined, CloseCircleOutlined,
  FieldTimeOutlined, ClockCircleOutlined} from '@ant-design/icons';
import { updateSettings, getSchedulerLogs } from '../../../api/setting';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

const SchedulerSettings = ({ settings, onSettingsUpdated }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [logsVisible, setLogsVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const screens = useBreakpoint();

  // 设置表单初始值
  useEffect(() => {
    if (settings && settings.scheduler) {
      const cleanupTime = settings.scheduler.cleanup_time 
        ? dayjs(settings.scheduler.cleanup_time, 'HH:mm') 
        : dayjs('02:00', 'HH:mm');
        
      form.setFieldsValue({
        scheduler: {
          ...settings.scheduler,
          cleanup_time: cleanupTime
        }
      });
    }
  }, [form, settings]);

  // 提交定时任务配置表单
  const handleSchedulerSubmit = async (values) => {
    try {
      setSubmitting(true);
      
      // 格式化时间
      const formattedValues = {
        ...values,
        scheduler: {
          ...values.scheduler,
          cleanup_time: values.scheduler.cleanup_time.format('HH:mm')
        }
      };
      
      // 合并当前修改的定时任务配置和现有的其他配置
      const updatedSettings = {
        website: settings.website,
        dingtalk: settings.dingtalk,
        scheduler: formattedValues.scheduler
      };
      
      // 提交完整的配置
      await updateSettings(updatedSettings);
      message.success('定时任务设置更新成功');
      
      // 通知父组件设置已更新
      if (onSettingsUpdated) {
        onSettingsUpdated();
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      message.error('更新定时任务设置失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 获取定时任务日志
  const fetchSchedulerLogs = async () => {
    try {
      setLogsLoading(true);
      const response = await getSchedulerLogs();
      if (response && response.logs) {
        setLogs(response.logs);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('获取定时任务日志失败:', error);
      message.error('获取定时任务日志失败');
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  // 显示日志对话框
  const showLogsModal = () => {
    setLogsVisible(true);
    fetchSchedulerLogs();
  };

  // 任务列表数据
  const taskListData = [
    {
      key: '1',
      name: '清理过期餐食',
      description: '清理过期的餐食数据，减轻系统负担',
      schedule: '每天 ' + (settings.scheduler?.cleanup_time || '02:00'),
      status: settings.scheduler?.enabled && settings.scheduler?.cleanup_enabled ? 'active' : 'inactive'
    },
    {
      key: '2',
      name: '选餐截止提醒',
      description: '在选餐截止前发送提醒通知',
      schedule: '选餐截止前 ' + (settings.scheduler?.reminder_before_end_hours || '6') + ' 小时',
      status: settings.scheduler?.enabled && settings.scheduler?.reminder_enabled ? 'active' : 'inactive'
    },
    {
      key: '3',
      name: '自动选餐',
      description: '为未选餐的学生自动随机分配餐食',
      schedule: '选餐截止时自动执行',
      status: settings.scheduler?.enabled && settings.scheduler?.auto_select_enabled ? 'active' : 'inactive'
    }
  ];

  // 渲染任务列表项
  const renderTaskItem = (item) => (
    <List.Item>
      <Card style={{ width: '100%' }}>
        <div>
          <Space align="center" style={{ marginBottom: 8 }}>
            <Text strong>{item.name}</Text>
            {item.status === 'active' 
              ? <Tag icon={<CheckCircleOutlined />} color="success">已启用</Tag>
              : <Tag icon={<CloseCircleOutlined />} color="default">已禁用</Tag>
            }
          </Space>
        </div>
        <div style={{ color: '#666', marginBottom: 8 }}>{item.description}</div>
        <div>
          <Space>
            <ClockCircleOutlined />
            <Text>{item.schedule}</Text>
          </Space>
        </div>
      </Card>
    </List.Item>
  );

  return (
    <>
      <Form
        form={form}
        onFinish={handleSchedulerSubmit}
        layout="vertical"
        initialValues={{
          scheduler: {
            enabled: settings.scheduler?.enabled || false,
            cleanup_time: dayjs(settings.scheduler?.cleanup_time || '02:00', 'HH:mm'),
            reminder_before_end_hours: settings.scheduler?.reminder_before_end_hours || 6,
            cleanup_enabled: settings.scheduler?.cleanup_enabled !== false, // 默认为true
            reminder_enabled: settings.scheduler?.reminder_enabled !== false, // 默认为true
            auto_select_enabled: settings.scheduler?.auto_select_enabled || false // 默认为false
          }
        }}
      >
        <Card bordered={false}>
          <Paragraph>
            配置系统的定时任务，包括清理过期餐食、选餐截止提醒和自动选餐功能。
          </Paragraph>
          
          <Form.Item
            name={['scheduler', 'enabled']}
            label="全局启用定时任务"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="已启用" 
              unCheckedChildren="已禁用" 
            />
          </Form.Item>
          
          <Paragraph>
            <Text type="secondary">
              启用或禁用各项定时任务：
            </Text>
          </Paragraph>
          
          <div style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Form.Item
                name={['scheduler', 'cleanup_enabled']}
                label="启用清理过期餐食任务"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="已启用" 
                  unCheckedChildren="已禁用" 
                />
              </Form.Item>
              
              <Form.Item
                name={['scheduler', 'reminder_enabled']}
                label="启用选餐截止提醒任务"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="已启用" 
                  unCheckedChildren="已禁用" 
                />
              </Form.Item>
              
              <Form.Item
                name={['scheduler', 'auto_select_enabled']}
                label="启用自动选餐任务"
                valuePropName="checked"
                tooltip="启用后，系统将在选餐截止时为未选餐的学生随机分配A餐或B餐"
              >
                <Switch 
                  checkedChildren="已启用" 
                  unCheckedChildren="已禁用" 
                />
              </Form.Item>
            </Space>
          </div>
          
          <Divider dashed />
          
          <Form.Item
            name={['scheduler', 'cleanup_time']}
            label="清理过期餐食的时间"
            tooltip="系统将在每天该时间自动清理过期的餐食数据"
          >
            <TimePicker 
              format="HH:mm" 
              placeholder="请选择时间"
              style={{ width: 120 }}
            />
          </Form.Item>
          
          <Form.Item
            name={['scheduler', 'reminder_before_end_hours']}
            label="选餐截止前提醒时间"
            tooltip="系统将在选餐截止前多少小时发送提醒"
          >
            <InputNumber 
              min={1} 
              max={72} 
              addonAfter="小时" 
              style={{ width: 150 }}
            />
          </Form.Item>
          
          <Title level={5} style={{ marginTop: 16 }}>任务列表</Title>
          
          <List
            grid={{ 
              gutter: 16,
              xs: 1,
              sm: 1,
              md: 2,
              lg: 2,
              xl: 3,
              xxl: 3,
            }}
            dataSource={taskListData}
            renderItem={renderTaskItem}
            style={{ marginBottom: 16 }}
          />
          
          <div style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<FieldTimeOutlined />} 
              onClick={showLogsModal}
              style={{ marginBottom: 16 }}
            >
              查看任务运行日志
            </Button>
          </div>
        </Card>
        
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={submitting}
            icon={<SettingOutlined />}
            size="large"
          >
            保存定时任务设置
          </Button>
        </div>
      </Form>

      {/* 日志查看对话框 */}
      <Modal
        title="定时任务运行日志"
        visible={logsVisible}
        onCancel={() => setLogsVisible(false)}
        width={screens.xs ? '95%' : 700}
        footer={[
          <Button 
            key="refresh" 
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchSchedulerLogs}
            loading={logsLoading}
          >
            刷新
          </Button>,
          <Button 
            key="close" 
            onClick={() => setLogsVisible(false)}
          >
            关闭
          </Button>
        ]}
      >
        <div style={{ minHeight: 300 }}>
          {logsLoading ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Spin tip="加载日志中..." />
            </div>
          ) : logs.length > 0 ? (
            <Input.TextArea
              value={logs.join('\n')}
              readOnly
              autoSize={{ minRows: 15, maxRows: 20 }}
              style={{ fontFamily: 'monospace' }}
            />
          ) : (
            <Alert
              message="暂无日志数据"
              description="系统未找到定时任务的运行日志记录。"
              type="info"
              showIcon
            />
          )}
        </div>
      </Modal>
    </>
  );
};

export default SchedulerSettings;