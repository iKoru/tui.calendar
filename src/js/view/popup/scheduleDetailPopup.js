/**
 * @fileoverview Floating layer for  showing detail schedule
 * @author NHN FE Development Lab <dl_javascript@nhn.com>
 */
'use strict';

var View = require('../../view/view');
var FloatingLayer = require('../../common/floatingLayer');
var util = require('tui-code-snippet');
var config = require('../../config'),
    domevent = require('../../common/domevent'),
    domutil = require('../../common/domutil');
var tmpl = require('../template/popup/scheduleDetailPopup.hbs');
var CalendarViewModel = require('../../model/viewModel/calendarViewModel');// NMNS CUSTOMIZING
var ARROW_WIDTH_HALF = 8;

/**
 * @constructor
 * @extends {View}
 * @param {HTMLElement} container - container element
 */
function ScheduleDetailPopup(container) {
    View.call(this, container);
    /**
     * @type {FloatingLayer}
     */
    this.layer = new FloatingLayer(null, container);

    /**
     * cached view model
     * @type {object}
     */
    this._viewModel = null;
    this._schedule = null;
    this._calendar = null;

    domevent.on(container, 'click', this._onClick, this);
}

util.inherit(ScheduleDetailPopup, View);

/**
 * Mousedown event handler for hiding popup layer when user mousedown outside of
 * layer
 * @param {MouseEvent} mouseDownEvent - mouse event object
 */
ScheduleDetailPopup.prototype._onMouseDown = function (mouseDownEvent) {
    var target = (mouseDownEvent.target || mouseDownEvent.srcElement),
        popupLayer = domutil.closest(target, config.classname('.floating-layer'));

    if (popupLayer) {
        return;
    }
    // NMNS CUSTOMIZING START
    domutil.find(config.classname('.screen')).style.visibility = 'hidden';// hide screen
    // NMNS CUSTOMIZING END
    this.hide();
};

/**
 * @override
 */
ScheduleDetailPopup.prototype.destroy = function () {
    this.layer.destroy();
    this.layer = null;
    domevent.off(this.container, 'click', this._onClick, this);
    domevent.off(document.body, 'mousedown', this._onMouseDown, this);
    View.prototype.destroy.call(this);
};

/**
 * @override
 * Click event handler for close button
 * @param {MouseEvent} clickEvent - mouse event object
 */
ScheduleDetailPopup.prototype._onClick = function (clickEvent) {
    var target = (clickEvent.target || clickEvent.srcElement);

    if (!this._closePopup(target) && !this._onClickEditSchedule(target) && !this._onClickDeleteSchedule(target)) {
        this._showDetail(target);
    }
};

/**
 * Test click event target is close button, and return layer is closed(hidden)
 * @param {HTMLElement} target click event target
 * @returns {boolean} whether popup layer is closed or not
 */
ScheduleDetailPopup.prototype._closePopup = function(target) {
    var className = config.classname('popup-close');

    if (domutil.hasClass(target, className) || domutil.closest(target, '.' + className)) {
        domutil.find(config.classname('.screen')).style.visibility = 'hidden';// hide screen
        this.hide();

        return true;
    }

    return false;
};

/**
 * Test click event target is detail text, and change the calendar view to target date
 * @param {HTMLElement} target click event target
 * @returns {boolean} whether popup layer is closed or not
 */
ScheduleDetailPopup.prototype._showDetail = function(target) {
    if (domutil.hasClass(target, 'monthlyDetailPopupTitle') || domutil.closest(target, '.monthlyDetailPopupTitle') || domutil.hasClass(target, 'monthlyDetailPopupTime') || domutil.closest(target, '.monthlyDetailPopupTime')) {
        domutil.find(config.classname('.screen')).style.visibility = 'hidden';// hide screen
        this.hide();
        this.fire('beforeChangeView', {
            date: this._schedule.getStarts(),
            viewName: 'day'
        });

        return true;
    }

    return false;
};

/**
 * @fires ScheduleDetailPopup#clickEditSchedule
 * @param {HTMLElement} target - event target
 * @returns {boolean} whether popup layer is treated or not
 */
