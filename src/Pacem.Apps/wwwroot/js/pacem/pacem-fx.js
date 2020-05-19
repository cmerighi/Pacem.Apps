/**
 * pacem v0.9.0-byblos (https://js.pacem.it)
 * Copyright 2020 Pacem (https://pacem.it)
 * Licensed under MIT
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/// <reference path="../../../dist/js/pacem-core.d.ts" />
/// <reference path="../../../dist/js/pacem-ui.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Fx;
        (function (Fx) {
            class PacemFxElement extends Components.PacemEventTarget {
            }
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Element })
            ], PacemFxElement.prototype, "target", void 0);
            Fx.PacemFxElement = PacemFxElement;
        })(Fx = Components.Fx || (Components.Fx = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
/// <reference path="../../../dist/js/pacem-ui.d.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Fx;
        (function (Fx) {
            const FANCY_CSS = Pacem.PCSS + "-fancy";
            const FANCIFY_CSS = Pacem.PCSS + "-fancify";
            const DEFAULT_GAP = 20;
            let PacemFxFancyElement = class PacemFxFancyElement extends Fx.PacemFxElement {
                constructor() {
                    super(...arguments);
                    this._progress = .0;
                    this._started = false;
                }
                get progress() {
                    return this._progress;
                }
                get started() {
                    return this._started;
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'fancify' || name === 'target') {
                        if (!Pacem.Utils.isNull(this.target)) {
                            if (this.fancify) {
                                this.start();
                            }
                            else {
                                this._reset();
                            }
                        }
                    }
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    if (this.fancify && !Pacem.Utils.isNull(this.target))
                        this.start();
                }
                disconnectedCallback() {
                    cancelAnimationFrame(this._handle);
                    clearTimeout(this._handle1);
                    if (!Pacem.Utils.isNull(this.target))
                        this._reset();
                    super.disconnectedCallback();
                }
                _reset() {
                    Pacem.Utils.removeClass(this.target, FANCY_CSS);
                    if (this._started) {
                        this.dispatchEvent(new Pacem.PropertyChangeEvent({ propertyName: 'started', oldValue: this._started, currentValue: this._started = false }));
                    }
                    this.dispatchEvent(new Pacem.PropertyChangeEvent({ propertyName: 'progress', oldValue: this._progress, currentValue: this._progress = 0 }));
                    if (Pacem.Utils.isNull(this._originalContent))
                        this._originalContent = this.target.innerHTML;
                    else
                        this.target.innerHTML = this._originalContent;
                }
                _parse() {
                    let n, a = [], walker = document.createTreeWalker(this.target, NodeFilter.SHOW_TEXT, null, false);
                    while (n = walker.nextNode()) {
                        if (n.textContent) {
                            a.push(n);
                        }
                    }
                    this._textNodes = a;
                }
                start() {
                    if (!this.disabled) {
                        this._reset();
                        this._parse();
                        this._startShow();
                        this._handle1 = setTimeout(() => {
                            this.dispatchEvent(new Pacem.PropertyChangeEvent({ propertyName: 'started', oldValue: this._started, currentValue: this._started = true }));
                        }, this.delay || 0);
                    }
                }
                _startShow(ndx = 0) {
                    Pacem.Utils.addClass(this.target, FANCY_CSS);
                    const trunks = this._textNodes, length = trunks.length;
                    this._fancify(trunks[ndx]);
                    const old = this._progress;
                    ndx++;
                    const curr = this._progress = ndx / length;
                    this.dispatchEvent(new Pacem.PropertyChangeEvent({ propertyName: 'progress', oldValue: old, currentValue: curr }));
                    if (ndx < length) {
                        this._handle = requestAnimationFrame(() => {
                            this._startShow(ndx);
                        });
                    }
                }
                _fancify(node) {
                    const content = node.textContent;
                    if (Pacem.Utils.isNullOrEmpty(content) || !/[^\s]/.test(content)) {
                        return;
                    }
                    const leftPad = /^\s/.test(content), rightPad = /\s$/.test(content);
                    node.textContent = '';
                    //
                    const words = content.trim().split(' '), gap = this.gap || DEFAULT_GAP, delay = this.delay || 0;
                    let j = 0;
                    for (let word of words) {
                        var span = document.createElement('span');
                        span.className = FANCIFY_CSS;
                        span.style.animationDelay = `${(delay + j * gap)}ms`;
                        if (leftPad || j > 0)
                            node.parentElement.insertBefore(document.createTextNode(' '), node);
                        span.textContent = word;
                        node.parentElement.insertBefore(span, node);
                        j++;
                    }
                    //
                    if (rightPad)
                        node.parentElement.insertBefore(document.createTextNode(' '), node);
                }
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemFxFancyElement.prototype, "fancify", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
            ], PacemFxFancyElement.prototype, "delay", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
            ], PacemFxFancyElement.prototype, "gap", void 0);
            PacemFxFancyElement = __decorate([
                Pacem.CustomElement({ tagName: Pacem.P + '-fx-fancy' })
            ], PacemFxFancyElement);
            Fx.PacemFxFancyElement = PacemFxFancyElement;
        })(Fx = Components.Fx || (Components.Fx = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
/// <reference path="../../../dist/js/pacem-ui.d.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Fx;
        (function (Fx) {
            const HERO_CSS = Pacem.PCSS + "-hero";
            const TRANSITION = 200;
            const HEROING_IN = "entering";
            const HEROING_OUT = "exiting";
            const HERO_IN = "entered";
            const HERO_OUT = "exited";
            const rectOrElementConverter = {
                convert: attr => {
                    if (attr.trim().startsWith('#'))
                        return Pacem.PropertyConverters.Element.convert(attr);
                    return Pacem.PropertyConverters.Json.convert(attr);
                }
            };
            let PacemFxHeroElement = class PacemFxHeroElement extends Fx.PacemFxElement {
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    // target switch?
                    if (name === 'target' && !Pacem.Utils.isNull(old)) {
                        this._resetTarget(old);
                    }
                    // recompute back path (originalState)?
                    if (name === 'from' && this.hero && !Pacem.Utils.isNull(val)) {
                        this._originalState = this._computeFromState();
                    }
                    // trigger
                    if (name === 'hero' || name === 'target' || name === 'goal') {
                        if (!Pacem.Utils.isNull(this.target)) {
                            if (this.hero) {
                                this.start();
                            }
                            else {
                                this.reset();
                            }
                        }
                    }
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    if (this.hero && !Pacem.Utils.isNull(this.target))
                        this.start();
                }
                disconnectedCallback() {
                    if (!Pacem.Utils.isNull(this.target))
                        this.reset();
                    super.disconnectedCallback();
                }
                _computeFromState() {
                    const tget = this.target, offset = Pacem.Utils.offset(tget);
                    if (this.from instanceof Element) {
                        let from = Pacem.Utils.offset(this.from);
                        return { x: from.left, y: from.top, width: from.width, height: from.height };
                    }
                    else {
                        return { x: offset.left, y: offset.top, width: offset.width, height: offset.height };
                    }
                }
                _resetTarget(tget = this.target) {
                    // reset inline style options
                    const style = tget.style;
                    // reset position/size
                    style.top = style.left = style.height = style.width = '';
                    for (let j = 0; j < style.length; j++) {
                        let prop = style.item(j);
                        style[prop] = '';
                    }
                    for (let prop in this._originalStyle) {
                        style[prop] = this._originalStyle[prop];
                    }
                    Pacem.Utils.removeClass(tget, HERO_CSS);
                }
                reset() {
                    // 
                    if (Pacem.Utils.isNull(this._originalState) || Pacem.Utils.isNull(this._targetState)) {
                        return;
                    }
                    this.dispatchEvent(new Event(HEROING_OUT));
                    return this._animate(this._targetState, this._originalState).then(() => {
                        this._resetTarget();
                        this.dispatchEvent(new Event(HERO_OUT));
                    });
                }
                start() {
                    if (!this.disabled && !Pacem.Utils.isNull(this.target)) {
                        let goal;
                        if (this.to instanceof Element) {
                            let to = Pacem.Utils.offset(this.to);
                            goal = { x: to.left, y: to.top, width: to.width, height: to.height };
                        }
                        else {
                            goal = this.to;
                        }
                        const tget = this.target, wSize = Pacem.Utils.windowSize, state = goal || { x: 0, y: 0, width: wSize.width, height: wSize.height }, style = tget.style;
                        this._targetState = state;
                        let start = this._originalState = this._computeFromState();
                        // save inline style options
                        this._originalStyle = {};
                        for (let j = 0; j < style.length; j++) {
                            let prop = style.item(j);
                            this._originalStyle[prop] = style[prop];
                        }
                        // 
                        Pacem.Utils.addClass(tget, HERO_CSS);
                        this.dispatchEvent(new Event(HEROING_IN));
                        return this._animate(start, state).then(() => {
                            this.dispatchEvent(new Event(HERO_IN));
                        });
                    }
                    // nothing to do
                    return Promise.resolve();
                }
                _animate(from, to) {
                    const tget = this.target, style = tget.style;
                    // transformations to make target state look like original state
                    // i.e. `target state` gets constrained to fit `original state`.
                    const scaleX = from.width / to.width, scaleY = from.height / to.height, translateX = (from.x - to.x) + 'px', translateY = (from.y - to.y) + 'px';
                    style.transformOrigin = '0 0';
                    style.transition = 'none';
                    // set final state
                    style.transform = `translate(${translateX}, ${translateY}) scale(${scaleX}, ${scaleY})`;
                    style.width = to.width + 'px';
                    style.height = to.height + 'px';
                    style.top = to.y + 'px';
                    style.left = to.x + 'px';
                    // hero-animate
                    requestAnimationFrame(() => {
                        let duration = this.duration || TRANSITION;
                        style.transition = `transform cubic-bezier(0.445, 0.05, 0.55, 0.95) ${duration}ms, opacity ${duration}ms`;
                        style.transform = `translate(0, 0) scale(1)`;
                    });
                    return Pacem.Utils.waitForAnimationEnd(tget, TRANSITION + 10);
                    // Utils.addAnimationEndCallback(tget, callback, TRANSITION + 10);
                }
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemFxHeroElement.prototype, "hero", void 0);
            __decorate([
                Pacem.Watch({ converter: rectOrElementConverter, emit: false })
            ], PacemFxHeroElement.prototype, "to", void 0);
            __decorate([
                Pacem.Watch({ converter: rectOrElementConverter, emit: false })
            ], PacemFxHeroElement.prototype, "from", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number, emit: false })
            ], PacemFxHeroElement.prototype, "duration", void 0);
            PacemFxHeroElement = __decorate([
                Pacem.CustomElement({ tagName: Pacem.P + '-fx-hero' })
            ], PacemFxHeroElement);
            Fx.PacemFxHeroElement = PacemFxHeroElement;
        })(Fx = Components.Fx || (Components.Fx = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
/// <reference path="../../../dist/js/pacem-ui.d.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Fx;
        (function (Fx) {
            const CSS_CLASS = Pacem.PCSS + '-fx-list';
            let PacemFxListElement = class PacemFxListElement extends Fx.PacemFxElement {
                constructor() {
                    super(...arguments);
                    this._observed = (items) => {
                        const children = Array.from(this.target.children);
                        for (let item of items) {
                            item.removedNodes.forEach(n => {
                                if (n instanceof Element) {
                                    this.dispatchEvent(new CustomEvent('itemremoved', { detail: n }));
                                }
                            });
                            item.addedNodes.forEach((n, j) => {
                                if (n instanceof Element) {
                                    this.dispatchEvent(new CustomEvent('itemadded', { detail: { item: n, index: children.indexOf(n) } }));
                                }
                            });
                        }
                    };
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    if (!Pacem.Utils.isNull(this.target)) {
                        this._setup();
                    }
                }
                disconnectedCallback() {
                    if (!Pacem.Utils.isNull(this._observer)) {
                        this._observer.disconnect();
                    }
                    super.disconnectedCallback();
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'target') {
                        if (old) {
                            this._reset(old);
                        }
                        else {
                            this._setup();
                        }
                    }
                }
                _reset(el) {
                    Pacem.Utils.removeClass(el, CSS_CLASS);
                    this._observer.disconnect();
                }
                _setup() {
                    const target = this.target;
                    Pacem.Utils.addClass(target, CSS_CLASS);
                    const obs = this._observer = new MutationObserver(this._observed);
                    obs.observe(target, { childList: true });
                }
            };
            PacemFxListElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-fx-list'
                })
            ], PacemFxListElement);
            Fx.PacemFxListElement = PacemFxListElement;
        })(Fx = Components.Fx || (Components.Fx = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
/// <reference path="../../../dist/js/pacem-ui.d.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Fx;
        (function (Fx) {
            const RIPPLE_CSS = "ripple";
            let PacemFxRippleElement = class PacemFxRippleElement extends Fx.PacemFxElement {
                constructor() {
                    super(...arguments);
                    this._lock = false;
                    this._remove = false;
                    this._rippleHandler = (e) => {
                        if (this.disabled || (this.target instanceof Components.PacemEventTarget && this.target.disabled)) {
                            return;
                        }
                        if (e instanceof MouseEvent && e.button !== 0) {
                            // only the 'main' (left) button click goes.
                            return;
                        }
                        const rect = Pacem.Utils.offset(this.target);
                        const style = getComputedStyle(this.target);
                        const css = this.style;
                        css.top = rect.top + 'px';
                        css.left = rect.left + 'px';
                        css.width = rect.width + 'px';
                        css.height = rect.height + 'px';
                        css.borderRadius = style.borderRadius;
                        const pointSrc = e.type === 'touchstart' ? e.touches[0] : e;
                        const point = { x: pointSrc.pageX, y: pointSrc.pageY };
                        const topLeft = { x: rect.left, y: rect.top }, topRight = { x: rect.left + rect.width, y: rect.top }, bottomLeft = { x: rect.left, y: rect.top + rect.height }, bottomRight = { x: topRight.x, y: bottomLeft.y };
                        const radius = Math.max(Pacem.Geom.distance(point, topLeft), Pacem.Geom.distance(point, topRight), Pacem.Geom.distance(point, bottomRight), Pacem.Geom.distance(point, bottomLeft));
                        const wave = this._wave;
                        wave.style.left = (point.x - rect.left - radius) + 'px';
                        wave.style.top = (point.y - rect.top - radius) + 'px';
                        wave.style.width = wave.style.height = (2 * radius) + 'px';
                        Pacem.Utils.addAnimationEndCallback(wave, () => {
                            this._lock = false;
                            this._tryRemove();
                        });
                        this._lock = true;
                        Pacem.Utils.addClass(wave, 'ripple-go');
                    };
                    this._unrippleHandler = (e) => {
                        this._remove = true;
                        this._tryRemove();
                    };
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    // target switch?
                    if (name === 'target') {
                        if (!Pacem.Utils.isNull(old)) {
                            this._reset(old);
                        }
                        if (!Pacem.Utils.isNull(val)) {
                            this._set(val);
                        }
                    }
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    if (!Pacem.Utils.isNull(this.target))
                        this._set();
                }
                disconnectedCallback() {
                    if (!Pacem.Utils.isNull(this.target))
                        this._reset();
                    super.disconnectedCallback();
                }
                _tryRemove() {
                    if (!this._lock && this._remove) {
                        this._remove = false;
                        Pacem.Utils.removeClass(this._wave, 'ripple-go');
                    }
                }
                _set(val = this.target) {
                    val.addEventListener('mousedown', this._rippleHandler, false);
                    val.addEventListener('touchstart', this._rippleHandler, false);
                    val.addEventListener('touchend', this._unrippleHandler, false);
                    val.addEventListener('mouseup', this._unrippleHandler, false);
                    val.addEventListener('mousemove', this._unrippleHandler, false);
                }
                _reset(old = this.target) {
                    old.removeEventListener('mousedown', this._rippleHandler, false);
                    old.removeEventListener('touchstart', this._rippleHandler, false);
                    old.removeEventListener('touchend', this._unrippleHandler, false);
                    old.removeEventListener('mouseup', this._unrippleHandler, false);
                    old.removeEventListener('mousemove', this._unrippleHandler, false);
                }
            };
            __decorate([
                Pacem.ViewChild('.' + RIPPLE_CSS)
            ], PacemFxRippleElement.prototype, "_wave", void 0);
            PacemFxRippleElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-fx-ripple', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<div class="${RIPPLE_CSS}"></div>`
                })
            ], PacemFxRippleElement);
            Fx.PacemFxRippleElement = PacemFxRippleElement;
        })(Fx = Components.Fx || (Components.Fx = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
