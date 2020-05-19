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
/// <reference path="../../../dist/js/pacem-ui.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Plus;
        (function (Plus) {
            let PacemCarouselElement = class PacemCarouselElement extends Components.UI.PacemAdaptedIterativeElement {
                constructor() {
                    super(...arguments);
                    this.interval = 4000;
                }
            };
            __decorate([
                Pacem.ViewChild(Pacem.P + '-adapter')
            ], PacemCarouselElement.prototype, "adapter", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-slideshow')
            ], PacemCarouselElement.prototype, "slideshow", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Number })
            ], PacemCarouselElement.prototype, "interval", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemCarouselElement.prototype, "pausable", void 0);
            PacemCarouselElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-carousel', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-repeater datasource="{{ :host.datasource }}">
        <${Pacem.P}-slideshow class="${Pacem.PCSS}-carousel" adapter="{{ ::adapter }}" index="{{ :host.index, twoway }}" on-load="this.focus()">

            <template>

                <${Pacem.P}-slide class="${Pacem.PCSS}-carousel-item" css-class="{{ { '${Pacem.PCSS}-carousel-previous': :host.isPrevious(^index, ::slideshow.index), '${Pacem.PCSS}-carousel-next': :host.isNext(^index, ::slideshow.index), '${Pacem.PCSS}-carousel-focus': ^index === ::slideshow.index } }}">
                <${Pacem.P}-a href="{{ ^item.url }}">
                    <${Pacem.P}-img disabled="{{ !:host.isCloseTo(^index, ::slideshow.index) }}" class="${Pacem.PCSS}-carousel-splash" adapt="cover" src="{{ ^item.image }}"></${Pacem.P}-img>
                    <div class="${Pacem.PCSS}-carousel-content">
                        <div class="${Pacem.PCSS}-carousel-caption">
                            <h3><${Pacem.P}-text text="{{ ^item.title }}"></${Pacem.P}-text></h3>
                            <${Pacem.P}-panel class="paragraph" content="{{ ^item.content }}"></${Pacem.P}-panel>
                        </div>
                    </div>
                </${Pacem.P}-a>
                </${Pacem.P}-slide>

            </template>
        </${Pacem.P}-slideshow>
        
    </${Pacem.P}-repeater><${Pacem.P}-adapter pausable="{{ :host.pausable }}" class="${Pacem.PCSS}-carousel-adapter" interval="{{ :host.interval }}"></${Pacem.P}-adapter>`
                })
            ], PacemCarouselElement);
            Plus.PacemCarouselElement = PacemCarouselElement;
        })(Plus = Components.Plus || (Components.Plus = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
/// <reference path="../../../dist/js/pacem-ui.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Plus;
        (function (Plus) {
            class PacemContextMenuItemElement extends Components.PacemItemElement {
                connectedCallback() {
                    super.connectedCallback();
                    Pacem.Utils.addClass(this, Pacem.PCSS + '-context-menuitem');
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    const container = this.container;
                    if (container instanceof PacemContextMenuElement) {
                        container.refresh();
                    }
                }
            }
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemContextMenuItemElement.prototype, "iconGlyph", void 0);
            Plus.PacemContextMenuItemElement = PacemContextMenuItemElement;
            let PacemContextMenuItemCommandElement = class PacemContextMenuItemCommandElement extends PacemContextMenuItemElement {
            };
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemContextMenuItemCommandElement.prototype, "commandName", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemContextMenuItemCommandElement.prototype, "caption", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemContextMenuItemCommandElement.prototype, "tooltip", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemContextMenuItemCommandElement.prototype, "iconGlyph", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemContextMenuItemCommandElement.prototype, "confirmationMessage", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Element })
            ], PacemContextMenuItemCommandElement.prototype, "confirmationDialog", void 0);
            PacemContextMenuItemCommandElement = __decorate([
                Pacem.CustomElement({ tagName: Pacem.P + '-context-menuitem-command' })
            ], PacemContextMenuItemCommandElement);
            Plus.PacemContextMenuItemCommandElement = PacemContextMenuItemCommandElement;
            let PacemContextMenuItemSeparatorElement = class PacemContextMenuItemSeparatorElement extends PacemContextMenuItemElement {
            };
            PacemContextMenuItemSeparatorElement = __decorate([
                Pacem.CustomElement({ tagName: Pacem.P + '-context-menuitem-separator' })
            ], PacemContextMenuItemSeparatorElement);
            Plus.PacemContextMenuItemSeparatorElement = PacemContextMenuItemSeparatorElement;
            let PacemContextMenuElement = class PacemContextMenuElement extends Components.PacemItemsContainerElement {
                constructor() {
                    super(...arguments);
                    this._dispatchCommand = (e) => {
                        Pacem.avoidHandler(e);
                        this.dispatchEvent(new Pacem.CommandEvent({ commandName: e.detail.commandName, commandArgument: e.detail.commandArgument || this.commandArgument }));
                    };
                }
                validate(item) {
                    return item instanceof PacemContextMenuItemElement;
                }
                get _balloon() {
                    return this._btns.dom[0];
                }
                get _repeater() {
                    return this._balloon.querySelector(Pacem.P + '-repeater');
                }
                register(item) {
                    const retval = super.register(item);
                    if (retval) {
                        this._refreshRepeater();
                    }
                    return retval;
                }
                unregister(item) {
                    const retval = super.unregister(item);
                    if (retval) {
                        this._refreshRepeater();
                    }
                    return retval;
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this._renderButton();
                    this._balloon.addEventListener(Pacem.CommandEventName, this._dispatchCommand, false);
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'icon' && this._btn) {
                        this._renderButton(val);
                    }
                }
                _renderButton(val = this.icon) {
                    this._btn.innerHTML = val ? Pacem.Utils.renderHtmlIcon(val) : `<i class="${Pacem.PCSS}-icon">more_horiz</i>`;
                }
                disconnectedCallback() {
                    if (!Pacem.Utils.isNull(this._balloon)) {
                        this._balloon.removeEventListener(Pacem.CommandEventName, this._dispatchCommand, false);
                    }
                    super.disconnectedCallback();
                }
                refresh() {
                    this._refreshRepeater();
                }
                _refreshRepeater() {
                    const rep = this._repeater;
                    if (!Pacem.Utils.isNullOrEmpty(rep)) {
                        rep.datasource = this.items.map(i => {
                            let obj = { localName: i.localName };
                            for (let j = 0; j < i.attributes.length; j++) {
                                let attr = i.attributes.item(j).name;
                                let prop = Pacem.CustomElementUtils.kebabToCamel(attr);
                                obj[prop] = i[prop];
                            }
                            return obj;
                        });
                    }
                }
            };
            __decorate([
                Pacem.ViewChild(Pacem.P + '-button')
            ], PacemContextMenuElement.prototype, "_btn", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-shell-proxy')
            ], PacemContextMenuElement.prototype, "_btns", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Json })
            ], PacemContextMenuElement.prototype, "commandArgument", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemContextMenuElement.prototype, "icon", void 0);
            __decorate([
                Pacem.Debounce(true)
            ], PacemContextMenuElement.prototype, "_refreshRepeater", null);
            PacemContextMenuElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-context-menu', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-button class="button-flat ${Pacem.PCSS}-margin margin-0"></${Pacem.P}-button>
<${Pacem.P}-content></${Pacem.P}-content>
<${Pacem.P}-shell-proxy>
        <${Pacem.P}-balloon target="{{ :host._btn }}" class="${Pacem.PCSS}-contextmenu" options="{{ { trigger: 'click', position: 'x', align: 'auto' } }}">
    <${Pacem.P}-repeater>
            <template>
                <${Pacem.P}-if match="{{ ^item.localName === '${Pacem.P}-context-menuitem-command' }}">
                    <${Pacem.P}-button icon-glyph="{{ ^item.iconGlyph }}" hide="{{ ^item.hide }}" disabled="{{ ^item.disabled }}"
                                 on-mouseup="::_balloon.popout()" tooltip="{{ ^item.tooltip }}"
                                 confirmation-message="{{ ^item.confirmationMessage }}" confirmation-dialog="{{ ^item.confirmationDialog }}"
                                 command-name="{{ ^item.commandName }}"><${Pacem.P}-text text="{{ ^item.caption }}"></${Pacem.P}-text></${Pacem.P}-button>
                </${Pacem.P}-if>
                <${Pacem.P}-if match="{{ ^item.localName === '${Pacem.P}-context-menuitem-separator' }}">
                    <hr />
                </${Pacem.P}-if>
            </template>
    </${Pacem.P}-repeater>
        </${Pacem.P}-balloon>
</${Pacem.P}-shell-proxy>`
                })
            ], PacemContextMenuElement);
            Plus.PacemContextMenuElement = PacemContextMenuElement;
        })(Plus = Components.Plus || (Components.Plus = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
/// <reference path="../../../dist/js/pacem-ui.d.ts" />
/// <reference path="../../../dist/js/pacem-scaffolding.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Plus;
        (function (Plus) {
            let EditMode;
            (function (EditMode) {
                EditMode["Text"] = "text";
                EditMode["Html"] = "html";
                EditMode["Image"] = "image";
                EditMode["Markdown"] = "markdown";
            })(EditMode = Plus.EditMode || (Plus.EditMode = {}));
            let PacemEditElement = class PacemEditElement extends Components.PacemElement {
                constructor(_markdown = new Pacem.MarkdownService()) {
                    super();
                    this._markdown = _markdown;
                    // #endregion
                    // #endregion
                    this._dialogPropertyChangedHandler = (evt) => {
                        this._dialogPropertyChangedCallback(evt);
                    };
                    this._broadcastFetchRequestEventName = (evt) => {
                        this.dispatchEvent(new Components.Scaffolding.ImageFetchRequestEvent(evt.detail));
                    };
                    this._innerValueChangedHandler = (evt) => {
                        if (evt.detail.propertyName === 'value' && !Pacem.Utils.isNull(this._dialog))
                            this._dialog.state = evt.detail.currentValue;
                    };
                    this._editHandler = (evt) => {
                        this.edit(evt);
                    };
                }
                _addButton() {
                    /*<pacem-balloon options="{ position: '${UI.BalloonPosition.Top}', align: '${UI.BalloonAlignment.End}', behavior: '${UI.BalloonBehavior.Inert}', hoverDelay: 0 }" disabled="{{ :host.disabled }}" class="pacem-edit-balloon">
                        <pacem-button class="pacem-edit" on-click=":host.edit($event)"></pacem-button>
                    </pacem-balloon>*/
                    if (!Pacem.Utils.isNull(this._button))
                        return;
                    //
                    var btn = document.createElement(Pacem.P + '-button');
                    btn.className = Pacem.PCSS + '-edit-button';
                    btn.addEventListener('click', this._editHandler, false);
                    this._target.appendChild(btn);
                    //
                    return this._button = btn;
                }
                _removeButton() {
                    var btn = this._button;
                    if (Pacem.Utils.isNull(btn))
                        return;
                    btn.removeEventListener('click', this._editHandler, false);
                    btn.remove();
                    this._button = null;
                }
                // #region dialog 
                _addDialog() {
                    /* <pacem-dialog buttons="'${ UI.DialogButtons.OkCancel}'" on-${PropertyChangeEventName}=":host._dialogPropertyChangedCallback($event)"> */
                    var dialog = document.createElement(Pacem.P + '-dialog');
                    dialog.buttons = Components.UI.DialogButtons.OkCancel;
                    dialog.addEventListener(Pacem.PropertyChangeEventName, this._dialogPropertyChangedHandler, false);
                    dialog.appendChild(this._addTextarea());
                    dialog.appendChild(this._addContenteditable());
                    dialog.appendChild(this._addEditImage());
                    document.body.appendChild(dialog);
                    //
                    return this._dialog = dialog;
                }
                _removeDialog() {
                    this._removeTextarea();
                    this._removeContenteditable();
                    this._removeEditImage();
                    if (!Pacem.Utils.isNull(this._dialog)) {
                        this._dialog.removeEventListener(Pacem.PropertyChangeEventName, this._dialogPropertyChangedHandler, false);
                        this._dialog.remove();
                    }
                }
                // #region textarea 
                _addTextarea() {
                    /*<pacem-textarea hide="{{ :host.type === '${ EditMode.Html}' || :host.type === '${EditMode.Image}' }}" value="{{ ::_dialog.state, twoway }}"></pacem-textarea>*/
                    var textarea = document.createElement(Pacem.P + '-textarea');
                    textarea.className = Pacem.PCSS + '-edit-text';
                    textarea.addEventListener(Pacem.PropertyChangeEventName, this._innerValueChangedHandler, false);
                    const type = this.type || EditMode.Text;
                    textarea.hide = type !== EditMode.Text && type !== EditMode.Markdown;
                    return this._textarea = textarea;
                }
                _removeTextarea() {
                    if (!Pacem.Utils.isNull(this._textarea))
                        this._textarea.removeEventListener(Pacem.PropertyChangeEventName, this._innerValueChangedHandler, false);
                }
                // #endregion
                // #region contenteditable
                _addContenteditable() {
                    /*<pacem-contenteditable hide="{{ :host.type != '${ EditMode.Html}' }}" value="{{ ::_dialog.state, twoway  }}"></pacem-contenteditable> */
                    var contenteditable = document.createElement(Pacem.P + '-contenteditable');
                    contenteditable.className = Pacem.PCSS + '-edit-content';
                    contenteditable.addEventListener(Pacem.PropertyChangeEventName, this._innerValueChangedHandler, false);
                    const type = this.type || EditMode.Text;
                    contenteditable.hide = type !== EditMode.Html;
                    return this._contenteditable = contenteditable;
                }
                _removeContenteditable() {
                    if (!Pacem.Utils.isNull(this._contenteditable))
                        this._contenteditable.removeEventListener(Pacem.PropertyChangeEventName, this._innerValueChangedHandler, false);
                }
                // #endregion
                // #region edit-image
                _addEditImage() {
                    /*<!-- img -->
            <pacem-panel class="pacem-edit-image" hide="{{ :host.type != '${ EditMode.Image}' }}"
                css-class="{{ {'pacem-uploading': ::_uploader.uploading, 'pacem-upload-enabled': !Pacem.Utils.isNullOrEmpty(:host.imageUploadUrl)} }}">
                <pacem-input-search value="{{ :host.hint, twoway }}"></pacem-input-search>
                <pacem-upload pattern="'.+\.(jpe?g|png)$'" url="{{ :host.imageUploadUrl }}" on-${ PropertyChangeEventName}=":host._uploaderPropertyChangedCallback($event)" hide="{{ Pacem.Utils.isNullOrEmpty(:host.imageUploadUrl) }}"></pacem-upload>
                <pacem-infinite-scroller container="{{ ::_repeater }}" on-fetchmore=":host._imagefetchSuddenly()" disabled="{{ :host._fetching || !:host._open || :host._images.length >= :host.imageSet.total }}"></pacem-infinite-scroller>
                <pacem-repeater datasource="{{ :host._images }}">
                    <template>
                        <pacem-img css-class="{{ {'pacem-selected': ^item.src === ::_dialog.state } }}" on-click="::_dialog.state = ^item.src" src="{{ ^item.thumb }}" adapt="'contain'"></pacem-img>
                    </template>
                </pacem-repeater>
                <pacem-progressbar></pacem-progressbar>
            </pacem-panel>*/
                    var editImage = document.createElement(Pacem.P + '-edit-image');
                    editImage.disabled = true;
                    editImage.addEventListener(Pacem.PropertyChangeEventName, this._innerValueChangedHandler, false);
                    editImage.addEventListener(Components.Scaffolding.ImageFetchRequestEventName, this._broadcastFetchRequestEventName, false);
                    const type = this.type || EditMode.Text;
                    editImage.hide = type !== EditMode.Image;
                    editImage.uploadUrl = this.imageUploadUrl;
                    editImage.allowSnapshot = this.allowSnapshot;
                    editImage.maxWidth = this.maxImageWidth;
                    editImage.maxHeight = this.maxImageHeight;
                    return this._editImage = editImage;
                }
                _removeEditImage() {
                    if (!Pacem.Utils.isNull(this._editImage)) {
                        this._editImage.removeEventListener(Pacem.PropertyChangeEventName, this._innerValueChangedHandler, false);
                        this._editImage.removeEventListener(Components.Scaffolding.ImageFetchRequestEventName, this._broadcastFetchRequestEventName, false);
                    }
                }
                _update(val) {
                    var cnt = this._content;
                    switch (this.type) {
                        case EditMode.Html:
                            cnt.innerHTML = val;
                            break;
                        case EditMode.Markdown:
                            switch (cnt.localName) {
                                case Pacem.P + '-markdown':
                                    cnt.value = val;
                                    break;
                                default:
                                    cnt.innerHTML = this._markdown.toHtml(val);
                                    break;
                            }
                            break;
                        case EditMode.Image:
                            switch (cnt.localName) {
                                case 'img':
                                case Pacem.P + '-img':
                                    cnt['src'] = val;
                                    break;
                                default:
                                    cnt.style.backgroundImage = `url(${val})`;
                                    break;
                            }
                            break;
                        default:
                            this._content.textContent = val;
                            break;
                    }
                }
                _retrieve() {
                    var cnt = this._content;
                    switch (this.type) {
                        case EditMode.Html:
                            return cnt.innerHTML;
                        case EditMode.Image:
                            switch (cnt.localName) {
                                case Pacem.P + '-img':
                                case 'img':
                                    return cnt['src'];
                                default:
                                    let styled = getComputedStyle(cnt).backgroundImage, matches = /url\(["']?([^'"]+)["']?\)/.exec(styled);
                                    return matches && matches.length && matches[1];
                            }
                        case EditMode.Markdown:
                            return cnt['value'] || cnt.textContent;
                        default:
                            return cnt.textContent;
                    }
                }
                _setup() {
                    const val = this.disabled;
                    if (val) {
                        Pacem.Utils.removeClass(this._target, Pacem.PCSS + '-editing');
                        this._removeButton();
                    }
                    else {
                        Pacem.Utils.addClass(this._target, Pacem.PCSS + '-editing');
                        this._addButton();
                    }
                }
                _dialogPropertyChangedCallback(evt) {
                    if (evt.detail.propertyName === 'state') {
                        const val = evt.detail.currentValue;
                        if (!Pacem.Utils.isNull(this._textarea))
                            this._textarea.value = val;
                        if (!Pacem.Utils.isNull(this._contenteditable))
                            this._contenteditable.value = val;
                        if (!Pacem.Utils.isNull(this._editImage))
                            this._editImage.value = val;
                        this._update(evt.detail.currentValue);
                    }
                }
                get _target() {
                    var cnt = this.target;
                    if (Pacem.Utils.isNull(cnt))
                        cnt = this.firstElementChild;
                    return cnt;
                }
                connectedCallback() {
                    super.connectedCallback();
                    this._addDialog();
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    this._addButton();
                    this._setup();
                }
                disconnectedCallback() {
                    this._removeButton();
                    this._removeDialog();
                    super.disconnectedCallback();
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    switch (name) {
                        case 'imageUploadUrl':
                            if (!Pacem.Utils.isNull(this._editImage))
                                this._editImage.uploadUrl = val;
                            break;
                        case 'allowSnapshot':
                            if (!Pacem.Utils.isNull(this._editImage))
                                this._editImage.allowSnapshot = val;
                            break;
                        case 'imageSet':
                            if (!Pacem.Utils.isNull(this._editImage))
                                this._editImage.imageSet = val;
                            break;
                        case 'disabled':
                            this._setup();
                            break;
                        case 'type':
                            const type = val;
                            if (!Pacem.Utils.isNull(this._textarea))
                                this._textarea.hide = type !== EditMode.Text && type !== EditMode.Markdown;
                            if (!Pacem.Utils.isNull(this._contenteditable))
                                this._contenteditable.hide = type !== EditMode.Html;
                            if (!Pacem.Utils.isNull(this._editImage))
                                this._editImage.hide = type !== EditMode.Image;
                            break;
                        case 'maxImageHeight':
                            if (!Pacem.Utils.isNull(this._editImage))
                                this._editImage.maxHeight = val;
                            break;
                        case 'maxImageWidth':
                            if (!Pacem.Utils.isNull(this._editImage))
                                this._editImage.maxWidth = val;
                            break;
                    }
                }
                edit(evt) {
                    Pacem.avoidHandler(evt);
                    var cnt = this._target;
                    if (Pacem.Utils.isNull(cnt))
                        return;
                    this._removeButton();
                    this._content = cnt;
                    var state = this._state = this._retrieve();
                    if (!Pacem.Utils.isNull(this._editImage))
                        this._editImage.disabled = false;
                    this._dialog.open(state).then(args => {
                        switch (args.button) {
                            case Components.UI.DialogButton.Cancel:
                                // reset value
                                this._update(this._state);
                                break;
                            case Components.UI.DialogButton.Ok:
                                // save
                                this._update(args.state);
                                this.dispatchEvent(new CustomEvent('commit', { detail: { value: args.state } }));
                                break;
                        }
                        this._content = null;
                        if (!Pacem.Utils.isNull(this._editImage))
                            this._editImage.disabled = true;
                        this._addButton();
                    });
                }
            };
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemEditElement.prototype, "key", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemEditElement.prototype, "type", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Element })
            ], PacemEditElement.prototype, "target", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemEditElement.prototype, "imageUploadUrl", void 0);
            __decorate([
                Pacem.Watch({ emit: false })
            ], PacemEditElement.prototype, "imageSet", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
            ], PacemEditElement.prototype, "maxImageWidth", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Number })
            ], PacemEditElement.prototype, "maxImageHeight", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.Boolean })
            ], PacemEditElement.prototype, "allowSnapshot", void 0);
            PacemEditElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-edit'
                })
            ], PacemEditElement);
            Plus.PacemEditElement = PacemEditElement;
        })(Plus = Components.Plus || (Components.Plus = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Plus;
        (function (Plus) {
            let PacemGalleryElement = class PacemGalleryElement extends Components.UI.PacemAdaptedIterativeElement {
                get adapter() {
                    return this._adapter;
                }
                _heroAnimate(fromEl, src) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (!Pacem.Utils.isNull(fromEl)) {
                            let pImg = document.createElement(Pacem.P + '-img');
                            let goalEl = this._heroPlaceholderProxy.dom[0];
                            const TRANSITION = 300;
                            pImg.src = src || /* assuming an img-ish element */ fromEl['src'];
                            pImg.adapt = 'contain';
                            let goal = Pacem.Utils.offset(goalEl), from = Pacem.Utils.offset(fromEl), style = pImg.style;
                            const cfrStyle = getComputedStyle(goalEl);
                            style.border = cfrStyle.border;
                            style.width = goalEl.clientWidth + 'px';
                            style.height = goalEl.clientHeight + 'px';
                            style.position = 'absolute';
                            style.zIndex = cfrStyle.zIndex;
                            style.top = goal.top + 'px';
                            style.left = goal.left + 'px';
                            const scaleX = fromEl.clientWidth / goalEl.clientWidth, scaleY = fromEl.clientHeight / goalEl.clientHeight, translateX = (from.left - goal.left) + 'px', translateY = (from.top - goal.top) + 'px';
                            style.transformOrigin = '0 0';
                            style.transition = `transform cubic-bezier(0.445, 0.05, 0.55, 0.95) ${TRANSITION}ms, opacity ${TRANSITION}ms`;
                            style.transform = `translate(${translateX}, ${translateY}) scale(${scaleX}, ${scaleY})`;
                            document.body.appendChild(pImg);
                            requestAnimationFrame(() => {
                                pImg.style.transform = '';
                            });
                            yield Pacem.Utils.waitForAnimationEnd(pImg, TRANSITION);
                            pImg.remove();
                        }
                    });
                }
                open(startIndex, heroFrom, src) {
                    this._poppingUp = true;
                    this._lightbox.show = true;
                    this._slideshow.index = startIndex; // reflects on 'this' (twoway)
                    this._heroAnimate(heroFrom, src)
                        .then(_ => {
                        this._poppingUp = false;
                        this._slideshow.focus();
                    });
                }
            };
            __decorate([
                Pacem.ViewChild(Pacem.P + '-adapter')
            ], PacemGalleryElement.prototype, "_adapter", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-lightbox')
            ], PacemGalleryElement.prototype, "_lightbox", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-slideshow')
            ], PacemGalleryElement.prototype, "_slideshow", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-shell-proxy')
            ], PacemGalleryElement.prototype, "_heroPlaceholderProxy", void 0);
            __decorate([
                Pacem.Watch()
            ], PacemGalleryElement.prototype, "_poppingUp", void 0);
            PacemGalleryElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-gallery', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-lightbox class="${Pacem.PCSS}-gallery">
    <${Pacem.P}-repeater datasource="{{ :host.datasource }}">
        <${Pacem.P}-slideshow adapter="{{ ::_adapter }}" index="{{ :host.index, twoway }}">
        <template>
            <${Pacem.P}-slide class="${Pacem.PCSS}-gallery-item"
