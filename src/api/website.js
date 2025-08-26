import request from '../utils/request';

// 获取网站信息
export const getWebsiteInfo = () => {
    return request({
        url: '/website_info',
        method: 'get'
    });
};