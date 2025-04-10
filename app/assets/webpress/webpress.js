// 主题切换函数
const changeTheme = () => {
    document.querySelector('html').classList.toggle('dark')
}
const changeBtn = (func, $eve) => {
    const x = $eve.clientX
    const y = $eve.clientY
    // 计算鼠标点击位置距离视窗的最大圆半径
    const endRadius = Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y),
    )
    document.documentElement.style.setProperty('--x', x + 'px')
    document.documentElement.style.setProperty('--y', y + 'px')
    document.documentElement.style.setProperty('--r', endRadius + 'px')
    // 判断浏览器是否支持document.startViewTransition
    if (document.startViewTransition) {
        // 如果支持就使用document.startViewTransition方法
        document.startViewTransition(() => {
            func.call() // 这里的函数是切换主题的函数，调用changeBtn函数时进行传入
        })
    } else {
        // 如果不支持，就使用最原始的方式，切换主题
        func.call()
    }
}
htmx.on("#is_dark", "click", function (e) {
    let find = this.querySelector("i")
    if (find.getAttribute("class") == "icon icon-yueliang") {
        find.setAttribute("class", "icon icon-taiyang")
        changeBtn(changeTheme, e)
    } else {
        find.setAttribute("class", "icon icon-yueliang")
        changeBtn(changeTheme, e)
    }
})

// 目录生成
function buildToc(target) {
    const content = htmx.find(target.getAttribute('bny-target'))
    const getHeadings = Array.from(content.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    let tocContent = ''
    getHeadings.forEach(heading => {
        const text = (heading.innerText).split(' ').join('_')
        heading.setAttribute('id', text)
        tocContent += `<p class="bny-toc-btn" bny-target="${text}">${heading.innerText}</p>`
    })
    target.innerHTML = tocContent
    htmx.process(target);
}

htmx.on(document.body, "click", function (e) {
    const target = e.target
    // 目录滚动
    if (target.closest(".bny-toc-btn")) {
        // console.log(target)
        const targetId = target.getAttribute("bny-target")
        const targetElement = document.getElementById(targetId)
        targetElement.scrollIntoView({ behavior: "smooth" })
    }
    // 菜单展开
    if (target.closest(".pe-menu")) {
        const content = htmx.find(".wp-left>.bny-nav-lateral")
        const layer = bunny.page({
            title: false,
            content: `<nav class="bny-nav-lateral" hx-ext="bny-nav-lateral">${content.innerHTML}</nav>`,
            width: "220px",
            height: "100%",
            offset: "left",
            shade: true,
            anim: 1
        })
        layer.addEventListener('click', handleLinkClick);
    }
})

htmx.defineExtension('bny-toc', {
    onEvent: function (name, evt) {
        if (name === 'htmx:afterProcessNode') {
            const toc = evt.target
            if (toc.getAttribute('hx-ext') == 'bny-toc') {
                buildToc(toc)
            }
        }
    }
})

function page(target) {
    const path = window.location.pathname
    const a_s = htmx.findAll(`.wp-default .bny-nav-body a[href]:not([href="javascript:;"])`)
    let previous = ""
    let next = ""
    a_s.forEach(function (v, k) {
        if (v.getAttribute("href") == path) {
            if (a_s[k - 1]) {
                const previous_href = a_s[k - 1].getAttribute("href")
                const previous_text = a_s[k - 1].innerText
                previous = `<a href="${previous_href}" class="bny-btn">
                                <span>上一页</span>
                                <span class="text-secondary">${previous_text}</span>
                            </a>`
            }
            if (a_s[k + 1]) {
                const next_href = a_s[k + 1].getAttribute("href")
                const next_text = a_s[k + 1].innerText
                next = `<a href="${next_href}" class="bny-btn">
                            <span>下一页</span>
                            <span class="text-secondary">${next_text}</span>
                        </a>`
            }
        }
    })
    target.innerHTML = previous + next
    htmx.process(target);
}

// 分页
htmx.defineExtension('bny-page', {
    onEvent: function (name, evt) {
        if (name === 'htmx:afterProcessNode') {
            page(evt.target)
        }
    }
})
