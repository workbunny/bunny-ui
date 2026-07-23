window.bny = {
    /**
     * 查询子元素
     * 
     * @param {HTMLElement} elt 元素
     * @param {String} cssSelector CSS选择器
     * @returns {HTMLElement|null} 子元素
     */
    queryChild: function (elt, cssSelector) {
        return elt?.querySelector(":scope>" + cssSelector) ?? null
    },
    /**
     * 查询所有子元素
     * 
     * @param {HTMLElement} elt 元素
     * @param {String} cssSelector CSS选择器
     * @returns {NodeList} 子元素数组
     */
    queryChildAll: function (elt, cssSelector) {
        return elt.querySelectorAll(":scope>" + cssSelector)
    },
    /**
     * 获取元素在数组中的索引
     * 
     * @param {HTMLElement} elt 元素
     * @returns {Number|null} 索引
     */
    indexOf: function (elt) {
        if (!elt.parentElement) return null
        return Array.from(elt.parentElement.children)
            .indexOf(elt);
    },
    /**
     * 动画播放器
     * 
     * @param {HTMLElement} elt 元素 
     * @param {String} anim 动画名称 
     * @param {Boolean} status 状态 默认 true, true 开始 false 结束
     * @param {Function} fn 动画结束回调函数 默认空函数
     */
    animPlayer: function (elt, anim, status = true, fn = () => { }) {
        if (!["scale", "left", "right", "down", "up"].includes(anim)) {
            anim = "scale"
        }
        if (status) {
            elt.classList.add(`bny-anim-${anim}`)
            elt.classList.remove(`bny-anim-${anim}Out`)
        } else {
            elt.classList.remove(`bny-anim-${anim}`)
            elt.classList.add(`bny-anim-${anim}Out`)
        }
        const handleAnimationEnd = () => {
            fn()
            elt.removeEventListener('animationend', handleAnimationEnd)
        }
        elt.addEventListener('animationend', handleAnimationEnd)
    },
    /**
     * 转义HTML特殊字符
     * 
     * @param {String} str 输入字符串
     * @returns {String} 转义后的字符串
     */
    escapeChars: function (str) {
        if (typeof str !== 'string') {
            str = String(str);
        }
        // 定义需要转义的特殊字符映射表
        const escapeMap = {
            '&': '&amp;',    // 和号
            '<': '&lt;',     // 小于号
            '>': '&gt;',     // 大于号
            '"': '&quot;',   // 双引号
            "'": '&#39;',    // 单引号
            '/': '&#x2F;',   // 斜杠
            '`': '&#x60;',   // 反引号
            '=': '&#x3D;'    // 等号（预防XSS常用）
        };
        // 生成匹配所有需要转义字符的正则表达式
        const escapeRegex = new RegExp(Object.keys(escapeMap).join('|'), 'g');
        // 替换字符串中的特殊字符
        return str.replace(escapeRegex, match => escapeMap[match]);
    },
    /**
     * 检查元素是否有指定的htmx扩展名
     * 
     * @param {HTMLElement} elt 元素
     * @param {String} ext 扩展名
     * @returns {Boolean} 是否有扩展名
     */
    hasExtName: function (elt, ext) {
        const attrs = elt.getAttribute('hx-ext')
        if (!attrs) return false
        const exts = attrs.trim().split(/\s+/)
        return exts.includes(ext)
    },
    /**
     * 解析属性字符串
     * 
     * @param {object} obj 属性对象
     * @returns {String} 属性字符串
     */
    parAttrStr: function (obj) {
        let str = ""
        for (const key in obj) {
            str += ` ${key}="${obj[key]}" `
        }
        return str
    },
    /**
     * 移除元素的类名
     * 
     * @param {Object|Array|HTMLElement} elt 元素或元素数组或者元素对象
     * @param {String} cls 类名
     */
    removeClass: function (elt, cls) {
        if (!elt) console.error('removeClass: 元素不存在')
        if (typeof elt === 'object') {
            Object.keys(elt).forEach((key) => {
                elt[key].classList.remove(cls)
            })
        }
        if (Array.isArray(elt) || elt instanceof NodeList) {
            Array.from(elt).forEach(e => e.classList.remove(cls))
            return
        }
        if (elt.classList) {
            elt.classList.remove(cls)
        }
    },
    /**
     * 检查元素是否有指定的类名
     * 
     * @param {HTMLElement} elt 元素
     * @param {String} cls 类名
     * @returns {Boolean} 是否有类名
     */
    hasClass: function (elt, cls) {
        return elt.classList?.contains(cls) || false
    },
    /**
     * 获取/创建 alert 共享容器（单例，多个 alert 在容器内垂直堆叠，避免重叠在屏幕中心）
     *
     * @returns {HTMLElement} 容器元素
     */
    alertContainer: function () {
        let box = document.getElementById('bny-alert-box')
        if (!box) {
            box = document.createElement('div')
            box.id = 'bny-alert-box'
            box.className = 'bny-alert-box'
            document.body.appendChild(box)
        }
        return box
    },
    /**
     * 显示警示弹窗
     * 
     * @param {String} msg 消息
     * @param {Number} code 状态码 默认0
     * @param {String} anim 动画 默认scale
     * @param {Number} time 时间 默认3秒
     */
    alert: function (msg, code = 0, anim = 'scale', time = 3) {

        /**
         * 根据状态码获取颜色
         * 
         * @param {number} code 状态码
         * @returns {string} 颜色
         */
        function type(code) {
            switch (code) {
                case 1:
                    return 'green'
                case 2:
                    return 'yellow'
                case 3:
                    return 'red'
                case 4:
                    return 'blue'
                default:
                    return ''
            }
        }
        const color = type(code) // 获取颜色
        // 创建 alert 元素（直接挂入共享容器，多条按调用顺序自上而下堆叠，不再重叠）
        const alert = document.createElement('div')
        alert.classList.add('bny-alert', `bny-anim-${anim}`)
        alert.setAttribute('color', color)
        alert.style.width = 'auto'
        alert.innerHTML = bny.escapeChars(msg)
        // 关闭按钮：允许用户主动关闭
        const closeBtn = document.createElement('i')
        closeBtn.className = 'bny-icon icon-close bny-alert-close'
        closeBtn.setAttribute('title', '关闭')
        alert.appendChild(closeBtn)
        // 挂到共享容器
        this.alertContainer().appendChild(alert)
        // 计时器句柄，便于提前关闭时清除
        let timer = null
        const removeAlert = () => {
            if (timer) { clearTimeout(timer); timer = null }
            // 防止重复移除
            if (!alert.parentElement) return
            this.animPlayer(alert, anim, false, () => {
                alert.remove()
                // 容器内无 alert 时移除容器，避免空白占位
                const box = document.getElementById('bny-alert-box')
                if (box && box.children.length === 0) box.remove()
            })
        }
        closeBtn.addEventListener('click', removeAlert)
        // 设置定时器，移除 alert
        timer = setTimeout(removeAlert, time * 1000)
    },
    /**
     * 显示确认弹窗
     * 
     * @param {String} msg 消息
     * @param {Object} options 选项
     * @param {String} options.title 标题 默认 提示
     * @param {String} options.anim 动画 默认 scale
     * @param {Function} options.yes_cb 确认回调 默认空函数
     * @param {Function} options.no_cb 取消回调 默认空函数
     */
    confirm: function (
        msg = '确认操作吗？',
        options = {
            title: "提示",
            anim: 'scale',
            yes_cb: () => { },
            no_cb: () => { },
        }) {
        const title = options.title ?? '提示'
        const anim = options.anim ?? 'scale'
        const yes_cb = options.yes_cb ?? (() => { })
        const no_cb = options.no_cb ?? (() => { })
        // 创建confirm_shield元素
        const confirm_shield = document.createElement('div')
        confirm_shield.classList.add('bny-confirm-shield')
        // 创建confirm元素
        const confirm = document.createElement('div')
        confirm.classList.add('bny-confirm', `bny-anim-${anim}`)
        // 创建title元素
        const confirm_title = document.createElement('h3')
        confirm_title.classList.add('title')
        confirm_title.innerHTML = bny.escapeChars(title)
        // 创建content元素
        const confirm_content = document.createElement('p')
        confirm_content.classList.add('content')
        confirm_content.innerHTML = bny.escapeChars(msg)
        // 创建btn元素
        const confirm_btn = document.createElement('div')
        confirm_btn.classList.add('btn')
        // 创建确认按钮
        const confirm_yes = document.createElement('button')
        confirm_yes.classList.add('bny-btn')
        confirm_yes.setAttribute('color', 'blue')
        confirm_yes.innerHTML = '确认'
        // 创建取消按钮
        const confirm_no = document.createElement('button')
        confirm_no.classList.add('bny-btn')
        confirm_no.innerHTML = '取消'

        // 统一关闭函数（避免多次绑定重复动画）
        let closed = false
        const close = (cb) => {
            if (closed) return
            closed = true
            // 关闭时移除键盘监听，避免泄漏
            document.removeEventListener('keydown', onKeydown)
            this.animPlayer(confirm, anim, false, () => {
                confirm_shield.remove()
                if (typeof cb === 'function') cb()
            })
        }

        // 点击遮罩层时关闭弹窗（视为取消）
        confirm_shield.addEventListener('click', (e) => {
            // 只有点击confirm_shield本身时才关闭弹窗
            if (e.target === confirm_shield) {
                close(no_cb)
            }
        })
        // 点击确认按钮时调用确认回调
        confirm_yes.addEventListener('click', (e) => {
            close(yes_cb)
        })
        // 点击取消按钮时调用取消回调
        confirm_no.addEventListener('click', (e) => {
            close(no_cb)
        })

        // 键盘支持：ESC 关闭（视为取消）、Enter 确认
        const onKeydown = (e) => {
            // 仅处理当前最上层 confirm（防止多个 confirm 叠加时误触发）
            const top = document.querySelector('.bny-confirm-shield:last-of-type')
            if (top !== confirm_shield) return
            if (e.key === 'Escape') {
                e.preventDefault()
                e.stopPropagation()
                close(no_cb)
            } else if (e.key === 'Enter') {
                e.preventDefault()
                e.stopPropagation()
                close(yes_cb)
            }
        }
        document.addEventListener('keydown', onKeydown)

        // 让确认按钮获得焦点，便于直接按 Enter
        // 等待元素挂载到 DOM 后再聚焦
        requestAnimationFrame(() => confirm_yes.focus())

        // 将确认按钮添加到btn
        confirm_btn.appendChild(confirm_yes)
        // 将取消按钮添加到btn
        confirm_btn.appendChild(confirm_no)
        // 将title添加到confirm
        confirm.appendChild(confirm_title)
        // 将content添加到confirm
        confirm.appendChild(confirm_content)
        // 将btn添加到confirm
        confirm.appendChild(confirm_btn)
        // 将confirm添加到confirm_shield
        confirm_shield.appendChild(confirm)
        // 将confirm_shield添加到body
        document.body.appendChild(confirm_shield)
    },
    /**
     * 显示页面弹窗
     * 
     * @param {String} content 页面内容
     * @param {Object} options 选项
     * @param {String} options.title 标题 默认 页面
     * @param {String} options.anim 动画 默认 scale
     * @param {String} options.width 宽度 默认 680px
     * @param {String} options.height 高度 默认 520px
     * @param {String|Array} options.offset 偏移量 默认 auto , 格式为 ['auto', 'auto'] 或 ['100px', '100px'] 或者 'top' 、'bottom' 、'left' 、'right'
     * @param {Boolean} options.shade 是否显示遮罩层 默认 false
     * @returns {HTMLElement} 页面元素
     */
    page: function (content, options = {}) {

        /**
         * 判断字符串是否为安全的可被 iframe 加载的 http/https 链接
         * 拒绝 javascript:、data:、vbscript: 等危险协议，防止 XSS
         * @param {String} str
         * @returns {Boolean}
         */
        function isSafeUrl(str) {
            if (typeof str !== 'string') return false
            // 去除首尾空白与可能的前置控制字符
            const s = str.trim().replace(/^[\u0000-\u001F\u007F]+/, '')
            return /^https?:\/\//i.test(s)
        }

        /**
         * 页面拖动
         * @param {HTMLElement} page 页面元素
         * @param {Function} onUnmount 返回解绑函数的注册器（用于关闭时解绑 document 监听）
         */
        function drag(page, onUnmount) {
            const header = page.querySelector('.header')
            let startX, startY, newX, newY;
            // 命名函数引用，便于解绑，避免每次创建 page 都向 document 永久挂监听器
            const onMove = (e) => {
                if (!page.classList.contains('dragging')) return;
                Object.assign(page.style, {
                    left: `${newX + e.clientX - startX}px`,
                    top: `${newY + e.clientY - startY}px`
                });
            };
            const onUp = () => page.classList.remove('dragging');
            header.addEventListener('mousedown', e => {
                // 只允许主键拖动，且不在按钮上触发（避免点击 setwin 时拖动）
                if (e.button !== 0) return;
                if (e.target.closest('.setwin')) return;
                [startX, startY] = [e.clientX, e.clientY];
                [newX, newY] = [parseInt(page.style.left), parseInt(page.style.top)];
                page.classList.add('dragging');
            });
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            // 注册解绑，page 关闭时清理
            onUnmount(() => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            });
        }

        /**
         * 页面缩放
         * @param {HTMLElement} page 页面元素
         * @param {String} width 宽度
         * @param {String} height 高度
         * @param {Number} currentX 当前X轴偏移量
         * @param {Number} currentY 当前Y轴偏移量
         */
        function resize(page, width, height, currentX, currentY) {
            const zoomBtn = page.querySelector('.zoom')
            zoomBtn.addEventListener('click', (e) => {
                if (zoomBtn.classList.contains('icon-fullscreen')) {
                    Object.assign(page.style, { width: '100%', height: '100%', top: '0', left: '0' });
                    zoomBtn.classList.remove('icon-fullscreen');
                    zoomBtn.classList.add('icon-fullscreen-exit');
                } else {
                    Object.assign(page.style, { width, height, top: `${currentY}px`, left: `${currentX}px` });
                    zoomBtn.classList.remove('icon-fullscreen-exit');
                    zoomBtn.classList.add('icon-fullscreen');
                }
                e.stopPropagation();
            });
        }

        /**
         * 页面最小化
         * @param {HTMLElement} page 页面元素
         * @param {Number} num 页面编号
         * @param {String} width 宽度
         * @param {String} height 高度
         * @param {Number} currentX 当前X轴偏移量
         * @param {Number} currentY 当前Y轴偏移量
         */
        function minimize(page, num, width, height, currentX, currentY) {
            const minBtn = page.querySelector('.min-auto')
            const pageShade = page.parentElement
            minBtn.addEventListener('click', e => {
                if (minBtn.classList.contains('icon-minus')) {
                    Object.assign(page.style, { width: '125px', height: 'min-content', bottom: '5px', left: `${5 + (num * 125)}px`, top: 'unset' });
                    page.querySelector('.content').style.display = 'none';
                    page.querySelector('.zoom').style.display = 'none';
                    minBtn.classList.remove('icon-minus');
                    minBtn.classList.add('icon-file-copy');
                    // 判断page父级元素的class 是否是bny-page-shade
                    if (pageShade.classList.contains('bny-page-shade')) {
                        pageShade.style.width = 0
                        pageShade.style.height = 0
                    }
                } else {
                    Object.assign(page.style, { width, height, top: `${currentY}px`, left: `${currentX}px`, bottom: 'unset' });
                    page.querySelector('.content').style.display = 'block';
                    page.querySelector('.zoom').style.display = 'inline-block';
                    page.querySelector('.zoom').classList.replace('icon-fullscreen-exit', 'icon-fullscreen');
                    minBtn.classList.remove('icon-file-copy');
                    minBtn.classList.add('icon-minus');
                    if (pageShade.classList.contains('bny-page-shade')) {
                        pageShade.style.width = "100%"
                        pageShade.style.height = "100%"
                    }
                }
                e.stopPropagation();
            });
        }

        /**
         * 页面 z-index（使用模块级计数器，避免每次点击遍历所有 .bny-page 计算 maxZIndex）
         * @param {HTMLElement} page 页面元素
         */
        function zIndex(page) {
            page.style.zIndex = ++bny._pageZIndexCounter
            page.addEventListener('click', () => {
                page.style.zIndex = ++bny._pageZIndexCounter
            });
        }

        /**
         * 页面关闭
         * @param {HTMLElement} page 页面元素
         * @param {bool} shade 是否关闭遮罩层
         * @param {String} anim 动画类型
         * @param {cb} animPlayer 动画播放器
         * @param {Array} unloads 解绑回调数组，关闭时依次调用
         */
        function close(page, shade, anim, animPlayer, unloads) {
            const closeBtn = page.querySelector('.close-btn')
            if (shade) {
                const shade = document.createElement("div")
                shade.className = "bny-page-shade"
                shade.appendChild(page)
                shade.addEventListener('click', (e) => {
                    if (e.target === shade) {
                        animPlayer(page, anim, false, () => {
                            unloads.forEach(fn => { try { fn() } catch (_) { } })
                            shade.remove()
                        })
                        e.stopPropagation()
                    }
                })
                document.body.appendChild(shade)
            } else {
                document.body.appendChild(page)
            }
            closeBtn.addEventListener('click', (e) => {
                if (shade) {
                    animPlayer(page, anim, false, () => {
                        unloads.forEach(fn => { try { fn() } catch (_) { } })
                        page.parentNode.remove()
                    })
                } else {
                    animPlayer(page, anim, false, () => {
                        unloads.forEach(fn => { try { fn() } catch (_) { } })
                        page.remove()
                    })
                }
            })
        }

        // 标题
        const title = options.title ?? '页面'
        // 动画
        const anim = options.anim ?? 'scale'
        // 宽度
        let width = options.width ?? '680px'
        // 高度
        let height = options.height ?? '520px'
        // 偏移量
        const offset = options.offset ?? 'auto'
        // 遮罩层
        const shade = options.shade ?? false
        // 安全判断：仅 http/https 链接才转 iframe，过滤 javascript:/data: 等危险协议
        if (typeof content === 'string' && isSafeUrl(content)) {
            content = `<iframe src="${content}"></iframe>`;
        }
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        if (width === "100%") width = windowWidth + "px"
        if (height === "100%") height = windowHeight + "px"
        // 当前页面数量
        const num = document.querySelectorAll(".bny-page").length
        // 计算当前页面的偏移量
        const currentX = parseInt(width) >= windowWidth ? 0 : ((windowWidth - parseInt(width)) / 2) + (num * 10)
        const currentY = parseInt(height) >= windowHeight ? 0 : ((windowHeight - parseInt(height)) / 2) + (num * 10)

        // 创建page元素
        const page = document.createElement("div")
        page.className = `bny-page bny-anim-${anim}`;
        // 设置位置
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
                    right: `0px`,
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

        page.innerHTML = `
        <div class="header">
            <div class="title">${bny.escapeChars(title === false ? '' : title)}</div>
                <div class="setwin">
                    <span class="bny-icon icon-minus min-auto"></span>
                    <span class="bny-icon icon-fullscreen zoom"></span>
                    <span class="bny-icon icon-close close-btn"></span>
                </div>
            </div>
        </div>
        <div class="content ${title === false ? 'not-title' : ''}">${content}</div>`
        const header = page.querySelector('.header')
        if (title === false) header.style.display = 'none'
        // 解绑回调数组：page 关闭时统一调用，避免 document 监听器泄漏
        const unloads = []
        // 关闭页面
        close(page, shade, anim, this.animPlayer, unloads)
        // 页面拖动（注入解绑回调）
        drag(page, fn => unloads.push(fn))
        // 页面缩放
        resize(page, width, height, currentX, currentY)
        // 页面最小化
        minimize(page, num - 1, width, height, currentX, currentY)
        // 页面z-index
        zIndex(page)
        return page
    },
    /**
     * bny.page 的 z-index 计数器（模块级单例，避免每次点击遍历所有 .bny-page）
     * 起始值 999，每次创建/聚焦 page 自增
     * @type {Number}
     */
    _pageZIndexCounter: 999,
    /**
     * 加载页面
     * @param {number} style 加载样式 0:旋转 1:线性 2:球型
     * @param {object} options 加载选项
     * @param {string} options.color 加载颜色
     * @param {string} options.size 加载大小
     * @returns {HTMLElement} load 加载元素
     */
    load: function (style = 0, options = {}) {
        const color = options.color ?? ''
        const size = options.size ?? ''
        // 创建load元素
        const load = document.createElement("div")
        load.className = `bny-load-shade`
        switch (style) {
            case 1:
                load.innerHTML = `<div class="bny-load" color="${color}" size="${size}"></div>`
                break;
            case 2:
                load.innerHTML = `
                <div class="bny-load-ball" color="${color}" size="${size}">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>`
                break;
            default:
                load.innerHTML = `<div class="bny-load-rot"></div>`
        }
        // 加载页面
        document.body.appendChild(load)
        return load
    }
}