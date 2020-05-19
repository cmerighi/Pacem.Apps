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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let AdapterOrientation;
            (function (AdapterOrientation) {
                AdapterOrientation["Vertical"] = "vertical";
                AdapterOrientation["Horizontal"] = "horizontal";
            })(AdapterOrientation = UI.AdapterOrientation || (UI.AdapterOrientation = {}));
            UI.AdapterPageButtonRefreshEventName = 'pagerefresh';
            class AdapterPageButtonRefreshEvent extends CustomEvent {
                constructor(args) {
                    super(UI.AdapterPageButtonRefreshEventName, { detail: args, bubbles: false, cancelable: false });
                }
            }
            UI.AdapterPageButtonRefreshEvent = AdapterPageButtonRefreshEvent;
            let PacemAdapterElement = class PacemAdapterElement extends Components.PacemAdapter {
                constructor() {
                    super(...arguments);
                    this._itemCreatedHandler = (evt) => {
                        const index = evt.detail.index;
                        this._pageMap.set(index, evt.detail.dom[0].firstElementChild);
                        this._fireAdapterPageRefreshCallback(index, evt.detail.item);
                    };
                    this._pageMap = new Map();
                    this.interactive = true;
                    /** Gets or sets whether swipe gesture is enabled for navigation (also depends on the 'interactive' flag being set to 'true') */
                    this.swipeEnabled = true;
                    this.loop = true;
                    this.labelCallback = (item, index) => (index + 1).toString();
                    this._itemRegisterHandler = (evt) => {
                        let item = evt.detail;
                        if (!Pacem.Utils.isNull(this._swiper) && item instanceof Components.PacemElement && item.behaviors.indexOf(this._swiper) == -1)
                            item.behaviors.push(this._swiper);
                    };
                    this._itemUnregisterHandler = (evt) => {
                        let item = evt.detail, index;
                        if (!Pacem.Utils.isNull(this._swiper) && item instanceof Components.PacemElement && (index = item.behaviors.indexOf(this._swiper)) >= 0)
                            item.behaviors.splice(index, 1);
                    };
                    this._keydownHandler = (evt) => {
                        if (!this.interactive) {
                            return;
                        }
                        switch (this.orientation) {
                            case AdapterOrientation.Vertical:
                                switch (evt.keyCode) {
                                    case 40: // down
                                        this._next(evt);
                                        break;
                                    case 38: // up
                                        this._previous(evt);
                                        break;
                                }
                                break;
                            default:
                                // horizontal
                                switch (evt.keyCode) {
                                    case 39: // right
                                        this._next(evt);
                                        break;
                                    case 37: // left
                                        this._previous(evt);
                                        break;
                                }
                                break;
                        }
                    };
                }
                masterPropertyChangedCallback(name, old, val, first) {
                    super.masterPropertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'items':
                            this._syncViewWithItems();
                            break;
                        case 'index':
                            this._index = val;
                            break;
                    }
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this._repeater.addEventListener(Components.RepeaterItemCreateEventName, this._itemCreatedHandler, false);
                    this._syncViewWithItems();
                }
                disconnectedCallback() {
                    if (this._repeater) {
                        this._repeater.removeEventListener(Components.RepeaterItemCreateEventName, this._itemCreatedHandler, false);
                    }
                    super.disconnectedCallback();
                }
                initializeCallback() {
                    super.initializeCallback();
                    this.addEventListener('keydown', this._keydownHandler, false);
                    const el = this.master;
                    //
                    if (!Pacem.Utils.isNull(el)) {
                        const tab = this._previousTabIndex = el.tabIndex;
                        if (!tab || tab < 0)
                            el.tabIndex = 0;
                        el.addEventListener('keydown', this._keydownHandler, false);
                        el.addEventListener(Pacem.Components.ItemRegisterEventName, this._itemRegisterHandler, false);
                        el.addEventListener(Pacem.Components.ItemUnregisterEventName, this._itemUnregisterHandler, false);
                    }
                    //
                    this._syncViewWithItems();
                }
                destroyCallback() {
                    this.removeEventListener('keydown', this._keydownHandler, false);
                    const el = this.master;
                    if (!Pacem.Utils.isNull(el)) {
                        el.removeEventListener('keydown', this._keydownHandler, false);
                        el.removeEventListener(Pacem.Components.ItemRegisterEventName, this._itemRegisterHandler, false);
                        el.removeEventListener(Pacem.Components.ItemUnregisterEventName, this._itemUnregisterHandler, false);
                        if (!Pacem.Utils.isNullOrEmpty(el.items)) {
                            for (let item of el.items) {
                                const behaviors = item.behaviors, ndx = behaviors.indexOf(this._swiper);
                                if (ndx >= 0) {
                                    behaviors.splice(ndx, 1);
                                }
                            }
                        }
                        el.tabIndex = this._previousTabIndex;
                    }
                    super.destroyCallback();
                }
                itemPropertyChangedCallback(index, name, old, val, first) {
                    super.itemPropertyChangedCallback(index, name, old, val, first);
                    // tick overall version
                    this._tickVersion();
                    this._fireAdapterPageRefreshCallback(index);
                }
                _fireAdapterPageRefreshCallback(index, item) {
                    item = item || this.master.items[index];
                    var hide = item.hide || false, disable = item.disabled || false, caption = this._labelCallback(item, index);
                    const evt = new AdapterPageButtonRefreshEvent({ index: index, hide: hide, disabled: disable, content: caption });
                    this.dispatchEvent(evt);
                    // receive/accept changes
                    hide = this._isHidden(item, index, evt.detail.hide);
                    disable = this._isDisabled(item, index, evt.detail.disabled);
                    caption = evt.detail.content;
                    // pick target button
                    const pagers = this._pageMap;
                    if (pagers.has(index)) {
                        const pager = pagers.get(index), span = pager.firstElementChild;
                        let fn = (e) => {
                            if (e) {
                                pager.removeEventListener('load', fn, false);
                            }
                            pager.hide = hide;
                            pager.disabled = disable;
                            span.content = caption;
                        };
                        // *careful here*: TODO: TO BE STUDIED
                        // if setting the property before it's connected
                        // the @Watch configuration and the get+set injection gets lost!
                        if (pager.isReady) {
                            // does not work for properties(?)...
                            fn();
                        }
                        else {
                            pager.addEventListener('load', fn, false);
                        }
                    }
                }
                _tickVersion() {
                    this._v = Date.now();
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'interval':
                            this._resetTimer(val);
                            break;
                        case 'swipeEnabled':
                            this._swiper.disabled = !val || !this.interactive;
                            break;
                        case 'interactive':
                            this.hidden = !val;
                            this._swiper.disabled = !val || !this.swipeEnabled;
                            break;
                        case 'pausable':
                            if (val == true)
                                this._liPause.removeAttribute('hidden');
                            else
                                this._liPause.setAttribute('hidden', 'hidden');
                            break;
                    }
                }
                _syncViewWithItems() {
                    if (!this.isReady
                        || Pacem.Utils.isNull(this.master)
                        || Pacem.Utils.isNull(this._prevBtn)
                        || Pacem.Utils.isNull(this._nextBtn)
                        || Pacem.Utils.isNull(this._repeater))
                        return;
                    var val = this.master.items;
                    this._prevBtn.hide = this._nextBtn.hide = this._panel.hide = !(val && val.length > 1);
                    this._panel.hide = Pacem.Utils.isNullOrEmpty(val);
                    this._repeater.datasource = val;
                    this._index = this.master.index;
                    if (!Pacem.Utils.isNullOrEmpty(val)) {
                        for (let item of val) {
                            if (item instanceof Components.PacemElement && item.behaviors.indexOf(this._swiper) == -1)
                                item.behaviors.push(this._swiper);
                        }
                    }
                }
                _toggle(evt) {
                    const p = this._paused = !this._paused;
                    if (p) {
                        Pacem.avoidHandler(evt);
                        this._resetTimer(0);
                    }
                    else {
                        this._next(evt);
                    }
                }
                _resetTimer(val) {
                    clearInterval(this._handle);
                    if (val > 0)
                        this._handle = window.setInterval(() => {
                            super.next();
                        }, val);
                }
                _next(evt) {
                    if (evt.type !== Pacem.UI.SwipeEventType.SwipeLeft)
                        Pacem.avoidHandler(evt);
                    this._resetTimer(this.interval);
                    super.next(this.loop);
                }
                _previous(evt) {
                    if (evt.type !== Pacem.UI.SwipeEventType.SwipeRight)
                        Pacem.avoidHandler(evt);
                    this._resetTimer(this.interval);
                    super.previous(this.loop);
                }
                _select(ndx, evt) {
                    Pacem.avoidHandler(evt);
                    this._resetTimer(this.interval);
                    if (!this.deselectable || ndx !== this._index) {
                        super.select(ndx);
                    }
                    else {
                        this.master.index = this._index = -1;
                    }
                }
                _isDisabled(item, index, disabled, v) {
                    return this._disableOrHide(item, index, disabled);
                }
                _isHidden(item, index, hide, v) {
                    return this._disableOrHide(item, index, hide);
                }
                _disableOrHide(item, index, disabledOrHidden) {
                    const retval = item instanceof Components.PacemElement && disabledOrHidden === true;
                    if ((this._index === -1 && retval === false) || (retval === true && index === this._index)) {
                        if (this.deselectable) {
                            this.master.index = this._index = -1;
                        }
                        else {
                            super.select(index);
                        }
                    }
                    return retval;
                }
                _labelCallback(item, index, v) {
                    return this.labelCallback(item, index);
                }
            };
            __decorate([
                Pacem.ViewChild(Pacem.P + '-repeater')
            ], PacemAdapterElement.prototype, "_repeater", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-button.' + Pacem.PCSS + '-adapter-previous')
            ], PacemAdapterElement.prototype, "_prevBtn", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-button.' + Pacem.PCSS + '-adapter-next')
            ], PacemAdapterElement.prototype, "_nextBtn", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-panel')
            ], PacemAdapterElement.prototype, "_panel", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-swipe')
            ], PacemAdapterElement.prototype, "_swiper", void 0);
            __decorate([
                Pacem.ViewChild('.' + Pacem.PCSS + '-adapter-dashboard > li[pacem]')
            ], PacemAdapterElement.prototype, "_liPause", void 0);
            __decorate([
                Pacem.Debounce()
            ], PacemAdapterElement.prototype, "_tickVersion", null);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemAdapterElement.prototype, "pausable", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
            ], PacemAdapterElement.prototype, "interval", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemAdapterElement.prototype, "orientation", void 0);
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.Boolean })
            ], PacemAdapterElement.prototype, "interactive", void 0);
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.Boolean })
            ], PacemAdapterElement.prototype, "swipeEnabled", void 0);
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.Boolean })
            ], PacemAdapterElement.prototype, "deselectable", void 0);
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.Boolean })
            ], PacemAdapterElement.prototype, "loop", void 0);
            __decorate([
                Pacem.Watch({ emit: false })
            ], PacemAdapterElement.prototype, "labelCallback", void 0);
            __decorate([
                Pacem.Watch()
            ], PacemAdapterElement.prototype, "_index", void 0);
            __decorate([
                Pacem.Watch()
            ], PacemAdapterElement.prototype, "_paused", void 0);
            __decorate([
                Pacem.Watch()
            ], PacemAdapterElement.prototype, "_v", void 0);
            __decorate([
                Pacem.Throttle(333)
            ], PacemAdapterElement.prototype, "_next", null);
            __decorate([
                Pacem.Throttle(333)
            ], PacemAdapterElement.prototype, "_previous", null);
            PacemAdapterElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-adapter', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-button class="${Pacem.PCSS}-adapter-previous" on-click=":host._previous($event)">&lt;</${Pacem.P}-button>
    <${Pacem.P}-button class="${Pacem.PCSS}-adapter-next" on-click=":host._next($event)">&gt;</${Pacem.P}-button>
    <${Pacem.P}-swipe on-swipeleft=":host._next($event)" on-swiperight=":host._previous($event)"></${Pacem.P}-swipe>
    <${Pacem.P}-panel tabindex="0">
    <${Pacem.P}-repeater>
    <ol class="${Pacem.PCSS}-adapter-dashboard">
        <li pacem hidden>
            <${Pacem.P}-button class="${Pacem.PCSS}-play-pause"
                          css-class="{{ {'paused' : :host._paused, 'playing': !:host._paused } }}" 
                          disabled="{{ !:host.pausable }}" on-click=":host._toggle($event)"></${Pacem.P}-button>
        </li>
        <template>
        <li>
            <${Pacem.P}-button on-click=":host._select(^index, $event)" class="${Pacem.PCSS}-adapter-page" css-class="{{ { '${Pacem.PCSS}-adapter-active': ^index === :host._index } }}">
                <${Pacem.P}-span></${Pacem.P}-span>
            </${Pacem.P}-button>
        </li>
        </template>
    </ol></${Pacem.P}-repeater></${Pacem.P}-panel>`
                })
            ], PacemAdapterElement);
            UI.PacemAdapterElement = PacemAdapterElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let PacemAnchorElement = class PacemAnchorElement extends Components.PacemElement {
                constructor() {
                    super('link');
                    this._fetching = false;
                }
                ///
                get fetching() {
                    return this._fetching;
                }
                connectedCallback() {
                    super.connectedCallback();
                    if (!this.hasAttribute('tab-order')) {
                        this.tabOrder = 0;
                    }
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'target':
                            (Pacem.Utils.isNullOrEmpty(val) ? Pacem.Utils.removeClass : Pacem.Utils.addClass)(this, 'a-target');
                            break;
                        case 'href':
                            (Pacem.Utils.isNull(val) ? Pacem.Utils.removeClass : Pacem.Utils.addClass)(this, 'a-url');
                            break;
                        case 'download':
                            (Pacem.Utils.isNullOrEmpty(val) ? Pacem.Utils.removeClass : Pacem.Utils.addClass)(this, 'a-download');
                            break;
                    }
                }
                emit(evt) {
                    super.emit(evt);
                    if (this.disabled) {
                        return;
                    }
                    switch (evt.type) {
                        case 'mousedown':
                            Pacem.Utils.addClass(this, Pacem.PCSS + '-active');
                            break;
                        case 'keydown':
                            if (evt.keyCode === 13) {
                                evt.preventDefault();
                                Pacem.Utils.addClass(this, Pacem.PCSS + '-active');
                            }
                            break;
                        case 'blur':
                        case 'mouseup':
                            Pacem.Utils.removeClass(this, Pacem.PCSS + '-active');
                            break;
                        case 'keyup':
                            if (evt.keyCode === 13) {
                                this.click();
                                Pacem.Utils.removeClass(this, Pacem.PCSS + '-active');
                            }
                            break;
                    }
                    const url = this.href, target = this.target, router = this.router, filename = this.download;
                    if (!Pacem.Utils.isNull(url) && !evt.defaultPrevented) {
                        if ((evt.type === 'click' && evt.ctrlKey) || (evt.type === 'mousedown' && evt.button === 1)) {
                            window.open(url, '_blank');
                        }
                        else if (evt.type === 'click') {
                            if (filename === true) {
                                this._download(url);
                            }
                            else if (typeof filename === 'string' && !Pacem.Utils.isNullOrEmpty(filename)) {
                                this._download(url, filename);
                            }
                            else if (!Pacem.Utils.isNull(router)) {
                                // old implementation memento: Pacem.preventDefaultHandler(evt);
                                // trigger router `navigate()`
                                router.path = url;
                            }
                            else {
                                if (!Pacem.Utils.isNullOrEmpty(target)) {
                                    window.open(url, target || '_blank');
                                }
                                else {
                                    location.assign(url);
                                }
                            }
                        }
                    }
                }
                _download(url, filename) {
                    return __awaiter(this, void 0, void 0, function* () {
                        this.dispatchEvent(new Pacem.PropertyChangeEvent({
                            propertyName: 'fetching', oldValue: this._fetching, currentValue: this._fetching = true
                        }));
                        try {
                            yield Pacem.Utils.download(url, { credentials: this.fetchCredentials, headers: this.fetchHeaders, filename: filename });
                        }
                        finally {
                            this.dispatchEvent(new Pacem.PropertyChangeEvent({
                                propertyName: 'fetching', oldValue: this._fetching, currentValue: this._fetching = false
                            }));
                        }
                    });
                }
            };
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemAnchorElement.prototype, "fetchCredentials", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Json })
            ], PacemAnchorElement.prototype, "fetchHeaders", void 0);
            __decorate([
                Pacem.Watch({ reflectBack: false, converter: Pacem.PropertyConverters.String })
            ], PacemAnchorElement.prototype, "href", void 0);
            __decorate([
                Pacem.Watch({ reflectBack: false, converter: Pacem.PropertyConverters.String })
            ], PacemAnchorElement.prototype, "target", void 0);
            __decorate([
                Pacem.Watch({
                    reflectBack: false, converter: {
                        convert: (attr) => {
                            switch (attr) {
                                case 'true':
                                    return true;
                                case 'false':
                                    return false;
                                default:
                                    return attr;
                            }
                        }, convertBack: (prop) => prop
                    }
                })
            ], PacemAnchorElement.prototype, "download", void 0);
            __decorate([
                Pacem.Watch({ reflectBack: false, converter: Pacem.PropertyConverters.Element })
            ], PacemAnchorElement.prototype, "router", void 0);
            PacemAnchorElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-a'
                })
            ], PacemAnchorElement);
            UI.PacemAnchorElement = PacemAnchorElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            UI.ElementOrPointPropertyConverter = {
                convert: (attr) => {
                    let el = document.querySelector(attr);
                    return el || JSON.parse(attr);
                }
            };
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let BalloonBehavior;
            (function (BalloonBehavior) {
                BalloonBehavior["Menu"] = "menu";
                BalloonBehavior["Tooltip"] = "tooltip";
                BalloonBehavior["Inert"] = "inert";
            })(BalloonBehavior = UI.BalloonBehavior || (UI.BalloonBehavior = {}));
            let BalloonTrigger;
            (function (BalloonTrigger) {
                BalloonTrigger["Hover"] = "hover";
                BalloonTrigger["Click"] = "click";
                BalloonTrigger["ContextMenu"] = "contextmenu";
                BalloonTrigger["Focus"] = "focus";
            })(BalloonTrigger = UI.BalloonTrigger || (UI.BalloonTrigger = {}));
            let BalloonAlignment;
            (function (BalloonAlignment) {
                BalloonAlignment["Start"] = "start";
                BalloonAlignment["Center"] = "center";
                BalloonAlignment["End"] = "end";
                BalloonAlignment["Auto"] = "auto";
            })(BalloonAlignment = UI.BalloonAlignment || (UI.BalloonAlignment = {}));
            let BalloonPosition;
            (function (BalloonPosition) {
                BalloonPosition["Top"] = "top";
                BalloonPosition["Left"] = "left";
                BalloonPosition["Bottom"] = "bottom";
                BalloonPosition["Right"] = "right";
                BalloonPosition["Auto"] = "auto";
                BalloonPosition["HorizontalAuto"] = "x";
                BalloonPosition["VerticalAuto"] = "y";
            })(BalloonPosition = UI.BalloonPosition || (UI.BalloonPosition = {}));
            let BalloonSizing;
            (function (BalloonSizing) {
                BalloonSizing["Auto"] = "auto";
                BalloonSizing["Match"] = "match";
            })(BalloonSizing = UI.BalloonSizing || (UI.BalloonSizing = {}));
            UI.BalloonPopupEventName = 'popup';
            UI.BalloonPopoutEventName = 'popout';
            const balloonConsts = {
                defaults: {
                    'trigger': BalloonTrigger.Hover,
                    'position': BalloonPosition.Auto,
                    'size': BalloonSizing.Auto,
                    'behavior': BalloonBehavior.Menu,
                    'verticalOffset': 0,
                    'horizontalOffset': 0,
                    'hoverDelay': 250,
                    'hoverTimeout': 500,
                    'align': BalloonAlignment.Center,
                    'track': true
                }
            };
            const allStyles = Pacem.PCSS + '-balloon balloon-right balloon-left balloon-bottom balloon-top balloon-start balloon-center balloon-end balloon-out balloon-in balloon-on';
            let PacemBalloonElement = class PacemBalloonElement extends Components.PacemElement {
                constructor() {
                    super();
                    this._options = balloonConsts.defaults;
                    this._originalNeighborhood = null;
                    this._popupDelegate = (_) => {
                        this.popup();
                    };
                    this._popoutDelegate = (_) => {
                        this.popout();
                    };
                    this._hoverDelegate = (evt) => {
                        //console.log(`${evt.type}: ${evt.target} (enabled: ${(!this.disabled)})`);
                        window.clearTimeout(this._timer);
                        if (!this.disabled)
                            this._timer = window.setTimeout(this._popupDelegate, this._options.hoverDelay);
                    };
                    this._outConditionalDelegate = (evt) => {
                        if ((evt.srcElement || evt.target) != this)
                            this._outDelegate(evt);
                    };
                    this._mousedownConditionalDelegate = (evt) => {
                        Pacem.preventDefaultHandler(evt);
                        if (this._visible)
                            Pacem.stopPropagationHandler(evt);
                    };
                    this._outDelegate = (evt) => {
                        window.clearTimeout(this._timer);
                        this._timer = window.setTimeout(() => this.popout(), this._options.hoverTimeout);
                    };
                    this._toggleDelegate = (evt) => {
                        evt.preventDefault();
                        if (this._visible)
                            this._outDelegate(evt);
                        else
                            this._hoverDelegate(evt);
                    };
                }
                /** Gets whether the balloon is open and visible. */
                get visible() {
                    return this._visible;
                }
                // #region LIFECYCLE
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'target') {
                        if (old instanceof Element) {
                            this._removeHandlers(old);
                        }
                        if (!(val instanceof Element)) {
                            this._adjust();
                        }
                    }
                    else if (name === 'options') {
                        if (this.target instanceof Element) {
                            this._removeHandlers(this.target);
                        }
                        this._options = Pacem.Utils.extend({}, Pacem.Utils.clone(balloonConsts.defaults), val);
                        this._synchronizeOptions();
                    }
                    else if (name === 'disabled') {
                        //this.container.style.visibility = val ? 'hidden' : 'visible';
                    }
                    if (this.target instanceof Element && name !== 'disabled') {
                        this._setHandlers(this.target);
                    }
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this._ensurePopup();
                    this.target = this.target || this.parentElement;
                    this._synchronizeOptions();
                }
                disconnectedCallback() {
                    super.disconnectedCallback();
                    this._destroyPopup();
                    if (this.target instanceof Element) {
                        this._removeHandlers(this.target);
                    }
                }
                // #endregion
                //#region METHODS
                _synchronizeOptions() {
                    const popup = this, options = popup.options || {};
                    // moveToRoot
                    if (!!options.moveToRoot && Pacem.Utils.isNull(this._originalNeighborhood)) {
                        this._originalNeighborhood = { parent: popup.parentElement, nextSibling: popup.nextElementSibling };
                        document.body.appendChild(popup);
                    }
                    else if (!options.moveToRoot && !Pacem.Utils.isNull(this._originalNeighborhood)) {
                        const parent = this._originalNeighborhood.parent;
                        // has something changed inn the neighborhood?...
                        if (!Pacem.Utils.isNull(parent)) {
                            parent.appendChild(popup);
                        }
                        this._originalNeighborhood = null;
                    }
                }
                _ensurePopup() {
                    const popup = this, container = popup.container;
                    //
                    if (popup && container && !Pacem.Utils.hasClass(popup, Pacem.PCSS + '-balloon')) {
                        Pacem.Utils.addClass(popup, Pacem.PCSS + '-balloon');
                        popup.style.position = 'absolute';
                        container.style.position = 'relative';
                        container.style.zIndex = '1';
                        popup.style.visibility = 'hidden';
                    }
                    return popup;
                }
                _destroyPopup() {
                    var popup = this, container = popup.container;
                    Pacem.Utils.removeClass(popup, allStyles);
                    popup.style.position = '';
                    if (!Pacem.Utils.isNull(container)) {
                        container.style.position = '';
                        container.style.zIndex = '';
                    }
                }
                _registerEvents() {
                    const popup = this._ensurePopup(), options = this._options;
                    switch (options.behavior) {
                        case BalloonBehavior.Menu:
                            switch (options.trigger) {
                                case BalloonTrigger.Focus:
                                    popup.addEventListener('mousedown', Pacem.stopPropagationHandler, false);
                                    popup.addEventListener('focus', this._hoverDelegate, false);
                                    // do nothing else: only the blur event will pop the balloon out
                                    break;
                                case BalloonTrigger.Click:
                                case BalloonTrigger.ContextMenu:
                                    popup.addEventListener('mousedown', Pacem.stopPropagationHandler, false);
                                    window.document.body.addEventListener('mousedown', this._outConditionalDelegate, false);
                                    break;
                                default:
                                    popup.addEventListener('mouseenter', this._hoverDelegate, false);
                                    popup.addEventListener('mouseleave', this._outDelegate, false);
                                    break;
                            }
                            break;
                        case BalloonBehavior.Tooltip:
                            switch (options.trigger) {
                                case BalloonTrigger.Focus:
                                case BalloonTrigger.Click:
                                case BalloonTrigger.ContextMenu:
                                    window.document.body.addEventListener('mousedown', this._outConditionalDelegate, false);
                                    break;
                                default:
                                    break;
                            }
                            break;
                    }
                }
                _unregisterEvents() {
                    var popup = this._ensurePopup();
                    var opts = this._options;
                    switch (opts.behavior) {
                        case BalloonBehavior.Menu:
                            switch (opts.trigger) {
                                case BalloonTrigger.Focus:
                                    popup.removeEventListener('mousedown', Pacem.stopPropagationHandler, false);
                                    popup.removeEventListener('focus', this._hoverDelegate, false);
                                    // do nothing else: only the blur event will pop the balloon out
                                    break;
                                case BalloonTrigger.Click:
                                case BalloonTrigger.ContextMenu:
                                    popup.removeEventListener('mousedown', Pacem.stopPropagationHandler, false);
                                    window.document.body.removeEventListener('mousedown', this._outConditionalDelegate, false);
                                    break;
                                default:
                                    popup.removeEventListener('mouseenter', this._hoverDelegate, false);
                                    popup.removeEventListener('mouseleave', this._outDelegate, false);
                                    break;
                            }
                            break;
                        case BalloonBehavior.Tooltip:
                            switch (opts.trigger) {
                                case BalloonTrigger.Click:
                                case BalloonTrigger.ContextMenu:
                                    window.document.body.removeEventListener('mousedown', this._outConditionalDelegate, false);
                                    break;
                            }
                            break;
                    }
                }
                _onLayoutChange(evt) {
                    if (this._visible) {
                        this._adjust();
                    }
                }
                _adjust() {
                    const popup = this, el = popup.target;
                    if (Pacem.Utils.isNull(el)) {
                        return;
                    }
                    const coords = el instanceof Element ? Pacem.Utils.offset(el) : { top: el.y, left: el.x, width: 0, height: 0 };
                    const vieportSize = Pacem.Utils.windowSize;
                    var opts = this._options;
                    var chosenPosition = opts.position, chosenAlignment = opts.align;
                    if (chosenPosition != BalloonPosition.Top &&
                        chosenPosition != BalloonPosition.Bottom && chosenPosition != BalloonPosition.Left && chosenPosition != BalloonPosition.Right) {
                        let viewportHeight = vieportSize.height;
                        let viewportWidth = vieportSize.width;
                        const offsetLeft = coords.left - Pacem.Utils.scrollLeft;
                        const offsetTop = coords.top - Pacem.Utils.scrollTop;
                        const offsetBottom = viewportHeight - (offsetTop + coords.height);
                        const offsetRight = viewportWidth - (offsetLeft + coords.width);
                        switch (chosenPosition) {
                            case BalloonPosition.HorizontalAuto:
                                chosenPosition = offsetLeft > offsetRight ? BalloonPosition.Left : BalloonPosition.Right;
                                break;
                            default:
                                // (!) exclude 'left' and 'right' also when position is simply set to 'auto'
                                chosenPosition = offsetTop > offsetBottom ? BalloonPosition.Top : BalloonPosition.Bottom;
                                break;
                        }
                    }
                    if (opts.size === BalloonSizing.Match) {
                        switch (chosenPosition) {
                            case BalloonPosition.Bottom:
                            case BalloonPosition.Top:
                                popup.style.minWidth = coords.width + 'px';
                                popup.style.minHeight = '';
                                break;
                            case BalloonPosition.Left:
                            case BalloonPosition.Right:
                                popup.style.minHeight = coords.height + 'px';
                                popup.style.minWidth = '';
                                break;
                        }
                    }
                    else {
                        popup.style.minWidth = popup.style.minHeight = '';
                    }
                    const popupSize = { width: popup.offsetWidth, height: popup.offsetHeight };
                    const fullOffsetWidth = coords.width - popupSize.width, halfOffsetWidth = fullOffsetWidth * .5, fullOffsetHeight = coords.height - popupSize.height, halfOffsetHeight = fullOffsetHeight * .5;
                    switch (chosenAlignment) {
                        case BalloonAlignment.Center:
                        case BalloonAlignment.Start:
                        case BalloonAlignment.End:
                            break;
                        case BalloonAlignment.Auto:
                            chosenAlignment = BalloonAlignment.Center;
                            switch (chosenPosition) {
                                case BalloonPosition.Right:
                                case BalloonPosition.Left:
                                    const halfHeight = Pacem.Utils.scrollTop + vieportSize.height / 2;
                                    if /* completely inside the first half of the screen */ ((coords.top + coords.height) < halfHeight) {
                                        chosenAlignment = BalloonAlignment.Start;
                                    }
                                    else if /* completely beyond the half line of the screen */ (coords.top > halfHeight) {
                                        chosenAlignment = BalloonAlignment.End;
                                    }
                                    break;
                                case BalloonPosition.Top:
                                case BalloonPosition.Bottom:
                                    const halfWidth = Pacem.Utils.scrollLeft + vieportSize.width / 2;
                                    if /* completely inside the first half of the screen */ ((coords.left + coords.width) < halfWidth) {
                                        chosenAlignment = BalloonAlignment.Start;
                                    }
                                    else if /* completely beyond the half line of the screen */ (coords.left > halfWidth) {
                                        chosenAlignment = BalloonAlignment.End;
                                    }
                                    break;
                            }
                            break;
                        default:
                            chosenAlignment = balloonConsts.defaults.align;
                            break;
                    }
                    Pacem.Utils.addClass(popup, 'balloon-' + chosenPosition);
                    Pacem.Utils.addClass(popup, 'balloon-' + chosenAlignment);
                    switch (chosenPosition) {
                        case BalloonPosition.Top:
                            coords.top -= popupSize.height;
                            switch (chosenAlignment) {
                                case BalloonAlignment.Center:
                                    coords.left += halfOffsetWidth;
                                    break;
                                case BalloonAlignment.End:
                                    coords.left += fullOffsetWidth;
                                    break;
                            }
                            break;
                        case BalloonPosition.Left:
                            coords.left -= popupSize.width;
                            switch (chosenAlignment) {
                                case BalloonAlignment.Center:
                                    coords.top += halfOffsetHeight;
                                    break;
                                case BalloonAlignment.End:
                                    coords.top += fullOffsetHeight;
                                    break;
                            }
                            break;
                        case BalloonPosition.Right:
                            coords.left += coords.width;
                            switch (chosenAlignment) {
                                case BalloonAlignment.Center:
                                    coords.top += halfOffsetHeight;
                                    break;
                                case BalloonAlignment.End:
                                    coords.top += fullOffsetHeight;
                                    break;
                            }
                            break;
                        default:
                            coords.top += coords.height;
                            switch (chosenAlignment) {
                                case BalloonAlignment.Center:
                                    coords.left += halfOffsetWidth;
                                    break;
                                case BalloonAlignment.End:
                                    coords.left += fullOffsetWidth;
                                    break;
                            }
                            break;
                    }
                    coords.left = Math.min(vieportSize.width - popupSize.width, Math.max(0, coords.left));
                    //coords.top = Math.max(0, coords.top);
                    // coords for balloon positioning
                    coords.top += opts.verticalOffset;
                    coords.left += opts.horizontalOffset;
                    popup.style.top = Math.round(coords.top) + 'px';
                    popup.style.left = Math.round(coords.left) + 'px';
                    // popup.style.transform = `translateX(${Math.round(coords.left)}px) translateY(${Math.round(coords.top)}px) translateZ(0)`;
                    //popup.style.visibility = 'visible';
                }
                _adjustWatchers(visible) {
                    const options = this.options || {};
                    if (!Pacem.Utils.isNull(this._resize)) {
                        // track position and size
                        this._resize.disabled = !visible;
                        this._position.disabled = !visible || !(options.track || options.trackPosition);
                    }
                }
                /**
                 * Shows the balloon, if hidden.
                 */
                popup() {
                    const popup = this, options = popup.options || {}, isVisible = Pacem.Utils.isVisible(popup);
                    this._adjustWatchers(true);
                    if (isVisible) {
                        return;
                    }
                    // attach closured behavior to popup
                    //if (!sameTrigger) {
                    this._registerEvents(); // $popup.on('mouseenter', obj.methods.hover).on('mouseleave', obj.methods.out).data(vars.TRIGGER, obj);
                    //}
                    //
                    popup.style.pointerEvents = 'none';
                    this._visible = true;
                    popup.style.visibility = 'visible';
                    this._adjust();
                    //requestAnimationFrame(() => {
                    Pacem.Utils.addClass(popup, 'balloon-in');
                    Pacem.Utils.addAnimationEndCallback(popup, () => {
                        Pacem.Utils.addClass(popup, 'balloon-on');
                        popup.dispatchEvent(new Pacem.PropertyChangeEvent({ propertyName: 'visible', oldValue: false, currentValue: true }));
                        popup.dispatchEvent(new Event(UI.BalloonPopupEventName));
                        popup.style.pointerEvents = 'auto';
                    }, 500);
                    //});
                }
                /**
                 * Hides the balloon, if visible.
                 */
                popout() {
                    var popup = this;
                    const isVisible = Pacem.Utils.isVisible(popup);
                    this._adjustWatchers(false);
                    if (!isVisible) {
                        return;
                    }
                    // detach closured behavior from popup
                    this._unregisterEvents();
                    //
                    popup.style.pointerEvents = 'none';
                    Pacem.Utils.removeClass(popup, 'balloon-in balloon-on');
                    Pacem.Utils.addClass(popup, 'balloon-out');
                    Pacem.Utils.addAnimationEndCallback(popup, () => {
                        popup.style.visibility = 'hidden';
                        this._visible = false;
                        Pacem.Utils.removeClass(popup, allStyles);
                        popup.dispatchEvent(new Event(UI.BalloonPopoutEventName));
                        popup.dispatchEvent(new Pacem.PropertyChangeEvent({ propertyName: 'visible', oldValue: true, currentValue: false }));
                    }, 500);
                }
                /**
                 * Shows the balloon, if hidden. Otherwise hides it.
                 */
                toggle() {
                    if (!Pacem.Utils.isVisible(this)) {
                        this.popup();
                    }
                    else {
                        this.popout();
                    }
                }
                _removeHandlers(el) {
                    if (Pacem.Utils.isNull(el))
                        return;
                    el.removeEventListener('mouseenter', this._hoverDelegate, false);
                    el.removeEventListener('mouseleave', this._outDelegate, false);
                    el.removeEventListener('mousedown', this._popoutDelegate, false);
                    el.removeEventListener('mousedown', this._mousedownConditionalDelegate, false);
                    el.removeEventListener('click', this._toggleDelegate, false);
                    el.removeEventListener('focus', this._hoverDelegate, false);
                    el.removeEventListener('blur', this._outDelegate, false);
                    el.removeEventListener('contextmenu', this._toggleDelegate, false);
                }
                _setHandlers(el) {
                    this.popout();
                    // regenerate opts popup
                    var opts = this._options;
                    if (opts.behavior == BalloonBehavior.Inert)
                        return;
                    switch (opts.trigger) {
                        case BalloonTrigger.Hover:
                            el.addEventListener('mouseenter', this._hoverDelegate, false);
                            el.addEventListener('mouseleave', this._outDelegate, false);
                            el.addEventListener('mousedown', this._popoutDelegate, false);
                            break;
                        case BalloonTrigger.Focus:
                            el.addEventListener('focus', this._hoverDelegate, false);
                            el.addEventListener('blur', this._outDelegate, false);
                            break;
                        case BalloonTrigger.Click:
                            opts.hoverDelay = opts.hoverTimeout = 0;
                            el.addEventListener('mousedown', this._mousedownConditionalDelegate, false);
                            el.addEventListener('click', this._toggleDelegate, false) /*.blur(obj.methods.out)*/;
                            break;
                        case BalloonTrigger.ContextMenu:
                            opts.hoverDelay = opts.hoverTimeout = 0;
                            el.addEventListener('contextmenu', this._toggleDelegate, false);
                            break;
                    }
                }
            };
            __decorate([
                Pacem.ViewChild(`.${Pacem.PCSS}-balloon`)
            ], PacemBalloonElement.prototype, "container", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-resize[content]')
            ], PacemBalloonElement.prototype, "_resize", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-resize[watch-position=true]')
            ], PacemBalloonElement.prototype, "_position", void 0);
            __decorate([
                Pacem.Watch({ converter: UI.ElementOrPointPropertyConverter })
            ], PacemBalloonElement.prototype, "target", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Json })
            ], PacemBalloonElement.prototype, "options", void 0);
            PacemBalloonElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-balloon',
                    shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-resize target="{{ :host.target }}" disabled="true" watch-position="true" on-${Components.ResizeEventName}=":host._onLayoutChange($event)"></${Pacem.P}-resize>
<div class="${Pacem.PCSS}-balloon"><${Pacem.P}-resize on-${Components.ResizeEventName}=":host._onLayoutChange($event)" disabled="true" content><${Pacem.P}-content></${Pacem.P}-content></${Pacem.P}-resize></div>
<div class="corner top-left"></div><div class="corner bottom-left"></div><div class="corner top-right"></div><div class="corner bottom-right"></div>`
                })
            ], PacemBalloonElement);
            UI.PacemBalloonElement = PacemBalloonElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let BinderAnchor;
            (function (BinderAnchor) {
                BinderAnchor["Auto"] = "auto";
                BinderAnchor["Left"] = "left";
                BinderAnchor["Top"] = "top";
                BinderAnchor["Right"] = "right";
                BinderAnchor["Bottom"] = "bottom";
                BinderAnchor["Center"] = "center";
            })(BinderAnchor = UI.BinderAnchor || (UI.BinderAnchor = {}));
            const UI_BINDERS = 'pacem:components:ui:binders';
            class BindersCollector {
                constructor(element) {
                    this.binders = [];
                    this.fire = (evt) => {
                        for (var binder of this.binders) {
                            binder.refresh(this.resize.target, evt.detail);
                        }
                    };
                    const watcher = this.resize = new Components.PacemResizeElement();
                    watcher.target = element;
                    watcher.watchPosition = true;
                    document.body.appendChild(watcher);
                }
                dispose() {
                    this.resize.remove();
                }
            }
            class BinderUtils {
                static register(element, binder) {
                    var collector = Pacem.CustomElementUtils.getAttachedPropertyValue(element, UI_BINDERS);
                    if (Pacem.Utils.isNull(collector)) {
                        collector = new BindersCollector(element);
                        Pacem.CustomElementUtils.setAttachedPropertyValue(element, UI_BINDERS, collector);
                    }
                    if (collector.binders.indexOf(binder) == -1) {
                        if (collector.binders.length === 0) {
                            collector.resize.addEventListener(Pacem.Components.ResizeEventName, collector.fire, false);
                        } //else {
                        binder.refresh(element, collector.resize.currentSize);
                        //}
                        collector.binders.push(binder);
                    }
                }
                static unregister(element, binder) {
                    var collector = Pacem.CustomElementUtils.getAttachedPropertyValue(element, UI_BINDERS), ndx;
                    if (!Pacem.Utils.isNull(collector) && (ndx = collector.binders.indexOf(binder)) > -1) {
                        collector.binders.splice(ndx, 1);
                        if (collector.binders.length === 0) {
                            collector.resize.removeEventListener(Pacem.Components.ResizeEventName, collector.fire, false);
                            collector.dispose();
                            Pacem.CustomElementUtils.deleteAttachedPropertyValue(element, UI_BINDERS);
                        }
                    }
                }
            }
            let PacemBinderElement = class PacemBinderElement extends Components.PacemElement {
                constructor() {
                    super(...arguments);
                    this._state = {};
                }
                connectedCallback() {
                    super.connectedCallback();
                    this._ensurePath();
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    if (this.from instanceof Element)
                        BinderUtils.register(this.from, this);
                    if (this.to instanceof Element)
                        BinderUtils.register(this.to, this);
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'from':
                        case 'to':
                            if (old instanceof Element)
                                BinderUtils.unregister(old, this);
                            if (val instanceof Element) {
                                // `BinderUtils.register` eventually calls `.refresh`
                                BinderUtils.register(val, this);
                            }
                            else
                                this.refresh(val);
                            break;
                        case 'fromAnchor':
                            this.refresh(this.from);
                            break;
                        case 'toAnchor':
                            this.refresh(this.to);
                            break;
                        case 'cssClass':
                            if (!Pacem.Utils.isNull(this._svg)) {
                                this._svg.setAttribute('class', Pacem.PCSS + '-binder ' + this.className);
                            }
                            break;
                        case 'hide':
                            if (!first) {
                                this._setPathVisibility();
                            }
                            break;
                    }
                }
                disconnectedCallback() {
                    if (!Pacem.Utils.isNull(this._path)) {
                        this._svg.remove();
                        this._path = undefined;
                    }
                    if (this.from instanceof Element)
                        BinderUtils.unregister(this.from, this);
                    if (this.to instanceof Element)
                        BinderUtils.unregister(this.to, this);
                    super.disconnectedCallback();
                }
                _setPathVisibility(path = this._path, hide = this.hide) {
                    if (!Pacem.Utils.isNull(path)) {
                        if (hide) {
                            path.setAttribute('display', 'none');
                        }
                        else {
                            path.removeAttribute('display');
                        }
                    }
                }
                _ensurePath() {
                    if (Pacem.Utils.isNull(this._path)) {
                        let svg = this._svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        svg.style.position = 'absolute';
                        Pacem.Utils.addClass(svg, Pacem.PCSS + '-binder ' + this.className);
                        svg.style.top = '0';
                        svg.style.left = '0';
                        svg.style.overflow = 'hidden';
                        svg.style.pointerEvents = 'none';
                        const path = this._path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        path.setAttribute('fill', 'none');
                        path.setAttribute('display', 'none');
                        this._setPathVisibility();
                        svg.appendChild(path);
                        document.body.appendChild(svg);
                    }
                }
                _computeAnchorPoints(target, anchor, ref, refAnchor) {
                    var p1, p2, c1, c2;
                    const top = target.top, left = target.left, w = target.width, h = target.height, w2 = w / 2, h2 = h / 2;
                    const r_top = ref.top, r_left = ref.left, r_w = ref.width, r_h = ref.height, r_w2 = r_w / 2, r_h2 = r_h / 2;
                    const p1_center = { x: left + w2, y: top + h2 };
                    const p2_center = { x: r_left + r_w2, y: r_top + r_h2 };
                    const p1_top = { x: left + w2, y: top };
                    const p1_bottom = { x: left + w2, y: top + h };
                    const p1_left = { x: left, y: top + h2 };
                    const p1_right = { x: left + w, y: top + h2 };
                    const p2_top = { x: r_left + r_w2, y: r_top };
                    const p2_bottom = { x: r_left + r_w2, y: r_top + r_h };
                    const p2_left = { x: r_left, y: r_top + r_h2 };
                    const p2_right = { x: r_left + r_w, y: r_top + r_h2 };
                    const points = {
                        'p1_top': p1_top,
                        'p1_bottom': p1_bottom,
                        'p1_left': p1_left,
                        'p1_right': p1_right,
                        'p2_top': p2_top,
                        'p2_bottom': p2_bottom,
                        'p2_left': p2_left,
                        'p2_right': p2_right,
                    };
                    var distance_memoizer = {};
                    function getDistance(suffix1, suffix2) {
                        const key = suffix1 + '_' + suffix2;
                        return distance_memoizer[key] = distance_memoizer[key] || Pacem.Geom.distance(points['p1_' + suffix1], points['p2_' + suffix2]);
                    }
                    if (anchor == BinderAnchor.Auto || refAnchor == BinderAnchor.Auto) {
                        //if (anchor == BinderAnchor.Auto && refAnchor == BinderAnchor.Auto) {
                        // algorithm for finding the closest edges (1 atan + 4 distances)
                        // 1. compute atan of the segment joining the two centers
                        const slope = Pacem.Geom.slopeDeg({ x: p1_center.x, y: -p1_center.y }, { x: p2_center.x, y: -p2_center.y });
                        switch (slope) {
                            case 0:
                                if (anchor == BinderAnchor.Auto)
                                    anchor = BinderAnchor.Right;
                                if (refAnchor == BinderAnchor.Auto)
                                    refAnchor = BinderAnchor.Left;
                                break;
                            case 90:
                                if (anchor == BinderAnchor.Auto)
                                    anchor = BinderAnchor.Top;
                                if (refAnchor == BinderAnchor.Auto)
                                    refAnchor = BinderAnchor.Bottom;
                                break;
                            case 180:
                                if (anchor == BinderAnchor.Auto)
                                    anchor = BinderAnchor.Left;
                                if (refAnchor == BinderAnchor.Auto)
                                    refAnchor = BinderAnchor.Right;
                                break;
                            case -90:
                                if (anchor == BinderAnchor.Auto)
                                    anchor = BinderAnchor.Bottom;
                                if (refAnchor == BinderAnchor.Auto)
                                    refAnchor = BinderAnchor.Top;
                                break;
                            default:
                                // 2. compute distances combining the 4 points (compare 4 distances)
                                if (slope < 90 && slope > 0) {
                                    // right | top vs left | bottom
                                    let top_2_left = getDistance('top', 'left'), right_2_left = getDistance('right', 'left'), right_2_bottom = getDistance('right', 'bottom'), top_2_bottom = getDistance('top', 'bottom');
                                    var d = Math.min(top_2_left, right_2_left, right_2_bottom, top_2_bottom);
                                    switch (d) {
                                        case top_2_left:
                                            if (anchor == BinderAnchor.Auto)
                                                anchor = BinderAnchor.Top;
                                            if (refAnchor == BinderAnchor.Auto)
                                                refAnchor = BinderAnchor.Left;
                                            break;
                                        case top_2_bottom:
                                            if (anchor == BinderAnchor.Auto)
                                                anchor = BinderAnchor.Top;
                                            if (refAnchor == BinderAnchor.Auto)
                                                refAnchor = BinderAnchor.Bottom;
                                            break;
                                        case right_2_bottom:
                                            if (anchor == BinderAnchor.Auto)
                                                anchor = BinderAnchor.Right;
                                            if (refAnchor == BinderAnchor.Auto)
                                                refAnchor = BinderAnchor.Bottom;
                                            break;
                                        default:
                                            if (anchor == BinderAnchor.Auto)
                                                anchor = BinderAnchor.Right;
                                            if (refAnchor == BinderAnchor.Auto)
                                                refAnchor = BinderAnchor.Left;
                                            break;
                                    }
                                }
                                else if (slope < 180 && slope > 90) {
                                    // left | top vs right | bottom
                                    let top_2_right = getDistance('top', 'right'), left_2_right = getDistance('left', 'right'), left_2_bottom = getDistance('left', 'bottom'), top_2_bottom = getDistance('top', 'bottom');
                                    var d = Math.min(top_2_right, left_2_right, left_2_bottom, top_2_bottom);
                                    switch (d) {
                                        case top_2_right:
                                            if (anchor == BinderAnchor.Auto)
                                                anchor = BinderAnchor.Top;
                                            if (refAnchor == BinderAnchor.Auto)
                                                refAnchor = BinderAnchor.Right;
                                            break;
                                        case left_2_right:
                                            if (anchor == BinderAnchor.Auto)
                                                anchor = BinderAnchor.Left;
                                            if (refAnchor == BinderAnchor.Auto)
                                                refAnchor = BinderAnchor.Right;
                                            break;
                                        case left_2_bottom:
                                            if (anchor == BinderAnchor.Auto)
                                                anchor = BinderAnchor.Left;
                                            if (refAnchor == BinderAnchor.Auto)
                                                refAnchor = BinderAnchor.Bottom;
                                            break;
                                        default:
                                            if (anchor == BinderAnchor.Auto)
                                                anchor = BinderAnchor.Top;
                                            if (refAnchor == BinderAnchor.Auto)
                                                refAnchor = BinderAnchor.Bottom;
                                            break;
                                    }
                                }
                                else if (slope < -90) {
                                    // left | bottom vs right | top
                                    let bottom_2_right = getDistance('bottom', 'right'), left_2_right = getDistance('left', 'right'), left_2_top = getDistance('left', 'top'), bottom_2_top = getDistance('bottom', 'top');
                                    var d = Math.min(bottom_2_right, left_2_right, left_2_top, bottom_2_top);
                                    switch (d) {
                                        case bottom_2_right:
                                            if (anchor == BinderAnchor.Auto)
                                                anchor = BinderAnchor.Bottom;
                                            if (refAnchor == BinderAnchor.Auto)
                                                refAnchor = BinderAnchor.Right;
                                            break;
                                        case left_2_right:
                                            if (anchor == BinderAnchor.Auto)
                                                anchor = BinderAnchor.Left;
                                            if (refAnchor == BinderAnchor.Auto)
                                                refAnchor = BinderAnchor.Right;
                                            break;
                                        case left_2_top:
                                            if (anchor == BinderAnchor.Auto)
                                                anchor = BinderAnchor.Left;
                                            if (refAnchor == BinderAnchor.Auto)
                                                refAnchor = BinderAnchor.Top;
                                            break;
                                        default:
                                            if (anchor == BinderAnchor.Auto)
                                                anchor = BinderAnchor.Bottom;
                                            if (refAnchor == BinderAnchor.Auto)
                                                refAnchor = BinderAnchor.Top;
                                            break;
                                    }
                                }
                                else {
                                    // right | bottom vs left | top
                                    let bottom_2_left = getDistance('bottom', 'left'), right_2_left = getDistance('right', 'left'), right_2_top = getDistance('right', 'top'), bottom_2_top = getDistance('bottom', 'top');
                                    var d = Math.min(bottom_2_left, right_2_left, right_2_top, bottom_2_top);
                                    switch (d) {
                                        case bottom_2_left:
                                            if (anchor == BinderAnchor.Auto)
                                                anchor = BinderAnchor.Bottom;
                                            if (refAnchor == BinderAnchor.Auto)
                                                refAnchor = BinderAnchor.Left;
                                            break;
                                        case right_2_left:
                                            if (anchor == BinderAnchor.Auto)
                                                anchor = BinderAnchor.Right;
                                            if (refAnchor == BinderAnchor.Auto)
                                                refAnchor = BinderAnchor.Left;
                                            break;
                                        case right_2_top:
                                            if (anchor == BinderAnchor.Auto)
                                                anchor = BinderAnchor.Right;
                                            if (refAnchor == BinderAnchor.Auto)
                                                refAnchor = BinderAnchor.Top;
                                            break;
                                        default:
                                            if (anchor == BinderAnchor.Auto)
                                                anchor = BinderAnchor.Bottom;
                                            if (refAnchor == BinderAnchor.Auto)
                                                refAnchor = BinderAnchor.Top;
                                            break;
                                    }
                                }
                                break;
                        }
                        //}
                    }
                    const f = 1.0;
                    switch (anchor) {
                        case BinderAnchor.Bottom:
                            p1 = p1_bottom;
                            c1 = { x: p1.x, y: p1.y + Math.abs(f * (p1_bottom.y - p1_center.y)) };
                            break;
                        case BinderAnchor.Center:
                            p1 = { x: left + w2, y: top + h2 };
                            c1 = p1;
                            break;
                        case BinderAnchor.Left:
                            p1 = p1_left;
                            c1 = { x: p1.x - Math.abs(f * (p1_center.x - p1_left.x)), y: p1.y };
                            break;
                        case BinderAnchor.Right:
                            p1 = p1_right;
                            c1 = { x: p1.x + Math.abs(f * (p1_right.x - p1_center.x)), y: p1.y };
                            break;
                        case BinderAnchor.Top:
                            p1 = p1_top;
                            c1 = { x: p1.x, y: p1.y - Math.abs(f * (p1_top.y - p1_center.y)) };
                            break;
                    }
                    switch (refAnchor) {
                        case BinderAnchor.Bottom:
                            p2 = p2_bottom;
                            c2 = { x: p2.x, y: p2.y + Math.abs(f * (p2_bottom.y - p2_center.y)) };
                            break;
                        case BinderAnchor.Center:
                            p2 = { x: r_left + r_w2, y: r_top + r_h2 };
                            c2 = p2;
                            break;
                        case BinderAnchor.Left:
                            p2 = p2_left;
                            c2 = { x: p2.x - Math.abs(f * (p2_center.x - p2_left.x)), y: p2.y };
                            break;
                        case BinderAnchor.Right:
                            p2 = p2_right;
                            c2 = { x: p2.x + Math.abs(f * (p2_right.x - p2_center.x)), y: p2.y };
                            break;
                        case BinderAnchor.Top:
                            p2 = p2_top;
                            c2 = { x: p2.x, y: p2.y - Math.abs(f * (p2_top.y - p2_center.y)) };
                            break;
                    }
                    return [p1, c1, p2, c2];
                }
                refresh(element, args) {
                    var path;
                    if (Pacem.Utils.isNull(element) || Pacem.Utils.isNull(path = this._path))
                        return;
                    const draw = !Pacem.Utils.isNull(this.from) && !Pacem.Utils.isNull(this.to);
                    const leave = Pacem.Utils.isNull(this.from) && Pacem.Utils.isNull(this.to);
                    if (this.disabled || !draw) {
                        path.removeAttribute('d');
                        if (leave)
                            return;
                    }
                    // compute anchor points
                    const key = element === this.from ? 'from' : 'to';
                    var anchor = (key === 'from' ? this.fromAnchor : this.toAnchor) || BinderAnchor.Auto;
                    if (Pacem.Utils.isNull(args)) {
                        if (!(element instanceof Element)) {
                            args = { height: 0, width: 0, left: element.x, top: element.y };
                            anchor = BinderAnchor.Center;
                        }
                        else if (key in this._state)
                            args = this._state[key].size;
                    }
                    if (Pacem.Utils.isNull(args))
                        return;
                    this._state[key] = { size: args, anchor: anchor };
                    if (draw)
                        this._draw();
                }
                //@Debounce()
                _draw() {
                    var state1 = this._state['from'], state2 = this._state['to'], svg = this._svg, path = this._path;
                    if (Pacem.Utils.isNull(path)) {
                        return;
                    }
                    if (Pacem.Utils.isNullOrEmpty(state1)
                        || Pacem.Utils.isNullOrEmpty(state2)
                        || (this.from instanceof HTMLElement && !Pacem.Utils.isVisible(this.from))
                        || (this.to instanceof HTMLElement && !Pacem.Utils.isVisible(this.to))) {
                        path.setAttribute('d', '');
                        return;
                    }
                    const points = this._computeAnchorPoints(state1.size, state1.anchor, state2.size, state2.anchor), p0 = points[0], c0 = points[1], p1 = points[2], c1 = points[3];
                    const x0 = p0.x;
                    const y0 = p0.y;
                    const cx0 = c0.x;
                    const cy0 = c0.y;
                    const x1 = p1.x;
                    const y1 = p1.y;
                    const cx1 = c1.x;
                    const cy1 = c1.y;
                    const dStart = `M${x0 - 2},${y0 - 2} h4 v4 h-4 z`;
                    const dEnd = `M${x1 - 2},${y1 - 2} h4 v4 h-4 z`;
                    path.setAttribute('d', dStart + `M${x0},${y0} C${cx0},${cy0} ${cx1},${cy1} ${x1},${y1}` + dEnd);
                    if (!Pacem.Utils.isNullOrEmpty(this.color))
                        path.style.stroke = this.color;
                    svg.setAttribute('width', document.body.scrollWidth.toString());
                    svg.setAttribute('height', document.body.scrollHeight.toString());
                }
            };
            __decorate([
                Pacem.Watch({ emit: false, converter: UI.ElementOrPointPropertyConverter })
            ], PacemBinderElement.prototype, "from", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: UI.ElementOrPointPropertyConverter })
            ], PacemBinderElement.prototype, "to", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemBinderElement.prototype, "fromAnchor", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemBinderElement.prototype, "toAnchor", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemBinderElement.prototype, "color", void 0);
            PacemBinderElement = __decorate([
                Pacem.CustomElement({ tagName: Pacem.P + '-binder' })
            ], PacemBinderElement);
            UI.PacemBinderElement = PacemBinderElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let PacemButtonElement = class PacemButtonElement extends Components.PacemIterableElement {
                constructor() {
                    super('button');
                }
                connectedCallback() {
                    super.connectedCallback();
                    if (!this.hasAttribute('tab-order')) {
                        this.tabOrder = 0;
                    }
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'iconGlyph':
                        // suppose ligatures enabled
                        case 'iconUrl':
                            // handle this via css attr(), considering that it's the proper way to access and modify pseudo::before content
                            this.dataset[name] = val;
                            break;
                    }
                }
                emit(evt) {
                    let fn = (ev) => {
                        super.emit(ev);
                        if (!ev.defaultPrevented) {
                            if (ev.type === 'click' && !Pacem.Utils.isNullOrEmpty(this.commandName)) {
                                this.dispatchEvent(new Pacem.CommandEvent({ commandName: this.commandName, commandArgument: this.commandArgument }));
                            }
                            else {
                                switch (ev.type) {
                                    case 'mousedown':
                                        if (evt.button === 0) {
                                            Pacem.Utils.addClass(this, Pacem.PCSS + '-active');
                                        }
                                        break;
                                    case 'keydown':
                                        if (ev.keyCode === 32 || ev.keyCode === 13) {
                                            evt.preventDefault();
                                            Pacem.Utils.addClass(this, Pacem.PCSS + '-active');
                                        }
                                        break;
                                    case 'blur':
                                    case 'mouseup':
                                        Pacem.Utils.removeClass(this, Pacem.PCSS + '-active');
                                        break;
                                    case 'keyup':
                                        if (ev.keyCode === 32 || ev.keyCode === 13) {
                                            this.click();
                                            Pacem.Utils.removeClass(this, Pacem.PCSS + '-active');
                                        }
                                        break;
                                }
                            }
                        }
                    };
                    if (!this.disabled && evt.type === 'click' && !Pacem.Utils.isNull(this.confirmationDialog)) {
                        this.confirmationDialog.open(this.confirmationMessage).then(r => {
                            if (r.button === UI.DialogButton.Yes || r.button === UI.DialogButton.Ok)
                                fn(evt);
                        });
                    }
                    else if (!(evt instanceof MouseEvent) || evt.button === 0) {
                        fn(evt);
                    }
                }
            };
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemButtonElement.prototype, "iconGlyph", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemButtonElement.prototype, "iconUrl", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemButtonElement.prototype, "commandName", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemButtonElement.prototype, "commandArgument", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemButtonElement.prototype, "confirmationMessage", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Element })
            ], PacemButtonElement.prototype, "confirmationDialog", void 0);
            PacemButtonElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-button'
                })
            ], PacemButtonElement);
            UI.PacemButtonElement = PacemButtonElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let PacemButtonsetElement = class PacemButtonsetElement extends Components.PacemIterativeElement {
                connectedCallback() {
                    super.connectedCallback();
                    if (!('tabindex' in this.attributes))
                        this.tabIndex = 0;
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'index':
                            let ndx = 0;
                            for (var btn of this.items) {
                                if (ndx == val) {
                                    btn.focus();
                                    break;
                                }
                                ndx++;
                            }
                            break;
                    }
                }
                validate(item) {
                    return item instanceof UI.PacemButtonElement;
                }
            };
            PacemButtonsetElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-buttonset'
                })
            ], PacemButtonsetElement);
            UI.PacemButtonsetElement = PacemButtonsetElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let CalendarZoom;
            (function (CalendarZoom) {
                CalendarZoom["Month"] = "month";
                CalendarZoom["Week"] = "week";
                CalendarZoom["Day"] = "day";
            })(CalendarZoom = UI.CalendarZoom || (UI.CalendarZoom = {}));
            class ViewDateChangeEvent extends Pacem.CustomTypedEvent {
                constructor(date) {
                    super('viewdatechange', date);
                }
            }
            UI.ViewDateChangeEvent = ViewDateChangeEvent;
            class DateSelectEvent extends Pacem.CustomTypedEvent {
                constructor(date) {
                    super('dateselect', date, { bubbles: true });
                }
            }
            UI.DateSelectEvent = DateSelectEvent;
            class TimeSelectEvent extends Pacem.CustomTypedEvent {
                constructor(date) {
                    super('timeselect', date, { bubbles: true });
                }
            }
            UI.TimeSelectEvent = TimeSelectEvent;
            const MSECS_PER_HOUR = 1000 * 60 * 60;
            const MSECS_PER_DAY = MSECS_PER_HOUR * 24;
            const DAY_HOURS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5,
                12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5, 20, 20.5, 21, 21.5, 22, 22.5, 23, 23.5];
            let now = new Date();
            const DUMMY_DATE = Pacem.Utils.Dates.dateOnly(now).valueOf();
            const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            let PacemCalendarEventElement = class PacemCalendarEventElement extends Components.PacemItemElement {
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    cancelAnimationFrame(this._handle);
                    this._handle = requestAnimationFrame(() => {
                        let container = this.container;
                        if (!Pacem.Utils.isNull(container)) {
                            // trigger propertychange for `items`
                            container.dispatchEvent(new Pacem.PropertyChangeEvent({ propertyName: 'items', oldValue: container.items, currentValue: container.items }));
                        }
                    });
                }
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Datetime })
            ], PacemCalendarEventElement.prototype, "start", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Datetime })
            ], PacemCalendarEventElement.prototype, "end", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemCalendarEventElement.prototype, "caption", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Json })
            ], PacemCalendarEventElement.prototype, "place", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemCalendarEventElement.prototype, "allDay", void 0);
            PacemCalendarEventElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-calendar-event'
                })
            ], PacemCalendarEventElement);
            UI.PacemCalendarEventElement = PacemCalendarEventElement;
            class CalendarEventSelectEvent extends Pacem.CustomTypedEvent {
                constructor(args) {
                    super("eventselect", args, { bubbles: false, cancelable: true });
                }
            }
            UI.CalendarEventSelectEvent = CalendarEventSelectEvent;
            class CalendarEventUnselectEvent extends Pacem.CustomTypedEvent {
                constructor(args) {
                    super("eventunselect", args, { bubbles: false, cancelable: true });
                }
            }
            UI.CalendarEventUnselectEvent = CalendarEventUnselectEvent;
            class PacemCalendarBaseElement extends Components.PacemItemsContainerElement {
                validate(item) {
                    return item instanceof PacemCalendarEventElement;
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'viewDate' || name === 'weekStart') {
                        this._synchronizeWeek();
                    }
                    switch (name) {
                        case 'viewDate':
                            this.dispatchEvent(new ViewDateChangeEvent(val));
                            Pacem.Utils.removeClass(this, "viewdate-next viewdate-previous");
                            requestAnimationFrame(() => {
                                Pacem.Utils.addClass(this, old > val ? "viewdate-previous" : "viewdate-next");
                            });
                            break;
                        case 'zoom':
                            Pacem.Utils.removeClass(this, "viewdate-next viewdate-previous");
                            break;
                    }
                }
                // #region PROTECTED
                oneventselect(el, evt) {
                    this.dispatchEvent(new CalendarEventSelectEvent({ element: el, event: evt }));
                }
                oneventunselect(el, evt) {
                    this.dispatchEvent(new CalendarEventUnselectEvent({ element: el, event: evt }));
                }
                getHeaderLabel(d, f) {
                    const options = f === CalendarZoom.Week ? { weekday: 'short', day: 'numeric', month: 'numeric' }
                        : (f === CalendarZoom.Day ? { weekday: 'long' } : /* fallback: month */ { weekday: 'short' });
                    return Pacem.Utils.parseDate(d).toLocaleString(Pacem.Utils.lang(this), options);
                }
                getDayLabel(d) {
                    const options = d.getDate() == 1 ? { month: 'short', day: 'numeric' } : { day: 'numeric' };
                    return Pacem.Utils.parseDate(d).toLocaleString(Pacem.Utils.lang(this), options);
                }
                getHourLabel(d) {
                    const options = { hour: 'numeric' /*, minute: 'numeric'*/ };
                    return Pacem.Utils.parseDate(d).toLocaleString(Pacem.Utils.lang(this), options);
                }
                getTimeLabel(d) {
                    const options = { hour: 'numeric', minute: 'numeric' };
                    return Pacem.Utils.parseDate(d).toLocaleString(Pacem.Utils.lang(this), options);
                }
                isNow(d, now) {
                    const d0 = Pacem.Utils.parseDate(d), v = Pacem.Utils.parseDate(now || new Date());
                    return d0.getHours() === v.getHours() && this.isToday(d, now);
                }
                isToday(d, now) {
                    const d0 = Pacem.Utils.parseDate(d), v = Pacem.Utils.parseDate(now || new Date());
                    return d0.getDate() === v.getDate() && d0.getMonth() == v.getMonth() && d0.getFullYear() === v.getFullYear();
                }
                isViewDay(d, vd = this.viewDate) {
                    const d0 = Pacem.Utils.parseDate(d), v = Pacem.Utils.parseDate(vd || this.viewDate || new Date());
                    return d0.getDate() === v.getDate() && d0.getMonth() == v.getMonth() && d0.getFullYear() === v.getFullYear();
                }
                isViewWeek(d) {
                    const d0 = Pacem.Utils.parseDate(d);
                    return this.week && this.week.find(d1 => d1.getDate() == d0.getDate() && d1.getMonth() == d0.getMonth() && d1.getDate() == d0.getDate());
                }
                isViewMonth(d) {
                    const d0 = Pacem.Utils.parseDate(d), v = Pacem.Utils.parseDate(this.viewDate || new Date());
                    return d0.getMonth() == v.getMonth() && d0.getFullYear() === v.getFullYear();
                }
                isTimeSlotDisabled(ranges, d, h) {
                    if (!Pacem.Utils.isNullOrEmpty(ranges)) {
                        h = h || 0;
                        const slot = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(h), 60 * (h % 1)).valueOf();
                        for (let range of ranges) {
                            let from = Pacem.Utils.Dates.parse(range.from), to = Pacem.Utils.Dates.parse(range.to);
                            if ((!from || (from && from.valueOf() <= slot))
                                && (!to || (to && to.valueOf() > slot))
                                && (to || from)) {
                                return true;
                            }
                        }
                    }
                    return false;
                }
                // #endregion
                // #region PRIVATE
                _getWeekStart(day, weekstart) {
                    let dow = day.getDay(), v = day.valueOf();
                    const tget = (weekstart || 'm').toLowerCase().startsWith('m') ? 1 : 0;
                    if (dow === tget) {
                        return v;
                    }
                    if (dow === 0) {
                        // damn 0-indexed sunday, skip to the previous one
                        dow = 7;
                    }
                    return v + (tget - dow) * MSECS_PER_DAY;
                }
                _getDatasource(d, w = this.weekStart) {
                    let day = Pacem.Utils.Dates.dateOnly(Pacem.Utils.parseDate(d));
                    const ds = this.month;
                    let _d0 = ds && ds.length && ds[0] && ds[0].length && ds[0][0];
                    if (_d0 && _d0.getMonth() == day.getMonth() && _d0.getFullYear() == day.getFullYear()
                        && ds.find(wk => !Pacem.Utils.isNull(wk.find(dy => dy.valueOf() == day.valueOf())))) {
                        // return the "convenient" datasource
                        return ds;
                    }
                    //
                    // month
                    let d1 = new Date(day.getFullYear(), day.getMonth(), 1);
                    let date1 = this._getWeekStart(d1, w);
                    let month = [];
                    let week = [];
                    do {
                        let date = Pacem.Utils.Dates.dateOnly(new Date(date1));
                        week.push(date);
                        if (week.length == 7) {
                            month.push(week.splice(0));
                        }
                        date1 = date.valueOf() + MSECS_PER_DAY + /* beware of day-light-saving occurrences */ MSECS_PER_HOUR;
                    } while (month.length < 6);
                    //
                    return this.month = month;
                }
                _synchronizeWeek() {
                    const viewDate = this.viewDate;
                    const ds = this._getDatasource(viewDate, this.weekStart);
                    const week = ds.filter((w, j) => w.filter(d => d.getDate() == viewDate.getDate() && d.getMonth() == viewDate.getMonth() && d.getFullYear() == viewDate.getFullYear()).length > 0)[0];
                    if (!(this.week && this.week.length) || this.week[0] !== week[0]) {
                        this.week = week;
                    }
                }
            }
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Datetime })
            ], PacemCalendarBaseElement.prototype, "viewDate", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Datetime })
            ], PacemCalendarBaseElement.prototype, "now", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemCalendarBaseElement.prototype, "zoom", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemCalendarBaseElement.prototype, "weekStart", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Eval })
            ], PacemCalendarBaseElement.prototype, "week", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Eval })
            ], PacemCalendarBaseElement.prototype, "month", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Eval })
            ], PacemCalendarBaseElement.prototype, "disabledRanges", void 0);
            UI.PacemCalendarBaseElement = PacemCalendarBaseElement;
            class PacemCalendarWithEventsBaseElement extends PacemCalendarBaseElement {
                constructor() {
                    super(...arguments);
                    this._datasource = [];
                }
                get datasource() {
                    return this._datasource;
                }
                _getSortedItems(items) {
                    return items.slice().sort((a, b) => {
                        const a_start = a.start.valueOf(), b_start = b.start.valueOf();
                        if (a_start != b_start) {
                            return a_start < b_start ? -1 : 1;
                        }
                        const a_end = a.end.valueOf(), b_end = b.end.valueOf(), a_span = a_end - a_start, b_span = b_end - b_start;
                        if (a_span != b_span) {
                            return a_span > b_span ? -1 : 1;
                        }
                        return 0;
                    });
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'month':
                        case 'week':
                        case 'items':
                        case 'zoom':
                        case 'viewDate':
                            cancelAnimationFrame(this._handle);
                            this._handle = requestAnimationFrame(() => {
                                let oldval = this._datasource;
                                let newval = this._datasource = this.buildDataSource(this._getSortedItems(this.items || []));
                                this.dispatchEvent(new Pacem.PropertyChangeEvent({ propertyName: 'datasource', oldValue: oldval, currentValue: newval }));
                            });
                            break;
                    }
                }
            }
            UI.PacemCalendarWithEventsBaseElement = PacemCalendarWithEventsBaseElement;
            function getWeeklyEventDataItems(items, week) {
                let lbound = week.length - 1, wstart = week[0].valueOf(), wend = week[lbound].valueOf();
                return items.filter(evt => {
                    let startDate = Pacem.Utils.Dates.dateOnly(evt.start);
                    let endDate = Pacem.Utils.Dates.dateOnly(evt.end);
                    return startDate.valueOf() <= wend && endDate.valueOf() >= wstart;
                }).map(evt => {
                    let startDate = Pacem.Utils.Dates.dateOnly(evt.start), start = week.find(d => d.valueOf() == startDate.valueOf()), startIndex = week.indexOf(start);
                    let endDate = Pacem.Utils.Dates.dateOnly(evt.end), end = week.find(d => d.valueOf() == endDate.valueOf()), endIndex = week.indexOf(end);
                    let ndx0 = startIndex == -1 ? 0 : startIndex, ndx1 = endIndex == -1 ? lbound : endIndex;
                    return {
                        start: evt.start, end: evt.end,
                        allDay: true,
                        // indexes
                        day: ndx0,
                        continuing: { start: startIndex == -1, end: endIndex == -1 },
                        // span (may be column- or row-)
                        span: ndx1 + 1 - ndx0,
                        caption: evt.caption,
                        event: evt
                    };
                });
            }
            // #region AGENDA
            function buildAgendaGrid() {
                let grid = '';
                for (let day = 0; day < 7; day++) {
                    if (day == 0) {
                        grid += `<div class="agenda-left all-day"></div>`;
                    }
                    grid += `<${Pacem.P}-panel class="agenda-slot all-day day-${(day + 1)}" css-class="{{ {'viewday': :host.isViewDay(:host.week[${day}], :host.viewDate), 'today': :host.isToday(:host.week[${day}], :host.now)} }}"></${Pacem.P}-panel>`;
                }
                for (let day = 0; day < 7; day++) {
                    for (let hour of DAY_HOURS) {
                        let whole = hour % 1 == 0;
                        let css = `hour-${whole ? 'whole' : 'half'}`;
                        if (day == 0 && whole) {
                            grid += `<${Pacem.P}-text class="agenda-left ${css} hour-${hour * 2 + 1}"" text="{{ :host.getHourLabel(${DUMMY_DATE + hour * MSECS_PER_HOUR}) }}"></${Pacem.P}-text>`;
                        }
                        grid += `<${Pacem.P}-panel on-click=":host.time = Pacem.Utils.Dates.parse(:host.week[${day}].valueOf() + ${(hour * MSECS_PER_HOUR)})" disabled="{{ :host.isTimeSlotDisabled(:host.disabledRanges, :host.week[${day}], ${hour}) }}" class="agenda-slot ${css} day-${(day + 1)} hour-${hour * 2 + 1}" css-class="{{ {'viewday': :host.isViewDay(:host.week[${day}], :host.viewDate), 'today': :host.isToday(:host.week[${day}], :host.now)} }}"></${Pacem.P}-panel>`;
                    }
                }
                return grid;
            }
            let PacemAgendaElement = class PacemAgendaElement extends PacemCalendarWithEventsBaseElement {
                constructor() {
                    super(...arguments);
                    this._allDayDatasource = [];
                }
                buildDataSource(items) {
                    var week = this.week;
                    if (this.zoom === CalendarZoom.Day) {
                        week = [Pacem.Utils.Dates.dateOnly(this.viewDate)];
                    }
                    let ds = [];
                    if (!Pacem.Utils.isNull(week)) {
                        // alldays
                        this.dispatchEvent(new Pacem.PropertyChangeEvent({
                            propertyName: 'allDayDatasource',
                            oldValue: this._allDayDatasource,
                            currentValue: this._allDayDatasource = getWeeklyEventDataItems(items.filter(evt => {
                                return (evt.end.valueOf() - evt.start.valueOf()) >= MSECS_PER_DAY;
                            }), week)
                        }));
                        // hourlies
                        for (let j = 0; j < week.length; j++) {
                            let day = week[j], dayValue = day.valueOf(), 
                            // search for events in this week
                            dayItems = items.filter(evt => {
                                let startDate = Pacem.Utils.Dates.dateOnly(evt.start);
                                let endDate = Pacem.Utils.Dates.dateOnly(evt.end);
                                return startDate.valueOf() <= dayValue && endDate.valueOf() >= dayValue;
                            }).map(evt => {
                                let evtStart = evt.start.valueOf(), evtEnd = evt.end.valueOf();
                                let retval = {
                                    allDay: evt.allDay || (evtEnd - evtStart) >= MSECS_PER_DAY,
                                    continuing: { start: evtStart < dayValue, end: evtEnd > (dayValue + MSECS_PER_DAY) },
                                    caption: evt.caption,
                                    hour: 0,
                                    span: DAY_HOURS.length - 1,
                                    offset: { start: "0", end: "0" },
                                    event: evt
                                };
                                let startHour = evt.start.getHours() + evt.start.getMinutes() / 60, startIndex = retval.continuing.start ? 0 : Math.floor(startHour * 2), endHour = evt.end.getHours() + evt.end.getMinutes() / 60, endIndex = -1 + (retval.continuing.end ? DAY_HOURS.length : Math.ceil(endHour * 2));
                                let endNdx = endIndex + 1, end = endNdx >= DAY_HOURS.length ? 24 : DAY_HOURS[endNdx];
                                let fullSpan = end - DAY_HOURS[startIndex];
                                retval.hour = startIndex;
                                retval.span = 1 + endIndex - startIndex;
                                // offsets
                                if (!retval.continuing.start) {
                                    // compute correct start offset
                                    retval.offset.start = (((startHour - DAY_HOURS[startIndex]) / fullSpan) * 100) + "%";
                                }
                                if (!retval.continuing.end) {
                                    // compute correct end offset
                                    retval.offset.end = (((end - endHour) / fullSpan) * 100) + "%";
                                }
                                return retval;
                            });
                            //
                            ds.push(dayItems);
                        }
                    }
                    return ds;
                }
                get allDayDatasource() {
                    return this._allDayDatasource;
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    const clock = this._clock;
                    if (name === 'time') {
                        this.dispatchEvent(new TimeSelectEvent(val));
                    }
                    else if (!Pacem.Utils.isNull(clock)) {
                        if (name === 'now') {
                            clock.now = val;
                            clock.className = `hour-${val.getHours()} minute-${val.getMinutes()}`;
                        }
                        if (name === 'now' || name === 'zoom' || name === 'viewDate') {
                            const d = this.now, z = this.zoom;
                            const showClock = d && z && ((this.isViewDay(d) && z === CalendarZoom.Day)
                                || (this.isViewWeek(d) && z === CalendarZoom.Week));
                            clock.hidden = !showClock;
                        }
                    }
                }
            };
            __decorate([
                Pacem.ViewChild(Pacem.P + '-clock')
            ], PacemAgendaElement.prototype, "_clock", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Datetime })
            ], PacemAgendaElement.prototype, "time", void 0);
            PacemAgendaElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-agenda', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-repeater class="${Pacem.PCSS}-agenda agenda-grid" datasource="{{ :host.datasource }}">${buildAgendaGrid()}<${Pacem.P}-clock hidden></${Pacem.P}-clock>
    <template>
        <${Pacem.P}-repeater class="agenda-day" datasource="{{ ^item }}">
            <template>
                <${Pacem.P}-panel class="agenda-event-wrapper" 
