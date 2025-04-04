import htmx from "./htmx"
import tool from "./tool"

// 拓展-选项卡
(function () {

    /**
     * 初始化选项卡
     * @param {Event} evt - 事件对象
     */
    function tab(evt) {
        // 找到所有选项卡项和选项卡内容
        const items = htmx.findAll(evt.target, ".bny-tab-item")
        const bodys = htmx.findAll(evt.target, ".bny-tab-body>div")

        // 如果选项卡项数量多于选项卡内容数量，创建缺少的选项卡内容
        if (items.length > bodys.length) {
            for (let i = bodys.length; i < items.length; i++) {
                const div = document.createElement("div");
                htmx.find(evt.target, ".bny-tab-body").append(div);
            }
        }
        // 为每个选项卡项添加点击事件
        evt.target.addEventListener("click", (e) => {
            // 如果点击的是删除按钮
            if (e.target.classList.contains("del")) {
                // 获取父级元素
                const parent = e.target.parentNode
                // 获取当前选项卡项的索引
                const index = tool.indexOf(parent)
                // 找到对应的选项卡内容
                const body = htmx.find(parent.parentNode.parentNode,
                    `.bny-tab-body>div:nth-child(${index + 1})`)
                // 移除父级元素
                parent.remove()
                // 移除对应的选项卡内容
                body.remove()
                const item = htmx.find(evt.target, ".bny-tab-item");
                if (item) {
                    item.click();
                }
                // 阻止冒泡
                e.stopPropagation()
            }
            // 如果点击的是选项卡项
            if (e.target.classList.contains("bny-tab-item")) {
                // 获取选项卡容器
                const tab = e.target.parentNode.parentNode;
                // 找到所有选中的选项卡项和选项卡内容
                const this_items = htmx.findAll(tab, ".bny-tab-item.this");
                const this_bodys = htmx.findAll(tab, ".bny-tab-body>div.this");
                const index = tool.indexOf(e.target)
                // 移除所有选项卡项和选项卡内容的选中状态
                this_items.forEach((i) => i.classList.remove("this"));
                this_bodys.forEach((i) => i.classList.remove("this"));

                // 设置当前选项卡项和选项卡内容为选中状态
                e.target.classList.add("this");
                htmx.find(tab, `.bny-tab-body>div:nth-child(${index + 1})`)
                    .classList.add("this");
            }
        })
    }

    /**
     * 是否单行模式
     * 
     * @param {Event} evt 
     */
    function isNowrap(evt) {
        // 判断属性名为 "nowrap" 的属性是否存在
        if (evt.target.getAttribute("nowrap") !== null) {
            const setwin = document.createElement("div")
            setwin.classList.add("bny-tab-setwin")
            setwin.innerHTML = `
            <span class="icon icon-zuohua"></span>
            <span class="icon icon-youhua"></span>
            `
            evt.target.append(setwin)
            const header = htmx.find(evt.target, ".bny-tab-title")
            const left = htmx.find(setwin, ".icon-zuohua")
            const right = htmx.find(setwin, ".icon-youhua")
            // 滚动事件
            htmx.on(left, "click", () => {
                header.scrollTo({
                    left: header.scrollLeft - 100,
                    behavior: "smooth"
                })
            })
            htmx.on(right, "click", () => {
                header.scrollTo({
                    left: header.scrollLeft + 100,
                    behavior: "smooth"
                })
            })
        }
    }


    /**
     * htmx:beforeSend api
     * @param {Event} evt 
     */
    function beforeSend(evt) {
        // 获取当前选项卡项的索引
        const index = tool.indexOf(evt.target);
        // 找到对应的选项卡内容
        const body = htmx.find(evt.target.parentNode.parentNode,
            `.bny-tab-body>div:nth-child(${index + 1})`);
        // 将请求的目标设置为对应的选项卡内容
        evt.detail.target = body;
    }

    /**
     * 定义一个名为 "bny-tab" 的 htmx 扩展
     * 该扩展在特定事件发生时执行相应的操作
     */
    htmx.defineExtension("bny-tab", {
        /**
         * 事件处理函数
         * @param {string} name - 事件名称
         * @param {Event} evt - 事件对象
         */
        onEvent: function (name, evt) {
            // 当 htmx 处理完一个节点后
            if (name === "htmx:afterProcessNode") {
                // 如果事件目标包含 "bny-tab" 类
                if (evt.target.classList.contains("bny-tab")) {
                    // 调用 tab 函数初始化选项卡
                    tab(evt);
                    // 是否单行模式
                    isNowrap(evt);
                }

                // 如果事件目标包含 "bny-tab-item" 类
                if (evt.target.classList.contains("bny-tab-item")) {
                    // 获取 "selected" 属性的值
                    const selected = evt.target.getAttribute("selected");
                    // 如果 "selected" 属性存在
                    if (selected !== null) {
                        // 模拟点击事件
                        evt.target.click();
                    }
                    // 阻止事件冒泡
                    return false;
                }
            }

            // 在发送请求之前
            if (name === "htmx:beforeSend") {
                // 如果事件目标包含 "bny-tab-item" 类
                if (evt.target.classList.contains("bny-tab-item")) {
                    // 调用 beforeSend 函数
                    beforeSend(evt);
                }
            }
        }
    })

    /**
     * 
     * @param {string} selector 选择器
     * @param {object} res 数据
     * @returns false
     */
    function addTab(selector, res) {
        const tab = htmx.find(selector)
        let del_html = ""
        if (res.data.isDelete) {
            del_html = `<span class="icon icon-cuo del"></span>`
        }
        const item = document.createElement("div")
        if (res.data.id) {
            const is_item = htmx.find(tab,
                `.bny-tab-item[bny-id="${res.data.id}"]`)
            if (is_item) {
                is_item.click()
                return false;
            } else {
                item.setAttribute("bny-id", res.data.id)
            }
        }
        item.classList.add("bny-tab-item")
        if (res.data.url && res.data.url !== "") {
            item.setAttribute("hx-get", res.data.url)
            htmx.process(item)
        }
        item.innerHTML = res.data.name + del_html
        const body = document.createElement("div")
        body.innerHTML = res.data.conten
        htmx.find(tab, ".bny-tab-title").append(item)
        htmx.find(tab, ".bny-tab-body").append(body)
        item.click()
        return false;
    }

    /**
     * swap添加选项卡
     * @param {Event} evt 
     * @returns 
     */
    function SwapAddTab(evt) {
        const res = JSON.parse(evt.detail.serverResponse)
        return addTab(evt.target.getAttribute("bny-target"), res);
    }

    /**
     * 静态添加选项卡
     * @param {Event} evt 
     */
    function StaticAddTab(evt) {
        if (evt.target.getAttribute("hx-get") === null) {
            const bny_target = evt.target.getAttribute("bny-target")
            const bny_id = evt.target.getAttribute("bny-id") || ""
            const bny_name = evt.target.getAttribute("bny-name")
            const bny_conten = evt.target.getAttribute("bny-conten") || ""
            const bny_is_delete = evt.target.getAttribute("bny-is-delete")
            const bny_url = evt.target.getAttribute("bny-url") || ""
            const res = {
                data: {
                    id: bny_id,
                    name: bny_name,
                    conten: bny_conten,
                    isDelete: bny_is_delete,
                    url: bny_url
                }
            }
            htmx.on(evt.target, "click", () => {
                addTab(bny_target, res)
            })
        }
    }

    /**
     * 定义一个名为 "bny-tab-add" 的 htmx 扩展
     * 该扩展在特定事件发生时执行相应的操作
     * 
     */
    htmx.defineExtension("bny-tab-add", {
        onEvent: function (name, evt) {
            if (name === "htmx:afterProcessNode") {
                const bny_target = evt.target.getAttribute("bny-target")
                if (bny_target === null || bny_target === "") {
                    throw new Error("bny-target not be null or ''");
                }
                StaticAddTab(evt)
            }
            if (name === "htmx:beforeSwap") {
                return SwapAddTab(evt)
            }
        }
    })

    /**
     * 删除选项卡
     * @param {Event} evt 
     */
    function delTab(evt) {
        htmx.on(evt.target, "click", () => {
            const tab = htmx.find(evt.target.getAttribute("bny-target"))
            const id = evt.target.getAttribute("bny-id")
            const items = htmx.findAll(tab, ".bny-tab-item")
            if (id === null || id === "") {
                return
            }
            switch (id) {
                case "this":
                    const this_item = htmx.find(tab, ".bny-tab-item.this")
                    const this_body = htmx.find(tab, ".bny-tab-body>div.this")
                    const isDel = htmx.find(this_item, ".del")
                    if (isDel) {
                        this_item.remove()
                        this_body.remove()
                    }
                    break;
                case "all":
                    items.forEach((i) => {
                        const index = tool.indexOf(i)
                        const body = htmx.find(tab,
                            `.bny-tab-body>div:nth-child(${index + 1})`)
                        const isDel = htmx.find(i, ".del")
                        if (isDel) {
                            i.remove()
                            body.remove()
                        }
                    })
                    break;
                case "other":
                    items.forEach((i) => {
                        if (!i.classList.contains("this")) {
                            const index = tool.indexOf(i)
                            const body = htmx.find(tab,
                                `.bny-tab-body>div:nth-child(${index + 1})`)
                            const isDel = htmx.find(i, ".del")
                            if (isDel) {
                                i.remove()
                                body.remove()
                            }
                        }
                    })
                    break;
                default:
                    const item = htmx.find(tab, `.bny-tab-item[bny-id="${id}"]`)
                    const index = tool.indexOf(item)
                    const body = htmx.find(tab,
                        `.bny-tab-body>div:nth-child(${index + 1})`)
                    const isDel_ = htmx.find(item, ".del")
                    if (isDel_) {
                        item.remove()
                        body.remove()
                    }

            }
            const item = htmx.find(tab, ".bny-tab-item")
            if (item) {
                item.click()
            }
        })
    }

    /**
     * 定义一个名为 "bny-tab-del" 的 htmx 扩展
     * 该扩展在特定事件发生时执行相应的操作
     */
    htmx.defineExtension("bny-tab-del", {
        onEvent: function (name, evt) {
            if (name === "htmx:afterProcessNode") {
                const bny_target = evt.target.getAttribute("bny-target")
                if (bny_target === null || bny_target === "") {
                    throw new Error("bny-target not be null or ''");
                }
                delTab(evt)
            }
        }
    })

})()