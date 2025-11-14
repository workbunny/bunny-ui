import htmx from "./htmx"

// 拓展-导航栏
(function () {

    function nav(evt) {
        const nav = evt.target
        const toggle = nav.querySelector('.toggle')
        const body = nav.querySelector('.bny-nav-body')
        const fullHeight = body.scrollHeight

        // 关闭
        function close() {
            body.style.height = fullHeight + 'px'
            setTimeout(() => {
                // 关闭导航栏
                body.style.height = '0px'
                body.classList.remove('active')
            }, 220)
        }

        // 打开
        function open() {
            body.style.height = fullHeight + 'px'
            body.classList.add('active')
            setTimeout(() => {
                body.style.height = 'auto'
            }, 220)
        }

        // 处理切换按钮点击事件
        function handleToggle() {
            if (body.classList.contains('active')) {
                // 关闭导航栏
                close()
            } else {
                // 打开导航栏
                open()
            }
        }
        toggle.addEventListener("click", handleToggle)
        // 点击空白处关闭
        document.addEventListener("click", (e) => {
            if (!nav.contains(e.target) &&
                !toggle.contains(e.target) &&
                body.classList.contains('active')) {
                close()
            }
        })
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
        const arrow = htmx.findAll(nav, '.arrow')
        for (let i = 0; i < arrow.length; i++) {
            arrow[i].addEventListener("click", (e) => {
                let arrowParent = e.target.parentElement.parentElement;
                arrowParent.classList.toggle("showMenu");
            });
        }
    }

    // 拓展-导航栏-侧边
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