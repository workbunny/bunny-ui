/**
 * bny-rate — 评分组件
 *
 * 设计：
 * - IIFE 自动扫描模式（与 image/tooltip 一致）
 * - 给容器加 .bny-rate 即可启用
 * - 支持 data-value 初始值、data-max 最大值、data-readonly 只读、data-half 半星
 * - 键盘：方向键调整、Enter 确认
 *
 * 用法：
 *   <div class="bny-rate" rate-value="3" rate-max="5"></div>
 *   <div class="bny-rate" rate-value="3.5" rate-half></div>
 *   <div class="bny-rate" rate-value="4" rate-readonly></div>
 */
(function () {
    'use strict';

    /**
     * 渲染单个 rate 实例
     * @param {HTMLElement} rate
     */
    function render(rate) {
        var max = parseInt(rate.getAttribute('rate-max'), 10) || 5;
        var value = parseFloat(rate.getAttribute('rate-value')) || 0;
        var half = rate.hasAttribute('rate-half');
        var readonly = rate.hasAttribute('rate-readonly');
        var color = rate.getAttribute('rate-color') || '';
        if (color) rate.setAttribute('color', color);

        rate.classList.add('bny-rate');
        if (readonly) rate.classList.add('is-readonly');
        rate.setAttribute('role', 'slider');
        rate.setAttribute('aria-valuemin', '0');
        rate.setAttribute('aria-valuemax', String(max));
        rate.setAttribute('aria-valuenow', String(value));
        if (!readonly) {
            rate.setAttribute('tabindex', '0');
        }

        // 清空并重建
        rate.innerHTML = '';
        var starsEl = document.createElement('div');
        starsEl.className = 'bny-rate-stars';

        // 构建 max 个星
        for (var i = 1; i <= max; i++) {
            var star = document.createElement('span');
            star.className = 'bny-rate-star';
            star.setAttribute('data-index', String(i));
            star.innerHTML = makeStarSvg(false);
            starsEl.appendChild(star);
        }
        rate.appendChild(starsEl);

        // 文本（可选）
        var showText = rate.hasAttribute('rate-show-text');
        var texts = (rate.getAttribute('rate-texts') || '很差,失望,一般,满意,惊喜').split(',');
        var textEl = null;
        if (showText) {
            textEl = document.createElement('span');
            textEl.className = 'bny-rate-text';
            rate.appendChild(textEl);
        }

        // 内部状态
        var state = {
            value: value,         // 当前值（已确认）
            hover: -1,            // 当前 hover 索引（-1 表示无）
            max: max,
            half: half,
            readonly: readonly,
            texts: texts,
            textEl: textEl
        };

        // 设置当前值
        setValue(value);

        // 绑定事件
        if (!readonly) {
            starsEl.addEventListener('mousemove', function (e) {
                var star = e.target.closest('.bny-rate-star');
                if (!star) {
                    if (state.hover !== -1) {
                        state.hover = -1;
                        paint();
                    }
                    return;
                }
                var idx = parseInt(star.getAttribute('rate-index'), 10);
                // 半星：根据鼠标位置判断
                if (state.half) {
                    var rect = star.getBoundingClientRect();
                    var isLeft = (e.clientX - rect.left) < rect.width / 2;
                    idx = isLeft ? idx - 0.5 : idx;
                }
                if (state.hover !== idx) {
                    state.hover = idx;
                    paint();
                }
            });
            starsEl.addEventListener('mouseleave', function () {
                state.hover = -1;
                paint();
            });
            starsEl.addEventListener('click', function (e) {
                var star = e.target.closest('.bny-rate-star');
                if (!star) return;
                var idx = parseInt(star.getAttribute('rate-index'), 10);
                if (state.half) {
                    var rect = star.getBoundingClientRect();
                    var isLeft = (e.clientX - rect.left) < rect.width / 2;
                    idx = isLeft ? idx - 0.5 : idx;
                }
                setValue(idx);
                // 触发 change 事件，便于 htmx hx-trigger="change" 提交
                rate.dispatchEvent(new Event('change', { bubbles: true }));
            });

            // 键盘支持
            rate.addEventListener('keydown', function (e) {
                var step = state.half ? 0.5 : 1;
                var key = e.key;
                if (key === 'ArrowRight' || key === 'ArrowUp') {
                    e.preventDefault();
                    setValue(Math.min(state.max, state.value + step));
                    rate.dispatchEvent(new Event('change', { bubbles: true }));
                } else if (key === 'ArrowLeft' || key === 'ArrowDown') {
                    e.preventDefault();
                    setValue(Math.max(0, state.value - step));
                    rate.dispatchEvent(new Event('change', { bubbles: true }));
                } else if (key === 'Enter' || key === ' ') {
                    e.preventDefault();
                    rate.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        }

        /**
         * 设置当前值并重绘
         */
        function setValue(v) {
            state.value = Math.max(0, Math.min(state.max, v));
            rate.setAttribute('data-value', String(state.value));
            rate.setAttribute('aria-valuenow', String(state.value));
            paint();
        }

        /**
         * 重绘星星状态
         */
        function paint() {
            var activeVal = state.hover !== -1 ? state.hover : state.value;
            var stars = starsEl.querySelectorAll('.bny-rate-star');
            Array.prototype.forEach.call(stars, function (star, i) {
                var starVal = i + 1; // 1,2,3,4,5
                var svg;
                if (activeVal >= starVal) {
                    // 全亮
                    svg = makeStarSvg(true);
                } else if (state.half && activeVal >= starVal - 0.5) {
                    // 半亮
                    svg = makeStarSvg(true, true);
                } else {
                    svg = makeStarSvg(false);
                }
                star.innerHTML = svg;
            });
            if (state.textEl) {
                var idx = Math.ceil(activeVal);
                idx = Math.max(0, Math.min(state.texts.length, idx));
                state.textEl.textContent = state.texts[idx - 1] || '';
            }
        }
    }

    /**
     * 生成单个星星 SVG
     * @param {boolean} active 是否激活
     * @param {boolean} half 是否半星
     */
    function makeStarSvg(active, half) {
        var fillId = half ? 'bny-rate-half-' + Math.random().toString(36).slice(2) : null;
        var fill;
        if (active) {
            fill = 'currentColor';
        } else {
            fill = 'none';
        }
        var starPath = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';
        if (half && fillId) {
            return '<svg viewBox="0 0 24 24" class="bny-rate-icon is-half">' +
                '<defs><linearGradient id="' + fillId + '">' +
                '<stop offset="50%" stop-color="currentColor"/>' +
                '<stop offset="50%" stop-color="none"/>' +
                '</linearGradient></defs>' +
                '<path d="' + starPath + '" fill="url(#' + fillId + ')" stroke="currentColor" stroke-width="1.5"/>' +
                '</svg>';
        }
        return '<svg viewBox="0 0 24 24" class="bny-rate-icon' + (active ? ' is-active' : '') + '">' +
            '<path d="' + starPath + '" fill="' + fill + '" stroke="currentColor" stroke-width="1.5"/>' +
            '</svg>';
    }

    /**
     * 扫描页面中所有 .bny-rate 并渲染
     * @param {HTMLElement} root
     */
    function scan(root) {
        var rates = (root || document).querySelectorAll('.bny-rate');
        Array.prototype.forEach.call(rates, function (rate) {
            if (rate._bnyRateBound) return;
            rate._bnyRateBound = true;
            render(rate);
        });
    }

    // ====== 初始化 ======
    if (typeof htmx !== 'undefined') {
        htmx.onLoad(function (content) { scan(content); });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { scan(document); });
    } else {
        scan(document);
    }
})();
