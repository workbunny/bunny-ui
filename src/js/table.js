htmx.defineExtension('bny-table', {
    // 事件
    onEvent: function (name, evt) {

        /**
         * 获取单元格的排序值
         * @param {HTMLTableCellElement} td
         * @returns {string}
         */
        function sortVal(td) {
            return td.getAttribute('table-sort-val') || td.textContent.trim();
        }

        /**
         * 排序 tbody 中的行
         * @param {HTMLElement} tbody
         * @param {number} colIndex 列索引
         * @param {string} type 排序类型 number|string
         * @param {boolean} asc 是否升序
         */
        function sortRows(tbody, colIndex, type, asc) {
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const dir = asc ? 1 : -1;

            rows.sort(function (a, b) {
                const tdA = a.querySelectorAll('td')[colIndex];
                const tdB = b.querySelectorAll('td')[colIndex];
                if (!tdA || !tdB) return 0;

                if (type === 'number') {
                    const va = parseFloat(sortVal(tdA)) || 0;
                    const vb = parseFloat(sortVal(tdB)) || 0;
                    return (va - vb) * dir;
                }

                const va = sortVal(tdA);
                const vb = sortVal(tdB);
                if (va < vb) return -1 * dir;
                if (va > vb) return 1 * dir;
                return 0;
            });

            // 重新插入排序后的行
            rows.forEach(function (row) {
                tbody.appendChild(row);
            });
        }

        /**
         * 初始化表头排序
         * @param {HTMLElement} table
         */
        function initSort(table) {
            let ths = table.querySelectorAll('thead th[table-sort]');
            if (!ths.length) return;

            // 树形表格不启用排序：行序即层级从属，重排行会打乱父子结构
            if (table.querySelector('tbody tr[data-tree-level]')) return;

            // 表格唯一标识（用于持久化排序状态到 sessionStorage）
            const tableKey = table.getAttribute('table-key') || '';
            const storeKey = tableKey ? 'bny-table-sort:' + tableKey : '';

            // 记录当前（未排序）的初始行顺序，作为“默认/取消排序”的还原快照
            const tbodyCaptured = table.querySelector('tbody');
            const defaultRows = tbodyCaptured ? Array.from(tbodyCaptured.querySelectorAll('tr')) : [];

            /**
             * 持久化排序状态到 sessionStorage
             * @param {number} colIndex
             * @param {string} type
             * @param {boolean} asc
             */
            function persistSort(colIndex, type, asc) {
                if (!storeKey) return;
                try {
                    sessionStorage.setItem(storeKey, JSON.stringify({
                        colIndex: colIndex, type: type, asc: asc
                    }));
                } catch (_) { /* 隐私模式或配额超限，忽略 */ }
            }

            /**
             * 清除持久化排序状态（回到默认时调用，刷新后不再自动排序）
             */
            function clearPersist() {
                if (!storeKey) return;
                try { sessionStorage.removeItem(storeKey); } catch (_) { }
            }

            /**
             * 读取持久化的排序状态
             * @returns {{colIndex:number,type:string,asc:boolean}|null}
             */
            function readSort() {
                if (!storeKey) return null;
                try {
                    var raw = sessionStorage.getItem(storeKey);
                    if (!raw) return null;
                    return JSON.parse(raw);
                } catch (_) { return null; }
            }

            // 记录每列索引，供表头与移动端排序条共用
            ths.forEach(function (th) {
                th._colIndex = Array.from(th.parentElement.querySelectorAll('th')).indexOf(th);
            });

            /**
             * 渲染排序条的某一列 chip 状态（无排序/升序/降序）
             * @param {HTMLElement} th
             * @param {string|null} state
             */
            function renderChip(th, state) {
                if (!th || !th._chip) return;
                const chip = th._chip;
                chip.classList.toggle('active', !!state);
                const label = chip.getAttribute('data-col') || th.textContent.trim();
                chip.textContent = state === 'asc' ? label + ' ↑'
                    : state === 'desc' ? label + ' ↓'
                        : label;
            }

            /**
             * 三态排序：无 → 升序 → 降序 → 默认（取消排序）
             * 表头 th 与移动端排序条 chip 共用此逻辑，状态彼此同步
             * @param {HTMLElement} th
             */
            function cycleColumn(th) {
                const colIndex = th._colIndex;
                const isAsc = th.classList.contains('sort-asc');
                const isDesc = th.classList.contains('sort-desc');

                // 清除所有可排序列的排序标志（含表头与移动端 chip）
                ths.forEach(function (t) {
                    t.classList.remove('sort-asc', 'sort-desc');
                    renderChip(t, null);
                });

                const type = th.getAttribute('table-sort') || 'string';
                const tbody = table.querySelector('tbody');

                // 第三态：降序再点 → 回到默认（取消排序），恢复初始顺序、图标/文本回归
                if (isDesc) {
                    clearPersist();
                    if (tbody && defaultRows.length) {
                        defaultRows.forEach(function (r) { tbody.appendChild(r); });
                    }
                    return;
                }

                // 无排序 → 升序；升序 → 降序
                const asc = !isAsc;
                th.classList.add(asc ? 'sort-asc' : 'sort-desc');
                renderChip(th, asc ? 'asc' : 'desc');
                if (tbody) {
                    sortRows(tbody, colIndex, type, asc);
                }
                persistSort(colIndex, type, asc);
            }

            ths.forEach(function (th) {
                th.style.cursor = 'pointer';
                th.setAttribute('title', '点击排序');
                th.classList.add('sortable');
                th.addEventListener('click', function () { cycleColumn(th); });
            });

            // 移动端排序条（手机端隐藏了 thead，用顶部排序条提供排序入口）
            const sortBar = document.createElement('div');
            sortBar.className = 'bny-table-sort-bar';
            table.parentNode.insertBefore(sortBar, table);
            ths.forEach(function (th) {
                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'bny-table-sort-chip';
                chip.setAttribute('data-col', th.textContent.trim());
                chip.textContent = th.textContent.trim();
                th._chip = chip;
                chip.addEventListener('click', function () { cycleColumn(th); });
                sortBar.appendChild(chip);
            });

            // 恢复持久化的排序状态（HTMX 重新请求后自动应用）
            const saved = readSort();
            if (saved) {
                const targetTh = ths[saved.colIndex];
                if (targetTh) {
                    targetTh.classList.add(saved.asc ? 'sort-asc' : 'sort-desc');
                    renderChip(targetTh, saved.asc ? 'asc' : 'desc');
                    const tbody = table.querySelector('tbody');
                    if (tbody) {
                        sortRows(tbody, saved.colIndex, saved.type, saved.asc);
                    }
                }
            }
        }

        /**
         * 初始化响应式标签（移动端 label 属性）
         * @param {HTMLElement} table
         */
        function initLabels(table) {
            const titles = [];
            const ths = table.querySelectorAll('th');
            for (let i = 0; i < ths.length; i++) {
                titles.push(ths[i].textContent);
            }
            const tbodyTrs = table.querySelectorAll('tbody tr');
            for (let j = 0; j < tbodyTrs.length; j++) {
                const tds = tbodyTrs[j].querySelectorAll('td');
                for (let k = 0; k < tds.length; k++) {
                    tds[k].setAttribute('table-label', titles[tds[k].cellIndex] || '');
                }
            }
        }

        /**
         * 树形展开/折叠：点击首列箭头，折叠/展开该节点整棵子树
         * @param {HTMLElement} table
         */
        function initTree(table) {
            table.querySelectorAll('.bny-table-tree-toggle').forEach(function (btn) {
                btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const tr = btn.closest('tr');
                    if (!tr) return;
                    const level = parseInt(tr.getAttribute('data-tree-level') || '0', 10);
                    const willCollapse = !tr.classList.contains('tree-collapsed');
                    tr.classList.toggle('tree-collapsed', willCollapse);
                    // 箭头方向由 CSS 依据 tree-collapsed 旋转（展开朝下、收起朝右）
                    // 从下一行起，折叠/展开所有层级比当前深的行（即其后代），直到遇到同级或更浅
                    let n = tr.nextElementSibling;
                    while (n && n.tagName === 'TR' &&
                        parseInt(n.getAttribute('data-tree-level') || '-1', 10) > level) {
                        n.style.display = willCollapse ? 'none' : '';
                        n = n.nextElementSibling;
                    }
                });
            });
        }

        // 在htmx初始化节点后触发
        if (name === 'htmx:afterProcessNode') {
            if (bny.hasExtName(evt.target, 'bny-table')) {
                // 操作按钮（actions 列）与内置分页条交互：document 级委托，只注册一次
                setupActionsDelegation();
                bny.setupPaginationDelegation();
                initLabels(evt.target);
                initSort(evt.target);
                initTree(evt.target);
                fitActionsWidths(evt.target);
                return false;
            } else if (evt.target.tagName === 'TR') {
                const tds = evt.target.querySelectorAll('td');
                for (let i = 0; i < tds.length; i++) {
                    const label = evt.target
                        .parentElement
                        .parentElement
                        .querySelector('th:nth-child(' + (tds[i].cellIndex + 1) + ')');
                    tds[i].setAttribute('table-label', label ? label.textContent : '');
                }
            }
        }

        return true;
    },

    // 响应转换：JSON → 表格 HTML（无表格数据的 JSON 返回空串，把内容渲染留给组合链上的下一个扩展）
    transformResponse: function (text, xhr, elt) {
        var ct = xhr.getResponseHeader('Content-Type') || '';
        if (!ct.includes('application/json')) return text;

        var json;
        try {
            json = JSON.parse(xhr.responseText);
        } catch (e) {
            return text;
        }
        const data = json.data || json;
        return buildTable(data, xhr, resolveElt(elt));
    }
});

