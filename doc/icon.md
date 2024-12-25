#### 图标

图标是一个用于表示特定含义的图形元素。`icon icon-XXXX`

<style>
    .icon-list {
        display: flex;
        flex-wrap: wrap;
        box-sizing: border-box;
        align-content: center;
        align-items: center;
    }

    .icon-list .icon-item {
        box-sizing: border-box;
        width: 168px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
    }

    .icon-list .icon-item span {
        font-size: 42px;
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        -webkit-transition: font-size 0.25s linear, width 0.25s linear;
        -moz-transition: font-size 0.25s linear, width 0.25s linear;
        transition: font-size 0.25s linear, width 0.25s linear;
    }

    .icon-list .icon-item span:hover {
        font-size: 80px;
        cursor: pointer;
    }

    .icon-list .icon-item p {
        font-size: 12px;
        padding: 3px 0;
    }
</style>

<div hx-get="dist/iconfont/iconfont.json" id="icon-show" hx-trigger="load"></div>

<script>
    htmx.on("htmx:afterRequest", function (evt) {
        if (evt.target.id === "icon-show") {
            const response = JSON.parse(event.detail.xhr.responseText)
            console.log(evt)
            let content = ""
            response.glyphs.forEach(e => {
                content += `<div class="icon-item">
                            <span class="icon icon-${e.font_class}"></span>
                            <p>${e.name}</p>
                            <p>icon-${e.font_class}</p>
                            <p>&amp;#x${e.unicode};</p>
                        </div>`
            });

            evt.detail.target.innerHTML = `<div class="icon-list">${content}</div>`
        }
    })
</script>