### 弹性盒子

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

#### 盒子参数

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

#### 实例：从堆叠到水平排列

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

### 流式布局容器

将最外面的布局元素 `.container` 修改为 `.container-fluid`，就可以将固定宽度的栅格布局转换为 100% 宽度的布局。

```html
<div class="container-fluid">
    <div class="row">
        ...
    </div>
</div>
```

### 移动设备和桌面屏幕

是否不希望在小屏幕设备上所有列都堆叠在一起？那就使用针对超小屏幕和中等屏幕设备所定义的类吧，即 `.col-xs-*` 和 `.col-md-*`。请看下面的实例，研究一下这些是如何工作的。

<!-- Stack the columns on mobile by making one full-width and the other half-width -->
<div class="row show-grid">
    <div class="col-xs-12 col-md-8">.col-xs-12 .col-md-8</div>
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
</div>

<!-- Columns start at 50% wide on mobile and bump up to 33.3% wide on desktop -->
<div class="row show-grid">
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
</div>

<!-- Columns are always 50% wide, on mobile and desktop -->
<div class="row show-grid">
    <div class="col-xs-6">.col-xs-6</div>
    <div class="col-xs-6">.col-xs-6</div>
</div>

```html
<!-- Stack the columns on mobile by making one full-width and the other half-width -->
<div class="row">
    <div class="col-xs-12 col-md-8">.col-xs-12 .col-md-8</div>
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
</div>

<!-- Columns start at 50% wide on mobile and bump up to 33.3% wide on desktop -->
<div class="row">
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
</div>

<!-- Columns are always 50% wide, on mobile and desktop -->
<div class="row">
    <div class="col-xs-6">.col-xs-6</div>
    <div class="col-xs-6">.col-xs-6</div>
</div>
```

### 手机、平板、桌面

在上面案例的基础上，通过使用针对平板设备的 `.col-sm-*` 类，我们来创建更加动态和强大的布局吧。

<div class="row show-grid">
    <div class="col-xs-12 col-sm-6 col-md-8">.col-xs-12 .col-sm-6 .col-md-8</div>
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
</div>
<div class="row show-grid">
    <div class="col-xs-6 col-sm-4">.col-xs-6 .col-sm-4</div>
    <div class="col-xs-6 col-sm-4">.col-xs-6 .col-sm-4</div>
    <!-- Optional: clear the XS cols if their content doesn't match in height -->
    <div class="clearfix visible-xs-block"></div>
    <div class="col-xs-6 col-sm-4">.col-xs-6 .col-sm-4</div>
</div>

```html
<div class="row">
    <div class="col-xs-12 col-sm-6 col-md-8">.col-xs-12 .col-sm-6 .col-md-8</div>
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
</div>
<div class="row">
    <div class="col-xs-6 col-sm-4">.col-xs-6 .col-sm-4</div>
    <div class="col-xs-6 col-sm-4">.col-xs-6 .col-sm-4</div>
    <!-- Optional: clear the XS cols if their content doesn't match in height -->
    <div class="clearfix visible-xs-block"></div>
    <div class="col-xs-6 col-sm-4">.col-xs-6 .col-sm-4</div>
</div>
```

### 实例：多余的列（column）将另起一行排列

如果在一个 `.row` 内包含的列（column）大于12个，包含多余列（column）的元素将作为一个整体单元被另起一行排列。

<div class="row show-grid">
    <div class="col-xs-9">.col-xs-9</div>
    <div class="col-xs-4">.col-xs-4<br>Since 9 + 4 = 13 &gt; 12, this 4-column-wide div gets wrapped onto a new line as
        one contiguous unit.</div>
    <div class="col-xs-6">.col-xs-6<br>Subsequent columns continue along the new line.</div>
</div>

```html
<div class="row">
    <div class="col-xs-9">.col-xs-9</div>
    <div class="col-xs-4">.col-xs-4<br>Since 9 + 4 = 13 &gt; 12, this 4-column-wide div gets wrapped onto a new line as
        one contiguous unit.</div>
    <div class="col-xs-6">.col-xs-6<br>Subsequent columns continue along the new line.</div>
</div>
```

### 响应式列重置

<div id="xyscz"></div>

