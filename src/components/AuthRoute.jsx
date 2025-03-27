import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { message } from 'antd';
import { isLoggedIn, hasPermission, getUserRole } from '../utils/auth';

const AuthRoute = ({ children, role }) => {
  useEffect(() => {
    // 检查角色是否匹配
    if (isLoggedIn() && role && !hasPermission(role)) {
      message.error('您没有访问该页面的权限');
    }
  }, [role]);

  // 如果未登录，重定向到登录页
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  // 如果指定了角色要求但用户角色不匹配，重定向到对应主页
  if (role && !hasPermission(role)) {
    const userRole = getUserRole();
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (userRole === 'student') {
      return <Navigate to="/student" replace />;
    } else if (userRole === 'canteen') {
      // 食堂阿姨使用安卓客户端，理论上不会进入网页版
      return <Navigate to="/login" replace />;
    }
  }

  // 通过验证，渲染子组件
  return children;
};

export default AuthRoute;