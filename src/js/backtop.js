(function () {
    'use strict';

    var threshold = 200;       // 默认滚动阈值
    var ticking = false;       // rAF 节流标志
    var instances = [];        // 所有 backtop 实例（支持页面上多个 backtop）

    /**
     * 解析单个 backtop 按钮的配置
     * @param {HTMLElement} elt
     * @returns {{threshold:number, container:HTMLElement|Window, isWindow:boolean}}
     */
    function getConfig(elt) {
        // 阈值：data-threshold 或 data-bny-backtop 的数字值
        var t = elt.getAttribute('data-threshold') || elt.getAttribute('data-bny-backtop');
        var th = (t && !isNaN(parseInt(t, 10))) ? parseInt(t, 10) : 200;

        // 滚动容器：data-target 指定 > 自动检测 > window
        var container = window;
        var isWindow = true;
        var target = elt.getAttribute('data-target');
        if (target) {
            var el = document.querySelector(target);
            if (el && el.scrollHeight > el.clientHeight) {
                container = el;
                isWindow = false;
            }
        }
        if (isWindow) {
            // 自动检测 #bny-content 或 [data-scroll-container]
            var candidates = document.querySelectorAll('#bny-content, [data-scroll-container]');
            for (var i = 0; i < candidates.length; i++) {
                if (candidates[i].scrollHeight > candidates[i].clientHeight) {
                    container = candidates[i];
                    isWindow = false;
                    break;
                }
            }
        }
        return { threshold: th, container: container, isWindow: isWindow };
    }

    /**
     * 获取容器的当前滚动位置
     * @param {HTMLElement|Window} container
     * @param {boolean} isWindow
     * @returns {number}
     */
    function getScrollTop(container, isWindow) {
        if (isWindow) {
            return window.scrollY || document.documentElement.scrollTop || 0;
        }
        return container.scrollTop || 0;
    }

    /**
     * 滚动容器到顶部
     * @param {HTMLElement|Window} container
     * @param {boolean} isWindow
     */
    function scrollToTop(container, isWindow) {
        if (isWindow) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            container.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    /**
     * 更新单个实例的显隐状态
     * @param {Object} inst
     */
    function updateInstance(inst) {
        if (!inst.btn || !inst.btn.isConnected) return;
        var top = getScrollTop(inst.container, inst.isWindow);
        if (top > inst.threshold) {
            inst.btn.classList.add('visible');
        } else {
            inst.btn.classList.remove('visible');
        }
    }

    /**
     * rAF 节流的滚动处理：更新所有实例
     */
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            ticking = false;
            for (var i = 0; i < instances.length; i++) {
                updateInstance(instances[i]);
            }
        });
    }

    /**
     * 绑定一个 backtop 实例（已防止重复绑定）
     * @param {HTMLElement} btn
     */
    function bindInstance(btn) {
        if (!btn) return;
        if (btn._bnyBacktop) return; // 已绑定
        btn._bnyBacktop = true;

        // 补全样式
        if (!btn.classList.contains('bny-backtop')) {
            btn.classList.add('bny-backtop');
        }

        var cfg = getConfig(btn);
        var inst = {
            btn: btn,
            threshold: cfg.threshold,
            container: cfg.container,
            isWindow: cfg.isWindow
        };

        // 点击回到顶部
        btn.addEventListener('click', function () {
            scrollToTop(inst.container, inst.isWindow);
        });

        // 绑定滚动监听
        if (inst.isWindow) {
            window.addEventListener('scroll', onScroll, { passive: true });
        } else {
            cfg.container.addEventListener('scroll', onScroll, { passive: true });
        }

        instances.push(inst);
        updateInstance(inst);
    }

    /**
     * 扫描并绑定页面中所有 backtop 元素
     * - 优先复用页面已有 [data-bny-backtop] 或 #bny-backtop
     * - 若都不存在，自动创建一个默认按钮挂到 body
     * @param {HTMLElement} [root]
     */
    function scan(root) {
        // 找到所有用户自定义的 backtop 元素
        var customBtns = [];
        if (root && root.nodeType === 1) {
            if (root.id === 'bny-backtop' ||
                (root.hasAttribute && root.hasAttribute('data-bny-backtop'))) {
                customBtns.push(root);
            }
            if (root.querySelectorAll) {
                var found = root.querySelectorAll('[data-bny-backtop]');
                for (var i = 0; i < found.length; i++) customBtns.push(found[i]);
            }
        } else {
            // 全局扫描
            var all = document.querySelectorAll('[data-bny-backtop]');
            for (var j = 0; j < all.length; j++) customBtns.push(all[j]);
            var byId = document.getElementById('bny-backtop');
            if (byId && customBtns.indexOf(byId) === -1) customBtns.push(byId);
        }

        if (customBtns.length === 0) {
            // 文档没有 backtop 元素时自动创建一个默认按钮（仅创建一次）
            if (!document.getElementById('bny-backtop') && !instances.length) {
                var auto = document.createElement('div');
                auto.id = 'bny-backtop';
                auto.className = 'bny-backtop';
                auto.setAttribute('title', '回到顶部');
                auto.innerHTML = '<i class="bny-icon icon-arrowup"></i>';
                document.body.appendChild(auto);
                bindInstance(auto);
            }
            return;
        }

        // 绑定所有自定义元素
        for (var k = 0; k < customBtns.length; k++) {
            bindInstance(customBtns[k]);
        }
    }

    // ====== 初始化 ======
    if (typeof htmx !== 'undefined') {
        // htmx 内容加载后扫描新内容
        htmx.onLoad(function (content) { scan(content); });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { scan(document.body); });
    } else {
        scan(document.body);
    }
})();
