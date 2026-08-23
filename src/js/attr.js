/**
 * bny-attr — 声明式属性管理扩展（减少为追加/修改/删除属性而写 JS）
 *
 * 在带此扩展的元素上声明要做的操作，扩展按触发时机把变更应用到目标元素：
 * - 目标：默认扩展元素自身；也可用 attr-target="#id" 指定
 * - 触发：默认 click；可用 attr-trigger="change|mouseenter|..." 指定；
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
 *
 * 用法示例：
 *   <button hx-ext="bny-attr" attr-target="#dialog" attr-add="class:open">打开</button>
 *   <div hx-ext="bny-attr" attr-auto attr-set="aria-busy:false, data-state:ready"></div>
 */
htmx.defineExtension('bny-attr', {
    onEvent: function (name, evt) {
        if (name !== 'htmx:afterProcessNode') return true;
        const el = evt.target;
        if (!bny.hasExtName(el, 'bny-attr')) return true;
        if (el._bnyAttrInit) return true;
        el._bnyAttrInit = true;

        // 收集声明的操作属性（随项目规范：hx-ext="bny-attr"，属性用 attr-* 前缀）
        const opAttrs = ['attr-set', 'attr-add', 'attr-remove', 'attr-toggle', 'attr-rename', 'attr-replace']
            .filter(function (a) { return el.hasAttribute(a); });
        const hasJson = el.hasAttribute('attr-json');
        // 无任何操作且无 attr-json（数据驱动）时，无需绑定
        if (!opAttrs.length && !hasJson) return true;

        // 目标元素（默认自身）
        const target = resolveTarget(el);

        // 统一应用所有操作（应用后向目标派发 attr-applied，便于读取/联动）
        const applyAll = function () {
            opAttrs.forEach(function (opAttr) { applyOp(el, opAttr, target); });
            if (target && document.dispatchEvent) {
                target.dispatchEvent(new CustomEvent('attr-applied', { bubbles: true, detail: { by: el } }));
            }
        };

        // 初始化即应用一次
        if (el.hasAttribute('attr-auto')) {
            applyAll();
        }

        // 事件触发
        const trigger = el.getAttribute('attr-trigger') || 'click';
        el.addEventListener(trigger, function (e) {
            // 根据响应 JSON 管理属性：attr-json 指定路径；
            // + attr-value="目标属性" 把该路径的【值】写入目标属性；否则把该路径【对象的键值】批量写入目标
            const jsonPath = el.getAttribute('attr-json');
            if (jsonPath !== null && e && e.detail && e.detail.xhr) {
                applyJsonFromResponse(target, jsonPath, e.detail.xhr, el.getAttribute('attr-value'));
            }
            applyAll();
        });

        return true;
    }
});

/**
 * 解析目标元素：attr-target 选择器；缺省为扩展元素自身
 * @param {HTMLElement} el
 * @returns {HTMLElement}
 */
function resolveTarget(el) {
    const sel = el.getAttribute('attr-target');
    if (typeof sel === 'string' && sel.trim()) {
        const t = el.closest(sel) || document.querySelector(sel.trim());
        if (t) return t;
    }
    return el;
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
        try { target.setAttribute(valueAttr, val); } catch (_) { }
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
        try { target.setAttribute(k, v); } catch (_) { }
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
            target.setAttribute(key, value);
            break;
        case 'add': {
            // 多值批量增（值内空格分隔多个 token，各自不重复）
            if (!value) break;
            const addTokens = value.split(/\s+/).filter(Boolean);
            const addArr = target.hasAttribute(key) ? (target.getAttribute(key) || '').split(/\s+/) : [];
            addTokens.forEach(function (t) { if (t && addArr.indexOf(t) === -1) addArr.push(t); });
            target.setAttribute(key, addArr.join(' '));
            break;
        }
        case 'remove': {
            if (!value) {
                target.removeAttribute(key);
                break;
            }
            if (!target.hasAttribute(key)) break;
            const rmTokens = value.split(/\s+/).filter(Boolean);
            const remain = (target.getAttribute(key)).split(/\s+/).filter(function (t) { return rmTokens.indexOf(t) === -1; });
            if (remain.length) target.setAttribute(key, remain.join(' '));
            else target.removeAttribute(key);
            break;
        }
        case 'rename': {
            // 改属性名：old:new（值保留）
            if (key && value && target.hasAttribute(key)) {
                const saved = target.getAttribute(key);
                target.removeAttribute(key);
                target.setAttribute(value, saved);
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
            target.setAttribute(key, repArr.join(' '));
            break;
        }
        case 'toggle': {
            if (!target.hasAttribute(key)) {
                target.setAttribute(key, value);
            } else if (value) {
                const cur = target.getAttribute(key);
                if (cur.split(/\s+/).indexOf(value) > -1) {
                    const arr = cur.split(/\s+/).filter(function (t) { return t !== value; });
                    if (arr.length) target.setAttribute(key, arr.join(' '));
                    else target.removeAttribute(key);
                } else {
                    target.setAttribute(key, (cur ? cur + ' ' : '') + value);
                }
            } else {
                target.removeAttribute(key);
            }
            break;
        }
    }
}