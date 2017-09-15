(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
    'use strict';

    module.exports = require('./src/js/adaptor/jquery');

},{"./src/js/adaptor/jquery":2}],2:[function(require,module,exports){
    'use strict';

    var ps = require('../main');
    var psInstances = require('../plugin/instances');

    function mountJQuery(jQuery) {
        jQuery.fn.perfectScrollbar = function (settingOrCommand) {
            return this.each(function () {
                if (typeof settingOrCommand === 'object' ||
                    typeof settingOrCommand === 'undefined') {
                    // If it's an object or none, initialize.
                    var settings = settingOrCommand;

                    if (!psInstances.get(this)) {
                        ps.initialize(this, settings);
                    }
                } else {
                    // Unless, it may be a command.
                    var command = settingOrCommand;

                    if (command === 'update') {
                        ps.update(this);
                    } else if (command === 'destroy') {
                        ps.destroy(this);
                    }
                }
            });
        };
    }

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], mountJQuery);
    } else {
        var jq = window.jQuery ? window.jQuery : window.$;
        if (typeof jq !== 'undefined') {
            mountJQuery(jq);
        }
    }

    module.exports = mountJQuery;

},{"../main":7,"../plugin/instances":18}],3:[function(require,module,exports){
    'use strict';

    var DOM = {};

    DOM.create = function (tagName, className) {
        var element = document.createElement(tagName);
        element.className = className;
        return element;
    };

    DOM.appendTo = function (child, parent) {
        parent.appendChild(child);
        return child;
    };

    function cssGet(element, styleName) {
        return window.getComputedStyle(element)[styleName];
    }

    function cssSet(element, styleName, styleValue) {
        if (typeof styleValue === 'number') {
            styleValue = styleValue.toString() + 'px';
        }
        element.style[styleName] = styleValue;
        return element;
    }

    function cssMultiSet(element, obj) {
        for (var key in obj) {
            var val = obj[key];
            if (typeof val === 'number') {
                val = val.toString() + 'px';
            }
            element.style[key] = val;
        }
        return element;
    }

    DOM.css = function (element, styleNameOrObject, styleValue) {
        if (typeof styleNameOrObject === 'object') {
            // multiple set with object
            return cssMultiSet(element, styleNameOrObject);
        } else {
            if (typeof styleValue === 'undefined') {
                return cssGet(element, styleNameOrObject);
            } else {
                return cssSet(element, styleNameOrObject, styleValue);
            }
        }
    };

    DOM.matches = function (element, query) {
        if (typeof element.matches !== 'undefined') {
            return element.matches(query);
        } else {
            // must be IE11 and Edge
            return element.msMatchesSelector(query);
        }
    };

    DOM.remove = function (element) {
        if (typeof element.remove !== 'undefined') {
            element.remove();
        } else {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }
    };

    DOM.queryChildren = function (element, selector) {
        return Array.prototype.filter.call(element.childNodes, function (child) {
            return DOM.matches(child, selector);
        });
    };

    module.exports = DOM;

},{}],4:[function(require,module,exports){
    'use strict';

    var EventElement = function (element) {
        this.element = element;
        this.events = {};
    };

    EventElement.prototype.bind = function (eventName, handler) {
        if (typeof this.events[eventName] === 'undefined') {
            this.events[eventName] = [];
        }
        this.events[eventName].push(handler);
        this.element.addEventListener(eventName, handler, false);
    };

    EventElement.prototype.unbind = function (eventName, handler) {
        var isHandlerProvided = (typeof handler !== 'undefined');
        this.events[eventName] = this.events[eventName].filter(function (hdlr) {
            if (isHandlerProvided && hdlr !== handler) {
                return true;
            }
            this.element.removeEventListener(eventName, hdlr, false);
            return false;
        }, this);
    };

    EventElement.prototype.unbindAll = function () {
        for (var name in this.events) {
            this.unbind(name);
        }
    };

    var EventManager = function () {
        this.eventElements = [];
    };

    EventManager.prototype.eventElement = function (element) {
        var ee = this.eventElements.filter(function (eventElement) {
            return eventElement.element === element;
        })[0];
        if (typeof ee === 'undefined') {
            ee = new EventElement(element);
            this.eventElements.push(ee);
        }
        return ee;
    };

    EventManager.prototype.bind = function (element, eventName, handler) {
        this.eventElement(element).bind(eventName, handler);
    };

    EventManager.prototype.unbind = function (element, eventName, handler) {
        this.eventElement(element).unbind(eventName, handler);
    };

    EventManager.prototype.unbindAll = function () {
        for (var i = 0; i < this.eventElements.length; i++) {
            this.eventElements[i].unbindAll();
        }
    };

    EventManager.prototype.once = function (element, eventName, handler) {
        var ee = this.eventElement(element);
        var onceHandler = function (e) {
            ee.unbind(eventName, onceHandler);
            handler(e);
        };
        ee.bind(eventName, onceHandler);
    };

    module.exports = EventManager;

},{}],5:[function(require,module,exports){
    'use strict';

    module.exports = (function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return function () {
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
        };
    })();

},{}],6:[function(require,module,exports){
    'use strict';

    var dom = require('./dom');

    var toInt = exports.toInt = function (x) {
        return parseInt(x, 10) || 0;
    };

    exports.isEditable = function (el) {
        return dom.matches(el, "input,[contenteditable]") ||
            dom.matches(el, "select,[contenteditable]") ||
            dom.matches(el, "textarea,[contenteditable]") ||
            dom.matches(el, "button,[contenteditable]");
    };

    exports.removePsClasses = function (element) {
        for (var i = 0; i < element.classList.length; i++) {
            var className = element.classList[i];
            if (className.indexOf('ps-') === 0) {
                element.classList.remove(className);
            }
        }
    };

    exports.outerWidth = function (element) {
        return toInt(dom.css(element, 'width')) +
            toInt(dom.css(element, 'paddingLeft')) +
            toInt(dom.css(element, 'paddingRight')) +
            toInt(dom.css(element, 'borderLeftWidth')) +
            toInt(dom.css(element, 'borderRightWidth'));
    };

    function psClasses(axis) {
        var classes = ['ps--in-scrolling'];
        var axisClasses;
        if (typeof axis === 'undefined') {
            axisClasses = ['ps--x', 'ps--y'];
        } else {
            axisClasses = ['ps--' + axis];
        }
        return classes.concat(axisClasses);
    }

    exports.startScrolling = function (element, axis) {
        var classes = psClasses(axis);
        for (var i = 0; i < classes.length; i++) {
            element.classList.add(classes[i]);
        }
    };

    exports.stopScrolling = function (element, axis) {
        var classes = psClasses(axis);
        for (var i = 0; i < classes.length; i++) {
            element.classList.remove(classes[i]);
        }
    };

    exports.env = {
        isWebKit: typeof document !== 'undefined' && 'WebkitAppearance' in document.documentElement.style,
        supportsTouch: typeof window !== 'undefined' && (('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch),
        supportsIePointer: typeof window !== 'undefined' && window.navigator.msMaxTouchPoints !== null
    };

},{"./dom":3}],7:[function(require,module,exports){
    'use strict';

    var destroy = require('./plugin/destroy');
    var initialize = require('./plugin/initialize');
    var update = require('./plugin/update');

    module.exports = {
        initialize: initialize,
        update: update,
        destroy: destroy
    };

},{"./plugin/destroy":9,"./plugin/initialize":17,"./plugin/update":21}],8:[function(require,module,exports){
    'use strict';

    module.exports = function () {
        return {
            handlers: ['click-rail', 'drag-scrollbar', 'keyboard', 'wheel', 'touch'],
            maxScrollbarLength: null,
            minScrollbarLength: null,
            scrollXMarginOffset: 0,
            scrollYMarginOffset: 0,
            suppressScrollX: false,
            suppressScrollY: false,
            swipePropagation: true,
            swipeEasing: true,
            useBothWheelAxes: false,
            wheelPropagation: false,
            wheelSpeed: 1,
            theme: 'default'
        };
    };

},{}],9:[function(require,module,exports){
    'use strict';

    var _ = require('../lib/helper');
    var dom = require('../lib/dom');
    var instances = require('./instances');

    module.exports = function (element) {
        var i = instances.get(element);

        if (!i) {
            return;
        }

        i.event.unbindAll();
        dom.remove(i.scrollbarX);
        dom.remove(i.scrollbarY);
        dom.remove(i.scrollbarXRail);
        dom.remove(i.scrollbarYRail);
        _.removePsClasses(element);

        instances.remove(element);
    };

},{"../lib/dom":3,"../lib/helper":6,"./instances":18}],10:[function(require,module,exports){
    'use strict';

    var instances = require('../instances');
    var updateGeometry = require('../update-geometry');
    var updateScroll = require('../update-scroll');

    function bindClickRailHandler(element, i) {
        function pageOffset(el) {
            return el.getBoundingClientRect();
        }
        var stopPropagation = function (e) { e.stopPropagation(); };

        i.event.bind(i.scrollbarY, 'click', stopPropagation);
        i.event.bind(i.scrollbarYRail, 'click', function (e) {
            var positionTop = e.pageY - window.pageYOffset - pageOffset(i.scrollbarYRail).top;
            var direction = positionTop > i.scrollbarYTop ? 1 : -1;

            updateScroll(element, 'top', element.scrollTop + direction * i.containerHeight);
            updateGeometry(element);

            e.stopPropagation();
        });

        i.event.bind(i.scrollbarX, 'click', stopPropagation);
        i.event.bind(i.scrollbarXRail, 'click', function (e) {
            var positionLeft = e.pageX - window.pageXOffset - pageOffset(i.scrollbarXRail).left;
            var direction = positionLeft > i.scrollbarXLeft ? 1 : -1;

            updateScroll(element, 'left', element.scrollLeft + direction * i.containerWidth);
            updateGeometry(element);

            e.stopPropagation();
        });
    }

    module.exports = function (element) {
        var i = instances.get(element);
        bindClickRailHandler(element, i);
    };

},{"../instances":18,"../update-geometry":19,"../update-scroll":20}],11:[function(require,module,exports){
    'use strict';

    var _ = require('../../lib/helper');
    var dom = require('../../lib/dom');
    var instances = require('../instances');
    var updateGeometry = require('../update-geometry');
    var updateScroll = require('../update-scroll');

    function bindMouseScrollXHandler(element, i) {
        var currentLeft = null;
        var currentPageX = null;

        function updateScrollLeft(deltaX) {
            var newLeft = currentLeft + (deltaX * i.railXRatio);
            var maxLeft = Math.max(0, i.scrollbarXRail.getBoundingClientRect().left) + (i.railXRatio * (i.railXWidth - i.scrollbarXWidth));

            if (newLeft < 0) {
                i.scrollbarXLeft = 0;
            } else if (newLeft > maxLeft) {
                i.scrollbarXLeft = maxLeft;
            } else {
                i.scrollbarXLeft = newLeft;
            }

            var scrollLeft = _.toInt(i.scrollbarXLeft * (i.contentWidth - i.containerWidth) / (i.containerWidth - (i.railXRatio * i.scrollbarXWidth))) - i.negativeScrollAdjustment;
            updateScroll(element, 'left', scrollLeft);
        }

        var mouseMoveHandler = function (e) {
            updateScrollLeft(e.pageX - currentPageX);
            updateGeometry(element);
            e.stopPropagation();
            e.preventDefault();
        };

        var mouseUpHandler = function () {
            _.stopScrolling(element, 'x');
            i.event.unbind(i.ownerDocument, 'mousemove', mouseMoveHandler);
        };

        i.event.bind(i.scrollbarX, 'mousedown', function (e) {
            currentPageX = e.pageX;
            currentLeft = _.toInt(dom.css(i.scrollbarX, 'left')) * i.railXRatio;
            _.startScrolling(element, 'x');

            i.event.bind(i.ownerDocument, 'mousemove', mouseMoveHandler);
            i.event.once(i.ownerDocument, 'mouseup', mouseUpHandler);

            e.stopPropagation();
            e.preventDefault();
        });
    }

    function bindMouseScrollYHandler(element, i) {
        var currentTop = null;
        var currentPageY = null;

        function updateScrollTop(deltaY) {
            var newTop = currentTop + (deltaY * i.railYRatio);
            var maxTop = Math.max(0, i.scrollbarYRail.getBoundingClientRect().top) + (i.railYRatio * (i.railYHeight - i.scrollbarYHeight));

            if (newTop < 0) {
                i.scrollbarYTop = 0;
            } else if (newTop > maxTop) {
                i.scrollbarYTop = maxTop;
            } else {
                i.scrollbarYTop = newTop;
            }

            var scrollTop = _.toInt(i.scrollbarYTop * (i.contentHeight - i.containerHeight) / (i.containerHeight - (i.railYRatio * i.scrollbarYHeight)));
            updateScroll(element, 'top', scrollTop);
        }

        var mouseMoveHandler = function (e) {
            updateScrollTop(e.pageY - currentPageY);
            updateGeometry(element);
            e.stopPropagation();
            e.preventDefault();
        };

        var mouseUpHandler = function () {
            _.stopScrolling(element, 'y');
            i.event.unbind(i.ownerDocument, 'mousemove', mouseMoveHandler);
        };

        i.event.bind(i.scrollbarY, 'mousedown', function (e) {
            currentPageY = e.pageY;
            currentTop = _.toInt(dom.css(i.scrollbarY, 'top')) * i.railYRatio;
            _.startScrolling(element, 'y');

            i.event.bind(i.ownerDocument, 'mousemove', mouseMoveHandler);
            i.event.once(i.ownerDocument, 'mouseup', mouseUpHandler);

            e.stopPropagation();
            e.preventDefault();
        });
    }

    module.exports = function (element) {
        var i = instances.get(element);
        bindMouseScrollXHandler(element, i);
        bindMouseScrollYHandler(element, i);
    };

},{"../../lib/dom":3,"../../lib/helper":6,"../instances":18,"../update-geometry":19,"../update-scroll":20}],12:[function(require,module,exports){
    'use strict';

    var _ = require('../../lib/helper');
    var dom = require('../../lib/dom');
    var instances = require('../instances');
    var updateGeometry = require('../update-geometry');
    var updateScroll = require('../update-scroll');

    function bindKeyboardHandler(element, i) {
        var hovered = false;
        i.event.bind(element, 'mouseenter', function () {
            hovered = true;
        });
        i.event.bind(element, 'mouseleave', function () {
            hovered = false;
        });

        var shouldPrevent = false;
        function shouldPreventDefault(deltaX, deltaY) {
            var scrollTop = element.scrollTop;
            if (deltaX === 0) {
                if (!i.scrollbarYActive) {
                    return false;
                }
                if ((scrollTop === 0 && deltaY > 0) || (scrollTop >= i.contentHeight - i.containerHeight && deltaY < 0)) {
                    return !i.settings.wheelPropagation;
                }
            }

            var scrollLeft = element.scrollLeft;
            if (deltaY === 0) {
                if (!i.scrollbarXActive) {
                    return false;
                }
                if ((scrollLeft === 0 && deltaX < 0) || (scrollLeft >= i.contentWidth - i.containerWidth && deltaX > 0)) {
                    return !i.settings.wheelPropagation;
                }
            }
            return true;
        }

        i.event.bind(i.ownerDocument, 'keydown', function (e) {
            if ((e.isDefaultPrevented && e.isDefaultPrevented()) || e.defaultPrevented) {
                return;
            }

            var focused = dom.matches(i.scrollbarX, ':focus') ||
                dom.matches(i.scrollbarY, ':focus');

            if (!hovered && !focused) {
                return;
            }

            var activeElement = document.activeElement ? document.activeElement : i.ownerDocument.activeElement;
            if (activeElement) {
                if (activeElement.tagName === 'IFRAME') {
                    activeElement = activeElement.contentDocument.activeElement;
                } else {
                    // go deeper if element is a webcomponent
                    while (activeElement.shadowRoot) {
                        activeElement = activeElement.shadowRoot.activeElement;
                    }
                }
                if (_.isEditable(activeElement)) {
                    return;
                }
            }

            var deltaX = 0;
            var deltaY = 0;

            switch (e.which) {
                case 37: // left
                    if (e.metaKey) {
                        deltaX = -i.contentWidth;
                    } else if (e.altKey) {
                        deltaX = -i.containerWidth;
                    } else {
                        deltaX = -30;
                    }
                    break;
                case 38: // up
                    if (e.metaKey) {
                        deltaY = i.contentHeight;
                    } else if (e.altKey) {
                        deltaY = i.containerHeight;
                    } else {
                        deltaY = 30;
                    }
                    break;
                case 39: // right
                    if (e.metaKey) {
                        deltaX = i.contentWidth;
                    } else if (e.altKey) {
                        deltaX = i.containerWidth;
                    } else {
                        deltaX = 30;
                    }
                    break;
                case 40: // down
                    if (e.metaKey) {
                        deltaY = -i.contentHeight;
                    } else if (e.altKey) {
                        deltaY = -i.containerHeight;
                    } else {
                        deltaY = -30;
                    }
                    break;
                case 33: // page up
                    deltaY = 90;
                    break;
                case 32: // space bar
                    if (e.shiftKey) {
                        deltaY = 90;
                    } else {
                        deltaY = -90;
                    }
                    break;
                case 34: // page down
                    deltaY = -90;
                    break;
                case 35: // end
                    if (e.ctrlKey) {
                        deltaY = -i.contentHeight;
                    } else {
                        deltaY = -i.containerHeight;
                    }
                    break;
                case 36: // home
                    if (e.ctrlKey) {
                        deltaY = element.scrollTop;
                    } else {
                        deltaY = i.containerHeight;
                    }
                    break;
                default:
                    return;
            }

            updateScroll(element, 'top', element.scrollTop - deltaY);
            updateScroll(element, 'left', element.scrollLeft + deltaX);
            updateGeometry(element);

            shouldPrevent = shouldPreventDefault(deltaX, deltaY);
            if (shouldPrevent) {
                e.preventDefault();
            }
        });
    }

    module.exports = function (element) {
        var i = instances.get(element);
        bindKeyboardHandler(element, i);
    };

},{"../../lib/dom":3,"../../lib/helper":6,"../instances":18,"../update-geometry":19,"../update-scroll":20}],13:[function(require,module,exports){
    'use strict';

    var instances = require('../instances');
    var updateGeometry = require('../update-geometry');
    var updateScroll = require('../update-scroll');

    function bindMouseWheelHandler(element, i) {
        var shouldPrevent = false;

        function shouldPreventDefault(deltaX, deltaY) {
            var scrollTop = element.scrollTop;
            if (deltaX === 0) {
                if (!i.scrollbarYActive) {
                    return false;
                }
                if ((scrollTop === 0 && deltaY > 0) || (scrollTop >= i.contentHeight - i.containerHeight && deltaY < 0)) {
                    return !i.settings.wheelPropagation;
                }
            }

            var scrollLeft = element.scrollLeft;
            if (deltaY === 0) {
                if (!i.scrollbarXActive) {
                    return false;
                }
                if ((scrollLeft === 0 && deltaX < 0) || (scrollLeft >= i.contentWidth - i.containerWidth && deltaX > 0)) {
                    return !i.settings.wheelPropagation;
                }
            }
            return true;
        }

        function getDeltaFromEvent(e) {
            var deltaX = e.deltaX;
            var deltaY = -1 * e.deltaY;

            if (typeof deltaX === "undefined" || typeof deltaY === "undefined") {
                // OS X Safari
                deltaX = -1 * e.wheelDeltaX / 6;
                deltaY = e.wheelDeltaY / 6;
            }

            if (e.deltaMode && e.deltaMode === 1) {
                // Firefox in deltaMode 1: Line scrolling
                deltaX *= 10;
                deltaY *= 10;
            }

            if (deltaX !== deltaX && deltaY !== deltaY/* NaN checks */) {
                // IE in some mouse drivers
                deltaX = 0;
                deltaY = e.wheelDelta;
            }

            if (e.shiftKey) {
                // reverse axis with shift key
                return [-deltaY, -deltaX];
            }
            return [deltaX, deltaY];
        }

        function shouldBeConsumedByChild(deltaX, deltaY) {
            var child = element.querySelector('textarea:hover, select[multiple]:hover, .ps-child:hover');
            if (child) {
                var style = window.getComputedStyle(child);
                var overflow = [
                    style.overflow,
                    style.overflowX,
                    style.overflowY
                ].join('');

                if (!overflow.match(/(scroll|auto)/)) {
                    // if not scrollable
                    return false;
                }

                var maxScrollTop = child.scrollHeight - child.clientHeight;
                if (maxScrollTop > 0) {
                    if (!(child.scrollTop === 0 && deltaY > 0) && !(child.scrollTop === maxScrollTop && deltaY < 0)) {
                        return true;
                    }
                }
                var maxScrollLeft = child.scrollLeft - child.clientWidth;
                if (maxScrollLeft > 0) {
                    if (!(child.scrollLeft === 0 && deltaX < 0) && !(child.scrollLeft === maxScrollLeft && deltaX > 0)) {
                        return true;
                    }
                }
            }
            return false;
        }

        function mousewheelHandler(e) {
            var delta = getDeltaFromEvent(e);

            var deltaX = delta[0];
            var deltaY = delta[1];

            if (shouldBeConsumedByChild(deltaX, deltaY)) {
                return;
            }

            shouldPrevent = false;
            if (!i.settings.useBothWheelAxes) {
                // deltaX will only be used for horizontal scrolling and deltaY will
                // only be used for vertical scrolling - this is the default
                updateScroll(element, 'top', element.scrollTop - (deltaY * i.settings.wheelSpeed));
                updateScroll(element, 'left', element.scrollLeft + (deltaX * i.settings.wheelSpeed));
            } else if (i.scrollbarYActive && !i.scrollbarXActive) {
                // only vertical scrollbar is active and useBothWheelAxes option is
                // active, so let's scroll vertical bar using both mouse wheel axes
                if (deltaY) {
                    updateScroll(element, 'top', element.scrollTop - (deltaY * i.settings.wheelSpeed));
                } else {
                    updateScroll(element, 'top', element.scrollTop + (deltaX * i.settings.wheelSpeed));
                }
                shouldPrevent = true;
            } else if (i.scrollbarXActive && !i.scrollbarYActive) {
                // useBothWheelAxes and only horizontal bar is active, so use both
                // wheel axes for horizontal bar
                if (deltaX) {
                    updateScroll(element, 'left', element.scrollLeft + (deltaX * i.settings.wheelSpeed));
                } else {
                    updateScroll(element, 'left', element.scrollLeft - (deltaY * i.settings.wheelSpeed));
                }
                shouldPrevent = true;
            }

            updateGeometry(element);

            shouldPrevent = (shouldPrevent || shouldPreventDefault(deltaX, deltaY));
            if (shouldPrevent) {
                e.stopPropagation();
                e.preventDefault();
            }
        }

        if (typeof window.onwheel !== "undefined") {
            i.event.bind(element, 'wheel', mousewheelHandler);
        } else if (typeof window.onmousewheel !== "undefined") {
            i.event.bind(element, 'mousewheel', mousewheelHandler);
        }
    }

    module.exports = function (element) {
        var i = instances.get(element);
        bindMouseWheelHandler(element, i);
    };

},{"../instances":18,"../update-geometry":19,"../update-scroll":20}],14:[function(require,module,exports){
    'use strict';

    var instances = require('../instances');
    var updateGeometry = require('../update-geometry');

    function bindNativeScrollHandler(element, i) {
        i.event.bind(element, 'scroll', function () {
            updateGeometry(element);
        });
    }

    module.exports = function (element) {
        var i = instances.get(element);
        bindNativeScrollHandler(element, i);
    };

},{"../instances":18,"../update-geometry":19}],15:[function(require,module,exports){
    'use strict';

    var _ = require('../../lib/helper');
    var instances = require('../instances');
    var updateGeometry = require('../update-geometry');
    var updateScroll = require('../update-scroll');

    function bindSelectionHandler(element, i) {
        function getRangeNode() {
            var selection = window.getSelection ? window.getSelection() :
                document.getSelection ? document.getSelection() : '';
            if (selection.toString().length === 0) {
                return null;
            } else {
                return selection.getRangeAt(0).commonAncestorContainer;
            }
        }

        var scrollingLoop = null;
        var scrollDiff = {top: 0, left: 0};
        function startScrolling() {
            if (!scrollingLoop) {
                scrollingLoop = setInterval(function () {
                    if (!instances.get(element)) {
                        clearInterval(scrollingLoop);
                        return;
                    }

                    updateScroll(element, 'top', element.scrollTop + scrollDiff.top);
                    updateScroll(element, 'left', element.scrollLeft + scrollDiff.left);
                    updateGeometry(element);
                }, 50); // every .1 sec
            }
        }
        function stopScrolling() {
            if (scrollingLoop) {
                clearInterval(scrollingLoop);
                scrollingLoop = null;
            }
            _.stopScrolling(element);
        }

        var isSelected = false;
        i.event.bind(i.ownerDocument, 'selectionchange', function () {
            if (element.contains(getRangeNode())) {
                isSelected = true;
            } else {
                isSelected = false;
                stopScrolling();
            }
        });
        i.event.bind(window, 'mouseup', function () {
            if (isSelected) {
                isSelected = false;
                stopScrolling();
            }
        });
        i.event.bind(window, 'keyup', function () {
            if (isSelected) {
                isSelected = false;
                stopScrolling();
            }
        });

        i.event.bind(window, 'mousemove', function (e) {
            if (isSelected) {
                var mousePosition = {x: e.pageX, y: e.pageY};
                var containerGeometry = {
                    left: element.offsetLeft,
                    right: element.offsetLeft + element.offsetWidth,
                    top: element.offsetTop,
                    bottom: element.offsetTop + element.offsetHeight
                };

                if (mousePosition.x < containerGeometry.left + 3) {
                    scrollDiff.left = -5;
                    _.startScrolling(element, 'x');
                } else if (mousePosition.x > containerGeometry.right - 3) {
                    scrollDiff.left = 5;
                    _.startScrolling(element, 'x');
                } else {
                    scrollDiff.left = 0;
                }

                if (mousePosition.y < containerGeometry.top + 3) {
                    if (containerGeometry.top + 3 - mousePosition.y < 5) {
                        scrollDiff.top = -5;
                    } else {
                        scrollDiff.top = -20;
                    }
                    _.startScrolling(element, 'y');
                } else if (mousePosition.y > containerGeometry.bottom - 3) {
                    if (mousePosition.y - containerGeometry.bottom + 3 < 5) {
                        scrollDiff.top = 5;
                    } else {
                        scrollDiff.top = 20;
                    }
                    _.startScrolling(element, 'y');
                } else {
                    scrollDiff.top = 0;
                }

                if (scrollDiff.top === 0 && scrollDiff.left === 0) {
                    stopScrolling();
                } else {
                    startScrolling();
                }
            }
        });
    }

    module.exports = function (element) {
        var i = instances.get(element);
        bindSelectionHandler(element, i);
    };

},{"../../lib/helper":6,"../instances":18,"../update-geometry":19,"../update-scroll":20}],16:[function(require,module,exports){
    'use strict';

    var _ = require('../../lib/helper');
    var instances = require('../instances');
    var updateGeometry = require('../update-geometry');
    var updateScroll = require('../update-scroll');

    function bindTouchHandler(element, i, supportsTouch, supportsIePointer) {
        function shouldPreventDefault(deltaX, deltaY) {
            var scrollTop = element.scrollTop;
            var scrollLeft = element.scrollLeft;
            var magnitudeX = Math.abs(deltaX);
            var magnitudeY = Math.abs(deltaY);

            if (magnitudeY > magnitudeX) {
                // user is perhaps trying to swipe up/down the page

                if (((deltaY < 0) && (scrollTop === i.contentHeight - i.containerHeight)) ||
                    ((deltaY > 0) && (scrollTop === 0))) {
                    return !i.settings.swipePropagation;
                }
            } else if (magnitudeX > magnitudeY) {
                // user is perhaps trying to swipe left/right across the page

                if (((deltaX < 0) && (scrollLeft === i.contentWidth - i.containerWidth)) ||
                    ((deltaX > 0) && (scrollLeft === 0))) {
                    return !i.settings.swipePropagation;
                }
            }

            return true;
        }

        function applyTouchMove(differenceX, differenceY) {
            updateScroll(element, 'top', element.scrollTop - differenceY);
            updateScroll(element, 'left', element.scrollLeft - differenceX);

            updateGeometry(element);
        }

        var startOffset = {};
        var startTime = 0;
        var speed = {};
        var easingLoop = null;
        var inGlobalTouch = false;
        var inLocalTouch = false;

        function globalTouchStart() {
            inGlobalTouch = true;
        }
        function globalTouchEnd() {
            inGlobalTouch = false;
        }

        function getTouch(e) {
            if (e.targetTouches) {
                return e.targetTouches[0];
            } else {
                // Maybe IE pointer
                return e;
            }
        }
        function shouldHandle(e) {
            if (e.targetTouches && e.targetTouches.length === 1) {
                return true;
            }
            if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== e.MSPOINTER_TYPE_MOUSE) {
                return true;
            }
            return false;
        }
        function touchStart(e) {
            if (shouldHandle(e)) {
                inLocalTouch = true;

                var touch = getTouch(e);

                startOffset.pageX = touch.pageX;
                startOffset.pageY = touch.pageY;

                startTime = (new Date()).getTime();

                if (easingLoop !== null) {
                    clearInterval(easingLoop);
                }

                e.stopPropagation();
            }
        }
        function touchMove(e) {
            if (!inLocalTouch && i.settings.swipePropagation) {
                touchStart(e);
            }
            if (!inGlobalTouch && inLocalTouch && shouldHandle(e)) {
                var touch = getTouch(e);

                var currentOffset = {pageX: touch.pageX, pageY: touch.pageY};

                var differenceX = currentOffset.pageX - startOffset.pageX;
                var differenceY = currentOffset.pageY - startOffset.pageY;

                applyTouchMove(differenceX, differenceY);
                startOffset = currentOffset;

                var currentTime = (new Date()).getTime();

                var timeGap = currentTime - startTime;
                if (timeGap > 0) {
                    speed.x = differenceX / timeGap;
                    speed.y = differenceY / timeGap;
                    startTime = currentTime;
                }

                if (shouldPreventDefault(differenceX, differenceY)) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            }
        }
        function touchEnd() {
            if (!inGlobalTouch && inLocalTouch) {
                inLocalTouch = false;

                if (i.settings.swipeEasing) {
                    clearInterval(easingLoop);
                    easingLoop = setInterval(function () {
                        if (!instances.get(element)) {
                            clearInterval(easingLoop);
                            return;
                        }

                        if (!speed.x && !speed.y) {
                            clearInterval(easingLoop);
                            return;
                        }

                        if (Math.abs(speed.x) < 0.01 && Math.abs(speed.y) < 0.01) {
                            clearInterval(easingLoop);
                            return;
                        }

                        applyTouchMove(speed.x * 30, speed.y * 30);

                        speed.x *= 0.8;
                        speed.y *= 0.8;
                    }, 10);
                }
            }
        }

        if (supportsTouch) {
            i.event.bind(window, 'touchstart', globalTouchStart);
            i.event.bind(window, 'touchend', globalTouchEnd);
            i.event.bind(element, 'touchstart', touchStart);
            i.event.bind(element, 'touchmove', touchMove);
            i.event.bind(element, 'touchend', touchEnd);
        } else if (supportsIePointer) {
            if (window.PointerEvent) {
                i.event.bind(window, 'pointerdown', globalTouchStart);
                i.event.bind(window, 'pointerup', globalTouchEnd);
                i.event.bind(element, 'pointerdown', touchStart);
                i.event.bind(element, 'pointermove', touchMove);
                i.event.bind(element, 'pointerup', touchEnd);
            } else if (window.MSPointerEvent) {
                i.event.bind(window, 'MSPointerDown', globalTouchStart);
                i.event.bind(window, 'MSPointerUp', globalTouchEnd);
                i.event.bind(element, 'MSPointerDown', touchStart);
                i.event.bind(element, 'MSPointerMove', touchMove);
                i.event.bind(element, 'MSPointerUp', touchEnd);
            }
        }
    }

    module.exports = function (element) {
        if (!_.env.supportsTouch && !_.env.supportsIePointer) {
            return;
        }

        var i = instances.get(element);
        bindTouchHandler(element, i, _.env.supportsTouch, _.env.supportsIePointer);
    };

},{"../../lib/helper":6,"../instances":18,"../update-geometry":19,"../update-scroll":20}],17:[function(require,module,exports){
    'use strict';

    var instances = require('./instances');
    var updateGeometry = require('./update-geometry');

// Handlers
    var handlers = {
        'click-rail': require('./handler/click-rail'),
        'drag-scrollbar': require('./handler/drag-scrollbar'),
        'keyboard': require('./handler/keyboard'),
        'wheel': require('./handler/mouse-wheel'),
        'touch': require('./handler/touch'),
        'selection': require('./handler/selection')
    };
    var nativeScrollHandler = require('./handler/native-scroll');

    module.exports = function (element, userSettings) {
        element.classList.add('ps');

        // Create a plugin instance.
        var i = instances.add(
            element,
            typeof userSettings === 'object' ? userSettings : {}
        );

        element.classList.add('ps--theme_' + i.settings.theme);

        i.settings.handlers.forEach(function (handlerName) {
            handlers[handlerName](element);
        });

        nativeScrollHandler(element);

        updateGeometry(element);
    };

},{"./handler/click-rail":10,"./handler/drag-scrollbar":11,"./handler/keyboard":12,"./handler/mouse-wheel":13,"./handler/native-scroll":14,"./handler/selection":15,"./handler/touch":16,"./instances":18,"./update-geometry":19}],18:[function(require,module,exports){
    'use strict';

    var _ = require('../lib/helper');
    var defaultSettings = require('./default-setting');
    var dom = require('../lib/dom');
    var EventManager = require('../lib/event-manager');
    var guid = require('../lib/guid');

    var instances = {};

    function Instance(element, userSettings) {
        var i = this;

        i.settings = defaultSettings();
        for (var key in userSettings) {
            i.settings[key] = userSettings[key];
        }

        i.containerWidth = null;
        i.containerHeight = null;
        i.contentWidth = null;
        i.contentHeight = null;

        i.isRtl = dom.css(element, 'direction') === "rtl";
        i.isNegativeScroll = (function () {
            var originalScrollLeft = element.scrollLeft;
            var result = null;
            element.scrollLeft = -1;
            result = element.scrollLeft < 0;
            element.scrollLeft = originalScrollLeft;
            return result;
        })();
        i.negativeScrollAdjustment = i.isNegativeScroll ? element.scrollWidth - element.clientWidth : 0;
        i.event = new EventManager();
        i.ownerDocument = element.ownerDocument || document;

        function focus() {
            element.classList.add('ps--focus');
        }

        function blur() {
            element.classList.remove('ps--focus');
        }

        i.scrollbarXRail = dom.appendTo(dom.create('div', 'ps__scrollbar-x-rail'), element);
        i.scrollbarX = dom.appendTo(dom.create('div', 'ps__scrollbar-x'), i.scrollbarXRail);
        i.scrollbarX.setAttribute('tabindex', 0);
        i.event.bind(i.scrollbarX, 'focus', focus);
        i.event.bind(i.scrollbarX, 'blur', blur);
        i.scrollbarXActive = null;
        i.scrollbarXWidth = null;
        i.scrollbarXLeft = null;
        i.scrollbarXBottom = _.toInt(dom.css(i.scrollbarXRail, 'bottom'));
        i.isScrollbarXUsingBottom = i.scrollbarXBottom === i.scrollbarXBottom; // !isNaN
        i.scrollbarXTop = i.isScrollbarXUsingBottom ? null : _.toInt(dom.css(i.scrollbarXRail, 'top'));
        i.railBorderXWidth = _.toInt(dom.css(i.scrollbarXRail, 'borderLeftWidth')) + _.toInt(dom.css(i.scrollbarXRail, 'borderRightWidth'));
        // Set rail to display:block to calculate margins
        dom.css(i.scrollbarXRail, 'display', 'block');
        i.railXMarginWidth = _.toInt(dom.css(i.scrollbarXRail, 'marginLeft')) + _.toInt(dom.css(i.scrollbarXRail, 'marginRight'));
        dom.css(i.scrollbarXRail, 'display', '');
        i.railXWidth = null;
        i.railXRatio = null;

        i.scrollbarYRail = dom.appendTo(dom.create('div', 'ps__scrollbar-y-rail'), element);
        i.scrollbarY = dom.appendTo(dom.create('div', 'ps__scrollbar-y'), i.scrollbarYRail);
        i.scrollbarY.setAttribute('tabindex', 0);
        i.event.bind(i.scrollbarY, 'focus', focus);
        i.event.bind(i.scrollbarY, 'blur', blur);
        i.scrollbarYActive = null;
        i.scrollbarYHeight = null;
        i.scrollbarYTop = null;
        i.scrollbarYRight = _.toInt(dom.css(i.scrollbarYRail, 'right'));
        i.isScrollbarYUsingRight = i.scrollbarYRight === i.scrollbarYRight; // !isNaN
        i.scrollbarYLeft = i.isScrollbarYUsingRight ? null : _.toInt(dom.css(i.scrollbarYRail, 'left'));
        i.scrollbarYOuterWidth = i.isRtl ? _.outerWidth(i.scrollbarY) : null;
        i.railBorderYWidth = _.toInt(dom.css(i.scrollbarYRail, 'borderTopWidth')) + _.toInt(dom.css(i.scrollbarYRail, 'borderBottomWidth'));
        dom.css(i.scrollbarYRail, 'display', 'block');
        i.railYMarginHeight = _.toInt(dom.css(i.scrollbarYRail, 'marginTop')) + _.toInt(dom.css(i.scrollbarYRail, 'marginBottom'));
        dom.css(i.scrollbarYRail, 'display', '');
        i.railYHeight = null;
        i.railYRatio = null;
    }

    function getId(element) {
        return element.getAttribute('data-ps-id');
    }

    function setId(element, id) {
        element.setAttribute('data-ps-id', id);
    }

    function removeId(element) {
        element.removeAttribute('data-ps-id');
    }

    exports.add = function (element, userSettings) {
        var newId = guid();
        setId(element, newId);
        instances[newId] = new Instance(element, userSettings);
        return instances[newId];
    };

    exports.remove = function (element) {
        delete instances[getId(element)];
        removeId(element);
    };

    exports.get = function (element) {
        return instances[getId(element)];
    };

},{"../lib/dom":3,"../lib/event-manager":4,"../lib/guid":5,"../lib/helper":6,"./default-setting":8}],19:[function(require,module,exports){
    'use strict';

    var _ = require('../lib/helper');
    var dom = require('../lib/dom');
    var instances = require('./instances');
    var updateScroll = require('./update-scroll');

    function getThumbSize(i, thumbSize) {
        if (i.settings.minScrollbarLength) {
            thumbSize = Math.max(thumbSize, i.settings.minScrollbarLength);
        }
        if (i.settings.maxScrollbarLength) {
            thumbSize = Math.min(thumbSize, i.settings.maxScrollbarLength);
        }
        return thumbSize;
    }

    function updateCss(element, i) {
        var xRailOffset = {width: i.railXWidth};
        if (i.isRtl) {
            xRailOffset.left = i.negativeScrollAdjustment + element.scrollLeft + i.containerWidth - i.contentWidth;
        } else {
            xRailOffset.left = element.scrollLeft;
        }
        if (i.isScrollbarXUsingBottom) {
            xRailOffset.bottom = i.scrollbarXBottom - element.scrollTop;
        } else {
            xRailOffset.top = i.scrollbarXTop + element.scrollTop;
        }
        dom.css(i.scrollbarXRail, xRailOffset);

        var yRailOffset = {top: element.scrollTop, height: i.railYHeight};
        if (i.isScrollbarYUsingRight) {
            if (i.isRtl) {
                yRailOffset.right = i.contentWidth - (i.negativeScrollAdjustment + element.scrollLeft) - i.scrollbarYRight - i.scrollbarYOuterWidth;
            } else {
                yRailOffset.right = i.scrollbarYRight - element.scrollLeft;
            }
        } else {
            if (i.isRtl) {
                yRailOffset.left = i.negativeScrollAdjustment + element.scrollLeft + i.containerWidth * 2 - i.contentWidth - i.scrollbarYLeft - i.scrollbarYOuterWidth;
            } else {
                yRailOffset.left = i.scrollbarYLeft + element.scrollLeft;
            }
        }
        dom.css(i.scrollbarYRail, yRailOffset);

        dom.css(i.scrollbarX, {left: i.scrollbarXLeft, width: i.scrollbarXWidth - i.railBorderXWidth});
        dom.css(i.scrollbarY, {top: i.scrollbarYTop, height: i.scrollbarYHeight - i.railBorderYWidth});
    }

    module.exports = function (element) {
        var i = instances.get(element);

        i.containerWidth = element.clientWidth;
        i.containerHeight = element.clientHeight;
        i.contentWidth = element.scrollWidth;
        i.contentHeight = element.scrollHeight;

        var existingRails;
        if (!element.contains(i.scrollbarXRail)) {
            existingRails = dom.queryChildren(element, '.ps__scrollbar-x-rail');
            if (existingRails.length > 0) {
                existingRails.forEach(function (rail) {
                    dom.remove(rail);
                });
            }
            dom.appendTo(i.scrollbarXRail, element);
        }
        if (!element.contains(i.scrollbarYRail)) {
            existingRails = dom.queryChildren(element, '.ps__scrollbar-y-rail');
            if (existingRails.length > 0) {
                existingRails.forEach(function (rail) {
                    dom.remove(rail);
                });
            }
            dom.appendTo(i.scrollbarYRail, element);
        }

        if (!i.settings.suppressScrollX && i.containerWidth + i.settings.scrollXMarginOffset < i.contentWidth) {
            i.scrollbarXActive = true;
            i.railXWidth = i.containerWidth - i.railXMarginWidth;
            i.railXRatio = i.containerWidth / i.railXWidth;
            i.scrollbarXWidth = getThumbSize(i, _.toInt(i.railXWidth * i.containerWidth / i.contentWidth));
            i.scrollbarXLeft = _.toInt((i.negativeScrollAdjustment + element.scrollLeft) * (i.railXWidth - i.scrollbarXWidth) / (i.contentWidth - i.containerWidth));
        } else {
            i.scrollbarXActive = false;
        }

        if (!i.settings.suppressScrollY && i.containerHeight + i.settings.scrollYMarginOffset < i.contentHeight) {
            i.scrollbarYActive = true;
            i.railYHeight = i.containerHeight - i.railYMarginHeight;
            i.railYRatio = i.containerHeight / i.railYHeight;
            i.scrollbarYHeight = getThumbSize(i, _.toInt(i.railYHeight * i.containerHeight / i.contentHeight));
            i.scrollbarYTop = _.toInt(element.scrollTop * (i.railYHeight - i.scrollbarYHeight) / (i.contentHeight - i.containerHeight));
        } else {
            i.scrollbarYActive = false;
        }

        if (i.scrollbarXLeft >= i.railXWidth - i.scrollbarXWidth) {
            i.scrollbarXLeft = i.railXWidth - i.scrollbarXWidth;
        }
        if (i.scrollbarYTop >= i.railYHeight - i.scrollbarYHeight) {
            i.scrollbarYTop = i.railYHeight - i.scrollbarYHeight;
        }

        updateCss(element, i);

        if (i.scrollbarXActive) {
            element.classList.add('ps--active-x');
        } else {
            element.classList.remove('ps--active-x');
            i.scrollbarXWidth = 0;
            i.scrollbarXLeft = 0;
            updateScroll(element, 'left', 0);
        }
        if (i.scrollbarYActive) {
            element.classList.add('ps--active-y');
        } else {
            element.classList.remove('ps--active-y');
            i.scrollbarYHeight = 0;
            i.scrollbarYTop = 0;
            updateScroll(element, 'top', 0);
        }
    };

},{"../lib/dom":3,"../lib/helper":6,"./instances":18,"./update-scroll":20}],20:[function(require,module,exports){
    'use strict';

    var instances = require('./instances');

    var createDOMEvent = function (name) {
        var event = document.createEvent("Event");
        event.initEvent(name, true, true);
        return event;
    };

    module.exports = function (element, axis, value) {
        if (typeof element === 'undefined') {
            throw 'You must provide an element to the update-scroll function';
        }

        if (typeof axis === 'undefined') {
            throw 'You must provide an axis to the update-scroll function';
        }

        if (typeof value === 'undefined') {
            throw 'You must provide a value to the update-scroll function';
        }

        if (axis === 'top' && value <= 0) {
            element.scrollTop = value = 0; // don't allow negative scroll
            element.dispatchEvent(createDOMEvent('ps-y-reach-start'));
        }

        if (axis === 'left' && value <= 0) {
            element.scrollLeft = value = 0; // don't allow negative scroll
            element.dispatchEvent(createDOMEvent('ps-x-reach-start'));
        }

        var i = instances.get(element);

        if (axis === 'top' && value >= i.contentHeight - i.containerHeight) {
            // don't allow scroll past container
            value = i.contentHeight - i.containerHeight;
            if (value - element.scrollTop <= 2) {
                // mitigates rounding errors on non-subpixel scroll values
                value = element.scrollTop;
            } else {
                element.scrollTop = value;
            }
            element.dispatchEvent(createDOMEvent('ps-y-reach-end'));
        }

        if (axis === 'left' && value >= i.contentWidth - i.containerWidth) {
            // don't allow scroll past container
            value = i.contentWidth - i.containerWidth;
            if (value - element.scrollLeft <= 2) {
                // mitigates rounding errors on non-subpixel scroll values
                value = element.scrollLeft;
            } else {
                element.scrollLeft = value;
            }
            element.dispatchEvent(createDOMEvent('ps-x-reach-end'));
        }

        if (i.lastTop === undefined) {
            i.lastTop = element.scrollTop;
        }

        if (i.lastLeft === undefined) {
            i.lastLeft = element.scrollLeft;
        }

        if (axis === 'top' && value < i.lastTop) {
            element.dispatchEvent(createDOMEvent('ps-scroll-up'));
        }

        if (axis === 'top' && value > i.lastTop) {
            element.dispatchEvent(createDOMEvent('ps-scroll-down'));
        }

        if (axis === 'left' && value < i.lastLeft) {
            element.dispatchEvent(createDOMEvent('ps-scroll-left'));
        }

        if (axis === 'left' && value > i.lastLeft) {
            element.dispatchEvent(createDOMEvent('ps-scroll-right'));
        }

        if (axis === 'top' && value !== i.lastTop) {
            element.scrollTop = i.lastTop = value;
            element.dispatchEvent(createDOMEvent('ps-scroll-y'));
        }

        if (axis === 'left' && value !== i.lastLeft) {
            element.scrollLeft = i.lastLeft = value;
            element.dispatchEvent(createDOMEvent('ps-scroll-x'));
        }

    };

},{"./instances":18}],21:[function(require,module,exports){
    'use strict';

    var _ = require('../lib/helper');
    var dom = require('../lib/dom');
    var instances = require('./instances');
    var updateGeometry = require('./update-geometry');
    var updateScroll = require('./update-scroll');

    module.exports = function (element) {
        var i = instances.get(element);

        if (!i) {
            return;
        }

        // Recalcuate negative scrollLeft adjustment
        i.negativeScrollAdjustment = i.isNegativeScroll ? element.scrollWidth - element.clientWidth : 0;

        // Recalculate rail margins
        dom.css(i.scrollbarXRail, 'display', 'block');
        dom.css(i.scrollbarYRail, 'display', 'block');
        i.railXMarginWidth = _.toInt(dom.css(i.scrollbarXRail, 'marginLeft')) + _.toInt(dom.css(i.scrollbarXRail, 'marginRight'));
        i.railYMarginHeight = _.toInt(dom.css(i.scrollbarYRail, 'marginTop')) + _.toInt(dom.css(i.scrollbarYRail, 'marginBottom'));

        // Hide scrollbars not to affect scrollWidth and scrollHeight
        dom.css(i.scrollbarXRail, 'display', 'none');
        dom.css(i.scrollbarYRail, 'display', 'none');

        updateGeometry(element);

        // Update top/left scroll to trigger events
        updateScroll(element, 'top', element.scrollTop);
        updateScroll(element, 'left', element.scrollLeft);

        dom.css(i.scrollbarXRail, 'display', '');
        dom.css(i.scrollbarYRail, 'display', '');
    };

},{"../lib/dom":3,"../lib/helper":6,"./instances":18,"./update-geometry":19,"./update-scroll":20}],22:[function(require,module,exports){
// Circle shaped progress bar

    var Shape = require('./shape');
    var utils = require('./utils');

    var Circle = function Circle(container, options) {
        // Use two arcs to form a circle
        // See this answer http://stackoverflow.com/a/10477334/1446092
        this._pathTemplate =
            'M 50,50 m 0,-{radius}' +
            ' a {radius},{radius} 0 1 1 0,{2radius}' +
            ' a {radius},{radius} 0 1 1 0,-{2radius}';

        this.containerAspectRatio = 1;

        Shape.apply(this, arguments);
    };

    Circle.prototype = new Shape();
    Circle.prototype.constructor = Circle;

    Circle.prototype._pathString = function _pathString(opts) {
        var widthOfWider = opts.strokeWidth;
        if (opts.trailWidth && opts.trailWidth > opts.strokeWidth) {
            widthOfWider = opts.trailWidth;
        }

        var r = 50 - widthOfWider / 2;

        return utils.render(this._pathTemplate, {
            radius: r,
            '2radius': r * 2
        });
    };

    Circle.prototype._trailString = function _trailString(opts) {
        return this._pathString(opts);
    };

    module.exports = Circle;

},{"./shape":27,"./utils":28}],23:[function(require,module,exports){
// Line shaped progress bar

    var Shape = require('./shape');
    var utils = require('./utils');

    var Line = function Line(container, options) {
        this._pathTemplate = 'M 0,{center} L 100,{center}';
        Shape.apply(this, arguments);
    };

    Line.prototype = new Shape();
    Line.prototype.constructor = Line;

    Line.prototype._initializeSvg = function _initializeSvg(svg, opts) {
        svg.setAttribute('viewBox', '0 0 100 ' + opts.strokeWidth);
        svg.setAttribute('preserveAspectRatio', 'none');
    };

    Line.prototype._pathString = function _pathString(opts) {
        return utils.render(this._pathTemplate, {
            center: opts.strokeWidth / 2
        });
    };

    Line.prototype._trailString = function _trailString(opts) {
        return this._pathString(opts);
    };

    module.exports = Line;

},{"./shape":27,"./utils":28}],24:[function(require,module,exports){
    module.exports = {
        // Higher level API, different shaped progress bars
        Line: require('./line'),
        Circle: require('./circle'),
        SemiCircle: require('./semicircle'),

        // Lower level API to use any SVG path
        Path: require('./path'),

        // Base-class for creating new custom shapes
        // to be in line with the API of built-in shapes
        // Undocumented.
        Shape: require('./shape'),

        // Internal utils, undocumented.
        utils: require('./utils')
    };

},{"./circle":22,"./line":23,"./path":25,"./semicircle":26,"./shape":27,"./utils":28}],25:[function(require,module,exports){
// Lower level API to animate any kind of svg path

    var Tweenable = require('shifty');
    var utils = require('./utils');

    var EASING_ALIASES = {
        easeIn: 'easeInCubic',
        easeOut: 'easeOutCubic',
        easeInOut: 'easeInOutCubic'
    };

    var Path = function Path(path, opts) {
        // Throw a better error if not initialized with `new` keyword
        if (!(this instanceof Path)) {
            throw new Error('Constructor was called without new keyword');
        }

        // Default parameters for animation
        opts = utils.extend({
            duration: 800,
            easing: 'linear',
            from: {},
            to: {},
            step: function() {}
        }, opts);

        var element;
        if (utils.isString(path)) {
            element = document.querySelector(path);
        } else {
            element = path;
        }

        // Reveal .path as public attribute
        this.path = element;
        this._opts = opts;
        this._tweenable = null;

        // Set up the starting positions
        var length = this.path.getTotalLength();
        this.path.style.strokeDasharray = length + ' ' + length;
        this.set(0);
    };

    Path.prototype.value = function value() {
        var offset = this._getComputedDashOffset();
        var length = this.path.getTotalLength();

        var progress = 1 - offset / length;
        // Round number to prevent returning very small number like 1e-30, which
        // is practically 0
        return parseFloat(progress.toFixed(6), 10);
    };

    Path.prototype.set = function set(progress) {
        this.stop();

        this.path.style.strokeDashoffset = this._progressToOffset(progress);

        var step = this._opts.step;
        if (utils.isFunction(step)) {
            var easing = this._easing(this._opts.easing);
            var values = this._calculateTo(progress, easing);
            var reference = this._opts.shape || this;
            step(values, reference, this._opts.attachment);
        }
    };

    Path.prototype.stop = function stop() {
        this._stopTween();
        this.path.style.strokeDashoffset = this._getComputedDashOffset();
    };

// Method introduced here:
// http://jakearchibald.com/2013/animated-line-drawing-svg/
    Path.prototype.animate = function animate(progress, opts, cb) {
        opts = opts || {};

        if (utils.isFunction(opts)) {
            cb = opts;
            opts = {};
        }

        var passedOpts = utils.extend({}, opts);

        // Copy default opts to new object so defaults are not modified
        var defaultOpts = utils.extend({}, this._opts);
        opts = utils.extend(defaultOpts, opts);

        var shiftyEasing = this._easing(opts.easing);
        var values = this._resolveFromAndTo(progress, shiftyEasing, passedOpts);

        this.stop();

        // Trigger a layout so styles are calculated & the browser
        // picks up the starting position before animating
        this.path.getBoundingClientRect();

        var offset = this._getComputedDashOffset();
        var newOffset = this._progressToOffset(progress);

        var self = this;
        this._tweenable = new Tweenable();
        this._tweenable.tween({
            from: utils.extend({ offset: offset }, values.from),
            to: utils.extend({ offset: newOffset }, values.to),
            duration: opts.duration,
            easing: shiftyEasing,
            step: function(state) {
                self.path.style.strokeDashoffset = state.offset;
                var reference = opts.shape || self;
                opts.step(state, reference, opts.attachment);
            },
            finish: function(state) {
                if (utils.isFunction(cb)) {
                    cb();
                }
            }
        });
    };

    Path.prototype._getComputedDashOffset = function _getComputedDashOffset() {
        var computedStyle = window.getComputedStyle(this.path, null);
        return parseFloat(computedStyle.getPropertyValue('stroke-dashoffset'), 10);
    };

    Path.prototype._progressToOffset = function _progressToOffset(progress) {
        var length = this.path.getTotalLength();
        return length - progress * length;
    };

// Resolves from and to values for animation.
    Path.prototype._resolveFromAndTo = function _resolveFromAndTo(progress, easing, opts) {
        if (opts.from && opts.to) {
            return {
                from: opts.from,
                to: opts.to
            };
        }

        return {
            from: this._calculateFrom(easing),
            to: this._calculateTo(progress, easing)
        };
    };

// Calculate `from` values from options passed at initialization
    Path.prototype._calculateFrom = function _calculateFrom(easing) {
        return Tweenable.interpolate(this._opts.from, this._opts.to, this.value(), easing);
    };

// Calculate `to` values from options passed at initialization
    Path.prototype._calculateTo = function _calculateTo(progress, easing) {
        return Tweenable.interpolate(this._opts.from, this._opts.to, progress, easing);
    };

    Path.prototype._stopTween = function _stopTween() {
        if (this._tweenable !== null) {
            this._tweenable.stop();
            this._tweenable = null;
        }
    };

    Path.prototype._easing = function _easing(easing) {
        if (EASING_ALIASES.hasOwnProperty(easing)) {
            return EASING_ALIASES[easing];
        }

        return easing;
    };

    module.exports = Path;

},{"./utils":28,"shifty":29}],26:[function(require,module,exports){
// Semi-SemiCircle shaped progress bar

    var Shape = require('./shape');
    var Circle = require('./circle');
    var utils = require('./utils');

    var SemiCircle = function SemiCircle(container, options) {
        // Use one arc to form a SemiCircle
        // See this answer http://stackoverflow.com/a/10477334/1446092
        this._pathTemplate =
            'M 50,50 m -{radius},0' +
            ' a {radius},{radius} 0 1 1 {2radius},0';

        this.containerAspectRatio = 2;

        Shape.apply(this, arguments);
    };

    SemiCircle.prototype = new Shape();
    SemiCircle.prototype.constructor = SemiCircle;

    SemiCircle.prototype._initializeSvg = function _initializeSvg(svg, opts) {
        svg.setAttribute('viewBox', '0 0 100 50');
    };

    SemiCircle.prototype._initializeTextContainer = function _initializeTextContainer(
        opts,
        container,
        textContainer
    ) {
        if (opts.text.style) {
            // Reset top style
            textContainer.style.top = 'auto';
            textContainer.style.bottom = '0';

            if (opts.text.alignToBottom) {
                utils.setStyle(textContainer, 'transform', 'translate(-50%, 0)');
            } else {
                utils.setStyle(textContainer, 'transform', 'translate(-50%, 50%)');
            }
        }
    };

// Share functionality with Circle, just have different path
    SemiCircle.prototype._pathString = Circle.prototype._pathString;
    SemiCircle.prototype._trailString = Circle.prototype._trailString;

    module.exports = SemiCircle;

},{"./circle":22,"./shape":27,"./utils":28}],27:[function(require,module,exports){
// Base object for different progress bar shapes

    var Path = require('./path');
    var utils = require('./utils');

    var DESTROYED_ERROR = 'Object is destroyed';

    var Shape = function Shape(container, opts) {
        // Throw a better error if progress bars are not initialized with `new`
        // keyword
        if (!(this instanceof Shape)) {
            throw new Error('Constructor was called without new keyword');
        }

        // Prevent calling constructor without parameters so inheritance
        // works correctly. To understand, this is how Shape is inherited:
        //
        //   Line.prototype = new Shape();
        //
        // We just want to set the prototype for Line.
        if (arguments.length === 0) {
            return;
        }

        // Default parameters for progress bar creation
        this._opts = utils.extend({
            color: '#555',
            strokeWidth: 1.0,
            trailColor: null,
            trailWidth: null,
            fill: null,
            text: {
                style: {
                    color: null,
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    padding: 0,
                    margin: 0,
                    transform: {
                        prefix: true,
                        value: 'translate(-50%, -50%)'
                    }
                },
                autoStyleContainer: true,
                alignToBottom: true,
                value: null,
                className: 'progressbar-text'
            },
            svgStyle: {
                display: 'block',
                width: '100%'
            },
            warnings: false
        }, opts, true);  // Use recursive extend

        // If user specifies e.g. svgStyle or text style, the whole object
        // should replace the defaults to make working with styles easier
        if (utils.isObject(opts) && opts.svgStyle !== undefined) {
            this._opts.svgStyle = opts.svgStyle;
        }
        if (utils.isObject(opts) && utils.isObject(opts.text) && opts.text.style !== undefined) {
            this._opts.text.style = opts.text.style;
        }

        var svgView = this._createSvgView(this._opts);

        var element;
        if (utils.isString(container)) {
            element = document.querySelector(container);
        } else {
            element = container;
        }

        if (!element) {
            throw new Error('Container does not exist: ' + container);
        }

        this._container = element;
        this._container.appendChild(svgView.svg);
        if (this._opts.warnings) {
            this._warnContainerAspectRatio(this._container);
        }

        if (this._opts.svgStyle) {
            utils.setStyles(svgView.svg, this._opts.svgStyle);
        }

        // Expose public attributes before Path initialization
        this.svg = svgView.svg;
        this.path = svgView.path;
        this.trail = svgView.trail;
        this.text = null;

        var newOpts = utils.extend({
            attachment: undefined,
            shape: this
        }, this._opts);
        this._progressPath = new Path(svgView.path, newOpts);

        if (utils.isObject(this._opts.text) && this._opts.text.value !== null) {
            this.setText(this._opts.text.value);
        }
    };

    Shape.prototype.animate = function animate(progress, opts, cb) {
        if (this._progressPath === null) {
            throw new Error(DESTROYED_ERROR);
        }

        this._progressPath.animate(progress, opts, cb);
    };

    Shape.prototype.stop = function stop() {
        if (this._progressPath === null) {
            throw new Error(DESTROYED_ERROR);
        }

        // Don't crash if stop is called inside step function
        if (this._progressPath === undefined) {
            return;
        }

        this._progressPath.stop();
    };

    Shape.prototype.destroy = function destroy() {
        if (this._progressPath === null) {
            throw new Error(DESTROYED_ERROR);
        }

        this.stop();
        this.svg.parentNode.removeChild(this.svg);
        this.svg = null;
        this.path = null;
        this.trail = null;
        this._progressPath = null;

        if (this.text !== null) {
            this.text.parentNode.removeChild(this.text);
            this.text = null;
        }
    };

    Shape.prototype.set = function set(progress) {
        if (this._progressPath === null) {
            throw new Error(DESTROYED_ERROR);
        }

        this._progressPath.set(progress);
    };

    Shape.prototype.value = function value() {
        if (this._progressPath === null) {
            throw new Error(DESTROYED_ERROR);
        }

        if (this._progressPath === undefined) {
            return 0;
        }

        return this._progressPath.value();
    };

    Shape.prototype.setText = function setText(newText) {
        if (this._progressPath === null) {
            throw new Error(DESTROYED_ERROR);
        }

        if (this.text === null) {
            // Create new text node
            this.text = this._createTextContainer(this._opts, this._container);
            this._container.appendChild(this.text);
        }

        // Remove previous text and add new
        if (utils.isObject(newText)) {
            utils.removeChildren(this.text);
            this.text.appendChild(newText);
        } else {
            this.text.innerHTML = newText;
        }
    };

    Shape.prototype._createSvgView = function _createSvgView(opts) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this._initializeSvg(svg, opts);

        var trailPath = null;
        // Each option listed in the if condition are 'triggers' for creating
        // the trail path
        if (opts.trailColor || opts.trailWidth) {
            trailPath = this._createTrail(opts);
            svg.appendChild(trailPath);
        }

        var path = this._createPath(opts);
        svg.appendChild(path);

        return {
            svg: svg,
            path: path,
            trail: trailPath
        };
    };

    Shape.prototype._initializeSvg = function _initializeSvg(svg, opts) {
        svg.setAttribute('viewBox', '0 0 100 100');
    };

    Shape.prototype._createPath = function _createPath(opts) {
        var pathString = this._pathString(opts);
        return this._createPathElement(pathString, opts);
    };

    Shape.prototype._createTrail = function _createTrail(opts) {
        // Create path string with original passed options
        var pathString = this._trailString(opts);

        // Prevent modifying original
        var newOpts = utils.extend({}, opts);

        // Defaults for parameters which modify trail path
        if (!newOpts.trailColor) {
            newOpts.trailColor = '#eee';
        }
        if (!newOpts.trailWidth) {
            newOpts.trailWidth = newOpts.strokeWidth;
        }

        newOpts.color = newOpts.trailColor;
        newOpts.strokeWidth = newOpts.trailWidth;

        // When trail path is set, fill must be set for it instead of the
        // actual path to prevent trail stroke from clipping
        newOpts.fill = null;

        return this._createPathElement(pathString, newOpts);
    };

    Shape.prototype._createPathElement = function _createPathElement(pathString, opts) {
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathString);
        path.setAttribute('stroke', opts.color);
        path.setAttribute('stroke-width', opts.strokeWidth);

        if (opts.fill) {
            path.setAttribute('fill', opts.fill);
        } else {
            path.setAttribute('fill-opacity', '0');
        }

        return path;
    };

    Shape.prototype._createTextContainer = function _createTextContainer(opts, container) {
        var textContainer = document.createElement('div');
        textContainer.className = opts.text.className;

        var textStyle = opts.text.style;
        if (textStyle) {
            if (opts.text.autoStyleContainer) {
                container.style.position = 'relative';
            }

            utils.setStyles(textContainer, textStyle);
            // Default text color to progress bar's color
            if (!textStyle.color) {
                textContainer.style.color = opts.color;
            }
        }

        this._initializeTextContainer(opts, container, textContainer);
        return textContainer;
    };

// Give custom shapes possibility to modify text element
    Shape.prototype._initializeTextContainer = function(opts, container, element) {
        // By default, no-op
        // Custom shapes should respect API options, such as text.style
    };

    Shape.prototype._pathString = function _pathString(opts) {
        throw new Error('Override this function for each progress bar');
    };

    Shape.prototype._trailString = function _trailString(opts) {
        throw new Error('Override this function for each progress bar');
    };

    Shape.prototype._warnContainerAspectRatio = function _warnContainerAspectRatio(container) {
        if (!this.containerAspectRatio) {
            return;
        }

        var computedStyle = window.getComputedStyle(container, null);
        var width = parseFloat(computedStyle.getPropertyValue('width'), 10);
        var height = parseFloat(computedStyle.getPropertyValue('height'), 10);
        if (!utils.floatEquals(this.containerAspectRatio, width / height)) {
            console.warn(
                'Incorrect aspect ratio of container',
                '#' + container.id,
                'detected:',
                computedStyle.getPropertyValue('width') + '(width)',
                '/',
                computedStyle.getPropertyValue('height') + '(height)',
                '=',
                width / height
            );

            console.warn(
                'Aspect ratio of should be',
                this.containerAspectRatio
            );
        }
    };

    module.exports = Shape;

},{"./path":25,"./utils":28}],28:[function(require,module,exports){
// Utility functions

    var PREFIXES = 'Webkit Moz O ms'.split(' ');
    var FLOAT_COMPARISON_EPSILON = 0.001;

// Copy all attributes from source object to destination object.
// destination object is mutated.
    function extend(destination, source, recursive) {
        destination = destination || {};
        source = source || {};
        recursive = recursive || false;

        for (var attrName in source) {
            if (source.hasOwnProperty(attrName)) {
                var destVal = destination[attrName];
                var sourceVal = source[attrName];
                if (recursive && isObject(destVal) && isObject(sourceVal)) {
                    destination[attrName] = extend(destVal, sourceVal, recursive);
                } else {
                    destination[attrName] = sourceVal;
                }
            }
        }

        return destination;
    }

// Renders templates with given variables. Variables must be surrounded with
// braces without any spaces, e.g. {variable}
// All instances of variable placeholders will be replaced with given content
// Example:
// render('Hello, {message}!', {message: 'world'})
    function render(template, vars) {
        var rendered = template;

        for (var key in vars) {
            if (vars.hasOwnProperty(key)) {
                var val = vars[key];
                var regExpString = '\\{' + key + '\\}';
                var regExp = new RegExp(regExpString, 'g');

                rendered = rendered.replace(regExp, val);
            }
        }

        return rendered;
    }

    function setStyle(element, style, value) {
        var elStyle = element.style;  // cache for performance

        for (var i = 0; i < PREFIXES.length; ++i) {
            var prefix = PREFIXES[i];
            elStyle[prefix + capitalize(style)] = value;
        }

        elStyle[style] = value;
    }

    function setStyles(element, styles) {
        forEachObject(styles, function(styleValue, styleName) {
            // Allow disabling some individual styles by setting them
            // to null or undefined
            if (styleValue === null || styleValue === undefined) {
                return;
            }

            // If style's value is {prefix: true, value: '50%'},
            // Set also browser prefixed styles
            if (isObject(styleValue) && styleValue.prefix === true) {
                setStyle(element, styleName, styleValue.value);
            } else {
                element.style[styleName] = styleValue;
            }
        });
    }

    function capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    function isString(obj) {
        return typeof obj === 'string' || obj instanceof String;
    }

    function isFunction(obj) {
        return typeof obj === 'function';
    }

    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

// Returns true if `obj` is object as in {a: 1, b: 2}, not if it's function or
// array
    function isObject(obj) {
        if (isArray(obj)) {
            return false;
        }

        var type = typeof obj;
        return type === 'object' && !!obj;
    }

    function forEachObject(object, callback) {
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                var val = object[key];
                callback(val, key);
            }
        }
    }

    function floatEquals(a, b) {
        return Math.abs(a - b) < FLOAT_COMPARISON_EPSILON;
    }

// https://coderwall.com/p/nygghw/don-t-use-innerhtml-to-empty-dom-elements
    function removeChildren(el) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
    }

    module.exports = {
        extend: extend,
        render: render,
        setStyle: setStyle,
        setStyles: setStyles,
        capitalize: capitalize,
        isString: isString,
        isFunction: isFunction,
        isObject: isObject,
        forEachObject: forEachObject,
        floatEquals: floatEquals,
        removeChildren: removeChildren
    };

},{}],29:[function(require,module,exports){
  /* shifty - v1.5.3 - 2016-11-29 - http://jeremyckahn.github.io/shifty */
    ;(function () {
        var root = this || Function('return this')();

        /**
         * Shifty Core
         * By Jeremy Kahn - jeremyckahn@gmail.com
         */

        var Tweenable = (function () {

            'use strict';

            // Aliases that get defined later in this function
            var formula;

            // CONSTANTS
            var DEFAULT_SCHEDULE_FUNCTION;
            var DEFAULT_EASING = 'linear';
            var DEFAULT_DURATION = 500;
            var UPDATE_TIME = 1000 / 60;

            var _now = Date.now
                ? Date.now
                : function () {return +new Date();};

            var now = typeof SHIFTY_DEBUG_NOW !== 'undefined' ? SHIFTY_DEBUG_NOW : _now;

            if (typeof window !== 'undefined') {
                // requestAnimationFrame() shim by Paul Irish (modified for Shifty)
                // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
                DEFAULT_SCHEDULE_FUNCTION = window.requestAnimationFrame
                    || window.webkitRequestAnimationFrame
                    || window.oRequestAnimationFrame
                    || window.msRequestAnimationFrame
                    || (window.mozCancelRequestAnimationFrame
                    && window.mozRequestAnimationFrame)
                    || setTimeout;
            } else {
                DEFAULT_SCHEDULE_FUNCTION = setTimeout;
            }

            function noop () {
                // NOOP!
            }

            /**
             * Handy shortcut for doing a for-in loop. This is not a "normal" each
             * function, it is optimized for Shifty.  The iterator function only receives
             * the property name, not the value.
             * @param {Object} obj
             * @param {Function(string)} fn
             * @private
             */
            function each (obj, fn) {
                var key;
                for (key in obj) {
                    if (Object.hasOwnProperty.call(obj, key)) {
                        fn(key);
                    }
                }
            }

            /**
             * Perform a shallow copy of Object properties.
             * @param {Object} targetObject The object to copy into
             * @param {Object} srcObject The object to copy from
             * @return {Object} A reference to the augmented `targetObj` Object
             * @private
             */
            function shallowCopy (targetObj, srcObj) {
                each(srcObj, function (prop) {
                    targetObj[prop] = srcObj[prop];
                });

                return targetObj;
            }

            /**
             * Copies each property from src onto target, but only if the property to
             * copy to target is undefined.
             * @param {Object} target Missing properties in this Object are filled in
             * @param {Object} src
             * @private
             */
            function defaults (target, src) {
                each(src, function (prop) {
                    if (typeof target[prop] === 'undefined') {
                        target[prop] = src[prop];
                    }
                });
            }

            /**
             * Calculates the interpolated tween values of an Object for a given
             * timestamp.
             * @param {Number} forPosition The position to compute the state for.
             * @param {Object} currentState Current state properties.
             * @param {Object} originalState: The original state properties the Object is
             * tweening from.
             * @param {Object} targetState: The destination state properties the Object
             * is tweening to.
             * @param {number} duration: The length of the tween in milliseconds.
             * @param {number} timestamp: The UNIX epoch time at which the tween began.
             * @param {Object} easing: This Object's keys must correspond to the keys in
             * targetState.
             * @private
             */
            function tweenProps (forPosition, currentState, originalState, targetState,
                                 duration, timestamp, easing) {
                var normalizedPosition =
                    forPosition < timestamp ? 0 : (forPosition - timestamp) / duration;


                var prop;
                var easingObjectProp;
                var easingFn;
                for (prop in currentState) {
                    if (currentState.hasOwnProperty(prop)) {
                        easingObjectProp = easing[prop];
                        easingFn = typeof easingObjectProp === 'function'
                            ? easingObjectProp
                            : formula[easingObjectProp];

                        currentState[prop] = tweenProp(
                            originalState[prop],
                            targetState[prop],
                            easingFn,
                            normalizedPosition
                        );
                    }
                }

                return currentState;
            }

            /**
             * Tweens a single property.
             * @param {number} start The value that the tween started from.
             * @param {number} end The value that the tween should end at.
             * @param {Function} easingFunc The easing curve to apply to the tween.
             * @param {number} position The normalized position (between 0.0 and 1.0) to
             * calculate the midpoint of 'start' and 'end' against.
             * @return {number} The tweened value.
             * @private
             */
            function tweenProp (start, end, easingFunc, position) {
                return start + (end - start) * easingFunc(position);
            }

            /**
             * Applies a filter to Tweenable instance.
             * @param {Tweenable} tweenable The `Tweenable` instance to call the filter
             * upon.
             * @param {String} filterName The name of the filter to apply.
             * @private
             */
            function applyFilter (tweenable, filterName) {
                var filters = Tweenable.prototype.filter;
                var args = tweenable._filterArgs;

                each(filters, function (name) {
                    if (typeof filters[name][filterName] !== 'undefined') {
                        filters[name][filterName].apply(tweenable, args);
                    }
                });
            }

            var timeoutHandler_endTime;
            var timeoutHandler_currentTime;
            var timeoutHandler_isEnded;
            var timeoutHandler_offset;
            /**
             * Handles the update logic for one step of a tween.
             * @param {Tweenable} tweenable
             * @param {number} timestamp
             * @param {number} delay
             * @param {number} duration
             * @param {Object} currentState
             * @param {Object} originalState
             * @param {Object} targetState
             * @param {Object} easing
             * @param {Function(Object, *, number)} step
             * @param {Function(Function,number)}} schedule
             * @param {number=} opt_currentTimeOverride Needed for accurate timestamp in
             * Tweenable#seek.
             * @private
             */
            function timeoutHandler (tweenable, timestamp, delay, duration, currentState,
                                     originalState, targetState, easing, step, schedule,
                                     opt_currentTimeOverride) {

                timeoutHandler_endTime = timestamp + delay + duration;

                timeoutHandler_currentTime =
                    Math.min(opt_currentTimeOverride || now(), timeoutHandler_endTime);

                timeoutHandler_isEnded =
                    timeoutHandler_currentTime >= timeoutHandler_endTime;

                timeoutHandler_offset = duration - (
                    timeoutHandler_endTime - timeoutHandler_currentTime);

                if (tweenable.isPlaying()) {
                    if (timeoutHandler_isEnded) {
                        step(targetState, tweenable._attachment, timeoutHandler_offset);
                        tweenable.stop(true);
                    } else {
                        tweenable._scheduleId =
                            schedule(tweenable._timeoutHandler, UPDATE_TIME);

                        applyFilter(tweenable, 'beforeTween');

                        // If the animation has not yet reached the start point (e.g., there was
                        // delay that has not yet completed), just interpolate the starting
                        // position of the tween.
                        if (timeoutHandler_currentTime < (timestamp + delay)) {
                            tweenProps(1, currentState, originalState, targetState, 1, 1, easing);
                        } else {
                            tweenProps(timeoutHandler_currentTime, currentState, originalState,
                                targetState, duration, timestamp + delay, easing);
                        }

                        applyFilter(tweenable, 'afterTween');

                        step(currentState, tweenable._attachment, timeoutHandler_offset);
                    }
                }
            }


            /**
             * Creates a usable easing Object from a string, a function or another easing
             * Object.  If `easing` is an Object, then this function clones it and fills
             * in the missing properties with `"linear"`.
             * @param {Object.<string|Function>} fromTweenParams
             * @param {Object|string|Function} easing
             * @return {Object.<string|Function>}
             * @private
             */
            function composeEasingObject (fromTweenParams, easing) {
                var composedEasing = {};
                var typeofEasing = typeof easing;

                if (typeofEasing === 'string' || typeofEasing === 'function') {
                    each(fromTweenParams, function (prop) {
                        composedEasing[prop] = easing;
                    });
                } else {
                    each(fromTweenParams, function (prop) {
                        if (!composedEasing[prop]) {
                            composedEasing[prop] = easing[prop] || DEFAULT_EASING;
                        }
                    });
                }

                return composedEasing;
            }

            /**
             * Tweenable constructor.
             * @class Tweenable
             * @param {Object=} opt_initialState The values that the initial tween should
             * start at if a `from` object is not provided to `{{#crossLink
   * "Tweenable/tween:method"}}{{/crossLink}}` or `{{#crossLink
   * "Tweenable/setConfig:method"}}{{/crossLink}}`.
             * @param {Object=} opt_config Configuration object to be passed to
             * `{{#crossLink "Tweenable/setConfig:method"}}{{/crossLink}}`.
             * @module Tweenable
             * @constructor
             */
            function Tweenable (opt_initialState, opt_config) {
                this._currentState = opt_initialState || {};
                this._configured = false;
                this._scheduleFunction = DEFAULT_SCHEDULE_FUNCTION;

                // To prevent unnecessary calls to setConfig do not set default
                // configuration here.  Only set default configuration immediately before
                // tweening if none has been set.
                if (typeof opt_config !== 'undefined') {
                    this.setConfig(opt_config);
                }
            }

            /**
             * Configure and start a tween.
             * @method tween
             * @param {Object=} opt_config Configuration object to be passed to
             * `{{#crossLink "Tweenable/setConfig:method"}}{{/crossLink}}`.
             * @chainable
             */
            Tweenable.prototype.tween = function (opt_config) {
                if (this._isTweening) {
                    return this;
                }

                // Only set default config if no configuration has been set previously and
                // none is provided now.
                if (opt_config !== undefined || !this._configured) {
                    this.setConfig(opt_config);
                }

                this._timestamp = now();
                this._start(this.get(), this._attachment);
                return this.resume();
            };

            /**
             * Configure a tween that will start at some point in the future.
             *
             * @method setConfig
             * @param {Object} config The following values are valid:
             * - __from__ (_Object=_): Starting position.  If omitted, `{{#crossLink
   *   "Tweenable/get:method"}}get(){{/crossLink}}` is used.
             * - __to__ (_Object=_): Ending position.
             * - __duration__ (_number=_): How many milliseconds to animate for.
             * - __delay__ (_delay=_): How many milliseconds to wait before starting the
             *   tween.
             * - __start__ (_Function(Object, *)_): Function to execute when the tween
             *   begins.  Receives the state of the tween as the first parameter and
             *   `attachment` as the second parameter.
             * - __step__ (_Function(Object, *, number)_): Function to execute on every
             *   tick.  Receives `{{#crossLink
   *   "Tweenable/get:method"}}get(){{/crossLink}}` as the first parameter,
             *   `attachment` as the second parameter, and the time elapsed since the
             *   start of the tween as the third. This function is not called on the
             *   final step of the animation, but `finish` is.
             * - __finish__ (_Function(Object, *)_): Function to execute upon tween
             *   completion.  Receives the state of the tween as the first parameter and
             *   `attachment` as the second parameter.
             * - __easing__ (_Object.<string|Function>|string|Function=_): Easing curve
             *   name(s) or function(s) to use for the tween.
             * - __attachment__ (_*_): Cached value that is passed to the
             *   `step`/`start`/`finish` methods.
             * @chainable
             */
            Tweenable.prototype.setConfig = function (config) {
                config = config || {};
                this._configured = true;

                // Attach something to this Tweenable instance (e.g.: a DOM element, an
                // object, a string, etc.);
                this._attachment = config.attachment;

                // Init the internal state
                this._pausedAtTime = null;
                this._scheduleId = null;
                this._delay = config.delay || 0;
                this._start = config.start || noop;
                this._step = config.step || noop;
                this._finish = config.finish || noop;
                this._duration = config.duration || DEFAULT_DURATION;
                this._currentState = shallowCopy({}, config.from || this.get());
                this._originalState = this.get();
                this._targetState = shallowCopy({}, config.to || this.get());

                var self = this;
                this._timeoutHandler = function () {
                    timeoutHandler(self,
                        self._timestamp,
                        self._delay,
                        self._duration,
                        self._currentState,
                        self._originalState,
                        self._targetState,
                        self._easing,
                        self._step,
                        self._scheduleFunction
                    );
                };

                // Aliases used below
                var currentState = this._currentState;
                var targetState = this._targetState;

                // Ensure that there is always something to tween to.
                defaults(targetState, currentState);

                this._easing = composeEasingObject(
                    currentState, config.easing || DEFAULT_EASING);

                this._filterArgs =
                    [currentState, this._originalState, targetState, this._easing];

                applyFilter(this, 'tweenCreated');
                return this;
            };

            /**
             * @method get
             * @return {Object} The current state.
             */
            Tweenable.prototype.get = function () {
                return shallowCopy({}, this._currentState);
            };

            /**
             * @method set
             * @param {Object} state The current state.
             */
            Tweenable.prototype.set = function (state) {
                this._currentState = state;
            };

            /**
             * Pause a tween.  Paused tweens can be resumed from the point at which they
             * were paused.  This is different from `{{#crossLink
   * "Tweenable/stop:method"}}{{/crossLink}}`, as that method
             * causes a tween to start over when it is resumed.
             * @method pause
             * @chainable
             */
            Tweenable.prototype.pause = function () {
                this._pausedAtTime = now();
                this._isPaused = true;
                return this;
            };

            /**
             * Resume a paused tween.
             * @method resume
             * @chainable
             */
            Tweenable.prototype.resume = function () {
                if (this._isPaused) {
                    this._timestamp += now() - this._pausedAtTime;
                }

                this._isPaused = false;
                this._isTweening = true;

                this._timeoutHandler();

                return this;
            };

            /**
             * Move the state of the animation to a specific point in the tween's
             * timeline.  If the animation is not running, this will cause the `step`
             * handlers to be called.
             * @method seek
             * @param {millisecond} millisecond The millisecond of the animation to seek
             * to.  This must not be less than `0`.
             * @chainable
             */
            Tweenable.prototype.seek = function (millisecond) {
                millisecond = Math.max(millisecond, 0);
                var currentTime = now();

                if ((this._timestamp + millisecond) === 0) {
                    return this;
                }

                this._timestamp = currentTime - millisecond;

                if (!this.isPlaying()) {
                    this._isTweening = true;
                    this._isPaused = false;

                    // If the animation is not running, call timeoutHandler to make sure that
                    // any step handlers are run.
                    timeoutHandler(this,
                        this._timestamp,
                        this._delay,
                        this._duration,
                        this._currentState,
                        this._originalState,
                        this._targetState,
                        this._easing,
                        this._step,
                        this._scheduleFunction,
                        currentTime
                    );

                    this.pause();
                }

                return this;
            };

            /**
             * Stops and cancels a tween.
             * @param {boolean=} gotoEnd If `false` or omitted, the tween just stops at
             * its current state, and the `finish` handler is not invoked.  If `true`,
             * the tweened object's values are instantly set to the target values, and
             * `finish` is invoked.
             * @method stop
             * @chainable
             */
            Tweenable.prototype.stop = function (gotoEnd) {
                this._isTweening = false;
                this._isPaused = false;
                this._timeoutHandler = noop;

                (root.cancelAnimationFrame            ||
                root.webkitCancelAnimationFrame     ||
                root.oCancelAnimationFrame          ||
                root.msCancelAnimationFrame         ||
                root.mozCancelRequestAnimationFrame ||
                root.clearTimeout)(this._scheduleId);

                if (gotoEnd) {
                    applyFilter(this, 'beforeTween');
                    tweenProps(
                        1,
                        this._currentState,
                        this._originalState,
                        this._targetState,
                        1,
                        0,
                        this._easing
                    );
                    applyFilter(this, 'afterTween');
                    applyFilter(this, 'afterTweenEnd');
                    this._finish.call(this, this._currentState, this._attachment);
                }

                return this;
            };

            /**
             * @method isPlaying
             * @return {boolean} Whether or not a tween is running.
             */
            Tweenable.prototype.isPlaying = function () {
                return this._isTweening && !this._isPaused;
            };

            /**
             * Set a custom schedule function.
             *
             * If a custom function is not set,
             * [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window.requestAnimationFrame)
             * is used if available, otherwise
             * [`setTimeout`](https://developer.mozilla.org/en-US/docs/Web/API/Window.setTimeout)
             * is used.
             * @method setScheduleFunction
             * @param {Function(Function,number)} scheduleFunction The function to be
             * used to schedule the next frame to be rendered.
             */
            Tweenable.prototype.setScheduleFunction = function (scheduleFunction) {
                this._scheduleFunction = scheduleFunction;
            };

            /**
             * `delete` all "own" properties.  Call this when the `Tweenable` instance
             * is no longer needed to free memory.
             * @method dispose
             */
            Tweenable.prototype.dispose = function () {
                var prop;
                for (prop in this) {
                    if (this.hasOwnProperty(prop)) {
                        delete this[prop];
                    }
                }
            };

            /**
             * Filters are used for transforming the properties of a tween at various
             * points in a Tweenable's life cycle.  See the README for more info on this.
             * @private
             */
            Tweenable.prototype.filter = {};

            /**
             * This object contains all of the tweens available to Shifty.  It is
             * extensible - simply attach properties to the `Tweenable.prototype.formula`
             * Object following the same format as `linear`.
             *
             * `pos` should be a normalized `number` (between 0 and 1).
             * @property formula
             * @type {Object(function)}
             */
            Tweenable.prototype.formula = {
                linear: function (pos) {
                    return pos;
                }
            };

            formula = Tweenable.prototype.formula;

            shallowCopy(Tweenable, {
                'now': now
                ,'each': each
                ,'tweenProps': tweenProps
                ,'tweenProp': tweenProp
                ,'applyFilter': applyFilter
                ,'shallowCopy': shallowCopy
                ,'defaults': defaults
                ,'composeEasingObject': composeEasingObject
            });

            // `root` is provided in the intro/outro files.

            // A hook used for unit testing.
            if (typeof SHIFTY_DEBUG_NOW === 'function') {
                root.timeoutHandler = timeoutHandler;
            }

            // Bootstrap Tweenable appropriately for the environment.
            if (typeof exports === 'object') {
                // CommonJS
                module.exports = Tweenable;
            } else if (typeof define === 'function' && define.amd) {
                // AMD
                define(function () {return Tweenable;});
            } else if (typeof root.Tweenable === 'undefined') {
                // Browser: Make `Tweenable` globally accessible.
                root.Tweenable = Tweenable;
            }

            return Tweenable;

        } ());

    /*!
     * All equations are adapted from Thomas Fuchs'
     * [Scripty2](https://github.com/madrobby/scripty2/blob/master/src/effects/transitions/penner.js).
     *
     * Based on Easing Equations (c) 2003 [Robert
     * Penner](http://www.robertpenner.com/), all rights reserved. This work is
     * [subject to terms](http://www.robertpenner.com/easing_terms_of_use.html).
     */

    /*!
     *  TERMS OF USE - EASING EQUATIONS
     *  Open source under the BSD License.
     *  Easing Equations (c) 2003 Robert Penner, all rights reserved.
     */

        ;(function () {

            Tweenable.shallowCopy(Tweenable.prototype.formula, {
                easeInQuad: function (pos) {
                    return Math.pow(pos, 2);
                },

                easeOutQuad: function (pos) {
                    return -(Math.pow((pos - 1), 2) - 1);
                },

                easeInOutQuad: function (pos) {
                    if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,2);}
                    return -0.5 * ((pos -= 2) * pos - 2);
                },

                easeInCubic: function (pos) {
                    return Math.pow(pos, 3);
                },

                easeOutCubic: function (pos) {
                    return (Math.pow((pos - 1), 3) + 1);
                },

                easeInOutCubic: function (pos) {
                    if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,3);}
                    return 0.5 * (Math.pow((pos - 2),3) + 2);
                },

                easeInQuart: function (pos) {
                    return Math.pow(pos, 4);
                },

                easeOutQuart: function (pos) {
                    return -(Math.pow((pos - 1), 4) - 1);
                },

                easeInOutQuart: function (pos) {
                    if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,4);}
                    return -0.5 * ((pos -= 2) * Math.pow(pos,3) - 2);
                },

                easeInQuint: function (pos) {
                    return Math.pow(pos, 5);
                },

                easeOutQuint: function (pos) {
                    return (Math.pow((pos - 1), 5) + 1);
                },

                easeInOutQuint: function (pos) {
                    if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,5);}
                    return 0.5 * (Math.pow((pos - 2),5) + 2);
                },

                easeInSine: function (pos) {
                    return -Math.cos(pos * (Math.PI / 2)) + 1;
                },

                easeOutSine: function (pos) {
                    return Math.sin(pos * (Math.PI / 2));
                },

                easeInOutSine: function (pos) {
                    return (-0.5 * (Math.cos(Math.PI * pos) - 1));
                },

                easeInExpo: function (pos) {
                    return (pos === 0) ? 0 : Math.pow(2, 10 * (pos - 1));
                },

                easeOutExpo: function (pos) {
                    return (pos === 1) ? 1 : -Math.pow(2, -10 * pos) + 1;
                },

                easeInOutExpo: function (pos) {
                    if (pos === 0) {return 0;}
                    if (pos === 1) {return 1;}
                    if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(2,10 * (pos - 1));}
                    return 0.5 * (-Math.pow(2, -10 * --pos) + 2);
                },

                easeInCirc: function (pos) {
                    return -(Math.sqrt(1 - (pos * pos)) - 1);
                },

                easeOutCirc: function (pos) {
                    return Math.sqrt(1 - Math.pow((pos - 1), 2));
                },

                easeInOutCirc: function (pos) {
                    if ((pos /= 0.5) < 1) {return -0.5 * (Math.sqrt(1 - pos * pos) - 1);}
                    return 0.5 * (Math.sqrt(1 - (pos -= 2) * pos) + 1);
                },

                easeOutBounce: function (pos) {
                    if ((pos) < (1 / 2.75)) {
                        return (7.5625 * pos * pos);
                    } else if (pos < (2 / 2.75)) {
                        return (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75);
                    } else if (pos < (2.5 / 2.75)) {
                        return (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375);
                    } else {
                        return (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375);
                    }
                },

                easeInBack: function (pos) {
                    var s = 1.70158;
                    return (pos) * pos * ((s + 1) * pos - s);
                },

                easeOutBack: function (pos) {
                    var s = 1.70158;
                    return (pos = pos - 1) * pos * ((s + 1) * pos + s) + 1;
                },

                easeInOutBack: function (pos) {
                    var s = 1.70158;
                    if ((pos /= 0.5) < 1) {
                        return 0.5 * (pos * pos * (((s *= (1.525)) + 1) * pos - s));
                    }
                    return 0.5 * ((pos -= 2) * pos * (((s *= (1.525)) + 1) * pos + s) + 2);
                },

                elastic: function (pos) {
                    // jshint maxlen:90
                    return -1 * Math.pow(4,-8 * pos) * Math.sin((pos * 6 - 1) * (2 * Math.PI) / 2) + 1;
                },

                swingFromTo: function (pos) {
                    var s = 1.70158;
                    return ((pos /= 0.5) < 1) ?
                        0.5 * (pos * pos * (((s *= (1.525)) + 1) * pos - s)) :
                        0.5 * ((pos -= 2) * pos * (((s *= (1.525)) + 1) * pos + s) + 2);
                },

                swingFrom: function (pos) {
                    var s = 1.70158;
                    return pos * pos * ((s + 1) * pos - s);
                },

                swingTo: function (pos) {
                    var s = 1.70158;
                    return (pos -= 1) * pos * ((s + 1) * pos + s) + 1;
                },

                bounce: function (pos) {
                    if (pos < (1 / 2.75)) {
                        return (7.5625 * pos * pos);
                    } else if (pos < (2 / 2.75)) {
                        return (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75);
                    } else if (pos < (2.5 / 2.75)) {
                        return (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375);
                    } else {
                        return (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375);
                    }
                },

                bouncePast: function (pos) {
                    if (pos < (1 / 2.75)) {
                        return (7.5625 * pos * pos);
                    } else if (pos < (2 / 2.75)) {
                        return 2 - (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75);
                    } else if (pos < (2.5 / 2.75)) {
                        return 2 - (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375);
                    } else {
                        return 2 - (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375);
                    }
                },

                easeFromTo: function (pos) {
                    if ((pos /= 0.5) < 1) {return 0.5 * Math.pow(pos,4);}
                    return -0.5 * ((pos -= 2) * Math.pow(pos,3) - 2);
                },

                easeFrom: function (pos) {
                    return Math.pow(pos,4);
                },

                easeTo: function (pos) {
                    return Math.pow(pos,0.25);
                }
            });

        }());

// jshint maxlen:100
        /**
         * The Bezier magic in this file is adapted/copied almost wholesale from
         * [Scripty2](https://github.com/madrobby/scripty2/blob/master/src/effects/transitions/cubic-bezier.js),
         * which was adapted from Apple code (which probably came from
         * [here](http://opensource.apple.com/source/WebCore/WebCore-955.66/platform/graphics/UnitBezier.h)).
         * Special thanks to Apple and Thomas Fuchs for much of this code.
         */

        /**
         *  Copyright (c) 2006 Apple Computer, Inc. All rights reserved.
         *
         *  Redistribution and use in source and binary forms, with or without
         *  modification, are permitted provided that the following conditions are met:
         *
         *  1. Redistributions of source code must retain the above copyright notice,
         *  this list of conditions and the following disclaimer.
         *
         *  2. Redistributions in binary form must reproduce the above copyright notice,
         *  this list of conditions and the following disclaimer in the documentation
         *  and/or other materials provided with the distribution.
         *
         *  3. Neither the name of the copyright holder(s) nor the names of any
         *  contributors may be used to endorse or promote products derived from
         *  this software without specific prior written permission.
         *
         *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
         *  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
         *  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
         *  ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
         *  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
         *  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
         *  SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
         *  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
         *  CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
         *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
         *  POSSIBILITY OF SUCH DAMAGE.
         */
        ;(function () {
            // port of webkit cubic bezier handling by http://www.netzgesta.de/dev/
            function cubicBezierAtTime(t,p1x,p1y,p2x,p2y,duration) {
                var ax = 0,bx = 0,cx = 0,ay = 0,by = 0,cy = 0;
                function sampleCurveX(t) {
                    return ((ax * t + bx) * t + cx) * t;
                }
                function sampleCurveY(t) {
                    return ((ay * t + by) * t + cy) * t;
                }
                function sampleCurveDerivativeX(t) {
                    return (3.0 * ax * t + 2.0 * bx) * t + cx;
                }
                function solveEpsilon(duration) {
                    return 1.0 / (200.0 * duration);
                }
                function solve(x,epsilon) {
                    return sampleCurveY(solveCurveX(x, epsilon));
                }
                function fabs(n) {
                    if (n >= 0) {
                        return n;
                    } else {
                        return 0 - n;
                    }
                }
                function solveCurveX(x, epsilon) {
                    var t0,t1,t2,x2,d2,i;
                    for (t2 = x, i = 0; i < 8; i++) {
                        x2 = sampleCurveX(t2) - x;
                        if (fabs(x2) < epsilon) {
                            return t2;
                        }
                        d2 = sampleCurveDerivativeX(t2);
                        if (fabs(d2) < 1e-6) {
                            break;
                        }
                        t2 = t2 - x2 / d2;
                    }
                    t0 = 0.0;
                    t1 = 1.0;
                    t2 = x;
                    if (t2 < t0) {
                        return t0;
                    }
                    if (t2 > t1) {
                        return t1;
                    }
                    while (t0 < t1) {
                        x2 = sampleCurveX(t2);
                        if (fabs(x2 - x) < epsilon) {
                            return t2;
                        }
                        if (x > x2) {
                            t0 = t2;
                        }else {
                            t1 = t2;
                        }
                        t2 = (t1 - t0) * 0.5 + t0;
                    }
                    return t2; // Failure.
                }
                cx = 3.0 * p1x;
                bx = 3.0 * (p2x - p1x) - cx;
                ax = 1.0 - cx - bx;
                cy = 3.0 * p1y;
                by = 3.0 * (p2y - p1y) - cy;
                ay = 1.0 - cy - by;
                return solve(t, solveEpsilon(duration));
            }
            /**
             *  getCubicBezierTransition(x1, y1, x2, y2) -> Function
             *
             *  Generates a transition easing function that is compatible
             *  with WebKit's CSS transitions `-webkit-transition-timing-function`
             *  CSS property.
             *
             *  The W3C has more information about CSS3 transition timing functions:
             *  http://www.w3.org/TR/css3-transitions/#transition-timing-function_tag
             *
             *  @param {number} x1
             *  @param {number} y1
             *  @param {number} x2
             *  @param {number} y2
             *  @return {function}
             *  @private
             */
            function getCubicBezierTransition (x1, y1, x2, y2) {
                return function (pos) {
                    return cubicBezierAtTime(pos,x1,y1,x2,y2,1);
                };
            }
            // End ported code

            /**
             * Create a Bezier easing function and attach it to `{{#crossLink
   * "Tweenable/formula:property"}}Tweenable#formula{{/crossLink}}`.  This
             * function gives you total control over the easing curve.  Matthew Lein's
             * [Ceaser](http://matthewlein.com/ceaser/) is a useful tool for visualizing
             * the curves you can make with this function.
             * @method setBezierFunction
             * @param {string} name The name of the easing curve.  Overwrites the old
             * easing function on `{{#crossLink
   * "Tweenable/formula:property"}}Tweenable#formula{{/crossLink}}` if it
             * exists.
             * @param {number} x1
             * @param {number} y1
             * @param {number} x2
             * @param {number} y2
             * @return {function} The easing function that was attached to
             * Tweenable.prototype.formula.
             */
            Tweenable.setBezierFunction = function (name, x1, y1, x2, y2) {
                var cubicBezierTransition = getCubicBezierTransition(x1, y1, x2, y2);
                cubicBezierTransition.displayName = name;
                cubicBezierTransition.x1 = x1;
                cubicBezierTransition.y1 = y1;
                cubicBezierTransition.x2 = x2;
                cubicBezierTransition.y2 = y2;

                return Tweenable.prototype.formula[name] = cubicBezierTransition;
            };


            /**
             * `delete` an easing function from `{{#crossLink
   * "Tweenable/formula:property"}}Tweenable#formula{{/crossLink}}`.  Be
             * careful with this method, as it `delete`s whatever easing formula matches
             * `name` (which means you can delete standard Shifty easing functions).
             * @method unsetBezierFunction
             * @param {string} name The name of the easing function to delete.
             * @return {function}
             */
            Tweenable.unsetBezierFunction = function (name) {
                delete Tweenable.prototype.formula[name];
            };

        })();

        ;(function () {

            function getInterpolatedValues (
                from, current, targetState, position, easing, delay) {
                return Tweenable.tweenProps(
                    position, current, from, targetState, 1, delay, easing);
            }

            // Fake a Tweenable and patch some internals.  This approach allows us to
            // skip uneccessary processing and object recreation, cutting down on garbage
            // collection pauses.
            var mockTweenable = new Tweenable();
            mockTweenable._filterArgs = [];

            /**
             * Compute the midpoint of two Objects.  This method effectively calculates a
             * specific frame of animation that `{{#crossLink
   * "Tweenable/tween:method"}}{{/crossLink}}` does many times over the course
             * of a full tween.
             *
             *     var interpolatedValues = Tweenable.interpolate({
   *       width: '100px',
   *       opacity: 0,
   *       color: '#fff'
   *     }, {
   *       width: '200px',
   *       opacity: 1,
   *       color: '#000'
   *     }, 0.5);
             *
             *     console.log(interpolatedValues);
             *     // {opacity: 0.5, width: "150px", color: "rgb(127,127,127)"}
             *
             * @static
             * @method interpolate
             * @param {Object} from The starting values to tween from.
             * @param {Object} targetState The ending values to tween to.
             * @param {number} position The normalized position value (between `0.0` and
             * `1.0`) to interpolate the values between `from` and `to` for.  `from`
             * represents `0` and `to` represents `1`.
             * @param {Object.<string|Function>|string|Function} easing The easing
             * curve(s) to calculate the midpoint against.  You can reference any easing
             * function attached to `Tweenable.prototype.formula`, or provide the easing
             * function(s) directly.  If omitted, this defaults to "linear".
             * @param {number=} opt_delay Optional delay to pad the beginning of the
             * interpolated tween with.  This increases the range of `position` from (`0`
             * through `1`) to (`0` through `1 + opt_delay`).  So, a delay of `0.5` would
             * increase all valid values of `position` to numbers between `0` and `1.5`.
             * @return {Object}
             */
            Tweenable.interpolate = function (
                from, targetState, position, easing, opt_delay) {

                var current = Tweenable.shallowCopy({}, from);
                var delay = opt_delay || 0;
                var easingObject = Tweenable.composeEasingObject(
                    from, easing || 'linear');

                mockTweenable.set({});

                // Alias and reuse the _filterArgs array instead of recreating it.
                var filterArgs = mockTweenable._filterArgs;
                filterArgs.length = 0;
                filterArgs[0] = current;
                filterArgs[1] = from;
                filterArgs[2] = targetState;
                filterArgs[3] = easingObject;

                // Any defined value transformation must be applied
                Tweenable.applyFilter(mockTweenable, 'tweenCreated');
                Tweenable.applyFilter(mockTweenable, 'beforeTween');

                var interpolatedValues = getInterpolatedValues(
                    from, current, targetState, position, easingObject, delay);

                // Transform values back into their original format
                Tweenable.applyFilter(mockTweenable, 'afterTween');

                return interpolatedValues;
            };

        }());

        /**
         * This module adds string interpolation support to Shifty.
         *
         * The Token extension allows Shifty to tween numbers inside of strings.  Among
         * other things, this allows you to animate CSS properties.  For example, you
         * can do this:
         *
         *     var tweenable = new Tweenable();
         *     tweenable.tween({
 *       from: { transform: 'translateX(45px)' },
 *       to: { transform: 'translateX(90xp)' }
 *     });
         *
         * `translateX(45)` will be tweened to `translateX(90)`.  To demonstrate:
         *
         *     var tweenable = new Tweenable();
         *     tweenable.tween({
 *       from: { transform: 'translateX(45px)' },
 *       to: { transform: 'translateX(90px)' },
 *       step: function (state) {
 *         console.log(state.transform);
 *       }
 *     });
         *
         * The above snippet will log something like this in the console:
         *
         *     translateX(60.3px)
         *     ...
         *     translateX(76.05px)
         *     ...
         *     translateX(90px)
         *
         * Another use for this is animating colors:
         *
         *     var tweenable = new Tweenable();
         *     tweenable.tween({
 *       from: { color: 'rgb(0,255,0)' },
 *       to: { color: 'rgb(255,0,255)' },
 *       step: function (state) {
 *         console.log(state.color);
 *       }
 *     });
         *
         * The above snippet will log something like this:
         *
         *     rgb(84,170,84)
         *     ...
         *     rgb(170,84,170)
         *     ...
         *     rgb(255,0,255)
         *
         * This extension also supports hexadecimal colors, in both long (`#ff00ff`)
         * and short (`#f0f`) forms.  Be aware that hexadecimal input values will be
         * converted into the equivalent RGB output values.  This is done to optimize
         * for performance.
         *
         *     var tweenable = new Tweenable();
         *     tweenable.tween({
 *       from: { color: '#0f0' },
 *       to: { color: '#f0f' },
 *       step: function (state) {
 *         console.log(state.color);
 *       }
 *     });
         *
         * This snippet will generate the same output as the one before it because
         * equivalent values were supplied (just in hexadecimal form rather than RGB):
         *
         *     rgb(84,170,84)
         *     ...
         *     rgb(170,84,170)
         *     ...
         *     rgb(255,0,255)
         *
         * ## Easing support
         *
         * Easing works somewhat differently in the Token extension.  This is because
         * some CSS properties have multiple values in them, and you might need to
         * tween each value along its own easing curve.  A basic example:
         *
         *     var tweenable = new Tweenable();
         *     tweenable.tween({
 *       from: { transform: 'translateX(0px) translateY(0px)' },
 *       to: { transform:   'translateX(100px) translateY(100px)' },
 *       easing: { transform: 'easeInQuad' },
 *       step: function (state) {
 *         console.log(state.transform);
 *       }
 *     });
         *
         * The above snippet will create values like this:
         *
         *     translateX(11.56px) translateY(11.56px)
         *     ...
         *     translateX(46.24px) translateY(46.24px)
         *     ...
         *     translateX(100px) translateY(100px)
         *
         * In this case, the values for `translateX` and `translateY` are always the
         * same for each step of the tween, because they have the same start and end
         * points and both use the same easing curve.  We can also tween `translateX`
         * and `translateY` along independent curves:
         *
         *     var tweenable = new Tweenable();
         *     tweenable.tween({
 *       from: { transform: 'translateX(0px) translateY(0px)' },
 *       to: { transform:   'translateX(100px) translateY(100px)' },
 *       easing: { transform: 'easeInQuad bounce' },
 *       step: function (state) {
 *         console.log(state.transform);
 *       }
 *     });
         *
         * The above snippet will create values like this:
         *
         *     translateX(10.89px) translateY(82.35px)
         *     ...
         *     translateX(44.89px) translateY(86.73px)
         *     ...
         *     translateX(100px) translateY(100px)
         *
         * `translateX` and `translateY` are not in sync anymore, because `easeInQuad`
         * was specified for `translateX` and `bounce` for `translateY`.  Mixing and
         * matching easing curves can make for some interesting motion in your
         * animations.
         *
         * The order of the space-separated easing curves correspond the token values
         * they apply to.  If there are more token values than easing curves listed,
         * the last easing curve listed is used.
         * @submodule Tweenable.token
         */

// token function is defined above only so that dox-foundation sees it as
// documentation and renders it.  It is never used, and is optimized away at
// build time.

        ;(function (Tweenable) {

            /**
             * @typedef {{
   *   formatString: string
   *   chunkNames: Array.<string>
   * }}
             * @private
             */
            var formatManifest;

            // CONSTANTS

            var R_NUMBER_COMPONENT = /(\d|\-|\.)/;
            var R_FORMAT_CHUNKS = /([^\-0-9\.]+)/g;
            var R_UNFORMATTED_VALUES = /[0-9.\-]+/g;
            var R_RGB = new RegExp(
                'rgb\\(' + R_UNFORMATTED_VALUES.source +
                (/,\s*/.source) + R_UNFORMATTED_VALUES.source +
                (/,\s*/.source) + R_UNFORMATTED_VALUES.source + '\\)', 'g');
            var R_RGB_PREFIX = /^.*\(/;
            var R_HEX = /#([0-9]|[a-f]){3,6}/gi;
            var VALUE_PLACEHOLDER = 'VAL';

            // HELPERS

            /**
             * @param {Array.number} rawValues
             * @param {string} prefix
             *
             * @return {Array.<string>}
             * @private
             */
            function getFormatChunksFrom (rawValues, prefix) {
                var accumulator = [];

                var rawValuesLength = rawValues.length;
                var i;

                for (i = 0; i < rawValuesLength; i++) {
                    accumulator.push('_' + prefix + '_' + i);
                }

                return accumulator;
            }

            /**
             * @param {string} formattedString
             *
             * @return {string}
             * @private
             */
            function getFormatStringFrom (formattedString) {
                var chunks = formattedString.match(R_FORMAT_CHUNKS);

                if (!chunks) {
                    // chunks will be null if there were no tokens to parse in
                    // formattedString (for example, if formattedString is '2').  Coerce
                    // chunks to be useful here.
                    chunks = ['', ''];

                    // If there is only one chunk, assume that the string is a number
                    // followed by a token...
                    // NOTE: This may be an unwise assumption.
                } else if (chunks.length === 1 ||
                    // ...or if the string starts with a number component (".", "-", or a
                    // digit)...
                    formattedString.charAt(0).match(R_NUMBER_COMPONENT)) {
                    // ...prepend an empty string here to make sure that the formatted number
                    // is properly replaced by VALUE_PLACEHOLDER
                    chunks.unshift('');
                }

                return chunks.join(VALUE_PLACEHOLDER);
            }

            /**
             * Convert all hex color values within a string to an rgb string.
             *
             * @param {Object} stateObject
             *
             * @return {Object} The modified obj
             * @private
             */
            function sanitizeObjectForHexProps (stateObject) {
                Tweenable.each(stateObject, function (prop) {
                    var currentProp = stateObject[prop];

                    if (typeof currentProp === 'string' && currentProp.match(R_HEX)) {
                        stateObject[prop] = sanitizeHexChunksToRGB(currentProp);
                    }
                });
            }

            /**
             * @param {string} str
             *
             * @return {string}
             * @private
             */
            function  sanitizeHexChunksToRGB (str) {
                return filterStringChunks(R_HEX, str, convertHexToRGB);
            }

            /**
             * @param {string} hexString
             *
             * @return {string}
             * @private
             */
            function convertHexToRGB (hexString) {
                var rgbArr = hexToRGBArray(hexString);
                return 'rgb(' + rgbArr[0] + ',' + rgbArr[1] + ',' + rgbArr[2] + ')';
            }

            var hexToRGBArray_returnArray = [];
            /**
             * Convert a hexadecimal string to an array with three items, one each for
             * the red, blue, and green decimal values.
             *
             * @param {string} hex A hexadecimal string.
             *
             * @returns {Array.<number>} The converted Array of RGB values if `hex` is a
             * valid string, or an Array of three 0's.
             * @private
             */
            function hexToRGBArray (hex) {

                hex = hex.replace(/#/, '');

                // If the string is a shorthand three digit hex notation, normalize it to
                // the standard six digit notation
                if (hex.length === 3) {
                    hex = hex.split('');
                    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
                }

                hexToRGBArray_returnArray[0] = hexToDec(hex.substr(0, 2));
                hexToRGBArray_returnArray[1] = hexToDec(hex.substr(2, 2));
                hexToRGBArray_returnArray[2] = hexToDec(hex.substr(4, 2));

                return hexToRGBArray_returnArray;
            }

            /**
             * Convert a base-16 number to base-10.
             *
             * @param {Number|String} hex The value to convert
             *
             * @returns {Number} The base-10 equivalent of `hex`.
             * @private
             */
            function hexToDec (hex) {
                return parseInt(hex, 16);
            }

            /**
             * Runs a filter operation on all chunks of a string that match a RegExp
             *
             * @param {RegExp} pattern
             * @param {string} unfilteredString
             * @param {function(string)} filter
             *
             * @return {string}
             * @private
             */
            function filterStringChunks (pattern, unfilteredString, filter) {
                var pattenMatches = unfilteredString.match(pattern);
                var filteredString = unfilteredString.replace(pattern, VALUE_PLACEHOLDER);

                if (pattenMatches) {
                    var pattenMatchesLength = pattenMatches.length;
                    var currentChunk;

                    for (var i = 0; i < pattenMatchesLength; i++) {
                        currentChunk = pattenMatches.shift();
                        filteredString = filteredString.replace(
                            VALUE_PLACEHOLDER, filter(currentChunk));
                    }
                }

                return filteredString;
            }

            /**
             * Check for floating point values within rgb strings and rounds them.
             *
             * @param {string} formattedString
             *
             * @return {string}
             * @private
             */
            function sanitizeRGBChunks (formattedString) {
                return filterStringChunks(R_RGB, formattedString, sanitizeRGBChunk);
            }

            /**
             * @param {string} rgbChunk
             *
             * @return {string}
             * @private
             */
            function sanitizeRGBChunk (rgbChunk) {
                var numbers = rgbChunk.match(R_UNFORMATTED_VALUES);
                var numbersLength = numbers.length;
                var sanitizedString = rgbChunk.match(R_RGB_PREFIX)[0];

                for (var i = 0; i < numbersLength; i++) {
                    sanitizedString += parseInt(numbers[i], 10) + ',';
                }

                sanitizedString = sanitizedString.slice(0, -1) + ')';

                return sanitizedString;
            }

            /**
             * @param {Object} stateObject
             *
             * @return {Object} An Object of formatManifests that correspond to
             * the string properties of stateObject
             * @private
             */
            function getFormatManifests (stateObject) {
                var manifestAccumulator = {};

                Tweenable.each(stateObject, function (prop) {
                    var currentProp = stateObject[prop];

                    if (typeof currentProp === 'string') {
                        var rawValues = getValuesFrom(currentProp);

                        manifestAccumulator[prop] = {
                            'formatString': getFormatStringFrom(currentProp)
                            ,'chunkNames': getFormatChunksFrom(rawValues, prop)
                        };
                    }
                });

                return manifestAccumulator;
            }

            /**
             * @param {Object} stateObject
             * @param {Object} formatManifests
             * @private
             */
            function expandFormattedProperties (stateObject, formatManifests) {
                Tweenable.each(formatManifests, function (prop) {
                    var currentProp = stateObject[prop];
                    var rawValues = getValuesFrom(currentProp);
                    var rawValuesLength = rawValues.length;

                    for (var i = 0; i < rawValuesLength; i++) {
                        stateObject[formatManifests[prop].chunkNames[i]] = +rawValues[i];
                    }

                    delete stateObject[prop];
                });
            }

            /**
             * @param {Object} stateObject
             * @param {Object} formatManifests
             * @private
             */
            function collapseFormattedProperties (stateObject, formatManifests) {
                Tweenable.each(formatManifests, function (prop) {
                    var currentProp = stateObject[prop];
                    var formatChunks = extractPropertyChunks(
                        stateObject, formatManifests[prop].chunkNames);
                    var valuesList = getValuesList(
                        formatChunks, formatManifests[prop].chunkNames);
                    currentProp = getFormattedValues(
                        formatManifests[prop].formatString, valuesList);
                    stateObject[prop] = sanitizeRGBChunks(currentProp);
                });
            }

            /**
             * @param {Object} stateObject
             * @param {Array.<string>} chunkNames
             *
             * @return {Object} The extracted value chunks.
             * @private
             */
            function extractPropertyChunks (stateObject, chunkNames) {
                var extractedValues = {};
                var currentChunkName, chunkNamesLength = chunkNames.length;

                for (var i = 0; i < chunkNamesLength; i++) {
                    currentChunkName = chunkNames[i];
                    extractedValues[currentChunkName] = stateObject[currentChunkName];
                    delete stateObject[currentChunkName];
                }

                return extractedValues;
            }

            var getValuesList_accumulator = [];
            /**
             * @param {Object} stateObject
             * @param {Array.<string>} chunkNames
             *
             * @return {Array.<number>}
             * @private
             */
            function getValuesList (stateObject, chunkNames) {
                getValuesList_accumulator.length = 0;
                var chunkNamesLength = chunkNames.length;

                for (var i = 0; i < chunkNamesLength; i++) {
                    getValuesList_accumulator.push(stateObject[chunkNames[i]]);
                }

                return getValuesList_accumulator;
            }

            /**
             * @param {string} formatString
             * @param {Array.<number>} rawValues
             *
             * @return {string}
             * @private
             */
            function getFormattedValues (formatString, rawValues) {
                var formattedValueString = formatString;
                var rawValuesLength = rawValues.length;

                for (var i = 0; i < rawValuesLength; i++) {
                    formattedValueString = formattedValueString.replace(
                        VALUE_PLACEHOLDER, +rawValues[i].toFixed(4));
                }

                return formattedValueString;
            }

            /**
             * Note: It's the duty of the caller to convert the Array elements of the
             * return value into numbers.  This is a performance optimization.
             *
             * @param {string} formattedString
             *
             * @return {Array.<string>|null}
             * @private
             */
            function getValuesFrom (formattedString) {
                return formattedString.match(R_UNFORMATTED_VALUES);
            }

            /**
             * @param {Object} easingObject
             * @param {Object} tokenData
             * @private
             */
            function expandEasingObject (easingObject, tokenData) {
                Tweenable.each(tokenData, function (prop) {
                    var currentProp = tokenData[prop];
                    var chunkNames = currentProp.chunkNames;
                    var chunkLength = chunkNames.length;

                    var easing = easingObject[prop];
                    var i;

                    if (typeof easing === 'string') {
                        var easingChunks = easing.split(' ');
                        var lastEasingChunk = easingChunks[easingChunks.length - 1];

                        for (i = 0; i < chunkLength; i++) {
                            easingObject[chunkNames[i]] = easingChunks[i] || lastEasingChunk;
                        }

                    } else {
                        for (i = 0; i < chunkLength; i++) {
                            easingObject[chunkNames[i]] = easing;
                        }
                    }

                    delete easingObject[prop];
                });
            }

            /**
             * @param {Object} easingObject
             * @param {Object} tokenData
             * @private
             */
            function collapseEasingObject (easingObject, tokenData) {
                Tweenable.each(tokenData, function (prop) {
                    var currentProp = tokenData[prop];
                    var chunkNames = currentProp.chunkNames;
                    var chunkLength = chunkNames.length;

                    var firstEasing = easingObject[chunkNames[0]];
                    var typeofEasings = typeof firstEasing;

                    if (typeofEasings === 'string') {
                        var composedEasingString = '';

                        for (var i = 0; i < chunkLength; i++) {
                            composedEasingString += ' ' + easingObject[chunkNames[i]];
                            delete easingObject[chunkNames[i]];
                        }

                        easingObject[prop] = composedEasingString.substr(1);
                    } else {
                        easingObject[prop] = firstEasing;
                    }
                });
            }

            Tweenable.prototype.filter.token = {
                'tweenCreated': function (currentState, fromState, toState, easingObject) {
                    sanitizeObjectForHexProps(currentState);
                    sanitizeObjectForHexProps(fromState);
                    sanitizeObjectForHexProps(toState);
                    this._tokenData = getFormatManifests(currentState);
                },

                'beforeTween': function (currentState, fromState, toState, easingObject) {
                    expandEasingObject(easingObject, this._tokenData);
                    expandFormattedProperties(currentState, this._tokenData);
                    expandFormattedProperties(fromState, this._tokenData);
                    expandFormattedProperties(toState, this._tokenData);
                },

                'afterTween': function (currentState, fromState, toState, easingObject) {
                    collapseFormattedProperties(currentState, this._tokenData);
                    collapseFormattedProperties(fromState, this._tokenData);
                    collapseFormattedProperties(toState, this._tokenData);
                    collapseEasingObject(easingObject, this._tokenData);
                }
            };

        } (Tweenable));

    }).call(null);

},{}],30:[function(require,module,exports){
    !function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.Scrollbar=e():t.Scrollbar=e()}(this,function(){return function(t){function e(r){if(n[r])return n[r].exports;var o=n[r]={exports:{},id:r,loaded:!1};return t[r].call(o.exports,o,o.exports,e),o.loaded=!0,o.exports}var n={};return e.m=t,e.c=n,e.p="",e(0)}([function(t,e,n){t.exports=n(1)},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(t){if(Array.isArray(t)){for(var e=0,n=Array(t.length);e<t.length;e++)n[e]=t[e];return n}return(0,u.default)(t)}var i=n(2),u=r(i),a=n(55),c=r(a),l=n(62),f=r(l);Object.defineProperty(e,"__esModule",{value:!0});var s="function"==typeof f.default&&"symbol"==typeof c.default?function(t){return typeof t}:function(t){return t&&"function"==typeof f.default&&t.constructor===f.default&&t!==f.default.prototype?"symbol":typeof t},d=n(78),h=n(89);n(129),n(145),n(158),n(173),n(187),e.default=d.SmoothScrollbar,d.SmoothScrollbar.version="7.4.1",d.SmoothScrollbar.init=function(t,e){if(!t||1!==t.nodeType)throw new TypeError("expect element to be DOM Element, but got "+("undefined"==typeof t?"undefined":s(t)));if(h.sbList.has(t))return h.sbList.get(t);t.setAttribute("data-scrollbar","");var n=[].concat(o(t.childNodes)),r=document.createElement("div");r.innerHTML='\n        <div class="scroll-content"></div>\n        <div class="scrollbar-track scrollbar-track-x">\n            <div class="scrollbar-thumb scrollbar-thumb-x"></div>\n        </div>\n        <div class="scrollbar-track scrollbar-track-y">\n            <div class="scrollbar-thumb scrollbar-thumb-y"></div>\n        </div>\n        <canvas class="overscroll-glow"></canvas>\n    ';var i=r.querySelector(".scroll-content");return[].concat(o(r.childNodes)).forEach(function(e){return t.appendChild(e)}),n.forEach(function(t){return i.appendChild(t)}),new d.SmoothScrollbar(t,e)},d.SmoothScrollbar.initAll=function(t){return[].concat(o(document.querySelectorAll(h.selectors))).map(function(e){return d.SmoothScrollbar.init(e,t)})},d.SmoothScrollbar.has=function(t){return h.sbList.has(t)},d.SmoothScrollbar.get=function(t){return h.sbList.get(t)},d.SmoothScrollbar.getAll=function(){return[].concat(o(h.sbList.values()))},d.SmoothScrollbar.destroy=function(t,e){return d.SmoothScrollbar.has(t)&&d.SmoothScrollbar.get(t).destroy(e)},d.SmoothScrollbar.destroyAll=function(t){h.sbList.forEach(function(e){e.destroy(t)})},t.exports=e.default},function(t,e,n){t.exports={default:n(3),__esModule:!0}},function(t,e,n){n(4),n(48),t.exports=n(12).Array.from},function(t,e,n){"use strict";var r=n(5)(!0);n(8)(String,"String",function(t){this._t=String(t),this._i=0},function(){var t,e=this._t,n=this._i;return n>=e.length?{value:void 0,done:!0}:(t=r(e,n),this._i+=t.length,{value:t,done:!1})})},function(t,e,n){var r=n(6),o=n(7);t.exports=function(t){return function(e,n){var i,u,a=String(o(e)),c=r(n),l=a.length;return c<0||c>=l?t?"":void 0:(i=a.charCodeAt(c),i<55296||i>56319||c+1===l||(u=a.charCodeAt(c+1))<56320||u>57343?t?a.charAt(c):i:t?a.slice(c,c+2):(i-55296<<10)+(u-56320)+65536)}}},function(t,e){var n=Math.ceil,r=Math.floor;t.exports=function(t){return isNaN(t=+t)?0:(t>0?r:n)(t)}},function(t,e){t.exports=function(t){if(void 0==t)throw TypeError("Can't call method on  "+t);return t}},function(t,e,n){"use strict";var r=n(9),o=n(10),i=n(25),u=n(15),a=n(26),c=n(27),l=n(28),f=n(44),s=n(46),d=n(45)("iterator"),h=!([].keys&&"next"in[].keys()),v="@@iterator",_="keys",p="values",y=function(){return this};t.exports=function(t,e,n,b,g,m,x){l(n,e,b);var S,E,M,O=function(t){if(!h&&t in j)return j[t];switch(t){case _:return function(){return new n(this,t)};case p:return function(){return new n(this,t)}}return function(){return new n(this,t)}},w=e+" Iterator",P=g==p,k=!1,j=t.prototype,T=j[d]||j[v]||g&&j[g],A=T||O(g),R=g?P?O("entries"):A:void 0,L="Array"==e?j.entries||T:T;if(L&&(M=s(L.call(new t)),M!==Object.prototype&&(f(M,w,!0),r||a(M,d)||u(M,d,y))),P&&T&&T.name!==p&&(k=!0,A=function(){return T.call(this)}),r&&!x||!h&&!k&&j[d]||u(j,d,A),c[e]=A,c[w]=y,g)if(S={values:P?A:O(p),keys:m?A:O(_),entries:R},x)for(E in S)E in j||i(j,E,S[E]);else o(o.P+o.F*(h||k),e,S);return S}},function(t,e){t.exports=!0},function(t,e,n){var r=n(11),o=n(12),i=n(13),u=n(15),a="prototype",c=function(t,e,n){var l,f,s,d=t&c.F,h=t&c.G,v=t&c.S,_=t&c.P,p=t&c.B,y=t&c.W,b=h?o:o[e]||(o[e]={}),g=b[a],m=h?r:v?r[e]:(r[e]||{})[a];h&&(n=e);for(l in n)f=!d&&m&&void 0!==m[l],f&&l in b||(s=f?m[l]:n[l],b[l]=h&&"function"!=typeof m[l]?n[l]:p&&f?i(s,r):y&&m[l]==s?function(t){var e=function(e,n,r){if(this instanceof t){switch(arguments.length){case 0:return new t;case 1:return new t(e);case 2:return new t(e,n)}return new t(e,n,r)}return t.apply(this,arguments)};return e[a]=t[a],e}(s):_&&"function"==typeof s?i(Function.call,s):s,_&&((b.virtual||(b.virtual={}))[l]=s,t&c.R&&g&&!g[l]&&u(g,l,s)))};c.F=1,c.G=2,c.S=4,c.P=8,c.B=16,c.W=32,c.U=64,c.R=128,t.exports=c},function(t,e){var n=t.exports="undefined"!=typeof window&&window.Math==Math?window:"undefined"!=typeof self&&self.Math==Math?self:Function("return this")();"number"==typeof __g&&(__g=n)},function(t,e){var n=t.exports={version:"2.4.0"};"number"==typeof __e&&(__e=n)},function(t,e,n){var r=n(14);t.exports=function(t,e,n){if(r(t),void 0===e)return t;switch(n){case 1:return function(n){return t.call(e,n)};case 2:return function(n,r){return t.call(e,n,r)};case 3:return function(n,r,o){return t.call(e,n,r,o)}}return function(){return t.apply(e,arguments)}}},function(t,e){t.exports=function(t){if("function"!=typeof t)throw TypeError(t+" is not a function!");return t}},function(t,e,n){var r=n(16),o=n(24);t.exports=n(20)?function(t,e,n){return r.f(t,e,o(1,n))}:function(t,e,n){return t[e]=n,t}},function(t,e,n){var r=n(17),o=n(19),i=n(23),u=Object.defineProperty;e.f=n(20)?Object.defineProperty:function(t,e,n){if(r(t),e=i(e,!0),r(n),o)try{return u(t,e,n)}catch(t){}if("get"in n||"set"in n)throw TypeError("Accessors not supported!");return"value"in n&&(t[e]=n.value),t}},function(t,e,n){var r=n(18);t.exports=function(t){if(!r(t))throw TypeError(t+" is not an object!");return t}},function(t,e){t.exports=function(t){return"object"==typeof t?null!==t:"function"==typeof t}},function(t,e,n){t.exports=!n(20)&&!n(21)(function(){return 7!=Object.defineProperty(n(22)("div"),"a",{get:function(){return 7}}).a})},function(t,e,n){t.exports=!n(21)(function(){return 7!=Object.defineProperty({},"a",{get:function(){return 7}}).a})},function(t,e){t.exports=function(t){try{return!!t()}catch(t){return!0}}},function(t,e,n){var r=n(18),o=n(11).document,i=r(o)&&r(o.createElement);t.exports=function(t){return i?o.createElement(t):{}}},function(t,e,n){var r=n(18);t.exports=function(t,e){if(!r(t))return t;var n,o;if(e&&"function"==typeof(n=t.toString)&&!r(o=n.call(t)))return o;if("function"==typeof(n=t.valueOf)&&!r(o=n.call(t)))return o;if(!e&&"function"==typeof(n=t.toString)&&!r(o=n.call(t)))return o;throw TypeError("Can't convert object to primitive value")}},function(t,e){t.exports=function(t,e){return{enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:e}}},function(t,e,n){t.exports=n(15)},function(t,e){var n={}.hasOwnProperty;t.exports=function(t,e){return n.call(t,e)}},function(t,e){t.exports={}},function(t,e,n){"use strict";var r=n(29),o=n(24),i=n(44),u={};n(15)(u,n(45)("iterator"),function(){return this}),t.exports=function(t,e,n){t.prototype=r(u,{next:o(1,n)}),i(t,e+" Iterator")}},function(t,e,n){var r=n(17),o=n(30),i=n(42),u=n(39)("IE_PROTO"),a=function(){},c="prototype",l=function(){var t,e=n(22)("iframe"),r=i.length,o="<",u=">";for(e.style.display="none",n(43).appendChild(e),e.src="javascript:",t=e.contentWindow.document,t.open(),t.write(o+"script"+u+"document.F=Object"+o+"/script"+u),t.close(),l=t.F;r--;)delete l[c][i[r]];return l()};t.exports=Object.create||function(t,e){var n;return null!==t?(a[c]=r(t),n=new a,a[c]=null,n[u]=t):n=l(),void 0===e?n:o(n,e)}},function(t,e,n){var r=n(16),o=n(17),i=n(31);t.exports=n(20)?Object.defineProperties:function(t,e){o(t);for(var n,u=i(e),a=u.length,c=0;a>c;)r.f(t,n=u[c++],e[n]);return t}},function(t,e,n){var r=n(32),o=n(42);t.exports=Object.keys||function(t){return r(t,o)}},function(t,e,n){var r=n(26),o=n(33),i=n(36)(!1),u=n(39)("IE_PROTO");t.exports=function(t,e){var n,a=o(t),c=0,l=[];for(n in a)n!=u&&r(a,n)&&l.push(n);for(;e.length>c;)r(a,n=e[c++])&&(~i(l,n)||l.push(n));return l}},function(t,e,n){var r=n(34),o=n(7);t.exports=function(t){return r(o(t))}},function(t,e,n){var r=n(35);t.exports=Object("z").propertyIsEnumerable(0)?Object:function(t){return"String"==r(t)?t.split(""):Object(t)}},function(t,e){var n={}.toString;t.exports=function(t){return n.call(t).slice(8,-1)}},function(t,e,n){var r=n(33),o=n(37),i=n(38);t.exports=function(t){return function(e,n,u){var a,c=r(e),l=o(c.length),f=i(u,l);if(t&&n!=n){for(;l>f;)if(a=c[f++],a!=a)return!0}else for(;l>f;f++)if((t||f in c)&&c[f]===n)return t||f||0;return!t&&-1}}},function(t,e,n){var r=n(6),o=Math.min;t.exports=function(t){return t>0?o(r(t),9007199254740991):0}},function(t,e,n){var r=n(6),o=Math.max,i=Math.min;t.exports=function(t,e){return t=r(t),t<0?o(t+e,0):i(t,e)}},function(t,e,n){var r=n(40)("keys"),o=n(41);t.exports=function(t){return r[t]||(r[t]=o(t))}},function(t,e,n){var r=n(11),o="__core-js_shared__",i=r[o]||(r[o]={});t.exports=function(t){return i[t]||(i[t]={})}},function(t,e){var n=0,r=Math.random();t.exports=function(t){return"Symbol(".concat(void 0===t?"":t,")_",(++n+r).toString(36))}},function(t,e){t.exports="constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf".split(",")},function(t,e,n){t.exports=n(11).document&&document.documentElement},function(t,e,n){var r=n(16).f,o=n(26),i=n(45)("toStringTag");t.exports=function(t,e,n){t&&!o(t=n?t:t.prototype,i)&&r(t,i,{configurable:!0,value:e})}},function(t,e,n){var r=n(40)("wks"),o=n(41),i=n(11).Symbol,u="function"==typeof i,a=t.exports=function(t){return r[t]||(r[t]=u&&i[t]||(u?i:o)("Symbol."+t))};a.store=r},function(t,e,n){var r=n(26),o=n(47),i=n(39)("IE_PROTO"),u=Object.prototype;t.exports=Object.getPrototypeOf||function(t){return t=o(t),r(t,i)?t[i]:"function"==typeof t.constructor&&t instanceof t.constructor?t.constructor.prototype:t instanceof Object?u:null}},function(t,e,n){var r=n(7);t.exports=function(t){return Object(r(t))}},function(t,e,n){"use strict";var r=n(13),o=n(10),i=n(47),u=n(49),a=n(50),c=n(37),l=n(51),f=n(52);o(o.S+o.F*!n(54)(function(t){Array.from(t)}),"Array",{from:function(t){var e,n,o,s,d=i(t),h="function"==typeof this?this:Array,v=arguments.length,_=v>1?arguments[1]:void 0,p=void 0!==_,y=0,b=f(d);if(p&&(_=r(_,v>2?arguments[2]:void 0,2)),void 0==b||h==Array&&a(b))for(e=c(d.length),n=new h(e);e>y;y++)l(n,y,p?_(d[y],y):d[y]);else for(s=b.call(d),n=new h;!(o=s.next()).done;y++)l(n,y,p?u(s,_,[o.value,y],!0):o.value);return n.length=y,n}})},function(t,e,n){var r=n(17);t.exports=function(t,e,n,o){try{return o?e(r(n)[0],n[1]):e(n)}catch(e){var i=t.return;throw void 0!==i&&r(i.call(t)),e}}},function(t,e,n){var r=n(27),o=n(45)("iterator"),i=Array.prototype;t.exports=function(t){return void 0!==t&&(r.Array===t||i[o]===t)}},function(t,e,n){"use strict";var r=n(16),o=n(24);t.exports=function(t,e,n){e in t?r.f(t,e,o(0,n)):t[e]=n}},function(t,e,n){var r=n(53),o=n(45)("iterator"),i=n(27);t.exports=n(12).getIteratorMethod=function(t){if(void 0!=t)return t[o]||t["@@iterator"]||i[r(t)]}},function(t,e,n){var r=n(35),o=n(45)("toStringTag"),i="Arguments"==r(function(){return arguments}()),u=function(t,e){try{return t[e]}catch(t){}};t.exports=function(t){var e,n,a;return void 0===t?"Undefined":null===t?"Null":"string"==typeof(n=u(e=Object(t),o))?n:i?r(e):"Object"==(a=r(e))&&"function"==typeof e.callee?"Arguments":a}},function(t,e,n){var r=n(45)("iterator"),o=!1;try{var i=[7][r]();i.return=function(){o=!0},Array.from(i,function(){throw 2})}catch(t){}t.exports=function(t,e){if(!e&&!o)return!1;var n=!1;try{var i=[7],u=i[r]();u.next=function(){return{done:n=!0}},i[r]=function(){return u},t(i)}catch(t){}return n}},function(t,e,n){t.exports={default:n(56),__esModule:!0}},function(t,e,n){n(4),n(57),t.exports=n(61).f("iterator")},function(t,e,n){n(58);for(var r=n(11),o=n(15),i=n(27),u=n(45)("toStringTag"),a=["NodeList","DOMTokenList","MediaList","StyleSheetList","CSSRuleList"],c=0;c<5;c++){var l=a[c],f=r[l],s=f&&f.prototype;s&&!s[u]&&o(s,u,l),i[l]=i.Array}},function(t,e,n){"use strict";var r=n(59),o=n(60),i=n(27),u=n(33);t.exports=n(8)(Array,"Array",function(t,e){this._t=u(t),this._i=0,this._k=e},function(){var t=this._t,e=this._k,n=this._i++;return!t||n>=t.length?(this._t=void 0,o(1)):"keys"==e?o(0,n):"values"==e?o(0,t[n]):o(0,[n,t[n]])},"values"),i.Arguments=i.Array,r("keys"),r("values"),r("entries")},function(t,e){t.exports=function(){}},function(t,e){t.exports=function(t,e){return{value:e,done:!!t}}},function(t,e,n){e.f=n(45)},function(t,e,n){t.exports={default:n(63),__esModule:!0}},function(t,e,n){n(64),n(75),n(76),n(77),t.exports=n(12).Symbol},function(t,e,n){"use strict";var r=n(11),o=n(26),i=n(20),u=n(10),a=n(25),c=n(65).KEY,l=n(21),f=n(40),s=n(44),d=n(41),h=n(45),v=n(61),_=n(66),p=n(67),y=n(68),b=n(71),g=n(17),m=n(33),x=n(23),S=n(24),E=n(29),M=n(72),O=n(74),w=n(16),P=n(31),k=O.f,j=w.f,T=M.f,A=r.Symbol,R=r.JSON,L=R&&R.stringify,I="prototype",D=h("_hidden"),C=h("toPrimitive"),N={}.propertyIsEnumerable,F=f("symbol-registry"),H=f("symbols"),z=f("op-symbols"),B=Object[I],G="function"==typeof A,W=r.QObject,V=!W||!W[I]||!W[I].findChild,U=i&&l(function(){return 7!=E(j({},"a",{get:function(){return j(this,"a",{value:7}).a}})).a})?function(t,e,n){var r=k(B,e);r&&delete B[e],j(t,e,n),r&&t!==B&&j(B,e,r)}:j,X=function(t){var e=H[t]=E(A[I]);return e._k=t,e},q=G&&"symbol"==typeof A.iterator?function(t){return"symbol"==typeof t}:function(t){return t instanceof A},K=function(t,e,n){return t===B&&K(z,e,n),g(t),e=x(e,!0),g(n),o(H,e)?(n.enumerable?(o(t,D)&&t[D][e]&&(t[D][e]=!1),n=E(n,{enumerable:S(0,!1)})):(o(t,D)||j(t,D,S(1,{})),t[D][e]=!0),U(t,e,n)):j(t,e,n)},J=function(t,e){g(t);for(var n,r=y(e=m(e)),o=0,i=r.length;i>o;)K(t,n=r[o++],e[n]);return t},Y=function(t,e){return void 0===e?E(t):J(E(t),e)},Q=function(t){var e=N.call(this,t=x(t,!0));return!(this===B&&o(H,t)&&!o(z,t))&&(!(e||!o(this,t)||!o(H,t)||o(this,D)&&this[D][t])||e)},Z=function(t,e){if(t=m(t),e=x(e,!0),t!==B||!o(H,e)||o(z,e)){var n=k(t,e);return!n||!o(H,e)||o(t,D)&&t[D][e]||(n.enumerable=!0),n}},$=function(t){for(var e,n=T(m(t)),r=[],i=0;n.length>i;)o(H,e=n[i++])||e==D||e==c||r.push(e);return r},tt=function(t){for(var e,n=t===B,r=T(n?z:m(t)),i=[],u=0;r.length>u;)!o(H,e=r[u++])||n&&!o(B,e)||i.push(H[e]);return i};G||(A=function(){if(this instanceof A)throw TypeError("Symbol is not a constructor!");var t=d(arguments.length>0?arguments[0]:void 0),e=function(n){this===B&&e.call(z,n),o(this,D)&&o(this[D],t)&&(this[D][t]=!1),U(this,t,S(1,n))};return i&&V&&U(B,t,{configurable:!0,set:e}),X(t)},a(A[I],"toString",function(){return this._k}),O.f=Z,w.f=K,n(73).f=M.f=$,n(70).f=Q,n(69).f=tt,i&&!n(9)&&a(B,"propertyIsEnumerable",Q,!0),v.f=function(t){return X(h(t))}),u(u.G+u.W+u.F*!G,{Symbol:A});for(var et="hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables".split(","),nt=0;et.length>nt;)h(et[nt++]);for(var et=P(h.store),nt=0;et.length>nt;)_(et[nt++]);u(u.S+u.F*!G,"Symbol",{for:function(t){return o(F,t+="")?F[t]:F[t]=A(t)},keyFor:function(t){if(q(t))return p(F,t);throw TypeError(t+" is not a symbol!")},useSetter:function(){V=!0},useSimple:function(){V=!1}}),u(u.S+u.F*!G,"Object",{create:Y,defineProperty:K,defineProperties:J,getOwnPropertyDescriptor:Z,getOwnPropertyNames:$,getOwnPropertySymbols:tt}),R&&u(u.S+u.F*(!G||l(function(){var t=A();return"[null]"!=L([t])||"{}"!=L({a:t})||"{}"!=L(Object(t))})),"JSON",{stringify:function(t){if(void 0!==t&&!q(t)){for(var e,n,r=[t],o=1;arguments.length>o;)r.push(arguments[o++]);return e=r[1],"function"==typeof e&&(n=e),!n&&b(e)||(e=function(t,e){if(n&&(e=n.call(this,t,e)),!q(e))return e}),r[1]=e,L.apply(R,r)}}}),A[I][C]||n(15)(A[I],C,A[I].valueOf),s(A,"Symbol"),s(Math,"Math",!0),s(r.JSON,"JSON",!0)},function(t,e,n){var r=n(41)("meta"),o=n(18),i=n(26),u=n(16).f,a=0,c=Object.isExtensible||function(){return!0},l=!n(21)(function(){return c(Object.preventExtensions({}))}),f=function(t){u(t,r,{value:{i:"O"+ ++a,w:{}}})},s=function(t,e){if(!o(t))return"symbol"==typeof t?t:("string"==typeof t?"S":"P")+t;if(!i(t,r)){if(!c(t))return"F";if(!e)return"E";f(t)}return t[r].i},d=function(t,e){if(!i(t,r)){if(!c(t))return!0;if(!e)return!1;f(t)}return t[r].w},h=function(t){return l&&v.NEED&&c(t)&&!i(t,r)&&f(t),t},v=t.exports={KEY:r,NEED:!1,fastKey:s,getWeak:d,onFreeze:h}},function(t,e,n){var r=n(11),o=n(12),i=n(9),u=n(61),a=n(16).f;t.exports=function(t){var e=o.Symbol||(o.Symbol=i?{}:r.Symbol||{});"_"==t.charAt(0)||t in e||a(e,t,{value:u.f(t)})}},function(t,e,n){var r=n(31),o=n(33);t.exports=function(t,e){for(var n,i=o(t),u=r(i),a=u.length,c=0;a>c;)if(i[n=u[c++]]===e)return n}},function(t,e,n){var r=n(31),o=n(69),i=n(70);t.exports=function(t){var e=r(t),n=o.f;if(n)for(var u,a=n(t),c=i.f,l=0;a.length>l;)c.call(t,u=a[l++])&&e.push(u);return e}},function(t,e){e.f=Object.getOwnPropertySymbols},function(t,e){e.f={}.propertyIsEnumerable},function(t,e,n){var r=n(35);t.exports=Array.isArray||function(t){return"Array"==r(t)}},function(t,e,n){var r=n(33),o=n(73).f,i={}.toString,u="object"==typeof window&&window&&Object.getOwnPropertyNames?Object.getOwnPropertyNames(window):[],a=function(t){try{return o(t)}catch(t){return u.slice()}};t.exports.f=function(t){return u&&"[object Window]"==i.call(t)?a(t):o(r(t))}},function(t,e,n){var r=n(32),o=n(42).concat("length","prototype");e.f=Object.getOwnPropertyNames||function(t){return r(t,o)}},function(t,e,n){var r=n(70),o=n(24),i=n(33),u=n(23),a=n(26),c=n(19),l=Object.getOwnPropertyDescriptor;e.f=n(20)?l:function(t,e){if(t=i(t),e=u(e,!0),c)try{return l(t,e)}catch(t){}if(a(t,e))return o(!r.f.call(t,e),t[e])}},function(t,e){},function(t,e,n){n(66)("asyncIterator")},function(t,e,n){n(66)("observable")},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}var i=n(79),u=r(i),a=n(82),c=r(a),l=n(86),f=r(l);Object.defineProperty(e,"__esModule",{value:!0}),e.SmoothScrollbar=void 0;var s=function(){function t(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),(0,f.default)(t,r.key,r)}}return function(e,n,r){return n&&t(e.prototype,n),r&&t(e,r),e}}(),d=n(89),h=n(112);e.SmoothScrollbar=function(){function t(e){var n=this,r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};o(this,t),e.setAttribute("tabindex","1");var i=(0,h.findChild)(e,"scroll-content"),a=(0,h.findChild)(e,"overscroll-glow"),l=(0,h.findChild)(e,"scrollbar-track-x"),f=(0,h.findChild)(e,"scrollbar-track-y");(0,h.setStyle)(e,{overflow:"hidden",outline:"none"}),(0,h.setStyle)(a,{display:"none","pointer-events":"none"}),this.__readonly("targets",(0,c.default)({container:e,content:i,canvas:{elem:a,context:a.getContext("2d")},xAxis:(0,c.default)({track:l,thumb:(0,h.findChild)(l,"scrollbar-thumb-x")}),yAxis:(0,c.default)({track:f,thumb:(0,h.findChild)(f,"scrollbar-thumb-y")})})).__readonly("offset",{x:0,y:0}).__readonly("thumbOffset",{x:0,y:0}).__readonly("limit",{x:1/0,y:1/0}).__readonly("movement",{x:0,y:0}).__readonly("movementLocked",{x:!1,y:!1}).__readonly("overscrollRendered",{x:0,y:0}).__readonly("overscrollBack",!1).__readonly("thumbSize",{x:0,y:0,realX:0,realY:0}).__readonly("bounding",{top:0,right:0,bottom:0,left:0}).__readonly("children",[]).__readonly("parents",[]).__readonly("size",this.getSize()).__readonly("isNestedScrollbar",!1),(0,u.default)(this,{__hideTrackThrottle:{value:(0,h.debounce)(this.hideTrack.bind(this),1e3,!1)},__updateThrottle:{value:(0,h.debounce)(this.update.bind(this))},__touchRecord:{value:new h.TouchRecord},__listeners:{value:[]},__handlers:{value:[]},__children:{value:[]},__timerID:{value:{}}}),this.__initOptions(r),this.__initScrollbar();var s=e.scrollLeft,v=e.scrollTop;if(e.scrollLeft=e.scrollTop=0,this.setPosition(s,v,!0),d.sbList.set(e,this),"function"==typeof d.GLOBAL_ENV.MutationObserver){var _=new d.GLOBAL_ENV.MutationObserver(function(){n.update(!0)});_.observe(i,{childList:!0}),Object.defineProperty(this,"__observer",{value:_})}}return s(t,[{key:"MAX_OVERSCROLL",get:function(){var t=this.options,e=this.size;switch(t.overscrollEffect){case"bounce":var n=Math.floor(Math.sqrt(Math.pow(e.container.width,2)+Math.pow(e.container.height,2))),r=this.__isMovementLocked()?2:10;return d.GLOBAL_ENV.TOUCH_SUPPORTED?(0,h.pickInRange)(n/r,100,1e3):(0,h.pickInRange)(n/10,25,50);case"glow":return 150;default:return 0}}},{key:"scrollTop",get:function(){return this.offset.y}},{key:"scrollLeft",get:function(){return this.offset.x}}]),t}()},function(t,e,n){t.exports={default:n(80),__esModule:!0}},function(t,e,n){n(81);var r=n(12).Object;t.exports=function(t,e){return r.defineProperties(t,e)}},function(t,e,n){var r=n(10);r(r.S+r.F*!n(20),"Object",{defineProperties:n(30)})},function(t,e,n){t.exports={default:n(83),__esModule:!0}},function(t,e,n){n(84),t.exports=n(12).Object.freeze},function(t,e,n){var r=n(18),o=n(65).onFreeze;n(85)("freeze",function(t){return function(e){return t&&r(e)?t(o(e)):e}})},function(t,e,n){var r=n(10),o=n(12),i=n(21);t.exports=function(t,e){var n=(o.Object||{})[t]||Object[t],u={};u[t]=e(n),r(r.S+r.F*i(function(){n(1)}),"Object",u)}},function(t,e,n){t.exports={default:n(87),__esModule:!0}},function(t,e,n){n(88);var r=n(12).Object;t.exports=function(t,e,n){return r.defineProperty(t,e,n)}},function(t,e,n){var r=n(10);r(r.S+r.F*!n(20),"Object",{defineProperty:n(16).f})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(86),i=r(o),u=n(90),a=r(u);Object.defineProperty(e,"__esModule",{value:!0});var c=n(93);(0,a.default)(c).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return c[t]}})})},function(t,e,n){t.exports={default:n(91),__esModule:!0}},function(t,e,n){n(92),t.exports=n(12).Object.keys},function(t,e,n){var r=n(47),o=n(31);n(85)("keys",function(){return function(t){return o(r(t))}})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(86),i=r(o),u=n(90),a=r(u);Object.defineProperty(e,"__esModule",{value:!0});var c=n(94);(0,a.default)(c).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return c[t]}})});var l=n(95);(0,a.default)(l).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return l[t]}})});var f=n(111);(0,a.default)(f).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return f[t]}})})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(86),i=r(o),u=n(90),a=r(u);Object.defineProperty(e,"__esModule",{value:!0});var c=function(t){var e={},n={};return(0,a.default)(t).forEach(function(r){(0,i.default)(e,r,{get:function(){if(!n.hasOwnProperty(r)){var e=t[r];n[r]=e()}return n[r]}})}),e},l={MutationObserver:function(){return window.MutationObserver||window.WebKitMutationObserver||window.MozMutationObserver},TOUCH_SUPPORTED:function(){return"ontouchstart"in document},EASING_MULTIPLIER:function(){return navigator.userAgent.match(/Android/)?.5:.25},WHEEL_EVENT:function(){return"onwheel"in window?"wheel":"mousewheel"}};e.GLOBAL_ENV=c(l)},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(96),i=r(o);Object.defineProperty(e,"__esModule",{value:!0});var u=new i.default,a=u.set.bind(u),c=u.delete.bind(u);u.update=function(){u.forEach(function(t){t.__updateTree()})},u.delete=function(){var t=c.apply(void 0,arguments);return u.update(),t},u.set=function(){var t=a.apply(void 0,arguments);return u.update(),t},e.sbList=u},function(t,e,n){t.exports={default:n(97),__esModule:!0}},function(t,e,n){n(75),n(4),n(57),n(98),n(108),t.exports=n(12).Map},function(t,e,n){"use strict";var r=n(99);t.exports=n(104)("Map",function(t){return function(){return t(this,arguments.length>0?arguments[0]:void 0)}},{get:function(t){var e=r.getEntry(this,t);return e&&e.v},set:function(t,e){return r.def(this,0===t?0:t,e)}},r,!0)},function(t,e,n){"use strict";var r=n(16).f,o=n(29),i=n(100),u=n(13),a=n(101),c=n(7),l=n(102),f=n(8),s=n(60),d=n(103),h=n(20),v=n(65).fastKey,_=h?"_s":"size",p=function(t,e){var n,r=v(e);if("F"!==r)return t._i[r];for(n=t._f;n;n=n.n)if(n.k==e)return n};t.exports={getConstructor:function(t,e,n,f){var s=t(function(t,r){a(t,s,e,"_i"),t._i=o(null),t._f=void 0,t._l=void 0,t[_]=0,void 0!=r&&l(r,n,t[f],t)});return i(s.prototype,{clear:function(){for(var t=this,e=t._i,n=t._f;n;n=n.n)n.r=!0,n.p&&(n.p=n.p.n=void 0),delete e[n.i];t._f=t._l=void 0,t[_]=0},delete:function(t){var e=this,n=p(e,t);if(n){var r=n.n,o=n.p;delete e._i[n.i],n.r=!0,o&&(o.n=r),r&&(r.p=o),e._f==n&&(e._f=r),e._l==n&&(e._l=o),e[_]--}return!!n},forEach:function(t){a(this,s,"forEach");for(var e,n=u(t,arguments.length>1?arguments[1]:void 0,3);e=e?e.n:this._f;)for(n(e.v,e.k,this);e&&e.r;)e=e.p},has:function(t){return!!p(this,t)}}),h&&r(s.prototype,"size",{get:function(){return c(this[_])}}),s},def:function(t,e,n){var r,o,i=p(t,e);return i?i.v=n:(t._l=i={i:o=v(e,!0),k:e,v:n,p:r=t._l,n:void 0,r:!1},t._f||(t._f=i),r&&(r.n=i),t[_]++,"F"!==o&&(t._i[o]=i)),t},getEntry:p,setStrong:function(t,e,n){f(t,e,function(t,e){this._t=t,this._k=e,this._l=void 0},function(){for(var t=this,e=t._k,n=t._l;n&&n.r;)n=n.p;return t._t&&(t._l=n=n?n.n:t._t._f)?"keys"==e?s(0,n.k):"values"==e?s(0,n.v):s(0,[n.k,n.v]):(t._t=void 0,s(1))},n?"entries":"values",!n,!0),d(e)}}},function(t,e,n){var r=n(15);t.exports=function(t,e,n){for(var o in e)n&&t[o]?t[o]=e[o]:r(t,o,e[o]);return t}},function(t,e){t.exports=function(t,e,n,r){if(!(t instanceof e)||void 0!==r&&r in t)throw TypeError(n+": incorrect invocation!");return t}},function(t,e,n){var r=n(13),o=n(49),i=n(50),u=n(17),a=n(37),c=n(52),l={},f={},e=t.exports=function(t,e,n,s,d){var h,v,_,p,y=d?function(){return t}:c(t),b=r(n,s,e?2:1),g=0;if("function"!=typeof y)throw TypeError(t+" is not iterable!");if(i(y)){for(h=a(t.length);h>g;g++)if(p=e?b(u(v=t[g])[0],v[1]):b(t[g]),p===l||p===f)return p}else for(_=y.call(t);!(v=_.next()).done;)if(p=o(_,b,v.value,e),p===l||p===f)return p};e.BREAK=l,e.RETURN=f},function(t,e,n){"use strict";var r=n(11),o=n(12),i=n(16),u=n(20),a=n(45)("species");t.exports=function(t){var e="function"==typeof o[t]?o[t]:r[t];u&&e&&!e[a]&&i.f(e,a,{configurable:!0,get:function(){return this}})}},function(t,e,n){"use strict";var r=n(11),o=n(10),i=n(65),u=n(21),a=n(15),c=n(100),l=n(102),f=n(101),s=n(18),d=n(44),h=n(16).f,v=n(105)(0),_=n(20);t.exports=function(t,e,n,p,y,b){var g=r[t],m=g,x=y?"set":"add",S=m&&m.prototype,E={};return _&&"function"==typeof m&&(b||S.forEach&&!u(function(){(new m).entries().next()}))?(m=e(function(e,n){f(e,m,t,"_c"),e._c=new g,void 0!=n&&l(n,y,e[x],e)}),v("add,clear,delete,forEach,get,has,set,keys,values,entries,toJSON".split(","),function(t){var e="add"==t||"set"==t;t in S&&(!b||"clear"!=t)&&a(m.prototype,t,function(n,r){if(f(this,m,t),!e&&b&&!s(n))return"get"==t&&void 0;var o=this._c[t](0===n?0:n,r);return e?this:o})}),"size"in S&&h(m.prototype,"size",{get:function(){return this._c.size}})):(m=p.getConstructor(e,t,y,x),c(m.prototype,n),i.NEED=!0),d(m,t),E[t]=m,o(o.G+o.W+o.F,E),b||p.setStrong(m,t,y),m}},function(t,e,n){var r=n(13),o=n(34),i=n(47),u=n(37),a=n(106);t.exports=function(t,e){var n=1==t,c=2==t,l=3==t,f=4==t,s=6==t,d=5==t||s,h=e||a;return function(e,a,v){for(var _,p,y=i(e),b=o(y),g=r(a,v,3),m=u(b.length),x=0,S=n?h(e,m):c?h(e,0):void 0;m>x;x++)if((d||x in b)&&(_=b[x],p=g(_,x,y),t))if(n)S[x]=p;else if(p)switch(t){case 3:return!0;case 5:return _;case 6:return x;case 2:S.push(_)}else if(f)return!1;return s?-1:l||f?f:S}}},function(t,e,n){var r=n(107);t.exports=function(t,e){return new(r(t))(e)}},function(t,e,n){var r=n(18),o=n(71),i=n(45)("species");t.exports=function(t){var e;return o(t)&&(e=t.constructor,"function"!=typeof e||e!==Array&&!o(e.prototype)||(e=void 0),r(e)&&(e=e[i],null===e&&(e=void 0))),void 0===e?Array:e}},function(t,e,n){var r=n(10);r(r.P+r.R,"Map",{toJSON:n(109)("Map")})},function(t,e,n){var r=n(53),o=n(110);t.exports=function(t){return function(){if(r(this)!=t)throw TypeError(t+"#toJSON isn't generic");return o(this)}}},function(t,e,n){var r=n(102);t.exports=function(t,e){var n=[];return r(t,!1,n.push,n,e),n}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0});e.selectors="scrollbar, [scrollbar], [data-scrollbar]"},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(86),i=r(o),u=n(90),a=r(u);Object.defineProperty(e,"__esModule",{value:!0});var c=n(113);(0,a.default)(c).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return c[t]}})})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(86),i=r(o),u=n(90),a=r(u);Object.defineProperty(e,"__esModule",{value:!0});var c=n(114);(0,a.default)(c).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return c[t]}})});var l=n(115);(0,a.default)(l).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return l[t]}})});var f=n(116);(0,a.default)(f).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return f[t]}})});var s=n(117);(0,a.default)(s).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return s[t]}})});var d=n(118);(0,a.default)(d).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return d[t]}})});var h=n(119);(0,a.default)(h).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return h[t]}})});var v=n(120);(0,a.default)(v).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return v[t]}})});var _=n(121);(0,a.default)(_).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return _[t]}})});var p=n(122);(0,a.default)(p).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return p[t]}})});var y=n(123);(0,a.default)(y).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return y[t]}})});var b=n(124);(0,a.default)(b).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return b[t]}})})},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0});e.buildCurve=function(t,e){if(e<=0)return[t];for(var n=[],r=Math.round(e/1e3*60)-1,o=t?Math.pow(1/Math.abs(t),1/r):0,i=1;i<=r;i++)n.push(t-t*Math.pow(o,i));return n.push(t),n}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var n=100;e.debounce=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:n,r=!(arguments.length>2&&void 0!==arguments[2])||arguments[2];if("function"==typeof t){var o=void 0;return function(){for(var n=arguments.length,i=Array(n),u=0;u<n;u++)i[u]=arguments[u];!o&&r&&setTimeout(function(){return t.apply(void 0,i)}),clearTimeout(o),o=setTimeout(function(){o=void 0,t.apply(void 0,i)},e)}}}},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(t){if(Array.isArray(t)){for(var e=0,n=Array(t.length);e<t.length;e++)n[e]=t[e];return n}return(0,u.default)(t)}var i=n(2),u=r(i);Object.defineProperty(e,"__esModule",{value:!0
    });e.findChild=function(t,e){var n=t.children,r=null;return n&&[].concat(o(n)).some(function(t){if(t.className.match(e))return r=t,!0}),r}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var n={STANDARD:1,OTHERS:-3},r=[1,28,500],o=function(t){return r[t]||r[0]};e.getDelta=function(t){if("deltaX"in t){var e=o(t.deltaMode);return{x:t.deltaX/n.STANDARD*e,y:t.deltaY/n.STANDARD*e}}return"wheelDeltaX"in t?{x:t.wheelDeltaX/n.OTHERS,y:t.wheelDeltaY/n.OTHERS}:{x:0,y:t.wheelDelta/n.OTHERS}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0});e.getPointerData=function(t){return t.touches?t.touches[t.touches.length-1]:t}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.getPosition=void 0;var r=n(118);e.getPosition=function(t){var e=(0,r.getPointerData)(t);return{x:e.clientX,y:e.clientY}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.getTouchID=void 0;var r=n(118);e.getTouchID=function(t){var e=(0,r.getPointerData)(t);return e.identifier}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0});e.isOneOf=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[];return e.some(function(e){return t===e})}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0});e.pickInRange=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:-(1/0),n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:1/0;return Math.max(e,Math.min(t,n))}},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(90),i=r(o);Object.defineProperty(e,"__esModule",{value:!0});var u=["webkit","moz","ms","o"],a=new RegExp("^-(?!(?:"+u.join("|")+")-)"),c=function(t){var e={};return(0,i.default)(t).forEach(function(n){if(!a.test(n))return void(e[n]=t[n]);var r=t[n];n=n.replace(/^-/,""),e[n]=r,u.forEach(function(t){e["-"+t+"-"+n]=r})}),e};e.setStyle=function(t,e){e=c(e),(0,i.default)(e).forEach(function(n){var r=n.replace(/^-/,"").replace(/-([a-z])/g,function(t,e){return e.toUpperCase()});t.style[r]=e[n]})}},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(t){if(Array.isArray(t)){for(var e=0,n=Array(t.length);e<t.length;e++)n[e]=t[e];return n}return(0,a.default)(t)}function i(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}var u=n(2),a=r(u),c=n(86),l=r(c),f=n(125),s=r(f);Object.defineProperty(e,"__esModule",{value:!0}),e.TouchRecord=void 0;var d=s.default||function(t){for(var e=1;e<arguments.length;e++){var n=arguments[e];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(t[r]=n[r])}return t},h=function(){function t(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),(0,l.default)(t,r.key,r)}}return function(e,n,r){return n&&t(e.prototype,n),r&&t(e,r),e}}(),v=n(119),_=function(){function t(e){i(this,t),this.updateTime=Date.now(),this.delta={x:0,y:0},this.velocity={x:0,y:0},this.lastPosition=(0,v.getPosition)(e)}return h(t,[{key:"update",value:function(t){var e=this.velocity,n=this.updateTime,r=this.lastPosition,o=Date.now(),i=(0,v.getPosition)(t),u={x:-(i.x-r.x),y:-(i.y-r.y)},a=o-n||16,c=u.x/a*1e3,l=u.y/a*1e3;e.x=.8*c+.2*e.x,e.y=.8*l+.2*e.y,this.delta=u,this.updateTime=o,this.lastPosition=i}}]),t}();e.TouchRecord=function(){function t(){i(this,t),this.touchList={},this.lastTouch=null,this.activeTouchID=void 0}return h(t,[{key:"__add",value:function(t){if(this.__has(t))return null;var e=new _(t);return this.touchList[t.identifier]=e,e}},{key:"__renew",value:function(t){if(!this.__has(t))return null;var e=this.touchList[t.identifier];return e.update(t),e}},{key:"__delete",value:function(t){return delete this.touchList[t.identifier]}},{key:"__has",value:function(t){return this.touchList.hasOwnProperty(t.identifier)}},{key:"__setActiveID",value:function(t){this.activeTouchID=t[t.length-1].identifier,this.lastTouch=this.touchList[this.activeTouchID]}},{key:"__getActiveTracker",value:function(){var t=this.touchList,e=this.activeTouchID;return t[e]}},{key:"isActive",value:function(){return void 0!==this.activeTouchID}},{key:"getDelta",value:function(){var t=this.__getActiveTracker();return t?d({},t.delta):this.__primitiveValue}},{key:"getVelocity",value:function(){var t=this.__getActiveTracker();return t?d({},t.velocity):this.__primitiveValue}},{key:"getLastPosition",value:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",e=this.__getActiveTracker()||this.lastTouch,n=e?e.lastPosition:this.__primitiveValue;return t?n.hasOwnProperty(t)?n[t]:0:d({},n)}},{key:"updatedRecently",value:function(){var t=this.__getActiveTracker();return t&&Date.now()-t.updateTime<30}},{key:"track",value:function(t){var e=this,n=t.targetTouches;return[].concat(o(n)).forEach(function(t){e.__add(t)}),this.touchList}},{key:"update",value:function(t){var e=this,n=t.touches,r=t.changedTouches;return[].concat(o(n)).forEach(function(t){e.__renew(t)}),this.__setActiveID(r),this.touchList}},{key:"release",value:function(t){var e=this;return this.activeTouchID=void 0,[].concat(o(t.changedTouches)).forEach(function(t){e.__delete(t)}),this.touchList}},{key:"__primitiveValue",get:function(){return{x:0,y:0}}}]),t}()},function(t,e,n){t.exports={default:n(126),__esModule:!0}},function(t,e,n){n(127),t.exports=n(12).Object.assign},function(t,e,n){var r=n(10);r(r.S+r.F,"Object",{assign:n(128)})},function(t,e,n){"use strict";var r=n(31),o=n(69),i=n(70),u=n(47),a=n(34),c=Object.assign;t.exports=!c||n(21)(function(){var t={},e={},n=Symbol(),r="abcdefghijklmnopqrst";return t[n]=7,r.split("").forEach(function(t){e[t]=t}),7!=c({},t)[n]||Object.keys(c({},e)).join("")!=r})?function(t,e){for(var n=u(t),c=arguments.length,l=1,f=o.f,s=i.f;c>l;)for(var d,h=a(arguments[l++]),v=f?r(h).concat(f(h)):r(h),_=v.length,p=0;_>p;)s.call(h,d=v[p++])&&(n[d]=h[d]);return n}:c},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(86),i=r(o),u=n(90),a=r(u);Object.defineProperty(e,"__esModule",{value:!0});var c=n(130);(0,a.default)(c).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return c[t]}})})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(86),i=r(o),u=n(90),a=r(u);Object.defineProperty(e,"__esModule",{value:!0});var c=n(131);(0,a.default)(c).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return c[t]}})});var l=n(132);(0,a.default)(l).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return l[t]}})});var f=n(133);(0,a.default)(f).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return f[t]}})});var s=n(134);(0,a.default)(s).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return s[t]}})});var d=n(135);(0,a.default)(d).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return d[t]}})});var h=n(136);(0,a.default)(h).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return h[t]}})});var v=n(137);(0,a.default)(v).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return v[t]}})});var _=n(138);(0,a.default)(_).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return _[t]}})});var p=n(139);(0,a.default)(p).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return p[t]}})});var y=n(140);(0,a.default)(y).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return y[t]}})});var b=n(141);(0,a.default)(b).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return b[t]}})});var g=n(142);(0,a.default)(g).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return g[t]}})});var m=n(143);(0,a.default)(m).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return m[t]}})});var x=n(144);(0,a.default)(x).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return x[t]}})})},function(t,e,n){"use strict";var r=n(78);r.SmoothScrollbar.prototype.clearMovement=r.SmoothScrollbar.prototype.stop=function(){this.movement.x=this.movement.y=0,cancelAnimationFrame(this.__timerID.scrollTo)}},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(t){if(Array.isArray(t)){for(var e=0,n=Array(t.length);e<t.length;e++)n[e]=t[e];return n}return(0,u.default)(t)}var i=n(2),u=r(i),a=n(78),c=n(112),l=n(89);a.SmoothScrollbar.prototype.destroy=function(t){var e=this.__listeners,n=this.__handlers,r=this.__observer,i=this.targets,u=i.container,a=i.content;if(n.forEach(function(t){var e=t.evt,n=t.elem,r=t.fn;n.removeEventListener(e,r)}),n.length=e.length=0,this.stop(),cancelAnimationFrame(this.__timerID.render),r&&r.disconnect(),l.sbList.delete(u),!t&&u.parentNode){for(var f=[].concat(o(a.childNodes));u.firstChild;)u.removeChild(u.firstChild);f.forEach(function(t){return u.appendChild(t)}),(0,c.setStyle)(u,{overflow:""}),u.scrollTop=this.scrollTop,u.scrollLeft=this.scrollLeft}}},function(t,e,n){"use strict";var r=n(78);r.SmoothScrollbar.prototype.getContentElem=function(){return this.targets.content}},function(t,e,n){"use strict";var r=n(78);r.SmoothScrollbar.prototype.getSize=function(){var t=this.targets.container,e=this.targets.content;return{container:{width:t.clientWidth,height:t.clientHeight},content:{width:e.offsetWidth-e.clientWidth+e.scrollWidth,height:e.offsetHeight-e.clientHeight+e.scrollHeight}}}},function(t,e,n){"use strict";var r=n(78);r.SmoothScrollbar.prototype.infiniteScroll=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:50;if("function"==typeof t){var n={x:0,y:0},r=!1;this.addListener(function(o){var i=o.offset,u=o.limit;u.y-i.y<=e&&i.y>n.y&&!r&&(r=!0,setTimeout(function(){return t(o)})),u.y-i.y>e&&(r=!1),n=i})}}},function(t,e,n){"use strict";var r=n(78);r.SmoothScrollbar.prototype.isVisible=function(t){var e=this.bounding,n=t.getBoundingClientRect(),r=Math.max(e.top,n.top),o=Math.max(e.left,n.left),i=Math.min(e.right,n.right),u=Math.min(e.bottom,n.bottom);return r<u&&o<i}},function(t,e,n){"use strict";var r=n(78);r.SmoothScrollbar.prototype.addListener=function(t){"function"==typeof t&&this.__listeners.push(t)},r.SmoothScrollbar.prototype.removeListener=function(t){"function"==typeof t&&this.__listeners.some(function(e,n,r){return e===t&&r.splice(n,1)})}},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(t,e,n){return e in t?(0,l.default)(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function i(t,e){return!!e.length&&e.some(function(e){return t.match(e)})}function u(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:s.REGIESTER,e=d[t];return function(){for(var n=arguments.length,r=Array(n),o=0;o<n;o++)r[o]=arguments[o];this.__handlers.forEach(function(n){var o=n.elem,u=n.evt,a=n.fn,c=n.hasRegistered;c&&t===s.REGIESTER||!c&&t===s.UNREGIESTER||i(u,r)&&(o[e](u,a),n.hasRegistered=!c)})}}var a,c=n(86),l=r(c),f=n(78),s={REGIESTER:0,UNREGIESTER:1},d=(a={},o(a,s.REGIESTER,"addEventListener"),o(a,s.UNREGIESTER,"removeEventListener"),a);f.SmoothScrollbar.prototype.registerEvents=u(s.REGIESTER),f.SmoothScrollbar.prototype.unregisterEvents=u(s.UNREGIESTER)},function(t,e,n){"use strict";var r=n(78);r.SmoothScrollbar.prototype.scrollIntoView=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=e.alignToTop,r=void 0===n||n,o=e.onlyScrollIfNeeded,i=void 0!==o&&o,u=e.offsetTop,a=void 0===u?0:u,c=e.offsetLeft,l=void 0===c?0:c,f=e.offsetBottom,s=void 0===f?0:f,d=this.targets,h=this.bounding;if(t&&d.container.contains(t)){var v=t.getBoundingClientRect();i&&this.isVisible(t)||this.__setMovement(v.left-h.left-l,r?v.top-h.top-a:v.bottom-h.bottom-s)}}},function(t,e,n){"use strict";var r=n(112),o=n(78);o.SmoothScrollbar.prototype.scrollTo=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.offset.x,e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.offset.y,n=this,o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0,i=arguments.length>3&&void 0!==arguments[3]?arguments[3]:null,u=this.options,a=this.offset,c=this.limit,l=this.__timerID;cancelAnimationFrame(l.scrollTo),i="function"==typeof i?i:function(){},u.renderByPixels&&(t=Math.round(t),e=Math.round(e));var f=a.x,s=a.y,d=(0,r.pickInRange)(t,0,c.x)-f,h=(0,r.pickInRange)(e,0,c.y)-s,v=(0,r.buildCurve)(d,o),_=(0,r.buildCurve)(h,o),p=v.length,y=0,b=function t(){n.setPosition(f+v[y],s+_[y]),y++,y===p?requestAnimationFrame(function(){i(n)}):l.scrollTo=requestAnimationFrame(t)};b()}},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(90),i=r(o),u=n(78);u.SmoothScrollbar.prototype.setOptions=function(){var t=this,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};(0,i.default)(e).forEach(function(n){t.options.hasOwnProperty(n)&&void 0!==e[n]&&(t.options[n]=e[n])})}},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(125),i=r(o),u=i.default||function(t){for(var e=1;e<arguments.length;e++){var n=arguments[e];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(t[r]=n[r])}return t},a=n(112),c=n(78);c.SmoothScrollbar.prototype.setPosition=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.offset.x,e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:this.offset.y,n=arguments.length>2&&void 0!==arguments[2]&&arguments[2];this.__hideTrackThrottle();var r={},o=this.options,i=this.offset,c=this.limit,l=this.targets,f=this.__listeners;o.renderByPixels&&(t=Math.round(t),e=Math.round(e)),t!==i.x&&this.showTrack("x"),e!==i.y&&this.showTrack("y"),t=(0,a.pickInRange)(t,0,c.x),e=(0,a.pickInRange)(e,0,c.y),t===i.x&&e===i.y||(r.direction={x:t===i.x?"none":t>i.x?"right":"left",y:e===i.y?"none":e>i.y?"down":"up"},this.__readonly("offset",{x:t,y:e}),r.limit=u({},c),r.offset=u({},this.offset),this.__setThumbPosition(),(0,a.setStyle)(l.content,{"-transform":"translate3d("+-t+"px, "+-e+"px, 0)"}),n||f.forEach(function(t){o.syncCallbacks?t(r):requestAnimationFrame(function(){t(r)})}))}},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(t,e,n){return e in t?(0,c.default)(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function i(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:f.SHOW,e=d[t];return function(){var n=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"both",r=this.options,o=this.movement,i=this.targets,u=i.container,a=i.xAxis,c=i.yAxis;o.x||o.y?u.classList.add(s.CONTAINER):u.classList.remove(s.CONTAINER),r.alwaysShowTracks&&t===f.HIDE||(n=n.toLowerCase(),"both"===n&&(a.track.classList[e](s.TRACK),c.track.classList[e](s.TRACK)),"x"===n&&a.track.classList[e](s.TRACK),"y"===n&&c.track.classList[e](s.TRACK))}}var u,a=n(86),c=r(a),l=n(78),f={SHOW:0,HIDE:1},s={TRACK:"show",CONTAINER:"scrolling"},d=(u={},o(u,f.SHOW,"add"),o(u,f.HIDE,"remove"),u);l.SmoothScrollbar.prototype.showTrack=i(f.SHOW),l.SmoothScrollbar.prototype.hideTrack=i(f.HIDE)},function(t,e,n){"use strict";function r(){if("glow"===this.options.overscrollEffect){var t=this.targets,e=this.size,n=t.canvas,r=n.elem,o=n.context,i=window.devicePixelRatio||1,u=e.container.width*i,a=e.container.height*i;u===r.width&&a===r.height||(r.width=u,r.height=a,o.scale(i,i))}}function o(){var t=this.size,e=this.thumbSize,n=this.targets,r=n.xAxis,o=n.yAxis;(0,u.setStyle)(r.track,{display:t.content.width<=t.container.width?"none":"block"}),(0,u.setStyle)(o.track,{display:t.content.height<=t.container.height?"none":"block"}),(0,u.setStyle)(r.thumb,{width:e.x+"px"}),(0,u.setStyle)(o.thumb,{height:e.y+"px"})}function i(){var t=this.options;this.__updateBounding();var e=this.getSize(),n={x:Math.max(e.content.width-e.container.width,0),y:Math.max(e.content.height-e.container.height,0)},i={realX:e.container.width/e.content.width*e.container.width,realY:e.container.height/e.content.height*e.container.height};i.x=Math.max(i.realX,t.thumbMinSize),i.y=Math.max(i.realY,t.thumbMinSize),this.__readonly("size",e).__readonly("limit",n).__readonly("thumbSize",i),o.call(this),r.call(this),this.setPosition(),this.__setThumbPosition()}var u=n(112),a=n(78);a.SmoothScrollbar.prototype.update=function(t){t?requestAnimationFrame(i.bind(this)):i.call(this)}},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(86),i=r(o),u=n(90),a=r(u);Object.defineProperty(e,"__esModule",{value:!0});var c=n(146);(0,a.default)(c).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return c[t]}})})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(86),i=r(o),u=n(90),a=r(u);Object.defineProperty(e,"__esModule",{value:!0});var c=n(147);(0,a.default)(c).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return c[t]}})});var l=n(148);(0,a.default)(l).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return l[t]}})});var f=n(149);(0,a.default)(f).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return f[t]}})});var s=n(154);(0,a.default)(s).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return s[t]}})});var d=n(155);(0,a.default)(d).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return d[t]}})});var h=n(156);(0,a.default)(h).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return h[t]}})});var v=n(157);(0,a.default)(v).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return v[t]}})})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(t){if(Array.isArray(t)){for(var e=0,n=Array(t.length);e<t.length;e++)n[e]=t[e];return n}return(0,a.default)(t)}function i(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0,e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,n=arguments.length>2&&void 0!==arguments[2]&&arguments[2],r=this.limit,i=this.options,u=this.movement;this.__updateThrottle(),i.renderByPixels&&(t=Math.round(t),e=Math.round(e));var a=u.x+t,l=u.y+e;0===r.x&&(a=0),0===r.y&&(l=0);var f=this.__getDeltaLimit(n);u.x=c.pickInRange.apply(void 0,[a].concat(o(f.x))),u.y=c.pickInRange.apply(void 0,[l].concat(o(f.y)))}var u=n(2),a=r(u),c=n(112),l=n(78);Object.defineProperty(l.SmoothScrollbar.prototype,"__addMovement",{value:i,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(){var t=this,e=this.movement,n=this.movementLocked;a.forEach(function(r){n[r]=e[r]&&t.__willOverscroll(r,e[r])})}function o(){var t=this.movementLocked;a.forEach(function(e){t[e]=!1})}function i(){var t=this.movementLocked;return t.x||t.y}var u=n(78),a=["x","y"];Object.defineProperty(u.SmoothScrollbar.prototype,"__autoLockMovement",{value:r,writable:!0,configurable:!0}),Object.defineProperty(u.SmoothScrollbar.prototype,"__unlockMovement",{value:o,writable:!0,configurable:!0}),Object.defineProperty(u.SmoothScrollbar.prototype,"__isMovementLocked",{value:i,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";if(t){var e=this.options,n=this.movement,r=this.overscrollRendered,o=this.MAX_OVERSCROLL,i=n[t]=(0,h.pickInRange)(n[t],-o,o),u=e.overscrollDamping,a=r[t]+(i-r[t])*u;e.renderByPixels&&(a|=0),!this.__isMovementLocked()&&Math.abs(a-r[t])<.1&&(a-=i/Math.abs(i||1)),Math.abs(a)<Math.abs(r[t])&&this.__readonly("overscrollBack",!0),(a*r[t]<0||Math.abs(a)<=1)&&(a=0,this.__readonly("overscrollBack",!1)),r[t]=a}}function i(t){var e=this.__touchRecord,n=this.overscrollRendered;return n.x!==t.x||n.y!==t.y||!(!d.GLOBAL_ENV.TOUCH_SUPPORTED||!e.updatedRecently())}function u(){var t=this,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[];if(e.length&&this.options.overscrollEffect){var n=this.options,r=this.overscrollRendered,u=l({},r);if(e.forEach(function(e){return o.call(t,e)}),i.call(this,u))switch(n.overscrollEffect){case"bounce":return s.overscrollBounce.call(this,r.x,r.y);case"glow":return s.overscrollGlow.call(this,r.x,r.y);default:return}}}var a=n(125),c=r(a),l=c.default||function(t){for(var e=1;e<arguments.length;e++){var n=arguments[e];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(t[r]=n[r])}return t},f=n(78),s=n(150),d=n(89),h=n(112);Object.defineProperty(f.SmoothScrollbar.prototype,"__renderOverscroll",{value:u,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(86),i=r(o),u=n(90),a=r(u);Object.defineProperty(e,"__esModule",{value:!0});var c=n(151);(0,a.default)(c).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return c[t]}})})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(86),i=r(o),u=n(90),a=r(u);Object.defineProperty(e,"__esModule",{value:!0});var c=n(152);(0,a.default)(c).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return c[t]}})});var l=n(153);(0,a.default)(l).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return l[t]}})})},function(t,e,n){"use strict";function r(t,e){var n=this.size,r=this.offset,i=this.targets,u=this.thumbOffset,a=i.xAxis,c=i.yAxis,l=i.content;if((0,o.setStyle)(l,{"-transform":"translate3d("+-(r.x+t)+"px, "+-(r.y+e)+"px, 0)"}),t){var f=n.container.width/(n.container.width+Math.abs(t));(0,o.setStyle)(a.thumb,{"-transform":"translate3d("+u.x+"px, 0, 0) scale3d("+f+", 1, 1)","-transform-origin":t<0?"left":"right"})}if(e){var s=n.container.height/(n.container.height+Math.abs(e));(0,o.setStyle)(c.thumb,{"-transform":"translate3d(0, "+u.y+"px, 0) scale3d(1, "+s+", 1)","-transform-origin":e<0?"top":"bottom"})}}Object.defineProperty(e,"__esModule",{value:!0}),e.overscrollBounce=r;var o=n(112)},function(t,e,n){"use strict";function r(t,e){var n=this.size,r=this.targets,a=this.options,c=r.canvas,l=c.elem,f=c.context;return t||e?((0,u.setStyle)(l,{display:"block"}),f.clearRect(0,0,n.content.width,n.container.height),f.fillStyle=a.overscrollEffectColor,o.call(this,t),void i.call(this,e)):(0,u.setStyle)(l,{display:"none"})}function o(t){var e=this.size,n=this.targets,r=this.__touchRecord,o=this.MAX_OVERSCROLL,i=e.container,l=i.width,f=i.height,s=n.canvas.context;s.save(),t>0&&s.transform(-1,0,0,1,l,0);var d=(0,u.pickInRange)(Math.abs(t)/o,0,a),h=(0,u.pickInRange)(d,0,c)*l,v=Math.abs(t),_=r.getLastPosition("y")||f/2;s.globalAlpha=d,s.beginPath(),s.moveTo(0,-h),s.quadraticCurveTo(v,_,0,f+h),s.fill(),s.closePath(),s.restore()}function i(t){var e=this.size,n=this.targets,r=this.__touchRecord,o=this.MAX_OVERSCROLL,i=e.container,l=i.width,f=i.height,s=n.canvas.context;s.save(),t>0&&s.transform(1,0,0,-1,0,f);var d=(0,u.pickInRange)(Math.abs(t)/o,0,a),h=(0,u.pickInRange)(d,0,c)*l,v=r.getLastPosition("x")||l/2,_=Math.abs(t);s.globalAlpha=d,s.beginPath(),s.moveTo(-h,0),s.quadraticCurveTo(v,_,l+h,0),s.fill(),s.closePath(),s.restore()}Object.defineProperty(e,"__esModule",{value:!0}),e.overscrollGlow=r;var u=n(112),a=.75,c=.25},function(t,e,n){"use strict";function r(t){var e=this.options,n=this.offset,r=this.movement,o=this.__touchRecord,i=e.damping,u=e.renderByPixels,a=e.overscrollDamping,c=n[t],l=r[t],f=i;if(this.__willOverscroll(t,l)?f=a:o.isActive()&&(f=.5),Math.abs(l)<1){var s=c+l;return{movement:0,position:l>0?Math.ceil(s):Math.floor(s)}}var d=l*(1-f);return u&&(d|=0),{movement:d,position:c+l-d}}function o(){var t=this.options,e=this.offset,n=this.limit,i=this.movement,a=this.overscrollRendered,c=this.__timerID;if(i.x||i.y||a.x||a.y){var l=r.call(this,"x"),f=r.call(this,"y"),s=[];if(t.overscrollEffect){var d=(0,u.pickInRange)(l.position,0,n.x),h=(0,u.pickInRange)(f.position,0,n.y);(a.x||d===e.x&&i.x)&&s.push("x"),(a.y||h===e.y&&i.y)&&s.push("y")}this.movementLocked.x||(i.x=l.movement),this.movementLocked.y||(i.y=f.movement),this.setPosition(l.position,f.position),this.__renderOverscroll(s)}c.render=requestAnimationFrame(o.bind(this))}var i=n(78),u=n(112);Object.defineProperty(i.SmoothScrollbar.prototype,"__render",{value:o,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(t){if(Array.isArray(t)){for(var e=0,n=Array(t.length);e<t.length;e++)n[e]=t[e];return n}return(0,a.default)(t)}function i(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0,e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,n=arguments.length>2&&void 0!==arguments[2]&&arguments[2],r=this.options,i=this.movement;this.__updateThrottle();var u=this.__getDeltaLimit(n);r.renderByPixels&&(t=Math.round(t),e=Math.round(e)),i.x=c.pickInRange.apply(void 0,[t].concat(o(u.x))),i.y=c.pickInRange.apply(void 0,[e].concat(o(u.y)))}var u=n(2),a=r(u),c=n(112),l=n(78);Object.defineProperty(l.SmoothScrollbar.prototype,"__setMovement",{value:i,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0,e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,n=this.options,r=this.offset,o=this.limit;if(!n.continuousScrolling)return!1;var u=(0,i.pickInRange)(t+r.x,0,o.x),a=(0,i.pickInRange)(e+r.y,0,o.y),c=!0;return c&=u===r.x,c&=a===r.y,c&=u===o.x||0===u||a===o.y||0===a}var o=n(78),i=n(112);Object.defineProperty(o.SmoothScrollbar.prototype,"__shouldPropagateMovement",{value:r,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0;if(!t)return!1;var n=this.offset,r=this.limit,o=n[t];return(0,i.pickInRange)(e+o,0,r[t])===o&&(0===o||o===r[t])}var o=n(78),i=n(112);Object.defineProperty(o.SmoothScrollbar.prototype,"__willOverscroll",{value:r,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(86),i=r(o),u=n(90),a=r(u);Object.defineProperty(e,"__esModule",{value:!0});var c=n(159);(0,a.default)(c).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return c[t]}})})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(86),i=r(o),u=n(90),a=r(u);Object.defineProperty(e,"__esModule",{value:!0});var c=n(160);(0,a.default)(c).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return c[t]}})});var l=n(161);(0,a.default)(l).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return l[t]}})});var f=n(168);(0,a.default)(f).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return f[t]}})});var s=n(169);(0,a.default)(s).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return s[t]}})});var d=n(170);(0,a.default)(d).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return d[t]}})});var h=n(171);(0,a.default)(h).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return h[t]}})});var v=n(172);(0,a.default)(v).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return v[t]}})})},function(t,e,n){"use strict";function r(){var t=this,e=this.targets,n=e.container,r=e.content,o=!1,u=void 0,a=void 0;Object.defineProperty(this,"__isDrag",{get:function(){return o},enumerable:!1});var c=function e(n){var r=n.x,o=n.y;if(r||o){var i=t.options.speed;t.__setMovement(r*i,o*i),u=requestAnimationFrame(function(){e({x:r,y:o})})}};this.__addEvent(n,"dragstart",function(e){t.__eventFromChildScrollbar(e)||(o=!0,a=e.target.clientHeight,(0,i.setStyle)(r,{"pointer-events":"auto"}),cancelAnimationFrame(u),t.__updateBounding())}),this.__addEvent(document,"dragover mousemove touchmove",function(e){if(o&&!t.__eventFromChildScrollbar(e)){cancelAnimationFrame(u),e.preventDefault();var n=t.__getPointerTrend(e,a);c(n)}}),this.__addEvent(document,"dragend mouseup touchend blur",function(){cancelAnimationFrame(u),o=!1})}var o=n(78),i=n(112);Object.defineProperty(o.SmoothScrollbar.prototype,"__dragHandler",{value:r,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(){var t=this,e=this.targets,n=function(e){var n=t.size,r=t.offset,o=t.limit,i=t.movement;switch(e){case s.SPACE:return[0,200];case s.PAGE_UP:return[0,-n.container.height+40];case s.PAGE_DOWN:return[0,n.container.height-40];case s.END:return[0,Math.abs(i.y)+o.y-r.y];case s.HOME:return[0,-Math.abs(i.y)-r.y];case s.LEFT:return[-40,0];case s.UP:return[0,-40];case s.RIGHT:return[40,0];case s.DOWN:return[0,40];default:return null}},r=e.container;this.__addEvent(r,"keydown",function(e){if(document.activeElement===r){var o=t.options,i=t.parents,u=t.movementLocked,a=n(e.keyCode||e.which);if(a){var c=l(a,2),f=c[0],s=c[1];if(t.__shouldPropagateMovement(f,s))return r.blur(),i.length&&i[0].focus(),t.__updateThrottle();e.preventDefault(),t.__unlockMovement(),f&&t.__willOverscroll("x",f)&&(u.x=!0),s&&t.__willOverscroll("y",s)&&(u.y=!0);var d=o.speed;t.__addMovement(f*d,s*d)}}}),this.__addEvent(r,"keyup",function(){t.__unlockMovement()})}var i=n(162),u=r(i),a=n(165),c=r(a),l=function(){function t(t,e){var n=[],r=!0,o=!1,i=void 0;try{for(var u,a=(0,c.default)(t);!(r=(u=a.next()).done)&&(n.push(u.value),!e||n.length!==e);r=!0);}catch(t){o=!0,i=t}finally{try{!r&&a.return&&a.return()}finally{if(o)throw i}}return n}return function(e,n){if(Array.isArray(e))return e;if((0,u.default)(Object(e)))return t(e,n);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),f=n(78),s={SPACE:32,PAGE_UP:33,PAGE_DOWN:34,END:35,HOME:36,LEFT:37,UP:38,RIGHT:39,DOWN:40};Object.defineProperty(f.SmoothScrollbar.prototype,"__keyboardHandler",{value:o,writable:!0,configurable:!0})},function(t,e,n){t.exports={default:n(163),__esModule:!0}},function(t,e,n){n(57),n(4),t.exports=n(164)},function(t,e,n){var r=n(53),o=n(45)("iterator"),i=n(27);t.exports=n(12).isIterable=function(t){var e=Object(t);return void 0!==e[o]||"@@iterator"in e||i.hasOwnProperty(r(e))}},function(t,e,n){t.exports={default:n(166),__esModule:!0}},function(t,e,n){n(57),n(4),t.exports=n(167)},function(t,e,n){var r=n(17),o=n(52);t.exports=n(12).getIterator=function(t){var e=o(t);if("function"!=typeof e)throw TypeError(t+" is not iterable!");return r(e.call(t))}},function(t,e,n){"use strict";function r(){var t=this,e=this.targets,n=e.container,r=e.xAxis,o=e.yAxis,u=function(e,n){var r=t.size,o=t.thumbSize;if("x"===e){var i=r.container.width-(o.x-o.realX);return n/i*r.content.width}if("y"===e){var u=r.container.height-(o.y-o.realY);return n/u*r.content.height}return 0},a=function(t){return(0,i.isOneOf)(t,[r.track,r.thumb])?"x":(0,i.isOneOf)(t,[o.track,o.thumb])?"y":void 0},c=void 0,l=void 0,f=void 0,s=void 0,d=void 0;this.__addEvent(n,"click",function(e){if(!l&&(0,i.isOneOf)(e.target,[r.track,o.track])){var n=e.target,c=a(n),f=n.getBoundingClientRect(),s=(0,
        i.getPosition)(e),d=t.offset,h=t.thumbSize;if("x"===c){var v=s.x-f.left-h.x/2;t.__setMovement(u(c,v)-d.x,0)}else{var _=s.y-f.top-h.y/2;t.__setMovement(0,u(c,_)-d.y)}}}),this.__addEvent(n,"mousedown",function(e){if((0,i.isOneOf)(e.target,[r.thumb,o.thumb])){c=!0;var n=(0,i.getPosition)(e),u=e.target.getBoundingClientRect();s=a(e.target),f={x:n.x-u.left,y:n.y-u.top},d=t.targets.container.getBoundingClientRect()}}),this.__addEvent(window,"mousemove",function(e){if(c){e.preventDefault(),l=!0;var n=t.offset,r=(0,i.getPosition)(e);if("x"===s){var o=r.x-f.x-d.left;t.setPosition(u(s,o),n.y)}if("y"===s){var a=r.y-f.y-d.top;t.setPosition(n.x,u(s,a))}}}),this.__addEvent(window,"mouseup blur",function(){c=l=!1})}var o=n(78),i=n(112);Object.defineProperty(o.SmoothScrollbar.prototype,"__mouseHandler",{value:r,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(){this.__addEvent(window,"resize",this.__updateThrottle)}var o=n(78);Object.defineProperty(o.SmoothScrollbar.prototype,"__resizeHandler",{value:r,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(){var t=this,e=!1,n=void 0,r=this.targets,o=r.container,u=r.content,a=function e(r){var o=r.x,i=r.y;if(o||i){var u=t.options.speed;t.__setMovement(o*u,i*u),n=requestAnimationFrame(function(){e({x:o,y:i})})}},c=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";(0,i.setStyle)(o,{"-user-select":t})};this.__addEvent(window,"mousemove",function(r){if(e){cancelAnimationFrame(n);var o=t.__getPointerTrend(r);a(o)}}),this.__addEvent(u,"selectstart",function(r){return t.__eventFromChildScrollbar(r)?c("none"):(cancelAnimationFrame(n),t.__updateBounding(),void(e=!0))}),this.__addEvent(window,"mouseup blur",function(){cancelAnimationFrame(n),c(),e=!1}),this.__addEvent(o,"scroll",function(t){t.preventDefault(),o.scrollTop=o.scrollLeft=0})}var o=n(78),i=n(112);Object.defineProperty(o.SmoothScrollbar.prototype,"__selectHandler",{value:r,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(){var t=this,e=this.targets,n=this.__touchRecord,r=e.container;this.__addEvent(r,"touchstart",function(e){if(!t.__isDrag){var r=t.__timerID,o=t.movement;cancelAnimationFrame(r.scrollTo),t.__willOverscroll("x")||(o.x=0),t.__willOverscroll("y")||(o.y=0),n.track(e),t.__autoLockMovement()}}),this.__addEvent(r,"touchmove",function(e){if(!(t.__isDrag||s&&s!==t)){n.update(e);var r=n.getDelta(),o=r.x,i=r.y;if(t.__shouldPropagateMovement(o,i))return t.__updateThrottle();var u=t.movement,a=t.MAX_OVERSCROLL,c=t.options;if(u.x&&t.__willOverscroll("x",o)){var l=2;"bounce"===c.overscrollEffect&&(l+=Math.abs(10*u.x/a)),Math.abs(u.x)>=a?o=0:o/=l}if(u.y&&t.__willOverscroll("y",i)){var f=2;"bounce"===c.overscrollEffect&&(f+=Math.abs(10*u.y/a)),Math.abs(u.y)>=a?i=0:i/=f}t.__autoLockMovement(),e.preventDefault(),t.__addMovement(o,i,!0),s=t}}),this.__addEvent(r,"touchcancel touchend",function(e){if(!t.__isDrag){var r=t.options.speed,o=n.getVelocity(),i={};(0,u.default)(o).forEach(function(t){var e=(0,l.pickInRange)(o[t]*c.GLOBAL_ENV.EASING_MULTIPLIER,-1e3,1e3);i[t]=Math.abs(e)>f?e*r:0}),t.__addMovement(i.x,i.y,!0),t.__unlockMovement(),n.release(e),s=null}})}var i=n(90),u=r(i),a=n(78),c=n(89),l=n(112),f=100,s=null;Object.defineProperty(a.SmoothScrollbar.prototype,"__touchHandler",{value:o,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(){var t=this,e=this.targets.container,n=!1,r=(0,i.debounce)(function(){n=!1},30,!1);this.__addEvent(e,u.GLOBAL_ENV.WHEEL_EVENT,function(e){var o=t.options,u=(0,i.getDelta)(e),a=u.x,c=u.y;return a*=o.speed,c*=o.speed,t.__shouldPropagateMovement(a,c)?t.__updateThrottle():(e.preventDefault(),r(),t.overscrollBack&&(n=!0),n&&(t.__willOverscroll("x",a)&&(a=0),t.__willOverscroll("y",c)&&(c=0)),void t.__addMovement(a,c,!0))})}var o=n(78),i=n(112),u=n(89);Object.defineProperty(o.SmoothScrollbar.prototype,"__wheelHandler",{value:r,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(86),i=r(o),u=n(90),a=r(u);Object.defineProperty(e,"__esModule",{value:!0});var c=n(174);(0,a.default)(c).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return c[t]}})})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}var o=n(86),i=r(o),u=n(90),a=r(u);Object.defineProperty(e,"__esModule",{value:!0});var c=n(175);(0,a.default)(c).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return c[t]}})});var l=n(176);(0,a.default)(l).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return l[t]}})});var f=n(177);(0,a.default)(f).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return f[t]}})});var s=n(178);(0,a.default)(s).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return s[t]}})});var d=n(179);(0,a.default)(d).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return d[t]}})});var h=n(182);(0,a.default)(h).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return h[t]}})});var v=n(183);(0,a.default)(v).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return v[t]}})});var _=n(184);(0,a.default)(_).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return _[t]}})});var p=n(185);(0,a.default)(p).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return p[t]}})});var y=n(186);(0,a.default)(y).forEach(function(t){"default"!==t&&"__esModule"!==t&&(0,i.default)(e,t,{enumerable:!0,get:function(){return y[t]}})})},function(t,e,n){"use strict";function r(t,e,n){var r=this;if(!t||"function"!=typeof t.addEventListener)throw new TypeError("expect elem to be a DOM element, but got "+t);var o=function(t){for(var e=arguments.length,r=Array(e>1?e-1:0),o=1;o<e;o++)r[o-1]=arguments[o];!t.type.match(/drag/)&&t.defaultPrevented||n.apply(void 0,[t].concat(r))};e.split(/\s+/g).forEach(function(e){r.__handlers.push({evt:e,elem:t,fn:o,hasRegistered:!0}),t.addEventListener(e,o)})}var o=n(78);Object.defineProperty(o.SmoothScrollbar.prototype,"__addEvent",{value:r,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},e=t.target;return this.children.some(function(t){return t.contains(e)})}var o=n(78);Object.defineProperty(o.SmoothScrollbar.prototype,"__eventFromChildScrollbar",{value:r,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0],e=this.options,n=this.offset,r=this.limit;return t&&(e.continuousScrolling||e.overscrollEffect)?{x:[-(1/0),1/0],y:[-(1/0),1/0]}:{x:[-n.x,r.x-n.x],y:[-n.y,r.y-n.y]}}var o=n(78);Object.defineProperty(o.SmoothScrollbar.prototype,"__getDeltaLimit",{value:r,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,n=this.bounding,r=n.top,o=n.right,u=n.bottom,a=n.left,c=(0,i.getPosition)(t),l=c.x,f=c.y,s={x:0,y:0};return 0===l&&0===f?s:(l>o-e?s.x=l-o+e:l<a+e&&(s.x=l-a-e),f>u-e?s.y=f-u+e:f<r+e&&(s.y=f-r-e),s)}var o=n(78),i=n(112);Object.defineProperty(o.SmoothScrollbar.prototype,"__getPointerTrend",{value:r,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(t){if(Array.isArray(t)){for(var e=0,n=Array(t.length);e<t.length;e++)n[e]=t[e];return n}return(0,h.default)(t)}function i(t){var e=this,n={speed:1,damping:.1,thumbMinSize:20,syncCallbacks:!1,renderByPixels:!0,alwaysShowTracks:!1,continuousScrolling:"auto",overscrollEffect:!1,overscrollEffectColor:"#87ceeb",overscrollDamping:.2},r={damping:[0,1],speed:[0,1/0],thumbMinSize:[0,1/0],overscrollEffect:[!1,"bounce","glow"],overscrollDamping:[0,1]},i=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"auto";if(n.overscrollEffect!==!1)return!1;switch(t){case"auto":return e.isNestedScrollbar;default:return!!t}},u={set ignoreEvents(t){console.warn("`options.ignoreEvents` parameter is deprecated, use `instance#unregisterEvents()` method instead. https://github.com/idiotWu/smooth-scrollbar/wiki/Instance-Methods#instanceunregisterevents-regex--regex-regex--")},set friction(t){console.warn("`options.friction="+t+"` is deprecated, use `options.damping="+t/100+"` instead."),this.damping=t/100},get syncCallbacks(){return n.syncCallbacks},set syncCallbacks(t){n.syncCallbacks=!!t},get renderByPixels(){return n.renderByPixels},set renderByPixels(t){n.renderByPixels=!!t},get alwaysShowTracks(){return n.alwaysShowTracks},set alwaysShowTracks(t){t=!!t,n.alwaysShowTracks=t;var r=e.targets.container;t?(e.showTrack(),r.classList.add("sticky")):(e.hideTrack(),r.classList.remove("sticky"))},get continuousScrolling(){return i(n.continuousScrolling)},set continuousScrolling(t){"auto"===t?n.continuousScrolling=t:n.continuousScrolling=!!t},get overscrollEffect(){return n.overscrollEffect},set overscrollEffect(t){t&&!~r.overscrollEffect.indexOf(t)&&(console.warn("`overscrollEffect` should be one of "+(0,s.default)(r.overscrollEffect)+", but got "+(0,s.default)(t)+". It will be set to `false` now."),t=!1),n.overscrollEffect=t},get overscrollEffectColor(){return n.overscrollEffectColor},set overscrollEffectColor(t){n.overscrollEffectColor=t}};(0,l.default)(n).filter(function(t){return!u.hasOwnProperty(t)}).forEach(function(t){(0,a.default)(u,t,{enumerable:!0,get:function(){return n[t]},set:function(e){if(isNaN(parseFloat(e)))throw new TypeError("expect `options."+t+"` to be a number, but got "+("undefined"==typeof e?"undefined":b(e)));n[t]=g.pickInRange.apply(void 0,[e].concat(o(r[t])))}})}),this.__readonly("options",u),this.setOptions(t)}var u=n(86),a=r(u),c=n(90),l=r(c),f=n(180),s=r(f),d=n(2),h=r(d),v=n(55),_=r(v),p=n(62),y=r(p),b="function"==typeof y.default&&"symbol"==typeof _.default?function(t){return typeof t}:function(t){return t&&"function"==typeof y.default&&t.constructor===y.default&&t!==y.default.prototype?"symbol":typeof t},g=n(112),m=n(78);Object.defineProperty(m.SmoothScrollbar.prototype,"__initOptions",{value:i,writable:!0,configurable:!0})},function(t,e,n){t.exports={default:n(181),__esModule:!0}},function(t,e,n){var r=n(12),o=r.JSON||(r.JSON={stringify:JSON.stringify});t.exports=function(t){return o.stringify.apply(o,arguments)}},function(t,e,n){"use strict";function r(){this.update(),this.__keyboardHandler(),this.__resizeHandler(),this.__selectHandler(),this.__mouseHandler(),this.__touchHandler(),this.__wheelHandler(),this.__dragHandler(),this.__render()}var o=n(78);Object.defineProperty(o.SmoothScrollbar.prototype,"__initScrollbar",{value:r,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(t,e){return(0,u.default)(this,t,{value:e,enumerable:!0,configurable:!0})}var i=n(86),u=r(i),a=n(78);Object.defineProperty(a.SmoothScrollbar.prototype,"__readonly",{value:o,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(){var t=this.targets,e=this.size,n=this.offset,r=this.thumbOffset,i=this.thumbSize;r.x=n.x/e.content.width*(e.container.width-(i.x-i.realX)),r.y=n.y/e.content.height*(e.container.height-(i.y-i.realY)),(0,o.setStyle)(t.xAxis.thumb,{"-transform":"translate3d("+r.x+"px, 0, 0)"}),(0,o.setStyle)(t.yAxis.thumb,{"-transform":"translate3d(0, "+r.y+"px, 0)"})}var o=n(112),i=n(78);Object.defineProperty(i.SmoothScrollbar.prototype,"__setThumbPosition",{value:r,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(){var t=this.targets.container,e=t.getBoundingClientRect(),n=e.top,r=e.right,o=e.bottom,i=e.left,u=window,a=u.innerHeight,c=u.innerWidth;this.__readonly("bounding",{top:Math.max(n,0),right:Math.min(r,c),bottom:Math.min(o,a),left:Math.max(i,0)})}var o=n(78);Object.defineProperty(o.SmoothScrollbar.prototype,"__updateBounding",{value:r,writable:!0,configurable:!0})},function(t,e,n){"use strict";function r(t){return t&&t.__esModule?t:{default:t}}function o(t){if(Array.isArray(t)){for(var e=0,n=Array(t.length);e<t.length;e++)n[e]=t[e];return n}return(0,a.default)(t)}function i(){var t=this.targets,e=t.container,n=t.content;this.__readonly("children",[].concat(o(n.querySelectorAll(l.selectors)))),this.__readonly("isNestedScrollbar",!1);for(var r=[],i=e;i=i.parentElement;)l.sbList.has(i)&&(this.__readonly("isNestedScrollbar",!0),r.push(i));this.__readonly("parents",r)}var u=n(2),a=r(u),c=n(78),l=n(89);Object.defineProperty(c.SmoothScrollbar.prototype,"__updateTree",{value:i,writable:!0,configurable:!0})},function(t,e){}])});
},{}],31:[function(require,module,exports){
    'use strict';

    var _smoothScrollbar = require('smooth-scrollbar');

    var _smoothScrollbar2 = _interopRequireDefault(_smoothScrollbar);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var ProgressBar = require('progressbar.js');

    require('perfect-scrollbar/jquery');

    var speed = navigator.appName == 'Microsoft Internet Explorer' || !!(navigator.userAgent.match(/Trident/) || navigator.userAgent.match(/rv:11/)) || typeof $.browser !== "undefined" && $.browser.msie == 1 ? 3.4 : 1.7;

    function mainSlider(e) {
        var sliderNavigation = $(".menu__navigation--list");
        var sliderWrapper = $(".content");

        sliderNavigation.on('click', 'li', function (e) {

            $(".menu__navigation--list li").removeClass("selected");
            var selectedItem = $(this);
            $(this).addClass("selected");

            var selectedPosition = selectedItem.index();

            if (selectedPosition !== 7) {
                sliderWrapper.css({
                    transform: 'translateX(-' + 801 * selectedPosition + 'px'
                }, 500);
            }
        });
    }

    function establishProgressBar(container, value) {
        var bar = new ProgressBar.Circle(container, {
            trailColor: '#c7c7c7',
            trailWidth: 3,
            text: {
                value: '0%'
            },
            duration: 1000,
            easing: 'bounce',
            strokeWidth: 4,
            from: { color: '#fff' },
            to: { color: '#ffb400' },
            // Set default step function for all animate calls
            step: function step(state, circle) {
                circle.setText((circle.value() * 100).toFixed(0) + "%");
                circle.path.setAttribute('stroke', state.color);
            }
        });
        bar.animate(value);
    }

    function establishLineProgressBar(container, value, color) {
        var bar = new ProgressBar.Line(container, {
            strokeWidth: 20,
            easing: 'easeInOut',
            duration: 1400,
            trailColor: "#e7e7e7",
            trailWidth: 4,
            svgStyle: { width: '100%', height: '100%' },
            text: {
                autoStyleContainer: false
            },
            from: { color: '#FFF' },
            to: { color: color },
            step: function step(state, bar) {
                bar.setText(Math.round(bar.value() * 100) + '<span>%</span>');
                bar.path.setAttribute('stroke', state.color);
            }
        });

        bar.animate(value); // Number from 0.0 to 1.0
    }

    function initScrollBarForTheSeciton(section) {
        _smoothScrollbar2.default.init(document.getElementById(section), {
            damping: 0.05,
            speed: speed,
            alwaysShowTracks: true,
            overscrollEffect: "bounce",
            continuousScrolling: true
        });
    }

    function homePageSlider() {
        var slides = $('.slide_one__slider__slide');
        var selected = "selected";
        var iterator = $(".slide_one__slider__slide.selected").index();

        slides.each(function (index) {
            $(slides[index]).removeClass(selected);
        });

        if (iterator === slides.length - 1) {
            iterator = 0;
            $(slides[iterator]).addClass(selected);
        } else {
            iterator++;
            $(slides[iterator]).addClass(selected);
        }
    }

//Line Progress Bars
//FE LINES
    establishLineProgressBar("#html_line_bar", 0.95, "#9c5c5c");
    establishLineProgressBar("#css_line_bar", 0.95, "#9c5c5c");
    establishLineProgressBar("#jquery_line_bar", 0.95, "#9c5c5c");
    establishLineProgressBar("#bootstrap_line_bar", 0.9, "#9c5c5c");
    establishLineProgressBar("#materialize_line_bar", 0.9, "#9c5c5c");
    establishLineProgressBar("#ecma5_line_bar", 0.85, "#9c5c5c");
    establishLineProgressBar("#ecma67_line_bar", 0.85, "#9c5c5c");
    establishLineProgressBar("#react_line_bar", 0.8, "#9c5c5c");
    establishLineProgressBar("#gulp_line_bar", 0.8, "#9c5c5c");
    establishLineProgressBar("#jade_line_bar", 0.8, "#9c5c5c");
    establishLineProgressBar("#sass_line_bar", 0.8, "#9c5c5c");
    establishLineProgressBar("#less_line_bar", 0.8, "#9c5c5c");
    establishLineProgressBar("#vue_line_bar", 0.75, "#9c5c5c");
    establishLineProgressBar("#redux_line_bar", 0.75, "#9c5c5c");
    establishLineProgressBar("#foundation_line_bar", 0.75, "#9c5c5c");
    establishLineProgressBar("#git_line_bar", 0.75, "#9c5c5c");
    establishLineProgressBar("#chai_line_bar", 0.65, "#9c5c5c");
    establishLineProgressBar("#sinon_line_bar", 0.6, "#9c5c5c");
    establishLineProgressBar("#angular_line_bar", 0.55, "#9c5c5c");
//END OF FE LINES

//DB LINES
    establishLineProgressBar("#sql_line_bar", 0.85, '#ffb400');
    establishLineProgressBar("#mysql_line_bar", 0.85, '#ffb400');
    establishLineProgressBar("#plsql_line_bar", 0.75, '#ffb400');
    establishLineProgressBar("#db2_line_bar", 0.75, '#ffb400');
    establishLineProgressBar("#oracle_line_bar", 0.7, '#ffb400');
    establishLineProgressBar("#server_line_bar", 0.7, '#ffb400');
    establishLineProgressBar("#tsql_line_bar", 0.5, '#ffb400');
//END OF DB LINES

//BE LINES
    establishLineProgressBar("#node_line_bar", 0.75, "#9c5c5c");
    establishLineProgressBar("#asp_line_bar", 0.7, "#9c5c5c");
    establishLineProgressBar("#express_line_bar", 0.65, "#9c5c5c");
    establishLineProgressBar("#koa_line_bar", 0.65, "#9c5c5c");
    establishLineProgressBar("#mocha_line_bar", 0.65, "#9c5c5c");
    establishLineProgressBar("#mongo_line_bar", 0.65, "#9c5c5c");
    establishLineProgressBar("#mongoose_line_bar", 0.65, "#9c5c5c");
    establishLineProgressBar("#orm_line_bar", 0.6, "#9c5c5c");
    establishLineProgressBar("#javaee_line_bar", 0.45, "#9c5c5c");
//END OF BE LINES

//DEVOPS LINES
    establishLineProgressBar("#npm_line_bar", 0.95, '#ffb400');
    establishLineProgressBar("#bower_line_bar", 0.95, '#ffb400');
    establishLineProgressBar("#docker_line_bar", 0.75, '#ffb400');
    establishLineProgressBar("#boot_line_bar", 0.7, '#ffb400');
    establishLineProgressBar("#compose_line_bar", 0.65, '#ffb400');
    establishLineProgressBar("#kubernetes_line_bar", 0.55, '#ffb400');
    establishLineProgressBar("#swarm_line_bar", 0.5, '#ffb400');
//END OF DEVOPS LINES

//Languages lines
    establishLineProgressBar("#js_line_bar", 0.9, "#9c5c5c");
    establishLineProgressBar("#java_line_bar", 0.75, "#9c5c5c");
    establishLineProgressBar("#cs_line_bar", 0.7, "#9c5c5c");
    establishLineProgressBar("#perl_line_bar", 0.55, "#9c5c5c");
    establishLineProgressBar("#cplus_line_bar", 0.45, "#9c5c5c");
    establishLineProgressBar("#shell_line_bar", 0.45, "#9c5c5c");
    establishLineProgressBar("#php_line_bar", 0.45, "#9c5c5c");
//End of languages line

//End of Line progress Bars

//Radial Progress Bars
    establishProgressBar("#front_end_pb", 0.9);
    establishProgressBar("#back_end_pb", 0.6);
    establishProgressBar("#db_dev_pb", 0.7);
    establishProgressBar("#prod_eng_pb", 0.6);
//End of Radial Progress Bars

    initScrollBarForTheSeciton("slide_two");
    initScrollBarForTheSeciton("slide_three");
    initScrollBarForTheSeciton("slide_four");
    initScrollBarForTheSeciton("slide_five");
    initScrollBarForTheSeciton("slide_six");
    initScrollBarForTheSeciton("slide_seven");

    mainSlider();

    setInterval(function () {
        homePageSlider();
    }, 8000);

    var i = 1;
    setInterval(function () {
        var colorArray = ["#ffb400", "#fff", "rgba(100, 0, 0, 0.5)"];
        $(".slide_one__cover__description--intro").css({
            'text-shadow': i % 2 === 0 ? '0 0 10px #ffb400' : "none"
        });
        i++;
    }, 750);

},{"perfect-scrollbar/jquery":1,"progressbar.js":24,"smooth-scrollbar":30}]},{},[31])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcGVyZmVjdC1zY3JvbGxiYXIvanF1ZXJ5LmpzIiwibm9kZV9tb2R1bGVzL3BlcmZlY3Qtc2Nyb2xsYmFyL3NyYy9qcy9hZGFwdG9yL2pxdWVyeS5qcyIsIm5vZGVfbW9kdWxlcy9wZXJmZWN0LXNjcm9sbGJhci9zcmMvanMvbGliL2RvbS5qcyIsIm5vZGVfbW9kdWxlcy9wZXJmZWN0LXNjcm9sbGJhci9zcmMvanMvbGliL2V2ZW50LW1hbmFnZXIuanMiLCJub2RlX21vZHVsZXMvcGVyZmVjdC1zY3JvbGxiYXIvc3JjL2pzL2xpYi9ndWlkLmpzIiwibm9kZV9tb2R1bGVzL3BlcmZlY3Qtc2Nyb2xsYmFyL3NyYy9qcy9saWIvaGVscGVyLmpzIiwibm9kZV9tb2R1bGVzL3BlcmZlY3Qtc2Nyb2xsYmFyL3NyYy9qcy9tYWluLmpzIiwibm9kZV9tb2R1bGVzL3BlcmZlY3Qtc2Nyb2xsYmFyL3NyYy9qcy9wbHVnaW4vZGVmYXVsdC1zZXR0aW5nLmpzIiwibm9kZV9tb2R1bGVzL3BlcmZlY3Qtc2Nyb2xsYmFyL3NyYy9qcy9wbHVnaW4vZGVzdHJveS5qcyIsIm5vZGVfbW9kdWxlcy9wZXJmZWN0LXNjcm9sbGJhci9zcmMvanMvcGx1Z2luL2hhbmRsZXIvY2xpY2stcmFpbC5qcyIsIm5vZGVfbW9kdWxlcy9wZXJmZWN0LXNjcm9sbGJhci9zcmMvanMvcGx1Z2luL2hhbmRsZXIvZHJhZy1zY3JvbGxiYXIuanMiLCJub2RlX21vZHVsZXMvcGVyZmVjdC1zY3JvbGxiYXIvc3JjL2pzL3BsdWdpbi9oYW5kbGVyL2tleWJvYXJkLmpzIiwibm9kZV9tb2R1bGVzL3BlcmZlY3Qtc2Nyb2xsYmFyL3NyYy9qcy9wbHVnaW4vaGFuZGxlci9tb3VzZS13aGVlbC5qcyIsIm5vZGVfbW9kdWxlcy9wZXJmZWN0LXNjcm9sbGJhci9zcmMvanMvcGx1Z2luL2hhbmRsZXIvbmF0aXZlLXNjcm9sbC5qcyIsIm5vZGVfbW9kdWxlcy9wZXJmZWN0LXNjcm9sbGJhci9zcmMvanMvcGx1Z2luL2hhbmRsZXIvc2VsZWN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL3BlcmZlY3Qtc2Nyb2xsYmFyL3NyYy9qcy9wbHVnaW4vaGFuZGxlci90b3VjaC5qcyIsIm5vZGVfbW9kdWxlcy9wZXJmZWN0LXNjcm9sbGJhci9zcmMvanMvcGx1Z2luL2luaXRpYWxpemUuanMiLCJub2RlX21vZHVsZXMvcGVyZmVjdC1zY3JvbGxiYXIvc3JjL2pzL3BsdWdpbi9pbnN0YW5jZXMuanMiLCJub2RlX21vZHVsZXMvcGVyZmVjdC1zY3JvbGxiYXIvc3JjL2pzL3BsdWdpbi91cGRhdGUtZ2VvbWV0cnkuanMiLCJub2RlX21vZHVsZXMvcGVyZmVjdC1zY3JvbGxiYXIvc3JjL2pzL3BsdWdpbi91cGRhdGUtc2Nyb2xsLmpzIiwibm9kZV9tb2R1bGVzL3BlcmZlY3Qtc2Nyb2xsYmFyL3NyYy9qcy9wbHVnaW4vdXBkYXRlLmpzIiwibm9kZV9tb2R1bGVzL3Byb2dyZXNzYmFyLmpzL3NyYy9jaXJjbGUuanMiLCJub2RlX21vZHVsZXMvcHJvZ3Jlc3NiYXIuanMvc3JjL2xpbmUuanMiLCJub2RlX21vZHVsZXMvcHJvZ3Jlc3NiYXIuanMvc3JjL21haW4uanMiLCJub2RlX21vZHVsZXMvcHJvZ3Jlc3NiYXIuanMvc3JjL3BhdGguanMiLCJub2RlX21vZHVsZXMvcHJvZ3Jlc3NiYXIuanMvc3JjL3NlbWljaXJjbGUuanMiLCJub2RlX21vZHVsZXMvcHJvZ3Jlc3NiYXIuanMvc3JjL3NoYXBlLmpzIiwibm9kZV9tb2R1bGVzL3Byb2dyZXNzYmFyLmpzL3NyYy91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9zaGlmdHkvZGlzdC9zaGlmdHkuanMiLCJub2RlX21vZHVsZXMvc21vb3RoLXNjcm9sbGJhci9kaXN0L3Ntb290aC1zY3JvbGxiYXIuanMiLCJzcmNcXGpzXFxhcHAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbm5EQTtBQUNBO0FBQ0E7Ozs7QUNEQTs7Ozs7O0FBREEsSUFBTSxjQUFjLFFBQVEsZ0JBQVIsQ0FBcEI7O0FBRUEsUUFBUSwwQkFBUjs7QUFHQSxJQUFJLFFBQVEsVUFBVSxPQUFWLElBQXFCLDZCQUFyQixJQUFzRCxDQUFDLEVBQUUsVUFBVSxTQUFWLENBQW9CLEtBQXBCLENBQTBCLFNBQTFCLEtBQXdDLFVBQVUsU0FBVixDQUFvQixLQUFwQixDQUEwQixPQUExQixDQUExQyxDQUF2RCxJQUF5SSxPQUFPLEVBQUUsT0FBVCxLQUFxQixXQUFyQixJQUFvQyxFQUFFLE9BQUYsQ0FBVSxJQUFWLElBQWtCLENBQS9MLEdBQW9NLEdBQXBNLEdBQTBNLEdBQXROOztBQUVBLFNBQVMsVUFBVCxDQUFvQixDQUFwQixFQUF1QjtBQUNuQixRQUFNLG1CQUFtQixFQUFFLHlCQUFGLENBQXpCO0FBQ0EsUUFBTSxnQkFBZ0IsRUFBRSxVQUFGLENBQXRCOztBQUVBLHFCQUFpQixFQUFqQixDQUFvQixPQUFwQixFQUE2QixJQUE3QixFQUFtQyxVQUFVLENBQVYsRUFBYTs7QUFFNUMsVUFBRSw0QkFBRixFQUFnQyxXQUFoQyxDQUE0QyxVQUE1QztBQUNBLFlBQU0sZUFBZSxFQUFFLElBQUYsQ0FBckI7QUFDQSxVQUFFLElBQUYsRUFBUSxRQUFSLENBQWlCLFVBQWpCOztBQUVBLFlBQUksbUJBQW1CLGFBQWEsS0FBYixFQUF2Qjs7QUFFQSxZQUFJLHFCQUFxQixDQUF6QixFQUE0QjtBQUN4QiwwQkFBYyxHQUFkLENBQWtCO0FBQ2QsNENBQTBCLE1BQU0sZ0JBQWhDO0FBRGMsYUFBbEIsRUFFRyxHQUZIO0FBR0g7QUFDSixLQWJEO0FBY0g7O0FBRUQsU0FBUyxvQkFBVCxDQUE4QixTQUE5QixFQUF5QyxLQUF6QyxFQUFnRDtBQUM1QyxRQUFNLE1BQU0sSUFBSSxZQUFZLE1BQWhCLENBQXdCLFNBQXhCLEVBQW9DO0FBQzVDLG9CQUFZLFNBRGdDO0FBRTVDLG9CQUFZLENBRmdDO0FBRzVDLGNBQU07QUFDRixtQkFBTztBQURMLFNBSHNDO0FBTTVDLGtCQUFVLElBTmtDO0FBTzVDLGdCQUFRLFFBUG9DO0FBUTVDLHFCQUFhLENBUitCO0FBUzVDLGNBQU0sRUFBQyxPQUFPLE1BQVIsRUFUc0M7QUFVNUMsWUFBSSxFQUFDLE9BQU8sU0FBUixFQVZ3QztBQVc1QztBQUNBLGNBQU0sY0FBVSxLQUFWLEVBQWlCLE1BQWpCLEVBQXlCO0FBQzNCLG1CQUFPLE9BQVAsQ0FBZSxDQUFDLE9BQU8sS0FBUCxLQUFpQixHQUFsQixFQUF1QixPQUF2QixDQUErQixDQUEvQixJQUFvQyxHQUFuRDtBQUNBLG1CQUFPLElBQVAsQ0FBWSxZQUFaLENBQXlCLFFBQXpCLEVBQW1DLE1BQU0sS0FBekM7QUFDSDtBQWYyQyxLQUFwQyxDQUFaO0FBaUJBLFFBQUksT0FBSixDQUFZLEtBQVo7QUFDSDs7QUFFRCxTQUFTLHdCQUFULENBQWtDLFNBQWxDLEVBQTZDLEtBQTdDLEVBQW9ELEtBQXBELEVBQTJEO0FBQ3ZELFFBQU0sTUFBTSxJQUFJLFlBQVksSUFBaEIsQ0FBcUIsU0FBckIsRUFBZ0M7QUFDeEMscUJBQWEsRUFEMkI7QUFFeEMsZ0JBQVEsV0FGZ0M7QUFHeEMsa0JBQVUsSUFIOEI7QUFJeEMsb0JBQVksU0FKNEI7QUFLeEMsb0JBQVksQ0FMNEI7QUFNeEMsa0JBQVUsRUFBQyxPQUFPLE1BQVIsRUFBZ0IsUUFBUSxNQUF4QixFQU44QjtBQU94QyxjQUFNO0FBQ0YsZ0NBQW9CO0FBRGxCLFNBUGtDO0FBVXhDLGNBQU0sRUFBQyxPQUFPLE1BQVIsRUFWa0M7QUFXeEMsWUFBSSxFQUFDLE9BQU8sS0FBUixFQVhvQztBQVl4QyxjQUFNLGNBQUMsS0FBRCxFQUFRLEdBQVIsRUFBZ0I7QUFDbEIsZ0JBQUksT0FBSixDQUFZLEtBQUssS0FBTCxDQUFXLElBQUksS0FBSixLQUFjLEdBQXpCLElBQWdDLGdCQUE1QztBQUNBLGdCQUFJLElBQUosQ0FBUyxZQUFULENBQXNCLFFBQXRCLEVBQWdDLE1BQU0sS0FBdEM7QUFDSDtBQWZ1QyxLQUFoQyxDQUFaOztBQWtCQSxRQUFJLE9BQUosQ0FBWSxLQUFaLEVBbkJ1RCxDQW1CbEM7QUFDeEI7O0FBRUQsU0FBUywwQkFBVCxDQUFvQyxPQUFwQyxFQUE0QztBQUN4Qyw4QkFBVSxJQUFWLENBQWUsU0FBUyxjQUFULENBQXdCLE9BQXhCLENBQWYsRUFBaUQ7QUFDN0MsaUJBQVMsSUFEb0M7QUFFN0MsZUFBTyxLQUZzQztBQUc3QywwQkFBa0IsSUFIMkI7QUFJN0MsMEJBQWtCLFFBSjJCO0FBSzdDLDZCQUFxQjtBQUx3QixLQUFqRDtBQU9IOztBQUVELFNBQVMsY0FBVCxHQUEwQjtBQUN0QixRQUFNLFNBQVMsRUFBRSwyQkFBRixDQUFmO0FBQ0EsUUFBTSxXQUFXLFVBQWpCO0FBQ0EsUUFBSSxXQUFXLEVBQUUsb0NBQUYsRUFBd0MsS0FBeEMsRUFBZjs7QUFFQSxXQUFPLElBQVAsQ0FBWSxVQUFTLEtBQVQsRUFBZ0I7QUFDeEIsVUFBRSxPQUFPLEtBQVAsQ0FBRixFQUFpQixXQUFqQixDQUE2QixRQUE3QjtBQUNILEtBRkQ7O0FBSUEsUUFBSSxhQUFhLE9BQU8sTUFBUCxHQUFnQixDQUFqQyxFQUFvQztBQUNoQyxtQkFBVyxDQUFYO0FBQ0EsVUFBRSxPQUFPLFFBQVAsQ0FBRixFQUFvQixRQUFwQixDQUE2QixRQUE3QjtBQUNILEtBSEQsTUFHTztBQUNIO0FBQ0EsVUFBRSxPQUFPLFFBQVAsQ0FBRixFQUFvQixRQUFwQixDQUE2QixRQUE3QjtBQUNIO0FBQ0o7O0FBRUQ7QUFDQTtBQUNBLHlCQUF5QixnQkFBekIsRUFBMkMsSUFBM0MsRUFBa0QsU0FBbEQ7QUFDQSx5QkFBeUIsZUFBekIsRUFBMEMsSUFBMUMsRUFBaUQsU0FBakQ7QUFDQSx5QkFBeUIsa0JBQXpCLEVBQTZDLElBQTdDLEVBQW9ELFNBQXBEO0FBQ0EseUJBQXlCLHFCQUF6QixFQUFnRCxHQUFoRCxFQUFzRCxTQUF0RDtBQUNBLHlCQUF5Qix1QkFBekIsRUFBa0QsR0FBbEQsRUFBd0QsU0FBeEQ7QUFDQSx5QkFBeUIsaUJBQXpCLEVBQTRDLElBQTVDLEVBQW1ELFNBQW5EO0FBQ0EseUJBQXlCLGtCQUF6QixFQUE2QyxJQUE3QyxFQUFvRCxTQUFwRDtBQUNBLHlCQUF5QixpQkFBekIsRUFBNEMsR0FBNUMsRUFBa0QsU0FBbEQ7QUFDQSx5QkFBeUIsZ0JBQXpCLEVBQTJDLEdBQTNDLEVBQWlELFNBQWpEO0FBQ0EseUJBQXlCLGdCQUF6QixFQUEyQyxHQUEzQyxFQUFpRCxTQUFqRDtBQUNBLHlCQUF5QixnQkFBekIsRUFBMkMsR0FBM0MsRUFBaUQsU0FBakQ7QUFDQSx5QkFBeUIsZ0JBQXpCLEVBQTJDLEdBQTNDLEVBQWlELFNBQWpEO0FBQ0EseUJBQXlCLGVBQXpCLEVBQTBDLElBQTFDLEVBQWlELFNBQWpEO0FBQ0EseUJBQXlCLGlCQUF6QixFQUE0QyxJQUE1QyxFQUFtRCxTQUFuRDtBQUNBLHlCQUF5QixzQkFBekIsRUFBaUQsSUFBakQsRUFBd0QsU0FBeEQ7QUFDQSx5QkFBeUIsZUFBekIsRUFBMEMsSUFBMUMsRUFBaUQsU0FBakQ7QUFDQSx5QkFBeUIsZ0JBQXpCLEVBQTJDLElBQTNDLEVBQWtELFNBQWxEO0FBQ0EseUJBQXlCLGlCQUF6QixFQUE0QyxHQUE1QyxFQUFrRCxTQUFsRDtBQUNBLHlCQUF5QixtQkFBekIsRUFBOEMsSUFBOUMsRUFBcUQsU0FBckQ7QUFDQTs7QUFFQTtBQUNBLHlCQUF5QixlQUF6QixFQUEwQyxJQUExQyxFQUFnRCxTQUFoRDtBQUNBLHlCQUF5QixpQkFBekIsRUFBNEMsSUFBNUMsRUFBa0QsU0FBbEQ7QUFDQSx5QkFBeUIsaUJBQXpCLEVBQTRDLElBQTVDLEVBQWtELFNBQWxEO0FBQ0EseUJBQXlCLGVBQXpCLEVBQTBDLElBQTFDLEVBQWdELFNBQWhEO0FBQ0EseUJBQXlCLGtCQUF6QixFQUE2QyxHQUE3QyxFQUFrRCxTQUFsRDtBQUNBLHlCQUF5QixrQkFBekIsRUFBNkMsR0FBN0MsRUFBa0QsU0FBbEQ7QUFDQSx5QkFBeUIsZ0JBQXpCLEVBQTJDLEdBQTNDLEVBQWdELFNBQWhEO0FBQ0E7O0FBRUE7QUFDQSx5QkFBeUIsZ0JBQXpCLEVBQTJDLElBQTNDLEVBQWtELFNBQWxEO0FBQ0EseUJBQXlCLGVBQXpCLEVBQTBDLEdBQTFDLEVBQWdELFNBQWhEO0FBQ0EseUJBQXlCLG1CQUF6QixFQUE4QyxJQUE5QyxFQUFxRCxTQUFyRDtBQUNBLHlCQUF5QixlQUF6QixFQUEwQyxJQUExQyxFQUFpRCxTQUFqRDtBQUNBLHlCQUF5QixpQkFBekIsRUFBNEMsSUFBNUMsRUFBbUQsU0FBbkQ7QUFDQSx5QkFBeUIsaUJBQXpCLEVBQTRDLElBQTVDLEVBQW1ELFNBQW5EO0FBQ0EseUJBQXlCLG9CQUF6QixFQUErQyxJQUEvQyxFQUFzRCxTQUF0RDtBQUNBLHlCQUF5QixlQUF6QixFQUEwQyxHQUExQyxFQUFnRCxTQUFoRDtBQUNBLHlCQUF5QixrQkFBekIsRUFBNkMsSUFBN0MsRUFBb0QsU0FBcEQ7QUFDQTs7QUFFQTtBQUNBLHlCQUF5QixlQUF6QixFQUEwQyxJQUExQyxFQUFnRCxTQUFoRDtBQUNBLHlCQUF5QixpQkFBekIsRUFBNEMsSUFBNUMsRUFBa0QsU0FBbEQ7QUFDQSx5QkFBeUIsa0JBQXpCLEVBQTZDLElBQTdDLEVBQW1ELFNBQW5EO0FBQ0EseUJBQXlCLGdCQUF6QixFQUEyQyxHQUEzQyxFQUFnRCxTQUFoRDtBQUNBLHlCQUF5QixtQkFBekIsRUFBOEMsSUFBOUMsRUFBb0QsU0FBcEQ7QUFDQSx5QkFBeUIsc0JBQXpCLEVBQWlELElBQWpELEVBQXVELFNBQXZEO0FBQ0EseUJBQXlCLGlCQUF6QixFQUE0QyxHQUE1QyxFQUFpRCxTQUFqRDtBQUNBOztBQUVBO0FBQ0EseUJBQXlCLGNBQXpCLEVBQXlDLEdBQXpDLEVBQStDLFNBQS9DO0FBQ0EseUJBQXlCLGdCQUF6QixFQUEyQyxJQUEzQyxFQUFrRCxTQUFsRDtBQUNBLHlCQUF5QixjQUF6QixFQUF5QyxHQUF6QyxFQUErQyxTQUEvQztBQUNBLHlCQUF5QixnQkFBekIsRUFBMkMsSUFBM0MsRUFBa0QsU0FBbEQ7QUFDQSx5QkFBeUIsaUJBQXpCLEVBQTRDLElBQTVDLEVBQW1ELFNBQW5EO0FBQ0EseUJBQXlCLGlCQUF6QixFQUE0QyxJQUE1QyxFQUFtRCxTQUFuRDtBQUNBLHlCQUF5QixlQUF6QixFQUEwQyxJQUExQyxFQUFpRCxTQUFqRDtBQUNBOztBQUVBOztBQUVBO0FBQ0EscUJBQXFCLGVBQXJCLEVBQXNDLEdBQXRDO0FBQ0EscUJBQXFCLGNBQXJCLEVBQXFDLEdBQXJDO0FBQ0EscUJBQXFCLFlBQXJCLEVBQW1DLEdBQW5DO0FBQ0EscUJBQXFCLGNBQXJCLEVBQXFDLEdBQXJDO0FBQ0E7O0FBRUEsMkJBQTJCLFdBQTNCO0FBQ0EsMkJBQTJCLGFBQTNCO0FBQ0EsMkJBQTJCLFlBQTNCO0FBQ0EsMkJBQTJCLFlBQTNCO0FBQ0EsMkJBQTJCLFdBQTNCO0FBQ0EsMkJBQTJCLGFBQTNCOztBQUVBOztBQUVBLFlBQVksWUFBVztBQUNuQjtBQUNILENBRkQsRUFFRyxJQUZIOztBQUlBLElBQUksSUFBSSxDQUFSO0FBQ0EsWUFBWSxZQUFNO0FBQ2QsUUFBTSxhQUFhLENBQUMsU0FBRCxFQUFXLE1BQVgsRUFBa0Isc0JBQWxCLENBQW5CO0FBQ0EsTUFBRSx1Q0FBRixFQUEyQyxHQUEzQyxDQUErQztBQUMzQyx1QkFBZ0IsSUFBRSxDQUFGLEtBQVEsQ0FBVCx3QkFBbUM7QUFEUCxLQUEvQztBQUdBO0FBQ0gsQ0FORCxFQU1HLEdBTkgiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vc3JjL2pzL2FkYXB0b3IvanF1ZXJ5Jyk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBwcyA9IHJlcXVpcmUoJy4uL21haW4nKTtcbnZhciBwc0luc3RhbmNlcyA9IHJlcXVpcmUoJy4uL3BsdWdpbi9pbnN0YW5jZXMnKTtcblxuZnVuY3Rpb24gbW91bnRKUXVlcnkoalF1ZXJ5KSB7XG4gIGpRdWVyeS5mbi5wZXJmZWN0U2Nyb2xsYmFyID0gZnVuY3Rpb24gKHNldHRpbmdPckNvbW1hbmQpIHtcbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICh0eXBlb2Ygc2V0dGluZ09yQ29tbWFuZCA9PT0gJ29iamVjdCcgfHxcbiAgICAgICAgICB0eXBlb2Ygc2V0dGluZ09yQ29tbWFuZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gSWYgaXQncyBhbiBvYmplY3Qgb3Igbm9uZSwgaW5pdGlhbGl6ZS5cbiAgICAgICAgdmFyIHNldHRpbmdzID0gc2V0dGluZ09yQ29tbWFuZDtcblxuICAgICAgICBpZiAoIXBzSW5zdGFuY2VzLmdldCh0aGlzKSkge1xuICAgICAgICAgIHBzLmluaXRpYWxpemUodGhpcywgc2V0dGluZ3MpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBVbmxlc3MsIGl0IG1heSBiZSBhIGNvbW1hbmQuXG4gICAgICAgIHZhciBjb21tYW5kID0gc2V0dGluZ09yQ29tbWFuZDtcblxuICAgICAgICBpZiAoY29tbWFuZCA9PT0gJ3VwZGF0ZScpIHtcbiAgICAgICAgICBwcy51cGRhdGUodGhpcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoY29tbWFuZCA9PT0gJ2Rlc3Ryb3knKSB7XG4gICAgICAgICAgcHMuZGVzdHJveSh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufVxuXG5pZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gIC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cbiAgZGVmaW5lKFsnanF1ZXJ5J10sIG1vdW50SlF1ZXJ5KTtcbn0gZWxzZSB7XG4gIHZhciBqcSA9IHdpbmRvdy5qUXVlcnkgPyB3aW5kb3cualF1ZXJ5IDogd2luZG93LiQ7XG4gIGlmICh0eXBlb2YganEgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbW91bnRKUXVlcnkoanEpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbW91bnRKUXVlcnk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBET00gPSB7fTtcblxuRE9NLmNyZWF0ZSA9IGZ1bmN0aW9uICh0YWdOYW1lLCBjbGFzc05hbWUpIHtcbiAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xuICBlbGVtZW50LmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgcmV0dXJuIGVsZW1lbnQ7XG59O1xuXG5ET00uYXBwZW5kVG8gPSBmdW5jdGlvbiAoY2hpbGQsIHBhcmVudCkge1xuICBwYXJlbnQuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICByZXR1cm4gY2hpbGQ7XG59O1xuXG5mdW5jdGlvbiBjc3NHZXQoZWxlbWVudCwgc3R5bGVOYW1lKSB7XG4gIHJldHVybiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KVtzdHlsZU5hbWVdO1xufVxuXG5mdW5jdGlvbiBjc3NTZXQoZWxlbWVudCwgc3R5bGVOYW1lLCBzdHlsZVZhbHVlKSB7XG4gIGlmICh0eXBlb2Ygc3R5bGVWYWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICBzdHlsZVZhbHVlID0gc3R5bGVWYWx1ZS50b1N0cmluZygpICsgJ3B4JztcbiAgfVxuICBlbGVtZW50LnN0eWxlW3N0eWxlTmFtZV0gPSBzdHlsZVZhbHVlO1xuICByZXR1cm4gZWxlbWVudDtcbn1cblxuZnVuY3Rpb24gY3NzTXVsdGlTZXQoZWxlbWVudCwgb2JqKSB7XG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICB2YXIgdmFsID0gb2JqW2tleV07XG4gICAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgICB2YWwgPSB2YWwudG9TdHJpbmcoKSArICdweCc7XG4gICAgfVxuICAgIGVsZW1lbnQuc3R5bGVba2V5XSA9IHZhbDtcbiAgfVxuICByZXR1cm4gZWxlbWVudDtcbn1cblxuRE9NLmNzcyA9IGZ1bmN0aW9uIChlbGVtZW50LCBzdHlsZU5hbWVPck9iamVjdCwgc3R5bGVWYWx1ZSkge1xuICBpZiAodHlwZW9mIHN0eWxlTmFtZU9yT2JqZWN0ID09PSAnb2JqZWN0Jykge1xuICAgIC8vIG11bHRpcGxlIHNldCB3aXRoIG9iamVjdFxuICAgIHJldHVybiBjc3NNdWx0aVNldChlbGVtZW50LCBzdHlsZU5hbWVPck9iamVjdCk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHR5cGVvZiBzdHlsZVZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIGNzc0dldChlbGVtZW50LCBzdHlsZU5hbWVPck9iamVjdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjc3NTZXQoZWxlbWVudCwgc3R5bGVOYW1lT3JPYmplY3QsIHN0eWxlVmFsdWUpO1xuICAgIH1cbiAgfVxufTtcblxuRE9NLm1hdGNoZXMgPSBmdW5jdGlvbiAoZWxlbWVudCwgcXVlcnkpIHtcbiAgaWYgKHR5cGVvZiBlbGVtZW50Lm1hdGNoZXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIGVsZW1lbnQubWF0Y2hlcyhxdWVyeSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gbXVzdCBiZSBJRTExIGFuZCBFZGdlXG4gICAgcmV0dXJuIGVsZW1lbnQubXNNYXRjaGVzU2VsZWN0b3IocXVlcnkpO1xuICB9XG59O1xuXG5ET00ucmVtb3ZlID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgaWYgKHR5cGVvZiBlbGVtZW50LnJlbW92ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBlbGVtZW50LnJlbW92ZSgpO1xuICB9IGVsc2Uge1xuICAgIGlmIChlbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgICAgIGVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbGVtZW50KTtcbiAgICB9XG4gIH1cbn07XG5cbkRPTS5xdWVyeUNoaWxkcmVuID0gZnVuY3Rpb24gKGVsZW1lbnQsIHNlbGVjdG9yKSB7XG4gIHJldHVybiBBcnJheS5wcm90b3R5cGUuZmlsdGVyLmNhbGwoZWxlbWVudC5jaGlsZE5vZGVzLCBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICByZXR1cm4gRE9NLm1hdGNoZXMoY2hpbGQsIHNlbGVjdG9yKTtcbiAgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERPTTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIEV2ZW50RWxlbWVudCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gIHRoaXMuZXZlbnRzID0ge307XG59O1xuXG5FdmVudEVsZW1lbnQucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiAoZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gIGlmICh0eXBlb2YgdGhpcy5ldmVudHNbZXZlbnROYW1lXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdID0gW107XG4gIH1cbiAgdGhpcy5ldmVudHNbZXZlbnROYW1lXS5wdXNoKGhhbmRsZXIpO1xuICB0aGlzLmVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIsIGZhbHNlKTtcbn07XG5cbkV2ZW50RWxlbWVudC5wcm90b3R5cGUudW5iaW5kID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICB2YXIgaXNIYW5kbGVyUHJvdmlkZWQgPSAodHlwZW9mIGhhbmRsZXIgIT09ICd1bmRlZmluZWQnKTtcbiAgdGhpcy5ldmVudHNbZXZlbnROYW1lXSA9IHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0uZmlsdGVyKGZ1bmN0aW9uIChoZGxyKSB7XG4gICAgaWYgKGlzSGFuZGxlclByb3ZpZGVkICYmIGhkbHIgIT09IGhhbmRsZXIpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICB0aGlzLmVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhkbHIsIGZhbHNlKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sIHRoaXMpO1xufTtcblxuRXZlbnRFbGVtZW50LnByb3RvdHlwZS51bmJpbmRBbGwgPSBmdW5jdGlvbiAoKSB7XG4gIGZvciAodmFyIG5hbWUgaW4gdGhpcy5ldmVudHMpIHtcbiAgICB0aGlzLnVuYmluZChuYW1lKTtcbiAgfVxufTtcblxudmFyIEV2ZW50TWFuYWdlciA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5ldmVudEVsZW1lbnRzID0gW107XG59O1xuXG5FdmVudE1hbmFnZXIucHJvdG90eXBlLmV2ZW50RWxlbWVudCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHZhciBlZSA9IHRoaXMuZXZlbnRFbGVtZW50cy5maWx0ZXIoZnVuY3Rpb24gKGV2ZW50RWxlbWVudCkge1xuICAgIHJldHVybiBldmVudEVsZW1lbnQuZWxlbWVudCA9PT0gZWxlbWVudDtcbiAgfSlbMF07XG4gIGlmICh0eXBlb2YgZWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgZWUgPSBuZXcgRXZlbnRFbGVtZW50KGVsZW1lbnQpO1xuICAgIHRoaXMuZXZlbnRFbGVtZW50cy5wdXNoKGVlKTtcbiAgfVxuICByZXR1cm4gZWU7XG59O1xuXG5FdmVudE1hbmFnZXIucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiAoZWxlbWVudCwgZXZlbnROYW1lLCBoYW5kbGVyKSB7XG4gIHRoaXMuZXZlbnRFbGVtZW50KGVsZW1lbnQpLmJpbmQoZXZlbnROYW1lLCBoYW5kbGVyKTtcbn07XG5cbkV2ZW50TWFuYWdlci5wcm90b3R5cGUudW5iaW5kID0gZnVuY3Rpb24gKGVsZW1lbnQsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICB0aGlzLmV2ZW50RWxlbWVudChlbGVtZW50KS51bmJpbmQoZXZlbnROYW1lLCBoYW5kbGVyKTtcbn07XG5cbkV2ZW50TWFuYWdlci5wcm90b3R5cGUudW5iaW5kQWxsID0gZnVuY3Rpb24gKCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZXZlbnRFbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHRoaXMuZXZlbnRFbGVtZW50c1tpXS51bmJpbmRBbGwoKTtcbiAgfVxufTtcblxuRXZlbnRNYW5hZ2VyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gKGVsZW1lbnQsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICB2YXIgZWUgPSB0aGlzLmV2ZW50RWxlbWVudChlbGVtZW50KTtcbiAgdmFyIG9uY2VIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHtcbiAgICBlZS51bmJpbmQoZXZlbnROYW1lLCBvbmNlSGFuZGxlcik7XG4gICAgaGFuZGxlcihlKTtcbiAgfTtcbiAgZWUuYmluZChldmVudE5hbWUsIG9uY2VIYW5kbGVyKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRNYW5hZ2VyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIHM0KCkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKCgxICsgTWF0aC5yYW5kb20oKSkgKiAweDEwMDAwKVxuICAgICAgICAgICAgICAgLnRvU3RyaW5nKDE2KVxuICAgICAgICAgICAgICAgLnN1YnN0cmluZygxKTtcbiAgfVxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBzNCgpICsgczQoKSArICctJyArIHM0KCkgKyAnLScgKyBzNCgpICsgJy0nICtcbiAgICAgICAgICAgczQoKSArICctJyArIHM0KCkgKyBzNCgpICsgczQoKTtcbiAgfTtcbn0pKCk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBkb20gPSByZXF1aXJlKCcuL2RvbScpO1xuXG52YXIgdG9JbnQgPSBleHBvcnRzLnRvSW50ID0gZnVuY3Rpb24gKHgpIHtcbiAgcmV0dXJuIHBhcnNlSW50KHgsIDEwKSB8fCAwO1xufTtcblxuZXhwb3J0cy5pc0VkaXRhYmxlID0gZnVuY3Rpb24gKGVsKSB7XG4gIHJldHVybiBkb20ubWF0Y2hlcyhlbCwgXCJpbnB1dCxbY29udGVudGVkaXRhYmxlXVwiKSB8fFxuICAgICAgICAgZG9tLm1hdGNoZXMoZWwsIFwic2VsZWN0LFtjb250ZW50ZWRpdGFibGVdXCIpIHx8XG4gICAgICAgICBkb20ubWF0Y2hlcyhlbCwgXCJ0ZXh0YXJlYSxbY29udGVudGVkaXRhYmxlXVwiKSB8fFxuICAgICAgICAgZG9tLm1hdGNoZXMoZWwsIFwiYnV0dG9uLFtjb250ZW50ZWRpdGFibGVdXCIpO1xufTtcblxuZXhwb3J0cy5yZW1vdmVQc0NsYXNzZXMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGVsZW1lbnQuY2xhc3NMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGNsYXNzTmFtZSA9IGVsZW1lbnQuY2xhc3NMaXN0W2ldO1xuICAgIGlmIChjbGFzc05hbWUuaW5kZXhPZigncHMtJykgPT09IDApIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0cy5vdXRlcldpZHRoID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgcmV0dXJuIHRvSW50KGRvbS5jc3MoZWxlbWVudCwgJ3dpZHRoJykpICtcbiAgICAgICAgIHRvSW50KGRvbS5jc3MoZWxlbWVudCwgJ3BhZGRpbmdMZWZ0JykpICtcbiAgICAgICAgIHRvSW50KGRvbS5jc3MoZWxlbWVudCwgJ3BhZGRpbmdSaWdodCcpKSArXG4gICAgICAgICB0b0ludChkb20uY3NzKGVsZW1lbnQsICdib3JkZXJMZWZ0V2lkdGgnKSkgK1xuICAgICAgICAgdG9JbnQoZG9tLmNzcyhlbGVtZW50LCAnYm9yZGVyUmlnaHRXaWR0aCcpKTtcbn07XG5cbmZ1bmN0aW9uIHBzQ2xhc3NlcyhheGlzKSB7XG4gIHZhciBjbGFzc2VzID0gWydwcy0taW4tc2Nyb2xsaW5nJ107XG4gIHZhciBheGlzQ2xhc3NlcztcbiAgaWYgKHR5cGVvZiBheGlzID09PSAndW5kZWZpbmVkJykge1xuICAgIGF4aXNDbGFzc2VzID0gWydwcy0teCcsICdwcy0teSddO1xuICB9IGVsc2Uge1xuICAgIGF4aXNDbGFzc2VzID0gWydwcy0tJyArIGF4aXNdO1xuICB9XG4gIHJldHVybiBjbGFzc2VzLmNvbmNhdChheGlzQ2xhc3Nlcyk7XG59XG5cbmV4cG9ydHMuc3RhcnRTY3JvbGxpbmcgPSBmdW5jdGlvbiAoZWxlbWVudCwgYXhpcykge1xuICB2YXIgY2xhc3NlcyA9IHBzQ2xhc3NlcyhheGlzKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbGFzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNsYXNzZXNbaV0pO1xuICB9XG59O1xuXG5leHBvcnRzLnN0b3BTY3JvbGxpbmcgPSBmdW5jdGlvbiAoZWxlbWVudCwgYXhpcykge1xuICB2YXIgY2xhc3NlcyA9IHBzQ2xhc3NlcyhheGlzKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbGFzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzZXNbaV0pO1xuICB9XG59O1xuXG5leHBvcnRzLmVudiA9IHtcbiAgaXNXZWJLaXQ6IHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgJ1dlYmtpdEFwcGVhcmFuY2UnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZSxcbiAgc3VwcG9ydHNUb3VjaDogdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgKCgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpIHx8IHdpbmRvdy5Eb2N1bWVudFRvdWNoICYmIGRvY3VtZW50IGluc3RhbmNlb2Ygd2luZG93LkRvY3VtZW50VG91Y2gpLFxuICBzdXBwb3J0c0llUG9pbnRlcjogdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lm5hdmlnYXRvci5tc01heFRvdWNoUG9pbnRzICE9PSBudWxsXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZGVzdHJveSA9IHJlcXVpcmUoJy4vcGx1Z2luL2Rlc3Ryb3knKTtcbnZhciBpbml0aWFsaXplID0gcmVxdWlyZSgnLi9wbHVnaW4vaW5pdGlhbGl6ZScpO1xudmFyIHVwZGF0ZSA9IHJlcXVpcmUoJy4vcGx1Z2luL3VwZGF0ZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaW5pdGlhbGl6ZTogaW5pdGlhbGl6ZSxcbiAgdXBkYXRlOiB1cGRhdGUsXG4gIGRlc3Ryb3k6IGRlc3Ryb3lcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4ge1xuICAgIGhhbmRsZXJzOiBbJ2NsaWNrLXJhaWwnLCAnZHJhZy1zY3JvbGxiYXInLCAna2V5Ym9hcmQnLCAnd2hlZWwnLCAndG91Y2gnXSxcbiAgICBtYXhTY3JvbGxiYXJMZW5ndGg6IG51bGwsXG4gICAgbWluU2Nyb2xsYmFyTGVuZ3RoOiBudWxsLFxuICAgIHNjcm9sbFhNYXJnaW5PZmZzZXQ6IDAsXG4gICAgc2Nyb2xsWU1hcmdpbk9mZnNldDogMCxcbiAgICBzdXBwcmVzc1Njcm9sbFg6IGZhbHNlLFxuICAgIHN1cHByZXNzU2Nyb2xsWTogZmFsc2UsXG4gICAgc3dpcGVQcm9wYWdhdGlvbjogdHJ1ZSxcbiAgICBzd2lwZUVhc2luZzogdHJ1ZSxcbiAgICB1c2VCb3RoV2hlZWxBeGVzOiBmYWxzZSxcbiAgICB3aGVlbFByb3BhZ2F0aW9uOiBmYWxzZSxcbiAgICB3aGVlbFNwZWVkOiAxLFxuICAgIHRoZW1lOiAnZGVmYXVsdCdcbiAgfTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnLi4vbGliL2hlbHBlcicpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uL2xpYi9kb20nKTtcbnZhciBpbnN0YW5jZXMgPSByZXF1aXJlKCcuL2luc3RhbmNlcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHZhciBpID0gaW5zdGFuY2VzLmdldChlbGVtZW50KTtcblxuICBpZiAoIWkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpLmV2ZW50LnVuYmluZEFsbCgpO1xuICBkb20ucmVtb3ZlKGkuc2Nyb2xsYmFyWCk7XG4gIGRvbS5yZW1vdmUoaS5zY3JvbGxiYXJZKTtcbiAgZG9tLnJlbW92ZShpLnNjcm9sbGJhclhSYWlsKTtcbiAgZG9tLnJlbW92ZShpLnNjcm9sbGJhcllSYWlsKTtcbiAgXy5yZW1vdmVQc0NsYXNzZXMoZWxlbWVudCk7XG5cbiAgaW5zdGFuY2VzLnJlbW92ZShlbGVtZW50KTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpbnN0YW5jZXMgPSByZXF1aXJlKCcuLi9pbnN0YW5jZXMnKTtcbnZhciB1cGRhdGVHZW9tZXRyeSA9IHJlcXVpcmUoJy4uL3VwZGF0ZS1nZW9tZXRyeScpO1xudmFyIHVwZGF0ZVNjcm9sbCA9IHJlcXVpcmUoJy4uL3VwZGF0ZS1zY3JvbGwnKTtcblxuZnVuY3Rpb24gYmluZENsaWNrUmFpbEhhbmRsZXIoZWxlbWVudCwgaSkge1xuICBmdW5jdGlvbiBwYWdlT2Zmc2V0KGVsKSB7XG4gICAgcmV0dXJuIGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICB9XG4gIHZhciBzdG9wUHJvcGFnYXRpb24gPSBmdW5jdGlvbiAoZSkgeyBlLnN0b3BQcm9wYWdhdGlvbigpOyB9O1xuXG4gIGkuZXZlbnQuYmluZChpLnNjcm9sbGJhclksICdjbGljaycsIHN0b3BQcm9wYWdhdGlvbik7XG4gIGkuZXZlbnQuYmluZChpLnNjcm9sbGJhcllSYWlsLCAnY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBwb3NpdGlvblRvcCA9IGUucGFnZVkgLSB3aW5kb3cucGFnZVlPZmZzZXQgLSBwYWdlT2Zmc2V0KGkuc2Nyb2xsYmFyWVJhaWwpLnRvcDtcbiAgICB2YXIgZGlyZWN0aW9uID0gcG9zaXRpb25Ub3AgPiBpLnNjcm9sbGJhcllUb3AgPyAxIDogLTE7XG5cbiAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ3RvcCcsIGVsZW1lbnQuc2Nyb2xsVG9wICsgZGlyZWN0aW9uICogaS5jb250YWluZXJIZWlnaHQpO1xuICAgIHVwZGF0ZUdlb21ldHJ5KGVsZW1lbnQpO1xuXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfSk7XG5cbiAgaS5ldmVudC5iaW5kKGkuc2Nyb2xsYmFyWCwgJ2NsaWNrJywgc3RvcFByb3BhZ2F0aW9uKTtcbiAgaS5ldmVudC5iaW5kKGkuc2Nyb2xsYmFyWFJhaWwsICdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIHBvc2l0aW9uTGVmdCA9IGUucGFnZVggLSB3aW5kb3cucGFnZVhPZmZzZXQgLSBwYWdlT2Zmc2V0KGkuc2Nyb2xsYmFyWFJhaWwpLmxlZnQ7XG4gICAgdmFyIGRpcmVjdGlvbiA9IHBvc2l0aW9uTGVmdCA+IGkuc2Nyb2xsYmFyWExlZnQgPyAxIDogLTE7XG5cbiAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ2xlZnQnLCBlbGVtZW50LnNjcm9sbExlZnQgKyBkaXJlY3Rpb24gKiBpLmNvbnRhaW5lcldpZHRoKTtcbiAgICB1cGRhdGVHZW9tZXRyeShlbGVtZW50KTtcblxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHZhciBpID0gaW5zdGFuY2VzLmdldChlbGVtZW50KTtcbiAgYmluZENsaWNrUmFpbEhhbmRsZXIoZWxlbWVudCwgaSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJy4uLy4uL2xpYi9oZWxwZXInKTtcbnZhciBkb20gPSByZXF1aXJlKCcuLi8uLi9saWIvZG9tJyk7XG52YXIgaW5zdGFuY2VzID0gcmVxdWlyZSgnLi4vaW5zdGFuY2VzJyk7XG52YXIgdXBkYXRlR2VvbWV0cnkgPSByZXF1aXJlKCcuLi91cGRhdGUtZ2VvbWV0cnknKTtcbnZhciB1cGRhdGVTY3JvbGwgPSByZXF1aXJlKCcuLi91cGRhdGUtc2Nyb2xsJyk7XG5cbmZ1bmN0aW9uIGJpbmRNb3VzZVNjcm9sbFhIYW5kbGVyKGVsZW1lbnQsIGkpIHtcbiAgdmFyIGN1cnJlbnRMZWZ0ID0gbnVsbDtcbiAgdmFyIGN1cnJlbnRQYWdlWCA9IG51bGw7XG5cbiAgZnVuY3Rpb24gdXBkYXRlU2Nyb2xsTGVmdChkZWx0YVgpIHtcbiAgICB2YXIgbmV3TGVmdCA9IGN1cnJlbnRMZWZ0ICsgKGRlbHRhWCAqIGkucmFpbFhSYXRpbyk7XG4gICAgdmFyIG1heExlZnQgPSBNYXRoLm1heCgwLCBpLnNjcm9sbGJhclhSYWlsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQpICsgKGkucmFpbFhSYXRpbyAqIChpLnJhaWxYV2lkdGggLSBpLnNjcm9sbGJhclhXaWR0aCkpO1xuXG4gICAgaWYgKG5ld0xlZnQgPCAwKSB7XG4gICAgICBpLnNjcm9sbGJhclhMZWZ0ID0gMDtcbiAgICB9IGVsc2UgaWYgKG5ld0xlZnQgPiBtYXhMZWZ0KSB7XG4gICAgICBpLnNjcm9sbGJhclhMZWZ0ID0gbWF4TGVmdDtcbiAgICB9IGVsc2Uge1xuICAgICAgaS5zY3JvbGxiYXJYTGVmdCA9IG5ld0xlZnQ7XG4gICAgfVxuXG4gICAgdmFyIHNjcm9sbExlZnQgPSBfLnRvSW50KGkuc2Nyb2xsYmFyWExlZnQgKiAoaS5jb250ZW50V2lkdGggLSBpLmNvbnRhaW5lcldpZHRoKSAvIChpLmNvbnRhaW5lcldpZHRoIC0gKGkucmFpbFhSYXRpbyAqIGkuc2Nyb2xsYmFyWFdpZHRoKSkpIC0gaS5uZWdhdGl2ZVNjcm9sbEFkanVzdG1lbnQ7XG4gICAgdXBkYXRlU2Nyb2xsKGVsZW1lbnQsICdsZWZ0Jywgc2Nyb2xsTGVmdCk7XG4gIH1cblxuICB2YXIgbW91c2VNb3ZlSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdXBkYXRlU2Nyb2xsTGVmdChlLnBhZ2VYIC0gY3VycmVudFBhZ2VYKTtcbiAgICB1cGRhdGVHZW9tZXRyeShlbGVtZW50KTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfTtcblxuICB2YXIgbW91c2VVcEhhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgXy5zdG9wU2Nyb2xsaW5nKGVsZW1lbnQsICd4Jyk7XG4gICAgaS5ldmVudC51bmJpbmQoaS5vd25lckRvY3VtZW50LCAnbW91c2Vtb3ZlJywgbW91c2VNb3ZlSGFuZGxlcik7XG4gIH07XG5cbiAgaS5ldmVudC5iaW5kKGkuc2Nyb2xsYmFyWCwgJ21vdXNlZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgY3VycmVudFBhZ2VYID0gZS5wYWdlWDtcbiAgICBjdXJyZW50TGVmdCA9IF8udG9JbnQoZG9tLmNzcyhpLnNjcm9sbGJhclgsICdsZWZ0JykpICogaS5yYWlsWFJhdGlvO1xuICAgIF8uc3RhcnRTY3JvbGxpbmcoZWxlbWVudCwgJ3gnKTtcblxuICAgIGkuZXZlbnQuYmluZChpLm93bmVyRG9jdW1lbnQsICdtb3VzZW1vdmUnLCBtb3VzZU1vdmVIYW5kbGVyKTtcbiAgICBpLmV2ZW50Lm9uY2UoaS5vd25lckRvY3VtZW50LCAnbW91c2V1cCcsIG1vdXNlVXBIYW5kbGVyKTtcblxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gYmluZE1vdXNlU2Nyb2xsWUhhbmRsZXIoZWxlbWVudCwgaSkge1xuICB2YXIgY3VycmVudFRvcCA9IG51bGw7XG4gIHZhciBjdXJyZW50UGFnZVkgPSBudWxsO1xuXG4gIGZ1bmN0aW9uIHVwZGF0ZVNjcm9sbFRvcChkZWx0YVkpIHtcbiAgICB2YXIgbmV3VG9wID0gY3VycmVudFRvcCArIChkZWx0YVkgKiBpLnJhaWxZUmF0aW8pO1xuICAgIHZhciBtYXhUb3AgPSBNYXRoLm1heCgwLCBpLnNjcm9sbGJhcllSYWlsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCkgKyAoaS5yYWlsWVJhdGlvICogKGkucmFpbFlIZWlnaHQgLSBpLnNjcm9sbGJhcllIZWlnaHQpKTtcblxuICAgIGlmIChuZXdUb3AgPCAwKSB7XG4gICAgICBpLnNjcm9sbGJhcllUb3AgPSAwO1xuICAgIH0gZWxzZSBpZiAobmV3VG9wID4gbWF4VG9wKSB7XG4gICAgICBpLnNjcm9sbGJhcllUb3AgPSBtYXhUb3A7XG4gICAgfSBlbHNlIHtcbiAgICAgIGkuc2Nyb2xsYmFyWVRvcCA9IG5ld1RvcDtcbiAgICB9XG5cbiAgICB2YXIgc2Nyb2xsVG9wID0gXy50b0ludChpLnNjcm9sbGJhcllUb3AgKiAoaS5jb250ZW50SGVpZ2h0IC0gaS5jb250YWluZXJIZWlnaHQpIC8gKGkuY29udGFpbmVySGVpZ2h0IC0gKGkucmFpbFlSYXRpbyAqIGkuc2Nyb2xsYmFyWUhlaWdodCkpKTtcbiAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ3RvcCcsIHNjcm9sbFRvcCk7XG4gIH1cblxuICB2YXIgbW91c2VNb3ZlSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdXBkYXRlU2Nyb2xsVG9wKGUucGFnZVkgLSBjdXJyZW50UGFnZVkpO1xuICAgIHVwZGF0ZUdlb21ldHJ5KGVsZW1lbnQpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9O1xuXG4gIHZhciBtb3VzZVVwSGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgICBfLnN0b3BTY3JvbGxpbmcoZWxlbWVudCwgJ3knKTtcbiAgICBpLmV2ZW50LnVuYmluZChpLm93bmVyRG9jdW1lbnQsICdtb3VzZW1vdmUnLCBtb3VzZU1vdmVIYW5kbGVyKTtcbiAgfTtcblxuICBpLmV2ZW50LmJpbmQoaS5zY3JvbGxiYXJZLCAnbW91c2Vkb3duJywgZnVuY3Rpb24gKGUpIHtcbiAgICBjdXJyZW50UGFnZVkgPSBlLnBhZ2VZO1xuICAgIGN1cnJlbnRUb3AgPSBfLnRvSW50KGRvbS5jc3MoaS5zY3JvbGxiYXJZLCAndG9wJykpICogaS5yYWlsWVJhdGlvO1xuICAgIF8uc3RhcnRTY3JvbGxpbmcoZWxlbWVudCwgJ3knKTtcblxuICAgIGkuZXZlbnQuYmluZChpLm93bmVyRG9jdW1lbnQsICdtb3VzZW1vdmUnLCBtb3VzZU1vdmVIYW5kbGVyKTtcbiAgICBpLmV2ZW50Lm9uY2UoaS5vd25lckRvY3VtZW50LCAnbW91c2V1cCcsIG1vdXNlVXBIYW5kbGVyKTtcblxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICB2YXIgaSA9IGluc3RhbmNlcy5nZXQoZWxlbWVudCk7XG4gIGJpbmRNb3VzZVNjcm9sbFhIYW5kbGVyKGVsZW1lbnQsIGkpO1xuICBiaW5kTW91c2VTY3JvbGxZSGFuZGxlcihlbGVtZW50LCBpKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnLi4vLi4vbGliL2hlbHBlcicpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uLy4uL2xpYi9kb20nKTtcbnZhciBpbnN0YW5jZXMgPSByZXF1aXJlKCcuLi9pbnN0YW5jZXMnKTtcbnZhciB1cGRhdGVHZW9tZXRyeSA9IHJlcXVpcmUoJy4uL3VwZGF0ZS1nZW9tZXRyeScpO1xudmFyIHVwZGF0ZVNjcm9sbCA9IHJlcXVpcmUoJy4uL3VwZGF0ZS1zY3JvbGwnKTtcblxuZnVuY3Rpb24gYmluZEtleWJvYXJkSGFuZGxlcihlbGVtZW50LCBpKSB7XG4gIHZhciBob3ZlcmVkID0gZmFsc2U7XG4gIGkuZXZlbnQuYmluZChlbGVtZW50LCAnbW91c2VlbnRlcicsIGZ1bmN0aW9uICgpIHtcbiAgICBob3ZlcmVkID0gdHJ1ZTtcbiAgfSk7XG4gIGkuZXZlbnQuYmluZChlbGVtZW50LCAnbW91c2VsZWF2ZScsIGZ1bmN0aW9uICgpIHtcbiAgICBob3ZlcmVkID0gZmFsc2U7XG4gIH0pO1xuXG4gIHZhciBzaG91bGRQcmV2ZW50ID0gZmFsc2U7XG4gIGZ1bmN0aW9uIHNob3VsZFByZXZlbnREZWZhdWx0KGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgdmFyIHNjcm9sbFRvcCA9IGVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgIGlmIChkZWx0YVggPT09IDApIHtcbiAgICAgIGlmICghaS5zY3JvbGxiYXJZQWN0aXZlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICgoc2Nyb2xsVG9wID09PSAwICYmIGRlbHRhWSA+IDApIHx8IChzY3JvbGxUb3AgPj0gaS5jb250ZW50SGVpZ2h0IC0gaS5jb250YWluZXJIZWlnaHQgJiYgZGVsdGFZIDwgMCkpIHtcbiAgICAgICAgcmV0dXJuICFpLnNldHRpbmdzLndoZWVsUHJvcGFnYXRpb247XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHNjcm9sbExlZnQgPSBlbGVtZW50LnNjcm9sbExlZnQ7XG4gICAgaWYgKGRlbHRhWSA9PT0gMCkge1xuICAgICAgaWYgKCFpLnNjcm9sbGJhclhBY3RpdmUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKChzY3JvbGxMZWZ0ID09PSAwICYmIGRlbHRhWCA8IDApIHx8IChzY3JvbGxMZWZ0ID49IGkuY29udGVudFdpZHRoIC0gaS5jb250YWluZXJXaWR0aCAmJiBkZWx0YVggPiAwKSkge1xuICAgICAgICByZXR1cm4gIWkuc2V0dGluZ3Mud2hlZWxQcm9wYWdhdGlvbjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpLmV2ZW50LmJpbmQoaS5vd25lckRvY3VtZW50LCAna2V5ZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKChlLmlzRGVmYXVsdFByZXZlbnRlZCAmJiBlLmlzRGVmYXVsdFByZXZlbnRlZCgpKSB8fCBlLmRlZmF1bHRQcmV2ZW50ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgZm9jdXNlZCA9IGRvbS5tYXRjaGVzKGkuc2Nyb2xsYmFyWCwgJzpmb2N1cycpIHx8XG4gICAgICAgICAgICAgICAgICBkb20ubWF0Y2hlcyhpLnNjcm9sbGJhclksICc6Zm9jdXMnKTtcblxuICAgIGlmICghaG92ZXJlZCAmJiAhZm9jdXNlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBhY3RpdmVFbGVtZW50ID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudCA/IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgOiBpLm93bmVyRG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcbiAgICBpZiAoYWN0aXZlRWxlbWVudCkge1xuICAgICAgaWYgKGFjdGl2ZUVsZW1lbnQudGFnTmFtZSA9PT0gJ0lGUkFNRScpIHtcbiAgICAgICAgYWN0aXZlRWxlbWVudCA9IGFjdGl2ZUVsZW1lbnQuY29udGVudERvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBnbyBkZWVwZXIgaWYgZWxlbWVudCBpcyBhIHdlYmNvbXBvbmVudFxuICAgICAgICB3aGlsZSAoYWN0aXZlRWxlbWVudC5zaGFkb3dSb290KSB7XG4gICAgICAgICAgYWN0aXZlRWxlbWVudCA9IGFjdGl2ZUVsZW1lbnQuc2hhZG93Um9vdC5hY3RpdmVFbGVtZW50O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoXy5pc0VkaXRhYmxlKGFjdGl2ZUVsZW1lbnQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgZGVsdGFYID0gMDtcbiAgICB2YXIgZGVsdGFZID0gMDtcblxuICAgIHN3aXRjaCAoZS53aGljaCkge1xuICAgIGNhc2UgMzc6IC8vIGxlZnRcbiAgICAgIGlmIChlLm1ldGFLZXkpIHtcbiAgICAgICAgZGVsdGFYID0gLWkuY29udGVudFdpZHRoO1xuICAgICAgfSBlbHNlIGlmIChlLmFsdEtleSkge1xuICAgICAgICBkZWx0YVggPSAtaS5jb250YWluZXJXaWR0aDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlbHRhWCA9IC0zMDtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMzg6IC8vIHVwXG4gICAgICBpZiAoZS5tZXRhS2V5KSB7XG4gICAgICAgIGRlbHRhWSA9IGkuY29udGVudEhlaWdodDtcbiAgICAgIH0gZWxzZSBpZiAoZS5hbHRLZXkpIHtcbiAgICAgICAgZGVsdGFZID0gaS5jb250YWluZXJIZWlnaHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWx0YVkgPSAzMDtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICBpZiAoZS5tZXRhS2V5KSB7XG4gICAgICAgIGRlbHRhWCA9IGkuY29udGVudFdpZHRoO1xuICAgICAgfSBlbHNlIGlmIChlLmFsdEtleSkge1xuICAgICAgICBkZWx0YVggPSBpLmNvbnRhaW5lcldpZHRoO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVsdGFYID0gMzA7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIDQwOiAvLyBkb3duXG4gICAgICBpZiAoZS5tZXRhS2V5KSB7XG4gICAgICAgIGRlbHRhWSA9IC1pLmNvbnRlbnRIZWlnaHQ7XG4gICAgICB9IGVsc2UgaWYgKGUuYWx0S2V5KSB7XG4gICAgICAgIGRlbHRhWSA9IC1pLmNvbnRhaW5lckhlaWdodDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlbHRhWSA9IC0zMDtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMzM6IC8vIHBhZ2UgdXBcbiAgICAgIGRlbHRhWSA9IDkwO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzMjogLy8gc3BhY2UgYmFyXG4gICAgICBpZiAoZS5zaGlmdEtleSkge1xuICAgICAgICBkZWx0YVkgPSA5MDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlbHRhWSA9IC05MDtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMzQ6IC8vIHBhZ2UgZG93blxuICAgICAgZGVsdGFZID0gLTkwO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzNTogLy8gZW5kXG4gICAgICBpZiAoZS5jdHJsS2V5KSB7XG4gICAgICAgIGRlbHRhWSA9IC1pLmNvbnRlbnRIZWlnaHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWx0YVkgPSAtaS5jb250YWluZXJIZWlnaHQ7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM2OiAvLyBob21lXG4gICAgICBpZiAoZS5jdHJsS2V5KSB7XG4gICAgICAgIGRlbHRhWSA9IGVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVsdGFZID0gaS5jb250YWluZXJIZWlnaHQ7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAndG9wJywgZWxlbWVudC5zY3JvbGxUb3AgLSBkZWx0YVkpO1xuICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAnbGVmdCcsIGVsZW1lbnQuc2Nyb2xsTGVmdCArIGRlbHRhWCk7XG4gICAgdXBkYXRlR2VvbWV0cnkoZWxlbWVudCk7XG5cbiAgICBzaG91bGRQcmV2ZW50ID0gc2hvdWxkUHJldmVudERlZmF1bHQoZGVsdGFYLCBkZWx0YVkpO1xuICAgIGlmIChzaG91bGRQcmV2ZW50KSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICB2YXIgaSA9IGluc3RhbmNlcy5nZXQoZWxlbWVudCk7XG4gIGJpbmRLZXlib2FyZEhhbmRsZXIoZWxlbWVudCwgaSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaW5zdGFuY2VzID0gcmVxdWlyZSgnLi4vaW5zdGFuY2VzJyk7XG52YXIgdXBkYXRlR2VvbWV0cnkgPSByZXF1aXJlKCcuLi91cGRhdGUtZ2VvbWV0cnknKTtcbnZhciB1cGRhdGVTY3JvbGwgPSByZXF1aXJlKCcuLi91cGRhdGUtc2Nyb2xsJyk7XG5cbmZ1bmN0aW9uIGJpbmRNb3VzZVdoZWVsSGFuZGxlcihlbGVtZW50LCBpKSB7XG4gIHZhciBzaG91bGRQcmV2ZW50ID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gc2hvdWxkUHJldmVudERlZmF1bHQoZGVsdGFYLCBkZWx0YVkpIHtcbiAgICB2YXIgc2Nyb2xsVG9wID0gZWxlbWVudC5zY3JvbGxUb3A7XG4gICAgaWYgKGRlbHRhWCA9PT0gMCkge1xuICAgICAgaWYgKCFpLnNjcm9sbGJhcllBY3RpdmUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKChzY3JvbGxUb3AgPT09IDAgJiYgZGVsdGFZID4gMCkgfHwgKHNjcm9sbFRvcCA+PSBpLmNvbnRlbnRIZWlnaHQgLSBpLmNvbnRhaW5lckhlaWdodCAmJiBkZWx0YVkgPCAwKSkge1xuICAgICAgICByZXR1cm4gIWkuc2V0dGluZ3Mud2hlZWxQcm9wYWdhdGlvbjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgc2Nyb2xsTGVmdCA9IGVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgICBpZiAoZGVsdGFZID09PSAwKSB7XG4gICAgICBpZiAoIWkuc2Nyb2xsYmFyWEFjdGl2ZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoKHNjcm9sbExlZnQgPT09IDAgJiYgZGVsdGFYIDwgMCkgfHwgKHNjcm9sbExlZnQgPj0gaS5jb250ZW50V2lkdGggLSBpLmNvbnRhaW5lcldpZHRoICYmIGRlbHRhWCA+IDApKSB7XG4gICAgICAgIHJldHVybiAhaS5zZXR0aW5ncy53aGVlbFByb3BhZ2F0aW9uO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldERlbHRhRnJvbUV2ZW50KGUpIHtcbiAgICB2YXIgZGVsdGFYID0gZS5kZWx0YVg7XG4gICAgdmFyIGRlbHRhWSA9IC0xICogZS5kZWx0YVk7XG5cbiAgICBpZiAodHlwZW9mIGRlbHRhWCA9PT0gXCJ1bmRlZmluZWRcIiB8fCB0eXBlb2YgZGVsdGFZID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAvLyBPUyBYIFNhZmFyaVxuICAgICAgZGVsdGFYID0gLTEgKiBlLndoZWVsRGVsdGFYIC8gNjtcbiAgICAgIGRlbHRhWSA9IGUud2hlZWxEZWx0YVkgLyA2O1xuICAgIH1cblxuICAgIGlmIChlLmRlbHRhTW9kZSAmJiBlLmRlbHRhTW9kZSA9PT0gMSkge1xuICAgICAgLy8gRmlyZWZveCBpbiBkZWx0YU1vZGUgMTogTGluZSBzY3JvbGxpbmdcbiAgICAgIGRlbHRhWCAqPSAxMDtcbiAgICAgIGRlbHRhWSAqPSAxMDtcbiAgICB9XG5cbiAgICBpZiAoZGVsdGFYICE9PSBkZWx0YVggJiYgZGVsdGFZICE9PSBkZWx0YVkvKiBOYU4gY2hlY2tzICovKSB7XG4gICAgICAvLyBJRSBpbiBzb21lIG1vdXNlIGRyaXZlcnNcbiAgICAgIGRlbHRhWCA9IDA7XG4gICAgICBkZWx0YVkgPSBlLndoZWVsRGVsdGE7XG4gICAgfVxuXG4gICAgaWYgKGUuc2hpZnRLZXkpIHtcbiAgICAgIC8vIHJldmVyc2UgYXhpcyB3aXRoIHNoaWZ0IGtleVxuICAgICAgcmV0dXJuIFstZGVsdGFZLCAtZGVsdGFYXTtcbiAgICB9XG4gICAgcmV0dXJuIFtkZWx0YVgsIGRlbHRhWV07XG4gIH1cblxuICBmdW5jdGlvbiBzaG91bGRCZUNvbnN1bWVkQnlDaGlsZChkZWx0YVgsIGRlbHRhWSkge1xuICAgIHZhciBjaGlsZCA9IGVsZW1lbnQucXVlcnlTZWxlY3RvcigndGV4dGFyZWE6aG92ZXIsIHNlbGVjdFttdWx0aXBsZV06aG92ZXIsIC5wcy1jaGlsZDpob3ZlcicpO1xuICAgIGlmIChjaGlsZCkge1xuICAgICAgdmFyIHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoY2hpbGQpO1xuICAgICAgdmFyIG92ZXJmbG93ID0gW1xuICAgICAgICBzdHlsZS5vdmVyZmxvdyxcbiAgICAgICAgc3R5bGUub3ZlcmZsb3dYLFxuICAgICAgICBzdHlsZS5vdmVyZmxvd1lcbiAgICAgIF0uam9pbignJyk7XG5cbiAgICAgIGlmICghb3ZlcmZsb3cubWF0Y2goLyhzY3JvbGx8YXV0bykvKSkge1xuICAgICAgICAvLyBpZiBub3Qgc2Nyb2xsYWJsZVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHZhciBtYXhTY3JvbGxUb3AgPSBjaGlsZC5zY3JvbGxIZWlnaHQgLSBjaGlsZC5jbGllbnRIZWlnaHQ7XG4gICAgICBpZiAobWF4U2Nyb2xsVG9wID4gMCkge1xuICAgICAgICBpZiAoIShjaGlsZC5zY3JvbGxUb3AgPT09IDAgJiYgZGVsdGFZID4gMCkgJiYgIShjaGlsZC5zY3JvbGxUb3AgPT09IG1heFNjcm9sbFRvcCAmJiBkZWx0YVkgPCAwKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YXIgbWF4U2Nyb2xsTGVmdCA9IGNoaWxkLnNjcm9sbExlZnQgLSBjaGlsZC5jbGllbnRXaWR0aDtcbiAgICAgIGlmIChtYXhTY3JvbGxMZWZ0ID4gMCkge1xuICAgICAgICBpZiAoIShjaGlsZC5zY3JvbGxMZWZ0ID09PSAwICYmIGRlbHRhWCA8IDApICYmICEoY2hpbGQuc2Nyb2xsTGVmdCA9PT0gbWF4U2Nyb2xsTGVmdCAmJiBkZWx0YVggPiAwKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1vdXNld2hlZWxIYW5kbGVyKGUpIHtcbiAgICB2YXIgZGVsdGEgPSBnZXREZWx0YUZyb21FdmVudChlKTtcblxuICAgIHZhciBkZWx0YVggPSBkZWx0YVswXTtcbiAgICB2YXIgZGVsdGFZID0gZGVsdGFbMV07XG5cbiAgICBpZiAoc2hvdWxkQmVDb25zdW1lZEJ5Q2hpbGQoZGVsdGFYLCBkZWx0YVkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2hvdWxkUHJldmVudCA9IGZhbHNlO1xuICAgIGlmICghaS5zZXR0aW5ncy51c2VCb3RoV2hlZWxBeGVzKSB7XG4gICAgICAvLyBkZWx0YVggd2lsbCBvbmx5IGJlIHVzZWQgZm9yIGhvcml6b250YWwgc2Nyb2xsaW5nIGFuZCBkZWx0YVkgd2lsbFxuICAgICAgLy8gb25seSBiZSB1c2VkIGZvciB2ZXJ0aWNhbCBzY3JvbGxpbmcgLSB0aGlzIGlzIHRoZSBkZWZhdWx0XG4gICAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ3RvcCcsIGVsZW1lbnQuc2Nyb2xsVG9wIC0gKGRlbHRhWSAqIGkuc2V0dGluZ3Mud2hlZWxTcGVlZCkpO1xuICAgICAgdXBkYXRlU2Nyb2xsKGVsZW1lbnQsICdsZWZ0JywgZWxlbWVudC5zY3JvbGxMZWZ0ICsgKGRlbHRhWCAqIGkuc2V0dGluZ3Mud2hlZWxTcGVlZCkpO1xuICAgIH0gZWxzZSBpZiAoaS5zY3JvbGxiYXJZQWN0aXZlICYmICFpLnNjcm9sbGJhclhBY3RpdmUpIHtcbiAgICAgIC8vIG9ubHkgdmVydGljYWwgc2Nyb2xsYmFyIGlzIGFjdGl2ZSBhbmQgdXNlQm90aFdoZWVsQXhlcyBvcHRpb24gaXNcbiAgICAgIC8vIGFjdGl2ZSwgc28gbGV0J3Mgc2Nyb2xsIHZlcnRpY2FsIGJhciB1c2luZyBib3RoIG1vdXNlIHdoZWVsIGF4ZXNcbiAgICAgIGlmIChkZWx0YVkpIHtcbiAgICAgICAgdXBkYXRlU2Nyb2xsKGVsZW1lbnQsICd0b3AnLCBlbGVtZW50LnNjcm9sbFRvcCAtIChkZWx0YVkgKiBpLnNldHRpbmdzLndoZWVsU3BlZWQpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAndG9wJywgZWxlbWVudC5zY3JvbGxUb3AgKyAoZGVsdGFYICogaS5zZXR0aW5ncy53aGVlbFNwZWVkKSk7XG4gICAgICB9XG4gICAgICBzaG91bGRQcmV2ZW50ID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKGkuc2Nyb2xsYmFyWEFjdGl2ZSAmJiAhaS5zY3JvbGxiYXJZQWN0aXZlKSB7XG4gICAgICAvLyB1c2VCb3RoV2hlZWxBeGVzIGFuZCBvbmx5IGhvcml6b250YWwgYmFyIGlzIGFjdGl2ZSwgc28gdXNlIGJvdGhcbiAgICAgIC8vIHdoZWVsIGF4ZXMgZm9yIGhvcml6b250YWwgYmFyXG4gICAgICBpZiAoZGVsdGFYKSB7XG4gICAgICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAnbGVmdCcsIGVsZW1lbnQuc2Nyb2xsTGVmdCArIChkZWx0YVggKiBpLnNldHRpbmdzLndoZWVsU3BlZWQpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAnbGVmdCcsIGVsZW1lbnQuc2Nyb2xsTGVmdCAtIChkZWx0YVkgKiBpLnNldHRpbmdzLndoZWVsU3BlZWQpKTtcbiAgICAgIH1cbiAgICAgIHNob3VsZFByZXZlbnQgPSB0cnVlO1xuICAgIH1cblxuICAgIHVwZGF0ZUdlb21ldHJ5KGVsZW1lbnQpO1xuXG4gICAgc2hvdWxkUHJldmVudCA9IChzaG91bGRQcmV2ZW50IHx8IHNob3VsZFByZXZlbnREZWZhdWx0KGRlbHRhWCwgZGVsdGFZKSk7XG4gICAgaWYgKHNob3VsZFByZXZlbnQpIHtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHR5cGVvZiB3aW5kb3cub253aGVlbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIGkuZXZlbnQuYmluZChlbGVtZW50LCAnd2hlZWwnLCBtb3VzZXdoZWVsSGFuZGxlcik7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdy5vbm1vdXNld2hlZWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBpLmV2ZW50LmJpbmQoZWxlbWVudCwgJ21vdXNld2hlZWwnLCBtb3VzZXdoZWVsSGFuZGxlcik7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICB2YXIgaSA9IGluc3RhbmNlcy5nZXQoZWxlbWVudCk7XG4gIGJpbmRNb3VzZVdoZWVsSGFuZGxlcihlbGVtZW50LCBpKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpbnN0YW5jZXMgPSByZXF1aXJlKCcuLi9pbnN0YW5jZXMnKTtcbnZhciB1cGRhdGVHZW9tZXRyeSA9IHJlcXVpcmUoJy4uL3VwZGF0ZS1nZW9tZXRyeScpO1xuXG5mdW5jdGlvbiBiaW5kTmF0aXZlU2Nyb2xsSGFuZGxlcihlbGVtZW50LCBpKSB7XG4gIGkuZXZlbnQuYmluZChlbGVtZW50LCAnc2Nyb2xsJywgZnVuY3Rpb24gKCkge1xuICAgIHVwZGF0ZUdlb21ldHJ5KGVsZW1lbnQpO1xuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICB2YXIgaSA9IGluc3RhbmNlcy5nZXQoZWxlbWVudCk7XG4gIGJpbmROYXRpdmVTY3JvbGxIYW5kbGVyKGVsZW1lbnQsIGkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCcuLi8uLi9saWIvaGVscGVyJyk7XG52YXIgaW5zdGFuY2VzID0gcmVxdWlyZSgnLi4vaW5zdGFuY2VzJyk7XG52YXIgdXBkYXRlR2VvbWV0cnkgPSByZXF1aXJlKCcuLi91cGRhdGUtZ2VvbWV0cnknKTtcbnZhciB1cGRhdGVTY3JvbGwgPSByZXF1aXJlKCcuLi91cGRhdGUtc2Nyb2xsJyk7XG5cbmZ1bmN0aW9uIGJpbmRTZWxlY3Rpb25IYW5kbGVyKGVsZW1lbnQsIGkpIHtcbiAgZnVuY3Rpb24gZ2V0UmFuZ2VOb2RlKCkge1xuICAgIHZhciBzZWxlY3Rpb24gPSB3aW5kb3cuZ2V0U2VsZWN0aW9uID8gd2luZG93LmdldFNlbGVjdGlvbigpIDpcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0U2VsZWN0aW9uID8gZG9jdW1lbnQuZ2V0U2VsZWN0aW9uKCkgOiAnJztcbiAgICBpZiAoc2VsZWN0aW9uLnRvU3RyaW5nKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHNlbGVjdGlvbi5nZXRSYW5nZUF0KDApLmNvbW1vbkFuY2VzdG9yQ29udGFpbmVyO1xuICAgIH1cbiAgfVxuXG4gIHZhciBzY3JvbGxpbmdMb29wID0gbnVsbDtcbiAgdmFyIHNjcm9sbERpZmYgPSB7dG9wOiAwLCBsZWZ0OiAwfTtcbiAgZnVuY3Rpb24gc3RhcnRTY3JvbGxpbmcoKSB7XG4gICAgaWYgKCFzY3JvbGxpbmdMb29wKSB7XG4gICAgICBzY3JvbGxpbmdMb29wID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWluc3RhbmNlcy5nZXQoZWxlbWVudCkpIHtcbiAgICAgICAgICBjbGVhckludGVydmFsKHNjcm9sbGluZ0xvb3ApO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAndG9wJywgZWxlbWVudC5zY3JvbGxUb3AgKyBzY3JvbGxEaWZmLnRvcCk7XG4gICAgICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAnbGVmdCcsIGVsZW1lbnQuc2Nyb2xsTGVmdCArIHNjcm9sbERpZmYubGVmdCk7XG4gICAgICAgIHVwZGF0ZUdlb21ldHJ5KGVsZW1lbnQpO1xuICAgICAgfSwgNTApOyAvLyBldmVyeSAuMSBzZWNcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gc3RvcFNjcm9sbGluZygpIHtcbiAgICBpZiAoc2Nyb2xsaW5nTG9vcCkge1xuICAgICAgY2xlYXJJbnRlcnZhbChzY3JvbGxpbmdMb29wKTtcbiAgICAgIHNjcm9sbGluZ0xvb3AgPSBudWxsO1xuICAgIH1cbiAgICBfLnN0b3BTY3JvbGxpbmcoZWxlbWVudCk7XG4gIH1cblxuICB2YXIgaXNTZWxlY3RlZCA9IGZhbHNlO1xuICBpLmV2ZW50LmJpbmQoaS5vd25lckRvY3VtZW50LCAnc2VsZWN0aW9uY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgIGlmIChlbGVtZW50LmNvbnRhaW5zKGdldFJhbmdlTm9kZSgpKSkge1xuICAgICAgaXNTZWxlY3RlZCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlzU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgIHN0b3BTY3JvbGxpbmcoKTtcbiAgICB9XG4gIH0pO1xuICBpLmV2ZW50LmJpbmQod2luZG93LCAnbW91c2V1cCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoaXNTZWxlY3RlZCkge1xuICAgICAgaXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgc3RvcFNjcm9sbGluZygpO1xuICAgIH1cbiAgfSk7XG4gIGkuZXZlbnQuYmluZCh3aW5kb3csICdrZXl1cCcsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoaXNTZWxlY3RlZCkge1xuICAgICAgaXNTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgc3RvcFNjcm9sbGluZygpO1xuICAgIH1cbiAgfSk7XG5cbiAgaS5ldmVudC5iaW5kKHdpbmRvdywgJ21vdXNlbW92ZScsIGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKGlzU2VsZWN0ZWQpIHtcbiAgICAgIHZhciBtb3VzZVBvc2l0aW9uID0ge3g6IGUucGFnZVgsIHk6IGUucGFnZVl9O1xuICAgICAgdmFyIGNvbnRhaW5lckdlb21ldHJ5ID0ge1xuICAgICAgICBsZWZ0OiBlbGVtZW50Lm9mZnNldExlZnQsXG4gICAgICAgIHJpZ2h0OiBlbGVtZW50Lm9mZnNldExlZnQgKyBlbGVtZW50Lm9mZnNldFdpZHRoLFxuICAgICAgICB0b3A6IGVsZW1lbnQub2Zmc2V0VG9wLFxuICAgICAgICBib3R0b206IGVsZW1lbnQub2Zmc2V0VG9wICsgZWxlbWVudC5vZmZzZXRIZWlnaHRcbiAgICAgIH07XG5cbiAgICAgIGlmIChtb3VzZVBvc2l0aW9uLnggPCBjb250YWluZXJHZW9tZXRyeS5sZWZ0ICsgMykge1xuICAgICAgICBzY3JvbGxEaWZmLmxlZnQgPSAtNTtcbiAgICAgICAgXy5zdGFydFNjcm9sbGluZyhlbGVtZW50LCAneCcpO1xuICAgICAgfSBlbHNlIGlmIChtb3VzZVBvc2l0aW9uLnggPiBjb250YWluZXJHZW9tZXRyeS5yaWdodCAtIDMpIHtcbiAgICAgICAgc2Nyb2xsRGlmZi5sZWZ0ID0gNTtcbiAgICAgICAgXy5zdGFydFNjcm9sbGluZyhlbGVtZW50LCAneCcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2Nyb2xsRGlmZi5sZWZ0ID0gMDtcbiAgICAgIH1cblxuICAgICAgaWYgKG1vdXNlUG9zaXRpb24ueSA8IGNvbnRhaW5lckdlb21ldHJ5LnRvcCArIDMpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5lckdlb21ldHJ5LnRvcCArIDMgLSBtb3VzZVBvc2l0aW9uLnkgPCA1KSB7XG4gICAgICAgICAgc2Nyb2xsRGlmZi50b3AgPSAtNTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzY3JvbGxEaWZmLnRvcCA9IC0yMDtcbiAgICAgICAgfVxuICAgICAgICBfLnN0YXJ0U2Nyb2xsaW5nKGVsZW1lbnQsICd5Jyk7XG4gICAgICB9IGVsc2UgaWYgKG1vdXNlUG9zaXRpb24ueSA+IGNvbnRhaW5lckdlb21ldHJ5LmJvdHRvbSAtIDMpIHtcbiAgICAgICAgaWYgKG1vdXNlUG9zaXRpb24ueSAtIGNvbnRhaW5lckdlb21ldHJ5LmJvdHRvbSArIDMgPCA1KSB7XG4gICAgICAgICAgc2Nyb2xsRGlmZi50b3AgPSA1O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNjcm9sbERpZmYudG9wID0gMjA7XG4gICAgICAgIH1cbiAgICAgICAgXy5zdGFydFNjcm9sbGluZyhlbGVtZW50LCAneScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2Nyb2xsRGlmZi50b3AgPSAwO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2Nyb2xsRGlmZi50b3AgPT09IDAgJiYgc2Nyb2xsRGlmZi5sZWZ0ID09PSAwKSB7XG4gICAgICAgIHN0b3BTY3JvbGxpbmcoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXJ0U2Nyb2xsaW5nKCk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICB2YXIgaSA9IGluc3RhbmNlcy5nZXQoZWxlbWVudCk7XG4gIGJpbmRTZWxlY3Rpb25IYW5kbGVyKGVsZW1lbnQsIGkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCcuLi8uLi9saWIvaGVscGVyJyk7XG52YXIgaW5zdGFuY2VzID0gcmVxdWlyZSgnLi4vaW5zdGFuY2VzJyk7XG52YXIgdXBkYXRlR2VvbWV0cnkgPSByZXF1aXJlKCcuLi91cGRhdGUtZ2VvbWV0cnknKTtcbnZhciB1cGRhdGVTY3JvbGwgPSByZXF1aXJlKCcuLi91cGRhdGUtc2Nyb2xsJyk7XG5cbmZ1bmN0aW9uIGJpbmRUb3VjaEhhbmRsZXIoZWxlbWVudCwgaSwgc3VwcG9ydHNUb3VjaCwgc3VwcG9ydHNJZVBvaW50ZXIpIHtcbiAgZnVuY3Rpb24gc2hvdWxkUHJldmVudERlZmF1bHQoZGVsdGFYLCBkZWx0YVkpIHtcbiAgICB2YXIgc2Nyb2xsVG9wID0gZWxlbWVudC5zY3JvbGxUb3A7XG4gICAgdmFyIHNjcm9sbExlZnQgPSBlbGVtZW50LnNjcm9sbExlZnQ7XG4gICAgdmFyIG1hZ25pdHVkZVggPSBNYXRoLmFicyhkZWx0YVgpO1xuICAgIHZhciBtYWduaXR1ZGVZID0gTWF0aC5hYnMoZGVsdGFZKTtcblxuICAgIGlmIChtYWduaXR1ZGVZID4gbWFnbml0dWRlWCkge1xuICAgICAgLy8gdXNlciBpcyBwZXJoYXBzIHRyeWluZyB0byBzd2lwZSB1cC9kb3duIHRoZSBwYWdlXG5cbiAgICAgIGlmICgoKGRlbHRhWSA8IDApICYmIChzY3JvbGxUb3AgPT09IGkuY29udGVudEhlaWdodCAtIGkuY29udGFpbmVySGVpZ2h0KSkgfHxcbiAgICAgICAgICAoKGRlbHRhWSA+IDApICYmIChzY3JvbGxUb3AgPT09IDApKSkge1xuICAgICAgICByZXR1cm4gIWkuc2V0dGluZ3Muc3dpcGVQcm9wYWdhdGlvbjtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG1hZ25pdHVkZVggPiBtYWduaXR1ZGVZKSB7XG4gICAgICAvLyB1c2VyIGlzIHBlcmhhcHMgdHJ5aW5nIHRvIHN3aXBlIGxlZnQvcmlnaHQgYWNyb3NzIHRoZSBwYWdlXG5cbiAgICAgIGlmICgoKGRlbHRhWCA8IDApICYmIChzY3JvbGxMZWZ0ID09PSBpLmNvbnRlbnRXaWR0aCAtIGkuY29udGFpbmVyV2lkdGgpKSB8fFxuICAgICAgICAgICgoZGVsdGFYID4gMCkgJiYgKHNjcm9sbExlZnQgPT09IDApKSkge1xuICAgICAgICByZXR1cm4gIWkuc2V0dGluZ3Muc3dpcGVQcm9wYWdhdGlvbjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGx5VG91Y2hNb3ZlKGRpZmZlcmVuY2VYLCBkaWZmZXJlbmNlWSkge1xuICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAndG9wJywgZWxlbWVudC5zY3JvbGxUb3AgLSBkaWZmZXJlbmNlWSk7XG4gICAgdXBkYXRlU2Nyb2xsKGVsZW1lbnQsICdsZWZ0JywgZWxlbWVudC5zY3JvbGxMZWZ0IC0gZGlmZmVyZW5jZVgpO1xuXG4gICAgdXBkYXRlR2VvbWV0cnkoZWxlbWVudCk7XG4gIH1cblxuICB2YXIgc3RhcnRPZmZzZXQgPSB7fTtcbiAgdmFyIHN0YXJ0VGltZSA9IDA7XG4gIHZhciBzcGVlZCA9IHt9O1xuICB2YXIgZWFzaW5nTG9vcCA9IG51bGw7XG4gIHZhciBpbkdsb2JhbFRvdWNoID0gZmFsc2U7XG4gIHZhciBpbkxvY2FsVG91Y2ggPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnbG9iYWxUb3VjaFN0YXJ0KCkge1xuICAgIGluR2xvYmFsVG91Y2ggPSB0cnVlO1xuICB9XG4gIGZ1bmN0aW9uIGdsb2JhbFRvdWNoRW5kKCkge1xuICAgIGluR2xvYmFsVG91Y2ggPSBmYWxzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFRvdWNoKGUpIHtcbiAgICBpZiAoZS50YXJnZXRUb3VjaGVzKSB7XG4gICAgICByZXR1cm4gZS50YXJnZXRUb3VjaGVzWzBdO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBNYXliZSBJRSBwb2ludGVyXG4gICAgICByZXR1cm4gZTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gc2hvdWxkSGFuZGxlKGUpIHtcbiAgICBpZiAoZS50YXJnZXRUb3VjaGVzICYmIGUudGFyZ2V0VG91Y2hlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoZS5wb2ludGVyVHlwZSAmJiBlLnBvaW50ZXJUeXBlICE9PSAnbW91c2UnICYmIGUucG9pbnRlclR5cGUgIT09IGUuTVNQT0lOVEVSX1RZUEVfTU9VU0UpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgZnVuY3Rpb24gdG91Y2hTdGFydChlKSB7XG4gICAgaWYgKHNob3VsZEhhbmRsZShlKSkge1xuICAgICAgaW5Mb2NhbFRvdWNoID0gdHJ1ZTtcblxuICAgICAgdmFyIHRvdWNoID0gZ2V0VG91Y2goZSk7XG5cbiAgICAgIHN0YXJ0T2Zmc2V0LnBhZ2VYID0gdG91Y2gucGFnZVg7XG4gICAgICBzdGFydE9mZnNldC5wYWdlWSA9IHRvdWNoLnBhZ2VZO1xuXG4gICAgICBzdGFydFRpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuXG4gICAgICBpZiAoZWFzaW5nTG9vcCAhPT0gbnVsbCkge1xuICAgICAgICBjbGVhckludGVydmFsKGVhc2luZ0xvb3ApO1xuICAgICAgfVxuXG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiB0b3VjaE1vdmUoZSkge1xuICAgIGlmICghaW5Mb2NhbFRvdWNoICYmIGkuc2V0dGluZ3Muc3dpcGVQcm9wYWdhdGlvbikge1xuICAgICAgdG91Y2hTdGFydChlKTtcbiAgICB9XG4gICAgaWYgKCFpbkdsb2JhbFRvdWNoICYmIGluTG9jYWxUb3VjaCAmJiBzaG91bGRIYW5kbGUoZSkpIHtcbiAgICAgIHZhciB0b3VjaCA9IGdldFRvdWNoKGUpO1xuXG4gICAgICB2YXIgY3VycmVudE9mZnNldCA9IHtwYWdlWDogdG91Y2gucGFnZVgsIHBhZ2VZOiB0b3VjaC5wYWdlWX07XG5cbiAgICAgIHZhciBkaWZmZXJlbmNlWCA9IGN1cnJlbnRPZmZzZXQucGFnZVggLSBzdGFydE9mZnNldC5wYWdlWDtcbiAgICAgIHZhciBkaWZmZXJlbmNlWSA9IGN1cnJlbnRPZmZzZXQucGFnZVkgLSBzdGFydE9mZnNldC5wYWdlWTtcblxuICAgICAgYXBwbHlUb3VjaE1vdmUoZGlmZmVyZW5jZVgsIGRpZmZlcmVuY2VZKTtcbiAgICAgIHN0YXJ0T2Zmc2V0ID0gY3VycmVudE9mZnNldDtcblxuICAgICAgdmFyIGN1cnJlbnRUaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcblxuICAgICAgdmFyIHRpbWVHYXAgPSBjdXJyZW50VGltZSAtIHN0YXJ0VGltZTtcbiAgICAgIGlmICh0aW1lR2FwID4gMCkge1xuICAgICAgICBzcGVlZC54ID0gZGlmZmVyZW5jZVggLyB0aW1lR2FwO1xuICAgICAgICBzcGVlZC55ID0gZGlmZmVyZW5jZVkgLyB0aW1lR2FwO1xuICAgICAgICBzdGFydFRpbWUgPSBjdXJyZW50VGltZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNob3VsZFByZXZlbnREZWZhdWx0KGRpZmZlcmVuY2VYLCBkaWZmZXJlbmNlWSkpIHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBmdW5jdGlvbiB0b3VjaEVuZCgpIHtcbiAgICBpZiAoIWluR2xvYmFsVG91Y2ggJiYgaW5Mb2NhbFRvdWNoKSB7XG4gICAgICBpbkxvY2FsVG91Y2ggPSBmYWxzZTtcblxuICAgICAgaWYgKGkuc2V0dGluZ3Muc3dpcGVFYXNpbmcpIHtcbiAgICAgICAgY2xlYXJJbnRlcnZhbChlYXNpbmdMb29wKTtcbiAgICAgICAgZWFzaW5nTG9vcCA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAoIWluc3RhbmNlcy5nZXQoZWxlbWVudCkpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoZWFzaW5nTG9vcCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFzcGVlZC54ICYmICFzcGVlZC55KSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKGVhc2luZ0xvb3ApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChNYXRoLmFicyhzcGVlZC54KSA8IDAuMDEgJiYgTWF0aC5hYnMoc3BlZWQueSkgPCAwLjAxKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKGVhc2luZ0xvb3ApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGFwcGx5VG91Y2hNb3ZlKHNwZWVkLnggKiAzMCwgc3BlZWQueSAqIDMwKTtcblxuICAgICAgICAgIHNwZWVkLnggKj0gMC44O1xuICAgICAgICAgIHNwZWVkLnkgKj0gMC44O1xuICAgICAgICB9LCAxMCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHN1cHBvcnRzVG91Y2gpIHtcbiAgICBpLmV2ZW50LmJpbmQod2luZG93LCAndG91Y2hzdGFydCcsIGdsb2JhbFRvdWNoU3RhcnQpO1xuICAgIGkuZXZlbnQuYmluZCh3aW5kb3csICd0b3VjaGVuZCcsIGdsb2JhbFRvdWNoRW5kKTtcbiAgICBpLmV2ZW50LmJpbmQoZWxlbWVudCwgJ3RvdWNoc3RhcnQnLCB0b3VjaFN0YXJ0KTtcbiAgICBpLmV2ZW50LmJpbmQoZWxlbWVudCwgJ3RvdWNobW92ZScsIHRvdWNoTW92ZSk7XG4gICAgaS5ldmVudC5iaW5kKGVsZW1lbnQsICd0b3VjaGVuZCcsIHRvdWNoRW5kKTtcbiAgfSBlbHNlIGlmIChzdXBwb3J0c0llUG9pbnRlcikge1xuICAgIGlmICh3aW5kb3cuUG9pbnRlckV2ZW50KSB7XG4gICAgICBpLmV2ZW50LmJpbmQod2luZG93LCAncG9pbnRlcmRvd24nLCBnbG9iYWxUb3VjaFN0YXJ0KTtcbiAgICAgIGkuZXZlbnQuYmluZCh3aW5kb3csICdwb2ludGVydXAnLCBnbG9iYWxUb3VjaEVuZCk7XG4gICAgICBpLmV2ZW50LmJpbmQoZWxlbWVudCwgJ3BvaW50ZXJkb3duJywgdG91Y2hTdGFydCk7XG4gICAgICBpLmV2ZW50LmJpbmQoZWxlbWVudCwgJ3BvaW50ZXJtb3ZlJywgdG91Y2hNb3ZlKTtcbiAgICAgIGkuZXZlbnQuYmluZChlbGVtZW50LCAncG9pbnRlcnVwJywgdG91Y2hFbmQpO1xuICAgIH0gZWxzZSBpZiAod2luZG93Lk1TUG9pbnRlckV2ZW50KSB7XG4gICAgICBpLmV2ZW50LmJpbmQod2luZG93LCAnTVNQb2ludGVyRG93bicsIGdsb2JhbFRvdWNoU3RhcnQpO1xuICAgICAgaS5ldmVudC5iaW5kKHdpbmRvdywgJ01TUG9pbnRlclVwJywgZ2xvYmFsVG91Y2hFbmQpO1xuICAgICAgaS5ldmVudC5iaW5kKGVsZW1lbnQsICdNU1BvaW50ZXJEb3duJywgdG91Y2hTdGFydCk7XG4gICAgICBpLmV2ZW50LmJpbmQoZWxlbWVudCwgJ01TUG9pbnRlck1vdmUnLCB0b3VjaE1vdmUpO1xuICAgICAgaS5ldmVudC5iaW5kKGVsZW1lbnQsICdNU1BvaW50ZXJVcCcsIHRvdWNoRW5kKTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICBpZiAoIV8uZW52LnN1cHBvcnRzVG91Y2ggJiYgIV8uZW52LnN1cHBvcnRzSWVQb2ludGVyKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGkgPSBpbnN0YW5jZXMuZ2V0KGVsZW1lbnQpO1xuICBiaW5kVG91Y2hIYW5kbGVyKGVsZW1lbnQsIGksIF8uZW52LnN1cHBvcnRzVG91Y2gsIF8uZW52LnN1cHBvcnRzSWVQb2ludGVyKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpbnN0YW5jZXMgPSByZXF1aXJlKCcuL2luc3RhbmNlcycpO1xudmFyIHVwZGF0ZUdlb21ldHJ5ID0gcmVxdWlyZSgnLi91cGRhdGUtZ2VvbWV0cnknKTtcblxuLy8gSGFuZGxlcnNcbnZhciBoYW5kbGVycyA9IHtcbiAgJ2NsaWNrLXJhaWwnOiByZXF1aXJlKCcuL2hhbmRsZXIvY2xpY2stcmFpbCcpLFxuICAnZHJhZy1zY3JvbGxiYXInOiByZXF1aXJlKCcuL2hhbmRsZXIvZHJhZy1zY3JvbGxiYXInKSxcbiAgJ2tleWJvYXJkJzogcmVxdWlyZSgnLi9oYW5kbGVyL2tleWJvYXJkJyksXG4gICd3aGVlbCc6IHJlcXVpcmUoJy4vaGFuZGxlci9tb3VzZS13aGVlbCcpLFxuICAndG91Y2gnOiByZXF1aXJlKCcuL2hhbmRsZXIvdG91Y2gnKSxcbiAgJ3NlbGVjdGlvbic6IHJlcXVpcmUoJy4vaGFuZGxlci9zZWxlY3Rpb24nKVxufTtcbnZhciBuYXRpdmVTY3JvbGxIYW5kbGVyID0gcmVxdWlyZSgnLi9oYW5kbGVyL25hdGl2ZS1zY3JvbGwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWxlbWVudCwgdXNlclNldHRpbmdzKSB7XG4gIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgncHMnKTtcblxuICAvLyBDcmVhdGUgYSBwbHVnaW4gaW5zdGFuY2UuXG4gIHZhciBpID0gaW5zdGFuY2VzLmFkZChcbiAgICBlbGVtZW50LFxuICAgIHR5cGVvZiB1c2VyU2V0dGluZ3MgPT09ICdvYmplY3QnID8gdXNlclNldHRpbmdzIDoge31cbiAgKTtcblxuICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3BzLS10aGVtZV8nICsgaS5zZXR0aW5ncy50aGVtZSk7XG5cbiAgaS5zZXR0aW5ncy5oYW5kbGVycy5mb3JFYWNoKGZ1bmN0aW9uIChoYW5kbGVyTmFtZSkge1xuICAgIGhhbmRsZXJzW2hhbmRsZXJOYW1lXShlbGVtZW50KTtcbiAgfSk7XG5cbiAgbmF0aXZlU2Nyb2xsSGFuZGxlcihlbGVtZW50KTtcblxuICB1cGRhdGVHZW9tZXRyeShlbGVtZW50KTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnLi4vbGliL2hlbHBlcicpO1xudmFyIGRlZmF1bHRTZXR0aW5ncyA9IHJlcXVpcmUoJy4vZGVmYXVsdC1zZXR0aW5nJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi4vbGliL2RvbScpO1xudmFyIEV2ZW50TWFuYWdlciA9IHJlcXVpcmUoJy4uL2xpYi9ldmVudC1tYW5hZ2VyJyk7XG52YXIgZ3VpZCA9IHJlcXVpcmUoJy4uL2xpYi9ndWlkJyk7XG5cbnZhciBpbnN0YW5jZXMgPSB7fTtcblxuZnVuY3Rpb24gSW5zdGFuY2UoZWxlbWVudCwgdXNlclNldHRpbmdzKSB7XG4gIHZhciBpID0gdGhpcztcblxuICBpLnNldHRpbmdzID0gZGVmYXVsdFNldHRpbmdzKCk7XG4gIGZvciAodmFyIGtleSBpbiB1c2VyU2V0dGluZ3MpIHtcbiAgICBpLnNldHRpbmdzW2tleV0gPSB1c2VyU2V0dGluZ3Nba2V5XTtcbiAgfVxuXG4gIGkuY29udGFpbmVyV2lkdGggPSBudWxsO1xuICBpLmNvbnRhaW5lckhlaWdodCA9IG51bGw7XG4gIGkuY29udGVudFdpZHRoID0gbnVsbDtcbiAgaS5jb250ZW50SGVpZ2h0ID0gbnVsbDtcblxuICBpLmlzUnRsID0gZG9tLmNzcyhlbGVtZW50LCAnZGlyZWN0aW9uJykgPT09IFwicnRsXCI7XG4gIGkuaXNOZWdhdGl2ZVNjcm9sbCA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG9yaWdpbmFsU2Nyb2xsTGVmdCA9IGVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgICB2YXIgcmVzdWx0ID0gbnVsbDtcbiAgICBlbGVtZW50LnNjcm9sbExlZnQgPSAtMTtcbiAgICByZXN1bHQgPSBlbGVtZW50LnNjcm9sbExlZnQgPCAwO1xuICAgIGVsZW1lbnQuc2Nyb2xsTGVmdCA9IG9yaWdpbmFsU2Nyb2xsTGVmdDtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9KSgpO1xuICBpLm5lZ2F0aXZlU2Nyb2xsQWRqdXN0bWVudCA9IGkuaXNOZWdhdGl2ZVNjcm9sbCA/IGVsZW1lbnQuc2Nyb2xsV2lkdGggLSBlbGVtZW50LmNsaWVudFdpZHRoIDogMDtcbiAgaS5ldmVudCA9IG5ldyBFdmVudE1hbmFnZXIoKTtcbiAgaS5vd25lckRvY3VtZW50ID0gZWxlbWVudC5vd25lckRvY3VtZW50IHx8IGRvY3VtZW50O1xuXG4gIGZ1bmN0aW9uIGZvY3VzKCkge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgncHMtLWZvY3VzJyk7XG4gIH1cblxuICBmdW5jdGlvbiBibHVyKCkge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgncHMtLWZvY3VzJyk7XG4gIH1cblxuICBpLnNjcm9sbGJhclhSYWlsID0gZG9tLmFwcGVuZFRvKGRvbS5jcmVhdGUoJ2RpdicsICdwc19fc2Nyb2xsYmFyLXgtcmFpbCcpLCBlbGVtZW50KTtcbiAgaS5zY3JvbGxiYXJYID0gZG9tLmFwcGVuZFRvKGRvbS5jcmVhdGUoJ2RpdicsICdwc19fc2Nyb2xsYmFyLXgnKSwgaS5zY3JvbGxiYXJYUmFpbCk7XG4gIGkuc2Nyb2xsYmFyWC5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgMCk7XG4gIGkuZXZlbnQuYmluZChpLnNjcm9sbGJhclgsICdmb2N1cycsIGZvY3VzKTtcbiAgaS5ldmVudC5iaW5kKGkuc2Nyb2xsYmFyWCwgJ2JsdXInLCBibHVyKTtcbiAgaS5zY3JvbGxiYXJYQWN0aXZlID0gbnVsbDtcbiAgaS5zY3JvbGxiYXJYV2lkdGggPSBudWxsO1xuICBpLnNjcm9sbGJhclhMZWZ0ID0gbnVsbDtcbiAgaS5zY3JvbGxiYXJYQm90dG9tID0gXy50b0ludChkb20uY3NzKGkuc2Nyb2xsYmFyWFJhaWwsICdib3R0b20nKSk7XG4gIGkuaXNTY3JvbGxiYXJYVXNpbmdCb3R0b20gPSBpLnNjcm9sbGJhclhCb3R0b20gPT09IGkuc2Nyb2xsYmFyWEJvdHRvbTsgLy8gIWlzTmFOXG4gIGkuc2Nyb2xsYmFyWFRvcCA9IGkuaXNTY3JvbGxiYXJYVXNpbmdCb3R0b20gPyBudWxsIDogXy50b0ludChkb20uY3NzKGkuc2Nyb2xsYmFyWFJhaWwsICd0b3AnKSk7XG4gIGkucmFpbEJvcmRlclhXaWR0aCA9IF8udG9JbnQoZG9tLmNzcyhpLnNjcm9sbGJhclhSYWlsLCAnYm9yZGVyTGVmdFdpZHRoJykpICsgXy50b0ludChkb20uY3NzKGkuc2Nyb2xsYmFyWFJhaWwsICdib3JkZXJSaWdodFdpZHRoJykpO1xuICAvLyBTZXQgcmFpbCB0byBkaXNwbGF5OmJsb2NrIHRvIGNhbGN1bGF0ZSBtYXJnaW5zXG4gIGRvbS5jc3MoaS5zY3JvbGxiYXJYUmFpbCwgJ2Rpc3BsYXknLCAnYmxvY2snKTtcbiAgaS5yYWlsWE1hcmdpbldpZHRoID0gXy50b0ludChkb20uY3NzKGkuc2Nyb2xsYmFyWFJhaWwsICdtYXJnaW5MZWZ0JykpICsgXy50b0ludChkb20uY3NzKGkuc2Nyb2xsYmFyWFJhaWwsICdtYXJnaW5SaWdodCcpKTtcbiAgZG9tLmNzcyhpLnNjcm9sbGJhclhSYWlsLCAnZGlzcGxheScsICcnKTtcbiAgaS5yYWlsWFdpZHRoID0gbnVsbDtcbiAgaS5yYWlsWFJhdGlvID0gbnVsbDtcblxuICBpLnNjcm9sbGJhcllSYWlsID0gZG9tLmFwcGVuZFRvKGRvbS5jcmVhdGUoJ2RpdicsICdwc19fc2Nyb2xsYmFyLXktcmFpbCcpLCBlbGVtZW50KTtcbiAgaS5zY3JvbGxiYXJZID0gZG9tLmFwcGVuZFRvKGRvbS5jcmVhdGUoJ2RpdicsICdwc19fc2Nyb2xsYmFyLXknKSwgaS5zY3JvbGxiYXJZUmFpbCk7XG4gIGkuc2Nyb2xsYmFyWS5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywgMCk7XG4gIGkuZXZlbnQuYmluZChpLnNjcm9sbGJhclksICdmb2N1cycsIGZvY3VzKTtcbiAgaS5ldmVudC5iaW5kKGkuc2Nyb2xsYmFyWSwgJ2JsdXInLCBibHVyKTtcbiAgaS5zY3JvbGxiYXJZQWN0aXZlID0gbnVsbDtcbiAgaS5zY3JvbGxiYXJZSGVpZ2h0ID0gbnVsbDtcbiAgaS5zY3JvbGxiYXJZVG9wID0gbnVsbDtcbiAgaS5zY3JvbGxiYXJZUmlnaHQgPSBfLnRvSW50KGRvbS5jc3MoaS5zY3JvbGxiYXJZUmFpbCwgJ3JpZ2h0JykpO1xuICBpLmlzU2Nyb2xsYmFyWVVzaW5nUmlnaHQgPSBpLnNjcm9sbGJhcllSaWdodCA9PT0gaS5zY3JvbGxiYXJZUmlnaHQ7IC8vICFpc05hTlxuICBpLnNjcm9sbGJhcllMZWZ0ID0gaS5pc1Njcm9sbGJhcllVc2luZ1JpZ2h0ID8gbnVsbCA6IF8udG9JbnQoZG9tLmNzcyhpLnNjcm9sbGJhcllSYWlsLCAnbGVmdCcpKTtcbiAgaS5zY3JvbGxiYXJZT3V0ZXJXaWR0aCA9IGkuaXNSdGwgPyBfLm91dGVyV2lkdGgoaS5zY3JvbGxiYXJZKSA6IG51bGw7XG4gIGkucmFpbEJvcmRlcllXaWR0aCA9IF8udG9JbnQoZG9tLmNzcyhpLnNjcm9sbGJhcllSYWlsLCAnYm9yZGVyVG9wV2lkdGgnKSkgKyBfLnRvSW50KGRvbS5jc3MoaS5zY3JvbGxiYXJZUmFpbCwgJ2JvcmRlckJvdHRvbVdpZHRoJykpO1xuICBkb20uY3NzKGkuc2Nyb2xsYmFyWVJhaWwsICdkaXNwbGF5JywgJ2Jsb2NrJyk7XG4gIGkucmFpbFlNYXJnaW5IZWlnaHQgPSBfLnRvSW50KGRvbS5jc3MoaS5zY3JvbGxiYXJZUmFpbCwgJ21hcmdpblRvcCcpKSArIF8udG9JbnQoZG9tLmNzcyhpLnNjcm9sbGJhcllSYWlsLCAnbWFyZ2luQm90dG9tJykpO1xuICBkb20uY3NzKGkuc2Nyb2xsYmFyWVJhaWwsICdkaXNwbGF5JywgJycpO1xuICBpLnJhaWxZSGVpZ2h0ID0gbnVsbDtcbiAgaS5yYWlsWVJhdGlvID0gbnVsbDtcbn1cblxuZnVuY3Rpb24gZ2V0SWQoZWxlbWVudCkge1xuICByZXR1cm4gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcHMtaWQnKTtcbn1cblxuZnVuY3Rpb24gc2V0SWQoZWxlbWVudCwgaWQpIHtcbiAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RhdGEtcHMtaWQnLCBpZCk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUlkKGVsZW1lbnQpIHtcbiAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtcHMtaWQnKTtcbn1cblxuZXhwb3J0cy5hZGQgPSBmdW5jdGlvbiAoZWxlbWVudCwgdXNlclNldHRpbmdzKSB7XG4gIHZhciBuZXdJZCA9IGd1aWQoKTtcbiAgc2V0SWQoZWxlbWVudCwgbmV3SWQpO1xuICBpbnN0YW5jZXNbbmV3SWRdID0gbmV3IEluc3RhbmNlKGVsZW1lbnQsIHVzZXJTZXR0aW5ncyk7XG4gIHJldHVybiBpbnN0YW5jZXNbbmV3SWRdO1xufTtcblxuZXhwb3J0cy5yZW1vdmUgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICBkZWxldGUgaW5zdGFuY2VzW2dldElkKGVsZW1lbnQpXTtcbiAgcmVtb3ZlSWQoZWxlbWVudCk7XG59O1xuXG5leHBvcnRzLmdldCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHJldHVybiBpbnN0YW5jZXNbZ2V0SWQoZWxlbWVudCldO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCcuLi9saWIvaGVscGVyJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi4vbGliL2RvbScpO1xudmFyIGluc3RhbmNlcyA9IHJlcXVpcmUoJy4vaW5zdGFuY2VzJyk7XG52YXIgdXBkYXRlU2Nyb2xsID0gcmVxdWlyZSgnLi91cGRhdGUtc2Nyb2xsJyk7XG5cbmZ1bmN0aW9uIGdldFRodW1iU2l6ZShpLCB0aHVtYlNpemUpIHtcbiAgaWYgKGkuc2V0dGluZ3MubWluU2Nyb2xsYmFyTGVuZ3RoKSB7XG4gICAgdGh1bWJTaXplID0gTWF0aC5tYXgodGh1bWJTaXplLCBpLnNldHRpbmdzLm1pblNjcm9sbGJhckxlbmd0aCk7XG4gIH1cbiAgaWYgKGkuc2V0dGluZ3MubWF4U2Nyb2xsYmFyTGVuZ3RoKSB7XG4gICAgdGh1bWJTaXplID0gTWF0aC5taW4odGh1bWJTaXplLCBpLnNldHRpbmdzLm1heFNjcm9sbGJhckxlbmd0aCk7XG4gIH1cbiAgcmV0dXJuIHRodW1iU2l6ZTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQ3NzKGVsZW1lbnQsIGkpIHtcbiAgdmFyIHhSYWlsT2Zmc2V0ID0ge3dpZHRoOiBpLnJhaWxYV2lkdGh9O1xuICBpZiAoaS5pc1J0bCkge1xuICAgIHhSYWlsT2Zmc2V0LmxlZnQgPSBpLm5lZ2F0aXZlU2Nyb2xsQWRqdXN0bWVudCArIGVsZW1lbnQuc2Nyb2xsTGVmdCArIGkuY29udGFpbmVyV2lkdGggLSBpLmNvbnRlbnRXaWR0aDtcbiAgfSBlbHNlIHtcbiAgICB4UmFpbE9mZnNldC5sZWZ0ID0gZWxlbWVudC5zY3JvbGxMZWZ0O1xuICB9XG4gIGlmIChpLmlzU2Nyb2xsYmFyWFVzaW5nQm90dG9tKSB7XG4gICAgeFJhaWxPZmZzZXQuYm90dG9tID0gaS5zY3JvbGxiYXJYQm90dG9tIC0gZWxlbWVudC5zY3JvbGxUb3A7XG4gIH0gZWxzZSB7XG4gICAgeFJhaWxPZmZzZXQudG9wID0gaS5zY3JvbGxiYXJYVG9wICsgZWxlbWVudC5zY3JvbGxUb3A7XG4gIH1cbiAgZG9tLmNzcyhpLnNjcm9sbGJhclhSYWlsLCB4UmFpbE9mZnNldCk7XG5cbiAgdmFyIHlSYWlsT2Zmc2V0ID0ge3RvcDogZWxlbWVudC5zY3JvbGxUb3AsIGhlaWdodDogaS5yYWlsWUhlaWdodH07XG4gIGlmIChpLmlzU2Nyb2xsYmFyWVVzaW5nUmlnaHQpIHtcbiAgICBpZiAoaS5pc1J0bCkge1xuICAgICAgeVJhaWxPZmZzZXQucmlnaHQgPSBpLmNvbnRlbnRXaWR0aCAtIChpLm5lZ2F0aXZlU2Nyb2xsQWRqdXN0bWVudCArIGVsZW1lbnQuc2Nyb2xsTGVmdCkgLSBpLnNjcm9sbGJhcllSaWdodCAtIGkuc2Nyb2xsYmFyWU91dGVyV2lkdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHlSYWlsT2Zmc2V0LnJpZ2h0ID0gaS5zY3JvbGxiYXJZUmlnaHQgLSBlbGVtZW50LnNjcm9sbExlZnQ7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChpLmlzUnRsKSB7XG4gICAgICB5UmFpbE9mZnNldC5sZWZ0ID0gaS5uZWdhdGl2ZVNjcm9sbEFkanVzdG1lbnQgKyBlbGVtZW50LnNjcm9sbExlZnQgKyBpLmNvbnRhaW5lcldpZHRoICogMiAtIGkuY29udGVudFdpZHRoIC0gaS5zY3JvbGxiYXJZTGVmdCAtIGkuc2Nyb2xsYmFyWU91dGVyV2lkdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHlSYWlsT2Zmc2V0LmxlZnQgPSBpLnNjcm9sbGJhcllMZWZ0ICsgZWxlbWVudC5zY3JvbGxMZWZ0O1xuICAgIH1cbiAgfVxuICBkb20uY3NzKGkuc2Nyb2xsYmFyWVJhaWwsIHlSYWlsT2Zmc2V0KTtcblxuICBkb20uY3NzKGkuc2Nyb2xsYmFyWCwge2xlZnQ6IGkuc2Nyb2xsYmFyWExlZnQsIHdpZHRoOiBpLnNjcm9sbGJhclhXaWR0aCAtIGkucmFpbEJvcmRlclhXaWR0aH0pO1xuICBkb20uY3NzKGkuc2Nyb2xsYmFyWSwge3RvcDogaS5zY3JvbGxiYXJZVG9wLCBoZWlnaHQ6IGkuc2Nyb2xsYmFyWUhlaWdodCAtIGkucmFpbEJvcmRlcllXaWR0aH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHZhciBpID0gaW5zdGFuY2VzLmdldChlbGVtZW50KTtcblxuICBpLmNvbnRhaW5lcldpZHRoID0gZWxlbWVudC5jbGllbnRXaWR0aDtcbiAgaS5jb250YWluZXJIZWlnaHQgPSBlbGVtZW50LmNsaWVudEhlaWdodDtcbiAgaS5jb250ZW50V2lkdGggPSBlbGVtZW50LnNjcm9sbFdpZHRoO1xuICBpLmNvbnRlbnRIZWlnaHQgPSBlbGVtZW50LnNjcm9sbEhlaWdodDtcblxuICB2YXIgZXhpc3RpbmdSYWlscztcbiAgaWYgKCFlbGVtZW50LmNvbnRhaW5zKGkuc2Nyb2xsYmFyWFJhaWwpKSB7XG4gICAgZXhpc3RpbmdSYWlscyA9IGRvbS5xdWVyeUNoaWxkcmVuKGVsZW1lbnQsICcucHNfX3Njcm9sbGJhci14LXJhaWwnKTtcbiAgICBpZiAoZXhpc3RpbmdSYWlscy5sZW5ndGggPiAwKSB7XG4gICAgICBleGlzdGluZ1JhaWxzLmZvckVhY2goZnVuY3Rpb24gKHJhaWwpIHtcbiAgICAgICAgZG9tLnJlbW92ZShyYWlsKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBkb20uYXBwZW5kVG8oaS5zY3JvbGxiYXJYUmFpbCwgZWxlbWVudCk7XG4gIH1cbiAgaWYgKCFlbGVtZW50LmNvbnRhaW5zKGkuc2Nyb2xsYmFyWVJhaWwpKSB7XG4gICAgZXhpc3RpbmdSYWlscyA9IGRvbS5xdWVyeUNoaWxkcmVuKGVsZW1lbnQsICcucHNfX3Njcm9sbGJhci15LXJhaWwnKTtcbiAgICBpZiAoZXhpc3RpbmdSYWlscy5sZW5ndGggPiAwKSB7XG4gICAgICBleGlzdGluZ1JhaWxzLmZvckVhY2goZnVuY3Rpb24gKHJhaWwpIHtcbiAgICAgICAgZG9tLnJlbW92ZShyYWlsKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBkb20uYXBwZW5kVG8oaS5zY3JvbGxiYXJZUmFpbCwgZWxlbWVudCk7XG4gIH1cblxuICBpZiAoIWkuc2V0dGluZ3Muc3VwcHJlc3NTY3JvbGxYICYmIGkuY29udGFpbmVyV2lkdGggKyBpLnNldHRpbmdzLnNjcm9sbFhNYXJnaW5PZmZzZXQgPCBpLmNvbnRlbnRXaWR0aCkge1xuICAgIGkuc2Nyb2xsYmFyWEFjdGl2ZSA9IHRydWU7XG4gICAgaS5yYWlsWFdpZHRoID0gaS5jb250YWluZXJXaWR0aCAtIGkucmFpbFhNYXJnaW5XaWR0aDtcbiAgICBpLnJhaWxYUmF0aW8gPSBpLmNvbnRhaW5lcldpZHRoIC8gaS5yYWlsWFdpZHRoO1xuICAgIGkuc2Nyb2xsYmFyWFdpZHRoID0gZ2V0VGh1bWJTaXplKGksIF8udG9JbnQoaS5yYWlsWFdpZHRoICogaS5jb250YWluZXJXaWR0aCAvIGkuY29udGVudFdpZHRoKSk7XG4gICAgaS5zY3JvbGxiYXJYTGVmdCA9IF8udG9JbnQoKGkubmVnYXRpdmVTY3JvbGxBZGp1c3RtZW50ICsgZWxlbWVudC5zY3JvbGxMZWZ0KSAqIChpLnJhaWxYV2lkdGggLSBpLnNjcm9sbGJhclhXaWR0aCkgLyAoaS5jb250ZW50V2lkdGggLSBpLmNvbnRhaW5lcldpZHRoKSk7XG4gIH0gZWxzZSB7XG4gICAgaS5zY3JvbGxiYXJYQWN0aXZlID0gZmFsc2U7XG4gIH1cblxuICBpZiAoIWkuc2V0dGluZ3Muc3VwcHJlc3NTY3JvbGxZICYmIGkuY29udGFpbmVySGVpZ2h0ICsgaS5zZXR0aW5ncy5zY3JvbGxZTWFyZ2luT2Zmc2V0IDwgaS5jb250ZW50SGVpZ2h0KSB7XG4gICAgaS5zY3JvbGxiYXJZQWN0aXZlID0gdHJ1ZTtcbiAgICBpLnJhaWxZSGVpZ2h0ID0gaS5jb250YWluZXJIZWlnaHQgLSBpLnJhaWxZTWFyZ2luSGVpZ2h0O1xuICAgIGkucmFpbFlSYXRpbyA9IGkuY29udGFpbmVySGVpZ2h0IC8gaS5yYWlsWUhlaWdodDtcbiAgICBpLnNjcm9sbGJhcllIZWlnaHQgPSBnZXRUaHVtYlNpemUoaSwgXy50b0ludChpLnJhaWxZSGVpZ2h0ICogaS5jb250YWluZXJIZWlnaHQgLyBpLmNvbnRlbnRIZWlnaHQpKTtcbiAgICBpLnNjcm9sbGJhcllUb3AgPSBfLnRvSW50KGVsZW1lbnQuc2Nyb2xsVG9wICogKGkucmFpbFlIZWlnaHQgLSBpLnNjcm9sbGJhcllIZWlnaHQpIC8gKGkuY29udGVudEhlaWdodCAtIGkuY29udGFpbmVySGVpZ2h0KSk7XG4gIH0gZWxzZSB7XG4gICAgaS5zY3JvbGxiYXJZQWN0aXZlID0gZmFsc2U7XG4gIH1cblxuICBpZiAoaS5zY3JvbGxiYXJYTGVmdCA+PSBpLnJhaWxYV2lkdGggLSBpLnNjcm9sbGJhclhXaWR0aCkge1xuICAgIGkuc2Nyb2xsYmFyWExlZnQgPSBpLnJhaWxYV2lkdGggLSBpLnNjcm9sbGJhclhXaWR0aDtcbiAgfVxuICBpZiAoaS5zY3JvbGxiYXJZVG9wID49IGkucmFpbFlIZWlnaHQgLSBpLnNjcm9sbGJhcllIZWlnaHQpIHtcbiAgICBpLnNjcm9sbGJhcllUb3AgPSBpLnJhaWxZSGVpZ2h0IC0gaS5zY3JvbGxiYXJZSGVpZ2h0O1xuICB9XG5cbiAgdXBkYXRlQ3NzKGVsZW1lbnQsIGkpO1xuXG4gIGlmIChpLnNjcm9sbGJhclhBY3RpdmUpIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3BzLS1hY3RpdmUteCcpO1xuICB9IGVsc2Uge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgncHMtLWFjdGl2ZS14Jyk7XG4gICAgaS5zY3JvbGxiYXJYV2lkdGggPSAwO1xuICAgIGkuc2Nyb2xsYmFyWExlZnQgPSAwO1xuICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAnbGVmdCcsIDApO1xuICB9XG4gIGlmIChpLnNjcm9sbGJhcllBY3RpdmUpIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3BzLS1hY3RpdmUteScpO1xuICB9IGVsc2Uge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgncHMtLWFjdGl2ZS15Jyk7XG4gICAgaS5zY3JvbGxiYXJZSGVpZ2h0ID0gMDtcbiAgICBpLnNjcm9sbGJhcllUb3AgPSAwO1xuICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAndG9wJywgMCk7XG4gIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpbnN0YW5jZXMgPSByZXF1aXJlKCcuL2luc3RhbmNlcycpO1xuXG52YXIgY3JlYXRlRE9NRXZlbnQgPSBmdW5jdGlvbiAobmFtZSkge1xuICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkV2ZW50XCIpO1xuICBldmVudC5pbml0RXZlbnQobmFtZSwgdHJ1ZSwgdHJ1ZSk7XG4gIHJldHVybiBldmVudDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGVsZW1lbnQsIGF4aXMsIHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgZWxlbWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aHJvdyAnWW91IG11c3QgcHJvdmlkZSBhbiBlbGVtZW50IHRvIHRoZSB1cGRhdGUtc2Nyb2xsIGZ1bmN0aW9uJztcbiAgfVxuXG4gIGlmICh0eXBlb2YgYXhpcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICB0aHJvdyAnWW91IG11c3QgcHJvdmlkZSBhbiBheGlzIHRvIHRoZSB1cGRhdGUtc2Nyb2xsIGZ1bmN0aW9uJztcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgdGhyb3cgJ1lvdSBtdXN0IHByb3ZpZGUgYSB2YWx1ZSB0byB0aGUgdXBkYXRlLXNjcm9sbCBmdW5jdGlvbic7XG4gIH1cblxuICBpZiAoYXhpcyA9PT0gJ3RvcCcgJiYgdmFsdWUgPD0gMCkge1xuICAgIGVsZW1lbnQuc2Nyb2xsVG9wID0gdmFsdWUgPSAwOyAvLyBkb24ndCBhbGxvdyBuZWdhdGl2ZSBzY3JvbGxcbiAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoY3JlYXRlRE9NRXZlbnQoJ3BzLXktcmVhY2gtc3RhcnQnKSk7XG4gIH1cblxuICBpZiAoYXhpcyA9PT0gJ2xlZnQnICYmIHZhbHVlIDw9IDApIHtcbiAgICBlbGVtZW50LnNjcm9sbExlZnQgPSB2YWx1ZSA9IDA7IC8vIGRvbid0IGFsbG93IG5lZ2F0aXZlIHNjcm9sbFxuICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChjcmVhdGVET01FdmVudCgncHMteC1yZWFjaC1zdGFydCcpKTtcbiAgfVxuXG4gIHZhciBpID0gaW5zdGFuY2VzLmdldChlbGVtZW50KTtcblxuICBpZiAoYXhpcyA9PT0gJ3RvcCcgJiYgdmFsdWUgPj0gaS5jb250ZW50SGVpZ2h0IC0gaS5jb250YWluZXJIZWlnaHQpIHtcbiAgICAvLyBkb24ndCBhbGxvdyBzY3JvbGwgcGFzdCBjb250YWluZXJcbiAgICB2YWx1ZSA9IGkuY29udGVudEhlaWdodCAtIGkuY29udGFpbmVySGVpZ2h0O1xuICAgIGlmICh2YWx1ZSAtIGVsZW1lbnQuc2Nyb2xsVG9wIDw9IDIpIHtcbiAgICAgIC8vIG1pdGlnYXRlcyByb3VuZGluZyBlcnJvcnMgb24gbm9uLXN1YnBpeGVsIHNjcm9sbCB2YWx1ZXNcbiAgICAgIHZhbHVlID0gZWxlbWVudC5zY3JvbGxUb3A7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnQuc2Nyb2xsVG9wID0gdmFsdWU7XG4gICAgfVxuICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChjcmVhdGVET01FdmVudCgncHMteS1yZWFjaC1lbmQnKSk7XG4gIH1cblxuICBpZiAoYXhpcyA9PT0gJ2xlZnQnICYmIHZhbHVlID49IGkuY29udGVudFdpZHRoIC0gaS5jb250YWluZXJXaWR0aCkge1xuICAgIC8vIGRvbid0IGFsbG93IHNjcm9sbCBwYXN0IGNvbnRhaW5lclxuICAgIHZhbHVlID0gaS5jb250ZW50V2lkdGggLSBpLmNvbnRhaW5lcldpZHRoO1xuICAgIGlmICh2YWx1ZSAtIGVsZW1lbnQuc2Nyb2xsTGVmdCA8PSAyKSB7XG4gICAgICAvLyBtaXRpZ2F0ZXMgcm91bmRpbmcgZXJyb3JzIG9uIG5vbi1zdWJwaXhlbCBzY3JvbGwgdmFsdWVzXG4gICAgICB2YWx1ZSA9IGVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgICB9IGVsc2Uge1xuICAgICAgZWxlbWVudC5zY3JvbGxMZWZ0ID0gdmFsdWU7XG4gICAgfVxuICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChjcmVhdGVET01FdmVudCgncHMteC1yZWFjaC1lbmQnKSk7XG4gIH1cblxuICBpZiAoaS5sYXN0VG9wID09PSB1bmRlZmluZWQpIHtcbiAgICBpLmxhc3RUb3AgPSBlbGVtZW50LnNjcm9sbFRvcDtcbiAgfVxuXG4gIGlmIChpLmxhc3RMZWZ0ID09PSB1bmRlZmluZWQpIHtcbiAgICBpLmxhc3RMZWZ0ID0gZWxlbWVudC5zY3JvbGxMZWZ0O1xuICB9XG5cbiAgaWYgKGF4aXMgPT09ICd0b3AnICYmIHZhbHVlIDwgaS5sYXN0VG9wKSB7XG4gICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGNyZWF0ZURPTUV2ZW50KCdwcy1zY3JvbGwtdXAnKSk7XG4gIH1cblxuICBpZiAoYXhpcyA9PT0gJ3RvcCcgJiYgdmFsdWUgPiBpLmxhc3RUb3ApIHtcbiAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoY3JlYXRlRE9NRXZlbnQoJ3BzLXNjcm9sbC1kb3duJykpO1xuICB9XG5cbiAgaWYgKGF4aXMgPT09ICdsZWZ0JyAmJiB2YWx1ZSA8IGkubGFzdExlZnQpIHtcbiAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoY3JlYXRlRE9NRXZlbnQoJ3BzLXNjcm9sbC1sZWZ0JykpO1xuICB9XG5cbiAgaWYgKGF4aXMgPT09ICdsZWZ0JyAmJiB2YWx1ZSA+IGkubGFzdExlZnQpIHtcbiAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoY3JlYXRlRE9NRXZlbnQoJ3BzLXNjcm9sbC1yaWdodCcpKTtcbiAgfVxuXG4gIGlmIChheGlzID09PSAndG9wJyAmJiB2YWx1ZSAhPT0gaS5sYXN0VG9wKSB7XG4gICAgZWxlbWVudC5zY3JvbGxUb3AgPSBpLmxhc3RUb3AgPSB2YWx1ZTtcbiAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoY3JlYXRlRE9NRXZlbnQoJ3BzLXNjcm9sbC15JykpO1xuICB9XG5cbiAgaWYgKGF4aXMgPT09ICdsZWZ0JyAmJiB2YWx1ZSAhPT0gaS5sYXN0TGVmdCkge1xuICAgIGVsZW1lbnQuc2Nyb2xsTGVmdCA9IGkubGFzdExlZnQgPSB2YWx1ZTtcbiAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoY3JlYXRlRE9NRXZlbnQoJ3BzLXNjcm9sbC14JykpO1xuICB9XG5cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnLi4vbGliL2hlbHBlcicpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uL2xpYi9kb20nKTtcbnZhciBpbnN0YW5jZXMgPSByZXF1aXJlKCcuL2luc3RhbmNlcycpO1xudmFyIHVwZGF0ZUdlb21ldHJ5ID0gcmVxdWlyZSgnLi91cGRhdGUtZ2VvbWV0cnknKTtcbnZhciB1cGRhdGVTY3JvbGwgPSByZXF1aXJlKCcuL3VwZGF0ZS1zY3JvbGwnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICB2YXIgaSA9IGluc3RhbmNlcy5nZXQoZWxlbWVudCk7XG5cbiAgaWYgKCFpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gUmVjYWxjdWF0ZSBuZWdhdGl2ZSBzY3JvbGxMZWZ0IGFkanVzdG1lbnRcbiAgaS5uZWdhdGl2ZVNjcm9sbEFkanVzdG1lbnQgPSBpLmlzTmVnYXRpdmVTY3JvbGwgPyBlbGVtZW50LnNjcm9sbFdpZHRoIC0gZWxlbWVudC5jbGllbnRXaWR0aCA6IDA7XG5cbiAgLy8gUmVjYWxjdWxhdGUgcmFpbCBtYXJnaW5zXG4gIGRvbS5jc3MoaS5zY3JvbGxiYXJYUmFpbCwgJ2Rpc3BsYXknLCAnYmxvY2snKTtcbiAgZG9tLmNzcyhpLnNjcm9sbGJhcllSYWlsLCAnZGlzcGxheScsICdibG9jaycpO1xuICBpLnJhaWxYTWFyZ2luV2lkdGggPSBfLnRvSW50KGRvbS5jc3MoaS5zY3JvbGxiYXJYUmFpbCwgJ21hcmdpbkxlZnQnKSkgKyBfLnRvSW50KGRvbS5jc3MoaS5zY3JvbGxiYXJYUmFpbCwgJ21hcmdpblJpZ2h0JykpO1xuICBpLnJhaWxZTWFyZ2luSGVpZ2h0ID0gXy50b0ludChkb20uY3NzKGkuc2Nyb2xsYmFyWVJhaWwsICdtYXJnaW5Ub3AnKSkgKyBfLnRvSW50KGRvbS5jc3MoaS5zY3JvbGxiYXJZUmFpbCwgJ21hcmdpbkJvdHRvbScpKTtcblxuICAvLyBIaWRlIHNjcm9sbGJhcnMgbm90IHRvIGFmZmVjdCBzY3JvbGxXaWR0aCBhbmQgc2Nyb2xsSGVpZ2h0XG4gIGRvbS5jc3MoaS5zY3JvbGxiYXJYUmFpbCwgJ2Rpc3BsYXknLCAnbm9uZScpO1xuICBkb20uY3NzKGkuc2Nyb2xsYmFyWVJhaWwsICdkaXNwbGF5JywgJ25vbmUnKTtcblxuICB1cGRhdGVHZW9tZXRyeShlbGVtZW50KTtcblxuICAvLyBVcGRhdGUgdG9wL2xlZnQgc2Nyb2xsIHRvIHRyaWdnZXIgZXZlbnRzXG4gIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAndG9wJywgZWxlbWVudC5zY3JvbGxUb3ApO1xuICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ2xlZnQnLCBlbGVtZW50LnNjcm9sbExlZnQpO1xuXG4gIGRvbS5jc3MoaS5zY3JvbGxiYXJYUmFpbCwgJ2Rpc3BsYXknLCAnJyk7XG4gIGRvbS5jc3MoaS5zY3JvbGxiYXJZUmFpbCwgJ2Rpc3BsYXknLCAnJyk7XG59O1xuIiwiLy8gQ2lyY2xlIHNoYXBlZCBwcm9ncmVzcyBiYXJcblxudmFyIFNoYXBlID0gcmVxdWlyZSgnLi9zaGFwZScpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgQ2lyY2xlID0gZnVuY3Rpb24gQ2lyY2xlKGNvbnRhaW5lciwgb3B0aW9ucykge1xuICAgIC8vIFVzZSB0d28gYXJjcyB0byBmb3JtIGEgY2lyY2xlXG4gICAgLy8gU2VlIHRoaXMgYW5zd2VyIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEwNDc3MzM0LzE0NDYwOTJcbiAgICB0aGlzLl9wYXRoVGVtcGxhdGUgPVxuICAgICAgICAnTSA1MCw1MCBtIDAsLXtyYWRpdXN9JyArXG4gICAgICAgICcgYSB7cmFkaXVzfSx7cmFkaXVzfSAwIDEgMSAwLHsycmFkaXVzfScgK1xuICAgICAgICAnIGEge3JhZGl1c30se3JhZGl1c30gMCAxIDEgMCwtezJyYWRpdXN9JztcblxuICAgIHRoaXMuY29udGFpbmVyQXNwZWN0UmF0aW8gPSAxO1xuXG4gICAgU2hhcGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5cbkNpcmNsZS5wcm90b3R5cGUgPSBuZXcgU2hhcGUoKTtcbkNpcmNsZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDaXJjbGU7XG5cbkNpcmNsZS5wcm90b3R5cGUuX3BhdGhTdHJpbmcgPSBmdW5jdGlvbiBfcGF0aFN0cmluZyhvcHRzKSB7XG4gICAgdmFyIHdpZHRoT2ZXaWRlciA9IG9wdHMuc3Ryb2tlV2lkdGg7XG4gICAgaWYgKG9wdHMudHJhaWxXaWR0aCAmJiBvcHRzLnRyYWlsV2lkdGggPiBvcHRzLnN0cm9rZVdpZHRoKSB7XG4gICAgICAgIHdpZHRoT2ZXaWRlciA9IG9wdHMudHJhaWxXaWR0aDtcbiAgICB9XG5cbiAgICB2YXIgciA9IDUwIC0gd2lkdGhPZldpZGVyIC8gMjtcblxuICAgIHJldHVybiB1dGlscy5yZW5kZXIodGhpcy5fcGF0aFRlbXBsYXRlLCB7XG4gICAgICAgIHJhZGl1czogcixcbiAgICAgICAgJzJyYWRpdXMnOiByICogMlxuICAgIH0pO1xufTtcblxuQ2lyY2xlLnByb3RvdHlwZS5fdHJhaWxTdHJpbmcgPSBmdW5jdGlvbiBfdHJhaWxTdHJpbmcob3B0cykge1xuICAgIHJldHVybiB0aGlzLl9wYXRoU3RyaW5nKG9wdHMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDaXJjbGU7XG4iLCIvLyBMaW5lIHNoYXBlZCBwcm9ncmVzcyBiYXJcblxudmFyIFNoYXBlID0gcmVxdWlyZSgnLi9zaGFwZScpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgTGluZSA9IGZ1bmN0aW9uIExpbmUoY29udGFpbmVyLCBvcHRpb25zKSB7XG4gICAgdGhpcy5fcGF0aFRlbXBsYXRlID0gJ00gMCx7Y2VudGVyfSBMIDEwMCx7Y2VudGVyfSc7XG4gICAgU2hhcGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5cbkxpbmUucHJvdG90eXBlID0gbmV3IFNoYXBlKCk7XG5MaW5lLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExpbmU7XG5cbkxpbmUucHJvdG90eXBlLl9pbml0aWFsaXplU3ZnID0gZnVuY3Rpb24gX2luaXRpYWxpemVTdmcoc3ZnLCBvcHRzKSB7XG4gICAgc3ZnLnNldEF0dHJpYnV0ZSgndmlld0JveCcsICcwIDAgMTAwICcgKyBvcHRzLnN0cm9rZVdpZHRoKTtcbiAgICBzdmcuc2V0QXR0cmlidXRlKCdwcmVzZXJ2ZUFzcGVjdFJhdGlvJywgJ25vbmUnKTtcbn07XG5cbkxpbmUucHJvdG90eXBlLl9wYXRoU3RyaW5nID0gZnVuY3Rpb24gX3BhdGhTdHJpbmcob3B0cykge1xuICAgIHJldHVybiB1dGlscy5yZW5kZXIodGhpcy5fcGF0aFRlbXBsYXRlLCB7XG4gICAgICAgIGNlbnRlcjogb3B0cy5zdHJva2VXaWR0aCAvIDJcbiAgICB9KTtcbn07XG5cbkxpbmUucHJvdG90eXBlLl90cmFpbFN0cmluZyA9IGZ1bmN0aW9uIF90cmFpbFN0cmluZyhvcHRzKSB7XG4gICAgcmV0dXJuIHRoaXMuX3BhdGhTdHJpbmcob3B0cyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExpbmU7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAvLyBIaWdoZXIgbGV2ZWwgQVBJLCBkaWZmZXJlbnQgc2hhcGVkIHByb2dyZXNzIGJhcnNcbiAgICBMaW5lOiByZXF1aXJlKCcuL2xpbmUnKSxcbiAgICBDaXJjbGU6IHJlcXVpcmUoJy4vY2lyY2xlJyksXG4gICAgU2VtaUNpcmNsZTogcmVxdWlyZSgnLi9zZW1pY2lyY2xlJyksXG5cbiAgICAvLyBMb3dlciBsZXZlbCBBUEkgdG8gdXNlIGFueSBTVkcgcGF0aFxuICAgIFBhdGg6IHJlcXVpcmUoJy4vcGF0aCcpLFxuXG4gICAgLy8gQmFzZS1jbGFzcyBmb3IgY3JlYXRpbmcgbmV3IGN1c3RvbSBzaGFwZXNcbiAgICAvLyB0byBiZSBpbiBsaW5lIHdpdGggdGhlIEFQSSBvZiBidWlsdC1pbiBzaGFwZXNcbiAgICAvLyBVbmRvY3VtZW50ZWQuXG4gICAgU2hhcGU6IHJlcXVpcmUoJy4vc2hhcGUnKSxcblxuICAgIC8vIEludGVybmFsIHV0aWxzLCB1bmRvY3VtZW50ZWQuXG4gICAgdXRpbHM6IHJlcXVpcmUoJy4vdXRpbHMnKVxufTtcbiIsIi8vIExvd2VyIGxldmVsIEFQSSB0byBhbmltYXRlIGFueSBraW5kIG9mIHN2ZyBwYXRoXG5cbnZhciBUd2VlbmFibGUgPSByZXF1aXJlKCdzaGlmdHknKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxudmFyIEVBU0lOR19BTElBU0VTID0ge1xuICAgIGVhc2VJbjogJ2Vhc2VJbkN1YmljJyxcbiAgICBlYXNlT3V0OiAnZWFzZU91dEN1YmljJyxcbiAgICBlYXNlSW5PdXQ6ICdlYXNlSW5PdXRDdWJpYydcbn07XG5cbnZhciBQYXRoID0gZnVuY3Rpb24gUGF0aChwYXRoLCBvcHRzKSB7XG4gICAgLy8gVGhyb3cgYSBiZXR0ZXIgZXJyb3IgaWYgbm90IGluaXRpYWxpemVkIHdpdGggYG5ld2Aga2V5d29yZFxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBQYXRoKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbnN0cnVjdG9yIHdhcyBjYWxsZWQgd2l0aG91dCBuZXcga2V5d29yZCcpO1xuICAgIH1cblxuICAgIC8vIERlZmF1bHQgcGFyYW1ldGVycyBmb3IgYW5pbWF0aW9uXG4gICAgb3B0cyA9IHV0aWxzLmV4dGVuZCh7XG4gICAgICAgIGR1cmF0aW9uOiA4MDAsXG4gICAgICAgIGVhc2luZzogJ2xpbmVhcicsXG4gICAgICAgIGZyb206IHt9LFxuICAgICAgICB0bzoge30sXG4gICAgICAgIHN0ZXA6IGZ1bmN0aW9uKCkge31cbiAgICB9LCBvcHRzKTtcblxuICAgIHZhciBlbGVtZW50O1xuICAgIGlmICh1dGlscy5pc1N0cmluZyhwYXRoKSkge1xuICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihwYXRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBlbGVtZW50ID0gcGF0aDtcbiAgICB9XG5cbiAgICAvLyBSZXZlYWwgLnBhdGggYXMgcHVibGljIGF0dHJpYnV0ZVxuICAgIHRoaXMucGF0aCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5fb3B0cyA9IG9wdHM7XG4gICAgdGhpcy5fdHdlZW5hYmxlID0gbnVsbDtcblxuICAgIC8vIFNldCB1cCB0aGUgc3RhcnRpbmcgcG9zaXRpb25zXG4gICAgdmFyIGxlbmd0aCA9IHRoaXMucGF0aC5nZXRUb3RhbExlbmd0aCgpO1xuICAgIHRoaXMucGF0aC5zdHlsZS5zdHJva2VEYXNoYXJyYXkgPSBsZW5ndGggKyAnICcgKyBsZW5ndGg7XG4gICAgdGhpcy5zZXQoMCk7XG59O1xuXG5QYXRoLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uIHZhbHVlKCkge1xuICAgIHZhciBvZmZzZXQgPSB0aGlzLl9nZXRDb21wdXRlZERhc2hPZmZzZXQoKTtcbiAgICB2YXIgbGVuZ3RoID0gdGhpcy5wYXRoLmdldFRvdGFsTGVuZ3RoKCk7XG5cbiAgICB2YXIgcHJvZ3Jlc3MgPSAxIC0gb2Zmc2V0IC8gbGVuZ3RoO1xuICAgIC8vIFJvdW5kIG51bWJlciB0byBwcmV2ZW50IHJldHVybmluZyB2ZXJ5IHNtYWxsIG51bWJlciBsaWtlIDFlLTMwLCB3aGljaFxuICAgIC8vIGlzIHByYWN0aWNhbGx5IDBcbiAgICByZXR1cm4gcGFyc2VGbG9hdChwcm9ncmVzcy50b0ZpeGVkKDYpLCAxMCk7XG59O1xuXG5QYXRoLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQocHJvZ3Jlc3MpIHtcbiAgICB0aGlzLnN0b3AoKTtcblxuICAgIHRoaXMucGF0aC5zdHlsZS5zdHJva2VEYXNob2Zmc2V0ID0gdGhpcy5fcHJvZ3Jlc3NUb09mZnNldChwcm9ncmVzcyk7XG5cbiAgICB2YXIgc3RlcCA9IHRoaXMuX29wdHMuc3RlcDtcbiAgICBpZiAodXRpbHMuaXNGdW5jdGlvbihzdGVwKSkge1xuICAgICAgICB2YXIgZWFzaW5nID0gdGhpcy5fZWFzaW5nKHRoaXMuX29wdHMuZWFzaW5nKTtcbiAgICAgICAgdmFyIHZhbHVlcyA9IHRoaXMuX2NhbGN1bGF0ZVRvKHByb2dyZXNzLCBlYXNpbmcpO1xuICAgICAgICB2YXIgcmVmZXJlbmNlID0gdGhpcy5fb3B0cy5zaGFwZSB8fCB0aGlzO1xuICAgICAgICBzdGVwKHZhbHVlcywgcmVmZXJlbmNlLCB0aGlzLl9vcHRzLmF0dGFjaG1lbnQpO1xuICAgIH1cbn07XG5cblBhdGgucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiBzdG9wKCkge1xuICAgIHRoaXMuX3N0b3BUd2VlbigpO1xuICAgIHRoaXMucGF0aC5zdHlsZS5zdHJva2VEYXNob2Zmc2V0ID0gdGhpcy5fZ2V0Q29tcHV0ZWREYXNoT2Zmc2V0KCk7XG59O1xuXG4vLyBNZXRob2QgaW50cm9kdWNlZCBoZXJlOlxuLy8gaHR0cDovL2pha2VhcmNoaWJhbGQuY29tLzIwMTMvYW5pbWF0ZWQtbGluZS1kcmF3aW5nLXN2Zy9cblBhdGgucHJvdG90eXBlLmFuaW1hdGUgPSBmdW5jdGlvbiBhbmltYXRlKHByb2dyZXNzLCBvcHRzLCBjYikge1xuICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgaWYgKHV0aWxzLmlzRnVuY3Rpb24ob3B0cykpIHtcbiAgICAgICAgY2IgPSBvcHRzO1xuICAgICAgICBvcHRzID0ge307XG4gICAgfVxuXG4gICAgdmFyIHBhc3NlZE9wdHMgPSB1dGlscy5leHRlbmQoe30sIG9wdHMpO1xuXG4gICAgLy8gQ29weSBkZWZhdWx0IG9wdHMgdG8gbmV3IG9iamVjdCBzbyBkZWZhdWx0cyBhcmUgbm90IG1vZGlmaWVkXG4gICAgdmFyIGRlZmF1bHRPcHRzID0gdXRpbHMuZXh0ZW5kKHt9LCB0aGlzLl9vcHRzKTtcbiAgICBvcHRzID0gdXRpbHMuZXh0ZW5kKGRlZmF1bHRPcHRzLCBvcHRzKTtcblxuICAgIHZhciBzaGlmdHlFYXNpbmcgPSB0aGlzLl9lYXNpbmcob3B0cy5lYXNpbmcpO1xuICAgIHZhciB2YWx1ZXMgPSB0aGlzLl9yZXNvbHZlRnJvbUFuZFRvKHByb2dyZXNzLCBzaGlmdHlFYXNpbmcsIHBhc3NlZE9wdHMpO1xuXG4gICAgdGhpcy5zdG9wKCk7XG5cbiAgICAvLyBUcmlnZ2VyIGEgbGF5b3V0IHNvIHN0eWxlcyBhcmUgY2FsY3VsYXRlZCAmIHRoZSBicm93c2VyXG4gICAgLy8gcGlja3MgdXAgdGhlIHN0YXJ0aW5nIHBvc2l0aW9uIGJlZm9yZSBhbmltYXRpbmdcbiAgICB0aGlzLnBhdGguZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICB2YXIgb2Zmc2V0ID0gdGhpcy5fZ2V0Q29tcHV0ZWREYXNoT2Zmc2V0KCk7XG4gICAgdmFyIG5ld09mZnNldCA9IHRoaXMuX3Byb2dyZXNzVG9PZmZzZXQocHJvZ3Jlc3MpO1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuX3R3ZWVuYWJsZSA9IG5ldyBUd2VlbmFibGUoKTtcbiAgICB0aGlzLl90d2VlbmFibGUudHdlZW4oe1xuICAgICAgICBmcm9tOiB1dGlscy5leHRlbmQoeyBvZmZzZXQ6IG9mZnNldCB9LCB2YWx1ZXMuZnJvbSksXG4gICAgICAgIHRvOiB1dGlscy5leHRlbmQoeyBvZmZzZXQ6IG5ld09mZnNldCB9LCB2YWx1ZXMudG8pLFxuICAgICAgICBkdXJhdGlvbjogb3B0cy5kdXJhdGlvbixcbiAgICAgICAgZWFzaW5nOiBzaGlmdHlFYXNpbmcsXG4gICAgICAgIHN0ZXA6IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgICAgICAgICBzZWxmLnBhdGguc3R5bGUuc3Ryb2tlRGFzaG9mZnNldCA9IHN0YXRlLm9mZnNldDtcbiAgICAgICAgICAgIHZhciByZWZlcmVuY2UgPSBvcHRzLnNoYXBlIHx8IHNlbGY7XG4gICAgICAgICAgICBvcHRzLnN0ZXAoc3RhdGUsIHJlZmVyZW5jZSwgb3B0cy5hdHRhY2htZW50KTtcbiAgICAgICAgfSxcbiAgICAgICAgZmluaXNoOiBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgICAgICAgaWYgKHV0aWxzLmlzRnVuY3Rpb24oY2IpKSB7XG4gICAgICAgICAgICAgICAgY2IoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuUGF0aC5wcm90b3R5cGUuX2dldENvbXB1dGVkRGFzaE9mZnNldCA9IGZ1bmN0aW9uIF9nZXRDb21wdXRlZERhc2hPZmZzZXQoKSB7XG4gICAgdmFyIGNvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLnBhdGgsIG51bGwpO1xuICAgIHJldHVybiBwYXJzZUZsb2F0KGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnc3Ryb2tlLWRhc2hvZmZzZXQnKSwgMTApO1xufTtcblxuUGF0aC5wcm90b3R5cGUuX3Byb2dyZXNzVG9PZmZzZXQgPSBmdW5jdGlvbiBfcHJvZ3Jlc3NUb09mZnNldChwcm9ncmVzcykge1xuICAgIHZhciBsZW5ndGggPSB0aGlzLnBhdGguZ2V0VG90YWxMZW5ndGgoKTtcbiAgICByZXR1cm4gbGVuZ3RoIC0gcHJvZ3Jlc3MgKiBsZW5ndGg7XG59O1xuXG4vLyBSZXNvbHZlcyBmcm9tIGFuZCB0byB2YWx1ZXMgZm9yIGFuaW1hdGlvbi5cblBhdGgucHJvdG90eXBlLl9yZXNvbHZlRnJvbUFuZFRvID0gZnVuY3Rpb24gX3Jlc29sdmVGcm9tQW5kVG8ocHJvZ3Jlc3MsIGVhc2luZywgb3B0cykge1xuICAgIGlmIChvcHRzLmZyb20gJiYgb3B0cy50bykge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZnJvbTogb3B0cy5mcm9tLFxuICAgICAgICAgICAgdG86IG9wdHMudG9cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBmcm9tOiB0aGlzLl9jYWxjdWxhdGVGcm9tKGVhc2luZyksXG4gICAgICAgIHRvOiB0aGlzLl9jYWxjdWxhdGVUbyhwcm9ncmVzcywgZWFzaW5nKVxuICAgIH07XG59O1xuXG4vLyBDYWxjdWxhdGUgYGZyb21gIHZhbHVlcyBmcm9tIG9wdGlvbnMgcGFzc2VkIGF0IGluaXRpYWxpemF0aW9uXG5QYXRoLnByb3RvdHlwZS5fY2FsY3VsYXRlRnJvbSA9IGZ1bmN0aW9uIF9jYWxjdWxhdGVGcm9tKGVhc2luZykge1xuICAgIHJldHVybiBUd2VlbmFibGUuaW50ZXJwb2xhdGUodGhpcy5fb3B0cy5mcm9tLCB0aGlzLl9vcHRzLnRvLCB0aGlzLnZhbHVlKCksIGVhc2luZyk7XG59O1xuXG4vLyBDYWxjdWxhdGUgYHRvYCB2YWx1ZXMgZnJvbSBvcHRpb25zIHBhc3NlZCBhdCBpbml0aWFsaXphdGlvblxuUGF0aC5wcm90b3R5cGUuX2NhbGN1bGF0ZVRvID0gZnVuY3Rpb24gX2NhbGN1bGF0ZVRvKHByb2dyZXNzLCBlYXNpbmcpIHtcbiAgICByZXR1cm4gVHdlZW5hYmxlLmludGVycG9sYXRlKHRoaXMuX29wdHMuZnJvbSwgdGhpcy5fb3B0cy50bywgcHJvZ3Jlc3MsIGVhc2luZyk7XG59O1xuXG5QYXRoLnByb3RvdHlwZS5fc3RvcFR3ZWVuID0gZnVuY3Rpb24gX3N0b3BUd2VlbigpIHtcbiAgICBpZiAodGhpcy5fdHdlZW5hYmxlICE9PSBudWxsKSB7XG4gICAgICAgIHRoaXMuX3R3ZWVuYWJsZS5zdG9wKCk7XG4gICAgICAgIHRoaXMuX3R3ZWVuYWJsZSA9IG51bGw7XG4gICAgfVxufTtcblxuUGF0aC5wcm90b3R5cGUuX2Vhc2luZyA9IGZ1bmN0aW9uIF9lYXNpbmcoZWFzaW5nKSB7XG4gICAgaWYgKEVBU0lOR19BTElBU0VTLmhhc093blByb3BlcnR5KGVhc2luZykpIHtcbiAgICAgICAgcmV0dXJuIEVBU0lOR19BTElBU0VTW2Vhc2luZ107XG4gICAgfVxuXG4gICAgcmV0dXJuIGVhc2luZztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUGF0aDtcbiIsIi8vIFNlbWktU2VtaUNpcmNsZSBzaGFwZWQgcHJvZ3Jlc3MgYmFyXG5cbnZhciBTaGFwZSA9IHJlcXVpcmUoJy4vc2hhcGUnKTtcbnZhciBDaXJjbGUgPSByZXF1aXJlKCcuL2NpcmNsZScpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgU2VtaUNpcmNsZSA9IGZ1bmN0aW9uIFNlbWlDaXJjbGUoY29udGFpbmVyLCBvcHRpb25zKSB7XG4gICAgLy8gVXNlIG9uZSBhcmMgdG8gZm9ybSBhIFNlbWlDaXJjbGVcbiAgICAvLyBTZWUgdGhpcyBhbnN3ZXIgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTA0NzczMzQvMTQ0NjA5MlxuICAgIHRoaXMuX3BhdGhUZW1wbGF0ZSA9XG4gICAgICAgICdNIDUwLDUwIG0gLXtyYWRpdXN9LDAnICtcbiAgICAgICAgJyBhIHtyYWRpdXN9LHtyYWRpdXN9IDAgMSAxIHsycmFkaXVzfSwwJztcblxuICAgIHRoaXMuY29udGFpbmVyQXNwZWN0UmF0aW8gPSAyO1xuXG4gICAgU2hhcGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5cblNlbWlDaXJjbGUucHJvdG90eXBlID0gbmV3IFNoYXBlKCk7XG5TZW1pQ2lyY2xlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFNlbWlDaXJjbGU7XG5cblNlbWlDaXJjbGUucHJvdG90eXBlLl9pbml0aWFsaXplU3ZnID0gZnVuY3Rpb24gX2luaXRpYWxpemVTdmcoc3ZnLCBvcHRzKSB7XG4gICAgc3ZnLnNldEF0dHJpYnV0ZSgndmlld0JveCcsICcwIDAgMTAwIDUwJyk7XG59O1xuXG5TZW1pQ2lyY2xlLnByb3RvdHlwZS5faW5pdGlhbGl6ZVRleHRDb250YWluZXIgPSBmdW5jdGlvbiBfaW5pdGlhbGl6ZVRleHRDb250YWluZXIoXG4gICAgb3B0cyxcbiAgICBjb250YWluZXIsXG4gICAgdGV4dENvbnRhaW5lclxuKSB7XG4gICAgaWYgKG9wdHMudGV4dC5zdHlsZSkge1xuICAgICAgICAvLyBSZXNldCB0b3Agc3R5bGVcbiAgICAgICAgdGV4dENvbnRhaW5lci5zdHlsZS50b3AgPSAnYXV0byc7XG4gICAgICAgIHRleHRDb250YWluZXIuc3R5bGUuYm90dG9tID0gJzAnO1xuXG4gICAgICAgIGlmIChvcHRzLnRleHQuYWxpZ25Ub0JvdHRvbSkge1xuICAgICAgICAgICAgdXRpbHMuc2V0U3R5bGUodGV4dENvbnRhaW5lciwgJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoLTUwJSwgMCknKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHV0aWxzLnNldFN0eWxlKHRleHRDb250YWluZXIsICd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKC01MCUsIDUwJSknKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8vIFNoYXJlIGZ1bmN0aW9uYWxpdHkgd2l0aCBDaXJjbGUsIGp1c3QgaGF2ZSBkaWZmZXJlbnQgcGF0aFxuU2VtaUNpcmNsZS5wcm90b3R5cGUuX3BhdGhTdHJpbmcgPSBDaXJjbGUucHJvdG90eXBlLl9wYXRoU3RyaW5nO1xuU2VtaUNpcmNsZS5wcm90b3R5cGUuX3RyYWlsU3RyaW5nID0gQ2lyY2xlLnByb3RvdHlwZS5fdHJhaWxTdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gU2VtaUNpcmNsZTtcbiIsIi8vIEJhc2Ugb2JqZWN0IGZvciBkaWZmZXJlbnQgcHJvZ3Jlc3MgYmFyIHNoYXBlc1xuXG52YXIgUGF0aCA9IHJlcXVpcmUoJy4vcGF0aCcpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuXG52YXIgREVTVFJPWUVEX0VSUk9SID0gJ09iamVjdCBpcyBkZXN0cm95ZWQnO1xuXG52YXIgU2hhcGUgPSBmdW5jdGlvbiBTaGFwZShjb250YWluZXIsIG9wdHMpIHtcbiAgICAvLyBUaHJvdyBhIGJldHRlciBlcnJvciBpZiBwcm9ncmVzcyBiYXJzIGFyZSBub3QgaW5pdGlhbGl6ZWQgd2l0aCBgbmV3YFxuICAgIC8vIGtleXdvcmRcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgU2hhcGUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ29uc3RydWN0b3Igd2FzIGNhbGxlZCB3aXRob3V0IG5ldyBrZXl3b3JkJyk7XG4gICAgfVxuXG4gICAgLy8gUHJldmVudCBjYWxsaW5nIGNvbnN0cnVjdG9yIHdpdGhvdXQgcGFyYW1ldGVycyBzbyBpbmhlcml0YW5jZVxuICAgIC8vIHdvcmtzIGNvcnJlY3RseS4gVG8gdW5kZXJzdGFuZCwgdGhpcyBpcyBob3cgU2hhcGUgaXMgaW5oZXJpdGVkOlxuICAgIC8vXG4gICAgLy8gICBMaW5lLnByb3RvdHlwZSA9IG5ldyBTaGFwZSgpO1xuICAgIC8vXG4gICAgLy8gV2UganVzdCB3YW50IHRvIHNldCB0aGUgcHJvdG90eXBlIGZvciBMaW5lLlxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBEZWZhdWx0IHBhcmFtZXRlcnMgZm9yIHByb2dyZXNzIGJhciBjcmVhdGlvblxuICAgIHRoaXMuX29wdHMgPSB1dGlscy5leHRlbmQoe1xuICAgICAgICBjb2xvcjogJyM1NTUnLFxuICAgICAgICBzdHJva2VXaWR0aDogMS4wLFxuICAgICAgICB0cmFpbENvbG9yOiBudWxsLFxuICAgICAgICB0cmFpbFdpZHRoOiBudWxsLFxuICAgICAgICBmaWxsOiBudWxsLFxuICAgICAgICB0ZXh0OiB7XG4gICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICAgIGNvbG9yOiBudWxsLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgICAgIGxlZnQ6ICc1MCUnLFxuICAgICAgICAgICAgICAgIHRvcDogJzUwJScsXG4gICAgICAgICAgICAgICAgcGFkZGluZzogMCxcbiAgICAgICAgICAgICAgICBtYXJnaW46IDAsXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtOiB7XG4gICAgICAgICAgICAgICAgICAgIHByZWZpeDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICd0cmFuc2xhdGUoLTUwJSwgLTUwJSknXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGF1dG9TdHlsZUNvbnRhaW5lcjogdHJ1ZSxcbiAgICAgICAgICAgIGFsaWduVG9Cb3R0b206IHRydWUsXG4gICAgICAgICAgICB2YWx1ZTogbnVsbCxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogJ3Byb2dyZXNzYmFyLXRleHQnXG4gICAgICAgIH0sXG4gICAgICAgIHN2Z1N0eWxlOiB7XG4gICAgICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgICAgICAgd2lkdGg6ICcxMDAlJ1xuICAgICAgICB9LFxuICAgICAgICB3YXJuaW5nczogZmFsc2VcbiAgICB9LCBvcHRzLCB0cnVlKTsgIC8vIFVzZSByZWN1cnNpdmUgZXh0ZW5kXG5cbiAgICAvLyBJZiB1c2VyIHNwZWNpZmllcyBlLmcuIHN2Z1N0eWxlIG9yIHRleHQgc3R5bGUsIHRoZSB3aG9sZSBvYmplY3RcbiAgICAvLyBzaG91bGQgcmVwbGFjZSB0aGUgZGVmYXVsdHMgdG8gbWFrZSB3b3JraW5nIHdpdGggc3R5bGVzIGVhc2llclxuICAgIGlmICh1dGlscy5pc09iamVjdChvcHRzKSAmJiBvcHRzLnN2Z1N0eWxlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5fb3B0cy5zdmdTdHlsZSA9IG9wdHMuc3ZnU3R5bGU7XG4gICAgfVxuICAgIGlmICh1dGlscy5pc09iamVjdChvcHRzKSAmJiB1dGlscy5pc09iamVjdChvcHRzLnRleHQpICYmIG9wdHMudGV4dC5zdHlsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuX29wdHMudGV4dC5zdHlsZSA9IG9wdHMudGV4dC5zdHlsZTtcbiAgICB9XG5cbiAgICB2YXIgc3ZnVmlldyA9IHRoaXMuX2NyZWF0ZVN2Z1ZpZXcodGhpcy5fb3B0cyk7XG5cbiAgICB2YXIgZWxlbWVudDtcbiAgICBpZiAodXRpbHMuaXNTdHJpbmcoY29udGFpbmVyKSkge1xuICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihjb250YWluZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnQgPSBjb250YWluZXI7XG4gICAgfVxuXG4gICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ29udGFpbmVyIGRvZXMgbm90IGV4aXN0OiAnICsgY29udGFpbmVyKTtcbiAgICB9XG5cbiAgICB0aGlzLl9jb250YWluZXIgPSBlbGVtZW50O1xuICAgIHRoaXMuX2NvbnRhaW5lci5hcHBlbmRDaGlsZChzdmdWaWV3LnN2Zyk7XG4gICAgaWYgKHRoaXMuX29wdHMud2FybmluZ3MpIHtcbiAgICAgICAgdGhpcy5fd2FybkNvbnRhaW5lckFzcGVjdFJhdGlvKHRoaXMuX2NvbnRhaW5lcik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX29wdHMuc3ZnU3R5bGUpIHtcbiAgICAgICAgdXRpbHMuc2V0U3R5bGVzKHN2Z1ZpZXcuc3ZnLCB0aGlzLl9vcHRzLnN2Z1N0eWxlKTtcbiAgICB9XG5cbiAgICAvLyBFeHBvc2UgcHVibGljIGF0dHJpYnV0ZXMgYmVmb3JlIFBhdGggaW5pdGlhbGl6YXRpb25cbiAgICB0aGlzLnN2ZyA9IHN2Z1ZpZXcuc3ZnO1xuICAgIHRoaXMucGF0aCA9IHN2Z1ZpZXcucGF0aDtcbiAgICB0aGlzLnRyYWlsID0gc3ZnVmlldy50cmFpbDtcbiAgICB0aGlzLnRleHQgPSBudWxsO1xuXG4gICAgdmFyIG5ld09wdHMgPSB1dGlscy5leHRlbmQoe1xuICAgICAgICBhdHRhY2htZW50OiB1bmRlZmluZWQsXG4gICAgICAgIHNoYXBlOiB0aGlzXG4gICAgfSwgdGhpcy5fb3B0cyk7XG4gICAgdGhpcy5fcHJvZ3Jlc3NQYXRoID0gbmV3IFBhdGgoc3ZnVmlldy5wYXRoLCBuZXdPcHRzKTtcblxuICAgIGlmICh1dGlscy5pc09iamVjdCh0aGlzLl9vcHRzLnRleHQpICYmIHRoaXMuX29wdHMudGV4dC52YWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLnNldFRleHQodGhpcy5fb3B0cy50ZXh0LnZhbHVlKTtcbiAgICB9XG59O1xuXG5TaGFwZS5wcm90b3R5cGUuYW5pbWF0ZSA9IGZ1bmN0aW9uIGFuaW1hdGUocHJvZ3Jlc3MsIG9wdHMsIGNiKSB7XG4gICAgaWYgKHRoaXMuX3Byb2dyZXNzUGF0aCA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoREVTVFJPWUVEX0VSUk9SKTtcbiAgICB9XG5cbiAgICB0aGlzLl9wcm9ncmVzc1BhdGguYW5pbWF0ZShwcm9ncmVzcywgb3B0cywgY2IpO1xufTtcblxuU2hhcGUucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiBzdG9wKCkge1xuICAgIGlmICh0aGlzLl9wcm9ncmVzc1BhdGggPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKERFU1RST1lFRF9FUlJPUik7XG4gICAgfVxuXG4gICAgLy8gRG9uJ3QgY3Jhc2ggaWYgc3RvcCBpcyBjYWxsZWQgaW5zaWRlIHN0ZXAgZnVuY3Rpb25cbiAgICBpZiAodGhpcy5fcHJvZ3Jlc3NQYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuX3Byb2dyZXNzUGF0aC5zdG9wKCk7XG59O1xuXG5TaGFwZS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuX3Byb2dyZXNzUGF0aCA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoREVTVFJPWUVEX0VSUk9SKTtcbiAgICB9XG5cbiAgICB0aGlzLnN0b3AoKTtcbiAgICB0aGlzLnN2Zy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuc3ZnKTtcbiAgICB0aGlzLnN2ZyA9IG51bGw7XG4gICAgdGhpcy5wYXRoID0gbnVsbDtcbiAgICB0aGlzLnRyYWlsID0gbnVsbDtcbiAgICB0aGlzLl9wcm9ncmVzc1BhdGggPSBudWxsO1xuXG4gICAgaWYgKHRoaXMudGV4dCAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLnRleHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLnRleHQpO1xuICAgICAgICB0aGlzLnRleHQgPSBudWxsO1xuICAgIH1cbn07XG5cblNoYXBlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQocHJvZ3Jlc3MpIHtcbiAgICBpZiAodGhpcy5fcHJvZ3Jlc3NQYXRoID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihERVNUUk9ZRURfRVJST1IpO1xuICAgIH1cblxuICAgIHRoaXMuX3Byb2dyZXNzUGF0aC5zZXQocHJvZ3Jlc3MpO1xufTtcblxuU2hhcGUucHJvdG90eXBlLnZhbHVlID0gZnVuY3Rpb24gdmFsdWUoKSB7XG4gICAgaWYgKHRoaXMuX3Byb2dyZXNzUGF0aCA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoREVTVFJPWUVEX0VSUk9SKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fcHJvZ3Jlc3NQYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuX3Byb2dyZXNzUGF0aC52YWx1ZSgpO1xufTtcblxuU2hhcGUucHJvdG90eXBlLnNldFRleHQgPSBmdW5jdGlvbiBzZXRUZXh0KG5ld1RleHQpIHtcbiAgICBpZiAodGhpcy5fcHJvZ3Jlc3NQYXRoID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihERVNUUk9ZRURfRVJST1IpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnRleHQgPT09IG51bGwpIHtcbiAgICAgICAgLy8gQ3JlYXRlIG5ldyB0ZXh0IG5vZGVcbiAgICAgICAgdGhpcy50ZXh0ID0gdGhpcy5fY3JlYXRlVGV4dENvbnRhaW5lcih0aGlzLl9vcHRzLCB0aGlzLl9jb250YWluZXIpO1xuICAgICAgICB0aGlzLl9jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy50ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgcHJldmlvdXMgdGV4dCBhbmQgYWRkIG5ld1xuICAgIGlmICh1dGlscy5pc09iamVjdChuZXdUZXh0KSkge1xuICAgICAgICB1dGlscy5yZW1vdmVDaGlsZHJlbih0aGlzLnRleHQpO1xuICAgICAgICB0aGlzLnRleHQuYXBwZW5kQ2hpbGQobmV3VGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy50ZXh0LmlubmVySFRNTCA9IG5ld1RleHQ7XG4gICAgfVxufTtcblxuU2hhcGUucHJvdG90eXBlLl9jcmVhdGVTdmdWaWV3ID0gZnVuY3Rpb24gX2NyZWF0ZVN2Z1ZpZXcob3B0cykge1xuICAgIHZhciBzdmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgJ3N2ZycpO1xuICAgIHRoaXMuX2luaXRpYWxpemVTdmcoc3ZnLCBvcHRzKTtcblxuICAgIHZhciB0cmFpbFBhdGggPSBudWxsO1xuICAgIC8vIEVhY2ggb3B0aW9uIGxpc3RlZCBpbiB0aGUgaWYgY29uZGl0aW9uIGFyZSAndHJpZ2dlcnMnIGZvciBjcmVhdGluZ1xuICAgIC8vIHRoZSB0cmFpbCBwYXRoXG4gICAgaWYgKG9wdHMudHJhaWxDb2xvciB8fCBvcHRzLnRyYWlsV2lkdGgpIHtcbiAgICAgICAgdHJhaWxQYXRoID0gdGhpcy5fY3JlYXRlVHJhaWwob3B0cyk7XG4gICAgICAgIHN2Zy5hcHBlbmRDaGlsZCh0cmFpbFBhdGgpO1xuICAgIH1cblxuICAgIHZhciBwYXRoID0gdGhpcy5fY3JlYXRlUGF0aChvcHRzKTtcbiAgICBzdmcuYXBwZW5kQ2hpbGQocGF0aCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBzdmc6IHN2ZyxcbiAgICAgICAgcGF0aDogcGF0aCxcbiAgICAgICAgdHJhaWw6IHRyYWlsUGF0aFxuICAgIH07XG59O1xuXG5TaGFwZS5wcm90b3R5cGUuX2luaXRpYWxpemVTdmcgPSBmdW5jdGlvbiBfaW5pdGlhbGl6ZVN2ZyhzdmcsIG9wdHMpIHtcbiAgICBzdmcuc2V0QXR0cmlidXRlKCd2aWV3Qm94JywgJzAgMCAxMDAgMTAwJyk7XG59O1xuXG5TaGFwZS5wcm90b3R5cGUuX2NyZWF0ZVBhdGggPSBmdW5jdGlvbiBfY3JlYXRlUGF0aChvcHRzKSB7XG4gICAgdmFyIHBhdGhTdHJpbmcgPSB0aGlzLl9wYXRoU3RyaW5nKG9wdHMpO1xuICAgIHJldHVybiB0aGlzLl9jcmVhdGVQYXRoRWxlbWVudChwYXRoU3RyaW5nLCBvcHRzKTtcbn07XG5cblNoYXBlLnByb3RvdHlwZS5fY3JlYXRlVHJhaWwgPSBmdW5jdGlvbiBfY3JlYXRlVHJhaWwob3B0cykge1xuICAgIC8vIENyZWF0ZSBwYXRoIHN0cmluZyB3aXRoIG9yaWdpbmFsIHBhc3NlZCBvcHRpb25zXG4gICAgdmFyIHBhdGhTdHJpbmcgPSB0aGlzLl90cmFpbFN0cmluZyhvcHRzKTtcblxuICAgIC8vIFByZXZlbnQgbW9kaWZ5aW5nIG9yaWdpbmFsXG4gICAgdmFyIG5ld09wdHMgPSB1dGlscy5leHRlbmQoe30sIG9wdHMpO1xuXG4gICAgLy8gRGVmYXVsdHMgZm9yIHBhcmFtZXRlcnMgd2hpY2ggbW9kaWZ5IHRyYWlsIHBhdGhcbiAgICBpZiAoIW5ld09wdHMudHJhaWxDb2xvcikge1xuICAgICAgICBuZXdPcHRzLnRyYWlsQ29sb3IgPSAnI2VlZSc7XG4gICAgfVxuICAgIGlmICghbmV3T3B0cy50cmFpbFdpZHRoKSB7XG4gICAgICAgIG5ld09wdHMudHJhaWxXaWR0aCA9IG5ld09wdHMuc3Ryb2tlV2lkdGg7XG4gICAgfVxuXG4gICAgbmV3T3B0cy5jb2xvciA9IG5ld09wdHMudHJhaWxDb2xvcjtcbiAgICBuZXdPcHRzLnN0cm9rZVdpZHRoID0gbmV3T3B0cy50cmFpbFdpZHRoO1xuXG4gICAgLy8gV2hlbiB0cmFpbCBwYXRoIGlzIHNldCwgZmlsbCBtdXN0IGJlIHNldCBmb3IgaXQgaW5zdGVhZCBvZiB0aGVcbiAgICAvLyBhY3R1YWwgcGF0aCB0byBwcmV2ZW50IHRyYWlsIHN0cm9rZSBmcm9tIGNsaXBwaW5nXG4gICAgbmV3T3B0cy5maWxsID0gbnVsbDtcblxuICAgIHJldHVybiB0aGlzLl9jcmVhdGVQYXRoRWxlbWVudChwYXRoU3RyaW5nLCBuZXdPcHRzKTtcbn07XG5cblNoYXBlLnByb3RvdHlwZS5fY3JlYXRlUGF0aEVsZW1lbnQgPSBmdW5jdGlvbiBfY3JlYXRlUGF0aEVsZW1lbnQocGF0aFN0cmluZywgb3B0cykge1xuICAgIHZhciBwYXRoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsICdwYXRoJyk7XG4gICAgcGF0aC5zZXRBdHRyaWJ1dGUoJ2QnLCBwYXRoU3RyaW5nKTtcbiAgICBwYXRoLnNldEF0dHJpYnV0ZSgnc3Ryb2tlJywgb3B0cy5jb2xvcik7XG4gICAgcGF0aC5zZXRBdHRyaWJ1dGUoJ3N0cm9rZS13aWR0aCcsIG9wdHMuc3Ryb2tlV2lkdGgpO1xuXG4gICAgaWYgKG9wdHMuZmlsbCkge1xuICAgICAgICBwYXRoLnNldEF0dHJpYnV0ZSgnZmlsbCcsIG9wdHMuZmlsbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcGF0aC5zZXRBdHRyaWJ1dGUoJ2ZpbGwtb3BhY2l0eScsICcwJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdGg7XG59O1xuXG5TaGFwZS5wcm90b3R5cGUuX2NyZWF0ZVRleHRDb250YWluZXIgPSBmdW5jdGlvbiBfY3JlYXRlVGV4dENvbnRhaW5lcihvcHRzLCBjb250YWluZXIpIHtcbiAgICB2YXIgdGV4dENvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRleHRDb250YWluZXIuY2xhc3NOYW1lID0gb3B0cy50ZXh0LmNsYXNzTmFtZTtcblxuICAgIHZhciB0ZXh0U3R5bGUgPSBvcHRzLnRleHQuc3R5bGU7XG4gICAgaWYgKHRleHRTdHlsZSkge1xuICAgICAgICBpZiAob3B0cy50ZXh0LmF1dG9TdHlsZUNvbnRhaW5lcikge1xuICAgICAgICAgICAgY29udGFpbmVyLnN0eWxlLnBvc2l0aW9uID0gJ3JlbGF0aXZlJztcbiAgICAgICAgfVxuXG4gICAgICAgIHV0aWxzLnNldFN0eWxlcyh0ZXh0Q29udGFpbmVyLCB0ZXh0U3R5bGUpO1xuICAgICAgICAvLyBEZWZhdWx0IHRleHQgY29sb3IgdG8gcHJvZ3Jlc3MgYmFyJ3MgY29sb3JcbiAgICAgICAgaWYgKCF0ZXh0U3R5bGUuY29sb3IpIHtcbiAgICAgICAgICAgIHRleHRDb250YWluZXIuc3R5bGUuY29sb3IgPSBvcHRzLmNvbG9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5faW5pdGlhbGl6ZVRleHRDb250YWluZXIob3B0cywgY29udGFpbmVyLCB0ZXh0Q29udGFpbmVyKTtcbiAgICByZXR1cm4gdGV4dENvbnRhaW5lcjtcbn07XG5cbi8vIEdpdmUgY3VzdG9tIHNoYXBlcyBwb3NzaWJpbGl0eSB0byBtb2RpZnkgdGV4dCBlbGVtZW50XG5TaGFwZS5wcm90b3R5cGUuX2luaXRpYWxpemVUZXh0Q29udGFpbmVyID0gZnVuY3Rpb24ob3B0cywgY29udGFpbmVyLCBlbGVtZW50KSB7XG4gICAgLy8gQnkgZGVmYXVsdCwgbm8tb3BcbiAgICAvLyBDdXN0b20gc2hhcGVzIHNob3VsZCByZXNwZWN0IEFQSSBvcHRpb25zLCBzdWNoIGFzIHRleHQuc3R5bGVcbn07XG5cblNoYXBlLnByb3RvdHlwZS5fcGF0aFN0cmluZyA9IGZ1bmN0aW9uIF9wYXRoU3RyaW5nKG9wdHMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ092ZXJyaWRlIHRoaXMgZnVuY3Rpb24gZm9yIGVhY2ggcHJvZ3Jlc3MgYmFyJyk7XG59O1xuXG5TaGFwZS5wcm90b3R5cGUuX3RyYWlsU3RyaW5nID0gZnVuY3Rpb24gX3RyYWlsU3RyaW5nKG9wdHMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ092ZXJyaWRlIHRoaXMgZnVuY3Rpb24gZm9yIGVhY2ggcHJvZ3Jlc3MgYmFyJyk7XG59O1xuXG5TaGFwZS5wcm90b3R5cGUuX3dhcm5Db250YWluZXJBc3BlY3RSYXRpbyA9IGZ1bmN0aW9uIF93YXJuQ29udGFpbmVyQXNwZWN0UmF0aW8oY29udGFpbmVyKSB7XG4gICAgaWYgKCF0aGlzLmNvbnRhaW5lckFzcGVjdFJhdGlvKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgY29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGNvbnRhaW5lciwgbnVsbCk7XG4gICAgdmFyIHdpZHRoID0gcGFyc2VGbG9hdChjb21wdXRlZFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3dpZHRoJyksIDEwKTtcbiAgICB2YXIgaGVpZ2h0ID0gcGFyc2VGbG9hdChjb21wdXRlZFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2hlaWdodCcpLCAxMCk7XG4gICAgaWYgKCF1dGlscy5mbG9hdEVxdWFscyh0aGlzLmNvbnRhaW5lckFzcGVjdFJhdGlvLCB3aWR0aCAvIGhlaWdodCkpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgJ0luY29ycmVjdCBhc3BlY3QgcmF0aW8gb2YgY29udGFpbmVyJyxcbiAgICAgICAgICAgICcjJyArIGNvbnRhaW5lci5pZCxcbiAgICAgICAgICAgICdkZXRlY3RlZDonLFxuICAgICAgICAgICAgY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCd3aWR0aCcpICsgJyh3aWR0aCknLFxuICAgICAgICAgICAgJy8nLFxuICAgICAgICAgICAgY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdoZWlnaHQnKSArICcoaGVpZ2h0KScsXG4gICAgICAgICAgICAnPScsXG4gICAgICAgICAgICB3aWR0aCAvIGhlaWdodFxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICdBc3BlY3QgcmF0aW8gb2Ygc2hvdWxkIGJlJyxcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyQXNwZWN0UmF0aW9cbiAgICAgICAgKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNoYXBlO1xuIiwiLy8gVXRpbGl0eSBmdW5jdGlvbnNcblxudmFyIFBSRUZJWEVTID0gJ1dlYmtpdCBNb3ogTyBtcycuc3BsaXQoJyAnKTtcbnZhciBGTE9BVF9DT01QQVJJU09OX0VQU0lMT04gPSAwLjAwMTtcblxuLy8gQ29weSBhbGwgYXR0cmlidXRlcyBmcm9tIHNvdXJjZSBvYmplY3QgdG8gZGVzdGluYXRpb24gb2JqZWN0LlxuLy8gZGVzdGluYXRpb24gb2JqZWN0IGlzIG11dGF0ZWQuXG5mdW5jdGlvbiBleHRlbmQoZGVzdGluYXRpb24sIHNvdXJjZSwgcmVjdXJzaXZlKSB7XG4gICAgZGVzdGluYXRpb24gPSBkZXN0aW5hdGlvbiB8fCB7fTtcbiAgICBzb3VyY2UgPSBzb3VyY2UgfHwge307XG4gICAgcmVjdXJzaXZlID0gcmVjdXJzaXZlIHx8IGZhbHNlO1xuXG4gICAgZm9yICh2YXIgYXR0ck5hbWUgaW4gc291cmNlKSB7XG4gICAgICAgIGlmIChzb3VyY2UuaGFzT3duUHJvcGVydHkoYXR0ck5hbWUpKSB7XG4gICAgICAgICAgICB2YXIgZGVzdFZhbCA9IGRlc3RpbmF0aW9uW2F0dHJOYW1lXTtcbiAgICAgICAgICAgIHZhciBzb3VyY2VWYWwgPSBzb3VyY2VbYXR0ck5hbWVdO1xuICAgICAgICAgICAgaWYgKHJlY3Vyc2l2ZSAmJiBpc09iamVjdChkZXN0VmFsKSAmJiBpc09iamVjdChzb3VyY2VWYWwpKSB7XG4gICAgICAgICAgICAgICAgZGVzdGluYXRpb25bYXR0ck5hbWVdID0gZXh0ZW5kKGRlc3RWYWwsIHNvdXJjZVZhbCwgcmVjdXJzaXZlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGVzdGluYXRpb25bYXR0ck5hbWVdID0gc291cmNlVmFsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc3RpbmF0aW9uO1xufVxuXG4vLyBSZW5kZXJzIHRlbXBsYXRlcyB3aXRoIGdpdmVuIHZhcmlhYmxlcy4gVmFyaWFibGVzIG11c3QgYmUgc3Vycm91bmRlZCB3aXRoXG4vLyBicmFjZXMgd2l0aG91dCBhbnkgc3BhY2VzLCBlLmcuIHt2YXJpYWJsZX1cbi8vIEFsbCBpbnN0YW5jZXMgb2YgdmFyaWFibGUgcGxhY2Vob2xkZXJzIHdpbGwgYmUgcmVwbGFjZWQgd2l0aCBnaXZlbiBjb250ZW50XG4vLyBFeGFtcGxlOlxuLy8gcmVuZGVyKCdIZWxsbywge21lc3NhZ2V9IScsIHttZXNzYWdlOiAnd29ybGQnfSlcbmZ1bmN0aW9uIHJlbmRlcih0ZW1wbGF0ZSwgdmFycykge1xuICAgIHZhciByZW5kZXJlZCA9IHRlbXBsYXRlO1xuXG4gICAgZm9yICh2YXIga2V5IGluIHZhcnMpIHtcbiAgICAgICAgaWYgKHZhcnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgdmFyIHZhbCA9IHZhcnNba2V5XTtcbiAgICAgICAgICAgIHZhciByZWdFeHBTdHJpbmcgPSAnXFxcXHsnICsga2V5ICsgJ1xcXFx9JztcbiAgICAgICAgICAgIHZhciByZWdFeHAgPSBuZXcgUmVnRXhwKHJlZ0V4cFN0cmluZywgJ2cnKTtcblxuICAgICAgICAgICAgcmVuZGVyZWQgPSByZW5kZXJlZC5yZXBsYWNlKHJlZ0V4cCwgdmFsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZW5kZXJlZDtcbn1cblxuZnVuY3Rpb24gc2V0U3R5bGUoZWxlbWVudCwgc3R5bGUsIHZhbHVlKSB7XG4gICAgdmFyIGVsU3R5bGUgPSBlbGVtZW50LnN0eWxlOyAgLy8gY2FjaGUgZm9yIHBlcmZvcm1hbmNlXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IFBSRUZJWEVTLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBwcmVmaXggPSBQUkVGSVhFU1tpXTtcbiAgICAgICAgZWxTdHlsZVtwcmVmaXggKyBjYXBpdGFsaXplKHN0eWxlKV0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBlbFN0eWxlW3N0eWxlXSA9IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBzZXRTdHlsZXMoZWxlbWVudCwgc3R5bGVzKSB7XG4gICAgZm9yRWFjaE9iamVjdChzdHlsZXMsIGZ1bmN0aW9uKHN0eWxlVmFsdWUsIHN0eWxlTmFtZSkge1xuICAgICAgICAvLyBBbGxvdyBkaXNhYmxpbmcgc29tZSBpbmRpdmlkdWFsIHN0eWxlcyBieSBzZXR0aW5nIHRoZW1cbiAgICAgICAgLy8gdG8gbnVsbCBvciB1bmRlZmluZWRcbiAgICAgICAgaWYgKHN0eWxlVmFsdWUgPT09IG51bGwgfHwgc3R5bGVWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBzdHlsZSdzIHZhbHVlIGlzIHtwcmVmaXg6IHRydWUsIHZhbHVlOiAnNTAlJ30sXG4gICAgICAgIC8vIFNldCBhbHNvIGJyb3dzZXIgcHJlZml4ZWQgc3R5bGVzXG4gICAgICAgIGlmIChpc09iamVjdChzdHlsZVZhbHVlKSAmJiBzdHlsZVZhbHVlLnByZWZpeCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgc2V0U3R5bGUoZWxlbWVudCwgc3R5bGVOYW1lLCBzdHlsZVZhbHVlLnZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGVbc3R5bGVOYW1lXSA9IHN0eWxlVmFsdWU7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gY2FwaXRhbGl6ZSh0ZXh0KSB7XG4gICAgcmV0dXJuIHRleHQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB0ZXh0LnNsaWNlKDEpO1xufVxuXG5mdW5jdGlvbiBpc1N0cmluZyhvYmopIHtcbiAgICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gJ3N0cmluZycgfHwgb2JqIGluc3RhbmNlb2YgU3RyaW5nO1xufVxuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc0FycmF5KG9iaikge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn1cblxuLy8gUmV0dXJucyB0cnVlIGlmIGBvYmpgIGlzIG9iamVjdCBhcyBpbiB7YTogMSwgYjogMn0sIG5vdCBpZiBpdCdzIGZ1bmN0aW9uIG9yXG4vLyBhcnJheVxuZnVuY3Rpb24gaXNPYmplY3Qob2JqKSB7XG4gICAgaWYgKGlzQXJyYXkob2JqKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIHR5cGUgPSB0eXBlb2Ygb2JqO1xuICAgIHJldHVybiB0eXBlID09PSAnb2JqZWN0JyAmJiAhIW9iajtcbn1cblxuZnVuY3Rpb24gZm9yRWFjaE9iamVjdChvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuICAgICAgICBpZiAob2JqZWN0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIHZhciB2YWwgPSBvYmplY3Rba2V5XTtcbiAgICAgICAgICAgIGNhbGxiYWNrKHZhbCwga2V5KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gZmxvYXRFcXVhbHMoYSwgYikge1xuICAgIHJldHVybiBNYXRoLmFicyhhIC0gYikgPCBGTE9BVF9DT01QQVJJU09OX0VQU0lMT047XG59XG5cbi8vIGh0dHBzOi8vY29kZXJ3YWxsLmNvbS9wL255Z2dody9kb24tdC11c2UtaW5uZXJodG1sLXRvLWVtcHR5LWRvbS1lbGVtZW50c1xuZnVuY3Rpb24gcmVtb3ZlQ2hpbGRyZW4oZWwpIHtcbiAgICB3aGlsZSAoZWwuZmlyc3RDaGlsZCkge1xuICAgICAgICBlbC5yZW1vdmVDaGlsZChlbC5maXJzdENoaWxkKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGV4dGVuZDogZXh0ZW5kLFxuICAgIHJlbmRlcjogcmVuZGVyLFxuICAgIHNldFN0eWxlOiBzZXRTdHlsZSxcbiAgICBzZXRTdHlsZXM6IHNldFN0eWxlcyxcbiAgICBjYXBpdGFsaXplOiBjYXBpdGFsaXplLFxuICAgIGlzU3RyaW5nOiBpc1N0cmluZyxcbiAgICBpc0Z1bmN0aW9uOiBpc0Z1bmN0aW9uLFxuICAgIGlzT2JqZWN0OiBpc09iamVjdCxcbiAgICBmb3JFYWNoT2JqZWN0OiBmb3JFYWNoT2JqZWN0LFxuICAgIGZsb2F0RXF1YWxzOiBmbG9hdEVxdWFscyxcbiAgICByZW1vdmVDaGlsZHJlbjogcmVtb3ZlQ2hpbGRyZW5cbn07XG4iLCIvKiBzaGlmdHkgLSB2MS41LjMgLSAyMDE2LTExLTI5IC0gaHR0cDovL2plcmVteWNrYWhuLmdpdGh1Yi5pby9zaGlmdHkgKi9cbjsoZnVuY3Rpb24gKCkge1xuICB2YXIgcm9vdCA9IHRoaXMgfHwgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblxuLyoqXG4gKiBTaGlmdHkgQ29yZVxuICogQnkgSmVyZW15IEthaG4gLSBqZXJlbXlja2FobkBnbWFpbC5jb21cbiAqL1xuXG52YXIgVHdlZW5hYmxlID0gKGZ1bmN0aW9uICgpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gQWxpYXNlcyB0aGF0IGdldCBkZWZpbmVkIGxhdGVyIGluIHRoaXMgZnVuY3Rpb25cbiAgdmFyIGZvcm11bGE7XG5cbiAgLy8gQ09OU1RBTlRTXG4gIHZhciBERUZBVUxUX1NDSEVEVUxFX0ZVTkNUSU9OO1xuICB2YXIgREVGQVVMVF9FQVNJTkcgPSAnbGluZWFyJztcbiAgdmFyIERFRkFVTFRfRFVSQVRJT04gPSA1MDA7XG4gIHZhciBVUERBVEVfVElNRSA9IDEwMDAgLyA2MDtcblxuICB2YXIgX25vdyA9IERhdGUubm93XG4gICAgICAgPyBEYXRlLm5vd1xuICAgICAgIDogZnVuY3Rpb24gKCkge3JldHVybiArbmV3IERhdGUoKTt9O1xuXG4gIHZhciBub3cgPSB0eXBlb2YgU0hJRlRZX0RFQlVHX05PVyAhPT0gJ3VuZGVmaW5lZCcgPyBTSElGVFlfREVCVUdfTk9XIDogX25vdztcblxuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAvLyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKSBzaGltIGJ5IFBhdWwgSXJpc2ggKG1vZGlmaWVkIGZvciBTaGlmdHkpXG4gICAgLy8gaHR0cDovL3BhdWxpcmlzaC5jb20vMjAxMS9yZXF1ZXN0YW5pbWF0aW9uZnJhbWUtZm9yLXNtYXJ0LWFuaW1hdGluZy9cbiAgICBERUZBVUxUX1NDSEVEVUxFX0ZVTkNUSU9OID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgICAgIHx8IHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICAgICB8fCB3aW5kb3cub1JlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgICAgIHx8IHdpbmRvdy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgICAgIHx8ICh3aW5kb3cubW96Q2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgICAgJiYgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSlcbiAgICAgICB8fCBzZXRUaW1lb3V0O1xuICB9IGVsc2Uge1xuICAgIERFRkFVTFRfU0NIRURVTEVfRlVOQ1RJT04gPSBzZXRUaW1lb3V0O1xuICB9XG5cbiAgZnVuY3Rpb24gbm9vcCAoKSB7XG4gICAgLy8gTk9PUCFcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5keSBzaG9ydGN1dCBmb3IgZG9pbmcgYSBmb3ItaW4gbG9vcC4gVGhpcyBpcyBub3QgYSBcIm5vcm1hbFwiIGVhY2hcbiAgICogZnVuY3Rpb24sIGl0IGlzIG9wdGltaXplZCBmb3IgU2hpZnR5LiAgVGhlIGl0ZXJhdG9yIGZ1bmN0aW9uIG9ubHkgcmVjZWl2ZXNcbiAgICogdGhlIHByb3BlcnR5IG5hbWUsIG5vdCB0aGUgdmFsdWUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAgICogQHBhcmFtIHtGdW5jdGlvbihzdHJpbmcpfSBmblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gZWFjaCAob2JqLCBmbikge1xuICAgIHZhciBrZXk7XG4gICAgZm9yIChrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAoT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSB7XG4gICAgICAgIGZuKGtleSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gYSBzaGFsbG93IGNvcHkgb2YgT2JqZWN0IHByb3BlcnRpZXMuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXRPYmplY3QgVGhlIG9iamVjdCB0byBjb3B5IGludG9cbiAgICogQHBhcmFtIHtPYmplY3R9IHNyY09iamVjdCBUaGUgb2JqZWN0IHRvIGNvcHkgZnJvbVxuICAgKiBAcmV0dXJuIHtPYmplY3R9IEEgcmVmZXJlbmNlIHRvIHRoZSBhdWdtZW50ZWQgYHRhcmdldE9iamAgT2JqZWN0XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBzaGFsbG93Q29weSAodGFyZ2V0T2JqLCBzcmNPYmopIHtcbiAgICBlYWNoKHNyY09iaiwgZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgIHRhcmdldE9ialtwcm9wXSA9IHNyY09ialtwcm9wXTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0YXJnZXRPYmo7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIGVhY2ggcHJvcGVydHkgZnJvbSBzcmMgb250byB0YXJnZXQsIGJ1dCBvbmx5IGlmIHRoZSBwcm9wZXJ0eSB0b1xuICAgKiBjb3B5IHRvIHRhcmdldCBpcyB1bmRlZmluZWQuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXQgTWlzc2luZyBwcm9wZXJ0aWVzIGluIHRoaXMgT2JqZWN0IGFyZSBmaWxsZWQgaW5cbiAgICogQHBhcmFtIHtPYmplY3R9IHNyY1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gZGVmYXVsdHMgKHRhcmdldCwgc3JjKSB7XG4gICAgZWFjaChzcmMsIGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgICBpZiAodHlwZW9mIHRhcmdldFtwcm9wXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGFyZ2V0W3Byb3BdID0gc3JjW3Byb3BdO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIGludGVycG9sYXRlZCB0d2VlbiB2YWx1ZXMgb2YgYW4gT2JqZWN0IGZvciBhIGdpdmVuXG4gICAqIHRpbWVzdGFtcC5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGZvclBvc2l0aW9uIFRoZSBwb3NpdGlvbiB0byBjb21wdXRlIHRoZSBzdGF0ZSBmb3IuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjdXJyZW50U3RhdGUgQ3VycmVudCBzdGF0ZSBwcm9wZXJ0aWVzLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3JpZ2luYWxTdGF0ZTogVGhlIG9yaWdpbmFsIHN0YXRlIHByb3BlcnRpZXMgdGhlIE9iamVjdCBpc1xuICAgKiB0d2VlbmluZyBmcm9tLlxuICAgKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0U3RhdGU6IFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBwcm9wZXJ0aWVzIHRoZSBPYmplY3RcbiAgICogaXMgdHdlZW5pbmcgdG8uXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbjogVGhlIGxlbmd0aCBvZiB0aGUgdHdlZW4gaW4gbWlsbGlzZWNvbmRzLlxuICAgKiBAcGFyYW0ge251bWJlcn0gdGltZXN0YW1wOiBUaGUgVU5JWCBlcG9jaCB0aW1lIGF0IHdoaWNoIHRoZSB0d2VlbiBiZWdhbi5cbiAgICogQHBhcmFtIHtPYmplY3R9IGVhc2luZzogVGhpcyBPYmplY3QncyBrZXlzIG11c3QgY29ycmVzcG9uZCB0byB0aGUga2V5cyBpblxuICAgKiB0YXJnZXRTdGF0ZS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIHR3ZWVuUHJvcHMgKGZvclBvc2l0aW9uLCBjdXJyZW50U3RhdGUsIG9yaWdpbmFsU3RhdGUsIHRhcmdldFN0YXRlLFxuICAgIGR1cmF0aW9uLCB0aW1lc3RhbXAsIGVhc2luZykge1xuICAgIHZhciBub3JtYWxpemVkUG9zaXRpb24gPVxuICAgICAgICBmb3JQb3NpdGlvbiA8IHRpbWVzdGFtcCA/IDAgOiAoZm9yUG9zaXRpb24gLSB0aW1lc3RhbXApIC8gZHVyYXRpb247XG5cblxuICAgIHZhciBwcm9wO1xuICAgIHZhciBlYXNpbmdPYmplY3RQcm9wO1xuICAgIHZhciBlYXNpbmdGbjtcbiAgICBmb3IgKHByb3AgaW4gY3VycmVudFN0YXRlKSB7XG4gICAgICBpZiAoY3VycmVudFN0YXRlLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgIGVhc2luZ09iamVjdFByb3AgPSBlYXNpbmdbcHJvcF07XG4gICAgICAgIGVhc2luZ0ZuID0gdHlwZW9mIGVhc2luZ09iamVjdFByb3AgPT09ICdmdW5jdGlvbidcbiAgICAgICAgICA/IGVhc2luZ09iamVjdFByb3BcbiAgICAgICAgICA6IGZvcm11bGFbZWFzaW5nT2JqZWN0UHJvcF07XG5cbiAgICAgICAgY3VycmVudFN0YXRlW3Byb3BdID0gdHdlZW5Qcm9wKFxuICAgICAgICAgIG9yaWdpbmFsU3RhdGVbcHJvcF0sXG4gICAgICAgICAgdGFyZ2V0U3RhdGVbcHJvcF0sXG4gICAgICAgICAgZWFzaW5nRm4sXG4gICAgICAgICAgbm9ybWFsaXplZFBvc2l0aW9uXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGN1cnJlbnRTdGF0ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUd2VlbnMgYSBzaW5nbGUgcHJvcGVydHkuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydCBUaGUgdmFsdWUgdGhhdCB0aGUgdHdlZW4gc3RhcnRlZCBmcm9tLlxuICAgKiBAcGFyYW0ge251bWJlcn0gZW5kIFRoZSB2YWx1ZSB0aGF0IHRoZSB0d2VlbiBzaG91bGQgZW5kIGF0LlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBlYXNpbmdGdW5jIFRoZSBlYXNpbmcgY3VydmUgdG8gYXBwbHkgdG8gdGhlIHR3ZWVuLlxuICAgKiBAcGFyYW0ge251bWJlcn0gcG9zaXRpb24gVGhlIG5vcm1hbGl6ZWQgcG9zaXRpb24gKGJldHdlZW4gMC4wIGFuZCAxLjApIHRvXG4gICAqIGNhbGN1bGF0ZSB0aGUgbWlkcG9pbnQgb2YgJ3N0YXJ0JyBhbmQgJ2VuZCcgYWdhaW5zdC5cbiAgICogQHJldHVybiB7bnVtYmVyfSBUaGUgdHdlZW5lZCB2YWx1ZS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIHR3ZWVuUHJvcCAoc3RhcnQsIGVuZCwgZWFzaW5nRnVuYywgcG9zaXRpb24pIHtcbiAgICByZXR1cm4gc3RhcnQgKyAoZW5kIC0gc3RhcnQpICogZWFzaW5nRnVuYyhwb3NpdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBhIGZpbHRlciB0byBUd2VlbmFibGUgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7VHdlZW5hYmxlfSB0d2VlbmFibGUgVGhlIGBUd2VlbmFibGVgIGluc3RhbmNlIHRvIGNhbGwgdGhlIGZpbHRlclxuICAgKiB1cG9uLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gZmlsdGVyTmFtZSBUaGUgbmFtZSBvZiB0aGUgZmlsdGVyIHRvIGFwcGx5LlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gYXBwbHlGaWx0ZXIgKHR3ZWVuYWJsZSwgZmlsdGVyTmFtZSkge1xuICAgIHZhciBmaWx0ZXJzID0gVHdlZW5hYmxlLnByb3RvdHlwZS5maWx0ZXI7XG4gICAgdmFyIGFyZ3MgPSB0d2VlbmFibGUuX2ZpbHRlckFyZ3M7XG5cbiAgICBlYWNoKGZpbHRlcnMsIGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICBpZiAodHlwZW9mIGZpbHRlcnNbbmFtZV1bZmlsdGVyTmFtZV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGZpbHRlcnNbbmFtZV1bZmlsdGVyTmFtZV0uYXBwbHkodHdlZW5hYmxlLCBhcmdzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHZhciB0aW1lb3V0SGFuZGxlcl9lbmRUaW1lO1xuICB2YXIgdGltZW91dEhhbmRsZXJfY3VycmVudFRpbWU7XG4gIHZhciB0aW1lb3V0SGFuZGxlcl9pc0VuZGVkO1xuICB2YXIgdGltZW91dEhhbmRsZXJfb2Zmc2V0O1xuICAvKipcbiAgICogSGFuZGxlcyB0aGUgdXBkYXRlIGxvZ2ljIGZvciBvbmUgc3RlcCBvZiBhIHR3ZWVuLlxuICAgKiBAcGFyYW0ge1R3ZWVuYWJsZX0gdHdlZW5hYmxlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lc3RhbXBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGRlbGF5XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gY3VycmVudFN0YXRlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcmlnaW5hbFN0YXRlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXRTdGF0ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gZWFzaW5nXG4gICAqIEBwYXJhbSB7RnVuY3Rpb24oT2JqZWN0LCAqLCBudW1iZXIpfSBzdGVwXG4gICAqIEBwYXJhbSB7RnVuY3Rpb24oRnVuY3Rpb24sbnVtYmVyKX19IHNjaGVkdWxlXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gb3B0X2N1cnJlbnRUaW1lT3ZlcnJpZGUgTmVlZGVkIGZvciBhY2N1cmF0ZSB0aW1lc3RhbXAgaW5cbiAgICogVHdlZW5hYmxlI3NlZWsuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiB0aW1lb3V0SGFuZGxlciAodHdlZW5hYmxlLCB0aW1lc3RhbXAsIGRlbGF5LCBkdXJhdGlvbiwgY3VycmVudFN0YXRlLFxuICAgIG9yaWdpbmFsU3RhdGUsIHRhcmdldFN0YXRlLCBlYXNpbmcsIHN0ZXAsIHNjaGVkdWxlLFxuICAgIG9wdF9jdXJyZW50VGltZU92ZXJyaWRlKSB7XG5cbiAgICB0aW1lb3V0SGFuZGxlcl9lbmRUaW1lID0gdGltZXN0YW1wICsgZGVsYXkgKyBkdXJhdGlvbjtcblxuICAgIHRpbWVvdXRIYW5kbGVyX2N1cnJlbnRUaW1lID1cbiAgICBNYXRoLm1pbihvcHRfY3VycmVudFRpbWVPdmVycmlkZSB8fCBub3coKSwgdGltZW91dEhhbmRsZXJfZW5kVGltZSk7XG5cbiAgICB0aW1lb3V0SGFuZGxlcl9pc0VuZGVkID1cbiAgICAgIHRpbWVvdXRIYW5kbGVyX2N1cnJlbnRUaW1lID49IHRpbWVvdXRIYW5kbGVyX2VuZFRpbWU7XG5cbiAgICB0aW1lb3V0SGFuZGxlcl9vZmZzZXQgPSBkdXJhdGlvbiAtIChcbiAgICAgIHRpbWVvdXRIYW5kbGVyX2VuZFRpbWUgLSB0aW1lb3V0SGFuZGxlcl9jdXJyZW50VGltZSk7XG5cbiAgICBpZiAodHdlZW5hYmxlLmlzUGxheWluZygpKSB7XG4gICAgICBpZiAodGltZW91dEhhbmRsZXJfaXNFbmRlZCkge1xuICAgICAgICBzdGVwKHRhcmdldFN0YXRlLCB0d2VlbmFibGUuX2F0dGFjaG1lbnQsIHRpbWVvdXRIYW5kbGVyX29mZnNldCk7XG4gICAgICAgIHR3ZWVuYWJsZS5zdG9wKHRydWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHdlZW5hYmxlLl9zY2hlZHVsZUlkID1cbiAgICAgICAgICBzY2hlZHVsZSh0d2VlbmFibGUuX3RpbWVvdXRIYW5kbGVyLCBVUERBVEVfVElNRSk7XG5cbiAgICAgICAgYXBwbHlGaWx0ZXIodHdlZW5hYmxlLCAnYmVmb3JlVHdlZW4nKTtcblxuICAgICAgICAvLyBJZiB0aGUgYW5pbWF0aW9uIGhhcyBub3QgeWV0IHJlYWNoZWQgdGhlIHN0YXJ0IHBvaW50IChlLmcuLCB0aGVyZSB3YXNcbiAgICAgICAgLy8gZGVsYXkgdGhhdCBoYXMgbm90IHlldCBjb21wbGV0ZWQpLCBqdXN0IGludGVycG9sYXRlIHRoZSBzdGFydGluZ1xuICAgICAgICAvLyBwb3NpdGlvbiBvZiB0aGUgdHdlZW4uXG4gICAgICAgIGlmICh0aW1lb3V0SGFuZGxlcl9jdXJyZW50VGltZSA8ICh0aW1lc3RhbXAgKyBkZWxheSkpIHtcbiAgICAgICAgICB0d2VlblByb3BzKDEsIGN1cnJlbnRTdGF0ZSwgb3JpZ2luYWxTdGF0ZSwgdGFyZ2V0U3RhdGUsIDEsIDEsIGVhc2luZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHdlZW5Qcm9wcyh0aW1lb3V0SGFuZGxlcl9jdXJyZW50VGltZSwgY3VycmVudFN0YXRlLCBvcmlnaW5hbFN0YXRlLFxuICAgICAgICAgICAgdGFyZ2V0U3RhdGUsIGR1cmF0aW9uLCB0aW1lc3RhbXAgKyBkZWxheSwgZWFzaW5nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFwcGx5RmlsdGVyKHR3ZWVuYWJsZSwgJ2FmdGVyVHdlZW4nKTtcblxuICAgICAgICBzdGVwKGN1cnJlbnRTdGF0ZSwgdHdlZW5hYmxlLl9hdHRhY2htZW50LCB0aW1lb3V0SGFuZGxlcl9vZmZzZXQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB1c2FibGUgZWFzaW5nIE9iamVjdCBmcm9tIGEgc3RyaW5nLCBhIGZ1bmN0aW9uIG9yIGFub3RoZXIgZWFzaW5nXG4gICAqIE9iamVjdC4gIElmIGBlYXNpbmdgIGlzIGFuIE9iamVjdCwgdGhlbiB0aGlzIGZ1bmN0aW9uIGNsb25lcyBpdCBhbmQgZmlsbHNcbiAgICogaW4gdGhlIG1pc3NpbmcgcHJvcGVydGllcyB3aXRoIGBcImxpbmVhclwiYC5cbiAgICogQHBhcmFtIHtPYmplY3QuPHN0cmluZ3xGdW5jdGlvbj59IGZyb21Ud2VlblBhcmFtc1xuICAgKiBAcGFyYW0ge09iamVjdHxzdHJpbmd8RnVuY3Rpb259IGVhc2luZ1xuICAgKiBAcmV0dXJuIHtPYmplY3QuPHN0cmluZ3xGdW5jdGlvbj59XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBjb21wb3NlRWFzaW5nT2JqZWN0IChmcm9tVHdlZW5QYXJhbXMsIGVhc2luZykge1xuICAgIHZhciBjb21wb3NlZEVhc2luZyA9IHt9O1xuICAgIHZhciB0eXBlb2ZFYXNpbmcgPSB0eXBlb2YgZWFzaW5nO1xuXG4gICAgaWYgKHR5cGVvZkVhc2luZyA9PT0gJ3N0cmluZycgfHwgdHlwZW9mRWFzaW5nID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBlYWNoKGZyb21Ud2VlblBhcmFtcywgZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgICAgY29tcG9zZWRFYXNpbmdbcHJvcF0gPSBlYXNpbmc7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZWFjaChmcm9tVHdlZW5QYXJhbXMsIGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgICAgIGlmICghY29tcG9zZWRFYXNpbmdbcHJvcF0pIHtcbiAgICAgICAgICBjb21wb3NlZEVhc2luZ1twcm9wXSA9IGVhc2luZ1twcm9wXSB8fCBERUZBVUxUX0VBU0lORztcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbXBvc2VkRWFzaW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIFR3ZWVuYWJsZSBjb25zdHJ1Y3Rvci5cbiAgICogQGNsYXNzIFR3ZWVuYWJsZVxuICAgKiBAcGFyYW0ge09iamVjdD19IG9wdF9pbml0aWFsU3RhdGUgVGhlIHZhbHVlcyB0aGF0IHRoZSBpbml0aWFsIHR3ZWVuIHNob3VsZFxuICAgKiBzdGFydCBhdCBpZiBhIGBmcm9tYCBvYmplY3QgaXMgbm90IHByb3ZpZGVkIHRvIGB7eyNjcm9zc0xpbmtcbiAgICogXCJUd2VlbmFibGUvdHdlZW46bWV0aG9kXCJ9fXt7L2Nyb3NzTGlua319YCBvciBge3sjY3Jvc3NMaW5rXG4gICAqIFwiVHdlZW5hYmxlL3NldENvbmZpZzptZXRob2RcIn19e3svY3Jvc3NMaW5rfX1gLlxuICAgKiBAcGFyYW0ge09iamVjdD19IG9wdF9jb25maWcgQ29uZmlndXJhdGlvbiBvYmplY3QgdG8gYmUgcGFzc2VkIHRvXG4gICAqIGB7eyNjcm9zc0xpbmsgXCJUd2VlbmFibGUvc2V0Q29uZmlnOm1ldGhvZFwifX17ey9jcm9zc0xpbmt9fWAuXG4gICAqIEBtb2R1bGUgVHdlZW5hYmxlXG4gICAqIEBjb25zdHJ1Y3RvclxuICAgKi9cbiAgZnVuY3Rpb24gVHdlZW5hYmxlIChvcHRfaW5pdGlhbFN0YXRlLCBvcHRfY29uZmlnKSB7XG4gICAgdGhpcy5fY3VycmVudFN0YXRlID0gb3B0X2luaXRpYWxTdGF0ZSB8fCB7fTtcbiAgICB0aGlzLl9jb25maWd1cmVkID0gZmFsc2U7XG4gICAgdGhpcy5fc2NoZWR1bGVGdW5jdGlvbiA9IERFRkFVTFRfU0NIRURVTEVfRlVOQ1RJT047XG5cbiAgICAvLyBUbyBwcmV2ZW50IHVubmVjZXNzYXJ5IGNhbGxzIHRvIHNldENvbmZpZyBkbyBub3Qgc2V0IGRlZmF1bHRcbiAgICAvLyBjb25maWd1cmF0aW9uIGhlcmUuICBPbmx5IHNldCBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gaW1tZWRpYXRlbHkgYmVmb3JlXG4gICAgLy8gdHdlZW5pbmcgaWYgbm9uZSBoYXMgYmVlbiBzZXQuXG4gICAgaWYgKHR5cGVvZiBvcHRfY29uZmlnICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdGhpcy5zZXRDb25maWcob3B0X2NvbmZpZyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZSBhbmQgc3RhcnQgYSB0d2Vlbi5cbiAgICogQG1ldGhvZCB0d2VlblxuICAgKiBAcGFyYW0ge09iamVjdD19IG9wdF9jb25maWcgQ29uZmlndXJhdGlvbiBvYmplY3QgdG8gYmUgcGFzc2VkIHRvXG4gICAqIGB7eyNjcm9zc0xpbmsgXCJUd2VlbmFibGUvc2V0Q29uZmlnOm1ldGhvZFwifX17ey9jcm9zc0xpbmt9fWAuXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIFR3ZWVuYWJsZS5wcm90b3R5cGUudHdlZW4gPSBmdW5jdGlvbiAob3B0X2NvbmZpZykge1xuICAgIGlmICh0aGlzLl9pc1R3ZWVuaW5nKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvLyBPbmx5IHNldCBkZWZhdWx0IGNvbmZpZyBpZiBubyBjb25maWd1cmF0aW9uIGhhcyBiZWVuIHNldCBwcmV2aW91c2x5IGFuZFxuICAgIC8vIG5vbmUgaXMgcHJvdmlkZWQgbm93LlxuICAgIGlmIChvcHRfY29uZmlnICE9PSB1bmRlZmluZWQgfHwgIXRoaXMuX2NvbmZpZ3VyZWQpIHtcbiAgICAgIHRoaXMuc2V0Q29uZmlnKG9wdF9jb25maWcpO1xuICAgIH1cblxuICAgIHRoaXMuX3RpbWVzdGFtcCA9IG5vdygpO1xuICAgIHRoaXMuX3N0YXJ0KHRoaXMuZ2V0KCksIHRoaXMuX2F0dGFjaG1lbnQpO1xuICAgIHJldHVybiB0aGlzLnJlc3VtZSgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDb25maWd1cmUgYSB0d2VlbiB0aGF0IHdpbGwgc3RhcnQgYXQgc29tZSBwb2ludCBpbiB0aGUgZnV0dXJlLlxuICAgKlxuICAgKiBAbWV0aG9kIHNldENvbmZpZ1xuICAgKiBAcGFyYW0ge09iamVjdH0gY29uZmlnIFRoZSBmb2xsb3dpbmcgdmFsdWVzIGFyZSB2YWxpZDpcbiAgICogLSBfX2Zyb21fXyAoX09iamVjdD1fKTogU3RhcnRpbmcgcG9zaXRpb24uICBJZiBvbWl0dGVkLCBge3sjY3Jvc3NMaW5rXG4gICAqICAgXCJUd2VlbmFibGUvZ2V0Om1ldGhvZFwifX1nZXQoKXt7L2Nyb3NzTGlua319YCBpcyB1c2VkLlxuICAgKiAtIF9fdG9fXyAoX09iamVjdD1fKTogRW5kaW5nIHBvc2l0aW9uLlxuICAgKiAtIF9fZHVyYXRpb25fXyAoX251bWJlcj1fKTogSG93IG1hbnkgbWlsbGlzZWNvbmRzIHRvIGFuaW1hdGUgZm9yLlxuICAgKiAtIF9fZGVsYXlfXyAoX2RlbGF5PV8pOiBIb3cgbWFueSBtaWxsaXNlY29uZHMgdG8gd2FpdCBiZWZvcmUgc3RhcnRpbmcgdGhlXG4gICAqICAgdHdlZW4uXG4gICAqIC0gX19zdGFydF9fIChfRnVuY3Rpb24oT2JqZWN0LCAqKV8pOiBGdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gdGhlIHR3ZWVuXG4gICAqICAgYmVnaW5zLiAgUmVjZWl2ZXMgdGhlIHN0YXRlIG9mIHRoZSB0d2VlbiBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyIGFuZFxuICAgKiAgIGBhdHRhY2htZW50YCBhcyB0aGUgc2Vjb25kIHBhcmFtZXRlci5cbiAgICogLSBfX3N0ZXBfXyAoX0Z1bmN0aW9uKE9iamVjdCwgKiwgbnVtYmVyKV8pOiBGdW5jdGlvbiB0byBleGVjdXRlIG9uIGV2ZXJ5XG4gICAqICAgdGljay4gIFJlY2VpdmVzIGB7eyNjcm9zc0xpbmtcbiAgICogICBcIlR3ZWVuYWJsZS9nZXQ6bWV0aG9kXCJ9fWdldCgpe3svY3Jvc3NMaW5rfX1gIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXIsXG4gICAqICAgYGF0dGFjaG1lbnRgIGFzIHRoZSBzZWNvbmQgcGFyYW1ldGVyLCBhbmQgdGhlIHRpbWUgZWxhcHNlZCBzaW5jZSB0aGVcbiAgICogICBzdGFydCBvZiB0aGUgdHdlZW4gYXMgdGhlIHRoaXJkLiBUaGlzIGZ1bmN0aW9uIGlzIG5vdCBjYWxsZWQgb24gdGhlXG4gICAqICAgZmluYWwgc3RlcCBvZiB0aGUgYW5pbWF0aW9uLCBidXQgYGZpbmlzaGAgaXMuXG4gICAqIC0gX19maW5pc2hfXyAoX0Z1bmN0aW9uKE9iamVjdCwgKilfKTogRnVuY3Rpb24gdG8gZXhlY3V0ZSB1cG9uIHR3ZWVuXG4gICAqICAgY29tcGxldGlvbi4gIFJlY2VpdmVzIHRoZSBzdGF0ZSBvZiB0aGUgdHdlZW4gYXMgdGhlIGZpcnN0IHBhcmFtZXRlciBhbmRcbiAgICogICBgYXR0YWNobWVudGAgYXMgdGhlIHNlY29uZCBwYXJhbWV0ZXIuXG4gICAqIC0gX19lYXNpbmdfXyAoX09iamVjdC48c3RyaW5nfEZ1bmN0aW9uPnxzdHJpbmd8RnVuY3Rpb249Xyk6IEVhc2luZyBjdXJ2ZVxuICAgKiAgIG5hbWUocykgb3IgZnVuY3Rpb24ocykgdG8gdXNlIGZvciB0aGUgdHdlZW4uXG4gICAqIC0gX19hdHRhY2htZW50X18gKF8qXyk6IENhY2hlZCB2YWx1ZSB0aGF0IGlzIHBhc3NlZCB0byB0aGVcbiAgICogICBgc3RlcGAvYHN0YXJ0YC9gZmluaXNoYCBtZXRob2RzLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBUd2VlbmFibGUucHJvdG90eXBlLnNldENvbmZpZyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICBjb25maWcgPSBjb25maWcgfHwge307XG4gICAgdGhpcy5fY29uZmlndXJlZCA9IHRydWU7XG5cbiAgICAvLyBBdHRhY2ggc29tZXRoaW5nIHRvIHRoaXMgVHdlZW5hYmxlIGluc3RhbmNlIChlLmcuOiBhIERPTSBlbGVtZW50LCBhblxuICAgIC8vIG9iamVjdCwgYSBzdHJpbmcsIGV0Yy4pO1xuICAgIHRoaXMuX2F0dGFjaG1lbnQgPSBjb25maWcuYXR0YWNobWVudDtcblxuICAgIC8vIEluaXQgdGhlIGludGVybmFsIHN0YXRlXG4gICAgdGhpcy5fcGF1c2VkQXRUaW1lID0gbnVsbDtcbiAgICB0aGlzLl9zY2hlZHVsZUlkID0gbnVsbDtcbiAgICB0aGlzLl9kZWxheSA9IGNvbmZpZy5kZWxheSB8fCAwO1xuICAgIHRoaXMuX3N0YXJ0ID0gY29uZmlnLnN0YXJ0IHx8IG5vb3A7XG4gICAgdGhpcy5fc3RlcCA9IGNvbmZpZy5zdGVwIHx8IG5vb3A7XG4gICAgdGhpcy5fZmluaXNoID0gY29uZmlnLmZpbmlzaCB8fCBub29wO1xuICAgIHRoaXMuX2R1cmF0aW9uID0gY29uZmlnLmR1cmF0aW9uIHx8IERFRkFVTFRfRFVSQVRJT047XG4gICAgdGhpcy5fY3VycmVudFN0YXRlID0gc2hhbGxvd0NvcHkoe30sIGNvbmZpZy5mcm9tIHx8IHRoaXMuZ2V0KCkpO1xuICAgIHRoaXMuX29yaWdpbmFsU3RhdGUgPSB0aGlzLmdldCgpO1xuICAgIHRoaXMuX3RhcmdldFN0YXRlID0gc2hhbGxvd0NvcHkoe30sIGNvbmZpZy50byB8fCB0aGlzLmdldCgpKTtcblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLl90aW1lb3V0SGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRpbWVvdXRIYW5kbGVyKHNlbGYsXG4gICAgICAgIHNlbGYuX3RpbWVzdGFtcCxcbiAgICAgICAgc2VsZi5fZGVsYXksXG4gICAgICAgIHNlbGYuX2R1cmF0aW9uLFxuICAgICAgICBzZWxmLl9jdXJyZW50U3RhdGUsXG4gICAgICAgIHNlbGYuX29yaWdpbmFsU3RhdGUsXG4gICAgICAgIHNlbGYuX3RhcmdldFN0YXRlLFxuICAgICAgICBzZWxmLl9lYXNpbmcsXG4gICAgICAgIHNlbGYuX3N0ZXAsXG4gICAgICAgIHNlbGYuX3NjaGVkdWxlRnVuY3Rpb25cbiAgICAgICk7XG4gICAgfTtcblxuICAgIC8vIEFsaWFzZXMgdXNlZCBiZWxvd1xuICAgIHZhciBjdXJyZW50U3RhdGUgPSB0aGlzLl9jdXJyZW50U3RhdGU7XG4gICAgdmFyIHRhcmdldFN0YXRlID0gdGhpcy5fdGFyZ2V0U3RhdGU7XG5cbiAgICAvLyBFbnN1cmUgdGhhdCB0aGVyZSBpcyBhbHdheXMgc29tZXRoaW5nIHRvIHR3ZWVuIHRvLlxuICAgIGRlZmF1bHRzKHRhcmdldFN0YXRlLCBjdXJyZW50U3RhdGUpO1xuXG4gICAgdGhpcy5fZWFzaW5nID0gY29tcG9zZUVhc2luZ09iamVjdChcbiAgICAgIGN1cnJlbnRTdGF0ZSwgY29uZmlnLmVhc2luZyB8fCBERUZBVUxUX0VBU0lORyk7XG5cbiAgICB0aGlzLl9maWx0ZXJBcmdzID1cbiAgICAgIFtjdXJyZW50U3RhdGUsIHRoaXMuX29yaWdpbmFsU3RhdGUsIHRhcmdldFN0YXRlLCB0aGlzLl9lYXNpbmddO1xuXG4gICAgYXBwbHlGaWx0ZXIodGhpcywgJ3R3ZWVuQ3JlYXRlZCcpO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBAbWV0aG9kIGdldFxuICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBjdXJyZW50IHN0YXRlLlxuICAgKi9cbiAgVHdlZW5hYmxlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHNoYWxsb3dDb3B5KHt9LCB0aGlzLl9jdXJyZW50U3RhdGUpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBAbWV0aG9kIHNldFxuICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGUgVGhlIGN1cnJlbnQgc3RhdGUuXG4gICAqL1xuICBUd2VlbmFibGUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgIHRoaXMuX2N1cnJlbnRTdGF0ZSA9IHN0YXRlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBQYXVzZSBhIHR3ZWVuLiAgUGF1c2VkIHR3ZWVucyBjYW4gYmUgcmVzdW1lZCBmcm9tIHRoZSBwb2ludCBhdCB3aGljaCB0aGV5XG4gICAqIHdlcmUgcGF1c2VkLiAgVGhpcyBpcyBkaWZmZXJlbnQgZnJvbSBge3sjY3Jvc3NMaW5rXG4gICAqIFwiVHdlZW5hYmxlL3N0b3A6bWV0aG9kXCJ9fXt7L2Nyb3NzTGlua319YCwgYXMgdGhhdCBtZXRob2RcbiAgICogY2F1c2VzIGEgdHdlZW4gdG8gc3RhcnQgb3ZlciB3aGVuIGl0IGlzIHJlc3VtZWQuXG4gICAqIEBtZXRob2QgcGF1c2VcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgVHdlZW5hYmxlLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9wYXVzZWRBdFRpbWUgPSBub3coKTtcbiAgICB0aGlzLl9pc1BhdXNlZCA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlc3VtZSBhIHBhdXNlZCB0d2Vlbi5cbiAgICogQG1ldGhvZCByZXN1bWVcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgVHdlZW5hYmxlLnByb3RvdHlwZS5yZXN1bWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX2lzUGF1c2VkKSB7XG4gICAgICB0aGlzLl90aW1lc3RhbXAgKz0gbm93KCkgLSB0aGlzLl9wYXVzZWRBdFRpbWU7XG4gICAgfVxuXG4gICAgdGhpcy5faXNQYXVzZWQgPSBmYWxzZTtcbiAgICB0aGlzLl9pc1R3ZWVuaW5nID0gdHJ1ZTtcblxuICAgIHRoaXMuX3RpbWVvdXRIYW5kbGVyKCk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogTW92ZSB0aGUgc3RhdGUgb2YgdGhlIGFuaW1hdGlvbiB0byBhIHNwZWNpZmljIHBvaW50IGluIHRoZSB0d2VlbidzXG4gICAqIHRpbWVsaW5lLiAgSWYgdGhlIGFuaW1hdGlvbiBpcyBub3QgcnVubmluZywgdGhpcyB3aWxsIGNhdXNlIHRoZSBgc3RlcGBcbiAgICogaGFuZGxlcnMgdG8gYmUgY2FsbGVkLlxuICAgKiBAbWV0aG9kIHNlZWtcbiAgICogQHBhcmFtIHttaWxsaXNlY29uZH0gbWlsbGlzZWNvbmQgVGhlIG1pbGxpc2Vjb25kIG9mIHRoZSBhbmltYXRpb24gdG8gc2Vla1xuICAgKiB0by4gIFRoaXMgbXVzdCBub3QgYmUgbGVzcyB0aGFuIGAwYC5cbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgVHdlZW5hYmxlLnByb3RvdHlwZS5zZWVrID0gZnVuY3Rpb24gKG1pbGxpc2Vjb25kKSB7XG4gICAgbWlsbGlzZWNvbmQgPSBNYXRoLm1heChtaWxsaXNlY29uZCwgMCk7XG4gICAgdmFyIGN1cnJlbnRUaW1lID0gbm93KCk7XG5cbiAgICBpZiAoKHRoaXMuX3RpbWVzdGFtcCArIG1pbGxpc2Vjb25kKSA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdGhpcy5fdGltZXN0YW1wID0gY3VycmVudFRpbWUgLSBtaWxsaXNlY29uZDtcblxuICAgIGlmICghdGhpcy5pc1BsYXlpbmcoKSkge1xuICAgICAgdGhpcy5faXNUd2VlbmluZyA9IHRydWU7XG4gICAgICB0aGlzLl9pc1BhdXNlZCA9IGZhbHNlO1xuXG4gICAgICAvLyBJZiB0aGUgYW5pbWF0aW9uIGlzIG5vdCBydW5uaW5nLCBjYWxsIHRpbWVvdXRIYW5kbGVyIHRvIG1ha2Ugc3VyZSB0aGF0XG4gICAgICAvLyBhbnkgc3RlcCBoYW5kbGVycyBhcmUgcnVuLlxuICAgICAgdGltZW91dEhhbmRsZXIodGhpcyxcbiAgICAgICAgdGhpcy5fdGltZXN0YW1wLFxuICAgICAgICB0aGlzLl9kZWxheSxcbiAgICAgICAgdGhpcy5fZHVyYXRpb24sXG4gICAgICAgIHRoaXMuX2N1cnJlbnRTdGF0ZSxcbiAgICAgICAgdGhpcy5fb3JpZ2luYWxTdGF0ZSxcbiAgICAgICAgdGhpcy5fdGFyZ2V0U3RhdGUsXG4gICAgICAgIHRoaXMuX2Vhc2luZyxcbiAgICAgICAgdGhpcy5fc3RlcCxcbiAgICAgICAgdGhpcy5fc2NoZWR1bGVGdW5jdGlvbixcbiAgICAgICAgY3VycmVudFRpbWVcbiAgICAgICk7XG5cbiAgICAgIHRoaXMucGF1c2UoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogU3RvcHMgYW5kIGNhbmNlbHMgYSB0d2Vlbi5cbiAgICogQHBhcmFtIHtib29sZWFuPX0gZ290b0VuZCBJZiBgZmFsc2VgIG9yIG9taXR0ZWQsIHRoZSB0d2VlbiBqdXN0IHN0b3BzIGF0XG4gICAqIGl0cyBjdXJyZW50IHN0YXRlLCBhbmQgdGhlIGBmaW5pc2hgIGhhbmRsZXIgaXMgbm90IGludm9rZWQuICBJZiBgdHJ1ZWAsXG4gICAqIHRoZSB0d2VlbmVkIG9iamVjdCdzIHZhbHVlcyBhcmUgaW5zdGFudGx5IHNldCB0byB0aGUgdGFyZ2V0IHZhbHVlcywgYW5kXG4gICAqIGBmaW5pc2hgIGlzIGludm9rZWQuXG4gICAqIEBtZXRob2Qgc3RvcFxuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBUd2VlbmFibGUucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiAoZ290b0VuZCkge1xuICAgIHRoaXMuX2lzVHdlZW5pbmcgPSBmYWxzZTtcbiAgICB0aGlzLl9pc1BhdXNlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3RpbWVvdXRIYW5kbGVyID0gbm9vcDtcblxuICAgIChyb290LmNhbmNlbEFuaW1hdGlvbkZyYW1lICAgICAgICAgICAgfHxcbiAgICByb290LndlYmtpdENhbmNlbEFuaW1hdGlvbkZyYW1lICAgICB8fFxuICAgIHJvb3Qub0NhbmNlbEFuaW1hdGlvbkZyYW1lICAgICAgICAgIHx8XG4gICAgcm9vdC5tc0NhbmNlbEFuaW1hdGlvbkZyYW1lICAgICAgICAgfHxcbiAgICByb290Lm1vekNhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgIHJvb3QuY2xlYXJUaW1lb3V0KSh0aGlzLl9zY2hlZHVsZUlkKTtcblxuICAgIGlmIChnb3RvRW5kKSB7XG4gICAgICBhcHBseUZpbHRlcih0aGlzLCAnYmVmb3JlVHdlZW4nKTtcbiAgICAgIHR3ZWVuUHJvcHMoXG4gICAgICAgIDEsXG4gICAgICAgIHRoaXMuX2N1cnJlbnRTdGF0ZSxcbiAgICAgICAgdGhpcy5fb3JpZ2luYWxTdGF0ZSxcbiAgICAgICAgdGhpcy5fdGFyZ2V0U3RhdGUsXG4gICAgICAgIDEsXG4gICAgICAgIDAsXG4gICAgICAgIHRoaXMuX2Vhc2luZ1xuICAgICAgKTtcbiAgICAgIGFwcGx5RmlsdGVyKHRoaXMsICdhZnRlclR3ZWVuJyk7XG4gICAgICBhcHBseUZpbHRlcih0aGlzLCAnYWZ0ZXJUd2VlbkVuZCcpO1xuICAgICAgdGhpcy5fZmluaXNoLmNhbGwodGhpcywgdGhpcy5fY3VycmVudFN0YXRlLCB0aGlzLl9hdHRhY2htZW50KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogQG1ldGhvZCBpc1BsYXlpbmdcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciBvciBub3QgYSB0d2VlbiBpcyBydW5uaW5nLlxuICAgKi9cbiAgVHdlZW5hYmxlLnByb3RvdHlwZS5pc1BsYXlpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lzVHdlZW5pbmcgJiYgIXRoaXMuX2lzUGF1c2VkO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZXQgYSBjdXN0b20gc2NoZWR1bGUgZnVuY3Rpb24uXG4gICAqXG4gICAqIElmIGEgY3VzdG9tIGZ1bmN0aW9uIGlzIG5vdCBzZXQsXG4gICAqIFtgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL3dpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpXG4gICAqIGlzIHVzZWQgaWYgYXZhaWxhYmxlLCBvdGhlcndpc2VcbiAgICogW2BzZXRUaW1lb3V0YF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dpbmRvdy5zZXRUaW1lb3V0KVxuICAgKiBpcyB1c2VkLlxuICAgKiBAbWV0aG9kIHNldFNjaGVkdWxlRnVuY3Rpb25cbiAgICogQHBhcmFtIHtGdW5jdGlvbihGdW5jdGlvbixudW1iZXIpfSBzY2hlZHVsZUZ1bmN0aW9uIFRoZSBmdW5jdGlvbiB0byBiZVxuICAgKiB1c2VkIHRvIHNjaGVkdWxlIHRoZSBuZXh0IGZyYW1lIHRvIGJlIHJlbmRlcmVkLlxuICAgKi9cbiAgVHdlZW5hYmxlLnByb3RvdHlwZS5zZXRTY2hlZHVsZUZ1bmN0aW9uID0gZnVuY3Rpb24gKHNjaGVkdWxlRnVuY3Rpb24pIHtcbiAgICB0aGlzLl9zY2hlZHVsZUZ1bmN0aW9uID0gc2NoZWR1bGVGdW5jdGlvbjtcbiAgfTtcblxuICAvKipcbiAgICogYGRlbGV0ZWAgYWxsIFwib3duXCIgcHJvcGVydGllcy4gIENhbGwgdGhpcyB3aGVuIHRoZSBgVHdlZW5hYmxlYCBpbnN0YW5jZVxuICAgKiBpcyBubyBsb25nZXIgbmVlZGVkIHRvIGZyZWUgbWVtb3J5LlxuICAgKiBAbWV0aG9kIGRpc3Bvc2VcbiAgICovXG4gIFR3ZWVuYWJsZS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcHJvcDtcbiAgICBmb3IgKHByb3AgaW4gdGhpcykge1xuICAgICAgaWYgKHRoaXMuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgZGVsZXRlIHRoaXNbcHJvcF07XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBGaWx0ZXJzIGFyZSB1c2VkIGZvciB0cmFuc2Zvcm1pbmcgdGhlIHByb3BlcnRpZXMgb2YgYSB0d2VlbiBhdCB2YXJpb3VzXG4gICAqIHBvaW50cyBpbiBhIFR3ZWVuYWJsZSdzIGxpZmUgY3ljbGUuICBTZWUgdGhlIFJFQURNRSBmb3IgbW9yZSBpbmZvIG9uIHRoaXMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBUd2VlbmFibGUucHJvdG90eXBlLmZpbHRlciA9IHt9O1xuXG4gIC8qKlxuICAgKiBUaGlzIG9iamVjdCBjb250YWlucyBhbGwgb2YgdGhlIHR3ZWVucyBhdmFpbGFibGUgdG8gU2hpZnR5LiAgSXQgaXNcbiAgICogZXh0ZW5zaWJsZSAtIHNpbXBseSBhdHRhY2ggcHJvcGVydGllcyB0byB0aGUgYFR3ZWVuYWJsZS5wcm90b3R5cGUuZm9ybXVsYWBcbiAgICogT2JqZWN0IGZvbGxvd2luZyB0aGUgc2FtZSBmb3JtYXQgYXMgYGxpbmVhcmAuXG4gICAqXG4gICAqIGBwb3NgIHNob3VsZCBiZSBhIG5vcm1hbGl6ZWQgYG51bWJlcmAgKGJldHdlZW4gMCBhbmQgMSkuXG4gICAqIEBwcm9wZXJ0eSBmb3JtdWxhXG4gICAqIEB0eXBlIHtPYmplY3QoZnVuY3Rpb24pfVxuICAgKi9cbiAgVHdlZW5hYmxlLnByb3RvdHlwZS5mb3JtdWxhID0ge1xuICAgIGxpbmVhcjogZnVuY3Rpb24gKHBvcykge1xuICAgICAgcmV0dXJuIHBvcztcbiAgICB9XG4gIH07XG5cbiAgZm9ybXVsYSA9IFR3ZWVuYWJsZS5wcm90b3R5cGUuZm9ybXVsYTtcblxuICBzaGFsbG93Q29weShUd2VlbmFibGUsIHtcbiAgICAnbm93Jzogbm93XG4gICAgLCdlYWNoJzogZWFjaFxuICAgICwndHdlZW5Qcm9wcyc6IHR3ZWVuUHJvcHNcbiAgICAsJ3R3ZWVuUHJvcCc6IHR3ZWVuUHJvcFxuICAgICwnYXBwbHlGaWx0ZXInOiBhcHBseUZpbHRlclxuICAgICwnc2hhbGxvd0NvcHknOiBzaGFsbG93Q29weVxuICAgICwnZGVmYXVsdHMnOiBkZWZhdWx0c1xuICAgICwnY29tcG9zZUVhc2luZ09iamVjdCc6IGNvbXBvc2VFYXNpbmdPYmplY3RcbiAgfSk7XG5cbiAgLy8gYHJvb3RgIGlzIHByb3ZpZGVkIGluIHRoZSBpbnRyby9vdXRybyBmaWxlcy5cblxuICAvLyBBIGhvb2sgdXNlZCBmb3IgdW5pdCB0ZXN0aW5nLlxuICBpZiAodHlwZW9mIFNISUZUWV9ERUJVR19OT1cgPT09ICdmdW5jdGlvbicpIHtcbiAgICByb290LnRpbWVvdXRIYW5kbGVyID0gdGltZW91dEhhbmRsZXI7XG4gIH1cblxuICAvLyBCb290c3RyYXAgVHdlZW5hYmxlIGFwcHJvcHJpYXRlbHkgZm9yIHRoZSBlbnZpcm9ubWVudC5cbiAgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUd2VlbmFibGU7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKGZ1bmN0aW9uICgpIHtyZXR1cm4gVHdlZW5hYmxlO30pO1xuICB9IGVsc2UgaWYgKHR5cGVvZiByb290LlR3ZWVuYWJsZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAvLyBCcm93c2VyOiBNYWtlIGBUd2VlbmFibGVgIGdsb2JhbGx5IGFjY2Vzc2libGUuXG4gICAgcm9vdC5Ud2VlbmFibGUgPSBUd2VlbmFibGU7XG4gIH1cblxuICByZXR1cm4gVHdlZW5hYmxlO1xuXG59ICgpKTtcblxuLyohXG4gKiBBbGwgZXF1YXRpb25zIGFyZSBhZGFwdGVkIGZyb20gVGhvbWFzIEZ1Y2hzJ1xuICogW1NjcmlwdHkyXShodHRwczovL2dpdGh1Yi5jb20vbWFkcm9iYnkvc2NyaXB0eTIvYmxvYi9tYXN0ZXIvc3JjL2VmZmVjdHMvdHJhbnNpdGlvbnMvcGVubmVyLmpzKS5cbiAqXG4gKiBCYXNlZCBvbiBFYXNpbmcgRXF1YXRpb25zIChjKSAyMDAzIFtSb2JlcnRcbiAqIFBlbm5lcl0oaHR0cDovL3d3dy5yb2JlcnRwZW5uZXIuY29tLyksIGFsbCByaWdodHMgcmVzZXJ2ZWQuIFRoaXMgd29yayBpc1xuICogW3N1YmplY3QgdG8gdGVybXNdKGh0dHA6Ly93d3cucm9iZXJ0cGVubmVyLmNvbS9lYXNpbmdfdGVybXNfb2ZfdXNlLmh0bWwpLlxuICovXG5cbi8qIVxuICogIFRFUk1TIE9GIFVTRSAtIEVBU0lORyBFUVVBVElPTlNcbiAqICBPcGVuIHNvdXJjZSB1bmRlciB0aGUgQlNEIExpY2Vuc2UuXG4gKiAgRWFzaW5nIEVxdWF0aW9ucyAoYykgMjAwMyBSb2JlcnQgUGVubmVyLCBhbGwgcmlnaHRzIHJlc2VydmVkLlxuICovXG5cbjsoZnVuY3Rpb24gKCkge1xuXG4gIFR3ZWVuYWJsZS5zaGFsbG93Q29weShUd2VlbmFibGUucHJvdG90eXBlLmZvcm11bGEsIHtcbiAgICBlYXNlSW5RdWFkOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICByZXR1cm4gTWF0aC5wb3cocG9zLCAyKTtcbiAgICB9LFxuXG4gICAgZWFzZU91dFF1YWQ6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIHJldHVybiAtKE1hdGgucG93KChwb3MgLSAxKSwgMikgLSAxKTtcbiAgICB9LFxuXG4gICAgZWFzZUluT3V0UXVhZDogZnVuY3Rpb24gKHBvcykge1xuICAgICAgaWYgKChwb3MgLz0gMC41KSA8IDEpIHtyZXR1cm4gMC41ICogTWF0aC5wb3cocG9zLDIpO31cbiAgICAgIHJldHVybiAtMC41ICogKChwb3MgLT0gMikgKiBwb3MgLSAyKTtcbiAgICB9LFxuXG4gICAgZWFzZUluQ3ViaWM6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIHJldHVybiBNYXRoLnBvdyhwb3MsIDMpO1xuICAgIH0sXG5cbiAgICBlYXNlT3V0Q3ViaWM6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIHJldHVybiAoTWF0aC5wb3coKHBvcyAtIDEpLCAzKSArIDEpO1xuICAgIH0sXG5cbiAgICBlYXNlSW5PdXRDdWJpYzogZnVuY3Rpb24gKHBvcykge1xuICAgICAgaWYgKChwb3MgLz0gMC41KSA8IDEpIHtyZXR1cm4gMC41ICogTWF0aC5wb3cocG9zLDMpO31cbiAgICAgIHJldHVybiAwLjUgKiAoTWF0aC5wb3coKHBvcyAtIDIpLDMpICsgMik7XG4gICAgfSxcblxuICAgIGVhc2VJblF1YXJ0OiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICByZXR1cm4gTWF0aC5wb3cocG9zLCA0KTtcbiAgICB9LFxuXG4gICAgZWFzZU91dFF1YXJ0OiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICByZXR1cm4gLShNYXRoLnBvdygocG9zIC0gMSksIDQpIC0gMSk7XG4gICAgfSxcblxuICAgIGVhc2VJbk91dFF1YXJ0OiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICBpZiAoKHBvcyAvPSAwLjUpIDwgMSkge3JldHVybiAwLjUgKiBNYXRoLnBvdyhwb3MsNCk7fVxuICAgICAgcmV0dXJuIC0wLjUgKiAoKHBvcyAtPSAyKSAqIE1hdGgucG93KHBvcywzKSAtIDIpO1xuICAgIH0sXG5cbiAgICBlYXNlSW5RdWludDogZnVuY3Rpb24gKHBvcykge1xuICAgICAgcmV0dXJuIE1hdGgucG93KHBvcywgNSk7XG4gICAgfSxcblxuICAgIGVhc2VPdXRRdWludDogZnVuY3Rpb24gKHBvcykge1xuICAgICAgcmV0dXJuIChNYXRoLnBvdygocG9zIC0gMSksIDUpICsgMSk7XG4gICAgfSxcblxuICAgIGVhc2VJbk91dFF1aW50OiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICBpZiAoKHBvcyAvPSAwLjUpIDwgMSkge3JldHVybiAwLjUgKiBNYXRoLnBvdyhwb3MsNSk7fVxuICAgICAgcmV0dXJuIDAuNSAqIChNYXRoLnBvdygocG9zIC0gMiksNSkgKyAyKTtcbiAgICB9LFxuXG4gICAgZWFzZUluU2luZTogZnVuY3Rpb24gKHBvcykge1xuICAgICAgcmV0dXJuIC1NYXRoLmNvcyhwb3MgKiAoTWF0aC5QSSAvIDIpKSArIDE7XG4gICAgfSxcblxuICAgIGVhc2VPdXRTaW5lOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICByZXR1cm4gTWF0aC5zaW4ocG9zICogKE1hdGguUEkgLyAyKSk7XG4gICAgfSxcblxuICAgIGVhc2VJbk91dFNpbmU6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIHJldHVybiAoLTAuNSAqIChNYXRoLmNvcyhNYXRoLlBJICogcG9zKSAtIDEpKTtcbiAgICB9LFxuXG4gICAgZWFzZUluRXhwbzogZnVuY3Rpb24gKHBvcykge1xuICAgICAgcmV0dXJuIChwb3MgPT09IDApID8gMCA6IE1hdGgucG93KDIsIDEwICogKHBvcyAtIDEpKTtcbiAgICB9LFxuXG4gICAgZWFzZU91dEV4cG86IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIHJldHVybiAocG9zID09PSAxKSA/IDEgOiAtTWF0aC5wb3coMiwgLTEwICogcG9zKSArIDE7XG4gICAgfSxcblxuICAgIGVhc2VJbk91dEV4cG86IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIGlmIChwb3MgPT09IDApIHtyZXR1cm4gMDt9XG4gICAgICBpZiAocG9zID09PSAxKSB7cmV0dXJuIDE7fVxuICAgICAgaWYgKChwb3MgLz0gMC41KSA8IDEpIHtyZXR1cm4gMC41ICogTWF0aC5wb3coMiwxMCAqIChwb3MgLSAxKSk7fVxuICAgICAgcmV0dXJuIDAuNSAqICgtTWF0aC5wb3coMiwgLTEwICogLS1wb3MpICsgMik7XG4gICAgfSxcblxuICAgIGVhc2VJbkNpcmM6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIHJldHVybiAtKE1hdGguc3FydCgxIC0gKHBvcyAqIHBvcykpIC0gMSk7XG4gICAgfSxcblxuICAgIGVhc2VPdXRDaXJjOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICByZXR1cm4gTWF0aC5zcXJ0KDEgLSBNYXRoLnBvdygocG9zIC0gMSksIDIpKTtcbiAgICB9LFxuXG4gICAgZWFzZUluT3V0Q2lyYzogZnVuY3Rpb24gKHBvcykge1xuICAgICAgaWYgKChwb3MgLz0gMC41KSA8IDEpIHtyZXR1cm4gLTAuNSAqIChNYXRoLnNxcnQoMSAtIHBvcyAqIHBvcykgLSAxKTt9XG4gICAgICByZXR1cm4gMC41ICogKE1hdGguc3FydCgxIC0gKHBvcyAtPSAyKSAqIHBvcykgKyAxKTtcbiAgICB9LFxuXG4gICAgZWFzZU91dEJvdW5jZTogZnVuY3Rpb24gKHBvcykge1xuICAgICAgaWYgKChwb3MpIDwgKDEgLyAyLjc1KSkge1xuICAgICAgICByZXR1cm4gKDcuNTYyNSAqIHBvcyAqIHBvcyk7XG4gICAgICB9IGVsc2UgaWYgKHBvcyA8ICgyIC8gMi43NSkpIHtcbiAgICAgICAgcmV0dXJuICg3LjU2MjUgKiAocG9zIC09ICgxLjUgLyAyLjc1KSkgKiBwb3MgKyAwLjc1KTtcbiAgICAgIH0gZWxzZSBpZiAocG9zIDwgKDIuNSAvIDIuNzUpKSB7XG4gICAgICAgIHJldHVybiAoNy41NjI1ICogKHBvcyAtPSAoMi4yNSAvIDIuNzUpKSAqIHBvcyArIDAuOTM3NSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gKDcuNTYyNSAqIChwb3MgLT0gKDIuNjI1IC8gMi43NSkpICogcG9zICsgMC45ODQzNzUpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBlYXNlSW5CYWNrOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICB2YXIgcyA9IDEuNzAxNTg7XG4gICAgICByZXR1cm4gKHBvcykgKiBwb3MgKiAoKHMgKyAxKSAqIHBvcyAtIHMpO1xuICAgIH0sXG5cbiAgICBlYXNlT3V0QmFjazogZnVuY3Rpb24gKHBvcykge1xuICAgICAgdmFyIHMgPSAxLjcwMTU4O1xuICAgICAgcmV0dXJuIChwb3MgPSBwb3MgLSAxKSAqIHBvcyAqICgocyArIDEpICogcG9zICsgcykgKyAxO1xuICAgIH0sXG5cbiAgICBlYXNlSW5PdXRCYWNrOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICB2YXIgcyA9IDEuNzAxNTg7XG4gICAgICBpZiAoKHBvcyAvPSAwLjUpIDwgMSkge1xuICAgICAgICByZXR1cm4gMC41ICogKHBvcyAqIHBvcyAqICgoKHMgKj0gKDEuNTI1KSkgKyAxKSAqIHBvcyAtIHMpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAwLjUgKiAoKHBvcyAtPSAyKSAqIHBvcyAqICgoKHMgKj0gKDEuNTI1KSkgKyAxKSAqIHBvcyArIHMpICsgMik7XG4gICAgfSxcblxuICAgIGVsYXN0aWM6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIC8vIGpzaGludCBtYXhsZW46OTBcbiAgICAgIHJldHVybiAtMSAqIE1hdGgucG93KDQsLTggKiBwb3MpICogTWF0aC5zaW4oKHBvcyAqIDYgLSAxKSAqICgyICogTWF0aC5QSSkgLyAyKSArIDE7XG4gICAgfSxcblxuICAgIHN3aW5nRnJvbVRvOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICB2YXIgcyA9IDEuNzAxNTg7XG4gICAgICByZXR1cm4gKChwb3MgLz0gMC41KSA8IDEpID9cbiAgICAgICAgICAwLjUgKiAocG9zICogcG9zICogKCgocyAqPSAoMS41MjUpKSArIDEpICogcG9zIC0gcykpIDpcbiAgICAgICAgICAwLjUgKiAoKHBvcyAtPSAyKSAqIHBvcyAqICgoKHMgKj0gKDEuNTI1KSkgKyAxKSAqIHBvcyArIHMpICsgMik7XG4gICAgfSxcblxuICAgIHN3aW5nRnJvbTogZnVuY3Rpb24gKHBvcykge1xuICAgICAgdmFyIHMgPSAxLjcwMTU4O1xuICAgICAgcmV0dXJuIHBvcyAqIHBvcyAqICgocyArIDEpICogcG9zIC0gcyk7XG4gICAgfSxcblxuICAgIHN3aW5nVG86IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIHZhciBzID0gMS43MDE1ODtcbiAgICAgIHJldHVybiAocG9zIC09IDEpICogcG9zICogKChzICsgMSkgKiBwb3MgKyBzKSArIDE7XG4gICAgfSxcblxuICAgIGJvdW5jZTogZnVuY3Rpb24gKHBvcykge1xuICAgICAgaWYgKHBvcyA8ICgxIC8gMi43NSkpIHtcbiAgICAgICAgcmV0dXJuICg3LjU2MjUgKiBwb3MgKiBwb3MpO1xuICAgICAgfSBlbHNlIGlmIChwb3MgPCAoMiAvIDIuNzUpKSB7XG4gICAgICAgIHJldHVybiAoNy41NjI1ICogKHBvcyAtPSAoMS41IC8gMi43NSkpICogcG9zICsgMC43NSk7XG4gICAgICB9IGVsc2UgaWYgKHBvcyA8ICgyLjUgLyAyLjc1KSkge1xuICAgICAgICByZXR1cm4gKDcuNTYyNSAqIChwb3MgLT0gKDIuMjUgLyAyLjc1KSkgKiBwb3MgKyAwLjkzNzUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICg3LjU2MjUgKiAocG9zIC09ICgyLjYyNSAvIDIuNzUpKSAqIHBvcyArIDAuOTg0Mzc1KTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgYm91bmNlUGFzdDogZnVuY3Rpb24gKHBvcykge1xuICAgICAgaWYgKHBvcyA8ICgxIC8gMi43NSkpIHtcbiAgICAgICAgcmV0dXJuICg3LjU2MjUgKiBwb3MgKiBwb3MpO1xuICAgICAgfSBlbHNlIGlmIChwb3MgPCAoMiAvIDIuNzUpKSB7XG4gICAgICAgIHJldHVybiAyIC0gKDcuNTYyNSAqIChwb3MgLT0gKDEuNSAvIDIuNzUpKSAqIHBvcyArIDAuNzUpO1xuICAgICAgfSBlbHNlIGlmIChwb3MgPCAoMi41IC8gMi43NSkpIHtcbiAgICAgICAgcmV0dXJuIDIgLSAoNy41NjI1ICogKHBvcyAtPSAoMi4yNSAvIDIuNzUpKSAqIHBvcyArIDAuOTM3NSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gMiAtICg3LjU2MjUgKiAocG9zIC09ICgyLjYyNSAvIDIuNzUpKSAqIHBvcyArIDAuOTg0Mzc1KTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZWFzZUZyb21UbzogZnVuY3Rpb24gKHBvcykge1xuICAgICAgaWYgKChwb3MgLz0gMC41KSA8IDEpIHtyZXR1cm4gMC41ICogTWF0aC5wb3cocG9zLDQpO31cbiAgICAgIHJldHVybiAtMC41ICogKChwb3MgLT0gMikgKiBNYXRoLnBvdyhwb3MsMykgLSAyKTtcbiAgICB9LFxuXG4gICAgZWFzZUZyb206IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIHJldHVybiBNYXRoLnBvdyhwb3MsNCk7XG4gICAgfSxcblxuICAgIGVhc2VUbzogZnVuY3Rpb24gKHBvcykge1xuICAgICAgcmV0dXJuIE1hdGgucG93KHBvcywwLjI1KTtcbiAgICB9XG4gIH0pO1xuXG59KCkpO1xuXG4vLyBqc2hpbnQgbWF4bGVuOjEwMFxuLyoqXG4gKiBUaGUgQmV6aWVyIG1hZ2ljIGluIHRoaXMgZmlsZSBpcyBhZGFwdGVkL2NvcGllZCBhbG1vc3Qgd2hvbGVzYWxlIGZyb21cbiAqIFtTY3JpcHR5Ml0oaHR0cHM6Ly9naXRodWIuY29tL21hZHJvYmJ5L3NjcmlwdHkyL2Jsb2IvbWFzdGVyL3NyYy9lZmZlY3RzL3RyYW5zaXRpb25zL2N1YmljLWJlemllci5qcyksXG4gKiB3aGljaCB3YXMgYWRhcHRlZCBmcm9tIEFwcGxlIGNvZGUgKHdoaWNoIHByb2JhYmx5IGNhbWUgZnJvbVxuICogW2hlcmVdKGh0dHA6Ly9vcGVuc291cmNlLmFwcGxlLmNvbS9zb3VyY2UvV2ViQ29yZS9XZWJDb3JlLTk1NS42Ni9wbGF0Zm9ybS9ncmFwaGljcy9Vbml0QmV6aWVyLmgpKS5cbiAqIFNwZWNpYWwgdGhhbmtzIHRvIEFwcGxlIGFuZCBUaG9tYXMgRnVjaHMgZm9yIG11Y2ggb2YgdGhpcyBjb2RlLlxuICovXG5cbi8qKlxuICogIENvcHlyaWdodCAoYykgMjAwNiBBcHBsZSBDb21wdXRlciwgSW5jLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqICBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAqICBtb2RpZmljYXRpb24sIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcbiAqXG4gKiAgMS4gUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLFxuICogIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gKlxuICogIDIuIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiAqICB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZSBkb2N1bWVudGF0aW9uXG4gKiAgYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG4gKlxuICogIDMuIE5laXRoZXIgdGhlIG5hbWUgb2YgdGhlIGNvcHlyaWdodCBob2xkZXIocykgbm9yIHRoZSBuYW1lcyBvZiBhbnlcbiAqICBjb250cmlidXRvcnMgbWF5IGJlIHVzZWQgdG8gZW5kb3JzZSBvciBwcm9tb3RlIHByb2R1Y3RzIGRlcml2ZWQgZnJvbVxuICogIHRoaXMgc29mdHdhcmUgd2l0aG91dCBzcGVjaWZpYyBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24uXG4gKlxuICogIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiXG4gKiAgQU5EIEFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRVxuICogIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFXG4gKiAgQVJFIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBDT1BZUklHSFQgT1dORVIgT1IgQ09OVFJJQlVUT1JTIEJFXG4gKiAgTElBQkxFIEZPUiBBTlkgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUlxuICogIENPTlNFUVVFTlRJQUwgREFNQUdFUyAoSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GXG4gKiAgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUzsgTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTXG4gKiAgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU5cbiAqICBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVCAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKVxuICogIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFXG4gKiAgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gKi9cbjsoZnVuY3Rpb24gKCkge1xuICAvLyBwb3J0IG9mIHdlYmtpdCBjdWJpYyBiZXppZXIgaGFuZGxpbmcgYnkgaHR0cDovL3d3dy5uZXR6Z2VzdGEuZGUvZGV2L1xuICBmdW5jdGlvbiBjdWJpY0JlemllckF0VGltZSh0LHAxeCxwMXkscDJ4LHAyeSxkdXJhdGlvbikge1xuICAgIHZhciBheCA9IDAsYnggPSAwLGN4ID0gMCxheSA9IDAsYnkgPSAwLGN5ID0gMDtcbiAgICBmdW5jdGlvbiBzYW1wbGVDdXJ2ZVgodCkge1xuICAgICAgcmV0dXJuICgoYXggKiB0ICsgYngpICogdCArIGN4KSAqIHQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNhbXBsZUN1cnZlWSh0KSB7XG4gICAgICByZXR1cm4gKChheSAqIHQgKyBieSkgKiB0ICsgY3kpICogdDtcbiAgICB9XG4gICAgZnVuY3Rpb24gc2FtcGxlQ3VydmVEZXJpdmF0aXZlWCh0KSB7XG4gICAgICByZXR1cm4gKDMuMCAqIGF4ICogdCArIDIuMCAqIGJ4KSAqIHQgKyBjeDtcbiAgICB9XG4gICAgZnVuY3Rpb24gc29sdmVFcHNpbG9uKGR1cmF0aW9uKSB7XG4gICAgICByZXR1cm4gMS4wIC8gKDIwMC4wICogZHVyYXRpb24pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzb2x2ZSh4LGVwc2lsb24pIHtcbiAgICAgIHJldHVybiBzYW1wbGVDdXJ2ZVkoc29sdmVDdXJ2ZVgoeCwgZXBzaWxvbikpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBmYWJzKG4pIHtcbiAgICAgIGlmIChuID49IDApIHtcbiAgICAgICAgcmV0dXJuIG47XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gMCAtIG47XG4gICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNvbHZlQ3VydmVYKHgsIGVwc2lsb24pIHtcbiAgICAgIHZhciB0MCx0MSx0Mix4MixkMixpO1xuICAgICAgZm9yICh0MiA9IHgsIGkgPSAwOyBpIDwgODsgaSsrKSB7XG4gICAgICAgIHgyID0gc2FtcGxlQ3VydmVYKHQyKSAtIHg7XG4gICAgICAgIGlmIChmYWJzKHgyKSA8IGVwc2lsb24pIHtcbiAgICAgICAgICByZXR1cm4gdDI7XG4gICAgICAgIH1cbiAgICAgICAgZDIgPSBzYW1wbGVDdXJ2ZURlcml2YXRpdmVYKHQyKTtcbiAgICAgICAgaWYgKGZhYnMoZDIpIDwgMWUtNikge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHQyID0gdDIgLSB4MiAvIGQyO1xuICAgICAgfVxuICAgICAgdDAgPSAwLjA7XG4gICAgICB0MSA9IDEuMDtcbiAgICAgIHQyID0geDtcbiAgICAgIGlmICh0MiA8IHQwKSB7XG4gICAgICAgIHJldHVybiB0MDtcbiAgICAgIH1cbiAgICAgIGlmICh0MiA+IHQxKSB7XG4gICAgICAgIHJldHVybiB0MTtcbiAgICAgIH1cbiAgICAgIHdoaWxlICh0MCA8IHQxKSB7XG4gICAgICAgIHgyID0gc2FtcGxlQ3VydmVYKHQyKTtcbiAgICAgICAgaWYgKGZhYnMoeDIgLSB4KSA8IGVwc2lsb24pIHtcbiAgICAgICAgICByZXR1cm4gdDI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHggPiB4Mikge1xuICAgICAgICAgIHQwID0gdDI7XG4gICAgICAgIH1lbHNlIHtcbiAgICAgICAgICB0MSA9IHQyO1xuICAgICAgICB9XG4gICAgICAgIHQyID0gKHQxIC0gdDApICogMC41ICsgdDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gdDI7IC8vIEZhaWx1cmUuXG4gICAgfVxuICAgIGN4ID0gMy4wICogcDF4O1xuICAgIGJ4ID0gMy4wICogKHAyeCAtIHAxeCkgLSBjeDtcbiAgICBheCA9IDEuMCAtIGN4IC0gYng7XG4gICAgY3kgPSAzLjAgKiBwMXk7XG4gICAgYnkgPSAzLjAgKiAocDJ5IC0gcDF5KSAtIGN5O1xuICAgIGF5ID0gMS4wIC0gY3kgLSBieTtcbiAgICByZXR1cm4gc29sdmUodCwgc29sdmVFcHNpbG9uKGR1cmF0aW9uKSk7XG4gIH1cbiAgLyoqXG4gICAqICBnZXRDdWJpY0JlemllclRyYW5zaXRpb24oeDEsIHkxLCB4MiwgeTIpIC0+IEZ1bmN0aW9uXG4gICAqXG4gICAqICBHZW5lcmF0ZXMgYSB0cmFuc2l0aW9uIGVhc2luZyBmdW5jdGlvbiB0aGF0IGlzIGNvbXBhdGlibGVcbiAgICogIHdpdGggV2ViS2l0J3MgQ1NTIHRyYW5zaXRpb25zIGAtd2Via2l0LXRyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uYFxuICAgKiAgQ1NTIHByb3BlcnR5LlxuICAgKlxuICAgKiAgVGhlIFczQyBoYXMgbW9yZSBpbmZvcm1hdGlvbiBhYm91dCBDU1MzIHRyYW5zaXRpb24gdGltaW5nIGZ1bmN0aW9uczpcbiAgICogIGh0dHA6Ly93d3cudzMub3JnL1RSL2NzczMtdHJhbnNpdGlvbnMvI3RyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uX3RhZ1xuICAgKlxuICAgKiAgQHBhcmFtIHtudW1iZXJ9IHgxXG4gICAqICBAcGFyYW0ge251bWJlcn0geTFcbiAgICogIEBwYXJhbSB7bnVtYmVyfSB4MlxuICAgKiAgQHBhcmFtIHtudW1iZXJ9IHkyXG4gICAqICBAcmV0dXJuIHtmdW5jdGlvbn1cbiAgICogIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBnZXRDdWJpY0JlemllclRyYW5zaXRpb24gKHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIHJldHVybiBjdWJpY0JlemllckF0VGltZShwb3MseDEseTEseDIseTIsMSk7XG4gICAgfTtcbiAgfVxuICAvLyBFbmQgcG9ydGVkIGNvZGVcblxuICAvKipcbiAgICogQ3JlYXRlIGEgQmV6aWVyIGVhc2luZyBmdW5jdGlvbiBhbmQgYXR0YWNoIGl0IHRvIGB7eyNjcm9zc0xpbmtcbiAgICogXCJUd2VlbmFibGUvZm9ybXVsYTpwcm9wZXJ0eVwifX1Ud2VlbmFibGUjZm9ybXVsYXt7L2Nyb3NzTGlua319YC4gIFRoaXNcbiAgICogZnVuY3Rpb24gZ2l2ZXMgeW91IHRvdGFsIGNvbnRyb2wgb3ZlciB0aGUgZWFzaW5nIGN1cnZlLiAgTWF0dGhldyBMZWluJ3NcbiAgICogW0NlYXNlcl0oaHR0cDovL21hdHRoZXdsZWluLmNvbS9jZWFzZXIvKSBpcyBhIHVzZWZ1bCB0b29sIGZvciB2aXN1YWxpemluZ1xuICAgKiB0aGUgY3VydmVzIHlvdSBjYW4gbWFrZSB3aXRoIHRoaXMgZnVuY3Rpb24uXG4gICAqIEBtZXRob2Qgc2V0QmV6aWVyRnVuY3Rpb25cbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIGVhc2luZyBjdXJ2ZS4gIE92ZXJ3cml0ZXMgdGhlIG9sZFxuICAgKiBlYXNpbmcgZnVuY3Rpb24gb24gYHt7I2Nyb3NzTGlua1xuICAgKiBcIlR3ZWVuYWJsZS9mb3JtdWxhOnByb3BlcnR5XCJ9fVR3ZWVuYWJsZSNmb3JtdWxhe3svY3Jvc3NMaW5rfX1gIGlmIGl0XG4gICAqIGV4aXN0cy5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHgxXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5MVxuICAgKiBAcGFyYW0ge251bWJlcn0geDJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHkyXG4gICAqIEByZXR1cm4ge2Z1bmN0aW9ufSBUaGUgZWFzaW5nIGZ1bmN0aW9uIHRoYXQgd2FzIGF0dGFjaGVkIHRvXG4gICAqIFR3ZWVuYWJsZS5wcm90b3R5cGUuZm9ybXVsYS5cbiAgICovXG4gIFR3ZWVuYWJsZS5zZXRCZXppZXJGdW5jdGlvbiA9IGZ1bmN0aW9uIChuYW1lLCB4MSwgeTEsIHgyLCB5Mikge1xuICAgIHZhciBjdWJpY0JlemllclRyYW5zaXRpb24gPSBnZXRDdWJpY0JlemllclRyYW5zaXRpb24oeDEsIHkxLCB4MiwgeTIpO1xuICAgIGN1YmljQmV6aWVyVHJhbnNpdGlvbi5kaXNwbGF5TmFtZSA9IG5hbWU7XG4gICAgY3ViaWNCZXppZXJUcmFuc2l0aW9uLngxID0geDE7XG4gICAgY3ViaWNCZXppZXJUcmFuc2l0aW9uLnkxID0geTE7XG4gICAgY3ViaWNCZXppZXJUcmFuc2l0aW9uLngyID0geDI7XG4gICAgY3ViaWNCZXppZXJUcmFuc2l0aW9uLnkyID0geTI7XG5cbiAgICByZXR1cm4gVHdlZW5hYmxlLnByb3RvdHlwZS5mb3JtdWxhW25hbWVdID0gY3ViaWNCZXppZXJUcmFuc2l0aW9uO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIGBkZWxldGVgIGFuIGVhc2luZyBmdW5jdGlvbiBmcm9tIGB7eyNjcm9zc0xpbmtcbiAgICogXCJUd2VlbmFibGUvZm9ybXVsYTpwcm9wZXJ0eVwifX1Ud2VlbmFibGUjZm9ybXVsYXt7L2Nyb3NzTGlua319YC4gIEJlXG4gICAqIGNhcmVmdWwgd2l0aCB0aGlzIG1ldGhvZCwgYXMgaXQgYGRlbGV0ZWBzIHdoYXRldmVyIGVhc2luZyBmb3JtdWxhIG1hdGNoZXNcbiAgICogYG5hbWVgICh3aGljaCBtZWFucyB5b3UgY2FuIGRlbGV0ZSBzdGFuZGFyZCBTaGlmdHkgZWFzaW5nIGZ1bmN0aW9ucykuXG4gICAqIEBtZXRob2QgdW5zZXRCZXppZXJGdW5jdGlvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgZWFzaW5nIGZ1bmN0aW9uIHRvIGRlbGV0ZS5cbiAgICogQHJldHVybiB7ZnVuY3Rpb259XG4gICAqL1xuICBUd2VlbmFibGUudW5zZXRCZXppZXJGdW5jdGlvbiA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgZGVsZXRlIFR3ZWVuYWJsZS5wcm90b3R5cGUuZm9ybXVsYVtuYW1lXTtcbiAgfTtcblxufSkoKTtcblxuOyhmdW5jdGlvbiAoKSB7XG5cbiAgZnVuY3Rpb24gZ2V0SW50ZXJwb2xhdGVkVmFsdWVzIChcbiAgICBmcm9tLCBjdXJyZW50LCB0YXJnZXRTdGF0ZSwgcG9zaXRpb24sIGVhc2luZywgZGVsYXkpIHtcbiAgICByZXR1cm4gVHdlZW5hYmxlLnR3ZWVuUHJvcHMoXG4gICAgICBwb3NpdGlvbiwgY3VycmVudCwgZnJvbSwgdGFyZ2V0U3RhdGUsIDEsIGRlbGF5LCBlYXNpbmcpO1xuICB9XG5cbiAgLy8gRmFrZSBhIFR3ZWVuYWJsZSBhbmQgcGF0Y2ggc29tZSBpbnRlcm5hbHMuICBUaGlzIGFwcHJvYWNoIGFsbG93cyB1cyB0b1xuICAvLyBza2lwIHVuZWNjZXNzYXJ5IHByb2Nlc3NpbmcgYW5kIG9iamVjdCByZWNyZWF0aW9uLCBjdXR0aW5nIGRvd24gb24gZ2FyYmFnZVxuICAvLyBjb2xsZWN0aW9uIHBhdXNlcy5cbiAgdmFyIG1vY2tUd2VlbmFibGUgPSBuZXcgVHdlZW5hYmxlKCk7XG4gIG1vY2tUd2VlbmFibGUuX2ZpbHRlckFyZ3MgPSBbXTtcblxuICAvKipcbiAgICogQ29tcHV0ZSB0aGUgbWlkcG9pbnQgb2YgdHdvIE9iamVjdHMuICBUaGlzIG1ldGhvZCBlZmZlY3RpdmVseSBjYWxjdWxhdGVzIGFcbiAgICogc3BlY2lmaWMgZnJhbWUgb2YgYW5pbWF0aW9uIHRoYXQgYHt7I2Nyb3NzTGlua1xuICAgKiBcIlR3ZWVuYWJsZS90d2VlbjptZXRob2RcIn19e3svY3Jvc3NMaW5rfX1gIGRvZXMgbWFueSB0aW1lcyBvdmVyIHRoZSBjb3Vyc2VcbiAgICogb2YgYSBmdWxsIHR3ZWVuLlxuICAgKlxuICAgKiAgICAgdmFyIGludGVycG9sYXRlZFZhbHVlcyA9IFR3ZWVuYWJsZS5pbnRlcnBvbGF0ZSh7XG4gICAqICAgICAgIHdpZHRoOiAnMTAwcHgnLFxuICAgKiAgICAgICBvcGFjaXR5OiAwLFxuICAgKiAgICAgICBjb2xvcjogJyNmZmYnXG4gICAqICAgICB9LCB7XG4gICAqICAgICAgIHdpZHRoOiAnMjAwcHgnLFxuICAgKiAgICAgICBvcGFjaXR5OiAxLFxuICAgKiAgICAgICBjb2xvcjogJyMwMDAnXG4gICAqICAgICB9LCAwLjUpO1xuICAgKlxuICAgKiAgICAgY29uc29sZS5sb2coaW50ZXJwb2xhdGVkVmFsdWVzKTtcbiAgICogICAgIC8vIHtvcGFjaXR5OiAwLjUsIHdpZHRoOiBcIjE1MHB4XCIsIGNvbG9yOiBcInJnYigxMjcsMTI3LDEyNylcIn1cbiAgICpcbiAgICogQHN0YXRpY1xuICAgKiBAbWV0aG9kIGludGVycG9sYXRlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBmcm9tIFRoZSBzdGFydGluZyB2YWx1ZXMgdG8gdHdlZW4gZnJvbS5cbiAgICogQHBhcmFtIHtPYmplY3R9IHRhcmdldFN0YXRlIFRoZSBlbmRpbmcgdmFsdWVzIHRvIHR3ZWVuIHRvLlxuICAgKiBAcGFyYW0ge251bWJlcn0gcG9zaXRpb24gVGhlIG5vcm1hbGl6ZWQgcG9zaXRpb24gdmFsdWUgKGJldHdlZW4gYDAuMGAgYW5kXG4gICAqIGAxLjBgKSB0byBpbnRlcnBvbGF0ZSB0aGUgdmFsdWVzIGJldHdlZW4gYGZyb21gIGFuZCBgdG9gIGZvci4gIGBmcm9tYFxuICAgKiByZXByZXNlbnRzIGAwYCBhbmQgYHRvYCByZXByZXNlbnRzIGAxYC5cbiAgICogQHBhcmFtIHtPYmplY3QuPHN0cmluZ3xGdW5jdGlvbj58c3RyaW5nfEZ1bmN0aW9ufSBlYXNpbmcgVGhlIGVhc2luZ1xuICAgKiBjdXJ2ZShzKSB0byBjYWxjdWxhdGUgdGhlIG1pZHBvaW50IGFnYWluc3QuICBZb3UgY2FuIHJlZmVyZW5jZSBhbnkgZWFzaW5nXG4gICAqIGZ1bmN0aW9uIGF0dGFjaGVkIHRvIGBUd2VlbmFibGUucHJvdG90eXBlLmZvcm11bGFgLCBvciBwcm92aWRlIHRoZSBlYXNpbmdcbiAgICogZnVuY3Rpb24ocykgZGlyZWN0bHkuICBJZiBvbWl0dGVkLCB0aGlzIGRlZmF1bHRzIHRvIFwibGluZWFyXCIuXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gb3B0X2RlbGF5IE9wdGlvbmFsIGRlbGF5IHRvIHBhZCB0aGUgYmVnaW5uaW5nIG9mIHRoZVxuICAgKiBpbnRlcnBvbGF0ZWQgdHdlZW4gd2l0aC4gIFRoaXMgaW5jcmVhc2VzIHRoZSByYW5nZSBvZiBgcG9zaXRpb25gIGZyb20gKGAwYFxuICAgKiB0aHJvdWdoIGAxYCkgdG8gKGAwYCB0aHJvdWdoIGAxICsgb3B0X2RlbGF5YCkuICBTbywgYSBkZWxheSBvZiBgMC41YCB3b3VsZFxuICAgKiBpbmNyZWFzZSBhbGwgdmFsaWQgdmFsdWVzIG9mIGBwb3NpdGlvbmAgdG8gbnVtYmVycyBiZXR3ZWVuIGAwYCBhbmQgYDEuNWAuXG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICovXG4gIFR3ZWVuYWJsZS5pbnRlcnBvbGF0ZSA9IGZ1bmN0aW9uIChcbiAgICBmcm9tLCB0YXJnZXRTdGF0ZSwgcG9zaXRpb24sIGVhc2luZywgb3B0X2RlbGF5KSB7XG5cbiAgICB2YXIgY3VycmVudCA9IFR3ZWVuYWJsZS5zaGFsbG93Q29weSh7fSwgZnJvbSk7XG4gICAgdmFyIGRlbGF5ID0gb3B0X2RlbGF5IHx8IDA7XG4gICAgdmFyIGVhc2luZ09iamVjdCA9IFR3ZWVuYWJsZS5jb21wb3NlRWFzaW5nT2JqZWN0KFxuICAgICAgZnJvbSwgZWFzaW5nIHx8ICdsaW5lYXInKTtcblxuICAgIG1vY2tUd2VlbmFibGUuc2V0KHt9KTtcblxuICAgIC8vIEFsaWFzIGFuZCByZXVzZSB0aGUgX2ZpbHRlckFyZ3MgYXJyYXkgaW5zdGVhZCBvZiByZWNyZWF0aW5nIGl0LlxuICAgIHZhciBmaWx0ZXJBcmdzID0gbW9ja1R3ZWVuYWJsZS5fZmlsdGVyQXJncztcbiAgICBmaWx0ZXJBcmdzLmxlbmd0aCA9IDA7XG4gICAgZmlsdGVyQXJnc1swXSA9IGN1cnJlbnQ7XG4gICAgZmlsdGVyQXJnc1sxXSA9IGZyb207XG4gICAgZmlsdGVyQXJnc1syXSA9IHRhcmdldFN0YXRlO1xuICAgIGZpbHRlckFyZ3NbM10gPSBlYXNpbmdPYmplY3Q7XG5cbiAgICAvLyBBbnkgZGVmaW5lZCB2YWx1ZSB0cmFuc2Zvcm1hdGlvbiBtdXN0IGJlIGFwcGxpZWRcbiAgICBUd2VlbmFibGUuYXBwbHlGaWx0ZXIobW9ja1R3ZWVuYWJsZSwgJ3R3ZWVuQ3JlYXRlZCcpO1xuICAgIFR3ZWVuYWJsZS5hcHBseUZpbHRlcihtb2NrVHdlZW5hYmxlLCAnYmVmb3JlVHdlZW4nKTtcblxuICAgIHZhciBpbnRlcnBvbGF0ZWRWYWx1ZXMgPSBnZXRJbnRlcnBvbGF0ZWRWYWx1ZXMoXG4gICAgICBmcm9tLCBjdXJyZW50LCB0YXJnZXRTdGF0ZSwgcG9zaXRpb24sIGVhc2luZ09iamVjdCwgZGVsYXkpO1xuXG4gICAgLy8gVHJhbnNmb3JtIHZhbHVlcyBiYWNrIGludG8gdGhlaXIgb3JpZ2luYWwgZm9ybWF0XG4gICAgVHdlZW5hYmxlLmFwcGx5RmlsdGVyKG1vY2tUd2VlbmFibGUsICdhZnRlclR3ZWVuJyk7XG5cbiAgICByZXR1cm4gaW50ZXJwb2xhdGVkVmFsdWVzO1xuICB9O1xuXG59KCkpO1xuXG4vKipcbiAqIFRoaXMgbW9kdWxlIGFkZHMgc3RyaW5nIGludGVycG9sYXRpb24gc3VwcG9ydCB0byBTaGlmdHkuXG4gKlxuICogVGhlIFRva2VuIGV4dGVuc2lvbiBhbGxvd3MgU2hpZnR5IHRvIHR3ZWVuIG51bWJlcnMgaW5zaWRlIG9mIHN0cmluZ3MuICBBbW9uZ1xuICogb3RoZXIgdGhpbmdzLCB0aGlzIGFsbG93cyB5b3UgdG8gYW5pbWF0ZSBDU1MgcHJvcGVydGllcy4gIEZvciBleGFtcGxlLCB5b3VcbiAqIGNhbiBkbyB0aGlzOlxuICpcbiAqICAgICB2YXIgdHdlZW5hYmxlID0gbmV3IFR3ZWVuYWJsZSgpO1xuICogICAgIHR3ZWVuYWJsZS50d2Vlbih7XG4gKiAgICAgICBmcm9tOiB7IHRyYW5zZm9ybTogJ3RyYW5zbGF0ZVgoNDVweCknIH0sXG4gKiAgICAgICB0bzogeyB0cmFuc2Zvcm06ICd0cmFuc2xhdGVYKDkweHApJyB9XG4gKiAgICAgfSk7XG4gKlxuICogYHRyYW5zbGF0ZVgoNDUpYCB3aWxsIGJlIHR3ZWVuZWQgdG8gYHRyYW5zbGF0ZVgoOTApYC4gIFRvIGRlbW9uc3RyYXRlOlxuICpcbiAqICAgICB2YXIgdHdlZW5hYmxlID0gbmV3IFR3ZWVuYWJsZSgpO1xuICogICAgIHR3ZWVuYWJsZS50d2Vlbih7XG4gKiAgICAgICBmcm9tOiB7IHRyYW5zZm9ybTogJ3RyYW5zbGF0ZVgoNDVweCknIH0sXG4gKiAgICAgICB0bzogeyB0cmFuc2Zvcm06ICd0cmFuc2xhdGVYKDkwcHgpJyB9LFxuICogICAgICAgc3RlcDogZnVuY3Rpb24gKHN0YXRlKSB7XG4gKiAgICAgICAgIGNvbnNvbGUubG9nKHN0YXRlLnRyYW5zZm9ybSk7XG4gKiAgICAgICB9XG4gKiAgICAgfSk7XG4gKlxuICogVGhlIGFib3ZlIHNuaXBwZXQgd2lsbCBsb2cgc29tZXRoaW5nIGxpa2UgdGhpcyBpbiB0aGUgY29uc29sZTpcbiAqXG4gKiAgICAgdHJhbnNsYXRlWCg2MC4zcHgpXG4gKiAgICAgLi4uXG4gKiAgICAgdHJhbnNsYXRlWCg3Ni4wNXB4KVxuICogICAgIC4uLlxuICogICAgIHRyYW5zbGF0ZVgoOTBweClcbiAqXG4gKiBBbm90aGVyIHVzZSBmb3IgdGhpcyBpcyBhbmltYXRpbmcgY29sb3JzOlxuICpcbiAqICAgICB2YXIgdHdlZW5hYmxlID0gbmV3IFR3ZWVuYWJsZSgpO1xuICogICAgIHR3ZWVuYWJsZS50d2Vlbih7XG4gKiAgICAgICBmcm9tOiB7IGNvbG9yOiAncmdiKDAsMjU1LDApJyB9LFxuICogICAgICAgdG86IHsgY29sb3I6ICdyZ2IoMjU1LDAsMjU1KScgfSxcbiAqICAgICAgIHN0ZXA6IGZ1bmN0aW9uIChzdGF0ZSkge1xuICogICAgICAgICBjb25zb2xlLmxvZyhzdGF0ZS5jb2xvcik7XG4gKiAgICAgICB9XG4gKiAgICAgfSk7XG4gKlxuICogVGhlIGFib3ZlIHNuaXBwZXQgd2lsbCBsb2cgc29tZXRoaW5nIGxpa2UgdGhpczpcbiAqXG4gKiAgICAgcmdiKDg0LDE3MCw4NClcbiAqICAgICAuLi5cbiAqICAgICByZ2IoMTcwLDg0LDE3MClcbiAqICAgICAuLi5cbiAqICAgICByZ2IoMjU1LDAsMjU1KVxuICpcbiAqIFRoaXMgZXh0ZW5zaW9uIGFsc28gc3VwcG9ydHMgaGV4YWRlY2ltYWwgY29sb3JzLCBpbiBib3RoIGxvbmcgKGAjZmYwMGZmYClcbiAqIGFuZCBzaG9ydCAoYCNmMGZgKSBmb3Jtcy4gIEJlIGF3YXJlIHRoYXQgaGV4YWRlY2ltYWwgaW5wdXQgdmFsdWVzIHdpbGwgYmVcbiAqIGNvbnZlcnRlZCBpbnRvIHRoZSBlcXVpdmFsZW50IFJHQiBvdXRwdXQgdmFsdWVzLiAgVGhpcyBpcyBkb25lIHRvIG9wdGltaXplXG4gKiBmb3IgcGVyZm9ybWFuY2UuXG4gKlxuICogICAgIHZhciB0d2VlbmFibGUgPSBuZXcgVHdlZW5hYmxlKCk7XG4gKiAgICAgdHdlZW5hYmxlLnR3ZWVuKHtcbiAqICAgICAgIGZyb206IHsgY29sb3I6ICcjMGYwJyB9LFxuICogICAgICAgdG86IHsgY29sb3I6ICcjZjBmJyB9LFxuICogICAgICAgc3RlcDogZnVuY3Rpb24gKHN0YXRlKSB7XG4gKiAgICAgICAgIGNvbnNvbGUubG9nKHN0YXRlLmNvbG9yKTtcbiAqICAgICAgIH1cbiAqICAgICB9KTtcbiAqXG4gKiBUaGlzIHNuaXBwZXQgd2lsbCBnZW5lcmF0ZSB0aGUgc2FtZSBvdXRwdXQgYXMgdGhlIG9uZSBiZWZvcmUgaXQgYmVjYXVzZVxuICogZXF1aXZhbGVudCB2YWx1ZXMgd2VyZSBzdXBwbGllZCAoanVzdCBpbiBoZXhhZGVjaW1hbCBmb3JtIHJhdGhlciB0aGFuIFJHQik6XG4gKlxuICogICAgIHJnYig4NCwxNzAsODQpXG4gKiAgICAgLi4uXG4gKiAgICAgcmdiKDE3MCw4NCwxNzApXG4gKiAgICAgLi4uXG4gKiAgICAgcmdiKDI1NSwwLDI1NSlcbiAqXG4gKiAjIyBFYXNpbmcgc3VwcG9ydFxuICpcbiAqIEVhc2luZyB3b3JrcyBzb21ld2hhdCBkaWZmZXJlbnRseSBpbiB0aGUgVG9rZW4gZXh0ZW5zaW9uLiAgVGhpcyBpcyBiZWNhdXNlXG4gKiBzb21lIENTUyBwcm9wZXJ0aWVzIGhhdmUgbXVsdGlwbGUgdmFsdWVzIGluIHRoZW0sIGFuZCB5b3UgbWlnaHQgbmVlZCB0b1xuICogdHdlZW4gZWFjaCB2YWx1ZSBhbG9uZyBpdHMgb3duIGVhc2luZyBjdXJ2ZS4gIEEgYmFzaWMgZXhhbXBsZTpcbiAqXG4gKiAgICAgdmFyIHR3ZWVuYWJsZSA9IG5ldyBUd2VlbmFibGUoKTtcbiAqICAgICB0d2VlbmFibGUudHdlZW4oe1xuICogICAgICAgZnJvbTogeyB0cmFuc2Zvcm06ICd0cmFuc2xhdGVYKDBweCkgdHJhbnNsYXRlWSgwcHgpJyB9LFxuICogICAgICAgdG86IHsgdHJhbnNmb3JtOiAgICd0cmFuc2xhdGVYKDEwMHB4KSB0cmFuc2xhdGVZKDEwMHB4KScgfSxcbiAqICAgICAgIGVhc2luZzogeyB0cmFuc2Zvcm06ICdlYXNlSW5RdWFkJyB9LFxuICogICAgICAgc3RlcDogZnVuY3Rpb24gKHN0YXRlKSB7XG4gKiAgICAgICAgIGNvbnNvbGUubG9nKHN0YXRlLnRyYW5zZm9ybSk7XG4gKiAgICAgICB9XG4gKiAgICAgfSk7XG4gKlxuICogVGhlIGFib3ZlIHNuaXBwZXQgd2lsbCBjcmVhdGUgdmFsdWVzIGxpa2UgdGhpczpcbiAqXG4gKiAgICAgdHJhbnNsYXRlWCgxMS41NnB4KSB0cmFuc2xhdGVZKDExLjU2cHgpXG4gKiAgICAgLi4uXG4gKiAgICAgdHJhbnNsYXRlWCg0Ni4yNHB4KSB0cmFuc2xhdGVZKDQ2LjI0cHgpXG4gKiAgICAgLi4uXG4gKiAgICAgdHJhbnNsYXRlWCgxMDBweCkgdHJhbnNsYXRlWSgxMDBweClcbiAqXG4gKiBJbiB0aGlzIGNhc2UsIHRoZSB2YWx1ZXMgZm9yIGB0cmFuc2xhdGVYYCBhbmQgYHRyYW5zbGF0ZVlgIGFyZSBhbHdheXMgdGhlXG4gKiBzYW1lIGZvciBlYWNoIHN0ZXAgb2YgdGhlIHR3ZWVuLCBiZWNhdXNlIHRoZXkgaGF2ZSB0aGUgc2FtZSBzdGFydCBhbmQgZW5kXG4gKiBwb2ludHMgYW5kIGJvdGggdXNlIHRoZSBzYW1lIGVhc2luZyBjdXJ2ZS4gIFdlIGNhbiBhbHNvIHR3ZWVuIGB0cmFuc2xhdGVYYFxuICogYW5kIGB0cmFuc2xhdGVZYCBhbG9uZyBpbmRlcGVuZGVudCBjdXJ2ZXM6XG4gKlxuICogICAgIHZhciB0d2VlbmFibGUgPSBuZXcgVHdlZW5hYmxlKCk7XG4gKiAgICAgdHdlZW5hYmxlLnR3ZWVuKHtcbiAqICAgICAgIGZyb206IHsgdHJhbnNmb3JtOiAndHJhbnNsYXRlWCgwcHgpIHRyYW5zbGF0ZVkoMHB4KScgfSxcbiAqICAgICAgIHRvOiB7IHRyYW5zZm9ybTogICAndHJhbnNsYXRlWCgxMDBweCkgdHJhbnNsYXRlWSgxMDBweCknIH0sXG4gKiAgICAgICBlYXNpbmc6IHsgdHJhbnNmb3JtOiAnZWFzZUluUXVhZCBib3VuY2UnIH0sXG4gKiAgICAgICBzdGVwOiBmdW5jdGlvbiAoc3RhdGUpIHtcbiAqICAgICAgICAgY29uc29sZS5sb2coc3RhdGUudHJhbnNmb3JtKTtcbiAqICAgICAgIH1cbiAqICAgICB9KTtcbiAqXG4gKiBUaGUgYWJvdmUgc25pcHBldCB3aWxsIGNyZWF0ZSB2YWx1ZXMgbGlrZSB0aGlzOlxuICpcbiAqICAgICB0cmFuc2xhdGVYKDEwLjg5cHgpIHRyYW5zbGF0ZVkoODIuMzVweClcbiAqICAgICAuLi5cbiAqICAgICB0cmFuc2xhdGVYKDQ0Ljg5cHgpIHRyYW5zbGF0ZVkoODYuNzNweClcbiAqICAgICAuLi5cbiAqICAgICB0cmFuc2xhdGVYKDEwMHB4KSB0cmFuc2xhdGVZKDEwMHB4KVxuICpcbiAqIGB0cmFuc2xhdGVYYCBhbmQgYHRyYW5zbGF0ZVlgIGFyZSBub3QgaW4gc3luYyBhbnltb3JlLCBiZWNhdXNlIGBlYXNlSW5RdWFkYFxuICogd2FzIHNwZWNpZmllZCBmb3IgYHRyYW5zbGF0ZVhgIGFuZCBgYm91bmNlYCBmb3IgYHRyYW5zbGF0ZVlgLiAgTWl4aW5nIGFuZFxuICogbWF0Y2hpbmcgZWFzaW5nIGN1cnZlcyBjYW4gbWFrZSBmb3Igc29tZSBpbnRlcmVzdGluZyBtb3Rpb24gaW4geW91clxuICogYW5pbWF0aW9ucy5cbiAqXG4gKiBUaGUgb3JkZXIgb2YgdGhlIHNwYWNlLXNlcGFyYXRlZCBlYXNpbmcgY3VydmVzIGNvcnJlc3BvbmQgdGhlIHRva2VuIHZhbHVlc1xuICogdGhleSBhcHBseSB0by4gIElmIHRoZXJlIGFyZSBtb3JlIHRva2VuIHZhbHVlcyB0aGFuIGVhc2luZyBjdXJ2ZXMgbGlzdGVkLFxuICogdGhlIGxhc3QgZWFzaW5nIGN1cnZlIGxpc3RlZCBpcyB1c2VkLlxuICogQHN1Ym1vZHVsZSBUd2VlbmFibGUudG9rZW5cbiAqL1xuXG4vLyB0b2tlbiBmdW5jdGlvbiBpcyBkZWZpbmVkIGFib3ZlIG9ubHkgc28gdGhhdCBkb3gtZm91bmRhdGlvbiBzZWVzIGl0IGFzXG4vLyBkb2N1bWVudGF0aW9uIGFuZCByZW5kZXJzIGl0LiAgSXQgaXMgbmV2ZXIgdXNlZCwgYW5kIGlzIG9wdGltaXplZCBhd2F5IGF0XG4vLyBidWlsZCB0aW1lLlxuXG47KGZ1bmN0aW9uIChUd2VlbmFibGUpIHtcblxuICAvKipcbiAgICogQHR5cGVkZWYge3tcbiAgICogICBmb3JtYXRTdHJpbmc6IHN0cmluZ1xuICAgKiAgIGNodW5rTmFtZXM6IEFycmF5LjxzdHJpbmc+XG4gICAqIH19XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICB2YXIgZm9ybWF0TWFuaWZlc3Q7XG5cbiAgLy8gQ09OU1RBTlRTXG5cbiAgdmFyIFJfTlVNQkVSX0NPTVBPTkVOVCA9IC8oXFxkfFxcLXxcXC4pLztcbiAgdmFyIFJfRk9STUFUX0NIVU5LUyA9IC8oW15cXC0wLTlcXC5dKykvZztcbiAgdmFyIFJfVU5GT1JNQVRURURfVkFMVUVTID0gL1swLTkuXFwtXSsvZztcbiAgdmFyIFJfUkdCID0gbmV3IFJlZ0V4cChcbiAgICAncmdiXFxcXCgnICsgUl9VTkZPUk1BVFRFRF9WQUxVRVMuc291cmNlICtcbiAgICAoLyxcXHMqLy5zb3VyY2UpICsgUl9VTkZPUk1BVFRFRF9WQUxVRVMuc291cmNlICtcbiAgICAoLyxcXHMqLy5zb3VyY2UpICsgUl9VTkZPUk1BVFRFRF9WQUxVRVMuc291cmNlICsgJ1xcXFwpJywgJ2cnKTtcbiAgdmFyIFJfUkdCX1BSRUZJWCA9IC9eLipcXCgvO1xuICB2YXIgUl9IRVggPSAvIyhbMC05XXxbYS1mXSl7Myw2fS9naTtcbiAgdmFyIFZBTFVFX1BMQUNFSE9MREVSID0gJ1ZBTCc7XG5cbiAgLy8gSEVMUEVSU1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0FycmF5Lm51bWJlcn0gcmF3VmFsdWVzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcmVmaXhcbiAgICpcbiAgICogQHJldHVybiB7QXJyYXkuPHN0cmluZz59XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBnZXRGb3JtYXRDaHVua3NGcm9tIChyYXdWYWx1ZXMsIHByZWZpeCkge1xuICAgIHZhciBhY2N1bXVsYXRvciA9IFtdO1xuXG4gICAgdmFyIHJhd1ZhbHVlc0xlbmd0aCA9IHJhd1ZhbHVlcy5sZW5ndGg7XG4gICAgdmFyIGk7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgcmF3VmFsdWVzTGVuZ3RoOyBpKyspIHtcbiAgICAgIGFjY3VtdWxhdG9yLnB1c2goJ18nICsgcHJlZml4ICsgJ18nICsgaSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFjY3VtdWxhdG9yO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmb3JtYXR0ZWRTdHJpbmdcbiAgICpcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0Rm9ybWF0U3RyaW5nRnJvbSAoZm9ybWF0dGVkU3RyaW5nKSB7XG4gICAgdmFyIGNodW5rcyA9IGZvcm1hdHRlZFN0cmluZy5tYXRjaChSX0ZPUk1BVF9DSFVOS1MpO1xuXG4gICAgaWYgKCFjaHVua3MpIHtcbiAgICAgIC8vIGNodW5rcyB3aWxsIGJlIG51bGwgaWYgdGhlcmUgd2VyZSBubyB0b2tlbnMgdG8gcGFyc2UgaW5cbiAgICAgIC8vIGZvcm1hdHRlZFN0cmluZyAoZm9yIGV4YW1wbGUsIGlmIGZvcm1hdHRlZFN0cmluZyBpcyAnMicpLiAgQ29lcmNlXG4gICAgICAvLyBjaHVua3MgdG8gYmUgdXNlZnVsIGhlcmUuXG4gICAgICBjaHVua3MgPSBbJycsICcnXTtcblxuICAgICAgLy8gSWYgdGhlcmUgaXMgb25seSBvbmUgY2h1bmssIGFzc3VtZSB0aGF0IHRoZSBzdHJpbmcgaXMgYSBudW1iZXJcbiAgICAgIC8vIGZvbGxvd2VkIGJ5IGEgdG9rZW4uLi5cbiAgICAgIC8vIE5PVEU6IFRoaXMgbWF5IGJlIGFuIHVud2lzZSBhc3N1bXB0aW9uLlxuICAgIH0gZWxzZSBpZiAoY2h1bmtzLmxlbmd0aCA9PT0gMSB8fFxuICAgICAgLy8gLi4ub3IgaWYgdGhlIHN0cmluZyBzdGFydHMgd2l0aCBhIG51bWJlciBjb21wb25lbnQgKFwiLlwiLCBcIi1cIiwgb3IgYVxuICAgICAgLy8gZGlnaXQpLi4uXG4gICAgZm9ybWF0dGVkU3RyaW5nLmNoYXJBdCgwKS5tYXRjaChSX05VTUJFUl9DT01QT05FTlQpKSB7XG4gICAgICAvLyAuLi5wcmVwZW5kIGFuIGVtcHR5IHN0cmluZyBoZXJlIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBmb3JtYXR0ZWQgbnVtYmVyXG4gICAgICAvLyBpcyBwcm9wZXJseSByZXBsYWNlZCBieSBWQUxVRV9QTEFDRUhPTERFUlxuICAgICAgY2h1bmtzLnVuc2hpZnQoJycpO1xuICAgIH1cblxuICAgIHJldHVybiBjaHVua3Muam9pbihWQUxVRV9QTEFDRUhPTERFUik7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydCBhbGwgaGV4IGNvbG9yIHZhbHVlcyB3aXRoaW4gYSBzdHJpbmcgdG8gYW4gcmdiIHN0cmluZy5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0YXRlT2JqZWN0XG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gVGhlIG1vZGlmaWVkIG9ialxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gc2FuaXRpemVPYmplY3RGb3JIZXhQcm9wcyAoc3RhdGVPYmplY3QpIHtcbiAgICBUd2VlbmFibGUuZWFjaChzdGF0ZU9iamVjdCwgZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgIHZhciBjdXJyZW50UHJvcCA9IHN0YXRlT2JqZWN0W3Byb3BdO1xuXG4gICAgICBpZiAodHlwZW9mIGN1cnJlbnRQcm9wID09PSAnc3RyaW5nJyAmJiBjdXJyZW50UHJvcC5tYXRjaChSX0hFWCkpIHtcbiAgICAgICAgc3RhdGVPYmplY3RbcHJvcF0gPSBzYW5pdGl6ZUhleENodW5rc1RvUkdCKGN1cnJlbnRQcm9wKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gICAqXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uICBzYW5pdGl6ZUhleENodW5rc1RvUkdCIChzdHIpIHtcbiAgICByZXR1cm4gZmlsdGVyU3RyaW5nQ2h1bmtzKFJfSEVYLCBzdHIsIGNvbnZlcnRIZXhUb1JHQik7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGhleFN0cmluZ1xuICAgKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBjb252ZXJ0SGV4VG9SR0IgKGhleFN0cmluZykge1xuICAgIHZhciByZ2JBcnIgPSBoZXhUb1JHQkFycmF5KGhleFN0cmluZyk7XG4gICAgcmV0dXJuICdyZ2IoJyArIHJnYkFyclswXSArICcsJyArIHJnYkFyclsxXSArICcsJyArIHJnYkFyclsyXSArICcpJztcbiAgfVxuXG4gIHZhciBoZXhUb1JHQkFycmF5X3JldHVybkFycmF5ID0gW107XG4gIC8qKlxuICAgKiBDb252ZXJ0IGEgaGV4YWRlY2ltYWwgc3RyaW5nIHRvIGFuIGFycmF5IHdpdGggdGhyZWUgaXRlbXMsIG9uZSBlYWNoIGZvclxuICAgKiB0aGUgcmVkLCBibHVlLCBhbmQgZ3JlZW4gZGVjaW1hbCB2YWx1ZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBoZXggQSBoZXhhZGVjaW1hbCBzdHJpbmcuXG4gICAqXG4gICAqIEByZXR1cm5zIHtBcnJheS48bnVtYmVyPn0gVGhlIGNvbnZlcnRlZCBBcnJheSBvZiBSR0IgdmFsdWVzIGlmIGBoZXhgIGlzIGFcbiAgICogdmFsaWQgc3RyaW5nLCBvciBhbiBBcnJheSBvZiB0aHJlZSAwJ3MuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBoZXhUb1JHQkFycmF5IChoZXgpIHtcblxuICAgIGhleCA9IGhleC5yZXBsYWNlKC8jLywgJycpO1xuXG4gICAgLy8gSWYgdGhlIHN0cmluZyBpcyBhIHNob3J0aGFuZCB0aHJlZSBkaWdpdCBoZXggbm90YXRpb24sIG5vcm1hbGl6ZSBpdCB0b1xuICAgIC8vIHRoZSBzdGFuZGFyZCBzaXggZGlnaXQgbm90YXRpb25cbiAgICBpZiAoaGV4Lmxlbmd0aCA9PT0gMykge1xuICAgICAgaGV4ID0gaGV4LnNwbGl0KCcnKTtcbiAgICAgIGhleCA9IGhleFswXSArIGhleFswXSArIGhleFsxXSArIGhleFsxXSArIGhleFsyXSArIGhleFsyXTtcbiAgICB9XG5cbiAgICBoZXhUb1JHQkFycmF5X3JldHVybkFycmF5WzBdID0gaGV4VG9EZWMoaGV4LnN1YnN0cigwLCAyKSk7XG4gICAgaGV4VG9SR0JBcnJheV9yZXR1cm5BcnJheVsxXSA9IGhleFRvRGVjKGhleC5zdWJzdHIoMiwgMikpO1xuICAgIGhleFRvUkdCQXJyYXlfcmV0dXJuQXJyYXlbMl0gPSBoZXhUb0RlYyhoZXguc3Vic3RyKDQsIDIpKTtcblxuICAgIHJldHVybiBoZXhUb1JHQkFycmF5X3JldHVybkFycmF5O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgYSBiYXNlLTE2IG51bWJlciB0byBiYXNlLTEwLlxuICAgKlxuICAgKiBAcGFyYW0ge051bWJlcnxTdHJpbmd9IGhleCBUaGUgdmFsdWUgdG8gY29udmVydFxuICAgKlxuICAgKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgYmFzZS0xMCBlcXVpdmFsZW50IG9mIGBoZXhgLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gaGV4VG9EZWMgKGhleCkge1xuICAgIHJldHVybiBwYXJzZUludChoZXgsIDE2KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW5zIGEgZmlsdGVyIG9wZXJhdGlvbiBvbiBhbGwgY2h1bmtzIG9mIGEgc3RyaW5nIHRoYXQgbWF0Y2ggYSBSZWdFeHBcbiAgICpcbiAgICogQHBhcmFtIHtSZWdFeHB9IHBhdHRlcm5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHVuZmlsdGVyZWRTdHJpbmdcbiAgICogQHBhcmFtIHtmdW5jdGlvbihzdHJpbmcpfSBmaWx0ZXJcbiAgICpcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gZmlsdGVyU3RyaW5nQ2h1bmtzIChwYXR0ZXJuLCB1bmZpbHRlcmVkU3RyaW5nLCBmaWx0ZXIpIHtcbiAgICB2YXIgcGF0dGVuTWF0Y2hlcyA9IHVuZmlsdGVyZWRTdHJpbmcubWF0Y2gocGF0dGVybik7XG4gICAgdmFyIGZpbHRlcmVkU3RyaW5nID0gdW5maWx0ZXJlZFN0cmluZy5yZXBsYWNlKHBhdHRlcm4sIFZBTFVFX1BMQUNFSE9MREVSKTtcblxuICAgIGlmIChwYXR0ZW5NYXRjaGVzKSB7XG4gICAgICB2YXIgcGF0dGVuTWF0Y2hlc0xlbmd0aCA9IHBhdHRlbk1hdGNoZXMubGVuZ3RoO1xuICAgICAgdmFyIGN1cnJlbnRDaHVuaztcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXR0ZW5NYXRjaGVzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY3VycmVudENodW5rID0gcGF0dGVuTWF0Y2hlcy5zaGlmdCgpO1xuICAgICAgICBmaWx0ZXJlZFN0cmluZyA9IGZpbHRlcmVkU3RyaW5nLnJlcGxhY2UoXG4gICAgICAgICAgVkFMVUVfUExBQ0VIT0xERVIsIGZpbHRlcihjdXJyZW50Q2h1bmspKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmlsdGVyZWRTdHJpbmc7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgZm9yIGZsb2F0aW5nIHBvaW50IHZhbHVlcyB3aXRoaW4gcmdiIHN0cmluZ3MgYW5kIHJvdW5kcyB0aGVtLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZm9ybWF0dGVkU3RyaW5nXG4gICAqXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIHNhbml0aXplUkdCQ2h1bmtzIChmb3JtYXR0ZWRTdHJpbmcpIHtcbiAgICByZXR1cm4gZmlsdGVyU3RyaW5nQ2h1bmtzKFJfUkdCLCBmb3JtYXR0ZWRTdHJpbmcsIHNhbml0aXplUkdCQ2h1bmspO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZ2JDaHVua1xuICAgKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBzYW5pdGl6ZVJHQkNodW5rIChyZ2JDaHVuaykge1xuICAgIHZhciBudW1iZXJzID0gcmdiQ2h1bmsubWF0Y2goUl9VTkZPUk1BVFRFRF9WQUxVRVMpO1xuICAgIHZhciBudW1iZXJzTGVuZ3RoID0gbnVtYmVycy5sZW5ndGg7XG4gICAgdmFyIHNhbml0aXplZFN0cmluZyA9IHJnYkNodW5rLm1hdGNoKFJfUkdCX1BSRUZJWClbMF07XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bWJlcnNMZW5ndGg7IGkrKykge1xuICAgICAgc2FuaXRpemVkU3RyaW5nICs9IHBhcnNlSW50KG51bWJlcnNbaV0sIDEwKSArICcsJztcbiAgICB9XG5cbiAgICBzYW5pdGl6ZWRTdHJpbmcgPSBzYW5pdGl6ZWRTdHJpbmcuc2xpY2UoMCwgLTEpICsgJyknO1xuXG4gICAgcmV0dXJuIHNhbml0aXplZFN0cmluZztcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGVPYmplY3RcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBBbiBPYmplY3Qgb2YgZm9ybWF0TWFuaWZlc3RzIHRoYXQgY29ycmVzcG9uZCB0b1xuICAgKiB0aGUgc3RyaW5nIHByb3BlcnRpZXMgb2Ygc3RhdGVPYmplY3RcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIGdldEZvcm1hdE1hbmlmZXN0cyAoc3RhdGVPYmplY3QpIHtcbiAgICB2YXIgbWFuaWZlc3RBY2N1bXVsYXRvciA9IHt9O1xuXG4gICAgVHdlZW5hYmxlLmVhY2goc3RhdGVPYmplY3QsIGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgICB2YXIgY3VycmVudFByb3AgPSBzdGF0ZU9iamVjdFtwcm9wXTtcblxuICAgICAgaWYgKHR5cGVvZiBjdXJyZW50UHJvcCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdmFyIHJhd1ZhbHVlcyA9IGdldFZhbHVlc0Zyb20oY3VycmVudFByb3ApO1xuXG4gICAgICAgIG1hbmlmZXN0QWNjdW11bGF0b3JbcHJvcF0gPSB7XG4gICAgICAgICAgJ2Zvcm1hdFN0cmluZyc6IGdldEZvcm1hdFN0cmluZ0Zyb20oY3VycmVudFByb3ApXG4gICAgICAgICAgLCdjaHVua05hbWVzJzogZ2V0Rm9ybWF0Q2h1bmtzRnJvbShyYXdWYWx1ZXMsIHByb3ApXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbWFuaWZlc3RBY2N1bXVsYXRvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGVPYmplY3RcbiAgICogQHBhcmFtIHtPYmplY3R9IGZvcm1hdE1hbmlmZXN0c1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gZXhwYW5kRm9ybWF0dGVkUHJvcGVydGllcyAoc3RhdGVPYmplY3QsIGZvcm1hdE1hbmlmZXN0cykge1xuICAgIFR3ZWVuYWJsZS5lYWNoKGZvcm1hdE1hbmlmZXN0cywgZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgIHZhciBjdXJyZW50UHJvcCA9IHN0YXRlT2JqZWN0W3Byb3BdO1xuICAgICAgdmFyIHJhd1ZhbHVlcyA9IGdldFZhbHVlc0Zyb20oY3VycmVudFByb3ApO1xuICAgICAgdmFyIHJhd1ZhbHVlc0xlbmd0aCA9IHJhd1ZhbHVlcy5sZW5ndGg7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmF3VmFsdWVzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc3RhdGVPYmplY3RbZm9ybWF0TWFuaWZlc3RzW3Byb3BdLmNodW5rTmFtZXNbaV1dID0gK3Jhd1ZhbHVlc1tpXTtcbiAgICAgIH1cblxuICAgICAgZGVsZXRlIHN0YXRlT2JqZWN0W3Byb3BdO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZU9iamVjdFxuICAgKiBAcGFyYW0ge09iamVjdH0gZm9ybWF0TWFuaWZlc3RzXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBjb2xsYXBzZUZvcm1hdHRlZFByb3BlcnRpZXMgKHN0YXRlT2JqZWN0LCBmb3JtYXRNYW5pZmVzdHMpIHtcbiAgICBUd2VlbmFibGUuZWFjaChmb3JtYXRNYW5pZmVzdHMsIGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgICB2YXIgY3VycmVudFByb3AgPSBzdGF0ZU9iamVjdFtwcm9wXTtcbiAgICAgIHZhciBmb3JtYXRDaHVua3MgPSBleHRyYWN0UHJvcGVydHlDaHVua3MoXG4gICAgICAgIHN0YXRlT2JqZWN0LCBmb3JtYXRNYW5pZmVzdHNbcHJvcF0uY2h1bmtOYW1lcyk7XG4gICAgICB2YXIgdmFsdWVzTGlzdCA9IGdldFZhbHVlc0xpc3QoXG4gICAgICAgIGZvcm1hdENodW5rcywgZm9ybWF0TWFuaWZlc3RzW3Byb3BdLmNodW5rTmFtZXMpO1xuICAgICAgY3VycmVudFByb3AgPSBnZXRGb3JtYXR0ZWRWYWx1ZXMoXG4gICAgICAgIGZvcm1hdE1hbmlmZXN0c1twcm9wXS5mb3JtYXRTdHJpbmcsIHZhbHVlc0xpc3QpO1xuICAgICAgc3RhdGVPYmplY3RbcHJvcF0gPSBzYW5pdGl6ZVJHQkNodW5rcyhjdXJyZW50UHJvcCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0YXRlT2JqZWN0XG4gICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGNodW5rTmFtZXNcbiAgICpcbiAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgZXh0cmFjdGVkIHZhbHVlIGNodW5rcy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIGV4dHJhY3RQcm9wZXJ0eUNodW5rcyAoc3RhdGVPYmplY3QsIGNodW5rTmFtZXMpIHtcbiAgICB2YXIgZXh0cmFjdGVkVmFsdWVzID0ge307XG4gICAgdmFyIGN1cnJlbnRDaHVua05hbWUsIGNodW5rTmFtZXNMZW5ndGggPSBjaHVua05hbWVzLmxlbmd0aDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2h1bmtOYW1lc0xlbmd0aDsgaSsrKSB7XG4gICAgICBjdXJyZW50Q2h1bmtOYW1lID0gY2h1bmtOYW1lc1tpXTtcbiAgICAgIGV4dHJhY3RlZFZhbHVlc1tjdXJyZW50Q2h1bmtOYW1lXSA9IHN0YXRlT2JqZWN0W2N1cnJlbnRDaHVua05hbWVdO1xuICAgICAgZGVsZXRlIHN0YXRlT2JqZWN0W2N1cnJlbnRDaHVua05hbWVdO1xuICAgIH1cblxuICAgIHJldHVybiBleHRyYWN0ZWRWYWx1ZXM7XG4gIH1cblxuICB2YXIgZ2V0VmFsdWVzTGlzdF9hY2N1bXVsYXRvciA9IFtdO1xuICAvKipcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0YXRlT2JqZWN0XG4gICAqIEBwYXJhbSB7QXJyYXkuPHN0cmluZz59IGNodW5rTmFtZXNcbiAgICpcbiAgICogQHJldHVybiB7QXJyYXkuPG51bWJlcj59XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBnZXRWYWx1ZXNMaXN0IChzdGF0ZU9iamVjdCwgY2h1bmtOYW1lcykge1xuICAgIGdldFZhbHVlc0xpc3RfYWNjdW11bGF0b3IubGVuZ3RoID0gMDtcbiAgICB2YXIgY2h1bmtOYW1lc0xlbmd0aCA9IGNodW5rTmFtZXMubGVuZ3RoO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaHVua05hbWVzTGVuZ3RoOyBpKyspIHtcbiAgICAgIGdldFZhbHVlc0xpc3RfYWNjdW11bGF0b3IucHVzaChzdGF0ZU9iamVjdFtjaHVua05hbWVzW2ldXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGdldFZhbHVlc0xpc3RfYWNjdW11bGF0b3I7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZvcm1hdFN0cmluZ1xuICAgKiBAcGFyYW0ge0FycmF5LjxudW1iZXI+fSByYXdWYWx1ZXNcbiAgICpcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0Rm9ybWF0dGVkVmFsdWVzIChmb3JtYXRTdHJpbmcsIHJhd1ZhbHVlcykge1xuICAgIHZhciBmb3JtYXR0ZWRWYWx1ZVN0cmluZyA9IGZvcm1hdFN0cmluZztcbiAgICB2YXIgcmF3VmFsdWVzTGVuZ3RoID0gcmF3VmFsdWVzLmxlbmd0aDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmF3VmFsdWVzTGVuZ3RoOyBpKyspIHtcbiAgICAgIGZvcm1hdHRlZFZhbHVlU3RyaW5nID0gZm9ybWF0dGVkVmFsdWVTdHJpbmcucmVwbGFjZShcbiAgICAgICAgVkFMVUVfUExBQ0VIT0xERVIsICtyYXdWYWx1ZXNbaV0udG9GaXhlZCg0KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZvcm1hdHRlZFZhbHVlU3RyaW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIE5vdGU6IEl0J3MgdGhlIGR1dHkgb2YgdGhlIGNhbGxlciB0byBjb252ZXJ0IHRoZSBBcnJheSBlbGVtZW50cyBvZiB0aGVcbiAgICogcmV0dXJuIHZhbHVlIGludG8gbnVtYmVycy4gIFRoaXMgaXMgYSBwZXJmb3JtYW5jZSBvcHRpbWl6YXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmb3JtYXR0ZWRTdHJpbmdcbiAgICpcbiAgICogQHJldHVybiB7QXJyYXkuPHN0cmluZz58bnVsbH1cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIGdldFZhbHVlc0Zyb20gKGZvcm1hdHRlZFN0cmluZykge1xuICAgIHJldHVybiBmb3JtYXR0ZWRTdHJpbmcubWF0Y2goUl9VTkZPUk1BVFRFRF9WQUxVRVMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlYXNpbmdPYmplY3RcbiAgICogQHBhcmFtIHtPYmplY3R9IHRva2VuRGF0YVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gZXhwYW5kRWFzaW5nT2JqZWN0IChlYXNpbmdPYmplY3QsIHRva2VuRGF0YSkge1xuICAgIFR3ZWVuYWJsZS5lYWNoKHRva2VuRGF0YSwgZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgIHZhciBjdXJyZW50UHJvcCA9IHRva2VuRGF0YVtwcm9wXTtcbiAgICAgIHZhciBjaHVua05hbWVzID0gY3VycmVudFByb3AuY2h1bmtOYW1lcztcbiAgICAgIHZhciBjaHVua0xlbmd0aCA9IGNodW5rTmFtZXMubGVuZ3RoO1xuXG4gICAgICB2YXIgZWFzaW5nID0gZWFzaW5nT2JqZWN0W3Byb3BdO1xuICAgICAgdmFyIGk7XG5cbiAgICAgIGlmICh0eXBlb2YgZWFzaW5nID09PSAnc3RyaW5nJykge1xuICAgICAgICB2YXIgZWFzaW5nQ2h1bmtzID0gZWFzaW5nLnNwbGl0KCcgJyk7XG4gICAgICAgIHZhciBsYXN0RWFzaW5nQ2h1bmsgPSBlYXNpbmdDaHVua3NbZWFzaW5nQ2h1bmtzLmxlbmd0aCAtIDFdO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjaHVua0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgZWFzaW5nT2JqZWN0W2NodW5rTmFtZXNbaV1dID0gZWFzaW5nQ2h1bmtzW2ldIHx8IGxhc3RFYXNpbmdDaHVuaztcbiAgICAgICAgfVxuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2h1bmtMZW5ndGg7IGkrKykge1xuICAgICAgICAgIGVhc2luZ09iamVjdFtjaHVua05hbWVzW2ldXSA9IGVhc2luZztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBkZWxldGUgZWFzaW5nT2JqZWN0W3Byb3BdO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlYXNpbmdPYmplY3RcbiAgICogQHBhcmFtIHtPYmplY3R9IHRva2VuRGF0YVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gY29sbGFwc2VFYXNpbmdPYmplY3QgKGVhc2luZ09iamVjdCwgdG9rZW5EYXRhKSB7XG4gICAgVHdlZW5hYmxlLmVhY2godG9rZW5EYXRhLCBmdW5jdGlvbiAocHJvcCkge1xuICAgICAgdmFyIGN1cnJlbnRQcm9wID0gdG9rZW5EYXRhW3Byb3BdO1xuICAgICAgdmFyIGNodW5rTmFtZXMgPSBjdXJyZW50UHJvcC5jaHVua05hbWVzO1xuICAgICAgdmFyIGNodW5rTGVuZ3RoID0gY2h1bmtOYW1lcy5sZW5ndGg7XG5cbiAgICAgIHZhciBmaXJzdEVhc2luZyA9IGVhc2luZ09iamVjdFtjaHVua05hbWVzWzBdXTtcbiAgICAgIHZhciB0eXBlb2ZFYXNpbmdzID0gdHlwZW9mIGZpcnN0RWFzaW5nO1xuXG4gICAgICBpZiAodHlwZW9mRWFzaW5ncyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdmFyIGNvbXBvc2VkRWFzaW5nU3RyaW5nID0gJyc7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaHVua0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29tcG9zZWRFYXNpbmdTdHJpbmcgKz0gJyAnICsgZWFzaW5nT2JqZWN0W2NodW5rTmFtZXNbaV1dO1xuICAgICAgICAgIGRlbGV0ZSBlYXNpbmdPYmplY3RbY2h1bmtOYW1lc1tpXV07XG4gICAgICAgIH1cblxuICAgICAgICBlYXNpbmdPYmplY3RbcHJvcF0gPSBjb21wb3NlZEVhc2luZ1N0cmluZy5zdWJzdHIoMSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlYXNpbmdPYmplY3RbcHJvcF0gPSBmaXJzdEVhc2luZztcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIFR3ZWVuYWJsZS5wcm90b3R5cGUuZmlsdGVyLnRva2VuID0ge1xuICAgICd0d2VlbkNyZWF0ZWQnOiBmdW5jdGlvbiAoY3VycmVudFN0YXRlLCBmcm9tU3RhdGUsIHRvU3RhdGUsIGVhc2luZ09iamVjdCkge1xuICAgICAgc2FuaXRpemVPYmplY3RGb3JIZXhQcm9wcyhjdXJyZW50U3RhdGUpO1xuICAgICAgc2FuaXRpemVPYmplY3RGb3JIZXhQcm9wcyhmcm9tU3RhdGUpO1xuICAgICAgc2FuaXRpemVPYmplY3RGb3JIZXhQcm9wcyh0b1N0YXRlKTtcbiAgICAgIHRoaXMuX3Rva2VuRGF0YSA9IGdldEZvcm1hdE1hbmlmZXN0cyhjdXJyZW50U3RhdGUpO1xuICAgIH0sXG5cbiAgICAnYmVmb3JlVHdlZW4nOiBmdW5jdGlvbiAoY3VycmVudFN0YXRlLCBmcm9tU3RhdGUsIHRvU3RhdGUsIGVhc2luZ09iamVjdCkge1xuICAgICAgZXhwYW5kRWFzaW5nT2JqZWN0KGVhc2luZ09iamVjdCwgdGhpcy5fdG9rZW5EYXRhKTtcbiAgICAgIGV4cGFuZEZvcm1hdHRlZFByb3BlcnRpZXMoY3VycmVudFN0YXRlLCB0aGlzLl90b2tlbkRhdGEpO1xuICAgICAgZXhwYW5kRm9ybWF0dGVkUHJvcGVydGllcyhmcm9tU3RhdGUsIHRoaXMuX3Rva2VuRGF0YSk7XG4gICAgICBleHBhbmRGb3JtYXR0ZWRQcm9wZXJ0aWVzKHRvU3RhdGUsIHRoaXMuX3Rva2VuRGF0YSk7XG4gICAgfSxcblxuICAgICdhZnRlclR3ZWVuJzogZnVuY3Rpb24gKGN1cnJlbnRTdGF0ZSwgZnJvbVN0YXRlLCB0b1N0YXRlLCBlYXNpbmdPYmplY3QpIHtcbiAgICAgIGNvbGxhcHNlRm9ybWF0dGVkUHJvcGVydGllcyhjdXJyZW50U3RhdGUsIHRoaXMuX3Rva2VuRGF0YSk7XG4gICAgICBjb2xsYXBzZUZvcm1hdHRlZFByb3BlcnRpZXMoZnJvbVN0YXRlLCB0aGlzLl90b2tlbkRhdGEpO1xuICAgICAgY29sbGFwc2VGb3JtYXR0ZWRQcm9wZXJ0aWVzKHRvU3RhdGUsIHRoaXMuX3Rva2VuRGF0YSk7XG4gICAgICBjb2xsYXBzZUVhc2luZ09iamVjdChlYXNpbmdPYmplY3QsIHRoaXMuX3Rva2VuRGF0YSk7XG4gICAgfVxuICB9O1xuXG59IChUd2VlbmFibGUpKTtcblxufSkuY2FsbChudWxsKTtcbiIsIiFmdW5jdGlvbih0LGUpe1wib2JqZWN0XCI9PXR5cGVvZiBleHBvcnRzJiZcIm9iamVjdFwiPT10eXBlb2YgbW9kdWxlP21vZHVsZS5leHBvcnRzPWUoKTpcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQ/ZGVmaW5lKFtdLGUpOlwib2JqZWN0XCI9PXR5cGVvZiBleHBvcnRzP2V4cG9ydHMuU2Nyb2xsYmFyPWUoKTp0LlNjcm9sbGJhcj1lKCl9KHRoaXMsZnVuY3Rpb24oKXtyZXR1cm4gZnVuY3Rpb24odCl7ZnVuY3Rpb24gZShyKXtpZihuW3JdKXJldHVybiBuW3JdLmV4cG9ydHM7dmFyIG89bltyXT17ZXhwb3J0czp7fSxpZDpyLGxvYWRlZDohMX07cmV0dXJuIHRbcl0uY2FsbChvLmV4cG9ydHMsbyxvLmV4cG9ydHMsZSksby5sb2FkZWQ9ITAsby5leHBvcnRzfXZhciBuPXt9O3JldHVybiBlLm09dCxlLmM9bixlLnA9XCJcIixlKDApfShbZnVuY3Rpb24odCxlLG4pe3QuZXhwb3J0cz1uKDEpfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19ZnVuY3Rpb24gbyh0KXtpZihBcnJheS5pc0FycmF5KHQpKXtmb3IodmFyIGU9MCxuPUFycmF5KHQubGVuZ3RoKTtlPHQubGVuZ3RoO2UrKyluW2VdPXRbZV07cmV0dXJuIG59cmV0dXJuKDAsdS5kZWZhdWx0KSh0KX12YXIgaT1uKDIpLHU9cihpKSxhPW4oNTUpLGM9cihhKSxsPW4oNjIpLGY9cihsKTtPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KTt2YXIgcz1cImZ1bmN0aW9uXCI9PXR5cGVvZiBmLmRlZmF1bHQmJlwic3ltYm9sXCI9PXR5cGVvZiBjLmRlZmF1bHQ/ZnVuY3Rpb24odCl7cmV0dXJuIHR5cGVvZiB0fTpmdW5jdGlvbih0KXtyZXR1cm4gdCYmXCJmdW5jdGlvblwiPT10eXBlb2YgZi5kZWZhdWx0JiZ0LmNvbnN0cnVjdG9yPT09Zi5kZWZhdWx0JiZ0IT09Zi5kZWZhdWx0LnByb3RvdHlwZT9cInN5bWJvbFwiOnR5cGVvZiB0fSxkPW4oNzgpLGg9big4OSk7bigxMjkpLG4oMTQ1KSxuKDE1OCksbigxNzMpLG4oMTg3KSxlLmRlZmF1bHQ9ZC5TbW9vdGhTY3JvbGxiYXIsZC5TbW9vdGhTY3JvbGxiYXIudmVyc2lvbj1cIjcuNC4xXCIsZC5TbW9vdGhTY3JvbGxiYXIuaW5pdD1mdW5jdGlvbih0LGUpe2lmKCF0fHwxIT09dC5ub2RlVHlwZSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiZXhwZWN0IGVsZW1lbnQgdG8gYmUgRE9NIEVsZW1lbnQsIGJ1dCBnb3QgXCIrKFwidW5kZWZpbmVkXCI9PXR5cGVvZiB0P1widW5kZWZpbmVkXCI6cyh0KSkpO2lmKGguc2JMaXN0Lmhhcyh0KSlyZXR1cm4gaC5zYkxpc3QuZ2V0KHQpO3Quc2V0QXR0cmlidXRlKFwiZGF0YS1zY3JvbGxiYXJcIixcIlwiKTt2YXIgbj1bXS5jb25jYXQobyh0LmNoaWxkTm9kZXMpKSxyPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7ci5pbm5lckhUTUw9J1xcbiAgICAgICAgPGRpdiBjbGFzcz1cInNjcm9sbC1jb250ZW50XCI+PC9kaXY+XFxuICAgICAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsYmFyLXRyYWNrIHNjcm9sbGJhci10cmFjay14XCI+XFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNjcm9sbGJhci10aHVtYiBzY3JvbGxiYXItdGh1bWIteFwiPjwvZGl2PlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgICA8ZGl2IGNsYXNzPVwic2Nyb2xsYmFyLXRyYWNrIHNjcm9sbGJhci10cmFjay15XCI+XFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInNjcm9sbGJhci10aHVtYiBzY3JvbGxiYXItdGh1bWIteVwiPjwvZGl2PlxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgICA8Y2FudmFzIGNsYXNzPVwib3ZlcnNjcm9sbC1nbG93XCI+PC9jYW52YXM+XFxuICAgICc7dmFyIGk9ci5xdWVyeVNlbGVjdG9yKFwiLnNjcm9sbC1jb250ZW50XCIpO3JldHVybltdLmNvbmNhdChvKHIuY2hpbGROb2RlcykpLmZvckVhY2goZnVuY3Rpb24oZSl7cmV0dXJuIHQuYXBwZW5kQ2hpbGQoZSl9KSxuLmZvckVhY2goZnVuY3Rpb24odCl7cmV0dXJuIGkuYXBwZW5kQ2hpbGQodCl9KSxuZXcgZC5TbW9vdGhTY3JvbGxiYXIodCxlKX0sZC5TbW9vdGhTY3JvbGxiYXIuaW5pdEFsbD1mdW5jdGlvbih0KXtyZXR1cm5bXS5jb25jYXQobyhkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGguc2VsZWN0b3JzKSkpLm1hcChmdW5jdGlvbihlKXtyZXR1cm4gZC5TbW9vdGhTY3JvbGxiYXIuaW5pdChlLHQpfSl9LGQuU21vb3RoU2Nyb2xsYmFyLmhhcz1mdW5jdGlvbih0KXtyZXR1cm4gaC5zYkxpc3QuaGFzKHQpfSxkLlNtb290aFNjcm9sbGJhci5nZXQ9ZnVuY3Rpb24odCl7cmV0dXJuIGguc2JMaXN0LmdldCh0KX0sZC5TbW9vdGhTY3JvbGxiYXIuZ2V0QWxsPWZ1bmN0aW9uKCl7cmV0dXJuW10uY29uY2F0KG8oaC5zYkxpc3QudmFsdWVzKCkpKX0sZC5TbW9vdGhTY3JvbGxiYXIuZGVzdHJveT1mdW5jdGlvbih0LGUpe3JldHVybiBkLlNtb290aFNjcm9sbGJhci5oYXModCkmJmQuU21vb3RoU2Nyb2xsYmFyLmdldCh0KS5kZXN0cm95KGUpfSxkLlNtb290aFNjcm9sbGJhci5kZXN0cm95QWxsPWZ1bmN0aW9uKHQpe2guc2JMaXN0LmZvckVhY2goZnVuY3Rpb24oZSl7ZS5kZXN0cm95KHQpfSl9LHQuZXhwb3J0cz1lLmRlZmF1bHR9LGZ1bmN0aW9uKHQsZSxuKXt0LmV4cG9ydHM9e2RlZmF1bHQ6bigzKSxfX2VzTW9kdWxlOiEwfX0sZnVuY3Rpb24odCxlLG4pe24oNCksbig0OCksdC5leHBvcnRzPW4oMTIpLkFycmF5LmZyb219LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjt2YXIgcj1uKDUpKCEwKTtuKDgpKFN0cmluZyxcIlN0cmluZ1wiLGZ1bmN0aW9uKHQpe3RoaXMuX3Q9U3RyaW5nKHQpLHRoaXMuX2k9MH0sZnVuY3Rpb24oKXt2YXIgdCxlPXRoaXMuX3Qsbj10aGlzLl9pO3JldHVybiBuPj1lLmxlbmd0aD97dmFsdWU6dm9pZCAwLGRvbmU6ITB9Oih0PXIoZSxuKSx0aGlzLl9pKz10Lmxlbmd0aCx7dmFsdWU6dCxkb25lOiExfSl9KX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oNiksbz1uKDcpO3QuZXhwb3J0cz1mdW5jdGlvbih0KXtyZXR1cm4gZnVuY3Rpb24oZSxuKXt2YXIgaSx1LGE9U3RyaW5nKG8oZSkpLGM9cihuKSxsPWEubGVuZ3RoO3JldHVybiBjPDB8fGM+PWw/dD9cIlwiOnZvaWQgMDooaT1hLmNoYXJDb2RlQXQoYyksaTw1NTI5Nnx8aT41NjMxOXx8YysxPT09bHx8KHU9YS5jaGFyQ29kZUF0KGMrMSkpPDU2MzIwfHx1PjU3MzQzP3Q/YS5jaGFyQXQoYyk6aTp0P2Euc2xpY2UoYyxjKzIpOihpLTU1Mjk2PDwxMCkrKHUtNTYzMjApKzY1NTM2KX19fSxmdW5jdGlvbih0LGUpe3ZhciBuPU1hdGguY2VpbCxyPU1hdGguZmxvb3I7dC5leHBvcnRzPWZ1bmN0aW9uKHQpe3JldHVybiBpc05hTih0PSt0KT8wOih0PjA/cjpuKSh0KX19LGZ1bmN0aW9uKHQsZSl7dC5leHBvcnRzPWZ1bmN0aW9uKHQpe2lmKHZvaWQgMD09dCl0aHJvdyBUeXBlRXJyb3IoXCJDYW4ndCBjYWxsIG1ldGhvZCBvbiAgXCIrdCk7cmV0dXJuIHR9fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHI9big5KSxvPW4oMTApLGk9bigyNSksdT1uKDE1KSxhPW4oMjYpLGM9bigyNyksbD1uKDI4KSxmPW4oNDQpLHM9big0NiksZD1uKDQ1KShcIml0ZXJhdG9yXCIpLGg9IShbXS5rZXlzJiZcIm5leHRcImluW10ua2V5cygpKSx2PVwiQEBpdGVyYXRvclwiLF89XCJrZXlzXCIscD1cInZhbHVlc1wiLHk9ZnVuY3Rpb24oKXtyZXR1cm4gdGhpc307dC5leHBvcnRzPWZ1bmN0aW9uKHQsZSxuLGIsZyxtLHgpe2wobixlLGIpO3ZhciBTLEUsTSxPPWZ1bmN0aW9uKHQpe2lmKCFoJiZ0IGluIGopcmV0dXJuIGpbdF07c3dpdGNoKHQpe2Nhc2UgXzpyZXR1cm4gZnVuY3Rpb24oKXtyZXR1cm4gbmV3IG4odGhpcyx0KX07Y2FzZSBwOnJldHVybiBmdW5jdGlvbigpe3JldHVybiBuZXcgbih0aGlzLHQpfX1yZXR1cm4gZnVuY3Rpb24oKXtyZXR1cm4gbmV3IG4odGhpcyx0KX19LHc9ZStcIiBJdGVyYXRvclwiLFA9Zz09cCxrPSExLGo9dC5wcm90b3R5cGUsVD1qW2RdfHxqW3ZdfHxnJiZqW2ddLEE9VHx8TyhnKSxSPWc/UD9PKFwiZW50cmllc1wiKTpBOnZvaWQgMCxMPVwiQXJyYXlcIj09ZT9qLmVudHJpZXN8fFQ6VDtpZihMJiYoTT1zKEwuY2FsbChuZXcgdCkpLE0hPT1PYmplY3QucHJvdG90eXBlJiYoZihNLHcsITApLHJ8fGEoTSxkKXx8dShNLGQseSkpKSxQJiZUJiZULm5hbWUhPT1wJiYoaz0hMCxBPWZ1bmN0aW9uKCl7cmV0dXJuIFQuY2FsbCh0aGlzKX0pLHImJiF4fHwhaCYmIWsmJmpbZF18fHUoaixkLEEpLGNbZV09QSxjW3ddPXksZylpZihTPXt2YWx1ZXM6UD9BOk8ocCksa2V5czptP0E6TyhfKSxlbnRyaWVzOlJ9LHgpZm9yKEUgaW4gUylFIGluIGp8fGkoaixFLFNbRV0pO2Vsc2UgbyhvLlArby5GKihofHxrKSxlLFMpO3JldHVybiBTfX0sZnVuY3Rpb24odCxlKXt0LmV4cG9ydHM9ITB9LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDExKSxvPW4oMTIpLGk9bigxMyksdT1uKDE1KSxhPVwicHJvdG90eXBlXCIsYz1mdW5jdGlvbih0LGUsbil7dmFyIGwsZixzLGQ9dCZjLkYsaD10JmMuRyx2PXQmYy5TLF89dCZjLlAscD10JmMuQix5PXQmYy5XLGI9aD9vOm9bZV18fChvW2VdPXt9KSxnPWJbYV0sbT1oP3I6dj9yW2VdOihyW2VdfHx7fSlbYV07aCYmKG49ZSk7Zm9yKGwgaW4gbilmPSFkJiZtJiZ2b2lkIDAhPT1tW2xdLGYmJmwgaW4gYnx8KHM9Zj9tW2xdOm5bbF0sYltsXT1oJiZcImZ1bmN0aW9uXCIhPXR5cGVvZiBtW2xdP25bbF06cCYmZj9pKHMscik6eSYmbVtsXT09cz9mdW5jdGlvbih0KXt2YXIgZT1mdW5jdGlvbihlLG4scil7aWYodGhpcyBpbnN0YW5jZW9mIHQpe3N3aXRjaChhcmd1bWVudHMubGVuZ3RoKXtjYXNlIDA6cmV0dXJuIG5ldyB0O2Nhc2UgMTpyZXR1cm4gbmV3IHQoZSk7Y2FzZSAyOnJldHVybiBuZXcgdChlLG4pfXJldHVybiBuZXcgdChlLG4scil9cmV0dXJuIHQuYXBwbHkodGhpcyxhcmd1bWVudHMpfTtyZXR1cm4gZVthXT10W2FdLGV9KHMpOl8mJlwiZnVuY3Rpb25cIj09dHlwZW9mIHM/aShGdW5jdGlvbi5jYWxsLHMpOnMsXyYmKChiLnZpcnR1YWx8fChiLnZpcnR1YWw9e30pKVtsXT1zLHQmYy5SJiZnJiYhZ1tsXSYmdShnLGwscykpKX07Yy5GPTEsYy5HPTIsYy5TPTQsYy5QPTgsYy5CPTE2LGMuVz0zMixjLlU9NjQsYy5SPTEyOCx0LmV4cG9ydHM9Y30sZnVuY3Rpb24odCxlKXt2YXIgbj10LmV4cG9ydHM9XCJ1bmRlZmluZWRcIiE9dHlwZW9mIHdpbmRvdyYmd2luZG93Lk1hdGg9PU1hdGg/d2luZG93OlwidW5kZWZpbmVkXCIhPXR5cGVvZiBzZWxmJiZzZWxmLk1hdGg9PU1hdGg/c2VsZjpGdW5jdGlvbihcInJldHVybiB0aGlzXCIpKCk7XCJudW1iZXJcIj09dHlwZW9mIF9fZyYmKF9fZz1uKX0sZnVuY3Rpb24odCxlKXt2YXIgbj10LmV4cG9ydHM9e3ZlcnNpb246XCIyLjQuMFwifTtcIm51bWJlclwiPT10eXBlb2YgX19lJiYoX19lPW4pfSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigxNCk7dC5leHBvcnRzPWZ1bmN0aW9uKHQsZSxuKXtpZihyKHQpLHZvaWQgMD09PWUpcmV0dXJuIHQ7c3dpdGNoKG4pe2Nhc2UgMTpyZXR1cm4gZnVuY3Rpb24obil7cmV0dXJuIHQuY2FsbChlLG4pfTtjYXNlIDI6cmV0dXJuIGZ1bmN0aW9uKG4scil7cmV0dXJuIHQuY2FsbChlLG4scil9O2Nhc2UgMzpyZXR1cm4gZnVuY3Rpb24obixyLG8pe3JldHVybiB0LmNhbGwoZSxuLHIsbyl9fXJldHVybiBmdW5jdGlvbigpe3JldHVybiB0LmFwcGx5KGUsYXJndW1lbnRzKX19fSxmdW5jdGlvbih0LGUpe3QuZXhwb3J0cz1mdW5jdGlvbih0KXtpZihcImZ1bmN0aW9uXCIhPXR5cGVvZiB0KXRocm93IFR5cGVFcnJvcih0K1wiIGlzIG5vdCBhIGZ1bmN0aW9uIVwiKTtyZXR1cm4gdH19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDE2KSxvPW4oMjQpO3QuZXhwb3J0cz1uKDIwKT9mdW5jdGlvbih0LGUsbil7cmV0dXJuIHIuZih0LGUsbygxLG4pKX06ZnVuY3Rpb24odCxlLG4pe3JldHVybiB0W2VdPW4sdH19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDE3KSxvPW4oMTkpLGk9bigyMyksdT1PYmplY3QuZGVmaW5lUHJvcGVydHk7ZS5mPW4oMjApP09iamVjdC5kZWZpbmVQcm9wZXJ0eTpmdW5jdGlvbih0LGUsbil7aWYocih0KSxlPWkoZSwhMCkscihuKSxvKXRyeXtyZXR1cm4gdSh0LGUsbil9Y2F0Y2godCl7fWlmKFwiZ2V0XCJpbiBufHxcInNldFwiaW4gbil0aHJvdyBUeXBlRXJyb3IoXCJBY2Nlc3NvcnMgbm90IHN1cHBvcnRlZCFcIik7cmV0dXJuXCJ2YWx1ZVwiaW4gbiYmKHRbZV09bi52YWx1ZSksdH19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDE4KTt0LmV4cG9ydHM9ZnVuY3Rpb24odCl7aWYoIXIodCkpdGhyb3cgVHlwZUVycm9yKHQrXCIgaXMgbm90IGFuIG9iamVjdCFcIik7cmV0dXJuIHR9fSxmdW5jdGlvbih0LGUpe3QuZXhwb3J0cz1mdW5jdGlvbih0KXtyZXR1cm5cIm9iamVjdFwiPT10eXBlb2YgdD9udWxsIT09dDpcImZ1bmN0aW9uXCI9PXR5cGVvZiB0fX0sZnVuY3Rpb24odCxlLG4pe3QuZXhwb3J0cz0hbigyMCkmJiFuKDIxKShmdW5jdGlvbigpe3JldHVybiA3IT1PYmplY3QuZGVmaW5lUHJvcGVydHkobigyMikoXCJkaXZcIiksXCJhXCIse2dldDpmdW5jdGlvbigpe3JldHVybiA3fX0pLmF9KX0sZnVuY3Rpb24odCxlLG4pe3QuZXhwb3J0cz0hbigyMSkoZnVuY3Rpb24oKXtyZXR1cm4gNyE9T2JqZWN0LmRlZmluZVByb3BlcnR5KHt9LFwiYVwiLHtnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gN319KS5hfSl9LGZ1bmN0aW9uKHQsZSl7dC5leHBvcnRzPWZ1bmN0aW9uKHQpe3RyeXtyZXR1cm4hIXQoKX1jYXRjaCh0KXtyZXR1cm4hMH19fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigxOCksbz1uKDExKS5kb2N1bWVudCxpPXIobykmJnIoby5jcmVhdGVFbGVtZW50KTt0LmV4cG9ydHM9ZnVuY3Rpb24odCl7cmV0dXJuIGk/by5jcmVhdGVFbGVtZW50KHQpOnt9fX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMTgpO3QuZXhwb3J0cz1mdW5jdGlvbih0LGUpe2lmKCFyKHQpKXJldHVybiB0O3ZhciBuLG87aWYoZSYmXCJmdW5jdGlvblwiPT10eXBlb2Yobj10LnRvU3RyaW5nKSYmIXIobz1uLmNhbGwodCkpKXJldHVybiBvO2lmKFwiZnVuY3Rpb25cIj09dHlwZW9mKG49dC52YWx1ZU9mKSYmIXIobz1uLmNhbGwodCkpKXJldHVybiBvO2lmKCFlJiZcImZ1bmN0aW9uXCI9PXR5cGVvZihuPXQudG9TdHJpbmcpJiYhcihvPW4uY2FsbCh0KSkpcmV0dXJuIG87dGhyb3cgVHlwZUVycm9yKFwiQ2FuJ3QgY29udmVydCBvYmplY3QgdG8gcHJpbWl0aXZlIHZhbHVlXCIpfX0sZnVuY3Rpb24odCxlKXt0LmV4cG9ydHM9ZnVuY3Rpb24odCxlKXtyZXR1cm57ZW51bWVyYWJsZTohKDEmdCksY29uZmlndXJhYmxlOiEoMiZ0KSx3cml0YWJsZTohKDQmdCksdmFsdWU6ZX19fSxmdW5jdGlvbih0LGUsbil7dC5leHBvcnRzPW4oMTUpfSxmdW5jdGlvbih0LGUpe3ZhciBuPXt9Lmhhc093blByb3BlcnR5O3QuZXhwb3J0cz1mdW5jdGlvbih0LGUpe3JldHVybiBuLmNhbGwodCxlKX19LGZ1bmN0aW9uKHQsZSl7dC5leHBvcnRzPXt9fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHI9bigyOSksbz1uKDI0KSxpPW4oNDQpLHU9e307bigxNSkodSxuKDQ1KShcIml0ZXJhdG9yXCIpLGZ1bmN0aW9uKCl7cmV0dXJuIHRoaXN9KSx0LmV4cG9ydHM9ZnVuY3Rpb24odCxlLG4pe3QucHJvdG90eXBlPXIodSx7bmV4dDpvKDEsbil9KSxpKHQsZStcIiBJdGVyYXRvclwiKX19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDE3KSxvPW4oMzApLGk9big0MiksdT1uKDM5KShcIklFX1BST1RPXCIpLGE9ZnVuY3Rpb24oKXt9LGM9XCJwcm90b3R5cGVcIixsPWZ1bmN0aW9uKCl7dmFyIHQsZT1uKDIyKShcImlmcmFtZVwiKSxyPWkubGVuZ3RoLG89XCI8XCIsdT1cIj5cIjtmb3IoZS5zdHlsZS5kaXNwbGF5PVwibm9uZVwiLG4oNDMpLmFwcGVuZENoaWxkKGUpLGUuc3JjPVwiamF2YXNjcmlwdDpcIix0PWUuY29udGVudFdpbmRvdy5kb2N1bWVudCx0Lm9wZW4oKSx0LndyaXRlKG8rXCJzY3JpcHRcIit1K1wiZG9jdW1lbnQuRj1PYmplY3RcIitvK1wiL3NjcmlwdFwiK3UpLHQuY2xvc2UoKSxsPXQuRjtyLS07KWRlbGV0ZSBsW2NdW2lbcl1dO3JldHVybiBsKCl9O3QuZXhwb3J0cz1PYmplY3QuY3JlYXRlfHxmdW5jdGlvbih0LGUpe3ZhciBuO3JldHVybiBudWxsIT09dD8oYVtjXT1yKHQpLG49bmV3IGEsYVtjXT1udWxsLG5bdV09dCk6bj1sKCksdm9pZCAwPT09ZT9uOm8obixlKX19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDE2KSxvPW4oMTcpLGk9bigzMSk7dC5leHBvcnRzPW4oMjApP09iamVjdC5kZWZpbmVQcm9wZXJ0aWVzOmZ1bmN0aW9uKHQsZSl7byh0KTtmb3IodmFyIG4sdT1pKGUpLGE9dS5sZW5ndGgsYz0wO2E+Yzspci5mKHQsbj11W2MrK10sZVtuXSk7cmV0dXJuIHR9fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigzMiksbz1uKDQyKTt0LmV4cG9ydHM9T2JqZWN0LmtleXN8fGZ1bmN0aW9uKHQpe3JldHVybiByKHQsbyl9fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigyNiksbz1uKDMzKSxpPW4oMzYpKCExKSx1PW4oMzkpKFwiSUVfUFJPVE9cIik7dC5leHBvcnRzPWZ1bmN0aW9uKHQsZSl7dmFyIG4sYT1vKHQpLGM9MCxsPVtdO2ZvcihuIGluIGEpbiE9dSYmcihhLG4pJiZsLnB1c2gobik7Zm9yKDtlLmxlbmd0aD5jOylyKGEsbj1lW2MrK10pJiYofmkobCxuKXx8bC5wdXNoKG4pKTtyZXR1cm4gbH19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDM0KSxvPW4oNyk7dC5leHBvcnRzPWZ1bmN0aW9uKHQpe3JldHVybiByKG8odCkpfX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMzUpO3QuZXhwb3J0cz1PYmplY3QoXCJ6XCIpLnByb3BlcnR5SXNFbnVtZXJhYmxlKDApP09iamVjdDpmdW5jdGlvbih0KXtyZXR1cm5cIlN0cmluZ1wiPT1yKHQpP3Quc3BsaXQoXCJcIik6T2JqZWN0KHQpfX0sZnVuY3Rpb24odCxlKXt2YXIgbj17fS50b1N0cmluZzt0LmV4cG9ydHM9ZnVuY3Rpb24odCl7cmV0dXJuIG4uY2FsbCh0KS5zbGljZSg4LC0xKX19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDMzKSxvPW4oMzcpLGk9bigzOCk7dC5leHBvcnRzPWZ1bmN0aW9uKHQpe3JldHVybiBmdW5jdGlvbihlLG4sdSl7dmFyIGEsYz1yKGUpLGw9byhjLmxlbmd0aCksZj1pKHUsbCk7aWYodCYmbiE9bil7Zm9yKDtsPmY7KWlmKGE9Y1tmKytdLGEhPWEpcmV0dXJuITB9ZWxzZSBmb3IoO2w+ZjtmKyspaWYoKHR8fGYgaW4gYykmJmNbZl09PT1uKXJldHVybiB0fHxmfHwwO3JldHVybiF0JiYtMX19fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9big2KSxvPU1hdGgubWluO3QuZXhwb3J0cz1mdW5jdGlvbih0KXtyZXR1cm4gdD4wP28ocih0KSw5MDA3MTk5MjU0NzQwOTkxKTowfX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oNiksbz1NYXRoLm1heCxpPU1hdGgubWluO3QuZXhwb3J0cz1mdW5jdGlvbih0LGUpe3JldHVybiB0PXIodCksdDwwP28odCtlLDApOmkodCxlKX19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDQwKShcImtleXNcIiksbz1uKDQxKTt0LmV4cG9ydHM9ZnVuY3Rpb24odCl7cmV0dXJuIHJbdF18fChyW3RdPW8odCkpfX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMTEpLG89XCJfX2NvcmUtanNfc2hhcmVkX19cIixpPXJbb118fChyW29dPXt9KTt0LmV4cG9ydHM9ZnVuY3Rpb24odCl7cmV0dXJuIGlbdF18fChpW3RdPXt9KX19LGZ1bmN0aW9uKHQsZSl7dmFyIG49MCxyPU1hdGgucmFuZG9tKCk7dC5leHBvcnRzPWZ1bmN0aW9uKHQpe3JldHVyblwiU3ltYm9sKFwiLmNvbmNhdCh2b2lkIDA9PT10P1wiXCI6dCxcIilfXCIsKCsrbityKS50b1N0cmluZygzNikpfX0sZnVuY3Rpb24odCxlKXt0LmV4cG9ydHM9XCJjb25zdHJ1Y3RvcixoYXNPd25Qcm9wZXJ0eSxpc1Byb3RvdHlwZU9mLHByb3BlcnR5SXNFbnVtZXJhYmxlLHRvTG9jYWxlU3RyaW5nLHRvU3RyaW5nLHZhbHVlT2ZcIi5zcGxpdChcIixcIil9LGZ1bmN0aW9uKHQsZSxuKXt0LmV4cG9ydHM9bigxMSkuZG9jdW1lbnQmJmRvY3VtZW50LmRvY3VtZW50RWxlbWVudH0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMTYpLmYsbz1uKDI2KSxpPW4oNDUpKFwidG9TdHJpbmdUYWdcIik7dC5leHBvcnRzPWZ1bmN0aW9uKHQsZSxuKXt0JiYhbyh0PW4/dDp0LnByb3RvdHlwZSxpKSYmcih0LGkse2NvbmZpZ3VyYWJsZTohMCx2YWx1ZTplfSl9fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9big0MCkoXCJ3a3NcIiksbz1uKDQxKSxpPW4oMTEpLlN5bWJvbCx1PVwiZnVuY3Rpb25cIj09dHlwZW9mIGksYT10LmV4cG9ydHM9ZnVuY3Rpb24odCl7cmV0dXJuIHJbdF18fChyW3RdPXUmJmlbdF18fCh1P2k6bykoXCJTeW1ib2wuXCIrdCkpfTthLnN0b3JlPXJ9LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDI2KSxvPW4oNDcpLGk9bigzOSkoXCJJRV9QUk9UT1wiKSx1PU9iamVjdC5wcm90b3R5cGU7dC5leHBvcnRzPU9iamVjdC5nZXRQcm90b3R5cGVPZnx8ZnVuY3Rpb24odCl7cmV0dXJuIHQ9byh0KSxyKHQsaSk/dFtpXTpcImZ1bmN0aW9uXCI9PXR5cGVvZiB0LmNvbnN0cnVjdG9yJiZ0IGluc3RhbmNlb2YgdC5jb25zdHJ1Y3Rvcj90LmNvbnN0cnVjdG9yLnByb3RvdHlwZTp0IGluc3RhbmNlb2YgT2JqZWN0P3U6bnVsbH19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDcpO3QuZXhwb3J0cz1mdW5jdGlvbih0KXtyZXR1cm4gT2JqZWN0KHIodCkpfX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO3ZhciByPW4oMTMpLG89bigxMCksaT1uKDQ3KSx1PW4oNDkpLGE9big1MCksYz1uKDM3KSxsPW4oNTEpLGY9big1Mik7byhvLlMrby5GKiFuKDU0KShmdW5jdGlvbih0KXtBcnJheS5mcm9tKHQpfSksXCJBcnJheVwiLHtmcm9tOmZ1bmN0aW9uKHQpe3ZhciBlLG4sbyxzLGQ9aSh0KSxoPVwiZnVuY3Rpb25cIj09dHlwZW9mIHRoaXM/dGhpczpBcnJheSx2PWFyZ3VtZW50cy5sZW5ndGgsXz12PjE/YXJndW1lbnRzWzFdOnZvaWQgMCxwPXZvaWQgMCE9PV8seT0wLGI9ZihkKTtpZihwJiYoXz1yKF8sdj4yP2FyZ3VtZW50c1syXTp2b2lkIDAsMikpLHZvaWQgMD09Ynx8aD09QXJyYXkmJmEoYikpZm9yKGU9YyhkLmxlbmd0aCksbj1uZXcgaChlKTtlPnk7eSsrKWwobix5LHA/XyhkW3ldLHkpOmRbeV0pO2Vsc2UgZm9yKHM9Yi5jYWxsKGQpLG49bmV3IGg7IShvPXMubmV4dCgpKS5kb25lO3krKylsKG4seSxwP3UocyxfLFtvLnZhbHVlLHldLCEwKTpvLnZhbHVlKTtyZXR1cm4gbi5sZW5ndGg9eSxufX0pfSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigxNyk7dC5leHBvcnRzPWZ1bmN0aW9uKHQsZSxuLG8pe3RyeXtyZXR1cm4gbz9lKHIobilbMF0sblsxXSk6ZShuKX1jYXRjaChlKXt2YXIgaT10LnJldHVybjt0aHJvdyB2b2lkIDAhPT1pJiZyKGkuY2FsbCh0KSksZX19fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigyNyksbz1uKDQ1KShcIml0ZXJhdG9yXCIpLGk9QXJyYXkucHJvdG90eXBlO3QuZXhwb3J0cz1mdW5jdGlvbih0KXtyZXR1cm4gdm9pZCAwIT09dCYmKHIuQXJyYXk9PT10fHxpW29dPT09dCl9fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHI9bigxNiksbz1uKDI0KTt0LmV4cG9ydHM9ZnVuY3Rpb24odCxlLG4pe2UgaW4gdD9yLmYodCxlLG8oMCxuKSk6dFtlXT1ufX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oNTMpLG89big0NSkoXCJpdGVyYXRvclwiKSxpPW4oMjcpO3QuZXhwb3J0cz1uKDEyKS5nZXRJdGVyYXRvck1ldGhvZD1mdW5jdGlvbih0KXtpZih2b2lkIDAhPXQpcmV0dXJuIHRbb118fHRbXCJAQGl0ZXJhdG9yXCJdfHxpW3IodCldfX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMzUpLG89big0NSkoXCJ0b1N0cmluZ1RhZ1wiKSxpPVwiQXJndW1lbnRzXCI9PXIoZnVuY3Rpb24oKXtyZXR1cm4gYXJndW1lbnRzfSgpKSx1PWZ1bmN0aW9uKHQsZSl7dHJ5e3JldHVybiB0W2VdfWNhdGNoKHQpe319O3QuZXhwb3J0cz1mdW5jdGlvbih0KXt2YXIgZSxuLGE7cmV0dXJuIHZvaWQgMD09PXQ/XCJVbmRlZmluZWRcIjpudWxsPT09dD9cIk51bGxcIjpcInN0cmluZ1wiPT10eXBlb2Yobj11KGU9T2JqZWN0KHQpLG8pKT9uOmk/cihlKTpcIk9iamVjdFwiPT0oYT1yKGUpKSYmXCJmdW5jdGlvblwiPT10eXBlb2YgZS5jYWxsZWU/XCJBcmd1bWVudHNcIjphfX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oNDUpKFwiaXRlcmF0b3JcIiksbz0hMTt0cnl7dmFyIGk9WzddW3JdKCk7aS5yZXR1cm49ZnVuY3Rpb24oKXtvPSEwfSxBcnJheS5mcm9tKGksZnVuY3Rpb24oKXt0aHJvdyAyfSl9Y2F0Y2godCl7fXQuZXhwb3J0cz1mdW5jdGlvbih0LGUpe2lmKCFlJiYhbylyZXR1cm4hMTt2YXIgbj0hMTt0cnl7dmFyIGk9WzddLHU9aVtyXSgpO3UubmV4dD1mdW5jdGlvbigpe3JldHVybntkb25lOm49ITB9fSxpW3JdPWZ1bmN0aW9uKCl7cmV0dXJuIHV9LHQoaSl9Y2F0Y2godCl7fXJldHVybiBufX0sZnVuY3Rpb24odCxlLG4pe3QuZXhwb3J0cz17ZGVmYXVsdDpuKDU2KSxfX2VzTW9kdWxlOiEwfX0sZnVuY3Rpb24odCxlLG4pe24oNCksbig1NyksdC5leHBvcnRzPW4oNjEpLmYoXCJpdGVyYXRvclwiKX0sZnVuY3Rpb24odCxlLG4pe24oNTgpO2Zvcih2YXIgcj1uKDExKSxvPW4oMTUpLGk9bigyNyksdT1uKDQ1KShcInRvU3RyaW5nVGFnXCIpLGE9W1wiTm9kZUxpc3RcIixcIkRPTVRva2VuTGlzdFwiLFwiTWVkaWFMaXN0XCIsXCJTdHlsZVNoZWV0TGlzdFwiLFwiQ1NTUnVsZUxpc3RcIl0sYz0wO2M8NTtjKyspe3ZhciBsPWFbY10sZj1yW2xdLHM9ZiYmZi5wcm90b3R5cGU7cyYmIXNbdV0mJm8ocyx1LGwpLGlbbF09aS5BcnJheX19LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjt2YXIgcj1uKDU5KSxvPW4oNjApLGk9bigyNyksdT1uKDMzKTt0LmV4cG9ydHM9big4KShBcnJheSxcIkFycmF5XCIsZnVuY3Rpb24odCxlKXt0aGlzLl90PXUodCksdGhpcy5faT0wLHRoaXMuX2s9ZX0sZnVuY3Rpb24oKXt2YXIgdD10aGlzLl90LGU9dGhpcy5fayxuPXRoaXMuX2krKztyZXR1cm4hdHx8bj49dC5sZW5ndGg/KHRoaXMuX3Q9dm9pZCAwLG8oMSkpOlwia2V5c1wiPT1lP28oMCxuKTpcInZhbHVlc1wiPT1lP28oMCx0W25dKTpvKDAsW24sdFtuXV0pfSxcInZhbHVlc1wiKSxpLkFyZ3VtZW50cz1pLkFycmF5LHIoXCJrZXlzXCIpLHIoXCJ2YWx1ZXNcIikscihcImVudHJpZXNcIil9LGZ1bmN0aW9uKHQsZSl7dC5leHBvcnRzPWZ1bmN0aW9uKCl7fX0sZnVuY3Rpb24odCxlKXt0LmV4cG9ydHM9ZnVuY3Rpb24odCxlKXtyZXR1cm57dmFsdWU6ZSxkb25lOiEhdH19fSxmdW5jdGlvbih0LGUsbil7ZS5mPW4oNDUpfSxmdW5jdGlvbih0LGUsbil7dC5leHBvcnRzPXtkZWZhdWx0Om4oNjMpLF9fZXNNb2R1bGU6ITB9fSxmdW5jdGlvbih0LGUsbil7big2NCksbig3NSksbig3Niksbig3NyksdC5leHBvcnRzPW4oMTIpLlN5bWJvbH0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO3ZhciByPW4oMTEpLG89bigyNiksaT1uKDIwKSx1PW4oMTApLGE9bigyNSksYz1uKDY1KS5LRVksbD1uKDIxKSxmPW4oNDApLHM9big0NCksZD1uKDQxKSxoPW4oNDUpLHY9big2MSksXz1uKDY2KSxwPW4oNjcpLHk9big2OCksYj1uKDcxKSxnPW4oMTcpLG09bigzMykseD1uKDIzKSxTPW4oMjQpLEU9bigyOSksTT1uKDcyKSxPPW4oNzQpLHc9bigxNiksUD1uKDMxKSxrPU8uZixqPXcuZixUPU0uZixBPXIuU3ltYm9sLFI9ci5KU09OLEw9UiYmUi5zdHJpbmdpZnksST1cInByb3RvdHlwZVwiLEQ9aChcIl9oaWRkZW5cIiksQz1oKFwidG9QcmltaXRpdmVcIiksTj17fS5wcm9wZXJ0eUlzRW51bWVyYWJsZSxGPWYoXCJzeW1ib2wtcmVnaXN0cnlcIiksSD1mKFwic3ltYm9sc1wiKSx6PWYoXCJvcC1zeW1ib2xzXCIpLEI9T2JqZWN0W0ldLEc9XCJmdW5jdGlvblwiPT10eXBlb2YgQSxXPXIuUU9iamVjdCxWPSFXfHwhV1tJXXx8IVdbSV0uZmluZENoaWxkLFU9aSYmbChmdW5jdGlvbigpe3JldHVybiA3IT1FKGooe30sXCJhXCIse2dldDpmdW5jdGlvbigpe3JldHVybiBqKHRoaXMsXCJhXCIse3ZhbHVlOjd9KS5hfX0pKS5hfSk/ZnVuY3Rpb24odCxlLG4pe3ZhciByPWsoQixlKTtyJiZkZWxldGUgQltlXSxqKHQsZSxuKSxyJiZ0IT09QiYmaihCLGUscil9OmosWD1mdW5jdGlvbih0KXt2YXIgZT1IW3RdPUUoQVtJXSk7cmV0dXJuIGUuX2s9dCxlfSxxPUcmJlwic3ltYm9sXCI9PXR5cGVvZiBBLml0ZXJhdG9yP2Z1bmN0aW9uKHQpe3JldHVyblwic3ltYm9sXCI9PXR5cGVvZiB0fTpmdW5jdGlvbih0KXtyZXR1cm4gdCBpbnN0YW5jZW9mIEF9LEs9ZnVuY3Rpb24odCxlLG4pe3JldHVybiB0PT09QiYmSyh6LGUsbiksZyh0KSxlPXgoZSwhMCksZyhuKSxvKEgsZSk/KG4uZW51bWVyYWJsZT8obyh0LEQpJiZ0W0RdW2VdJiYodFtEXVtlXT0hMSksbj1FKG4se2VudW1lcmFibGU6UygwLCExKX0pKToobyh0LEQpfHxqKHQsRCxTKDEse30pKSx0W0RdW2VdPSEwKSxVKHQsZSxuKSk6aih0LGUsbil9LEo9ZnVuY3Rpb24odCxlKXtnKHQpO2Zvcih2YXIgbixyPXkoZT1tKGUpKSxvPTAsaT1yLmxlbmd0aDtpPm87KUsodCxuPXJbbysrXSxlW25dKTtyZXR1cm4gdH0sWT1mdW5jdGlvbih0LGUpe3JldHVybiB2b2lkIDA9PT1lP0UodCk6SihFKHQpLGUpfSxRPWZ1bmN0aW9uKHQpe3ZhciBlPU4uY2FsbCh0aGlzLHQ9eCh0LCEwKSk7cmV0dXJuISh0aGlzPT09QiYmbyhILHQpJiYhbyh6LHQpKSYmKCEoZXx8IW8odGhpcyx0KXx8IW8oSCx0KXx8byh0aGlzLEQpJiZ0aGlzW0RdW3RdKXx8ZSl9LFo9ZnVuY3Rpb24odCxlKXtpZih0PW0odCksZT14KGUsITApLHQhPT1CfHwhbyhILGUpfHxvKHosZSkpe3ZhciBuPWsodCxlKTtyZXR1cm4hbnx8IW8oSCxlKXx8byh0LEQpJiZ0W0RdW2VdfHwobi5lbnVtZXJhYmxlPSEwKSxufX0sJD1mdW5jdGlvbih0KXtmb3IodmFyIGUsbj1UKG0odCkpLHI9W10saT0wO24ubGVuZ3RoPmk7KW8oSCxlPW5baSsrXSl8fGU9PUR8fGU9PWN8fHIucHVzaChlKTtyZXR1cm4gcn0sdHQ9ZnVuY3Rpb24odCl7Zm9yKHZhciBlLG49dD09PUIscj1UKG4/ejptKHQpKSxpPVtdLHU9MDtyLmxlbmd0aD51OykhbyhILGU9clt1KytdKXx8biYmIW8oQixlKXx8aS5wdXNoKEhbZV0pO3JldHVybiBpfTtHfHwoQT1mdW5jdGlvbigpe2lmKHRoaXMgaW5zdGFuY2VvZiBBKXRocm93IFR5cGVFcnJvcihcIlN5bWJvbCBpcyBub3QgYSBjb25zdHJ1Y3RvciFcIik7dmFyIHQ9ZChhcmd1bWVudHMubGVuZ3RoPjA/YXJndW1lbnRzWzBdOnZvaWQgMCksZT1mdW5jdGlvbihuKXt0aGlzPT09QiYmZS5jYWxsKHosbiksbyh0aGlzLEQpJiZvKHRoaXNbRF0sdCkmJih0aGlzW0RdW3RdPSExKSxVKHRoaXMsdCxTKDEsbikpfTtyZXR1cm4gaSYmViYmVShCLHQse2NvbmZpZ3VyYWJsZTohMCxzZXQ6ZX0pLFgodCl9LGEoQVtJXSxcInRvU3RyaW5nXCIsZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fa30pLE8uZj1aLHcuZj1LLG4oNzMpLmY9TS5mPSQsbig3MCkuZj1RLG4oNjkpLmY9dHQsaSYmIW4oOSkmJmEoQixcInByb3BlcnR5SXNFbnVtZXJhYmxlXCIsUSwhMCksdi5mPWZ1bmN0aW9uKHQpe3JldHVybiBYKGgodCkpfSksdSh1LkcrdS5XK3UuRiohRyx7U3ltYm9sOkF9KTtmb3IodmFyIGV0PVwiaGFzSW5zdGFuY2UsaXNDb25jYXRTcHJlYWRhYmxlLGl0ZXJhdG9yLG1hdGNoLHJlcGxhY2Usc2VhcmNoLHNwZWNpZXMsc3BsaXQsdG9QcmltaXRpdmUsdG9TdHJpbmdUYWcsdW5zY29wYWJsZXNcIi5zcGxpdChcIixcIiksbnQ9MDtldC5sZW5ndGg+bnQ7KWgoZXRbbnQrK10pO2Zvcih2YXIgZXQ9UChoLnN0b3JlKSxudD0wO2V0Lmxlbmd0aD5udDspXyhldFtudCsrXSk7dSh1LlMrdS5GKiFHLFwiU3ltYm9sXCIse2ZvcjpmdW5jdGlvbih0KXtyZXR1cm4gbyhGLHQrPVwiXCIpP0ZbdF06Rlt0XT1BKHQpfSxrZXlGb3I6ZnVuY3Rpb24odCl7aWYocSh0KSlyZXR1cm4gcChGLHQpO3Rocm93IFR5cGVFcnJvcih0K1wiIGlzIG5vdCBhIHN5bWJvbCFcIil9LHVzZVNldHRlcjpmdW5jdGlvbigpe1Y9ITB9LHVzZVNpbXBsZTpmdW5jdGlvbigpe1Y9ITF9fSksdSh1LlMrdS5GKiFHLFwiT2JqZWN0XCIse2NyZWF0ZTpZLGRlZmluZVByb3BlcnR5OkssZGVmaW5lUHJvcGVydGllczpKLGdldE93blByb3BlcnR5RGVzY3JpcHRvcjpaLGdldE93blByb3BlcnR5TmFtZXM6JCxnZXRPd25Qcm9wZXJ0eVN5bWJvbHM6dHR9KSxSJiZ1KHUuUyt1LkYqKCFHfHxsKGZ1bmN0aW9uKCl7dmFyIHQ9QSgpO3JldHVyblwiW251bGxdXCIhPUwoW3RdKXx8XCJ7fVwiIT1MKHthOnR9KXx8XCJ7fVwiIT1MKE9iamVjdCh0KSl9KSksXCJKU09OXCIse3N0cmluZ2lmeTpmdW5jdGlvbih0KXtpZih2b2lkIDAhPT10JiYhcSh0KSl7Zm9yKHZhciBlLG4scj1bdF0sbz0xO2FyZ3VtZW50cy5sZW5ndGg+bzspci5wdXNoKGFyZ3VtZW50c1tvKytdKTtyZXR1cm4gZT1yWzFdLFwiZnVuY3Rpb25cIj09dHlwZW9mIGUmJihuPWUpLCFuJiZiKGUpfHwoZT1mdW5jdGlvbih0LGUpe2lmKG4mJihlPW4uY2FsbCh0aGlzLHQsZSkpLCFxKGUpKXJldHVybiBlfSksclsxXT1lLEwuYXBwbHkoUixyKX19fSksQVtJXVtDXXx8bigxNSkoQVtJXSxDLEFbSV0udmFsdWVPZikscyhBLFwiU3ltYm9sXCIpLHMoTWF0aCxcIk1hdGhcIiwhMCkscyhyLkpTT04sXCJKU09OXCIsITApfSxmdW5jdGlvbih0LGUsbil7dmFyIHI9big0MSkoXCJtZXRhXCIpLG89bigxOCksaT1uKDI2KSx1PW4oMTYpLmYsYT0wLGM9T2JqZWN0LmlzRXh0ZW5zaWJsZXx8ZnVuY3Rpb24oKXtyZXR1cm4hMH0sbD0hbigyMSkoZnVuY3Rpb24oKXtyZXR1cm4gYyhPYmplY3QucHJldmVudEV4dGVuc2lvbnMoe30pKX0pLGY9ZnVuY3Rpb24odCl7dSh0LHIse3ZhbHVlOntpOlwiT1wiKyArK2Esdzp7fX19KX0scz1mdW5jdGlvbih0LGUpe2lmKCFvKHQpKXJldHVyblwic3ltYm9sXCI9PXR5cGVvZiB0P3Q6KFwic3RyaW5nXCI9PXR5cGVvZiB0P1wiU1wiOlwiUFwiKSt0O2lmKCFpKHQscikpe2lmKCFjKHQpKXJldHVyblwiRlwiO2lmKCFlKXJldHVyblwiRVwiO2YodCl9cmV0dXJuIHRbcl0uaX0sZD1mdW5jdGlvbih0LGUpe2lmKCFpKHQscikpe2lmKCFjKHQpKXJldHVybiEwO2lmKCFlKXJldHVybiExO2YodCl9cmV0dXJuIHRbcl0ud30saD1mdW5jdGlvbih0KXtyZXR1cm4gbCYmdi5ORUVEJiZjKHQpJiYhaSh0LHIpJiZmKHQpLHR9LHY9dC5leHBvcnRzPXtLRVk6cixORUVEOiExLGZhc3RLZXk6cyxnZXRXZWFrOmQsb25GcmVlemU6aH19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDExKSxvPW4oMTIpLGk9big5KSx1PW4oNjEpLGE9bigxNikuZjt0LmV4cG9ydHM9ZnVuY3Rpb24odCl7dmFyIGU9by5TeW1ib2x8fChvLlN5bWJvbD1pP3t9OnIuU3ltYm9sfHx7fSk7XCJfXCI9PXQuY2hhckF0KDApfHx0IGluIGV8fGEoZSx0LHt2YWx1ZTp1LmYodCl9KX19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDMxKSxvPW4oMzMpO3QuZXhwb3J0cz1mdW5jdGlvbih0LGUpe2Zvcih2YXIgbixpPW8odCksdT1yKGkpLGE9dS5sZW5ndGgsYz0wO2E+YzspaWYoaVtuPXVbYysrXV09PT1lKXJldHVybiBufX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMzEpLG89big2OSksaT1uKDcwKTt0LmV4cG9ydHM9ZnVuY3Rpb24odCl7dmFyIGU9cih0KSxuPW8uZjtpZihuKWZvcih2YXIgdSxhPW4odCksYz1pLmYsbD0wO2EubGVuZ3RoPmw7KWMuY2FsbCh0LHU9YVtsKytdKSYmZS5wdXNoKHUpO3JldHVybiBlfX0sZnVuY3Rpb24odCxlKXtlLmY9T2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9sc30sZnVuY3Rpb24odCxlKXtlLmY9e30ucHJvcGVydHlJc0VudW1lcmFibGV9LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDM1KTt0LmV4cG9ydHM9QXJyYXkuaXNBcnJheXx8ZnVuY3Rpb24odCl7cmV0dXJuXCJBcnJheVwiPT1yKHQpfX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMzMpLG89big3MykuZixpPXt9LnRvU3RyaW5nLHU9XCJvYmplY3RcIj09dHlwZW9mIHdpbmRvdyYmd2luZG93JiZPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcz9PYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh3aW5kb3cpOltdLGE9ZnVuY3Rpb24odCl7dHJ5e3JldHVybiBvKHQpfWNhdGNoKHQpe3JldHVybiB1LnNsaWNlKCl9fTt0LmV4cG9ydHMuZj1mdW5jdGlvbih0KXtyZXR1cm4gdSYmXCJbb2JqZWN0IFdpbmRvd11cIj09aS5jYWxsKHQpP2EodCk6byhyKHQpKX19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDMyKSxvPW4oNDIpLmNvbmNhdChcImxlbmd0aFwiLFwicHJvdG90eXBlXCIpO2UuZj1PYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lc3x8ZnVuY3Rpb24odCl7cmV0dXJuIHIodCxvKX19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDcwKSxvPW4oMjQpLGk9bigzMyksdT1uKDIzKSxhPW4oMjYpLGM9bigxOSksbD1PYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yO2UuZj1uKDIwKT9sOmZ1bmN0aW9uKHQsZSl7aWYodD1pKHQpLGU9dShlLCEwKSxjKXRyeXtyZXR1cm4gbCh0LGUpfWNhdGNoKHQpe31pZihhKHQsZSkpcmV0dXJuIG8oIXIuZi5jYWxsKHQsZSksdFtlXSl9fSxmdW5jdGlvbih0LGUpe30sZnVuY3Rpb24odCxlLG4pe24oNjYpKFwiYXN5bmNJdGVyYXRvclwiKX0sZnVuY3Rpb24odCxlLG4pe24oNjYpKFwib2JzZXJ2YWJsZVwiKX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fWZ1bmN0aW9uIG8odCxlKXtpZighKHQgaW5zdGFuY2VvZiBlKSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpfXZhciBpPW4oNzkpLHU9cihpKSxhPW4oODIpLGM9cihhKSxsPW4oODYpLGY9cihsKTtPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KSxlLlNtb290aFNjcm9sbGJhcj12b2lkIDA7dmFyIHM9ZnVuY3Rpb24oKXtmdW5jdGlvbiB0KHQsZSl7Zm9yKHZhciBuPTA7bjxlLmxlbmd0aDtuKyspe3ZhciByPWVbbl07ci5lbnVtZXJhYmxlPXIuZW51bWVyYWJsZXx8ITEsci5jb25maWd1cmFibGU9ITAsXCJ2YWx1ZVwiaW4gciYmKHIud3JpdGFibGU9ITApLCgwLGYuZGVmYXVsdCkodCxyLmtleSxyKX19cmV0dXJuIGZ1bmN0aW9uKGUsbixyKXtyZXR1cm4gbiYmdChlLnByb3RvdHlwZSxuKSxyJiZ0KGUsciksZX19KCksZD1uKDg5KSxoPW4oMTEyKTtlLlNtb290aFNjcm9sbGJhcj1mdW5jdGlvbigpe2Z1bmN0aW9uIHQoZSl7dmFyIG49dGhpcyxyPWFyZ3VtZW50cy5sZW5ndGg+MSYmdm9pZCAwIT09YXJndW1lbnRzWzFdP2FyZ3VtZW50c1sxXTp7fTtvKHRoaXMsdCksZS5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLFwiMVwiKTt2YXIgaT0oMCxoLmZpbmRDaGlsZCkoZSxcInNjcm9sbC1jb250ZW50XCIpLGE9KDAsaC5maW5kQ2hpbGQpKGUsXCJvdmVyc2Nyb2xsLWdsb3dcIiksbD0oMCxoLmZpbmRDaGlsZCkoZSxcInNjcm9sbGJhci10cmFjay14XCIpLGY9KDAsaC5maW5kQ2hpbGQpKGUsXCJzY3JvbGxiYXItdHJhY2steVwiKTsoMCxoLnNldFN0eWxlKShlLHtvdmVyZmxvdzpcImhpZGRlblwiLG91dGxpbmU6XCJub25lXCJ9KSwoMCxoLnNldFN0eWxlKShhLHtkaXNwbGF5Olwibm9uZVwiLFwicG9pbnRlci1ldmVudHNcIjpcIm5vbmVcIn0pLHRoaXMuX19yZWFkb25seShcInRhcmdldHNcIiwoMCxjLmRlZmF1bHQpKHtjb250YWluZXI6ZSxjb250ZW50OmksY2FudmFzOntlbGVtOmEsY29udGV4dDphLmdldENvbnRleHQoXCIyZFwiKX0seEF4aXM6KDAsYy5kZWZhdWx0KSh7dHJhY2s6bCx0aHVtYjooMCxoLmZpbmRDaGlsZCkobCxcInNjcm9sbGJhci10aHVtYi14XCIpfSkseUF4aXM6KDAsYy5kZWZhdWx0KSh7dHJhY2s6Zix0aHVtYjooMCxoLmZpbmRDaGlsZCkoZixcInNjcm9sbGJhci10aHVtYi15XCIpfSl9KSkuX19yZWFkb25seShcIm9mZnNldFwiLHt4OjAseTowfSkuX19yZWFkb25seShcInRodW1iT2Zmc2V0XCIse3g6MCx5OjB9KS5fX3JlYWRvbmx5KFwibGltaXRcIix7eDoxLzAseToxLzB9KS5fX3JlYWRvbmx5KFwibW92ZW1lbnRcIix7eDowLHk6MH0pLl9fcmVhZG9ubHkoXCJtb3ZlbWVudExvY2tlZFwiLHt4OiExLHk6ITF9KS5fX3JlYWRvbmx5KFwib3ZlcnNjcm9sbFJlbmRlcmVkXCIse3g6MCx5OjB9KS5fX3JlYWRvbmx5KFwib3ZlcnNjcm9sbEJhY2tcIiwhMSkuX19yZWFkb25seShcInRodW1iU2l6ZVwiLHt4OjAseTowLHJlYWxYOjAscmVhbFk6MH0pLl9fcmVhZG9ubHkoXCJib3VuZGluZ1wiLHt0b3A6MCxyaWdodDowLGJvdHRvbTowLGxlZnQ6MH0pLl9fcmVhZG9ubHkoXCJjaGlsZHJlblwiLFtdKS5fX3JlYWRvbmx5KFwicGFyZW50c1wiLFtdKS5fX3JlYWRvbmx5KFwic2l6ZVwiLHRoaXMuZ2V0U2l6ZSgpKS5fX3JlYWRvbmx5KFwiaXNOZXN0ZWRTY3JvbGxiYXJcIiwhMSksKDAsdS5kZWZhdWx0KSh0aGlzLHtfX2hpZGVUcmFja1Rocm90dGxlOnt2YWx1ZTooMCxoLmRlYm91bmNlKSh0aGlzLmhpZGVUcmFjay5iaW5kKHRoaXMpLDFlMywhMSl9LF9fdXBkYXRlVGhyb3R0bGU6e3ZhbHVlOigwLGguZGVib3VuY2UpKHRoaXMudXBkYXRlLmJpbmQodGhpcykpfSxfX3RvdWNoUmVjb3JkOnt2YWx1ZTpuZXcgaC5Ub3VjaFJlY29yZH0sX19saXN0ZW5lcnM6e3ZhbHVlOltdfSxfX2hhbmRsZXJzOnt2YWx1ZTpbXX0sX19jaGlsZHJlbjp7dmFsdWU6W119LF9fdGltZXJJRDp7dmFsdWU6e319fSksdGhpcy5fX2luaXRPcHRpb25zKHIpLHRoaXMuX19pbml0U2Nyb2xsYmFyKCk7dmFyIHM9ZS5zY3JvbGxMZWZ0LHY9ZS5zY3JvbGxUb3A7aWYoZS5zY3JvbGxMZWZ0PWUuc2Nyb2xsVG9wPTAsdGhpcy5zZXRQb3NpdGlvbihzLHYsITApLGQuc2JMaXN0LnNldChlLHRoaXMpLFwiZnVuY3Rpb25cIj09dHlwZW9mIGQuR0xPQkFMX0VOVi5NdXRhdGlvbk9ic2VydmVyKXt2YXIgXz1uZXcgZC5HTE9CQUxfRU5WLk11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24oKXtuLnVwZGF0ZSghMCl9KTtfLm9ic2VydmUoaSx7Y2hpbGRMaXN0OiEwfSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsXCJfX29ic2VydmVyXCIse3ZhbHVlOl99KX19cmV0dXJuIHModCxbe2tleTpcIk1BWF9PVkVSU0NST0xMXCIsZ2V0OmZ1bmN0aW9uKCl7dmFyIHQ9dGhpcy5vcHRpb25zLGU9dGhpcy5zaXplO3N3aXRjaCh0Lm92ZXJzY3JvbGxFZmZlY3Qpe2Nhc2VcImJvdW5jZVwiOnZhciBuPU1hdGguZmxvb3IoTWF0aC5zcXJ0KE1hdGgucG93KGUuY29udGFpbmVyLndpZHRoLDIpK01hdGgucG93KGUuY29udGFpbmVyLmhlaWdodCwyKSkpLHI9dGhpcy5fX2lzTW92ZW1lbnRMb2NrZWQoKT8yOjEwO3JldHVybiBkLkdMT0JBTF9FTlYuVE9VQ0hfU1VQUE9SVEVEPygwLGgucGlja0luUmFuZ2UpKG4vciwxMDAsMWUzKTooMCxoLnBpY2tJblJhbmdlKShuLzEwLDI1LDUwKTtjYXNlXCJnbG93XCI6cmV0dXJuIDE1MDtkZWZhdWx0OnJldHVybiAwfX19LHtrZXk6XCJzY3JvbGxUb3BcIixnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5vZmZzZXQueX19LHtrZXk6XCJzY3JvbGxMZWZ0XCIsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMub2Zmc2V0Lnh9fV0pLHR9KCl9LGZ1bmN0aW9uKHQsZSxuKXt0LmV4cG9ydHM9e2RlZmF1bHQ6big4MCksX19lc01vZHVsZTohMH19LGZ1bmN0aW9uKHQsZSxuKXtuKDgxKTt2YXIgcj1uKDEyKS5PYmplY3Q7dC5leHBvcnRzPWZ1bmN0aW9uKHQsZSl7cmV0dXJuIHIuZGVmaW5lUHJvcGVydGllcyh0LGUpfX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMTApO3Ioci5TK3IuRiohbigyMCksXCJPYmplY3RcIix7ZGVmaW5lUHJvcGVydGllczpuKDMwKX0pfSxmdW5jdGlvbih0LGUsbil7dC5leHBvcnRzPXtkZWZhdWx0Om4oODMpLF9fZXNNb2R1bGU6ITB9fSxmdW5jdGlvbih0LGUsbil7big4NCksdC5leHBvcnRzPW4oMTIpLk9iamVjdC5mcmVlemV9LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDE4KSxvPW4oNjUpLm9uRnJlZXplO24oODUpKFwiZnJlZXplXCIsZnVuY3Rpb24odCl7cmV0dXJuIGZ1bmN0aW9uKGUpe3JldHVybiB0JiZyKGUpP3QobyhlKSk6ZX19KX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMTApLG89bigxMiksaT1uKDIxKTt0LmV4cG9ydHM9ZnVuY3Rpb24odCxlKXt2YXIgbj0oby5PYmplY3R8fHt9KVt0XXx8T2JqZWN0W3RdLHU9e307dVt0XT1lKG4pLHIoci5TK3IuRippKGZ1bmN0aW9uKCl7bigxKX0pLFwiT2JqZWN0XCIsdSl9fSxmdW5jdGlvbih0LGUsbil7dC5leHBvcnRzPXtkZWZhdWx0Om4oODcpLF9fZXNNb2R1bGU6ITB9fSxmdW5jdGlvbih0LGUsbil7big4OCk7dmFyIHI9bigxMikuT2JqZWN0O3QuZXhwb3J0cz1mdW5jdGlvbih0LGUsbil7cmV0dXJuIHIuZGVmaW5lUHJvcGVydHkodCxlLG4pfX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMTApO3Ioci5TK3IuRiohbigyMCksXCJPYmplY3RcIix7ZGVmaW5lUHJvcGVydHk6bigxNikuZn0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19dmFyIG89big4NiksaT1yKG8pLHU9big5MCksYT1yKHUpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO3ZhciBjPW4oOTMpOygwLGEuZGVmYXVsdCkoYykuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGNbdF19fSl9KX0sZnVuY3Rpb24odCxlLG4pe3QuZXhwb3J0cz17ZGVmYXVsdDpuKDkxKSxfX2VzTW9kdWxlOiEwfX0sZnVuY3Rpb24odCxlLG4pe24oOTIpLHQuZXhwb3J0cz1uKDEyKS5PYmplY3Qua2V5c30sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oNDcpLG89bigzMSk7big4NSkoXCJrZXlzXCIsZnVuY3Rpb24oKXtyZXR1cm4gZnVuY3Rpb24odCl7cmV0dXJuIG8ocih0KSl9fSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX12YXIgbz1uKDg2KSxpPXIobyksdT1uKDkwKSxhPXIodSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSk7dmFyIGM9big5NCk7KDAsYS5kZWZhdWx0KShjKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gY1t0XX19KX0pO3ZhciBsPW4oOTUpOygwLGEuZGVmYXVsdCkobCkuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGxbdF19fSl9KTt2YXIgZj1uKDExMSk7KDAsYS5kZWZhdWx0KShmKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gZlt0XX19KX0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19dmFyIG89big4NiksaT1yKG8pLHU9big5MCksYT1yKHUpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO3ZhciBjPWZ1bmN0aW9uKHQpe3ZhciBlPXt9LG49e307cmV0dXJuKDAsYS5kZWZhdWx0KSh0KS5mb3JFYWNoKGZ1bmN0aW9uKHIpeygwLGkuZGVmYXVsdCkoZSxyLHtnZXQ6ZnVuY3Rpb24oKXtpZighbi5oYXNPd25Qcm9wZXJ0eShyKSl7dmFyIGU9dFtyXTtuW3JdPWUoKX1yZXR1cm4gbltyXX19KX0pLGV9LGw9e011dGF0aW9uT2JzZXJ2ZXI6ZnVuY3Rpb24oKXtyZXR1cm4gd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXJ8fHdpbmRvdy5XZWJLaXRNdXRhdGlvbk9ic2VydmVyfHx3aW5kb3cuTW96TXV0YXRpb25PYnNlcnZlcn0sVE9VQ0hfU1VQUE9SVEVEOmZ1bmN0aW9uKCl7cmV0dXJuXCJvbnRvdWNoc3RhcnRcImluIGRvY3VtZW50fSxFQVNJTkdfTVVMVElQTElFUjpmdW5jdGlvbigpe3JldHVybiBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9BbmRyb2lkLyk/LjU6LjI1fSxXSEVFTF9FVkVOVDpmdW5jdGlvbigpe3JldHVyblwib253aGVlbFwiaW4gd2luZG93P1wid2hlZWxcIjpcIm1vdXNld2hlZWxcIn19O2UuR0xPQkFMX0VOVj1jKGwpfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19dmFyIG89big5NiksaT1yKG8pO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO3ZhciB1PW5ldyBpLmRlZmF1bHQsYT11LnNldC5iaW5kKHUpLGM9dS5kZWxldGUuYmluZCh1KTt1LnVwZGF0ZT1mdW5jdGlvbigpe3UuZm9yRWFjaChmdW5jdGlvbih0KXt0Ll9fdXBkYXRlVHJlZSgpfSl9LHUuZGVsZXRlPWZ1bmN0aW9uKCl7dmFyIHQ9Yy5hcHBseSh2b2lkIDAsYXJndW1lbnRzKTtyZXR1cm4gdS51cGRhdGUoKSx0fSx1LnNldD1mdW5jdGlvbigpe3ZhciB0PWEuYXBwbHkodm9pZCAwLGFyZ3VtZW50cyk7cmV0dXJuIHUudXBkYXRlKCksdH0sZS5zYkxpc3Q9dX0sZnVuY3Rpb24odCxlLG4pe3QuZXhwb3J0cz17ZGVmYXVsdDpuKDk3KSxfX2VzTW9kdWxlOiEwfX0sZnVuY3Rpb24odCxlLG4pe24oNzUpLG4oNCksbig1Nyksbig5OCksbigxMDgpLHQuZXhwb3J0cz1uKDEyKS5NYXB9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjt2YXIgcj1uKDk5KTt0LmV4cG9ydHM9bigxMDQpKFwiTWFwXCIsZnVuY3Rpb24odCl7cmV0dXJuIGZ1bmN0aW9uKCl7cmV0dXJuIHQodGhpcyxhcmd1bWVudHMubGVuZ3RoPjA/YXJndW1lbnRzWzBdOnZvaWQgMCl9fSx7Z2V0OmZ1bmN0aW9uKHQpe3ZhciBlPXIuZ2V0RW50cnkodGhpcyx0KTtyZXR1cm4gZSYmZS52fSxzZXQ6ZnVuY3Rpb24odCxlKXtyZXR1cm4gci5kZWYodGhpcywwPT09dD8wOnQsZSl9fSxyLCEwKX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO3ZhciByPW4oMTYpLmYsbz1uKDI5KSxpPW4oMTAwKSx1PW4oMTMpLGE9bigxMDEpLGM9big3KSxsPW4oMTAyKSxmPW4oOCkscz1uKDYwKSxkPW4oMTAzKSxoPW4oMjApLHY9big2NSkuZmFzdEtleSxfPWg/XCJfc1wiOlwic2l6ZVwiLHA9ZnVuY3Rpb24odCxlKXt2YXIgbixyPXYoZSk7aWYoXCJGXCIhPT1yKXJldHVybiB0Ll9pW3JdO2ZvcihuPXQuX2Y7bjtuPW4ubilpZihuLms9PWUpcmV0dXJuIG59O3QuZXhwb3J0cz17Z2V0Q29uc3RydWN0b3I6ZnVuY3Rpb24odCxlLG4sZil7dmFyIHM9dChmdW5jdGlvbih0LHIpe2EodCxzLGUsXCJfaVwiKSx0Ll9pPW8obnVsbCksdC5fZj12b2lkIDAsdC5fbD12b2lkIDAsdFtfXT0wLHZvaWQgMCE9ciYmbChyLG4sdFtmXSx0KX0pO3JldHVybiBpKHMucHJvdG90eXBlLHtjbGVhcjpmdW5jdGlvbigpe2Zvcih2YXIgdD10aGlzLGU9dC5faSxuPXQuX2Y7bjtuPW4ubiluLnI9ITAsbi5wJiYobi5wPW4ucC5uPXZvaWQgMCksZGVsZXRlIGVbbi5pXTt0Ll9mPXQuX2w9dm9pZCAwLHRbX109MH0sZGVsZXRlOmZ1bmN0aW9uKHQpe3ZhciBlPXRoaXMsbj1wKGUsdCk7aWYobil7dmFyIHI9bi5uLG89bi5wO2RlbGV0ZSBlLl9pW24uaV0sbi5yPSEwLG8mJihvLm49ciksciYmKHIucD1vKSxlLl9mPT1uJiYoZS5fZj1yKSxlLl9sPT1uJiYoZS5fbD1vKSxlW19dLS19cmV0dXJuISFufSxmb3JFYWNoOmZ1bmN0aW9uKHQpe2EodGhpcyxzLFwiZm9yRWFjaFwiKTtmb3IodmFyIGUsbj11KHQsYXJndW1lbnRzLmxlbmd0aD4xP2FyZ3VtZW50c1sxXTp2b2lkIDAsMyk7ZT1lP2Uubjp0aGlzLl9mOylmb3IobihlLnYsZS5rLHRoaXMpO2UmJmUucjspZT1lLnB9LGhhczpmdW5jdGlvbih0KXtyZXR1cm4hIXAodGhpcyx0KX19KSxoJiZyKHMucHJvdG90eXBlLFwic2l6ZVwiLHtnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gYyh0aGlzW19dKX19KSxzfSxkZWY6ZnVuY3Rpb24odCxlLG4pe3ZhciByLG8saT1wKHQsZSk7cmV0dXJuIGk/aS52PW46KHQuX2w9aT17aTpvPXYoZSwhMCksazplLHY6bixwOnI9dC5fbCxuOnZvaWQgMCxyOiExfSx0Ll9mfHwodC5fZj1pKSxyJiYoci5uPWkpLHRbX10rKyxcIkZcIiE9PW8mJih0Ll9pW29dPWkpKSx0fSxnZXRFbnRyeTpwLHNldFN0cm9uZzpmdW5jdGlvbih0LGUsbil7Zih0LGUsZnVuY3Rpb24odCxlKXt0aGlzLl90PXQsdGhpcy5faz1lLHRoaXMuX2w9dm9pZCAwfSxmdW5jdGlvbigpe2Zvcih2YXIgdD10aGlzLGU9dC5fayxuPXQuX2w7biYmbi5yOyluPW4ucDtyZXR1cm4gdC5fdCYmKHQuX2w9bj1uP24ubjp0Ll90Ll9mKT9cImtleXNcIj09ZT9zKDAsbi5rKTpcInZhbHVlc1wiPT1lP3MoMCxuLnYpOnMoMCxbbi5rLG4udl0pOih0Ll90PXZvaWQgMCxzKDEpKX0sbj9cImVudHJpZXNcIjpcInZhbHVlc1wiLCFuLCEwKSxkKGUpfX19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDE1KTt0LmV4cG9ydHM9ZnVuY3Rpb24odCxlLG4pe2Zvcih2YXIgbyBpbiBlKW4mJnRbb10/dFtvXT1lW29dOnIodCxvLGVbb10pO3JldHVybiB0fX0sZnVuY3Rpb24odCxlKXt0LmV4cG9ydHM9ZnVuY3Rpb24odCxlLG4scil7aWYoISh0IGluc3RhbmNlb2YgZSl8fHZvaWQgMCE9PXImJnIgaW4gdCl0aHJvdyBUeXBlRXJyb3IobitcIjogaW5jb3JyZWN0IGludm9jYXRpb24hXCIpO3JldHVybiB0fX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMTMpLG89big0OSksaT1uKDUwKSx1PW4oMTcpLGE9bigzNyksYz1uKDUyKSxsPXt9LGY9e30sZT10LmV4cG9ydHM9ZnVuY3Rpb24odCxlLG4scyxkKXt2YXIgaCx2LF8scCx5PWQ/ZnVuY3Rpb24oKXtyZXR1cm4gdH06Yyh0KSxiPXIobixzLGU/MjoxKSxnPTA7aWYoXCJmdW5jdGlvblwiIT10eXBlb2YgeSl0aHJvdyBUeXBlRXJyb3IodCtcIiBpcyBub3QgaXRlcmFibGUhXCIpO2lmKGkoeSkpe2ZvcihoPWEodC5sZW5ndGgpO2g+ZztnKyspaWYocD1lP2IodSh2PXRbZ10pWzBdLHZbMV0pOmIodFtnXSkscD09PWx8fHA9PT1mKXJldHVybiBwfWVsc2UgZm9yKF89eS5jYWxsKHQpOyEodj1fLm5leHQoKSkuZG9uZTspaWYocD1vKF8sYix2LnZhbHVlLGUpLHA9PT1sfHxwPT09ZilyZXR1cm4gcH07ZS5CUkVBSz1sLGUuUkVUVVJOPWZ9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjt2YXIgcj1uKDExKSxvPW4oMTIpLGk9bigxNiksdT1uKDIwKSxhPW4oNDUpKFwic3BlY2llc1wiKTt0LmV4cG9ydHM9ZnVuY3Rpb24odCl7dmFyIGU9XCJmdW5jdGlvblwiPT10eXBlb2Ygb1t0XT9vW3RdOnJbdF07dSYmZSYmIWVbYV0mJmkuZihlLGEse2NvbmZpZ3VyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpc319KX19LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjt2YXIgcj1uKDExKSxvPW4oMTApLGk9big2NSksdT1uKDIxKSxhPW4oMTUpLGM9bigxMDApLGw9bigxMDIpLGY9bigxMDEpLHM9bigxOCksZD1uKDQ0KSxoPW4oMTYpLmYsdj1uKDEwNSkoMCksXz1uKDIwKTt0LmV4cG9ydHM9ZnVuY3Rpb24odCxlLG4scCx5LGIpe3ZhciBnPXJbdF0sbT1nLHg9eT9cInNldFwiOlwiYWRkXCIsUz1tJiZtLnByb3RvdHlwZSxFPXt9O3JldHVybiBfJiZcImZ1bmN0aW9uXCI9PXR5cGVvZiBtJiYoYnx8Uy5mb3JFYWNoJiYhdShmdW5jdGlvbigpeyhuZXcgbSkuZW50cmllcygpLm5leHQoKX0pKT8obT1lKGZ1bmN0aW9uKGUsbil7ZihlLG0sdCxcIl9jXCIpLGUuX2M9bmV3IGcsdm9pZCAwIT1uJiZsKG4seSxlW3hdLGUpfSksdihcImFkZCxjbGVhcixkZWxldGUsZm9yRWFjaCxnZXQsaGFzLHNldCxrZXlzLHZhbHVlcyxlbnRyaWVzLHRvSlNPTlwiLnNwbGl0KFwiLFwiKSxmdW5jdGlvbih0KXt2YXIgZT1cImFkZFwiPT10fHxcInNldFwiPT10O3QgaW4gUyYmKCFifHxcImNsZWFyXCIhPXQpJiZhKG0ucHJvdG90eXBlLHQsZnVuY3Rpb24obixyKXtpZihmKHRoaXMsbSx0KSwhZSYmYiYmIXMobikpcmV0dXJuXCJnZXRcIj09dCYmdm9pZCAwO3ZhciBvPXRoaXMuX2NbdF0oMD09PW4/MDpuLHIpO3JldHVybiBlP3RoaXM6b30pfSksXCJzaXplXCJpbiBTJiZoKG0ucHJvdG90eXBlLFwic2l6ZVwiLHtnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy5fYy5zaXplfX0pKToobT1wLmdldENvbnN0cnVjdG9yKGUsdCx5LHgpLGMobS5wcm90b3R5cGUsbiksaS5ORUVEPSEwKSxkKG0sdCksRVt0XT1tLG8oby5HK28uVytvLkYsRSksYnx8cC5zZXRTdHJvbmcobSx0LHkpLG19fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigxMyksbz1uKDM0KSxpPW4oNDcpLHU9bigzNyksYT1uKDEwNik7dC5leHBvcnRzPWZ1bmN0aW9uKHQsZSl7dmFyIG49MT09dCxjPTI9PXQsbD0zPT10LGY9ND09dCxzPTY9PXQsZD01PT10fHxzLGg9ZXx8YTtyZXR1cm4gZnVuY3Rpb24oZSxhLHYpe2Zvcih2YXIgXyxwLHk9aShlKSxiPW8oeSksZz1yKGEsdiwzKSxtPXUoYi5sZW5ndGgpLHg9MCxTPW4/aChlLG0pOmM/aChlLDApOnZvaWQgMDttPng7eCsrKWlmKChkfHx4IGluIGIpJiYoXz1iW3hdLHA9ZyhfLHgseSksdCkpaWYobilTW3hdPXA7ZWxzZSBpZihwKXN3aXRjaCh0KXtjYXNlIDM6cmV0dXJuITA7Y2FzZSA1OnJldHVybiBfO2Nhc2UgNjpyZXR1cm4geDtjYXNlIDI6Uy5wdXNoKF8pfWVsc2UgaWYoZilyZXR1cm4hMTtyZXR1cm4gcz8tMTpsfHxmP2Y6U319fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigxMDcpO3QuZXhwb3J0cz1mdW5jdGlvbih0LGUpe3JldHVybiBuZXcocih0KSkoZSl9fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigxOCksbz1uKDcxKSxpPW4oNDUpKFwic3BlY2llc1wiKTt0LmV4cG9ydHM9ZnVuY3Rpb24odCl7dmFyIGU7cmV0dXJuIG8odCkmJihlPXQuY29uc3RydWN0b3IsXCJmdW5jdGlvblwiIT10eXBlb2YgZXx8ZSE9PUFycmF5JiYhbyhlLnByb3RvdHlwZSl8fChlPXZvaWQgMCkscihlKSYmKGU9ZVtpXSxudWxsPT09ZSYmKGU9dm9pZCAwKSkpLHZvaWQgMD09PWU/QXJyYXk6ZX19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDEwKTtyKHIuUCtyLlIsXCJNYXBcIix7dG9KU09OOm4oMTA5KShcIk1hcFwiKX0pfSxmdW5jdGlvbih0LGUsbil7dmFyIHI9big1Myksbz1uKDExMCk7dC5leHBvcnRzPWZ1bmN0aW9uKHQpe3JldHVybiBmdW5jdGlvbigpe2lmKHIodGhpcykhPXQpdGhyb3cgVHlwZUVycm9yKHQrXCIjdG9KU09OIGlzbid0IGdlbmVyaWNcIik7cmV0dXJuIG8odGhpcyl9fX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMTAyKTt0LmV4cG9ydHM9ZnVuY3Rpb24odCxlKXt2YXIgbj1bXTtyZXR1cm4gcih0LCExLG4ucHVzaCxuLGUpLG59fSxmdW5jdGlvbih0LGUpe1widXNlIHN0cmljdFwiO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO2Uuc2VsZWN0b3JzPVwic2Nyb2xsYmFyLCBbc2Nyb2xsYmFyXSwgW2RhdGEtc2Nyb2xsYmFyXVwifSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19dmFyIG89big4NiksaT1yKG8pLHU9big5MCksYT1yKHUpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO3ZhciBjPW4oMTEzKTsoMCxhLmRlZmF1bHQpKGMpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBjW3RdfX0pfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX12YXIgbz1uKDg2KSxpPXIobyksdT1uKDkwKSxhPXIodSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSk7dmFyIGM9bigxMTQpOygwLGEuZGVmYXVsdCkoYykuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGNbdF19fSl9KTt2YXIgbD1uKDExNSk7KDAsYS5kZWZhdWx0KShsKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gbFt0XX19KX0pO3ZhciBmPW4oMTE2KTsoMCxhLmRlZmF1bHQpKGYpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBmW3RdfX0pfSk7dmFyIHM9bigxMTcpOygwLGEuZGVmYXVsdCkocykuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHNbdF19fSl9KTt2YXIgZD1uKDExOCk7KDAsYS5kZWZhdWx0KShkKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gZFt0XX19KX0pO3ZhciBoPW4oMTE5KTsoMCxhLmRlZmF1bHQpKGgpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBoW3RdfX0pfSk7dmFyIHY9bigxMjApOygwLGEuZGVmYXVsdCkodikuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHZbdF19fSl9KTt2YXIgXz1uKDEyMSk7KDAsYS5kZWZhdWx0KShfKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gX1t0XX19KX0pO3ZhciBwPW4oMTIyKTsoMCxhLmRlZmF1bHQpKHApLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBwW3RdfX0pfSk7dmFyIHk9bigxMjMpOygwLGEuZGVmYXVsdCkoeSkuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHlbdF19fSl9KTt2YXIgYj1uKDEyNCk7KDAsYS5kZWZhdWx0KShiKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gYlt0XX19KX0pfSxmdW5jdGlvbih0LGUpe1widXNlIHN0cmljdFwiO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO2UuYnVpbGRDdXJ2ZT1mdW5jdGlvbih0LGUpe2lmKGU8PTApcmV0dXJuW3RdO2Zvcih2YXIgbj1bXSxyPU1hdGgucm91bmQoZS8xZTMqNjApLTEsbz10P01hdGgucG93KDEvTWF0aC5hYnModCksMS9yKTowLGk9MTtpPD1yO2krKyluLnB1c2godC10Kk1hdGgucG93KG8saSkpO3JldHVybiBuLnB1c2godCksbn19LGZ1bmN0aW9uKHQsZSl7XCJ1c2Ugc3RyaWN0XCI7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSk7dmFyIG49MTAwO2UuZGVib3VuY2U9ZnVuY3Rpb24odCl7dmFyIGU9YXJndW1lbnRzLmxlbmd0aD4xJiZ2b2lkIDAhPT1hcmd1bWVudHNbMV0/YXJndW1lbnRzWzFdOm4scj0hKGFyZ3VtZW50cy5sZW5ndGg+MiYmdm9pZCAwIT09YXJndW1lbnRzWzJdKXx8YXJndW1lbnRzWzJdO2lmKFwiZnVuY3Rpb25cIj09dHlwZW9mIHQpe3ZhciBvPXZvaWQgMDtyZXR1cm4gZnVuY3Rpb24oKXtmb3IodmFyIG49YXJndW1lbnRzLmxlbmd0aCxpPUFycmF5KG4pLHU9MDt1PG47dSsrKWlbdV09YXJndW1lbnRzW3VdOyFvJiZyJiZzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7cmV0dXJuIHQuYXBwbHkodm9pZCAwLGkpfSksY2xlYXJUaW1lb3V0KG8pLG89c2V0VGltZW91dChmdW5jdGlvbigpe289dm9pZCAwLHQuYXBwbHkodm9pZCAwLGkpfSxlKX19fX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fWZ1bmN0aW9uIG8odCl7aWYoQXJyYXkuaXNBcnJheSh0KSl7Zm9yKHZhciBlPTAsbj1BcnJheSh0Lmxlbmd0aCk7ZTx0Lmxlbmd0aDtlKyspbltlXT10W2VdO3JldHVybiBufXJldHVybigwLHUuZGVmYXVsdCkodCl9dmFyIGk9bigyKSx1PXIoaSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwXG59KTtlLmZpbmRDaGlsZD1mdW5jdGlvbih0LGUpe3ZhciBuPXQuY2hpbGRyZW4scj1udWxsO3JldHVybiBuJiZbXS5jb25jYXQobyhuKSkuc29tZShmdW5jdGlvbih0KXtpZih0LmNsYXNzTmFtZS5tYXRjaChlKSlyZXR1cm4gcj10LCEwfSkscn19LGZ1bmN0aW9uKHQsZSl7XCJ1c2Ugc3RyaWN0XCI7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSk7dmFyIG49e1NUQU5EQVJEOjEsT1RIRVJTOi0zfSxyPVsxLDI4LDUwMF0sbz1mdW5jdGlvbih0KXtyZXR1cm4gclt0XXx8clswXX07ZS5nZXREZWx0YT1mdW5jdGlvbih0KXtpZihcImRlbHRhWFwiaW4gdCl7dmFyIGU9byh0LmRlbHRhTW9kZSk7cmV0dXJue3g6dC5kZWx0YVgvbi5TVEFOREFSRCplLHk6dC5kZWx0YVkvbi5TVEFOREFSRCplfX1yZXR1cm5cIndoZWVsRGVsdGFYXCJpbiB0P3t4OnQud2hlZWxEZWx0YVgvbi5PVEhFUlMseTp0LndoZWVsRGVsdGFZL24uT1RIRVJTfTp7eDowLHk6dC53aGVlbERlbHRhL24uT1RIRVJTfX19LGZ1bmN0aW9uKHQsZSl7XCJ1c2Ugc3RyaWN0XCI7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSk7ZS5nZXRQb2ludGVyRGF0YT1mdW5jdGlvbih0KXtyZXR1cm4gdC50b3VjaGVzP3QudG91Y2hlc1t0LnRvdWNoZXMubGVuZ3RoLTFdOnR9fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSksZS5nZXRQb3NpdGlvbj12b2lkIDA7dmFyIHI9bigxMTgpO2UuZ2V0UG9zaXRpb249ZnVuY3Rpb24odCl7dmFyIGU9KDAsci5nZXRQb2ludGVyRGF0YSkodCk7cmV0dXJue3g6ZS5jbGllbnRYLHk6ZS5jbGllbnRZfX19LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KSxlLmdldFRvdWNoSUQ9dm9pZCAwO3ZhciByPW4oMTE4KTtlLmdldFRvdWNoSUQ9ZnVuY3Rpb24odCl7dmFyIGU9KDAsci5nZXRQb2ludGVyRGF0YSkodCk7cmV0dXJuIGUuaWRlbnRpZmllcn19LGZ1bmN0aW9uKHQsZSl7XCJ1c2Ugc3RyaWN0XCI7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSk7ZS5pc09uZU9mPWZ1bmN0aW9uKHQpe3ZhciBlPWFyZ3VtZW50cy5sZW5ndGg+MSYmdm9pZCAwIT09YXJndW1lbnRzWzFdP2FyZ3VtZW50c1sxXTpbXTtyZXR1cm4gZS5zb21lKGZ1bmN0aW9uKGUpe3JldHVybiB0PT09ZX0pfX0sZnVuY3Rpb24odCxlKXtcInVzZSBzdHJpY3RcIjtPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KTtlLnBpY2tJblJhbmdlPWZ1bmN0aW9uKHQpe3ZhciBlPWFyZ3VtZW50cy5sZW5ndGg+MSYmdm9pZCAwIT09YXJndW1lbnRzWzFdP2FyZ3VtZW50c1sxXTotKDEvMCksbj1hcmd1bWVudHMubGVuZ3RoPjImJnZvaWQgMCE9PWFyZ3VtZW50c1syXT9hcmd1bWVudHNbMl06MS8wO3JldHVybiBNYXRoLm1heChlLE1hdGgubWluKHQsbikpfX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fXZhciBvPW4oOTApLGk9cihvKTtPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KTt2YXIgdT1bXCJ3ZWJraXRcIixcIm1velwiLFwibXNcIixcIm9cIl0sYT1uZXcgUmVnRXhwKFwiXi0oPyEoPzpcIit1LmpvaW4oXCJ8XCIpK1wiKS0pXCIpLGM9ZnVuY3Rpb24odCl7dmFyIGU9e307cmV0dXJuKDAsaS5kZWZhdWx0KSh0KS5mb3JFYWNoKGZ1bmN0aW9uKG4pe2lmKCFhLnRlc3QobikpcmV0dXJuIHZvaWQoZVtuXT10W25dKTt2YXIgcj10W25dO249bi5yZXBsYWNlKC9eLS8sXCJcIiksZVtuXT1yLHUuZm9yRWFjaChmdW5jdGlvbih0KXtlW1wiLVwiK3QrXCItXCIrbl09cn0pfSksZX07ZS5zZXRTdHlsZT1mdW5jdGlvbih0LGUpe2U9YyhlKSwoMCxpLmRlZmF1bHQpKGUpLmZvckVhY2goZnVuY3Rpb24obil7dmFyIHI9bi5yZXBsYWNlKC9eLS8sXCJcIikucmVwbGFjZSgvLShbYS16XSkvZyxmdW5jdGlvbih0LGUpe3JldHVybiBlLnRvVXBwZXJDYXNlKCl9KTt0LnN0eWxlW3JdPWVbbl19KX19LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX1mdW5jdGlvbiBvKHQpe2lmKEFycmF5LmlzQXJyYXkodCkpe2Zvcih2YXIgZT0wLG49QXJyYXkodC5sZW5ndGgpO2U8dC5sZW5ndGg7ZSsrKW5bZV09dFtlXTtyZXR1cm4gbn1yZXR1cm4oMCxhLmRlZmF1bHQpKHQpfWZ1bmN0aW9uIGkodCxlKXtpZighKHQgaW5zdGFuY2VvZiBlKSl0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpfXZhciB1PW4oMiksYT1yKHUpLGM9big4NiksbD1yKGMpLGY9bigxMjUpLHM9cihmKTtPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KSxlLlRvdWNoUmVjb3JkPXZvaWQgMDt2YXIgZD1zLmRlZmF1bHR8fGZ1bmN0aW9uKHQpe2Zvcih2YXIgZT0xO2U8YXJndW1lbnRzLmxlbmd0aDtlKyspe3ZhciBuPWFyZ3VtZW50c1tlXTtmb3IodmFyIHIgaW4gbilPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobixyKSYmKHRbcl09bltyXSl9cmV0dXJuIHR9LGg9ZnVuY3Rpb24oKXtmdW5jdGlvbiB0KHQsZSl7Zm9yKHZhciBuPTA7bjxlLmxlbmd0aDtuKyspe3ZhciByPWVbbl07ci5lbnVtZXJhYmxlPXIuZW51bWVyYWJsZXx8ITEsci5jb25maWd1cmFibGU9ITAsXCJ2YWx1ZVwiaW4gciYmKHIud3JpdGFibGU9ITApLCgwLGwuZGVmYXVsdCkodCxyLmtleSxyKX19cmV0dXJuIGZ1bmN0aW9uKGUsbixyKXtyZXR1cm4gbiYmdChlLnByb3RvdHlwZSxuKSxyJiZ0KGUsciksZX19KCksdj1uKDExOSksXz1mdW5jdGlvbigpe2Z1bmN0aW9uIHQoZSl7aSh0aGlzLHQpLHRoaXMudXBkYXRlVGltZT1EYXRlLm5vdygpLHRoaXMuZGVsdGE9e3g6MCx5OjB9LHRoaXMudmVsb2NpdHk9e3g6MCx5OjB9LHRoaXMubGFzdFBvc2l0aW9uPSgwLHYuZ2V0UG9zaXRpb24pKGUpfXJldHVybiBoKHQsW3trZXk6XCJ1cGRhdGVcIix2YWx1ZTpmdW5jdGlvbih0KXt2YXIgZT10aGlzLnZlbG9jaXR5LG49dGhpcy51cGRhdGVUaW1lLHI9dGhpcy5sYXN0UG9zaXRpb24sbz1EYXRlLm5vdygpLGk9KDAsdi5nZXRQb3NpdGlvbikodCksdT17eDotKGkueC1yLngpLHk6LShpLnktci55KX0sYT1vLW58fDE2LGM9dS54L2EqMWUzLGw9dS55L2EqMWUzO2UueD0uOCpjKy4yKmUueCxlLnk9LjgqbCsuMiplLnksdGhpcy5kZWx0YT11LHRoaXMudXBkYXRlVGltZT1vLHRoaXMubGFzdFBvc2l0aW9uPWl9fV0pLHR9KCk7ZS5Ub3VjaFJlY29yZD1mdW5jdGlvbigpe2Z1bmN0aW9uIHQoKXtpKHRoaXMsdCksdGhpcy50b3VjaExpc3Q9e30sdGhpcy5sYXN0VG91Y2g9bnVsbCx0aGlzLmFjdGl2ZVRvdWNoSUQ9dm9pZCAwfXJldHVybiBoKHQsW3trZXk6XCJfX2FkZFwiLHZhbHVlOmZ1bmN0aW9uKHQpe2lmKHRoaXMuX19oYXModCkpcmV0dXJuIG51bGw7dmFyIGU9bmV3IF8odCk7cmV0dXJuIHRoaXMudG91Y2hMaXN0W3QuaWRlbnRpZmllcl09ZSxlfX0se2tleTpcIl9fcmVuZXdcIix2YWx1ZTpmdW5jdGlvbih0KXtpZighdGhpcy5fX2hhcyh0KSlyZXR1cm4gbnVsbDt2YXIgZT10aGlzLnRvdWNoTGlzdFt0LmlkZW50aWZpZXJdO3JldHVybiBlLnVwZGF0ZSh0KSxlfX0se2tleTpcIl9fZGVsZXRlXCIsdmFsdWU6ZnVuY3Rpb24odCl7cmV0dXJuIGRlbGV0ZSB0aGlzLnRvdWNoTGlzdFt0LmlkZW50aWZpZXJdfX0se2tleTpcIl9faGFzXCIsdmFsdWU6ZnVuY3Rpb24odCl7cmV0dXJuIHRoaXMudG91Y2hMaXN0Lmhhc093blByb3BlcnR5KHQuaWRlbnRpZmllcil9fSx7a2V5OlwiX19zZXRBY3RpdmVJRFwiLHZhbHVlOmZ1bmN0aW9uKHQpe3RoaXMuYWN0aXZlVG91Y2hJRD10W3QubGVuZ3RoLTFdLmlkZW50aWZpZXIsdGhpcy5sYXN0VG91Y2g9dGhpcy50b3VjaExpc3RbdGhpcy5hY3RpdmVUb3VjaElEXX19LHtrZXk6XCJfX2dldEFjdGl2ZVRyYWNrZXJcIix2YWx1ZTpmdW5jdGlvbigpe3ZhciB0PXRoaXMudG91Y2hMaXN0LGU9dGhpcy5hY3RpdmVUb3VjaElEO3JldHVybiB0W2VdfX0se2tleTpcImlzQWN0aXZlXCIsdmFsdWU6ZnVuY3Rpb24oKXtyZXR1cm4gdm9pZCAwIT09dGhpcy5hY3RpdmVUb3VjaElEfX0se2tleTpcImdldERlbHRhXCIsdmFsdWU6ZnVuY3Rpb24oKXt2YXIgdD10aGlzLl9fZ2V0QWN0aXZlVHJhY2tlcigpO3JldHVybiB0P2Qoe30sdC5kZWx0YSk6dGhpcy5fX3ByaW1pdGl2ZVZhbHVlfX0se2tleTpcImdldFZlbG9jaXR5XCIsdmFsdWU6ZnVuY3Rpb24oKXt2YXIgdD10aGlzLl9fZ2V0QWN0aXZlVHJhY2tlcigpO3JldHVybiB0P2Qoe30sdC52ZWxvY2l0eSk6dGhpcy5fX3ByaW1pdGl2ZVZhbHVlfX0se2tleTpcImdldExhc3RQb3NpdGlvblwiLHZhbHVlOmZ1bmN0aW9uKCl7dmFyIHQ9YXJndW1lbnRzLmxlbmd0aD4wJiZ2b2lkIDAhPT1hcmd1bWVudHNbMF0/YXJndW1lbnRzWzBdOlwiXCIsZT10aGlzLl9fZ2V0QWN0aXZlVHJhY2tlcigpfHx0aGlzLmxhc3RUb3VjaCxuPWU/ZS5sYXN0UG9zaXRpb246dGhpcy5fX3ByaW1pdGl2ZVZhbHVlO3JldHVybiB0P24uaGFzT3duUHJvcGVydHkodCk/blt0XTowOmQoe30sbil9fSx7a2V5OlwidXBkYXRlZFJlY2VudGx5XCIsdmFsdWU6ZnVuY3Rpb24oKXt2YXIgdD10aGlzLl9fZ2V0QWN0aXZlVHJhY2tlcigpO3JldHVybiB0JiZEYXRlLm5vdygpLXQudXBkYXRlVGltZTwzMH19LHtrZXk6XCJ0cmFja1wiLHZhbHVlOmZ1bmN0aW9uKHQpe3ZhciBlPXRoaXMsbj10LnRhcmdldFRvdWNoZXM7cmV0dXJuW10uY29uY2F0KG8obikpLmZvckVhY2goZnVuY3Rpb24odCl7ZS5fX2FkZCh0KX0pLHRoaXMudG91Y2hMaXN0fX0se2tleTpcInVwZGF0ZVwiLHZhbHVlOmZ1bmN0aW9uKHQpe3ZhciBlPXRoaXMsbj10LnRvdWNoZXMscj10LmNoYW5nZWRUb3VjaGVzO3JldHVybltdLmNvbmNhdChvKG4pKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe2UuX19yZW5ldyh0KX0pLHRoaXMuX19zZXRBY3RpdmVJRChyKSx0aGlzLnRvdWNoTGlzdH19LHtrZXk6XCJyZWxlYXNlXCIsdmFsdWU6ZnVuY3Rpb24odCl7dmFyIGU9dGhpcztyZXR1cm4gdGhpcy5hY3RpdmVUb3VjaElEPXZvaWQgMCxbXS5jb25jYXQobyh0LmNoYW5nZWRUb3VjaGVzKSkuZm9yRWFjaChmdW5jdGlvbih0KXtlLl9fZGVsZXRlKHQpfSksdGhpcy50b3VjaExpc3R9fSx7a2V5OlwiX19wcmltaXRpdmVWYWx1ZVwiLGdldDpmdW5jdGlvbigpe3JldHVybnt4OjAseTowfX19XSksdH0oKX0sZnVuY3Rpb24odCxlLG4pe3QuZXhwb3J0cz17ZGVmYXVsdDpuKDEyNiksX19lc01vZHVsZTohMH19LGZ1bmN0aW9uKHQsZSxuKXtuKDEyNyksdC5leHBvcnRzPW4oMTIpLk9iamVjdC5hc3NpZ259LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDEwKTtyKHIuUytyLkYsXCJPYmplY3RcIix7YXNzaWduOm4oMTI4KX0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHI9bigzMSksbz1uKDY5KSxpPW4oNzApLHU9big0NyksYT1uKDM0KSxjPU9iamVjdC5hc3NpZ247dC5leHBvcnRzPSFjfHxuKDIxKShmdW5jdGlvbigpe3ZhciB0PXt9LGU9e30sbj1TeW1ib2woKSxyPVwiYWJjZGVmZ2hpamtsbW5vcHFyc3RcIjtyZXR1cm4gdFtuXT03LHIuc3BsaXQoXCJcIikuZm9yRWFjaChmdW5jdGlvbih0KXtlW3RdPXR9KSw3IT1jKHt9LHQpW25dfHxPYmplY3Qua2V5cyhjKHt9LGUpKS5qb2luKFwiXCIpIT1yfSk/ZnVuY3Rpb24odCxlKXtmb3IodmFyIG49dSh0KSxjPWFyZ3VtZW50cy5sZW5ndGgsbD0xLGY9by5mLHM9aS5mO2M+bDspZm9yKHZhciBkLGg9YShhcmd1bWVudHNbbCsrXSksdj1mP3IoaCkuY29uY2F0KGYoaCkpOnIoaCksXz12Lmxlbmd0aCxwPTA7Xz5wOylzLmNhbGwoaCxkPXZbcCsrXSkmJihuW2RdPWhbZF0pO3JldHVybiBufTpjfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19dmFyIG89big4NiksaT1yKG8pLHU9big5MCksYT1yKHUpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO3ZhciBjPW4oMTMwKTsoMCxhLmRlZmF1bHQpKGMpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBjW3RdfX0pfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX12YXIgbz1uKDg2KSxpPXIobyksdT1uKDkwKSxhPXIodSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSk7dmFyIGM9bigxMzEpOygwLGEuZGVmYXVsdCkoYykuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGNbdF19fSl9KTt2YXIgbD1uKDEzMik7KDAsYS5kZWZhdWx0KShsKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gbFt0XX19KX0pO3ZhciBmPW4oMTMzKTsoMCxhLmRlZmF1bHQpKGYpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBmW3RdfX0pfSk7dmFyIHM9bigxMzQpOygwLGEuZGVmYXVsdCkocykuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHNbdF19fSl9KTt2YXIgZD1uKDEzNSk7KDAsYS5kZWZhdWx0KShkKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gZFt0XX19KX0pO3ZhciBoPW4oMTM2KTsoMCxhLmRlZmF1bHQpKGgpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBoW3RdfX0pfSk7dmFyIHY9bigxMzcpOygwLGEuZGVmYXVsdCkodikuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHZbdF19fSl9KTt2YXIgXz1uKDEzOCk7KDAsYS5kZWZhdWx0KShfKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gX1t0XX19KX0pO3ZhciBwPW4oMTM5KTsoMCxhLmRlZmF1bHQpKHApLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBwW3RdfX0pfSk7dmFyIHk9bigxNDApOygwLGEuZGVmYXVsdCkoeSkuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHlbdF19fSl9KTt2YXIgYj1uKDE0MSk7KDAsYS5kZWZhdWx0KShiKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gYlt0XX19KX0pO3ZhciBnPW4oMTQyKTsoMCxhLmRlZmF1bHQpKGcpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBnW3RdfX0pfSk7dmFyIG09bigxNDMpOygwLGEuZGVmYXVsdCkobSkuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIG1bdF19fSl9KTt2YXIgeD1uKDE0NCk7KDAsYS5kZWZhdWx0KSh4KS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4geFt0XX19KX0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHI9big3OCk7ci5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLmNsZWFyTW92ZW1lbnQ9ci5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLnN0b3A9ZnVuY3Rpb24oKXt0aGlzLm1vdmVtZW50Lng9dGhpcy5tb3ZlbWVudC55PTAsY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5fX3RpbWVySUQuc2Nyb2xsVG8pfX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fWZ1bmN0aW9uIG8odCl7aWYoQXJyYXkuaXNBcnJheSh0KSl7Zm9yKHZhciBlPTAsbj1BcnJheSh0Lmxlbmd0aCk7ZTx0Lmxlbmd0aDtlKyspbltlXT10W2VdO3JldHVybiBufXJldHVybigwLHUuZGVmYXVsdCkodCl9dmFyIGk9bigyKSx1PXIoaSksYT1uKDc4KSxjPW4oMTEyKSxsPW4oODkpO2EuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZS5kZXN0cm95PWZ1bmN0aW9uKHQpe3ZhciBlPXRoaXMuX19saXN0ZW5lcnMsbj10aGlzLl9faGFuZGxlcnMscj10aGlzLl9fb2JzZXJ2ZXIsaT10aGlzLnRhcmdldHMsdT1pLmNvbnRhaW5lcixhPWkuY29udGVudDtpZihuLmZvckVhY2goZnVuY3Rpb24odCl7dmFyIGU9dC5ldnQsbj10LmVsZW0scj10LmZuO24ucmVtb3ZlRXZlbnRMaXN0ZW5lcihlLHIpfSksbi5sZW5ndGg9ZS5sZW5ndGg9MCx0aGlzLnN0b3AoKSxjYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLl9fdGltZXJJRC5yZW5kZXIpLHImJnIuZGlzY29ubmVjdCgpLGwuc2JMaXN0LmRlbGV0ZSh1KSwhdCYmdS5wYXJlbnROb2RlKXtmb3IodmFyIGY9W10uY29uY2F0KG8oYS5jaGlsZE5vZGVzKSk7dS5maXJzdENoaWxkOyl1LnJlbW92ZUNoaWxkKHUuZmlyc3RDaGlsZCk7Zi5mb3JFYWNoKGZ1bmN0aW9uKHQpe3JldHVybiB1LmFwcGVuZENoaWxkKHQpfSksKDAsYy5zZXRTdHlsZSkodSx7b3ZlcmZsb3c6XCJcIn0pLHUuc2Nyb2xsVG9wPXRoaXMuc2Nyb2xsVG9wLHUuc2Nyb2xsTGVmdD10aGlzLnNjcm9sbExlZnR9fX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO3ZhciByPW4oNzgpO3IuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZS5nZXRDb250ZW50RWxlbT1mdW5jdGlvbigpe3JldHVybiB0aGlzLnRhcmdldHMuY29udGVudH19LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjt2YXIgcj1uKDc4KTtyLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUuZ2V0U2l6ZT1mdW5jdGlvbigpe3ZhciB0PXRoaXMudGFyZ2V0cy5jb250YWluZXIsZT10aGlzLnRhcmdldHMuY29udGVudDtyZXR1cm57Y29udGFpbmVyOnt3aWR0aDp0LmNsaWVudFdpZHRoLGhlaWdodDp0LmNsaWVudEhlaWdodH0sY29udGVudDp7d2lkdGg6ZS5vZmZzZXRXaWR0aC1lLmNsaWVudFdpZHRoK2Uuc2Nyb2xsV2lkdGgsaGVpZ2h0OmUub2Zmc2V0SGVpZ2h0LWUuY2xpZW50SGVpZ2h0K2Uuc2Nyb2xsSGVpZ2h0fX19fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHI9big3OCk7ci5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLmluZmluaXRlU2Nyb2xsPWZ1bmN0aW9uKHQpe3ZhciBlPWFyZ3VtZW50cy5sZW5ndGg+MSYmdm9pZCAwIT09YXJndW1lbnRzWzFdP2FyZ3VtZW50c1sxXTo1MDtpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiB0KXt2YXIgbj17eDowLHk6MH0scj0hMTt0aGlzLmFkZExpc3RlbmVyKGZ1bmN0aW9uKG8pe3ZhciBpPW8ub2Zmc2V0LHU9by5saW1pdDt1LnktaS55PD1lJiZpLnk+bi55JiYhciYmKHI9ITAsc2V0VGltZW91dChmdW5jdGlvbigpe3JldHVybiB0KG8pfSkpLHUueS1pLnk+ZSYmKHI9ITEpLG49aX0pfX19LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjt2YXIgcj1uKDc4KTtyLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUuaXNWaXNpYmxlPWZ1bmN0aW9uKHQpe3ZhciBlPXRoaXMuYm91bmRpbmcsbj10LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLHI9TWF0aC5tYXgoZS50b3Asbi50b3ApLG89TWF0aC5tYXgoZS5sZWZ0LG4ubGVmdCksaT1NYXRoLm1pbihlLnJpZ2h0LG4ucmlnaHQpLHU9TWF0aC5taW4oZS5ib3R0b20sbi5ib3R0b20pO3JldHVybiByPHUmJm88aX19LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjt2YXIgcj1uKDc4KTtyLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUuYWRkTGlzdGVuZXI9ZnVuY3Rpb24odCl7XCJmdW5jdGlvblwiPT10eXBlb2YgdCYmdGhpcy5fX2xpc3RlbmVycy5wdXNoKHQpfSxyLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXI9ZnVuY3Rpb24odCl7XCJmdW5jdGlvblwiPT10eXBlb2YgdCYmdGhpcy5fX2xpc3RlbmVycy5zb21lKGZ1bmN0aW9uKGUsbixyKXtyZXR1cm4gZT09PXQmJnIuc3BsaWNlKG4sMSl9KX19LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX1mdW5jdGlvbiBvKHQsZSxuKXtyZXR1cm4gZSBpbiB0PygwLGwuZGVmYXVsdCkodCxlLHt2YWx1ZTpuLGVudW1lcmFibGU6ITAsY29uZmlndXJhYmxlOiEwLHdyaXRhYmxlOiEwfSk6dFtlXT1uLHR9ZnVuY3Rpb24gaSh0LGUpe3JldHVybiEhZS5sZW5ndGgmJmUuc29tZShmdW5jdGlvbihlKXtyZXR1cm4gdC5tYXRjaChlKX0pfWZ1bmN0aW9uIHUoKXt2YXIgdD1hcmd1bWVudHMubGVuZ3RoPjAmJnZvaWQgMCE9PWFyZ3VtZW50c1swXT9hcmd1bWVudHNbMF06cy5SRUdJRVNURVIsZT1kW3RdO3JldHVybiBmdW5jdGlvbigpe2Zvcih2YXIgbj1hcmd1bWVudHMubGVuZ3RoLHI9QXJyYXkobiksbz0wO288bjtvKyspcltvXT1hcmd1bWVudHNbb107dGhpcy5fX2hhbmRsZXJzLmZvckVhY2goZnVuY3Rpb24obil7dmFyIG89bi5lbGVtLHU9bi5ldnQsYT1uLmZuLGM9bi5oYXNSZWdpc3RlcmVkO2MmJnQ9PT1zLlJFR0lFU1RFUnx8IWMmJnQ9PT1zLlVOUkVHSUVTVEVSfHxpKHUscikmJihvW2VdKHUsYSksbi5oYXNSZWdpc3RlcmVkPSFjKX0pfX12YXIgYSxjPW4oODYpLGw9cihjKSxmPW4oNzgpLHM9e1JFR0lFU1RFUjowLFVOUkVHSUVTVEVSOjF9LGQ9KGE9e30sbyhhLHMuUkVHSUVTVEVSLFwiYWRkRXZlbnRMaXN0ZW5lclwiKSxvKGEscy5VTlJFR0lFU1RFUixcInJlbW92ZUV2ZW50TGlzdGVuZXJcIiksYSk7Zi5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLnJlZ2lzdGVyRXZlbnRzPXUocy5SRUdJRVNURVIpLGYuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZS51bnJlZ2lzdGVyRXZlbnRzPXUocy5VTlJFR0lFU1RFUil9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjt2YXIgcj1uKDc4KTtyLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUuc2Nyb2xsSW50b1ZpZXc9ZnVuY3Rpb24odCl7dmFyIGU9YXJndW1lbnRzLmxlbmd0aD4xJiZ2b2lkIDAhPT1hcmd1bWVudHNbMV0/YXJndW1lbnRzWzFdOnt9LG49ZS5hbGlnblRvVG9wLHI9dm9pZCAwPT09bnx8bixvPWUub25seVNjcm9sbElmTmVlZGVkLGk9dm9pZCAwIT09byYmbyx1PWUub2Zmc2V0VG9wLGE9dm9pZCAwPT09dT8wOnUsYz1lLm9mZnNldExlZnQsbD12b2lkIDA9PT1jPzA6YyxmPWUub2Zmc2V0Qm90dG9tLHM9dm9pZCAwPT09Zj8wOmYsZD10aGlzLnRhcmdldHMsaD10aGlzLmJvdW5kaW5nO2lmKHQmJmQuY29udGFpbmVyLmNvbnRhaW5zKHQpKXt2YXIgdj10LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO2kmJnRoaXMuaXNWaXNpYmxlKHQpfHx0aGlzLl9fc2V0TW92ZW1lbnQodi5sZWZ0LWgubGVmdC1sLHI/di50b3AtaC50b3AtYTp2LmJvdHRvbS1oLmJvdHRvbS1zKX19fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHI9bigxMTIpLG89big3OCk7by5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLnNjcm9sbFRvPWZ1bmN0aW9uKCl7dmFyIHQ9YXJndW1lbnRzLmxlbmd0aD4wJiZ2b2lkIDAhPT1hcmd1bWVudHNbMF0/YXJndW1lbnRzWzBdOnRoaXMub2Zmc2V0LngsZT1hcmd1bWVudHMubGVuZ3RoPjEmJnZvaWQgMCE9PWFyZ3VtZW50c1sxXT9hcmd1bWVudHNbMV06dGhpcy5vZmZzZXQueSxuPXRoaXMsbz1hcmd1bWVudHMubGVuZ3RoPjImJnZvaWQgMCE9PWFyZ3VtZW50c1syXT9hcmd1bWVudHNbMl06MCxpPWFyZ3VtZW50cy5sZW5ndGg+MyYmdm9pZCAwIT09YXJndW1lbnRzWzNdP2FyZ3VtZW50c1szXTpudWxsLHU9dGhpcy5vcHRpb25zLGE9dGhpcy5vZmZzZXQsYz10aGlzLmxpbWl0LGw9dGhpcy5fX3RpbWVySUQ7Y2FuY2VsQW5pbWF0aW9uRnJhbWUobC5zY3JvbGxUbyksaT1cImZ1bmN0aW9uXCI9PXR5cGVvZiBpP2k6ZnVuY3Rpb24oKXt9LHUucmVuZGVyQnlQaXhlbHMmJih0PU1hdGgucm91bmQodCksZT1NYXRoLnJvdW5kKGUpKTt2YXIgZj1hLngscz1hLnksZD0oMCxyLnBpY2tJblJhbmdlKSh0LDAsYy54KS1mLGg9KDAsci5waWNrSW5SYW5nZSkoZSwwLGMueSktcyx2PSgwLHIuYnVpbGRDdXJ2ZSkoZCxvKSxfPSgwLHIuYnVpbGRDdXJ2ZSkoaCxvKSxwPXYubGVuZ3RoLHk9MCxiPWZ1bmN0aW9uIHQoKXtuLnNldFBvc2l0aW9uKGYrdlt5XSxzK19beV0pLHkrKyx5PT09cD9yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKXtpKG4pfSk6bC5zY3JvbGxUbz1yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodCl9O2IoKX19LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX12YXIgbz1uKDkwKSxpPXIobyksdT1uKDc4KTt1LlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUuc2V0T3B0aW9ucz1mdW5jdGlvbigpe3ZhciB0PXRoaXMsZT1hcmd1bWVudHMubGVuZ3RoPjAmJnZvaWQgMCE9PWFyZ3VtZW50c1swXT9hcmd1bWVudHNbMF06e307KDAsaS5kZWZhdWx0KShlKS5mb3JFYWNoKGZ1bmN0aW9uKG4pe3Qub3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShuKSYmdm9pZCAwIT09ZVtuXSYmKHQub3B0aW9uc1tuXT1lW25dKX0pfX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fXZhciBvPW4oMTI1KSxpPXIobyksdT1pLmRlZmF1bHR8fGZ1bmN0aW9uKHQpe2Zvcih2YXIgZT0xO2U8YXJndW1lbnRzLmxlbmd0aDtlKyspe3ZhciBuPWFyZ3VtZW50c1tlXTtmb3IodmFyIHIgaW4gbilPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobixyKSYmKHRbcl09bltyXSl9cmV0dXJuIHR9LGE9bigxMTIpLGM9big3OCk7Yy5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLnNldFBvc2l0aW9uPWZ1bmN0aW9uKCl7dmFyIHQ9YXJndW1lbnRzLmxlbmd0aD4wJiZ2b2lkIDAhPT1hcmd1bWVudHNbMF0/YXJndW1lbnRzWzBdOnRoaXMub2Zmc2V0LngsZT1hcmd1bWVudHMubGVuZ3RoPjEmJnZvaWQgMCE9PWFyZ3VtZW50c1sxXT9hcmd1bWVudHNbMV06dGhpcy5vZmZzZXQueSxuPWFyZ3VtZW50cy5sZW5ndGg+MiYmdm9pZCAwIT09YXJndW1lbnRzWzJdJiZhcmd1bWVudHNbMl07dGhpcy5fX2hpZGVUcmFja1Rocm90dGxlKCk7dmFyIHI9e30sbz10aGlzLm9wdGlvbnMsaT10aGlzLm9mZnNldCxjPXRoaXMubGltaXQsbD10aGlzLnRhcmdldHMsZj10aGlzLl9fbGlzdGVuZXJzO28ucmVuZGVyQnlQaXhlbHMmJih0PU1hdGgucm91bmQodCksZT1NYXRoLnJvdW5kKGUpKSx0IT09aS54JiZ0aGlzLnNob3dUcmFjayhcInhcIiksZSE9PWkueSYmdGhpcy5zaG93VHJhY2soXCJ5XCIpLHQ9KDAsYS5waWNrSW5SYW5nZSkodCwwLGMueCksZT0oMCxhLnBpY2tJblJhbmdlKShlLDAsYy55KSx0PT09aS54JiZlPT09aS55fHwoci5kaXJlY3Rpb249e3g6dD09PWkueD9cIm5vbmVcIjp0PmkueD9cInJpZ2h0XCI6XCJsZWZ0XCIseTplPT09aS55P1wibm9uZVwiOmU+aS55P1wiZG93blwiOlwidXBcIn0sdGhpcy5fX3JlYWRvbmx5KFwib2Zmc2V0XCIse3g6dCx5OmV9KSxyLmxpbWl0PXUoe30sYyksci5vZmZzZXQ9dSh7fSx0aGlzLm9mZnNldCksdGhpcy5fX3NldFRodW1iUG9zaXRpb24oKSwoMCxhLnNldFN0eWxlKShsLmNvbnRlbnQse1wiLXRyYW5zZm9ybVwiOlwidHJhbnNsYXRlM2QoXCIrLXQrXCJweCwgXCIrLWUrXCJweCwgMClcIn0pLG58fGYuZm9yRWFjaChmdW5jdGlvbih0KXtvLnN5bmNDYWxsYmFja3M/dChyKTpyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKXt0KHIpfSl9KSl9fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19ZnVuY3Rpb24gbyh0LGUsbil7cmV0dXJuIGUgaW4gdD8oMCxjLmRlZmF1bHQpKHQsZSx7dmFsdWU6bixlbnVtZXJhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMCx3cml0YWJsZTohMH0pOnRbZV09bix0fWZ1bmN0aW9uIGkoKXt2YXIgdD1hcmd1bWVudHMubGVuZ3RoPjAmJnZvaWQgMCE9PWFyZ3VtZW50c1swXT9hcmd1bWVudHNbMF06Zi5TSE9XLGU9ZFt0XTtyZXR1cm4gZnVuY3Rpb24oKXt2YXIgbj1hcmd1bWVudHMubGVuZ3RoPjAmJnZvaWQgMCE9PWFyZ3VtZW50c1swXT9hcmd1bWVudHNbMF06XCJib3RoXCIscj10aGlzLm9wdGlvbnMsbz10aGlzLm1vdmVtZW50LGk9dGhpcy50YXJnZXRzLHU9aS5jb250YWluZXIsYT1pLnhBeGlzLGM9aS55QXhpcztvLnh8fG8ueT91LmNsYXNzTGlzdC5hZGQocy5DT05UQUlORVIpOnUuY2xhc3NMaXN0LnJlbW92ZShzLkNPTlRBSU5FUiksci5hbHdheXNTaG93VHJhY2tzJiZ0PT09Zi5ISURFfHwobj1uLnRvTG93ZXJDYXNlKCksXCJib3RoXCI9PT1uJiYoYS50cmFjay5jbGFzc0xpc3RbZV0ocy5UUkFDSyksYy50cmFjay5jbGFzc0xpc3RbZV0ocy5UUkFDSykpLFwieFwiPT09biYmYS50cmFjay5jbGFzc0xpc3RbZV0ocy5UUkFDSyksXCJ5XCI9PT1uJiZjLnRyYWNrLmNsYXNzTGlzdFtlXShzLlRSQUNLKSl9fXZhciB1LGE9big4NiksYz1yKGEpLGw9big3OCksZj17U0hPVzowLEhJREU6MX0scz17VFJBQ0s6XCJzaG93XCIsQ09OVEFJTkVSOlwic2Nyb2xsaW5nXCJ9LGQ9KHU9e30sbyh1LGYuU0hPVyxcImFkZFwiKSxvKHUsZi5ISURFLFwicmVtb3ZlXCIpLHUpO2wuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZS5zaG93VHJhY2s9aShmLlNIT1cpLGwuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZS5oaWRlVHJhY2s9aShmLkhJREUpfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcigpe2lmKFwiZ2xvd1wiPT09dGhpcy5vcHRpb25zLm92ZXJzY3JvbGxFZmZlY3Qpe3ZhciB0PXRoaXMudGFyZ2V0cyxlPXRoaXMuc2l6ZSxuPXQuY2FudmFzLHI9bi5lbGVtLG89bi5jb250ZXh0LGk9d2luZG93LmRldmljZVBpeGVsUmF0aW98fDEsdT1lLmNvbnRhaW5lci53aWR0aCppLGE9ZS5jb250YWluZXIuaGVpZ2h0Kmk7dT09PXIud2lkdGgmJmE9PT1yLmhlaWdodHx8KHIud2lkdGg9dSxyLmhlaWdodD1hLG8uc2NhbGUoaSxpKSl9fWZ1bmN0aW9uIG8oKXt2YXIgdD10aGlzLnNpemUsZT10aGlzLnRodW1iU2l6ZSxuPXRoaXMudGFyZ2V0cyxyPW4ueEF4aXMsbz1uLnlBeGlzOygwLHUuc2V0U3R5bGUpKHIudHJhY2sse2Rpc3BsYXk6dC5jb250ZW50LndpZHRoPD10LmNvbnRhaW5lci53aWR0aD9cIm5vbmVcIjpcImJsb2NrXCJ9KSwoMCx1LnNldFN0eWxlKShvLnRyYWNrLHtkaXNwbGF5OnQuY29udGVudC5oZWlnaHQ8PXQuY29udGFpbmVyLmhlaWdodD9cIm5vbmVcIjpcImJsb2NrXCJ9KSwoMCx1LnNldFN0eWxlKShyLnRodW1iLHt3aWR0aDplLngrXCJweFwifSksKDAsdS5zZXRTdHlsZSkoby50aHVtYix7aGVpZ2h0OmUueStcInB4XCJ9KX1mdW5jdGlvbiBpKCl7dmFyIHQ9dGhpcy5vcHRpb25zO3RoaXMuX191cGRhdGVCb3VuZGluZygpO3ZhciBlPXRoaXMuZ2V0U2l6ZSgpLG49e3g6TWF0aC5tYXgoZS5jb250ZW50LndpZHRoLWUuY29udGFpbmVyLndpZHRoLDApLHk6TWF0aC5tYXgoZS5jb250ZW50LmhlaWdodC1lLmNvbnRhaW5lci5oZWlnaHQsMCl9LGk9e3JlYWxYOmUuY29udGFpbmVyLndpZHRoL2UuY29udGVudC53aWR0aCplLmNvbnRhaW5lci53aWR0aCxyZWFsWTplLmNvbnRhaW5lci5oZWlnaHQvZS5jb250ZW50LmhlaWdodCplLmNvbnRhaW5lci5oZWlnaHR9O2kueD1NYXRoLm1heChpLnJlYWxYLHQudGh1bWJNaW5TaXplKSxpLnk9TWF0aC5tYXgoaS5yZWFsWSx0LnRodW1iTWluU2l6ZSksdGhpcy5fX3JlYWRvbmx5KFwic2l6ZVwiLGUpLl9fcmVhZG9ubHkoXCJsaW1pdFwiLG4pLl9fcmVhZG9ubHkoXCJ0aHVtYlNpemVcIixpKSxvLmNhbGwodGhpcyksci5jYWxsKHRoaXMpLHRoaXMuc2V0UG9zaXRpb24oKSx0aGlzLl9fc2V0VGh1bWJQb3NpdGlvbigpfXZhciB1PW4oMTEyKSxhPW4oNzgpO2EuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZS51cGRhdGU9ZnVuY3Rpb24odCl7dD9yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoaS5iaW5kKHRoaXMpKTppLmNhbGwodGhpcyl9fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19dmFyIG89big4NiksaT1yKG8pLHU9big5MCksYT1yKHUpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO3ZhciBjPW4oMTQ2KTsoMCxhLmRlZmF1bHQpKGMpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBjW3RdfX0pfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX12YXIgbz1uKDg2KSxpPXIobyksdT1uKDkwKSxhPXIodSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSk7dmFyIGM9bigxNDcpOygwLGEuZGVmYXVsdCkoYykuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGNbdF19fSl9KTt2YXIgbD1uKDE0OCk7KDAsYS5kZWZhdWx0KShsKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gbFt0XX19KX0pO3ZhciBmPW4oMTQ5KTsoMCxhLmRlZmF1bHQpKGYpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBmW3RdfX0pfSk7dmFyIHM9bigxNTQpOygwLGEuZGVmYXVsdCkocykuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHNbdF19fSl9KTt2YXIgZD1uKDE1NSk7KDAsYS5kZWZhdWx0KShkKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gZFt0XX19KX0pO3ZhciBoPW4oMTU2KTsoMCxhLmRlZmF1bHQpKGgpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBoW3RdfX0pfSk7dmFyIHY9bigxNTcpOygwLGEuZGVmYXVsdCkodikuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHZbdF19fSl9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fWZ1bmN0aW9uIG8odCl7aWYoQXJyYXkuaXNBcnJheSh0KSl7Zm9yKHZhciBlPTAsbj1BcnJheSh0Lmxlbmd0aCk7ZTx0Lmxlbmd0aDtlKyspbltlXT10W2VdO3JldHVybiBufXJldHVybigwLGEuZGVmYXVsdCkodCl9ZnVuY3Rpb24gaSgpe3ZhciB0PWFyZ3VtZW50cy5sZW5ndGg+MCYmdm9pZCAwIT09YXJndW1lbnRzWzBdP2FyZ3VtZW50c1swXTowLGU9YXJndW1lbnRzLmxlbmd0aD4xJiZ2b2lkIDAhPT1hcmd1bWVudHNbMV0/YXJndW1lbnRzWzFdOjAsbj1hcmd1bWVudHMubGVuZ3RoPjImJnZvaWQgMCE9PWFyZ3VtZW50c1syXSYmYXJndW1lbnRzWzJdLHI9dGhpcy5saW1pdCxpPXRoaXMub3B0aW9ucyx1PXRoaXMubW92ZW1lbnQ7dGhpcy5fX3VwZGF0ZVRocm90dGxlKCksaS5yZW5kZXJCeVBpeGVscyYmKHQ9TWF0aC5yb3VuZCh0KSxlPU1hdGgucm91bmQoZSkpO3ZhciBhPXUueCt0LGw9dS55K2U7MD09PXIueCYmKGE9MCksMD09PXIueSYmKGw9MCk7dmFyIGY9dGhpcy5fX2dldERlbHRhTGltaXQobik7dS54PWMucGlja0luUmFuZ2UuYXBwbHkodm9pZCAwLFthXS5jb25jYXQobyhmLngpKSksdS55PWMucGlja0luUmFuZ2UuYXBwbHkodm9pZCAwLFtsXS5jb25jYXQobyhmLnkpKSl9dmFyIHU9bigyKSxhPXIodSksYz1uKDExMiksbD1uKDc4KTtPYmplY3QuZGVmaW5lUHJvcGVydHkobC5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX19hZGRNb3ZlbWVudFwiLHt2YWx1ZTppLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcigpe3ZhciB0PXRoaXMsZT10aGlzLm1vdmVtZW50LG49dGhpcy5tb3ZlbWVudExvY2tlZDthLmZvckVhY2goZnVuY3Rpb24ocil7bltyXT1lW3JdJiZ0Ll9fd2lsbE92ZXJzY3JvbGwocixlW3JdKX0pfWZ1bmN0aW9uIG8oKXt2YXIgdD10aGlzLm1vdmVtZW50TG9ja2VkO2EuZm9yRWFjaChmdW5jdGlvbihlKXt0W2VdPSExfSl9ZnVuY3Rpb24gaSgpe3ZhciB0PXRoaXMubW92ZW1lbnRMb2NrZWQ7cmV0dXJuIHQueHx8dC55fXZhciB1PW4oNzgpLGE9W1wieFwiLFwieVwiXTtPYmplY3QuZGVmaW5lUHJvcGVydHkodS5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX19hdXRvTG9ja01vdmVtZW50XCIse3ZhbHVlOnIsd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHUuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9fdW5sb2NrTW92ZW1lbnRcIix7dmFsdWU6byx3cml0YWJsZTohMCxjb25maWd1cmFibGU6ITB9KSxPYmplY3QuZGVmaW5lUHJvcGVydHkodS5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX19pc01vdmVtZW50TG9ja2VkXCIse3ZhbHVlOmksd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX1mdW5jdGlvbiBvKCl7dmFyIHQ9YXJndW1lbnRzLmxlbmd0aD4wJiZ2b2lkIDAhPT1hcmd1bWVudHNbMF0/YXJndW1lbnRzWzBdOlwiXCI7aWYodCl7dmFyIGU9dGhpcy5vcHRpb25zLG49dGhpcy5tb3ZlbWVudCxyPXRoaXMub3ZlcnNjcm9sbFJlbmRlcmVkLG89dGhpcy5NQVhfT1ZFUlNDUk9MTCxpPW5bdF09KDAsaC5waWNrSW5SYW5nZSkoblt0XSwtbyxvKSx1PWUub3ZlcnNjcm9sbERhbXBpbmcsYT1yW3RdKyhpLXJbdF0pKnU7ZS5yZW5kZXJCeVBpeGVscyYmKGF8PTApLCF0aGlzLl9faXNNb3ZlbWVudExvY2tlZCgpJiZNYXRoLmFicyhhLXJbdF0pPC4xJiYoYS09aS9NYXRoLmFicyhpfHwxKSksTWF0aC5hYnMoYSk8TWF0aC5hYnMoclt0XSkmJnRoaXMuX19yZWFkb25seShcIm92ZXJzY3JvbGxCYWNrXCIsITApLChhKnJbdF08MHx8TWF0aC5hYnMoYSk8PTEpJiYoYT0wLHRoaXMuX19yZWFkb25seShcIm92ZXJzY3JvbGxCYWNrXCIsITEpKSxyW3RdPWF9fWZ1bmN0aW9uIGkodCl7dmFyIGU9dGhpcy5fX3RvdWNoUmVjb3JkLG49dGhpcy5vdmVyc2Nyb2xsUmVuZGVyZWQ7cmV0dXJuIG4ueCE9PXQueHx8bi55IT09dC55fHwhKCFkLkdMT0JBTF9FTlYuVE9VQ0hfU1VQUE9SVEVEfHwhZS51cGRhdGVkUmVjZW50bHkoKSl9ZnVuY3Rpb24gdSgpe3ZhciB0PXRoaXMsZT1hcmd1bWVudHMubGVuZ3RoPjAmJnZvaWQgMCE9PWFyZ3VtZW50c1swXT9hcmd1bWVudHNbMF06W107aWYoZS5sZW5ndGgmJnRoaXMub3B0aW9ucy5vdmVyc2Nyb2xsRWZmZWN0KXt2YXIgbj10aGlzLm9wdGlvbnMscj10aGlzLm92ZXJzY3JvbGxSZW5kZXJlZCx1PWwoe30scik7aWYoZS5mb3JFYWNoKGZ1bmN0aW9uKGUpe3JldHVybiBvLmNhbGwodCxlKX0pLGkuY2FsbCh0aGlzLHUpKXN3aXRjaChuLm92ZXJzY3JvbGxFZmZlY3Qpe2Nhc2VcImJvdW5jZVwiOnJldHVybiBzLm92ZXJzY3JvbGxCb3VuY2UuY2FsbCh0aGlzLHIueCxyLnkpO2Nhc2VcImdsb3dcIjpyZXR1cm4gcy5vdmVyc2Nyb2xsR2xvdy5jYWxsKHRoaXMsci54LHIueSk7ZGVmYXVsdDpyZXR1cm59fX12YXIgYT1uKDEyNSksYz1yKGEpLGw9Yy5kZWZhdWx0fHxmdW5jdGlvbih0KXtmb3IodmFyIGU9MTtlPGFyZ3VtZW50cy5sZW5ndGg7ZSsrKXt2YXIgbj1hcmd1bWVudHNbZV07Zm9yKHZhciByIGluIG4pT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG4scikmJih0W3JdPW5bcl0pfXJldHVybiB0fSxmPW4oNzgpLHM9bigxNTApLGQ9big4OSksaD1uKDExMik7T2JqZWN0LmRlZmluZVByb3BlcnR5KGYuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9fcmVuZGVyT3ZlcnNjcm9sbFwiLHt2YWx1ZTp1LHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19dmFyIG89big4NiksaT1yKG8pLHU9big5MCksYT1yKHUpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO3ZhciBjPW4oMTUxKTsoMCxhLmRlZmF1bHQpKGMpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBjW3RdfX0pfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX12YXIgbz1uKDg2KSxpPXIobyksdT1uKDkwKSxhPXIodSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSk7dmFyIGM9bigxNTIpOygwLGEuZGVmYXVsdCkoYykuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGNbdF19fSl9KTt2YXIgbD1uKDE1Myk7KDAsYS5kZWZhdWx0KShsKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gbFt0XX19KX0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0LGUpe3ZhciBuPXRoaXMuc2l6ZSxyPXRoaXMub2Zmc2V0LGk9dGhpcy50YXJnZXRzLHU9dGhpcy50aHVtYk9mZnNldCxhPWkueEF4aXMsYz1pLnlBeGlzLGw9aS5jb250ZW50O2lmKCgwLG8uc2V0U3R5bGUpKGwse1wiLXRyYW5zZm9ybVwiOlwidHJhbnNsYXRlM2QoXCIrLShyLngrdCkrXCJweCwgXCIrLShyLnkrZSkrXCJweCwgMClcIn0pLHQpe3ZhciBmPW4uY29udGFpbmVyLndpZHRoLyhuLmNvbnRhaW5lci53aWR0aCtNYXRoLmFicyh0KSk7KDAsby5zZXRTdHlsZSkoYS50aHVtYix7XCItdHJhbnNmb3JtXCI6XCJ0cmFuc2xhdGUzZChcIit1LngrXCJweCwgMCwgMCkgc2NhbGUzZChcIitmK1wiLCAxLCAxKVwiLFwiLXRyYW5zZm9ybS1vcmlnaW5cIjp0PDA/XCJsZWZ0XCI6XCJyaWdodFwifSl9aWYoZSl7dmFyIHM9bi5jb250YWluZXIuaGVpZ2h0LyhuLmNvbnRhaW5lci5oZWlnaHQrTWF0aC5hYnMoZSkpOygwLG8uc2V0U3R5bGUpKGMudGh1bWIse1wiLXRyYW5zZm9ybVwiOlwidHJhbnNsYXRlM2QoMCwgXCIrdS55K1wicHgsIDApIHNjYWxlM2QoMSwgXCIrcytcIiwgMSlcIixcIi10cmFuc2Zvcm0tb3JpZ2luXCI6ZTwwP1widG9wXCI6XCJib3R0b21cIn0pfX1PYmplY3QuZGVmaW5lUHJvcGVydHkoZSxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KSxlLm92ZXJzY3JvbGxCb3VuY2U9cjt2YXIgbz1uKDExMil9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQsZSl7dmFyIG49dGhpcy5zaXplLHI9dGhpcy50YXJnZXRzLGE9dGhpcy5vcHRpb25zLGM9ci5jYW52YXMsbD1jLmVsZW0sZj1jLmNvbnRleHQ7cmV0dXJuIHR8fGU/KCgwLHUuc2V0U3R5bGUpKGwse2Rpc3BsYXk6XCJibG9ja1wifSksZi5jbGVhclJlY3QoMCwwLG4uY29udGVudC53aWR0aCxuLmNvbnRhaW5lci5oZWlnaHQpLGYuZmlsbFN0eWxlPWEub3ZlcnNjcm9sbEVmZmVjdENvbG9yLG8uY2FsbCh0aGlzLHQpLHZvaWQgaS5jYWxsKHRoaXMsZSkpOigwLHUuc2V0U3R5bGUpKGwse2Rpc3BsYXk6XCJub25lXCJ9KX1mdW5jdGlvbiBvKHQpe3ZhciBlPXRoaXMuc2l6ZSxuPXRoaXMudGFyZ2V0cyxyPXRoaXMuX190b3VjaFJlY29yZCxvPXRoaXMuTUFYX09WRVJTQ1JPTEwsaT1lLmNvbnRhaW5lcixsPWkud2lkdGgsZj1pLmhlaWdodCxzPW4uY2FudmFzLmNvbnRleHQ7cy5zYXZlKCksdD4wJiZzLnRyYW5zZm9ybSgtMSwwLDAsMSxsLDApO3ZhciBkPSgwLHUucGlja0luUmFuZ2UpKE1hdGguYWJzKHQpL28sMCxhKSxoPSgwLHUucGlja0luUmFuZ2UpKGQsMCxjKSpsLHY9TWF0aC5hYnModCksXz1yLmdldExhc3RQb3NpdGlvbihcInlcIil8fGYvMjtzLmdsb2JhbEFscGhhPWQscy5iZWdpblBhdGgoKSxzLm1vdmVUbygwLC1oKSxzLnF1YWRyYXRpY0N1cnZlVG8odixfLDAsZitoKSxzLmZpbGwoKSxzLmNsb3NlUGF0aCgpLHMucmVzdG9yZSgpfWZ1bmN0aW9uIGkodCl7dmFyIGU9dGhpcy5zaXplLG49dGhpcy50YXJnZXRzLHI9dGhpcy5fX3RvdWNoUmVjb3JkLG89dGhpcy5NQVhfT1ZFUlNDUk9MTCxpPWUuY29udGFpbmVyLGw9aS53aWR0aCxmPWkuaGVpZ2h0LHM9bi5jYW52YXMuY29udGV4dDtzLnNhdmUoKSx0PjAmJnMudHJhbnNmb3JtKDEsMCwwLC0xLDAsZik7dmFyIGQ9KDAsdS5waWNrSW5SYW5nZSkoTWF0aC5hYnModCkvbywwLGEpLGg9KDAsdS5waWNrSW5SYW5nZSkoZCwwLGMpKmwsdj1yLmdldExhc3RQb3NpdGlvbihcInhcIil8fGwvMixfPU1hdGguYWJzKHQpO3MuZ2xvYmFsQWxwaGE9ZCxzLmJlZ2luUGF0aCgpLHMubW92ZVRvKC1oLDApLHMucXVhZHJhdGljQ3VydmVUbyh2LF8sbCtoLDApLHMuZmlsbCgpLHMuY2xvc2VQYXRoKCkscy5yZXN0b3JlKCl9T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSksZS5vdmVyc2Nyb2xsR2xvdz1yO3ZhciB1PW4oMTEyKSxhPS43NSxjPS4yNX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7dmFyIGU9dGhpcy5vcHRpb25zLG49dGhpcy5vZmZzZXQscj10aGlzLm1vdmVtZW50LG89dGhpcy5fX3RvdWNoUmVjb3JkLGk9ZS5kYW1waW5nLHU9ZS5yZW5kZXJCeVBpeGVscyxhPWUub3ZlcnNjcm9sbERhbXBpbmcsYz1uW3RdLGw9clt0XSxmPWk7aWYodGhpcy5fX3dpbGxPdmVyc2Nyb2xsKHQsbCk/Zj1hOm8uaXNBY3RpdmUoKSYmKGY9LjUpLE1hdGguYWJzKGwpPDEpe3ZhciBzPWMrbDtyZXR1cm57bW92ZW1lbnQ6MCxwb3NpdGlvbjpsPjA/TWF0aC5jZWlsKHMpOk1hdGguZmxvb3Iocyl9fXZhciBkPWwqKDEtZik7cmV0dXJuIHUmJihkfD0wKSx7bW92ZW1lbnQ6ZCxwb3NpdGlvbjpjK2wtZH19ZnVuY3Rpb24gbygpe3ZhciB0PXRoaXMub3B0aW9ucyxlPXRoaXMub2Zmc2V0LG49dGhpcy5saW1pdCxpPXRoaXMubW92ZW1lbnQsYT10aGlzLm92ZXJzY3JvbGxSZW5kZXJlZCxjPXRoaXMuX190aW1lcklEO2lmKGkueHx8aS55fHxhLnh8fGEueSl7dmFyIGw9ci5jYWxsKHRoaXMsXCJ4XCIpLGY9ci5jYWxsKHRoaXMsXCJ5XCIpLHM9W107aWYodC5vdmVyc2Nyb2xsRWZmZWN0KXt2YXIgZD0oMCx1LnBpY2tJblJhbmdlKShsLnBvc2l0aW9uLDAsbi54KSxoPSgwLHUucGlja0luUmFuZ2UpKGYucG9zaXRpb24sMCxuLnkpOyhhLnh8fGQ9PT1lLngmJmkueCkmJnMucHVzaChcInhcIiksKGEueXx8aD09PWUueSYmaS55KSYmcy5wdXNoKFwieVwiKX10aGlzLm1vdmVtZW50TG9ja2VkLnh8fChpLng9bC5tb3ZlbWVudCksdGhpcy5tb3ZlbWVudExvY2tlZC55fHwoaS55PWYubW92ZW1lbnQpLHRoaXMuc2V0UG9zaXRpb24obC5wb3NpdGlvbixmLnBvc2l0aW9uKSx0aGlzLl9fcmVuZGVyT3ZlcnNjcm9sbChzKX1jLnJlbmRlcj1yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoby5iaW5kKHRoaXMpKX12YXIgaT1uKDc4KSx1PW4oMTEyKTtPYmplY3QuZGVmaW5lUHJvcGVydHkoaS5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX19yZW5kZXJcIix7dmFsdWU6byx3cml0YWJsZTohMCxjb25maWd1cmFibGU6ITB9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fWZ1bmN0aW9uIG8odCl7aWYoQXJyYXkuaXNBcnJheSh0KSl7Zm9yKHZhciBlPTAsbj1BcnJheSh0Lmxlbmd0aCk7ZTx0Lmxlbmd0aDtlKyspbltlXT10W2VdO3JldHVybiBufXJldHVybigwLGEuZGVmYXVsdCkodCl9ZnVuY3Rpb24gaSgpe3ZhciB0PWFyZ3VtZW50cy5sZW5ndGg+MCYmdm9pZCAwIT09YXJndW1lbnRzWzBdP2FyZ3VtZW50c1swXTowLGU9YXJndW1lbnRzLmxlbmd0aD4xJiZ2b2lkIDAhPT1hcmd1bWVudHNbMV0/YXJndW1lbnRzWzFdOjAsbj1hcmd1bWVudHMubGVuZ3RoPjImJnZvaWQgMCE9PWFyZ3VtZW50c1syXSYmYXJndW1lbnRzWzJdLHI9dGhpcy5vcHRpb25zLGk9dGhpcy5tb3ZlbWVudDt0aGlzLl9fdXBkYXRlVGhyb3R0bGUoKTt2YXIgdT10aGlzLl9fZ2V0RGVsdGFMaW1pdChuKTtyLnJlbmRlckJ5UGl4ZWxzJiYodD1NYXRoLnJvdW5kKHQpLGU9TWF0aC5yb3VuZChlKSksaS54PWMucGlja0luUmFuZ2UuYXBwbHkodm9pZCAwLFt0XS5jb25jYXQobyh1LngpKSksaS55PWMucGlja0luUmFuZ2UuYXBwbHkodm9pZCAwLFtlXS5jb25jYXQobyh1LnkpKSl9dmFyIHU9bigyKSxhPXIodSksYz1uKDExMiksbD1uKDc4KTtPYmplY3QuZGVmaW5lUHJvcGVydHkobC5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX19zZXRNb3ZlbWVudFwiLHt2YWx1ZTppLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcigpe3ZhciB0PWFyZ3VtZW50cy5sZW5ndGg+MCYmdm9pZCAwIT09YXJndW1lbnRzWzBdP2FyZ3VtZW50c1swXTowLGU9YXJndW1lbnRzLmxlbmd0aD4xJiZ2b2lkIDAhPT1hcmd1bWVudHNbMV0/YXJndW1lbnRzWzFdOjAsbj10aGlzLm9wdGlvbnMscj10aGlzLm9mZnNldCxvPXRoaXMubGltaXQ7aWYoIW4uY29udGludW91c1Njcm9sbGluZylyZXR1cm4hMTt2YXIgdT0oMCxpLnBpY2tJblJhbmdlKSh0K3IueCwwLG8ueCksYT0oMCxpLnBpY2tJblJhbmdlKShlK3IueSwwLG8ueSksYz0hMDtyZXR1cm4gYyY9dT09PXIueCxjJj1hPT09ci55LGMmPXU9PT1vLnh8fDA9PT11fHxhPT09by55fHwwPT09YX12YXIgbz1uKDc4KSxpPW4oMTEyKTtPYmplY3QuZGVmaW5lUHJvcGVydHkoby5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX19zaG91bGRQcm9wYWdhdGVNb3ZlbWVudFwiLHt2YWx1ZTpyLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcigpe3ZhciB0PWFyZ3VtZW50cy5sZW5ndGg+MCYmdm9pZCAwIT09YXJndW1lbnRzWzBdP2FyZ3VtZW50c1swXTpcIlwiLGU9YXJndW1lbnRzLmxlbmd0aD4xJiZ2b2lkIDAhPT1hcmd1bWVudHNbMV0/YXJndW1lbnRzWzFdOjA7aWYoIXQpcmV0dXJuITE7dmFyIG49dGhpcy5vZmZzZXQscj10aGlzLmxpbWl0LG89blt0XTtyZXR1cm4oMCxpLnBpY2tJblJhbmdlKShlK28sMCxyW3RdKT09PW8mJigwPT09b3x8bz09PXJbdF0pfXZhciBvPW4oNzgpLGk9bigxMTIpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShvLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUsXCJfX3dpbGxPdmVyc2Nyb2xsXCIse3ZhbHVlOnIsd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX12YXIgbz1uKDg2KSxpPXIobyksdT1uKDkwKSxhPXIodSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSk7dmFyIGM9bigxNTkpOygwLGEuZGVmYXVsdCkoYykuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGNbdF19fSl9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fXZhciBvPW4oODYpLGk9cihvKSx1PW4oOTApLGE9cih1KTtPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KTt2YXIgYz1uKDE2MCk7KDAsYS5kZWZhdWx0KShjKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gY1t0XX19KX0pO3ZhciBsPW4oMTYxKTsoMCxhLmRlZmF1bHQpKGwpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBsW3RdfX0pfSk7dmFyIGY9bigxNjgpOygwLGEuZGVmYXVsdCkoZikuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGZbdF19fSl9KTt2YXIgcz1uKDE2OSk7KDAsYS5kZWZhdWx0KShzKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gc1t0XX19KX0pO3ZhciBkPW4oMTcwKTsoMCxhLmRlZmF1bHQpKGQpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBkW3RdfX0pfSk7dmFyIGg9bigxNzEpOygwLGEuZGVmYXVsdCkoaCkuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGhbdF19fSl9KTt2YXIgdj1uKDE3Mik7KDAsYS5kZWZhdWx0KSh2KS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdlt0XX19KX0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcigpe3ZhciB0PXRoaXMsZT10aGlzLnRhcmdldHMsbj1lLmNvbnRhaW5lcixyPWUuY29udGVudCxvPSExLHU9dm9pZCAwLGE9dm9pZCAwO09iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLFwiX19pc0RyYWdcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIG99LGVudW1lcmFibGU6ITF9KTt2YXIgYz1mdW5jdGlvbiBlKG4pe3ZhciByPW4ueCxvPW4ueTtpZihyfHxvKXt2YXIgaT10Lm9wdGlvbnMuc3BlZWQ7dC5fX3NldE1vdmVtZW50KHIqaSxvKmkpLHU9cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCl7ZSh7eDpyLHk6b30pfSl9fTt0aGlzLl9fYWRkRXZlbnQobixcImRyYWdzdGFydFwiLGZ1bmN0aW9uKGUpe3QuX19ldmVudEZyb21DaGlsZFNjcm9sbGJhcihlKXx8KG89ITAsYT1lLnRhcmdldC5jbGllbnRIZWlnaHQsKDAsaS5zZXRTdHlsZSkocix7XCJwb2ludGVyLWV2ZW50c1wiOlwiYXV0b1wifSksY2FuY2VsQW5pbWF0aW9uRnJhbWUodSksdC5fX3VwZGF0ZUJvdW5kaW5nKCkpfSksdGhpcy5fX2FkZEV2ZW50KGRvY3VtZW50LFwiZHJhZ292ZXIgbW91c2Vtb3ZlIHRvdWNobW92ZVwiLGZ1bmN0aW9uKGUpe2lmKG8mJiF0Ll9fZXZlbnRGcm9tQ2hpbGRTY3JvbGxiYXIoZSkpe2NhbmNlbEFuaW1hdGlvbkZyYW1lKHUpLGUucHJldmVudERlZmF1bHQoKTt2YXIgbj10Ll9fZ2V0UG9pbnRlclRyZW5kKGUsYSk7YyhuKX19KSx0aGlzLl9fYWRkRXZlbnQoZG9jdW1lbnQsXCJkcmFnZW5kIG1vdXNldXAgdG91Y2hlbmQgYmx1clwiLGZ1bmN0aW9uKCl7Y2FuY2VsQW5pbWF0aW9uRnJhbWUodSksbz0hMX0pfXZhciBvPW4oNzgpLGk9bigxMTIpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShvLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUsXCJfX2RyYWdIYW5kbGVyXCIse3ZhbHVlOnIsd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX1mdW5jdGlvbiBvKCl7dmFyIHQ9dGhpcyxlPXRoaXMudGFyZ2V0cyxuPWZ1bmN0aW9uKGUpe3ZhciBuPXQuc2l6ZSxyPXQub2Zmc2V0LG89dC5saW1pdCxpPXQubW92ZW1lbnQ7c3dpdGNoKGUpe2Nhc2Ugcy5TUEFDRTpyZXR1cm5bMCwyMDBdO2Nhc2Ugcy5QQUdFX1VQOnJldHVyblswLC1uLmNvbnRhaW5lci5oZWlnaHQrNDBdO2Nhc2Ugcy5QQUdFX0RPV046cmV0dXJuWzAsbi5jb250YWluZXIuaGVpZ2h0LTQwXTtjYXNlIHMuRU5EOnJldHVyblswLE1hdGguYWJzKGkueSkrby55LXIueV07Y2FzZSBzLkhPTUU6cmV0dXJuWzAsLU1hdGguYWJzKGkueSktci55XTtjYXNlIHMuTEVGVDpyZXR1cm5bLTQwLDBdO2Nhc2Ugcy5VUDpyZXR1cm5bMCwtNDBdO2Nhc2Ugcy5SSUdIVDpyZXR1cm5bNDAsMF07Y2FzZSBzLkRPV046cmV0dXJuWzAsNDBdO2RlZmF1bHQ6cmV0dXJuIG51bGx9fSxyPWUuY29udGFpbmVyO3RoaXMuX19hZGRFdmVudChyLFwia2V5ZG93blwiLGZ1bmN0aW9uKGUpe2lmKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ9PT1yKXt2YXIgbz10Lm9wdGlvbnMsaT10LnBhcmVudHMsdT10Lm1vdmVtZW50TG9ja2VkLGE9bihlLmtleUNvZGV8fGUud2hpY2gpO2lmKGEpe3ZhciBjPWwoYSwyKSxmPWNbMF0scz1jWzFdO2lmKHQuX19zaG91bGRQcm9wYWdhdGVNb3ZlbWVudChmLHMpKXJldHVybiByLmJsdXIoKSxpLmxlbmd0aCYmaVswXS5mb2N1cygpLHQuX191cGRhdGVUaHJvdHRsZSgpO2UucHJldmVudERlZmF1bHQoKSx0Ll9fdW5sb2NrTW92ZW1lbnQoKSxmJiZ0Ll9fd2lsbE92ZXJzY3JvbGwoXCJ4XCIsZikmJih1Lng9ITApLHMmJnQuX193aWxsT3ZlcnNjcm9sbChcInlcIixzKSYmKHUueT0hMCk7dmFyIGQ9by5zcGVlZDt0Ll9fYWRkTW92ZW1lbnQoZipkLHMqZCl9fX0pLHRoaXMuX19hZGRFdmVudChyLFwia2V5dXBcIixmdW5jdGlvbigpe3QuX191bmxvY2tNb3ZlbWVudCgpfSl9dmFyIGk9bigxNjIpLHU9cihpKSxhPW4oMTY1KSxjPXIoYSksbD1mdW5jdGlvbigpe2Z1bmN0aW9uIHQodCxlKXt2YXIgbj1bXSxyPSEwLG89ITEsaT12b2lkIDA7dHJ5e2Zvcih2YXIgdSxhPSgwLGMuZGVmYXVsdCkodCk7IShyPSh1PWEubmV4dCgpKS5kb25lKSYmKG4ucHVzaCh1LnZhbHVlKSwhZXx8bi5sZW5ndGghPT1lKTtyPSEwKTt9Y2F0Y2godCl7bz0hMCxpPXR9ZmluYWxseXt0cnl7IXImJmEucmV0dXJuJiZhLnJldHVybigpfWZpbmFsbHl7aWYobyl0aHJvdyBpfX1yZXR1cm4gbn1yZXR1cm4gZnVuY3Rpb24oZSxuKXtpZihBcnJheS5pc0FycmF5KGUpKXJldHVybiBlO2lmKCgwLHUuZGVmYXVsdCkoT2JqZWN0KGUpKSlyZXR1cm4gdChlLG4pO3Rocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIGF0dGVtcHQgdG8gZGVzdHJ1Y3R1cmUgbm9uLWl0ZXJhYmxlIGluc3RhbmNlXCIpfX0oKSxmPW4oNzgpLHM9e1NQQUNFOjMyLFBBR0VfVVA6MzMsUEFHRV9ET1dOOjM0LEVORDozNSxIT01FOjM2LExFRlQ6MzcsVVA6MzgsUklHSFQ6MzksRE9XTjo0MH07T2JqZWN0LmRlZmluZVByb3BlcnR5KGYuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9fa2V5Ym9hcmRIYW5kbGVyXCIse3ZhbHVlOm8sd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfSl9LGZ1bmN0aW9uKHQsZSxuKXt0LmV4cG9ydHM9e2RlZmF1bHQ6bigxNjMpLF9fZXNNb2R1bGU6ITB9fSxmdW5jdGlvbih0LGUsbil7big1Nyksbig0KSx0LmV4cG9ydHM9bigxNjQpfSxmdW5jdGlvbih0LGUsbil7dmFyIHI9big1Myksbz1uKDQ1KShcIml0ZXJhdG9yXCIpLGk9bigyNyk7dC5leHBvcnRzPW4oMTIpLmlzSXRlcmFibGU9ZnVuY3Rpb24odCl7dmFyIGU9T2JqZWN0KHQpO3JldHVybiB2b2lkIDAhPT1lW29dfHxcIkBAaXRlcmF0b3JcImluIGV8fGkuaGFzT3duUHJvcGVydHkocihlKSl9fSxmdW5jdGlvbih0LGUsbil7dC5leHBvcnRzPXtkZWZhdWx0Om4oMTY2KSxfX2VzTW9kdWxlOiEwfX0sZnVuY3Rpb24odCxlLG4pe24oNTcpLG4oNCksdC5leHBvcnRzPW4oMTY3KX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMTcpLG89big1Mik7dC5leHBvcnRzPW4oMTIpLmdldEl0ZXJhdG9yPWZ1bmN0aW9uKHQpe3ZhciBlPW8odCk7aWYoXCJmdW5jdGlvblwiIT10eXBlb2YgZSl0aHJvdyBUeXBlRXJyb3IodCtcIiBpcyBub3QgaXRlcmFibGUhXCIpO3JldHVybiByKGUuY2FsbCh0KSl9fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcigpe3ZhciB0PXRoaXMsZT10aGlzLnRhcmdldHMsbj1lLmNvbnRhaW5lcixyPWUueEF4aXMsbz1lLnlBeGlzLHU9ZnVuY3Rpb24oZSxuKXt2YXIgcj10LnNpemUsbz10LnRodW1iU2l6ZTtpZihcInhcIj09PWUpe3ZhciBpPXIuY29udGFpbmVyLndpZHRoLShvLngtby5yZWFsWCk7cmV0dXJuIG4vaSpyLmNvbnRlbnQud2lkdGh9aWYoXCJ5XCI9PT1lKXt2YXIgdT1yLmNvbnRhaW5lci5oZWlnaHQtKG8ueS1vLnJlYWxZKTtyZXR1cm4gbi91KnIuY29udGVudC5oZWlnaHR9cmV0dXJuIDB9LGE9ZnVuY3Rpb24odCl7cmV0dXJuKDAsaS5pc09uZU9mKSh0LFtyLnRyYWNrLHIudGh1bWJdKT9cInhcIjooMCxpLmlzT25lT2YpKHQsW28udHJhY2ssby50aHVtYl0pP1wieVwiOnZvaWQgMH0sYz12b2lkIDAsbD12b2lkIDAsZj12b2lkIDAscz12b2lkIDAsZD12b2lkIDA7dGhpcy5fX2FkZEV2ZW50KG4sXCJjbGlja1wiLGZ1bmN0aW9uKGUpe2lmKCFsJiYoMCxpLmlzT25lT2YpKGUudGFyZ2V0LFtyLnRyYWNrLG8udHJhY2tdKSl7dmFyIG49ZS50YXJnZXQsYz1hKG4pLGY9bi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxzPSgwLFxuaS5nZXRQb3NpdGlvbikoZSksZD10Lm9mZnNldCxoPXQudGh1bWJTaXplO2lmKFwieFwiPT09Yyl7dmFyIHY9cy54LWYubGVmdC1oLngvMjt0Ll9fc2V0TW92ZW1lbnQodShjLHYpLWQueCwwKX1lbHNle3ZhciBfPXMueS1mLnRvcC1oLnkvMjt0Ll9fc2V0TW92ZW1lbnQoMCx1KGMsXyktZC55KX19fSksdGhpcy5fX2FkZEV2ZW50KG4sXCJtb3VzZWRvd25cIixmdW5jdGlvbihlKXtpZigoMCxpLmlzT25lT2YpKGUudGFyZ2V0LFtyLnRodW1iLG8udGh1bWJdKSl7Yz0hMDt2YXIgbj0oMCxpLmdldFBvc2l0aW9uKShlKSx1PWUudGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO3M9YShlLnRhcmdldCksZj17eDpuLngtdS5sZWZ0LHk6bi55LXUudG9wfSxkPXQudGFyZ2V0cy5jb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCl9fSksdGhpcy5fX2FkZEV2ZW50KHdpbmRvdyxcIm1vdXNlbW92ZVwiLGZ1bmN0aW9uKGUpe2lmKGMpe2UucHJldmVudERlZmF1bHQoKSxsPSEwO3ZhciBuPXQub2Zmc2V0LHI9KDAsaS5nZXRQb3NpdGlvbikoZSk7aWYoXCJ4XCI9PT1zKXt2YXIgbz1yLngtZi54LWQubGVmdDt0LnNldFBvc2l0aW9uKHUocyxvKSxuLnkpfWlmKFwieVwiPT09cyl7dmFyIGE9ci55LWYueS1kLnRvcDt0LnNldFBvc2l0aW9uKG4ueCx1KHMsYSkpfX19KSx0aGlzLl9fYWRkRXZlbnQod2luZG93LFwibW91c2V1cCBibHVyXCIsZnVuY3Rpb24oKXtjPWw9ITF9KX12YXIgbz1uKDc4KSxpPW4oMTEyKTtPYmplY3QuZGVmaW5lUHJvcGVydHkoby5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX19tb3VzZUhhbmRsZXJcIix7dmFsdWU6cix3cml0YWJsZTohMCxjb25maWd1cmFibGU6ITB9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIoKXt0aGlzLl9fYWRkRXZlbnQod2luZG93LFwicmVzaXplXCIsdGhpcy5fX3VwZGF0ZVRocm90dGxlKX12YXIgbz1uKDc4KTtPYmplY3QuZGVmaW5lUHJvcGVydHkoby5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX19yZXNpemVIYW5kbGVyXCIse3ZhbHVlOnIsd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKCl7dmFyIHQ9dGhpcyxlPSExLG49dm9pZCAwLHI9dGhpcy50YXJnZXRzLG89ci5jb250YWluZXIsdT1yLmNvbnRlbnQsYT1mdW5jdGlvbiBlKHIpe3ZhciBvPXIueCxpPXIueTtpZihvfHxpKXt2YXIgdT10Lm9wdGlvbnMuc3BlZWQ7dC5fX3NldE1vdmVtZW50KG8qdSxpKnUpLG49cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCl7ZSh7eDpvLHk6aX0pfSl9fSxjPWZ1bmN0aW9uKCl7dmFyIHQ9YXJndW1lbnRzLmxlbmd0aD4wJiZ2b2lkIDAhPT1hcmd1bWVudHNbMF0/YXJndW1lbnRzWzBdOlwiXCI7KDAsaS5zZXRTdHlsZSkobyx7XCItdXNlci1zZWxlY3RcIjp0fSl9O3RoaXMuX19hZGRFdmVudCh3aW5kb3csXCJtb3VzZW1vdmVcIixmdW5jdGlvbihyKXtpZihlKXtjYW5jZWxBbmltYXRpb25GcmFtZShuKTt2YXIgbz10Ll9fZ2V0UG9pbnRlclRyZW5kKHIpO2Eobyl9fSksdGhpcy5fX2FkZEV2ZW50KHUsXCJzZWxlY3RzdGFydFwiLGZ1bmN0aW9uKHIpe3JldHVybiB0Ll9fZXZlbnRGcm9tQ2hpbGRTY3JvbGxiYXIocik/YyhcIm5vbmVcIik6KGNhbmNlbEFuaW1hdGlvbkZyYW1lKG4pLHQuX191cGRhdGVCb3VuZGluZygpLHZvaWQoZT0hMCkpfSksdGhpcy5fX2FkZEV2ZW50KHdpbmRvdyxcIm1vdXNldXAgYmx1clwiLGZ1bmN0aW9uKCl7Y2FuY2VsQW5pbWF0aW9uRnJhbWUobiksYygpLGU9ITF9KSx0aGlzLl9fYWRkRXZlbnQobyxcInNjcm9sbFwiLGZ1bmN0aW9uKHQpe3QucHJldmVudERlZmF1bHQoKSxvLnNjcm9sbFRvcD1vLnNjcm9sbExlZnQ9MH0pfXZhciBvPW4oNzgpLGk9bigxMTIpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShvLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUsXCJfX3NlbGVjdEhhbmRsZXJcIix7dmFsdWU6cix3cml0YWJsZTohMCxjb25maWd1cmFibGU6ITB9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fWZ1bmN0aW9uIG8oKXt2YXIgdD10aGlzLGU9dGhpcy50YXJnZXRzLG49dGhpcy5fX3RvdWNoUmVjb3JkLHI9ZS5jb250YWluZXI7dGhpcy5fX2FkZEV2ZW50KHIsXCJ0b3VjaHN0YXJ0XCIsZnVuY3Rpb24oZSl7aWYoIXQuX19pc0RyYWcpe3ZhciByPXQuX190aW1lcklELG89dC5tb3ZlbWVudDtjYW5jZWxBbmltYXRpb25GcmFtZShyLnNjcm9sbFRvKSx0Ll9fd2lsbE92ZXJzY3JvbGwoXCJ4XCIpfHwoby54PTApLHQuX193aWxsT3ZlcnNjcm9sbChcInlcIil8fChvLnk9MCksbi50cmFjayhlKSx0Ll9fYXV0b0xvY2tNb3ZlbWVudCgpfX0pLHRoaXMuX19hZGRFdmVudChyLFwidG91Y2htb3ZlXCIsZnVuY3Rpb24oZSl7aWYoISh0Ll9faXNEcmFnfHxzJiZzIT09dCkpe24udXBkYXRlKGUpO3ZhciByPW4uZ2V0RGVsdGEoKSxvPXIueCxpPXIueTtpZih0Ll9fc2hvdWxkUHJvcGFnYXRlTW92ZW1lbnQobyxpKSlyZXR1cm4gdC5fX3VwZGF0ZVRocm90dGxlKCk7dmFyIHU9dC5tb3ZlbWVudCxhPXQuTUFYX09WRVJTQ1JPTEwsYz10Lm9wdGlvbnM7aWYodS54JiZ0Ll9fd2lsbE92ZXJzY3JvbGwoXCJ4XCIsbykpe3ZhciBsPTI7XCJib3VuY2VcIj09PWMub3ZlcnNjcm9sbEVmZmVjdCYmKGwrPU1hdGguYWJzKDEwKnUueC9hKSksTWF0aC5hYnModS54KT49YT9vPTA6by89bH1pZih1LnkmJnQuX193aWxsT3ZlcnNjcm9sbChcInlcIixpKSl7dmFyIGY9MjtcImJvdW5jZVwiPT09Yy5vdmVyc2Nyb2xsRWZmZWN0JiYoZis9TWF0aC5hYnMoMTAqdS55L2EpKSxNYXRoLmFicyh1LnkpPj1hP2k9MDppLz1mfXQuX19hdXRvTG9ja01vdmVtZW50KCksZS5wcmV2ZW50RGVmYXVsdCgpLHQuX19hZGRNb3ZlbWVudChvLGksITApLHM9dH19KSx0aGlzLl9fYWRkRXZlbnQocixcInRvdWNoY2FuY2VsIHRvdWNoZW5kXCIsZnVuY3Rpb24oZSl7aWYoIXQuX19pc0RyYWcpe3ZhciByPXQub3B0aW9ucy5zcGVlZCxvPW4uZ2V0VmVsb2NpdHkoKSxpPXt9OygwLHUuZGVmYXVsdCkobykuZm9yRWFjaChmdW5jdGlvbih0KXt2YXIgZT0oMCxsLnBpY2tJblJhbmdlKShvW3RdKmMuR0xPQkFMX0VOVi5FQVNJTkdfTVVMVElQTElFUiwtMWUzLDFlMyk7aVt0XT1NYXRoLmFicyhlKT5mP2UqcjowfSksdC5fX2FkZE1vdmVtZW50KGkueCxpLnksITApLHQuX191bmxvY2tNb3ZlbWVudCgpLG4ucmVsZWFzZShlKSxzPW51bGx9fSl9dmFyIGk9big5MCksdT1yKGkpLGE9big3OCksYz1uKDg5KSxsPW4oMTEyKSxmPTEwMCxzPW51bGw7T2JqZWN0LmRlZmluZVByb3BlcnR5KGEuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9fdG91Y2hIYW5kbGVyXCIse3ZhbHVlOm8sd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKCl7dmFyIHQ9dGhpcyxlPXRoaXMudGFyZ2V0cy5jb250YWluZXIsbj0hMSxyPSgwLGkuZGVib3VuY2UpKGZ1bmN0aW9uKCl7bj0hMX0sMzAsITEpO3RoaXMuX19hZGRFdmVudChlLHUuR0xPQkFMX0VOVi5XSEVFTF9FVkVOVCxmdW5jdGlvbihlKXt2YXIgbz10Lm9wdGlvbnMsdT0oMCxpLmdldERlbHRhKShlKSxhPXUueCxjPXUueTtyZXR1cm4gYSo9by5zcGVlZCxjKj1vLnNwZWVkLHQuX19zaG91bGRQcm9wYWdhdGVNb3ZlbWVudChhLGMpP3QuX191cGRhdGVUaHJvdHRsZSgpOihlLnByZXZlbnREZWZhdWx0KCkscigpLHQub3ZlcnNjcm9sbEJhY2smJihuPSEwKSxuJiYodC5fX3dpbGxPdmVyc2Nyb2xsKFwieFwiLGEpJiYoYT0wKSx0Ll9fd2lsbE92ZXJzY3JvbGwoXCJ5XCIsYykmJihjPTApKSx2b2lkIHQuX19hZGRNb3ZlbWVudChhLGMsITApKX0pfXZhciBvPW4oNzgpLGk9bigxMTIpLHU9big4OSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KG8uU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9fd2hlZWxIYW5kbGVyXCIse3ZhbHVlOnIsd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX12YXIgbz1uKDg2KSxpPXIobyksdT1uKDkwKSxhPXIodSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSk7dmFyIGM9bigxNzQpOygwLGEuZGVmYXVsdCkoYykuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGNbdF19fSl9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fXZhciBvPW4oODYpLGk9cihvKSx1PW4oOTApLGE9cih1KTtPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KTt2YXIgYz1uKDE3NSk7KDAsYS5kZWZhdWx0KShjKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gY1t0XX19KX0pO3ZhciBsPW4oMTc2KTsoMCxhLmRlZmF1bHQpKGwpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBsW3RdfX0pfSk7dmFyIGY9bigxNzcpOygwLGEuZGVmYXVsdCkoZikuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGZbdF19fSl9KTt2YXIgcz1uKDE3OCk7KDAsYS5kZWZhdWx0KShzKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gc1t0XX19KX0pO3ZhciBkPW4oMTc5KTsoMCxhLmRlZmF1bHQpKGQpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBkW3RdfX0pfSk7dmFyIGg9bigxODIpOygwLGEuZGVmYXVsdCkoaCkuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGhbdF19fSl9KTt2YXIgdj1uKDE4Myk7KDAsYS5kZWZhdWx0KSh2KS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gdlt0XX19KX0pO3ZhciBfPW4oMTg0KTsoMCxhLmRlZmF1bHQpKF8pLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBfW3RdfX0pfSk7dmFyIHA9bigxODUpOygwLGEuZGVmYXVsdCkocCkuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHBbdF19fSl9KTt2YXIgeT1uKDE4Nik7KDAsYS5kZWZhdWx0KSh5KS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4geVt0XX19KX0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0LGUsbil7dmFyIHI9dGhpcztpZighdHx8XCJmdW5jdGlvblwiIT10eXBlb2YgdC5hZGRFdmVudExpc3RlbmVyKXRocm93IG5ldyBUeXBlRXJyb3IoXCJleHBlY3QgZWxlbSB0byBiZSBhIERPTSBlbGVtZW50LCBidXQgZ290IFwiK3QpO3ZhciBvPWZ1bmN0aW9uKHQpe2Zvcih2YXIgZT1hcmd1bWVudHMubGVuZ3RoLHI9QXJyYXkoZT4xP2UtMTowKSxvPTE7bzxlO28rKylyW28tMV09YXJndW1lbnRzW29dOyF0LnR5cGUubWF0Y2goL2RyYWcvKSYmdC5kZWZhdWx0UHJldmVudGVkfHxuLmFwcGx5KHZvaWQgMCxbdF0uY29uY2F0KHIpKX07ZS5zcGxpdCgvXFxzKy9nKS5mb3JFYWNoKGZ1bmN0aW9uKGUpe3IuX19oYW5kbGVycy5wdXNoKHtldnQ6ZSxlbGVtOnQsZm46byxoYXNSZWdpc3RlcmVkOiEwfSksdC5hZGRFdmVudExpc3RlbmVyKGUsbyl9KX12YXIgbz1uKDc4KTtPYmplY3QuZGVmaW5lUHJvcGVydHkoby5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX19hZGRFdmVudFwiLHt2YWx1ZTpyLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcigpe3ZhciB0PWFyZ3VtZW50cy5sZW5ndGg+MCYmdm9pZCAwIT09YXJndW1lbnRzWzBdP2FyZ3VtZW50c1swXTp7fSxlPXQudGFyZ2V0O3JldHVybiB0aGlzLmNoaWxkcmVuLnNvbWUoZnVuY3Rpb24odCl7cmV0dXJuIHQuY29udGFpbnMoZSl9KX12YXIgbz1uKDc4KTtPYmplY3QuZGVmaW5lUHJvcGVydHkoby5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX19ldmVudEZyb21DaGlsZFNjcm9sbGJhclwiLHt2YWx1ZTpyLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcigpe3ZhciB0PWFyZ3VtZW50cy5sZW5ndGg+MCYmdm9pZCAwIT09YXJndW1lbnRzWzBdJiZhcmd1bWVudHNbMF0sZT10aGlzLm9wdGlvbnMsbj10aGlzLm9mZnNldCxyPXRoaXMubGltaXQ7cmV0dXJuIHQmJihlLmNvbnRpbnVvdXNTY3JvbGxpbmd8fGUub3ZlcnNjcm9sbEVmZmVjdCk/e3g6Wy0oMS8wKSwxLzBdLHk6Wy0oMS8wKSwxLzBdfTp7eDpbLW4ueCxyLngtbi54XSx5Olstbi55LHIueS1uLnldfX12YXIgbz1uKDc4KTtPYmplY3QuZGVmaW5lUHJvcGVydHkoby5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX19nZXREZWx0YUxpbWl0XCIse3ZhbHVlOnIsd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3ZhciBlPWFyZ3VtZW50cy5sZW5ndGg+MSYmdm9pZCAwIT09YXJndW1lbnRzWzFdP2FyZ3VtZW50c1sxXTowLG49dGhpcy5ib3VuZGluZyxyPW4udG9wLG89bi5yaWdodCx1PW4uYm90dG9tLGE9bi5sZWZ0LGM9KDAsaS5nZXRQb3NpdGlvbikodCksbD1jLngsZj1jLnkscz17eDowLHk6MH07cmV0dXJuIDA9PT1sJiYwPT09Zj9zOihsPm8tZT9zLng9bC1vK2U6bDxhK2UmJihzLng9bC1hLWUpLGY+dS1lP3MueT1mLXUrZTpmPHIrZSYmKHMueT1mLXItZSkscyl9dmFyIG89big3OCksaT1uKDExMik7T2JqZWN0LmRlZmluZVByb3BlcnR5KG8uU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9fZ2V0UG9pbnRlclRyZW5kXCIse3ZhbHVlOnIsd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX1mdW5jdGlvbiBvKHQpe2lmKEFycmF5LmlzQXJyYXkodCkpe2Zvcih2YXIgZT0wLG49QXJyYXkodC5sZW5ndGgpO2U8dC5sZW5ndGg7ZSsrKW5bZV09dFtlXTtyZXR1cm4gbn1yZXR1cm4oMCxoLmRlZmF1bHQpKHQpfWZ1bmN0aW9uIGkodCl7dmFyIGU9dGhpcyxuPXtzcGVlZDoxLGRhbXBpbmc6LjEsdGh1bWJNaW5TaXplOjIwLHN5bmNDYWxsYmFja3M6ITEscmVuZGVyQnlQaXhlbHM6ITAsYWx3YXlzU2hvd1RyYWNrczohMSxjb250aW51b3VzU2Nyb2xsaW5nOlwiYXV0b1wiLG92ZXJzY3JvbGxFZmZlY3Q6ITEsb3ZlcnNjcm9sbEVmZmVjdENvbG9yOlwiIzg3Y2VlYlwiLG92ZXJzY3JvbGxEYW1waW5nOi4yfSxyPXtkYW1waW5nOlswLDFdLHNwZWVkOlswLDEvMF0sdGh1bWJNaW5TaXplOlswLDEvMF0sb3ZlcnNjcm9sbEVmZmVjdDpbITEsXCJib3VuY2VcIixcImdsb3dcIl0sb3ZlcnNjcm9sbERhbXBpbmc6WzAsMV19LGk9ZnVuY3Rpb24oKXt2YXIgdD1hcmd1bWVudHMubGVuZ3RoPjAmJnZvaWQgMCE9PWFyZ3VtZW50c1swXT9hcmd1bWVudHNbMF06XCJhdXRvXCI7aWYobi5vdmVyc2Nyb2xsRWZmZWN0IT09ITEpcmV0dXJuITE7c3dpdGNoKHQpe2Nhc2VcImF1dG9cIjpyZXR1cm4gZS5pc05lc3RlZFNjcm9sbGJhcjtkZWZhdWx0OnJldHVybiEhdH19LHU9e3NldCBpZ25vcmVFdmVudHModCl7Y29uc29sZS53YXJuKFwiYG9wdGlvbnMuaWdub3JlRXZlbnRzYCBwYXJhbWV0ZXIgaXMgZGVwcmVjYXRlZCwgdXNlIGBpbnN0YW5jZSN1bnJlZ2lzdGVyRXZlbnRzKClgIG1ldGhvZCBpbnN0ZWFkLiBodHRwczovL2dpdGh1Yi5jb20vaWRpb3RXdS9zbW9vdGgtc2Nyb2xsYmFyL3dpa2kvSW5zdGFuY2UtTWV0aG9kcyNpbnN0YW5jZXVucmVnaXN0ZXJldmVudHMtcmVnZXgtLXJlZ2V4LXJlZ2V4LS1cIil9LHNldCBmcmljdGlvbih0KXtjb25zb2xlLndhcm4oXCJgb3B0aW9ucy5mcmljdGlvbj1cIit0K1wiYCBpcyBkZXByZWNhdGVkLCB1c2UgYG9wdGlvbnMuZGFtcGluZz1cIit0LzEwMCtcImAgaW5zdGVhZC5cIiksdGhpcy5kYW1waW5nPXQvMTAwfSxnZXQgc3luY0NhbGxiYWNrcygpe3JldHVybiBuLnN5bmNDYWxsYmFja3N9LHNldCBzeW5jQ2FsbGJhY2tzKHQpe24uc3luY0NhbGxiYWNrcz0hIXR9LGdldCByZW5kZXJCeVBpeGVscygpe3JldHVybiBuLnJlbmRlckJ5UGl4ZWxzfSxzZXQgcmVuZGVyQnlQaXhlbHModCl7bi5yZW5kZXJCeVBpeGVscz0hIXR9LGdldCBhbHdheXNTaG93VHJhY2tzKCl7cmV0dXJuIG4uYWx3YXlzU2hvd1RyYWNrc30sc2V0IGFsd2F5c1Nob3dUcmFja3ModCl7dD0hIXQsbi5hbHdheXNTaG93VHJhY2tzPXQ7dmFyIHI9ZS50YXJnZXRzLmNvbnRhaW5lcjt0PyhlLnNob3dUcmFjaygpLHIuY2xhc3NMaXN0LmFkZChcInN0aWNreVwiKSk6KGUuaGlkZVRyYWNrKCksci5jbGFzc0xpc3QucmVtb3ZlKFwic3RpY2t5XCIpKX0sZ2V0IGNvbnRpbnVvdXNTY3JvbGxpbmcoKXtyZXR1cm4gaShuLmNvbnRpbnVvdXNTY3JvbGxpbmcpfSxzZXQgY29udGludW91c1Njcm9sbGluZyh0KXtcImF1dG9cIj09PXQ/bi5jb250aW51b3VzU2Nyb2xsaW5nPXQ6bi5jb250aW51b3VzU2Nyb2xsaW5nPSEhdH0sZ2V0IG92ZXJzY3JvbGxFZmZlY3QoKXtyZXR1cm4gbi5vdmVyc2Nyb2xsRWZmZWN0fSxzZXQgb3ZlcnNjcm9sbEVmZmVjdCh0KXt0JiYhfnIub3ZlcnNjcm9sbEVmZmVjdC5pbmRleE9mKHQpJiYoY29uc29sZS53YXJuKFwiYG92ZXJzY3JvbGxFZmZlY3RgIHNob3VsZCBiZSBvbmUgb2YgXCIrKDAscy5kZWZhdWx0KShyLm92ZXJzY3JvbGxFZmZlY3QpK1wiLCBidXQgZ290IFwiKygwLHMuZGVmYXVsdCkodCkrXCIuIEl0IHdpbGwgYmUgc2V0IHRvIGBmYWxzZWAgbm93LlwiKSx0PSExKSxuLm92ZXJzY3JvbGxFZmZlY3Q9dH0sZ2V0IG92ZXJzY3JvbGxFZmZlY3RDb2xvcigpe3JldHVybiBuLm92ZXJzY3JvbGxFZmZlY3RDb2xvcn0sc2V0IG92ZXJzY3JvbGxFZmZlY3RDb2xvcih0KXtuLm92ZXJzY3JvbGxFZmZlY3RDb2xvcj10fX07KDAsbC5kZWZhdWx0KShuKS5maWx0ZXIoZnVuY3Rpb24odCl7cmV0dXJuIXUuaGFzT3duUHJvcGVydHkodCl9KS5mb3JFYWNoKGZ1bmN0aW9uKHQpeygwLGEuZGVmYXVsdCkodSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBuW3RdfSxzZXQ6ZnVuY3Rpb24oZSl7aWYoaXNOYU4ocGFyc2VGbG9hdChlKSkpdGhyb3cgbmV3IFR5cGVFcnJvcihcImV4cGVjdCBgb3B0aW9ucy5cIit0K1wiYCB0byBiZSBhIG51bWJlciwgYnV0IGdvdCBcIisoXCJ1bmRlZmluZWRcIj09dHlwZW9mIGU/XCJ1bmRlZmluZWRcIjpiKGUpKSk7blt0XT1nLnBpY2tJblJhbmdlLmFwcGx5KHZvaWQgMCxbZV0uY29uY2F0KG8oclt0XSkpKX19KX0pLHRoaXMuX19yZWFkb25seShcIm9wdGlvbnNcIix1KSx0aGlzLnNldE9wdGlvbnModCl9dmFyIHU9big4NiksYT1yKHUpLGM9big5MCksbD1yKGMpLGY9bigxODApLHM9cihmKSxkPW4oMiksaD1yKGQpLHY9big1NSksXz1yKHYpLHA9big2MikseT1yKHApLGI9XCJmdW5jdGlvblwiPT10eXBlb2YgeS5kZWZhdWx0JiZcInN5bWJvbFwiPT10eXBlb2YgXy5kZWZhdWx0P2Z1bmN0aW9uKHQpe3JldHVybiB0eXBlb2YgdH06ZnVuY3Rpb24odCl7cmV0dXJuIHQmJlwiZnVuY3Rpb25cIj09dHlwZW9mIHkuZGVmYXVsdCYmdC5jb25zdHJ1Y3Rvcj09PXkuZGVmYXVsdCYmdCE9PXkuZGVmYXVsdC5wcm90b3R5cGU/XCJzeW1ib2xcIjp0eXBlb2YgdH0sZz1uKDExMiksbT1uKDc4KTtPYmplY3QuZGVmaW5lUHJvcGVydHkobS5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX19pbml0T3B0aW9uc1wiLHt2YWx1ZTppLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7dC5leHBvcnRzPXtkZWZhdWx0Om4oMTgxKSxfX2VzTW9kdWxlOiEwfX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMTIpLG89ci5KU09OfHwoci5KU09OPXtzdHJpbmdpZnk6SlNPTi5zdHJpbmdpZnl9KTt0LmV4cG9ydHM9ZnVuY3Rpb24odCl7cmV0dXJuIG8uc3RyaW5naWZ5LmFwcGx5KG8sYXJndW1lbnRzKX19LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKCl7dGhpcy51cGRhdGUoKSx0aGlzLl9fa2V5Ym9hcmRIYW5kbGVyKCksdGhpcy5fX3Jlc2l6ZUhhbmRsZXIoKSx0aGlzLl9fc2VsZWN0SGFuZGxlcigpLHRoaXMuX19tb3VzZUhhbmRsZXIoKSx0aGlzLl9fdG91Y2hIYW5kbGVyKCksdGhpcy5fX3doZWVsSGFuZGxlcigpLHRoaXMuX19kcmFnSGFuZGxlcigpLHRoaXMuX19yZW5kZXIoKX12YXIgbz1uKDc4KTtPYmplY3QuZGVmaW5lUHJvcGVydHkoby5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX19pbml0U2Nyb2xsYmFyXCIse3ZhbHVlOnIsd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX1mdW5jdGlvbiBvKHQsZSl7cmV0dXJuKDAsdS5kZWZhdWx0KSh0aGlzLHQse3ZhbHVlOmUsZW51bWVyYWJsZTohMCxjb25maWd1cmFibGU6ITB9KX12YXIgaT1uKDg2KSx1PXIoaSksYT1uKDc4KTtPYmplY3QuZGVmaW5lUHJvcGVydHkoYS5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX19yZWFkb25seVwiLHt2YWx1ZTpvLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcigpe3ZhciB0PXRoaXMudGFyZ2V0cyxlPXRoaXMuc2l6ZSxuPXRoaXMub2Zmc2V0LHI9dGhpcy50aHVtYk9mZnNldCxpPXRoaXMudGh1bWJTaXplO3IueD1uLngvZS5jb250ZW50LndpZHRoKihlLmNvbnRhaW5lci53aWR0aC0oaS54LWkucmVhbFgpKSxyLnk9bi55L2UuY29udGVudC5oZWlnaHQqKGUuY29udGFpbmVyLmhlaWdodC0oaS55LWkucmVhbFkpKSwoMCxvLnNldFN0eWxlKSh0LnhBeGlzLnRodW1iLHtcIi10cmFuc2Zvcm1cIjpcInRyYW5zbGF0ZTNkKFwiK3IueCtcInB4LCAwLCAwKVwifSksKDAsby5zZXRTdHlsZSkodC55QXhpcy50aHVtYix7XCItdHJhbnNmb3JtXCI6XCJ0cmFuc2xhdGUzZCgwLCBcIityLnkrXCJweCwgMClcIn0pfXZhciBvPW4oMTEyKSxpPW4oNzgpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShpLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUsXCJfX3NldFRodW1iUG9zaXRpb25cIix7dmFsdWU6cix3cml0YWJsZTohMCxjb25maWd1cmFibGU6ITB9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIoKXt2YXIgdD10aGlzLnRhcmdldHMuY29udGFpbmVyLGU9dC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxuPWUudG9wLHI9ZS5yaWdodCxvPWUuYm90dG9tLGk9ZS5sZWZ0LHU9d2luZG93LGE9dS5pbm5lckhlaWdodCxjPXUuaW5uZXJXaWR0aDt0aGlzLl9fcmVhZG9ubHkoXCJib3VuZGluZ1wiLHt0b3A6TWF0aC5tYXgobiwwKSxyaWdodDpNYXRoLm1pbihyLGMpLGJvdHRvbTpNYXRoLm1pbihvLGEpLGxlZnQ6TWF0aC5tYXgoaSwwKX0pfXZhciBvPW4oNzgpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShvLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUsXCJfX3VwZGF0ZUJvdW5kaW5nXCIse3ZhbHVlOnIsd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX1mdW5jdGlvbiBvKHQpe2lmKEFycmF5LmlzQXJyYXkodCkpe2Zvcih2YXIgZT0wLG49QXJyYXkodC5sZW5ndGgpO2U8dC5sZW5ndGg7ZSsrKW5bZV09dFtlXTtyZXR1cm4gbn1yZXR1cm4oMCxhLmRlZmF1bHQpKHQpfWZ1bmN0aW9uIGkoKXt2YXIgdD10aGlzLnRhcmdldHMsZT10LmNvbnRhaW5lcixuPXQuY29udGVudDt0aGlzLl9fcmVhZG9ubHkoXCJjaGlsZHJlblwiLFtdLmNvbmNhdChvKG4ucXVlcnlTZWxlY3RvckFsbChsLnNlbGVjdG9ycykpKSksdGhpcy5fX3JlYWRvbmx5KFwiaXNOZXN0ZWRTY3JvbGxiYXJcIiwhMSk7Zm9yKHZhciByPVtdLGk9ZTtpPWkucGFyZW50RWxlbWVudDspbC5zYkxpc3QuaGFzKGkpJiYodGhpcy5fX3JlYWRvbmx5KFwiaXNOZXN0ZWRTY3JvbGxiYXJcIiwhMCksci5wdXNoKGkpKTt0aGlzLl9fcmVhZG9ubHkoXCJwYXJlbnRzXCIscil9dmFyIHU9bigyKSxhPXIodSksYz1uKDc4KSxsPW4oODkpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShjLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUsXCJfX3VwZGF0ZVRyZWVcIix7dmFsdWU6aSx3cml0YWJsZTohMCxjb25maWd1cmFibGU6ITB9KX0sZnVuY3Rpb24odCxlKXt9XSl9KTsiLCJjb25zdCBQcm9ncmVzc0JhciA9IHJlcXVpcmUoJ3Byb2dyZXNzYmFyLmpzJyk7XHJcbmltcG9ydCBTY3JvbGxCYXIgZnJvbSAnc21vb3RoLXNjcm9sbGJhcic7XHJcbnJlcXVpcmUoJ3BlcmZlY3Qtc2Nyb2xsYmFyL2pxdWVyeScpO1xyXG5cclxuXHJcbmxldCBzcGVlZCA9IG5hdmlnYXRvci5hcHBOYW1lID09ICdNaWNyb3NvZnQgSW50ZXJuZXQgRXhwbG9yZXInIHx8ICEhKG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL1RyaWRlbnQvKSB8fCBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9ydjoxMS8pKSB8fCAodHlwZW9mICQuYnJvd3NlciAhPT0gXCJ1bmRlZmluZWRcIiAmJiAkLmJyb3dzZXIubXNpZSA9PSAxKSA/IDMuNCA6IDEuNztcclxuXHJcbmZ1bmN0aW9uIG1haW5TbGlkZXIoZSkge1xyXG4gICAgY29uc3Qgc2xpZGVyTmF2aWdhdGlvbiA9ICQoXCIubWVudV9fbmF2aWdhdGlvbi0tbGlzdFwiKTtcclxuICAgIGNvbnN0IHNsaWRlcldyYXBwZXIgPSAkKFwiLmNvbnRlbnRcIik7XHJcblxyXG4gICAgc2xpZGVyTmF2aWdhdGlvbi5vbignY2xpY2snLCAnbGknLCBmdW5jdGlvbiAoZSkge1xyXG5cclxuICAgICAgICAkKFwiLm1lbnVfX25hdmlnYXRpb24tLWxpc3QgbGlcIikucmVtb3ZlQ2xhc3MoXCJzZWxlY3RlZFwiKTtcclxuICAgICAgICBjb25zdCBzZWxlY3RlZEl0ZW0gPSAkKHRoaXMpO1xyXG4gICAgICAgICQodGhpcykuYWRkQ2xhc3MoXCJzZWxlY3RlZFwiKTtcclxuXHJcbiAgICAgICAgbGV0IHNlbGVjdGVkUG9zaXRpb24gPSBzZWxlY3RlZEl0ZW0uaW5kZXgoKTtcclxuXHJcbiAgICAgICAgaWYgKHNlbGVjdGVkUG9zaXRpb24gIT09IDcpIHtcclxuICAgICAgICAgICAgc2xpZGVyV3JhcHBlci5jc3Moe1xyXG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBgdHJhbnNsYXRlWCgtJHs4MDEgKiBzZWxlY3RlZFBvc2l0aW9ufXB4YFxyXG4gICAgICAgICAgICB9LCA1MDApO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBlc3RhYmxpc2hQcm9ncmVzc0Jhcihjb250YWluZXIsIHZhbHVlKSB7XHJcbiAgICBjb25zdCBiYXIgPSBuZXcgUHJvZ3Jlc3NCYXIuQ2lyY2xlKChjb250YWluZXIpLCB7XHJcbiAgICAgICAgdHJhaWxDb2xvcjogJyNjN2M3YzcnLFxyXG4gICAgICAgIHRyYWlsV2lkdGg6IDMsXHJcbiAgICAgICAgdGV4dDoge1xyXG4gICAgICAgICAgICB2YWx1ZTogJzAlJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZHVyYXRpb246IDEwMDAsXHJcbiAgICAgICAgZWFzaW5nOiAnYm91bmNlJyxcclxuICAgICAgICBzdHJva2VXaWR0aDogNCxcclxuICAgICAgICBmcm9tOiB7Y29sb3I6ICcjZmZmJ30sXHJcbiAgICAgICAgdG86IHtjb2xvcjogJyNmZmI0MDAnfSxcclxuICAgICAgICAvLyBTZXQgZGVmYXVsdCBzdGVwIGZ1bmN0aW9uIGZvciBhbGwgYW5pbWF0ZSBjYWxsc1xyXG4gICAgICAgIHN0ZXA6IGZ1bmN0aW9uIChzdGF0ZSwgY2lyY2xlKSB7XHJcbiAgICAgICAgICAgIGNpcmNsZS5zZXRUZXh0KChjaXJjbGUudmFsdWUoKSAqIDEwMCkudG9GaXhlZCgwKSArIFwiJVwiKTtcclxuICAgICAgICAgICAgY2lyY2xlLnBhdGguc2V0QXR0cmlidXRlKCdzdHJva2UnLCBzdGF0ZS5jb2xvcik7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBiYXIuYW5pbWF0ZSh2YWx1ZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGVzdGFibGlzaExpbmVQcm9ncmVzc0Jhcihjb250YWluZXIsIHZhbHVlLCBjb2xvcikge1xyXG4gICAgY29uc3QgYmFyID0gbmV3IFByb2dyZXNzQmFyLkxpbmUoY29udGFpbmVyLCB7XHJcbiAgICAgICAgc3Ryb2tlV2lkdGg6IDIwLFxyXG4gICAgICAgIGVhc2luZzogJ2Vhc2VJbk91dCcsXHJcbiAgICAgICAgZHVyYXRpb246IDE0MDAsXHJcbiAgICAgICAgdHJhaWxDb2xvcjogXCIjZTdlN2U3XCIsXHJcbiAgICAgICAgdHJhaWxXaWR0aDogNCxcclxuICAgICAgICBzdmdTdHlsZToge3dpZHRoOiAnMTAwJScsIGhlaWdodDogJzEwMCUnfSxcclxuICAgICAgICB0ZXh0OiB7XHJcbiAgICAgICAgICAgIGF1dG9TdHlsZUNvbnRhaW5lcjogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZyb206IHtjb2xvcjogJyNGRkYnfSxcclxuICAgICAgICB0bzoge2NvbG9yOiBjb2xvcn0sXHJcbiAgICAgICAgc3RlcDogKHN0YXRlLCBiYXIpID0+IHtcclxuICAgICAgICAgICAgYmFyLnNldFRleHQoTWF0aC5yb3VuZChiYXIudmFsdWUoKSAqIDEwMCkgKyAnPHNwYW4+JTwvc3Bhbj4nKTtcclxuICAgICAgICAgICAgYmFyLnBhdGguc2V0QXR0cmlidXRlKCdzdHJva2UnLCBzdGF0ZS5jb2xvcik7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgYmFyLmFuaW1hdGUodmFsdWUpOyAgLy8gTnVtYmVyIGZyb20gMC4wIHRvIDEuMFxyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0U2Nyb2xsQmFyRm9yVGhlU2VjaXRvbihzZWN0aW9uKXtcclxuICAgIFNjcm9sbEJhci5pbml0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHNlY3Rpb24pLCB7XHJcbiAgICAgICAgZGFtcGluZzogMC4wNSxcclxuICAgICAgICBzcGVlZDogc3BlZWQsXHJcbiAgICAgICAgYWx3YXlzU2hvd1RyYWNrczogdHJ1ZSxcclxuICAgICAgICBvdmVyc2Nyb2xsRWZmZWN0OiBcImJvdW5jZVwiLFxyXG4gICAgICAgIGNvbnRpbnVvdXNTY3JvbGxpbmc6IHRydWVcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBob21lUGFnZVNsaWRlcigpIHtcclxuICAgIGNvbnN0IHNsaWRlcyA9ICQoJy5zbGlkZV9vbmVfX3NsaWRlcl9fc2xpZGUnKTtcclxuICAgIGNvbnN0IHNlbGVjdGVkID0gXCJzZWxlY3RlZFwiO1xyXG4gICAgbGV0IGl0ZXJhdG9yID0gJChcIi5zbGlkZV9vbmVfX3NsaWRlcl9fc2xpZGUuc2VsZWN0ZWRcIikuaW5kZXgoKTtcclxuXHJcbiAgICBzbGlkZXMuZWFjaChmdW5jdGlvbihpbmRleCkge1xyXG4gICAgICAgICQoc2xpZGVzW2luZGV4XSkucmVtb3ZlQ2xhc3Moc2VsZWN0ZWQpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKGl0ZXJhdG9yID09PSBzbGlkZXMubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgIGl0ZXJhdG9yID0gMDtcclxuICAgICAgICAkKHNsaWRlc1tpdGVyYXRvcl0pLmFkZENsYXNzKHNlbGVjdGVkKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaXRlcmF0b3IrKztcclxuICAgICAgICAkKHNsaWRlc1tpdGVyYXRvcl0pLmFkZENsYXNzKHNlbGVjdGVkKTtcclxuICAgIH1cclxufVxyXG5cclxuLy9MaW5lIFByb2dyZXNzIEJhcnNcclxuLy9GRSBMSU5FU1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjaHRtbF9saW5lX2JhclwiLCAwLjk1ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjY3NzX2xpbmVfYmFyXCIsIDAuOTUgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNqcXVlcnlfbGluZV9iYXJcIiwgMC45NSAsIFwiIzljNWM1Y1wiKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI2Jvb3RzdHJhcF9saW5lX2JhclwiLCAwLjkgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNtYXRlcmlhbGl6ZV9saW5lX2JhclwiLCAwLjkgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNlY21hNV9saW5lX2JhclwiLCAwLjg1ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjZWNtYTY3X2xpbmVfYmFyXCIsIDAuODUgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNyZWFjdF9saW5lX2JhclwiLCAwLjggLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNndWxwX2xpbmVfYmFyXCIsIDAuOCAsIFwiIzljNWM1Y1wiKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI2phZGVfbGluZV9iYXJcIiwgMC44ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjc2Fzc19saW5lX2JhclwiLCAwLjggLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNsZXNzX2xpbmVfYmFyXCIsIDAuOCAsIFwiIzljNWM1Y1wiKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI3Z1ZV9saW5lX2JhclwiLCAwLjc1ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjcmVkdXhfbGluZV9iYXJcIiwgMC43NSAsIFwiIzljNWM1Y1wiKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI2ZvdW5kYXRpb25fbGluZV9iYXJcIiwgMC43NSAsIFwiIzljNWM1Y1wiKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI2dpdF9saW5lX2JhclwiLCAwLjc1ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjY2hhaV9saW5lX2JhclwiLCAwLjY1ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjc2lub25fbGluZV9iYXJcIiwgMC42ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjYW5ndWxhcl9saW5lX2JhclwiLCAwLjU1ICwgXCIjOWM1YzVjXCIpO1xyXG4vL0VORCBPRiBGRSBMSU5FU1xyXG5cclxuLy9EQiBMSU5FU1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjc3FsX2xpbmVfYmFyXCIsIDAuODUsICcjZmZiNDAwJyk7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNteXNxbF9saW5lX2JhclwiLCAwLjg1LCAnI2ZmYjQwMCcpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjcGxzcWxfbGluZV9iYXJcIiwgMC43NSwgJyNmZmI0MDAnKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI2RiMl9saW5lX2JhclwiLCAwLjc1LCAnI2ZmYjQwMCcpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjb3JhY2xlX2xpbmVfYmFyXCIsIDAuNywgJyNmZmI0MDAnKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI3NlcnZlcl9saW5lX2JhclwiLCAwLjcsICcjZmZiNDAwJyk7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiN0c3FsX2xpbmVfYmFyXCIsIDAuNSwgJyNmZmI0MDAnKTtcclxuLy9FTkQgT0YgREIgTElORVNcclxuXHJcbi8vQkUgTElORVNcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI25vZGVfbGluZV9iYXJcIiwgMC43NSAsIFwiIzljNWM1Y1wiKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI2FzcF9saW5lX2JhclwiLCAwLjcgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNleHByZXNzX2xpbmVfYmFyXCIsIDAuNjUgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNrb2FfbGluZV9iYXJcIiwgMC42NSAsIFwiIzljNWM1Y1wiKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI21vY2hhX2xpbmVfYmFyXCIsIDAuNjUgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNtb25nb19saW5lX2JhclwiLCAwLjY1ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjbW9uZ29vc2VfbGluZV9iYXJcIiwgMC42NSAsIFwiIzljNWM1Y1wiKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI29ybV9saW5lX2JhclwiLCAwLjYgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNqYXZhZWVfbGluZV9iYXJcIiwgMC40NSAsIFwiIzljNWM1Y1wiKTtcclxuLy9FTkQgT0YgQkUgTElORVNcclxuXHJcbi8vREVWT1BTIExJTkVTXHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNucG1fbGluZV9iYXJcIiwgMC45NSwgJyNmZmI0MDAnKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI2Jvd2VyX2xpbmVfYmFyXCIsIDAuOTUsICcjZmZiNDAwJyk7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNkb2NrZXJfbGluZV9iYXJcIiwgMC43NSwgJyNmZmI0MDAnKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI2Jvb3RfbGluZV9iYXJcIiwgMC43LCAnI2ZmYjQwMCcpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjY29tcG9zZV9saW5lX2JhclwiLCAwLjY1LCAnI2ZmYjQwMCcpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIja3ViZXJuZXRlc19saW5lX2JhclwiLCAwLjU1LCAnI2ZmYjQwMCcpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjc3dhcm1fbGluZV9iYXJcIiwgMC41LCAnI2ZmYjQwMCcpO1xyXG4vL0VORCBPRiBERVZPUFMgTElORVNcclxuXHJcbi8vTGFuZ3VhZ2VzIGxpbmVzXHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNqc19saW5lX2JhclwiLCAwLjkgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNqYXZhX2xpbmVfYmFyXCIsIDAuNzUgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNjc19saW5lX2JhclwiLCAwLjcgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNwZXJsX2xpbmVfYmFyXCIsIDAuNTUgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNjcGx1c19saW5lX2JhclwiLCAwLjQ1ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjc2hlbGxfbGluZV9iYXJcIiwgMC40NSAsIFwiIzljNWM1Y1wiKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI3BocF9saW5lX2JhclwiLCAwLjQ1ICwgXCIjOWM1YzVjXCIpO1xyXG4vL0VuZCBvZiBsYW5ndWFnZXMgbGluZVxyXG5cclxuLy9FbmQgb2YgTGluZSBwcm9ncmVzcyBCYXJzXHJcblxyXG4vL1JhZGlhbCBQcm9ncmVzcyBCYXJzXHJcbmVzdGFibGlzaFByb2dyZXNzQmFyKFwiI2Zyb250X2VuZF9wYlwiLCAwLjkpO1xyXG5lc3RhYmxpc2hQcm9ncmVzc0JhcihcIiNiYWNrX2VuZF9wYlwiLCAwLjYpO1xyXG5lc3RhYmxpc2hQcm9ncmVzc0JhcihcIiNkYl9kZXZfcGJcIiwgMC43KTtcclxuZXN0YWJsaXNoUHJvZ3Jlc3NCYXIoXCIjcHJvZF9lbmdfcGJcIiwgMC42KTtcclxuLy9FbmQgb2YgUmFkaWFsIFByb2dyZXNzIEJhcnNcclxuXHJcbmluaXRTY3JvbGxCYXJGb3JUaGVTZWNpdG9uKFwic2xpZGVfdHdvXCIpO1xyXG5pbml0U2Nyb2xsQmFyRm9yVGhlU2VjaXRvbihcInNsaWRlX3RocmVlXCIpO1xyXG5pbml0U2Nyb2xsQmFyRm9yVGhlU2VjaXRvbihcInNsaWRlX2ZvdXJcIik7XHJcbmluaXRTY3JvbGxCYXJGb3JUaGVTZWNpdG9uKFwic2xpZGVfZml2ZVwiKTtcclxuaW5pdFNjcm9sbEJhckZvclRoZVNlY2l0b24oXCJzbGlkZV9zaXhcIik7XHJcbmluaXRTY3JvbGxCYXJGb3JUaGVTZWNpdG9uKFwic2xpZGVfc2V2ZW5cIik7XHJcblxyXG5tYWluU2xpZGVyKCk7XHJcblxyXG5zZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcclxuICAgIGhvbWVQYWdlU2xpZGVyKCk7XHJcbn0sIDgwMDApO1xyXG5cclxubGV0IGkgPSAxO1xyXG5zZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICBjb25zdCBjb2xvckFycmF5ID0gW1wiI2ZmYjQwMFwiLFwiI2ZmZlwiLFwicmdiYSgxMDAsIDAsIDAsIDAuNSlcIl07XHJcbiAgICAkKFwiLnNsaWRlX29uZV9fY292ZXJfX2Rlc2NyaXB0aW9uLS1pbnRyb1wiKS5jc3Moe1xyXG4gICAgICAgICd0ZXh0LXNoYWRvdyc6IChpJTIgPT09IDApID8gYDAgMCAxMHB4ICNmZmI0MDBgIDogXCJub25lXCJcclxuICAgIH0pO1xyXG4gICAgaSsrO1xyXG59LCA3NTApOyJdfQ==
