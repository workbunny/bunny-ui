htmx.defineExtension('bny-alert', {
    onEvent: function (name, evt) {
        // 元件初始化（页面加载 / 节点交换后）时：预编译 alert-fn 内联代码并缓存到元素上，
        // 之后响应到达直接取缓存执行，避免每次重复 new Function 编译。
        // 约定与 bny-confirm 的 confirm-yes/confirm-no 一致：
        // 属性值为可执行 JS 表达式（与 hx-on 同风格），表达式中可用变量：
        //   data — 响应数据：JSON 响应为解析后的对象，否则为原始响应文本
        //   elt  — 触发元素
        if (name === 'htmx:afterProcessNode') {
            if (bny.hasExtName(evt.target, 'bny-alert')) {
                const elt = evt.target
                const code = elt.getAttribute('alert-fn')
                if (!code) {
                    elt._bnyAlertFn = null
                } else {
                    try {
                        elt._bnyAlertFn = new Function('data', 'elt', code)
                    } catch (e) {
                        console.error('[bny-alert] alert-fn 表达式解析失败:', e)
                        elt._bnyAlertFn = null
                    }
                }
            }
            return true
        }
        return true
    },
    // 响应转换
    transformResponse: function (text, xhr, elt) {

        var ct = xhr.getResponseHeader('Content-Type') || ''
        if (!ct.includes('application/json')) {
            // 非 JSON：无弹窗，响应原样交换；alert-fn 立即触发（data=原始文本）
            callAlertFn(elt, text)
            return text
        }
        // 数据请求（请求源声明了 bny-table / table-static）：JSON 缓交给下游扩展
        // （如 bny-table 转行 HTML），原样透传，不弹提示、不改写响应
        if (elt && (bny.hasExtName(elt, 'bny-table') || elt.hasAttribute('table-static'))) return text
        // 其余 JSON 视为消息提示
        var data
        try {
            data = JSON.parse(xhr.responseText)
        } catch (e) {
            callAlertFn(elt, xhr.responseText)
            return text
        }
        // 弹窗；alert-fn 在弹窗结束后触发（data=解析后的 JSON 对象）
        bny.alert(data.msg, data.code || 0, data.anim || 'scale', data.time || 3, function () {
            callAlertFn(elt, data)
        })
        return elt.innerHTML
    }
})

/**
 * 执行 alert-fn 回调（预编译缓存优先，兜底现场编译；异常兜底不影响响应流程）
 * @param {HTMLElement} elt 触发元素
 * @param {*} data 响应数据：JSON 对象或原始文本
 */
function callAlertFn(elt, data) {
    if (!elt) return
    var fn = elt._bnyAlertFn
    if (!fn) {
        var code = elt.getAttribute('alert-fn')
        if (!code) return
        try {
            fn = new Function('data', 'elt', code)
        } catch (e) {
            console.error('[bny-alert] alert-fn 表达式解析失败:', e)
            return
        }
    }
    try {
        fn(data, elt)
    } catch (e) {
        console.error('[bny-alert] alert-fn 回调执行失败:', e)
    }
}
