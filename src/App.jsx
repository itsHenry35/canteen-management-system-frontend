import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import routes from './routes';
import './styles/global.css';
import { WebsiteProvider } from './contexts/WebsiteContext';

const App = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <WebsiteProvider>
        <Router>
          <Routes>
            {routes.map((route, index) => (
              <Route key={index} path={route.path} element={route.element} />
            ))}
          </Routes>
        </Router>
      </WebsiteProvider>
    </ConfigProvider>
  );
};

export default App;