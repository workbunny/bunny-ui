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
    }
}

export default tool;