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
            let ths = table.querySelectorAll('thead th[table-sort], thead th[cell-sort]');
            if (!ths.length) return;

            // 树形表格不启用排序：行序即层级从属，重排行会打乱父子结构。
            // 这里拦静态标记的树形行；数据模式的树形行是后渲染的，由 cycleColumn 点击时兜底
            if (table.querySelector('tbody tr[data-tree-level]')) return;

            // 表格唯一标识（用于持久化排序状态到 sessionStorage）
            const tableKey = table.getAttribute('table-key') || '';
            const storeKey = tableKey ? 'bny-table-sort:' + tableKey : '';

            // 服务端模式（table-server）：排序发给后台（sort/order 参数 + 重载），本地不重排 DOM。
            // 属性直接写在 <table> 上（table-sort-param/order-param/page-param，有默认值）
            const isServer = table.getAttribute('table-server') !== null;
            const sortParam = table.getAttribute('table-sort-param') || 'sort';
            const orderParam = table.getAttribute('table-order-param') || 'order';
            const pageParam = table.getAttribute('table-page-param') || 'page';

            // “默认/取消排序”的还原快照：首次进入本地排序分支时拍。
            // 数据模式下 tbody 行由服务端动态渲染，初始化时拍会得到空快照
            let defaultRows = null;

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
                // 数据模式的树形行点击时兜底拦截：行序即层级从属，本地重排/带排序重载都会打乱父子结构
                if (table.querySelector('tbody tr[data-tree-level]')) return;
                const colIndex = th._colIndex;
                const isAsc = th.classList.contains('sort-asc');
                const isDesc = th.classList.contains('sort-desc');

                // 服务端模式：不碰 DOM 行序（重排当前页毫无意义），按 无→升序→降序→无
                // 周期发 sort/order 参数重新请求；排序后回到第 1 页（后台按新排序重排全量）
                if (isServer) {
                    const field = th.getAttribute('cell-field') || th.getAttribute('table-sort-field');
                    if (field) {
                        const order = isDesc ? '' : (isAsc ? 'desc' : 'asc');
                        // 先本地轮转状态（图标即时反馈；POST 模式下响应 URL 读不到
                        // sort/order 参数，回显只能依赖内存状态，不能等服务端回读）
                        ths.forEach(function (t) {
                            t.classList.remove('sort-asc', 'sort-desc');
                            renderChip(t, null);
                        });
                        if (order) {
                            th.classList.add(order === 'asc' ? 'sort-asc' : 'sort-desc');
                            renderChip(th, order);
                        }
                        // 记录当前排序：applySortStateFromUrl 优先读它（覆盖 GET/POST 两种模式）
                        table._bnySortState = order ? { field: field, order: order } : null;
                        const params = {};
                        params[sortParam] = order ? field : '';
                        params[orderParam] = order;
                        params[pageParam] = '1';
                        reloadTableWithParams(table.parentElement, table, params);
                    }
                    return;
                }

                // 清除所有可排序列的排序标志（含表头与移动端 chip）
                ths.forEach(function (t) {
                    t.classList.remove('sort-asc', 'sort-desc');
                    renderChip(t, null);
                });

                const type = th.getAttribute('table-sort') || th.getAttribute('cell-sort') || 'string';
                const tbody = table.querySelector('tbody');

                // 首次进入本地排序分支时拍“默认行序”快照；tbody 行被整体换新后
                // （本地数据模式重查/翻页）快照元素已脱离文档，按当前行序重拍，
                // 避免第三态还原时把旧行塞回、丢掉换新后的行
                if (!defaultRows || !defaultRows.length || !tbody ||
                    !tbody.contains(defaultRows[0])) {
                    defaultRows = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];
                }

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

            /**
             * 从响应 URL（table-url）读取服务端实际生效的排序，同步表头箭头与移动端 chip。
             * 服务端模式排序由后台完成，前端箭头只做回显；静态模式 tbody 换新后由
             * afterProcessNode 调用（表头是静态的，不会随响应重建）
             */
            function applySortStateFromUrl() {
                ths.forEach(function (t) {
                    t.classList.remove('sort-asc', 'sort-desc');
                    renderChip(t, null);
                });
                // 优先读内存状态（POST 模式响应 URL 不含 sort/order 参数，内存是排序的
                // 唯一可靠来源）；GET 模式回退 URL 查询串（整页刷新/外部链接直达时恢复）
                let field = '', order = '';
                const mem = table._bnySortState;
                if (mem && mem.field) {
                    field = mem.field;
                    order = mem.order === 'desc' ? 'desc' : 'asc';
                } else {
                    const url = table.getAttribute('table-url') || '';
                    field = queryVal(url, sortParam);
                    order = queryVal(url, orderParam) === 'desc' ? 'desc' : 'asc';
                }
                if (!field) return;
                Array.prototype.forEach.call(ths, function (t) {
                    if ((t.getAttribute('cell-field') || t.getAttribute('table-sort-field')) === field) {
                        const asc = order !== 'desc';
                        t.classList.add(asc ? 'sort-asc' : 'sort-desc');
                        renderChip(t, asc ? 'asc' : 'desc');
                    }
                });
            }

            if (isServer) {
                // 服务端模式：箭头回显 URL 状态，不用 localStorage（服务端已排序，再 DOM 排是双重排序）
                table._bnySyncSortState = applySortStateFromUrl;
                applySortStateFromUrl();
            } else {
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
         * 树形展开/折叠：点击首列箭头，折叠/展开该节点整棵子树。
         * 表格级事件委托只绑定一次：tbody 行由服务端数据动态渲染，
         * swap 换新后旧按钮随节点销毁，逐按钮绑监听会失效，委托到表格元素始终有效
         * @param {HTMLElement} table
         */
        function initTree(table) {
            if (table._bnyTreeBound) return;
            table._bnyTreeBound = true;
            table.addEventListener('click', function (e) {
                const btn = e.target && e.target.closest
                    ? e.target.closest('.bny-table-tree-toggle') : null;
                if (!btn || !table.contains(btn)) return;
                e.preventDefault();
                e.stopPropagation();
                const tr = btn.closest('tr');
                if (!tr) return;
                const level = parseInt(tr.getAttribute('data-tree-level') || '0', 10);
                const willCollapse = !tr.classList.contains('tree-collapsed');
                tr.classList.toggle('tree-collapsed', willCollapse);
                // 箭头方向由 CSS 依据 tree-collapsed 旋转（展开朝下、收起朝右）
                // 从下一行起遍历所有更深层级的后代行；展开父级时，沿途已处于
                // 收起状态的子级，其后人保持隐藏（不凭空展开内部折叠的子树）
                let n = tr.nextElementSibling;
                let collapsedLevel = -1;
                while (n && n.tagName === 'TR' &&
                    parseInt(n.getAttribute('data-tree-level') || '-1', 10) > level) {
                    const lv = parseInt(n.getAttribute('data-tree-level') || '0', 10);
                    if (collapsedLevel >= 0 && lv <= collapsedLevel) collapsedLevel = -1;
                    n.style.display = willCollapse || collapsedLevel >= 0 ? 'none' : '';
                    if (collapsedLevel < 0 && n.classList.contains('tree-collapsed')) {
                        collapsedLevel = lv;
                    }
                    n = n.nextElementSibling;
                }
            });
        }

        // 在htmx初始化节点后触发
        if (name === 'htmx:configRequest') {
            var src = evt.target;
            // 静态表头表格：若请求未携带 page/pageSize 参数，注入默认值
            // （翻页/排序/切条数已带参数时不覆盖）
            if (src && src.nodeType === 1 && src.hasAttribute('table-static')) {
                try {
                    var params = evt.detail.parameters;
                    var hasPage = false, hasSize = false;
                    if (params && params.forEach) {
                        params.forEach(function (v, k) {
                            if (k === 'page') hasPage = true;
                            if (k === 'pageSize') hasSize = true;
                        });
                    }
                    if (!hasPage) params.append('page', '1');
                    if (!hasSize) {
                        var sizeList = bny.parsePageSizes(src.getAttribute('table-list'));
                        params.append('pageSize', String((sizeList && sizeList[0]) || 10));
                    }
                } catch (_) {}
            }
            return true;
        }
        if (name === 'htmx:beforeRequest') {
            // 数据表格加载/重载：目标容器排定骨架屏（响应超过 200ms 才显示，避免闪烁）
            var src = evt.target;
            if (src && src.nodeType === 1 && bny.hasExtName(src, 'bny-table') &&
                (src.getAttribute('hx-get') !== null || src.getAttribute('hx-post') !== null) &&
                (!src.getAttribute('hx-swap') || src.getAttribute('hx-swap') === 'innerHTML')) {
                var skelTarget = resolveSwapTarget(src);
                if (skelTarget) scheduleTableSkeleton(skelTarget, src);
            }
            return true;
        }
        if (name === 'htmx:afterRequest') {
            // 请求收尾（成功/失败都会触发，且在请求源上触发、扩展必收到）：
            // 取消未显示的骨架定时器。注意 afterSwap 在目标容器上触发，
            // 容器通常没有 hx-ext，扩展收不到，不能用它做清理
            var arSrc = evt.target;
            if (arSrc && arSrc.nodeType === 1 && bny.hasExtName(arSrc, 'bny-table')) {
                clearTableSkeleton(resolveSwapTarget(arSrc), false);
            }
            return true;
        }
        if (name === 'htmx:afterSwap') {
            // 容器自身带 hx-ext 时 afterSwap 才会到达这里，同样做收尾兜底
            clearTableSkeleton(evt.target, false);
            // 静态 thead 模式：tbody 整块交换后统一做后处理（渲染分页条/操作列宽/放大镜/标签/排序箭头）。
            // 注意：htmx 的 afterProcessNode 只对交换进来的 TR 触发（TBODY 不触发），
            // 所以分页条渲染不能挂在 afterProcessNode(TBODY) 分支，必须用这里（在 tbody 上触发）
            if (evt.target.tagName === 'TBODY') {
                const tbl = evt.target.closest('table');
                if (tbl && tbl.hasAttribute('table-static')) {
                    fixRowTargets(tbl, true);
                    fitActionsWidths(tbl);
                    appendZoomButtons(tbl);
                    initLabels(tbl);
                    if (tbl._bnySyncSortState) tbl._bnySyncSortState();
                    renderStaticPagination(tbl);
                }
            }
            return true;
        }
        if (name === 'htmx:responseError' || name === 'htmx:sendError') {
            // 请求失败不会有 swap，主动清掉已显示的骨架
            var errSrc = evt.target;
            if (errSrc && errSrc.nodeType === 1 && bny.hasExtName(errSrc, 'bny-table')) {
                var errTarget = resolveSwapTarget(errSrc);
                if (errTarget) clearTableSkeleton(errTarget, true);
            }
            return true;
        }
        // 在htmx初始化节点后触发
        if (name === 'htmx:afterProcessNode') {
            if (bny.hasExtName(evt.target, 'bny-table')) {
                // 操作按钮（actions 列）与长文本提示层、内置分页条交互：document 级委托，只注册一次
                setupActionsDelegation();
                setupEllipsisTipsDelegation();
                bny.setupPaginationDelegation();
                initLabels(evt.target);
                initSort(evt.target);
                initTree(evt.target);
                fitActionsWidths(evt.target);
                appendZoomButtons(evt.target);
                fixRowTargets(evt.target);
                return false;
            } else if (evt.target.tagName === 'TBODY') {
                // 静态 thead 模式：tbody 是交换目标，行渲染完后同步操作列宽/放大镜/标签/排序箭头/分页条
                const tbl = evt.target.closest('table');
                if (tbl && tbl.hasAttribute('table-static')) {
                    fitActionsWidths(tbl);
                    appendZoomButtons(tbl);
                    initLabels(tbl);
                    if (tbl._bnySyncSortState) tbl._bnySyncSortState();
                    renderStaticPagination(tbl);
                }
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
        // 静态 thead 模式：列模型来自页面静态表头，只把行渲染进 tbody；
        // 非 table-static 上下文的 JSON 一律返回空串（内容渲染交给业务或链上下一个扩展）
        const staticTable = resolveStaticTable(elt);
        if (!staticTable) return '';
        // 分页包裹兼容：{ data: { total, per_page, ..., data: [...] } } 或分页对象本身
        let d = json;
        if (d && typeof d === 'object' && !Array.isArray(d) &&
            d.data && !Array.isArray(d.data) && typeof d.data === 'object') d = d.data;
        return buildStaticRows(d, xhr, staticTable);
    }
});

