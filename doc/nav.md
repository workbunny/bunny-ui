### 导航栏

<!-- 导航栏 -->
<nav class="bny-nav" hx-ext="bny-nav">
    <!-- 导航栏标题 -->
    <div class="bny-nav-title">
        <a href="javascript:;">
            <!-- <img src="/dist/bunny.jpg" alt="bunny" /> -->
            BunnyUI
        </a>
        <button class="bny-btn toggle">
            <i class="icon icon-gengduo1"></i>
        </button>
    </div>
    <!-- 导航栏主体 -->
    <ul class="bny-nav-body">
        <li class="bny-nav-item">
            <a href="javascript:;">
                <cite>首页</cite>
            </a>
        </li>
        <li class="bny-nav-item active">
            <a href="javascript:;">
                <cite>编程</cite>
            </a>
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
            BunnyUI
        </a>
        <button class="bny-btn toggle">
            <i class="icon icon-gengduo1"></i>
        </button>
    </div>
    <!-- 导航栏主体 -->
    <ul class="bny-nav-body">
        <li class="bny-nav-item">
            <a href="javascript:;">
                <cite>首页</cite>
            </a>
        </li>
        <li class="bny-nav-item active">
            <a href="javascript:;">
                <cite>编程</cite>
            </a>
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

### 侧边栏

<nav class="bny-nav-lateral" hx-ext="bny-nav-lateral">
    <!-- logo详情 -->
    <div class="bny-nav-title">
        <img src="/dist/bunny.png" alt="bunny" class="logo" />
        <span class="bny-nav-text">BunnyUI</span>
    </div>
    <!-- 导航栏主体 -->
    <ul class="bny-nav-body">
        <li>
            <a href="#">
                <i class="icon icon-weixin"></i>
                <span class="bny-nav-name">控制台</span>
            </a>
            <ul class="bny-nav-child">
                <li><a class="bny-nav-name" href="#">控制台</a></li>
            </ul>
        </li>
        <li>
            <div class="bny-nav-iocn">
                <a href="#">
                    <i class="icon icon-weixin"></i>
                    <span class="bny-nav-name">项目</span>
                </a>
                <i class="icon icon-xia2 arrow"></i>
            </div>
            <ul class="bny-nav-child">
                <li><a class="bny-nav-name" href="#">项目</a></li>
                <li><a href="#">HTML & CSS</a></li>
                <li><a href="#">JavaScript</a></li>
            </ul>
        </li>
        <li>
            <div class="bny-nav-iocn">
                <a href="#">
                    <i class="icon icon-weixin"></i>
                    <span class="bny-nav-name">分类</span>
                </a>
                <i class="icon icon-xia2 arrow"></i>
            </div>
            <ul class="bny-nav-child">
                <li><a class="bny-nav-name" href="#">分类</a></li>
                <li>
                    <div class="bny-nav-iocn">
                        <a href="#">
                            <i class="icon icon-weixin"></i>
                            <span>网站设置</span>
                        </a>
                        <i class="icon icon-xia2 arrow"></i>
                    </div>
                    <ul class="bny-nav-child">
                        <li><a class="bny-nav-name" href="#">网站设置</a></li>
                        <li><a href="#">网站设置1</a></li>
                        <li><a href="#">网站设置2</a></li>
                    </ul>
                </li>
                <li><a href="#">登录菜单</a></li>
                <li><a href="#">卡片</a></li>
            </ul>
        </li>
        <li>
            <a href="#">
                <i class="icon icon-weixin"></i>
                <span class="bny-nav-name">个人信息</span>
            </a>
            <ul class="bny-nav-child">
                <li><a class="bny-nav-name" href="#">个人信息</a></li>
            </ul>
        </li>
        <li>
            <a href="#">
                <i class="icon icon-weixin"></i>
                <span class="bny-nav-name">我的信息</span>
            </a>
            <ul class="bny-nav-child">
                <li><a class="bny-nav-name" href="#">我的信息</a></li>
            </ul>
        </li>
        <li>
            <a href="#">
                <i class="icon icon-weixin"></i>
                <span class="bny-nav-name">Setting</span>
            </a>
            <ul class="bny-nav-child">
                <li><a class="bny-nav-name" href="#">Setting</a></li>
            </ul>
        </li>
    </ul>
</nav>

