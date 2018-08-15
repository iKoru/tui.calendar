/**
 * @fileoverview Floating layer for writing new schedules
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';

var View = require('../../view/view');
var FloatingLayer = require('../../common/floatingLayer');
var util = require('tui-code-snippet');
var TZDate = require('../../common/timezone').Date;
var config = require('../../config'),
    domevent = require('../../common/domevent'),
    datetime = require('../../common/datetime'),
    domutil = require('../../common/domutil');
var tmpl = require('../template/popup/scheduleCreationPopup.hbs');
var MAX_WEEK_OF_MONTH = 6;
var ARROW_WIDTH_HALF = 8;

/**
 * @constructor
 * @extends {View}
 * @param {HTMLElement} container - container element
 * @param {Array.<Calendar>} calendars - calendar list used to create new schedule
 */
function ScheduleCreationPopup(container, calendars) {
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
    this._selectedCal = null;
    this._scheduleId = '';
    this.calendars = calendars;
    this._focusedDropdown = null;
    this._onClickListeners = [
        this._selectDropdownMenuItem.bind(this),
        this._closeDropdownMenuView.bind(this, null),
        this._closePopup.bind(this),
        this._toggleDropdownMenuView.bind(this),
        this._toggleIsAllday.bind(this),
        this._toggleIsPrivate.bind(this),
        this._onClickSaveSchedule.bind(this)
    ];

    domevent.on(container, 'click', this._onClick, this);
}

util.inherit(ScheduleCreationPopup, View);

/**
 * Mousedown event handler for hiding popup layer when user mousedown outside of
 * layer
 * @param {MouseEvent} mouseDownEvent - mouse event object
 */
ScheduleCreationPopup.prototype._onMouseDown = function (mouseDownEvent) {
    var target = (mouseDownEvent.target || mouseDownEvent.srcElement),
        popupLayer = domutil.closest(target, config.classname('.floating-layer'));

    // NMNS CUSTOMIZING START
    if (popupLayer || domutil.closest(target, '.autocomplete-suggestions') || domutil.closest(target, '.tooltip') || domutil.closest(target, '.flatpickr-calendar')) {
        return;
    }
    // NMNS CUSTOMIZING END
    this.hide();
};

/**
 * @override
 */
