/**
 * pacem v0.9.0-byblos (https://js.pacem.it)
 * Copyright 2020 Pacem (https://pacem.it)
 * Licensed under MIT
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/// <reference path="events.ts" />
var Pacem;
(function (Pacem) {
    Pacem.Type = Function;
    ;
    // #region CONSTS
    Pacem.WATCH_PROPS_VAR = 'pacem:properties';
    Pacem.INSTANCE_BINDINGS_VAR = 'pacem:custom-element:bindings';
    Pacem.INSTANCE_HOST_VAR = 'pacem:custom-element:host';
    // #endregion
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    class DeferPromise {
        constructor() {
            this.deferred = null;
            var me = this;
            me.promise = new Promise(function (resolve, reject) {
                me.deferred = { 'resolve': resolve, 'reject': reject, 'promise': me };
            });
        }
        then(onCompleted, onFailed) {
            return this.promise.then(onCompleted, onFailed);
        }
        /**
         * Occurs whenever the promise concludes (either after completion or error).
         * @param {Function } callback
         */
        finally(callback) {
            this.promise.then(callback, callback);
            return this;
        }
        success(callback) {
            this.promise.then(callback, null);
            return this;
        }
        error(callback) {
            this.promise.then(null, callback);
            return this;
        }
        static defer() {
            var q = new DeferPromise();
            return q.deferred;
        }
    }
    Pacem.DeferPromise = DeferPromise;
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    class DeepCloner {
        constructor() {
        }
        static clone(obj) {
            return new DeepCloner()._clone(obj);
        }
        _clone(obj) {
            let seen = new WeakMap();
            function clone(obj) {
                if (typeof obj === 'object' && obj !== null
                    && /* DOM elements won't be deep-cloned */ !(obj instanceof Element)) {
                    if (Array.isArray(obj)) {
                        return obj.map(clone);
                    }
                    else if (obj instanceof Date) {
                        return new Date(obj.valueOf());
                    }
                    else {
                        if (seen.has(obj)) {
                            return seen.get(obj);
                        }
                        else {
                            let shallow2Deep = Object.assign({}, obj);
                            seen.set(obj, shallow2Deep);
                            Object.keys(shallow2Deep).forEach(k => { shallow2Deep[k] = clone(obj[k]); });
                            return shallow2Deep;
                        }
                    }
                }
                return obj;
            }
            return clone(obj);
        }
    }
    Pacem.DeepCloner = DeepCloner;
})(Pacem || (Pacem = {}));
/// <reference path="deepcloner.ts" />
var Pacem;
(function (Pacem) {
    const REF_ID = '$refId';
    /** How functions get serialized. */
    let JsonFunctionConversion;
    (function (JsonFunctionConversion) {
        /** Skip functions (default). */
        JsonFunctionConversion[JsonFunctionConversion["Ignore"] = 0] = "Ignore";
        /** Functions get referenced from a state in the current DOM. Not suitable for backups or long-term dehydrations. */
        JsonFunctionConversion["Reference"] = "reference";
        /** Function gets stringified and then eval(uated) while dehydrating. Functions with a state (impure) might not working properly when used on the dehydrated side. */
        JsonFunctionConversion["Plain"] = "plain";
    })(JsonFunctionConversion = Pacem.JsonFunctionConversion || (Pacem.JsonFunctionConversion = {}));
    ;
    class JsonFnStore {
        static store(fn) {
            const weak = this._jsonFnWeakMap;
            if (!weak.has(fn)) {
                const key = Pacem.Utils.uniqueCode();
                weak.set(fn, key);
                this._jsonFnMap.set(key, fn);
            }
            return weak.get(fn);
        }
        static retrieve(key) {
            return this._jsonFnMap.get(key);
        }
        static remove(key) {
            const fn = this.retrieve(key);
            this._jsonFnMap.delete(key);
            this._jsonFnWeakMap.delete(fn);
        }
    }
    JsonFnStore._jsonFnWeakMap = new WeakMap();
    JsonFnStore._jsonFnMap = new Map();
    class Json {
        constructor(_options) {
            this._options = _options;
        }
        static serialize(obj, options) {
            return new Json(options)._serialize(obj);
        }
        static deserialize(json) {
            return new Json()._deserialize(json);
        }
        _serialize(obj) {
            let clone = Pacem.DeepCloner.clone(obj);
            let keys = [REF_ID];
            let flat = this._flatten(clone, 0, null, keys);
            return JSON.stringify(flat, keys.sort());
        }
        _deserialize(json) {
            let hasRefs = false;
            let obj = JSON.parse(json, (key, value) => {
                const elPattern = /^\$<#(.+)>$/, fnPattern = /^\$<fn:([^\x05]+)>$/, // <- Firefox workaround for missing 's' flag implementation
                // fnPattern = /^\$<fn:(.+)>$/s,
                fnRefPattern = /^\$<fn#(.+)>$/;
                let arr;
                if (key === REF_ID) {
                    hasRefs = true;
                }
                else if (typeof value === 'string') {
                    // element?
                    if ((arr = elPattern.exec(value)) && arr.length > 1) {
                        return document.getElementById(arr[1]);
                    }
                    else 
                    // function (flat)
                    if ((arr = fnPattern.exec(value)) && arr.length > 1) {
                        return eval(arr[1]);
                    }
                    else 
                    // function (ref)
                    if ((arr = fnRefPattern.exec(value)) && arr.length > 1) {
                        return JsonFnStore.retrieve(arr[1]);
                    }
                }
                return value;
            });
            if (hasRefs) {
                return this._revive(obj);
            }
            return obj;
        }
        _flatten(obj, increment = 0, seen, keys) {
            var _a;
            seen = seen || new WeakSet();
            keys = keys || [];
            if (obj instanceof Element) {
                if (!obj.id) {
                    return;
                }
                return `$<#${obj.id}>`;
            }
            else if (typeof obj === 'object' && obj != null && !(obj instanceof Date)) {
                if (Array.isArray(obj)) {
                    return obj.map(i => this._flatten(i, increment, seen, keys));
                }
                else {
                    // very object
                    if (seen.has(obj)) {
                        return (obj[REF_ID] = obj[REF_ID] || ('$#ref_' + (increment++)));
                    }
                    else {
                        seen.add(obj);
                        Object.keys(obj).forEach(k => {
                            if (keys.indexOf(k) === -1) {
                                keys.push(k);
                            }
                            obj[k] = this._flatten(obj[k], increment, seen, keys);
                        });
                        return obj;
                    }
                }
            }
            else if (typeof obj === 'function') {
                switch ((_a = this._options) === null || _a === void 0 ? void 0 : _a.functions) {
                    case JsonFunctionConversion.Reference:
                        const key = JsonFnStore.store(obj);
                        return '$<fn#' + key + '>';
                    case JsonFunctionConversion.Plain:
                        return '$<fn:' + obj + '>';
                    default:
                        return undefined;
                }
            }
            return obj;
        }
        _revive(obj) {
            let hashTable = {};
            const refPattern = /^\$#ref_(.+)$/;
            function revive(entity) {
                if (typeof entity === 'object' && entity !== null) {
                    if (Array.isArray(entity)) {
                        return entity.map(revive);
                    }
                    else {
                        if (REF_ID in entity) {
                            hashTable[entity[REF_ID]] = entity;
                            delete entity[REF_ID];
                        }
                        Object.keys(entity).forEach(k => {
                            entity[k] = revive(entity[k]);
                        });
                    }
                }
                else if (typeof entity === 'string' && refPattern.test(entity)) {
                    let arr = refPattern.exec(entity);
                    return hashTable[arr[0]];
                }
                return entity;
            }
            return revive(obj);
        }
    }
    Pacem.Json = Json;
})(Pacem || (Pacem = {}));
Number.prototype.toBase62 = function () {
    var alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    var temp = this;
    var sb = '';
    while (temp != 0) {
        var mod = temp % 62;
        sb = alphabet.charAt(mod) + sb;
        temp = Math.floor(temp / 62);
    }
    return sb;
};
Number.prototype.toBase36 = function () {
    return this.toString(36);
};
/// <reference path="expression.ts" />
/// <reference path="promise.ts" />
/// <reference path="trees/json.ts" />
/// <reference path="number_extensions.ts" />
/// <reference path="../../dist/js/pacem-foundation.d.ts" />
var Pacem;
(function (Pacem) {
    const JSON_DATE_PATTERN = /^\/Date\([\d]+\)\/$/i;
    const PACEM_CORE_DEFAULT = 'pacem';
    const DEFAULT_DOWNLOAD_FILENAME = 'download';
    Pacem.stopPropagationHandler = (evt) => {
        evt.stopPropagation();
    };
    Pacem.preventDefaultHandler = (evt) => {
        evt.preventDefault();
    };
    Pacem.avoidHandler = (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
    };
    class Utils {
        static get core() {
            const root = window['Pacem'];
            var id = (root && root.Configuration && root.Configuration.core) || PACEM_CORE_DEFAULT;
            return window[id] = window[id] || {};
        }
        static get customElements() {
            return window['customElements'];
        }
        // #region GENERAL
        static uniqueCode() {
            var pacem = this.core;
            var seed = pacem.__currentSeed || new Date().valueOf();
            pacem.__currentSeed = ++seed;
            return seed.toBase62();
        }
        static parseDate(input) {
            let d;
            if (typeof input === 'string') {
                if (JSON_DATE_PATTERN.test(input))
                    d = parseInt(input.substring(6));
                else
                    d = Date.parse(input);
                return new Date(d);
            }
            else if (typeof input === 'number') {
                return new Date(input);
            }
            else
                return input;
        }
        static copyToClipboard(input) {
            const deferred = Pacem.DeferPromise.defer();
            const el = document.createElement('textarea');
            el.value = input;
            el.style.opacity = "0";
            document.body.appendChild(el);
            try {
                el.select();
                document.execCommand('copy');
                el.remove();
                deferred.resolve();
            }
            catch (e) {
                deferred.reject(e);
            }
            return deferred.promise;
        }
        static colorize(elementOrRgb, rgb) {
            const hsl0 = { h: 38, s: .245, l: .6 };
            var realRgb, rgba, filter, element;
            if (elementOrRgb instanceof HTMLElement) {
                realRgb = rgb;
            }
            else {
                realRgb = elementOrRgb;
            }
            // rgba
            if (typeof realRgb === 'string') {
                rgba = Pacem.Colors.parse(realRgb);
            }
            else {
                rgba = { r: realRgb[0], g: realRgb[1], b: realRgb[2] };
            }
            const hsl = Pacem.Colors.hsl(rgba);
            filter = `brightness(50%) sepia(1) hue-rotate(${(hsl.h - hsl0.h)}deg) saturate(${(1.0 + (hsl.s - hsl0.s))}) brightness(${(1.0 + (hsl.l - hsl0.l))})`;
            if (realRgb === rgb) {
                element.style.filter = filter;
            }
            else {
                return filter;
            }
        }
        static cssEscape(input) {
            return escape(input).replace('%', '\\');
        }
        static leftPad(v, targetLength, padChar) {
            let retval = v.toString();
            while (retval.length < targetLength)
                retval = padChar + retval;
            return retval;
        }
        // #endregion
        // #region blob/files...
        static loadImage(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = src;
                if (img.complete) {
                    resolve(img);
                }
                else {
                    img.onload = (evt) => {
                        resolve(img);
                    };
                    img.onerror = (evt) => {
                        reject();
                    };
                }
            });
        }
        // thanks to @cuixiping: http://stackoverflow.com/questions/23150333
        static blobToDataURL(blob) {
            return new Promise((resolve, _) => {
                var a = new FileReader();
                a.onload = (e) => { resolve(e.target.result); };
                a.readAsDataURL(blob);
            });
        }
        static dataURLToBlob(dataurl) {
            var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], { type: mime });
        }
        static textToBlob(content) {
            return new Blob([content], { type: 'text/plain' });
        }
        /**
         * Resizes an image when exceeding the provided size constraints.
         * @param img {Blob} Input image
         * @param maxWidth {number} Width constraint
         * @param maxHeight {number} Height constraint
         */
        static resizeImage(img, maxWidth, maxHeight, quality) {
            var deferred = Pacem.DeferPromise.defer();
            Utils.blobToDataURL(img)
                .then(Utils.loadImage)
                .then(el => {
                const origWidth = el.width, origHeight = el.height;
                let cnv = document.createElement('canvas');
                cnv.width = origWidth;
                cnv.height = origHeight;
                let ctx = cnv.getContext('2d');
                //ctx.drawImage(el, 0, 0);
                if (origWidth > maxWidth
                    || origHeight > maxHeight) {
                    const origRatio = origWidth / origHeight, targetRatio = maxWidth / maxHeight;
                    let targetHeight, targetWidth;
                    if (targetRatio < origRatio) {
                        targetWidth = maxWidth;
                        targetHeight = maxWidth / origRatio;
                    }
                    else {
                        targetHeight = maxHeight;
                        targetWidth = maxHeight * origRatio;
                    }
                    cnv.width = targetWidth;
                    cnv.height = targetHeight;
                    const jpeg = quality > 0 && quality <= 1;
                    if (jpeg) {
                        ctx.fillStyle = '#000';
                        ctx.fillRect(0, 0, cnv.width, cnv.height);
                    }
                    Utils.cropImageOntoCanvas(el, ctx);
                    let newUrl;
                    if (jpeg)
                        newUrl = ctx.canvas.toDataURL("image/jpeg", quality);
                    else
                        newUrl = ctx.canvas.toDataURL();
                    deferred.resolve(Utils.dataURLToBlob(newUrl));
                }
                else {
                    deferred.resolve(img);
                }
            }, _ => {
                // image loading error caught...
            });
            return deferred.promise;
        }
        /**
         * Crops an image having the provided url (might be a dataURL) into another having the provided size
         * @param url
         * @param width
         * @param height
         * @param ctx
         */
        static cropImage(url, width, height, quality) {
            var deferred = Pacem.DeferPromise.defer();
            let el = new Image();
            el.crossOrigin = 'anonymous';
            el.onload = function (ev) {
                let cnv = document.createElement('canvas');
                let ctx = cnv.getContext('2d');
                if (width)
                    cnv.width = width;
                if (height)
                    cnv.height = height;
                //
                const jpeg = quality > 0 && quality <= 1;
                if (jpeg) {
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, cnv.width, cnv.height);
                }
                Utils.cropImageOntoCanvas(el, ctx);
                deferred.resolve(jpeg ? cnv.toDataURL('image/jpeg', quality) : cnv.toDataURL());
            };
            el.src = url;
            return deferred.promise;
        }
        static getUserMediaFunctions() {
            var _getUserMedia = [];
            let methods = [navigator['getUserMedia'], navigator['webkitGetUserMedia'], navigator['msGetUserMedia'], navigator['mozGetUserMedia']];
            let fns = methods.filter(function (fn, j) { return typeof fn == 'function'; });
            if (fns.length)
                _getUserMedia = fns;
            return _getUserMedia;
        }
        /**
         * Crops the snapshot of a drawable element onto a provided canvas context. It gets centered in the area and cropped (`cover`-like behavior).
         * @param el drawable element
         * @param ctx canvas context
         * @param sourceWidth forced source width
         * @param sourceHeight forced source height
         */
        static cropImageOntoCanvas(el, ctx, sourceWidth, sourceHeight) {
            ctx.imageSmoothingEnabled =
                ctx['mozImageSmoothingEnabled'] =
                    ctx['oImageSmoothingEnabled'] =
                        ctx['webkitImageSmoothingEnabled'] =
                            true;
            //
            let tgetW = ctx.canvas.width /*= parseFloat(scope.thumbWidth)*/;
            let tgetH = ctx.canvas.height /*= parseFloat(scope.thumbHeight)*/;
            let cnvW = tgetW, cnvH = tgetH;
            let w = sourceWidth || 1.0 * el.width, h = sourceHeight || 1.0 * el.height;
            //console.log('img original size: ' + w + 'x' + h);
            var ratio = w / h;
            var tgetRatio = tgetW / tgetH;
            if (tgetRatio > ratio) {
                // crop vertically
                var f = tgetW / w;
                tgetH = f * h;
                ctx.drawImage(el, 0, .5 * (-tgetH + cnvH), cnvW, tgetH);
            }
            else {
                // crop horizontally
                var f = tgetH / h;
                tgetW = f * w;
                ctx.drawImage(el, -Math.abs(.5 * (-tgetW + cnvW)), 0, tgetW, cnvH);
            }
        }
        static snapshotElement(el) {
            var data = el.outerHTML;
            if (el instanceof HTMLElement) {
                var doc = document.implementation.createHTMLDocument('');
                doc.write(el.outerHTML);
                doc.documentElement.setAttribute('xmlns', doc.documentElement.namespaceURI);
                const html = new XMLSerializer().serializeToString(doc);
                const node = document.evaluate(".//" + el.localName, doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                node.setAttribute('xmlns', doc.documentElement.namespaceURI);
                node.style.cssText = getComputedStyle(el).cssText;
                // Get well-formed markup
                var data = '<svg xmlns="http://www.w3.org/2000/svg" width="' + el.offsetWidth + '" height="' + el.offsetHeight + '">' +
                    '<foreignObject width="100%" height="100%">' +
                    node.outerHTML +
                    '</foreignObject>' +
                    '</svg>';
            }
            var DOMURL = window.URL || window['webkitURL'] || window;
            var img = new Image();
            var svg = new Blob([data], { type: 'image/svg+xml' });
            var url = DOMURL.createObjectURL(svg);
            img.src = url;
            return img;
        }
        static download(arg0, arg1, mime = "application/download") {
            return __awaiter(this, void 0, void 0, function* () {
                if (typeof arg0 === 'string') {
                    const url = arg0;
                    let options = {}, filename;
                    if (!Utils.isNullOrEmpty(arg1)) {
                        if (typeof arg1 === 'object') {
                            options = { credentials: arg1.credentials, headers: arg1.headers };
                            filename = arg1.filename || filename;
                            mime = arg1.mime || mime;
                        }
                        else {
                            filename = arg1;
                        }
                    }
                    var response = yield fetch(url, options);
                    if (response.ok) {
                        if (Utils.isNullOrEmpty(filename)) {
                            const headerName = 'Content-Disposition';
                            if (response.headers.has(headerName)) {
                                const header = response.headers.get(headerName), results = /^attachment; filename=([^;]+)(;|$)/.exec(header);
                                if (results.length > 1) {
                                    filename = results[1];
                                }
                            }
                            else {
                                filename = DEFAULT_DOWNLOAD_FILENAME;
                            }
                        }
                        var blob = yield response.blob();
                        const fn = filename.split(/[\\\/]/g).join('_');
                        return Utils.download(blob, fn);
                    }
                }
                else {
                    const content = arg0, filename = (typeof arg1 === 'string' && arg1) || DEFAULT_DOWNLOAD_FILENAME, fanchor = document.createElement('a');
                    fanchor.setAttribute('href', window.URL.createObjectURL(content));
                    fanchor.setAttribute('download', filename);
                    if (document.createEvent) {
                        var event = document.createEvent('MouseEvents');
                        event.initEvent('click', true, true);
                        fanchor.dispatchEvent(event);
                    }
                    else {
                        fanchor.click();
                    }
                }
            });
        }
        // #endregion
        // #region DOM
        static isDOMReady() {
            return document.readyState === 'interactive'
                || document.readyState === 'complete';
        }
        static onDOMReady(listener) {
            window.addEventListener('load', listener, false);
        }
        /**
         * Moves all the source element children to the target element and returns them as an array of nodes.
         * @param source Source element.
         * @param target Target element.
         */
        static moveChildren(source, target) {
            return Utils.moveItems(source.childNodes, target);
        }
        /**
         * Moves specific nodes to the target element and returns them as an array of nodes.
         * @param nodes Nodes to move.
         * @param target Target element.
         */
        static moveItems(nodes, target) {
            let dom = [], ref;
            for (let j = nodes.length - 1; j >= 0; j--) {
                let item = nodes instanceof NodeList ? nodes.item(j) : nodes[j];
                target.insertBefore(item, ref);
                dom.unshift(item);
                ref = item;
            }
            return dom;
        }
        static is(el, selector) {
            return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector)
                .call(el, selector);
        }
        static lang(el) {
            return el.lang || document.documentElement.lang || navigator.language;
        }
        static jsonSortStringify(obj) {
            if (Utils.isNull(obj)) {
                return obj;
            }
            return Utils.Json.stringify(obj);
        }
        static cookies(cookie = document.cookie) {
            const cookies = (cookie || '').split(';'), retval = {};
            for (var pair of cookies) {
                const keyval = pair.split('=');
                if (keyval.length < 2)
                    continue;
                const key = (keyval[0] || '').trim(), value = (keyval[1] || '').trim();
                Object.defineProperty(retval, key, {
                    configurable: false, enumerable: true, writable: false,
                    value: decodeURIComponent(value.split('+').join(' '))
                });
            }
            return retval;
        }
        static hasClass(el, className) {
            if (el.classList)
                return el.classList.contains(className);
            else
                return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
        }
        static isVisible(el) {
            return getComputedStyle(el).visibility !== 'hidden' && (el.clientWidth > 0 || el.clientWidth > 0);
        }
        static addClass(el, className) {
            const css = className.trim();
            if (el.classList)
                DOMTokenList.prototype.add.apply(el.classList, css.split(' '));
            else
                el.setAttribute('class', el.className + ' ' + css);
        }
        static removeClass(el, className) {
            const css = className.trim();
            if (el.classList)
                DOMTokenList.prototype.remove.apply(el.classList, css.split(' '));
            else
                el.setAttribute('class', el.className.replace(new RegExp('(^|\\b)' + css.split(' ').join('|') + '(\\b|$)', 'gi'), ' '));
        }
        static offset(el) {
            var rect = el.getBoundingClientRect();
            return {
                top: Math.round(rect.top) + Utils.scrollTop,
                left: Math.round(rect.left) + Utils.scrollLeft,
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            };
        }
        static offsetRect(el) {
            var rect = el.getBoundingClientRect();
            return {
                y: Math.round(rect.top) + Utils.scrollTop,
                x: Math.round(rect.left) + Utils.scrollLeft,
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            };
        }
        static deserializeTransform(style) {
            var a = 1, b = 0, c = 0, d = 1, x = 0, y = 0, matches = /^matrix\((.*)\)$/.exec(style.transform), mij;
            //matrix(1, 0, 0, 1, 2, 4) 
            if (matches && matches.length > 1 && (mij = matches[1].split(',')).length == 6) {
                // scale + rot
                a = parseFloat(mij[0]);
                b = parseFloat(mij[1]);
                c = parseFloat(mij[2]);
                d = parseFloat(mij[3]);
                // transl
                x += parseFloat(mij[4]);
                y += parseFloat(mij[5]);
            }
            return { a: a, b: b, c: c, d: d, e: x, f: y };
        }
        static get scrollTop() {
            return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        }
        static get scrollLeft() {
            return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0;
        }
        static get windowSize() {
            let win = window;
            return {
                width: win.innerWidth || win.document.documentElement.clientWidth || win.document.body.clientWidth || 0,
                height: win.innerHeight || win.document.documentElement.clientHeight || win.document.body.clientHeight || 0
            };
        }
        /**
         * Adds a callback at the end of a CSS animation/transition for a given element (execute once).
         * @param element The very element that has to trigger the animation/transitionend event.
         * @param callback Then callback.
         * @param timeout Fallback timeout (ms) in case the animation/transitionend event won't fire.
         */
        static addAnimationEndCallback(element, callback, timeout = 500) {
            const fn = (e) => {
                if (!e || e.target == element) {
                    clearTimeout(handle);
                    element.removeEventListener('animationend', fn, false);
                    element.removeEventListener('transitionend', fn, false);
                    callback.apply(this, [element]);
                }
            };
            element.addEventListener('animationend', fn, false);
            element.addEventListener('transitionend', fn, false);
            // fallback in case animation is missing
            const handle = setTimeout(fn, timeout);
        }
        /**
         * Promisifies the addAnimationEndCallback function.
         * @param element The very element that has to trigger the animation/transitionend event.
         * @param timeout Fallback timeout (ms) in case the animation/transitionend event won't fire.
         */
        static waitForAnimationEnd(element, timeout = 500) {
            return new Promise((resolve, _) => {
                Utils.addAnimationEndCallback(element, () => {
                    resolve();
                }, timeout);
            });
        }
        /**
         * Waits until the provided timespan elapses.
         * @param msecs timespan in milliseconds
         */
        static idle(msecs) {
            return new Promise((resolve, _) => {
                setTimeout(() => resolve(), msecs);
            });
        }
        /**
         * Increases a callback loop call until cancelation is called.
         * @param callback Callback looped.
         * @param interval First callback call delay in ms (default 500).
         * @param pace Acceleration in ms per loop (default 5).
         * @param min Minimum loop rate in ms (default 20).
         *
         * Use case/example: while keeping a button pressed, the related callback execution increases in frequency.
         */
        static accelerateCallback(callback, interval = 500, pace = 5, min = 20) {
            let token = { cancel: false }, int = interval, last = pace + min;
            let fn = () => {
                callback(token);
                if (!token.cancel) {
                    setTimeout(fn, int);
                    if (int < last) {
                        int = min;
                    }
                    else {
                        int -= pace;
                    }
                }
            };
            fn();
        }
        // #endregion
        // #region other
        static isEmpty(obj) {
            if (Utils.Dates.isDate(obj))
                return false;
            for (var _ in obj)
                return false;
            try {
                return JSON.stringify({}) === Utils.Json.stringify(obj);
            }
            catch (e) {
                return false;
            }
        }
        static isNull(val) {
            return val === null || val === undefined;
        }
        static isArray(val) {
            return Array.isArray(val);
        }
        static isNullOrEmpty(val) {
            return Utils.isNull(val) || val === '' || (Utils.isArray(val) && val.length == 0) || (typeof val === 'object' && Utils.isEmpty(val));
        }
        /**
         * It is a `valueOf()` based comparison.
         * @param v1 term 1
         * @param v2 term 2
         */
        static areSemanticallyEqual(v1, v2) {
            const sv1 = v1 && v1.valueOf && v1.valueOf();
            const sv2 = v2 && v2.valueOf && v2.valueOf();
            return sv1 === sv2;
        }
        static extend(target, ...sources) {
            for (var source of sources) {
                var obj = Object; // <- dodging the es5 compiler // TODO: replace in a future.
                if (typeof obj.assign != 'function') {
                    obj.assign = function (target) {
                        'use strict';
                        if (target == null) {
                            throw new TypeError('Cannot convert undefined or null to object');
                        }
                        target = obj(target);
                        if (source != null) {
                            for (var key in source) {
                                if (obj.prototype.hasOwnProperty.call(source, key)) {
                                    target[key] = source[key];
                                }
                            }
                        }
                    };
                }
                else
                    obj.assign(target, source);
            }
            return target;
        }
        static clone(obj) {
            if (obj === undefined)
                return undefined;
            return Pacem.DeepCloner.clone(obj);
        }
        static fromResult(v) {
            return Promise.resolve(v);
        }
        static fromResultAsync(task) {
            return new Promise(resolve => requestAnimationFrame(() => resolve(task())));
        }
        /**
         * Ensures the proper parsing of Web API results, including deprecated/legacy Pacem wrapped results.
         */
        static getApiResult(json) {
            if (typeof json === 'object'
                && !Utils.isNull(json)
                && json.hasOwnProperty('success')) {
                switch (json.success) {
                    case true:
                        if (json.hasOwnProperty('result')) {
                            return json.result;
                        }
                        break;
                    case false:
                        if (json.hasOwnProperty('error')) {
                            return null;
                        }
                        break;
                }
            }
            return json;
        }
        //#endregion
        /**
         * Returns a formatted HTML string coherent with the provided input string (might be inline-svg, font-awesome class, image url (.png, .jpg) or material-icon ligature.
         * @param icon
         */
        static renderHtmlIcon(icon) {
            const SVG = /^\s*<svg\s/;
            const FA = /^fa[brs]?\s+fa-/;
            const URL = /^(https?:\/\/|\/\/)?.+\.(png|jpe?g)$/;
            // svg?
            if (SVG.test(icon)) {
                return icon;
            }
            // font-awesome?
            if (FA.test(icon)) {
                return `<i class="${icon}"></i>`;
            }
            // image url?
            if (URL.test(icon)) {
                return `<img src="${icon}" />`;
            }
            // assume material icon as default
            const parts = icon.trim().split(' ');
            const ligature = parts[0];
            const css = parts.length > 1 ? ' ' + parts.slice(1).join(' ') : '';
            return `<i class="${Pacem.PCSS}-icon${css}">${ligature}</i>`;
        }
    }
    // json-dedicated
    Utils.Json = {
        stringify: Pacem.Json.serialize,
        parse: Pacem.Json.deserialize
    };
    // dates-dedicated
    Utils.Dates = {
        parse: Utils.parseDate,
        isLeapYear: function (year) {
            return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
        },
        daysInMonth: function (year, month) {
            return [31, (Utils.Dates.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
        },
        /**
         * Gets whether a date is an `Invalid Date` or not.
         * @param date
         */
        isDate: function (date) {
            return !isNaN(date && date.valueOf());
        },
        dateOnly: function (datetime) {
            return new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate());
        },
        addMonths: function (input, value) {
            let n = input.getDate(), i = new Date(input), month = i.getMonth() + value, years = 0;
            while (month < 0) {
                month += 12;
                years--;
            }
            i.setDate(1);
            i.setMonth(month % 12);
            i.setFullYear(i.getFullYear() + years + Math.floor(month / 12));
            i.setDate(Math.min(n, Utils.Dates.daysInMonth(i.getFullYear(), i.getMonth())));
            return i;
        },
        addDays: function (input, value) {
            return new Date(input.valueOf() + value * 86400000);
        }
    };
    // css-dedicated
    Utils.Css = {
        colorize: Utils.colorize,
        escape: Utils.cssEscape,
        getVariableValue(name) {
            return getComputedStyle(document.documentElement).getPropertyValue(name);
        },
        setVariable(name, value) {
            getComputedStyle(document.documentElement).setProperty(name, value);
        }
    };
    //#endregion
    //#region Net
    Utils.URIs = {
        format: function (url, parameters, removeMatchedParameters) {
            // replace segments
            for (let name in parameters || {}) {
                let tmpl = new RegExp("(^|\\/)\\{" + name + "\\??\\}(\\/|$)");
                let arr = tmpl.exec(url);
                if (arr && arr.length) {
                    let rpl = new RegExp("\\{" + name + "\\??\\}"), ndx = arr.index;
                    url = url.substr(0, ndx) + url.substr(ndx).replace(rpl, encodeURIComponent(parameters[name]));
                    if (removeMatchedParameters) {
                        delete parameters[name];
                    }
                }
            }
            // clean-up optional
            const optPattern = /(^|\/)\{[\w]+\?\}(\/|$)/;
            var optArr;
            while ((optArr = optPattern.exec(url)) && optArr.length > 0) {
                let wholeMatch = optArr[0];
                url = url.replace(wholeMatch, wholeMatch.endsWith('/') ? "/" : "");
            }
            return url;
        },
        appendQuery: function (url, parameters) {
            const query = (/\?/.test(url) ? '&' : '?') + Object.keys(parameters).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(parameters[k])).join('&');
            return url + query;
        },
        hasMandatoryTemplateSegments: function (url) {
            return /(^|\/)\{\.*\}(\/|$)/.test(url);
        }
    };
    Pacem.Utils = Utils;
})(Pacem || (Pacem = {}));
/// <reference path="types.ts" />
/// <reference path="utils.ts" />
/// <reference path="utils-customelement.ts" />
var Pacem;
(function (Pacem) {
    const CONTEXT_PREFIX = '__context_pacem';
    /** the following pattern matches:
     * -------------------------------
     * ciao "a tutti \"quanti\" voi"                                    -> "a tutti \"quanti\" voi"
     * ciao 'a tutti "quanti" voi'+ mysel.value + 'e a nessun\' altra'  -> 'a tutti "quanti" voi'
     *                                                                     'e a nessun\' altra'
     */
    const stringPattern = /'(\\'|[^'])*[^\\]?'|"(\\"|[^"])*[^\\]?"/g;
    /** the following pattern matches:
     * -------------------------------
     * var l = new Date();  ->  new
     * window.eval(         -> window.
     * eval(                -> eval(
     * eval  (              -> eval  (
     */
    const safetyPattern = /[^\w]new\s|[^\w]window\s*[\.\[]|[^\w]document\s*\.|[^\w]eval\s*\(/;
    /** the following pattern matches:
     * -------------------------------
     * ^^^item.ciao           -> ^^^item
     * !ciao.value            -> !ciao.
     * :host.value            -> :host.
     * ::child.prop           -> ::child.
     * _connectTo(me.value)   -> (me.
     * 009.ciao               ->
     * this[that.value]       -> [that.
     */
    const variablePattern = /(^|[\s\(\[\+\-\*\/!])(:host\.|\^+item[\s\.,;\)\]]|\^+item$|\^+index[^\w\.]|\^+index$|\$?this[\.\s$]?|#[a-zA-Z_][\w]*|::[a-zA-Z_][\w]*)/g;
    ///** the following pattern tests:
    // * -------------------------------
    // * __context.$this.myself.value -> true
    // * !__context.myelem.value      -> false
    // * fn(myelem.value)             -> false
    // * $this == that                -> false
    // * ...
    // */
    //const purePropertyPathPattern = /^[\w\.\$]+/; 
    class Expression {
        constructor() {
            this._pending = false;
            this._independent = false;
        }
        get dependencies() {
            return this._dependencies;
        }
        get functionBody() {
            return this._fnBody;
        }
        get voidBody() {
            return this._voidBody;
        }
        get pending() {
            return this._pending;
        }
        get independent() {
            return this._independent;
        }
        evaluate() {
            if (!this._fn) {
                this._fn = new Function('$pacem', CONTEXT_PREFIX, this._fnBody);
            }
            return this._fn.apply(null, [Pacem.Utils.core, this._args]);
        }
        evaluateAsync() {
            const deferred = Pacem.DeferPromise.defer();
            if (!this._fn) {
                this._fn = new Function('$pacem', CONTEXT_PREFIX, this._fnBody);
            }
            deferred.resolve(this._fn.apply(null, [Pacem.Utils.core, this._args]));
            return deferred.promise;
        }
        evaluatePlus(args = {}) {
            if (!this._fn) {
                let argNames = [CONTEXT_PREFIX];
                for (var prop in args)
                    argNames.push(prop);
                argNames.push('$pacem');
                this._fn = new Function(argNames.join(', '), this._voidBody);
            }
            let argValues = [].concat(this._args);
            for (var prop in args)
                argValues.push(args[prop]);
            argValues.push(Pacem.Utils.core);
            return this._fn.apply(null, argValues);
        }
        static _getPendingExpressionSingleton() {
            if (Expression._pendingExpression == null) {
                let xpr = new Expression();
                xpr._pending = true;
                xpr._dependencies = [];
                Expression._pendingExpression = xpr;
            }
            return Expression._pendingExpression;
        }
        static parse(expression, element) {
            var context = Pacem.CustomElementUtils.findScopeContext(element);
            var args = { '$this': element };
            var dependencies = [];
            var expr = '';
            var independent = true;
            //1. remove strings
            var strings = [], stringMatches, index = 0, trunks = [];
            while ((stringMatches = stringPattern.exec(expression)) != null) {
                trunks.push(expression.substr(index, stringMatches.index - index));
                let length = stringMatches[0].length;
                strings.push({ start: stringMatches.index, length: length });
                index = stringMatches.index + length;
            }
            if (index < expression.length)
                trunks.push(expression.substr(index, expression.length - index));
            //2. loop non string trunks
            // trunks.length >= strings.length (more precisely, the following statemente is always `true`:
            // trunks.length === strings.length || trunks.length === strings.length+1;
            for (var j = 0; j < trunks.length; j++) {
                let trunk = trunks[j];
                if (safetyPattern.test(trunk))
                    throw `Unsafe expression detected: "${trunk}".`;
                if (context == null) {
                    // context is null, means viewActivated event still to be fired.
                    // check whether this is a constant expression (then no need to instantiate actual binding listeners)
                    // or not.
                    if (new RegExp(variablePattern).test(trunk) === true) {
                        independent = false;
                        break;
                    }
                }
                else {
                    let processedTrunk = trunk.replace(variablePattern, (mwhole, mstart, melem, index, input) => {
                        independent = false;
                        const cmpRef = `__host_pacem`;
                        // default initialization := assumes `this`
                        let retval = CONTEXT_PREFIX + '.$this' + (melem.endsWith('.') ? '.' : ''), el = element, dotIndex = input.indexOf('.', index), furtherParts = dotIndex > index ? input.substr(dotIndex + 1).trim() : '', pathRegexArray = /^[\w\.\$]+/.exec(furtherParts), path = pathRegexArray && pathRegexArray.length > 0 && pathRegexArray[0], propArray, prop = path && (propArray = path.split('.')).length > 0 && propArray[0];
                        if (melem === ':host.') {
                            el = args[cmpRef] = args[cmpRef] || Pacem.CustomElementUtils.findHostContext(element);
                            retval = `${CONTEXT_PREFIX}.${cmpRef}.`;
                        }
                        else if (melem.endsWith('^item') || melem.substr(0, melem.length - 1).endsWith('^item')) {
                            let lastChar = melem.endsWith('^item') ? '' : melem.substr(melem.length - 1, 1);
                            let upLevels = melem.length - (lastChar.length > 0 ? 6 : 5); // 5 = 'item'.length + 1 (zero-based)
                            let itemRef = `__item_${upLevels}_up_pacem`;
                            let item = Pacem.Repeater.findItemContext(element, upLevels);
                            el = args[itemRef] = args[itemRef] || (item && item.placeholder);
                            path = 'item' + (path ? ('.' + path) : '');
                            prop = 'item';
                            retval = `${CONTEXT_PREFIX}.${itemRef}.item${lastChar}`;
                        }
                        else if (melem.endsWith('^index') || melem.substr(0, melem.length - 1).endsWith('^index')) {
                            let lastChar = melem.endsWith('^index') ? '' : melem.substr(melem.length - 1, 1);
                            let upLevels = melem.length - (lastChar.length > 0 ? 7 : 6); // 6 = 'index'.length + 1 (zero-based)
                            let itemRef = `__item_${upLevels}_up_pacem`;
                            let item = Pacem.Repeater.findItemContext(element, upLevels);
                            el = args[itemRef] = args[itemRef] || (item && item.placeholder);
                            path = 'index';
                            prop = 'index';
                            retval = `${CONTEXT_PREFIX}.${itemRef}.index${lastChar}`;
                        }
                        else if (melem.startsWith('::')) {
                            let melem0 = melem.substr(2, melem.length - 2);
                            let host = args[cmpRef] = args[cmpRef] || Pacem.CustomElementUtils.findHostContext(element);
                            el = host[melem0];
                            retval = `${CONTEXT_PREFIX}.${cmpRef}.${melem0}`;
                        }
                        else if (melem.startsWith('#')) {
                            let melem0 = melem.substr(1, melem.length - 1);
                            el = args[melem0] = args[melem0] || context.querySelector('#' + melem0);
                            retval = `${CONTEXT_PREFIX}.${melem0}`;
                        }
                        // merge dependencies
                        if (prop && el && prop in el
                            // && it is not a direct method call (which means that the 'prop' isn't in fact a 'func')
                            && typeof el[prop] !== 'function' //!isMethodCall 
                            // && does not already exist as a dependency
                            && dependencies.find(d => d.element === el && d.property == prop) == null)
                            dependencies.push({ element: el, property: prop, path: path, twowayAllowed: false });
                        // return value
                        return mstart + retval;
                    });
                    expr += processedTrunk;
                    if (j < strings.length) {
                        const s = strings[j];
                        expr += expression.substr(s.start, s.length);
                    }
                }
            }
            if (independent) {
                // constant expression
                var constexpr = new Expression();
                constexpr._independent = true;
                constexpr._fnBody = `return ${expression};`;
                constexpr._voidBody = expression;
                constexpr._dependencies = [];
                return constexpr;
            }
            if (context == null) {
                return this._getPendingExpressionSingleton();
            }
            // if some dependency elements aren't available yet, then postpone...
            for (var elem in args) {
                if (args[elem] == null)
                    return Expression._getPendingExpressionSingleton();
            }
            if (dependencies.length == 1
                // := && trimmed expression contains only letters, figures, underscores, dots, and '$'...
                && /[^\w\.\$]+/.test(expr.trim()) !== true) {
                // ...then 'twoway' binding might be applied/accepted
                dependencies[0].twowayAllowed = true;
            }
            var retexpr = new Expression();
            retexpr._args = args;
            retexpr._fnBody = `try{ var ___$$$r = ${expr}; return ___$$$r; }catch(e){  }`;
            retexpr._voidBody = `try{ ${expr} }catch(e){  }`;
            retexpr._dependencies = dependencies;
            return retexpr;
        }
    }
    Expression._pendingExpression = null;
    Pacem.Expression = Expression;
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    var root;
    /** the overall cusotmelement prefix */
    Pacem.P = (root = window['Pacem']) && root.Configuration && root.Configuration.prefix || 'pacem';
    Pacem.PCSS = root.Configuration && root.Configuration.css || Pacem.P;
})(Pacem || (Pacem = {}));
/// <reference path="expression.ts" />
/// <reference path="promise.ts" />
/// <reference path="prefix.ts" />
/// <reference path="trees/json.ts" />
/// <reference path="utils.ts" />
var Pacem;
(function (Pacem) {
    const PACEM_BAG = '__pacem__';
    // {{ binding.expression }}
    const bindingPattern = /^\{\{(.|\n)+\}\}$/;
    // TODO: CSP-proof binding (no unsafe-eval)
    // binding syntax example: `{ binding: { source: ^item.property.path, binder: $pacem.func, parameters: [ ^index, 'foo', : host._baz], mode: 'twoway' } }`
    class CustomElementUtils {
        static get polyfilling() {
            return customElements instanceof window['CustomElementRegistry'];
        }
        static camelToKebab(camelCased) {
            return camelCased && camelCased.replace(/([A-Z])/g, '-$1').toLowerCase();
        }
        static kebabToCamel(kebabCased) {
            return kebabCased && kebabCased.replace(/(-[a-z])/g, (m) => {
                return m[1].toUpperCase();
            });
        }
        static importjs(src, integrity = null, crossorigin = false) {
            var attrs = { 'type': 'text\/javascript', 'src': src };
            if (!Pacem.Utils.isNullOrEmpty(integrity))
                Pacem.Utils.extend(attrs, { integrity: integrity });
            if (crossorigin)
                Pacem.Utils.extend(attrs, { 'crossorigin': '' });
            return CustomElementUtils.import(src, 'script', attrs, (document.head || document.getElementsByTagName("head")[0]));
        }
        static getWatchedProperties(target, includeInherited = true) {
            var properties = [];
            var chain = target instanceof HTMLElement ? target.constructor : target;
            do {
                let additional = this.getAttachedPropertyValue(chain, Pacem.WATCH_PROPS_VAR) || [];
                let pblic = additional.filter(p => !p.name.startsWith('_'));
                Array.prototype.splice.apply(properties, [0, 0].concat(pblic));
            } while (includeInherited && (chain = Object.getPrototypeOf(chain)));
            return properties;
        }
        static getWatchedProperty(target, name) {
            return this.getWatchedProperties(target, true).find(p => p.name === name);
        }
        static importcss(src, integrity = null, crossorigin = false) {
            var attrs = { 'rel': 'stylesheet', 'href': src };
            if (!Pacem.Utils.isNullOrEmpty(integrity))
                Pacem.Utils.extend(attrs, { integrity: integrity });
            if (crossorigin)
                Pacem.Utils.extend(attrs, { 'crossorigin': '' });
            return CustomElementUtils.import(src, 'link', attrs, (document.head || document.getElementsByTagName("head")[0]));
        }
        static import(key, tagName, attrs, appendTo = document.body) {
            var deferred = Pacem.DeferPromise.defer();
            const _p = Pacem.Utils.core;
            var _imports = _p['imports'] = _p['imports'] || {}, script;
            if (script = _imports[key]) {
                deferred.resolve(script);
            }
            else {
                script = document.createElement(tagName);
                script.onerror = e => {
                    deferred.reject(e);
                };
                script.onload = () => {
                    deferred.resolve(_imports[key] = script);
                };
                appendTo.appendChild(script);
                for (var attr in (attrs || {})) {
                    script.setAttribute(attr, attrs[attr]);
                }
            }
            return deferred.promise;
        }
        static setAttachedPropertyValue(target, name, value) {
            /*(target[PACEM_BAG] = target[PACEM_BAG] || {})[name] = value;*/
            if (Pacem.Utils.isNull(target))
                return;
            const propKey = Object.getOwnPropertyDescriptor(target, PACEM_BAG);
            const bag = (propKey && propKey.value)
                || Object.defineProperty(target, PACEM_BAG, {
                    value: {}, enumerable: false, writable: false, configurable: false
                })[PACEM_BAG];
            if (Pacem.Utils.isNull(value))
                delete bag[name];
            else
                bag[name] = value;
        }
        static deleteAttachedPropertyValue(target, name) {
            CustomElementUtils.setAttachedPropertyValue(target, name, undefined);
        }
        static getAttachedPropertyValue(target, name, ensureValue) {
            const propKey = Object.getOwnPropertyDescriptor(target, PACEM_BAG), bag = propKey && propKey.value;
            if (Pacem.Utils.isNull(bag && bag[name]) && !Pacem.Utils.isNull(ensureValue)) {
                CustomElementUtils.setAttachedPropertyValue(target, name, ensureValue);
                return ensureValue;
            }
            return bag && bag[name];
        }
        /**
         * Resolves a dotted path into actual values.
         * @param path Dotted path
         * @param scope Root of the path
         */
        static resolvePath(path, scope) {
            if (!path || !scope)
                return undefined;
            if (/[\(\)\{\}]/.test(path))
                throw `Security alert: not allowed to process paths like ${path}.`;
            const trunks = path.split('.');
            var root = scope, ref = root, parent, core = trunks[0];
            trunks.forEach((t, i) => {
                var trunksSq = t.split('[');
                trunksSq.forEach((t2, j) => {
                    parent = ref;
                    if (/\]$/.test(t2)) {
                        t2 = t2.substr(0, t2.length - 1);
                        if (/^('|").+[^\\]\1$/.test(t2)) {
                            t2 = t2.substr(1, t2.length - 2);
                        }
                    }
                    ref = ref[t2];
                });
            });
            var name, ndx;
            if (/\]$/.test(path)) {
                ndx = path.lastIndexOf('[');
                name = path.substr(ndx + 1);
                name = name.substr(0, name.length - 1);
            }
            else {
                ndx = path.lastIndexOf('.');
                name = path.substr(ndx + 1);
            }
            return { target: { value: ref, name: name }, parent: { value: parent || scope, path: path.substr(0, ndx) }, root: { value: root, property: core } };
        }
        static set(element, path, value) {
            var obj = CustomElementUtils.resolvePath(path, element);
            var current = obj.target.value;
            if (current !== value) {
                if (obj.parent.value != obj.root.value /* nested property scenario */
                    && !(obj.parent.value instanceof HTMLElement) /* and not targeting an HTMLElement (which will eventually fire autonomously) */) {
                    // 1. set new value (won't fire 'propertychange' since it's a nested property)
                    obj.parent.value[obj.target.name] = value;
                    // 2. clone the resulting object (will be set as the new one at 4.)
                    const set_val = Pacem.Utils.clone(obj.root.value[obj.root.property]);
                    // 3. reset to previous value (so that when 4. will trigger the 'propertychange' we'll have meaningful arguments)
                    obj.parent.value[obj.target.name] = current;
                    // repeater-item?
                    let repItem;
                    if (obj.root.property === 'item' && !Pacem.Utils.isNull(repItem = RepeaterItem.getRepeaterItem(obj.root.value))) {
                        // kind of ugly solution, I know. it works however...
                        // trigger array update
                        repItem.repeater && repItem.repeater.datasource && repItem.repeater.datasource.splice(repItem.index, 1, repItem.item = set_val);
                    }
                    else {
                        // 4. force root property change
                        obj.root.value[obj.root.property] = set_val;
                    }
                }
                else {
                    // parent === root, property change event fires automatically
                    obj.parent.value[obj.target.name] = value;
                }
            }
        }
        static get(element, path) {
            var obj = CustomElementUtils.resolvePath(path, element);
            return obj && obj.target && obj.target.value;
        }
        static findScopeContext(element) {
            let el = element;
            let retval;
            do {
                el = el.parentNode;
            } while (el != null && (el != (retval = element.ownerDocument) || (el instanceof HTMLElement && (retval = el.shadowRoot) != null)));
            //let logFn: (message?: string) => void;
            //if (retval == null && console && (logFn = console.debug))
            //    logFn(`Element "${element.constructor.name}" isn't attached to any context yet.`);
            return retval;
        }
        static findAncestor(element, predicate) {
            let el = element;
            let retval;
            while (el && (el = el.parentNode) != null) {
                if (el['host'] instanceof HTMLElement)
                    el = el['host'];
                if (predicate.apply(el, [el])) {
                    retval = el;
                    break;
                }
            }
            return retval;
        }
        static findAncestorShell(element) {
            return CustomElementUtils.findAncestor(element, el => Pacem.Utils.is(el, `.${Pacem.PCSS}-body`) || el === document.body);
        }
        static findAncestorOfType(element, ctor) {
            return CustomElementUtils.findAncestor(element, el => el instanceof ctor);
        }
        static findDescendants(element, predicate) {
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
            var retval = [];
            while (walker.nextNode()) {
                let n = walker.currentNode;
                if (predicate(n) === true)
                    retval.push(n);
            }
            return retval;
        }
        static findAll(selector = '[pacem]', filter = (e) => true) {
            const retval = [];
            document.querySelectorAll(selector).forEach((e, i, arr) => {
                if (filter(e) === true) {
                    retval.push(e);
                }
            });
            return retval;
        }
        /**
         * To be used back again when Edge will allow Comment subclassing
         * https://github.com/Microsoft/ChakraCore/issues/2999 and https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12080908/
         * @param element
         * @param ctor
         * @param upLevels
         */
        static findPreviousSiblingOrAncestorOfType(element, ctor, upLevels = 0) {
            let el = element;
            let retval = null;
            let levels = 0;
            do {
                el = el.previousSibling || el.parentNode;
                if (el instanceof ctor) {
                    if (levels >= upLevels) {
                        retval = el;
                        break;
                    }
                    else {
                        el = el.parentNode;
                    }
                    levels++;
                }
            } while (el != null);
            return retval;
        }
        /**
         * To be removed when Edge will allow Comment subclassing
         * https://github.com/Microsoft/ChakraCore/issues/2999 and https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12080908/
         * @param element
         * @param predicate
         * @param upLevels
         */
        static findPreviousSiblingOrAncestor(element, predicate, upLevels = 0) {
            let el = element;
            let retval = null;
            let levels = 0;
            do {
                el = el.previousSibling || el.parentNode;
                if (el && predicate.apply(el, [el])) {
                    if (levels >= upLevels) {
                        retval = el;
                        break;
                    }
                    else {
                        el = el.parentNode;
                    }
                    levels++;
                }
            } while (el != null);
            return retval;
        }
        static assignHostContext(host, template) {
            const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT + /* traverse templates' content */ NodeFilter.SHOW_DOCUMENT_FRAGMENT);
            while (walker.nextNode()) {
                var node = walker.currentNode;
                /*if (node instanceof HTMLTemplateElement)
                    CustomElementUtils.assignHostContext(host, node);
                else*/ if (Pacem.Utils.isNull(CustomElementUtils.getAttachedPropertyValue(node, Pacem.INSTANCE_HOST_VAR)))
                    CustomElementUtils.setAttachedPropertyValue(node, Pacem.INSTANCE_HOST_VAR, host);
            }
        }
        static findHostContext(element) {
            let el = element;
            let retval;
            while (el != null) {
                retval = CustomElementUtils.getAttachedPropertyValue(el, Pacem.INSTANCE_HOST_VAR);
                if (retval instanceof HTMLElement)
                    break;
                el = el.parentElement;
            }
            let logFn;
            if (retval == null && console && (logFn = console.warn))
                logFn(`Element "${element.constructor.name}" isn't a descendant of a templated component.`);
            return retval;
        }
        static isBindingAttribute(attr) {
            /*if (/^\s*\{\s*binding\s+.*\}\s*$/.test(attr)) {

                // { binding ... } syntax
                var fn = attr.replace('binding', '').trim();
                fn = fn.substring(1, fn.length - 1);
                let twoway = /,\s*twoway\s*=\s*true\s*$/.test(fn);
                let commaNdx = fn.indexOf(',');
                if (commaNdx == -1)
                    commaNdx = fn.length;
                var expression = Expression.parse(fn.substr(0, commaNdx), element);
                (expression && expression.dependencies).forEach(d => {
                    d.twoway = d.twowayAllowed && twoway && expression.dependencies.length == 1;
                });
                return expression;
            }
            else*/
            return bindingPattern.test(attr);
        }
        static parseBindingAttribute(attr, element) {
            if (CustomElementUtils.isBindingAttribute(attr)) {
                // loose syntax {{ ... }}
                let expression = attr.substr(2, attr.length - 4);
                const arr = /,\s*(twoway|once)\s*$/.exec(expression), mode = arr && arr.length > 1 && arr[1];
                if (!Pacem.Utils.isNullOrEmpty(mode)) {
                    expression = expression.substr(0, expression.lastIndexOf(','));
                }
                var expr = Pacem.Expression.parse(expression, element);
                (expr && expr.dependencies).forEach(d => {
                    switch (mode) {
                        case 'twoway':
                            d.mode = (d.twowayAllowed && expr.dependencies.length == 1) ? 'twoway' : undefined;
                            break;
                        case 'once':
                            d.mode = mode;
                            break;
                    }
                });
                return expr;
            }
            else {
                throw `Invalid attribute: incorrect binding syntax.`;
                //return new Function(`return ${attr};`).apply(element);
            }
        }
        static ensureMember(o, name, attributes) {
            let original = Object.getOwnPropertyDescriptor(o, name);
            if (original != undefined)
                return original;
            Object.defineProperty(o, name, attributes);
            return Object.getOwnPropertyDescriptor(o, name);
        }
        /**
         * Strips all the observed attributes of an element and its descendants, in order to seal that dom branch and to avoid bindings evaluation.
         * @param element Input element
         */
        static stripObservedAttributes(element) {
            avoidObservedAttributes(element, false);
        }
        /**
         * Freezes all the observed attributes of an element and its descendants, in order to seal that dom branch and to avoid bindings evaluation.
         * @param element Input element
         */
        static freezeObservedAttributes(element) {
            avoidObservedAttributes(element);
        }
    }
    Pacem.CustomElementUtils = CustomElementUtils;
    function avoidObservedAttributes(element, freeze = true) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
        do {
            var node = walker.currentNode;
            if (node instanceof HTMLElement) {
                const attrs = node.constructor['observedAttributes'];
                if (!Pacem.Utils.isNull(attrs)) {
                    CustomElementUtils.deleteAttachedPropertyValue(node, Pacem.INSTANCE_BINDINGS_VAR);
                    let revertFn = function (v) {
                        if (Pacem.Utils.isArray(v)) {
                            return '[' + v.map(revertFn).join(',') + ']';
                        }
                        if (v instanceof Element) {
                            const vid = v.id = v.id || ('_' + Pacem.Utils.uniqueCode());
                            return `#${vid}`;
                        }
                        else {
                            return `${Pacem.Utils.Json.stringify(v)}`;
                        }
                    };
                    for (var attr of attrs) {
                        if (attr in node.attributes) {
                            let prop;
                            let val;
                            if (freeze && !Pacem.Utils.isNull(val = node[prop = CustomElementUtils.kebabToCamel(attr)])) {
                                let reverted = revertFn(val);
                                node.setAttribute(attr, `{{ ${reverted} }}`);
                            }
                            else
                                node.removeAttribute(attr);
                        }
                    }
                }
            }
        } while (walker.nextNode());
    }
    const GET_VAL = CustomElementUtils.getAttachedPropertyValue;
    const SET_VAL = CustomElementUtils.setAttachedPropertyValue;
    const REPEATERITEM_PLACEHOLDER = 'pacem:repeater-item';
    class Repeater {
        /**
         * Seeks for a PacemRepeaterItem element upwards through the DOM tree, given a starting element and the number of nesting levels.
         * @param element {HTMLElement} Element to start the upward search from
         * @param Optional upLevels {Number} 0-based nesting level
         */
        static findItemContext(element, upLevels = 0, logFn = console.warn) {
            let retval = RepeaterItem.findUpwards(element, upLevels, logFn);
            if (retval == null && logFn && element instanceof HTMLElement && element['isConnected']) {
                logFn(`Couldn't find a ${RepeaterItem.name} up ${upLevels} level${((upLevels === 1) ? "" : "s")} from element "${element.constructor.name}".`);
            }
            return retval;
        }
    }
    Pacem.Repeater = Repeater;
    class RepeaterItem {
        constructor(_placeholder) {
            this._placeholder = _placeholder;
            SET_VAL(_placeholder, REPEATERITEM_PLACEHOLDER, this);
        }
        static findUpwards(element, upLevels = 0, logFn = console.warn) {
            if (Pacem.Utils.isNull(element) || element.localName === 'template' || element instanceof /* template-like element? */ Pacem.TemplateElement) {
                return null;
            }
            let item = /* repeater-item core */ null;
            let predicate = (node) => !Pacem.Utils.isNull(item = RepeaterItem.getRepeaterItem(node));
            let retval = CustomElementUtils.findPreviousSiblingOrAncestor(element, predicate, upLevels);
            if (retval == null && logFn && element instanceof HTMLElement && element['isConnected']) {
                logFn(`Couldn't find a ${RepeaterItem.name} up ${upLevels} level${((upLevels === 1) ? "" : "s")} from element "${element.constructor.name}".`);
            }
            return item;
        }
        static isRepeaterItem(node) {
            return !Pacem.Utils.isNull(GET_VAL(node, REPEATERITEM_PLACEHOLDER));
        }
        static getRepeaterItem(node) {
            return GET_VAL(node, REPEATERITEM_PLACEHOLDER);
        }
        get placeholder() {
            return this._placeholder;
        }
    }
    Pacem.RepeaterItem = RepeaterItem;
})(Pacem || (Pacem = {}));
/// <reference path="utils-customelement.ts" />
var Pacem;
(function (Pacem) {
    let EventKeyModifier;
    (function (EventKeyModifier) {
        EventKeyModifier["AltKey"] = "Alt";
        EventKeyModifier["CtrlKey"] = "Ctrl";
        EventKeyModifier["ShiftKey"] = "Shift";
        EventKeyModifier["MetaKey"] = "Cmd";
    })(EventKeyModifier = Pacem.EventKeyModifier || (Pacem.EventKeyModifier = {}));
    class CustomEventUtils {
        static isInstanceOf(evt, type) {
            return evt instanceof type;
            // || CustomElementUtils.getAttachedPropertyValue(evt, 'pacem:custom-event') === evt.type;
        }
        static getEventCoordinates(evt) {
            var src;
            if ('touches' in evt) {
                src = evt.touches[0];
            }
            else {
                src = evt;
            }
            return {
                page: { x: src.pageX, y: src.pageY },
                screen: { x: src.screenX, y: src.screenY },
                client: { x: src.clientX, y: src.clientY }
            };
        }
        static getEventKeyModifiers(evt) {
            var which = evt.which;
            if (evt instanceof MouseEvent) {
                which = evt.button;
            }
            return {
                which: which, shiftKey: evt.shiftKey, altKey: evt.altKey, ctrlKey: evt.ctrlKey, metaKey: evt.metaKey
            };
        }
        static matchModifiers(evt, ...args) {
            const modifiers = !Pacem.Utils.isNull(args) && (args.length === 1 && Pacem.Utils.isArray(args[0]) ? args[0] : Array.from(args).filter(i => !Pacem.Utils.isNullOrEmpty(i))), lowerCaseModifiers = (modifiers || []).map(i => i.toLowerCase());
            const altKey = lowerCaseModifiers.indexOf('alt') >= 0 || lowerCaseModifiers.indexOf('option') >= 0, shiftKey = lowerCaseModifiers.indexOf('shift') >= 0, ctrlKey = lowerCaseModifiers.indexOf('ctrl') >= 0, metaKey = lowerCaseModifiers.indexOf('win') >= 0 || lowerCaseModifiers.indexOf('cmd') >= 0;
            if (altKey !== evt.altKey
                || shiftKey !== evt.shiftKey
                || metaKey !== evt.metaKey
                || ctrlKey !== evt.ctrlKey) {
                return false;
            }
            return true;
        }
        static fixEdgeCustomEventSubClassInstance(evt, type) {
            // this an optimistic BUGGED workaround due to a damn' Edge bug: https://github.com/Microsoft/ChakraCore/issues/3952
            if (!(evt instanceof type)) {
                Object.setPrototypeOf(evt, type);
            }
        }
    }
    Pacem.CustomEventUtils = CustomEventUtils;
})(Pacem || (Pacem = {}));
/// <reference path="utils-customevent.ts" />
var Pacem;
(function (Pacem) {
    var _originalEvent, _modifiers, _coords;
    class CustomTypedEvent extends CustomEvent /* new v2.7.1 -> */ {
        constructor(type, detail, eventInit) {
            super(type, Pacem.Utils.extend({ detail: detail }, eventInit || {}));
            Pacem.CustomEventUtils.fixEdgeCustomEventSubClassInstance(this, this.constructor);
        }
    }
    Pacem.CustomTypedEvent = CustomTypedEvent;
    function isEventInit(obj) {
        if ('detail' in obj) {
            // must provide a detail
            for (let prop in obj) {
                if (prop !== 'bubbles' && prop !== 'cancelable' && prop !== 'composed' && prop !== 'detail') {
                    return false;
                }
            }
            return true;
        }
        return false;
    }
    // TODO: make inherit from CustomTypedEvent
    class CustomUIEvent extends CustomEvent {
        constructor(type, detail, eventInit, orig) {
            super(type, Pacem.Utils.extend((isEventInit(detail) ? detail : { detail: detail }), (!(eventInit instanceof Event) && eventInit) || {}));
            _originalEvent.set(this, void 0);
            _modifiers.set(this, void 0);
            _coords.set(this, void 0);
            const originalEvent = orig || eventInit;
            if (originalEvent instanceof Event) {
                __classPrivateFieldSet(this, _originalEvent, originalEvent);
                __classPrivateFieldSet(this, _modifiers, Pacem.CustomEventUtils.getEventKeyModifiers(originalEvent));
                if (originalEvent instanceof MouseEvent || originalEvent instanceof TouchEvent) {
                    __classPrivateFieldSet(this, _coords, Pacem.CustomEventUtils.getEventCoordinates(originalEvent));
                }
            }
            Pacem.CustomEventUtils.fixEdgeCustomEventSubClassInstance(this, this.constructor);
        }
        get originalEvent() {
            return __classPrivateFieldGet(this, _originalEvent);
        }
        get which() {
            var _a;
            return (_a = __classPrivateFieldGet(this, _modifiers)) === null || _a === void 0 ? void 0 : _a.which;
        }
        get altKey() {
            var _a;
            return (_a = __classPrivateFieldGet(this, _modifiers)) === null || _a === void 0 ? void 0 : _a.altKey;
        }
        get shiftKey() {
            var _a;
            return (_a = __classPrivateFieldGet(this, _modifiers)) === null || _a === void 0 ? void 0 : _a.shiftKey;
        }
        get ctrlKey() {
            var _a;
            return (_a = __classPrivateFieldGet(this, _modifiers)) === null || _a === void 0 ? void 0 : _a.ctrlKey;
        }
        get metaKey() {
            var _a;
            return (_a = __classPrivateFieldGet(this, _modifiers)) === null || _a === void 0 ? void 0 : _a.metaKey;
        }
        get pageX() {
            var _a;
            return (_a = __classPrivateFieldGet(this, _coords)) === null || _a === void 0 ? void 0 : _a.page.x;
        }
        get pageY() {
            var _a;
            return (_a = __classPrivateFieldGet(this, _coords)) === null || _a === void 0 ? void 0 : _a.page.y;
        }
        get clientX() {
            var _a;
            return (_a = __classPrivateFieldGet(this, _coords)) === null || _a === void 0 ? void 0 : _a.client.x;
        }
        get clientY() {
            var _a;
            return (_a = __classPrivateFieldGet(this, _coords)) === null || _a === void 0 ? void 0 : _a.client.y;
        }
        get screenX() {
            var _a;
            return (_a = __classPrivateFieldGet(this, _coords)) === null || _a === void 0 ? void 0 : _a.screen.x;
        }
        get screenY() {
            var _a;
            return (_a = __classPrivateFieldGet(this, _coords)) === null || _a === void 0 ? void 0 : _a.screen.y;
        }
    }
    _originalEvent = new WeakMap(), _modifiers = new WeakMap(), _coords = new WeakMap();
    Pacem.CustomUIEvent = CustomUIEvent;
    Pacem.AttributeChangeEventName = 'attributechange';
    class AttributeChangeEvent extends CustomTypedEvent {
        constructor(args) {
            super(Pacem.AttributeChangeEventName, args);
        }
    }
    Pacem.AttributeChangeEvent = AttributeChangeEvent;
    Pacem.PropertyChangeEventName = 'propertychange';
    class PropertyChangeEvent extends CustomTypedEvent {
        constructor(args) {
            super(Pacem.PropertyChangeEventName, args);
        }
    }
    Pacem.PropertyChangeEvent = PropertyChangeEvent;
})(Pacem || (Pacem = {}));
/// <reference path="utils.ts" />
var Pacem;
(function (Pacem) {
    /**
     * Default, and essentially ONLY, property comparer for equalitycheck
     * @param old value 1
     * @param val value 2
     */
    Pacem.DefaultComparer = (old, val) => Pacem.Utils.areSemanticallyEqual(old, val);
    ;
    Pacem.PropertyConverters = {
        None: { convert: (attr) => undefined },
        String: {
            convert: (attr) => attr, convertBack: (prop) => prop
        },
        Number: {
            convert: (attr) => parseFloat(attr), convertBack: (prop) => prop.toString()
        },
        Boolean: {
            convert: (attr) => !Pacem.Utils.isNullOrEmpty(attr) && (attr !== '0') && (attr !== 'false'),
            convertBack: (prop) => (!!prop).toString()
        },
        BooleanStrict: {
            convert: (attr) => attr === 'true' || attr === '1',
            convertBack: (prop) => (!!prop).toString()
        },
        Date: {
            convert: (attr) => Pacem.Utils.parseDate(attr),
            convertBack: (prop) => Pacem.Utils.parseDate(prop).toISOString()
        },
        Datetime: {
            convert: (attr) => Pacem.Utils.parseDate(attr),
            convertBack: (prop) => Pacem.Utils.parseDate(prop).toISOString()
        },
        Json: {
            convert: (attr) => Pacem.Utils.Json.parse(attr),
            convertBack: (prop) => Pacem.Utils.Json.stringify(prop)
        },
        Eval: {
            convert: (attr) => Function(`return ${attr};`).apply(null),
            convertBack: (prop) => undefined //JSON.stringify(prop)
        },
        Element: {
            convert: (attr) => document.querySelector(attr),
            convertBack: (prop) => (prop instanceof Element && prop.id) ? ('#' + prop.id) : undefined,
            retryConversionWhenReady: true
        },
        // geom
        Point: {
            convert: (attr) => Pacem.Geom.parsePoint(attr),
            convertBack: (prop) => `${prop.x || 0} ${prop.y || 0}`
        },
        Rect: {
            convert: (attr) => Pacem.Geom.parseRect(attr),
            convertBack: (prop) => `${prop.x || 0} ${prop.y || 0} ${prop.width || 0} ${prop.height || 0}`
        }
    };
})(Pacem || (Pacem = {}));
/// <reference path="prefix.ts" />
/// <reference path="utils.ts" />
/// <reference path="utils-customelement.ts" />
/// <reference path="converters.ts" />
var Pacem;
(function (Pacem) {
    // #region CUSTOM ELEMENT
    //export const ViewActivatedEventName: string = 'viewactivate';
    const GET_VAL = Pacem.CustomElementUtils.getAttachedPropertyValue;
    const SET_VAL = Pacem.CustomElementUtils.setAttachedPropertyValue;
    const DEL_VAL = Pacem.CustomElementUtils.deleteAttachedPropertyValue;
    const WATCH_PROP_PREFIX = 'pacem:property:';
    const WATCH_VERS_PROP = 'pacem:version';
    const WATCH_BIND_PREFIX = 'pacem:binding:';
    //const WATCH_THROTTLE_PREFIX: string = 'pacem:throttle:';
    const INSTANCE_CHILDREN_VAR = 'pacem:view-children';
    const HAS_BIND_PREFIX = 'pacem:has-binding:';
    const HAS_TEMPLATE_VAR = 'pacem:custom-element:has-template';
    const HASBEEN_TEMPLATED_VAR = 'pacem:custom-element:has-templated';
    const INSTANCE_PROMISE_VAR = 'pacem:custom-element:promise';
    const INSTANCE_READY_VAR = 'pacem:custom-element:ready';
    const INSTANCE_ONREADY_VAR = 'pacem:custom-element:startup';
    //const TYPE_OPTIONS_VAR = 'pacem:custom-element:options';
    function processBinding(element, property, binding) {
        var _this = element;
        const prop = property;
        const value = binding;
        // reset previous dependencies
        var deps = GET_VAL(_this, WATCH_BIND_PREFIX + prop);
        //var handleName = WATCH_THROTTLE_PREFIX + prop;
        deps && // reset previous dependencies
            deps.forEach(i => {
                //cancelAnimationFrame(GET_VAL(_this, handleName));
                i.dep.element.removeEventListener(Pacem.PropertyChangeEventName, i.callback, false);
            });
        if (Pacem.Utils.isNull(value) || GET_VAL(element, INSTANCE_READY_VAR) !== true) {
            DEL_VAL(_this, WATCH_BIND_PREFIX + prop);
            DEL_VAL(_this, HAS_BIND_PREFIX + prop);
        }
        else {
            if (value.pending) {
                SET_VAL(_this, WATCH_BIND_PREFIX + prop, []);
            }
            else {
                let mode = 'oneway'; // default
                switch (value.dependencies && value.dependencies.length && value.dependencies[0].mode) {
                    case 'twoway':
                        if ( /* extra-safety here: */value.dependencies.length == 1)
                            mode = 'twoway';
                        break;
                    case 'once':
                        mode = 'once';
                }
                SET_VAL(_this, HAS_BIND_PREFIX + prop, mode);
                const mapped = value.dependencies.map(d => {
                    // gather changes and evaluate at `next frame` (?)
                    var retval = {
                        dep: d, callback: function (evt) {
                            if (evt.detail.propertyName === d.property) {
                                //cancelAnimationFrame(_this[handleName]);
                                //_this[handleName] = requestAnimationFrame(() => {
                                _this[prop] = value.evaluate /*Async*/() /*.then(val => {
                                    _this[prop] = val;
                                })*/;
                                //});
                            }
                        }
                    };
                    //try {
                    d.element.addEventListener(Pacem.PropertyChangeEventName, retval.callback, false);
                    //} catch (ex) {
                    //    console.log(_this.outerHTML + '\n' + d.property);
                    //    throw (ex);
                    //}
                    return retval;
                });
                SET_VAL(_this, WATCH_BIND_PREFIX + prop, mapped);
                _this[prop] = value.evaluate();
            }
        }
    }
    function retrieveTemplateAndWaitForDOMReady(config) {
        var deferred = Pacem.DeferPromise.defer();
        const on_load = (tmpl) => {
            if (Pacem.Utils.isDOMReady())
                deferred.resolve(tmpl);
            else
                Pacem.Utils.onDOMReady((evt) => {
                    deferred.resolve(tmpl);
                });
        };
        //
        if (config.template) {
            on_load(config.template);
        }
        else if (config.templateUrl) {
            let http = new Pacem.Net.Http();
            http.get(config.templateUrl).success(r => {
                let tmpl = config.template = r.text;
                on_load(tmpl);
                return r;
            }).error(err => {
                console.error(err.message);
                on_load(null);
            });
        }
        else
            on_load(null);
        //
        return deferred.promise;
    }
    function retrieveDescendantTemplateActivationPromises(host, root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
        var promises = [];
        while (walker.nextNode()) {
            var node = walker.currentNode;
            if (true === GET_VAL(node.constructor, HAS_TEMPLATE_VAR)) {
                var deferred = GET_VAL(node, INSTANCE_PROMISE_VAR, Pacem.DeferPromise.defer());
                promises.push(deferred.promise);
            }
        }
        return promises;
    }
    Pacem.CustomElement = (config) => {
        return (target) => {
            // might be already registered
            if (Pacem.Utils.customElements.get(config.tagName)) {
                console.warn(`${config.tagName} registration skipped, since already defined.`);
                return;
            }
            // retrieved watched properties (inherited included)
            var properties = Pacem.CustomElementUtils.getWatchedProperties(target, true);
            SET_VAL(target, HAS_TEMPLATE_VAR, !(Pacem.Utils.isNullOrEmpty(config.template) && Pacem.Utils.isNullOrEmpty(config.templateUrl)));
            if (properties && properties.length > 0) {
                // attribute change whitelist
                const OBS_ATTR_PROP = 'observedAttributes';
                var extraObserved = [];
                if (target.hasOwnProperty(OBS_ATTR_PROP)) {
                    extraObserved = target[OBS_ATTR_PROP].slice();
                    delete target[OBS_ATTR_PROP];
                }
                // attributes to watch
                let attrs = extraObserved;
                for (var p of properties) {
                    let a = Pacem.CustomElementUtils.camelToKebab(p.name);
                    attrs.unshift(a);
                }
                // set static `observedAttributes` property
                Object.defineProperty(target, OBS_ATTR_PROP, {
                    get: function () {
                        return attrs;
                    },
                    enumerable: true,
                    configurable: false
                });
            }
            {
                const proto = target.prototype;
                // connectedCallback override
                const originalConnectedCallback = Object.getOwnPropertyDescriptor(proto, 'connectedCallback') || proto.connectedCallback;
                const originalViewActivatedCallback = Object.getOwnPropertyDescriptor(proto, 'viewActivatedCallback') || proto.viewActivatedCallback;
                Object.defineProperty(proto, 'connectedCallback', {
                    value: function connectedCallback() {
                        const _this = this;
                        //console.log(`${_this.localName} connected.`);
                        _this.setAttribute('pacem', '');
                        _this.setAttribute('cloak', '');
                        // reset INSTANCE_CHILDREN_VAR at connectedCallback
                        DEL_VAL(_this, INSTANCE_CHILDREN_VAR);
                        // ready to fire
                        if (originalConnectedCallback && originalConnectedCallback.value)
                            originalConnectedCallback.value.apply(_this, []);
                        else if (typeof originalConnectedCallback == 'function')
                            originalConnectedCallback.apply(_this);
                        /*
                        There's no guarantee that at this point in the element lifecycle its inner DOM has been processed.
                        On the contrary, it is fairly likely it hasn't.
                        If the element is statically declared on the page after the class declaration (.js file), then its innerHTML is empty for sure.
                        **Any template relevant logic must be moved at a point in time when the DOM is fully loaded!**
                        */
                        retrieveTemplateAndWaitForDOMReady(config).then(tmpl => {
                            var promises = [];
                            // apply the template if not already applied(!!)...
                            if (GET_VAL(_this, INSTANCE_READY_VAR) !== true
                                // ...and if any.
                                && !Pacem.Utils.isNullOrEmpty(tmpl)
                                && GET_VAL(_this, HASBEEN_TEMPLATED_VAR) != true) {
                                SET_VAL(_this, HASBEEN_TEMPLATED_VAR, true);
                                const element = _this, originalContent = document.createElement('template').content, currentContent = document.createElement('template'); // config.originalContent === true;
                                for (var j = element.childNodes.length - 1; j >= 0; j--) {
                                    originalContent.insertBefore(element.childNodes.item(j), originalContent.firstChild);
                                }
                                currentContent.innerHTML = tmpl;
                                // use pacem-content as a placeholder, then `insertBefore`, then remove.
                                const placeholders = currentContent.content.querySelectorAll(Pacem.P + '-content');
                                // assign host and create view activation promise
                                Pacem.CustomElementUtils.assignHostContext(_this, currentContent);
                                // placeholder replacement.
                                if (placeholders.length == 1) {
                                    const placeholder = placeholders.item(0);
                                    var ph = placeholder.nextSibling;
                                    const parent = placeholder.parentElement || currentContent.content;
                                    const nodes = originalContent.childNodes;
                                    parent.removeChild(placeholder);
                                    while (nodes.length > 0) {
                                        try {
                                            let node = nodes.item(0);
                                            parent.insertBefore(node, ph);
                                            //ph = node;
                                        }
                                        catch (e) {
                                            console.error(e.toString());
                                        }
                                    }
                                }
                                else if (placeholders.length > 1) {
                                    throw `There can only be at most 1 content placeholder inside a template.`;
                                }
                                var root;
                                if (config.shadow) {
                                    root = element.attachShadow({ mode: 'open' });
                                }
                                else
                                    root = element;
                                var currentChildren = currentContent.content.children;
                                //for (var j = currentChildren.length - 1; j >= 0; j--) {
                                //    root.insertBefore(currentChildren.item(j), root.firstElementChild);
                                //}
                                while (currentChildren.length > 0) {
                                    root.append(currentChildren.item(0));
                                }
                                promises = retrieveDescendantTemplateActivationPromises(_this, root);
                            }
                            // flag as ready
                            SET_VAL(_this, INSTANCE_READY_VAR, true);
                            // retry with unresolved properties
                            for (let property of properties) {
                                const prop = property.name;
                                const config = property.config;
                                if (!config.converter.retryConversionWhenReady || !Pacem.Utils.isNull(_this[prop])) {
                                    continue;
                                }
                                // check attr
                                const attrName = Pacem.CustomElementUtils.camelToKebab(prop), attr = _this.getAttribute(attrName);
                                if (!Pacem.Utils.isNullOrEmpty(attr) && !Pacem.CustomElementUtils.isBindingAttribute(attr)) {
                                    // retry conversion
                                    _this[prop] = config.converter.convert(attr, _this);
                                }
                            }
                            // execute todos (aka `reflect-backs` of prop values onto attr string values)
                            var todos = (GET_VAL(_this, INSTANCE_ONREADY_VAR) || []);
                            todos.forEach(todo => {
                                todo.apply(_this);
                            });
                            //
                            var pendingBindings = (evt) => {
                                // re-evaluate pending expressions...
                                var bindings = (GET_VAL(_this, Pacem.INSTANCE_BINDINGS_VAR) || []);
                                bindings.forEach(attrName => {
                                    const attrNameBind = attrName;
                                    if (!(attrNameBind in _this.attributes)) {
                                        throw `Howcome? ${attrNameBind} not in ${_this.constructor.name} attributes!?...`;
                                    }
                                    const attrValueBind = _this.attributes[attrNameBind].value;
                                    // still a binding attribute? (might have changed its shape while pending...)
                                    if (Pacem.CustomElementUtils.isBindingAttribute(attrValueBind)) {
                                        var expr = Pacem.CustomElementUtils.parseBindingAttribute(attrValueBind, _this);
                                        processBinding(_this, Pacem.CustomElementUtils.kebabToCamel(attrName), expr);
                                    }
                                });
                            };
                            //...now that the document is ready:
                            pendingBindings();
                            var fireViewActivated = (evt) => {
                                //(<HTMLElement>_this).dispatchEvent(new Event(ViewActivatedEventName));
                                if (originalViewActivatedCallback && originalViewActivatedCallback.value)
                                    originalViewActivatedCallback.value.apply(_this, []);
                                else if (typeof originalViewActivatedCallback == 'function')
                                    originalViewActivatedCallback.apply(_this);
                                var deferred = GET_VAL(_this, INSTANCE_PROMISE_VAR);
                                if (!Pacem.Utils.isNull(deferred))
                                    deferred.resolve();
                            };
                            _this.removeAttribute('cloak');
                            //...now that the document is ready:
                            // fire original viewActivatedCallback
                            // when all the descendant templated elements have already fired
                            Promise.all(promises)
                                .then(f => fireViewActivated());
                        });
                    }, configurable: true, enumerable: true
                });
                // disconnectedCallback override
                const originalDisconnectedCallback = Object.getOwnPropertyDescriptor(proto, 'disconnectedCallback') || proto.disconnectedCallback;
                Object.defineProperty(proto, 'disconnectedCallback', {
                    value: function disconnectedCallback() {
                        const _this = this;
                        // 1. dispose as of dev's desires
                        if (originalDisconnectedCallback && originalDisconnectedCallback.value)
                            originalDisconnectedCallback.value.apply(_this, []);
                        else if (typeof originalDisconnectedCallback === 'function')
                            originalDisconnectedCallback.apply(_this, []);
                        // 2. dismantle everything
                        SET_VAL(_this, INSTANCE_READY_VAR, false);
                        // re-evaluate pending expressions (in order to dismiss them, having the element `disconnected`)
                        const bindings = (GET_VAL(_this, Pacem.INSTANCE_BINDINGS_VAR) || []);
                        bindings.forEach(attrName => {
                            processBinding(_this, Pacem.CustomElementUtils.kebabToCamel(attrName) /*, expr*/);
                        });
                    }, configurable: true, enumerable: true
                });
                // watchify attributes
                const originalAttributeChangedCallback = Object.getOwnPropertyDescriptor(proto, 'attributeChangedCallback') || proto.attributeChangedCallback;
                Object.defineProperty(proto, 'attributeChangedCallback', {
                    value: function attributeChangedCallback(name, old, val) {
                        var _this = this;
                        const ready = GET_VAL(_this, INSTANCE_READY_VAR) === true;
                        /*
                        attributeChangedCallback has to fire BEFORE propertyChangedCallback IN THIS CASE
                        */
                        if (originalAttributeChangedCallback && originalAttributeChangedCallback.value)
                            originalAttributeChangedCallback.value.apply(_this, [name, old, val]);
                        else if (typeof originalAttributeChangedCallback === 'function')
                            originalAttributeChangedCallback.apply(_this, [name, old, val]);
                        // dispatch custom event 'attributechange'
                        const evt = new Pacem.AttributeChangeEvent({ attributeName: name, oldValue: old, currentValue: val, firstChange: !ready });
                        _this.dispatchEvent(evt);
                        // binding attribute?
                        const binding = Pacem.CustomElementUtils.isBindingAttribute(val);
                        const plainAttrName = name;
                        const prop = Pacem.CustomElementUtils.kebabToCamel(plainAttrName);
                        if (binding) {
                            let value = Pacem.CustomElementUtils.parseBindingAttribute(val, _this);
                            if (value instanceof Pacem.Expression) {
                                if (value.independent) {
                                    // constant expression, just assign its value
                                    _this[prop] = value.evaluate();
                                    processBinding(_this, prop /* remove eventual old bindings */);
                                }
                                else {
                                    var bindings = GET_VAL(_this, Pacem.INSTANCE_BINDINGS_VAR, []);
                                    bindings.push(plainAttrName);
                                    if (!value.pending) {
                                        processBinding(_this, prop, value);
                                    }
                                }
                            }
                            else {
                                throw `Howcome? ${val} misinterpreted as ${plainAttrName} binding...`;
                            }
                        }
                        else {
                            // retrieve property type and cast coherently...
                            var property = properties.find(p => p.name === prop);
                            if (!Pacem.Utils.isNull(property)) {
                                processBinding(_this, prop /* remove eventual old bindings */);
                                // eventual retry at Ln.289
                                _this[prop] = property.config.converter.convert(val, _this);
                            }
                        }
                    }, configurable: true, enumerable: true
                });
                // watchify properties
                const originalPropertyChangedCallback = Object.getOwnPropertyDescriptor(proto, 'propertyChangedCallback') || proto.propertyChangedCallback;
                Object.defineProperty(proto, 'propertyChangedCallback', {
                    value: function propertyChangedCallback(name, old, val, firstChange, options) {
                        var _this = this;
                        const ready = GET_VAL(_this, INSTANCE_READY_VAR) === true;
                        var todo = () => {
                            const bindingType = GET_VAL(_this, HAS_BIND_PREFIX + name);
                            /*
                                propertyChangedCallback has to fire BEFORE attributeChangedCallback in this case
                            */
                            if (originalPropertyChangedCallback && originalPropertyChangedCallback.value)
                                originalPropertyChangedCallback.value.apply(_this, [name, old, val, !ready]);
                            else if (typeof originalPropertyChangedCallback === 'function')
                                originalPropertyChangedCallback.apply(_this, [name, old, val, !ready]);
                            // dispatch custom event 'propertychange'
                            if (!options || options.emit !== false) {
                                const evt = new Pacem.PropertyChangeEvent({ propertyName: name, oldValue: old, currentValue: val, firstChange: !ready });
                                _this.dispatchEvent(evt);
                            }
                            if (Pacem.Utils.isNullOrEmpty(bindingType) /* reflect to attribute only if this is not a binding property... */) {
                                var property = properties.find(p => p.name === name);
                                if (options
                                    && options.reflectBack === true
                                    && /* not polyfilled */ !Pacem.CustomElementUtils.polyfilling) {
                                    var attrName = Pacem.CustomElementUtils.camelToKebab(name), attr = _this.attributes.getNamedItem(attrName);
                                    // reflectBack only when ready (or you'll lose eventual bindings for attributes with default non-undefined value):
                                    // e.g. see `autofetch` property for `PacemFetchElement`
                                    if (ready
                                        // Allow to reflectBack proprties onto attributes also if the element isn't ready yet,
                                        // put proved to have relevant attribute empty. (e.g. some widget utils like `PacemWidgetFetchParameterElement` need this)
                                        || Pacem.Utils.isNullOrEmpty(attr)) {
                                        var config;
                                        if (val === undefined || val === null) {
                                            _this.removeAttribute(attrName);
                                        }
                                        else if (property && (config = property.config) && typeof config.converter.convertBack === 'function') {
                                            const sval = config.converter.convertBack(val, _this);
                                            /* ...and the values are different */
                                            if (attr == null || sval !== attr.value)
                                                _this.setAttribute(attrName, sval);
                                        }
                                    }
                                }
                            }
                            else if (bindingType === 'twoway') {
                                const binding = GET_VAL(_this, WATCH_BIND_PREFIX + name)[0].dep;
                                Pacem.CustomElementUtils.set(binding.element, binding.path, val);
                            }
                            else if (bindingType === 'once') {
                                // remove the binding
                                processBinding(_this, name /*, null*/);
                            }
                        };
                        // the following filter is needed in order to avoid attribute reflect-back and error:
                        // `Uncaught DOMException: Failed to construct 'CustomElement': The result must not have attributes`
                        if (ready) {
                            todo.apply(_this);
                        }
                        else {
                            var todos = GET_VAL(_this, INSTANCE_ONREADY_VAR, []);
                            todos.push(todo);
                        }
                    }, configurable: true, enumerable: true
                });
            }
            Pacem.Utils.customElements.define(config.tagName, target, config.options);
            Pacem.Utils.customElements.whenDefined(config.tagName).then(() => {
                //console.log(`${config.tagName} defined.`);
            });
        };
    };
    // #endregion
    // #region WATCH PROPERTIES
    const DefaultPropertyConverter = Pacem.PropertyConverters.None;
    function Watch(config) {
        return (target, prop, descriptor) => {
            var watchableProperties = GET_VAL(target.constructor, Pacem.WATCH_PROPS_VAR, []);
            watchableProperties.push({
                name: prop, config: Pacem.Utils.extend({ emit: true, converter: DefaultPropertyConverter }, config)
            });
            // comparer
            const comparer = Pacem.DefaultComparer;
            // original setter?
            var setter = descriptor && descriptor.set;
            // backing field value
            const propref = WATCH_PROP_PREFIX + prop; // <- pacem:property:'prop'
            const ver = WATCH_VERS_PROP; // <- pacem:version
            const propver = WATCH_VERS_PROP + ':' + prop; // <- pacem:version:'prop'
            // getter
            function getter() {
                var _this = this;
                return GET_VAL(_this, propref);
            }
            ;
            function onChange(key, oldValue, currentValue) {
                var _this = this;
                const debounce = config && config.debounce;
                // does it implement OnPropertyChanged?
                var propertyChangedCallback;
                if (typeof (propertyChangedCallback = _this['propertyChangedCallback']) == 'function') {
                    var fn = () => propertyChangedCallback.apply(_this, [key, oldValue, GET_VAL(_this, propref), false /* dummy */, config]);
                    if (debounce > 0) {
                        clearTimeout(this['_handle_' + prop]);
                        this['_handle_' + prop] = setTimeout(fn, debounce);
                    }
                    else if (debounce === true) {
                        cancelAnimationFrame(this['_handle_' + prop]);
                        this['_handle_' + prop] = requestAnimationFrame(fn);
                    }
                    else
                        fn();
                }
            }
            ;
            function decorateArray(instance) {
                var _this = this;
                instance = instance || _this[prop];
                if ( /* already decorated? */GET_VAL(instance, 'pacem:array:decorated') === true)
                    return;
                SET_VAL(instance, 'pacem:array:decorated', true);
                const proto = Array.prototype;
                var methods = {
                    splice: proto.splice,
                    pop: proto.pop,
                    copyWithin: proto.copyWithin,
                    push: proto.push,
                    shift: proto.shift,
                    unshift: proto.unshift
                };
                for (var name in methods) {
                    let fn = name; // < closure
                    instance[fn] = function (...args) {
                        const retval = methods[fn].apply(this, args);
                        // TODO?: specifically notify which items have changed.
                        // .length property risks to not be affected, fire it as well.
                        SET_VAL(this, ver, Date.now());
                        onChange.call(_this, prop, this, this);
                        return retval;
                    };
                }
            }
            function setterCore(oldVal, newVal) {
                var _this = this, isArray = Pacem.Utils.isArray(newVal);
                // different?
                var diffrent = !comparer(oldVal, newVal);
                if (diffrent || (isArray && GET_VAL(newVal, ver) != _this[propver])) {
                    SET_VAL(_this, propref, newVal);
                    if (isArray) {
                        SET_VAL(_this, propver, GET_VAL(newVal, ver));
                        decorateArray.call(_this, newVal);
                    }
                    onChange.call(_this, prop, oldVal, newVal);
                }
            }
            // setter
            if (setter) {
                descriptor.set = function (v) {
                    const _this = this, oldVal = _this[prop];
                    setter.call(_this, v);
                    var newVal = _this[prop];
                    //
                    setterCore.call(_this, oldVal, newVal);
                };
            }
            else {
                //#region this is needed when creating property at runtime.
                try {
                    // TODO: find better way!
                    if (target.ownerDocument)
                        target[propref] = target[prop];
                }
                catch (e) { /*Illegal invocation*/ }
                //#endregion
                if (delete target[prop]) {
                    Object.defineProperty(target, prop, {
                        get: function () {
                            return getter.call(this);
                        },
                        set: function (newVal) {
                            const _this = this;
                            const oldVal = GET_VAL(_this, propref);
                            //
                            setterCore.call(_this, oldVal, newVal);
                        },
                        enumerable: true,
                        configurable: true
                    });
                }
            }
        };
    }
    Pacem.Watch = Watch;
    function ViewChild(selector) {
        return (target, prop, descriptor) => {
            const key = `${prop}_${Pacem.Utils.uniqueCode()}`;
            function findElement() {
                var _this = this, nodelist = (_this.shadowRoot || _this).querySelectorAll(selector);
                for (let i = 0; i < nodelist.length; i++) {
                    let item = nodelist.item(i);
                    if (GET_VAL(item, Pacem.INSTANCE_HOST_VAR) === _this) {
                        return item;
                    }
                }
                return null;
            }
            function getter() {
                var _this = this;
                // reset INSTANCE_CHILDREN_VAR on connectedCallback!
                var dict = GET_VAL(_this, INSTANCE_CHILDREN_VAR, {});
                return dict[key] = dict[key] || findElement.call(_this);
            }
            ;
            if (delete target[prop]) {
                Object.defineProperty(target, prop, {
                    get: function () {
                        return getter.call(this);
                    },
                    enumerable: true,
                    configurable: true
                });
            }
        };
    }
    Pacem.ViewChild = ViewChild;
    // #endregion
    // #region CONCURRENT/DEBOUNCE EXECUTION
    function Concurrent() {
        function isPromiseLike(obj) {
            return obj && typeof obj.then === 'function';
        }
        return function (target /* type, actually */, key, descriptor) {
            const originalMethod = descriptor.value;
            const bufferKey = `pacem:concurrent-buffer:${key}`, lockKey = `pacem:concurrent-running:${key}`;
            descriptor.value = function (...args) {
                var _this = this;
                var buffer = Pacem.CustomElementUtils.getAttachedPropertyValue(_this, bufferKey, []);
                var locked = Pacem.CustomElementUtils.getAttachedPropertyValue(_this, lockKey, false);
                if (locked) {
                    // previous process still going: 
                    // save args for later use,
                    let deferred = Pacem.DeferPromise.defer();
                    //let logFn = console && console.debug;
                    //if (typeof logFn === 'function')
                    //    logFn(`Method ${key} is busy. Procrastinating args '${JSON.stringify(args)}'...`);
                    args.push(deferred);
                    buffer.push(args);
                    // and exit.
                    return deferred.promise;
                }
                var result = originalMethod.apply(_this, args);
                if (isPromiseLike(result)) {
                    let deferred = args && args.length > 0 && args[args.length - 1];
                    if (deferred && deferred.promise instanceof Pacem.DeferPromise)
                        args.pop();
                    else
                        deferred = Pacem.DeferPromise.defer();
                    // hi-jack only if promise-like...
                    Pacem.CustomElementUtils.setAttachedPropertyValue(_this, lockKey, true);
                    result.then(r => {
                        deferred.resolve(r);
                        Pacem.CustomElementUtils.setAttachedPropertyValue(_this, lockKey, false);
                        // warning: here's a possibly sneaky point (TODO: strengthen the lock)
                        if (buffer.length > 0)
                            originalMethod.apply(_this, buffer.shift());
                    }, err => {
                        Pacem.CustomElementUtils.setAttachedPropertyValue(_this, lockKey, false);
                        deferred.reject(err);
                    });
                    return deferred.promise;
                }
                // ...otherwise return the - hopefully - safe single-threaded result.
                else
                    return result;
            };
        };
    }
    Pacem.Concurrent = Concurrent;
    function Debounce(msecs = 50) {
        return function (target /* type, actually */, key, descriptor) {
            const originalMethod = descriptor.value;
            const handleKey = `pacem:debouncer:${key}`;
            if (msecs === true) {
                descriptor.value = function (...args) {
                    var _this = this;
                    cancelAnimationFrame(GET_VAL(_this, handleKey));
                    SET_VAL(_this, handleKey, requestAnimationFrame(() => {
                        originalMethod.apply(_this, args);
                    }));
                };
            }
            else if (msecs > 0) {
                descriptor.value = function (...args) {
                    var _this = this;
                    clearTimeout(GET_VAL(_this, handleKey, 0));
                    SET_VAL(_this, handleKey, setTimeout(() => {
                        originalMethod.apply(_this, args);
                    }, msecs));
                };
            }
        };
    }
    Pacem.Debounce = Debounce;
    function Throttle(msecs = 50) {
        return function (target /* type, actually */, key, descriptor) {
            const originalMethod = descriptor.value;
            const handleKey = `pacem:throttler:${key}`;
            descriptor.value = function (...args) {
                const _this = this, reset = () => { DEL_VAL(_this, handleKey); };
                if (!Pacem.Utils.isNull(GET_VAL(_this, handleKey))) {
                    return;
                }
                SET_VAL(_this, handleKey, 1);
                originalMethod.apply(_this, args);
                if (msecs === true) {
                    requestAnimationFrame(reset);
                }
                else if (msecs > 0) {
                    setTimeout(reset, msecs);
                }
            };
        };
    }
    Pacem.Throttle = Throttle;
    // #endregion
    // #region TRANSFORMS
    class Transforms {
        static register(name, fn) {
            const _set = Pacem.Utils.core;
            if (!Pacem.Utils.isNull(_set[name])) {
                console.warn(`A transform named ${name} already exists.`);
            }
            else {
                _set[name] = fn;
            }
        }
    }
    function Transformer(name) {
        return function (target, key, descriptor) {
            var method = descriptor.value;
            Transforms.register(name || method.name, method);
        };
    }
    Pacem.Transformer = Transformer;
    // #endregion
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    var Logging;
    (function (Logging) {
        let LogLevel;
        (function (LogLevel) {
            LogLevel["Trace"] = "trace";
            LogLevel["Debug"] = "debug";
            LogLevel["Warn"] = "warn";
            LogLevel["Error"] = "error";
            LogLevel["Info"] = "info";
            LogLevel["Log"] = "log";
        })(LogLevel = Logging.LogLevel || (Logging.LogLevel = {}));
    })(Logging = Pacem.Logging || (Pacem.Logging = {}));
})(Pacem || (Pacem = {}));
/// <reference path="converters.ts" />
/// <reference path="decorators.ts" />
/// <reference path="logger.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        class PacemEventTarget extends HTMLElement {
            constructor() {
                super();
                // do not override "isConnected" -> breaks polyfills.
                //private _isConnected = false;
                ///** Gets whether the element has been appended to an (owner)Document. */
                //get isConnected() : boolean {
                //    return this._isConnected;
                //}
                this._isReady = false;
                this.emitHandler = (evt) => {
                    this.emit(evt);
                };
            }
            /**
             * Executes the relevant handler defined in the `on-{evt.type}` attribute, if any.
             * @param evt {Event} the event to be fired
             */
            emit(evt) {
                // no handlers processed if the element is disabled.
                if (this._dontDispatch(evt))
                    return;
                var attrName = `on-${evt.type.toLowerCase()}`;
                if (attrName in this.attributes) {
                    this.log(Pacem.Logging.LogLevel.Debug, `Calling ${attrName} handler for event ${evt.type}`);
                    var attrBody = this.attributes[attrName].value;
                    var expression = Pacem.Expression.parse(attrBody, this);
                    if (!Pacem.Utils.isNull(expression) && expression.pending !== true) {
                        expression.evaluatePlus({ '$event': evt });
                    }
                }
            }
            handle(evt) {
                this.emit(evt);
            }
            _dontDispatch(evt) {
                return this.disabled === true /*&& !(evt instanceof PropertyChangeEvent && evt.detail.propertyName === 'disabled')*/;
            }
            /** Gets whether the element has been completely loaded alongside with the remaining DOM. */
            get isReady() {
                return this._isReady;
            }
            connectedCallback() {
                //this._isConnected = true;
            }
            disconnectedCallback() {
                this._isReady =
                    /*this._isConnected =*/ false;
                this.dispatchEvent(new Event('unload'));
            }
            viewActivatedCallback() {
                this._isReady = true;
                this.dispatchEvent(new Event('load'));
            }
            /**
             * Manages the value change of a watched property.
             * @param name {string} property name
             * @param old {any} former property value
             * @param val {any} new/current property value
             * @param first {boolean} whether is the first change (right before view activation) or not
             */
            propertyChangedCallback(name, old, val, first) {
                if (first)
                    this.log(Pacem.Logging.LogLevel.Log, `Property "${name}" changed at start-up`);
                else
                    this.log(Pacem.Logging.LogLevel.Log, `Property "${name}" changed from ${old} to ${val}`);
            }
            /**
             * Wraps the native dispatchEvent in order to emit `on-{evt-type}` handler, if any.
             * @param evt {Event} the event to be fired
             */
            dispatchEvent(evt) {
                // no events dispatched if the element is disabled.
                if (this._dontDispatch(evt))
                    return false;
                this.log(Pacem.Logging.LogLevel.Log, `Dispatching event "${evt.type}"`);
                const ret = super.dispatchEvent(evt);
                this.emit(evt);
                return ret;
            }
            /**
             * Logs a message if a logger is available.
             * @param level {LogLevel} Level of log
             * @param message {String} Content
             * @param category {String} Grouping category
             */
            log(level, message, category = this.localName + (this.id ? '#' + this.id : '')) {
                this.logger && this.logger.log(level, message, category);
            }
        }
        __decorate([
            Pacem.Watch({ reflectBack: true, converter: Pacem.PropertyConverters.Boolean })
        ], PacemEventTarget.prototype, "disabled", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Element })
        ], PacemEventTarget.prototype, "logger", void 0);
        Components.PacemEventTarget = PacemEventTarget;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="events.ts" />
