function trigraph(code) {
  code = code.replace(/\?\?=/g,'#');
  code = code.replace(/\?\?\//g,'\\');
  code = code.replace(/\?\?\\/g,'^');
  code = code.replace(/\?\?\(/g,'[');
  code = code.replace(/\?\?)/g,']');
  code = code.replace(/\?\?!/g,'|');
  code = code.replace(/\?\?</g,'{');
  code = code.replace(/\?\?>/g,'}');
  code = code.replace(/\?\?-/g,'~');
  return code;
}

function line_continuations(code) {
  return code.replace(/\\\n/g,'');
}

function remove_comments(code) {
  //Doesn't work yet
  return code;
}

function preprocess_tokens(code) {
  // need this one too
  return code;
}

function escape_sequences(code) {
  return code;
}

function concat_strings(code) {
  return code;
}

function preprocess(code) {
  code = trigraph(code);
  code = line_continuations(code);
  code = remove_comments(code);
  code = preproccess_tokens(code);
  code = escape_sequences(code);
  code = concat_strings(code);
  return code;
}

console.log(remove_comments(`
  //hello world?
  /* will this work? // hi
  */
  // this one shouldn't /*
  oops */
  `))
