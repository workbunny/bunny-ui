/**
 * bny-select — 多功能选择框（htmx 扩展）
 *
 * 设计：
 * - 承载元素三种写法（ul 直接承载最简洁，推荐）：
 *     1. <ul hx-ext="bny-select" select-name="city">…</ul>  ul 本身变身组件：
 *        子 li 即选项，解析进模型后移除，DOM 零冗余
 *     2. <div hx-ext="bny-select" select-name="city">…<ul>…</ul>…</div>
 *        容器承载，内联 ul 解析后隐藏保留（兼容写法）
 *     3. <select hx-ext="bny-select">…</select>  渐进增强：原生 option/optgroup
 *        作为选项源，select 本身继续充当值域
 * - 值域：ul/div 承载时组件生成 <input class="value" name="...">（视觉隐藏但可聚焦）；
 *   select 承载时沿用原生 select。两种形态都能被 bny-form 与 htmx 表单序列化直接命中，
 *   无需任何适配代码。
 * - 选项源三选一（优先级从高到低）：
 *     1. 承载元素自身的 li（ul 承载）或内联 <ul> 静态片段（div 承载，解析后隐藏）
 *     2. <select> 承载时的原生 option / optgroup
 *     3. hx-get 远程请求：首次展开自动请求一次；响应为 HTML 片段或 JSON 数组自动识别
 *        （声明了 hx-trigger 时完全交给 htmx 事件触发，响应同样由组件接管渲染）
 * - 多选：值以逗号合并写入值域（tags=1,2,3），界面以 chips 回显、可逐个移除
 * - 树形：option-parent 引用父级 value 表达层级（或 JSON children 嵌套），缩进与折叠箭头由
 *   组件注入并按父先子后重排渲染，服务端片段无需关心顺序与缩进；父子联动默认开启
 *   （勾父全选子、部分选中时祖先半选），select-tree-strict 可关闭联动
 *
 * 用法：
 *   <ul hx-ext="bny-select" select-name="city" select-placeholder="请选择城市">
 *       <li option-value="1">北京</li>
 *       <li option-value="2" option-disabled>天津（停用）</li>
 *   </ul>
 *
 *   <ul hx-ext="bny-select" select-name="dept" select-tree select-multiple
 *       hx-get="/api/depts"></ul>
 *
 * 属性（声明在扩展元素上）：
 *   select-name        值域字段名（ul/div 承载时必填；select 承载时沿用原生 name）
 *   select-value       初始值，逗号分隔（优先级高于片段/JSON 的 option-selected/selected）
 *   select-placeholder 占位文本，缺省"请选择"
 *   select-multiple    多选：chips 回显、可逐个移除
 *   select-max         多选上限，超出不生效（也不报错，静默忽略）
 *   select-tree        树形（option-parent 引用父级或 JSON children，可折叠）
 *   select-tree-strict 树形下关闭父子联动
 *   select-clearable   有值时显示清空按钮
 *   select-disabled    禁用（值域同步 disabled，bny-form 跳过校验）
 *   select-required    透传 required 到值域（配合 bny-form 校验）
 *   select-empty       无选项时的空态文案，缺省"无匹配数据"
 *   select-panel-max   面板最大高度（CSS 长度值），缺省 260px
 *   form-size          sm|lg 尺寸变体
 *   hx-get / hx-post   远程选项源（响应由组件接管渲染，不做 htmx 交换）
 *
 * 片段节点契约（服务端返回或内联书写，li 无需任何 class）：
 *   <li option-value="1">北京</li>          选项：值缺省用文本
 *   option-disabled / option-selected      停用 / 默认选中
 *   option-parent="父value"                树形：引用父节点的 option-value；缺省即顶层
 *   <li option-group>分组</li>              分组标题，不可选
 *
 * JSON 契约（数组，或 {data|list|options:[...]} 自动解包）：
 *   "北京" | 1                                  字符串/数字 → value 与文本相同
 *   {value, label, disabled, selected, level}   选项
 *   {label, children:[...]}                     分组标题（无 value，不可选）
 *   {value, label, children:[...]}              树形父节点（有 value，children 层级 +1）
 *
 * DOM 约定：生成元素锚点 .bny-select-box / .bny-select-panel（与 form.css 原生 select
 * 增强的 .bny-select 互不干扰），内部子元素用短类名靠嵌套作用域隔离，样式见 select.css。
 *
 * 事件：值变化时向值域派发 change/input（供 bny-form 清除错误），
 *       并向承载元素派发冒泡的 bny:select:change，detail = {values, items, elt}
 */