/**
 * 解析请求源对应的主配置元素
 * 请求源可能不是主配置元素（如搜索输入框、菜单项触发的请求），table-filter 等
 * 配置属性声明在主配置元素上——此时按相同 hx-target 回退查找
 * @param {HTMLElement} elt 请求源元素
 * @returns {HTMLElement}
 */
function resolveElt(elt) {
    if (!elt || elt.getAttribute('table-filter') !== null) return elt;
    var target = elt.getAttribute('hx-target');
    if (!target) return elt;
    try {
        var alt = document.querySelector('[hx-target="' + target + '"][table-filter]');
        if (alt) return alt;
    } catch (_) { }
    return elt;
}

/* ============================================================
 * JSON 渲染（模块级共享工具）
 *
 * 行模型（两种，可并存）：
 * - rows：位置数组 [[v1,v2],...]，支持树形行 {cells, children} 与 {__html} 原始行
 * - list / allList：对象行 [{field: val},...]，配合列模型使用；allList 前端分页切片
 *
 * 内置分页：JSON 带 total 时表格后自动追加分页条（bny.paginationBar 内置函数，
 * 与 bny-pagination 组件共用渲染与事件委托），元素属性 pg-* 控制样式与行为。
 *
 * 列模型（cols 兼容旧格式，columns 为完整模型）：
 * - 字符串："表头"
 * - 对象：{
 *     field, title|name,        // field 数据取值字段；title/name 表头文本
 *     type,                     // 单元格类型：text(默认)/tag/link/image/actions/template
 *     align, width,             // 对齐（left/center/right）与列宽
 *     sortable, sort,           // 列级排序声明（sort 指定 number|string）
 *     html: true,               // 列级原样 HTML（逃生门，信任服务端）
 *     // 类型专属：map(tag) / href,text,target(link) / src,width,height,round(image)
 *     //           template(template) / actions[](actions)
 *   }
 *
 * 单元格逃生门：cell 值为 { __html: '...' } 时原样输出（信任服务端）。
 *
 * 安全模型：数据（cell/行值）一律转义或 URL 编码；配置（列定义来自服务端）中的模板可含 HTML，
 * 与 htmx 直接 swap 服务端 HTML 同级信任；actions 仅输出固定白名单属性，拒绝 on* 注入。
 * ============================================================ */

