import {createContext, useContext, useEffect, useState} from 'react';
import {getWebsiteInfo} from '../api/website';
import {message} from "antd";

// 默认值
const defaultWebsiteInfo = {
    name: '正在加载...',
    icp_beian: '',
    public_sec_beian: '',
    dingtalk_corp_id: '',
    loading: true,
};

// 创建上下文
const WebsiteContext = createContext(defaultWebsiteInfo);

// 上下文提供者组件
export const WebsiteProvider = ({children}) => {
    const [websiteInfo, setWebsiteInfo] = useState(defaultWebsiteInfo);

    const fetchWebsiteInfo = async () => {
        try {
            setWebsiteInfo(prev => ({...prev, loading: true}));
            const data = await getWebsiteInfo();
            setWebsiteInfo({...data, loading: false});
        } catch (error) {
            message.error('获取网站信息失败：' + error.message);
            setWebsiteInfo(prev => ({...prev, loading: false}));
        }
    };

    useEffect(() => {
        fetchWebsiteInfo();
    }, []);

    // 从api返回的名字更新title
    useEffect(() => {
        if (websiteInfo.name && websiteInfo.name !== '正在加载...') {
            document.title = websiteInfo.name;
        }
    }, [websiteInfo.name]);

    return (
        <WebsiteContext.Provider value={{...websiteInfo, refreshWebsiteInfo: fetchWebsiteInfo}}>
            {children}
        </WebsiteContext.Provider>
    );
};

// 自定义hook，方便使用上下文
export const useWebsite = () => useContext(WebsiteContext);

export default WebsiteContext;