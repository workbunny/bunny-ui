import htmx from "./htmx"

// 拓展-导航栏
(function () {
    function afterProcessNode(evt) {
        const toggle = htmx.find(".bny-nav-toggle", evt.target)
        const menu = htmx.find(".bny-nav-menu", evt.target)
        toggle.onclick = function () {
            menu.classList.toggle("show-menu")
            toggle.classList.toggle("show-icon")
        }
    }
    htmx.defineExtension("bny-nav", {
        onEvent: function (name, evt) {
            if (name === "htmx:afterProcessNode" &&
                evt.target.classList.contains("bny-nav")
            ) {
                afterProcessNode(evt)
            }
        }
    })
})()