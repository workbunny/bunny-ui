确认框

<button class="bny-btn" hx-get="#" hx-trigger="click" hx-confirm="hello bunny-ui">确认框</button>

<script>
    // 确认框监听
    document.body.addEventListener("htmx:confirm", function (e) {
        e.preventDefault()
        const text = e.target.getAttribute("hx-confirm")
        if (text !== null) {
            bunny.confirm({
                text,
                yes: () => {
                    e.detail.issueRequest(true)
                    return true
                }
            })
            return false
        }
    });
</script>

