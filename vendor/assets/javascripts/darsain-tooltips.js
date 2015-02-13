/*!
 * tooltips 0.1.0 - 13th Feb 2015
 * https://github.com/darsain/tooltip
 *
 * Licensed under the MIT license.
 * http://opensource.org/licenses/MIT
 */

;(function(){

/**
 * Require the module at `name`.
 *
 * @param {String} name
 * @return {Object} exports
 * @api public
 */

function require(name) {
  var module = require.modules[name];
  if (!module) throw new Error('failed to require "' + name + '"');

  if (!('exports' in module) && typeof module.definition === 'function') {
    module.client = module.component = true;
    module.definition.call(this, module.exports = {}, module);
    delete module.definition;
  }

  return module.exports;
}

/**
 * Meta info, accessible in the global scope unless you use AMD option.
 */

require.loader = 'component';

/**
 * Internal helper object, contains a sorting function for semantiv versioning
 */
require.helper = {};
require.helper.semVerSort = function(a, b) {
  var aArray = a.version.split('.');
  var bArray = b.version.split('.');
  for (var i=0; i<aArray.length; ++i) {
    var aInt = parseInt(aArray[i], 10);
    var bInt = parseInt(bArray[i], 10);
    if (aInt === bInt) {
      var aLex = aArray[i].substr((""+aInt).length);
      var bLex = bArray[i].substr((""+bInt).length);
      if (aLex === '' && bLex !== '') return 1;
      if (aLex !== '' && bLex === '') return -1;
      if (aLex !== '' && bLex !== '') return aLex > bLex ? 1 : -1;
      continue;
    } else if (aInt > bInt) {
      return 1;
    } else {
      return -1;
    }
  }
  return 0;
}

/**
 * Find and require a module which name starts with the provided name.
 * If multiple modules exists, the highest semver is used. 
 * This function can only be used for remote dependencies.

 * @param {String} name - module name: `user~repo`
 * @param {Boolean} returnPath - returns the canonical require path if true, 
 *                               otherwise it returns the epxorted module
 */
require.latest = function (name, returnPath) {
  function showError(name) {
    throw new Error('failed to find latest module of "' + name + '"');
  }
  // only remotes with semvers, ignore local files conataining a '/'
  var versionRegexp = /(.*)~(.*)@v?(\d+\.\d+\.\d+[^\/]*)$/;
  var remoteRegexp = /(.*)~(.*)/;
  if (!remoteRegexp.test(name)) showError(name);
  var moduleNames = Object.keys(require.modules);
  var semVerCandidates = [];
  var otherCandidates = []; // for instance: name of the git branch
  for (var i=0; i<moduleNames.length; i++) {
    var moduleName = moduleNames[i];
    if (new RegExp(name + '@').test(moduleName)) {
        var version = moduleName.substr(name.length+1);
        var semVerMatch = versionRegexp.exec(moduleName);
        if (semVerMatch != null) {
          semVerCandidates.push({version: version, name: moduleName});
        } else {
          otherCandidates.push({version: version, name: moduleName});
        } 
    }
  }
  if (semVerCandidates.concat(otherCandidates).length === 0) {
    showError(name);
  }
  if (semVerCandidates.length > 0) {
    var module = semVerCandidates.sort(require.helper.semVerSort).pop().name;
    if (returnPath === true) {
      return module;
    }
    return require(module);
  }
  // if the build contains more than one branch of the same module
  // you should not use this funciton
  var module = otherCandidates.sort(function(a, b) {return a.name > b.name})[0].name;
  if (returnPath === true) {
    return module;
  }
  return require(module);
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Register module at `name` with callback `definition`.
 *
 * @param {String} name
 * @param {Function} definition
 * @api private
 */

require.register = function (name, definition) {
  require.modules[name] = {
    definition: definition
  };
};

/**
 * Define a module's exports immediately with `exports`.
 *
 * @param {String} name
 * @param {Generic} exports
 * @api private
 */

require.define = function (name, exports) {
  require.modules[name] = {
    exports: exports
  };
};
require.register("darsain~event@0.1.0", function (exports, module) {
'use strict';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element}  el
 * @param {String}   type
 * @param {Function} fn
 * @param {Boolean}  capture
 *
 * @return {Function}
 */
exports.bind = window.addEventListener ? function (el, type, fn, capture) {
	el.addEventListener(type, fn, capture || false);
	return fn;
} : function (el, type, fn) {
	var fnid = type + fn;
	el[fnid] = el[fnid] || function () {
		var event = window.event;
		event.target = event.srcElement;
		event.preventDefault = function () {
			event.returnValue = false;
		};
		event.stopPropagation = function () {
			event.cancelBubble = true;
		};
		fn.call(el, event);
	};
	el.attachEvent('on' + type, el[fnid]);
	return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element}  el
 * @param {String}   type
 * @param {Function} fn
 * @param {Boolean}  capture
 *
 * @return {Function}
 */
exports.unbind = window.removeEventListener ? function (el, type, fn, capture) {
	el.removeEventListener(type, fn, capture || false);
	return fn;
} : function (el, type, fn) {
	var fnid = type + fn;
	el.detachEvent('on' + type, el[fnid]);
	try {
		delete el[fnid];
	} catch (err) {
		// can't delete window object properties
		el[fnid] = undefined;
	}
	return fn;
};
});

require.register("darsain~position@0.1.0", function (exports, module) {
'use strict';

/**
 * Transport.
 */
module.exports = position;

/**
 * Globals.
 */
var win = window;
var doc = win.document;
var docEl = doc.documentElement;

/**
 * Poor man's shallow object extend.
 *
 * @param {Object} a
 * @param {Object} b
 *
 * @return {Object}
 */
function extend(a, b) {
	for (var key in b) {
		a[key] = b[key];
	}
	return a;
}

/**
 * Checks whether object is window.
 *
 * @param {Object} obj
 *
 * @return {Boolean}
 */
function isWin(obj) {
	return obj && obj.setInterval != null;
}

/**
 * Returns element's object with `left`, `top`, `bottom`, `right`, `width`, and `height`
 * properties indicating the position and dimensions of element on a page.
 *
 * @param {Element} element
 *
 * @return {Object}
 */
function position(element) {
	var winTop = win.pageYOffset || docEl.scrollTop;
	var winLeft = win.pageXOffset || docEl.scrollLeft;
	var box = { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };

	if (isWin(element)) {
		box.width = win.innerWidth || docEl.clientWidth;
		box.height = win.innerHeight || docEl.clientHeight;
	} else if (docEl.contains(element) && element.getBoundingClientRect != null) {
		extend(box, element.getBoundingClientRect());
		// width & height don't exist in <IE9
		box.width = box.right - box.left;
		box.height = box.bottom - box.top;
	} else {
		return box;
	}

	box.top = box.top + winTop - docEl.clientTop;
	box.left = box.left + winLeft - docEl.clientLeft;
	box.right = box.left + box.width;
	box.bottom = box.top + box.height;

	return box;
}
});

require.register("component~indexof@0.0.3", function (exports, module) {
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});

require.register("component~classes@1.2.3", function (exports, module) {
/**
 * Module dependencies.
 */

var index = require('component~indexof@0.0.3');

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  if (!el || !el.nodeType) {
    throw new Error('A DOM element reference is required');
  }
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`, can force state via `force`.
 *
 * For browsers that support classList, but do not support `force` yet,
 * the mistake will be detected and corrected.
 *
 * @param {String} name
 * @param {Boolean} force
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name, force){
  // classList
  if (this.list) {
    if ("undefined" !== typeof force) {
      if (force !== this.list.toggle(name, force)) {
        this.list.toggle(name); // toggle again to correct
      }
    } else {
      this.list.toggle(name);
    }
    return this;
  }

  // fallback
  if ("undefined" !== typeof force) {
    if (!force) {
      this.remove(name);
    } else {
      this.add(name);
    }
  } else {
    if (this.has(name)) {
      this.remove(name);
    } else {
      this.add(name);
    }
  }

  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var str = this.el.className.replace(/^\s+|\s+$/g, '');
  var arr = str.split(re);
  if ('' === arr[0]) arr.shift();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

});

require.register("darsain~tooltip@0.1.0", function (exports, module) {
'use strict';

/**
 * Dependencies.
 */
var evt = require('darsain~event@0.1.0');
var classes = require('component~classes@1.2.3');
var indexOf = require('component~indexof@0.0.3');
var position = require('darsain~position@0.1.0');

/**
 * Globals.
 */
var win = window;
var doc = win.document;
var body = doc.body;
var verticalPlaces = ['top', 'bottom'];

/**
 * Transport.
 */
module.exports = Tooltip;

/**
 * Prototypal inheritance.
 *
 * @param {Object} o
 *
 * @return {Object}
 */
var objectCreate = Object.create || (function () {
	function F() {}
	return function (o) {
		F.prototype = o;
		return new F();
	};
})();

/**
 * Poor man's shallow object extend.
 *
 * @param {Object} a
 * @param {Object} b
 *
 * @return {Object}
 */
function extend(a, b) {
	for (var key in b) {
		a[key] = b[key];
	}
	return a;
}

/**
 * Parse integer from strings like '-50px'.
 *
 * @param {Mixed} value
 *
 * @return {Integer}
 */
function parsePx(value) {
	return 0 | Math.round(String(value).replace(/[^\-0-9.]/g, ''));
}

/**
 * Get computed style of element.
 *
 * @param {Element} element
 *
 * @type {String}
 */
var style = win.getComputedStyle ? function style(element, name) {
	return win.getComputedStyle(element, null)[name];
} : function style(element, name) {
	return element.currentStyle[name];
};

/**
 * Returns transition duration of element in ms.
 *
 * @param {Element} element
 *
 * @return {Int}
 */
function transitionDuration(element) {
	var duration = String(style(element, transitionDuration.propName));
	var match = duration.match(/([0-9.]+)([ms]{1,2})/);
	if (match) {
		duration = Number(match[1]);
		if (match[2] === 's') {
			duration *= 1000;
		}
	}
	return 0|duration;
}
transitionDuration.propName = (function () {
	var element = doc.createElement('div');
	var names = ['transitionDuration', 'webkitTransitionDuration'];
	var value = '1s';
	for (var i = 0; i < names.length; i++) {
		element.style[names[i]] = value;
		if (element.style[names[i]] === value) {
			return names[i];
		}
	}
}());

/**
 * Tooltip construnctor.
 *
 * @param {String|Element} content
 * @param {Object}         options
 *
 * @return {Tooltip}
 */
function Tooltip(content, options) {
	if (!(this instanceof Tooltip)) {
		return new Tooltip(content, options);
	}
	this.hidden = 1;
	this.options = extend(objectCreate(Tooltip.defaults), options);
	this._createElement();
	this.content(content);
}

/**
 * Creates a tooltip element.
 *
 * @return {Void}
 */
Tooltip.prototype._createElement = function () {
	this.element = doc.createElement('div');
	this.classes = classes(this.element);
	this.classes.add(this.options.baseClass);
	var propName;
	for (var i = 0; i < Tooltip.classTypes.length; i++) {
		propName = Tooltip.classTypes[i] + 'Class';
		if (this.options[propName]) {
			this.classes.add(this.options[propName]);
		}
	}
};

/**
 * Changes tooltip's type class type.
 *
 * @param {String} name
 *
 * @return {Tooltip}
 */
Tooltip.prototype.type = function (name) {
	return this.changeClassType('type', name);
};

/**
 * Changes tooltip's effect class type.
 *
 * @param {String} name
 *
 * @return {Tooltip}
 */
Tooltip.prototype.effect = function (name) {
	return this.changeClassType('effect', name);
};

/**
 * Changes class type.
 *
 * @param {String} propName
 * @param {String} newClass
 *
 * @return {Tooltip}
 */
Tooltip.prototype.changeClassType = function (propName, newClass) {
	propName += 'Class';
	if (this.options[propName]) {
		this.classes.remove(this.options[propName]);
	}
	this.options[propName] = newClass;
	if (newClass) {
		this.classes.add(newClass);
	}
	return this;
};

/**
 * Updates tooltip's dimensions.
 *
 * @return {Tooltip}
 */
Tooltip.prototype.updateSize = function () {
	if (this.hidden) {
		this.element.style.visibility = 'hidden';
		body.appendChild(this.element);
	}
	this.width = this.element.offsetWidth;
	this.height = this.element.offsetHeight;
	if (this.spacing == null) {
		this.spacing = this.options.spacing != null ? this.options.spacing : parsePx(style(this.element, 'top'));
	}
	if (this.hidden) {
		body.removeChild(this.element);
		this.element.style.visibility = '';
	} else {
		this.position();
	}
	return this;
};

/**
 * Change tooltip content.
 *
 * When tooltip is visible, its size is automatically
 * synced and tooltip correctly repositioned.
 *
 * @param {String|Element} content
 *
 * @return {Tooltip}
 */
Tooltip.prototype.content = function (content) {
	if (typeof content === 'object') {
		this.element.innerHTML = '';
		this.element.appendChild(content);
	} else {
		this.element.innerHTML = content;
	}
	this.updateSize();
	return this;
};

/**
 * Pick new place tooltip should be displayed at.
 *
 * When the tooltip is visible, it is automatically positioned there.
 *
 * @param {String} place
 *
 * @return {Tooltip}
 */
Tooltip.prototype.place = function (place) {
	this.options.place = place;
	if (!this.hidden) {
		this.position();
	}
	return this;
};

/**
 * Attach tooltip to an element.
 *
 * @param {Element} element
 *
 * @return {Tooltip}
 */
Tooltip.prototype.attach = function (element) {
	this.attachedTo = element;
	if (!this.hidden) {
		this.position();
	}
	return this;
};

/**
 * Detach tooltip from element.
 *
 * @return {Tooltip}
 */
Tooltip.prototype.detach = function () {
	this.hide();
	this.attachedTo = null;
	return this;
};

/**
 * Pick the most reasonable place for target position.
 *
 * @param {Object} target
 *
 * @return {Tooltip}
 */
Tooltip.prototype._pickPlace = function (target) {
	if (!this.options.auto) {
		return this.options.place;
	}
	var winPos = position(win);
	var place = this.options.place.split('-');
	var spacing = this.spacing;

	if (~indexOf(verticalPlaces, place[0])) {
		if (target.top - this.height - spacing <= winPos.top) {
			place[0] = 'bottom';
		} else if (target.bottom + this.height + spacing >= winPos.bottom) {
			place[0] = 'top';
		}
		switch (place[1]) {
			case 'left':
				if (target.right - this.width <= winPos.left) {
					place[1] = 'right';
				}
				break;
			case 'right':
				if (target.left + this.width >= winPos.right) {
					place[1] = 'left';
				}
				break;
			default:
				if (target.left + target.width / 2 + this.width / 2 >= winPos.right) {
					place[1] = 'left';
				} else if (target.right - target.width / 2 - this.width / 2 <= winPos.left) {
					place[1] = 'right';
				}
		}
	} else {
		if (target.left - this.width - spacing <= winPos.left) {
			place[0] = 'right';
		} else if (target.right + this.width + spacing >= winPos.right) {
			place[0] = 'left';
		}
		switch (place[1]) {
			case 'top':
				if (target.bottom - this.height <= winPos.top) {
					place[1] = 'bottom';
				}
				break;
			case 'bottom':
				if (target.top + this.height >= winPos.bottom) {
					place[1] = 'top';
				}
				break;
			default:
				if (target.top + target.height / 2 + this.height / 2 >= winPos.bottom) {
					place[1] = 'top';
				} else if (target.bottom - target.height / 2 - this.height / 2 <= winPos.top) {
					place[1] = 'bottom';
				}
		}
	}

	return place.join('-');
};

/**
 * Position the element to an element or a specific coordinates.
 *
 * @param {Integer|Element} x
 * @param {Integer}         y
 *
 * @return {Tooltip}
 */
Tooltip.prototype.position = function (x, y) {
	if (this.attachedTo) {
		x = this.attachedTo;
	}
	if (x == null && this._p) {
		x = this._p[0];
		y = this._p[1];
	} else {
		this._p = arguments;
	}
	var target = typeof x === 'number' ? {
		left: 0|x,
		right: 0|x,
		top: 0|y,
		bottom: 0|y,
		width: 0,
		height: 0
	} : position(x);
	var spacing = this.spacing;
	var newPlace = this._pickPlace(target);

	// Add/Change place class when necessary
	if (newPlace !== this.curPlace) {
		if (this.curPlace) {
			this.classes.remove(this.curPlace);
		}
		this.classes.add(newPlace);
		this.curPlace = newPlace;
	}

	// Position the tip
	var top, left;
	switch (this.curPlace) {
		case 'top':
			top = target.top - this.height - spacing;
			left = target.left + target.width / 2 - this.width / 2;
			break;
		case 'top-left':
			top = target.top - this.height - spacing;
			left = target.right - this.width;
			break;
		case 'top-right':
			top = target.top - this.height - spacing;
			left = target.left;
			break;

		case 'bottom':
			top = target.bottom + spacing;
			left = target.left + target.width / 2 - this.width / 2;
			break;
		case 'bottom-left':
			top = target.bottom + spacing;
			left = target.right - this.width;
			break;
		case 'bottom-right':
			top = target.bottom + spacing;
			left = target.left;
			break;

		case 'left':
			top = target.top + target.height / 2 - this.height / 2;
			left = target.left - this.width - spacing;
			break;
		case 'left-top':
			top = target.bottom - this.height;
			left = target.left - this.width - spacing;
			break;
		case 'left-bottom':
			top = target.top;
			left = target.left - this.width - spacing;
			break;

		case 'right':
			top = target.top + target.height / 2 - this.height / 2;
			left = target.right + spacing;
			break;
		case 'right-top':
			top = target.bottom - this.height;
			left = target.right + spacing;
			break;
		case 'right-bottom':
			top = target.top;
			left = target.right + spacing;
			break;
	}

	// Set tip position & class
	this.element.style.top = Math.round(top) + 'px';
	this.element.style.left = Math.round(left) + 'px';

	return this;
};

/**
 * Show the tooltip.
 *
 * @param {Integer|Element} x
 * @param {Integer}         y
 *
 * @return {Tooltip}
 */
Tooltip.prototype.show = function (x, y) {
	x = this.attachedTo ? this.attachedTo : x;

	// Clear potential ongoing animation
	clearTimeout(this.aIndex);

	// Position the element when requested
	if (x != null) {
		this.position(x, y);
	}

	// Stop here if tip is already visible
	if (this.hidden) {
		this.hidden = 0;
		body.appendChild(this.element);
	}

	// Make tooltip aware of window resize
	if (this.attachedTo) {
		this._aware();
	}

	// Trigger layout and kick in the transition
	if (this.options.inClass) {
		if (this.options.effectClass) {
			void this.element.clientHeight;
		}
		this.classes.add(this.options.inClass);
	}

	return this;
};

/**
 * Hide the tooltip.
 *
 * @return {Tooltip}
 */
Tooltip.prototype.hide = function () {
	if (this.hidden) {
		return;
	}

	var self = this;
	var duration = 0;

	// Remove .in class and calculate transition duration if any
	if (this.options.inClass) {
		this.classes.remove(this.options.inClass);
		if (this.options.effectClass) {
			duration = transitionDuration(this.element);
		}
	}

	// Remove tip from window resize awareness
	if (this.attachedTo) {
		this._unaware();
	}

	// Remove the tip from the DOM when transition is done
	clearTimeout(this.aIndex);
	this.aIndex = setTimeout(function () {
		self.aIndex = 0;
		body.removeChild(self.element);
		self.hidden = 1;
	}, duration);

	return this;
};

Tooltip.prototype.toggle = function (x, y) {
	return this[this.hidden ? 'show' : 'hide'](x, y);
};

Tooltip.prototype.destroy = function () {
	clearTimeout(this.aIndex);
	this._unaware();
	if (!this.hidden) {
		body.removeChild(this.element);
	}
	this.element = this.options = null;
};

/**
 * Make the tip window resize aware.
 *
 * @return {Void}
 */
Tooltip.prototype._aware = function () {
	var index = indexOf(Tooltip.winAware, this);
	if (!~index) {
		Tooltip.winAware.push(this);
	}
};

/**
 * Remove the window resize awareness.
 *
 * @return {Void}
 */
Tooltip.prototype._unaware = function () {
	var index = indexOf(Tooltip.winAware, this);
	if (~index) {
		Tooltip.winAware.splice(index, 1);
	}
};

/**
 * Handles repositioning of tooltips on window resize.
 *
 * @return {Void}
 */
Tooltip.reposition = (function () {
	var rAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame || function (fn) {
		return setTimeout(fn, 17);
	};
	var rIndex;

	function requestReposition() {
		if (rIndex || !Tooltip.winAware.length) {
			return;
		}
		rIndex = rAF(reposition, 17);
	}

	function reposition() {
		rIndex = 0;
		var tip;
		for (var i = 0, l = Tooltip.winAware.length; i < l; i++) {
			tip = Tooltip.winAware[i];
			tip.position();
		}
	}

	return requestReposition;
}());
Tooltip.winAware = [];

// Bind winAware repositioning to window resize event
evt.bind(window, 'resize', Tooltip.reposition);
evt.bind(window, 'scroll', Tooltip.reposition);

/**
 * Array with dynamic class types.
 *
 * @type {Array}
 */
Tooltip.classTypes = ['type', 'effect'];

/**
 * Default options for Tooltip constructor.
 *
 * @type {Object}
 */
Tooltip.defaults = {
	baseClass:   'tooltip', // Base tooltip class name.
	typeClass:   null,      // Type tooltip class name.
	effectClass: null,      // Effect tooltip class name.
	inClass:     'in',      // Class used to transition stuff in.
	place:       'top',     // Default place.
	spacing:     null,      // Gap between target and tooltip.
	auto:        0          // Whether to automatically adjust place to fit into window.
};
});

require.register("code42day~dataset@0.3.0", function (exports, module) {
module.exports=dataset;

/*global document*/


// replace namesLikeThis with names-like-this
function toDashed(name) {
  return name.replace(/([A-Z])/g, function(u) {
    return "-" + u.toLowerCase();
  });
}

var fn;

if (document.head && document.head.dataset) {
  fn = {
    set: function(node, attr, value) {
      node.dataset[attr] = value;
    },
    get: function(node, attr) {
      return node.dataset[attr];
    },
    del: function (node, attr) {
      delete node.dataset[attr];
    }
  };
} else {
  fn = {
    set: function(node, attr, value) {
      node.setAttribute('data-' + toDashed(attr), value);
    },
    get: function(node, attr) {
      return node.getAttribute('data-' + toDashed(attr));
    },
    del: function (node, attr) {
      node.removeAttribute('data-' + toDashed(attr));
    }
  };
}

function dataset(node, attr, value) {
  var self = {
    set: set,
    get: get,
    del: del
  };

  function set(attr, value) {
    fn.set(node, attr, value);
    return self;
  }

  function del(attr) {
    fn.del(node, attr);
    return self;
  }

  function get(attr) {
    return fn.get(node, attr);
  }

  if (arguments.length === 3) {
    return set(attr, value);
  }
  if (arguments.length == 2) {
    return get(attr);
  }

  return self;
}

});

require.register("tooltips", function (exports, module) {
'use strict';

/**
 * Dependencies.
 */
var evt = require('darsain~event@0.1.0');
var indexOf = require('component~indexof@0.0.3');
var Tooltip = require('darsain~tooltip@0.1.0');
var dataset = require('code42day~dataset@0.3.0');

/**
 * Transport.
 */
module.exports = Tooltips;

/**
 * Globals.
 */
var MObserver = window.MutationObserver || window.WebkitMutationObserver;

/**
 * Prototypal inheritance.
 *
 * @param {Object} o
 *
 * @return {Object}
 */
var objectCreate = Object.create || (function () {
	function F() {}
	return function (o) {
		F.prototype = o;
		return new F();
	};
})();

/**
 * Poor man's shallow object extend.
 *
 * @param {Object} a
 * @param {Object} b
 *
 * @return {Object}
 */
function extend(a, b) {
	for (var key in b) {
		a[key] = b[key];
	}
	return a;
}

/**
 * Capitalize the first letter of a string.
 *
 * @param {String} string
 *
 * @return {String}
 */
function ucFirst(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Tooltips constructor.
 *
 * @param {Element} container
 * @param {Object}  options
 *
 * @return {Tooltips}
 */
function Tooltips(container, options) {
	if (!(this instanceof Tooltips)) {
		return new Tooltips(container, options);
	}

	var self = this;
	var observer, TID;

	/**
	 * Show tooltip attached to an element.
	 *
	 * @param {Element} element
	 *
	 * @return {Tooltips}
	 */
	self.show = function (element) {
		return callTooltipMethod(element, 'show');
	};

	/**
	 * Hide tooltip attached to an element.
	 *
	 * @param {Element} element
	 *
	 * @return {Tooltips}
	 */
	self.hide = function (element) {
		return callTooltipMethod(element, 'hide');
	};

	/**
	 * Toggle tooltip attached to an element.
	 *
	 * @param {Element} element
	 *
	 * @return {Tooltips}
	 */
	self.toggle = function (element) {
		return callTooltipMethod(element, 'toggle');
	};

	/**
	 * Retrieve tooltip attached to an element and call it's method.
	 *
	 * @param {Element} element
	 * @param {String}  method
	 *
	 * @return {Tooltips}
	 */
	function callTooltipMethod(element, method) {
		var tip = self.get(element);
		if (tip) {
			tip[method]();
		}
		return self;
	}

	/**
	 * Return a tooltip attached to an element. Tooltip is created if it doesn't exist yet.
	 *
	 * @param {Element} element
	 *
	 * @return {Tooltip}
	 */
	self.get = function (element) {
		var tip = !!element && (element[TID] || createTip(element));
		if (tip && !element[TID]) {
			element[TID] = tip;
		}
		return tip;
	};

	/**
	 * Add element(s) to Tooltips instance.
	 *
	 * @param {[type]} element Can be element, or container containing elements to be added.
	 *
	 * @return {Tooltips}
	 */
	self.add = function (element) {
		if (!element || element.nodeType !== 1) {
			return self;
		}
		if (dataset(element).get(options.key)) {
			bindElement(element);
		} else if (element.children) {
			bindElements(element.querySelectorAll(self.selector));
		}
		return self;
	};

	/**
	 * Remove element(s) from Tooltips instance.
	 *
	 * @param {Element} element Can be element, or container containing elements to be removed.
	 *
	 * @return {Tooltips}
	 */
	self.remove = function (element) {
		if (!element || element.nodeType !== 1) {
			return self;
		}
		if (dataset(element).get(options.key)) {
			unbindElement(element);
		} else if (element.children) {
			unbindElements(element.querySelectorAll(self.selector));
		}
		return self;
	};

	/**
	 * Reload Tooltips instance.
	 *
	 * Unbinds current tooltipped elements, than selects the
	 * data-key elements from container and binds them again.
	 *
	 * @return {Tooltips}
	 */
	self.reload = function () {
		// Unbind old elements
		unbindElements(self.elements);
		// Bind new elements
		bindElements(self.container.querySelectorAll(self.selector));
		return self;
	};

	/**
	 * Destroy Tooltips instance.
	 *
	 * @return {Void}
	 */
	self.destroy = function () {
		unbindElements(this.elements);
		if (observer) {
			observer.disconnect();
		}
		this.container = this.elements = this.options = observer = null;
	};

	/**
	 * Create a tip from element data attributes.
	 *
	 * @param {Element} element
	 *
	 * @return {Tooltip}
	 */
	function createTip(element) {
		var data = dataset(element);
		var content = data.get(options.key);
		if (!content) {
			return false;
		}
		var tipOptions = objectCreate(options.tooltip);
		var keyData;
		for (var key in Tooltip.defaults) {
			keyData = data.get(options.key + ucFirst(key.replace(/Class$/, '')));
			if (!keyData) {
				continue;
			}
			tipOptions[key] = keyData;
		}
		return new Tooltip(content, tipOptions).attach(element);
	}

	/**
	 * Bind Tooltips events to Array/NodeList of elements.
	 *
	 * @param {Array} elements
	 *
	 * @return {Void}
	 */
	function bindElements(elements) {
		for (var i = 0, l = elements.length; i < l; i++) {
			bindElement(elements[i]);
		}
	}

	/**
	 * Bind Tooltips events to element.
	 *
	 * @param {Element} element
	 *
	 * @return {Void}
	 */
	function bindElement(element) {
		if (element[TID] || ~indexOf(self.elements, element)) {
			return;
		}
		evt.bind(element, options.showOn, eventHandler);
		evt.bind(element, options.hideOn, eventHandler);
		self.elements.push(element);
	}

	/**
	 * Unbind Tooltips events from Array/NodeList of elements.
	 *
	 * @param {Array} elements
	 *
	 * @return {Void}
	 */
	function unbindElements(elements) {
		if (self.elements === elements) {
			elements = elements.slice();
		}
		for (var i = 0, l = elements.length; i < l; i++) {
			unbindElement(elements[i]);
		}
	}

	/**
	 * Unbind Tooltips events from element.
	 *
	 * @param {Element} element
	 *
	 * @return {Void}
	 */
	function unbindElement(element) {
		var index = indexOf(self.elements, element);
		if (!~index) {
			return;
		}
		if (element[TID]) {
			element[TID].destroy();
			delete element[TID];
		}
		evt.unbind(element, options.showOn, eventHandler);
		evt.unbind(element, options.hideOn, eventHandler);
		self.elements.splice(index, 1);
	}

	/**
	 * Tooltips events handler.
	 *
	 * @param {Event} event
	 *
	 * @return {Void}
	 */
	function eventHandler(event) {
		/*jshint validthis:true */
		if (options.showOn === options.hideOn) {
			self.toggle(this);
		} else {
			self[event.type === options.showOn ? 'show' : 'hide'](this);
		}
	}

	/**
	 * Mutations handler.
	 *
	 * @param {Array} mutations
	 *
	 * @return {Void}
	 */
	function mutationsHandler(mutations) {
		var added, removed, i, l;
		for (var m = 0, ml = mutations.length; m < ml; m++) {
			added = mutations[m].addedNodes;
			removed = mutations[m].removedNodes;
			for (i = 0, l = added.length; i < l; i++) {
				self.add(added[i]);
			}
			for (i = 0, l = removed.length; i < l; i++) {
				self.remove(removed[i]);
			}
		}
	}

	// Construct
	(function () {
		self.container = container;
		self.options = options = extend(objectCreate(Tooltips.defaults), options);
		self.ID = TID = options.key + Math.random().toString(36).slice(2);
		self.elements = [];

		// Create tips selector
		self.selector = '[data-' + options.key + ']';

		// Load tips
		self.reload();

		// Create mutations observer
		if (options.observe && MObserver) {
			observer = new MObserver(mutationsHandler);
			observer.observe(self.container, {
				childList: true,
				subtree: true
			});
		}
	}());
}

/**
 * Expose Tooltip.
 */
Tooltips.Tooltip = Tooltip;

/**
 * Default Tooltips options.
 *
 * @type {Object}
 */
Tooltips.defaults = {
	tooltip:    {},          // Options for individual Tooltip instances.
	key:       'tooltip',    // Tooltips data attribute key.
	showOn:    'mouseenter', // Show tooltip event.
	hideOn:    'mouseleave', // Hide tooltip event.
	observe:   0             // Enable mutation observer (used only when supported).
};
});

if (typeof exports == "object") {
  module.exports = require("tooltips");
} else if (typeof define == "function" && define.amd) {
  define("Tooltips", [], function(){ return require("tooltips"); });
} else {
  (this || window)["Tooltips"] = require("tooltips");
}
})()
