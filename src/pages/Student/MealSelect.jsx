import {useEffect, useState} from 'react';
import {
    Alert,
    Button,
    Card,
    Col,
    Divider,
    Empty,
    Image,
    List,
    message,
    Radio,
    Result,
    Row,
    Spin,
    Tag,
    Typography
} from 'antd';
import {CalendarOutlined, ClockCircleOutlined} from '@ant-design/icons';
import {Link, useSearchParams} from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import {getStudentMealSelection, studentSelectMeal} from '../../api/meal';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const {Title, Text} = Typography;

const MealSelect = () => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [meals, setMeals] = useState([]);
    const [currentMeal, setCurrentMeal] = useState(null);
    const [selectedMeal, setSelectedMeal] = useState('');
    const [searchParams, setSearchParams] = useSearchParams();

    // 获取菜单和选餐状态
    const fetchData = async () => {
        try {
            setLoading(true);

            // 获取URL中的mealId参数
            const mealIdFromURL = searchParams.get("mealId");

            // 获取学生选餐信息
            const response = await getStudentMealSelection();

            if (response && response.selections && response.selections.length > 0) {
                setMeals(response.selections);

                let targetMeal = null;

                // 先检查URL中是否有指定的餐食ID
                if (mealIdFromURL) {
                    targetMeal = response.selections.find(meal => meal.meal_id.toString() === mealIdFromURL);
                }

                // 如果URL中没有指定餐食ID或者指定的ID不存在，则查找第一个可选餐的餐食
                if (!targetMeal) {
                    targetMeal = response.selections.find(meal => meal.selectable);
                }

                // 如果没有可选餐的餐食，选择第一个餐食作为当前餐食
                if (!targetMeal) {
                    targetMeal = response.selections[0];
                }

                setCurrentMeal(targetMeal);
                setSelectedMeal(targetMeal.meal_type || '');
            } else {
                setMeals([]);
                setCurrentMeal(null);
            }
        } catch (error) {
            message.error('获取数据失败：' + error.message);
            setMeals([]);
            setCurrentMeal(null);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);

    // 处理选餐变更
    const handleMealChange = (e) => {
        setSelectedMeal(e.target.value);
    };

    // 处理餐食选择
    const handleMealSelect = (meal) => {
        setCurrentMeal(meal);
        setSelectedMeal(meal.meal_type || '');
        // 更新地址栏
        setSearchParams({ mealId: meal.meal_id });
    };

    // 提交选餐
    const handleSubmit = async () => {
        if (!currentMeal) {
            message.warning('请先选择餐食');
            return;
        }

        if (!selectedMeal) {
            message.warning('请先选择餐食类型(A/B)');
            return;
        }

        try {
            setSubmitting(true);

            await studentSelectMeal({
                meal_id: currentMeal.meal_id,
                meal_type: selectedMeal
            });

            message.success('选餐成功');
        } catch (error) {
            message.error('选餐失败：' + error.message);
        } finally {
            // 重新从服务器拉取数据
            await fetchData();
            setSubmitting(false);
        }
    };

    // 格式化日期显示
    const formatDate = (dateString) => {
        return dayjs(dateString).format('YYYY-MM-DD HH:mm');
    };

    // 判断餐食状态
    const getMealStatus = (meal) => {
        if (!meal) return {text: '未知', color: 'default'};

        const now = dayjs();
        const selectionStart = dayjs(meal.selection_start_time);
        const selectionEnd = dayjs(meal.selection_end_time);
        const effectiveStart = dayjs(meal.effective_start_date);
        const effectiveEnd = dayjs(meal.effective_end_date);

        if (now.isBetween(effectiveStart, effectiveEnd)) {
            return {text: '领取生效中', color: 'success'};
        } else if (now.isBetween(selectionStart, selectionEnd)) {
            return {text: '选餐进行中', color: 'processing'};
        } else if (now.isBefore(selectionStart)) {
            return {text: '选餐即将开始', color: 'default'};
        } else if (now.isBetween(selectionEnd, effectiveStart)) {
            return {text: '选餐已结束，领取暂未生效', color: 'default'};
        } else {
            return {text: '已过期', color: 'default'};
        }
    };

    // 渲染选餐表单
    const renderMealSelectionForm = () => {
        if (!currentMeal) {
            return (
                <Empty description="暂无可选餐食"/>
            );
        }

        // 如果不在选餐时间内
        if (!currentMeal.selectable) {
            return (
                <Result
                    icon={<ClockCircleOutlined style={{color: '#faad14'}}/>}
                    title="当前不在选餐时间内"
                    subTitle={`选餐开放时间：${formatDate(currentMeal.selection_start_time)} 至 ${formatDate(currentMeal.selection_end_time)}`}
                />
            );
        }

        // 选餐表单
        return (
            <div style={{textAlign: 'center', padding: '20px 0'}}>
                <Title level={4}>请选择餐食类型</Title>
                <div style={{margin: '20px 0'}}>
                    <Radio.Group
                        value={selectedMeal}
                        onChange={handleMealChange}
                        buttonStyle="solid"
                        size="large"
                    >
                        <Radio.Button value="A">A餐</Radio.Button>
                        <Radio.Button value="B">B餐</Radio.Button>
                    </Radio.Group>
                </div>
                <Button
                    type="primary"
                    size="large"
                    onClick={handleSubmit}
                    loading={submitting}
                    disabled={!selectedMeal}
                >
                    {currentMeal.meal_type ? '修改选择' : '确认选择'}
                </Button>

                {currentMeal.meal_type && (
                    <div style={{marginTop: 16}}>
                        <Alert
                            message={`您当前选择了${currentMeal.meal_type}餐`}
                            type="success"
                            showIcon
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <PageLayout breadcrumb={[<Link key="home" to="/student">首页</Link>, '选餐']}>
            <div className="page-title">
                <Title level={4}>选餐</Title>
            </div>

            <Spin spinning={loading}>
                <Row gutter={16}>
                    <Col span={24} md={8}>
                        <Card title="可选餐食列表">
                            {meals.length > 0 ? (
                                <List
                                    itemLayout="horizontal"
                                    dataSource={meals}
                                    renderItem={meal => {
                                        const status = getMealStatus(meal);

                                        return (
                                            <List.Item
                                                actions={[
                                                    <Button
                                                        type={currentMeal && currentMeal.meal_id === meal.meal_id ? 'primary' : 'default'}
                                                        size="small"
                                                        onClick={() => handleMealSelect(meal)}
                                                    >
                                                        {currentMeal && currentMeal.meal_id === meal.meal_id ? '当前查看' : '查看'}
                                                    </Button>
                                                ]}
                                            >
                                                <List.Item.Meta
                                                    title={
                                                        <div>
                                                            {meal.name}
                                                            {meal.meal_type && (
                                                                <Tag
                                                                    color={meal.meal_type === 'A' ? 'success' : 'processing'}
                                                                    style={{marginLeft: 8}}>
                                                                    已选{meal.meal_type}餐
                                                                </Tag>
                                                            )}

                                                            <Tag color={status.color} style={{marginLeft: 4}}>
                                                                {status.text}
                                                            </Tag>
                                                        </div>
                                                    }
                                                    description={
                                                        <div>
                                                            <div>
                                                                <CalendarOutlined style={{marginRight: 4}}/>
                                                                生效时间: {formatDate(meal.effective_start_date).split(' ')[0]}
                                                            </div>
                                                            <div>
                                                                <ClockCircleOutlined style={{marginRight: 4}}/>
                                                                选餐截止: {formatDate(meal.selection_end_time)}
                                                            </div>
                                                        </div>
                                                    }
                                                />
                                            </List.Item>
                                        );
                                    }}
                                />
                            ) : (
                                <Empty description="暂无餐食信息"/>
                            )}
                        </Card>
                    </Col>

                    <Col span={24} md={16}>
                        <Card title={currentMeal ? `餐食详情: ${currentMeal.name}` : '餐食详情'}>
                            {currentMeal ? (
                                <Row gutter={16}>
                                    { currentMeal.image_path ? (
                                        <Col span={24} md={12}>
                                            <div style={{marginBottom: 16, textAlign: 'center'}}>
                                                <Image
                                                    src={currentMeal.image_path}
                                                    alt="餐食图片"
                                                    style={{width: '100%', maxHeight: 300, objectFit: 'cover'}}
                                                />
                                                <Text type="secondary"
                                                    style={{display: 'block', textAlign: 'center', marginTop: 4}}>
                                                    点击图片可查看大图
                                                </Text>
                                            </div>
                                        </Col>
                                    ) : (
                                        <Empty description="无图片" style={{height: 60, padding: 0}}
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}/>
                                    )}
                                    <Col span={24} md={12}>
                                        <div style={{marginBottom: 16}}>
                                            <Title level={5}>餐食信息</Title>
                                            <div><Text strong>餐食ID：</Text> {currentMeal.meal_id}</div>
                                            <div><Text strong>餐食名称：</Text> {currentMeal.name}</div>
                                            <div><Text
                                                strong>选餐时间：</Text> {formatDate(currentMeal.selection_start_time)} 至 {formatDate(currentMeal.selection_end_time)}
                                            </div>
                                            <div><Text
                                                strong>生效时间：</Text> {formatDate(currentMeal.effective_start_date)} 至 {formatDate(currentMeal.effective_end_date)}
                                            </div>
                                            <div>
                                                <Text strong>状态：</Text>
                                                <Tag color={getMealStatus(currentMeal).color} style={{marginLeft: 4}}>
                                                    {getMealStatus(currentMeal).text}
                                                </Tag>
                                            </div>

                                            {currentMeal.meal_type && (
                                                <div>
                                                    <div style={{marginTop: 8}}>
                                                        <Text strong>您已选择：</Text>
                                                        <Tag
                                                            color={currentMeal.meal_type === 'A' ? 'success' : 'processing'}
                                                            style={{marginLeft: 4}}>
                                                            {currentMeal.meal_type}餐
                                                        </Tag>
                                                    </div>
                                                    <div style={{marginTop: 8}}>
                                                        <Text strong>操作时间：</Text>
                                                        <Tag
                                                            color="processing"
                                                            style={{marginLeft: 4}}>
                                                            {formatDate(currentMeal.updated_at)}
                                                        </Tag>
                                                    </div>
                                                    <div style={{marginTop: 8}}>
                                                        <Text strong>操作人：</Text>
                                                        <Tag
                                                            color="processing"
                                                            style={{marginLeft: 4}}>
                                                            {currentMeal.operator}
                                                        </Tag>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <Divider/>

                                        {renderMealSelectionForm()}
                                    </Col>
                                </Row>
                            ) : (
                                <Empty description="请选择左侧餐食查看详情"/>
                            )}
                        </Card>
                    </Col>
                </Row>
            </Spin>
        </PageLayout>
    );
};

export default MealSelect;