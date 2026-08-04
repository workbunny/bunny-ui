// 引入必要模块：fs（仅用于临时文件创建/删除）、path（内置）、vite核心方法
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

// 检测是否为debug模式
const isDebug = process.argv.some(arg => arg.includes('debug'));

// ************************ 手动配置区域（核心：在这里指定所有需要打包的JS/CSS） ************************
// 手动定义src/js下需要打包的所有JS文件路径（新增/删除文件，直接修改这个数组即可）
const jsFiles = [
  path.resolve(__dirname, 'src/js/htmx.js'),
  path.resolve(__dirname, 'src/js/bunny.js'),
  path.resolve(__dirname, 'src/js/menu.js'),
  path.resolve(__dirname, 'src/js/collapse.js'),
  path.resolve(__dirname, 'src/js/alert.js'),
  path.resolve(__dirname, 'src/js/dropdown.js'),
  path.resolve(__dirname, 'src/js/confirm.js'),
  path.resolve(__dirname, 'src/js/page.js'),
  path.resolve(__dirname, 'src/js/code.js'),
  path.resolve(__dirname, 'src/js/table.js'),
  path.resolve(__dirname, 'src/js/tab.js'),
  path.resolve(__dirname, 'src/js/nav.js'),
  path.resolve(__dirname, 'src/js/anchor.js'),
  path.resolve(__dirname, 'src/js/tip.js'),
  path.resolve(__dirname, 'src/js/datepicker.js'),
  path.resolve(__dirname, 'src/js/backtop.js'),
  path.resolve(__dirname, 'src/js/button.js'),
  path.resolve(__dirname, 'src/js/validate.js'),
  path.resolve(__dirname, 'src/js/pagination.js'),
  path.resolve(__dirname, 'src/js/image.js'),
  path.resolve(__dirname, 'src/js/rate.js'),
  // 如需新增JS文件，直接追加即可：
  // path.resolve(__dirname, 'src/js/entry3.js'),
];

// 手动定义src/css下需要打包的所有CSS文件路径（新增/删除文件，直接修改这个数组即可）
const cssFiles = [
  path.resolve(__dirname, 'src/css/base.css'),
  path.resolve(__dirname, 'src/css/color.css'),
  path.resolve(__dirname, 'src/css/anim.css'),
  path.resolve(__dirname, 'src/font/iconfont.css'),
  path.resolve(__dirname, 'src/css/menu.css'),
  path.resolve(__dirname, 'src/css/button.css'),
  path.resolve(__dirname, 'src/css/tag.css'),
  path.resolve(__dirname, 'src/css/collapse.css'),
  path.resolve(__dirname, 'src/css/alert.css'),
  path.resolve(__dirname, 'src/css/dropdown.css'),
  path.resolve(__dirname, 'src/css/confirm.css'),
  path.resolve(__dirname, 'src/css/page.css'),
  path.resolve(__dirname, 'src/css/code.css'),
  path.resolve(__dirname, 'src/css/subsidiary.css'),
  path.resolve(__dirname, 'src/css/card.css'),
  path.resolve(__dirname, 'src/css/load.css'),
  path.resolve(__dirname, 'src/css/table.css'),
  path.resolve(__dirname, 'src/css/tab.css'),
  path.resolve(__dirname, 'src/css/form.css'),
  path.resolve(__dirname, 'src/css/grid.css'),
  path.resolve(__dirname, 'src/css/nav.css'),
  path.resolve(__dirname, 'src/css/anchor.css'),
  path.resolve(__dirname, 'src/css/tip.css'),
  path.resolve(__dirname, 'src/css/skeleton.css'),
  path.resolve(__dirname, 'src/css/breadcrumb.css'),
  path.resolve(__dirname, 'src/css/avatar.css'),
  path.resolve(__dirname, 'src/css/datepicker.css'),
  path.resolve(__dirname, 'src/css/backtop.css'),
  path.resolve(__dirname, 'src/css/pagination.css'),
  path.resolve(__dirname, 'src/css/image.css'),
  path.resolve(__dirname, 'src/css/steps.css'),
  path.resolve(__dirname, 'src/css/rate.css'),
  path.resolve(__dirname, 'src/css/empty.css'),
  path.resolve(__dirname, 'src/css/timeline.css'),
  // 如需新增CSS文件，直接追加即可：
  // path.resolve(__dirname, 'src/css/style3.css'),
  path.resolve(__dirname, 'src/css/common.css'),
];
// ***************************************************************************************************