/// <reference path="eventtarget.ts" />
var Pacem;
(function (Pacem) {
    class CurrentIndexChangeEvent extends Pacem.CustomTypedEvent {
        constructor(args) {
            super('currentindexchange', args);
        }
    }
    Pacem.CurrentIndexChangeEvent = CurrentIndexChangeEvent;
})(Pacem || (Pacem = {}));
Array.prototype.moveWithin = function (from, to) {
    const OUT_OF_RANGE = 'Index must be greater or equal than 0 and less or equal than the length of the array.';
    var arr = this;
    if (from < 0 || from > arr.length)
        throw new Error(OUT_OF_RANGE);
    if (to < 0 || to > arr.length)
        throw new Error(OUT_OF_RANGE);
    arr.splice(to, 0, /* avoid to trigger a double change on a single command */ Array.prototype.splice.apply(arr, [from, 1])[0]);
};
Array.prototype.equalsContent = function (other) {
    if (other == null || this.length !== other.length) {
        return false;
    }
    for (let j = 0; j < this.length; j++) {
        if (this[j] !== other[j]) {
            return false;
        }
    }
    return true;
};
Array.prototype.cloneFrom = function (other) {
    if (other == null) {
        throw 'Cannot clone array from null object.';
    }
    const length = other.length;
    var changes = this.length !== other.length;
    for (let j = 0; j < length; j++) {
        const item = other[j];
        if (this.length > j) {
            if (this[j] !== item) {
                this[j] = item;
                changes = true;
            }
        }
        else {
            Array.prototype.push.apply(this, [item]);
            changes = true;
        }
    }
    if (changes) {
        // trigger change just in case
        this.splice(length);
    }
};
/// <reference path="events.ts" />
var Pacem;
(function (Pacem) {
    Pacem.CommandEventName = 'command';
    class CommandEvent extends Pacem.CustomTypedEvent {
        constructor(args) {
            super(Pacem.CommandEventName, args, { bubbles: true, cancelable: true });
        }
    }
    Pacem.CommandEvent = CommandEvent;
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    Pacem.Defaults = {
        USE_SHADOW_ROOT: /*'attachShadow' in Element.prototype &&*/ false /* <- wait until html-imports */
    };
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    var RegularExpressions;
    (function (RegularExpressions) {
        RegularExpressions.EMPTY_MATCHER = /a^/;
        class Regex {
            /**
             * Splits an input string into segments based on a matching pattern.
             * @param input Input string
             * @param pattern RegExp pattern
             */
            static split(input, pattern) {
                var matches, index = 0, trunks = [];
                while ((matches = pattern.exec(input)) != null) {
                    trunks.push({ value: input.substr(index, matches.index - index), match: false, index: index });
                    let length = matches[0].length;
                    trunks.push({ value: input.substr(matches.index, length), match: true, index: matches.index });
                    index = matches.index + length;
                }
                if (index < input.length)
                    trunks.push({ value: input.substr(index, input.length - index), match: false, index: index });
                return trunks;
            }
        }
        RegularExpressions.Regex = Regex;
    })(RegularExpressions = Pacem.RegularExpressions || (Pacem.RegularExpressions = {}));
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    const EXPIRATION_FIELD = '_exp';
    class Storage {
        _getStorage(persistent) {
            return !!persistent ? window.localStorage : window.sessionStorage;
        }
        _parseValue(storage, name) {
            const value = storage.getItem(name);
            if (Pacem.Utils.isNullOrEmpty(value)) {
                return null;
            }
            const output = Pacem.Utils.Json.parse(value);
            if (!Object.hasOwnProperty(EXPIRATION_FIELD)) {
                return output;
            }
            const exp = output[EXPIRATION_FIELD];
            if (exp < Date.now()) {
                storage.removeItem(name);
                return null;
            }
            return output['value'];
        }
        setPropertyValue(name, value, persistent) {
            var storage = this._getStorage(persistent === true || persistent > 0);
            var storedValue = value;
            // set cache timeout
            if (typeof persistent === 'number' && persistent > 0) {
                const exp = Date.now() + 1000 * persistent;
                storedValue = { value: value };
                storedValue[EXPIRATION_FIELD] = exp;
            }
            storage.setItem(name, Pacem.Utils.Json.stringify(storedValue));
            // delete omonymy
            storage = this._getStorage(!persistent);
            storage.removeItem(name);
        }
        getPropertyValue(name) {
            return this._parseValue(this._getStorage(false), name)
                || this._parseValue(this._getStorage(true), name);
        }
        clear() {
            var storage = this._getStorage(true);
            storage.clear();
            storage = this._getStorage(false);
            storage.clear();
        }
        ;
        removeProperty(name) {
            var storage = this._getStorage(true);
            storage.removeItem(name);
            storage = this._getStorage(false);
            storage.removeItem(name);
        }
    }
    Pacem.Storage = Storage;
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    class TemplateElement extends HTMLElement {
    }
    Pacem.TemplateElement = TemplateElement;
})(Pacem || (Pacem = {}));
/// <reference path="decorators.ts" />
var Pacem;
(function (Pacem) {
    class Transforms {
        static highlight(src, query, css = Pacem.PCSS + '-highlight') {
            if (!query || !src)
                return src;
            let output = src.substr(0);
            var trunks = query.substr(0).split(' ');
            for (var j = 0; j < trunks.length; j++) {
                var regex = new RegExp('(?![^<>]*>)' + trunks[j], 'gi');
                output = output.replace(regex, function (piece, index, whole) {
                    var startTagNdx, endTagIndex;
                    if ((startTagNdx = whole.indexOf('<', index)) != (endTagIndex = whole.indexOf('</', index)) || startTagNdx == -1)
                        return '<span class="' + css + '">' + piece + '</span>';
                    return piece;
                });
            }
            return output;
        }
        static size(src) {
            // TODO: use logarithms
            if (!(src > 0))
                return '-';
            if (src < 1024 /* 1kB */)
                return src + ' B';
            if (src < 1048576 /* 1MB */)
                return (src / 1024).toFixed(2) + ' kB';
            if (src < 1073741824 /* 1GB */)
                return (src / 1048576).toFixed(2) + ' MB';
            return (src / 1073741824).toFixed(2) + ' GB';
        }
        static decToDeg(src, degSeparator = '° ', minSeparator = '\' ', secSeparator = '"') {
            const deg = Math.floor(src), min0 = (src - deg) * 60, min = Math.floor(min0), sec0 = (min0 - min) * 60, sec = Math.floor(sec0);
            return deg + degSeparator + min + minSeparator + sec + secSeparator;
        }
        static date(src, format, culture) {
            var date = Pacem.Utils.parseDate(src), lang = culture || navigator.language;
            if (Pacem.Utils.isNull(format) || typeof format === 'string') {
                switch (format) {
                    case 'iso':
                        return date.toISOString();
                    case 'isodate':
                        return date.toISOString().substr(0, 10);
                    case 'localdate':
                        return `${date.getFullYear()}-${Pacem.Utils.leftPad(date.getMonth() + 1, 2, '0')}-${Pacem.Utils.leftPad(date.getDate(), 2, '0')}`;
                    case 'full':
                        const offset = -(date.getTimezoneOffset() / 60);
                        var utc = '';
                        if (offset != 0)
                            utc = ' (UTC' + ((offset > 0 ? '+' : '-') + Math.abs(offset).toLocaleString()) + ')';
                        return date.toLocaleString(lang) + utc;
                    default:
                        return date.toLocaleDateString(lang);
                }
            }
            else {
                return date.toLocaleString(culture, format);
            }
        }
        static timespan(start, end, culture) {
            const startDate = Pacem.Utils.parseDate(start), endDate = Pacem.Utils.parseDate(end), span = endDate.valueOf() - startDate.valueOf(), msecsPerDay = 86400000, msecsPerHr = 3600000, msecsPerMin = 60000, days = Math.floor(span / msecsPerDay), hrs = Math.floor((span % msecsPerDay) / msecsPerHr), mins = Math.floor((span % msecsPerHr) / msecsPerMin), secs = Math.floor((span % msecsPerMin) / 1000), msecs = Math.floor(span % 1000);
            return `${days}d ${hrs}h ${mins}m ${secs}s ${msecs}ms`;
        }
        static currency(src, currency, culture) {
            return new Intl.NumberFormat(culture || navigator.language, { style: 'currency', currency: currency }).format(src);
        }
        static number(src, formatOrCulture, culture) {
            if (typeof formatOrCulture === 'string') {
                return new Intl.NumberFormat(formatOrCulture || navigator.language).format(src);
            }
            return new Intl.NumberFormat(culture || navigator.language, formatOrCulture).format(src);
        }
        static filter(src, filter) {
            return src.filter(filter);
        }
        static orderby(src, prop) {
            return src.sort((a, b) => {
                if (!Pacem.Utils.isNullOrEmpty(prop)) {
                    a = a[prop];
                    b = b[prop];
                }
                return a > b ? 1 : (a < b ? -1 : 0);
            });
        }
        // #region shortcuts from 'Utils'
        static isEmpty(obj) {
            return Pacem.Utils.isEmpty(obj);
        }
        static isNull(obj) {
            return Pacem.Utils.isNull(obj);
        }
        static isNullOrEmpty(obj) {
            return Pacem.Utils.isNullOrEmpty(obj);
        }
    }
    __decorate([
        Pacem.Transformer()
    ], Transforms, "highlight", null);
    __decorate([
        Pacem.Transformer()
    ], Transforms, "size", null);
    __decorate([
        Pacem.Transformer()
    ], Transforms, "decToDeg", null);
    __decorate([
        Pacem.Transformer()
    ], Transforms, "date", null);
    __decorate([
        Pacem.Transformer()
    ], Transforms, "timespan", null);
    __decorate([
        Pacem.Transformer()
    ], Transforms, "currency", null);
    __decorate([
        Pacem.Transformer()
    ], Transforms, "number", null);
    __decorate([
        Pacem.Transformer()
    ], Transforms, "filter", null);
    __decorate([
        Pacem.Transformer()
    ], Transforms, "orderby", null);
    __decorate([
        Pacem.Transformer()
    ], Transforms, "isEmpty", null);
    __decorate([
        Pacem.Transformer()
    ], Transforms, "isNull", null);
    __decorate([
        Pacem.Transformer()
    ], Transforms, "isNullOrEmpty", null);
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    var Animations;
    (function (Animations) {
        // TODO: Bezier
        const pi_half = Math.PI * .5;
        Animations.Easings = {
            // t: normalized `current time` [0,1]
            linear: t => t,
            sineIn: t => Math.sin(t * pi_half - pi_half) + 1.0,
            sineOut: t => Math.sin(t * pi_half),
            sineInOut: t => .5 * Math.sin(t * Math.PI - pi_half) + .5,
            expoIn: t => (Math.pow(Math.E, t) - 1.0) / (Math.E - 1.0),
            expoOut: t => Math.log(t * (Math.E - 1.0) + 1.0),
            expoInOut: t => t < .5 ? .5 * Animations.Easings.expoIn(t * 2) : .5 * (1 + Animations.Easings.expoOut(t * 2 - 1.0))
        };
    })(Animations = Pacem.Animations || (Pacem.Animations = {}));
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    var Animations;
    (function (Animations) {
        class AnimationEvent extends Pacem.CustomTypedEvent {
            constructor(args) {
                super("step", args);
            }
        }
        Animations.AnimationEvent = AnimationEvent;
        class AnimationEndEvent extends CustomEvent {
            constructor() {
                super('end');
            }
        }
        Animations.AnimationEndEvent = AnimationEndEvent;
        class AnimationStartEvent extends CustomEvent {
            constructor() {
                super('start');
            }
        }
        Animations.AnimationStartEvent = AnimationStartEvent;
    })(Animations = Pacem.Animations || (Pacem.Animations = {}));
})(Pacem || (Pacem = {}));
/// <reference path="easings.ts" />
/// <reference path="events.ts" />
var Pacem;
(function (Pacem) {
    var Animations;
    (function (Animations) {
        class TweenService {
            run(from, to, duration, delay = 0, easing = Animations.Easings.linear, callback = null) {
                var deferred = Pacem.DeferPromise.defer();
                const now = (performance && performance.now()) || Date.now();
                const start = now + Math.abs(delay || 0);
                const end = start + Math.abs(duration || 0);
                //
                var started = false;
                const fn = () => {
                    const t = (performance && performance.now()) || Date.now();
                    if (t >= start && t < end) {
                        const ct = (t - start) / duration;
                        const v = from + (easing || Pacem.Animations.Easings.linear)(ct) * (to - from);
                        if (callback)
                            callback(ct, v);
                    }
                    if (t < end) {
                        requestAnimationFrame(fn);
                    }
                    else {
                        if (callback)
                            callback(1.0, to);
                        deferred.resolve();
                    }
                };
                fn();
                return deferred.promise;
            }
        }
        Animations.TweenService = TweenService;
    })(Animations = Pacem.Animations || (Pacem.Animations = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../promise.ts" />
var Pacem;
(function (Pacem) {
    var Net;
    (function (Net) {
        const noop = () => { };
        let HttpMethod;
        (function (HttpMethod) {
            HttpMethod["Get"] = "GET";
            HttpMethod["Post"] = "POST";
            HttpMethod["Put"] = "PUT";
            HttpMethod["Delete"] = "DELETE";
            HttpMethod["Options"] = "OPTIONS";
            HttpMethod["Head"] = "HEAD";
        })(HttpMethod = Net.HttpMethod || (Net.HttpMethod = {}));
        class StatusCodeError extends Error {
            constructor(statusCode, statusText) {
                super(statusText);
                this.statusCode = statusCode;
            }
            get status() {
                return this.statusCode;
            }
        }
        Net.StatusCodeError = StatusCodeError;
        class Response {
            constructor(req, processTime) {
                if (!req)
                    return;
                this._status = req.status;
                this._body = req.response;
                this._text = req.responseText;
                this._type = req.responseType;
                this._allHeadersRaw = req.getAllResponseHeaders();
                this._processTime = processTime;
            }
            get processTime() {
                return this._processTime;
            }
            get headers() {
                if (this._headers === undefined && this._allHeadersRaw)
                    this._parseHeaders();
                return this._headers;
            }
            get size() {
                return +this.headers['Content-Length'];
            }
            get mime() {
                return this.headers['Content-Type'];
            }
            get date() {
                return new Date(Date.parse(this.headers['Date']));
            }
            _parseHeaders() {
                let headers = {}, rows = this._allHeadersRaw.split('\r\n');
                rows.forEach(r => {
                    if (r && r.length) {
                        let index = r.indexOf(':');
                        let key = r.substr(0, index).trim();
                        let value = r.substr(index + 1).trim();
                        headers[key] = value;
                    }
                });
                this._headers = headers;
            }
            get status() { return this._status; }
            get text() { return this._text; }
            get content() { return this._body; }
            get type() { return this._type; }
            /**
             * Short-hand utility for getting or parsing json content (if any).
             */
            get json() {
                if (this._type === 'json')
                    return this._body;
                else
                    try {
                        return JSON.parse(this._text);
                    }
                    catch (e) {
                        return undefined;
                    }
            }
        }
        Net.Response = Response;
        class Http {
            constructor() { }
            /**
             * Executes an asynchronous XMLHttpRequest over the net.
             * @param {String} url - Base url to be requested.
             * @param {Object} [options] - Options for the request.
             * @param {Object} [options.data] - Data to be sent along.
             * @param {String} [options.method=GET] - HTTP Verb to be used.
             * @param {Object} [options.headers] - Key-value pairs of strings.
             * @param {Function} [options.progress] - Callback on retrieval progress.
             */
            request(url, options) {
                var _this = this;
                let deferred = Pacem.DeferPromise.defer();
                options = options || { method: HttpMethod.Get };
                var method = options.method || HttpMethod.Get;
                var data = options.data || {};
                var progress = options.progress || noop;
                var headers = options.headers || {};
                if (_this.accessToken)
                    headers['Authorization'] = 'Bearer ' + _this.accessToken;
                var req = new XMLHttpRequest();
                // send cookies?
                req.withCredentials = false;
                //
                req.addEventListener("progress", (evt) => {
                    if (evt.lengthComputable) {
                        var pct = evt.loaded / evt.total;
                        // callback
                        if (typeof progress === 'function')
                            progress.apply(_this, [pct]);
                    }
                }, false);
                req.addEventListener("error", (err) => {
                    // Network error occurred
                    deferred.reject(new StatusCodeError(500, err['message'] || 'Unknown error'));
                }, false);
                //req.addEventListener("abort", transferCanceled, false);
                var stopWatch;
                req.addEventListener('load', () => {
                    if (req.status >= 200 && req.status < 300) {
                        // Resolve the promise with the response
                        var response = new Response(req, Date.now() - stopWatch);
                        deferred.resolve(response);
                    }
                    else
                        deferred.reject(new StatusCodeError(req.status, req.statusText));
                }, false);
                var params;
                switch (method.toUpperCase()) {
                    case HttpMethod.Get:
                        url += (/\?/.test(url) ? '&' : '?') + (typeof data == 'string' ? data : Object.keys(data).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]); }).join('&'));
                        break;
                    case HttpMethod.Post:
                        params = JSON.stringify(data);
                }
                //
                req.open(method, url, true);
                switch (method.toUpperCase()) {
                    case HttpMethod.Get:
                        req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                        break;
                    case HttpMethod.Post:
                        req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                        req.setRequestHeader('Content-Type', 'application/json');
                        break;
                }
                for (var kvp in headers) {
                    req.setRequestHeader(kvp, headers[kvp]);
                }
                //
                stopWatch = Date.now();
                req.send(params);
                return deferred.promise;
            }
            /**
             * Short-hand for 'GET' requests.
             */
            get(url, data, headers) {
                return this.request(url, { 'method': HttpMethod.Get, 'data': data, 'headers': headers || {} });
            }
            /**
             * Short-hand for 'POST' requests (content provided as json).
             */
            post(url, data, headers) {
                return this.request(url, { 'method': HttpMethod.Post, 'data': data, 'headers': headers || {} });
            }
        }
        Net.Http = Http;
    })(Net = Pacem.Net || (Pacem.Net = {}));
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    var Net;
    (function (Net) {
        Net.FetchResultEventName = 'fetchresult';
        Net.FetchErrorEventName = 'error';
        Net.FetchSuccessEventName = 'success';
    })(Net = Pacem.Net || (Pacem.Net = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-foundation.d.ts" />
var Pacem;
(function (Pacem) {
    var UI;
    (function (UI) {
        let DragDataMode;
        (function (DragDataMode) {
            /** Source element is dragged around (floater is the element itself so is the data). */
            DragDataMode["Self"] = "self";
            /** The floater is an element clone, while data is the element itself.  */
            DragDataMode["Alias"] = "alias";
            /** The floater is a clone of the element, while data is a copy of it. */
            DragDataMode["Copy"] = "copy";
        })(DragDataMode = UI.DragDataMode || (UI.DragDataMode = {}));
        let DropBehavior;
        (function (DropBehavior) {
            /** Drag & drop task is meant to sort or swap items around. */
            DropBehavior["InsertChild"] = "insert";
            /** Drag & drop task has no logical meaning. Event listeners might be in charge for a specific scenario.  */
            DropBehavior["None"] = "none";
        })(DropBehavior = UI.DropBehavior || (UI.DropBehavior = {}));
        let DropTargetMissedBehavior;
        (function (DropTargetMissedBehavior) {
            /** Reverts to the last tracked spot. */
            DropTargetMissedBehavior["Revert"] = "revert";
            /** Deletes item on spill-out. */
            DropTargetMissedBehavior["Remove"] = "remove";
            /** No explicit behavior, might fallback to 'revert' when drop behavior is 'insert'.  */
            DropTargetMissedBehavior["None"] = "none";
        })(DropTargetMissedBehavior = UI.DropTargetMissedBehavior || (UI.DropTargetMissedBehavior = {}));
        let DragDropEventType;
        (function (DragDropEventType) {
            /** Initial state change before first dragging act. */
            DragDropEventType["Init"] = "draginit";
            /** First dragging act. */
            DragDropEventType["Start"] = "dragstart";
            /** Any dragging act. */
            DragDropEventType["Drag"] = "drag";
            /** Dropping act. */
            DragDropEventType["Drop"] = "drop";
            /** Hovering a drop target. */
            DragDropEventType["Over"] = "dragover";
            /** Exiting a drop target. */
            DragDropEventType["Out"] = "dragout";
            /** Terminating the drag-drop activities. */
            DragDropEventType["End"] = "dragend";
        })(DragDropEventType = UI.DragDropEventType || (UI.DragDropEventType = {}));
        class DragDropEventArgsBaseClass {
            constructor(_builder) {
                this._builder = _builder;
                this.currentPosition = _builder.currentPosition;
                this.target = _builder.target;
            }
            get element() {
                return this._builder.element;
            }
            get origin() {
                return this._builder.origin;
            }
            get initialDelta() {
                return this._builder.initialDelta;
            }
            get startTime() {
                return this._builder.startTime;
            }
            get floater() {
                return this._builder.floater;
            }
            get delta() {
                var args = this;
                return Pacem.Geom.add(args.initialDelta, /* included in `initialDelta` for perf sake => { x: this._builder.scroll.left, y: this._builder.scroll.top },*/ Pacem.Geom.subtract(args.origin, args.currentPosition));
            }
        }
        class DragDropInitEventArgsClass extends DragDropEventArgsBaseClass {
            constructor(_builder) {
                super(_builder);
                this.placeholder = _builder.placeholder;
                this.data = _builder.data;
            }
            static fromArgs(builder) {
                return new DragDropInitEventArgsClass(Pacem.Utils.extend({}, builder));
            }
        }
        UI.DragDropInitEventArgsClass = DragDropInitEventArgsClass;
        class DragDropEventArgsClass extends DragDropEventArgsBaseClass {
            constructor(_builder, _placeholder = _builder.placeholder, _data = _builder.data) {
                super(_builder);
                this._placeholder = _placeholder;
                this._data = _data;
            }
            get placeholder() {
                return this._placeholder;
            }
            get data() {
                return this._data;
            }
            static fromArgs(builder) {
                return new DragDropEventArgsClass(Pacem.Utils.extend({}, builder));
            }
        }
        UI.DragDropEventArgsClass = DragDropEventArgsClass;
        class DragDropEvent extends Pacem.CustomTypedEvent {
            constructor(type, args, eventInit) {
                super(type, args, eventInit);
            }
        }
        UI.DragDropEvent = DragDropEvent;
    })(UI = Pacem.UI || (Pacem.UI = {}));
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    var UI;
    (function (UI) {
        let RescaleHandle;
        (function (RescaleHandle) {
            RescaleHandle["All"] = "all";
            RescaleHandle["Top"] = "top";
            RescaleHandle["Left"] = "left";
            RescaleHandle["Right"] = "right";
            RescaleHandle["Bottom"] = "bottom";
        })(RescaleHandle = UI.RescaleHandle || (UI.RescaleHandle = {}));
        let RescaleEventType;
        (function (RescaleEventType) {
            RescaleEventType["Start"] = "rescalestart";
            RescaleEventType["Rescale"] = "rescale";
            RescaleEventType["End"] = "rescaleend";
        })(RescaleEventType = UI.RescaleEventType || (UI.RescaleEventType = {}));
        class RescaleEventArgsClass {
            constructor(_builder) {
                this._builder = _builder;
            }
            get currentPosition() {
                return this._builder.currentPosition;
            }
            get targetRect() {
                return this._builder.targetRect;
            }
            get element() {
                return this._builder.element;
            }
            get handle() {
                return this._builder.handle;
            }
            static fromArgs(builder) {
                return new RescaleEventArgsClass(Pacem.Utils.extend({}, builder));
            }
        }
        UI.RescaleEventArgsClass = RescaleEventArgsClass;
        class RescaleEvent extends Pacem.CustomTypedEvent {
            constructor(type, args, eventInit) {
                super(type, args, eventInit);
            }
        }
        UI.RescaleEvent = RescaleEvent;
    })(UI = Pacem.UI || (Pacem.UI = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-foundation.d.ts" />
/// <reference path="../types.ts" />
/// <reference path="../utils.ts" />
var Pacem;
(function (Pacem) {
    var UI;
    (function (UI) {
        let SwipeEventType;
        (function (SwipeEventType) {
            SwipeEventType["Swipe"] = "swipe";
            SwipeEventType["SwipeLeft"] = "swipeleft";
            SwipeEventType["SwipeRight"] = "swiperight";
            // end of swipe animation
            SwipeEventType["SwipeAnimationEnd"] = "swipeanimationend";
            SwipeEventType["SwipeLeftAnimationEnd"] = "swipeleftanimationend";
            SwipeEventType["SwipeRightAnimationEnd"] = "swiperightanimationend";
        })(SwipeEventType = UI.SwipeEventType || (UI.SwipeEventType = {}));
        class SwipeEventArgsClass {
            constructor(_builder) {
                this._builder = _builder;
            }
            get direction() {
                return this._builder.horizontalspeed > 0 ? 'right' : 'left';
            }
            get speed() {
                return Math.abs(this._builder.horizontalspeed);
            }
            get element() {
                return this._builder.element;
            }
            static fromArgs(builder) {
                return new SwipeEventArgsClass(Pacem.Utils.extend({}, builder));
            }
        }
        UI.SwipeEventArgsClass = SwipeEventArgsClass;
        class SwipeEvent extends Pacem.CustomTypedEvent {
            constructor(type, args, eventInit) {
                super(type, args, eventInit);
            }
        }
        UI.SwipeEvent = SwipeEvent;
    })(UI = Pacem.UI || (Pacem.UI = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/eventtarget.ts" />
var Pacem;
(function (Pacem) {
    var Behaviors;
    (function (Behaviors) {
        class PacemBehavior extends Pacem.Components.PacemEventTarget {
            constructor() {
                super(...arguments);
                this._container = [];
            }
            register(element) {
                var container = this._container;
                if (container.indexOf(element) === -1) {
                    container.push(element);
                    this.decorate(element);
                }
            }
            unregister(element) {
                var container = this._container, ndx;
                if ((ndx = container.indexOf(element)) !== -1) {
                    this.undecorate(element);
                    container.splice(ndx, 1);
                }
            }
        }
        Behaviors.PacemBehavior = PacemBehavior;
    })(Behaviors = Pacem.Behaviors || (Pacem.Behaviors = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/ui/drag-drop.ts" />
/// <reference path="behavior.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        const GET_VAL = Pacem.CustomElementUtils.getAttachedPropertyValue;
        const SET_VAL = Pacem.CustomElementUtils.setAttachedPropertyValue;
        const DEL_VAL = Pacem.CustomElementUtils.deleteAttachedPropertyValue;
        const MOUSE_DOWN = 'pacem:dragdrop:mousedown';
        const DRAGGING = 'pacem:dragdrop:info';
        const DELEGATE = 'pacem:dragdrop:delegate';
        /**
         * Class to whom delegate the window-relevant events (in a possible future, distopic, multi-pointer scenario)
         */
        class DragElementDelegate {
            constructor(initArgs, _logFn) {
                this._logFn = _logFn;
                this._started = false;
                // #endregion
                this._enterHandler = (evt) => {
                    this._currentTarget = evt.target;
                };
                this._leaveHandler = (evt) => {
                    this._currentTarget = null;
                };
                this._revertTrackedTarget = null;
                this._moveHandler = (evt) => {
                    if (evt.type !== 'wheel') {
                        Pacem.avoidHandler(evt);
                    }
                    var el = this._element, dragger = this._dragDropper, currentPosition, args = GET_VAL(el, DRAGGING);
                    //
                    function getCurrentPosition() {
                        return currentPosition = currentPosition || (evt instanceof MouseEvent ? { x: evt.pageX, y: evt.pageY } : { x: evt.touches[0].pageX, y: evt.touches[0].pageY });
                    }
                    // start
                    if (!this._started) {
                        this._logFn(Pacem.Logging.LogLevel.Info, 'Dragging act started');
                        this._started = true;
                        // starting from a container/drop-target?
                        if (dragger.dropBehavior === Pacem.UI.DropBehavior.InsertChild) {
                            var container = el;
                            do {
                                // could have nested containers,
                                // keep navigating up the dom tree
                                container = container.parentElement;
                            } while (container && dragger.dropTargets.indexOf(container) == -1);
                            this._currentTarget = container;
                        }
                        dragger.dispatchEvent(new Pacem.UI.DragDropEvent(Pacem.UI.DragDropEventType.Start, Pacem.UI.DragDropEventArgsClass.fromArgs(args)));
                    }
                    // move
                    if (!Pacem.Utils.isNull(args)) {
                        this._logFn(Pacem.Logging.LogLevel.Debug, 'Dragging act ongoing');
                        const isMouseFlag = evt instanceof MouseEvent;
                        //if (evt.type !== 'wheel')
                        //    Pacem.avoidHandler(evt);
                        Pacem.Utils.addClass(Pacem.CustomElementUtils.findAncestorShell(el), Pacem.PCSS + '-dragging');
                        const pos = args.currentPosition = getCurrentPosition();
                        let floater = args.floater;
                        let moveEvt = new Pacem.UI.DragDropEvent(Pacem.UI.DragDropEventType.Drag, Pacem.UI.DragDropEventArgsClass.fromArgs(args), { cancelable: true });
                        // dispatch move event
                        dragger.dispatchEvent(moveEvt);
                        if (!moveEvt.defaultPrevented // obey the - eventual - canceling feedback
                            && (floater instanceof HTMLElement || floater instanceof SVGElement)) {
                            // move
                            let delta = { x: moveEvt.detail.delta.x, y: moveEvt.detail.delta.y };
                            floater.style.transform = `translate3d(${delta.x}px, ${delta.y}px, 0)`;
                        }
                        // what am I over?
                        var hover = this._currentTarget;
                        if (!isMouseFlag && dragger.dropTargets.length > 0) {
                            hover = document
                                .elementsFromPoint(args.currentPosition.x - Pacem.Utils.scrollLeft, args.currentPosition.y - Pacem.Utils.scrollTop)
                                .find(e => dragger.dropTargets.indexOf(e) >= 0);
                        }
                        // changed hover element since last time?
                        var oldTarget = args.target;
                        if (hover !== oldTarget) {
                            if (!Pacem.Utils.isNull(oldTarget)) {
                                Pacem.Utils.removeClass(oldTarget, Pacem.PCSS + '-dropping');
                                dragger.dispatchEvent(new Pacem.UI.DragDropEvent(Pacem.UI.DragDropEventType.Out, Pacem.UI.DragDropEventArgsClass.fromArgs(args)));
                                this._logFn(Pacem.Logging.LogLevel.Info, `Drop area left (${(oldTarget['id'] || oldTarget.constructor.name)})`);
                            }
                            if (dragger.dropTargets.indexOf(hover) != -1) {
                                args.target = hover;
                                this._logFn(Pacem.Logging.LogLevel.Info, `Drop area entering (${(args.target['id'] || args.target.constructor.name)})`);
                                let evt = new Pacem.UI.DragDropEvent(Pacem.UI.DragDropEventType.Over, Pacem.UI.DragDropEventArgsClass.fromArgs(args), { cancelable: true });
                                dragger.dispatchEvent(evt);
                                if (evt.defaultPrevented) {
                                    delete args.target;
                                }
                                else {
                                    Pacem.Utils.addClass(args.target, Pacem.PCSS + '-dropping');
                                    this._logFn(Pacem.Logging.LogLevel.Info, `Drop area entered (${(args.target['id'] || args.target.constructor.name)})`);
                                }
                            }
                            else {
                                delete args.target;
                            }
                        }
                        this._revertTrackedTarget = args.target || oldTarget;
                        // positioning
                        if (!Pacem.Utils.isNull(args.target) && dragger.dropBehavior === Pacem.UI.DropBehavior.InsertChild) {
                            this._insertChild(hover, args);
                        }
                        else 
                        // if spilling out from a drop target, avoid undesired `copy` of an element.
                        if (Pacem.Utils.isNull(args.target) && dragger.mode === Pacem.UI.DragDataMode.Copy) {
                            const ph = args.placeholder;
                            if (ph instanceof Element)
                                ph.remove();
                        }
                    }
                };
                this._endHandler = (evt) => {
                    var el = this._element, shell = Pacem.CustomElementUtils.findAncestorShell(el), dragger = this._dragDropper, args;
                    if (!Pacem.Utils.isNull(args = GET_VAL(el, DRAGGING))) {
                        if (evt instanceof MouseEvent)
                            Pacem.avoidHandler(evt);
                        // #region dispose fn
                        let fnDispose = () => {
                            let floater = args.floater;
                            if (floater instanceof HTMLElement || floater instanceof SVGElement) {
                                floater.style.pointerEvents = '';
                            }
                            if (dragger.mode !== Pacem.UI.DragDataMode.Self) {
                                args.floater.remove();
                            }
                            Pacem.Utils.removeClass(el, Pacem.PCSS + '-dragging');
                            Pacem.Utils.removeClass(el, Pacem.PCSS + '-drag-lock');
                            DEL_VAL(el, DRAGGING);
                            if (!Pacem.Utils.isNull(args.placeholder)) {
                                Pacem.Utils.removeClass(args.placeholder, Pacem.PCSS + '-dragging');
                                Pacem.Utils.removeClass(args.placeholder, 'drag-placeholder');
                                Pacem.Utils.removeClass(args.placeholder, Pacem.PCSS + '-drag-lock');
                                DEL_VAL(args.placeholder, DRAGGING);
                            }
                            // === drop
                            const dropping = !Pacem.Utils.isNull(args.target);
                            if (dropping) {
                                dragger.dispatchEvent(new Pacem.UI.DragDropEvent(Pacem.UI.DragDropEventType.Drop, Pacem.UI.DragDropEventArgsClass.fromArgs(args)));
                                Pacem.Utils.removeClass(args.target, Pacem.PCSS + '-dropping');
                            }
                            // === cleanup
                            const data = args.data, placeholder = args.placeholder, repItem = this._repeaterItem, sourceRepeater = this._sourceRepeater, isDraggingRepeaterItem = !Pacem.Utils.isNull(repItem), targetRepItem = placeholder && this._findTargetRepeaterItem(args.placeholder.parentElement, args.placeholder.nextElementSibling), targetRepeater = targetRepItem && targetRepItem.repeater, 
                            // is dropping onto a repeater item?
                            // true if
                            // - is effectively dropping onto a repeater
                            // - AND the target repeater doesn't equal the source one when a whole repeaterItem is involved.
                            isDroppingRepeaterItem = !Pacem.Utils.isNull(targetRepeater) && !(Pacem.Utils.isNull(repItem) && sourceRepeater === targetRepeater);
                            // refresh origin datasource and, eventually, target datasource
                            if (isDraggingRepeaterItem) {
                                sourceRepeater.removeItem(repItem.index);
                            }
                            if (isDroppingRepeaterItem) {
                                args.placeholder.remove();
                                if (targetRepeater === sourceRepeater) {
                                    let from = repItem.index, to = targetRepItem.index;
                                    if (to > from) {
                                        // tweak
                                        to--;
                                    }
                                    sourceRepeater.datasource.moveWithin(from, to);
                                }
                                else {
                                    sourceRepeater && sourceRepeater.datasource.splice(repItem.index, 1);
                                    targetRepeater && (targetRepeater.datasource = targetRepeater.datasource || []).splice(targetRepItem.index, 0, data);
                                }
                            }
                            // Check spill behavior
                            if (!dropping
                                && !Pacem.Utils.isNullOrEmpty(dragger.dropTargets)
                                && dragger.spillBehavior === Pacem.UI.DropTargetMissedBehavior.Remove
                                // if mode is 'copy' then don't remove the source
                                && dragger.mode !== Pacem.UI.DragDataMode.Copy) {
                                if (isDraggingRepeaterItem) {
                                    sourceRepeater.datasource.splice(repItem.index, 1);
                                }
                                else {
                                    el.remove();
                                }
                            }
                            // === end
                            dragger.dispatchEvent(new Pacem.UI.DragDropEvent(Pacem.UI.DragDropEventType.End, Pacem.UI.DragDropEventArgsClass.fromArgs(args)));
                            //
                            Pacem.Utils.removeClass(shell, Pacem.PCSS + '-dragging');
                        };
                        // #endregion
                        // animate to target position
                        const drag = args.placeholder || args.element;
                        if (args.floater != drag) {
                            let floater = args.floater;
                            var m = Pacem.Utils.deserializeTransform(getComputedStyle(floater));
                            // dropping or reverting?
                            if (!Pacem.Utils.isNull(args.target)
                                || dragger.spillBehavior === Pacem.UI.DropTargetMissedBehavior.Revert
                                || (dragger.dropBehavior === Pacem.UI.DropBehavior.InsertChild && dragger.spillBehavior !== Pacem.UI.DropTargetMissedBehavior.Remove)) {
                                // overlap to placeholder
                                const tgetPos = Pacem.Utils.offset(drag), srcPos = Pacem.Utils.offset(floater);
                                floater.style.transition = 'transform .2s ease-in-out';
                                m = Pacem.Matrix2D.translate(m, { x: tgetPos.left - srcPos.left, y: tgetPos.top - srcPos.top });
                            }
                            else {
                                floater.style.transition = 'transform .2s ease-in, opacity .2s linear';
                                // scale down to 0
                                m = Pacem.Matrix2D.scale(m, 0.1);
                                floater.style.opacity = '0';
                            }
                            Pacem.Utils.addAnimationEndCallback(floater, fnDispose, 300);
                            floater.style.transform = `matrix(${m.a},${m.b},${m.c},${m.d},${m.e},${m.f})`;
                        }
                        else {
                            fnDispose();
                        }
                    }
                    Pacem.Utils.removeClass(el, Pacem.PCSS + '-drag-lock');
                    // dispose
                    this.dispose();
                    this._logFn(Pacem.Logging.LogLevel.Info, 'Dragging act disposed');
                };
                this._dragDropper = initArgs.dragDrop;
                Pacem.Utils.addClass(this._element = initArgs.element, Pacem.PCSS + '-drag-lock');
                window.addEventListener('mouseup', this._endHandler, false);
                window.addEventListener('touchend', this._endHandler, false);
                window.addEventListener('mousemove', this._moveHandler, false);
                document.addEventListener('wheel', this._moveHandler, false);
                window.addEventListener('touchmove', this._moveHandler, { passive: false });
                this._dragDropper.dropTargets.forEach(t => {
                    t.addEventListener('mouseenter', this._enterHandler, false);
                    t.addEventListener('mouseleave', this._leaveHandler, false);
                });
                // is `_element` a dynamic one belonging to a repeater item?
                var repItem = Pacem.Repeater.findItemContext(this._element, 0, null);
                if (repItem) {
                    if (repItem.dom && repItem.dom.length === 1 && repItem.dom[0] === this._element) {
                        this._repeaterItem = repItem;
                    }
                    this._sourceRepeater = repItem.repeater;
                }
                //
                this._bootstrap(initArgs.placeholder, initArgs.data);
            }
            // #region PRIVATE UTILS
            _getLogicalData(node) {
                if (node instanceof Components.RepeaterItem)
                    return node.item;
                if (node instanceof HTMLElement)
                    return node.dataset;
                return node;
            }
            _getPhysicalData(node) {
                if (node instanceof Components.RepeaterItem)
                    return node.dom;
                return [node];
            }
            _createFloater(src, origin) {
                const dragger = this._dragDropper;
                let floater = src;
                if (dragger.mode != Pacem.UI.DragDataMode.Self) {
                    floater = floater.cloneNode(true);
                    Pacem.CustomElementUtils.stripObservedAttributes(floater);
                    if (floater instanceof HTMLElement || floater instanceof SVGElement) {
                        Pacem.Utils.addClass(floater, Pacem.PCSS + '-drag-floater');
                        Pacem.CustomElementUtils.findAncestorShell(this._element).appendChild(floater);
                        floater.style.position = 'absolute';
                        let pos = { left: origin.x + floater.clientWidth / 2, top: origin.y - floater.clientHeight / 2 };
                        // if cloned the original element then preserve dimensions
                        if (src === this._element || src.classList.contains('drag-floater-resize')) {
                            let size = Pacem.Utils.offset(this._element);
                            floater.style.boxSizing = 'border-box';
                            floater.style.width = size.width + 'px';
                            floater.style.height = size.height + 'px';
                            pos = { left: size.left, top: size.top };
                        }
                        // positioning
                        floater.style.left = `${pos.left}px`;
                        floater.style.top = `${pos.top}px`;
                    }
                }
                if (floater instanceof HTMLElement || floater instanceof SVGElement) {
                    floater.style.pointerEvents = 'none';
                }
                return floater;
            }
            _findTargetRepeaterItem(dropTarget, nextSibling) {
                var repItem = Pacem.Repeater.findItemContext(nextSibling, 0, null);
                if (!Pacem.Utils.isNull(repItem)) {
                    return { repeater: repItem.repeater, index: repItem.index };
                }
                else {
                    var repeater = null, index = -1;
                    //
                    if (dropTarget instanceof Components.PacemRepeaterElement)
                        repeater = dropTarget;
                    else
                        repeater = Pacem.CustomElementUtils.findAncestorOfType(dropTarget, Components.PacemRepeaterElement);
                    //
                    if (!Pacem.Utils.isNull(repeater))
                        return { repeater: repeater, index: (repeater.datasource && repeater.datasource.length) || 0 };
                }
                return null;
            }
            /**
             * Finds the physical next sibling given a container and dragging event arguments.
             * @param target Container
             * @param args Event arguments
             */
            _findNextSibling(target, args) {
                var lastX = 0, lastY = 0;
                const children = Array.from(target.children), length = children.length;
                // first hit tested element
                const hover = document.elementFromPoint(args.currentPosition.x - Pacem.Utils.scrollLeft, args.currentPosition.y - Pacem.Utils.scrollTop);
                // hit tested sibling (to spot)
                let hoverElement;
                // 1. hit tested element is the drop target (container)
                if (hover === target) {
                    this._currentHover = hoverElement = args.placeholder;
                    return hoverElement.parentElement === target ? hoverElement.nextElementSibling : null;
                }
                // loop until the parent element is the drop target
                var hoverSibling = hover;
                while (hoverSibling.parentElement != target && hoverSibling.parentElement != null) {
                    hoverSibling = hoverSibling.parentElement;
                }
                // 2. hit tested element is the moving placeholder or is outside a drop target
                if (hoverSibling.parentElement != target || hoverSibling === args.placeholder) {
                    this._currentHover = hoverElement = args.placeholder;
                    return hoverElement.nextElementSibling;
                }
                // 3. hit tested element has changed
                if (hoverSibling != this._currentHover) {
                    hoverElement = this._currentHover;
                    const from = children.indexOf(hoverElement), to = children.indexOf(hoverSibling);
                    this._currentHover = hoverSibling;
                    return from > to ? hoverSibling : hoverSibling.nextElementSibling;
                }
                // 4. just return something
                return hoverSibling;
            }
            /**
             * This method is computationally heavy due to forced reflow!
             */
            _insertChild(targetContainer, args) {
                const drag = args.placeholder || args.element, drop = args.target, nextSibling = this._findNextSibling(drop, args);
                if (drag.nextSibling != nextSibling || drag.parentElement != drop) {
                    if (Pacem.Utils.isNull(nextSibling) || nextSibling.parentElement == targetContainer) {
                        // TODO: change logic (try to move elements around with css transforms)
                        targetContainer.insertBefore(drag, nextSibling);
                        this._logFn(Pacem.Logging.LogLevel.Info, `Positioned before ${(nextSibling && (nextSibling.id || nextSibling.constructor.name)) || "null"} for drop`);
                    }
                }
            }
            _bootstrap(placeholder, dataObj) {
                var el = this._element, dragger = this._dragDropper, origin, args;
                if (!Pacem.Utils.isNull(origin = GET_VAL(el, MOUSE_DOWN))) {
                    this._started = false;
                    DEL_VAL(el, MOUSE_DOWN);
                    Pacem.Utils.addClass(el, Pacem.PCSS + '-dragging');
                    let style = getComputedStyle(el), initialDelta = { x: 0, y: 0 }, css = Pacem.Utils.deserializeTransform(style);
                    //
                    initialDelta.x += css.e;
                    initialDelta.y += css.f;
                    // === floater (first)
                    let floater = this._createFloater(dragger.floater || el, origin);
                    // === placeholder (then)
                    if (Pacem.Utils.isNull(placeholder)) {
                        switch (dragger.mode) {
                            case Pacem.UI.DragDataMode.Alias:
                                placeholder = el;
                                break;
                            case Pacem.UI.DragDataMode.Copy:
                                placeholder = el.cloneNode(true);
                                break;
                        }
                    }
                    // add peculiar css class
                    if (!Pacem.Utils.isNull(placeholder)) {
                        Pacem.Utils.addClass(placeholder, 'drag-placeholder');
                    }
                    // inside a repeater? freeze the item
                    if (!Pacem.Utils.isNull(this._repeaterItem) && !Pacem.Utils.isNull(placeholder)) {
                        Pacem.CustomElementUtils.freezeObservedAttributes(placeholder);
                    }
                    const data = dataObj || this._getLogicalData(this._repeaterItem || el);
                    // setup args
                    args = {
                        element: el,
                        placeholder: placeholder || el,
                        data: data,
                        startTime: Date.now(),
                        origin: origin,
                        initialDelta: initialDelta,
                        currentPosition: origin,
                        floater: floater
                    };
                    SET_VAL(el, DRAGGING, args);
                }
            }
            dispose() {
                this._dragDropper.dropTargets.forEach(t => {
                    t.removeEventListener('mouseenter', this._enterHandler, false);
                    t.removeEventListener('mouseleave', this._leaveHandler, false);
                });
                window.removeEventListener('mouseup', this._endHandler, false);
                window.removeEventListener('touchend', this._endHandler, false);
                window.removeEventListener('mousemove', this._moveHandler, false);
                document.removeEventListener('wheel', this._moveHandler, false);
                window.removeEventListener('touchmove', this._moveHandler, { passive: false });
            }
        }
        /**
         * Pacem Drag & Drop element adapter.
         */
        let PacemDragDropElement = class PacemDragDropElement extends Pacem.Behaviors.PacemBehavior {
            constructor() {
                super(...arguments);
                this._startHandler = (evt) => {
                    // sudden exit when disabled
                    if (this.disabled) {
                        return;
                    }
                    // check modifier guards
                    if (!Pacem.CustomEventUtils.matchModifiers(evt, this.modifiers)) {
                        return;
                    }
                    // check the handle selector
                    if (!Pacem.Utils.isNullOrEmpty(this.handleSelector)
                        && evt.currentTarget.querySelector(this.handleSelector) !== evt.target) {
                        return;
                    }
                    // fair to go...
                    // stop and prevent
                    Pacem.avoidHandler(evt);
                    const el = evt.currentTarget, coords = Pacem.CustomEventUtils.getEventCoordinates(evt), origin = coords.page;
                    const lockFn = () => {
                        let element = el;
                        let args = Pacem.UI.DragDropInitEventArgsClass.fromArgs({
                            element: element,
                            placeholder: null,
                            currentPosition: origin,
                            origin: origin,
                            initialDelta: { x: 0, y: 0 },
                            startTime: null,
                            floater: null,
                            data: null
                        });
                        this.dispatchEvent(new Pacem.UI.DragDropEvent(Pacem.UI.DragDropEventType.Init, args));
                        this.log(Pacem.Logging.LogLevel.Info, 'Drag locked!');
                        el.removeEventListener('mouseup', unlockFn, false);
                        el.removeEventListener('touchend', unlockFn, false);
                        SET_VAL(el, MOUSE_DOWN, origin);
                        SET_VAL(el, DELEGATE, new DragElementDelegate({
                            element: element, dragDrop: this, placeholder: args.placeholder, data: args.data,
                        }, (level, message, category) => this.log.apply(this, [level, message, category])));
                    };
                    const unlockFn = (evt) => {
                        this.log(Pacem.Logging.LogLevel.Info, 'Drag avoided!');
                        clearTimeout(toHandle);
                    };
                    const toHandle = setTimeout(lockFn, this.lockTimeout);
                    el.addEventListener('mouseup', unlockFn, false);
                    el.addEventListener('touchend', unlockFn, false);
                };
                /** Gets or sets the amount of milliseconds to wait, while pressing on the draggable object, until the object itself must be considered "locked to drag". */
                this.lockTimeout = 100;
                /** Gets or sets the drop targets (array of elements). */
                this.dropTargets = [];
                /** Gets or sets the drag mode ("self", "alias", "copy"). */
                this.mode = Pacem.UI.DragDataMode.Self;
            }
            decorate(element) {
                const options = { capture: false, passive: true };
                // TODO: add special effects starting the drag process after a while (timeout) the element is pressed. 
                element.addEventListener('mousedown', this._startHandler, false);
                element.addEventListener('touchstart', this._startHandler, options);
            }
            undecorate(element) {
                const options = { capture: false, passive: true };
                element.removeEventListener('mousedown', this._startHandler, false);
                element.removeEventListener('touchstart', this._startHandler, options);
            }
            addEventListener(type, listener, useCapture) {
                super.addEventListener(type, listener, useCapture);
            }
            removeEventListener(type, listener, useCapture) {
                super.removeEventListener(type, listener, useCapture);
            }
            dispatchEvent(evt) {
                if (evt.type === Pacem.UI.DragDropEventType.End) {
                    DEL_VAL(evt.detail.element, MOUSE_DOWN);
                    DEL_VAL(evt.detail.element, DELEGATE);
                }
                return super.dispatchEvent(evt);
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
        ], PacemDragDropElement.prototype, "lockTimeout", void 0);
        __decorate([
            Pacem.Watch({ emit: false })
        ], PacemDragDropElement.prototype, "dropTargets", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemDragDropElement.prototype, "mode", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Element })
        ], PacemDragDropElement.prototype, "floater", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemDragDropElement.prototype, "dropBehavior", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemDragDropElement.prototype, "spillBehavior", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemDragDropElement.prototype, "handleSelector", void 0);
        __decorate([
            Pacem.Watch({
                emit: false, converter: {
                    convert: (attr) => (attr || '').match(/[a-zA-Z]+/g),
                    convertBack: (prop) => (prop || []).join('+')
                }
            })
        ], PacemDragDropElement.prototype, "modifiers", void 0);
        PacemDragDropElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-drag-drop' })
        ], PacemDragDropElement);
        Components.PacemDragDropElement = PacemDragDropElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/types.ts" />
/// <reference path="../../core/eventtarget.ts" />
/// <reference path="../../core/adapter.ts" />
/// <reference path="../behaviors/behavior.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        Components.RepeaterItemCreateEventName = 'repeateritemcreate';
        Components.RepeaterItemRemoveEventName = 'repeateritemremove';
        class RepeaterItemEvent extends Pacem.CustomTypedEvent {
            constructor(name, args) {
                super(name, args);
            }
        }
        Components.RepeaterItemEvent = RepeaterItemEvent;
        class RepeaterItemCreateEvent extends RepeaterItemEvent {
            constructor(args) {
                super(Components.RepeaterItemCreateEventName, args);
            }
        }
        Components.RepeaterItemCreateEvent = RepeaterItemCreateEvent;
        class RepeaterItemRemoveEvent extends RepeaterItemEvent {
            constructor(args) {
                super(Components.RepeaterItemRemoveEventName, args);
            }
        }
        Components.RepeaterItemRemoveEvent = RepeaterItemRemoveEvent;
        const STD_EVENTS = ['keydown', 'keyup', 'click', 'focus', 'blur', 'dblclick', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave', 'mousedown', 'mouseup', 'mousemove', 'contextmenu'];
        class ElementAriaAttributes {
            constructor(_element, ariaAttrs) {
                this._element = _element;
                this._aria = Pacem.Utils.extend({}, ariaAttrs || {});
            }
            toObject() {
                return Pacem.Utils.extend({}, this._aria);
            }
            set(name, value) {
                this._aria[name] = value;
                const el = this._element;
                if (el.isConnected) {
                    el.setAttribute('aria-' + name, value);
                }
            }
            remove(name) {
                delete this._aria[name];
                const el = this._element;
                if (el.isConnected) {
                    el.removeAttribute('aria-' + name);
                }
            }
        }
        class ElementAria {
            constructor(_element, role, attrs) {
                this._element = _element;
                this._aria = { role: role, attrs: new ElementAriaAttributes(_element, attrs) };
            }
            get role() {
                return this._aria.role;
            }
            /** Remarks: when set to an empty string AFTER the element gets connected to the DOM, this will remove the `role` attribute. */
            set role(role) {
                this._aria.role = role;
                const el = this._element;
                if (el.isConnected) {
                    Pacem.Utils.isNullOrEmpty(role) ? el.removeAttribute('role') : el.setAttribute('role', role);
                }
            }
            get attributes() {
                return this._aria.attrs;
            }
        }
        class PacemElement extends Components.PacemEventTarget {
            constructor(role, aria) {
                super();
                // #endregion
                this._cssBag = [];
                this._tabIndex = -1;
                this.behaviors = [];
                this._aria = new ElementAria(this, role, aria);
            }
            // #region ARIA
            get aria() { return this._aria; }
            connectedCallback() {
                super.connectedCallback();
                if (!Pacem.Utils.isNullOrEmpty(this._aria.role)) {
                    this.setAttribute('role', this._aria.role);
                }
                let ariaAttrs = this._aria.attributes.toObject();
                if (!Pacem.Utils.isNullOrEmpty(ariaAttrs)) {
                    for (let name in ariaAttrs) {
                        this.setAttribute('aria-' + name, ariaAttrs[name]);
                    }
                }
            }
            viewActivatedCallback() {
                super.viewActivatedCallback();
                STD_EVENTS.forEach(e => {
                    this.addEventListener(e, this.emitHandler, false);
                });
                for (var behavior of this.behaviors || []) {
                    behavior.register(this);
                }
            }
            disconnectedCallback() {
                for (var behavior of this.behaviors || []) {
                    behavior.unregister(this);
                }
                STD_EVENTS.forEach(e => {
                    this.removeEventListener(e, this.emitHandler, false);
                });
                super.disconnectedCallback();
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                switch (name) {
                    case 'css':
                        for (var css in this.css) {
                            this.style.setProperty(css, this.css[css]);
                        }
                        break;
                    case 'cssClass':
                        if (Pacem.Utils.isArray(this.cssClass)) {
                            const newBag = this.cssClass;
                            for (let css of this._cssBag.splice(0)) {
                                Pacem.Utils.removeClass(this, css);
                            }
                            for (let css of newBag) {
                                this._cssBag.push(css);
                                Pacem.Utils.addClass(this, css);
                            }
                        }
                        else
                            for (let css in this.cssClass) {
                                if (!this.cssClass[css])
                                    Pacem.Utils.removeClass(this, css);
                                else
                                    Pacem.Utils.addClass(this, css);
                            }
                        break;
                    case "hide":
                        if (val) {
                            this.setAttribute('hidden', '');
                        }
                        else {
                            this.removeAttribute('hidden');
                        }
                        break;
                    case 'tooltip':
                        this.title = val;
                        Pacem.Utils.isNullOrEmpty(val) ? this.aria.attributes.remove('label') : this.aria.attributes.set('label', val);
                        break;
                    case 'tabOrder':
                        this._tabIndex = val;
                        if (!this.disabled)
                            this.tabIndex = val;
                        break;
                    case 'behaviors':
                        if (!Pacem.Utils.isNullOrEmpty(old)) {
                            for (let behavior of old) {
                                behavior.unregister(this);
                            }
                        }
                        if (!Pacem.Utils.isNullOrEmpty(val) && !first) {
                            for (let behavior of val) {
                                behavior.register(this);
                            }
                        }
                        break;
                    case 'disabled':
                        let cssDis = Pacem.PCSS + '-' + name;
                        if (!!val) {
                            this._tabIndex = this.tabIndex;
                            this.tabIndex = -1;
                            Pacem.Utils.addClass(this, cssDis);
                        }
                        else {
                            this.tabIndex = this._tabIndex;
                            Pacem.Utils.removeClass(this, cssDis);
                        }
                        break;
                    case 'culture':
                        if (Pacem.Utils.isNullOrEmpty(val)) {
                            this.removeAttribute('lang');
                        }
                        else {
                            this.setAttribute('lang', val);
                        }
                        if (!first) {
                            this.refreshBindings();
                        }
                        break;
                }
            }
            /** Refreshes all the properties corresponding to explicit binding attributes. */
            refreshBindings() {
                // refresh all the bindings
                for (let j = 0; j < this.attributes.length; j++) {
                    let attr = this.attributes.item(j), isBinding = Pacem.CustomElementUtils.isBindingAttribute(attr.value);
                    if (!isBinding)
                        continue;
                    let prop = Pacem.CustomElementUtils.kebabToCamel(attr.name);
                    let binding = Pacem.CustomElementUtils.parseBindingAttribute(attr.value, this);
                    this[prop] = binding.evaluate();
                }
            }
        }
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Json /* when declared plainly assume array of strings */ })
        ], PacemElement.prototype, "cssClass", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Eval })
        ], PacemElement.prototype, "css", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Boolean })
        ], PacemElement.prototype, "hide", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemElement.prototype, "tooltip", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
        ], PacemElement.prototype, "tabOrder", void 0);
        __decorate([
            Pacem.Watch({ converter: Pacem.PropertyConverters.String })
        ], PacemElement.prototype, "culture", void 0);
        __decorate([
            Pacem.Watch({ emit: false })
        ], PacemElement.prototype, "behaviors", void 0);
        Components.PacemElement = PacemElement;
        class PacemContentElement extends PacemElement {
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                if (name === 'content' && !first) {
                    this._fillContent(val);
                }
            }
            viewActivatedCallback() {
                super.viewActivatedCallback();
                this._original = this.innerHTML;
                if (!Pacem.Utils.isNullOrEmpty(this.content)) {
                    this._fillContent();
                }
            }
            disconnectedCallback() {
                if (!Pacem.Utils.isNull(this._original)) {
                    this.innerHTML = this._original;
                }
                super.disconnectedCallback();
            }
            _fillContent(val = this.content) {
                this.innerHTML = this.cleanup(val);
            }
        }
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemContentElement.prototype, "content", void 0);
        Components.PacemContentElement = PacemContentElement;
        class PacemUnsafeContentElement extends PacemContentElement {
            cleanup(html) {
                return html;
            }
        }
        Components.PacemUnsafeContentElement = PacemUnsafeContentElement;
        class PacemSafeContentElement extends PacemContentElement {
            cleanup(html) {
                const scriptBlockPattern = /<script.+<\/script>/g;
                // TODO: remove onclick, onload, onkey*, ... attributes
                return (html || '').toString().replace(scriptBlockPattern, '');
            }
        }
        Components.PacemSafeContentElement = PacemSafeContentElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../basic/types.ts" />
