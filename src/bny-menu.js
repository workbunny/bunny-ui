import htmx from "./htmx.js";


// bny-menu 菜单
(function () {

    function list(data) {
        let str = ""
        data.forEach(item => {
            const icon = item.icon ? `<i class="${item.icon}"></i>` : ""
            const child = item.children ? `<menu>${list(item.children)}</menu>` : ""
            const href = item.url ? item.url : "javascript:;"
            const title = item.title ? `<span>${item.title}</span>` : ""
            str += `<li><a href="${href}">${icon}${title}${child}</a></li>`
        });
        return str
    }

    htmx.defineExtension("bny-menu", {
        onEvent: function (name, evt) {
            if (name === "htmx:beforeSwap") {
                const swap = evt.target.getAttribute("hx-swap") || "innerHTML"
                const vertical = evt.target.getAttribute("vertical") !== null ? "vertical" : ""
                const isError = evt.detail.isError
                if (!isError) {
                    try {
                        const res = JSON.parse(evt.detail.serverResponse)
                        if (res.code === 1) {
                            const data = res.data;
                            htmx.swap(evt.detail.elt, `<menu class="bny-menu" ${vertical}>${list(data)}</menu>`, { swapStyle: swap })
                        } else {
                            htmx.swap(evt.detail.elt, `<span>加载失败${res.msg}...</span>`, { swapStyle: swap })
                        }
                    } catch (error) {
                        console.error(error)
                    }
                } else {
                    htmx.swap(evt.detail.elt, `<span>网络错误...</span>`, { swapStyle: swap })
                }
                return false
            }
        }
    })
})()