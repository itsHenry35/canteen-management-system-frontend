import request from '../utils/request';
import { setToken, setUser } from '../utils/auth';

// 用户登录
export const login = async (username, password) => {
  try {
    const data = await request({
      url: '/login',
      method: 'post',
      data: { username, password }
    });
    
    // 保存token和用户信息
    if (data && data.token) {
      setToken(data.token);
      setUser(data.user);
    }
    
    return data;
  } catch (error) {
    // 不要在这里处理错误，让调用方处理它
    throw error;
  }
};

// 钉钉登录
export const dingTalkLogin = async (code) => {
  try {
    const data = await request({
      url: '/dingtalk/login',
      method: 'post',
      data: { code }
    });
    
    // 不再在这里直接设置 token 和 user，而是返回完整数据
    // 让调用方根据返回数据结构决定如何处理
    return data;
  } catch (error) {
    // 不要在这里处理错误，让调用方处理它
    throw error;
  }
};