/// <reference path="../../core/ui/rescale.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        const handlesConverter = {
            convert: attr => {
                return attr && attr.trim().split(' ');
            },
            convertBack: prop => (prop && prop.join(' ')) || ''
        };
        class RescaleElementDelegate {
            constructor(_element, _type, _rescaler, _logFn) {
                this._element = _element;
                this._type = _type;
                this._rescaler = _rescaler;
                this._logFn = _logFn;
                this._startTime = Date.now();
                this._moveHandler = (evt) => {
                    evt.stopPropagation();
                    var el = this._element, origin = this._origin, rescaler = this._rescaler, handle = this._type, minWidth = rescaler.minWidth || 0, minHeight = rescaler.minHeight || 0, maxWidth = rescaler.maxWidth || Number.MAX_SAFE_INTEGER, maxHeight = rescaler.maxHeight || Number.MAX_SAFE_INTEGER, currentPosition = (evt instanceof MouseEvent ? { x: evt.clientX, y: evt.clientY } : { x: evt.touches[0].clientX, y: evt.touches[0].clientY }), position = Pacem.Utils.extend({}, currentPosition);
                    switch (this._type) {
                        case 'top':
                        case 'bottom':
                            position.x = origin.x;
                            break;
                        case 'left':
                        case 'right':
                            position.y = origin.y;
                            break;
                    }
                    this._position = position;
                    var delta = { x: position.x - origin.x, y: position.y - origin.y }, 
                    // bottonright as default
                    desiredRect = { x: this._rect.x, y: this._rect.y, width: this._rect.width + delta.x, height: this._rect.height + delta.y };
                    if (handle.startsWith('top')) {
                        desiredRect.y = this._rect.y + delta.y;
                        desiredRect.height = this._rect.height - delta.y;
                    }
                    if (handle.endsWith('left')) {
                        desiredRect.x = this._rect.x + delta.x;
                        desiredRect.width = this._rect.width - delta.x;
                    }
                    this._logFn(Pacem.Logging.LogLevel.Log, `handle: ${handle}, origin: ${JSON.stringify(origin)}, currentPosition: ${JSON.stringify(currentPosition)}`, `Rescaling`);
                    this._logFn(Pacem.Logging.LogLevel.Log, `delta: ${JSON.stringify(delta)}, position: ${JSON.stringify(position)}`, `Rescaling`);
                    this._logFn(Pacem.Logging.LogLevel.Log, `from: ${JSON.stringify(this._rect)}, to: ${JSON.stringify(desiredRect)}`, `Rescaling`);
                    // check constraints
                    const horizontally = desiredRect.width >= minWidth && desiredRect.width <= maxWidth, vertically = desiredRect.height >= minHeight && desiredRect.height <= maxHeight;
                    if (!horizontally) {
                        // reset to the last valid horizontal configuration
                        desiredRect.x = this._targetRect.x;
                        desiredRect.width = this._targetRect.width;
                    }
                    if (!vertically) {
                        // reset to the last valid vertical configuration
                        desiredRect.y = this._targetRect.y;
                        desiredRect.height = this._targetRect.height;
                    }
                    if (horizontally || vertically) {
                        // dispatch
                        const args = {
                            currentPosition: position, element: el,
                            handle: handle, origin: origin, targetRect: (this._targetRect = desiredRect), startTime: this._startTime
                        };
                        let evt = new Pacem.UI.RescaleEvent(Pacem.UI.RescaleEventType.Rescale, Pacem.UI.RescaleEventArgsClass.fromArgs(args), { cancelable: true });
                        rescaler.dispatchEvent(evt);
                        if (!evt.defaultPrevented) {
                            // render resize
                            const m = this._originalTransform;
                            el.style.transform = `matrix(${m.a},${m.b},${m.c},${m.d},${(m.e + desiredRect.x - this._rect.x)},${(m.f + desiredRect.y - this._rect.y)})`;
                            el.style.width = desiredRect.width + 'px';
                            el.style.height = desiredRect.height + 'px';
                        }
                    }
                };
                this._endHandler = (e) => {
                    e.stopPropagation();
                    const handle = this._type;
                    let evt = new Pacem.UI.RescaleEvent(Pacem.UI.RescaleEventType.End, Pacem.UI.RescaleEventArgsClass.fromArgs({
                        element: this._element, origin: this._origin,
                        handle: handle, startTime: this._startTime, currentPosition: this._position, targetRect: this._targetRect
                    }));
                    // body
                    Pacem.Utils.removeClass(document.body, Pacem.PCSS + '-rescaling rescale-' + handle);
                    this._rescaler.dispatchEvent(evt);
                    DEL_VAL(this._element, DELEGATE);
                    window.removeEventListener('mouseup', this._endHandler, false);
                    window.removeEventListener('touchend', this._endHandler, false);
                    window.removeEventListener('mousemove', this._moveHandler, false);
                    window.removeEventListener('touchmove', this._moveHandler, false);
                };
                window.addEventListener('mouseup', this._endHandler, false);
                window.addEventListener('touchend', this._endHandler, false);
                window.addEventListener('mousemove', this._moveHandler, false);
                window.addEventListener('touchmove', this._moveHandler, false);
                this._origin =
                    this._position =
                        GET_VAL(_element, MOUSE_DOWN);
                this._rect =
                    this._targetRect =
                        Pacem.Utils.offsetRect(_element);
                //
                this._originalTransform = Pacem.Utils.deserializeTransform(getComputedStyle(_element));
                // body
                Pacem.Utils.addClass(document.body, Pacem.PCSS + '-rescaling rescale-' + _type);
            }
        }
        const GET_VAL = Pacem.CustomElementUtils.getAttachedPropertyValue;
        const SET_VAL = Pacem.CustomElementUtils.setAttachedPropertyValue;
        const DEL_VAL = Pacem.CustomElementUtils.deleteAttachedPropertyValue;
        const HANDLES = 'top right bottom left topleft topright bottomright bottomleft'.split(' ');
        const RESCALE_FRAME = 'pacem:rescale:frame';
        const MOUSE_DOWN = 'pacem:rescale:origin';
        const DELEGATE = 'pacem:rescale:delegate';
        let PacemRescaleElement = class PacemRescaleElement extends Pacem.Behaviors.PacemBehavior {
            constructor() {
                super(...arguments);
                this._bag = [];
                this._startHandler = (evt) => {
                    evt.stopPropagation();
                    var el = evt.currentTarget, origin;
                    if (evt instanceof MouseEvent) {
                        origin = { x: evt.clientX, y: evt.clientY };
                    }
                    else {
                        if (evt.touches.length != 1)
                            return;
                        origin = { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
                    }
                    const type = /rescale-(.+)/.exec(el['className'])[1];
                    // start
                    const target = el.parentElement;
                    this.dispatchEvent(new Pacem.UI.RescaleEvent(Pacem.UI.RescaleEventType.Start, Pacem.UI.RescaleEventArgsClass.fromArgs({
                        currentPosition: origin,
                        origin: origin, element: target, handle: type, startTime: Date.now()
                    })));
                    SET_VAL(target, MOUSE_DOWN, origin);
                    SET_VAL(target, DELEGATE, new RescaleElementDelegate(target, type, this, 
                    /* logging */ (level, message, category) => this.log.apply(this, [level, message, category])));
                };
            }
            decorate(element) {
                const el = element, css = getComputedStyle(el);
                Pacem.Utils.addClass(el, Pacem.PCSS + '-rescalable');
                this._setFrame(el);
            }
            undecorate(element) {
                const el = element;
                Pacem.Utils.removeClass(el, Pacem.PCSS + '-rescalable');
                //
                this._removeFrame(el);
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                switch (name) {
                    case 'disabled':
                    case 'handles':
                        const handles = this.handles || [Pacem.UI.RescaleHandle.All];
                        const all = handles.find(h => h === Pacem.UI.RescaleHandle.All) != null;
                        const disabled = this.disabled;
                        for (let el of this._bag) {
                            let frame = GET_VAL(el, RESCALE_FRAME);
                            frame.top.hidden = disabled || (!all && handles.find(h => h === Pacem.UI.RescaleHandle.Top) == null);
                            frame.bottom.hidden = disabled || (!all && handles.find(h => h === Pacem.UI.RescaleHandle.Bottom) == null);
                            frame.left.hidden = disabled || (!all && handles.find(h => h === Pacem.UI.RescaleHandle.Left) == null);
                            frame.right.hidden = disabled || (!all && handles.find(h => h === Pacem.UI.RescaleHandle.Right) == null);
                            frame.topleft.hidden = frame.top.hidden || frame.left.hidden;
                            frame.topright.hidden = frame.top.hidden || frame.right.hidden;
                            frame.bottomleft.hidden = frame.bottom.hidden || frame.left.hidden;
                            frame.bottomright.hidden = frame.bottom.hidden || frame.right.hidden;
                        }
                        break;
                }
            }
            _setFrame(el) {
                let frame = {};
                for (let type of HANDLES) {
                    const handle = frame[type] = document.createElement('div');
                    Pacem.Utils.addClass(handle, Pacem.PCSS + '-rescale rescale-' + type);
                    el.setAttribute('pacem', '');
                    el.appendChild(handle);
                    handle.addEventListener('mousedown', this._startHandler, false);
                    handle.addEventListener('touchstart', this._startHandler, { capture: false, passive: true });
                }
                SET_VAL(el, RESCALE_FRAME, frame);
                this._bag.push(el);
            }
            _removeFrame(el) {
                const frame = GET_VAL(el, RESCALE_FRAME);
                for (var type in frame) {
                    const handle = frame[type];
                    handle.removeEventListener('mousedown', this._startHandler, false);
                    handle.removeEventListener('touchstart', this._startHandler, { capture: false });
                    handle.remove();
                }
                DEL_VAL(el, RESCALE_FRAME);
                this._bag.splice(this._bag.indexOf(el), 1);
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: handlesConverter })
        ], PacemRescaleElement.prototype, "handles", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
        ], PacemRescaleElement.prototype, "minWidth", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
        ], PacemRescaleElement.prototype, "maxWidth", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
        ], PacemRescaleElement.prototype, "minHeight", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
        ], PacemRescaleElement.prototype, "maxHeight", void 0);
        PacemRescaleElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-rescale' })
        ], PacemRescaleElement);
        Components.PacemRescaleElement = PacemRescaleElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/ui/swipe.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        const GET_VAL = Pacem.CustomElementUtils.getAttachedPropertyValue;
        const SET_VAL = Pacem.CustomElementUtils.setAttachedPropertyValue;
        const DEL_VAL = Pacem.CustomElementUtils.deleteAttachedPropertyValue;
        const MOUSEDOWN = 'pacem:swipe:mousedown';
        const SWIPE_DATA = 'pacem:swipe:data';
        const DELEGATE = 'pacem:swipe:delegate';
        const PI_HALF = Math.PI / 2;
        const TOUCH_OPTIONS = { capture: false, passive: false };
        class SwipeElementDelegate {
            constructor(_element, _swiper, _logFn) {
                this._element = _element;
                this._swiper = _swiper;
                this._logFn = _logFn;
                this._moveHandler = (evt) => {
                    Pacem.avoidHandler(evt);
                    //
                    function getProjectedDistance(xn, x0) {
                        const x = xn - x0;
                        const c = threshold - w_half;
                        return -c * Math.sin(PI_HALF * Math.max(-1, Math.min(1, x / threshold))) / k_pan;
                    }
                    const el = this._element, currentPosition = this._getCurrentPosition(evt), threshold = this._threshold;
                    var init, args;
                    const w_half = this._halfElementWidth, now = Date.now();
                    if (!Pacem.Utils.isNull(init = GET_VAL(el, MOUSEDOWN))) {
                        this._logFn(Pacem.Logging.LogLevel.Debug, 'Swipe act started');
                        DEL_VAL(el, MOUSEDOWN);
                        SET_VAL(el, SWIPE_DATA, args = this._refreshValues({ position: currentPosition, timestamp: now }, init));
                    }
                    else if (!Pacem.Utils.isNull(args = GET_VAL(el, SWIPE_DATA))) {
                        this._updateState({ position: currentPosition, timestamp: now });
                    }
                    const scrolling = Math.abs(currentPosition.x - args.t0.position.x) < Math.abs(currentPosition.y - args.t0.position.y);
                    if (!scrolling)
                        // might be either for scrolling (vertical swipe) or browser history navigating (horizontal swipe),
                        // prevent only the latter.
                        Pacem.avoidHandler(evt);
                    const d = getProjectedDistance(currentPosition.x, args.t0.position.x);
                    this._logFn(Pacem.Logging.LogLevel.Debug, `Moving element to x: ${d} (x0: ${args.t0.position.x})`);
                    const m = this._originalTransform;
                    //const d_pct = d / (w_half * 2);
                    el.style.transform = `matrix(${m.a},${m.b},${m.c},${m.d},${(m.e + d /*_pct*/)},${m.f})`;
                };
                this._endHandler = (evt) => {
                    var args = GET_VAL(this._element, SWIPE_DATA); //this._getUpdatedState({ position: this._getCurrentPosition(evt), timestamp: Date.now() });
                    this._endState(args);
                };
                Pacem.Utils.addClass(_element, Pacem.PCSS + '-swipe-lock');
                Pacem.Utils.removeClass(_element, Pacem.PCSS + '-swipe-back');
                this._originalTransform = Pacem.Utils.deserializeTransform(getComputedStyle(_element));
                // clientWidth causes reflow: use it only once here in the constructor.
                this._halfElementWidth = .5 * _element.clientWidth;
                this._threshold = _swiper.threshold || Math.min(120, Pacem.Utils.windowSize.width * .25);
                window.addEventListener('mouseup', this._endHandler, false);
                window.addEventListener('touchend', this._endHandler, false);
                window.addEventListener('mousemove', this._moveHandler, false);
                window.addEventListener('touchmove', this._moveHandler, TOUCH_OPTIONS);
            }
            dispose() {
                const el = this._element;
                DEL_VAL(el, MOUSEDOWN);
                DEL_VAL(el, SWIPE_DATA);
                DEL_VAL(el, DELEGATE);
                Pacem.Utils.removeClass(el, Pacem.PCSS + '-swipe-lock');
                window.removeEventListener('mouseup', this._endHandler, false);
                window.removeEventListener('touchend', this._endHandler, false);
                window.removeEventListener('mousemove', this._moveHandler, false);
                window.removeEventListener('touchmove', this._moveHandler, TOUCH_OPTIONS);
            }
            _getCurrentPosition(evt) {
                return (evt instanceof MouseEvent ? { x: evt.clientX, y: evt.clientY } : { x: evt.touches[0].clientX, y: evt.touches[0].clientY });
            }
            _refreshValues(now, init) {
                const pos = now.position, deltaX = pos.x - init.position.x, deltaTime = (now.timestamp - init.timestamp) / 1000.0 /*secs*/;
                return {
                    element: this._element,
                    horizontalspeed: deltaX / deltaTime,
                    verticalspeed: (pos.y - init.position.y) / deltaTime,
                    timestamp: now.timestamp,
                    position: pos,
                    t0: init['t0'] /* keep the existing one if available */ || init
                };
            }
            _updateState(args) {
                var args1 = this._getUpdatedState(args);
                SET_VAL(this._element, SWIPE_DATA, args1);
            }
            _getUpdatedState(args) {
                const el = this._element, swipe = this._swiper;
                const args0 = GET_VAL(el, SWIPE_DATA);
                return this._refreshValues(args, args0);
            }
            _endState(args) {
                if (!Pacem.Utils.isNull(args)) {
                    const swipe = this._swiper;
                    const el = this._element;
                    const threshold = this._threshold;
                    const from = Math.abs(args.t0.position.x - args.position.x);
                    const kinetic = .5 * Math.pow(args.horizontalspeed, 2);
                    const elastic = .5 * k_swipe * (Math.pow(threshold, 2) - Math.pow(from, 2));
                    let fnReset = () => {
                        el.style.transform =
                            el.style.opacity =
                                el.style.transition = '';
                    };
                    if (kinetic >= elastic && from >= threshold) {
                        const args2 = Pacem.UI.SwipeEventArgsClass.fromArgs(args);
                        this._logFn(Pacem.Logging.LogLevel.Debug, `Swiping ${args2.direction}! (speed: ${args2.speed}, kinetic ${kinetic}, elastic ${elastic})`);
                        const evt0 = new Pacem.UI.SwipeEvent(Pacem.UI.SwipeEventType.Swipe, args2, { cancelable: true });
                        swipe.dispatchEvent(evt0);
                        if (!evt0.defaultPrevented) {
                            const evt1 = new Pacem.UI.SwipeEvent(args2.direction === 'left' ? Pacem.UI.SwipeEventType.SwipeLeft : Pacem.UI.SwipeEventType.SwipeRight, args2, { cancelable: true });
                            swipe.dispatchEvent(evt1);
                            if (!evt1.defaultPrevented) {
                                // create ad-hoc animation for the element
                                let offset = Pacem.Utils.offset(el), wsize = Pacem.Utils.windowSize.width, tget = args2.direction === 'left' ? -(wsize - .5 * (wsize - offset.width)) : (offset.width + .5 * (wsize - offset.width)), delta = tget - offset.left, time /* in secs */ = delta / args.horizontalspeed;
                                el.style.transform = `translateX(${tget}px)`;
                                el.style.opacity = '0';
                                el.style.transition = /* ease-out-sine -> starts with x/t = 1 */ `transform ${Math.min(.667, Math.max(.333, 2 * time))}s cubic-bezier(0.39, 0.575, 0.565, 1), opacity .5s`;
                                Pacem.Utils.addClass(el, Pacem.PCSS + '-swipe-go');
                                Pacem.Utils.addAnimationEndCallback(el, () => {
                                    let evt2 = new Pacem.UI.SwipeEvent(Pacem.UI.SwipeEventType.SwipeAnimationEnd, args2, { cancelable: true });
                                    swipe.dispatchEvent(evt2);
                                    if (!evt2.defaultPrevented) {
                                        let evt3 = new Pacem.UI.SwipeEvent(args2.direction === 'left' ? Pacem.UI.SwipeEventType.SwipeLeftAnimationEnd : Pacem.UI.SwipeEventType.SwipeRightAnimationEnd, args2, { cancelable: true });
                                        swipe.dispatchEvent(evt3);
                                        if (!evt3.defaultPrevented) {
                                            fnReset();
                                        }
                                    }
                                    Pacem.Utils.removeClass(el, Pacem.PCSS + '-swipe-go');
                                });
                                //
                            }
                            else {
                                fnReset();
                            }
                        }
                        else {
                            fnReset();
                        }
                    }
                    else {
                        this._logFn(Pacem.Logging.LogLevel.Debug, `Rolling back: kinetic ${kinetic} < elastic ${elastic})`);
                        Pacem.Utils.addClass(el, Pacem.PCSS + '-swipe-back');
                        fnReset();
                    }
                }
                this.dispose();
            }
        }
        __decorate([
            Pacem.Throttle(25)
        ], SwipeElementDelegate.prototype, "_updateState", null);
        /**
         * Elasticity characteristic
         */
        const k_swipe = 0.15;
        const k_pan = 1.25;
        let PacemSwipeElement = class PacemSwipeElement extends Pacem.Behaviors.PacemBehavior {
            constructor() {
                super(...arguments);
                this._startHandler = (evt) => {
                    if (this.disabled)
                        return;
                    var el = evt.currentTarget, origin;
                    if (evt instanceof MouseEvent) {
                        if (!this.includeMouse) {
                            // does not handle mouse events, exit.
                            return;
                        }
                        origin = { x: evt.clientX, y: evt.clientY };
                    }
                    else {
                        if (evt.touches.length != 1)
                            return;
                        origin = { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
                    }
                    evt.stopPropagation();
                    SET_VAL(el, MOUSEDOWN, { position: origin, timestamp: Date.now() });
                    SET_VAL(el, DELEGATE, new SwipeElementDelegate(el, this, (level, message, category) => this.log.apply(this, [level, message, category])));
                };
            }
            decorate(element) {
                // TODO: https://docs.microsoft.com/en-us/microsoft-edge/dev-guide/dom/pointer-events
                element.addEventListener('touchstart', this._startHandler, TOUCH_OPTIONS);
                element.addEventListener('mousedown', this._startHandler, false);
            }
            undecorate(element) {
                element.removeEventListener('touchstart', this._startHandler, TOUCH_OPTIONS);
                element.removeEventListener('mousedown', this._startHandler, false);
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
        ], PacemSwipeElement.prototype, "threshold", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Boolean })
        ], PacemSwipeElement.prototype, "includeMouse", void 0);
        PacemSwipeElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-swipe' })
        ], PacemSwipeElement);
        Components.PacemSwipeElement = PacemSwipeElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/types.ts" />
