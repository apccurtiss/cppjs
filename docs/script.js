var state = {
  program: undefined,
  steppoints: [],
  currentState: 'editing',
}

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
  tree.add(4);
  tree.add(1);
  tree.add(3);
  tree.add(0);
  tree.add(2);
}`

var default_code = `struct Node {
  int data;
  Node *next;
};

struct LinkedList {
    Node *head = NULL;

    void addNode(int data) {
        Node *newNode = new Node;
        newNode->data = data;
        newNode->next = NULL;

        if(!head) {
            head = newNode;
        }
        else {
            Node *temp = head;
            while(temp->next != NULL) {
                temp = temp->next;
            }
            temp->next = newNode;
        }
    }

    void printList() {
      Node *temp = head;
      while(temp != NULL) {
          cout << temp->data;
          cout << endl;
          temp = temp->next;
      }
    }
};

int main() {
    LinkedList ll;
    ll.addNode(4);
    ll.addNode(2);
    ll.addNode(7);
    ll.addNode(1);
    ll.addNode(8);
    ll.addNode(9);

    ll.printList();
}`;

var init_code = {
  'linked-list': ll_code,
  'binary-tree': binary_tree_code,
}[getURLVars()['file']] || default_code;

var editor = ace.edit('editor');
editor.setOptions({
  fontSize: "16pt"
});
var Range = ace.require('ace/range').Range;
editor.setTheme('ace/theme/ambiance');
editor.getSession().setMode('ace/mode/c_cpp');
editor.setShowPrintMargin(false);
editor.setValue(init_code, -1) // moves cursor to the start
var positionMarkers = [];

var handler = function(e) {
  var editor = e.editor;
  var pos = editor.getCursorPosition();
  for(steppoint of state.steppoints) {
    if(steppoint.range.start.row <= pos.row &&
      steppoint.range.start.column <= pos.column &&
      steppoint.range.end.row >= pos.row &&
      steppoint.range.end.column >= pos.column) {
      toggleBreakpoint(steppoint);
      return;
    }
  }
}
editor.on("click", handler)

function toggleBreakpoint(steppoint) {
  if(steppoint.breakpoint) {
    editor.session.removeMarker(steppoint.breakpoint);
    steppoint.breakpoint = null;
  }
  else {
    var marker = editor.session.addMarker(steppoint.range, 'breakpoint', 'word');
    steppoint.breakpoint = marker;
  }
}

/*
 *  Graphical heap init
 */

var heap = new Heap('heap-canvas');

/*
 *  C-learn.js init
 */

var compiler = require('compiler');
var currentFrame = undefined;

function onAssign(v, val) {
  if(v instanceof compiler.ast.Var) {
    currentFrame.vars[v.name] = val;
    heap.updateNamedVars(currentFrame.vars);
  }
  heap.updateNode(v, val);
}

var frameList = document.getElementById('stack-frames');
function onFnCall(name, args, frame, position) {
  if(position) {
    var start = editor.session.doc.indexToPosition(position.start, 0);
    var end = editor.session.doc.indexToPosition(position.end, 0);
    positionMarkers.push(editor.session.addMarker(Range.fromPoints(start, end), 'currently-called-function', 'word'));
  }

  var newFrame = document.getElementsByClassName('template')[0];
  var newTemplate = newFrame.cloneNode(true);
  frameList.prepend(newTemplate);

  var argStr = '(' + args.join(', ') + ')'
  newFrame.getElementsByClassName('name')[0].innerHTML = name + argStr;
  var vars = {};
  for(var v in frame) {
    vars[v] = undefined;
  }
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
    vars: vars,
    prev: currentFrame,
  }
}

function onFnEnd(name, ret) {
  for(var v in currentFrame.vars) {
    heap.updateNode(new ast.Var(v), undefined);
  }
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
  for(var steppoint of state.steppoints) {
    if(steppoint.breakpoint && steppoint.startIndex == position.start && steppoint.endIndex == position.end) {
      changeState('paused');
    }
  }
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

function changeMenuState(...buttonStates) {
  var buttonNames = ['compile', 'edit', 'reset', 'run', 'step', 'pause', 'speed'];

  for(var i in buttonStates) {
    var classList = document.getElementById(buttonNames[i]).classList;
    if(buttonStates[i]) classList.remove('hidden');
    else classList.add('hidden')
  }
}

function changeState(newState) {
  state.currentState = newState;
  switch(newState) {
    case 'editing':
      document.getElementById('dashboard').classList.add('hidden');
      editor.setReadOnly(false);
      editor.setHighlightActiveLine(true);
      changeMenuState(true, false, false, false, false, false, false);
      break
    case 'paused':
      document.getElementById('dashboard').classList.remove('hidden');
      editor.setReadOnly(true);
      editor.setHighlightActiveLine(false);
      changeMenuState(false, true, true, true, true, false, true);
      break
    case 'running':
      document.getElementById('dashboard').classList.remove('hidden');
      editor.setReadOnly(true);
      editor.setHighlightActiveLine(false);
      changeMenuState(false, true, true, false, false, true, true);
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
  state.program = compiler.compile(editor.getValue(), options);
  for(steppoint of state.steppoints) {
    editor.session.removeMarker(steppoint.marker);
    if(steppoint.breakpoint) {
      editor.session.removeMarker(steppoint.breakpoint);
    }
  }
  state.steppoints = [];
}

function edit() {
  changeState('editing');
  clearState();
}

function displayError(err) {
  var alert = document.getElementById("alert");
  var contents = document.getElementById("alert-content");
  alert.style.display = null;
  contents.innerHTML = err.message;
  console.error(err);
}

function hideError() {
  var alert = document.getElementById("alert");
  alert.style.display = "none";
}

function compile() {
  hideError();
  try {
    state.program = compiler.compile(editor.getValue(), options);
  }
  catch(e) {
    displayError(e);
    return;
  }
  changeState('paused');
  document.getElementById('stdout').innerHTML = "<span>user@c-learn:~$ ./program</span><br/>";
  setTimeout(() => editor.resize(), 800);
  for(steppoint of state.program.steppoints) {
    var start = editor.session.doc.indexToPosition(steppoint.start, 0);
    var end = editor.session.doc.indexToPosition(steppoint.end, 0);
    var range = Range.fromPoints(start, end);
    var marker = editor.session.addMarker(range, 'steppoint', 'word');
    state.steppoints.push({ startIndex: steppoint.start, endIndex: steppoint.end, range: range, marker: marker, breakpoint: null });
  }
}

function step() {
  return state.program.step();
}

var interval = 500;
function run() {
  changeState('running');
  (function stepInterval() {
    if(state.currentState == 'running') {
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
  interval = (101 - value) * 10;
}

function togglePointers(value) {
  heap.toggleLines(value);
}

function toggleCollapsed(value) {
  heap.toggleCollapsed(value);
}

function init() {
  updateAnimationSpeed(document.getElementById('animationSpeedSlider').value);
}

init();
