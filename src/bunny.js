/**
 * bunny.js
 */
class bunny {
    constructor() {
        this.v = "0.0.4"
    }

    /**
     * 消息
     * @param {Object} options 配置
     * @param {String} options.text 内容
     * @param {String} options.style 样式
     * @param {Function} options.fn 回调
     * @param {Number} options.time 时间
     */
    msg({ text = "消息", style = "bg-white", fn = () => { }, time = 2000 }) {
        const layer = document.createElement("div")
        layer.className = "bny-layer bny-anim-scale"
        layer.innerHTML =
            `<div class="bny-msg ${style}">
            ${text}
        </div>`
        document.body.appendChild(layer)
        setTimeout(() => {
            layer.classList.add("bny-anim-scalesmall")
            setTimeout(function () {
                layer.remove()
            }, 230)
            fn(layer)
        }, time)
    }

    /**
     * 确认框
     * @param {Object} options 配置
     * @param {String} options.title 标题
     * @param {String} options.text 内容
     * @param {Function} options.yes 确定回调
     * @param {Function} options.cancel 取消回调
     */
    confirm({ title = "提示", text = "", yes = () => true, cancel = () => true }) {
        // 创建遮罩层和确认框元素
        const shield = document.createElement("div")
        const confirmBox = document.createElement("div")

        // 设置样式类
        shield.className = "bny-shield"
        confirmBox.className = "bny-confirm bny-anim-scale"

        // 创建确认框的HTML结构
        confirmBox.innerHTML = `
        <div class="bny-confirm-title">${title}</div>
        <p class="bny-confirm-body">${text}</p>
        <div class="bny-confirm-btn">
            <div class="bny-btn-group">
                <button class="bny-btn border-warning">确定</button>
                <button class="bny-btn border-muted">取消</button>
            </div>
        </div>`

        // 添加点击事件到遮罩层（关闭模态）
        shield.addEventListener("click", function handleClick(event) {
            confirmBox.classList.add("bny-anim-scalesmall")
            setTimeout(function () {
                shield.remove();
            }, 230)
        });

        // 阻止点击确认框时冒泡到遮罩层
        confirmBox.addEventListener("click", event => {
            if ((event.target.closest('.border-muted') && cancel()) ||
                (event.target.closest('.border-warning') && yes())) {
                confirmBox.classList.add("bny-anim-scalesmall")
                setTimeout(function () {
                    shield.remove();
                }, 230)
            }
            event.stopPropagation()
        });

        // 将确认框添加到遮罩层，再将遮罩层添加到body中
        shield.appendChild(confirmBox)
        document.body.appendChild(shield)
    }

    /**
     * 警告框
     * @param {Object} options 配置
     * @param {String} options.text 内容
     * @param {String} options.style 样式
     * @param {Boolean} options.del 是否可关闭
     * @param {Number} options.time 时间
     */
    alert({ text = "这是警告信息！", style = "alert-primary", del = false, time = 3000 }) {
        let del_text = ""
        if (del) {
            del_text = `<span class="alert-del">X</span>`
        }
        const alert = document.createElement("div")
        alert.className = `bny-layer`
        alert.innerHTML = `<div class="bny-alert bny-anim-up">
            <div class="${style}">
            ${text}${del_text}
            </div>
        </div>`
        document.body.appendChild(alert)

        if (del) {
            alert.querySelector(".alert-del").addEventListener("click", function () {
                alert.querySelector(".bny-alert>div").classList.add("bny-anim-scalesmall")
                setTimeout(function () {
                    alert.remove()
                }, 230)
            })
        } else {
            setTimeout(() => {
                alert.querySelector(".bny-alert>div").classList.add("bny-anim-scalesmall")
                setTimeout(function () {
                    alert.remove()
                }, 230)
            }, time)
        }


    }
}


export default bunny