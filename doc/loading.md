<div class="row">
    <div class="col col-4">
        <p>小</p>
        <div class="bny-loading" size="small"></div>
    </div>
    <div class="col col-4">
        <p>默认</p>
        <div class="bny-loading"></div>
    </div>
    <div class="col col-4">
        <p>大</p>
        <div class="bny-loading" size="large"></div>
    </div>
</div>

```html
<!-- 小 -->
<div class="bny-loading" size="small"></div>
<!-- 默认 -->
<div class="bny-loading"></div>
<!-- 大 -->
<div class="bny-loading" size="large"></div>
```

按钮触发弹出

<button class="bny-btn" hx-get="doc/loading/demo.html" hx-swap="beforeend" hx-target="body">弹出加载</button>

```html
<button class="bny-btn" hx-get="doc/loading/demo.html" hx-swap="beforeend" hx-target="body">弹出加载</button>

<!-- doc/loading/demo.html -->
<div class="bny-shield" id="loading">
    <div class="bny-loading"></div>
</div>
<script>
    setTimeout(function () {
        document.querySelector("#loading").remove()
    }, 3000)
</script>

```