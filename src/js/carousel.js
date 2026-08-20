/**
 * bny-carousel — 轮播组件
 *
 * 设计：
 * - HTMX 扩展，容器直接子元素自动成为轮播项，无需 JS 调用
 * - 三种切换效果：slide（轨道位移）/ fade（淡入淡出）/ coverflow（异形 3D 覆盖流）
 * - 位置统一用浮点 pos 表达（整数 = 精确停在某项），拖拽 / 补间动画 / 连续滚动共享同一套渲染
 * - 自动播放两种模式：离散（间隔 ms 跳格）或 smooth（丝滑连续滚动，px/s 匀速）
 * - slide 循环模式自动在首尾挂"克隆项"实现无缝环绕；coverflow 按取模环绕，无需克隆
 * - 箭头 / 指示器 / 循环 / 键盘 / 手动拖拽（Pointer Events，轴锁定）
 * - transformResponse：服务端返回 JSON 数组自动渲染轮播项（转义防 XSS）
 * - 所有事件监听绑定在根元素上：htmx innerHTML swap 重建内容后监听不丢失，
 *   吸收逻辑（ensureStructure + refresh）自动恢复结构与指示器
 *
 * 用法：
 *   <div hx-ext="bny-carousel" carousel-height="320px" carousel-autoplay="3000">
 *       <img src="a.jpg" alt="第一张">
 *       <img src="b.jpg" alt="第二张">
 *   </div>
 *
 * 容器属性：
 *   carousel-index      初始索引，默认 0
 *   carousel-autoplay   自动播放：间隔毫秒数（如 3000）或 "smooth"（丝滑连续滚动）；缺省或 "false" 禁用
 *   carousel-speed      smooth 滚动速度（px/s），默认 60
 *   carousel-loop       循环模式，"false" 关闭（默认开启）
 *   carousel-arrow      箭头显示：hover / always / none（默认 hover）
 *   carousel-indicator  指示器：inside / outside / none（默认 inside）
 *   carousel-effect     切换效果：slide / fade / coverflow（默认 slide）
 *   carousel-height     高度（如 320px），设置到根元素
 *   carousel-drag       手动拖拽，"false" 关闭（默认开启，slide / coverflow 生效）
 *
 * 服务端返回 JSON（Content-Type 含 application/json，data 为数组）：
 *   { "data": [
 *       { "src": "a.jpg", "title": "第一张", "link": "/a", "target": "_blank" },
 *       { "html": "<p>任意可信内容</p>" },
 *       "纯文本项"
 *   ] }
 *   - { src, title?, link?, target? } → 图片 + 可选底部标题浮层 + 可选整项链接
 *   - { html } → 可信原始 HTML（调用方保证安全）
 *   - 字符串/数字 → 转义后的纯文本
 */
