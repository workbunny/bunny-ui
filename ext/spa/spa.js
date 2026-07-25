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
 *     <main bny-view>
 *       <!-- 内容区域，只有这里会被交换 -->
 *     </main>
 *     <footer>固定页脚</footer>
 *   </body>
 *
 * 属性：
 *   bny-view         — 标记内容交换区域（必须）
 *   bny-spa-skip    — 排除特定链接，不走 SPA 导航
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

    // ==================== 初始化 ====================

    /**
     * 初始化 SPA（只执行一次）
     */
    function init() {
        if (_spaInited) return;
        if (!findView()) return; // 没有找到视口，不初始化
        _spaInited = true;

        _currentUrl = location.href;
        // 记录初始状态，使 popstate 能正确回退到首页
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
    }

    /**
     * 查找 SPA 视口元素
     * 支持 bny-view 属性 或 id="bny-view"
     * @returns {HTMLElement|null}
     */
    function findView() {
        return document.querySelector('[bny-view]') ||
               document.getElementById('bny-view');
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

        // bny-spa-skip 排除
        if (link.hasAttribute('bny-spa-skip')) return;

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
        navigate(url.href);
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
        if (form.hasAttribute('bny-spa-skip')) return;

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

        if (method === 'GET') {
            // GET 表单：序列化到 URL 查询串
            var params = new URLSearchParams(new FormData(form)).toString();
            var target = url.pathname + (params ? '?' + params : '') + url.hash;
            navigate(target);
        } else {
            // POST 表单
            navigatePost(url.href, new FormData(form));
        }
    }

    // ==================== 导航核心 ====================

    /**
     * 导航到 URL（GET）
     * @param {string} url 目标 URL
     */
    function navigate(url) {
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
            headers: {
                'HX-Request': 'true',
                'X-Spa-Request': 'true'
            },
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
            swapContent(html, url);
            // 更新浏览器历史
            history.pushState(
                { url: _currentUrl, title: document.title },
                document.title,
                _currentUrl
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
     */
    function navigatePost(url, formData) {
        if (_controller) _controller.abort();

        _scrollCache[_currentUrl] = { x: window.scrollX, y: window.scrollY };

        showProgress();

        _controller = new AbortController();

        fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                'HX-Request': 'true',
                'X-Spa-Request': 'true'
            },
            signal: _controller.signal,
            redirect: 'follow'
        })
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            _currentUrl = res.url;
            return res.text();
        })
        .then(function (html) {
            swapContent(html, url);
            // POST 后通常是 PRG 重定向，用 pushState 更新 URL
            history.pushState(
                { url: _currentUrl, title: document.title },
                document.title,
                _currentUrl
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
     *    - 从中提取 [bny-view] 区域
     *    - 同步 head 中的 title、keywords、description
     *
     * @param {string} html 响应 HTML
     * @param {string} fallbackUrl 出错时的回退 URL
     */
    function swapContent(html, fallbackUrl) {
        var doc = new DOMParser().parseFromString(html, 'text/html');

        // ===== 同步 head 信息（title / keywords / description） =====
        syncHead(doc);

        var view = findView();
        if (!view) {
            location.href = fallbackUrl;
            return;
        }

        // 优先提取 bny-view（完整模式），否则用整个 body（精简模式）
        var newView = doc.querySelector('[bny-view]') || doc.getElementById('bny-view');
        var content;
        if (newView) {
            content = newView.innerHTML;
        } else if (doc.body) {
            content = doc.body.innerHTML;
        } else {
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

        // 触发自定义事件，便于外部监听
        view.dispatchEvent(new CustomEvent('bny:spa:loaded', {
            bubbles: true,
            detail: { url: _currentUrl }
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
     * popstate 处理（浏览器前进/后退）
     */
    function onPopState(e) {
        var url = (e.state && e.state.url) || location.href;
        if (url === _currentUrl) return;

        _currentUrl = url;

        if (_controller) _controller.abort();
        showProgress();

        _controller = new AbortController();

        fetch(url, {
            headers: {
                'HX-Request': 'true',
                'X-Spa-Request': 'true'
            },
            signal: _controller.signal,
            redirect: 'follow'
        })
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            _currentUrl = res.url;
            return res.text();
        })
        .then(function (html) {
            swapContent(html, url);
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