ScheduleCreationPopup.prototype.destroy = function () {
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
ScheduleCreationPopup.prototype._onClick = function (clickEvent) {
    var target = (clickEvent.target || clickEvent.srcElement);

    util.forEach(this._onClickListeners, function (listener) {
        return !listener(target);
    });
};

/**
 * Test click event target is close button, and return layer is closed(hidden)
 * @param {HTMLElement} target click event target
 * @returns {boolean} whether popup layer is closed or not
 */
ScheduleCreationPopup.prototype._closePopup = function (target) {
    var className = config.classname('popup-close');

    if (domutil.hasClass(target, className) || domutil.closest(target, '.' + className)) {
        this.hide();
        // NMNS CUSTOMIZING START
        document.body.classList.remove('modal-open');
        domutil.find(config.classname('.screen')).style.opacity = 0;// hide screen
        domutil.find(config.classname('.screen')).style.visibility = 'hidden';// hide screen

        // NMNS CUSTOMIZING END
        return true;
    }

    return false;
};

/**
 * Toggle dropdown menu view, when user clicks dropdown button
 * @param {HTMLElement} target click event target
 * @returns {boolean} whether user clicked dropdown button or not
 */
ScheduleCreationPopup.prototype._toggleDropdownMenuView = function (target) {
    var className = config.classname('dropdown-button');
    var dropdownBtn = domutil.hasClass(target, className) ? target : domutil.closest(target, '.' + className);

    if (!dropdownBtn) {
        return false;
    }

    if (domutil.hasClass(config.classname('open'))) {
        this._closeDropdownMenuView(dropdownBtn.parentNode);
    } else {
        this._openDropdownMenuView(dropdownBtn.parentNode);
    }

    return true;
};

/**
 * Close drop down menu
 * @param {HTMLElement} dropdown - dropdown element that has a opened dropdown menu
 */
ScheduleCreationPopup.prototype._closeDropdownMenuView = function (dropdown) {
    dropdown = dropdown || this._focusedDropdown;
    if (dropdown) {
        domutil.removeClass(dropdown, config.classname('open'));
        this._focusedDropdown = null;
    }
};

/**
 * Open drop down menu
 * @param {HTMLElement} dropdown - dropdown element that has a closed dropdown menu
 */
ScheduleCreationPopup.prototype._openDropdownMenuView = function (dropdown) {
    domutil.addClass(dropdown, config.classname('open'));
    this._focusedDropdown = dropdown;
};

/**
 * If click dropdown menu item, close dropdown menu
 * @param {HTMLElement} target click event target
 * @returns {boolean} whether
 */
ScheduleCreationPopup.prototype._selectDropdownMenuItem = function (target) {
    // NMNS CUSTOMIZING START
    var itemClassName = config.classname('dropdown-item');
    var selectedItem = domutil.hasClass(target, itemClassName) ? target : domutil.closest(target, '.' + itemClassName);
    var selectedCalendarId;
    if (!selectedItem) {
        return false;
    }
    selectedCalendarId = domutil.getData(selectedItem, 'calendarId');
    this._selectedCal = this.calendars.find(function (cal) {
        return (cal.id === selectedCalendarId);
    });
    /* common.find(this.calendars, function(cal) {
      return cal.id === selectedCalendarId;
    });*/
    $('#creationPopupManager').html($(selectedItem).html()).data('calendarid', selectedCalendarId);

    // NMNS CUSTOMIZING END
    return true;
};

/**
 * Toggle allday checkbox state
 * @param {HTMLElement} target click event target
 * @returns {boolean} whether event target is allday section or not
 */
ScheduleCreationPopup.prototype._toggleIsAllday = function () {
    // NMNS CUSTOMIZING START
    /* var className = config.classname('section-allday');
    var alldaySection = domutil.hasClass(target, className) ? target : domutil.closest(target, '.' + className);
    var checkbox;

    if (alldaySection) {
        checkbox = domutil.find(config.classname('.checkbox-square'), alldaySection);
        checkbox.checked = !checkbox.checked;

        return true;
    }*/
    // NMNS CUSTOMIZING END
    return false;
};

/**
 * Toggle private button
 * @param {HTMLElement} target click event target
 * @returns {boolean} whether event target is private section or not
 */
ScheduleCreationPopup.prototype._toggleIsPrivate = function (target) {
    var className = config.classname('section-private');
    var privateSection = domutil.hasClass(target, className) ? target : domutil.closest(target, '.' + className);

    if (privateSection) {
        if (domutil.hasClass(privateSection, config.classname('public'))) {
            domutil.removeClass(privateSection, config.classname('public'));
        } else {
            domutil.addClass(privateSection, config.classname('public'));
        }

        return true;
    }

    return false;
};

/**
 * Save new schedule if user clicked save button
 * @emits ScheduleCreationPopup#saveSchedule
 * @param {HTMLElement} target click event target
 * @returns {boolean} whether save button is clicked or not
 */
ScheduleCreationPopup.prototype._onClickSaveSchedule = function (target) {
    // NMNS CUSTOMIZING START
    var title, isAllDay, startDate, endDate, contents, contact, etc, calendarId, manager;
    if (!$(target).is('#creationPopupSave')) {
        return false;
    }
    if (!this.validator) {
        if ($('#tui-full-calendar-schedule-start-date').attr('type') === 'hidden') { // mobile handling
            this.validator = $('#creationPopupForm').validate({
                rules: {
                    contact: {
                        required: true,
                        digits: true
                    }
                },
                messages: {
                    contact: {
                        required: '연락처를 입력해주세요.',
                        digits: '숫자만 입력해주세요.'
                    }
                },
                errorElement: 'p',
                errorClass: 'message text-danger my-1 pl-4 pl-sm-0 ml-3',
                errorPlacement: function (error, element) {
                    error.appendTo(element.parent().parent());
                },
                highlight: function (element, errorClass) {
                    $(element).removeClass(errorClass);
                }
            });
        } else {
            this.validator = $('#creationPopupForm').validate({
                rules: {
                    contact: {
                        required: true,
                        digits: true
                    },
                    start: {
                        required: true
                    },
                    end: {
                        required: true
                    }
                },
                messages: {
                    contact: {
                        required: '연락처를 입력해주세요.',
                        digits: '숫자만 입력해주세요.'
                    },
                    start: '시작시간을 입력해주세요.',
                    end: '종료시간을 입력해주세요.'
                },
                errorElement: 'p',
                errorClass: 'message text-danger my-1 pl-4 pl-sm-0 ml-3',
                errorPlacement: function (error, element) {
                    error.appendTo(element.parent().parent());
                },
                highlight: function (element, errorClass) {
                    $(element).removeClass(errorClass);
                }
            });
        }
    }
    try {
        startDate = new TZDate($('#tui-full-calendar-schedule-start-date')[0]._flatpickr.selectedDates[0]);
        endDate = new TZDate($('#tui-full-calendar-schedule-end-date')[0]._flatpickr.selectedDates[0]);
        if (!this.validator.form()) {
            this.validator.showErrors();

            return true;
        }
    } catch (e) {
        if (!startDate || !endDate) {
            alert('시간을 입력해주세요!');

            return true;
        }
        if ($('#creationPopupContact').val() === '') {
            alert('연락처를 입력해주세요!');

            return true;
        }
    }
    calendarId = $('#creationPopupManager').data('calendarid');
    manager = this.calendars.find(function (cal) {
        return cal.id === calendarId;
    });
    if (!manager && this._selectedCal) {
        manager = this._selectedCal;
    } else if (!manager && !this._selectedCal) {
        manager = {
            id: calendarId,
            color: getColorFromBackgroundColor('#b2dfdb'),
            bgColor: '#b2dfdb',
            borderColor: '#b2dfdb'
        };
    }

    if (!startDate || !endDate) {
        alert('시간을 입력해주세요!');

        return true;
    }
    if (datetime.compare(startDate, endDate) > 0) {// swap two dates
        startDate = [endDate, endDate = startDate][0];
    }

    title = $('#creationPopupName').val();
    contents = $('#creationPopupContents').val();
    contact = $('#creationPopupContact').val();
    etc = $('#creationPopupEtc').val();
    isAllDay = $('#creationPopupAllDay').is(':checked');

    if (manager) {
        calendarId = manager.id;
    }

    if (this._isEditMode) {
        this.fire('beforeUpdateSchedule', {
            schedule: {
                id: this._scheduleId,
                calendarId: calendarId,
                title: title,
                raw: {
                    contents: contents,
                    contact: contact,
                    etc: etc,
                    status: this._viewModel.status
                },
                start: startDate,
                end: endDate,
                isAllDay: isAllDay,
                category: isAllDay ? 'allday' : 'time',
                manager: calendarId,
                name: title,
                contents: contents,
                contact: contact,
                etc: etc,
                status: this._viewModel.status,
                color: manager.color,
                bgColor: manager.bgColor,
                borderColor: manager.borderColor,
                dragBgColor: manager.bgColor
            },
            history: this._viewModel,
            start: startDate,
            end: endDate,
            calendar: manager,
            triggerEventName: 'click'
        });
    } else {
        /**
         * @event ScheduleCreationPopup#beforeCreateSchedule
         * @type {object}
         * @property {Schedule} schedule - new schedule instance to be added
         */
        this.fire('beforeCreateSchedule', {
            calendarId: calendarId,
            title: title,
            name: title,
            raw: {
                'class': 'public',
                location: '',
                contents: contents,
                contact: contact,
                etc: etc,
                status: 'RESERVED'
            },
            start: startDate,
            end: endDate,
            isAllDay: isAllDay,
            state: 'Busy',
            category: isAllDay ? 'allday' : 'time',
            dueDateClass: '',
            attendees: [],
            recurrenceRule: false,
            isPending: false,
            isFocused: false,
            isVisible: true,
            isReadOnly: false,
            isPrivate: false,
            customStyle: '',
            location: '',
            bgColor: manager ? manager.bgColor : '#b2dfdb',
            borderColor: manager ? manager.borderColor : '#b2dfdb',
            color: getColorFromBackgroundColor(manager ? manager.bgColor : '#b2dfdb'),
            dragBgColor: manager ? manager.bgColor : '#b2dfdb',
            manager: calendarId,
            contents: contents,
            contact: contact,
            etc: etc,
            status: 'RESERVED'
        });
    }
    // NMNS CUSTOMIZING END
    this.hide();

    return true;
};

/**
 * @override
 * @param {object} viewModel - view model from factory/monthView
 */
ScheduleCreationPopup.prototype.render = function (viewModel) {
    // NMNS CUSTOMIZING START
    var timeout;
    var calendars = this.calendars;
    var layer = this.layer;
    var self = this;
    /**
     * event triggered when contact input has been blured
     */
    function onContactBlur() {
        clearTimeout(timeout);
        if ($('#creationPopupContact').val().length > 9) {
            NMNS.socket.emit('get customer', { contact: $('#creationPopupContact').val() });
        }
    }
    // NMNS CUSTOMIZING END

    viewModel.zIndex = this.layer.zIndex + 5;
    viewModel.calendars = calendars;
    if (calendars.length) {
        viewModel.selectedCal = this._selectedCal = calendars[0];
    }

    // NMNS CUSTOMIZING START
    this._isEditMode = viewModel.schedule && viewModel.schedule.id;
    if (this._isEditMode) {
        // boxElement = viewModel.target;
        this._viewModel = viewModel = this._makeEditModeData(viewModel);
    } else {
        this.guide = viewModel.guide;
        // guideElements = this._getGuideElements(this.guide);
        // boxElement = guideElements.length ? guideElements[0] : null;
    }
    if ($('#creationPopup').length) {// already inited
        this._updatePopup(viewModel);
        $('#creationPopupName').autocomplete().clearCache();
        $('#creationPopupContact').autocomplete().clearCache();
        $('#creationPopupContact').tooltip('dispose');
        this._createDatepicker(viewModel.start.toDate ? viewModel.start.toDate() : viewModel.start,
            viewModel.end.toDate ? viewModel.end.toDate() : viewModel.end);
    } else {// need init
        layer.setContent(tmpl(viewModel));
        document.getElementById('creationPopupForm').onsubmit = function () {
            return false;
        };
        this._createDatepicker(viewModel.start.toDate ? viewModel.start.toDate() : viewModel.start,
            viewModel.end.toDate ? viewModel.end.toDate() : viewModel.end);
        $('#creationPopupName').autocomplete({
            serviceUrl: 'get customer info',
            paramName: 'name',
            zIndex: 1060,
            maxHeight: 150,
            triggerSelectOnValidInput: false,
            transformResult: function (response) {
                response.forEach(function (item) {
                    item.data = item.contact;
                    item.value = item.name;
                    delete item.contact;
                    delete item.name;
                });

                return { suggestions: response };
            },
            onSearchComplete: function () { },
            formatResult: function (suggestion) {
                return suggestion.value + ' (' + dashContact(suggestion.data) + ')';
            },
            onSearchError: function () { },
            onSelect: function (suggestion) {
                $('#creationPopupContact').val(suggestion.data).trigger('blur');
            }
        }, NMNS.socket);

        $('#creationPopupContact').autocomplete({
            serviceUrl: 'get customer info',
            paramName: 'contact',
            zIndex: 1060,
            maxHeight: 150,
            triggerSelectOnValidInput: false,
            transformResult: function (response) {
                response.forEach(function (item) {
                    item.data = item.name;
                    item.value = item.contact;
                    delete item.contact;
                    delete item.name;
                });

                return { suggestions: response };
            },
            onSearchComplete: function () { },
            formatResult: function (suggestion) {
                return suggestion.value + ' (' + dashContact(suggestion.data) + ')';
            },
            onSearchError: function () { },
            onSelect: function (suggestion) {
                $('#creationPopupName').val(suggestion.data);
                onContactBlur();
            }
        }, NMNS.socket).on('blur', function () {
            filterNonNumericCharacter($(this));
        });

        $('#creationPopupContact').on('blur', function () {
            filterNonNumericCharacter($('#creationPopupContact'));
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                onContactBlur();
            }, 500);
        });
    }
    layer.show();
    if (this._isEditMode) {
        $('#creationPopup').data('contact', viewModel.raw.contact);
        onContactBlur();
    }
    // this._setPopupPositionAndArrowDirection(boxElement.getBoundingClientRect());
    // NMNS CUSTOMIZING END

    util.debounce(function () {
        domevent.on(document.body, 'mousedown', self._onMouseDown, self);
    })();
};