css-class="{{ ['hour-start-'+ (^item.hour + 1), 'hour-end-'+ (^item.hour + ^item.span +1), 'day-start-'+ (!^item.continuing.start), 'day-end-'+ (!^item.continuing.end)] }}">
                    <${Pacem.P}-panel class="agenda-event" css="{{ {'top': ^item.offset.start, 'bottom': ^item.offset.end} }}" tab-order="{{ (^^index + 1) * 1000 + (^item.hour + 1) * 100 + ^index }}"
                        on-focus=":host.oneventselect($this, ^item.event)" on-blur=":host.oneventunselect($this, ^item.event)">
                        <${Pacem.P}-span class="event-caption" text="{{ ^item.caption }}"></${Pacem.P}-span>
                    </${Pacem.P}-panel>
                </${Pacem.P}-panel>
            </template>
        </${Pacem.P}-repeater>
    </template>
    <${Pacem.P}-repeater class="agenda-allday" datasource="{{ :host.allDayDatasource }}">
        <template>
            <${Pacem.P}-panel class="agenda-event" tab-order="{{ (^index + 1) * 500 + (^item.day + 1) * 50 + ^index }}" css-class="{{ ['day-start-'+ (^item.day + 1), 'day-end-'+ (^item.day + ^item.span + 1)] }}"
                on-focus=":host.oneventselect($this, ^item.event)" on-blur=":host.oneventunselect($this, ^item.event)">
                <${Pacem.P}-text class="event-caption" text="{{ ^item.caption }}"></${Pacem.P}-text>
            </${Pacem.P}-panel>
        </template>
    </${Pacem.P}-repeater>