/* ============================================================
 * 表格数据渲染（静态 thead 模式共享工具）
 *
 * 行模型：对象行 [{field: val},...]，来自响应 data 数组（Laravel/ThinkPHP paginate 格式：
 * { total, per_page, current_page, last_page, data, has_more }）。
 * 单元格渲染由静态表头 th 上的 cell-* 声明驱动（colFromTh 合成列模型），
 * data 里超出表头声明的字段直接忽略。
 *
 * 内置分页：响应带 total 时表格后自动追加分页条（bny.paginationBar），
 * 元素属性 pg-* / table-list* 控制样式与行为。
 *
 * 安全模型：数据（cell/行值）一律转义或 URL 编码；配置（表头声明来自开发者）中的模板可含 HTML，
 * 与 htmx 直接 swap 服务端 HTML 同级信任；模板占位符 {{data.field}} 的值始终转义，不构成注入面。
 * ============================================================ */

/**
 * 取行字段值（支持点路径取嵌套字段，如 "user.name"；null/undefined 归一为空串）
 * @param {Object} row 行数据
 * @param {String} field 字段名
 * @returns {*}
 */
function getVal(row, field) {
    var val = row;
    var parts = String(field).split('.');
    for (var i = 0; i < parts.length; i++) {
        if (val === null || val === undefined) return '';
        val = val[parts[i]];
    }
    return val === null || val === undefined ? '' : val;
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
 * 列是否单行省略：文本/链接列默认开启，行高不因长文本撑高；
 * ellipsis:false 关闭（恢复换行），ellipsis:true 对任意列强制开启（如 template）
 * 仅桌面端生效（移动端卡片布局多行更易读），完整内容在真实截断时由提示层展示
 * @param {Object} col 列定义
 * @returns {Boolean}
 */
function colEllipsis(col) {
    if (col.ellipsis === true) return true;
    if (col.ellipsis === false) return false;
    // 未显式声明时：非模板列默认单行省略（模板列内容交给模板决定）
    return !col.template;
}

/**
 * 模板插值：把 {{data.field}} 占位符替换为行数据（支持点路径）
 * 占位符以 data. 前缀取当前行对象字段，值一律 HTML 转义后嵌入
 * @param {String} tpl 模板
 * @param {Object} row 行数据
 * @returns {string}
 */
function tplInterpolate(tpl, row) {
    return String(tpl === undefined || tpl === null ? '' : tpl).replace(
        /\{\{\s*data\.([a-zA-Z0-9_$]+(?:\.[a-zA-Z0-9_$]+)*)\s*\}\}/g,
        function (m, path) {
            return bny.escapeChars(String(getVal(row, path)));
        }
    );
}

/**
 * 渲染对象行单元格（list 对象行 + 列模型）
 * 富内容统一走 cell-template 表达（模板本身可含 HTML，{{data.field}} 值转义）；
 * 无模板的列按纯文本渲染（值转义）。
 * @param {Object} row 行数据
 * @param {Object} col 列定义
 * @returns {string} td 内容 HTML
 */
function renderTypedCell(row, col) {
    if (col.template) return renderTemplateCell(row, col);
    return bny.escapeChars(String(getVal(row, col.field)));
}

var _cellTplCache = {};

/**
 * 解析 cell-template 模板源："#id" / ".class" 等选择器引用页面 <template> 元素
 * （推荐写法，模板是独立 HTML 块，免属性转义、同页可复用）；其余值按内联模板串兜底。
 * 引用元素只在首次渲染时取 innerHTML 并缓存；未命中不缓存（元素后到仍可拾取），
 * 回退为内联模板串渲染并告警。
 * @param {Object} col 列定义
 * @returns {String} 模板 HTML
 */
function cellTemplateSource(col) {
    var src = col.template || '';
    var ch = src.charAt(0);
    if (ch !== '#' && ch !== '.') return src;
    if (!(src in _cellTplCache)) {
        var el = document.querySelector(src);
        if (!el) {
            console.warn('[bny.table] cell-template 未找到模板元素: ' + src + '（回退为内联模板）');
            return src;
        }
        _cellTplCache[src] = el.innerHTML;
    }
    return _cellTplCache[src];
}

/**
 * template 单元格：cell-template 声明模板（"#id"/".class" 选择器引用 <template> 元素或内联串），
 * {{data.field}} 占位符替换为转义后的行数据
 * @param {Object} row 行数据
 * @param {Object} col 列定义
 * @returns {string}
 */
function renderTemplateCell(row, col) {
    return tplInterpolate(cellTemplateSource(col), row);
}

/**
 * 深度优先拍平服务端返回的 children 嵌套行为顺序节点。
 * 行序即树的先序遍历序：父行在前、子行紧随（initTree 据此折叠后代）
 * @param {Array} list 行数据（行可带 children 数组，任意层级嵌套）
 * @param {number} level 当前层级（0 起）
 * @param {Array<{row:Object, level:number, hasChildren:boolean}>} out 输出数组
 */
function flattenTreeRows(list, level, out) {
    (list || []).forEach(function (row) {
        var children = row && Array.isArray(row.children) ? row.children : null;
        out.push({ row: row, level: level, hasChildren: !!(children && children.length) });
        if (children && children.length) flattenTreeRows(children, level + 1, out);
    });
}

/**
 * 树形首列前缀：层级缩进占位（每级 16px）+ 有子节点的行输出展开/折叠箭头。
 * 箭头旋转由 CSS 依据行的 tree-collapsed 类控制（展开朝下、收起朝右），
 * 点击行为由 initTree 的事件委托处理；叶子节点只有缩进、无箭头
 * @param {number} level 层级
 * @param {boolean} hasChildren 是否有子节点
 * @returns {string} HTML
 */
function treeCellPrefixHtml(level, hasChildren) {
    var s = level > 0
        ? '<span class="bny-table-tree-indent" style="width:' + (level * 16) + 'px;"></span>'
        : '';
    if (hasChildren) {
        s += '<button type="button" class="bny-table-tree-toggle" aria-label="展开/折叠">' +
            '<i class="bny-icon icon-right"></i></button>';
    }
    return s;
}

/**
 * 对象行渲染（list 对象行 + 列模型）
 * @param {Object} row 行数据
 * @param {Array} cols 列定义
 * @param {number} [level] 树形层级；不传按平铺行渲染（无 data-tree-level/缩进）
 * @param {boolean} [hasChildren] 是否有子节点（树形行输出展开箭头）
 * @returns {string}
 */
function objectRowHtml(row, cols, level, hasChildren) {
    var tree = typeof level === 'number';
    var r = '<tr' + (tree ? ' data-tree-level="' + level + '"' : '') + '>';
    cols.forEach(function (col, i) {
        var attrs = tdAlignAttr(col);
        var cls = '';
        var tip = '';
        // 树形首列承载缩进与箭头（移动端卡片布局按此对齐层级）
        if (tree && i === 0) cls = 'bny-table-tree-cell';
        // 单行省略列：悬停经 tip 组件提示"点击展开"（未溢出的单元格由 appendZoomButtons 摘除 tip）
        if (colEllipsis(col)) {
            cls += (cls ? ' ' : '') + 'bny-table-ellipsis';
            tip = ' tip="点击展开"';
        }
        if (cls) attrs += ' class="' + cls + '"';
        attrs += tip;
        // 自定义排序值：sortVal 指定取值字段（显示文案与排序值不同时使用，如 tag 映射列）
        if (col.sortVal) {
            attrs += ' table-sort-val="' + bny.escapeChars(String(getVal(row, col.sortVal))) + '"';
        }
        var content = renderTypedCell(row, col);
        if (tree && i === 0) content = treeCellPrefixHtml(level, hasChildren) + content;
        r += '<td' + attrs + '>' + content + '</td>';
    });
    r += '</tr>';
    return r;
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
 * 操作按钮组列宽自适应（bny-table-actions 容器）
 * 全局 table 样式为 table-layout: fixed，列宽与内容无关——按钮组较宽时会被压缩
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

/**
 * 单行省略单元格提示层（桌面端长文本配套，layui 式深色气泡）：
 * 悬停真实截断的单元格弹出完整内容；提示层本身可悬停进入，文本可框选复制
 * 截断检测在悬停时实时进行（scrollWidth > clientWidth），渲染后无需测量钩子
 */

var _bnyTableTips = null;      // 共享提示层元素
var _bnyTableTipsCell = null;  // 当前触发单元格
var _bnyTableTipsTimer = null; // 延迟收起计时器

function tableTipsPanel() {
    if (_bnyTableTips) return _bnyTableTips;
    var panel = document.createElement('div');
    panel.className = 'bny-table-tips';
    panel.setAttribute('role', 'tooltip');
    document.body.appendChild(panel);
    // 指针从单元格移入面板期间保持显示，可在面板内框选复制
    panel.addEventListener('mouseenter', function () { clearTimeout(_bnyTableTipsTimer); });
    panel.addEventListener('mouseleave', function () {
        // 框选中不收起（复制场景），点击面板外由 document mousedown 统一收起
        var sel = window.getSelection ? window.getSelection() : null;
        if (sel && !sel.isCollapsed && panel.contains(sel.anchorNode)) return;
        hideTableTips(120);
    });
    _bnyTableTips = panel;
    return panel;
}

/**
 * 定位并显示提示层：完整内容（优先下方，空间不足上翻；左右钳制在视口内）
 * 仅由点击放大镜触发；悬停提示"点击展开"由 tip 组件承接
 * @param {HTMLElement} td 触发单元格
 */
function showTableTips(td) {
    var text = td.textContent.trim();
    if (!text || td.scrollWidth <= td.clientWidth) return;
    var panel = tableTipsPanel();
    clearTimeout(_bnyTableTipsTimer);
    _bnyTableTipsCell = td;
    panel.textContent = text;
    // 先隐形渲染拿到尺寸再定位
    panel.classList.add('show');
    panel.style.visibility = 'hidden';
    var rect = td.getBoundingClientRect();
    var pRect = panel.getBoundingClientRect();
    var gap = 8;
    var top;
    if (window.innerHeight - rect.bottom >= pRect.height + gap) {
        top = rect.bottom + gap;
        panel.classList.remove('up');
    } else {
        top = rect.top - pRect.height - gap;
        panel.classList.add('up');
    }
    var left = Math.min(Math.max(gap, rect.left), window.innerWidth - gap - pRect.width);
    panel.style.top = top + 'px';
    panel.style.left = left + 'px';
    panel.style.visibility = 'visible';
}

/**
 * 收起提示层
 * @param {Number} delay 延迟毫秒数（给指针移入面板留出时间）
 */
function hideTableTips(delay) {
    clearTimeout(_bnyTableTipsTimer);
    _bnyTableTipsTimer = setTimeout(function () {
        if (!_bnyTableTips) return;
        _bnyTableTips.classList.remove('show', 'up');
        _bnyTableTipsCell = null;
    }, delay || 0);
}

var _bnyTableTipsDelegated = false;

var _bnyTableTipsPinned = false; // 点击放大镜固定显示：不随鼠标移出收起，点击空白处/其他区域收回

/** 点击放大镜固定显示完整内容 */
function pinTableTips(td) {
    clearTimeout(_bnyTableTipsTimer);
    _bnyTableTipsPinned = true;
    showTableTips(td, true);
}

/** 解除固定并收起提示层 */
function unpinTableTips() {
    _bnyTableTipsPinned = false;
    hideTableTips(0);
}

/**
 * 为真实溢出的文本列单元格追加放大镜查看按钮（仅桌面端）：
 * - 内容未溢出不加，溢出恢复后移除（悬停/点击功能都只在溢出单元格上，
 *   同时同步 tip 属性——悬停提示"点击展开"由 tip 组件承接，绑定在 htmx:load 时已完成，
 *   属性实时读取，摘除后悬停不再提示）
 * - 移动端卡片布局不做省略，清掉窗口缩窄前残留的按钮与 tip
 * - 加内边距可能使原本未溢出的单元格溢出，跑两轮收敛；
 *   布局受字体加载影响就绪后幂等校准，窗口尺寸变化时重新校准
 * @param {HTMLElement} table
 */
function appendZoomButtons(table) {
    var desktop = window.matchMedia && window.matchMedia('(min-width: 768px)').matches;
    if (!desktop) {
        table.querySelectorAll('td.bny-table-ellipsis').forEach(function (td) {
            var btn = td.querySelector('.bny-table-zoom');
            if (btn) {
                btn.remove();
                td.classList.remove('has-zoom');
            }
            td.removeAttribute('tip');
        });
        return;
    }
    for (var pass = 0; pass < 2; pass++) {
        table.querySelectorAll('td.bny-table-ellipsis').forEach(function (td) {
            var btn = td.querySelector('.bny-table-zoom');
            if (td.scrollWidth > td.clientWidth) {
                if (!btn) {
                    btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'bny-table-zoom';
                    btn.setAttribute('aria-label', '查看完整内容');
                    btn.innerHTML = '<i class="bny-icon icon-zoomin"></i>';
                    td.appendChild(btn);
                    td.classList.add('has-zoom');
                }
                if (!td.hasAttribute('tip')) td.setAttribute('tip', '点击展开');
            } else {
                if (btn) {
                    btn.remove();
                    td.classList.remove('has-zoom');
                }
                td.removeAttribute('tip');
            }
        });
    }
}

var _bnyTableZoomResizeTimer = null;
window.addEventListener('resize', function () {
    clearTimeout(_bnyTableZoomResizeTimer);
    _bnyTableZoomResizeTimer = setTimeout(function () {
        document.querySelectorAll('table[hx-ext~="bny-table"]').forEach(appendZoomButtons);
    }, 150);
});
// 图标字体晚于首次布局就位会改变列宽与截断状态，就绪后对已渲染表格幂等校准一次
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
        document.querySelectorAll('table[hx-ext~="bny-table"]').forEach(appendZoomButtons);
    }).catch(function () { });
}

