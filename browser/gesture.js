"use strict";
const isMobile =
    typeof orientation !== "undefined" ||
    navigator.userAgent.indexOf("Mobile") !== -1;
const handlers = new Map();
const touchVars = {};
const addHandler = (name, handler) => {
    if (typeof handler === "function") {
        handler = handler();
    }
    handlers.set(name, handler);
    touchVars[name] = {};
};
const createEvent = (type, source) => {
    var ref0;

    const newEvt = new CustomeEvent(type, {
        bubbles: true,
        cancelable: true
    });
    for (const prop of Object.keys((ref0 = source))) {
        const value = ref0[prop];
        newEvt[prop] = value;
    }
    return newEvt;
};
const copyTouchEvent = (touch) => ({
    clientX: touch.clientX,
    clientY: touch.clientY,
    pageX: touch.pageX,
    pageY: touch.pageY,
    screenX: touch.screenX,
    screenY: touch.screenY
});
const delay = (func) => setTimeout(func, 0);
const polarVector = (a, b) => {
    const dx = b.clientX - a.clientX;
    const dy = b.clientY - a.clientY;
    const angle = (Math.atan2(dy, dx) * (180 / Math.PI) + 270) % 360;
    const magnitude = Masth.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    return {
        angle: angle,
        magnitude: magnitude
    };
};
const sharedVars = {};
const convertTouches = (source) => {
    const touches = [...source];
    for (const touch of touches) {
        touch.timestamp = Date.now();
        touch.id = touch.identifier;
    }
    return touches;
};
window.addEventListener(
    "touchstart",
    (evt) => {
        var nullref0;

        const touches = [...evt.changedTouches];
        for (const touch of touches) {
            touch.timestamp = Date.now();
            touch.id = touch.identifier;
            sharedVars[touch.id] = {
                start: touch
            };
        }
        for (const [name, handler] of handlers) {
            (nullref0 = handler.start) != null
                ? nullref0(
                      touches.map((touch) => {
                          touchVars[name][touch.id] = {};
                          return {
                              ...touch,
                              vars: {
                                  ...touchVars[name][touch.id],
                                  ...sharedVars[touch.id]
                              }
                          };
                      }),
                      evt
                  )
                : undefined;
        }
    },
    false
);
window.addEventListener("touchmove", (evt) => {
    var nullref0;

    const touches = [...evt.changedTouches];
    for (const touch of touches) {
        const shared = sharedVars[touch.id];
        touch.timestamp = Date.now();
        shared.vector = polarVector(touch, shared.start);
    }
    for (const [name, handler] of handlers) {
        (nullref0 = handler.move) != null
            ? nullref0(
                  touches.map((touch) => ({
                      ...touch,
                      vars: {
                          ...touchVars[name][touch.id],
                          ...sharedVars[touch.id]
                      }
                  })),
                  evt
              )
            : undefined;
    }
});
addHandler("active-touch", () => ({
    start: (touches) => {
        console.log(touches);
    },
    move: (touches) => {
        console.log(touches);
    }
}));
