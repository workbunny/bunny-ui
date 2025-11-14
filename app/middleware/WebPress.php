<?php

namespace app\middleware;

use Webman\MiddlewareInterface;
use Webman\Http\Response;
use Webman\Http\Request;
use app\common\Tool;

class WebPress implements MiddlewareInterface
{
    public function process(Request $request, callable $handler): Response
    {
        $Tool = new Tool();
        $webpress = config("webpress");
        // 基础配置
        $base = $webpress["base"];
        $Tool->assign("base", $base);
        // 网站配置
        $webInfo = $webpress["webInfo"];
        $Tool->assign($webInfo);
        // 导航栏
        $nav = $webpress["themeConfig"]["nav"];
        $Tool->assign("nav", $Tool->generateMenu($nav));
        // 联系信息
        $contact = $webpress["themeConfig"]["socialLinks"];
        $Tool->assign("contact", $contact);
        // 侧边栏
        $path = $request->path();
        if ($path == "/") {
            $path = "/index";
        }
        $data = $webpress["themeConfig"]["sidebar"];
        $key = str_replace("/" . $webpress["base"]["routeGroup"], "", $path);
        $sidebar = $Tool->getSidebarData($key, $data);
        $Tool->assign("sidebar", $Tool->getSidebar($sidebar));
        return $handler($request);
    }
}
