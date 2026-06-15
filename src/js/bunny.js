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
        // 创建alert_open元素
        const alert_open = document.createElement('div')
        alert_open.classList.add('bny-alert-open')
        // 创建alert元素
        const alert = document.createElement('div')
        alert.classList.add('bny-alert', `bny-anim-${anim}`)
        alert.setAttribute('color', color)
        alert.style.width = 'auto'
        alert.innerHTML = msg
        // 将alert添加到alert_open
        alert_open.appendChild(alert)
        // 将alert_open添加到body
        document.body.appendChild(alert_open)
        // 设置定时器，移除alert
        setTimeout(() => {
            this.animPlayer(alert, anim, false, () => {
                alert_open.remove()
            })
        }, time * 1000)
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
        confirm_title.innerHTML = title
        // 创建content元素
        const confirm_content = document.createElement('p')
        confirm_content.classList.add('content')
        confirm_content.innerHTML = msg
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
        // 点击遮罩层时关闭弹窗
        confirm_shield.addEventListener('click', (e) => {
            // 只有点击confirm_shield本身时才关闭弹窗
            if (e.target === confirm_shield) {
                this.animPlayer(confirm, anim, false, () => {
                    confirm_shield.remove()
                })
            }
        })
        // 点击确认按钮时调用确认回调
        confirm_yes.addEventListener('click', (e) => {
            yes_cb()
            this.animPlayer(confirm, anim, false, () => {
                confirm_shield.remove()
            })
        })
        // 点击取消按钮时调用取消回调
        confirm_no.addEventListener('click', (e) => {
            no_cb()
            this.animPlayer(confirm, anim, false, () => {
                confirm_shield.remove()
            })
        })
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
         * 页面拖动
         * @param {HTMLElement} page 页面元素
         */
        function drag(page) {
            const header = page.querySelector('.header')
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
         * 页面z-index
         * @param {HTMLElement} page 页面元素
         */
        function zIndex(page) {
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
        }

        /**
         * 页面关闭
         * @param {HTMLElement} page 页面元素
         * @param {bool} shade 是否关闭遮罩层
         * @param {String} anim 动画类型
         * @param {cb} animPlayer 动画播放器
         */
        function close(page, shade, anim, animPlayer) {
            const closeBtn = page.querySelector('.close-btn')
            if (shade) {
                const shade = document.createElement("div")
                shade.className = "bny-page-shade"
                shade.appendChild(page)
                shade.addEventListener('click', (e) => {
                    if (e.target === shade) {
                        animPlayer(page, anim, false, () => {
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
                        page.parentNode.remove()
                    })
                } else {
                    animPlayer(page, anim, false, () => {
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
        // 判断内容是否石链接
        if (content.startsWith("http://") || content.startsWith("https://")) {
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
            <div class="title">${title}</div>
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
        // 关闭页面
        close(page, shade, anim, this.animPlayer)
        // 页面拖动
        drag(page)
        // 页面缩放
        resize(page, width, height, currentX, currentY)
        // 页面最小化
        minimize(page, num - 1, width, height, currentX, currentY)
        // 页面z-index
        zIndex(page)
        return page
    },
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