/// <reference path="./types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        class PacemAdapter extends Components.PacemElement {
            constructor() {
                super(...arguments);
                this._propertyChangeHandler = (evt) => {
                    this.masterPropertyChangedCallback(evt.detail.propertyName, evt.detail.oldValue, evt.detail.currentValue, evt.detail.firstChange);
                };
            }
            /** Gets the adapted element. */
            get master() {
                return this._element;
            }
            /** Gets whether this adapter has been initialized or not. */
            get initialized() {
                return !Pacem.Utils.isNull(this._element);
            }
            /**
             * Handles the property changes for the master element.
             * @param name Name of the property that has changed
             * @param old Previous value
             * @param val Current value
             * @param first Is it the startup change?
             */
            masterPropertyChangedCallback(name, old, val, first) {
                switch (name) {
                    case 'items':
                        this._adjustFocusIndex();
                        break;
                    case 'index':
                        this._element.dispatchEvent(new Pacem.CurrentIndexChangeEvent({ currentIndex: val, previousIndex: old }));
                        break;
                }
            }
            /**
             * Handles the property changes for item elements.
             * @param index Index of the element among the items
             * @param name Name of the property that has changed
             * @param old Previous value
             * @param val Current value
             * @param first Is it the startup change?
             */
            itemPropertyChangedCallback(index, name, old, val, first) {
                // empty implementation
            }
            /** Called righat after the adapter 'initialize'. */
            initializeCallback() {
                // empty implementation
            }
            destroyCallback() {
                // empty implementation
            }
            initialize(adapted) {
                if (this._element != null) {
                    this.destroy();
                    //throw `Cannot initialize an adapter twice.`;
                }
                if (adapted != null) {
                    this._element = adapted;
                    this._element.addEventListener(Pacem.PropertyChangeEventName, this._propertyChangeHandler, false);
                }
                this.initializeCallback();
            }
            destroy() {
                if (this._element != null)
                    this._element.removeEventListener(Pacem.PropertyChangeEventName, this._propertyChangeHandler, false);
                this.destroyCallback();
            }
            disconnectedCallback() {
                this.destroy();
                super.disconnectedCallback();
            }
            _adjustFocusIndex() {
                let items = this._element.items;
                const index = this._element.index;
                const length = items && items.length;
                const ndxStart = length ? Math.max(0, Math.min(length - 1, index)) : -1;
                const ndx = this._getAvailable(ndxStart);
                this._element.index = ndx;
            }
            _getNextAvailable(ndxStart) {
                return this._getAvailable(ndxStart, 1);
            }
            _getPreviousAvailable(ndxStart) {
                return this._getAvailable(Math.max(0, ndxStart), -1);
            }
            _getAvailable(ndxStart = this._element && this._element.index, step = 0) {
                let items = this._element.items, length;
                if (!(items && (length = items.length) > 0))
                    return -1;
                ndxStart = ndxStart % length;
                let ndx = (ndxStart + step + length) % length;
                let item;
                step = step || -1;
                while ((item = items[ndx]) instanceof Components.PacemEventTarget && item.disabled === true
                    || (item instanceof Components.PacemElement && item.hide === true)) {
                    ndx = (ndx + step + length) % length;
                    if (ndx == ndxStart) {
                        // loop completed
                        return -1;
                    }
                }
                return ndx;
            }
            /**
             * Returns whether the provided index is close (adjacent or equal) to the current one in focus.
             * @param ndx index to be checked
             */
            isClose(ndx) {
                const current = this._getAvailable();
                return ndx === current
                    || ndx === this._getPreviousAvailable(current)
                    || ndx === this._getNextAvailable(current);
            }
            /**
             * Returns whether the provided index is adjacent (previous on the list) to the current one in focus.
             * @param ndx index to be checked
             */
            isPrevious(ndx) {
                const current = this._getAvailable();
                return ndx === this._getPreviousAvailable(current);
            }
            /**
             * Returns whether the provided index is adjacent (next on the list) to the current one in focus.
             * @param ndx index to be checked
             */
            isNext(ndx) {
                const current = this._getAvailable();
                return ndx === this._getNextAvailable(current);
            }
            select(ndx) {
                this._element.index = this._getAvailable(ndx);
            }
            previous(loop = true) {
                var prev = this._getPreviousAvailable(this._element.index);
                if (prev >= 0 && (loop || this._element.index > prev))
                    this._element.index = prev;
            }
            next(loop = true) {
                var next = this._getNextAvailable(this._element.index);
                if (next >= 0 && (loop || this._element.index < next))
                    this._element.index = next;
            }
        }
        Components.PacemAdapter = PacemAdapter;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/decorators.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        let PacemAnnihilatorElement = class PacemAnnihilatorElement extends HTMLElement {
            constructor() {
                super();
            }
            connectedCallback() {
                this.remove();
            }
        };
        PacemAnnihilatorElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-annihilator' })
        ], PacemAnnihilatorElement);
        Components.PacemAnnihilatorElement = PacemAnnihilatorElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/decorators.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        let PacemDataElement = class PacemDataElement extends Components.PacemEventTarget {
            constructor(storage = new Pacem.Storage()) {
                super();
                this.storage = storage;
                this._handle = 0;
                this._flag = false;
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                switch (name) {
                    case 'persistAs':
                        if (!Pacem.Utils.isNullOrEmpty(old))
                            this.storage.removeProperty(old);
                        if (first === true && !Pacem.Utils.isNullOrEmpty(val))
                            this.model = this.storage.getPropertyValue(val) || this.model;
                        break;
                    case 'model':
                        const debounce = this.debounce, throttle = this.throttle, emit = () => {
                            this.dispatchEvent(new Pacem.PropertyChangeEvent({ propertyName: name, oldValue: old, currentValue: val, firstChange: first }));
                        };
                        if (debounce > 0 && !first) {
                            if (throttle) {
                                if (this._flag)
                                    return;
                                this._flag = true;
                                emit();
                                this._handle = window.setTimeout(() => { this._flag = false; }, debounce);
                            }
                            else {
                                clearTimeout(this._handle);
                                this._handle = window.setTimeout(emit, debounce);
                            }
                        }
                        else {
                            emit();
                        }
                        // persist
                        if (!first && !Pacem.Utils.isNullOrEmpty(this.persistAs)) {
                            if (Pacem.Utils.isNull(val))
                                this.storage.removeProperty(this.persistAs);
                            else
                                this.storage.setPropertyValue(this.persistAs, val, true);
                        }
                        break;
                }
            }
        };
        __decorate([
            Pacem.Watch({ emit: false /* in order to debounce the propertychange emit */, converter: Pacem.PropertyConverters.Eval })
        ], PacemDataElement.prototype, "model", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemDataElement.prototype, "persistAs", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
        ], PacemDataElement.prototype, "debounce", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.BooleanStrict })
        ], PacemDataElement.prototype, "throttle", void 0);
        PacemDataElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-data' })
        ], PacemDataElement);
        Components.PacemDataElement = PacemDataElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/decorators.ts" />
