const { whenProd } = require('@craco/craco');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
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