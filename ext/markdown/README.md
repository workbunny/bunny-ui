# bny-md Markdown 扩展

运行时 Markdown 渲染扩展。在浏览器中将 Markdown 文本解析为 HTML，并自动映射到 bny-ui 组件样式，**无构建步骤、无外部依赖**。

## 特性

- 运行时解析 — 纯 JS 实现，无需预编译，直接渲染 Markdown 文本
- 无构建步骤 — 引入即用，适合服务端渲染项目与静态页面
- 组件映射 — 引用块、表格、代码块、复选框自动套用 bny-ui 样式
- 双触发模式 — 元素触发（`hx-ext="bny-md"` 所在元素即容器）与响应触发（拦截 `.md` 请求）
- GFM 扩展 — 表格、任务列表、删除线、脚注、定义列表、Emoji 等
- Hack 语法 — 注释、图片标题、内联 HTML、自动链接等常用变通写法
- 插件机制 — 自定义块级 / 行内语法规则，LIFO 优先级
- XSS 防护 — 默认转义 HTML，白名单放行安全标签，黑名单拦截危险标签
- 代码高亮 — 围栏代码块通过 `bny-code` 扩展自动高亮

## 引入

在 `bunny.js` 之后引入，按需加载：

```html
<link rel="stylesheet" href="/debug/bunny.css">
<script src="/debug/bunny.js"></script>
<link rel="stylesheet" href="./markdown.css">
<script src="./markdown.js"></script>
```

## 快速开始

### 元素触发

直接在容器元素上写 `hx-ext="bny-md"`，该元素的 `textContent` 会被解析为 Markdown 并替换为渲染后的 HTML：

```html
<div hx-ext="bny-md">
# Hello

这是一段 **Markdown** 文本。
</div>
```

渲染结果：

```html
<div hx-ext="bny-md">
    <h1 id="hello">Hello</h1>
    <p>这是一段 <strong>Markdown</strong> 文本。</p>
</div>
```

> **注意**：不要把 `hx-ext="bny-md"` 写在 `<body>` / `<html>` / `<head>` 上，否则整页会被当作 Markdown 解析。
> 也不要写在带 `hx-get`/`hx-post` 等请求属性的触发器（如 `<button>`）上 —— 这类元素只作为响应触发的发起者，本身不会被解析。

### 元素级配置

在同一个标签上写 `bny-md-config` 属性（JSON 字符串）即可为该元素提供独立配置：

```html
<div hx-ext="bny-md" bny-md-config='{"breaks":true, "linkTarget":"_self"}'>
第一行
第二行
</div>
```

### 响应触发

当 HTMX 请求的 URL 以 `.md` 结尾，或响应头 `Content-Type` 包含 `text/markdown` 时，响应体会被自动解析为 HTML 再执行标准交换：

```html
<a hx-get="doc.md" hx-target="#content" hx-ext="bny-md">加载文档</a>
<div id="content"></div>
```

点击链接后，`doc.md` 的纯文本响应会被渲染为 HTML 并插入 `#content`。

### 命令式调用

不依赖 HTMX，直接调用全局 API 渲染：

```html
<div id="content"></div>
<script>
    document.getElementById('content').innerHTML =
        bny.markdown('# 标题\n\n**粗体**内容');
</script>
```

## 支持的语法

### 基本语法

参考 https://markdown.com.cn/basic-syntax/

| 语法 | Markdown | 输出 |
|------|----------|------|
| 标题 | `# H1` ~ `###### H6`，以及 `===`/`---` 下划线式 | `<h1>`-`<h6>` |
| 段落 | 空行分隔 | `<p>` |
| 换行 | 行尾两空格 或 `\` | `<br>` |
| 粗体 | `**text**` 或 `__text__` | `<strong>` |
| 斜体 | `*text*` 或 `_text_` | `<em>` |
| 引用块 | `> text`，支持嵌套 `>>` | `<blockquote class="bny-blockquote">` |
| 无序列表 | `-`/`*`/`+`，支持嵌套 | `<ul><li>` |
| 有序列表 | `1.`，支持嵌套 | `<ol><li>` |
| 内联代码 | `` `code` `` | `<code>` |
| 围栏代码块 | ` ```lang ` | `<pre hx-ext="bny-code"><code>` |
| 分隔线 | `---`/`***`/`___`（≥3 个） | `<hr>` |
| 链接 | `[text](url)` | `<a href="url">` |
| 图片 | `![alt](url)` | `<img src="url" alt="alt">` |
| 转义 | `\*` 等 | 原文字符 |
| 内联 HTML | `<span>` 等 | 受 `html` 配置控制 |

