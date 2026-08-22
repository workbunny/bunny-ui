/**
 * bny-skeleton — 骨架屏组件（自定义草图 + 自动克隆）
 *
 * 设计：
 * - 基于 htmx 的 afterProcessNode，属性骨架容器声明式生成
 * - 与 hx-indicator 配合：容器默认隐藏，作为 indicator 收到 .htmx-request 时显示，
 *   请求结束/内容交换后自动隐藏，与 htmx 加载机制零耦合联动
 * - 两种能力：
 *   1) skeleton-sketch="circle x3, text x2, title"  自定义草图 DSL，按声明生成骨架块
 *   2) skeleton-clone="#template"                   自动克隆真实目标结构并骨架化
 *
 * 用法（自定义草图）：
 *   <div hx-ext="bny-skeleton"
 *        hx-indicator="this"
 *        skeleton-sketch="avatar x1, title x1, text x3 short">
 *   </div>
 *
 * 用法（自动克隆：请求期间在目标区显示真实结构的骨架）：
 *   <form hx-ext="bny-skeleton" hx-post="/api/list"
 *         hx-target="#list" hx-indicator="#skel-list">
 *     <div id="skel-list" hx-ext="bny-skeleton" skeleton-clone="#list-template"></div>
 *     <div id="list"></div>
 *   </form>
 *   <div id="list-template" hidden>
 *     <div class="user-row"><img src="../img/avatar.png"><span>显示名</span><em>副标题</em></div>
 *   </div>
 *
 * 草图 DSL 规则：
 *   条目以逗号分隔；`type [xN] [short] [:width]`
 *   - type：circle | avatar | title | text | image | button | line
 *   - xN：生成 N 个；short：仅 text/line 有效，收窄为 60%
 *   - :width：指定宽度（px）；circle 宽高相等
 *   - 嵌套组合：`name:{ sub-item, ... }` 生成带 .bny-skeleton-sketch-<name> 的容器
 */
htmx.defineExtension('bny-skeleton', {

    onEvent: function (name, evt) {
        if (name !== 'htmx:afterProcessNode') return true;
        var elt = evt.target;
        if (!bny.hasExtName(elt, 'bny-skeleton')) return false;
        if (elt._bnySkeletonInit) return false;
        elt._bnySkeletonInit = true;

        var sketch = elt.getAttribute('skeleton-sketch');
        var clone = elt.getAttribute('skeleton-clone');
        if (sketch) {
            buildSketch(elt, sketch);
        } else if (clone) {
            buildClone(elt, clone);
        }
        return false;
    }
});

/**
 * 顶层按逗号拆分，忽略 {} 内部（支持嵌套组合）
 * @param {string} str
 * @returns {string[]}
 */
function splitTop(str) {
    var parts = [], depth = 0, cur = '';
    for (var i = 0; i < str.length; i++) {
        var c = str[i];
        if (c === '{') depth++;
        else if (c === '}') depth--;
        if (c === ',' && depth === 0) { parts.push(cur); cur = ''; }
        else cur += c;
    }
    if (cur.trim()) parts.push(cur);
    return parts;
}

/**
 * 解析单个草图像条目并生成对应骨架块
 * @param {HTMLElement} parent
 * @param {string} expr 如 "text x3 short" / "avatar x1" / "circle:48"
 */
function addBlock(parent, expr) {
    var m = expr.match(/^([a-z-]+)(?:\s*x(\d+))?(?:\s+(short))?(?::([\d.]+))?\s*$/);
    if (!m) return;
    var type = m[1];
    var count = parseInt(m[2] || '1', 10);
    var short = !!m[3];
    var width = m[4];
    // type → 骨架类名映射
    var map = {
        text: ['bny-skeleton', 'bny-skeleton-text'],
        line: ['bny-skeleton', 'bny-skeleton-text'],
        title: ['bny-skeleton', 'bny-skeleton-title'],
        circle: ['bny-skeleton', 'bny-skeleton-circle'],
        avatar: ['bny-skeleton', 'bny-skeleton-avatar'],
        image: ['bny-skeleton', 'bny-skeleton-image'],
        button: ['bny-skeleton', 'bny-skeleton-button']
    };
    var cls = map[type] || map.text;
    for (var i = 0; i < count; i++) {
        var el = document.createElement('div');
        el.className = cls.join(' ');
        if (short) el.classList.add('short');
        if (width) {
            if (type === 'circle') { el.style.width = width + 'px'; el.style.height = width + 'px'; }
            else { el.style.width = width + 'px'; }
        } else if (type === 'circle') {
            // 未指定尺寸时给圆形默认 40px
            el.style.width = '40px'; el.style.height = '40px';
        }
        parent.appendChild(el);
    }
}

