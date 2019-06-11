function CJSSyntaxError(message, index, expected, found) {
    this.name = "CJSSyntaxError";
    this.message = message;
    this.stack = (new Error()).stack;
    this.index = index;
    this.expected = expected;
    this.found = found;
}
CJSSyntaxError.prototype = Error.prototype;

function CJSTypeError(message, index) {
    this.name = "CJSTypeError";
    this.message = message;
    this.stack = (new Error()).stack;
    this.index = index;
}
CJSTypeError.prototype = Error.prototype;

function CJSUnimplementedError(message, index) {
    this.name = "CJSUnimplementedError";
    this.message = message;
    this.stack = (new Error()).stack;
    this.index = index;
}
CJSUnimplementedError.prototype = Error.prototype;

function CJSInternalError(message) {
    this.name = "CJSInternalError";
    this.message = message;
    this.stack = (new Error()).stack;
}
CJSInternalError.prototype = Error.prototype;

function CJSMultiError(errors) {
    this.name = "CJSMultiError";
    this.message = errors.message.join('\n\n');
    this.errors = (errors || []);
}
CJSMultiError.prototype = Error.prototype;

function buildErrMsg(str, index) {
    var lineStart = str.lastIndexOf('\n', index) + 1,
        lineEnd = str.indexOf('\n', index),
        line = str.slice(lineStart, lineEnd),
        lineNum = (str.slice(0, lineStart).match(/\n/g)||[]).length,
        col = index - lineStart;

    if(lineNum > 1 && /^\s*$/.test(line.slice(0, col))) {
        lineEnd = lineStart - 1;
        lineStart = str.lastIndexOf('\n', lineEnd - 1) + 1;
        line = str.slice(lineStart, lineEnd);
        lineNum -= 1;
        col = lineEnd - lineStart;
    }
        
    
    return {
        location: line + ("\n" + Array(col + 1).join(" ") + "^"),
        line: lineNum + 1,
        col: col + 1,
    }
}

module.exports = {
    CJSSyntaxError: CJSSyntaxError,
    CJSTypeError: CJSTypeError,
    CJSUnimplementedError: CJSUnimplementedError,
    CJSInternalError: CJSInternalError,
    CJSMultiError: CJSMultiError,
    buildErrMsg: buildErrMsg,
}