/// <reference path="../../core/animations/easings.ts" />
/// <reference path="../../core/animations/events.ts" />
/// <reference path="../../core/animations/tween-service.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        let PacemTweenElement = class PacemTweenElement extends Components.PacemEventTarget {
            constructor(_tweener = new Pacem.Animations.TweenService()) {
                super();
                this._tweener = _tweener;
                this.duration = 1000;
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                if (name === 'start') {
                    if (val === true && this.disabled != true)
                        this._animate();
                }
            }
            _animate() {
                var started = false;
                this._tweener.run(this.from, this.to, this.duration, this.delay, this.easing, (time, value) => {
                    started = started == false && this.dispatchEvent(new Pacem.Animations.AnimationStartEvent());
                    this.dispatchEvent(new Pacem.Animations.AnimationEvent({ time: time, value: this.value = value }));
                    this.log(Pacem.Logging.LogLevel.Info, 'value: ' + this.value);
                    if (time == 1.0) {
                        this.dispatchEvent(new Pacem.Animations.AnimationEndEvent());
                        // reset start property
                        this.start = false; // <- will trigger the animation next time set to true
                    }
                });
            }
        };
        __decorate([
            Pacem.Watch({ emit: false })
        ], PacemTweenElement.prototype, "easing", void 0);
        __decorate([
            Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.Number })
        ], PacemTweenElement.prototype, "from", void 0);
        __decorate([
            Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.Number })
        ], PacemTweenElement.prototype, "to", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
        ], PacemTweenElement.prototype, "duration", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
        ], PacemTweenElement.prototype, "delay", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Boolean })
        ], PacemTweenElement.prototype, "start", void 0);
        __decorate([
            Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
        ], PacemTweenElement.prototype, "value", void 0);
        PacemTweenElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-tween' })
        ], PacemTweenElement);
        Components.PacemTweenElement = PacemTweenElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="tweener.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        let DockMode;
        (function (DockMode) {
            DockMode["Top"] = "top";
            DockMode["Bottom"] = "bottom";
        })(DockMode = Components.DockMode || (Components.DockMode = {}));
        let PacemDockElement = class PacemDockElement extends Components.PacemEventTarget {
            constructor(_tweener = new Pacem.Animations.TweenService()) {
                super();
                this._tweener = _tweener;
                this.mode = DockMode.Top;
                this.transitionDuration = 300 /* msecs */;
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                if (name === 'dock' && (!Pacem.Utils.isNull(old) || val != false))
                    this._doDock();
                else if (name === 'mode' && this.dock === true)
                    this._doDock();
            }
            _animate(from, to) {
                var transition = this.transitionDuration;
                if (!(transition > 0))
                    transition = 300;
                //
                return this._tweener.run(from, to, transition, this.delay, Pacem.Animations.Easings.sineInOut, (time, value) => {
                    this._setOffset(value);
                }).then(() => {
                    this._resetOffset();
                });
            }
            _setOffset(value) {
                this.style.transform = 'translateY(' + value + 'px)';
            }
            _resetOffset() {
                this.style.transform = '';
            }
            _compute() {
                const offset = Pacem.Utils.offset(this);
                const css = getComputedStyle(this);
                const scrollTop = Pacem.Utils.scrollTop;
                switch (this.mode) {
                    case DockMode.Bottom:
                        const marginBottom = parseInt(css.marginBottom);
                        const bottom = offset.top;
                        const deltaBottom = Pacem.Utils.windowSize.height - (bottom - scrollTop + this.offsetHeight);
                        return { delta: deltaBottom + marginBottom };
                    case DockMode.Top:
                        const marginTop = parseInt(css.marginTop);
                        const top = offset.top;
                        const delta = top - scrollTop;
                        return { delta: -(delta + marginTop) };
                }
            }
            _doDock() {
                const docked = this.dock;
                if (docked) {
                    const cmp = this._compute();
                    if (Pacem.Utils.isNull(cmp))
                        return;
                    //
                    // adding the css classes first...
                    Pacem.Utils.addClass(this, Pacem.PCSS + '-dock');
                    switch (this.mode) {
                        case DockMode.Bottom:
                            Pacem.Utils.removeClass(this, Pacem.PCSS + '-dock-top');
                            Pacem.Utils.addClass(this, Pacem.PCSS + '-dock-bottom');
                            break;
                        case DockMode.Top:
                            Pacem.Utils.removeClass(this, Pacem.PCSS + '-dock-bottom');
                            Pacem.Utils.addClass(this, Pacem.PCSS + '-dock-top');
                            break;
                    }
                    // ...so have to flip `from` and `to` 
                    const from = -cmp.delta;
                    const to = 0;
                    const state = Pacem.CustomElementUtils.getAttachedPropertyValue(this, 'pacem-dock:state') || 0;
                    Pacem.CustomElementUtils.setAttachedPropertyValue(this, 'pacem-dock:state', -from + state);
                    this.log(Pacem.Logging.LogLevel.Info, `animating from ${from}px to ${to}px`);
                    //
                    this._animate(from, to) /*.then(() => { })*/;
                }
                else {
                    // removing the css classes first then animating
                    const from = Pacem.CustomElementUtils.getAttachedPropertyValue(this, 'pacem-dock:state');
                    Pacem.CustomElementUtils.deleteAttachedPropertyValue(this, 'pacem-dock:state');
                    const to = 0;
                    this.log(Pacem.Logging.LogLevel.Info, `animating back from ${from}px to ${to}px`);
                    Pacem.Utils.removeClass(this, `${Pacem.PCSS}-dock ${Pacem.PCSS}-dock-top ${Pacem.PCSS}-dock-bottom`);
                    this._animate(from, to);
                }
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemDockElement.prototype, "mode", void 0);
        __decorate([
            Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
        ], PacemDockElement.prototype, "dock", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Element })
        ], PacemDockElement.prototype, "target", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
        ], PacemDockElement.prototype, "delay", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
        ], PacemDockElement.prototype, "transitionDuration", void 0);
        PacemDockElement = __decorate([
            Pacem.CustomElement({
                tagName: Pacem.P + '-dock'
            })
        ], PacemDockElement);
        Components.PacemDockElement = PacemDockElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/decorators.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        class PacemTransferProxyElement extends Components.PacemEventTarget {
            constructor() {
                super(...arguments);
                this._dom = [];
                this._children = [];
            }
            get dom() {
                return this._children;
            }
            viewActivatedCallback() {
                super.viewActivatedCallback();
                this.moveContent(this.proxy);
            }
            moveContent(to) {
                if (!Pacem.Utils.isNull(to)) {
                    if (Pacem.Utils.isNullOrEmpty(this._dom)) {
                        this._dom = Pacem.Utils.moveItems(this.childNodes, to);
                        this._children = this._dom.filter(e => e instanceof Element);
                    }
                    else {
                        Pacem.Utils.moveItems(this._children, to);
                    }
                }
            }
            disconnectedCallback() {
                for (let item of (this._dom || []).splice(0)) {
                    item.remove();
                }
                super.disconnectedCallback();
            }
        }
        Components.PacemTransferProxyElement = PacemTransferProxyElement;
        /** Moves its content to the document body and eventually removes it when disconnected. */
        let PacemBodyProxyElement = class PacemBodyProxyElement extends PacemTransferProxyElement {
            get proxy() {
                return document.body;
            }
        };
        PacemBodyProxyElement = __decorate([
            Pacem.CustomElement({
                tagName: Pacem.P + '-body-proxy'
            })
        ], PacemBodyProxyElement);
        Components.PacemBodyProxyElement = PacemBodyProxyElement;
        /** Moves its content to the closest shell and eventually removes it when disconnected. */
        let PacemShellProxyElement = class PacemShellProxyElement extends PacemTransferProxyElement {
            get proxy() {
                return Pacem.CustomElementUtils.findAncestorShell(this);
            }
        };
        PacemShellProxyElement = __decorate([
            Pacem.CustomElement({
                tagName: Pacem.P + '-shell-proxy'
            })
        ], PacemShellProxyElement);
        Components.PacemShellProxyElement = PacemShellProxyElement;
        /** Moves its content to the provided target element. */
        let PacemElementProxyElement = class PacemElementProxyElement extends PacemTransferProxyElement {
            get proxy() {
                return this.target;
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                if (name === 'target' && !first) {
                    this.moveContent(this.proxy);
                }
            }
        };
        __decorate([
            Pacem.Watch({ converter: Pacem.PropertyConverters.Element })
        ], PacemElementProxyElement.prototype, "target", void 0);
        PacemElementProxyElement = __decorate([
            Pacem.CustomElement({
                tagName: Pacem.P + '-element-proxy'
            })
        ], PacemElementProxyElement);
        Components.PacemElementProxyElement = PacemElementProxyElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/net/http.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        let PacemFetchElement = class PacemFetchElement extends Components.PacemEventTarget {
            constructor() {
                super();
                /** Gets or sets whether to trigger a fetch whenever a significant property has changed (default: true). */
                this.autofetch = true;
                this.debounce = 100;
            }
            viewActivatedCallback() {
                super.viewActivatedCallback();
                this._delayAndConditionallyFetch();
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                // parameters/headers -> in order to avoid unnecessary fetches don't compare byref but term by term in the json
                switch (name) {
                    case 'result':
                        this.dispatchEvent(new CustomEvent(Pacem.Net.FetchResultEventName, { detail: val }));
                        break;
                    case 'url':
                    case 'method':
                    case 'type':
                    case 'as':
                    case 'mode':
                    case 'credentials':
                    case 'disabled':
                    case 'autofetch':
                        this._delayAndConditionallyFetch();
                        break;
                    case 'parameters':
                    case 'headers':
                        if (!this.diffByValues
                            // spare round-trips: compare stringified values.
                            // state might be changed, by it's up to the dev to unlock this
                            // (i.e. just by calling 'fetch()' directly)
                            || Pacem.Utils.jsonSortStringify(old) != Pacem.Utils.jsonSortStringify(val)) {
                            this._delayAndConditionallyFetch();
                        }
                        break;
                }
            }
            _delayAndConditionallyFetch() {
                clearTimeout(this._handle);
                if (this.autofetch) {
                    this._handle = setTimeout(() => {
                        this.fetch();
                    }, this.debounce || 0);
                }
            }
            /** Returns a promise to a request with an already-used body. */
            // @Concurrent()
            fetch() {
                return new Promise((resolve, reject) => {
                    var url = this.url;
                    // any reason to exit now?
                    if (!this.isReady || Pacem.Utils.isNullOrEmpty(url) || this.disabled) {
                        resolve(null);
                        return;
                    }
                    // go on...
                    let _me = this;
                    _me.fetching = true;
                    const type = _me.type || 'json';
                    let contentType = 'application/json';
                    switch (type) {
                        case 'raw':
                            contentType = 'application/x-www-form-urlencoded';
                            break;
                    }
                    const method = (_me.method || Pacem.Net.HttpMethod.Get).toUpperCase();
                    let options = {
                        headers: Pacem.Utils.extend({ 'Content-Type': contentType }, _me.headers),
                        method: method,
                        mode: _me.mode || 'cors',
                        credentials: _me.credentials || 'same-origin',
                        cache: _me.cache || 'default'
                    };
                    const parameters = _me.parameters;
                    // complete a templated url, just in case (and remove params)
                    // Note:    templated urls might sound pleonastic where you can simply concatenate pieces of string.
                    //          They become handly in non-controllable autogenerated scenarios (e.g. autogenerated forms) where REST templated urls are involved.
                    url = Pacem.Utils.URIs.format(url, parameters, /* remove matched params if... */ method == "GET");
                    if (!Pacem.Utils.isNullOrEmpty(parameters)) {
                        switch (method) {
                            case 'GET':
                                url = Pacem.Utils.URIs.appendQuery(url, parameters);
                                break;
                            case 'PUT':
                            case 'POST':
                                switch (_me.type) {
                                    case 'raw':
                                        let searchParams = new URLSearchParams();
                                        for (let key in parameters)
                                            searchParams.set(key, parameters[key]);
                                        options.body = searchParams;
                                        break;
                                    default:
                                        options.body = Pacem.Utils.Json.stringify(parameters);
                                        break;
                                }
                                break;
                        }
                    }
                    // mandatory tmpl segments left over?
                    if (Pacem.Utils.URIs.hasMandatoryTemplateSegments(url)) {
                        // exit
                        resolve(null);
                        return;
                    }
                    fetch(url, options).then(r => {
                        _me.fetching = false;
                        if (r.ok) {
                            this.dispatchEvent(new CustomEvent(Pacem.Net.FetchSuccessEventName, { detail: r }));
                            switch (_me.as) {
                                case 'blob':
                                case 'image':
                                    r.blob().then(b => {
                                        if (_me.as === 'image')
                                            Pacem.Utils.blobToDataURL(b).then(i => {
                                                _me.result = i;
                                            });
                                        else
                                            _me.result = b;
                                        resolve(r);
                                    }, _ => {
                                        this.log(Pacem.Logging.LogLevel.Warn, `Couldn't parse a ${_me.as}. ${_}`);
                                        resolve(null);
                                    });
                                    break;
                                case 'text':
                                    r.text().then(t => {
                                        _me.result = t;
                                        resolve(r);
                                    });
                                    break;
                                default:
                                    if (r.headers.get("Content-Length") == "0") {
                                        // empty object
                                        _me.result = {};
                                        resolve(r);
                                    }
                                    else {
                                        r.json().then(j => {
                                            _me.result = j;
                                            resolve(r);
                                        }, _ => {
                                            this.log(Pacem.Logging.LogLevel.Warn, `Couldn't parse a ${_me.as}. ${_}`);
                                            resolve(null);
                                        });
                                    }
                                    break;
                            }
                        }
                        else {
                            this.dispatchEvent(new CustomEvent(Pacem.Net.FetchErrorEventName, { detail: r }));
                            reject(r);
                        }
                    });
                });
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.String })
        ], PacemFetchElement.prototype, "url", void 0);
        __decorate([
            Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.String })
        ], PacemFetchElement.prototype, "method", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Json })
        ], PacemFetchElement.prototype, "parameters", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Json })
        ], PacemFetchElement.prototype, "headers", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemFetchElement.prototype, "credentials", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemFetchElement.prototype, "mode", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemFetchElement.prototype, "cache", void 0);
        __decorate([
            Pacem.Watch({ converter: Pacem.PropertyConverters.BooleanStrict })
        ], PacemFetchElement.prototype, "fetching", void 0);
        __decorate([
            Pacem.Watch({ reflectBack: true, converter: Pacem.PropertyConverters.Boolean })
        ], PacemFetchElement.prototype, "autofetch", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemFetchElement.prototype, "as", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemFetchElement.prototype, "type", void 0);
        __decorate([
            Pacem.Watch({ reflectBack: true, converter: Pacem.PropertyConverters.Number })
        ], PacemFetchElement.prototype, "debounce", void 0);
        __decorate([
            Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.Boolean })
        ], PacemFetchElement.prototype, "diffByValues", void 0);
        __decorate([
            Pacem.Watch()
        ], PacemFetchElement.prototype, "result", void 0);
        PacemFetchElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-fetch' })
        ], PacemFetchElement);
        Components.PacemFetchElement = PacemFetchElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/decorators.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        let PacemHtmlProxyElement = class PacemHtmlProxyElement extends Components.PacemEventTarget {
            constructor() {
                super(...arguments);
                this._html = document.documentElement;
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                if (name === 'attr' && old) {
                    this._html.removeAttribute(old);
                }
                this._update();
            }
            _update() {
                const key = this.attr;
                if (Pacem.Utils.isNullOrEmpty(key) || this.disabled) {
                    // No key means do nothing
                    return;
                }
                const value = this.value;
                const html = this._html;
                if (Pacem.Utils.isNullOrEmpty(value)) {
                    html.removeAttribute(key);
                }
                else {
                    html.setAttribute(key, value);
                }
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemHtmlProxyElement.prototype, "attr", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemHtmlProxyElement.prototype, "value", void 0);
        PacemHtmlProxyElement = __decorate([
            Pacem.CustomElement({
                tagName: Pacem.P + '-html-proxy'
            })
        ], PacemHtmlProxyElement);
        Components.PacemHtmlProxyElement = PacemHtmlProxyElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        class PacemItemElement extends Components.PacemElement {
            get container() {
                return this._container;
            }
            /** @overridable */
            findContainer() {
                return Pacem.CustomElementUtils.findAncestor(this, n => n instanceof PacemItemsContainerElement);
            }
            viewActivatedCallback() {
                super.viewActivatedCallback();
                let iter = this._container = this.findContainer();
                if (!Pacem.Utils.isNull(iter))
                    iter.register(this);
            }
            disconnectedCallback() {
                if (!Pacem.Utils.isNull(this._container))
                    this._container.unregister(this);
                super.disconnectedCallback();
            }
        }
        Components.PacemItemElement = PacemItemElement;
        function isItemsContainer(object) {
            return 'items' in object
                && (Pacem.Utils.isNull(object.items) || Pacem.Utils.isArray(object.items))
                && typeof object.register === 'function'
                && typeof object.unregister === 'function';
        }
        Components.isItemsContainer = isItemsContainer;
        Components.ItemRegisterEventName = "itemregister";
        Components.ItemUnregisterEventName = "itemunregister";
        class ItemRegisterEvent extends Pacem.CustomTypedEvent {
            constructor(item, eventInit) {
                super(Components.ItemRegisterEventName, item, eventInit);
            }
        }
        Components.ItemRegisterEvent = ItemRegisterEvent;
        class ItemUnregisterEvent extends Pacem.CustomTypedEvent {
            constructor(item, eventInit) {
                super(Components.ItemUnregisterEventName, item, eventInit);
            }
        }
        Components.ItemUnregisterEvent = ItemUnregisterEvent;
        class ItemsContainerRegistrar {
            constructor(_container) {
                this._container = _container;
                if (_container == null || !(_container instanceof PacemItemsContainerElement || _container instanceof PacemCrossItemsContainerElement)) {
                    throw `Must provide a valid itemscontainer.`;
                }
            }
            register(item) {
                const container = this._container;
                var retval = false;
                if (!container.validate(item)) {
                    container.logger && container.logger.log(Pacem.Logging.LogLevel.Debug, `${(item && item.localName)} element couldn't be registered in a ${container.localName} element.`);
                }
                else {
                    if (Pacem.Utils.isNull(container.items)) {
                        container.items = [item];
                        retval = true;
                    }
                    else if (container.items.indexOf(item) === -1) {
                        container.items.push(item);
                        retval = true;
                    }
                }
                if (retval) {
                    container.dispatchEvent(new ItemRegisterEvent(item));
                }
                return retval;
            }
            unregister(item) {
                const container = this._container;
                const ndx = !Pacem.Utils.isNull(container.items) && container.items.indexOf(item);
                if (ndx >= 0) {
                    let item = container.items.splice(ndx, 1);
                    container.dispatchEvent(new ItemUnregisterEvent(item[0]));
                    return true;
                }
                return false;
            }
        }
        /** Element that can be used both as ItemElement and ItemsContainer. */
        class PacemCrossItemsContainerElement extends PacemItemElement {
            constructor(role, aria) {
                super(role, aria);
                this._registrar = new ItemsContainerRegistrar(this);
            }
            /**
             * Registers a new item among the items.
             * @param item {TItem} Item to be enrolled
             */
            register(item) {
                return this._registrar.register(item);
            }
            /**
             * Removes an existing element from the items.
             * @param item {TItem} Item to be removed
             */
            unregister(item) {
                return this._registrar.unregister(item);
            }
        }
        __decorate([
            Pacem.Watch( /* can only be databound or assigned at runtime */)
        ], PacemCrossItemsContainerElement.prototype, "items", void 0);
        Components.PacemCrossItemsContainerElement = PacemCrossItemsContainerElement;
        class PacemItemsContainerElement extends Components.PacemElement {
            constructor(role, aria) {
                super(role, aria);
                this._registrar = new ItemsContainerRegistrar(this);
            }
            /**
             * Registers a new item among the items.
             * @param item {TItem} Item to be enrolled
             */
            register(item) {
                return this._registrar.register(item);
            }
            /**
             * Removes an existing element from the items.
             * @param item {TItem} Item to be removed
             */
            unregister(item) {
                return this._registrar.unregister(item);
            }
        }
        __decorate([
            Pacem.Watch( /* can only be databound or assigned at runtime */)
        ], PacemItemsContainerElement.prototype, "items", void 0);
        Components.PacemItemsContainerElement = PacemItemsContainerElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="items-container.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        let PacemHubListener = class PacemHubListener extends Components.PacemItemElement {
            constructor() {
                super(...arguments);
                this.onreceive = (...args) => {
                    this.dispatchEvent(new CustomEvent('receive', { detail: Array.from(args) }));
                };
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                if (this.container instanceof PacemHubProxy && !Pacem.Utils.isNull(this.container.connection)) {
                    const conn = this.container.connection;
                    switch (name) {
                        case 'method':
                            if (!Pacem.Utils.isNullOrEmpty(old))
                                conn.off(old, this.onreceive);
                            if (!Pacem.Utils.isNullOrEmpty(val))
                                conn.on(val, this.onreceive);
                            break;
                        case 'disabled':
                            if (!Pacem.Utils.isNullOrEmpty(this.method)) {
                                let onoff = val ? conn.off : conn.on;
                                onoff(this.method, this.onreceive);
                            }
                            break;
                    }
                }
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemHubListener.prototype, "method", void 0);
        PacemHubListener = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-hub-listener' })
        ], PacemHubListener);
        Components.PacemHubListener = PacemHubListener;
        let PacemHubProxy = class PacemHubProxy extends Components.PacemItemsContainerElement {
            validate(item) {
                return item instanceof PacemHubListener;
            }
            get connection() {
                return this._hub;
            }
            invoke(method, ...args) {
                if (this.connected)
                    return this._hub.invoke.apply(this._hub, arguments);
                throw 'Hub is not connected. Cannot call `invoke` method.';
            }
            send(method, ...args) {
                if (this.connected)
                    return this._hub.send.apply(this._hub, arguments);
                throw 'Hub is not connected. Cannot call `send` method.';
            }
            start() {
                this._resetProxy();
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                //
                if (name === 'url' || name === 'disabled' || name === 'accesstoken') {
                    this._resetProxy();
                }
            }
            disconnectedCallback() {
                if (this.connected) {
                    this._hub.stop();
                }
                super.disconnectedCallback();
            }
            _resetProxy() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!Pacem.Utils.isNull(this._hub)) {
                        yield this._hub.stop();
                        this.connected = false;
                        this._setupProxy();
                    }
                    else {
                        this._setupProxy();
                    }
                });
            }
            _setupProxy() {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!this.disabled && !Pacem.Utils.isNullOrEmpty(this.url)) {
                        const connBuilder = new signalR.HubConnectionBuilder();
                        connBuilder.withUrl(this.url, {
                            accessTokenFactory: () => this.accesstoken
                        });
                        const h = this._hub = connBuilder.build();
                        h.onclose(() => {
                            this.connected = false;
                            this._hub = null;
                        });
                        yield h.start();
                        this.connected = true;
                        // on(...)
                        for (var item of this.items) {
                            if (item.disabled || Pacem.Utils.isNullOrEmpty(item.method))
                                continue;
                            h.on(item.method, item.onreceive);
                        }
                    }
                });
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemHubProxy.prototype, "url", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemHubProxy.prototype, "accesstoken", void 0);
        __decorate([
            Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
        ], PacemHubProxy.prototype, "connected", void 0);
        PacemHubProxy = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-hub-proxy' })
        ], PacemHubProxy);
        Components.PacemHubProxy = PacemHubProxy;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/decorators.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        let PacemIfElement = class PacemIfElement extends HTMLElement {
            propertyChangedCallback(name, old, val, first) {
                if (Pacem.Utils.isNullOrEmpty(this._innerHTML))
                    this._innerHTML = this.innerHTML;
                if (!val)
                    this.innerHTML = '';
                else
                    this.innerHTML = this._innerHTML;
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Boolean })
        ], PacemIfElement.prototype, "match", void 0);
        PacemIfElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-if' })
        ], PacemIfElement);
        Components.PacemIfElement = PacemIfElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        let PacemTextElement = class PacemTextElement extends HTMLElement {
            constructor() {
                super();
            }
            connectedCallback() {
                if (this.childNodes.length == 0)
                    this.innerHTML = '&nbsp;';
                this._text = this.childNodes.item(0);
            }
            propertyChangedCallback(name, old, val, first) {
                if (Pacem.Utils.isNull(val) && first === true)
                    return;
                this._text.nodeValue = val;
            }
        };
        __decorate([
            Pacem.Watch({ emit: false /*, debounce: true*/, converter: Pacem.PropertyConverters.String })
        ], PacemTextElement.prototype, "text", void 0);
        PacemTextElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-text' })
        ], PacemTextElement);
        Components.PacemTextElement = PacemTextElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/decorators.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        Components.ScrollEventName = 'scroll';
        class ScrollEvent extends Pacem.CustomTypedEvent {
            constructor(args) {
                super(Components.ScrollEventName, args);
            }
        }
        Components.ScrollEvent = ScrollEvent;
        // TODO: elementify the concept of an ochestrator
        // see also viewport-aware
        class PacemScrollOrchestrator {
            constructor(global) {
                this.global = global;
                this.scrollers = [];
                this.scrollHandler = (evt) => {
                    this._scroll(evt);
                };
            }
            register(vport) {
                const scrlls = this.scrollers;
                if (scrlls.indexOf(vport) === -1) {
                    scrlls.push(vport);
                    if (scrlls.length === 1) {
                        this.global.addEventListener('scroll', this.scrollHandler, false);
                    }
                    this._scroll();
                }
            }
            unregister(vport) {
                var ndx;
                const scrlls = this.scrollers;
                if ((ndx = scrlls.indexOf(vport)) !== -1) {
                    scrlls.splice(ndx, 1);
                    if (scrlls.length === 0) {
                        this.global.removeEventListener('scroll', this.scrollHandler, false);
                    }
                }
            }
            _scroll(evt) {
                const scrollTop = Pacem.Utils.scrollTop, scrollLeft = Pacem.Utils.scrollLeft;
                // this could jerk your scrolling experience...
                for (var el of this.scrollers) {
                    const offset = Pacem.Utils.offset(el.target || el), scrollElTop = offset.top - scrollTop, scrollElLeft = offset.left - scrollLeft, scrollOffset = { top: scrollElTop, left: scrollElLeft };
                    el.offset = scrollOffset;
                    el.dispatchEvent(new ScrollEvent({ top: scrollElTop, left: scrollElLeft }));
                }
            }
        }
        const ORCHESTRATOR = new PacemScrollOrchestrator(window);
        /**
         * Manages scrolling interactions firing self-referenced ad-hoc events.
         */
        let PacemScrollAwareElement = class PacemScrollAwareElement extends Pacem.Components.PacemEventTarget {
            viewActivatedCallback() {
                super.viewActivatedCallback();
                //
                ORCHESTRATOR.register(this);
            }
            disconnectedCallback() {
                ORCHESTRATOR.unregister(this);
                //
                super.disconnectedCallback();
            }
        };
        __decorate([
            Pacem.Watch({ converter: Pacem.PropertyConverters.Element })
        ], PacemScrollAwareElement.prototype, "target", void 0);
        __decorate([
            Pacem.Watch({ converter: Pacem.PropertyConverters.Json })
        ], PacemScrollAwareElement.prototype, "offset", void 0);
        PacemScrollAwareElement = __decorate([
            Pacem.CustomElement({
                tagName: Pacem.P + '-scroll-aware'
            })
        ], PacemScrollAwareElement);
        Components.PacemScrollAwareElement = PacemScrollAwareElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/decorators.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        // TODO: go native with IntersectionObserver 
        // https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
        // TODO: elementify the concept of an ochestrator
        // see also scroll-aware
        class PacemViewportOrchestrator {
            constructor(_global) {
                this._global = _global;
                this.viewports = [];
                this._checkHandler = (evt) => {
                    this._oncheck(evt);
                };
            }
            register(vport) {
                const vports = this.viewports, win = this._global;
                if (vports.indexOf(vport) === -1) {
                    vports.push(vport);
                    if (vports.length === 1) {
                        // TODO: check against overflow: 'auto' | 'scroll' elements with constrained heights/widths...
                        win.addEventListener('resize', this._checkHandler, false);
                        win.addEventListener('scroll', this._checkHandler, false);
                        win.addEventListener('transitionend', this._checkHandler, false);
                        win.addEventListener('animationend', this._checkHandler, false);
                    }
                    this._oncheck();
                }
            }
            unregister(vport) {
                var ndx;
                const vports = this.viewports, win = this._global;
                if ((ndx = vports.indexOf(vport)) !== -1) {
                    vports.splice(ndx, 1);
                    if (vports.length === 0) {
                        win.removeEventListener('resize', this._checkHandler, false);
                        win.removeEventListener('scroll', this._checkHandler, false);
                        win.removeEventListener('transitionend', this._checkHandler, false);
                        win.removeEventListener('animationend', this._checkHandler, false);
                    }
                    this._oncheck();
                }
            }
            isElementVisible(el, ignoreHorizontal) {
                const vportSize = Pacem.Utils.windowSize;
                var doc = this._global.document, rect = el.getBoundingClientRect(), vWidth = vportSize.width, vHeight = vportSize.height, efp = function (x, y) { return document.elementFromPoint(x, y); };
                return rect.bottom > 0 && rect.top < (0 + vHeight)
                    && (ignoreHorizontal || (rect.left < (vWidth + 0) && rect.right > 0));
            }
            _oncheck(evt) {
                for (var el of this.viewports) {
                    const tget = el.target || el;
                    const newviz = this.isElementVisible(tget, el.ignoreHorizontal);
                    if (newviz !== el.visible) {
                        var visible = el.visible = newviz;
                        if (visible)
                            Pacem.Utils.addClass(tget, Pacem.PCSS + '-in-viewport');
                        else
                            Pacem.Utils.removeClass(tget, Pacem.PCSS + '-in-viewport');
                    }
                }
            }
        }
        __decorate([
            Pacem.Debounce(100)
        ], PacemViewportOrchestrator.prototype, "_oncheck", null);
        const ORCHESTRATOR = new PacemViewportOrchestrator(window);
        let PacemViewportAwareElement = class PacemViewportAwareElement extends Components.PacemEventTarget {
            viewActivatedCallback() {
                super.viewActivatedCallback();
                //
                ORCHESTRATOR.register(this);
            }
            disconnectedCallback() {
                ORCHESTRATOR.unregister(this);
                //
                super.disconnectedCallback();
            }
        };
        __decorate([
            Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
        ], PacemViewportAwareElement.prototype, "visible", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Element })
        ], PacemViewportAwareElement.prototype, "target", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Boolean })
        ], PacemViewportAwareElement.prototype, "ignoreHorizontal", void 0);
        PacemViewportAwareElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-viewport-aware' })
        ], PacemViewportAwareElement);
        Components.PacemViewportAwareElement = PacemViewportAwareElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/decorators.ts" />