</${Pacem.P}-repeater><${Pacem.P}-content></${Pacem.P}-content>`
                })
            ], PacemAgendaElement);
            UI.PacemAgendaElement = PacemAgendaElement;
            // #endregion
            // #region CALENDAR
            function buildCalendarGrid() {
                let grid = '';
                for (let week = 0; week < 6; week++) {
                    for (let day = 0; day < 7; day++) {
                        let css = `class="calendar-day week-${week + 1} day-${day + 1}"`;
                        grid += `<${Pacem.P}-panel disabled="{{ :host.isTimeSlotDisabled(:host.disabledRanges, :host.week[${day}]) }}" on-click=":host.date = :host.month[${week}][${day}]" ${css} css-class="{{ {'viewmonth': :host.isViewMonth(:host.month[${week}][${day}]), 'viewday': :host.isViewDay(:host.month[${week}][${day}], :host.viewDate), 'today': :host.isToday(:host.month[${week}][${day}], :host.now)} }}"><${Pacem.P}-span culture="{{ :host.culture }}" class="text-ellipsed" text="{{ :host.getDayLabel(:host.month[${week}][${day}]) }}"></${Pacem.P}-span></${Pacem.P}-panel>`;
                    }
                }
                return grid;
            }
            let PacemCalendarElement = class PacemCalendarElement extends PacemCalendarWithEventsBaseElement {
                buildDataSource(items) {
                    const month = this.month;
                    let ds = [];
                    if (!Pacem.Utils.isNull(month)) {
                        for (let j = 0; j < month.length; j++) {
                            let week = month[j], 
                            // search for events in this week
                            weekItems = getWeeklyEventDataItems(items, week);
                            //
                            ds.push(weekItems);
                        }
                    }
                    return ds;
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'date') {
                        this.dispatchEvent(new DateSelectEvent(val));
                    }
                }
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Datetime })
            ], PacemCalendarElement.prototype, "date", void 0);
            PacemCalendarElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-calendar', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-repeater class="${Pacem.PCSS}-calendar calendar-grid" datasource="{{ :host.datasource }}">${buildCalendarGrid()}
    <template>
        <${Pacem.P}-repeater class="calendar-week" datasource="{{ ^item }}">
            <template>
                <${Pacem.P}-panel class="calendar-event" tab-order="{{ (^^index + 1) * 1000 + (^item.day + 1) * 100 + ^index }}" 
                    on-focus=":host.oneventselect($this, ^item.event)" on-blur=":host.oneventunselect($this, ^item.event)"
                    css-class="{{ ['day-start-'+ (^item.day + 1), 'day-end-'+ (^item.day + ^item.span + 1)] }}">
                    <${Pacem.P}-span class="event-startdate" culture="{{ :host.culture }}" hide="{{ ^item.continuing.start }}" text="{{ :host.getTimeLabel(^item.event.start) }}"></${Pacem.P}-span>
                    <${Pacem.P}-span class="event-caption" text="{{ ^item.caption }}"></${Pacem.P}-span>
                </${Pacem.P}-panel>
            </template>
        </${Pacem.P}-repeater>
    </template>
</${Pacem.P}-repeater><${Pacem.P}-content></${Pacem.P}-content>`
                })
            ], PacemCalendarElement);
            UI.PacemCalendarElement = PacemCalendarElement;
            // #endregion
            // #region CLOCK (to be worked on: many possibilities ahead)
            let PacemClockElement = class PacemClockElement extends Components.PacemElement {
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Datetime })
            ], PacemClockElement.prototype, "now", void 0);
            PacemClockElement = __decorate([
                Pacem.CustomElement({ tagName: Pacem.P + '-clock' })
            ], PacemClockElement);
            UI.PacemClockElement = PacemClockElement;
            // #endregion
            // #region SCHEDULE
            function buildCalendarHeader() {
                let header = '';
                for (let day = 0; day < 7; day++) {
                    header += `<${Pacem.P}-span culture="{{ :host.culture }}" css-class="{{ {'viewday': :host.isViewDay(:host.week[${day}], :host.viewDate)} }}" class="schedule-heading day-${day + 1} text-ellipsed" text="{{ :host.getHeaderLabel(:host.week[${day}], :host.zoom) }}"></${Pacem.P}-span>`;
                }
                const id = "dock_" + Pacem.Utils.uniqueCode();
                return `<div class="schedule-header schedule-grid"><div class="heading-left"></div>${header}</div>`;
            }
            let PacemScheduleElement = class PacemScheduleElement extends PacemCalendarBaseElement {
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this._calendar.addEventListener('dateselect', this.emitHandler, false);
                    this._agenda.addEventListener('timeselect', this.emitHandler, false);
                    // bootstrap
                    this.now = new Date();
                }
                disconnectedCallback() {
                    if (this._calendar) {
                        this._calendar.removeEventListener('dateselect', this.emitHandler, false);
                        this._agenda.removeEventListener('timeselect', this.emitHandler, false);
                    }
                    super.disconnectedCallback();
                }
            };
            __decorate([
                Pacem.ViewChild(Pacem.P + '-calendar')
            ], PacemScheduleElement.prototype, "_calendar", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-agenda')
            ], PacemScheduleElement.prototype, "_agenda", void 0);
            PacemScheduleElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-schedule', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-panel class="${Pacem.PCSS}-schedule" css-class="{{ ['schedule-'+ (:host.zoom || '${CalendarZoom.Month}')] }}">
    <${Pacem.P}-timer interval="10000" on-tick=":host.now = Pacem.Utils.parseDate(Date.now())"></${Pacem.P}-timer>
    ${buildCalendarHeader()}
    <${Pacem.P}-agenda disabled-ranges="{{ :host.disabledRanges }}" on-eventselect=":host.handle($event)" on-eventunselect=":host.handle($event)" now="{{ :host.now }}" culture="{{ :host.culture }}" view-date="{{ :host.viewDate }}" zoom="{{ :host.zoom }}" week-start="{{ :host.weekStart }}" items="{{ :host.items }}"></${Pacem.P}-agenda>
    <${Pacem.P}-calendar disabled-ranges="{{ :host.disabledRanges }}" on-eventselect=":host.handle($event)" on-eventunselect=":host.handle($event)" now="{{ :host.now }}" culture="{{ :host.culture }}" view-date="{{ :host.viewDate }}" zoom="{{ :host.zoom }}" week-start="{{ :host.weekStart }}" items="{{ :host.items }}"></${Pacem.P}-calendar>
    <${Pacem.P}-content></${Pacem.P}-content>
