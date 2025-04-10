### 选项卡

#### 选项卡一

<iframe src="/assets/test/tab/tab1.html" height="150"></iframe>

代码

```html
<div class="bny-tab" hx-ext="bny-tab">
    <div class="bny-tab-title">
        <div class="bny-tab-item this">选项一</div>
        <div class="bny-tab-item">选项二</div>
        <div class="bny-tab-item">选项三</div>
    </div>
    <div class="bny-tab-body">
        <div class="this">我是选项一</div>
        <div>我是选项二</div>
        <div>我是选项三</div>
    </div>
</div>
```

#### 选项卡二

<iframe src="/assets/test/tab/tab2.html" height="150"></iframe>

代码

```html
<div class="bny-tab" hx-ext="bny-tab">
    <div class="bny-tab-title">
        <div class="bny-tab-item" hx-get="/assets/test/tab/demo/demo01.html">选项一</div>
        <div class="bny-tab-item" selected hx-get="/assets/test/tab/demo/demo02.html">选项二</div>
        <div class="bny-tab-item" hx-get="/assets/test/tab/demo/demo03.html">选项三</div>
    </div>
    <div class="bny-tab-body"></div>
</div>
```

#### 选项卡三

单行

<iframe src="/assets/test/tab/tab3.html" height="150"></iframe>

代码

添加属性 `nowrap`

```html
<div class="bny-tab" hx-ext="bny-tab" nowrap>
    <div class="bny-tab-title">
        <div class="bny-tab-item this">选项一</div>
        <div class="bny-tab-item">选项二</div>
        <div class="bny-tab-item">选项三</div>
        <div class="bny-tab-item">选项四</div>
        <div class="bny-tab-item">选项五</div>
    </div>
    <div class="bny-tab-body">
        <div class="this">我是选项一</div>
        <div>我是选项二</div>
        <div>我是选项三</div>
        <div>我是选项四</div>
        <div>我是选项五</div>
    </div>
</div>
```

#### 选项卡四

<iframe src="/assets/test/tab/tab4.html" height="150"></iframe>

代码

添加和删除

```html
<button class="bny-btn" hx-ext="bny-tab-add" hx-get="/assets/test/tab/tab4-add.json" bny-target="#demo01">追加</button>
<button class="bny-btn" hx-ext="bny-tab-add" bny-target="#demo01" bny-name="静态追加" bny-conten="静态数据"
    bny-is-delete="true">静态追加</button>
<button class="bny-btn" hx-ext="bny-tab-del" bny-target="#demo01" bny-id="2">删除指定(选项二)</button>
<button class="bny-btn" hx-ext="bny-tab-del" bny-target="#demo01" bny-id="this">删除当前</button>
<button class="bny-btn" hx-ext="bny-tab-del" bny-target="#demo01" bny-id="all">删除全部</button>
<button class="bny-btn" hx-ext="bny-tab-del" bny-target="#demo01" bny-id="other">删除其他</button>

<div class="bny-tab" id="demo01" hx-ext="bny-tab" nowrap>
    <div class="bny-tab-title">
        <div class="bny-tab-item this">
            选项一
            <span class="icon icon-cuo del"></span>
        </div>
        <!-- 标记属性`bny-id` -->
        <div class="bny-tab-item" bny-id="2">
            选项二
            <!-- 有删除按钮才可能触发删除 -->
            <span class="icon icon-cuo del"></span>
        </div>
        <div class="bny-tab-item">
            选项三
            <span class="icon icon-cuo del"></span>
        </div>
        <div class="bny-tab-item">
            选项四
            <span class="icon icon-cuo del"></span>
        </div>
        <div class="bny-tab-item">
            选项五
            <span class="icon icon-cuo del"></span>
        </div>
    </div>
    <div class="bny-tab-body">
        <div class="this">我是选项一</div>
        <div>我是选项二</div>
        <div>我是选项三</div>
        <div>我是选项四</div>
        <div>我是选项五</div>
    </div>
</div>
```

json 

```json
{
    "data": {
    "id" : "11", // id 可以设置id防止重复
    "name": "add", // 名称
    "conten": "新的内容<h1>新内容</h1>", // 内容
    "isDelete": true, // 是否显示删除按钮
    "url": "" // 当url不为空时，使用url获取内容
    }
}
```
