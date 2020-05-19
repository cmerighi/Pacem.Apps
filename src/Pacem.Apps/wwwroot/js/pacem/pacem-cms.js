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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/// <reference path="../../../dist/js/pacem-core.d.ts" />
/// <reference path="../../../dist/js/pacem-ui.d.ts" />
/// <reference path="../../../dist/js/pacem-scaffolding.d.ts" />
/// <reference path="../../../dist/js/pacem-plus.d.ts" />
var Pacem;
(function (Pacem) {
    var Cms;
    (function (Cms) {
        Cms.PermissionEditEventName = 'permissionedit';
        class PermissionEditEvent extends CustomEvent {
            constructor(permissible) {
                super(Cms.PermissionEditEventName, { detail: permissible, cancelable: false, bubbles: true });
            }
        }
        Cms.PermissionEditEvent = PermissionEditEvent;
        class Permissible {
            static canEdit(claims, resource) { return this._canDoSomethingToResource(claims, resource, p => p.update); }
            static canRead(claims, resource) { return this._canDoSomethingToResource(claims, resource, p => p.read); }
            static canAdd(claims, resource) { return this._canDoSomethingToResource(claims, resource, p => p.create); }
            static canDelete(claims, resource) { return this._canDoSomethingToResource(claims, resource, p => p.delete); }
            static canTranslate(claims, resource) { return this._canDoSomethingToResource(claims, resource, p => p.translate); }
            static _canDoSomethingToResource(claims, resource, predicate) {
                if (Pacem.Utils.isNullOrEmpty(claims) || Pacem.Utils.isNull(resource)) {
                    return false;
                }
                // if no permissions are set, then you're free to go!
                var editable = true;
                if (resource.permissions && resource.permissions.length > 0) {
                    // check correspondence otherwise
                    editable = false;
                    for (let permission of resource.permissions) {
                        if (predicate(permission) && claims[permission.claimType] && claims[permission.claimType].indexOf(permission.claimValue) >= 0) {
                            return true;
                        }
                    }
                }
                // return
                return editable;
            }
        }
        Cms.Permissible = Permissible;
    })(Cms = Pacem.Cms || (Pacem.Cms = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../../dist/js/pacem-scaffolding.d.ts" />
var Pacem;
(function (Pacem) {
    var Cms;
    (function (Cms) {
        var OpenApi;
        (function (OpenApi) {
            const BAG = 'pacem:metadatabag';
            class SwaggerCmsParser {
                constructor(_openApi = new Pacem.Scaffolding.OpenApi.SwaggerParser()) {
                    this._openApi = _openApi;
                    this._cachedMetadataUrls = [];
                }
                load(url, headers) {
                    return __awaiter(this, void 0, void 0, function* () {
                        let api = yield this._openApi.load(url, headers);
                        if (api != null) {
                            api[BAG] = {};
                            // greedy load of datafields
                            for (let endpoint of api.endpoints) {
                                yield this._enrichSchemas(api, endpoint, headers);
                            }
                        }
                        return api;
                    });
                }
                _enrichSchemas(api, endpoint, headers) {
                    return __awaiter(this, void 0, void 0, function* () {
                        const response = endpoint.response;
                        if (response && response.meta) {
                            response.fields = yield this._fetchMetadata(api, { name: response.fullType, schema: response.meta }, headers);
                        }
                        // parameters?
                        const parameters = endpoint.parameters;
                        for (let parameter of (parameters || [])) {
                            if (parameter.meta && parameter.fullType) {
                                let fields = yield this._fetchMetadata(api, { name: parameter.fullType, schema: parameter.meta }, headers);
                                parameter.fields = fields;
                            }
                        }
                    });
                }
                clearCache() {
                    const cache = this.cache, keys = this._cachedMetadataUrls;
                    if (cache) {
                        for (let key of keys) {
                            cache.removeProperty(key);
                        }
                        // clear keys
                        keys.splice(0);
                    }
                }
                /**
                 *
                 * @param def1
                 * @param headers HTTP headers for API fetching
                 */
                _fetchMetadata(api, def0, headers) {
                    return __awaiter(this, void 0, void 0, function* () {
                        let _fetch = (def1) => __awaiter(this, void 0, void 0, function* () {
                            let cols = [];
                            if (def1 && def1.name) {
                                // short-circuit if already in the bag
                                if (api[BAG][def1.name]) {
                                    return api[BAG][def1.name];
                                }
                                /* reserve a place for this type so that it gets not fetched again if aggressive recursion occurs */ api[BAG][def1.name] = cols;
                                let meta = { props: [] }, metadataUrl;
                                if (/^https?:\/\//.test(def1.name)) {
                                    // name is url? then it's the endpoint for type metadata, fetch it!
                                    metadataUrl = def1.name;
                                }
                                else {
                                    console.warn(`Swagger entity definition keys must appear in form of absolute url. Their response to a GET request needs to be the entity metadata itself.\nNo other options are currently supported.`);
                                    return;
                                }
                                if (metadataUrl) {
                                    let retrieveFn = () => __awaiter(this, void 0, void 0, function* () {
                                        let response = yield fetch(metadataUrl, { credentials: 'omit', mode: 'cors', headers: headers });
                                        if (response.ok) {
                                            return yield response.json();
                                        }
                                    });
                                    if (this.cache) {
                                        // check for session cache
                                        meta = this.cache.getPropertyValue(metadataUrl);
                                        if (!meta) {
                                            // no cache available? then fetch...
                                            meta = yield retrieveFn();
                                            this._cachedMetadataUrls.push(metadataUrl);
                                            this.cache.setPropertyValue(metadataUrl, meta, /* persist in session not on location */ false);
                                        }
                                    }
                                    else {
                                        // do fetch
                                        meta = yield retrieveFn();
                                    }
                                }
                                let schema = def1.schema;
                                for (let col in schema.properties) {
                                    let column = schema.properties[col], field = meta && meta.props.find(p => p.prop === col);
                                    let datafield = Object.assign({
                                        prop: col, type: column.type || 'text'
                                    }, field || /* if there's no match, then read-only */ { isReadOnly: true });
                                    if (field) {
                                        let $ref = (column.items && column.items.$ref) || column.$ref;
                                        if ($ref) {
                                            let ref = Pacem.Scaffolding.OpenApi.getOpenApiDefinition(api, $ref), key = ref.name;
                                            if (api[BAG][key]) {
                                                datafield.props = api[BAG][key];
                                            }
                                            else {
                                                // recursion here
                                                datafield.props = yield _fetch(ref);
                                            }
                                        }
                                    }
                                    cols.push(datafield);
                                }
                            }
                            return cols;
                        });
                        return yield _fetch(def0);
                    });
                }
            }
            OpenApi.SwaggerCmsParser = SwaggerCmsParser;
        })(OpenApi = Cms.OpenApi || (Cms.OpenApi = {}));
    })(Cms = Pacem.Cms || (Pacem.Cms = {}));
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Cms;
        (function (Cms) {
            /** Function container proxy (used in metadata) */
            Cms.Functions = {
                'dismiss': (...args) => {
                    for (let name of args || []) {
                        delete Cms.Functions[name];
                    }
                },
                'handleExpressionValueChange': (evt, prop, entity) => {
                    if (evt.detail.propertyName === 'value' && !Pacem.Utils.isNull(entity)) {
                        const value = evt.detail.currentValue;
                        if (entity instanceof HTMLElement) {
                            // handle the entity as an element and modify the attribute
                            let attr = Pacem.CustomElementUtils.camelToKebab(prop);
                            if (Pacem.Utils.isNullOrEmpty(value)) {
                                entity.removeAttribute(attr);
                            }
                            else {
                                entity.setAttribute(attr, value.toString());
                            }
                        }
                        else {
                            entity[prop] = value;
                        }
                    }
                }
            };
            /** Default metadata ('expression' field) 'type' factory. */
            Cms.EXPRESSION_METADATA_TYPE = (host, hostRef = ':host', hostEntityRef = ':host.entity') => {
                const attrs = {}, meta = host.metadata, fns = Pacem.Components.Cms.Functions, fnKeys = [];
                attrs['value'] = `{{ ${hostEntityRef} instanceof HTMLElement && ${hostEntityRef}.getAttribute('${Pacem.CustomElementUtils.camelToKebab(meta.prop)}') }}`;
                attrs['on-' + Pacem.PropertyChangeEventName] = `Pacem.Components.Cms.Functions.handleExpressionValueChange($event, '${meta.prop}', ${hostEntityRef})`;
                attrs['converter'] = `{{ Pacem.CustomElementUtils.getWatchedProperty(${hostEntityRef}, '${meta.prop}').config.converter }}`;
                const tagName = Pacem.P + '-expression';
                let extra = (meta.extra || {});
                // selector
                if (!Pacem.Utils.isNullOrEmpty(extra.selector)) {
                    attrs['selector'] = extra.selector;
                }
                // filters to the selector
                if (!Pacem.Utils.isNullOrEmpty(extra.filter)) {
                    switch (typeof extra.filter) {
                        case 'string':
                            attrs['filter'] = `{{ (e) => e.constructor.name === "${extra.filter}" || e.localName === "${extra.filter.toLowerCase()}" }}`;
                            break;
                        case 'function':
                            const fnKey = 'fn' + Pacem.Utils.uniqueCode();
                            fns[fnKey] = extra.filter;
                            attrs['filter'] = `{{ Pacem.Components.Cms.Functions.${fnKey}, once }}`;
                            // tidy-up memento
                            fnKeys.push(fnKey);
                            break;
                    }
                }
                // labeler
                if (typeof extra.labeler === 'function') {
                    const fnKey = 'fn' + Pacem.Utils.uniqueCode();
                    fns[fnKey] = extra.labeler;
                    attrs['labeler'] = `{{ Pacem.Components.Cms.Functions.${fnKey}, once }}`;
                    // tidy-up memento
                    fnKeys.push(fnKey);
                }
                if (fnKeys.length > 0) {
                    // tidy-up
                    attrs['on-unload'] = `{{ Pacem.Components.Cms.Functions.dismiss('${fnKeys.join('\',\'')}') }}`;
                }
                return { tagName: tagName, attrs: attrs };
            };
        })(Cms = Components.Cms || (Components.Cms = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Cms;
        (function (Cms) {
            class PacemElementPickerElementBase extends Pacem.Components.Scaffolding.PacemBaseElement {
            }
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemElementPickerElementBase.prototype, "selector", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Eval })
            ], PacemElementPickerElementBase.prototype, "filter", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Eval })
            ], PacemElementPickerElementBase.prototype, "labeler", void 0);
            Cms.PacemElementPickerElementBase = PacemElementPickerElementBase;
            let PacemElementPickerElement = class PacemElementPickerElement extends PacemElementPickerElementBase {
                get inputFields() {
                    return [this._select];
                }
                toggleReadonlyView(readonly) {
                    this._select.readonly = readonly;
                }
                onChange(_) {
                    return Pacem.Utils.fromResult(this.value = this._select.value);
                }
                acceptValue(val) {
                    this._select.value = val;
                }
                getViewValue(value) {
                    return this._select.viewValue;
                }
                convertValueAttributeToProperty(attr) {
                    return Pacem.PropertyConverters.Element.convert(attr);
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this._databind();
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (!first) {
                        switch (name) {
                            case 'selector':
                            case 'filter':
                            case 'labeler':
                                this._databind();
                                break;
                        }
                    }
                }
                _databind() {
                    const project = this.labeler || (e => {
                        let label = e.constructor.name;
                        if (e.id) {
                            label += '#' + e.id;
                        }
                        return label;
                    });
                    const retval = [];
                    document.querySelectorAll(this.selector || '[pacem]').forEach((e, i, arr) => {
                        if ((Pacem.Utils.isNull(this.filter) || this.filter(e) === true)
                            // let' say 'id' is a must-have...
                            && !Pacem.Utils.isNullOrEmpty(e.id)) {
                            retval.push({ element: e, label: project(e) });
                        }
                    });
                    this._select.valueProperty = 'element';
                    this._select.textProperty = 'label';
                    this._select.datasource = retval;
                }
            };
            __decorate([
                Pacem.ViewChild(Pacem.P + '-select')
            ], PacemElementPickerElement.prototype, "_select", void 0);
            __decorate([
                Pacem.Debounce(50)
            ], PacemElementPickerElement.prototype, "_databind", null);
            PacemElementPickerElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-element-picker', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-select></${Pacem.P}-select>`
                })
            ], PacemElementPickerElement);
            Cms.PacemElementPickerElement = PacemElementPickerElement;
        })(Cms = Components.Cms || (Components.Cms = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="element-picker.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Cms;
        (function (Cms) {
            let ExpressionSource;
            (function (ExpressionSource) {
                ExpressionSource["Constant"] = "const";
                ExpressionSource["PropertyReference"] = "property";
                ExpressionSource["Expression"] = "expr";
            })(ExpressionSource = Cms.ExpressionSource || (Cms.ExpressionSource = {}));
            let PacemExpressionElement = class PacemExpressionElement extends Cms.PacemElementPickerElementBase {
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'converter') {
                        this._setFeedbackText(this.value);
                    }
                    else if (!first) {
                        if (this._editing) {
                            switch (name) {
                                case '_source':
                                    switch (val) {
                                        case ExpressionSource.PropertyReference:
                                            this._picker.focus();
                                            break;
                                        default:
                                            this._editor.focus();
                                            break;
                                    }
                                    break;
                                case '_propRef':
                                    if (!Pacem.Utils.isNullOrEmpty(val)) {
                                        this._editor.focus();
                                        this._editor.value = '{{ #' + this._sourceRef.id + '.' + val + '  }}';
                                    }
                                    this.changeHandler(new Event('change'));
                                    break;
                            }
                        }
                    }
                }
                get inputFields() {
                    return [this._editor];
                }
                toggleReadonlyView(readonly) {
                    if (readonly) {
                        // ensure not editing
                        this._editing = false;
                    }
                }
                setPristine() {
                    super.setPristine();
                    this._editing = false;
                }
                onChange(_) {
                    return Pacem.Utils.fromResult(this.value = this._editor.value);
                }
                acceptValue(val) {
                    this._view.textContent = val || '...';
                    this._setFeedbackText(val);
                    this._reverseStructure();
                    if (val !== this._editor.value) {
                        this._editor.value = val;
                    }
                }
                _setFeedbackText(val = this.value) {
                    const converter = this.converter;
                    if (Pacem.CustomElementUtils.isBindingAttribute(val) || typeof (converter && converter.convert) !== 'function') {
                        this._eval.setAttribute('text', val);
                    }
                    else if (val === undefined) {
                        this._eval.text = '<undefined>';
                    }
                    else {
                        this._eval.text = converter.convert(val);
                    }
                }
                getViewValue(value) {
                    return value;
                }
                convertValueAttributeToProperty(attr) {
                    return attr;
                }
                _reverseStructure() {
                    let cleanup = () => {
                        this._source = this._sourceRef = this._propRef = /*this.value =*/ undefined;
                    };
                    // dependencies?
                    let expr = this.value;
                    if (!Pacem.Utils.isNullOrEmpty(expr)) {
                        // setup the most likely form fields
                        if (Pacem.CustomElementUtils.isBindingAttribute(expr)) {
                            const expression = Pacem.CustomElementUtils.parseBindingAttribute(expr, this), deps = expression.dependencies;
                            // complex or simple (one dependency) expression
                            if (Pacem.Utils.isNullOrEmpty(deps) || deps.length > 1) {
                                this._source = ExpressionSource.Expression;
                            }
                            else {
                                const dep = deps[0];
                                this._source = ExpressionSource.PropertyReference;
                                this._sourceRef = document.querySelector('#' + dep.element.id);
                                this._propRef = dep.path;
                            }
                        }
                        else {
                            this._source = ExpressionSource.Constant;
                        }
                        //
                    }
                    else {
                        cleanup();
                    }
                }
            };
            __decorate([
                Pacem.Watch({ emit: false })
            ], PacemExpressionElement.prototype, "converter", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemExpressionElement.prototype, "_editing", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemExpressionElement.prototype, "_source", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Element })
            ], PacemExpressionElement.prototype, "_sourceRef", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemExpressionElement.prototype, "_propRef", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-element-picker')
            ], PacemExpressionElement.prototype, "_picker", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-textarea')
            ], PacemExpressionElement.prototype, "_editor", void 0);
            __decorate([
                Pacem.ViewChild('span.' + Pacem.PCSS + '-viewfinder')
            ], PacemExpressionElement.prototype, "_view", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-text')
            ], PacemExpressionElement.prototype, "_eval", void 0);
            __decorate([
                Pacem.Debounce(50)
            ], PacemExpressionElement.prototype, "_reverseStructure", null);
            PacemExpressionElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-expression', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-collapse class="${Pacem.PCSS}-expression" collapse="{{ !:host._editing }}">
    <div class="expression-builder ${Pacem.PCSS}-grid grid-tiny-rowgap grid-tiny-colgap ${Pacem.PCSS}-pad pad-bottom-2">
        <div class="${Pacem.PCSS}-cell">
            <${Pacem.P}-select value="{{ :host._source, twoway }}" class="display-block">
                <${Pacem.P}-data-item value="${ExpressionSource.Constant}" label="constant value"></${Pacem.P}-data-item>
                <${Pacem.P}-data-item value="${ExpressionSource.PropertyReference}" label="property reference"></${Pacem.P}-data-item>
                <${Pacem.P}-data-item value="${ExpressionSource.Expression}" label="complex expression"></${Pacem.P}-data-item>
            </${Pacem.P}-select>
        </div>

        <${Pacem.P}-panel class="${Pacem.PCSS}-cell cols-hd-6" hide="{{ :host._source !== '${ExpressionSource.PropertyReference}' }}">
            <${Pacem.P}-element-picker value="{{ :host._sourceRef, twoway }}" selector="{{ :host.selector }}" filter="{{ :host.filter }}" labeler="{{ :host.labeler }}" class="display-block"></${Pacem.P}-element-picker>
        </${Pacem.P}-panel>
        <${Pacem.P}-panel class="${Pacem.PCSS}-cell cols-hd-6" hide="{{ :host._source !== '${ExpressionSource.PropertyReference}' }}">
            <${Pacem.P}-property-picker value="{{ :host._propRef, twoway }}" disabled="{{ !:host._sourceRef }}" target="{{ :host._sourceRef }}" on-change="::_editor.focus()" class="display-block"></${Pacem.P}-property-picker>
        </${Pacem.P}-panel>

        <${Pacem.P}-panel class="${Pacem.PCSS}-cell">
            <${Pacem.P}-textarea class="display-block" placeholder="{{ '{{ '+ (:host._source || '') +'... }}' }}" change-policy="${Pacem.Components.Scaffolding.ChangePolicy.Blur}"></${Pacem.P}-textarea>
        </${Pacem.P}-panel>
    </div>
