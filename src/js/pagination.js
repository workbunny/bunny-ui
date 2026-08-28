/**
 * bny-pagination — 分页组件（独立分页条）
 *
 * 设计：
 * - HTMX 扩展，服务端返回 JSON（含 total）自动渲染分页条
 * - 与 htmx 集成：点击页码通过 hx-get 请求新数据
 * - 条渲染与事件委托由内置函数提供（bny.paginationBar / bny.setupPaginationDelegation），
 *   与 bny-table 的内置分页共用同一实现
 * - 静态 JSON 测试：从 xhr.responseURL 解析 page 参数，反映点击页码
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
 *   { "total": 100, "page": 1, "pageSize": 10 }
 *   （数据部分由其他扩展/swap 单独处理；带数据的分页表格直接用 bny-table 的内置分页）
 *
 * 配置属性：
 *   - pg-page-size：每页条数（默认 10）
 *   - pg-max-buttons：最多页码按钮数（默认 7）
 *   - pg-page-param：URL 分页参数名（默认 page）
 *   - pg-jumper="false"：隐藏跳转框
 *   - pg-total="false"：隐藏总数
 *   - pg-color / pg-model：主题色 / 简洁模式（回写到分页条）
 */
htmx.defineExtension('bny-pagination', {

    onEvent: function (name, evt) {

        // htmx 初始化节点后：注册全局事件委托（只注册一次）
        if (name === 'htmx:afterProcessNode') {
            if (!bny.hasExtName(evt.target, 'bny-pagination')) return false;
            bny.setupPaginationDelegation();
            return false;
        }

        return true;
    },

    // 响应转换：JSON（含 total）→ 分页条 HTML（替换响应内容，数据部分由其他扩展/swap 处理）
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
        var total = parseInt(data.total, 10);
        // 无总数：非分页响应，原样返回
        if (isNaN(total)) return text;

        var paramName = elt.getAttribute('pg-page-param') || 'page';
        var sizeParam = elt.getAttribute('pg-size-param') || 'pageSize';

        // 请求源可能不是主配置元素（如搜索输入框），pg-* 配置在主配置元素上时回退查找
        if (elt.getAttribute('pg-page-sizes') === null && elt.getAttribute('hx-target')) {
            try {
                var alt = document.querySelector('[hx-target="' + elt.getAttribute('hx-target') + '"][pg-page-sizes]');
                if (alt) elt = alt;
            } catch (_) { }
        }

        return bny.paginationBar({
            total: total,
            // 优先从 responseURL 解析 page/pageSize 参数（静态 JSON 测试数据也能反映点击的页码/条数）
            page: bny.parsePageParam(xhr.responseURL, paramName) || parseInt(data.page, 10) || 1,
            pageSize: bny.parsePageParam(xhr.responseURL, sizeParam)
                || parseInt(data.pageSize || data.size, 10)
                || elt.getAttribute('pg-page-size') || 10,
            paramName: paramName,
            sizeParam: sizeParam,
            sizes: bny.parsePageSizes(elt.getAttribute('pg-page-sizes')),
            // 携带当前查询串（剥掉 page/pageSize），翻页/切条数时回带，保持搜索与筛选条件
            query: bny.carryQuery(xhr.responseURL, [paramName, sizeParam]),
            maxButtons: elt.getAttribute('pg-max-buttons'),
            jumper: elt.getAttribute('pg-jumper') !== 'false',
            showTotal: elt.getAttribute('pg-total') !== 'false',
            carryAttrs: carryAttrsFrom(elt, ['pg-color', 'pg-model', 'data-max-buttons', 'data-jumper', 'data-total', 'data-page-size'])
        });
    }
});

/**
 * 把 elt 上的指定属性原样拼成 HTML 属性串（用于回写到渲染的分页条上，值转义）
 * @param {HTMLElement} elt
 * @param {Array<string>} names
 * @returns {string}
 */
function carryAttrsFrom(elt, names) {
    var s = '';
    names.forEach(function (n) {
        var v = elt.getAttribute(n);
        if (v !== null) {
            s += ' ' + n + '="' + bny.escapeChars(v) + '"';
        }
    });
    return s;
}
