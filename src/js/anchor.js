htmx.defineExtension('bny-anchor', {
    // 事件
    onEvent: function (name, evt) {

        function moveSilder(target, link) {
            const slider = bny.queryChild(target, ".slider")
            if (slider) {
                slider.style.top = link.offsetTop + "px"
            }
            link.classList.add("active")
        }

        if (name === "htmx:afterProcessNode") {
            if (bny.hasExtName(evt.target, "bny-anchor")) {
                const rail = evt.target.getAttribute("rail") !== null ? true : false
                if (rail) {
                    const slider = document.createElement("div")
                    slider.classList.add("slider")
                    evt.target.appendChild(slider)
                }

                // 点击导航
                evt.target.addEventListener("click", function (e) {
                    const link = e.target.closest(".link")
                    if (link) {
                        bny.removeClass(evt.target.querySelectorAll(".link"), "active")
                        const anchor = link.getAttribute("anchor")
                        const section = htmx.find(anchor)
                        if (section) {
                            section.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                            })
                        }
                        moveSilder(evt.target, link)
                    }
                });

                // 鼠标悬浮也跟随
                evt.target.addEventListener("mouseover", function (e) {
                    const link = e.target.closest(".link")
                    if (link) {
                        bny.removeClass(evt.target.querySelectorAll(".link"), "active")
                        moveSilder(evt.target, link)
                    }
                })

                // 滚动跟随：使用 rAF 节流，避免高频率 DOM 查询
                let ticking = false
                const onScroll = () => {
                    if (ticking) return
                    ticking = true
                    requestAnimationFrame(() => {
                        ticking = false
                        // 节点已被移除时不再处理，并自动解绑
                        if (!evt.target.isConnected) {
                            window.removeEventListener('scroll', onScroll, true)
                            return
                        }
                        const links = evt.target.querySelectorAll(".link")
                        let currentLink = null

                        links.forEach(link => {
                            const anchor = link.getAttribute("anchor")
                            const section = htmx.find(anchor)
                            if (section) {
                                const rect = section.getBoundingClientRect()
                                if (rect.top <= 100 && rect.bottom >= 100) {
                                    currentLink = link
                                }
                            }
                        })

                        if (currentLink) {
                            bny.removeClass(links, "active")
                            moveSilder(evt.target, currentLink)
                        }
                    })
                }
                // capture: true 保证监听到任意滚动容器的事件
                window.addEventListener("scroll", onScroll, { passive: true, capture: true })

                // 通过 htmx 移除事件解绑：节点从 DOM 移除时撤销全局监听
                evt.target._bnyAnchorCleanup = function () {
                    window.removeEventListener('scroll', onScroll, true)
                }

                return false;
            }
        }

        // 节点移除前清理监听，避免泄漏
        if (name === "htmx:beforeOnNodeDisposal") {
            if (evt.target && typeof evt.target._bnyAnchorCleanup === 'function') {
                evt.target._bnyAnchorCleanup()
                evt.target._bnyAnchorCleanup = null
            }
        }
    }
})
