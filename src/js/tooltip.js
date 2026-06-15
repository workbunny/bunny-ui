(function () {
    'use strict';

    var tip = null;
    var current = null;
    var timer = null;
    var gap = 6;

    var DIRS = [
        ['top', 'top-start', 'top-end'],
        ['bottom', 'bottom-start', 'bottom-end'],
        ['left', 'left-start', 'left-end'],
        ['right', 'right-start', 'right-end']
    ];

    function ensure() {
        if (tip) return;
        tip = document.createElement('div');
        tip.className = 'bny-tooltip';
        document.body.appendChild(tip);
    }

    function show(elt) {
        ensure();
        clearTimeout(timer);
        current = elt;

        var text = elt.getAttribute('bny-tip');
        if (!text) return;

        tip.textContent = text;
        tip.style.display = 'block';
        tip.style.visibility = 'hidden';
        tip.offsetHeight; // reflow

        var tw = tip.offsetWidth, th = tip.offsetHeight;
        var best = pick(elt, tw, th);
        var r = elt.getBoundingClientRect();

        tip.className = 'bny-tooltip ' + best;
        var p = pos(best, r, tw, th);

        tip.style.left = p.x + 'px';
        tip.style.top = p.y + 'px';
        tip.style.right = 'auto';
        tip.style.bottom = 'auto';
        tip.style.visibility = 'visible';
        tip.classList.add('visible');
    }

    function hide() {
        timer = setTimeout(function () {
            if (tip) tip.classList.remove('visible');
            current = null;
        }, 100);
    }

    function hideNow() {
        clearTimeout(timer);
        if (tip) tip.classList.remove('visible');
        current = null;
    }

    // ---- 方向评分 ----
    function pick(elt, tw, th) {
        var r = elt.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
        var best = 'top', bestS = -9999;
        for (var i = 0; i < DIRS.length; i++) {
            for (var j = 0; j < DIRS[i].length; j++) {
                var d = DIRS[i][j], s = score(d, r, tw, th, vw, vh);
                // 同组方向，完全可见的优先；不同组按全局优先级
                if (s >= 10 && bestS < 10) { bestS = s; best = d; }
                else if (s > bestS) { bestS = s; best = d; }
            }
        }
        return best;
    }

    function score(dir, r, tw, th, vw, vh) {
        var p = raw(dir, r, tw, th), s = 0, pad = 4;
        if (p.x >= pad && p.y >= pad && p.x + tw <= vw - pad && p.y + th <= vh - pad) s += 100;
        if (p.x < 0) s += p.x; if (p.x + tw > vw) s -= (p.x + tw - vw);
        if (p.y < 0) s += p.y; if (p.y + th > vh) s -= (p.y + th - vh);
        for (var i = 0; i < DIRS.length; i++) if (DIRS[i].indexOf(dir) !== -1) { s += (4 - i) * 5; break; }
        return s;
    }

    function raw(dir, r, tw, th) {
        switch (dir) {
            case 'top':          return { x: r.left + r.width/2 - tw/2, y: r.top - gap - th };
            case 'top-start':    return { x: r.left,                       y: r.top - gap - th };
            case 'top-end':      return { x: r.right - tw,                 y: r.top - gap - th };
            case 'bottom':       return { x: r.left + r.width/2 - tw/2, y: r.bottom + gap };
            case 'bottom-start': return { x: r.left,                       y: r.bottom + gap };
            case 'bottom-end':   return { x: r.right - tw,                 y: r.bottom + gap };
            case 'left':         return { x: r.left - gap - tw,            y: r.top + r.height/2 - th/2 };
            case 'left-start':   return { x: r.left - gap - tw,            y: r.top };
            case 'left-end':     return { x: r.left - gap - tw,            y: r.bottom - th };
            case 'right':        return { x: r.right + gap,                y: r.top + r.height/2 - th/2 };
            case 'right-start':  return { x: r.right + gap,                y: r.top };
            case 'right-end':    return { x: r.right + gap,                y: r.bottom - th };
        }
        return { x: r.left + r.width/2 - tw/2, y: r.top - gap - th };
    }

    function pos(dir, r, tw, th) {
        var p = raw(dir, r, tw, th), pad = 4;
        return {
            x: Math.max(pad, Math.min(p.x, innerWidth - tw - pad)),
            y: Math.max(pad, Math.min(p.y, innerHeight - th - pad))
        };
    }

    // ---- 绑定 ----
    function bind(elt) {
        if (elt._bnyTip) return;
        elt._bnyTip = true;
        elt.addEventListener('mouseenter', function () { show(elt); });
        elt.addEventListener('mouseleave', hide);
        elt.addEventListener('focus',      function () { show(elt); });
        elt.addEventListener('blur',       hideNow);
    }

    function scan(root) {
        if (root.nodeType !== 1) return;
        if (root.hasAttribute && root.hasAttribute('bny-tip')) bind(root);
        if (root.querySelectorAll) root.querySelectorAll('[bny-tip]').forEach(bind);
    }

    // 初始化
    if (typeof htmx !== 'undefined') {
        htmx.onLoad(function (content) { scan(content); });
    } else {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () { scan(document.body); });
        } else {
            scan(document.body);
        }
    }

    window.addEventListener('scroll', function () { if (current) hideNow(); }, true);
    window.addEventListener('resize', function () { if (current) hideNow(); });
})();
