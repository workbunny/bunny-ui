### 导航栏

<style>
    header {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 999;
    }
</style>
<header>
    <!-- 导航栏 -->
    <nav class="bny-nav" hx-ext="bny-nav">
        <!-- 导航栏标题 -->
        <div class="bny-nav-title">
            <a href="javascript:;">
                <img src="/dist/bunny.jpg" alt="bunny" />
                <!-- BunnyUI -->
            </a>
        </div>
        <!-- 导航栏主体 -->
        <ul class="bny-nav-body">
            <li class="bny-nav-item">
                <a href="javascript:;">
                    <cite>首页</cite>
                </a>
            </li>
            <li class="bny-nav-item">
                <a href="javascript:;">
                    <cite>编程</cite>
                </a>
                <!-- 导航栏子项 -->
                <ul class="bny-nav-child">
                    <li class="bny-nav-item">
                        <a href="javascript:;">
                            <cite>HTML</cite>
                        </a>
                    </li>
                    <li class="bny-nav-item">
                        <a href="javascript:;">
                            <i class="icon icon-jingbao"></i>
                            <cite>JAVASCRIPT</cite>
                        </a>
                        <!-- 导航栏子项 -->
                        <ul class="bny-nav-child">
                            <li class="bny-nav-item">
                                <a href="javascript:;">
                                    <cite>HTMX</cite>
                                </a>
                            </li>
                            <li class="bny-nav-item">
                                <a href="javascript:;">
                                    <cite>VUE</cite>
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li class="bny-nav-item">
                        <a href="javascript:;">
                            <cite>CSS</cite>
                        </a>
                    </li>
                </ul>
            </li>
            <li class="bny-nav-item">
                <a href="javascript:;">
                    <cite>关于我们</cite>
                </a>
            </li>
            <li class="bny-nav-item">
                <a href="javascript:;">
                    <cite>联系我们</cite>
                </a>
            </li>
        </ul>
    </nav>
</header>

<!-- 导航栏 -->
<nav class="bny-nav" hx-ext="bny-nav">
    <!-- 导航栏标题 -->
    <div class="bny-nav-title">
        <a href="javascript:;">
            <!-- <img src="/dist/bunny.jpg" alt="bunny"/> -->
            BunnyUI
        </a>
    </div>
    <!-- 导航栏主体 -->
    <ul class="bny-nav-body">
        <li class="bny-nav-item">
            <a href="javascript:;">
                <cite>首页</cite>
            </a>
        </li>
        <li class="bny-nav-item">
            <a href="javascript:;">
                <cite>编程</cite>
            </a>
            <!-- 导航栏子项 -->
            <ul class="bny-nav-child">
                <li class="bny-nav-item">
                    <a href="javascript:;">
                        <cite>HTML</cite>
                    </a>
                </li>
                <li class="bny-nav-item">
                    <a href="javascript:;">
                        <i class="icon icon-jingbao"></i>
                        <cite>JAVASCRIPT</cite>
                    </a>
                    <!-- 导航栏子项 -->
                    <ul class="bny-nav-child">
                        <li class="bny-nav-item">
                            <a href="javascript:;">
                                <cite>HTMX</cite>
                            </a>
                        </li>
                        <li class="bny-nav-item">
                            <a href="javascript:;">
                                <cite>VUE</cite>
                            </a>
                        </li>
                    </ul>
                </li>
                <li class="bny-nav-item">
                    <a href="javascript:;">
                        <cite>CSS</cite>
                    </a>
                </li>
            </ul>
        </li>
        <li class="bny-nav-item">
            <a href="javascript:;">
                <cite>关于我们</cite>
            </a>
        </li>
        <li class="bny-nav-item">
            <a href="javascript:;">
                <cite>联系我们</cite>
            </a>
        </li>
    </ul>
</nav>

