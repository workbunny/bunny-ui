import htmx from "./htmx"

(function () {
    // 拓展
    htmx.defineExtension("bny-card", {
        onEvent: function (name, evt) {
            if (name === "htmx:beforeSwap") {
                const isError = evt.detail.isError
                if (!isError) {
                    try {
                        const res = JSON.parse(evt.detail.serverResponse)
                        if (res.code === 1) {
                            const data = res.data;
                            const bodyContent = data && data.body ? `
                                <h4 class="bny-card-title">${data.body.title || ''}</h4>
                                <h5 class="bny-card-subtitle">${data.body.subtitle || ''}</h5>
                                <p class="bny-card-text">${data.body.text || ''}</p>
                            ` : '';
                            evt.detail.elt.innerHTML = `
                            <div class="bny-card">
                                ${data && data.top_img ? `<img src="${data.top_img}" >` : ''}
                                ${data && data.header ? `<div class="bny-card-header">${data.header}</div>` : ''}
                                <div class="bny-card-body">${bodyContent}</div>
                                ${data && data.footer ? `<div class="bny-card-footer">${data.footer}</div>` : ''}
                                ${data && data.bottom_img ? `<img src="${data.bottom_img}" >` : ''}
                            </div>`;
                        } else {
                            evt.detail.elt.innerHTML = `<div class="bny-card">${data.msg}</div>`
                        }
                    } catch (error) {
                        console.error(error)
                    }
                } else {
                    evt.detail.elt.innerHTML = `<div class="bny-card">加载失败...</div>`
                }
                console.log(evt.detail)
                return false
            }
        }
    })
})()