</${Pacem.P}-panel>`
                })
            ], PacemScheduleElement);
            UI.PacemScheduleElement = PacemScheduleElement;
            // #endregion
            // #region RULES
            class PacemCalendarRuleBaseElement extends HTMLElement {
                constructor() {
                    super(...arguments);
                    this._disabledRanges = [];
                }
                viewActivatedCallback() {
                    if (!Pacem.Utils.isNull(this._target = Pacem.CustomElementUtils.findAncestor(this, node => node instanceof PacemCalendarBaseElement))) {
                        this.refreshDisabledRanges();
                    }
                    else {
                        throw `Missing ancestor calendar element for ${this.constructor.name}.`;
                    }
                }
                disconnectedCallback() {
                    this._target = undefined;
                }
                get target() {
                    return this._target;
                }
                refreshDisabledRanges() {
                    if (Pacem.Utils.isNullOrEmpty(this._target)) {
                        // TODO: throw
                        return;
                    }
                    let actualRanges = this._target.disabledRanges || [];
                    // cleanup old ones
                    for (let range of this._disabledRanges) {
                        let ndx = actualRanges.indexOf(range);
                        if (ndx >= 0) {
                            actualRanges.splice(ndx, 1);
                        }
                    }
                    // add new ones
                    this._disabledRanges = this.computeDisabledRanges() || [];
                    for (let range of this._disabledRanges) {
                        actualRanges.push(range);
                    }
                    this._target.disabledRanges = actualRanges;
                }
            }
            __decorate([
                Pacem.Debounce(true)
            ], PacemCalendarRuleBaseElement.prototype, "refreshDisabledRanges", null);
            UI.PacemCalendarRuleBaseElement = PacemCalendarRuleBaseElement;
            let PacemCalendarDayOfWeekRuleElement = class PacemCalendarDayOfWeekRuleElement extends PacemCalendarRuleBaseElement {
                constructor() {
                    super(...arguments);
                    this._daysOfWeek = [];
                    this._calendarChangeHandler = (evt) => {
                        if (evt.detail.propertyName == 'month') {
                            this.refreshDisabledRanges();
                        }
                    };
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this.target.addEventListener(Pacem.PropertyChangeEventName, this._calendarChangeHandler, false);
                }
                propertyChangedCallback(name, old, val, first) {
                    if (name === 'days') {
                        this._daysOfWeek = (val || []).map(i => DAYS_OF_WEEK.indexOf(i)).filter(i => i >= 0);
                        this.refreshDisabledRanges();
                    }
                }
                computeDisabledRanges() {
                    let retval = [];
                    for (let week of this.target.month) {
                        for (let day of week) {
                            if (this._daysOfWeek.indexOf(day.getDay()) == -1) {
                                let from = Pacem.Utils.Dates.dateOnly(day), to = Pacem.Utils.Dates.dateOnly(new Date(from.valueOf() + MSECS_PER_DAY + /* get rid of daylight saving switches */ MSECS_PER_HOUR));
                                retval.push({ from: from, to: to });
                            }
                        }
                    }
                    return retval;
                }
            };
            __decorate([
                Pacem.Watch({
                    emit: false, converter: {
                        convert: attr => (attr || '').split(',').map(i => i.trim()),
                        convertBack: prop => (prop || []).join(',')
                    }
                })
            ], PacemCalendarDayOfWeekRuleElement.prototype, "days", void 0);
            PacemCalendarDayOfWeekRuleElement = __decorate([
                Pacem.CustomElement({ tagName: Pacem.P + '-calendar-daysofweek-rule' })
            ], PacemCalendarDayOfWeekRuleElement);
            UI.PacemCalendarDayOfWeekRuleElement = PacemCalendarDayOfWeekRuleElement;
            // #endregion
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let PacemCollapseElement = class PacemCollapseElement extends Components.PacemEventTarget {
                _resize(evt) {
                    this._state = evt.detail;
                    this._toggle();
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'collapse':
                            this._toggle();
                            break;
                        case 'disabled':
                            this._resizer.disabled = val;
                            break;
                    }
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this._state = this._resizer.currentSize;
                    this._toggle();
                }
                _toggle() {
                    const div = this._container, collapse = this.collapse, state = this._state;
                    if (this.disabled || Pacem.Utils.isNull(div))
                        return;
                    //
                    div.style.height = collapse ? '0' : (state && state.height + 'px') || '';
                    if (this.horizontal) {
                        Pacem.Utils.addClass(div, Pacem.PCSS + '-horizontal');
                        div.style.width = collapse ? '0' : (state && state.width + 'px') || '';
                    }
                    else {
                        Pacem.Utils.removeClass(div, Pacem.PCSS + '-horizontal');
                    }
                }
            };
            __decorate([
                Pacem.ViewChild(`.${Pacem.PCSS}-collapse`)
            ], PacemCollapseElement.prototype, "_container", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-resize')
            ], PacemCollapseElement.prototype, "_resizer", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemCollapseElement.prototype, "collapse", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Boolean })
            ], PacemCollapseElement.prototype, "horizontal", void 0);
            PacemCollapseElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-collapse', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<div class="${Pacem.PCSS}-collapse"><${Pacem.P}-resize on-${Components.ResizeEventName}=":host._resize($event)"><${Pacem.P}-content></${Pacem.P}-content></${Pacem.P}-resize></div>`
                })
            ], PacemCollapseElement);
            UI.PacemCollapseElement = PacemCollapseElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let DialogButtons;
            (function (DialogButtons) {
                DialogButtons["YesNo"] = "yesno";
                DialogButtons["YesNoCancel"] = "yesnocancel";
                DialogButtons["Ok"] = "ok";
                DialogButtons["OkCancel"] = "okcancel";
            })(DialogButtons = UI.DialogButtons || (UI.DialogButtons = {}));
            let DialogButton;
            (function (DialogButton) {
                DialogButton["Yes"] = "yes";
                DialogButton["No"] = "no";
                DialogButton["Cancel"] = "cancel";
                DialogButton["Ok"] = "ok";
            })(DialogButton = UI.DialogButton || (UI.DialogButton = {}));
            UI.DialogResultEventName = 'commit';
            class DialogResultEvent extends Pacem.CustomTypedEvent {
                constructor(args) {
                    super(UI.DialogResultEventName, args);
                }
            }
            UI.DialogResultEvent = DialogResultEvent;
            class PacemDialogBase extends Components.PacemEventTarget {
                open(state) {
                    const lb = this.lightbox;
                    if (!Pacem.Utils.isNull(this._deferred))
                        throw `${PacemDialogElement.name} already open.`;
                    this.dispatchEvent(new Event('open'));
                    this._deferred = Pacem.DeferPromise.defer();
                    lb.show = true;
                    this.state = state;
                    return this._deferred.promise;
                }
                commit(btn, evt) {
                    Pacem.avoidHandler(evt);
                    const state = this.state;
                    var drevt = new DialogResultEvent({ button: btn, state: state });
                    this.lightbox.show = false;
                    this._deferred.resolve(drevt.detail);
                    this._deferred = null;
                    this.dispatchEvent(drevt);
                }
            }
            __decorate([
                Pacem.Watch()
            ], PacemDialogBase.prototype, "state", void 0);
            UI.PacemDialogBase = PacemDialogBase;
            let PacemDialogElement = class PacemDialogElement extends PacemDialogBase {
                constructor() {
                    super(...arguments);
                    this.buttons = DialogButtons.Ok;
                    this.okCaption = 'OK';
                    this.yesCaption = 'Yes';
                    this.noCaption = 'No';
                    this.cancelCaption = 'Cancel';
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'buttons':
                            //
                            break;
                    }
                }
                open(state) {
                    const retval = super.open(state);
                    switch (this.buttons) {
                        case DialogButtons.Ok:
                        case DialogButtons.OkCancel:
                            this.dialogButtons.ok.focus();
                            break;
                        default:
                            this.dialogButtons.yes.focus();
                            break;
                    }
                    return retval;
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    // HACK: move the buttons outside the .pacem-scrollable element in the lightbox
                    requestAnimationFrame(() => {
                        const elFrom = this.lightbox && this.lightbox.container;
                        if (!Pacem.Utils.isNull(elFrom)) {
                            elFrom.appendChild(this._buttons);
                            this.dispatchEvent(new Pacem.PropertyChangeEvent({ propertyName: 'dialogButtons', currentValue: this.dialogButtons }));
                        }
                        else {
                            this.log(Pacem.Logging.LogLevel.Warn, `Could not find the lightbox container as expected.`);
                        }
                    });
                }
                /** Gets the 'ok', 'yes', 'no' and 'cancel' dialog buttons. */
                get dialogButtons() {
                    const btns = this._buttons;
                    return {
                        ok: btns && btns.firstElementChild.firstElementChild,
                        yes: btns && btns.firstElementChild.children.item(1),
                        no: btns && btns.firstElementChild.children.item(2),
                        cancel: btns && btns.firstElementChild.lastElementChild
                    };
                }
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemDialogElement.prototype, "buttons", void 0);
            __decorate([
                Pacem.Watch({ reflectBack: true, converter: Pacem.PropertyConverters.String })
            ], PacemDialogElement.prototype, "okCaption", void 0);
            __decorate([
                Pacem.Watch({ reflectBack: true, converter: Pacem.PropertyConverters.String })
            ], PacemDialogElement.prototype, "yesCaption", void 0);
            __decorate([
                Pacem.Watch({ reflectBack: true, converter: Pacem.PropertyConverters.String })
            ], PacemDialogElement.prototype, "noCaption", void 0);
            __decorate([
                Pacem.Watch({ reflectBack: true, converter: Pacem.PropertyConverters.String })
            ], PacemDialogElement.prototype, "cancelCaption", void 0);
            __decorate([
                Pacem.ViewChild(`.${Pacem.PCSS}-dialog-buttons`)
            ], PacemDialogElement.prototype, "_buttons", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-lightbox')
            ], PacemDialogElement.prototype, "lightbox", void 0);
            PacemDialogElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-dialog', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-lightbox modal="true" logger="{{ :host.logger }}">
    <${Pacem.P}-content></${Pacem.P}-content>
    <div class="${Pacem.PCSS}-dialog-buttons ${Pacem.PCSS}-buttonset buttons">
        <div class="buttonset-left">
            <${Pacem.P}-button class="button button-size size-small primary dialog-ok" css-class="{{ {'buttonset-last': :host.buttons === 'ok'} }}" on-click=":host.commit('ok', $event)" disabled="{{ :host.disabled || this.hide }}" hide="{{ :host.buttons !== 'ok' && :host.buttons !== 'okcancel' }}"><${Pacem.P}-text text="{{ :host.okCaption }}"></${Pacem.P}-text></${Pacem.P}-button>
            <${Pacem.P}-button class="button button-size size-small primary dialog-yes" css-class="{{ {'buttonset-first': :host.buttons !== 'ok' || :host.buttons !== 'okcancel'} }}" on-click=":host.commit('yes', $event)" disabled="{{ :host.disabled || this.hide }}" hide="{{ :host.buttons === 'ok' || :host.buttons === 'okcancel' }}"><${Pacem.P}-text text="{{ :host.yesCaption }}"></${Pacem.P}-text></${Pacem.P}-button>
            <${Pacem.P}-button class="button button-size size-small dialog-no" css-class="{{ {'buttonset-last': :host.buttons === 'yesno'} }}" on-click=":host.commit('no', $event)" disabled="{{ :host.disabled || this.hide }}" hide="{{ :host.buttons !== 'yesno' && :host.buttons !== 'yesnocancel' }}"><${Pacem.P}-text text="{{ :host.noCaption }}"></${Pacem.P}-text></${Pacem.P}-button>
            <${Pacem.P}-button class="button button-size size-small dialog-cancel" on-click=":host.commit('cancel', $event)" disabled="{{ :host.disabled || this.hide }}" hide="{{ :host.buttons !== 'yesnocancel' && :host.buttons !== 'okcancel' }}"><${Pacem.P}-text text="{{ :host.cancelCaption }}"></${Pacem.P}-text></${Pacem.P}-button>
        </div>
    </div>
