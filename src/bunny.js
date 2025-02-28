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
    alert({ text = "警告信息！", style = "alert-primary", del = false, time = 3000 }) {
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

    /**
     * 打开一个新的窗口
     * @param {Object} options - 窗口配置选项
     * @param {string} [options.title="信息"] - 窗口的标题
     * @param {string} [options.content=""] - 窗口的内容，可以是文本或URL
     * @param {string} [options.width="680px"] - 窗口的宽度
     * @param {string} [options.height="520px"] - 窗口的高度
     */
    open({ title = "信息", content = "", width = "680px", height = "520px" } = {}) {

        // 判断内容是否是链接
        if (content.startsWith("http://") || content.startsWith("https://")) {
            content = `<iframe src="${content}"></iframe>`;
        }

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const num = document.querySelectorAll(".bny-open").length;
        let currentX = parseInt(width) >= windowWidth ? 0 : ((windowWidth - parseInt(width)) / 2) + (num * 10);
        let currentY = parseInt(height) >= windowHeight ? 0 : ((windowHeight - parseInt(height)) / 2) + (num * 10);

        const open = document.createElement("div");
        Object.assign(open.style, {
            width,
            height,
            left: `${currentX}px`,
            top: `${currentY}px`
        });
        open.className = "bny-open bny-anim-scale";
        open.innerHTML = `
          <div class="bny-open-header">
            <div class="bny-open-title">${title}</div>
            <div class="bny-open-setwin">
              <span class="icon icon-jian min-auto"></span>
              <span class="icon icon-quanping zoom"></span>
              <span class="icon icon-cuo close-btn"></span>
            </div>
          </div>
          <div class="bny-open-content">${content}</div>
        `;

        document.body.appendChild(open);

        this.#initDrag(open.querySelector(".bny-open-header"), open);
        this.#initResize(open.querySelector(".zoom"), open, width, height, currentX, currentY);
        this.#initMinimize(open.querySelector(".min-auto"), open, num, width, height, currentX, currentY);

        open.addEventListener('click', () => {
            // 获取所有的 div 元素
            let openZindex = document.querySelectorAll('.bny-open');
            let maxZIndex = 0;
            // 遍历所有的 div 元素
            for (let i = 0; i < openZindex.length; i++) {
                let div = openZindex[i];
                // 获取当前 div 的 z-index 值
                const zIndex = parseInt(window.getComputedStyle(div).zIndex);
                if (zIndex > maxZIndex) {
                    maxZIndex = zIndex;
                }
            }
            open.style.zIndex = maxZIndex + 1;
        });

        open.querySelector(".close-btn").addEventListener("click", e => {
            open.classList.add("bny-anim-scalesmall");
            setTimeout(() => open.remove(), 230);
            e.stopPropagation();
        });
    }

    #initDrag(header, open) {
        let startX, startY, newX, newY;
        header.addEventListener('mousedown', e => {
            [startX, startY] = [e.clientX, e.clientY];
            [newX, newY] = [parseInt(open.style.left), parseInt(open.style.top)];
            open.classList.add('dragging');
        });
        document.addEventListener('mousemove', e => {
            if (!open.classList.contains('dragging')) return;
            Object.assign(open.style, {
                left: `${newX + e.clientX - startX}px`,
                top: `${newY + e.clientY - startY}px`
            });
        });
        document.addEventListener('mouseup', () => open.classList.remove('dragging'));
    }

    #initResize(zoomBtn, open, width, height, currentX, currentY) {
        zoomBtn.addEventListener('click', e => {
            if (zoomBtn.classList.contains('icon-quanping')) {
                Object.assign(open.style, { width: '100%', height: '100%', top: '0', left: '0' });
                zoomBtn.classList.remove('icon-quanping');
                zoomBtn.classList.add('icon-suoxiao');
            } else {
                Object.assign(open.style, { width, height, top: `${currentY}px`, left: `${currentX}px` });
                zoomBtn.classList.remove('icon-suoxiao');
                zoomBtn.classList.add('icon-quanping');
            }
            e.stopPropagation();
        });
    }

    #initMinimize(minBtn, open, num, width, height, currentX, currentY) {
        minBtn.addEventListener('click', e => {
            if (minBtn.classList.contains('icon-jian')) {
                Object.assign(open.style, { width: '125px', height: 'min-content', bottom: '0', left: `${num * 125}px`, top: 'unset' });
                open.querySelector('.bny-open-content').style.display = 'none';
                open.querySelector('.zoom').style.display = 'none';
                minBtn.classList.remove('icon-jian');
                minBtn.classList.add('icon-fuzhi');
            } else {
                Object.assign(open.style, { width, height, top: `${currentY}px`, left: `${currentX}px`, bottom: 'unset' });
                open.querySelector('.bny-open-content').style.display = 'block';
                open.querySelector('.zoom').style.display = 'inline-block';
                open.querySelector('.zoom').classList.replace('icon-suoxiao', 'icon-quanping');
                minBtn.classList.remove('icon-fuzhi');
                minBtn.classList.add('icon-jian');
            }
            e.stopPropagation();
        });
    }
}


export default bunny