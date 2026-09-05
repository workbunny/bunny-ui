htmx.defineExtension('bny-confirm', {
    onEvent: function (name, evt) {
        // 元件初始化（页面加载 / 节点交换后）时：预编译 confirm-yes / confirm-no
        // 内联代码并缓存到元素上。之后点击确认/取消直接取缓存执行，
        // 避免每次点击重复 new Function 编译；安全性不因此改变（代码源仍是属性值）。
        // 属性值要求可执行 JS 表达式（与 hx-on 同风格），表达式中可用变量 elt（触发元素）。
        if (name === 'htmx:afterProcessNode') {
            if (bny.hasExtName(evt.target, 'bny-confirm')) {
                const elt = evt.target
                const compile = (attr) => {
                    const code = elt.getAttribute(attr)
                    if (!code) {
                        elt['_bnyConfirm' + (attr === 'confirm-yes' ? 'Yes' : 'No')] = null
                        return null
                    }
                    try {
                        const fn = new Function('elt', code)
                        elt['_bnyConfirm' + (attr === 'confirm-yes' ? 'Yes' : 'No')] = fn
                        return fn
                    } catch (e) {
                        console.error('[bny-confirm] ' + attr + ' 表达式解析失败:', e)
                        return null
                    }
                }
                compile('confirm-yes')
                compile('confirm-no')
            }
            return true
        }
        if (name === "htmx:confirm") {
            if (bny.hasExtName(evt.target, 'bny-confirm')) {
                const elt = evt.target
                const msg = elt.getAttribute('hx-confirm')
                const title = elt.getAttribute('title') || '提示'
                const anim = elt.getAttribute('confirm-anim') || 'scale'
                // 取预编译缓存（afterProcessNode 已编译）；属性未变化时直接复用
                let yesFn = elt._bnyConfirmYes
                if (!yesFn) {
                    // 兜底：节点跳过 afterProcessNode（如动态写属性）时现场编译
                    const code = elt.getAttribute('confirm-yes')
                    try {
                        if (code) yesFn = new Function('elt', code)
                    } catch (e) {
                        console.error('[bny-confirm] confirm-yes 表达式解析失败:', e)
                    }
                }
                bny.confirm(msg, {
                    title: title,
                    anim: anim,
                    yes_cb: () => {
                        evt.detail.issueRequest(true)
                    },
                    no_cb: () => {
                        let cb = elt._bnyConfirmNo
                        if (!cb) {
                            const code = elt.getAttribute('confirm-no')
                            try {
                                if (code) cb = new Function('elt', code)
                            } catch (e) {
                                console.error('[bny-confirm] confirm-no 表达式解析失败:', e)
                            }
                        }
                        if (cb) cb(elt)
                    },
                })
                // 挂确认回调引用供 transformResponse 响应转换完成后触发
                if (yesFn) { elt._bnyConfirmYesPending = yesFn; }
                return false
            }
        }
        return true
    },
    // 响应转换：确认后请求完成（成功响应转换）时触发 confirm-yes 缓存回调
    transformResponse: function (text, xhr, elt) {
        if (elt && elt._bnyConfirmYesPending) {
            const cb = elt._bnyConfirmYesPending
            elt._bnyConfirmYesPending = null
            try { cb(elt) } catch (e) {
                console.error('[bny-confirm] confirm-yes 回调执行失败:', e)
            }
        }
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