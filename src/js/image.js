/**
 * bny-image — 图片预览组件
 *
 * 设计：
 * - IIFE 自动扫描模式，与 tooltip/datepicker/backtop 一致
 * - 给 img 加 data-preview 属性即可启用点击预览
 * - 支持 data-preview-group 分组（同一组内可翻页）
 * - Lightbox 全屏遮罩，支持缩放/旋转/翻页/键盘
 *
 * 用法：
 *   <img src="thumb.jpg" data-preview data-preview-src="full.jpg">
 *   <img src="a.jpg" data-preview data-preview-group="gallery">
 *   <img src="b.jpg" data-preview data-preview-group="gallery">
 */
(function () {
    'use strict';

    // 单例 lightbox 容器
    var viewer = null;
    var imgEl = null;
    var current = {
        list: [],     // 当前组的图片大图 src 列表
        index: 0,    // 当前索引
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
                '<a class="bny-image-tool" data-action="prev" title="上一张（←）"><i class="bny-icon icon-left"></i></a>' +
                '<a class="bny-image-tool" data-action="zoom-out" title="缩小（-）"><i class="bny-icon icon-minus"></i></a>' +
                '<a class="bny-image-tool" data-action="zoom-in" title="放大（+）"><i class="bny-icon icon-plus"></i></a>' +
                '<a class="bny-image-tool" data-action="reset" title="重置（0）"><i class="bny-icon icon-sync"></i></a>' +
                '<a class="bny-image-tool" data-action="rotate-left" title="左旋"><i class="bny-icon icon-undo"></i></a>' +
                '<a class="bny-image-tool" data-action="rotate-right" title="右旋"><i class="bny-icon icon-redo"></i></a>' +
                '<a class="bny-image-tool" data-action="next" title="下一张（→）"><i class="bny-icon icon-right"></i></a>' +
            '</div>' +
            '<a class="bny-image-close" title="关闭（ESC）"><i class="bny-icon icon-close"></i></a>' +
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
            var action = tool.getAttribute('data-action');
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
    function open(list, index) {
        if (!list || !list.length) return;
        current.list = list;
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
        var prevBtn = viewer.querySelector('[data-action="prev"]');
        var nextBtn = viewer.querySelector('[data-action="next"]');
        prevBtn.classList.toggle('disabled', current.list.length <= 1);
        nextBtn.classList.toggle('disabled', current.list.length <= 1);
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
     * 扫描页面中所有 data-preview 图片并绑定
     * @param {HTMLElement} root
     */
    function scan(root) {
        var imgs = (root || document).querySelectorAll('img[data-preview]');
        Array.prototype.forEach.call(imgs, function (img) {
            if (img._bnyImageBound) return;
            img._bnyImageBound = true;
            img.classList.add('bny-image-thumb');

            img.addEventListener('click', function () {
                var group = img.getAttribute('data-preview-group');
                var fullSrc = img.getAttribute('data-preview-src') || img.src;
                if (group) {
                    // 收集同组的所有图片大图
                    var groupImgs = document.querySelectorAll('img[data-preview][data-preview-group="' + CSS.escape(group) + '"]');
                    var list = [];
                    var idx = 0;
                    Array.prototype.forEach.call(groupImgs, function (g, i) {
                        list.push(g.getAttribute('data-preview-src') || g.src);
                        if (g === img) idx = i;
                    });
                    open(list, idx);
                } else {
                    open([fullSrc], 0);
                }
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
