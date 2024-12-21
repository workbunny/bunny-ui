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
        items.forEach((item, index) => {
            item.onclick = () => {
                // 获取选项卡容器
                const tab = item.parentNode.parentNode;
                // 找到所有选中的选项卡项和选项卡内容
                const this_items = htmx.findAll(tab, ".bny-tab-item.this");
                const this_bodys = htmx.findAll(tab, ".bny-tab-body>div.this");

                // 移除所有选项卡项和选项卡内容的选中状态
                this_items.forEach((i) => i.classList.remove("this"));
                this_bodys.forEach((i) => i.classList.remove("this"));

                // 设置当前选项卡项和选项卡内容为选中状态
                item.classList.add("this");
                htmx.find(evt.target, `.bny-tab-body>div:nth-child(${index + 1})`)
                    .classList.add("this");
            }
        });
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
})()