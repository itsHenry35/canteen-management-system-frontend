import React, { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import AuthRoute from './components/AuthRoute';

// 使用React.lazy动态导入组件实现代码分割
const Login = lazy(() => import('./pages/Login'));
const DingTalkAuth = lazy(() => import('./pages/DingtalkAuth'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const UserManage = lazy(() => import('./pages/Admin/UserManage'));
const StudentManage = lazy(() => import('./pages/Admin/StudentManage'));
const MenuManage = lazy(() => import('./pages/Admin/MenuManage'));
const Settings = lazy(() => import('./pages/Admin/Settings'));
const StudentDashboard = lazy(() => import('./pages/Student/Dashboard'));
const MealSelect = lazy(() => import('./pages/Student/MealSelect'));

// 加载时的占位组件
const LoadingComponent = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh' 
  }}>
    加载中...
  </div>
);

// 将每个路由组件包装在Suspense中
const withSuspense = (Component) => (
  <Suspense fallback={<LoadingComponent />}>
    {Component}
  </Suspense>
);

const routes = [
  {
    path: '/login',
    element: withSuspense(<Login />),
  },
  {
    path: '/dingtalk_auth',
    element: withSuspense(<DingTalkAuth />),
  },
  {
    path: '/admin',
    element: withSuspense(<AuthRoute role="admin"><AdminDashboard /></AuthRoute>),
  },
  {
    path: '/admin/users',
    element: withSuspense(<AuthRoute role="admin"><UserManage /></AuthRoute>),
  },
  {
    path: '/admin/students',
    element: withSuspense(<AuthRoute role="admin"><StudentManage /></AuthRoute>),
  },
  {
    path: '/admin/menus',
    element: withSuspense(<AuthRoute role="admin"><MenuManage /></AuthRoute>),
  },
  {
    path: '/admin/settings',
    element: withSuspense(<AuthRoute role="admin"><Settings /></AuthRoute>),
  },
  {
    path: '/student',
    element: withSuspense(<AuthRoute role="student"><StudentDashboard /></AuthRoute>),
  },
  {
    path: '/student/meal',
    element: withSuspense(<AuthRoute role="student"><MealSelect /></AuthRoute>),
  },
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
];

export default routes;