/// <reference path="../../../dist/js/resize-observer.d.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        Components.ResizeEventName = 'resize';
        class ResizeEvent extends Pacem.CustomTypedEvent {
            constructor(args) {
                super(Components.ResizeEventName, args);
            }
        }
        Components.ResizeEvent = ResizeEvent;
        const MUTATION_OBSERVER_INIT = { subtree: true, childList: true, attributes: true, characterData: true };
        /** Might be not the case to switch to native due to the lacks of their APIs */
        const GO_NATIVE_WHEN_AVAIL = true;
        const RESIZEOBSERVER_POLYFILLED = !('ResizeObserver' in window) || !GO_NATIVE_WHEN_AVAIL;
        const BORDER_BOX = { box: 'border-box' };
        let PacemResizeElement = class PacemResizeElement extends Components.PacemEventTarget {
            constructor() {
                super(...arguments);
                this._checkSizeHandler = (e) => {
                    this._assignSizeDebounced();
                };
            }
            get _target() {
                return this.target || this;
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                switch (name) {
                    case 'disabled':
                        this._start();
                        break;
                    case 'target':
                        if (!Pacem.Utils.isNull(this._observer)) {
                            var oldTarget = old || this;
                            this._observer.unobserve(oldTarget);
                        }
                    case 'watchPosition':
                        var newTarget = this.target || this;
                        if (this._usePolyfill) {
                            if (!Pacem.Utils.isNull(this._mutationObserver)) {
                                this._mutationObserver.observe(newTarget, MUTATION_OBSERVER_INIT);
                            }
                        }
                        else {
                            if (!Pacem.Utils.isNull(this._observer)) {
                                this._observer.observe(newTarget, BORDER_BOX);
                            }
                        }
                        break;
                }
            }
            get _usePolyfill() {
                return RESIZEOBSERVER_POLYFILLED || this.watchPosition;
            }
            _start() {
                // disabled? switch to stop
                if (this.disabled) {
                    this._stop();
                    return;
                }
                if (this.watchPosition) {
                    this._startWatchIntensively();
                }
                else if (this._usePolyfill) {
                    // polyfill using MutationObserver
                    this._mutationObserver = new MutationObserver(_ => {
                        this._checkSizeHandler();
                    });
                    this._mutationObserver.observe(this._target, MUTATION_OBSERVER_INIT);
                }
                else {
                    // native ResizeObserver
                    this._observer = new ResizeObserver(entries => {
                        var changed = false;
                        for (let entry of entries) {
                            if (entry.target !== this._target) {
                                continue;
                            }
                            if (entry.contentRect) {
                                changed = true;
                                break;
                            }
                        }
                        if (changed) {
                            // ResizeObserverEntry pieces of info aren't accurate,
                            // but useful enough to let punctually debounce
                            // the expensive request
                            this._assignSizeDebounced();
                        }
                    });
                    this._observer.observe(this._target, BORDER_BOX);
                }
                window.addEventListener('resize', this._checkSizeHandler, false);
            }
            _stop() {
                window.cancelAnimationFrame(this._handle);
                window.removeEventListener('resize', this._checkSizeHandler, false);
                if (this._usePolyfill) {
                    if (!Pacem.Utils.isNull(this._mutationObserver)) {
                        this._mutationObserver.disconnect();
                        this._mutationObserver = null;
                    }
                }
                else if (!Pacem.Utils.isNull(this._observer)) {
                    this._observer.disconnect();
                    this._observer = null;
                }
            }
            _startWatchIntensively() {
                this._handle = window.requestAnimationFrame(() => {
                    this._checkSize();
                    this._startWatchIntensively();
                });
            }
            _assignSizeDebounced() {
                this._checkSize();
            }
            _checkSize() {
                this.log(Pacem.Logging.LogLevel.Log, 'Resize flow triggered.');
                let el = this._target;
                const rect = Pacem.Utils.offset(el);
                let height = rect.height;
                let width = rect.width;
                if (height != this._previousHeight
                    || width != this._previousWidth
                    || (this.watchPosition &&
                        (rect.left != this._previousLeft
                            || rect.top != this._previousTop))) {
                    this._previousHeight = height;
                    this._previousWidth = width;
                    this._previousLeft = rect.left;
                    this._previousTop = rect.top;
                    this._dispatchResize();
                }
            }
            get currentSize() {
                var args = { height: this._previousHeight, width: this._previousWidth };
                if (this.watchPosition) {
                    args.left = this._previousLeft;
                    args.top = this._previousTop;
                }
                return args;
            }
            _dispatchResize() {
                this.dispatchEvent(new ResizeEvent(this.currentSize));
            }
            connectedCallback() {
                super.connectedCallback();
                this._start();
            }
            disconnectedCallback() {
                this._stop();
                super.disconnectedCallback();
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Element })
        ], PacemResizeElement.prototype, "target", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Boolean })
        ], PacemResizeElement.prototype, "watchPosition", void 0);
        __decorate([
            Pacem.Debounce(true)
        ], PacemResizeElement.prototype, "_assignSizeDebounced", null);
        PacemResizeElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-resize' })
        ], PacemResizeElement);
        Components.PacemResizeElement = PacemResizeElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/decorators.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        Components.PositionChangeEventName = 'positionchange';
        class PositionChangeEvent extends Pacem.CustomTypedEvent {
            constructor(args) {
                super(Components.PositionChangeEventName, args);
            }
        }
        Components.PositionChangeEvent = PositionChangeEvent;
        let PacemPositionElement = class PacemPositionElement extends Components.PacemEventTarget {
            constructor() {
                super();
                this._check = (_) => {
                    let el = this._target;
                    var pos = Pacem.Utils.offset(el);
                    let top = pos.top;
                    let left = pos.left;
                    if (top != this.previousTop
                        || left != this.previousLeft) {
                        this.previousTop = top;
                        this.previousLeft = left;
                        this._change();
                    }
                    this._timer = requestAnimationFrame(this._check);
                };
            }
            get _target() {
                return this.target || this;
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                switch (name) {
                    case 'disabled':
                        this.start();
                        break;
                }
            }
            start() {
                let el = this._target;
                if (this.disabled) {
                    cancelAnimationFrame(this._timer);
                }
                else {
                    var pos = Pacem.Utils.offset(el);
                    this.previousTop = pos.top;
                    this.previousLeft = pos.left;
                    this._timer = requestAnimationFrame(this._check);
                }
            }
            //@Debounce()
            _change() {
                this.dispatchEvent(new PositionChangeEvent({ top: this.previousTop, left: this.previousLeft }));
            }
            connectedCallback() {
                super.connectedCallback();
                this.start();
            }
            disconnectedCallback() {
                cancelAnimationFrame(this._timer);
                super.disconnectedCallback();
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Element })
        ], PacemPositionElement.prototype, "target", void 0);
        PacemPositionElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-position' })
        ], PacemPositionElement);
        Components.PacemPositionElement = PacemPositionElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/decorators.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        class AdjustEvent extends Pacem.CustomTypedEvent {
            constructor(size) {
                super('adjust', size);
            }
        }
        Components.AdjustEvent = AdjustEvent;
        let PacemOverlayElement = class PacemOverlayElement extends Components.PacemEventTarget {
            constructor() {
                super();
                this._check = (_) => {
                    let el = this.target;
                    const offset = Pacem.Utils.offset(el), width = offset.width, height = offset.height;
                    if (height != this._previousHeight
                        || width != this._previousWidth
                        || offset.left != this._previousLeft
                        || offset.top != this._previousTop) {
                        this._previousHeight = height;
                        this._previousWidth = width;
                        this._previousLeft = offset.left;
                        this._previousTop = offset.top;
                        this._adjust();
                    }
                    this._timer = requestAnimationFrame(this._check);
                };
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                switch (name) {
                    case 'target':
                    case 'disabled':
                        this.start();
                        break;
                }
            }
            start() {
                let el = this.target;
                cancelAnimationFrame(this._timer);
                if (!this.disabled && !Pacem.Utils.isNull(el)) {
                    this._previousHeight = el.offsetHeight;
                    this._previousWidth = el.offsetWidth;
                    const offset = Pacem.Utils.offset(el);
                    this._previousLeft = offset.left;
                    this._previousTop = offset.top;
                    this._timer = requestAnimationFrame(this._check);
                }
            }
            _adjust() {
                this.dispatchEvent(new AdjustEvent({
                    top: this._previousTop, left: this._previousLeft, width: this._previousWidth, height: this._previousHeight
                }));
            }
            connectedCallback() {
                super.connectedCallback();
                this.start();
            }
            disconnectedCallback() {
                cancelAnimationFrame(this._timer);
                super.disconnectedCallback();
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Element })
        ], PacemOverlayElement.prototype, "target", void 0);
        __decorate([
            Pacem.Debounce()
        ], PacemOverlayElement.prototype, "_adjust", null);
        PacemOverlayElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-overlay' })
        ], PacemOverlayElement);
        Components.PacemOverlayElement = PacemOverlayElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        let PacemPanelElement = class PacemPanelElement extends Components.PacemSafeContentElement {
        };
        PacemPanelElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-panel' })
        ], PacemPanelElement);
        Components.PacemPanelElement = PacemPanelElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        let PacemSpanElement = class PacemSpanElement extends Components.PacemSafeContentElement {
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                if (name === 'text' && !first) {
                    this.textContent = val;
                }
            }
            viewActivatedCallback() {
                super.viewActivatedCallback();
                if (!Pacem.Utils.isNull(this.text)) {
                    this.textContent = this.text;
                }
            }
        };
        __decorate([
            Pacem.Watch({ converter: Pacem.PropertyConverters.String })
        ], PacemSpanElement.prototype, "text", void 0);
        PacemSpanElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-span' })
        ], PacemSpanElement);
        Components.PacemSpanElement = PacemSpanElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/decorators.ts" />