### 扩展语法

参考 https://markdown.com.cn/extended-syntax/

| 语法 | Markdown | 输出 |
|------|----------|------|
| 表格 | `\| col \| col \|` + 对齐标记 | `<table class="bny-table">` |
| 任务列表 | `- [x]` / `- [ ]` | `<input type="checkbox" disabled class="bny-checkbox">` |
| 删除线 | `~~text~~` | `<del>` |
| 自动链接 | `https://example.com` | `<a href="...">` |
| 邮箱自动链接 | `user@example.com` | `<a href="mailto:...">` |
| 标题 ID | `# Heading {#custom-id}` | `<h1 id="custom-id">` |
| 脚注 | `[^1]` 引用 + `[^1]: text` 定义 | `<sup><a href="#fn-1">1</a></sup>` + 底部 `<ol class="bny-md-footnotes">` |
| 定义列表 | `Term\n: Definition` | `<dl><dt><dd>` |
| 高亮标记 | `==text==` | `<mark>` |
| 下标 | `~text~` | `<sub>` |
| 上标 | `^text^` | `<sup>` |

### Hack 语法

参考 https://markdown.com.cn/hacks.html

| 语法 | Markdown | 输出 |
|------|----------|------|
| 注释 | `[//]: # (comment)` 或 `<!-- comment -->` | 不输出（HTML 注释 `<!-- -->`） |
| 下划线 | `<ins>text</ins>` | 通过内联 HTML 支持（需 `html: true`） |
| 文字颜色 | `<font color="red">text</font>` | 通过内联 HTML 支持（需 `html: true`） |
| 图片尺寸 | `<img src="..." width="200">` | 通过内联 HTML 支持（需 `html: true`） |
| 图片标题 | `![alt](url)\n*caption*` | `<figure><img><figcaption>` 自动识别图片后紧跟的斜体段落 |
| 新标签链接 | `<a href="..." target="_blank">` | 通过内联 HTML 支持；或 `linkTarget` 配置 |
| 表格内换行 | `<br>` | 通过内联 HTML 支持 |
| Emoji 短码 | `:warning:` `:memo:` `:bulb:` | 解析为 Unicode emoji 字符 |

## 配置项

支持两种配置方式：

1. **元素级配置** — 通过 `bny-md-config` 属性传入 JSON，仅作用于当前元素
2. **命令式配置** — 通过 `bny.markdown(text, options)` 的 `options` 参数

### 配置项一览

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `html` | boolean | `false` | 是否允许内联 HTML 输出 |
| `linkTarget` | string | `'_blank'` | 链接 `target` 属性，如 `'_self'`/`'_blank'` |
| `breaks` | boolean | `false` | 单个换行是否转为 `<br>`（GFM 风格） |
| `headerIds` | boolean | `true` | 是否为标题自动生成 `id`（用于锚点） |
| `emoji` | boolean | `true` | 是否解析 `:shortcode:` 形式的 Emoji |

### html

控制是否保留 Markdown 源文本中的内联 HTML 标签。默认 `false`（安全模式），所有 HTML 特殊字符被转义为文本。

```html
<!-- 关闭内联 HTML（默认） -->
<div hx-ext="bny-md">
<ins>下划线</ins>
</div>
<!-- 输出：<p>&lt;ins&gt;下划线&lt;/ins&gt;</p> -->

<!-- 开启内联 HTML -->
<div hx-ext="bny-md" bny-md-config='{"html": true}'>
<ins>下划线</ins>
</div>
<!-- 输出：<p><ins>下划线</ins></p> -->
```

### linkTarget

为所有 Markdown 链接设置 `target` 属性，避免在每个链接上重复书写：

```javascript
bny.markdown('[官网](https://example.com)', { linkTarget: '_self' });
// 输出：<a href="https://example.com" target="_self">官网</a>
```

### breaks

开启后，单个换行符（非空行分隔）也会被渲染为 `<br>`，适合聊天、评论等场景：

```javascript
bny.markdown('第一行\n第二行', { breaks: true });
// 输出：<p>第一行<br>第二行</p>
```

### headerIds

开启后，标题自动生成 `id`（基于文本内容），方便锚点跳转。也可通过 `{#custom-id}` 自定义：

```javascript
bny.markdown('## 标题', { headerIds: true });
// 输出：<h2 id="标题">标题</h2>

bny.markdown('## 标题 {#my-id}', { headerIds: true });
// 输出：<h2 id="my-id">标题</h2>
```

