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


                return false
            }
        }
    }
})