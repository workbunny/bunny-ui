### 静态

<pre class="language-html"><code>function add(x, y) {
return x + y;
}</code></pre>

代码：

```html
<pre class="language-html"><code>function add(x, y) {
return x + y;
}</code></pre>
```

### 动态

<div hx-get="doc/code/code.php" hx-ext="bny-code" hx-trigger="load"></div>

html代码：

```html
<div hx-get="doc/code/code.php" hx-ext="bny-code" hx-trigger="load"></div>
```

文件代码：

```php
<?php

echo "hello world";
```