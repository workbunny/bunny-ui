# bny-spa 单页面应用扩展

基于 HTMX 的轻量级单页面应用（SPA）扩展。在传统服务端渲染项目上获得 SPA 体验，**服务端零改造**。

## 特性

- 无刷新导航 — 拦截链接点击，页面不刷新
- URL 同步 — 地址栏实时更新，支持浏览器前进/后退
- 滚动记忆 — 回退时恢复之前的滚动位置
- 表单处理 — GET/POST 表单自动走 SPA 导航
- head 同步 — title、keywords、description 自动更新
- 资源 diff — 页面特有 CSS/JS/Style 自动加载与卸载
- HTMX 集成 — 新内容中的 `hx-*` 属性自动生效
- 内联脚本执行 — 新页面中的 `<script>` 正常运行
- 渐进增强 — 禁用 JS 时链接照常跳转，不影响 SEO
- 错误降级 — fetch 失败时自动回退到整页跳转

## 引入

在 `bunny.js` 之后引入，按需加载：

```html
<link rel="stylesheet" href="/debug/bunny.css">
<script src="/debug/bunny.js"></script>
<link rel="stylesheet" href="./spa.css">
<script src="./spa.js"></script>
```

## 快速开始

```html
<body hx-ext="bny-spa">
    <header>固定头部（不参与交换）</header>
    <main bny-view>
        <!-- 只有这里会被交换 -->
    </main>
    <footer>固定页脚</footer>
</body>
```

- `hx-ext="bny-spa"` — 在任意祖先元素上启用扩展
- `bny-view` — 标记内容交换区域（必须，页面中至少一个）

## 嵌套视口

bny-spa 支持多个 `[bny-view]` 嵌套并存，**无需命名**，按 DOM 位置自动区分。每个视口通过"视图路径"（在视图树中的索引序列）唯一标识。

路径规则：

- 根级视口路径为 `[0]`、`[1]`…（按文档顺序，同级索引从 0 起）
- 父视口 `[0]` 内的第一个子视口路径为 `[0, 0]`，第二个为 `[0, 1]`

示例：

```html
<main bny-view>              <!-- 路径 [0] -->
  <h1>用户中心</h1>
  <nav>
    <a href="/users/123">详情</a>
    <a href="/users/123/posts">帖子</a>
  </nav>
  <section bny-view>         <!-- 路径 [0, 0] -->
    <!-- 子视口：点击上面的链接只刷新这里 -->
  </section>
</main>
```

行为说明：

- 链接点击时，自动定位**最近祖先** `[bny-view]` 作为交换目标
- 视口外的链接（如 header 中的）默认交换根视口（路径 `[0]`）
- 服务端响应按相同视图路径自动匹配对应视口；响应结构变化时回退到根视口
- 浏览器前进/后退按历史记录的视图路径精确还原对应视口，父级布局不重新加载

注意事项：

- 服务端响应应保持与当前页面相同的视图嵌套结构
- 单视口页面行为完全不变（向后兼容）

## 属性参考

| 属性 | 作用于 | 说明 |
|------|--------|------|
| `bny-view` | 任意元素 | 标记内容交换区域 |
| `bny-spa-skip` | `<a>` / `<form>` | 排除该元素，不走 SPA 导航，走普通跳转 |
| `bny-spa` | head 中的 `<link>`/`<script>`/`<style>` | 标记为页面特有资源，导航时自动 diff |

## 服务端响应模式

扩展自动适配两种响应，服务端可按需选择：

### 完整模式（零改造）

服务端照常返回完整 HTML 页面，扩展从中提取 `bny-view` 区域：

```html
<html>
<head>
    <title>用户列表</title>
    <meta name="keywords" content="用户">
</head>
<body>
    <header>导航栏</header>
    <main bny-view>
        <h1>用户列表</h1>
        <table>...</table>
    </main>
    <footer>页脚</footer>
</body>
</html>
```

### 精简模式（推荐，省带宽）

服务端检测 `X-Spa-Request: true` 请求头后，返回精简的 head + body：

```html
<html>
<head>
    <title>用户列表</title>
    <meta name="keywords" content="用户">
    <meta name="description" content="用户管理页面">
</head>
<body>
    <h1>用户列表</h1>
    <table>...</table>
</body>
</html>
```

扩展用整个 `<body>` 内容替换视口，同时同步 head 信息。

### ThinkPHP 中间件示例

```php
class SpaMiddleware
{
    public function handle($request, \Closure $next)
    {
        $response = $next($request);

        if ($request->header('X-Spa-Request') === 'true') {
            // 关闭布局渲染，只返回内容部分
            // 具体写法取决于你的模板引擎
        }

        return $response;
    }
}
```

