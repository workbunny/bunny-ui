import htmx from "./htmx.js";
import tool from "./tool.js";

// code
(function () {
    htmx.defineExtension("bny-code", {
        onEvent: function (name, evt) {
            if (name === "htmx:beforeSwap") {
                const swap = evt.target.getAttribute("hx-swap") || "innerHTML"
                const body = `<pre class="bny-code"><code>${tool.escapeHTML(evt.detail.serverResponse)}</code></pre>`
                htmx.swap(evt.target, body, { swapStyle: swap })
                return false
            }
        }
    })
})()