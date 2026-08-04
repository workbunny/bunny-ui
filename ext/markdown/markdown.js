/**
 * bny-md — Markdown 渲染扩展（外部扩展）
 *
 * 设计：
 * - HTMX 扩展，通过 hx-ext="bny-md" 启用
 * - 运行时将 Markdown 文本解析为 HTML，映射到 bny-ui 组件
 * - 支持基本语法 + GFM 扩展语法 + 常用 hack
 * - 提供插件机制 bny.md.block/inline/use/remove
 * - 两种触发：元素触发（<div bny-md>）+ 响应触发（.md 文件 / text/markdown）
 * - 默认安全模式防 XSS，可配置开启内联 HTML
 *
 * 依赖：bunny.js（提供 htmx、bny 全局对象）
 * 引入方式：在 bunny.js 之后通过 <script src="markdown.js"> 引入
 *
 * 用法：
 *   <link rel="stylesheet" href="markdown.css">
 *   <script src="bunny.js"></script>
 *   <script src="markdown.js"></script>
 *
 *   <!-- 元素触发：hx-ext="bny-md" 所在元素本身就是 Markdown 容器 -->
 *   <div hx-ext="bny-md">
 *   # Hello
 *
 *   这段 textContent 会被解析为 Markdown 并替换 innerHTML
 *   </div>
 *
 *   <!-- 元素级配置：bny-md-config 写在同一标签 -->
 *   <div hx-ext="bny-md" bny-md-config='{"breaks":true}'>
 *   第一行
 *   第二行
 *   </div>
 *
 *   <!-- 响应触发：在 button 等触发器上写 hx-ext="bny-md" 拦截 .md 响应 -->
 *   <button hx-get="doc.md" hx-target="#out" hx-ext="bny-md">加载</button>
 *
 *   <!-- 命令式 -->
 *   <script>document.getElementById('out').innerHTML = bny.markdown('# Hello');</script>
 *
 * 属性：
 *   hx-ext="bny-md"   — 启用扩展；所在元素即为 Markdown 容器（元素触发）
 *   bny-md-config     — JSON 配置（元素级，写在与 hx-ext 相同的标签上）
 *
 * 全局 API：
 *   bny.markdown(text, options)           — 渲染为 HTML
 *   bny.md.block(rule)                    — 注册块级规则
 *   bny.md.inline(rule)                   — 注册行内规则
 *   bny.md.use(plugin)                    — 批量注册
 *   bny.md.remove(name)                   — 取消注册
 */
