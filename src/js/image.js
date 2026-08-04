/**
 * bny-image — 图片预览组件
 *
 * 设计：
 * - IIFE 自动扫描模式，与 tooltip/datepicker/backtop 一致
 * - 给 img 加 data-preview 属性即可启用点击预览
 * - 支持两种分组形式（同一组内可翻页）：
 *   1) 容器就近分组：用 <div class="bny-image-group"> 包裹若干 <img img-preview>，
 *      点击任一张会在灯箱内翻页浏览整组（头像式重叠布局，见 image.css）
 *   2) 旧版全局分组：img 加 img-preview-group="组名"，同组名图片跨容器翻页
 * - Lightbox 全屏遮罩，支持缩放/旋转/翻页/键盘
 *
 * 用法：
 *   <img src="thumb.jpg" data-preview img-preview-src="full.jpg">
 *   <div class="bny-image-group" img-preview-size="64">
 *     <img src="a.jpg" data-preview img-preview-src="a-full.jpg" img-preview-tags="封面:green,实拍">
 *     <img src="b.jpg" data-preview img-preview-src="b-full.jpg" img-preview-tags="风景:blue">
 *   </div>
 *
 * 标签（Tag）：每张图可用 data-preview-tags 声明左上角小标签（复用 .bny-tag 视觉），
 *   支持按标签指定颜色：data-preview-tags="封面:green,实拍:blue"（逗号分隔，text:color）。
 *   堆叠中每张卡片显示各自标签；打开灯箱翻页时大图左上角浮层显示当前图标签。
 */
