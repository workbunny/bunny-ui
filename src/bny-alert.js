import htmx from "./htmx"

(function () {

    htmx.defineExtension("bny-alert", {
        onEvent: function (name, evt) {
            if (name === "htmx:beforeProcessNode") {
                const alert = evt.target
                let del_div = document.createElement("span")
                del_div.setAttribute("class", "alert-del")
                del_div.textContent = "X"
                alert.append(del_div)
                htmx.on(del_div, "click", function () {
                    // this.parentNode.remove()
                    this.parentNode.style.opacity = 0
                    setTimeout(() => {
                        this.parentNode.remove()
                    }, 235)
                })
            }
        }
    })
})()