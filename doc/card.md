### 静态
#### 卡片一：

<div class="bny-card" style="width: 20rem;">
    <img src="https://picsum.photos/768" alt="Card example image">
    <div class="bny-card-body">
        <h4 class="bny-card-title">欢迎光临兔子卡片！</h4>
        <h5 class="bny-card-subtitle">奈斯小标题。</h5>
        <p class="bny-card-text">注意，本例中的卡片宽度已设置为20rem，否则它将尝试填充卡片所在的当前容器/行。</p>
        <button class="bny-btn">让我去这里！</button>
    </div>
</div>
<br>

代码：

```html
<div class="bny-card" style="width: 20rem;">
    <img src="https://picsum.photos/768" alt="Card example image">
    <div class="bny-card-body">
        <h4 class="bny-card-title">欢迎光临兔子卡片！</h4>
        <h5 class="bny-card-subtitle">奈斯小标题。</h5>
        <p class="bny-card-text">注意，本例中的卡片宽度已设置为20rem，否则它将尝试填充卡片所在的当前容器/行。</p>
        <button class="bny-btn">让我去这里！</button>
    </div>
</div>
```

#### 卡片二：

<div class="bny-card" style="width: 20rem;">
    <div class="bny-card-body">
        <h4 class="bny-card-title">欢迎光临兔子卡片！</h4>
        <h5 class="bny-card-subtitle">奈斯小标题。</h5>
        <p class="bny-card-text">注意，本例中的卡片宽度已设置为20rem，否则它将尝试填充卡片所在的当前容器/行。</p>
        <button class="bny-btn">让我去这里！</button>
    </div>
    <img class="image-bottom" src="https://unsplash.it/550/250" alt="Card example image">
</div>
<br>

代码：

```html
<div class="bny-card" style="width: 20rem;">
    <div class="bny-card-body">
        <h4 class="bny-card-title">欢迎光临兔子卡片！</h4>
        <h5 class="bny-card-subtitle">奈斯小标题。</h5>
        <p class="bny-card-text">注意，本例中的卡片宽度已设置为20rem，否则它将尝试填充卡片所在的当前容器/行。</p>
        <button class="bny-btn">让我去这里！</button>
    </div>
    <img class="image-bottom" src="https://unsplash.it/550/250" alt="Card example image">
</div>
```

#### 卡片三：

<div class="bny-card" style="width: 20rem;">
    <div class="bny-card-body">
        <h4 class="bny-card-title">欢迎光临兔子卡片！</h4>
        <h5 class="bny-card-subtitle">奈斯小标题。</h5>
        <p class="bny-card-text">注意，本例中的卡片宽度已设置为20rem，否则它将尝试填充卡片所在的当前容器/行。</p>
        <a class="bny-card-link" href="#">第一link</a>
        <a class="bny-card-link" href="#">第二link</a>
    </div>
</div>
<br>

代码：

```html
<div class="bny-card" style="width: 20rem;">
    <div class="bny-card-body">
        <h4 class="bny-card-title">欢迎光临兔子卡片！</h4>
        <h5 class="bny-card-subtitle">奈斯小标题。</h5>
        <p class="bny-card-text">注意，本例中的卡片宽度已设置为20rem，否则它将尝试填充卡片所在的当前容器/行。</p>
        <a class="bny-card-link" href="#">第一link</a>
        <a class="bny-card-link" href="#">第二link</a>
    </div>
</div>
```

#### 卡片四：

<div class="bny-card" style="width: 20rem;">
    <div class="bny-card-header">
        头部
    </div>
    <div class="bny-card-body">
        <h4 class="bny-card-title">欢迎光临兔子卡片！</h4>
        <h5 class="bny-card-subtitle">奈斯小标题。</h5>
        <p class="bny-card-text">注意，本例中的卡片宽度已设置为20rem，否则它将尝试填充卡片所在的当前容器/行。</p>
        <button class="bny-btn">让我去这里！</button>
    </div>
    <div class="bny-card-footer">
        底部
    </div>
</div>
<br>

代码：

```html
<div class="bny-card" style="width: 20rem;">
    <div class="bny-card-header">
        头部
    </div>
    <div class="bny-card-body">
        <h4 class="bny-card-title">欢迎光临兔子卡片！</h4>
        <h5 class="bny-card-subtitle">奈斯小标题。</h5>
        <p class="bny-card-text">注意，本例中的卡片宽度已设置为20rem，否则它将尝试填充卡片所在的当前容器/行。</p>
        <button class="bny-btn">让我去这里！</button>
    </div>
    <div class="bny-card-footer">
        底部
    </div>
</div>
```

### 动态
#### 卡片五：

<div style="width: 20rem;" hx-get="doc/json/card/demo01.json" hx-ext="bny-card" hx-trigger="load">
    加载中
</div>
<br>

html代码：

```html
<div style="width: 20rem;" hx-get="doc/json/card/demo01.json" hx-ext="bny-card" hx-trigger="load">
    加载中
</div>
```

json代码：

```json
{
    "code": 1,
    "data": {
        "body": {
            "title": "我的远程标题",
            "subtitle":"远程小白兔",
            "text":"我的远程内容，注意格式要求哦~"
        }
    },
    "msg": "请求成功"
}
```

#### 卡片六：

<div style="width: 20rem;" hx-get="doc/json/card/demo02.json" hx-ext="bny-card" hx-trigger="load">
    加载中
</div>
<br>

html代码：

```html
<div style="width: 20rem;" hx-get="doc/json/card/demo02.json" hx-ext="bny-card" hx-trigger="load">
    加载中
</div>
```

json代码：

```json
{
    "code": 1,
    "data": {
        "header": "远程头部内容",
        "body": {
            "title": "我的远程标题",
            "subtitle": "远程小白兔",
            "text": "我的远程内容，注意格式要求哦~"
        },
        "footer": "远程底部内容"
    },
    "msg": "请求成功"
}
```

#### 卡片七：

<div style="width: 20rem;" hx-get="doc/json/card/demo03.json" hx-ext="bny-card" hx-trigger="load">
    加载中
</div>

html代码：

```html
<div style="width: 20rem;" hx-get="doc/json/card/demo03.json" hx-ext="bny-card" hx-trigger="load">
    加载中
</div>
```

json代码：

```json
{
    "code": 1,
    "data": {
        "top_img": "https://unsplash.it/550/250",
        "body": {
            "title": "我的远程标题",
            "subtitle": "远程小白兔",
            "text": "我的远程内容，注意格式要求哦~"
        }
    },
    "msg": "请求成功"
}
```