class Bunny extends HTMLElement {
  // 样式类
  sheet = new CSSStyleSheet();

  /**
   * 自定义元素的构造函数
   */
  constructor() {
    // 必须首先调用 super 方法
    super();
    // 创建一个 Shadow DOM
    this.attachShadow({ mode: "open" });
    // 渲染样式
    this.sheet.replaceSync(this.css());
    this.shadowRoot.adoptedStyleSheets = [this.sheet];
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
    this._processTemplate(newTemplate);
  }

  /**
    * 处理模板字符串（包含事件绑定）
    * 
    * @param {string} template - 模板字符串
    * @returns {void}
    */
  _processTemplate(template) {
    // 特殊处理：缓存事件处理函数
    const eventHandlers = [];

    // 处理事件绑定语法 (@eventName="handler")
    const processedTemplate = template.replace(
      /@([a-z]+)="([\w$]+)"/g,
      (match, eventName, handlerName) => {
        const uniqueAttr = `data-event-${eventName}="${handlerName}"`;
        eventHandlers.push({ eventName, handlerName });
        return uniqueAttr;
      }
    );
    // 设置 DOM 内容
    this.shadowRoot.innerHTML = processedTemplate;

    // 为缓存的事件绑定处理函数
    eventHandlers.forEach(({ eventName, handlerName }) => {
      const elements = this.shadowRoot
        .querySelectorAll(`[data-event-${eventName}="${handlerName}"]`);
      elements.forEach(element => {
        element.addEventListener(eventName, (e) => {
          if (this[handlerName]) {
            this[handlerName].call(this, e);
          }
        });
        // 移除临时属性
        element.removeAttribute(`data-event-${eventName}`);
      });
    });
  }

  /**
   * 自定义元素添加至页面时调用
   * 
   * @returns {void}
   */
  connectedCallback() {
    this.updateComponent();
  }

  css() { return ''; } // 定义样式
  render() { return ''; } // 渲染模板
  disconnectedCallback() { } // 自定义元素从页面中移除时调用
  adoptedCallback() { } // 自定义元素移动至新页面时调用
  attributeChangedCallback(name, oldValue, newValue) { } // 自定义元素的属性变更时调用

}