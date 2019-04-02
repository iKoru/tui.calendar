/**
 * @fileoverview Controller mixin for Month View
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';

var util = require('tui-code-snippet');
var array = require('../../common/array'),
    datetime = require('../../common/datetime'),
    Collection = require('../../common/collection');
var mmax = Math.max;

var Month = {
    /**
     * Filter function for find time schedule
     * @param {ScheduleViewModel} viewModel - schedule view model
     * @returns {boolean} whether model is time schedule?
     */
    _onlyTimeFilter: function(viewModel) {
        return !viewModel.model.isAllDay && !viewModel.hasMultiDates;
    },

    /**
     * Filter function for find allday schedule
     * @param {ScheduleViewModel} viewModel - schedule view model
     * @returns {boolean} whether model is allday schedule?
     */
    _onlyAlldayFilter: function(viewModel) {
        return viewModel.model.isAllDay || viewModel.hasMultiDates;
    },

    /**
     * Weight top value +1 for month view render
     * @param {ScheduleViewModel} viewModel - schedule view model
     */
    _weightTopValue: function(viewModel) {
        viewModel.top = viewModel.top || 0;
        viewModel.top += 1;
    },

    /**
     * Get max top index value for allday schedules in specific date (YMD)
     * @this Base
     * @param {string} ymd - yyyymmdd formatted value
     * @param {Collection} vAlldayColl - collection of allday schedules
     * @returns {number} max top index value in date
     */
    _getAlldayMaxTopIndexAtYMD: function(ymd, vAlldayColl) {
        var dateMatrix = this.dateMatrix,
            topIndexesInDate = [];
        util.forEach(dateMatrix[ymd], function(cid) {
            vAlldayColl.doWhenHas(cid, function(viewModel) {
                topIndexesInDate.push(viewModel.top);
            });
        });

        if (topIndexesInDate.length > 0) {
            return mmax.apply(null, topIndexesInDate);
        }

        return 0;
    },

    /**
     * Adjust time view model's top index value
     * @this Base
     * @param {Collection} vColl - collection of schedules
     */
    _adjustTimeTopIndex: function(vColl) {
        var ctrlMonth = this.Month;
        var getAlldayMaxTopIndexAtYMD = ctrlMonth._getAlldayMaxTopIndexAtYMD;
        var vAlldayColl = vColl.find(ctrlMonth._onlyAlldayFilter);
        var sortedTimeSchedules = vColl.find(ctrlMonth._onlyTimeFilter).sort(array.compare.calendar.asc);
        var maxIndexInYMD = {};

        sortedTimeSchedules.forEach(function(timeViewModel) {
            var scheduleYMD = datetime.format(timeViewModel.getStarts(), 'YYYYMMDD');
            var alldayMaxTopInYMD = maxIndexInYMD[scheduleYMD];

            if (util.isUndefined(alldayMaxTopInYMD)) {
                alldayMaxTopInYMD = maxIndexInYMD[scheduleYMD] =
                    getAlldayMaxTopIndexAtYMD(scheduleYMD, vAlldayColl);
            }
            maxIndexInYMD[scheduleYMD] = timeViewModel.top =
                (alldayMaxTopInYMD + 1);
        });
    },

    /**
     * Adjust time view model's top index value
     * @this Base
     * @param {Collection} vColl - collection of schedules
     */
    _stackTimeFromTop: function(vColl) {
        var ctrlMonth = this.Month;
        var vAlldayColl = vColl.find(ctrlMonth._onlyAlldayFilter);
        var sortedTimeSchedules = vColl.find(ctrlMonth._onlyTimeFilter).sort(array.compare.calendar.asc);
        var indiceInYMD = {};
        var dateMatrix = this.dateMatrix;

        sortedTimeSchedules.forEach(function(timeViewModel) {
            var scheduleYMD = datetime.format(timeViewModel.getStarts(), 'YYYYMMDD');
            var topArrayInYMD = indiceInYMD[scheduleYMD];
            var maxTopInYMD;
            var i;

            if (util.isUndefined(topArrayInYMD)) {
                topArrayInYMD = indiceInYMD[scheduleYMD] = [];
                util.forEach(dateMatrix[scheduleYMD], function(cid) {
                    vAlldayColl.doWhenHas(cid, function(viewModel) {
                        topArrayInYMD.push(viewModel.top);
                    });
                });
            }

            if (util.inArray(timeViewModel.top, topArrayInYMD) >= 0) {
                maxTopInYMD = mmax.apply(null, topArrayInYMD) + 1;
                for (i = 1; i <= maxTopInYMD; i += 1) {
                    timeViewModel.top = i;
                    if (util.inArray(timeViewModel.top, topArrayInYMD) < 0) {
                        break;
                    }
                }
            }
            topArrayInYMD.push(timeViewModel.top);
        });
    },

    /**
     * Find schedule and get view model for specific month
     * @this Base
     * @param {Date} start - start date to find schedules
     * @param {Date} end - end date to find schedules
     * @param {function[]} [andFilters] - optional filters to applying search query
     * @param {boolean} [alldayFirstMode=false] if true, time schedule is lower than all-day schedule. Or stack schedules from the top.
     * @returns {object} view model data
     */
    findByDateRange: function(start, end, andFilters, alldayFirstMode) {
        var ctrlCore = this.Core,
            ctrlMonth = this.Month,
            filter = ctrlCore.getScheduleInDateRangeFilter(start, end),
            schedules = this.schedules,
            coll, vColl, vList,
            collisionGroup,
            matrices;

        alldayFirstMode = alldayFirstMode || false;
        andFilters = andFilters || [];
        filter = Collection.and.apply(null, [filter].concat(andFilters));

        // NMNS CUSTIMOZING START
        coll = schedules.find(filter);
        vColl = ctrlCore.convertToCalendarViewModel(coll, start, end, this.calendars);
        // ctrlMonth._addMultiDatesInfo(vColl);
        // ctrlMonth._adjustRenderRange(start, end, vColl);
        vList = vColl.sort(array.compare.calendar.asc);
        vColl.each(function(item) {
            schedules.add(item);
        });
        // NMNS CUSTOMIZING END

        collisionGroup = ctrlCore.getCollisionGroup(vList);
        matrices = ctrlCore.getMatrices(vColl, collisionGroup);
        ctrlCore.positionViewModels(start, end, matrices, ctrlMonth._weightTopValue);
        if (alldayFirstMode) {
            ctrlMonth._adjustTimeTopIndex(vColl);
        } else {
            ctrlMonth._stackTimeFromTop(vColl);
        }

        return matrices;
    }
};

module.exports = Month;

