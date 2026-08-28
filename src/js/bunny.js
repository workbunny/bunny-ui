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
        const exts = attrs.split(',').map(s => s.trim()).filter(Boolean)
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
        alert.setAttribute('alert-color', color)
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
        confirm_yes.setAttribute('btn-color', 'blue')
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
                load.innerHTML = `<div class="bny-load" load-color="${color}" load-size="${size}"></div>`
                break;
            case 2:
                load.innerHTML = `
                <div class="bny-load-ball" load-color="${color}" load-size="${size}">
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
    },
    /**
     * 提取 URL 查询串（内置函数）—— 分页翻页时回带当前查询条件
     * @param {String} url URL
     * @param {Array<String>} [except] 需要剔除的参数名（如 page/pageSize，由调用方每次给新值）
     * @returns {String} "k1=v1&k2=v2" 形式的查询串（值已编码），无则空串
     */
    carryQuery: function (url, except) {
        if (!url) return ''
        var ex = Array.isArray(except) ? except : []
        try {
            var u = new URL(url, window.location.href)
            var parts = []
            u.searchParams.forEach(function (v, k) {
                if (v !== '' && ex.indexOf(k) < 0) parts.push(k + '=' + encodeURIComponent(v))
            })
            return parts.join('&')
        } catch (e) {
            return ''
        }
    },
    /**
     * 解析条数选择列表（内置函数）
     * @param {String} v 逗号分隔的条数串，如 "10,20,50"
     * @returns {Array<Number>|null} 条数数组（升序前由调用方处理），无有效值返回 null
     */
    parsePageSizes: function (v) {
        if (!v) return null
        var arr = String(v).split(',').map(function (s) { return parseInt(s.trim(), 10) }).filter(function (n) { return n > 0 })
        return arr.length ? arr : null
    },
    /**
     * 渲染分页条 HTML（bny-pagination 组件与 bny-table 内置分页共用）
     *
     * @param {Object} o 配置
     * @param {Number} o.total 总条数（必需）
     * @param {Number} [o.page=1] 当前页
     * @param {Number} [o.pageSize=10] 每页条数
     * @param {String} [o.paramName='page'] URL 分页参数名
     * @param {String} [o.sizeParam='pageSize'] URL 条数参数名
     * @param {Array<Number>} [o.sizes] 条数选择列表（传入则渲染"条/页"选择器）
     * @param {String} [o.query=''] 当前查询串（翻页时原样回带，实现搜索/筛选条件保持）
     * @param {Number} [o.maxButtons=7] 最多页码按钮数（含首尾与省略号）
     * @param {Boolean} [o.jumper=true] 是否显示跳转框
     * @param {Boolean} [o.showTotal=true] 是否显示总数
     * @param {String} [o.carryAttrs=''] 附加到根节点的属性串（需已转义，如 ' pg-color="blue"'）
     * @returns {String} 分页条 HTML
     */
    paginationBar: function (o) {
        o = o || {}
        var total = parseInt(o.total, 10) || 0
        var pageSize = parseInt(o.pageSize, 10) || 10
        var paramName = o.paramName || 'page'
        var sizeParam = o.sizeParam || 'pageSize'
        var maxButtons = parseInt(o.maxButtons, 10) || 7
        var showJumper = o.jumper !== false
        var showTotal = o.showTotal !== false
        var page = parseInt(o.page, 10) || 1

        // 条数选择列表：当前条数不在列表中时自动补入
        var sizes = Array.isArray(o.sizes) ? o.sizes.map(function (s) { return parseInt(s, 10) }).filter(function (n) { return n > 0 }) : []
        if (sizes.length && sizes.indexOf(pageSize) < 0) sizes.push(pageSize)
        if (sizes.length) sizes.sort(function (a, b) { return a - b })

        var totalPages = Math.max(1, Math.ceil(total / pageSize))
        if (page > totalPages) page = totalPages
        if (page < 1) page = 1

        // 构建分页条外层 div：注意不携带 hx-get/hx-target/hx-swap ——
        // div+hx-get 无 hx-trigger 会被 htmx 注册默认 click 触发，与事件委托冲突
        // 请求所需的 htmx 配置由内部 _pgTriggerRequest 反查原始配置元素读取
        var h = '<div class="bny-pagination"'
        if (o.carryAttrs) h += o.carryAttrs
        h += ' pg-current="' + page + '"'
        h += ' pg-total-pages="' + totalPages + '"'
        h += ' pg-page-param="' + bny.escapeChars(paramName) + '"'
        h += ' pg-size-param="' + bny.escapeChars(sizeParam) + '"'
        if (o.query) h += ' pg-query="' + bny.escapeChars(o.query) + '"'
        h += '>'

        // 总数
        if (showTotal) {
            h += '<span class="bny-pagination-total">共 <em>' + total + '</em> 条</span>'
        }

        // 条数选择
        if (sizes.length) {
            h += '<span class="bny-pagination-sizes">'
            h += '<select class="bny-pagination-select" aria-label="每页条数">'
            sizes.forEach(function (s) {
                h += '<option value="' + s + '"' + (s === pageSize ? ' selected' : '') + '>' + s + '</option>'
            })
            h += '</select> 条/页</span>'
        }

        // 上一页
        h += '<a class="bny-pagination-prev' + (page <= 1 ? ' disabled' : '') + '"'
        h += ' pg-page="' + Math.max(1, page - 1) + '"'
        h += ' title="上一页"><i class="bny-icon icon-left"></i></a>'

        // 页码按钮
        var btns = _pgComputeButtons(page, totalPages, maxButtons)
        for (var i = 0; i < btns.length; i++) {
            var b = btns[i]
            if (b === '...') {
                h += '<span class="bny-pagination-ellipsis">...</span>'
            } else {
                h += '<a class="bny-pagination-btn' + (b === page ? ' active' : '') + '"'
                h += ' pg-page="' + b + '"'
                h += '>' + b + '</a>'
            }
        }

        // 下一页
        h += '<a class="bny-pagination-next' + (page >= totalPages ? ' disabled' : '') + '"'
        h += ' pg-page="' + Math.min(totalPages, page + 1) + '"'
        h += ' title="下一页"><i class="bny-icon icon-right"></i></a>'

        // 跳转
        if (showJumper && totalPages > 1) {
            h += '<span class="bny-pagination-jump">'
            h += '前往 <input type="number" class="bny-pagination-input" min="1" max="' + totalPages + '" value="' + page + '"> 页'
            h += '</span>'
        }

        h += '</div>'
        return h
    },
    /**
     * 从 URL 解析分页参数值（内置函数）
     * - 静态 JSON 场景 page 固定为 1，需从请求 URL 查询串反映实际点击页码
     *
     * @param {String} url URL
     * @param {String} paramName 参数名
     * @returns {Number} 页码，无则 0
     */
    parsePageParam: function (url, paramName) {
        if (!url) return 0
        try {
            var u = new URL(url, window.location.href)
            var p = u.searchParams.get(paramName)
            return parseInt(p, 10) || 0
        } catch (e) {
            // 兜底：正则提取
            var re = new RegExp('[?&]' + encodeURIComponent(paramName) + '=([^&]+)')
            var m = String(url).match(re)
            if (m) return parseInt(decodeURIComponent(m[1]), 10) || 0
            return 0
        }
    },
    /**
     * 注册分页条事件委托（内置函数，只注册一次，渲染后无需重新绑定）
     * - 点击页码 / 上一页 / 下一页 → 反查配置元素发起 htmx 请求
     * - 跳转输入框回车 → 同上
     */
    setupPaginationDelegation: function () {
        if (bny._pgDelegated) return
        bny._pgDelegated = true

        // 点击页码 / 上一页 / 下一页
        document.addEventListener('click', function (e) {
            var btn = e.target.closest && e.target.closest('.bny-pagination-btn, .bny-pagination-prev, .bny-pagination-next')
            if (!btn) return
            var bar = btn.closest('.bny-pagination')
            if (!bar) return
            if (btn.classList.contains('disabled') || btn.classList.contains('active')) {
                e.preventDefault()
                return
            }
            var p = btn.getAttribute('pg-page')
            if (!p) return
            _pgTriggerRequest(bar, p)
        })

        // 跳转输入框回车
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter') return
            var input = e.target
            if (!input.classList || !input.classList.contains('bny-pagination-input')) return
            e.preventDefault()
            var bar = input.closest && input.closest('.bny-pagination')
            if (!bar) return
            var totalPages = parseInt(bar.getAttribute('pg-total-pages'), 10) || 1
            var p = parseInt(input.value, 10)
            if (isNaN(p) || p < 1) p = 1
            if (p > totalPages) p = totalPages
            _pgTriggerRequest(bar, String(p))
        })

        // 条数选择：切换后回到第 1 页并携带 pageSize 重新请求
        document.addEventListener('change', function (e) {
            var select = e.target
            if (!select.classList || !select.classList.contains('bny-pagination-select')) return
            var bar = select.closest && select.closest('.bny-pagination')
            if (!bar) return
            var n = parseInt(select.value, 10)
            if (!n || n < 1) return
            _pgTriggerRequest(bar, '1', n)
        })
    },
    /**
     * 分页事件委托注册标志（内部使用）
     * @type {Boolean}
     */
    _pgDelegated: false
}

/**
 * 计算要显示的页码按钮序列（内部函数，配合 bny.paginationBar）
 * - 始终包含第一页与最后一页，中间用 '...' 表示省略
 * @param {number} current 当前页
 * @param {number} total 总页数
 * @param {number} max 最多按钮数（含首尾与省略号）
 * @returns {Array<number|string>}
 */
function _pgComputeButtons(current, total, max) {
    if (total <= max) {
        var arr = []
        for (var i = 1; i <= total; i++) arr.push(i)
        return arr
    }

    // max 至少为 5（首 + ... + 当前 + ... + 尾）
    if (max < 5) max = 5

    var result = []
    // 中间连续区域最多放 max-2 个按钮（去掉首尾各占一位）
    var remaining = max - 2
    var half = Math.floor(remaining / 2)

    // 左右边界（不含首尾页）
    var left = Math.max(2, current - half)
    var right = Math.min(total - 1, current + half)

    // 若左侧贴近首页，则右扩填满中间区域
    if (left <= 2) {
        left = 2
        right = Math.min(total - 1, remaining + 1)
    }
    // 若右侧贴近末页，则左扩填满中间区域
    if (right >= total - 1) {
        right = total - 1
        left = Math.max(2, total - remaining)
    }

    result.push(1)
    if (left > 2) result.push('...')
    for (var j = left; j <= right; j++) result.push(j)
    if (right < total - 1) result.push('...')
    result.push(total)
    return result
}

/**
 * 反查分页条所在容器的请求源配置元素（内部函数）
 * - 配置元素是容器的兄弟节点，携带 hx-get/hx-target，渲染后仍保留在 DOM 中
 * - 以配置元素为 source，htmx 才能命中其扩展的 transformResponse
 * @param {HTMLElement} bar 分页条根 div
 * @returns {HTMLElement|null}
 */
function _pgFindConfig(bar) {
    var container = bar.parentElement
    if (!container || !container.id) return null
    var candidates = document.querySelectorAll('[hx-target="#' + container.id + '"]')
    for (var i = 0; i < candidates.length; i++) {
        if (candidates[i].getAttribute('hx-get')) return candidates[i]
    }
    return null
}

/**
 * 触发分页请求：携带 page/pageSize 参数发起 htmx.ajax（内部函数）
 * @param {HTMLElement} bar 分页条根 div
 * @param {string} page 目标页码
 * @param {string} [pageSize] 目标条数（条数选择器切换时传入）
 */
function _pgTriggerRequest(bar, page, pageSize) {
    var src = _pgFindConfig(bar) || bar
    var url = src.getAttribute('hx-get')
    if (!url) return
    var targetSel = src.getAttribute('hx-target')
    var swapStyle = src.getAttribute('hx-swap') || 'innerHTML'
    var paramName = bar.getAttribute('pg-page-param') || 'page'
    var vals = {}
    // 回带当前查询条件（搜索/菜单联动设置的参数，翻页/切条数时保持）
    var query = bar.getAttribute('pg-query')
    if (query) {
        try {
            new URLSearchParams(query).forEach(function (v, k) {
                if (v !== '') vals[k] = v
            })
        } catch (_) { }
    }
    vals[paramName] = page
    var sizeParam = bar.getAttribute('pg-size-param') || 'pageSize'
    if (pageSize) {
        vals[sizeParam] = pageSize
    } else {
        // 条数选择器存在时，页码点击携带当前选中的条数（否则选择会在翻页后丢失）
        var select = bar.querySelector('.bny-pagination-select')
        if (select) {
            var ps = parseInt(select.value, 10)
            if (ps > 0) vals[sizeParam] = ps
        }
    }
    // 同时保留原有 hx-vals
    var existingVals = src.getAttribute('hx-vals')
    if (existingVals) {
        try { Object.assign(vals, JSON.parse(existingVals)); } catch (_) { }
    }
    var target = targetSel ? document.querySelector(targetSel) : src
    if (targetSel && !target) target = src
    htmx.ajax('GET', url, {
        source: src,
        target: target,
        swap: swapStyle,
        values: vals
    })
}