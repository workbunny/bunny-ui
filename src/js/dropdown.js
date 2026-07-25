// ====== 模块级共享函数与全局委托（避免每个实例重复注册 document 监听器）======

/** 关闭单个 dropdown 面板 */
function closeDropdown(target) {
    var isShow = target.classList.contains('show');
    var isUp = target.classList.contains('up');
    if (isShow || isUp) {
        target.classList.remove('show', 'up');
    }
    target.style.visibility = 'hidden';
    target.style.opacity = 0;
}

var _dropdownDelegated = false;

/**
 * 全局事件委托：只注册一次 document click
 * 点击页面其他位置时关闭所有打开的 dropdown
 */
function ensureDropdownDelegation() {
    if (_dropdownDelegated) return;
    _dropdownDelegated = true;

    document.addEventListener('click', function (e) {
        var openList = document.querySelectorAll('.bny-dropdown.show');
        for (var i = 0; i < openList.length; i++) {
            var dropdown = openList[i];
            // 点击下拉菜单内部，不关闭
            if (dropdown.contains(e.target)) continue;
            // 点击触发元素自身，不关闭（由触发元素自己的 click 处理 toggle）
            var trigger = dropdown._bnyDropdownTrigger;
            if (trigger && trigger.contains(e.target)) continue;
            closeDropdown(dropdown);
        }
    });
}

htmx.defineExtension('bny-dropdown', {
    // 事件
    onEvent: function (name, evt) {

        /**
         * 显示
         * @param {HTMLElement} parent
         * @param {HTMLElement} target
         */
        function open(parent, target) {
            clean(target);

            target.style.visibility = 'hidden';
            target.style.opacity = 0;
            target.classList.add('show');

            position(parent, target);

            target.style.visibility = 'visible';
            target.style.opacity = 1;
        }

        /**
         * 关闭（委托给模块级 closeDropdown）
         * @param {HTMLElement} target
         */
        function close(target) {
            closeDropdown(target);
        }

        function clean(target) {
            // 清除内联样式
            target.style.top = '';
            target.style.left = '';
            target.style.right = '';
            target.style.bottom = '';
        }

        /**
         * 切换
         * @param {HTMLElement} parent
         * @param {HTMLElement} target
         */
        function toggle(parent, target) {
            var isShow = target.classList.contains('show');
            var isUp = target.classList.contains('up');
            if (isShow || isUp) {
                close(target);
            } else {
                open(parent, target);
            }
        }

        /**
         * 计算下拉面板位置
         * @param {HTMLElement} parent  触发元素
         * @param {HTMLElement} target  下拉面板
         */
        function position(parent, target) {
            var parentRect = parent.getBoundingClientRect();
            var targetRect = target.getBoundingClientRect();
            var viewportWidth = window.innerWidth;
            var viewportHeight = window.innerHeight;
            var gap = 8; // 菜单与按钮之间的间距

            // 清除之前的位置类
            target.classList.remove('up');

            // ===== 垂直方向：判断下方/上方是否有足够空间 =====
            var top, bottom;
            var spaceBelow = viewportHeight - parentRect.bottom;
            var spaceAbove = parentRect.top;
            var needHeight = targetRect.height + gap;

            if (spaceBelow >= needHeight || spaceBelow >= spaceAbove) {
                // 下方放得下，或下方比上方空间大 → 优先放下方
                top = parentRect.bottom + gap;
                bottom = 'auto';
            } else {
                // 上方放
                top = 'auto';
                bottom = viewportHeight - parentRect.top + gap;
                target.classList.add('up');
            }

            // ===== 水平方向 =====
            var left = parentRect.left;
            var right = 'auto';

            if (left + targetRect.width > viewportWidth - gap) {
                // 右侧放不下 → 改为右对齐
                left = 'auto';
                right = viewportWidth - parentRect.right;
            }

            // 防止左侧溢出（仅当 left 是数字时检查）
            if (left !== 'auto' && left < gap) {
                left = gap;
            }
            // 防止右侧溢出（仅当 right 是数字时检查）
            if (right !== 'auto' && right < gap) {
                right = gap;
            }

            target.style.top = top === 'auto' ? 'auto' : top + 'px';
            target.style.bottom = bottom === 'auto' ? 'auto' : bottom + 'px';
            target.style.left = left === 'auto' ? 'auto' : left + 'px';
            target.style.right = right === 'auto' ? 'auto' : right + 'px';
        }

        function add(target) {
            var dropdown = bny.queryChild(target, '.bny-dropdown');
            if (!dropdown) {
                dropdown = document.createElement('div');
                dropdown.classList.add('bny-dropdown');
                target.appendChild(dropdown);
            }
            return dropdown;
        }

        // 在htmx初始化节点后触发
        if (name === 'htmx:afterProcessNode') {
            if (bny.hasExtName(evt.target, 'bny-dropdown')) {
                var dropdown = add(evt.target);

                // 存储关联，供全局委托判断"点击触发元素时不关闭"
                dropdown._bnyDropdownTrigger = evt.target;

                // 点击触发元素时切换下拉菜单
                evt.target.addEventListener('click', function (e) {
                    if (e.target.closest('.bny-dropdown')) {
                        return;
                    }
                    e.stopPropagation();
                    toggle(evt.target, dropdown);
                });

                // 注册全局委托（内部有 flag 保证只注册一次）
                ensureDropdownDelegation();

                return false;
            }
            return true;
        }

        // 在交换前触发，允许你配置交换
        if (name === "htmx:beforeSwap") {
            if (bny.hasExtName(evt.target, 'bny-dropdown')) {
                var dd = bny.queryChild(evt.target, '.bny-dropdown');
                // 未打开或无内容 → 填充内容并打开
                if (!dd || !bny.hasClass(dd, 'show') || dd.innerHTML.trim() === '') {
                    htmx.swap(
                        dd,
                        evt.detail.xhr.responseText,
                        { swapStyle: "innerHTML" }
                    );
                    open(evt.target, dd);
                }
                return false;
            }
        }

        // 节点销毁前清理引用
        if (name === 'htmx:beforeOnNodeDisposal') {
            if (evt.target && evt.target._bnyDropdownTrigger !== undefined) {
                delete evt.target._bnyDropdownTrigger;
            }
        }

        return true;
    }
});