/**
 * 注册长文本单元格交互委托（document 级，只注册一次，渲染后无需重新绑定）：
 * - 悬停溢出单元格：tip 组件提示"点击展开"（渲染时写入 tip 属性，tip 扫描自动绑定）
 * - 点击溢出单元格右侧放大镜：固定显示完整内容，可在其中框选复制；
 *   再点一次收回；点击空白处/其他区域收回；不触发单元格内链接跳转
 */
function setupEllipsisTipsDelegation() {
    if (_bnyTableTipsDelegated) return;
    _bnyTableTipsDelegated = true;
    // 点击：放大镜固定/收回；其他区域收回
    document.addEventListener('click', function (e) {
        // 提示层内部的点击（框选正文）不处理
        if (_bnyTableTips && _bnyTableTips.contains(e.target)) return;
        // 放大镜：固定/收回提示层（按钮在 td 下、链接外，点击不触发跳转）
        var zoom = e.target.closest && e.target.closest('.bny-table-zoom');
        if (zoom) {
            e.preventDefault();
            var td = zoom.closest('td.bny-table-ellipsis');
            if (!td) return;
            if (_bnyTableTipsPinned && td === _bnyTableTipsCell) unpinTableTips();
            else pinTableTips(td);
            return;
        }
        // 点击空白处或其他区域：收回
        if (_bnyTableTipsPinned) unpinTableTips();
    });
    // 滚动/缩放立即收起并解除固定，避免提示层与单元格错位（提示层自身滚动除外）
    document.addEventListener('scroll', function (e) {
        if (_bnyTableTips && e.target && _bnyTableTips.contains(e.target)) return;
        unpinTableTips();
    }, true);
    window.addEventListener('resize', function () { unpinTableTips(); });
}

