htmx.defineExtension('bny-table', {
    // 事件
    onEvent: function (name, evt) {

        /**
         * 获取单元格的排序值
         * @param {HTMLTableCellElement} td
         * @returns {string}
         */
        function sortVal(td) {
            return td.getAttribute('data-sort-val') || td.textContent.trim();
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
            let ths = table.querySelectorAll('thead th[data-sort]');
            if (!ths.length) {
                ths = table.querySelectorAll('thead th[sortable]');
            }
            if (!ths.length) return;

            // 表格唯一标识（用于持久化排序状态到 sessionStorage）
            const tableKey = table.getAttribute('data-table-key') || '';
            const storeKey = tableKey ? 'bny-table-sort:' + tableKey : '';

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

            ths.forEach(function (th) {
                const colIndex = Array.from(th.parentElement.querySelectorAll('th')).indexOf(th);

                th.style.cursor = 'pointer';
                th.setAttribute('title', '点击排序');
                th.classList.add('sortable');

                th.addEventListener('click', function () {
                    const isAsc = th.classList.contains('sort-asc');

                    // 清除所有排序列的类名
                    ths.forEach(function (t) {
                        t.classList.remove('sort-asc', 'sort-desc');
                    });

                    // 设置当前列排序状态
                    if (isAsc) {
                        th.classList.add('sort-desc');
                    } else {
                        th.classList.add('sort-asc');
                    }

                    const type = th.getAttribute('data-sort') || 'string';
                    const asc = th.classList.contains('sort-asc');
                    const tbody = table.querySelector('tbody');
                    if (tbody) {
                        sortRows(tbody, colIndex, type, asc);
                    }
                    // 持久化排序状态
                    persistSort(colIndex, type, asc);
                });
            });

            // 恢复持久化的排序状态（HTMX 重新请求后自动应用）
            const saved = readSort();
            if (saved) {
                const targetTh = ths[saved.colIndex];
                if (targetTh) {
                    targetTh.classList.add(saved.asc ? 'sort-asc' : 'sort-desc');
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
                    tds[k].setAttribute('label', titles[tds[k].cellIndex] || '');
                }
            }
        }

        // 在htmx初始化节点后触发
        if (name === 'htmx:afterProcessNode') {
            if (bny.hasExtName(evt.target, 'bny-table')) {
                initLabels(evt.target);
                initSort(evt.target);
                return false;
            } else if (evt.target.tagName === 'TR') {
                const tds = evt.target.querySelectorAll('td');
                for (let i = 0; i < tds.length; i++) {
                    const label = evt.target
                        .parentElement
                        .parentElement
                        .querySelector('th:nth-child(' + (tds[i].cellIndex + 1) + ')');
                    tds[i].setAttribute('label', label ? label.textContent : '');
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
                if (col.sortable) attrs += ' sortable'
                if (col.sort) attrs += ' data-sort="' + bny.escapeChars(String(col.sort)) + '"'
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
            h += '<table hx-ext="bny-table"' + (color ? ' color="' + color + '"' : '');
            if (tableKey) h += ' data-table-key="' + bny.escapeChars(tableKey) + '"';
            h += '>';
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
                rows.forEach(function (row) {
                    h += '<tr>';
                    if (Array.isArray(row)) {
                        row.forEach(function (cell) {
                            h += '<td>' + renderCell(cell) + '</td>';
                        });
                    } else if (row && typeof row === 'object' && row.__html) {
                        // 整行原始 HTML（用于自定义行结构）
                        h += row.__html;
                    } else {
                        h += '<td>' + renderCell(row) + '</td>';
                    }
                    h += '</tr>';
                });
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
