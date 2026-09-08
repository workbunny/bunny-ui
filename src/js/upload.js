/**
 * bny-upload — 文件上传组件（htmx 扩展）
 *
 * 设计：
 * - 完全复用 htmx 原生请求管线：
 *   - 上传地址用 hx-post / hx-get / hx-put / hx-delete（htmx 原生属性）
 *   - 触发用 hx-trigger（htmx 原生，默认 click）
 *   - 文件经隐藏 input[type=file] + hx-include 由 htmx 序列化，组件自动补
 *     hx-encoding="multipart/form-data" 保证以正规 multipart 格式提交（htmx 缺省
 *     urlencoded 编码不会携带 File）
 *   - 响应仅作提示：组件强制 hx-swap="none" 防止 JSON 覆盖触发器，并在 afterRequest 内置
 *     bny.alert 提示（JSON {code,msg,url}，code=0 成功），不依赖 bny-alert 扩展
 * - 元素本身即触发：点击元素打开文件选择，选中后组件把文件放进队列逐个上传——
 *   每个文件单独发一次 htmx 请求（服务端收到单文件字段，如 $_FILES['file']，而非数组）
 * - 前置校验 upload-ext / upload-size / upload-accept / upload-limit 在选择时拦截
 * - upload-list 可选控制是否渲染内置文件列表：缺省不渲染；
 *   "this" = 元素自身内；CSS 选择器 = 渲染到指定元素
 *
 * 用法：
 *   <button class="bny-btn" hx-ext="bny-upload"
 *        hx-post="/admin/attachment/upload" hx-trigger="click"
 *        upload-multi upload-accept="image/*" upload-ext="jpg,png,gif" upload-limit="5"
 *        upload-list="#list">
 *       <i class="bny-icon icon-upload"></i> 上传文件
 *   </button>
 *   <ul id="list"></ul>
 *
 * 属性（htmx 原生）：
 *   hx-post / hx-get / hx-put / hx-delete   上传接口（必须其一）
 *   hx-trigger                               触发方式（默认 click）
 *
 * 属性（组件扩展）：
 *   upload-name    上传字段名（默认 'file'）
 *   upload-accept  透传给隐藏 input 的 accept（默认 '*'）
 *   upload-ext     扩展名白名单，逗号分隔（jpg,png,gif），空 = 不校验
 *   upload-limit   文件数量上限（默认 0，0 = 不限）
 *   upload-size    单文件大小上限，单位 KB（默认 0，0 = 不限）
 *   upload-multi   存在该属性即支持多选（否则单选）；多选时逐个文件分别请求
 *   upload-hint    列表为空时的提示文案
 *   upload-preview 存在则图片文件在列表中显示缩略图（img-preview）
 *   upload-list    列表渲染目标："this"/缺省=不渲染；CSS 选择器（#id/.cls/find x/closest x）=渲染到指定元素
 *
 * 成功/失败反馈：组件内置 bny.alert 提示（响应 JSON {code, msg, url}，code=0 成功）。
 */