/**
 * 渲染单个单元格内容（rows 位置行用）
 * - 字符串/数字：默认 escapeChars 转义，防 XSS
 * - 对象 { __html: '...' }：原始 HTML（用于嵌入链接、按钮等富内容，由调用方保证安全）
 * @param {*} cell
 * @returns {string}
 */
function renderCell(cell) {
    if (cell !== null && typeof cell === 'object' && typeof cell.__html !== 'undefined') {
        return String(cell.__html)
    }
    return bny.escapeChars(String(cell))
}

/**
 * 渲染表头单元格（cols/columns 通用）
 * - 字符串：escapeChars
 * - 对象：{ name|title, sortable, sort } 排序声明 + { align, width } 列样式
 * @param {*} col
 * @returns {string}
 */
function renderCol(col) {
    if (col !== null && typeof col === 'object') {
        var name = bny.escapeChars(String(col.title ?? col.name ?? ''))
        var attrs = ''
        // 列级排序：sort 指定类型；仅 sortable 时按字符串排序
        if (col.sort) {
            attrs += ' table-sort="' + bny.escapeChars(String(col.sort)) + '"'
        } else if (col.sortable) {
            attrs += ' table-sort'
        }
        return '<th' + attrs + thStyleAttr(col) + '>' + name + '</th>'
    }
    return '<th>' + bny.escapeChars(String(col)) + '</th>'
}

/**
 * 取行字段值（null/undefined 归一为空串）
 * @param {Object} row 行数据
 * @param {String} field 字段名
 * @returns {*}
 */
function getVal(row, field) {
    var val = row ? row[field] : '';
    return val === null || val === undefined ? '' : val;
}

/**
 * th 样式：列宽 + 对齐
 * @param {Object} col 列定义
 * @returns {String} 属性串
 */
function thStyleAttr(col) {
    var style = '';
    if (col.width) style += 'width:' + col.width + ';';
    if (col.align === 'center' || col.align === 'right') style += 'text-align:' + col.align + ';';
    return style ? ' style="' + bny.escapeChars(style) + '"' : '';
}

/**
 * td 对齐样式（列宽由 th 控制）
 * @param {Object} col 列定义
 * @returns {String} 属性串
 */
function tdAlignAttr(col) {
    if (col.align === 'center' || col.align === 'right') return ' style="text-align:' + col.align + ';"';
    return '';
}

/**
 * 模板插值：把 {field} 占位符替换为行数据
 * @param {String} tpl 模板
 * @param {Object} row 行数据
 * @param {String} mode 'html'：值 HTML 转义（模板可含 HTML）；'url'：值 URL 编码
 * @returns {string}
 */
function tplInterpolate(tpl, row, mode) {
    return String(tpl === undefined || tpl === null ? '' : tpl).replace(/\{([a-zA-Z0-9_]+)\}/g, function (m, key) {
        var val = String(getVal(row, key));
        return mode === 'url' ? encodeURIComponent(val) : bny.escapeChars(val);
    });
}

/**
 * 链接地址安全过滤：拒绝 javascript:/data:/vbscript: 等危险协议，允许 http(s)/mailto:/tel:/相对路径
 * @param {String} url
 * @returns {String} 安全的地址，不安全返回空串
 */
function safeHref(url) {
    if (typeof url !== 'string') return '';
    var s = url.trim().replace(/^[\u0000-\u001F\u007F]+/, '');
    if (!s) return '';
    if (/^(javascript|data|vbscript)\s*:/i.test(s)) return '';
    return s;
}

/**
 * 图片地址安全过滤：拒绝危险协议，data: 仅放行 data:image/
 * @param {String} src
 * @returns {String} 安全的地址，不安全返回空串
 */
