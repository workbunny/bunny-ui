htmx.defineExtension('bny-dropdown', {
    // 事件
    onEvent: function (name, evt) {

        /**
         * 显示
         * @param {HTMLElement} parent 
         * @param {HTMLElement} target 
         */
        function open(parent, target) {
            clean(target)

            target.style.visibility = 'hidden'
            target.style.opacity = 0
            target.classList.add('show')

            position(parent, target)

            target.style.visibility = 'visible'
            target.style.opacity = 1
        }

        /**
         * 关闭
         * @param {HTMLElement} target 
         */
        function close(target) {
            const isShow = target.classList.contains('show')
            const isUp = target.classList.contains('up')
            if (isShow || isUp) {
                target.classList.remove('show', 'up')
            }
            target.style.visibility = "hidden"
            target.style.opacity = 0
        }

        function clean(target) {
            // 清除内联样式
            target.style.top = ''
            target.style.left = ''
            target.style.right = ''
            target.style.bottom = ''
        }

        /**
         * 切换
         * @param {HTMLElement} parent 
         * @param {HTMLElement} target 
         */
        function toggle(parent, target) {
            const isShow = target.classList.contains('show')
            const isUp = target.classList.contains('up')
            if (isShow || isUp) {
                close(target)
            } else {
                open(parent, target)
            }
        }

        function position(parent, target) {
            const parentRect = parent.getBoundingClientRect()
            const targetRect = target.getBoundingClientRect()
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const gap = 8; // 菜单与按钮之间的间距

            // 清楚之前的位置类
            target.classList.remove('up')

            // 计算垂直方向位置
            let top, bottom

            if (parentRect.top + parentRect.bottom < viewportHeight) {
                top = parentRect.bottom + gap
                bottom = 'auto'
            } else {
                top = 'auto'
                bottom = viewportHeight - parentRect.top + gap
                target.classList.add('up')
            }

            let left = parentRect.left
            let right = 'auto'

            if (left + targetRect.width > viewportWidth - gap) {
                left = 'auto'
                right = viewportWidth - parentRect.right
            }

            if (left !== 'auto' && right < gap) {
                left = gap
            }
            target.style.top = top === 'auto' ? 'auto' : `${top}px`;
            target.style.bottom = bottom === 'auto' ? 'auto' : `${bottom}px`;
            target.style.left = left === 'auto' ? 'auto' : `${left}px`;
            target.style.right = right === 'auto' ? 'auto' : `${right}px`;
        }

        function add(target) {
            let dropdown = bny.queryChild(target, '.bny-dropdown')
            if (!dropdown) {
                dropdown = document.createElement('div')
                dropdown.classList.add('bny-dropdown')
                target.appendChild(dropdown)
            }
            return dropdown
        }

        // 在htmx初始化节点后触发
        if (name === 'htmx:afterProcessNode') {
            if (bny.hasExtName(evt.target, 'bny-dropdown')) {
                const dropdown = add(evt.target)
                // 点击事件
                evt.target.addEventListener("click", (e) => {
                    // 点击下拉菜单区域时，不关闭菜单
                    if (e.target.closest('.bny-dropdown')) {
                        // htmx.addClass(dropdown, 'show')
                        open(evt.target, dropdown)
                    } else {
                        // htmx.toggleClass(dropdown, "show")
                        toggle(evt.target, dropdown)
                    }
                })
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('.bny-dropdown')) {
                        console.log('close')
                        close(dropdown)
                    }
                })
                return false
            }
            return true
        }

        // 在交换前触发，允许你配置交换
        if (name === "htmx:beforeSwap") {
            if (bny.hasExtName(evt.target, 'bny-dropdown')) {
                const dropdown = bny.queryChild(evt.target, '.bny-dropdown')
                if (!bny.hasClass(dropdown, 'show') || dropdown.innerHTML.trim() === '') {
                    htmx.swap(
                        dropdown,
                        evt.detail.xhr.responseText,
                        { swapStyle: "innerHTML" }
                    )
                }
                return false
            }
        }
        return true
    }
})