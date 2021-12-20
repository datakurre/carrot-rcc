"use strict";
(self["webpackChunkjupyterlab_bpmn"] = self["webpackChunkjupyterlab_bpmn"] || []).push([["lib_index_js-webpack_sharing_consume_default_bpmn-moddle_bpmn-moddle-webpack_sharing_consume_-64f830"],{

/***/ "./lib/RobotModule/RobotFrameworkTask.js":
/*!***********************************************!*\
  !*** ./lib/RobotModule/RobotFrameworkTask.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ RobotRenderer)
/* harmony export */ });
/* harmony import */ var bpmn_js_lib_util_ModelUtil__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! bpmn-js/lib/util/ModelUtil */ "./node_modules/bpmn-js/lib/util/ModelUtil.js");
/* harmony import */ var diagram_js_lib_draw_BaseRenderer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! diagram-js/lib/draw/BaseRenderer */ "./node_modules/diagram-js/lib/draw/BaseRenderer.js");
/* harmony import */ var inherits_inherits_browser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! inherits/inherits_browser */ "./node_modules/inherits/inherits_browser.js");
/* harmony import */ var inherits_inherits_browser__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(inherits_inherits_browser__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var tiny_svg__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! tiny-svg */ "./node_modules/tiny-svg/dist/index.esm.js");




