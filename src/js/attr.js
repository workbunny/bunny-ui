/**
 * bny-attr — 声明式属性管理扩展（减少为追加/修改/删除属性而写 JS）
 *
 * 在带此扩展的元素上声明要做的操作，扩展按触发时机把变更应用到目标元素：
 * - 目标：默认扩展元素自身；用 hx-target="#id" 指定（与 htmx 命名一致），
 *         支持 htmx 选择器语法 "find x" / "closest x"；支持一对多：
 *         逗号分隔多目标或 "all x" 批量选取；每次应用时实时解析目标，
 *         动态插入/替换的节点也能找到
 *         （元素自身带请求属性时 hx-target 归 htmx 交换所有，须单个目标）
 * - 触发：默认 click；用 hx-trigger="change|mouseenter|..." 指定（与 htmx 命名一致），
 *         逗号分隔可多个，每个取首个词为事件名（忽略 changed/
 *         delay: 等修饰符），"load" = 初始化应用一次；也可填 htmx 事件名如 htmx:afterSwap
 * - 请求：元素自身携带 hx-get / hx-post 等请求属性时，请求完成后自动应用
 *         （含 attr-json 响应写入），无需再声明触发事件；hx-trigger 归 htmx 请求触发所有
 *         加 attr-auto 则在初始化即应用一次（不做事件绑定）
 * - 操作（DSL），多个键值用逗号分隔，每对 "name:value"：
 *     attr-set="name:value"      整体设置 attr 值（覆盖全值；适合单值属性）
 *     attr-add="name:value"      追加一个值（token 不重复）——多值属性增一个
 *     attr-remove="name:value"   仅移除该值（token 级）——多值属性删一个
 *     attr-remove="name"           移除整个属性（删名）
 *     attr-replace="name:old@new"  把值中的 old 替换为 new——多值属性改一个
 *     attr-rename="old:new"       改属性名（值保留）
 *     attr-toggle="name:value"   有则删、无则加（切换）
 *
 * 能力矩阵（多值属性按单个 token 操作，不整体覆盖）：
 *   · 属性名：增=attr-set(新key) · 改=attr-rename · 删=attr-remove("key") · 查=hasAttribute/getAttribute(业务)
 *   · 属性值：整体=attr-set · 单值 增=attr-add · 单值 删=attr-remove("k:v") · 单值 改=attr-replace · 查=getAttribute(业务)
 *
 * 安全（防注入）：写操作拒绝事件处理属性名（on*）与危险协议值（javascript:/vbscript:），
 *               attr 值若来自服务端/用户输入不会被执行任意脚本。
 * 表单控件：写 checkbox/radio 的 checked、input/textarea 的 value、option 的 selected 时
 *           同步 DOM property——用户交互过（浏览器 dirty 标志置位）后 attribute 变化
 *           不再反映到视觉，同步保证操作始终生效（如全选/反选）
 *
 * 用法示例：
 *   <button hx-ext="bny-attr" hx-target="#dialog" attr-add="class:open">打开</button>
 *   <div hx-ext="bny-attr" attr-auto attr-set="aria-busy:false, data-state:ready"></div>
 *   <div hx-ext="bny-attr" hx-get="/api/status" hx-swap="none" attr-json="data" hx-target="#box">…</div>
 */