// NMNS CUSTOMIZING START
/**
 * update popup form data
 * @param {ViewModel} viewModel - viewmodel
 */
ScheduleCreationPopup.prototype._updatePopup = function (viewModel) {
    var dropdown = '';
    var escapedCssPrefix = 'tui-full-calendar-';
    document.getElementById('tui-full-calendar-schedule-start-date')._flatpickr.destroy();
    document.getElementById('tui-full-calendar-schedule-end-date')._flatpickr.destroy();
    $('#creationPopupName').val(viewModel.title || '');
    $('#creationPopupContents').val(viewModel.raw ? viewModel.raw.contents : (viewModel.contents || ''));
    $('#creationPopupContact').val(viewModel.raw ? viewModel.raw.contact : (viewModel.contact || ''));
    $('#creationPopupEtc').val(viewModel.raw ? viewModel.raw.etc : (viewModel.etc || ''));
    $('#creationPopupAllDay').attr('checked', viewModel.isAllDay);
    this._selectedCal = this._selectedCal || this.calendars[0];
    this.calendars.forEach(function (item) {
        dropdown += '<button type="button" class="dropdown-item ' + escapedCssPrefix + 'dropdown-item" data-calendar-id="' + item.id + '">\n'
            + '<span class="' + escapedCssPrefix + 'icon ' + escapedCssPrefix + 'calendar-dot" style="background-color: ' + item.bgColor + '"></span>\n'
            + '<span class="' + escapedCssPrefix + 'content">' + item.name + '</span>\n'
            + '</button>\n';
    });
    $('#creationPopupManager').html($('#creationPopupManager').next().html(dropdown).find("button[data-calendar-id='" + this._selectedCal.id + "']").html()).data('calendarid', this._selectedCal.id);
};
// NMNS CUSTOMIZING END

