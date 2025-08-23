/**
 * 自定义组件
 */
export default class Bunny extends HTMLElement {
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
        this.firstRender = true; // 首次渲染
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
        // 首次渲染
        if (this.firstRender) {
            this.firstRender = false;
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
        } else {
            const oldNode = domToVNode(parseHTML(this.shadowRoot.innerHTML));
            const newNode = domToVNode(parseHTML(this.#tpl(template)));
            const patches = diff(oldNode, newNode);
            applyPatches(this.shadowRoot, patches);
        }
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
            args.push('bnyHtml');
            const fn = new Function(...args, str);
            return fn(...args.map(key => this[key]));
        } catch (e) {
            throw new Error('Template error, ' + e.message);
        }
    }

    /**
     * 转义HTML特殊字符
     * 
     * @param {any} input - 输入字符串
     * @param {boolean} is - 是否转义
     * 
     * @returns {string} 转义后的字符串
     */
    bnyHtml(input, is = true) {
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

    css() { return ''; } // 定义样式
    render() { return ''; } // 渲染模板
    disconnectedCallback() { } // 自定义元素从页面中移除时调用
    adoptedCallback() { } // 自定义元素移动至新页面时调用
    attributeChangedCallback(name, oldValue, newValue) { } // 自定义元素的属性变更时调用
}

/**
 * 比较表达式解析
 * 
 * @param {string} exp - 表达式字符串
 * 
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

/**
 * 解析HTML字符串为DOM节点列表
 * 
 * @param {string} htmlString HTML字符串
 * 
 * @returns {NodeListOf<ChildNode>} DOM节点列表
 */
function parseHTML(htmlString) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    return tempDiv.childNodes;
}

/**
 * 虚拟DOM节点
 */
class VNode {
    /**
     * 
     * @param {string} tag 标签名
     * @param {Object} attrs 属性
     * @param {VNode[]} children 子节点
     * @param {string} key 唯一标识
     * @param {Element} el 真实DOM节点
     */
    constructor(tag, attrs = {}, children = [], key = null, el = null) {
        this.tag = tag;
        this.attrs = attrs;
        this.children = children;
        this.key = key;
        this.el = el;
    }
}

/**
 * 将DOM节点转换为虚拟DOM节点
 * 
 * @param {NodeList} dom DOM节点列表
 * 
 * @returns {VNode[]} 虚拟DOM节点数组
 */
function domToVNode(dom) {
    let VNodeArray = [];
    dom.forEach((node, index) => {
        const tag = node.nodeName.toLowerCase();
        const attrs = {};
        if (node.attributes) {
            for (let i = 0; i < node.attributes.length; i++) {
                const attr = node.attributes[i];
                attrs[attr.name] = attr.value;
            }
        }
        // 处理子节点
        const children = domToVNode(node.childNodes);
        if (tag === '#text') {
            VNodeArray.push(node.textContent)
        } else {
            VNodeArray.push(new VNode(
                tag,
                attrs,
                children,
                index,
                node
            ));
        }
    });
    return VNodeArray;
}
/**
 * 对比两个虚拟DOM节点数组的差异
 * @param {VNode[]} oldVNodes 旧虚拟DOM节点数组
 * @param {VNode[]} newVNodes 新虚拟DOM节点数组
 * 
 * @returns {[]} 差异数组
 */