ScheduleDetailPopup.prototype._onClickEditSchedule = function (target) {
    var className = config.classname('popup-edit');

    if (domutil.hasClass(target, className) || domutil.closest(target, '.' + className)) {
        // NMNS CUSTOMIZING START
        this.fire('beforeUpdateSchedule', {
            schedule: this._schedule,
            triggerEventName: 'click',
            target: this._scheduleEl
        });
        domutil.find(config.classname('.screen')).style.visibility = 'hidden';// hide screen
        // NMNS CUSTOMIZING END
        this.hide();

        return true;
    }

    return false;
};

/**
 * @fires ScheduleDetailPopup#clickEditSchedule
 * @param {HTMLElement} target - event target
 * @returns {boolean} whether popup layer is treated or not
 */
ScheduleDetailPopup.prototype._onClickDeleteSchedule = function (target) {
    var className = config.classname('popup-delete');

    if ((domutil.hasClass(target, className) || domutil.closest(target, '.' + className)) && confirm('정말 이 ' + (this._schedule.category === 'task' ? '일정' : '예약') + '을 삭제하시겠어요?')) {
        this.fire('beforeDeleteSchedule', {
            schedule: this._schedule
        });
        // NMNS CUSTOMIZING START
        domutil.find(config.classname('.screen')).style.visibility = 'hidden';// hide screen
        // NMNS CUSTOMIZING END
        this.hide();

        return true;
    }

    return false;
};

/**
 * @override
 * @param {object} viewModel - view model from factory/monthView
 */
ScheduleDetailPopup.prototype.render = function (viewModel) {
    var layer = this.layer;
    var self = this;
    var contents;

    if (viewModel.schedule instanceof CalendarViewModel) {
        layer.setContent(tmpl({
            schedule: viewModel.schedule.getSchedules(),
            date: viewModel.schedule.getStarts().toDate(),
            calendar: viewModel.calendar,
            isWeek: false
        }));
        layer.show();
    } else {
        try {
            contents = JSON.parse(viewModel.schedule.raw ?
                viewModel.schedule.raw.contents : viewModel.schedule.contents)
                .map(function(item) {
                    return item.value;
                }).join(', ');
        } catch (error) {
            contents = viewModel.schedule.raw.contents;
        }
        layer.setContent(tmpl({
            schedule: viewModel.schedule,
            calendar: viewModel.calendar,
            contents: contents,
            isWeek: true
        }));
        layer.show();
        // NMNS CUSTOMIZING START
        if (viewModel.schedule.raw.contact && $('#detailPopupResendAlrim').length) {
            if (viewModel.schedule.end.getTime() > new Date().getTime()) {
                $('#detailPopupResendAlrim').off('click').on('click', function () {
                    NMNS.emit('resend alrimtalk', {
                        id: viewModel.schedule.id
                    });
                    $(this).addClass('disabled', true);
                });
            } else {
                $('#detailPopupResendAlrim').addClass('d-none');// hide button
            }
        }
        // NMNS CUSTOMIZING END
    }
    this._setPopupPositionAndArrowDirection(viewModel.event);

    this._schedule = viewModel.schedule;
    this._calendar = viewModel.calendar;

    util.debounce(function () {
        domevent.on(document.body, 'mousedown', self._onMouseDown, self);
    })();
};

/**
 * Set popup position and arrow direction to apear near guide element
 * @param {Event} event - creation guide element
 */
ScheduleDetailPopup.prototype._setPopupPositionAndArrowDirection = function (event) {
    var layer = domutil.find(config.classname('.popup'), this.layer.container);
    var layerSize = {
        width: layer.offsetWidth,
        height: layer.offsetHeight
    };
    var windowSize = {
        right: window.innerWidth,
        bottom: window.innerHeight
    };
    var parentRect = this.layer.parent.getBoundingClientRect();
    var parentBounds = {
        left: parentRect.left,
        top: parentRect.top
    };
    var scheduleEl = event.target || event.srcElement;
    // NMNS CUSTOMIZING START
    var pos, scheduleBound;
    if (!$(scheduleEl).hasClass('tui-full-calendar-weekday-schedule')) {
        scheduleBound = $(scheduleEl).parents('.tui-full-calendar-weekday-schedule');
        if (scheduleBound.length < 1) {
            if (!$(scheduleEl).hasClass('tui-full-calendar-time-schedule')) {
                scheduleBound = $(scheduleEl).parents('.tui-full-calendar-time-schedule');
            }
        }
        if (scheduleBound.length) {
            scheduleEl = scheduleBound[0];
        }
    }

    scheduleBound = scheduleEl.getBoundingClientRect();
    // NMNS CUSTOMIZING END
    /* var blockEl = domutil.closest(scheduleEl, config.classname('.time-date-schedule-block'))
        || domutil.closest(scheduleEl, config.classname('.weekday-schedule'))
        || scheduleEl;
    scheduleBound = blockEl.getBoundingClientRect(); */

    this._scheduleEl = scheduleEl;// blockEl;

    pos = this._calcRenderingData(layerSize, windowSize, scheduleBound);
    pos.x -= parentBounds.left + 4;
    pos.y -= (parentBounds.top + ARROW_WIDTH_HALF);
    this.layer.setPosition(pos.x, pos.y);
    this._setArrowDirection(pos.arrow);
};

