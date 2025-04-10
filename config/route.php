<?php

/**
 * This file is part of webman.
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the MIT-LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @author    walkor<walkor@workerman.net>
 * @copyright walkor<walkor@workerman.net>
 * @link      http://www.workerman.net/
 * @license   http://www.opensource.org/licenses/mit-license.php MIT License
 */

use Webman\Route;
use app\common\Tool;

// 工具箱
$tool = new Tool();

// 获取路由数据
$routeDate = $tool->routeDate();

// 首页
Route::get("/", function () use ($tool) {
    $index = $tool->getTemplate(config("webpress.base.directory") . "/index.md");
    // 返回首页数据
    return view("index", $index);
});

// 文档
foreach ($routeDate as $key => $value) {
    Route::get("/" . config("webpress.base.routeGroup") . $value["path"], function () use ($value) {
        return view("template/" . $value["data"]["layout"], $value["data"]);
    });

    Route::get($value["path"], function () use ($value) {
        return view("index", $value["data"]);
    });
}

// 静态文件
Route::any("/assets/[{path:.+}]", function ($request, $path = '') {
    // 静态文件目录
    $static_base_path = app_path("assets");
    // 安全检查，避免url里 /../../../password 这样的非法访问
    if (strpos($path, '..') !== false) {
        return response('<h1>400 Bad Request</h1>', 400);
    }
    // 文件
    $file = "$static_base_path/$path";
    if (!is_file($file)) {
        return response('<h1>404 Not Found</h1>', 404);
    }
    return response('')->withFile($file);
});

// 搜索
Route::get("/" . config("webpress.base.routeGroup") . "/search", function ($request) use ($tool) {
    $keyword = $request->get("keyword");
    $path = $request->get("path");
    $arr = $tool->extractLinks($tool->getSidebarData($path, config("webpress.themeConfig.sidebar")));
    $data = [];
    $prefix = config("webpress.base.directory");
    foreach ($arr as $key => $value) {
        $file_content = file_get_contents($prefix . $value["link"] . ".md");
        $md = $tool->splitString($file_content);
        $content = $tool->searchMdByKeyword($md[1], $keyword);
        if ($content != "") {
            $data[] = [
                "text" => $value["text"],
                "content" => $content,
                "link" => $value["link"]
            ];
        }
    }
    return view("search", ["data" => $data]);
});

// 404
Route::fallback(function () {
    return view("404");
});

// 禁止默认路由
Route::disableDefaultRoute();
