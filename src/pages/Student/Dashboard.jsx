import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Typography, Spin, Alert, Button, List, Empty } from 'antd';
import { UserOutlined, BookOutlined, CalendarOutlined, ArrowRightOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import { getStudentMealSelection } from '../../api/meal';
import { getUser } from '../../utils/auth';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const { Title, Text } = Typography;

const StudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState([]);
  const navigate = useNavigate();
  const user = getUser();

  // 获取选餐信息
  useEffect(() => {
    const fetchMealData = async () => {
      try {
        setLoading(true);
        
        const data = await getStudentMealSelection();
        if (data && data.selections) {
          setMeals(data.selections);
        } else {
          setMeals([]);
        }
      } catch (error) {
        console.error('获取餐食数据失败:', error);
        setMeals([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMealData();
  }, []);

  // 处理选餐跳转
  const handleGoToMealSelect = () => {
    navigate('/student/meal');
  };

  // 格式化日期显示
  const formatDate = (dateString) => {
    return dayjs(dateString).format('YYYY-MM-DD HH:mm');
  };

  // 判断餐食状态
  const getMealStatus = (meal) => {
    if (!meal) return { text: '未知', color: '' };
    
    const now = dayjs();
    const selectionStart = dayjs(meal.selection_start_time);
    const selectionEnd = dayjs(meal.selection_end_time);
    const effectiveStart = dayjs(meal.effective_start_date);
    const effectiveEnd = dayjs(meal.effective_end_date);
    
    if (now.isBetween(effectiveStart, effectiveEnd)) {
      return { text: '领取生效中', color: 'success' };
    } else if (now.isBetween(selectionStart, selectionEnd)) {
      return { text: '选餐进行中', color: 'processing' };
    } else if (now.isBefore(selectionStart)) {
      return { text: '选餐即将开始', color: 'default' };
    } else if (now.isBetween(selectionEnd, effectiveStart)) {
      return { text: '选餐已结束，领取暂未生效', color: 'default' };
    } else {
      return { text: '已过期', color: 'default' };
    }
  };

  // 查找当前可选餐的餐食
  const getSelectableMeal = () => {
    return meals.find(meal => meal.selectable);
  };

  // 渲染可选餐提示
  const renderSelectionAlert = () => {
    const selectableMeal = getSelectableMeal();
    
    if (selectableMeal) {
      return (
        <Alert
          message={selectableMeal.meal_type ? "您已完成选餐" : "您还未选择餐食"}
          description={
            <div>
              {selectableMeal.meal_type ? (
                <div>
                  您为"{selectableMeal.name}"选择了
                  <Tag color={selectableMeal.meal_type === 'A' ? 'success' : 'blue'}>
                    {selectableMeal.meal_type}餐
                  </Tag>
                  <div style={{ marginTop: 8 }}>
                    <Button type="primary" onClick={handleGoToMealSelect}>
                      修改选择 <ArrowRightOutlined />
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  有餐食"{selectableMeal.name}"可供选择，请尽快完成选餐。
                  <div style={{ marginTop: 8 }}>
                    <Button type="primary" onClick={handleGoToMealSelect}>
                      立即选餐 <ArrowRightOutlined />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          }
          type={selectableMeal.meal_type ? "success" : "warning"}
          showIcon
        />
      );
    }
    
    // 当前没有可选餐的餐食
    return (
      <Alert
        message="当前无可选餐食"
        description={
          <div>
            <div>当前没有可以选择的餐食</div>
            <div style={{ marginTop: 8 }}>
              <Button onClick={handleGoToMealSelect}>
                查看所有餐食 <ArrowRightOutlined />
              </Button>
            </div>
          </div>
        }
        type="info"
        showIcon
      />
    );
  };

  return (
    <PageLayout breadcrumb={['首页']}>
      <div className="page-title">
        <Title level={4}>学生主页</Title>
      </div>
      
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ backgroundColor: '#f0f2f5', padding: '16px', borderRadius: '50%', marginRight: '16px' }}>
                  <UserOutlined style={{ fontSize: '24px' }} />
                </div>
                <div>
                  <Title level={4} style={{ margin: 0 }}>{user?.full_name || '同学'}</Title>
                  <Text type="secondary">学生账号</Text>
                </div>
              </div>
            </Card>
          </Col>

          <Col span={24}>
            <Card title={<span><CalendarOutlined /> 选餐状态</span>}>
              {renderSelectionAlert()}
            </Card>
          </Col>

          <Col span={24}>
            <Card title={<span><ClockCircleOutlined /> 餐食情况</span>}>
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
                            type="link" 
                            onClick={handleGoToMealSelect}
                          >
                            查看详情
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <div>
                              {meal.name}
                              {meal.meal_type && (
                                <Tag color={meal.meal_type === 'A' ? 'success' : 'processing'} style={{ marginLeft: 8 }}>
                                  已选{meal.meal_type}餐
                                </Tag>
                              )}
                              <Tag color={status.color} style={{ marginLeft: 4 }}>
                                {status.text}
                              </Tag>
                            </div>
                          }
                          description={
                            <div>
                              <div>生效时间: {formatDate(meal.effective_start_date)} 至 {formatDate(meal.effective_end_date)}</div>
                              <div>选餐时间: {formatDate(meal.selection_start_time)} 至 {formatDate(meal.selection_end_time)}</div>
                            </div>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              ) : (
                <Empty description="暂无餐食信息" />
              )}
            </Card>
          </Col>

          <Col span={24}>
            <Card title={<span><BookOutlined /> 选餐须知</span>}>
              <ul>
                <li>请在规定的选餐时间内完成选餐</li>
                <li>如在规定时间内未选餐，系统将自动随机分配餐食</li>
                <li>选餐完成后可在选餐时间内修改</li>
                <li>选餐时间结束后将无法修改</li>
                <li>如有多个学生，请点击右上角用户名后选择退出登录，并点击钉钉登录重新选择其他学生</li>
                <li>餐食图片可以点击查看大图</li>
                <li>若界面显示不正常，请更新钉钉版本</li>
                <li>就餐时出示二维码供食堂工作人员扫描</li>
              </ul>
            </Card>
          </Col>
        </Row>
      </Spin>
    </PageLayout>
  );
};

export default StudentDashboard;