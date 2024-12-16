<p>静态：</p>
<p>横向</p>
<menu class="bny-menu">
    <li>
        <a href="#">
            <i class="icon icon-shouye"></i>
            <span>首页</span>
        </a>
    </li>
    <li>
        <a href="javascript:;">
            <i class="icon icon-ziyuan"></i>
            <span>资源</span>
        </a>
        <menu>
            <li>
                <a href="">
                    <i class="icon icon-shezhi"></i>
                    <span>设置</span>
                </a>
            </li>
            <li>
                <a href="">
                    <i class="icon icon-shezhi"></i>
                    <span>设置</span>
                </a>
                <menu>
                    <li>
                        <a href="">
                            <i class="icon icon-shezhi"></i>
                            <span>设置3</span>
                        </a>
                    </li>
                    <li>
                        <a href="">
                            <i class="icon icon-shezhi"></i>
                            <span>设置3</span>
                        </a>
                    </li>
                </menu>
            </li>
        </menu>
    </li>
    <li>
        <a href="#">
            <i class="icon icon-shouye"></i>
            <span>首页</span>
        </a>
    </li>
    <li>
        <a href="#">
            <i class="icon icon-shouye"></i>
            <span>首页</span>
        </a>
    </li>
</menu>

代码：

```html
<menu class="bny-menu">
    <li>
        <a href="#">
            <i class="icon icon-shouye"></i>
            <span>首页</span>
        </a>
    </li>
    <li>
        <a href="javascript:;">
            <i class="icon icon-ziyuan"></i>
            <span>资源</span>
        </a>
        <menu>
            <li>
                <a href="">
                    <i class="icon icon-shezhi"></i>
                    <span>设置</span>
                </a>
            </li>
            <li>
                <a href="">
                    <i class="icon icon-shezhi"></i>
                    <span>设置</span>
                </a>
                <menu>
                    <li>
                        <a href="">
                            <i class="icon icon-shezhi"></i>
                            <span>设置3</span>
                        </a>
                    </li>
                    <li>
                        <a href="">
                            <i class="icon icon-shezhi"></i>
                            <span>设置3</span>
                        </a>
                    </li>
                </menu>
            </li>
        </menu>
    </li>
    <li>
        <a href="#">
            <i class="icon icon-shouye"></i>
            <span>首页</span>
        </a>
    </li>
    <li>
        <a href="#">
            <i class="icon icon-shouye"></i>
            <span>首页</span>
        </a>
    </li>
</menu>
```

<br>
<p>纵向</p>
<menu class="bny-menu" vertical>
    <li>
        <a href="#">
            <i class="icon icon-shouye"></i>
            <span>首页</span>
        </a>
    </li>
    <li>
        <a href="javascript:;">
            <i class="icon icon-ziyuan"></i>
            <span>资源</span>
        </a>
        <menu>
            <li>
                <a href="">
                    <i class="icon icon-shezhi"></i>
                    <span>设置</span>
                </a>
            </li>
            <li>
                <a href="">
                    <i class="icon icon-shezhi"></i>
                    <span>设置</span>
                </a>
                <menu>
                    <li>
                        <a href="">
                            <i class="icon icon-shezhi"></i>
                            <span>设置3</span>
                        </a>
                    </li>
                    <li>
                        <a href="">
                            <i class="icon icon-shezhi"></i>
                            <span>设置3</span>
                        </a>
                    </li>
                </menu>
            </li>
        </menu>
    </li>
    <li>
        <a href="#">
            <i class="icon icon-shouye"></i>
            <span>首页</span>
        </a>
    </li>
    <li>
        <a href="#">
            <i class="icon icon-shouye"></i>
            <span>首页</span>
        </a>
    </li>
</menu>

代码：

```html
<menu class="bny-menu" vertical>
    <li>
        <a href="#">
            <i class="icon icon-shouye"></i>
            <span>首页</span>
        </a>
    </li>
    <li>
        <a href="javascript:;">
            <i class="icon icon-ziyuan"></i>
            <span>资源</span>
        </a>
        <menu>
            <li>
                <a href="">
                    <i class="icon icon-shezhi"></i>
                    <span>设置</span>
                </a>
            </li>
            <li>
                <a href="">
                    <i class="icon icon-shezhi"></i>
                    <span>设置</span>
                </a>
                <menu>
                    <li>
                        <a href="">
                            <i class="icon icon-shezhi"></i>
                            <span>设置3</span>
                        </a>
                    </li>
                    <li>
                        <a href="">
                            <i class="icon icon-shezhi"></i>
                            <span>设置3</span>
                        </a>
                    </li>
                </menu>
            </li>
        </menu>
    </li>
    <li>
        <a href="#">
            <i class="icon icon-shouye"></i>
            <span>首页</span>
        </a>
    </li>
    <li>
        <a href="#">
            <i class="icon icon-shouye"></i>
            <span>首页</span>
        </a>
    </li>
</menu>
```

<br>
<p>动态：</p>
<div hx-swap="outerHTML" hx-trigger="load" hx-get="doc/json/menu/demo01.json" hx-ext="bny-menu"></div>

html代码：

```html
<div hx-swap="outerHTML" hx-trigger="load" hx-get="doc/json/menu/demo01.json" hx-ext="bny-menu"></div>
```

json代码：

```json
{
    "code": 1,
    "data": [
        {
            "url": "#",
            "icon": "icon icon-shouye",
            "title": "首页"
        },
        {
            "url": "javascript:;",
            "icon": "icon icon-shezhi",
            "title": "设置",
            "children": [
                {
                    "url": "#",
                    "icon": "icon icon-ziyuan",
                    "title": "资源"
                }
            ]
        }
    ],
    "msg": "请求成功"
}
```

<br>
<div hx-swap="outerHTML" hx-trigger="load" hx-get="doc/json/menu/demo01.json" hx-ext="bny-menu" vertical>
</div>

html代码：

```html
<div hx-swap="outerHTML" hx-trigger="load" hx-get="doc/json/menu/demo01.json" hx-ext="bny-menu" vertical>
</div>
```