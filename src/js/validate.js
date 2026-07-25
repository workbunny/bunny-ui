/**
 * bny-validate — 表单校验扩展
 *
 * 设计：
 * - 基于 htmx 的校验事件链，与 htmx:validation:validate / htmx:invalidatedValue 配合
 * - 同时支持 HTML5 原生约束（required/pattern/minlength/min/max/type）和自定义 data-rules
 * - 校验失败：显示错误信息，阻止请求；通过：清除错误
 * - 错误信息元素自动注入到 .form-item 末尾，类名 .bny-form-error
 *
 * 用法：
 *   <form hx-ext="bny-validate" hx-post="/api/save">
 *     <div class="form-item">
 *       <label>用户名</label>
 *       <input name="user" required data-msg-required="请输入用户名"
 *              data-rules="min:3,max:20" data-msg="用户名长度3-20">
 *     </div>
 *     <div class="form-item">
 *       <label>邮箱</label>
 *       <input name="email" type="email" required data-msg-required="邮箱必填">
 *     </div>
 *     <button class="bny-btn">提交</button>
 *   </form>
 */
htmx.defineExtension('bny-validate', {

    onEvent: function (name, evt) {

        // htmx 初始化节点后：为表单注册 submit 拦截 + 字段实时校验
        if (name === 'htmx:afterProcessNode') {
            if (!bny.hasExtName(evt.target, 'bny-validate')) return false;
            var form = evt.target;
            if (form._bnyValidateInit) return false;
            form._bnyValidateInit = true;

            // 禁用浏览器原生校验，由 bny-validate 完全接管（否则 required 字段空值时
            // 浏览器原生校验会阻止 submit 事件，导致自定义 data-msg 不显示）
            form.setAttribute('novalidate', '');

            // 关键：在 capture 阶段拦截 submit，确保先于 htmx / 浏览器原生执行
            // - 校验失败：preventDefault + stopImmediatePropagation，阻止 htmx 发请求与原生提交
            // - 校验通过 + 有 hx-post/hx-get：放行，由 htmx 接管提交
            // - 校验通过 + 无 htmx 提交（纯演示 form）：阻止默认刷新，给出通过提示
            form.addEventListener('submit', function (e) {
                var ok = validateForm(form);
                if (!ok) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    return false;
                }
                var hasHx = form.getAttribute('hx-post') || form.getAttribute('hx-get') ||
                    form.getAttribute('hx-put') || form.getAttribute('hx-patch') || form.getAttribute('hx-delete');
                if (!hasHx) {
                    // 在 SPA 上下文中，放行让 SPA 接管导航（不 preventDefault）
                    if (form.closest('[hx-ext~="bny-spa"]')) return;
                    e.preventDefault();
                    if (typeof bny !== 'undefined' && bny.alert) {
                        bny.alert('校验通过');
                    }
                }
            }, true); // capture 阶段

            // 为每个控件绑定 blur 实时校验
            var fields = form.querySelectorAll('input, textarea, select');
            Array.prototype.forEach.call(fields, function (field) {
                if (field._bnyValidateBound) return;
                field._bnyValidateBound = true;
                field.addEventListener('blur', function () {
                    validateField(field);
                });
                // 输入时清除错误提示（不立即校验，避免打扰）
                field.addEventListener('input', function () {
                    if (field.getAttribute('aria-invalid') === 'true') {
                        clearError(field);
                    }
                });
            });
            return false;
        }

        return true;
    }
});

/**
 * 校验单个字段
 * @param {HTMLElement} field input/textarea/select
 * @returns {boolean}
 */
function validateField(field) {
    var error = getFieldError(field);
    if (error) {
        showError(field, error);
        return false;
    }
    clearError(field);
    return true;
}

/**
 * 校验整个表单
 * @param {HTMLElement} form
 * @returns {boolean}
 */
function validateForm(form) {
    var fields = form.querySelectorAll('input, textarea, select');
    var allOk = true;
    var firstInvalid = null;
    Array.prototype.forEach.call(fields, function (field) {
        // 跳过 disabled / 无 name 的字段
        if (field.disabled || !field.name) return;
        var ok = validateField(field);
        if (!ok && !firstInvalid) {
            firstInvalid = field;
            allOk = false;
        }
    });
    if (firstInvalid) {
        // 聚焦到第一个错误字段，便于用户立即修正
        try { firstInvalid.focus(); } catch (_) { }
    }
    return allOk;
}

/**
 * 获取字段的错误信息（若有）
 * 优先级：HTML5 原生 validty > 自定义 data-rules
 * @param {HTMLElement} field
 * @returns {string|null}
 */