htmx.defineExtension('bny-carousel', {
    // 事件
    onEvent: function (name, evt) {

        /**
         * 获取轨道元素
         * @param {HTMLElement} root 轮播根元素
         * @returns {HTMLElement|null} 轨道
         */
        function getTrack(root) {
            const view = bny.queryChild(root, '.carousel-view')
            return view ? bny.queryChild(view, '.carousel-track') : null
        }

        /**
         * 获取所有轮播项（不含克隆项）
         * @param {HTMLElement} root 轮播根元素
         * @returns {HTMLElement[]} 项数组
         */
        function getItems(root) {
            const track = getTrack(root)
            if (!track) return []
            return Array.from(track.children).filter(function (el) {
                return !el.classList.contains('carousel-clone')
            })
        }

        /**
         * 归一化位置到 [0, count)（循环）或 [0, count-1]（非循环）
         * @param {HTMLElement} root 轮播根元素
         * @param {number} pos 位置
         * @returns {number} 归一化后的位置
         */
        function normalizePos(root, pos) {
            const state = root._bnyCarousel
            const count = getItems(root).length
            if (count <= 0) return 0
            if (state.loop) {
                pos = ((pos % count) + count) % count
            } else {
                pos = Math.max(0, Math.min(pos, count - 1))
            }
            return pos
        }

        /**
         * 由当前位置推导当前索引（取整 + 归一）
         * @param {HTMLElement} root 轮播根元素
         * @returns {number} 索引
         */
        function indexFromPos(root) {
            const state = root._bnyCarousel
            const count = getItems(root).length
            if (count <= 0) return 0
            let idx = Math.round(state.pos)
            if (state.loop) idx = ((idx % count) + count) % count
            else idx = Math.max(0, Math.min(idx, count - 1))
            return idx
        }

        /**
         * 确保结构完整（幂等）：
         * 根下不存在 .carousel-view 时创建 view+track，并把根下除箭头/指示器外的
         * 所有直接子元素移入 track、加 .carousel-item 类（首次初始化，或 htmx
         * innerHTML swap 清空重建后的吸收都会走到这里）；箭头/指示器不存在则创建
         * @param {HTMLElement} root 轮播根元素
         */
        function ensureStructure(root) {
            // 视口
            let view = bny.queryChild(root, '.carousel-view')
            if (!view) {
                view = document.createElement('div')
                view.className = 'carousel-view'
                root.insertBefore(view, root.firstChild)
            }
            // 轨道
            let track = bny.queryChild(view, '.carousel-track')
            if (!track) {
                track = document.createElement('div')
                track.className = 'carousel-track'
                view.appendChild(track)
            }
            // 根下游离子元素移入轨道（排除视口与箭头/指示器控件）
            // queryChildAll 返回动态 NodeList，先转静态数组再移动节点
            const children = Array.from(bny.queryChildAll(root, '*'))
            for (let i = 0; i < children.length; i++) {
                const child = children[i]
                if (child === view) continue
                if (child.classList.contains('btn-left')) continue
                if (child.classList.contains('btn-right')) continue
                if (child.classList.contains('indicator')) continue
                track.appendChild(child)
            }
            // 轨道内所有子元素补全 .carousel-item 类（含克隆项）
            const items = track.children
            for (let i = 0; i < items.length; i++) {
                items[i].classList.add('carousel-item')
            }
            // 左箭头
            if (!bny.queryChild(root, '.btn-left')) {
                const btn = document.createElement('div')
                btn.className = 'btn-left'
                btn.innerHTML = `<i class="bny-icon icon-left"></i>`
                root.appendChild(btn)
            }
            // 右箭头
            if (!bny.queryChild(root, '.btn-right')) {
                const btn = document.createElement('div')
                btn.className = 'btn-right'
                btn.innerHTML = `<i class="bny-icon icon-right"></i>`
                root.appendChild(btn)
            }
            // 指示器
            if (!bny.queryChild(root, '.indicator')) {
                const ul = document.createElement('ul')
                ul.className = 'indicator'
                root.appendChild(ul)
            }
        }

        /**
         * 重建指示器（li 数量与项数一致，当前项加 .this）
         * @param {HTMLElement} root 轮播根元素
         */
        function rebuildIndicator(root) {
            const indicator = bny.queryChild(root, '.indicator')
            if (!indicator) return
            const state = root._bnyCarousel
            const count = getItems(root).length
            indicator.textContent = ''
            for (let i = 0; i < count; i++) {
                const li = document.createElement('li')
                if (i === state.index) li.classList.add('this')
                indicator.appendChild(li)
            }
        }

        /**
         * 更新指示器当前项高亮
         * @param {HTMLElement} root 轮播根元素
         */
        function updateIndicatorThis(root) {
            const state = root._bnyCarousel
            const indicator = bny.queryChild(root, '.indicator')
            if (!indicator) return
            const lis = indicator.children
            for (let i = 0; i < lis.length; i++) {
                lis[i].classList.toggle('this', i === state.index)
            }
        }

        /**
         * 更新箭头禁用态（非 loop 模式到边界加 .disabled）
         * @param {HTMLElement} root 轮播根元素
         */
        function updateArrows(root) {
            const state = root._bnyCarousel
            const count = getItems(root).length
            const left = bny.queryChild(root, '.btn-left')
            const right = bny.queryChild(root, '.btn-right')
            if (left) left.classList.toggle('disabled', !state.loop && state.index <= 0)
            if (right) right.classList.toggle('disabled', !state.loop && state.index >= count - 1)
        }

        /**
         * 同步 UI 状态（索引取整变化时更新指示器与箭头）
         * @param {HTMLElement} root 轮播根元素
         */
        function syncUI(root) {
            const state = root._bnyCarousel
            const idx = indexFromPos(root)
            if (idx === state.index) return
            state.index = idx
            updateIndicatorThis(root)
            updateArrows(root)
        }

        /**
         * slide 渲染：轨道按 pos 百分比位移
         * （track 宽等于视口宽，translateX 百分比即视口宽的倍数）
         * @param {HTMLElement} root 轮播根元素
         * @param {number} pos 位置
         */
        function renderSlide(root, pos) {
            const track = getTrack(root)
            if (track) track.style.transform = 'translateX(' + (-pos * 100) + '%)'
        }

        /**
         * coverflow 渲染：按各项与当前位置的偏移逐项施加 3D 变换
         * （中央项正面朝前，两侧项透视旋转 + 缩小 + 压暗，错层堆叠）
         * @param {HTMLElement} root 轮播根元素
         * @param {number} pos 位置
         */
        function renderCoverflow(root, pos) {
            const state = root._bnyCarousel
            const track = getTrack(root)
            if (!track) return
            const items = getItems(root)
            const count = items.length
            const view = bny.queryChild(root, '.carousel-view')
            const vw = view ? view.clientWidth : root.clientWidth
            for (let i = 0; i < count; i++) {
                const item = items[i]
                // 偏移：循环模式取模到 (-count/2, count/2] 自由环绕；非循环保持自然偏移
                let off = i - pos
                if (state.loop && count > 2) {
                    off = ((off % count) + count) % count
                    if (off > count / 2) off -= count
                }
                const abs = Math.abs(off)
                const dir = off < 0 ? -1 : 1
                const depth = Math.min(abs, 2) // 深度饱和：远端不再继续变化
                const x = off * vw * 0.42
                const rotY = -dir * Math.min(abs, 1.2) * 42
                const scale = 1 - depth * 0.16
                const opacity = abs >= 2.6 ? 0 : 1 - Math.min(abs, 2) * 0.18
                item.style.transform = 'translateX(' + x + 'px) rotateY(' + rotY + 'deg) scale(' + scale + ')'
                item.style.opacity = String(opacity)
                item.style.zIndex = String(100 - Math.round(Math.min(abs, 9) * 10))
            }
        }

        /**
         * fade 渲染：当前项加 .this 类（CSS 过渡淡入淡出）
         * @param {HTMLElement} root 轮播根元素
         */
        function renderFade(root) {
            const state = root._bnyCarousel
            const track = getTrack(root)
            if (track) track.style.transform = ''
            const items = getItems(root)
            for (let i = 0; i < items.length; i++) {
                items[i].classList.toggle('this', i === state.index)
            }
        }

        /**
         * 按当前效果渲染位置
         * @param {HTMLElement} root 轮播根元素
         */
        function renderPosition(root) {
            const state = root._bnyCarousel
            if (state.effect === 'fade') return
            if (state.effect === 'coverflow') renderCoverflow(root, state.pos)
            else renderSlide(root, state.pos)
        }

        /**
         * 停止进行中的补间动画
         * @param {HTMLElement} root 轮播根元素
         */
        function stopAnim(root) {
            const state = root._bnyCarousel
            if (state.anim) {
                cancelAnimationFrame(state.anim.raf)
                state.anim = null
            }
        }

        /**
         * 补间动画：pos 从当前值动画到目标值（rAF + easeOutCubic）
         * @param {HTMLElement} root 轮播根元素
         * @param {number} target 目标位置
         * @param {number} duration 时长 ms
         * @param {Function} onDone 结束回调
         */
        function animateTo(root, target, duration, onDone) {
            const state = root._bnyCarousel
            stopAnim(root)
            const from = state.pos
            const dist = target - from
            if (!duration || dist === 0) {
                state.pos = target
                renderPosition(root)
                syncUI(root)
                if (typeof onDone === 'function') onDone()
                return
            }
            const start = performance.now()
            state.anim = { raf: 0 }
            function frame(now) {
                const t = Math.min(1, (now - start) / duration)
                const e = 1 - Math.pow(1 - t, 3)
                state.pos = from + dist * e
                renderPosition(root)
                syncUI(root)
                if (t < 1) {
                    state.anim.raf = requestAnimationFrame(frame)
                } else {
                    state.anim = null
                    if (typeof onDone === 'function') onDone()
                }
            }
            state.anim.raf = requestAnimationFrame(frame)
        }

        /**
         * 动画到目标位置（处理循环钳制与结束归一）
         * @param {HTMLElement} root 轮播根元素
         * @param {number} target 目标位置（可为越界值，如 -1 / count 表示经克隆环绕）
         */
        function animateGo(root, target) {
            const state = root._bnyCarousel
            const count = getItems(root).length
            if (!state.loop) {
                target = Math.max(0, Math.min(target, count - 1))
            } else if (state.effect === 'slide') {
                // slide 循环：目标钳制在克隆区间 [-1, count]
                target = Math.max(-1, Math.min(target, count))
            }
            animateTo(root, target, 350, function () {
                // 归一回 [0, count)：克隆项 / 取模保证视觉等价，无跳变
                state.pos = normalizePos(root, state.pos)
                renderPosition(root)
                syncUI(root)
            })
        }

        /**
         * 切换到指定索引（loop 模式走最短路径，slide 单步经克隆无缝环绕）
         * @param {HTMLElement} root 轮播根元素
         * @param {number} index 目标索引
         */
        function go(root, index) {
            const state = root._bnyCarousel
            const count = getItems(root).length
            if (count === 0) return
            // fade：整数切换 .this 类即可
            if (state.effect === 'fade') {
                if (state.loop) index = ((index % count) + count) % count
                else index = Math.max(0, Math.min(index, count - 1))
                state.index = index
                state.pos = index
                renderFade(root)
                updateIndicatorThis(root)
                updateArrows(root)
                return
            }
            let target
            if (state.loop) {
                // 最短路径：delta 归一到 (-count/2, count/2]
                const cur = state.pos
                let d = ((index - cur) % count + count) % count
                if (d > count / 2) d -= count
                if (state.effect === 'slide' && Math.abs(d) > 1) {
                    // slide 远跳：直接补间到归一目标（经过中间项，克隆区间外无环绕动画）
                    target = ((index % count) + count) % count
                } else {
                    target = cur + d
                }
            } else {
                target = Math.max(0, Math.min(index, count - 1))
            }
            animateGo(root, target)
        }

        /**
         * 重建克隆项（slide + 循环模式）：首尾各挂一份克隆实现无缝环绕
         * @param {HTMLElement} root 轮播根元素
         */
        function rebuildClones(root) {
            const state = root._bnyCarousel
            const track = getTrack(root)
            if (!track) return
            // 清理旧克隆
            Array.from(track.children).forEach(function (el) {
                if (el.classList.contains('carousel-clone')) el.remove()
            })
            if (state.effect !== 'slide' || !state.loop) return
            const items = getItems(root)
            if (items.length < 2) return
            /**
             * 克隆并剥离 id / hx-* 触发属性（避免克隆体重复发请求、锚点冲突）
             * @param {HTMLElement} src 源元素
             * @returns {HTMLElement} 克隆元素
             */
            function makeClone(src) {
                const c = src.cloneNode(true)
                c.classList.add('carousel-clone')
                c.classList.remove('this')
                const all = [c].concat(Array.from(c.querySelectorAll('*')))
                all.forEach(function (el) {
                    Array.from(el.attributes).forEach(function (attr) {
                        const n = attr.name.toLowerCase()
                        if (n === 'id' || n.substring(0, 3) === 'hx-') {
                            el.removeAttribute(attr.name)
                        }
                    })
                })
                return c
            }
            // 末项克隆挂头部（向后环绕）、首项克隆挂尾部（向前环绕）
            track.insertBefore(makeClone(items[items.length - 1]), track.firstChild)
            track.appendChild(makeClone(items[0]))
        }

        /**
         * 更新自动播放（hover 暂停 / 拖拽暂停 / 单项禁用 / 节点移除自清理）
         * 离散模式：setInterval；smooth 模式：rAF 连续滚动
         * @param {HTMLElement} root 轮播根元素
         */
        function updateAutoplay(root) {
            const state = root._bnyCarousel
            // 离散定时器
            if (state.timer) {
                clearInterval(state.timer)
                state.timer = null
            }
            const count = getItems(root).length
            const active = !state.pausedByHover && !state.pausedByDrag && count > 1 && root.isConnected
            if (state.smooth) {
                if (active) startSmooth(root)
                else stopSmooth(root)
                return
            }
            if (!state.autoplayMs || !active) {
                stopSmooth(root)
                return
            }
            state.timer = setInterval(function () {
                // 根已从文档移除：清理定时器，防止内存泄漏
                if (!root.isConnected) {
                    clearInterval(state.timer)
                    state.timer = null
                    return
                }
                go(root, state.index + 1)
            }, state.autoplayMs)
        }

        /**
         * 启动 smooth 丝滑连续滚动（rAF 每帧推进 pos）
         * @param {HTMLElement} root 轮播根元素
         */
        function startSmooth(root) {
            const state = root._bnyCarousel
            if (state.rafId || !state.smooth) return
            let last = performance.now()
            function frame(now) {
                state.rafId = requestAnimationFrame(frame)
                if (!root.isConnected) {
                    stopSmooth(root)
                    return
                }
                // 暂停中或补间中：跳过推进
                if (state.pausedByHover || state.pausedByDrag || state.anim) return
                let dt = Math.min(100, now - last)
                last = now
                const view = bny.queryChild(root, '.carousel-view')
                const vw = view ? view.clientWidth : 0
                const count = getItems(root).length
                if (!vw || count < 2) return
                // pos 前进量 = 速度(px/s) × 时间 / 视口宽
                state.pos += state.smoothDir * (state.speed * dt / 1000) / vw
                if (state.loop) {
                    // 环绕：越过 count 归一（slide 靠克隆、coverflow 靠取模，视觉等价无缝）
                    if (state.pos >= count) state.pos -= count
                    else if (state.pos < 0) state.pos += count
                } else {
                    // 非循环：乒乓反弹
                    if (state.pos >= count - 1) {
                        state.pos = count - 1
                        state.smoothDir = -1
                    } else if (state.pos <= 0) {
                        state.pos = 0
                        state.smoothDir = 1
                    }
                }
                renderPosition(root)
                syncUI(root)
            }
            state.rafId = requestAnimationFrame(frame)
        }

        /**
         * 停止 smooth 滚动
         * @param {HTMLElement} root 轮播根元素
         */
        function stopSmooth(root) {
            const state = root._bnyCarousel
            if (state.rafId) {
                cancelAnimationFrame(state.rafId)
                state.rafId = 0
            }
        }

        /**
         * 刷新：单项标记 / 索引同步 / 指示器重建 / 克隆重建 / 状态应用 / 自动播放重建
         * @param {HTMLElement} root 轮播根元素
         */
        function refresh(root) {
            const state = root._bnyCarousel
            const count = getItems(root).length
            // 仅 1 项时隐藏箭头与指示器（CSS 控制 display:none）
            root.classList.toggle('single', count <= 1)
            // 位置与索引同步
            state.pos = normalizePos(root, state.pos)
            state.index = indexFromPos(root)
            // 指示器（数量与项数一致）
            rebuildIndicator(root)
            // 克隆（slide + 循环）
            rebuildClones(root)
            // 应用当前状态
            if (state.effect === 'fade') renderFade(root)
            else renderPosition(root)
            // 箭头禁用态
            updateArrows(root)
            // 自动播放
            updateAutoplay(root)
        }

        /**
         * 绑定事件（全部在根元素上：根在 innerHTML swap 后仍存活，监听不丢失）
         * @param {HTMLElement} root 轮播根元素
         */
        function bindEvents(root) {
            const state = root._bnyCarousel

            // 箭头与指示器（click 委托，限定根的直接子级避免误触项内同名元素）
            root.addEventListener('click', function (e) {
                const left = e.target.closest('.btn-left')
                if (left && left.parentElement === root) {
                    go(root, state.index - 1)
                    return
                }
                const right = e.target.closest('.btn-right')
                if (right && right.parentElement === root) {
                    go(root, state.index + 1)
                    return
                }
                const li = e.target.closest('li')
                if (li && li.parentElement &&
                    li.parentElement.classList.contains('indicator') &&
                    li.parentElement.parentElement === root) {
                    const index = bny.indexOf(li)
                    if (index !== null) go(root, index)
                }
            })

            // 键盘：左右方向键切换
            root.addEventListener('keydown', function (e) {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault()
                    go(root, state.index - 1)
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault()
                    go(root, state.index + 1)
                }
            })

            // 自动播放：hover 暂停 / 离开恢复
            root.addEventListener('mouseenter', function () {
                state.pausedByHover = true
                updateAutoplay(root)
            })
            root.addEventListener('mouseleave', function () {
                state.pausedByHover = false
                updateAutoplay(root)
            })

            // ===== 手动拖拽（Pointer Events，slide / coverflow 生效） =====

            /**
             * 指针按下：记录起点进入"待定"状态（轴锁定后才真正拖拽）
             */
            function onPointerDown(e) {
                if (!state.draggable) return
                if (state.effect === 'fade') return
                if (getItems(root).length < 2) return
                if (state.drag) return // 已有拖拽进行中，忽略后续指针（多点触控）
                if (e.pointerType === 'mouse' && e.button !== 0) return
                const view = bny.queryChild(root, '.carousel-view')
                // 点击必须落在本视口内（箭头/指示器在视口外；嵌套轮播各管各的）
                if (!view || e.target.closest('.carousel-view') !== view) return
                // 取消进行中的补间，从当前位置接手拖拽
                stopAnim(root)
                state.drag = {
                    pointerId: e.pointerId,
                    startX: e.clientX,
                    startY: e.clientY,
                    startTime: Date.now(),
                    active: false,   // 是否已进入水平拖拽
                    rejected: false, // 是否已放弃（垂直滚动主导）
                    dx: 0,          // 最近一次水平位移
                    width: view.clientWidth,
                    startPos: state.pos
                }
                // 捕获指针：后续 move/up 持续派发到 view（冒泡到根上的监听）
                try { view.setPointerCapture(e.pointerId) } catch (_) { }
            }

            /**
             * 指针移动：轴锁定判定 + pos 跟手推进 + 边界处理
             */
            function onPointerMove(e) {
                const d = state.drag
                if (!d || e.pointerId !== d.pointerId) return
                const dx = e.clientX - d.startX
                const dy = e.clientY - d.startY
                if (!d.active) {
                    if (d.rejected) return
                    // 轴锁定：水平位移超 10px 且大于垂直位移才进入拖拽（避免劫持垂直滚动）
                    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
                        d.active = true
                        root.classList.add('dragging') // CSS 光标切换
                        state.pausedByDrag = true
                        updateAutoplay(root)
                    } else if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
                        d.rejected = true // 垂直滚动主导，放弃拖拽
                        return
                    } else {
                        return
                    }
                }
                d.dx = dx
                e.preventDefault()
                const count = getItems(root).length
                // pos 跟手：向左拖（dx < 0）→ pos 增（切到下一项）
                let pos = d.startPos - dx / d.width
                if (!state.loop) {
                    // 非循环：越界部分 × 0.35 橡皮筋阻尼
                    if (pos < 0) pos = pos * 0.35
                    else if (pos > count - 1) pos = (count - 1) + (pos - (count - 1)) * 0.35
                } else if (state.effect === 'slide') {
                    // slide 循环：钳制在克隆区间 [-1, count]
                    if (pos < -1) pos = -1
                    else if (pos > count) pos = count
                }
                // coverflow 循环：pos 自由延伸（渲染时按取模环绕）
                state.pos = pos
                renderPosition(root)
                syncUI(root)
            }

            /**
             * 指针抬起/取消：位移与速度判定吸附相邻项或回弹，抑制误触发 click
             */
            function onPointerUp(e) {
                const d = state.drag
                if (!d || e.pointerId !== d.pointerId) return
                state.drag = null
                root.classList.remove('dragging')
                if (!d.active) return // 未进入拖拽：普通点击，无需处理
                // 判定：位移超 1/3 视口宽 或 速度超 0.5px/ms → 切换相邻项；否则回弹
                const dt = Math.max(1, Date.now() - d.startTime)
                const speed = Math.abs(d.dx) / dt
                let target
                if (Math.abs(d.dx) > d.width / 3 || speed > 0.5) {
                    // 向左拖（dx<0，pos 增）→ 取下一整数；向右拖 → 取上一整数
                    target = d.dx < 0 ? Math.floor(state.pos) + 1 : Math.ceil(state.pos) - 1
                } else {
                    target = Math.round(state.pos)
                }
                animateGo(root, target)
                // 拖拽位移超过 10px：抑制下一次 click（防止拖拽误触发项内链接）
                if (Math.abs(d.dx) > 10) {
                    root.addEventListener('click', function (ev) {
                        ev.preventDefault()
                        ev.stopPropagation()
                    }, { capture: true, once: true })
                }
                // 恢复自动播放（与 hover 标志都清除才真正恢复）
                state.pausedByDrag = false
                updateAutoplay(root)
            }

            root.addEventListener('pointerdown', onPointerDown)
            // 非 passive：拖拽中需要 preventDefault 阻止页面滚动
            root.addEventListener('pointermove', onPointerMove, { passive: false })
            root.addEventListener('pointerup', onPointerUp)
            root.addEventListener('pointercancel', onPointerUp)

            // 拖拽待定/进行中：阻止图片等原生拖拽干扰指针拖拽
            root.addEventListener('dragstart', function (e) {
                if (state.drag) e.preventDefault()
            })

            // 窗口尺寸变化：重算渲染（coverflow 间距依赖视口宽）；根已移除时解绑
            function onResize() {
                if (!root.isConnected) {
                    window.removeEventListener('resize', onResize)
                    return
                }
                renderPosition(root)
            }
            window.addEventListener('resize', onResize)
        }

        /**
         * 初始化轮播（读取属性、加修饰类、建结构、绑事件、刷新）
         * @param {HTMLElement} root 轮播根元素
         */
        function init(root) {
            // 切换效果
            const effectRaw = root.getAttribute('carousel-effect')
            const effect = effectRaw === 'fade' || effectRaw === 'coverflow' ? effectRaw : 'slide'
            // 循环模式
            const loop = root.getAttribute('carousel-loop') !== 'false'
            // 箭头显示
            const arrow = root.getAttribute('carousel-arrow') ?? 'hover'
            // 指示器显示
            const indicator = root.getAttribute('carousel-indicator') ?? 'inside'
            // 手动拖拽
            const draggable = root.getAttribute('carousel-drag') !== 'false'
            // 自动播放：间隔 ms 或 smooth（fade 无连续滚动，退化为 3000ms 离散）
            let autoplayMs = 0
            let smooth = false
            const autoplayAttr = root.getAttribute('carousel-autoplay')
            if (autoplayAttr !== null && autoplayAttr !== 'false') {
                if (autoplayAttr === 'smooth') {
                    if (effect === 'fade') autoplayMs = 3000
                    else smooth = true
                } else {
                    const n = Number(autoplayAttr)
                    if (Number.isFinite(n) && n > 0) autoplayMs = n
                }
            }
            // smooth 滚动速度（px/s）
            let speed = 60
            const speedAttr = Number(root.getAttribute('carousel-speed'))
            if (Number.isFinite(speedAttr) && speedAttr > 0) speed = speedAttr
            // 初始索引
            const startIndex = Math.max(0, Number(root.getAttribute('carousel-index') ?? 0) || 0)
            // 修饰类
            if (arrow === 'always') root.classList.add('arrow-always')
            else if (arrow === 'none') root.classList.add('arrow-none')
            if (indicator === 'outside') root.classList.add('indicator-outside')
            else if (indicator === 'none') root.classList.add('indicator-none')
            if (effect === 'fade') root.classList.add('effect-fade')
            else if (effect === 'coverflow') root.classList.add('effect-coverflow')
            // 高度：未显式指定时，coverflow（项为绝对定位）需兜底高度撑起容器
            const height = root.getAttribute('carousel-height')
            if (height) root.style.height = height
            else if (effect === 'coverflow') root.style.height = '320px'
            // 键盘可达
            if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '0')
            // 状态（幂等守卫：已初始化的根不再重复初始化）
            root._bnyCarousel = {
                index: startIndex,      // 当前索引（整数）
                pos: startIndex,        // 当前位置（浮点，拖拽/补间/连续滚动共用）
                effect: effect,
                loop: loop,
                draggable: draggable,
                autoplayMs: autoplayMs, // 离散自动播放间隔（0 = 禁用）
                smooth: smooth,         // 丝滑连续滚动
                speed: speed,           // smooth 滚动速度 px/s
                smoothDir: 1,           // smooth 滚动方向（非循环乒乓反弹时反转）
                timer: null,            // 离散自动播放定时器
                rafId: 0,               // smooth 滚动 rAF 句柄
                anim: null,             // 补间动画状态
                pausedByHover: false,
                pausedByDrag: false,
                drag: null
            }
            // 结构
            ensureStructure(root)
            // 事件
            bindEvents(root)
            // 刷新
            refresh(root)
        }

        /**
         * 吸收：htmx swap 新内容进根后恢复结构并刷新
         * （根未初始化时退化为初始化，兼容只处理子节点的场景）
         * @param {HTMLElement} root 轮播根元素
         */
        function absorb(root) {
            if (!root._bnyCarousel) {
                init(root)
                return
            }
            ensureStructure(root)
            refresh(root)
        }

        // 在htmx初始化节点后触发
        if (name === 'htmx:afterProcessNode') {
            const target = evt.target
            // 轮播根：首次初始化（幂等守卫在 init/absorb 内），已初始化则走吸收逻辑
            if (bny.hasExtName(target, 'bny-carousel')) {
                absorb(target)
                return false
            }
            // 新 swap 进来的项：父级是带扩展的轮播根（htmx 把新内容 swap 到根）
            if (target.nodeType === 1 && target.parentElement &&
                bny.hasExtName(target.parentElement, 'bny-carousel')) {
                absorb(target.parentElement)
                return false
            }
        }
        return true
    },

    // 响应转换：JSON 数组 → 轮播项 HTML
    transformResponse: function (text, xhr, elt) {

        /**
         * 渲染单个轮播项
         * - 对象 { html }：可信原始 HTML（调用方保证安全，参考 table.js 的 __html 约定）
         * - 对象 { src, title?, link?, target? }：图片 + 可选标题浮层 + 可选链接（全部转义防 XSS）
         * - 字符串/数字：escapeChars 转义为纯文本
         * @param {*} item 数据项
         * @returns {string} HTML
         */
        function renderItem(item) {
            if (item !== null && typeof item === 'object') {
                // 原始 HTML（可信内容，由调用方保证安全）
                if (typeof item.html !== 'undefined') {
                    return '<div class="carousel-item">' + String(item.html) + '</div>'
                }
                // 图片项
                if (typeof item.src !== 'undefined') {
                    const src = bny.escapeChars(String(item.src))
                    const title = item.title != null ? bny.escapeChars(String(item.title)) : ''
                    let inner = '<img src="' + src + '" alt="' + title + '">'
                    // 底部标题浮层
                    if (title) {
                        inner += '<div class="carousel-caption">' + title + '</div>'
                    }
                    // 整项链接
                    if (item.link) {
                        const link = bny.escapeChars(String(item.link))
                        const target = item.target ? ' target="' + bny.escapeChars(String(item.target)) + '"' : ''
                        return '<div class="carousel-item"><a href="' + link + '"' + target + '>' + inner + '</a></div>'
                    }
                    return '<div class="carousel-item">' + inner + '</div>'
                }
                // 其他对象：JSON 串化后转义显示
                return '<div class="carousel-item">' + bny.escapeChars(JSON.stringify(item)) + '</div>'
            }
            // 字符串/数字：纯文本
            return '<div class="carousel-item">' + bny.escapeChars(String(item)) + '</div>'
        }

        const ct = xhr.getResponseHeader('Content-Type') || ''
        if (!ct.includes('application/json')) return text
        let json
        try {
            json = JSON.parse(xhr.responseText)
        } catch (e) {
            return text
        }
        // 兼容 { data: [...] } 包裹与平铺数组两种结构
        const data = json.data || json
        // 必须是数组才处理，否则原样返回
        if (!Array.isArray(data)) return text
        return data.map(renderItem).join('')
    }
});
