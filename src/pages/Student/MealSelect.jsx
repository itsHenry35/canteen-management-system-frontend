import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Radio, message, Typography, Spin, Result, Divider, Empty, List, Tag, Image, Alert } from 'antd';
import { ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import PageLayout from '../../components/PageLayout';
import { getStudentMealSelection, studentSelectMeal } from '../../api/meal';
import moment from 'moment';

const { Title, Text } = Typography;

const MealSelect = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [meals, setMeals] = useState([]);
  const [currentMeal, setCurrentMeal] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState('');

  // 获取菜单和选餐状态
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 获取学生选餐信息
        const response = await getStudentMealSelection();
        
        if (response && response.selections && response.selections.length > 0) {
          setMeals(response.selections);
          
          // 查找第一个可选餐的餐食作为当前餐食
          const selectableMeal = response.selections.find(meal => meal.selectable);
          
          if (selectableMeal) {
            setCurrentMeal(selectableMeal);
            setSelectedMeal(selectableMeal.meal_type || '');
          } else {
            // 如果没有可选餐的餐食，选择第一个餐食作为当前餐食
            setCurrentMeal(response.selections[0]);
            setSelectedMeal(response.selections[0].meal_type || '');
          }
        } else {
          setMeals([]);
          setCurrentMeal(null);
        }
      } catch (error) {
        console.error('获取数据失败:', error);
        message.error('获取数据失败，请重试');
        setMeals([]);
        setCurrentMeal(null);
      } finally {
        setLoading(false);
      }
    };
    
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
      
      // 更新选餐状态
      const updatedMeals = meals.map(meal => {
        if (meal.meal_id === currentMeal.meal_id) {
          return {
            ...meal,
            meal_type: selectedMeal
          };
        }
        return meal;
      });
      
      setMeals(updatedMeals);
      
      // 更新当前餐食
      setCurrentMeal({
        ...currentMeal,
        meal_type: selectedMeal
      });
    } catch (error) {
      console.error('选餐失败:', error);
      message.error('选餐失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 格式化日期显示
  const formatDate = (dateString) => {
    return moment(dateString).format('YYYY-MM-DD HH:mm');
  };

  // 判断餐食状态
  const getMealStatus = (meal) => {
    if (!meal) return { text: '未知', color: '' };
    
    const now = moment();
    const selectionStart = moment(meal.selection_start_time);
    const selectionEnd = moment(meal.selection_end_time);
    const effectiveStart = moment(meal.effective_start_date);
    const effectiveEnd = moment(meal.effective_end_date);
    
    if (now.isBetween(effectiveStart, effectiveEnd)) {
      return { text: '当前生效中', color: 'success' };
    } else if (now.isBetween(selectionStart, selectionEnd)) {
      return { text: '选餐进行中', color: 'processing' };
    } else if (now.isBefore(selectionStart)) {
      return { text: '即将开始', color: 'default' };
    } else {
      return { text: '已过期', color: 'default' };
    }
  };

  // 渲染选餐表单
  const renderMealSelectionForm = () => {
    if (!currentMeal) {
      return (
        <Empty description="暂无可选餐食" />
      );
    }
    
    // 如果不在选餐时间内
    if (!currentMeal.selectable) {
      return (
        <Result
          icon={<ClockCircleOutlined style={{ color: '#faad14' }} />}
          title="当前不在选餐时间内"
          subTitle={`选餐开放时间：${formatDate(currentMeal.selection_start_time)} 至 ${formatDate(currentMeal.selection_end_time)}`}
        />
      );
    }
    
    // 选餐表单
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Title level={4}>请选择餐食类型</Title>
        <div style={{ margin: '20px 0' }}>
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
          <div style={{ marginTop: 16 }}>
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
    <PageLayout breadcrumb={['首页', '选餐']}>
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
                              <div>
                                <CalendarOutlined style={{ marginRight: 4 }} />
                                生效时间: {formatDate(meal.effective_start_date).split(' ')[0]}
                              </div>
                              <div>
                                <ClockCircleOutlined style={{ marginRight: 4 }} />
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
                <Empty description="暂无餐食信息" />
              )}
            </Card>
          </Col>
          
          <Col span={24} md={16}>
            <Card title={currentMeal ? `餐食详情: ${currentMeal.name}` : '餐食详情'}>
              {currentMeal ? (
                <Row gutter={16}>
                  <Col span={24} md={12}>
                    <div style={{ marginBottom: 16 }}>
                      <Image
                        src={currentMeal.image_path}
                        alt="餐食图片"
                        style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }}
                        fallback="data:image/png;base64,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"
                      />
                    </div>
                  </Col>
                  <Col span={24} md={12}>
                    <div style={{ marginBottom: 16 }}>
                      <Title level={5}>餐食信息</Title>
                      <div><Text strong>餐食ID：</Text> {currentMeal.meal_id}</div>
                      <div><Text strong>餐食名称：</Text> {currentMeal.name}</div>
                      <div><Text strong>选餐时间：</Text> {formatDate(currentMeal.selection_start_time)} 至 {formatDate(currentMeal.selection_end_time)}</div>
                      <div><Text strong>生效时间：</Text> {formatDate(currentMeal.effective_start_date)} 至 {formatDate(currentMeal.effective_end_date)}</div>
                      <div>
                        <Text strong>状态：</Text>
                        <Tag color={getMealStatus(currentMeal).color} style={{ marginLeft: 4 }}>
                          {getMealStatus(currentMeal).text}
                        </Tag>
                      </div>
                      
                      {currentMeal.meal_type && (
                        <div style={{ marginTop: 8 }}>
                          <Text strong>您已选择：</Text>
                          <Tag color={currentMeal.meal_type === 'A' ? 'success' : 'processing'} style={{ marginLeft: 4 }}>
                            {currentMeal.meal_type}餐
                          </Tag>
                        </div>
                      )}
                    </div>
                    
                    <Divider />
                    
                    {renderMealSelectionForm()}
                  </Col>
                </Row>
              ) : (
                <Empty description="请选择左侧餐食查看详情" />
              )}
            </Card>
          </Col>
        </Row>
      </Spin>
    </PageLayout>
  );
};

export default MealSelect;