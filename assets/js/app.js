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

        sliderWrapper.css({
            transform: 'translateX(-' + 801 * selectedPosition + 'px'
        }, 500);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcGVyZmVjdC1zY3JvbGxiYXIvanF1ZXJ5LmpzIiwibm9kZV9tb2R1bGVzL3BlcmZlY3Qtc2Nyb2xsYmFyL3NyYy9qcy9hZGFwdG9yL2pxdWVyeS5qcyIsIm5vZGVfbW9kdWxlcy9wZXJmZWN0LXNjcm9sbGJhci9zcmMvanMvbGliL2RvbS5qcyIsIm5vZGVfbW9kdWxlcy9wZXJmZWN0LXNjcm9sbGJhci9zcmMvanMvbGliL2V2ZW50LW1hbmFnZXIuanMiLCJub2RlX21vZHVsZXMvcGVyZmVjdC1zY3JvbGxiYXIvc3JjL2pzL2xpYi9ndWlkLmpzIiwibm9kZV9tb2R1bGVzL3BlcmZlY3Qtc2Nyb2xsYmFyL3NyYy9qcy9saWIvaGVscGVyLmpzIiwibm9kZV9tb2R1bGVzL3BlcmZlY3Qtc2Nyb2xsYmFyL3NyYy9qcy9tYWluLmpzIiwibm9kZV9tb2R1bGVzL3BlcmZlY3Qtc2Nyb2xsYmFyL3NyYy9qcy9wbHVnaW4vZGVmYXVsdC1zZXR0aW5nLmpzIiwibm9kZV9tb2R1bGVzL3BlcmZlY3Qtc2Nyb2xsYmFyL3NyYy9qcy9wbHVnaW4vZGVzdHJveS5qcyIsIm5vZGVfbW9kdWxlcy9wZXJmZWN0LXNjcm9sbGJhci9zcmMvanMvcGx1Z2luL2hhbmRsZXIvY2xpY2stcmFpbC5qcyIsIm5vZGVfbW9kdWxlcy9wZXJmZWN0LXNjcm9sbGJhci9zcmMvanMvcGx1Z2luL2hhbmRsZXIvZHJhZy1zY3JvbGxiYXIuanMiLCJub2RlX21vZHVsZXMvcGVyZmVjdC1zY3JvbGxiYXIvc3JjL2pzL3BsdWdpbi9oYW5kbGVyL2tleWJvYXJkLmpzIiwibm9kZV9tb2R1bGVzL3BlcmZlY3Qtc2Nyb2xsYmFyL3NyYy9qcy9wbHVnaW4vaGFuZGxlci9tb3VzZS13aGVlbC5qcyIsIm5vZGVfbW9kdWxlcy9wZXJmZWN0LXNjcm9sbGJhci9zcmMvanMvcGx1Z2luL2hhbmRsZXIvbmF0aXZlLXNjcm9sbC5qcyIsIm5vZGVfbW9kdWxlcy9wZXJmZWN0LXNjcm9sbGJhci9zcmMvanMvcGx1Z2luL2hhbmRsZXIvc2VsZWN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL3BlcmZlY3Qtc2Nyb2xsYmFyL3NyYy9qcy9wbHVnaW4vaGFuZGxlci90b3VjaC5qcyIsIm5vZGVfbW9kdWxlcy9wZXJmZWN0LXNjcm9sbGJhci9zcmMvanMvcGx1Z2luL2luaXRpYWxpemUuanMiLCJub2RlX21vZHVsZXMvcGVyZmVjdC1zY3JvbGxiYXIvc3JjL2pzL3BsdWdpbi9pbnN0YW5jZXMuanMiLCJub2RlX21vZHVsZXMvcGVyZmVjdC1zY3JvbGxiYXIvc3JjL2pzL3BsdWdpbi91cGRhdGUtZ2VvbWV0cnkuanMiLCJub2RlX21vZHVsZXMvcGVyZmVjdC1zY3JvbGxiYXIvc3JjL2pzL3BsdWdpbi91cGRhdGUtc2Nyb2xsLmpzIiwibm9kZV9tb2R1bGVzL3BlcmZlY3Qtc2Nyb2xsYmFyL3NyYy9qcy9wbHVnaW4vdXBkYXRlLmpzIiwibm9kZV9tb2R1bGVzL3Byb2dyZXNzYmFyLmpzL3NyYy9jaXJjbGUuanMiLCJub2RlX21vZHVsZXMvcHJvZ3Jlc3NiYXIuanMvc3JjL2xpbmUuanMiLCJub2RlX21vZHVsZXMvcHJvZ3Jlc3NiYXIuanMvc3JjL21haW4uanMiLCJub2RlX21vZHVsZXMvcHJvZ3Jlc3NiYXIuanMvc3JjL3BhdGguanMiLCJub2RlX21vZHVsZXMvcHJvZ3Jlc3NiYXIuanMvc3JjL3NlbWljaXJjbGUuanMiLCJub2RlX21vZHVsZXMvcHJvZ3Jlc3NiYXIuanMvc3JjL3NoYXBlLmpzIiwibm9kZV9tb2R1bGVzL3Byb2dyZXNzYmFyLmpzL3NyYy91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9zaGlmdHkvZGlzdC9zaGlmdHkuanMiLCJub2RlX21vZHVsZXMvc21vb3RoLXNjcm9sbGJhci9kaXN0L3Ntb290aC1zY3JvbGxiYXIuanMiLCJzcmNcXGpzXFxhcHAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbm5EQTtBQUNBO0FBQ0E7Ozs7QUNEQTs7Ozs7O0FBREEsSUFBTSxjQUFjLFFBQVEsZ0JBQVIsQ0FBcEI7O0FBRUEsUUFBUSwwQkFBUjs7QUFHQSxJQUFJLFFBQVEsVUFBVSxPQUFWLElBQXFCLDZCQUFyQixJQUFzRCxDQUFDLEVBQUUsVUFBVSxTQUFWLENBQW9CLEtBQXBCLENBQTBCLFNBQTFCLEtBQXdDLFVBQVUsU0FBVixDQUFvQixLQUFwQixDQUEwQixPQUExQixDQUExQyxDQUF2RCxJQUF5SSxPQUFPLEVBQUUsT0FBVCxLQUFxQixXQUFyQixJQUFvQyxFQUFFLE9BQUYsQ0FBVSxJQUFWLElBQWtCLENBQS9MLEdBQW9NLEdBQXBNLEdBQTBNLEdBQXROOztBQUVBLFNBQVMsVUFBVCxDQUFvQixDQUFwQixFQUF1QjtBQUNuQixRQUFNLG1CQUFtQixFQUFFLHlCQUFGLENBQXpCO0FBQ0EsUUFBTSxnQkFBZ0IsRUFBRSxVQUFGLENBQXRCOztBQUVBLHFCQUFpQixFQUFqQixDQUFvQixPQUFwQixFQUE2QixJQUE3QixFQUFtQyxVQUFVLENBQVYsRUFBYTs7QUFFNUMsVUFBRSw0QkFBRixFQUFnQyxXQUFoQyxDQUE0QyxVQUE1QztBQUNBLFlBQU0sZUFBZSxFQUFFLElBQUYsQ0FBckI7QUFDQSxVQUFFLElBQUYsRUFBUSxRQUFSLENBQWlCLFVBQWpCOztBQUVBLFlBQUksbUJBQW1CLGFBQWEsS0FBYixFQUF2Qjs7QUFFQSxzQkFBYyxHQUFkLENBQWtCO0FBQ2Qsd0NBQTBCLE1BQU0sZ0JBQWhDO0FBRGMsU0FBbEIsRUFFRyxHQUZIO0FBR0gsS0FYRDtBQVlIOztBQUVELFNBQVMsb0JBQVQsQ0FBOEIsU0FBOUIsRUFBeUMsS0FBekMsRUFBZ0Q7QUFDNUMsUUFBTSxNQUFNLElBQUksWUFBWSxNQUFoQixDQUF3QixTQUF4QixFQUFvQztBQUM1QyxvQkFBWSxTQURnQztBQUU1QyxvQkFBWSxDQUZnQztBQUc1QyxjQUFNO0FBQ0YsbUJBQU87QUFETCxTQUhzQztBQU01QyxrQkFBVSxJQU5rQztBQU81QyxnQkFBUSxRQVBvQztBQVE1QyxxQkFBYSxDQVIrQjtBQVM1QyxjQUFNLEVBQUMsT0FBTyxNQUFSLEVBVHNDO0FBVTVDLFlBQUksRUFBQyxPQUFPLFNBQVIsRUFWd0M7QUFXNUM7QUFDQSxjQUFNLGNBQVUsS0FBVixFQUFpQixNQUFqQixFQUF5QjtBQUMzQixtQkFBTyxPQUFQLENBQWUsQ0FBQyxPQUFPLEtBQVAsS0FBaUIsR0FBbEIsRUFBdUIsT0FBdkIsQ0FBK0IsQ0FBL0IsSUFBb0MsR0FBbkQ7QUFDQSxtQkFBTyxJQUFQLENBQVksWUFBWixDQUF5QixRQUF6QixFQUFtQyxNQUFNLEtBQXpDO0FBQ0g7QUFmMkMsS0FBcEMsQ0FBWjtBQWlCQSxRQUFJLE9BQUosQ0FBWSxLQUFaO0FBQ0g7O0FBRUQsU0FBUyx3QkFBVCxDQUFrQyxTQUFsQyxFQUE2QyxLQUE3QyxFQUFvRCxLQUFwRCxFQUEyRDtBQUN2RCxRQUFNLE1BQU0sSUFBSSxZQUFZLElBQWhCLENBQXFCLFNBQXJCLEVBQWdDO0FBQ3hDLHFCQUFhLEVBRDJCO0FBRXhDLGdCQUFRLFdBRmdDO0FBR3hDLGtCQUFVLElBSDhCO0FBSXhDLG9CQUFZLFNBSjRCO0FBS3hDLG9CQUFZLENBTDRCO0FBTXhDLGtCQUFVLEVBQUMsT0FBTyxNQUFSLEVBQWdCLFFBQVEsTUFBeEIsRUFOOEI7QUFPeEMsY0FBTTtBQUNGLGdDQUFvQjtBQURsQixTQVBrQztBQVV4QyxjQUFNLEVBQUMsT0FBTyxNQUFSLEVBVmtDO0FBV3hDLFlBQUksRUFBQyxPQUFPLEtBQVIsRUFYb0M7QUFZeEMsY0FBTSxjQUFDLEtBQUQsRUFBUSxHQUFSLEVBQWdCO0FBQ2xCLGdCQUFJLE9BQUosQ0FBWSxLQUFLLEtBQUwsQ0FBVyxJQUFJLEtBQUosS0FBYyxHQUF6QixJQUFnQyxnQkFBNUM7QUFDQSxnQkFBSSxJQUFKLENBQVMsWUFBVCxDQUFzQixRQUF0QixFQUFnQyxNQUFNLEtBQXRDO0FBQ0g7QUFmdUMsS0FBaEMsQ0FBWjs7QUFrQkEsUUFBSSxPQUFKLENBQVksS0FBWixFQW5CdUQsQ0FtQmxDO0FBQ3hCOztBQUVELFNBQVMsMEJBQVQsQ0FBb0MsT0FBcEMsRUFBNEM7QUFDeEMsOEJBQVUsSUFBVixDQUFlLFNBQVMsY0FBVCxDQUF3QixPQUF4QixDQUFmLEVBQWlEO0FBQzdDLGlCQUFTLElBRG9DO0FBRTdDLGVBQU8sS0FGc0M7QUFHN0MsMEJBQWtCLElBSDJCO0FBSTdDLDBCQUFrQixRQUoyQjtBQUs3Qyw2QkFBcUI7QUFMd0IsS0FBakQ7QUFPSDs7QUFFRCxTQUFTLGNBQVQsR0FBMEI7QUFDdEIsUUFBTSxTQUFTLEVBQUUsMkJBQUYsQ0FBZjtBQUNBLFFBQU0sV0FBVyxVQUFqQjtBQUNBLFFBQUksV0FBVyxFQUFFLG9DQUFGLEVBQXdDLEtBQXhDLEVBQWY7O0FBRUEsV0FBTyxJQUFQLENBQVksVUFBUyxLQUFULEVBQWdCO0FBQ3hCLFVBQUUsT0FBTyxLQUFQLENBQUYsRUFBaUIsV0FBakIsQ0FBNkIsUUFBN0I7QUFDSCxLQUZEOztBQUlBLFFBQUksYUFBYSxPQUFPLE1BQVAsR0FBZ0IsQ0FBakMsRUFBb0M7QUFDaEMsbUJBQVcsQ0FBWDtBQUNBLFVBQUUsT0FBTyxRQUFQLENBQUYsRUFBb0IsUUFBcEIsQ0FBNkIsUUFBN0I7QUFDSCxLQUhELE1BR087QUFDSDtBQUNBLFVBQUUsT0FBTyxRQUFQLENBQUYsRUFBb0IsUUFBcEIsQ0FBNkIsUUFBN0I7QUFDSDtBQUNKOztBQUVEO0FBQ0E7QUFDQSx5QkFBeUIsZ0JBQXpCLEVBQTJDLElBQTNDLEVBQWtELFNBQWxEO0FBQ0EseUJBQXlCLGVBQXpCLEVBQTBDLElBQTFDLEVBQWlELFNBQWpEO0FBQ0EseUJBQXlCLGtCQUF6QixFQUE2QyxJQUE3QyxFQUFvRCxTQUFwRDtBQUNBLHlCQUF5QixxQkFBekIsRUFBZ0QsR0FBaEQsRUFBc0QsU0FBdEQ7QUFDQSx5QkFBeUIsdUJBQXpCLEVBQWtELEdBQWxELEVBQXdELFNBQXhEO0FBQ0EseUJBQXlCLGlCQUF6QixFQUE0QyxJQUE1QyxFQUFtRCxTQUFuRDtBQUNBLHlCQUF5QixrQkFBekIsRUFBNkMsSUFBN0MsRUFBb0QsU0FBcEQ7QUFDQSx5QkFBeUIsaUJBQXpCLEVBQTRDLEdBQTVDLEVBQWtELFNBQWxEO0FBQ0EseUJBQXlCLGdCQUF6QixFQUEyQyxHQUEzQyxFQUFpRCxTQUFqRDtBQUNBLHlCQUF5QixnQkFBekIsRUFBMkMsR0FBM0MsRUFBaUQsU0FBakQ7QUFDQSx5QkFBeUIsZ0JBQXpCLEVBQTJDLEdBQTNDLEVBQWlELFNBQWpEO0FBQ0EseUJBQXlCLGdCQUF6QixFQUEyQyxHQUEzQyxFQUFpRCxTQUFqRDtBQUNBLHlCQUF5QixlQUF6QixFQUEwQyxJQUExQyxFQUFpRCxTQUFqRDtBQUNBLHlCQUF5QixpQkFBekIsRUFBNEMsSUFBNUMsRUFBbUQsU0FBbkQ7QUFDQSx5QkFBeUIsc0JBQXpCLEVBQWlELElBQWpELEVBQXdELFNBQXhEO0FBQ0EseUJBQXlCLGVBQXpCLEVBQTBDLElBQTFDLEVBQWlELFNBQWpEO0FBQ0EseUJBQXlCLGdCQUF6QixFQUEyQyxJQUEzQyxFQUFrRCxTQUFsRDtBQUNBLHlCQUF5QixpQkFBekIsRUFBNEMsR0FBNUMsRUFBa0QsU0FBbEQ7QUFDQSx5QkFBeUIsbUJBQXpCLEVBQThDLElBQTlDLEVBQXFELFNBQXJEO0FBQ0E7O0FBRUE7QUFDQSx5QkFBeUIsZUFBekIsRUFBMEMsSUFBMUMsRUFBZ0QsU0FBaEQ7QUFDQSx5QkFBeUIsaUJBQXpCLEVBQTRDLElBQTVDLEVBQWtELFNBQWxEO0FBQ0EseUJBQXlCLGlCQUF6QixFQUE0QyxJQUE1QyxFQUFrRCxTQUFsRDtBQUNBLHlCQUF5QixlQUF6QixFQUEwQyxJQUExQyxFQUFnRCxTQUFoRDtBQUNBLHlCQUF5QixrQkFBekIsRUFBNkMsR0FBN0MsRUFBa0QsU0FBbEQ7QUFDQSx5QkFBeUIsa0JBQXpCLEVBQTZDLEdBQTdDLEVBQWtELFNBQWxEO0FBQ0EseUJBQXlCLGdCQUF6QixFQUEyQyxHQUEzQyxFQUFnRCxTQUFoRDtBQUNBOztBQUVBO0FBQ0EseUJBQXlCLGdCQUF6QixFQUEyQyxJQUEzQyxFQUFrRCxTQUFsRDtBQUNBLHlCQUF5QixlQUF6QixFQUEwQyxHQUExQyxFQUFnRCxTQUFoRDtBQUNBLHlCQUF5QixtQkFBekIsRUFBOEMsSUFBOUMsRUFBcUQsU0FBckQ7QUFDQSx5QkFBeUIsZUFBekIsRUFBMEMsSUFBMUMsRUFBaUQsU0FBakQ7QUFDQSx5QkFBeUIsaUJBQXpCLEVBQTRDLElBQTVDLEVBQW1ELFNBQW5EO0FBQ0EseUJBQXlCLGlCQUF6QixFQUE0QyxJQUE1QyxFQUFtRCxTQUFuRDtBQUNBLHlCQUF5QixvQkFBekIsRUFBK0MsSUFBL0MsRUFBc0QsU0FBdEQ7QUFDQSx5QkFBeUIsZUFBekIsRUFBMEMsR0FBMUMsRUFBZ0QsU0FBaEQ7QUFDQSx5QkFBeUIsa0JBQXpCLEVBQTZDLElBQTdDLEVBQW9ELFNBQXBEO0FBQ0E7O0FBRUE7QUFDQSx5QkFBeUIsZUFBekIsRUFBMEMsSUFBMUMsRUFBZ0QsU0FBaEQ7QUFDQSx5QkFBeUIsaUJBQXpCLEVBQTRDLElBQTVDLEVBQWtELFNBQWxEO0FBQ0EseUJBQXlCLGtCQUF6QixFQUE2QyxJQUE3QyxFQUFtRCxTQUFuRDtBQUNBLHlCQUF5QixnQkFBekIsRUFBMkMsR0FBM0MsRUFBZ0QsU0FBaEQ7QUFDQSx5QkFBeUIsbUJBQXpCLEVBQThDLElBQTlDLEVBQW9ELFNBQXBEO0FBQ0EseUJBQXlCLHNCQUF6QixFQUFpRCxJQUFqRCxFQUF1RCxTQUF2RDtBQUNBLHlCQUF5QixpQkFBekIsRUFBNEMsR0FBNUMsRUFBaUQsU0FBakQ7QUFDQTs7QUFFQTtBQUNBLHlCQUF5QixjQUF6QixFQUF5QyxHQUF6QyxFQUErQyxTQUEvQztBQUNBLHlCQUF5QixnQkFBekIsRUFBMkMsSUFBM0MsRUFBa0QsU0FBbEQ7QUFDQSx5QkFBeUIsY0FBekIsRUFBeUMsR0FBekMsRUFBK0MsU0FBL0M7QUFDQSx5QkFBeUIsZ0JBQXpCLEVBQTJDLElBQTNDLEVBQWtELFNBQWxEO0FBQ0EseUJBQXlCLGlCQUF6QixFQUE0QyxJQUE1QyxFQUFtRCxTQUFuRDtBQUNBLHlCQUF5QixpQkFBekIsRUFBNEMsSUFBNUMsRUFBbUQsU0FBbkQ7QUFDQSx5QkFBeUIsZUFBekIsRUFBMEMsSUFBMUMsRUFBaUQsU0FBakQ7QUFDQTs7QUFFQTs7QUFFQTtBQUNBLHFCQUFxQixlQUFyQixFQUFzQyxHQUF0QztBQUNBLHFCQUFxQixjQUFyQixFQUFxQyxHQUFyQztBQUNBLHFCQUFxQixZQUFyQixFQUFtQyxHQUFuQztBQUNBLHFCQUFxQixjQUFyQixFQUFxQyxHQUFyQztBQUNBOztBQUVBLDJCQUEyQixXQUEzQjtBQUNBLDJCQUEyQixhQUEzQjtBQUNBLDJCQUEyQixZQUEzQjtBQUNBLDJCQUEyQixZQUEzQjtBQUNBLDJCQUEyQixXQUEzQjtBQUNBLDJCQUEyQixhQUEzQjs7QUFFQTs7QUFFQSxZQUFZLFlBQVc7QUFDbkI7QUFDSCxDQUZELEVBRUcsSUFGSDs7QUFJQSxJQUFJLElBQUksQ0FBUjtBQUNBLFlBQVksWUFBTTtBQUNkLFFBQU0sYUFBYSxDQUFDLFNBQUQsRUFBVyxNQUFYLEVBQWtCLHNCQUFsQixDQUFuQjtBQUNBLE1BQUUsdUNBQUYsRUFBMkMsR0FBM0MsQ0FBK0M7QUFDM0MsdUJBQWdCLElBQUUsQ0FBRixLQUFRLENBQVQsd0JBQW1DO0FBRFAsS0FBL0M7QUFHQTtBQUNILENBTkQsRUFNRyxHQU5IIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3NyYy9qcy9hZGFwdG9yL2pxdWVyeScpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcHMgPSByZXF1aXJlKCcuLi9tYWluJyk7XG52YXIgcHNJbnN0YW5jZXMgPSByZXF1aXJlKCcuLi9wbHVnaW4vaW5zdGFuY2VzJyk7XG5cbmZ1bmN0aW9uIG1vdW50SlF1ZXJ5KGpRdWVyeSkge1xuICBqUXVlcnkuZm4ucGVyZmVjdFNjcm9sbGJhciA9IGZ1bmN0aW9uIChzZXR0aW5nT3JDb21tYW5kKSB7XG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAodHlwZW9mIHNldHRpbmdPckNvbW1hbmQgPT09ICdvYmplY3QnIHx8XG4gICAgICAgICAgdHlwZW9mIHNldHRpbmdPckNvbW1hbmQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIC8vIElmIGl0J3MgYW4gb2JqZWN0IG9yIG5vbmUsIGluaXRpYWxpemUuXG4gICAgICAgIHZhciBzZXR0aW5ncyA9IHNldHRpbmdPckNvbW1hbmQ7XG5cbiAgICAgICAgaWYgKCFwc0luc3RhbmNlcy5nZXQodGhpcykpIHtcbiAgICAgICAgICBwcy5pbml0aWFsaXplKHRoaXMsIHNldHRpbmdzKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVW5sZXNzLCBpdCBtYXkgYmUgYSBjb21tYW5kLlxuICAgICAgICB2YXIgY29tbWFuZCA9IHNldHRpbmdPckNvbW1hbmQ7XG5cbiAgICAgICAgaWYgKGNvbW1hbmQgPT09ICd1cGRhdGUnKSB7XG4gICAgICAgICAgcHMudXBkYXRlKHRoaXMpO1xuICAgICAgICB9IGVsc2UgaWYgKGNvbW1hbmQgPT09ICdkZXN0cm95Jykge1xuICAgICAgICAgIHBzLmRlc3Ryb3kodGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn1cblxuaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG4gIGRlZmluZShbJ2pxdWVyeSddLCBtb3VudEpRdWVyeSk7XG59IGVsc2Uge1xuICB2YXIganEgPSB3aW5kb3cualF1ZXJ5ID8gd2luZG93LmpRdWVyeSA6IHdpbmRvdy4kO1xuICBpZiAodHlwZW9mIGpxICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vdW50SlF1ZXJ5KGpxKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1vdW50SlF1ZXJ5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgRE9NID0ge307XG5cbkRPTS5jcmVhdGUgPSBmdW5jdGlvbiAodGFnTmFtZSwgY2xhc3NOYW1lKSB7XG4gIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcbiAgZWxlbWVudC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gIHJldHVybiBlbGVtZW50O1xufTtcblxuRE9NLmFwcGVuZFRvID0gZnVuY3Rpb24gKGNoaWxkLCBwYXJlbnQpIHtcbiAgcGFyZW50LmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgcmV0dXJuIGNoaWxkO1xufTtcblxuZnVuY3Rpb24gY3NzR2V0KGVsZW1lbnQsIHN0eWxlTmFtZSkge1xuICByZXR1cm4gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudClbc3R5bGVOYW1lXTtcbn1cblxuZnVuY3Rpb24gY3NzU2V0KGVsZW1lbnQsIHN0eWxlTmFtZSwgc3R5bGVWYWx1ZSkge1xuICBpZiAodHlwZW9mIHN0eWxlVmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgc3R5bGVWYWx1ZSA9IHN0eWxlVmFsdWUudG9TdHJpbmcoKSArICdweCc7XG4gIH1cbiAgZWxlbWVudC5zdHlsZVtzdHlsZU5hbWVdID0gc3R5bGVWYWx1ZTtcbiAgcmV0dXJuIGVsZW1lbnQ7XG59XG5cbmZ1bmN0aW9uIGNzc011bHRpU2V0KGVsZW1lbnQsIG9iaikge1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgdmFyIHZhbCA9IG9ialtrZXldO1xuICAgIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgICAgdmFsID0gdmFsLnRvU3RyaW5nKCkgKyAncHgnO1xuICAgIH1cbiAgICBlbGVtZW50LnN0eWxlW2tleV0gPSB2YWw7XG4gIH1cbiAgcmV0dXJuIGVsZW1lbnQ7XG59XG5cbkRPTS5jc3MgPSBmdW5jdGlvbiAoZWxlbWVudCwgc3R5bGVOYW1lT3JPYmplY3QsIHN0eWxlVmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBzdHlsZU5hbWVPck9iamVjdCA9PT0gJ29iamVjdCcpIHtcbiAgICAvLyBtdWx0aXBsZSBzZXQgd2l0aCBvYmplY3RcbiAgICByZXR1cm4gY3NzTXVsdGlTZXQoZWxlbWVudCwgc3R5bGVOYW1lT3JPYmplY3QpO1xuICB9IGVsc2Uge1xuICAgIGlmICh0eXBlb2Ygc3R5bGVWYWx1ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiBjc3NHZXQoZWxlbWVudCwgc3R5bGVOYW1lT3JPYmplY3QpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3NzU2V0KGVsZW1lbnQsIHN0eWxlTmFtZU9yT2JqZWN0LCBzdHlsZVZhbHVlKTtcbiAgICB9XG4gIH1cbn07XG5cbkRPTS5tYXRjaGVzID0gZnVuY3Rpb24gKGVsZW1lbnQsIHF1ZXJ5KSB7XG4gIGlmICh0eXBlb2YgZWxlbWVudC5tYXRjaGVzICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBlbGVtZW50Lm1hdGNoZXMocXVlcnkpO1xuICB9IGVsc2Uge1xuICAgIC8vIG11c3QgYmUgSUUxMSBhbmQgRWRnZVxuICAgIHJldHVybiBlbGVtZW50Lm1zTWF0Y2hlc1NlbGVjdG9yKHF1ZXJ5KTtcbiAgfVxufTtcblxuRE9NLnJlbW92ZSA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIGlmICh0eXBlb2YgZWxlbWVudC5yZW1vdmUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgZWxlbWVudC5yZW1vdmUoKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoZWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICBlbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZWxlbWVudCk7XG4gICAgfVxuICB9XG59O1xuXG5ET00ucXVlcnlDaGlsZHJlbiA9IGZ1bmN0aW9uIChlbGVtZW50LCBzZWxlY3Rvcikge1xuICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmZpbHRlci5jYWxsKGVsZW1lbnQuY2hpbGROb2RlcywgZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgcmV0dXJuIERPTS5tYXRjaGVzKGNoaWxkLCBzZWxlY3Rvcik7XG4gIH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBET007XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBFdmVudEVsZW1lbnQgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICB0aGlzLmV2ZW50cyA9IHt9O1xufTtcblxuRXZlbnRFbGVtZW50LnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICBpZiAodHlwZW9mIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgdGhpcy5ldmVudHNbZXZlbnROYW1lXSA9IFtdO1xuICB9XG4gIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0ucHVzaChoYW5kbGVyKTtcbiAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyLCBmYWxzZSk7XG59O1xuXG5FdmVudEVsZW1lbnQucHJvdG90eXBlLnVuYmluZCA9IGZ1bmN0aW9uIChldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgdmFyIGlzSGFuZGxlclByb3ZpZGVkID0gKHR5cGVvZiBoYW5kbGVyICE9PSAndW5kZWZpbmVkJyk7XG4gIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0gPSB0aGlzLmV2ZW50c1tldmVudE5hbWVdLmZpbHRlcihmdW5jdGlvbiAoaGRscikge1xuICAgIGlmIChpc0hhbmRsZXJQcm92aWRlZCAmJiBoZGxyICE9PSBoYW5kbGVyKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBoZGxyLCBmYWxzZSk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LCB0aGlzKTtcbn07XG5cbkV2ZW50RWxlbWVudC5wcm90b3R5cGUudW5iaW5kQWxsID0gZnVuY3Rpb24gKCkge1xuICBmb3IgKHZhciBuYW1lIGluIHRoaXMuZXZlbnRzKSB7XG4gICAgdGhpcy51bmJpbmQobmFtZSk7XG4gIH1cbn07XG5cbnZhciBFdmVudE1hbmFnZXIgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuZXZlbnRFbGVtZW50cyA9IFtdO1xufTtcblxuRXZlbnRNYW5hZ2VyLnByb3RvdHlwZS5ldmVudEVsZW1lbnQgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICB2YXIgZWUgPSB0aGlzLmV2ZW50RWxlbWVudHMuZmlsdGVyKGZ1bmN0aW9uIChldmVudEVsZW1lbnQpIHtcbiAgICByZXR1cm4gZXZlbnRFbGVtZW50LmVsZW1lbnQgPT09IGVsZW1lbnQ7XG4gIH0pWzBdO1xuICBpZiAodHlwZW9mIGVlID09PSAndW5kZWZpbmVkJykge1xuICAgIGVlID0gbmV3IEV2ZW50RWxlbWVudChlbGVtZW50KTtcbiAgICB0aGlzLmV2ZW50RWxlbWVudHMucHVzaChlZSk7XG4gIH1cbiAgcmV0dXJuIGVlO1xufTtcblxuRXZlbnRNYW5hZ2VyLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKGVsZW1lbnQsIGV2ZW50TmFtZSwgaGFuZGxlcikge1xuICB0aGlzLmV2ZW50RWxlbWVudChlbGVtZW50KS5iaW5kKGV2ZW50TmFtZSwgaGFuZGxlcik7XG59O1xuXG5FdmVudE1hbmFnZXIucHJvdG90eXBlLnVuYmluZCA9IGZ1bmN0aW9uIChlbGVtZW50LCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgdGhpcy5ldmVudEVsZW1lbnQoZWxlbWVudCkudW5iaW5kKGV2ZW50TmFtZSwgaGFuZGxlcik7XG59O1xuXG5FdmVudE1hbmFnZXIucHJvdG90eXBlLnVuYmluZEFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmV2ZW50RWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICB0aGlzLmV2ZW50RWxlbWVudHNbaV0udW5iaW5kQWxsKCk7XG4gIH1cbn07XG5cbkV2ZW50TWFuYWdlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIChlbGVtZW50LCBldmVudE5hbWUsIGhhbmRsZXIpIHtcbiAgdmFyIGVlID0gdGhpcy5ldmVudEVsZW1lbnQoZWxlbWVudCk7XG4gIHZhciBvbmNlSGFuZGxlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgZWUudW5iaW5kKGV2ZW50TmFtZSwgb25jZUhhbmRsZXIpO1xuICAgIGhhbmRsZXIoZSk7XG4gIH07XG4gIGVlLmJpbmQoZXZlbnROYW1lLCBvbmNlSGFuZGxlcik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50TWFuYWdlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBzNCgpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcigoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDAwMClcbiAgICAgICAgICAgICAgIC50b1N0cmluZygxNilcbiAgICAgICAgICAgICAgIC5zdWJzdHJpbmcoMSk7XG4gIH1cbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gczQoKSArIHM0KCkgKyAnLScgKyBzNCgpICsgJy0nICsgczQoKSArICctJyArXG4gICAgICAgICAgIHM0KCkgKyAnLScgKyBzNCgpICsgczQoKSArIHM0KCk7XG4gIH07XG59KSgpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZG9tID0gcmVxdWlyZSgnLi9kb20nKTtcblxudmFyIHRvSW50ID0gZXhwb3J0cy50b0ludCA9IGZ1bmN0aW9uICh4KSB7XG4gIHJldHVybiBwYXJzZUludCh4LCAxMCkgfHwgMDtcbn07XG5cbmV4cG9ydHMuaXNFZGl0YWJsZSA9IGZ1bmN0aW9uIChlbCkge1xuICByZXR1cm4gZG9tLm1hdGNoZXMoZWwsIFwiaW5wdXQsW2NvbnRlbnRlZGl0YWJsZV1cIikgfHxcbiAgICAgICAgIGRvbS5tYXRjaGVzKGVsLCBcInNlbGVjdCxbY29udGVudGVkaXRhYmxlXVwiKSB8fFxuICAgICAgICAgZG9tLm1hdGNoZXMoZWwsIFwidGV4dGFyZWEsW2NvbnRlbnRlZGl0YWJsZV1cIikgfHxcbiAgICAgICAgIGRvbS5tYXRjaGVzKGVsLCBcImJ1dHRvbixbY29udGVudGVkaXRhYmxlXVwiKTtcbn07XG5cbmV4cG9ydHMucmVtb3ZlUHNDbGFzc2VzID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbGVtZW50LmNsYXNzTGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjbGFzc05hbWUgPSBlbGVtZW50LmNsYXNzTGlzdFtpXTtcbiAgICBpZiAoY2xhc3NOYW1lLmluZGV4T2YoJ3BzLScpID09PSAwKSB7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcbiAgICB9XG4gIH1cbn07XG5cbmV4cG9ydHMub3V0ZXJXaWR0aCA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gIHJldHVybiB0b0ludChkb20uY3NzKGVsZW1lbnQsICd3aWR0aCcpKSArXG4gICAgICAgICB0b0ludChkb20uY3NzKGVsZW1lbnQsICdwYWRkaW5nTGVmdCcpKSArXG4gICAgICAgICB0b0ludChkb20uY3NzKGVsZW1lbnQsICdwYWRkaW5nUmlnaHQnKSkgK1xuICAgICAgICAgdG9JbnQoZG9tLmNzcyhlbGVtZW50LCAnYm9yZGVyTGVmdFdpZHRoJykpICtcbiAgICAgICAgIHRvSW50KGRvbS5jc3MoZWxlbWVudCwgJ2JvcmRlclJpZ2h0V2lkdGgnKSk7XG59O1xuXG5mdW5jdGlvbiBwc0NsYXNzZXMoYXhpcykge1xuICB2YXIgY2xhc3NlcyA9IFsncHMtLWluLXNjcm9sbGluZyddO1xuICB2YXIgYXhpc0NsYXNzZXM7XG4gIGlmICh0eXBlb2YgYXhpcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBheGlzQ2xhc3NlcyA9IFsncHMtLXgnLCAncHMtLXknXTtcbiAgfSBlbHNlIHtcbiAgICBheGlzQ2xhc3NlcyA9IFsncHMtLScgKyBheGlzXTtcbiAgfVxuICByZXR1cm4gY2xhc3Nlcy5jb25jYXQoYXhpc0NsYXNzZXMpO1xufVxuXG5leHBvcnRzLnN0YXJ0U2Nyb2xsaW5nID0gZnVuY3Rpb24gKGVsZW1lbnQsIGF4aXMpIHtcbiAgdmFyIGNsYXNzZXMgPSBwc0NsYXNzZXMoYXhpcyk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2xhc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc2VzW2ldKTtcbiAgfVxufTtcblxuZXhwb3J0cy5zdG9wU2Nyb2xsaW5nID0gZnVuY3Rpb24gKGVsZW1lbnQsIGF4aXMpIHtcbiAgdmFyIGNsYXNzZXMgPSBwc0NsYXNzZXMoYXhpcyk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2xhc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc2VzW2ldKTtcbiAgfVxufTtcblxuZXhwb3J0cy5lbnYgPSB7XG4gIGlzV2ViS2l0OiB0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnICYmICdXZWJraXRBcHBlYXJhbmNlJyBpbiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUsXG4gIHN1cHBvcnRzVG91Y2g6IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmICgoJ29udG91Y2hzdGFydCcgaW4gd2luZG93KSB8fCB3aW5kb3cuRG9jdW1lbnRUb3VjaCAmJiBkb2N1bWVudCBpbnN0YW5jZW9mIHdpbmRvdy5Eb2N1bWVudFRvdWNoKSxcbiAgc3VwcG9ydHNJZVBvaW50ZXI6IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5uYXZpZ2F0b3IubXNNYXhUb3VjaFBvaW50cyAhPT0gbnVsbFxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGRlc3Ryb3kgPSByZXF1aXJlKCcuL3BsdWdpbi9kZXN0cm95Jyk7XG52YXIgaW5pdGlhbGl6ZSA9IHJlcXVpcmUoJy4vcGx1Z2luL2luaXRpYWxpemUnKTtcbnZhciB1cGRhdGUgPSByZXF1aXJlKCcuL3BsdWdpbi91cGRhdGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGluaXRpYWxpemU6IGluaXRpYWxpemUsXG4gIHVwZGF0ZTogdXBkYXRlLFxuICBkZXN0cm95OiBkZXN0cm95XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHtcbiAgICBoYW5kbGVyczogWydjbGljay1yYWlsJywgJ2RyYWctc2Nyb2xsYmFyJywgJ2tleWJvYXJkJywgJ3doZWVsJywgJ3RvdWNoJ10sXG4gICAgbWF4U2Nyb2xsYmFyTGVuZ3RoOiBudWxsLFxuICAgIG1pblNjcm9sbGJhckxlbmd0aDogbnVsbCxcbiAgICBzY3JvbGxYTWFyZ2luT2Zmc2V0OiAwLFxuICAgIHNjcm9sbFlNYXJnaW5PZmZzZXQ6IDAsXG4gICAgc3VwcHJlc3NTY3JvbGxYOiBmYWxzZSxcbiAgICBzdXBwcmVzc1Njcm9sbFk6IGZhbHNlLFxuICAgIHN3aXBlUHJvcGFnYXRpb246IHRydWUsXG4gICAgc3dpcGVFYXNpbmc6IHRydWUsXG4gICAgdXNlQm90aFdoZWVsQXhlczogZmFsc2UsXG4gICAgd2hlZWxQcm9wYWdhdGlvbjogZmFsc2UsXG4gICAgd2hlZWxTcGVlZDogMSxcbiAgICB0aGVtZTogJ2RlZmF1bHQnXG4gIH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJy4uL2xpYi9oZWxwZXInKTtcbnZhciBkb20gPSByZXF1aXJlKCcuLi9saWIvZG9tJyk7XG52YXIgaW5zdGFuY2VzID0gcmVxdWlyZSgnLi9pbnN0YW5jZXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICB2YXIgaSA9IGluc3RhbmNlcy5nZXQoZWxlbWVudCk7XG5cbiAgaWYgKCFpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaS5ldmVudC51bmJpbmRBbGwoKTtcbiAgZG9tLnJlbW92ZShpLnNjcm9sbGJhclgpO1xuICBkb20ucmVtb3ZlKGkuc2Nyb2xsYmFyWSk7XG4gIGRvbS5yZW1vdmUoaS5zY3JvbGxiYXJYUmFpbCk7XG4gIGRvbS5yZW1vdmUoaS5zY3JvbGxiYXJZUmFpbCk7XG4gIF8ucmVtb3ZlUHNDbGFzc2VzKGVsZW1lbnQpO1xuXG4gIGluc3RhbmNlcy5yZW1vdmUoZWxlbWVudCk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaW5zdGFuY2VzID0gcmVxdWlyZSgnLi4vaW5zdGFuY2VzJyk7XG52YXIgdXBkYXRlR2VvbWV0cnkgPSByZXF1aXJlKCcuLi91cGRhdGUtZ2VvbWV0cnknKTtcbnZhciB1cGRhdGVTY3JvbGwgPSByZXF1aXJlKCcuLi91cGRhdGUtc2Nyb2xsJyk7XG5cbmZ1bmN0aW9uIGJpbmRDbGlja1JhaWxIYW5kbGVyKGVsZW1lbnQsIGkpIHtcbiAgZnVuY3Rpb24gcGFnZU9mZnNldChlbCkge1xuICAgIHJldHVybiBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgfVxuICB2YXIgc3RvcFByb3BhZ2F0aW9uID0gZnVuY3Rpb24gKGUpIHsgZS5zdG9wUHJvcGFnYXRpb24oKTsgfTtcblxuICBpLmV2ZW50LmJpbmQoaS5zY3JvbGxiYXJZLCAnY2xpY2snLCBzdG9wUHJvcGFnYXRpb24pO1xuICBpLmV2ZW50LmJpbmQoaS5zY3JvbGxiYXJZUmFpbCwgJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgcG9zaXRpb25Ub3AgPSBlLnBhZ2VZIC0gd2luZG93LnBhZ2VZT2Zmc2V0IC0gcGFnZU9mZnNldChpLnNjcm9sbGJhcllSYWlsKS50b3A7XG4gICAgdmFyIGRpcmVjdGlvbiA9IHBvc2l0aW9uVG9wID4gaS5zY3JvbGxiYXJZVG9wID8gMSA6IC0xO1xuXG4gICAgdXBkYXRlU2Nyb2xsKGVsZW1lbnQsICd0b3AnLCBlbGVtZW50LnNjcm9sbFRvcCArIGRpcmVjdGlvbiAqIGkuY29udGFpbmVySGVpZ2h0KTtcbiAgICB1cGRhdGVHZW9tZXRyeShlbGVtZW50KTtcblxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH0pO1xuXG4gIGkuZXZlbnQuYmluZChpLnNjcm9sbGJhclgsICdjbGljaycsIHN0b3BQcm9wYWdhdGlvbik7XG4gIGkuZXZlbnQuYmluZChpLnNjcm9sbGJhclhSYWlsLCAnY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuICAgIHZhciBwb3NpdGlvbkxlZnQgPSBlLnBhZ2VYIC0gd2luZG93LnBhZ2VYT2Zmc2V0IC0gcGFnZU9mZnNldChpLnNjcm9sbGJhclhSYWlsKS5sZWZ0O1xuICAgIHZhciBkaXJlY3Rpb24gPSBwb3NpdGlvbkxlZnQgPiBpLnNjcm9sbGJhclhMZWZ0ID8gMSA6IC0xO1xuXG4gICAgdXBkYXRlU2Nyb2xsKGVsZW1lbnQsICdsZWZ0JywgZWxlbWVudC5zY3JvbGxMZWZ0ICsgZGlyZWN0aW9uICogaS5jb250YWluZXJXaWR0aCk7XG4gICAgdXBkYXRlR2VvbWV0cnkoZWxlbWVudCk7XG5cbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICB2YXIgaSA9IGluc3RhbmNlcy5nZXQoZWxlbWVudCk7XG4gIGJpbmRDbGlja1JhaWxIYW5kbGVyKGVsZW1lbnQsIGkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIF8gPSByZXF1aXJlKCcuLi8uLi9saWIvaGVscGVyJyk7XG52YXIgZG9tID0gcmVxdWlyZSgnLi4vLi4vbGliL2RvbScpO1xudmFyIGluc3RhbmNlcyA9IHJlcXVpcmUoJy4uL2luc3RhbmNlcycpO1xudmFyIHVwZGF0ZUdlb21ldHJ5ID0gcmVxdWlyZSgnLi4vdXBkYXRlLWdlb21ldHJ5Jyk7XG52YXIgdXBkYXRlU2Nyb2xsID0gcmVxdWlyZSgnLi4vdXBkYXRlLXNjcm9sbCcpO1xuXG5mdW5jdGlvbiBiaW5kTW91c2VTY3JvbGxYSGFuZGxlcihlbGVtZW50LCBpKSB7XG4gIHZhciBjdXJyZW50TGVmdCA9IG51bGw7XG4gIHZhciBjdXJyZW50UGFnZVggPSBudWxsO1xuXG4gIGZ1bmN0aW9uIHVwZGF0ZVNjcm9sbExlZnQoZGVsdGFYKSB7XG4gICAgdmFyIG5ld0xlZnQgPSBjdXJyZW50TGVmdCArIChkZWx0YVggKiBpLnJhaWxYUmF0aW8pO1xuICAgIHZhciBtYXhMZWZ0ID0gTWF0aC5tYXgoMCwgaS5zY3JvbGxiYXJYUmFpbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0KSArIChpLnJhaWxYUmF0aW8gKiAoaS5yYWlsWFdpZHRoIC0gaS5zY3JvbGxiYXJYV2lkdGgpKTtcblxuICAgIGlmIChuZXdMZWZ0IDwgMCkge1xuICAgICAgaS5zY3JvbGxiYXJYTGVmdCA9IDA7XG4gICAgfSBlbHNlIGlmIChuZXdMZWZ0ID4gbWF4TGVmdCkge1xuICAgICAgaS5zY3JvbGxiYXJYTGVmdCA9IG1heExlZnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGkuc2Nyb2xsYmFyWExlZnQgPSBuZXdMZWZ0O1xuICAgIH1cblxuICAgIHZhciBzY3JvbGxMZWZ0ID0gXy50b0ludChpLnNjcm9sbGJhclhMZWZ0ICogKGkuY29udGVudFdpZHRoIC0gaS5jb250YWluZXJXaWR0aCkgLyAoaS5jb250YWluZXJXaWR0aCAtIChpLnJhaWxYUmF0aW8gKiBpLnNjcm9sbGJhclhXaWR0aCkpKSAtIGkubmVnYXRpdmVTY3JvbGxBZGp1c3RtZW50O1xuICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAnbGVmdCcsIHNjcm9sbExlZnQpO1xuICB9XG5cbiAgdmFyIG1vdXNlTW92ZUhhbmRsZXIgPSBmdW5jdGlvbiAoZSkge1xuICAgIHVwZGF0ZVNjcm9sbExlZnQoZS5wYWdlWCAtIGN1cnJlbnRQYWdlWCk7XG4gICAgdXBkYXRlR2VvbWV0cnkoZWxlbWVudCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIH07XG5cbiAgdmFyIG1vdXNlVXBIYW5kbGVyID0gZnVuY3Rpb24gKCkge1xuICAgIF8uc3RvcFNjcm9sbGluZyhlbGVtZW50LCAneCcpO1xuICAgIGkuZXZlbnQudW5iaW5kKGkub3duZXJEb2N1bWVudCwgJ21vdXNlbW92ZScsIG1vdXNlTW92ZUhhbmRsZXIpO1xuICB9O1xuXG4gIGkuZXZlbnQuYmluZChpLnNjcm9sbGJhclgsICdtb3VzZWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgIGN1cnJlbnRQYWdlWCA9IGUucGFnZVg7XG4gICAgY3VycmVudExlZnQgPSBfLnRvSW50KGRvbS5jc3MoaS5zY3JvbGxiYXJYLCAnbGVmdCcpKSAqIGkucmFpbFhSYXRpbztcbiAgICBfLnN0YXJ0U2Nyb2xsaW5nKGVsZW1lbnQsICd4Jyk7XG5cbiAgICBpLmV2ZW50LmJpbmQoaS5vd25lckRvY3VtZW50LCAnbW91c2Vtb3ZlJywgbW91c2VNb3ZlSGFuZGxlcik7XG4gICAgaS5ldmVudC5vbmNlKGkub3duZXJEb2N1bWVudCwgJ21vdXNldXAnLCBtb3VzZVVwSGFuZGxlcik7XG5cbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGJpbmRNb3VzZVNjcm9sbFlIYW5kbGVyKGVsZW1lbnQsIGkpIHtcbiAgdmFyIGN1cnJlbnRUb3AgPSBudWxsO1xuICB2YXIgY3VycmVudFBhZ2VZID0gbnVsbDtcblxuICBmdW5jdGlvbiB1cGRhdGVTY3JvbGxUb3AoZGVsdGFZKSB7XG4gICAgdmFyIG5ld1RvcCA9IGN1cnJlbnRUb3AgKyAoZGVsdGFZICogaS5yYWlsWVJhdGlvKTtcbiAgICB2YXIgbWF4VG9wID0gTWF0aC5tYXgoMCwgaS5zY3JvbGxiYXJZUmFpbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3ApICsgKGkucmFpbFlSYXRpbyAqIChpLnJhaWxZSGVpZ2h0IC0gaS5zY3JvbGxiYXJZSGVpZ2h0KSk7XG5cbiAgICBpZiAobmV3VG9wIDwgMCkge1xuICAgICAgaS5zY3JvbGxiYXJZVG9wID0gMDtcbiAgICB9IGVsc2UgaWYgKG5ld1RvcCA+IG1heFRvcCkge1xuICAgICAgaS5zY3JvbGxiYXJZVG9wID0gbWF4VG9wO1xuICAgIH0gZWxzZSB7XG4gICAgICBpLnNjcm9sbGJhcllUb3AgPSBuZXdUb3A7XG4gICAgfVxuXG4gICAgdmFyIHNjcm9sbFRvcCA9IF8udG9JbnQoaS5zY3JvbGxiYXJZVG9wICogKGkuY29udGVudEhlaWdodCAtIGkuY29udGFpbmVySGVpZ2h0KSAvIChpLmNvbnRhaW5lckhlaWdodCAtIChpLnJhaWxZUmF0aW8gKiBpLnNjcm9sbGJhcllIZWlnaHQpKSk7XG4gICAgdXBkYXRlU2Nyb2xsKGVsZW1lbnQsICd0b3AnLCBzY3JvbGxUb3ApO1xuICB9XG5cbiAgdmFyIG1vdXNlTW92ZUhhbmRsZXIgPSBmdW5jdGlvbiAoZSkge1xuICAgIHVwZGF0ZVNjcm9sbFRvcChlLnBhZ2VZIC0gY3VycmVudFBhZ2VZKTtcbiAgICB1cGRhdGVHZW9tZXRyeShlbGVtZW50KTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfTtcblxuICB2YXIgbW91c2VVcEhhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgXy5zdG9wU2Nyb2xsaW5nKGVsZW1lbnQsICd5Jyk7XG4gICAgaS5ldmVudC51bmJpbmQoaS5vd25lckRvY3VtZW50LCAnbW91c2Vtb3ZlJywgbW91c2VNb3ZlSGFuZGxlcik7XG4gIH07XG5cbiAgaS5ldmVudC5iaW5kKGkuc2Nyb2xsYmFyWSwgJ21vdXNlZG93bicsIGZ1bmN0aW9uIChlKSB7XG4gICAgY3VycmVudFBhZ2VZID0gZS5wYWdlWTtcbiAgICBjdXJyZW50VG9wID0gXy50b0ludChkb20uY3NzKGkuc2Nyb2xsYmFyWSwgJ3RvcCcpKSAqIGkucmFpbFlSYXRpbztcbiAgICBfLnN0YXJ0U2Nyb2xsaW5nKGVsZW1lbnQsICd5Jyk7XG5cbiAgICBpLmV2ZW50LmJpbmQoaS5vd25lckRvY3VtZW50LCAnbW91c2Vtb3ZlJywgbW91c2VNb3ZlSGFuZGxlcik7XG4gICAgaS5ldmVudC5vbmNlKGkub3duZXJEb2N1bWVudCwgJ21vdXNldXAnLCBtb3VzZVVwSGFuZGxlcik7XG5cbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgdmFyIGkgPSBpbnN0YW5jZXMuZ2V0KGVsZW1lbnQpO1xuICBiaW5kTW91c2VTY3JvbGxYSGFuZGxlcihlbGVtZW50LCBpKTtcbiAgYmluZE1vdXNlU2Nyb2xsWUhhbmRsZXIoZWxlbWVudCwgaSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJy4uLy4uL2xpYi9oZWxwZXInKTtcbnZhciBkb20gPSByZXF1aXJlKCcuLi8uLi9saWIvZG9tJyk7XG52YXIgaW5zdGFuY2VzID0gcmVxdWlyZSgnLi4vaW5zdGFuY2VzJyk7XG52YXIgdXBkYXRlR2VvbWV0cnkgPSByZXF1aXJlKCcuLi91cGRhdGUtZ2VvbWV0cnknKTtcbnZhciB1cGRhdGVTY3JvbGwgPSByZXF1aXJlKCcuLi91cGRhdGUtc2Nyb2xsJyk7XG5cbmZ1bmN0aW9uIGJpbmRLZXlib2FyZEhhbmRsZXIoZWxlbWVudCwgaSkge1xuICB2YXIgaG92ZXJlZCA9IGZhbHNlO1xuICBpLmV2ZW50LmJpbmQoZWxlbWVudCwgJ21vdXNlZW50ZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgaG92ZXJlZCA9IHRydWU7XG4gIH0pO1xuICBpLmV2ZW50LmJpbmQoZWxlbWVudCwgJ21vdXNlbGVhdmUnLCBmdW5jdGlvbiAoKSB7XG4gICAgaG92ZXJlZCA9IGZhbHNlO1xuICB9KTtcblxuICB2YXIgc2hvdWxkUHJldmVudCA9IGZhbHNlO1xuICBmdW5jdGlvbiBzaG91bGRQcmV2ZW50RGVmYXVsdChkZWx0YVgsIGRlbHRhWSkge1xuICAgIHZhciBzY3JvbGxUb3AgPSBlbGVtZW50LnNjcm9sbFRvcDtcbiAgICBpZiAoZGVsdGFYID09PSAwKSB7XG4gICAgICBpZiAoIWkuc2Nyb2xsYmFyWUFjdGl2ZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoKHNjcm9sbFRvcCA9PT0gMCAmJiBkZWx0YVkgPiAwKSB8fCAoc2Nyb2xsVG9wID49IGkuY29udGVudEhlaWdodCAtIGkuY29udGFpbmVySGVpZ2h0ICYmIGRlbHRhWSA8IDApKSB7XG4gICAgICAgIHJldHVybiAhaS5zZXR0aW5ncy53aGVlbFByb3BhZ2F0aW9uO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBzY3JvbGxMZWZ0ID0gZWxlbWVudC5zY3JvbGxMZWZ0O1xuICAgIGlmIChkZWx0YVkgPT09IDApIHtcbiAgICAgIGlmICghaS5zY3JvbGxiYXJYQWN0aXZlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICgoc2Nyb2xsTGVmdCA9PT0gMCAmJiBkZWx0YVggPCAwKSB8fCAoc2Nyb2xsTGVmdCA+PSBpLmNvbnRlbnRXaWR0aCAtIGkuY29udGFpbmVyV2lkdGggJiYgZGVsdGFYID4gMCkpIHtcbiAgICAgICAgcmV0dXJuICFpLnNldHRpbmdzLndoZWVsUHJvcGFnYXRpb247XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaS5ldmVudC5iaW5kKGkub3duZXJEb2N1bWVudCwgJ2tleWRvd24nLCBmdW5jdGlvbiAoZSkge1xuICAgIGlmICgoZS5pc0RlZmF1bHRQcmV2ZW50ZWQgJiYgZS5pc0RlZmF1bHRQcmV2ZW50ZWQoKSkgfHwgZS5kZWZhdWx0UHJldmVudGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGZvY3VzZWQgPSBkb20ubWF0Y2hlcyhpLnNjcm9sbGJhclgsICc6Zm9jdXMnKSB8fFxuICAgICAgICAgICAgICAgICAgZG9tLm1hdGNoZXMoaS5zY3JvbGxiYXJZLCAnOmZvY3VzJyk7XG5cbiAgICBpZiAoIWhvdmVyZWQgJiYgIWZvY3VzZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgYWN0aXZlRWxlbWVudCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPyBkb2N1bWVudC5hY3RpdmVFbGVtZW50IDogaS5vd25lckRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKGFjdGl2ZUVsZW1lbnQpIHtcbiAgICAgIGlmIChhY3RpdmVFbGVtZW50LnRhZ05hbWUgPT09ICdJRlJBTUUnKSB7XG4gICAgICAgIGFjdGl2ZUVsZW1lbnQgPSBhY3RpdmVFbGVtZW50LmNvbnRlbnREb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gZ28gZGVlcGVyIGlmIGVsZW1lbnQgaXMgYSB3ZWJjb21wb25lbnRcbiAgICAgICAgd2hpbGUgKGFjdGl2ZUVsZW1lbnQuc2hhZG93Um9vdCkge1xuICAgICAgICAgIGFjdGl2ZUVsZW1lbnQgPSBhY3RpdmVFbGVtZW50LnNoYWRvd1Jvb3QuYWN0aXZlRWxlbWVudDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKF8uaXNFZGl0YWJsZShhY3RpdmVFbGVtZW50KSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGRlbHRhWCA9IDA7XG4gICAgdmFyIGRlbHRhWSA9IDA7XG5cbiAgICBzd2l0Y2ggKGUud2hpY2gpIHtcbiAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICBpZiAoZS5tZXRhS2V5KSB7XG4gICAgICAgIGRlbHRhWCA9IC1pLmNvbnRlbnRXaWR0aDtcbiAgICAgIH0gZWxzZSBpZiAoZS5hbHRLZXkpIHtcbiAgICAgICAgZGVsdGFYID0gLWkuY29udGFpbmVyV2lkdGg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWx0YVggPSAtMzA7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgaWYgKGUubWV0YUtleSkge1xuICAgICAgICBkZWx0YVkgPSBpLmNvbnRlbnRIZWlnaHQ7XG4gICAgICB9IGVsc2UgaWYgKGUuYWx0S2V5KSB7XG4gICAgICAgIGRlbHRhWSA9IGkuY29udGFpbmVySGVpZ2h0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVsdGFZID0gMzA7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM5OiAvLyByaWdodFxuICAgICAgaWYgKGUubWV0YUtleSkge1xuICAgICAgICBkZWx0YVggPSBpLmNvbnRlbnRXaWR0aDtcbiAgICAgIH0gZWxzZSBpZiAoZS5hbHRLZXkpIHtcbiAgICAgICAgZGVsdGFYID0gaS5jb250YWluZXJXaWR0aDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlbHRhWCA9IDMwO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSA0MDogLy8gZG93blxuICAgICAgaWYgKGUubWV0YUtleSkge1xuICAgICAgICBkZWx0YVkgPSAtaS5jb250ZW50SGVpZ2h0O1xuICAgICAgfSBlbHNlIGlmIChlLmFsdEtleSkge1xuICAgICAgICBkZWx0YVkgPSAtaS5jb250YWluZXJIZWlnaHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWx0YVkgPSAtMzA7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIDMzOiAvLyBwYWdlIHVwXG4gICAgICBkZWx0YVkgPSA5MDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMzI6IC8vIHNwYWNlIGJhclxuICAgICAgaWYgKGUuc2hpZnRLZXkpIHtcbiAgICAgICAgZGVsdGFZID0gOTA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWx0YVkgPSAtOTA7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIDM0OiAvLyBwYWdlIGRvd25cbiAgICAgIGRlbHRhWSA9IC05MDtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMzU6IC8vIGVuZFxuICAgICAgaWYgKGUuY3RybEtleSkge1xuICAgICAgICBkZWx0YVkgPSAtaS5jb250ZW50SGVpZ2h0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVsdGFZID0gLWkuY29udGFpbmVySGVpZ2h0O1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAzNjogLy8gaG9tZVxuICAgICAgaWYgKGUuY3RybEtleSkge1xuICAgICAgICBkZWx0YVkgPSBlbGVtZW50LnNjcm9sbFRvcDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlbHRhWSA9IGkuY29udGFpbmVySGVpZ2h0O1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ3RvcCcsIGVsZW1lbnQuc2Nyb2xsVG9wIC0gZGVsdGFZKTtcbiAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ2xlZnQnLCBlbGVtZW50LnNjcm9sbExlZnQgKyBkZWx0YVgpO1xuICAgIHVwZGF0ZUdlb21ldHJ5KGVsZW1lbnQpO1xuXG4gICAgc2hvdWxkUHJldmVudCA9IHNob3VsZFByZXZlbnREZWZhdWx0KGRlbHRhWCwgZGVsdGFZKTtcbiAgICBpZiAoc2hvdWxkUHJldmVudCkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgdmFyIGkgPSBpbnN0YW5jZXMuZ2V0KGVsZW1lbnQpO1xuICBiaW5kS2V5Ym9hcmRIYW5kbGVyKGVsZW1lbnQsIGkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGluc3RhbmNlcyA9IHJlcXVpcmUoJy4uL2luc3RhbmNlcycpO1xudmFyIHVwZGF0ZUdlb21ldHJ5ID0gcmVxdWlyZSgnLi4vdXBkYXRlLWdlb21ldHJ5Jyk7XG52YXIgdXBkYXRlU2Nyb2xsID0gcmVxdWlyZSgnLi4vdXBkYXRlLXNjcm9sbCcpO1xuXG5mdW5jdGlvbiBiaW5kTW91c2VXaGVlbEhhbmRsZXIoZWxlbWVudCwgaSkge1xuICB2YXIgc2hvdWxkUHJldmVudCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIHNob3VsZFByZXZlbnREZWZhdWx0KGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgdmFyIHNjcm9sbFRvcCA9IGVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgIGlmIChkZWx0YVggPT09IDApIHtcbiAgICAgIGlmICghaS5zY3JvbGxiYXJZQWN0aXZlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmICgoc2Nyb2xsVG9wID09PSAwICYmIGRlbHRhWSA+IDApIHx8IChzY3JvbGxUb3AgPj0gaS5jb250ZW50SGVpZ2h0IC0gaS5jb250YWluZXJIZWlnaHQgJiYgZGVsdGFZIDwgMCkpIHtcbiAgICAgICAgcmV0dXJuICFpLnNldHRpbmdzLndoZWVsUHJvcGFnYXRpb247XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHNjcm9sbExlZnQgPSBlbGVtZW50LnNjcm9sbExlZnQ7XG4gICAgaWYgKGRlbHRhWSA9PT0gMCkge1xuICAgICAgaWYgKCFpLnNjcm9sbGJhclhBY3RpdmUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWYgKChzY3JvbGxMZWZ0ID09PSAwICYmIGRlbHRhWCA8IDApIHx8IChzY3JvbGxMZWZ0ID49IGkuY29udGVudFdpZHRoIC0gaS5jb250YWluZXJXaWR0aCAmJiBkZWx0YVggPiAwKSkge1xuICAgICAgICByZXR1cm4gIWkuc2V0dGluZ3Mud2hlZWxQcm9wYWdhdGlvbjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiBnZXREZWx0YUZyb21FdmVudChlKSB7XG4gICAgdmFyIGRlbHRhWCA9IGUuZGVsdGFYO1xuICAgIHZhciBkZWx0YVkgPSAtMSAqIGUuZGVsdGFZO1xuXG4gICAgaWYgKHR5cGVvZiBkZWx0YVggPT09IFwidW5kZWZpbmVkXCIgfHwgdHlwZW9mIGRlbHRhWSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgLy8gT1MgWCBTYWZhcmlcbiAgICAgIGRlbHRhWCA9IC0xICogZS53aGVlbERlbHRhWCAvIDY7XG4gICAgICBkZWx0YVkgPSBlLndoZWVsRGVsdGFZIC8gNjtcbiAgICB9XG5cbiAgICBpZiAoZS5kZWx0YU1vZGUgJiYgZS5kZWx0YU1vZGUgPT09IDEpIHtcbiAgICAgIC8vIEZpcmVmb3ggaW4gZGVsdGFNb2RlIDE6IExpbmUgc2Nyb2xsaW5nXG4gICAgICBkZWx0YVggKj0gMTA7XG4gICAgICBkZWx0YVkgKj0gMTA7XG4gICAgfVxuXG4gICAgaWYgKGRlbHRhWCAhPT0gZGVsdGFYICYmIGRlbHRhWSAhPT0gZGVsdGFZLyogTmFOIGNoZWNrcyAqLykge1xuICAgICAgLy8gSUUgaW4gc29tZSBtb3VzZSBkcml2ZXJzXG4gICAgICBkZWx0YVggPSAwO1xuICAgICAgZGVsdGFZID0gZS53aGVlbERlbHRhO1xuICAgIH1cblxuICAgIGlmIChlLnNoaWZ0S2V5KSB7XG4gICAgICAvLyByZXZlcnNlIGF4aXMgd2l0aCBzaGlmdCBrZXlcbiAgICAgIHJldHVybiBbLWRlbHRhWSwgLWRlbHRhWF07XG4gICAgfVxuICAgIHJldHVybiBbZGVsdGFYLCBkZWx0YVldO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvdWxkQmVDb25zdW1lZEJ5Q2hpbGQoZGVsdGFYLCBkZWx0YVkpIHtcbiAgICB2YXIgY2hpbGQgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ3RleHRhcmVhOmhvdmVyLCBzZWxlY3RbbXVsdGlwbGVdOmhvdmVyLCAucHMtY2hpbGQ6aG92ZXInKTtcbiAgICBpZiAoY2hpbGQpIHtcbiAgICAgIHZhciBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGNoaWxkKTtcbiAgICAgIHZhciBvdmVyZmxvdyA9IFtcbiAgICAgICAgc3R5bGUub3ZlcmZsb3csXG4gICAgICAgIHN0eWxlLm92ZXJmbG93WCxcbiAgICAgICAgc3R5bGUub3ZlcmZsb3dZXG4gICAgICBdLmpvaW4oJycpO1xuXG4gICAgICBpZiAoIW92ZXJmbG93Lm1hdGNoKC8oc2Nyb2xsfGF1dG8pLykpIHtcbiAgICAgICAgLy8gaWYgbm90IHNjcm9sbGFibGVcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICB2YXIgbWF4U2Nyb2xsVG9wID0gY2hpbGQuc2Nyb2xsSGVpZ2h0IC0gY2hpbGQuY2xpZW50SGVpZ2h0O1xuICAgICAgaWYgKG1heFNjcm9sbFRvcCA+IDApIHtcbiAgICAgICAgaWYgKCEoY2hpbGQuc2Nyb2xsVG9wID09PSAwICYmIGRlbHRhWSA+IDApICYmICEoY2hpbGQuc2Nyb2xsVG9wID09PSBtYXhTY3JvbGxUb3AgJiYgZGVsdGFZIDwgMCkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdmFyIG1heFNjcm9sbExlZnQgPSBjaGlsZC5zY3JvbGxMZWZ0IC0gY2hpbGQuY2xpZW50V2lkdGg7XG4gICAgICBpZiAobWF4U2Nyb2xsTGVmdCA+IDApIHtcbiAgICAgICAgaWYgKCEoY2hpbGQuc2Nyb2xsTGVmdCA9PT0gMCAmJiBkZWx0YVggPCAwKSAmJiAhKGNoaWxkLnNjcm9sbExlZnQgPT09IG1heFNjcm9sbExlZnQgJiYgZGVsdGFYID4gMCkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBtb3VzZXdoZWVsSGFuZGxlcihlKSB7XG4gICAgdmFyIGRlbHRhID0gZ2V0RGVsdGFGcm9tRXZlbnQoZSk7XG5cbiAgICB2YXIgZGVsdGFYID0gZGVsdGFbMF07XG4gICAgdmFyIGRlbHRhWSA9IGRlbHRhWzFdO1xuXG4gICAgaWYgKHNob3VsZEJlQ29uc3VtZWRCeUNoaWxkKGRlbHRhWCwgZGVsdGFZKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNob3VsZFByZXZlbnQgPSBmYWxzZTtcbiAgICBpZiAoIWkuc2V0dGluZ3MudXNlQm90aFdoZWVsQXhlcykge1xuICAgICAgLy8gZGVsdGFYIHdpbGwgb25seSBiZSB1c2VkIGZvciBob3Jpem9udGFsIHNjcm9sbGluZyBhbmQgZGVsdGFZIHdpbGxcbiAgICAgIC8vIG9ubHkgYmUgdXNlZCBmb3IgdmVydGljYWwgc2Nyb2xsaW5nIC0gdGhpcyBpcyB0aGUgZGVmYXVsdFxuICAgICAgdXBkYXRlU2Nyb2xsKGVsZW1lbnQsICd0b3AnLCBlbGVtZW50LnNjcm9sbFRvcCAtIChkZWx0YVkgKiBpLnNldHRpbmdzLndoZWVsU3BlZWQpKTtcbiAgICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAnbGVmdCcsIGVsZW1lbnQuc2Nyb2xsTGVmdCArIChkZWx0YVggKiBpLnNldHRpbmdzLndoZWVsU3BlZWQpKTtcbiAgICB9IGVsc2UgaWYgKGkuc2Nyb2xsYmFyWUFjdGl2ZSAmJiAhaS5zY3JvbGxiYXJYQWN0aXZlKSB7XG4gICAgICAvLyBvbmx5IHZlcnRpY2FsIHNjcm9sbGJhciBpcyBhY3RpdmUgYW5kIHVzZUJvdGhXaGVlbEF4ZXMgb3B0aW9uIGlzXG4gICAgICAvLyBhY3RpdmUsIHNvIGxldCdzIHNjcm9sbCB2ZXJ0aWNhbCBiYXIgdXNpbmcgYm90aCBtb3VzZSB3aGVlbCBheGVzXG4gICAgICBpZiAoZGVsdGFZKSB7XG4gICAgICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAndG9wJywgZWxlbWVudC5zY3JvbGxUb3AgLSAoZGVsdGFZICogaS5zZXR0aW5ncy53aGVlbFNwZWVkKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ3RvcCcsIGVsZW1lbnQuc2Nyb2xsVG9wICsgKGRlbHRhWCAqIGkuc2V0dGluZ3Mud2hlZWxTcGVlZCkpO1xuICAgICAgfVxuICAgICAgc2hvdWxkUHJldmVudCA9IHRydWU7XG4gICAgfSBlbHNlIGlmIChpLnNjcm9sbGJhclhBY3RpdmUgJiYgIWkuc2Nyb2xsYmFyWUFjdGl2ZSkge1xuICAgICAgLy8gdXNlQm90aFdoZWVsQXhlcyBhbmQgb25seSBob3Jpem9udGFsIGJhciBpcyBhY3RpdmUsIHNvIHVzZSBib3RoXG4gICAgICAvLyB3aGVlbCBheGVzIGZvciBob3Jpem9udGFsIGJhclxuICAgICAgaWYgKGRlbHRhWCkge1xuICAgICAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ2xlZnQnLCBlbGVtZW50LnNjcm9sbExlZnQgKyAoZGVsdGFYICogaS5zZXR0aW5ncy53aGVlbFNwZWVkKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ2xlZnQnLCBlbGVtZW50LnNjcm9sbExlZnQgLSAoZGVsdGFZICogaS5zZXR0aW5ncy53aGVlbFNwZWVkKSk7XG4gICAgICB9XG4gICAgICBzaG91bGRQcmV2ZW50ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB1cGRhdGVHZW9tZXRyeShlbGVtZW50KTtcblxuICAgIHNob3VsZFByZXZlbnQgPSAoc2hvdWxkUHJldmVudCB8fCBzaG91bGRQcmV2ZW50RGVmYXVsdChkZWx0YVgsIGRlbHRhWSkpO1xuICAgIGlmIChzaG91bGRQcmV2ZW50KSB7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0eXBlb2Ygd2luZG93Lm9ud2hlZWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBpLmV2ZW50LmJpbmQoZWxlbWVudCwgJ3doZWVsJywgbW91c2V3aGVlbEhhbmRsZXIpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cub25tb3VzZXdoZWVsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgaS5ldmVudC5iaW5kKGVsZW1lbnQsICdtb3VzZXdoZWVsJywgbW91c2V3aGVlbEhhbmRsZXIpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgdmFyIGkgPSBpbnN0YW5jZXMuZ2V0KGVsZW1lbnQpO1xuICBiaW5kTW91c2VXaGVlbEhhbmRsZXIoZWxlbWVudCwgaSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaW5zdGFuY2VzID0gcmVxdWlyZSgnLi4vaW5zdGFuY2VzJyk7XG52YXIgdXBkYXRlR2VvbWV0cnkgPSByZXF1aXJlKCcuLi91cGRhdGUtZ2VvbWV0cnknKTtcblxuZnVuY3Rpb24gYmluZE5hdGl2ZVNjcm9sbEhhbmRsZXIoZWxlbWVudCwgaSkge1xuICBpLmV2ZW50LmJpbmQoZWxlbWVudCwgJ3Njcm9sbCcsIGZ1bmN0aW9uICgpIHtcbiAgICB1cGRhdGVHZW9tZXRyeShlbGVtZW50KTtcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgdmFyIGkgPSBpbnN0YW5jZXMuZ2V0KGVsZW1lbnQpO1xuICBiaW5kTmF0aXZlU2Nyb2xsSGFuZGxlcihlbGVtZW50LCBpKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnLi4vLi4vbGliL2hlbHBlcicpO1xudmFyIGluc3RhbmNlcyA9IHJlcXVpcmUoJy4uL2luc3RhbmNlcycpO1xudmFyIHVwZGF0ZUdlb21ldHJ5ID0gcmVxdWlyZSgnLi4vdXBkYXRlLWdlb21ldHJ5Jyk7XG52YXIgdXBkYXRlU2Nyb2xsID0gcmVxdWlyZSgnLi4vdXBkYXRlLXNjcm9sbCcpO1xuXG5mdW5jdGlvbiBiaW5kU2VsZWN0aW9uSGFuZGxlcihlbGVtZW50LCBpKSB7XG4gIGZ1bmN0aW9uIGdldFJhbmdlTm9kZSgpIHtcbiAgICB2YXIgc2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbiA/IHdpbmRvdy5nZXRTZWxlY3Rpb24oKSA6XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldFNlbGVjdGlvbiA/IGRvY3VtZW50LmdldFNlbGVjdGlvbigpIDogJyc7XG4gICAgaWYgKHNlbGVjdGlvbi50b1N0cmluZygpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKS5jb21tb25BbmNlc3RvckNvbnRhaW5lcjtcbiAgICB9XG4gIH1cblxuICB2YXIgc2Nyb2xsaW5nTG9vcCA9IG51bGw7XG4gIHZhciBzY3JvbGxEaWZmID0ge3RvcDogMCwgbGVmdDogMH07XG4gIGZ1bmN0aW9uIHN0YXJ0U2Nyb2xsaW5nKCkge1xuICAgIGlmICghc2Nyb2xsaW5nTG9vcCkge1xuICAgICAgc2Nyb2xsaW5nTG9vcCA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFpbnN0YW5jZXMuZ2V0KGVsZW1lbnQpKSB7XG4gICAgICAgICAgY2xlYXJJbnRlcnZhbChzY3JvbGxpbmdMb29wKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ3RvcCcsIGVsZW1lbnQuc2Nyb2xsVG9wICsgc2Nyb2xsRGlmZi50b3ApO1xuICAgICAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ2xlZnQnLCBlbGVtZW50LnNjcm9sbExlZnQgKyBzY3JvbGxEaWZmLmxlZnQpO1xuICAgICAgICB1cGRhdGVHZW9tZXRyeShlbGVtZW50KTtcbiAgICAgIH0sIDUwKTsgLy8gZXZlcnkgLjEgc2VjXG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHN0b3BTY3JvbGxpbmcoKSB7XG4gICAgaWYgKHNjcm9sbGluZ0xvb3ApIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwoc2Nyb2xsaW5nTG9vcCk7XG4gICAgICBzY3JvbGxpbmdMb29wID0gbnVsbDtcbiAgICB9XG4gICAgXy5zdG9wU2Nyb2xsaW5nKGVsZW1lbnQpO1xuICB9XG5cbiAgdmFyIGlzU2VsZWN0ZWQgPSBmYWxzZTtcbiAgaS5ldmVudC5iaW5kKGkub3duZXJEb2N1bWVudCwgJ3NlbGVjdGlvbmNoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoZWxlbWVudC5jb250YWlucyhnZXRSYW5nZU5vZGUoKSkpIHtcbiAgICAgIGlzU2VsZWN0ZWQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBpc1NlbGVjdGVkID0gZmFsc2U7XG4gICAgICBzdG9wU2Nyb2xsaW5nKCk7XG4gICAgfVxuICB9KTtcbiAgaS5ldmVudC5iaW5kKHdpbmRvdywgJ21vdXNldXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGlzU2VsZWN0ZWQpIHtcbiAgICAgIGlzU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgIHN0b3BTY3JvbGxpbmcoKTtcbiAgICB9XG4gIH0pO1xuICBpLmV2ZW50LmJpbmQod2luZG93LCAna2V5dXAnLCBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGlzU2VsZWN0ZWQpIHtcbiAgICAgIGlzU2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgIHN0b3BTY3JvbGxpbmcoKTtcbiAgICB9XG4gIH0pO1xuXG4gIGkuZXZlbnQuYmluZCh3aW5kb3csICdtb3VzZW1vdmUnLCBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChpc1NlbGVjdGVkKSB7XG4gICAgICB2YXIgbW91c2VQb3NpdGlvbiA9IHt4OiBlLnBhZ2VYLCB5OiBlLnBhZ2VZfTtcbiAgICAgIHZhciBjb250YWluZXJHZW9tZXRyeSA9IHtcbiAgICAgICAgbGVmdDogZWxlbWVudC5vZmZzZXRMZWZ0LFxuICAgICAgICByaWdodDogZWxlbWVudC5vZmZzZXRMZWZ0ICsgZWxlbWVudC5vZmZzZXRXaWR0aCxcbiAgICAgICAgdG9wOiBlbGVtZW50Lm9mZnNldFRvcCxcbiAgICAgICAgYm90dG9tOiBlbGVtZW50Lm9mZnNldFRvcCArIGVsZW1lbnQub2Zmc2V0SGVpZ2h0XG4gICAgICB9O1xuXG4gICAgICBpZiAobW91c2VQb3NpdGlvbi54IDwgY29udGFpbmVyR2VvbWV0cnkubGVmdCArIDMpIHtcbiAgICAgICAgc2Nyb2xsRGlmZi5sZWZ0ID0gLTU7XG4gICAgICAgIF8uc3RhcnRTY3JvbGxpbmcoZWxlbWVudCwgJ3gnKTtcbiAgICAgIH0gZWxzZSBpZiAobW91c2VQb3NpdGlvbi54ID4gY29udGFpbmVyR2VvbWV0cnkucmlnaHQgLSAzKSB7XG4gICAgICAgIHNjcm9sbERpZmYubGVmdCA9IDU7XG4gICAgICAgIF8uc3RhcnRTY3JvbGxpbmcoZWxlbWVudCwgJ3gnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNjcm9sbERpZmYubGVmdCA9IDA7XG4gICAgICB9XG5cbiAgICAgIGlmIChtb3VzZVBvc2l0aW9uLnkgPCBjb250YWluZXJHZW9tZXRyeS50b3AgKyAzKSB7XG4gICAgICAgIGlmIChjb250YWluZXJHZW9tZXRyeS50b3AgKyAzIC0gbW91c2VQb3NpdGlvbi55IDwgNSkge1xuICAgICAgICAgIHNjcm9sbERpZmYudG9wID0gLTU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2Nyb2xsRGlmZi50b3AgPSAtMjA7XG4gICAgICAgIH1cbiAgICAgICAgXy5zdGFydFNjcm9sbGluZyhlbGVtZW50LCAneScpO1xuICAgICAgfSBlbHNlIGlmIChtb3VzZVBvc2l0aW9uLnkgPiBjb250YWluZXJHZW9tZXRyeS5ib3R0b20gLSAzKSB7XG4gICAgICAgIGlmIChtb3VzZVBvc2l0aW9uLnkgLSBjb250YWluZXJHZW9tZXRyeS5ib3R0b20gKyAzIDwgNSkge1xuICAgICAgICAgIHNjcm9sbERpZmYudG9wID0gNTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzY3JvbGxEaWZmLnRvcCA9IDIwO1xuICAgICAgICB9XG4gICAgICAgIF8uc3RhcnRTY3JvbGxpbmcoZWxlbWVudCwgJ3knKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNjcm9sbERpZmYudG9wID0gMDtcbiAgICAgIH1cblxuICAgICAgaWYgKHNjcm9sbERpZmYudG9wID09PSAwICYmIHNjcm9sbERpZmYubGVmdCA9PT0gMCkge1xuICAgICAgICBzdG9wU2Nyb2xsaW5nKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGFydFNjcm9sbGluZygpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgdmFyIGkgPSBpbnN0YW5jZXMuZ2V0KGVsZW1lbnQpO1xuICBiaW5kU2VsZWN0aW9uSGFuZGxlcihlbGVtZW50LCBpKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnLi4vLi4vbGliL2hlbHBlcicpO1xudmFyIGluc3RhbmNlcyA9IHJlcXVpcmUoJy4uL2luc3RhbmNlcycpO1xudmFyIHVwZGF0ZUdlb21ldHJ5ID0gcmVxdWlyZSgnLi4vdXBkYXRlLWdlb21ldHJ5Jyk7XG52YXIgdXBkYXRlU2Nyb2xsID0gcmVxdWlyZSgnLi4vdXBkYXRlLXNjcm9sbCcpO1xuXG5mdW5jdGlvbiBiaW5kVG91Y2hIYW5kbGVyKGVsZW1lbnQsIGksIHN1cHBvcnRzVG91Y2gsIHN1cHBvcnRzSWVQb2ludGVyKSB7XG4gIGZ1bmN0aW9uIHNob3VsZFByZXZlbnREZWZhdWx0KGRlbHRhWCwgZGVsdGFZKSB7XG4gICAgdmFyIHNjcm9sbFRvcCA9IGVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgIHZhciBzY3JvbGxMZWZ0ID0gZWxlbWVudC5zY3JvbGxMZWZ0O1xuICAgIHZhciBtYWduaXR1ZGVYID0gTWF0aC5hYnMoZGVsdGFYKTtcbiAgICB2YXIgbWFnbml0dWRlWSA9IE1hdGguYWJzKGRlbHRhWSk7XG5cbiAgICBpZiAobWFnbml0dWRlWSA+IG1hZ25pdHVkZVgpIHtcbiAgICAgIC8vIHVzZXIgaXMgcGVyaGFwcyB0cnlpbmcgdG8gc3dpcGUgdXAvZG93biB0aGUgcGFnZVxuXG4gICAgICBpZiAoKChkZWx0YVkgPCAwKSAmJiAoc2Nyb2xsVG9wID09PSBpLmNvbnRlbnRIZWlnaHQgLSBpLmNvbnRhaW5lckhlaWdodCkpIHx8XG4gICAgICAgICAgKChkZWx0YVkgPiAwKSAmJiAoc2Nyb2xsVG9wID09PSAwKSkpIHtcbiAgICAgICAgcmV0dXJuICFpLnNldHRpbmdzLnN3aXBlUHJvcGFnYXRpb247XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChtYWduaXR1ZGVYID4gbWFnbml0dWRlWSkge1xuICAgICAgLy8gdXNlciBpcyBwZXJoYXBzIHRyeWluZyB0byBzd2lwZSBsZWZ0L3JpZ2h0IGFjcm9zcyB0aGUgcGFnZVxuXG4gICAgICBpZiAoKChkZWx0YVggPCAwKSAmJiAoc2Nyb2xsTGVmdCA9PT0gaS5jb250ZW50V2lkdGggLSBpLmNvbnRhaW5lcldpZHRoKSkgfHxcbiAgICAgICAgICAoKGRlbHRhWCA+IDApICYmIChzY3JvbGxMZWZ0ID09PSAwKSkpIHtcbiAgICAgICAgcmV0dXJuICFpLnNldHRpbmdzLnN3aXBlUHJvcGFnYXRpb247XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiBhcHBseVRvdWNoTW92ZShkaWZmZXJlbmNlWCwgZGlmZmVyZW5jZVkpIHtcbiAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ3RvcCcsIGVsZW1lbnQuc2Nyb2xsVG9wIC0gZGlmZmVyZW5jZVkpO1xuICAgIHVwZGF0ZVNjcm9sbChlbGVtZW50LCAnbGVmdCcsIGVsZW1lbnQuc2Nyb2xsTGVmdCAtIGRpZmZlcmVuY2VYKTtcblxuICAgIHVwZGF0ZUdlb21ldHJ5KGVsZW1lbnQpO1xuICB9XG5cbiAgdmFyIHN0YXJ0T2Zmc2V0ID0ge307XG4gIHZhciBzdGFydFRpbWUgPSAwO1xuICB2YXIgc3BlZWQgPSB7fTtcbiAgdmFyIGVhc2luZ0xvb3AgPSBudWxsO1xuICB2YXIgaW5HbG9iYWxUb3VjaCA9IGZhbHNlO1xuICB2YXIgaW5Mb2NhbFRvdWNoID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZ2xvYmFsVG91Y2hTdGFydCgpIHtcbiAgICBpbkdsb2JhbFRvdWNoID0gdHJ1ZTtcbiAgfVxuICBmdW5jdGlvbiBnbG9iYWxUb3VjaEVuZCgpIHtcbiAgICBpbkdsb2JhbFRvdWNoID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRUb3VjaChlKSB7XG4gICAgaWYgKGUudGFyZ2V0VG91Y2hlcykge1xuICAgICAgcmV0dXJuIGUudGFyZ2V0VG91Y2hlc1swXTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTWF5YmUgSUUgcG9pbnRlclxuICAgICAgcmV0dXJuIGU7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIHNob3VsZEhhbmRsZShlKSB7XG4gICAgaWYgKGUudGFyZ2V0VG91Y2hlcyAmJiBlLnRhcmdldFRvdWNoZXMubGVuZ3RoID09PSAxKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGUucG9pbnRlclR5cGUgJiYgZS5wb2ludGVyVHlwZSAhPT0gJ21vdXNlJyAmJiBlLnBvaW50ZXJUeXBlICE9PSBlLk1TUE9JTlRFUl9UWVBFX01PVVNFKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGZ1bmN0aW9uIHRvdWNoU3RhcnQoZSkge1xuICAgIGlmIChzaG91bGRIYW5kbGUoZSkpIHtcbiAgICAgIGluTG9jYWxUb3VjaCA9IHRydWU7XG5cbiAgICAgIHZhciB0b3VjaCA9IGdldFRvdWNoKGUpO1xuXG4gICAgICBzdGFydE9mZnNldC5wYWdlWCA9IHRvdWNoLnBhZ2VYO1xuICAgICAgc3RhcnRPZmZzZXQucGFnZVkgPSB0b3VjaC5wYWdlWTtcblxuICAgICAgc3RhcnRUaW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcblxuICAgICAgaWYgKGVhc2luZ0xvb3AgIT09IG51bGwpIHtcbiAgICAgICAgY2xlYXJJbnRlcnZhbChlYXNpbmdMb29wKTtcbiAgICAgIH1cblxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gdG91Y2hNb3ZlKGUpIHtcbiAgICBpZiAoIWluTG9jYWxUb3VjaCAmJiBpLnNldHRpbmdzLnN3aXBlUHJvcGFnYXRpb24pIHtcbiAgICAgIHRvdWNoU3RhcnQoZSk7XG4gICAgfVxuICAgIGlmICghaW5HbG9iYWxUb3VjaCAmJiBpbkxvY2FsVG91Y2ggJiYgc2hvdWxkSGFuZGxlKGUpKSB7XG4gICAgICB2YXIgdG91Y2ggPSBnZXRUb3VjaChlKTtcblxuICAgICAgdmFyIGN1cnJlbnRPZmZzZXQgPSB7cGFnZVg6IHRvdWNoLnBhZ2VYLCBwYWdlWTogdG91Y2gucGFnZVl9O1xuXG4gICAgICB2YXIgZGlmZmVyZW5jZVggPSBjdXJyZW50T2Zmc2V0LnBhZ2VYIC0gc3RhcnRPZmZzZXQucGFnZVg7XG4gICAgICB2YXIgZGlmZmVyZW5jZVkgPSBjdXJyZW50T2Zmc2V0LnBhZ2VZIC0gc3RhcnRPZmZzZXQucGFnZVk7XG5cbiAgICAgIGFwcGx5VG91Y2hNb3ZlKGRpZmZlcmVuY2VYLCBkaWZmZXJlbmNlWSk7XG4gICAgICBzdGFydE9mZnNldCA9IGN1cnJlbnRPZmZzZXQ7XG5cbiAgICAgIHZhciBjdXJyZW50VGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG5cbiAgICAgIHZhciB0aW1lR2FwID0gY3VycmVudFRpbWUgLSBzdGFydFRpbWU7XG4gICAgICBpZiAodGltZUdhcCA+IDApIHtcbiAgICAgICAgc3BlZWQueCA9IGRpZmZlcmVuY2VYIC8gdGltZUdhcDtcbiAgICAgICAgc3BlZWQueSA9IGRpZmZlcmVuY2VZIC8gdGltZUdhcDtcbiAgICAgICAgc3RhcnRUaW1lID0gY3VycmVudFRpbWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChzaG91bGRQcmV2ZW50RGVmYXVsdChkaWZmZXJlbmNlWCwgZGlmZmVyZW5jZVkpKSB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZnVuY3Rpb24gdG91Y2hFbmQoKSB7XG4gICAgaWYgKCFpbkdsb2JhbFRvdWNoICYmIGluTG9jYWxUb3VjaCkge1xuICAgICAgaW5Mb2NhbFRvdWNoID0gZmFsc2U7XG5cbiAgICAgIGlmIChpLnNldHRpbmdzLnN3aXBlRWFzaW5nKSB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwoZWFzaW5nTG9vcCk7XG4gICAgICAgIGVhc2luZ0xvb3AgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgaWYgKCFpbnN0YW5jZXMuZ2V0KGVsZW1lbnQpKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKGVhc2luZ0xvb3ApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghc3BlZWQueCAmJiAhc3BlZWQueSkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChlYXNpbmdMb29wKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoTWF0aC5hYnMoc3BlZWQueCkgPCAwLjAxICYmIE1hdGguYWJzKHNwZWVkLnkpIDwgMC4wMSkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChlYXNpbmdMb29wKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhcHBseVRvdWNoTW92ZShzcGVlZC54ICogMzAsIHNwZWVkLnkgKiAzMCk7XG5cbiAgICAgICAgICBzcGVlZC54ICo9IDAuODtcbiAgICAgICAgICBzcGVlZC55ICo9IDAuODtcbiAgICAgICAgfSwgMTApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChzdXBwb3J0c1RvdWNoKSB7XG4gICAgaS5ldmVudC5iaW5kKHdpbmRvdywgJ3RvdWNoc3RhcnQnLCBnbG9iYWxUb3VjaFN0YXJ0KTtcbiAgICBpLmV2ZW50LmJpbmQod2luZG93LCAndG91Y2hlbmQnLCBnbG9iYWxUb3VjaEVuZCk7XG4gICAgaS5ldmVudC5iaW5kKGVsZW1lbnQsICd0b3VjaHN0YXJ0JywgdG91Y2hTdGFydCk7XG4gICAgaS5ldmVudC5iaW5kKGVsZW1lbnQsICd0b3VjaG1vdmUnLCB0b3VjaE1vdmUpO1xuICAgIGkuZXZlbnQuYmluZChlbGVtZW50LCAndG91Y2hlbmQnLCB0b3VjaEVuZCk7XG4gIH0gZWxzZSBpZiAoc3VwcG9ydHNJZVBvaW50ZXIpIHtcbiAgICBpZiAod2luZG93LlBvaW50ZXJFdmVudCkge1xuICAgICAgaS5ldmVudC5iaW5kKHdpbmRvdywgJ3BvaW50ZXJkb3duJywgZ2xvYmFsVG91Y2hTdGFydCk7XG4gICAgICBpLmV2ZW50LmJpbmQod2luZG93LCAncG9pbnRlcnVwJywgZ2xvYmFsVG91Y2hFbmQpO1xuICAgICAgaS5ldmVudC5iaW5kKGVsZW1lbnQsICdwb2ludGVyZG93bicsIHRvdWNoU3RhcnQpO1xuICAgICAgaS5ldmVudC5iaW5kKGVsZW1lbnQsICdwb2ludGVybW92ZScsIHRvdWNoTW92ZSk7XG4gICAgICBpLmV2ZW50LmJpbmQoZWxlbWVudCwgJ3BvaW50ZXJ1cCcsIHRvdWNoRW5kKTtcbiAgICB9IGVsc2UgaWYgKHdpbmRvdy5NU1BvaW50ZXJFdmVudCkge1xuICAgICAgaS5ldmVudC5iaW5kKHdpbmRvdywgJ01TUG9pbnRlckRvd24nLCBnbG9iYWxUb3VjaFN0YXJ0KTtcbiAgICAgIGkuZXZlbnQuYmluZCh3aW5kb3csICdNU1BvaW50ZXJVcCcsIGdsb2JhbFRvdWNoRW5kKTtcbiAgICAgIGkuZXZlbnQuYmluZChlbGVtZW50LCAnTVNQb2ludGVyRG93bicsIHRvdWNoU3RhcnQpO1xuICAgICAgaS5ldmVudC5iaW5kKGVsZW1lbnQsICdNU1BvaW50ZXJNb3ZlJywgdG91Y2hNb3ZlKTtcbiAgICAgIGkuZXZlbnQuYmluZChlbGVtZW50LCAnTVNQb2ludGVyVXAnLCB0b3VjaEVuZCk7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgaWYgKCFfLmVudi5zdXBwb3J0c1RvdWNoICYmICFfLmVudi5zdXBwb3J0c0llUG9pbnRlcikge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBpID0gaW5zdGFuY2VzLmdldChlbGVtZW50KTtcbiAgYmluZFRvdWNoSGFuZGxlcihlbGVtZW50LCBpLCBfLmVudi5zdXBwb3J0c1RvdWNoLCBfLmVudi5zdXBwb3J0c0llUG9pbnRlcik7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaW5zdGFuY2VzID0gcmVxdWlyZSgnLi9pbnN0YW5jZXMnKTtcbnZhciB1cGRhdGVHZW9tZXRyeSA9IHJlcXVpcmUoJy4vdXBkYXRlLWdlb21ldHJ5Jyk7XG5cbi8vIEhhbmRsZXJzXG52YXIgaGFuZGxlcnMgPSB7XG4gICdjbGljay1yYWlsJzogcmVxdWlyZSgnLi9oYW5kbGVyL2NsaWNrLXJhaWwnKSxcbiAgJ2RyYWctc2Nyb2xsYmFyJzogcmVxdWlyZSgnLi9oYW5kbGVyL2RyYWctc2Nyb2xsYmFyJyksXG4gICdrZXlib2FyZCc6IHJlcXVpcmUoJy4vaGFuZGxlci9rZXlib2FyZCcpLFxuICAnd2hlZWwnOiByZXF1aXJlKCcuL2hhbmRsZXIvbW91c2Utd2hlZWwnKSxcbiAgJ3RvdWNoJzogcmVxdWlyZSgnLi9oYW5kbGVyL3RvdWNoJyksXG4gICdzZWxlY3Rpb24nOiByZXF1aXJlKCcuL2hhbmRsZXIvc2VsZWN0aW9uJylcbn07XG52YXIgbmF0aXZlU2Nyb2xsSGFuZGxlciA9IHJlcXVpcmUoJy4vaGFuZGxlci9uYXRpdmUtc2Nyb2xsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGVsZW1lbnQsIHVzZXJTZXR0aW5ncykge1xuICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3BzJyk7XG5cbiAgLy8gQ3JlYXRlIGEgcGx1Z2luIGluc3RhbmNlLlxuICB2YXIgaSA9IGluc3RhbmNlcy5hZGQoXG4gICAgZWxlbWVudCxcbiAgICB0eXBlb2YgdXNlclNldHRpbmdzID09PSAnb2JqZWN0JyA/IHVzZXJTZXR0aW5ncyA6IHt9XG4gICk7XG5cbiAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdwcy0tdGhlbWVfJyArIGkuc2V0dGluZ3MudGhlbWUpO1xuXG4gIGkuc2V0dGluZ3MuaGFuZGxlcnMuZm9yRWFjaChmdW5jdGlvbiAoaGFuZGxlck5hbWUpIHtcbiAgICBoYW5kbGVyc1toYW5kbGVyTmFtZV0oZWxlbWVudCk7XG4gIH0pO1xuXG4gIG5hdGl2ZVNjcm9sbEhhbmRsZXIoZWxlbWVudCk7XG5cbiAgdXBkYXRlR2VvbWV0cnkoZWxlbWVudCk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJy4uL2xpYi9oZWxwZXInKTtcbnZhciBkZWZhdWx0U2V0dGluZ3MgPSByZXF1aXJlKCcuL2RlZmF1bHQtc2V0dGluZycpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uL2xpYi9kb20nKTtcbnZhciBFdmVudE1hbmFnZXIgPSByZXF1aXJlKCcuLi9saWIvZXZlbnQtbWFuYWdlcicpO1xudmFyIGd1aWQgPSByZXF1aXJlKCcuLi9saWIvZ3VpZCcpO1xuXG52YXIgaW5zdGFuY2VzID0ge307XG5cbmZ1bmN0aW9uIEluc3RhbmNlKGVsZW1lbnQsIHVzZXJTZXR0aW5ncykge1xuICB2YXIgaSA9IHRoaXM7XG5cbiAgaS5zZXR0aW5ncyA9IGRlZmF1bHRTZXR0aW5ncygpO1xuICBmb3IgKHZhciBrZXkgaW4gdXNlclNldHRpbmdzKSB7XG4gICAgaS5zZXR0aW5nc1trZXldID0gdXNlclNldHRpbmdzW2tleV07XG4gIH1cblxuICBpLmNvbnRhaW5lcldpZHRoID0gbnVsbDtcbiAgaS5jb250YWluZXJIZWlnaHQgPSBudWxsO1xuICBpLmNvbnRlbnRXaWR0aCA9IG51bGw7XG4gIGkuY29udGVudEhlaWdodCA9IG51bGw7XG5cbiAgaS5pc1J0bCA9IGRvbS5jc3MoZWxlbWVudCwgJ2RpcmVjdGlvbicpID09PSBcInJ0bFwiO1xuICBpLmlzTmVnYXRpdmVTY3JvbGwgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBvcmlnaW5hbFNjcm9sbExlZnQgPSBlbGVtZW50LnNjcm9sbExlZnQ7XG4gICAgdmFyIHJlc3VsdCA9IG51bGw7XG4gICAgZWxlbWVudC5zY3JvbGxMZWZ0ID0gLTE7XG4gICAgcmVzdWx0ID0gZWxlbWVudC5zY3JvbGxMZWZ0IDwgMDtcbiAgICBlbGVtZW50LnNjcm9sbExlZnQgPSBvcmlnaW5hbFNjcm9sbExlZnQ7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSkoKTtcbiAgaS5uZWdhdGl2ZVNjcm9sbEFkanVzdG1lbnQgPSBpLmlzTmVnYXRpdmVTY3JvbGwgPyBlbGVtZW50LnNjcm9sbFdpZHRoIC0gZWxlbWVudC5jbGllbnRXaWR0aCA6IDA7XG4gIGkuZXZlbnQgPSBuZXcgRXZlbnRNYW5hZ2VyKCk7XG4gIGkub3duZXJEb2N1bWVudCA9IGVsZW1lbnQub3duZXJEb2N1bWVudCB8fCBkb2N1bWVudDtcblxuICBmdW5jdGlvbiBmb2N1cygpIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3BzLS1mb2N1cycpO1xuICB9XG5cbiAgZnVuY3Rpb24gYmx1cigpIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ3BzLS1mb2N1cycpO1xuICB9XG5cbiAgaS5zY3JvbGxiYXJYUmFpbCA9IGRvbS5hcHBlbmRUbyhkb20uY3JlYXRlKCdkaXYnLCAncHNfX3Njcm9sbGJhci14LXJhaWwnKSwgZWxlbWVudCk7XG4gIGkuc2Nyb2xsYmFyWCA9IGRvbS5hcHBlbmRUbyhkb20uY3JlYXRlKCdkaXYnLCAncHNfX3Njcm9sbGJhci14JyksIGkuc2Nyb2xsYmFyWFJhaWwpO1xuICBpLnNjcm9sbGJhclguc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsIDApO1xuICBpLmV2ZW50LmJpbmQoaS5zY3JvbGxiYXJYLCAnZm9jdXMnLCBmb2N1cyk7XG4gIGkuZXZlbnQuYmluZChpLnNjcm9sbGJhclgsICdibHVyJywgYmx1cik7XG4gIGkuc2Nyb2xsYmFyWEFjdGl2ZSA9IG51bGw7XG4gIGkuc2Nyb2xsYmFyWFdpZHRoID0gbnVsbDtcbiAgaS5zY3JvbGxiYXJYTGVmdCA9IG51bGw7XG4gIGkuc2Nyb2xsYmFyWEJvdHRvbSA9IF8udG9JbnQoZG9tLmNzcyhpLnNjcm9sbGJhclhSYWlsLCAnYm90dG9tJykpO1xuICBpLmlzU2Nyb2xsYmFyWFVzaW5nQm90dG9tID0gaS5zY3JvbGxiYXJYQm90dG9tID09PSBpLnNjcm9sbGJhclhCb3R0b207IC8vICFpc05hTlxuICBpLnNjcm9sbGJhclhUb3AgPSBpLmlzU2Nyb2xsYmFyWFVzaW5nQm90dG9tID8gbnVsbCA6IF8udG9JbnQoZG9tLmNzcyhpLnNjcm9sbGJhclhSYWlsLCAndG9wJykpO1xuICBpLnJhaWxCb3JkZXJYV2lkdGggPSBfLnRvSW50KGRvbS5jc3MoaS5zY3JvbGxiYXJYUmFpbCwgJ2JvcmRlckxlZnRXaWR0aCcpKSArIF8udG9JbnQoZG9tLmNzcyhpLnNjcm9sbGJhclhSYWlsLCAnYm9yZGVyUmlnaHRXaWR0aCcpKTtcbiAgLy8gU2V0IHJhaWwgdG8gZGlzcGxheTpibG9jayB0byBjYWxjdWxhdGUgbWFyZ2luc1xuICBkb20uY3NzKGkuc2Nyb2xsYmFyWFJhaWwsICdkaXNwbGF5JywgJ2Jsb2NrJyk7XG4gIGkucmFpbFhNYXJnaW5XaWR0aCA9IF8udG9JbnQoZG9tLmNzcyhpLnNjcm9sbGJhclhSYWlsLCAnbWFyZ2luTGVmdCcpKSArIF8udG9JbnQoZG9tLmNzcyhpLnNjcm9sbGJhclhSYWlsLCAnbWFyZ2luUmlnaHQnKSk7XG4gIGRvbS5jc3MoaS5zY3JvbGxiYXJYUmFpbCwgJ2Rpc3BsYXknLCAnJyk7XG4gIGkucmFpbFhXaWR0aCA9IG51bGw7XG4gIGkucmFpbFhSYXRpbyA9IG51bGw7XG5cbiAgaS5zY3JvbGxiYXJZUmFpbCA9IGRvbS5hcHBlbmRUbyhkb20uY3JlYXRlKCdkaXYnLCAncHNfX3Njcm9sbGJhci15LXJhaWwnKSwgZWxlbWVudCk7XG4gIGkuc2Nyb2xsYmFyWSA9IGRvbS5hcHBlbmRUbyhkb20uY3JlYXRlKCdkaXYnLCAncHNfX3Njcm9sbGJhci15JyksIGkuc2Nyb2xsYmFyWVJhaWwpO1xuICBpLnNjcm9sbGJhclkuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsIDApO1xuICBpLmV2ZW50LmJpbmQoaS5zY3JvbGxiYXJZLCAnZm9jdXMnLCBmb2N1cyk7XG4gIGkuZXZlbnQuYmluZChpLnNjcm9sbGJhclksICdibHVyJywgYmx1cik7XG4gIGkuc2Nyb2xsYmFyWUFjdGl2ZSA9IG51bGw7XG4gIGkuc2Nyb2xsYmFyWUhlaWdodCA9IG51bGw7XG4gIGkuc2Nyb2xsYmFyWVRvcCA9IG51bGw7XG4gIGkuc2Nyb2xsYmFyWVJpZ2h0ID0gXy50b0ludChkb20uY3NzKGkuc2Nyb2xsYmFyWVJhaWwsICdyaWdodCcpKTtcbiAgaS5pc1Njcm9sbGJhcllVc2luZ1JpZ2h0ID0gaS5zY3JvbGxiYXJZUmlnaHQgPT09IGkuc2Nyb2xsYmFyWVJpZ2h0OyAvLyAhaXNOYU5cbiAgaS5zY3JvbGxiYXJZTGVmdCA9IGkuaXNTY3JvbGxiYXJZVXNpbmdSaWdodCA/IG51bGwgOiBfLnRvSW50KGRvbS5jc3MoaS5zY3JvbGxiYXJZUmFpbCwgJ2xlZnQnKSk7XG4gIGkuc2Nyb2xsYmFyWU91dGVyV2lkdGggPSBpLmlzUnRsID8gXy5vdXRlcldpZHRoKGkuc2Nyb2xsYmFyWSkgOiBudWxsO1xuICBpLnJhaWxCb3JkZXJZV2lkdGggPSBfLnRvSW50KGRvbS5jc3MoaS5zY3JvbGxiYXJZUmFpbCwgJ2JvcmRlclRvcFdpZHRoJykpICsgXy50b0ludChkb20uY3NzKGkuc2Nyb2xsYmFyWVJhaWwsICdib3JkZXJCb3R0b21XaWR0aCcpKTtcbiAgZG9tLmNzcyhpLnNjcm9sbGJhcllSYWlsLCAnZGlzcGxheScsICdibG9jaycpO1xuICBpLnJhaWxZTWFyZ2luSGVpZ2h0ID0gXy50b0ludChkb20uY3NzKGkuc2Nyb2xsYmFyWVJhaWwsICdtYXJnaW5Ub3AnKSkgKyBfLnRvSW50KGRvbS5jc3MoaS5zY3JvbGxiYXJZUmFpbCwgJ21hcmdpbkJvdHRvbScpKTtcbiAgZG9tLmNzcyhpLnNjcm9sbGJhcllSYWlsLCAnZGlzcGxheScsICcnKTtcbiAgaS5yYWlsWUhlaWdodCA9IG51bGw7XG4gIGkucmFpbFlSYXRpbyA9IG51bGw7XG59XG5cbmZ1bmN0aW9uIGdldElkKGVsZW1lbnQpIHtcbiAgcmV0dXJuIGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXBzLWlkJyk7XG59XG5cbmZ1bmN0aW9uIHNldElkKGVsZW1lbnQsIGlkKSB7XG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLXBzLWlkJywgaWQpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVJZChlbGVtZW50KSB7XG4gIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXBzLWlkJyk7XG59XG5cbmV4cG9ydHMuYWRkID0gZnVuY3Rpb24gKGVsZW1lbnQsIHVzZXJTZXR0aW5ncykge1xuICB2YXIgbmV3SWQgPSBndWlkKCk7XG4gIHNldElkKGVsZW1lbnQsIG5ld0lkKTtcbiAgaW5zdGFuY2VzW25ld0lkXSA9IG5ldyBJbnN0YW5jZShlbGVtZW50LCB1c2VyU2V0dGluZ3MpO1xuICByZXR1cm4gaW5zdGFuY2VzW25ld0lkXTtcbn07XG5cbmV4cG9ydHMucmVtb3ZlID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgZGVsZXRlIGluc3RhbmNlc1tnZXRJZChlbGVtZW50KV07XG4gIHJlbW92ZUlkKGVsZW1lbnQpO1xufTtcblxuZXhwb3J0cy5nZXQgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICByZXR1cm4gaW5zdGFuY2VzW2dldElkKGVsZW1lbnQpXTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBfID0gcmVxdWlyZSgnLi4vbGliL2hlbHBlcicpO1xudmFyIGRvbSA9IHJlcXVpcmUoJy4uL2xpYi9kb20nKTtcbnZhciBpbnN0YW5jZXMgPSByZXF1aXJlKCcuL2luc3RhbmNlcycpO1xudmFyIHVwZGF0ZVNjcm9sbCA9IHJlcXVpcmUoJy4vdXBkYXRlLXNjcm9sbCcpO1xuXG5mdW5jdGlvbiBnZXRUaHVtYlNpemUoaSwgdGh1bWJTaXplKSB7XG4gIGlmIChpLnNldHRpbmdzLm1pblNjcm9sbGJhckxlbmd0aCkge1xuICAgIHRodW1iU2l6ZSA9IE1hdGgubWF4KHRodW1iU2l6ZSwgaS5zZXR0aW5ncy5taW5TY3JvbGxiYXJMZW5ndGgpO1xuICB9XG4gIGlmIChpLnNldHRpbmdzLm1heFNjcm9sbGJhckxlbmd0aCkge1xuICAgIHRodW1iU2l6ZSA9IE1hdGgubWluKHRodW1iU2l6ZSwgaS5zZXR0aW5ncy5tYXhTY3JvbGxiYXJMZW5ndGgpO1xuICB9XG4gIHJldHVybiB0aHVtYlNpemU7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUNzcyhlbGVtZW50LCBpKSB7XG4gIHZhciB4UmFpbE9mZnNldCA9IHt3aWR0aDogaS5yYWlsWFdpZHRofTtcbiAgaWYgKGkuaXNSdGwpIHtcbiAgICB4UmFpbE9mZnNldC5sZWZ0ID0gaS5uZWdhdGl2ZVNjcm9sbEFkanVzdG1lbnQgKyBlbGVtZW50LnNjcm9sbExlZnQgKyBpLmNvbnRhaW5lcldpZHRoIC0gaS5jb250ZW50V2lkdGg7XG4gIH0gZWxzZSB7XG4gICAgeFJhaWxPZmZzZXQubGVmdCA9IGVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgfVxuICBpZiAoaS5pc1Njcm9sbGJhclhVc2luZ0JvdHRvbSkge1xuICAgIHhSYWlsT2Zmc2V0LmJvdHRvbSA9IGkuc2Nyb2xsYmFyWEJvdHRvbSAtIGVsZW1lbnQuc2Nyb2xsVG9wO1xuICB9IGVsc2Uge1xuICAgIHhSYWlsT2Zmc2V0LnRvcCA9IGkuc2Nyb2xsYmFyWFRvcCArIGVsZW1lbnQuc2Nyb2xsVG9wO1xuICB9XG4gIGRvbS5jc3MoaS5zY3JvbGxiYXJYUmFpbCwgeFJhaWxPZmZzZXQpO1xuXG4gIHZhciB5UmFpbE9mZnNldCA9IHt0b3A6IGVsZW1lbnQuc2Nyb2xsVG9wLCBoZWlnaHQ6IGkucmFpbFlIZWlnaHR9O1xuICBpZiAoaS5pc1Njcm9sbGJhcllVc2luZ1JpZ2h0KSB7XG4gICAgaWYgKGkuaXNSdGwpIHtcbiAgICAgIHlSYWlsT2Zmc2V0LnJpZ2h0ID0gaS5jb250ZW50V2lkdGggLSAoaS5uZWdhdGl2ZVNjcm9sbEFkanVzdG1lbnQgKyBlbGVtZW50LnNjcm9sbExlZnQpIC0gaS5zY3JvbGxiYXJZUmlnaHQgLSBpLnNjcm9sbGJhcllPdXRlcldpZHRoO1xuICAgIH0gZWxzZSB7XG4gICAgICB5UmFpbE9mZnNldC5yaWdodCA9IGkuc2Nyb2xsYmFyWVJpZ2h0IC0gZWxlbWVudC5zY3JvbGxMZWZ0O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoaS5pc1J0bCkge1xuICAgICAgeVJhaWxPZmZzZXQubGVmdCA9IGkubmVnYXRpdmVTY3JvbGxBZGp1c3RtZW50ICsgZWxlbWVudC5zY3JvbGxMZWZ0ICsgaS5jb250YWluZXJXaWR0aCAqIDIgLSBpLmNvbnRlbnRXaWR0aCAtIGkuc2Nyb2xsYmFyWUxlZnQgLSBpLnNjcm9sbGJhcllPdXRlcldpZHRoO1xuICAgIH0gZWxzZSB7XG4gICAgICB5UmFpbE9mZnNldC5sZWZ0ID0gaS5zY3JvbGxiYXJZTGVmdCArIGVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgICB9XG4gIH1cbiAgZG9tLmNzcyhpLnNjcm9sbGJhcllSYWlsLCB5UmFpbE9mZnNldCk7XG5cbiAgZG9tLmNzcyhpLnNjcm9sbGJhclgsIHtsZWZ0OiBpLnNjcm9sbGJhclhMZWZ0LCB3aWR0aDogaS5zY3JvbGxiYXJYV2lkdGggLSBpLnJhaWxCb3JkZXJYV2lkdGh9KTtcbiAgZG9tLmNzcyhpLnNjcm9sbGJhclksIHt0b3A6IGkuc2Nyb2xsYmFyWVRvcCwgaGVpZ2h0OiBpLnNjcm9sbGJhcllIZWlnaHQgLSBpLnJhaWxCb3JkZXJZV2lkdGh9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICB2YXIgaSA9IGluc3RhbmNlcy5nZXQoZWxlbWVudCk7XG5cbiAgaS5jb250YWluZXJXaWR0aCA9IGVsZW1lbnQuY2xpZW50V2lkdGg7XG4gIGkuY29udGFpbmVySGVpZ2h0ID0gZWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gIGkuY29udGVudFdpZHRoID0gZWxlbWVudC5zY3JvbGxXaWR0aDtcbiAgaS5jb250ZW50SGVpZ2h0ID0gZWxlbWVudC5zY3JvbGxIZWlnaHQ7XG5cbiAgdmFyIGV4aXN0aW5nUmFpbHM7XG4gIGlmICghZWxlbWVudC5jb250YWlucyhpLnNjcm9sbGJhclhSYWlsKSkge1xuICAgIGV4aXN0aW5nUmFpbHMgPSBkb20ucXVlcnlDaGlsZHJlbihlbGVtZW50LCAnLnBzX19zY3JvbGxiYXIteC1yYWlsJyk7XG4gICAgaWYgKGV4aXN0aW5nUmFpbHMubGVuZ3RoID4gMCkge1xuICAgICAgZXhpc3RpbmdSYWlscy5mb3JFYWNoKGZ1bmN0aW9uIChyYWlsKSB7XG4gICAgICAgIGRvbS5yZW1vdmUocmFpbCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgZG9tLmFwcGVuZFRvKGkuc2Nyb2xsYmFyWFJhaWwsIGVsZW1lbnQpO1xuICB9XG4gIGlmICghZWxlbWVudC5jb250YWlucyhpLnNjcm9sbGJhcllSYWlsKSkge1xuICAgIGV4aXN0aW5nUmFpbHMgPSBkb20ucXVlcnlDaGlsZHJlbihlbGVtZW50LCAnLnBzX19zY3JvbGxiYXIteS1yYWlsJyk7XG4gICAgaWYgKGV4aXN0aW5nUmFpbHMubGVuZ3RoID4gMCkge1xuICAgICAgZXhpc3RpbmdSYWlscy5mb3JFYWNoKGZ1bmN0aW9uIChyYWlsKSB7XG4gICAgICAgIGRvbS5yZW1vdmUocmFpbCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgZG9tLmFwcGVuZFRvKGkuc2Nyb2xsYmFyWVJhaWwsIGVsZW1lbnQpO1xuICB9XG5cbiAgaWYgKCFpLnNldHRpbmdzLnN1cHByZXNzU2Nyb2xsWCAmJiBpLmNvbnRhaW5lcldpZHRoICsgaS5zZXR0aW5ncy5zY3JvbGxYTWFyZ2luT2Zmc2V0IDwgaS5jb250ZW50V2lkdGgpIHtcbiAgICBpLnNjcm9sbGJhclhBY3RpdmUgPSB0cnVlO1xuICAgIGkucmFpbFhXaWR0aCA9IGkuY29udGFpbmVyV2lkdGggLSBpLnJhaWxYTWFyZ2luV2lkdGg7XG4gICAgaS5yYWlsWFJhdGlvID0gaS5jb250YWluZXJXaWR0aCAvIGkucmFpbFhXaWR0aDtcbiAgICBpLnNjcm9sbGJhclhXaWR0aCA9IGdldFRodW1iU2l6ZShpLCBfLnRvSW50KGkucmFpbFhXaWR0aCAqIGkuY29udGFpbmVyV2lkdGggLyBpLmNvbnRlbnRXaWR0aCkpO1xuICAgIGkuc2Nyb2xsYmFyWExlZnQgPSBfLnRvSW50KChpLm5lZ2F0aXZlU2Nyb2xsQWRqdXN0bWVudCArIGVsZW1lbnQuc2Nyb2xsTGVmdCkgKiAoaS5yYWlsWFdpZHRoIC0gaS5zY3JvbGxiYXJYV2lkdGgpIC8gKGkuY29udGVudFdpZHRoIC0gaS5jb250YWluZXJXaWR0aCkpO1xuICB9IGVsc2Uge1xuICAgIGkuc2Nyb2xsYmFyWEFjdGl2ZSA9IGZhbHNlO1xuICB9XG5cbiAgaWYgKCFpLnNldHRpbmdzLnN1cHByZXNzU2Nyb2xsWSAmJiBpLmNvbnRhaW5lckhlaWdodCArIGkuc2V0dGluZ3Muc2Nyb2xsWU1hcmdpbk9mZnNldCA8IGkuY29udGVudEhlaWdodCkge1xuICAgIGkuc2Nyb2xsYmFyWUFjdGl2ZSA9IHRydWU7XG4gICAgaS5yYWlsWUhlaWdodCA9IGkuY29udGFpbmVySGVpZ2h0IC0gaS5yYWlsWU1hcmdpbkhlaWdodDtcbiAgICBpLnJhaWxZUmF0aW8gPSBpLmNvbnRhaW5lckhlaWdodCAvIGkucmFpbFlIZWlnaHQ7XG4gICAgaS5zY3JvbGxiYXJZSGVpZ2h0ID0gZ2V0VGh1bWJTaXplKGksIF8udG9JbnQoaS5yYWlsWUhlaWdodCAqIGkuY29udGFpbmVySGVpZ2h0IC8gaS5jb250ZW50SGVpZ2h0KSk7XG4gICAgaS5zY3JvbGxiYXJZVG9wID0gXy50b0ludChlbGVtZW50LnNjcm9sbFRvcCAqIChpLnJhaWxZSGVpZ2h0IC0gaS5zY3JvbGxiYXJZSGVpZ2h0KSAvIChpLmNvbnRlbnRIZWlnaHQgLSBpLmNvbnRhaW5lckhlaWdodCkpO1xuICB9IGVsc2Uge1xuICAgIGkuc2Nyb2xsYmFyWUFjdGl2ZSA9IGZhbHNlO1xuICB9XG5cbiAgaWYgKGkuc2Nyb2xsYmFyWExlZnQgPj0gaS5yYWlsWFdpZHRoIC0gaS5zY3JvbGxiYXJYV2lkdGgpIHtcbiAgICBpLnNjcm9sbGJhclhMZWZ0ID0gaS5yYWlsWFdpZHRoIC0gaS5zY3JvbGxiYXJYV2lkdGg7XG4gIH1cbiAgaWYgKGkuc2Nyb2xsYmFyWVRvcCA+PSBpLnJhaWxZSGVpZ2h0IC0gaS5zY3JvbGxiYXJZSGVpZ2h0KSB7XG4gICAgaS5zY3JvbGxiYXJZVG9wID0gaS5yYWlsWUhlaWdodCAtIGkuc2Nyb2xsYmFyWUhlaWdodDtcbiAgfVxuXG4gIHVwZGF0ZUNzcyhlbGVtZW50LCBpKTtcblxuICBpZiAoaS5zY3JvbGxiYXJYQWN0aXZlKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdwcy0tYWN0aXZlLXgnKTtcbiAgfSBlbHNlIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ3BzLS1hY3RpdmUteCcpO1xuICAgIGkuc2Nyb2xsYmFyWFdpZHRoID0gMDtcbiAgICBpLnNjcm9sbGJhclhMZWZ0ID0gMDtcbiAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ2xlZnQnLCAwKTtcbiAgfVxuICBpZiAoaS5zY3JvbGxiYXJZQWN0aXZlKSB7XG4gICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdwcy0tYWN0aXZlLXknKTtcbiAgfSBlbHNlIHtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ3BzLS1hY3RpdmUteScpO1xuICAgIGkuc2Nyb2xsYmFyWUhlaWdodCA9IDA7XG4gICAgaS5zY3JvbGxiYXJZVG9wID0gMDtcbiAgICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ3RvcCcsIDApO1xuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaW5zdGFuY2VzID0gcmVxdWlyZSgnLi9pbnN0YW5jZXMnKTtcblxudmFyIGNyZWF0ZURPTUV2ZW50ID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgdmFyIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJFdmVudFwiKTtcbiAgZXZlbnQuaW5pdEV2ZW50KG5hbWUsIHRydWUsIHRydWUpO1xuICByZXR1cm4gZXZlbnQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlbGVtZW50LCBheGlzLCB2YWx1ZSkge1xuICBpZiAodHlwZW9mIGVsZW1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgdGhyb3cgJ1lvdSBtdXN0IHByb3ZpZGUgYW4gZWxlbWVudCB0byB0aGUgdXBkYXRlLXNjcm9sbCBmdW5jdGlvbic7XG4gIH1cblxuICBpZiAodHlwZW9mIGF4aXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgdGhyb3cgJ1lvdSBtdXN0IHByb3ZpZGUgYW4gYXhpcyB0byB0aGUgdXBkYXRlLXNjcm9sbCBmdW5jdGlvbic7XG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJykge1xuICAgIHRocm93ICdZb3UgbXVzdCBwcm92aWRlIGEgdmFsdWUgdG8gdGhlIHVwZGF0ZS1zY3JvbGwgZnVuY3Rpb24nO1xuICB9XG5cbiAgaWYgKGF4aXMgPT09ICd0b3AnICYmIHZhbHVlIDw9IDApIHtcbiAgICBlbGVtZW50LnNjcm9sbFRvcCA9IHZhbHVlID0gMDsgLy8gZG9uJ3QgYWxsb3cgbmVnYXRpdmUgc2Nyb2xsXG4gICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGNyZWF0ZURPTUV2ZW50KCdwcy15LXJlYWNoLXN0YXJ0JykpO1xuICB9XG5cbiAgaWYgKGF4aXMgPT09ICdsZWZ0JyAmJiB2YWx1ZSA8PSAwKSB7XG4gICAgZWxlbWVudC5zY3JvbGxMZWZ0ID0gdmFsdWUgPSAwOyAvLyBkb24ndCBhbGxvdyBuZWdhdGl2ZSBzY3JvbGxcbiAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoY3JlYXRlRE9NRXZlbnQoJ3BzLXgtcmVhY2gtc3RhcnQnKSk7XG4gIH1cblxuICB2YXIgaSA9IGluc3RhbmNlcy5nZXQoZWxlbWVudCk7XG5cbiAgaWYgKGF4aXMgPT09ICd0b3AnICYmIHZhbHVlID49IGkuY29udGVudEhlaWdodCAtIGkuY29udGFpbmVySGVpZ2h0KSB7XG4gICAgLy8gZG9uJ3QgYWxsb3cgc2Nyb2xsIHBhc3QgY29udGFpbmVyXG4gICAgdmFsdWUgPSBpLmNvbnRlbnRIZWlnaHQgLSBpLmNvbnRhaW5lckhlaWdodDtcbiAgICBpZiAodmFsdWUgLSBlbGVtZW50LnNjcm9sbFRvcCA8PSAyKSB7XG4gICAgICAvLyBtaXRpZ2F0ZXMgcm91bmRpbmcgZXJyb3JzIG9uIG5vbi1zdWJwaXhlbCBzY3JvbGwgdmFsdWVzXG4gICAgICB2YWx1ZSA9IGVsZW1lbnQuc2Nyb2xsVG9wO1xuICAgIH0gZWxzZSB7XG4gICAgICBlbGVtZW50LnNjcm9sbFRvcCA9IHZhbHVlO1xuICAgIH1cbiAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoY3JlYXRlRE9NRXZlbnQoJ3BzLXktcmVhY2gtZW5kJykpO1xuICB9XG5cbiAgaWYgKGF4aXMgPT09ICdsZWZ0JyAmJiB2YWx1ZSA+PSBpLmNvbnRlbnRXaWR0aCAtIGkuY29udGFpbmVyV2lkdGgpIHtcbiAgICAvLyBkb24ndCBhbGxvdyBzY3JvbGwgcGFzdCBjb250YWluZXJcbiAgICB2YWx1ZSA9IGkuY29udGVudFdpZHRoIC0gaS5jb250YWluZXJXaWR0aDtcbiAgICBpZiAodmFsdWUgLSBlbGVtZW50LnNjcm9sbExlZnQgPD0gMikge1xuICAgICAgLy8gbWl0aWdhdGVzIHJvdW5kaW5nIGVycm9ycyBvbiBub24tc3VicGl4ZWwgc2Nyb2xsIHZhbHVlc1xuICAgICAgdmFsdWUgPSBlbGVtZW50LnNjcm9sbExlZnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsZW1lbnQuc2Nyb2xsTGVmdCA9IHZhbHVlO1xuICAgIH1cbiAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQoY3JlYXRlRE9NRXZlbnQoJ3BzLXgtcmVhY2gtZW5kJykpO1xuICB9XG5cbiAgaWYgKGkubGFzdFRvcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgaS5sYXN0VG9wID0gZWxlbWVudC5zY3JvbGxUb3A7XG4gIH1cblxuICBpZiAoaS5sYXN0TGVmdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgaS5sYXN0TGVmdCA9IGVsZW1lbnQuc2Nyb2xsTGVmdDtcbiAgfVxuXG4gIGlmIChheGlzID09PSAndG9wJyAmJiB2YWx1ZSA8IGkubGFzdFRvcCkge1xuICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChjcmVhdGVET01FdmVudCgncHMtc2Nyb2xsLXVwJykpO1xuICB9XG5cbiAgaWYgKGF4aXMgPT09ICd0b3AnICYmIHZhbHVlID4gaS5sYXN0VG9wKSB7XG4gICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGNyZWF0ZURPTUV2ZW50KCdwcy1zY3JvbGwtZG93bicpKTtcbiAgfVxuXG4gIGlmIChheGlzID09PSAnbGVmdCcgJiYgdmFsdWUgPCBpLmxhc3RMZWZ0KSB7XG4gICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGNyZWF0ZURPTUV2ZW50KCdwcy1zY3JvbGwtbGVmdCcpKTtcbiAgfVxuXG4gIGlmIChheGlzID09PSAnbGVmdCcgJiYgdmFsdWUgPiBpLmxhc3RMZWZ0KSB7XG4gICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGNyZWF0ZURPTUV2ZW50KCdwcy1zY3JvbGwtcmlnaHQnKSk7XG4gIH1cblxuICBpZiAoYXhpcyA9PT0gJ3RvcCcgJiYgdmFsdWUgIT09IGkubGFzdFRvcCkge1xuICAgIGVsZW1lbnQuc2Nyb2xsVG9wID0gaS5sYXN0VG9wID0gdmFsdWU7XG4gICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGNyZWF0ZURPTUV2ZW50KCdwcy1zY3JvbGwteScpKTtcbiAgfVxuXG4gIGlmIChheGlzID09PSAnbGVmdCcgJiYgdmFsdWUgIT09IGkubGFzdExlZnQpIHtcbiAgICBlbGVtZW50LnNjcm9sbExlZnQgPSBpLmxhc3RMZWZ0ID0gdmFsdWU7XG4gICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KGNyZWF0ZURPTUV2ZW50KCdwcy1zY3JvbGwteCcpKTtcbiAgfVxuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgXyA9IHJlcXVpcmUoJy4uL2xpYi9oZWxwZXInKTtcbnZhciBkb20gPSByZXF1aXJlKCcuLi9saWIvZG9tJyk7XG52YXIgaW5zdGFuY2VzID0gcmVxdWlyZSgnLi9pbnN0YW5jZXMnKTtcbnZhciB1cGRhdGVHZW9tZXRyeSA9IHJlcXVpcmUoJy4vdXBkYXRlLWdlb21ldHJ5Jyk7XG52YXIgdXBkYXRlU2Nyb2xsID0gcmVxdWlyZSgnLi91cGRhdGUtc2Nyb2xsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgdmFyIGkgPSBpbnN0YW5jZXMuZ2V0KGVsZW1lbnQpO1xuXG4gIGlmICghaSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFJlY2FsY3VhdGUgbmVnYXRpdmUgc2Nyb2xsTGVmdCBhZGp1c3RtZW50XG4gIGkubmVnYXRpdmVTY3JvbGxBZGp1c3RtZW50ID0gaS5pc05lZ2F0aXZlU2Nyb2xsID8gZWxlbWVudC5zY3JvbGxXaWR0aCAtIGVsZW1lbnQuY2xpZW50V2lkdGggOiAwO1xuXG4gIC8vIFJlY2FsY3VsYXRlIHJhaWwgbWFyZ2luc1xuICBkb20uY3NzKGkuc2Nyb2xsYmFyWFJhaWwsICdkaXNwbGF5JywgJ2Jsb2NrJyk7XG4gIGRvbS5jc3MoaS5zY3JvbGxiYXJZUmFpbCwgJ2Rpc3BsYXknLCAnYmxvY2snKTtcbiAgaS5yYWlsWE1hcmdpbldpZHRoID0gXy50b0ludChkb20uY3NzKGkuc2Nyb2xsYmFyWFJhaWwsICdtYXJnaW5MZWZ0JykpICsgXy50b0ludChkb20uY3NzKGkuc2Nyb2xsYmFyWFJhaWwsICdtYXJnaW5SaWdodCcpKTtcbiAgaS5yYWlsWU1hcmdpbkhlaWdodCA9IF8udG9JbnQoZG9tLmNzcyhpLnNjcm9sbGJhcllSYWlsLCAnbWFyZ2luVG9wJykpICsgXy50b0ludChkb20uY3NzKGkuc2Nyb2xsYmFyWVJhaWwsICdtYXJnaW5Cb3R0b20nKSk7XG5cbiAgLy8gSGlkZSBzY3JvbGxiYXJzIG5vdCB0byBhZmZlY3Qgc2Nyb2xsV2lkdGggYW5kIHNjcm9sbEhlaWdodFxuICBkb20uY3NzKGkuc2Nyb2xsYmFyWFJhaWwsICdkaXNwbGF5JywgJ25vbmUnKTtcbiAgZG9tLmNzcyhpLnNjcm9sbGJhcllSYWlsLCAnZGlzcGxheScsICdub25lJyk7XG5cbiAgdXBkYXRlR2VvbWV0cnkoZWxlbWVudCk7XG5cbiAgLy8gVXBkYXRlIHRvcC9sZWZ0IHNjcm9sbCB0byB0cmlnZ2VyIGV2ZW50c1xuICB1cGRhdGVTY3JvbGwoZWxlbWVudCwgJ3RvcCcsIGVsZW1lbnQuc2Nyb2xsVG9wKTtcbiAgdXBkYXRlU2Nyb2xsKGVsZW1lbnQsICdsZWZ0JywgZWxlbWVudC5zY3JvbGxMZWZ0KTtcblxuICBkb20uY3NzKGkuc2Nyb2xsYmFyWFJhaWwsICdkaXNwbGF5JywgJycpO1xuICBkb20uY3NzKGkuc2Nyb2xsYmFyWVJhaWwsICdkaXNwbGF5JywgJycpO1xufTtcbiIsIi8vIENpcmNsZSBzaGFwZWQgcHJvZ3Jlc3MgYmFyXG5cbnZhciBTaGFwZSA9IHJlcXVpcmUoJy4vc2hhcGUnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxudmFyIENpcmNsZSA9IGZ1bmN0aW9uIENpcmNsZShjb250YWluZXIsIG9wdGlvbnMpIHtcbiAgICAvLyBVc2UgdHdvIGFyY3MgdG8gZm9ybSBhIGNpcmNsZVxuICAgIC8vIFNlZSB0aGlzIGFuc3dlciBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xMDQ3NzMzNC8xNDQ2MDkyXG4gICAgdGhpcy5fcGF0aFRlbXBsYXRlID1cbiAgICAgICAgJ00gNTAsNTAgbSAwLC17cmFkaXVzfScgK1xuICAgICAgICAnIGEge3JhZGl1c30se3JhZGl1c30gMCAxIDEgMCx7MnJhZGl1c30nICtcbiAgICAgICAgJyBhIHtyYWRpdXN9LHtyYWRpdXN9IDAgMSAxIDAsLXsycmFkaXVzfSc7XG5cbiAgICB0aGlzLmNvbnRhaW5lckFzcGVjdFJhdGlvID0gMTtcblxuICAgIFNoYXBlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG5DaXJjbGUucHJvdG90eXBlID0gbmV3IFNoYXBlKCk7XG5DaXJjbGUucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQ2lyY2xlO1xuXG5DaXJjbGUucHJvdG90eXBlLl9wYXRoU3RyaW5nID0gZnVuY3Rpb24gX3BhdGhTdHJpbmcob3B0cykge1xuICAgIHZhciB3aWR0aE9mV2lkZXIgPSBvcHRzLnN0cm9rZVdpZHRoO1xuICAgIGlmIChvcHRzLnRyYWlsV2lkdGggJiYgb3B0cy50cmFpbFdpZHRoID4gb3B0cy5zdHJva2VXaWR0aCkge1xuICAgICAgICB3aWR0aE9mV2lkZXIgPSBvcHRzLnRyYWlsV2lkdGg7XG4gICAgfVxuXG4gICAgdmFyIHIgPSA1MCAtIHdpZHRoT2ZXaWRlciAvIDI7XG5cbiAgICByZXR1cm4gdXRpbHMucmVuZGVyKHRoaXMuX3BhdGhUZW1wbGF0ZSwge1xuICAgICAgICByYWRpdXM6IHIsXG4gICAgICAgICcycmFkaXVzJzogciAqIDJcbiAgICB9KTtcbn07XG5cbkNpcmNsZS5wcm90b3R5cGUuX3RyYWlsU3RyaW5nID0gZnVuY3Rpb24gX3RyYWlsU3RyaW5nKG9wdHMpIHtcbiAgICByZXR1cm4gdGhpcy5fcGF0aFN0cmluZyhvcHRzKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2lyY2xlO1xuIiwiLy8gTGluZSBzaGFwZWQgcHJvZ3Jlc3MgYmFyXG5cbnZhciBTaGFwZSA9IHJlcXVpcmUoJy4vc2hhcGUnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxudmFyIExpbmUgPSBmdW5jdGlvbiBMaW5lKGNvbnRhaW5lciwgb3B0aW9ucykge1xuICAgIHRoaXMuX3BhdGhUZW1wbGF0ZSA9ICdNIDAse2NlbnRlcn0gTCAxMDAse2NlbnRlcn0nO1xuICAgIFNoYXBlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG5MaW5lLnByb3RvdHlwZSA9IG5ldyBTaGFwZSgpO1xuTGluZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBMaW5lO1xuXG5MaW5lLnByb3RvdHlwZS5faW5pdGlhbGl6ZVN2ZyA9IGZ1bmN0aW9uIF9pbml0aWFsaXplU3ZnKHN2Zywgb3B0cykge1xuICAgIHN2Zy5zZXRBdHRyaWJ1dGUoJ3ZpZXdCb3gnLCAnMCAwIDEwMCAnICsgb3B0cy5zdHJva2VXaWR0aCk7XG4gICAgc3ZnLnNldEF0dHJpYnV0ZSgncHJlc2VydmVBc3BlY3RSYXRpbycsICdub25lJyk7XG59O1xuXG5MaW5lLnByb3RvdHlwZS5fcGF0aFN0cmluZyA9IGZ1bmN0aW9uIF9wYXRoU3RyaW5nKG9wdHMpIHtcbiAgICByZXR1cm4gdXRpbHMucmVuZGVyKHRoaXMuX3BhdGhUZW1wbGF0ZSwge1xuICAgICAgICBjZW50ZXI6IG9wdHMuc3Ryb2tlV2lkdGggLyAyXG4gICAgfSk7XG59O1xuXG5MaW5lLnByb3RvdHlwZS5fdHJhaWxTdHJpbmcgPSBmdW5jdGlvbiBfdHJhaWxTdHJpbmcob3B0cykge1xuICAgIHJldHVybiB0aGlzLl9wYXRoU3RyaW5nKG9wdHMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBMaW5lO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgLy8gSGlnaGVyIGxldmVsIEFQSSwgZGlmZmVyZW50IHNoYXBlZCBwcm9ncmVzcyBiYXJzXG4gICAgTGluZTogcmVxdWlyZSgnLi9saW5lJyksXG4gICAgQ2lyY2xlOiByZXF1aXJlKCcuL2NpcmNsZScpLFxuICAgIFNlbWlDaXJjbGU6IHJlcXVpcmUoJy4vc2VtaWNpcmNsZScpLFxuXG4gICAgLy8gTG93ZXIgbGV2ZWwgQVBJIHRvIHVzZSBhbnkgU1ZHIHBhdGhcbiAgICBQYXRoOiByZXF1aXJlKCcuL3BhdGgnKSxcblxuICAgIC8vIEJhc2UtY2xhc3MgZm9yIGNyZWF0aW5nIG5ldyBjdXN0b20gc2hhcGVzXG4gICAgLy8gdG8gYmUgaW4gbGluZSB3aXRoIHRoZSBBUEkgb2YgYnVpbHQtaW4gc2hhcGVzXG4gICAgLy8gVW5kb2N1bWVudGVkLlxuICAgIFNoYXBlOiByZXF1aXJlKCcuL3NoYXBlJyksXG5cbiAgICAvLyBJbnRlcm5hbCB1dGlscywgdW5kb2N1bWVudGVkLlxuICAgIHV0aWxzOiByZXF1aXJlKCcuL3V0aWxzJylcbn07XG4iLCIvLyBMb3dlciBsZXZlbCBBUEkgdG8gYW5pbWF0ZSBhbnkga2luZCBvZiBzdmcgcGF0aFxuXG52YXIgVHdlZW5hYmxlID0gcmVxdWlyZSgnc2hpZnR5Jyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbnZhciBFQVNJTkdfQUxJQVNFUyA9IHtcbiAgICBlYXNlSW46ICdlYXNlSW5DdWJpYycsXG4gICAgZWFzZU91dDogJ2Vhc2VPdXRDdWJpYycsXG4gICAgZWFzZUluT3V0OiAnZWFzZUluT3V0Q3ViaWMnXG59O1xuXG52YXIgUGF0aCA9IGZ1bmN0aW9uIFBhdGgocGF0aCwgb3B0cykge1xuICAgIC8vIFRocm93IGEgYmV0dGVyIGVycm9yIGlmIG5vdCBpbml0aWFsaXplZCB3aXRoIGBuZXdgIGtleXdvcmRcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUGF0aCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb25zdHJ1Y3RvciB3YXMgY2FsbGVkIHdpdGhvdXQgbmV3IGtleXdvcmQnKTtcbiAgICB9XG5cbiAgICAvLyBEZWZhdWx0IHBhcmFtZXRlcnMgZm9yIGFuaW1hdGlvblxuICAgIG9wdHMgPSB1dGlscy5leHRlbmQoe1xuICAgICAgICBkdXJhdGlvbjogODAwLFxuICAgICAgICBlYXNpbmc6ICdsaW5lYXInLFxuICAgICAgICBmcm9tOiB7fSxcbiAgICAgICAgdG86IHt9LFxuICAgICAgICBzdGVwOiBmdW5jdGlvbigpIHt9XG4gICAgfSwgb3B0cyk7XG5cbiAgICB2YXIgZWxlbWVudDtcbiAgICBpZiAodXRpbHMuaXNTdHJpbmcocGF0aCkpIHtcbiAgICAgICAgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IocGF0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZWxlbWVudCA9IHBhdGg7XG4gICAgfVxuXG4gICAgLy8gUmV2ZWFsIC5wYXRoIGFzIHB1YmxpYyBhdHRyaWJ1dGVcbiAgICB0aGlzLnBhdGggPSBlbGVtZW50O1xuICAgIHRoaXMuX29wdHMgPSBvcHRzO1xuICAgIHRoaXMuX3R3ZWVuYWJsZSA9IG51bGw7XG5cbiAgICAvLyBTZXQgdXAgdGhlIHN0YXJ0aW5nIHBvc2l0aW9uc1xuICAgIHZhciBsZW5ndGggPSB0aGlzLnBhdGguZ2V0VG90YWxMZW5ndGgoKTtcbiAgICB0aGlzLnBhdGguc3R5bGUuc3Ryb2tlRGFzaGFycmF5ID0gbGVuZ3RoICsgJyAnICsgbGVuZ3RoO1xuICAgIHRoaXMuc2V0KDApO1xufTtcblxuUGF0aC5wcm90b3R5cGUudmFsdWUgPSBmdW5jdGlvbiB2YWx1ZSgpIHtcbiAgICB2YXIgb2Zmc2V0ID0gdGhpcy5fZ2V0Q29tcHV0ZWREYXNoT2Zmc2V0KCk7XG4gICAgdmFyIGxlbmd0aCA9IHRoaXMucGF0aC5nZXRUb3RhbExlbmd0aCgpO1xuXG4gICAgdmFyIHByb2dyZXNzID0gMSAtIG9mZnNldCAvIGxlbmd0aDtcbiAgICAvLyBSb3VuZCBudW1iZXIgdG8gcHJldmVudCByZXR1cm5pbmcgdmVyeSBzbWFsbCBudW1iZXIgbGlrZSAxZS0zMCwgd2hpY2hcbiAgICAvLyBpcyBwcmFjdGljYWxseSAwXG4gICAgcmV0dXJuIHBhcnNlRmxvYXQocHJvZ3Jlc3MudG9GaXhlZCg2KSwgMTApO1xufTtcblxuUGF0aC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0KHByb2dyZXNzKSB7XG4gICAgdGhpcy5zdG9wKCk7XG5cbiAgICB0aGlzLnBhdGguc3R5bGUuc3Ryb2tlRGFzaG9mZnNldCA9IHRoaXMuX3Byb2dyZXNzVG9PZmZzZXQocHJvZ3Jlc3MpO1xuXG4gICAgdmFyIHN0ZXAgPSB0aGlzLl9vcHRzLnN0ZXA7XG4gICAgaWYgKHV0aWxzLmlzRnVuY3Rpb24oc3RlcCkpIHtcbiAgICAgICAgdmFyIGVhc2luZyA9IHRoaXMuX2Vhc2luZyh0aGlzLl9vcHRzLmVhc2luZyk7XG4gICAgICAgIHZhciB2YWx1ZXMgPSB0aGlzLl9jYWxjdWxhdGVUbyhwcm9ncmVzcywgZWFzaW5nKTtcbiAgICAgICAgdmFyIHJlZmVyZW5jZSA9IHRoaXMuX29wdHMuc2hhcGUgfHwgdGhpcztcbiAgICAgICAgc3RlcCh2YWx1ZXMsIHJlZmVyZW5jZSwgdGhpcy5fb3B0cy5hdHRhY2htZW50KTtcbiAgICB9XG59O1xuXG5QYXRoLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gc3RvcCgpIHtcbiAgICB0aGlzLl9zdG9wVHdlZW4oKTtcbiAgICB0aGlzLnBhdGguc3R5bGUuc3Ryb2tlRGFzaG9mZnNldCA9IHRoaXMuX2dldENvbXB1dGVkRGFzaE9mZnNldCgpO1xufTtcblxuLy8gTWV0aG9kIGludHJvZHVjZWQgaGVyZTpcbi8vIGh0dHA6Ly9qYWtlYXJjaGliYWxkLmNvbS8yMDEzL2FuaW1hdGVkLWxpbmUtZHJhd2luZy1zdmcvXG5QYXRoLnByb3RvdHlwZS5hbmltYXRlID0gZnVuY3Rpb24gYW5pbWF0ZShwcm9ncmVzcywgb3B0cywgY2IpIHtcbiAgICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICAgIGlmICh1dGlscy5pc0Z1bmN0aW9uKG9wdHMpKSB7XG4gICAgICAgIGNiID0gb3B0cztcbiAgICAgICAgb3B0cyA9IHt9O1xuICAgIH1cblxuICAgIHZhciBwYXNzZWRPcHRzID0gdXRpbHMuZXh0ZW5kKHt9LCBvcHRzKTtcblxuICAgIC8vIENvcHkgZGVmYXVsdCBvcHRzIHRvIG5ldyBvYmplY3Qgc28gZGVmYXVsdHMgYXJlIG5vdCBtb2RpZmllZFxuICAgIHZhciBkZWZhdWx0T3B0cyA9IHV0aWxzLmV4dGVuZCh7fSwgdGhpcy5fb3B0cyk7XG4gICAgb3B0cyA9IHV0aWxzLmV4dGVuZChkZWZhdWx0T3B0cywgb3B0cyk7XG5cbiAgICB2YXIgc2hpZnR5RWFzaW5nID0gdGhpcy5fZWFzaW5nKG9wdHMuZWFzaW5nKTtcbiAgICB2YXIgdmFsdWVzID0gdGhpcy5fcmVzb2x2ZUZyb21BbmRUbyhwcm9ncmVzcywgc2hpZnR5RWFzaW5nLCBwYXNzZWRPcHRzKTtcblxuICAgIHRoaXMuc3RvcCgpO1xuXG4gICAgLy8gVHJpZ2dlciBhIGxheW91dCBzbyBzdHlsZXMgYXJlIGNhbGN1bGF0ZWQgJiB0aGUgYnJvd3NlclxuICAgIC8vIHBpY2tzIHVwIHRoZSBzdGFydGluZyBwb3NpdGlvbiBiZWZvcmUgYW5pbWF0aW5nXG4gICAgdGhpcy5wYXRoLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgdmFyIG9mZnNldCA9IHRoaXMuX2dldENvbXB1dGVkRGFzaE9mZnNldCgpO1xuICAgIHZhciBuZXdPZmZzZXQgPSB0aGlzLl9wcm9ncmVzc1RvT2Zmc2V0KHByb2dyZXNzKTtcblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLl90d2VlbmFibGUgPSBuZXcgVHdlZW5hYmxlKCk7XG4gICAgdGhpcy5fdHdlZW5hYmxlLnR3ZWVuKHtcbiAgICAgICAgZnJvbTogdXRpbHMuZXh0ZW5kKHsgb2Zmc2V0OiBvZmZzZXQgfSwgdmFsdWVzLmZyb20pLFxuICAgICAgICB0bzogdXRpbHMuZXh0ZW5kKHsgb2Zmc2V0OiBuZXdPZmZzZXQgfSwgdmFsdWVzLnRvKSxcbiAgICAgICAgZHVyYXRpb246IG9wdHMuZHVyYXRpb24sXG4gICAgICAgIGVhc2luZzogc2hpZnR5RWFzaW5nLFxuICAgICAgICBzdGVwOiBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgICAgICAgc2VsZi5wYXRoLnN0eWxlLnN0cm9rZURhc2hvZmZzZXQgPSBzdGF0ZS5vZmZzZXQ7XG4gICAgICAgICAgICB2YXIgcmVmZXJlbmNlID0gb3B0cy5zaGFwZSB8fCBzZWxmO1xuICAgICAgICAgICAgb3B0cy5zdGVwKHN0YXRlLCByZWZlcmVuY2UsIG9wdHMuYXR0YWNobWVudCk7XG4gICAgICAgIH0sXG4gICAgICAgIGZpbmlzaDogZnVuY3Rpb24oc3RhdGUpIHtcbiAgICAgICAgICAgIGlmICh1dGlscy5pc0Z1bmN0aW9uKGNiKSkge1xuICAgICAgICAgICAgICAgIGNiKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cblBhdGgucHJvdG90eXBlLl9nZXRDb21wdXRlZERhc2hPZmZzZXQgPSBmdW5jdGlvbiBfZ2V0Q29tcHV0ZWREYXNoT2Zmc2V0KCkge1xuICAgIHZhciBjb21wdXRlZFN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy5wYXRoLCBudWxsKTtcbiAgICByZXR1cm4gcGFyc2VGbG9hdChjb21wdXRlZFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3N0cm9rZS1kYXNob2Zmc2V0JyksIDEwKTtcbn07XG5cblBhdGgucHJvdG90eXBlLl9wcm9ncmVzc1RvT2Zmc2V0ID0gZnVuY3Rpb24gX3Byb2dyZXNzVG9PZmZzZXQocHJvZ3Jlc3MpIHtcbiAgICB2YXIgbGVuZ3RoID0gdGhpcy5wYXRoLmdldFRvdGFsTGVuZ3RoKCk7XG4gICAgcmV0dXJuIGxlbmd0aCAtIHByb2dyZXNzICogbGVuZ3RoO1xufTtcblxuLy8gUmVzb2x2ZXMgZnJvbSBhbmQgdG8gdmFsdWVzIGZvciBhbmltYXRpb24uXG5QYXRoLnByb3RvdHlwZS5fcmVzb2x2ZUZyb21BbmRUbyA9IGZ1bmN0aW9uIF9yZXNvbHZlRnJvbUFuZFRvKHByb2dyZXNzLCBlYXNpbmcsIG9wdHMpIHtcbiAgICBpZiAob3B0cy5mcm9tICYmIG9wdHMudG8pIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZyb206IG9wdHMuZnJvbSxcbiAgICAgICAgICAgIHRvOiBvcHRzLnRvXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZnJvbTogdGhpcy5fY2FsY3VsYXRlRnJvbShlYXNpbmcpLFxuICAgICAgICB0bzogdGhpcy5fY2FsY3VsYXRlVG8ocHJvZ3Jlc3MsIGVhc2luZylcbiAgICB9O1xufTtcblxuLy8gQ2FsY3VsYXRlIGBmcm9tYCB2YWx1ZXMgZnJvbSBvcHRpb25zIHBhc3NlZCBhdCBpbml0aWFsaXphdGlvblxuUGF0aC5wcm90b3R5cGUuX2NhbGN1bGF0ZUZyb20gPSBmdW5jdGlvbiBfY2FsY3VsYXRlRnJvbShlYXNpbmcpIHtcbiAgICByZXR1cm4gVHdlZW5hYmxlLmludGVycG9sYXRlKHRoaXMuX29wdHMuZnJvbSwgdGhpcy5fb3B0cy50bywgdGhpcy52YWx1ZSgpLCBlYXNpbmcpO1xufTtcblxuLy8gQ2FsY3VsYXRlIGB0b2AgdmFsdWVzIGZyb20gb3B0aW9ucyBwYXNzZWQgYXQgaW5pdGlhbGl6YXRpb25cblBhdGgucHJvdG90eXBlLl9jYWxjdWxhdGVUbyA9IGZ1bmN0aW9uIF9jYWxjdWxhdGVUbyhwcm9ncmVzcywgZWFzaW5nKSB7XG4gICAgcmV0dXJuIFR3ZWVuYWJsZS5pbnRlcnBvbGF0ZSh0aGlzLl9vcHRzLmZyb20sIHRoaXMuX29wdHMudG8sIHByb2dyZXNzLCBlYXNpbmcpO1xufTtcblxuUGF0aC5wcm90b3R5cGUuX3N0b3BUd2VlbiA9IGZ1bmN0aW9uIF9zdG9wVHdlZW4oKSB7XG4gICAgaWYgKHRoaXMuX3R3ZWVuYWJsZSAhPT0gbnVsbCkge1xuICAgICAgICB0aGlzLl90d2VlbmFibGUuc3RvcCgpO1xuICAgICAgICB0aGlzLl90d2VlbmFibGUgPSBudWxsO1xuICAgIH1cbn07XG5cblBhdGgucHJvdG90eXBlLl9lYXNpbmcgPSBmdW5jdGlvbiBfZWFzaW5nKGVhc2luZykge1xuICAgIGlmIChFQVNJTkdfQUxJQVNFUy5oYXNPd25Qcm9wZXJ0eShlYXNpbmcpKSB7XG4gICAgICAgIHJldHVybiBFQVNJTkdfQUxJQVNFU1tlYXNpbmddO1xuICAgIH1cblxuICAgIHJldHVybiBlYXNpbmc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhdGg7XG4iLCIvLyBTZW1pLVNlbWlDaXJjbGUgc2hhcGVkIHByb2dyZXNzIGJhclxuXG52YXIgU2hhcGUgPSByZXF1aXJlKCcuL3NoYXBlJyk7XG52YXIgQ2lyY2xlID0gcmVxdWlyZSgnLi9jaXJjbGUnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxudmFyIFNlbWlDaXJjbGUgPSBmdW5jdGlvbiBTZW1pQ2lyY2xlKGNvbnRhaW5lciwgb3B0aW9ucykge1xuICAgIC8vIFVzZSBvbmUgYXJjIHRvIGZvcm0gYSBTZW1pQ2lyY2xlXG4gICAgLy8gU2VlIHRoaXMgYW5zd2VyIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEwNDc3MzM0LzE0NDYwOTJcbiAgICB0aGlzLl9wYXRoVGVtcGxhdGUgPVxuICAgICAgICAnTSA1MCw1MCBtIC17cmFkaXVzfSwwJyArXG4gICAgICAgICcgYSB7cmFkaXVzfSx7cmFkaXVzfSAwIDEgMSB7MnJhZGl1c30sMCc7XG5cbiAgICB0aGlzLmNvbnRhaW5lckFzcGVjdFJhdGlvID0gMjtcblxuICAgIFNoYXBlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG5TZW1pQ2lyY2xlLnByb3RvdHlwZSA9IG5ldyBTaGFwZSgpO1xuU2VtaUNpcmNsZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTZW1pQ2lyY2xlO1xuXG5TZW1pQ2lyY2xlLnByb3RvdHlwZS5faW5pdGlhbGl6ZVN2ZyA9IGZ1bmN0aW9uIF9pbml0aWFsaXplU3ZnKHN2Zywgb3B0cykge1xuICAgIHN2Zy5zZXRBdHRyaWJ1dGUoJ3ZpZXdCb3gnLCAnMCAwIDEwMCA1MCcpO1xufTtcblxuU2VtaUNpcmNsZS5wcm90b3R5cGUuX2luaXRpYWxpemVUZXh0Q29udGFpbmVyID0gZnVuY3Rpb24gX2luaXRpYWxpemVUZXh0Q29udGFpbmVyKFxuICAgIG9wdHMsXG4gICAgY29udGFpbmVyLFxuICAgIHRleHRDb250YWluZXJcbikge1xuICAgIGlmIChvcHRzLnRleHQuc3R5bGUpIHtcbiAgICAgICAgLy8gUmVzZXQgdG9wIHN0eWxlXG4gICAgICAgIHRleHRDb250YWluZXIuc3R5bGUudG9wID0gJ2F1dG8nO1xuICAgICAgICB0ZXh0Q29udGFpbmVyLnN0eWxlLmJvdHRvbSA9ICcwJztcblxuICAgICAgICBpZiAob3B0cy50ZXh0LmFsaWduVG9Cb3R0b20pIHtcbiAgICAgICAgICAgIHV0aWxzLnNldFN0eWxlKHRleHRDb250YWluZXIsICd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKC01MCUsIDApJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1dGlscy5zZXRTdHlsZSh0ZXh0Q29udGFpbmVyLCAndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgtNTAlLCA1MCUpJyk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vLyBTaGFyZSBmdW5jdGlvbmFsaXR5IHdpdGggQ2lyY2xlLCBqdXN0IGhhdmUgZGlmZmVyZW50IHBhdGhcblNlbWlDaXJjbGUucHJvdG90eXBlLl9wYXRoU3RyaW5nID0gQ2lyY2xlLnByb3RvdHlwZS5fcGF0aFN0cmluZztcblNlbWlDaXJjbGUucHJvdG90eXBlLl90cmFpbFN0cmluZyA9IENpcmNsZS5wcm90b3R5cGUuX3RyYWlsU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlbWlDaXJjbGU7XG4iLCIvLyBCYXNlIG9iamVjdCBmb3IgZGlmZmVyZW50IHByb2dyZXNzIGJhciBzaGFwZXNcblxudmFyIFBhdGggPSByZXF1aXJlKCcuL3BhdGgnKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcblxudmFyIERFU1RST1lFRF9FUlJPUiA9ICdPYmplY3QgaXMgZGVzdHJveWVkJztcblxudmFyIFNoYXBlID0gZnVuY3Rpb24gU2hhcGUoY29udGFpbmVyLCBvcHRzKSB7XG4gICAgLy8gVGhyb3cgYSBiZXR0ZXIgZXJyb3IgaWYgcHJvZ3Jlc3MgYmFycyBhcmUgbm90IGluaXRpYWxpemVkIHdpdGggYG5ld2BcbiAgICAvLyBrZXl3b3JkXG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFNoYXBlKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbnN0cnVjdG9yIHdhcyBjYWxsZWQgd2l0aG91dCBuZXcga2V5d29yZCcpO1xuICAgIH1cblxuICAgIC8vIFByZXZlbnQgY2FsbGluZyBjb25zdHJ1Y3RvciB3aXRob3V0IHBhcmFtZXRlcnMgc28gaW5oZXJpdGFuY2VcbiAgICAvLyB3b3JrcyBjb3JyZWN0bHkuIFRvIHVuZGVyc3RhbmQsIHRoaXMgaXMgaG93IFNoYXBlIGlzIGluaGVyaXRlZDpcbiAgICAvL1xuICAgIC8vICAgTGluZS5wcm90b3R5cGUgPSBuZXcgU2hhcGUoKTtcbiAgICAvL1xuICAgIC8vIFdlIGp1c3Qgd2FudCB0byBzZXQgdGhlIHByb3RvdHlwZSBmb3IgTGluZS5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gRGVmYXVsdCBwYXJhbWV0ZXJzIGZvciBwcm9ncmVzcyBiYXIgY3JlYXRpb25cbiAgICB0aGlzLl9vcHRzID0gdXRpbHMuZXh0ZW5kKHtcbiAgICAgICAgY29sb3I6ICcjNTU1JyxcbiAgICAgICAgc3Ryb2tlV2lkdGg6IDEuMCxcbiAgICAgICAgdHJhaWxDb2xvcjogbnVsbCxcbiAgICAgICAgdHJhaWxXaWR0aDogbnVsbCxcbiAgICAgICAgZmlsbDogbnVsbCxcbiAgICAgICAgdGV4dDoge1xuICAgICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgICAgICBjb2xvcjogbnVsbCxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgICAgICBsZWZ0OiAnNTAlJyxcbiAgICAgICAgICAgICAgICB0b3A6ICc1MCUnLFxuICAgICAgICAgICAgICAgIHBhZGRpbmc6IDAsXG4gICAgICAgICAgICAgICAgbWFyZ2luOiAwLFxuICAgICAgICAgICAgICAgIHRyYW5zZm9ybToge1xuICAgICAgICAgICAgICAgICAgICBwcmVmaXg6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiAndHJhbnNsYXRlKC01MCUsIC01MCUpJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhdXRvU3R5bGVDb250YWluZXI6IHRydWUsXG4gICAgICAgICAgICBhbGlnblRvQm90dG9tOiB0cnVlLFxuICAgICAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgICAgICAgICBjbGFzc05hbWU6ICdwcm9ncmVzc2Jhci10ZXh0J1xuICAgICAgICB9LFxuICAgICAgICBzdmdTdHlsZToge1xuICAgICAgICAgICAgZGlzcGxheTogJ2Jsb2NrJyxcbiAgICAgICAgICAgIHdpZHRoOiAnMTAwJSdcbiAgICAgICAgfSxcbiAgICAgICAgd2FybmluZ3M6IGZhbHNlXG4gICAgfSwgb3B0cywgdHJ1ZSk7ICAvLyBVc2UgcmVjdXJzaXZlIGV4dGVuZFxuXG4gICAgLy8gSWYgdXNlciBzcGVjaWZpZXMgZS5nLiBzdmdTdHlsZSBvciB0ZXh0IHN0eWxlLCB0aGUgd2hvbGUgb2JqZWN0XG4gICAgLy8gc2hvdWxkIHJlcGxhY2UgdGhlIGRlZmF1bHRzIHRvIG1ha2Ugd29ya2luZyB3aXRoIHN0eWxlcyBlYXNpZXJcbiAgICBpZiAodXRpbHMuaXNPYmplY3Qob3B0cykgJiYgb3B0cy5zdmdTdHlsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuX29wdHMuc3ZnU3R5bGUgPSBvcHRzLnN2Z1N0eWxlO1xuICAgIH1cbiAgICBpZiAodXRpbHMuaXNPYmplY3Qob3B0cykgJiYgdXRpbHMuaXNPYmplY3Qob3B0cy50ZXh0KSAmJiBvcHRzLnRleHQuc3R5bGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLl9vcHRzLnRleHQuc3R5bGUgPSBvcHRzLnRleHQuc3R5bGU7XG4gICAgfVxuXG4gICAgdmFyIHN2Z1ZpZXcgPSB0aGlzLl9jcmVhdGVTdmdWaWV3KHRoaXMuX29wdHMpO1xuXG4gICAgdmFyIGVsZW1lbnQ7XG4gICAgaWYgKHV0aWxzLmlzU3RyaW5nKGNvbnRhaW5lcikpIHtcbiAgICAgICAgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY29udGFpbmVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBlbGVtZW50ID0gY29udGFpbmVyO1xuICAgIH1cblxuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbnRhaW5lciBkb2VzIG5vdCBleGlzdDogJyArIGNvbnRhaW5lcik7XG4gICAgfVxuXG4gICAgdGhpcy5fY29udGFpbmVyID0gZWxlbWVudDtcbiAgICB0aGlzLl9jb250YWluZXIuYXBwZW5kQ2hpbGQoc3ZnVmlldy5zdmcpO1xuICAgIGlmICh0aGlzLl9vcHRzLndhcm5pbmdzKSB7XG4gICAgICAgIHRoaXMuX3dhcm5Db250YWluZXJBc3BlY3RSYXRpbyh0aGlzLl9jb250YWluZXIpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9vcHRzLnN2Z1N0eWxlKSB7XG4gICAgICAgIHV0aWxzLnNldFN0eWxlcyhzdmdWaWV3LnN2ZywgdGhpcy5fb3B0cy5zdmdTdHlsZSk7XG4gICAgfVxuXG4gICAgLy8gRXhwb3NlIHB1YmxpYyBhdHRyaWJ1dGVzIGJlZm9yZSBQYXRoIGluaXRpYWxpemF0aW9uXG4gICAgdGhpcy5zdmcgPSBzdmdWaWV3LnN2ZztcbiAgICB0aGlzLnBhdGggPSBzdmdWaWV3LnBhdGg7XG4gICAgdGhpcy50cmFpbCA9IHN2Z1ZpZXcudHJhaWw7XG4gICAgdGhpcy50ZXh0ID0gbnVsbDtcblxuICAgIHZhciBuZXdPcHRzID0gdXRpbHMuZXh0ZW5kKHtcbiAgICAgICAgYXR0YWNobWVudDogdW5kZWZpbmVkLFxuICAgICAgICBzaGFwZTogdGhpc1xuICAgIH0sIHRoaXMuX29wdHMpO1xuICAgIHRoaXMuX3Byb2dyZXNzUGF0aCA9IG5ldyBQYXRoKHN2Z1ZpZXcucGF0aCwgbmV3T3B0cyk7XG5cbiAgICBpZiAodXRpbHMuaXNPYmplY3QodGhpcy5fb3B0cy50ZXh0KSAmJiB0aGlzLl9vcHRzLnRleHQudmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy5zZXRUZXh0KHRoaXMuX29wdHMudGV4dC52YWx1ZSk7XG4gICAgfVxufTtcblxuU2hhcGUucHJvdG90eXBlLmFuaW1hdGUgPSBmdW5jdGlvbiBhbmltYXRlKHByb2dyZXNzLCBvcHRzLCBjYikge1xuICAgIGlmICh0aGlzLl9wcm9ncmVzc1BhdGggPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKERFU1RST1lFRF9FUlJPUik7XG4gICAgfVxuXG4gICAgdGhpcy5fcHJvZ3Jlc3NQYXRoLmFuaW1hdGUocHJvZ3Jlc3MsIG9wdHMsIGNiKTtcbn07XG5cblNoYXBlLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gc3RvcCgpIHtcbiAgICBpZiAodGhpcy5fcHJvZ3Jlc3NQYXRoID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihERVNUUk9ZRURfRVJST1IpO1xuICAgIH1cblxuICAgIC8vIERvbid0IGNyYXNoIGlmIHN0b3AgaXMgY2FsbGVkIGluc2lkZSBzdGVwIGZ1bmN0aW9uXG4gICAgaWYgKHRoaXMuX3Byb2dyZXNzUGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9wcm9ncmVzc1BhdGguc3RvcCgpO1xufTtcblxuU2hhcGUucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLl9wcm9ncmVzc1BhdGggPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKERFU1RST1lFRF9FUlJPUik7XG4gICAgfVxuXG4gICAgdGhpcy5zdG9wKCk7XG4gICAgdGhpcy5zdmcucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLnN2Zyk7XG4gICAgdGhpcy5zdmcgPSBudWxsO1xuICAgIHRoaXMucGF0aCA9IG51bGw7XG4gICAgdGhpcy50cmFpbCA9IG51bGw7XG4gICAgdGhpcy5fcHJvZ3Jlc3NQYXRoID0gbnVsbDtcblxuICAgIGlmICh0aGlzLnRleHQgIT09IG51bGwpIHtcbiAgICAgICAgdGhpcy50ZXh0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy50ZXh0KTtcbiAgICAgICAgdGhpcy50ZXh0ID0gbnVsbDtcbiAgICB9XG59O1xuXG5TaGFwZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0KHByb2dyZXNzKSB7XG4gICAgaWYgKHRoaXMuX3Byb2dyZXNzUGF0aCA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoREVTVFJPWUVEX0VSUk9SKTtcbiAgICB9XG5cbiAgICB0aGlzLl9wcm9ncmVzc1BhdGguc2V0KHByb2dyZXNzKTtcbn07XG5cblNoYXBlLnByb3RvdHlwZS52YWx1ZSA9IGZ1bmN0aW9uIHZhbHVlKCkge1xuICAgIGlmICh0aGlzLl9wcm9ncmVzc1BhdGggPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKERFU1RST1lFRF9FUlJPUik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3Byb2dyZXNzUGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9wcm9ncmVzc1BhdGgudmFsdWUoKTtcbn07XG5cblNoYXBlLnByb3RvdHlwZS5zZXRUZXh0ID0gZnVuY3Rpb24gc2V0VGV4dChuZXdUZXh0KSB7XG4gICAgaWYgKHRoaXMuX3Byb2dyZXNzUGF0aCA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoREVTVFJPWUVEX0VSUk9SKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy50ZXh0ID09PSBudWxsKSB7XG4gICAgICAgIC8vIENyZWF0ZSBuZXcgdGV4dCBub2RlXG4gICAgICAgIHRoaXMudGV4dCA9IHRoaXMuX2NyZWF0ZVRleHRDb250YWluZXIodGhpcy5fb3B0cywgdGhpcy5fY29udGFpbmVyKTtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMudGV4dCk7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIHByZXZpb3VzIHRleHQgYW5kIGFkZCBuZXdcbiAgICBpZiAodXRpbHMuaXNPYmplY3QobmV3VGV4dCkpIHtcbiAgICAgICAgdXRpbHMucmVtb3ZlQ2hpbGRyZW4odGhpcy50ZXh0KTtcbiAgICAgICAgdGhpcy50ZXh0LmFwcGVuZENoaWxkKG5ld1RleHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudGV4dC5pbm5lckhUTUwgPSBuZXdUZXh0O1xuICAgIH1cbn07XG5cblNoYXBlLnByb3RvdHlwZS5fY3JlYXRlU3ZnVmlldyA9IGZ1bmN0aW9uIF9jcmVhdGVTdmdWaWV3KG9wdHMpIHtcbiAgICB2YXIgc3ZnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsICdzdmcnKTtcbiAgICB0aGlzLl9pbml0aWFsaXplU3ZnKHN2Zywgb3B0cyk7XG5cbiAgICB2YXIgdHJhaWxQYXRoID0gbnVsbDtcbiAgICAvLyBFYWNoIG9wdGlvbiBsaXN0ZWQgaW4gdGhlIGlmIGNvbmRpdGlvbiBhcmUgJ3RyaWdnZXJzJyBmb3IgY3JlYXRpbmdcbiAgICAvLyB0aGUgdHJhaWwgcGF0aFxuICAgIGlmIChvcHRzLnRyYWlsQ29sb3IgfHwgb3B0cy50cmFpbFdpZHRoKSB7XG4gICAgICAgIHRyYWlsUGF0aCA9IHRoaXMuX2NyZWF0ZVRyYWlsKG9wdHMpO1xuICAgICAgICBzdmcuYXBwZW5kQ2hpbGQodHJhaWxQYXRoKTtcbiAgICB9XG5cbiAgICB2YXIgcGF0aCA9IHRoaXMuX2NyZWF0ZVBhdGgob3B0cyk7XG4gICAgc3ZnLmFwcGVuZENoaWxkKHBhdGgpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3ZnOiBzdmcsXG4gICAgICAgIHBhdGg6IHBhdGgsXG4gICAgICAgIHRyYWlsOiB0cmFpbFBhdGhcbiAgICB9O1xufTtcblxuU2hhcGUucHJvdG90eXBlLl9pbml0aWFsaXplU3ZnID0gZnVuY3Rpb24gX2luaXRpYWxpemVTdmcoc3ZnLCBvcHRzKSB7XG4gICAgc3ZnLnNldEF0dHJpYnV0ZSgndmlld0JveCcsICcwIDAgMTAwIDEwMCcpO1xufTtcblxuU2hhcGUucHJvdG90eXBlLl9jcmVhdGVQYXRoID0gZnVuY3Rpb24gX2NyZWF0ZVBhdGgob3B0cykge1xuICAgIHZhciBwYXRoU3RyaW5nID0gdGhpcy5fcGF0aFN0cmluZyhvcHRzKTtcbiAgICByZXR1cm4gdGhpcy5fY3JlYXRlUGF0aEVsZW1lbnQocGF0aFN0cmluZywgb3B0cyk7XG59O1xuXG5TaGFwZS5wcm90b3R5cGUuX2NyZWF0ZVRyYWlsID0gZnVuY3Rpb24gX2NyZWF0ZVRyYWlsKG9wdHMpIHtcbiAgICAvLyBDcmVhdGUgcGF0aCBzdHJpbmcgd2l0aCBvcmlnaW5hbCBwYXNzZWQgb3B0aW9uc1xuICAgIHZhciBwYXRoU3RyaW5nID0gdGhpcy5fdHJhaWxTdHJpbmcob3B0cyk7XG5cbiAgICAvLyBQcmV2ZW50IG1vZGlmeWluZyBvcmlnaW5hbFxuICAgIHZhciBuZXdPcHRzID0gdXRpbHMuZXh0ZW5kKHt9LCBvcHRzKTtcblxuICAgIC8vIERlZmF1bHRzIGZvciBwYXJhbWV0ZXJzIHdoaWNoIG1vZGlmeSB0cmFpbCBwYXRoXG4gICAgaWYgKCFuZXdPcHRzLnRyYWlsQ29sb3IpIHtcbiAgICAgICAgbmV3T3B0cy50cmFpbENvbG9yID0gJyNlZWUnO1xuICAgIH1cbiAgICBpZiAoIW5ld09wdHMudHJhaWxXaWR0aCkge1xuICAgICAgICBuZXdPcHRzLnRyYWlsV2lkdGggPSBuZXdPcHRzLnN0cm9rZVdpZHRoO1xuICAgIH1cblxuICAgIG5ld09wdHMuY29sb3IgPSBuZXdPcHRzLnRyYWlsQ29sb3I7XG4gICAgbmV3T3B0cy5zdHJva2VXaWR0aCA9IG5ld09wdHMudHJhaWxXaWR0aDtcblxuICAgIC8vIFdoZW4gdHJhaWwgcGF0aCBpcyBzZXQsIGZpbGwgbXVzdCBiZSBzZXQgZm9yIGl0IGluc3RlYWQgb2YgdGhlXG4gICAgLy8gYWN0dWFsIHBhdGggdG8gcHJldmVudCB0cmFpbCBzdHJva2UgZnJvbSBjbGlwcGluZ1xuICAgIG5ld09wdHMuZmlsbCA9IG51bGw7XG5cbiAgICByZXR1cm4gdGhpcy5fY3JlYXRlUGF0aEVsZW1lbnQocGF0aFN0cmluZywgbmV3T3B0cyk7XG59O1xuXG5TaGFwZS5wcm90b3R5cGUuX2NyZWF0ZVBhdGhFbGVtZW50ID0gZnVuY3Rpb24gX2NyZWF0ZVBhdGhFbGVtZW50KHBhdGhTdHJpbmcsIG9wdHMpIHtcbiAgICB2YXIgcGF0aCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCAncGF0aCcpO1xuICAgIHBhdGguc2V0QXR0cmlidXRlKCdkJywgcGF0aFN0cmluZyk7XG4gICAgcGF0aC5zZXRBdHRyaWJ1dGUoJ3N0cm9rZScsIG9wdHMuY29sb3IpO1xuICAgIHBhdGguc2V0QXR0cmlidXRlKCdzdHJva2Utd2lkdGgnLCBvcHRzLnN0cm9rZVdpZHRoKTtcblxuICAgIGlmIChvcHRzLmZpbGwpIHtcbiAgICAgICAgcGF0aC5zZXRBdHRyaWJ1dGUoJ2ZpbGwnLCBvcHRzLmZpbGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHBhdGguc2V0QXR0cmlidXRlKCdmaWxsLW9wYWNpdHknLCAnMCcpO1xuICAgIH1cblxuICAgIHJldHVybiBwYXRoO1xufTtcblxuU2hhcGUucHJvdG90eXBlLl9jcmVhdGVUZXh0Q29udGFpbmVyID0gZnVuY3Rpb24gX2NyZWF0ZVRleHRDb250YWluZXIob3B0cywgY29udGFpbmVyKSB7XG4gICAgdmFyIHRleHRDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB0ZXh0Q29udGFpbmVyLmNsYXNzTmFtZSA9IG9wdHMudGV4dC5jbGFzc05hbWU7XG5cbiAgICB2YXIgdGV4dFN0eWxlID0gb3B0cy50ZXh0LnN0eWxlO1xuICAgIGlmICh0ZXh0U3R5bGUpIHtcbiAgICAgICAgaWYgKG9wdHMudGV4dC5hdXRvU3R5bGVDb250YWluZXIpIHtcbiAgICAgICAgICAgIGNvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9ICdyZWxhdGl2ZSc7XG4gICAgICAgIH1cblxuICAgICAgICB1dGlscy5zZXRTdHlsZXModGV4dENvbnRhaW5lciwgdGV4dFN0eWxlKTtcbiAgICAgICAgLy8gRGVmYXVsdCB0ZXh0IGNvbG9yIHRvIHByb2dyZXNzIGJhcidzIGNvbG9yXG4gICAgICAgIGlmICghdGV4dFN0eWxlLmNvbG9yKSB7XG4gICAgICAgICAgICB0ZXh0Q29udGFpbmVyLnN0eWxlLmNvbG9yID0gb3B0cy5jb2xvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX2luaXRpYWxpemVUZXh0Q29udGFpbmVyKG9wdHMsIGNvbnRhaW5lciwgdGV4dENvbnRhaW5lcik7XG4gICAgcmV0dXJuIHRleHRDb250YWluZXI7XG59O1xuXG4vLyBHaXZlIGN1c3RvbSBzaGFwZXMgcG9zc2liaWxpdHkgdG8gbW9kaWZ5IHRleHQgZWxlbWVudFxuU2hhcGUucHJvdG90eXBlLl9pbml0aWFsaXplVGV4dENvbnRhaW5lciA9IGZ1bmN0aW9uKG9wdHMsIGNvbnRhaW5lciwgZWxlbWVudCkge1xuICAgIC8vIEJ5IGRlZmF1bHQsIG5vLW9wXG4gICAgLy8gQ3VzdG9tIHNoYXBlcyBzaG91bGQgcmVzcGVjdCBBUEkgb3B0aW9ucywgc3VjaCBhcyB0ZXh0LnN0eWxlXG59O1xuXG5TaGFwZS5wcm90b3R5cGUuX3BhdGhTdHJpbmcgPSBmdW5jdGlvbiBfcGF0aFN0cmluZyhvcHRzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdPdmVycmlkZSB0aGlzIGZ1bmN0aW9uIGZvciBlYWNoIHByb2dyZXNzIGJhcicpO1xufTtcblxuU2hhcGUucHJvdG90eXBlLl90cmFpbFN0cmluZyA9IGZ1bmN0aW9uIF90cmFpbFN0cmluZyhvcHRzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdPdmVycmlkZSB0aGlzIGZ1bmN0aW9uIGZvciBlYWNoIHByb2dyZXNzIGJhcicpO1xufTtcblxuU2hhcGUucHJvdG90eXBlLl93YXJuQ29udGFpbmVyQXNwZWN0UmF0aW8gPSBmdW5jdGlvbiBfd2FybkNvbnRhaW5lckFzcGVjdFJhdGlvKGNvbnRhaW5lcikge1xuICAgIGlmICghdGhpcy5jb250YWluZXJBc3BlY3RSYXRpbykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGNvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShjb250YWluZXIsIG51bGwpO1xuICAgIHZhciB3aWR0aCA9IHBhcnNlRmxvYXQoY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCd3aWR0aCcpLCAxMCk7XG4gICAgdmFyIGhlaWdodCA9IHBhcnNlRmxvYXQoY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKCdoZWlnaHQnKSwgMTApO1xuICAgIGlmICghdXRpbHMuZmxvYXRFcXVhbHModGhpcy5jb250YWluZXJBc3BlY3RSYXRpbywgd2lkdGggLyBoZWlnaHQpKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICdJbmNvcnJlY3QgYXNwZWN0IHJhdGlvIG9mIGNvbnRhaW5lcicsXG4gICAgICAgICAgICAnIycgKyBjb250YWluZXIuaWQsXG4gICAgICAgICAgICAnZGV0ZWN0ZWQ6JyxcbiAgICAgICAgICAgIGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnd2lkdGgnKSArICcod2lkdGgpJyxcbiAgICAgICAgICAgICcvJyxcbiAgICAgICAgICAgIGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnaGVpZ2h0JykgKyAnKGhlaWdodCknLFxuICAgICAgICAgICAgJz0nLFxuICAgICAgICAgICAgd2lkdGggLyBoZWlnaHRcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAnQXNwZWN0IHJhdGlvIG9mIHNob3VsZCBiZScsXG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lckFzcGVjdFJhdGlvXG4gICAgICAgICk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaGFwZTtcbiIsIi8vIFV0aWxpdHkgZnVuY3Rpb25zXG5cbnZhciBQUkVGSVhFUyA9ICdXZWJraXQgTW96IE8gbXMnLnNwbGl0KCcgJyk7XG52YXIgRkxPQVRfQ09NUEFSSVNPTl9FUFNJTE9OID0gMC4wMDE7XG5cbi8vIENvcHkgYWxsIGF0dHJpYnV0ZXMgZnJvbSBzb3VyY2Ugb2JqZWN0IHRvIGRlc3RpbmF0aW9uIG9iamVjdC5cbi8vIGRlc3RpbmF0aW9uIG9iamVjdCBpcyBtdXRhdGVkLlxuZnVuY3Rpb24gZXh0ZW5kKGRlc3RpbmF0aW9uLCBzb3VyY2UsIHJlY3Vyc2l2ZSkge1xuICAgIGRlc3RpbmF0aW9uID0gZGVzdGluYXRpb24gfHwge307XG4gICAgc291cmNlID0gc291cmNlIHx8IHt9O1xuICAgIHJlY3Vyc2l2ZSA9IHJlY3Vyc2l2ZSB8fCBmYWxzZTtcblxuICAgIGZvciAodmFyIGF0dHJOYW1lIGluIHNvdXJjZSkge1xuICAgICAgICBpZiAoc291cmNlLmhhc093blByb3BlcnR5KGF0dHJOYW1lKSkge1xuICAgICAgICAgICAgdmFyIGRlc3RWYWwgPSBkZXN0aW5hdGlvblthdHRyTmFtZV07XG4gICAgICAgICAgICB2YXIgc291cmNlVmFsID0gc291cmNlW2F0dHJOYW1lXTtcbiAgICAgICAgICAgIGlmIChyZWN1cnNpdmUgJiYgaXNPYmplY3QoZGVzdFZhbCkgJiYgaXNPYmplY3Qoc291cmNlVmFsKSkge1xuICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uW2F0dHJOYW1lXSA9IGV4dGVuZChkZXN0VmFsLCBzb3VyY2VWYWwsIHJlY3Vyc2l2ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uW2F0dHJOYW1lXSA9IHNvdXJjZVZhbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZXN0aW5hdGlvbjtcbn1cblxuLy8gUmVuZGVycyB0ZW1wbGF0ZXMgd2l0aCBnaXZlbiB2YXJpYWJsZXMuIFZhcmlhYmxlcyBtdXN0IGJlIHN1cnJvdW5kZWQgd2l0aFxuLy8gYnJhY2VzIHdpdGhvdXQgYW55IHNwYWNlcywgZS5nLiB7dmFyaWFibGV9XG4vLyBBbGwgaW5zdGFuY2VzIG9mIHZhcmlhYmxlIHBsYWNlaG9sZGVycyB3aWxsIGJlIHJlcGxhY2VkIHdpdGggZ2l2ZW4gY29udGVudFxuLy8gRXhhbXBsZTpcbi8vIHJlbmRlcignSGVsbG8sIHttZXNzYWdlfSEnLCB7bWVzc2FnZTogJ3dvcmxkJ30pXG5mdW5jdGlvbiByZW5kZXIodGVtcGxhdGUsIHZhcnMpIHtcbiAgICB2YXIgcmVuZGVyZWQgPSB0ZW1wbGF0ZTtcblxuICAgIGZvciAodmFyIGtleSBpbiB2YXJzKSB7XG4gICAgICAgIGlmICh2YXJzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIHZhciB2YWwgPSB2YXJzW2tleV07XG4gICAgICAgICAgICB2YXIgcmVnRXhwU3RyaW5nID0gJ1xcXFx7JyArIGtleSArICdcXFxcfSc7XG4gICAgICAgICAgICB2YXIgcmVnRXhwID0gbmV3IFJlZ0V4cChyZWdFeHBTdHJpbmcsICdnJyk7XG5cbiAgICAgICAgICAgIHJlbmRlcmVkID0gcmVuZGVyZWQucmVwbGFjZShyZWdFeHAsIHZhbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVuZGVyZWQ7XG59XG5cbmZ1bmN0aW9uIHNldFN0eWxlKGVsZW1lbnQsIHN0eWxlLCB2YWx1ZSkge1xuICAgIHZhciBlbFN0eWxlID0gZWxlbWVudC5zdHlsZTsgIC8vIGNhY2hlIGZvciBwZXJmb3JtYW5jZVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBQUkVGSVhFUy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgcHJlZml4ID0gUFJFRklYRVNbaV07XG4gICAgICAgIGVsU3R5bGVbcHJlZml4ICsgY2FwaXRhbGl6ZShzdHlsZSldID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZWxTdHlsZVtzdHlsZV0gPSB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gc2V0U3R5bGVzKGVsZW1lbnQsIHN0eWxlcykge1xuICAgIGZvckVhY2hPYmplY3Qoc3R5bGVzLCBmdW5jdGlvbihzdHlsZVZhbHVlLCBzdHlsZU5hbWUpIHtcbiAgICAgICAgLy8gQWxsb3cgZGlzYWJsaW5nIHNvbWUgaW5kaXZpZHVhbCBzdHlsZXMgYnkgc2V0dGluZyB0aGVtXG4gICAgICAgIC8vIHRvIG51bGwgb3IgdW5kZWZpbmVkXG4gICAgICAgIGlmIChzdHlsZVZhbHVlID09PSBudWxsIHx8IHN0eWxlVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgc3R5bGUncyB2YWx1ZSBpcyB7cHJlZml4OiB0cnVlLCB2YWx1ZTogJzUwJSd9LFxuICAgICAgICAvLyBTZXQgYWxzbyBicm93c2VyIHByZWZpeGVkIHN0eWxlc1xuICAgICAgICBpZiAoaXNPYmplY3Qoc3R5bGVWYWx1ZSkgJiYgc3R5bGVWYWx1ZS5wcmVmaXggPT09IHRydWUpIHtcbiAgICAgICAgICAgIHNldFN0eWxlKGVsZW1lbnQsIHN0eWxlTmFtZSwgc3R5bGVWYWx1ZS52YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlW3N0eWxlTmFtZV0gPSBzdHlsZVZhbHVlO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGNhcGl0YWxpemUodGV4dCkge1xuICAgIHJldHVybiB0ZXh0LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdGV4dC5zbGljZSgxKTtcbn1cblxuZnVuY3Rpb24gaXNTdHJpbmcob2JqKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBvYmogPT09ICdzdHJpbmcnIHx8IG9iaiBpbnN0YW5jZW9mIFN0cmluZztcbn1cblxuZnVuY3Rpb24gaXNGdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNBcnJheShvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59XG5cbi8vIFJldHVybnMgdHJ1ZSBpZiBgb2JqYCBpcyBvYmplY3QgYXMgaW4ge2E6IDEsIGI6IDJ9LCBub3QgaWYgaXQncyBmdW5jdGlvbiBvclxuLy8gYXJyYXlcbmZ1bmN0aW9uIGlzT2JqZWN0KG9iaikge1xuICAgIGlmIChpc0FycmF5KG9iaikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciB0eXBlID0gdHlwZW9mIG9iajtcbiAgICByZXR1cm4gdHlwZSA9PT0gJ29iamVjdCcgJiYgISFvYmo7XG59XG5cbmZ1bmN0aW9uIGZvckVhY2hPYmplY3Qob2JqZWN0LCBjYWxsYmFjaykge1xuICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAgaWYgKG9iamVjdC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICB2YXIgdmFsID0gb2JqZWN0W2tleV07XG4gICAgICAgICAgICBjYWxsYmFjayh2YWwsIGtleSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZsb2F0RXF1YWxzKGEsIGIpIHtcbiAgICByZXR1cm4gTWF0aC5hYnMoYSAtIGIpIDwgRkxPQVRfQ09NUEFSSVNPTl9FUFNJTE9OO1xufVxuXG4vLyBodHRwczovL2NvZGVyd2FsbC5jb20vcC9ueWdnaHcvZG9uLXQtdXNlLWlubmVyaHRtbC10by1lbXB0eS1kb20tZWxlbWVudHNcbmZ1bmN0aW9uIHJlbW92ZUNoaWxkcmVuKGVsKSB7XG4gICAgd2hpbGUgKGVsLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgZWwucmVtb3ZlQ2hpbGQoZWwuZmlyc3RDaGlsZCk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBleHRlbmQ6IGV4dGVuZCxcbiAgICByZW5kZXI6IHJlbmRlcixcbiAgICBzZXRTdHlsZTogc2V0U3R5bGUsXG4gICAgc2V0U3R5bGVzOiBzZXRTdHlsZXMsXG4gICAgY2FwaXRhbGl6ZTogY2FwaXRhbGl6ZSxcbiAgICBpc1N0cmluZzogaXNTdHJpbmcsXG4gICAgaXNGdW5jdGlvbjogaXNGdW5jdGlvbixcbiAgICBpc09iamVjdDogaXNPYmplY3QsXG4gICAgZm9yRWFjaE9iamVjdDogZm9yRWFjaE9iamVjdCxcbiAgICBmbG9hdEVxdWFsczogZmxvYXRFcXVhbHMsXG4gICAgcmVtb3ZlQ2hpbGRyZW46IHJlbW92ZUNoaWxkcmVuXG59O1xuIiwiLyogc2hpZnR5IC0gdjEuNS4zIC0gMjAxNi0xMS0yOSAtIGh0dHA6Ly9qZXJlbXlja2Fobi5naXRodWIuaW8vc2hpZnR5ICovXG47KGZ1bmN0aW9uICgpIHtcbiAgdmFyIHJvb3QgPSB0aGlzIHx8IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG5cbi8qKlxuICogU2hpZnR5IENvcmVcbiAqIEJ5IEplcmVteSBLYWhuIC0gamVyZW15Y2thaG5AZ21haWwuY29tXG4gKi9cblxudmFyIFR3ZWVuYWJsZSA9IChmdW5jdGlvbiAoKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8vIEFsaWFzZXMgdGhhdCBnZXQgZGVmaW5lZCBsYXRlciBpbiB0aGlzIGZ1bmN0aW9uXG4gIHZhciBmb3JtdWxhO1xuXG4gIC8vIENPTlNUQU5UU1xuICB2YXIgREVGQVVMVF9TQ0hFRFVMRV9GVU5DVElPTjtcbiAgdmFyIERFRkFVTFRfRUFTSU5HID0gJ2xpbmVhcic7XG4gIHZhciBERUZBVUxUX0RVUkFUSU9OID0gNTAwO1xuICB2YXIgVVBEQVRFX1RJTUUgPSAxMDAwIC8gNjA7XG5cbiAgdmFyIF9ub3cgPSBEYXRlLm5vd1xuICAgICAgID8gRGF0ZS5ub3dcbiAgICAgICA6IGZ1bmN0aW9uICgpIHtyZXR1cm4gK25ldyBEYXRlKCk7fTtcblxuICB2YXIgbm93ID0gdHlwZW9mIFNISUZUWV9ERUJVR19OT1cgIT09ICd1bmRlZmluZWQnID8gU0hJRlRZX0RFQlVHX05PVyA6IF9ub3c7XG5cbiAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgLy8gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCkgc2hpbSBieSBQYXVsIElyaXNoIChtb2RpZmllZCBmb3IgU2hpZnR5KVxuICAgIC8vIGh0dHA6Ly9wYXVsaXJpc2guY29tLzIwMTEvcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWZvci1zbWFydC1hbmltYXRpbmcvXG4gICAgREVGQVVMVF9TQ0hFRFVMRV9GVU5DVElPTiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICAgICB8fCB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgICAgfHwgd2luZG93Lm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICAgICB8fCB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICAgICB8fCAod2luZG93Lm1vekNhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgICAgICYmIHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUpXG4gICAgICAgfHwgc2V0VGltZW91dDtcbiAgfSBlbHNlIHtcbiAgICBERUZBVUxUX1NDSEVEVUxFX0ZVTkNUSU9OID0gc2V0VGltZW91dDtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vb3AgKCkge1xuICAgIC8vIE5PT1AhXG4gIH1cblxuICAvKipcbiAgICogSGFuZHkgc2hvcnRjdXQgZm9yIGRvaW5nIGEgZm9yLWluIGxvb3AuIFRoaXMgaXMgbm90IGEgXCJub3JtYWxcIiBlYWNoXG4gICAqIGZ1bmN0aW9uLCBpdCBpcyBvcHRpbWl6ZWQgZm9yIFNoaWZ0eS4gIFRoZSBpdGVyYXRvciBmdW5jdGlvbiBvbmx5IHJlY2VpdmVzXG4gICAqIHRoZSBwcm9wZXJ0eSBuYW1lLCBub3QgdGhlIHZhbHVlLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb24oc3RyaW5nKX0gZm5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIGVhY2ggKG9iaiwgZm4pIHtcbiAgICB2YXIga2V5O1xuICAgIGZvciAoa2V5IGluIG9iaikge1xuICAgICAgaWYgKE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkge1xuICAgICAgICBmbihrZXkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtIGEgc2hhbGxvdyBjb3B5IG9mIE9iamVjdCBwcm9wZXJ0aWVzLlxuICAgKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0T2JqZWN0IFRoZSBvYmplY3QgdG8gY29weSBpbnRvXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzcmNPYmplY3QgVGhlIG9iamVjdCB0byBjb3B5IGZyb21cbiAgICogQHJldHVybiB7T2JqZWN0fSBBIHJlZmVyZW5jZSB0byB0aGUgYXVnbWVudGVkIGB0YXJnZXRPYmpgIE9iamVjdFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gc2hhbGxvd0NvcHkgKHRhcmdldE9iaiwgc3JjT2JqKSB7XG4gICAgZWFjaChzcmNPYmosIGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgICB0YXJnZXRPYmpbcHJvcF0gPSBzcmNPYmpbcHJvcF07XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGFyZ2V0T2JqO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcGllcyBlYWNoIHByb3BlcnR5IGZyb20gc3JjIG9udG8gdGFyZ2V0LCBidXQgb25seSBpZiB0aGUgcHJvcGVydHkgdG9cbiAgICogY29weSB0byB0YXJnZXQgaXMgdW5kZWZpbmVkLlxuICAgKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0IE1pc3NpbmcgcHJvcGVydGllcyBpbiB0aGlzIE9iamVjdCBhcmUgZmlsbGVkIGluXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzcmNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIGRlZmF1bHRzICh0YXJnZXQsIHNyYykge1xuICAgIGVhY2goc3JjLCBmdW5jdGlvbiAocHJvcCkge1xuICAgICAgaWYgKHR5cGVvZiB0YXJnZXRbcHJvcF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHRhcmdldFtwcm9wXSA9IHNyY1twcm9wXTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBpbnRlcnBvbGF0ZWQgdHdlZW4gdmFsdWVzIG9mIGFuIE9iamVjdCBmb3IgYSBnaXZlblxuICAgKiB0aW1lc3RhbXAuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBmb3JQb3NpdGlvbiBUaGUgcG9zaXRpb24gdG8gY29tcHV0ZSB0aGUgc3RhdGUgZm9yLlxuICAgKiBAcGFyYW0ge09iamVjdH0gY3VycmVudFN0YXRlIEN1cnJlbnQgc3RhdGUgcHJvcGVydGllcy5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9yaWdpbmFsU3RhdGU6IFRoZSBvcmlnaW5hbCBzdGF0ZSBwcm9wZXJ0aWVzIHRoZSBPYmplY3QgaXNcbiAgICogdHdlZW5pbmcgZnJvbS5cbiAgICogQHBhcmFtIHtPYmplY3R9IHRhcmdldFN0YXRlOiBUaGUgZGVzdGluYXRpb24gc3RhdGUgcHJvcGVydGllcyB0aGUgT2JqZWN0XG4gICAqIGlzIHR3ZWVuaW5nIHRvLlxuICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb246IFRoZSBsZW5ndGggb2YgdGhlIHR3ZWVuIGluIG1pbGxpc2Vjb25kcy5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHRpbWVzdGFtcDogVGhlIFVOSVggZXBvY2ggdGltZSBhdCB3aGljaCB0aGUgdHdlZW4gYmVnYW4uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlYXNpbmc6IFRoaXMgT2JqZWN0J3Mga2V5cyBtdXN0IGNvcnJlc3BvbmQgdG8gdGhlIGtleXMgaW5cbiAgICogdGFyZ2V0U3RhdGUuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiB0d2VlblByb3BzIChmb3JQb3NpdGlvbiwgY3VycmVudFN0YXRlLCBvcmlnaW5hbFN0YXRlLCB0YXJnZXRTdGF0ZSxcbiAgICBkdXJhdGlvbiwgdGltZXN0YW1wLCBlYXNpbmcpIHtcbiAgICB2YXIgbm9ybWFsaXplZFBvc2l0aW9uID1cbiAgICAgICAgZm9yUG9zaXRpb24gPCB0aW1lc3RhbXAgPyAwIDogKGZvclBvc2l0aW9uIC0gdGltZXN0YW1wKSAvIGR1cmF0aW9uO1xuXG5cbiAgICB2YXIgcHJvcDtcbiAgICB2YXIgZWFzaW5nT2JqZWN0UHJvcDtcbiAgICB2YXIgZWFzaW5nRm47XG4gICAgZm9yIChwcm9wIGluIGN1cnJlbnRTdGF0ZSkge1xuICAgICAgaWYgKGN1cnJlbnRTdGF0ZS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICBlYXNpbmdPYmplY3RQcm9wID0gZWFzaW5nW3Byb3BdO1xuICAgICAgICBlYXNpbmdGbiA9IHR5cGVvZiBlYXNpbmdPYmplY3RQcm9wID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgPyBlYXNpbmdPYmplY3RQcm9wXG4gICAgICAgICAgOiBmb3JtdWxhW2Vhc2luZ09iamVjdFByb3BdO1xuXG4gICAgICAgIGN1cnJlbnRTdGF0ZVtwcm9wXSA9IHR3ZWVuUHJvcChcbiAgICAgICAgICBvcmlnaW5hbFN0YXRlW3Byb3BdLFxuICAgICAgICAgIHRhcmdldFN0YXRlW3Byb3BdLFxuICAgICAgICAgIGVhc2luZ0ZuLFxuICAgICAgICAgIG5vcm1hbGl6ZWRQb3NpdGlvblxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjdXJyZW50U3RhdGU7XG4gIH1cblxuICAvKipcbiAgICogVHdlZW5zIGEgc2luZ2xlIHByb3BlcnR5LlxuICAgKiBAcGFyYW0ge251bWJlcn0gc3RhcnQgVGhlIHZhbHVlIHRoYXQgdGhlIHR3ZWVuIHN0YXJ0ZWQgZnJvbS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGVuZCBUaGUgdmFsdWUgdGhhdCB0aGUgdHdlZW4gc2hvdWxkIGVuZCBhdC5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZWFzaW5nRnVuYyBUaGUgZWFzaW5nIGN1cnZlIHRvIGFwcGx5IHRvIHRoZSB0d2Vlbi5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHBvc2l0aW9uIFRoZSBub3JtYWxpemVkIHBvc2l0aW9uIChiZXR3ZWVuIDAuMCBhbmQgMS4wKSB0b1xuICAgKiBjYWxjdWxhdGUgdGhlIG1pZHBvaW50IG9mICdzdGFydCcgYW5kICdlbmQnIGFnYWluc3QuXG4gICAqIEByZXR1cm4ge251bWJlcn0gVGhlIHR3ZWVuZWQgdmFsdWUuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiB0d2VlblByb3AgKHN0YXJ0LCBlbmQsIGVhc2luZ0Z1bmMsIHBvc2l0aW9uKSB7XG4gICAgcmV0dXJuIHN0YXJ0ICsgKGVuZCAtIHN0YXJ0KSAqIGVhc2luZ0Z1bmMocG9zaXRpb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGxpZXMgYSBmaWx0ZXIgdG8gVHdlZW5hYmxlIGluc3RhbmNlLlxuICAgKiBAcGFyYW0ge1R3ZWVuYWJsZX0gdHdlZW5hYmxlIFRoZSBgVHdlZW5hYmxlYCBpbnN0YW5jZSB0byBjYWxsIHRoZSBmaWx0ZXJcbiAgICogdXBvbi5cbiAgICogQHBhcmFtIHtTdHJpbmd9IGZpbHRlck5hbWUgVGhlIG5hbWUgb2YgdGhlIGZpbHRlciB0byBhcHBseS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIGFwcGx5RmlsdGVyICh0d2VlbmFibGUsIGZpbHRlck5hbWUpIHtcbiAgICB2YXIgZmlsdGVycyA9IFR3ZWVuYWJsZS5wcm90b3R5cGUuZmlsdGVyO1xuICAgIHZhciBhcmdzID0gdHdlZW5hYmxlLl9maWx0ZXJBcmdzO1xuXG4gICAgZWFjaChmaWx0ZXJzLCBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgaWYgKHR5cGVvZiBmaWx0ZXJzW25hbWVdW2ZpbHRlck5hbWVdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBmaWx0ZXJzW25hbWVdW2ZpbHRlck5hbWVdLmFwcGx5KHR3ZWVuYWJsZSwgYXJncyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICB2YXIgdGltZW91dEhhbmRsZXJfZW5kVGltZTtcbiAgdmFyIHRpbWVvdXRIYW5kbGVyX2N1cnJlbnRUaW1lO1xuICB2YXIgdGltZW91dEhhbmRsZXJfaXNFbmRlZDtcbiAgdmFyIHRpbWVvdXRIYW5kbGVyX29mZnNldDtcbiAgLyoqXG4gICAqIEhhbmRsZXMgdGhlIHVwZGF0ZSBsb2dpYyBmb3Igb25lIHN0ZXAgb2YgYSB0d2Vlbi5cbiAgICogQHBhcmFtIHtUd2VlbmFibGV9IHR3ZWVuYWJsZVxuICAgKiBAcGFyYW0ge251bWJlcn0gdGltZXN0YW1wXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBkZWxheVxuICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb25cbiAgICogQHBhcmFtIHtPYmplY3R9IGN1cnJlbnRTdGF0ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gb3JpZ2luYWxTdGF0ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gdGFyZ2V0U3RhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IGVhc2luZ1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9uKE9iamVjdCwgKiwgbnVtYmVyKX0gc3RlcFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9uKEZ1bmN0aW9uLG51bWJlcil9fSBzY2hlZHVsZVxuICAgKiBAcGFyYW0ge251bWJlcj19IG9wdF9jdXJyZW50VGltZU92ZXJyaWRlIE5lZWRlZCBmb3IgYWNjdXJhdGUgdGltZXN0YW1wIGluXG4gICAqIFR3ZWVuYWJsZSNzZWVrLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gdGltZW91dEhhbmRsZXIgKHR3ZWVuYWJsZSwgdGltZXN0YW1wLCBkZWxheSwgZHVyYXRpb24sIGN1cnJlbnRTdGF0ZSxcbiAgICBvcmlnaW5hbFN0YXRlLCB0YXJnZXRTdGF0ZSwgZWFzaW5nLCBzdGVwLCBzY2hlZHVsZSxcbiAgICBvcHRfY3VycmVudFRpbWVPdmVycmlkZSkge1xuXG4gICAgdGltZW91dEhhbmRsZXJfZW5kVGltZSA9IHRpbWVzdGFtcCArIGRlbGF5ICsgZHVyYXRpb247XG5cbiAgICB0aW1lb3V0SGFuZGxlcl9jdXJyZW50VGltZSA9XG4gICAgTWF0aC5taW4ob3B0X2N1cnJlbnRUaW1lT3ZlcnJpZGUgfHwgbm93KCksIHRpbWVvdXRIYW5kbGVyX2VuZFRpbWUpO1xuXG4gICAgdGltZW91dEhhbmRsZXJfaXNFbmRlZCA9XG4gICAgICB0aW1lb3V0SGFuZGxlcl9jdXJyZW50VGltZSA+PSB0aW1lb3V0SGFuZGxlcl9lbmRUaW1lO1xuXG4gICAgdGltZW91dEhhbmRsZXJfb2Zmc2V0ID0gZHVyYXRpb24gLSAoXG4gICAgICB0aW1lb3V0SGFuZGxlcl9lbmRUaW1lIC0gdGltZW91dEhhbmRsZXJfY3VycmVudFRpbWUpO1xuXG4gICAgaWYgKHR3ZWVuYWJsZS5pc1BsYXlpbmcoKSkge1xuICAgICAgaWYgKHRpbWVvdXRIYW5kbGVyX2lzRW5kZWQpIHtcbiAgICAgICAgc3RlcCh0YXJnZXRTdGF0ZSwgdHdlZW5hYmxlLl9hdHRhY2htZW50LCB0aW1lb3V0SGFuZGxlcl9vZmZzZXQpO1xuICAgICAgICB0d2VlbmFibGUuc3RvcCh0cnVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHR3ZWVuYWJsZS5fc2NoZWR1bGVJZCA9XG4gICAgICAgICAgc2NoZWR1bGUodHdlZW5hYmxlLl90aW1lb3V0SGFuZGxlciwgVVBEQVRFX1RJTUUpO1xuXG4gICAgICAgIGFwcGx5RmlsdGVyKHR3ZWVuYWJsZSwgJ2JlZm9yZVR3ZWVuJyk7XG5cbiAgICAgICAgLy8gSWYgdGhlIGFuaW1hdGlvbiBoYXMgbm90IHlldCByZWFjaGVkIHRoZSBzdGFydCBwb2ludCAoZS5nLiwgdGhlcmUgd2FzXG4gICAgICAgIC8vIGRlbGF5IHRoYXQgaGFzIG5vdCB5ZXQgY29tcGxldGVkKSwganVzdCBpbnRlcnBvbGF0ZSB0aGUgc3RhcnRpbmdcbiAgICAgICAgLy8gcG9zaXRpb24gb2YgdGhlIHR3ZWVuLlxuICAgICAgICBpZiAodGltZW91dEhhbmRsZXJfY3VycmVudFRpbWUgPCAodGltZXN0YW1wICsgZGVsYXkpKSB7XG4gICAgICAgICAgdHdlZW5Qcm9wcygxLCBjdXJyZW50U3RhdGUsIG9yaWdpbmFsU3RhdGUsIHRhcmdldFN0YXRlLCAxLCAxLCBlYXNpbmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHR3ZWVuUHJvcHModGltZW91dEhhbmRsZXJfY3VycmVudFRpbWUsIGN1cnJlbnRTdGF0ZSwgb3JpZ2luYWxTdGF0ZSxcbiAgICAgICAgICAgIHRhcmdldFN0YXRlLCBkdXJhdGlvbiwgdGltZXN0YW1wICsgZGVsYXksIGVhc2luZyk7XG4gICAgICAgIH1cblxuICAgICAgICBhcHBseUZpbHRlcih0d2VlbmFibGUsICdhZnRlclR3ZWVuJyk7XG5cbiAgICAgICAgc3RlcChjdXJyZW50U3RhdGUsIHR3ZWVuYWJsZS5fYXR0YWNobWVudCwgdGltZW91dEhhbmRsZXJfb2Zmc2V0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdXNhYmxlIGVhc2luZyBPYmplY3QgZnJvbSBhIHN0cmluZywgYSBmdW5jdGlvbiBvciBhbm90aGVyIGVhc2luZ1xuICAgKiBPYmplY3QuICBJZiBgZWFzaW5nYCBpcyBhbiBPYmplY3QsIHRoZW4gdGhpcyBmdW5jdGlvbiBjbG9uZXMgaXQgYW5kIGZpbGxzXG4gICAqIGluIHRoZSBtaXNzaW5nIHByb3BlcnRpZXMgd2l0aCBgXCJsaW5lYXJcImAuXG4gICAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmd8RnVuY3Rpb24+fSBmcm9tVHdlZW5QYXJhbXNcbiAgICogQHBhcmFtIHtPYmplY3R8c3RyaW5nfEZ1bmN0aW9ufSBlYXNpbmdcbiAgICogQHJldHVybiB7T2JqZWN0LjxzdHJpbmd8RnVuY3Rpb24+fVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gY29tcG9zZUVhc2luZ09iamVjdCAoZnJvbVR3ZWVuUGFyYW1zLCBlYXNpbmcpIHtcbiAgICB2YXIgY29tcG9zZWRFYXNpbmcgPSB7fTtcbiAgICB2YXIgdHlwZW9mRWFzaW5nID0gdHlwZW9mIGVhc2luZztcblxuICAgIGlmICh0eXBlb2ZFYXNpbmcgPT09ICdzdHJpbmcnIHx8IHR5cGVvZkVhc2luZyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZWFjaChmcm9tVHdlZW5QYXJhbXMsIGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgICAgIGNvbXBvc2VkRWFzaW5nW3Byb3BdID0gZWFzaW5nO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVhY2goZnJvbVR3ZWVuUGFyYW1zLCBmdW5jdGlvbiAocHJvcCkge1xuICAgICAgICBpZiAoIWNvbXBvc2VkRWFzaW5nW3Byb3BdKSB7XG4gICAgICAgICAgY29tcG9zZWRFYXNpbmdbcHJvcF0gPSBlYXNpbmdbcHJvcF0gfHwgREVGQVVMVF9FQVNJTkc7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBjb21wb3NlZEVhc2luZztcbiAgfVxuXG4gIC8qKlxuICAgKiBUd2VlbmFibGUgY29uc3RydWN0b3IuXG4gICAqIEBjbGFzcyBUd2VlbmFibGVcbiAgICogQHBhcmFtIHtPYmplY3Q9fSBvcHRfaW5pdGlhbFN0YXRlIFRoZSB2YWx1ZXMgdGhhdCB0aGUgaW5pdGlhbCB0d2VlbiBzaG91bGRcbiAgICogc3RhcnQgYXQgaWYgYSBgZnJvbWAgb2JqZWN0IGlzIG5vdCBwcm92aWRlZCB0byBge3sjY3Jvc3NMaW5rXG4gICAqIFwiVHdlZW5hYmxlL3R3ZWVuOm1ldGhvZFwifX17ey9jcm9zc0xpbmt9fWAgb3IgYHt7I2Nyb3NzTGlua1xuICAgKiBcIlR3ZWVuYWJsZS9zZXRDb25maWc6bWV0aG9kXCJ9fXt7L2Nyb3NzTGlua319YC5cbiAgICogQHBhcmFtIHtPYmplY3Q9fSBvcHRfY29uZmlnIENvbmZpZ3VyYXRpb24gb2JqZWN0IHRvIGJlIHBhc3NlZCB0b1xuICAgKiBge3sjY3Jvc3NMaW5rIFwiVHdlZW5hYmxlL3NldENvbmZpZzptZXRob2RcIn19e3svY3Jvc3NMaW5rfX1gLlxuICAgKiBAbW9kdWxlIFR3ZWVuYWJsZVxuICAgKiBAY29uc3RydWN0b3JcbiAgICovXG4gIGZ1bmN0aW9uIFR3ZWVuYWJsZSAob3B0X2luaXRpYWxTdGF0ZSwgb3B0X2NvbmZpZykge1xuICAgIHRoaXMuX2N1cnJlbnRTdGF0ZSA9IG9wdF9pbml0aWFsU3RhdGUgfHwge307XG4gICAgdGhpcy5fY29uZmlndXJlZCA9IGZhbHNlO1xuICAgIHRoaXMuX3NjaGVkdWxlRnVuY3Rpb24gPSBERUZBVUxUX1NDSEVEVUxFX0ZVTkNUSU9OO1xuXG4gICAgLy8gVG8gcHJldmVudCB1bm5lY2Vzc2FyeSBjYWxscyB0byBzZXRDb25maWcgZG8gbm90IHNldCBkZWZhdWx0XG4gICAgLy8gY29uZmlndXJhdGlvbiBoZXJlLiAgT25seSBzZXQgZGVmYXVsdCBjb25maWd1cmF0aW9uIGltbWVkaWF0ZWx5IGJlZm9yZVxuICAgIC8vIHR3ZWVuaW5nIGlmIG5vbmUgaGFzIGJlZW4gc2V0LlxuICAgIGlmICh0eXBlb2Ygb3B0X2NvbmZpZyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMuc2V0Q29uZmlnKG9wdF9jb25maWcpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maWd1cmUgYW5kIHN0YXJ0IGEgdHdlZW4uXG4gICAqIEBtZXRob2QgdHdlZW5cbiAgICogQHBhcmFtIHtPYmplY3Q9fSBvcHRfY29uZmlnIENvbmZpZ3VyYXRpb24gb2JqZWN0IHRvIGJlIHBhc3NlZCB0b1xuICAgKiBge3sjY3Jvc3NMaW5rIFwiVHdlZW5hYmxlL3NldENvbmZpZzptZXRob2RcIn19e3svY3Jvc3NMaW5rfX1gLlxuICAgKiBAY2hhaW5hYmxlXG4gICAqL1xuICBUd2VlbmFibGUucHJvdG90eXBlLnR3ZWVuID0gZnVuY3Rpb24gKG9wdF9jb25maWcpIHtcbiAgICBpZiAodGhpcy5faXNUd2VlbmluZykge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLy8gT25seSBzZXQgZGVmYXVsdCBjb25maWcgaWYgbm8gY29uZmlndXJhdGlvbiBoYXMgYmVlbiBzZXQgcHJldmlvdXNseSBhbmRcbiAgICAvLyBub25lIGlzIHByb3ZpZGVkIG5vdy5cbiAgICBpZiAob3B0X2NvbmZpZyAhPT0gdW5kZWZpbmVkIHx8ICF0aGlzLl9jb25maWd1cmVkKSB7XG4gICAgICB0aGlzLnNldENvbmZpZyhvcHRfY29uZmlnKTtcbiAgICB9XG5cbiAgICB0aGlzLl90aW1lc3RhbXAgPSBub3coKTtcbiAgICB0aGlzLl9zdGFydCh0aGlzLmdldCgpLCB0aGlzLl9hdHRhY2htZW50KTtcbiAgICByZXR1cm4gdGhpcy5yZXN1bWUoKTtcbiAgfTtcblxuICAvKipcbiAgICogQ29uZmlndXJlIGEgdHdlZW4gdGhhdCB3aWxsIHN0YXJ0IGF0IHNvbWUgcG9pbnQgaW4gdGhlIGZ1dHVyZS5cbiAgICpcbiAgICogQG1ldGhvZCBzZXRDb25maWdcbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbmZpZyBUaGUgZm9sbG93aW5nIHZhbHVlcyBhcmUgdmFsaWQ6XG4gICAqIC0gX19mcm9tX18gKF9PYmplY3Q9Xyk6IFN0YXJ0aW5nIHBvc2l0aW9uLiAgSWYgb21pdHRlZCwgYHt7I2Nyb3NzTGlua1xuICAgKiAgIFwiVHdlZW5hYmxlL2dldDptZXRob2RcIn19Z2V0KCl7ey9jcm9zc0xpbmt9fWAgaXMgdXNlZC5cbiAgICogLSBfX3RvX18gKF9PYmplY3Q9Xyk6IEVuZGluZyBwb3NpdGlvbi5cbiAgICogLSBfX2R1cmF0aW9uX18gKF9udW1iZXI9Xyk6IEhvdyBtYW55IG1pbGxpc2Vjb25kcyB0byBhbmltYXRlIGZvci5cbiAgICogLSBfX2RlbGF5X18gKF9kZWxheT1fKTogSG93IG1hbnkgbWlsbGlzZWNvbmRzIHRvIHdhaXQgYmVmb3JlIHN0YXJ0aW5nIHRoZVxuICAgKiAgIHR3ZWVuLlxuICAgKiAtIF9fc3RhcnRfXyAoX0Z1bmN0aW9uKE9iamVjdCwgKilfKTogRnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIHRoZSB0d2VlblxuICAgKiAgIGJlZ2lucy4gIFJlY2VpdmVzIHRoZSBzdGF0ZSBvZiB0aGUgdHdlZW4gYXMgdGhlIGZpcnN0IHBhcmFtZXRlciBhbmRcbiAgICogICBgYXR0YWNobWVudGAgYXMgdGhlIHNlY29uZCBwYXJhbWV0ZXIuXG4gICAqIC0gX19zdGVwX18gKF9GdW5jdGlvbihPYmplY3QsICosIG51bWJlcilfKTogRnVuY3Rpb24gdG8gZXhlY3V0ZSBvbiBldmVyeVxuICAgKiAgIHRpY2suICBSZWNlaXZlcyBge3sjY3Jvc3NMaW5rXG4gICAqICAgXCJUd2VlbmFibGUvZ2V0Om1ldGhvZFwifX1nZXQoKXt7L2Nyb3NzTGlua319YCBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyLFxuICAgKiAgIGBhdHRhY2htZW50YCBhcyB0aGUgc2Vjb25kIHBhcmFtZXRlciwgYW5kIHRoZSB0aW1lIGVsYXBzZWQgc2luY2UgdGhlXG4gICAqICAgc3RhcnQgb2YgdGhlIHR3ZWVuIGFzIHRoZSB0aGlyZC4gVGhpcyBmdW5jdGlvbiBpcyBub3QgY2FsbGVkIG9uIHRoZVxuICAgKiAgIGZpbmFsIHN0ZXAgb2YgdGhlIGFuaW1hdGlvbiwgYnV0IGBmaW5pc2hgIGlzLlxuICAgKiAtIF9fZmluaXNoX18gKF9GdW5jdGlvbihPYmplY3QsICopXyk6IEZ1bmN0aW9uIHRvIGV4ZWN1dGUgdXBvbiB0d2VlblxuICAgKiAgIGNvbXBsZXRpb24uICBSZWNlaXZlcyB0aGUgc3RhdGUgb2YgdGhlIHR3ZWVuIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXIgYW5kXG4gICAqICAgYGF0dGFjaG1lbnRgIGFzIHRoZSBzZWNvbmQgcGFyYW1ldGVyLlxuICAgKiAtIF9fZWFzaW5nX18gKF9PYmplY3QuPHN0cmluZ3xGdW5jdGlvbj58c3RyaW5nfEZ1bmN0aW9uPV8pOiBFYXNpbmcgY3VydmVcbiAgICogICBuYW1lKHMpIG9yIGZ1bmN0aW9uKHMpIHRvIHVzZSBmb3IgdGhlIHR3ZWVuLlxuICAgKiAtIF9fYXR0YWNobWVudF9fIChfKl8pOiBDYWNoZWQgdmFsdWUgdGhhdCBpcyBwYXNzZWQgdG8gdGhlXG4gICAqICAgYHN0ZXBgL2BzdGFydGAvYGZpbmlzaGAgbWV0aG9kcy5cbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgVHdlZW5hYmxlLnByb3RvdHlwZS5zZXRDb25maWcgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICAgIHRoaXMuX2NvbmZpZ3VyZWQgPSB0cnVlO1xuXG4gICAgLy8gQXR0YWNoIHNvbWV0aGluZyB0byB0aGlzIFR3ZWVuYWJsZSBpbnN0YW5jZSAoZS5nLjogYSBET00gZWxlbWVudCwgYW5cbiAgICAvLyBvYmplY3QsIGEgc3RyaW5nLCBldGMuKTtcbiAgICB0aGlzLl9hdHRhY2htZW50ID0gY29uZmlnLmF0dGFjaG1lbnQ7XG5cbiAgICAvLyBJbml0IHRoZSBpbnRlcm5hbCBzdGF0ZVxuICAgIHRoaXMuX3BhdXNlZEF0VGltZSA9IG51bGw7XG4gICAgdGhpcy5fc2NoZWR1bGVJZCA9IG51bGw7XG4gICAgdGhpcy5fZGVsYXkgPSBjb25maWcuZGVsYXkgfHwgMDtcbiAgICB0aGlzLl9zdGFydCA9IGNvbmZpZy5zdGFydCB8fCBub29wO1xuICAgIHRoaXMuX3N0ZXAgPSBjb25maWcuc3RlcCB8fCBub29wO1xuICAgIHRoaXMuX2ZpbmlzaCA9IGNvbmZpZy5maW5pc2ggfHwgbm9vcDtcbiAgICB0aGlzLl9kdXJhdGlvbiA9IGNvbmZpZy5kdXJhdGlvbiB8fCBERUZBVUxUX0RVUkFUSU9OO1xuICAgIHRoaXMuX2N1cnJlbnRTdGF0ZSA9IHNoYWxsb3dDb3B5KHt9LCBjb25maWcuZnJvbSB8fCB0aGlzLmdldCgpKTtcbiAgICB0aGlzLl9vcmlnaW5hbFN0YXRlID0gdGhpcy5nZXQoKTtcbiAgICB0aGlzLl90YXJnZXRTdGF0ZSA9IHNoYWxsb3dDb3B5KHt9LCBjb25maWcudG8gfHwgdGhpcy5nZXQoKSk7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5fdGltZW91dEhhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB0aW1lb3V0SGFuZGxlcihzZWxmLFxuICAgICAgICBzZWxmLl90aW1lc3RhbXAsXG4gICAgICAgIHNlbGYuX2RlbGF5LFxuICAgICAgICBzZWxmLl9kdXJhdGlvbixcbiAgICAgICAgc2VsZi5fY3VycmVudFN0YXRlLFxuICAgICAgICBzZWxmLl9vcmlnaW5hbFN0YXRlLFxuICAgICAgICBzZWxmLl90YXJnZXRTdGF0ZSxcbiAgICAgICAgc2VsZi5fZWFzaW5nLFxuICAgICAgICBzZWxmLl9zdGVwLFxuICAgICAgICBzZWxmLl9zY2hlZHVsZUZ1bmN0aW9uXG4gICAgICApO1xuICAgIH07XG5cbiAgICAvLyBBbGlhc2VzIHVzZWQgYmVsb3dcbiAgICB2YXIgY3VycmVudFN0YXRlID0gdGhpcy5fY3VycmVudFN0YXRlO1xuICAgIHZhciB0YXJnZXRTdGF0ZSA9IHRoaXMuX3RhcmdldFN0YXRlO1xuXG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlcmUgaXMgYWx3YXlzIHNvbWV0aGluZyB0byB0d2VlbiB0by5cbiAgICBkZWZhdWx0cyh0YXJnZXRTdGF0ZSwgY3VycmVudFN0YXRlKTtcblxuICAgIHRoaXMuX2Vhc2luZyA9IGNvbXBvc2VFYXNpbmdPYmplY3QoXG4gICAgICBjdXJyZW50U3RhdGUsIGNvbmZpZy5lYXNpbmcgfHwgREVGQVVMVF9FQVNJTkcpO1xuXG4gICAgdGhpcy5fZmlsdGVyQXJncyA9XG4gICAgICBbY3VycmVudFN0YXRlLCB0aGlzLl9vcmlnaW5hbFN0YXRlLCB0YXJnZXRTdGF0ZSwgdGhpcy5fZWFzaW5nXTtcblxuICAgIGFwcGx5RmlsdGVyKHRoaXMsICd0d2VlbkNyZWF0ZWQnKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogQG1ldGhvZCBnZXRcbiAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgY3VycmVudCBzdGF0ZS5cbiAgICovXG4gIFR3ZWVuYWJsZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBzaGFsbG93Q29weSh7fSwgdGhpcy5fY3VycmVudFN0YXRlKTtcbiAgfTtcblxuICAvKipcbiAgICogQG1ldGhvZCBzZXRcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0YXRlIFRoZSBjdXJyZW50IHN0YXRlLlxuICAgKi9cbiAgVHdlZW5hYmxlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICB0aGlzLl9jdXJyZW50U3RhdGUgPSBzdGF0ZTtcbiAgfTtcblxuICAvKipcbiAgICogUGF1c2UgYSB0d2Vlbi4gIFBhdXNlZCB0d2VlbnMgY2FuIGJlIHJlc3VtZWQgZnJvbSB0aGUgcG9pbnQgYXQgd2hpY2ggdGhleVxuICAgKiB3ZXJlIHBhdXNlZC4gIFRoaXMgaXMgZGlmZmVyZW50IGZyb20gYHt7I2Nyb3NzTGlua1xuICAgKiBcIlR3ZWVuYWJsZS9zdG9wOm1ldGhvZFwifX17ey9jcm9zc0xpbmt9fWAsIGFzIHRoYXQgbWV0aG9kXG4gICAqIGNhdXNlcyBhIHR3ZWVuIHRvIHN0YXJ0IG92ZXIgd2hlbiBpdCBpcyByZXN1bWVkLlxuICAgKiBAbWV0aG9kIHBhdXNlXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIFR3ZWVuYWJsZS5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fcGF1c2VkQXRUaW1lID0gbm93KCk7XG4gICAgdGhpcy5faXNQYXVzZWQgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZXN1bWUgYSBwYXVzZWQgdHdlZW4uXG4gICAqIEBtZXRob2QgcmVzdW1lXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIFR3ZWVuYWJsZS5wcm90b3R5cGUucmVzdW1lID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9pc1BhdXNlZCkge1xuICAgICAgdGhpcy5fdGltZXN0YW1wICs9IG5vdygpIC0gdGhpcy5fcGF1c2VkQXRUaW1lO1xuICAgIH1cblxuICAgIHRoaXMuX2lzUGF1c2VkID0gZmFsc2U7XG4gICAgdGhpcy5faXNUd2VlbmluZyA9IHRydWU7XG5cbiAgICB0aGlzLl90aW1lb3V0SGFuZGxlcigpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIE1vdmUgdGhlIHN0YXRlIG9mIHRoZSBhbmltYXRpb24gdG8gYSBzcGVjaWZpYyBwb2ludCBpbiB0aGUgdHdlZW4nc1xuICAgKiB0aW1lbGluZS4gIElmIHRoZSBhbmltYXRpb24gaXMgbm90IHJ1bm5pbmcsIHRoaXMgd2lsbCBjYXVzZSB0aGUgYHN0ZXBgXG4gICAqIGhhbmRsZXJzIHRvIGJlIGNhbGxlZC5cbiAgICogQG1ldGhvZCBzZWVrXG4gICAqIEBwYXJhbSB7bWlsbGlzZWNvbmR9IG1pbGxpc2Vjb25kIFRoZSBtaWxsaXNlY29uZCBvZiB0aGUgYW5pbWF0aW9uIHRvIHNlZWtcbiAgICogdG8uICBUaGlzIG11c3Qgbm90IGJlIGxlc3MgdGhhbiBgMGAuXG4gICAqIEBjaGFpbmFibGVcbiAgICovXG4gIFR3ZWVuYWJsZS5wcm90b3R5cGUuc2VlayA9IGZ1bmN0aW9uIChtaWxsaXNlY29uZCkge1xuICAgIG1pbGxpc2Vjb25kID0gTWF0aC5tYXgobWlsbGlzZWNvbmQsIDApO1xuICAgIHZhciBjdXJyZW50VGltZSA9IG5vdygpO1xuXG4gICAgaWYgKCh0aGlzLl90aW1lc3RhbXAgKyBtaWxsaXNlY29uZCkgPT09IDApIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHRoaXMuX3RpbWVzdGFtcCA9IGN1cnJlbnRUaW1lIC0gbWlsbGlzZWNvbmQ7XG5cbiAgICBpZiAoIXRoaXMuaXNQbGF5aW5nKCkpIHtcbiAgICAgIHRoaXMuX2lzVHdlZW5pbmcgPSB0cnVlO1xuICAgICAgdGhpcy5faXNQYXVzZWQgPSBmYWxzZTtcblxuICAgICAgLy8gSWYgdGhlIGFuaW1hdGlvbiBpcyBub3QgcnVubmluZywgY2FsbCB0aW1lb3V0SGFuZGxlciB0byBtYWtlIHN1cmUgdGhhdFxuICAgICAgLy8gYW55IHN0ZXAgaGFuZGxlcnMgYXJlIHJ1bi5cbiAgICAgIHRpbWVvdXRIYW5kbGVyKHRoaXMsXG4gICAgICAgIHRoaXMuX3RpbWVzdGFtcCxcbiAgICAgICAgdGhpcy5fZGVsYXksXG4gICAgICAgIHRoaXMuX2R1cmF0aW9uLFxuICAgICAgICB0aGlzLl9jdXJyZW50U3RhdGUsXG4gICAgICAgIHRoaXMuX29yaWdpbmFsU3RhdGUsXG4gICAgICAgIHRoaXMuX3RhcmdldFN0YXRlLFxuICAgICAgICB0aGlzLl9lYXNpbmcsXG4gICAgICAgIHRoaXMuX3N0ZXAsXG4gICAgICAgIHRoaXMuX3NjaGVkdWxlRnVuY3Rpb24sXG4gICAgICAgIGN1cnJlbnRUaW1lXG4gICAgICApO1xuXG4gICAgICB0aGlzLnBhdXNlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIFN0b3BzIGFuZCBjYW5jZWxzIGEgdHdlZW4uXG4gICAqIEBwYXJhbSB7Ym9vbGVhbj19IGdvdG9FbmQgSWYgYGZhbHNlYCBvciBvbWl0dGVkLCB0aGUgdHdlZW4ganVzdCBzdG9wcyBhdFxuICAgKiBpdHMgY3VycmVudCBzdGF0ZSwgYW5kIHRoZSBgZmluaXNoYCBoYW5kbGVyIGlzIG5vdCBpbnZva2VkLiAgSWYgYHRydWVgLFxuICAgKiB0aGUgdHdlZW5lZCBvYmplY3QncyB2YWx1ZXMgYXJlIGluc3RhbnRseSBzZXQgdG8gdGhlIHRhcmdldCB2YWx1ZXMsIGFuZFxuICAgKiBgZmluaXNoYCBpcyBpbnZva2VkLlxuICAgKiBAbWV0aG9kIHN0b3BcbiAgICogQGNoYWluYWJsZVxuICAgKi9cbiAgVHdlZW5hYmxlLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKGdvdG9FbmQpIHtcbiAgICB0aGlzLl9pc1R3ZWVuaW5nID0gZmFsc2U7XG4gICAgdGhpcy5faXNQYXVzZWQgPSBmYWxzZTtcbiAgICB0aGlzLl90aW1lb3V0SGFuZGxlciA9IG5vb3A7XG5cbiAgICAocm9vdC5jYW5jZWxBbmltYXRpb25GcmFtZSAgICAgICAgICAgIHx8XG4gICAgcm9vdC53ZWJraXRDYW5jZWxBbmltYXRpb25GcmFtZSAgICAgfHxcbiAgICByb290Lm9DYW5jZWxBbmltYXRpb25GcmFtZSAgICAgICAgICB8fFxuICAgIHJvb3QubXNDYW5jZWxBbmltYXRpb25GcmFtZSAgICAgICAgIHx8XG4gICAgcm9vdC5tb3pDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICByb290LmNsZWFyVGltZW91dCkodGhpcy5fc2NoZWR1bGVJZCk7XG5cbiAgICBpZiAoZ290b0VuZCkge1xuICAgICAgYXBwbHlGaWx0ZXIodGhpcywgJ2JlZm9yZVR3ZWVuJyk7XG4gICAgICB0d2VlblByb3BzKFxuICAgICAgICAxLFxuICAgICAgICB0aGlzLl9jdXJyZW50U3RhdGUsXG4gICAgICAgIHRoaXMuX29yaWdpbmFsU3RhdGUsXG4gICAgICAgIHRoaXMuX3RhcmdldFN0YXRlLFxuICAgICAgICAxLFxuICAgICAgICAwLFxuICAgICAgICB0aGlzLl9lYXNpbmdcbiAgICAgICk7XG4gICAgICBhcHBseUZpbHRlcih0aGlzLCAnYWZ0ZXJUd2VlbicpO1xuICAgICAgYXBwbHlGaWx0ZXIodGhpcywgJ2FmdGVyVHdlZW5FbmQnKTtcbiAgICAgIHRoaXMuX2ZpbmlzaC5jYWxsKHRoaXMsIHRoaXMuX2N1cnJlbnRTdGF0ZSwgdGhpcy5fYXR0YWNobWVudCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIEBtZXRob2QgaXNQbGF5aW5nXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgb3Igbm90IGEgdHdlZW4gaXMgcnVubmluZy5cbiAgICovXG4gIFR3ZWVuYWJsZS5wcm90b3R5cGUuaXNQbGF5aW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9pc1R3ZWVuaW5nICYmICF0aGlzLl9pc1BhdXNlZDtcbiAgfTtcblxuICAvKipcbiAgICogU2V0IGEgY3VzdG9tIHNjaGVkdWxlIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBJZiBhIGN1c3RvbSBmdW5jdGlvbiBpcyBub3Qgc2V0LFxuICAgKiBbYHJlcXVlc3RBbmltYXRpb25GcmFtZWBdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS93aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKVxuICAgKiBpcyB1c2VkIGlmIGF2YWlsYWJsZSwgb3RoZXJ3aXNlXG4gICAqIFtgc2V0VGltZW91dGBdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XaW5kb3cuc2V0VGltZW91dClcbiAgICogaXMgdXNlZC5cbiAgICogQG1ldGhvZCBzZXRTY2hlZHVsZUZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb24oRnVuY3Rpb24sbnVtYmVyKX0gc2NoZWR1bGVGdW5jdGlvbiBUaGUgZnVuY3Rpb24gdG8gYmVcbiAgICogdXNlZCB0byBzY2hlZHVsZSB0aGUgbmV4dCBmcmFtZSB0byBiZSByZW5kZXJlZC5cbiAgICovXG4gIFR3ZWVuYWJsZS5wcm90b3R5cGUuc2V0U2NoZWR1bGVGdW5jdGlvbiA9IGZ1bmN0aW9uIChzY2hlZHVsZUZ1bmN0aW9uKSB7XG4gICAgdGhpcy5fc2NoZWR1bGVGdW5jdGlvbiA9IHNjaGVkdWxlRnVuY3Rpb247XG4gIH07XG5cbiAgLyoqXG4gICAqIGBkZWxldGVgIGFsbCBcIm93blwiIHByb3BlcnRpZXMuICBDYWxsIHRoaXMgd2hlbiB0aGUgYFR3ZWVuYWJsZWAgaW5zdGFuY2VcbiAgICogaXMgbm8gbG9uZ2VyIG5lZWRlZCB0byBmcmVlIG1lbW9yeS5cbiAgICogQG1ldGhvZCBkaXNwb3NlXG4gICAqL1xuICBUd2VlbmFibGUucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHByb3A7XG4gICAgZm9yIChwcm9wIGluIHRoaXMpIHtcbiAgICAgIGlmICh0aGlzLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzW3Byb3BdO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogRmlsdGVycyBhcmUgdXNlZCBmb3IgdHJhbnNmb3JtaW5nIHRoZSBwcm9wZXJ0aWVzIG9mIGEgdHdlZW4gYXQgdmFyaW91c1xuICAgKiBwb2ludHMgaW4gYSBUd2VlbmFibGUncyBsaWZlIGN5Y2xlLiAgU2VlIHRoZSBSRUFETUUgZm9yIG1vcmUgaW5mbyBvbiB0aGlzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgVHdlZW5hYmxlLnByb3RvdHlwZS5maWx0ZXIgPSB7fTtcblxuICAvKipcbiAgICogVGhpcyBvYmplY3QgY29udGFpbnMgYWxsIG9mIHRoZSB0d2VlbnMgYXZhaWxhYmxlIHRvIFNoaWZ0eS4gIEl0IGlzXG4gICAqIGV4dGVuc2libGUgLSBzaW1wbHkgYXR0YWNoIHByb3BlcnRpZXMgdG8gdGhlIGBUd2VlbmFibGUucHJvdG90eXBlLmZvcm11bGFgXG4gICAqIE9iamVjdCBmb2xsb3dpbmcgdGhlIHNhbWUgZm9ybWF0IGFzIGBsaW5lYXJgLlxuICAgKlxuICAgKiBgcG9zYCBzaG91bGQgYmUgYSBub3JtYWxpemVkIGBudW1iZXJgIChiZXR3ZWVuIDAgYW5kIDEpLlxuICAgKiBAcHJvcGVydHkgZm9ybXVsYVxuICAgKiBAdHlwZSB7T2JqZWN0KGZ1bmN0aW9uKX1cbiAgICovXG4gIFR3ZWVuYWJsZS5wcm90b3R5cGUuZm9ybXVsYSA9IHtcbiAgICBsaW5lYXI6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIHJldHVybiBwb3M7XG4gICAgfVxuICB9O1xuXG4gIGZvcm11bGEgPSBUd2VlbmFibGUucHJvdG90eXBlLmZvcm11bGE7XG5cbiAgc2hhbGxvd0NvcHkoVHdlZW5hYmxlLCB7XG4gICAgJ25vdyc6IG5vd1xuICAgICwnZWFjaCc6IGVhY2hcbiAgICAsJ3R3ZWVuUHJvcHMnOiB0d2VlblByb3BzXG4gICAgLCd0d2VlblByb3AnOiB0d2VlblByb3BcbiAgICAsJ2FwcGx5RmlsdGVyJzogYXBwbHlGaWx0ZXJcbiAgICAsJ3NoYWxsb3dDb3B5Jzogc2hhbGxvd0NvcHlcbiAgICAsJ2RlZmF1bHRzJzogZGVmYXVsdHNcbiAgICAsJ2NvbXBvc2VFYXNpbmdPYmplY3QnOiBjb21wb3NlRWFzaW5nT2JqZWN0XG4gIH0pO1xuXG4gIC8vIGByb290YCBpcyBwcm92aWRlZCBpbiB0aGUgaW50cm8vb3V0cm8gZmlsZXMuXG5cbiAgLy8gQSBob29rIHVzZWQgZm9yIHVuaXQgdGVzdGluZy5cbiAgaWYgKHR5cGVvZiBTSElGVFlfREVCVUdfTk9XID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcm9vdC50aW1lb3V0SGFuZGxlciA9IHRpbWVvdXRIYW5kbGVyO1xuICB9XG5cbiAgLy8gQm9vdHN0cmFwIFR3ZWVuYWJsZSBhcHByb3ByaWF0ZWx5IGZvciB0aGUgZW52aXJvbm1lbnQuXG4gIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gVHdlZW5hYmxlO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZShmdW5jdGlvbiAoKSB7cmV0dXJuIFR3ZWVuYWJsZTt9KTtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygcm9vdC5Ud2VlbmFibGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgLy8gQnJvd3NlcjogTWFrZSBgVHdlZW5hYmxlYCBnbG9iYWxseSBhY2Nlc3NpYmxlLlxuICAgIHJvb3QuVHdlZW5hYmxlID0gVHdlZW5hYmxlO1xuICB9XG5cbiAgcmV0dXJuIFR3ZWVuYWJsZTtcblxufSAoKSk7XG5cbi8qIVxuICogQWxsIGVxdWF0aW9ucyBhcmUgYWRhcHRlZCBmcm9tIFRob21hcyBGdWNocydcbiAqIFtTY3JpcHR5Ml0oaHR0cHM6Ly9naXRodWIuY29tL21hZHJvYmJ5L3NjcmlwdHkyL2Jsb2IvbWFzdGVyL3NyYy9lZmZlY3RzL3RyYW5zaXRpb25zL3Blbm5lci5qcykuXG4gKlxuICogQmFzZWQgb24gRWFzaW5nIEVxdWF0aW9ucyAoYykgMjAwMyBbUm9iZXJ0XG4gKiBQZW5uZXJdKGh0dHA6Ly93d3cucm9iZXJ0cGVubmVyLmNvbS8pLCBhbGwgcmlnaHRzIHJlc2VydmVkLiBUaGlzIHdvcmsgaXNcbiAqIFtzdWJqZWN0IHRvIHRlcm1zXShodHRwOi8vd3d3LnJvYmVydHBlbm5lci5jb20vZWFzaW5nX3Rlcm1zX29mX3VzZS5odG1sKS5cbiAqL1xuXG4vKiFcbiAqICBURVJNUyBPRiBVU0UgLSBFQVNJTkcgRVFVQVRJT05TXG4gKiAgT3BlbiBzb3VyY2UgdW5kZXIgdGhlIEJTRCBMaWNlbnNlLlxuICogIEVhc2luZyBFcXVhdGlvbnMgKGMpIDIwMDMgUm9iZXJ0IFBlbm5lciwgYWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqL1xuXG47KGZ1bmN0aW9uICgpIHtcblxuICBUd2VlbmFibGUuc2hhbGxvd0NvcHkoVHdlZW5hYmxlLnByb3RvdHlwZS5mb3JtdWxhLCB7XG4gICAgZWFzZUluUXVhZDogZnVuY3Rpb24gKHBvcykge1xuICAgICAgcmV0dXJuIE1hdGgucG93KHBvcywgMik7XG4gICAgfSxcblxuICAgIGVhc2VPdXRRdWFkOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICByZXR1cm4gLShNYXRoLnBvdygocG9zIC0gMSksIDIpIC0gMSk7XG4gICAgfSxcblxuICAgIGVhc2VJbk91dFF1YWQ6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIGlmICgocG9zIC89IDAuNSkgPCAxKSB7cmV0dXJuIDAuNSAqIE1hdGgucG93KHBvcywyKTt9XG4gICAgICByZXR1cm4gLTAuNSAqICgocG9zIC09IDIpICogcG9zIC0gMik7XG4gICAgfSxcblxuICAgIGVhc2VJbkN1YmljOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICByZXR1cm4gTWF0aC5wb3cocG9zLCAzKTtcbiAgICB9LFxuXG4gICAgZWFzZU91dEN1YmljOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICByZXR1cm4gKE1hdGgucG93KChwb3MgLSAxKSwgMykgKyAxKTtcbiAgICB9LFxuXG4gICAgZWFzZUluT3V0Q3ViaWM6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIGlmICgocG9zIC89IDAuNSkgPCAxKSB7cmV0dXJuIDAuNSAqIE1hdGgucG93KHBvcywzKTt9XG4gICAgICByZXR1cm4gMC41ICogKE1hdGgucG93KChwb3MgLSAyKSwzKSArIDIpO1xuICAgIH0sXG5cbiAgICBlYXNlSW5RdWFydDogZnVuY3Rpb24gKHBvcykge1xuICAgICAgcmV0dXJuIE1hdGgucG93KHBvcywgNCk7XG4gICAgfSxcblxuICAgIGVhc2VPdXRRdWFydDogZnVuY3Rpb24gKHBvcykge1xuICAgICAgcmV0dXJuIC0oTWF0aC5wb3coKHBvcyAtIDEpLCA0KSAtIDEpO1xuICAgIH0sXG5cbiAgICBlYXNlSW5PdXRRdWFydDogZnVuY3Rpb24gKHBvcykge1xuICAgICAgaWYgKChwb3MgLz0gMC41KSA8IDEpIHtyZXR1cm4gMC41ICogTWF0aC5wb3cocG9zLDQpO31cbiAgICAgIHJldHVybiAtMC41ICogKChwb3MgLT0gMikgKiBNYXRoLnBvdyhwb3MsMykgLSAyKTtcbiAgICB9LFxuXG4gICAgZWFzZUluUXVpbnQ6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIHJldHVybiBNYXRoLnBvdyhwb3MsIDUpO1xuICAgIH0sXG5cbiAgICBlYXNlT3V0UXVpbnQ6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIHJldHVybiAoTWF0aC5wb3coKHBvcyAtIDEpLCA1KSArIDEpO1xuICAgIH0sXG5cbiAgICBlYXNlSW5PdXRRdWludDogZnVuY3Rpb24gKHBvcykge1xuICAgICAgaWYgKChwb3MgLz0gMC41KSA8IDEpIHtyZXR1cm4gMC41ICogTWF0aC5wb3cocG9zLDUpO31cbiAgICAgIHJldHVybiAwLjUgKiAoTWF0aC5wb3coKHBvcyAtIDIpLDUpICsgMik7XG4gICAgfSxcblxuICAgIGVhc2VJblNpbmU6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIHJldHVybiAtTWF0aC5jb3MocG9zICogKE1hdGguUEkgLyAyKSkgKyAxO1xuICAgIH0sXG5cbiAgICBlYXNlT3V0U2luZTogZnVuY3Rpb24gKHBvcykge1xuICAgICAgcmV0dXJuIE1hdGguc2luKHBvcyAqIChNYXRoLlBJIC8gMikpO1xuICAgIH0sXG5cbiAgICBlYXNlSW5PdXRTaW5lOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICByZXR1cm4gKC0wLjUgKiAoTWF0aC5jb3MoTWF0aC5QSSAqIHBvcykgLSAxKSk7XG4gICAgfSxcblxuICAgIGVhc2VJbkV4cG86IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIHJldHVybiAocG9zID09PSAwKSA/IDAgOiBNYXRoLnBvdygyLCAxMCAqIChwb3MgLSAxKSk7XG4gICAgfSxcblxuICAgIGVhc2VPdXRFeHBvOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICByZXR1cm4gKHBvcyA9PT0gMSkgPyAxIDogLU1hdGgucG93KDIsIC0xMCAqIHBvcykgKyAxO1xuICAgIH0sXG5cbiAgICBlYXNlSW5PdXRFeHBvOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICBpZiAocG9zID09PSAwKSB7cmV0dXJuIDA7fVxuICAgICAgaWYgKHBvcyA9PT0gMSkge3JldHVybiAxO31cbiAgICAgIGlmICgocG9zIC89IDAuNSkgPCAxKSB7cmV0dXJuIDAuNSAqIE1hdGgucG93KDIsMTAgKiAocG9zIC0gMSkpO31cbiAgICAgIHJldHVybiAwLjUgKiAoLU1hdGgucG93KDIsIC0xMCAqIC0tcG9zKSArIDIpO1xuICAgIH0sXG5cbiAgICBlYXNlSW5DaXJjOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICByZXR1cm4gLShNYXRoLnNxcnQoMSAtIChwb3MgKiBwb3MpKSAtIDEpO1xuICAgIH0sXG5cbiAgICBlYXNlT3V0Q2lyYzogZnVuY3Rpb24gKHBvcykge1xuICAgICAgcmV0dXJuIE1hdGguc3FydCgxIC0gTWF0aC5wb3coKHBvcyAtIDEpLCAyKSk7XG4gICAgfSxcblxuICAgIGVhc2VJbk91dENpcmM6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIGlmICgocG9zIC89IDAuNSkgPCAxKSB7cmV0dXJuIC0wLjUgKiAoTWF0aC5zcXJ0KDEgLSBwb3MgKiBwb3MpIC0gMSk7fVxuICAgICAgcmV0dXJuIDAuNSAqIChNYXRoLnNxcnQoMSAtIChwb3MgLT0gMikgKiBwb3MpICsgMSk7XG4gICAgfSxcblxuICAgIGVhc2VPdXRCb3VuY2U6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIGlmICgocG9zKSA8ICgxIC8gMi43NSkpIHtcbiAgICAgICAgcmV0dXJuICg3LjU2MjUgKiBwb3MgKiBwb3MpO1xuICAgICAgfSBlbHNlIGlmIChwb3MgPCAoMiAvIDIuNzUpKSB7XG4gICAgICAgIHJldHVybiAoNy41NjI1ICogKHBvcyAtPSAoMS41IC8gMi43NSkpICogcG9zICsgMC43NSk7XG4gICAgICB9IGVsc2UgaWYgKHBvcyA8ICgyLjUgLyAyLjc1KSkge1xuICAgICAgICByZXR1cm4gKDcuNTYyNSAqIChwb3MgLT0gKDIuMjUgLyAyLjc1KSkgKiBwb3MgKyAwLjkzNzUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuICg3LjU2MjUgKiAocG9zIC09ICgyLjYyNSAvIDIuNzUpKSAqIHBvcyArIDAuOTg0Mzc1KTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZWFzZUluQmFjazogZnVuY3Rpb24gKHBvcykge1xuICAgICAgdmFyIHMgPSAxLjcwMTU4O1xuICAgICAgcmV0dXJuIChwb3MpICogcG9zICogKChzICsgMSkgKiBwb3MgLSBzKTtcbiAgICB9LFxuXG4gICAgZWFzZU91dEJhY2s6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIHZhciBzID0gMS43MDE1ODtcbiAgICAgIHJldHVybiAocG9zID0gcG9zIC0gMSkgKiBwb3MgKiAoKHMgKyAxKSAqIHBvcyArIHMpICsgMTtcbiAgICB9LFxuXG4gICAgZWFzZUluT3V0QmFjazogZnVuY3Rpb24gKHBvcykge1xuICAgICAgdmFyIHMgPSAxLjcwMTU4O1xuICAgICAgaWYgKChwb3MgLz0gMC41KSA8IDEpIHtcbiAgICAgICAgcmV0dXJuIDAuNSAqIChwb3MgKiBwb3MgKiAoKChzICo9ICgxLjUyNSkpICsgMSkgKiBwb3MgLSBzKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gMC41ICogKChwb3MgLT0gMikgKiBwb3MgKiAoKChzICo9ICgxLjUyNSkpICsgMSkgKiBwb3MgKyBzKSArIDIpO1xuICAgIH0sXG5cbiAgICBlbGFzdGljOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICAvLyBqc2hpbnQgbWF4bGVuOjkwXG4gICAgICByZXR1cm4gLTEgKiBNYXRoLnBvdyg0LC04ICogcG9zKSAqIE1hdGguc2luKChwb3MgKiA2IC0gMSkgKiAoMiAqIE1hdGguUEkpIC8gMikgKyAxO1xuICAgIH0sXG5cbiAgICBzd2luZ0Zyb21UbzogZnVuY3Rpb24gKHBvcykge1xuICAgICAgdmFyIHMgPSAxLjcwMTU4O1xuICAgICAgcmV0dXJuICgocG9zIC89IDAuNSkgPCAxKSA/XG4gICAgICAgICAgMC41ICogKHBvcyAqIHBvcyAqICgoKHMgKj0gKDEuNTI1KSkgKyAxKSAqIHBvcyAtIHMpKSA6XG4gICAgICAgICAgMC41ICogKChwb3MgLT0gMikgKiBwb3MgKiAoKChzICo9ICgxLjUyNSkpICsgMSkgKiBwb3MgKyBzKSArIDIpO1xuICAgIH0sXG5cbiAgICBzd2luZ0Zyb206IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIHZhciBzID0gMS43MDE1ODtcbiAgICAgIHJldHVybiBwb3MgKiBwb3MgKiAoKHMgKyAxKSAqIHBvcyAtIHMpO1xuICAgIH0sXG5cbiAgICBzd2luZ1RvOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICB2YXIgcyA9IDEuNzAxNTg7XG4gICAgICByZXR1cm4gKHBvcyAtPSAxKSAqIHBvcyAqICgocyArIDEpICogcG9zICsgcykgKyAxO1xuICAgIH0sXG5cbiAgICBib3VuY2U6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIGlmIChwb3MgPCAoMSAvIDIuNzUpKSB7XG4gICAgICAgIHJldHVybiAoNy41NjI1ICogcG9zICogcG9zKTtcbiAgICAgIH0gZWxzZSBpZiAocG9zIDwgKDIgLyAyLjc1KSkge1xuICAgICAgICByZXR1cm4gKDcuNTYyNSAqIChwb3MgLT0gKDEuNSAvIDIuNzUpKSAqIHBvcyArIDAuNzUpO1xuICAgICAgfSBlbHNlIGlmIChwb3MgPCAoMi41IC8gMi43NSkpIHtcbiAgICAgICAgcmV0dXJuICg3LjU2MjUgKiAocG9zIC09ICgyLjI1IC8gMi43NSkpICogcG9zICsgMC45Mzc1KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAoNy41NjI1ICogKHBvcyAtPSAoMi42MjUgLyAyLjc1KSkgKiBwb3MgKyAwLjk4NDM3NSk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGJvdW5jZVBhc3Q6IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIGlmIChwb3MgPCAoMSAvIDIuNzUpKSB7XG4gICAgICAgIHJldHVybiAoNy41NjI1ICogcG9zICogcG9zKTtcbiAgICAgIH0gZWxzZSBpZiAocG9zIDwgKDIgLyAyLjc1KSkge1xuICAgICAgICByZXR1cm4gMiAtICg3LjU2MjUgKiAocG9zIC09ICgxLjUgLyAyLjc1KSkgKiBwb3MgKyAwLjc1KTtcbiAgICAgIH0gZWxzZSBpZiAocG9zIDwgKDIuNSAvIDIuNzUpKSB7XG4gICAgICAgIHJldHVybiAyIC0gKDcuNTYyNSAqIChwb3MgLT0gKDIuMjUgLyAyLjc1KSkgKiBwb3MgKyAwLjkzNzUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIDIgLSAoNy41NjI1ICogKHBvcyAtPSAoMi42MjUgLyAyLjc1KSkgKiBwb3MgKyAwLjk4NDM3NSk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIGVhc2VGcm9tVG86IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIGlmICgocG9zIC89IDAuNSkgPCAxKSB7cmV0dXJuIDAuNSAqIE1hdGgucG93KHBvcyw0KTt9XG4gICAgICByZXR1cm4gLTAuNSAqICgocG9zIC09IDIpICogTWF0aC5wb3cocG9zLDMpIC0gMik7XG4gICAgfSxcblxuICAgIGVhc2VGcm9tOiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICByZXR1cm4gTWF0aC5wb3cocG9zLDQpO1xuICAgIH0sXG5cbiAgICBlYXNlVG86IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgIHJldHVybiBNYXRoLnBvdyhwb3MsMC4yNSk7XG4gICAgfVxuICB9KTtcblxufSgpKTtcblxuLy8ganNoaW50IG1heGxlbjoxMDBcbi8qKlxuICogVGhlIEJlemllciBtYWdpYyBpbiB0aGlzIGZpbGUgaXMgYWRhcHRlZC9jb3BpZWQgYWxtb3N0IHdob2xlc2FsZSBmcm9tXG4gKiBbU2NyaXB0eTJdKGh0dHBzOi8vZ2l0aHViLmNvbS9tYWRyb2JieS9zY3JpcHR5Mi9ibG9iL21hc3Rlci9zcmMvZWZmZWN0cy90cmFuc2l0aW9ucy9jdWJpYy1iZXppZXIuanMpLFxuICogd2hpY2ggd2FzIGFkYXB0ZWQgZnJvbSBBcHBsZSBjb2RlICh3aGljaCBwcm9iYWJseSBjYW1lIGZyb21cbiAqIFtoZXJlXShodHRwOi8vb3BlbnNvdXJjZS5hcHBsZS5jb20vc291cmNlL1dlYkNvcmUvV2ViQ29yZS05NTUuNjYvcGxhdGZvcm0vZ3JhcGhpY3MvVW5pdEJlemllci5oKSkuXG4gKiBTcGVjaWFsIHRoYW5rcyB0byBBcHBsZSBhbmQgVGhvbWFzIEZ1Y2hzIGZvciBtdWNoIG9mIHRoaXMgY29kZS5cbiAqL1xuXG4vKipcbiAqICBDb3B5cmlnaHQgKGMpIDIwMDYgQXBwbGUgQ29tcHV0ZXIsIEluYy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiAgUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XG4gKiAgbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG4gKlxuICogIDEuIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiAqICB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICpcbiAqICAyLiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsXG4gKiAgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGUgZG9jdW1lbnRhdGlvblxuICogIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuICpcbiAqICAzLiBOZWl0aGVyIHRoZSBuYW1lIG9mIHRoZSBjb3B5cmlnaHQgaG9sZGVyKHMpIG5vciB0aGUgbmFtZXMgb2YgYW55XG4gKiAgY29udHJpYnV0b3JzIG1heSBiZSB1c2VkIHRvIGVuZG9yc2Ugb3IgcHJvbW90ZSBwcm9kdWN0cyBkZXJpdmVkIGZyb21cbiAqICB0aGlzIHNvZnR3YXJlIHdpdGhvdXQgc3BlY2lmaWMgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uLlxuICpcbiAqICBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIlxuICogIEFORCBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEVcbiAqICBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRVxuICogIEFSRSBESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUIE9XTkVSIE9SIENPTlRSSUJVVE9SUyBCRVxuICogIExJQUJMRSBGT1IgQU5ZIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1JcbiAqICBDT05TRVFVRU5USUFMIERBTUFHRVMgKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRlxuICogIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLCBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTU1xuICogIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EIE9OIEFOWSBUSEVPUlkgT0YgTElBQklMSVRZLCBXSEVUSEVSIElOXG4gKiAgQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlQgKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSlcbiAqICBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRVxuICogIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICovXG47KGZ1bmN0aW9uICgpIHtcbiAgLy8gcG9ydCBvZiB3ZWJraXQgY3ViaWMgYmV6aWVyIGhhbmRsaW5nIGJ5IGh0dHA6Ly93d3cubmV0emdlc3RhLmRlL2Rldi9cbiAgZnVuY3Rpb24gY3ViaWNCZXppZXJBdFRpbWUodCxwMXgscDF5LHAyeCxwMnksZHVyYXRpb24pIHtcbiAgICB2YXIgYXggPSAwLGJ4ID0gMCxjeCA9IDAsYXkgPSAwLGJ5ID0gMCxjeSA9IDA7XG4gICAgZnVuY3Rpb24gc2FtcGxlQ3VydmVYKHQpIHtcbiAgICAgIHJldHVybiAoKGF4ICogdCArIGJ4KSAqIHQgKyBjeCkgKiB0O1xuICAgIH1cbiAgICBmdW5jdGlvbiBzYW1wbGVDdXJ2ZVkodCkge1xuICAgICAgcmV0dXJuICgoYXkgKiB0ICsgYnkpICogdCArIGN5KSAqIHQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNhbXBsZUN1cnZlRGVyaXZhdGl2ZVgodCkge1xuICAgICAgcmV0dXJuICgzLjAgKiBheCAqIHQgKyAyLjAgKiBieCkgKiB0ICsgY3g7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNvbHZlRXBzaWxvbihkdXJhdGlvbikge1xuICAgICAgcmV0dXJuIDEuMCAvICgyMDAuMCAqIGR1cmF0aW9uKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc29sdmUoeCxlcHNpbG9uKSB7XG4gICAgICByZXR1cm4gc2FtcGxlQ3VydmVZKHNvbHZlQ3VydmVYKHgsIGVwc2lsb24pKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZmFicyhuKSB7XG4gICAgICBpZiAobiA+PSAwKSB7XG4gICAgICAgIHJldHVybiBuO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIDAgLSBuO1xuICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBzb2x2ZUN1cnZlWCh4LCBlcHNpbG9uKSB7XG4gICAgICB2YXIgdDAsdDEsdDIseDIsZDIsaTtcbiAgICAgIGZvciAodDIgPSB4LCBpID0gMDsgaSA8IDg7IGkrKykge1xuICAgICAgICB4MiA9IHNhbXBsZUN1cnZlWCh0MikgLSB4O1xuICAgICAgICBpZiAoZmFicyh4MikgPCBlcHNpbG9uKSB7XG4gICAgICAgICAgcmV0dXJuIHQyO1xuICAgICAgICB9XG4gICAgICAgIGQyID0gc2FtcGxlQ3VydmVEZXJpdmF0aXZlWCh0Mik7XG4gICAgICAgIGlmIChmYWJzKGQyKSA8IDFlLTYpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0MiA9IHQyIC0geDIgLyBkMjtcbiAgICAgIH1cbiAgICAgIHQwID0gMC4wO1xuICAgICAgdDEgPSAxLjA7XG4gICAgICB0MiA9IHg7XG4gICAgICBpZiAodDIgPCB0MCkge1xuICAgICAgICByZXR1cm4gdDA7XG4gICAgICB9XG4gICAgICBpZiAodDIgPiB0MSkge1xuICAgICAgICByZXR1cm4gdDE7XG4gICAgICB9XG4gICAgICB3aGlsZSAodDAgPCB0MSkge1xuICAgICAgICB4MiA9IHNhbXBsZUN1cnZlWCh0Mik7XG4gICAgICAgIGlmIChmYWJzKHgyIC0geCkgPCBlcHNpbG9uKSB7XG4gICAgICAgICAgcmV0dXJuIHQyO1xuICAgICAgICB9XG4gICAgICAgIGlmICh4ID4geDIpIHtcbiAgICAgICAgICB0MCA9IHQyO1xuICAgICAgICB9ZWxzZSB7XG4gICAgICAgICAgdDEgPSB0MjtcbiAgICAgICAgfVxuICAgICAgICB0MiA9ICh0MSAtIHQwKSAqIDAuNSArIHQwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHQyOyAvLyBGYWlsdXJlLlxuICAgIH1cbiAgICBjeCA9IDMuMCAqIHAxeDtcbiAgICBieCA9IDMuMCAqIChwMnggLSBwMXgpIC0gY3g7XG4gICAgYXggPSAxLjAgLSBjeCAtIGJ4O1xuICAgIGN5ID0gMy4wICogcDF5O1xuICAgIGJ5ID0gMy4wICogKHAyeSAtIHAxeSkgLSBjeTtcbiAgICBheSA9IDEuMCAtIGN5IC0gYnk7XG4gICAgcmV0dXJuIHNvbHZlKHQsIHNvbHZlRXBzaWxvbihkdXJhdGlvbikpO1xuICB9XG4gIC8qKlxuICAgKiAgZ2V0Q3ViaWNCZXppZXJUcmFuc2l0aW9uKHgxLCB5MSwgeDIsIHkyKSAtPiBGdW5jdGlvblxuICAgKlxuICAgKiAgR2VuZXJhdGVzIGEgdHJhbnNpdGlvbiBlYXNpbmcgZnVuY3Rpb24gdGhhdCBpcyBjb21wYXRpYmxlXG4gICAqICB3aXRoIFdlYktpdCdzIENTUyB0cmFuc2l0aW9ucyBgLXdlYmtpdC10cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbmBcbiAgICogIENTUyBwcm9wZXJ0eS5cbiAgICpcbiAgICogIFRoZSBXM0MgaGFzIG1vcmUgaW5mb3JtYXRpb24gYWJvdXQgQ1NTMyB0cmFuc2l0aW9uIHRpbWluZyBmdW5jdGlvbnM6XG4gICAqICBodHRwOi8vd3d3LnczLm9yZy9UUi9jc3MzLXRyYW5zaXRpb25zLyN0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbl90YWdcbiAgICpcbiAgICogIEBwYXJhbSB7bnVtYmVyfSB4MVxuICAgKiAgQHBhcmFtIHtudW1iZXJ9IHkxXG4gICAqICBAcGFyYW0ge251bWJlcn0geDJcbiAgICogIEBwYXJhbSB7bnVtYmVyfSB5MlxuICAgKiAgQHJldHVybiB7ZnVuY3Rpb259XG4gICAqICBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0Q3ViaWNCZXppZXJUcmFuc2l0aW9uICh4MSwgeTEsIHgyLCB5Mikge1xuICAgIHJldHVybiBmdW5jdGlvbiAocG9zKSB7XG4gICAgICByZXR1cm4gY3ViaWNCZXppZXJBdFRpbWUocG9zLHgxLHkxLHgyLHkyLDEpO1xuICAgIH07XG4gIH1cbiAgLy8gRW5kIHBvcnRlZCBjb2RlXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIEJlemllciBlYXNpbmcgZnVuY3Rpb24gYW5kIGF0dGFjaCBpdCB0byBge3sjY3Jvc3NMaW5rXG4gICAqIFwiVHdlZW5hYmxlL2Zvcm11bGE6cHJvcGVydHlcIn19VHdlZW5hYmxlI2Zvcm11bGF7ey9jcm9zc0xpbmt9fWAuICBUaGlzXG4gICAqIGZ1bmN0aW9uIGdpdmVzIHlvdSB0b3RhbCBjb250cm9sIG92ZXIgdGhlIGVhc2luZyBjdXJ2ZS4gIE1hdHRoZXcgTGVpbidzXG4gICAqIFtDZWFzZXJdKGh0dHA6Ly9tYXR0aGV3bGVpbi5jb20vY2Vhc2VyLykgaXMgYSB1c2VmdWwgdG9vbCBmb3IgdmlzdWFsaXppbmdcbiAgICogdGhlIGN1cnZlcyB5b3UgY2FuIG1ha2Ugd2l0aCB0aGlzIGZ1bmN0aW9uLlxuICAgKiBAbWV0aG9kIHNldEJlemllckZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBlYXNpbmcgY3VydmUuICBPdmVyd3JpdGVzIHRoZSBvbGRcbiAgICogZWFzaW5nIGZ1bmN0aW9uIG9uIGB7eyNjcm9zc0xpbmtcbiAgICogXCJUd2VlbmFibGUvZm9ybXVsYTpwcm9wZXJ0eVwifX1Ud2VlbmFibGUjZm9ybXVsYXt7L2Nyb3NzTGlua319YCBpZiBpdFxuICAgKiBleGlzdHMuXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB4MVxuICAgKiBAcGFyYW0ge251bWJlcn0geTFcbiAgICogQHBhcmFtIHtudW1iZXJ9IHgyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5MlxuICAgKiBAcmV0dXJuIHtmdW5jdGlvbn0gVGhlIGVhc2luZyBmdW5jdGlvbiB0aGF0IHdhcyBhdHRhY2hlZCB0b1xuICAgKiBUd2VlbmFibGUucHJvdG90eXBlLmZvcm11bGEuXG4gICAqL1xuICBUd2VlbmFibGUuc2V0QmV6aWVyRnVuY3Rpb24gPSBmdW5jdGlvbiAobmFtZSwgeDEsIHkxLCB4MiwgeTIpIHtcbiAgICB2YXIgY3ViaWNCZXppZXJUcmFuc2l0aW9uID0gZ2V0Q3ViaWNCZXppZXJUcmFuc2l0aW9uKHgxLCB5MSwgeDIsIHkyKTtcbiAgICBjdWJpY0JlemllclRyYW5zaXRpb24uZGlzcGxheU5hbWUgPSBuYW1lO1xuICAgIGN1YmljQmV6aWVyVHJhbnNpdGlvbi54MSA9IHgxO1xuICAgIGN1YmljQmV6aWVyVHJhbnNpdGlvbi55MSA9IHkxO1xuICAgIGN1YmljQmV6aWVyVHJhbnNpdGlvbi54MiA9IHgyO1xuICAgIGN1YmljQmV6aWVyVHJhbnNpdGlvbi55MiA9IHkyO1xuXG4gICAgcmV0dXJuIFR3ZWVuYWJsZS5wcm90b3R5cGUuZm9ybXVsYVtuYW1lXSA9IGN1YmljQmV6aWVyVHJhbnNpdGlvbjtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBgZGVsZXRlYCBhbiBlYXNpbmcgZnVuY3Rpb24gZnJvbSBge3sjY3Jvc3NMaW5rXG4gICAqIFwiVHdlZW5hYmxlL2Zvcm11bGE6cHJvcGVydHlcIn19VHdlZW5hYmxlI2Zvcm11bGF7ey9jcm9zc0xpbmt9fWAuICBCZVxuICAgKiBjYXJlZnVsIHdpdGggdGhpcyBtZXRob2QsIGFzIGl0IGBkZWxldGVgcyB3aGF0ZXZlciBlYXNpbmcgZm9ybXVsYSBtYXRjaGVzXG4gICAqIGBuYW1lYCAod2hpY2ggbWVhbnMgeW91IGNhbiBkZWxldGUgc3RhbmRhcmQgU2hpZnR5IGVhc2luZyBmdW5jdGlvbnMpLlxuICAgKiBAbWV0aG9kIHVuc2V0QmV6aWVyRnVuY3Rpb25cbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIGVhc2luZyBmdW5jdGlvbiB0byBkZWxldGUuXG4gICAqIEByZXR1cm4ge2Z1bmN0aW9ufVxuICAgKi9cbiAgVHdlZW5hYmxlLnVuc2V0QmV6aWVyRnVuY3Rpb24gPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIGRlbGV0ZSBUd2VlbmFibGUucHJvdG90eXBlLmZvcm11bGFbbmFtZV07XG4gIH07XG5cbn0pKCk7XG5cbjsoZnVuY3Rpb24gKCkge1xuXG4gIGZ1bmN0aW9uIGdldEludGVycG9sYXRlZFZhbHVlcyAoXG4gICAgZnJvbSwgY3VycmVudCwgdGFyZ2V0U3RhdGUsIHBvc2l0aW9uLCBlYXNpbmcsIGRlbGF5KSB7XG4gICAgcmV0dXJuIFR3ZWVuYWJsZS50d2VlblByb3BzKFxuICAgICAgcG9zaXRpb24sIGN1cnJlbnQsIGZyb20sIHRhcmdldFN0YXRlLCAxLCBkZWxheSwgZWFzaW5nKTtcbiAgfVxuXG4gIC8vIEZha2UgYSBUd2VlbmFibGUgYW5kIHBhdGNoIHNvbWUgaW50ZXJuYWxzLiAgVGhpcyBhcHByb2FjaCBhbGxvd3MgdXMgdG9cbiAgLy8gc2tpcCB1bmVjY2Vzc2FyeSBwcm9jZXNzaW5nIGFuZCBvYmplY3QgcmVjcmVhdGlvbiwgY3V0dGluZyBkb3duIG9uIGdhcmJhZ2VcbiAgLy8gY29sbGVjdGlvbiBwYXVzZXMuXG4gIHZhciBtb2NrVHdlZW5hYmxlID0gbmV3IFR3ZWVuYWJsZSgpO1xuICBtb2NrVHdlZW5hYmxlLl9maWx0ZXJBcmdzID0gW107XG5cbiAgLyoqXG4gICAqIENvbXB1dGUgdGhlIG1pZHBvaW50IG9mIHR3byBPYmplY3RzLiAgVGhpcyBtZXRob2QgZWZmZWN0aXZlbHkgY2FsY3VsYXRlcyBhXG4gICAqIHNwZWNpZmljIGZyYW1lIG9mIGFuaW1hdGlvbiB0aGF0IGB7eyNjcm9zc0xpbmtcbiAgICogXCJUd2VlbmFibGUvdHdlZW46bWV0aG9kXCJ9fXt7L2Nyb3NzTGlua319YCBkb2VzIG1hbnkgdGltZXMgb3ZlciB0aGUgY291cnNlXG4gICAqIG9mIGEgZnVsbCB0d2Vlbi5cbiAgICpcbiAgICogICAgIHZhciBpbnRlcnBvbGF0ZWRWYWx1ZXMgPSBUd2VlbmFibGUuaW50ZXJwb2xhdGUoe1xuICAgKiAgICAgICB3aWR0aDogJzEwMHB4JyxcbiAgICogICAgICAgb3BhY2l0eTogMCxcbiAgICogICAgICAgY29sb3I6ICcjZmZmJ1xuICAgKiAgICAgfSwge1xuICAgKiAgICAgICB3aWR0aDogJzIwMHB4JyxcbiAgICogICAgICAgb3BhY2l0eTogMSxcbiAgICogICAgICAgY29sb3I6ICcjMDAwJ1xuICAgKiAgICAgfSwgMC41KTtcbiAgICpcbiAgICogICAgIGNvbnNvbGUubG9nKGludGVycG9sYXRlZFZhbHVlcyk7XG4gICAqICAgICAvLyB7b3BhY2l0eTogMC41LCB3aWR0aDogXCIxNTBweFwiLCBjb2xvcjogXCJyZ2IoMTI3LDEyNywxMjcpXCJ9XG4gICAqXG4gICAqIEBzdGF0aWNcbiAgICogQG1ldGhvZCBpbnRlcnBvbGF0ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gZnJvbSBUaGUgc3RhcnRpbmcgdmFsdWVzIHRvIHR3ZWVuIGZyb20uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXRTdGF0ZSBUaGUgZW5kaW5nIHZhbHVlcyB0byB0d2VlbiB0by5cbiAgICogQHBhcmFtIHtudW1iZXJ9IHBvc2l0aW9uIFRoZSBub3JtYWxpemVkIHBvc2l0aW9uIHZhbHVlIChiZXR3ZWVuIGAwLjBgIGFuZFxuICAgKiBgMS4wYCkgdG8gaW50ZXJwb2xhdGUgdGhlIHZhbHVlcyBiZXR3ZWVuIGBmcm9tYCBhbmQgYHRvYCBmb3IuICBgZnJvbWBcbiAgICogcmVwcmVzZW50cyBgMGAgYW5kIGB0b2AgcmVwcmVzZW50cyBgMWAuXG4gICAqIEBwYXJhbSB7T2JqZWN0LjxzdHJpbmd8RnVuY3Rpb24+fHN0cmluZ3xGdW5jdGlvbn0gZWFzaW5nIFRoZSBlYXNpbmdcbiAgICogY3VydmUocykgdG8gY2FsY3VsYXRlIHRoZSBtaWRwb2ludCBhZ2FpbnN0LiAgWW91IGNhbiByZWZlcmVuY2UgYW55IGVhc2luZ1xuICAgKiBmdW5jdGlvbiBhdHRhY2hlZCB0byBgVHdlZW5hYmxlLnByb3RvdHlwZS5mb3JtdWxhYCwgb3IgcHJvdmlkZSB0aGUgZWFzaW5nXG4gICAqIGZ1bmN0aW9uKHMpIGRpcmVjdGx5LiAgSWYgb21pdHRlZCwgdGhpcyBkZWZhdWx0cyB0byBcImxpbmVhclwiLlxuICAgKiBAcGFyYW0ge251bWJlcj19IG9wdF9kZWxheSBPcHRpb25hbCBkZWxheSB0byBwYWQgdGhlIGJlZ2lubmluZyBvZiB0aGVcbiAgICogaW50ZXJwb2xhdGVkIHR3ZWVuIHdpdGguICBUaGlzIGluY3JlYXNlcyB0aGUgcmFuZ2Ugb2YgYHBvc2l0aW9uYCBmcm9tIChgMGBcbiAgICogdGhyb3VnaCBgMWApIHRvIChgMGAgdGhyb3VnaCBgMSArIG9wdF9kZWxheWApLiAgU28sIGEgZGVsYXkgb2YgYDAuNWAgd291bGRcbiAgICogaW5jcmVhc2UgYWxsIHZhbGlkIHZhbHVlcyBvZiBgcG9zaXRpb25gIHRvIG51bWJlcnMgYmV0d2VlbiBgMGAgYW5kIGAxLjVgLlxuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqL1xuICBUd2VlbmFibGUuaW50ZXJwb2xhdGUgPSBmdW5jdGlvbiAoXG4gICAgZnJvbSwgdGFyZ2V0U3RhdGUsIHBvc2l0aW9uLCBlYXNpbmcsIG9wdF9kZWxheSkge1xuXG4gICAgdmFyIGN1cnJlbnQgPSBUd2VlbmFibGUuc2hhbGxvd0NvcHkoe30sIGZyb20pO1xuICAgIHZhciBkZWxheSA9IG9wdF9kZWxheSB8fCAwO1xuICAgIHZhciBlYXNpbmdPYmplY3QgPSBUd2VlbmFibGUuY29tcG9zZUVhc2luZ09iamVjdChcbiAgICAgIGZyb20sIGVhc2luZyB8fCAnbGluZWFyJyk7XG5cbiAgICBtb2NrVHdlZW5hYmxlLnNldCh7fSk7XG5cbiAgICAvLyBBbGlhcyBhbmQgcmV1c2UgdGhlIF9maWx0ZXJBcmdzIGFycmF5IGluc3RlYWQgb2YgcmVjcmVhdGluZyBpdC5cbiAgICB2YXIgZmlsdGVyQXJncyA9IG1vY2tUd2VlbmFibGUuX2ZpbHRlckFyZ3M7XG4gICAgZmlsdGVyQXJncy5sZW5ndGggPSAwO1xuICAgIGZpbHRlckFyZ3NbMF0gPSBjdXJyZW50O1xuICAgIGZpbHRlckFyZ3NbMV0gPSBmcm9tO1xuICAgIGZpbHRlckFyZ3NbMl0gPSB0YXJnZXRTdGF0ZTtcbiAgICBmaWx0ZXJBcmdzWzNdID0gZWFzaW5nT2JqZWN0O1xuXG4gICAgLy8gQW55IGRlZmluZWQgdmFsdWUgdHJhbnNmb3JtYXRpb24gbXVzdCBiZSBhcHBsaWVkXG4gICAgVHdlZW5hYmxlLmFwcGx5RmlsdGVyKG1vY2tUd2VlbmFibGUsICd0d2VlbkNyZWF0ZWQnKTtcbiAgICBUd2VlbmFibGUuYXBwbHlGaWx0ZXIobW9ja1R3ZWVuYWJsZSwgJ2JlZm9yZVR3ZWVuJyk7XG5cbiAgICB2YXIgaW50ZXJwb2xhdGVkVmFsdWVzID0gZ2V0SW50ZXJwb2xhdGVkVmFsdWVzKFxuICAgICAgZnJvbSwgY3VycmVudCwgdGFyZ2V0U3RhdGUsIHBvc2l0aW9uLCBlYXNpbmdPYmplY3QsIGRlbGF5KTtcblxuICAgIC8vIFRyYW5zZm9ybSB2YWx1ZXMgYmFjayBpbnRvIHRoZWlyIG9yaWdpbmFsIGZvcm1hdFxuICAgIFR3ZWVuYWJsZS5hcHBseUZpbHRlcihtb2NrVHdlZW5hYmxlLCAnYWZ0ZXJUd2VlbicpO1xuXG4gICAgcmV0dXJuIGludGVycG9sYXRlZFZhbHVlcztcbiAgfTtcblxufSgpKTtcblxuLyoqXG4gKiBUaGlzIG1vZHVsZSBhZGRzIHN0cmluZyBpbnRlcnBvbGF0aW9uIHN1cHBvcnQgdG8gU2hpZnR5LlxuICpcbiAqIFRoZSBUb2tlbiBleHRlbnNpb24gYWxsb3dzIFNoaWZ0eSB0byB0d2VlbiBudW1iZXJzIGluc2lkZSBvZiBzdHJpbmdzLiAgQW1vbmdcbiAqIG90aGVyIHRoaW5ncywgdGhpcyBhbGxvd3MgeW91IHRvIGFuaW1hdGUgQ1NTIHByb3BlcnRpZXMuICBGb3IgZXhhbXBsZSwgeW91XG4gKiBjYW4gZG8gdGhpczpcbiAqXG4gKiAgICAgdmFyIHR3ZWVuYWJsZSA9IG5ldyBUd2VlbmFibGUoKTtcbiAqICAgICB0d2VlbmFibGUudHdlZW4oe1xuICogICAgICAgZnJvbTogeyB0cmFuc2Zvcm06ICd0cmFuc2xhdGVYKDQ1cHgpJyB9LFxuICogICAgICAgdG86IHsgdHJhbnNmb3JtOiAndHJhbnNsYXRlWCg5MHhwKScgfVxuICogICAgIH0pO1xuICpcbiAqIGB0cmFuc2xhdGVYKDQ1KWAgd2lsbCBiZSB0d2VlbmVkIHRvIGB0cmFuc2xhdGVYKDkwKWAuICBUbyBkZW1vbnN0cmF0ZTpcbiAqXG4gKiAgICAgdmFyIHR3ZWVuYWJsZSA9IG5ldyBUd2VlbmFibGUoKTtcbiAqICAgICB0d2VlbmFibGUudHdlZW4oe1xuICogICAgICAgZnJvbTogeyB0cmFuc2Zvcm06ICd0cmFuc2xhdGVYKDQ1cHgpJyB9LFxuICogICAgICAgdG86IHsgdHJhbnNmb3JtOiAndHJhbnNsYXRlWCg5MHB4KScgfSxcbiAqICAgICAgIHN0ZXA6IGZ1bmN0aW9uIChzdGF0ZSkge1xuICogICAgICAgICBjb25zb2xlLmxvZyhzdGF0ZS50cmFuc2Zvcm0pO1xuICogICAgICAgfVxuICogICAgIH0pO1xuICpcbiAqIFRoZSBhYm92ZSBzbmlwcGV0IHdpbGwgbG9nIHNvbWV0aGluZyBsaWtlIHRoaXMgaW4gdGhlIGNvbnNvbGU6XG4gKlxuICogICAgIHRyYW5zbGF0ZVgoNjAuM3B4KVxuICogICAgIC4uLlxuICogICAgIHRyYW5zbGF0ZVgoNzYuMDVweClcbiAqICAgICAuLi5cbiAqICAgICB0cmFuc2xhdGVYKDkwcHgpXG4gKlxuICogQW5vdGhlciB1c2UgZm9yIHRoaXMgaXMgYW5pbWF0aW5nIGNvbG9yczpcbiAqXG4gKiAgICAgdmFyIHR3ZWVuYWJsZSA9IG5ldyBUd2VlbmFibGUoKTtcbiAqICAgICB0d2VlbmFibGUudHdlZW4oe1xuICogICAgICAgZnJvbTogeyBjb2xvcjogJ3JnYigwLDI1NSwwKScgfSxcbiAqICAgICAgIHRvOiB7IGNvbG9yOiAncmdiKDI1NSwwLDI1NSknIH0sXG4gKiAgICAgICBzdGVwOiBmdW5jdGlvbiAoc3RhdGUpIHtcbiAqICAgICAgICAgY29uc29sZS5sb2coc3RhdGUuY29sb3IpO1xuICogICAgICAgfVxuICogICAgIH0pO1xuICpcbiAqIFRoZSBhYm92ZSBzbmlwcGV0IHdpbGwgbG9nIHNvbWV0aGluZyBsaWtlIHRoaXM6XG4gKlxuICogICAgIHJnYig4NCwxNzAsODQpXG4gKiAgICAgLi4uXG4gKiAgICAgcmdiKDE3MCw4NCwxNzApXG4gKiAgICAgLi4uXG4gKiAgICAgcmdiKDI1NSwwLDI1NSlcbiAqXG4gKiBUaGlzIGV4dGVuc2lvbiBhbHNvIHN1cHBvcnRzIGhleGFkZWNpbWFsIGNvbG9ycywgaW4gYm90aCBsb25nIChgI2ZmMDBmZmApXG4gKiBhbmQgc2hvcnQgKGAjZjBmYCkgZm9ybXMuICBCZSBhd2FyZSB0aGF0IGhleGFkZWNpbWFsIGlucHV0IHZhbHVlcyB3aWxsIGJlXG4gKiBjb252ZXJ0ZWQgaW50byB0aGUgZXF1aXZhbGVudCBSR0Igb3V0cHV0IHZhbHVlcy4gIFRoaXMgaXMgZG9uZSB0byBvcHRpbWl6ZVxuICogZm9yIHBlcmZvcm1hbmNlLlxuICpcbiAqICAgICB2YXIgdHdlZW5hYmxlID0gbmV3IFR3ZWVuYWJsZSgpO1xuICogICAgIHR3ZWVuYWJsZS50d2Vlbih7XG4gKiAgICAgICBmcm9tOiB7IGNvbG9yOiAnIzBmMCcgfSxcbiAqICAgICAgIHRvOiB7IGNvbG9yOiAnI2YwZicgfSxcbiAqICAgICAgIHN0ZXA6IGZ1bmN0aW9uIChzdGF0ZSkge1xuICogICAgICAgICBjb25zb2xlLmxvZyhzdGF0ZS5jb2xvcik7XG4gKiAgICAgICB9XG4gKiAgICAgfSk7XG4gKlxuICogVGhpcyBzbmlwcGV0IHdpbGwgZ2VuZXJhdGUgdGhlIHNhbWUgb3V0cHV0IGFzIHRoZSBvbmUgYmVmb3JlIGl0IGJlY2F1c2VcbiAqIGVxdWl2YWxlbnQgdmFsdWVzIHdlcmUgc3VwcGxpZWQgKGp1c3QgaW4gaGV4YWRlY2ltYWwgZm9ybSByYXRoZXIgdGhhbiBSR0IpOlxuICpcbiAqICAgICByZ2IoODQsMTcwLDg0KVxuICogICAgIC4uLlxuICogICAgIHJnYigxNzAsODQsMTcwKVxuICogICAgIC4uLlxuICogICAgIHJnYigyNTUsMCwyNTUpXG4gKlxuICogIyMgRWFzaW5nIHN1cHBvcnRcbiAqXG4gKiBFYXNpbmcgd29ya3Mgc29tZXdoYXQgZGlmZmVyZW50bHkgaW4gdGhlIFRva2VuIGV4dGVuc2lvbi4gIFRoaXMgaXMgYmVjYXVzZVxuICogc29tZSBDU1MgcHJvcGVydGllcyBoYXZlIG11bHRpcGxlIHZhbHVlcyBpbiB0aGVtLCBhbmQgeW91IG1pZ2h0IG5lZWQgdG9cbiAqIHR3ZWVuIGVhY2ggdmFsdWUgYWxvbmcgaXRzIG93biBlYXNpbmcgY3VydmUuICBBIGJhc2ljIGV4YW1wbGU6XG4gKlxuICogICAgIHZhciB0d2VlbmFibGUgPSBuZXcgVHdlZW5hYmxlKCk7XG4gKiAgICAgdHdlZW5hYmxlLnR3ZWVuKHtcbiAqICAgICAgIGZyb206IHsgdHJhbnNmb3JtOiAndHJhbnNsYXRlWCgwcHgpIHRyYW5zbGF0ZVkoMHB4KScgfSxcbiAqICAgICAgIHRvOiB7IHRyYW5zZm9ybTogICAndHJhbnNsYXRlWCgxMDBweCkgdHJhbnNsYXRlWSgxMDBweCknIH0sXG4gKiAgICAgICBlYXNpbmc6IHsgdHJhbnNmb3JtOiAnZWFzZUluUXVhZCcgfSxcbiAqICAgICAgIHN0ZXA6IGZ1bmN0aW9uIChzdGF0ZSkge1xuICogICAgICAgICBjb25zb2xlLmxvZyhzdGF0ZS50cmFuc2Zvcm0pO1xuICogICAgICAgfVxuICogICAgIH0pO1xuICpcbiAqIFRoZSBhYm92ZSBzbmlwcGV0IHdpbGwgY3JlYXRlIHZhbHVlcyBsaWtlIHRoaXM6XG4gKlxuICogICAgIHRyYW5zbGF0ZVgoMTEuNTZweCkgdHJhbnNsYXRlWSgxMS41NnB4KVxuICogICAgIC4uLlxuICogICAgIHRyYW5zbGF0ZVgoNDYuMjRweCkgdHJhbnNsYXRlWSg0Ni4yNHB4KVxuICogICAgIC4uLlxuICogICAgIHRyYW5zbGF0ZVgoMTAwcHgpIHRyYW5zbGF0ZVkoMTAwcHgpXG4gKlxuICogSW4gdGhpcyBjYXNlLCB0aGUgdmFsdWVzIGZvciBgdHJhbnNsYXRlWGAgYW5kIGB0cmFuc2xhdGVZYCBhcmUgYWx3YXlzIHRoZVxuICogc2FtZSBmb3IgZWFjaCBzdGVwIG9mIHRoZSB0d2VlbiwgYmVjYXVzZSB0aGV5IGhhdmUgdGhlIHNhbWUgc3RhcnQgYW5kIGVuZFxuICogcG9pbnRzIGFuZCBib3RoIHVzZSB0aGUgc2FtZSBlYXNpbmcgY3VydmUuICBXZSBjYW4gYWxzbyB0d2VlbiBgdHJhbnNsYXRlWGBcbiAqIGFuZCBgdHJhbnNsYXRlWWAgYWxvbmcgaW5kZXBlbmRlbnQgY3VydmVzOlxuICpcbiAqICAgICB2YXIgdHdlZW5hYmxlID0gbmV3IFR3ZWVuYWJsZSgpO1xuICogICAgIHR3ZWVuYWJsZS50d2Vlbih7XG4gKiAgICAgICBmcm9tOiB7IHRyYW5zZm9ybTogJ3RyYW5zbGF0ZVgoMHB4KSB0cmFuc2xhdGVZKDBweCknIH0sXG4gKiAgICAgICB0bzogeyB0cmFuc2Zvcm06ICAgJ3RyYW5zbGF0ZVgoMTAwcHgpIHRyYW5zbGF0ZVkoMTAwcHgpJyB9LFxuICogICAgICAgZWFzaW5nOiB7IHRyYW5zZm9ybTogJ2Vhc2VJblF1YWQgYm91bmNlJyB9LFxuICogICAgICAgc3RlcDogZnVuY3Rpb24gKHN0YXRlKSB7XG4gKiAgICAgICAgIGNvbnNvbGUubG9nKHN0YXRlLnRyYW5zZm9ybSk7XG4gKiAgICAgICB9XG4gKiAgICAgfSk7XG4gKlxuICogVGhlIGFib3ZlIHNuaXBwZXQgd2lsbCBjcmVhdGUgdmFsdWVzIGxpa2UgdGhpczpcbiAqXG4gKiAgICAgdHJhbnNsYXRlWCgxMC44OXB4KSB0cmFuc2xhdGVZKDgyLjM1cHgpXG4gKiAgICAgLi4uXG4gKiAgICAgdHJhbnNsYXRlWCg0NC44OXB4KSB0cmFuc2xhdGVZKDg2LjczcHgpXG4gKiAgICAgLi4uXG4gKiAgICAgdHJhbnNsYXRlWCgxMDBweCkgdHJhbnNsYXRlWSgxMDBweClcbiAqXG4gKiBgdHJhbnNsYXRlWGAgYW5kIGB0cmFuc2xhdGVZYCBhcmUgbm90IGluIHN5bmMgYW55bW9yZSwgYmVjYXVzZSBgZWFzZUluUXVhZGBcbiAqIHdhcyBzcGVjaWZpZWQgZm9yIGB0cmFuc2xhdGVYYCBhbmQgYGJvdW5jZWAgZm9yIGB0cmFuc2xhdGVZYC4gIE1peGluZyBhbmRcbiAqIG1hdGNoaW5nIGVhc2luZyBjdXJ2ZXMgY2FuIG1ha2UgZm9yIHNvbWUgaW50ZXJlc3RpbmcgbW90aW9uIGluIHlvdXJcbiAqIGFuaW1hdGlvbnMuXG4gKlxuICogVGhlIG9yZGVyIG9mIHRoZSBzcGFjZS1zZXBhcmF0ZWQgZWFzaW5nIGN1cnZlcyBjb3JyZXNwb25kIHRoZSB0b2tlbiB2YWx1ZXNcbiAqIHRoZXkgYXBwbHkgdG8uICBJZiB0aGVyZSBhcmUgbW9yZSB0b2tlbiB2YWx1ZXMgdGhhbiBlYXNpbmcgY3VydmVzIGxpc3RlZCxcbiAqIHRoZSBsYXN0IGVhc2luZyBjdXJ2ZSBsaXN0ZWQgaXMgdXNlZC5cbiAqIEBzdWJtb2R1bGUgVHdlZW5hYmxlLnRva2VuXG4gKi9cblxuLy8gdG9rZW4gZnVuY3Rpb24gaXMgZGVmaW5lZCBhYm92ZSBvbmx5IHNvIHRoYXQgZG94LWZvdW5kYXRpb24gc2VlcyBpdCBhc1xuLy8gZG9jdW1lbnRhdGlvbiBhbmQgcmVuZGVycyBpdC4gIEl0IGlzIG5ldmVyIHVzZWQsIGFuZCBpcyBvcHRpbWl6ZWQgYXdheSBhdFxuLy8gYnVpbGQgdGltZS5cblxuOyhmdW5jdGlvbiAoVHdlZW5hYmxlKSB7XG5cbiAgLyoqXG4gICAqIEB0eXBlZGVmIHt7XG4gICAqICAgZm9ybWF0U3RyaW5nOiBzdHJpbmdcbiAgICogICBjaHVua05hbWVzOiBBcnJheS48c3RyaW5nPlxuICAgKiB9fVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgdmFyIGZvcm1hdE1hbmlmZXN0O1xuXG4gIC8vIENPTlNUQU5UU1xuXG4gIHZhciBSX05VTUJFUl9DT01QT05FTlQgPSAvKFxcZHxcXC18XFwuKS87XG4gIHZhciBSX0ZPUk1BVF9DSFVOS1MgPSAvKFteXFwtMC05XFwuXSspL2c7XG4gIHZhciBSX1VORk9STUFUVEVEX1ZBTFVFUyA9IC9bMC05LlxcLV0rL2c7XG4gIHZhciBSX1JHQiA9IG5ldyBSZWdFeHAoXG4gICAgJ3JnYlxcXFwoJyArIFJfVU5GT1JNQVRURURfVkFMVUVTLnNvdXJjZSArXG4gICAgKC8sXFxzKi8uc291cmNlKSArIFJfVU5GT1JNQVRURURfVkFMVUVTLnNvdXJjZSArXG4gICAgKC8sXFxzKi8uc291cmNlKSArIFJfVU5GT1JNQVRURURfVkFMVUVTLnNvdXJjZSArICdcXFxcKScsICdnJyk7XG4gIHZhciBSX1JHQl9QUkVGSVggPSAvXi4qXFwoLztcbiAgdmFyIFJfSEVYID0gLyMoWzAtOV18W2EtZl0pezMsNn0vZ2k7XG4gIHZhciBWQUxVRV9QTEFDRUhPTERFUiA9ICdWQUwnO1xuXG4gIC8vIEhFTFBFUlNcblxuICAvKipcbiAgICogQHBhcmFtIHtBcnJheS5udW1iZXJ9IHJhd1ZhbHVlc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gcHJlZml4XG4gICAqXG4gICAqIEByZXR1cm4ge0FycmF5LjxzdHJpbmc+fVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0Rm9ybWF0Q2h1bmtzRnJvbSAocmF3VmFsdWVzLCBwcmVmaXgpIHtcbiAgICB2YXIgYWNjdW11bGF0b3IgPSBbXTtcblxuICAgIHZhciByYXdWYWx1ZXNMZW5ndGggPSByYXdWYWx1ZXMubGVuZ3RoO1xuICAgIHZhciBpO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IHJhd1ZhbHVlc0xlbmd0aDsgaSsrKSB7XG4gICAgICBhY2N1bXVsYXRvci5wdXNoKCdfJyArIHByZWZpeCArICdfJyArIGkpO1xuICAgIH1cblxuICAgIHJldHVybiBhY2N1bXVsYXRvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZm9ybWF0dGVkU3RyaW5nXG4gICAqXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIGdldEZvcm1hdFN0cmluZ0Zyb20gKGZvcm1hdHRlZFN0cmluZykge1xuICAgIHZhciBjaHVua3MgPSBmb3JtYXR0ZWRTdHJpbmcubWF0Y2goUl9GT1JNQVRfQ0hVTktTKTtcblxuICAgIGlmICghY2h1bmtzKSB7XG4gICAgICAvLyBjaHVua3Mgd2lsbCBiZSBudWxsIGlmIHRoZXJlIHdlcmUgbm8gdG9rZW5zIHRvIHBhcnNlIGluXG4gICAgICAvLyBmb3JtYXR0ZWRTdHJpbmcgKGZvciBleGFtcGxlLCBpZiBmb3JtYXR0ZWRTdHJpbmcgaXMgJzInKS4gIENvZXJjZVxuICAgICAgLy8gY2h1bmtzIHRvIGJlIHVzZWZ1bCBoZXJlLlxuICAgICAgY2h1bmtzID0gWycnLCAnJ107XG5cbiAgICAgIC8vIElmIHRoZXJlIGlzIG9ubHkgb25lIGNodW5rLCBhc3N1bWUgdGhhdCB0aGUgc3RyaW5nIGlzIGEgbnVtYmVyXG4gICAgICAvLyBmb2xsb3dlZCBieSBhIHRva2VuLi4uXG4gICAgICAvLyBOT1RFOiBUaGlzIG1heSBiZSBhbiB1bndpc2UgYXNzdW1wdGlvbi5cbiAgICB9IGVsc2UgaWYgKGNodW5rcy5sZW5ndGggPT09IDEgfHxcbiAgICAgIC8vIC4uLm9yIGlmIHRoZSBzdHJpbmcgc3RhcnRzIHdpdGggYSBudW1iZXIgY29tcG9uZW50IChcIi5cIiwgXCItXCIsIG9yIGFcbiAgICAgIC8vIGRpZ2l0KS4uLlxuICAgIGZvcm1hdHRlZFN0cmluZy5jaGFyQXQoMCkubWF0Y2goUl9OVU1CRVJfQ09NUE9ORU5UKSkge1xuICAgICAgLy8gLi4ucHJlcGVuZCBhbiBlbXB0eSBzdHJpbmcgaGVyZSB0byBtYWtlIHN1cmUgdGhhdCB0aGUgZm9ybWF0dGVkIG51bWJlclxuICAgICAgLy8gaXMgcHJvcGVybHkgcmVwbGFjZWQgYnkgVkFMVUVfUExBQ0VIT0xERVJcbiAgICAgIGNodW5rcy51bnNoaWZ0KCcnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2h1bmtzLmpvaW4oVkFMVUVfUExBQ0VIT0xERVIpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgYWxsIGhleCBjb2xvciB2YWx1ZXMgd2l0aGluIGEgc3RyaW5nIHRvIGFuIHJnYiBzdHJpbmcuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZU9iamVjdFxuICAgKlxuICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBtb2RpZmllZCBvYmpcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIHNhbml0aXplT2JqZWN0Rm9ySGV4UHJvcHMgKHN0YXRlT2JqZWN0KSB7XG4gICAgVHdlZW5hYmxlLmVhY2goc3RhdGVPYmplY3QsIGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgICB2YXIgY3VycmVudFByb3AgPSBzdGF0ZU9iamVjdFtwcm9wXTtcblxuICAgICAgaWYgKHR5cGVvZiBjdXJyZW50UHJvcCA9PT0gJ3N0cmluZycgJiYgY3VycmVudFByb3AubWF0Y2goUl9IRVgpKSB7XG4gICAgICAgIHN0YXRlT2JqZWN0W3Byb3BdID0gc2FuaXRpemVIZXhDaHVua3NUb1JHQihjdXJyZW50UHJvcCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN0clxuICAgKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiAgc2FuaXRpemVIZXhDaHVua3NUb1JHQiAoc3RyKSB7XG4gICAgcmV0dXJuIGZpbHRlclN0cmluZ0NodW5rcyhSX0hFWCwgc3RyLCBjb252ZXJ0SGV4VG9SR0IpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBoZXhTdHJpbmdcbiAgICpcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gY29udmVydEhleFRvUkdCIChoZXhTdHJpbmcpIHtcbiAgICB2YXIgcmdiQXJyID0gaGV4VG9SR0JBcnJheShoZXhTdHJpbmcpO1xuICAgIHJldHVybiAncmdiKCcgKyByZ2JBcnJbMF0gKyAnLCcgKyByZ2JBcnJbMV0gKyAnLCcgKyByZ2JBcnJbMl0gKyAnKSc7XG4gIH1cblxuICB2YXIgaGV4VG9SR0JBcnJheV9yZXR1cm5BcnJheSA9IFtdO1xuICAvKipcbiAgICogQ29udmVydCBhIGhleGFkZWNpbWFsIHN0cmluZyB0byBhbiBhcnJheSB3aXRoIHRocmVlIGl0ZW1zLCBvbmUgZWFjaCBmb3JcbiAgICogdGhlIHJlZCwgYmx1ZSwgYW5kIGdyZWVuIGRlY2ltYWwgdmFsdWVzLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaGV4IEEgaGV4YWRlY2ltYWwgc3RyaW5nLlxuICAgKlxuICAgKiBAcmV0dXJucyB7QXJyYXkuPG51bWJlcj59IFRoZSBjb252ZXJ0ZWQgQXJyYXkgb2YgUkdCIHZhbHVlcyBpZiBgaGV4YCBpcyBhXG4gICAqIHZhbGlkIHN0cmluZywgb3IgYW4gQXJyYXkgb2YgdGhyZWUgMCdzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gaGV4VG9SR0JBcnJheSAoaGV4KSB7XG5cbiAgICBoZXggPSBoZXgucmVwbGFjZSgvIy8sICcnKTtcblxuICAgIC8vIElmIHRoZSBzdHJpbmcgaXMgYSBzaG9ydGhhbmQgdGhyZWUgZGlnaXQgaGV4IG5vdGF0aW9uLCBub3JtYWxpemUgaXQgdG9cbiAgICAvLyB0aGUgc3RhbmRhcmQgc2l4IGRpZ2l0IG5vdGF0aW9uXG4gICAgaWYgKGhleC5sZW5ndGggPT09IDMpIHtcbiAgICAgIGhleCA9IGhleC5zcGxpdCgnJyk7XG4gICAgICBoZXggPSBoZXhbMF0gKyBoZXhbMF0gKyBoZXhbMV0gKyBoZXhbMV0gKyBoZXhbMl0gKyBoZXhbMl07XG4gICAgfVxuXG4gICAgaGV4VG9SR0JBcnJheV9yZXR1cm5BcnJheVswXSA9IGhleFRvRGVjKGhleC5zdWJzdHIoMCwgMikpO1xuICAgIGhleFRvUkdCQXJyYXlfcmV0dXJuQXJyYXlbMV0gPSBoZXhUb0RlYyhoZXguc3Vic3RyKDIsIDIpKTtcbiAgICBoZXhUb1JHQkFycmF5X3JldHVybkFycmF5WzJdID0gaGV4VG9EZWMoaGV4LnN1YnN0cig0LCAyKSk7XG5cbiAgICByZXR1cm4gaGV4VG9SR0JBcnJheV9yZXR1cm5BcnJheTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0IGEgYmFzZS0xNiBudW1iZXIgdG8gYmFzZS0xMC5cbiAgICpcbiAgICogQHBhcmFtIHtOdW1iZXJ8U3RyaW5nfSBoZXggVGhlIHZhbHVlIHRvIGNvbnZlcnRcbiAgICpcbiAgICogQHJldHVybnMge051bWJlcn0gVGhlIGJhc2UtMTAgZXF1aXZhbGVudCBvZiBgaGV4YC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIGhleFRvRGVjIChoZXgpIHtcbiAgICByZXR1cm4gcGFyc2VJbnQoaGV4LCAxNik7XG4gIH1cblxuICAvKipcbiAgICogUnVucyBhIGZpbHRlciBvcGVyYXRpb24gb24gYWxsIGNodW5rcyBvZiBhIHN0cmluZyB0aGF0IG1hdGNoIGEgUmVnRXhwXG4gICAqXG4gICAqIEBwYXJhbSB7UmVnRXhwfSBwYXR0ZXJuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1bmZpbHRlcmVkU3RyaW5nXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24oc3RyaW5nKX0gZmlsdGVyXG4gICAqXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIGZpbHRlclN0cmluZ0NodW5rcyAocGF0dGVybiwgdW5maWx0ZXJlZFN0cmluZywgZmlsdGVyKSB7XG4gICAgdmFyIHBhdHRlbk1hdGNoZXMgPSB1bmZpbHRlcmVkU3RyaW5nLm1hdGNoKHBhdHRlcm4pO1xuICAgIHZhciBmaWx0ZXJlZFN0cmluZyA9IHVuZmlsdGVyZWRTdHJpbmcucmVwbGFjZShwYXR0ZXJuLCBWQUxVRV9QTEFDRUhPTERFUik7XG5cbiAgICBpZiAocGF0dGVuTWF0Y2hlcykge1xuICAgICAgdmFyIHBhdHRlbk1hdGNoZXNMZW5ndGggPSBwYXR0ZW5NYXRjaGVzLmxlbmd0aDtcbiAgICAgIHZhciBjdXJyZW50Q2h1bms7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0dGVuTWF0Y2hlc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgIGN1cnJlbnRDaHVuayA9IHBhdHRlbk1hdGNoZXMuc2hpZnQoKTtcbiAgICAgICAgZmlsdGVyZWRTdHJpbmcgPSBmaWx0ZXJlZFN0cmluZy5yZXBsYWNlKFxuICAgICAgICAgIFZBTFVFX1BMQUNFSE9MREVSLCBmaWx0ZXIoY3VycmVudENodW5rKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZpbHRlcmVkU3RyaW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGZvciBmbG9hdGluZyBwb2ludCB2YWx1ZXMgd2l0aGluIHJnYiBzdHJpbmdzIGFuZCByb3VuZHMgdGhlbS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZvcm1hdHRlZFN0cmluZ1xuICAgKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBzYW5pdGl6ZVJHQkNodW5rcyAoZm9ybWF0dGVkU3RyaW5nKSB7XG4gICAgcmV0dXJuIGZpbHRlclN0cmluZ0NodW5rcyhSX1JHQiwgZm9ybWF0dGVkU3RyaW5nLCBzYW5pdGl6ZVJHQkNodW5rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcmdiQ2h1bmtcbiAgICpcbiAgICogQHJldHVybiB7c3RyaW5nfVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gc2FuaXRpemVSR0JDaHVuayAocmdiQ2h1bmspIHtcbiAgICB2YXIgbnVtYmVycyA9IHJnYkNodW5rLm1hdGNoKFJfVU5GT1JNQVRURURfVkFMVUVTKTtcbiAgICB2YXIgbnVtYmVyc0xlbmd0aCA9IG51bWJlcnMubGVuZ3RoO1xuICAgIHZhciBzYW5pdGl6ZWRTdHJpbmcgPSByZ2JDaHVuay5tYXRjaChSX1JHQl9QUkVGSVgpWzBdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1iZXJzTGVuZ3RoOyBpKyspIHtcbiAgICAgIHNhbml0aXplZFN0cmluZyArPSBwYXJzZUludChudW1iZXJzW2ldLCAxMCkgKyAnLCc7XG4gICAgfVxuXG4gICAgc2FuaXRpemVkU3RyaW5nID0gc2FuaXRpemVkU3RyaW5nLnNsaWNlKDAsIC0xKSArICcpJztcblxuICAgIHJldHVybiBzYW5pdGl6ZWRTdHJpbmc7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0YXRlT2JqZWN0XG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gQW4gT2JqZWN0IG9mIGZvcm1hdE1hbmlmZXN0cyB0aGF0IGNvcnJlc3BvbmQgdG9cbiAgICogdGhlIHN0cmluZyBwcm9wZXJ0aWVzIG9mIHN0YXRlT2JqZWN0XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBnZXRGb3JtYXRNYW5pZmVzdHMgKHN0YXRlT2JqZWN0KSB7XG4gICAgdmFyIG1hbmlmZXN0QWNjdW11bGF0b3IgPSB7fTtcblxuICAgIFR3ZWVuYWJsZS5lYWNoKHN0YXRlT2JqZWN0LCBmdW5jdGlvbiAocHJvcCkge1xuICAgICAgdmFyIGN1cnJlbnRQcm9wID0gc3RhdGVPYmplY3RbcHJvcF07XG5cbiAgICAgIGlmICh0eXBlb2YgY3VycmVudFByb3AgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHZhciByYXdWYWx1ZXMgPSBnZXRWYWx1ZXNGcm9tKGN1cnJlbnRQcm9wKTtcblxuICAgICAgICBtYW5pZmVzdEFjY3VtdWxhdG9yW3Byb3BdID0ge1xuICAgICAgICAgICdmb3JtYXRTdHJpbmcnOiBnZXRGb3JtYXRTdHJpbmdGcm9tKGN1cnJlbnRQcm9wKVxuICAgICAgICAgICwnY2h1bmtOYW1lcyc6IGdldEZvcm1hdENodW5rc0Zyb20ocmF3VmFsdWVzLCBwcm9wKVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG1hbmlmZXN0QWNjdW11bGF0b3I7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0YXRlT2JqZWN0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBmb3JtYXRNYW5pZmVzdHNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIGV4cGFuZEZvcm1hdHRlZFByb3BlcnRpZXMgKHN0YXRlT2JqZWN0LCBmb3JtYXRNYW5pZmVzdHMpIHtcbiAgICBUd2VlbmFibGUuZWFjaChmb3JtYXRNYW5pZmVzdHMsIGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgICB2YXIgY3VycmVudFByb3AgPSBzdGF0ZU9iamVjdFtwcm9wXTtcbiAgICAgIHZhciByYXdWYWx1ZXMgPSBnZXRWYWx1ZXNGcm9tKGN1cnJlbnRQcm9wKTtcbiAgICAgIHZhciByYXdWYWx1ZXNMZW5ndGggPSByYXdWYWx1ZXMubGVuZ3RoO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhd1ZhbHVlc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgIHN0YXRlT2JqZWN0W2Zvcm1hdE1hbmlmZXN0c1twcm9wXS5jaHVua05hbWVzW2ldXSA9ICtyYXdWYWx1ZXNbaV07XG4gICAgICB9XG5cbiAgICAgIGRlbGV0ZSBzdGF0ZU9iamVjdFtwcm9wXTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGVPYmplY3RcbiAgICogQHBhcmFtIHtPYmplY3R9IGZvcm1hdE1hbmlmZXN0c1xuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gY29sbGFwc2VGb3JtYXR0ZWRQcm9wZXJ0aWVzIChzdGF0ZU9iamVjdCwgZm9ybWF0TWFuaWZlc3RzKSB7XG4gICAgVHdlZW5hYmxlLmVhY2goZm9ybWF0TWFuaWZlc3RzLCBmdW5jdGlvbiAocHJvcCkge1xuICAgICAgdmFyIGN1cnJlbnRQcm9wID0gc3RhdGVPYmplY3RbcHJvcF07XG4gICAgICB2YXIgZm9ybWF0Q2h1bmtzID0gZXh0cmFjdFByb3BlcnR5Q2h1bmtzKFxuICAgICAgICBzdGF0ZU9iamVjdCwgZm9ybWF0TWFuaWZlc3RzW3Byb3BdLmNodW5rTmFtZXMpO1xuICAgICAgdmFyIHZhbHVlc0xpc3QgPSBnZXRWYWx1ZXNMaXN0KFxuICAgICAgICBmb3JtYXRDaHVua3MsIGZvcm1hdE1hbmlmZXN0c1twcm9wXS5jaHVua05hbWVzKTtcbiAgICAgIGN1cnJlbnRQcm9wID0gZ2V0Rm9ybWF0dGVkVmFsdWVzKFxuICAgICAgICBmb3JtYXRNYW5pZmVzdHNbcHJvcF0uZm9ybWF0U3RyaW5nLCB2YWx1ZXNMaXN0KTtcbiAgICAgIHN0YXRlT2JqZWN0W3Byb3BdID0gc2FuaXRpemVSR0JDaHVua3MoY3VycmVudFByb3ApO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZU9iamVjdFxuICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBjaHVua05hbWVzXG4gICAqXG4gICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGV4dHJhY3RlZCB2YWx1ZSBjaHVua3MuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBleHRyYWN0UHJvcGVydHlDaHVua3MgKHN0YXRlT2JqZWN0LCBjaHVua05hbWVzKSB7XG4gICAgdmFyIGV4dHJhY3RlZFZhbHVlcyA9IHt9O1xuICAgIHZhciBjdXJyZW50Q2h1bmtOYW1lLCBjaHVua05hbWVzTGVuZ3RoID0gY2h1bmtOYW1lcy5sZW5ndGg7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNodW5rTmFtZXNMZW5ndGg7IGkrKykge1xuICAgICAgY3VycmVudENodW5rTmFtZSA9IGNodW5rTmFtZXNbaV07XG4gICAgICBleHRyYWN0ZWRWYWx1ZXNbY3VycmVudENodW5rTmFtZV0gPSBzdGF0ZU9iamVjdFtjdXJyZW50Q2h1bmtOYW1lXTtcbiAgICAgIGRlbGV0ZSBzdGF0ZU9iamVjdFtjdXJyZW50Q2h1bmtOYW1lXTtcbiAgICB9XG5cbiAgICByZXR1cm4gZXh0cmFjdGVkVmFsdWVzO1xuICB9XG5cbiAgdmFyIGdldFZhbHVlc0xpc3RfYWNjdW11bGF0b3IgPSBbXTtcbiAgLyoqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZU9iamVjdFxuICAgKiBAcGFyYW0ge0FycmF5LjxzdHJpbmc+fSBjaHVua05hbWVzXG4gICAqXG4gICAqIEByZXR1cm4ge0FycmF5LjxudW1iZXI+fVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0VmFsdWVzTGlzdCAoc3RhdGVPYmplY3QsIGNodW5rTmFtZXMpIHtcbiAgICBnZXRWYWx1ZXNMaXN0X2FjY3VtdWxhdG9yLmxlbmd0aCA9IDA7XG4gICAgdmFyIGNodW5rTmFtZXNMZW5ndGggPSBjaHVua05hbWVzLmxlbmd0aDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2h1bmtOYW1lc0xlbmd0aDsgaSsrKSB7XG4gICAgICBnZXRWYWx1ZXNMaXN0X2FjY3VtdWxhdG9yLnB1c2goc3RhdGVPYmplY3RbY2h1bmtOYW1lc1tpXV0pO1xuICAgIH1cblxuICAgIHJldHVybiBnZXRWYWx1ZXNMaXN0X2FjY3VtdWxhdG9yO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmb3JtYXRTdHJpbmdcbiAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gcmF3VmFsdWVzXG4gICAqXG4gICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIGdldEZvcm1hdHRlZFZhbHVlcyAoZm9ybWF0U3RyaW5nLCByYXdWYWx1ZXMpIHtcbiAgICB2YXIgZm9ybWF0dGVkVmFsdWVTdHJpbmcgPSBmb3JtYXRTdHJpbmc7XG4gICAgdmFyIHJhd1ZhbHVlc0xlbmd0aCA9IHJhd1ZhbHVlcy5sZW5ndGg7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhd1ZhbHVlc0xlbmd0aDsgaSsrKSB7XG4gICAgICBmb3JtYXR0ZWRWYWx1ZVN0cmluZyA9IGZvcm1hdHRlZFZhbHVlU3RyaW5nLnJlcGxhY2UoXG4gICAgICAgIFZBTFVFX1BMQUNFSE9MREVSLCArcmF3VmFsdWVzW2ldLnRvRml4ZWQoNCkpO1xuICAgIH1cblxuICAgIHJldHVybiBmb3JtYXR0ZWRWYWx1ZVN0cmluZztcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3RlOiBJdCdzIHRoZSBkdXR5IG9mIHRoZSBjYWxsZXIgdG8gY29udmVydCB0aGUgQXJyYXkgZWxlbWVudHMgb2YgdGhlXG4gICAqIHJldHVybiB2YWx1ZSBpbnRvIG51bWJlcnMuICBUaGlzIGlzIGEgcGVyZm9ybWFuY2Ugb3B0aW1pemF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZm9ybWF0dGVkU3RyaW5nXG4gICAqXG4gICAqIEByZXR1cm4ge0FycmF5LjxzdHJpbmc+fG51bGx9XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBmdW5jdGlvbiBnZXRWYWx1ZXNGcm9tIChmb3JtYXR0ZWRTdHJpbmcpIHtcbiAgICByZXR1cm4gZm9ybWF0dGVkU3RyaW5nLm1hdGNoKFJfVU5GT1JNQVRURURfVkFMVUVTKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge09iamVjdH0gZWFzaW5nT2JqZWN0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSB0b2tlbkRhdGFcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIGV4cGFuZEVhc2luZ09iamVjdCAoZWFzaW5nT2JqZWN0LCB0b2tlbkRhdGEpIHtcbiAgICBUd2VlbmFibGUuZWFjaCh0b2tlbkRhdGEsIGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgICB2YXIgY3VycmVudFByb3AgPSB0b2tlbkRhdGFbcHJvcF07XG4gICAgICB2YXIgY2h1bmtOYW1lcyA9IGN1cnJlbnRQcm9wLmNodW5rTmFtZXM7XG4gICAgICB2YXIgY2h1bmtMZW5ndGggPSBjaHVua05hbWVzLmxlbmd0aDtcblxuICAgICAgdmFyIGVhc2luZyA9IGVhc2luZ09iamVjdFtwcm9wXTtcbiAgICAgIHZhciBpO1xuXG4gICAgICBpZiAodHlwZW9mIGVhc2luZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdmFyIGVhc2luZ0NodW5rcyA9IGVhc2luZy5zcGxpdCgnICcpO1xuICAgICAgICB2YXIgbGFzdEVhc2luZ0NodW5rID0gZWFzaW5nQ2h1bmtzW2Vhc2luZ0NodW5rcy5sZW5ndGggLSAxXTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2h1bmtMZW5ndGg7IGkrKykge1xuICAgICAgICAgIGVhc2luZ09iamVjdFtjaHVua05hbWVzW2ldXSA9IGVhc2luZ0NodW5rc1tpXSB8fCBsYXN0RWFzaW5nQ2h1bms7XG4gICAgICAgIH1cblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNodW5rTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBlYXNpbmdPYmplY3RbY2h1bmtOYW1lc1tpXV0gPSBlYXNpbmc7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZGVsZXRlIGVhc2luZ09iamVjdFtwcm9wXTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge09iamVjdH0gZWFzaW5nT2JqZWN0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSB0b2tlbkRhdGFcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGZ1bmN0aW9uIGNvbGxhcHNlRWFzaW5nT2JqZWN0IChlYXNpbmdPYmplY3QsIHRva2VuRGF0YSkge1xuICAgIFR3ZWVuYWJsZS5lYWNoKHRva2VuRGF0YSwgZnVuY3Rpb24gKHByb3ApIHtcbiAgICAgIHZhciBjdXJyZW50UHJvcCA9IHRva2VuRGF0YVtwcm9wXTtcbiAgICAgIHZhciBjaHVua05hbWVzID0gY3VycmVudFByb3AuY2h1bmtOYW1lcztcbiAgICAgIHZhciBjaHVua0xlbmd0aCA9IGNodW5rTmFtZXMubGVuZ3RoO1xuXG4gICAgICB2YXIgZmlyc3RFYXNpbmcgPSBlYXNpbmdPYmplY3RbY2h1bmtOYW1lc1swXV07XG4gICAgICB2YXIgdHlwZW9mRWFzaW5ncyA9IHR5cGVvZiBmaXJzdEVhc2luZztcblxuICAgICAgaWYgKHR5cGVvZkVhc2luZ3MgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHZhciBjb21wb3NlZEVhc2luZ1N0cmluZyA9ICcnO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2h1bmtMZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbXBvc2VkRWFzaW5nU3RyaW5nICs9ICcgJyArIGVhc2luZ09iamVjdFtjaHVua05hbWVzW2ldXTtcbiAgICAgICAgICBkZWxldGUgZWFzaW5nT2JqZWN0W2NodW5rTmFtZXNbaV1dO1xuICAgICAgICB9XG5cbiAgICAgICAgZWFzaW5nT2JqZWN0W3Byb3BdID0gY29tcG9zZWRFYXNpbmdTdHJpbmcuc3Vic3RyKDEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWFzaW5nT2JqZWN0W3Byb3BdID0gZmlyc3RFYXNpbmc7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBUd2VlbmFibGUucHJvdG90eXBlLmZpbHRlci50b2tlbiA9IHtcbiAgICAndHdlZW5DcmVhdGVkJzogZnVuY3Rpb24gKGN1cnJlbnRTdGF0ZSwgZnJvbVN0YXRlLCB0b1N0YXRlLCBlYXNpbmdPYmplY3QpIHtcbiAgICAgIHNhbml0aXplT2JqZWN0Rm9ySGV4UHJvcHMoY3VycmVudFN0YXRlKTtcbiAgICAgIHNhbml0aXplT2JqZWN0Rm9ySGV4UHJvcHMoZnJvbVN0YXRlKTtcbiAgICAgIHNhbml0aXplT2JqZWN0Rm9ySGV4UHJvcHModG9TdGF0ZSk7XG4gICAgICB0aGlzLl90b2tlbkRhdGEgPSBnZXRGb3JtYXRNYW5pZmVzdHMoY3VycmVudFN0YXRlKTtcbiAgICB9LFxuXG4gICAgJ2JlZm9yZVR3ZWVuJzogZnVuY3Rpb24gKGN1cnJlbnRTdGF0ZSwgZnJvbVN0YXRlLCB0b1N0YXRlLCBlYXNpbmdPYmplY3QpIHtcbiAgICAgIGV4cGFuZEVhc2luZ09iamVjdChlYXNpbmdPYmplY3QsIHRoaXMuX3Rva2VuRGF0YSk7XG4gICAgICBleHBhbmRGb3JtYXR0ZWRQcm9wZXJ0aWVzKGN1cnJlbnRTdGF0ZSwgdGhpcy5fdG9rZW5EYXRhKTtcbiAgICAgIGV4cGFuZEZvcm1hdHRlZFByb3BlcnRpZXMoZnJvbVN0YXRlLCB0aGlzLl90b2tlbkRhdGEpO1xuICAgICAgZXhwYW5kRm9ybWF0dGVkUHJvcGVydGllcyh0b1N0YXRlLCB0aGlzLl90b2tlbkRhdGEpO1xuICAgIH0sXG5cbiAgICAnYWZ0ZXJUd2Vlbic6IGZ1bmN0aW9uIChjdXJyZW50U3RhdGUsIGZyb21TdGF0ZSwgdG9TdGF0ZSwgZWFzaW5nT2JqZWN0KSB7XG4gICAgICBjb2xsYXBzZUZvcm1hdHRlZFByb3BlcnRpZXMoY3VycmVudFN0YXRlLCB0aGlzLl90b2tlbkRhdGEpO1xuICAgICAgY29sbGFwc2VGb3JtYXR0ZWRQcm9wZXJ0aWVzKGZyb21TdGF0ZSwgdGhpcy5fdG9rZW5EYXRhKTtcbiAgICAgIGNvbGxhcHNlRm9ybWF0dGVkUHJvcGVydGllcyh0b1N0YXRlLCB0aGlzLl90b2tlbkRhdGEpO1xuICAgICAgY29sbGFwc2VFYXNpbmdPYmplY3QoZWFzaW5nT2JqZWN0LCB0aGlzLl90b2tlbkRhdGEpO1xuICAgIH1cbiAgfTtcblxufSAoVHdlZW5hYmxlKSk7XG5cbn0pLmNhbGwobnVsbCk7XG4iLCIhZnVuY3Rpb24odCxlKXtcIm9iamVjdFwiPT10eXBlb2YgZXhwb3J0cyYmXCJvYmplY3RcIj09dHlwZW9mIG1vZHVsZT9tb2R1bGUuZXhwb3J0cz1lKCk6XCJmdW5jdGlvblwiPT10eXBlb2YgZGVmaW5lJiZkZWZpbmUuYW1kP2RlZmluZShbXSxlKTpcIm9iamVjdFwiPT10eXBlb2YgZXhwb3J0cz9leHBvcnRzLlNjcm9sbGJhcj1lKCk6dC5TY3JvbGxiYXI9ZSgpfSh0aGlzLGZ1bmN0aW9uKCl7cmV0dXJuIGZ1bmN0aW9uKHQpe2Z1bmN0aW9uIGUocil7aWYobltyXSlyZXR1cm4gbltyXS5leHBvcnRzO3ZhciBvPW5bcl09e2V4cG9ydHM6e30saWQ6cixsb2FkZWQ6ITF9O3JldHVybiB0W3JdLmNhbGwoby5leHBvcnRzLG8sby5leHBvcnRzLGUpLG8ubG9hZGVkPSEwLG8uZXhwb3J0c312YXIgbj17fTtyZXR1cm4gZS5tPXQsZS5jPW4sZS5wPVwiXCIsZSgwKX0oW2Z1bmN0aW9uKHQsZSxuKXt0LmV4cG9ydHM9bigxKX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fWZ1bmN0aW9uIG8odCl7aWYoQXJyYXkuaXNBcnJheSh0KSl7Zm9yKHZhciBlPTAsbj1BcnJheSh0Lmxlbmd0aCk7ZTx0Lmxlbmd0aDtlKyspbltlXT10W2VdO3JldHVybiBufXJldHVybigwLHUuZGVmYXVsdCkodCl9dmFyIGk9bigyKSx1PXIoaSksYT1uKDU1KSxjPXIoYSksbD1uKDYyKSxmPXIobCk7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSk7dmFyIHM9XCJmdW5jdGlvblwiPT10eXBlb2YgZi5kZWZhdWx0JiZcInN5bWJvbFwiPT10eXBlb2YgYy5kZWZhdWx0P2Z1bmN0aW9uKHQpe3JldHVybiB0eXBlb2YgdH06ZnVuY3Rpb24odCl7cmV0dXJuIHQmJlwiZnVuY3Rpb25cIj09dHlwZW9mIGYuZGVmYXVsdCYmdC5jb25zdHJ1Y3Rvcj09PWYuZGVmYXVsdCYmdCE9PWYuZGVmYXVsdC5wcm90b3R5cGU/XCJzeW1ib2xcIjp0eXBlb2YgdH0sZD1uKDc4KSxoPW4oODkpO24oMTI5KSxuKDE0NSksbigxNTgpLG4oMTczKSxuKDE4NyksZS5kZWZhdWx0PWQuU21vb3RoU2Nyb2xsYmFyLGQuU21vb3RoU2Nyb2xsYmFyLnZlcnNpb249XCI3LjQuMVwiLGQuU21vb3RoU2Nyb2xsYmFyLmluaXQ9ZnVuY3Rpb24odCxlKXtpZighdHx8MSE9PXQubm9kZVR5cGUpdGhyb3cgbmV3IFR5cGVFcnJvcihcImV4cGVjdCBlbGVtZW50IHRvIGJlIERPTSBFbGVtZW50LCBidXQgZ290IFwiKyhcInVuZGVmaW5lZFwiPT10eXBlb2YgdD9cInVuZGVmaW5lZFwiOnModCkpKTtpZihoLnNiTGlzdC5oYXModCkpcmV0dXJuIGguc2JMaXN0LmdldCh0KTt0LnNldEF0dHJpYnV0ZShcImRhdGEtc2Nyb2xsYmFyXCIsXCJcIik7dmFyIG49W10uY29uY2F0KG8odC5jaGlsZE5vZGVzKSkscj1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO3IuaW5uZXJIVE1MPSdcXG4gICAgICAgIDxkaXYgY2xhc3M9XCJzY3JvbGwtY29udGVudFwiPjwvZGl2PlxcbiAgICAgICAgPGRpdiBjbGFzcz1cInNjcm9sbGJhci10cmFjayBzY3JvbGxiYXItdHJhY2steFwiPlxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzY3JvbGxiYXItdGh1bWIgc2Nyb2xsYmFyLXRodW1iLXhcIj48L2Rpdj5cXG4gICAgICAgIDwvZGl2PlxcbiAgICAgICAgPGRpdiBjbGFzcz1cInNjcm9sbGJhci10cmFjayBzY3JvbGxiYXItdHJhY2steVwiPlxcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzY3JvbGxiYXItdGh1bWIgc2Nyb2xsYmFyLXRodW1iLXlcIj48L2Rpdj5cXG4gICAgICAgIDwvZGl2PlxcbiAgICAgICAgPGNhbnZhcyBjbGFzcz1cIm92ZXJzY3JvbGwtZ2xvd1wiPjwvY2FudmFzPlxcbiAgICAnO3ZhciBpPXIucXVlcnlTZWxlY3RvcihcIi5zY3JvbGwtY29udGVudFwiKTtyZXR1cm5bXS5jb25jYXQobyhyLmNoaWxkTm9kZXMpKS5mb3JFYWNoKGZ1bmN0aW9uKGUpe3JldHVybiB0LmFwcGVuZENoaWxkKGUpfSksbi5mb3JFYWNoKGZ1bmN0aW9uKHQpe3JldHVybiBpLmFwcGVuZENoaWxkKHQpfSksbmV3IGQuU21vb3RoU2Nyb2xsYmFyKHQsZSl9LGQuU21vb3RoU2Nyb2xsYmFyLmluaXRBbGw9ZnVuY3Rpb24odCl7cmV0dXJuW10uY29uY2F0KG8oZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChoLnNlbGVjdG9ycykpKS5tYXAoZnVuY3Rpb24oZSl7cmV0dXJuIGQuU21vb3RoU2Nyb2xsYmFyLmluaXQoZSx0KX0pfSxkLlNtb290aFNjcm9sbGJhci5oYXM9ZnVuY3Rpb24odCl7cmV0dXJuIGguc2JMaXN0Lmhhcyh0KX0sZC5TbW9vdGhTY3JvbGxiYXIuZ2V0PWZ1bmN0aW9uKHQpe3JldHVybiBoLnNiTGlzdC5nZXQodCl9LGQuU21vb3RoU2Nyb2xsYmFyLmdldEFsbD1mdW5jdGlvbigpe3JldHVybltdLmNvbmNhdChvKGguc2JMaXN0LnZhbHVlcygpKSl9LGQuU21vb3RoU2Nyb2xsYmFyLmRlc3Ryb3k9ZnVuY3Rpb24odCxlKXtyZXR1cm4gZC5TbW9vdGhTY3JvbGxiYXIuaGFzKHQpJiZkLlNtb290aFNjcm9sbGJhci5nZXQodCkuZGVzdHJveShlKX0sZC5TbW9vdGhTY3JvbGxiYXIuZGVzdHJveUFsbD1mdW5jdGlvbih0KXtoLnNiTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKGUpe2UuZGVzdHJveSh0KX0pfSx0LmV4cG9ydHM9ZS5kZWZhdWx0fSxmdW5jdGlvbih0LGUsbil7dC5leHBvcnRzPXtkZWZhdWx0Om4oMyksX19lc01vZHVsZTohMH19LGZ1bmN0aW9uKHQsZSxuKXtuKDQpLG4oNDgpLHQuZXhwb3J0cz1uKDEyKS5BcnJheS5mcm9tfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHI9big1KSghMCk7big4KShTdHJpbmcsXCJTdHJpbmdcIixmdW5jdGlvbih0KXt0aGlzLl90PVN0cmluZyh0KSx0aGlzLl9pPTB9LGZ1bmN0aW9uKCl7dmFyIHQsZT10aGlzLl90LG49dGhpcy5faTtyZXR1cm4gbj49ZS5sZW5ndGg/e3ZhbHVlOnZvaWQgMCxkb25lOiEwfToodD1yKGUsbiksdGhpcy5faSs9dC5sZW5ndGgse3ZhbHVlOnQsZG9uZTohMX0pfSl9LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDYpLG89big3KTt0LmV4cG9ydHM9ZnVuY3Rpb24odCl7cmV0dXJuIGZ1bmN0aW9uKGUsbil7dmFyIGksdSxhPVN0cmluZyhvKGUpKSxjPXIobiksbD1hLmxlbmd0aDtyZXR1cm4gYzwwfHxjPj1sP3Q/XCJcIjp2b2lkIDA6KGk9YS5jaGFyQ29kZUF0KGMpLGk8NTUyOTZ8fGk+NTYzMTl8fGMrMT09PWx8fCh1PWEuY2hhckNvZGVBdChjKzEpKTw1NjMyMHx8dT41NzM0Mz90P2EuY2hhckF0KGMpOmk6dD9hLnNsaWNlKGMsYysyKTooaS01NTI5Njw8MTApKyh1LTU2MzIwKSs2NTUzNil9fX0sZnVuY3Rpb24odCxlKXt2YXIgbj1NYXRoLmNlaWwscj1NYXRoLmZsb29yO3QuZXhwb3J0cz1mdW5jdGlvbih0KXtyZXR1cm4gaXNOYU4odD0rdCk/MDoodD4wP3I6bikodCl9fSxmdW5jdGlvbih0LGUpe3QuZXhwb3J0cz1mdW5jdGlvbih0KXtpZih2b2lkIDA9PXQpdGhyb3cgVHlwZUVycm9yKFwiQ2FuJ3QgY2FsbCBtZXRob2Qgb24gIFwiK3QpO3JldHVybiB0fX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO3ZhciByPW4oOSksbz1uKDEwKSxpPW4oMjUpLHU9bigxNSksYT1uKDI2KSxjPW4oMjcpLGw9bigyOCksZj1uKDQ0KSxzPW4oNDYpLGQ9big0NSkoXCJpdGVyYXRvclwiKSxoPSEoW10ua2V5cyYmXCJuZXh0XCJpbltdLmtleXMoKSksdj1cIkBAaXRlcmF0b3JcIixfPVwia2V5c1wiLHA9XCJ2YWx1ZXNcIix5PWZ1bmN0aW9uKCl7cmV0dXJuIHRoaXN9O3QuZXhwb3J0cz1mdW5jdGlvbih0LGUsbixiLGcsbSx4KXtsKG4sZSxiKTt2YXIgUyxFLE0sTz1mdW5jdGlvbih0KXtpZighaCYmdCBpbiBqKXJldHVybiBqW3RdO3N3aXRjaCh0KXtjYXNlIF86cmV0dXJuIGZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBuKHRoaXMsdCl9O2Nhc2UgcDpyZXR1cm4gZnVuY3Rpb24oKXtyZXR1cm4gbmV3IG4odGhpcyx0KX19cmV0dXJuIGZ1bmN0aW9uKCl7cmV0dXJuIG5ldyBuKHRoaXMsdCl9fSx3PWUrXCIgSXRlcmF0b3JcIixQPWc9PXAsaz0hMSxqPXQucHJvdG90eXBlLFQ9altkXXx8alt2XXx8ZyYmaltnXSxBPVR8fE8oZyksUj1nP1A/TyhcImVudHJpZXNcIik6QTp2b2lkIDAsTD1cIkFycmF5XCI9PWU/ai5lbnRyaWVzfHxUOlQ7aWYoTCYmKE09cyhMLmNhbGwobmV3IHQpKSxNIT09T2JqZWN0LnByb3RvdHlwZSYmKGYoTSx3LCEwKSxyfHxhKE0sZCl8fHUoTSxkLHkpKSksUCYmVCYmVC5uYW1lIT09cCYmKGs9ITAsQT1mdW5jdGlvbigpe3JldHVybiBULmNhbGwodGhpcyl9KSxyJiYheHx8IWgmJiFrJiZqW2RdfHx1KGosZCxBKSxjW2VdPUEsY1t3XT15LGcpaWYoUz17dmFsdWVzOlA/QTpPKHApLGtleXM6bT9BOk8oXyksZW50cmllczpSfSx4KWZvcihFIGluIFMpRSBpbiBqfHxpKGosRSxTW0VdKTtlbHNlIG8oby5QK28uRiooaHx8ayksZSxTKTtyZXR1cm4gU319LGZ1bmN0aW9uKHQsZSl7dC5leHBvcnRzPSEwfSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigxMSksbz1uKDEyKSxpPW4oMTMpLHU9bigxNSksYT1cInByb3RvdHlwZVwiLGM9ZnVuY3Rpb24odCxlLG4pe3ZhciBsLGYscyxkPXQmYy5GLGg9dCZjLkcsdj10JmMuUyxfPXQmYy5QLHA9dCZjLkIseT10JmMuVyxiPWg/bzpvW2VdfHwob1tlXT17fSksZz1iW2FdLG09aD9yOnY/cltlXToocltlXXx8e30pW2FdO2gmJihuPWUpO2ZvcihsIGluIG4pZj0hZCYmbSYmdm9pZCAwIT09bVtsXSxmJiZsIGluIGJ8fChzPWY/bVtsXTpuW2xdLGJbbF09aCYmXCJmdW5jdGlvblwiIT10eXBlb2YgbVtsXT9uW2xdOnAmJmY/aShzLHIpOnkmJm1bbF09PXM/ZnVuY3Rpb24odCl7dmFyIGU9ZnVuY3Rpb24oZSxuLHIpe2lmKHRoaXMgaW5zdGFuY2VvZiB0KXtzd2l0Y2goYXJndW1lbnRzLmxlbmd0aCl7Y2FzZSAwOnJldHVybiBuZXcgdDtjYXNlIDE6cmV0dXJuIG5ldyB0KGUpO2Nhc2UgMjpyZXR1cm4gbmV3IHQoZSxuKX1yZXR1cm4gbmV3IHQoZSxuLHIpfXJldHVybiB0LmFwcGx5KHRoaXMsYXJndW1lbnRzKX07cmV0dXJuIGVbYV09dFthXSxlfShzKTpfJiZcImZ1bmN0aW9uXCI9PXR5cGVvZiBzP2koRnVuY3Rpb24uY2FsbCxzKTpzLF8mJigoYi52aXJ0dWFsfHwoYi52aXJ0dWFsPXt9KSlbbF09cyx0JmMuUiYmZyYmIWdbbF0mJnUoZyxsLHMpKSl9O2MuRj0xLGMuRz0yLGMuUz00LGMuUD04LGMuQj0xNixjLlc9MzIsYy5VPTY0LGMuUj0xMjgsdC5leHBvcnRzPWN9LGZ1bmN0aW9uKHQsZSl7dmFyIG49dC5leHBvcnRzPVwidW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3cmJndpbmRvdy5NYXRoPT1NYXRoP3dpbmRvdzpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZiYmc2VsZi5NYXRoPT1NYXRoP3NlbGY6RnVuY3Rpb24oXCJyZXR1cm4gdGhpc1wiKSgpO1wibnVtYmVyXCI9PXR5cGVvZiBfX2cmJihfX2c9bil9LGZ1bmN0aW9uKHQsZSl7dmFyIG49dC5leHBvcnRzPXt2ZXJzaW9uOlwiMi40LjBcIn07XCJudW1iZXJcIj09dHlwZW9mIF9fZSYmKF9fZT1uKX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMTQpO3QuZXhwb3J0cz1mdW5jdGlvbih0LGUsbil7aWYocih0KSx2b2lkIDA9PT1lKXJldHVybiB0O3N3aXRjaChuKXtjYXNlIDE6cmV0dXJuIGZ1bmN0aW9uKG4pe3JldHVybiB0LmNhbGwoZSxuKX07Y2FzZSAyOnJldHVybiBmdW5jdGlvbihuLHIpe3JldHVybiB0LmNhbGwoZSxuLHIpfTtjYXNlIDM6cmV0dXJuIGZ1bmN0aW9uKG4scixvKXtyZXR1cm4gdC5jYWxsKGUsbixyLG8pfX1yZXR1cm4gZnVuY3Rpb24oKXtyZXR1cm4gdC5hcHBseShlLGFyZ3VtZW50cyl9fX0sZnVuY3Rpb24odCxlKXt0LmV4cG9ydHM9ZnVuY3Rpb24odCl7aWYoXCJmdW5jdGlvblwiIT10eXBlb2YgdCl0aHJvdyBUeXBlRXJyb3IodCtcIiBpcyBub3QgYSBmdW5jdGlvbiFcIik7cmV0dXJuIHR9fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigxNiksbz1uKDI0KTt0LmV4cG9ydHM9bigyMCk/ZnVuY3Rpb24odCxlLG4pe3JldHVybiByLmYodCxlLG8oMSxuKSl9OmZ1bmN0aW9uKHQsZSxuKXtyZXR1cm4gdFtlXT1uLHR9fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigxNyksbz1uKDE5KSxpPW4oMjMpLHU9T2JqZWN0LmRlZmluZVByb3BlcnR5O2UuZj1uKDIwKT9PYmplY3QuZGVmaW5lUHJvcGVydHk6ZnVuY3Rpb24odCxlLG4pe2lmKHIodCksZT1pKGUsITApLHIobiksbyl0cnl7cmV0dXJuIHUodCxlLG4pfWNhdGNoKHQpe31pZihcImdldFwiaW4gbnx8XCJzZXRcImluIG4pdGhyb3cgVHlwZUVycm9yKFwiQWNjZXNzb3JzIG5vdCBzdXBwb3J0ZWQhXCIpO3JldHVyblwidmFsdWVcImluIG4mJih0W2VdPW4udmFsdWUpLHR9fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigxOCk7dC5leHBvcnRzPWZ1bmN0aW9uKHQpe2lmKCFyKHQpKXRocm93IFR5cGVFcnJvcih0K1wiIGlzIG5vdCBhbiBvYmplY3QhXCIpO3JldHVybiB0fX0sZnVuY3Rpb24odCxlKXt0LmV4cG9ydHM9ZnVuY3Rpb24odCl7cmV0dXJuXCJvYmplY3RcIj09dHlwZW9mIHQ/bnVsbCE9PXQ6XCJmdW5jdGlvblwiPT10eXBlb2YgdH19LGZ1bmN0aW9uKHQsZSxuKXt0LmV4cG9ydHM9IW4oMjApJiYhbigyMSkoZnVuY3Rpb24oKXtyZXR1cm4gNyE9T2JqZWN0LmRlZmluZVByb3BlcnR5KG4oMjIpKFwiZGl2XCIpLFwiYVwiLHtnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gN319KS5hfSl9LGZ1bmN0aW9uKHQsZSxuKXt0LmV4cG9ydHM9IW4oMjEpKGZ1bmN0aW9uKCl7cmV0dXJuIDchPU9iamVjdC5kZWZpbmVQcm9wZXJ0eSh7fSxcImFcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIDd9fSkuYX0pfSxmdW5jdGlvbih0LGUpe3QuZXhwb3J0cz1mdW5jdGlvbih0KXt0cnl7cmV0dXJuISF0KCl9Y2F0Y2godCl7cmV0dXJuITB9fX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMTgpLG89bigxMSkuZG9jdW1lbnQsaT1yKG8pJiZyKG8uY3JlYXRlRWxlbWVudCk7dC5leHBvcnRzPWZ1bmN0aW9uKHQpe3JldHVybiBpP28uY3JlYXRlRWxlbWVudCh0KTp7fX19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDE4KTt0LmV4cG9ydHM9ZnVuY3Rpb24odCxlKXtpZighcih0KSlyZXR1cm4gdDt2YXIgbixvO2lmKGUmJlwiZnVuY3Rpb25cIj09dHlwZW9mKG49dC50b1N0cmluZykmJiFyKG89bi5jYWxsKHQpKSlyZXR1cm4gbztpZihcImZ1bmN0aW9uXCI9PXR5cGVvZihuPXQudmFsdWVPZikmJiFyKG89bi5jYWxsKHQpKSlyZXR1cm4gbztpZighZSYmXCJmdW5jdGlvblwiPT10eXBlb2Yobj10LnRvU3RyaW5nKSYmIXIobz1uLmNhbGwodCkpKXJldHVybiBvO3Rocm93IFR5cGVFcnJvcihcIkNhbid0IGNvbnZlcnQgb2JqZWN0IHRvIHByaW1pdGl2ZSB2YWx1ZVwiKX19LGZ1bmN0aW9uKHQsZSl7dC5leHBvcnRzPWZ1bmN0aW9uKHQsZSl7cmV0dXJue2VudW1lcmFibGU6ISgxJnQpLGNvbmZpZ3VyYWJsZTohKDImdCksd3JpdGFibGU6ISg0JnQpLHZhbHVlOmV9fX0sZnVuY3Rpb24odCxlLG4pe3QuZXhwb3J0cz1uKDE1KX0sZnVuY3Rpb24odCxlKXt2YXIgbj17fS5oYXNPd25Qcm9wZXJ0eTt0LmV4cG9ydHM9ZnVuY3Rpb24odCxlKXtyZXR1cm4gbi5jYWxsKHQsZSl9fSxmdW5jdGlvbih0LGUpe3QuZXhwb3J0cz17fX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO3ZhciByPW4oMjkpLG89bigyNCksaT1uKDQ0KSx1PXt9O24oMTUpKHUsbig0NSkoXCJpdGVyYXRvclwiKSxmdW5jdGlvbigpe3JldHVybiB0aGlzfSksdC5leHBvcnRzPWZ1bmN0aW9uKHQsZSxuKXt0LnByb3RvdHlwZT1yKHUse25leHQ6bygxLG4pfSksaSh0LGUrXCIgSXRlcmF0b3JcIil9fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigxNyksbz1uKDMwKSxpPW4oNDIpLHU9bigzOSkoXCJJRV9QUk9UT1wiKSxhPWZ1bmN0aW9uKCl7fSxjPVwicHJvdG90eXBlXCIsbD1mdW5jdGlvbigpe3ZhciB0LGU9bigyMikoXCJpZnJhbWVcIikscj1pLmxlbmd0aCxvPVwiPFwiLHU9XCI+XCI7Zm9yKGUuc3R5bGUuZGlzcGxheT1cIm5vbmVcIixuKDQzKS5hcHBlbmRDaGlsZChlKSxlLnNyYz1cImphdmFzY3JpcHQ6XCIsdD1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQsdC5vcGVuKCksdC53cml0ZShvK1wic2NyaXB0XCIrdStcImRvY3VtZW50LkY9T2JqZWN0XCIrbytcIi9zY3JpcHRcIit1KSx0LmNsb3NlKCksbD10LkY7ci0tOylkZWxldGUgbFtjXVtpW3JdXTtyZXR1cm4gbCgpfTt0LmV4cG9ydHM9T2JqZWN0LmNyZWF0ZXx8ZnVuY3Rpb24odCxlKXt2YXIgbjtyZXR1cm4gbnVsbCE9PXQ/KGFbY109cih0KSxuPW5ldyBhLGFbY109bnVsbCxuW3VdPXQpOm49bCgpLHZvaWQgMD09PWU/bjpvKG4sZSl9fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigxNiksbz1uKDE3KSxpPW4oMzEpO3QuZXhwb3J0cz1uKDIwKT9PYmplY3QuZGVmaW5lUHJvcGVydGllczpmdW5jdGlvbih0LGUpe28odCk7Zm9yKHZhciBuLHU9aShlKSxhPXUubGVuZ3RoLGM9MDthPmM7KXIuZih0LG49dVtjKytdLGVbbl0pO3JldHVybiB0fX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMzIpLG89big0Mik7dC5leHBvcnRzPU9iamVjdC5rZXlzfHxmdW5jdGlvbih0KXtyZXR1cm4gcih0LG8pfX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMjYpLG89bigzMyksaT1uKDM2KSghMSksdT1uKDM5KShcIklFX1BST1RPXCIpO3QuZXhwb3J0cz1mdW5jdGlvbih0LGUpe3ZhciBuLGE9byh0KSxjPTAsbD1bXTtmb3IobiBpbiBhKW4hPXUmJnIoYSxuKSYmbC5wdXNoKG4pO2Zvcig7ZS5sZW5ndGg+YzspcihhLG49ZVtjKytdKSYmKH5pKGwsbil8fGwucHVzaChuKSk7cmV0dXJuIGx9fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigzNCksbz1uKDcpO3QuZXhwb3J0cz1mdW5jdGlvbih0KXtyZXR1cm4gcihvKHQpKX19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDM1KTt0LmV4cG9ydHM9T2JqZWN0KFwielwiKS5wcm9wZXJ0eUlzRW51bWVyYWJsZSgwKT9PYmplY3Q6ZnVuY3Rpb24odCl7cmV0dXJuXCJTdHJpbmdcIj09cih0KT90LnNwbGl0KFwiXCIpOk9iamVjdCh0KX19LGZ1bmN0aW9uKHQsZSl7dmFyIG49e30udG9TdHJpbmc7dC5leHBvcnRzPWZ1bmN0aW9uKHQpe3JldHVybiBuLmNhbGwodCkuc2xpY2UoOCwtMSl9fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigzMyksbz1uKDM3KSxpPW4oMzgpO3QuZXhwb3J0cz1mdW5jdGlvbih0KXtyZXR1cm4gZnVuY3Rpb24oZSxuLHUpe3ZhciBhLGM9cihlKSxsPW8oYy5sZW5ndGgpLGY9aSh1LGwpO2lmKHQmJm4hPW4pe2Zvcig7bD5mOylpZihhPWNbZisrXSxhIT1hKXJldHVybiEwfWVsc2UgZm9yKDtsPmY7ZisrKWlmKCh0fHxmIGluIGMpJiZjW2ZdPT09bilyZXR1cm4gdHx8Znx8MDtyZXR1cm4hdCYmLTF9fX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oNiksbz1NYXRoLm1pbjt0LmV4cG9ydHM9ZnVuY3Rpb24odCl7cmV0dXJuIHQ+MD9vKHIodCksOTAwNzE5OTI1NDc0MDk5MSk6MH19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDYpLG89TWF0aC5tYXgsaT1NYXRoLm1pbjt0LmV4cG9ydHM9ZnVuY3Rpb24odCxlKXtyZXR1cm4gdD1yKHQpLHQ8MD9vKHQrZSwwKTppKHQsZSl9fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9big0MCkoXCJrZXlzXCIpLG89big0MSk7dC5leHBvcnRzPWZ1bmN0aW9uKHQpe3JldHVybiByW3RdfHwoclt0XT1vKHQpKX19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDExKSxvPVwiX19jb3JlLWpzX3NoYXJlZF9fXCIsaT1yW29dfHwocltvXT17fSk7dC5leHBvcnRzPWZ1bmN0aW9uKHQpe3JldHVybiBpW3RdfHwoaVt0XT17fSl9fSxmdW5jdGlvbih0LGUpe3ZhciBuPTAscj1NYXRoLnJhbmRvbSgpO3QuZXhwb3J0cz1mdW5jdGlvbih0KXtyZXR1cm5cIlN5bWJvbChcIi5jb25jYXQodm9pZCAwPT09dD9cIlwiOnQsXCIpX1wiLCgrK24rcikudG9TdHJpbmcoMzYpKX19LGZ1bmN0aW9uKHQsZSl7dC5leHBvcnRzPVwiY29uc3RydWN0b3IsaGFzT3duUHJvcGVydHksaXNQcm90b3R5cGVPZixwcm9wZXJ0eUlzRW51bWVyYWJsZSx0b0xvY2FsZVN0cmluZyx0b1N0cmluZyx2YWx1ZU9mXCIuc3BsaXQoXCIsXCIpfSxmdW5jdGlvbih0LGUsbil7dC5leHBvcnRzPW4oMTEpLmRvY3VtZW50JiZkb2N1bWVudC5kb2N1bWVudEVsZW1lbnR9LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDE2KS5mLG89bigyNiksaT1uKDQ1KShcInRvU3RyaW5nVGFnXCIpO3QuZXhwb3J0cz1mdW5jdGlvbih0LGUsbil7dCYmIW8odD1uP3Q6dC5wcm90b3R5cGUsaSkmJnIodCxpLHtjb25maWd1cmFibGU6ITAsdmFsdWU6ZX0pfX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oNDApKFwid2tzXCIpLG89big0MSksaT1uKDExKS5TeW1ib2wsdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiBpLGE9dC5leHBvcnRzPWZ1bmN0aW9uKHQpe3JldHVybiByW3RdfHwoclt0XT11JiZpW3RdfHwodT9pOm8pKFwiU3ltYm9sLlwiK3QpKX07YS5zdG9yZT1yfSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigyNiksbz1uKDQ3KSxpPW4oMzkpKFwiSUVfUFJPVE9cIiksdT1PYmplY3QucHJvdG90eXBlO3QuZXhwb3J0cz1PYmplY3QuZ2V0UHJvdG90eXBlT2Z8fGZ1bmN0aW9uKHQpe3JldHVybiB0PW8odCkscih0LGkpP3RbaV06XCJmdW5jdGlvblwiPT10eXBlb2YgdC5jb25zdHJ1Y3RvciYmdCBpbnN0YW5jZW9mIHQuY29uc3RydWN0b3I/dC5jb25zdHJ1Y3Rvci5wcm90b3R5cGU6dCBpbnN0YW5jZW9mIE9iamVjdD91Om51bGx9fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9big3KTt0LmV4cG9ydHM9ZnVuY3Rpb24odCl7cmV0dXJuIE9iamVjdChyKHQpKX19LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjt2YXIgcj1uKDEzKSxvPW4oMTApLGk9big0NyksdT1uKDQ5KSxhPW4oNTApLGM9bigzNyksbD1uKDUxKSxmPW4oNTIpO28oby5TK28uRiohbig1NCkoZnVuY3Rpb24odCl7QXJyYXkuZnJvbSh0KX0pLFwiQXJyYXlcIix7ZnJvbTpmdW5jdGlvbih0KXt2YXIgZSxuLG8scyxkPWkodCksaD1cImZ1bmN0aW9uXCI9PXR5cGVvZiB0aGlzP3RoaXM6QXJyYXksdj1hcmd1bWVudHMubGVuZ3RoLF89dj4xP2FyZ3VtZW50c1sxXTp2b2lkIDAscD12b2lkIDAhPT1fLHk9MCxiPWYoZCk7aWYocCYmKF89cihfLHY+Mj9hcmd1bWVudHNbMl06dm9pZCAwLDIpKSx2b2lkIDA9PWJ8fGg9PUFycmF5JiZhKGIpKWZvcihlPWMoZC5sZW5ndGgpLG49bmV3IGgoZSk7ZT55O3krKylsKG4seSxwP18oZFt5XSx5KTpkW3ldKTtlbHNlIGZvcihzPWIuY2FsbChkKSxuPW5ldyBoOyEobz1zLm5leHQoKSkuZG9uZTt5KyspbChuLHkscD91KHMsXyxbby52YWx1ZSx5XSwhMCk6by52YWx1ZSk7cmV0dXJuIG4ubGVuZ3RoPXksbn19KX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMTcpO3QuZXhwb3J0cz1mdW5jdGlvbih0LGUsbixvKXt0cnl7cmV0dXJuIG8/ZShyKG4pWzBdLG5bMV0pOmUobil9Y2F0Y2goZSl7dmFyIGk9dC5yZXR1cm47dGhyb3cgdm9pZCAwIT09aSYmcihpLmNhbGwodCkpLGV9fX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMjcpLG89big0NSkoXCJpdGVyYXRvclwiKSxpPUFycmF5LnByb3RvdHlwZTt0LmV4cG9ydHM9ZnVuY3Rpb24odCl7cmV0dXJuIHZvaWQgMCE9PXQmJihyLkFycmF5PT09dHx8aVtvXT09PXQpfX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO3ZhciByPW4oMTYpLG89bigyNCk7dC5leHBvcnRzPWZ1bmN0aW9uKHQsZSxuKXtlIGluIHQ/ci5mKHQsZSxvKDAsbikpOnRbZV09bn19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDUzKSxvPW4oNDUpKFwiaXRlcmF0b3JcIiksaT1uKDI3KTt0LmV4cG9ydHM9bigxMikuZ2V0SXRlcmF0b3JNZXRob2Q9ZnVuY3Rpb24odCl7aWYodm9pZCAwIT10KXJldHVybiB0W29dfHx0W1wiQEBpdGVyYXRvclwiXXx8aVtyKHQpXX19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDM1KSxvPW4oNDUpKFwidG9TdHJpbmdUYWdcIiksaT1cIkFyZ3VtZW50c1wiPT1yKGZ1bmN0aW9uKCl7cmV0dXJuIGFyZ3VtZW50c30oKSksdT1mdW5jdGlvbih0LGUpe3RyeXtyZXR1cm4gdFtlXX1jYXRjaCh0KXt9fTt0LmV4cG9ydHM9ZnVuY3Rpb24odCl7dmFyIGUsbixhO3JldHVybiB2b2lkIDA9PT10P1wiVW5kZWZpbmVkXCI6bnVsbD09PXQ/XCJOdWxsXCI6XCJzdHJpbmdcIj09dHlwZW9mKG49dShlPU9iamVjdCh0KSxvKSk/bjppP3IoZSk6XCJPYmplY3RcIj09KGE9cihlKSkmJlwiZnVuY3Rpb25cIj09dHlwZW9mIGUuY2FsbGVlP1wiQXJndW1lbnRzXCI6YX19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDQ1KShcIml0ZXJhdG9yXCIpLG89ITE7dHJ5e3ZhciBpPVs3XVtyXSgpO2kucmV0dXJuPWZ1bmN0aW9uKCl7bz0hMH0sQXJyYXkuZnJvbShpLGZ1bmN0aW9uKCl7dGhyb3cgMn0pfWNhdGNoKHQpe310LmV4cG9ydHM9ZnVuY3Rpb24odCxlKXtpZighZSYmIW8pcmV0dXJuITE7dmFyIG49ITE7dHJ5e3ZhciBpPVs3XSx1PWlbcl0oKTt1Lm5leHQ9ZnVuY3Rpb24oKXtyZXR1cm57ZG9uZTpuPSEwfX0saVtyXT1mdW5jdGlvbigpe3JldHVybiB1fSx0KGkpfWNhdGNoKHQpe31yZXR1cm4gbn19LGZ1bmN0aW9uKHQsZSxuKXt0LmV4cG9ydHM9e2RlZmF1bHQ6big1NiksX19lc01vZHVsZTohMH19LGZ1bmN0aW9uKHQsZSxuKXtuKDQpLG4oNTcpLHQuZXhwb3J0cz1uKDYxKS5mKFwiaXRlcmF0b3JcIil9LGZ1bmN0aW9uKHQsZSxuKXtuKDU4KTtmb3IodmFyIHI9bigxMSksbz1uKDE1KSxpPW4oMjcpLHU9big0NSkoXCJ0b1N0cmluZ1RhZ1wiKSxhPVtcIk5vZGVMaXN0XCIsXCJET01Ub2tlbkxpc3RcIixcIk1lZGlhTGlzdFwiLFwiU3R5bGVTaGVldExpc3RcIixcIkNTU1J1bGVMaXN0XCJdLGM9MDtjPDU7YysrKXt2YXIgbD1hW2NdLGY9cltsXSxzPWYmJmYucHJvdG90eXBlO3MmJiFzW3VdJiZvKHMsdSxsKSxpW2xdPWkuQXJyYXl9fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHI9big1OSksbz1uKDYwKSxpPW4oMjcpLHU9bigzMyk7dC5leHBvcnRzPW4oOCkoQXJyYXksXCJBcnJheVwiLGZ1bmN0aW9uKHQsZSl7dGhpcy5fdD11KHQpLHRoaXMuX2k9MCx0aGlzLl9rPWV9LGZ1bmN0aW9uKCl7dmFyIHQ9dGhpcy5fdCxlPXRoaXMuX2ssbj10aGlzLl9pKys7cmV0dXJuIXR8fG4+PXQubGVuZ3RoPyh0aGlzLl90PXZvaWQgMCxvKDEpKTpcImtleXNcIj09ZT9vKDAsbik6XCJ2YWx1ZXNcIj09ZT9vKDAsdFtuXSk6bygwLFtuLHRbbl1dKX0sXCJ2YWx1ZXNcIiksaS5Bcmd1bWVudHM9aS5BcnJheSxyKFwia2V5c1wiKSxyKFwidmFsdWVzXCIpLHIoXCJlbnRyaWVzXCIpfSxmdW5jdGlvbih0LGUpe3QuZXhwb3J0cz1mdW5jdGlvbigpe319LGZ1bmN0aW9uKHQsZSl7dC5leHBvcnRzPWZ1bmN0aW9uKHQsZSl7cmV0dXJue3ZhbHVlOmUsZG9uZTohIXR9fX0sZnVuY3Rpb24odCxlLG4pe2UuZj1uKDQ1KX0sZnVuY3Rpb24odCxlLG4pe3QuZXhwb3J0cz17ZGVmYXVsdDpuKDYzKSxfX2VzTW9kdWxlOiEwfX0sZnVuY3Rpb24odCxlLG4pe24oNjQpLG4oNzUpLG4oNzYpLG4oNzcpLHQuZXhwb3J0cz1uKDEyKS5TeW1ib2x9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjt2YXIgcj1uKDExKSxvPW4oMjYpLGk9bigyMCksdT1uKDEwKSxhPW4oMjUpLGM9big2NSkuS0VZLGw9bigyMSksZj1uKDQwKSxzPW4oNDQpLGQ9big0MSksaD1uKDQ1KSx2PW4oNjEpLF89big2NikscD1uKDY3KSx5PW4oNjgpLGI9big3MSksZz1uKDE3KSxtPW4oMzMpLHg9bigyMyksUz1uKDI0KSxFPW4oMjkpLE09big3MiksTz1uKDc0KSx3PW4oMTYpLFA9bigzMSksaz1PLmYsaj13LmYsVD1NLmYsQT1yLlN5bWJvbCxSPXIuSlNPTixMPVImJlIuc3RyaW5naWZ5LEk9XCJwcm90b3R5cGVcIixEPWgoXCJfaGlkZGVuXCIpLEM9aChcInRvUHJpbWl0aXZlXCIpLE49e30ucHJvcGVydHlJc0VudW1lcmFibGUsRj1mKFwic3ltYm9sLXJlZ2lzdHJ5XCIpLEg9ZihcInN5bWJvbHNcIiksej1mKFwib3Atc3ltYm9sc1wiKSxCPU9iamVjdFtJXSxHPVwiZnVuY3Rpb25cIj09dHlwZW9mIEEsVz1yLlFPYmplY3QsVj0hV3x8IVdbSV18fCFXW0ldLmZpbmRDaGlsZCxVPWkmJmwoZnVuY3Rpb24oKXtyZXR1cm4gNyE9RShqKHt9LFwiYVwiLHtnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gaih0aGlzLFwiYVwiLHt2YWx1ZTo3fSkuYX19KSkuYX0pP2Z1bmN0aW9uKHQsZSxuKXt2YXIgcj1rKEIsZSk7ciYmZGVsZXRlIEJbZV0saih0LGUsbiksciYmdCE9PUImJmooQixlLHIpfTpqLFg9ZnVuY3Rpb24odCl7dmFyIGU9SFt0XT1FKEFbSV0pO3JldHVybiBlLl9rPXQsZX0scT1HJiZcInN5bWJvbFwiPT10eXBlb2YgQS5pdGVyYXRvcj9mdW5jdGlvbih0KXtyZXR1cm5cInN5bWJvbFwiPT10eXBlb2YgdH06ZnVuY3Rpb24odCl7cmV0dXJuIHQgaW5zdGFuY2VvZiBBfSxLPWZ1bmN0aW9uKHQsZSxuKXtyZXR1cm4gdD09PUImJksoeixlLG4pLGcodCksZT14KGUsITApLGcobiksbyhILGUpPyhuLmVudW1lcmFibGU/KG8odCxEKSYmdFtEXVtlXSYmKHRbRF1bZV09ITEpLG49RShuLHtlbnVtZXJhYmxlOlMoMCwhMSl9KSk6KG8odCxEKXx8aih0LEQsUygxLHt9KSksdFtEXVtlXT0hMCksVSh0LGUsbikpOmoodCxlLG4pfSxKPWZ1bmN0aW9uKHQsZSl7Zyh0KTtmb3IodmFyIG4scj15KGU9bShlKSksbz0wLGk9ci5sZW5ndGg7aT5vOylLKHQsbj1yW28rK10sZVtuXSk7cmV0dXJuIHR9LFk9ZnVuY3Rpb24odCxlKXtyZXR1cm4gdm9pZCAwPT09ZT9FKHQpOkooRSh0KSxlKX0sUT1mdW5jdGlvbih0KXt2YXIgZT1OLmNhbGwodGhpcyx0PXgodCwhMCkpO3JldHVybiEodGhpcz09PUImJm8oSCx0KSYmIW8oeix0KSkmJighKGV8fCFvKHRoaXMsdCl8fCFvKEgsdCl8fG8odGhpcyxEKSYmdGhpc1tEXVt0XSl8fGUpfSxaPWZ1bmN0aW9uKHQsZSl7aWYodD1tKHQpLGU9eChlLCEwKSx0IT09Qnx8IW8oSCxlKXx8byh6LGUpKXt2YXIgbj1rKHQsZSk7cmV0dXJuIW58fCFvKEgsZSl8fG8odCxEKSYmdFtEXVtlXXx8KG4uZW51bWVyYWJsZT0hMCksbn19LCQ9ZnVuY3Rpb24odCl7Zm9yKHZhciBlLG49VChtKHQpKSxyPVtdLGk9MDtuLmxlbmd0aD5pOylvKEgsZT1uW2krK10pfHxlPT1EfHxlPT1jfHxyLnB1c2goZSk7cmV0dXJuIHJ9LHR0PWZ1bmN0aW9uKHQpe2Zvcih2YXIgZSxuPXQ9PT1CLHI9VChuP3o6bSh0KSksaT1bXSx1PTA7ci5sZW5ndGg+dTspIW8oSCxlPXJbdSsrXSl8fG4mJiFvKEIsZSl8fGkucHVzaChIW2VdKTtyZXR1cm4gaX07R3x8KEE9ZnVuY3Rpb24oKXtpZih0aGlzIGluc3RhbmNlb2YgQSl0aHJvdyBUeXBlRXJyb3IoXCJTeW1ib2wgaXMgbm90IGEgY29uc3RydWN0b3IhXCIpO3ZhciB0PWQoYXJndW1lbnRzLmxlbmd0aD4wP2FyZ3VtZW50c1swXTp2b2lkIDApLGU9ZnVuY3Rpb24obil7dGhpcz09PUImJmUuY2FsbCh6LG4pLG8odGhpcyxEKSYmbyh0aGlzW0RdLHQpJiYodGhpc1tEXVt0XT0hMSksVSh0aGlzLHQsUygxLG4pKX07cmV0dXJuIGkmJlYmJlUoQix0LHtjb25maWd1cmFibGU6ITAsc2V0OmV9KSxYKHQpfSxhKEFbSV0sXCJ0b1N0cmluZ1wiLGZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX2t9KSxPLmY9Wix3LmY9SyxuKDczKS5mPU0uZj0kLG4oNzApLmY9USxuKDY5KS5mPXR0LGkmJiFuKDkpJiZhKEIsXCJwcm9wZXJ0eUlzRW51bWVyYWJsZVwiLFEsITApLHYuZj1mdW5jdGlvbih0KXtyZXR1cm4gWChoKHQpKX0pLHUodS5HK3UuVyt1LkYqIUcse1N5bWJvbDpBfSk7Zm9yKHZhciBldD1cImhhc0luc3RhbmNlLGlzQ29uY2F0U3ByZWFkYWJsZSxpdGVyYXRvcixtYXRjaCxyZXBsYWNlLHNlYXJjaCxzcGVjaWVzLHNwbGl0LHRvUHJpbWl0aXZlLHRvU3RyaW5nVGFnLHVuc2NvcGFibGVzXCIuc3BsaXQoXCIsXCIpLG50PTA7ZXQubGVuZ3RoPm50OyloKGV0W250KytdKTtmb3IodmFyIGV0PVAoaC5zdG9yZSksbnQ9MDtldC5sZW5ndGg+bnQ7KV8oZXRbbnQrK10pO3UodS5TK3UuRiohRyxcIlN5bWJvbFwiLHtmb3I6ZnVuY3Rpb24odCl7cmV0dXJuIG8oRix0Kz1cIlwiKT9GW3RdOkZbdF09QSh0KX0sa2V5Rm9yOmZ1bmN0aW9uKHQpe2lmKHEodCkpcmV0dXJuIHAoRix0KTt0aHJvdyBUeXBlRXJyb3IodCtcIiBpcyBub3QgYSBzeW1ib2whXCIpfSx1c2VTZXR0ZXI6ZnVuY3Rpb24oKXtWPSEwfSx1c2VTaW1wbGU6ZnVuY3Rpb24oKXtWPSExfX0pLHUodS5TK3UuRiohRyxcIk9iamVjdFwiLHtjcmVhdGU6WSxkZWZpbmVQcm9wZXJ0eTpLLGRlZmluZVByb3BlcnRpZXM6SixnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I6WixnZXRPd25Qcm9wZXJ0eU5hbWVzOiQsZ2V0T3duUHJvcGVydHlTeW1ib2xzOnR0fSksUiYmdSh1LlMrdS5GKighR3x8bChmdW5jdGlvbigpe3ZhciB0PUEoKTtyZXR1cm5cIltudWxsXVwiIT1MKFt0XSl8fFwie31cIiE9TCh7YTp0fSl8fFwie31cIiE9TChPYmplY3QodCkpfSkpLFwiSlNPTlwiLHtzdHJpbmdpZnk6ZnVuY3Rpb24odCl7aWYodm9pZCAwIT09dCYmIXEodCkpe2Zvcih2YXIgZSxuLHI9W3RdLG89MTthcmd1bWVudHMubGVuZ3RoPm87KXIucHVzaChhcmd1bWVudHNbbysrXSk7cmV0dXJuIGU9clsxXSxcImZ1bmN0aW9uXCI9PXR5cGVvZiBlJiYobj1lKSwhbiYmYihlKXx8KGU9ZnVuY3Rpb24odCxlKXtpZihuJiYoZT1uLmNhbGwodGhpcyx0LGUpKSwhcShlKSlyZXR1cm4gZX0pLHJbMV09ZSxMLmFwcGx5KFIscil9fX0pLEFbSV1bQ118fG4oMTUpKEFbSV0sQyxBW0ldLnZhbHVlT2YpLHMoQSxcIlN5bWJvbFwiKSxzKE1hdGgsXCJNYXRoXCIsITApLHMoci5KU09OLFwiSlNPTlwiLCEwKX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oNDEpKFwibWV0YVwiKSxvPW4oMTgpLGk9bigyNiksdT1uKDE2KS5mLGE9MCxjPU9iamVjdC5pc0V4dGVuc2libGV8fGZ1bmN0aW9uKCl7cmV0dXJuITB9LGw9IW4oMjEpKGZ1bmN0aW9uKCl7cmV0dXJuIGMoT2JqZWN0LnByZXZlbnRFeHRlbnNpb25zKHt9KSl9KSxmPWZ1bmN0aW9uKHQpe3UodCxyLHt2YWx1ZTp7aTpcIk9cIisgKythLHc6e319fSl9LHM9ZnVuY3Rpb24odCxlKXtpZighbyh0KSlyZXR1cm5cInN5bWJvbFwiPT10eXBlb2YgdD90OihcInN0cmluZ1wiPT10eXBlb2YgdD9cIlNcIjpcIlBcIikrdDtpZighaSh0LHIpKXtpZighYyh0KSlyZXR1cm5cIkZcIjtpZighZSlyZXR1cm5cIkVcIjtmKHQpfXJldHVybiB0W3JdLml9LGQ9ZnVuY3Rpb24odCxlKXtpZighaSh0LHIpKXtpZighYyh0KSlyZXR1cm4hMDtpZighZSlyZXR1cm4hMTtmKHQpfXJldHVybiB0W3JdLnd9LGg9ZnVuY3Rpb24odCl7cmV0dXJuIGwmJnYuTkVFRCYmYyh0KSYmIWkodCxyKSYmZih0KSx0fSx2PXQuZXhwb3J0cz17S0VZOnIsTkVFRDohMSxmYXN0S2V5OnMsZ2V0V2VhazpkLG9uRnJlZXplOmh9fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigxMSksbz1uKDEyKSxpPW4oOSksdT1uKDYxKSxhPW4oMTYpLmY7dC5leHBvcnRzPWZ1bmN0aW9uKHQpe3ZhciBlPW8uU3ltYm9sfHwoby5TeW1ib2w9aT97fTpyLlN5bWJvbHx8e30pO1wiX1wiPT10LmNoYXJBdCgwKXx8dCBpbiBlfHxhKGUsdCx7dmFsdWU6dS5mKHQpfSl9fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigzMSksbz1uKDMzKTt0LmV4cG9ydHM9ZnVuY3Rpb24odCxlKXtmb3IodmFyIG4saT1vKHQpLHU9cihpKSxhPXUubGVuZ3RoLGM9MDthPmM7KWlmKGlbbj11W2MrK11dPT09ZSlyZXR1cm4gbn19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDMxKSxvPW4oNjkpLGk9big3MCk7dC5leHBvcnRzPWZ1bmN0aW9uKHQpe3ZhciBlPXIodCksbj1vLmY7aWYobilmb3IodmFyIHUsYT1uKHQpLGM9aS5mLGw9MDthLmxlbmd0aD5sOyljLmNhbGwodCx1PWFbbCsrXSkmJmUucHVzaCh1KTtyZXR1cm4gZX19LGZ1bmN0aW9uKHQsZSl7ZS5mPU9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHN9LGZ1bmN0aW9uKHQsZSl7ZS5mPXt9LnByb3BlcnR5SXNFbnVtZXJhYmxlfSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigzNSk7dC5leHBvcnRzPUFycmF5LmlzQXJyYXl8fGZ1bmN0aW9uKHQpe3JldHVyblwiQXJyYXlcIj09cih0KX19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDMzKSxvPW4oNzMpLmYsaT17fS50b1N0cmluZyx1PVwib2JqZWN0XCI9PXR5cGVvZiB3aW5kb3cmJndpbmRvdyYmT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXM/T2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMod2luZG93KTpbXSxhPWZ1bmN0aW9uKHQpe3RyeXtyZXR1cm4gbyh0KX1jYXRjaCh0KXtyZXR1cm4gdS5zbGljZSgpfX07dC5leHBvcnRzLmY9ZnVuY3Rpb24odCl7cmV0dXJuIHUmJlwiW29iamVjdCBXaW5kb3ddXCI9PWkuY2FsbCh0KT9hKHQpOm8ocih0KSl9fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigzMiksbz1uKDQyKS5jb25jYXQoXCJsZW5ndGhcIixcInByb3RvdHlwZVwiKTtlLmY9T2JqZWN0LmdldE93blByb3BlcnR5TmFtZXN8fGZ1bmN0aW9uKHQpe3JldHVybiByKHQsbyl9fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9big3MCksbz1uKDI0KSxpPW4oMzMpLHU9bigyMyksYT1uKDI2KSxjPW4oMTkpLGw9T2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcjtlLmY9bigyMCk/bDpmdW5jdGlvbih0LGUpe2lmKHQ9aSh0KSxlPXUoZSwhMCksYyl0cnl7cmV0dXJuIGwodCxlKX1jYXRjaCh0KXt9aWYoYSh0LGUpKXJldHVybiBvKCFyLmYuY2FsbCh0LGUpLHRbZV0pfX0sZnVuY3Rpb24odCxlKXt9LGZ1bmN0aW9uKHQsZSxuKXtuKDY2KShcImFzeW5jSXRlcmF0b3JcIil9LGZ1bmN0aW9uKHQsZSxuKXtuKDY2KShcIm9ic2VydmFibGVcIil9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX1mdW5jdGlvbiBvKHQsZSl7aWYoISh0IGluc3RhbmNlb2YgZSkpdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKX12YXIgaT1uKDc5KSx1PXIoaSksYT1uKDgyKSxjPXIoYSksbD1uKDg2KSxmPXIobCk7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSksZS5TbW9vdGhTY3JvbGxiYXI9dm9pZCAwO3ZhciBzPWZ1bmN0aW9uKCl7ZnVuY3Rpb24gdCh0LGUpe2Zvcih2YXIgbj0wO248ZS5sZW5ndGg7bisrKXt2YXIgcj1lW25dO3IuZW51bWVyYWJsZT1yLmVudW1lcmFibGV8fCExLHIuY29uZmlndXJhYmxlPSEwLFwidmFsdWVcImluIHImJihyLndyaXRhYmxlPSEwKSwoMCxmLmRlZmF1bHQpKHQsci5rZXkscil9fXJldHVybiBmdW5jdGlvbihlLG4scil7cmV0dXJuIG4mJnQoZS5wcm90b3R5cGUsbiksciYmdChlLHIpLGV9fSgpLGQ9big4OSksaD1uKDExMik7ZS5TbW9vdGhTY3JvbGxiYXI9ZnVuY3Rpb24oKXtmdW5jdGlvbiB0KGUpe3ZhciBuPXRoaXMscj1hcmd1bWVudHMubGVuZ3RoPjEmJnZvaWQgMCE9PWFyZ3VtZW50c1sxXT9hcmd1bWVudHNbMV06e307byh0aGlzLHQpLGUuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIixcIjFcIik7dmFyIGk9KDAsaC5maW5kQ2hpbGQpKGUsXCJzY3JvbGwtY29udGVudFwiKSxhPSgwLGguZmluZENoaWxkKShlLFwib3ZlcnNjcm9sbC1nbG93XCIpLGw9KDAsaC5maW5kQ2hpbGQpKGUsXCJzY3JvbGxiYXItdHJhY2steFwiKSxmPSgwLGguZmluZENoaWxkKShlLFwic2Nyb2xsYmFyLXRyYWNrLXlcIik7KDAsaC5zZXRTdHlsZSkoZSx7b3ZlcmZsb3c6XCJoaWRkZW5cIixvdXRsaW5lOlwibm9uZVwifSksKDAsaC5zZXRTdHlsZSkoYSx7ZGlzcGxheTpcIm5vbmVcIixcInBvaW50ZXItZXZlbnRzXCI6XCJub25lXCJ9KSx0aGlzLl9fcmVhZG9ubHkoXCJ0YXJnZXRzXCIsKDAsYy5kZWZhdWx0KSh7Y29udGFpbmVyOmUsY29udGVudDppLGNhbnZhczp7ZWxlbTphLGNvbnRleHQ6YS5nZXRDb250ZXh0KFwiMmRcIil9LHhBeGlzOigwLGMuZGVmYXVsdCkoe3RyYWNrOmwsdGh1bWI6KDAsaC5maW5kQ2hpbGQpKGwsXCJzY3JvbGxiYXItdGh1bWIteFwiKX0pLHlBeGlzOigwLGMuZGVmYXVsdCkoe3RyYWNrOmYsdGh1bWI6KDAsaC5maW5kQ2hpbGQpKGYsXCJzY3JvbGxiYXItdGh1bWIteVwiKX0pfSkpLl9fcmVhZG9ubHkoXCJvZmZzZXRcIix7eDowLHk6MH0pLl9fcmVhZG9ubHkoXCJ0aHVtYk9mZnNldFwiLHt4OjAseTowfSkuX19yZWFkb25seShcImxpbWl0XCIse3g6MS8wLHk6MS8wfSkuX19yZWFkb25seShcIm1vdmVtZW50XCIse3g6MCx5OjB9KS5fX3JlYWRvbmx5KFwibW92ZW1lbnRMb2NrZWRcIix7eDohMSx5OiExfSkuX19yZWFkb25seShcIm92ZXJzY3JvbGxSZW5kZXJlZFwiLHt4OjAseTowfSkuX19yZWFkb25seShcIm92ZXJzY3JvbGxCYWNrXCIsITEpLl9fcmVhZG9ubHkoXCJ0aHVtYlNpemVcIix7eDowLHk6MCxyZWFsWDowLHJlYWxZOjB9KS5fX3JlYWRvbmx5KFwiYm91bmRpbmdcIix7dG9wOjAscmlnaHQ6MCxib3R0b206MCxsZWZ0OjB9KS5fX3JlYWRvbmx5KFwiY2hpbGRyZW5cIixbXSkuX19yZWFkb25seShcInBhcmVudHNcIixbXSkuX19yZWFkb25seShcInNpemVcIix0aGlzLmdldFNpemUoKSkuX19yZWFkb25seShcImlzTmVzdGVkU2Nyb2xsYmFyXCIsITEpLCgwLHUuZGVmYXVsdCkodGhpcyx7X19oaWRlVHJhY2tUaHJvdHRsZTp7dmFsdWU6KDAsaC5kZWJvdW5jZSkodGhpcy5oaWRlVHJhY2suYmluZCh0aGlzKSwxZTMsITEpfSxfX3VwZGF0ZVRocm90dGxlOnt2YWx1ZTooMCxoLmRlYm91bmNlKSh0aGlzLnVwZGF0ZS5iaW5kKHRoaXMpKX0sX190b3VjaFJlY29yZDp7dmFsdWU6bmV3IGguVG91Y2hSZWNvcmR9LF9fbGlzdGVuZXJzOnt2YWx1ZTpbXX0sX19oYW5kbGVyczp7dmFsdWU6W119LF9fY2hpbGRyZW46e3ZhbHVlOltdfSxfX3RpbWVySUQ6e3ZhbHVlOnt9fX0pLHRoaXMuX19pbml0T3B0aW9ucyhyKSx0aGlzLl9faW5pdFNjcm9sbGJhcigpO3ZhciBzPWUuc2Nyb2xsTGVmdCx2PWUuc2Nyb2xsVG9wO2lmKGUuc2Nyb2xsTGVmdD1lLnNjcm9sbFRvcD0wLHRoaXMuc2V0UG9zaXRpb24ocyx2LCEwKSxkLnNiTGlzdC5zZXQoZSx0aGlzKSxcImZ1bmN0aW9uXCI9PXR5cGVvZiBkLkdMT0JBTF9FTlYuTXV0YXRpb25PYnNlcnZlcil7dmFyIF89bmV3IGQuR0xPQkFMX0VOVi5NdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uKCl7bi51cGRhdGUoITApfSk7Xy5vYnNlcnZlKGkse2NoaWxkTGlzdDohMH0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLFwiX19vYnNlcnZlclwiLHt2YWx1ZTpffSl9fXJldHVybiBzKHQsW3trZXk6XCJNQVhfT1ZFUlNDUk9MTFwiLGdldDpmdW5jdGlvbigpe3ZhciB0PXRoaXMub3B0aW9ucyxlPXRoaXMuc2l6ZTtzd2l0Y2godC5vdmVyc2Nyb2xsRWZmZWN0KXtjYXNlXCJib3VuY2VcIjp2YXIgbj1NYXRoLmZsb29yKE1hdGguc3FydChNYXRoLnBvdyhlLmNvbnRhaW5lci53aWR0aCwyKStNYXRoLnBvdyhlLmNvbnRhaW5lci5oZWlnaHQsMikpKSxyPXRoaXMuX19pc01vdmVtZW50TG9ja2VkKCk/MjoxMDtyZXR1cm4gZC5HTE9CQUxfRU5WLlRPVUNIX1NVUFBPUlRFRD8oMCxoLnBpY2tJblJhbmdlKShuL3IsMTAwLDFlMyk6KDAsaC5waWNrSW5SYW5nZSkobi8xMCwyNSw1MCk7Y2FzZVwiZ2xvd1wiOnJldHVybiAxNTA7ZGVmYXVsdDpyZXR1cm4gMH19fSx7a2V5Olwic2Nyb2xsVG9wXCIsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMub2Zmc2V0Lnl9fSx7a2V5Olwic2Nyb2xsTGVmdFwiLGdldDpmdW5jdGlvbigpe3JldHVybiB0aGlzLm9mZnNldC54fX1dKSx0fSgpfSxmdW5jdGlvbih0LGUsbil7dC5leHBvcnRzPXtkZWZhdWx0Om4oODApLF9fZXNNb2R1bGU6ITB9fSxmdW5jdGlvbih0LGUsbil7big4MSk7dmFyIHI9bigxMikuT2JqZWN0O3QuZXhwb3J0cz1mdW5jdGlvbih0LGUpe3JldHVybiByLmRlZmluZVByb3BlcnRpZXModCxlKX19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDEwKTtyKHIuUytyLkYqIW4oMjApLFwiT2JqZWN0XCIse2RlZmluZVByb3BlcnRpZXM6bigzMCl9KX0sZnVuY3Rpb24odCxlLG4pe3QuZXhwb3J0cz17ZGVmYXVsdDpuKDgzKSxfX2VzTW9kdWxlOiEwfX0sZnVuY3Rpb24odCxlLG4pe24oODQpLHQuZXhwb3J0cz1uKDEyKS5PYmplY3QuZnJlZXplfSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigxOCksbz1uKDY1KS5vbkZyZWV6ZTtuKDg1KShcImZyZWV6ZVwiLGZ1bmN0aW9uKHQpe3JldHVybiBmdW5jdGlvbihlKXtyZXR1cm4gdCYmcihlKT90KG8oZSkpOmV9fSl9LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDEwKSxvPW4oMTIpLGk9bigyMSk7dC5leHBvcnRzPWZ1bmN0aW9uKHQsZSl7dmFyIG49KG8uT2JqZWN0fHx7fSlbdF18fE9iamVjdFt0XSx1PXt9O3VbdF09ZShuKSxyKHIuUytyLkYqaShmdW5jdGlvbigpe24oMSl9KSxcIk9iamVjdFwiLHUpfX0sZnVuY3Rpb24odCxlLG4pe3QuZXhwb3J0cz17ZGVmYXVsdDpuKDg3KSxfX2VzTW9kdWxlOiEwfX0sZnVuY3Rpb24odCxlLG4pe24oODgpO3ZhciByPW4oMTIpLk9iamVjdDt0LmV4cG9ydHM9ZnVuY3Rpb24odCxlLG4pe3JldHVybiByLmRlZmluZVByb3BlcnR5KHQsZSxuKX19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDEwKTtyKHIuUytyLkYqIW4oMjApLFwiT2JqZWN0XCIse2RlZmluZVByb3BlcnR5Om4oMTYpLmZ9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fXZhciBvPW4oODYpLGk9cihvKSx1PW4oOTApLGE9cih1KTtPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KTt2YXIgYz1uKDkzKTsoMCxhLmRlZmF1bHQpKGMpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBjW3RdfX0pfSl9LGZ1bmN0aW9uKHQsZSxuKXt0LmV4cG9ydHM9e2RlZmF1bHQ6big5MSksX19lc01vZHVsZTohMH19LGZ1bmN0aW9uKHQsZSxuKXtuKDkyKSx0LmV4cG9ydHM9bigxMikuT2JqZWN0LmtleXN9LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDQ3KSxvPW4oMzEpO24oODUpKFwia2V5c1wiLGZ1bmN0aW9uKCl7cmV0dXJuIGZ1bmN0aW9uKHQpe3JldHVybiBvKHIodCkpfX0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19dmFyIG89big4NiksaT1yKG8pLHU9big5MCksYT1yKHUpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO3ZhciBjPW4oOTQpOygwLGEuZGVmYXVsdCkoYykuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGNbdF19fSl9KTt2YXIgbD1uKDk1KTsoMCxhLmRlZmF1bHQpKGwpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBsW3RdfX0pfSk7dmFyIGY9bigxMTEpOygwLGEuZGVmYXVsdCkoZikuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGZbdF19fSl9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fXZhciBvPW4oODYpLGk9cihvKSx1PW4oOTApLGE9cih1KTtPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KTt2YXIgYz1mdW5jdGlvbih0KXt2YXIgZT17fSxuPXt9O3JldHVybigwLGEuZGVmYXVsdCkodCkuZm9yRWFjaChmdW5jdGlvbihyKXsoMCxpLmRlZmF1bHQpKGUscix7Z2V0OmZ1bmN0aW9uKCl7aWYoIW4uaGFzT3duUHJvcGVydHkocikpe3ZhciBlPXRbcl07bltyXT1lKCl9cmV0dXJuIG5bcl19fSl9KSxlfSxsPXtNdXRhdGlvbk9ic2VydmVyOmZ1bmN0aW9uKCl7cmV0dXJuIHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyfHx3aW5kb3cuV2ViS2l0TXV0YXRpb25PYnNlcnZlcnx8d2luZG93Lk1vek11dGF0aW9uT2JzZXJ2ZXJ9LFRPVUNIX1NVUFBPUlRFRDpmdW5jdGlvbigpe3JldHVyblwib250b3VjaHN0YXJ0XCJpbiBkb2N1bWVudH0sRUFTSU5HX01VTFRJUExJRVI6ZnVuY3Rpb24oKXtyZXR1cm4gbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQW5kcm9pZC8pPy41Oi4yNX0sV0hFRUxfRVZFTlQ6ZnVuY3Rpb24oKXtyZXR1cm5cIm9ud2hlZWxcImluIHdpbmRvdz9cIndoZWVsXCI6XCJtb3VzZXdoZWVsXCJ9fTtlLkdMT0JBTF9FTlY9YyhsKX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fXZhciBvPW4oOTYpLGk9cihvKTtPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KTt2YXIgdT1uZXcgaS5kZWZhdWx0LGE9dS5zZXQuYmluZCh1KSxjPXUuZGVsZXRlLmJpbmQodSk7dS51cGRhdGU9ZnVuY3Rpb24oKXt1LmZvckVhY2goZnVuY3Rpb24odCl7dC5fX3VwZGF0ZVRyZWUoKX0pfSx1LmRlbGV0ZT1mdW5jdGlvbigpe3ZhciB0PWMuYXBwbHkodm9pZCAwLGFyZ3VtZW50cyk7cmV0dXJuIHUudXBkYXRlKCksdH0sdS5zZXQ9ZnVuY3Rpb24oKXt2YXIgdD1hLmFwcGx5KHZvaWQgMCxhcmd1bWVudHMpO3JldHVybiB1LnVwZGF0ZSgpLHR9LGUuc2JMaXN0PXV9LGZ1bmN0aW9uKHQsZSxuKXt0LmV4cG9ydHM9e2RlZmF1bHQ6big5NyksX19lc01vZHVsZTohMH19LGZ1bmN0aW9uKHQsZSxuKXtuKDc1KSxuKDQpLG4oNTcpLG4oOTgpLG4oMTA4KSx0LmV4cG9ydHM9bigxMikuTWFwfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHI9big5OSk7dC5leHBvcnRzPW4oMTA0KShcIk1hcFwiLGZ1bmN0aW9uKHQpe3JldHVybiBmdW5jdGlvbigpe3JldHVybiB0KHRoaXMsYXJndW1lbnRzLmxlbmd0aD4wP2FyZ3VtZW50c1swXTp2b2lkIDApfX0se2dldDpmdW5jdGlvbih0KXt2YXIgZT1yLmdldEVudHJ5KHRoaXMsdCk7cmV0dXJuIGUmJmUudn0sc2V0OmZ1bmN0aW9uKHQsZSl7cmV0dXJuIHIuZGVmKHRoaXMsMD09PXQ/MDp0LGUpfX0sciwhMCl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjt2YXIgcj1uKDE2KS5mLG89bigyOSksaT1uKDEwMCksdT1uKDEzKSxhPW4oMTAxKSxjPW4oNyksbD1uKDEwMiksZj1uKDgpLHM9big2MCksZD1uKDEwMyksaD1uKDIwKSx2PW4oNjUpLmZhc3RLZXksXz1oP1wiX3NcIjpcInNpemVcIixwPWZ1bmN0aW9uKHQsZSl7dmFyIG4scj12KGUpO2lmKFwiRlwiIT09cilyZXR1cm4gdC5faVtyXTtmb3Iobj10Ll9mO247bj1uLm4paWYobi5rPT1lKXJldHVybiBufTt0LmV4cG9ydHM9e2dldENvbnN0cnVjdG9yOmZ1bmN0aW9uKHQsZSxuLGYpe3ZhciBzPXQoZnVuY3Rpb24odCxyKXthKHQscyxlLFwiX2lcIiksdC5faT1vKG51bGwpLHQuX2Y9dm9pZCAwLHQuX2w9dm9pZCAwLHRbX109MCx2b2lkIDAhPXImJmwocixuLHRbZl0sdCl9KTtyZXR1cm4gaShzLnByb3RvdHlwZSx7Y2xlYXI6ZnVuY3Rpb24oKXtmb3IodmFyIHQ9dGhpcyxlPXQuX2ksbj10Ll9mO247bj1uLm4pbi5yPSEwLG4ucCYmKG4ucD1uLnAubj12b2lkIDApLGRlbGV0ZSBlW24uaV07dC5fZj10Ll9sPXZvaWQgMCx0W19dPTB9LGRlbGV0ZTpmdW5jdGlvbih0KXt2YXIgZT10aGlzLG49cChlLHQpO2lmKG4pe3ZhciByPW4ubixvPW4ucDtkZWxldGUgZS5faVtuLmldLG4ucj0hMCxvJiYoby5uPXIpLHImJihyLnA9byksZS5fZj09biYmKGUuX2Y9ciksZS5fbD09biYmKGUuX2w9byksZVtfXS0tfXJldHVybiEhbn0sZm9yRWFjaDpmdW5jdGlvbih0KXthKHRoaXMscyxcImZvckVhY2hcIik7Zm9yKHZhciBlLG49dSh0LGFyZ3VtZW50cy5sZW5ndGg+MT9hcmd1bWVudHNbMV06dm9pZCAwLDMpO2U9ZT9lLm46dGhpcy5fZjspZm9yKG4oZS52LGUuayx0aGlzKTtlJiZlLnI7KWU9ZS5wfSxoYXM6ZnVuY3Rpb24odCl7cmV0dXJuISFwKHRoaXMsdCl9fSksaCYmcihzLnByb3RvdHlwZSxcInNpemVcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGModGhpc1tfXSl9fSksc30sZGVmOmZ1bmN0aW9uKHQsZSxuKXt2YXIgcixvLGk9cCh0LGUpO3JldHVybiBpP2kudj1uOih0Ll9sPWk9e2k6bz12KGUsITApLGs6ZSx2Om4scDpyPXQuX2wsbjp2b2lkIDAscjohMX0sdC5fZnx8KHQuX2Y9aSksciYmKHIubj1pKSx0W19dKyssXCJGXCIhPT1vJiYodC5faVtvXT1pKSksdH0sZ2V0RW50cnk6cCxzZXRTdHJvbmc6ZnVuY3Rpb24odCxlLG4pe2YodCxlLGZ1bmN0aW9uKHQsZSl7dGhpcy5fdD10LHRoaXMuX2s9ZSx0aGlzLl9sPXZvaWQgMH0sZnVuY3Rpb24oKXtmb3IodmFyIHQ9dGhpcyxlPXQuX2ssbj10Ll9sO24mJm4ucjspbj1uLnA7cmV0dXJuIHQuX3QmJih0Ll9sPW49bj9uLm46dC5fdC5fZik/XCJrZXlzXCI9PWU/cygwLG4uayk6XCJ2YWx1ZXNcIj09ZT9zKDAsbi52KTpzKDAsW24uayxuLnZdKToodC5fdD12b2lkIDAscygxKSl9LG4/XCJlbnRyaWVzXCI6XCJ2YWx1ZXNcIiwhbiwhMCksZChlKX19fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigxNSk7dC5leHBvcnRzPWZ1bmN0aW9uKHQsZSxuKXtmb3IodmFyIG8gaW4gZSluJiZ0W29dP3Rbb109ZVtvXTpyKHQsbyxlW29dKTtyZXR1cm4gdH19LGZ1bmN0aW9uKHQsZSl7dC5leHBvcnRzPWZ1bmN0aW9uKHQsZSxuLHIpe2lmKCEodCBpbnN0YW5jZW9mIGUpfHx2b2lkIDAhPT1yJiZyIGluIHQpdGhyb3cgVHlwZUVycm9yKG4rXCI6IGluY29ycmVjdCBpbnZvY2F0aW9uIVwiKTtyZXR1cm4gdH19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDEzKSxvPW4oNDkpLGk9big1MCksdT1uKDE3KSxhPW4oMzcpLGM9big1MiksbD17fSxmPXt9LGU9dC5leHBvcnRzPWZ1bmN0aW9uKHQsZSxuLHMsZCl7dmFyIGgsdixfLHAseT1kP2Z1bmN0aW9uKCl7cmV0dXJuIHR9OmModCksYj1yKG4scyxlPzI6MSksZz0wO2lmKFwiZnVuY3Rpb25cIiE9dHlwZW9mIHkpdGhyb3cgVHlwZUVycm9yKHQrXCIgaXMgbm90IGl0ZXJhYmxlIVwiKTtpZihpKHkpKXtmb3IoaD1hKHQubGVuZ3RoKTtoPmc7ZysrKWlmKHA9ZT9iKHUodj10W2ddKVswXSx2WzFdKTpiKHRbZ10pLHA9PT1sfHxwPT09ZilyZXR1cm4gcH1lbHNlIGZvcihfPXkuY2FsbCh0KTshKHY9Xy5uZXh0KCkpLmRvbmU7KWlmKHA9byhfLGIsdi52YWx1ZSxlKSxwPT09bHx8cD09PWYpcmV0dXJuIHB9O2UuQlJFQUs9bCxlLlJFVFVSTj1mfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHI9bigxMSksbz1uKDEyKSxpPW4oMTYpLHU9bigyMCksYT1uKDQ1KShcInNwZWNpZXNcIik7dC5leHBvcnRzPWZ1bmN0aW9uKHQpe3ZhciBlPVwiZnVuY3Rpb25cIj09dHlwZW9mIG9bdF0/b1t0XTpyW3RdO3UmJmUmJiFlW2FdJiZpLmYoZSxhLHtjb25maWd1cmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXN9fSl9fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHI9bigxMSksbz1uKDEwKSxpPW4oNjUpLHU9bigyMSksYT1uKDE1KSxjPW4oMTAwKSxsPW4oMTAyKSxmPW4oMTAxKSxzPW4oMTgpLGQ9big0NCksaD1uKDE2KS5mLHY9bigxMDUpKDApLF89bigyMCk7dC5leHBvcnRzPWZ1bmN0aW9uKHQsZSxuLHAseSxiKXt2YXIgZz1yW3RdLG09Zyx4PXk/XCJzZXRcIjpcImFkZFwiLFM9bSYmbS5wcm90b3R5cGUsRT17fTtyZXR1cm4gXyYmXCJmdW5jdGlvblwiPT10eXBlb2YgbSYmKGJ8fFMuZm9yRWFjaCYmIXUoZnVuY3Rpb24oKXsobmV3IG0pLmVudHJpZXMoKS5uZXh0KCl9KSk/KG09ZShmdW5jdGlvbihlLG4pe2YoZSxtLHQsXCJfY1wiKSxlLl9jPW5ldyBnLHZvaWQgMCE9biYmbChuLHksZVt4XSxlKX0pLHYoXCJhZGQsY2xlYXIsZGVsZXRlLGZvckVhY2gsZ2V0LGhhcyxzZXQsa2V5cyx2YWx1ZXMsZW50cmllcyx0b0pTT05cIi5zcGxpdChcIixcIiksZnVuY3Rpb24odCl7dmFyIGU9XCJhZGRcIj09dHx8XCJzZXRcIj09dDt0IGluIFMmJighYnx8XCJjbGVhclwiIT10KSYmYShtLnByb3RvdHlwZSx0LGZ1bmN0aW9uKG4scil7aWYoZih0aGlzLG0sdCksIWUmJmImJiFzKG4pKXJldHVyblwiZ2V0XCI9PXQmJnZvaWQgMDt2YXIgbz10aGlzLl9jW3RdKDA9PT1uPzA6bixyKTtyZXR1cm4gZT90aGlzOm99KX0pLFwic2l6ZVwiaW4gUyYmaChtLnByb3RvdHlwZSxcInNpemVcIix7Z2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHRoaXMuX2Muc2l6ZX19KSk6KG09cC5nZXRDb25zdHJ1Y3RvcihlLHQseSx4KSxjKG0ucHJvdG90eXBlLG4pLGkuTkVFRD0hMCksZChtLHQpLEVbdF09bSxvKG8uRytvLlcrby5GLEUpLGJ8fHAuc2V0U3Ryb25nKG0sdCx5KSxtfX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMTMpLG89bigzNCksaT1uKDQ3KSx1PW4oMzcpLGE9bigxMDYpO3QuZXhwb3J0cz1mdW5jdGlvbih0LGUpe3ZhciBuPTE9PXQsYz0yPT10LGw9Mz09dCxmPTQ9PXQscz02PT10LGQ9NT09dHx8cyxoPWV8fGE7cmV0dXJuIGZ1bmN0aW9uKGUsYSx2KXtmb3IodmFyIF8scCx5PWkoZSksYj1vKHkpLGc9cihhLHYsMyksbT11KGIubGVuZ3RoKSx4PTAsUz1uP2goZSxtKTpjP2goZSwwKTp2b2lkIDA7bT54O3grKylpZigoZHx8eCBpbiBiKSYmKF89Ylt4XSxwPWcoXyx4LHkpLHQpKWlmKG4pU1t4XT1wO2Vsc2UgaWYocClzd2l0Y2godCl7Y2FzZSAzOnJldHVybiEwO2Nhc2UgNTpyZXR1cm4gXztjYXNlIDY6cmV0dXJuIHg7Y2FzZSAyOlMucHVzaChfKX1lbHNlIGlmKGYpcmV0dXJuITE7cmV0dXJuIHM/LTE6bHx8Zj9mOlN9fX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMTA3KTt0LmV4cG9ydHM9ZnVuY3Rpb24odCxlKXtyZXR1cm4gbmV3KHIodCkpKGUpfX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oMTgpLG89big3MSksaT1uKDQ1KShcInNwZWNpZXNcIik7dC5leHBvcnRzPWZ1bmN0aW9uKHQpe3ZhciBlO3JldHVybiBvKHQpJiYoZT10LmNvbnN0cnVjdG9yLFwiZnVuY3Rpb25cIiE9dHlwZW9mIGV8fGUhPT1BcnJheSYmIW8oZS5wcm90b3R5cGUpfHwoZT12b2lkIDApLHIoZSkmJihlPWVbaV0sbnVsbD09PWUmJihlPXZvaWQgMCkpKSx2b2lkIDA9PT1lP0FycmF5OmV9fSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigxMCk7cihyLlArci5SLFwiTWFwXCIse3RvSlNPTjpuKDEwOSkoXCJNYXBcIil9KX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oNTMpLG89bigxMTApO3QuZXhwb3J0cz1mdW5jdGlvbih0KXtyZXR1cm4gZnVuY3Rpb24oKXtpZihyKHRoaXMpIT10KXRocm93IFR5cGVFcnJvcih0K1wiI3RvSlNPTiBpc24ndCBnZW5lcmljXCIpO3JldHVybiBvKHRoaXMpfX19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDEwMik7dC5leHBvcnRzPWZ1bmN0aW9uKHQsZSl7dmFyIG49W107cmV0dXJuIHIodCwhMSxuLnB1c2gsbixlKSxufX0sZnVuY3Rpb24odCxlKXtcInVzZSBzdHJpY3RcIjtPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KTtlLnNlbGVjdG9ycz1cInNjcm9sbGJhciwgW3Njcm9sbGJhcl0sIFtkYXRhLXNjcm9sbGJhcl1cIn0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fXZhciBvPW4oODYpLGk9cihvKSx1PW4oOTApLGE9cih1KTtPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KTt2YXIgYz1uKDExMyk7KDAsYS5kZWZhdWx0KShjKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gY1t0XX19KX0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19dmFyIG89big4NiksaT1yKG8pLHU9big5MCksYT1yKHUpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO3ZhciBjPW4oMTE0KTsoMCxhLmRlZmF1bHQpKGMpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBjW3RdfX0pfSk7dmFyIGw9bigxMTUpOygwLGEuZGVmYXVsdCkobCkuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGxbdF19fSl9KTt2YXIgZj1uKDExNik7KDAsYS5kZWZhdWx0KShmKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gZlt0XX19KX0pO3ZhciBzPW4oMTE3KTsoMCxhLmRlZmF1bHQpKHMpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBzW3RdfX0pfSk7dmFyIGQ9bigxMTgpOygwLGEuZGVmYXVsdCkoZCkuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGRbdF19fSl9KTt2YXIgaD1uKDExOSk7KDAsYS5kZWZhdWx0KShoKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gaFt0XX19KX0pO3ZhciB2PW4oMTIwKTsoMCxhLmRlZmF1bHQpKHYpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiB2W3RdfX0pfSk7dmFyIF89bigxMjEpOygwLGEuZGVmYXVsdCkoXykuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIF9bdF19fSl9KTt2YXIgcD1uKDEyMik7KDAsYS5kZWZhdWx0KShwKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gcFt0XX19KX0pO3ZhciB5PW4oMTIzKTsoMCxhLmRlZmF1bHQpKHkpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiB5W3RdfX0pfSk7dmFyIGI9bigxMjQpOygwLGEuZGVmYXVsdCkoYikuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGJbdF19fSl9KX0sZnVuY3Rpb24odCxlKXtcInVzZSBzdHJpY3RcIjtPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KTtlLmJ1aWxkQ3VydmU9ZnVuY3Rpb24odCxlKXtpZihlPD0wKXJldHVyblt0XTtmb3IodmFyIG49W10scj1NYXRoLnJvdW5kKGUvMWUzKjYwKS0xLG89dD9NYXRoLnBvdygxL01hdGguYWJzKHQpLDEvcik6MCxpPTE7aTw9cjtpKyspbi5wdXNoKHQtdCpNYXRoLnBvdyhvLGkpKTtyZXR1cm4gbi5wdXNoKHQpLG59fSxmdW5jdGlvbih0LGUpe1widXNlIHN0cmljdFwiO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO3ZhciBuPTEwMDtlLmRlYm91bmNlPWZ1bmN0aW9uKHQpe3ZhciBlPWFyZ3VtZW50cy5sZW5ndGg+MSYmdm9pZCAwIT09YXJndW1lbnRzWzFdP2FyZ3VtZW50c1sxXTpuLHI9IShhcmd1bWVudHMubGVuZ3RoPjImJnZvaWQgMCE9PWFyZ3VtZW50c1syXSl8fGFyZ3VtZW50c1syXTtpZihcImZ1bmN0aW9uXCI9PXR5cGVvZiB0KXt2YXIgbz12b2lkIDA7cmV0dXJuIGZ1bmN0aW9uKCl7Zm9yKHZhciBuPWFyZ3VtZW50cy5sZW5ndGgsaT1BcnJheShuKSx1PTA7dTxuO3UrKylpW3VdPWFyZ3VtZW50c1t1XTshbyYmciYmc2V0VGltZW91dChmdW5jdGlvbigpe3JldHVybiB0LmFwcGx5KHZvaWQgMCxpKX0pLGNsZWFyVGltZW91dChvKSxvPXNldFRpbWVvdXQoZnVuY3Rpb24oKXtvPXZvaWQgMCx0LmFwcGx5KHZvaWQgMCxpKX0sZSl9fX19LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX1mdW5jdGlvbiBvKHQpe2lmKEFycmF5LmlzQXJyYXkodCkpe2Zvcih2YXIgZT0wLG49QXJyYXkodC5sZW5ndGgpO2U8dC5sZW5ndGg7ZSsrKW5bZV09dFtlXTtyZXR1cm4gbn1yZXR1cm4oMCx1LmRlZmF1bHQpKHQpfXZhciBpPW4oMiksdT1yKGkpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMFxufSk7ZS5maW5kQ2hpbGQ9ZnVuY3Rpb24odCxlKXt2YXIgbj10LmNoaWxkcmVuLHI9bnVsbDtyZXR1cm4gbiYmW10uY29uY2F0KG8obikpLnNvbWUoZnVuY3Rpb24odCl7aWYodC5jbGFzc05hbWUubWF0Y2goZSkpcmV0dXJuIHI9dCwhMH0pLHJ9fSxmdW5jdGlvbih0LGUpe1widXNlIHN0cmljdFwiO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO3ZhciBuPXtTVEFOREFSRDoxLE9USEVSUzotM30scj1bMSwyOCw1MDBdLG89ZnVuY3Rpb24odCl7cmV0dXJuIHJbdF18fHJbMF19O2UuZ2V0RGVsdGE9ZnVuY3Rpb24odCl7aWYoXCJkZWx0YVhcImluIHQpe3ZhciBlPW8odC5kZWx0YU1vZGUpO3JldHVybnt4OnQuZGVsdGFYL24uU1RBTkRBUkQqZSx5OnQuZGVsdGFZL24uU1RBTkRBUkQqZX19cmV0dXJuXCJ3aGVlbERlbHRhWFwiaW4gdD97eDp0LndoZWVsRGVsdGFYL24uT1RIRVJTLHk6dC53aGVlbERlbHRhWS9uLk9USEVSU306e3g6MCx5OnQud2hlZWxEZWx0YS9uLk9USEVSU319fSxmdW5jdGlvbih0LGUpe1widXNlIHN0cmljdFwiO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO2UuZ2V0UG9pbnRlckRhdGE9ZnVuY3Rpb24odCl7cmV0dXJuIHQudG91Y2hlcz90LnRvdWNoZXNbdC50b3VjaGVzLmxlbmd0aC0xXTp0fX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pLGUuZ2V0UG9zaXRpb249dm9pZCAwO3ZhciByPW4oMTE4KTtlLmdldFBvc2l0aW9uPWZ1bmN0aW9uKHQpe3ZhciBlPSgwLHIuZ2V0UG9pbnRlckRhdGEpKHQpO3JldHVybnt4OmUuY2xpZW50WCx5OmUuY2xpZW50WX19fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSksZS5nZXRUb3VjaElEPXZvaWQgMDt2YXIgcj1uKDExOCk7ZS5nZXRUb3VjaElEPWZ1bmN0aW9uKHQpe3ZhciBlPSgwLHIuZ2V0UG9pbnRlckRhdGEpKHQpO3JldHVybiBlLmlkZW50aWZpZXJ9fSxmdW5jdGlvbih0LGUpe1widXNlIHN0cmljdFwiO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO2UuaXNPbmVPZj1mdW5jdGlvbih0KXt2YXIgZT1hcmd1bWVudHMubGVuZ3RoPjEmJnZvaWQgMCE9PWFyZ3VtZW50c1sxXT9hcmd1bWVudHNbMV06W107cmV0dXJuIGUuc29tZShmdW5jdGlvbihlKXtyZXR1cm4gdD09PWV9KX19LGZ1bmN0aW9uKHQsZSl7XCJ1c2Ugc3RyaWN0XCI7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSk7ZS5waWNrSW5SYW5nZT1mdW5jdGlvbih0KXt2YXIgZT1hcmd1bWVudHMubGVuZ3RoPjEmJnZvaWQgMCE9PWFyZ3VtZW50c1sxXT9hcmd1bWVudHNbMV06LSgxLzApLG49YXJndW1lbnRzLmxlbmd0aD4yJiZ2b2lkIDAhPT1hcmd1bWVudHNbMl0/YXJndW1lbnRzWzJdOjEvMDtyZXR1cm4gTWF0aC5tYXgoZSxNYXRoLm1pbih0LG4pKX19LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX12YXIgbz1uKDkwKSxpPXIobyk7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSk7dmFyIHU9W1wid2Via2l0XCIsXCJtb3pcIixcIm1zXCIsXCJvXCJdLGE9bmV3IFJlZ0V4cChcIl4tKD8hKD86XCIrdS5qb2luKFwifFwiKStcIiktKVwiKSxjPWZ1bmN0aW9uKHQpe3ZhciBlPXt9O3JldHVybigwLGkuZGVmYXVsdCkodCkuZm9yRWFjaChmdW5jdGlvbihuKXtpZighYS50ZXN0KG4pKXJldHVybiB2b2lkKGVbbl09dFtuXSk7dmFyIHI9dFtuXTtuPW4ucmVwbGFjZSgvXi0vLFwiXCIpLGVbbl09cix1LmZvckVhY2goZnVuY3Rpb24odCl7ZVtcIi1cIit0K1wiLVwiK25dPXJ9KX0pLGV9O2Uuc2V0U3R5bGU9ZnVuY3Rpb24odCxlKXtlPWMoZSksKDAsaS5kZWZhdWx0KShlKS5mb3JFYWNoKGZ1bmN0aW9uKG4pe3ZhciByPW4ucmVwbGFjZSgvXi0vLFwiXCIpLnJlcGxhY2UoLy0oW2Etel0pL2csZnVuY3Rpb24odCxlKXtyZXR1cm4gZS50b1VwcGVyQ2FzZSgpfSk7dC5zdHlsZVtyXT1lW25dfSl9fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19ZnVuY3Rpb24gbyh0KXtpZihBcnJheS5pc0FycmF5KHQpKXtmb3IodmFyIGU9MCxuPUFycmF5KHQubGVuZ3RoKTtlPHQubGVuZ3RoO2UrKyluW2VdPXRbZV07cmV0dXJuIG59cmV0dXJuKDAsYS5kZWZhdWx0KSh0KX1mdW5jdGlvbiBpKHQsZSl7aWYoISh0IGluc3RhbmNlb2YgZSkpdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKX12YXIgdT1uKDIpLGE9cih1KSxjPW4oODYpLGw9cihjKSxmPW4oMTI1KSxzPXIoZik7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSksZS5Ub3VjaFJlY29yZD12b2lkIDA7dmFyIGQ9cy5kZWZhdWx0fHxmdW5jdGlvbih0KXtmb3IodmFyIGU9MTtlPGFyZ3VtZW50cy5sZW5ndGg7ZSsrKXt2YXIgbj1hcmd1bWVudHNbZV07Zm9yKHZhciByIGluIG4pT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG4scikmJih0W3JdPW5bcl0pfXJldHVybiB0fSxoPWZ1bmN0aW9uKCl7ZnVuY3Rpb24gdCh0LGUpe2Zvcih2YXIgbj0wO248ZS5sZW5ndGg7bisrKXt2YXIgcj1lW25dO3IuZW51bWVyYWJsZT1yLmVudW1lcmFibGV8fCExLHIuY29uZmlndXJhYmxlPSEwLFwidmFsdWVcImluIHImJihyLndyaXRhYmxlPSEwKSwoMCxsLmRlZmF1bHQpKHQsci5rZXkscil9fXJldHVybiBmdW5jdGlvbihlLG4scil7cmV0dXJuIG4mJnQoZS5wcm90b3R5cGUsbiksciYmdChlLHIpLGV9fSgpLHY9bigxMTkpLF89ZnVuY3Rpb24oKXtmdW5jdGlvbiB0KGUpe2kodGhpcyx0KSx0aGlzLnVwZGF0ZVRpbWU9RGF0ZS5ub3coKSx0aGlzLmRlbHRhPXt4OjAseTowfSx0aGlzLnZlbG9jaXR5PXt4OjAseTowfSx0aGlzLmxhc3RQb3NpdGlvbj0oMCx2LmdldFBvc2l0aW9uKShlKX1yZXR1cm4gaCh0LFt7a2V5OlwidXBkYXRlXCIsdmFsdWU6ZnVuY3Rpb24odCl7dmFyIGU9dGhpcy52ZWxvY2l0eSxuPXRoaXMudXBkYXRlVGltZSxyPXRoaXMubGFzdFBvc2l0aW9uLG89RGF0ZS5ub3coKSxpPSgwLHYuZ2V0UG9zaXRpb24pKHQpLHU9e3g6LShpLngtci54KSx5Oi0oaS55LXIueSl9LGE9by1ufHwxNixjPXUueC9hKjFlMyxsPXUueS9hKjFlMztlLng9LjgqYysuMiplLngsZS55PS44KmwrLjIqZS55LHRoaXMuZGVsdGE9dSx0aGlzLnVwZGF0ZVRpbWU9byx0aGlzLmxhc3RQb3NpdGlvbj1pfX1dKSx0fSgpO2UuVG91Y2hSZWNvcmQ9ZnVuY3Rpb24oKXtmdW5jdGlvbiB0KCl7aSh0aGlzLHQpLHRoaXMudG91Y2hMaXN0PXt9LHRoaXMubGFzdFRvdWNoPW51bGwsdGhpcy5hY3RpdmVUb3VjaElEPXZvaWQgMH1yZXR1cm4gaCh0LFt7a2V5OlwiX19hZGRcIix2YWx1ZTpmdW5jdGlvbih0KXtpZih0aGlzLl9faGFzKHQpKXJldHVybiBudWxsO3ZhciBlPW5ldyBfKHQpO3JldHVybiB0aGlzLnRvdWNoTGlzdFt0LmlkZW50aWZpZXJdPWUsZX19LHtrZXk6XCJfX3JlbmV3XCIsdmFsdWU6ZnVuY3Rpb24odCl7aWYoIXRoaXMuX19oYXModCkpcmV0dXJuIG51bGw7dmFyIGU9dGhpcy50b3VjaExpc3RbdC5pZGVudGlmaWVyXTtyZXR1cm4gZS51cGRhdGUodCksZX19LHtrZXk6XCJfX2RlbGV0ZVwiLHZhbHVlOmZ1bmN0aW9uKHQpe3JldHVybiBkZWxldGUgdGhpcy50b3VjaExpc3RbdC5pZGVudGlmaWVyXX19LHtrZXk6XCJfX2hhc1wiLHZhbHVlOmZ1bmN0aW9uKHQpe3JldHVybiB0aGlzLnRvdWNoTGlzdC5oYXNPd25Qcm9wZXJ0eSh0LmlkZW50aWZpZXIpfX0se2tleTpcIl9fc2V0QWN0aXZlSURcIix2YWx1ZTpmdW5jdGlvbih0KXt0aGlzLmFjdGl2ZVRvdWNoSUQ9dFt0Lmxlbmd0aC0xXS5pZGVudGlmaWVyLHRoaXMubGFzdFRvdWNoPXRoaXMudG91Y2hMaXN0W3RoaXMuYWN0aXZlVG91Y2hJRF19fSx7a2V5OlwiX19nZXRBY3RpdmVUcmFja2VyXCIsdmFsdWU6ZnVuY3Rpb24oKXt2YXIgdD10aGlzLnRvdWNoTGlzdCxlPXRoaXMuYWN0aXZlVG91Y2hJRDtyZXR1cm4gdFtlXX19LHtrZXk6XCJpc0FjdGl2ZVwiLHZhbHVlOmZ1bmN0aW9uKCl7cmV0dXJuIHZvaWQgMCE9PXRoaXMuYWN0aXZlVG91Y2hJRH19LHtrZXk6XCJnZXREZWx0YVwiLHZhbHVlOmZ1bmN0aW9uKCl7dmFyIHQ9dGhpcy5fX2dldEFjdGl2ZVRyYWNrZXIoKTtyZXR1cm4gdD9kKHt9LHQuZGVsdGEpOnRoaXMuX19wcmltaXRpdmVWYWx1ZX19LHtrZXk6XCJnZXRWZWxvY2l0eVwiLHZhbHVlOmZ1bmN0aW9uKCl7dmFyIHQ9dGhpcy5fX2dldEFjdGl2ZVRyYWNrZXIoKTtyZXR1cm4gdD9kKHt9LHQudmVsb2NpdHkpOnRoaXMuX19wcmltaXRpdmVWYWx1ZX19LHtrZXk6XCJnZXRMYXN0UG9zaXRpb25cIix2YWx1ZTpmdW5jdGlvbigpe3ZhciB0PWFyZ3VtZW50cy5sZW5ndGg+MCYmdm9pZCAwIT09YXJndW1lbnRzWzBdP2FyZ3VtZW50c1swXTpcIlwiLGU9dGhpcy5fX2dldEFjdGl2ZVRyYWNrZXIoKXx8dGhpcy5sYXN0VG91Y2gsbj1lP2UubGFzdFBvc2l0aW9uOnRoaXMuX19wcmltaXRpdmVWYWx1ZTtyZXR1cm4gdD9uLmhhc093blByb3BlcnR5KHQpP25bdF06MDpkKHt9LG4pfX0se2tleTpcInVwZGF0ZWRSZWNlbnRseVwiLHZhbHVlOmZ1bmN0aW9uKCl7dmFyIHQ9dGhpcy5fX2dldEFjdGl2ZVRyYWNrZXIoKTtyZXR1cm4gdCYmRGF0ZS5ub3coKS10LnVwZGF0ZVRpbWU8MzB9fSx7a2V5OlwidHJhY2tcIix2YWx1ZTpmdW5jdGlvbih0KXt2YXIgZT10aGlzLG49dC50YXJnZXRUb3VjaGVzO3JldHVybltdLmNvbmNhdChvKG4pKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe2UuX19hZGQodCl9KSx0aGlzLnRvdWNoTGlzdH19LHtrZXk6XCJ1cGRhdGVcIix2YWx1ZTpmdW5jdGlvbih0KXt2YXIgZT10aGlzLG49dC50b3VjaGVzLHI9dC5jaGFuZ2VkVG91Y2hlcztyZXR1cm5bXS5jb25jYXQobyhuKSkuZm9yRWFjaChmdW5jdGlvbih0KXtlLl9fcmVuZXcodCl9KSx0aGlzLl9fc2V0QWN0aXZlSUQociksdGhpcy50b3VjaExpc3R9fSx7a2V5OlwicmVsZWFzZVwiLHZhbHVlOmZ1bmN0aW9uKHQpe3ZhciBlPXRoaXM7cmV0dXJuIHRoaXMuYWN0aXZlVG91Y2hJRD12b2lkIDAsW10uY29uY2F0KG8odC5jaGFuZ2VkVG91Y2hlcykpLmZvckVhY2goZnVuY3Rpb24odCl7ZS5fX2RlbGV0ZSh0KX0pLHRoaXMudG91Y2hMaXN0fX0se2tleTpcIl9fcHJpbWl0aXZlVmFsdWVcIixnZXQ6ZnVuY3Rpb24oKXtyZXR1cm57eDowLHk6MH19fV0pLHR9KCl9LGZ1bmN0aW9uKHQsZSxuKXt0LmV4cG9ydHM9e2RlZmF1bHQ6bigxMjYpLF9fZXNNb2R1bGU6ITB9fSxmdW5jdGlvbih0LGUsbil7bigxMjcpLHQuZXhwb3J0cz1uKDEyKS5PYmplY3QuYXNzaWdufSxmdW5jdGlvbih0LGUsbil7dmFyIHI9bigxMCk7cihyLlMrci5GLFwiT2JqZWN0XCIse2Fzc2lnbjpuKDEyOCl9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO3ZhciByPW4oMzEpLG89big2OSksaT1uKDcwKSx1PW4oNDcpLGE9bigzNCksYz1PYmplY3QuYXNzaWduO3QuZXhwb3J0cz0hY3x8bigyMSkoZnVuY3Rpb24oKXt2YXIgdD17fSxlPXt9LG49U3ltYm9sKCkscj1cImFiY2RlZmdoaWprbG1ub3BxcnN0XCI7cmV0dXJuIHRbbl09NyxyLnNwbGl0KFwiXCIpLmZvckVhY2goZnVuY3Rpb24odCl7ZVt0XT10fSksNyE9Yyh7fSx0KVtuXXx8T2JqZWN0LmtleXMoYyh7fSxlKSkuam9pbihcIlwiKSE9cn0pP2Z1bmN0aW9uKHQsZSl7Zm9yKHZhciBuPXUodCksYz1hcmd1bWVudHMubGVuZ3RoLGw9MSxmPW8uZixzPWkuZjtjPmw7KWZvcih2YXIgZCxoPWEoYXJndW1lbnRzW2wrK10pLHY9Zj9yKGgpLmNvbmNhdChmKGgpKTpyKGgpLF89di5sZW5ndGgscD0wO18+cDspcy5jYWxsKGgsZD12W3ArK10pJiYobltkXT1oW2RdKTtyZXR1cm4gbn06Y30sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fXZhciBvPW4oODYpLGk9cihvKSx1PW4oOTApLGE9cih1KTtPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KTt2YXIgYz1uKDEzMCk7KDAsYS5kZWZhdWx0KShjKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gY1t0XX19KX0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19dmFyIG89big4NiksaT1yKG8pLHU9big5MCksYT1yKHUpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO3ZhciBjPW4oMTMxKTsoMCxhLmRlZmF1bHQpKGMpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBjW3RdfX0pfSk7dmFyIGw9bigxMzIpOygwLGEuZGVmYXVsdCkobCkuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGxbdF19fSl9KTt2YXIgZj1uKDEzMyk7KDAsYS5kZWZhdWx0KShmKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gZlt0XX19KX0pO3ZhciBzPW4oMTM0KTsoMCxhLmRlZmF1bHQpKHMpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBzW3RdfX0pfSk7dmFyIGQ9bigxMzUpOygwLGEuZGVmYXVsdCkoZCkuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGRbdF19fSl9KTt2YXIgaD1uKDEzNik7KDAsYS5kZWZhdWx0KShoKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gaFt0XX19KX0pO3ZhciB2PW4oMTM3KTsoMCxhLmRlZmF1bHQpKHYpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiB2W3RdfX0pfSk7dmFyIF89bigxMzgpOygwLGEuZGVmYXVsdCkoXykuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIF9bdF19fSl9KTt2YXIgcD1uKDEzOSk7KDAsYS5kZWZhdWx0KShwKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gcFt0XX19KX0pO3ZhciB5PW4oMTQwKTsoMCxhLmRlZmF1bHQpKHkpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiB5W3RdfX0pfSk7dmFyIGI9bigxNDEpOygwLGEuZGVmYXVsdCkoYikuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGJbdF19fSl9KTt2YXIgZz1uKDE0Mik7KDAsYS5kZWZhdWx0KShnKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gZ1t0XX19KX0pO3ZhciBtPW4oMTQzKTsoMCxhLmRlZmF1bHQpKG0pLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBtW3RdfX0pfSk7dmFyIHg9bigxNDQpOygwLGEuZGVmYXVsdCkoeCkuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHhbdF19fSl9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO3ZhciByPW4oNzgpO3IuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZS5jbGVhck1vdmVtZW50PXIuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZS5zdG9wPWZ1bmN0aW9uKCl7dGhpcy5tb3ZlbWVudC54PXRoaXMubW92ZW1lbnQueT0wLGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMuX190aW1lcklELnNjcm9sbFRvKX19LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX1mdW5jdGlvbiBvKHQpe2lmKEFycmF5LmlzQXJyYXkodCkpe2Zvcih2YXIgZT0wLG49QXJyYXkodC5sZW5ndGgpO2U8dC5sZW5ndGg7ZSsrKW5bZV09dFtlXTtyZXR1cm4gbn1yZXR1cm4oMCx1LmRlZmF1bHQpKHQpfXZhciBpPW4oMiksdT1yKGkpLGE9big3OCksYz1uKDExMiksbD1uKDg5KTthLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUuZGVzdHJveT1mdW5jdGlvbih0KXt2YXIgZT10aGlzLl9fbGlzdGVuZXJzLG49dGhpcy5fX2hhbmRsZXJzLHI9dGhpcy5fX29ic2VydmVyLGk9dGhpcy50YXJnZXRzLHU9aS5jb250YWluZXIsYT1pLmNvbnRlbnQ7aWYobi5mb3JFYWNoKGZ1bmN0aW9uKHQpe3ZhciBlPXQuZXZ0LG49dC5lbGVtLHI9dC5mbjtuLnJlbW92ZUV2ZW50TGlzdGVuZXIoZSxyKX0pLG4ubGVuZ3RoPWUubGVuZ3RoPTAsdGhpcy5zdG9wKCksY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5fX3RpbWVySUQucmVuZGVyKSxyJiZyLmRpc2Nvbm5lY3QoKSxsLnNiTGlzdC5kZWxldGUodSksIXQmJnUucGFyZW50Tm9kZSl7Zm9yKHZhciBmPVtdLmNvbmNhdChvKGEuY2hpbGROb2RlcykpO3UuZmlyc3RDaGlsZDspdS5yZW1vdmVDaGlsZCh1LmZpcnN0Q2hpbGQpO2YuZm9yRWFjaChmdW5jdGlvbih0KXtyZXR1cm4gdS5hcHBlbmRDaGlsZCh0KX0pLCgwLGMuc2V0U3R5bGUpKHUse292ZXJmbG93OlwiXCJ9KSx1LnNjcm9sbFRvcD10aGlzLnNjcm9sbFRvcCx1LnNjcm9sbExlZnQ9dGhpcy5zY3JvbGxMZWZ0fX19LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjt2YXIgcj1uKDc4KTtyLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUuZ2V0Q29udGVudEVsZW09ZnVuY3Rpb24oKXtyZXR1cm4gdGhpcy50YXJnZXRzLmNvbnRlbnR9fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHI9big3OCk7ci5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLmdldFNpemU9ZnVuY3Rpb24oKXt2YXIgdD10aGlzLnRhcmdldHMuY29udGFpbmVyLGU9dGhpcy50YXJnZXRzLmNvbnRlbnQ7cmV0dXJue2NvbnRhaW5lcjp7d2lkdGg6dC5jbGllbnRXaWR0aCxoZWlnaHQ6dC5jbGllbnRIZWlnaHR9LGNvbnRlbnQ6e3dpZHRoOmUub2Zmc2V0V2lkdGgtZS5jbGllbnRXaWR0aCtlLnNjcm9sbFdpZHRoLGhlaWdodDplLm9mZnNldEhlaWdodC1lLmNsaWVudEhlaWdodCtlLnNjcm9sbEhlaWdodH19fX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO3ZhciByPW4oNzgpO3IuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZS5pbmZpbml0ZVNjcm9sbD1mdW5jdGlvbih0KXt2YXIgZT1hcmd1bWVudHMubGVuZ3RoPjEmJnZvaWQgMCE9PWFyZ3VtZW50c1sxXT9hcmd1bWVudHNbMV06NTA7aWYoXCJmdW5jdGlvblwiPT10eXBlb2YgdCl7dmFyIG49e3g6MCx5OjB9LHI9ITE7dGhpcy5hZGRMaXN0ZW5lcihmdW5jdGlvbihvKXt2YXIgaT1vLm9mZnNldCx1PW8ubGltaXQ7dS55LWkueTw9ZSYmaS55Pm4ueSYmIXImJihyPSEwLHNldFRpbWVvdXQoZnVuY3Rpb24oKXtyZXR1cm4gdChvKX0pKSx1LnktaS55PmUmJihyPSExKSxuPWl9KX19fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHI9big3OCk7ci5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLmlzVmlzaWJsZT1mdW5jdGlvbih0KXt2YXIgZT10aGlzLmJvdW5kaW5nLG49dC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxyPU1hdGgubWF4KGUudG9wLG4udG9wKSxvPU1hdGgubWF4KGUubGVmdCxuLmxlZnQpLGk9TWF0aC5taW4oZS5yaWdodCxuLnJpZ2h0KSx1PU1hdGgubWluKGUuYm90dG9tLG4uYm90dG9tKTtyZXR1cm4gcjx1JiZvPGl9fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHI9big3OCk7ci5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLmFkZExpc3RlbmVyPWZ1bmN0aW9uKHQpe1wiZnVuY3Rpb25cIj09dHlwZW9mIHQmJnRoaXMuX19saXN0ZW5lcnMucHVzaCh0KX0sci5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyPWZ1bmN0aW9uKHQpe1wiZnVuY3Rpb25cIj09dHlwZW9mIHQmJnRoaXMuX19saXN0ZW5lcnMuc29tZShmdW5jdGlvbihlLG4scil7cmV0dXJuIGU9PT10JiZyLnNwbGljZShuLDEpfSl9fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19ZnVuY3Rpb24gbyh0LGUsbil7cmV0dXJuIGUgaW4gdD8oMCxsLmRlZmF1bHQpKHQsZSx7dmFsdWU6bixlbnVtZXJhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMCx3cml0YWJsZTohMH0pOnRbZV09bix0fWZ1bmN0aW9uIGkodCxlKXtyZXR1cm4hIWUubGVuZ3RoJiZlLnNvbWUoZnVuY3Rpb24oZSl7cmV0dXJuIHQubWF0Y2goZSl9KX1mdW5jdGlvbiB1KCl7dmFyIHQ9YXJndW1lbnRzLmxlbmd0aD4wJiZ2b2lkIDAhPT1hcmd1bWVudHNbMF0/YXJndW1lbnRzWzBdOnMuUkVHSUVTVEVSLGU9ZFt0XTtyZXR1cm4gZnVuY3Rpb24oKXtmb3IodmFyIG49YXJndW1lbnRzLmxlbmd0aCxyPUFycmF5KG4pLG89MDtvPG47bysrKXJbb109YXJndW1lbnRzW29dO3RoaXMuX19oYW5kbGVycy5mb3JFYWNoKGZ1bmN0aW9uKG4pe3ZhciBvPW4uZWxlbSx1PW4uZXZ0LGE9bi5mbixjPW4uaGFzUmVnaXN0ZXJlZDtjJiZ0PT09cy5SRUdJRVNURVJ8fCFjJiZ0PT09cy5VTlJFR0lFU1RFUnx8aSh1LHIpJiYob1tlXSh1LGEpLG4uaGFzUmVnaXN0ZXJlZD0hYyl9KX19dmFyIGEsYz1uKDg2KSxsPXIoYyksZj1uKDc4KSxzPXtSRUdJRVNURVI6MCxVTlJFR0lFU1RFUjoxfSxkPShhPXt9LG8oYSxzLlJFR0lFU1RFUixcImFkZEV2ZW50TGlzdGVuZXJcIiksbyhhLHMuVU5SRUdJRVNURVIsXCJyZW1vdmVFdmVudExpc3RlbmVyXCIpLGEpO2YuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZS5yZWdpc3RlckV2ZW50cz11KHMuUkVHSUVTVEVSKSxmLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUudW5yZWdpc3RlckV2ZW50cz11KHMuVU5SRUdJRVNURVIpfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7dmFyIHI9big3OCk7ci5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLnNjcm9sbEludG9WaWV3PWZ1bmN0aW9uKHQpe3ZhciBlPWFyZ3VtZW50cy5sZW5ndGg+MSYmdm9pZCAwIT09YXJndW1lbnRzWzFdP2FyZ3VtZW50c1sxXTp7fSxuPWUuYWxpZ25Ub1RvcCxyPXZvaWQgMD09PW58fG4sbz1lLm9ubHlTY3JvbGxJZk5lZWRlZCxpPXZvaWQgMCE9PW8mJm8sdT1lLm9mZnNldFRvcCxhPXZvaWQgMD09PXU/MDp1LGM9ZS5vZmZzZXRMZWZ0LGw9dm9pZCAwPT09Yz8wOmMsZj1lLm9mZnNldEJvdHRvbSxzPXZvaWQgMD09PWY/MDpmLGQ9dGhpcy50YXJnZXRzLGg9dGhpcy5ib3VuZGluZztpZih0JiZkLmNvbnRhaW5lci5jb250YWlucyh0KSl7dmFyIHY9dC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtpJiZ0aGlzLmlzVmlzaWJsZSh0KXx8dGhpcy5fX3NldE1vdmVtZW50KHYubGVmdC1oLmxlZnQtbCxyP3YudG9wLWgudG9wLWE6di5ib3R0b20taC5ib3R0b20tcyl9fX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO3ZhciByPW4oMTEyKSxvPW4oNzgpO28uU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZS5zY3JvbGxUbz1mdW5jdGlvbigpe3ZhciB0PWFyZ3VtZW50cy5sZW5ndGg+MCYmdm9pZCAwIT09YXJndW1lbnRzWzBdP2FyZ3VtZW50c1swXTp0aGlzLm9mZnNldC54LGU9YXJndW1lbnRzLmxlbmd0aD4xJiZ2b2lkIDAhPT1hcmd1bWVudHNbMV0/YXJndW1lbnRzWzFdOnRoaXMub2Zmc2V0Lnksbj10aGlzLG89YXJndW1lbnRzLmxlbmd0aD4yJiZ2b2lkIDAhPT1hcmd1bWVudHNbMl0/YXJndW1lbnRzWzJdOjAsaT1hcmd1bWVudHMubGVuZ3RoPjMmJnZvaWQgMCE9PWFyZ3VtZW50c1szXT9hcmd1bWVudHNbM106bnVsbCx1PXRoaXMub3B0aW9ucyxhPXRoaXMub2Zmc2V0LGM9dGhpcy5saW1pdCxsPXRoaXMuX190aW1lcklEO2NhbmNlbEFuaW1hdGlvbkZyYW1lKGwuc2Nyb2xsVG8pLGk9XCJmdW5jdGlvblwiPT10eXBlb2YgaT9pOmZ1bmN0aW9uKCl7fSx1LnJlbmRlckJ5UGl4ZWxzJiYodD1NYXRoLnJvdW5kKHQpLGU9TWF0aC5yb3VuZChlKSk7dmFyIGY9YS54LHM9YS55LGQ9KDAsci5waWNrSW5SYW5nZSkodCwwLGMueCktZixoPSgwLHIucGlja0luUmFuZ2UpKGUsMCxjLnkpLXMsdj0oMCxyLmJ1aWxkQ3VydmUpKGQsbyksXz0oMCxyLmJ1aWxkQ3VydmUpKGgsbykscD12Lmxlbmd0aCx5PTAsYj1mdW5jdGlvbiB0KCl7bi5zZXRQb3NpdGlvbihmK3ZbeV0scytfW3ldKSx5KysseT09PXA/cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCl7aShuKX0pOmwuc2Nyb2xsVG89cmVxdWVzdEFuaW1hdGlvbkZyYW1lKHQpfTtiKCl9fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19dmFyIG89big5MCksaT1yKG8pLHU9big3OCk7dS5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLnNldE9wdGlvbnM9ZnVuY3Rpb24oKXt2YXIgdD10aGlzLGU9YXJndW1lbnRzLmxlbmd0aD4wJiZ2b2lkIDAhPT1hcmd1bWVudHNbMF0/YXJndW1lbnRzWzBdOnt9OygwLGkuZGVmYXVsdCkoZSkuZm9yRWFjaChmdW5jdGlvbihuKXt0Lm9wdGlvbnMuaGFzT3duUHJvcGVydHkobikmJnZvaWQgMCE9PWVbbl0mJih0Lm9wdGlvbnNbbl09ZVtuXSl9KX19LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX12YXIgbz1uKDEyNSksaT1yKG8pLHU9aS5kZWZhdWx0fHxmdW5jdGlvbih0KXtmb3IodmFyIGU9MTtlPGFyZ3VtZW50cy5sZW5ndGg7ZSsrKXt2YXIgbj1hcmd1bWVudHNbZV07Zm9yKHZhciByIGluIG4pT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG4scikmJih0W3JdPW5bcl0pfXJldHVybiB0fSxhPW4oMTEyKSxjPW4oNzgpO2MuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZS5zZXRQb3NpdGlvbj1mdW5jdGlvbigpe3ZhciB0PWFyZ3VtZW50cy5sZW5ndGg+MCYmdm9pZCAwIT09YXJndW1lbnRzWzBdP2FyZ3VtZW50c1swXTp0aGlzLm9mZnNldC54LGU9YXJndW1lbnRzLmxlbmd0aD4xJiZ2b2lkIDAhPT1hcmd1bWVudHNbMV0/YXJndW1lbnRzWzFdOnRoaXMub2Zmc2V0Lnksbj1hcmd1bWVudHMubGVuZ3RoPjImJnZvaWQgMCE9PWFyZ3VtZW50c1syXSYmYXJndW1lbnRzWzJdO3RoaXMuX19oaWRlVHJhY2tUaHJvdHRsZSgpO3ZhciByPXt9LG89dGhpcy5vcHRpb25zLGk9dGhpcy5vZmZzZXQsYz10aGlzLmxpbWl0LGw9dGhpcy50YXJnZXRzLGY9dGhpcy5fX2xpc3RlbmVycztvLnJlbmRlckJ5UGl4ZWxzJiYodD1NYXRoLnJvdW5kKHQpLGU9TWF0aC5yb3VuZChlKSksdCE9PWkueCYmdGhpcy5zaG93VHJhY2soXCJ4XCIpLGUhPT1pLnkmJnRoaXMuc2hvd1RyYWNrKFwieVwiKSx0PSgwLGEucGlja0luUmFuZ2UpKHQsMCxjLngpLGU9KDAsYS5waWNrSW5SYW5nZSkoZSwwLGMueSksdD09PWkueCYmZT09PWkueXx8KHIuZGlyZWN0aW9uPXt4OnQ9PT1pLng/XCJub25lXCI6dD5pLng/XCJyaWdodFwiOlwibGVmdFwiLHk6ZT09PWkueT9cIm5vbmVcIjplPmkueT9cImRvd25cIjpcInVwXCJ9LHRoaXMuX19yZWFkb25seShcIm9mZnNldFwiLHt4OnQseTplfSksci5saW1pdD11KHt9LGMpLHIub2Zmc2V0PXUoe30sdGhpcy5vZmZzZXQpLHRoaXMuX19zZXRUaHVtYlBvc2l0aW9uKCksKDAsYS5zZXRTdHlsZSkobC5jb250ZW50LHtcIi10cmFuc2Zvcm1cIjpcInRyYW5zbGF0ZTNkKFwiKy10K1wicHgsIFwiKy1lK1wicHgsIDApXCJ9KSxufHxmLmZvckVhY2goZnVuY3Rpb24odCl7by5zeW5jQ2FsbGJhY2tzP3Qocik6cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCl7dChyKX0pfSkpfX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fWZ1bmN0aW9uIG8odCxlLG4pe3JldHVybiBlIGluIHQ/KDAsYy5kZWZhdWx0KSh0LGUse3ZhbHVlOm4sZW51bWVyYWJsZTohMCxjb25maWd1cmFibGU6ITAsd3JpdGFibGU6ITB9KTp0W2VdPW4sdH1mdW5jdGlvbiBpKCl7dmFyIHQ9YXJndW1lbnRzLmxlbmd0aD4wJiZ2b2lkIDAhPT1hcmd1bWVudHNbMF0/YXJndW1lbnRzWzBdOmYuU0hPVyxlPWRbdF07cmV0dXJuIGZ1bmN0aW9uKCl7dmFyIG49YXJndW1lbnRzLmxlbmd0aD4wJiZ2b2lkIDAhPT1hcmd1bWVudHNbMF0/YXJndW1lbnRzWzBdOlwiYm90aFwiLHI9dGhpcy5vcHRpb25zLG89dGhpcy5tb3ZlbWVudCxpPXRoaXMudGFyZ2V0cyx1PWkuY29udGFpbmVyLGE9aS54QXhpcyxjPWkueUF4aXM7by54fHxvLnk/dS5jbGFzc0xpc3QuYWRkKHMuQ09OVEFJTkVSKTp1LmNsYXNzTGlzdC5yZW1vdmUocy5DT05UQUlORVIpLHIuYWx3YXlzU2hvd1RyYWNrcyYmdD09PWYuSElERXx8KG49bi50b0xvd2VyQ2FzZSgpLFwiYm90aFwiPT09biYmKGEudHJhY2suY2xhc3NMaXN0W2VdKHMuVFJBQ0spLGMudHJhY2suY2xhc3NMaXN0W2VdKHMuVFJBQ0spKSxcInhcIj09PW4mJmEudHJhY2suY2xhc3NMaXN0W2VdKHMuVFJBQ0spLFwieVwiPT09biYmYy50cmFjay5jbGFzc0xpc3RbZV0ocy5UUkFDSykpfX12YXIgdSxhPW4oODYpLGM9cihhKSxsPW4oNzgpLGY9e1NIT1c6MCxISURFOjF9LHM9e1RSQUNLOlwic2hvd1wiLENPTlRBSU5FUjpcInNjcm9sbGluZ1wifSxkPSh1PXt9LG8odSxmLlNIT1csXCJhZGRcIiksbyh1LGYuSElERSxcInJlbW92ZVwiKSx1KTtsLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUuc2hvd1RyYWNrPWkoZi5TSE9XKSxsLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUuaGlkZVRyYWNrPWkoZi5ISURFKX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIoKXtpZihcImdsb3dcIj09PXRoaXMub3B0aW9ucy5vdmVyc2Nyb2xsRWZmZWN0KXt2YXIgdD10aGlzLnRhcmdldHMsZT10aGlzLnNpemUsbj10LmNhbnZhcyxyPW4uZWxlbSxvPW4uY29udGV4dCxpPXdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvfHwxLHU9ZS5jb250YWluZXIud2lkdGgqaSxhPWUuY29udGFpbmVyLmhlaWdodCppO3U9PT1yLndpZHRoJiZhPT09ci5oZWlnaHR8fChyLndpZHRoPXUsci5oZWlnaHQ9YSxvLnNjYWxlKGksaSkpfX1mdW5jdGlvbiBvKCl7dmFyIHQ9dGhpcy5zaXplLGU9dGhpcy50aHVtYlNpemUsbj10aGlzLnRhcmdldHMscj1uLnhBeGlzLG89bi55QXhpczsoMCx1LnNldFN0eWxlKShyLnRyYWNrLHtkaXNwbGF5OnQuY29udGVudC53aWR0aDw9dC5jb250YWluZXIud2lkdGg/XCJub25lXCI6XCJibG9ja1wifSksKDAsdS5zZXRTdHlsZSkoby50cmFjayx7ZGlzcGxheTp0LmNvbnRlbnQuaGVpZ2h0PD10LmNvbnRhaW5lci5oZWlnaHQ/XCJub25lXCI6XCJibG9ja1wifSksKDAsdS5zZXRTdHlsZSkoci50aHVtYix7d2lkdGg6ZS54K1wicHhcIn0pLCgwLHUuc2V0U3R5bGUpKG8udGh1bWIse2hlaWdodDplLnkrXCJweFwifSl9ZnVuY3Rpb24gaSgpe3ZhciB0PXRoaXMub3B0aW9uczt0aGlzLl9fdXBkYXRlQm91bmRpbmcoKTt2YXIgZT10aGlzLmdldFNpemUoKSxuPXt4Ok1hdGgubWF4KGUuY29udGVudC53aWR0aC1lLmNvbnRhaW5lci53aWR0aCwwKSx5Ok1hdGgubWF4KGUuY29udGVudC5oZWlnaHQtZS5jb250YWluZXIuaGVpZ2h0LDApfSxpPXtyZWFsWDplLmNvbnRhaW5lci53aWR0aC9lLmNvbnRlbnQud2lkdGgqZS5jb250YWluZXIud2lkdGgscmVhbFk6ZS5jb250YWluZXIuaGVpZ2h0L2UuY29udGVudC5oZWlnaHQqZS5jb250YWluZXIuaGVpZ2h0fTtpLng9TWF0aC5tYXgoaS5yZWFsWCx0LnRodW1iTWluU2l6ZSksaS55PU1hdGgubWF4KGkucmVhbFksdC50aHVtYk1pblNpemUpLHRoaXMuX19yZWFkb25seShcInNpemVcIixlKS5fX3JlYWRvbmx5KFwibGltaXRcIixuKS5fX3JlYWRvbmx5KFwidGh1bWJTaXplXCIsaSksby5jYWxsKHRoaXMpLHIuY2FsbCh0aGlzKSx0aGlzLnNldFBvc2l0aW9uKCksdGhpcy5fX3NldFRodW1iUG9zaXRpb24oKX12YXIgdT1uKDExMiksYT1uKDc4KTthLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUudXBkYXRlPWZ1bmN0aW9uKHQpe3Q/cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGkuYmluZCh0aGlzKSk6aS5jYWxsKHRoaXMpfX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fXZhciBvPW4oODYpLGk9cihvKSx1PW4oOTApLGE9cih1KTtPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KTt2YXIgYz1uKDE0Nik7KDAsYS5kZWZhdWx0KShjKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gY1t0XX19KX0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19dmFyIG89big4NiksaT1yKG8pLHU9big5MCksYT1yKHUpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO3ZhciBjPW4oMTQ3KTsoMCxhLmRlZmF1bHQpKGMpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBjW3RdfX0pfSk7dmFyIGw9bigxNDgpOygwLGEuZGVmYXVsdCkobCkuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGxbdF19fSl9KTt2YXIgZj1uKDE0OSk7KDAsYS5kZWZhdWx0KShmKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gZlt0XX19KX0pO3ZhciBzPW4oMTU0KTsoMCxhLmRlZmF1bHQpKHMpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBzW3RdfX0pfSk7dmFyIGQ9bigxNTUpOygwLGEuZGVmYXVsdCkoZCkuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGRbdF19fSl9KTt2YXIgaD1uKDE1Nik7KDAsYS5kZWZhdWx0KShoKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gaFt0XX19KX0pO3ZhciB2PW4oMTU3KTsoMCxhLmRlZmF1bHQpKHYpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiB2W3RdfX0pfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX1mdW5jdGlvbiBvKHQpe2lmKEFycmF5LmlzQXJyYXkodCkpe2Zvcih2YXIgZT0wLG49QXJyYXkodC5sZW5ndGgpO2U8dC5sZW5ndGg7ZSsrKW5bZV09dFtlXTtyZXR1cm4gbn1yZXR1cm4oMCxhLmRlZmF1bHQpKHQpfWZ1bmN0aW9uIGkoKXt2YXIgdD1hcmd1bWVudHMubGVuZ3RoPjAmJnZvaWQgMCE9PWFyZ3VtZW50c1swXT9hcmd1bWVudHNbMF06MCxlPWFyZ3VtZW50cy5sZW5ndGg+MSYmdm9pZCAwIT09YXJndW1lbnRzWzFdP2FyZ3VtZW50c1sxXTowLG49YXJndW1lbnRzLmxlbmd0aD4yJiZ2b2lkIDAhPT1hcmd1bWVudHNbMl0mJmFyZ3VtZW50c1syXSxyPXRoaXMubGltaXQsaT10aGlzLm9wdGlvbnMsdT10aGlzLm1vdmVtZW50O3RoaXMuX191cGRhdGVUaHJvdHRsZSgpLGkucmVuZGVyQnlQaXhlbHMmJih0PU1hdGgucm91bmQodCksZT1NYXRoLnJvdW5kKGUpKTt2YXIgYT11LngrdCxsPXUueStlOzA9PT1yLngmJihhPTApLDA9PT1yLnkmJihsPTApO3ZhciBmPXRoaXMuX19nZXREZWx0YUxpbWl0KG4pO3UueD1jLnBpY2tJblJhbmdlLmFwcGx5KHZvaWQgMCxbYV0uY29uY2F0KG8oZi54KSkpLHUueT1jLnBpY2tJblJhbmdlLmFwcGx5KHZvaWQgMCxbbF0uY29uY2F0KG8oZi55KSkpfXZhciB1PW4oMiksYT1yKHUpLGM9bigxMTIpLGw9big3OCk7T2JqZWN0LmRlZmluZVByb3BlcnR5KGwuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9fYWRkTW92ZW1lbnRcIix7dmFsdWU6aSx3cml0YWJsZTohMCxjb25maWd1cmFibGU6ITB9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIoKXt2YXIgdD10aGlzLGU9dGhpcy5tb3ZlbWVudCxuPXRoaXMubW92ZW1lbnRMb2NrZWQ7YS5mb3JFYWNoKGZ1bmN0aW9uKHIpe25bcl09ZVtyXSYmdC5fX3dpbGxPdmVyc2Nyb2xsKHIsZVtyXSl9KX1mdW5jdGlvbiBvKCl7dmFyIHQ9dGhpcy5tb3ZlbWVudExvY2tlZDthLmZvckVhY2goZnVuY3Rpb24oZSl7dFtlXT0hMX0pfWZ1bmN0aW9uIGkoKXt2YXIgdD10aGlzLm1vdmVtZW50TG9ja2VkO3JldHVybiB0Lnh8fHQueX12YXIgdT1uKDc4KSxhPVtcInhcIixcInlcIl07T2JqZWN0LmRlZmluZVByb3BlcnR5KHUuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9fYXV0b0xvY2tNb3ZlbWVudFwiLHt2YWx1ZTpyLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pLE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh1LlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUsXCJfX3VubG9ja01vdmVtZW50XCIse3ZhbHVlOm8sd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfSksT2JqZWN0LmRlZmluZVByb3BlcnR5KHUuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9faXNNb3ZlbWVudExvY2tlZFwiLHt2YWx1ZTppLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19ZnVuY3Rpb24gbygpe3ZhciB0PWFyZ3VtZW50cy5sZW5ndGg+MCYmdm9pZCAwIT09YXJndW1lbnRzWzBdP2FyZ3VtZW50c1swXTpcIlwiO2lmKHQpe3ZhciBlPXRoaXMub3B0aW9ucyxuPXRoaXMubW92ZW1lbnQscj10aGlzLm92ZXJzY3JvbGxSZW5kZXJlZCxvPXRoaXMuTUFYX09WRVJTQ1JPTEwsaT1uW3RdPSgwLGgucGlja0luUmFuZ2UpKG5bdF0sLW8sbyksdT1lLm92ZXJzY3JvbGxEYW1waW5nLGE9clt0XSsoaS1yW3RdKSp1O2UucmVuZGVyQnlQaXhlbHMmJihhfD0wKSwhdGhpcy5fX2lzTW92ZW1lbnRMb2NrZWQoKSYmTWF0aC5hYnMoYS1yW3RdKTwuMSYmKGEtPWkvTWF0aC5hYnMoaXx8MSkpLE1hdGguYWJzKGEpPE1hdGguYWJzKHJbdF0pJiZ0aGlzLl9fcmVhZG9ubHkoXCJvdmVyc2Nyb2xsQmFja1wiLCEwKSwoYSpyW3RdPDB8fE1hdGguYWJzKGEpPD0xKSYmKGE9MCx0aGlzLl9fcmVhZG9ubHkoXCJvdmVyc2Nyb2xsQmFja1wiLCExKSksclt0XT1hfX1mdW5jdGlvbiBpKHQpe3ZhciBlPXRoaXMuX190b3VjaFJlY29yZCxuPXRoaXMub3ZlcnNjcm9sbFJlbmRlcmVkO3JldHVybiBuLnghPT10Lnh8fG4ueSE9PXQueXx8ISghZC5HTE9CQUxfRU5WLlRPVUNIX1NVUFBPUlRFRHx8IWUudXBkYXRlZFJlY2VudGx5KCkpfWZ1bmN0aW9uIHUoKXt2YXIgdD10aGlzLGU9YXJndW1lbnRzLmxlbmd0aD4wJiZ2b2lkIDAhPT1hcmd1bWVudHNbMF0/YXJndW1lbnRzWzBdOltdO2lmKGUubGVuZ3RoJiZ0aGlzLm9wdGlvbnMub3ZlcnNjcm9sbEVmZmVjdCl7dmFyIG49dGhpcy5vcHRpb25zLHI9dGhpcy5vdmVyc2Nyb2xsUmVuZGVyZWQsdT1sKHt9LHIpO2lmKGUuZm9yRWFjaChmdW5jdGlvbihlKXtyZXR1cm4gby5jYWxsKHQsZSl9KSxpLmNhbGwodGhpcyx1KSlzd2l0Y2gobi5vdmVyc2Nyb2xsRWZmZWN0KXtjYXNlXCJib3VuY2VcIjpyZXR1cm4gcy5vdmVyc2Nyb2xsQm91bmNlLmNhbGwodGhpcyxyLngsci55KTtjYXNlXCJnbG93XCI6cmV0dXJuIHMub3ZlcnNjcm9sbEdsb3cuY2FsbCh0aGlzLHIueCxyLnkpO2RlZmF1bHQ6cmV0dXJufX19dmFyIGE9bigxMjUpLGM9cihhKSxsPWMuZGVmYXVsdHx8ZnVuY3Rpb24odCl7Zm9yKHZhciBlPTE7ZTxhcmd1bWVudHMubGVuZ3RoO2UrKyl7dmFyIG49YXJndW1lbnRzW2VdO2Zvcih2YXIgciBpbiBuKU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChuLHIpJiYodFtyXT1uW3JdKX1yZXR1cm4gdH0sZj1uKDc4KSxzPW4oMTUwKSxkPW4oODkpLGg9bigxMTIpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShmLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUsXCJfX3JlbmRlck92ZXJzY3JvbGxcIix7dmFsdWU6dSx3cml0YWJsZTohMCxjb25maWd1cmFibGU6ITB9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCl7cmV0dXJuIHQmJnQuX19lc01vZHVsZT90OntkZWZhdWx0OnR9fXZhciBvPW4oODYpLGk9cihvKSx1PW4oOTApLGE9cih1KTtPYmplY3QuZGVmaW5lUHJvcGVydHkoZSxcIl9fZXNNb2R1bGVcIix7dmFsdWU6ITB9KTt2YXIgYz1uKDE1MSk7KDAsYS5kZWZhdWx0KShjKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gY1t0XX19KX0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19dmFyIG89big4NiksaT1yKG8pLHU9big5MCksYT1yKHUpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO3ZhciBjPW4oMTUyKTsoMCxhLmRlZmF1bHQpKGMpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBjW3RdfX0pfSk7dmFyIGw9bigxNTMpOygwLGEuZGVmYXVsdCkobCkuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGxbdF19fSl9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCxlKXt2YXIgbj10aGlzLnNpemUscj10aGlzLm9mZnNldCxpPXRoaXMudGFyZ2V0cyx1PXRoaXMudGh1bWJPZmZzZXQsYT1pLnhBeGlzLGM9aS55QXhpcyxsPWkuY29udGVudDtpZigoMCxvLnNldFN0eWxlKShsLHtcIi10cmFuc2Zvcm1cIjpcInRyYW5zbGF0ZTNkKFwiKy0oci54K3QpK1wicHgsIFwiKy0oci55K2UpK1wicHgsIDApXCJ9KSx0KXt2YXIgZj1uLmNvbnRhaW5lci53aWR0aC8obi5jb250YWluZXIud2lkdGgrTWF0aC5hYnModCkpOygwLG8uc2V0U3R5bGUpKGEudGh1bWIse1wiLXRyYW5zZm9ybVwiOlwidHJhbnNsYXRlM2QoXCIrdS54K1wicHgsIDAsIDApIHNjYWxlM2QoXCIrZitcIiwgMSwgMSlcIixcIi10cmFuc2Zvcm0tb3JpZ2luXCI6dDwwP1wibGVmdFwiOlwicmlnaHRcIn0pfWlmKGUpe3ZhciBzPW4uY29udGFpbmVyLmhlaWdodC8obi5jb250YWluZXIuaGVpZ2h0K01hdGguYWJzKGUpKTsoMCxvLnNldFN0eWxlKShjLnRodW1iLHtcIi10cmFuc2Zvcm1cIjpcInRyYW5zbGF0ZTNkKDAsIFwiK3UueStcInB4LCAwKSBzY2FsZTNkKDEsIFwiK3MrXCIsIDEpXCIsXCItdHJhbnNmb3JtLW9yaWdpblwiOmU8MD9cInRvcFwiOlwiYm90dG9tXCJ9KX19T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSksZS5vdmVyc2Nyb2xsQm91bmNlPXI7dmFyIG89bigxMTIpfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0LGUpe3ZhciBuPXRoaXMuc2l6ZSxyPXRoaXMudGFyZ2V0cyxhPXRoaXMub3B0aW9ucyxjPXIuY2FudmFzLGw9Yy5lbGVtLGY9Yy5jb250ZXh0O3JldHVybiB0fHxlPygoMCx1LnNldFN0eWxlKShsLHtkaXNwbGF5OlwiYmxvY2tcIn0pLGYuY2xlYXJSZWN0KDAsMCxuLmNvbnRlbnQud2lkdGgsbi5jb250YWluZXIuaGVpZ2h0KSxmLmZpbGxTdHlsZT1hLm92ZXJzY3JvbGxFZmZlY3RDb2xvcixvLmNhbGwodGhpcyx0KSx2b2lkIGkuY2FsbCh0aGlzLGUpKTooMCx1LnNldFN0eWxlKShsLHtkaXNwbGF5Olwibm9uZVwifSl9ZnVuY3Rpb24gbyh0KXt2YXIgZT10aGlzLnNpemUsbj10aGlzLnRhcmdldHMscj10aGlzLl9fdG91Y2hSZWNvcmQsbz10aGlzLk1BWF9PVkVSU0NST0xMLGk9ZS5jb250YWluZXIsbD1pLndpZHRoLGY9aS5oZWlnaHQscz1uLmNhbnZhcy5jb250ZXh0O3Muc2F2ZSgpLHQ+MCYmcy50cmFuc2Zvcm0oLTEsMCwwLDEsbCwwKTt2YXIgZD0oMCx1LnBpY2tJblJhbmdlKShNYXRoLmFicyh0KS9vLDAsYSksaD0oMCx1LnBpY2tJblJhbmdlKShkLDAsYykqbCx2PU1hdGguYWJzKHQpLF89ci5nZXRMYXN0UG9zaXRpb24oXCJ5XCIpfHxmLzI7cy5nbG9iYWxBbHBoYT1kLHMuYmVnaW5QYXRoKCkscy5tb3ZlVG8oMCwtaCkscy5xdWFkcmF0aWNDdXJ2ZVRvKHYsXywwLGYraCkscy5maWxsKCkscy5jbG9zZVBhdGgoKSxzLnJlc3RvcmUoKX1mdW5jdGlvbiBpKHQpe3ZhciBlPXRoaXMuc2l6ZSxuPXRoaXMudGFyZ2V0cyxyPXRoaXMuX190b3VjaFJlY29yZCxvPXRoaXMuTUFYX09WRVJTQ1JPTEwsaT1lLmNvbnRhaW5lcixsPWkud2lkdGgsZj1pLmhlaWdodCxzPW4uY2FudmFzLmNvbnRleHQ7cy5zYXZlKCksdD4wJiZzLnRyYW5zZm9ybSgxLDAsMCwtMSwwLGYpO3ZhciBkPSgwLHUucGlja0luUmFuZ2UpKE1hdGguYWJzKHQpL28sMCxhKSxoPSgwLHUucGlja0luUmFuZ2UpKGQsMCxjKSpsLHY9ci5nZXRMYXN0UG9zaXRpb24oXCJ4XCIpfHxsLzIsXz1NYXRoLmFicyh0KTtzLmdsb2JhbEFscGhhPWQscy5iZWdpblBhdGgoKSxzLm1vdmVUbygtaCwwKSxzLnF1YWRyYXRpY0N1cnZlVG8odixfLGwraCwwKSxzLmZpbGwoKSxzLmNsb3NlUGF0aCgpLHMucmVzdG9yZSgpfU9iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pLGUub3ZlcnNjcm9sbEdsb3c9cjt2YXIgdT1uKDExMiksYT0uNzUsYz0uMjV9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3ZhciBlPXRoaXMub3B0aW9ucyxuPXRoaXMub2Zmc2V0LHI9dGhpcy5tb3ZlbWVudCxvPXRoaXMuX190b3VjaFJlY29yZCxpPWUuZGFtcGluZyx1PWUucmVuZGVyQnlQaXhlbHMsYT1lLm92ZXJzY3JvbGxEYW1waW5nLGM9blt0XSxsPXJbdF0sZj1pO2lmKHRoaXMuX193aWxsT3ZlcnNjcm9sbCh0LGwpP2Y9YTpvLmlzQWN0aXZlKCkmJihmPS41KSxNYXRoLmFicyhsKTwxKXt2YXIgcz1jK2w7cmV0dXJue21vdmVtZW50OjAscG9zaXRpb246bD4wP01hdGguY2VpbChzKTpNYXRoLmZsb29yKHMpfX12YXIgZD1sKigxLWYpO3JldHVybiB1JiYoZHw9MCkse21vdmVtZW50OmQscG9zaXRpb246YytsLWR9fWZ1bmN0aW9uIG8oKXt2YXIgdD10aGlzLm9wdGlvbnMsZT10aGlzLm9mZnNldCxuPXRoaXMubGltaXQsaT10aGlzLm1vdmVtZW50LGE9dGhpcy5vdmVyc2Nyb2xsUmVuZGVyZWQsYz10aGlzLl9fdGltZXJJRDtpZihpLnh8fGkueXx8YS54fHxhLnkpe3ZhciBsPXIuY2FsbCh0aGlzLFwieFwiKSxmPXIuY2FsbCh0aGlzLFwieVwiKSxzPVtdO2lmKHQub3ZlcnNjcm9sbEVmZmVjdCl7dmFyIGQ9KDAsdS5waWNrSW5SYW5nZSkobC5wb3NpdGlvbiwwLG4ueCksaD0oMCx1LnBpY2tJblJhbmdlKShmLnBvc2l0aW9uLDAsbi55KTsoYS54fHxkPT09ZS54JiZpLngpJiZzLnB1c2goXCJ4XCIpLChhLnl8fGg9PT1lLnkmJmkueSkmJnMucHVzaChcInlcIil9dGhpcy5tb3ZlbWVudExvY2tlZC54fHwoaS54PWwubW92ZW1lbnQpLHRoaXMubW92ZW1lbnRMb2NrZWQueXx8KGkueT1mLm1vdmVtZW50KSx0aGlzLnNldFBvc2l0aW9uKGwucG9zaXRpb24sZi5wb3NpdGlvbiksdGhpcy5fX3JlbmRlck92ZXJzY3JvbGwocyl9Yy5yZW5kZXI9cmVxdWVzdEFuaW1hdGlvbkZyYW1lKG8uYmluZCh0aGlzKSl9dmFyIGk9big3OCksdT1uKDExMik7T2JqZWN0LmRlZmluZVByb3BlcnR5KGkuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9fcmVuZGVyXCIse3ZhbHVlOm8sd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX1mdW5jdGlvbiBvKHQpe2lmKEFycmF5LmlzQXJyYXkodCkpe2Zvcih2YXIgZT0wLG49QXJyYXkodC5sZW5ndGgpO2U8dC5sZW5ndGg7ZSsrKW5bZV09dFtlXTtyZXR1cm4gbn1yZXR1cm4oMCxhLmRlZmF1bHQpKHQpfWZ1bmN0aW9uIGkoKXt2YXIgdD1hcmd1bWVudHMubGVuZ3RoPjAmJnZvaWQgMCE9PWFyZ3VtZW50c1swXT9hcmd1bWVudHNbMF06MCxlPWFyZ3VtZW50cy5sZW5ndGg+MSYmdm9pZCAwIT09YXJndW1lbnRzWzFdP2FyZ3VtZW50c1sxXTowLG49YXJndW1lbnRzLmxlbmd0aD4yJiZ2b2lkIDAhPT1hcmd1bWVudHNbMl0mJmFyZ3VtZW50c1syXSxyPXRoaXMub3B0aW9ucyxpPXRoaXMubW92ZW1lbnQ7dGhpcy5fX3VwZGF0ZVRocm90dGxlKCk7dmFyIHU9dGhpcy5fX2dldERlbHRhTGltaXQobik7ci5yZW5kZXJCeVBpeGVscyYmKHQ9TWF0aC5yb3VuZCh0KSxlPU1hdGgucm91bmQoZSkpLGkueD1jLnBpY2tJblJhbmdlLmFwcGx5KHZvaWQgMCxbdF0uY29uY2F0KG8odS54KSkpLGkueT1jLnBpY2tJblJhbmdlLmFwcGx5KHZvaWQgMCxbZV0uY29uY2F0KG8odS55KSkpfXZhciB1PW4oMiksYT1yKHUpLGM9bigxMTIpLGw9big3OCk7T2JqZWN0LmRlZmluZVByb3BlcnR5KGwuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9fc2V0TW92ZW1lbnRcIix7dmFsdWU6aSx3cml0YWJsZTohMCxjb25maWd1cmFibGU6ITB9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIoKXt2YXIgdD1hcmd1bWVudHMubGVuZ3RoPjAmJnZvaWQgMCE9PWFyZ3VtZW50c1swXT9hcmd1bWVudHNbMF06MCxlPWFyZ3VtZW50cy5sZW5ndGg+MSYmdm9pZCAwIT09YXJndW1lbnRzWzFdP2FyZ3VtZW50c1sxXTowLG49dGhpcy5vcHRpb25zLHI9dGhpcy5vZmZzZXQsbz10aGlzLmxpbWl0O2lmKCFuLmNvbnRpbnVvdXNTY3JvbGxpbmcpcmV0dXJuITE7dmFyIHU9KDAsaS5waWNrSW5SYW5nZSkodCtyLngsMCxvLngpLGE9KDAsaS5waWNrSW5SYW5nZSkoZStyLnksMCxvLnkpLGM9ITA7cmV0dXJuIGMmPXU9PT1yLngsYyY9YT09PXIueSxjJj11PT09by54fHwwPT09dXx8YT09PW8ueXx8MD09PWF9dmFyIG89big3OCksaT1uKDExMik7T2JqZWN0LmRlZmluZVByb3BlcnR5KG8uU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9fc2hvdWxkUHJvcGFnYXRlTW92ZW1lbnRcIix7dmFsdWU6cix3cml0YWJsZTohMCxjb25maWd1cmFibGU6ITB9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIoKXt2YXIgdD1hcmd1bWVudHMubGVuZ3RoPjAmJnZvaWQgMCE9PWFyZ3VtZW50c1swXT9hcmd1bWVudHNbMF06XCJcIixlPWFyZ3VtZW50cy5sZW5ndGg+MSYmdm9pZCAwIT09YXJndW1lbnRzWzFdP2FyZ3VtZW50c1sxXTowO2lmKCF0KXJldHVybiExO3ZhciBuPXRoaXMub2Zmc2V0LHI9dGhpcy5saW1pdCxvPW5bdF07cmV0dXJuKDAsaS5waWNrSW5SYW5nZSkoZStvLDAsclt0XSk9PT1vJiYoMD09PW98fG89PT1yW3RdKX12YXIgbz1uKDc4KSxpPW4oMTEyKTtPYmplY3QuZGVmaW5lUHJvcGVydHkoby5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX193aWxsT3ZlcnNjcm9sbFwiLHt2YWx1ZTpyLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19dmFyIG89big4NiksaT1yKG8pLHU9big5MCksYT1yKHUpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO3ZhciBjPW4oMTU5KTsoMCxhLmRlZmF1bHQpKGMpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBjW3RdfX0pfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX12YXIgbz1uKDg2KSxpPXIobyksdT1uKDkwKSxhPXIodSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSk7dmFyIGM9bigxNjApOygwLGEuZGVmYXVsdCkoYykuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGNbdF19fSl9KTt2YXIgbD1uKDE2MSk7KDAsYS5kZWZhdWx0KShsKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gbFt0XX19KX0pO3ZhciBmPW4oMTY4KTsoMCxhLmRlZmF1bHQpKGYpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBmW3RdfX0pfSk7dmFyIHM9bigxNjkpOygwLGEuZGVmYXVsdCkocykuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHNbdF19fSl9KTt2YXIgZD1uKDE3MCk7KDAsYS5kZWZhdWx0KShkKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gZFt0XX19KX0pO3ZhciBoPW4oMTcxKTsoMCxhLmRlZmF1bHQpKGgpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBoW3RdfX0pfSk7dmFyIHY9bigxNzIpOygwLGEuZGVmYXVsdCkodikuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHZbdF19fSl9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIoKXt2YXIgdD10aGlzLGU9dGhpcy50YXJnZXRzLG49ZS5jb250YWluZXIscj1lLmNvbnRlbnQsbz0hMSx1PXZvaWQgMCxhPXZvaWQgMDtPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcyxcIl9faXNEcmFnXCIse2dldDpmdW5jdGlvbigpe3JldHVybiBvfSxlbnVtZXJhYmxlOiExfSk7dmFyIGM9ZnVuY3Rpb24gZShuKXt2YXIgcj1uLngsbz1uLnk7aWYocnx8byl7dmFyIGk9dC5vcHRpb25zLnNwZWVkO3QuX19zZXRNb3ZlbWVudChyKmksbyppKSx1PXJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpe2Uoe3g6cix5Om99KX0pfX07dGhpcy5fX2FkZEV2ZW50KG4sXCJkcmFnc3RhcnRcIixmdW5jdGlvbihlKXt0Ll9fZXZlbnRGcm9tQ2hpbGRTY3JvbGxiYXIoZSl8fChvPSEwLGE9ZS50YXJnZXQuY2xpZW50SGVpZ2h0LCgwLGkuc2V0U3R5bGUpKHIse1wicG9pbnRlci1ldmVudHNcIjpcImF1dG9cIn0pLGNhbmNlbEFuaW1hdGlvbkZyYW1lKHUpLHQuX191cGRhdGVCb3VuZGluZygpKX0pLHRoaXMuX19hZGRFdmVudChkb2N1bWVudCxcImRyYWdvdmVyIG1vdXNlbW92ZSB0b3VjaG1vdmVcIixmdW5jdGlvbihlKXtpZihvJiYhdC5fX2V2ZW50RnJvbUNoaWxkU2Nyb2xsYmFyKGUpKXtjYW5jZWxBbmltYXRpb25GcmFtZSh1KSxlLnByZXZlbnREZWZhdWx0KCk7dmFyIG49dC5fX2dldFBvaW50ZXJUcmVuZChlLGEpO2Mobil9fSksdGhpcy5fX2FkZEV2ZW50KGRvY3VtZW50LFwiZHJhZ2VuZCBtb3VzZXVwIHRvdWNoZW5kIGJsdXJcIixmdW5jdGlvbigpe2NhbmNlbEFuaW1hdGlvbkZyYW1lKHUpLG89ITF9KX12YXIgbz1uKDc4KSxpPW4oMTEyKTtPYmplY3QuZGVmaW5lUHJvcGVydHkoby5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX19kcmFnSGFuZGxlclwiLHt2YWx1ZTpyLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19ZnVuY3Rpb24gbygpe3ZhciB0PXRoaXMsZT10aGlzLnRhcmdldHMsbj1mdW5jdGlvbihlKXt2YXIgbj10LnNpemUscj10Lm9mZnNldCxvPXQubGltaXQsaT10Lm1vdmVtZW50O3N3aXRjaChlKXtjYXNlIHMuU1BBQ0U6cmV0dXJuWzAsMjAwXTtjYXNlIHMuUEFHRV9VUDpyZXR1cm5bMCwtbi5jb250YWluZXIuaGVpZ2h0KzQwXTtjYXNlIHMuUEFHRV9ET1dOOnJldHVyblswLG4uY29udGFpbmVyLmhlaWdodC00MF07Y2FzZSBzLkVORDpyZXR1cm5bMCxNYXRoLmFicyhpLnkpK28ueS1yLnldO2Nhc2Ugcy5IT01FOnJldHVyblswLC1NYXRoLmFicyhpLnkpLXIueV07Y2FzZSBzLkxFRlQ6cmV0dXJuWy00MCwwXTtjYXNlIHMuVVA6cmV0dXJuWzAsLTQwXTtjYXNlIHMuUklHSFQ6cmV0dXJuWzQwLDBdO2Nhc2Ugcy5ET1dOOnJldHVyblswLDQwXTtkZWZhdWx0OnJldHVybiBudWxsfX0scj1lLmNvbnRhaW5lcjt0aGlzLl9fYWRkRXZlbnQocixcImtleWRvd25cIixmdW5jdGlvbihlKXtpZihkb2N1bWVudC5hY3RpdmVFbGVtZW50PT09cil7dmFyIG89dC5vcHRpb25zLGk9dC5wYXJlbnRzLHU9dC5tb3ZlbWVudExvY2tlZCxhPW4oZS5rZXlDb2RlfHxlLndoaWNoKTtpZihhKXt2YXIgYz1sKGEsMiksZj1jWzBdLHM9Y1sxXTtpZih0Ll9fc2hvdWxkUHJvcGFnYXRlTW92ZW1lbnQoZixzKSlyZXR1cm4gci5ibHVyKCksaS5sZW5ndGgmJmlbMF0uZm9jdXMoKSx0Ll9fdXBkYXRlVGhyb3R0bGUoKTtlLnByZXZlbnREZWZhdWx0KCksdC5fX3VubG9ja01vdmVtZW50KCksZiYmdC5fX3dpbGxPdmVyc2Nyb2xsKFwieFwiLGYpJiYodS54PSEwKSxzJiZ0Ll9fd2lsbE92ZXJzY3JvbGwoXCJ5XCIscykmJih1Lnk9ITApO3ZhciBkPW8uc3BlZWQ7dC5fX2FkZE1vdmVtZW50KGYqZCxzKmQpfX19KSx0aGlzLl9fYWRkRXZlbnQocixcImtleXVwXCIsZnVuY3Rpb24oKXt0Ll9fdW5sb2NrTW92ZW1lbnQoKX0pfXZhciBpPW4oMTYyKSx1PXIoaSksYT1uKDE2NSksYz1yKGEpLGw9ZnVuY3Rpb24oKXtmdW5jdGlvbiB0KHQsZSl7dmFyIG49W10scj0hMCxvPSExLGk9dm9pZCAwO3RyeXtmb3IodmFyIHUsYT0oMCxjLmRlZmF1bHQpKHQpOyEocj0odT1hLm5leHQoKSkuZG9uZSkmJihuLnB1c2godS52YWx1ZSksIWV8fG4ubGVuZ3RoIT09ZSk7cj0hMCk7fWNhdGNoKHQpe289ITAsaT10fWZpbmFsbHl7dHJ5eyFyJiZhLnJldHVybiYmYS5yZXR1cm4oKX1maW5hbGx5e2lmKG8pdGhyb3cgaX19cmV0dXJuIG59cmV0dXJuIGZ1bmN0aW9uKGUsbil7aWYoQXJyYXkuaXNBcnJheShlKSlyZXR1cm4gZTtpZigoMCx1LmRlZmF1bHQpKE9iamVjdChlKSkpcmV0dXJuIHQoZSxuKTt0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBhdHRlbXB0IHRvIGRlc3RydWN0dXJlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZVwiKX19KCksZj1uKDc4KSxzPXtTUEFDRTozMixQQUdFX1VQOjMzLFBBR0VfRE9XTjozNCxFTkQ6MzUsSE9NRTozNixMRUZUOjM3LFVQOjM4LFJJR0hUOjM5LERPV046NDB9O09iamVjdC5kZWZpbmVQcm9wZXJ0eShmLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUsXCJfX2tleWJvYXJkSGFuZGxlclwiLHt2YWx1ZTpvLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7dC5leHBvcnRzPXtkZWZhdWx0Om4oMTYzKSxfX2VzTW9kdWxlOiEwfX0sZnVuY3Rpb24odCxlLG4pe24oNTcpLG4oNCksdC5leHBvcnRzPW4oMTY0KX0sZnVuY3Rpb24odCxlLG4pe3ZhciByPW4oNTMpLG89big0NSkoXCJpdGVyYXRvclwiKSxpPW4oMjcpO3QuZXhwb3J0cz1uKDEyKS5pc0l0ZXJhYmxlPWZ1bmN0aW9uKHQpe3ZhciBlPU9iamVjdCh0KTtyZXR1cm4gdm9pZCAwIT09ZVtvXXx8XCJAQGl0ZXJhdG9yXCJpbiBlfHxpLmhhc093blByb3BlcnR5KHIoZSkpfX0sZnVuY3Rpb24odCxlLG4pe3QuZXhwb3J0cz17ZGVmYXVsdDpuKDE2NiksX19lc01vZHVsZTohMH19LGZ1bmN0aW9uKHQsZSxuKXtuKDU3KSxuKDQpLHQuZXhwb3J0cz1uKDE2Nyl9LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDE3KSxvPW4oNTIpO3QuZXhwb3J0cz1uKDEyKS5nZXRJdGVyYXRvcj1mdW5jdGlvbih0KXt2YXIgZT1vKHQpO2lmKFwiZnVuY3Rpb25cIiE9dHlwZW9mIGUpdGhyb3cgVHlwZUVycm9yKHQrXCIgaXMgbm90IGl0ZXJhYmxlIVwiKTtyZXR1cm4gcihlLmNhbGwodCkpfX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIoKXt2YXIgdD10aGlzLGU9dGhpcy50YXJnZXRzLG49ZS5jb250YWluZXIscj1lLnhBeGlzLG89ZS55QXhpcyx1PWZ1bmN0aW9uKGUsbil7dmFyIHI9dC5zaXplLG89dC50aHVtYlNpemU7aWYoXCJ4XCI9PT1lKXt2YXIgaT1yLmNvbnRhaW5lci53aWR0aC0oby54LW8ucmVhbFgpO3JldHVybiBuL2kqci5jb250ZW50LndpZHRofWlmKFwieVwiPT09ZSl7dmFyIHU9ci5jb250YWluZXIuaGVpZ2h0LShvLnktby5yZWFsWSk7cmV0dXJuIG4vdSpyLmNvbnRlbnQuaGVpZ2h0fXJldHVybiAwfSxhPWZ1bmN0aW9uKHQpe3JldHVybigwLGkuaXNPbmVPZikodCxbci50cmFjayxyLnRodW1iXSk/XCJ4XCI6KDAsaS5pc09uZU9mKSh0LFtvLnRyYWNrLG8udGh1bWJdKT9cInlcIjp2b2lkIDB9LGM9dm9pZCAwLGw9dm9pZCAwLGY9dm9pZCAwLHM9dm9pZCAwLGQ9dm9pZCAwO3RoaXMuX19hZGRFdmVudChuLFwiY2xpY2tcIixmdW5jdGlvbihlKXtpZighbCYmKDAsaS5pc09uZU9mKShlLnRhcmdldCxbci50cmFjayxvLnRyYWNrXSkpe3ZhciBuPWUudGFyZ2V0LGM9YShuKSxmPW4uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkscz0oMCxcbmkuZ2V0UG9zaXRpb24pKGUpLGQ9dC5vZmZzZXQsaD10LnRodW1iU2l6ZTtpZihcInhcIj09PWMpe3ZhciB2PXMueC1mLmxlZnQtaC54LzI7dC5fX3NldE1vdmVtZW50KHUoYyx2KS1kLngsMCl9ZWxzZXt2YXIgXz1zLnktZi50b3AtaC55LzI7dC5fX3NldE1vdmVtZW50KDAsdShjLF8pLWQueSl9fX0pLHRoaXMuX19hZGRFdmVudChuLFwibW91c2Vkb3duXCIsZnVuY3Rpb24oZSl7aWYoKDAsaS5pc09uZU9mKShlLnRhcmdldCxbci50aHVtYixvLnRodW1iXSkpe2M9ITA7dmFyIG49KDAsaS5nZXRQb3NpdGlvbikoZSksdT1lLnRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtzPWEoZS50YXJnZXQpLGY9e3g6bi54LXUubGVmdCx5Om4ueS11LnRvcH0sZD10LnRhcmdldHMuY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpfX0pLHRoaXMuX19hZGRFdmVudCh3aW5kb3csXCJtb3VzZW1vdmVcIixmdW5jdGlvbihlKXtpZihjKXtlLnByZXZlbnREZWZhdWx0KCksbD0hMDt2YXIgbj10Lm9mZnNldCxyPSgwLGkuZ2V0UG9zaXRpb24pKGUpO2lmKFwieFwiPT09cyl7dmFyIG89ci54LWYueC1kLmxlZnQ7dC5zZXRQb3NpdGlvbih1KHMsbyksbi55KX1pZihcInlcIj09PXMpe3ZhciBhPXIueS1mLnktZC50b3A7dC5zZXRQb3NpdGlvbihuLngsdShzLGEpKX19fSksdGhpcy5fX2FkZEV2ZW50KHdpbmRvdyxcIm1vdXNldXAgYmx1clwiLGZ1bmN0aW9uKCl7Yz1sPSExfSl9dmFyIG89big3OCksaT1uKDExMik7T2JqZWN0LmRlZmluZVByb3BlcnR5KG8uU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9fbW91c2VIYW5kbGVyXCIse3ZhbHVlOnIsd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKCl7dGhpcy5fX2FkZEV2ZW50KHdpbmRvdyxcInJlc2l6ZVwiLHRoaXMuX191cGRhdGVUaHJvdHRsZSl9dmFyIG89big3OCk7T2JqZWN0LmRlZmluZVByb3BlcnR5KG8uU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9fcmVzaXplSGFuZGxlclwiLHt2YWx1ZTpyLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcigpe3ZhciB0PXRoaXMsZT0hMSxuPXZvaWQgMCxyPXRoaXMudGFyZ2V0cyxvPXIuY29udGFpbmVyLHU9ci5jb250ZW50LGE9ZnVuY3Rpb24gZShyKXt2YXIgbz1yLngsaT1yLnk7aWYob3x8aSl7dmFyIHU9dC5vcHRpb25zLnNwZWVkO3QuX19zZXRNb3ZlbWVudChvKnUsaSp1KSxuPXJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpe2Uoe3g6byx5Oml9KX0pfX0sYz1mdW5jdGlvbigpe3ZhciB0PWFyZ3VtZW50cy5sZW5ndGg+MCYmdm9pZCAwIT09YXJndW1lbnRzWzBdP2FyZ3VtZW50c1swXTpcIlwiOygwLGkuc2V0U3R5bGUpKG8se1wiLXVzZXItc2VsZWN0XCI6dH0pfTt0aGlzLl9fYWRkRXZlbnQod2luZG93LFwibW91c2Vtb3ZlXCIsZnVuY3Rpb24ocil7aWYoZSl7Y2FuY2VsQW5pbWF0aW9uRnJhbWUobik7dmFyIG89dC5fX2dldFBvaW50ZXJUcmVuZChyKTthKG8pfX0pLHRoaXMuX19hZGRFdmVudCh1LFwic2VsZWN0c3RhcnRcIixmdW5jdGlvbihyKXtyZXR1cm4gdC5fX2V2ZW50RnJvbUNoaWxkU2Nyb2xsYmFyKHIpP2MoXCJub25lXCIpOihjYW5jZWxBbmltYXRpb25GcmFtZShuKSx0Ll9fdXBkYXRlQm91bmRpbmcoKSx2b2lkKGU9ITApKX0pLHRoaXMuX19hZGRFdmVudCh3aW5kb3csXCJtb3VzZXVwIGJsdXJcIixmdW5jdGlvbigpe2NhbmNlbEFuaW1hdGlvbkZyYW1lKG4pLGMoKSxlPSExfSksdGhpcy5fX2FkZEV2ZW50KG8sXCJzY3JvbGxcIixmdW5jdGlvbih0KXt0LnByZXZlbnREZWZhdWx0KCksby5zY3JvbGxUb3A9by5zY3JvbGxMZWZ0PTB9KX12YXIgbz1uKDc4KSxpPW4oMTEyKTtPYmplY3QuZGVmaW5lUHJvcGVydHkoby5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX19zZWxlY3RIYW5kbGVyXCIse3ZhbHVlOnIsd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX1mdW5jdGlvbiBvKCl7dmFyIHQ9dGhpcyxlPXRoaXMudGFyZ2V0cyxuPXRoaXMuX190b3VjaFJlY29yZCxyPWUuY29udGFpbmVyO3RoaXMuX19hZGRFdmVudChyLFwidG91Y2hzdGFydFwiLGZ1bmN0aW9uKGUpe2lmKCF0Ll9faXNEcmFnKXt2YXIgcj10Ll9fdGltZXJJRCxvPXQubW92ZW1lbnQ7Y2FuY2VsQW5pbWF0aW9uRnJhbWUoci5zY3JvbGxUbyksdC5fX3dpbGxPdmVyc2Nyb2xsKFwieFwiKXx8KG8ueD0wKSx0Ll9fd2lsbE92ZXJzY3JvbGwoXCJ5XCIpfHwoby55PTApLG4udHJhY2soZSksdC5fX2F1dG9Mb2NrTW92ZW1lbnQoKX19KSx0aGlzLl9fYWRkRXZlbnQocixcInRvdWNobW92ZVwiLGZ1bmN0aW9uKGUpe2lmKCEodC5fX2lzRHJhZ3x8cyYmcyE9PXQpKXtuLnVwZGF0ZShlKTt2YXIgcj1uLmdldERlbHRhKCksbz1yLngsaT1yLnk7aWYodC5fX3Nob3VsZFByb3BhZ2F0ZU1vdmVtZW50KG8saSkpcmV0dXJuIHQuX191cGRhdGVUaHJvdHRsZSgpO3ZhciB1PXQubW92ZW1lbnQsYT10Lk1BWF9PVkVSU0NST0xMLGM9dC5vcHRpb25zO2lmKHUueCYmdC5fX3dpbGxPdmVyc2Nyb2xsKFwieFwiLG8pKXt2YXIgbD0yO1wiYm91bmNlXCI9PT1jLm92ZXJzY3JvbGxFZmZlY3QmJihsKz1NYXRoLmFicygxMCp1LngvYSkpLE1hdGguYWJzKHUueCk+PWE/bz0wOm8vPWx9aWYodS55JiZ0Ll9fd2lsbE92ZXJzY3JvbGwoXCJ5XCIsaSkpe3ZhciBmPTI7XCJib3VuY2VcIj09PWMub3ZlcnNjcm9sbEVmZmVjdCYmKGYrPU1hdGguYWJzKDEwKnUueS9hKSksTWF0aC5hYnModS55KT49YT9pPTA6aS89Zn10Ll9fYXV0b0xvY2tNb3ZlbWVudCgpLGUucHJldmVudERlZmF1bHQoKSx0Ll9fYWRkTW92ZW1lbnQobyxpLCEwKSxzPXR9fSksdGhpcy5fX2FkZEV2ZW50KHIsXCJ0b3VjaGNhbmNlbCB0b3VjaGVuZFwiLGZ1bmN0aW9uKGUpe2lmKCF0Ll9faXNEcmFnKXt2YXIgcj10Lm9wdGlvbnMuc3BlZWQsbz1uLmdldFZlbG9jaXR5KCksaT17fTsoMCx1LmRlZmF1bHQpKG8pLmZvckVhY2goZnVuY3Rpb24odCl7dmFyIGU9KDAsbC5waWNrSW5SYW5nZSkob1t0XSpjLkdMT0JBTF9FTlYuRUFTSU5HX01VTFRJUExJRVIsLTFlMywxZTMpO2lbdF09TWF0aC5hYnMoZSk+Zj9lKnI6MH0pLHQuX19hZGRNb3ZlbWVudChpLngsaS55LCEwKSx0Ll9fdW5sb2NrTW92ZW1lbnQoKSxuLnJlbGVhc2UoZSkscz1udWxsfX0pfXZhciBpPW4oOTApLHU9cihpKSxhPW4oNzgpLGM9big4OSksbD1uKDExMiksZj0xMDAscz1udWxsO09iamVjdC5kZWZpbmVQcm9wZXJ0eShhLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUsXCJfX3RvdWNoSGFuZGxlclwiLHt2YWx1ZTpvLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcigpe3ZhciB0PXRoaXMsZT10aGlzLnRhcmdldHMuY29udGFpbmVyLG49ITEscj0oMCxpLmRlYm91bmNlKShmdW5jdGlvbigpe249ITF9LDMwLCExKTt0aGlzLl9fYWRkRXZlbnQoZSx1LkdMT0JBTF9FTlYuV0hFRUxfRVZFTlQsZnVuY3Rpb24oZSl7dmFyIG89dC5vcHRpb25zLHU9KDAsaS5nZXREZWx0YSkoZSksYT11LngsYz11Lnk7cmV0dXJuIGEqPW8uc3BlZWQsYyo9by5zcGVlZCx0Ll9fc2hvdWxkUHJvcGFnYXRlTW92ZW1lbnQoYSxjKT90Ll9fdXBkYXRlVGhyb3R0bGUoKTooZS5wcmV2ZW50RGVmYXVsdCgpLHIoKSx0Lm92ZXJzY3JvbGxCYWNrJiYobj0hMCksbiYmKHQuX193aWxsT3ZlcnNjcm9sbChcInhcIixhKSYmKGE9MCksdC5fX3dpbGxPdmVyc2Nyb2xsKFwieVwiLGMpJiYoYz0wKSksdm9pZCB0Ll9fYWRkTW92ZW1lbnQoYSxjLCEwKSl9KX12YXIgbz1uKDc4KSxpPW4oMTEyKSx1PW4oODkpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShvLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUsXCJfX3doZWVsSGFuZGxlclwiLHt2YWx1ZTpyLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19dmFyIG89big4NiksaT1yKG8pLHU9big5MCksYT1yKHUpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShlLFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pO3ZhciBjPW4oMTc0KTsoMCxhLmRlZmF1bHQpKGMpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBjW3RdfX0pfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKHQpe3JldHVybiB0JiZ0Ll9fZXNNb2R1bGU/dDp7ZGVmYXVsdDp0fX12YXIgbz1uKDg2KSxpPXIobyksdT1uKDkwKSxhPXIodSk7T2JqZWN0LmRlZmluZVByb3BlcnR5KGUsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSk7dmFyIGM9bigxNzUpOygwLGEuZGVmYXVsdCkoYykuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIGNbdF19fSl9KTt2YXIgbD1uKDE3Nik7KDAsYS5kZWZhdWx0KShsKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gbFt0XX19KX0pO3ZhciBmPW4oMTc3KTsoMCxhLmRlZmF1bHQpKGYpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBmW3RdfX0pfSk7dmFyIHM9bigxNzgpOygwLGEuZGVmYXVsdCkocykuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHNbdF19fSl9KTt2YXIgZD1uKDE3OSk7KDAsYS5kZWZhdWx0KShkKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gZFt0XX19KX0pO3ZhciBoPW4oMTgyKTsoMCxhLmRlZmF1bHQpKGgpLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBoW3RdfX0pfSk7dmFyIHY9bigxODMpOygwLGEuZGVmYXVsdCkodikuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHZbdF19fSl9KTt2YXIgXz1uKDE4NCk7KDAsYS5kZWZhdWx0KShfKS5mb3JFYWNoKGZ1bmN0aW9uKHQpe1wiZGVmYXVsdFwiIT09dCYmXCJfX2VzTW9kdWxlXCIhPT10JiYoMCxpLmRlZmF1bHQpKGUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gX1t0XX19KX0pO3ZhciBwPW4oMTg1KTsoMCxhLmRlZmF1bHQpKHApLmZvckVhY2goZnVuY3Rpb24odCl7XCJkZWZhdWx0XCIhPT10JiZcIl9fZXNNb2R1bGVcIiE9PXQmJigwLGkuZGVmYXVsdCkoZSx0LHtlbnVtZXJhYmxlOiEwLGdldDpmdW5jdGlvbigpe3JldHVybiBwW3RdfX0pfSk7dmFyIHk9bigxODYpOygwLGEuZGVmYXVsdCkoeSkuZm9yRWFjaChmdW5jdGlvbih0KXtcImRlZmF1bHRcIiE9PXQmJlwiX19lc01vZHVsZVwiIT09dCYmKDAsaS5kZWZhdWx0KShlLHQse2VudW1lcmFibGU6ITAsZ2V0OmZ1bmN0aW9uKCl7cmV0dXJuIHlbdF19fSl9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIodCxlLG4pe3ZhciByPXRoaXM7aWYoIXR8fFwiZnVuY3Rpb25cIiE9dHlwZW9mIHQuYWRkRXZlbnRMaXN0ZW5lcil0aHJvdyBuZXcgVHlwZUVycm9yKFwiZXhwZWN0IGVsZW0gdG8gYmUgYSBET00gZWxlbWVudCwgYnV0IGdvdCBcIit0KTt2YXIgbz1mdW5jdGlvbih0KXtmb3IodmFyIGU9YXJndW1lbnRzLmxlbmd0aCxyPUFycmF5KGU+MT9lLTE6MCksbz0xO288ZTtvKyspcltvLTFdPWFyZ3VtZW50c1tvXTshdC50eXBlLm1hdGNoKC9kcmFnLykmJnQuZGVmYXVsdFByZXZlbnRlZHx8bi5hcHBseSh2b2lkIDAsW3RdLmNvbmNhdChyKSl9O2Uuc3BsaXQoL1xccysvZykuZm9yRWFjaChmdW5jdGlvbihlKXtyLl9faGFuZGxlcnMucHVzaCh7ZXZ0OmUsZWxlbTp0LGZuOm8saGFzUmVnaXN0ZXJlZDohMH0pLHQuYWRkRXZlbnRMaXN0ZW5lcihlLG8pfSl9dmFyIG89big3OCk7T2JqZWN0LmRlZmluZVByb3BlcnR5KG8uU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9fYWRkRXZlbnRcIix7dmFsdWU6cix3cml0YWJsZTohMCxjb25maWd1cmFibGU6ITB9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIoKXt2YXIgdD1hcmd1bWVudHMubGVuZ3RoPjAmJnZvaWQgMCE9PWFyZ3VtZW50c1swXT9hcmd1bWVudHNbMF06e30sZT10LnRhcmdldDtyZXR1cm4gdGhpcy5jaGlsZHJlbi5zb21lKGZ1bmN0aW9uKHQpe3JldHVybiB0LmNvbnRhaW5zKGUpfSl9dmFyIG89big3OCk7T2JqZWN0LmRlZmluZVByb3BlcnR5KG8uU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9fZXZlbnRGcm9tQ2hpbGRTY3JvbGxiYXJcIix7dmFsdWU6cix3cml0YWJsZTohMCxjb25maWd1cmFibGU6ITB9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIoKXt2YXIgdD1hcmd1bWVudHMubGVuZ3RoPjAmJnZvaWQgMCE9PWFyZ3VtZW50c1swXSYmYXJndW1lbnRzWzBdLGU9dGhpcy5vcHRpb25zLG49dGhpcy5vZmZzZXQscj10aGlzLmxpbWl0O3JldHVybiB0JiYoZS5jb250aW51b3VzU2Nyb2xsaW5nfHxlLm92ZXJzY3JvbGxFZmZlY3QpP3t4OlstKDEvMCksMS8wXSx5OlstKDEvMCksMS8wXX06e3g6Wy1uLngsci54LW4ueF0seTpbLW4ueSxyLnktbi55XX19dmFyIG89big3OCk7T2JqZWN0LmRlZmluZVByb3BlcnR5KG8uU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9fZ2V0RGVsdGFMaW1pdFwiLHt2YWx1ZTpyLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXt2YXIgZT1hcmd1bWVudHMubGVuZ3RoPjEmJnZvaWQgMCE9PWFyZ3VtZW50c1sxXT9hcmd1bWVudHNbMV06MCxuPXRoaXMuYm91bmRpbmcscj1uLnRvcCxvPW4ucmlnaHQsdT1uLmJvdHRvbSxhPW4ubGVmdCxjPSgwLGkuZ2V0UG9zaXRpb24pKHQpLGw9Yy54LGY9Yy55LHM9e3g6MCx5OjB9O3JldHVybiAwPT09bCYmMD09PWY/czoobD5vLWU/cy54PWwtbytlOmw8YStlJiYocy54PWwtYS1lKSxmPnUtZT9zLnk9Zi11K2U6ZjxyK2UmJihzLnk9Zi1yLWUpLHMpfXZhciBvPW4oNzgpLGk9bigxMTIpO09iamVjdC5kZWZpbmVQcm9wZXJ0eShvLlNtb290aFNjcm9sbGJhci5wcm90b3R5cGUsXCJfX2dldFBvaW50ZXJUcmVuZFwiLHt2YWx1ZTpyLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19ZnVuY3Rpb24gbyh0KXtpZihBcnJheS5pc0FycmF5KHQpKXtmb3IodmFyIGU9MCxuPUFycmF5KHQubGVuZ3RoKTtlPHQubGVuZ3RoO2UrKyluW2VdPXRbZV07cmV0dXJuIG59cmV0dXJuKDAsaC5kZWZhdWx0KSh0KX1mdW5jdGlvbiBpKHQpe3ZhciBlPXRoaXMsbj17c3BlZWQ6MSxkYW1waW5nOi4xLHRodW1iTWluU2l6ZToyMCxzeW5jQ2FsbGJhY2tzOiExLHJlbmRlckJ5UGl4ZWxzOiEwLGFsd2F5c1Nob3dUcmFja3M6ITEsY29udGludW91c1Njcm9sbGluZzpcImF1dG9cIixvdmVyc2Nyb2xsRWZmZWN0OiExLG92ZXJzY3JvbGxFZmZlY3RDb2xvcjpcIiM4N2NlZWJcIixvdmVyc2Nyb2xsRGFtcGluZzouMn0scj17ZGFtcGluZzpbMCwxXSxzcGVlZDpbMCwxLzBdLHRodW1iTWluU2l6ZTpbMCwxLzBdLG92ZXJzY3JvbGxFZmZlY3Q6WyExLFwiYm91bmNlXCIsXCJnbG93XCJdLG92ZXJzY3JvbGxEYW1waW5nOlswLDFdfSxpPWZ1bmN0aW9uKCl7dmFyIHQ9YXJndW1lbnRzLmxlbmd0aD4wJiZ2b2lkIDAhPT1hcmd1bWVudHNbMF0/YXJndW1lbnRzWzBdOlwiYXV0b1wiO2lmKG4ub3ZlcnNjcm9sbEVmZmVjdCE9PSExKXJldHVybiExO3N3aXRjaCh0KXtjYXNlXCJhdXRvXCI6cmV0dXJuIGUuaXNOZXN0ZWRTY3JvbGxiYXI7ZGVmYXVsdDpyZXR1cm4hIXR9fSx1PXtzZXQgaWdub3JlRXZlbnRzKHQpe2NvbnNvbGUud2FybihcImBvcHRpb25zLmlnbm9yZUV2ZW50c2AgcGFyYW1ldGVyIGlzIGRlcHJlY2F0ZWQsIHVzZSBgaW5zdGFuY2UjdW5yZWdpc3RlckV2ZW50cygpYCBtZXRob2QgaW5zdGVhZC4gaHR0cHM6Ly9naXRodWIuY29tL2lkaW90V3Uvc21vb3RoLXNjcm9sbGJhci93aWtpL0luc3RhbmNlLU1ldGhvZHMjaW5zdGFuY2V1bnJlZ2lzdGVyZXZlbnRzLXJlZ2V4LS1yZWdleC1yZWdleC0tXCIpfSxzZXQgZnJpY3Rpb24odCl7Y29uc29sZS53YXJuKFwiYG9wdGlvbnMuZnJpY3Rpb249XCIrdCtcImAgaXMgZGVwcmVjYXRlZCwgdXNlIGBvcHRpb25zLmRhbXBpbmc9XCIrdC8xMDArXCJgIGluc3RlYWQuXCIpLHRoaXMuZGFtcGluZz10LzEwMH0sZ2V0IHN5bmNDYWxsYmFja3MoKXtyZXR1cm4gbi5zeW5jQ2FsbGJhY2tzfSxzZXQgc3luY0NhbGxiYWNrcyh0KXtuLnN5bmNDYWxsYmFja3M9ISF0fSxnZXQgcmVuZGVyQnlQaXhlbHMoKXtyZXR1cm4gbi5yZW5kZXJCeVBpeGVsc30sc2V0IHJlbmRlckJ5UGl4ZWxzKHQpe24ucmVuZGVyQnlQaXhlbHM9ISF0fSxnZXQgYWx3YXlzU2hvd1RyYWNrcygpe3JldHVybiBuLmFsd2F5c1Nob3dUcmFja3N9LHNldCBhbHdheXNTaG93VHJhY2tzKHQpe3Q9ISF0LG4uYWx3YXlzU2hvd1RyYWNrcz10O3ZhciByPWUudGFyZ2V0cy5jb250YWluZXI7dD8oZS5zaG93VHJhY2soKSxyLmNsYXNzTGlzdC5hZGQoXCJzdGlja3lcIikpOihlLmhpZGVUcmFjaygpLHIuY2xhc3NMaXN0LnJlbW92ZShcInN0aWNreVwiKSl9LGdldCBjb250aW51b3VzU2Nyb2xsaW5nKCl7cmV0dXJuIGkobi5jb250aW51b3VzU2Nyb2xsaW5nKX0sc2V0IGNvbnRpbnVvdXNTY3JvbGxpbmcodCl7XCJhdXRvXCI9PT10P24uY29udGludW91c1Njcm9sbGluZz10Om4uY29udGludW91c1Njcm9sbGluZz0hIXR9LGdldCBvdmVyc2Nyb2xsRWZmZWN0KCl7cmV0dXJuIG4ub3ZlcnNjcm9sbEVmZmVjdH0sc2V0IG92ZXJzY3JvbGxFZmZlY3QodCl7dCYmIX5yLm92ZXJzY3JvbGxFZmZlY3QuaW5kZXhPZih0KSYmKGNvbnNvbGUud2FybihcImBvdmVyc2Nyb2xsRWZmZWN0YCBzaG91bGQgYmUgb25lIG9mIFwiKygwLHMuZGVmYXVsdCkoci5vdmVyc2Nyb2xsRWZmZWN0KStcIiwgYnV0IGdvdCBcIisoMCxzLmRlZmF1bHQpKHQpK1wiLiBJdCB3aWxsIGJlIHNldCB0byBgZmFsc2VgIG5vdy5cIiksdD0hMSksbi5vdmVyc2Nyb2xsRWZmZWN0PXR9LGdldCBvdmVyc2Nyb2xsRWZmZWN0Q29sb3IoKXtyZXR1cm4gbi5vdmVyc2Nyb2xsRWZmZWN0Q29sb3J9LHNldCBvdmVyc2Nyb2xsRWZmZWN0Q29sb3IodCl7bi5vdmVyc2Nyb2xsRWZmZWN0Q29sb3I9dH19OygwLGwuZGVmYXVsdCkobikuZmlsdGVyKGZ1bmN0aW9uKHQpe3JldHVybiF1Lmhhc093blByb3BlcnR5KHQpfSkuZm9yRWFjaChmdW5jdGlvbih0KXsoMCxhLmRlZmF1bHQpKHUsdCx7ZW51bWVyYWJsZTohMCxnZXQ6ZnVuY3Rpb24oKXtyZXR1cm4gblt0XX0sc2V0OmZ1bmN0aW9uKGUpe2lmKGlzTmFOKHBhcnNlRmxvYXQoZSkpKXRocm93IG5ldyBUeXBlRXJyb3IoXCJleHBlY3QgYG9wdGlvbnMuXCIrdCtcImAgdG8gYmUgYSBudW1iZXIsIGJ1dCBnb3QgXCIrKFwidW5kZWZpbmVkXCI9PXR5cGVvZiBlP1widW5kZWZpbmVkXCI6YihlKSkpO25bdF09Zy5waWNrSW5SYW5nZS5hcHBseSh2b2lkIDAsW2VdLmNvbmNhdChvKHJbdF0pKSl9fSl9KSx0aGlzLl9fcmVhZG9ubHkoXCJvcHRpb25zXCIsdSksdGhpcy5zZXRPcHRpb25zKHQpfXZhciB1PW4oODYpLGE9cih1KSxjPW4oOTApLGw9cihjKSxmPW4oMTgwKSxzPXIoZiksZD1uKDIpLGg9cihkKSx2PW4oNTUpLF89cih2KSxwPW4oNjIpLHk9cihwKSxiPVwiZnVuY3Rpb25cIj09dHlwZW9mIHkuZGVmYXVsdCYmXCJzeW1ib2xcIj09dHlwZW9mIF8uZGVmYXVsdD9mdW5jdGlvbih0KXtyZXR1cm4gdHlwZW9mIHR9OmZ1bmN0aW9uKHQpe3JldHVybiB0JiZcImZ1bmN0aW9uXCI9PXR5cGVvZiB5LmRlZmF1bHQmJnQuY29uc3RydWN0b3I9PT15LmRlZmF1bHQmJnQhPT15LmRlZmF1bHQucHJvdG90eXBlP1wic3ltYm9sXCI6dHlwZW9mIHR9LGc9bigxMTIpLG09big3OCk7T2JqZWN0LmRlZmluZVByb3BlcnR5KG0uU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9faW5pdE9wdGlvbnNcIix7dmFsdWU6aSx3cml0YWJsZTohMCxjb25maWd1cmFibGU6ITB9KX0sZnVuY3Rpb24odCxlLG4pe3QuZXhwb3J0cz17ZGVmYXVsdDpuKDE4MSksX19lc01vZHVsZTohMH19LGZ1bmN0aW9uKHQsZSxuKXt2YXIgcj1uKDEyKSxvPXIuSlNPTnx8KHIuSlNPTj17c3RyaW5naWZ5OkpTT04uc3RyaW5naWZ5fSk7dC5leHBvcnRzPWZ1bmN0aW9uKHQpe3JldHVybiBvLnN0cmluZ2lmeS5hcHBseShvLGFyZ3VtZW50cyl9fSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcigpe3RoaXMudXBkYXRlKCksdGhpcy5fX2tleWJvYXJkSGFuZGxlcigpLHRoaXMuX19yZXNpemVIYW5kbGVyKCksdGhpcy5fX3NlbGVjdEhhbmRsZXIoKSx0aGlzLl9fbW91c2VIYW5kbGVyKCksdGhpcy5fX3RvdWNoSGFuZGxlcigpLHRoaXMuX193aGVlbEhhbmRsZXIoKSx0aGlzLl9fZHJhZ0hhbmRsZXIoKSx0aGlzLl9fcmVuZGVyKCl9dmFyIG89big3OCk7T2JqZWN0LmRlZmluZVByb3BlcnR5KG8uU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9faW5pdFNjcm9sbGJhclwiLHt2YWx1ZTpyLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19ZnVuY3Rpb24gbyh0LGUpe3JldHVybigwLHUuZGVmYXVsdCkodGhpcyx0LHt2YWx1ZTplLGVudW1lcmFibGU6ITAsY29uZmlndXJhYmxlOiEwfSl9dmFyIGk9big4NiksdT1yKGkpLGE9big3OCk7T2JqZWN0LmRlZmluZVByb3BlcnR5KGEuU21vb3RoU2Nyb2xsYmFyLnByb3RvdHlwZSxcIl9fcmVhZG9ubHlcIix7dmFsdWU6byx3cml0YWJsZTohMCxjb25maWd1cmFibGU6ITB9KX0sZnVuY3Rpb24odCxlLG4pe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIoKXt2YXIgdD10aGlzLnRhcmdldHMsZT10aGlzLnNpemUsbj10aGlzLm9mZnNldCxyPXRoaXMudGh1bWJPZmZzZXQsaT10aGlzLnRodW1iU2l6ZTtyLng9bi54L2UuY29udGVudC53aWR0aCooZS5jb250YWluZXIud2lkdGgtKGkueC1pLnJlYWxYKSksci55PW4ueS9lLmNvbnRlbnQuaGVpZ2h0KihlLmNvbnRhaW5lci5oZWlnaHQtKGkueS1pLnJlYWxZKSksKDAsby5zZXRTdHlsZSkodC54QXhpcy50aHVtYix7XCItdHJhbnNmb3JtXCI6XCJ0cmFuc2xhdGUzZChcIityLngrXCJweCwgMCwgMClcIn0pLCgwLG8uc2V0U3R5bGUpKHQueUF4aXMudGh1bWIse1wiLXRyYW5zZm9ybVwiOlwidHJhbnNsYXRlM2QoMCwgXCIrci55K1wicHgsIDApXCJ9KX12YXIgbz1uKDExMiksaT1uKDc4KTtPYmplY3QuZGVmaW5lUHJvcGVydHkoaS5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX19zZXRUaHVtYlBvc2l0aW9uXCIse3ZhbHVlOnIsd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfSl9LGZ1bmN0aW9uKHQsZSxuKXtcInVzZSBzdHJpY3RcIjtmdW5jdGlvbiByKCl7dmFyIHQ9dGhpcy50YXJnZXRzLmNvbnRhaW5lcixlPXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCksbj1lLnRvcCxyPWUucmlnaHQsbz1lLmJvdHRvbSxpPWUubGVmdCx1PXdpbmRvdyxhPXUuaW5uZXJIZWlnaHQsYz11LmlubmVyV2lkdGg7dGhpcy5fX3JlYWRvbmx5KFwiYm91bmRpbmdcIix7dG9wOk1hdGgubWF4KG4sMCkscmlnaHQ6TWF0aC5taW4ocixjKSxib3R0b206TWF0aC5taW4obyxhKSxsZWZ0Ok1hdGgubWF4KGksMCl9KX12YXIgbz1uKDc4KTtPYmplY3QuZGVmaW5lUHJvcGVydHkoby5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX191cGRhdGVCb3VuZGluZ1wiLHt2YWx1ZTpyLHdyaXRhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMH0pfSxmdW5jdGlvbih0LGUsbil7XCJ1c2Ugc3RyaWN0XCI7ZnVuY3Rpb24gcih0KXtyZXR1cm4gdCYmdC5fX2VzTW9kdWxlP3Q6e2RlZmF1bHQ6dH19ZnVuY3Rpb24gbyh0KXtpZihBcnJheS5pc0FycmF5KHQpKXtmb3IodmFyIGU9MCxuPUFycmF5KHQubGVuZ3RoKTtlPHQubGVuZ3RoO2UrKyluW2VdPXRbZV07cmV0dXJuIG59cmV0dXJuKDAsYS5kZWZhdWx0KSh0KX1mdW5jdGlvbiBpKCl7dmFyIHQ9dGhpcy50YXJnZXRzLGU9dC5jb250YWluZXIsbj10LmNvbnRlbnQ7dGhpcy5fX3JlYWRvbmx5KFwiY2hpbGRyZW5cIixbXS5jb25jYXQobyhuLnF1ZXJ5U2VsZWN0b3JBbGwobC5zZWxlY3RvcnMpKSkpLHRoaXMuX19yZWFkb25seShcImlzTmVzdGVkU2Nyb2xsYmFyXCIsITEpO2Zvcih2YXIgcj1bXSxpPWU7aT1pLnBhcmVudEVsZW1lbnQ7KWwuc2JMaXN0LmhhcyhpKSYmKHRoaXMuX19yZWFkb25seShcImlzTmVzdGVkU2Nyb2xsYmFyXCIsITApLHIucHVzaChpKSk7dGhpcy5fX3JlYWRvbmx5KFwicGFyZW50c1wiLHIpfXZhciB1PW4oMiksYT1yKHUpLGM9big3OCksbD1uKDg5KTtPYmplY3QuZGVmaW5lUHJvcGVydHkoYy5TbW9vdGhTY3JvbGxiYXIucHJvdG90eXBlLFwiX191cGRhdGVUcmVlXCIse3ZhbHVlOmksd3JpdGFibGU6ITAsY29uZmlndXJhYmxlOiEwfSl9LGZ1bmN0aW9uKHQsZSl7fV0pfSk7IiwiY29uc3QgUHJvZ3Jlc3NCYXIgPSByZXF1aXJlKCdwcm9ncmVzc2Jhci5qcycpO1xyXG5pbXBvcnQgU2Nyb2xsQmFyIGZyb20gJ3Ntb290aC1zY3JvbGxiYXInO1xyXG5yZXF1aXJlKCdwZXJmZWN0LXNjcm9sbGJhci9qcXVlcnknKTtcclxuXHJcblxyXG5sZXQgc3BlZWQgPSBuYXZpZ2F0b3IuYXBwTmFtZSA9PSAnTWljcm9zb2Z0IEludGVybmV0IEV4cGxvcmVyJyB8fCAhIShuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9UcmlkZW50LykgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvcnY6MTEvKSkgfHwgKHR5cGVvZiAkLmJyb3dzZXIgIT09IFwidW5kZWZpbmVkXCIgJiYgJC5icm93c2VyLm1zaWUgPT0gMSkgPyAzLjQgOiAxLjc7XHJcblxyXG5mdW5jdGlvbiBtYWluU2xpZGVyKGUpIHtcclxuICAgIGNvbnN0IHNsaWRlck5hdmlnYXRpb24gPSAkKFwiLm1lbnVfX25hdmlnYXRpb24tLWxpc3RcIik7XHJcbiAgICBjb25zdCBzbGlkZXJXcmFwcGVyID0gJChcIi5jb250ZW50XCIpO1xyXG5cclxuICAgIHNsaWRlck5hdmlnYXRpb24ub24oJ2NsaWNrJywgJ2xpJywgZnVuY3Rpb24gKGUpIHtcclxuXHJcbiAgICAgICAgJChcIi5tZW51X19uYXZpZ2F0aW9uLS1saXN0IGxpXCIpLnJlbW92ZUNsYXNzKFwic2VsZWN0ZWRcIik7XHJcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRJdGVtID0gJCh0aGlzKTtcclxuICAgICAgICAkKHRoaXMpLmFkZENsYXNzKFwic2VsZWN0ZWRcIik7XHJcblxyXG4gICAgICAgIGxldCBzZWxlY3RlZFBvc2l0aW9uID0gc2VsZWN0ZWRJdGVtLmluZGV4KCk7XHJcblxyXG4gICAgICAgIHNsaWRlcldyYXBwZXIuY3NzKHtcclxuICAgICAgICAgICAgdHJhbnNmb3JtOiBgdHJhbnNsYXRlWCgtJHs4MDEgKiBzZWxlY3RlZFBvc2l0aW9ufXB4YFxyXG4gICAgICAgIH0sIDUwMCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZXN0YWJsaXNoUHJvZ3Jlc3NCYXIoY29udGFpbmVyLCB2YWx1ZSkge1xyXG4gICAgY29uc3QgYmFyID0gbmV3IFByb2dyZXNzQmFyLkNpcmNsZSgoY29udGFpbmVyKSwge1xyXG4gICAgICAgIHRyYWlsQ29sb3I6ICcjYzdjN2M3JyxcclxuICAgICAgICB0cmFpbFdpZHRoOiAzLFxyXG4gICAgICAgIHRleHQ6IHtcclxuICAgICAgICAgICAgdmFsdWU6ICcwJSdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGR1cmF0aW9uOiAxMDAwLFxyXG4gICAgICAgIGVhc2luZzogJ2JvdW5jZScsXHJcbiAgICAgICAgc3Ryb2tlV2lkdGg6IDQsXHJcbiAgICAgICAgZnJvbToge2NvbG9yOiAnI2ZmZid9LFxyXG4gICAgICAgIHRvOiB7Y29sb3I6ICcjZmZiNDAwJ30sXHJcbiAgICAgICAgLy8gU2V0IGRlZmF1bHQgc3RlcCBmdW5jdGlvbiBmb3IgYWxsIGFuaW1hdGUgY2FsbHNcclxuICAgICAgICBzdGVwOiBmdW5jdGlvbiAoc3RhdGUsIGNpcmNsZSkge1xyXG4gICAgICAgICAgICBjaXJjbGUuc2V0VGV4dCgoY2lyY2xlLnZhbHVlKCkgKiAxMDApLnRvRml4ZWQoMCkgKyBcIiVcIik7XHJcbiAgICAgICAgICAgIGNpcmNsZS5wYXRoLnNldEF0dHJpYnV0ZSgnc3Ryb2tlJywgc3RhdGUuY29sb3IpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgYmFyLmFuaW1hdGUodmFsdWUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBlc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoY29udGFpbmVyLCB2YWx1ZSwgY29sb3IpIHtcclxuICAgIGNvbnN0IGJhciA9IG5ldyBQcm9ncmVzc0Jhci5MaW5lKGNvbnRhaW5lciwge1xyXG4gICAgICAgIHN0cm9rZVdpZHRoOiAyMCxcclxuICAgICAgICBlYXNpbmc6ICdlYXNlSW5PdXQnLFxyXG4gICAgICAgIGR1cmF0aW9uOiAxNDAwLFxyXG4gICAgICAgIHRyYWlsQ29sb3I6IFwiI2U3ZTdlN1wiLFxyXG4gICAgICAgIHRyYWlsV2lkdGg6IDQsXHJcbiAgICAgICAgc3ZnU3R5bGU6IHt3aWR0aDogJzEwMCUnLCBoZWlnaHQ6ICcxMDAlJ30sXHJcbiAgICAgICAgdGV4dDoge1xyXG4gICAgICAgICAgICBhdXRvU3R5bGVDb250YWluZXI6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBmcm9tOiB7Y29sb3I6ICcjRkZGJ30sXHJcbiAgICAgICAgdG86IHtjb2xvcjogY29sb3J9LFxyXG4gICAgICAgIHN0ZXA6IChzdGF0ZSwgYmFyKSA9PiB7XHJcbiAgICAgICAgICAgIGJhci5zZXRUZXh0KE1hdGgucm91bmQoYmFyLnZhbHVlKCkgKiAxMDApICsgJzxzcGFuPiU8L3NwYW4+Jyk7XHJcbiAgICAgICAgICAgIGJhci5wYXRoLnNldEF0dHJpYnV0ZSgnc3Ryb2tlJywgc3RhdGUuY29sb3IpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGJhci5hbmltYXRlKHZhbHVlKTsgIC8vIE51bWJlciBmcm9tIDAuMCB0byAxLjBcclxufVxyXG5cclxuZnVuY3Rpb24gaW5pdFNjcm9sbEJhckZvclRoZVNlY2l0b24oc2VjdGlvbil7XHJcbiAgICBTY3JvbGxCYXIuaW5pdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzZWN0aW9uKSwge1xyXG4gICAgICAgIGRhbXBpbmc6IDAuMDUsXHJcbiAgICAgICAgc3BlZWQ6IHNwZWVkLFxyXG4gICAgICAgIGFsd2F5c1Nob3dUcmFja3M6IHRydWUsXHJcbiAgICAgICAgb3ZlcnNjcm9sbEVmZmVjdDogXCJib3VuY2VcIixcclxuICAgICAgICBjb250aW51b3VzU2Nyb2xsaW5nOiB0cnVlXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaG9tZVBhZ2VTbGlkZXIoKSB7XHJcbiAgICBjb25zdCBzbGlkZXMgPSAkKCcuc2xpZGVfb25lX19zbGlkZXJfX3NsaWRlJyk7XHJcbiAgICBjb25zdCBzZWxlY3RlZCA9IFwic2VsZWN0ZWRcIjtcclxuICAgIGxldCBpdGVyYXRvciA9ICQoXCIuc2xpZGVfb25lX19zbGlkZXJfX3NsaWRlLnNlbGVjdGVkXCIpLmluZGV4KCk7XHJcblxyXG4gICAgc2xpZGVzLmVhY2goZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICAkKHNsaWRlc1tpbmRleF0pLnJlbW92ZUNsYXNzKHNlbGVjdGVkKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChpdGVyYXRvciA9PT0gc2xpZGVzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICBpdGVyYXRvciA9IDA7XHJcbiAgICAgICAgJChzbGlkZXNbaXRlcmF0b3JdKS5hZGRDbGFzcyhzZWxlY3RlZCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGl0ZXJhdG9yKys7XHJcbiAgICAgICAgJChzbGlkZXNbaXRlcmF0b3JdKS5hZGRDbGFzcyhzZWxlY3RlZCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vTGluZSBQcm9ncmVzcyBCYXJzXHJcbi8vRkUgTElORVNcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI2h0bWxfbGluZV9iYXJcIiwgMC45NSAsIFwiIzljNWM1Y1wiKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI2Nzc19saW5lX2JhclwiLCAwLjk1ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjanF1ZXJ5X2xpbmVfYmFyXCIsIDAuOTUgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNib290c3RyYXBfbGluZV9iYXJcIiwgMC45ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjbWF0ZXJpYWxpemVfbGluZV9iYXJcIiwgMC45ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjZWNtYTVfbGluZV9iYXJcIiwgMC44NSAsIFwiIzljNWM1Y1wiKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI2VjbWE2N19saW5lX2JhclwiLCAwLjg1ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjcmVhY3RfbGluZV9iYXJcIiwgMC44ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjZ3VscF9saW5lX2JhclwiLCAwLjggLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNqYWRlX2xpbmVfYmFyXCIsIDAuOCAsIFwiIzljNWM1Y1wiKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI3Nhc3NfbGluZV9iYXJcIiwgMC44ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjbGVzc19saW5lX2JhclwiLCAwLjggLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiN2dWVfbGluZV9iYXJcIiwgMC43NSAsIFwiIzljNWM1Y1wiKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI3JlZHV4X2xpbmVfYmFyXCIsIDAuNzUgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNmb3VuZGF0aW9uX2xpbmVfYmFyXCIsIDAuNzUgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNnaXRfbGluZV9iYXJcIiwgMC43NSAsIFwiIzljNWM1Y1wiKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI2NoYWlfbGluZV9iYXJcIiwgMC42NSAsIFwiIzljNWM1Y1wiKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI3Npbm9uX2xpbmVfYmFyXCIsIDAuNiAsIFwiIzljNWM1Y1wiKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI2FuZ3VsYXJfbGluZV9iYXJcIiwgMC41NSAsIFwiIzljNWM1Y1wiKTtcclxuLy9FTkQgT0YgRkUgTElORVNcclxuXHJcbi8vREIgTElORVNcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI3NxbF9saW5lX2JhclwiLCAwLjg1LCAnI2ZmYjQwMCcpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjbXlzcWxfbGluZV9iYXJcIiwgMC44NSwgJyNmZmI0MDAnKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI3Bsc3FsX2xpbmVfYmFyXCIsIDAuNzUsICcjZmZiNDAwJyk7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNkYjJfbGluZV9iYXJcIiwgMC43NSwgJyNmZmI0MDAnKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI29yYWNsZV9saW5lX2JhclwiLCAwLjcsICcjZmZiNDAwJyk7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNzZXJ2ZXJfbGluZV9iYXJcIiwgMC43LCAnI2ZmYjQwMCcpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjdHNxbF9saW5lX2JhclwiLCAwLjUsICcjZmZiNDAwJyk7XHJcbi8vRU5EIE9GIERCIExJTkVTXHJcblxyXG4vL0JFIExJTkVTXHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNub2RlX2xpbmVfYmFyXCIsIDAuNzUgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNhc3BfbGluZV9iYXJcIiwgMC43ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjZXhwcmVzc19saW5lX2JhclwiLCAwLjY1ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIja29hX2xpbmVfYmFyXCIsIDAuNjUgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNtb2NoYV9saW5lX2JhclwiLCAwLjY1ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjbW9uZ29fbGluZV9iYXJcIiwgMC42NSAsIFwiIzljNWM1Y1wiKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI21vbmdvb3NlX2xpbmVfYmFyXCIsIDAuNjUgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNvcm1fbGluZV9iYXJcIiwgMC42ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjamF2YWVlX2xpbmVfYmFyXCIsIDAuNDUgLCBcIiM5YzVjNWNcIik7XHJcbi8vRU5EIE9GIEJFIExJTkVTXHJcblxyXG4vL0RFVk9QUyBMSU5FU1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjbnBtX2xpbmVfYmFyXCIsIDAuOTUsICcjZmZiNDAwJyk7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNib3dlcl9saW5lX2JhclwiLCAwLjk1LCAnI2ZmYjQwMCcpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjZG9ja2VyX2xpbmVfYmFyXCIsIDAuNzUsICcjZmZiNDAwJyk7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNib290X2xpbmVfYmFyXCIsIDAuNywgJyNmZmI0MDAnKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI2NvbXBvc2VfbGluZV9iYXJcIiwgMC42NSwgJyNmZmI0MDAnKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI2t1YmVybmV0ZXNfbGluZV9iYXJcIiwgMC41NSwgJyNmZmI0MDAnKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI3N3YXJtX2xpbmVfYmFyXCIsIDAuNSwgJyNmZmI0MDAnKTtcclxuLy9FTkQgT0YgREVWT1BTIExJTkVTXHJcblxyXG4vL0xhbmd1YWdlcyBsaW5lc1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjanNfbGluZV9iYXJcIiwgMC45ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjamF2YV9saW5lX2JhclwiLCAwLjc1ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjY3NfbGluZV9iYXJcIiwgMC43ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjcGVybF9saW5lX2JhclwiLCAwLjU1ICwgXCIjOWM1YzVjXCIpO1xyXG5lc3RhYmxpc2hMaW5lUHJvZ3Jlc3NCYXIoXCIjY3BsdXNfbGluZV9iYXJcIiwgMC40NSAsIFwiIzljNWM1Y1wiKTtcclxuZXN0YWJsaXNoTGluZVByb2dyZXNzQmFyKFwiI3NoZWxsX2xpbmVfYmFyXCIsIDAuNDUgLCBcIiM5YzVjNWNcIik7XHJcbmVzdGFibGlzaExpbmVQcm9ncmVzc0JhcihcIiNwaHBfbGluZV9iYXJcIiwgMC40NSAsIFwiIzljNWM1Y1wiKTtcclxuLy9FbmQgb2YgbGFuZ3VhZ2VzIGxpbmVcclxuXHJcbi8vRW5kIG9mIExpbmUgcHJvZ3Jlc3MgQmFyc1xyXG5cclxuLy9SYWRpYWwgUHJvZ3Jlc3MgQmFyc1xyXG5lc3RhYmxpc2hQcm9ncmVzc0JhcihcIiNmcm9udF9lbmRfcGJcIiwgMC45KTtcclxuZXN0YWJsaXNoUHJvZ3Jlc3NCYXIoXCIjYmFja19lbmRfcGJcIiwgMC42KTtcclxuZXN0YWJsaXNoUHJvZ3Jlc3NCYXIoXCIjZGJfZGV2X3BiXCIsIDAuNyk7XHJcbmVzdGFibGlzaFByb2dyZXNzQmFyKFwiI3Byb2RfZW5nX3BiXCIsIDAuNik7XHJcbi8vRW5kIG9mIFJhZGlhbCBQcm9ncmVzcyBCYXJzXHJcblxyXG5pbml0U2Nyb2xsQmFyRm9yVGhlU2VjaXRvbihcInNsaWRlX3R3b1wiKTtcclxuaW5pdFNjcm9sbEJhckZvclRoZVNlY2l0b24oXCJzbGlkZV90aHJlZVwiKTtcclxuaW5pdFNjcm9sbEJhckZvclRoZVNlY2l0b24oXCJzbGlkZV9mb3VyXCIpO1xyXG5pbml0U2Nyb2xsQmFyRm9yVGhlU2VjaXRvbihcInNsaWRlX2ZpdmVcIik7XHJcbmluaXRTY3JvbGxCYXJGb3JUaGVTZWNpdG9uKFwic2xpZGVfc2l4XCIpO1xyXG5pbml0U2Nyb2xsQmFyRm9yVGhlU2VjaXRvbihcInNsaWRlX3NldmVuXCIpO1xyXG5cclxubWFpblNsaWRlcigpO1xyXG5cclxuc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XHJcbiAgICBob21lUGFnZVNsaWRlcigpO1xyXG59LCA4MDAwKTtcclxuXHJcbmxldCBpID0gMTtcclxuc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgY29uc3QgY29sb3JBcnJheSA9IFtcIiNmZmI0MDBcIixcIiNmZmZcIixcInJnYmEoMTAwLCAwLCAwLCAwLjUpXCJdO1xyXG4gICAgJChcIi5zbGlkZV9vbmVfX2NvdmVyX19kZXNjcmlwdGlvbi0taW50cm9cIikuY3NzKHtcclxuICAgICAgICAndGV4dC1zaGFkb3cnOiAoaSUyID09PSAwKSA/IGAwIDAgMTBweCAjZmZiNDAwYCA6IFwibm9uZVwiXHJcbiAgICB9KTtcclxuICAgIGkrKztcclxufSwgNzUwKTtcclxuIl19
