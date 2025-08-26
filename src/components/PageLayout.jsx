import {useEffect, useState} from 'react';
import {Avatar, Breadcrumb, Button, Dropdown, Layout, Menu} from 'antd';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import {
    BookOutlined,
    HomeOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    NotificationOutlined,
    SettingOutlined,
    TeamOutlined,
    UserOutlined
} from '@ant-design/icons';
import {getUser, removeToken} from '../utils/auth';
import Footer from './Footer';
import {useWebsite} from '../contexts/WebsiteContext';

const {Header, Content, Sider} = Layout;

const PageLayout = ({children, breadcrumb = []}) => {
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [siderVisible, setSiderVisible] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const user = getUser();
    const {name} = useWebsite();

    // 监听窗口大小变化
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) {
                setSiderVisible(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // 页面路径到菜单选择的映射
    const getSelectedKeys = () => {
        const path = location.pathname;

        // 菜单键与路径匹配
        const menuKeyMap = {
            '/admin': ['dashboard'],
            '/admin/users': ['users'],
            '/admin/students': ['students'],
            '/admin/menus': ['menus'],
            '/admin/settings': ['settings'],
            '/student': ['dashboard'],
            '/student/meal': ['meal'],
        };

        return menuKeyMap[path] || [];
    };

    // 处理登出
    const handleLogout = () => {
        removeToken();
        navigate('/login');
    };

    // 渲染侧边菜单（根据用户角色）
    const renderSideMenu = () => {
        // 管理员菜单
        if (user && user.role === 'admin') {
            return (
                <Menu
                    mode="inline"
                    selectedKeys={getSelectedKeys()}
                    style={{height: '100%', borderRight: 0}}
                >
                    <Menu.Item key="dashboard" icon={<HomeOutlined/>}>
                        <Link to="/admin">首页</Link>
                    </Menu.Item>
                    <Menu.Item key="users" icon={<UserOutlined/>}>
                        <Link to="/admin/users">用户管理</Link>
                    </Menu.Item>
                    <Menu.Item key="students" icon={<TeamOutlined/>}>
                        <Link to="/admin/students">学生管理</Link>
                    </Menu.Item>
                    <Menu.Item key="menus" icon={<BookOutlined/>}>
                        <Link to="/admin/menus">菜单管理</Link>
                    </Menu.Item>
                    <Menu.Item key="settings" icon={<SettingOutlined/>}>
                        <Link to="/admin/settings">系统设置</Link>
                    </Menu.Item>
                </Menu>
            );
        }

        // 学生菜单
        if (user && user.role === 'student') {
            return (
                <Menu
                    mode="inline"
                    selectedKeys={getSelectedKeys()}
                    style={{height: '100%', borderRight: 0}}
                >
                    <Menu.Item key="dashboard" icon={<HomeOutlined/>}>
                        <Link to="/student">首页</Link>
                    </Menu.Item>
                    <Menu.Item key="meal" icon={<NotificationOutlined/>}>
                        <Link to="/student/meal">选餐</Link>
                    </Menu.Item>
                </Menu>
            );
        }

        return null;
    };

    // 用户下拉菜单
    const userMenu = (
        <Menu>
            <Menu.Item key="logout" icon={<LogoutOutlined/>} onClick={handleLogout}>
                退出登录
            </Menu.Item>
        </Menu>
    );

    // 切换侧边栏显示
    const toggleSider = () => {
        setSiderVisible(!siderVisible);
    };

    return (
        <Layout style={{minHeight: '100vh'}}>
            <Header className="header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: isMobile ? '0 10px' : '0 50px'
            }}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    {isMobile && (
                        <Button
                            type="text"
                            icon={siderVisible ? <MenuUnfoldOutlined/> : <MenuFoldOutlined/>}
                            onClick={toggleSider}
                            style={{color: 'white', fontSize: '16px', marginRight: '8px'}}
                        />
                    )}
                    <div className="logo" style={{color: 'white', fontSize: '18px', fontWeight: 'bold'}}>
                        {name}
                    </div>
                </div>
                <Dropdown overlay={userMenu}>
                    <div style={{color: 'white', cursor: 'pointer'}}>
                        <Avatar icon={<UserOutlined/>} style={{marginRight: isMobile ? 4 : 8}}/>
                        {!isMobile && (user?.full_name || '用户')}
                    </div>
                </Dropdown>
            </Header>
            <Layout>
                {isMobile ? (
                    <Sider
                        width={200}
                        style={{
                            position: 'fixed',
                            left: 0,
                            top: 64, // Header高度
                            height: 'calc(100vh - 64px)',
                            zIndex: 999,
                            display: siderVisible ? 'block' : 'none',
                            boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
                        }}
                    >
                        {renderSideMenu()}
                    </Sider>
                ) : (
                    <Sider
                        width={200}
                        collapsible
                        collapsed={collapsed}
                        onCollapse={setCollapsed}
                        trigger={collapsed ? <MenuUnfoldOutlined/> : <MenuFoldOutlined/>}
                    >
                        {renderSideMenu()}
                    </Sider>
                )}
                <Layout style={{
                    padding: isMobile ? '0 10px 10px' : '0 24px 24px',
                    marginLeft: isMobile ? 0 : undefined,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <Breadcrumb style={{margin: '16px 0'}}>
                        {breadcrumb.map((item, index) => (
                            <Breadcrumb.Item key={index}>{item}</Breadcrumb.Item>
                        ))}
                    </Breadcrumb>
                    <Content
                        className="site-layout-background"
                        style={{
                            padding: isMobile ? 12 : 24,
                            margin: 0,
                            minHeight: 280,
                            background: '#fff',
                            borderRadius: 4,
                            flex: '1 0 auto'
                        }}
                    >
                        {children}
                    </Content>
                    <Footer/>
                </Layout>
            </Layout>
        </Layout>
    );
};

export default PageLayout;