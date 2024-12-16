<div>
    <div style="width: 400px;padding: 20px;max-width: 100%;">
        <form action="" class="bny-form">
            <input type="text" class="bny-input" placeholder="文本框">
            <input type="text" class="bny-input inline" placeholder="文本框">
            <input type="text" class="bny-input" disabled placeholder="文本框 禁用">
            <br>
            <textarea class="bny-textarea" placeholder="多行文本框"></textarea>
            <br>
            <div class="bny-form-group">
                <label for="bnyInput1">input</label>
                <input type="text" id="bnyInput1" class="bny-input" placeholder="文本框">
            </div>
            <div class="bny-form-group">
                <label for="bnyInput2">textarea</label>
                <textarea id="bnyInput2" class="bny-textarea" placeholder="文本框"></textarea>
            </div>
            <br>
            <div class="bny-form-inline">
                <label for="bnyInput3">input</label>
                <input type="text" id="bnyInput3" class="bny-input" placeholder="文本框">
            </div>
            <div class="bny-form-inline">
                <label for="bnyInput4">textarea</label>
                <textarea id="bnyInput4" class="bny-textarea" placeholder="文本框"></textarea>
            </div>
            <br>
            <div class="bny-form-pane">
                <label for="bnyInput5">input</label>
                <input type="text" id="bnyInput5" class="bny-input" placeholder="文本框">
            </div>
            <div class="bny-form-text">
                <label for="bnyInput6">textarea</label>
                <textarea id="bnyInput6" class="bny-textarea" placeholder="文本框"></textarea>
            </div>
            <div class="bny-form-pane">
                <label for="bnyInput7">input</label>
                <input type="text" id="bnyInput7" class="bny-input inline" placeholder="文本框">
            </div>
            <div class="bny-form-pane">
                <label for="bnyInput8">select</label>
                <select id="bnyInput8" class="bny-select">
                    <option value="1">选项一</option>
                    <option value="2">选项二</option>
                    <option value="3">选项三</option>
                </select>
            </div>
            <div class="bny-form-pane">
                <label>radio</label>
                <label for="bnyInput9" class="bny-radio">
                    <input type="radio" name="sex" id="bnyInput9" value="男">
                    <span>男</span>
                </label>
                <label for="bnyInput10" class="bny-radio">
                    <input type="radio" name="sex" id="bnyInput10" value="女">
                    <span>女</span>
                </label>
                <label for="bnyInput13" class="bny-radio">
                    <input type="radio" disabled name="sex" id="bnyInput13" value="禁用">
                    <span>禁用</span>
                </label>
            </div>
            <div class="bny-form-pane">
                <label>多选框</label>
                <label for="bnyInput11" class="bny-checkbox">
                    <input type="checkbox" name="sex" id="bnyInput11">
                    <span>选项一</span>
                </label>
                <label for="bnyInput12" class="bny-checkbox">
                    <input type="checkbox" name="sex" id="bnyInput12">
                    <span>选项二</span>
                </label>
            </div>
        </form>
    </div>
</div>

代码：

```html
<form action="" class="bny-form">
    <input type="text" class="bny-input" placeholder="文本框">
    <input type="text" class="bny-input inline" placeholder="文本框">
    <input type="text" class="bny-input" disabled placeholder="文本框 禁用">
    <br>
    <textarea class="bny-textarea" placeholder="多行文本框"></textarea>
    <br>
    <div class="bny-form-group">
        <label for="bnyInput1">input</label>
        <input type="text" id="bnyInput1" class="bny-input" placeholder="文本框">
    </div>
    <div class="bny-form-group">
        <label for="bnyInput2">textarea</label>
        <textarea id="bnyInput2" class="bny-textarea" placeholder="文本框"></textarea>
    </div>
    <br>
    <div class="bny-form-inline">
        <label for="bnyInput3">input</label>
        <input type="text" id="bnyInput3" class="bny-input" placeholder="文本框">
    </div>
    <div class="bny-form-inline">
        <label for="bnyInput4">textarea</label>
        <textarea id="bnyInput4" class="bny-textarea" placeholder="文本框"></textarea>
    </div>
    <br>
    <div class="bny-form-pane">
        <label for="bnyInput5">input</label>
        <input type="text" id="bnyInput5" class="bny-input" placeholder="文本框">
    </div>
    <div class="bny-form-text">
        <label for="bnyInput6">textarea</label>
        <textarea id="bnyInput6" class="bny-textarea" placeholder="文本框"></textarea>
    </div>
    <div class="bny-form-pane">
        <label for="bnyInput7">input</label>
        <input type="text" id="bnyInput7" class="bny-input inline" placeholder="文本框">
    </div>
    <div class="bny-form-pane">
        <label for="bnyInput8">select</label>
        <select id="bnyInput8" class="bny-select">
            <option value="1">选项一</option>
            <option value="2">选项二</option>
            <option value="3">选项三</option>
        </select>
    </div>
    <div class="bny-form-pane">
        <label>radio</label>
        <label for="bnyInput9" class="bny-radio">
            <input type="radio" name="sex" id="bnyInput9" value="男">
            <span>男</span>
        </label>
        <label for="bnyInput10" class="bny-radio">
            <input type="radio" name="sex" id="bnyInput10" value="女">
            <span>女</span>
        </label>
        <label for="bnyInput13" class="bny-radio">
            <input type="radio" disabled name="sex" id="bnyInput13" value="禁用">
            <span>禁用</span>
        </label>
    </div>
    <div class="bny-form-pane">
        <label>多选框</label>
        <label for="bnyInput11" class="bny-checkbox">
            <input type="checkbox" name="sex" id="bnyInput11">
            <span>选项一</span>
        </label>
        <label for="bnyInput12" class="bny-checkbox">
            <input type="checkbox" name="sex" id="bnyInput12">
            <span>选项二</span>
        </label>
    </div>
</form>
```