</${Pacem.P}-collapse>
<div class="${Pacem.PCSS}-fieldset">
    <div class="fieldset-left">
        <div class="${Pacem.PCSS}-fieldgroup ${Pacem.PCSS}-viewfinder">
            <div><span class="text-ellipsed ${Pacem.PCSS}-viewfinder display-block text-tech ${Pacem.PCSS}-pad pad-left-1 pad-right-1">{{ :host.value || '...' }}</span></div>
            <${Pacem.P}-panel class="fieldgroup-prepend">
                <${Pacem.P}-button class="flat edit ${Pacem.PCSS}-pad pad-left-1" on-click=":host._editing = !:host._editing" hide="{{ :host.readonly }}"></${Pacem.P}-button>
            </${Pacem.P}-panel>
            <${Pacem.P}-panel class="fieldgroup-append text-tech display-flex flex-middle flex-nowrap" hide="{{ $pacem.isNullOrEmpty(:host.value) }}">
                <i class="${Pacem.PCSS}-icon text-primary">keyboard_arrow_right</i>
                <${Pacem.P}-text text="?" class="bg-primary ${Pacem.PCSS}-pad pad-left-1 pad-right-1 ${Pacem.PCSS}-margin margin-right-1 text-truncate" eval></${Pacem.P}-text>
            </${Pacem.P}-panel>
        </div>
    </div>