/* ============================================================
 * 数据表格加载骨架屏
 * 请求发出 200ms 内返回则不显示（避免快响应闪烁）；超时未返回则在
 * 目标容器内渲染表格形骨架（表头条 + 行条，复用骨架屏组件流光基类），
 * 内容交换时骨架随 swap 一起被替换，新表格以渐显动画呈现。
 * ============================================================ */

/**
 * 解析请求源的交换目标容器（hx-target，缺省为请求源自身）
 * @param {HTMLElement} src 请求源元素
 * @returns {HTMLElement|null}
 */
function resolveSwapTarget(src) {
    var sel = src.getAttribute('hx-target');
    if (!sel || sel === 'this') return src;
    // 兼容 htmx 风格关键字（find/closest），裸 querySelector 解析不了
    if (sel.indexOf('find ') === 0) return src.querySelector(sel.slice(5));
    if (sel.indexOf('closest ') === 0) return src.closest(sel.slice(8));
    try {
        return document.querySelector(sel);
    } catch (_) {
        return null;
    }
}

/**
 * 排定骨架屏显示（200ms 延迟，同一容器重复请求时重置）
 * @param {HTMLElement} target 交换目标容器
 * @param {HTMLElement} src 请求源元素（读取行数配置）
 */
function scheduleTableSkeleton(target, src) {
    clearTimeout(target._bnyTableSkeletonTimer);
    target._bnyTableSkeletonShown = false;
    target._bnyTableSkeletonTimer = setTimeout(function () {
        target._bnyTableSkeletonShown = true;
        // 骨架行数取默认每页条数（table-list 首项，缺省 10），介于 3~10
        var sizes = bny.parsePageSizes(src.getAttribute('table-list'));
        var rows = (sizes && sizes[0]) ||
            parseInt(src.getAttribute('table-page-size'), 10) ||
            parseInt(src.getAttribute('pg-page-size'), 10) || 10;
        rows = Math.min(Math.max(rows, 3), 10);
        target.innerHTML = tableSkeletonHtml(rows);
    }, 200);
}

