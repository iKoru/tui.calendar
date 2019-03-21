/**
 * NMNS CUSTOMIZING
 * @fileoverview Model for Month views
 * @author iKoru <glassonyou@gmail.com>
 */
'use strict';

var util = require('tui-code-snippet');
var datetime = require('../../common/datetime');

/**
 * Schedule ViewModel
 * @constructor
 * @param {string} calendarId calendarId.
 * @param {TZDate} date date of calendar
 * @param {number} count number of schedules of the given calendar id on the date
 */
function CalendarViewModel(calendarId, date, count) {
    /**
     * The model of schedule.
     * @type {object}
     */
    this.model = {
        calendarId: calendarId,
        date: date,
        count: count
    };

    /**
     * @type {number}
     */
    this.top = 0;

    /**
     * @type {number}
     */
    this.left = 0;

    /**
     * @type {number}
     */
    this.width = 0;

    /**
     * @type {number}
     */
    this.height = 0;

    /**
     * Represent schedule has collide with other schedules when rendering.
     * @type {boolean}
     */
    this.hasCollide = false;

    /**
     * Extra space at rigth side of this schedule.
     * @type {number}
     */
    this.extraSpace = 0;

    /**
     * represent this schedule block is not visible after rendered.
     *
     * in month view, some viewmodel in date need to hide when already rendered before dates.
     *
     * set true then it just shows empty space.
     * @type {boolean}
     */
    this.hidden = false;

    /**
     * whether the schedule includes multiple dates
     */
    this.hasMultiDates = false;

    /**
     * represent render start date used at rendering.
     *
     * if set null then use model's 'start' property.
     * @type {TZDate}
     */
    this.renderStarts = null;

    /**
     * whether the actual start-date is before the render-start-date
     * @type {boolean}
     */
    this.exceedLeft = false;

    /**
     * represent render end date used at rendering.
     *
     * if set null then use model's 'end' property.
     * @type {TZDate}
     */
    this.renderEnds = null;

    /**
     * whether the actual end-date is after the render-end-date
     * @type {boolean}
     */
    this.exceedRight = false;
}

/**********
 * static props
 **********/

/**
 * CalendarViewModel factory method.
 * @param {string} calendarId calendarId.
 * @param {TZDate} date date of calendar
 * @param {number} count number of schedules of the given calendar id on the date
 * @returns {CalendarViewModel} CalendarViewModel instance.
 */
CalendarViewModel.create = function(calendarId, date, count) {
    return new CalendarViewModel(calendarId, date, count);
};

/**********
 * prototype props
 **********/

/**
 * return date property to render properly when specific schedule that exceed rendering date range.
 *
 * @returns {Date} render date.
 */
CalendarViewModel.prototype.getDate = function() {
    return this.model.date;
};

/**
 * return date property to render properly when specific schedule that exceed rendering date range.
 *
 * @returns {Date} render start date.
 */
CalendarViewModel.prototype.getStarts = function() {
    return this.model.date;
};

/**
 * return date property to render properly when specific schedule that exceed rendering date range.
 *
 * @returns {Date} render end date.
 */
CalendarViewModel.prototype.getEnds = function() {
    return this.model.date;
};

/**
 * return count property to render
 *
 * @returns {number} count property.
 */
CalendarViewModel.prototype.getCount = function() {
    return this.model.count;
};

/**
 * @returns {number} unique number for model.
 */
CalendarViewModel.prototype.cid = function() {
    return util.stamp(this.model);
};

/**
 * Shadowing valueOf method for schedule sorting.
 * @returns {Schedule} The model of schedule.
 */
CalendarViewModel.prototype.valueOf = function() {
    return this.model;
};

/**
 * Link collidesWith method
 * @param {CalendarViewModel} viewModel - viewmodel instance of Calendar.
 * @returns {boolean} Calendar#collidesWith result.
 */
CalendarViewModel.prototype.collidesWith = function(viewModel) {
    return datetime.isSameDate(this.model.date, viewModel.getDate());
};

module.exports = CalendarViewModel;

