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

window._import=e=>import(e);const baseImportPath=document.querySelector("base").href+"../",loadConfig=async function(){const e=(await import(baseImportPath+"scripts/config.js?bust="+(new Date).getTime())).default||{};return window.camTasklistConf=e,e}();window.__define("camunda-tasklist-bootstrap",["./scripts/camunda-tasklist-ui"],(function(){loadConfig.then((e=>{!function(e){"use strict";var i=window.CamundaTasklistUi;requirejs.config({baseUrl:"../../../lib"});var n=window;i.exposePackages(n),window.define=window.__define,window.require=window.__require,requirejs(["globalize"],(function(a){a(requirejs,["angular","camunda-commons-ui","camunda-bpm-sdk-js","jquery","angular-data-depend"],n);var t=window.PLUGIN_PACKAGES||[],s=window.PLUGIN_DEPENDENCIES||[];t=t.filter((e=>"tasklist-plugin-tasklistPlugins"===e.name||e.name.startsWith("tasklist-plugin-legacy"))),s=s.filter((e=>"tasklist-plugin-tasklistPlugins"===e.requirePackageName||e.requirePackageName.startsWith("tasklist-plugin-legacy"))),t.forEach((function(e){var i=document.createElement("link");i.setAttribute("rel","stylesheet"),i.setAttribute("href",e.location+"/plugin.css"),document.head.appendChild(i)})),requirejs.config({packages:t,baseUrl:"../",paths:{ngDefine:"../../lib/ngDefine"}});var o=["angular","ngDefine"].concat(s.map((function(e){return e.requirePackageName})));requirejs(o,(function(n){if(window.camTasklistConf&&window.camTasklistConf.csrfCookieName&&n.module("cam.commons").config(["$httpProvider",function(e){e.defaults.xsrfCookieName=window.camTasklistConf.csrfCookieName}]),void 0!==window.camTasklistConf&&window.camTasklistConf.requireJsConfig){var a=e.requireJsConfig||{},t={};["baseUrl","paths","bundles","shim","map","config","packages","waitSeconds","context","callback","enforceDefine","xhtml","urlArgs","scriptType"].forEach((function(e){a[e]&&(t[e]=a[e])})),requirejs.config(t),requirejs(a.deps||[],(function(){n.module("cam.tasklist.custom",a.ngDeps),window.define=void 0,window.require=void 0,i(s)}))}else n.module("cam.tasklist.custom",[]),require([],(function(){window.define=void 0,window.require=void 0,i(s)}))}))}))}(e)}))})),requirejs(["camunda-tasklist-bootstrap"],(function(){}));