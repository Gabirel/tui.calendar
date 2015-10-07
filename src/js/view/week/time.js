/**
 * @fileoverview View of time.
 * @author NHN Ent. FE Development Team <dl_javascript@nhnent.com>
 */
'use strict';

var util = global.ne.util;
var datetime = require('../../datetime');
var domutil = require('../../common/domutil');
var View = require('../view');
var timeTmpl = require('../template/week/time.hbs');
var forEachArr = util.forEachArray;

/**
 * @constructor
 * @extends {View}
 * @param {number} width Date element width (percent)
 * @param {object} options Options
 * @param {string} options.ymd YYYMMDD string for this view
 * @param {boolean} options.isToday when set true then assign today design class to container.
 * @param {number} options.hourStart Can limit of render hour start.
 * @param {number} options.hourEnd Can limit of render hour end.
 * @param {HTMLElement} container Element to use container for this view.
 */
function Time(width, options, container) {
    View.call(this, null, container);

    container.style.width = width + '%';

    this.options = util.extend({
        ymd: '',
        isToday: false,
        hourStart: 0,
        hourEnd: 24
    }, options);

    if (this.options.isToday) {
        domutil.addClass(this.container, 'schedule-view-time-date-today');
    }
}

util.inherit(Time, View);

/**
 * Convert YYYYMMDD formatted string date to Date.
 * @param {string} str formatted string.
 * @returns {Date} start of date.
 */
Time.prototype._parseDateGroup = function(str) {
    var y = parseInt(str.substr(0, 4), 10),
        m = parseInt(str.substr(4, 2), 10),
        d = parseInt(str.substr(6, 2), 10);

    return new Date(y, m - 1, d);
};

/**
 * @param {EventViewModel} viewModel - view model instance to calculate bound.
 * @param {object} options - options for calculating event element's bound.
 * @param {Date} options.todayStart - date object represent event date's start (00:00:00)
 * @param {number} options.baseMS - the number of milliseconds to render event blocks.
 * @param {number} options.baseHeight - pixel value related with baseMS options.
 * @param {number[]} options.baseLeft - left position percents for each columns.
 * @param {number} options.baseWidth - the unit of event blocks width percent.
 * @param {number} options.columnIndex - the number index of event blocks.
 * it represent rendering index from left sides in view.
 * @returns {object} bound object for supplied view model.
 */
Time.prototype.getEventViewBound = function(viewModel, options) {
    var baseMS = options.baseMS,
        baseHeight = options.baseHeight,
        offsetStart,
        width,
        height,
        top;

    offsetStart = viewModel.valueOf().starts - options.todayStart;

    // containerHeight : milliseconds in day = x : event's milliseconds
    top = (baseHeight * offsetStart) / baseMS;
    height = (baseHeight * viewModel.duration()) / baseMS;
    width = options.baseWidth * (viewModel.extraSpace + 1);

    // set width auto when has no collisions.
    if (!viewModel.hasCollide) {
        width = null;
    }

    return {
        top: top,
        left: options.baseLeft[options.columnIndex],
        width: width,
        height: height
    };
};

/**
 * Set viewmodels for rendering.
 * @param {string} ymd The date of events. YYYYMMDD format.
 * @param {array} matrices The matrices for event placing.
 */
Time.prototype._getBaseViewModel = function(ymd, matrices) {
    var options = this.options,
        hourStart = options.hourStart,
        hourEnd = options.hourEnd,
        containerHeight,
        todayStart,
        baseMS;

    /**
     * Calculate each event element bounds relative with rendered hour milliseconds and
     * wrap each event model to viewmodels.
     */
    containerHeight = this.getViewBound().height;
    todayStart = this._parseDateGroup(ymd);
    todayStart.setHours(hourStart);
    baseMS = datetime.millisecondsFrom('hour', (hourEnd - hourStart));

    forEachArr(matrices, function(matrix) {
        var maxRowLength,
            widthPercent,
            leftPercents,
            i;

        maxRowLength = Math.max.apply(null, util.map(matrix, function(row) {
            return row.length;
        }));

        widthPercent = 100 / maxRowLength;

        leftPercents = [];
        for (i = 0; i < maxRowLength; i += 1) {
            leftPercents[i] = widthPercent * i;
        }

        forEachArr(matrix, function(row) {
            forEachArr(row, function(viewModel, col) {
                var viewBound;

                if (!viewModel) {
                    return;
                }

                viewBound = this.getEventViewBound(viewModel, {
                    todayStart: todayStart,
                    baseMS: baseMS,
                    baseLeft: leftPercents,
                    baseWidth: widthPercent,
                    baseHeight: containerHeight,
                    columnIndex: col
                });

                util.extend(viewModel, viewBound);
            }, this);
        }, this);
    }, this);
};

/**
 * @returns {Date} - Date of this view.
 */
Time.prototype.getDate = function() {
    return this._parseDateGroup(this.options.ymd);
};


/**
 * @override
 * @param {string} ymd The date of events. YYYYMMDD format
 * @param {array} matrices Matrices for placing events
 */
Time.prototype.render = function(ymd, matrices) {
    this._getBaseViewModel(ymd, matrices);
    this.container.innerHTML = timeTmpl({
        matrices: matrices
    });
};

module.exports = Time;
