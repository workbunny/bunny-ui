
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

// 点击切换主题
htmx.on("#is_dark", "click", function (e) {
    // console.log(e.target)
    let find = htmx.find("#is_dark>i")
    if (find.getAttribute("class") == "icon icon-yueliang") {
        find.setAttribute("class", "icon icon-taiyang")
        changeBtn(changeTheme, e)
    } else {
        find.setAttribute("class", "icon icon-yueliang")
        changeBtn(changeTheme, e)
    }
})

// 默认点击一次菜单
let is_menu = false

// 此事件在 htmx 将新节点加载到 DOM 中时触发。
document.body.addEventListener("htmx:load", function (event) {
    if (!is_menu) {
        const menu = htmx.find(".bny-layout-side .bny-nav-lateral")
        if (menu) {
            const item = htmx.find(menu, "li>a")
            item.click()
            is_menu = true
        }
    }
});

/**
 * 使文档进入全屏模式。
 * 此函数尝试使用不同的浏览器 API 来请求全屏模式。
 * 如果浏览器不支持全屏调用，则会在控制台输出错误信息。
 */
function fullScreen() {
    // 获取文档的根元素
    var el = document.documentElement;
    // 尝试获取标准的全屏请求方法或 WebKit 浏览器的全屏请求方法
    var rfs = el.requestFullScreen || el.webkitRequestFullScreen;
    // 检查是否存在标准的全屏请求方法
    if (typeof rfs != "undefined" && rfs) {
        // 调用全屏请求方法
        rfs.call(el);
    }
    // 检查是否是支持 ActiveXObject 的旧版 IE 浏览器
    else if (typeof window.ActiveXObject != "undefined") {
        // 创建一个 WScript.Shell 对象
        var wscript = new ActiveXObject("WScript.Shell");
        // 检查对象是否创建成功
        if (wscript != null) {
            // 模拟按下 F11 键来进入全屏模式
            wscript.SendKeys("{F11}");
        }
    }
    // 检查是否支持 Microsoft 的全屏请求方法
    else if (el.msRequestFullscreen) {
        // 调用 Microsoft 的全屏请求方法
        el.msRequestFullscreen();
    }
    // 检查是否支持 Opera 的全屏请求方法
    else if (el.oRequestFullscreen) {
        // 调用 Opera 的全屏请求方法
        el.oRequestFullscreen();
    }
    // 检查是否支持 WebKit 浏览器的全屏请求方法
    else if (el.webkitRequestFullscreen) {
        // 调用 WebKit 浏览器的全屏请求方法
        el.webkitRequestFullscreen();
    }
    // 检查是否支持 Mozilla 的全屏请求方法
    else if (el.mozRequestFullScreen) {
        // 调用 Mozilla 的全屏请求方法
        el.mozRequestFullScreen();
    }
    // 如果以上方法都不支持
    else {
        // 在控制台输出错误信息
        console.error('浏览器不支持全屏调用！');
    }
}

/**
 * 退出全屏模式。
 * 此函数尝试使用不同的浏览器 API 来退出全屏模式。
 * 如果浏览器不支持退出全屏调用，则会显示错误信息。
 */
function exitFullScreen() {
    // 获取文档对象
    var el = document;
    // 尝试获取标准的退出全屏方法或不同浏览器的退出全屏方法
    var cfs = el.cancelFullScreen || el.webkitCancelFullScreen || el.exitFullScreen;
    // 检查是否存在标准的退出全屏方法
    if (typeof cfs != "undefined" && cfs) {
        // 调用退出全屏方法
        cfs.call(el);
    }
    // 检查是否是支持 ActiveXObject 的旧版 IE 浏览器
    else if (typeof window.ActiveXObject != "undefined") {
        // 创建一个 WScript.Shell 对象
        var wscript = new ActiveXObject("WScript.Shell");
        // 检查对象是否创建成功
        if (wscript != null) {
            // 模拟按下 F11 键来退出全屏模式
            wscript.SendKeys("{F11}");
        }
    }
    // 检查是否支持 Microsoft 的退出全屏方法
    else if (el.msExitFullscreen) {
        // 调用 Microsoft 的退出全屏方法
        el.msExitFullscreen();
    }
    // 检查是否支持 Opera 的退出全屏方法
    else if (el.oRequestFullscreen) {
        // 调用 Opera 的退出全屏方法
        el.oCancelFullScreen();
    }
    // 检查是否支持 Mozilla 的退出全屏方法
    else if (el.mozCancelFullScreen) {
        // 调用 Mozilla 的退出全屏方法
        el.mozCancelFullScreen();
    }
    // 检查是否支持 WebKit 浏览器的退出全屏方法
    else if (el.webkitCancelFullScreen) {
        // 调用 WebKit 浏览器的退出全屏方法
        el.webkitCancelFullScreen();
    }
    // 如果以上方法都不支持
    else {
        // 显示错误信息
        miniAdmin.error('浏览器不支持全屏调用！');
    }
}

// 点击是否全屏
htmx.on("#fullScreen", "click", function (e) {
    const i = htmx.find("#fullScreen>i")
    if (i.getAttribute("class") == "icon icon-quanping") {
        i.setAttribute("class", "icon icon-suoxiao")
        fullScreen()
    } else {
        i.setAttribute("class", "icon icon-quanping")
        exitFullScreen()
    }
})

// 点击伸缩菜单
htmx.on("#left-menu", "click", function (e) {
    const layout = htmx.find(".bny-layout")
    const menu = htmx.find(".bny-layout-side .bny-nav-lateral")

    if (window.innerWidth < 768) {
        bunny.page({
            title: false,
            content: `<nav class="bny-nav-lateral" hx-ext="bny-nav-lateral">${menu.innerHTML}</nav>`,
            width: "220px",
            height: "100%",
            offset: "left",
            anim: 1,
            shade: true,
        })
        const layer = htmx.find(".bny-layer")
        // htmx.process(layer)
    } else {
        if (layout.classList.contains("mini-menu")) {
            layout.classList.remove("mini-menu")
            menu.classList.remove("nav-toggle")
        } else {
            layout.classList.add("mini-menu")
            menu.classList.add("nav-toggle")
        }
    }
})