const Robot = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgdmlld0JveD0iMCAwIDIwMi40MzI1IDIwMi4zNDEyNSIKICAgaGVpZ2h0PSIyMDIuMzQxMjUiCiAgIHdpZHRoPSIyMDIuNDMyNSIKICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIKICAgdmVyc2lvbj0iMS4xIgogICBpZD0ic3ZnMiI+PG1ldGFkYXRhCiAgICAgaWQ9Im1ldGFkYXRhOCI+PHJkZjpSREY+PGNjOldvcmsKICAgICAgICAgcmRmOmFib3V0PSIiPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz48L2NjOldvcms+PC9yZGY6UkRGPjwvbWV0YWRhdGE+PGRlZnMKICAgICBpZD0iZGVmczYiPjxjbGlwUGF0aAogICAgICAgaWQ9ImNsaXBQYXRoMTYiCiAgICAgICBjbGlwUGF0aFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGgKICAgICAgICAgaWQ9InBhdGgxOCIKICAgICAgICAgZD0ibSAwLDE2MS44NzMgMTYxLjk0NiwwIEwgMTYxLjk0NiwwIDAsMCAwLDE2MS44NzMgWiIgLz48L2NsaXBQYXRoPjwvZGVmcz48ZwogICAgIHRyYW5zZm9ybT0ibWF0cml4KDEuMjUsMCwwLC0xLjI1LDAsMjAyLjM0MTI1KSIKICAgICBpZD0iZzEwIj48ZwogICAgICAgaWQ9ImcxMiI+PGcKICAgICAgICAgY2xpcC1wYXRoPSJ1cmwoI2NsaXBQYXRoMTYpIgogICAgICAgICBpZD0iZzE0Ij48ZwogICAgICAgICAgIHRyYW5zZm9ybT0idHJhbnNsYXRlKDUyLjQ0NzcsODguMTI2OCkiCiAgICAgICAgICAgaWQ9ImcyMCI+PHBhdGgKICAgICAgICAgICAgIGlkPSJwYXRoMjIiCiAgICAgICAgICAgICBzdHlsZT0iZmlsbDojMDAwMDAwO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpub256ZXJvO3N0cm9rZTpub25lIgogICAgICAgICAgICAgZD0ibSAwLDAgYyAwLDcuNiA2LjE3OSwxMy43NzkgMTMuNzcsMTMuNzc5IDcuNiwwIDEzLjc3OSwtNi4xNzkgMTMuNzc5LC0xMy43NzkgMCwtMi43NjkgLTIuMjM4LC01LjAwNyAtNC45OTgsLTUuMDA3IC0yLjc2MSwwIC00Ljk5OSwyLjIzOCAtNC45OTksNS4wMDcgMCwyLjA3OCAtMS42OTUsMy43NjUgLTMuNzgyLDMuNzY1IEMgMTEuNjkzLDMuNzY1IDkuOTk3LDIuMDc4IDkuOTk3LDAgOS45OTcsLTIuNzY5IDcuNzYsLTUuMDA3IDQuOTk5LC01LjAwNyAyLjIzOCwtNS4wMDcgMCwtMi43NjkgMCwwIG0gNTcuMDUsLTIzLjE1MyBjIDAsLTIuNzcxIC0yLjIzNywtNS4wMDcgLTQuOTk4LC01LjAwNyBsIC00Ni4zNzgsMCBjIC0yLjc2MSwwIC00Ljk5OSwyLjIzNiAtNC45OTksNS4wMDcgMCwyLjc2OSAyLjIzOCw1LjAwNyA0Ljk5OSw1LjAwNyBsIDQ2LjM3OCwwIGMgMi43NjEsMCA0Ljk5OCwtMi4yMzggNC45OTgsLTUuMDA3IE0gMzUuMzc5LC0yLjgwNSBjIC0xLjU0NSwyLjI5MSAtMC45NDEsNS4zOTggMS4zNSw2Ljk0MyBsIDExLjU5NCw3LjgzIGMgMi4yNzMsMS41OCA1LjM5OCwwLjk0MSA2Ljk0MywtMS4zMzIgMS41NDUsLTIuMjkgMC45NDEsLTUuMzk4IC0xLjM1LC02Ljk0MyBsIC0xMS41OTQsLTcuODMgYyAtMC44NTIsLTAuNTg2IC0xLjgyOSwtMC44NyAtMi43ODgsLTAuODcgLTEuNjA3LDAgLTMuMTg3LDAuNzgxIC00LjE1NSwyLjIwMiBtIDMxLjc0OCwtMzAuNzg2IGMgMCwtMC45NDUgLTAuMzc2LC0xLjg1MiAtMS4wNDUsLTIuNTIyIGwgLTguNjE3LC04LjYxNyBjIC0wLjY2OSwtMC42NjggLTEuNTc2LC0xLjA0NSAtMi41MjMsLTEuMDQ1IGwgLTUyLjgzMywwIGMgLTAuOTQ3LDAgLTEuODU0LDAuMzc3IC0yLjUyMywxLjA0NSBsIC04LjYxNyw4LjYxNyBjIC0wLjY2OSwwLjY3IC0xLjA0NSwxLjU3NyAtMS4wNDUsMi41MjIgbCAwLDUyLjc5OSBjIDAsMC45NDcgMC4zNzYsMS44NTQgMS4wNDUsMi41MjIgbCA4LjYxNyw4LjYxOSBjIDAuNjY5LDAuNjY4IDEuNTc2LDEuMDQ0IDIuNTIzLDEuMDQ0IGwgNTIuODMzLDAgYyAwLjk0NywwIDEuODU0LC0wLjM3NiAyLjUyMywtMS4wNDQgbCA4LjYxNywtOC42MTkgYyAwLjY2OSwtMC42NjggMS4wNDUsLTEuNTc1IDEuMDQ1LC0yLjUyMiBsIDAsLTUyLjc5OSB6IG0gNy4zMzQsNjEuMDg2IC0xMS4yNSwxMS4yNSBjIC0xLjcwNSwxLjcwNSAtNC4wMTgsMi42NjMgLTYuNDI4LDIuNjYzIGwgLTU2LjUyMywwIGMgLTIuNDEyLDAgLTQuNzI1LC0wLjk1OSAtNi40MywtMi42NjUgTCAtMTcuNDEyLDI3LjQ5NCBjIC0xLjcwNCwtMS43MDUgLTIuNjYxLC00LjAxNiAtMi42NjEsLTYuNDI3IGwgMCwtNTYuNTE1IGMgMCwtMi40MTEgMC45NTgsLTQuNzI1IDIuNjYzLC02LjQyOCBsIDExLjI1LC0xMS4yNSBjIDEuNzA1LC0xLjcwNSA0LjAxNywtMi42NjIgNi40MjgsLTIuNjYyIGwgNTYuNTE1LDAgYyAyLjQxLDAgNC43MjMsMC45NTcgNi40MjgsMi42NjIgbCAxMS4yNSwxMS4yNSBjIDEuNzA1LDEuNzAzIDIuNjYzLDQuMDE3IDIuNjYzLDYuNDI4IGwgMCw1Ni41MTQgYyAwLDIuNDEyIC0wLjk1OCw0LjcyNCAtMi42NjMsNi40MjkiIC8+PC9nPjwvZz48L2c+PC9nPjwvc3ZnPg==';
let _ = null;
function RobotRenderer(eventBus, bpmnRenderer) {
    diagram_js_lib_draw_BaseRenderer__WEBPACK_IMPORTED_MODULE_1__.default.call(_, eventBus, 1500);
    _.canRender = function (element) {
        return (0,bpmn_js_lib_util_ModelUtil__WEBPACK_IMPORTED_MODULE_2__.is)(element, 'bpmn:ServiceTask') && element.id.match(/robot/i);
    };
    _.drawShape = function (parent, element) {
        bpmnRenderer.handlers['bpmn:Task'](parent, element);
        const gfx = (0,tiny_svg__WEBPACK_IMPORTED_MODULE_3__.create)('image', {
            x: -1,
            y: -1,
            width: 32,
            height: 32,
            href: Robot,
        });
        (0,tiny_svg__WEBPACK_IMPORTED_MODULE_3__.append)(parent, gfx);
        return gfx;
    };
}
_ = RobotRenderer;
inherits_inherits_browser__WEBPACK_IMPORTED_MODULE_0___default()(RobotRenderer, diagram_js_lib_draw_BaseRenderer__WEBPACK_IMPORTED_MODULE_1__.default);
RobotRenderer.$inject = ['eventBus', 'bpmnRenderer'];


