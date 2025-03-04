#### 确认框

<button class="bny-btn" hx-get="/demo" hx-trigger="confirmed"
    onclick="bunny.confirm({text:'你好',yes:()=>{htmx.trigger(this,'confirmed')}})">确认框</button>

```html
<button class="bny-btn" hx-get="/demo" hx-trigger="confirmed"
    onclick="bunny.confirm({text:'你好',yes:()=>{htmx.trigger(this,'confirmed')}})">确认框</button>
```

<button class="bny-btn" hx-get="/demo" bny-title="我的提示" bny-text="你好，兔子！" hx-ext="bny-confirm">确认框</button>

```html
<!-- htmx使用方式 -->
<button class="bny-btn" hx-get="/demo" bny-title="我的提示" bny-text="你好，兔子！" hx-ext="bny-confirm">确认框</button>
```

`bunny.confirm`函数

```js
/**
* 确认框
* @param {Object} options 配置
* @param {String} options.title 标题
* @param {String} options.text 内容
* @param {Function} options.yes 确定回调
* @param {Function} options.cancel 取消回调
*/
confirm({ title = "提示", text = "", yes = () => true, cancel = () => true })
```

#### 消息框

<button class="bny-btn" onclick="bunny.msg({text:'你好',fn:(e)=>{alert('回调了')}})">消息框</button><button class="bny-btn"
    onclick="bunny.msg({text:'你好,我的样式改变了',style:'bg-success'})">style消息框</button><button class="bny-btn"
    onclick="bunny.msg({text:'你好,我的时间更久了',time:5000})">时间消息框</button>

```html
<button class="bny-btn" onclick="bunny.msg({text:'你好',fn:()=>{alert('回调了')}})">消息框</button>
<button class="bny-btn" onclick="bunny.msg({text:'你好,我的样式改变了',style:'bg-success'})">style消息框</button>
<button class="bny-btn" onclick="bunny.msg({text:'你好,我的时间更久了',time:5000})">时间消息框</button>
```

`bunny.msg`函数

```js
/**
* 消息
* @param {Object} options 配置
* @param {String} options.text 内容
* @param {String} options.style 样式
* @param {Function} options.fn 回调
* @param {Number} options.time 时间
*/
msg({ text = "消息", style = "bg-white", fn = () => { }, time = 2000 })
```

#### 警示框

<button class="bny-btn" onclick="bunny.alert({text:'这里发出一个警示！'})">警示框</button>
<button class="bny-btn" onclick="bunny.alert({text:'这里发出一个警示！(手动取消)',del:true})">警示框(手动)</button>
<button class="bny-btn" onclick="bunny.alert({text:'这里发出一个警示！(时间更久)',time:5000})">警示框(时间更久)</button>
<button class="bny-btn" onclick="bunny.alert({text:'这里发出一个警示！(样式)',style:'alert-success'})">警示框(其他样式-和警示组件一样)</button>

```html
<button class="bny-btn" onclick="bunny.alert({text:'这里发出一个警示！'})">警示框</button>
<button class="bny-btn" onclick="bunny.alert({text:'这里发出一个警示！(手动取消)',del:true})">警示框(手动)</button>
<button class="bny-btn" onclick="bunny.alert({text:'这里发出一个警示！(时间更久)',time:5000})">警示框(时间更久)</button>
<button class="bny-btn" onclick="bunny.alert({text:'这里发出一个警示！(样式)',style:'alert-success'})">警示框(其他样式-和警示组件一样)</button>
```

`bunny.alert`函数

```js
/**
* 警告框
* @param {Object} options 配置
* @param {String} options.text 内容
* @param {String} options.style 样式
* @param {Boolean} options.del 是否可关闭
* @param {Number} options.time 时间
* @returns {void}
*/
alert({ text = "警告信息！", style = "alert-primary", del = false, time = 3000 })
```

#### 页面框

<button class="bny-btn" onclick="bunny.page({content:'这里发出一个页面框！'})">页面框</button>
<button class="bny-btn"
    onclick="bunny.page({title:'这是新标题',width:'300px',height:'300px',content:'这里发出一个页面框！'})">页面框(标题、宽高)</button>
<button class="bny-btn" onclick="bunny.page({content:'https://workbunny.github.io/bunny-ui/'})">页面框(链接)</button>
<button class="bny-btn"
    onclick="bunny.page({title:false,content:'这里发出一个页面框！',height:'100%',offset:'left',shade:true,anim:1})">更多配置</button>

<button class="bny-btn" hx-ext="bny-page" hx-get="/doc/pop-up/page.html" bny-title="信息" bny-width="300px"
    bny-height="300px">htmx使用方式</button>

```html
<button class="bny-btn" onclick="bunny.page({content:'这里发出一个页面框！'})">页面框</button>
<button class="bny-btn"
    onclick="bunny.page({title:'这是新标题',width:'300px',height:'300px',content:'这里发出一个页面框！'})">页面框(标题、宽高)</button>
<button class="bny-btn" onclick="bunny.page({content:'https://workbunny.github.io/bunny-ui/'})">页面框(链接)</button>
<button class="bny-btn"
    onclick="bunny.page({title:false,content:'这里发出一个页面框！',height:'100%',offset:'left',shade:true,anim:1})">更多配置</button>
<button class="bny-btn" hx-ext="bny-page" hx-get="/doc/pop-up/page.html" bny-title="信息" bny-width="300px"
    bny-height="300px">htmx使用方式</button>
```

`bunny.page`函数

```js
/**
* 打开一个新的窗口
* @param {Object} options - 窗口配置选项
* @param {string|false} [options.title="信息"] - 窗口的标题
* @param {string} [options.content=""] - 窗口的内容，可以是文本或URL
* @param {string} [options.width="680px"] - 窗口的宽度
* @param {string} [options.height="520px"] - 窗口的高度
* @param {string|Array} [options.offset="auto"] - 窗口的位置，可选值为"auto"、"top"、"bottom"、"left"、"right" 或数组形式的位置坐标
* @param {boolean} [options.shade=false] - 是否显示遮罩层 点击遮罩层关闭窗口
* @param {number} [options.anim=0] - 窗口的动画效果，可选值为0、1、2、3、4
* @returns {void}
*/
page({ title = "信息", content = "", width = "680px", height = "520px", offset = "auto", shade = false, anim = 0 })
```