/// <reference path="../../core/template.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        let PacemTemplateProxyElement = class PacemTemplateProxyElement extends Pacem.TemplateElement {
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Element })
        ], PacemTemplateProxyElement.prototype, "target", void 0);
        PacemTemplateProxyElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-template-proxy' })
        ], PacemTemplateProxyElement);
        Components.PacemTemplateProxyElement = PacemTemplateProxyElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/decorators.ts" />
/// <reference path="../../core/utils-customelement.ts" />
/// <reference path="types.ts" />
/// <reference path="template-proxy.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var PacemRepeaterElement_1;
        const GET_VAL = Pacem.CustomElementUtils.getAttachedPropertyValue;
        const SET_VAL = Pacem.CustomElementUtils.setAttachedPropertyValue;
        class ItemEvent extends Pacem.CustomTypedEvent {
            constructor(type, args, _originalEvent) {
                super(type, args, { bubbles: false, cancelable: true });
                this._originalEvent = _originalEvent;
            }
            /** Gets the bubbling item's Event. */
            get srcEvent() {
                return this._originalEvent;
            }
        }
        class ItemCommandEvent extends ItemEvent {
            constructor(evt) {
                super("item" + Pacem.CommandEventName, evt.detail, evt);
            }
        }
        Components.ItemCommandEvent = ItemCommandEvent;
        class CustomItemCommandEvent extends ItemEvent {
            constructor(evt) {
                super("item" + evt.detail.commandName.toLowerCase(), evt.detail.commandArgument, evt);
            }
        }
        Components.CustomItemCommandEvent = CustomItemCommandEvent;
        //
        /**
         * <pacem-repeater datasource="[{id:'first', items:['a','b','c']}, ...]">
         * <ol>
         *    <li>
         *      <template>
         *          <pacem-repeater datasource={{ ^item.items }}>
         *              <template>
         *                  <pacem-span text="{{ ^^item.id+': ': ^item.toUpperCase()  }}"></pacem-span>
         *              </template>
         *          </pacem-repeater>
         *      </template>
         *    </li>
         * </ol>
         * </pacem-repeater>
         */
        let PacemRepeaterElement = PacemRepeaterElement_1 = class PacemRepeaterElement extends Components.PacemEventTarget {
            constructor() {
                super(...arguments);
                this._childItems = [];
                this._fragment = document.createDocumentFragment();
                this._setupItem = (item, index, entity) => {
                    // FIRST set index on PacemRepeaterItemElement...
                    item.index = index;
                    // ...THEN the item entity itself.
                    item.item = entity;
                };
            }
            removeItem(index) {
                this._removeItems(index, index);
            }
            _setItem(item, index, frag) {
                const items = this._childItems;
                let _item;
                if (index >= items.length) {
                    _item = new RepeaterItem(this, this._itemTemplate, frag, this._childTemplatePlaceholder);
                    this._setupItem(_item, index, item);
                    items.push(_item);
                    _item.append();
                }
                else {
                    _item = items[index];
                    this._setupItem(_item, index, item);
                }
                this.dispatchEvent(new Components.RepeaterItemCreateEvent(_item));
            }
            _removeItems(fromIndex, toIndex) {
                const items = this._childItems;
                let exceeding = items.splice(fromIndex, toIndex + 1 - fromIndex);
                for (var i = exceeding.length - 1; i >= 0; i--) {
                    let item = exceeding[i];
                    this.dispatchEvent(new Components.RepeaterItemRemoveEvent(item));
                    item.remove();
                }
            }
            _databind() {
                // no template? fail.
                let tmpl = this._itemTemplate, holder = this._childTemplatePlaceholder;
                if (tmpl == null)
                    throw `Missing template element in ${PacemRepeaterElement_1.name}.`;
                // fill up
                let items = this._childItems, index = 0;
                try {
                    for (var entity of this.datasource || []) {
                        this._setItem(entity, index, this._fragment);
                        index++;
                    }
                }
                catch (e) {
                    this.log(Pacem.Logging.LogLevel.Error, e);
                }
                if (index < items.length) {
                    this._removeItems(index, items.length - 1);
                }
                else if (!Pacem.Utils.isNull(holder && holder.parentNode)) {
                    // flush added items
                    holder.parentNode.insertBefore(this._fragment, holder);
                }
            }
            _onCommand(evt) {
                // DO NOT stop bubbling! Might be 'handy' in autogenerated forms...
                // Pacem.stopPropagationHandler(evt);
                // ...But might lead to unwanted behaviors in nested repeaters.
                // Thus include the 'originalEvent' in the outscoped one as a read-only property.
                // 'itemcommand' event fires first
                this.dispatchEvent(new ItemCommandEvent(/* 'originalEvent' */ evt));
                // custom 'item<cmd>' event fires next
                this.dispatchEvent(new CustomItemCommandEvent(/* 'originalEvent' */ evt));
            }
            viewActivatedCallback() {
                super.viewActivatedCallback();
                this.addEventListener(Pacem.CommandEventName, this._onCommand, false);
                let proxy = this.querySelector(Pacem.P + '-template-proxy');
                if (!Pacem.Utils.isNull(proxy)) {
                    this._childTemplatePlaceholder = proxy;
                    this._itemTemplate = proxy.target;
                }
                else {
                    this._itemTemplate = this._childTemplatePlaceholder = this.querySelector('template');
                }
                this._databind();
            }
            disconnectedCallback() {
                this.removeEventListener(Pacem.CommandEventName, this._onCommand, false);
                this.datasource = [];
                super.disconnectedCallback();
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                if (name === 'datasource' && this._itemTemplate != null)
                    this._databind();
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Eval })
        ], PacemRepeaterElement.prototype, "datasource", void 0);
        __decorate([
            Pacem.Debounce(true)
        ], PacemRepeaterElement.prototype, "_databind", null);
        PacemRepeaterElement = PacemRepeaterElement_1 = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-repeater' })
        ], PacemRepeaterElement);
        Components.PacemRepeaterElement = PacemRepeaterElement;
        class RepeaterItem extends Pacem.RepeaterItem {
            constructor(_repeater, _template, _fragment, _holder) {
                super(document.createComment('pacem-repeater-item'));
                this._repeater = _repeater;
                this._template = _template;
                this._fragment = _fragment;
                this._holder = _holder;
                this._alterEgos = [];
                const FIELD_PREFIX = '_';
                function _setScopeValue(name, v) {
                    var owner = this, fieldName = FIELD_PREFIX + name;
                    if (v !== owner[fieldName]) {
                        var old = owner[fieldName];
                        owner[fieldName] = v;
                        var evt = new Pacem.PropertyChangeEvent({ propertyName: name, oldValue: old, currentValue: v });
                        owner.dispatchEvent(evt);
                    }
                }
                // placeholder on roids:
                let placeholder = this.placeholder;
                Object.defineProperties(placeholder, {
                    'item': {
                        get: function () {
                            return this[FIELD_PREFIX + 'item'];
                        },
                        set: function (v) {
                            _setScopeValue.apply(placeholder, ['item', v]);
                        }, configurable: true
                    },
                    'index': {
                        get: function () {
                            const val = this[FIELD_PREFIX + 'index'];
                            return Pacem.Utils.isNull(val) ? -1 : val;
                        },
                        set: function (v) {
                            _setScopeValue.apply(placeholder, ['index', v]);
                        }, configurable: true
                    }
                });
            }
            /** @internal */
            append() {
                let tmplRef = this._template, tmplParent = this._fragment;
                this._alterEgos.push(tmplParent.appendChild(this.placeholder));
                const clonedTmpl = tmplRef.cloneNode(true);
                var host;
                if (!Pacem.Utils.isNull(host = GET_VAL(this._repeater, Pacem.INSTANCE_HOST_VAR)))
                    Pacem.CustomElementUtils.assignHostContext(host, clonedTmpl);
                var dom = clonedTmpl.content. /*children*/childNodes;
                Array.prototype.push.apply(this._alterEgos, dom);
                tmplParent.appendChild(clonedTmpl.content);
            }
            get dom() {
                return this._alterEgos.filter(n => !(n instanceof Comment || n instanceof Text));
            }
            get repeater() {
                return this._repeater;
            }
            /** @internal */
            remove() {
                let tmplParent = this._holder.parentElement;
                for (var alterEgo of this._alterEgos) {
                    if (alterEgo.parentElement === tmplParent && !Pacem.Utils.isNull(tmplParent)) {
                        tmplParent.removeChild(alterEgo);
                    }
                }
            }
            get index() {
                return this.placeholder['index'];
            }
            set index(v) {
                this.placeholder['index'] = v;
            }
            get item() {
                return this.placeholder['item'];
            }
            set item(v) {
                this.placeholder['item'] = v;
            }
        }
        Components.RepeaterItem = RepeaterItem;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="types.ts" />
