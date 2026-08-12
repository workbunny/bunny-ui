htmx.defineExtension('bny-page', {
    // 响应转换
    transformResponse: function (text, xhr, elt) {
        if (xhr.getResponseHeader('Content-Type')
            .includes('application/json')) {
            const json = JSON.parse(xhr.responseText)
            let data = {}
            if (json.data.title) data.title = json.data.title
            if (json.data.anim) data.anim = json.data.anim
            if (json.data.width) data.width = json.data.width
            if (json.data.height) data.height = json.data.height
            if (json.data.offset) data.offset = json.data.offset
            if (json.data.shade) data.shade = json.data.shade
            const page = bny.page(json.data.content, data)
            htmx.process(page)
        } else {
            if (bny.hasExtName(elt, 'bny-page')) {
                let data = {}
                const title = elt.getAttribute('title')
                if (title) {
                    if (title === "false") {
                        data.title = false
                    } else {
                        data.title = title
                    }
                }
                data.shade = elt.getAttribute('page-shade') !== null ? true : false
                if (elt.hasAttribute('page-anim')) data.anim = elt.getAttribute('page-anim')
                if (elt.hasAttribute('page-width')) data.width = elt.getAttribute('page-width')
                if (elt.hasAttribute('page-height')) data.height = elt.getAttribute('page-height')
                if (elt.hasAttribute('page-offset')) data.offset = elt.getAttribute('page-offset')
                const page = bny.page(text, data)
                htmx.process(page)
            }
        }
        return elt.innerHTML
    }
})