function safeImgSrc(src) {
    if (typeof src !== 'string') return '';
    var s = src.trim().replace(/^[\u0000-\u001F\u007F]+/, '');
    if (/^(javascript|vbscript)\s*:/i.test(s)) return '';
    if (/^data:/i.test(s)) return /^data:image\//i.test(s) ? s : '';
    return s;
}

/**
 * 渲染对象行单元格（list 对象行 + 列模型，按列类型分发，值一律转义/编码）
 * @param {Object} row 行数据
 * @param {Object} col 列定义
 * @returns {string} td 内容 HTML
 */
function renderTypedCell(row, col) {
    // 整格原样 HTML（逃生门：仅限受信任的服务端内容，与 htmx 直接 swap 服务端 HTML 同级信任）
    if (col.html === true) {
        return String(getVal(row, col.field));
    }

    switch (col.type) {
        case 'tag':      return renderTagCell(row, col);
        case 'link':     return renderLinkCell(row, col);
        case 'image':    return renderImageCell(row, col);
        case 'actions':  return renderActionsCell(row, col);
        case 'template': return renderTemplateCell(row, col);
        default:         return bny.escapeChars(String(getVal(row, col.field)));
    }
}

/**
 * tag 单元格：值经 map 映射为 bny-tag
 * map 值支持 "颜色" 简写或 {text, color} 对象；"default" 键兜底
 * @param {Object} row 行数据
 * @param {Object} col 列定义
 * @returns {string}
 */
function renderTagCell(row, col) {
    var val = String(getVal(row, col.field));
    var map = col.map || {};
    var hit = Object.prototype.hasOwnProperty.call(map, val) ? map[val] : map['default'];
    var text = val, color = '';
    if (hit && typeof hit === 'object') {
        if (hit.text !== undefined && hit.text !== null) text = hit.text;
        color = hit.color || '';
    } else if (typeof hit === 'string') {
        color = hit;
    }
    var attr = color ? ' tag-color="' + bny.escapeChars(color) + '"' : '';
    return '<span class="bny-tag"' + attr + '>' + bny.escapeChars(String(text)) + '</span>';
}

/**
 * link 单元格：href 支持 {field} 占位符（值 URL 编码）+ 协议防护
 * @param {Object} row 行数据
 * @param {Object} col 列定义
 * @returns {string}
 */
function renderLinkCell(row, col) {
    var val = String(getVal(row, col.field));
    var href = safeHref(tplInterpolate(col.href || '', row, 'url'));
    var text = (col.text !== undefined && col.text !== null)
        ? tplInterpolate(col.text, row, 'html')
        : bny.escapeChars(val);
    if (!href) return text;
    var attr = ' href="' + bny.escapeChars(href) + '"';
    if (col.target) attr += ' target="' + bny.escapeChars(String(col.target)) + '"';
    return '<a' + attr + '>' + text + '</a>';
}

/**
 * image 单元格：src 支持 {field} 占位符，width/height/round 控制样式
 * @param {Object} row 行数据
 * @param {Object} col 列定义
 * @returns {string}
 */
function renderImageCell(row, col) {
    var src = safeImgSrc(tplInterpolate(col.src || ('{' + col.field + '}'), row, 'url'));
    if (!src) return '';
    var style = '';
    if (col.width) style += 'width:' + col.width + ';';
    if (col.height) style += 'height:' + col.height + ';';
    if (col.round) style += 'border-radius:50%;';
    var attr = ' class="bny-table-img" src="' + bny.escapeChars(src) + '"' +
        ' alt="' + bny.escapeChars(col.title || col.field) + '" loading="lazy"';
    return '<img' + attr + (style ? ' style="' + bny.escapeChars(style) + '"' : '') + '>';
}

/**
 * actions 单元格：操作按钮组（bny-btn）
 * - 普通项：data-bny-action 按钮，点击由事件委托统一处理（runAction）
 * - 带 children 的项：渲染为"更多"下拉触发器（bny-dropdown 面板预渲染，
 *   dropdown.js 在 afterProcessNode 时绑定开关）；下拉项与主按钮走同一 confirm/url/event 协议
 * - 列级 group: true：按钮包进 bny-btn-group（主按钮 + 下拉触发器同组）
 * 按钮配置仅输出固定白名单属性（data-*），天然拒绝 on* 事件属性与任意属性注入
 * @param {Object} row 行数据
 * @param {Object} col 列定义
 * @returns {string}
 */
function renderActionsCell(row, col) {
    var actions = Array.isArray(col.actions) ? col.actions : [];
    var group = col.group === true;
    var h = '<div class="bny-table-actions">';
    if (group) h += '<div class="bny-btn-group">';
    // 弹出面板放组外（组内 :last-child 分隔线规则会顶掉触发器右边框），渲染后统一追加
    var panels = '';
    actions.forEach(function (act) {
        if (!act || typeof act !== 'object') return;
        // "更多"弹出菜单：触发器进组（保持 :last-child），面板收集到组外
        if (Array.isArray(act.children) && act.children.length) {
            var dd = renderDropdownAction(act, row);
            h += dd.trigger;
            panels += dd.panel;
            return;
        }
        var content = actionContent(act, row);
        if (!content) return;
        var attrs = ' class="bny-btn"';
        attrs += ' btn-size="' + bny.escapeChars(String(act.size || 'sm')) + '"';
        attrs += ' btn-model="' + bny.escapeChars(String(act.model || 'border')) + '"';
        if (act.color) attrs += ' btn-color="' + bny.escapeChars(String(act.color)) + '"';
        h += '<button type="button"' + attrs + buildActionAttrs(act, row) + ' data-bny-action>' + content + '</button>';
    });
    if (group) h += '</div>';
    h += panels;
    h += '</div>';
    return h;
}

