(function () {
    'use strict';

    var WEEKS = ['日', '一', '二', '三', '四', '五', '六'];
    var MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    var currentPanel = null;
    var currentInstance = null;

    // ====== 全局实例追踪与事件委托（避免每个实例重复注册 document/window 监听器）======

    var instances = [];
    var globalBound = false;

    /**
     * 全局事件委托：只注册一次 document click / window resize / window scroll
     * 所有 DatePicker 实例共享这三个监听器
     */
    function bindGlobalListeners() {
        if (globalBound) return;
        globalBound = true;

        // document click：点击面板外部时关闭。
        // 捕获阶段监听（第三参 true）：先于任何目标阶段的 stopPropagation 执行，
        // 否则 tab/menu 等组件点击会截断冒泡导致面板关不掉（与 bny-select/bny-dropdown 同款陷阱）。
        // input/面板豁免判断与阶段无关，行为不变。
        document.addEventListener('click', function (e) {
            // 逆序遍历，便于安全清理已断开连接的实例
            for (var i = instances.length - 1; i >= 0; i--) {
                var inst = instances[i];
                // 自清理：input 已从 DOM 移除 → 销毁实例
                if (!inst.input.isConnected) {
                    inst._rawDestroy();
                    instances.splice(i, 1);
                    continue;
                }
                if (!inst.panel.classList.contains('show')) continue;
                if (!inst.panel.contains(e.target) && e.target !== inst.input &&
                    (!inst.rangeInput || e.target !== inst.rangeInput)) {
                    inst.close();
                }
            }
        }, true);

        // window resize：面板打开时重新定位
        window.addEventListener('resize', function () {
            for (var i = 0; i < instances.length; i++) {
                if (instances[i].panel.classList.contains('show')) {
                    instances[i].position();
                }
            }
        });

        // window scroll（capture）：面板打开时重新定位
        window.addEventListener('scroll', function () {
            for (var i = 0; i < instances.length; i++) {
                if (instances[i].panel.classList.contains('show')) {
                    instances[i].position();
                }
            }
        }, true);
    }

    // ====== DatePicker 类 ======

    function DatePicker(input, options) {
        this.input = input;
        this.mode = options.mode || 'date';  // date|datetime|time|month|range|year-month
        this.format = options.format || null;
        this.rangeInput = options.rangeInput || null;  // 区间模式第二个 input
        this.min = options.min || null;
        this.max = options.max || null;

        // 预解析 min/max 为可比较的数字，避免 isDisabled 每次调用都 new Date()
        this._minStamp = parseBoundary(this.min);
        this._maxStamp = parseBoundary(this.max);

        // 当前展示的年月
        this.viewYear = new Date().getFullYear();
        this.viewMonth = new Date().getMonth();
        this.viewType = 'calendar'; // calendar|months|years

        // 选中的值
        this.selected = { y: null, m: null, d: null, H: 0, M: 0, S: 0 };
        this.rangeSelected = { y: null, m: null, d: null }; // 区间结束

        // 临时编辑值（确认前）
        this.temp = { y: null, m: null, d: null, H: 0, M: 0, S: 0 };

        this.initPanel();
        this.bindEvents();
    }

    /**
     * 解析边界值（min/max）为时间戳，避免重复 new Date()
     * 接受 Date 对象或日期字符串
     * @param {Date|string|*} v
     * @returns {number|null}
     */
    function parseBoundary(v) {
        if (!v) return null;
        var d = (v instanceof Date) ? v : new Date(v);
        if (isNaN(d.getTime())) return null;
        return d.getTime();
    }

    DatePicker.prototype.initPanel = function () {
        if (this.panel) return;

        this.wrap = document.createElement('span');
        this.wrap.className = 'bny-datepicker-wrap';
        this.input.parentNode.insertBefore(this.wrap, this.input);
        this.wrap.appendChild(this.input);

        this.panel = document.createElement('div');
        this.panel.className = 'bny-datepicker-panel';
        this.panel.innerHTML = this.buildHTML();
        this.wrap.appendChild(this.panel);
        // 面板内 click/keydown 事件在 bindEvents 中统一绑定（便于 destroy 时解绑）
    };

    DatePicker.prototype.buildHTML = function () {
        var h = '';
        if (this.needsDate()) {
            h += '<div class="bny-datepicker-header">';
            h += '<button class="bny-datepicker-nav prev-year" title="上一年">&laquo;</button>';
            h += '<button class="bny-datepicker-nav prev">&lsaquo;</button>';
            h += '<span class="bny-datepicker-title"></span>';
            h += '<button class="bny-datepicker-nav next">&rsaquo;</button>';
            h += '<button class="bny-datepicker-nav next-year" title="下一年">&raquo;</button>';
            h += '</div>';
            h += '<div class="bny-datepicker-body"></div>';
        }
        if (this.needsTime()) {
            h += '<div class="bny-datepicker-time">';
            h += '<div class="time-col"><button class="time-btn up" dt-field="H">&#9650;</button><span class="time-val" dt-field="H">00</span><button class="time-btn down" dt-field="H">&#9660;</button></div>';
            h += '<span class="time-sep">:</span>';
            h += '<div class="time-col"><button class="time-btn up" dt-field="M">&#9650;</button><span class="time-val" dt-field="M">00</span><button class="time-btn down" dt-field="M">&#9660;</button></div>';
            h += '<span class="time-sep">:</span>';
            h += '<div class="time-col"><button class="time-btn up" dt-field="S">&#9650;</button><span class="time-val" dt-field="S">00</span><button class="time-btn down" dt-field="S">&#9660;</button></div>';
            h += '</div>';
        }
        h += '<div class="bny-datepicker-footer">';
        if (this.needsDate()) h += '<button class="bny-datepicker-btn today">今天</button>';
        h += '<button class="bny-datepicker-btn cancel">取消</button>';
        h += '<button class="bny-datepicker-btn confirm">确定</button>';
        h += '</div>';
        return h;
    };

    DatePicker.prototype.bindEvents = function () {
        var self = this;
        // 存储引用以便 destroy 时解绑
        this._onClick = function () { self.open(); };
        this._onFocus = function () { self.open(); };
        this._onPanelClick = function (e) {
            e.stopPropagation();  // 阻止冒泡到 document，避免 render 替换 DOM 后误触发关闭
            var el = e.target;
            if (el.closest('.day-cell')) self.handleDayClick(el.closest('.day-cell'));
            else if (el.closest('.month-cell')) self.handleMonthClick(el.closest('.month-cell'));
            else if (el.closest('.year-cell')) self.handleYearClick(el.closest('.year-cell'));
            else if (el.closest('.bny-datepicker-nav.prev')) self.prevMonth();
            else if (el.closest('.bny-datepicker-nav.next')) self.nextMonth();
            else if (el.closest('.bny-datepicker-nav.prev-year')) { self.viewYear--; self.render(); }
            else if (el.closest('.bny-datepicker-nav.next-year')) { self.viewYear++; self.render(); }
            else if (el.closest('.bny-datepicker-title')) self.toggleView();
            else if (el.closest('.time-btn.up')) self.handleTimeBtn(el.closest('.time-btn.up'));
            else if (el.closest('.time-btn.down')) self.handleTimeBtn(el.closest('.time-btn.down'));
            else if (el.closest('.bny-datepicker-btn.today')) self.selectToday();
            else if (el.closest('.bny-datepicker-btn.confirm')) self.confirm();
            else if (el.closest('.bny-datepicker-btn.cancel')) self.cancel();
        };
        this._onKeydown = function (e) { self.handleKeydown(e); };

        this.input.addEventListener('click', this._onClick);
        this.input.addEventListener('focus', this._onFocus);
        this.panel.addEventListener('click', this._onPanelClick);
        this.panel.addEventListener('keydown', this._onKeydown);

        // 注册到全局实例列表（document/window 监听器由 bindGlobalListeners 统一管理）
        instances.push(this);
        bindGlobalListeners();
    };

    /**
     * 销毁实例：解绑所有事件监听器，从实例列表移除
     * 由全局 click 委托在检测到 input 断开连接时自动调用，
     * 也可手动调用于 htmx:beforeOnNodeDisposal
     */
    DatePicker.prototype._rawDestroy = function () {
        // 关闭面板
        if (this.panel && this.panel.classList.contains('show')) this.close();
        // 解绑 input 事件
        if (this._onClick) this.input.removeEventListener('click', this._onClick);
        if (this._onFocus) this.input.removeEventListener('focus', this._onFocus);
        // 解绑 panel 事件
        if (this._onPanelClick && this.panel) this.panel.removeEventListener('click', this._onPanelClick);
        if (this._onKeydown && this.panel) this.panel.removeEventListener('keydown', this._onKeydown);
        // 清除标记，允许重新初始化
        this.input._bnyDatePicker = false;
    };

    /**
     * 公开 destroy 方法：解绑 + 从实例列表移除
     */
    DatePicker.prototype.destroy = function () {
        var idx = instances.indexOf(this);
        if (idx !== -1) instances.splice(idx, 1);
        this._rawDestroy();
    };

    /**
     * 键盘事件处理
     * - ←/→: 前一日/后一日
     * - ↑/↓: 上一周/下一周
     * - Enter: 确认选择（confirm）
     * - Escape: 取消并关闭（cancel）
     * 仅在 calendar 视图下响应方向键；months/years 视图也支持方向键导航
     * @param {KeyboardEvent} e
     */
    DatePicker.prototype.handleKeydown = function (e) {
        var key = e.key;
        if (key === 'Enter') {
            e.preventDefault();
            this.confirm();
            return;
        }
        if (key === 'Escape') {
            e.preventDefault();
            this.cancel();
            return;
        }
        // 仅在 date/datetime/range/year-month 模式下响应方向键
        if (!this.needsDate()) return;
        if (this.viewType === 'calendar') {
            // 日历视图：方向键移动临时日期
            if (this.temp.y === null) {
                var t = new Date();
                this.temp.y = t.getFullYear();
                this.temp.m = t.getMonth();
                this.temp.d = t.getDate();
            }
            var y = this.temp.y, m = this.temp.m, d = this.temp.d;
            var cur = new Date(y, m, d);
            switch (key) {
                case 'ArrowLeft':  cur.setDate(cur.getDate() - 1); break;
                case 'ArrowRight': cur.setDate(cur.getDate() + 1); break;
                case 'ArrowUp':    cur.setDate(cur.getDate() - 7); break;
                case 'ArrowDown':  cur.setDate(cur.getDate() + 7); break;
                default: return;
            }
            e.preventDefault();
            this.temp.y = cur.getFullYear();
            this.temp.m = cur.getMonth();
            this.temp.d = cur.getDate();
            // 视图跟随到目标月份
            this.viewYear = this.temp.y;
            this.viewMonth = this.temp.m;
            this.render();
        } else if (this.viewType === 'months') {
            // 月份视图：←/→ 切换月份
            switch (key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    if (this.temp.m > 0) this.temp.m--;
                    else { this.temp.m = 11; this.viewYear--; }
                    this.render();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (this.temp.m < 11) this.temp.m++;
                    else { this.temp.m = 0; this.viewYear++; }
                    this.render();
                    break;
                case 'ArrowUp':
                    e.preventDefault(); this.viewYear--; this.render(); break;
                case 'ArrowDown':
                    e.preventDefault(); this.viewYear++; this.render(); break;
            }
        } else if (this.viewType === 'years') {
            // 年份视图：←/→ 切换 1 年，↑/↓ 切换 4 年
            if (this.temp.y === null) this.temp.y = this.viewYear;
            switch (key) {
                case 'ArrowLeft':  e.preventDefault(); this.temp.y--; this.render(); break;
                case 'ArrowRight': e.preventDefault(); this.temp.y++; this.render(); break;
                case 'ArrowUp':    e.preventDefault(); this.temp.y -= 4; this.render(); break;
                case 'ArrowDown':  e.preventDefault(); this.temp.y += 4; this.render(); break;
            }
        }
    };

    DatePicker.prototype.needsTime = function () {
        return this.mode === 'datetime' || this.mode === 'time';
    };
    DatePicker.prototype.needsDate = function () {
        return this.mode !== 'time';
    };
    DatePicker.prototype.needsMonthOnly = function () {
        return this.mode === 'year-month';
    };

    // ====== 打开/关闭 ======

    DatePicker.prototype.open = function () {
        if (currentPanel && currentPanel !== this) currentPanel.close();
        currentPanel = this;
        currentInstance = this;

        this.parseFromInput();
        this.initTemp();
        if (this.needsMonthOnly()) this.viewType = 'months';
        else if (this.needsDate()) this.viewType = 'calendar';
        this.panel.className = 'bny-datepicker-panel' + (this.mode === 'time' ? ' mode-time' : '');
        this.render();
        // 先定位再显示（过渡动画需要元素已有尺寸）
        this.position();
        this.panel.classList.add('show');
        // 面板获得焦点，便于键盘操作
        var self = this;
        requestAnimationFrame(function () {
            if (self.panel) {
                self.panel.setAttribute('tabindex', '-1');
                self.panel.focus();
            }
        });
    };

    DatePicker.prototype.close = function () {
        this.panel.classList.remove('show');
        if (currentPanel === this) currentPanel = null;
        if (currentInstance === this) currentInstance = null;
        // 关闭后回流焦点到 input，并触发 change 事件
        // HTMX 集成场景依赖 input 的 change 事件提交（hx-trigger="change"）
        try {
            var event = new Event('change', { bubbles: true });
            this.input.dispatchEvent(event);
        } catch (_) { /* 兼容旧浏览器 */ }
    };

    DatePicker.prototype.cancel = function () {
        // 取消操作：清空输入框
        this.input.value = '';
        this.close();
    };

    DatePicker.prototype.confirm = function () {
        if (!this.panel.classList.contains('show')) return;
        // 未选日期时默认当天
        if (this.needsDate() && this.temp.y === null) {
            var t = new Date();
            this.temp.y = t.getFullYear();
            this.temp.m = t.getMonth();
            this.temp.d = t.getDate();
        }
        this.selected.y = this.temp.y;
        this.selected.m = this.temp.m;
        this.selected.d = this.temp.d;
        this.selected.H = this.temp.H;
        this.selected.M = this.temp.M;
        this.selected.S = this.temp.S;
        this.syncInput();
        this.close();
    };

    // ====== 值同步 ======

    DatePicker.prototype.parseFromInput = function () {
        var v = this.input.value.trim();
        this.selected = { y: null, m: null, d: null, H: 0, M: 0, S: 0 };
        if (!v) return;

        // 尝试解析常见格式
        var match = v.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
        if (match) {
            this.selected.y = +match[1];
            this.selected.m = +match[2] - 1;
            this.selected.d = +match[3];
        }
        var tMatch = v.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (tMatch) {
            this.selected.H = +tMatch[1];
            this.selected.M = +tMatch[2];
            this.selected.S = tMatch[3] ? +tMatch[3] : 0;
        }
        if (this.selected.y) {
            this.viewYear = this.selected.y;
            this.viewMonth = this.selected.m;
        }
    };

    DatePicker.prototype.initTemp = function () {
        var s = this.selected;
        this.temp = {
            y: s.y,
            m: s.m,
            d: s.d,
            H: s.H,
            M: s.M,
            S: s.S
        };
    };

    DatePicker.prototype.syncInput = function () {
        var s = this.selected;
        var pad = function (n) { return n < 10 ? '0' + n : '' + n; };

        switch (this.mode) {
            case 'time':
                this.input.value = pad(s.H) + ':' + pad(s.M) + ':' + pad(s.S);
                break;
            case 'year-month':
                if (s.y === null) { this.input.value = ''; return; }
                this.input.value = s.y + '-' + pad(s.m + 1);
                break;
            case 'datetime':
                if (s.y === null) { this.input.value = ''; return; }
                this.input.value = s.y + '-' + pad(s.m + 1) + '-' + pad(s.d) + ' ' + pad(s.H) + ':' + pad(s.M) + ':' + pad(s.S);
                break;
            default: // date
                if (s.y === null) { this.input.value = ''; return; }
                this.input.value = s.y + '-' + pad(s.m + 1) + '-' + pad(s.d);
        }
    };

    // ====== 渲染 ======

    DatePicker.prototype.render = function () {
        if (this.mode === 'time') {
            this.renderTime();
            this.toggleTime(true);
            return;
        }
        var title = this.panel.querySelector('.bny-datepicker-title');
        if (this.viewType === 'months') {
            title.textContent = this.viewYear + '年';
            this.renderMonths();
            this.toggleTime(false);
            return;
        }
        if (this.viewType === 'years') {
            var start = Math.floor(this.viewYear / 10) * 10;
            title.textContent = start + '-' + (start + 9);
            this.renderYears(start);
            this.toggleTime(false);
            return;
        }
        title.textContent = this.viewYear + '年 ' + MONTHS[this.viewMonth];
        this.renderCalendar();
        this.toggleTime(this.needsTime());
        this.renderTime();
    };

    DatePicker.prototype.renderCalendar = function () {
        var body = this.panel.querySelector('.bny-datepicker-body');
        var h = '<table class="bny-datepicker-calendar"><thead><tr>';
        for (var i = 0; i < 7; i++) h += '<th>' + WEEKS[i] + '</th>';
        h += '</tr></thead><tbody>';

        var firstDay = new Date(this.viewYear, this.viewMonth, 1).getDay();
        var daysInMonth = new Date(this.viewYear, this.viewMonth + 1, 0).getDate();
        var prevDays = new Date(this.viewYear, this.viewMonth, 0).getDate();
        var today = new Date();
        var tY = today.getFullYear(), tM = today.getMonth(), tD = today.getDate();

        var day = 1;
        for (var r = 0; r < 6; r++) {
            h += '<tr>';
            for (var c = 0; c < 7; c++) {
                var num, cls = 'day-cell';
                if (r === 0 && c < firstDay) {
                    num = prevDays - firstDay + c + 1;
                    cls += ' other-month';
                } else if (day > daysInMonth) {
                    num = day - daysInMonth;
                    day++;
                    cls += ' other-month';
                } else {
                    num = day++;
                    if (this.temp.y === this.viewYear && this.temp.m === this.viewMonth && this.temp.d === num) cls += ' selected';
                    if (tY === this.viewYear && tM === this.viewMonth && tD === num) cls += ' today';
                    if (this.isDisabled(this.viewYear, this.viewMonth, num)) cls += ' disabled';
                }
                h += '<td><span class="' + cls + '" dt-day="' + num + '">' + num + '</span></td>';
            }
            h += '</tr>';
            if (day > daysInMonth) break;
        }

        h += '</tbody></table>';
        body.innerHTML = h;
    };

    DatePicker.prototype.renderMonths = function () {
        var body = this.panel.querySelector('.bny-datepicker-body');
        var h = '<div class="bny-datepicker-months">';
        for (var i = 0; i < 12; i++) {
            var cls = 'month-cell';
            if (this.temp.m === i && this.temp.y === this.viewYear) cls += ' selected';
            h += '<span class="' + cls + '" dt-month="' + i + '">' + MONTHS[i] + '</span>';
        }
        h += '</div>';
        body.innerHTML = h;
    };

    DatePicker.prototype.renderYears = function (start) {
        var body = this.panel.querySelector('.bny-datepicker-body');
        var h = '<div class="bny-datepicker-years">';
        for (var i = start - 1; i <= start + 10; i++) {
            var cls = 'year-cell';
            if (i === this.temp.y) cls += ' selected';
            h += '<span class="' + cls + '" dt-year="' + i + '">' + i + '</span>';
        }
        h += '</div>';
        body.innerHTML = h;
    };

    DatePicker.prototype.renderTime = function () {
        var self = this;
        var panel = this.panel;
        var fields = ['H', 'M', 'S'];
        fields.forEach(function (f) {
            var el = panel.querySelector('.time-val[dt-field="' + f + '"]');
            if (el) el.textContent = (self.temp[f] < 10 ? '0' : '') + self.temp[f];
        });
    };

    DatePicker.prototype.toggleTime = function (show) {
        var el = this.panel.querySelector('.bny-datepicker-time');
        if (el) el.style.display = show ? '' : 'none';
    };

    // ====== 事件处理 ======

    DatePicker.prototype.handleDayClick = function (el) {
        if (el.classList.contains('disabled')) return;
        var day = +el.getAttribute('dt-day');
        if (el.classList.contains('other-month')) {
            if (day > 15) this.viewMonth--; else this.viewMonth++;
            if (this.viewMonth < 0) { this.viewMonth = 11; this.viewYear--; }
            if (this.viewMonth > 11) { this.viewMonth = 0; this.viewYear++; }
        }
        this.temp.y = this.viewYear;
        this.temp.m = this.viewMonth;
        this.temp.d = day;
        if (this.needsMonthOnly()) {
            // year-month mode: select month too
        }
        // 所有模式统一只高亮选中，不自动确认，由"确定/取消"按钮决定
        this.render();
    };

    DatePicker.prototype.handleMonthClick = function (el) {
        this.temp.m = +el.getAttribute('dt-month');
        if (this.needsMonthOnly()) {
            this.temp.y = this.viewYear;
            // 不再自动确认，由"确定/取消"按钮决定
            this.render();
        } else {
            this.viewMonth = this.temp.m;
            this.viewType = 'calendar';
            this.render();
        }
    };

    DatePicker.prototype.handleYearClick = function (el) {
        this.viewYear = +el.getAttribute('dt-year');
        this.viewType = 'months';
        this.render();
    };

    DatePicker.prototype.handleTimeBtn = function (el) {
        var field = el.getAttribute('dt-field');
        var max = field === 'H' ? 23 : 59;
        var delta = el.classList.contains('up') ? 1 : -1;
        this.temp[field] = (this.temp[field] + delta + max + 1) % (max + 1);
        this.renderTime();
    };

    DatePicker.prototype.prevMonth = function () {
        this.viewMonth--;
        if (this.viewMonth < 0) { this.viewMonth = 11; this.viewYear--; }
        this.render();
    };

    DatePicker.prototype.nextMonth = function () {
        this.viewMonth++;
        if (this.viewMonth > 11) { this.viewMonth = 0; this.viewYear++; }
        this.render();
    };

    DatePicker.prototype.toggleView = function () {
        if (this.viewType === 'calendar') this.viewType = 'months';
        else if (this.viewType === 'months') this.viewType = 'years';
        else this.viewType = 'months';
        this.render();
    };

    DatePicker.prototype.selectToday = function () {
        var t = new Date();
        if (this.needsDate()) {
            this.temp.y = t.getFullYear();
            this.temp.m = t.getMonth();
            this.temp.d = t.getDate();
            this.viewYear = this.temp.y;
            this.viewMonth = this.temp.m;
        }
        if (this.needsTime()) {
            this.temp.H = t.getHours();
            this.temp.M = t.getMinutes();
            this.temp.S = t.getSeconds();
        }
        this.confirm();
    };

    DatePicker.prototype.isDisabled = function (y, m, d) {
        // 使用预解析时间戳比较，避免重复 new Date(this.min)
        if (this._minStamp !== null) {
            var cur = new Date(y, m, d).getTime();
            if (cur < this._minStamp) return true;
        }
        if (this._maxStamp !== null) {
            var cur2 = new Date(y, m, d).getTime();
            if (cur2 > this._maxStamp) return true;
        }
        return false;
    };

    DatePicker.prototype.position = function () {
        var rect = this.input.getBoundingClientRect();
        var pw = this.panel.offsetWidth;
        var ph = this.panel.offsetHeight;
        var top = rect.bottom + 4;
        var left = rect.left;
        if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
        if (top + ph > window.innerHeight - 8) top = rect.top - ph - 4;
        if (left < 4) left = 4;
        this.panel.style.top = top + 'px';
        this.panel.style.left = left + 'px';
    };

    // ====== Range 模式 ======

    function DateRangePicker(input1, input2, options) {
        this.mode = 'range';
        options = options || {};
        // subMode 仅在 mode='range' 时回退到 'date'，其他模式（如 datetime）保持原值
        var subMode = options.subMode === 'range' ? 'date' : (options.subMode || 'date');
        this.picker1 = new DatePicker(input1, { mode: subMode, min: options.min, max: options.max });
        this.picker2 = new DatePicker(input2, { mode: subMode, min: options.min, max: options.max });

        // 联动：确保 start <= end
        var self = this;
        var origConfirm1 = this.picker1.confirm;
        this.picker1.confirm = function () {
            origConfirm1.call(self.picker1);
            if (self.picker1.selected.y && self.picker2.selected.y) {
                var d1 = new Date(self.picker1.selected.y, self.picker1.selected.m, self.picker1.selected.d);
                var d2 = new Date(self.picker2.selected.y, self.picker2.selected.m, self.picker2.selected.d);
                if (d1 > d2) {
                    self.picker2.selected.y = self.picker1.selected.y;
                    self.picker2.selected.m = self.picker1.selected.m;
                    self.picker2.selected.d = self.picker1.selected.d;
                    // datetime 等模式同步时分秒
                    if (subMode === 'datetime') {
                        self.picker2.selected.H = self.picker1.selected.H;
                        self.picker2.selected.M = self.picker1.selected.M;
                        self.picker2.selected.S = self.picker1.selected.S;
                    }
                    self.picker2.syncInput();
                }
            }
        };
        var origConfirm2 = this.picker2.confirm;
        this.picker2.confirm = function () {
            origConfirm2.call(self.picker2);
            if (self.picker1.selected.y && self.picker2.selected.y) {
                var d1 = new Date(self.picker1.selected.y, self.picker1.selected.m, self.picker1.selected.d);
                var d2 = new Date(self.picker2.selected.y, self.picker2.selected.m, self.picker2.selected.d);
                if (d2 < d1) {
                    self.picker1.selected.y = self.picker2.selected.y;
                    self.picker1.selected.m = self.picker2.selected.m;
                    self.picker1.selected.d = self.picker2.selected.d;
                    if (subMode === 'datetime') {
                        self.picker1.selected.H = self.picker2.selected.H;
                        self.picker1.selected.M = self.picker2.selected.M;
                        self.picker1.selected.S = self.picker2.selected.S;
                    }
                    self.picker1.syncInput();
                }
            }
        };
    }

    /**
     * 销毁 DateRangePicker：同时销毁两个子 DatePicker
     */
    DateRangePicker.prototype.destroy = function () {
        if (this.picker1) this.picker1.destroy();
        if (this.picker2) this.picker2.destroy();
    };

    // ====== 初始化 ======

    function scan(root) {
        if (!root.querySelectorAll) return;
        root.querySelectorAll('input[dt-picker]').forEach(function (input) {
            if (input._bnyDatePicker) return;
            input._bnyDatePicker = true;
            var mode = input.getAttribute('dt-picker');
            var rangeTarget = input.getAttribute('dt-picker-range');

            if (rangeTarget) {
                var other = document.querySelector(rangeTarget);
                if (other && !other._bnyDatePicker) {
                    other._bnyDatePicker = true;
                    new DateRangePicker(input, other, { subMode: mode === 'range' ? 'date' : mode });
                }
            } else {
                new DatePicker(input, { mode: mode });
            }
        });
    }

    /**
     * 清理已断开连接的实例（htmx 节点销毁时调用）
     * 遍历 instances，对 input 已移除的实例执行 destroy
     */
    function cleanupDisconnected() {
        for (var i = instances.length - 1; i >= 0; i--) {
            if (!instances[i].input.isConnected) {
                instances[i]._rawDestroy();
                instances.splice(i, 1);
            }
        }
    }

    // 页面初始加载
    if (typeof htmx !== 'undefined') {
        htmx.onLoad(function (content) {
            scan(content);
            // htmx 内容交换后清理已断开连接的实例
            cleanupDisconnected();
        });
    } else {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { scan(document.body); });
        else scan(document.body);
    }
})();
