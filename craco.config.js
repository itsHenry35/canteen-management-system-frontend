const { whenProd } = require('craco');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 禁用sourceMaps
      webpackConfig.devtool = false;
      
      // 移除生成的sourcemap文件
      whenProd(() => {
        webpackConfig.output.sourceMapFilename = undefined;
      });
      
      return webpackConfig;
    },
  },
};