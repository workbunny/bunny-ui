<p align="center"><img width="260px" src="https://chaz6chez.cn/images/workbunny-logo.png" alt="workbunny"></p>

**<p align="center">workbunny/bunny.ui</p>**

**<p align="center">🐇 HTMX 拓展 Web UI 组件库 🐇</p>**

# Bunny-UI

轻量级 HTMX 拓展 Web UI 组件库，通过属性构建现代用户界面，结合简单性和超文本的强大功能。

<p>
  <a href="https://github.com/workbunny/bunny-ui/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
  </a>
  <a href="https://github.com/workbunny/bunny-ui/releases">
    <img src="https://badgen.net/github/release/workbunny/bunny-ui" alt="Version">
  </a>
</p>

## 特性

- 📦 轻量级，无外部框架依赖
- 🎨 丰富的 UI 组件和动画效果
- 🚀 基于 HTMX 扩展，增强超文本功能
- 📱 响应式设计，支持多种设备
- 🎯 模块化结构，易于集成和扩展
- 🔧 简单易用的 API 接口

## 快速开始

### 安装

**直接引入**

```html
<!-- 在 HTML 头部引入 -->
<link href="./bunny.css" rel="stylesheet" />
<script src="./bunny.js"></script>
```

**从源码构建**
```bash
# 克隆项目
git clone https://github.com/workbunny/bunny.ui.git

# 安装依赖
bun install

# 构建调试版本
bun run build --debug

# 构建生产版本
bun run build
```

### 基本使用

```html
<!DOCTYPE html>
<html lang="zh-cn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quick Start - Bunny-ui</title>
    <!-- bunny-ui 核心文件 -->
    <link href="./bunny.css" rel="stylesheet" />
    <script src="./bunny.js"></script>
</head>
<body>
    <!-- 示例：显示警告框 -->
    <button class="bny-btn" onclick="bny.alert('Hello World')">点击我</button>
    
    <!-- 示例：显示确认框 -->
    <button class="bny-btn" onclick="bny.confirm('确定要执行此操作吗？')">确认操作</button>
    
    <!-- 示例：显示页面弹窗 -->
    <button class="bny-btn" onclick="bny.page('<h1>Hello</h1><p>这是一个弹窗</p>')">打开弹窗</button>
</body>
</html>
```

## 核心组件

### 基础
- **Button 按钮**：多种颜色、尺寸、样式变体
- **Tag 标签**：标记和分类
- **Icon 图标**：内置图标字体库

### 布局
- **Grid 网格**：响应式栅格布局系统
- **Card 卡片**：内容容器
- **Skeleton 骨架屏**：数据加载占位

### 导航
- **Menu 菜单**：多级导航菜单
- **Nav 导航栏**：顶部导航
- **Breadcrumb 面包屑**：页面层级路径
- **Anchor 锚点**：页面内导航
- **BackTop 回到顶部**：滚动返回顶部

### 数据展示
- **Table 表格**：HTMX 驱动的数据表格
- **Pagination 分页**：HTMX 驱动的分页
- **Tabs 标签页**：内容切换面板
- **Collapse 折叠面板**：内容展开/收起
- **Timeline 时间线**：时间轴展示
- **Steps 步骤条**：流程步骤指引
- **Empty 空状态**：无数据占位
- **Code 代码**：代码高亮展示
- **Image 图片**：图片预览（放大/缩小/重置）
- **Carousel 轮播**：HTMX 驱动的轮播图（拖拽/自动播放/fade/coverflow/丝滑滚动）
- **Avatar 头像**：用户头像

### 表单
- **Form 表单**：输入框、选择器、开关、滑块等
- **Validate 校验**：HTML5 原生 + 自定义规则验证
- **DatePicker 日期选择**：日期选择器
- **Rate 评分**：星级评分
- **Dropdown 下拉**：下拉选择菜单
- **Select 选择框**：单选/多选/树形（父子联动、半选）、远程选项、原生 select 增强

### 反馈
- **Alert 警告框**：信息提示弹窗
- **Confirm 确认框**：操作确认弹窗
- **Page 弹窗**：自定义内容弹窗
- **Tooltip 提示**：悬浮文字提示
- **Load 加载**：加载动画

## 拓展组件

- **spa**：[单页面](./ext/spa/)
- **markdown**：[Markdown](./ext/markdown/)

## 文档

- [HTMX 官方文档](https://htmx.org/)
- [Bunny-UI 文档](http://bnyui.kllxs.top/)

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目！

---

**享受使用 Bunny-UI 构建现代 Web 应用！** 🐇
