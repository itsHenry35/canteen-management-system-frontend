import axios from 'axios';
import { getToken, removeToken } from './auth';

// 创建axios实例
const request = axios.create({
  baseURL: '/api', // API的base_url
  timeout: 15000, // 请求超时时间
});

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data;
    
    // 根据API约定，code为200表示成功
    if (res.code === 200) {
      return res.data;
    } else {
      // 获取当前路径，判断是否在登录页面
      const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/dingtalk_auth';
      
      // 对于401错误，只有在非登录页面才自动登出
      if (res.code === 401 && !isLoginPage) {
        removeToken();
        window.location.href = '/login';
      }
      
      // 返回一个被拒绝的Promise，并带上整个响应数据
      return Promise.reject({ response: response, data: res });
    }
  },
  error => {
    console.error('Response error:', error);
    
    // 获取当前路径，判断是否在登录页面
    const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/dingtalk_auth';
    
    // 对于401错误，只有在非登录页面才自动登出
    if (error.response?.status === 401 && !isLoginPage) {
      removeToken();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default request;