function getFieldError(field) {
    // 1) HTML5 原生约束
    // 对于 radio/checkbox，validity 在组内任一元素上即可判断
    if (typeof field.willValidate !== 'undefined' && field.checkValidity) {
        if (!field.checkValidity()) {
            // 自定义消息优先
            var v = field.validity;
            if (v.valueMissing) {
                return field.getAttribute('data-msg-required') ||
                    field.getAttribute('data-msg') ||
                    '该项为必填';
            }
            if (v.typeMismatch) {
                return field.getAttribute('data-msg-type') ||
                    field.getAttribute('data-msg') ||
                    '格式不正确';
            }
            if (v.patternMismatch) {
                return field.getAttribute('data-msg-pattern') ||
                    field.getAttribute('data-msg') ||
                    '格式不符合要求';
            }
            if (v.tooShort) {
                return field.getAttribute('data-msg-min') ||
                    field.getAttribute('data-msg') ||
                    '长度不能少于 ' + field.getAttribute('minlength') + ' 个字符';
            }
            if (v.tooLong) {
                return field.getAttribute('data-msg-max') ||
                    field.getAttribute('data-msg') ||
                    '长度不能超过 ' + field.getAttribute('maxlength') + ' 个字符';
            }
            if (v.rangeUnderflow) {
                return field.getAttribute('data-msg-min') ||
                    field.getAttribute('data-msg') ||
                    '值不能小于 ' + field.getAttribute('min');
            }
            if (v.rangeOverflow) {
                return field.getAttribute('data-msg-max') ||
                    field.getAttribute('data-msg') ||
                    '值不能大于 ' + field.getAttribute('max');
            }
            return field.getAttribute('data-msg') || field.validationMessage || '校验未通过';
        }
    }

    // 2) 自定义 data-rules="min:3,max:20,regexp:^[a-z]+$"
    var rules = field.getAttribute('data-rules');
    if (!rules) return null;
    var val = (field.value || '').trim();
    // required 在原生层已处理，这里只处理空值跳过
    if (!val) return null;

    var ruleList = rules.split(',');
    var i;
    for (i = 0; i < ruleList.length; i++) {
        var pair = ruleList[i].split(':');
        var key = (pair[0] || '').trim();
        var arg = pair.slice(1).join(':').trim();
        var err = null;
        switch (key) {
            case 'min':
                if (val.length < parseInt(arg, 10)) {
                    err = field.getAttribute('data-msg-min') ||
                        field.getAttribute('data-msg') ||
                        '长度不能少于 ' + arg + ' 个字符';
                }
                break;
            case 'max':
                if (val.length > parseInt(arg, 10)) {
                    err = field.getAttribute('data-msg-max') ||
                        field.getAttribute('data-msg') ||
                        '长度不能超过 ' + arg + ' 个字符';
                }
                break;
            case 'min-val':
                if (parseFloat(val) < parseFloat(arg)) {
                    err = field.getAttribute('data-msg-min') ||
                        field.getAttribute('data-msg') ||
                        '值不能小于 ' + arg;
                }
                break;
            case 'max-val':
                if (parseFloat(val) > parseFloat(arg)) {
                    err = field.getAttribute('data-msg-max') ||
                        field.getAttribute('data-msg') ||
                        '值不能大于 ' + arg;
                }
                break;
            case 'regexp':
                try {
                    var re = new RegExp(arg);
                    if (!re.test(val)) {
                        err = field.getAttribute('data-msg-pattern') ||
                            field.getAttribute('data-msg') ||
                            '格式不符合要求';
                    }
                } catch (_) { /* 正则无效则忽略 */ }
                break;
            case 'equals':
                // 与另一字段值相等
                var other = document.querySelector('[name="' + arg + '"]');
                if (other && val !== other.value) {
                    err = field.getAttribute('data-msg-equals') ||
                        field.getAttribute('data-msg') ||
                        '两次输入不一致';
                }
                break;
        }
        if (err) return err;
    }
    return null;
}

/**
 * 显示字段错误信息
 * @param {HTMLElement} field
 * @param {string} msg
 */
function showError(field, msg) {
    field.setAttribute('aria-invalid', 'true');
    field.classList.add('bny-input-error');
    // 找到所属 .form-item 容器
    var item = field.closest('.form-item');
    if (!item) {
        // 无容器时，在 field 后插入错误信息
        var next = field.nextElementSibling;
        if (!next || !next.classList.contains('bny-form-error')) {
            var err1 = document.createElement('div');
            err1.className = 'bny-form-error';
            err1.textContent = msg;
            field.parentNode.insertBefore(err1, field.nextSibling);
        } else {
            next.textContent = msg;
        }
        return;
    }
    var errEl = item.querySelector('.bny-form-error');
    if (!errEl) {
        errEl = document.createElement('div');
        errEl.className = 'bny-form-error';
        item.appendChild(errEl);
    }
    errEl.textContent = msg;
}

/**
 * 清除字段错误信息
 * @param {HTMLElement} field
 */
function clearError(field) {
    field.removeAttribute('aria-invalid');
    field.classList.remove('bny-input-error');
    var item = field.closest('.form-item');
    if (item) {
        var errEl = item.querySelector('.bny-form-error');
        if (errEl) errEl.remove();
    } else {
        var next = field.nextElementSibling;
        if (next && next.classList.contains('bny-form-error')) {
            next.remove();
        }
    }
}