/***/ }),

/***/ "./lib/RobotModule/index.js":
/*!**********************************!*\
  !*** ./lib/RobotModule/index.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _RobotFrameworkTask__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./RobotFrameworkTask */ "./lib/RobotModule/RobotFrameworkTask.js");

const RobotModule = {
    __init__: ['RobotFrameworkTask'],
    RobotFrameworkTask: ['type', _RobotFrameworkTask__WEBPACK_IMPORTED_MODULE_0__.default],
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (RobotModule);


/***/ }),

/***/ "./lib/index.js":
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "OutputWidget": () => (/* binding */ OutputWidget),
/* harmony export */   "rendererFactory": () => (/* binding */ rendererFactory),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lumino/widgets */ "webpack/sharing/consume/default/@lumino/widgets");
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lumino_widgets__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var bpmn_js_lib_NavigatedViewer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! bpmn-js/lib/NavigatedViewer */ "./node_modules/bpmn-js/lib/NavigatedViewer.js");
/* harmony import */ var bpmn_js_lib_features_modeling__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! bpmn-js/lib/features/modeling */ "./node_modules/bpmn-js/lib/features/modeling/index.js");
/* harmony import */ var diagram_js_lib_features_tooltips__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! diagram-js/lib/features/tooltips */ "./node_modules/diagram-js/lib/features/tooltips/index.js");
/* harmony import */ var _RobotModule__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./RobotModule */ "./lib/RobotModule/index.js");





/**
 * The default mime type for the extension.
 */
const MIME_TYPE = 'application/bpmn+xml';
/**
 * The class name added to the extension.
 */
const CLASS_NAME = 'mimerenderer-bpmn';
/**
 * A widget for rendering bpmn.
 */
