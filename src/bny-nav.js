import htmx from "./htmx"

// 拓展-导航栏
(function () {

    function config(evt) {
        let nav = evt.target
        
    }

    htmx.defineExtension("bny-nav", {
        onEvent: function (name, evt) {
            if (name === "htmx:afterProcessNode" &&
                evt.target.classList.contains("bny-nav")
            ) {
                config(evt)
            }
        }
    })

})()