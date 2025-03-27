import request from '../utils/request';

// 获取所有学生
export const getAllStudents = (classId) => {
  return request({
    url: '/admin/students',
    method: 'get',
    params: { class_id: classId }
  });
};

// 获取学生详情
export const getStudentById = (id) => {
  return request({
    url: `/admin/students/${id}`,
    method: 'get'
  });
};

// 创建学生
export const createStudent = (data) => {
  return request({
    url: '/admin/students',
    method: 'post',
    data
  });
};

// 更新学生
export const updateStudent = (id, data) => {
  return request({
    url: `/admin/students/${id}`,
    method: 'put',
    data
  });
};

// 删除学生
export const deleteStudent = (id) => {
  return request({
    url: `/admin/students/${id}`,
    method: 'delete'
  });
};

// 生成学生二维码
export const getStudentQRCodeData = (id) => {
  return request({
    url: `/admin/students/${id}/qrcode-data`,
    method: 'get'
  });
};