/*
 *  Editor init
 */

function getURLVars() {
  var ret = {};
  var vars = document.URL.split('?')[1];
  if(!vars) return ret;
  var kvPairs = vars.split('&');
  if(!kvPairs) return ret;
  for(var kvPair of kvPairs) {
    var [k, v] = kvPair.split('=');
    ret[k] = v;
  }
  return ret;
}

var ll_code = `struct Node {
  int key;
  Node *next;
};

struct LL {
  Node *head;

  void add(int n) {
    Node *newNode = new Node;
    newNode->key = n;
    newNode->next = NULL;
    if(!head) {
      head = newNode;
    }
    else {
      Node *tmp = head;
      while(tmp->next != NULL) {
        tmp = tmp->next;
      }
      tmp->next = newNode;
    }
  }
};

int main() {
  LL list;
  list.add(1);
  list.add(2);
  list.add(3);
}`

var binary_tree_code = `struct Node {
  int key;
  Node *left;
  Node *right;
};

struct BinaryTree {
  Node *root;

  void add(int n) {
    Node *newNode = new Node;
    newNode->key = n;
    newNode->left = NULL;
    newNode->right = NULL;
    if(!root) {
      root = newNode;
    }
    else {
      Node *tmp = root;
      while(1) {
        if(tmp->key < n) {
          if(tmp->left == NULL) {
            tmp->left = newNode;
            return 0;
          }
          tmp = tmp->left;
        }
        else {
          if(tmp->right == NULL) {
            tmp->right = newNode;
            return 0;
          }
          tmp = tmp->right;
        }
      }
    }
  }
};

int main() {
  BinaryTree tree;
  tree.add(2);
  tree.add(1);
  tree.add(3);
  tree.add(4);
}`

var default_code = `int main() {
  cout << "Hello world!";
}`

var init_code = {
  'linked-list': ll_code,
  'binary-tree': binary_tree_code,
}[getURLVars()['file']] || default_code;

var editor = ace.edit('editor');
var Range = ace.require('ace/range').Range;
editor.setTheme('ace/theme/ambiance');
editor.getSession().setMode('ace/mode/c_cpp');
editor.setShowPrintMargin(false);
editor.setValue(init_code, -1) // moves cursor to the start
var positionMarkers = [];

/*
 *  Graphical heap init
 */

var heap = new MemDrawing('heap-canvas');
// var intTyp = new ast.TypBase('int');
// var int = new ast.Lit(intTyp, 42);
// var arrTyp = new ast.TypArr(intTyp, 3);
// var arr = new ast.Lit(arrTyp, undefined);
// var objTyp = new ast.TypObj('node', [
//   new ast.ObjField('x', 'public', intTyp, undefined),
//   new ast.ObjField('arr', 'private', arrTyp, undefined),
//   new ast.ObjField('y', 'public', intTyp, undefined),
//   new ast.ObjField('arr2', 'public', arrTyp, undefined),
// ]);
// var obj = new ast.Lit(objTyp, undefined);
// var node1 = heap.addNode(1, intTyp);
// var node2 = heap.addNode(42, arrTyp);
// var node3 = heap.addNode(123, objTyp);
// heap.deleteNode(1);
// heap.updateNode(new ast.IndexAccess(new ast.MemberAccess(new ast.Deref(new ast.Lit(new ast.TypPtr(intTyp), 123)), 'arr'), new ast.Lit(intTyp, 1)), 42);

/*
 *  C-learn.js init
 */

var compiler = require('compiler');
var currentFrame = undefined;

function onAssign(v, val) {
  if(v instanceof compiler.ast.Var) {
    // currentFrame.vars[v.name].find('.function-var-value').html(val);
  }
  else {
    heap.updateNode(v, val);
  }
}

var frameList = document.getElementById('stack-frames');
function onFnCall(name, args, frame, position) {
  console.log("Position:", position)
  if(position) {
    var start = editor.session.doc.indexToPosition(position.start, 0);
    var end = editor.session.doc.indexToPosition(position.end, 0);
    positionMarkers.push(editor.session.addMarker(Range.fromPoints(start, end), 'currently-called-function', 'word'));
  }

  var newFrame = document.getElementsByClassName('template')[0];
  var newTemplate = newFrame.cloneNode(true);
  frameList.prepend(newTemplate);
  // newFrame.on('click', (e) => {
  //   e.target.classList.toggle('active');
  //   e.target.classList.remove('untouched');
  //
  //   var panel = e.target.nextElementSibling;
  //   if (panel.style.display == 'none') {
  //     panel.style.display = 'block';
  //   } else {
  //     panel.style.display = 'none';
  //   }
  // });
  //
  // var frameWalker = currentFrame;
  // while(frameWalker) {
  //   var frame_button = frameWalker.dom.children(':first');
  //   if(frame_button.hasClass('untouched') && frame_button.hasClass('active')) {
  //     frame_button.click();
  //   }
  //   frameWalker = frameWalker.prev;
  // }
  var argStr = '(' + args.join(', ') + ')'
  newFrame.getElementsByClassName('name')[0].innerHTML = name + argStr;
  // var vars = {};
  // for(var v in frame) {
  //   var newVar = $('#function-var-template').clone().css( 'display', '' ).appendTo(newFrame.find('.function-vars'));
  //   newVar.find('.function-var-name').html(v);
  //   newVar.find('.function-var-type').html(frame[v].asString());
  //   newVar.find('.function-var-value').html('unset');
  //   vars[v] = newVar;
  // }
  // if(Object.keys(frame).length == 0) {
  //   var emptyIndicator = $(document.createTextNode('No function variables')).appendTo(newFrame.find('.function-vars'));
  // }
  if(currentFrame) currentFrame.dom.classList.remove('active');
  newFrame.classList.remove('template');

  currentFrame = {
    dom: newFrame,
    vars: frame,
    prev: currentFrame,
  }
}

