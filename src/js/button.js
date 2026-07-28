/**
 * bny-button loading 状态自动绑定
 * 监听 htmx 请求生命周期，给触发的 .bny-btn 自动添加/移除 .bny-loading 类
 * 用法：给 button 加 class="bny-btn" + bny-button-loading 属性即可启用
 *       或全局对所有 .bny-btn 启用（默认行为）
 */
(function () {
    'use strict';

    if (typeof htmx === 'undefined') return;

    /**
     * 判断元素是否启用 loading 自动绑定
     * - 显式声明 bny-button-loading 属性：启用
     * - 全局开关：document.body[data-bty-button-loading-auto] !== 'false' 时，.bny-btn 默认启用
     * @param {HTMLElement} elt
     * @returns {boolean}
     */
    function shouldShowLoading(elt) {
        if (!elt || !elt.classList || !elt.classList.contains('bny-btn')) return false;
        // 显式关闭
        if (elt.getAttribute('bny-button-loading') === 'false') return false;
        // 显式开启
        if (elt.getAttribute('bny-button-loading') !== null) return true;
        // 默认开启
        var global = document.body.getAttribute('data-bny-button-loading-auto');
        return global !== 'false';
    }

    /**
     * 标记触发元素并添加 loading 类
     * @param {Event} evt
     */
    function startLoading(evt) {
        var elt = evt.detail && evt.detail.elt;
        if (!shouldShowLoading(elt)) return;
        elt.classList.add('bny-loading');
        // disabled 对 button/input 有效；aria-disabled 补充 a 标签的语义（a 不支持 disabled 属性）
        elt.setAttribute('disabled', 'disabled');
        elt.setAttribute('aria-disabled', 'true');
    }

    /**
     * 移除 loading 类
     * @param {Event} evt
     */
    function stopLoading(evt) {
        var elt = evt.detail && evt.detail.elt;
        if (!elt) return;
        // 延迟一帧，避免视觉抖动（请求过快时 loading 闪烁）
        requestAnimationFrame(function () {
            elt.classList.remove('bny-loading');
            // 仅在 loading 期间被设置 disabled 时才移除
            if (elt.getAttribute('bny-button-loading') !== null ||
                !elt.hasAttribute('data-bny-keep-disabled')) {
                elt.removeAttribute('disabled');
                elt.removeAttribute('aria-disabled');
            }
        });
    }

    /**
     * 绑定 htmx 生命周期监听到 document.body
     * 若 body 尚未就绪（脚本在 head 中加载），延迟到 DOMContentLoaded 后绑定
     */
    function bindListeners() {
        var body = document.body;
        if (!body) return false;
        // 防止重复绑定
        if (body._bnyBtnLoadingBound) return true;
        body._bnyBtnLoadingBound = true;
        // 请求开始
        body.addEventListener('htmx:beforeRequest', startLoading);
        // 请求完成（无论成功/失败）
        body.addEventListener('htmx:afterRequest', stopLoading);
        body.addEventListener('htmx:responseError', stopLoading);
        body.addEventListener('htmx:sendError', stopLoading);
        return true;
    }

    // body 已就绪则立即绑定，否则等待 DOMContentLoaded
    if (!bindListeners()) {
        document.addEventListener('DOMContentLoaded', bindListeners);
    }
})();
