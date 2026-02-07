"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/universal-user-agent";
exports.ids = ["vendor-chunks/universal-user-agent"];
exports.modules = {

/***/ "(action-browser)/./node_modules/universal-user-agent/index.js":
/*!****************************************************!*\
  !*** ./node_modules/universal-user-agent/index.js ***!
  \****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   getUserAgent: () => (/* binding */ getUserAgent)\n/* harmony export */ });\nfunction getUserAgent() {\n  if (typeof navigator === \"object\" && \"userAgent\" in navigator) {\n    return navigator.userAgent;\n  }\n\n  if (typeof process === \"object\" && process.version !== undefined) {\n    return `Node.js/${process.version.substr(1)} (${process.platform}; ${\n      process.arch\n    })`;\n  }\n\n  return \"<environment undetectable>\";\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFjdGlvbi1icm93c2VyKS8uL25vZGVfbW9kdWxlcy91bml2ZXJzYWwtdXNlci1hZ2VudC9pbmRleC5qcyIsIm1hcHBpbmdzIjoiOzs7O0FBQU87QUFDUDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxzQkFBc0IsMkJBQTJCLEdBQUcsbUJBQW1CO0FBQ3ZFO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly95b3VyLWNvbnZlcnRlci13ZWIvLi9ub2RlX21vZHVsZXMvdW5pdmVyc2FsLXVzZXItYWdlbnQvaW5kZXguanM/ZjY3MiJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZnVuY3Rpb24gZ2V0VXNlckFnZW50KCkge1xuICBpZiAodHlwZW9mIG5hdmlnYXRvciA9PT0gXCJvYmplY3RcIiAmJiBcInVzZXJBZ2VudFwiIGluIG5hdmlnYXRvcikge1xuICAgIHJldHVybiBuYXZpZ2F0b3IudXNlckFnZW50O1xuICB9XG5cbiAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHByb2Nlc3MudmVyc2lvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGBOb2RlLmpzLyR7cHJvY2Vzcy52ZXJzaW9uLnN1YnN0cigxKX0gKCR7cHJvY2Vzcy5wbGF0Zm9ybX07ICR7XG4gICAgICBwcm9jZXNzLmFyY2hcbiAgICB9KWA7XG4gIH1cblxuICByZXR1cm4gXCI8ZW52aXJvbm1lbnQgdW5kZXRlY3RhYmxlPlwiO1xufVxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(action-browser)/./node_modules/universal-user-agent/index.js\n");

/***/ })

};
;