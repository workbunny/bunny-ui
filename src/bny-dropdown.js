import htmx from "./htmx"

(function () {

    function createDropdown(trigger) {
        let isOpen = false;
        const menu = document.querySelector(`${trigger.getAttribute('hx-target')}`)
        menu.classList.add('bny-dropdown')

        // 定位逻辑
        function updatePosition() {
            const triggerRect = trigger.getBoundingClientRect();
            const menuRect = menu.getBoundingClientRect();
            const viewport = {
                width: document.documentElement.clientWidth,
                height: document.documentElement.clientHeight
            };

            let position = {
                x: triggerRect.left,
                y: triggerRect.bottom + 8,
                direction: 'down'
            };

            if (triggerRect.bottom + menuRect.height + 8 > viewport.height) {
                position.y = triggerRect.top - menuRect.height - 8;
                position.direction = 'up';
            }

            if (triggerRect.left + menuRect.width > viewport.width) {
                position.x = viewport.width - menuRect.width - 8;
            } else if (triggerRect.right - menuRect.width < 0) {
                position.x = 8;
            }

            menu.style.left = `${position.x}px`;
            menu.style.top = `${position.y}px`;
        }

        // 处理外部点击
        function handleClickOutside(e) {
            if (!trigger.contains(e.target) && !menu.contains(e.target)) {
                close();
            }
        }

        // 状态切换
        function toggle() {
            isOpen ? close() : open();
        }

        function open() {
            if (isOpen) return;
            isOpen = true;
            updatePosition();
            menu.classList.add('active');
            document.addEventListener('click', handleClickOutside, true);
            window.addEventListener('resize', updatePosition);
        }

        function close() {
            if (!isOpen) return;
            isOpen = false;
            menu.classList.remove('active');
            document.removeEventListener('click', handleClickOutside, true);
            window.removeEventListener('resize', updatePosition);
        }

        // 清理资源
        function destroy() {
            close();
            menu.remove();
            window.removeEventListener('resize', updatePosition);
        }

        return {
            toggle,
            open,
            close,
            destroy
        };
    }

    htmx.defineExtension("bny-dropdown", {
        onEvent: function (name, evt) {

            if (name === "htmx:afterProcessNode") {
                const dropdown = createDropdown(evt.target)
                evt.target.addEventListener("click", function (e) {
                    dropdown.toggle()
                })
            }
        }
    })
})()