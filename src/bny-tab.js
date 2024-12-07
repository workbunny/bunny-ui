import htmx from "./htmx"
import tool from "./tool"

// 拓展-选项卡
(function () {
    /**
     * 获取顶级标签
     * @param {object} elem 标签对象
     * @returns object|null
     */
    function getTopParent(elem) {
        let current = elem
        while (current.parentNode) {
            current = current.parentNode
            if (current.classList.contains("bny-tab")) {
                return current
            }
        }
        return null
    }
    htmx.defineExtension("bny-tab", {
        onEvent: function (name, evt) {
            const elem = evt.target
            if (name === "htmx:beforeProcessNode") {
                if (elem.classList.contains("bny-tab")) {
                    const items = htmx.findAll(".bny-tab-item", elem)
                    const tab_body = htmx.find(".bny-tab-body", elem)
                    items.forEach((item) => {
                        let div = document.createElement("div")
                        tab_body.append(div)
                        htmx.on(item, "click", function () {
                            const index = tool.indexOf(this)
                            htmx.find(elem, ".bny-tab-title .this")?.classList.remove("this")
                            htmx.find(elem, ".bny-tab-body .this")?.classList.remove("this")
                            htmx.addClass(this, "this")
                            const body = htmx.find(elem, `.bny-tab-body>div:nth-child(${index + 1})`)
                            htmx.addClass(body, "this")
                        })
                    });
                }
            }
            if (name === "htmx:afterProcessNode") {
                if (elem.classList.contains("bny-tab-body")) {
                    let parent = getTopParent(elem)
                    const selected = parent.getAttribute("selected") ?? 0
                    const default_item = htmx.find(parent,
                        `.bny-tab-title .bny-tab-item:nth-child(${Number(selected) + 1})`)
                    default_item.click()
                }
            }
            if (name === "htmx:beforeSwap") {
                if (elem.classList.contains("bny-tab-item")) {
                    const index = tool.indexOf(elem)
                    const body = htmx.find(getTopParent(elem), `.bny-tab-body>div:nth-child(${index + 1})`)
                    body.innerHTML = evt.detail.serverResponse
                    htmx.process(body)
                    return false
                }
            }
        }
    })
})()