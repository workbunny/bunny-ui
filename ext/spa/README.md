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
- 两种导航模式 — history（真实 URL，适配任意后端）和 hash（hash 路由，无后端也能用）

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
| `bny-view-target` | `<a>` / `<form>` | 显式指定目标视口（CSS 选择器），覆盖默认的"最近祖先视口"查找 |
| `bny-spa-skip` | `<a>` / `<form>` | 排除该元素，不走 SPA 导航，走普通跳转 |
| `bny-spa` | head 中的 `<link>`/`<script>`/`<style>` | 标记为页面特有资源，导航时自动 diff |
| `bny-spa-mode` | `<body>` 或 `<meta name="bny-spa-mode">` | 导航模式：`history`（默认）或 `hash`，详见下方"导航模式" |

### bny-view-target

默认情况下，链接点击会定位**最近祖先** `[bny-view]` 作为交换目标。当链接在视口外（如固定 header、侧边栏菜单）但需要更新某个嵌套视口时，用 `bny-view-target` 显式指定：

```html
<header>
    <!-- 链接在 header 中（视口外），但应更新右侧 #docs-view -->
    <a href="/docs/intro" bny-view-target="#docs-view">介绍</a>
</header>

<main bny-view>
    <section bny-view id="docs-view">
        <!-- 这里会被交换 -->
    </section>
</main>
```

未指定时回退到默认逻辑（最近祖先视口，视口外链接走根视口 `[0]`）。

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

## 导航模式

通过 `bny-spa-mode` 全局配置，支持两种 URL 策略。模式在 SPA 初始化时读取，全站统一。

### 配置方式

二选一（body 属性优先）：

```html
<!-- 方式一：body 属性 -->
<body hx-ext="bny-spa" bny-spa-mode="hash">

<!-- 方式二：meta 标签 -->
<meta name="bny-spa-mode" content="hash">
```

### history 模式（默认）

地址栏使用真实 URL（如 `/doc/docs.html`、`/test/base.html`）。

- 适配任意后端，刷新时后端返回对应页面即可，无需特殊配置
- 适合服务端渲染项目（ThinkPHP / Laravel / Django 等）

### hash 模式

地址栏使用 hash 路由（如 `/doc/docs.html#/test/base.html`）。

- 刷新时浏览器加载入口页（SPA 启动时的页面），通过 hash 自动导航到目标内容
- 适用于无后端的纯前端部署（如 `file://` 协议、静态托管、GitHub Pages）
- 也适用于"框架页 + 片段内容"的文档站：刷新不丢失框架布局

### hash 模式示例：文档站

框架页（如 `/doc/docs.html`）设置 hash 模式：

```html
<head>
    <meta name="bny-spa-mode" content="hash">
</head>
```

导航到 `/test/base.html` 后，地址栏为 `/doc/docs.html#/test/base.html`。刷新时浏览器加载 docs.html，配合自动导航脚本读取 hash 恢复内容：

```html
<main bny-view>
    <section bny-view id="docs-view">
        <a href="/test/base.html" id="docs-auto-nav" bny-view-target="#docs-view" style="display:none"></a>
        <script>
            function triggerAutoNav() {
                var autoNav = document.getElementById('docs-auto-nav');
                if (!autoNav) return;
                var target = '/test/base.html'; // 默认
                if (location.hash.length > 1 && location.hash.charAt(1) === '/') {
                    target = location.hash.substring(1);
                }
                autoNav.href = target;
                autoNav.click();
            }
            if (typeof bny !== 'undefined' && bny.spaReady) {
                bny.spaReady(triggerAutoNav);
            } else {
                window.addEventListener('DOMContentLoaded', triggerAutoNav);
            }
        </script>
    </section>
</main>
```

**注意**：hash 模式的入口页是 SPA 启动时的页面。如果从 A 页面（history 模式）导航到 B 页面（hash 模式），SPA 已在 A 页面初始化为 history 模式，不会切换。要全站使用 hash 模式，需在所有页面（或入口页）统一配置。

## SPA 就绪回调

`bny.spaReady(callback)` — 在 SPA 扩展初始化完成后执行回调。

- 已初始化：同步立即执行
- 未初始化：加入队列，`init()` 完成后执行

用于解决页面加载时序问题（如 `DOMContentLoaded` 早于 SPA 初始化，导致自动导航点击未被拦截）。

```javascript
bny.spaReady(function () {
    // SPA 已就绪，可以安全触发自动导航
    document.getElementById('auto-nav').click();
});
```

## 辅助 API

### bny.spaReplaceNext()

标记下一次 `navigate` 使用 `replaceState` 而非 `pushState`。用于初始自动导航：避免入口页与内容页产生两条相同的历史记录（否则点击后退会回到空入口页，再次触发自动导航，形成后退陷阱）。

```javascript
bny.spaReplaceNext();  // 标记下一次导航用 replaceState
document.getElementById('auto-nav').click();  // 触发导航
```

### bny.spaIsPopstate()

返回当前是否正在处理 `popstate`（浏览器前进/后退）。自动导航脚本据此跳过，避免回退到框架页时再次触发自动导航形成后退陷阱。

```javascript
if (bny.spaIsPopstate()) return;  // popstate 回退时跳过自动导航
```

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
8. `bny-view-target` — 视口外链接显式指定目标视口
9. `bny-spa-mode` — history 模式地址栏为真实 URL；hash 模式地址栏为 `/入口页#/内容路径`，刷新不丢失框架