/**
 * 收尾：取消未显示的定时器；请求失败时连已显示的骨架一起清掉
 * @param {HTMLElement} target 交换目标容器
 * @param {Boolean} removeShown 是否移除已显示的骨架（错误场景）
 */
function clearTableSkeleton(target, removeShown) {
    if (!target || !target._bnyTableSkeletonTimer) return;
    clearTimeout(target._bnyTableSkeletonTimer);
    if (removeShown && target._bnyTableSkeletonShown) {
        target.innerHTML = '';
    }
    target._bnyTableSkeletonShown = false;
}

/**
 * 表格形骨架 HTML：表头条 + N 行占位条（宽度错落模拟列布局）
 * @param {Number} rows 行数
 * @returns {string}
 */
function tableSkeletonHtml(rows) {
    var widths = ['8%', '18%', '40%', '14%', '22%'];
    var h = '<div class="bny-table-skeleton" aria-hidden="true">';
    h += '<div class="bny-table-skeleton-head"><div class="bny-skeleton bny-table-skeleton-bar" style="width:12%"></div></div>';
    for (var i = 0; i < rows; i++) {
        h += '<div class="bny-table-skeleton-row">';
        for (var j = 0; j < widths.length; j++) {
            h += '<div class="bny-skeleton bny-table-skeleton-bar" style="width:' + widths[j] + '"></div>';
        }
        h += '</div>';
    }
    h += '</div>';
    return h;
}

