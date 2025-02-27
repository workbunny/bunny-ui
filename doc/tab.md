> 静态

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

> 动态

<div class="bny-tab" hx-ext="bny-tab">
    <div class="bny-tab-title">
        <div class="bny-tab-item" hx-get="doc/tab/demo01.html">选项一</div>
        <div class="bny-tab-item" selected hx-get="doc/tab/demo02.html">选项二</div>
        <div class="bny-tab-item" hx-get="doc/tab/demo03.html">选项三</div>
    </div>
    <div class="bny-tab-body"></div>
</div>

```html
<div class="bny-tab" hx-ext="bny-tab">
    <div class="bny-tab-title">
        <div class="bny-tab-item" hx-get="doc/tab/demo01.html">选项一</div>
        <div class="bny-tab-item" selected hx-get="doc/tab/demo02.html">选项二</div>
        <div class="bny-tab-item" hx-get="doc/tab/demo03.html">选项三</div>
    </div>
    <div class="bny-tab-body"></div>
</div>
```

> 单行

添加属性 `nowrap`

<div style="width: 300px;">
    <div class="bny-tab" hx-ext="bny-tab" nowrap>
        <div class="bny-tab-title">
            <div class="bny-tab-item this">
                选项一
            </div>
            <div class="bny-tab-item">
                选项二
            </div>
            <div class="bny-tab-item">
                选项三
            </div>
            <div class="bny-tab-item">
                选项四
            </div>
            <div class="bny-tab-item">
                选项五
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
</div>

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

> 添加和删除

<button class="bny-btn" hx-ext="bny-tab-add" hx-get="doc/json/tab/add.json" bny-target="#demo01">追加</button>
<button class="bny-btn" hx-ext="bny-tab-add" bny-target="#demo01"
    bny-data='{"data":{"name":"静态追加","conten":"静态数据","isDelete":true}}'>静态追加</button>
<button class="bny-btn" hx-ext="bny-tab-del" bny-target="#demo01" bny-id="2">删除指定(选项二)</button>
<button class="bny-btn" hx-ext="bny-tab-del" bny-target="#demo01" bny-id="this">删除当前</button>
<button class="bny-btn" hx-ext="bny-tab-del" bny-target="#demo01" bny-id="all">删除全部</button>
<button class="bny-btn" hx-ext="bny-tab-del" bny-target="#demo01" bny-id="other">删除其他</button>

<div style="width: 300px;">
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
</div>

```html
<button class="bny-btn" hx-ext="bny-tab-add" hx-get="doc/json/tab/add.json" bny-target="#demo01">追加</button>
<button class="bny-btn" hx-ext="bny-tab-add" bny-target="#demo01"
    bny-data='{"data":{"name":"静态追加","conten":"静态数据","isDelete":true}}'>静态追加</button>
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

`doc/json/tab/add.json`

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