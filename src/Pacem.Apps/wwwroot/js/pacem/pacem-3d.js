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
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var ThreeD;
        (function (ThreeD) {
            class Pacem3DDetector {
                constructor() {
                    this._detected = {
                        supported: false, info: {}
                    };
                    let cvs = document.createElement('canvas');
                    let contextNames = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'];
                    let ctx;
                    let getParam = function (str) {
                        if (!str)
                            return undefined;
                        return ctx.getParameter(str);
                    };
                    // addLine
                    let addLine = (section, name, value) => {
                        let detected = this._detected;
                        var info = detected.info[section] = detected.info[section] || {};
                        name = name.replace(/[^\w]+/g, '');
                        name = name.substring(0, 1).toLowerCase() + name.substring(1);
                        info[name] = value;
                    };
                    if (navigator.userAgent.indexOf('MSIE') >= 0) {
                        try {
                            ctx = window['WebGLHelper'].CreateGLContext(cvs, 'canvas');
                        }
                        catch (e) { }
                    }
                    else {
                        for (var i = 0; i < contextNames.length; i++) {
                            try {
                                ctx = cvs.getContext(contextNames[i]);
                                if (ctx) {
                                    addLine('main', 'Context Name', contextNames[i]);
                                    break;
                                }
                            }
                            catch (e) { }
                        }
                    }
                    this._detected.supported = !!ctx;
                    addLine('main', 'Platform', navigator.platform);
                    addLine('main', 'Agent', navigator.userAgent);
                    if (ctx) {
                        addLine('main', 'Vendor', getParam(ctx.VENDOR));
                        addLine('main', 'Version', getParam(ctx.VERSION));
                        addLine('main', 'Renderer', getParam(ctx.RENDERER));
                        addLine('main', 'Shading Language Version', getParam(ctx.SHADING_LANGUAGE_VERSION));
                        addLine('bits', 'Rgba Bits', getParam(ctx.RED_BITS) + ', ' + getParam(ctx.GREEN_BITS) + ', ' + getParam(ctx.BLUE_BITS) + ', ' + getParam(ctx.ALPHA_BITS));
                        addLine('bits', 'Depth Bits', getParam(ctx.DEPTH_BITS));
                        addLine('shader', 'Max Vertex Attribs', getParam(ctx.MAX_VERTEX_ATTRIBS));
                        addLine('shader', 'Max Vertex Texture Image Units', getParam(ctx.MAX_VERTEX_TEXTURE_IMAGE_UNITS));
                        addLine('shader', 'Max Varying Vectors', getParam(ctx.MAX_VARYING_VECTORS));
                        addLine('shader', 'Max Uniform Vectors', getParam(ctx.MAX_VERTEX_UNIFORM_VECTORS));
                        addLine('tex', 'Max Combined Texture Image Units', getParam(ctx.MAX_COMBINED_TEXTURE_IMAGE_UNITS));
                        addLine('tex', 'Max Texture Size', getParam(ctx.MAX_TEXTURE_SIZE));
                        addLine('tex', 'Max Cube Map Texture Size', getParam(ctx.MAX_CUBE_MAP_TEXTURE_SIZE));
                        addLine('tex', 'Num. Compressed Texture Formats', getParam(ctx.COMPRESSED_TEXTURE_FORMATS));
                        addLine('misc', 'Max Render Buffer Size', getParam(ctx.MAX_RENDERBUFFER_SIZE));
                        addLine('misc', 'Max Viewport Dimensions', getParam(ctx.MAX_VIEWPORT_DIMS));
                        addLine('misc', 'Aliased Line Width Range', getParam(ctx.ALIASED_LINE_WIDTH_RANGE));
                        addLine('misc', 'Aliased Point Size Range', getParam(ctx.ALIASED_POINT_SIZE_RANGE));
                        addLine('misc', 'Supported Extensions', ctx.getSupportedExtensions() || []);
                    }
                }
                get info() {
                    return this._detected.info;
                }
                get supported() {
                    return this._detected.supported;
                }
            }
            ThreeD.Pacem3DDetector = Pacem3DDetector;
        })(ThreeD = Components.ThreeD || (Components.ThreeD = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var ThreeD;
        (function (ThreeD) {
            const ThreeDConsts = {
                OBJECT_SELECTOR: Pacem.P + '-3d-object',
                LIGHT_SELECTOR: Pacem.P + '-3d-light',
                CAMERA_SELECTOR: Pacem.P + '-3d-camera',
                SCENE_SELECTOR: Pacem.P + '-3d',
                DEFAULT_COORDS: { x: 0, y: 0, z: 0 }
            };
            class ThreeDRelevantElementEvent extends Pacem.CustomTypedEvent {
                constructor(type, args) {
                    super(type, args);
                }
            }
            ThreeD.ThreeDRelevantElementEvent = ThreeDRelevantElementEvent;
            class ThreeDRelevantElement extends Components.PacemEventTarget {
                constructor() {
                    super(...arguments);
                    this.position = ThreeDConsts.DEFAULT_COORDS;
                }
                get scene() {
                    return this['_scene'] = this['_scene'] || Pacem.CustomElementUtils.findAncestorOfType(this, Pacem3DElement);
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this.scene && this.scene.register(this);
                }
                disconnectedCallback() {
                    super.viewActivatedCallback();
                    this.scene && this.scene.unregister(this);
                }
            }
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Json })
            ], ThreeDRelevantElement.prototype, "position", void 0);
            __decorate([
                Pacem.Watch({ emit: false, reflectBack: true, converter: Pacem.PropertyConverters.String })
            ], ThreeDRelevantElement.prototype, "tag", void 0);
            ThreeD.ThreeDRelevantElement = ThreeDRelevantElement;
            let Pacem3DObjectElement = class Pacem3DObjectElement extends ThreeDRelevantElement {
                constructor() {
                    super(...arguments);
                    this.format = 'json';
                }
            };
            __decorate([
                Pacem.Watch()
            ], Pacem3DObjectElement.prototype, "mesh", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], Pacem3DObjectElement.prototype, "url", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], Pacem3DObjectElement.prototype, "format", void 0);
            Pacem3DObjectElement = __decorate([
                Pacem.CustomElement({ tagName: ThreeDConsts.OBJECT_SELECTOR })
            ], Pacem3DObjectElement);
            ThreeD.Pacem3DObjectElement = Pacem3DObjectElement;
            let Pacem3DLightElement = class Pacem3DLightElement extends ThreeDRelevantElement {
                constructor() {
                    super(...arguments);
                    this.intensity = .25;
                    this.target = ThreeDConsts.DEFAULT_COORDS;
                    this.color = '#fff';
                    this.type = 'omni';
                }
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
            ], Pacem3DLightElement.prototype, "intensity", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Json })
            ], Pacem3DLightElement.prototype, "target", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], Pacem3DLightElement.prototype, "color", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], Pacem3DLightElement.prototype, "type", void 0);
            Pacem3DLightElement = __decorate([
                Pacem.CustomElement({ tagName: ThreeDConsts.LIGHT_SELECTOR })
            ], Pacem3DLightElement);
            ThreeD.Pacem3DLightElement = Pacem3DLightElement;
            let Pacem3DCameraElement = class Pacem3DCameraElement extends ThreeDRelevantElement {
                constructor() {
                    super(...arguments);
                    this.fov = 45;
                    this.aspect = 1.78;
                    this.near = 0.1;
                    this.far = 1000.0;
                    this.type = 'perspective';
                    this.lookAt = ThreeDConsts.DEFAULT_COORDS;
                }
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
            ], Pacem3DCameraElement.prototype, "fov", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
            ], Pacem3DCameraElement.prototype, "aspect", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
            ], Pacem3DCameraElement.prototype, "near", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
            ], Pacem3DCameraElement.prototype, "far", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], Pacem3DCameraElement.prototype, "type", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Json })
            ], Pacem3DCameraElement.prototype, "lookAt", void 0);
            Pacem3DCameraElement = __decorate([
                Pacem.CustomElement({ tagName: ThreeDConsts.CAMERA_SELECTOR })
            ], Pacem3DCameraElement);
            ThreeD.Pacem3DCameraElement = Pacem3DCameraElement;
            class Pacem3DAdapterElement extends Components.PacemEventTarget {
            }
            ThreeD.Pacem3DAdapterElement = Pacem3DAdapterElement;
            let Pacem3DElement = class Pacem3DElement extends Components.PacemEventTarget {
                constructor() {
                    super(...arguments);
                    this.interactive = false;
                    this.orbit = false;
                    this._bag = new Set();
                    this._addHandler = (evt) => {
                        this._add(evt.target);
                    };
                    this._clickHandler = (evt) => {
                        let me = this;
                        if (!me.interactive || Pacem.Utils.isNull(me._lastHover))
                            return;
                        me._lastHover.dispatchEvent(new ThreeDRelevantElementEvent('click', { element: me._lastHover }));
                        me.dispatchEvent(new ThreeDRelevantElementEvent('itemclick', { element: me._lastHover }));
                    };
                    this._moveHandler = (evt) => {
                        let me = this;
                        if (!me.adapter || !me.interactive)
                            return;
                        // what's really needed:
                        let obj = me.adapter.raycast({ x: evt.clientX, y: evt.clientY });
                        if (obj != me._lastHover) {
                            if (!Pacem.Utils.isNull(me._lastHover)) {
                                me._lastHover.dispatchEvent(new ThreeDRelevantElementEvent('out', { element: me._lastHover }));
                                me.dispatchEvent(new ThreeDRelevantElementEvent('itemout', { element: me._lastHover }));
                            }
                            if (!Pacem.Utils.isNull(obj)) {
                                obj.dispatchEvent(new ThreeDRelevantElementEvent('over', { element: obj }));
                                me.dispatchEvent(new ThreeDRelevantElementEvent('itemover', { element: obj }));
                            }
                            me._lastHover = obj;
                        }
                    };
                    this._resizeHandler = (e) => {
                        this._onResize(e);
                    };
                    //#endregion
                }
                get stage() {
                    return this._container;
                }
                register(item) {
                    if (!this._bag.has(item)) {
                        this._bag.add(item);
                        this._add(item);
                        item.addEventListener(Pacem.PropertyChangeEventName, this._addHandler, false);
                    }
                }
                unregister(item) {
                    if (this._bag.has(item)) {
                        this._bag.delete(item);
                        item.removeEventListener(Pacem.PropertyChangeEventName, this._addHandler, false);
                        this._erase(item);
                    }
                }
                _add(item) {
                    this.adapter &&
                        this.adapter.addItem(item);
                }
                _erase(item) {
                    this.adapter &&
                        this.adapter.removeItem(item);
                }
                _initializeAdapter(old, val) {
                    if (!Pacem.Utils.isNull(old)) {
                        this._bag.forEach(i => old.removeItem(i));
                    }
                    if (!Pacem.Utils.isNull(this._container) && !Pacem.Utils.isNull(val)) {
                        val.initialize(this);
                        this._bag.forEach(i => this._add(i));
                        this.render();
                    }
                }
                //#region lifecycle
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (Pacem.Utils.isNull(this._container))
                        return;
                    if (name === 'adapter') {
                        this._initializeAdapter(old, val);
                    }
                    else if (name === 'disabled') {
                        this.render();
                    }
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    // stage
                    const container = this._container = document.createElement('div');
                    Pacem.Utils.addClass(container, Pacem.PCSS + '-3d-stage');
                    this.insertAdjacentElement('afterend', container);
                    // resizer
                    const resizer = this._resizer = document.createElement(Pacem.P + '-resize');
                    resizer.addEventListener('resize', this._resizeHandler, false);
                    resizer.target = container;
                    container.insertAdjacentElement('afterend', resizer);
                    // adapter
                    this._initializeAdapter(null, this.adapter);
                    //
                    container.addEventListener('mousemove', this._moveHandler, false);
                    container.addEventListener('click', this._clickHandler, false);
                }
                disconnectedCallback() {
                    const resizer = this._resizer, container = this._container;
                    if (!Pacem.Utils.isNull(container)) {
                        container.removeEventListener('click', this._clickHandler, false);
                        container.removeEventListener('mousemove', this._moveHandler, false);
                    }
                    if (!Pacem.Utils.isNull(resizer)) {
                        resizer.removeEventListener('resize', this._resizeHandler, false);
                        resizer.remove();
                    }
                    super.disconnectedCallback();
                }
                _onResize(e) {
                    this.adapter && this.adapter.invalidateSize();
                }
                render() {
                    if (!this.disabled) {
                        let cancelable = new CustomEvent('prerender', { detail: { scene: this.adapter.scene }, cancelable: true });
                        this.dispatchEvent(cancelable);
                        if (!cancelable.defaultPrevented) {
                            this.adapter.render();
                            this.dispatchEvent(new CustomEvent('render', { detail: { scene: this.adapter.scene } }));
                        }
                    }
                    requestAnimationFrame(() => this.render());
                }
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], Pacem3DElement.prototype, "interactive", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], Pacem3DElement.prototype, "orbit", void 0);
            __decorate([
                Pacem.Watch({ emit: false })
            ], Pacem3DElement.prototype, "adapter", void 0);
            Pacem3DElement = __decorate([
                Pacem.CustomElement({
                    tagName: ThreeDConsts.SCENE_SELECTOR
                })
            ], Pacem3DElement);
            ThreeD.Pacem3DElement = Pacem3DElement;
        })(ThreeD = Components.ThreeD || (Components.ThreeD = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
/// <reference path="types.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var ThreeD;
        (function (ThreeD) {
            let PacemThreeAdapterElement = class PacemThreeAdapterElement extends ThreeD.Pacem3DAdapterElement {
                constructor() {
                    super(...arguments);
                    this._renderer = null;
                    this._camera = null;
                    this._scene = null;
                    this._orbitCtrls = null;
                    this._objects = new Map();
                    this._lights = new Map();
                    this._dict = {};
                    this._orbitControlsDelegate = (evt) => {
                    };
                    //#endregion
                }
                project(point3D) {
                    // check feasibility
                    if (Pacem.Utils.isNull(this._camera) || Pacem.Utils.isNull(this._stage))
                        return null;
                    //
                    const vector = new THREE.Vector3(point3D.x, point3D.y, point3D.z);
                    const width = this._stage.width, height = this._stage.height;
                    const widthHalf = width / 2, heightHalf = height / 2;
                    const point = vector.project(this._camera);
                    const x = (point.x * widthHalf) + widthHalf;
                    const y = -(point.y * heightHalf) + heightHalf;
                    return { x: x, y: y };
                }
                get scene() {
                    return this._scene;
                }
                raycast(point) {
                    let containerEl = this._3d.stage, camera = this._camera;
                    let offs = Pacem.Utils.offset(containerEl);
                    let vector = new THREE.Vector2(((point.x - offs.left) / containerEl.clientWidth) * 2 - 1, -((point.y - offs.top) / containerEl.clientHeight) * 2 + 1);
                    let raycaster = new THREE.Raycaster();
                    raycaster.setFromCamera(vector, camera);
                    let intersects = raycaster.intersectObjects(this._scene.children);
                    let obj;
                    if (intersects.length > 0 && (obj = intersects[0].object)) {
                        return this._dict[obj.id];
                    }
                    return null;
                }
                // #region ABSTRACT IMPLEMENTATION
                initialize(container) {
                    this._3d = container;
                    const wrapper = container.stage;
                    const stage = this._stage = document.createElement('canvas');
                    wrapper.innerHTML = '';
                    wrapper.appendChild(stage);
                    this._scene = new THREE.Scene();
                    this.invalidateSize();
                    let w = this._stage.width, h = this._stage.height;
                    //if (!ctrl.renderer)
                    let parameters = {
                        canvas: stage, antialias: true, stencil: false, alpha: true //, clearAlpha: 1
                    };
                    this._renderer = new THREE.WebGLRenderer(parameters);
                    this._renderer.setSize(w, h);
                    return stage;
                }
                _setCamera(cam) {
                    this._camera = cam;
                    this.invalidateSize();
                    this._disposeOrbitControls();
                    // re-init
                    if (this.orbit)
                        this._initOrbitControls();
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'orbit') {
                        if (val === true)
                            this._initOrbitControls();
                        else
                            this._disposeOrbitControls();
                    }
                }
                _initOrbitControls() {
                    if (Pacem.Utils.isNull(this._3d))
                        return;
                    var controls = this._orbitCtrls = new THREE.OrbitControls(this._camera, this._3d.stage);
                    controls.addEventListener('change', this._orbitControlsDelegate);
                }
                _disposeOrbitControls() {
                    if (Pacem.Utils.isNull(this._orbitCtrls))
                        return;
                    this._orbitCtrls.removeEventListener('change', this._orbitControlsDelegate);
                    this._orbitCtrls.dispose();
                }
                invalidateSize() {
                    if (!this._3d)
                        return;
                    let w = this._3d.stage.clientWidth;
                    let h = this._3d.stage.clientHeight;
                    this._stage.width = w;
                    this._stage.height = h;
                    let camera = this._camera;
                    if (camera instanceof THREE.PerspectiveCamera) {
                        camera.aspect = w / h;
                        camera.updateProjectionMatrix();
                    }
                    if (this._renderer)
                        this._renderer.setSize(w, h);
                }
                removeItem(item) {
                    var bag = this._objects;
                    if (item instanceof ThreeD.Pacem3DLightElement)
                        bag = this._lights;
                    var obj3d = bag.get(item);
                    if (!Pacem.Utils.isNull(obj3d)) {
                        this._scene.remove(obj3d);
                        delete this._dict[obj3d.id];
                        bag.delete(item);
                    }
                    return Pacem.Utils.fromResult({});
                }
                addItem(item) {
                    var deferred = Pacem.DeferPromise.defer();
                    if (item instanceof ThreeD.Pacem3DObjectElement) {
                        const ensure = (object3D) => {
                            let posv = item.position; // || new THREE.Vector3(0, 0, 0);
                            object3D.position.x = posv.x;
                            object3D.position.y = posv.y;
                            object3D.position.z = posv.z;
                            object3D.userData = item.tag;
                            if (Pacem.Utils.isNull(this._scene.getObjectById(object3D.id))) {
                                this._scene.add(object3D);
                                this._dict[object3D.id] = item;
                            }
                            deferred.resolve();
                        };
                        if (!this._objects.has(item)) {
                            const then = (object3D) => {
                                if (object3D) {
                                    ensure(object3D);
                                    this._objects.set(item, object3D);
                                }
                                else
                                    deferred.reject();
                            };
                            switch (item.format) {
                                case 'json':
                                    let loader = new THREE.JSONLoader();
                                    if (!Pacem.Utils.isNullOrEmpty(item.mesh)) {
                                        let tuple = loader.parse(JSON.parse(item.mesh)), m = tuple.materials;
                                        then(new THREE.Mesh(tuple.geometry, (m && m.length && m[0]) || new THREE.MeshLambertMaterial()));
                                    }
                                    else if (!Pacem.Utils.isNullOrEmpty(item.url)) {
                                        loader.load(item.url, (g, m) => {
                                            then(new THREE.Mesh(g, (m && m.length && m[0]) || new THREE.MeshLambertMaterial()));
                                        });
                                    }
                                    else
                                        deferred.reject();
                                    break;
                                case 'native':
                                    then(item.mesh);
                                    break;
                            }
                        }
                        else
                            ensure(this._objects.get(item));
                    }
                    else if (item instanceof ThreeD.Pacem3DLightElement) {
                        const ensure = (light) => {
                            let posv = item.position; // || new THREE.Vector3(0, 0, 0);
                            light.position.set(posv.x, posv.y, posv.z);
                            light.userData = item.tag;
                            if (Pacem.Utils.isNull(this._scene.getObjectById(light.id))) {
                                this._scene.add(light);
                                this._lights.set(item, light);
                            }
                            deferred.resolve();
                        };
                        var light = this._lights.get(item);
                        switch (item.type) {
                            case 'spot':
                                if (!(light instanceof THREE.SpotLight)) {
                                    this._scene.remove(light);
                                    light = new THREE.SpotLight();
                                }
                                light.target.position.set(item.target.x, item.target.y, item.target.z);
                                break;
                            default:
                                if (!(light instanceof THREE.PointLight)) {
                                    this._scene.remove(light);
                                    light = new THREE.PointLight();
                                }
                                break;
                        }
                        light.position.set(item.position.x, item.position.y, item.position.z);
                        light.color = new THREE.Color(item.color);
                        light.visible = !item.disabled;
                        light.intensity = item.intensity;
                        ensure(light);
                    }
                    else if (item instanceof ThreeD.Pacem3DCameraElement) {
                        if (item.type === 'perspective') {
                            var pcam;
                            if (this._camera instanceof THREE.PerspectiveCamera)
                                var pcam = this._camera;
                            else
                                pcam = new THREE.PerspectiveCamera();
                            pcam.lookAt(new THREE.Vector3(item.lookAt.x, item.lookAt.y, item.lookAt.z));
                            pcam.fov = item.fov;
                            pcam.aspect = item.aspect;
                            pcam.near = item.near;
                            pcam.far = item.far;
                            pcam.position.set(item.position.x, item.position.y, item.position.z);
                            //
                            this._setCamera(pcam);
                        }
                        deferred.resolve();
                    }
                    return deferred.promise;
                }
                render() {
                    if (this._camera)
                        this._renderer.render(this.scene, this._camera);
                }
            };
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemThreeAdapterElement.prototype, "orbit", void 0);
            PacemThreeAdapterElement = __decorate([
                Pacem.CustomElement({ tagName: Pacem.P + '-3d-adapter-three' })
            ], PacemThreeAdapterElement);
            ThreeD.PacemThreeAdapterElement = PacemThreeAdapterElement;
        })(ThreeD = Components.ThreeD || (Components.ThreeD = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
