htmx.defineExtension('bny-confirm', {
    onEvent: function (name, evt) {
        if (name === "htmx:confirm") {
            if (bny.hasExtName(evt.target, 'bny-confirm')) {
                const msg = evt.target.getAttribute('hx-confirm')
                const title = evt.target.getAttribute('title') || '提示'
                const anim = evt.target.getAttribute('confirm-anim') || 'scale'
                bny.confirm(msg, {
                    title: title,
                    anim: anim,
                    yes_cb: () => {
                        evt.detail.issueRequest(true)
                    },
                })
                return false
            }
        }
        return true
    },
    // 响应转换
    transformResponse: function (text, xhr, elt) {
        if (xhr.getResponseHeader('Content-Type')
            .includes('application/json')) {
            const obj = JSON.parse(xhr.responseText)
            bny.alert(
                obj.msg,
                obj.code || 0,
                obj.anim || 'scale',
                obj.time || 3)
            return elt.innerHTML
        }
        return text
    }
})