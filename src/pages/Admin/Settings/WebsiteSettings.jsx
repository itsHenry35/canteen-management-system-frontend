import {useEffect, useState} from 'react';
import {Button, Card, Divider, Form, Input, message, Typography} from 'antd';
import {SettingOutlined} from '@ant-design/icons';
import {updateSettings} from '../../../api/setting';

const {Title, Paragraph} = Typography;

const WebsiteSettings = ({settings, onSettingsUpdated}) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    // 设置表单初始值
    useEffect(() => {
        if (settings && settings.website) {
            form.setFieldsValue({
                website: settings.website
            });
        }
    }, [form, settings]);

    // 提交网站配置表单
    const handleWebsiteSubmit = async (values) => {
        try {
            setSubmitting(true);

            // 合并当前修改的网站配置和现有的其他配置
            const updatedSettings = {
                website: values.website,
                dingtalk: settings.dingtalk,
                scheduler: settings.scheduler
            };

            // 提交完整的配置
            await updateSettings(updatedSettings);
            message.success('网站设置更新成功');

            // 通知父组件设置已更新
            if (onSettingsUpdated) {
                onSettingsUpdated();
            }
        } catch (error) {
            console.error('Failed to update settings:', error);
            message.error('更新网站设置失败');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Form
            form={form}
            onFinish={handleWebsiteSubmit}
            layout="vertical"
            initialValues={{website: settings.website}}
        >
            <Card bordered={false}>
                <Paragraph>
                    配置网站基本信息，包括名称和备案信息。
                </Paragraph>

                <Form.Item
                    name={['website', 'name']}
                    label="网站名称"
                    rules={[{required: true, message: '请输入网站名称'}]}
                >
                    <Input placeholder="请输入网站名称，例如：饭卡管理系统"/>
                </Form.Item>

                <Form.Item
                    name={['website', 'domain']}
                    label="网站域名"
                >
                    <Input placeholder="请输入网站域名，例如：https://xuancan.example.com"/>
                </Form.Item>

                <Divider/>

                <Title level={5}>备案信息</Title>
                <Form.Item
                    name={['website', 'icp_beian']}
                    label="ICP备案信息"
                >
                    <Input placeholder="请输入ICP备案信息，例如：沪ICP备12345678号-1"/>
                </Form.Item>

                <Form.Item
                    name={['website', 'public_sec_beian']}
                    label="公安部备案信息"
                >
                    <Input placeholder="请输入公安部备案信息，例如：沪网安备31011302000001号"/>
                </Form.Item>
            </Card>

            <div style={{marginTop: 16, textAlign: 'center'}}>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    icon={<SettingOutlined/>}
                    size="large"
                >
                    保存网站设置
                </Button>
            </div>
        </Form>
    );
};

export default WebsiteSettings;