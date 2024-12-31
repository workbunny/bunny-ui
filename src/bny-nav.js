import htmx from "./htmx"

// 拓展-导航栏
(function () {
    /**
     * 导航栏切换
     * @param {Event} evt 
     */
    function navToggle(evt) {
        const tree = evt.target.getAttribute("tree")
        if (tree === null) {
            const toggle = evt.target.querySelector(".bny-nav-toggle")
            const menu = evt.target.querySelector(".bny-nav-menu")
            toggle.onclick = function () {
                menu.classList.toggle("show-menu")
                toggle.classList.toggle("show-icon")
            }
        }
    }

    function navItemClick(evt) {
        const tree = evt.target.getAttribute("tree")
        if (tree !== null && tree !== undefined) {
            const dropdowns = evt.target.querySelectorAll(".bny-nav-dropdown")
            for (let i = 0; i < dropdowns.length; i++) {
                dropdowns[i].onclick = function (event) {
                    event.stopPropagation()
                    const menu = dropdowns[i].querySelector("menu")
                    if (menu.style.display === "flex") {
                        menu.style.display = "none"
                        if (dropdowns[i].querySelector("a>i.arrow") !== null) {
                            dropdowns[i].querySelector("a>i.arrow").style.transform = "rotate(0deg)"
                        } else if (dropdowns[i].querySelector("a>i.add") !== null) {
                            dropdowns[i].querySelector("a>i.add").style.transform = "rotate(0deg)"
                        }
                    } else {
                        menu.style.display = "flex"
                        if (dropdowns[i].querySelector("a>i.arrow") !== null) {
                            dropdowns[i].querySelector("a>i.arrow").style.transform = "rotate(90deg)"
                        } else if (dropdowns[i].querySelector("a>i.add") !== null) {
                            dropdowns[i].querySelector("a>i.add").style.transform = "rotate(45deg)"
                        }
                    }
                    return false
                }
            }
        }
        const treeNode = evt.target.querySelectorAll(`li:not(.bny-nav-dropdown)`)
        for (let i = 0; i < treeNode.length; i++) {
            treeNode[i].onclick = function (event) {
                event.stopPropagation()
                evt.target.querySelectorAll(`li.this`)
                    .forEach(function (item) {
                        item.classList.remove("this")
                    })
                treeNode[i].classList.toggle("this")
                return false
            }
        }
    }

    htmx.defineExtension("bny-nav", {
        onEvent: function (name, evt) {
            if (name === "htmx:afterProcessNode" &&
                evt.target.classList.contains("bny-nav")
            ) {
                navToggle(evt)
                navItemClick(evt)
            }
        }
    })
})()