htmx.defineExtension('bny-upload', {
    // 节点初始化（页面加载 / 节点交换后）
    onEvent: function (name, evt) {

        /**
         * 格式化文件大小，如 1234567 → "1.2 MB"
         */
        function formatSize(bytes) {
            if (!bytes && bytes !== 0) return ''
            if (bytes < 1024) return bytes + ' B'
            var units = ['KB', 'MB', 'GB', 'TB']
            var size = bytes
            var i = -1
            do {
                size = size / 1024
                i++
            } while (size >= 1024 && i < units.length - 1)
            return size.toFixed(size >= 100 ? 0 : 1) + ' ' + units[i]
        }

        /**
         * 把 File 数组写入隐藏 input[type=file]：优先 DataTransfer（规范方式，
         * 兼容多数浏览器），失败回退直接赋值（部分环境允许 input.files = 数组）
         */
        function setInputFiles(input, files) {
            try {
                var dt = new DataTransfer()
                files.forEach(function (f) { dt.items.add(f) })
                input.files = dt.files
            } catch (e) {
                try { input.files = files } catch (e2) { }
            }
        }

        /**
         * 提取文件扩展名（最后一个点后的字符串，转小写）
         */
        function fileExt(file) {
            var name = file.name || ''
            var i = name.lastIndexOf('.')
            if (i < 0 || i === name.length - 1) return ''
            return name.slice(i + 1).toLowerCase()
        }

        /**
         * 用 upload-accept 匹配文件类型（支持 image/* 通配）
         */
        function matchesAccept(file, accept) {
            if (!accept || accept === '*' || accept === '') return true
            var type = (file.type || '').toLowerCase()
            var parts = accept.split(',')
            for (var i = 0; i < parts.length; i++) {
                var p = (parts[i] || '').trim().toLowerCase()
                if (!p) continue
                if (p === type) return true
                if (p.endsWith('/*') && type.indexOf(p.slice(0, p.length - 1)) === 0) return true
                if (p === '*/*') return true
            }
            return false
        }

        /**
         * 前置校验：校验不过则 bny.alert 拒绝并返回 false
         */
        function validate(elt, cfg, files) {
            // 数量上限：以已选未删除项计算
            if (cfg.limit > 0 && (elt._bnyUploadItems || []).length + files.length > cfg.limit) {
                bny.alert('最多只能上传 ' + cfg.limit + ' 个文件', 2)
                return false
            }
            for (var i = 0; i < files.length; i++) {
                var file = files[i]
                if (cfg.extList.length) {
                    var ext = fileExt(file)
                    if (cfg.extList.indexOf(ext) === -1) {
                        bny.alert('仅支持 ' + cfg.extList.join(',') + ' 格式', 2)
                        return false
                    }
                }
                if (cfg.size > 0 && file.size / 1024 > cfg.size) {
                    bny.alert('文件大小不能超过 ' + cfg.size + ' KB', 2)
                    return false
                }
                if (!matchesAccept(file, cfg.accept)) {
                    bny.alert('文件类型不支持', 2)
                    return false
                }
            }
            return true
        }

        /**
         * 解析列表渲染目标：upload-list 缺省/"" → null（不渲染列表）；
         * "this" → 元素自身；选择器 → 指定元素
         */
        function resolveListTarget(elt, listAttr) {
            var t = (listAttr || '').trim()
            if (!t) return null
            if (t === 'this') return elt
            try {
                if (t.indexOf('find ') === 0) return elt.querySelector(t.slice(5))
                if (t.indexOf('closest ') === 0) return elt.closest(t.slice(7))
                return document.querySelector(t)
            } catch (e) {
                return null
            }
        }

        /**
         * 从元素读取 htmx 请求的动词与路径（hx-post / hx-get / ...）
         * @returns {{verb: string, path: string}|null}
         */
        function getRequestInfo(elt) {
            var verbs = ['hx-post', 'hx-put', 'hx-delete', 'hx-patch', 'hx-get']
            for (var i = 0; i < verbs.length; i++) {
                var path = elt.getAttribute(verbs[i])
                if (path) return { verb: verbs[i].slice(3).toUpperCase(), path: path }
            }
            return null
        }

        /**
         * 渲染/追加文件项到 upload-list 目标
         * @param {Array} files
         * @param {'pending'|'success'|'error'} status
         */
        function renderItems(elt, cfg, files, status, msg) {
            var target = resolveListTarget(elt, cfg.list)
            if (!target) return
            if (!target.querySelector('.bny-upload-list')) {
                var ul = document.createElement('ul')
                ul.className = 'bny-upload-list'
                target.appendChild(ul)
                // 目标为元素自身且无内容时补提示
                var hint = elt.getAttribute('upload-hint')
                if (hint && !target.textContent.trim()) {
                    var tip = document.createElement('span')
                    tip.className = 'bny-upload-hint'
                    tip.textContent = hint
                    target.appendChild(tip)
                }
            }
            var list = target.querySelector('.bny-upload-list')
            files.forEach(function (file) {
                var li = document.createElement('li')
                li.className = 'bny-upload-item' +
                    (status === 'success' ? ' is-success' : status === 'error' ? ' is-error' : '')
                // 保存 File 引用：供"重新上传"重发、删除时从已传列表移除
                li._bnyUploadFile = file
                li.innerHTML =
                    '<span class="bny-upload-thumb"></span>' +
                    '<span class="bny-upload-info">' +
                        '<span class="bny-upload-name"></span>' +
                        '<span class="bny-upload-size"></span>' +
                    '</span>' +
                    '<span class="bny-upload-progress"><i></i></span>' +
                    '<span class="bny-upload-status"></span>' +
                    '<span class="bny-upload-retry">重新上传</span>' +
                    '<span class="bny-upload-remove">&times;</span>'
                li.querySelector('.bny-upload-name').textContent = file.name
                li.querySelector('.bny-upload-size').textContent = formatSize(file.size)
                if (status === 'success') {
                    li.querySelector('.bny-upload-status').textContent = '上传成功'
                    li.querySelector('.bny-upload-progress').style.display = 'none'
                    li.querySelector('.bny-upload-retry').style.display = 'none'
                    if (cfg.preview && file.type && file.type.indexOf('image/') === 0) {
                        var thumb = li.querySelector('.bny-upload-thumb')
                        var img = document.createElement('img')
                        img.src = file.url || ''
                        img.setAttribute('img-preview', '')
                        img.setAttribute('img-preview-src', file.url || '')
                        thumb.appendChild(img)
                        if (file.url) {
                            elt.dispatchEvent(new CustomEvent('htmx:load', { bubbles: true, detail: { elt: elt } }))
                        }
                    }
                } else if (status === 'error') {
                    li.querySelector('.bny-upload-status').textContent = msg || '上传失败'
                    li.querySelector('.bny-upload-progress').style.display = 'none'
                    // 失败项：显示"重新上传"，隐藏删除（失败的文件留着删除没意义）
                    li.querySelector('.bny-upload-remove').style.display = 'none'
                } else {
                    li.querySelector('.bny-upload-status').textContent = '上传中'
                    // 上传中：隐藏操作按钮，避免与请求结果更新错位
                    li.querySelector('.bny-upload-remove').style.display = 'none'
                    li.querySelector('.bny-upload-retry').style.display = 'none'
                }
                list.appendChild(li)
            })
        }

        /**
         * 初始化单个上传元素
         */
        function init(elt) {
            // 防重复初始化（SPA / 动态节点）
            if (elt._bnyUploadInit) return
            elt._bnyUploadInit = true

            var cfg = {
                name: elt.getAttribute('upload-name') || 'file',
                accept: elt.getAttribute('upload-accept') || '*',
                extStr: elt.getAttribute('upload-ext') || '',
                limit: parseInt(elt.getAttribute('upload-limit') || '0', 10) || 0,
                size: parseInt(elt.getAttribute('upload-size') || '0', 10) || 0,
                multi: elt.hasAttribute('upload-multi'),
                preview: elt.hasAttribute('upload-preview'),
                drag: elt.hasAttribute('upload-drag'),
                list: elt.getAttribute('upload-list') || ''
            }
            cfg.extList = (cfg.extStr || '').split(',').map(function (s) { return s.trim().toLowerCase() }).filter(Boolean)

            if (!getRequestInfo(elt)) {
                console.error('[bny-upload] 缺少 hx-post / hx-get 等请求属性')
                return
            }

            // 上传响应仅用于提示：强制 hx-swap="none"，避免响应 JSON 被 htmx 默认 innerHTML
            // 交换进触发器/容器（覆盖内容、销毁隐藏 input）；用户显式设置的 hx-swap 仍保留
            if (!elt.getAttribute('hx-swap')) elt.setAttribute('hx-swap', 'none')

            // 请求编码强制 multipart/form-data：htmx 仅在 hx-encoding 声明 multipart 时
            // 才把 File 序列化进 FormData，缺省 urlencoded 编码会丢文件、请求体为空
            if (!elt.getAttribute('hx-encoding')) elt.setAttribute('hx-encoding', 'multipart/form-data')

            elt._bnyUploadItems = []
            elt._bnyUploadPending = []

            // 空元素补默认提示（未配置 upload-list 时）：框可点、可辨识；
            // upload-list="this" 场景的提示由 renderItems 负责，这里不重复加
            if (!cfg.list && !elt.textContent.trim()) {
                var hint = document.createElement('span')
                hint.className = 'bny-upload-hint'
                hint.textContent = elt.getAttribute('upload-hint') || '点击选择文件后上传'
                elt.appendChild(hint)
            }

            // 创建隐藏 file input（挂到元素内，供 hx-include 序列化）
            var input = document.createElement('input')
            input.type = 'file'
            input.name = cfg.name
            input.hidden = true
            input.accept = cfg.accept
            if (cfg.multi) input.multiple = true
            input.setAttribute('bny-upload-input', '')
            elt.appendChild(input)

            // 复用 htmx 原生 include：把 file input 挂进请求
            var hxInclude = elt.getAttribute('hx-include') || ''
            if (hxInclude.indexOf('bny-upload-input') === -1) {
                elt.setAttribute('hx-include', hxInclude ? hxInclude + ', find input[bny-upload-input]' : 'find input[bny-upload-input]')
            }

            // 捕获阶段拦截 click：删除/重试走各自逻辑，其余阻止 htmx 默认直接发空请求、
            // 改为打开文件选择。优先 showPicker()（Chromium：display:none 的 file input
            // 也能弹文件框，部分 WebView/沙箱环境对 click() 不弹框）；不支持/失败回退 input.click()
            elt.addEventListener('click', function (e) {
                e.preventDefault()
                e.stopPropagation()
                var rm = e.target.closest && e.target.closest('.bny-upload-remove')
                var retry = e.target.closest && e.target.closest('.bny-upload-retry')
                if (rm) {
                    // 删除列表项：同步从已传文件计数中移除，保证 upload-limit 累计正确
                    var li = rm.closest('.bny-upload-item')
                    if (li && li._bnyUploadFile && elt._bnyUploadItems) {
                        var i = elt._bnyUploadItems.indexOf(li._bnyUploadFile)
                        if (i > -1) elt._bnyUploadItems.splice(i, 1)
                    }
                    if (li) li.remove()
                    return
                }
                if (retry) {
                    // 重新上传：移除失败项，把文件塞回 input 走同一上传链路
                    var li2 = retry.closest('.bny-upload-item')
                    var file = li2 && li2._bnyUploadFile
                    if (li2) li2.remove()
                    if (file) {
                        setInputFiles(input, [file])
                        input.dispatchEvent(new Event('change', { bubbles: true }))
                    }
                    return
                }
                try {
                    if (input.showPicker) {
                        input.showPicker()
                        return
                    }
                } catch (err) { /* showPicker 失败（如无临时激活）则回退 click */ }
                input.click()
            }, true)

            // 拖拽上传（upload-drag 时启用）：drop 的文件塞进 input 复用同一链路
            if (cfg.drag) {
                elt.addEventListener('dragover', function (e) {
                    e.preventDefault()
                    if (!bny.hasClass(elt, 'bny-upload-dragover')) elt.classList.add('bny-upload-dragover')
                })
                elt.addEventListener('dragleave', function (e) {
                    if (e.target === elt) elt.classList.remove('bny-upload-dragover')
                })
                elt.addEventListener('drop', function (e) {
                    e.preventDefault()
                    e.stopPropagation()
                    elt.classList.remove('bny-upload-dragover')
                    var files = e.dataTransfer && e.dataTransfer.files
                    if (files && files.length) {
                        // 把拖入的文件注入隐藏 input 并走 change 流程
                        setInputFiles(input, Array.prototype.slice.call(files))
                        input.dispatchEvent(new Event('change', { bubbles: true }))
                    }
                })
            }

            // 选择文件后：校验 → 渲染列表 → 逐个文件发起请求（每个文件单独一次
            // htmx 请求，服务端收到的是单文件字段而非文件数组）
            input.addEventListener('change', function () {
                var files = input.files ? Array.prototype.slice.call(input.files) : []
                if (!files.length) return
                var picked = files
                if (!cfg.multi && picked.length > 1) picked = picked.slice(0, 1)
                if (!validate(elt, cfg, picked)) { input.value = ''; return }

                // 渲染"上传中"列表项
                if (cfg.list) renderItems(elt, cfg, picked, 'pending')

                // 队列逐个上传：每发一个请求只带一个文件，结束后由
                // htmx:afterRequest 调 _bnyUploadNext 推进下一个
                elt._bnyUploadQueue = picked.slice()
                elt._bnyUploadNext()
            })

            /**
             * 推进上传队列：取出队首文件注入隐藏 input，单独发一次请求
             */
            elt._bnyUploadNext = function () {
                var queue = elt._bnyUploadQueue || []
                if (!queue.length) { elt._bnyUploadQueue = null; return }
                var req = getRequestInfo(elt)
                if (!req || !window.htmx || !htmx.ajax) { elt._bnyUploadQueue = null; return }
                var file = queue.shift()
                setInputFiles(input, [file])
                elt._bnyUploadPending = [file]
                htmx.ajax(req.verb, req.path, { source: elt })
            }
        }

        // 节点初始化（页面加载 / 节点交换后）
        if (name === 'htmx:afterProcessNode') {
            if (bny.hasExtName(evt.target, 'bny-upload')) {
                init(evt.target)
                return false
            }
            return true
        }

        // 上传进度：htmx 对 xhr 及 xhr.upload 都会派发 htmx:xhr:progress。
        // 用 total === 当前上传文件大小 过滤出"上传"进度（下载进度 total 是响应字节数，
        // 一般不等）；按文件引用找到对应列表项更新其进度条
        if (name === 'htmx:xhr:progress') {
            var sender = evt.target
            if (sender && sender._bnyUploadInit && evt.detail && evt.detail.lengthComputable) {
                var cur = (sender._bnyUploadPending || [])[0]
                if (cur && evt.detail.total === cur.size) {
                    var pct = Math.round(evt.detail.loaded * 100 / evt.detail.total)
                    var tgt = resolveListTarget(sender, sender.getAttribute('upload-list') || '')
                    if (tgt) {
                        var lst = tgt.querySelector('.bny-upload-list')
                        if (lst) {
                            var item = null
                            lst.querySelectorAll('.bny-upload-item').forEach(function (it) {
                                if (it._bnyUploadFile === cur) item = it
                            })
                            if (item) {
                                var bar = item.querySelector('.bny-upload-progress i')
                                if (bar) bar.style.width = pct + '%'
                                var st = item.querySelector('.bny-upload-status')
                                if (st) st.textContent = '上传中 ' + pct + '%'
                            }
                        }
                    }
                }
            }
            return true
        }

        // 请求结束：内置响应提示（hx-swap="none" 下 bny-alert 的 transformResponse 不会触发，
        // 由组件自行弹提示）+ 按响应结果更新列表状态并重置 input（允许重复选同一文件）
        if (name === 'htmx:afterRequest') {
            var up = evt.target
            if (up && up._bnyUploadInit && up._bnyUploadPending && up._bnyUploadPending.length) {
                var xhr = evt.detail.xhr
                var statusOk = !!(xhr && xhr.status >= 200 && xhr.status < 300)
                // 成功以业务 code 为准：JSON {code:0,...} 成功，code!=0 失败；无 code 字段回退到 HTTP 状态码
                var ok = statusOk
                var msg = ''
                var urlMap = {}
                try {
                    if (xhr && xhr.responseText) {
                        var data = JSON.parse(xhr.responseText)
                        if (data && typeof data === 'object') {
                            if ('code' in data) ok = data.code === 0
                            if (data.msg) msg = data.msg
                            if (data.url) urlMap['0'] = data.url
                        }
                    }
                } catch (e) { }
                var files = up._bnyUploadPending
                // 成功批次计入已传文件计数（供 upload-limit 累计校验；删除项时同步移除）
                if (ok) {
                    if (!up._bnyUploadItems) up._bnyUploadItems = []
                    Array.prototype.push.apply(up._bnyUploadItems, files)
                }
                // 兜底反馈：任何失败/成功都要有可见提示，避免 405/500/非 JSON 响应时静默无反应
                if (!msg && ok) msg = '上传成功'
                if (!msg && !ok) msg = '上传失败'
                // bny.alert 颜色语义：1=绿(成功)、3=红(失败)；code 字段同时用于列表状态判定
                if (msg) bny.alert(msg, ok ? 1 : 3, data && data.anim ? data.anim : 'scale', data && data.time ? data.time : 3)
                var cfg = {
                    list: up.getAttribute('upload-list') || '',
                    preview: up.hasAttribute('upload-preview'),
                    name: up.getAttribute('upload-name') || 'file'
                }
                files.forEach(function (file, idx) {
                    if (urlMap['0']) file.url = urlMap['0']
                })
                // 按文件引用更新对应列表项状态（逐个上传，一次请求只对应一个文件）
                var target = resolveListTarget(up, cfg.list)
                if (target) {
                    var list = target.querySelector('.bny-upload-list')
                    if (list) {
                        list.querySelectorAll('.bny-upload-item').forEach(function (item) {
                            if (files.indexOf(item._bnyUploadFile) === -1) return
                            var statusEl = item.querySelector('.bny-upload-status')
                            if (ok) {
                                item.classList.add('is-success')
                                if (statusEl) statusEl.textContent = '上传成功'
                                var prog = item.querySelector('.bny-upload-progress')
                                if (prog) prog.style.display = 'none'
                            } else {
                                item.classList.add('is-error')
                                if (statusEl) statusEl.textContent = '上传失败'
                                var proge = item.querySelector('.bny-upload-progress')
                                if (proge) proge.style.display = 'none'
                            }
                        })
                    }
                }
                // 重置 file input：允许再次选择同一文件
                var inp = up.querySelector('input[bny-upload-input]')
                if (inp) inp.value = ''
                up._bnyUploadPending = []
                up._bnyUploadLastOk = undefined
                // 批量逐个上传：本文件请求已结束，推进队列中的下一个
                if (typeof up._bnyUploadNext === 'function') up._bnyUploadNext()
                return true
            }
            return true
        }

        return true
    }
})