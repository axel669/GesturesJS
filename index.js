'use strict';

(function () {
    var isMobile = typeof orientation !== 'undefined' || navigator.userAgent.indexOf("Mobile") !== -1;
    var forEach = Array.prototype.forEach;
    var toArray = function toArray(obj) {
        var arr = [];
        var len = obj.length;

        for (var index = 0; index < len; index += 1) {
            arr.push(obj[index]);
        }

        return arr;
    };

    var handlers = {};
    var handlerKeys = [];

    var addHandler = function addHandler(name, handler) {
        if (typeof handler === 'function') {
            handler = handler();
        }
        handlers[name] = handler;
        handlerKeys = Object.keys(handlers);
    };
    var createEvent = function createEvent(type) {
        var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var evt = new CustomEvent(type, { bubbles: true, cancelable: true });

        Object.keys(props).forEach(function (key) {
            return evt[key] = props[key];
        });

        return evt;
    };
    var copyTouchEvent = function copyTouchEvent(touch) {
        return {
            pageX: touch.pageX,
            pageY: touch.pageY,
            screenX: touch.screenX,
            screenY: touch.screenY,
            clientX: touch.clientX,
            clientY: touch.clientY
        };
    };
    var delay = function delay(func) {
        return setTimeout(func, 0);
    };

    var polarVector = function polarVector(x1, y1, x2, y2) {
        var x = x2 - x1;
        var y = y2 - y1;
        var angle = void 0;
        var magnitude = void 0;

        angle = Math.atan2(y, x);
        angle *= 180 / Math.PI;
        angle = (angle + 270) % 360;

        magnitude = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));

        return {
            angle: angle,
            magnitude: magnitude
        };
    };
    var vars = {};
    window.addEventListener('touchstart', function (evt) {
        var touches = toArray(evt.changedTouches);
        touches.forEach(function (touch) {
            touch.timestamp = evt.timeStamp;
            vars[touch.identifier] = {
                start: touch
            };
            touch.vars = vars[touch.identifier];
            touch.path = evt.path;
        });
        handlerKeys.forEach(function (name) {
            return handlers[name].start(touches, evt);
        });
    }, false);
    window.addEventListener('touchmove', function (evt) {
        var touches = toArray(evt.changedTouches);
        touches.forEach(function (touch) {
            touch.timestamp = evt.timeStamp;
            var _vars = vars[touch.identifier];
            _vars.vector = polarVector(touch.clientX, touch.clientY, _vars.start.clientX, _vars.start.clientY);
            touch.vars = _vars;
            touch.path = evt.path;
        });
        handlerKeys.forEach(function (name) {
            return handlers[name].move(touches, evt);
        });
    }, false);
    window.addEventListener('touchend', function (evt) {
        var touches = toArray(evt.changedTouches);
        touches.forEach(function (touch) {
            touch.timestamp = evt.timeStamp;
            var _vars = vars[touch.identifier];
            _vars.vector = polarVector(touch.clientX, touch.clientY, _vars.start.clientX, _vars.start.clientY);
            touch.vars = _vars;
            touch.path = evt.path;
        });
        handlerKeys.forEach(function (name) {
            return handlers[name].end(touches, evt);
        });
    }, false);

    if (isMobile === false) {
        var genSynthTouch = function genSynthTouch(evt) {
            return {
                identifier: -10,
                target: currentTarget,
                sourceElement: currentTarget,
                pageX: evt.pageX,
                pageY: evt.pageY,
                screenX: evt.screenX,
                screenY: evt.screenY,
                clientX: evt.clientX,
                clientY: evt.clientY
            };
        };
        var genTouchList = function genTouchList(evt) {
            return {
                0: genSynthTouch(evt),
                length: 1
            };
        };

        var currentTarget = null;
        var mouseIsDown = false;

        var dispatchSyntheticEvent = function dispatchSyntheticEvent(evt, type) {
            var touchList = genTouchList(evt);
            evt.target.dispatchEvent(createEvent(type, {
                changedTouches: touchList,
                touches: touchList,
                syntheticEvent: true
            }));
        };
        window.addEventListener('mousedown', function (evt) {
            if (evt.button !== 0) {
                return;
            }
            mouseIsDown = true;
            currentTarget = evt.target;
            dispatchSyntheticEvent(evt, 'touchstart');
        }, true);
        window.addEventListener('mousemove', function (evt) {
            if (mouseIsDown === false) {
                return;
            }
            dispatchSyntheticEvent(evt, 'touchmove');
        }, true);
        window.addEventListener('mouseup', function (evt) {
            if (evt.button !== 0 || mouseIsDown === false) {
                return;
            }
            mouseIsDown = false;
            dispatchSyntheticEvent(evt, 'touchend');
            currentTarget = null;
        }, true);
    }

    addHandler('tap', function () {
        var pathAdd = function pathAdd(elem) {
            while (elem !== null && elem !== document.documentElement) {
                elem.setAttribute("data-touch-active", '');
                elem = elem.parentNode;
            }
        };
        var pathRemove = function pathRemove(elem) {
            while (elem !== null && elem !== document.documentElement) {
                elem.removeAttribute("data-touch-active");
                elem = elem.parentNode;
            }
        };
        return {
            start: function start(touches) {
                touches.forEach(function (touch) {
                    touch.vars.tapValid = true;
                    touch.vars.tapManage = touch.target.hasAttribute('data-touch-active') === false;
                    if (touch.vars.tapManage === true) {
                        pathAdd(touch.target);
                    }
                });
            },
            move: function move(touches) {
                touches.forEach(function (touch) {
                    if (touch.vars.vector.magnitude > 20) {
                        touch.vars.tapValid = false;
                        if (touch.vars.tapManage === true) {
                            pathRemove(touch.target);
                            touch.vars.tapManage = false;
                        }
                    }
                });
            },
            end: function end(touches, evt) {
                touches.forEach(function (touch) {
                    if (touch.vars.tapManage === true) {
                        pathRemove(touch.target);
                    }
                    if (touch.vars.vector.magnitude > 20) {
                        return;
                    }
                    if (touch.timestamp - touch.vars.start.timestamp > 600) {
                        return;
                    }
                    var synthEvent = createEvent('tap', copyTouchEvent(touch));
                    evt.preventDefault();
                    delay(function () {
                        if (touch.target.dispatchEvent(synthEvent) === true) {
                            touch.target.focus();
                        }
                    });
                });
            }
        };
    });
    addHandler('hold', function () {
        var timeouts = {};
        var schedule = function schedule(touch) {
            return setTimeout(function () {
                timeouts[touch.identifier] = null;
                touch.target.dispatchEvent(createEvent('hold', copyTouchEvent(touch)));
            }, 1500);
        };
        var clear = function clear(touch) {
            if (timeouts[touch.identifier] !== null) {
                clearTimeout(timeouts[touch.identifier]);
                timeouts[touch.identifier] = null;
            }
        };

        return {
            start: function start(touches) {
                touches.forEach(function (touch) {
                    timeouts[touch.identifier] = schedule(touch);
                });
            },
            move: function move(touches) {
                touches.forEach(function (touch) {
                    if (touch.vars.vector.magnitude > 20) {
                        clear(touch);
                    }
                });
            },
            end: function end(touches) {
                touches.forEach(clear);
            }
        };
    });
    addHandler('swipe', function () {
        var angleDif = function angleDif(firstAngle, secondAngle) {
            var absDif = Math.abs(firstAngle - secondAngle) % 360;
            if (absDif > 180) {
                return 360 - absDif;
            }
            return absDif;
        };
        var clampAngles = function clampAngles(vars) {
            var angle = vars.vector.angle;
            vars.swipeMin = Math.min(angle, vars.swipeMin);
            vars.swipeMax = Math.max(angle, vars.swipeMax);
        };
        return {
            start: function start(touches) {
                touches.forEach(function (touch) {
                    touch.vars.swipeMin = Number.POSITIVE_INFINITY;
                    touch.vars.swipeMax = Number.NEGATIVE_INFINITY;
                });
            },
            move: function move(touches) {
                touches.forEach(function (touch) {
                    clampAngles(touch.vars);
                });
            },
            end: function end(touches) {
                touches.forEach(function (touch) {
                    clampAngles(touch.vars);
                    var range = angleDif(touch.vars.swipeMin, touch.vars.swipeMax);
                    if (range < 26) {
                        delay(function () {
                            var evt = createEvent('swipe', copyTouchEvent(touch));
                            evt.angle = touch.vars.vector.angle;
                            evt.distance = touch.vars.vector.magnitude;
                            evt.speed = evt.distance / ((touch.timestamp - touch.vars.start.timestamp) / 1000);
                            touch.target.dispatchEvent(evt);
                        });
                    }
                });
            }
        };
    });

    var lib = {
        addHandler: addHandler,
        createEvent: createEvent,
        copyTouchEvent: copyTouchEvent
    };

    if (typeof module !== 'undefined') {
        module.exports = lib;
    } else {
        window.gesturesJS = lib;
    }
})();