htmx.defineExtension('bny-code', {
    // 事件
    onEvent: function (name, evt) {

        function getCode(target, str) {
            // 获取mode属性
            const mode = target.getAttribute('code-mode')
            // 获取lang属性
            const lang = target.getAttribute('code-lang')
            // 处理高亮
            switch (mode) {
                case 'highlight':
                    str = hljs.highlight(str, { language: lang }).value
                    break;
                case 'prismjs':
                    str = Prism.highlight(str, Prism.languages[lang], lang)
                    break;
            }
            if ((mode == null || mode === "")) {
                str = bny.escapeChars(str)
            }
            return str
        }


        // 在htmx初始化节点后触发
        if (name === "htmx:afterProcessNode") {
            if (bny.hasExtName(evt.target, 'bny-code')) {
                // 处理代码内容
                const content = evt.target.textContent
                evt.target.innerHTML = ""
                // 创建code元素
                const code = document.createElement('code')
                code.innerHTML = getCode(evt.target, content.trim())
                evt.target.appendChild(code)
                // 创建复制按钮
                const copyBtn = document.createElement('a')
                copyBtn.setAttribute("title", "copy code")
                copyBtn.classList.add('copy-btn')
                copyBtn.innerHTML = '<i class="bny-icon icon-file-copy"></i>'
                evt.target.appendChild(copyBtn)
                // 复制按钮点击事件
                copyBtn.addEventListener("click", (e) => {
                    navigator.clipboard.writeText(code.textContent)
                    bny.alert('copy success')
                })
            }
        }

        // 	在交换前触发，允许你配置交换
        if (name === "htmx:beforeSwap") {
            if (bny.hasExtName(evt.target, 'bny-code')) {
                const code = evt.target.querySelector('code')
                let content = evt.detail.xhr.responseText
                if (evt.detail.xhr.getResponseHeader('Content-Type')
                    .includes('application/json')) {
                    const json = JSON.parse(content)
                    content = json.data
                }
                htmx.swap(code, getCode(evt.target, content), { swapStyle: 'innerHTML' })
            }
            return false
        }
        return true
    }
})