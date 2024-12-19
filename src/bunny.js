/**
 * bunny.js
 */
let bunny = function () {
    this.v = "0.0.1"
}

/**
 * 确认框
 * @param {Object} options 配置
 * @param {String} options.title 标题
 * @param {String} options.text 内容
 * @param {Function} options.yes 确定回调
 * @param {Function} options.cancel 取消回调
 */
bunny.prototype.confirm = function (options) {
    // 配置
    let config = {
        title: "提示",
        text: "",
        yes: () => { return true },
        cancel: () => { return true }
    }
    // 合并配置
    options.title = options.title || config.title
    options.yes = options.yes || config.yes
    options.cancel = options.cancel || config.cancel

    // 遮罩层
    const shield = document.createElement("div")
    shield.className = "bny-shield"
    // 遮罩层事件
    shield.addEventListener("click", function () {
        shield.remove()
    })
    // 确认框
    const confirm = document.createElement("div")
    confirm.className = "bny-confirm"
    // 确认框事件
    confirm.addEventListener("click", function (e) {
        e.stopPropagation()
    })
    // 确认框标题
    const title = document.createElement("div")
    title.className = "bny-confirm-title"
    title.innerText = options.title
    // 确认框内容
    const body = document.createElement("p")
    body.className = "bny-confirm-body"
    body.innerText = options.text
    // 确认框按钮
    const btn = document.createElement("div")
    btn.className = "bny-confirm-btn"
    // 确认框按钮组
    const btnGroup = document.createElement("div")
    btnGroup.className = "bny-btn-group"
    // 确认框按钮组按钮
    const btnGroupBtn = document.createElement("button")
    btnGroupBtn.className = "bny-btn border-warning"
    btnGroupBtn.innerText = "确定"
    // 确认框按钮组按钮
    const btnGroupBtn2 = document.createElement("button")
    btnGroupBtn2.className = "bny-btn border-muted"
    btnGroupBtn2.innerText = "取消"
    // 确认框按钮组按钮事件
    btnGroupBtn.addEventListener("click", function () {
        // 运行发送请求
        if (options.yes()) {
            shield.remove()
        }
    })
    // 确认框按钮组按钮事件
    btnGroupBtn2.addEventListener("click", function () {
        if (options.cancel()) {
            shield.remove()
        }
    })
    // 确认框按钮组按钮添加到按钮组
    btnGroup.appendChild(btnGroupBtn)
    btnGroup.appendChild(btnGroupBtn2)
    // 确认框按钮添加到确认框
    btn.appendChild(btnGroup)
    // 确认框标题、内容、按钮添加到确认框
    confirm.appendChild(title)
    confirm.appendChild(body)
    confirm.appendChild(btn)
    // 确认框添加到遮罩层
    shield.appendChild(confirm)
    // 遮罩层添加到body
    document.body.appendChild(shield)
}

export default bunny