(function () {
    'use strict';

    // ==================== 依赖检查 ====================

    if (typeof htmx === 'undefined') {
        console.error('[bny-md] 需要 htmx 支持，请先引入 bunny.js');
        return;
    }
    if (typeof bny === 'undefined') {
        console.error('[bny-md] 需要 bny 支持，请先引入 bunny.js');
        return;
    }

    // ==================== 默认配置 ====================

    var DEFAULT_OPTIONS = {
        html: false,            // 是否允许内联 HTML
        linkTarget: '_blank',   // 链接 target 属性
        breaks: false,          // 单换行是否转为 <br>
        headerIds: true,        // 是否为标题自动生成 id
        emoji: true             // 是否解析 emoji 短码
    };

    // ==================== 内联 HTML 白名单 ====================

    // 安全标签白名单（html: true 时放行）
    var HTML_TAG_WHITELIST = [
        'ins', 'font', 'img', 'figure', 'figcaption', 'center', 'br', 'hr',
        'span', 'b', 'i', 'em', 'strong', 'a', 'sup', 'sub', 'mark', 'del',
        'dl', 'dt', 'dd', 'ul', 'ol', 'li', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'pre', 'code', 'input', 'kbd', 'details', 'summary', 's', 'u'
    ];

    // 危险标签黑名单（始终过滤，即使 html: true）
    var HTML_TAG_BLACKLIST = ['script', 'iframe', 'object', 'embed', 'link', 'style', 'meta', 'base', 'form'];

    // ==================== Emoji 映射表 ====================

    var EMOJI_MAP = {
        'warning': '⚠️', 'memo': '📝', 'bulb': '💡', 'heart': '❤️',
        'thumbsup': '👍', 'thumbsdown': '👎', 'rocket': '🚀',
        'white_check_mark': '✅', 'sparkles': '✨', 'fire': '🔥',
        'tada': '🎉', 'bug': '🐛', 'book': '📖', 'books': '📚',
        'gear': '⚙️', 'wrench': '🔧', 'hammer': '🔨', 'package': '📦',
        'rocket': '🚀', 'star': '⭐', 'eyes': '👀', 'brain': '🧠',
        'snake': '🐍', 'whale': '🐳', 'turtle': '🐢', 'elephant': '🐘',
        'dog': '🐶', 'cat': '🐱', 'mouse': '🐭', 'hamster': '🐹',
        'rabbit': '🐰', 'bear': '🐻', 'panda': '🐼', 'koala': '🐨',
        'tiger': '🐯', 'lion': '🦁', 'cow': '🐮', 'pig': '🐷',
        'frog': '🐸', 'monkey': '🐵', 'chicken': '🐔', 'penguin': '🐧',
        'bird': '🐦', 'duck': '🦆', 'eagle': '🦅', 'owl': '🦉',
        'bat': '🦇', 'wolf': '🐺', 'boar': '🐗', 'horse': '🐴',
        'unicorn': '🦄', 'bee': '🐝', 'worm': '🐛', 'fish': '🐟',
        'tropical_fish': '🐠', 'blowfish': '🐡', 'octopus': '🐙',
        'shell': '🐚', 'snail': '🐌', 'butterfly': '🦋', 'bug': '🐛',
        'ant': '🐜', 'hive': '🐝', 'ladybug': '🐞', 'cricket': '🦗',
        'spider': '🕷️', 'web': '🕸️', 'scorpion': '🦂', 'mosquito': '🦟',
        'fly': '🪰', 'worm': '🪱', 'microbe': '🦠', 'clipboard': '📋',
        'memo': '📝', 'pencil': '✏️', 'pen': '🖊️', 'paintbrush': '🖌️',
        'crayon': '🖍️', 'briefcase': '💼', 'file_folder': '📁',
        'card_index': '🗂️', 'calendar': '📅', 'tear_off': '🗓️',
        'spiral_notepad': '🗒️', 'spiral_calendar': '🗓️',
        'chart_up': '📈', 'chart_down': '📉', 'bar_chart': '📊',
        'clipboard': '📋', 'pushpin': '📌', 'round_pushpin': '📍',
        'paperclip': '📎', 'link': '🔗', 'paperclips': '🖇️',
        'triangular_ruler': '📐', 'straight_ruler': '📏',
        'bookmark': '🔖', 'labels': '🏷️', 'moneybag': '💰',
        'yen': '💴', 'dollar': '💵', 'euro': '💶', 'pound': '💷',
        'money_wings': '💸', 'credit_card': '💳', 'receipt': '🧾', 'chart': '💹'
    };

    // ==================== 插件注册表 ====================

    // 规则注册表，按 LIFO 顺序存储（数组末尾 = 后注册 = 高优先级）
    var _blockRules = [];   // 块级规则
    var _inlineRules = [];  // 行内规则

    /**
     * 注册块级规则
     * @param {Object} rule { name, test(正则或函数), render(match, ctx), multiline? }
     */
    function registerBlock(rule) {
        if (!rule || !rule.name) {
            console.error('[bny-md] block 规则需要 name 属性');
            return;
        }
        // 同名规则先移除（允许覆盖）
        unregister(rule.name);
        _blockRules.push(rule);
    }

    /**
     * 注册行内规则
     * @param {Object} rule { name, test(正则或函数), render(match, ctx) }
     */
    function registerInline(rule) {
        if (!rule || !rule.name) {
            console.error('[bny-md] inline 规则需要 name 属性');
            return;
        }
        unregister(rule.name);
        _inlineRules.push(rule);
    }

    /**
     * 批量注册插件
     * @param {Object} plugin { name, block: [], inline: [] }
     */
    function usePlugin(plugin) {
        if (!plugin || !plugin.name) {
            console.error('[bny-md] 插件需要 name 属性');
            return;
        }
        if (Array.isArray(plugin.block)) {
            plugin.block.forEach(function (r) {
                if (!r.name) r.name = plugin.name + '-block';
                registerBlock(r);
            });
        }
        if (Array.isArray(plugin.inline)) {
            plugin.inline.forEach(function (r) {
                if (!r.name) r.name = plugin.name + '-inline';
                registerInline(r);
            });
        }
    }

    /**
     * 取消注册规则
     * @param {string} name 规则名称
     */
    function unregister(name) {
        _blockRules = _blockRules.filter(function (r) { return r.name !== name; });
        _inlineRules = _inlineRules.filter(function (r) { return r.name !== name; });
    }

    // ==================== 工具函数 ====================

    /**
     * HTML 转义（复用 bny.escapeChars）
     */
    function escapeHtml(text) {
        if (typeof bny !== 'undefined' && typeof bny.escapeChars === 'function') {
            return bny.escapeChars(text);
        }
        // 兜底实现
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * 过滤危险 URL 协议（防止 javascript:/vbscript: 等 XSS）
     *
     * 背景：filterDangerousHtml 仅在 html:true 时过滤“原始 HTML 文本”中的
     * <a href="javascript:">，但 Markdown 链接/图片语法 [text](url) 是在
     * parseInline 阶段“生成” <a>/<img> 标签的，发生在 filterDangerousHtml 之后，
     * 因此 javascript: 协议会从 Markdown 语法绕过过滤。这里在生成标签前统一拦截。
     *
     * 策略：
     * - 允许：http/https、mailto、tel、相对路径、#锚点、以及（图片场景）data: URI
     * - 拒绝：javascript:/vbscript: 始终拒绝；data: 在链接场景也拒绝
     *   （data:text/html 可执行脚本），仅在 allowData=true（图片）时放行 data:
     *
     * @param {string} url 原始 URL
     * @param {boolean} allowData 是否允许 data: 协议（图片场景为 true）
     * @returns {string} 安全 URL；若含危险协议则返回空串（破坏链接/href）
     */
    function sanitizeUrl(url, allowData) {
        if (typeof url !== 'string') return url;
        // 去除首尾空白与可能的前置控制字符
        var s = url.trim().replace(/^[\u0000-\u001F\u007F]+/, '');
        var dangerous = allowData
            ? /^(javascript|vbscript):/i
            : /^(javascript|vbscript|data):/i;
        if (dangerous.test(s)) {
            return '';
        }
        return url;
    }

    /**
     * 获取规则列表的副本（LIFO 顺序，末尾优先）
     * 内置规则在前，自定义规则在后（后注册优先）
     */
    function getBlockRules() {
        return _blockRules.slice().reverse();
    }

    function getInlineRules() {
        return _inlineRules.slice().reverse();
    }

    /**
     * 测试规则是否匹配
     * @param {Object} rule 规则对象
     * @param {string} line 当前行
     * @returns {Array|null} match 结果
     */
    function testRule(rule, line) {
        if (typeof rule.test === 'function') {
            var result = rule.test(line);
            if (result === true) return [line];
            if (Array.isArray(result)) return result;
            return null;
        }
        if (rule.test instanceof RegExp) {
            // 用新 RegExp 避免全局标志导致 lastIndex 残留
            var re = new RegExp(rule.test.source, rule.test.flags.replace(/g/g, ''));
            var m = re.exec(line);
            return m;
        }
        return null;
    }

    /**
     * 测试行内规则是否匹配
     */
    function testInlineRule(rule, text) {
        if (typeof rule.test === 'function') {
            var result = rule.test(text);
            if (result === true) return [text];
            if (Array.isArray(result)) return result;
            return null;
        }
        if (rule.test instanceof RegExp) {
            var re = new RegExp(rule.test.source, rule.test.flags.replace(/g/g, ''));
            var m = re.exec(text);
            return m;
        }
        return null;
    }

    // ==================== 块级解析器 ====================

    /**
     * 主解析入口：将 Markdown 文本解析为 HTML
     * @param {string} text Markdown 源文本
     * @param {Object} options 配置
     * @returns {string} HTML 字符串
     */
    function parse(text, options) {
        options = mergeOptions(options);
        if (typeof text !== 'string') text = String(text);

        // 规范化行尾
        text = text.replace(/\r\n?/g, '\n');

        // 脚注定义收集
        var footnotes = {};
        // 提取脚注定义（先于其他解析）
        text = extractFootnotes(text, footnotes);

        // 引用式链接定义收集
        var linkRefs = {};
        text = extractLinkRefs(text, linkRefs);

        // 预处理：如果不允许内联 HTML，先转义 HTML 特殊字符
        // 但保留 markdown 语法字符（#, *, _, ~, `, [, ], (, ), !, >, -, +, =, |, \）
        if (!options.html) {
            text = escapeForMarkdown(text);
        } else {
            // html: true 时过滤危险标签
            // 先保护围栏代码块/行内代码，避免其中的 <object> 等被 filterDangerousHtml 误删
            var protectedCode = protectCode(text);
            text = filterDangerousHtml(protectedCode.text);
            text = restoreCode(text, protectedCode.placeholders);
        }

        var lines = text.split('\n');
        // 将引用式链接定义挂到 options 上，供 parseInline 访问
        options.__linkRefs = linkRefs;
        var ctx = createCtx(options);
        var blocks = parseBlocks(lines, ctx);

        // 拼接块级 HTML
        var html = blocks.join('\n');

        // 追加脚注
        var fnHtml = renderFootnotes(footnotes, ctx);
        if (fnHtml) {
            html += '\n' + fnHtml;
        }

        return html;
    }

    /**
     * 合并配置
     */
    function mergeOptions(options) {
        var result = {};
        for (var k in DEFAULT_OPTIONS) {
            result[k] = DEFAULT_OPTIONS[k];
        }
        if (options) {
            for (var k2 in options) {
                result[k2] = options[k2];
            }
        }
        return result;
    }

    /**
     * 创建解析上下文
     */
    function createCtx(options) {
        return {
            options: options,
            inline: function (text) { return parseInline(text, options); },
            escape: escapeHtml,
            line: 0
        };
    }

    /**
     * 为 Markdown 预处理转义（保留 markdown 语法字符）
     *
     * 策略：
     * 1. 先用占位符保护围栏代码块和内联代码（防止其内容被 HTML 转义）
     * 2. 对非代码文本转义 HTML 特殊字符
     * 3. 还原行首 > 以保留引用块语法
     * 4. 还原占位符（保持原始行结构，包括容器前缀如 > ）
     *
     * 关键：还原围栏代码块时保留原始的多行结构（包括 > 前缀），
     * 这样引用块、列表等容器内的代码块不会破坏容器语法。
     * parseFencedCode 会去掉容器前缀后再提取代码内容。
     */
    /**
     * 保护围栏代码块与内联代码（用占位符），返回 { text, placeholders }
     *
     * 供 escapeForMarkdown / filterDangerousHtml 在预处理时跳过代码内容，
     * 防止代码块/行内代码中的 HTML（如 <object>）被当作真实 HTML 处理：
     * - html:false 时避免被 HTML 转义破坏 markdown 结构
     * - html:true 时避免被 filterDangerousHtml 误删其中的危险标签
     */
    function protectCode(text) {
        var placeholders = [];
        text = text.replace(/```[\s\S]*?```/g, function (m) {
            placeholders.push(m);
            return '\u0000CODEBLOCK' + (placeholders.length - 1) + '\u0000';
        });
        text = text.replace(/`[^`]+`/g, function (m) {
            placeholders.push(m);
            return '\u0000INLINECODE' + (placeholders.length - 1) + '\u0000';
        });
        return { text: text, placeholders: placeholders };
    }

    /**
     * 还原 protectCode 生成的占位符（保留原始内容，不转义）
     */
    function restoreCode(text, placeholders) {
        text = text.replace(/\u0000CODEBLOCK(\d+)\u0000/g, function (_, i) {
            return placeholders[parseInt(i)];
        });
        text = text.replace(/\u0000INLINECODE(\d+)\u0000/g, function (_, i) {
            return placeholders[parseInt(i)];
        });
        return text;
    }

    function escapeForMarkdown(text) {
        // 先保护围栏代码块和内联代码（用占位符）
        var protected_ = protectCode(text);
        text = protected_.text;
        var placeholders = protected_.placeholders;

        // 转义 HTML 特殊字符：< > " ' &
        text = text.replace(/&/g, '&amp;');
        text = text.replace(/</g, '&lt;');
        text = text.replace(/>/g, '&gt;');
        text = text.replace(/"/g, '&quot;');
        text = text.replace(/'/g, '&#39;');

        // 还原 markdown 语法需要的 >（行首的 > 是引用块语法）
        text = text.replace(/^(&gt;)+/gm, function (m) {
            return m.replace(/&gt;/g, '>');
        });

        // 还原占位符：保持原始内容（不转义，由 parseFencedCode/parseInline 统一转义）
        // 围栏代码块保留原始的多行结构（包括 > 前缀等容器语法）
        text = restoreCode(text, placeholders);

        return text;
    }

    /**
     * 过滤危险 HTML 标签（html: true 时使用）
     */
    function filterDangerousHtml(text) {
        // 移除危险标签（成对）
        HTML_TAG_BLACKLIST.forEach(function (tag) {
            var openRe = new RegExp('<' + tag + '\\b[^>]*>', 'gi');
            var closeRe = new RegExp('</' + tag + '>', 'gi');
            text = text.replace(openRe, '').replace(closeRe, '');
        });
        // 移除 on* 事件属性
        text = text.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
        // 移除 javascript: 协议
        text = text.replace(/(href|src)\s*=\s*("javascript:|'javascript:)/gi, '$1="');
        return text;
    }

    /**
     * 提取脚注定义
     */
    function extractFootnotes(text, footnotes) {
        // [^1]: 定义内容
        // [^note]: 定义内容
        var re = /^\[\^([^\]]+)\]:\s*(.*)$/gm;
        return text.replace(re, function (_, name, content) {
            footnotes[name] = content;
            return ''; // 移除定义行
        });
    }

    /**
     * 提取引用式链接定义
     *
     * 语法：[ref]: url "可选标题"
     * 存储到 linkRefs 对象，供 parseInline 解析 [text][ref] 时查找
     */
    function extractLinkRefs(text, linkRefs) {
        var re = /^\[([^\]]+)\]:\s*(\S+)(?:\s+(?:"|&quot;)([^"]*)(?:"|&quot;))?/gm;
        return text.replace(re, function (_, name, url, title) {
            linkRefs[name.toLowerCase()] = { url: url, title: title || '' };
            return ''; // 移除定义行
        });
    }

    /**
     * 渲染脚注列表
     */
    function renderFootnotes(footnotes, ctx) {
        var keys = Object.keys(footnotes);
        if (keys.length === 0) return '';

        var items = keys.map(function (key, i) {
            var content = ctx.inline(footnotes[key]);
            var num = i + 1;
            return '<li id="fn-' + key + '">' + content +
                ' <a href="#fnref-' + key + '" class="bny-md-footnote-backref">↩</a></li>';
        }).join('\n');

        return '<ol class="bny-md-footnotes">\n' + items + '\n</ol>';
    }

    /**
     * 块级解析：按行扫描
     */
    function parseBlocks(lines, ctx) {
        var blocks = [];
        var i = 0;

        while (i < lines.length) {
            var line = lines[i];

            // 空行跳过
            if (/^\s*$/.test(line)) {
                i++;
                continue;
            }

            ctx.line = i;

            // 1. 先尝试自定义块级规则（LIFO）
            var customResult = tryCustomBlock(lines, i, ctx);
            if (customResult) {
                blocks.push(customResult.html);
                i = customResult.next;
                continue;
            }

            // 2. 围栏代码块
            var codeResult = parseFencedCode(lines, i);
            if (codeResult) {
                blocks.push(codeResult.html);
                i = codeResult.next;
                continue;
            }

            // 3. 标题（ATX 式 #）
            var headerResult = parseAtxHeader(line, ctx);
            if (headerResult) {
                blocks.push(headerResult);
                i++;
                continue;
            }

            // 4. 标题（Setext 式 ===/---）
            var setextResult = parseSetextHeader(lines, i, ctx);
            if (setextResult) {
                blocks.push(setextResult.html);
                i = setextResult.next;
                continue;
            }

            // 5. 分隔线
            if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
                blocks.push('<hr>');
                i++;
                continue;
            }

            // 6. 引用块
            var quoteResult = parseBlockquote(lines, i, ctx);
            if (quoteResult) {
                blocks.push(quoteResult.html);
                i = quoteResult.next;
                continue;
            }

            // 7. 表格（GFM）
            var tableResult = parseTable(lines, i, ctx);
            if (tableResult) {
                blocks.push(tableResult.html);
                i = tableResult.next;
                continue;
            }

            // 8. 列表（无序/有序/任务）
            var listResult = parseList(lines, i, ctx);
            if (listResult) {
                blocks.push(listResult.html);
                i = listResult.next;
                continue;
            }

            // 9. 定义列表
            var defResult = parseDefinitionList(lines, i, ctx);
            if (defResult) {
                blocks.push(defResult.html);
                i = defResult.next;
                continue;
            }

            // 10. HTML 注释
            var commentResult = parseHtmlComment(lines, i);
            if (commentResult) {
                blocks.push(commentResult.html);
                i = commentResult.next;
                continue;
            }

            // 10.5 HTML 块（html: true 时，行首以 < 开头的块级 HTML 标签）
            // 避免多行 HTML 被包在 <p> 里导致结构错乱（如 <details> 不能作为 <p> 子元素）
            if (ctx.options.html && /^\s*<\w+/.test(line)) {
                var htmlResult = parseHtmlBlock(lines, i, ctx);
                if (htmlResult) {
                    blocks.push(htmlResult.html);
                    i = htmlResult.next;
                    continue;
                }
            }

            // 11. 参考式注释 [//]: #
            if (/^\[\/\/\]:\s*#/.test(line) || /^\[\/\/\]:\s*\(/.test(line)) {
                i++;
                continue;
            }

            // 12. 段落（兜底）
            var paraResult = parseParagraph(lines, i, ctx);
            blocks.push(paraResult.html);
            i = paraResult.next;
        }

        return blocks;
    }

    /**
     * 尝试自定义块级规则
     */
    function tryCustomBlock(lines, i, ctx) {
        var rules = getBlockRules();
        for (var r = 0; r < rules.length; r++) {
            var rule = rules[r];
            var match = testRule(rule, lines[i]);
            if (!match) continue;

            if (rule.multiline) {
                // 多行规则：收集后续行直到结束标记（同 test 或空行）
                var collected = [lines[i]];
                var j = i + 1;
                while (j < lines.length && !/^\s*$/.test(lines[j])) {
                    // 检查是否又匹配开始（结束标记通常是相同语法）
                    var m2 = testRule(rule, lines[j]);
                    if (m2 && j > i) {
                        // 可能是结束标记，视实现而定
                        break;
                    }
                    collected.push(lines[j]);
                    j++;
                }
                ctx.line = i;
                // 同时通过 ctx.__lines 和第三参数暴露收集的行，方便 render 读取
                ctx.__lines = collected;
                var html = rule.render(match, ctx, collected);
                if (typeof html === 'string') {
                    return { html: html, next: j };
                }
            } else {
                var html2 = rule.render(match, ctx);
                if (typeof html2 === 'string') {
                    return { html: html2, next: i + 1 };
                }
            }
        }
        return null;
    }

    /**
     * 解析围栏代码块
     *
     * 输出 <pre hx-ext="bny-code"> + 转义后的代码文本，不嵌套 <code> 标签。
     *
     * bny-code 扩展（code.js）的行为：
     * - 通过 pre.textContent 读取代码内容（浏览器自动反转义 HTML 实体，得到原始代码）
     * - 有 mode 属性时，由高亮库（hljs/prismjs）负责转义 + 高亮
     * - 无 mode 属性时，由 bny-code 调用 bny.escapeChars 自行转义
     *
     * 为什么 markdown.js 要转义：
     * - 若输出原始 HTML 标签（如 <article>），浏览器会将其解析为真实元素，
     *   textContent 只能得到纯文本（标签信息丢失），code 组件无法还原代码
     * - 转义后（&lt;article&gt;），浏览器将其作为文本节点，textContent 读取时
     *   浏览器自动反转义回原始代码（<article>），code 组件正常处理
     *
     * 不会双重转义：
     * - 有高亮库时，高亮库对原始代码做转义 + 高亮
     * - 无高亮库时，bny-code 对原始代码做 escapeChars 转义
     * - 两者都是对 textContent（原始代码）操作，不是对已转义字符串操作
     *
     * 围栏语言通过 pre 的 lang 属性传递（如 <pre lang="js">），
     * 自动检测运行环境中是否引入了 highlight.js 或 prismjs，
     * 若存在则在 pre 上输出对应的 mode 属性。
     */
    function parseFencedCode(lines, i) {
        var m = lines[i].match(/^```(\S*)\s*$/);
        if (!m) return null;

        var lang = m[1] || '';
        var codeLines = [];
        var j = i + 1;
        while (j < lines.length && lines[j] !== '```') {
            codeLines.push(lines[j]);
            j++;
        }
        // 跳过结束的 ```
        if (j < lines.length && lines[j] === '```') j++;

        var code = codeLines.join('\n');
        var langAttr = lang ? ' lang="' + lang + '"' : '';
        // 自动检测代码高亮库：优先 prismjs，其次 highlight.js
        var modeAttr = '';
        if (typeof Prism !== 'undefined') {
            modeAttr = ' mode="prismjs"';
        } else if (typeof hljs !== 'undefined') {
            modeAttr = ' mode="highlight"';
        }
        // 转义 HTML：防止浏览器将代码中的标签解析为真实元素
        // bny-code 通过 textContent 读取时会自动反转义回原始代码
        var content = escapeHtml(code);
        var html = '<pre hx-ext="bny-code"' + modeAttr + langAttr + '>' + content + '</pre>';
        return { html: html, next: j };
    }

    /**
     * 解析 ATX 标题（# 式）
     */
    function parseAtxHeader(line, ctx) {
        var m = line.match(/^(#{1,6})\s+(.*?)(?:\s*\{#([^}]+)\})?\s*#*\s*$/);
        if (!m) return null;

        var level = m[1].length;
        var text = ctx.inline(m[2]);
        var id = m[3];

        if (!id && ctx.options.headerIds) {
            id = slugify(m[2]);
        }

        var idAttr = id ? ' id="' + id + '"' : '';
        return '<h' + level + idAttr + '>' + text + '</h' + level + '>';
    }

    /**
     * 解析 Setext 标题（===/--- 式）
     */
    function parseSetextHeader(lines, i, ctx) {
        if (i + 1 >= lines.length) return null;
        var text = lines[i];
        var next = lines[i + 1];
        if (/^\s*$/.test(text)) return null;

        if (/^=+\s*$/.test(next)) {
            var id = ctx.options.headerIds ? slugify(text) : '';
            var idAttr = id ? ' id="' + id + '"' : '';
            return { html: '<h1' + idAttr + '>' + ctx.inline(text) + '</h1>', next: i + 2 };
        }
        if (/^-+\s*$/.test(next)) {
            var id2 = ctx.options.headerIds ? slugify(text) : '';
            var idAttr2 = id2 ? ' id="' + id2 + '"' : '';
            return { html: '<h2' + idAttr2 + '>' + ctx.inline(text) + '</h2>', next: i + 2 };
        }
        return null;
    }

    /**
     * 解析引用块（支持嵌套）
     */
    function parseBlockquote(lines, i, ctx) {
        if (!/^>\s?/.test(lines[i])) return null;

        var quoteLines = [];
        var j = i;
        while (j < lines.length && /^>\s?/.test(lines[j])) {
            // 去除 > 前缀
            quoteLines.push(lines[j].replace(/^>\s?/, ''));
            j++;
        }

        // 递归解析内部内容
        var innerCtx = createCtx(ctx.options);
        var innerBlocks = parseBlocks(quoteLines, innerCtx);
        var html = '<blockquote class="bny-blockquote">\n' + innerBlocks.join('\n') + '\n</blockquote>';
        return { html: html, next: j };
    }

    /**
     * 解析 GFM 表格
     */
    function parseTable(lines, i, ctx) {
        if (i + 1 >= lines.length) return null;
        var headerLine = lines[i];
        var separatorLine = lines[i + 1];

        // 必须包含 |
        if (headerLine.indexOf('|') === -1) return null;
        // 分隔行：|---|---| 或 :---: 等
        if (!/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(separatorLine)) return null;

        var aligns = parseTableAligns(separatorLine);
        var headers = parseTableRow(headerLine);

        var html = '<table class="bny-table">\n<thead>\n<tr>';
        headers.forEach(function (h, idx) {
            var style = aligns[idx] ? ' style="text-align:' + aligns[idx] + '"' : '';
            html += '<th' + style + '>' + ctx.inline(h) + '</th>';
        });
        html += '</tr>\n</thead>\n<tbody>\n';

        var j = i + 2;
        while (j < lines.length && lines[j].indexOf('|') !== -1 && !/^\s*$/.test(lines[j])) {
            var cells = parseTableRow(lines[j]);
            html += '<tr>';
            cells.forEach(function (c, idx) {
                var style = aligns[idx] ? ' style="text-align:' + aligns[idx] + '"' : '';
                html += '<td' + style + '>' + ctx.inline(c) + '</td>';
            });
            html += '</tr>\n';
            j++;
        }

        html += '</tbody>\n</table>';
        return { html: html, next: j };
    }

    /**
     * 解析表格对齐标记
     */
    function parseTableAligns(separatorLine) {
        var cells = separatorLine.replace(/^\||\|$/g, '').split('|');
        return cells.map(function (cell) {
            cell = cell.trim();
            var left = cell.charAt(0) === ':';
            var right = cell.charAt(cell.length - 1) === ':';
            if (left && right) return 'center';
            if (right) return 'right';
            if (left) return 'left';
            return null;
        });
    }

    /**
     * 解析表格行（按 | 分割，尊重转义）
     */
    function parseTableRow(line) {
        // 去除首尾 |
        line = line.replace(/^\|/, '').replace(/\|$/, '');
        // 按未转义的 | 分割
        var cells = [];
        var current = '';
        var escaped = false;
        for (var k = 0; k < line.length; k++) {
            var ch = line[k];
            if (escaped) {
                current += ch;
                escaped = false;
            } else if (ch === '\\') {
                escaped = true;
            } else if (ch === '|') {
                cells.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        cells.push(current.trim());
        return cells;
    }

    /**
     * 解析列表（无序/有序/任务）
     */
    function parseList(lines, i, ctx) {
        var line = lines[i];
        // 无序列表：- * + 后跟空格
        var ulMatch = line.match(/^(\s*)([-*+])\s+(.*)/);
        // 有序列表：1. 后跟空格
        var olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);

        if (!ulMatch && !olMatch) return null;

        var isOrdered = !!olMatch;
        var items = [];
        var j = i;
        var listIndent = '';

        while (j < lines.length) {
            var currentLine = lines[j];
            if (/^\s*$/.test(currentLine)) {
                // 空行：检查下一行是否还是列表项
                if (j + 1 < lines.length && /^(\s*)([-*+]|\d+\.)\s+/.test(lines[j + 1])) {
                    j++;
                    continue;
                }
                break;
            }

            var itemMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s+(.*)/);
            if (!itemMatch) break;

            // 记录第一个列表项的缩进作为列表缩进基准
            if (j === i) listIndent = itemMatch[1];

            // 检查缩进：同级别或更深层级
            if (itemMatch[1].length < listIndent.length) break;

            var itemContent = itemMatch[3];
            var subLines = [itemContent];

            // 收集该列表项的续行（缩进更深的行）
            var k = j + 1;
            while (k < lines.length) {
                var nextLine = lines[k];
                if (/^\s*$/.test(nextLine)) break;
                // 更深的缩进 = 子内容
                if (/^(\s{2,}|\t)/.test(nextLine) && !nextLine.match(/^(\s*)([-*+]|\d+\.)\s+/)) {
                    subLines.push(nextLine.replace(/^\s{2,}/, ''));
                    k++;
                } else if (nextLine.match(/^(\s*)([-*+]|\d+\.)\s+/) && itemMatch[1].length < listIndent.length + 2) {
                    // 子列表
                    break;
                } else {
                    break;
                }
            }

            // 检查任务列表
            var taskMatch = itemContent.match(/^\[([xX ])\]\s+(.*)/i);
            if (taskMatch) {
                var checked = taskMatch[1].toLowerCase() === 'x';
                var checkbox = '<input type="checkbox" disabled class="bny-checkbox"' + (checked ? ' checked' : '') + '> ';
                var taskContent = ctx.inline(taskMatch[2]);
                items.push('<li>' + checkbox + taskContent + '</li>');
            } else {
                // 递归解析子内容
                var itemText = subLines.join('\n');
                var subCtx = createCtx(ctx.options);
                var subBlocks = parseBlocks(itemText.split('\n'), subCtx);
                items.push('<li>' + subBlocks.join('\n') + '</li>');
            }

            j = k;
        }

        var tag = isOrdered ? 'ol' : 'ul';
        var html = '<' + tag + '>\n' + items.join('\n') + '\n</' + tag + '>';
        return { html: html, next: j };
    }

    /**
     * 解析定义列表
     */
    function parseDefinitionList(lines, i, ctx) {
        // Term 行
        // : Definition 行
        if (i + 1 >= lines.length) return null;
        if (!/^:\s+/.test(lines[i + 1])) return null;

        var items = [];
        var j = i;
        while (j < lines.length) {
            // Term 行（非空、非特殊语法）
            if (/^\s*$/.test(lines[j])) {
                j++;
                continue;
            }
            if (/^[:#>\-*+|`]/.test(lines[j])) break;

            var term = lines[j];
            // 下一行必须是 : 定义
            if (j + 1 >= lines.length || !/^:\s+/.test(lines[j + 1])) break;

            var definition = lines[j + 1].replace(/^:\s+/, '');
            items.push('<dt>' + ctx.inline(term) + '</dt>');
            items.push('<dd>' + ctx.inline(definition) + '</dd>');
            j += 2;
        }

        if (items.length === 0) return null;
        var html = '<dl>\n' + items.join('\n') + '\n</dl>';
        return { html: html, next: j };
    }

    /**
     * 解析 HTML 注释
     */
    function parseHtmlComment(lines, i) {
        var line = lines[i];
        // 单行注释 <!-- ... -->
        if (/^<!--[\s\S]*-->\s*$/.test(line)) {
            return { html: line, next: i + 1 };
        }
        // 多行注释 <!-- 开始
        if (/^<!--/.test(line) && !/-->\s*$/.test(line)) {
            var j = i + 1;
            while (j < lines.length && !/-->\s*$/.test(lines[j])) j++;
            if (j < lines.length) j++;
            var content = lines.slice(i, j).join('\n');
            return { html: content, next: j };
        }
        return null;
    }

    /**
     * 解析 HTML 块（html: true 时）
     *
     * 只处理块级 HTML 标签（<div>、<details>、<table> 等），
     * 收集直到匹配的结束标签或空行。
     *
     * 内联标签（<ins>、<kbd>、<font> 等）不在此处理，
     * 交给段落 + parseInline，这样同行多个内联标签和 Markdown 语法都能正常工作。
     */
    function parseHtmlBlock(lines, i, ctx) {
        var line = lines[i];
        // 提取标签名
        var m = line.match(/^\s*<(\w+)/);
        if (!m) return null;
        var tag = m[1].toLowerCase();

        // 内联标签不作为 HTML 块处理，交给段落
        var inlineTags = ['ins', 'kbd', 'font', 'b', 'i', 'em', 'strong', 'span', 'a', 'sub', 'sup', 'mark', 'small', 'img', 'br', 'code', 'del', 's', 'u', 'q', 'cite', 'abbr'];
        if (inlineTags.indexOf(tag) !== -1) return null;

        // 块级标签：收集到对应的关闭标签 </tag>
        var closeRe = new RegExp('</' + tag + '>\\s*$', 'i');
        // 如果起始行就包含了结束标签（单行块）
        if (closeRe.test(line)) {
            return { html: ctx.inline(line), next: i + 1 };
        }
        // 多行块：收集直到遇到 </tag>
        var j = i + 1;
        while (j < lines.length && !closeRe.test(lines[j])) {
            // 遇到空行也停止（容错：未闭合的标签不吞后续内容）
            if (/^\s*$/.test(lines[j])) break;
            j++;
        }
        if (j < lines.length && closeRe.test(lines[j])) j++;
        var content = lines.slice(i, j).join('\n');
        // 处理 HTML 块内的行内 Markdown（如 `code`），
        // 避免 `<details>` 等反引号内容被浏览器当作字面 HTML 标签
        // pre/script/style 等保留原样不处理
        var skipInlineTags = ['pre', 'script', 'style', 'textarea'];
        if (skipInlineTags.indexOf(tag) === -1) {
            content = ctx.inline(content);
        }
        return { html: content, next: j };
    }

    /**
     * 解析段落
     */
    function parseParagraph(lines, i, ctx) {
        var paraLines = [lines[i]];
        var j = i + 1;
        while (j < lines.length) {
            var line = lines[j];
            if (/^\s*$/.test(line)) break;
            // 遇到块级语法停止
            if (/^```/.test(line)) break;
            if (/^(#{1,6})\s/.test(line)) break;
            if (/^>\s?/.test(line)) break;
            if (/^([-*_])\1{2,}\s*$/.test(line)) break;
            if (/^(\s*)([-*+]|\d+\.)\s+/.test(line)) break;
            paraLines.push(line);
            j++;
        }

        var text = paraLines.join('\n');
        // 处理换行：行尾两空格或 \ → <br>；breaks 配置时单换行也 → <br>
        text = text.replace(/  $/gm, '<br>');
        text = text.replace(/\\$/gm, '<br>');
        if (ctx.options.breaks) {
            text = text.replace(/\n(?!<br>)/g, '<br>\n');
        } else {
            text = text.replace(/\n/g, '\n');
        }

        // 图片标题 hack：图片后紧跟斜体段落 → <figure>
        var html = ctx.inline(text);
        // 检测 <p><img...></p>\n<p><em>caption</em></p> 模式
        html = html.replace(
            /<p>(<img[^>]+>)<\/p>\s*<p><em>([^<]+)<\/em><\/p>/g,
            '<figure>$1<figcaption>$2</figcaption></figure>'
        );

        // 图片堆叠分组：连续 2+ 张图片 → 重叠分组容器（灯箱内翻页浏览整组）
        // 因预览 JS 按 .bny-image-group 容器就近收集，无需写 data-preview-group 名字
        html = html.replace(/(<img[^>]*>)(?:\s*<img[^>]*>)+/g,
            '<div class="bny-image-group">$&</div>');

        // 整段仅为一个块级容器（figure / image-group）时不再用 <p> 包裹，
        // 避免 <p><div></div></p> 非法嵌套
        if (/^<(figure|div class="bny-image-group")/.test(html.trim())) {
            return { html: html, next: j };
        }
        return { html: '<p>' + html + '</p>', next: j };
    }

    // ==================== 行内解析器 ====================

    /**
     * 行内解析
     */
    function parseInline(text, options) {
        if (typeof text !== 'string') text = String(text);
        options = options || DEFAULT_OPTIONS;

        // 先保护内联代码（用占位符，避免内部被其他规则处理）
        var codePlaceholders = [];
        text = text.replace(/`([^`]+)`/g, function (_, code) {
            codePlaceholders.push(code);
            return '\u0001CODE' + (codePlaceholders.length - 1) + '\u0001';
        });

        // 先尝试自定义行内规则
        var customRules = getInlineRules();
        customRules.forEach(function (rule) {
            if (rule.test instanceof RegExp) {
                var re = new RegExp(rule.test.source, rule.test.flags);
                text = text.replace(re, function () {
                    var args = Array.prototype.slice.call(arguments);
                    var match = args[0];
                    var ctx = { options: options };
                    var result = rule.render(match, ctx);
                    return result;
                });
            } else if (typeof rule.test === 'function') {
                // 函数式 test 由规则自行处理替换
                text = rule.test(text, function (match) {
                    var ctx = { options: options };
                    return rule.render(match, ctx);
                }) || text;
            }
        });

        // 1. 转义字符（先处理，避免后续被误解析）
        // \* \_ \# \- \. \! \[ \] \( \) \\ \` \~ \^ \= \|
        text = text.replace(/\\([\\`*_{}\[\]()#+\-.!~^=|>])/g, function (_, ch) {
            return '\u0001ESC' + ch.charCodeAt(0) + '\u0001';
        });

        // 2. 图片（先于链接，因为 ![alt](url) 会被链接规则误匹配）
        // title 可能是 "..." 或 &quot;...&quot;（escapeForMarkdown 转义后）
        // 输出 data-preview 启用图片预览，有 title 时加 bny-tip
        text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+(?:"|&quot;)([^"]*)(?:"|&quot;))?\)/g, function (_, alt, url, title) {
            var tipAttr = title ? ' bny-tip="' + escapeHtml(title) + '"' : '';
            return '<img src="' + escapeHtml(sanitizeUrl(url, true)) + '" alt="' + escapeHtml(alt) + '" data-preview' + tipAttr + '>';
        });

        // 3. 链接 [text](url)
        // 有 title 时用 bny-tip（bny-ui 的 tooltip 组件）代替原生 title
        text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+(?:"|&quot;)([^"]*)(?:"|&quot;))?\)/g, function (_, linkText, url, title) {
            var tipAttr = title ? ' bny-tip="' + escapeHtml(title) + '"' : '';
            var target = options.linkTarget ? ' target="' + options.linkTarget + '"' : '';
            return '<a href="' + escapeHtml(sanitizeUrl(url, false)) + '"' + tipAttr + target + '>' + linkText + '</a>';
        });

        // 4. 脚注引用 [^1]
        text = text.replace(/\[\^([^\]]+)\]/g, function (_, name) {
            return '<sup class="bny-md-fn-ref"><a href="#fn-' + name + '" id="fnref-' + name + '">' + name + '</a></sup>';
        });

        // 4.5 引用式链接 [text][ref] 或快捷引用 [ref]
        text = text.replace(/\[([^\]]+)\]\[([^\]]*)\]/g, function (_, linkText, ref) {
            // [text][ref] — ref 非空时用 ref 查找；为空时用 text 作为 ref
            var key = (ref || linkText).toLowerCase();
            var def = options.__linkRefs ? options.__linkRefs[key] : null;
            if (!def) return _; // 未找到定义，原样返回
            var tipAttr = def.title ? ' bny-tip="' + escapeHtml(def.title) + '"' : '';
            var target = options.linkTarget ? ' target="' + options.linkTarget + '"' : '';
            return '<a href="' + escapeHtml(sanitizeUrl(def.url, false)) + '"' + tipAttr + target + '>' + linkText + '</a>';
        });
        // 快捷引用 [ref]（单独一行中括号，前面没有 !）
        text = text.replace(/(?<!!)\[([^\]]+)\](?!\()/g, function (_, linkText) {
            // 只在没有对应定义时才尝试快捷引用（避免与已解析的链接冲突）
            var key = linkText.toLowerCase();
            var def = options.__linkRefs ? options.__linkRefs[key] : null;
            if (!def) return _;
            var tipAttr = def.title ? ' bny-tip="' + escapeHtml(def.title) + '"' : '';
            var target = options.linkTarget ? ' target="' + options.linkTarget + '"' : '';
            return '<a href="' + escapeHtml(sanitizeUrl(def.url, false)) + '"' + tipAttr + target + '>' + linkText + '</a>';
        });

        // 5. 粗体 ** 或 __（先于斜体）
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');

        // 6. 斜体 * 或 _
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        text = text.replace(/_([^_]+)_/g, '<em>$1</em>');

        // 7. 删除线 ~~
        text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');

        // 8. 高亮标记 ==
        text = text.replace(/==([^=]+)==/g, '<mark>$1</mark>');

        // 9. 下标 ~text~
        text = text.replace(/~([^~]+)~/g, '<sub>$1</sub>');

        // 10. 上标 ^text^
        text = text.replace(/\^([^^]+)\^/g, '<sup>$1</sup>');

        // 11. 自动链接（裸 URL）
        text = text.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, function (_, prefix, url) {
            var target = options.linkTarget ? ' target="' + options.linkTarget + '"' : '';
            return prefix + '<a href="' + url + '"' + target + '>' + url + '</a>';
        });

        // 12. 邮箱自动链接
        // 支持裸邮箱和 <email> 包裹形式
        // html: true 时 < > 未被转义，直接匹配 <email>
        if (options.html) {
            text = text.replace(/<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/g, function (_, email) {
                return '<a href="mailto:' + email + '">' + email + '</a>';
            });
        }
        // html: false 时 < > 已被 escapeForMarkdown 转为 &lt; &gt;
        text = text.replace(/&lt;([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})&gt;/g, function (_, email) {
            return '<a href="mailto:' + email + '">' + email + '</a>';
        });
        text = text.replace(/(^|[\s(])([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, function (_, prefix, email) {
            return prefix + '<a href="mailto:' + email + '">' + email + '</a>';
        });

        // 13. Emoji 短码
        if (options.emoji) {
            text = text.replace(/:([a-zA-Z0-9_]+):/g, function (_, name) {
                return EMOJI_MAP[name] || (':' + name + ':');
            });
        }

        // 14. 还原转义字符
        text = text.replace(/\u0001ESC(\d+)\u0001/g, function (_, code) {
            return String.fromCharCode(parseInt(code));
        });

        // 15. 还原内联代码（统一在此处转义，避免双重转义）
        text = text.replace(/\u0001CODE(\d+)\u0001/g, function (_, i) {
            return '<code>' + escapeHtml(codePlaceholders[parseInt(i)]) + '</code>';
        });

        return text;
    }

    /**
     * 生成 slug（标题 id）
     */
    function slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    // ==================== 触发机制 ====================

    /**
     * 判断元素是否应作为 Markdown 容器处理
     *
     * 规则：
     * - 必须自身带 hx-ext="bny-md"（用 bny.hasExtName 判断）
     * - 跳过 body/html/head 等文档结构元素（避免误把整页当 Markdown）
     * - 跳过带 htmx 请求触发属性的元素（hx-get/post/put/delete/patch），
     *   这类元素是响应触发的发起者（如 button），其 textContent 不是 Markdown
     * - 跳过 textContent 为空的元素
     * - 跳过已处理过的元素（防止 htmx.process 回调导致重复解析）
     */
    function shouldProcessAsContainer(el) {
        if (!el) return false;
        var tag = el.tagName;
        if (tag === 'BODY' || tag === 'HTML' || tag === 'HEAD') return false;
        if (el.hasAttribute('hx-get') ||
            el.hasAttribute('hx-post') ||
            el.hasAttribute('hx-put') ||
            el.hasAttribute('hx-delete') ||
            el.hasAttribute('hx-patch')) {
            return false;
        }
        if (el.__bnyMdProcessed) return false;
        var text = el.textContent;
        if (!text || !text.trim()) return false;
        return true;
    }

    /**
     * 读取元素的 bny-md-config 配置
     * @param {Element} el 带有 bny-md-config 属性的元素
     * @returns {Object} 配置对象
     */
    function readConfig(el) {
        var options = {};
        if (!el || !el.getAttribute) return options;
        var configAttr = el.getAttribute('bny-md-config');
        if (configAttr) {
            try {
                var parsed = JSON.parse(configAttr);
                for (var k in parsed) options[k] = parsed[k];
            } catch (e) {
                console.warn('[bny-md] bny-md-config JSON 解析失败:', e);
            }
        }
        return options;
    }

    /**
     * 处理元素：读取 bny-md-config，将 textContent 解析为 Markdown 并替换 innerHTML
     */
    function processElement(el) {
        if (!el) return;
        if (el.__bnyMdProcessed) return;
        el.__bnyMdProcessed = true;

        var options = readConfig(el);
        var md = el.textContent;
        var html = parse(md, options);
        el.innerHTML = html;

        // 让 bny-code 等子扩展生效
        if (typeof htmx !== 'undefined' && htmx.process) {
            htmx.process(el);
        }
    }

    /**
     * 扫描文档中所有 hx-ext="bny-md" 元素并处理
     * 注意：用 [hx-ext~="bny-md"] 选择器，可匹配空格分隔的多扩展名
     */
    function processAll() {
        var elements = document.querySelectorAll('[hx-ext~="bny-md"]');
        elements.forEach(function (el) {
            if (shouldProcessAsContainer(el)) {
                processElement(el);
            }
        });
    }

    /**
     * 检测响应是否为 Markdown
     */
    function isMarkdownResponse(xhr) {
        // URL 以 .md 结尾
        var url = xhr.responseURL || '';
        if (/\.md(\?.*)?$/i.test(url)) return true;
        // Content-Type 包含 text/markdown
        try {
            var ct = xhr.getResponseHeader('Content-Type') || '';
            if (ct.indexOf('text/markdown') !== -1) return true;
        } catch (e) {}
        return false;
    }

    // ==================== HTMX 扩展注册 ====================

    htmx.defineExtension('bny-md', {
        onEvent: function (name, evt) {
            // 元素触发：htmx 处理节点时
            if (name === 'htmx:afterProcessNode') {
                var target = evt.target;
                if (!bny.hasExtName(target, 'bny-md')) return true;
                // target 自身就是 Markdown 容器（前提：不是触发器、不是 body 等）
                if (shouldProcessAsContainer(target)) {
                    processElement(target);
                }
                return true;
            }
            return true;
        },

        // 响应触发：htmx 在 swap 前调用此方法转换响应体
        // 仅当响应被判定为 Markdown（URL 以 .md 结尾 或 Content-Type: text/markdown）时解析为 HTML
        transformResponse: function (responseText, xhr, elt) {
            if (xhr && isMarkdownResponse(xhr)) {
                // 从触发元素上读取 bny-md-config 元素级配置
                var options = readConfig(elt);
                return parse(responseText, options);
            }
            return responseText;
        }
    });

    // ==================== DOMContentLoaded：处理页面初始元素 ====================

    // 仅在浏览器环境执行
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', processAll);
        } else {
            // 已经加载完成
            processAll();
        }
    }

    // ==================== 全局 API 暴露 ====================

    /**
     * 渲染 Markdown 为 HTML
     * @param {string} text Markdown 文本
     * @param {Object} options 配置
     * @returns {string} HTML
     */
    bny.markdown = function (text, options) {
        return parse(text, options);
    };

    /**
     * bny.md 命名空间：插件管理
     */
    bny.md = {
        block: registerBlock,
        inline: registerInline,
        use: usePlugin,
        remove: unregister,
        parse: parse,
        parseInline: parseInline
    };

})();
