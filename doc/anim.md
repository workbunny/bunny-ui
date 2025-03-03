动画：`class`
<style>
    .box {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .box>div {
        border: 2px solid var(--primary);
        color: var(--primary);
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--box-shadow-small);
    }

    .box>div:hover {
        cursor: pointer;
    }
</style>
<div class="row" id="anim">
    <div class="col-xs-3">
        <div class="box">
            <div>放大</div>
            <span>bny-anim-scale</span>
        </div>
    </div>
    <div class="col-xs-3">
        <div class="box">
            <div>缩小</div>
            <span>bny-anim-scalesmall</span>
        </div>
    </div>
    <div class="col-xs-3">
        <div class="box">
            <div>无限旋转</div>
            <span>bny-anim-rotate</span>
        </div>
    </div>
    <div class="col-xs-3">
        <div class="box">
            <div>左侧滑出</div>
            <span>bny-anim-left</span>
        </div>
    </div>
    <div class="col-xs-3">
        <div class="box">
            <div>右侧滑出</div>
            <span>bny-anim-right</span>
        </div>
    </div>
    <div class="col-xs-3">
        <div class="box">
            <div>顶部滑出</div>
            <span>bny-anim-up</span>
        </div>
    </div>
    <div class="col-xs-3">
        <div class="box">
            <div>底部滑出</div>
            <span>bny-anim-down</span>
        </div>
    </div>
</div>
<script>
    try {
        // 获取所有具有 'box' class 的元素
        const boxes = document.querySelectorAll('#anim .box');
        // 遍历这些元素，并为每个元素添加点击事件监听器
        boxes.forEach(box => {
            box.addEventListener('click', function (elem) {
                const div = this.querySelector("div")
                const str = this.querySelector("span").innerHTML
                div.classList.toggle(str)
                setTimeout(function () {
                    div.classList.toggle(str)
                }, 800)
            });
        });
    } catch (error) {
        console.log("不重要的信息", error)
    }
</script>