即便有上面给出的四组栅格class，你也不免会碰到一些问题，例如，在某些阈值时，某些列可能会出现比别的列高的情况。为了克服这一问题，建议联合使用 `.clearfix` 和 [响应式工具类](#xysgjl)。

<div class="row show-grid">
    <div class="col-xs-6 col-sm-3">
        .col-xs-6 .col-sm-3
        <br>
        Resize your viewport or check it out on your phone for an example.
    </div>
    <div class="col-xs-6 col-sm-3">.col-xs-6 .col-sm-3</div>
    <!-- Add the extra clearfix for only the required viewport -->
    <div class="clearfix visible-xs-block"></div>
    <div class="col-xs-6 col-sm-3">.col-xs-6 .col-sm-3</div>
    <div class="col-xs-6 col-sm-3">.col-xs-6 .col-sm-3</div>
</div>

```html
<div class="row">
    <div class="col-xs-6 col-sm-3">.col-xs-6 .col-sm-3</div>
    <div class="col-xs-6 col-sm-3">.col-xs-6 .col-sm-3</div>

    <!-- Add the extra clearfix for only the required viewport -->
    <div class="clearfix visible-xs-block"></div>

    <div class="col-xs-6 col-sm-3">.col-xs-6 .col-sm-3</div>
    <div class="col-xs-6 col-sm-3">.col-xs-6 .col-sm-3</div>
</div>
```

除了列在分界点清除响应， 您可能需要 重置偏移、后推或前拉某个列。请看此 [栅格实例](### sgsl)。

```html
<div class="row">
    <div class="col-sm-5 col-md-6">.col-sm-5 .col-md-6</div>
    <div class="col-sm-5 col-sm-offset-2 col-md-6 col-md-offset-0">.col-sm-5 .col-sm-offset-2 .col-md-6 .col-md-offset-0
    </div>
</div>

<div class="row">
    <div class="col-sm-6 col-md-5 col-lg-6">.col-sm-6 .col-md-5 .col-lg-6</div>
    <div class="col-sm-6 col-md-5 col-md-offset-2 col-lg-6 col-lg-offset-0">.col-sm-6 .col-md-5 .col-md-offset-2
        .col-lg-6 .col-lg-offset-0</div>
</div>
```

### 清除排水沟

使用`row-no-guters`类从一行和它的列中删除排水沟。

<div class="row row-no-gutters show-grid">
    <div class="col-xs-12 col-md-8">.col-xs-12 .col-md-8</div>
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
</div>
<div class="row row-no-gutters show-grid">
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
</div>
<div class="row row-no-gutters show-grid">
    <div class="col-xs-6">.col-xs-6</div>
    <div class="col-xs-6">.col-xs-6</div>
</div>

```html
<div class="row row-no-gutters">
    <div class="col-xs-12 col-md-8">.col-xs-12 .col-md-8</div>
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
</div>
<div class="row row-no-gutters">
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
</div>
<div class="row row-no-gutters">
    <div class="col-xs-6">.col-xs-6</div>
    <div class="col-xs-6">.col-xs-6</div>
</div>
```

### 列偏移

使用 `.col-md-offset-*` 类可以将列向右侧偏移。这些类实际是通过使用 `*` 选择器为当前元素增加了左侧的边距（margin）。例如，`.col-md-offset-4` 类将 `.col-md-4`
元素向右侧偏移了4个列（column）的宽度。

<div class="row show-grid">
    <div class="col-md-4">.col-md-4</div>
    <div class="col-md-4 col-md-offset-4">.col-md-4 .col-md-offset-4</div>
</div>
<div class="row show-grid">
    <div class="col-md-3 col-md-offset-3">.col-md-3 .col-md-offset-3</div>
    <div class="col-md-3 col-md-offset-3">.col-md-3 .col-md-offset-3</div>
</div>
<div class="row show-grid">
    <div class="col-md-6 col-md-offset-3">.col-md-6 .col-md-offset-3</div>
</div>

您还可以使用 `.col-*-offset-0` 类覆盖来自较低网格层的偏移量。

```html
<div class="row">
    <div class="col-xs-6 col-sm-4">
    </div>
    <div class="col-xs-6 col-sm-4">
    </div>
    <div class="col-xs-6 col-xs-offset-3 col-sm-4 col-sm-offset-0">
    </div>
</div>
```

### 嵌套列

为了使用内置的栅格系统将内容再次嵌套，可以通过添加一个新的 `.row` 元素和一系列 `.col-sm-*` 元素到已经存在的 .col-sm-*
元素内。被嵌套的行（row）所包含的列（column）的个数不能超过12（其实，没有要求你必须占满12列）。

<div class="row show-grid">
    <div class="col-sm-9">
        Level 1: .col-sm-9
        <div class="row show-grid">
            <div class="col-xs-8 col-sm-6">
                Level 2: .col-xs-8 .col-sm-6
            </div>
            <div class="col-xs-4 col-sm-6">
                Level 2: .col-xs-4 .col-sm-6
            </div>
        </div>
    </div>
</div>

```html
<div class="row">
    <div class="col-sm-9">
        Level 1: .col-sm-9
        <div class="row">
            <div class="col-xs-8 col-sm-6">
                Level 2: .col-xs-8 .col-sm-6
            </div>
            <div class="col-xs-4 col-sm-6">
                Level 2: .col-xs-4 .col-sm-6
            </div>
        </div>
    </div>
</div>
```

### 列排序

通过使用 `.col-md-push-*` 和 `.col-md-pull-*` 类就可以很容易的改变列（column）的顺序。

<div class="row show-grid">
    <div class="col-md-9 col-md-push-3">.col-md-9 .col-md-push-3</div>
    <div class="col-md-3 col-md-pull-9">.col-md-3 .col-md-pull-9</div>
</div>

```html
<div class="row">
    <div class="col-md-9 col-md-push-3">.col-md-9 .col-md-push-3</div>
    <div class="col-md-3 col-md-pull-9">.col-md-3 .col-md-pull-9</div>
</div>
```

### 响应式工具

<div id="xysgjl"></div>

> 为了加快对移动设备友好的页面开发工作，利用媒体查询功能并使用这些工具类可以方便的针对不同设备展示或隐藏页面内容。另外还包含了针对打印机显示或隐藏内容的工具类。

有针对性的使用这类工具类，从而避免为同一个网站创建完全不同的版本。相反，通过使用这些工具类可以在不同设备上提供不同的展现形式。

#### 可用的类

通过单独或联合使用以下列出的类，可以针对不同屏幕尺寸隐藏或显示页面内容。

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
                <small>桌面 (≥992px)</small>
            </th>
            <th>
                大屏幕
                <small>桌面 (≥1200px)</small>
            </th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <th scope="row"><code>.visible-xs-*</code></th>
            <td class="is-visible">可见</td>
            <td class="is-hidden">隐藏</td>
            <td class="is-hidden">隐藏</td>
            <td class="is-hidden">隐藏</td>
        </tr>
        <tr>
            <th scope="row"><code>.visible-sm-*</code></th>
            <td class="is-hidden">隐藏</td>
            <td class="is-visible">可见</td>
            <td class="is-hidden">隐藏</td>
            <td class="is-hidden">隐藏</td>
        </tr>
        <tr>
            <th scope="row"><code>.visible-md-*</code></th>
            <td class="is-hidden">隐藏</td>
            <td class="is-hidden">隐藏</td>
            <td class="is-visible">可见</td>
            <td class="is-hidden">隐藏</td>
        </tr>
        <tr>
            <th scope="row"><code>.visible-lg-*</code></th>
            <td class="is-hidden">隐藏</td>
            <td class="is-hidden">隐藏</td>
            <td class="is-hidden">隐藏</td>
            <td class="is-visible">可见</td>
        </tr>
    </tbody>
    <tbody>
        <tr>
            <th scope="row"><code>.hidden-xs</code></th>
            <td class="is-hidden">隐藏</td>
            <td class="is-visible">可见</td>
            <td class="is-visible">可见</td>
            <td class="is-visible">可见</td>
        </tr>
        <tr>
            <th scope="row"><code>.hidden-sm</code></th>
            <td class="is-visible">可见</td>
            <td class="is-hidden">隐藏</td>
            <td class="is-visible">可见</td>
            <td class="is-visible">可见</td>
        </tr>
        <tr>
            <th scope="row"><code>.hidden-md</code></th>
            <td class="is-visible">可见</td>
            <td class="is-visible">可见</td>
            <td class="is-hidden">隐藏</td>
            <td class="is-visible">可见</td>
        </tr>
        <tr>
            <th scope="row"><code>.hidden-lg</code></th>
            <td class="is-visible">可见</td>
            <td class="is-visible">可见</td>
            <td class="is-visible">可见</td>
            <td class="is-hidden">隐藏</td>
        </tr>
    </tbody>
</table>

`.visible-*-*` 的类针对每种屏幕大小都有了三种变体，每个针对 CSS 中不同的 `display` 属性，列表如下：

<table>
    <thead>
        <tr>
            <th>类组</th>
            <th>CSS <code>display</code></th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <th scope="row"><code>.visible-*-block</code></th>
            <td><code>display: block;</code></td>
        </tr>
        <tr>
            <th scope="row"><code>.visible-*-inline</code></th>
            <td><code>display: inline;</code></td>
        </tr>
        <tr>
            <th scope="row"><code>.visible-*-inline-block</code></th>
            <td><code>display: inline-block;</code></td>
        </tr>
    </tbody>
</table>

因此，以超小屏幕（`xs`）为例，可用的 .`visible-*-*` 类是：`.visible-xs-block`、`.visible-xs-inline` 和 `.visible-xs-inline-block`。
`.visible-xs`、`.visible-sm`、`.visible-md` 和 `.visible-lg` 类也同时存在。除了 `table` 相关的元素的特殊情况外，它们与 `.visible-*-block` 大体相同。

### 栅格实例

<div id="sgsl"></div>

基本网格布局，让您熟悉在 `Bunny` 网格系统中进行构建。

#### 三个相等的列

获取三个等宽列，`从桌面开始，然后扩展到大型桌面`。在移动设备、平板电脑及更低级别上，列将自动堆叠。

<div class="row show-grid">
    <div class="col-md-4">.col-md-4</div>
    <div class="col-md-4">.col-md-4</div>
    <div class="col-md-4">.col-md-4</div>
</div>

#### 三个不等列

从桌面开始获取三列，`然后扩展到各种宽度的大型桌面`。请记住，对于单个水平块，网格列加起来应该为 12。不仅如此，无论视区如何，列都会开始堆叠。

<div class="row show-grid">
    <div class="col-md-3">.col-md-3</div>
    <div class="col-md-6">.col-md-6</div>
    <div class="col-md-3">.col-md-3</div>
</div>

#### 两列

获取两列，`从桌面开始，然后扩展到大型桌面`。

<div class="row show-grid">
    <div class="col-md-8">.col-md-8</div>
    <div class="col-md-4">.col-md-4</div>
</div>

#### 两列和两个嵌套列

根据文档，嵌套很容易 — 只需在现有列中放置一行列即可。这将为您提供两列，`从桌面开始，扩展到大型桌面`，另外两列（宽度相等）位于较大的列中。

在移动设备大小、平板电脑和以下尺寸下，这些列及其嵌套列将堆叠。

<div class="row show-grid">
    <div class="col-md-8">
        <font>.col-md-8</font>
        <div class="row show-grid">
            <div class="col-md-6">.col-md-6</div>
            <div class="col-md-6">.col-md-6</div>
        </div>
    </div>
    <div class="col-md-4">.col-md-4</div>
</div>

#### 混合：移动和桌面

网格系统有四层类：xs（手机）、sm（平板电脑）、md（台式机）和 lg（较大的台式机）。您可以使用这些类的几乎任何组合来创建更加动态和灵活的布局。

每个类层都会放大，这意味着如果您打算为 xs 和 sm 设置相同的宽度，则只需指定 xs。

<div class="row show-grid">
    <div class="col-xs-12 col-md-8">.col-xs-12 .col-md-8</div>
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
</div>
<div class="row show-grid">
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
    <div class="col-xs-6 col-md-4">.col-xs-6 .col-md-4</div>
</div>
<div class="row show-grid">
    <div class="col-xs-6">.col-xs-6</div>
    <div class="col-xs-6">.col-xs-6</div>
</div>

#### 混合：移动设备、平板电脑和台式机

<div class="row show-grid">
    <div class="col-xs-12 col-sm-6 col-lg-8">.col-xs-12 .col-sm-6 .col-lg-8</div>
    <div class="col-sm-6 col-lg-4">.col-sm-6 .col-lg-4</div>
</div>
<div class="row show-grid">
    <div class="col-xs-6 col-sm-4">.col-xs-6 .col-sm-4</div>
    <div class="col-xs-6 col-sm-4">.col-xs-6 .col-sm-4</div>
    <div class="col-xs-6 col-sm-4">.col-xs-6 .col-sm-4</div>
</div>

#### 列清除

在特定断点处[清除浮动](#xyscz)，以防止内容不均匀时出现尴尬的换行。

<div class="row show-grid">
    <div class="col-xs-6 col-sm-3">.col-xs-6 .col-sm-3 <br>
        调整视口大小或在手机上查看示例。</div>
    <div class="col-xs-6 col-sm-3">.col-xs-6 .col-sm-3</div>
    <!-- Add the extra clearfix for only the required viewport -->
    <div class="clearfix visible-xs"></div>
    <div class="col-xs-6 col-sm-3">.col-xs-6 .col-sm-3</div>
    <div class="col-xs-6 col-sm-3">.col-xs-6 .col-sm-3</div>
</div>

#### 偏移、推和拉重置

在特定断点处重置偏移、推送和拉取。

<div class="row  show-grid">
    <div class="col-sm-5 col-md-6">.col-sm-5 .col-md-6</div>
    <div class="col-sm-5 col-sm-offset-2 col-md-6 col-md-offset-0">.col-sm-5
        .col-sm-offset-2 .col-md-6 .col-md-offset-0</div>
</div>
<div class="row show-grid">
    <div class="col-sm-6 col-md-5 col-lg-6">.col-sm-6 .col-md-5 .col-lg-6</div>
    <div class="col-sm-6 col-md-5 col-md-offset-2 col-lg-6 col-lg-offset-0">
        .col-sm-6 .col-md-5 .col-md-offset-2 .col-lg-6 .col-lg-offset-0</div>
</div>