/**
 * Make view model for edit mode
 * @param {object} viewModel - original view model from 'beforeCreateEditPopup'
 * @returns {object} - edit mode view model
 */
ScheduleCreationPopup.prototype._makeEditModeData = function (viewModel) {
    // NMNS CUSTOMIZING START
    var schedule = viewModel.schedule;
    var title, startDate, endDate, isAllDay, state, contact, etc, contents, status;
    var raw = schedule.raw || {};
    var calendars = this.calendars;
    var calendarIndex;

    var id = schedule.id;
    title = schedule.title;
    startDate = schedule.start;
    endDate = schedule.end;
    isAllDay = schedule.isAllDay;
    state = schedule.state;
    contact = raw.contact;
    contents = raw.contents;
    etc = raw.etc;
    status = raw.status;

    calendarIndex = calendars.findIndex(function (calendar) {
        return calendar.id === viewModel.schedule.calendarId;
    });
    if (calendarIndex < 0) {
        viewModel.selectedCal = this._selectedCal = {
            id: viewModel.schedule.calendarId,
            bgColor: viewModel.schedule.bgColor,
            name: '삭제된 담당자'
        };
    } else {
        viewModel.selectedCal = this._selectedCal = calendars[calendarIndex];
    }

    this._scheduleId = id;

    return {
        id: id,
        selectedCal: this._selectedCal,
        calendars: calendars,
        title: title,
        isPrivate: false,
        location: '',
        isAllDay: isAllDay,
        state: state,
        start: startDate,
        end: endDate,
        contact: contact,
        contents: contents,
        etc: etc,
        status: status,
        raw: {
            location: '',
            'class': 'public',
            contact: contact,
            contents: contents,
            etc: etc,
            status: status
        },
        zIndex: this.layer.zIndex + 5,
        isEditMode: this._isEditMode
    };// NMNS CUSTOMIZING END
};