htmx.defineExtension('bny-attr', {
    onEvent: function (name, evt) {
        // 元素自身请求完成：自动应用（含 attr-json 响应写入），无需声明触发事件
        if (name === 'htmx:afterRequest') {
            const req = evt.target;
            if (req && req._bnyAttrInit && evt.detail && evt.detail.elt === req && req._bnyAttrApply) {
                req._bnyAttrApply(evt.detail.xhr);
            }
            return true;
        }
        if (name !== 'htmx:afterProcessNode') return true;
        const el = evt.target;
        if (!bny.hasExtName(el, 'bny-attr')) return true;
        if (el._bnyAttrInit) return true;
        el._bnyAttrInit = true;

        // 收集声明的操作属性（随项目规范：hx-ext="bny-attr"，操作用 attr-* 前缀）
        const opAttrs = ['attr-set', 'attr-add', 'attr-remove', 'attr-toggle', 'attr-rename', 'attr-replace']
            .filter(function (a) { return el.hasAttribute(a); });
        const hasJson = el.hasAttribute('attr-json');
        // 无任何操作且无 attr-json（数据驱动）时，无需绑定
        if (!opAttrs.length && !hasJson) return true;

        // 统一应用所有操作：每次触发实时解析目标（动态节点也能找到）；
        // 目标可一对多（hx-target 逗号分隔多选择器 / all 前缀批量选取）；
        // 应用后向每个目标派发 attr-applied，便于读取/联动
        el._bnyAttrApply = function (xhr) {
            resolveTargets(el).forEach(function (target) {
                const jsonPath = el.getAttribute('attr-json');
                if (jsonPath !== null && xhr) {
                    applyJsonFromResponse(target, jsonPath, xhr, el.getAttribute('attr-value'));
                }
                opAttrs.forEach(function (opAttr) { applyOp(el, opAttr, target); });
                if (target && target.dispatchEvent) {
                    target.dispatchEvent(new CustomEvent('attr-applied', { bubbles: true, detail: { by: el } }));
                }
            });
        };

        // 初始化即应用一次
        if (el.hasAttribute('attr-auto')) {
            el._bnyAttrApply();
        }

        // 请求元素：hx-trigger 归 htmx 请求触发所有，应用挂在自身请求完成后（见上）
        const isRequester = ['hx-get', 'hx-post', 'hx-put', 'hx-delete', 'hx-patch']
            .some(function (a) { return el.hasAttribute(a); });
        if (isRequester) return true;

        // 触发：hx-trigger（与 htmx 命名一致），缺省 click。
        // 逗号分隔多个触发，每个取首个词为事件名（忽略 changed/delay: 等修饰符）；
        // "load" = 初始化应用一次
        const triggerAttr = el.getAttribute('hx-trigger');
        const specs = String(triggerAttr || 'click').split(',');
        const bound = {};
        specs.forEach(function (spec) {
            const ev = (spec || '').trim().split(/\s+/)[0];
            if (!ev || bound[ev]) return;
            bound[ev] = true;
            if (ev === 'load') {
                el._bnyAttrApply();
                return;
            }
            el.addEventListener(ev, function (e) {
                // htmx 事件（如 afterRequest/afterSwap 冒泡到此处）可携带 xhr，供 attr-json 使用
                el._bnyAttrApply(e && e.detail ? e.detail.xhr : undefined);
            });
        });

        return true;
    }
});

/**
 * 解析目标元素列表：hx-target 支持一对多——
 *   · 逗号分隔多个目标片段，逐个解析后按出现顺序去重合并
 *   · 每个片段支持 htmx 选择器语法 "find x" / "closest x"（相对扩展元素）
 *   · 新增 "all x" 前缀：document.querySelectorAll 批量选取（含动态节点）
 *   · 普通选择器：先匹配祖先再全局查找单个
 * 每次应用时调用，目标元素动态插入/替换后依然有效；缺省为扩展元素自身
 * 注意：元素自身带请求属性（hx-get/post…）时 hx-target 归 htmx 交换所有，须单个目标；
 *       一对多写法用于纯 attr 元素
 * @param {HTMLElement} el
 * @returns {HTMLElement[]}
 */
function resolveTargets(el) {
    const raw = el.getAttribute('hx-target');
    if (raw === null || !String(raw).trim()) return [el];
    const found = [];
    String(raw).split(',').forEach(function (spec) {
        spec = spec.trim();
        if (!spec) return;
        let nodes = [];
        try {
            if (spec.indexOf('find ') === 0) {
                const t = el.querySelector(spec.slice(5));
                if (t) nodes = [t];
            } else if (spec.indexOf('closest ') === 0) {
                const t = el.closest(spec.slice(8));
                if (t) nodes = [t];
            } else if (spec.indexOf('all ') === 0) {
                nodes = Array.prototype.slice.call(document.querySelectorAll(spec.slice(4)));
            } else {
                const t = el.closest(spec) || document.querySelector(spec);
                if (t) nodes = [t];
            }
        } catch (e) { nodes = []; }
        nodes.forEach(function (n) { if (n && found.indexOf(n) === -1) found.push(n); });
    });
    return found.length ? found : [el];
}

/**
 * 解析并应用单个操作属性（如 attr-set="aria-expanded:true, data-x:1"）
 * @param {HTMLElement} el
 * @param {string} opAttr
 * @param {HTMLElement} target
 */
