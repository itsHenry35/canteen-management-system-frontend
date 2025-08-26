import {useEffect, useState} from 'react';
import {Button, Card, Form, Input, message, Modal, Popconfirm, Select, Space, Table, Tag, Typography} from 'antd';
import {DeleteOutlined, EditOutlined, PlusOutlined, ShopOutlined, UserOutlined} from '@ant-design/icons';
import PageLayout from '../../../components/PageLayout';
import {createUser, deleteUser, getAllUsers, updateUser} from '../../../api/user';
import {Link} from 'react-router-dom';

const {Title} = Typography;
const {Option} = Select;

const UserManage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [form] = Form.useForm();
    const [userType, setUserType] = useState('');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
        showSizeChanger: false,
        showTotal: (total) => `共 ${total} 条数据`
    });

    // 获取用户列表
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers(userType);
            setUsers(data || []);
        } catch (error) {
            message.error('获取用户列表失败：' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // 组件挂载时获取数据
    useEffect(() => {
        fetchUsers();
    }, [userType]);

    // 显示添加用户对话框
    const showAddModal = () => {
        setCurrentUser(null);
        form.resetFields();
        setVisible(true);
    };

    // 显示编辑用户对话框
    const showEditModal = (record) => {
        setCurrentUser(record);
        form.setFieldsValue({
            username: record.username,
            full_name: record.full_name,
            role: record.role,
            password: '',
        });
        setVisible(true);
    };

    // 处理对话框确认
    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setConfirmLoading(true);

            if (currentUser) {
                // 更新用户
                await updateUser(currentUser.id, values);
                message.success('用户更新成功');
            } else {
                // 创建用户
                await createUser(values);
                message.success('用户创建成功');
            }

            setVisible(false);
            await fetchUsers();
        } catch (error) {
            error.message('内容不合法：' + error.message);
        } finally {
            setConfirmLoading(false);
        }
    };

    // 处理对话框取消
    const handleCancel = () => {
        setVisible(false);
    };

    // 处理删除用户
    const handleDelete = async (id) => {
        try {
            await deleteUser(id);
            message.success('用户删除成功');
            await fetchUsers();
        } catch (error) {
            message.error('删除用户失败：' + error.message);
        }
    };

    // 用户类型筛选变化
    const handleUserTypeChange = (value) => {
        setUserType(value);
    };

    // 处理分页变化
    const handleTableChange = (pagination) => {
        setPagination(prevPagination => ({
            ...prevPagination,
            current: pagination.current
        }));
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: '用户名',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: '姓名',
            dataIndex: 'full_name',
            key: 'full_name',
        },
        {
            title: '用户类型',
            dataIndex: 'role',
            key: 'role',
            render: (text) => {
                let color = 'blue';
                let icon = <UserOutlined/>;
                let label = '未知';

                if (text === 'admin') {
                    color = 'gold';
                    icon = <UserOutlined/>;
                    label = '管理员';
                } else if (text === 'canteen_a') {
                    color = 'green';
                    icon = <ShopOutlined/>;
                    label = '食堂A餐工作人员';
                } else if (text === 'canteen_b') {
                    color = 'purple';
                    icon = <ShopOutlined/>;
                    label = '食堂B餐工作人员';
                } else if (text === 'canteen_test') {
                    color = 'red';
                    icon = <ShopOutlined/>;
                    label = '食堂测试人员';
                }

                return (
                    <Tag color={color} icon={icon}>
                        {label}
                    </Tag>
                );
            },
        },
        {
            title: '钉钉ID',
            dataIndex: 'dingtalk_id',
            key: 'dingtalk_id',
        },
        {
            title: '操作',
            key: 'action',
            width: 160,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        icon={<EditOutlined/>}
                        size="small"
                        onClick={() => showEditModal(record)}
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title="确定要删除该用户吗？"
                        onConfirm={() => handleDelete(record.id)}
                        okText="是"
                        cancelText="否"
                    >
                        <Button icon={<DeleteOutlined/>} size="small" danger>
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <PageLayout breadcrumb={[<Link key="home" to="/admin">首页</Link>, '用户管理']}>
            <div className="page-title">
                <Title level={4}>用户管理</Title>
            </div>

            <Card>
                <div style={{overflowX: 'auto'}}>
                    <div style={{minWidth: '1000px'}}>
                        <div className="operation-area" style={{marginBottom: 16}}>
                            <Space>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined/>}
                                    onClick={showAddModal}
                                >
                                    添加用户
                                </Button>
                                <Select
                                    placeholder="选择用户类型"
                                    style={{width: 150}}
                                    allowClear
                                    onChange={handleUserTypeChange}
                                >
                                    <Option value="admin">管理员</Option>
                                    <Option value="canteen_a">食堂A餐工作人员</Option>
                                    <Option value="canteen_b">食堂B餐工作人员</Option>
                                    <Option value="canteen_test">食堂测试人员</Option>
                                </Select>
                            </Space>
                        </div>
                    </div>
                </div>

                <div style={{overflowX: 'auto'}}>
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={users}
                        loading={loading}
                        pagination={pagination}
                        onChange={handleTableChange}
                        scroll={{x: 1000}}
                    />
                </div>
            </Card>

            <Modal
                title={currentUser ? '编辑用户' : '添加用户'}
                visible={visible}
                onOk={handleOk}
                confirmLoading={confirmLoading}
                onCancel={handleCancel}
            >
                <Form
                    form={form}
                    layout="vertical"
                >
                    <Form.Item
                        name="username"
                        label="用户名"
                        rules={[
                            {required: true, message: '请输入用户名'},
                            {min: 3, message: '用户名至少3个字符'}
                        ]}
                    >
                        <Input
                            placeholder="请输入用户名"
                            disabled={currentUser !== null}
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="密码"
                        rules={[
                            {required: currentUser === null, message: '请输入密码'},
                            {min: 6, message: '密码至少6个字符'}
                        ]}
                    >
                        <Input.Password placeholder={currentUser ? '不修改请留空' : '请输入密码'}/>
                    </Form.Item>
                    <Form.Item
                        name="full_name"
                        label="姓名"
                        rules={[{required: true, message: '请输入姓名'}]}
                    >
                        <Input placeholder="请输入姓名"/>
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="用户类型"
                        rules={[{required: true, message: '请选择用户类型'}]}
                    >
                        <Select placeholder="请选择用户类型" disabled={currentUser !== null}>
                            <Option value="admin">管理员</Option>
                            <Option value="canteen_a">食堂A餐工作人员</Option>
                            <Option value="canteen_b">食堂B餐工作人员</Option>
                            <Option value="canteen_test">食堂测试人员</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="dingtalk_id"
                        label="钉钉ID"
                        rules={[{required: false}]}
                    >
                        <Input placeholder="可选，用于钉钉免登录"/>
                    </Form.Item>
                </Form>
            </Modal>
        </PageLayout>
    );
};

export default UserManage;