# Markdown 语法示例

> 本文件由 bny-md 扩展渲染，用于展示所支持的 Markdown 语法。每个语法区块以分隔线 `---` 划分。

---

## 1. 标题

### 1.1 ATX 风格（`#` 数量决定层级，1~6 级）

# 一级标题

## 二级标题

### 三级标题

#### 四级标题

##### 五级标题

###### 六级标题

### 1.2 Setext 风格（下划线 `===` / `---`）

一级标题（下划 `=`）
===

二级标题（下划 `-`)
---

### 1.3 自定义标题 ID `{#custom-id}`

### 一个带自定义 ID 的标题 {#my-custom-heading}

上方标题可通过 `#my-custom-heading` 进行锚点跳转。

---

## 2. 段落与换行

这是第一段，与下段之间隔一个空行。

这是第二段。

本段第一行行尾有两个空格  
因此这里会强制换行，但仍是同一段。

本段使用反斜杠 `\` 在行尾换行\
同样会强制换行到下一行。

---

## 3. 强调

- **粗体（双星号）**
- __粗体（双下划线）__
- *斜体（单星号）*
- _斜体（单下划线）_
- ***粗斜体***
- ~~删除线~~
- ==高亮文本==
- H~2~O（下标）
- X^2^（上标）
- 也可组合使用：~~**删除的粗体**~~、*==斜体高亮==*

---

## 4. 引用块

### 4.1 单层引用

> 这是一段引用内容。
> 引用内可包含多行，也可以包含 **强调**、`内联代码` 等其他语法。

### 4.2 嵌套引用

> 外层引用内容。
>
> > 内层引用内容。
> >
> > > 更内层的引用内容。

### 4.3 引用内的其他语法

> 引用中的列表：
>
> - 第一项
> - 第二项
>
> 引用中的代码：
>
> ```js
> const greeting = 'hello';
> ```

---

## 5. 列表

### 5.1 无序列表

- 苹果
- 香蕉
- 橘子

### 5.2 有序列表

1. 打开文件
2. 编辑内容
3. 保存修改

### 5.3 嵌套列表

- 前端
  - HTML
  - CSS
  - JavaScript
    - React
    - Vue
- 后端
  - Node.js
  - Go

### 5.4 任务列表

- [x] 已完成的需求分析
- [x] 已完成的设计稿
- [ ] 待开发的接口
- [ ] 待测试的功能

---

## 6. 代码

### 6.1 内联代码

在 HTML 中使用 `<button>` 标签，通过 `addEventListener('click', fn)` 绑定事件，命令行使用 `npm install` 安装依赖。

### 6.2 围栏代码块 - JavaScript

```js
// 防抖函数：在指定延迟内只执行最后一次调用
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

