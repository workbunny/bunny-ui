<div>
    <p>静态</p>
    <div class="bny-tab" hx-ext="bny-tab">
        <div class="bny-tab-title">
            <div class="bny-tab-item">选项一</div>
            <div class="bny-tab-item">选项二</div>
            <div class="bny-tab-item">选项三</div>
        </div>
        <div class="bny-tab-body" hx-trigger="load">
            <div>我是选项一</div>
            <div>我是选项二</div>
            <div>我是选项三</div>
        </div>
    </div>
    <br>
    <p>动态</p>
    <div class="bny-tab" selected="1" hx-ext="bny-tab">
        <div class="bny-tab-title">
            <div class="bny-tab-item" hx-get="doc/tab/demo01.html">选项一</div>
            <div class="bny-tab-item" hx-get="doc/tab/demo02.html">选项二</div>
            <div class="bny-tab-item" hx-get="doc/tab/demo03.html">选项三</div>
        </div>
        <div class="bny-tab-body" hx-trigger="load"></div>
    </div>
</div>