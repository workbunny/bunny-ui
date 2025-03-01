> 弹性盒子用于通过一系列的行（row）与列（column）的组合来创建页面布局，你的内容就可以放入这些创建好的布局中。下面就介绍一下 bunny 栅格系统的工作原理：

- “行（row）”必须包含在 .container （固定宽度）或 .container-fluid （100% 宽度）中，以便为其赋予合适的排列（aligment）和内补（padding）。
- 通过“行（row）”在水平方向创建一组“列（column）”。
- 你的内容应当放置于“列（column）”内，并且，只有“列（column）”可以作为行（row）”的直接子元素。
- 类似 `.row` 和 `.col-xs-4` 这种预定义的类，可以用来快速创建栅格布局。Bunny 源码中定义的 mixin 也可以用来创建语义化的布局。
- 通过为“列（column）”设置 padding 属性，从而创建列与列之间的间隔（gutter）。通过为 .row 元素设置负值 margin 从而抵消掉为 .container 元素设置的
padding，也就间接为“行（row）”所包含的“列（column）”抵消掉了padding。
- 负值的 margin就是下面的示例为什么是向外突出的原因。在栅格列中的内容排成一行。
- 栅格系统中的列是通过指定1到12的值来表示其跨越的范围。例如，三个等宽的列可以使用三个 `.col-xs-4` 来创建。
- 如果一“行（row）”中包含了的“列（column）”大于 12，多余的“列（column）”所在的元素将被作为一个整体另起一行排列。
- 栅格类适用于与屏幕宽度大于或等于分界点大小的设备 ， 并且针对小屏幕设备覆盖栅格类。 因此，在元素上应用任何 .col-md-* 栅格类适用于与屏幕宽度大于或等于分界点大小的设备 ， 并且针对小屏幕设备覆盖栅格类。
因此，在元素上应用任何 .col-lg-* 不存在， 也影响大屏幕设备。

通过研究后面的实例，可以将这些原理应用到你的代码中。

### 媒体查询

在栅格系统中，我们在 Less 文件中使用以下媒体查询（media query）来创建关键的分界点阈值。

```css
/* 超小屏幕（手机，小于 768px） */
/* 没有任何媒体查询相关的代码，因为这在 Bootstrap 中是默认的（还记得 Bootstrap 是移动设备优先的吗？） */

/* 小屏幕（平板，大于等于 768px） */
@media (min-width: @screen-sm-min) { ... }

/* 中等屏幕（桌面显示器，大于等于 992px） */
@media (min-width: @screen-md-min) { ... }

/* 大屏幕（大桌面显示器，大于等于 1200px） */
@media (min-width: @screen-lg-min) { ... }
```

我们偶尔也会在媒体查询代码中包含 `max-width` 从而将 CSS 的影响限制在更小范围的屏幕大小之内。

```css
@media (max-width: @screen-xs-max) { ... }
@media (min-width: @screen-sm-min) and (max-width: @screen-sm-max) { ... }
@media (min-width: @screen-md-min) and (max-width: @screen-md-max) { ... }
@media (min-width: @screen-lg-min) { ... }
```

### 盒子参数

通过下表可以详细查看 Bunny 的栅格系统是如何在多种屏幕设备上工作的。

<table>
    <thead>
        <tr>
            <th></th>
            <th>
                超小屏幕
                <small>手机 (&lt;768px)</small>
            </th>
            <th>
                小屏幕
                <small>平板 (≥768px)</small>
            </th>
            <th>
                中等屏幕
                <small>桌面显示器 (≥992px)</small>
            </th>
            <th>
                大屏幕
                <small>大桌面显示器 (≥1200px)</small>
            </th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <th class="text-nowrap" scope="row">栅格系统行为</th>
            <td>总是水平排列</td>
            <td colspan="3">开始是堆叠在一起的，当大于这些阈值时将变为水平排列C</td>
        </tr>
        <tr>
            <th class="text-nowrap" scope="row"><code>.container</code> 最大宽度</th>
            <td>None （自动）</td>
            <td>750px</td>
            <td>970px</td>
            <td>1170px</td>
        </tr>
        <tr>
            <th class="text-nowrap" scope="row">类前缀</th>
            <td><code>.col-xs-</code></td>
            <td><code>.col-sm-</code></td>
            <td><code>.col-md-</code></td>
            <td><code>.col-lg-</code></td>
        </tr>
        <tr>
            <th class="text-nowrap" scope="row">列（column）数</th>
            <td colspan="4">12</td>
        </tr>
        <tr>
            <th class="text-nowrap" scope="row">最大列（column）宽</th>
            <td class="text-muted">自动</td>
            <td>~62px</td>
            <td>~81px</td>
            <td>~97px</td>
        </tr>
        <tr>
            <th class="text-nowrap" scope="row">槽（gutter）宽</th>
            <td colspan="4">30px （每列左右均有 15px）</td>
        </tr>
        <tr>
            <th class="text-nowrap" scope="row">可嵌套</th>
            <td colspan="4">是</td>
        </tr>
        <tr>
            <th class="text-nowrap" scope="row">偏移（Offsets）</th>
            <td colspan="4">是</td>
        </tr>
        <tr>
            <th class="text-nowrap" scope="row">列排序</th>
            <td colspan="4">是</td>
        </tr>
    </tbody>
</table>

### 实例：从堆叠到水平排列

使用单一的一组 `.col-md-*` 栅格类，就可以创建一个基本的栅格系统，在手机和平板设备上一开始是堆叠在一起的（超小屏幕到小屏幕这一范围），在桌面（中等）屏幕设备上变为水平排列。所有“列（column）必须放在 ” `.row` 内。
<style>
    .show-grid {
        margin-bottom: 15px;
    }

    .show-grid [class^="col-"] {
        padding-top: 10px;
        padding-bottom: 10px;
        background-color: var(--white);
        border: 1px solid var(--primary);
    }
</style>
<div class="row show-grid">
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
</div>
<div class="row show-grid">
    <div class="col-md-8">.col-md-8</div>
    <div class="col-md-4">.col-md-4</div>
</div>
<div class="row show-grid">
    <div class="col-md-4">.col-md-4</div>
    <div class="col-md-4">.col-md-4</div>
    <div class="col-md-4">.col-md-4</div>
</div>
<div class="row show-grid">
    <div class="col-md-6">.col-md-6</div>
    <div class="col-md-6">.col-md-6</div>
</div>

```html
<div class="row">
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
    <div class="col-md-1">.col-md-1</div>
</div>
<div class="row">
    <div class="col-md-8">.col-md-8</div>
    <div class="col-md-4">.col-md-4</div>
</div>
<div class="row">
    <div class="col-md-4">.col-md-4</div>
    <div class="col-md-4">.col-md-4</div>
    <div class="col-md-4">.col-md-4</div>
</div>
<div class="row">
    <div class="col-md-6">.col-md-6</div>
    <div class="col-md-6">.col-md-6</div>
</div>
```