const handleInput = debounce((value) => {
  console.log('搜索关键词：', value);
}, 500);
```

### 6.3 围栏代码块 - CSS

```css
/* 卡片悬浮交互效果 */
.card {
  padding: 16px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

### 6.4 围栏代码块 - HTML

```html
<article class="card">
  <header class="card__header">
    <h3 class="card__title">卡片标题</h3>
  </header>
  <p class="card__body">这是卡片正文内容。</p>
  <footer class="card__footer">
    <button class="btn btn--primary" type="button">确认</button>
  </footer>
</article>
```

---

## 7. 分隔线

下面三种写法均渲染为水平分隔线：

---

***

___

---

## 8. 链接与图片

### 8.1 普通链接

- 行内链接：[Bunny-UI 文档](http://bnyui.kllxs.top/)
- 带标题的链接：[HTMX 官网](https://htmx.org/ "HTMX")
- 引用式链接：[Bunny-UI 仓库][repo]

[repo]: https://github.com/workbunny/bunny-ui "GitHub 仓库"

### 8.2 自动链接（裸 URL）

- 直接访问 https://htmx.org 即可
- 邮箱链接：<example@bunny.ui>

### 8.3 图片

![Bunny Logo](../../bunny.png "Bunny-UI Logo")

---

## 9. 表格

### 9.1 普通表格

| 组件 | 类别 | 说明 |
| --- | --- | --- |
| Button | 基础 | 按钮 |
| Table | 数据展示 | 数据表格 |
| Form | 表单 | 输入控件 |

### 9.2 对齐表格

| 左对齐 | 居中对齐 | 右对齐 |
| :--- | :---: | ---: |
| Left | Center | Right |
| 文本 A | 文本 B | 文本 C |
| 较长一些的左侧文本 | 较长一些的居中文本 | 较长一些的右侧文本 |

---

## 10. 脚注

Markdown 是一种轻量级标记语言[^1]，广泛用于撰写文档[^note-large]。

[^1]: 由 John Gruber 于 2004 年创建。

[^note-large]: 在 GitHub、Notion、Obsidian 等平台都有良好支持。

---

## 11. 定义列表

Markdown
: 一种轻量级标记语言，用于将纯文本转换为结构化 HTML。

HTMX
: 通过 HTML 属性直接访问 AJAX、CSS 过渡等现代浏览器特性。

bny-md
: Bunny-UI 的 Markdown 渲染扩展。

---

## 12. 注释

### 12.1 Markdown 注释（`[//]: #`）

[//]: # (这一行是注释，不会在渲染结果中显示)

[//]: # "双引号写法同样视为注释"

### 12.2 HTML 注释（`<!-- -->`）

<!-- 这是 HTML 注释，同样不会渲染到正文 -->

以上两段注释在渲染时均不可见。

---

## 13. Emoji

使用 `:shortcode:` 语法插入 Emoji：

- :warning: 警告
- :memo: 备忘
- :bulb: 提示
- :heart: 爱心
- :thumbsup: 点赞
- :rocket: 火箭
- :white_check_mark: 完成
- :sparkles: 闪亮

---

## 14. 转义字符

以下字符使用反斜杠 `\` 转义后，将以字面量形式显示：

- 星号：\*不是斜体\*
- 下划线：\_不是斜体\_
- 反引号：\`不是代码\`
- 井号：\#不是标题
- 连字符：\- 不是列表
- 句点：1\. 不是有序列表
- 感叹号：\! 不是图片
- 方括号：\[不是链接\]
- 圆括号：\(不是链接\)
- 反斜杠本身：\\

---

## 15. 内联 HTML

> 以下示例需要扩展开启 `html: true` 选项才会被渲染为原生 HTML。

<ins>这一段文字会被加下划线（`<ins>`）。</ins>

<font color="red">这一段文字会显示为红色（`<font color="red">`）。</font>

<kbd>Ctrl</kbd> + <kbd>S</kbd> 表示保存的快捷键。

<details>
  <summary>点击展开详情（`<details>` 折叠块）</summary>
  <p>这是被折叠的内容，展开后可见。</p>
</details>

---

## 附录：语法速查表

| 语法 | 写法 | 示例效果 |
| --- | --- | --- |
| 标题 | `# H1` ~ `###### H6` | 层级标题 |
| 粗体 | `**text**` | **粗体** |
| 斜体 | `*text*` | *斜体* |
| 删除线 | `~~text~~` | ~~删除线~~ |
| 高亮 | `==text==` | ==高亮== |
| 下标 | `~text~` | H~2~O |
| 上标 | `^text^` | X^2^ |
| 引用 | `> text` | 引用块 |
| 代码 | `` `code` `` | `code` |
| 链接 | `[text](url)` | [链接](http://bnyui.kllxs.top/) |
| 图片 | `![alt](src)` | 图片 |
| 任务 | `- [x]` / `- [ ]` | 任务列表 |
| 脚注 | `[^1]` | 脚注 |
| 分隔线 | `---` | 分隔线 |

---

**文件结束** —— 以上为 bny-md 扩展支持的全部 Markdown 语法示例。
