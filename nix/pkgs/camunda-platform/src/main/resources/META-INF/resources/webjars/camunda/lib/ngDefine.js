/**
 * ngParse - utility for parsing ngDefine module definitions
 * 
 * @version 1.1.0
 * @author Nico Rehwaldt <http://github.com/Nikku>
 *
 * @license (c) 2013 Nico Rehwaldt, MIT
 */
define("ngParse",[],(function(){var e=/^module:([^:]*)(:(.*))?$/,n=/^ng/;function o(e,n,r){var i;if(e)if("function"==typeof e)for(i in e)"prototype"!=i&&"length"!=i&&"name"!=i&&e.hasOwnProperty(i)&&n.call(r,e[i],i);else if(e.forEach&&e.forEach!==o)e.forEach(n,r);else if(isArrayLike(e))for(i=0;i<e.length;i++)n.call(r,e[i],i);else for(i in e)e.hasOwnProperty(i)&&n.call(r,e[i],i);return e}return{parseNgModule:function(r,i){var t=[],l=[];return o(i,(function(o){var r=o.match(e);if(r){var i=r[1],u=r[3];u||function(e){return n.test(e)}(i)||(u=function(e){return e.replace(/\./g,"/")}(i)),l.push(i),u&&t.push(u)}else t.push(o)})),{name:r,fileDependencies:t,moduleDependencies:l}}}})),
/**
 * ngDefine - a friendly integration of AngularJS into RequireJS powered applications
 *
 * See https://github.com/Nikku/requirejs-angular-define for details.
 *
 * @version 1.1.0
 * @author Nico Rehwaldt <http://github.com/Nikku>
 *
 * @license (c) 2013 Nico Rehwaldt, MIT
 */
function(e){define("ngDefine",["angular","ngParse"],(function(n,o){function r(e){return Array.prototype.slice.call(e,0)}var i=function(i,t,u){if(!t)throw new Error("wrong number of arguments, expected name[, dependencies], body");!function(n,i,t,u){u||(u=t,t=null);var a,d,f=o.parseNgModule(i,t||[]),c=f.moduleDependencies,s=f.fileDependencies;try{n.module(i),d=!0}catch(e){d=!1}if(c.length&&d)throw new Error("Cannot re-define angular module "+i+" with new dependencies ["+c+"]. Make sure the module is not defined else where or define a sub-module with additional angular module dependencies instead.");c.length||!d?(a=n.module(i,c),l(i,"defined with dependencies",c)):(a=n.module(i),l(i,"looked up")),define(s,(function(){var n=r(arguments);return n.unshift(a),u.apply(e,n),l(i,"loaded"),a}))}(n,i,t,u)};void 0===typeof e||e.ngDefine||(e.ngDefine=i);var t,l=(Function.prototype.bind&&e.console&&e.console.log&&(t=Function.prototype.bind.call(e.console.log,e.console)),function(){if(i.debug&&t){var e=r(arguments);e.unshift("[ngDefine]"),t.apply(t,e)}});return i}))}(window);