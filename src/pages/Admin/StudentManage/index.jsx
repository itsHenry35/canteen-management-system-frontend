import React, { useState, useEffect, useRef } from 'react';
import { 
  Table, Button, Modal, Form, Input, Space, 
  Popconfirm, message, Typography, Card,
  Radio, Tag, Row, Col, Divider, Alert,
  Dropdown, Menu, Progress, Select,
  Spin
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined,
  QrcodeOutlined, ReloadOutlined, FilterOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined,
  PrinterOutlined, MenuOutlined,
  DashOutlined, ImportOutlined
} from '@ant-design/icons';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import PageLayout from '../../../components/PageLayout';
import BatchQrcodePrint from './BatchQrcodePrint';
import TextArea from 'antd/lib/input/TextArea';
import { batchSelectMeals, getAllMeals, getMealSelections } from '../../../api/meal';
import { createStudent, deleteStudent, getAllStudents, getStudentQRCodeData, updateStudent } from '../../../api/student';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const StudentManage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);
  const [qrcodeVisible, setQrcodeVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [currentQrcode, setCurrentQrcode] = useState(null);
  const [form] = Form.useForm();

  // 多餐相关状态
  const [meals, setMeals] = useState([]);
  const [currentMealId, setCurrentMealId] = useState(null);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [loadingSelections, setLoadingSelections] = useState(false);

  // 批量导入相关状态
  const [batchImportVisible, setBatchImportVisible] = useState(false);
  const [batchImportForm] = Form.useForm();
  const [batchImportLoading, setBatchImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [importCurrent, setImportCurrent] = useState(0);
  const [importSuccess, setImportSuccess] = useState(0);
  const [importFailed, setImportFailed] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [importCompleted, setImportCompleted] = useState(false);

  // 筛选状态
  const [filteredInfo, setFilteredInfo] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [batchMealType, setBatchMealType] = useState('A');
  
  // 批量打印二维码相关
  const [batchQrcodeVisible, setBatchQrcodeVisible] = useState(false);
  const [qrcodeDataList, setQrcodeDataList] = useState([]);
  const [printLoading, setPrintLoading] = useState(false);
  const printComponentRef = useRef();

  // 分页相关设置
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 100, // 一页显示100条数据
    showSizeChanger: false,
    showTotal: (total) => `共 ${total} 条数据`
  });

  // 获取所有餐食
  const fetchMeals = async () => {
    try {
      setLoadingMeals(true);
      const data = await getAllMeals();
      if (data && data.length > 0) {
        setMeals(data);
      } else {
        setMeals([]);
      }
    } catch (error) {
      console.error('获取餐食列表失败:', error);
      message.error('获取餐食列表失败', error.data.message);
      setMeals([]);
    } finally {
      setLoadingMeals(false);
    }
  };

  // 获取学生选餐情况
