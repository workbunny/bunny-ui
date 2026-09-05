/**
 * bny-select 冒烟测试（puppeteer + 本地静态服务 + 真实浏览器）
 *
 * 覆盖：基础单选 / 多选（chips、max、clearable）/ 禁用 / 树形单选（折叠、缩进）/
 * 树形多选（父子联动、半选、停用排除）/ strict 关闭联动 / 远程 JSON /
 * 原生 select 渐进增强 / bny-form 校验集成 / 键盘交互
 *
 * 运行：npm run test:select（先 vite build --debug 产出 debug/bunny.*）
 * 环境变量：SELECT_TEST_PORT 覆盖端口（默认 8897）、SELECT_TEST_SHOT 保存失败截图
 *
 * 片段演示页无 <head>，通过内存壳页 hx-get 加载后测试。
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.normalize(path.join(__dirname, '..'));
const PORT = Number(process.env.SELECT_TEST_PORT || 8897);
const SHOT = process.env.SELECT_TEST_SHOT || '';
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf'
};
const SHELL = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<link rel="stylesheet" href="/debug/bunny.css">' +
    '<script src="/debug/bunny.js"></script></head><body>' +
    '<div id="slot" hx-get="/test/select.html" hx-trigger="load"></div></body></html>';

/** puppeteer-core 解析：优先本地/NODE_PATH，回退隔离工作区 */
function loadPuppeteer() {
    try { return require('puppeteer-core'); } catch (e) { /* 忽略 */ }
    try {
        return require('C:/Users/28249/.workbuddy/binaries/node/workspace/node_modules/puppeteer-core');
    } catch (e) {
        throw new Error('puppeteer-core 不可用（NODE_PATH 未指向隔离工作区且本地未安装）');
    }
}

/** 浏览器可执行文件：Edge 优先，回退 Chrome */
function loadBrowserPath() {
    const candidates = [
        'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        'C:/Program Files/Google/Chrome/Application/chrome.exe'
    ];
    for (const p of candidates) { if (fs.existsSync(p)) return p; }
    throw new Error('未找到 Edge / Chrome 可执行文件');
}

function startServer() {
    return new Promise(function (resolve) {
        const srv = http.createServer(function (req, res) {
            const urlPath = decodeURIComponent(req.url.split('?')[0]);
            if (urlPath === '/__shell.html') {
                res.writeHead(200, { 'Content-Type': MIME['.html'] });
                res.end(SHELL);
                return;
            }
            const file = path.normalize(path.join(ROOT, urlPath));
            if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
                res.writeHead(404); res.end('404'); return;
            }
            res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
            res.end(fs.readFileSync(file));
        });
        srv.listen(PORT, '127.0.0.1', function () { resolve(srv); });
    });
}

// ---------------- 断言计数 ----------------
let passed = 0, failed = 0;
const failures = [];

function ok(name, cond, extra) {
    if (cond) { passed++; console.log('  ✓ ' + name); }
    else {
        failed++;
        const msg = '  ✗ ' + name + (extra !== undefined ? ' 【实际: ' + extra + '】' : '');
        console.log(msg);
        failures.push(msg.trim());
    }
}

