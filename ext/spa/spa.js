/**
 * bny-spa — 单页面应用扩展（外部扩展）
 *
 * 设计：
 * - HTMX 扩展，通过 hx-ext="bny-spa" 启用
 * - 拦截同源内部链接，无刷新导航
 * - 客户端提取：服务端返回完整 HTML，用 DOMParser 提取内容区域
 * - 浏览器前进/后退支持（pushState / popstate）
 * - 滚动位置记忆与恢复
 * - 自动处理新内容中的 htmx 属性（调用 htmx.process）
 * - 渐进增强：无 JS 时链接照常跳转
 *
 * 依赖：bunny.js（提供 htmx、bny 全局对象）
 * 引入方式：在 bunny.js 之后通过 <script src="spa.js"> 引入
 *
 * 用法：
 *   <link rel="stylesheet" href="spa.css">
 *   <script src="bunny.js"></script>
 *   <script src="spa.js"></script>
 *
 *   <body hx-ext="bny-spa">
 *     <header>固定头部</header>
 *     <main spa-view>
 *       <!-- 内容区域，只有这里会被交换 -->
 *     </main>
 *     <footer>固定页脚</footer>
 *   </body>
 *
 * 属性：
 *   spa-view         — 标记内容交换区域（必须）
 *   spa-skip    — 排除特定链接，不走 SPA 导航
 *   spa-mode     — 导航模式：'history'（默认，真实 URL）或 'hash'（hash 路由）
 *
 * 导航模式：
 *   history（默认）— 地址栏使用真实 URL（如 /doc/docs.html）
 *     适配任意后端，刷新时后端返回对应页面即可，无需特殊配置
 *   hash           — 地址栏使用 hash 路由（如 /doc/docs.html#/test/base.html）
 *     刷新时浏览器加载入口页（SPA 启动时的页面），通过 hash 自动导航到目标内容
 *     适用于无后端的纯前端部署（如 file:// 协议、静态托管）
 *   两种模式均为全局配置，行为统一，不针对特定页面
 */