function diff(oldVNodes, newVNodes) {
    const patches = [];

    // 首先遍历两个节点数组，找出更新和删除的节点
    for (let i = 0; i < oldVNodes.length; i++) {
        const oldNode = oldVNodes[i];
        const newNode = newVNodes[i];

        // 如果节点不存在，说明被删除了
        if (!newNode) {
            patches.push({
                type: 'REMOVE',
                index: i,
                node: oldNode
            });
            continue;
        }

        // 文本节点比较
        if (typeof oldNode === 'string' || typeof newNode === 'string') {
            if (oldNode !== newNode) {
                patches.push({
                    type: 'UPDATE',
                    index: i,
                    oldNode: oldNode,
                    newNode: newNode
                });
            }
            continue;
        }

        // 标签名不同，直接替换
        if (oldNode.tag !== newNode.tag) {
            patches.push({
                type: 'REPLACE',
                index: i,
                oldNode: oldNode,
                newNode: newNode
            });
            continue;
        }

        // 比较属性
        const attrsPatches = diffAttrs(oldNode.attrs, newNode.attrs);
        if (Object.keys(attrsPatches).length > 0) {
            patches.push({
                type: 'ATTR',
                index: i,
                attrs: attrsPatches
            });
        }

        // 递归比较子节点
        const childrenPatches = diff(oldNode.children, newNode.children);
        if (childrenPatches.length > 0) {
            patches.push({
                type: 'CHILDREN',
                index: i,
                patches: childrenPatches
            });
        }
    }

    // 检查新增的节点
    for (let i = oldVNodes.length; i < newVNodes.length; i++) {
        patches.push({
            type: 'ADD',
            index: i,
            node: newVNodes[i]
        });
    }

    return patches;
}

// 比较属性差异
function diffAttrs(oldAttrs, newAttrs) {
    const patches = {};

    // 检查更改和新增的属性
    for (let key in newAttrs) {
        if (oldAttrs[key] !== newAttrs[key]) {
            patches[key] = newAttrs[key];
        }
    }

    // 检查删除的属性
    for (let key in oldAttrs) {
        if (!newAttrs.hasOwnProperty(key)) {
            patches[key] = undefined;
        }
    }

    return patches;
}

// 应用补丁到真实DOM
function applyPatches(node, patches) {
    patches.forEach(patch => {
        switch (patch.type) {
            case 'ADD':
                addNode(node, patch.index, patch.node);
                break;
            case 'REMOVE':
                removeNode(node, patch.index, patch.node);
                break;
            case 'UPDATE':
                updateNode(node, patch.index, patch.oldNode, patch.newNode);
                break;
            case 'REPLACE':
                replaceNode(node, patch.index, patch.oldNode, patch.newNode);
                break;
            case 'ATTR':
                updateAttrs(node, patch.index, patch.attrs);
                break;
            case 'CHILDREN':
                applyPatches(node.childNodes[patch.index], patch.patches);
                break;
        }
    });
}

// 添加节点
function addNode(parent, index, newNode) {
    const el = createElement(newNode);
    if (index >= parent.childNodes.length) {
        parent.appendChild(el);
    } else {
        parent.insertBefore(el, parent.childNodes[index]);
    }
}

// 删除节点
function removeNode(parent, index, node) {
    if (parent.childNodes[index]) {
        parent.removeChild(parent.childNodes[index]);
    }
}

// 更新节点（文本节点）
function updateNode(parent, index, oldNode, newNode) {
    if (parent.childNodes[index]) {
        parent.childNodes[index].textContent = newNode;
    }
}

// 替换节点
function replaceNode(parent, index, oldNode, newNode) {
    if (parent.childNodes[index]) {
        const el = createElement(newNode);
        parent.replaceChild(el, parent.childNodes[index]);
    }
}

// 更新属性
function updateAttrs(parent, index, attrs) {
    const node = parent.childNodes[index];
    if (!node) return;

    for (let key in attrs) {
        if (attrs[key] === undefined) {
            node.removeAttribute(key);
        } else {
            node.setAttribute(key, attrs[key]);
        }
    }
}

// 根据虚拟节点创建真实DOM元素
function createElement(vnode) {
    if (typeof vnode === 'string') {
        return document.createTextNode(vnode);
    }

    const el = document.createElement(vnode.tag);

    // 设置属性
    for (let key in vnode.attrs) {
        el.setAttribute(key, vnode.attrs[key]);
    }

    // 递归创建子节点
    vnode.children.forEach(child => {
        el.appendChild(createElement(child));
    });

    return el;
}
