import {jwtDecode} from 'jwt-decode';

const TOKEN_KEY = 'canteen_token';
const USER_KEY = 'canteen_user';

// 保存用户Token
export const setToken = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
};

// 获取用户Token
export const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

// 移除用户Token
export const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

// 保存用户信息
export const setUser = (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// 获取用户信息
export const getUser = () => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
};

// 判断是否已登录
export const isLoggedIn = () => {
    const token = getToken();
    if (!token) {
        return false;
    }

    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        // 检查token是否过期
        if (decoded.exp < currentTime) {
            removeToken();
            return false;
        }

        return true;
    } catch (error) {
        removeToken();
        return false;
    }
};

// 获取用户角色
export const getUserRole = () => {
    const user = getUser();
    return user ? user.role : null;
};

// 检查用户是否有权限
export const hasPermission = (requiredRole) => {
    const role = getUserRole();
    return role === requiredRole;
};