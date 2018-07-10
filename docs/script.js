/*
 *  Editor init
 */

var editor = ace.edit('editor');
var Range = ace.require('ace/range').Range;
editor.getSession().setMode('ace/mode/c_cpp');
editor.setShowPrintMargin(false);
// editor.setTheme('ace/theme/monokai');
// var canvas = new CanvasState(document.getElementById('canvas'));

/*
 *  Graphical heap init
 */

heap = new MemDrawing('heap');

/*
 *  C-learn.js init
 */

var runtime = require('runtime');
var currentFrame = undefined;

function onAssign(v, val) {
  console.log(v)
  if(v instanceof runtime.ast.Var) {
    currentFrame.vars[v.name].find('.function-var-value')[0].innerHTML = val;
  }
  else {
    console.log('Updating node with: ', v);
    heap.updateNode(v, val);
  }
  console.log(v, 'was assigned to:', val);
}

function onFnCall(name, frame) {
  var newFrame = $('#function-frame-template').clone().css( 'display', '' ).appendTo('#stack');
  newFrame.on('click', (e) => {
    e.target.classList.toggle('active');

    var panel = e.target.nextElementSibling;
    if (panel.style.display === 'block') {
        panel.style.display = 'none';
    } else {
        panel.style.display = 'block';
    }
  });
  // console.log(newFrame.find('.function-name'))
  newFrame.find('.function-name')[0].innerHTML = name;
  var vars = {};
  for(var v in frame) {
    var newVar = $('#function-var-template').clone().css( 'display', '' ).appendTo(newFrame.find('.function-vars'));
    newVar.find('.function-var-name')[0].innerHTML = v;
    newVar.find('.function-var-type')[0].innerHTML = frame[v].asString();
    newVar.find('.function-var-value')[0].innerHTML = 'unset';
    vars[v] = newVar;
  }

  currentFrame = {
    dom: newFrame,
    vars: vars,
    prev: currentFrame,
  }
}
function onFnEnd(name, ret) {
  // console.log(''', name, '' ended with return value:', ret);
}
function onDynamicAllocation(typ, loc) {
  console.log('Adding node:', typ, 'at location:', loc)
  heap.addNode(loc, typ);
  console.log('Item of type', typ, 'was allocated at:', loc);
}
function onPosChange(position) {
  console.log('Position changed to', position);
}
function onPrint(text) {
  document.getElementById('stdout').innerHTML += text.replace('\n', '<br/>');
}


var program = undefined;
var editing = true;
$('#compile').click(function(){
  editing = !editing;
  editor.setReadOnly(!editing);
  editor.setHighlightActiveLine(editing);
  // Adjust buttons
  $('#compile').html(editing ? 'Compile' : 'Edit');
  $('#run').css('display', editing ? 'none' : '');
  $('#step').css('display', editing ? 'none' : '');
  $('#reset').css('display', editing ? 'none' : '');
  // Adjust windows
  $('#editor').css('height', editing ? '90%' : '62.5%');
  $('#editor').css('width', !editing ? 'calc(50% - 10px)' : 'calc(100% - 10px)');
  $('#stdout').css('display', editing ? 'none' : '');
  $('#output').css('display', editing ? 'none' : '');
  $('#canvas').css('display', !editing ? '' : 'none');
  if(!editing) {
    program = new runtime.Program({
      code: editor.getValue(),
      onAssign: onAssign,
      onFnCall: onFnCall,
      onFnEnd: onFnEnd,
      onDynamicAllocation: onDynamicAllocation,
      onPrint: onPrint,
    });
  }
});

var positionMarker = undefined;
function step() {
  editor.session.removeMarker(positionMarker);
  if(!program.step()) {
    return false;
  }
  var start = editor.session.doc.indexToPosition(program.position.start, 0);
  var end = editor.session.doc.indexToPosition(program.position.end, 0);
  positionMarker = editor.session.addMarker(Range.fromPoints(start, end), 'ace_active-line', 'word');
  return true;
}

function addBreakpoint() {
  markerPos = editor.session.addMarker(
    new Range(startRow, startCol, endRow, endCol), 'ace_active-line', 'word');
}

$('#step').click(step);

var running = false;
var interval = 250;
$('#run').click(function(){
  running = !running;
  $('#run').html(running ? 'Stop' : 'Run');
  if(running) {
    (function stepInterval() {
      if(running) {
        if(step()) {
          setTimeout(stepInterval, interval);
        }
      }
    })();
  }
});

$('#compile').click();
