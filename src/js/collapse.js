htmx.defineExtension('bny-collapse', {
    // 事件
    onEvent: function (name, evt) {

        // 在htmx初始化节点后触发
        if (name === "htmx:afterProcessNode") {
            if (bny.hasExtName(evt.target, 'bny-collapse')) {
                evt.target.addEventListener('click', function (e) {
                    const title = e.target.closest('.title')
                    if (title) {
                        const item = title.parentElement
                        const accordion = e.target
                            .parentElement
                            .parentElement
                            .getAttribute('collapse-mode') === 'accordion'
                        if (accordion) {
                            const isShow = item.classList.contains('show')
                            bny.removeClass(item
                                .parentElement
                                .querySelectorAll('.item'), 'show')
                            if (!isShow) {
                                item.classList.add('show')
                            }
                        } else {
                            item.classList.toggle('show')
                        }
                    }
                })
            }
        }

        return true
    },
    // 响应转换
    transformResponse: function (text, xhr, elt) {

        /**
         * 处理折叠项数据
         * 
         * @param {Array} arr - 折叠项数据数组
         * @returns {string} - 处理后的HTML字符串
         */
        function getCollapse(arr) {
            let html = ''
            arr.forEach(item => {
                html += `
                    <div class="item" collapse-id="${item.id}">
                        <div class="title" ${bny.parAttrStr(item.attr)}>
                            ${item.title}
                        </div>
                        <div class="content">${item.content}</div>
                    </div>
                `
            })
            return html
        }

        // 处理JSON响应
        if (xhr.getResponseHeader('Content-Type')
            .includes('application/json')) {
            const json = JSON.parse(xhr.responseText)
            return getCollapse(json.data)
        }
        return text
    }
})
