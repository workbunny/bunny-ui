import htmx from "./htmx"

(function () {

    function beforeSwap(evt) {
        const target = evt.target
        const title = target.getAttribute("bny-title") || false
        const width = target.getAttribute("bny-width") || "680px"
        const height = target.getAttribute("bny-height") || "520px"
        const offset = (target.getAttribute("bny-offset") || "auto").split(",")
        let shade = target.getAttribute("bny-shade") || false
        const anim = target.getAttribute("bny-anim") || 0
        if (shade === "true") {
            shade = true
        }

        bunny.page({
            title: title,
            width: width,
            height: height,
            offset: offset.length == 2 ? offset : offset[0],
            shade: shade,
            anim: parseInt(anim),
            content: evt.detail.xhr.response
        })
        return false;
    }

    htmx.defineExtension("bny-page", {
        onEvent: function (name, evt) {
            if (name === "htmx:beforeSwap") {
                return beforeSwap(evt)
            }
        }
    })
})()