## head 同步策略

导航时只更新变化的部分，未变化的不碰：

| head 元素 | 行为 | 用途 |
|-----------|------|------|
| `<title>` | 比较文本，不同才更新 | SEO |
| `<meta name="...">` | 按 name 做 key，比对 content，变了才更新/新增 | SEO：keywords/description/robots |
| `<meta property="og:*">` | 按 property 做 key，同上 | Open Graph：社交分享 |
| `<link rel="canonical">` | 比较 href，不同才更新/新增 | SEO：规范 URL |
| `<script type="application/ld+json">` | 全量比对，有变化才替换 | GEO：AI 搜索引擎结构化数据 |
| `<link bny-spa>` | 按 href 做 diff，新增的加，消失的删 | 页面特有 CSS |
| `<script bny-spa>` | 按 src 做 diff，新增的加并执行 | 页面特有 JS |
| `<style bny-spa>` | 按 textContent 做 diff | 页面特有内联样式 |
| 不带 `bny-spa` 的元素 | 绝不碰，全局资源安全不动 | 全局 CSS/JS |

### 页面特有资源示例

```html
<head>
    <!-- 全局资源，不需要标记，导航时不会被动 -->
    <link rel="stylesheet" href="/css/app.css">
    <script src="/js/app.js"></script>

    <!-- 页面特有资源，加 bny-spa 标记，导航离开时自动移除 -->
    <link bny-spa rel="stylesheet" href="/css/users.css">
    <script bny-spa src="/js/users.js"></script>
</head>
```

## 表单处理

GET 表单自动序列化到 URL 查询串：

```html
<form action="/users" method="get">
    <input type="text" name="keyword">
    <button type="submit">搜索</button>
</form>
<!-- 提交后导航到 /users?keyword=xxx，走 SPA -->
```

POST 表单通过 fetch 提交，支持 PRG 模式：

```html
<form action="/users/create" method="post">
    <input type="text" name="name">
    <button type="submit">创建</button>
</form>
<!-- 服务端 302 重定向到 /users，URL 自动更新 -->
```

带 `hx-get` / `hx-post` 的表单交给 HTMX 处理，不冲突。

## 链接排除

某些链接需要走普通跳转时，加 `bny-spa-skip`：

```html
<!-- 外部链接（自动排除，无需标记） -->
<a href="https://github.com">GitHub</a>

<!-- 下载链接 -->
<a href="/files/report.pdf" bny-spa-skip>下载报告</a>

<!-- 新标签页打开（自动排除） -->
<a href="/page" target="_blank">新窗口</a>
```

自动排除的链接：跨域、`mailto:`、`tel:`、`javascript:`、`#` 锚点、`target="_blank"`。

## 事件

### bny:spa:loaded

内容交换完成后触发，可监听执行页面初始化逻辑：

```javascript
document.querySelector('[bny-view]').addEventListener('bny:spa:loaded', function (e) {
    console.log('页面已加载:', e.detail.url);
    // 在这里初始化当前页面的组件
});
```

## 请求头

导航请求会携带以下 header，服务端可据此区分：

| Header | 值 | 说明 |
|--------|----|------|
| `X-Spa-Request` | `true` | bny-spa 导航请求 |
| `HX-Request` | `true` | HTMX 标准请求头 |

## 进度条

导航时顶部显示加载进度条，样式定义在 `spa.css` 中，颜色跟随主题变量 `--default`。

如需自定义：

```css
.bny-spa-progress {
    background-color: #your-color;
    height: 3px; /* 厚度 */
}
```

## 限制

- 无路由守卫 — 没有 beforeEach 钩子
- 无预加载 — 点击后才发请求，不预 fetch
- 无过渡动画 — 内容直接替换，无 fade/slide

## 适用场景

- ThinkPHP / Laravel / Django 等服务端渲染项目
- 企业内部系统、后台管理系统、CMS
- 不想前后端分离但想要 SPA 体验的项目

## 测试

启动本地服务器后访问 `/ext/spa/index.html`，测试以下场景：

1. 点击导航链接 — 页面不刷新，内容交换，URL 变更
2. 浏览器后退/前进 — 恢复页面和滚动位置
3. GET 表单 — 搜索参数序列化到 URL
4. POST 表单 — fetch 提交并交换内容
5. 内联脚本 — 新页面中的 `<script>` 正常执行
6. `bny-spa-skip` — 标记的链接走普通跳转
7. 嵌套视口 — 父级布局保持，子视口独立交换，后退精确还原
