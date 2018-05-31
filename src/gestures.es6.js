'use strict';

(() => {
    const isMobile = typeof orientation !== 'undefined' || navigator.userAgent.indexOf("Mobile") !== -1;
    const forEach = Array.prototype.forEach;
    const toArray = obj => {
        const arr = [];
        const len = obj.length;

        for (let index = 0; index < len; index += 1) {
            arr.push(obj[index]);
        }

        return arr;
    };

    const handlers = {};
    let handlerKeys = [];

    const addHandler = (name, handler) => {
        if (typeof handler === 'function') {
            handler = handler();
        }
        handlers[name] = handler;
        handlerKeys = Object.keys(handlers);
    };
    const createEvent = (type, props = {}) => {
        const evt = new CustomEvent(type, {bubbles: true, cancelable: true});

        Object.keys(props).forEach(
            key => evt[key] = props[key]
        );

        return evt;
    };
    const copyTouchEvent = touch => ({
        pageX: touch.pageX,
        pageY: touch.pageY,
        screenX: touch.screenX,
        screenY: touch.screenY,
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    const delay = (func) => setTimeout(func, 0);

    const polarVector = (x1, y1, x2, y2) => {
        const x = x2 - x1;
        const y = y2 - y1;
        let angle;
        let magnitude;

        angle = Math.atan2(y, x);
        angle *= 180 / Math.PI;
        angle = (angle + 270) % 360;

        magnitude = Math.sqrt(x ** 2 + y ** 2);

        return {
            angle,
            magnitude
        };
    };
    const vars = {};
    window.addEventListener(
        'touchstart',
        evt => {
            const touches = toArray(evt.changedTouches);
            touches.forEach(touch => {
                touch.timestamp = evt.timeStamp;
                vars[touch.identifier] = {
                    start: touch
                };
                touch.vars = vars[touch.identifier];
                touch.path = evt.path;
            });
            handlerKeys.forEach(
                name => handlers[name].start(touches, evt)
            );
        },
        false
    );
    window.addEventListener(
        'touchmove',
        evt => {
            const touches = toArray(evt.changedTouches);
            touches.forEach(touch => {
                touch.timestamp = evt.timeStamp;
                const _vars = vars[touch.identifier];
                _vars.vector = polarVector(
                    touch.clientX, touch.clientY,
                    _vars.start.clientX, _vars.start.clientY
                );
                touch.vars = _vars;
                touch.path = evt.path;
            });
            handlerKeys.forEach(
                name => handlers[name].move(touches, evt)
            );
        },
        false
    );
    window.addEventListener(
        'touchend',
        evt => {
            const touches = toArray(evt.changedTouches);
            touches.forEach(touch => {
                touch.timestamp = evt.timeStamp;
                const _vars = vars[touch.identifier];
                _vars.vector = polarVector(
                    touch.clientX, touch.clientY,
                    _vars.start.clientX, _vars.start.clientY
                );
                touch.vars = _vars;
                touch.path = evt.path;
            });
            handlerKeys.forEach(
                name => handlers[name].end(touches, evt)
            );
        },
        false
    );

    if (isMobile === false) {
        const genSynthTouch = evt => ({
            identifier: -10,
            target: currentTarget,
            sourceElement: currentTarget,
            pageX: evt.pageX,
            pageY: evt.pageY,
            screenX: evt.screenX,
            screenY: evt.screenY,
            clientX: evt.clientX,
            clientY: evt.clientY
        });
        const genTouchList = evt => ({
            0: genSynthTouch(evt),
            length: 1
        });

        let currentTarget = null;
        let mouseIsDown = false;

        const dispatchSyntheticEvent = (evt, type) => {
            const touchList = genTouchList(evt);
            evt.target.dispatchEvent(
                createEvent(
                    type,
                    {
                        changedTouches: touchList,
                        touches: touchList,
                        syntheticEvent: true
                    }
                )
            );
        };
        window.addEventListener(
            'mousedown',
            evt => {
                if (evt.button !== 0) {
                    return;
                }
                mouseIsDown = true;
                currentTarget = evt.target;
                dispatchSyntheticEvent(evt, 'touchstart');
            },
            true
        );
        window.addEventListener(
            'mousemove',
            evt => {
                if (mouseIsDown === false) {
                    return;
                }
                dispatchSyntheticEvent(evt, 'touchmove');
            },
            true
        );
        window.addEventListener(
            'mouseup',
            evt => {
                if (evt.button !== 0 || mouseIsDown === false) {
                    return;
                }
                mouseIsDown = false;
                dispatchSyntheticEvent(evt, 'touchend');
                currentTarget = null;
            },
            true
        );
    }

    addHandler(
        'active-touch',
        () => {
            const count = (() => {
                const tracker = new WeakMap();

                return {
                    inc(elem) {
                        const count = tracker.get(elem) || 0;
                        tracker.set(elem, count + 1);
                    },
                    dec(elem) {
                        const count = tracker.get(elem);
                        tracker.set(elem, count - 1);
                        return count - 1;
                    }
                };
            })();
            const className = 'data-touch-active';
            const pathAdd = elem => {
                while (elem !== null && elem !== document.documentElement) {
                    elem.setAttribute(className, '');
                    count.inc(elem);
                    elem = elem.parentNode;
                }
            };
            const pathRemove = elem => {
                while (elem !== null && elem !== document.documentElement) {
                    const left = count.dec(elem);
                    if (left === 0) {
                        elem.removeAttribute(className);
                    }
                    elem = elem.parentNode;
                }
            };

            return {
                start(touches) {
                    touches.forEach(touch => pathAdd(touch.target));
                },
                move(touches) {},
                end(touches) {
                    touches.forEach(touch => pathRemove(touch.target));
                }
            };
        }
    );
    addHandler(
        'tap',
        () => {
            const className = 'data-tap-active';
            const pathAdd = elem => {
                while (elem !== null && elem !== document.documentElement) {
                    elem.setAttribute(className, '');
                    elem = elem.parentNode;
                }
            };
            const pathRemove = elem => {
                while (elem !== null && elem !== document.documentElement) {
                    elem.removeAttribute(className);
                    elem = elem.parentNode;
                }
            };
            return {
                start(touches) {
                    touches.forEach(
                        touch => {
                            touch.vars.tapValid = true;
                            touch.vars.tapManage = touch.target.hasAttribute(className) === false;
                            if (touch.vars.tapManage === true) {
                                pathAdd(touch.target);
                            }
                        }
                    );
                },
                move(touches) {
                    touches.forEach(
                        touch => {
                            if (touch.vars.vector.magnitude > 20) {
                                touch.vars.tapValid = false;
                                if (touch.vars.tapManage === true) {
                                    pathRemove(touch.target);
                                    touch.vars.tapManage = false;
                                }
                            }
                        }
                    );
                },
                end(touches, evt) {
                    touches.forEach(
                        touch => {
                            if (touch.vars.tapManage === true) {
                                pathRemove(touch.target);
                            }
                            if (touch.vars.vector.magnitude > 20) {
                                return;
                            }
                            if ((touch.timestamp - touch.vars.start.timestamp) > 600) {
                                return;
                            }
                            const synthEvent = createEvent('tap', copyTouchEvent(touch));
                            delay(
                                () => {
                                    if (touch.target.dispatchEvent(synthEvent) === true) {
                                        touch.target.focus();
                                    }
                                }
                            );
                        }
                    );
                }
            };
        }
    );
    addHandler(
        'hold',
        () => {
            const timeouts = {};
            const schedule = touch =>
                setTimeout(
                    () => {
                        timeouts[touch.identifier] = null;
                        touch.target.dispatchEvent(
                            createEvent('hold', copyTouchEvent(touch))
                        );
                    },
                    1500
                );
            const clear = (touch) => {
                if (timeouts[touch.identifier] !== null) {
                    clearTimeout(timeouts[touch.identifier]);
                    timeouts[touch.identifier] = null;
                }
            };

            return {
                start(touches) {
                    touches.forEach(touch => {
                        timeouts[touch.identifier] = schedule(touch);
                    });
                },
                move(touches) {
                    touches.forEach(touch => {
                        if (touch.vars.vector.magnitude > 20) {
                            clear(touch);
                        }
                    });
                },
                end(touches) {
                    touches.forEach(clear);
                }
            };
        }
    );
    addHandler(
        'swipe',
        () => {
            const angleDif = (firstAngle, secondAngle) => {
                const absDif = Math.abs(firstAngle - secondAngle) % 360;
                if (absDif > 180) {
                    return 360 - absDif;
                }
                return absDif;
            };
            const clampAngles = (vars) => {
                const angle = vars.vector.angle;
                vars.swipeMin = Math.min(angle, vars.swipeMin);
                vars.swipeMax = Math.max(angle, vars.swipeMax);
            };
            return {
                start(touches){
                    touches.forEach(touch => {
                        touch.vars.swipeMin = Number.POSITIVE_INFINITY;
                        touch.vars.swipeMax = Number.NEGATIVE_INFINITY;
                    });
                },
                move(touches){
                    touches.forEach(touch => {
                        clampAngles(touch.vars);
                    });
                },
                end(touches){
                    touches.forEach(touch => {
                        clampAngles(touch.vars);
                        const range = angleDif(touch.vars.swipeMin, touch.vars.swipeMax);
                        if (range < 26) {
                            delay(() => {
                                const evt = createEvent('swipe', copyTouchEvent(touch));
                                evt.angle = touch.vars.vector.angle;
                                evt.distance = touch.vars.vector.magnitude;
                                evt.speed = evt.distance / ((touch.timestamp - touch.vars.start.timestamp) / 1000);
                                touch.target.dispatchEvent(evt);
                            });
                        }
                    });
                }
            };
        }
    );

    const lib = {
        addHandler,
        createEvent,
        copyTouchEvent
    };

    if (typeof module !== 'undefined') {
        module.exports = lib;
    }
    else {
        window.gesturesJS = lib;
    }
})();