</div>`
                })
            ], PacemExpressionElement);
            Cms.PacemExpressionElement = PacemExpressionElement;
        })(Cms = Components.Cms || (Components.Cms = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Cms;
        (function (Cms) {
            const DEFAULT_PERMISSION_METADATA = {
                props: [
                    {
                        prop: 'permissions',
                        // child form-fields
                        type: 'array',
                        display: { name: 'Permissions' },
                        props: {
                            display: { cssClass: [Pacem.PCSS + '-cell', Pacem.PCSS + '-grid', 'grid-novgap', 'grid-tiny-colgap', 'grid-nospace'], name: 'Permission' },
                            props: Array.prototype.concat.apply([
                                {
                                    prop: 'claimType', type: 'string',
                                    display: { cssClass: [Pacem.PCSS + '-cell', 'cols-hd-4', 'cols-lg-6', 'field-stretch', 'field-minimal'], name: 'Claim type' },
                                    validators: [{ type: 'required', errorMessage: '!' }]
                                },
                                {
                                    prop: 'claimValue', type: 'string',
                                    display: { cssClass: [Pacem.PCSS + '-cell', 'cols-hd-4', 'cols-lg-6', 'field-stretch', 'field-minimal'], name: 'Claim value' },
                                    validators: [{ type: 'required', errorMessage: '!' }]
                                },
                            ], ['read', 'update', 'create', 'delete'].map((p, j) => {
                                return {
                                    prop: p,
                                    type: 'boolean',
                                    display: { cssClass: [Pacem.PCSS + '-cell', 'cols-hd-1', 'cols-3', 'field-minimal', Pacem.PCSS + '-pad pad-left-2'], name: p.charAt(0).toUpperCase() + p.substr(1) }
                                };
                            }))
                        }
                    }
                ]
            };
            Cms.DEFAULT_METADATA = {
                display: { name: 'Widget', cssClass: [Pacem.PCSS + '-grid', 'grid-novgap', 'grid-tiny-colgap', 'grid-nospace'] },
                props: [
                    { prop: 'tag', type: 'string', display: { name: 'Tag', cssClass: [Pacem.PCSS + '-cell'] } }
                ]
            };
            function cellifyMetadata(p) {
                // ensure pacem-cell cssClass
                p.display = p.display || { name: p.prop, cssClass: [] };
                const css = p.display.cssClass = p.display.cssClass || [];
                css.push(Pacem.PCSS + '-cell');
            }
            function gridifyMetadata(metadata) {
                var props = metadata && metadata.props || [];
                var display = metadata && metadata.display || { name: 'Element' };
                if (!Pacem.Utils.isNull(display)) {
                    const css = display.cssClass = display.cssClass || [];
                    Array.prototype.push.apply(css, Cms.DEFAULT_METADATA.display.cssClass);
                }
                props.forEach(cellifyMetadata);
                return { display: display, props: props };
            }
            Cms.gridifyMetadata = gridifyMetadata;
            function buildWidgetMetadata(metadata) {
                var display = Pacem.Utils.extend({}, Cms.DEFAULT_METADATA.display, metadata && metadata.display || {});
                var props = Pacem.Utils.clone(Cms.DEFAULT_METADATA.props);
                Array.prototype.push.apply(props, (metadata && metadata.props || []).filter(p => {
                    if (p.prop === 'tag') {
                        return false;
                    }
                    cellifyMetadata(p);
                    return true;
                }));
                return { display: display, props: props };
            }
            Cms.buildWidgetMetadata = buildWidgetMetadata;
            const WIDGET_CSS_CLASS = Pacem.PCSS + '-widget';
            /** Default metadata ('expression' field) 'extra' object. */
            Cms.EXPRESSION_WIDGET_METADATA_EXTRA = {
                selector: '.' + WIDGET_CSS_CLASS,
                labeler: (e) => {
                    if (!Pacem.Utils.isNullOrEmpty(e.tag)) {
                        return e.tag;
                    }
                    return (e.metadata && e.metadata.display && e.metadata.display.name || '') + '#' + e.id;
                }
            };
            class Widget {
                /**
                 * Utility method for widget gathering.
                 * @param predicate Predicate for filtering
                 */
                static findAll(predicate) {
                    return Pacem.CustomElementUtils.findAll('.' + WIDGET_CSS_CLASS, (widget) => widget instanceof PacemWidgetElement && !Pacem.Utils.isNullOrEmpty(widget.id) && (Pacem.Utils.isNull(predicate) || predicate(widget)));
                }
            }
            Cms.Widget = Widget;
            let PacemWidgetToolbarElement = class PacemWidgetToolbarElement extends Components.PacemElement {
                /** Gets the toolbar's edit button. */
                get editButton() {
                    return this._btnEdit;
                }
                /** Gets the toolbar's permimssions button. */
                get permissionsButton() {
                    return this._btnPerms;
                }
                /** Gets the toolbar's remove button. */
                get removeButton() {
                    return this._btnRemove;
                }
                _edit(evt) {
                    const form = this._proxy.dom.find(e => 'core' in e.attributes);
                    form.open(this.target) /*.then(_ => {
                        // reset metadata (this will force complete recycle next time)
                        // form.metadata = [];
                    })*/;
                    form.metadata = this.target.metadata;
                    // popout
                    this._popoutJustInCase();
                }
                _editPermissions(evt) {
                    const form = this._proxy.dom.find(e => 'permissions' in e.attributes);
                    form.open(this.target);
                    form.metadata = this.target.permissionMetadata;
                    // popout
                    this._popoutJustInCase();
                }
                _popoutJustInCase() {
                    const balloon = Pacem.CustomElementUtils.findAncestorOfType(this, Pacem.Components.UI.PacemBalloonElement);
                    if (!Pacem.Utils.isNullOrEmpty(balloon)) {
                        balloon.popout();
                    }
                }
            };
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Element })
            ], PacemWidgetToolbarElement.prototype, "target", void 0);
            __decorate([
                Pacem.ViewChild('.buttons > div')
            ], PacemWidgetToolbarElement.prototype, "_toolbar", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-button[edit]')
            ], PacemWidgetToolbarElement.prototype, "_btnEdit", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-button[permissions]')
            ], PacemWidgetToolbarElement.prototype, "_btnPerms", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-button[remove]')
            ], PacemWidgetToolbarElement.prototype, "_btnRemove", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-shell-proxy')
            ], PacemWidgetToolbarElement.prototype, "_proxy", void 0);
            PacemWidgetToolbarElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-widget-toolbar', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-span class="toolbar-text" content="{{ '<i class=&quot;${Pacem.PCSS}-icon&quot;>'+ (::target.metadata && ::target.metadata.display && ::target.metadata.display.icon || 'widgets') +'</i> '+ (::target.tag || (::target.metadata && ::target.metadata.display && ::target.metadata.display.name || ::target.localName) +'#'+ ::target.id) }}"></${Pacem.P}-span>
<div class="buttons ${Pacem.PCSS}-buttonset ${Pacem.PCSS}-pad ${Pacem.PCSS}-margin pad-0 margin-left-2">
    <div class="buttonset-left">
        <${Pacem.P}-button edit class="button edit" on-click=":host._edit($event)"></${Pacem.P}-button>
        <${Pacem.P}-button permissions class="button" on-click=":host._editPermissions($event)" css-class="{{ {'button-success': ::target.permissions.length > 0} }}" icon-glyph="verified_user"></${Pacem.P}-button>
        <${Pacem.P}-button remove class="button button-danger delete"></${Pacem.P}-button>
    </div>
<div>
<${Pacem.P}-shell-proxy>
    <${Pacem.P}-modal-form autogenerate="true" core></${Pacem.P}-modal-form>
    <${Pacem.P}-modal-form autogenerate="true" permissions></${Pacem.P}-modal-form>
</${Pacem.P}-shell-proxy>`
                })
            ], PacemWidgetToolbarElement);
            Cms.PacemWidgetToolbarElement = PacemWidgetToolbarElement;
            class PacemWidgetElement extends Components.PacemElement {
                constructor(metadata, role = 'widget') {
                    super(role);
                    this.permissionMetadata = DEFAULT_PERMISSION_METADATA;
                    this.metadata = metadata;
                }
                connectedCallback() {
                    super.connectedCallback();
                    // ensure an explicit id for each widget
                    if (Pacem.Utils.isNullOrEmpty(this.id)) {
                        this.id = 'wdg' + Pacem.Utils.uniqueCode();
                    }
                    Pacem.Utils.addClass(this, WIDGET_CSS_CLASS);
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'editable':
                            if (!val) {
                                this._disposeBalloon();
                            }
                            else if (this.isReady) {
                                this._ensureBalloon();
                            }
                            break;
                        case 'editing':
                            if (!Pacem.Utils.isNull(this._balloon)) {
                                this._balloon.disabled = !val;
                            }
                            (val ? Pacem.Utils.addClass : Pacem.Utils.removeClass).apply(this, [this, 'widget-' + name]);
                            break;
                        case 'metadata':
                            this._assignIcon(val);
                            break;
                    }
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this._assignIcon();
                    this._ensureBalloon();
                }
                disconnectedCallback() {
                    super.disconnectedCallback();
                }
                _assignIcon(val = this.metadata) {
                    this.dataset['icon'] = (val && val.display && val.display.icon) || 'widgets';
                }
                _ensureBalloon() {
                    if (Pacem.Utils.isNull(this._balloon)) {
                        const balloon = this._balloon = document.createElement(Pacem.P + '-balloon');
                        balloon.target = this;
                        balloon.disabled = !this.editing;
                        balloon.options = {
                            behavior: Components.UI.BalloonBehavior.Menu,
                            trigger: Components.UI.BalloonTrigger.Hover
                        };
                        // innerHTML before appending the balloon to the DOM.
                        balloon.innerHTML = `<${Pacem.P}-widget-toolbar target="{{ #${this.id} }}"><${Pacem.P}-widget-toolbar>`;
                        // append to trigger connected/viewActivated callbacks
                        Pacem.CustomElementUtils.findAncestorShell(this).appendChild(balloon);
                    }
                }
                _disposeBalloon() {
                    if (!Pacem.Utils.isNull(this._balloon)) {
                        this._balloon.remove();
                        this._balloon = null;
                    }
                }
            }
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Boolean })
            ], PacemWidgetElement.prototype, "editing", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Boolean })
            ], PacemWidgetElement.prototype, "editable", void 0);
            __decorate([
                Pacem.Watch({ emit: true, reflectBack: true, converter: Pacem.PropertyConverters.String })
            ], PacemWidgetElement.prototype, "tag", void 0);
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.Json })
            ], PacemWidgetElement.prototype, "permissions", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Json })
            ], PacemWidgetElement.prototype, "metadata", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Json })
            ], PacemWidgetElement.prototype, "permissionMetadata", void 0);
            Cms.PacemWidgetElement = PacemWidgetElement;
        })(Cms = Components.Cms || (Components.Cms = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Cms;
        (function (Cms) {
            Cms.FETCH_CREDENTIALS_METADATA = {
                prop: 'fetchCredentials', type: 'string', dataType: 'enumeration', display: { name: 'Fetch Credentials' }, extra: {
                    enum: ['same-origin', 'omit', 'include']
                }
            };
            Cms.ACCESS_TOKEN_METADATA = {
                prop: 'accessToken', type: 'string', display: { name: 'Access Token', ui: 'expression' }
            };
            class PacemBearerWidgetElement extends Cms.PacemWidgetElement {
                constructor() {
                    super(...arguments);
                    this.fetchCredentials = 'same-origin';
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'accessToken') {
                        if (!Pacem.Utils.isNullOrEmpty(val)) {
                            this.fetchHeaders = { 'Authorization': 'Bearer ' + val };
                        }
                        else {
                            this.fetchHeaders = {};
                        }
                    }
                }
            }
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.String })
            ], PacemBearerWidgetElement.prototype, "fetchCredentials", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Json })
            ], PacemBearerWidgetElement.prototype, "fetchHeaders", void 0);
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.String })
            ], PacemBearerWidgetElement.prototype, "accessToken", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemBearerWidgetElement.prototype, "fetching", void 0);
            Cms.PacemBearerWidgetElement = PacemBearerWidgetElement;
        })(Cms = Components.Cms || (Components.Cms = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Cms;
        (function (Cms) {
            const APIMANIFEST_METADATA = {
                display: { icon: 'cloud_circle', name: 'Api Manifest', description: 'OpenApi parser for WebApi scaffolding.' },
                props: [
                    {
                        prop: 'url', type: 'text', display: {
                            name: 'Url', description: 'Insert the url of the OpenApi json configuration.', cssClass: ['cols-lg-8'],
                            watermark: 'https://domain.com/swagger/v1/swagger.json'
                        },
                        extra: { tooltip: true },
                        validators: [{
                                type: 'required', errorMessage: 'Url field is required.'
                            }]
                    },
                    {
                        prop: 'usecache', type: 'boolean', display: {
                            name: 'Cache results', description: 'Whether to cache the manifest per-url.', cssClass: ['cols-lg-4'],
                            ui: 'switcher'
                        },
                        extra: { tooltip: true }
                    },
                    Cms.ACCESS_TOKEN_METADATA
                ]
            };
            let PacemWidgetApiManifestElement = class PacemWidgetApiManifestElement extends Cms.PacemBearerWidgetElement {
                constructor(_openapi = new Pacem.Cms.OpenApi.SwaggerCmsParser(), _cache = new Pacem.Storage()) {
                    super(Cms.buildWidgetMetadata(APIMANIFEST_METADATA));
                    this._openapi = _openapi;
                    this._cache = _cache;
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'url':
                        case 'editing':
                        case 'editable':
                            this._scaffold();
                            break;
                        case 'usecache':
                            this._openapi.cache = val ? this._cache : null;
                            break;
                    }
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    if (this.usecache) {
                        this._openapi.cache = this._cache;
                    }
                    this._scaffold();
                }
                _scaffold() {
                    if (this.editing && this.editable && !Pacem.Utils.isNullOrEmpty(this.url)) {
                        this.fetching = true;
                        this._openapi.load(this.url).then(s => {
                            this.manifest = s;
                            this.fetching = false;
                        }, _ => {
                            this.fetching = false;
                        });
                    }
                }
            };
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.String })
            ], PacemWidgetApiManifestElement.prototype, "url", void 0);
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.Boolean })
            ], PacemWidgetApiManifestElement.prototype, "usecache", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Json })
            ], PacemWidgetApiManifestElement.prototype, "manifest", void 0);
            PacemWidgetApiManifestElement = __decorate([
                Pacem.CustomElement({ tagName: Pacem.P + '-widget-apimanifest' })
            ], PacemWidgetApiManifestElement);
            Cms.PacemWidgetApiManifestElement = PacemWidgetApiManifestElement;
        })(Cms = Components.Cms || (Components.Cms = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Cms;
        (function (Cms) {
            const DATA_METADATA = {
                display: { icon: 'timer', name: 'Clock', description: 'Timer widget.' },
                props: [
                    {
                        prop: 'interval', type: 'number', display: {
                            name: 'Interval (msec)'
                        }, extra: {
                            selector: '.' + Pacem.PCSS + '-widget', step: 1000
                        },
                        validators: [{
                                type: 'range', errorMessage: 'Negative numbers not allowed', params: { min: 0 }
                            }]
                    }
                ]
            };
            let PacemWidgetClockElement = class PacemWidgetClockElement extends Cms.PacemWidgetElement {
                constructor() {
                    super(Cms.buildWidgetMetadata(DATA_METADATA));
                    this.interval = 0;
                }
            };
            __decorate([
                Pacem.Watch({ reflectBack: true, converter: Pacem.PropertyConverters.Number })
            ], PacemWidgetClockElement.prototype, "interval", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
            ], PacemWidgetClockElement.prototype, "time", void 0);
            PacemWidgetClockElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-widget-clock', template: `<${Pacem.P}-timer interval="{{ :host.interval }}" on-tick="{{ :host.time = Date.now() }}"></${Pacem.P}-timer>`
                })
            ], PacemWidgetClockElement);
            Cms.PacemWidgetClockElement = PacemWidgetClockElement;
        })(Cms = Components.Cms || (Components.Cms = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../scaffolding/types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Cms;
        (function (Cms) {
            const DATA_METADATA = {
                display: { icon: 'storage', name: 'Data', description: 'Data object widget.' },
                props: [
                    {
                        prop: 'model', type: Cms.EXPRESSION_METADATA_TYPE, display: {
                            name: 'Model'
                        }, extra: {
                            selector: '.' + Pacem.PCSS + '-widget'
                        }
                    }
                ]
            };
            let PacemWidgetDataElement = class PacemWidgetDataElement extends Cms.PacemWidgetElement {
                constructor() {
                    super(Cms.buildWidgetMetadata(DATA_METADATA));
                }
            };
            __decorate([
                Pacem.Watch({ reflectBack: true, converter: Pacem.PropertyConverters.Json })
            ], PacemWidgetDataElement.prototype, "model", void 0);
            PacemWidgetDataElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-widget-data'
                })
            ], PacemWidgetDataElement);
            Cms.PacemWidgetDataElement = PacemWidgetDataElement;
        })(Cms = Components.Cms || (Components.Cms = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../scaffolding/types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Cms;
        (function (Cms) {
            const FETCH_PARAMETER_METADATA = {
                props: [
                    { prop: 'name', type: 'string', isReadOnly: true, display: { name: 'Name', cssClass: ['cols-md-4', 'cols-lg-3', 'cols-hd-2'] } },
                    { prop: 'value', type: Cms.EXPRESSION_METADATA_TYPE, display: { name: 'Value', cssClass: ['cols-md-8', 'cols-lg-9', 'cols-hd-10'] } }
                ]
            };
            const FETCH_METADATA = {
                display: {
                    icon: 'wifi', name: 'Api Fetcher', description: 'Fetching widget that retrieves data from a REST endpoint.'
                }, props: [
                    {
                        prop: 'manifest', type: Cms.EXPRESSION_METADATA_TYPE, isComplexType: true, display: {
                            name: 'Api Manifest'
                        }, extra: {
                            selector: Pacem.P + '-widget-apimanifest'
                        }, validators: [{ type: 'required', errorMessage: 'Api Manifest is a required field.' }]
                    },
                    {
                        prop: 'endpoint', type: 'object', isComplexType: true, display: {
                            name: 'Endpoint', ui: 'oneToMany'
                        }, validators: [{ type: 'required', errorMessage: 'Api Manifest is a required field.' }],
                        extra: {
                            source: (manifest) => manifest.endpoints.map(e => Pacem.Utils.extend(e, { 'fullPath': `[${e.method.toUpperCase()}] ${e.path}` })).sort(),
                            textProperty: 'fullPath', valueProperty: 'fullPath',
                            dependsOn: [{ prop: 'manifest', hide: true }]
                        }
                    },
                    {
                        prop: 'parameters', type: 'array', display: {
                            name: 'Parameters'
                        },
                        props: Cms.gridifyMetadata(FETCH_PARAMETER_METADATA),
                        extra: {
                            lockItems: true,
                            dependsOn: [{ prop: 'endpoint', hide: true }]
                        }
                    },
                    Cms.ACCESS_TOKEN_METADATA
                ]
            };
            const PARAMETER_TAGNAME = Pacem.P + '-widget-fetch-parameter';
            let PacemWidgetFetchParameterElement = class PacemWidgetFetchParameterElement extends Components.PacemEventTarget {
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val.first);
                    if (name === 'value' && !Pacem.Utils.isNull(this._fetcher)) {
                        this._fetcher.fetch();
                    }
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    const fetcher = this._fetcher = Pacem.CustomElementUtils.findAncestorOfType(this, PacemWidgetFetchElement);
                    if (!Pacem.Utils.isNull(this._fetcher) && !Pacem.Utils.isNull(this.value)) {
                        this._fetcher.fetch();
                    }
                }
            };
            __decorate([
                Pacem.Watch({ reflectBack: true, converter: Pacem.PropertyConverters.Boolean })
            ], PacemWidgetFetchParameterElement.prototype, "required", void 0);
            __decorate([
                Pacem.Watch({ reflectBack: true, converter: Pacem.PropertyConverters.String })
            ], PacemWidgetFetchParameterElement.prototype, "name", void 0);
            __decorate([
                Pacem.Watch({ reflectBack: true, converter: Pacem.PropertyConverters.String })
            ], PacemWidgetFetchParameterElement.prototype, "value", void 0);
            PacemWidgetFetchParameterElement = __decorate([
                Pacem.CustomElement({ tagName: PARAMETER_TAGNAME })
            ], PacemWidgetFetchParameterElement);
            Cms.PacemWidgetFetchParameterElement = PacemWidgetFetchParameterElement;
            let PacemWidgetFetchElement = class PacemWidgetFetchElement extends Cms.PacemBearerWidgetElement {
                constructor() {
                    super(Cms.buildWidgetMetadata(FETCH_METADATA));
                    this._onerror = (e) => {
                        this.failure = !(this.success = false);
                    };
                    this._onsuccess = (e) => {
                        this.failure = !(this.success = true);
                    };
                    this._onresult = (e) => {
                        this.result = e.detail;
                    };
                }
                get _parameters() {
                    return Array.from(this._itemsElement.children).filter(e => e.localName === PARAMETER_TAGNAME);
                }
                fetch() {
                    const fetcher = this._fetcher, parameters = this._parameters || [], endpoint = this.endpoint;
                    if (!Pacem.Utils.isNull(endpoint)) {
                        for (let param of endpoint.parameters) {
                            if (param.required && Pacem.Utils.isNull(parameters.find(p => p.name === param.name))) {
                                // parameters not yet aligned with the ref endpoint:
                                // not all the required parameters are attached => exit
                                return;
                            }
                        }
                    }
                    // build-up fetch params
                    const params = {};
                    for (let parameter of parameters) {
                        if (!Pacem.Utils.isNullOrEmpty(parameter.value)) {
                            params[parameter.name] = parameter.value;
                        }
                        else if (parameter.required) {
                            // found an empty (required) parameter => exit
                            return;
                        }
                    }
                    fetcher.url = this.url;
                    fetcher.method = this.method;
                    fetcher.credentials = this.fetchCredentials;
                    fetcher.headers = this.fetchHeaders;
                    fetcher.parameters = params;
                    return fetcher.fetch();
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this.fetch();
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'endpoint' && !Pacem.Utils.isNullOrEmpty(val)) {
                        this._mergeEndpoint(val);
                    }
                    else
                        switch (name) {
                            case 'parameters':
                            case 'fetchHeaders':
                            case 'fetchCredentials':
                            case 'url':
                            case 'method':
                                this.fetch();
                                break;
                        }
                }
                _mergeEndpoint(endpoint = this.endpoint) {
                    this.url = this.manifest.baseUrl + endpoint.path;
                    this.method = endpoint.method;
                    this.fields = endpoint.response.fields;
                    const itemsElement = this._itemsElement, parameters = this._parameters;
                    // remove exceeding
                    for (let j = parameters.length - 1; j >= 0; j--) {
                        let item = parameters[j];
                        let matching = endpoint.parameters.find(p => p.name === item.name);
                        if (Pacem.Utils.isNull(matching)) {
                            item.remove();
                        }
                    }
                    // add missing
                    for (let param of endpoint.parameters) {
                        let existing = parameters.find(p => p.name === param.name);
                        if (Pacem.Utils.isNull(existing)) {
                            let item = existing = document.createElement(PARAMETER_TAGNAME);
                            item.name = param.name;
                            itemsElement.appendChild(item);
                        }
                        existing.required = param.required;
                    }
                    // for editing sake
                    this.parameters = parameters;
                }
            };
            __decorate([
                Pacem.Watch({ reflectBack: true, emit: true /* < due to metadata 'dependsOn' */, converter: Pacem.PropertyConverters.Json })
            ], PacemWidgetFetchElement.prototype, "manifest", void 0);
            __decorate([
                Pacem.Watch({ reflectBack: true, emit: true /* < due to metadata 'dependsOn' */, converter: Pacem.PropertyConverters.Json })
            ], PacemWidgetFetchElement.prototype, "endpoint", void 0);
            __decorate([
                Pacem.Watch({ reflectBack: true, emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemWidgetFetchElement.prototype, "url", void 0);
            __decorate([
                Pacem.Watch({ reflectBack: true, emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemWidgetFetchElement.prototype, "method", void 0);
            __decorate([
                Pacem.Watch({ reflectBack: true, emit: false, converter: Pacem.PropertyConverters.Json })
            ], PacemWidgetFetchElement.prototype, "fields", void 0);
            __decorate([
                Pacem.Watch( /* just for editing sake */)
            ], PacemWidgetFetchElement.prototype, "parameters", void 0);
            __decorate([
                Pacem.Watch( /* can only be databound or assigned at runtime */)
            ], PacemWidgetFetchElement.prototype, "result", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemWidgetFetchElement.prototype, "fetching", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemWidgetFetchElement.prototype, "success", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemWidgetFetchElement.prototype, "failure", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-fetch')
            ], PacemWidgetFetchElement.prototype, "_fetcher", void 0);
            __decorate([
                Pacem.ViewChild('div[hidden]')
            ], PacemWidgetFetchElement.prototype, "_itemsElement", void 0);
            PacemWidgetFetchElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-widget-fetch', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-fetch autofetch="false" fetching="{{ :host.fetching, twoway }}" debounce="100"
on-${Pacem.Net.FetchResultEventName}=":host._onresult($event)" on-${Pacem.Net.FetchErrorEventName}=":host._onerror($event)" on-${Pacem.Net.FetchSuccessEventName}=":host._onsuccess($event)"></${Pacem.P}-fetch><div hidden><${Pacem.P}-content></${Pacem.P}-content></div>`
                })
            ], PacemWidgetFetchElement);
            Cms.PacemWidgetFetchElement = PacemWidgetFetchElement;
        })(Cms = Components.Cms || (Components.Cms = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Cms;
        (function (Cms) {
            let PacemWidgetTranslatorElement = class PacemWidgetTranslatorElement extends Cms.PacemWidgetElement {
            };
            PacemWidgetTranslatorElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-widget-translator'
                })
            ], PacemWidgetTranslatorElement);
            Cms.PacemWidgetTranslatorElement = PacemWidgetTranslatorElement;
        })(Cms = Components.Cms || (Components.Cms = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Cms;
        (function (Cms) {
            class PacemUiWidgetElement extends Cms.PacemWidgetElement {
                constructor(metadata, colspan = 1, role) {
                    super(metadata, role);
                    this.colspan = colspan;
                    this.rowspan = 1;
                }
                // just a flag class
                connectedCallback() {
                    super.connectedCallback();
                    Pacem.Utils.addClass(this, 'ui-widget ' + Pacem.PCSS + '-cell cols-xs-start-1 cols-xs-12 rows-xs-start-auto');
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'row':
                            Pacem.Utils.removeClass(this, `rows-start-${old + 1}`);
                            Pacem.Utils.addClass(this, `rows-start-${val + 1}`);
                            break;
                        case 'rowspan':
                            Pacem.Utils.removeClass(this, `rows-${old}`);
                            Pacem.Utils.addClass(this, `rows-${val}`);
                            break;
                        case 'column':
                            Pacem.Utils.removeClass(this, `cols-start-${old + 1}`);
                            Pacem.Utils.addClass(this, `cols-start-${val + 1}`);
                            break;
                        case 'colspan':
                            Pacem.Utils.removeClass(this, `cols-${old}`);
                            Pacem.Utils.addClass(this, `cols-${val}`);
                            break;
                        case 'borders':
                            (this.borders ? Pacem.Utils.addClass : Pacem.Utils.removeClass).apply(this, [this, Pacem.PCSS + '-border']);
                            break;
                        case 'corners':
                            (this.borders ? Pacem.Utils.addClass : Pacem.Utils.removeClass).apply(this, [this, Pacem.PCSS + '-corners']);
                            break;
                    }
                }
                get container() {
                    return this._container;
                }
                /** @overridable */
                findContainer() {
                    return Pacem.CustomElementUtils.findAncestor(this, n => n instanceof PacemCompositeWidgetElement);
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    let iter = this._container = this.findContainer();
                    if (!Pacem.Utils.isNull(iter)) {
                        iter.register(this);
                    }
                }
                disconnectedCallback() {
                    if (!Pacem.Utils.isNull(this._container)) {
                        this._container.unregister(this);
                    }
                    super.disconnectedCallback();
                }
            }
            __decorate([
                Pacem.Watch({ emit: true, reflectBack: true, converter: Pacem.PropertyConverters.Number })
            ], PacemUiWidgetElement.prototype, "column", void 0);
            __decorate([
                Pacem.Watch({ emit: true, reflectBack: true, converter: Pacem.PropertyConverters.Number })
            ], PacemUiWidgetElement.prototype, "row", void 0);
            __decorate([
                Pacem.Watch({ emit: true, reflectBack: true, converter: Pacem.PropertyConverters.Number })
            ], PacemUiWidgetElement.prototype, "colspan", void 0);
            __decorate([
                Pacem.Watch({ emit: true, reflectBack: true, converter: Pacem.PropertyConverters.Number })
            ], PacemUiWidgetElement.prototype, "rowspan", void 0);
            __decorate([
                Pacem.Watch({ emit: true, reflectBack: true, converter: Pacem.PropertyConverters.Boolean })
            ], PacemUiWidgetElement.prototype, "borders", void 0);
            __decorate([
                Pacem.Watch({ emit: true, reflectBack: true, converter: Pacem.PropertyConverters.Boolean })
            ], PacemUiWidgetElement.prototype, "corners", void 0);
            Cms.PacemUiWidgetElement = PacemUiWidgetElement;
            Cms.WidgetRegisterEventName = "widgetregister";
            Cms.WidgetUnregisterEventName = "widgetunregister";
            Cms.LayoutChangeEventName = "layoutchange";
            class WidgetRegisterEvent extends CustomEvent {
                constructor(item, eventInit) {
                    super(Cms.WidgetRegisterEventName, Pacem.Utils.extend(eventInit || {}, { detail: item }));
                }
            }
            Cms.WidgetRegisterEvent = WidgetRegisterEvent;
            class WidgetUnregisterEvent extends CustomEvent {
                constructor(item, eventInit) {
                    super(Cms.WidgetUnregisterEventName, Pacem.Utils.extend(eventInit || {}, { detail: item }));
                }
            }
            Cms.WidgetUnregisterEvent = WidgetUnregisterEvent;
            class PacemCompositeWidgetElement extends PacemUiWidgetElement {
                get itemsElement() {
                    return this;
                }
                validate(item) {
                    return item instanceof PacemUiWidgetElement;
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    Pacem.Utils.addClass(this.itemsElement, Pacem.PCSS + '-items-element');
                }
                /**
                 * Appends a child Element to this CompositeWidget's itemsElement.
                 * @param item New child element
                 */
                appendItem(item) {
                    this.itemsElement.appendChild(item);
                }
                /**
                 * Registers a new item among the items.
                 * @param item {PacemUiWidgetElement} Item to be enrolled
                 */
                register(item) {
                    if (!this.validate(item)) {
                        this.log(Pacem.Logging.LogLevel.Debug, `${(item && item.localName)} element couldn't be registered in a ${this.localName} element.`);
                        return false;
                    }
                    let retval = false;
                    const items = this.items = this.items || [];
                    if (Pacem.Utils.isNullOrEmpty(items)) {
                        this.items = [item];
                        retval = true;
                    }
                    else if (items.indexOf(item) === -1) {
                        items.push(item);
                        retval = true;
                    }
                    //
                    if (retval) {
                        this.dispatchEvent(new WidgetRegisterEvent(item));
                    }
                    return retval;
                }
                /**
                 * Removes an existing element from the items.
                 * @param item {PacemUiWidgetElement} Item to be removed
                 */
                unregister(item) {
                    const items = this.items, ndx = !Pacem.Utils.isNullOrEmpty(items) && items.indexOf(item);
                    if (ndx >= 0) {
                        let item = items.splice(ndx, 1);
                        this.dispatchEvent(new WidgetUnregisterEvent(item[0]));
                        return true;
                    }
                    return false;
                }
            }
            __decorate([
                Pacem.Watch( /* can only be databound or assigned at runtime */)
            ], PacemCompositeWidgetElement.prototype, "items", void 0);
            Cms.PacemCompositeWidgetElement = PacemCompositeWidgetElement;
            //  #endregion COMPOSITE
        })(Cms = Components.Cms || (Components.Cms = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="types.ts" />
/// <reference path="../../scaffolding/types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Cms;
        (function (Cms) {
            const TEXT_METADATA = Cms.buildWidgetMetadata({
                display: { icon: 'font_download', name: 'Text', description: 'Plain text widget.' },
                props: [{
                        prop: 'text', type: Cms.EXPRESSION_METADATA_TYPE, display: { name: 'Text' }, extra: Cms.EXPRESSION_WIDGET_METADATA_EXTRA
                    }]
            });
            let PacemWidgetTextElement = class PacemWidgetTextElement extends Cms.PacemUiWidgetElement {
                constructor() {
                    super(TEXT_METADATA);
                }
            };
            __decorate([
                Pacem.Watch({ reflectBack: true, converter: Pacem.PropertyConverters.String })
            ], PacemWidgetTextElement.prototype, "text", void 0);
            PacemWidgetTextElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-widget-text', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-text text="{{ :host.text }}"></${Pacem.P}-text>`
                })
            ], PacemWidgetTextElement);
            Cms.PacemWidgetTextElement = PacemWidgetTextElement;
        })(Cms = Components.Cms || (Components.Cms = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Cms;
        (function (Cms) {
            function createSvgGridBox() {
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.style.pointerEvents = 'none';
                svg.style.zIndex = '1000';
                svg.setAttribute('height', '100%');
                svg.setAttribute('width', '100%');
                svg.setAttribute('preserveAspectRatio', 'none');
                svg.innerHTML = `<rect class="grid-cell" height="100%" width="100%"></rect>`;
                return svg;
            }
            Cms.GRID_COLUMNS = 12;
            const FALLBACK_COLUMNS = Cms.GRID_COLUMNS;
            const FALLBACK_ROWS = 1;
            const GRID_METADATA = {
                display: {
                    icon: 'grid_on',
                    name: 'Grid',
                    description: 'Composition Widget that lays out child-widgets in a grid container.'
                },
                props: [
                    {
                        prop: 'rows', type: 'int', display: {
                            name: 'Rows', cssClass: ['cols-lg-4']
                        }, validators: [
                            { type: 'required', errorMessage: '' },
                            {
                                type: 'range', errorMessage: '', params: {
                                    min: 1, max: 24
                                }
                            }
                        ]
                    }, {
                        prop: 'rowGap', type: 'int', display: {
                            //ui: 'slider',
                            name: 'Row gap', cssClass: ['cols-lg-4']
                        }, validators: [
                            // { type: 'required', errorMessage: '' },
                            {
                                type: 'range', errorMessage: '', params: {
                                    min: 0, max: 3, step: .25
                                }
                            }
                        ]
                    }, {
                        prop: 'columnGap', type: 'int', display: {
                            //ui: 'slider',
                            name: 'Column gap', cssClass: ['cols-lg-4']
                        }, validators: [
                            // { type: 'required', errorMessage: '' },
                            {
                                type: 'range', errorMessage: '', params: {
                                    min: 0, max: 3, step: .25
                                }
                            }
                        ]
                    }
                ]
            };
            let PacemGridWidgetElement = class PacemGridWidgetElement extends Cms.PacemCompositeWidgetElement {
                constructor() {
                    super(Cms.buildWidgetMetadata(GRID_METADATA), FALLBACK_COLUMNS, "grid");
                    this._widgetPropertyChange = (evt) => {
                        if (evt.detail.propertyName === 'row' || evt.detail.propertyName === 'rowspan') {
                            const widget = evt.target;
                            this.rows = Math.max(this.rows, widget.row + widget.rowspan);
                        }
                    };
                    this._dragDropHandler = (evt) => {
                        const args = evt.detail, el = args.element;
                        switch (evt.type) {
                            case Pacem.UI.DragDropEventType.Start:
                                this._gridBoxes.forEach(svg => { svg.style.pointerEvents = 'auto'; });
                                this._initState = {
                                    colspan: el.colspan,
                                    rowspan: el.rowspan,
                                    col: el.column,
                                    row: el.row
                                };
                                break;
                            case Pacem.UI.DragDropEventType.End:
                                this._gridBoxes.forEach(svg => { svg.style.pointerEvents = 'none'; });
                                break;
                            case Pacem.UI.DragDropEventType.Over:
                                var dropTarget = args.target;
                                var col = +dropTarget.style.gridColumnStart - 1;
                                var row = +dropTarget.style.gridRowStart - 1;
                                const farRight = col + this._initState.colspan, farBottom = row + this._initState.rowspan;
                                // check overlap
                                if (!this._intersects(el, col, row, el.colspan, el.rowspan)) {
                                    let fireLayoutChange = false;
                                    //
                                    if (farRight <= (this.columns || FALLBACK_COLUMNS)) {
                                        fireLayoutChange = el.column !== col;
                                        el.column = col; // + '/' + (col + this._initState.colspan);
                                    }
                                    if (farBottom <= (this.rows || FALLBACK_ROWS)) {
                                        fireLayoutChange = fireLayoutChange || (el.row !== row);
                                        el.row = row; // + '/' + (row + this._initState.rowspan);
                                    }
                                    if (fireLayoutChange) {
                                        // attributechange should suffice
                                        // this.dispatchLayoutChangeEvent();
                                    }
                                }
                                break;
                        }
                        ;
                    };
                    this._resizeHandler = (evt) => {
                        switch (evt.type) {
                            case Pacem.UI.RescaleEventType.Start:
                                Pacem.Utils.addClass(evt.detail.element, Pacem.PCSS + '-rescaling');
                                this._gridBoxes.forEach(svg => { svg.style.pointerEvents = 'auto'; });
                                break;
                            case Pacem.UI.RescaleEventType.End:
                                this._gridBoxes.forEach(svg => { svg.style.pointerEvents = 'none'; });
                                Pacem.Utils.removeClass(evt.detail.element, Pacem.PCSS + '-rescaling');
                                break;
                            case Pacem.UI.RescaleEventType.Rescale:
                                evt.preventDefault();
                                // check pos
                                const pos = evt.detail.currentPosition, handle = evt.detail.handle;
                                const dropTarget = document.elementsFromPoint(pos.x, pos.y).find(e => this._dragDrop.dropTargets.indexOf(e) >= 0);
                                if (dropTarget) {
                                    var col = +dropTarget.style.gridColumnStart;
                                    var row = +dropTarget.style.gridRowStart;
                                    const widget = evt.detail.element, startcol = widget.column + 1, startrow = widget.row + 1;
                                    const colspan = 1 + col - startcol, rowspan = 1 + row - startrow;
                                    if (!this._intersects(widget, widget.column, widget.row, colspan, rowspan)) {
                                        let fireLayoutChange = false;
                                        //
                                        if (col >= startcol && handle.endsWith('right')) {
                                            fireLayoutChange = widget.colspan !== colspan;
                                            widget.colspan = colspan;
                                        }
                                        if (row >= startrow && handle.startsWith('bottom')) {
                                            fireLayoutChange = fireLayoutChange || widget.rowspan !== rowspan;
                                            widget.rowspan = rowspan;
                                        }
                                        if (fireLayoutChange) {
                                            // attributechange should suffice
                                            // this.dispatchLayoutChangeEvent();
                                        }
                                    }
                                }
                                break;
                        }
                    };
                    this._gridBoxes = [];
                }
                register(item) {
                    let retval = super.register(item);
                    if (retval) {
                        const row = item.row || 0, column = item.column || 0, colspan = item.colspan || 2, rowspan = item.rowspan || 1;
                        let foundspot = !this._intersects(item, column, row, colspan, rowspan);
                        if (foundspot) {
                            item.row = row;
                            item.column = column;
                            item.colspan = colspan;
                            item.rowspan = rowspan;
                        }
                        else {
                            if (!foundspot) {
                                // select a spot or create a new row
                                let check = (elasticOnColspan = false) => {
                                    let maxColIndex = this.columns - 1;
                                    if (!elasticOnColspan) {
                                        maxColIndex = maxColIndex - colspan + 1;
                                    }
                                    for (let j = 0; j < this.rows; j++) {
                                        for (let i = 0; i <= maxColIndex; i++) {
                                            if (!this._intersects(item, i, j, colspan, rowspan)) {
                                                item.column = i;
                                                item.row = j;
                                                item.colspan = Math.min(maxColIndex + 1 - i, colspan);
                                                item.rowspan = rowspan;
                                                foundspot = true;
                                                break;
                                            }
                                        }
                                        if (foundspot)
                                            break;
                                    }
                                };
                                check();
                                if (!foundspot && colspan > 1) {
                                    // find first avail slot conceding less colspan
                                    check(true);
                                }
                            }
                            // okay, surrender and create a new row
                            if (!foundspot) {
                                this.rows++;
                                item.row = this.rows - 1;
                                item.column = 0;
                            }
                        }
                        //
                        // item.behaviors.push(this._dragDrop, this._rescaler);
                        item.behaviors = [this._dragDrop, this._rescaler];
                        item.addEventListener(Pacem.PropertyChangeEventName, this._widgetPropertyChange, false);
                    }
                    //
                    return retval;
                }
                unregister(item) {
                    let retval = super.unregister(item);
                    if (retval) {
                        item.removeEventListener(Pacem.PropertyChangeEventName, this._widgetPropertyChange, false);
                        const ndx = item.behaviors.indexOf(this._dragDrop);
                        if (ndx >= 0)
                            item.behaviors.splice(ndx, 1);
                        const ndx1 = item.behaviors.indexOf(this._rescaler);
                        if (ndx1 >= 0)
                            item.behaviors.splice(ndx1, 1);
                    }
                    return retval;
                }
                _intersects(who, col, row, colspan, rowspan) {
                    for (let item of this.items) {
                        let widget = item;
                        if (widget === who) {
                            continue;
                        }
                        if ((widget.column < (col + colspan) && (widget.column + widget.colspan) > col)
                            && (widget.row < (row + rowspan) && (widget.row + widget.rowspan) > row)) {
                            return true;
                        }
                    }
                    return false;
                }
                connectedCallback() {
                    super.connectedCallback();
                    Pacem.Utils.addClass(this, Pacem.PCSS + '-grid');
                    // drag-drop
                    let dragDrop = this._dragDrop = document.createElement(Pacem.P + '-drag-drop');
                    let floater = document.createElement('div');
                    document.body.appendChild(floater);
                    dragDrop.floater = floater;
                    dragDrop.mode = Pacem.UI.DragDataMode.Alias;
                    dragDrop.dropBehavior = Pacem.UI.DropBehavior.None;
                    dragDrop.addEventListener(Pacem.UI.DragDropEventType.Start, this._dragDropHandler, false);
                    dragDrop.addEventListener(Pacem.UI.DragDropEventType.Over, this._dragDropHandler, false);
                    dragDrop.addEventListener(Pacem.UI.DragDropEventType.End, this._dragDropHandler, false);
                    document.body.appendChild(dragDrop);
                    // rescale
                    let rescale = this._rescaler = document.createElement(Pacem.P + '-rescale');
                    rescale.handles = [Pacem.UI.RescaleHandle.Right, Pacem.UI.RescaleHandle.Bottom];
                    rescale.addEventListener(Pacem.UI.RescaleEventType.Start, this._resizeHandler, false);
                    rescale.addEventListener(Pacem.UI.RescaleEventType.Rescale, this._resizeHandler, false);
                    rescale.addEventListener(Pacem.UI.RescaleEventType.End, this._resizeHandler, false);
                    document.body.appendChild(rescale);
                    // editor
                    // default configuration
                    if (Pacem.Utils.isNullOrEmpty(this.columns)) {
                        this.columns = Cms.GRID_COLUMNS;
                    }
                    if (Pacem.Utils.isNullOrEmpty(this.rows)) {
                        this.rows = 1;
                    }
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this.adapt();
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    this.adapt();
                }
                disconnectedCallback() {
                    var dragDrop = this._dragDrop, rescale = this._rescaler;
                    if (!Pacem.Utils.isNull(dragDrop)) {
                        dragDrop.floater.remove();
                        dragDrop.removeEventListener(Pacem.UI.DragDropEventType.Start, this._dragDropHandler, false);
                        dragDrop.removeEventListener(Pacem.UI.DragDropEventType.Over, this._dragDropHandler, false);
                        dragDrop.removeEventListener(Pacem.UI.DragDropEventType.End, this._dragDropHandler, false);
                        dragDrop.remove();
                        this._dragDrop = null;
                    }
                    if (!Pacem.Utils.isNull(rescale)) {
                        rescale.removeEventListener(Pacem.UI.RescaleEventType.Start, this._resizeHandler, false);
                        rescale.removeEventListener(Pacem.UI.RescaleEventType.Rescale, this._resizeHandler, false);
                        rescale.removeEventListener(Pacem.UI.RescaleEventType.End, this._resizeHandler, false);
                        rescale.remove();
                        this._rescaler = null;
                    }
                    super.disconnectedCallback();
                }
                _normalize(measure, defaultValue = 1) {
                    if (typeof measure === 'string') {
                        return measure;
                    }
                    else if (measure == null) {
                        measure = defaultValue;
                    }
                    return this.unitPixels(measure) + 'px';
                }
                unitPixels(qty) {
                    return qty * (this.unit || 8);
                }
                adapt() {
                    this.style.marginTop = this.unitPixels(this.marginTop || 0) + 'px';
                    this.style.marginBottom = this.unitPixels(this.marginBottom || 0) + 'px';
                    //
                    this.style.gridTemplateColumns = `repeat(${(this.columns || FALLBACK_COLUMNS)}, 1fr)`;
                    //this.style.gridAutoRows = `minmax(${(this.minRowheight || 24)}, ${(this.rowheight || 'auto')})`;
                    let minrowheight = this._normalize(this.minRowheight, 3), rowheight = this._normalize(this.rowheight || 'auto');
                    this.style.gridTemplateRows = `repeat(${(this.rows || FALLBACK_ROWS)}, minmax(${minrowheight}, ${rowheight}))`;
                    this.style.gridRowGap = this._normalize(this.rowGap, 1);
                    this.style.gridColumnGap = this._normalize(this.columnGap, 1);
                    //
                    this._setGridLines();
                }
                _setGridLines() {
                    var splice = 0;
                    const editing = this.editing;
                    if (editing) {
                        const cols = this.columns || FALLBACK_COLUMNS, rows = this.rows || FALLBACK_ROWS, total = cols * rows;
                        splice = total;
                        for (let k = 0; k < total; k++) {
                            while (this._gridBoxes.length <= k) {
                                let s = createSvgGridBox();
                                this.appendChild(s);
                                this._gridBoxes.push(s);
                            }
                            let svg = this._gridBoxes[k];
                            const i = k % cols, j = Math.floor(k / cols);
                            svg.style.gridColumn = (i + 1).toString();
                            svg.style.gridRow = (j + 1).toString();
                        }
                    }
                    for (let svg of this._gridBoxes.splice(splice)) {
                        svg.remove();
                    }
                    // behaviors to be synchronized
                    if (!Pacem.Utils.isNull(this._dragDrop) && !Pacem.Utils.isNull(this._rescaler)) {
                        this._dragDrop.disabled = this._rescaler.disabled
                            = !editing;
                        this._dragDrop.dropTargets = this._gridBoxes;
                    }
                }
            };
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.Number })
            ], PacemGridWidgetElement.prototype, "unit", void 0);
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.Number })
            ], PacemGridWidgetElement.prototype, "marginTop", void 0);
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.Number })
            ], PacemGridWidgetElement.prototype, "marginBottom", void 0);
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.Number })
            ], PacemGridWidgetElement.prototype, "columns", void 0);
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.Number })
            ], PacemGridWidgetElement.prototype, "rows", void 0);
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.String })
            ], PacemGridWidgetElement.prototype, "minRowheight", void 0);
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.String })
            ], PacemGridWidgetElement.prototype, "rowheight", void 0);
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.Number })
            ], PacemGridWidgetElement.prototype, "rowGap", void 0);
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.Number })
            ], PacemGridWidgetElement.prototype, "columnGap", void 0);
            __decorate([
                Pacem.Debounce(100)
            ], PacemGridWidgetElement.prototype, "adapt", null);
            PacemGridWidgetElement = __decorate([
                Pacem.CustomElement({ tagName: Pacem.P + '-widget-grid' })
            ], PacemGridWidgetElement);
            Cms.PacemGridWidgetElement = PacemGridWidgetElement;
        })(Cms = Components.Cms || (Components.Cms = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Cms;
        (function (Cms) {
            const DATACOLUMN_METADATA = {
                display: { name: 'DataColumn' },
                props: [
                    { prop: "header", type: "string", display: { name: "Header" } },
                    { prop: "content", type: "string", display: { ui: "expression", name: "Content" }, extra: Cms.EXPRESSION_WIDGET_METADATA_EXTRA },
                ]
            };
            const DATAGRID_METADATA = Cms.buildWidgetMetadata({
                display: { icon: 'table_chart', name: 'DataGrid', description: 'DataGrid widget.' },
                props: [{
                        prop: 'datasource', type: 'complex', display: { ui: 'expression', name: 'Datasource' },
                        extra: Pacem.Utils.extend({}, Cms.EXPRESSION_WIDGET_METADATA_EXTRA, { filter: (e) => e instanceof Cms.PacemWidgetDataElement || e instanceof Cms.PacemWidgetFetchElement })
                    },
                    {
                        prop: 'columns', type: 'array', display: { name: 'Columns' },
                        // this will include 'datasource' as argument in the oneToMany source fn
                        extra: { dependsOn: [{ prop: 'datasource', hide: true }] },
                        props: Cms.gridifyMetadata(DATACOLUMN_METADATA)
                    }]
            });
            const DATAGRID_HEADING_SEPARATOR = 'pacem-datagrid-heading';
            let PacemWidgetDataGridElement = class PacemWidgetDataGridElement extends Cms.PacemUiWidgetElement {
                constructor() {
                    super(DATAGRID_METADATA);
                    this.columns = [];
                }
                _gridify(columns = this.columns) {
                    var output = '';
                    for (let column of columns || []) {
                        // if empty then 1fr
                        const col = column.width || 1;
                        if (typeof col === 'number') {
                            output += col + 'fr ';
                        }
                        else {
                            output += 'auto ';
                        }
                    }
                    return output;
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'columns':
                            this._setupHeadcells();
                        case 'datasource':
                            break;
                    }
                }
                _setupHeadcells() {
                }
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Json })
            ], PacemWidgetDataGridElement.prototype, "columns", void 0);
            __decorate([
                Pacem.ViewChild('template')
            ], PacemWidgetDataGridElement.prototype, "_template", void 0);
            PacemWidgetDataGridElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-widget-datagrid', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-repeater datasource="{{ :host.columns }}">
    <${Pacem.P}-panel class="${Pacem.PCSS}-datatable" css="{{ {'grid-template-columns': :host._gridify(:host.columns)} }}">
    <!--${DATAGRID_HEADING_SEPARATOR}-->
    <template>
        <${Pacem.P}-panel class="${Pacem.PCSS}-headcell" content="{{ ^item.header }}"></${Pacem.P}-panel>
    </template>
</${Pacem.P}-panel></${Pacem.P}-repeater>`
                })
            ], PacemWidgetDataGridElement);
            Cms.PacemWidgetDataGridElement = PacemWidgetDataGridElement;
        })(Cms = Components.Cms || (Components.Cms = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
