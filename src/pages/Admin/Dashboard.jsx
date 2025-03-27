import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Statistic, Typography, Spin, Select, Empty,
  Table} from 'antd';
import { 
  TeamOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined} from '@ant-design/icons';
import PageLayout from '../../components/PageLayout';
import { getAllMealSelections } from '../../api/meal';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [mealStats, setMealStats] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);

  // 获取统计数据
  useEffect(() => {
    const fetchSelectionData = async () => {
      try {
        setLoading(true);
        
        // 获取所有餐食的选餐统计数据
        const response = await getAllMealSelections();
        
        if (response && response.length > 0) {
          setMealStats(response);
          // 默认选择第一个餐食
          setSelectedMeal(response[0].meal_id);
        } else {
          setMealStats([]);
          setSelectedMeal(null);
        }
      } catch (error) {
        console.error('获取餐食统计数据失败:', error);
        setMealStats([]);
        setSelectedMeal(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSelectionData();
  }, []);

  // 处理餐食选择变化
  const handleMealChange = (value) => {
    setSelectedMeal(value);
  };

  // 获取当前选择的餐食统计数据
  const getCurrentMealStats = () => {
    if (!selectedMeal || mealStats.length === 0) return null;
    return mealStats.find(meal => meal.meal_id === selectedMeal);
  };

  // 当前选中的餐食数据
  const currentMealData = getCurrentMealStats();

  // 格式化日期显示
  const formatDate = (dateString) => {
    return moment(dateString).format('YYYY-MM-DD HH:mm');
  };

  const columns = [
    {
      title: '餐食名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record.meal_id}
          </Text>
        </div>
      )
    },
    {
      title: '生效时间',
      dataIndex: 'effective_start',
      key: 'effective_start',
      render: (text, record) => (
        <div>
          <div>{formatDate(text)}</div>
          <div>至</div>
          <div>{formatDate(record.effective_end)}</div>
        </div>
      )
    },
    {
      title: '选餐时间',
      dataIndex: 'selection_start',
      key: 'selection_start',
      render: (text, record) => (
        <div>
          <div>{formatDate(text)}</div>
          <div>至</div>
          <div>{formatDate(record.selection_end)}</div>
        </div>
      )
    }
  ];

  return (
    <PageLayout breadcrumb={['首页']}>
      <div className="page-title">
        <Title level={4}>控制台</Title>
      </div>
      
      <Spin spinning={loading}>
        {mealStats.length > 0 ? (
          <>
            <Card title="餐食选餐统计概览" style={{ marginBottom: 16 }}>
              <Table 
                dataSource={mealStats} 
                columns={columns} 
                rowKey="meal_id"
                pagination={false}
              />
            </Card>

            <div style={{ marginBottom: 16 }}>
              <Select
                style={{ width: 300 }}
                placeholder="选择查看详细统计的餐食"
                onChange={handleMealChange}
                value={selectedMeal}
              >
                {mealStats.map(meal => (
                  <Option key={meal.meal_id} value={meal.meal_id}>
                    {meal.name} ({formatDate(meal.effective_start).split(' ')[0]})
                  </Option>
                ))}
              </Select>
            </div>

            {currentMealData && (
              <Row gutter={16}>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="总学生数"
                      value={currentMealData.total}
                      prefix={<TeamOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="A餐人数"
                      value={currentMealData.total_a}
                      prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="B餐人数"
                      value={currentMealData.total_b}
                      prefix={<CheckCircleOutlined style={{ color: '#1890ff' }} />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="未选餐人数"
                      value={currentMealData.total_unselected}
                      prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
                    />
                  </Card>
                </Col>
              </Row>
            )}
          </>
        ) : (
          <Empty 
            description="暂无餐食数据" 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        )}
      </Spin>
    </PageLayout>
  );
};

export default AdminDashboard;