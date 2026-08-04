/**
 * bny-pagination — 分页组件
 *
 * 设计：
 * - HTMX 扩展，服务端返回 JSON 自动渲染分页条
 * - 与 htmx 集成：点击页码通过 hx-get 请求新数据
 * - 支持前后端分离场景：JSON 中带 total/page/pageSize
 * - 静态 JSON 测试：从 xhr.responseURL 解析 page 参数，反映点击页码
 * - 事件委托：document 级监听，渲染后无需重新绑定
 *
 * 用法：
 *   <div hx-ext="bny-pagination"
 *        hx-get="/api/users"
 *        hx-target="#user-list"
 *        hx-swap="innerHTML"
 *        hx-trigger="load"
 *        pg-page-size="10"
 *        pg-max-buttons="7">
 *   </div>
 *   <div id="user-list"></div>
 *
 * 服务端返回：
 *   { "total": 100, "page": 1, "pageSize": 10, "data": [...] }
 * 或：
 *   { "total": 100, "page": 1, "pageSize": 10 }
 *   （数据部分由其他扩展/swap 单独处理）
 */
htmx.defineExtension('bny-pagination', {

    onEvent: function (name, evt) {

        // htmx 初始化节点后：注册全局事件委托（只注册一次）
        if (name === 'htmx:afterProcessNode') {
            if (!bny.hasExtName(evt.target, 'bny-pagination')) return false;
            setupDelegation();
            return false;
        }

        return true;
    },

    // 响应转换：JSON → 分页条 HTML（数据部分保留原样由 htmx swap）
    transformResponse: function (text, xhr, elt) {
        var ct = xhr.getResponseHeader('Content-Type') || '';
        if (!ct.includes('application/json')) return text;

        var json;
        try {
            json = JSON.parse(xhr.responseText);
        } catch (e) {
            return text;
        }

        // 兼容 {data: {...}} 包裹与平铺两种结构
        var data = json.data || json;
        var total = parseInt(data.total, 10) || 0;
        var pageSize = parseInt(data.pageSize || data.size, 10) || parseInt(elt.getAttribute('pg-page-size'), 10) || 10;

        // 参数名：默认 page
        var paramName = elt.getAttribute('pg-page-param') || 'page';

        // 优先从 responseURL 解析 page 参数（支持静态 JSON 测试数据反映点击的页码）
        var page = parsePageFromURL(xhr.responseURL, paramName) || parseInt(data.page, 10) || 1;

        // 配置：最多显示多少个页码按钮（默认 7）
        var maxButtons = parseInt(elt.getAttribute('pg-max-buttons'), 10) || 7;
        // 是否显示跳转输入框
        var showJumper = elt.getAttribute('pg-jumper') !== 'false';
        // 是否显示总数
        var showTotal = elt.getAttribute('pg-total') !== 'false';

        var totalPages = Math.max(1, Math.ceil(total / pageSize));
        if (page > totalPages) page = totalPages;
        if (page < 1) page = 1;

        // 构建分页条外层 div：携带原始样式/配置属性
        // 注意：不携带 hx-get/hx-target/hx-swap —— div+hx-get 无 hx-trigger 会被 htmx 注册默认 click 触发，
        // 与事件委托冲突并导致 transformResponse 不被调用（原始配置 div 是容器的兄弟，非祖先）
        // 请求所需的 htmx 配置由 triggerPageRequest 反查原始配置 div 读取（见下）
        var h = '<div class="bny-pagination"';
        h += carryAttrs(elt, ['color', 'model',
            'data-max-buttons', 'data-jumper', 'data-total', 'data-page-size']);
        h += ' pg-current="' + page + '"';
        h += ' pg-total-pages="' + totalPages + '"';
        h += ' pg-page-param="' + bny.escapeChars(paramName) + '"';
        h += '>';

        // 总数
        if (showTotal) {
            h += '<span class="bny-pagination-total">共 <em>' + total + '</em> 条</span>';
        }

        // 上一页
        h += '<a class="bny-pagination-prev' + (page <= 1 ? ' disabled' : '') + '"';
        h += ' pg-page="' + Math.max(1, page - 1) + '"';
        h += ' title="上一页"><i class="bny-icon icon-left"></i></a>';

        // 页码按钮
        var btns = computeButtons(page, totalPages, maxButtons);
        for (var i = 0; i < btns.length; i++) {
            var b = btns[i];
            if (b === '...') {
                h += '<span class="bny-pagination-ellipsis">...</span>';
            } else {
                h += '<a class="bny-pagination-btn' + (b === page ? ' active' : '') + '"';
                h += ' pg-page="' + b + '"';
                h += '>' + b + '</a>';
            }
        }

        // 下一页
        h += '<a class="bny-pagination-next' + (page >= totalPages ? ' disabled' : '') + '"';
        h += ' pg-page="' + Math.min(totalPages, page + 1) + '"';
        h += ' title="下一页"><i class="bny-icon icon-right"></i></a>';

        // 跳转
        if (showJumper && totalPages > 1) {
            h += '<span class="bny-pagination-jump">';
            h += '前往 <input type="number" class="bny-pagination-input" min="1" max="' + totalPages + '" value="' + page + '"> 页';
            h += '</span>';
        }

        h += '</div>';

        // 列表/表格渲染：data-render-list="true" 时同时渲染数据区 + 分页条
        // - allList：前端分页，从全量数据截取当前页（静态 JSON 测试场景）
        // - list：服务端已分页的数据
        // - columns：表格列定义，有则渲染表格，否则渲染简单列表
        if (elt.getAttribute('pg-render-list') === 'true') {
            var list = [];
            var columns = data.columns || [];

            if (Array.isArray(data.allList)) {
                // 前端分页：从全量数据截取当前页
                var start = (page - 1) * pageSize;
                list = data.allList.slice(start, start + pageSize);
            } else if (Array.isArray(data.list)) {
                list = data.list;
            }

            if (list.length && columns.length) {
                // 渲染表格
                return renderTable(list, columns) + h;
            } else if (list.length) {
                // 简单列表
                var listHtml = '<div class="bny-pagination-list">';
                list.forEach(function (item) {
                    listHtml += '<div class="bny-pagination-list-item">' + bny.escapeChars(String(item)) + '</div>';
                });
                listHtml += '</div>';
                return listHtml + h;
            }
        }

        return h;
    }
});