(function () {
    'use strict';

    // ==================== 模块级共享（每个 select 实例不再重复注册 document 监听）====================

    /** 当前打开的面板实例，同时只允许存在一个 */
    var current = null;
    /** 全局委托注册标志 */
    var delegated = false;

    /**
     * 关闭当前打开的面板
     * @param {Object} [inst] 仅在该实例处于打开状态时才关闭，缺省则无条件关闭
     */
    function closePanel(inst) {
        if (!current) return;
        if (inst && current !== inst) return;
        var panel = current.panel;
        if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
        current.box.classList.remove('open');
        current.trigger.setAttribute('aria-expanded', 'false');
        current = null;
    }

    /**
     * 注册 document 级委托：点击面板与触发器之外关闭、Esc 关闭、滚动/缩放时重定位
     * 只执行一次
     */
    function ensureDelegation() {
        if (delegated) return;
        delegated = true;

        // 捕获阶段监听：tab/menu/dropdown 等组件点击时会 stopPropagation 截断冒泡，
        // 冒泡阶段监听收不到这些点击，导致"点其他按钮面板不关"；捕获阶段先于
        // 任何目标阶段的 stopPropagation 执行，任何点击都逃不掉
        document.addEventListener('click', function (e) {
            if (!current) return;
            // 面板选项点击不做局部 DOM 重建（走增量同步），e.target 始终在面板内；
            // 会重建 DOM 的点击（折叠箭头、chips、清空）都已 stopPropagation，到不了这里
            if (current.panel.contains(e.target)) return;
            if (current.box.contains(e.target)) return;
            closePanel();
        }, true);

        document.addEventListener('keydown', function (e) {
            if (!current) return;
            if (e.key === 'Escape') {
                var inst = current;
                closePanel();
                // 关闭后焦点还给触发器，避免键盘用户焦点丢失
                if (inst) { try { inst.trigger.focus(); } catch (err) { } }
                return;
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                moveFocus(e.key === 'ArrowDown' ? 1 : -1);
                return;
            }
            if (e.key === 'Enter') {
                var li = current.panel.querySelector('.option.focus');
                if (li) {
                    e.preventDefault();
                    // 捕获阶段消费事件：选中后面板已关，若放行到 trigger（target 阶段），
                    // trigger 的 keydown 会判定"面板未开"而重新打开面板
                    e.stopPropagation();
                    toggleOption(current, li);
                }
            }
        }, true);

        // 滚动/缩放：面板跟随触发器重定位；触发器滚出视口则关闭。
        // 面板内部滚动（scrollOptionIntoPanel 调整 scrollTop）必须忽略，
        // 否则打开面板时滚动到已选项会立刻触发"触发器滚出视口"误判而自关
        var reposition = function (e) {
            if (!current) return;
            if (e && e.target && current.panel.contains(e.target)) return;
            var r = current.trigger.getBoundingClientRect();
            if (r.bottom < 0 || r.top > window.innerHeight) {
                closePanel();
                return;
            }
            positionPanel(current);
        };
        window.addEventListener('scroll', reposition, true);
        window.addEventListener('resize', reposition);
    }

    /**
     * 键盘上下移动高亮项（跳过分组标题与停用项）
     * @param {number} dir 1 向下 / -1 向上
     */
    function moveFocus(dir) {
        var list = Array.prototype.slice.call(
            current.panel.querySelectorAll('.option')
        ).filter(function (li) {
            return li.style.display !== 'none' && !li.hasAttribute('data-disabled');
        });
        if (!list.length) return;
        var idx = -1;
        for (var i = 0; i < list.length; i++) {
            if (list[i].classList.contains('focus')) { idx = i; break; }
        }
        list.forEach(function (li) { li.classList.remove('focus'); });
        var next = idx === -1 ? (dir > 0 ? 0 : list.length - 1) : (idx + dir + list.length) % list.length;
        list[next].classList.add('focus');
        scrollOptionIntoPanel(list[next]);
    }

    /**
     * 把选项滚进面板内部滚动区可见范围。
     * 不用 scrollIntoView：它会连带滚动 window 等祖先滚动容器并触发 scroll 事件，
     * 而"触发器滚出视口即关闭"的监听会立刻把刚打开的面板关掉（自触自杀）
     * @param {HTMLElement} li 选项元素
     */
    function scrollOptionIntoPanel(li) {
        var scroller = li.parentNode;   // ul.options 即滚动容器
        if (!scroller || !scroller.getBoundingClientRect) return;
        var sTop = scroller.getBoundingClientRect().top;
        var lTop = li.getBoundingClientRect().top;
        if (lTop < sTop) {
            scroller.scrollTop += lTop - sTop;
            return;
        }
        var lBottom = lTop + li.offsetHeight;
        var sBottom = sTop + scroller.clientHeight;
        if (lBottom > sBottom) scroller.scrollTop += lBottom - sBottom;
    }

    /**
     * 计算面板位置：宽度对齐触发器，垂直方向按剩余空间自动上/下翻转，水平防溢出
     * 参照 dropdown.js 的定位思路，但面板挂在 body 下（避免被祖先 overflow 裁剪）
     * @param {Object} inst 实例
     */
    function positionPanel(inst) {
        var rect = inst.trigger.getBoundingClientRect();
        var panel = inst.panel;
        var gap = 4;
        var vh = window.innerHeight;
        var vw = window.innerWidth;

        // 先挂上去才能量到真实高度
        panel.style.visibility = 'hidden';
        panel.style.display = 'block';

        var ph = panel.offsetHeight;
        var spaceBelow = vh - rect.bottom;
        var spaceAbove = rect.top;

        panel.style.top = '';
        panel.style.bottom = '';
        if (spaceBelow >= ph + gap || spaceBelow >= spaceAbove) {
            panel.style.top = (rect.bottom + gap) + 'px';
            panel.classList.remove('up');
        } else {
            panel.style.bottom = (vh - rect.top + gap) + 'px';
            panel.classList.add('up');
        }

        // 宽度对齐触发器（最小 160px）
        var w = Math.max(rect.width, 160);
        panel.style.width = w + 'px';
        var left = rect.left;
        if (left + w > vw - gap) left = Math.max(gap, vw - w - gap);
        panel.style.left = left + 'px';

        // 高度超出视口可用空间时交给面板内部滚动
        var maxH = Math.max(120, (spaceBelow >= ph + gap ? spaceBelow : spaceAbove) - gap * 2);
        if (panel.offsetHeight > maxH) {
            panel.querySelector('.options').style.maxHeight = maxH + 'px';
        }

        panel.style.visibility = 'visible';
    }

    // ==================== 选项模型 ====================

    /**
     * 由扁平层级构建父子关系：level 数值连续的后者为前者子孙
     * @param {Array<Object>} items 选项数组（须已按渲染顺序排列且带 level）
     */
    function buildTree(items) {
        var stack = [];
        items.forEach(function (it) {
            it.children = [];
            it.parent = null;
            while (stack.length && stack[stack.length - 1].level >= it.level) stack.pop();
            if (stack.length) {
                it.parent = stack[stack.length - 1];
                it.parent.children.push(it);
                it.parent.hasChildren = true;
            }
            stack.push(it);
        });
    }

    /**
     * 解析内联静态片段或服务端 HTML 片段
     * 节点契约（li 无需任何 class）：
     *   <li option-value="1">北京</li>                  选项（值缺省用文本）
     *   <li option-value="2" option-disabled>停用</li>   停用项
     *   <li option-value="3" option-selected>预选</li>   默认选中
     *   <li option-value="4" option-parent="2">子级</li> 树形：引用父节点 option-value
     *   <li option-group>分组标题</li>                   分组标题，不可选
     * @param {HTMLElement} src 包含 li 的容器（ul 或临时 div）
     * @returns {Array<Object>} 选项模型数组
     */
    function parseFragment(src) {
        var items = [];
        var nodes = src.children ? Array.prototype.slice.call(src.children) : [];
        // 片段可能包一层 ul
        if (nodes.length === 1 && nodes[0].tagName === 'UL') {
            nodes = Array.prototype.slice.call(nodes[0].children);
        }
        nodes.forEach(function (li) {
            if (!li.tagName || li.tagName !== 'LI') return;
            if (li.hasAttribute('option-group')) {
                items.push({
                    isGroup: true,
                    text: li.textContent.trim(),
                    level: 0
                });
                return;
            }
            var ref = li.getAttribute('option-parent');
            items.push({
                value: li.getAttribute('option-value') || li.textContent.trim(),
                text: li.textContent.trim(),
                disabled: li.hasAttribute('option-disabled'),
                selected: li.hasAttribute('option-selected'),
                parentRef: (ref === null || ref === '') ? null : ref,
                level: 0,
                children: []
            });
        });
        return resolveByParent(items);
    }

    /**
     * 按 option-parent 引用构建树：挂 children、计算 level，并按"父先子后"深度优先
     * 重排线性顺序（HTML 乱序也能还原树形）。悬空引用与自引用按顶层处理；
     * 引用成环时后挂者作顶层，均不会崩溃。分组保持原线性位置，不参与父子关系。
     * 无任何 parentRef 的纯平铺列表原样返回（level 全 0）。
     * @param {Array<Object>} items parseFragment 产出的线性选项
     * @returns {Array<Object>} 重排后的线性选项
     */
    function resolveByParent(items) {
        var map = {};
        items.forEach(function (it) {
            if (!it.isGroup && it.value !== undefined && !(it.value in map)) map[it.value] = it;
        });
        var hasRef = false;
        // 检查把 node 挂到 p 下是否成环（p 的祖先链上已含 node）
        function createsCycle(p, node) {
            while (p) {
                if (p === node) return true;
                p = p.parent;
            }
            return false;
        }
        items.forEach(function (it) {
            if (it.isGroup) return;
            var p = it.parentRef !== null ? map[it.parentRef] : null;
            if (p && p !== it && !createsCycle(p, it)) {
                it.parent = p;
                p.children.push(it);
                hasRef = true;
            } else {
                it.parent = null;
            }
        });
        if (!hasRef) return items;
        // level = 沿 parent 链向上计数（guard 防御异常环）
        items.forEach(function (it) {
            if (it.isGroup) { it.level = 0; return; }
            var lv = 0, p = it.parent, guard = items.length;
            while (p && guard-- > 0) { lv++; p = p.parent; }
            it.level = lv;
        });
        // 深度优先展开：顶层按原顺序，子项紧跟父节点（buildTree 依赖此顺序与连续 level）
        var out = [];
        function dfs(node) {
            node.children.forEach(function (c) {
                out.push(c);
                dfs(c);
            });
        }
        items.forEach(function (it) {
            if (it.isGroup) { out.push(it); return; }
            if (it.parent) return;   // 由父节点展开
            out.push(it);
            dfs(it);
        });
        return out;
    }

    /**
     * 解析原生 select 的 option / optgroup
     * @param {HTMLSelectElement} sel
     * @returns {Array<Object>} 选项模型数组
     */
    function parseNative(sel) {
        var items = [];
        Array.prototype.slice.call(sel.children).forEach(function (node) {
            if (node.tagName === 'OPTGROUP') {
                items.push({ isGroup: true, text: node.label, level: 0 });
                Array.prototype.slice.call(node.children).forEach(function (o) {
                    items.push(nativeOption(o, 0));
                });
                return;
            }
            if (node.tagName === 'OPTION') items.push(nativeOption(node, 0));
        });
        return items;
    }

    /**
     * 单个原生 option → 选项模型
     * @param {HTMLOptionElement} o
     * @param {number} level
     */
    function nativeOption(o, level) {
        return {
            value: o.value,
            text: o.textContent.trim(),
            disabled: o.disabled,
            selected: o.selected,
            level: level,
            children: []
        };
    }

    /**
     * 解析 JSON 响应 → 选项模型（递归展开 children）
     * @param {*} data 已解析的 JSON（数组或包装对象）
     * @returns {Array<Object>} 选项模型数组
     */
    function parseJson(data) {
        var arr = data;
        if (!Array.isArray(arr) && arr && typeof arr === 'object') {
            arr = arr.data || arr.list || arr.options || [];
        }
        if (!Array.isArray(arr)) return [];

        var items = [];
        /**
         * 递归展开
         * @param {Array} list 同层节点
         * @param {number} level 层级
         */
        (function walk(list, level) {
            list.forEach(function (o) {
                if (o === null || o === undefined) return;
                // 纯字符串/数字：值即文本
                if (typeof o !== 'object') {
                    items.push({ value: String(o), text: String(o), level: level, children: [] });
                    return;
                }
                var hasValue = o.value !== undefined && o.value !== null;
                var kids = Array.isArray(o.children) ? o.children : null;
                // 无 value 且有 children → 分组标题（不可选）
                if (!hasValue && kids) {
                    items.push({ isGroup: true, text: String(o.label || o.text || ''), level: level });
                    walk(kids, level);
                    return;
                }
                var lv = o.level === undefined ? level : (parseInt(o.level, 10) || 0);
                items.push({
                    value: hasValue ? String(o.value) : '',
                    text: String(o.label || o.text || (hasValue ? o.value : '')),
                    disabled: !!o.disabled,
                    selected: !!o.selected,
                    level: lv,
                    children: []
                });
                // 有 value 且有 children → 树形父节点，子节点层级 +1
                if (hasValue && kids) walk(kids, lv + 1);
            });
        })(arr, 0);
        return items;
    }

    /**
     * 识别响应内容类型并解析为选项模型
     * @param {string} text 响应原文
     * @returns {Array<Object>} 选项模型数组
     */
    function parseResponse(text) {
        var s = String(text || '').trim();
        if (!s) return [];
        // HTML 片段：以 "<" 开头（含 <!-- 注释包裹的常见模板输出）
        if (s.charAt(0) === '<') {
            var box = document.createElement('div');
            box.innerHTML = s;
            return parseFragment(box);
        }
        // JSON
        try {
            return parseJson(JSON.parse(s));
        } catch (e) {
            console.warn('[bny-select] 选项响应解析失败，既非 HTML 片段也非合法 JSON');
            return [];
        }
    }

    // ==================== 渲染 ====================

    /**
     * 渲染面板内的选项列表
     * @param {Object} inst 实例
     */
    function renderOptions(inst) {
        var html = '';
        var visible = 0;

        inst.items.forEach(function (it) {
            // 祖先被折叠 → 自身也隐藏
            if (isHiddenByCollapse(it)) return;
            visible++;

            if (it.isGroup) {
                html += '<li class="group">' + bny.escapeChars(it.text) + '</li>';
                return;
            }

            var cls = 'option';
            if (it.disabled) cls += ' disabled';
            if (it.selected && !inst.multiple) cls += ' selected';
            // 树形缩进
            var pad = inst.tree ? ' style="padding-left:' + (12 + it.level * 18) + 'px"' : '';

            html += '<li class="' + cls + '" data-value="' + bny.escapeChars(String(it.value)) + '"' +
                (it.disabled ? ' data-disabled' : '') + pad + ' role="option">';

            // 树形折叠箭头（有子节点才渲染，无子节点占位保持缩进对齐）
            if (inst.tree) {
                if (it.hasChildren) {
                    html += '<i class="bny-icon ' + (it.collapsed ? 'icon-right' : 'icon-down') +
                        ' toggle" data-toggle="1"></i>';
                } else {
                    html += '<i class="toggle empty"></i>';
                }
            }

            // 多选框（含半选态）
            if (inst.multiple) {
                html += '<i class="check' +
                    (it.selected ? ' checked' : '') + (it.half ? ' half' : '') + '"></i>';
            }

            html += '<span class="text">' + bny.escapeChars(it.text) + '</span>';
            html += '</li>';
        });

        if (!visible) {
            html = '<li class="empty">' + bny.escapeChars(inst.empty) + '</li>';
        }

        inst.panel.querySelector('.options').innerHTML = html;
    }

    /**
     * 按值查找选项模型
     * @param {Object} inst 实例
     * @param {string} value 选项值
     * @returns {Object|null}
     */
    function itemByValue(inst, value) {
        var found = null;
        inst.items.forEach(function (x) {
            if (!x.isGroup && String(x.value) === String(value)) found = x;
        });
        return found;
    }

    /**
     * 增量同步面板内选项的选中/半选视觉，不重建 DOM
     * 选中态变化一律走这里：重建 innerHTML 会让点击目标脱离面板（触发外部点击误关），
     * 也会丢失滚动位置与键盘高亮
     * @param {Object} inst 实例
     */
    function syncOptionStates(inst) {
        var lis = inst.panel.querySelectorAll('.option');
        Array.prototype.forEach.call(lis, function (li) {
            var it = itemByValue(inst, li.getAttribute('data-value'));
            if (!it) return;
            li.classList.toggle('selected', !!it.selected);
            var check = li.querySelector('.check');
            if (check) {
                check.classList.toggle('checked', !!it.selected);
                check.classList.toggle('half', !!it.half);
            }
        });
    }

    /**
     * 判断选项是否因祖先折叠而隐藏
     * @param {Object} it 选项模型
     * @returns {boolean}
     */
    function isHiddenByCollapse(it) {
        var p = it.parent;
        while (p) {
            if (p.collapsed) return true;
            p = p.parent;
        }
        return false;
    }

    /**
     * 渲染触发框回显：单选为文本，多选为 chips
     * @param {Object} inst 实例
     */
    function renderTrigger(inst) {
        var picked = selectedItems(inst);
        var textEl = inst.trigger.querySelector('.text');
        var chipsEl = inst.trigger.querySelector('.chips');

        // 清空按钮：有值且开启 clearable
        var clearBtn = inst.trigger.querySelector('.clear');
        if (clearBtn) clearBtn.style.display = (inst.clearable && picked.length && !inst.disabled) ? '' : 'none';

        if (inst.multiple) {
            textEl.style.display = 'none';
            chipsEl.style.display = '';
            chipsEl.innerHTML = picked.map(function (it) {
                return '<span class="chip" data-value="' + bny.escapeChars(String(it.value)) + '">' +
                    '<span>' + bny.escapeChars(it.text) + '</span>' +
                    (inst.disabled ? '' : '<i class="bny-icon icon-close close" data-remove="1"></i>') +
                    '</span>';
            }).join('');
            if (!picked.length) {
                chipsEl.innerHTML = '<span class="placeholder">' +
                    bny.escapeChars(inst.placeholder) + '</span>';
            }
        } else {
            chipsEl.style.display = 'none';
            textEl.style.display = '';
            if (picked.length) {
                textEl.textContent = picked[0].text;
                textEl.classList.remove('placeholder');
            } else {
                textEl.textContent = inst.placeholder;
                textEl.classList.add('placeholder');
            }
        }
    }

    // ==================== 取值与联动 ====================

    /**
     * 取当前选中的选项模型（不含分组标题）
     * @param {Object} inst 实例
     * @returns {Array<Object>}
     */
    function selectedItems(inst) {
        return inst.items.filter(function (it) { return !it.isGroup && it.selected; });
    }

    /**
     * 同步值到值域元素（select 承载时同步 option.selected；div 承载时写入逗号串）
     * @param {Object} inst 实例
     */
    function syncValue(inst) {
        var host = inst.valueHost;
        var values = selectedItems(inst).map(function (it) { return it.value; });

        if (host.tagName === 'SELECT') {
            Array.prototype.slice.call(host.options).forEach(function (o) {
                o.selected = values.indexOf(o.value) > -1;
            });
        } else {
            host.value = values.join(',');
        }

        // 派发原生事件：让 bny-form 的 input 监听清除错误态，也让外部 change 监听生效
        try {
            host.dispatchEvent(new Event('input', { bubbles: true }));
            host.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (e) { /* 老浏览器忽略 */ }
        // 组件自定义事件（冒泡，便于业务侧监听）
        inst.elt.dispatchEvent(new CustomEvent('bny:select:change', {
            bubbles: true,
            detail: { values: values, items: selectedItems(inst), elt: inst.elt }
        }));
    }

    /**
     * 更新某节点的祖先半选/选中状态（自底向上）
     * @param {Object} it 选项模型
     */
    function updateAncestors(it) {
        var p = it.parent;
        while (p) {
            // 停用项不参与"全选"判定，否则含停用子节点的父节点永远到不了全选态
            var kids = p.children.filter(function (c) { return !c.isGroup && !c.disabled; });
            var on = kids.filter(function (c) { return c.selected; }).length;
            var half = kids.filter(function (c) { return c.half; }).length;
            if (on === kids.length && kids.length) {
                p.selected = true; p.half = false;
            } else if (on > 0 || half > 0) {
                p.selected = false; p.half = true;
            } else {
                p.selected = false; p.half = false;
            }
            p = p.parent;
        }
    }

    /**
     * 递归设置某节点及其后代的选中状态
     * @param {Object} it 选项模型
     * @param {boolean} on 是否选中
     */
    function setDeep(it, on) {
        // 停用项不参与联动：不可被勾选，也不会被父节点带动
        if (it.disabled) return;
        it.selected = on;
        it.half = false;
        it.children.forEach(function (c) { setDeep(c, on); });
    }

    /**
     * 点击/回车切换某个选项的选中态
     * @param {Object} inst 实例
     * @param {HTMLElement} li 选项 DOM
     */
    function toggleOption(inst, li) {
        if (li.hasAttribute('data-disabled')) return;
        var value = li.getAttribute('data-value');
        var it = inst.items.filter(function (x) { return !x.isGroup && x.value === value; })[0];
        if (!it) return;

        if (!inst.multiple) {
            // 单选：先清空其他
            inst.items.forEach(function (x) { x.selected = false; });
            it.selected = true;
            closePanel(inst);
        } else {
            var on = !it.selected;
            // 上限保护：达到上限且是要新增时静默忽略
            if (on && inst.max > 0 && selectedItems(inst).length >= inst.max) return;
            if (inst.tree && !inst.strict) {
                // 树形联动：选中/取消同时作用于全部后代
                setDeep(it, on);
            } else {
                it.selected = on;
                it.half = false;
            }
            if (inst.tree && !inst.strict) updateAncestors(it);
        }

        syncOptionStates(inst);
        renderTrigger(inst);
        syncValue(inst);
    }

    // ==================== 实例初始化 ====================

    /**
     * 构建组件 DOM 并绑定交互
     * @param {HTMLElement} elt 承载元素
     */
    function init(elt) {
        if (elt._bnySelectInit) return;
        elt._bnySelectInit = true;

        var isNative = elt.tagName === 'SELECT';

        // ---- 读配置 ----
        var name = isNative ? elt.getAttribute('name') : elt.getAttribute('select-name');
        var multiple = elt.hasAttribute('select-multiple') || (isNative && elt.multiple);
        var tree = elt.hasAttribute('select-tree');
        var disabled = elt.hasAttribute('select-disabled') || elt.disabled;
        var placeholder = elt.getAttribute('select-placeholder') || '请选择';
        var empty = elt.getAttribute('select-empty') || '无匹配数据';
        var clearable = elt.hasAttribute('select-clearable');
        var strict = elt.hasAttribute('select-tree-strict');
        var max = parseInt(elt.getAttribute('select-max'), 10) || 0;
        var sizeAttr = elt.getAttribute('form-size');

        // ---- 值域元素 ----
        var valueHost;
        if (isNative) {
            valueHost = elt;
            var wasMultiple = elt.multiple;
            elt.multiple = multiple;
            // 原生单选 select 会被浏览器隐式选中第一项；转多选时这不是用户意图，
            // 清掉隐式选中，避免首次点击选项变成"取消选中"
            if (!wasMultiple && multiple) elt.selectedIndex = -1;
        } else {
            valueHost = document.createElement('input');
            valueHost.type = 'text';
            valueHost.className = 'value';
            if (name) valueHost.name = name;
            if (elt.hasAttribute('select-required')) valueHost.required = true;
            // 校验文案与规则透传给值域，供 bny-form 取用
            ['valid-msg', 'valid-msg-required', 'valid-rules'].forEach(function (a) {
                var v = elt.getAttribute(a);
                if (v !== null) valueHost.setAttribute(a, v);
            });
        }

        // ---- 包裹与触发框 ----
        // 三种承载：select（渐进增强，值域即原生 select）、ul（列表本体直接承载，
        // ul 变身 box，原 li 解析进模型后移除，DOM 零冗余）、div（容器，内联 ul 作选项源）
        var isUl = !isNative && elt.tagName === 'UL';
        var box;
        var inlineItems = null;
        if (isUl) {
            // ul 承载：必须在清空前解析 li，否则源数据随 innerHTML 清空丢失
            inlineItems = parseFragment(elt);
            elt.innerHTML = '';
            box = elt;
            box.classList.add('bny-select-box');
        } else {
            box = document.createElement('div');
            box.className = 'bny-select-box';
        }
        if (sizeAttr) box.setAttribute('form-size', sizeAttr);
        if (disabled) box.classList.add('disabled');

        var trigger = document.createElement('div');
        trigger.className = 'trigger';
        trigger.setAttribute('tabindex', disabled ? '-1' : '0');
        trigger.setAttribute('role', 'combobox');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.innerHTML =
            '<span class="text placeholder"></span>' +
            '<span class="chips" style="display:none"></span>' +
            '<i class="bny-icon icon-close clear" style="display:none" title="清空"></i>' +
            '<i class="bny-icon icon-down arrow"></i>';

        // 承载元素是 select 时不能把自己塞进自己的子元素里。
        // 顺序必须是"先插入空的 box，再把 select 移入 box"——
        // 若先把 select 装进 box，再 insertBefore(box, select) 会抛
        // HierarchyRequestError（新子节点包含了父节点）
        if (isNative) {
            elt.parentNode.insertBefore(box, elt);
            box.appendChild(valueHost);      // 原生 select 移入包裹（仍作值域）
            box.appendChild(trigger);
        } else {
            box.appendChild(valueHost);
            box.appendChild(trigger);
            if (!isUl) elt.appendChild(box);  // ul 承载时 box 就是 elt 本身，无需插入
        }

        // ---- 面板（挂 body，避免被祖先 overflow 裁剪）----
        var panel = document.createElement('div');
        panel.className = 'bny-select-panel';
        panel.innerHTML = '<ul class="options" role="listbox"></ul>';
        var panelMax = elt.getAttribute('select-panel-max');
        if (panelMax) panel.querySelector('.options').style.maxHeight = panelMax;

        var inst = {
            elt: elt, box: box, trigger: trigger, panel: panel, valueHost: valueHost,
            items: [], multiple: multiple, tree: tree, disabled: disabled,
            placeholder: placeholder, empty: empty, clearable: clearable, strict: strict,
            max: max, loaded: false
        };
        elt._bnySelect = inst;

        if (disabled) valueHost.disabled = true;

        // ---- 选项源：内联片段 / 原生 option ----
        var items = [];
        if (isNative) {
            items = parseNative(valueHost);
        } else if (isUl) {
            items = inlineItems;          // ul 承载：变身前已解析
        } else {
            var src = bny.queryChild(elt, 'ul');
            if (src) {
                items = parseFragment(src);
                src.style.display = 'none';   // 源片段保留在 DOM 但隐藏，不参与序列化
            }
        }
        if (items.length) setItems(inst, items);

        // ---- 初始值：select-value 优先级最高 ----
        // 注意必须分两阶段：先按显式值全量设置 selected，再做树形联动。
        // 若在同一循环内"边设边联"，setDeep 联动选中的子节点会在后续迭代中
        // 被显式值匹配（不命中）覆盖回 false，随后 updateAncestors 按子节点
        // 推导父节点时把显式指定的父节点初始选中也一并清掉（value="0" 全灭）。
        // 联动（setDeep/updateAncestors）仅限多选——与 toggleOption 的 UI 语义
        // 对齐：单选点击不联动，select-value 指定父节点时也只选该节点自己。
        var initVal = elt.getAttribute('select-value');
        if (initVal !== null) {
            var arr = String(initVal).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
            if (!multiple) arr = arr.slice(0, 1);
            inst.items.forEach(function (it) {
                if (!it.isGroup) it.selected = arr.indexOf(String(it.value)) > -1;
            });
            if (inst.tree && !inst.strict && inst.multiple) {
                inst.items.forEach(function (it) {
                    if (!it.isGroup && it.selected) setDeep(it, true);
                });
                inst.items.forEach(function (it) { if (!it.isGroup) updateAncestors(it); });
            }
            renderTrigger(inst);
            syncValue(inst);
        }

        // ---- 交互绑定 ----
        // 注意：chip 的移除按钮与清空按钮都在触发框内，必须与"展开面板"合并在同一个
        // 监听器里优先处理并 return，否则移除 chip 的同时会顺带把面板打开
        trigger.addEventListener('click', function (e) {
            if (disabled) return;
            var t = e.target;

            var rm = t.closest ? t.closest('[data-remove]') : null;
            if (rm) {
                e.stopPropagation();
                removeChip(inst, rm.parentNode.getAttribute('data-value'));
                return;
            }
            if (t.closest && t.closest('.clear')) {
                e.stopPropagation();
                clearAll(inst);
                return;
            }

            // 声明了 hx-trigger 时让点击冒泡到承载元素，由 htmx 按声明触发请求；
            // 否则拦截冒泡——htmx 对 hx-get 有默认 click 触发器，不拦截会重复请求
            if (!elt.hasAttribute('hx-trigger')) e.stopPropagation();
            if (current === inst) { closePanel(inst); return; }
            openSelect(inst);
        });

        trigger.addEventListener('keydown', function (e) {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
                // 面板已打开：让位给全局 keydown 委托（选中 .option.focus），
                // 此处若抢先 closePanel 会导致键盘选中永远失效
                if (current === inst) return;
                e.preventDefault();
                openSelect(inst);
            }
        });

        // 面板内点击：折叠箭头 / 选项
        panel.addEventListener('click', function (e) {
            var t = e.target;
            var toggle = t.closest ? t.closest('[data-toggle]') : null;
            if (toggle) {
                e.stopPropagation();
                var v = toggle.parentNode.getAttribute('data-value');
                var it = inst.items.filter(function (x) { return !x.isGroup && x.value === v; })[0];
                if (it) { it.collapsed = !it.collapsed; renderOptions(inst); }
                return;
            }
            var li = t.closest ? t.closest('.option') : null;
            if (li) toggleOption(inst, li);
        });

        ensureDelegation();

        // 触发框初始回显（无 select-value 时也要渲染占位/已选）
        if (initVal === null) renderTrigger(inst);
    }

    /**
     * 装载选项模型并刷新界面
     * @param {Object} inst 实例
     * @param {Array<Object>} items 选项模型
     */
    function setItems(inst, items) {
        inst.items = items;
        if (inst.tree) buildTree(inst.items);
        inst.loaded = true;
        renderOptions(inst);
        renderTrigger(inst);
        syncValue(inst);
    }

    /**
     * 移除多选 chips 中的某一项
     * @param {Object} inst 实例
     * @param {string} value 选项值
     */
    function removeChip(inst, value) {
        var it = inst.items.filter(function (x) { return !x.isGroup && x.value === value; })[0];
        if (!it) return;
        if (inst.tree && !inst.strict) {
            setDeep(it, false);
            updateAncestors(it);
        } else {
            it.selected = false;
            it.half = false;
        }
        syncOptionStates(inst);
        renderTrigger(inst);
        syncValue(inst);
    }

    /**
     * 清空所有选中
     * @param {Object} inst 实例
     */
    function clearAll(inst) {
        inst.items.forEach(function (it) {
            if (it.isGroup) return;
            it.selected = false;
            it.half = false;
        });
        syncOptionStates(inst);
        renderTrigger(inst);
        syncValue(inst);
    }

    /**
     * 打开面板（必要时先拉取远程选项）
     * @param {Object} inst 实例
     */
    function openSelect(inst) {
        closePanel();

        // 远程选项：未装载过且有请求地址 → 先请求，响应回来后再打开
        var url = inst.elt.getAttribute('hx-get') || inst.elt.getAttribute('hx-post');
        if (!inst.loaded && url) {
            loadRemote(inst, function () { doOpen(inst); });
            return;
        }
        doOpen(inst);
    }

    /**
     * 真正打开面板：挂到 body 并定位
     * @param {Object} inst 实例
     */
    function doOpen(inst) {
        document.body.appendChild(inst.panel);
        // 面板选项的选中/半选视觉按模型增量同步：面板关闭期间模型可能已变
        // （select-value 初始值、chip 移除、清空等），面板渲染发生在它们之前就会不同步
        syncOptionStates(inst);
        inst.box.classList.add('open');
        inst.trigger.setAttribute('aria-expanded', 'true');
        current = inst;
        positionPanel(inst);
        // 打开后把已选项滚到面板内可见区域（只滚面板内部，不惊动 window）
        var sel = inst.panel.querySelector('.selected');
        if (sel) scrollOptionIntoPanel(sel);
    }

    /**
     * 请求远程选项（未声明 hx-trigger 时由组件自行发起；声明了则交给 htmx 事件触发，
     * 响应统一在 htmx:beforeSwap 接管）
     * @param {Object} inst 实例
     * @param {Function} done 完成回调
     */
    function loadRemote(inst, done) {
        var elt = inst.elt;
        // 已声明 hx-trigger：请求由 htmx 发起，这里只等待其响应
        if (elt.hasAttribute('hx-trigger')) {
            inst._pendingOpen = done;
            return;
        }
        var method = elt.getAttribute('hx-post') ? 'POST' : 'GET';
        var url = elt.getAttribute('hx-post') || elt.getAttribute('hx-get');
        htmx.ajax(method, url, {
            source: elt,
            // beforeSwap 触发在交换目标上，而实例引用（_bnySelect）挂在承载元素上，
            // target 必须指向承载元素，响应接管逻辑才能找到实例
            target: elt,
            swap: 'none'
        });
        inst._pendingOpen = done;
    }

    // ==================== 扩展注册 ====================

    htmx.defineExtension('bny-select', {
        onEvent: function (name, evt) {

            // 节点初始化
            if (name === 'htmx:afterProcessNode') {
                if (!bny.hasExtName(evt.target, 'bny-select')) return true;
                init(evt.target);
                return true;
            }

            // 接管响应：远程选项不做 htmx 交换，交给组件渲染。
            // beforeSwap 触发在交换目标上（组件发起的 htmx.ajax 与声明 hx-trigger 时
            // htmx 自身的请求，目标都是承载元素），因此直接按实例引用识别；
            // 不能用 hasExtName——它只查目标元素自身的 hx-ext 属性，目标是其他节点时会漏判
            if (name === 'htmx:beforeSwap') {
                var src = evt.target;
                var inst = src && src._bnySelect;
                if (!inst || !evt.detail || !evt.detail.xhr) return true;

                var items = parseResponse(evt.detail.xhr.responseText);
                setItems(inst, items);

                // 若这次请求是为"打开面板"而发起的，装载完立即打开
                if (inst._pendingOpen) {
                    var done = inst._pendingOpen;
                    inst._pendingOpen = null;
                    done();
                }
                // 阻止 htmx 默认的 DOM 交换（响应已由组件消费）
                return false;
            }

            // 节点销毁：清理面板与引用
            if (name === 'htmx:beforeOnNodeDisposal') {
                var t = evt.target;
                if (t && t._bnySelect) {
                    if (current === t._bnySelect) closePanel();
                    var p = t._bnySelect.panel;
                    if (p && p.parentNode) p.parentNode.removeChild(p);
                    delete t._bnySelect;
                }
            }

            return true;
        }
    });
})();