class OutputWidget extends _lumino_widgets__WEBPACK_IMPORTED_MODULE_0__.Widget {
    /**
     * Construct a new output widget.
     */
    constructor(options) {
        super();
        this._mimeType = options.mimeType;
        this.addClass(CLASS_NAME);
    }
    /**
     * Render bpmn into this widget's node.
     */
    async renderModel(model) {
        try {
            let changed = false;
            let resized = false;
            if (!this._bpmn) {
                this._bpmn = new bpmn_js_lib_NavigatedViewer__WEBPACK_IMPORTED_MODULE_1__.default({
                    additionalModules: [_RobotModule__WEBPACK_IMPORTED_MODULE_2__.default, bpmn_js_lib_features_modeling__WEBPACK_IMPORTED_MODULE_3__.default, diagram_js_lib_features_tooltips__WEBPACK_IMPORTED_MODULE_4__.default],
                });
                changed = true;
            }
            if (model.data[this._mimeType] &&
                model.data[this._mimeType] !== this._xml) {
                this._xml = model.data[this._mimeType];
                await this._bpmn.importXML(this._xml);
                changed = true;
            }
            if (model.data['application/bpmn+json'] &&
                model.data['application/bpmn+json'] !== this._json) {
                this._json = model.data['application/bpmn+json'];
                changed = true;
            }
            if (this._bpmn) {
                this._bpmn.attachTo(this.node);
            }
            if (this._bpmn && changed) {
                const config = JSON.parse(model.data['application/bpmn+json'] || '{}');
                if (config.style) {
                    for (const name of Object.keys(config.style)) {
                        this.node.style.setProperty(name, config.style[name]);
                        if (name === 'height' && config.style[name] !== this._height) {
                            this._height = config.style[name];
                            resized = true;
                        }
                    }
                }
                if (this._bpmn && config.zoom) {
                    if (config.zoom !== this._zoom) {
                        const registry = this._bpmn.get('elementRegistry');
                        if (registry.get(config.zoom)) {
                            this._bpmn.get('canvas').zoom(1.0, registry.get(config.zoom));
                        }
                        else {
                            this._bpmn.get('canvas').zoom('fit-viewport', 'auto');
                            if (config.zoom !== 'fit-viewport') {
                                this._bpmn.get('canvas').zoom(config.zoom, 'auto');
                            }
                        }
                        this._zoom = config.zoom;
                    }
                }
                else if (this._bpmn && resized) {
                    this._bpmn.get('canvas').zoom('fit-viewport', 'auto');
                }
                if (config.colors) {
                    const modeling = this._bpmn.get('modeling');
                    const registry = this._bpmn.get('elementRegistry');
                    for (const name of Object.keys(config.colors)) {
                        const colors = config.colors[name];
                        const element = registry.get(name);
                        if (element) {
                            modeling.setColor(element, colors);
                        }
                    }
                }
                const svg = await new Promise((resolve, reject) => {
                    this._bpmn.saveSVG((err, svg) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve(svg);
                        }
                    });
                });
                model.setData({
                    data: Object.assign(Object.assign({}, model.data), { 'image/svg+xml': svg }),
                    metadata: model.metadata,
                });
            }
        }
        catch (e) {
            console.warn(e);
        }
        return Promise.resolve();
    }
}
/**
 * A mime renderer factory for bpmn data.
 */
const rendererFactory = {
    safe: true,
    mimeTypes: [MIME_TYPE],
    createRenderer: (options) => new OutputWidget(options),
};
/**
 * Extension definition.
 */
const extension = {
    id: 'jupyterlab-bpmn:plugin',
    rendererFactory,
    rank: 70,
    dataType: 'string',
    fileTypes: [
        {
            name: 'bpmn',
            mimeTypes: [MIME_TYPE],
            extensions: ['.bpmn'],
        },
    ],
    documentWidgetFactoryOptions: {
        name: 'JupyterLab BPMN viewer',
        primaryFileType: 'bpmn',
        fileTypes: ['bpmn'],
        defaultFor: ['bpmn'],
    },
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (extension);


/***/ })

}]);
//# sourceMappingURL=lib_index_js-webpack_sharing_consume_default_bpmn-moddle_bpmn-moddle-webpack_sharing_consume_-64f830.fd4aa99fa4f924b1c980.js.map