</${Pacem.P}-lightbox>`
                })
            ], PacemDialogElement);
            UI.PacemDialogElement = PacemDialogElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let PacemImageElement = class PacemImageElement extends Components.PacemElement {
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'src':
                        case 'disabled':
                            this._setSource();
                            break;
                        case 'adapt':
                            this._setLayout();
                            break;
                        case 'loading':
                            (!val ? Pacem.Utils.addClass : Pacem.Utils.removeClass)(this, 'img-ready');
                            break;
                    }
                }
                _setLayout() {
                    const bgsize = this.adapt || 'auto';
                    this.style.backgroundSize = bgsize;
                    const adapt = bgsize === 'auto', size = this.size || { width: 0, height: 0 }, w = size.width, h = size.height;
                    if (adapt) {
                        this.style.width = w > 0 ? `${w}px` : '';
                        this.style.height = h > 0 ? `${h}px` : '';
                    }
                }
                _setSource() {
                    var _me = this, src;
                    if (_me.disabled)
                        return;
                    //
                    _me.style.backgroundImage = '';
                    if (!Pacem.Utils.isNullOrEmpty(src = _me.src)) {
                        this.loading = true;
                        Pacem.Utils.loadImage(src).then(img => {
                            let weight, entries, entry;
                            if (window.performance
                                && (entries = performance.getEntriesByName(img.src))
                                && (entry = entries[0]))
                                weight = entry.decodedBodySize;
                            _me.size = {
                                width: img.width,
                                height: img.height,
                                weight: weight
                            };
                            _me._setLayout();
                            this.loading = false;
                            _me.style.backgroundImage = `url("${img.src}")`;
                        }, _ => {
                            // 404, whatever...
                            this.loading = false;
                        });
                    }
                }
            };
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemImageElement.prototype, "adapt", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemImageElement.prototype, "src", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Json })
            ], PacemImageElement.prototype, "size", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemImageElement.prototype, "loading", void 0);
            PacemImageElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-img'
                })
            ], PacemImageElement);
            UI.PacemImageElement = PacemImageElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let PacemInfiniteScrollerElement = class PacemInfiniteScrollerElement extends Components.PacemEventTarget {
                constructor() {
                    super();
                    this._scrollDelegate = () => this._doScroll();
                    this._enabled = true;
                    this._viewportHeight = 0;
                    this._innerHeight = 0;
                    this._isDocument = false;
                    this._container = null;
                    this._viewport = null;
                    this._scroller = null;
                    this._bottomGap = 10;
                    this._container = this;
                    this._viewport = this;
                    this._scroller = this;
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this.setInfiniteScrollContainer(this._container);
                }
                disconnectedCallback() {
                    if (!Pacem.Utils.isNull(this._scroller))
                        this._scroller.removeEventListener('scroll', this._scrollDelegate, false);
                    super.disconnectedCallback();
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'container':
                            this.setInfiniteScrollContainer(val);
                            break;
                        case 'disabled':
                            if (this._enabled = !val)
                                this._doScroll();
                            break;
                        case 'threshold':
                            this._bottomGap = val || 0;
                            break;
                    }
                }
                setInfiniteScrollContainer(v = '$document') {
                    var cont = v;
                    var isDoc = this._isDocument = cont === '$document' || cont === document.body || cont === document.documentElement;
                    this._container = isDoc ? (document.body || document.documentElement) : ((typeof v === 'string') ?
                        document.querySelector(cont)
                        :
                            cont);
                    this._viewport = isDoc ? window : this._container;
                    if (this._scroller)
                        this._scroller.removeEventListener('scroll', this._scrollDelegate, false);
                    this._scroller = isDoc ? window.document : this._container;
                    this._scroller.addEventListener('scroll', this._scrollDelegate, false);
                    if (this._enabled)
                        this._doScroll();
                }
                //ngOnChanges(changes: SimpleChanges) {
                //}
                _emitFetchMore() {
                    /**
                     * on-fetchmore => must toggle `enabled` while fetching...
                     */
                    var evt = new CustomEvent('fetchmore');
                    this.dispatchEvent(evt);
                }
                _doScroll() {
                    if (!this._enabled)
                        return;
                    if (!this._computeHeight()) {
                        var scrollTop = this._scroller instanceof Document ? window.pageYOffset : this._scroller.scrollTop;
                        var viewportHeight = this._viewportHeight, innerHeight = this._innerHeight;
                        var threshold = innerHeight - (scrollTop + viewportHeight);
                        if (threshold < this._bottomGap /* pixels */
                            || innerHeight <= viewportHeight) {
                            // fire fetchMore() 
                            this._emitFetchMore();
                            window.requestAnimationFrame(() => {
                                if (this._enabled)
                                    this._doScroll();
                            });
                        } //else computeHeight();
                    }
                    else
                        this._doScroll();
                }
                _computeHeight() {
                    if (!this._container)
                        return;
                    var cont = this._container;
                    var topOffset = Number.MAX_VALUE, bottomOffset = 0, totalHeight = 0, _innerHeight;
                    if (this._isDocument) {
                        var d = cont;
                        _innerHeight = Math.max(d.scrollHeight, d.offsetHeight, d.clientHeight);
                    }
                    else {
                        for (var i = 0; i < cont.children.length; i++) {
                            var e = cont.children.item(i);
                            var eTopOffset = e.offsetTop, eHeight = e.offsetHeight, eBottomOffset = eTopOffset + eHeight;
                            totalHeight += eHeight;
                            if (eTopOffset < topOffset) {
                                topOffset = eTopOffset;
                            }
                            if (eBottomOffset > bottomOffset) {
                                bottomOffset = eBottomOffset;
                            }
                        }
                        _innerHeight = Math.round(bottomOffset - topOffset);
                    }
                    var _viewportHeight = this._viewport instanceof Window ? Pacem.Utils.windowSize.height : this._viewport.offsetHeight;
                    if (_innerHeight != this._innerHeight || _viewportHeight != this._viewportHeight) {
                        this._innerHeight = _innerHeight;
                        this._viewportHeight = _viewportHeight;
                        return true;
                    }
                    return false;
                }
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemInfiniteScrollerElement.prototype, "container", void 0);
            __decorate([
                Pacem.Watch({ reflectBack: true, converter: Pacem.PropertyConverters.Number })
            ], PacemInfiniteScrollerElement.prototype, "threshold", void 0);
            __decorate([
                Pacem.Debounce(100)
            ], PacemInfiniteScrollerElement.prototype, "_doScroll", null);
            PacemInfiniteScrollerElement = __decorate([
                Pacem.CustomElement({ tagName: Pacem.P + '-infinite-scroller' })
            ], PacemInfiniteScrollerElement);
            UI.PacemInfiniteScrollerElement = PacemInfiniteScrollerElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
/// <reference path="adapter.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            class PacemAdaptedIterativeElement extends Components.PacemElement {
                constructor() {
                    super(...arguments);
                    this.index = 0;
                }
                isCloseTo(ndx, focusndx) {
                    if (Pacem.Utils.isNull(this.datasource) || this.datasource.length == 0)
                        return false;
                    return /*this.adapter.isClose(ndx) ||*/ this._isCloseToCore(ndx, focusndx, this.datasource.length);
                }
                isPrevious(ndx, focusndx) {
                    if (Pacem.Utils.isNull(this.datasource) || this.datasource.length == 0)
                        return false;
                    return /*this.adapter.isPrevious(ndx) ||*/ this._isPreviousCore(ndx, focusndx, this.datasource.length);
                }
                isNext(ndx, focusndx) {
                    if (Pacem.Utils.isNull(this.datasource) || this.datasource.length == 0)
                        return false;
                    return /*this.adapter.isNext(ndx) ||*/ this._isNextCore(ndx, focusndx, this.datasource.length);
                }
                _isNextCore(ndx, focusndx, count) {
                    return ((focusndx + 1) % count) === ndx;
                }
                _isPreviousCore(ndx, focusndx, count) {
                    return ((focusndx - 1 + count) % count) === ndx;
                }
                _isCloseToCore(ndx, focusndx, count) {
                    return (((focusndx + count) % count) == ((ndx + count) % count))
                        || this._isNextCore(ndx, focusndx, count) || this._isPreviousCore(ndx, focusndx, count);
                }
            }
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
            ], PacemAdaptedIterativeElement.prototype, "index", void 0);
            __decorate([
                Pacem.Watch()
            ], PacemAdaptedIterativeElement.prototype, "datasource", void 0);
            UI.PacemAdaptedIterativeElement = PacemAdaptedIterativeElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let PacemLightboxElement = class PacemLightboxElement extends Components.PacemEventTarget {
                constructor() {
                    super(...arguments);
                    this._resizeHandler = _ => {
                        if (this.show)
                            this._resize(_);
                    };
                    this._keyupHandler = (evt) => {
                        if (evt.keyCode === 27 /* ESC */ && this.show && !this.modal) {
                            this.show = false;
                        }
                    };
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    var wrapper = this._wrapperElement; //= <HTMLElement>this.querySelector();
                    var container = this.container; //= <HTMLElement>this.querySelector();
                    wrapper.addEventListener('mousedown', (evt) => {
                        if (this.modal)
                            Pacem.stopPropagationHandler(evt);
                        else
                            this.show = false;
                    }, false);
                    container.addEventListener('mousedown', (evt) => {
                        Pacem.stopPropagationHandler(evt);
                    }, false);
                    window.addEventListener('resize', this._resizeHandler, false);
                    window.addEventListener('keyup', this._keyupHandler, false);
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'show':
                            if (!!val) {
                                this._wrapperElement.hide = false;
                                document.body.style.overflow = 'hidden';
                                this._resize();
                                var scroller = this.querySelector('.' + Pacem.PCSS + '-scrollable');
                                if (scroller)
                                    window.requestAnimationFrame(() => scroller.scrollTop = 0);
                            }
                            else {
                                document.body.style.overflow = '';
                                this.dispatchEvent(new Event('close'));
                                //
                                Pacem.Utils.addAnimationEndCallback(this._wrapperElement, (e) => {
                                    e.hide = true;
                                }, 500);
                            }
                            break;
                    }
                }
                disconnectedCallback() {
                    if (this.show) {
                        this._close();
                    }
                    window.removeEventListener('resize', this._resizeHandler, false);
                    window.removeEventListener('keyup', this._keyupHandler, false);
                    super.disconnectedCallback();
                }
                _resize(evt) {
                    if (Pacem.Utils.isNull(this.container))
                        return;
                    var win = window, element = this._wrapperElement;
                    var viewportHeight = Pacem.Utils.windowSize.height;
                    var scrollTop = win.pageYOffset;
                    element.style.width = '100%';
                    element.style.height = viewportHeight + 'px';
                    element.style.position = 'absolute';
                    //element.style.zIndex = '10000'; // set in css
                    element.style.margin = '0';
                    element.style.padding = '0';
                    element.style.top = scrollTop + 'px';
                    element.style.left = '0';
                    //
                    var container = this.container;
                    container.style.top = '0';
                    container.style.margin = '0 auto';
                    let fnPos = () => {
                        var containerHeight = container.offsetHeight;
                        var top = (viewportHeight - containerHeight) * .5;
                        container.style.transform = `translateY(${Math.round(top)}px)`; // top + 'px auto 0 auto';
                    };
                    window.requestAnimationFrame(fnPos);
                    //fnPos();
                }
                _close(evt) {
                    if (!Pacem.Utils.isNull(evt)) {
                        Pacem.avoidHandler(evt);
                    }
                    this.show = false;
                }
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemLightboxElement.prototype, "show", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemLightboxElement.prototype, "modal", void 0);
            __decorate([
                Pacem.ViewChild('.' + Pacem.PCSS + '-lightbox-wrapper')
            ], PacemLightboxElement.prototype, "_wrapperElement", void 0);
            __decorate([
                Pacem.ViewChild('.' + Pacem.PCSS + '-lightbox')
            ], PacemLightboxElement.prototype, "container", void 0);
            PacemLightboxElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-lightbox',
                    shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-panel class="${Pacem.PCSS}-lightbox-wrapper" css-class="{{ {'${Pacem.PCSS}-shown': :host.show } }}" hidden>
        <div class="${Pacem.PCSS}-lightbox ${Pacem.PCSS}-relative" style="transform: translateY(50vh)">
            <div class="${Pacem.PCSS}-scrollable"><${Pacem.P}-content></${Pacem.P}-content></div>
        </div><${Pacem.P}-resize watch-position="true" logger="{{ :host.logger }}" on-resize=":host._resize($event)" disabled="{{ !:host.show }}" target="{{ ::container }}"></${Pacem.P}-resize>
    <${Pacem.P}-button hide="{{ :host.modal }}" class="${Pacem.PCSS}-close" on-click=":host._close($event)">X</${Pacem.P}-button>
</${Pacem.P}-panel>`
                })
            ], PacemLightboxElement);
            UI.PacemLightboxElement = PacemLightboxElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let LoaderType;
            (function (LoaderType) {
                LoaderType["Spinner"] = "spin";
                LoaderType["Pacem"] = "pacem";
                LoaderType["Custom"] = "custom";
            })(LoaderType = UI.LoaderType || (UI.LoaderType = {}));
            ;
            let PacemLoaderElement = class PacemLoaderElement extends Components.PacemElement {
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    var id = '_' + Pacem.Utils.uniqueCode();
                    this._svgSpinner.innerHTML = `<defs>
                    <mask id="hole${id}">
                        <rect width="100%" height="100%" fill="white" />
                        <circle cx="36" cy="36" r="12"></circle>
                        <path d="M18,0 L32,16 H40 L54,0 Z" fill="#000"></path>
                        <g transform="rotate(120,36,36)">
                            <path d="M18,0 L32,16 H40 L54,0 Z" fill="#000"></path>
                        </g>
                    </mask>
                </defs>

                <circle class="circle1" cx="36" cy="36" r="34" stroke-width="4" fill="none"></circle>
                <g class="gear">
                    <circle cx="36" cy="36" r="25" mask="url(#hole${id})"></circle>
                </g>
                <circle class="circle2" cx="36" cy="36" r="8" stroke-width="2" fill="none"></circle>

                <g class="bounds">
                    <path d="M8,0 H0 V8 M64,0 H71 V8 M71,63 V71 H64 M8,71 H0 V63" stroke-width="2"></path>
                </g>`;
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (!Pacem.Utils.isNull(this._container)) {
                        switch (name) {
                            case 'active':
                                if (val === true) {
                                    Pacem.Utils.addClass(this._container, 'active');
                                }
                                else {
                                    Pacem.Utils.removeClass(this._container, 'active');
                                }
                                break;
                            case 'type':
                                this._svgSpinner.setAttribute('hidden', 'hidden');
                                this._spinner.setAttribute('hidden', 'hidden');
                                switch (val) {
                                    case LoaderType.Pacem:
                                        this._svgSpinner.removeAttribute('hidden');
                                        break;
                                    default:
                                        this._spinner.removeAttribute('hidden');
                                        break;
                                }
                                break;
                        }
                    }
                }
            };
            __decorate([
                Pacem.ViewChild('div.' + Pacem.PCSS + '-spinner')
            ], PacemLoaderElement.prototype, "_spinner", void 0);
            __decorate([
                Pacem.ViewChild('div.' + Pacem.PCSS + '-loader')
            ], PacemLoaderElement.prototype, "_container", void 0);
            __decorate([
                Pacem.ViewChild('svg')
            ], PacemLoaderElement.prototype, "_svgSpinner", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemLoaderElement.prototype, "active", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemLoaderElement.prototype, "type", void 0);
            PacemLoaderElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-loader', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<div class="${Pacem.PCSS}-loader" pacem>
            <div class="${Pacem.PCSS}-spinner" pacem>
                <div></div>
                <div></div>
            </div>
            <svg class="${Pacem.PCSS}-spinner" pacem hidden xmlns="http://www.w3.org/2000/svg" 
                 xmlns:xlink="http://www.w3.org/1999/xlink"
                 viewBox="-18,-18,108,108" preserveAspectRatio="xMidYMid">
            </svg>
        </div>`
                })
            ], PacemLoaderElement);
            UI.PacemLoaderElement = PacemLoaderElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
/* TODO: remove from UI bundle -> dedicated API */
var Pacem;
(function (Pacem) {
    const code_block_regex = /`{3}([\w#-]*)\r?\n([\s\S]*?)\n`{3}/g;
    const R = Pacem.RegularExpressions;
    const REGEX = R.Regex;
    function void_replacer() { return { regex: R.EMPTY_MATCHER, fn: (m) => m }; }
    ;
    const regexes = [
        // (* = totally custom markdown)
        // headings
        { regex: /^(#+)\s(.*)\s*$/gm, fn: (inp, r) => inp.replace(r, function (m, m0, m1) { return `<h${m0.length}>${m1}</h${m0.length}>`; }) },
        // images
        { regex: /!\[([^\]]+)\]\(([^\)]+)\)/g, fn: (inp, r) => inp.replace(r, `<img alt="$1" src="$2" />`) },
        // #region embed links
        // *tweet-embed
        {
            regex: /\[tweet\]\(([^\)]+)\)/g, fn: (inp, r) => inp.replace(r, `<!-- twitter embed $1 -->\n<${Pacem.P}-tweetembed tweetid="$1"></${Pacem.P}-tweetembed>`)
        },
        // *youtube-embed
        {
            regex: /\[yt([\d]+x[\d]+)?\]\(([^\)]+)\)/g, fn: (inp, r) => inp.replace(r, function (m, m0, m1) {
                m0 = m0 || '560x315';
                const size = m0.split('x'), w = size[0], h = size[1];
                return `<!-- youtube embed ${m1} ${m0} -->
<iframe width="${w}" height="${h}" src="https://www.youtube.com/embed/${m1}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
            })
        },
        // #endregion
        // links
        { regex: /\[([^\]]+)\]\(([^\)]+)\)/g, fn: (inp, r) => inp.replace(r, `<a href="$2">$1</a>`) },
        // bold/italics
        { regex: /(^|[^\w])(\*\*?|__?)(.*?)\2([^\w]|$)/gm, fn: (inp, r) => inp.replace(r, function (m, s0, m0, m1, s1) { const tag = m0.length == 1 ? 'i' : 'b'; return `${s0}<${tag}>${m1}</${tag}>${s1}`; }) },
        // strikethrough
        { regex: /\~\~(.*?)\~\~/g, fn: (inp, r) => inp.replace(r, `<del>$1</del>`) },
        // quotes
        { regex: /\:\"(.*?)\"\:/g, fn: (inp, r) => inp.replace(r, `<q>$1</q>`) },
        // code inlines
        { regex: /`([^`]*)`/g, fn: (inp, r) => inp.replace(r, `<code>$1</code>`) },
        // (un)ordered lists
        { regex: /\n(-|\d+\.)\s+(.*)/g, fn: (inp, r) => inp.replace(r, function (m, m0, m1) { const tag = m0 === '-' ? 'ul' : 'ol'; return `\n<${tag}>\n\t<li>${m1}</li>\n</${tag}>`; }) },
        // fix for extra <ul>s
        { regex: /\n<\/(u|o)l>\n<\1l>/g, fn: (inp, r) => inp.replace(r, '') },
        // blockquotes
        {
            regex: /(\n(&gt;|>)\s.*)+/g, fn: (inp, r) => inp.replace(r, function (m, m0, m1) {
                var splitted = m.replace(/^(&gt;|>)\s(.*)$/gm, function (g, g0, g1) {
                    return g1;
                });
                return `\n<blockquote>${splitted}\n</blockquote>`;
            })
        },
        // horizontal rules
        { regex: /\n-{5,}/g, fn: (inp, r) => inp.replace(r, function (m, m0, m1) { return `\n<hr />`; }) } /*,
        // paragraphs
        { regex: /\s{2}/g, fn: (inp: string, r: RegExp) => inp.replace(r, '<br />') }*/
    ];
    class MarkdownService {
        constructor() {
            this._inparagraph = false;
        }
        // TODO: error prone and NOT safe. Process content line by line using encoding, regexes /m and scope variables. Try to keep it clean as well
        toHtml(md = '') {
            const _this = this, escapedMd = md.replace(/</g, '&lt;').replace(/>/g, '&gt;'), trunks = REGEX.split(escapedMd, code_block_regex);
            var retval = [];
            for (var t of trunks) {
                if (t.match) {
                    retval.push(t.value.replace(code_block_regex, function (m, m0, m1) {
                        const lang = (m0 || 'unknown').replace('#', '-sharp').toLowerCase(), code = _this._parseCode(m1, lang);
                        return `\n<code class="${Pacem.PCSS}-code-block ${lang}">${code}</code>`;
                    }));
                }
                else {
                    let out = t.value;
                    for (var i of regexes) {
                        out = i.fn(out, i.regex);
                    }
                    var step = _this._paragraphy(out) + (_this._inparagraph ? '</p>' : '');
                    retval.push(_this._thenSafe(_this._thenTrim(step)));
                }
            }
            return retval.join('');
        }
        _parseCode(code, lang) {
            var keywords = void_replacer(), numbers = void_replacer(), strings = void_replacer(), comments = void_replacer(), tags = void_replacer(), attrs = void_replacer();
            lang = lang.toLowerCase();
            switch (lang) {
                case 'c#':
                case 'c-sharp':
                case 'js':
                case 'javascript':
                case 'ts':
                case 'typescript':
                    if (lang.startsWith('c')) {
                        keywords.regex = /\b(abstract|as|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|goto|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|out|override|params|private|protected|public|readonly|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|static|virtual|void|volatile|while|add|alias|ascending|async|await|descending|dynamic|from|get|global|group|into|join|let|nameof|orderby|partial|remove|select|set|value|var|when|where|yield)\b/g;
                        strings.regex = /'(\\'|[^'])*[^\\]?'|@?\$?"(\\"|[^"])*[^\\]?"/g;
                    }
                    else {
                        keywords.regex = /\b(abstract|arguments|async|await|boolean|break|byte|case|catch|char|class|const|continue|debugger|default|delete|do|double|else|enum|eval|export|extends|false|final|finally|float|for|function|goto|if|implements|import|in|instanceof|int|interface|let|long|native|new|null|package|private|protected|public|return|short|static|super|switch|synchronized|this|throw|throws|transient|true|try|typeof|var|void|volatile|while|with|yield)\b/g;
                        strings.regex = /'(\\'|[^'])*[^\\]?'|"(\\"|[^"])*[^\\]?"|`(\\`|[^`])*[^\\]?`/g;
                    }
                    keywords.fn = '<span class="' + Pacem.PCSS + '-keyword">$1</span>';
                    strings.fn = (m) => `<span class="${Pacem.PCSS}-string">${m}</span>`;
                    numbers.regex = /\b((0x[0-9a-fA-F]|[\d])*\.?[\d]+)\b/g;
                    numbers.fn = '<span class="' + Pacem.PCSS + '-number">$1</span>';
                    comments.regex = /(\/\/.*|\/\*(?:(?!(\*\/))[\s\S])*\*\/)/g;
                    comments.fn = `<span class="${Pacem.PCSS}-comment">$1</span>`;
                    break;
                case 'xml':
                case 'html':
                    tags.regex = /(&lt;\/?)([\w-]+)|(\/?&gt;)/g;
                    tags.fn = (m, m1, m2, m3) => {
                        if (Pacem.Utils.isNullOrEmpty(m3))
                            return `<span class="${Pacem.PCSS}-tag">${m1}</span><span class="${Pacem.PCSS}-tag-name">${m2}</span>`;
                        return `<span class="${Pacem.PCSS}-tag">${m3}</span>`;
                    };
                    strings.regex = /(=')(\\'|[^'])*[^\\]?(')|(=")(\\"|[^"])*[^\\]?(")/g;
                    strings.fn = (m) => `<span class="${Pacem.PCSS}-string">${m}</span>`;
                    // isn't this ugly?:
                    attrs.regex = /(\s[\w-]+)$/g;
                    attrs.fn = `<span class="${Pacem.PCSS}-attribute">$1</span>`;
                    comments.regex = /((<|&lt;)!--(?:(?!(--(>|&gt;)))[\s\S])*--(>|&gt;))/g;
                    comments.fn = `<span class="${Pacem.PCSS}-comment">$1</span>`;
            }
            var split = REGEX.split(code, comments.regex);
            var retval = [];
            for (var t of split) {
                if (t.match)
                    retval.push(t.value.replace(comments.regex, comments.fn));
                else {
                    let split2 = REGEX.split(t.value, strings.regex);
                    let retval2 = [];
                    for (var t2 of split2) {
                        if (t2.match) {
                            retval2.push(t2.value
                                .replace(strings.regex, strings.fn));
                        }
                        else {
                            retval2.push(t2.value
                                .replace(tags.regex, tags.fn)
                                .replace(keywords.regex, keywords.fn)
                                .replace(attrs.regex, attrs.fn)
                                .replace(numbers.regex, numbers.fn));
                        }
                    }
                    retval.push(retval2.join(''));
                }
            }
            return retval.join('');
        }
        _paragraphy(semi) {
            this._inparagraph = false;
            var incode = false, _this = this;
            return semi.replace(/^([^\n]*)$/gm, function (m, m0, index, whole) {
                if ((/^<code\s+([^>]+)>$/.test(m) && !incode) || (incode && /^<\/code>$/.test(m)))
                    incode = !incode;
                if (incode || /^\s*<\/?(ul|ol|li|h|p|bl|code)/i.test(m)) {
                    if (_this._inparagraph === false)
                        return m;
                    _this._inparagraph = false;
                    return '</p>\n' + m;
                }
                //
                var ret = m0.replace(/\s{2}/g, '<br />');
                if (!_this._inparagraph) {
                    if (m0.length > 0) {
                        ret = '<p>' + ret;
                        _this._inparagraph = true;
                    }
                }
                else if (m0 === undefined || m0.length === 0) {
                    _this._inparagraph = false;
                    ret += '</p>';
                }
                return ret;
            });
        }
        _thenTrim(step) {
            return step.replace(/<p>(((?!<\/p>)(.|[\r\n]))*)<\/p>/g, function (m, m0, m1) {
                return `<p>${m0.trim()}</p>`;
            });
        }
        _thenSafe(step) {
            //return step.replace(/<\/?([\w]+-[\w]+|script)(?:[^>=]|='[^']*'|="[^"]*"|=[^'"][^\s>]*)*>/g, '');
            return step.replace(/<\/?script(?:[^>=]|='[^']*'|="[^"]*"|=[^'"][^\s>]*)*>/g, '');
        }
    }
    Pacem.MarkdownService = MarkdownService;
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
/// <reference path="markdown-svc.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let PacemMarkdownElement = class PacemMarkdownElement extends Components.PacemElement {
                constructor(_md = new Pacem.MarkdownService()) {
                    super();
                    this._md = _md;
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'value')
                        this.innerHTML = this._md.toHtml(val);
                }
            };
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemMarkdownElement.prototype, "value", void 0);
            PacemMarkdownElement = __decorate([
                Pacem.CustomElement({ tagName: Pacem.P + '-markdown' })
            ], PacemMarkdownElement);
            UI.PacemMarkdownElement = PacemMarkdownElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let PacemMarqueeElement = class PacemMarqueeElement extends Components.PacemElement {
                constructor() {
                    super(...arguments);
                    this._state = { overlap: 0, content: 0 };
                }
                // TODO: reuse css animation injection
                connectedCallback() {
                    super.connectedCallback();
                    const css = this._css = document.createElement('style');
                    document.head.appendChild(css);
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'speed') {
                        this._adjust();
                    }
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this._adjust();
                }
                disconnectedCallback() {
                    if (!Pacem.Utils.isNull(this._css))
                        this._css.remove();
                    super.disconnectedCallback();
                }
                _overlapResize(evt) {
                    this._state.overlap = evt.detail.width;
                    this._adjust();
                }
                _contentResize(evt) {
                    this._state.content = evt.detail.width;
                    this._adjust();
                }
                _adjust() {
                    const state = this._state;
                    if (state.content > 0 && state.overlap > 0) {
                        const m = this._marquee;
                        const id = 'marquee-' + Pacem.Utils.uniqueCode(), // rename the animation every time (Edge bug)
                        from = Math.round(state.overlap), to = -Math.round(state.content);
                        this._css.innerHTML = `@keyframes ${id} {
    0% {
        transform: translateX(${from}px);
    }

    100% {
        transform: translateX(${to}px);
    }
}`;
                        const speed = this.speed || 20;
                        const time = Math.max(speed, Math.round(speed * Math.abs(from - to) / 1920));
                        m.style.animationName = id;
                        m.style.animationDuration = time + 's';
                        m.style.animationIterationCount = 'infinite';
                        m.style.animationTimingFunction = 'linear';
                    }
                }
            };
            __decorate([
                Pacem.ViewChild(`.${Pacem.PCSS}-marquee`)
            ], PacemMarqueeElement.prototype, "_marquee", void 0);
            __decorate([
                Pacem.ViewChild(`.${Pacem.PCSS}-marquee-overlap`)
            ], PacemMarqueeElement.prototype, "_overlap", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + "-resize")
            ], PacemMarqueeElement.prototype, "_resizer", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
            ], PacemMarqueeElement.prototype, "speed", void 0);
            PacemMarqueeElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-marquee', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<div class="${Pacem.PCSS}-marquee"><${Pacem.P}-content></${Pacem.P}-content></div><div class="${Pacem.PCSS}-marquee-overlap"></div>
<${Pacem.P}-resize target="{{ :host._overlap }}" on-${Components.ResizeEventName}=":host._overlapResize($event)"></${Pacem.P}-resize>
<${Pacem.P}-resize target="{{ :host._marquee }}" on-${Components.ResizeEventName}=":host._contentResize($event)"></${Pacem.P}-resize>`
                })
            ], PacemMarqueeElement);
            UI.PacemMarqueeElement = PacemMarqueeElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            var PacemMenuCursorElement_1;
            let PacemMenuElement = class PacemMenuElement extends Components.PacemElement {
                constructor() {
                    super(...arguments);
                    this._stopPropagationHandlerConditional = (evt) => {
                        if (!Pacem.Utils.isNull(this._container) && !Pacem.Utils.isNull(this._base)) {
                            const offsetNav = Pacem.Utils.offset(this._container);
                            const offsetBase = Pacem.Utils.offset(this._base);
                            // TODO: consider height as well for different skins, but DO manage edge cases...
                            if (offsetNav.width < offsetBase.width) {
                                this.open = false;
                            }
                        }
                    };
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this._container.addEventListener('click', Pacem.stopPropagationHandler, false);
                    this._container.addEventListener("scroll", Pacem.stopPropagationHandler, false);
                    this._sync();
                }
                disconnectedCallback() {
                    window.removeEventListener('navigate', this._stopPropagationHandlerConditional, false);
                    if (!Pacem.Utils.isNull(this._container)) {
                        this._container.removeEventListener('click', Pacem.stopPropagationHandler, false);
                        this._container.removeEventListener("scroll", Pacem.stopPropagationHandler, false);
                    }
                    super.disconnectedCallback();
                }
                connectedCallback() {
                    super.connectedCallback();
                    window.addEventListener('navigate', this._stopPropagationHandlerConditional, false);
                    this._shell = Pacem.CustomElementUtils.findAncestorShell(this);
                }
                _toggle(evt) {
                    Pacem.avoidHandler(evt);
                    this.open = !this.open;
                    this.dispatchEvent(new Event('toggle'));
                }
                _sync(val = this.open) {
                    Pacem.Utils.addClass(this._shell, Pacem.PCSS + (val === true ? '-menu-open' : '-menu-close'));
                    Pacem.Utils.removeClass(this._shell, Pacem.PCSS + (val === true ? '-menu-close' : '-menu-open'));
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'open') {
                        this._sync(val);
                    }
                }
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemMenuElement.prototype, "open", void 0);
            __decorate([
                Pacem.ViewChild('nav')
            ], PacemMenuElement.prototype, "_container", void 0);
            __decorate([
                Pacem.ViewChild(`.${Pacem.PCSS}-hamburger-menu`)
            ], PacemMenuElement.prototype, "_base", void 0);
            PacemMenuElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-menu', template: `<${Pacem.P}-panel class="${Pacem.PCSS}-hamburger-menu" css-class="{{ {'menu-close': !:host.open, 'menu-open': :host.open} }}" on-click=":host._toggle($event)">    
    <nav><${Pacem.P}-content></${Pacem.P}-content></nav>
</${Pacem.P}-panel>
<${Pacem.P}-shell-proxy>
<${Pacem.P}-button class="${Pacem.PCSS}-back ${Pacem.PCSS}-menu flat" css-class="{{ {'menu-close': !:host.open, 'menu-open': :host.open} }}" on-click=":host._toggle($event)">BACK</${Pacem.P}-button>
<${Pacem.P}-button class="${Pacem.PCSS}-hamburger ${Pacem.PCSS}-menu flat" css-class="{{ {'menu-close': :host.open, 'menu-open': !:host.open} }}" on-click=":host._toggle($event)">MENU</${Pacem.P}-button></${Pacem.P}-shell-proxy>`,
                    shadow: Pacem.Defaults.USE_SHADOW_ROOT
                })
            ], PacemMenuElement);
            UI.PacemMenuElement = PacemMenuElement;
            let PacemMenuCursorElement = PacemMenuCursorElement_1 = class PacemMenuCursorElement extends Components.PacemElement {
                constructor() {
                    super(...arguments);
                    this._onPathChange = (evt) => {
                        const menu = this._menu, path = (evt && evt.detail) || window.location.pathname;
                        if (Pacem.Utils.isNull(menu)) {
                            this.log(Pacem.Logging.LogLevel.Warn, `Couldn't find a ${PacemMenuElement} ancestor for this ${PacemMenuCursorElement_1}.`);
                            return;
                        }
                        // 1. try to find a matching PacemAnchorElement
                        var anchors = menu.querySelectorAll(Pacem.P + '-a');
                        var tget = null;
                        for (let j = 0; j < anchors.length; j++) {
                            let a = anchors.item(j);
                            if (a.href === path) {
                                tget = a;
                                break;
                            }
                        }
                        if (Pacem.Utils.isNull(tget)) {
                            // 2. try with real HTMLAnchorElement
                            tget = menu.querySelector(`a[href='${path}']`);
                        }
                        if (!Pacem.Utils.isNull(tget)) {
                            // TODO: use transforms (remove width/height/top/... animations)
                            // TODO: consider <nav> scrollTop
                            const rect = Pacem.Utils.offset(tget);
                            const rectMenu = Pacem.Utils.offset(menu);
                            this.style.top = rect.top + 'px';
                            this.style.left = rectMenu.left + 'px';
                            this.style.width = '0';
                            this.style.height = rect.height + 'px';
                            Pacem.Utils.addAnimationEndCallback(this, () => {
                                this.style.width = (rect.width + rect.left - rectMenu.left) + 'px';
                            }, 500);
                        }
                    };
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this._menu = Pacem.CustomElementUtils.findAncestorOfType(this, PacemMenuElement);
                    this._onPathChange();
                }
                connectedCallback() {
                    super.connectedCallback();
                    window.addEventListener('navigate', this._onPathChange, false);
                }
                disconnectedCallback() {
                    this._menu = null;
                    window.removeEventListener('navigate', this._onPathChange, false);
                    super.disconnectedCallback();
                }
            };
            PacemMenuCursorElement = PacemMenuCursorElement_1 = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-menu-cursor'
                })
            ], PacemMenuCursorElement);
            UI.PacemMenuCursorElement = PacemMenuCursorElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let PacemPagerElement = class PacemPagerElement extends Components.PacemElement {
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'index':
                        case 'total':
                        case 'pages':
                        case 'size':
                            this._databind();
                            break;
                    }
                }
                _databind() {
                    const repeater = this._repeater;
                    if (Pacem.Utils.isNull(repeater))
                        return;
                    //
                    var datasource = [];
                    const size = this.size || 10, pages = this.pages || 5, total = this.total || 0, index = this.index || 0;
                    if (total > 0) {
                        let totpages = Math.ceil(total / size);
                        let pageindex = Math.floor(index / size);
                        let startpageindex = Math.max(0, Math.ceil(pageindex - pages / 2));
                        let endpageindex = Math.min(totpages - 1, startpageindex + pages - 1);
                        while (startpageindex > 0 && (1 + endpageindex - startpageindex) < pages) {
                            startpageindex--;
                        }
                        // |<
                        datasource.push({ caption: '&laquo;', index: 0, first: true, disabled: !( /*start*/pageindex > 0) });
                        // <
                        datasource.push({ caption: '&lt;', index: size * (pageindex - 1), previous: true, disabled: !(pageindex > 0) });
                        // ...
                        if (startpageindex > 0) {
                            datasource.push({ caption: '&hellip;', index: size * (startpageindex - 1) });
                        }
                        // #
                        for (let j = startpageindex; j <= endpageindex; j++) {
                            datasource.push({ caption: (j + 1).toLocaleString(Pacem.Utils.lang(this)), index: j * size });
                        }
                        // ...
                        if (endpageindex < (totpages - 1)) {
                            datasource.push({ caption: '&hellip;', index: size * (endpageindex + 1) });
                        }
                        // >
                        datasource.push({ caption: '&gt;', index: size * (pageindex + 1), next: true, disabled: !(pageindex < (totpages - 1)) });
                        // >|
                        datasource.push({ caption: '&raquo;', index: size * (totpages - 1), last: true, disabled: !( /*end*/pageindex < (totpages - 1)) });
                        // 
                        this.index = pageindex * size;
                    }
                    repeater.datasource = datasource;
                }
            };
            __decorate([
                Pacem.ViewChild(Pacem.P + '-repeater')
            ], PacemPagerElement.prototype, "_repeater", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
            ], PacemPagerElement.prototype, "index", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number, emit: false })
            ], PacemPagerElement.prototype, "total", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number, emit: false })
            ], PacemPagerElement.prototype, "pages", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number, emit: false })
            ], PacemPagerElement.prototype, "size", void 0);
            __decorate([
                Pacem.Debounce(true)
            ], PacemPagerElement.prototype, "_databind", null);
            PacemPagerElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-pager', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-repeater class="${Pacem.PCSS}-pager"><div class="${Pacem.PCSS}-buttonset">