/**
 * 动作内容片段（图标 + 文本），空则返回 null（跳过该项）
 * @param {Object} act 动作配置
 * @param {Object} row 行数据
 * @returns {string|null}
 */
function actionContent(act, row) {
    var text = tplInterpolate(act.text || act.name || '', row, 'html');
    var icon = act.icon ? '<i class="bny-icon ' + bny.escapeChars(String(act.icon)) + '"></i>' : '';
    if (!text && !icon) return null;
    return icon + text;
}

/**
 * 动作白名单属性（confirm/url/method/target/event/row），主按钮与下拉菜单项共用
 * @param {Object} act 动作配置
 * @param {Object} row 行数据
 * @returns {string} 属性串（值已转义）
 */
function buildActionAttrs(act, row) {
    var attrs = '';
    if (act.title) attrs += ' title="' + bny.escapeChars(tplInterpolate(act.title, row, 'html')) + '"';
    if (act.confirm) attrs += ' data-confirm="' + bny.escapeChars(tplInterpolate(act.confirm, row, 'html')) + '"';
    if (act.event) attrs += ' data-event="' + bny.escapeChars(String(act.event)) + '"';

    var url = act.url || act.href;
    if (url) {
        var method = String(act.method || 'GET').toUpperCase();
        if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].indexOf(method) < 0) method = 'GET';
        attrs += ' data-url="' + bny.escapeChars(tplInterpolate(url, row, 'url')) + '"';
        attrs += ' data-method="' + method + '"';
    }
    if (act.target) attrs += ' data-target="' + bny.escapeChars(String(act.target)) + '"';

    // 行数据存档：event 模式派发自定义事件时回传业务（JSON 序列化 + 转义，不构成注入）
    attrs += ' data-row="' + bny.escapeChars(JSON.stringify(row)) + '"';
    return attrs;
}

/**
 * 渲染"更多"弹出菜单：返回 { trigger, panel } 两段 HTML
 * - 触发器留在按钮组内（保持 :last-child，右边框正常）；面板放组外作为组的兄弟节点
 *   （组内溢出隐藏 + :last-child 分隔线规则，面板放组内会顶掉触发器的右边框）
 * - 面板复用 .bny-dropdown 样式（fixed 定位 + .show 显隐），开关与定位由
 *   setupActionsDelegation / openDropdown 处理；菜单项走 actions 委托
 * @param {Object} act 动作配置（children 为二级动作列表）
 * @param {Object} row 行数据
 * @returns {{trigger: string, panel: string}}
 */
function renderDropdownAction(act, row) {
    var content = actionContent(act, row) || '';
    var attrs = ' class="bny-btn"';
    attrs += ' btn-size="' + bny.escapeChars(String(act.size || 'sm')) + '"';
    attrs += ' btn-model="' + bny.escapeChars(String(act.model || 'border')) + '"';
    if (act.color) attrs += ' btn-color="' + bny.escapeChars(String(act.color)) + '"';
    attrs += ' title="' + bny.escapeChars(act.title ? tplInterpolate(act.title, row, 'html') : '更多') + '"';

    var items = '';
    (Array.isArray(act.children) ? act.children : []).forEach(function (child) {
        if (!child || typeof child !== 'object') return;
        var c = actionContent(child, row);
        if (!c) return;
        items += '<button type="button" class="bny-table-dropdown-item"' + buildActionAttrs(child, row) + ' data-bny-action>' + c + '</button>';
    });

    return {
        trigger: '<button type="button"' + attrs + ' data-bny-dropdown>' + content + '</button>',
        panel: '<div class="bny-dropdown"><div class="bny-table-dropdown-actions">' + items + '</div></div>'
    };
}

/**
 * 找到弹出菜单触发器对应的面板
 * 触发器在按钮组内时面板是组的下一个兄弟节点，否则是触发器的下一个兄弟节点
 * @param {HTMLElement} trigger 触发器
 * @returns {HTMLElement|null}
 */
function dropdownPanelOf(trigger) {
    var scope = trigger.parentElement && trigger.parentElement.classList.contains('bny-btn-group')
        ? trigger.parentElement
        : trigger;
    var next = scope.nextElementSibling;
    return (next && next.classList.contains('bny-dropdown')) ? next : null;
}

/**
 * 定位并打开弹出菜单（视口固定定位：优先下方，空间不足上翻；右侧溢出右对齐）
 * @param {HTMLElement} trigger 触发器
 * @param {HTMLElement} panel 面板
 */
function openDropdown(trigger, panel) {
    // 先显示（透明）拿到面板尺寸
    panel.style.visibility = 'hidden';
    panel.style.opacity = 0;
    panel.classList.add('show');

    var rect = trigger.getBoundingClientRect();
    var pRect = panel.getBoundingClientRect();
    var gap = 8;
    var top, left;
    if (window.innerHeight - rect.bottom >= pRect.height + gap || window.innerHeight - rect.bottom >= rect.top) {
        top = rect.bottom + gap;
        panel.classList.remove('up');
    } else {
        top = rect.top - pRect.height - gap;
        panel.classList.add('up');
    }
    left = rect.left;
    if (left + pRect.width > window.innerWidth - gap) left = window.innerWidth - gap - pRect.width;
    if (left < gap) left = gap;

    panel.style.top = top + 'px';
    panel.style.left = left + 'px';
    panel.style.visibility = 'visible';
    panel.style.opacity = 1;
}

