### 表单

#### 文本框

<iframe src="/assets/test/form/input.html" height="230"></iframe>

代码

```html
<input type="text" class="bny-input" placeholder="文本框">
<input type="text" class="bny-input inline" placeholder="文本框">
<input type="text" class="bny-input" disabled placeholder="文本框 禁用">
<!-- 多行文本框 -->
<textarea class="bny-textarea" placeholder="多行文本框"></textarea>
```

#### 输入框点缀

<iframe src="/assets/test/form/icon.html" height="100"></iframe>

代码

```html
<form action="" class="bny-form">
    <!-- 前缀 -->
    <div class="bny-input-group">
        <span class="icon icon-yueliang intersp"></span>
        <input type="text" class="bny-input" placeholder="文本框">
    </div>
    <!-- 后缀 -->
    <div class="bny-input-group">
        <input type="text" class="bny-input inline" placeholder="文本框">
        <span class="icon icon-yueliang intersp"></span>
    </div>
</form>
```

#### 组合一

<iframe src="/assets/test/form/input-group.html" height="260"></iframe>

代码

```html
<form action="" class="bny-form">
    <div class="bny-form-group">
        <label for="bnyInput1">input</label>
        <div class="bny-input-group">
            <span class="icon icon-yueliang intersp"></span>
            <input type="text" id="bnyInput1" class="bny-input" placeholder="文本框">
        </div>
    </div>
    <div class="bny-form-group">
        <label for="bnyInput2">textarea</label>
        <textarea id="bnyInput2" class="bny-textarea" placeholder="文本框"></textarea>
    </div>
</form>
```

#### 组合二

<iframe src="/assets/test/form/input-group2.html" height="260"></iframe>

代码

```html
<form action="" class="bny-form">
    <div class="bny-form-inline">
        <label for="bnyInput3">input</label>
        <input type="text" id="bnyInput3" class="bny-input" placeholder="文本框">
    </div>
    <div class="bny-form-inline">
        <label for="bnyInput4">textarea</label>
        <textarea id="bnyInput4" class="bny-textarea" placeholder="文本框"></textarea>
    </div>
</form>
```

#### 组合三

<iframe src="/assets/test/form/input-group3.html" height="260"></iframe>

代码

```html
<form action="" class="bny-form">
    <div class="bny-form-pane">
        <label for="bnyInput5">input</label>
        <input type="text" id="bnyInput5" class="bny-input" placeholder="文本框">
    </div>
    <div class="bny-form-text">
        <label for="bnyInput6">textarea</label>
        <textarea id="bnyInput6" class="bny-textarea" placeholder="文本框"></textarea>
    </div>
</form>
```

#### 选择框

<iframe src="/assets/test/form/select.html" height="100"></iframe>

代码

```html
<form action="" class="bny-form">
    <div class="bny-form-pane">
        <label>select</label>
        <select class="bny-select">
            <option value="1">选项一</option>
            <option value="2">选项二</option>
            <option value="3">选项三</option>
        </select>
    </div>
</form>
```

#### 单选框

<iframe src="/assets/test/form/radio.html" height="100"></iframe>

代码

```html
<form action="" class="bny-form">
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
</form>
```

#### 多选框和开关

<iframe src="/assets/test/form/checkbox.html" height="120"></iframe>

代码

```html
<form action="" class="bny-form">
    <div class="bny-form-pane">
        <label>多选框</label>
        <label for="bnyInput11" class="bny-checkbox">
            <input type="checkbox" name="sex" id="bnyInput11">
            <span>选项一</span>
        </label>
        <label for="bnyInput12" class="bny-checkbox">
            <input type="checkbox" checked name="sex" id="bnyInput12">
            <span>选项二</span>
        </label>
    </div>
    <div class="bny-form-pane">
        <label>开关</label>
        <label for="bnyInput14" class="bny-switch">
            <input type="checkbox" id="bnyInput14">
            <span class="bny-switch-slider"></span>
        </label>
        <label for="bnyInput15" class="bny-switch">
            <input type="checkbox" id="bnyInput15">
            <span class="bny-switch-slider">
                <span>开启</span>
                <span>关闭</span>
            </span>
        </label>
        <label for="bnyInput16" class="bny-switch">
            <input type="checkbox" checked id="bnyInput16">
            <span class="bny-switch-slider">
                <span class="icon icon-yueliang"></span>
                <span class="icon icon-taiyang"></span>
            </span>
        </label>
    </div>
</form>
```