```html
<nav class="bny-nav-lateral" hx-ext="bny-nav-lateral">
    <!-- logo详情 -->
    <div class="bny-nav-title">
        <img src="/dist/bunny.png" alt="bunny" class="logo" />
        <span class="bny-nav-text">BunnyUI</span>
    </div>
    <!-- 导航栏主体 -->
    <ul class="bny-nav-body">
        <li>
            <a href="#">
                <i class="icon icon-weixin"></i>
                <span class="bny-nav-name">控制台</span>
            </a>
            <ul class="bny-nav-child">
                <li><a class="bny-nav-name" href="#">控制台</a></li>
            </ul>
        </li>
        <li>
            <div class="bny-nav-iocn">
                <a href="#">
                    <i class="icon icon-weixin"></i>
                    <span class="bny-nav-name">项目</span>
                </a>
                <i class="icon icon-xia2 arrow"></i>
            </div>
            <ul class="bny-nav-child">
                <li><a class="bny-nav-name" href="#">项目</a></li>
                <li><a href="#">HTML & CSS</a></li>
                <li><a href="#">JavaScript</a></li>
            </ul>
        </li>
        <li>
            <div class="bny-nav-iocn">
                <a href="#">
                    <i class="icon icon-weixin"></i>
                    <span class="bny-nav-name">分类</span>
                </a>
                <i class="icon icon-xia2 arrow"></i>
            </div>
            <ul class="bny-nav-child">
                <li><a class="bny-nav-name" href="#">分类</a></li>
                <li>
                    <div class="bny-nav-iocn">
                        <a href="#">
                            <i class="icon icon-weixin"></i>
                            <span>网站设置</span>
                        </a>
                        <i class="icon icon-xia2 arrow"></i>
                    </div>
                    <ul class="bny-nav-child">
                        <li><a class="bny-nav-name" href="#">网站设置</a></li>
                        <li><a href="#">网站设置1</a></li>
                        <li><a href="#">网站设置2</a></li>
                    </ul>
                </li>
                <li><a href="#">登录菜单</a></li>
                <li><a href="#">卡片</a></li>
            </ul>
        </li>
        <li>
            <a href="#">
                <i class="icon icon-weixin"></i>
                <span class="bny-nav-name">个人信息</span>
            </a>
            <ul class="bny-nav-child">
                <li><a class="bny-nav-name" href="#">个人信息</a></li>
            </ul>
        </li>
        <li>
            <a href="#">
                <i class="icon icon-weixin"></i>
                <span class="bny-nav-name">我的信息</span>
            </a>
            <ul class="bny-nav-child">
                <li><a class="bny-nav-name" href="#">我的信息</a></li>
            </ul>
        </li>
        <li>
            <a href="#">
                <i class="icon icon-weixin"></i>
                <span class="bny-nav-name">Setting</span>
            </a>
            <ul class="bny-nav-child">
                <li><a class="bny-nav-name" href="#">Setting</a></li>
            </ul>
        </li>
    </ul>
</nav>
```

<nav class="bny-nav-lateral close" hx-ext="bny-nav-lateral">
    <!-- logo详情 -->
    <div class="bny-nav-title">
        <img src="/dist/bunny.png" alt="bunny" class="logo" />
        <span class="bny-nav-text">BunnyUI</span>
    </div>
    <!-- 导航栏主体 -->
    <ul class="bny-nav-body">
        <li>
            <a href="#">
                <i class="icon icon-weixin"></i>
                <span class="bny-nav-name">控制台</span>
            </a>
            <ul class="bny-nav-child">
                <li><a class="bny-nav-name" href="#">控制台</a></li>
            </ul>
        </li>
        <li>
            <div class="bny-nav-iocn">
                <a href="#">
                    <i class="icon icon-weixin"></i>
                    <span class="bny-nav-name">项目</span>
                </a>
                <i class="icon icon-xia2 arrow"></i>
            </div>
            <ul class="bny-nav-child">
                <li><a class="bny-nav-name" href="#">项目</a></li>
                <li><a href="#">HTML & CSS</a></li>
                <li><a href="#">JavaScript</a></li>
            </ul>
        </li>
        <li>
            <div class="bny-nav-iocn">
                <a href="#">
                    <i class="icon icon-weixin"></i>
                    <span class="bny-nav-name">分类</span>
                </a>
                <i class="icon icon-xia2 arrow"></i>
            </div>
            <ul class="bny-nav-child">
                <li><a class="bny-nav-name" href="#">分类</a></li>
                <li>
                    <div class="bny-nav-iocn">
                        <a href="#">
                            <i class="icon icon-weixin"></i>
                            <span>网站设置</span>
                        </a>
                        <i class="icon icon-xia2 arrow"></i>
                    </div>
                    <ul class="bny-nav-child">
                        <li><a class="bny-nav-name" href="#">网站设置</a></li>
                        <li><a href="#">网站设置1</a></li>
                        <li><a href="#">网站设置2</a></li>
                    </ul>
                </li>
                <li><a href="#">登录菜单</a></li>
                <li><a href="#">卡片</a></li>
            </ul>
        </li>
        <li>
            <a href="#">
                <i class="icon icon-weixin"></i>
                <span class="bny-nav-name">个人信息</span>
            </a>
            <ul class="bny-nav-child">
                <li><a class="bny-nav-name" href="#">个人信息</a></li>
            </ul>
        </li>
        <li>
            <a href="#">
                <i class="icon icon-weixin"></i>
                <span class="bny-nav-name">我的信息</span>
            </a>
            <ul class="bny-nav-child">
                <li><a class="bny-nav-name" href="#">我的信息</a></li>
            </ul>
        </li>
        <li>
            <a href="#">
                <i class="icon icon-weixin"></i>
                <span class="bny-nav-name">Setting</span>
            </a>
            <ul class="bny-nav-child">
                <li><a class="bny-nav-name" href="#">Setting</a></li>
            </ul>
        </li>
    </ul>
</nav>

```html
<nav class="bny-nav-lateral close" hx-ext="bny-nav-lateral">
    ...
</nav>
```