/**
 * 关闭弹出菜单
 * @param {HTMLElement} panel 面板
 */
function closeDropdownPanel(panel) {
    panel.classList.remove('show', 'up');
    panel.style.visibility = 'hidden';
    panel.style.opacity = 0;
}

/**
 * template 单元格：自定义模板，{field} 占位符替换为转义后的行数据
 * @param {Object} row 行数据
 * @param {Object} col 列定义
 * @returns {string}
 */
function renderTemplateCell(row, col) {
    return tplInterpolate(col.template || '', row, 'html');
}

/**
 * 对象行渲染（list 对象行 + 列模型）
 * @param {Object} row 行数据
 * @param {Array} cols 列定义
 * @returns {string}
 */
function objectRowHtml(row, cols) {
    var r = '<tr>';
    cols.forEach(function (col) {
        var attrs = tdAlignAttr(col);
        // 自定义排序值：sortVal 指定取值字段（显示文案与排序值不同时使用，如 tag 映射列）
        if (col.sortVal) {
            attrs += ' table-sort-val="' + bny.escapeChars(String(getVal(row, col.sortVal))) + '"';
        }
        r += '<td' + attrs + '>' + renderTypedCell(row, col) + '</td>';
    });
    r += '</tr>';
    return r;
}

/**
 * JSON数据转表格HTML
 * - JSON 带 total 时在表格后追加分页条（内置分页，配置元素读 pg-* 属性，与 bny-pagination 组件共用内置函数）
 * @param {object} data { cols|columns, rows, list, allList, color, empty, key, total, pageSize, page }
 * @param {XMLHttpRequest} xhr 响应对象（allList 切片解析页码用）
 * @param {HTMLElement} elt 配置元素（table-page-size / table-page-param / pg-* 属性）
 * @returns {string} html（无表格数据时返回空串）
 */
