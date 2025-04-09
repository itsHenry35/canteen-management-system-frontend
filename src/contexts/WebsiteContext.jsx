import React, { createContext, useState, useEffect, useContext } from 'react';
import { getWebsiteInfo } from '../api/website';

// 创建上下文
const WebsiteContext = createContext({
  name: '饭卡管理系统', // 默认值
  icp_beian: '',
  public_sec_beian: '',
  dingtalk_corp_id: '',
  loading: true
});

// 上下文提供者组件
export const WebsiteProvider = ({ children }) => {
  const [websiteInfo, setWebsiteInfo] = useState({
    name: '饭卡管理系统',
    icp_beian: '',
    public_sec_beian: '',
    dingtalk_corp_id: '',
    loading: true
  });

  useEffect(() => {
    const fetchWebsiteInfo = async () => {
      try {
        const data = await getWebsiteInfo();
        setWebsiteInfo({
          ...data,
          loading: false
        });
      } catch (error) {
        console.error('获取网站信息失败:', error);
        setWebsiteInfo(prev => ({
          ...prev,
          loading: false
        }));
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