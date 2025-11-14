import htmx from "./htmx.js";
import tool from "./tool.js";

// code
(function () {
    htmx.defineExtension("bny-code", {
        onEvent: function (name, evt) {
            if (evt.target !== null && name === "htmx:beforeSwap") {
                const swap = evt.target.getAttribute("hx-swap") || "innerHTML"
                if (evt.detail.xhr.status === 200) {
                    const body = `<pre><code>${tool.escapeHTML(evt.detail.serverResponse)}</code></pre>`
                    htmx.swap(evt.target, body, { swapStyle: swap })
                } else {
                    htmx.swap(evt.target, `<span>网络错误...</span>`, { swapStyle: swap })
                }
                return false
            }
        }
    })
})()