function buildTable(data, xhr, elt) {
    const cols = data.columns || data.cols || [];
    const rows = data.rows || [];
    let list = Array.isArray(data.list) ? data.list : [];
    const color = data.color || '';
    // 空数据时的占位文案，默认 '暂无数据'
    const emptyText = data.empty || '暂无数据';
    // 表格唯一标识（用于排序状态持久化），优先使用 data.key，其次 color
    const tableKey = data.key || color || '';

    // 分页参数：page/pageSize 优先取请求 URL 参数（静态 JSON 也能反映点击的页码/条数）
    const paramName = (elt && elt.getAttribute('pg-page-param')) || 'page';
    const sizeParam = (elt && elt.getAttribute('pg-size-param')) || 'pageSize';
    const pageSize = bny.parsePageParam(xhr && xhr.responseURL, sizeParam)
        || parseInt(data.pageSize, 10)
        || parseInt(elt && elt.getAttribute('table-page-size'), 10)
        || 10;
    const page = bny.parsePageParam(xhr && xhr.responseURL, paramName)
        || parseInt(data.page, 10) || 1;

    // 本地过滤：table-filter 声明可过滤字段（逗号分隔），请求 URL 里同名非空参数作为条件
    // （多条件搜索/菜单联动的静态数据方案，条件 AND 组合、不区分大小写包含匹配；
    //   仅 allList 模式生效，list 模式的过滤由服务端负责）
    const filterFields = (elt && elt.getAttribute('table-filter') || '')
        .split(',').map(function (s) { return s.trim() }).filter(Boolean);
    const conditions = [];
    if (xhr && xhr.responseURL && filterFields.length) {
        try {
            new URL(xhr.responseURL).searchParams.forEach(function (v, k) {
                if (v !== '' && filterFields.indexOf(k) >= 0) conditions.push([k, v.toLowerCase()]);
            });
        } catch (_) { }
    }

    // allList：全量数据先本地过滤再前端分页切片
    let filteredCount = null;
    if (Array.isArray(data.allList)) {
        let all = data.allList;
        if (conditions.length) {
            all = all.filter(function (row) {
                return conditions.every(function (c) {
                    return String(getVal(row, c[0])).toLowerCase().indexOf(c[1]) >= 0;
                });
            });
            filteredCount = all.length;
        }
        const start = (page - 1) * pageSize;
        list = all.slice(start, start + pageSize);
    }

    // 无列且无行：非表格数据（如纯分页响应），返回空串（内容渲染交给业务或其他扩展）
    if (!cols.length && !rows.length && !list.length) return '';

    let h = '';
    // 先拼完所有属性，最后再加 '>' 闭合 <table> 标签
    // 否则 data-table-key 会跑到 table 标签后面变成文本节点（页面多出 '>' 符号）
    h += '<table hx-ext="bny-table"' + (color ? ' table-color="' + color + '"' : '');
    if (tableKey) h += ' table-key="' + bny.escapeChars(tableKey) + '"';
    h += '>';

    // 树形缩进单位（px）：层级 × 该值
    const indentUnit = 20;

    /**
     * 渲染一棵父行（首列插展开箭头 + 层级缩进）
     * @param {object} row 父行 { cells:[], children:[] }
     * @param {Array} cells 当前行各列
     * @param {number} level 层级（0 为顶层）
     */
    function treeRowHtml(row, cells, level) {
        const hasKids = Array.isArray(row.children) && row.children.length > 0;
        let r = '<tr data-tree-level="' + level + '"' + (hasKids ? ' data-tree-parent="1"' : '') + '>';
        cells.forEach(function (cell, ci) {
            let content = renderCell(cell);
            if (ci === 0) {
                content = '<span class="bny-table-tree-indent" style="padding-left:' + (level * indentUnit) + 'px"></span>' +
                    (hasKids ? '<span class="bny-table-tree-toggle"><i class="bny-icon icon-caret-right"></i></span>' : '') +
                    content;
            }
            r += '<td' + (ci === 0 ? ' class="bny-table-tree-cell"' : '') + '>' + content + '</td>';
        });
        r += '</tr>';
        return r;
    }

    /**
     * 递归追加一行（含其子树）。父行：{ cells, children: [...] }；子级同构，可任意嵌套。
     * @param {*} row
     * @param {number} level
     */
    function appendRow(row, level) {
        // 树形行：整行对象（含 cells，可选 children）
        if (row && !Array.isArray(row) && typeof row === 'object') {
            if (Array.isArray(row.cells) || Array.isArray(row.children)) {
                const hasChildren = Array.isArray(row.children) && row.children.length > 0;
                const cells = Array.isArray(row.cells) ? row.cells : [row.cells];
                h += treeRowHtml(row, cells, level);
                if (hasChildren) {
                    (row.children || []).forEach(function (child) { appendRow(child, level + 1); });
                }
                return;
            }
            // 整行原始 HTML（自定义行结构）
            if (typeof row.__html !== 'undefined' && row.__html) {
                h += row.__html;
                return;
            }
            // 对象单格行
            h += '<tr data-tree-level="' + level + '">';
            [row].forEach(function (cell, ci) {
                let content = renderCell(cell);
                if (ci === 0 && level > 0) {
                    content = '<span class="bny-table-tree-indent" style="padding-left:' + (level * indentUnit) + 'px"></span>' + content;
                }
                h += '<td>' + content + '</td>';
            });
            h += '</tr>';
            return;
        }
        // 平铺数组 / 单值 行
        const vals = Array.isArray(row) ? row : [row];
        h += '<tr data-tree-level="' + level + '">';
        vals.forEach(function (cell, ci) {
            let content = renderCell(cell);
            if (ci === 0 && level > 0) {
                content = '<span class="bny-table-tree-indent" style="padding-left:' + (level * indentUnit) + 'px"></span>' + content;
            }
            h += '<td>' + content + '</td>';
        });
        h += '</tr>';
    }

    h += '<thead><tr>';
    cols.forEach(function (col) {
        h += renderCol(col);
    });
    h += '</tr></thead>';
    h += '<tbody>';
    if (rows.length === 0 && list.length === 0) {
        // 空状态：合并所有列显示占位文案
        h += '<tr class="bny-table-empty"><td colspan="' + cols.length + '">' + bny.escapeChars(emptyText) + '</td></tr>';
    } else {
        // 位置行（rows）：树形/原始行/位置数组
        rows.forEach(function (row) { appendRow(row, 0); });
        // 对象行（list）：配合列模型渲染富内容单元格
        list.forEach(function (row) { h += objectRowHtml(row, cols); });
    }
    h += '</tbody></table>';

    // 内置分页：JSON 带 total 时追加分页条（与 bny-pagination 组件共用内置函数）
    // 本地过滤生效时 total 取过滤后条数
    const total = filteredCount !== null ? filteredCount : parseInt(data.total, 10);
    if (!isNaN(total)) {
        h += bny.paginationBar({
            total: total,
            page: page,
            pageSize: pageSize,
            paramName: paramName,
            sizeParam: sizeParam,
            sizes: bny.parsePageSizes(elt && elt.getAttribute('pg-page-sizes')),
            // 携带当前查询串（剥掉 page/pageSize），翻页/切条数时回带，保持搜索与筛选条件
            query: bny.carryQuery(xhr && xhr.responseURL, [paramName, sizeParam]),
            maxButtons: elt && elt.getAttribute('pg-max-buttons'),
            jumper: elt ? elt.getAttribute('pg-jumper') !== 'false' : true,
            showTotal: elt ? elt.getAttribute('pg-total') !== 'false' : true,
            carryAttrs: carryAttrsFrom(elt, ['pg-color', 'pg-model', 'data-max-buttons', 'data-jumper', 'data-total', 'data-page-size'])
        });
    }
    return h;
}

/**
 * 把 elt 上的指定属性原样拼成 HTML 属性串（用于回写到渲染的分页条上，值转义）
 * @param {HTMLElement} elt
 * @param {Array<string>} names
 * @returns {string}
 */
function carryAttrsFrom(elt, names) {
    var s = '';
    if (!elt) return s;
    names.forEach(function (n) {
        var v = elt.getAttribute(n);
        if (v !== null) {
            s += ' ' + n + '="' + bny.escapeChars(v) + '"';
        }
    });
    return s;
}

