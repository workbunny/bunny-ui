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
                initLabels(evt.target);
                initSort(evt.target);
                initTree(evt.target);
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

    // 响应转换
    transformResponse: function (text, xhr, elt) {

        /**
         * 渲染单个单元格内容
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
         * 渲染表头单元格
         * - 字符串：escapeChars
         * - 对象 { name, sortable, sort }：支持列级排序声明
         * @param {*} col
         * @returns {string}
         */
        function renderCol(col) {
            if (col !== null && typeof col === 'object') {
                var name = bny.escapeChars(String(col.name ?? ''))
                var attrs = ''
                // 列级排序：sort 指定类型；仅 sortable 时按字符串排序
                if (col.sort) {
                    attrs += ' table-sort="' + bny.escapeChars(String(col.sort)) + '"'
                } else if (col.sortable) {
                    attrs += ' table-sort'
                }
                return '<th' + attrs + '>' + name + '</th>'
            }
            return '<th>' + bny.escapeChars(String(col)) + '</th>'
        }

        /**
         * JSON数据转表格HTML
         * @param {object} data { cols: [...], rows: [[...], ...], color, empty }
         * @returns {string} html
         */
        function buildTable(data) {
            const cols = data.cols || [];
            const rows = data.rows || [];
            const color = data.color || '';
            // 空数据时的占位文案，默认 '暂无数据'
            const emptyText = data.empty || '暂无数据';
            // 表格唯一标识（用于排序状态持久化），优先使用 data.key，其次 color
            const tableKey = data.key || color || '';

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
            if (rows.length === 0) {
                // 空状态：合并所有列显示占位文案
                h += '<tr class="bny-table-empty"><td colspan="' + cols.length + '">' + bny.escapeChars(emptyText) + '</td></tr>';
            } else {
                rows.forEach(function (row) { appendRow(row, 0); });
            }
            h += '</tbody></table>';
            return h;
        }

        if (xhr.getResponseHeader('Content-Type') &&
            xhr.getResponseHeader('Content-Type').includes('application/json')) {
            const json = JSON.parse(xhr.responseText);
            const data = json.data || json;
            return buildTable(data);
        }
        return text;
    }
});
