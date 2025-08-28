import { whenProd } from '@craco/craco';

export const webpack = {
  configure: (webpackConfig) => {
    // 禁用sourceMaps
    webpackConfig.devtool = false;

    // 移除生成的sourcemap文件
    whenProd(() => {
      webpackConfig.output.sourceMapFilename = undefined;
    });

    return webpackConfig;
  },
};