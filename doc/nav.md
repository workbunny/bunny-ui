导航栏

<style>
    header {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 999;
        background: var(--white);
    }

    header i,
    header a {
        color: var(--primary);
    }
</style>
<header>
    <nav class="bny-nav" hx-ext="bny-nav">
        <div class="bny-nav-data">
            <!-- 品牌 -->
            <div class="bny-nav-brand">
                <a href="#">BunnyUI</a>
            </div>
            <!-- 切换 -->
            <div class="bny-nav-toggle">
                <i class="icon icon-gengduo1 burger"></i>
                <i class="icon icon-cuo close"></i>
            </div>
        </div>
        <!-- 菜单 -->
        <div class="bny-nav-menu">
            <menu>
                <li>
                    <a href="#">首页</a>
                </li>
                <li>
                    <a href="#">公司</a>
                </li>
                <!-- 子菜单 -->
                <li class="bny-nav-dropdown">
                    <a href="javascript:;">
                        分析
                        <i class="icon icon-you2 arrow"></i>
                    </a>
                    <menu>
                        <li>
                            <a href="#">概述</a>
                        </li>
                        <li>
                            <a href="#">交易</a>
                        </li>
                        <!-- 孙菜单 -->
                        <li class="bny-nav-dropdown">
                            <a href="javascript:;">
                                报告
                                <i class="icon icon-jia add"></i>
                            </a>
                            <menu>
                                <li>
                                    <a href="#">文档</a>
                                </li>
                                <li>
                                    <a href="#">支付</a>
                                </li>
                                <li>
                                    <a href="#">退款</a>
                                </li>
                            </menu>
                        </li>
                    </menu>
                </li>
                <li><a href="#">产品</a></li>
                <!-- 子菜单 -->
                <li class="bny-nav-dropdown">
                    <a href="javascript:;">
                        用户
                        <i class="icon icon-you2 arrow"></i>
                    </a>
                    <menu>
                        <li>
                            <a href="#">配置信息</a>
                        </li>
                        <li>
                            <a href="#">账户</a>
                        </li>
                        <li>
                            <a href="#">留言</a>
                        </li>
                    </menu>
                </li>
                <li><a href="#">关于我们</a></li>
            </menu>
        </div>
    </nav>
</header>
<nav class="bny-nav" hx-ext="bny-nav">
    <div class="bny-nav-data">
        <!-- 品牌 -->
        <div class="bny-nav-brand">
            <a href="#">BunnyUI</a>
        </div>
        <!-- 切换 -->
        <div class="bny-nav-toggle">
            <i class="icon icon-gengduo1 burger"></i>
            <i class="icon icon-cuo close"></i>
        </div>
    </div>
    <!-- 菜单 -->
    <div class="bny-nav-menu">
        <menu>
            <li>
                <a href="#">首页</a>
            </li>
            <li>
                <a href="#">公司</a>
            </li>
            <!-- 子菜单 -->
            <li class="bny-nav-dropdown">
                <a href="javascript:;">
                    分析
                    <i class="icon icon-you2 arrow"></i>
                </a>
                <menu>
                    <li>
                        <a href="#">概述</a>
                    </li>
                    <li>
                        <a href="#">交易</a>
                    </li>
                    <!-- 孙菜单 -->
                    <li class="bny-nav-dropdown">
                        <a href="javascript:;">
                            报告
                            <i class="icon icon-jia add"></i>
                        </a>
                        <menu>
                            <li>
                                <a href="#">文档</a>
                            </li>
                            <li>
                                <a href="#">支付</a>
                            </li>
                            <li>
                                <a href="#">退款</a>
                            </li>
                        </menu>
                    </li>
                </menu>
            </li>
            <li><a href="#">产品</a></li>
            <!-- 子菜单 -->
            <li class="bny-nav-dropdown">
                <a href="javascript:;">
                    用户
                    <i class="icon icon-you2 arrow"></i>
                </a>
                <menu>
                    <li>
                        <a href="#">配置信息</a>
                    </li>
                    <li>
                        <a href="#">账户</a>
                    </li>
                    <li>
                        <a href="#">留言</a>
                    </li>
                </menu>
            </li>
            <li><a href="#">关于我们</a></li>
        </menu>
    </div>
</nav>