/**
 * Set popup position and arrow direction to apear near guide element
 * @param {MonthCreationGuide|TimeCreationGuide|DayGridCreationGuide} guideBound - creation guide element
 */
ScheduleCreationPopup.prototype._setPopupPositionAndArrowDirection = function (guideBound) {
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
    var pos;

    pos = this._calcRenderingData(layerSize, windowSize, guideBound);
    pos.x -= parentBounds.left;
    pos.y -= (parentBounds.top + 6);
    this.layer.setPosition(pos.x, pos.y);
    this._setArrowDirection(pos.arrow);
};

/**
 * Get guide elements from creation guide object
 * It is used to calculate rendering position of popup
 * It will be disappeared when hiding popup
 * @param {MonthCreationGuide|TimeCreationGuide|AlldayCreationGuide} guide - creation guide
 * @returns {Array.<HTMLElement>} creation guide element
 */
ScheduleCreationPopup.prototype._getGuideElements = function (guide) {
    var guideElements = [];
    var i = 0;

    if (guide.guideElement) {
        guideElements.push(guide.guideElement);
    } else if (guide.guideElements) {
        for (; i < MAX_WEEK_OF_MONTH; i += 1) {
            if (guide.guideElements[i]) {
                guideElements.push(guide.guideElements[i]);
            }
        }
    }

    return guideElements;
};

