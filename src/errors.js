function CJSTypeError(message) {
    this.name = "CJSTypeError";
    this.message = (message || "");
}
CJSTypeError.prototype = Error.prototype;

function CJSMultiError(errors) {
    this.name = "CJSMultiError";
    this.message = errors.message.join('\n\n');
    this.errors = (errors || []);
}
CJSMultiError.prototype = Error.prototype;

module.exports = {
  CJSTypeError: CJSTypeError,
  CJSMultiError: CJSMultiError,
}
