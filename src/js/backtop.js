(function () {
    'use strict';

    var btn = null;
    var threshold = 200;
    var ticking = false;
    var container = null; // 滚动容器（元素或 window）
    var isWindow = true;  // 是否为 window 滚动

    /**
     * 获取滚动阈值
     * @param {HTMLElement} elt 元素
     * @returns {number} 阈值
     */
    function getThreshold(elt) {
        var val = elt.getAttribute('data-threshold') || elt.getAttribute('data-bny-backtop');
        if (val && !isNaN(parseInt(val, 10))) {
            return parseInt(val, 10);
        }
        return 200;
    }

    /**
     * 获取滚动容器的当前滚动位置
     * @returns {number}
     */
    function scrollTop() {
        if (isWindow) {
            return window.scrollY || document.documentElement.scrollTop || 0;
        }
        return container.scrollTop || 0;
    }

    /**
     * 滚动容器到顶部
     */
    function scrollToTop() {
        if (isWindow) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            container.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    /**
     * 自动检测页面中实际滚动的容器
     */
    function detectContainer() {
        // 优先使用 data-target 指定的容器
        if (btn) {
            var target = btn.getAttribute('data-target');
            if (target) {
                var el = document.querySelector(target);
                if (el && el.scrollHeight > el.clientHeight) {
                    container = el;
                    isWindow = false;
                    return;
                }
            }
        }

        // 常见滚动容器检测：#bny-content > 其他 overflow:auto 元素
        var candidates = document.querySelectorAll('#bny-content, [data-scroll-container]');
        for (var i = 0; i < candidates.length; i++) {
            if (candidates[i].scrollHeight > candidates[i].clientHeight) {
                container = candidates[i];
                isWindow = false;
                return;
            }
        }

        // 默认使用 window
        container = window;
        isWindow = true;
    }

    /**
     * 创建 BackTop 按钮（如果页面中没有则自动创建）
     */
    function ensure() {
        if (btn) return;

        // 优先查找页面中已存在的 backtop 元素
        btn = document.getElementById('bny-backtop');
        if (!btn) {
            btn = document.querySelector('[data-bny-backtop]');
        }

        if (btn) {
            threshold = getThreshold(btn);
            if (!btn.classList.contains('bny-backtop')) {
                btn.classList.add('bny-backtop');
            }
        } else {
            // 自动创建
            btn = document.createElement('div');
            btn.className = 'bny-backtop';
            btn.setAttribute('title', '回到顶部');
            btn.innerHTML = '<i class="bny-icon icon-arrowup"></i>';
            document.body.appendChild(btn);
        }
    }

    /**
     * 更新按钮显示/隐藏状态
     */
    function update() {
        if (!btn) return;
        ticking = false;
        if (scrollTop() > threshold) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }

    /**
     * 滚动监听（使用 requestAnimationFrame 节流）
     */
    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }

    /**
     * 点击回到顶部
     */
    function onClick() {
        scrollToTop();
    }

    /**
     * 绑定事件
     */
    function bind() {
        ensure();
        if (!btn || btn._bnyBacktop) return;
        btn._bnyBacktop = true;

        // 检测滚动容器
        detectContainer();

        btn.addEventListener('click', onClick);

        // 根据容器类型绑定滚动事件
        if (isWindow) {
            window.addEventListener('scroll', onScroll, { passive: true });
        } else {
            container.addEventListener('scroll', onScroll, { passive: true });
        }

        // 初始化检查
        update();
    }

    /**
     * 扫描并初始化
     */
    function scan(root) {
        if (root.nodeType !== 1) return;
        if (root.id === 'bny-backtop' ||
            (root.hasAttribute && root.hasAttribute('data-bny-backtop'))) {
            btn = null;
            bind();
        }
        if (root.querySelectorAll) {
            var custom = root.querySelector('[data-bny-backtop]');
            if (custom) {
                btn = null;
                bind();
            }
        }
    }

    // ====== 初始化 ======
    if (typeof htmx !== 'undefined') {
        htmx.onLoad(function (content) { scan(content); });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { bind(); });
    } else {
        bind();
    }
})();
