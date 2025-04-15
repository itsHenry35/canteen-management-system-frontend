import request from '../utils/request';

// 获取系统设置
export const getSettings = () => {
  return request({
    url: '/admin/settings',
    method: 'get'
  });
};

// 更新系统设置
export const updateSettings = (data) => {
  return request({
    url: '/admin/settings',
    method: 'put',
    data
  });
};

// 重建家长-学生映射关系
export const rebuildParentStudentMapping = () => {
  return request({
    url: '/admin/rebuild-mapping',
    method: 'post'
  });
};

// 获取重建家长-学生映射关系的日志
export const getRebuildMappingLogs = () => {
  return request({
    url: '/admin/rebuild-mapping/logs',
    method: 'get'
  });
};