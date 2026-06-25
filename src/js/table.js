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
                });
            });
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
         * JSON数据转表格HTML
         * @param {object} data { cols: [...], rows: [[...], ...] }
         * @returns {string} html
         */
        function buildTable(data) {
            const cols = data.cols || [];
            const rows = data.rows || [];
            const color = data.color || '';

            let h = '';
            h += '<table hx-ext="bny-table"' + (color ? ' color="' + color + '"' : '') + '>';
            h += '<thead><tr>';
            cols.forEach(function (col) {
                h += '<th>' + bny.escapeChars(col) + '</th>';
            });
            h += '</tr></thead>';
            h += '<tbody>';
            rows.forEach(function (row) {
                h += '<tr>';
                row.forEach(function (cell) {
                    h += '<td>' + bny.escapeChars(String(cell)) + '</td>';
                });
                h += '</tr>';
            });
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
