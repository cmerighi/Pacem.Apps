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
        var Charts;
        (function (Charts) {
            function logN(N, x) {
                return Math.log10(x) / Math.log10(N);
            }
            const MSECS_PER_DAY = 1000 * 60 * 60 * 24;
            function getEvenlySpaced(items, type, min, max, lang, labels = MAX_X_LABELS) {
                var length = items.length;
                const gaps = labels - 1;
                if (type === 'number' || type === 'date') {
                    length = max - min;
                }
                var retval = [];
                var step = 1;
                for (var l = gaps; l > 1; l--) {
                    if ((length % l) === 0) {
                        step = length / l;
                        break;
                    }
                }
                if (step === 1 /* prime number? */ && length > labels)
                    step = length;
                const fnDate = step >= MSECS_PER_DAY ? Date.prototype.toLocaleDateString : Date.prototype.toLocaleTimeString;
                for (var j = 0; j <= length; j += step) {
                    let label;
                    switch (type) {
                        case 'string':
                            label = items[j].label;
                            break;
                        case 'number':
                            label = (min + j) + '';
                            break;
                        case 'date':
                            let date = Pacem.Utils.parseDate(min + j);
                            let fn = (j == 0 && step < MSECS_PER_DAY) ? Date.prototype.toLocaleString : fnDate;
                            label = fn.apply(date, [lang]);
                            break;
                        default:
                            throw 'Not supported.';
                    }
                    retval.push(label);
                }
                return retval;
            }
            function getRoundedBoundaries(a0, a1, step = MAX_Y_LABELS) {
                const magn = logN(step, a1 - a0), rounder = Math.pow(step, Math.floor(magn));
                return {
                    min: Math.floor(a0 / rounder) * rounder,
                    max: Math.ceil(a1 / rounder) * rounder,
                    round: rounder
                };
            }
            /**
             * Returns the anchor points for a Bézier curve.
             * @param p The actual point.
             * @param p0 The previous point, if any.
             * @param p1 The next point, if any.
             */
            function getSplineCtrlPoints(p, p0, p1) {
                let c0 = p, c1 = p;
                const p0Null = Pacem.Utils.isNull(p0), p1Null = Pacem.Utils.isNull(p1);
                if (!(p0Null && p1Null)) {
                    const portion = 3;
                    let m0, m1;
                    if (!p0Null) {
                        m0 = (p.y - p0.y) / (p.x - p0.x);
                    }
                    if (!p1Null) {
                        m1 = (p1.y - p.y) / (p1.x - p.x);
                    }
                    // average slope
                    const m = ((m1 || (m0 || 0)) + (m0 || (m1 || 0))) / 2;
                    const dx0 = p0Null ? 0 : (p.x - p0.x) / portion;
                    const dx1 = p1Null ? 0 : (p1.x - p.x) / portion;
                    c0 = { x: p.x - dx0, y: p.y - dx0 * m };
                    c1 = { x: p.x + dx1, y: p.y + dx1 * m };
                }
                return { c0: c0, c1: c1 };
            }
            let PacemChartSeriesElement = class PacemChartSeriesElement extends Components.PacemItemElement {
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Json })
            ], PacemChartSeriesElement.prototype, "datasource", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemChartSeriesElement.prototype, "label", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemChartSeriesElement.prototype, "color", void 0);
            PacemChartSeriesElement = __decorate([
                Pacem.CustomElement({ tagName: Pacem.P + '-chart-series' })
            ], PacemChartSeriesElement);
            Charts.PacemChartSeriesElement = PacemChartSeriesElement;
            const MAX_X_LABELS = 10;
            const MAX_Y_LABELS = 10;
            const PADDING_PIXELS = 24;
            const GET_VAL = Pacem.CustomElementUtils.getAttachedPropertyValue;
            const SET_VAL = Pacem.CustomElementUtils.setAttachedPropertyValue;
            const DEL_VAL = Pacem.CustomElementUtils.deleteAttachedPropertyValue;
            const SERIES_MAGNITUDE = 'pacem:chart-series:area';
            const SVG_NS = "http://www.w3.org/2000/svg";
            let PacemChartElement = class PacemChartElement extends Components.PacemItemsContainerElement {
                constructor() {
                    super();
                    this._itemPropertyChangedCallback = (evt) => {
                        const propName = evt.detail.propertyName;
                        if (propName === 'datasource'
                            || propName === 'label'
                            || propName === 'cssClass'
                            || propName === 'color') {
                            this.draw();
                        }
                    };
                    this._series = [];
                    this._key = Pacem.Utils.uniqueCode();
                }
                validate(item) {
                    return item instanceof PacemChartSeriesElement;
                }
                register(item) {
                    if (super.register(item)) {
                        item.addEventListener(Pacem.PropertyChangeEventName, this._itemPropertyChangedCallback, false);
                        return true;
                    }
                    return false;
                }
                unregister(item) {
                    if (super.unregister(item)) {
                        item.removeEventListener(Pacem.PropertyChangeEventName, this._itemPropertyChangedCallback, false);
                        return true;
                    }
                    return false;
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'target') {
                        if (this._div != old) {
                            this._div && this._div.remove();
                        }
                        // reset
                        this._div = null;
                        this._body = null; // <- get checked on next draw
                        const eold = old;
                        if (eold) {
                            eold.classList.remove(Pacem.PCSS + '-chart-area');
                            eold.innerHTML = '';
                        }
                        this.draw();
                    }
                    else if (!first && (name === 'items' || name === 'xAxisLabels'))
                        this.draw();
                }
                disconnectedCallback() {
                    this._div && this._div.remove();
                    super.disconnectedCallback();
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this.draw();
                }
                _ensureChartContainer() {
                    if (Pacem.Utils.isNull(this._div)) {
                        let div = this._div = this.target || document.createElement('div');
                        div.classList.add(Pacem.PCSS + '-chart-area');
                        if (div != this.target)
                            this.parentElement.insertBefore(div, this);
                    }
                    return this._div;
                }
                _ensureChartBody(w, h) {
                    if (Pacem.Utils.isNull(this._body)) {
                        let svg = this._body = document.createElementNS(SVG_NS, 'svg');
                        svg.setAttribute('pacem', '');
                        svg.setAttribute('class', Pacem.PCSS + '-category-chart');
                        svg.setAttribute('preserveAspectRatio', 'xMinYMax slice');
                        const g = this._grid = document.createElementNS(SVG_NS, 'svg');
                        g.setAttribute('pacem', '');
                        g.setAttribute('class', 'chart-grid');
                        // put mask on series
                        let defs = document.createElementNS(SVG_NS, 'defs');
                        let mask = this._mask = document.createElementNS(SVG_NS, 'mask');
                        // black (hides)
                        let rect = document.createElementNS(SVG_NS, 'rect');
                        rect.setAttribute('x', '0');
                        rect.setAttribute('y', '0');
                        rect.setAttribute('width', '100%');
                        rect.setAttribute('height', '100%');
                        // white (shows)
                        let rect0 = document.createElementNS(SVG_NS, 'rect');
                        rect0.setAttribute('y', '0');
                        rect0.setAttribute('width', '100%');
                        rect0.setAttribute('fill', '#fff');
                        mask.id = 'gnrc_mask_' + this._key;
                        mask.appendChild(rect);
                        mask.appendChild(rect0);
                        // place mask on series so that lines won't be rendered outside the grid borders
                        //g2.setAttribute('mask', 'url(#' + mask.id + ')');
                        defs.appendChild(mask);
                        svg.appendChild(defs);
                        svg.appendChild(g);
                        this._div.appendChild(svg);
                    }
                    return this._body;
                }
                _chartDataItemToPoint(input, source) {
                    switch (this.xAxisType) {
                        case 'number':
                            return { x: parseFloat(input.label), y: input.value };
                        case 'date':
                            return { x: Pacem.Utils.parseDate(input.label).valueOf(), y: input.value };
                        case 'string':
                            throw { x: source.indexOf(input), y: input.value };
                        default:
                            throw 'Not supported.';
                    }
                }
                _getVirtualGrid(items, minX, maxX, minY, maxY, xAxisType = this.xAxisType, steps = MAX_Y_LABELS) {
                    const rangeY = getRoundedBoundaries(minY, maxY), stepY = rangeY.round;
                    // fill y-axis array
                    var y = [];
                    for (let j = rangeY.min; j <= rangeY.max; j += stepY)
                        y.push(Math.round(j * rangeY.round) / rangeY.round);
                    // fill x-axis array;
                    const x = getEvenlySpaced(this.items[0].datasource, xAxisType, minX, maxX, Pacem.Utils.lang(this));
                    return { x: x, y: y };
                }
                _wipe() {
                    const series = this._series;
                    for (var j = series.length - 1; j >= 0; j--) {
                        series[j].remove();
                    }
                    series.splice(0);
                }
                draw() {
                    if (!this.isReady)
                        return;
                    const div = this._ensureChartContainer();
                    const type = this.type || 'line';
                    const padding = PADDING_PIXELS;
                    // resize all
                    var size = Pacem.Utils.offset(div);
                    if (size.height <= padding || size.width <= padding)
                        return;
                    // items && labels?
                    if (!(this.items && this.items.length)) {
                        this._wipe();
                        return;
                    }
                    const body = this._ensureChartBody(size.width, size.height);
                    // from now on, drawing...
                    this.log(Pacem.Logging.LogLevel.Debug, `Drawing ${type} chart.`);
                    // #region computations
                    const xAxisType = this.xAxisType || 'string';
                    let minY = Number.NaN, maxY = Number.NaN, minX = Number.NaN, maxX = Number.NaN;
                    let stretch = 1;
                    // individuate the min/max x & y in order correctly apply aspect ratio...
                    for (let series of this.items) {
                        let data = series.datasource;
                        if (data && data.length) {
                            let j = 0;
                            for (let item of data) {
                                let pt = this._chartDataItemToPoint(data[j]);
                                minY = isNaN(minY) ? pt.y : Math.min(minY, pt.y);
                                maxY = isNaN(maxY) ? pt.y : Math.max(maxY, pt.y);
                                if (j === 0)
                                    minX = isNaN(minX) ? pt.x : Math.min(minX, pt.x);
                                else if (j === data.length - 1)
                                    maxX = isNaN(maxX) ? pt.x : Math.max(maxX, pt.x);
                                j++;
                            }
                        }
                    }
                    /** virtual grid made of x- and y-axis labels */
                    const grid = this._getVirtualGrid(this.items[0].datasource, minX, maxX, minY, maxY, xAxisType);
                    const topGrid = grid.y[grid.y.length - 1], bottomGrid = grid.y[0];
                    if (topGrid === bottomGrid)
                        return;
                    /** width of the WHOLE series dedicated area */
                    const seriesWidth = size.width - 2 * padding;
                    /** height of the WHOLE series dedicated area */
                    const gridHeight = (size.height - 2 * padding);
                    const seriesHeight = gridHeight * (1 - (topGrid - bottomGrid - (maxY - minY)) / (topGrid - bottomGrid));
                    const seriesY = gridHeight * (topGrid - maxY) / (topGrid - bottomGrid);
                    const seriesY2 = gridHeight * (minY - bottomGrid) / (topGrid - bottomGrid);
                    // if not a `graph`
                    if (xAxisType !== 'number' || (this.aspectRatio !== 'monometric' && this.aspectRatio !== 'logaritmic')) {
                        // consider padding
                        stretch = seriesWidth / seriesHeight;
                        body.setAttribute('height', size.height.toString());
                        body.setAttribute('width', size.width.toString());
                    }
                    body.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);
                    // #endregion
                    // #region render series
                    let iter = 0;
                    // normalize
                    const spanX = maxX - minX, spanY = maxY - minY;
                    const normX = 100 * stretch / spanX, normY = 100 / spanY;
                    const normPadding = 100 * padding / seriesHeight;
                    const buildPoint = (it) => {
                        let p = this._chartDataItemToPoint(it);
                        //pt.x *= normX;
                        p.y *= normY;
                        // Limit as much as possible the magnitude of a number inclued in the svg.
                        // Big numbers "overflow the renderer".
                        p.x = (p.x - minX) * normX;
                        //pt.y = (pt.y - minY) * normY;
                        return p;
                    };
                    for (let series of this.items) {
                        // does the series svg exist?
                        let svg;
                        if (this._series.length > iter) {
                            svg = this._series[iter];
                        }
                        else {
                            svg = document.createElementNS(SVG_NS, 'svg');
                            svg.setAttribute('pacem', '');
                            this._grid.insertAdjacentElement('afterend', svg);
                            let p = document.createElementNS(SVG_NS, 'path');
                            svg.appendChild(document.createElementNS(SVG_NS, 'path'));
                            this._series.push(svg);
                        }
                        // series positioning:
                        /*
                         --------------------------------------
                         |   |--------------------------------|
                         |pad|         series here            |
                         |   |--------------------------------|
                         --------------------------------------
                         |   |             pad                |
                         --------------------------------------
                         */
                        var className = 'chart-series';
                        var fill = type === 'area' || type === 'splinearea';
                        if (fill) {
                            className += ' series-fill';
                        }
                        ;
                        if (!Pacem.Utils.isNullOrEmpty(series.className)) {
                            className += ' ' + series.className;
                        }
                        svg.setAttribute('class', className);
                        svg.setAttribute('x', padding.toString());
                        svg.setAttribute('y', seriesY.toString());
                        svg.setAttribute('width', seriesWidth.toString());
                        svg.setAttribute('height', (seriesHeight + 2 * padding).toString());
                        // pick path as single child element for the series.
                        let path = svg.firstElementChild;
                        path.style.stroke = series.color;
                        if (fill) {
                            let css = getComputedStyle(path);
                            path.style.fill = series.color || css.fill;
                        }
                        else
                            path.style.fill = 'none';
                        let d = '';
                        let data = series.datasource;
                        if (data && data.length) {
                            const splineHere = type === 'spline' || type === 'splinearea';
                            if (splineHere) {
                                // #region SPLINE
                                let pt0, pt, c0;
                                for (let j = 0; j < data.length; j++) {
                                    const item = data[j];
                                    if (!pt) {
                                        pt = buildPoint(item);
                                    }
                                    let pt1;
                                    if (splineHere && j < (data.length - 1)) {
                                        pt1 = buildPoint(data[j + 1]);
                                    }
                                    // accumulate `area` for sorting
                                    let areaSoFar = GET_VAL(series, SERIES_MAGNITUDE, 0);
                                    areaSoFar += item.value;
                                    SET_VAL(series, SERIES_MAGNITUDE, areaSoFar);
                                    var c = getSplineCtrlPoints(pt, pt0, pt1);
                                    d += Pacem.Utils.isNullOrEmpty(d) ? `M${pt.x},${-pt.y} ` : `C${c0.x},${-c0.y} ${c.c0.x},${-c.c0.y} ${pt.x},${-pt.y} `;
                                    // step next
                                    pt0 = pt;
                                    pt = pt1, c0 = c.c1;
                                }
                                // #endregion
                            }
                            else {
                                // #region LINE
                                for (let item of data) {
                                    const pt = buildPoint(item);
                                    // accumulate `area` for sorting
                                    let areaSoFar = GET_VAL(series, SERIES_MAGNITUDE, 0);
                                    areaSoFar += item.value;
                                    SET_VAL(series, SERIES_MAGNITUDE, areaSoFar);
                                    d += Pacem.Utils.isNullOrEmpty(d) ? `M${pt.x},${-pt.y} ` : `L${pt.x},${-pt.y} `;
                                }
                                // #endregion
                            }
                            if (fill) {
                                d += `V${(-minY * normY)} H0 Z`;
                            }
                        }
                        path.setAttribute('d', d);
                        // tick
                        iter++;
                    }
                    // remove exceeding series
                    for (let i = this._series.length - 1; i >= iter; i--) {
                        let svg = this._series.splice(i, 1)[0];
                        svg.remove();
                    }
                    const w0 = 100 * stretch, h0 = 100 + 2 * normPadding, x0 = 0, //minX * normX,
                    y0 = maxY * normY + normPadding;
                    const svbox = `${x0} ${-y0} ${w0} ${h0}`;
                    for (var svg of this._series) {
                        svg.setAttribute('viewBox', svbox);
                    }
                    let mask = this._mask.children.item(1);
                    mask.setAttribute('x', x0.toString());
                    mask.setAttribute('height', (size.height - padding).toString());
                    // #endregion
                    // #region grid
                    this._grid.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);
                    if (grid.x.length <= 1 || grid.y.length <= 1) {
                        for (let j = this._grid.children.length - 1; j >= 0; j--) {
                            this._grid.children.item(j).remove();
                        }
                        return;
                    }
                    let pgrid;
                    if (this._grid.children.length > 0) {
                        pgrid = this._grid.children.item(0);
                    }
                    else {
                        pgrid = document.createElementNS(SVG_NS, 'path');
                        this._grid.appendChild(pgrid);
                    }
                    const tick = padding * .25;
                    let lblCounter = 0;
                    let ensureLabel = (index, x, y, txt) => {
                        const ndx = index + /* <path> is the first child element */ 1;
                        let lbl;
                        if (this._grid.children.length <= ndx) {
                            lbl = document.createElementNS(SVG_NS, 'text');
                            this._grid.appendChild(lbl);
                        }
                        else {
                            lbl = this._grid.children.item(ndx);
                        }
                        lbl.textContent = txt;
                        lbl.setAttribute('x', x.toString());
                        lbl.setAttribute('y', y.toString());
                        return lbl;
                    };
                    let dgrid = `M${padding},${padding} v${gridHeight}`; //H${w}
                    // x
                    let j = 0;
                    const xincr = seriesWidth / (grid.x.length - 1), yincr = gridHeight / (grid.y.length - 1);
                    if (this.xAxisPosition !== 'none') {
                        for (var x of grid.x) {
                            let xcoord = padding + j * xincr;
                            if (this.xAxisPosition === 'top') {
                                dgrid += ` M${xcoord},${padding} v${-tick}`;
                                let lbl = ensureLabel(lblCounter++, xcoord, 0, x);
                                lbl.setAttribute('text-anchor', 'middle');
                                lbl.setAttribute('alignment-baseline', 'hanging');
                            }
                            else {
                                let ycoord = gridHeight + padding;
                                dgrid += ` M${xcoord},${ycoord} v${tick}`;
                                ensureLabel(lblCounter++, xcoord, ycoord + padding, x).setAttribute('text-anchor', 'middle');
                            }
                            j++;
                        }
                    }
                    // y
                    j = 0;
                    for (var y of grid.y) {
                        let ycoord = gridHeight + padding - j * yincr;
                        dgrid += ` M${(padding - tick)},${ycoord} H${(seriesWidth + padding)}`;
                        ensureLabel(lblCounter++, 0, ycoord, y.toString()).removeAttribute('text-anchor');
                        j++;
                    }
                    pgrid.setAttribute('d', dgrid);
                    // exceeding labels?
                    for (let j = this._grid.children.length - 1; j > lblCounter; j--) {
                        this._grid.children.item(j).remove();
                    }
                    // #endregion
                }
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemChartElement.prototype, "type", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Element })
            ], PacemChartElement.prototype, "target", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemChartElement.prototype, "aspectRatio", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemChartElement.prototype, "xAxisType", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemChartElement.prototype, "xAxisPosition", void 0);
            __decorate([
                Pacem.Throttle()
            ], PacemChartElement.prototype, "draw", null);
            PacemChartElement = __decorate([
                Pacem.CustomElement({ tagName: Pacem.P + '-chart' })
            ], PacemChartElement);
            Charts.PacemChartElement = PacemChartElement;
        })(Charts = Components.Charts || (Components.Charts = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Charts;
        (function (Charts) {
            Charts.MANAGED_EVENTS = ['keydown', 'keyup', 'click', 'dblclick', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave', 'mousedown', 'mouseup', 'mousemove', 'contextmenu'];
        })(Charts = Components.Charts || (Components.Charts = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Charts;
        (function (Charts) {
            let PacemPieSliceElement = class PacemPieSliceElement extends Components.PacemItemElement {
                constructor() {
                    super(...arguments);
                    this._broadcastHandler = (e) => {
                        this.emit(e);
                    };
                }
                findContainer() {
                    return Pacem.CustomElementUtils.findAncestorOfType(this, PacemPieChartElement);
                }
                get chart() {
                    return this.container;
                }
                /** Returns the center of mass (point) of this pie/doughnut slice, in absolute coords (pixels). */
                getCenterOfMass() {
                    const area = this.chart && this.chart.area;
                    if (Pacem.Utils.isNull(area)) {
                        return null;
                    }
                    const rect = Pacem.Utils.offset(area), center = { x: rect.width / 2 + rect.left, y: rect.top + rect.height / 2 }, r = Math.min(rect.width, rect.height) * .5;
                    const pos = this.normalizedPolarCoords, angle = PI1_2 - pos.angle;
                    return {
                        y: center.y - r * pos.radius * Math.sin(angle),
                        x: center.x + r * pos.radius * Math.cos(angle)
                    };
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (!first && this.chart && name != 'normalizedPolarCoords')
                        this.chart.draw();
                }
                /** @internal */
                _assignUi(el) {
                    const ui = this._ui = el;
                    Charts.MANAGED_EVENTS.forEach(type => {
                        ui.addEventListener(type, this._broadcastHandler);
                    });
                }
                /** @internal */
                _disposeUi() {
                    if (!Pacem.Utils.isNull(this._ui)) {
                        Charts.MANAGED_EVENTS.forEach(type => {
                            this._ui.addEventListener(type, this._broadcastHandler);
                        });
                    }
                }
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
            ], PacemPieSliceElement.prototype, "value", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemPieSliceElement.prototype, "label", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemPieSliceElement.prototype, "color", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Json })
            ], PacemPieSliceElement.prototype, "normalizedPolarCoords", void 0);
            PacemPieSliceElement = __decorate([
                Pacem.CustomElement({ tagName: Pacem.P + '-pie-slice' })
            ], PacemPieSliceElement);
            Charts.PacemPieSliceElement = PacemPieSliceElement;
            const TWO_PI = Math.PI * 2;
            const PI1_2 = Math.PI * .5;
            let PacemPieChartElement = class PacemPieChartElement extends Components.PacemItemsContainerElement {
                constructor() {
                    super();
                    /** Set a value between 0 and 1, for doughnut appearance. */
                    this.cutout = .0;
                    this._slices = new WeakMap();
                    this._key = Pacem.Utils.uniqueCode();
                }
                validate(item) {
                    return item instanceof PacemPieSliceElement;
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this.draw();
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'target') {
                        this._g = null;
                        this._div && this._div.remove();
                        const eold = old;
                        if (eold) {
                            eold.classList.remove(Pacem.PCSS + '-chart-area');
                            eold.innerHTML = '';
                        }
                        this.draw();
                    }
                    else if (!first && (name === 'cutout' || name === 'items'))
                        this.draw();
                }
                get area() {
                    return this._svg;
                }
                disconnectedCallback() {
                    this._div && this._div.remove();
                    super.disconnectedCallback();
                }
                _ensureArea() {
                    if (Pacem.Utils.isNull(this._g)) {
                        let div = this.target || (this._div = document.createElement('div'));
                        div.classList.add(Pacem.PCSS + '-chart-area');
                        let svg = this._svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        svg.setAttribute('pacem', '');
                        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                        svg.setAttribute('viewBox', '0 0 100 100');
                        //svg.style.height =
                        //    svg.style.width = '100%';
                        svg.classList.add(Pacem.PCSS + '-pie-chart');
                        let defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                        let mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
                        mask.id = 'pie_mask_' + this._key;
                        let rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        rect.setAttribute('x', '0');
                        rect.setAttribute('y', '0');
                        rect.setAttribute('width', '100');
                        rect.setAttribute('height', '100');
                        rect.setAttribute('fill', '#fff');
                        let circle = this._mask = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        circle.setAttribute('cx', '50');
                        circle.setAttribute('cy', '50');
                        let g = this._g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                        g.setAttribute('mask', `url(#${mask.id})`);
                        div.appendChild(svg);
                        mask.appendChild(rect);
                        mask.appendChild(circle);
                        defs.appendChild(mask);
                        svg.appendChild(defs);
                        svg.appendChild(g);
                        this._div &&
                            this.parentElement.insertBefore(div, this);
                    }
                    const cutout = 50.0 * this._safeCutout;
                    this._mask.setAttribute('r', `${cutout}`);
                    return this._g;
                }
                get _safeCutout() {
                    return Math.min(1, Math.max(0, this.cutout)) || .0;
                }
                _drawSlice(path, slice, whole, partial) {
                    const largeFlag = slice.value > .5 * whole ? 1 : 0;
                    const angle = TWO_PI * slice.value / whole;
                    const rot = 360.0 * partial / whole;
                    const x = (slice.value >= whole) ? /* handling single slice */ 49.9 : 50 * (1 + Math.sin(angle));
                    const y = 50 * (1 - Math.cos(angle));
                    const d = `M50,50 V0 A50,50 0 ${largeFlag} 1 ${x} ${y} L50,50 Z`;
                    path.setAttribute('d', d);
                    path.style.fill = slice.color; //.setAttribute('fill', slice.color || (path.getAttribute('fill') || '#000'));
                    path.setAttribute('transform', `rotate(${rot} 50 50)`);
                    // set geometry data
                    var c = this._safeCutout;
                    slice.normalizedPolarCoords = { radius: c + Math.SQRT1_2 * (1.0 - c), angle: /* deg to rad */ Math.PI * rot / 180.0 + angle / 2 };
                }
                _isSliceOk(slice) {
                    return !slice.disabled //&& slice.value > 0
                    ;
                }
                draw() {
                    const g = this._ensureArea(), pCount = g.children.length, chartArea = this._svg.parentElement;
                    let ndx = 0, sum = .0, progress = .0;
                    if (Pacem.Utils.isNullOrEmpty(this.items)) {
                        g.innerHTML = '';
                        Pacem.Utils.removeClass(chartArea, 'chart-has-data');
                    }
                    else {
                        Pacem.Utils.addClass(chartArea, 'chart-has-data');
                        for (let slice of this.items) {
                            if (!this._isSliceOk(slice))
                                continue;
                            sum += slice.value;
                        }
                        if (sum <= 0) {
                            g.innerHTML = '';
                            Pacem.Utils.removeClass(chartArea, 'chart-has-data');
                        }
                        else {
                            for (let slice of this.items) {
                                if (!this._isSliceOk(slice))
                                    continue;
                                let p;
                                if (ndx >= pCount) {
                                    const g_n = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                                    g_n.setAttribute('class', 'chart-series ' + Pacem.PCSS + '-pie-slice' + (Pacem.Utils.isNullOrEmpty(slice.className) ? '' : (' ' + slice.className)));
                                    p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                                    g_n.appendChild(p);
                                    g.appendChild(g_n);
                                    // add listeners (click, mouse-..., touch-...)
                                    slice._assignUi(g_n);
                                    this._slices.set(g_n, slice);
                                }
                                else {
                                    p = g.children.item(ndx).firstElementChild;
                                }
                                if (slice.value > 0) {
                                    this._drawSlice(p, slice, sum, progress);
                                    progress += slice.value;
                                    p.removeAttribute('display');
                                }
                                else {
                                    p.setAttribute('display', 'none');
                                }
                                ndx++;
                            }
                        }
                    }
                    while (ndx < g.children.length) {
                        const slices = this._slices, g_n = g.children.item(ndx);
                        // remove listeners
                        if (slices.has(g_n)) {
                            slices.get(g_n)._disposeUi();
                            slices.delete(g_n);
                        }
                        g.removeChild(g_n);
                    }
                }
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
            ], PacemPieChartElement.prototype, "cutout", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Element })
            ], PacemPieChartElement.prototype, "target", void 0);
            __decorate([
                Pacem.Debounce(true)
            ], PacemPieChartElement.prototype, "draw", null);
            PacemPieChartElement = __decorate([
                Pacem.CustomElement({ tagName: Pacem.P + '-pie-chart' })
            ], PacemPieChartElement);
            Charts.PacemPieChartElement = PacemPieChartElement;
        })(Charts = Components.Charts || (Components.Charts = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