/// <reference path="items-container.ts" />
/// <reference path="adapter.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        class PacemIterableElement extends Components.PacemItemElement {
            /** @overrides */
            findContainer() {
                return Pacem.CustomElementUtils.findAncestor(this, n => n instanceof PacemIterativeElement);
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                const iter = this.container;
                const index = (iter && iter.items || []).indexOf(this);
                index >= 0
                    && iter
                    && iter.adapter
                    && iter.adapter.itemPropertyChangedCallback(index, name, old, val, first);
            }
        }
        Components.PacemIterableElement = PacemIterableElement;
        class PacemIterativeElement extends Components.PacemItemsContainerElement {
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                // notify the adapter, if any.
                this.adapter && this.adapter.masterPropertyChangedCallback(name, old, val, first);
                switch (name) {
                    case 'adapter':
                        if (!Pacem.Utils.isNull(old)) {
                            old.destroy();
                        }
                        if (!Pacem.Utils.isNull(val)) {
                            this.adapter.initialize(this);
                        }
                        break;
                    case 'items':
                        let ndx = 0;
                        if (!Pacem.Utils.isNullOrEmpty(this.items)) {
                            if (this.index < this.items.length) {
                                ndx = this.index;
                            }
                        }
                        this.index = ndx;
                        break;
                }
            }
            disconnectedCallback() {
                if (!Pacem.Utils.isNull(this.adapter))
                    this.adapter.destroy();
                super.disconnectedCallback();
            }
        }
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Element })
        ], PacemIterativeElement.prototype, "adapter", void 0);
        __decorate([
            Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
        ], PacemIterativeElement.prototype, "index", void 0);
        Components.PacemIterativeElement = PacemIterativeElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="types.ts" />
/// <reference path="text.ts" />
/// <reference path="scroll-aware.ts" />
/// <reference path="viewport-aware.ts" />
/// <reference path="resize.ts" />
/// <reference path="position.ts" />
/// <reference path="overlay.ts" />
/// <reference path="fetcher.ts" />
/// <reference path="panel.ts" />
/// <reference path="span.ts" />
/// <reference path="data.ts" />
/// <reference path="repeater.ts" />
/// <reference path="annihilator.ts" />
/// <reference path="adapter.ts" />
/// <reference path="iterative.ts" />
/// <reference path="dock.ts" />
/// <reference path="../../core/decorators.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        const REMOVE_VALUE = 'false';
        const EMPTY_VALUE = 'true';
        let PacemLayoutProxyElement = class PacemLayoutProxyElement extends Components.PacemEventTarget {
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                this._update();
            }
            _update() {
                const key = this.attr;
                if (Pacem.Utils.isNullOrEmpty(key) || this.disabled) {
                    // No key means do nothing
                    return;
                }
                const value = this.value;
                const layout = Pacem.CustomElementUtils.findAncestorShell(this);
                if (Pacem.Utils.isNullOrEmpty(value) || value === REMOVE_VALUE) {
                    layout.removeAttribute(key);
                }
                else {
                    layout.setAttribute(key, value === EMPTY_VALUE ? '' : value);
                }
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemLayoutProxyElement.prototype, "attr", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemLayoutProxyElement.prototype, "value", void 0);
        PacemLayoutProxyElement = __decorate([
            Pacem.CustomElement({
                tagName: Pacem.P + '-layout-proxy'
            })
        ], PacemLayoutProxyElement);
        Components.PacemLayoutProxyElement = PacemLayoutProxyElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/decorators.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        let PacemMetaProxyElement = class PacemMetaProxyElement extends Components.PacemEventTarget {
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                this._update();
            }
            viewActivatedCallback() {
                super.viewActivatedCallback();
                this._update();
            }
            _update() {
                const value = this.content;
                const nameBased = !Pacem.Utils.isNullOrEmpty(this.name);
                const key = nameBased ? this.name : this.itemprop;
                if (Pacem.Utils.isNullOrEmpty(key) || this.disabled) {
                    // No key means do nothing
                    return;
                }
                const escapedKey = Pacem.Utils.cssEscape(key);
                const query = nameBased ? `meta[name='${escapedKey}']` : `meta[itemprop='${escapedKey}']`;
                var meta = document.head.querySelector(query);
                if (Pacem.Utils.isNull(meta)) {
                    meta = document.createElement('meta');
                    document.head.appendChild(meta);
                }
                else if (Pacem.Utils.isNullOrEmpty(value)) {
                    // Empty `content` means "remove the element".
                    meta.remove();
                    return;
                }
                // set
                meta.setAttribute("content", value);
                meta.setAttribute(nameBased ? "name" : "itemprop", key);
                meta.removeAttribute(nameBased ? "itemprop" : "name");
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemMetaProxyElement.prototype, "name", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemMetaProxyElement.prototype, "itemprop", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemMetaProxyElement.prototype, "content", void 0);
        __decorate([
            Pacem.Debounce(true)
        ], PacemMetaProxyElement.prototype, "_update", null);
        PacemMetaProxyElement = __decorate([
            Pacem.CustomElement({
                tagName: Pacem.P + '-meta-proxy'
            })
        ], PacemMetaProxyElement);
        Components.PacemMetaProxyElement = PacemMetaProxyElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/types.ts" />
/// <reference path="../../core/eventtarget.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        let PacemOnlineStatusElement = class PacemOnlineStatusElement extends Components.PacemEventTarget {
            constructor() {
                super(...arguments);
                this._onlineHandler = (evt) => {
                    if (!Pacem.Utils.isNull(evt)) {
                        this.online = evt.type === 'online';
                    }
                    else {
                        this.online = navigator.onLine || false;
                    }
                };
            }
            connectedCallback() {
                super.connectedCallback();
                window.addEventListener('online', this._onlineHandler, false);
                window.addEventListener('offline', this._onlineHandler, false);
            }
            viewActivatedCallback() {
                super.viewActivatedCallback();
                this._onlineHandler();
            }
            disconnectedCallback() {
                window.removeEventListener('online', this._onlineHandler, false);
                window.removeEventListener('offline', this._onlineHandler, false);
                super.connectedCallback();
            }
        };
        __decorate([
            Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
        ], PacemOnlineStatusElement.prototype, "online", void 0);
        PacemOnlineStatusElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-online-status' })
        ], PacemOnlineStatusElement);
        Components.PacemOnlineStatusElement = PacemOnlineStatusElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    class RouterNavigateEvent extends Pacem.CustomTypedEvent {
        constructor(path) {
            super('navigate', path, { cancelable: false, bubbles: false });
        }
    }
    Pacem.RouterNavigateEvent = RouterNavigateEvent;
})(Pacem || (Pacem = {}));
(function (Pacem) {
    var Components;
    (function (Components) {
        const CHECK_PATTERN = /^([\w\.]:)?\/\/[^\/]+/;
        const URL_PATTERN = /^((https?:)?\/\/[^\/]+)?([^\?#]+)(\?[^#]*)?(#[^#]*)?$/;
        let PacemRouterElement = class PacemRouterElement extends Components.PacemEventTarget {
            constructor() {
                super(...arguments);
                this._onPopState = (evt) => {
                    if (!Pacem.Utils.isNull(evt.state)) {
                        this.path = evt.state.$path;
                    }
                };
            }
            navigate(path, title) {
                const l = document.location;
                if (CHECK_PATTERN.test(path)) {
                    if (!path.startsWith(l.protocol + '//' + l.host)) {
                        throw `Only same-origin navigation is currently supported. "${path}" is not a valid path.`;
                    }
                }
                const segments = this._segmentateUrl(path), state = this.state = this._parseState(segments.path + segments.query + segments.hash, segments.path, segments.query, segments.hash);
                var poppingState = (l.pathname + l.search + l.hash) === segments.path + segments.query + segments.hash;
                if (poppingState) {
                    window.history.replaceState(state, title);
                }
                else {
                    window.history.pushState(state, title, path);
                }
                if (!Pacem.Utils.isNullOrEmpty(title)) {
                    document.title = title;
                }
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                if (name === 'path') {
                    this.navigate(val);
                    window.dispatchEvent(new Pacem.RouterNavigateEvent(val));
                }
            }
            connectedCallback() {
                super.connectedCallback();
                window.addEventListener('popstate', this._onPopState, false);
            }
            disconnectedCallback() {
                window.removeEventListener('popstate', this._onPopState, false);
                super.disconnectedCallback();
            }
            _parseTemplate() {
                const trunks = [];
                let tmpl = this.template;
                if (!Pacem.Utils.isNullOrEmpty(tmpl)) {
                    let res;
                    while ((res = /\/\{([a-z\$_][\w]*)\??\}/g.exec(tmpl)) != null) {
                        const prop = res[1], item = res[0];
                        trunks.push({ name: prop, optional: item.charAt(item.length - 2) === '?' });
                        tmpl = tmpl.substr(res.index + item.length);
                    }
                }
                return trunks;
            }
            _segmentateUrl(url) {
                const regArr = URL_PATTERN.exec(url);
                if (!regArr || regArr.length <= 3) {
                    return null;
                }
                return { path: regArr[3], query: regArr[4] || '', hash: regArr[5] || '' };
            }
            _parseState(fullPath, path, query, hash) {
                var obj = {
                    $path: fullPath,
                    $querystring: query.length > 0 ? query.substr(1) : query,
                    $query: this._parseQuery(query),
                    $hash: this._parseHash(hash)
                }, i = 0;
                const tmpl = this._parseTemplate();
                if (!Pacem.Utils.isNullOrEmpty(tmpl)) {
                    let res;
                    while ((res = /\/[a-zA-Z0-9\$_-]+/g.exec(path)) != null) {
                        const v = res[0];
                        if (i >= tmpl.length) {
                            throw `Length mismatch: cannot compare provided path with current template.`;
                        }
                        const prop = tmpl[i];
                        Object.defineProperty(obj, prop.name, { enumerable: true, value: v.substr(1) });
                        i++;
                        path = path.substr(res.index + v.length);
                    }
                }
                for (let k = i; k < tmpl.length; k++) {
                    if (!tmpl[k].optional) {
                        throw `Must provide "${tmpl[k].name}" route value.`;
                    }
                }
                return obj;
            }
            _parseHash(hash) {
                const ndx = hash.indexOf('#');
                if (ndx !== 0) {
                    return null;
                }
                return hash.substr(ndx + 1);
            }
            _parseQuery(search) {
                const obj = {};
                const ndx = search.indexOf('?');
                if (ndx === 0) {
                    search.substr(ndx + 1).split('&').forEach(pair => {
                        const kvp = pair.split('=');
                        if (kvp.length == 2 && !Pacem.Utils.isNullOrEmpty(kvp[1])) {
                            Object.defineProperty(obj, decodeURIComponent(kvp[0]), { enumerable: true, value: decodeURIComponent(kvp[1]) });
                        }
                    });
                }
                return obj;
            }
        };
        __decorate([
            Pacem.Watch({ converter: Pacem.PropertyConverters.String })
        ], PacemRouterElement.prototype, "template", void 0);
        __decorate([
            Pacem.Watch({ converter: Pacem.PropertyConverters.Eval })
        ], PacemRouterElement.prototype, "state", void 0);
        __decorate([
            Pacem.Watch({ converter: Pacem.PropertyConverters.String })
        ], PacemRouterElement.prototype, "path", void 0);
        PacemRouterElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-router' })
        ], PacemRouterElement);
        Components.PacemRouterElement = PacemRouterElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/types.ts" />
/// <reference path="../../core/eventtarget.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        const KEYEVT = "keydown";
        function matchesKeyCombination(evt, combo, accumulator = []) {
            if (Pacem.Utils.isNullOrEmpty(combo)) {
                return false;
            }
            const modifierPattern = /(\w+)\s*\+/;
            const modifiers = [];
            let regExc;
            while (!Pacem.Utils.isNullOrEmpty(regExc = modifierPattern.exec(combo))) {
                combo = combo.substr(regExc.index + regExc[0].length);
                modifiers.push(regExc[1]);
            }
            if (!Pacem.CustomEventUtils.matchModifiers(evt, modifiers)) {
                return false;
            }
            const pieces = combo.split(',').map(p => p.trim().toLowerCase());
            if (Pacem.Utils.isNullOrEmpty(pieces)) {
                // bad combination format
                return false;
            }
            var char = evt.key.toLowerCase();
            if (charEquals(char, pieces[accumulator.length])) {
                accumulator.push(char);
                return accumulator.length == pieces.length ? true : "ongoing";
            }
            return false;
        }
        function charEquals(key, piece) {
            return key === piece
                // adjust some aliases
                || (key === "escape" && piece === "esc")
                || (key === "backspace" && piece === "back")
                || (key === "control" && piece === "ctrl")
                || (key === "delete" && (piece === "del" || piece === "canc"))
                || (/^arrow/.test(key) && (piece === key.substr(5)));
        }
        Components.KeyboardShortcutExecuteEventName = "execute";
        let PacemShortcutElement = class PacemShortcutElement extends Components.PacemEventTarget {
            constructor() {
                super(...arguments);
                this._accumulator = [];
                this._shortcutHandler = (evt) => {
                    const result = (matchesKeyCombination(evt, this.combination, this._accumulator));
                    switch (result) {
                        case true:
                            Pacem.avoidHandler(evt);
                            this.dispatchEvent(new Event(Components.KeyboardShortcutExecuteEventName, { bubbles: false, cancelable: false }));
                        // let flow below...
                        case false:
                            this._accumulator.splice(0);
                            break;
                    }
                };
            }
            viewActivatedCallback() {
                super.connectedCallback();
                this._addHandler();
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                if (name === 'target' && !first) {
                    this._removeHandler(old);
                    this._addHandler(val);
                }
            }
            disconnectedCallback() {
                this._removeHandler();
                super.disconnectedCallback();
            }
            _removeHandler(target = this.target) {
                (target || window).removeEventListener(KEYEVT, this._shortcutHandler, false);
            }
            _addHandler(target = this.target) {
                (target || window).addEventListener(KEYEVT, this._shortcutHandler, false);
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemShortcutElement.prototype, "combination", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Element })
        ], PacemShortcutElement.prototype, "target", void 0);
        PacemShortcutElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-shortcut' })
        ], PacemShortcutElement);
        Components.PacemShortcutElement = PacemShortcutElement;
        ;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/decorators.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        let PacemStyleProxyElement = class PacemStyleProxyElement extends Components.PacemEventTarget {
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                switch (name) {
                    case 'cssText':
                        if (!Pacem.Utils.isNull(this._style)) {
                            this.cssReady = false;
                            this._style.textContent = val;
                            if (Pacem.Utils.isNullOrEmpty(val)) {
                                this.cssReady = true;
                            }
                            else {
                                this._idleWhileReady();
                            }
                        }
                        break;
                    case 'disabled':
                    case 'src':
                        this._fetch();
                        break;
                }
            }
            viewActivatedCallback() {
                super.viewActivatedCallback();
                const style = this._style = document.createElement('style');
                style.setAttribute('type', 'text/css');
                document.head.appendChild(style);
                this._fetch();
            }
            disconnectedCallback() {
                if (!Pacem.Utils.isNull(this._style)) {
                    this._style.remove();
                }
                super.disconnectedCallback();
            }
            _idleWhileReady() {
                let css = this._style.sheet;
                let fn = () => {
                    try {
                        if (css.cssRules.length > 0) {
                            clearInterval(handle);
                            this.cssReady = true;
                            this.dispatchEvent(new Event('cssready'));
                        }
                    }
                    catch (e) { }
                };
                let handle = setInterval(fn, 100);
            }
            _fetch() {
                const src = this.src, style = this._style;
                if (this.disabled || Pacem.Utils.isNull(style)) {
                    return;
                }
                if (Pacem.Utils.isNullOrEmpty(src)) {
                    style.textContent = this.cssText || '';
                }
                else {
                    // fetching
                    this.cssReady = false;
                    fetch(src).then(resp => {
                        resp.text().then(css => {
                            style.textContent = css;
                            this._idleWhileReady();
                        }, _ => {
                            // error
                            this.cssReady = true;
                        });
                    }, _ => {
                        // error
                        this.cssReady = true;
                    });
                }
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemStyleProxyElement.prototype, "src", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemStyleProxyElement.prototype, "cssText", void 0);
        __decorate([
            Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
        ], PacemStyleProxyElement.prototype, "cssReady", void 0);
        PacemStyleProxyElement = __decorate([
            Pacem.CustomElement({
                tagName: Pacem.P + '-style-proxy'
            })
        ], PacemStyleProxyElement);
        Components.PacemStyleProxyElement = PacemStyleProxyElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/types.ts" />
/// <reference path="../../core/eventtarget.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        let PacemTimerElement = class PacemTimerElement extends Components.PacemEventTarget {
            constructor() {
                super();
                this._handle = 0;
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                switch (name) {
                    case 'interval':
                    case 'disabled':
                        this._restart();
                        break;
                }
            }
            viewActivatedCallback() {
                super.viewActivatedCallback();
                this._restart();
            }
            disconnectedCallback() {
                window.clearInterval(this._handle);
                super.disconnectedCallback();
            }
            _restart() {
                clearInterval(this._handle);
                if (!this.disabled && this.interval > 0) {
                    this._handle = window.setInterval(() => {
                        this.dispatchEvent(new Event("tick", { bubbles: false, cancelable: false }));
                    }, this.interval);
                }
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
        ], PacemTimerElement.prototype, "interval", void 0);
        PacemTimerElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-timer' })
        ], PacemTimerElement);
        Components.PacemTimerElement = PacemTimerElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../core/decorators.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        let PacemTitleProxyElement = class PacemTitleProxyElement extends Components.PacemEventTarget {
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                this._update();
            }
            viewActivatedCallback() {
                super.viewActivatedCallback();
                this._update();
            }
            _update() {
                const value = this.value;
                if (Pacem.Utils.isNullOrEmpty(value) || this.disabled) {
                    // No key means do nothing
                    return;
                }
                document.title = value;
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemTitleProxyElement.prototype, "value", void 0);
        PacemTitleProxyElement = __decorate([
            Pacem.CustomElement({
                tagName: Pacem.P + '-title-proxy'
            })
        ], PacemTitleProxyElement);
        Components.PacemTitleProxyElement = PacemTitleProxyElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        let PacemWebWorkerProxyElement = class PacemWebWorkerProxyElement extends Components.PacemEventTarget {
            constructor() {
                super(...arguments);
                this.autosend = true;
                this._messageHandler = (evt) => {
                    this.result = evt.data;
                    this.dispatchEvent(new CustomEvent('receive', { detail: evt.data, bubbles: false, cancelable: false }));
                };
                this._errorHandler = (evt) => {
                    this.dispatchEvent(new CustomEvent('error', { detail: evt.error, bubbles: false, cancelable: false }));
                };
            }
            viewActivatedCallback() {
                super.viewActivatedCallback();
                this._initializeWorker();
            }
            propertyChangedCallback(name, old, val, first) {
                super.propertyChangedCallback(name, old, val, first);
                if (!first) {
                    switch (name) {
                        case 'src':
                            this._disposeWorker();
                            this._initializeWorker(val);
                            break;
                        case 'autosend':
                        case 'disabled':
                        case 'message':
                            if (this.autosend) {
                                this.send(this.message);
                            }
                            break;
                    }
                }
            }
            disconnectedCallback() {
                this._disposeWorker();
                super.disconnectedCallback();
            }
            send(message = this.message) {
                if (this.disabled) {
                    return;
                }
                const worker = this._worker;
                if (!Pacem.Utils.isNull(worker)) {
                    worker.postMessage(message);
                }
            }
            _initializeWorker(src = this.src) {
                if (!Pacem.Utils.isNullOrEmpty(src)) {
                    const worker = this._worker = new Worker(src);
                    worker.addEventListener('message', this._messageHandler, false);
                    worker.addEventListener('error', this._errorHandler, false);
                }
            }
            _disposeWorker(worker = this._worker) {
                if (!Pacem.Utils.isNull(worker)) {
                    worker.removeEventListener('error', this._errorHandler, false);
                    worker.removeEventListener('message', this._messageHandler, false);
                    worker.terminate();
                }
            }
        };
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemWebWorkerProxyElement.prototype, "message", void 0);
        __decorate([
            Pacem.Watch({ converter: Pacem.PropertyConverters.String })
        ], PacemWebWorkerProxyElement.prototype, "result", void 0);
        __decorate([
            Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
        ], PacemWebWorkerProxyElement.prototype, "src", void 0);
        __decorate([
            Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.Boolean })
        ], PacemWebWorkerProxyElement.prototype, "autosend", void 0);
        PacemWebWorkerProxyElement = __decorate([
            Pacem.CustomElement({ tagName: Pacem.P + '-webworker-proxy' })
        ], PacemWebWorkerProxyElement);
        Components.PacemWebWorkerProxyElement = PacemWebWorkerProxyElement;
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
