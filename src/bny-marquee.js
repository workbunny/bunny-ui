import htmx from "./htmx.js"

// 走马灯-拓展
(function () {
    htmx.defineExtension("bny-marquee", {
        onEvent: function (name, evt) {
            // console.log(name, evt)

            if (name === "htmx:beforeProcessNode") {
                if (evt.target.classList.contains("bny-marquee")) {
                    const speed = evt.target.getAttribute("speed") || 50
                    let content = htmx.find(evt.target, ".bny-marquee-content")
                    var containerWidth = content.parentNode.offsetWidth;
                    var textWidth = content.offsetWidth;
                    var duration = (textWidth + containerWidth) / Number(speed); // 假设50px/s的速度
                    content.style.animationDuration = duration + 's';
                    return false
                }
            }
        }
    })
})()