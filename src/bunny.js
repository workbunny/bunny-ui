/**
 * 自定义组件
 */
class Bunny extends HTMLElement {
    /**
     * 自定义元素的构造函数
     */
    constructor() {
        // 必须首先调用 super 方法
        super();
        // 创建一个 Shadow DOM
        this.attachShadow({ mode: "open" });
        // 渲染样式
        let sheet = new CSSStyleSheet();
        sheet.replaceSync(this.css());
        this.shadowRoot.adoptedStyleSheets = [sheet];
    }

    /**
     * 定义响应式属性
     * 
     * @param {Object} value - 组件状态数据
     * @returns {Proxy} - 响应式代理对象
     */
    state(value) {
        const then = this;
        return new Proxy(value, {
            get(target, key, rec) {
                const value = Reflect.get(target, key, rec);
                if (typeof value === 'object' && value !== null) {
                    return then.state(value);
                }
                return value;
            },
            set(target, key, val, rec) {
                Reflect.set(target, key, val, rec);
                then.updateComponent();
                return true;
            }
        })
    }

    /**
     * 执行组件更新（虚拟DOM对比）
     * 
     * @returns {void}
     */
    updateComponent() {
        const newTemplate = this.render();
        this.#_processTemplate(newTemplate);
    }

    /**
      * 处理模板字符串（包含事件绑定）
      * 
      * @param {string} template - 模板字符串
      * @returns {void}
      */
    #_processTemplate(template) {
        // 设置 DOM 内容
        this.shadowRoot.innerHTML = this.#tpl(template);
        // 事件绑定处理
        let eventHandlers = this.shadowRoot.querySelectorAll('[data-event]');
        eventHandlers.forEach((element) => {
            const data = element.getAttribute('data-event').split(",");
            element.addEventListener(data[0], (e) => {
                if (this[data[1]]) {
                    this[data[1]].call(this, e);
                }
            })
            // 移除临时属性
            element.removeAttribute('data-event');
        })
    }

    /**
     * 自定义元素添加至页面时调用
     * 
     * @returns {void}
     */
    connectedCallback() {
        this.updateComponent();
    }

    /**
     * 模板渲染
     * 
     * @param {string} template - 模板字符串
     * @returns {string} 渲染后的HTML字符串
     */
    #tpl(template) {
        template = template
            // if if-else else
            .replace(/\{\#if\s+([^}]*)\}/g,
                (_, p1) => '`;if(' + bnyComparison(p1) + ') {bny_tpl+=`')
            .replace(/\{\#else\s+if\s+([^}]*)\}/g,
                (_, p1) => '`;} else if(' + bnyComparison(p1) + ') {bny_tpl+=`')
            .replace(/\{\#else\}/g, '`;} else {bny_tpl+=`')
            .replace(/\{\/if\}/g, '`;}bny_tpl+=`')
            // for
            .replace(/\{\#for\s+([^}]*)}/g,
                (_, p1) => '`;for(' + bnyComparison(p1) + ') {bny_tpl+=`')
            .replace(/\{\/for\}/g, '`;}bny_tpl+=`')
            // each
            .replace(/\{\#each\s+([^}]+)\s+as\s+([^}]+)}/g, '`;$1.forEach(function($2){bny_tpl+=`')
            .replace(/\{\/each\}/g, '`;});bny_tpl+=`')
            // 事件绑定
            .replace(/@([a-z]+)="([\w$]+)"/g,
                (_, p1, p2) => `data-event="${p1},${p2}"`)
            // 安全变量
            .replace(/\{\{(\w+(\.\w+)*)\}\}/g, "${bnyHtml($1)}")
            // Html内容插入
            .replace(/\{\#html\s+(\w+(\.\w+)*)\}/g, "${bnyHtml($1,false)}")
        const str = `
            let bny_tpl = \`${template}\`;
            return bny_tpl;`
        try {
            const args = Object.keys(this);
            const fn = new Function(...args, str);
            return fn(...args.map(key => this[key]));
        } catch (e) {
            throw new Error('Template error, ' + e.message);
        }
    }

    css() { return ''; } // 定义样式
    render() { return ''; } // 渲染模板
    disconnectedCallback() { } // 自定义元素从页面中移除时调用
    adoptedCallback() { } // 自定义元素移动至新页面时调用
    attributeChangedCallback(name, oldValue, newValue) { } // 自定义元素的属性变更时调用
}

/**
 * 转义HTML特殊字符
 * 
 * @param {any} input - 输入字符串
 * @param {boolean} is - 是否转义
 * 
 * @returns {string} 转义后的字符串
 */
function bnyHtml(input, is = true) {
    // 处理空值和函数
    if (input == null) return '';
    if (typeof input === 'function') return bnyHtml(input());
    // 处理数组
    if (Array.isArray(input)) {
        const len = input.length;
        // 预初始化数组避免push开销
        const escaped = new Array(len);
        for (let i = 0; i < len; i++) {
            escaped[i] = bnyHtml(input[i]);
        }
        return escaped.join(',');
    }
    // 转换非字符串为字符串
    const str = String(input);
    if (!is) return str;
    // 转义HTML特殊字符
    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    const escapePattern = /[&<>"']/g;
    // 快速检查是否需要转义
    if (!escapePattern.test(str)) return str;
    return str.replace(escapePattern, char => escapeMap[char]);
}

/**
 * 比较表达式解析
 * 
 * @param {string} exp - 表达式字符串
 * @returns {string} 表达式结果
 */
function bnyComparison(exp) {
    const map = {
        'eq': '==',
        'neq': '!=',
        'gt': '>',
        'egt': '>=',
        'lt': '<',
        'elt': '<=',
        'heq': '===',
        'nheq': '!=='
    };
    // 按标识符长度降序排序（避免短标识符先匹配长标识符的部分内容）
    const keys = Object.keys(map).sort((a, b) => b.length - a.length);
    // 转义特殊字符并构建匹配模式
    const pattern = keys
        .map(key => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // 正则转义
        .join('|');
    // 创建单词边界匹配的正则表达式
    const regex = new RegExp(`\\b(${pattern})\\b`, 'g');
    // 执行替换
    return exp.replace(regex, match => map[match]);
}