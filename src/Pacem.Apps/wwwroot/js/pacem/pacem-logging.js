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
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Logging;
        (function (Logging) {
            const DEFAULT_CONFIG = {
                error: true, info: true, warn: true
            };
            let PacemConsoleElement = class PacemConsoleElement extends Components.PacemEventTarget {
                constructor() {
                    super(...arguments);
                    this._config = DEFAULT_CONFIG;
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'configuration')
                        this._config = Pacem.Utils.extend({}, val || {}, DEFAULT_CONFIG);
                }
                log(level, message, category) {
                    try {
                        /* console enabled? better check: you might find cumbersome behaviors on IE/Edge when F12 tools aren't available! */
                        this._log(level, message, category);
                    }
                    catch (e) { }
                }
                _log(level, message, category) {
                    // enabled?
                    if (!this.disabled && this._config[level] === true) {
                        if (category !== this._category) {
                            if (!Pacem.Utils.isNullOrEmpty(this._category))
                                console.groupEnd();
                            if (!Pacem.Utils.isNullOrEmpty(category)) {
                                console.group(category);
                            }
                            this._category = category;
                        }
                        var fn = (m) => { };
                        switch (level) {
                            case Pacem.Logging.LogLevel.Debug:
                                fn = console.debug;
                                break;
                            case Pacem.Logging.LogLevel.Error:
                                fn = console.error;
                                break;
                            case Pacem.Logging.LogLevel.Info:
                                fn = console.info;
                                break;
                            case Pacem.Logging.LogLevel.Trace:
                                fn = console.trace;
                                break;
                            case Pacem.Logging.LogLevel.Warn:
                                fn = console.warn;
                                break;
                            case Pacem.Logging.LogLevel.Log:
                                fn = console.log;
                                break;
                        }
                        fn(new Date().toISOString() + ': ' + message);
                    }
                }
            };
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Json })
            ], PacemConsoleElement.prototype, "configuration", void 0);
            PacemConsoleElement = __decorate([
                Pacem.CustomElement({ tagName: Pacem.P + '-console' })
            ], PacemConsoleElement);
            Logging.PacemConsoleElement = PacemConsoleElement;
        })(Logging = Components.Logging || (Components.Logging = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Logging;
        (function (Logging) {
            const DEFAULT_DATA = { current: 0, count: 0, average: 0, max: Number.MIN_VALUE, min: Number.MAX_VALUE };
            class PacemTrackerElement extends Components.PacemEventTarget {
                constructor() {
                    super();
                    this.data = DEFAULT_DATA;
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'entry')
                        this._update(val).then(t => this.data = t);
                }
                _update(ne) {
                    //var deferred = DeferPromise.defer<TrackingData>();
                    let fn = () => {
                        const data = this.data, min = Math.min(ne, data.min), max = Math.max(ne, data.max), count = data.count + 1, average = (data.count * data.average + ne) / count;
                        return { count: count, min: min, max: max, average: average, current: ne };
                    };
                    return Pacem.Utils.fromResultAsync(fn);
                    //return Utils.fromResult/*Async*/(fn());
                }
                reset() {
                    this.data = DEFAULT_DATA;
                }
            }
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Json })
            ], PacemTrackerElement.prototype, "data", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
            ], PacemTrackerElement.prototype, "entry", void 0);
            __decorate([
                Pacem.Concurrent()
            ], PacemTrackerElement.prototype, "_update", null);
            Logging.PacemTrackerElement = PacemTrackerElement;
        })(Logging = Components.Logging || (Components.Logging = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Logging;
        (function (Logging) {
            let PacemFpsElement = class PacemFpsElement extends Logging.PacemTrackerElement {
                constructor() {
                    super();
                }
                _start(t0 = Date.now()) {
                    this._handle = requestAnimationFrame(() => {
                        const t1 = Date.now(), msecs = t1 - t0;
                        // sets new entry
                        this.entry = Math.min(60, 1000.0 / msecs);
                        this._start(t1);
                    });
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this._start();
                }
                disconnectedCallback() {
                    cancelAnimationFrame(this._handle);
                    super.disconnectedCallback();
                }
            };
            PacemFpsElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-fps'
                })
            ], PacemFpsElement);
            Logging.PacemFpsElement = PacemFpsElement;
        })(Logging = Components.Logging || (Components.Logging = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