### emoji

开启后，`:shortcode:` 形式的短码会被解析为 Unicode Emoji 字符：

```javascript
bny.markdown(':warning: 注意', { emoji: true });
// 输出：<p>⚠️ 注意</p>
```

### 元素级配置示例

通过 `bny-md-config` 属性为单个元素提供独立配置（JSON 字符串）：

```html
<div hx-ext="bny-md" bny-md-config='{"html": true, "breaks": true, "linkTarget": "_self"}'>
# 评论列表

第一行<br>第二行
<ins>下划线文本</ins>
</div>
```

## bny-ui 组件映射

以下 Markdown 元素渲染时会附加 bny-ui 类名，自动获得对应样式，无需额外引入样式表：

| Markdown 元素 | 映射输出 | 样式来源 |
|---------------|----------|----------|
| 引用块 `>` | `<blockquote class="bny-blockquote">` | `subsidiary.css` |
| 表格 | `<table class="bny-table">` | `table.css` |
| 围栏代码块 | `<pre hx-ext="bny-code"><code>` | `code.js`（自动高亮） |
| 任务列表 checkbox | `<input type="checkbox" disabled class="bny-checkbox">` | `form.css` |

> 注：内联代码输出为纯 `<code>`，分隔线输出为纯 `<hr>`，不附加额外类名，保持语义简洁。

围栏代码块会自动启用 `bny-code` 扩展，根据围栏语言（如 ` ```js `、` ```css `）执行语法高亮：

````markdown
```js
function hello() {
  console.log('hi');
}
```
````

## 插件开发指南

扩展提供 `bny.md` 命名空间用于注册自定义语法规则，支持块级与行内两种类型，无需修改核心解析器。

### bny.md.block(rule)

注册块级规则，按行匹配。规则对象字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 唯一名称，重复注册会覆盖同名规则 |
| `test` | RegExp \| (line) => boolean | 匹配行首的正则或函数 |
| `render(match, ctx)` | function | 生成 HTML 字符串，`match` 为正则匹配结果 |
| `multiline` | boolean | 是否消费多行（直到结束标记），默认 `false` |

```javascript
bny.md.block({
    name: 'alert',
    test: /^:::alert\s*(.*)$/,
    render: function (match, ctx) {
        return '<div class="bny-alert">' + match[1] + '</div>';
    },
    multiline: true
});
```

### bny.md.inline(rule)

注册行内规则，在文本片段中匹配。规则对象字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 唯一名称 |
| `test` | RegExp | 正则（建议带 `g` 标志） |
| `render(match)` | function | 生成 HTML 字符串 |

```javascript
bny.md.inline({
    name: 'mention',
    test: /@(\w+)/g,
    render: function (match) {
        return '<span class="bny-md-mention">@' + match[1] + '</span>';
    }
});
```

### bny.md.use(plugin)

一次性注册多个规则，适合打包成插件对象分发：

```javascript
bny.md.use({
    name: 'math',
    block: [
        { name: 'math-block', test: /^\$\$/, render: /* ... */, multiline: true }
    ],
    inline: [
        { name: 'math-inline', test: /\$(.+?)\$/g, render: /* ... */ }
    ]
});
```

### bny.md.remove(name)

取消已注册的规则（包括内置规则）：

```javascript
bny.md.remove('alert');     // 移除自定义块级规则
bny.md.remove('mention');   // 移除自定义行内规则
```

### ctx 上下文对象

块级规则的 `render` 回调会收到 `ctx` 上下文对象，提供以下能力：

| 字段 | 类型 | 说明 |
|------|------|------|
| `ctx.options` | object | 当前解析配置（`html`、`breaks` 等） |
| `ctx.inline(text)` | function | 对文本执行行内解析，供块级规则嵌套使用 |
| `ctx.escape(text)` | function | HTML 转义（复用 `bny.escapeChars`） |
| `ctx.line` | number | 当前行号 |

### 完整插件示例

#### Callout 块

实现 `:::callout` 自定义容器，支持多行内容并嵌套行内语法：

```javascript
bny.md.block({
    name: 'callout',
    test: /^:::callout\s*$/,
    multiline: true,
    render: function (match, ctx) {
        // ctx.__lines 由扩展在 multiline 模式下填充，直到 ::: 结束标记
        var body = (ctx.__lines || []).join('\n');
        return '<div class="bny-callout">' + ctx.inline(body) + '</div>';
    }
});
```

