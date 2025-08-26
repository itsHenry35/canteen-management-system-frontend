import {useEffect, useState} from 'react';
import {Alert, Button, Card, Divider, Form, Input, message, Typography} from 'antd';
import {DingdingOutlined, LockOutlined, UserOutlined} from '@ant-design/icons';
import {useNavigate} from 'react-router-dom';
import {login} from '../../api/auth';
import {getUserRole, isLoggedIn} from '../../utils/auth';
import {useWebsite} from '../../contexts/WebsiteContext';
import Footer from '../../components/Footer';
import styles from './index.module.css';

const {Title, Text} = Typography;

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();
    const {name, dingtalk_corp_id} = useWebsite();

    // 如果已登录，重定向到对应页面
    useEffect(() => {
        if (isLoggedIn()) {
            const role = getUserRole();
            if (role === 'admin') {
                navigate('/admin');
            } else if (role === 'student') {
                navigate('/student');
            }
        }
    }, [navigate]);

    // 处理登录
    const handleSubmit = async (values) => {
        // 清除之前的错误消息
        setErrorMsg('');

        try {
            setLoading(true);
            const data = await login(values.username, values.password);

            message.success('登录成功');

            // 根据用户角色重定向
            if (data.user.role === 'admin') {
                navigate('/admin');
            } else if (data.user.role === 'student') {
                navigate('/student');
            } else {
                message.warning('该账户类型不支持在该应用登录');
            }
        } catch (error) {
            // 检查是否是我们自定义的错误结构
            if (error.data && error.data.message) {
                setErrorMsg(error.data.message);
            } else if (error.response?.data?.message) {
                setErrorMsg(error.response.data.message);
            } else {
                console.error('Login failed:', error);
                setErrorMsg('登录失败，请检查用户名和密码');
            }
        } finally {
            setLoading(false);
        }
    };

    // 跳转到钉钉登录
    const handleDingTalkLogin = () => {
        navigate('/dingtalk_auth');
    };

    return (
        <div className={styles.container}>
            <Card className={styles.loginCard}>
                <div className={styles.logo}>
                    <Title level={2}>{name}</Title>
                </div>
                <Divider/>

                {errorMsg && (
                    <Alert
                        message="登录失败"
                        description={errorMsg}
                        type="error"
                        showIcon
                        closable
                        style={{marginBottom: 16}}
                        onClose={() => setErrorMsg('')}
                    />
                )}

                <Form
                    name="login"
                    onFinish={handleSubmit}
                    initialValues={{remember: true}}
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{required: true, message: '请输入用户名'}]}
                    >
                        <Input
                            prefix={<UserOutlined/>}
                            placeholder="用户名"
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{required: true, message: '请输入密码'}]}
                    >
                        <Input.Password
                            prefix={<LockOutlined/>}
                            placeholder="密码"
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className={styles.loginButton}
                            loading={loading}
                        >
                            登录
                        </Button>
                    </Form.Item>
                </Form>

                {dingtalk_corp_id && (
                    <>
                        <Divider>
                            <Text type="secondary">其他登录方式</Text>
                        </Divider>

                        <div className={styles.otherLogin}>
                            <Button
                                icon={<DingdingOutlined/>}
                                size="large"
                                type="default"
                                onClick={handleDingTalkLogin}
                                block
                                className={styles.dingTalkButton}
                            >
                                钉钉登录
                            </Button>
                        </div>
                    </>
                )}
            </Card>
            <div style={{position: 'fixed', bottom: 0, width: '100%'}}>
                <Footer/>
            </div>
        </div>
    );
};

export default Login;