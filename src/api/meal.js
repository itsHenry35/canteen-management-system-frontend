import request from '../utils/request';

// ------ 餐食管理 API ------

// 获取所有餐
export const getAllMeals = () => {
  return request({
    url: '/admin/meals',
    method: 'get'
  });
};

// 创建餐
export const createMeal = (data) => {
  return request({
    url: '/admin/meals',
    method: 'post',
    data
  });
};

// 获取单个餐详情
export const getMealById = (id) => {
  return request({
    url: `/admin/meals/${id}`,
    method: 'get'
  });
};

// 更新餐
export const updateMeal = (id, data) => {
  return request({
    url: `/admin/meals/${id}`,
    method: 'put',
    data
  });
};

// 删除餐
export const deleteMeal = (id) => {
  return request({
    url: `/admin/meals/${id}`,
    method: 'delete'
  });
};

// 获取餐的选餐情况
export const getMealSelections = (id) => {
  return request({
    url: `/admin/meals/${id}/selections`,
    method: 'get'
  });
};

// 获取所有餐的选餐统计
export const getAllMealSelections = () => {
  return request({
    url: '/admin/selections',
    method: 'get'
  });
};

// 批量选餐
export const batchSelectMeals = (data) => {
  return request({
    url: '/admin/selections/batch',
    method: 'post',
    data
  });
};

// 手动提醒未选餐学生
export const notifyUnselectedStudents = (meal_id) => {
  return request({
    url: '/admin/notify/unselected',
    method: 'post',
    data: { meal_id }
  });
};

// ------ 学生选餐 API ------

// 获取学生选餐信息
export const getStudentMealSelection = () => {
  return request({
    url: '/student/selection',
    method: 'get'
  });
};

// 学生选餐
export const studentSelectMeal = (data) => {
  return request({
    url: '/student/selection',
    method: 'post',
    data
  });
};