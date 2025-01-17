#### 确认框

<button class="bny-btn" hx-get="/demo" hx-trigger="confirmed"
    onclick="bunny.confirm({text:'你好',yes:()=>{htmx.trigger(this,'confirmed')}})">确认框</button>

```html
<button class="bny-btn" hx-get="/demo" hx-trigger="confirmed"
    onclick="bunny.confirm({text:'你好',yes:()=>{htmx.trigger(this,'confirmed')}})">确认框</button>
```

<button class="bny-btn" hx-get="/demo" bny-title="我的提示" bny-text="你好，兔子！" hx-ext="bny-confirm">确认框</button>

```html
<button class="bny-btn" hx-get="/demo" bny-title="我的提示" bny-text="你好，兔子！" hx-ext="bny-confirm">确认框</button>
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