/**
 * actions 列宽自适应
 * 全局 table 样式为 table-layout: fixed，列宽与内容无关——操作按钮组较宽时会被压缩
 * （按钮文字竖排、组溢出单元格）。渲染后按各行操作组的实际宽度回写对应 th 的 width；
 * 列定义已显式声明 width 的列不覆盖。
 * @param {HTMLElement} table
 */
function fitActionsWidths(table) {
    const ths = table.querySelectorAll('thead th');
    if (!ths.length) return;
    const rows = table.querySelectorAll('tbody tr');
    ths.forEach(function (th, ci) {
        if (th.style.width) return;
        let max = 0;
        let pad = 0;
        rows.forEach(function (tr) {
            const box = tr.cells[ci] && tr.cells[ci].querySelector('.bny-table-actions');
            if (!box) return;
            const w = box.getBoundingClientRect().width;
            if (w > max) max = w;
            // 列宽需覆盖单元格左右内边距，否则组会顶进内边距/边框区域
            const cs = getComputedStyle(tr.cells[ci]);
            pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
        });
        if (max > 0) th.style.width = Math.ceil(max + pad) + 'px';
    });
}

/* ============================================================
 * actions 列交互（document 级事件委托）
 * ============================================================ */

var _bnyTableActionsDelegated = false;

/**
 * 注册操作按钮/弹出菜单点击委托（只注册一次，渲染后无需重新绑定）
 */
function setupActionsDelegation() {
    if (_bnyTableActionsDelegated) return;
    _bnyTableActionsDelegated = true;
    document.addEventListener('click', function (e) {
        // "更多"弹出菜单触发器：开关面板
        var trigger = e.target.closest && e.target.closest('.bny-table-actions [data-bny-dropdown]');
        if (trigger) {
            e.preventDefault();
            var panel = dropdownPanelOf(trigger);
            if (!panel) return;
            var isOpen = panel.classList.contains('show');
            closeAllDropdownPanels();
            if (!isOpen) openDropdown(trigger, panel);
            return;
        }
        // 点击面板与触发器之外：关闭所有打开的表格弹出面板
        if (!e.target.closest || !e.target.closest('.bny-table-actions .bny-dropdown')) {
            closeAllDropdownPanels();
        }
        // 动作按钮（含面板内菜单项）
        var btn = e.target.closest && e.target.closest('.bny-table-actions [data-bny-action]');
        if (!btn) return;
        e.preventDefault();
        runAction(btn);
    });
}

/**
 * 关闭所有打开的表格弹出菜单面板
 */
function closeAllDropdownPanels() {
    document.querySelectorAll('.bny-table-actions .bny-dropdown.show').forEach(closeDropdownPanel);
}

/**
 * 通过表格所在容器反查请求源配置元素（携带 hx-get/hx-target，作为 htmx.ajax 的 source）
 * @param {HTMLElement} container 表格容器
 * @returns {HTMLElement|null}
 */
function findRequestSource(container) {
    if (container && container.id) {
        return document.querySelector('[hx-get][hx-target="#' + container.id + '"]');
    }
    return null;
}

/**
 * 执行操作按钮动作（actions 列，由事件委托调用）
 * 流程：有 confirm 先弹 bny.confirm →
 *   1. 有 event：派发自定义事件（detail: {row, page}）交由业务处理，不发请求
 *   2. 有 url：htmx.ajax 按声明的 method 发请求；
 *      - 有 target：swap 到指定容器（如弹窗）
 *      - 无 target：默认刷回表格容器（服务端返回同结构 JSON 即可整块刷新，等价于 refresh）
 * @param {HTMLElement} btn 操作按钮
 */
function runAction(btn) {
    // 操作按钮在表格内，容器是 table 的父级（分页条若存在则是其兄弟节点）
    // 注意：不能用 btn.closest('.bny-pagination')——actions 在表格内而非分页条内
    var table = btn.closest('table');
    var container = table ? table.parentElement : null;
    var bar = container ? container.querySelector(':scope > .bny-pagination') : null;

    // 动作来自"更多"下拉面板：立即关闭面板（与 dropdown.js closeDropdown 行为一致）
    var dd = btn.closest('.bny-dropdown');
    if (dd) {
        dd.classList.remove('show', 'up');
        dd.style.visibility = 'hidden';
    }

    var confirmMsg = btn.getAttribute('data-confirm');
    var run = function () {
        var eventName = btn.getAttribute('data-event');
        if (eventName) {
            var row = null;
            try { row = JSON.parse(btn.getAttribute('data-row')); } catch (_) { }
            document.dispatchEvent(new CustomEvent(eventName, {
                detail: {
                    row: row,
                    page: bar ? (parseInt(bar.getAttribute('pg-current'), 10) || 1) : 1
                }
            }));
            return;
        }
        var url = btn.getAttribute('data-url');
        if (!url || !container) return;
        var method = (btn.getAttribute('data-method') || 'GET').toUpperCase();
        var targetSel = btn.getAttribute('data-target');
        // 默认目标：表格容器自身（配置元素为 source 保证 transformResponse 生效）
        var src = findRequestSource(container) || table || container;
        var target = targetSel ? document.querySelector(targetSel) : container;
        if (!target) target = container;
        htmx.ajax(method, url, {
            source: src,
            target: target,
            swap: 'innerHTML'
        });
    };
    if (confirmMsg) {
        bny.confirm(confirmMsg, { yes_cb: run });
    } else {
        run();
    }
}
