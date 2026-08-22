htmx.defineExtension('bny-menu', {
    // 事件
    onEvent: function (name, evt) {

        // 在htmx初始化节点后触发
        if (name === "htmx:afterProcessNode") {
            if (bny.hasExtName(evt.target, 'bny-menu')) {
                // 为所有可聚焦的 item 设置 tabindex，便于键盘导航
                initFocusable(evt.target)
                // 鼠标点击：展开当前项的子菜单，同时收起其他已展开项
                evt.target.addEventListener('click', function (e) {
                    const item = e.target.closest('.item')
                    if (!item) return
                    // 只收起「同父级的兄弟」中已展开的项（不触碰祖先链，避免点子菜单内项时收起顶层）
                    const parent = item.parentElement
                    if (parent) {
                        Array.from(parent.querySelectorAll(':scope > .item.show')).forEach(function (o) {
                            if (o !== item) o.classList.remove('show')
                        })
                    }
                    const subMenu = item.querySelector(':scope > .sub-menu')
                    if (subMenu) {
                        item.classList.toggle('show')
                    }
                })
                // 点击菜单外部：自动收起所有已展开的子菜单
                document.addEventListener('click', function (e) {
                    if (!evt.target.contains(e.target)) {
                        evt.target.querySelectorAll('.item.show').forEach(function (o) {
                            o.classList.remove('show')
                        })
                    }
                })
                // 键盘导航：方向键/Enter/ESC
                evt.target.addEventListener('keydown', onMenuKeydown)
                return false
            }
        }
        return true;
    },
    // 响应转换
    transformResponse: function (text, xhr, elt) {
        /**
         * 获取菜单
         * 
         * @param {Array} arr list
         * @returns {String} html
         */
        function getMenu(arr) {
            let html = ""
            arr.forEach(v => {
                const attrStr = bny.parAttrStr(v.attr)
                html += `<div class="item" ${attrStr}>`
                html += `<div class="trigger" menu-id="${bny.escapeChars(String(v.id))}">`
                html += `<span>${bny.escapeChars(v.name)}</span>`
                if (v.child) {
                    html += `<i class="bny-icon icon-right"></i>`
                }
                html += `</div>`
                if (v.child) {
                    html += `<div class="sub-menu">`
                    html += getMenu(v.child)
                    html += `</div>`
                }
                html += `</div>`
            });
            return html
        }

        /**
         * 获取菜单
         * 
         * @param {String} data json
         * @returns {String} html
         */
        function getHtml(data) {
            const obj = JSON.parse(data)
            return getMenu(obj.data)
        }

        if (xhr.getResponseHeader('Content-Type')
            .includes('application/json')) {
            const body = getHtml(xhr.responseText)
            return body
        }
        return text;
    }
});

/**
 * 为菜单内所有 .item 设置 tabindex=0，使其可被键盘聚焦
 * 仅对包含 .trigger 的 .item 设置（避免误伤子菜单容器）
 * @param {HTMLElement} root
 */
function initFocusable(root) {
    root.querySelectorAll('.item').forEach(function (item) {
        // 仅当 item 内含 .trigger 时才视为菜单项
        if (item.querySelector(':scope > .trigger')) {
            item.setAttribute('tabindex', '0')
        }
    })
}

/**
 * 判断菜单方向：horizontal（默认）或 vertical
 * - 顶级 [hx-ext~="bny-menu"] 默认水平
 * - mode="vertical" 时垂直
 * - 嵌套 .sub-menu 内部视为垂直
 * @param {HTMLElement} item 当前聚焦的 .item
 * @returns {'horizontal'|'vertical'}
 */
function getMenuOrientation(item) {
    // 子菜单内的 item 一律按垂直处理
    const parent = item.parentElement
    if (parent && parent.classList.contains('sub-menu')) {
        return 'vertical'
    }
    // 顶级 menu：检查 mode 属性或 vertical 类
    const menuRoot = item.closest('[hx-ext~="bny-menu"]')
    if (menuRoot) {
        if (menuRoot.getAttribute('menu-mode') === 'vertical' ||
            menuRoot.classList.contains('vertical')) {
            return 'vertical'
        }
    }
    return 'horizontal'
}

