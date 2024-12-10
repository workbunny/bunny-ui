import htmx from "./htmx"
import tool from "./tool"

// 拓展-选项卡
(function () {

    function beforeProcessNode(evt) {
        const elem = evt.target
        if (evt.target.classList.contains("bny-tab")) {
            let items = htmx.findAll(".bny-tab-item", elem)
            items.forEach((item) => {
                htmx.on(item, "click", function () {
                    const index = tool.indexOf(this)
                    const parent = this.parentNode.parentNode
                    const body = htmx.find(parent, `.bny-tab-body>div:nth-child(${index + 1})`)
                    htmx.findAll(parent, ".bny-tab-title .this").forEach(function (v) {
                        v.classList.remove("this")
                    })
                    htmx.findAll(parent, ".bny-tab-body .this").forEach(function (vv) {
                        vv.classList.remove("this")
                    })
                    htmx.addClass(this, "this")
                    htmx.addClass(body, "this")
                })
            });
            return false
        }
        return true
    }

    function afterProcessNode(evt) {
        const elem = evt.target
        if (elem.classList.contains("bny-tab-body")) {
            const num = htmx.findAll(elem.parentNode, ".bny-tab-title .bny-tab-item").length
            const then_num = htmx.findAll(elem, "div").length
            if ((num - then_num) > 0) {
                for (let i = 0; i < (num - then_num); i++) {
                    const div = document.createElement("div")
                    elem.append(div)
                }
            }
            let parent = elem.parentNode
            const selected = parent.getAttribute("selected") ?? 0
            const default_item = htmx.find(parent,
                `.bny-tab-title .bny-tab-item:nth-child(${Number(selected) + 1})`)
            default_item.click()
        }
    }

    function beforeSwap(evt) {
        const elem = evt.target
        if (elem.classList.contains("bny-tab-item")) {
            const index = tool.indexOf(elem)
            const body = htmx.find(elem.parentNode.parentNode, `.bny-tab-body>div:nth-child(${index + 1})`)
            htmx.swap(body, evt.detail.serverResponse, { swapStyle: "innerHTML" })
        }
    }

    htmx.defineExtension("bny-tab", {
        onEvent: function (name, evt) {
            // console.log(name, evt)
            if (name === "htmx:beforeProcessNode") {
                return beforeProcessNode(evt)
            }
            if (name === "htmx:afterProcessNode") {
                afterProcessNode(evt)
                return false
            }
            if (name === "htmx:beforeSwap") {
                beforeSwap(evt)
                return false
            }
        }
    })
})()