/**
 * 根据草图 DSL 生成骨架块
 * @param {HTMLElement} container
 * @param {string} spec
 */
function buildSketch(container, spec) {
    splitTop(spec).forEach(function (it) {
        it = it.trim();
        if (!it) return;
        var brace = it.indexOf('{');
        if (brace !== -1) {
            // 嵌套组合：name:{ ... }，净化非法字符（防止 “list:” 冒号漏进类名）
            var name = it.slice(0, brace).trim().replace(/[^a-zA-Z0-9_\-]/g, '') || 'group';
            var inner = it.slice(brace + 1, it.lastIndexOf('}'));
            var box = document.createElement('div');
            box.className = 'bny-skeleton-sketch-' + name;
            container.appendChild(box);
            buildSketch(box, inner);
        } else {
            addBlock(container, it);
        }
    });
}

/**
 * 自动克隆：读取真实目标结构并骨架化后放入容器
 * @param {HTMLElement} elt
 * @param {string} selector
 */
function buildClone(elt, selector) {
    var src = (typeof selector === 'string' && selector.trim()) ? document.querySelector(selector.trim()) : null;
    if (!src) {
        console.error('bny-skeleton: skeleton-clone 目标不存在: ' + selector);
        return;
    }
    // 克隆模板「内部子节点」而非模板容器本身（避免把模板的 hidden/尺寸带进骨架）
    elt.innerHTML = '';
    Array.prototype.forEach.call(src.children, function (child) {
        elt.appendChild(child.cloneNode(true));
    });
    skeletonizeNode(elt);
    // 标记容器：其内文本全部透明隐藏（保留文本占位避免布局塌陷）
    elt.classList.add('bny-skeleton-cloned');
}

/**
 * 骨架化克隆节点：给内容原子套骨架视觉
 * - img/video → 去资源源，套 image 块（保留声明尺寸）
 * - 圆形（avatar/icon/svg/圆角图）→ 套 circle 块
 * - 含直接文本的叶子 → 套骨架基类，文本保留但透明（占位不塌陷）
 * 容器节点保持结构，错误内容不阻断。
 * @param {HTMLElement} root
 */
function skeletonizeNode(root) {
    Array.prototype.forEach.call(root.querySelectorAll('*'), function (el) {
        if (/^(IMG|VIDEO|IFRAME|CANVAS)$/.test(el.tagName)) {
            var w = el.getAttribute('width'), h = el.getAttribute('height');
            // 用骨架块直接替换原元素（img 加载可能被打断残留破图，进行时替换最干净）
            var box = document.createElement('div');
            box.className = 'bny-skeleton bny-skeleton-image';
            box.setAttribute('aria-hidden', 'true');
            if (w) box.style.width = /px$/.test(w) ? w : w + 'px';
            if (h) box.style.height = /px$/.test(h) ? h : h + 'px';
            el.parentNode.replaceChild(box, el);
            return;
        }
        if (el.tagName === 'SVG' || isRounded(el) ||
            el.classList.contains('avatar') || el.classList.contains('icon')) {
            el.classList.add('bny-skeleton', 'bny-skeleton-circle');
            el.setAttribute('aria-hidden', 'true');
            return;
        }
        if (hasDirectText(el)) {
            el.classList.add('bny-skeleton');
            el.setAttribute('aria-hidden', 'true');
            return;
        }
        // 纯容器：保持结构，交给子节点处理
    });
}

/**
 * 元素是否含直接文本节点（非仅空白）
 * @param {HTMLElement} el
 * @returns {boolean}
 */
function hasDirectText(el) {
    return Array.prototype.some.call(el.childNodes, function (n) {
        return n.nodeType === 3 && n.nodeValue && n.nodeValue.trim() !== '';
    });
}

/**
 * 元素是否接近圆形（border-radius ≥ 50%）
 * @param {HTMLElement} el
 * @returns {boolean}
 */
function isRounded(el) {
    try {
        var r = getComputedStyle(el).borderRadius;
        if (!r) return false;
        var values = r.split(/[\s/]+/);
        for (var i = 0; i < values.length; i++) {
            var v = parseFloat(values[i]);
            if (!isNaN(v) && v >= 50 && /%/.test(values[i])) return true;
        }
    } catch (_) { }
    return false;
}