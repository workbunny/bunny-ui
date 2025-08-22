customElements.define('bny-input', class extends Bunny {

    // 定义监听的属性
    static observedAttributes = ['type', 'value', 'disabled', 'placeholder', 'name', 'required']

    constructor() {
        super();
        // 默认属性
        this.attr = this.state({
            type: "text",
            disabled: false,
            placeholder: "",
            name: "",
            required: false
        })
        this.value = "";
    }

    // 输入框值改变时触发
    handleInputChange(e) {
        this.setAttribute('value', e.target.value);
    }

    // 渲染
    render() {
        return `
            <input type="{{attr.type}}" name="{{attr.name}}" value="{{value}}" placeholder="{{attr.placeholder}}" {{attr.disabled ? 'disabled' : ''}} {{attr.required ? 'required' : ''}} @input="handleInputChange" />
        `;
    }

    // 监听属性
    attributeChangedCallback(name, oldValue, newValue) {
        if (typeof this.attr[name] !== "undefined") {
            if (name === 'disabled' || name === 'required') {
                this.attr[name] = true;
            } else {
                this.attr[name] = newValue;
            }
        }
        if (name === 'value') {
            this.value = newValue;
        }
    }

    // 样式
    css() {
        return `
            input {
                display: block;
                width: 100%;
                height: 28px;
                line-height: 28px;
                box-sizing: border-box;
                padding: 2px 4px;
                background-color: var(--white);
                color: var(--black);
                border: 1px solid var(--gray);
                border-radius: var(--border-radius);
            }
            
            input:focus {
                border-color: var(--black);
            }
        `
    }
})