<div class="pager-buttons">
    <template>
        <${Pacem.P}-button class="${Pacem.PCSS}-page button" on-click=":host.index = ^item.index" disabled="{{ ^item.disabled }}"
    css-class="{{ { 'currentpage': ^item.index === :host.index, 'firstpage buttonset-first': ^item.first, 'previouspage': ^item.previous, 'nextpage': ^item.next, 'lastpage buttonset-last': ^item.last } }}"><${Pacem.P}-span content="{{ ^item.caption }}"></${Pacem.P}-span></${Pacem.P}-button>
    </template>
</div>
</div></${Pacem.P}-repeater>`
                })
            ], PacemPagerElement);
            UI.PacemPagerElement = PacemPagerElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let PacemProgressbarElement = class PacemProgressbarElement extends Components.PacemElement {
                constructor() {
                    super('progressbar', { 'valuemin': '0%', 'valuemax': '100%', 'valuenow': '0%' });
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'percentage':
                            this._bar.style.transform = `scaleX(${((val || 0) * .01)})`;
                            let perc = Pacem.Utils.leftPad(Math.floor(val), 2, '0') + '%';
                            this.aria.attributes.set('valuenow', perc);
                            if (Pacem.Utils.isNullOrEmpty(this.caption)) {
                                this.aria.attributes.set('valuetext', this._caption.textContent = perc);
                            }
                            break;
                        case 'caption':
                            this.aria.attributes.set('valuetext', this._caption.textContent = val);
                            break;
                    }
                }
            };
            __decorate([
                Pacem.ViewChild('.' + Pacem.PCSS + '-bar')
            ], PacemProgressbarElement.prototype, "_bar", void 0);
            __decorate([
                Pacem.ViewChild('.' + Pacem.PCSS + '-caption')
            ], PacemProgressbarElement.prototype, "_caption", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemProgressbarElement.prototype, "caption", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
            ], PacemProgressbarElement.prototype, "percentage", void 0);
            PacemProgressbarElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-progressbar', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<div class="${Pacem.PCSS}-track"><div class="${Pacem.PCSS}-bar"></div></div>
    <label class="${Pacem.PCSS}-caption"></label>`
                })
            ], PacemProgressbarElement);
            UI.PacemProgressbarElement = PacemProgressbarElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let PacemSlideElement = class PacemSlideElement extends Components.PacemIterableElement {
            };
            PacemSlideElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-slide'
                })
            ], PacemSlideElement);
            UI.PacemSlideElement = PacemSlideElement;
            let PacemSlideshowElement = class PacemSlideshowElement extends Components.PacemIterativeElement {
                validate(item) {
                    return item instanceof PacemSlideElement;
                }
            };
            PacemSlideshowElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-slideshow'
                })
            ], PacemSlideshowElement);
            UI.PacemSlideshowElement = PacemSlideshowElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            const getUserMediaFunctions = Pacem.Utils.getUserMediaFunctions();
            let SnapshotStep;
            (function (SnapshotStep) {
                SnapshotStep["Start"] = "start";
                SnapshotStep["Taking"] = "taking";
                SnapshotStep["Confirm"] = "confirm";
            })(SnapshotStep = UI.SnapshotStep || (UI.SnapshotStep = {}));
            let PacemSnapshotElement = class PacemSnapshotElement extends Components.PacemElement {
                constructor() {
                    super(...arguments);
                    this.step = SnapshotStep.Start;
                    /*const*/ this._canUseWebcam = getUserMediaFunctions.length > 0;
                    this._countdown = 0;
                    this._webcamInitialized = false;
                    this._processing = false;
                    this._previousStatuses = [];
                }
                get _getUserMedia() {
                    return this._canUseWebcam && getUserMediaFunctions[0];
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'step':
                            if (!Pacem.Utils.isNullOrEmpty(old) && val != this._poppedStatus)
                                this._previousStatuses.push(old);
                            if (val === SnapshotStep.Taking)
                                this._ensureWebcamRunning();
                            break;
                        case 'value':
                        case '_buffer':
                            let cnv = this._stage;
                            cnv.width = cnv.clientWidth;
                            cnv.height = cnv.clientHeight;
                            let ctx = cnv.getContext('2d');
                            if (Pacem.Utils.isNullOrEmpty(val)) {
                                ctx.clearRect(0, 0, cnv.width, cnv.height);
                            }
                            else {
                                Pacem.Utils.loadImage(val).then(img => {
                                    Pacem.Utils.cropImageOntoCanvas(img, ctx, img.width, img.height);
                                });
                            }
                            break;
                    }
                }
                _setToBeConfirmed(buffer) {
                    this.step = SnapshotStep.Confirm;
                    this._buffer = buffer;
                }
                _refreshBuffer(buffer) {
                    var cnv = this._stage;
                    cnv.width = /*this.width ||*/ cnv.clientWidth;
                    cnv.height = /*this.height ||*/ cnv.clientHeight;
                    return Pacem.Utils.cropImage(buffer, cnv.width, cnv.height);
                }
                take(evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    this.step = SnapshotStep.Taking;
                }
                confirm(evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    this.value =
                        /*this.onselect.emit(
                            'data:image/jpeg;base64,' +*/ this._buffer;
                    this._previousStatuses.splice(0);
                    this.step = SnapshotStep.Start;
                    this._buffer = '';
                }
                back(evt) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    this._buffer = this.value;
                    if (this._previousStatuses.length <= 0)
                        return;
                    var prev = this._poppedStatus = this._previousStatuses.pop();
                    this.step = prev;
                }
                _ensureWebcamRunning() {
                    if (this._canUseWebcam && !this._webcamInitialized) {
                        var me = this;
                        me._webcamInitialized = true;
                        me._getUserMedia.apply(navigator, [{ video: true /*, audio: false*/ },
                            /* success */ function (localMediaStream) {
                                var video = me._player;
                                // deprecated:
                                //video.src = window.URL.createObjectURL(localMediaStream);
                                // replaced with:
                                video.srcObject = localMediaStream;
                                function timeout() {
                                    if (me._countdown <= 0) {
                                        var cnv = document.createElement('canvas');
                                        cnv.width = /*this.width ||*/ video.clientWidth;
                                        cnv.height = /*this.height ||*/ video.clientHeight;
                                        var ctx = cnv.getContext('2d');
                                        Pacem.Utils.cropImageOntoCanvas(video, ctx, video.videoWidth, video.videoHeight);
                                        cnv.style.position = 'absolute';
                                        let root = me._root;
                                        root.insertBefore(cnv, video);
                                        cnv.className = Pacem.PCSS + '-brightout ' + Pacem.PCSS + '-preview';
                                        setTimeout(function () {
                                            root.removeChild(cnv);
                                        }, 2000);
                                        me._refreshBuffer(cnv.toDataURL()).then((b) => me._setToBeConfirmed(b));
                                    }
                                    else
                                        setTimeout(() => { me._countdown--; timeout(); }, 1000);
                                }
                                video.addEventListener('click', (evt) => {
                                    me._countdown = 3;
                                    timeout();
                                }, false);
                            }, /* fail */ function (e) {
                                alert((e || e.message).toString());
                            }]);
                    }
                }
            };
            __decorate([
                Pacem.ViewChild('.' + Pacem.PCSS + '-snapshot')
            ], PacemSnapshotElement.prototype, "_root", void 0);
            __decorate([
                Pacem.ViewChild('canvas')
            ], PacemSnapshotElement.prototype, "_stage", void 0);
            __decorate([
                Pacem.ViewChild('input[type=file]')
            ], PacemSnapshotElement.prototype, "_grabber", void 0);
            __decorate([
                Pacem.ViewChild('video')
            ], PacemSnapshotElement.prototype, "_player", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemSnapshotElement.prototype, "step", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemSnapshotElement.prototype, "value", void 0);
            __decorate([
                Pacem.Watch()
            ], PacemSnapshotElement.prototype, "_countdown", void 0);
            __decorate([
                Pacem.Watch({ emit: false })
            ], PacemSnapshotElement.prototype, "_buffer", void 0);
            PacemSnapshotElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-snapshot',
                    shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-panel class="${Pacem.PCSS}-snapshot" 
