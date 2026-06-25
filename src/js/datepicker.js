(function () {
    'use strict';

    var WEEKS = ['日', '一', '二', '三', '四', '五', '六'];
    var MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    var currentPanel = null;
    var currentInstance = null;

    // ====== DatePicker 类 ======

    function DatePicker(input, options) {
        this.input = input;
        this.mode = options.mode || 'date';  // date|datetime|time|month|range|year-month
        this.format = options.format || null;
        this.rangeInput = options.rangeInput || null;  // 区间模式第二个 input
        this.min = options.min || null;
        this.max = options.max || null;

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

    DatePicker.prototype.initPanel = function () {
        var self = this;
        if (this.panel) return;

        this.wrap = document.createElement('span');
        this.wrap.className = 'bny-datepicker-wrap';
        this.input.parentNode.insertBefore(this.wrap, this.input);
        this.wrap.appendChild(this.input);

        this.panel = document.createElement('div');
        this.panel.className = 'bny-datepicker-panel';
        this.panel.innerHTML = this.buildHTML();
        this.wrap.appendChild(this.panel);

        // 绑定面板内事件
        this.panel.addEventListener('click', function (e) {
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
        });
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
            h += '<div class="time-col"><button class="time-btn up" data-field="H">&#9650;</button><span class="time-val" data-field="H">00</span><button class="time-btn down" data-field="H">&#9660;</button></div>';
            h += '<span class="time-sep">:</span>';
            h += '<div class="time-col"><button class="time-btn up" data-field="M">&#9650;</button><span class="time-val" data-field="M">00</span><button class="time-btn down" data-field="M">&#9660;</button></div>';
            h += '<span class="time-sep">:</span>';
            h += '<div class="time-col"><button class="time-btn up" data-field="S">&#9650;</button><span class="time-val" data-field="S">00</span><button class="time-btn down" data-field="S">&#9660;</button></div>';
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
        this.input.addEventListener('click', function () { self.open(); });
        this.input.addEventListener('focus', function () { self.open(); });
        document.addEventListener('click', function (e) {
            if (!self.panel.classList.contains('show')) return;
            if (!self.panel.contains(e.target) && e.target !== self.input && (!self.rangeInput || e.target !== self.rangeInput)) {
                self.close();
            }
        });
        window.addEventListener('resize', function () { if (self.panel.classList.contains('show')) self.position(); });
        window.addEventListener('scroll', function () { if (self.panel.classList.contains('show')) self.position(); }, true);
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

        this.parseFromInput();
        this.initTemp();
        if (this.needsMonthOnly()) this.viewType = 'months';
        else if (this.needsDate()) this.viewType = 'calendar';
        this.panel.className = 'bny-datepicker-panel' + (this.mode === 'time' ? ' mode-time' : '');
        this.render();
        // 先定位再显示（过渡动画需要元素已有尺寸）
        this.position();
        this.panel.classList.add('show');
    };

    DatePicker.prototype.close = function () {
        this.panel.classList.remove('show');
        currentPanel = null;
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
                h += '<td><span class="' + cls + '" data-day="' + num + '">' + num + '</span></td>';
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
            h += '<span class="' + cls + '" data-month="' + i + '">' + MONTHS[i] + '</span>';
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
            h += '<span class="' + cls + '" data-year="' + i + '">' + i + '</span>';
        }
        h += '</div>';
        body.innerHTML = h;
    };

    DatePicker.prototype.renderTime = function () {
        var self = this;
        var panel = this.panel;
        var fields = ['H', 'M', 'S'];
        fields.forEach(function (f) {
            var el = panel.querySelector('.time-val[data-field="' + f + '"]');
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
        var day = +el.getAttribute('data-day');
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
        this.temp.m = +el.getAttribute('data-month');
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
        this.viewYear = +el.getAttribute('data-year');
        this.viewType = 'months';
        this.render();
    };

    DatePicker.prototype.handleTimeBtn = function (el) {
        var field = el.getAttribute('data-field');
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
        if (this.min) {
            var min = new Date(this.min);
            if (new Date(y, m, d) < new Date(min.getFullYear(), min.getMonth(), min.getDate())) return true;
        }
        if (this.max) {
            var max = new Date(this.max);
            if (new Date(y, m, d) > new Date(max.getFullYear(), max.getMonth(), max.getDate())) return true;
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
        this.picker1 = new DatePicker(input1, { mode: options.subMode || 'date', min: options.min, max: options.max });
        this.picker2 = new DatePicker(input2, { mode: options.subMode || 'date', min: options.min, max: options.max });

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
                    self.picker1.syncInput();
                }
            }
        };
    }

    // ====== 初始化 ======

    function scan(root) {
        if (!root.querySelectorAll) return;
        root.querySelectorAll('input[data-picker]').forEach(function (input) {
            if (input._bnyDatePicker) return;
            input._bnyDatePicker = true;
            var mode = input.getAttribute('data-picker');
            var rangeTarget = input.getAttribute('data-picker-range');

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

    // 页面初始加载
    if (typeof htmx !== 'undefined') {
        htmx.onLoad(function (content) { scan(content); });
    } else {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { scan(document.body); });
        else scan(document.body);
    }
})();