(function () {
    'use strict';

    // 单例 lightbox 容器
    var viewer = null;
    var imgEl = null;
    var current = {
        list: [],     // 当前组的图片大图 src 列表
        index: 0,    // 当前索引
        tagList: [], // 与 list 平行：每张图的标签数组（[{text,color}]）
        scale: 1,
        rotate: 0,
        x: 0,
        y: 0
    };
    var groups = {}; // group name → [src list]（首次扫描时缓存）

    /**
     * 创建/获取 lightbox 单例
     */
    function getViewer() {
        if (viewer) return viewer;
        viewer = document.createElement('div');
        viewer.className = 'bny-image-viewer';
        viewer.innerHTML =
            '<div class="bny-image-mask"></div>' +
            '<div class="bny-image-container">' +
                '<img class="bny-image-large" alt="preview">' +
            '</div>' +
            '<div class="bny-image-tools">' +
                '<a class="bny-image-tool" img-action="prev" title="上一张（←）"><i class="bny-icon icon-left"></i></a>' +
                '<a class="bny-image-tool" img-action="zoom-out" title="缩小（-）"><i class="bny-icon icon-minus"></i></a>' +
                '<a class="bny-image-tool" img-action="zoom-in" title="放大（+）"><i class="bny-icon icon-plus"></i></a>' +
                '<a class="bny-image-tool" img-action="reset" title="重置（0）"><i class="bny-icon icon-sync"></i></a>' +
                '<a class="bny-image-tool" img-action="rotate-left" title="左旋"><i class="bny-icon icon-undo"></i></a>' +
                '<a class="bny-image-tool" img-action="rotate-right" title="右旋"><i class="bny-icon icon-redo"></i></a>' +
                '<a class="bny-image-tool" img-action="next" title="下一张（→）"><i class="bny-icon icon-right"></i></a>' +
            '</div>' +
            '<a class="bny-image-close" title="关闭（ESC）"><i class="bny-icon icon-close"></i></a>' +
            '<div class="bny-image-tags bny-image-tags--viewer"></div>' +
            '<div class="bny-image-counter"></div>';
        document.body.appendChild(viewer);

        imgEl = viewer.querySelector('.bny-image-large');

        // 点击遮罩或关闭按钮关闭
        viewer.querySelector('.bny-image-mask').addEventListener('click', close);
        viewer.querySelector('.bny-image-close').addEventListener('click', close);

        // 工具栏
        viewer.querySelector('.bny-image-tools').addEventListener('click', function (e) {
            var tool = e.target.closest('.bny-image-tool');
            if (!tool) return;
            var action = tool.getAttribute('img-action');
            handleAction(action);
        });

        // 阻止容器点击冒泡到遮罩（图片区域内点击不关闭）
        viewer.querySelector('.bny-image-container').addEventListener('click', function (e) {
            e.stopPropagation();
        });

        // 滚轮缩放
        imgEl.addEventListener('wheel', function (e) {
            e.preventDefault();
            if (e.deltaY < 0) {
                setScale(current.scale + 0.1);
            } else {
                setScale(current.scale - 0.1);
            }
        }, { passive: false });

        // 拖动平移
        var dragStart = null;
        imgEl.addEventListener('mousedown', function (e) {
            if (e.button !== 0) return;
            dragStart = { x: e.clientX, y: e.clientY, ox: current.x, oy: current.y };
            imgEl.classList.add('grabbing');
        });
        document.addEventListener('mousemove', function (e) {
            if (!dragStart) return;
            current.x = dragStart.ox + (e.clientX - dragStart.x);
            current.y = dragStart.oy + (e.clientY - dragStart.y);
            applyTransform();
        });
        document.addEventListener('mouseup', function () {
            if (dragStart) {
                dragStart = null;
                imgEl.classList.remove('grabbing');
            }
        });

        return viewer;
    }

    /**
     * 打开预览
     * @param {string[]} list 大图 src 列表
     * @param {number} index 起始索引
     */
    function open(list, index, tagList) {
        if (!list || !list.length) return;
        current.list = list;
        current.tagList = tagList || [];
        current.index = Math.max(0, Math.min(index, list.length - 1));
        resetTransform();
        getViewer();
        showImage();
        viewer.classList.add('show');
        document.addEventListener('keydown', onKeydown);
        // 阻止 body 滚动
        document.body.style.overflow = 'hidden';
    }

    /**
     * 关闭预览
     */
    function close() {
        if (!viewer) return;
        viewer.classList.remove('show');
        document.removeEventListener('keydown', onKeydown);
        document.body.style.overflow = '';
    }

    /**
     * 显示当前索引的图片
     */
    function showImage() {
        var src = current.list[current.index];
        if (!src) return;
        // 加载状态：先清空 src，加载完成后再显示
        imgEl.classList.add('loading');
        var tmp = new Image();
        tmp.onload = function () {
            imgEl.src = src;
            imgEl.classList.remove('loading');
        };
        tmp.onerror = function () {
            imgEl.classList.remove('loading');
            imgEl.src = '';
            imgEl.alt = '图片加载失败';
        };
        tmp.src = src;
        // 计数器
        var counter = viewer.querySelector('.bny-image-counter');
        if (current.list.length > 1) {
            counter.textContent = (current.index + 1) + ' / ' + current.list.length;
            counter.style.display = '';
        } else {
            counter.style.display = 'none';
        }
        // 工具栏上一张/下一张按钮的可用状态
        var prevBtn = viewer.querySelector('[img-action="prev"]');
        var nextBtn = viewer.querySelector('[img-action="next"]');
        prevBtn.classList.toggle('disabled', current.list.length <= 1);
        nextBtn.classList.toggle('disabled', current.list.length <= 1);

        // 灯箱标签浮层：显示当前图片各自的标签
        var tagBox = viewer.querySelector('.bny-image-tags--viewer');
        renderTags(tagBox, current.tagList[current.index] || []);
    }

    /**
     * 处理工具栏动作
     */
    function handleAction(action) {
        switch (action) {
            case 'prev':
                if (current.list.length > 1) {
                    current.index = (current.index - 1 + current.list.length) % current.list.length;
                    resetTransform();
                    showImage();
                }
                break;
            case 'next':
                if (current.list.length > 1) {
                    current.index = (current.index + 1) % current.list.length;
                    resetTransform();
                    showImage();
                }
                break;
            case 'zoom-in':
                setScale(current.scale + 0.2);
                break;
            case 'zoom-out':
                setScale(current.scale - 0.2);
                break;
            case 'rotate-left':
                current.rotate -= 90;
                applyTransform();
                break;
            case 'rotate-right':
                current.rotate += 90;
                applyTransform();
                break;
            case 'reset':
                resetTransform();
                applyTransform();
                break;
        }
    }

    /**
     * 设置缩放比例
     */
    function setScale(s) {
        current.scale = Math.max(0.2, Math.min(5, s));
        applyTransform();
    }

    /**
     * 重置变换状态
     */
    function resetTransform() {
        current.scale = 1;
        current.rotate = 0;
        current.x = 0;
        current.y = 0;
        applyTransform();
    }

    /**
     * 应用变换到图片
     */
    function applyTransform() {
        if (!imgEl) return;
        imgEl.style.transform =
            'translate(' + current.x + 'px, ' + current.y + 'px) ' +
            'scale(' + current.scale + ') ' +
            'rotate(' + current.rotate + 'deg)';
    }

    /**
     * 键盘事件
     */
    function onKeydown(e) {
        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                close();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                handleAction('prev');
                break;
            case 'ArrowRight':
                e.preventDefault();
                handleAction('next');
                break;
            case '+':
            case '=':
                e.preventDefault();
                handleAction('zoom-in');
                break;
            case '-':
                e.preventDefault();
                handleAction('zoom-out');
                break;
            case '0':
                e.preventDefault();
                handleAction('reset');
                break;
        }
    }

    /**
     * 解析 data-preview-tags 属性
     *   "封面,实拍"            → [{text:"封面"},{text:"实拍"}]
     *   "封面:green,实拍:blue" → [{text:"封面",color:"green"},{text:"实拍",color:"blue"}]
     * @param {string} attr
     * @returns {{text:string,color:string}[]}
     */
    function parseTags(attr) {
        if (!attr) return [];
        return attr.split(',').map(function (part) {
            part = part.trim();
            if (!part) return null;
            var i = part.indexOf(':');
            if (i > 0) return { text: part.slice(0, i).trim(), color: part.slice(i + 1).trim() };
            return { text: part, color: '' };
        }).filter(Boolean);
    }

    /**
     * 把标签数组渲染进容器（用 textContent，避免 XSS）
     * @param {HTMLElement} box
     * @param {{text:string,color:string}[]} tags
     */
    function renderTags(box, tags) {
        if (!box) return;
        box.textContent = '';
        (tags || []).forEach(function (t) {
            var el = document.createElement('span');
            el.className = 'bny-tag';
            el.textContent = t.text;
            if (t.color) el.setAttribute('tag-color', t.color);
            box.appendChild(el);
        });
    }

    /**
     * 为每张 img[img-preview] 包一层 .bny-image-item（定位上下文），
     * 并就地注入左上角标签浮层。用 _bnyImageWrapped 守卫避免 SPA 重复扫描重复包裹。
     * @param {HTMLImageElement} img
     * @returns {HTMLElement} 包裹层
     */
    function ensureItem(img) {
        if (img._bnyImageWrapped) return img.parentNode;
        var item = document.createElement('span');
        item.className = 'bny-image-item';
        img.parentNode.insertBefore(item, img);
        item.appendChild(img);
        img._bnyImageWrapped = true;
        var tags = parseTags(img.getAttribute('img-preview-tags'));
        if (tags.length) {
            var box = document.createElement('span');
            box.className = 'bny-image-tags';
            renderTags(box, tags);
            item.appendChild(box);
        }
        return item;
    }

    /**
     * 收集一组图片的大图 src，并返回当前图片在组内的索引
     * @param {NodeList} groupImgs 组内 img 元素集合
     * @param {HTMLElement} currentImg 当前点击的图片
     * @returns {{list: string[], idx: number, tags: Array}}
     */
    function collectList(groupImgs, currentImg) {
        var list = [];
        var tags = [];
        var idx = 0;
        Array.prototype.forEach.call(groupImgs, function (g, i) {
            list.push(g.getAttribute('img-preview-src') || g.src);
            tags.push(parseTags(g.getAttribute('img-preview-tags')));
            if (g === currentImg) idx = i;
        });
        return { list: list, idx: idx, tags: tags };
    }

    /**
     * 扫描页面中所有 data-preview 图片并绑定
     * @param {HTMLElement} root
     */
    function scan(root) {
        // 容器尺寸配置：<div class="bny-image-group" img-preview-size="64"> 设置缩略图尺寸
        var sized = (root || document).querySelectorAll('.bny-image-group[img-preview-size]');
        Array.prototype.forEach.call(sized, function (g) {
            g.style.setProperty('--bny-image-group-size', g.getAttribute('img-preview-size') + 'px');
        });

        var imgs = (root || document).querySelectorAll('img[img-preview]');
        Array.prototype.forEach.call(imgs, function (img) {
            if (img._bnyImageBound) return;
            img._bnyImageBound = true;
            img.classList.add('bny-image-thumb');
            ensureItem(img); // 包 .bny-image-item 并注入左上角标签

            img.addEventListener('click', function () {
                var fullSrc = img.getAttribute('img-preview-src') || img.src;
                // 优先：容器就近分组（.bny-image-group 内所有图片翻页）
                var container = img.closest('.bny-image-group');
                if (container) {
                    var r = collectList(container.querySelectorAll('img[img-preview]'), img);
                    open(r.list, r.idx, r.tags);
                    return;
                }
                // 兼容旧版：data-preview-group 全局分组
                var group = img.getAttribute('img-preview-group');
                if (group) {
                    var groupImgs = document.querySelectorAll('img[img-preview][img-preview-group="' + CSS.escape(group) + '"]');
                    var r2 = collectList(groupImgs, img);
                    open(r2.list, r2.idx, r2.tags);
                    return;
                }
                open([fullSrc], 0, [parseTags(img.getAttribute('img-preview-tags'))]);
            });
        });
    }

    // ====== 初始化 ======
    if (typeof htmx !== 'undefined') {
        htmx.onLoad(function (content) { scan(content); });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { scan(document); });
    } else {
        scan(document);
    }
})();
