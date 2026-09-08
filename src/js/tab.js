htmx.defineExtension('bny-tab', {
    onEvent: function (name, evt) {

        /**
         * 添加移动按钮
         * @param {HTMLElement} target 头元素
         * @returns {void}
         */
        function addMoveBtn(target) {
            // 添加滚动条
            const head = bny.queryChild(target, ".head")
            head.classList.add("scrollbar")
            head.style.cssText = "padding: 0px 64px 0 32px;"
            // 左移动按钮
            const leftBtn = document.createElement("div")
            leftBtn.className = "btn-left"
            leftBtn.innerHTML = `<i class="bny-icon icon-doubleleft"></i>`
            target.appendChild(leftBtn)
            // 右移动按钮
            const rightBtn = document.createElement("div")
            rightBtn.className = "btn-right"
            rightBtn.innerHTML = `<i class="bny-icon icon-doubleright"></i>`
            target.appendChild(rightBtn)
            // 更多按钮
            const moreBtn = document.createElement("div")
            moreBtn.className = "btn-more"
            moreBtn.setAttribute("hx-ext", "bny-dropdown")
            moreBtn.innerHTML = `<i class="bny-icon icon-down"></i>
            <div class="bny-dropdown">
                <div hx-ext="bny-menu" menu-mode="vertical">
                    <div class="item">
                        <div class="trigger btn-close-this">
                            <span>关闭当前</span>
                        </div>
                    </div>
                    <div class="item">
                        <div class="trigger btn-close-other">
                            <span>关闭其他</span>
                        </div>
                    </div>
                    <div class="item">
                        <div class="trigger btn-close-all">
                            <span>关闭全部</span>
                        </div>
                    </div>
                </div>
            </div>`
            target.appendChild(moreBtn)
            htmx.process(moreBtn)
        }

        /**
         * 添加关闭按钮
         * @param {HTMLElement} target 头元素
         * @returns {void}
         */
        function addCloseBtn(target) {
            const closeBtn = document.createElement("i")
            closeBtn.className = "bny-icon icon-close"
            target.appendChild(closeBtn)
        }

        /**
         * 绑定事件
         * @param {HTMLElement} target 头元素
         * @param {string} trigger 事件类型
         * @returns {void}
         */
        function onTrigger(target, trigger) {
            // 定义标签切换逻辑
            function switchTab(li) {
                if (li) {
                    // 获取所有的 li 元素
                    let lis = li.parentElement.children
                    // 获取所有的 body 元素
                    let bodys = li.parentElement.parentElement.querySelector(".body").children
                    let index = bny.indexOf(li)
                    // 切换标签
                    bny.removeClass(lis, "this")
                    bny.removeClass(bodys, "show")
                    htmx.addClass(lis[index], "this")
                    htmx.addClass(bodys[index], "show")
                }
            }

            // 对于其他事件类型，直接添加监听器
            target.addEventListener(trigger, function (e) {
                // console.log(e.target)
                const li = e.target.closest(".head>li")
                switchTab(li)
                const more = e.target.closest(".btn-more")
                if (li !== null || more !== null) {
                    e.stopPropagation()
                }

            })
        }

        // 其他点击事件
        function onClicks(target) {
            target.addEventListener("click", (e) => {
                // 点击删除标签
                const closeBtn = e.target.closest("li>i.icon-close")
                if (closeBtn) {
                    const index = bny.indexOf(closeBtn.parentElement)
                    if (index === null) return
                    const li = bny.queryChild(target, ".head>li:nth-child(" + (index + 1) + ")")
                    const body = bny.queryChild(target, ".body>div:nth-child(" + (index + 1) + ")")
                    // 删除标签
                    li.remove()
                    body.remove()
                    // 切换下一个标签
                    if (li.classList.contains("this")) {
                        const nextLi = bny.queryChild(target, ".head>li")
                        if (!nextLi) return
                        const nextIndex = bny.indexOf(nextLi)
                        const nextBody = bny.queryChild(target, ".body>div:nth-child(" + (nextIndex + 1) + ")")
                        htmx.addClass(nextLi, "this")
                        htmx.addClass(nextBody, "show")
                    }
                    e.stopPropagation()
                }
                // 点击左滑动
                const leftBtn = e.target.closest("div.btn-left")
                if (leftBtn) {
                    const head = bny.queryChild(target, ".head")
                    head.scrollBy({ left: -100, behavior: "smooth" })
                }
                // 点击右滑动
                const rightBtn = e.target.closest("div.btn-right")
                if (rightBtn) {
                    const head = bny.queryChild(target, ".head")
                    head.scrollBy({ left: 100, behavior: "smooth" })
                }
                // 点击关闭当前
                const closeThisBtn = e.target.closest("div.btn-close-this")
                if (closeThisBtn) {
                    const thisLi = bny.queryChild(target, ".head>li.this")
                    if (thisLi) {
                        const thisLiClose = bny.queryChild(thisLi, "i.icon-close")
                        if (thisLiClose) {
                            thisLiClose.click()
                        }
                    }
                }
                // 点击关闭其他
                const closeOtherBtn = e.target.closest("div.btn-close-other")
                if (closeOtherBtn) {
                    const lis = bny.queryChildAll(target, ".head>li")
                    const thisLi = bny.queryChild(target, ".head>li.this")
                    for (let i = 0; i < lis.length; i++) {
                        if (lis[i] !== thisLi) {
                            const closeBtn = bny.queryChild(lis[i], "i.icon-close")
                            if (closeBtn) {
                                closeBtn.click()
                            }
                        }
                    }
                }
                // 点击关闭全部
                const closeAllBtn = e.target.closest("div.btn-close-all")
                if (closeAllBtn) {
                    const lis = bny.queryChildAll(target, ".head>li")
                    for (let i = 0; i < lis.length; i++) {
                        const closeBtn = bny.queryChild(lis[i], "i.icon-close")
                        if (closeBtn) {
                            closeBtn.click()
                        }
                    }
                }
            })
        }

        /**
         * 初始化选项卡
         * @param {HTMLElement} target 选项卡元素
         */
        function tabInit(target) {
            const heads = bny.queryChildAll(target, ".head>li");
            const bodys = bny.queryChildAll(target, ".body>div");
            // 事件
            const trigger = target.getAttribute("hx-trigger") ?? "click";
            // 模式
            const mode = target.getAttribute("tab-mode") ?? "normal"
            // 索引
            const index = Number(target.getAttribute("tab-index") ?? 0)
            // 补全body
            const addBody = heads.length - bodys.length
            for (let i = 0; i < addBody; i++) {
                const body = document.createElement("div")
                bny.queryChild(target, ".body").appendChild(body)
                // 处理给定元素及其子元素，连接任何htmx行为
                htmx.process(body)
            }
            // 处理头
            for (let i = 0; i < heads.length; i++) {
                heads[i].setAttribute("hx-trigger", trigger)
                if (heads[i].getAttribute("tab-closable") !== null &&
                    !heads[i].querySelector(":scope>i.icon-close")) {
                    addCloseBtn(heads[i])
                }
                // 处理给定元素及其子元素，连接任何htmx行为
                htmx.process(heads[i])
            }
            // 添加移动按钮
            if (mode === "scroll") {
                addMoveBtn(target)
            }
            // 绑定事件
            onTrigger(target, trigger)
            // 其他点击事件
            onClicks(target)
            // 默认
            if (bny.queryChild(target, ".head>li:nth-child(" + (index + 1) + ")")) {
                htmx.trigger(bny.queryChild(target, ".head>li:nth-child(" + (index + 1) + ")"), trigger)
            }
        }

        /**
         * 判断是否重复
         * 
         * @param {HTMLElement} target 
         * @param {HTMLElement} head 
         * @returns {null|HTMLElement}
         */
        function isRepetition(target, head) {
            const lis = bny.queryChildAll(head, "li")
            const hxAttrs = ["hx-get", "hx-post", "hx-put", "hx-patch", "hx-delete"]
            for (const attr of hxAttrs) {
                const targetUrl = target.getAttribute(attr)
                if (targetUrl && targetUrl !== "") {
                    for (const li of lis) {
                        if (li !== target && li.getAttribute(attr) === targetUrl) {
                            return li
                        }
                    }
                }
            }
            return null
        }

        // 在htmx初始化节点后触发
        if (name === "htmx:afterProcessNode") {
            if (bny.hasExtName(evt.target, "bny-tab")) {
                tabInit(evt.target)
                return false
            }
            if (evt.target.tagName === "LI") {
                if (evt.target.parentElement.classList.contains("head")) {
                    const tab = evt.target.parentElement.parentElement
                    const head = bny.queryChild(tab, ".head")
                    const thisLs = isRepetition(evt.target, head)
                    if (thisLs != null) {
                        if (thisLs.getAttribute("hx-trigger") === "click") {
                            thisLs.click()
                        }
                        evt.target.remove()
                        return false
                    }
                    // 事件
                    const trigger = tab.getAttribute("hx-trigger") ?? "click";
                    evt.target.setAttribute("hx-trigger", trigger)
                    if (evt.target.getAttribute("tab-closable") !== null &&
                        !bny.queryChild(evt.target, "i.icon-close")) {
                        addCloseBtn(evt.target)
                    }
                    const body = document.createElement("div")
                    const index = bny.indexOf(evt.target)
                    if (!bny.queryChild(tab, ".body>div:nth-child(" + (index + 1) + ")")) {
                        bny.queryChild(tab, ".body").appendChild(body)
                        // 处理给定元素及其子元素，连接任何htmx行为
                        htmx.process(body)
                    }
                    // 处理给定元素及其子元素，连接任何htmx行为
                    htmx.process(evt.target)
                    // 点击行为
                    if (trigger === "click" && evt.target.getAttribute("this") !== null) {
                        // afterProcessNode 会因本分支 setAttribute("hx-trigger") 改变属性哈希而
                        // 重入两次（htmx 哈希变化即重新 init 并再次派发），激活点击必须幂等：
                        // 先消费 this 标记，否则嵌套内外各 click 一次，页面请求发两遍
                        evt.target.removeAttribute("this");
                        evt.target.click()
                        // 滚动到最右边
                        head.scrollBy({ left: head.scrollWidth, behavior: "smooth" })
                    }
                    return false
                }
            }
        }
        // 在交换前触发，允许你配置交换
        if (name === "htmx:beforeSwap") {
            if (evt.target.tagName === "LI") {
                if (evt.target.parentElement.classList.contains("head")) {
                    const liSwap = function (evt) {
                        const tab = evt.target.parentElement.parentElement
                        const html = evt.detail.xhr.responseText
                        const index = bny.indexOf(evt.target)
                        htmx.swap(bny.queryChild(tab, ".body>div:nth-child(" + (index + 1) + ")"),
                            html,
                            {
                                swapStyle: "innerHTML"
                            })
                    }
                    liSwap(evt)
                    return false
                }
            }
        }
        return true
    },
    // 响应转换
    transformResponse: function (text, xhr, elt) {

        return text
    }
})