css-class="{{ { 
'${Pacem.PCSS}-steady': :host.step === '${SnapshotStep.Start}',
'${Pacem.PCSS}-ongoing': :host.step != '${SnapshotStep.Start}', 
'${Pacem.PCSS}-taking': :host.step != '${SnapshotStep.Start}', 
'${Pacem.PCSS}-video': :host._canUseWebcam && :host.step === '${SnapshotStep.Taking}', 
'${Pacem.PCSS}-countdown': :host._countdown > 0, 
'${Pacem.PCSS}-preview': :host.step == '${SnapshotStep.Confirm}' } }}">
    
    <${Pacem.P}-button on-click=":host.take($event)" class="${Pacem.PCSS}-camera" hide="{{ :host.step != '${SnapshotStep.Start}' }}"></${Pacem.P}-button>
    
    <canvas class="${Pacem.PCSS}-preview"></canvas>

    <input type="file" accept="image/*" capture="camera" hidden />

    <video class="${Pacem.PCSS}-player" autoplay="autoplay"></video>
    <${Pacem.P}-button class="${Pacem.PCSS}-countdown"><${Pacem.P}-text text="{{ :host._countdown }}"></${Pacem.P}-text></${Pacem.P}-button>
    <${Pacem.P}-button class="${Pacem.PCSS}-undo" hide="{{ :host.step == '${SnapshotStep.Start}' || :host._countdown > 0 }}" on-click=":host.back($event)"></${Pacem.P}-button>
    <${Pacem.P}-button class="${Pacem.PCSS}-confirm" hide="{{ :host.step != '${SnapshotStep.Confirm}' }}" on-click=":host.confirm($event)"></${Pacem.P}-button>
    <${Pacem.P}-span hide="{{ :host._canUseWebcam }}"><${Pacem.P}-content></${Pacem.P}-content></${Pacem.P}-span>
</${Pacem.P}-panel>`
                })
            ], PacemSnapshotElement);
            UI.PacemSnapshotElement = PacemSnapshotElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            var Social;
            (function (Social) {
                let PacemTweetEmbedElement = class PacemTweetEmbedElement extends Components.PacemElement {
                    constructor() {
                        super(...arguments);
                        this._scriptsLoaded = false;
                    }
                    propertyChangedCallback(name, old, val, first) {
                        super.propertyChangedCallback(name, old, val, first);
                        if (name === 'tweetid' && this._scriptsLoaded)
                            this._render();
                    }
                    viewActivatedCallback() {
                        super.viewActivatedCallback();
                        Pacem.CustomElementUtils.importjs('https://platform.twitter.com/widgets.js').then(() => {
                            this._scriptsLoaded = true;
                            this._render();
                        });
                    }
                    _render() {
                        if (this.tweetid && this._scriptsLoaded) {
                            twttr.ready(tw => tw.widgets.createTweet(this.tweetid, this));
                        }
                    }
                };
                __decorate([
                    Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
                ], PacemTweetEmbedElement.prototype, "tweetid", void 0);
                PacemTweetEmbedElement = __decorate([
                    Pacem.CustomElement({ tagName: Pacem.P + '-tweetembed' })
                ], PacemTweetEmbedElement);
                Social.PacemTweetEmbedElement = PacemTweetEmbedElement;
            })(Social = UI.Social || (UI.Social = {}));
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            const PACEM_TAB_FOCUS_CSS = 'tab-focus';
            let PacemTabElement = class PacemTabElement extends Components.PacemIterableElement {
                constructor() {
                    super('tab');
                }
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemTabElement.prototype, "label", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemTabElement.prototype, "key", void 0);
            PacemTabElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-tab'
                })
            ], PacemTabElement);
            UI.PacemTabElement = PacemTabElement;
            let PacemTabsElement = class PacemTabsElement extends Components.PacemIterativeElement {
                constructor(_tweener = new Pacem.Animations.TweenService()) {
                    super("tablist");
                    this._tweener = _tweener;
                }
                _labelCallback(item, index) {
                    return `<span class="${(item.key || 'tab')}">${item.label}</span>`;
                }
                _syncOrientation(val = this.orientation) {
                    if (!Pacem.Utils.isNull(this._defaultTabAdapter)) {
                        this._defaultTabAdapter.orientation = val;
                    }
                    if (!Pacem.Utils.isNull(this._tabs)) {
                        const fn = val === UI.AdapterOrientation.Vertical ? Pacem.Utils.addClass : Pacem.Utils.removeClass;
                        fn(this._tabs, 'tabs-vertical');
                    }
                }
                _syncVisibility(val = this.index, old = -1) {
                    const timeout = 500;
                    // lock height
                    const container = this._container, height = container.clientHeight;
                    const style = getComputedStyle(container), padding = style.boxSizing === 'border-box' ? 0 : parseInt(style.paddingTop) + parseInt(style.paddingBottom);
                    container.style.height = (height - padding) + 'px';
                    let ndx = 0;
                    for (let tab of this.items) {
                        if (ndx === val) {
                            Pacem.Utils.addClass(tab, 'tab-in');
                            requestAnimationFrame(() => {
                                // wait for visibility digestion
                                Pacem.Utils.addClass(tab, PACEM_TAB_FOCUS_CSS);
                                Pacem.Utils.removeClass(tab, 'tab-in');
                                Pacem.Utils.addAnimationEndCallback(tab, (t) => {
                                    Pacem.Utils.removeClass(t, 'tab-previous tab-next');
                                    const tgetH = Pacem.Utils.offset(t).height + padding;
                                    this._tweener.run(parseInt(container.style.height), tgetH, 100, 0, Pacem.Animations.Easings.sineOut, (_, v) => {
                                        container.style.height = Math.round(v) + 'px';
                                    })
                                        .then(_ => {
                                        // unlock height
                                        container.style.height = '';
                                    });
                                }, timeout);
                            });
                            tab.aria.attributes.set('selected', 'true');
                        }
                        else {
                            Pacem.Utils.removeClass(tab, 'tab-previous tab-next');
                            Pacem.Utils.addClass(tab, ndx < val ? 'tab-previous' : 'tab-next');
                            if (ndx === old) {
                                Pacem.Utils.addClass(tab, 'tab-out');
                                Pacem.Utils.removeClass(tab, PACEM_TAB_FOCUS_CSS);
                                Pacem.Utils.addAnimationEndCallback(tab, (t) => {
                                    Pacem.Utils.removeClass(t, 'tab-out');
                                }, timeout);
                                tab.aria.attributes.set('selected', 'false');
                            }
                        }
                        ndx++;
                    }
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    //this._defaultTabAdapter.labelCallback = this._labelCallback;
                    if (Pacem.Utils.isNull(this.adapter)) {
                        this._syncOrientation();
                        this._syncVisibility();
                        this.adapter = this._defaultTabAdapter;
                    }
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'adapter':
                            if (Pacem.Utils.isNull(val)) {
                                this.adapter = this._defaultTabAdapter;
                            }
                            this._isUsingDefaultTabAdapter = this.adapter === this._defaultTabAdapter;
                            break;
                        case 'index':
                            this._syncVisibility(val, old);
                            break;
                        case 'orientation':
                            this._syncOrientation(val);
                            break;
                    }
                }
                validate(item) {
                    return item instanceof PacemTabElement;
                }
            };
            __decorate([
                Pacem.ViewChild(Pacem.P + '-adapter')
            ], PacemTabsElement.prototype, "_defaultTabAdapter", void 0);
            __decorate([
                Pacem.ViewChild('.' + Pacem.PCSS + '-tabs')
            ], PacemTabsElement.prototype, "_tabs", void 0);
            __decorate([
                Pacem.ViewChild('.' + Pacem.PCSS + '-tabs-content')
            ], PacemTabsElement.prototype, "_container", void 0);
            __decorate([
                Pacem.Watch()
            ], PacemTabsElement.prototype, "_isUsingDefaultTabAdapter", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemTabsElement.prototype, "orientation", void 0);
            PacemTabsElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-tabs', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<div class="${Pacem.PCSS}-tabs">
    <${Pacem.P}-adapter class="${Pacem.PCSS}-tabs-adapter" swipe-enabled="false" hide="{{ !:host._isUsingDefaultTabAdapter }}" label-callback="{{ :host._labelCallback }}"></${Pacem.P}-adapter>
    <div class="${Pacem.PCSS}-tabs-content">
        <${Pacem.P}-content></${Pacem.P}-content>
    </div>
</div>`
                })
            ], PacemTabsElement);
            UI.PacemTabsElement = PacemTabsElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            var PacemToastElement_1;
            const PACEM_TOAST_POPS = "pacem:toast:pops";
            let PacemToastElement = PacemToastElement_1 = class PacemToastElement extends Components.PacemElement {
                constructor() {
                    super(...arguments);
                    this.autohide = true;
                    this.timeout = 3000;
                    this._doHide = (evt) => {
                        window.clearTimeout(this._handle);
                        this.show = false;
                    };
                }
                connectedCallback() {
                    super.connectedCallback();
                    this.addEventListener('click', this._doHide, false);
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'show') {
                        if (val !== true) {
                            Pacem.Utils.removeClass(this, 'toast-show');
                            this.dispatchEvent(new CustomEvent('close'));
                        }
                        else {
                            let order = Pacem.CustomElementUtils.getAttachedPropertyValue(PacemToastElement_1, PACEM_TOAST_POPS, 0) - 1;
                            Pacem.CustomElementUtils.setAttachedPropertyValue(PacemToastElement_1, PACEM_TOAST_POPS, order);
                            this.style.order = '' + order;
                            Pacem.Utils.addClass(this, 'toast-show');
                            this._show();
                        }
                    }
                }
                disconnectedCallback() {
                    this.removeEventListener('click', this._doHide, false);
                    super.disconnectedCallback();
                }
                _show() {
                    window.clearTimeout(this._handle);
                    if (this.disabled)
                        return;
                    if (this.autohide) {
                        this._handle = window.setTimeout(() => { this.show = false; }, this.timeout);
                    }
                }
                popup() {
                    if (this.show) {
                        this._show();
                    }
                    else {
                        this.show = true;
                    }
                }
            };
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Boolean })
            ], PacemToastElement.prototype, "autohide", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
            ], PacemToastElement.prototype, "timeout", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemToastElement.prototype, "show", void 0);
            PacemToastElement = PacemToastElement_1 = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-toast'
                })
            ], PacemToastElement);
            UI.PacemToastElement = PacemToastElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let PacemTocElement = class PacemTocElement extends Components.PacemElement {
                constructor(_tweener = new Pacem.Animations.TweenService()) {
                    super();
                    this._tweener = _tweener;
                    this._items = [];
                    this._scrollToSelf = (evt) => {
                        this._scrollTo('#' + evt.target.id);
                    };
                    this._hashChange = (evt) => {
                        evt.preventDefault();
                        this._scrollTo(window.location.hash, false);
                    };
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    // url
                    switch (name) {
                        case 'target':
                            if (!Pacem.Utils.isNull(this._observer))
                                this._observe();
                            break;
                        case 'selector':
                            this.refresh();
                            break;
                    }
                }
                connectedCallback() {
                    super.connectedCallback();
                    window.addEventListener('hashchange', this._hashChange, false);
                }
                disconnectedCallback() {
                    window.removeEventListener('hashchange', this._hashChange, false);
                    if (!Pacem.Utils.isNull(this._observer))
                        this._observer.disconnect();
                    super.disconnectedCallback();
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this._observer = new MutationObserver((e) => { this.refresh(); });
                    this._observe();
                }
                _onScroll(evt) {
                    this._update(Pacem.Utils.scrollTop);
                }
                _observe() {
                    this._observer.observe(this.target || document.body, { subtree: true, childList: true });
                }
                _getTop(dom) {
                    return Pacem.Utils.offset(dom).top;
                }
                _scrollTo(selector, tween = true) {
                    const dom = !Pacem.Utils.isNullOrEmpty(selector) && document.querySelector(selector), item = !Pacem.Utils.isNull(dom) && this._items.find(i => i.dom === dom);
                    if (item && !Pacem.Utils.isNull(item.dom)) {
                        const tget = this._getTop(item.dom) - (this.offset || 0);
                        if (tween) {
                            let from = Pacem.Utils.scrollTop;
                            window.location.hash = item.dom.id;
                            this._tweener.run(from, tget, 500, 0, Pacem.Animations.Easings.sineInOut, (t, v) => {
                                window.scrollTo(0, v);
                            });
                        }
                        else {
                            window.scrollTo(0, tget);
                        }
                    }
                }
                _startScrollTo(item, evt) {
                    Pacem.avoidHandler(evt);
                    this._scrollTo(item.url);
                }
                _update(top) {
                    // pick focused item (fallback: first item)
                    const zero = top + (this.offset || 0);
                    var current = this._items && this._items.length > 0 && this._items[0];
                    for (var item of this._items) {
                        if (Pacem.Utils.offset(item.dom).top <= zero)
                            current = item;
                        else
                            break;
                    }
                    // update css
                    const datasource = [];
                    for (var item of this._items) {
                        if (Pacem.Utils.isNullOrEmpty(item.dom.id)) {
                            item.dom.id = item.dom.innerText.trim().replace(/[^a-zA-Z0-9]/g, '-').replace(/-*$/, '').replace(/^-*/, '').toLowerCase();
                        }
                        datasource.push({ focus: item === current, label: item.dom.innerText, url: '#' + item.dom.id });
                    }
                    if (!Pacem.Utils.isNull(this._repeater))
                        this._repeater.datasource = datasource;
                }
                /** DOM might change while interacting with the page, this method allows extemporary resets. */
                refresh() {
                    // reset items
                    for (let item of this._items) {
                        item.dom.removeEventListener('click', this._scrollToSelf, false);
                        Pacem.Utils.removeClass(item.dom, Pacem.PCSS + '-toc-item');
                    }
                    //
                    const selector = this.selector;
                    if (Pacem.Utils.isNullOrEmpty(selector)) {
                        this._repeater && (this._repeater.datasource = []);
                        this.hasContent = false;
                        return;
                    }
                    const items = (this.target || document).querySelectorAll(selector), elements = [];
                    for (let j = 0; j < items.length; j++) {
                        const dom = items.item(j);
                        dom.addEventListener('click', this._scrollToSelf, false);
                        Pacem.Utils.addClass(dom, Pacem.PCSS + '-toc-item');
                        elements.push({ dom: dom, top: this._getTop(dom) });
                    }
                    // bootstrap TOC
                    this._items = elements;
                    this._update(Pacem.Utils.scrollTop);
                    this.hasContent = !Pacem.Utils.isNullOrEmpty(elements);
                    // initial state
                    let initialTarget = window.location.hash;
                    if (!Pacem.Utils.isNullOrEmpty(initialTarget)) {
                        // in case of hash
                        setTimeout(() => {
                            this._scrollTo(initialTarget, true);
                        }, 1000);
                    }
                }
            };
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemTocElement.prototype, "selector", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
            ], PacemTocElement.prototype, "offset", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Element })
            ], PacemTocElement.prototype, "target", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemTocElement.prototype, "hasContent", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-repeater')
            ], PacemTocElement.prototype, "_repeater", void 0);
            __decorate([
                Pacem.Debounce(100)
            ], PacemTocElement.prototype, "_onScroll", null);
            __decorate([
                Pacem.Debounce(250)
            ], PacemTocElement.prototype, "refresh", null);
            PacemTocElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-toc', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-scroll-aware on-${Components.ScrollEventName}=":host._onScroll($event)" url="{{ :host.url }}"></${Pacem.P}-scroll-aware>