css-class="{{ { '${Pacem.PCSS}-gallery-previous': :host.isPrevious(^index, ::_slideshow.index), '${Pacem.PCSS}-gallery-next': :host.isNext(^index, ::_slideshow.index), '${Pacem.PCSS}-gallery-focus': ^index === ::_slideshow.index } }}"
>
            <${Pacem.P}-img src="{{ ^item.image }}" disabled="{{ !(:host.isCloseTo(^index, ::_slideshow.index) || ^index === ::_slideshow.index) }}" 
css="{{ {'visibility': (:host._poppingUp ? 'hidden' : ''), 'transition': (:host._poppingUp ? 'none' : '')} }}" class="${Pacem.PCSS}-gallery-splash" adapt="contain"></${Pacem.P}-img>
            <${Pacem.P}-panel hide="{{ $pacem.isNullOrEmpty(^item.caption) }}" class="${Pacem.PCSS}-gallery-caption">
                <${Pacem.P}-span class="paragraph" text="{{ ^item.caption }}"></${Pacem.P}-span>
            </${Pacem.P}-panel>
            
            </${Pacem.P}-slide>
        </template>
        </${Pacem.P}-slideshow>
    </${Pacem.P}-repeater>
<${Pacem.P}-adapter class="${Pacem.PCSS}-gallery-adapter"></${Pacem.P}-adapter>
</${Pacem.P}-lightbox>
<${Pacem.P}-shell-proxy><div class="${Pacem.PCSS}-gallery-hero-target"></div></${Pacem.P}-shell-proxy>`
                })
            ], PacemGalleryElement);
            Plus.PacemGalleryElement = PacemGalleryElement;
        })(Plus = Components.Plus || (Components.Plus = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
/// <reference path="../../../dist/js/pacem-scaffolding.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Plus;
        (function (Plus) {
            var PacemModalFormElement_1;
            // TODO: use onewaytosource as a binding mode
            let PacemModalFormElement = PacemModalFormElement_1 = class PacemModalFormElement extends Components.UI.PacemDialogBase {
                constructor() {
                    super();
                    this.method = Pacem.Net.HttpMethod.Post;
                    this._emitter = new Pacem.Components.Scaffolding.FormEventEmitter(this);
                }
                viewActivatedCallback() {
                    super.viewActivatedCallback();
                    // HACK: move the buttons outside the .pacem-scrollable element in the lightbox
                    var lightboxCore = this.querySelector(`.${Pacem.PCSS}-lightbox`);
                    lightboxCore.appendChild(this._buttons = this.querySelector(`.${Pacem.PCSS}-dialog-buttons`));
                    lightboxCore.appendChild(this.querySelector(`.${Pacem.PCSS}-dialog-heading`));
                    lightboxCore.appendChild(this.querySelector(Pacem.P + '-loader'));
                    this.dispatchEvent(new Pacem.PropertyChangeEvent({ propertyName: 'modalButtons', currentValue: this.modalButtons }));
                    this._emitter.start();
                }
                disconnectedCallback() {
                    this._emitter.stop();
                    super.disconnectedCallback();
                }
                _submit(evt) {
                    if (this.readonly) {
                        this.commit(Components.UI.DialogButton.Ok, evt);
                    }
                    else {
                        Pacem.avoidHandler(evt);
                        if (Pacem.Utils.isNullOrEmpty(this.action)) {
                            this.commit(Components.UI.DialogButton.Ok, evt);
                        }
                        else {
                            this._form.submit(this._fetcher).then(_ => {
                                this.commit(Components.UI.DialogButton.Ok, evt);
                            }, r => {
                                // do nothing
                            });
                        }
                    }
                }
                _onSubmit(evt) {
                    // no need to broadcast, event bubbles itself...
                    // ...just handle it using the eventual listeners:
                    this.emit(evt);
                }
                open(state) {
                    if (Pacem.Utils.isNull(state)) {
                        throw `The state of a ${PacemModalFormElement_1} cannot be null.`;
                    }
                    var retval = super.open(state);
                    this._form.setPristine();
                    return retval;
                }
                commit(btn, evt) {
                    super.commit(btn, evt);
                    Pacem.Utils.waitForAnimationEnd(this, 500).then(_ => {
                        // BREAKING change (v0.8.37): state destroyed when dialog committed
                        // TODO: consider 'if' and 'how' to avoid this.
                        this.state = {};
                    });
                }
                _cancel(evt) {
                    this.commit(Components.UI.DialogButton.Cancel, evt);
                    this._form.reset();
                }
                _broadcast(evt) {
                    this.dispatchEvent(new CustomEvent(evt.type, { detail: evt.detail }));
                }
                /** Gets the 'ok' and 'cancel' modal buttons. */
                get modalButtons() {
                    const btns = this._buttons;
                    return {
                        ok: btns && btns.firstElementChild && btns.firstElementChild.firstElementChild,
                        cancel: btns && btns.firstElementChild && btns.firstElementChild.lastElementChild
                    };
                }
            };
            __decorate([
                Pacem.Watch({ reflectBack: true, converter: Pacem.PropertyConverters.String })
            ], PacemModalFormElement.prototype, "okCaption", void 0);
            __decorate([
                Pacem.Watch({ reflectBack: true, converter: Pacem.PropertyConverters.String })
            ], PacemModalFormElement.prototype, "cancelCaption", void 0);
            __decorate([
                Pacem.Watch({ reflectBack: true, converter: Pacem.PropertyConverters.String })
            ], PacemModalFormElement.prototype, "method", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Json })
            ], PacemModalFormElement.prototype, "metadata", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemModalFormElement.prototype, "action", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemModalFormElement.prototype, "loaderType", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemModalFormElement.prototype, "success", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemModalFormElement.prototype, "fail", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Boolean })
            ], PacemModalFormElement.prototype, "readonly", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.Json })
            ], PacemModalFormElement.prototype, "fetchHeaders", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemModalFormElement.prototype, "fetchCredentials", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-lightbox')
            ], PacemModalFormElement.prototype, "lightbox", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-form[entity]')
            ], PacemModalFormElement.prototype, "_form", void 0);
            __decorate([
                Pacem.ViewChild(Pacem.P + '-fetch')
            ], PacemModalFormElement.prototype, "_fetcher", void 0);
            PacemModalFormElement = PacemModalFormElement_1 = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-modal-form', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-lightbox modal="true" logger="{{ :host.logger }}"><${Pacem.P}-form wrapper>
        <${Pacem.P}-form logger="{{ :host.logger }}" on-submit=":host._onSubmit($event)" readonly="{{ :host.readonly }}" entity="{{ :host.state, twoway }}" on-success=":host._broadcast($event)" 
            on-fail=":host._broadcast($event)" success="{{ :host.success, twoway }}" fail="{{ :host.fail, twoway }}" autogenerate="{{ !$pacem.isNull($this.entity) }}" metadata="{{ :host.metadata }}"
            fetch-headers="{{ :host.fetchHeaders }}" fetch-credentials="{{ :host.fetchCredentials }}"></${Pacem.P}-form></${Pacem.P}-form>
        <${Pacem.P}-fetch logger="{{ :host.logger }}" method="{{ :host.method }}" headers="{{ :host.fetchHeaders }}" credentials="{{ :host.fetchCredentials }}" autofetch="false" url="{{ :host.action }}"></${Pacem.P}-fetch> 
    <div class="${Pacem.PCSS}-dialog-buttons ${Pacem.PCSS}-buttonset buttons">
        <div class="buttonset-left">
        <${Pacem.P}-button on-click=":host._submit($event)" css-class="{{ {'buttonset-last': :host.readonly} }}"
            class="button primary button-size size-small" disabled="{{ !:host.readonly && (!(::_form.valid && ::_form.dirty) || ::_fetcher.fetching) }}"><${Pacem.P}-text text="{{ :host.okCaption || 'OK' }}"></${Pacem.P}-text></${Pacem.P}-button>
        <${Pacem.P}-button on-click=":host._cancel($event)" hide="{{ :host.readonly }}" class="button button-size size-small" disabled="{{ ::_fetcher.fetching }}"><${Pacem.P}-text text="{{ :host.cancelCaption || 'Cancel' }}"></${Pacem.P}-text></${Pacem.P}-button>
    </div></div>
    <${Pacem.P}-panel class="${Pacem.PCSS}-dialog-heading">
        <${Pacem.P}-content></${Pacem.P}-content>
    </${Pacem.P}-panel>
    <${Pacem.P}-loader type="{{ :host.loaderType }}" class="${Pacem.PCSS}-hover loader-primary loader-small" active="{{ ::_fetcher.fetching }}"></${Pacem.P}-loader>
</${Pacem.P}-lightbox>`
                })
            ], PacemModalFormElement);
            Plus.PacemModalFormElement = PacemModalFormElement;
        })(Plus = Components.Plus || (Components.Plus = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
/// <reference path="../../../dist/js/pacem-core.d.ts" />
/// <reference path="../../../dist/js/pacem-ui.d.ts" />
/// <reference path="../../../dist/js/pacem-scaffolding.d.ts" />
var Pacem;
(function (Pacem) {
    var Components;
    (function (Components) {
        var Plus;
        (function (Plus) {
            let PacemSearchElement = class PacemSearchElement extends Components.PacemElement {
                constructor() {
                    super(...arguments);
                    this.hintParameter = 'q';
                }
                propertyChangedCallback(name, old, val, first) {
                    super.propertyChangedCallback(name, old, val, first);
                    if (name === 'hint') {
                        let params = {};
                        params[this.hintParameter] = val;
                        this._fetcher.parameters = params;
                    }
                }
            };
            __decorate([
                Pacem.ViewChild(Pacem.P + '-fetch')
            ], PacemSearchElement.prototype, "_fetcher", void 0);
            __decorate([
                Pacem.Watch()
            ], PacemSearchElement.prototype, "datasource", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemSearchElement.prototype, "hint", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemSearchElement.prototype, "url", void 0);
            __decorate([
                Pacem.Watch({ converter: Pacem.PropertyConverters.String })
            ], PacemSearchElement.prototype, "method", void 0);
            __decorate([
                Pacem.Watch({ emit: false, converter: Pacem.PropertyConverters.String })
            ], PacemSearchElement.prototype, "hintParameter", void 0);
            PacemSearchElement = __decorate([
                Pacem.CustomElement({
                    tagName: Pacem.P + '-search', shadow: Pacem.Defaults.USE_SHADOW_ROOT,
                    template: `<${Pacem.P}-fetch debounce="800" url="{{ :host.url }}" method="{{ :host.method }}">
</${Pacem.P}-fetch><${Pacem.P}-input-search value="{{ :host.hint, twoway }}"></${Pacem.P}-input-search>
<${Pacem.P}-repeater datasource="{{ ::_fetch.result }}">
    <${Pacem.P}-content></${Pacem.P}-content>
</${Pacem.P}-repeater>`
                })
            ], PacemSearchElement);
            Plus.PacemSearchElement = PacemSearchElement;
        })(Plus = Components.Plus || (Components.Plus = {}));
    })(Components = Pacem.Components || (Pacem.Components = {}));
})(Pacem || (Pacem = {}));
