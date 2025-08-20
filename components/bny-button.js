customElements.define('bny-button', class extends Bunny {
    // 定义监听的属性
    static observedAttributes = ['color', 'disabled']

    constructor() {
        super();
        // 默认属性
        this.attr = this.state({
            color: "default",
            disabled: false
        })
    }

    // 渲染
    render() {
        return `
    <button color="${this.attr.color}" ${this.attr.disabled ? 'disabled' : ''}>
        <slot name="bny-text">默认</slot>
    </button>
`;
    }

    // 监听属性
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'color') {
            this.attr.color = newValue
        }
        if (name === 'disabled') {
            this.attr.disabled = true
        }
    }

    // 定义样式
    css() {
        return `

    button {
      padding: 4px 11px;
      border-radius: var(--border-radius);
      text-align: center;
      text-decoration: none;
      transition: var(--transition);
    }
    button:hover {
      cursor: pointer;
    }
    button:active {
      transform: var(--transform3d-020);
    }

    [color="default"] {
        color: var(--white-common);
        background-color: var(--default);
        border: 2px solid var(--default);
        box-shadow: var(--box-shadow-005);
    }
    [color="default"]:hover {
        background-color: var(--default-middle);
        border-color: var(--default-middle);
        border: 2px solid var(--default-middle);
    }
    [color="default"]:active {
        background-color: var(--default-shallow);
        border-color: var(--default-shallow);
        border: 2px solid var(--default-shallow);
    }
        
    [color="green"] {
        color: var(--white-common);
        background-color: var(--green);
        border: 2px solid var(--green);
    }
    [color="green"]:hover {
        background-color: var(--green-middle);
        border-color: var(--green-middle);
        border: 2px solid var(--green-middle);
    }
    [color="green"]:active {
        background-color: var(--green-shallow);
        border-color: var(--green-shallow);
        border: 2px solid var(--green-shallow);
    }

    [color="blue"] {
        color: var(--white-common);
        background-color: var(--blue);
        border: 2px solid var(--blue);
    }
    [color="blue"]:hover {
        background-color: var(--blue-middle);
        border-color: var(--blue-middle);
        border: 2px solid var(--blue-middle);
    }
    [color="blue"]:active {
        background-color: var(--blue-shallow);
        border-color: var(--blue-shallow);
        border: 2px solid var(--blue-shallow);
    }
    
    [color="yellow"] {
        color: var(--white-common);
        background-color: var(--yellow);
        border: 2px solid var(--yellow);
    }
    [color="yellow"]:hover {
        background-color: var(--yellow-middle);
        border-color: var(--yellow-middle);
        border: 2px solid var(--yellow-middle);
    }
    [color="yellow"]:active {
        background-color: var(--yellow-shallow);
        border-color: var(--yellow-shallow);
        border: 2px solid var(--yellow-shallow);
    }

    [color="red"] {
        color: var(--white-common);
        background-color: var(--red);
        border: 2px solid var(--red);
    }
    [color="red"]:hover {
        background-color: var(--red-middle);
        border-color: var(--red-middle);
        border: 2px solid var(--red-middle);
    }
    [color="red"]:active {
        background-color: var(--red-shallow);
        border-color: var(--red-shallow);
        border: 2px solid var(--red-shallow);
    }

    [disabled] {
        opacity: 0.5;
    }
    [disabled]:hover {
        cursor: not-allowed;
    }

`;
    }

});