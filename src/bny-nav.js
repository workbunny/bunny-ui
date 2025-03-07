import htmx from "./htmx"

// 拓展-导航栏
(function () {

    function nav(evt) {
        const nav = evt.target
        const child = htmx.findAll(nav, ".bny-nav-child")
        // 屏幕宽度
        let screenWidth = window.innerWidth;
        let isMobile = false
        if (screenWidth <= 768) {
            isMobile = true
            const toggle = document.createElement("div")
            toggle.setAttribute("class", "bny-nav-toggle")
            toggle.innerHTML = `<a href="javascript:;">
                <i class="icon icon-jia"></i>
            </a>`
            htmx.find(nav, ".bny-nav-title").insertAdjacentElement("afterend", toggle)
            // 点击
            htmx.on(document, "click", function (e) {
                if (!nav.contains(e.target)) {
                    nav.classList.remove("nav-toggle")
                }
                if (toggle.contains(e.target)) {
                    nav.classList.toggle("nav-toggle")
                }
            })
        }
        child.forEach(item => {
            const parent = item.parentNode
            const btn = item.previousElementSibling
            const i = document.createElement("i")
            i.setAttribute("class", "icon icon-you2 bny-nav-more")
            btn.appendChild(i)
            if ((btn.getAttribute("href") !== "#"
                && btn.getAttribute("href") !== "javascript:void(0)"
                && btn.getAttribute("href") !== "javascript:;"
                && btn.getAttribute("href") !== null) && isMobile === false) {
                // 悬停
                parent.addEventListener("mouseenter", function () {
                    parent.classList.add("child-hover")
                })
                // 离开
                parent.addEventListener("mouseleave", function () {
                    parent.classList.remove("child-hover")
                })
            } else {
                // 点击
                document.addEventListener("click", function (e) {
                    if (parent.contains(e.target)) {
                        const son = htmx.find(parent, ".bny-nav-child")
                        if (!son.contains(e.target)) {
                            parent.classList.toggle("child-hover")
                        }
                        if (e.target.classList.contains("bny-nav-more")) {
                            e.preventDefault()
                        }
                    } else {
                        parent.classList.remove("child-hover")
                    }
                })
            }
        });
    }

    // 拓展-导航栏-顶部
    htmx.defineExtension("bny-nav", {
        onEvent: function (name, evt) {
            if (name === "htmx:afterProcessNode" &&
                evt.target.classList.contains("bny-nav")
            ) {
                nav(evt)
            }
        }
    })

    function navLateral(evt) {
        const nav = evt.target
        const child = htmx.findAll(nav, ".bny-nav-child")
        child.forEach(item => {
            const parent = item.parentNode
            const btn = item.previousElementSibling
            const i = document.createElement("i")
            i.setAttribute("class", "icon icon-you2 bny-nav-more")
            btn.appendChild(i)
            // 点击
            btn.addEventListener("click", function () {
                parent.classList.toggle("child-hover")
            })

            // 悬停
            parent.addEventListener("mouseenter", function () {
                if (nav.classList.contains("nav-toggle")) {
                    parent.classList.add("child-hover")
                }

            })
            // 离开
            parent.addEventListener("mouseleave", function () {
                if (nav.classList.contains("nav-toggle")) {
                    parent.classList.remove("child-hover")
                }
            })
        })
        const btn = htmx.findAll(nav, ".bny-nav-body>.bny-nav-item>a")
        btn.forEach(item => {
            const text = htmx.find(item, "cite")
            item.setAttribute("title", text.innerText)
        })
    }

    // 拓展-导航栏-侧栏
    htmx.defineExtension("bny-nav-lateral", {
        onEvent: function (name, evt) {
            if (name === "htmx:afterProcessNode" &&
                evt.target.classList.contains("bny-nav-lateral")
            ) {
                navLateral(evt)
            }
        }
    })
})()