import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Avatar, Button, Card, List, Result, Spin} from 'antd';
import {LoadingOutlined, UserOutlined} from '@ant-design/icons';
import {dingTalkLogin} from '../../api/auth';
import {getUserRole, isLoggedIn, setToken, setUser} from '../../utils/auth';
import {useWebsite} from '../../contexts/WebsiteContext';
import Footer from '../../components/Footer';
import styles from './index.module.css';
import * as dd from 'dingtalk-jsapi';

const DingtalkAuth = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [students, setStudents] = useState([]);
    const [showStudentSelect, setShowStudentSelect] = useState(false);
    const {dingtalk_corp_id} = useWebsite();

    useEffect(() => {
        // 如果已登录，重定向到对应页面
        if (isLoggedIn()) {
            redirectToUserHomepage();
            return;
        }

        // 检查是否配置了钉钉企业ID
        if (!dingtalk_corp_id) {
            setError('未配置钉钉登录');
            setLoading(false);
            return;
        }

        // 获取钉钉免登授权码
        const getAuthCode = async () => {
            try {
                // 确保钉钉SDK已加载
                if (dd) {
                    if (dd.env.platform === 'notInDingTalk') {
                        // 如果不在钉钉环境中，显示错误信息
                        setError('请在钉钉客户端中打开');
                        setLoading(false);
                        return;
                    }

                    // 钉钉免登
                    dd.ready(() => {
                        dd.runtime.permission.requestAuthCode({
                            corpId: dingtalk_corp_id,
                            onSuccess: async (result) => {
                                try {
                                    // 获取到免登授权码后，调用登录接口
                                    await handleLogin(result.code);
                                } catch (err) {
                                    // 检查是否有具体的错误消息
                                    if (err.data && err.data.message) {
                                        setError(err.data.message);
                                    } else if (err.response?.data?.message) {
                                        setError(err.response.data.message);
                                    } else {
                                        setError('登录失败，请重试');
                                    }
                                    setLoading(false);
                                }
                            },
                            onFail: (err) => {
                                console.error('Failed to get auth code:', err);
                                setError('获取授权码失败，请重试');
                                setLoading(false);
                            }
                        });
                    });

                    dd.error((err) => {
                        console.error('DingTalk SDK error:', err);
                        setError('钉钉初始化失败，请重试');
                        setLoading(false);
                    });
                } else {
                    // 如果不在钉钉环境中，显示错误信息
                    setError('请在钉钉客户端中打开');
                    setLoading(false);
                }
            } catch (err) {
                console.error('Auth failed:', err);
                setError('认证失败，请重试');
                setLoading(false);
            }
        };

        getAuthCode();
    }, [navigate, dingtalk_corp_id]);

    // 处理登录请求
    const handleLogin = async (code) => {
        try {
            setLoading(true);
            const data = await dingTalkLogin(code);

            // 检查返回的数据结构，判断是否为多学生情况
            if (data.students && data.students.length > 0) {
                // 多个学生的情况，显示选择界面
                setStudents(data.students);
                setShowStudentSelect(true);
                setLoading(false);
            } else if (data.token) {
                // 单个用户的情况，直接保存 token 和用户信息
                setToken(data.token);
                setUser(data.user);
                // 登录成功，重定向到对应页面
                redirectToUserHomepage();
            } else {
                // 异常情况
                throw new Error('登录返回数据格式错误');
            }
        } catch (err) {
            console.error('Login failed:', err);
            // 检查是否有具体的错误消息
            if (err.data && err.data.message) {
                setError(err.data.message);
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('登录失败，请重试');
            }
            setLoading(false);
            throw err; // 继续抛出异常
        }
    };

    // 处理学生选择
    const handleStudentSelect = (student) => {
        // 保存选中学生的 token 和用户信息
        setToken(student.token);

        // 构造用户信息对象并保存
        const userInfo = {
            id: student.id,
            username: student.username,
            full_name: student.full_name,
            role: 'student' // 这里硬编码为学生角色，因为API返回的学生数据中可能没有明确的role字段
        };
        setUser(userInfo);

        // 重定向到学生主页
        navigate('/student');
    };

    // 根据用户角色重定向到对应页面
    const redirectToUserHomepage = () => {
        const role = getUserRole();
        if (role === 'admin') {
            navigate('/admin');
        } else if (role === 'student') {
            navigate('/student');
        } else {
            navigate('/login');
        }
    };

    // 返回登录页
    const handleBackToLogin = () => {
        navigate('/login');
    };

    return (
        <div className={styles.container}>
            {loading ? (
                <div className={styles.loadingContainer}>
                    <Spin indicator={<LoadingOutlined style={{fontSize: 24}} spin/>}/>
                    <p className={styles.loadingText}>钉钉授权登录中...</p>
                </div>
            ) : showStudentSelect ? (
                <Card
                    title="请选择学生账号"
                    className={styles.studentSelectCard}
                    style={{width: 400, margin: '0 auto'}}
                >
                    <List
                        itemLayout="horizontal"
                        dataSource={students}
                        renderItem={student => (
                            <List.Item
                                actions={[
                                    <Button type="primary" onClick={() => handleStudentSelect(student)}>
                                        选择
                                    </Button>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<Avatar icon={<UserOutlined/>}/>}
                                    title={student.full_name}
                                    description={student.class}
                                />
                            </List.Item>
                        )}
                    />
                </Card>
            ) : error ? (
                <Result
                    status="error"
                    title="登录失败"
                    subTitle={error}
                    extra={[
                        <Button type="primary" key="login" onClick={handleBackToLogin}>
                            返回登录页
                        </Button>
                    ]}
                />
            ) : null}
            <div style={{position: 'fixed', bottom: 0, width: '100%'}}>
                <Footer/>
            </div>
        </div>
    );
};

export default DingtalkAuth;