使用方式：

```markdown
:::callout
这是一段 **提示** 内容，支持行内语法。
:::
```

#### Mention 行内

将 `@用户名` 渲染为高亮标签：

```javascript
bny.md.inline({
    name: 'mention',
    test: /@(\w+)/g,
    render: function (match) {
        return '<span class="bny-md-mention">@' + match[1] + '</span>';
    }
});
```

使用方式：

```markdown
感谢 @alice 提交的 PR。
```

### LIFO 优先级

当多个规则匹配同一行/同一段文本时，**后注册的规则优先**（LIFO，后进先出）。这一机制允许通过后注册同名规则来覆盖内置规则：

```javascript
// 覆盖内置的引用块规则
bny.md.block({
    name: 'blockquote',   // 与内置规则同名
    test: /^>/,
    render: function (match, ctx) {
        return '<blockquote class="my-custom-quote">' + ctx.inline(match[0]) + '</blockquote>';
    }
});
```

## XSS 防护

### 默认安全模式

默认 `html: false`，扩展在解析前会对 Markdown 源文本中的 HTML 特殊字符进行转义（复用 `bny.escapeChars`），任何 HTML 标签都会以纯文本形式输出：

```javascript
bny.markdown('<script>alert(1)</script>');
// 输出：&lt;script&gt;alert(1)&lt;/script&gt;
```

### html: true 时的白名单与黑名单

开启 `html: true` 后，扩展会保留白名单内的安全标签原样输出，同时黑名单始终过滤危险标签与属性：

- **白名单标签**（原样保留）：`<ins>`、`<font>`、`<img>`、`<kbd>`、`<details>`、`<summary>`、`<span>`、`<br>`、`<a>` 等非危险标签
- **黑名单标签**（始终过滤）：`<script>`、`<iframe>`、`<object>`、`<embed>`、`<style>` 等
- **黑名单属性**（始终过滤）：`onerror`、`onload`、`onclick` 等所有 `on*` 事件属性，以及 `javascript:` 协议

```javascript
bny.markdown('<ins>下划线</ins><script>x()</script>', { html: true });
// 输出：<ins>下划线</ins>（script 标签被过滤）
```

### 安全建议

- 用户输入内容（评论、论坛帖子等）始终使用默认的 `html: false`
- 仅在可信内容（编辑器产出、内部文档）上开启 `html: true`
- 即便开启 `html: true`，也不要渲染未受信任的 Markdown 源
- 黑名单无法覆盖所有攻击向量，关键场景仍需配合 CSP 策略

## 全局 API

### bny.markdown(text, options)

将 Markdown 文本渲染为 HTML 字符串，不依赖 HTMX，可在任意 JS 上下文中调用。

| 参数 | 类型 | 说明 |
|------|------|------|
| `text` | string | Markdown 源文本 |
| `options` | object | 可选，覆盖默认配置（`html`、`linkTarget`、`breaks`、`headerIds`、`emoji`） |

返回值：HTML 字符串。

```javascript
var html = bny.markdown('# Title\n\n**bold**', { breaks: true });
// <h1 id="title">Title</h1>\n<p><strong>bold</strong></p>
```

### bny.md 命名空间

插件管理 API 集中在 `bny.md` 命名空间：

| 方法 | 说明 |
|------|------|
| `bny.md.block(rule)` | 注册块级规则 |
| `bny.md.inline(rule)` | 注册行内规则 |
| `bny.md.use(plugin)` | 批量注册规则（插件对象） |
| `bny.md.remove(name)` | 取消注册规则（含内置规则） |

## 测试

启动本地服务器后访问 `/ext/markdown/index.html`，测试以下场景：

1. 元素触发 — `<div hx-ext="bny-md">` 内容被渲染为 HTML
2. 响应触发 — 点击 `hx-get="*.md"` 链接，Markdown 响应被解析后插入目标
3. 命令式调用 — `bny.markdown()` 返回正确 HTML 字符串
4. 基本语法 — 标题、列表、引用、代码块等渲染正确
5. 扩展语法 — 表格、任务列表、脚注、Emoji 等渲染正确
6. 组件映射 — 引用块带 `bny-blockquote`、表格带 `bny-table`、代码块触发 `bny-code` 高亮
7. 配置项 — `bny-md-config` 与 `options` 参数均生效
8. XSS 防护 — 默认模式下 `<script>` 被转义，`html: true` 时黑名单标签被过滤
9. 插件机制 — 自定义块级/行内规则生效，`remove` 可取消注册
