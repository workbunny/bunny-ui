import htmx from "./htmx";

(function () {
    // 确认框扩展
    htmx.defineExtension("bny-confirm", {
        onEvent: function (name, evt) {
            if (name === "htmx:confirm") {
                const title = evt.target.getAttribute("bny-title") ?? "提示"
                const text = evt.target.getAttribute("bny-text") ?? ""
                bunny.confirm({
                    title,
                    text,
                    yes: () => {
                        evt.detail.issueRequest(true)
                        return true
                    }
                })
                return false
            }
        }
    })
})()