对话框

<!-- <button class="bny-btn" hx-on:click="bunny.dialog({'elem':this})">消息</button> -->
<button class="bny-btn" hx-delete="#" hx-confirm="???" bny>消息</button>

<script>
    document.body.addEventListener('htmx:confirm', function (evt) {
        if (evt.target.matches("[bny]")) {
            evt.preventDefault();
            console.log(evt.target)
        }
    });
</script>