/**
 * 渲染表格 HTML（直接输出 thead/tbody，不依赖 bny-table 扩展）
 * @param {Array<Object>} list 行数据
 * @param {Array<{field:string,title:string}>} columns 列定义
 * @returns {string}
 */
function renderTable(list, columns) {
    var h = '<table class="bny-table" style="margin-bottom:16px;">';
    h += '<thead><tr>';
    columns.forEach(function (col) {
        h += '<th>' + bny.escapeChars(col.title || col.field) + '</th>';
    });
    h += '</tr></thead><tbody>';
    list.forEach(function (row) {
        h += '<tr>';
        columns.forEach(function (col) {
            var val = row[col.field];
            if (val === null || val === undefined) val = '';
            h += '<td>' + bny.escapeChars(String(val)) + '</td>';
        });
        h += '</tr>';
    });
    h += '</tbody></table>';
    return h;
}

/**
 * 计算要显示的页码按钮序列
 * - 始终包含第一页与最后一页
 * - 中间用 '...' 表示省略
 * @param {number} current 当前页
 * @param {number} total 总页数
 * @param {number} max 最多按钮数（含首尾与省略号）
 * @returns {Array<number|string>}
 */
function computeButtons(current, total, max) {
    if (total <= max) {
        var arr = [];
        for (var i = 1; i <= total; i++) arr.push(i);
        return arr;
    }

    // max 至少为 5（首 + ... + 当前 + ... + 尾）
    if (max < 5) max = 5;

    var result = [];
    // 中间连续区域最多放 max-2 个按钮（去掉首尾各占一位）
    var remaining = max - 2;
    var half = Math.floor(remaining / 2);

    // 左右边界（不含首尾页）
    var left = Math.max(2, current - half);
    var right = Math.min(total - 1, current + half);

    // 若左侧贴近首页，则右扩填满中间区域
    if (left <= 2) {
        left = 2;
        right = Math.min(total - 1, remaining + 1);
    }
    // 若右侧贴近末页，则左扩填满中间区域
    if (right >= total - 1) {
        right = total - 1;
        left = Math.max(2, total - remaining);
    }

    result.push(1);
    if (left > 2) result.push('...');
    for (var j = left; j <= right; j++) result.push(j);
    if (right < total - 1) result.push('...');
    result.push(total);
    return result;
}