<${Pacem.P}-repeater><nav class="${Pacem.PCSS}-toc"><template>
    <${Pacem.P}-a on-click=":host._startScrollTo(^item, $event)" css-class="{{ {'toc-focus': ^item.focus} }}" href="{{ ^item.url }}"><${Pacem.P}-text text="{{ ^item.label }}"></${Pacem.P}-text></${Pacem.P}-a>
</template></nav></${Pacem.P}-repeater>`
                })
            ], PacemTocElement);
            UI.PacemTocElement = PacemTocElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            let PacemTunerElement = class PacemTunerElement extends Components.PacemElement {
                constructor() {
                    super();
                    //#region INTERACTIVE
                    this.min = 0.0;
                    this.max = 100.0;
                    this.startDragHandler = (evt) => {
                        if (!this.interactive)
                            return;
                        evt.stopPropagation();
                        let offset = Pacem.Utils.offset(this._canvas);
                        this.pivotPoint = {
                            x: offset.left + this._canvas.clientWidth * .5,
                            y: offset.top + this._canvas.clientHeight * .5
                        };
                        this._setValue({ x: evt.pageX, y: evt.pageY });
                    };
                    this.dragHandler = (evt) => {
                        if (!this.interactive || !this.pivotPoint)
                            return;
                        evt.preventDefault();
                        evt.stopPropagation();
                        var rect = this._canvas.getBoundingClientRect();
                        /*let pt = {
                            x: (evt.clientX - rect.left) / (rect.right - rect.left) * this.canvas.width,
                            y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * this.canvas.height
                        }*/
                        let pt = { x: evt.pageX, y: evt.pageY };
                        this._setValue({ x: evt.pageX, y: evt.pageY });
                    };
                    this.dropHandler = (evt) => {
                        if (!this.interactive || !this.pivotPoint)
                            return;
                        evt.preventDefault();
                        evt.stopPropagation();
                        this.pivotPoint = null;
                    };
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this._canvas.addEventListener('mousedown', this.startDragHandler, false);
                    window.addEventListener('mousemove', this.dragHandler, false);
                    window.addEventListener('mouseup', this.dropHandler, false);
                    this._context2D = this._canvas.getContext('2d');
                    //
                    requestAnimationFrame(() => this._draw(this.min));
                    //
                    this._tween.easing = Pacem.Animations.Easings.sineInOut;
                    this._tween.delay = 500 + (Math.random() * 100 - 100);
                    this._tween.start = this.value > this.min;
                }
                disconnectedCallback() {
                    if (!Pacem.Utils.isNull(this._canvas))
                        this._canvas.removeEventListener('mousedown', this.startDragHandler, false);
                    window.removeEventListener('mousemove', this.dragHandler, false);
                    window.removeEventListener('mouseup', this.dropHandler, false);
                    super.disconnectedCallback();
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'interactive':
                            if (!val)
                                Pacem.Utils.removeClass(this._canvas, Pacem.PCSS + '-interactive');
                            else
                                Pacem.Utils.addClass(this._canvas, Pacem.PCSS + '-interactive');
                            break;
                        case 'round':
                            if (Math.round(val) != val || val < 0)
                                throw `${this.constructor.name}: round value must be an integer greater or equal to zero.`;
                            break;
                        default:
                            // in any other case:
                            this._draw();
                            break;
                    }
                }
                _setValue(pt) {
                    const roundAngle = 2 * Math.PI;
                    var angle = Math.atan2(pt.x - this.pivotPoint.x, -pt.y + this.pivotPoint.y);
                    const round = Math.pow(10, this.round || 0);
                    const angleValue = this.min + ((roundAngle + angle) % roundAngle) * (this.max - this.min) / roundAngle;
                    const value = Math.round(round * angleValue) / round;
                    if (value != this.value) {
                        this.value = value;
                        this.dispatchEvent(new Event("change"));
                    }
                }
                //#endregion
                _draw(value = this.value) {
                    if (this.disabled || Pacem.Utils.isNull(this._context2D))
                        return;
                    let angle = .0;
                    if (value === this.max)
                        angle = 1.0;
                    else if (value !== this.min)
                        angle /* fraction of the round angle */ = (Pacem.Utils.isNullOrEmpty(value) ? .0 : value - this.min) / (this.max - this.min);
                    const cnv = this._canvas, style = getComputedStyle(cnv), ctx = this._context2D, thickness = parseInt(style.strokeWidth || '10px'), maxDim = Math.min(cnv.offsetHeight, cnv.offsetHeight), dim = maxDim;
                    if (dim <= 0)
                        return;
                    // sweep the stage
                    cnv.width = //dim; element.width();
                        cnv.height = dim; //element.height();
                    const color = style.stroke;
                    const defaultBorderColor = 'rgba(255,255,255,.1)';
                    const bgcolor = style.borderColor || defaultBorderColor;
                    const x = cnv.width * .5;
                    const y = cnv.height * .5;
                    const r = Math.min(x, y) - thickness * .5;
                    const mathPI2 = Math.PI * .5;
                    const to = -mathPI2 + 2 * Math.PI * angle;
                    ctx.beginPath();
                    ctx.arc(x, y, r, -mathPI2, to, false);
                    ctx.lineWidth = thickness;
                    // line color
                    ctx.strokeStyle = color;
                    ctx.stroke();
                    // filler
                    ctx.beginPath();
                    ctx.arc(x, y, r, to + Math.PI / 60.0, 1.5 * Math.PI, false);
                    ctx.lineWidth = thickness;
                    // line color
                    ctx.strokeStyle = /* initial style retrieval sort-of fails */ color === 'none' ? defaultBorderColor : bgcolor;
                    ctx.stroke();
                }
            };
            __decorate([
                Pacem.ViewChild('canvas')
            ], PacemTunerElement.prototype, "_canvas", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-tween')
            ], PacemTunerElement.prototype, "_tween", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
            ], PacemTunerElement.prototype, "value", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
            ], PacemTunerElement.prototype, "min", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
            ], PacemTunerElement.prototype, "max", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Boolean })
            ], PacemTunerElement.prototype, "interactive", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
            ], PacemTunerElement.prototype, "round", void 0);
            PacemTunerElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-tuner', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<canvas class="${Pacem.PCSS}-tuner"></canvas><div class="${Pacem.PCSS}-content"><${Pacem.P}-content></${Pacem.P}-content></div>
<${Pacem.P}-tween on-step=":host._draw($event.detail.value)" on-end="this.disabled = true" duration="500" to="{{ :host.value }}" from="{{ :host.min }}"></${Pacem.P}-tween>`
                })
            ], PacemTunerElement);
            UI.PacemTunerElement = PacemTunerElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            const ANIM_TIMEOUT = 500;
            let PacemViewElement = class PacemViewElement extends Components.PacemEventTarget {
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    // url
                    if (name === 'url') {
                        this._manage();
                    }
                    else if (name === 'fetching') {
                        (val ? Pacem.Utils.addClass : Pacem.Utils.removeClass)(this, 'view-fetching');
                    }
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    if (this._isReference(this.url))
                        this._manageRef();
                }
                _isReference(url) {
                    return !Pacem.Utils.isNullOrEmpty(url) && url.trim().startsWith('#');
                }
                _manage() {
                    const debounce = this.debounce || 0;
                    if (this._isReference(this.url)) {
                        // <template>-based
                        clearTimeout(this._fetchHandle);
                        this._fetchHandle = setTimeout((() => this._manageRef()), debounce);
                    }
                    else if (!Pacem.Utils.isNullOrEmpty(this.url)) {
                        // url-based
                        this.fetching = true;
                        clearTimeout(this._fetchHandle);
                        this._fetchHandle = setTimeout((() => this._manageUrl()), debounce);
                    }
                    else /* might be a reset */ {
                        this.innerHTML = '';
                    }
                }
                _manageRef() {
                    const url = this.url, tmpl = document.querySelector('template' + url);
                    // this way, `this._container.innerHTML = ''` instruction will eventually let the page "scroll up"...
                    this.innerHTML = '';
                    cancelAnimationFrame(this._renderHandle);
                    this._renderHandle = requestAnimationFrame(() => {
                        if (Pacem.Utils.isNull(tmpl)) {
                            this.log(Pacem.Logging.LogLevel.Error, `Cannot find template ${url.substr(1)}`);
                            return;
                        }
                        this.appendChild(tmpl.cloneNode(true).content);
                        this._dispatchRender();
                    });
                }
                _manageUrl(url = this.url) {
                    fetch(url, { credentials: 'same-origin' }).then(r => {
                        if ((r.status === 301 || r.status === 302) && this.followRedirects) {
                            this._manageUrl(r.headers.get("Location"));
                        }
                        else if (r.ok || this.renderErrors) {
                            r.text().then((html) => Pacem.Utils.addAnimationEndCallback(this, () => this._manageResult(html), ANIM_TIMEOUT));
                        }
                        // fallback to empty content.
                        else
                            this._manageResult('');
                    });
                }
                _manageResult(result) {
                    // this way, `this._container.innerHTML = ''` instruction will eventually let the page "scroll up"...
                    this.innerHTML = '';
                    cancelAnimationFrame(this._renderHandle);
                    this._renderHandle = requestAnimationFrame(() => {
                        this.innerHTML = result;
                        this.fetching = false;
                        // setting fetching to `false` triggers a css class change that could/should cause a css transition to happen
                        Pacem.Utils.addAnimationEndCallback(this, () => {
                            this._dispatchRender();
                        }, ANIM_TIMEOUT);
                    });
                }
                _dispatchRender() {
                    this.dispatchEvent(new CustomEvent("render"));
                }
            };
            __decorate([
                Pacem.Watch({ reflectBack: true, converter: Pacem.PropertyConverters.String })
            ], PacemViewElement.prototype, "url", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemViewElement.prototype, "fetching", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemViewElement.prototype, "renderErrors", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemViewElement.prototype, "followRedirects", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
            ], PacemViewElement.prototype, "debounce", void 0);
            PacemViewElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-view'
                })
            ], PacemViewElement);
            UI.PacemViewElement = PacemViewElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var UI;
        (function (UI) {
            const HANDLE_CSS = 'window-title';
            let PacemWindowAreaElement = class PacemWindowAreaElement extends Components.PacemIterativeElement {
                constructor() {
                    super(...arguments);
                    this._zIndex = 1;
                    this._startHandler = (evt) => {
                        this._incrementZIndex(evt.detail.element);
                        Pacem.Utils.addClass(evt.detail.element, 'window-rescaling');
                    };
                    this._blurHandler = (evt) => {
                        Pacem.Utils.removeClass(evt.detail.element, 'window-rescaling');
                    };
                    this._focusHandler = (evt) => {
                        this._incrementZIndex(evt.currentTarget);
                    };
                    this._itemPropertyChangeHandler = (evt) => {
                        if (evt.detail.propertyName === 'floating' && evt.detail.currentValue === false) {
                            const item = evt.currentTarget, ndx = this.items.indexOf(item);
                            Pacem.Utils.addClass(item, 'docking-in');
                            this.adapter.select(ndx);
                            Pacem.Utils.addAnimationEndCallback(item, (e) => {
                                Pacem.Utils.removeClass(e, 'docking-in');
                            }, 150);
                        }
                    };
                    this._adapterPagerCallback = (evt) => {
                        const index = evt.detail.index, item = this.items[index];
                        evt.detail.hide = item.hide || item.floating;
                    };
                }
                validate(item) {
                    return item instanceof PacemWindowElement;
                }
                _incrementZIndex(target) {
                    if (this._zIndex != parseInt(target.style.zIndex)) {
                        target.style.zIndex = '' + (++this._zIndex);
                    }
                }
                connectedCallback() {
                    super.connectedCallback();
                    let shell = Pacem.CustomElementUtils.findAncestorShell(this);
                    this._behaviors = [
                        shell.appendChild(this._dragDrop = document.createElement(Pacem.P + '-drag-drop')),
                        shell.appendChild(this._rescale = document.createElement(Pacem.P + '-rescale'))
                    ];
                    this._dragDrop.handleSelector = '.' + HANDLE_CSS;
                    //this._dragDrop.addEventListener(Pacem.UI.DragDropEventType.Init, this._focusHandler, false);
                    this._rescale.addEventListener(Pacem.UI.RescaleEventType.Start, this._startHandler, false);
                    this._rescale.addEventListener(Pacem.UI.RescaleEventType.End, this._blurHandler, false);
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    // adapter (reuse)
                    if (Pacem.Utils.isNull(this.adapter)) {
                        const adapter = this.adapter = this.appendChild(document.createElement(Pacem.P + '-adapter'));
                        Pacem.Utils.addClass(adapter, 'windows-adapter');
                        adapter.labelCallback = (item, _) => {
                            return item.caption;
                        };
                        adapter.swipeEnabled = false;
                        adapter.deselectable = true;
                        adapter.initialize(this);
                    }
                    this.adapter.addEventListener(UI.AdapterPageButtonRefreshEventName, this._adapterPagerCallback, false);
                }
                disconnectedCallback() {
                    if (!Pacem.Utils.isNull(this.adapter)) {
                        this.adapter.removeEventListener(UI.AdapterPageButtonRefreshEventName, this._adapterPagerCallback, false);
                        this.adapter.remove();
                        this.adapter = null;
                    }
                    //this._dragDrop.removeEventListener(Pacem.UI.DragDropEventType.Init, this._focusHandler, false);
                    this._rescale.removeEventListener(Pacem.UI.RescaleEventType.End, this._blurHandler, false);
                    this._rescale.removeEventListener(Pacem.UI.RescaleEventType.Start, this._startHandler, false);
                    for (let b of this._behaviors) {
                        b.remove();
                    }
                    super.disconnectedCallback();
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'index') {
                        this._syncVisibility();
                    }
                }
                register(item) {
                    const retval = super.register(item);
                    if (retval) {
                        item.addEventListener(Pacem.PropertyChangeEventName, this._itemPropertyChangeHandler, false);
                        item.addEventListener('mousedown', this._focusHandler, false);
                        for (let b of this._behaviors) {
                            const ndx = item.behaviors.indexOf(b);
                            if (ndx === -1) {
                                item.behaviors.push(b);
                            }
                        }
                    }
                    return retval;
                }
                unregister(item) {
                    const retval = super.unregister(item);
                    if (retval) {
                        item.removeEventListener(Pacem.PropertyChangeEventName, this._itemPropertyChangeHandler, false);
                        item.removeEventListener('mousedown', this._focusHandler, false);
                        for (let b of this._behaviors) {
                            const ndx = item.behaviors.indexOf(b);
                            if (ndx >= 0) {
                                item.behaviors.splice(ndx, 1);
                            }
                        }
                    }
                    return retval;
                }
                _syncVisibility() {
                    let ndx = 0;
                    for (let item of this.items) {
                        if (ndx === this.index) {
                            Pacem.Utils.addClass(item, 'dock-open');
                        }
                        else {
                            Pacem.Utils.removeClass(item, 'dock-open');
                        }
                        ndx++;
                    }
                }
            };
            PacemWindowAreaElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-window-area'
                })
            ], PacemWindowAreaElement);
            UI.PacemWindowAreaElement = PacemWindowAreaElement;
            let PacemWindowElement = class PacemWindowElement extends Components.PacemIterableElement {
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'minimized' || name === 'floating') {
                        this._syncLayout();
                    }
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this._syncLayout();
                }
                _syncLayout() {
                    (this.minimized ? Pacem.Utils.addClass : Pacem.Utils.removeClass).apply(this, [this, 'window-min']);
                    (this.floating ? Pacem.Utils.removeClass : Pacem.Utils.addClass).apply(this, [this, 'window-dock']);
                }
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemWindowElement.prototype, "caption", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemWindowElement.prototype, "minimized", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemWindowElement.prototype, "floating", void 0);
            PacemWindowElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-window', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<div class="${HANDLE_CSS}">
    <${Pacem.P}-text text="{{ :host.caption || 'Window' }}"></${Pacem.P}-text>
</div>
<div class="window-buttons ${Pacem.PCSS}-buttonset"><div class="buttonset-right">
    <${Pacem.P}-button class="button" on-click=":host.minimized = !:host.minimized" icon-glyph="{{ :host.minimized ? 'maximize' : 'minimize' }}" hide="{{ !:host.floating }}"></${Pacem.P}-button>
    <${Pacem.P}-button class="button" on-click=":host.floating = !:host.floating" css-class="{{ {'buttonset-first': !:host.floating} }}" icon-glyph="{{ :host.floating? 'lock_open' : 'lock' }}"></${Pacem.P}-button>
</div></div>
<div class="window-content"><${Pacem.P}-content></${Pacem.P}-content></div>`
                })
            ], PacemWindowElement);
            UI.PacemWindowElement = PacemWindowElement;
        })(UI = Components.UI || (Components.UI = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