/* ============================================================
 * 表格内操作按钮交互（document 级事件委托）
 * cell-template 输出的按钮带 data-bny-action 即走 runAction 的
 * confirm/url/event 协议，与 htmx 组合链上的 link/url 扩展同族。
 * ============================================================ */

var _bnyTableActionsDelegated = false;

/**
 * 注册操作按钮点击委托（只注册一次，渲染后无需重新绑定）
 */
function setupActionsDelegation() {
    if (_bnyTableActionsDelegated) return;
    _bnyTableActionsDelegated = true;
    document.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('[data-bny-action]');
        if (!btn) return;
        e.preventDefault();
        runAction(btn);
    });
}

/**
 * 通过表格所在容器反查请求源配置元素（携带 hx-get/hx-post 与 hx-target，作为 htmx.ajax 的 source）
 * @param {HTMLElement} container 表格容器
 * @returns {HTMLElement|null}
 */
function findRequestSource(container) {
    if (container && container.id) {
        return document.querySelector('[hx-get][hx-target="#' + container.id + '"], [hx-post][hx-target="#' + container.id + '"]');
    }
    return null;
}

/**
 * 读取 URL 查询参数（字符串安全；bny.parsePageParam 内部 parseInt，只适用于数值参数）
 * @param {string} url
 * @param {string} name
 * @returns {string} 无值返回空串
 */
function queryVal(url, name) {
    if (!url) return '';
    try {
        var u = new URL(url, window.location.href);
        return u.searchParams.get(name) || '';
    } catch (e) {
        var re = new RegExp('[?&]' + String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^&]*)');
        var m = String(url).match(re);
        return m ? decodeURIComponent(m[1]) : '';
    }
}

/**
 * 合并查询参数：保留 url 上已有参数（搜索/筛选条件自动延续），覆盖或删除指定键
 * @param {string} url 基准 URL（可含查询串与 hash）
 * @param {Object} params 要写入的参数；值为空串/null/undefined 表示删除该参数
 * @returns {string}
 */
function mergeQuery(url, params) {
    var s = String(url || '');
    var hi = s.indexOf('#');
    var hash = hi >= 0 ? s.slice(hi) : '';
    if (hi >= 0) s = s.slice(0, hi);
    var qi = s.indexOf('?');
    var base = qi >= 0 ? s.slice(0, qi) : s;
    var map = {};
    if (qi >= 0) {
        s.slice(qi + 1).split('&').forEach(function (kv) {
            if (!kv) return;
            var i = kv.indexOf('=');
            var k = i >= 0 ? kv.slice(0, i) : kv;
            var v = i >= 0 ? kv.slice(i + 1) : '';
            try { k = decodeURIComponent(k); v = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (_) { }
            map[k] = v;
        });
    }
    Object.keys(params || {}).forEach(function (k) {
        var v = params[k];
        if (v === null || v === undefined || v === '') delete map[k];
        else map[k] = String(v);
    });
    var out = Object.keys(map).map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(map[k]);
    }).join('&');
    return base + (out ? '?' + out : '') + hash;
}

/**
 * 读取配置元素声明的请求方法（hx-post 优先，hx-get 兜底）
 * @param {HTMLElement} src 配置元素
 * @returns {string}
 */
function _reqMethod(src) {
    if (src.getAttribute('hx-post') !== null) return 'POST';
    if (src.getAttribute('hx-put') !== null) return 'PUT';
    if (src.getAttribute('hx-delete') !== null) return 'DELETE';
    return 'GET';
}

/**
 * 读取配置元素声明的请求地址（hx-post / hx-get 任一）
 * @param {HTMLElement} src 配置元素
 * @returns {string}
 */
function _reqUrl(src) {
    return src.getAttribute('hx-post') || src.getAttribute('hx-get') || '';
}

/**
 * 表格按参数重新请求（排序/外部筛选触发）
 * - JSON 整表模式：source 为容器反查到的配置元素，target 为容器（整表重建）
 * - 静态 thead 模式（table-static）：source/target 都是表格自身语义，target 为 tbody（只换行）
 * 请求方法与地址跟随配置元素的 hx-* 声明（GET 参数拼 URL，POST 等参数进 body）
 * @param {HTMLElement} container 表格容器
 * @param {HTMLElement} table 表格元素（读 table-url 基准 URL）
 * @param {Object} params 要合并的参数
 */
function reloadTableWithParams(container, table, params) {
    if (!table) return;
    var isStatic = table.hasAttribute('table-static');
    var src = isStatic ? table : (findRequestSource(container) || table);
    var method = _reqMethod(src);
    var base = table.getAttribute('table-url') || _reqUrl(src);
    if (!base) return;
    var target = isStatic ? (table.querySelector('tbody') || container) : container;
    // GET：参数合并进 URL 查询串；POST 等：全部参数进请求体，URL 只留纯地址
    var url = base;
    var opts = { source: src, target: target, swap: 'innerHTML' };
    if (method === 'GET') {
        url = mergeQuery(base, params);
    } else {
        var merged = mergeQuery(base, params);
        var sep = merged.indexOf('?');
        url = sep >= 0 ? merged.slice(0, sep) : merged;
        var bodyParams = {};
        if (sep >= 0) {
            merged.slice(sep + 1).split('&').forEach(function (kv) {
                if (!kv) return;
                var i = kv.indexOf('=');
                var k = i >= 0 ? kv.slice(0, i) : kv;
                var v = i >= 0 ? kv.slice(i + 1) : '';
                try { bodyParams[decodeURIComponent(k)] = decodeURIComponent(v); } catch (_) { bodyParams[k] = v; }
            });
        }
        opts.values = bodyParams;
    }
    htmx.ajax(method, url, opts);
}

/* ============================================================
 * 静态 thead 模式（table-static）：列模型写在页面 HTML 里，服务端只回数据
 *
 * 用法：
 *   <table hx-ext="bny-table" table-static table-server table-key="users"
 *          hx-get="/api/users" hx-trigger="load" hx-target="find tbody" hx-swap="innerHTML">
 *     <thead><tr>
 *       <th cell-field="name" cell-sort>姓名</th>
 *       <th cell-field="role" cell-template="#tpl-role">角色</th>
 *     </tr></thead>
 *     <tbody></tbody>
 *   </table>
 *
 *   <template id="tpl-role"><span class="bny-tag" tag-color="blue">{{data.role}}</span></template>
 *
 * 响应契约：{ "data": [当前页行对象], "total": 总条数 }
 * 配合 table-server 时请求自动携带 page/pageSize/sort/order（参数名可用
 * pg-page-param / pg-size-param / table-sort-param / table-order-param 定制）。
 *
 * 树形数据：行对象可带 children 数组嵌套子行（任意层级），首列自动渲染层级缩进
 * 与展开/折叠箭头（点击折叠整棵子树）；树形行不参与排序（行序即层级从属），
 * 平铺数据不受影响。
 * ============================================================ */

