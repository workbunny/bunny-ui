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
            }, 225)
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
            }, 225)
        });

        // 阻止点击确认框时冒泡到遮罩层
        confirmBox.addEventListener("click", event => {
            if ((event.target.closest('.border-muted') && cancel()) ||
                (event.target.closest('.border-warning') && yes())) {
                confirmBox.classList.add("bny-anim-scalesmall")
                setTimeout(function () {
                    shield.remove();
                }, 225)
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
                }, 225)
            })
        } else {
            setTimeout(() => {
                alert.querySelector(".bny-alert>div").classList.add("bny-anim-scalesmall")
                setTimeout(function () {
                    alert.remove()
                }, 225)
            }, time)
        }
    }

    /**
     * 打开一个新的窗口
     * @param {Object} options - 窗口配置选项
     * @param {string|false} [options.title="信息"] - 窗口的标题
     * @param {string} [options.content=""] - 窗口的内容，可以是文本或URL
     * @param {string} [options.width="680px"] - 窗口的宽度
     * @param {string} [options.height="520px"] - 窗口的高度
     * @param {string|Array} [options.offset="auto"] - 窗口的位置，可选值为"auto"、"top"、"bottom"、"left"、"right" 或数组形式的位置坐标
     * @param {boolean} [options.shade=false] - 是否显示遮罩层 点击遮罩层关闭窗口
     * @param {number} [options.anim=0] - 窗口的动画效果，可选值为0、1、2、3、4
     * @returns {void}
     */
    page({ title = "信息", content = "", width = "680px", height = "520px", offset = "auto", shade = false, anim = 0 }) {

        // 判断内容是否是链接
        if (content.startsWith("http://") || content.startsWith("https://")) {
            content = `<iframe src="${content}"></iframe>`;
        }
        const page = document.createElement("div")
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        if (width === "100%") {
            width = windowWidth + "px"
        }
        if (height === "100%") {
            height = windowHeight + "px"
        }
        const num = document.querySelectorAll(".bny-page").length
        let currentX = parseInt(width) >= windowWidth ? 0 : ((windowWidth - parseInt(width)) / 2) + (num * 10)
        let currentY = parseInt(height) >= windowHeight ? 0 : ((windowHeight - parseInt(height)) / 2) + (num * 10)
        switch (offset) {
            case "auto":
                Object.assign(page.style, {
                    width,
                    height,
                    left: `${currentX}px`,
                    top: `${currentY}px`
                });
                break;
            case "top":
                Object.assign(page.style, {
                    width,
                    height,
                    // 窗口的水平中间位置
                    left: `${currentX}px`,
                    top: '0'
                })
                break;
            case "bottom":
                Object.assign(page.style, {
                    width,
                    height,
                    // 窗口的水平中间位置
                    left: `${currentX}px`,
                    top: `${windowHeight - parseInt(height)}px`
                })
                break;
            case "left":
                Object.assign(page.style, {
                    width,
                    height,
                    left: '0',
                    top: `${currentY}px`
                })
                break;
            case "right":
                Object.assign(page.style, {
                    width,
                    height,
                    left: `${windowWidth - parseInt(width)}px`,
                    top: `${currentY}px`
                })
                break;
            default:
                Object.assign(page.style, {
                    width,
                    height,
                    left: `${offset[0]}`,
                    top: `${offset[1]}`
                })
        }
        page.className = "bny-page";
        let anim_class = ["bny-anim-scale", "bny-anim-scalesmall"]
        switch (anim) {
            case 1:
                anim_class[0] = "bny-anim-left"
                anim_class[1] = "bny-anim-leftOut"
                break;
            case 2:
                anim_class[0] = "bny-anim-right"
                anim_class[1] = "bny-anim-rightOut"
                break;
            case 3:
                anim_class[0] = "bny-anim-up"
                anim_class[1] = "bny-anim-upOut"
                break;
            case 4:
                anim_class[0] = "bny-anim-down"
                anim_class[1] = "bny-anim-downOut"
                break;
        }
        let is_title = "";
        if (title === false) {
            is_title = "display:none"
        }
        page.classList.add(anim_class[0]);
        page.innerHTML = `
          <div class="bny-page-header" style="${is_title}">
            <div class="bny-page-title">${title}</div>
            <div class="bny-page-setwin">
              <span class="icon icon-jian min-auto"></span>
              <span class="icon icon-quanping zoom"></span>
              <span class="icon icon-cuo close-btn"></span>
            </div>
          </div>
          <div class="bny-page-content">${content}</div>
        `;

        this.#initDrag(page.querySelector(".bny-page-header"), page);
        this.#initResize(page.querySelector(".zoom"), page, width, height, currentX, currentY);
        this.#initMinimize(page.querySelector(".min-auto"), page, num, width, height, currentX, currentY);

        page.addEventListener('click', () => {
            // 获取所有的 div 元素
            let pageZindex = document.querySelectorAll('.bny-page');
            let maxZIndex = 0;
            // 遍历所有的 div 元素
            for (let i = 0; i < pageZindex.length; i++) {
                let div = pageZindex[i];
                // 获取当前 div 的 z-index 值
                const zIndex = parseInt(window.getComputedStyle(div).zIndex);
                if (zIndex > maxZIndex) {
                    maxZIndex = zIndex;
                }
            }
            page.style.zIndex = maxZIndex + 1;
        });
        // 关闭按钮
        if (shade) {
            const shade = document.createElement("div")
            shade.className = "bny-layer"
            shade.appendChild(page)
            document.body.appendChild(shade)
            shade.addEventListener("click", e => {
                if (e.target === shade) {
                    page.classList.add(anim_class[1])
                    setTimeout(() => shade.remove(), 225)
                } else {
                    e.stopPropagation()
                }
            })
        } else {
            document.body.appendChild(page);
            page.querySelector(".close-btn").addEventListener("click", e => {
                page.classList.add(anim_class[1]);
                setTimeout(() => page.remove(), 225);
                e.stopPropagation();
            });
        }
    }

    #initDrag(header, page) {
        let startX, startY, newX, newY;
        header.addEventListener('mousedown', e => {
            [startX, startY] = [e.clientX, e.clientY];
            [newX, newY] = [parseInt(page.style.left), parseInt(page.style.top)];
            page.classList.add('dragging');
        });
        document.addEventListener('mousemove', e => {
            if (!page.classList.contains('dragging')) return;
            Object.assign(page.style, {
                left: `${newX + e.clientX - startX}px`,
                top: `${newY + e.clientY - startY}px`
            });
        });
        document.addEventListener('mouseup', () => page.classList.remove('dragging'));
    }

    #initResize(zoomBtn, page, width, height, currentX, currentY) {
        zoomBtn.addEventListener('click', e => {
            if (zoomBtn.classList.contains('icon-quanping')) {
                Object.assign(page.style, { width: '100%', height: '100%', top: '0', left: '0' });
                zoomBtn.classList.remove('icon-quanping');
                zoomBtn.classList.add('icon-suoxiao');
            } else {
                Object.assign(page.style, { width, height, top: `${currentY}px`, left: `${currentX}px` });
                zoomBtn.classList.remove('icon-suoxiao');
                zoomBtn.classList.add('icon-quanping');
            }
            e.stopPropagation();
        });
    }

    #initMinimize(minBtn, page, num, width, height, currentX, currentY) {
        minBtn.addEventListener('click', e => {
            if (minBtn.classList.contains('icon-jian')) {
                Object.assign(page.style, { width: '125px', height: 'min-content', bottom: '0', left: `${num * 125}px`, top: 'unset' });
                page.querySelector('.bny-page-content').style.display = 'none';
                page.querySelector('.zoom').style.display = 'none';
                minBtn.classList.remove('icon-jian');
                minBtn.classList.add('icon-fuzhi');
            } else {
                Object.assign(page.style, { width, height, top: `${currentY}px`, left: `${currentX}px`, bottom: 'unset' });
                page.querySelector('.bny-page-content').style.display = 'block';
                page.querySelector('.zoom').style.display = 'inline-block';
                page.querySelector('.zoom').classList.replace('icon-suoxiao', 'icon-quanping');
                minBtn.classList.remove('icon-fuzhi');
                minBtn.classList.add('icon-jian');
            }
            e.stopPropagation();
        });
    }
}


export default bunny