(function () {
    'use strict';

    // 依赖检查
    if (typeof htmx === 'undefined') {
        console.error('[bny-spa] 需要 htmx 支持，请先引入 bunny.js');
        return;
    }
    if (typeof bny === 'undefined') {
        console.error('[bny-spa] 需要 bny 支持，请先引入 bunny.js');
        return;
    }

    htmx.defineExtension('bny-spa', {
        onEvent: function (name, evt) {
            if (name === 'htmx:afterProcessNode') {
                if (!bny.hasExtName(evt.target, 'bny-spa')) return false;
                init();
                return false;
            }
            return true;
        }
    });

    // ==================== 模块状态 ====================

    var _spaInited = false;
    var _scrollCache = {};   // url → {x, y}
    var _currentUrl = '';
    var _controller = null;  // AbortController，用于中止上一个请求
    var _readyCallbacks = []; // SPA 初始化完成回调队列
    var _mode = 'history';   // 导航模式：'history' 或 'hash'
    var _entryPath = '';     // hash 模式下的入口页路径（pathname + search）
    var _replaceNext = false; // 下一次 navigate 用 replaceState（初始自动导航用，避免重复历史记录）
    var _isPopstate = false;  // 正在处理 popstate（自动导航脚本据此跳过，避免后退陷阱）

    /** CSRF token 缓存，用于 SPA 导航时自动附加 X-CSRF-TOKEN 请求头 */
    var _csrfToken = '';
    /** 常见的 CSRF meta name 属性值（按优先级排列） */
    var CSRF_META_NAMES = ['csrf-token', 'csrf_token', 'x-csrf-token'];
    /** 常见的 CSRF hidden input name 属性值 */
    var CSRF_INPUT_NAMES = ['__token__', '_token', 'csrf_token', 'csrf-token'];

    /**
     * 生成 fetch 请求头（含 CSRF token 与 SPA 标记）
     * 集中管理所有 fetch 请求的 header，避免三处重复
     * @returns {object}
     */
    function getRequestHeaders() {
        var headers = {
            'HX-Request': 'true',
            'X-Spa-Request': 'true',
            'X-Spa-Layout': 'false'
        };
        if (_csrfToken) {
            headers['X-CSRF-TOKEN'] = _csrfToken;
        }
        return headers;
    }

    // ==================== 初始化 ====================

    /**
     * 初始化 SPA（只执行一次）
     */
    function init() {
        if (_spaInited) return;
        if (!findView()) return; // 没有找到视口，不初始化
        _spaInited = true;

        // 读取导航模式
        _mode = getSpaMode();
        // hash 模式下记录入口页路径（SPA 启动时的页面）
        _entryPath = location.pathname + location.search;

        // 读取页面初始 CSRF token（后续 SPA 导航自动携带）
        for (var i = 0; i < CSRF_META_NAMES.length; i++) {
            var csrfMeta = document.querySelector('meta[name="' + CSRF_META_NAMES[i] + '"]');
            if (csrfMeta && csrfMeta.getAttribute('content')) {
                _csrfToken = csrfMeta.getAttribute('content');
                break;
            }
        }

        // 初始 URL：直接用 location.href（可能带 hash）
        _currentUrl = location.href;
        // 记录初始状态，地址栏保持不变
        history.replaceState(
            { url: _currentUrl, title: document.title },
            document.title,
            _currentUrl
        );

        // 拦截链接点击
        document.addEventListener('click', onClick);

        // 拦截表单提交
        document.addEventListener('submit', onSubmit);

        // 前进/后退
        window.addEventListener('popstate', onPopState);

        // 页面卸载前保存滚动位置
        window.addEventListener('beforeunload', function () {
            _scrollCache[_currentUrl] = { x: window.scrollX, y: window.scrollY };
        });

        // 触发 ready 回调：通知外部 SPA 已就绪
        // 用于解决页面加载时序问题（如自动导航需等 SPA 初始化完成）
        var callbacks = _readyCallbacks;
        _readyCallbacks = [];
        callbacks.forEach(function (cb) {
            try { cb(); } catch (e) { console.error('[bny-spa] ready callback error:', e); }
        });
    }

    /**
     * 注册 SPA 就绪回调
     * - 已初始化：同步立即执行
     * - 未初始化：加入队列，init() 完成后执行
     * 用于页面需要在 SPA 就绪后执行的操作（如文档页自动导航）
     * @param {Function} cb
     */
    function onReady(cb) {
        if (_spaInited) {
            try { cb(); } catch (e) { console.error('[bny-spa] ready callback error:', e); }
        } else {
            _readyCallbacks.push(cb);
        }
    }

    // 暴露到 bny 对象，供外部调用
    if (typeof bny !== 'undefined') {
        bny.spaReady = onReady;
        // 标记下一次 navigate 用 replaceState（初始自动导航用，避免产生重复历史记录）
        bny.spaReplaceNext = function () { _replaceNext = true; };
        // 是否正在处理 popstate（自动导航脚本据此跳过，避免后退陷阱）
        bny.spaIsPopstate = function () { return _isPopstate; };
    }

    /**
     * 读取 SPA 导航模式
     * 优先级：body[spa-mode] > meta[name="spa-mode"] > 默认 'history'
     * @returns {string} 'history' 或 'hash'
     */
    function getSpaMode() {
        var body = document.body;
        if (body && body.hasAttribute('spa-mode')) {
            var m = body.getAttribute('spa-mode');
            if (m === 'hash' || m === 'history') return m;
        }
        var meta = document.querySelector('meta[name="spa-mode"]');
        if (meta) {
            var mv = meta.getAttribute('content');
            if (mv === 'hash' || mv === 'history') return mv;
        }
        return 'history';
    }

    /**
     * 计算 pushState/replaceState 用的地址栏 URL
     * - history 模式：直接用真实 URL（如 /doc/docs.html）
     * - hash 模式：入口页路径 + '#' + 目标路径（如 /doc/docs.html#/test/base.html）
     * @param {string} fetchUrl 实际内容 URL（用于 fetch 请求）
     * @returns {string} 地址栏 URL
     */
    function getHistoryUrl(fetchUrl) {
        if (_mode !== 'hash') return fetchUrl;
        try {
            var u = new URL(fetchUrl, location.href);
            return _entryPath + '#' + u.pathname + u.search;
        } catch (_) {
            return _entryPath + '#' + fetchUrl;
        }
    }

    /**
     * 从当前 location 提取实际内容 URL（getHistoryUrl 的逆操作）
     * - history 模式：直接返回 location.href
     * - hash 模式：从 hash 提取路径，结合 origin 转为完整 URL
     * @returns {string}
     */
    function getUrlFromLocation() {
        if (_mode === 'hash') {
            if (location.hash && location.hash.length > 1) {
                var hashPath = location.hash.substring(1);
                if (hashPath.charAt(0) === '/') {
                    return location.origin + hashPath;
                }
            }
        }
        return location.href;
    }

    /**
     * 查找 SPA 视口元素
     * 支持 spa-view 属性 或 id="spa-view"
     * @returns {HTMLElement|null}
     */
    function findView() {
        return document.querySelector('[spa-view]') ||
               document.getElementById('spa-view');
    }

    /**
     * 计算视口在视图树中的路径（数组坐标）
     *
     * 路径定义：
     * - 根级视口（最近祖先 [spa-view] 为 null）按文档顺序编号为 [0]、[1]…
     * - 父视口 [0] 内的第一个直接子视口为 [0, 0]，第二个为 [0, 1]
     * - 直接子视口定义：视口 V 的最近祖先 [spa-view] === P
     *
     * @param {HTMLElement} view 目标视口元素
     * @returns {number[]} 路径数组，如 [0]、[0, 1]、[0, 0, 0]
     */
    function getViewPath(view) {
        var path = [];
        var cur = view;
        while (cur) {
            var parentView = cur.parentElement.closest('[spa-view]');
            // 收集所有同级视口（最近祖先 [spa-view] 相同的视口）
            var allViews = Array.prototype.slice.call(document.querySelectorAll('[spa-view]'));
            var siblings = allViews.filter(function (v) {
                return v.parentElement.closest('[spa-view]') === parentView;
            });
            var idx = siblings.indexOf(cur);
            if (idx === -1) break;
            path.unshift(idx);
            cur = parentView;
        }
        return path;
    }

    /**
     * 按路径在指定文档中定位视口元素
     *
     * 算法：
     * - path[0] 选取第 N 个根级视口（最近祖先 [spa-view] 为 null 的视口）
     * - 之后每一段在当前视口的直接子视口中按索引选取
     * - 任一段越界返回 null
     *
     * @param {Document} doc 响应文档或当前 document
     * @param {number[]} path 视口路径
     * @returns {HTMLElement|null}
     */
    function findViewByPath(doc, path) {
        if (!path || !path.length) return null;
        // 根级视口：所有最近祖先 [spa-view] 为 null 的视口
        var rootViews = Array.prototype.slice.call(doc.querySelectorAll('[spa-view]')).filter(function (v) {
            return v.parentElement.closest('[spa-view]') === null;
        });
        var cur = rootViews[path[0]];
        if (!cur) return null;
        for (var i = 1; i < path.length; i++) {
            // cur 的直接子视口
            var children = Array.prototype.slice.call(cur.querySelectorAll('[spa-view]')).filter(function (v) {
                return v.parentElement.closest('[spa-view]') === cur;
            });
            cur = children[path[i]];
            if (!cur) return null;
        }
        return cur;
    }

    // ==================== 事件拦截 ====================

    /**
     * 链接点击处理
     * 拦截同源内部链接，阻止默认跳转，改为 SPA 导航
     */
    function onClick(e) {
        // 忽略非主键点击和修饰键（新标签页等）
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        // 忽略已阻止默认行为的
        if (e.defaultPrevented) return;

        var link = e.target.closest('a');
        if (!link) return;

        var href = link.getAttribute('href');
        if (!href || href === '#' || href.charAt(0) === '#') return;
        if (href.startsWith('javascript:')) return;
        if (href.startsWith('mailto:')) return;
        if (href.startsWith('tel:')) return;

        // spa-skip 排除
        if (link.hasAttribute('spa-skip')) return;

        // target=_blank 等排除
        if (link.target && link.target !== '_self') return;

        // 同源检查
        var url;
        try {
            url = new URL(link.href, location.href);
        } catch (_) {
            return;
        }
        if (url.origin !== location.origin) return;

        e.preventDefault();
        // 计算目标视图路径
        // 优先使用 spa-view-target 属性指定的目标视口
        var viewPath;
        var targetSel = link.getAttribute('spa-view-target');
        if (targetSel) {
            var targetView = document.querySelector(targetSel);
            viewPath = targetView ? getViewPath(targetView) : [0];
        } else {
            var ancestorView = link.closest('[spa-view]');
            viewPath = ancestorView ? getViewPath(ancestorView) : [0];
        }
        navigate(url.href, viewPath);
    }

    /**
     * 表单提交处理
     * GET 表单序列化到 URL，POST 表单通过 fetch 提交
     */
    function onSubmit(e) {
        if (e.defaultPrevented) return;
        var form = e.target;
        if (!(form instanceof HTMLFormElement)) return;

        // 有 htmx 属性的表单交给 htmx 处理
        if (form.hasAttribute('hx-get') || form.hasAttribute('hx-post')) return;
        if (form.hasAttribute('spa-skip')) return;

        var action = form.getAttribute('action') || location.href;
        var method = (form.getAttribute('method') || 'get').toUpperCase();

        // 同源检查
        var url;
        try {
            url = new URL(action, location.href);
        } catch (_) {
            return;
        }
        if (url.origin !== location.origin) return;

        e.preventDefault();

        var ancestorView = form.closest('[spa-view]');
        var viewPath = ancestorView ? getViewPath(ancestorView) : [0];

        if (method === 'GET') {
            // GET 表单：序列化到 URL 查询串
            var params = new URLSearchParams(new FormData(form)).toString();
            var target = url.pathname + (params ? '?' + params : '') + url.hash;
            navigate(target, viewPath);
        } else {
            // POST 表单
            navigatePost(url.href, new FormData(form), viewPath);
        }
    }

    // ==================== 导航核心 ====================

    /**
     * 导航到 URL（GET）
     * @param {string} url 目标 URL
     * @param {number[]} [viewPath] 目标视口路径，默认 [0]
     */
    function navigate(url, viewPath) {
        viewPath = viewPath || [0];
        // 捕获并重置 replaceNext 标志（初始自动导航用 replaceState 避免重复历史记录）
        var useReplace = _replaceNext;
        _replaceNext = false;
        // 解析 hash（用于导航后滚动到锚点）
        var urlObj = new URL(url, location.href);
        var hash = urlObj.hash;

        // 相同 URL（忽略 hash）只滚动
        if (urlObj.pathname + urlObj.search === new URL(_currentUrl, location.href).pathname + new URL(_currentUrl, location.href).search) {
            if (hash) {
                var target = document.querySelector(hash);
                if (target) target.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            return;
        }

        // 中止上一个请求
        if (_controller) _controller.abort();

        // 保存当前滚动位置
        _scrollCache[_currentUrl] = { x: window.scrollX, y: window.scrollY };

        _currentUrl = url;
        showProgress();

        _controller = new AbortController();

        fetch(url, {
            headers: getRequestHeaders(),
            signal: _controller.signal,
            redirect: 'follow'
        })
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            // 处理重定向：使用最终 URL
            _currentUrl = res.url;
            return res.text();
        })
        .then(function (html) {
            // 捕获本次 fetch 的最终 URL；swapContent 可能触发嵌套导航（如自动导航脚本
            // 调用 navigate），嵌套导航会修改 _currentUrl，此处需用捕获值判断
            var fetchUrl = _currentUrl;
            swapContent(html, url, viewPath);
            // 若 swapContent 触发了嵌套导航，_currentUrl 已变，
            // 嵌套导航会自行更新历史和滚动，此处跳过避免重复/错误的历史记录
            if (_currentUrl !== fetchUrl) return;
            // 更新浏览器历史
            // history 模式：地址栏为真实 URL
            // hash 模式：地址栏为 入口页路径 + '#' + 目标路径
            // 初始自动导航用 replaceState，避免入口页与内容页产生两条相同历史记录
            history[useReplace ? 'replaceState' : 'pushState'](
                { url: _currentUrl, title: document.title, viewPath: viewPath },
                document.title,
                getHistoryUrl(_currentUrl)
            );
            // 滚动行为：有 hash 滚到锚点，否则回到顶部
            if (hash) {
                var target = document.querySelector(hash);
                if (target) {
                    target.scrollIntoView();
                    return;
                }
            }
            window.scrollTo(0, 0);
        })
        .catch(function (err) {
            if (err.name === 'AbortError') return;
            // 出错回退到普通跳转
            location.href = url;
        })
        .finally(function () {
            hideProgress();
            _controller = null;
        });
    }

    /**
     * POST 导航
     * @param {string} url 目标 URL
     * @param {FormData} formData 表单数据
     * @param {number[]} [viewPath] 目标视口路径，默认 [0]
     */
    function navigatePost(url, formData, viewPath) {
        viewPath = viewPath || [0];
        var useReplace = _replaceNext;
        _replaceNext = false;
        if (_controller) _controller.abort();

        _scrollCache[_currentUrl] = { x: window.scrollX, y: window.scrollY };

        showProgress();

        _controller = new AbortController();

        fetch(url, {
            method: 'POST',
            body: formData,
            headers: getRequestHeaders(),
            signal: _controller.signal,
            redirect: 'follow'
        })
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            _currentUrl = res.url;
            return res.text();
        })
        .then(function (html) {
            var fetchUrl = _currentUrl;
            swapContent(html, url, viewPath);
            // 嵌套导航已自行更新历史，跳过避免重复
            if (_currentUrl !== fetchUrl) return;
            // POST 后通常是 PRG 重定向，用 pushState 更新 URL
            history[useReplace ? 'replaceState' : 'pushState'](
                { url: _currentUrl, title: document.title, viewPath: viewPath },
                document.title,
                getHistoryUrl(_currentUrl)
            );
            window.scrollTo(0, 0);
        })
        .catch(function (err) {
            if (err.name === 'AbortError') return;
            // POST 回退失败：整页跳转
            location.href = url;
        })
        .finally(function () {
            hideProgress();
            _controller = null;
        });
    }

    /**
     * 交换内容：从响应 HTML 中提取 head 和 body，更新到当前页面
     *
     * 支持两种服务端响应模式：
     * 1. 精简模式（推荐）：服务端返回 <html><head>标题/meta</head><body>内容</body></html>
     *    - 从 head 更新 title、keywords、description
     *    - 用 body 内容替换视口
     * 2. 完整模式：服务端返回带布局的完整页面
     *    - 从中提取 [spa-view] 区域
     *    - 同步 head 中的 title、keywords、description
     *
     * 视口嵌套：按 viewPath 在响应文档与当前文档中分别定位对应视口；
     * 找不到时回退到根视口 [0]，再找不到用 body / 第一个 [spa-view]
     *
     * @param {string} html 响应 HTML
     * @param {string} fallbackUrl 出错时的回退 URL
     * @param {number[]} [viewPath] 目标视口路径，默认 [0]
     */
    function swapContent(html, fallbackUrl, viewPath) {
        var doc = new DOMParser().parseFromString(html, 'text/html');

        // ===== 同步 head 信息（title / keywords / description） =====
        syncHead(doc);

        viewPath = viewPath || [0];

        // 在响应文档中按路径查找视口；找不到回退到根视口 [0]；再找不到用 body
        var newView = findViewByPath(doc, viewPath);
        if (!newView && viewPath.length > 1) {
            // 路径无效，回退到根视口
            newView = findViewByPath(doc, [0]);
        }
        var content;
        if (newView) {
            content = newView.innerHTML;
        } else if (doc.body) {
            content = doc.body.innerHTML;
        } else {
            location.href = fallbackUrl;
            return;
        }

        // 在当前文档中按路径查找交换目标；找不到回退到第一个 [spa-view]
        var view = findViewByPath(document, viewPath);
        if (!view && viewPath.length > 1) {
            view = findViewByPath(document, [0]);
        }
        if (!view) {
            view = document.querySelector('[spa-view]');
        }
        if (!view) {
            location.href = fallbackUrl;
            return;
        }

        // 交换内容
        view.innerHTML = content;

        // 重新执行内联脚本（innerHTML 不会执行 script）
        executeScripts(view);

        // 让 htmx 处理新内容中的 hx-* 属性
        if (typeof htmx !== 'undefined' && htmx.process) {
            htmx.process(view);
        }

        // 触发 htmx:load 事件，使通过 htmx.onLoad 注册的组件初始化回调执行
        // htmx.process() 只触发 htmx:afterProcessNode，不触发 htmx:load
        // htmx:load 仅在 htmx 自身的 ajax 加载（makeAjaxLoadTask）中触发
        // SPA 交换内容后需手动触发，否则 image/datepicker/tooltip 等组件不会重新初始化
        view.dispatchEvent(new CustomEvent('htmx:load', {
            bubbles: true,
            detail: { elt: view }
        }));

        // 触发自定义事件，便于外部监听
        view.dispatchEvent(new CustomEvent('bny:spa:loaded', {
            bubbles: true,
            detail: { url: _currentUrl, viewPath: viewPath }
        }));
    }

    /**
     * 同步 head：只更新变化的部分，未变化的不碰
     *
     * 策略：
     * - title：比较 textContent，不同才更新
     * - meta[name]：按 name 做 key，比较 content，不同才更新/新增（SEO：keywords/description/robots 等）
     * - meta[property]：按 property 做 key，同上（Open Graph：og:title/og:description/og:image 等）
     * - canonical：比较 href，不同才更新/新增
     * - JSON-LD（结构化数据）：全量比对，有变化才替换
     * - link/script/style：只处理带 bny-spa 标记的元素做 diff
     *   - 新的有但当前没有 → 添加
     *   - 当前有但新的没有 → 移除
     *   - 都有且相同 → 不动
     *   不带 bny-spa 的全局资源绝不碰
     *
     * @param {Document} doc 响应文档
     */
    function syncHead(doc) {
        // ===== title =====
        var newTitle = doc.querySelector('title');
        if (newTitle && newTitle.textContent !== document.title) {
            document.title = newTitle.textContent;
        }

        // ===== meta[name]（SEO：keywords/description/robots 等）=====
        syncMetaTags(doc, 'name');

        // ===== meta[property]（Open Graph：og:title/og:description/og:image 等）=====
        syncMetaTags(doc, 'property');

        // ===== canonical（SEO：规范 URL）=====
        syncCanonical(doc);

        // ===== JSON-LD 结构化数据（GEO：AI 搜索引擎依赖）=====
        syncJsonLd(doc);

        // ===== 带 bny-spa 标记的 link/script/style：做 diff =====
        diffHeadAssets(doc, 'link', 'href');
        diffHeadAssets(doc, 'script', 'src');
        diffHeadAssets(doc, 'style', null);

        // ===== CSRF token 同步 =====
        syncCsrfToken(doc);
    }

    /**
     * 同步 meta 标签（通用，支持 name 和 property 两种 key 属性）
     * @param {Document} doc
     * @param {string} keyAttr 'name' 或 'property'
     */
    function syncMetaTags(doc, keyAttr) {
        var newMetas = doc.querySelectorAll('meta[' + keyAttr + ']');
        Array.prototype.forEach.call(newMetas, function (newMeta) {
            var key = newMeta.getAttribute(keyAttr);
            if (!key) return;
            var newContent = newMeta.getAttribute('content') || '';
            var curMeta = document.querySelector('meta[' + keyAttr + '="' + key + '"]');
            if (curMeta) {
                // 有 → 内容不同才更新
                if (curMeta.getAttribute('content') !== newContent) {
                    curMeta.setAttribute('content', newContent);
                }
            } else {
                // 没有 → 新增
                var m = document.createElement('meta');
                m.setAttribute(keyAttr, key);
                m.setAttribute('content', newContent);
                document.head.appendChild(m);
            }
        });
    }

    /**
     * 同步 canonical link
     * @param {Document} doc
     */
    function syncCanonical(doc) {
        var newCanonical = doc.querySelector('link[rel="canonical"]');
        if (!newCanonical) return;
        var newHref = newCanonical.getAttribute('href');
        if (!newHref) return;
        var curCanonical = document.querySelector('link[rel="canonical"]');
        if (curCanonical) {
            if (curCanonical.getAttribute('href') !== newHref) {
                curCanonical.setAttribute('href', newHref);
            }
        } else {
            var c = document.createElement('link');
            c.setAttribute('rel', 'canonical');
            c.setAttribute('href', newHref);
            document.head.appendChild(c);
        }
    }

    /**
     * 同步 JSON-LD 结构化数据
     * 比较新旧集合，内容有变化时全量替换（JSON-LD 不执行 JS，移除/添加安全）
     * @param {Document} doc
     */
    function syncJsonLd(doc) {
        var newLds = doc.querySelectorAll('script[type="application/ld+json"]');
        var curLds = document.querySelectorAll('script[type="application/ld+json"]');

        // 数量相同且内容一致 → 不做任何操作
        if (newLds.length === curLds.length) {
            var same = true;
            for (var i = 0; i < newLds.length; i++) {
                if (newLds[i].textContent !== curLds[i].textContent) {
                    same = false;
                    break;
                }
            }
            if (same) return;
        }

        // 移除当前所有 JSON-LD
        Array.prototype.forEach.call(curLds, function (el) { el.remove(); });

        // 添加新的 JSON-LD
        Array.prototype.forEach.call(newLds, function (el) {
            var s = document.createElement('script');
            s.setAttribute('type', 'application/ld+json');
            s.textContent = el.textContent;
            document.head.appendChild(s);
        });
    }

    /**
     * 对 head 中带 bny-spa 标记的指定标签做 diff
     * @param {Document} doc 响应文档
     * @param {string} tagName 标签名（link/script/style）
     * @param {string|null} urlAttr URL 属性名（link→href, script→src, style→null 用 textContent 做 key）
     */
    function diffHeadAssets(doc, tagName, urlAttr) {
        // 收集新文档中带 bny-spa 的元素，以 key→element 映射
        var newMap = {};
        var newEls = doc.querySelectorAll('head ' + tagName + '[bny-spa]');
        Array.prototype.forEach.call(newEls, function (el) {
            var key = urlAttr ? el.getAttribute(urlAttr) : el.textContent;
            if (key) newMap[key] = el;
        });

        // 收集当前文档中带 bny-spa 的元素
        var curEls = document.querySelectorAll('head ' + tagName + '[bny-spa]');
        var curMap = {};
        Array.prototype.forEach.call(curEls, function (el) {
            var key = urlAttr ? el.getAttribute(urlAttr) : el.textContent;
            if (key) curMap[key] = el;
        });

        // 移除：当前有但新的没有
        Array.prototype.forEach.call(curEls, function (el) {
            var key = urlAttr ? el.getAttribute(urlAttr) : el.textContent;
            if (key && !newMap[key]) {
                el.remove();
            }
        });

        // 添加：新的有但当前没有
        Object.keys(newMap).forEach(function (key) {
            if (!curMap[key]) {
                var newEl = newMap[key];
                if (tagName === 'script') {
                    // script 需要重建才能执行
                    var s = document.createElement('script');
                    Array.prototype.forEach.call(newEl.attributes, function (attr) {
                        s.setAttribute(attr.name, attr.value);
                    });
                    s.textContent = newEl.textContent;
                    document.head.appendChild(s);
                } else {
                    document.head.appendChild(newEl.cloneNode(true));
                }
            }
        });
    }

    /**
     * 重新执行容器内的脚本
     * innerHTML 赋值不会执行 <script>，需要手动重建
     * @param {HTMLElement} container
     */
    function executeScripts(container) {
        var scripts = container.querySelectorAll('script');
        Array.prototype.forEach.call(scripts, function (oldScript) {
            var newScript = document.createElement('script');
            // 复制所有属性（src、type 等）
            Array.prototype.forEach.call(oldScript.attributes, function (attr) {
                newScript.setAttribute(attr.name, attr.value);
            });
            // 复制内容
            newScript.textContent = oldScript.textContent;
            // 替换
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    /**
     * 同步 CSRF token
     * 检测新文档中 meta CSRF token 变化，统一更新页面中所有 CSRF 相关元素
     * 覆盖 ThinkPHP（__token__）、Laravel（_token）等常见命名
     * @param {Document} doc 响应文档
     */
    function syncCsrfToken(doc) {
        var newToken = '';
        for (var i = 0; i < CSRF_META_NAMES.length; i++) {
            var meta = doc.querySelector('meta[name="' + CSRF_META_NAMES[i] + '"]');
            if (meta && meta.getAttribute('content')) {
                newToken = meta.getAttribute('content');
                break;
            }
        }
        if (!newToken || newToken === _csrfToken) return;

        _csrfToken = newToken;

        // 更新页面中所有 CSRF meta 标签
        for (var j = 0; j < CSRF_META_NAMES.length; j++) {
            var curMeta = document.querySelector('meta[name="' + CSRF_META_NAMES[j] + '"]');
            if (curMeta) curMeta.setAttribute('content', newToken);
        }

        // 更新页面中所有 CSRF hidden input
        for (var k = 0; k < CSRF_INPUT_NAMES.length; k++) {
            var inputs = document.querySelectorAll('input[name="' + CSRF_INPUT_NAMES[k] + '"]');
            Array.prototype.forEach.call(inputs, function (input) {
                input.value = newToken;
            });
        }
    }

    /**
     * popstate 处理（浏览器前进/后退）
     */
    function onPopState(e) {
        var url, viewPath;
        if (e.state && e.state.url) {
            url = e.state.url;
            viewPath = e.state.viewPath || [0];
        } else {
            // 没有 state（直接访问或刷新），从 location 提取实际内容 URL
            url = getUrlFromLocation();
            viewPath = [0];
        }
        if (url === _currentUrl) return;

        _currentUrl = url;
        // 标记正在处理 popstate：swapContent 中重新执行的自动导航脚本据此跳过，
        // 避免回退到框架页时自动导航再次触发，形成后退陷阱
        _isPopstate = true;

        if (_controller) _controller.abort();
        showProgress();

        _controller = new AbortController();

        fetch(url, {
            headers: getRequestHeaders(),
            signal: _controller.signal,
            redirect: 'follow'
        })
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            _currentUrl = res.url;
            return res.text();
        })
        .then(function (html) {
            swapContent(html, url, viewPath);
            // 恢复滚动位置
            var saved = _scrollCache[url];
            if (saved) {
                window.scrollTo(saved.x, saved.y);
            } else {
                window.scrollTo(0, 0);
            }
        })
        .catch(function (err) {
            if (err.name === 'AbortError') return;
            location.href = url;
        })
        .finally(function () {
            hideProgress();
            _controller = null;
            _isPopstate = false;
        });
    }

    // ==================== 加载进度条 ====================

    var _progressBar = null;
    var _progressTimer = null;

    /**
     * 显示顶部进度条
     */
    function showProgress() {
        if (!_progressBar) {
            _progressBar = document.createElement('div');
            _progressBar.className = 'bny-spa-progress';
            document.body.appendChild(_progressBar);
        }
        // 重置到起点
        _progressBar.style.transition = 'none';
        _progressBar.style.width = '0%';
        _progressBar.style.opacity = '1';
        _progressBar.classList.remove('done');

        // 强制重排后启动动画
        void _progressBar.offsetWidth;

        // 模拟进度：快速到 80%，留出空间表示"还在加载"
        _progressBar.style.transition = 'width 300ms ease-out, opacity 200ms ease';
        _progressBar.style.width = '80%';
    }

    /**
     * 隐藏进度条
     */
    function hideProgress() {
        if (!_progressBar) return;
        // 完成到 100%
        _progressBar.style.width = '100%';
        // 延迟淡出
        if (_progressTimer) clearTimeout(_progressTimer);
        _progressTimer = setTimeout(function () {
            _progressBar.style.opacity = '0';
            _progressBar.classList.add('done');
        }, 100);
    }
})();