(async function () {
    const puppeteer = loadPuppeteer();
    const browserPath = loadBrowserPath();
    const server = await startServer();

    const browser = await puppeteer.launch({
        executablePath: browserPath,
        headless: 'new',
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', function (e) {
        const msg = String(e && e.message || e);
        // favicon 404 无害，其余页面错误计入失败环境
        if (msg.indexOf('favicon') === -1) pageErrors.push(msg);
    });

    await page.goto('http://127.0.0.1:' + PORT + '/__shell.html', { waitUntil: 'networkidle0' });

    // 片段加载 + 组件初始化轮询（jsdom 场景下 rAF 节流，这里用 node 侧轮询）
    const start = Date.now();
    const limit = 15000;
    while (Date.now() - start < limit) {
        const ready = await page.evaluate(function () {
            return !!window.__h && !!window.__h.box('sel-basic') &&
                !!window.__h.trig('sel-basic');
        });
        if (ready) break;
        await new Promise(function (r) { setTimeout(r, 150); });
    }

    /** 页面内辅助函数集合（每次 evaluate 注入） */
    const HELP = `
        window.__h = {
            q: function (sel, root) { return (root || document).querySelector(sel); },
            qa: function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); },
            box: function (id) {
                var elt = document.getElementById(id);
                if (!elt) return null;
                // ul 承载：elt 自身变身 box；div 承载：box 是后代；select 承载：box 是父级
                if (elt.classList.contains('bny-select-box')) return elt;
                return elt.querySelector(':scope .bny-select-box') ||
                    (elt.closest ? elt.closest('.bny-select-box') : null);
            },
            host: function (id) {
                var box = window.__h.box(id);
                if (!box) return null;
                return box.querySelector(':scope > .value') || box.querySelector(':scope > select');
            },
            trig: function (id) {
                var box = window.__h.box(id);
                return box ? box.querySelector('.trigger') : null;
            },
            val: function (id) {
                var host = window.__h.host(id);
                return host ? host.value : null;
            },
            opts: function () { return window.__h.qa('.bny-select-panel .option'); },
            panelOpen: function () { return !!window.__h.q('.bny-select-panel'); }
        };
    `;
    await page.evaluate(HELP);

    const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    /** node 侧轮询页面条件（默认 5s） */
    const waitFor = async function (fn, timeout) {
        const deadline = Date.now() + (timeout || 5000);
        while (Date.now() < deadline) {
            if (await page.evaluate(fn)) return true;
            await sleep(120);
        }
        return false;
    };

    /** 段级异常隔离：一段崩掉不影响后续段 */
    const sections = [];
    const section = function (no, name, fn) { sections.push({ no: no, name: name, fn: fn }); };
    const run = async function () {
        for (const s of sections) {
            console.log('\n【' + s.no + ' ' + s.name + '】');
            try { await s.fn(); }
            catch (e) {
                failed++;
                const msg = '  ✗ 段异常: ' + String(e && e.message || e).split('\n')[0];
                console.log(msg);
                failures.push('【' + s.no + '】段异常: ' + String(e && e.message || e).split('\n')[0]);
                // 异常后尽量复位：关闭残留面板
                try { await page.evaluate(function () { document.body.click(); }); await sleep(150); } catch (e2) { }
            }
        }
    };

    // ==================== 01 基础单选（ul 直接承载） ====================
    section('01', '基础单选（ul 承载）', async function () {
        // ul 变身 box：承载元素本身就是 .bny-select-box，原 li 解析进模型后移除
        const host = await page.evaluate(function () {
            const ul = document.getElementById('sel-basic');
            return {
                isBox: ul.classList.contains('bny-select-box'),
                liGone: ul.querySelectorAll(':scope > li').length === 0,
                hostIsUl: window.__h.box('sel-basic') === ul,
                valueHost: !!window.__h.host('sel-basic') &&
                    window.__h.host('sel-basic').tagName === 'INPUT'
            };
        });
        ok('01 ul 自身变身 bny-select-box', host.isBox);
        ok('01 原 li 解析后移除（DOM 零冗余）', host.liGone);
        ok('01 box 即承载 ul', host.hostIsUl);
        ok('01 值域为生成的 input', host.valueHost);

        await page.evaluate(function () { window.__h.trig('sel-basic').click(); });
        ok('01 打开面板挂 body', await waitFor(function () { return window.__h.panelOpen(); }));
        const opened = await page.evaluate(function () {
            const box = window.__h.box('sel-basic');
            return {
                openCls: box.classList.contains('open'),
                expanded: window.__h.trig('sel-basic').getAttribute('aria-expanded'),
                opts: window.__h.opts().length,
                disabled: window.__h.qa('.bny-select-panel .option.disabled').length
            };
        });
        ok('01 box 加 open 类', opened.openCls);
        ok('01 aria-expanded=true', opened.expanded === 'true');
        ok('01 选项 5 个', opened.opts === 5, opened.opts);
        ok('01 停用项 1 个（天津）', opened.disabled === 1, opened.disabled);

        // 停用项点击不生效
        await page.evaluate(function () {
            window.__h.qa('.bny-select-panel .option.disabled')[0].click();
        });
        await sleep(120);
        ok('01 停用项不可选', await page.evaluate(function () { return window.__h.val('sel-basic') === ''; }),
            await page.evaluate(function () { return window.__h.val('sel-basic'); }));

        // 选北京
        await page.evaluate(function () {
            const li = window.__h.qa('.bny-select-panel .option').filter(function (o) { return o.getAttribute('data-value') === '1'; })[0];
            li.click();
        });
        await sleep(120);
        const picked = await page.evaluate(function () {
            const box = window.__h.box('sel-basic');
            return {
                v: window.__h.val('sel-basic'),
                closed: !window.__h.panelOpen(),
                text: box.querySelector('.trigger .text').textContent,
                selCls: !!box.querySelector('.trigger .text:not(.placeholder)')
            };
        });
        ok('01 选中写入值域', picked.v === '1', picked.v);
        ok('01 单选选完自动关面板', picked.closed);
        ok('01 回显文本"北京"', picked.text === '北京', picked.text);

        // Escape 关闭
        await page.evaluate(function () { window.__h.trig('sel-basic').click(); });
        await waitFor(function () { return window.__h.panelOpen(); });
        await page.keyboard.press('Escape');
        await sleep(120);
        ok('01 Escape 关闭面板', await page.evaluate(function () { return !window.__h.panelOpen(); }));
    });

    // ==================== 02 多选 ====================
    section('02', '多选（chips/max/clearable）', async function () {
        const init = await page.evaluate(function () {
            const box = window.__h.box('sel-multi');
            return {
                v: window.__h.val('sel-multi'),
                chips: box.querySelectorAll('.chips .chip').length,
                chipText: box.querySelector('.chips .chip') ? box.querySelector('.chips .chip span').textContent : ''
            };
        });
        ok('02 初始值 select-value=1', init.v === '1', init.v);
        ok('02 初始 chips 回显 1 个', init.chips === 1, init.chips);
        ok('02 chip 文本"前端"', init.chipText === '前端', init.chipText);

        await page.evaluate(function () { window.__h.trig('sel-multi').click(); });
        ok('02 打开面板', await waitFor(function () { return window.__h.panelOpen(); }));

        // 依次选 2、3
        await page.evaluate(function () {
            window.__h.qa('.bny-select-panel .option').filter(function (o) { return o.getAttribute('data-value') === '2'; })[0].click();
        });
        await sleep(100);
        await page.evaluate(function () {
            window.__h.qa('.bny-select-panel .option').filter(function (o) { return o.getAttribute('data-value') === '3'; })[0].click();
        });
        await sleep(100);
        const multi = await page.evaluate(function () {
            const box = window.__h.box('sel-multi');
            return {
                v: window.__h.val('sel-multi'),
                chips: box.querySelectorAll('.chips .chip').length,
                open: window.__h.panelOpen(),
                checked: window.__h.qa('.bny-select-panel .check.checked').length
            };
        });
        ok('02 逗号合并值 "1,2,3"', multi.v === '1,2,3', multi.v);
        ok('02 chips 3 个', multi.chips === 3, multi.chips);
        ok('02 多选选完面板保持打开', multi.open);
        ok('02 勾选框 checked 3 个', multi.checked === 3, multi.checked);

        // max=3：第 4 个不生效
        await page.evaluate(function () {
            window.__h.qa('.bny-select-panel .option').filter(function (o) { return o.getAttribute('data-value') === '4'; })[0].click();
        });
        await sleep(100);
        ok('02 select-max=3 拦截第 4 个',
            await page.evaluate(function () { return window.__h.val('sel-multi') === '1,2,3'; }),
            await page.evaluate(function () { return window.__h.val('sel-multi'); }));

        // chip 移除 3
        await page.evaluate(function () {
            const box = window.__h.box('sel-multi');
            const chip = window.__h.qa('.chip', box).filter(function (c) { return c.getAttribute('data-value') === '3'; })[0];
            chip.querySelector('.close').click();
        });
        await sleep(100);
        const afterRm = await page.evaluate(function () {
            return { v: window.__h.val('sel-multi'), open: window.__h.panelOpen() };
        });
        ok('02 chip 移除后值 "1,2"', afterRm.v === '1,2', afterRm.v);
        ok('02 移除 chip 面板保持打开', afterRm.open);

        // clearable 清空
        const cleared = await page.evaluate(function () {
            const box = window.__h.box('sel-multi');
            const clearBtn = box.querySelector('.trigger .clear');
            if (!clearBtn) return { has: false };
            clearBtn.click();
            return {
                has: true,
                v: window.__h.val('sel-multi'),
                placeholder: !!box.querySelector('.chips .placeholder')
            };
        });
        ok('02 clearable 清空按钮存在', cleared.has);
        ok('02 清空后值域为空', cleared.v === '', cleared.v);
        ok('02 空值显示占位符', cleared.placeholder);

        // 点其他组件（bny-tab 头，点击时 stopPropagation 截断冒泡）也必须关闭面板
        await page.evaluate(function () {
            const head = document.querySelector('div[hx-ext="bny-tab"] .head li');
            head.click();
        });
        await sleep(150);
        ok('02 点其他组件（冒泡被截断）仍关闭面板', await page.evaluate(function () {
            return !window.__h.panelOpen();
        }));

        await page.evaluate(function () { document.body.click(); });
        await sleep(100);
        ok('02 点击外部关闭面板', await page.evaluate(function () { return !window.__h.panelOpen(); }));
    });

    // ==================== 03 禁用 ====================
    section('03', '禁用', async function () {
        const st = await page.evaluate(function () {
            const box = window.__h.box('sel-disabled');
            return {
                v: window.__h.val('sel-disabled'),
                disabled: box.querySelector(':scope > .value').disabled,
                tabindex: box.querySelector('.trigger').getAttribute('tabindex')
            };
        });
        ok('03 初始值 "2" 正常回显', st.v === '2', st.v);
        ok('03 值域同步 disabled', st.disabled);
        ok('03 trigger tabindex=-1', st.tabindex === '-1', st.tabindex);

        await page.evaluate(function () { window.__h.trig('sel-disabled').click(); });
        await sleep(200);
        ok('03 点击不展开面板', await page.evaluate(function () { return !window.__h.panelOpen(); }));
    });

    // ==================== 04 树形单选 ====================
    section('04', '树形单选（远程片段）', async function () {
        await page.evaluate(function () { window.__h.trig('sel-tree').click(); });
        ok('04 远程装载 11 项', await waitFor(function () {
            return window.__h.opts().length === 11;
        }), await page.evaluate(function () { return window.__h.opts().length; }));

        const tree = await page.evaluate(function () {
            const toggles = window.__h.qa('.bny-select-panel .toggle[data-toggle]');
            const emptyToggles = window.__h.qa('.bny-select-panel .toggle.empty');
            const pad2 = window.__h.qa('.bny-select-panel .option').filter(function (o) {
                return o.getAttribute('data-value') === '12';
            })[0];
            return {
                toggles: toggles.length,
                emptyToggles: emptyToggles.length,
                pad: pad2 ? pad2.style.paddingLeft : ''
            };
        });
        // 有子节点判定按 level 栈：10 总部、11 研发中心、15 市场部、17 分公司、18 上海分部
        ok('04 可折叠节点 5 个', tree.toggles === 5, tree.toggles);
        ok('04 叶子占位箭头 6 个', tree.emptyToggles === 6, tree.emptyToggles);
        ok('04 树形缩进注入（level2 → 48px）', tree.pad === '48px', tree.pad);

        // 折叠总部（第一个 toggle 所在项 value=10）→ 隐藏 6 个后代
        await page.evaluate(function () {
            window.__h.qa('.bny-select-panel .toggle[data-toggle]')[0].click();
        });
        await sleep(120);
        ok('04 折叠总部后剩 5 项可见',
            await page.evaluate(function () { return window.__h.opts().length === 5; }),
            await page.evaluate(function () { return window.__h.opts().length; }));
        await page.evaluate(function () {
            window.__h.qa('.bny-select-panel .toggle[data-toggle]')[0].click();
        });
        await sleep(120);
        ok('04 再点展开恢复 11 项',
            await page.evaluate(function () { return window.__h.opts().length === 11; }),
            await page.evaluate(function () { return window.__h.opts().length; }));

        // 乱序片段按 option-parent 还原：子先父后书写，渲染仍父先子后、层级正确
        await page.evaluate(function () {
            var host = document.createElement('ul');
            host.setAttribute('hx-ext', 'bny-select');
            host.setAttribute('select-name', 'ooo');
            host.setAttribute('select-tree', '');
            host.style.display = 'none';
            host.innerHTML = '<li option-value="3" option-parent="2">孙级</li>' +
                '<li option-value="2" option-parent="1">子级</li>' +
                '<li option-value="1">父级</li>';
            document.body.appendChild(host);
            window.htmx.process(host);
        });
        await sleep(80);
        await page.evaluate(function () {
            var host = window.__h.qa('ul[hx-ext="bny-select"]').filter(function (u) {
                return u.getAttribute('select-name') === 'ooo';
            })[0];
            host.querySelector('.trigger').click();
        });
        await sleep(120);
        const ooo = await page.evaluate(function () {
            const texts = window.__h.opts().map(function (o) { return o.textContent; });
            const pad = window.__h.opts()[2] ? window.__h.opts()[2].style.paddingLeft : '';
            document.body.click();
            const host = window.__h.qa('ul[hx-ext="bny-select"]').filter(function (u) {
                return u.getAttribute('select-name') === 'ooo';
            })[0];
            if (host) host.remove();
            return { texts: texts.join(','), pad: pad };
        });
        ok('04 乱序片段还原（父先子后）', ooo.texts === '父级,子级,孙级', ooo.texts);
        ok('04 乱序片段层级正确（孙级缩进 48px）', ooo.pad === '48px', ooo.pad);

        // 乱序断言顶掉了原面板，重开 sel-tree 继续后续断言
        await page.evaluate(function () { window.__h.trig('sel-tree').click(); });
        await sleep(120);

        // 选上海分部(18)
        await page.evaluate(function () {
            window.__h.qa('.bny-select-panel .option').filter(function (o) { return o.getAttribute('data-value') === '18'; })[0].click();
        });
        await sleep(120);
        const picked = await page.evaluate(function () {
            const box = window.__h.box('sel-tree');
            return {
                v: window.__h.val('sel-tree'),
                closed: !window.__h.panelOpen(),
                text: box.querySelector('.trigger .text').textContent
            };
        });
        ok('04 任意层级可选（值 "18"）', picked.v === '18', picked.v);
        ok('04 单选选完关面板', picked.closed);
        ok('04 回显"上海分部"', picked.text === '上海分部', picked.text);
    });

    // ==================== 05 树形多选联动 ====================
    section('05', '树形多选（父子联动/半选/停用排除）', async function () {
        await page.evaluate(function () { window.__h.trig('sel-tree-multi').click(); });
        ok('05 远程装载', await waitFor(function () { return window.__h.opts().length === 11; }));

        // 勾总部(10) → 后代全选，停用项 14 不参与
        await page.evaluate(function () {
            window.__h.qa('.bny-select-panel .option').filter(function (o) { return o.getAttribute('data-value') === '10'; })[0].click();
        });
        await sleep(120);
        const all = await page.evaluate(function () {
            return {
                v: window.__h.val('sel-tree-multi'),
                checked: window.__h.qa('.bny-select-panel .check.checked').length
            };
        });
        ok('05 勾父全选子（停用 14 排除）', all.v === '10,11,12,13,15,16', all.v);
        ok('05 checked 6 个', all.checked === 6, all.checked);

        // 取消 11（研发中心）→ 联动关闭其子树 12,13 → 只剩兄弟分支 15,16；祖先 10 半选
        await page.evaluate(function () {
            window.__h.qa('.bny-select-panel .option').filter(function (o) { return o.getAttribute('data-value') === '11'; })[0].click();
        });
        await sleep(120);
        const half = await page.evaluate(function () {
            const li10 = window.__h.qa('.bny-select-panel .option').filter(function (o) { return o.getAttribute('data-value') === '10'; })[0];
            return { v: window.__h.val('sel-tree-multi'), half: !!li10.querySelector('.check.half') };
        });
        ok('05 取消中间节点联动关闭子树（"15,16"）', half.v === '15,16', half.v);
        ok('05 祖先显示半选', half.half);

        // 重新勾 11 → 恢复全选，半选消失
        await page.evaluate(function () {
            window.__h.qa('.bny-select-panel .option').filter(function (o) { return o.getAttribute('data-value') === '11'; })[0].click();
        });
        await sleep(120);
        const restore = await page.evaluate(function () {
            const li10 = window.__h.qa('.bny-select-panel .option').filter(function (o) { return o.getAttribute('data-value') === '10'; })[0];
            return {
                v: window.__h.val('sel-tree-multi'),
                halfGone: !li10.querySelector('.check.half')
            };
        });
        ok('05 重新勾选恢复全选', restore.v === '10,11,12,13,15,16', restore.v);
        ok('05 半选态消失', restore.halfGone);

        // 勾分公司(17) → 追加 17,18,19,20
        await page.evaluate(function () {
            window.__h.qa('.bny-select-panel .option').filter(function (o) { return o.getAttribute('data-value') === '17'; })[0].click();
        });
        await sleep(120);
        ok('05 独立子树联动', await page.evaluate(function () {
            return window.__h.val('sel-tree-multi') === '10,11,12,13,15,16,17,18,19,20';
        }), await page.evaluate(function () { return window.__h.val('sel-tree-multi'); }));

        // clear 清空
        await page.evaluate(function () {
            window.__h.box('sel-tree-multi').querySelector('.trigger .clear').click();
        });
        await sleep(120);
        ok('05 清空后值域为空', await page.evaluate(function () {
            return window.__h.val('sel-tree-multi') === '';
        }));
    });

    // ==================== 06 strict 关闭联动 ====================
    section('06', 'strict 关闭联动', async function () {
        await page.evaluate(function () { window.__h.trig('sel-tree-strict').click(); });
        ok('06 远程装载', await waitFor(function () { return window.__h.opts().length === 11; }));

        await page.evaluate(function () {
            window.__h.qa('.bny-select-panel .option').filter(function (o) { return o.getAttribute('data-value') === '17'; })[0].click();
        });
        await sleep(120);
        const st = await page.evaluate(function () {
            return {
                v: window.__h.val('sel-tree-strict'),
                checked: window.__h.qa('.bny-select-panel .check.checked').length
            };
        });
        ok('06 勾选只作用于自身（"17"）', st.v === '17', st.v);
        ok('06 checked 仅 1 个', st.checked === 1, st.checked);

        await page.evaluate(function () {
            window.__h.qa('.bny-select-panel .option').filter(function (o) { return o.getAttribute('data-value') === '10'; })[0].click();
        });
        await sleep(120);
        ok('06 父子互不牵连（"10,17"）', await page.evaluate(function () {
            return window.__h.val('sel-tree-strict') === '10,17';
        }), await page.evaluate(function () { return window.__h.val('sel-tree-strict'); }));

        await page.evaluate(function () { document.body.click(); });
        await sleep(100);
    });

    // ==================== 07 远程 JSON ====================
    section('07', '远程选项（JSON 自动识别）', async function () {
        await page.evaluate(function () { window.__h.trig('sel-remote').click(); });
        ok('07 JSON 装载 9 选项', await waitFor(function () {
            return window.__h.opts().length === 9;
        }), await page.evaluate(function () { return window.__h.opts().length; }));

        const j = await page.evaluate(function () {
            return {
                groups: window.__h.qa('.bny-select-panel .group').length,
                disabled: window.__h.qa('.bny-select-panel .option.disabled').length,
                v: window.__h.val('sel-remote'),
                chips: window.__h.box('sel-remote').querySelectorAll('.chips .chip').length,
                loaded: document.getElementById('sel-remote')._bnySelect.loaded
            };
        });
        ok('07 分组标题渲染（华东）', j.groups === 1, j.groups);
        ok('07 停用项（苏州）', j.disabled === 1, j.disabled);
        ok('07 JSON 预选成都 → 值 "9"', j.v === '9', j.v);
        ok('07 预选 chips 回显', j.chips === 1, j.chips);
        ok('07 loaded 标志置位', j.loaded);

        // 关闭再开：已装载不再重复请求，内容保留
        await page.evaluate(function () { document.body.click(); });
        await sleep(150);
        await page.evaluate(function () { window.__h.trig('sel-remote').click(); });
        await sleep(150);
        ok('07 二次打开内容保留', await page.evaluate(function () {
            return window.__h.opts().length === 9;
        }));

        // 多选追加深圳(6)
        await page.evaluate(function () {
            window.__h.qa('.bny-select-panel .option').filter(function (o) { return o.getAttribute('data-value') === '6'; })[0].click();
        });
        await sleep(120);
        ok('07 追加深圳 → 值按选项序 "6,9"', await page.evaluate(function () {
            return window.__h.val('sel-remote') === '6,9';
        }), await page.evaluate(function () { return window.__h.val('sel-remote'); }));
    });

    // ==================== 08 原生 select 渐进增强 ====================
    section('08', '原生 select 渐进增强', async function () {
        const n = await page.evaluate(function () {
            const sel = document.getElementById('sel-native');
            return {
                inBox: sel.parentNode.classList.contains('bny-select-box'),
                isHost: sel._bnySelect && sel._bnySelect.valueHost === sel,
                multiple: sel.multiple,
                implicit: sel.selectedOptions.length,
                name: sel.name
            };
        });
        ok('08 原生 select 移入包裹', n.inBox);
        ok('08 值域即原生 select', n.isHost);
        ok('08 multiple 已开启', n.multiple);
        ok('08 隐式首项选中已清除', n.implicit === 0, n.implicit);
        ok('08 name 保留不变', n.name === 'nativeCity', n.name);

        await page.evaluate(function () { window.__h.trig('sel-native').click(); });
        ok('08 option/optgroup 装载', await waitFor(function () {
            return window.__h.opts().length === 4;
        }), await page.evaluate(function () { return window.__h.opts().length; }));
        ok('08 optgroup 转分组标题', await page.evaluate(function () {
            return window.__h.qa('.bny-select-panel .group').length === 1;
        }));

        await page.evaluate(function () {
            window.__h.qa('.bny-select-panel .option').filter(function (o) { return o.getAttribute('data-value') === '1'; })[0].click();
        });
        await sleep(120);
        const picked = await page.evaluate(function () {
            const sel = document.getElementById('sel-native');
            const selOpt = Array.prototype.slice.call(sel.options).filter(function (o) { return o.selected; })[0];
            return { v: sel.value, optValue: selOpt ? selOpt.value : null };
        });
        ok('08 选中写入原生 option.selected', picked.v === '1' && picked.optValue === '1', JSON.stringify(picked));

        await page.evaluate(function () { document.body.click(); });
        await sleep(100);
    });

    // ==================== 09 bny-form 校验集成 ====================
    section('09', 'bny-form 校验集成', async function () {
        const req = await page.evaluate(function () {
            return window.__h.host('sel-form').required;
        });
        ok('09 select-required 透传 required', req);

        // 空值提交 → 错误态
        await page.evaluate(function () {
            const form = document.getElementById('sel-form').closest('form');
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });
        await sleep(200);
        const err = await page.evaluate(function () {
            const host = window.__h.host('sel-form');
            return {
                invalid: host.getAttribute('aria-invalid'),
                cls: host.classList.contains('bny-input-error'),
                msg: (document.querySelector('#sel-form') || {}).textContent || ''
            };
        });
        ok('09 空值提交标记 aria-invalid', err.invalid === 'true', err.invalid);
        ok('09 错误类 bny-input-error', err.cls);

        // 选值 → input 事件 → 表单级委托清错
        await page.evaluate(function () { window.__h.trig('sel-form').click(); });
        ok('09 打开面板', await waitFor(function () { return window.__h.panelOpen(); }));
        await page.evaluate(function () {
            window.__h.qa('.bny-select-panel .option').filter(function (o) { return o.getAttribute('data-value') === '2'; })[0].click();
        });
        await sleep(200);
        const fixed = await page.evaluate(function () {
            const host = window.__h.host('sel-form');
            return {
                invalid: host.getAttribute('aria-invalid'),
                cls: host.classList.contains('bny-input-error'),
                v: host.value
            };
        });
        ok('09 选择后值写入 "2"', fixed.v === '2', fixed.v);
        ok('09 input 事件清错（aria-invalid 移除）', fixed.invalid !== 'true', fixed.invalid);
        ok('09 错误类移除', !fixed.cls);
    });

    // ==================== 10 键盘交互 ====================
    section('10', '键盘交互', async function () {
        await page.evaluate(function () {
            const t = window.__h.trig('sel-basic');
            t.focus(); t.click();
        });
        ok('10 打开面板', await waitFor(function () { return window.__h.panelOpen(); }));

        await page.keyboard.press('ArrowDown');
        await sleep(100);
        ok('10 ArrowDown 聚焦首项', await page.evaluate(function () {
            const f = window.__h.q('.bny-select-panel .option.focus');
            return f && f.getAttribute('data-value') === '1';
        }));

        await page.keyboard.press('ArrowDown');
        await sleep(100);
        ok('10 再次下移跳过停用项', await page.evaluate(function () {
            const f = window.__h.q('.bny-select-panel .option.focus');
            return f && f.getAttribute('data-value') === '2';
        }));

        await page.keyboard.press('Enter');
        await sleep(150);
        const kv = await page.evaluate(function () {
            return { v: window.__h.val('sel-basic'), closed: !window.__h.panelOpen() };
        });
        ok('10 Enter 选中聚焦项', kv.v === '2', kv.v);
        ok('10 单选选完自动关面板', kv.closed);
    });

    // ==================== 11 value="0" 树形初始值 ====================
    // 回归：单选树形 select-value="0"（自引用 parent="0"）曾被循环内联动覆盖而全灭
    section('11', 'value=0 树形初始值', async function () {
        // 动态注入：单选树形（用户字面场景）+ 多选树形（联动语义）
        await page.evaluate(function () {
            function mk(id, attrs, lis) {
                const host = document.createElement('ul');
                host.setAttribute('hx-ext', 'bny-select');
                host.setAttribute('select-name', id);
                host.style.display = 'none';
                Object.keys(attrs).forEach(function (k) { host.setAttribute(k, attrs[k]); });
                host.innerHTML = lis;
                document.body.appendChild(host);
                window.htmx.process(host);
            }
            mk('sel-zero-single', { 'select-value': '0', 'select-tree': '' },
                '<li option-value="0" option-parent="0">超级管理员</li>' +
                '<li option-value="1" option-parent="0">管理员</li>' +
                '<li option-value="2">用户</li>');
            mk('sel-zero-multi', { 'select-value': '0,2', 'select-multiple': '', 'select-tree': '' },
                '<li option-value="0" option-parent="0">超级管理员</li>' +
                '<li option-value="2" option-parent="0">用户</li>');
        });
        await sleep(150);

        /** 按 select-name 找注入实例并读取状态（返回纯 JSON，host 缺失时报告） */
        const read = async function (name) {
            return await page.evaluate(function (nm) {
                const host = window.__h.qa('ul[hx-ext="bny-select"]').filter(function (u) {
                    return u.getAttribute('select-name') === nm;
                })[0];
                if (!host) return { found: false };
                const vh = host.querySelector(':scope > .value');
                const text = host.querySelector('.trigger .text');
                return {
                    found: true,
                    value: vh ? vh.value : 'NO_VALUE_HOST',
                    text: text ? text.textContent : 'NO_TEXT',
                    ph: text ? text.classList.contains('placeholder') : null
                };
            }, name);
        };

        const single = await read('sel-zero-single');
        ok('11 单选树形 value=0 值域', single.found && single.value === '0', JSON.stringify(single));
        ok('11 单选树形回显"超级管理员"', single.found && single.text === '超级管理员' && !single.ph, JSON.stringify(single));

        const multi = await read('sel-zero-multi');
        ok('11 多选树形 value=0,2 联动值域', multi.found && multi.value === '0,2', JSON.stringify(multi));

        await page.evaluate(function () {
            ['sel-zero-single', 'sel-zero-multi'].forEach(function (nm) {
                window.__h.qa('ul[hx-ext="bny-select"]').forEach(function (u) {
                    if (u.getAttribute('select-name') === nm) u.remove();
                });
            });
        });
    });

    await run();

    // ==================== 汇总 ====================
    console.log('\n========================================');
    console.log('通过 ' + passed + ' / ' + (passed + failed) + (failed ? '  ✗ 有失败' : '  ✓ 全部通过'));
    if (failures.length) {
        console.log('\n失败清单:');
        failures.forEach(function (f) { console.log(f); });
    }
    if (pageErrors.length) {
        console.log('\n页面错误（不计入断言，但需关注）:');
        pageErrors.slice(0, 5).forEach(function (m) { console.log('  ' + m.split('\n')[0]); });
    }
    console.log('========================================');

    if (SHOT && failed) {
        try {
            await page.screenshot({ path: SHOT, fullPage: true });
            console.log('失败截图: ' + SHOT);
        } catch (e) { /* 截图失败不影响结果 */ }
    }

    await browser.close();
    server.close();
    process.exit(failed ? 1 : 0);
})().catch(function (e) {
    console.error('测试启动失败:', e && e.message || e);
    process.exit(2);
});