/**
 * 临时创建总入口文件（用于合并所有手动指定的JS和CSS）
 * （避免手动创建，自动生成、打包后删除）
 */
const tempEntryPath = path.resolve(__dirname, 'src/temp-bunny-entry.js');
// 生成临时入口文件内容：导入所有手动指定的JS和CSS文件
const tempEntryContent = `
  // 手动导入所有CSS文件
  ${cssFiles.map(filePath => `import '${filePath.replace(/\\/g, '/')}';`).join('\n  ')}
  
  // 手动导入所有JS文件
  ${jsFiles.map(filePath => `import '${filePath.replace(/\\/g, '/')}';`).join('\n  ')}
`.trim();
// 写入临时入口文件
fs.writeFileSync(tempEntryPath, tempEntryContent.trim());

// ************************ Vite核心配置（已修复配置冲突） ************************
export default defineConfig({
  // 核心配置：设置为相对路径基准，打包后所有资源引用改为相对路径（而非根绝对路径）
  base: './',
  // 明确声明Vite需要处理的字体文件格式，确保完整解析
  assetsInclude: ['**/*.woff2', '**/*.woff', '**/*.ttf'],
  // 构建配置
  build: {
    // 打包前清空dist目录
    emptyOutDir: true,
    // 打包输出目录
    outDir: isDebug ? 'debug' : 'dist',
    // 关闭CSS拆分，强制所有CSS合并为单个bunny.css
    cssCodeSplit: false,
    // debug模式开启sourcemap，方便调试
    sourcemap: isDebug,
    // debug模式下不压缩代码，保留console.log
    minify: isDebug ? false : 'terser',
    // terser配置，非debug模式下移除console.log
    terserOptions: isDebug ? {} : {
      compress: {
        drop_console: true
      }
    },
    // Rollup打包配置（移除冲突的manualChunks）
    rollupOptions: {
      // 过滤eval相关警告（解决htmx.js的警告）
      onwarn(warning, warn) {
        if (warning.message.includes('Use of eval')) {
          return; // 忽略eval警告，不输出到终端
        }
        warn(warning); // 其他警告正常输出
      },
      // 打包入口：仅指定自动生成的临时入口文件
      input: tempEntryPath,
      // 输出配置（移除manualChunks，解决冲突）
      output: {
        // 固定JS输出文件名：bunny.js（dist根目录）
        entryFileNames: 'bunny.js',
        // 静态资源输出配置（CSS合并为bunny.css，字体打包到assets）
        assetFileNames: (assetInfo) => {
          // 判断是否为CSS文件（使用names数组，无弃用警告）
          const isCssFile = assetInfo.names?.some(name => name.endsWith('.css'));
          if (isCssFile) {
            return 'bunny.css'; // CSS直接输出为dist/bunny.css
          }
          // 图标资源输出到dist/font，带哈希值（缓存优化）
          return 'font/[name].[hash].[ext]';
        },
        // 公共依赖合并到bunny.js，不生成额外vendor文件
        chunkFileNames: 'bunny.js',
        // 输出格式：IIFE（浏览器环境直接运行，无需模块化）
        format: 'iife'
        // 已移除：manualChunks: () => null（与iife格式冲突，多余配置）
      }
    }
  },
  // 自定义插件：打包完成后自动删除临时入口文件（清理冗余）
  plugins: [
    {
      name: 'clean-temp-bunny-entry',
      // 打包完成后的钩子（closeBundle）
      closeBundle() {
        // 判断临时文件是否存在，存在则删除
        if (fs.existsSync(tempEntryPath)) {
          try { fs.unlinkSync(tempEntryPath); } catch (e) { /* 沙箱回收站 shim 可能拦截删除，忽略 */ }
        }
      }
    }
  ]
});