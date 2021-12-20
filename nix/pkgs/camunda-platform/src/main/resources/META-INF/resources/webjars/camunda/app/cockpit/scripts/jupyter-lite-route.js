function ___$insertStyle(css) {
  if (!css) {
    return;
  }
  if (typeof window === 'undefined') {
    return;
  }

  var style = document.createElement('style');

  style.setAttribute('type', 'text/css');
  style.innerHTML = css;
  document.head.appendChild(style);
  return css;
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var headers = function (api) {
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': api.CSRFToken,
    };
};
var jupyterLiteRoute = [
    {
        id: 'jupyterLiteNavigation',
        pluginPoint: 'cockpit.navigation',
        properties: {
            pagePath: '#/jupyter',
            label: 'Jupyter Lite',
            priority: 1,
            checkActive: function (path) {
                return path.indexOf('#/jupyter') > -1;
            },
        }
    },
    {
        id: 'jupyterLiteRoute',
        pluginPoint: 'cockpit.route',
        properties: {
            path: '/jupyter',
            label: '/jupyter',
        },
        render: function (node, _a) {
            var api = _a.api;
            return __awaiter(void 0, void 0, void 0, function () {
                var iframe, userId, profile, displayName;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            iframe = document.createElement('iframe');
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 6, , 7]);
                            return [4 /*yield*/, fetch(api.adminApi + "/auth/user/default", {
                                    method: 'get',
                                    headers: headers(api),
                                })];
                        case 2: return [4 /*yield*/, (_b.sent()).json()];
                        case 3:
                            userId = (_b.sent())['userId'];
                            return [4 /*yield*/, fetch(api.engineApi + "/user/" + userId + "/profile", {
                                    method: 'get',
                                    headers: headers(api),
                                })];
                        case 4: return [4 /*yield*/, (_b.sent()).json()];
                        case 5:
                            profile = (_b.sent());
                            displayName = "" + profile["firstName"];
                            iframe.src = "../scripts/jupyter/lab/index.html?room=default&username=" + displayName;
                            return [3 /*break*/, 7];
                        case 6:
                            _b.sent();
                            iframe.src = '../scripts/jupyter/lab/index.html';
                            return [3 /*break*/, 7];
                        case 7:
                            iframe.style.setProperty('position', 'absolute');
                            iframe.style.setProperty('top', '0px');
                            iframe.style.setProperty('right', '0px');
                            iframe.style.setProperty('bottom', '0px');
                            iframe.style.setProperty('left', '0px');
                            iframe.style.setProperty('width', '100%');
                            iframe.style.setProperty('height', '100%');
                            iframe.setAttribute('frameBorder', '0');
                            iframe.setAttribute('width', '100%');
                            iframe.setAttribute('height', '100%');
                            node.appendChild(iframe);
                            window.addEventListener("message", function (ev) {
                                var _a, _b;
                                if ((_a = iframe.contentWindow) === null || _a === void 0 ? void 0 : _a.location.toString().startsWith(ev.origin)) {
                                    (_b = iframe.contentWindow) === null || _b === void 0 ? void 0 : _b.postMessage(api, ev.origin);
                                }
                            });
                            return [2 /*return*/];
                    }
                });
            });
        },
    },
];

export default jupyterLiteRoute;
export { headers };
