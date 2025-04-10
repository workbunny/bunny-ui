<?php

namespace app\common;


class Tool
{
    /**
     * assign function
     *
     * @param string|array $name
     * @param mixed $value
     * @param string|null $plugin
     * @return void
     */
    public function assign(string|array $name, mixed $value = null, string $plugin = null)
    {
        $request = \request();
        $plugin = $plugin === null ? ($request->plugin ?? '') : $plugin;
        $handler = \config($plugin ? "plugin.$plugin.view.handler" : 'view.handler');
        $handler::assign($name, $value);
    }

    /**
     * 获取路由数据
     *
     * @return array
     */
    public function routeDate(): array
    {
        // 入口文件夹
        $dir = config("webpress.base.directory");
        // 文件夹后缀
        $suffix = "md";
        // 遍历获取文件夹下的所有md文件
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(
                $dir,
                \RecursiveDirectoryIterator::SKIP_DOTS
            )
        );
        $arr = [];
        // 遍历文件夹
        foreach ($files as $file) {
            if ($file->isFile() && $file->getExtension() === $suffix) {
                $arr[] = [
                    // 获取文件路径
                    "file" => $file->getPathname(),
                    // 获取文件名
                    "name" => $file->getFilename(),
                    // 获取文件相对路径
                    "path" => str_replace(
                        [$dir, ".{$suffix}", "\\"],
                        ["", "", "/"],
                        $file->getPathname()
                    ),
                    // 获取数据
                    "data" => $this->getTemplate($file->getPathname()),
                    // 获取文件创建时间
                    "time" => $file->getCTime(),
                    // 获取文件修改时间
                    "mtime" => $file->getMTime(),
                ];
            }
        }
        return $arr;
    }

    /**
     * 获取模板数据
     *
     * @param string $file 模板文件
     * @return array
     */
    public function getTemplate(string $file): array
    {
        $content = file_get_contents($file);
        $arr = $this->splitString($content);
        $data = \Symfony\Component\Yaml\Yaml::parse($arr[0]);
        $data["__CONTENT__"] = (new \Parsedown)->text($arr[1]);
        if (!isset($data["layout"])) {
            $data["layout"] = "default";
        }
        return $data;
    }

    /**
     * 分割字符串
     *
     * @param string $str
     * @return array
     */
    public function splitString(string $str): array
    {
        if (substr($str, 0, 3) !== '---') {
            return ['', $str]; // 非---开头直接返回
        }
        $pattern = '/^---(.*?)---(.*)$/s';
        if (preg_match($pattern, $str, $matches)) {
            return [trim($matches[1]), trim($matches[2])];
        }
        return ['', $str];
    }

    /**
     * 导航栏无限级菜单
     *
     * @param array $items
     * @return string
     */
    public function generateMenu(array $items): string
    {
        $html = '';
        foreach ($items as $item) {
            $html .= '<li class="bny-nav-item">';
            $link = $item['link'] ?? 'javascript:;';
            $html .= sprintf('<a href="%s">', htmlspecialchars($link, ENT_QUOTES));
            $html .= '<cite>' . htmlspecialchars($item['text']) . '</cite>';

            if (!empty($item['children'])) {
                $html .= '<i class="icon icon-you2 arrow"></i>';
            }

            $html .= '</a>';

            if (!empty($item['children'])) {
                $html .= '<ul class="bny-nav-sub">';
                $html .= $this->generateMenu($item['children']);
                $html .= '</ul>';
            }

            $html .= '</li>';
        }
        return $html;
    }

    /**
     * 左侧栏菜单
     *
     * @param array $items
     * @return string
     */
    public function getSidebar(array $items): string
    {
        $html = '';
        foreach ($items as $item) {
            $show = empty($item['children']) === false ? "showMenu" : "";
            $html .= '<li class="' . $show . '">';
            $link = $item['link'] ?? 'javascript:;';
            if (!empty($item['children'])) {
                $html .= '<div class="bny-nav-iocn">';
            }
            $html .= sprintf('<a href="%s">', htmlspecialchars($link, ENT_QUOTES));
            $html .= htmlspecialchars($item['text']);
            $html .= '</a>';
            if (!empty($item['children'])) {
                $html .= '<i class="icon icon-xia2 arrow"></i>';
                $html .= '</div>';
            }
            if (!empty($item['children'])) {
                $html .= '<ul class="bny-nav-child">';
                $html .= $this->getSidebar($item['children']);
                $html .= '</ul>';
            }
        }
        return $html;
    }


    /**
     * 在 Markdown 字符串中根据关键词搜索相关内容块
     *
     * @param string $mdString 要搜索的 Markdown 字符串
     * @param string $keyword 搜索的关键词
     * @return string 包含关键词的 Markdown 内容块，如果未找到则返回空字符串
     */
    public function searchMdByKeyword(string $mdString, string $keyword): string
    {
        // 将 Markdown 字符串按行分割成数组
        $lines = explode("\n", $mdString);
        // 用于存储所有的标题块
        $blocks = [];
        // 当前正在处理的标题块
        $currentBlock = null;
        // 标记是否处于代码块中
        $inCodeBlock = false;

        // 遍历每一行
        foreach ($lines as $line) {
            // 处理代码块标记
            if (strpos(trim($line), '```') === 0) {
                // 切换代码块状态
                $inCodeBlock = !$inCodeBlock;
                // 跳过当前行
                continue;
            }
            // 如果处于代码块中，跳过当前行
            if ($inCodeBlock) {
                continue;
            }

            // 检查是否为标题行
            if (preg_match('/^(#+)\s+(.*)/', $line, $matches)) {
                if ($currentBlock !== null) {
                    // 如果当前有标题块，将其添加到 blocks 数组中
                    $blocks[] = $currentBlock;
                }
                // 创建新的标题块
                $currentBlock = [
                    // 标题级别
                    'level' => strlen($matches[1]),
                    // 标题内容
                    'title' => $matches[2],
                    // 标题下的内容
                    'content' => []
                ];
            } else {
                if ($currentBlock !== null) {
                    // 将当前行添加到当前标题块的内容中
                    $currentBlock['content'][] = $line;
                }
            }
        }
        if ($currentBlock !== null) {
            // 将最后一个标题块添加到 blocks 数组中
            $blocks[] = $currentBlock;
        }

        // 搜索包含关键词的块
        foreach ($blocks as $block) {
            // 遍历每个标题块的内容行
            foreach ($block['content'] as $contentLine) {
                // 检查当前行是否包含关键词
                if (strpos($contentLine, $keyword) !== false) {
                    // 构造包含关键词的标题块结果
                    $result = str_repeat('#', $block['level']) . ' ' . $block['title'] . "\n\n";
                    // 将标题块的内容添加到结果中
                    $result .= implode("\n", $block['content']);
                    return $result;
                }
            }
        }

        // 如果未找到包含关键词的块，返回空字符串
        return '';
    }

    /**
     * 根据给定的路径获取侧边栏数据
     *
     * 该方法会尝试从提供的数据数组中查找与给定路径匹配的侧边栏数据。
     * 如果直接匹配失败，会尝试查找路径前缀匹配的键。
     * 如果仍然没有找到匹配项，则使用默认路径 "default"。
     *
     * @param string $path 要查找的路径
     * @param array $data 包含侧边栏数据的数组，键为路径，值为对应的侧边栏数据
     * @return array 匹配路径的侧边栏数据
     */
    public function getSidebarData(string $path, array $data): array
    {
        // 检查数据数组中是否存在给定路径的键
        if (!isset($data[$path])) {
            // 获取数据数组的所有键
            $keys = array_keys($data);
            // 遍历所有键，查找路径前缀匹配的键
            foreach ($keys as $k => $v) {
                // 检查路径是否以当前键为前缀
                if (str_starts_with($path, $v)) {
                    // 如果匹配，将路径更新为匹配的键
                    $path = $v;
                    // 找到匹配项后，跳出循环
                    break;
                }
            }
            // 再次检查更新后的路径是否存在于数据数组中
            if (!isset($data[$path])) {
                // 如果仍然不存在，使用默认路径
                $path = "default";
            }
            // 获取匹配路径的侧边栏数据
            $sidebar = $data[$path];
        } else {
            // 如果数据数组中存在给定路径的键，直接获取对应的数据
            $sidebar = $data[$path];
        }
        // 返回匹配路径的侧边栏数据
        return $sidebar;
    }

    public function extractLinks(array $array)
    {
        $result = array();
        foreach ($array as $item) {
            if (isset($item['link'])) {
                $result[] = array(
                    'text' => isset($item['text']) ? $item['text'] : '',
                    'link' => $item['link']
                );
            }
            if (isset($item['children'])) {
                $result = array_merge($result, $this->extractLinks($item['children']));
            }
        }
        return $result;
    }
}