```html
<!-- 导航栏 -->
<nav class="bny-nav" hx-ext="bny-nav">
    <!-- 导航栏标题 -->
    <div class="bny-nav-title">
        <a href="javascript:;">
            <!-- <img src="/dist/bunny.jpg" alt="bunny"/> -->
            BunnyUI
        </a>
    </div>
    <!-- 导航栏主体 -->
    <ul class="bny-nav-body">
        <li class="bny-nav-item">
            <a href="javascript:;">
                <cite>首页</cite>
            </a>
        </li>
        <li class="bny-nav-item">
            <a href="javascript:;">
                <cite>编程</cite>
            </a>
            <!-- 导航栏子项 -->
            <ul class="bny-nav-child">
                <li class="bny-nav-item">
                    <a href="javascript:;">
                        <cite>HTML</cite>
                    </a>
                </li>
                <li class="bny-nav-item">
                    <a href="javascript:;">
                        <i class="icon icon-jingbao"></i>
                        <cite>JAVASCRIPT</cite>
                    </a>
                    <!-- 导航栏子项 -->
                    <ul class="bny-nav-child">
                        <li class="bny-nav-item">
                            <a href="javascript:;">
                                <cite>HTMX</cite>
                            </a>
                        </li>
                        <li class="bny-nav-item">
                            <a href="javascript:;">
                                <cite>VUE</cite>
                            </a>
                        </li>
                    </ul>
                </li>
                <li class="bny-nav-item">
                    <a href="javascript:;">
                        <cite>CSS</cite>
                    </a>
                </li>
            </ul>
        </li>
        <li class="bny-nav-item">
            <a href="javascript:;">
                <cite>关于我们</cite>
            </a>
        </li>
        <li class="bny-nav-item">
            <a href="javascript:;">
                <cite>联系我们</cite>
            </a>
        </li>
    </ul>
</nav>
```

<div style="width: 220px;">
    <!-- 侧边导航栏 -->
    <nav class="bny-nav-lateral" hx-ext="bny-nav-lateral">
        <!-- 导航栏标题 -->
        <div class="bny-nav-title">
            <a href="javascript:;">
                <img class="nav-logo" src="/dist/bunny.jpg" alt="bunny" />
                <span class="nav-name">BunnyUI</span>
            </a>
        </div>
        <!-- 导航栏主体 -->
        <ul class="bny-nav-body">
            <li class="bny-nav-item">
                <a href="javascript:;">
                    <cite>首页</cite>
                </a>
            </li>
            <li class="bny-nav-item">
                <a href="javascript:;">
                    <cite>编程</cite>
                </a>
                <!-- 导航栏子项 -->
                <ul class="bny-nav-child">
                    <li class="bny-nav-item">
                        <a href="javascript:;">
                            <cite>HTML</cite>
                        </a>
                    </li>
                    <li class="bny-nav-item">
                        <a href="javascript:;">
                            <i class="icon icon-jingbao"></i>
                            <cite>JAVASCRIPT</cite>
                        </a>
                        <!-- 导航栏子项 -->
                        <ul class="bny-nav-child">
                            <li class="bny-nav-item">
                                <a href="javascript:;">
                                    <cite>HTMX</cite>
                                </a>
                            </li>
                            <li class="bny-nav-item">
                                <a href="javascript:;">
                                    <cite>VUE</cite>
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li class="bny-nav-item">
                        <a href="javascript:;">
                            <cite>CSS</cite>
                        </a>
                    </li>
                </ul>
            </li>
            <li class="bny-nav-item">
                <a href="javascript:;">
                    <cite>关于我们</cite>
                </a>
            </li>
            <li class="bny-nav-item">
                <a href="javascript:;">
                    <cite>联系我们</cite>
                </a>
            </li>
        </ul>
    </nav>
</div>

```html
<div style="width: 220px;">
    <!-- 侧边导航栏 -->
    <nav class="bny-nav-lateral" hx-ext="bny-nav-lateral">
        <!-- 导航栏标题 -->
        <div class="bny-nav-title">
            <a href="javascript:;">
                <img class="nav-logo" src="/dist/bunny.jpg" alt="bunny" />
                <span class="nav-name">BunnyUI</span>
            </a>
        </div>
        <!-- 导航栏主体 -->
        <ul class="bny-nav-body">
            <li class="bny-nav-item">
                <a href="javascript:;">
                    <cite>首页</cite>
                </a>
            </li>
            <li class="bny-nav-item">
                <a href="javascript:;">
                    <cite>编程</cite>
                </a>
                <!-- 导航栏子项 -->
                <ul class="bny-nav-child">
                    <li class="bny-nav-item">
                        <a href="javascript:;">
                            <cite>HTML</cite>
                        </a>
                    </li>
                    <li class="bny-nav-item">
                        <a href="javascript:;">
                            <i class="icon icon-jingbao"></i>
                            <cite>JAVASCRIPT</cite>
                        </a>
                        <!-- 导航栏子项 -->
                        <ul class="bny-nav-child">
                            <li class="bny-nav-item">
                                <a href="javascript:;">
                                    <cite>HTMX</cite>
                                </a>
                            </li>
                            <li class="bny-nav-item">
                                <a href="javascript:;">
                                    <cite>VUE</cite>
                                </a>
                            </li>
                        </ul>
                    </li>
                    <li class="bny-nav-item">
                        <a href="javascript:;">
                            <cite>CSS</cite>
                        </a>
                    </li>
                </ul>
            </li>
            <li class="bny-nav-item">
                <a href="javascript:;">
                    <cite>关于我们</cite>
                </a>
            </li>
            <li class="bny-nav-item">
                <a href="javascript:;">
                    <cite>联系我们</cite>
                </a>
            </li>
        </ul>
    </nav>
</div>
```

