<?php

/**
 * 这个是webpress的配置文件
 */
return [
    // 基础配置
    "base" => [
        // 路由组
        "routeGroup" => "__webpress__",
        // 文档目录
        "directory" => app_path('markdown'),
    ],
    // 网站配置
    "webInfo" => [
        // 网站标题
        "title" => "BunnyUI",
        // 网站LOGO(图片路径)
        "logo" => "/assets/bunny/bunny.png",
        // 网站描述
        "description" => "一套 HTMX 开发模式的 Web UI 组件库，使用 AJAX、CSS 过渡、WebSockets 和 服务器推送事件，通过 属性 构建 现代用户界面，结合 简单性 和 超文本的强大功能。",
        // 网站关键词
        "keywords" => "BunnyUI, HTMX, Web, JavaScript, CSS, UI, 组件库, 前端框架",
        // 备案号
        "icp" => "粤ICP备******号",
    ],
    // 主题配置
    "themeConfig" => [
        // 导航栏
        "nav" => [
            [
                "text" => "首页",
                "link" => "/"
            ],
            [
                "text" => "文档",
                "link" => "/docs/bunny_ui",
            ],
            [
                "text" => "生态",
                "link" => "/ecology/list",
            ]
        ],
        // 侧边栏
        "sidebar" => [
            "default" => [
                [
                    "text" => "文档",
                    "children" => [
                        [
                            "text" => "什么是 BunnyUI ?",
                            "link" => "/docs/bunny_ui"
                        ],
                        [
                            "text" => "安装",
                            "link" => "/docs/install"
                        ],
                        [
                            "text" => "组件",
                            "children" => [
                                [
                                    "text" => "颜色",
                                    "link" => "/docs/components/color"
                                ],
                                [
                                    "text" => "按钮",
                                    "link" => "/docs/components/button"
                                ],
                                [
                                    "text" => "表单",
                                    "link" => "/docs/components/form"
                                ],
                                [
                                    "text" => "卡片",
                                    "link" => "/docs/components/card"
                                ],
                                [
                                    "text" => "选项卡",
                                    "link" => "/docs/components/tab"
                                ],
                                [
                                    "text" => "代码",
                                    "link" => "/docs/components/code"
                                ],
                                [
                                    "text" => "提示",
                                    "link" => "/docs/components/tips"
                                ],
                                [
                                    "text" => "走马灯",
                                    "link" => "/docs/components/marquee"
                                ],
                                [
                                    "text" => "警示",
                                    "link" => "/docs/components/alert"
                                ],
                                [
                                    "text" => "弹性盒子",
                                    "link" => "/docs/components/flexbox"
                                ],
                                [
                                    "text" => "排版",
                                    "link" => "/docs/components/typography"
                                ],
                                [
                                    "text" => "列表",
                                    "link" => "/docs/components/list"
                                ],
                                [
                                    "text" => "菜单",
                                    "link" => "/docs/components/menu"
                                ],
                                [
                                    "text" => "辅助",
                                    "link" => "/docs/components/subsidiary"
                                ],
                                [
                                    "text" => "公共类",
                                    "link" => "/docs/components/class"
                                ],
                                [
                                    "text" => "表格",
                                    "link" => "/docs/components/table"
                                ],
                                [
                                    "text" => "弹出框",
                                    "link" => "/docs/components/popup"
                                ],
                                [
                                    "text" => "面板",
                                    "link" => "/docs/components/panel"
                                ],
                                [
                                    "text" => "图标",
                                    "link" => "/docs/components/icon"
                                ],
                                [
                                    "text" => "加载",
                                    "link" => "/docs/components/loading"
                                ],
                                [
                                    "text" => "导航栏",
                                    "link" => "/docs/components/nav"
                                ],
                                [
                                    "text" => "动画",
                                    "link" => "/docs/components/anim"
                                ],
                                [
                                    "text" => "徽章",
                                    "link" => "/docs/components/badges"
                                ],
                                [
                                    "text" => "面包屑",
                                    "link" => "/docs/components/breadcrumb"
                                ],
                                [
                                    "text" => "下拉",
                                    "link" => "/docs/components/dropdown"
                                ]
                            ]
                        ]
                    ]
                ]
            ],
            "/ecology" => [
                [
                    "text" => "生态",
                    "children" => [
                        [
                            "text" => "列表说明",
                            "link" => "/ecology/list"
                        ]
                    ]
                ]
            ]
        ],
        // 联系信息
        "socialLinks" => [
            ["icon" => "icon icon-github-fill", "link" => "https://github.com/workbunny/bunny-ui"]
        ]
    ]
];