const fetchStudentsSelections = async (mealId) => {
  
  try {
    setLoadingSelections(true);
    const response = await getMealSelections(mealId);
    
    // 根据新的API响应格式来处理数据
    if (response) {
      // 获取所有学生列表(可能需要先获取)
      const allStudents = await getAllStudents();
      
      // 根据API返回的学生ID列表，更新学生的选餐状态
      const studentsWithSelections = allStudents.map(student => {
        let current_selection = '0';
        let selection_time = null;
        
        // 检查学生ID是否在A餐列表中
        if (response.a && response.a.includes(student.id)) {
          current_selection = 'A';
        } 
        // 检查学生ID是否在B餐列表中
        else if (response.b && response.b.includes(student.id)) {
          current_selection = 'B';
        }
        // 学生在未选择列表中或不在任何列表中，不用做什么
        return {
          ...student,
          current_selection,
          selection_time
        };
      });
      
      setStudents(studentsWithSelections);
    } else {
      setStudents([]);
    }
  } catch (error) {
    console.error('获取学生选餐情况失败:', error);
    message.error('获取学生选餐情况失败', error.data.message);
    setStudents([]);
  } finally {
    setLoadingSelections(false);
  }
};

  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      const response = await getAllStudents();
      if (response) {
        setStudents(response || []);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      message.error('获取学生列表失败', error.data.message);
    } finally {
      setLoading(false);
    }
  };

  // 初始化时获取餐食列表
  useEffect(() => {
    fetchMeals();
  }, []);

  // 当餐食ID变化时获取对应的学生选餐情况
  useEffect(() => {
    if (currentMealId) {
      fetchStudentsSelections(currentMealId);
    } else {
      fetchAllStudents();
    }
  }, [currentMealId]);

  // 选择餐食变化时的回调
  const handleMealChange = (value) => {
    setCurrentMealId(value);
    setSelectedRowKeys([]);
  };

  // 随机选餐功能相关
  const randomSelectMeals = async (studentIds) => {
    if (!currentMealId) {
      message.error('请先选择一个餐食');
      return Promise.reject(new Error('No meal selected'));
    }
    
    // 随机将学生分成两组
    const mealAStudents = [];
    const mealBStudents = [];
    
    // 对每个学生进行随机分配
    studentIds.forEach(id => {
      // 随机选择A餐或B餐 (50%概率)
      if (Math.random() < 0.5) {
        mealAStudents.push(id);
      } else {
        mealBStudents.push(id);
      }
    });
    
    try {
      // 如果有学生选择A餐，先处理A餐
      if (mealAStudents.length > 0) {
        await batchSelectMeals({
          student_ids: mealAStudents,
          meal_id: currentMealId,
          meal_type: 'A'
        });
      }
      
      // 如果有学生选择B餐，再处理B餐
      if (mealBStudents.length > 0) {
        await batchSelectMeals({
          student_ids: mealBStudents,
          meal_id: currentMealId,
          meal_type: 'B'
        });
      }
      
      return true; // 成功完成
    } catch (error) {
      console.error('随机选餐失败:', error.data.message);
      throw error; // 将错误向上传递
    }
  };

  // 获取学生列表

  // 显示添加学生对话框
  const showAddModal = () => {
    setCurrentStudent(null);
    form.resetFields();
    setVisible(true);
  };

  // 显示批量导入对话框
  const showBatchImportModal = () => {
    batchImportForm.resetFields();
    setBatchImportVisible(true);
    setShowProgress(false);
    setImportProgress(0);
    setImportTotal(0);
    setImportCurrent(0);
    setImportSuccess(0);
    setImportFailed(0);
    setImportCompleted(false);
  };

  // 处理批量导入学生
  const handleBatchImport = async () => {
    try {
      const values = await batchImportForm.validateFields();
      
      // 解析文本数据
      const lines = values.studentData.trim().split('\n');
      if (lines.length === 0) {
        message.error('请输入有效的学生数据');
        return;
      }
      
      setBatchImportLoading(true);
      setShowProgress(true);
      setImportTotal(lines.length);
      setImportCurrent(0);
      setImportSuccess(0);
      setImportFailed(0);
      
      // 逐行处理学生数据
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // 以空格分割 姓名 班级 钉钉ID
        const parts = line.split(/\s+/);
        if (parts.length < 2) {
          setImportFailed(prev => prev + 1);
          setImportCurrent(i + 1);
          setImportProgress(Math.floor(((i + 1) / lines.length) * 100));
          continue;
        }
        
        const studentData = {
          full_name: parts[0],
          class: parts[1],
          dingtalk_id: parts.length > 2 ? parts[2] : ''
        };
        
        try {
          // 调用API创建学生
          await createStudent(studentData);
          setImportSuccess(prev => prev + 1);
        } catch (error) {
          console.error('Failed to import student:', error);
          setImportFailed(prev => prev + 1);
        }
        
        // 更新进度
        setImportCurrent(i + 1);
        setImportProgress(Math.floor(((i + 1) / lines.length) * 100));
      }
      
      // 完成后刷新学生列表
      if (currentMealId) {
        fetchStudentsSelections(currentMealId);
      }
      
      // 标记导入完成
      setImportCompleted(true);
      
      // 不立即关闭对话框，让用户查看导入结果
      message.success(`批量导入完成：成功 ${importSuccess} 条，失败 ${importFailed} 条`);
    } catch (error) {
      console.error('Batch import failed:', error);
      message.error('批量导入失败');
    } finally {
      setBatchImportLoading(false);
    }
  };

  // 批量导入对话框取消/关闭
  const handleBatchImportCancel = () => {
    setBatchImportVisible(false);
  };

  // 显示编辑学生对话框
  const showEditModal = (record) => {
    setCurrentStudent(record);
    form.setFieldsValue({
      full_name: record.full_name,
      class: record.class,
      dingtalk_id: record.dingtalk_id || '',
    });
    setVisible(true);
  };

  // 显示二维码对话框
  const showQrcodeModal = async (student) => {
    try {
      setCurrentStudent(student);
      setCurrentQrcode({
        studentName: student.full_name,
        loading: true,
        data: null
      });
      setQrcodeVisible(true);
      
      // 根据API请求二维码数据
      const response = await getStudentQRCodeData(student.id);
      if (response && response.qr_data) {
        setCurrentQrcode({
          studentName: student.full_name,
          loading: false,
          data: response.qr_data
        });
      } else {
        throw new Error('Invalid QR code data');
      }
    } catch (error) {
      console.error('Failed to get QR code data:', error);
      message.error('获取二维码数据失败', error.data.message);
      setCurrentQrcode({
        studentName: student.full_name,
        loading: false,
        data: null,
        error: true
      });
    }
  };

  // 处理对话框确认
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      
      if (currentStudent) {
        // 更新学生
        await updateStudent(currentStudent.id, values);
        message.success('学生信息更新成功');
      } else {
        // 创建学生
        await createStudent(values);
        message.success('学生创建成功');
      }
      
      setVisible(false);
      
      // 刷新选餐数据
      if (currentMealId) {
        fetchStudentsSelections(currentMealId);
      }
    } catch (error) {
      console.error('Operation failed:', error);
      message.error('操作失败', error.data.message);
    } finally {
      setConfirmLoading(false);
    }
  };

  // 处理对话框取消
  const handleCancel = () => {
    setVisible(false);
  };

  // 处理删除学生
  const handleDelete = async (id) => {
    try {
      await deleteStudent(id);
      message.success('学生删除成功');
      
      // 刷新选餐数据
      if (currentMealId) {
        fetchStudentsSelections(currentMealId);
      }
    } catch (error) {
      console.error('Failed to delete student:', error);
      message.error('学生删除失败', error.data.message);
    }
  };

  // 处理批量删除学生
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请至少选择一名学生');
      return;
    }

    try {
      // 使用Promise.all同时处理多个删除请求
      await Promise.all(
        selectedRowKeys.map(studentId => deleteStudent(studentId))
      );
      message.success(`成功删除${selectedRowKeys.length}名学生`);
      // 清空选择
      setSelectedRowKeys([]);
      
      // 刷新选餐数据
      if (currentMealId) {
        fetchStudentsSelections(currentMealId);
      }
    } catch (error) {
      console.error('Failed to batch delete students:', error);
      message.error('批量删除学生失败', error.data.message);
    }
  };

  // 处理表格筛选变化
  const handleChange = (pagination, filters) => {
    setFilteredInfo(filters);
    setPagination(prevPagination => ({
      ...prevPagination,
      current: pagination.current
    }));
  };

  // 获取唯一的班级名称列表用于筛选
  const getClassFilters = () => {
    const classSet = new Set();
    students.forEach(student => {
      if (student.class) {
        classSet.add(student.class);
      }
    });
    
    return Array.from(classSet).map(className => ({
      text: className,
      value: className,
    }));
  };

  // 显示批量选餐对话框
  const showBatchSelectModal = () => {
    if (!currentMealId) {
      message.error('请先选择一个餐食');
      return;
    }
    
    if (selectedRowKeys.length === 0) {
      message.warning('请至少选择一名学生');
      return;
    }
    
    setBatchModalVisible(true);
  };

  // 处理批量选餐
  const handleBatchSelect = async () => {
    if (!currentMealId) {
      message.error('请先选择一个餐食');
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (batchMealType === 'random') {
        // 使用客户端随机选餐
        await randomSelectMeals(selectedRowKeys);
      } else {
        // A餐或B餐直接批量设置
        await batchSelectMeals({
          student_ids: selectedRowKeys,
          meal_id: currentMealId,
          meal_type: batchMealType
        });
      }
      
      message.success(`成功为${selectedRowKeys.length}名学生设置${batchMealType === 'random' ? '随机' : batchMealType}餐`);
      setBatchModalVisible(false);
      setSelectedRowKeys([]);
      
      // 刷新选餐数据
      fetchStudentsSelections(currentMealId);
    } catch (error) {
      console.error('Failed to batch select meals:', error);
      message.error('批量选餐失败', error.data.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 单个学生选餐
  const handleStudentMealSelect = async (studentId, mealType) => {
    if (!currentMealId) {
      message.error('请先选择一个餐食');
      return;
    }
    
    try {
      if (mealType === 'random') {
        // 对单个学生进行随机选餐
        await randomSelectMeals([studentId]);
      } else {
        // A餐或B餐直接设置
        await batchSelectMeals({
          student_ids: [studentId],
          meal_id: currentMealId,
          meal_type: mealType
        });
      }
      
      message.success(`成功设置${mealType === 'random' ? '随机' : mealType}餐`);
      
      // 刷新选餐数据
      fetchStudentsSelections(currentMealId);
    } catch (error) {
      console.error('Failed to select meal:', error);
      message.error('选餐失败', error.data.message);
    }
  };

  // 清除所有筛选条件
  const clearAllFilters = () => {
    setFilteredInfo({});
  };

  // 批量生成二维码
  const handleBatchQrcode = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请至少选择一名学生');
      return;
    }

    try {
      setPrintLoading(true);
      
      // 获取所选学生的二维码数据
      const qrcodeList = [];
      const selectedStudents = students.filter(s => selectedRowKeys.includes(s.id));

      for (const student of selectedStudents) {
        try {
          const response = await getStudentQRCodeData(student.id);
          if (response && response.qr_data) {
            qrcodeList.push({
              id: student.id,
              name: student.full_name,
              class: student.class,
              qrData: response.qr_data
            });
          }
        } catch (error) {
          console.error(`Failed to get QR code for student ${student.id}:`, error);
        }
      }

      setQrcodeDataList(qrcodeList);
      setBatchQrcodeVisible(true);
    } catch (error) {
      console.error('Failed to generate batch QR codes:', error);
      message.error('生成批量二维码失败', error.data.message);
    } finally {
      setPrintLoading(false);
    }
  };

  // 打印二维码
  const handlePrint = useReactToPrint({
    content: () => printComponentRef.current,
    contentRef: printComponentRef,
    documentTitle: '学生二维码打印',
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        resolve();
      });
    },
    onAfterPrint: () => {
      message.success('打印任务已发送');
    }
  });

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '姓名',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: '班级',
      dataIndex: 'class',
      key: 'class',
      filters: getClassFilters(),
      filteredValue: filteredInfo.class || null,
      onFilter: (value, record) => record.class === value,
      filterIcon: filtered => (
        <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
    },
    {
      title: '餐食选择',
      dataIndex: 'current_selection',
      key: 'current_selection',
      filters: [
        { text: 'A餐', value: 'A' },
        { text: 'B餐', value: 'B' },
        { text: '未选择', value: '0' },
        { text: '未知', value: null }
      ],
      filteredValue: filteredInfo.current_selection || null,
      onFilter: (value, record) => {
        if (value === null) {
          return record.current_selection === null || record.current_selection === undefined;
        }
        return record.current_selection === value;
      },
      render: (selection) => {
        if (!selection) {
          return <Tag icon={<DashOutlined />} color="default">未知</Tag>;
        }
        if (selection == '0') {
          return <Tag icon={<ExclamationCircleOutlined />} color="warning">未选择</Tag>;
        }
        return selection === 'A' ? 
          <Tag icon={<CheckCircleOutlined />} color="success">A餐</Tag> : 
          <Tag icon={<CheckCircleOutlined />} color="processing">B餐</Tag>;
      },
      filterIcon: filtered => (
        <FilterOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
    },
    {
      title: '选餐时间',
      dataIndex: 'selection_time',
      key: 'selection_time',
      render: (date) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '钉钉ID',
      dataIndex: 'dingtalk_id',
      key: 'dingtalk_id',
      render: (id) => id || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      render: (_, record) => (
        <Space size="small">
          <Dropdown overlay={
            <Menu>
              <Menu.Item key="A" onClick={() => handleStudentMealSelect(record.id, 'A')}>
                设置A餐
              </Menu.Item>
              <Menu.Item key="B" onClick={() => handleStudentMealSelect(record.id, 'B')}>
                设置B餐
              </Menu.Item>
              <Menu.Item key="random" onClick={() => handleStudentMealSelect(record.id, 'random')}>
                随机选餐
              </Menu.Item>
            </Menu>
          }>
            <Button size="small">
              选餐 <MenuOutlined />
            </Button>
          </Dropdown>
          <Button 
            icon={<QrcodeOutlined />} 
            size="small" 
            onClick={() => showQrcodeModal(record)}
          >
            二维码
          </Button>
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => showEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该学生吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button icon={<DeleteOutlined />} size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 表格行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  // 统计选中的A餐、B餐和未选餐人数
  const getSelectionSummary = () => {
    if (selectedRowKeys.length === 0) return null;
    
    const selectedStudents = students.filter(s => selectedRowKeys.includes(s.id));
    const aCount = selectedStudents.filter(s => s.current_selection === 'A').length;
    const bCount = selectedStudents.filter(s => s.current_selection === 'B').length;
    const unselectedCount = selectedStudents.filter(s => s.current_selection === '0').length;
    
    return (
      <Alert
        message={
          <div>
            已选中 <strong>{selectedRowKeys.length}</strong> 名学生: 
            <Tag color="success" style={{ marginLeft: 8 }}>A餐: {aCount}</Tag>
            <Tag color="processing">B餐: {bCount}</Tag>
            <Tag color="warning">未选: {unselectedCount}</Tag>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  };

  // 获取当前选中餐食的信息
  const getCurrentMealInfo = () => {
    if (!currentMealId || meals.length === 0) return null;
    
    const meal = meals.find(m => m.id === currentMealId);
    if (!meal) return null;
    
    return (
      <div style={{ marginBottom: 16 }}>
        <Alert
          message={`当前餐食: ${meal.name}`}
          description={
            <div>
              <div>选餐时间: {new Date(meal.selection_start_time).toLocaleString()} 至 {new Date(meal.selection_end_time).toLocaleString()}</div>
              <div>生效时间: {new Date(meal.effective_start_date).toLocaleString()} 至 {new Date(meal.effective_end_date).toLocaleString()}</div>
            </div>
          }
          type="info"
          showIcon
        />
      </div>
    );
  };

  return (
    <PageLayout breadcrumb={[<Link key="home" to="/admin">首页</Link>, '学生管理']}>
      <div className="page-title">
        <Title level={4}>学生管理</Title>
      </div>
      
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '1000px' }}>
            <div className="meal-selection" style={{ marginBottom: 16 }}>
              <Row gutter={16} align="middle">
                <Col span={6}>
                  <Text strong>选择查看餐食:</Text>
                </Col>
                <Col span={18}>
                  <Select
                    style={{ width: '100%' }}
                    placeholder="请选择要查看的餐食"
                    value={currentMealId}
                    onChange={handleMealChange}
                    loading={loadingMeals}
                  >
                    {meals.map(meal => (
                      <Option key={meal.id} value={meal.id}>
                        {meal.name} ({new Date(meal.effective_start_date).toLocaleDateString()})
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            </div>
            
            {getCurrentMealInfo()}
            
            <div className="operation-area" style={{ marginBottom: 16 }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Space>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      onClick={showAddModal}
                    >
                      添加学生
                    </Button>
                    <Button 
                      type="primary"
                      icon={<ImportOutlined />}
                      onClick={showBatchImportModal}
                    >
                      批量导入
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={clearAllFilters}>
                      清除筛选
                    </Button>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    <Button 
                      type="primary"
                      disabled={selectedRowKeys.length === 0 || !currentMealId} 
                      onClick={showBatchSelectModal}
                    >
                      批量选餐
                    </Button>
                    <Button 
                      type="primary"
                      icon={<QrcodeOutlined />}
                      disabled={selectedRowKeys.length === 0}
                      onClick={handleBatchQrcode}
                      loading={printLoading}
                    >
                      批量生成二维码
                    </Button>
                    <Popconfirm
                      title={`确定要删除选中的 ${selectedRowKeys.length} 名学生吗？`}
                      onConfirm={handleBatchDelete}
                      okText="是"
                      cancelText="否"
                      disabled={selectedRowKeys.length === 0}
                    >
                      <Button 
                        danger
                        icon={<DeleteOutlined />}
                        disabled={selectedRowKeys.length === 0}
                      >
                        批量删除
                      </Button>
                    </Popconfirm>
                  </Space>
                </Col>
              </Row>
            </div>
            
            {getSelectionSummary()}
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <Spin spinning={loadingSelections}>
            <Table
              rowKey="id"
              rowSelection={rowSelection}
              columns={columns}
              dataSource={students}
              loading={loading}
              onChange={handleChange}
              pagination={pagination}
              scroll={{ x: 1000 }}
            />
          </Spin>
        </div>
      </Card>
      
      {/* 添加/编辑学生对话框 */}
      <Modal
        title={currentStudent ? '编辑学生' : '添加学生'}
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
            name="full_name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          
          <Form.Item
            name="class"
            label="班级"
            rules={[{ required: true, message: '请输入班级' }]}
          >
            <Input placeholder="请输入班级，例如：高一(1)班" />
          </Form.Item>
          
          <Form.Item
            name="dingtalk_id"
            label="钉钉ID"
          >
            <Input placeholder="可选，用于钉钉免登录" />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 批量导入学生对话框 */}
      <Modal
        title="批量导入学生"
        visible={batchImportVisible}
        onOk={handleBatchImport}
        onCancel={handleBatchImportCancel}
        confirmLoading={batchImportLoading}
        width={600}
        footer={
          importCompleted ? 
          [
            <Button key="close" onClick={handleBatchImportCancel}>
              关闭
            </Button>
          ] : 
          [
            <Button key="cancel" onClick={handleBatchImportCancel}>
              取消
            </Button>,
            <Button key="submit" type="primary" loading={batchImportLoading} onClick={handleBatchImport}>
              确定
            </Button>
          ]
        }
      >
        <Form
          form={batchImportForm}
          layout="vertical"
        >
          <Form.Item
            name="studentData"
            label="学生数据"
            rules={[{ required: true, message: '请输入学生数据' }]}
            extra="每行一条学生记录，姓名、班级、钉钉ID之间用空格分隔（钉钉ID可选）"
          >
            <TextArea 
              rows={10} 
              placeholder="例如：
张三 高一(1)班 zhangsan123
李四 高一(2)班
王五 高一(3)班 wangwu456"
            />
          </Form.Item>
          
          {showProgress && (
            <div style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <Text>导入进度：{importCurrent}/{importTotal}</Text>
                <div style={{ float: 'right' }}>
                  <Text type="success">成功: {importSuccess}</Text>
                  <Text type="danger" style={{ marginLeft: 8 }}>失败: {importFailed}</Text>
                </div>
              </div>
              <Progress percent={importProgress} />
            </div>
          )}
        </Form>
      </Modal>
      
      {/* 学生二维码对话框 */}
      <Modal
        title={`${currentQrcode?.studentName || '学生'}的二维码`}
        visible={qrcodeVisible}
        onCancel={() => setQrcodeVisible(false)}
        footer={[
          <Button key="close" onClick={() => setQrcodeVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {currentQrcode?.loading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <p>二维码加载中...</p>
          </div>
        ) : currentQrcode?.error ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <p>二维码数据获取失败，请重试</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            {currentQrcode?.data && (
              <QRCode 
                value={currentQrcode.data} 
                size={200}
                level="H"
                includeMargin={true}
              />
            )}
            <p style={{ marginTop: 10 }}>学生可使用此二维码在食堂窗口取餐</p>
          </div>
        )}
      </Modal>

      {/* 批量选餐对话框 */}
      <Modal
        title="批量选餐"
        visible={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        onOk={handleBatchSelect}
        confirmLoading={submitting}
      >
        <div style={{ marginBottom: 16 }}>
          <p>您已选择 <strong>{selectedRowKeys.length}</strong> 名学生进行批量操作</p>
          <Divider />
          <Form layout="vertical">
            <Form.Item label="选择餐类型">
              <Radio.Group 
                value={batchMealType} 
                onChange={(e) => setBatchMealType(e.target.value)}
              >
                <Radio.Button value="A">A餐</Radio.Button>
                <Radio.Button value="B">B餐</Radio.Button>
                <Radio.Button value="random">随机</Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Form>
        </div>
      </Modal>
      
      {/* 批量生成二维码模态框 */}
      <Modal
        title="批量生成二维码"
        visible={batchQrcodeVisible}
        onCancel={() => setBatchQrcodeVisible(false)}
        width={800}
        footer={[
          <Button 
            key="print" 
            type="primary" 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
          >
            打印
          </Button>,
          <Button 
            key="close" 
            onClick={() => setBatchQrcodeVisible(false)}
          >
            关闭
          </Button>
        ]}
      >
        <div style={{ maxHeight: '500px', overflow: 'auto' }}>
          <BatchQrcodePrint ref={printComponentRef} qrcodeDataList={qrcodeDataList} />
        </div>
      </Modal>
    </PageLayout>
  );
};

export default StudentManage;