function applyOp(el, opAttr, target) {
    const raw = el.getAttribute(opAttr);
    if (!raw || !target) return;
    const op = opAttr.replace('attr-', ''); // set / add / remove / toggle
    raw.split(',').forEach(function (pair) {
        pair = pair.trim();
        if (!pair) return;
        const idx = pair.indexOf(':');
        let k = pair, v = '';
        if (idx > -1) {
            k = pair.slice(0, idx).trim();
            v = pair.slice(idx + 1).trim();
        }
        if (!k) return;
        applyOne(target, op, k, v);
    });
}

/**
 * 处理响应 JSON 的属性写入
 * - attr-json 支持 "path:期望值" 条件触发：仅当 path 取值等于期望值时才应用
 * - 提供 valueAttr（attr-value 目标属性）：把路径取到的【值】写入该目标属性
 * - 否则要求路径解析结果为对象，把其键值批量写入目标
 * 均过注入防护（拒绝 on* 与 javascript:/vbscript:）
 * @param {HTMLElement} target
 * @param {string} attrJson attr-json 值，如 "data.code" 或 "data.code:1"（带条件）
 * @param {XMLHttpRequest} xhr
 * @param {string} valueAttr 可选的 attr-value 目标属性名
 */
function applyJsonFromResponse(target, attrJson, xhr, valueAttr) {
    if (!target || !xhr) return;
    let obj;
    try { obj = JSON.parse(xhr.responseText); } catch (_) { return; }

    // 解析 "path:期望值"
    const attrStr = String(attrJson);
    let path = attrStr, expected;
    const c = attrStr.indexOf(':');
    if (c > -1) {
        path = attrStr.slice(0, c).trim();
        expected = attrStr.slice(c + 1);
    }

    const src = (path && path.trim()) ? resolveJsonPath(obj, path.trim()) : obj;

    // 条件触发：期望值存在且不匹配则不应用
    if (expected !== undefined) {
        if (!valsEqual(src, expected)) return;
    }

    // 有 attr-value：把该字段的值写入目标属性
    if (valueAttr && String(valueAttr).trim()) {
        if (/^on/i.test(valueAttr)) { console.warn('[bny-attr] 已拦截 json 事件属性:', valueAttr); return; }
        const val = String(src == null ? '' : src);
        if (/^(javascript|vbscript):/i.test(val.trim())) { console.warn('[bny-attr] 已拦截 json 危险值:', val); return; }
        try { attrSet(target, valueAttr, val); } catch (_) { }
        return;
    }

    // 无 attr-value：要求 path 解析结果是对象，批量键值写入
    if (!src || typeof src !== 'object') {
        console.warn('[bny-attr] attr-json 指向非对象值，请配合 attr-value=目标属性 使用: ' + (path || ''));
        return;
    }
    Object.keys(src).forEach(function (k) {
        if (/^on/i.test(k)) { console.warn('[bny-attr] 已拦截 json 事件属性:', k); return; }
        const v = String(src[k]);
        if (/^(javascript|vbscript):/i.test(v.trim())) { console.warn('[bny-attr] 已拦截 json 危险值:', v); return; }
        try { attrSet(target, k, v); } catch (_) { }
    });
}

/**
 * 宽松相等：String 相等，或期望值是数字时数值相等
 * @param {*} a
 * @param {string} b
 * @returns {boolean}
 */
function valsEqual(a, b) {
    const bs = String(b);
    if (String(a) === bs) return true;
    if (/^-?\d+(\.\d+)?$/.test(bs) && Number(a) === Number(b)) return true;
    return false;
}

/**
 * 按点分路径从对象取值，如 data.user.name
 * @param {object} obj
 * @param {string} path
 * @returns {*}
 */
function resolveJsonPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return (o == null ? o : o[k]); }, obj);
}

/**
 * 表单控件 attribute → property 同步：
 * checkbox/radio 的 checked、input/textarea 的 value、option 的 selected 存在
 * 浏览器"dirty 标志"——用户交互过（点击/输入）后，content attribute 的变化
 * 不再反映到控件状态（视觉冻结），attr-* 操作看似失效。
 * 显式写 attribute 后同步 property，保证操作始终生效
 * @param {HTMLElement} target
 * @param {string} key 刚写入/移除的属性名
 */