/**
 * 静态表头 th 声明 → 列模型
 *
 * 边界说明：静态表头只支持三个核心富内容声明，其余一律由 cell-template 拖底：
 *   - cell-field：行对象取值字段（缺省空串，模板列可仅声明 cell-template 不取值）
 *   - cell-sort：列排序（服务端模式发 sort/order）
 *   - cell-template：富内容模板，值为 "#id" / ".class" 等选择器（引用页面 <template> 元素，推荐）或内联模板串，
 *     {{data.field}} 占位符替换行数据（支持点路径，值转义），模板本身可含 HTML（按钮/标签/链接等）
 * 已废弃不再解析：cell-type / cell-map / cell-actions / cell-href / cell-text / cell-src /
 * cell-round / cell-group —— 富内容统一走 cell-template，无其他入口。
 * @param {HTMLElement} th
 * @returns {object} col
 */
function colFromTh(th) {
    const col = {
        field: th.getAttribute('cell-field') || th.getAttribute('table-sort-field') || '',
        title: th.textContent.trim(),
        align: th.getAttribute('cell-align') || ''
    };
    const ell = th.getAttribute('cell-ellipsis');
    if (ell !== null) col.ellipsis = ell !== 'false';
    const template = th.getAttribute('cell-template');
    if (template) col.template = template;
    const sortVal = th.getAttribute('cell-sort-val');
    if (sortVal) col.sortVal = sortVal;
    return col;
}

/**
 * 收集静态表头全部列模型
 * @param {HTMLElement} table
 * @returns {Array<object>}
 */
function colsFromThead(table) {
    const cols = [];
    table.querySelectorAll('thead th').forEach(function (th) {
        cols.push(colFromTh(th));
    });
    return cols;
}

/**
 * 解析请求对应的静态表格（table-static）：
 * - 请求源是表格自身（hx-target="find tbody"）→ 表格即配置元素
 * - 请求源是搜索按钮等外部元素（hx-target="#xx-tbody"）→ 按 target 反查所属静态表格
 * @param {HTMLElement} elt 请求源元素
 * @returns {HTMLElement|null}
 */
function resolveStaticTable(elt) {
    if (!elt) return null;
    if (elt.tagName === 'TABLE' && elt.hasAttribute('table-static')) return elt;
    const sel = elt.getAttribute('hx-target');
    if (!sel) return null;
    let target = null;
    if (sel.indexOf('find ') === 0) target = elt.querySelector(sel.slice(5));
    else { try { target = document.querySelector(sel); } catch (_) { } }
    const table = target && target.closest ? target.closest('table') : null;
    return (table && table.hasAttribute('table-static')) ? table : null;
}

/**
 * 修正表格行内请求元素（hx-get/post/put/delete）的 hx-target 继承问题：
 * htmx 的 getClosestAttributeValue 会让行内元素继承表格自身的 hx-target="find tbody"，
 * 而 find 语义是"从该元素自身查后代"，trigger 内没有 tbody → 解析失败触发
 * htmx:targetError，请求（含 hx-confirm 确认）被拦在发出之前。
 * 这里给未显式声明 hx-target 的行内请求元素补 hx-target="closest tbody"，
 * 使其响应目标为所在表格的 tbody（操作按钮的典型语义：确认后刷新列表）。
 * @param {HTMLElement} table 静态表格元素
 */
function fixRowTargets(table, force) {
    if (!table || (!force && table._bnyFixTargetsDone)) return;
    table._bnyFixTargetsDone = true;
    const apply = function () {
        table.querySelectorAll('tbody [hx-get], tbody [hx-post], tbody [hx-put], tbody [hx-delete]').forEach(function (elt) {
            if (elt.getAttribute('hx-target') === null) {
                elt.setAttribute('hx-target', 'closest tbody');
            }
            // hx-include="[id='N']"：行内一般没有 id 属性元素，补到该元素所在行，
            // 保证包含参数能取到（如模板 {{data.id}} 渲染为 [id='5']）
            const inc = elt.getAttribute('hx-include');
            if (inc) {
                const m = /\[id=['"]([^'"]+)['"]\]/.exec(inc);
                if (m && m[1] && !document.querySelector('[id="' + m[1] + '"]')) {
                    const row = elt.closest('tr');
                    if (row && !row.id) row.id = m[1];
                }
            }
        });
    };
    apply();
    // tbody 每次整块换新都会替换 DOM，新行里的 trigger 需重新修正（MutationObserver 兜底）
    let tb = table.querySelector('tbody');
    if (tb && !table._bnyTargetObserver) {
        const obs = new MutationObserver(function () { apply(); });
        obs.observe(tb, { childList: true });
        table._bnyTargetObserver = obs;
    }
}

/**
 * 把表格的内存排序状态（table._bnySortState）并入翻页回带查询串。
 * POST 模式下 sort/order 参数在请求 body，响应 URL 拿不到，翻页必须从
 * 内存状态回带，否则点击下一页后排序条件丢失。
 * @param {string} query 现有查询串（URL 来源，可为空）
 * @param {HTMLElement} table 静态表格元素
 * @returns {string} 合并后的查询串
 */
function mergeSortQuery(query, table) {
    const mem = table && table._bnySortState;
    if (!mem || !mem.field) return query;
    const sortParam = table.getAttribute('table-sort-param') || 'sort';
    const orderParam = table.getAttribute('table-order-param') || 'order';
    const parts = [];
    if (query) parts.push(query);
    parts.push(encodeURIComponent(sortParam) + '=' + encodeURIComponent(mem.field));
    parts.push(encodeURIComponent(orderParam) + '=' + (mem.order === 'desc' ? 'desc' : 'asc'));
    return parts.join('&');
}

