import {useEffect, useState} from 'react';
import {
    Button,
    Card,
    DatePicker,
    Empty,
    Form,
    Image,
    Input,
    message,
    Modal,
    Popconfirm,
    Space,
    Spin,
    Table,
    Tooltip,
    Typography,
    Upload
} from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    NotificationOutlined,
    PlusOutlined,
    UploadOutlined
} from '@ant-design/icons';
import PageLayout from '../../../components/PageLayout';
import {createMeal, deleteMeal, getAllMeals, notifyUnselectedStudents, updateMeal} from '../../../api/meal';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';
import {Link} from 'react-router-dom';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

const {Title, Text} = Typography;
const {RangePicker} = DatePicker;

const MenuManage = () => {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [meals, setMeals] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentMeal, setCurrentMeal] = useState(null);
    const [mealImage, setMealImage] = useState(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [form] = Form.useForm();
    const [notifyModalVisible, setNotifyModalVisible] = useState(false);
    const [notifyingMeal, setNotifyingMeal] = useState(null);
    const [notifying, setNotifying] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 100,
        showSizeChanger: false,
        showTotal: (total) => `共 ${total} 条数据`
    });

    const fetchMeals = async () => {
        try {
            setLoading(true);
            const data = await getAllMeals();
            setMeals(data || []);
        } catch (error) {
            console.error('获取餐食失败:', error);
            message.error('获取餐食失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeals();
    }, []);

    const getBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleImageChange = async ({file}) => {
        const rawFile = file.originFileObj || file;

        if (!(rawFile instanceof Blob)) {
            message.error('请选择有效的图片文件');
            return;
        }

        try {
            const base64 = await getBase64(rawFile);
            setMealImage(base64);
            message.success('图片已准备好上传');
        } catch (error) {
            console.error('图片处理失败:', error);
            message.error('图片处理失败');
        }
    };

    const showAddModal = () => {
        setCurrentMeal(null);
        setMealImage(null);
        form.resetFields();
        setModalVisible(true);
        setTimeout(() => {
            form.setFieldsValue({
                selection_time: [dayjs(), dayjs().add(1, 'day')],
                effective_time: [dayjs().add(2, 'day'), dayjs().add(2, 'day').endOf('day')]
            });
        }, 0);
    };

    const showEditModal = (record) => {
        setCurrentMeal(record);
        setMealImage(null);
        form.setFieldsValue({
            name: record.name,
            selection_time: [dayjs(record.selection_start_time), dayjs(record.selection_end_time)],
            effective_time: [dayjs(record.effective_start_date), dayjs(record.effective_end_date)]
        });
        setModalVisible(true);
    };

    const handleTableChange = (pagination) => {
        setPagination(prevPagination => ({
            ...prevPagination,
            current: pagination.current
        }));
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const data = {
                name: values.name,
                selection_start_time: values.selection_time[0].format(),
                selection_end_time: values.selection_time[1].format(),
                effective_start_date: values.effective_time[0].format(),
                effective_end_date: values.effective_time[1].format()
            };

            if (mealImage) {
                data.image = mealImage.split(',')[1];
            }

            if (currentMeal) {
                await updateMeal(currentMeal.id, data);
                message.success('餐食更新成功');
            } else {
                await createMeal(data);
                message.success('餐食创建成功');
            }

            setModalVisible(false);
            await fetchMeals();
        } catch (error) {
            if (error.errorFields) {
                message.error('请检查表单填写是否正确');
            } else {
                console.error('操作失败:', error);
                message.error('操作失败：' + error.data.message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteMeal(id);
            message.success('餐食删除成功');
            await fetchMeals();
        } catch (error) {
            console.error('删除餐食失败:', error);
            message.error('删除餐食失败');
        }
    };

    const handlePreview = (imagePath) => {
        setPreviewImage(imagePath);
        setPreviewVisible(true);
    };

    const handleNotifyUnselected = (record) => {
        setNotifyingMeal(record);
        setNotifyModalVisible(true);
    };

    const handleNotifyConfirm = async () => {
        if (!notifyingMeal) return;

        try {
            setNotifying(true);
            await notifyUnselectedStudents(notifyingMeal.id);
            message.success('提醒已发送');
            setNotifyModalVisible(false);
        } catch (error) {
            console.error('发送提醒失败:', error);
            message.error('发送提醒失败');
        } finally {
            setNotifying(false);
        }
    };

    const getMealStatus = (record) => {
        const now = dayjs();
        const selectionStart = dayjs(record.selection_start_time);
        const selectionEnd = dayjs(record.selection_end_time);
        const effectiveStart = dayjs(record.effective_start_date);
        const effectiveEnd = dayjs(record.effective_end_date);

        if (now.isBetween(effectiveStart, effectiveEnd)) {
            return {status: 'active', text: '领取生效中'};
        } else if (now.isBetween(selectionStart, selectionEnd)) {
            return {status: 'selecting', text: '选餐进行中'};
        } else if (now.isBefore(selectionStart)) {
            return {status: 'upcoming', text: '选餐即将开始'};
        } else if (now.isBetween(selectionEnd, effectiveStart)) {
            return {status: 'upcoming', text: '选餐已结束，领取暂未生效'};
        } else {
            return {status: 'expired', text: '已过期'};
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 60
        },
        {
            title: '餐食名称',
            dataIndex: 'name',
            key: 'name'
        },
        {
            title: '餐食图片',
            dataIndex: 'image_path',
            key: 'image_path',
            render: (text) => (
                <div style={{textAlign: 'center'}}>
                    {text ? (
                        <Image
                            src={text}
                            alt="餐食图片"
                            style={{width: 80, height: 60, objectFit: 'cover'}}
                            preview={false}
                            onClick={() => handlePreview(text)}
                        />
                    ) : (
                        <Empty description="无图片" style={{height: 60, padding: 0}}
                               image={Empty.PRESENTED_IMAGE_SIMPLE}/>
                    )}
                </div>
            )
        },
        {
            title: '选餐时间',
            key: 'selection_time',
            render: (_, record) => (
                <div>
                    <div>{dayjs(record.selection_start_time).format('YYYY-MM-DD HH:mm')}</div>
                    <div>至</div>
                    <div>{dayjs(record.selection_end_time).format('YYYY-MM-DD HH:mm')}</div>
                </div>
            )
        },
        {
            title: '生效时间',
            key: 'effective_time',
            render: (_, record) => (
                <div>
                    <div>{dayjs(record.effective_start_date).format('YYYY-MM-DD HH:mm')}</div>
                    <div>至</div>
                    <div>{dayjs(record.effective_end_date).format('YYYY-MM-DD HH:mm')}</div>
                </div>
            )
        },
        {
            title: '状态',
            key: 'status',
            render: (_, record) => {
                const {status, text} = getMealStatus(record);
                let color = 'default';
                let icon = <ClockCircleOutlined/>;

                if (status === 'active') {
                    color = 'success';
                    icon = <CheckCircleOutlined/>;
                } else if (status === 'selecting') {
                    color = 'processing';
                }

                return (
                    <Tooltip title={text}>
                        <Button type="text" icon={icon}
                                style={{color: color === 'success' ? '#52c41a' : color === 'processing' ? '#1890ff' : '#d9d9d9'}}>
                            {text}
                        </Button>
                    </Tooltip>
                );
            }
        },
        {
            title: '操作',
            key: 'action',
            width: 280,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        icon={<EditOutlined/>}
                        size="small"
                        onClick={() => showEditModal(record)}
                    >
                        编辑
                    </Button>
                    <Button
                        icon={<EyeOutlined/>}
                        size="small"
                        onClick={() => handlePreview(record.image_path)}
                    >
                        预览
                    </Button>
                    <Button
                        icon={<NotificationOutlined/>}
                        size="small"
                        type="primary"
                        onClick={() => handleNotifyUnselected(record)}
                    >
                        提醒未选餐
                    </Button>
                    <Popconfirm
                        title="确定要删除该餐食吗？此操作将同时删除与之相关的选餐记录和图片。"
                        onConfirm={() => handleDelete(record.id)}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button icon={<DeleteOutlined/>} size="small" danger>
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <PageLayout breadcrumb={[<Link key="home" to="/admin">首页</Link>, '餐食管理']}>
            <div className="page-title">
                <Title level={4}>餐食管理</Title>
            </div>

            <Spin spinning={loading}>
                <Card>
                    <div style={{overflowX: 'auto'}}>
                        <div style={{minWidth: '1000px', marginBottom: '16px'}}>
                            <div style={{display: 'flex', justifyContent: 'flex-start'}}>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined/>}
                                    onClick={showAddModal}
                                >
                                    添加餐食
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div style={{overflowX: 'auto'}}>
                        <Table
                            columns={columns}
                            dataSource={meals}
                            rowKey="id"
                            pagination={pagination}
                            onChange={handleTableChange}
                            scroll={{x: 1200}}
                        />
                    </div>
                </Card>

                <Modal
                    title={currentMeal ? '编辑餐食' : '添加餐食'}
                    visible={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    onOk={handleSubmit}
                    confirmLoading={submitting}
                    width={700}
                >
                    <Form
                        form={form}
                        layout="vertical"
                    >
                        <Form.Item
                            name="name"
                            label="餐食名称"
                            rules={[{required: true, message: '请输入餐食名称'}]}
                        >
                            <Input placeholder="请输入餐食名称，例如：学校第三次选餐"/>
                        </Form.Item>

                        <Form.Item
                            name="selection_time"
                            label="选餐时间段"
                            rules={[{required: true, message: '请选择选餐时间段'}]}
                        >
                            <RangePicker
                                showTime
                                format="YYYY-MM-DD HH:mm:ss"
                                style={{width: '100%'}}
                                placeholder={['选餐开始时间', '选餐结束时间']}
                            />
                        </Form.Item>

                        <Form.Item
                            name="effective_time"
                            label="生效时间段"
                            rules={[{required: true, message: '请选择生效时间段'}]}
                        >
                            <RangePicker
                                showTime
                                format="YYYY-MM-DD HH:mm:ss"
                                style={{width: '100%'}}
                                placeholder={['生效开始时间', '生效结束时间']}
                            />
                        </Form.Item>

                        <Form.Item label="餐食图片">
                            <Upload
                                accept="image/*"
                                listType="picture-card"
                                showUploadList={false}
                                beforeUpload={() => false}
                                onChange={handleImageChange}
                            >
                                {mealImage ? (
                                    <img
                                        src={mealImage}
                                        alt="餐食图片预览"
                                        style={{width: '100%'}}
                                    />
                                ) : currentMeal && currentMeal.image_path ? (
                                    <img
                                        src={currentMeal.image_path}
                                        alt="当前餐食图片"
                                        style={{width: '100%'}}
                                    />
                                ) : (
                                    <div>
                                        <UploadOutlined/>
                                        <div style={{marginTop: 8}}>上传图片</div>
                                    </div>
                                )}
                            </Upload>
                            {currentMeal && !mealImage && (
                                <div style={{marginTop: 8}}>
                                    <Text type="secondary">不更新图片将保留原有图片</Text>
                                </div>
                            )}
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    visible={previewVisible}
                    title="图片预览"
                    footer={null}
                    onCancel={() => setPreviewVisible(false)}
                >
                    <img alt="预览" style={{width: '100%'}} src={previewImage}/>
                </Modal>

                <Modal
                    title="提醒未选餐学生"
                    visible={notifyModalVisible}
                    onCancel={() => setNotifyModalVisible(false)}
                    onOk={handleNotifyConfirm}
                    confirmLoading={notifying}
                >
                    <p>确定要向所有未完成"{notifyingMeal?.name}"选餐的学生和家长发送提醒通知吗？</p>
                    <p>这将通过钉钉发送消息提醒所有未选餐的学生和家长尽快完成选餐。</p>
                </Modal>
            </Spin>
        </PageLayout>
    );
};

export default MenuManage;