/**
 * 把 elt 上的指定属性原样拼成 HTML 属性串（用于回写到渲染的分页条上）
 * @param {HTMLElement} elt
 * @param {Array<string>} names
 * @returns {string}
 */
function carryAttrs(elt, names) {
    var s = '';
    names.forEach(function (n) {
        var v = elt.getAttribute(n);
        if (v !== null) {
            s += ' ' + n + '="' + bny.escapeChars(v) + '"';
        }
    });
    return s;
}

/**
 * 从 responseURL 解析 page 参数
 * - 静态 JSON 测试数据 page 永远为 1，需从 URL 查询串反映实际点击页码
 * @param {string} url
 * @param {string} paramName
 * @returns {number}
 */
function parsePageFromURL(url, paramName) {
    if (!url) return 0;
    try {
        var u = new URL(url, window.location.href);
        var p = u.searchParams.get(paramName);
        return parseInt(p, 10) || 0;
    } catch (e) {
        // 兜底：正则提取
        var re = new RegExp('[?&]' + encodeURIComponent(paramName) + '=([^&]+)');
        var m = String(url).match(re);
        if (m) return parseInt(decodeURIComponent(m[1]), 10) || 0;
        return 0;
    }
}

/**
 * 全局事件委托：document 级监听点击 / 跳转回车
 * - 只注册一次，渲染后无需重新绑定
 */
var _bnyPageDelegated = false;
function setupDelegation() {
    if (_bnyPageDelegated) return;
    _bnyPageDelegated = true;

    // 点击页码 / 上一页 / 下一页
    document.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('.bny-pagination-btn, .bny-pagination-prev, .bny-pagination-next');
        if (!btn) return;
        var bar = btn.closest('.bny-pagination');
        if (!bar) return;
        if (btn.classList.contains('disabled') || btn.classList.contains('active')) {
            e.preventDefault();
            return;
        }
        var p = btn.getAttribute('pg-page');
        if (!p) return;
        triggerPageRequest(bar, p);
    });

    // 跳转输入框回车
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var input = e.target;
        if (!input.classList || !input.classList.contains('bny-pagination-input')) return;
        e.preventDefault();
        var bar = input.closest && input.closest('.bny-pagination');
        if (!bar) return;
        var totalPages = parseInt(bar.getAttribute('pg-total-pages'), 10) || 1;
        var p = parseInt(input.value, 10);
        if (isNaN(p) || p < 1) p = 1;
        if (p > totalPages) p = totalPages;
        triggerPageRequest(bar, String(p));
    });
}

/**
 * 触发分页请求：携带 page 参数发起 htmx.ajax
 * @param {HTMLElement} bar 分页条外层 div
 * @param {string} page 目标页码
 */
function triggerPageRequest(bar, page) {
    // 通过容器 id 反查原始配置 div（携带 hx-ext/hx-get/hx-target 等，作为请求源）
    // - 配置 div 是容器的兄弟节点，渲染后仍保留在 DOM 中
    // - 以配置 div 为 source，htmx 才能找到 bny-pagination 扩展并调用 transformResponse
    //   （bar 本身不在 hx-ext 作用域内，直接以 bar 为 source 会导致 transformResponse 不执行）
    var container = bar.parentElement;
    var configDiv = null;
    if (container && container.id) {
        configDiv = document.querySelector('[hx-ext~="bny-pagination"][hx-target="#' + container.id + '"]');
    }
    var src = configDiv || bar;
    var url = src.getAttribute('hx-get');
    if (!url) return;
    var targetSel = src.getAttribute('hx-target');
    var swapStyle = src.getAttribute('hx-swap') || 'innerHTML';
    var paramName = src.getAttribute('pg-page-param') || 'page';
    var vals = {};
    vals[paramName] = page;
    // 同时保留原有 hx-vals
    var existingVals = src.getAttribute('hx-vals');
    if (existingVals) {
        try { Object.assign(vals, JSON.parse(existingVals)); } catch (_) { }
    }
    var target = targetSel ? document.querySelector(targetSel) : src;
    if (targetSel && !target) target = src;
    htmx.ajax('GET', url, {
        source: src,
        target: target,
        swap: swapStyle,
        values: vals
    });
}