function onFnEnd(name, ret) {
  currentFrame.dom.classList.add('hidden');
  ((e) => setTimeout(() => e.remove(), 800))(currentFrame.dom);
  currentFrame = currentFrame.prev;
  if(currentFrame) currentFrame.dom.classList.add('active');
}

function onDynamicAllocation(typ, loc) {
  console.log('Item of type', typ, 'was allocated at:', loc);
  heap.addNode(loc, typ);
}

function onPositionChange(position) {
  while(positionMarkers.length) editor.session.removeMarker(positionMarkers.pop());
  if(!position) return;
  var start = editor.session.doc.indexToPosition(position.start, 0);
  var end = editor.session.doc.indexToPosition(position.end, 0);
  positionMarkers.push(editor.session.addMarker(Range.fromPoints(start, end), 'current-runtime-position', 'word'));
}

function onPrint(text) {
  document.getElementById('stdout').innerHTML += text.replace('\n', '<br/>');
}


var options = {
  onAssign: onAssign,
  onFnCall: onFnCall,
  onFnEnd: onFnEnd,
  onDynamicAllocation: onDynamicAllocation,
  onPrint: onPrint,
  onPositionChange: onPositionChange,
}

var program = undefined,
    editing = true,
    running = false;
function changeState(state) {
  switch(state) {
    case 'editing':
      editing = true;
      running = false;
      editor.setReadOnly(false);
      editor.setHighlightActiveLine(true);
      document.getElementById('editing-menu').classList.remove('hidden');
      document.getElementById('paused-menu').classList.add('hidden');
      document.getElementById('running-menu').classList.add('hidden');
      document.getElementById('dashboard').classList.add('hidden');
      break
    case 'paused':
      editing = false;
      running = false;
      editor.setReadOnly(true);
      editor.setHighlightActiveLine(false);
      document.getElementById('dashboard').classList.remove('hidden');
      document.getElementById('editing-menu').classList.add('hidden');
      document.getElementById('paused-menu').classList.remove('hidden');
      document.getElementById('running-menu').classList.add('hidden');
      break
    case 'running':
      editing = false;
      running = true;
      editor.setReadOnly(true);
      editor.setHighlightActiveLine(false);
      document.getElementById('dashboard').classList.remove('hidden');
      document.getElementById('editing-menu').classList.add('hidden');
      document.getElementById('paused-menu').classList.add('hidden');
      document.getElementById('running-menu').classList.remove('hidden');
      break
  }
}

function clearState() {
  onPositionChange(null);
  heap.clear();
  while(currentFrame) {
    currentFrame.dom.remove();
    currentFrame = currentFrame.prev;
  }
  program = compiler.compile(editor.getValue(), options);
}

function edit() {
  changeState('editing');
  clearState();
}

function compile() {
  changeState('paused');
  setTimeout(() => editor.resize(), 800);
  program = compiler.compile(editor.getValue(), options);
}

var positionMarker = undefined;
function step() {
  editor.session.removeMarker(positionMarker);
  if(!program.step()) return false;
  if(program.position == undefined) return true;
  // var start = editor.session.doc.indexToPosition(program.position.start, 0);
  // var end = editor.session.doc.indexToPosition(program.position.end, 0);
  // positionMarker = editor.session.addMarker(Range.fromPoints(start, end), 'current-runtime-position', 'word');
  return true;
}

function addBreakpoint() {
  markerPos = editor.session.addMarker(
    new Range(startRow, startCol, endRow, endCol), 'ace_active-line', 'word');
}

var interval = 500;
function run() {
  changeState('running');
  (function stepInterval() {
    if(running) {
      if(step()) {
        setTimeout(stepInterval, interval);
      }
    }
  })();
}

function pause() {
  changeState('paused');
}

function reset() {
  changeState('paused');
  clearState();
}

function updateAnimationSpeed(value) {
  interval = (10000 - (value * value)) / 10;
}

function init() {
  updateAnimationSpeed($('#animationSpeed').val());
  // compile()
}

init();
