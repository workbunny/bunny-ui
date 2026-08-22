htmx.defineExtension('bny-nav', {
    onEvent: function (name, evt) {

        function onToggle(btn, nav) {
            btn.addEventListener('click', (e) => {
                const collapsed = nav.hasAttribute('nav-collapsed') ?? false
                if (collapsed) {
                    nav.removeAttribute('nav-collapsed')
                } else {
                    nav.setAttribute('nav-collapsed', '')
                }
                const isShow = nav.querySelectorAll('li.show')
                if (isShow.length > 0) {
                    bny.removeClass(isShow, 'show')
                }
            })
        }

        if (name === 'htmx:afterProcessNode') {
            if (bny.hasExtName(evt.target, 'bny-nav')) {
                // side 属性 侧边栏模式
                const side = evt.target.hasAttribute('nav-side') ?? false
                // collapsed 属性 伸缩模式
                // const collapsed = evt.target.hasAttribute('nav-collapsed') ?? false
                // 处理 toggle 属性 伸缩按钮模式
                const toggle = evt.target.hasAttribute('nav-toggle') ?? false
                if ((side && toggle) || !side) {
                    const head = bny.queryChild(evt.target, '.head')
                    const toggleBtn = document.createElement('div')
                    toggleBtn.classList.add('toggle-btn')
                    toggleBtn.innerHTML = '<i class="bny-icon icon-doubleleft"></i>'
                    head.appendChild(toggleBtn)
                    onToggle(toggleBtn, evt.target)
                }

                // 处理点击事件
                evt.target.addEventListener('click', (e) => {
                    const item = e.target.closest('li')
                    const subMenu = item?.querySelector('.sub-menu') ?? false
                    const trigger = bny.queryChild(item, '.trigger')
                    // 点击li
                    if (item) {
                        // 有子菜单
                        if (subMenu) {
                            const collapsed = evt.target.hasAttribute('nav-collapsed') ?? false
                            // 父级
                            if (!side || collapsed) {
                                const parent = item.parentElement
                                if (parent.classList.contains('menu')) {
                                    const arr = evt.target.querySelectorAll(".show")
                                    for (const i of arr) {
                                        if (i !== item) {
                                            i.classList.remove('show')
                                        }
                                    }
                                }
                            }
                            item.classList.toggle('show')
                        } else {
                            // 无子菜单
                            bny.removeClass(
                                evt.target.querySelectorAll(".active"),
                                'active'
                            )
                            trigger.classList.add('active')
                        }
                    }
                })

                // 点击导航外部：
                // - 默认导航宽屏：收起子菜单
                // - 默认导航手机端（≤768px）：整个菜单面板收回（移除 nav-collapsed）
                // - 侧边导航展开态：不收起（保持常驻）；侧边收缩态：收起 flyout 子菜单
                document.addEventListener('click', function (e) {
                    const nav = evt.target
                    if (nav.contains(e.target)) return
                    const isSide = nav.hasAttribute('nav-side')
                    const isCollapsed = nav.hasAttribute('nav-collapsed')
                    // 侧边展开态保持常驻，不收起
                    if (isSide && !isCollapsed) return
                    // 收起展开的子菜单
                    bny.removeClass(nav.querySelectorAll('.show'), 'show')
                    // 默认导航 + 手机端（≤768px）：点击外部整个菜单面板也收回（移除 nav-collapsed）
                    if (!isSide && window.matchMedia('(max-width: 768px)').matches) {
                        nav.removeAttribute('nav-collapsed')
                    }
                })


                return false
            }
        }
    }
})