/**
 * 获取同级 .item 列表（仅含 .trigger 的）
 * @param {HTMLElement} item
 * @returns {HTMLElement[]}
 */
function getSiblings(item) {
    const parent = item.parentElement
    if (!parent) return []
    return Array.from(parent.querySelectorAll(':scope > .item'))
        .filter(function (it) {
            return it.querySelector(':scope > .trigger')
        })
}

/**
 * 键盘事件处理
 * 水平菜单：←/→ 切换兄弟，↓ 进入子菜单
 * 垂直菜单：↑/↓ 切换兄弟，→ 进入子菜单
 * Enter/Space：切换子菜单或激活
 * ESC：折叠当前展开的子菜单并回到父级
 * @param {KeyboardEvent} e
 */
function onMenuKeydown(e) {
    const item = e.target.closest('.item')
    if (!item) return
    const orientation = getMenuOrientation(item)
    const sub = item.querySelector(':scope > .sub-menu')

    switch (e.key) {
        case 'ArrowRight': {
            e.preventDefault()
            e.stopPropagation()
            if (orientation === 'vertical' && sub) {
                // 垂直菜单 → 进入子菜单
                if (!item.classList.contains('show')) item.classList.add('show')
                const first = sub.querySelector(':scope > .item[tabindex]')
                if (first) first.focus()
            } else {
                // 水平菜单 → 切换到右一个同级
                focusSibling(item, 1)
            }
            break
        }
        case 'ArrowLeft': {
            e.preventDefault()
            e.stopPropagation()
            if (orientation === 'vertical') {
                // 垂直子菜单 ← 回到父级
                const parentSub = item.parentElement
                if (parentSub && parentSub.classList.contains('sub-menu')) {
                    const parentItem = parentSub.parentElement
                    if (parentItem && parentItem.classList.contains('item')) {
                        // 折叠当前子菜单
                        parentItem.classList.remove('show')
                        parentItem.focus()
                    }
                }
            } else {
                focusSibling(item, -1)
            }
            break
        }
        case 'ArrowDown': {
            e.preventDefault()
            e.stopPropagation()
            if (orientation === 'horizontal' && sub) {
                // 水平菜单 ↓ 进入子菜单
                if (!item.classList.contains('show')) item.classList.add('show')
                const first = sub.querySelector(':scope > .item[tabindex]')
                if (first) first.focus()
            } else {
                focusSibling(item, 1)
            }
            break
        }
        case 'ArrowUp': {
            e.preventDefault()
            e.stopPropagation()
            if (orientation === 'horizontal') {
                // 水平菜单：↑ 折叠子菜单回到自身
                if (item.classList.contains('show')) {
                    item.classList.remove('show')
                }
            } else {
                focusSibling(item, -1)
            }
            break
        }
        case 'Enter':
        case ' ': {
            e.preventDefault()
            e.stopPropagation()
            // 模拟点击触发既有的 click 逻辑（切换子菜单或激活）
            item.click()
            break
        }
        case 'Escape': {
            e.preventDefault()
            e.stopPropagation()
            // 折叠当前 item 的子菜单；若处于子菜单内，回到父级
            if (item.classList.contains('show')) {
                item.classList.remove('show')
                item.focus()
            } else {
                const parentSub = item.parentElement
                if (parentSub && parentSub.classList.contains('sub-menu')) {
                    const parentItem = parentSub.parentElement
                    if (parentItem && parentItem.classList.contains('item')) {
                        parentItem.classList.remove('show')
                        parentItem.focus()
                    }
                }
            }
            break
        }
    }
}

/**
 * 聚焦同级兄弟
 * @param {HTMLElement} item
 * @param {Number} dir 1 下一个 / -1 上一个
 */
function focusSibling(item, dir) {
    const siblings = getSiblings(item)
    const idx = siblings.indexOf(item)
    if (idx === -1) return
    const next = siblings[idx + dir]
    if (next) next.focus()
}
