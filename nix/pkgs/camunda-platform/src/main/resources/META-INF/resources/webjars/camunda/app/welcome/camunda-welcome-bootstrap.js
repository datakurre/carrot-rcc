/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership. Camunda licenses this file to you under the Apache License,
 * Version 2.0; you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

window._import=e=>import(e);const baseImportPath=document.querySelector("base").href+"../",loadConfig=async function(){const e=(await import(baseImportPath+"scripts/config.js?bust="+(new Date).getTime())).default||{};return window.camWelcomeConf=e,e}();window.__define("camunda-welcome-bootstrap",["./scripts/camunda-welcome-ui"],(function(){"use strict";loadConfig.then((e=>(e=>{var n=window.CamundaWelcomeUi;requirejs.config({baseUrl:"../../../lib"});var i=window;n.exposePackages(i),window.define=window.__define,window.require=window.__require,requirejs(["globalize"],(function(o){o(requirejs,["angular","camunda-commons-ui","camunda-bpm-sdk-js","jquery","angular-data-depend","moment","events"],i);var r=window.PLUGIN_PACKAGES||[],a=window.PLUGIN_DEPENDENCIES||[];r.forEach((function(e){var n=document.createElement("link");n.setAttribute("rel","stylesheet"),n.setAttribute("href",e.location+"/plugin.css"),document.head.appendChild(n)})),requirejs.config({packages:r,baseUrl:"../",paths:{ngDefine:"../../lib/ngDefine"}});var t=["angular","ngDefine"].concat(a.map((function(e){return e.requirePackageName})));requirejs(t,(function(i){if(e&&e.csrfCookieName&&i.module("cam.commons").config(["$httpProvider",function(n){n.defaults.xsrfCookieName=e.csrfCookieName}]),void 0!==e&&e.requireJsConfig){var o=e.requireJsConfig||{},r={};["baseUrl","paths","bundles","shim","map","config","packages","waitSeconds","context","callback","enforceDefine","xhtml","urlArgs","scriptType"].forEach((function(e){o[e]&&(r[e]=o[e])})),requirejs.config(r),requirejs(o.deps||[],(function(){i.module("cam.welcome.custom",o.ngDeps),window.define=void 0,window.require=void 0,n(a)}))}else i.module("cam.welcome.custom",[]),require([],(function(){window.define=void 0,window.require=void 0,n(a)}))}))}))})(e)))})),requirejs(["camunda-welcome-bootstrap"],(function(){}));