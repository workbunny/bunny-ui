<?php

function comp(string $name, string $css, string $render, string $javaScript)
{
    echo <<<JS
    customElements.define('$name', class extends Bunny {

        static observedAttributes = ['my-text']

        // 定义样式
        css() {
            return $css;
        }
        render() {
            return $render;
        }
        javaScript() {
            $javaScript
        }

        attributeChangedCallback(name, oldValue, newValue) {
            console.log(name, oldValue, newValue);
        }

    });
JS;
}
comp(
    'demo-ui',
    <<<CSS
    h1 {
        color: blue;
    }
CSS,
    <<<HTML
    <h1>Hello Bunny001</h1>
    <slot name="my-text">默认文本</slot>
HTML,
    <<<JS
    let h1 = this.shadowRoot.querySelector('h1');
    console.log(h1.textContent);
    console.log("Hello Bunny!");
JS
);
