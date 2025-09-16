"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/merge-refs";
exports.ids = ["vendor-chunks/merge-refs"];
exports.modules = {

/***/ "(ssr)/./node_modules/merge-refs/dist/index.js":
/*!***********************************************!*\
  !*** ./node_modules/merge-refs/dist/index.js ***!
  \***********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ mergeRefs)\n/* harmony export */ });\n/**\n * A function that merges React refs into one.\n * Supports both functions and ref objects created using createRef() and useRef().\n *\n * Usage:\n * ```tsx\n * <div ref={mergeRefs(ref1, ref2, ref3)} />\n * ```\n *\n * @param {(React.Ref<T> | undefined)[]} inputRefs Array of refs\n * @returns {React.Ref<T> | React.RefCallback<T>} Merged refs\n */\nfunction mergeRefs() {\n    var inputRefs = [];\n    for (var _i = 0; _i < arguments.length; _i++) {\n        inputRefs[_i] = arguments[_i];\n    }\n    var filteredInputRefs = inputRefs.filter(Boolean);\n    if (filteredInputRefs.length <= 1) {\n        var firstRef = filteredInputRefs[0];\n        return firstRef || null;\n    }\n    return function mergedRefs(ref) {\n        for (var _i = 0, filteredInputRefs_1 = filteredInputRefs; _i < filteredInputRefs_1.length; _i++) {\n            var inputRef = filteredInputRefs_1[_i];\n            if (typeof inputRef === 'function') {\n                inputRef(ref);\n            }\n            else if (inputRef) {\n                inputRef.current = ref;\n            }\n        }\n    };\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvbWVyZ2UtcmVmcy9kaXN0L2luZGV4LmpzIiwibWFwcGluZ3MiOiI7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhLDZCQUE2QjtBQUMxQztBQUNBO0FBQ0EsV0FBVyw4QkFBOEI7QUFDekMsYUFBYSxxQ0FBcUM7QUFDbEQ7QUFDZTtBQUNmO0FBQ0EscUJBQXFCLHVCQUF1QjtBQUM1QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0VBQWtFLGlDQUFpQztBQUNuRztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsiQzpcXFVzZXJzXFxOQi1TYWx0b3NcXERvY3VtZW50c1xcS29ydVxcYm9va3NoZWxmXFxub2RlX21vZHVsZXNcXG1lcmdlLXJlZnNcXGRpc3RcXGluZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IG1lcmdlcyBSZWFjdCByZWZzIGludG8gb25lLlxuICogU3VwcG9ydHMgYm90aCBmdW5jdGlvbnMgYW5kIHJlZiBvYmplY3RzIGNyZWF0ZWQgdXNpbmcgY3JlYXRlUmVmKCkgYW5kIHVzZVJlZigpLlxuICpcbiAqIFVzYWdlOlxuICogYGBgdHN4XG4gKiA8ZGl2IHJlZj17bWVyZ2VSZWZzKHJlZjEsIHJlZjIsIHJlZjMpfSAvPlxuICogYGBgXG4gKlxuICogQHBhcmFtIHsoUmVhY3QuUmVmPFQ+IHwgdW5kZWZpbmVkKVtdfSBpbnB1dFJlZnMgQXJyYXkgb2YgcmVmc1xuICogQHJldHVybnMge1JlYWN0LlJlZjxUPiB8IFJlYWN0LlJlZkNhbGxiYWNrPFQ+fSBNZXJnZWQgcmVmc1xuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBtZXJnZVJlZnMoKSB7XG4gICAgdmFyIGlucHV0UmVmcyA9IFtdO1xuICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIGlucHV0UmVmc1tfaV0gPSBhcmd1bWVudHNbX2ldO1xuICAgIH1cbiAgICB2YXIgZmlsdGVyZWRJbnB1dFJlZnMgPSBpbnB1dFJlZnMuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGlmIChmaWx0ZXJlZElucHV0UmVmcy5sZW5ndGggPD0gMSkge1xuICAgICAgICB2YXIgZmlyc3RSZWYgPSBmaWx0ZXJlZElucHV0UmVmc1swXTtcbiAgICAgICAgcmV0dXJuIGZpcnN0UmVmIHx8IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiBtZXJnZWRSZWZzKHJlZikge1xuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIGZpbHRlcmVkSW5wdXRSZWZzXzEgPSBmaWx0ZXJlZElucHV0UmVmczsgX2kgPCBmaWx0ZXJlZElucHV0UmVmc18xLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgdmFyIGlucHV0UmVmID0gZmlsdGVyZWRJbnB1dFJlZnNfMVtfaV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIGlucHV0UmVmID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgaW5wdXRSZWYocmVmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGlucHV0UmVmKSB7XG4gICAgICAgICAgICAgICAgaW5wdXRSZWYuY3VycmVudCA9IHJlZjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59XG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/merge-refs/dist/index.js\n");

/***/ })

};
;