<!-- 侧边导航栏 -->
<nav class="bny-nav-lateral nav-toggle" hx-ext="bny-nav-lateral">
    <!-- 导航栏标题 -->
    <div class="bny-nav-title">
        <a href="javascript:;">
            <img class="nav-logo" src="/dist/bunny.jpg" alt="bunny" />
            <span class="nav-name">BunnyUI</span>
        </a>
    </div>
    <!-- 导航栏主体 -->
    <ul class="bny-nav-body">
        <li class="bny-nav-item">
            <a href="javascript:;">
                <i class="icon icon-jingbao nav-icon"></i>
                <cite>首页</cite>
            </a>
        </li>
        <li class="bny-nav-item">
            <a href="javascript:;">
                <i class="icon icon-jingbao nav-icon"></i>
                <cite>编程</cite>
            </a>
            <!-- 导航栏子项 -->
            <ul class="bny-nav-child">
                <li class="bny-nav-item">
                    <a href="javascript:;">
                        <cite>HTML</cite>
                    </a>
                </li>
                <li class="bny-nav-item">
                    <a href="javascript:;">
                        <i class="icon icon-jingbao"></i>
                        <cite>JAVASCRIPT</cite>
                    </a>
                    <!-- 导航栏子项 -->
                    <ul class="bny-nav-child">
                        <li class="bny-nav-item">
                            <a href="javascript:;">
                                <cite>HTMX</cite>
                            </a>
                        </li>
                        <li class="bny-nav-item">
                            <a href="javascript:;">
                                <cite>VUE</cite>
                            </a>
                        </li>
                    </ul>
                </li>
                <li class="bny-nav-item">
                    <a href="javascript:;">
                        <cite>CSS</cite>
                    </a>
                </li>
            </ul>
        </li>
        <li class="bny-nav-item">
            <a href="javascript:;">
                <i class="icon icon-jingbao nav-icon"></i>
                <cite>关于我们</cite>
            </a>
        </li>
        <li class="bny-nav-item">
            <a href="javascript:;">
                <i class="icon icon-jingbao nav-icon"></i>
                <cite>联系我们</cite>
            </a>
        </li>
    </ul>
</nav>

```html
<!-- 侧边导航栏 -->
<nav class="bny-nav-lateral nav-toggle" hx-ext="bny-nav-lateral">
    <!-- 导航栏标题 -->
    <div class="bny-nav-title">
        <a href="javascript:;">
            <img class="nav-logo" src="/dist/bunny.jpg" alt="bunny" />
            <span class="nav-name">BunnyUI</span>
        </a>
    </div>
    <!-- 导航栏主体 -->
    <ul class="bny-nav-body">
        <li class="bny-nav-item">
            <a href="javascript:;">
                <i class="icon icon-jingbao nav-icon"></i>
                <cite>首页</cite>
            </a>
        </li>
        <li class="bny-nav-item">
            <a href="javascript:;">
                <i class="icon icon-jingbao nav-icon"></i>
                <cite>编程</cite>
            </a>
            <!-- 导航栏子项 -->
            <ul class="bny-nav-child">
                <li class="bny-nav-item">
                    <a href="javascript:;">
                        <cite>HTML</cite>
                    </a>
                </li>
                <li class="bny-nav-item">
                    <a href="javascript:;">
                        <i class="icon icon-jingbao"></i>
                        <cite>JAVASCRIPT</cite>
                    </a>
                    <!-- 导航栏子项 -->
                    <ul class="bny-nav-child">
                        <li class="bny-nav-item">
                            <a href="javascript:;">
                                <cite>HTMX</cite>
                            </a>
                        </li>
                        <li class="bny-nav-item">
                            <a href="javascript:;">
                                <cite>VUE</cite>
                            </a>
                        </li>
                    </ul>
                </li>
                <li class="bny-nav-item">
                    <a href="javascript:;">
                        <cite>CSS</cite>
                    </a>
                </li>
            </ul>
        </li>
        <li class="bny-nav-item">
            <a href="javascript:;">
                <i class="icon icon-jingbao nav-icon"></i>
                <cite>关于我们</cite>
            </a>
        </li>
        <li class="bny-nav-item">
            <a href="javascript:;">
                <i class="icon icon-jingbao nav-icon"></i>
                <cite>联系我们</cite>
            </a>
        </li>
    </ul>
</nav>
```