function syncFormProp(target, key) {
    if (!target || !target.tagName) return;
    const tag = target.tagName;
    if (key === 'checked' && tag === 'INPUT' && (target.type === 'checkbox' || target.type === 'radio')) {
        target.checked = target.hasAttribute('checked');
    } else if (key === 'value' && (tag === 'INPUT' || tag === 'TEXTAREA')) {
        target.value = target.hasAttribute('value') ? target.getAttribute('value') : target.defaultValue;
    } else if (key === 'selected' && tag === 'OPTION') {
        target.selected = target.hasAttribute('selected');
    }
}

/** setAttribute + 表单 property 同步（bny-attr 内部统一入口） */
function attrSet(target, key, value) {
    target.setAttribute(key, value);
    syncFormProp(target, key);
}

/** removeAttribute + 表单 property 同步 */
function attrRemove(target, key) {
    target.removeAttribute(key);
    syncFormProp(target, key);
}

/**
 * 对目标应用单条操作（含注入防护）
 * - 拒绝事件处理属性名（onclick/onerror 等）与改名目标为 on*
 * - 拒绝危险协议值（javascript:/vbscript:）
 * @param {HTMLElement} target
 * @param {string} op set|add|remove|rename|toggle|replace
 * @param {string} key 属性名
 * @param {string} value 值
 */
function applyOne(target, op, key, value) {
    // 注入防护：事件处理属性名（on*），含 rename 的目标名
    const dangerousName = /^on/i.test(key) || (op === 'rename' && /^on/i.test(String(value || '')));
    if (dangerousName) {
        console.warn('[bny-attr] 已拦截事件处理属性名:', op === 'rename' ? value : key);
        return;
    }
    // 注入防护：危险协议值（javascript: / vbscript:）
    if (op !== 'remove' && value && /^(javascript|vbscript):/i.test(String(value).trim())) {
        console.warn('[bny-attr] 已拦截危险协议值:', value);
        return;
    }
    switch (op) {
        case 'set':
            attrSet(target, key, value);
            break;
        case 'add': {
            // 多值批量增（值内空格分隔多个 token，各自不重复）
            if (!value) break;
            const addTokens = value.split(/\s+/).filter(Boolean);
            const addArr = target.hasAttribute(key) ? (target.getAttribute(key) || '').split(/\s+/) : [];
            addTokens.forEach(function (t) { if (t && addArr.indexOf(t) === -1) addArr.push(t); });
            attrSet(target, key, addArr.join(' '));
            break;
        }
        case 'remove': {
            if (!value) {
                attrRemove(target, key);
                break;
            }
            if (!target.hasAttribute(key)) break;
            const rmTokens = value.split(/\s+/).filter(Boolean);
            const remain = (target.getAttribute(key)).split(/\s+/).filter(function (t) { return rmTokens.indexOf(t) === -1; });
            if (remain.length) attrSet(target, key, remain.join(' '));
            else attrRemove(target, key);
            break;
        }
        case 'rename': {
            // 改属性名：old:new（值保留）
            if (key && value && target.hasAttribute(key)) {
                const saved = target.getAttribute(key);
                attrRemove(target, key);
                attrSet(target, value, saved);
            }
            break;
        }
        case 'replace': {
            // 多值属性改（值内空格分隔多个 old@new，逐个替换，不碰其他值）
            if (!value || !target.hasAttribute(key)) break;
            const repArr = target.getAttribute(key).split(/\s+/);
            value.split(/\s+/).forEach(function (part) {
                if (!part) return;
                const at = part.indexOf('@');
                if (at > 0) {
                    const o = part.slice(0, at), n = part.slice(at + 1);
                    const i = repArr.indexOf(o);
                    if (i > -1) repArr[i] = n;
                }
            });
            attrSet(target, key, repArr.join(' '));
            break;
        }
        case 'toggle': {
            if (!target.hasAttribute(key)) {
                attrSet(target, key, value);
            } else if (value) {
                const cur = target.getAttribute(key);
                if (cur.split(/\s+/).indexOf(value) > -1) {
                    const arr = cur.split(/\s+/).filter(function (t) { return t !== value; });
                    if (arr.length) attrSet(target, key, arr.join(' '));
                    else attrRemove(target, key);
                } else {
                    attrSet(target, key, (cur ? cur + ' ' : '') + value);
                }
            } else {
                attrRemove(target, key);
            }
            break;
        }
    }
}