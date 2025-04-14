### 加载

<iframe src="/assets/test/loading/loading.html" height="520"></iframe>

代码

```html
<!-- 小 -->
<div class="bny-loading" size="small"></div>
<!-- 默认 -->
<div class="bny-loading"></div>
<!-- 大 -->
<div class="bny-loading" size="large"></div>

<!-- 弹出加载 -->
<button class="bny-btn" hx-get="/assets/test/loading/demo.html" hx-swap="beforeend" hx-target="body">弹出加载</button>

<!-- 小 -->
<div class="bny-loader" size="small">
    <div></div>
    <div></div>
    <div></div>
    <div></div>
</div>
<!-- 默认 -->
<div class="bny-loader">
    <div></div>
    <div></div>
    <div></div>
    <div></div>
</div>
<!-- 大 -->
<div class="bny-loader" size="large">
    <div></div>
    <div></div>
    <div></div>
    <div></div>
</div>

<!-- demo.html -->
<div class="bny-shield" id="loading">
    <div class="bny-loading"></div>
</div>
<script>
    setTimeout(function () {
        document.querySelector("#loading").remove()
    }, 3000)
</script>
```