/**
 * Get guide element's bound data which only includes top, right, bottom, left
 * @param {Array.<HTMLElement>} guideElements - creation guide elements
 * @returns {Object} - popup bound data
 */
ScheduleCreationPopup.prototype._getBoundOfFirstRowGuideElement = function (guideElements) {
    var bound;

    if (!guideElements.length) {
        return null;
    }

    bound = guideElements[0].getBoundingClientRect();

    return {
        top: bound.top,
        left: bound.left,
        bottom: bound.bottom,
        right: bound.right
    };
};

/**
 * Calculate rendering position usering guide elements
 * @param {{width: {number}, height: {number}}} layerSize - popup layer's width and height
 * @param {{top: {number}, left: {number}, right: {number}, bottom: {number}}} parentSize - width and height of the upper layer, that acts as a border of popup
 * @param {{top: {number}, left: {number}, right: {number}, bottom: {number}}} guideBound - guide element bound data
 * @returns {PopupRenderingData} rendering position of popup and popup arrow
 */
ScheduleCreationPopup.prototype._calcRenderingData = function (layerSize, parentSize, guideBound) {
    var guideHorizontalCenter = (guideBound.left + guideBound.right) / 2;
    var x = guideHorizontalCenter - (layerSize.width / 2);
    var y = guideBound.top - layerSize.height + 3;
    var arrowDirection = 'arrow-bottom';
    var arrowLeft;

    if (y < 0) {
        y = guideBound.bottom + 9;
        arrowDirection = 'arrow-top';
    }

    if (x > 0 && (x + layerSize.width > parentSize.right)) {
        x = parentSize.right - layerSize.width;
    }

    if (x < 0) {
        x = 0;
    }

    if (guideHorizontalCenter - x !== layerSize.width / 2) {
        arrowLeft = guideHorizontalCenter - x - ARROW_WIDTH_HALF;
    }

    /**
     * @typedef {Object} PopupRenderingData
     * @property {number} x - left position
     * @property {number} y - top position
     * @property {string} arrow.direction - direction of popup arrow
     * @property {number} [arrow.position] - relative position of popup arrow, if it is not set, arrow appears on the middle of popup
     */
    return {
        x: x,
        y: y,
        arrow: {
            direction: arrowDirection,
            position: arrowLeft
        }
    };
};