/**
 * Calculate rendering position usering guide elements
 * @param {{width: {number}, height: {number}}} layerSize - popup layer's width and height
 * @param {{top: {number}, left: {number}, right: {number}, bottom: {number}}} parentSize - width and height of the upper layer, that acts as a border of popup
 * @param {{top: {number}, left: {number}, right: {number}, bottom: {number}}} guideBound - guide element bound data
 * @returns {PopupRenderingData} rendering position of popup and popup arrow
 */
ScheduleDetailPopup.prototype._calcRenderingData = function (layerSize, parentSize, guideBound) {
    var guideVerticalCenter = (guideBound.top + guideBound.bottom) / 2;
    var x = guideBound.right;
    var y = guideVerticalCenter;
    var arrowDirection = 'arrow-left';
    var arrowTop;

    if (y < 0) {
        y = y + (layerSize.height / 2) - guideVerticalCenter;
    }

    if (x > 0 && (x + layerSize.width > parentSize.right)) {
        x = guideBound.left - layerSize.width - ARROW_WIDTH_HALF - 3;
        arrowDirection = 'arrow-right';
    }

    if (x < 0) {
        x = 0;
    }

    if (guideBound.right > x + layerSize.width) {
        arrowDirection = 'arrow-right';
    }

    /**
     * @typedef {Object} PopupRenderingData
     * @property {number} x - left position
     * @property {number} y - top position
     * @property {string} arrow.direction - direction of popup arrow
     * @property {number} [arrow.position] - relative position of popup arrow, if it is not set, arrow appears on the middle of popup
     */
    return {
        x: x + ARROW_WIDTH_HALF,
        y: y - (layerSize.height / 2) + ARROW_WIDTH_HALF,
        arrow: {
            direction: arrowDirection,
            position: arrowTop
        }
    };
};

/**
 * Set arrow's direction and position
 * @param {Object} arrow rendering data for popup arrow
 */
ScheduleDetailPopup.prototype._setArrowDirection = function (arrow) {
    var direction = arrow.direction || 'arrow-left';
    var arrowEl = domutil.find(config.classname('.popup-arrow'), this.layer.container);
    var borderElement = domutil.find(config.classname('.popup-arrow-border', arrowEl));

    if (direction !== config.classname('arrow-left')) {
        domutil.removeClass(arrowEl, config.classname('arrow-left'));
        domutil.addClass(arrowEl, config.classname(direction));
    }

    if (arrow.position) {
        borderElement.style.top = arrow.position + 'px';
    }
};

/**
 * Hide layer
 */
ScheduleDetailPopup.prototype.hide = function () {
    this.layer.hide();

    if (this.guide) {
        this.guide.clearGuideElement();
        this.guide = null;
    }

    domevent.off(document.body, 'mousedown', this._onMouseDown, this);
};

/**
 * refresh layer
 */
ScheduleDetailPopup.prototype.refresh = function () {
    var viewModel = this._viewModel;
    if (viewModel) {
        this.layer.setContent(this.tmpl(viewModel));
        // NMNS CUSTOMIZING START
        if (viewModel.schedule.raw.contact && $('#detailPopupResendAlrim').length) {
            if (viewModel.schedule.end.getTime() > new Date().getTime()) {
                $('#detailPopupResendAlrim').off('click').on('click', function () {
                    NMNS.emit('resend alrimtalk', {
                        id: viewModel.schedule.id
                    });
                    $(this).addClass('disabled', true);
                });
            } else {
                $('#detailPopupResendAlrim').addClass('d-none');// hide button
            }
        }
        // NMNS CUSTOMIZING END
    }
};

module.exports = ScheduleDetailPopup;
