let tool = {
    /**
     * 获取标签indexOf
     * @param {object} elem 标签对象
     * @returns number
     */
    indexOf: function (elem) {
        return Array
            .prototype
            .indexOf
            .call(elem.parentNode.children, elem)
    },
    /**
     * 转义HTML
     * @param {string} str 字符串
     * @returns string
     */
    escapeHTML: function (str) {
        return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
    }
}

export default tool;