/**
 * Set arrow's direction and position
 * @param {Object} arrow rendering data for popup arrow
 */
ScheduleCreationPopup.prototype._setArrowDirection = function (arrow) {
    var direction = arrow.direction || 'arrow-bottom';
    var arrowEl = domutil.get(config.classname('popup-arrow'));
    var borderElement = domutil.find(config.classname('.popup-arrow-border', arrowEl));

    if (direction !== config.classname('arrow-bottom')) {
        domutil.removeClass(arrowEl, config.classname('arrow-bottom'));
        domutil.addClass(arrowEl, config.classname(direction));
    }

    if (arrow.position) {
        borderElement.style.left = arrow.position + 'px';
    }
};

/**
 * Create date range picker using start date and end date
 * @param {TZDate} start - start date
 * @param {TZDate} end - end date
 */
ScheduleCreationPopup.prototype._createDatepicker = function (start, end) {
    // NMNS CUSTOMIZING START
    var beginTime = moment((NMNS.info.bizBeginTime || '0900'), 'HHmm').format('HH:mm');
    var endTime = moment((NMNS.info.bizEndTime || '2300'), 'HHmm').format('HH:mm');

    flatpickr('#tui-full-calendar-schedule-start-date', {
        format: 'Y-m-d H:i',
        enableTime: true,
        defaultDate: start,
        locale: 'ko',
        minuteIncrement: 10,
        minTime: beginTime,
        maxTime: endTime,
        time_24hr: true,
        applyBtn: true
    }).setDate(start);
    flatpickr('#tui-full-calendar-schedule-end-date', {
        format: 'Y-m-d H:i',
        enableTime: true,
        defaultDate: end,
        locale: 'ko',
        minuteIncrement: 10,
        minTime: beginTime,
        maxTime: endTime,
        time_24hr: true,
        applyBtn: true
    }).setDate(end);
    // NMNS CUSTOMIZING END
};

/**
 * Hide layer
 */
ScheduleCreationPopup.prototype.hide = function () {
    this.layer.hide();

    if (this.guide) {
        this.guide.clearGuideElement();
        this.guide = null;
    }
    // NMNS CUSTOMIZING START
    document.body.classList.remove('modal-open');
    domutil.find(config.classname('.screen')).style.opacity = 0;// hide screen
    domutil.find(config.classname('.screen')).style.visibility = 'hidden';// hide screen
    // NMNS CUSTOMIZING END
    domevent.off(document.body, 'mousedown', this._onMouseDown, this);
};

/**
 * refresh layer
 */
ScheduleCreationPopup.prototype.refresh = function () {
    if (this._viewModel) {
        this.layer.setContent(this.tmpl(this._viewModel));
    }
};

/**
 * Set calendar list
 * @param {Array.<Calendar>} calendars - calendar list
 */
ScheduleCreationPopup.prototype.setCalendars = function (calendars) {
    this.calendars = calendars || [];
};

module.exports = ScheduleCreationPopup;