/**
 * 静态模式：响应 JSON → tbody 行 HTML（列模型来自静态 thead，服务端只回数据）
 * 分页信息暂存到表格元素上，afterProcessNode 里渲染分页条（分页条须挂 table 后面，不能进 tbody）
 * @param {object} data { list|rows, total, page, pageSize, empty }；
 *   行可带 children 数组嵌套子行（树形表格），任意层级，按先序拍平渲染
 * @param {XMLHttpRequest} xhr
 * @param {HTMLElement} table 静态表格元素
 * @returns {string} 行 HTML
 */
function buildStaticRows(data, xhr, table) {
    const cols = colsFromThead(table);
    // 行数据：paginate 契约的 data 数组（兼容 list/rows 键名）；超出表头声明的字段自然忽略
    const list = Array.isArray(data.data) ? data.data
        : (Array.isArray(data.list) ? data.list
        : (Array.isArray(data.rows) ? data.rows : []));

    // 记录本次响应 URL：排序/外部 reload 以它为基准合并参数；排序箭头也从它回显
    if (xhr && xhr.responseURL) table.setAttribute('table-url', xhr.responseURL);

    // 分页信息暂存（分页条在 afterProcessNode 里渲染到表格后面）
    const paramName = table.getAttribute('pg-page-param') || 'page';
    const sizeParam = table.getAttribute('pg-size-param') || 'pageSize';
    const url = (xhr && xhr.responseURL) || _reqUrl(table);
    // 条数选项：table-list 逗号分隔（如 10,20,50）；首项即默认每页条数，缺省 [10] / 10
    const sizeList = bny.parsePageSizes(table.getAttribute('table-list'));
    table._bnyStaticPage = {
        total: parseInt(data.total, 10),
        // 当前页：URL 参数 > 响应 current_page；每页条数：URL 参数 > 响应 per_page > table-list 首项（默认 10）
        page: bny.parsePageParam(url, paramName) || parseInt(data.current_page, 10) || 1,
        pageSize: bny.parsePageParam(url, sizeParam)
            || parseInt(data.per_page, 10)
            || (sizeList ? sizeList[0] : 10),
        paramName: paramName,
        sizeParam: sizeParam,
        // 回带查询条件：URL 查询串（GET）+ 内存排序状态（POST 模式 sort/order 在 body，
        // URL 读不到，翻页时由 pg-query 回带保持排序）
        query: mergeSortQuery(bny.carryQuery(url, [paramName, sizeParam]), table),
        // 条数选择列表：table-list 逗号分隔（如 10,20,50）；首项为默认每页条数，未设置时默认 [10]
        sizes: sizeList || [10],
        carryAttrs: carryAttrsFrom(table, ['pg-color', 'pg-model', 'data-max-buttons', 'data-jumper', 'data-total', 'data-page-size'])
    };

    // 分页条渲染放在这里（可靠主路径）：静态表格元素始终在文档中，
    // 无需等待任何 htmx 生命周期事件；afterProcessNode 只对 TR 触发、
    // afterSwap 在部分交换场景不可达，都不可依赖。重复调用由 _bnyStaticPage 幂等保护。
    renderStaticPagination(table);

    if (!list.length) {
        return '<tr class="bny-table-empty"><td colspan="' + Math.max(1, cols.length) + '">' +
            bny.escapeChars(data.empty || '暂无数据') + '</td></tr>';
    }
    // children 嵌套 → 先序拍平；任一节点有子级才按树形渲染
    // （平铺数据不产生缩进/箭头/data-tree-level，排序等行为不受影响）
    const flat = [];
    flattenTreeRows(list, 0, flat);
    const isTree = flat.some(function (n) { return n.level > 0 || n.hasChildren; });
    let h = '';
    flat.forEach(function (n) {
        h += objectRowHtml(n.row, cols, isTree ? n.level : undefined, isTree && n.hasChildren);
    });
    return h;
}

/**
 * 静态模式：把暂存的分页信息渲染成分页条，插到表格后面（重复请求时先移除旧条）
 * @param {HTMLElement} table
 */
function renderStaticPagination(table) {
    const info = table._bnyStaticPage;
    if (!info) return;
    delete table._bnyStaticPage;
    if (isNaN(info.total)) return;
    const old = table.nextElementSibling;
    if (old && old.classList && old.classList.contains('bny-pagination')) old.remove();
    const wrap = document.createElement('div');
    wrap.innerHTML = bny.paginationBar({
        total: info.total,
        page: info.page,
        pageSize: info.pageSize,
        paramName: info.paramName,
        sizeParam: info.sizeParam,
        sizes: info.sizes,
        query: info.query,
        jumper: table.getAttribute('pg-jumper') !== 'false',
        showTotal: table.getAttribute('pg-total') !== 'false',
        carryAttrs: info.carryAttrs
    });
    if (wrap.firstChild) table.parentNode.insertBefore(wrap.firstChild, table.nextSibling);
}

/**
 * 执行表格内操作按钮动作（cell-template 手写的 data-bny-action 按钮，由事件委托调用）
 * 流程：有 confirm 先弹 bny.confirm →
 *   1. 有 event：派发自定义事件（detail: {row, page}）交由业务处理，不发请求
 *   2. 有 url：htmx.ajax 按声明的 method 发请求；
 *      - 有 target：swap 到指定容器（如弹窗）
 *      - 无 target：默认刷回表格容器（服务端返回同结构 JSON 即可整块刷新，等价于 refresh）
 * @param {HTMLElement} btn 操作按钮
 */
function runAction(btn) {
    // 操作按钮在表格内，容器是 table 的父级（分页条若存在则是其兄弟节点）
    // 注意：不能用 btn.closest('.bny-pagination')——按钮在表格内而非分页条内
    var table = btn.closest('table');
    var container = table ? table.parentElement : null;
    var bar = container ? container.querySelector(':scope > .bny-pagination') : null;

    // 按钮在弹出菜单面板内：立即关闭面板（与 dropdown.js closeDropdown 行为一致）
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

/**
 * 公开 API：按参数重新请求表格（外部搜索表单/筛选按钮触发）
 * 保留 URL 上其他查询条件，只覆盖/删除给定的键；静态模式 target 为 tbody，JSON 模式整表重建
 * @param {string|HTMLElement} target 表格元素、其容器或任意选择器
 * @param {Object} params 查询参数，如 { kw: '张' }；值为空串表示删除该条件
 */
bny.tableReload = function (target, params) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    const table = el.tagName === 'TABLE' ? el : (el.querySelector ? el.querySelector('table') : null);
    if (!table) return;
    reloadTableWithParams(el.tagName === 'TABLE' ? el.parentElement : el, table, params || {});
};
