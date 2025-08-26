import {createContext, useContext, useEffect, useState} from 'react';
import {getWebsiteInfo} from '../api/website';

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

    useEffect(() => {
        const fetchWebsiteInfo = async () => {
            try {
                const data = await getWebsiteInfo();
                setWebsiteInfo({...data, loading: false});
            } catch (error) {
                console.error('获取网站信息失败:', error);
                setWebsiteInfo(prev => ({...prev, loading: false}));
            }
        };

        fetchWebsiteInfo();
    }, []);

    return (
        <WebsiteContext.Provider value={websiteInfo}>
            {children}
        </WebsiteContext.Provider>
    );
};

// 自定义hook，方便使用上下文
export const useWebsite = () => useContext(WebsiteContext);

export default WebsiteContext;