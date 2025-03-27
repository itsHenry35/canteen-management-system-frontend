import request from '../utils/request';

// 获取所有用户
export const getAllUsers = (userType) => {
  return request({
    url: '/admin/users',
    method: 'get',
    params: { role: userType }
  });
};

// 获取用户详情
export const getUserById = (id) => {
  return request({
    url: `/admin/users/${id}`,
    method: 'get'
  });
};

// 创建用户
export const createUser = (data) => {
  return request({
    url: '/admin/users',
    method: 'post',
    data
  });
};

// 更新用户
export const updateUser = (id, data) => {
  return request({
    url: `/admin/users/${id}`,
    method: 'put',
    data
  });
};

// 删除用户
export const deleteUser = (id) => {
  return request({
    url: `/admin/users/${id}`,
    method: 'delete'
  });
};