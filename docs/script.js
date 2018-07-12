/*
 *  Editor init
 */

var editor = ace.edit('editor');
var Range = ace.require('ace/range').Range;
editor.getSession().setMode('ace/mode/c_cpp');
editor.setShowPrintMargin(false);
editor.setTheme('ace/theme/tomorrow_night_blue');

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
  if(v instanceof runtime.ast.Var) {
    console.log(v)
    currentFrame.vars[v.name].find('.function-var-value').html(val);
  }
  else {
    heap.updateNode(v, val);
  }
}

function onFnCall(name, frame) {
  var newFrame = $('#function-frame-template').clone().css( 'display', '' );
  newFrame.removeAttr('id');
  $('#stack').prepend(newFrame);
  newFrame.on('click', (e) => {
    e.target.classList.toggle('active');
    e.target.classList.remove('untouched');

    var panel = e.target.nextElementSibling;
    if (panel.style.display == 'none') {
      panel.style.display = 'block';
    } else {
      panel.style.display = 'none';
    }
  });

  var frameWalker = currentFrame;
  while(frameWalker) {
    var frame_button = frameWalker.dom.children(':first');
    if(frame_button.hasClass('untouched') && frame_button.hasClass('active')) {
      frame_button.click();
    }
    frameWalker = frameWalker.prev;
  }

  newFrame.find('.function-name').html(name);
  var vars = {};
  for(var v in frame) {
    var newVar = $('#function-var-template').clone().css( 'display', '' ).appendTo(newFrame.find('.function-vars'));
    newVar.find('.function-var-name').html(v);
    newVar.find('.function-var-type').html(frame[v].asString());
    newVar.find('.function-var-value').html('unset');
    vars[v] = newVar;
  }
  if(Object.keys(frame).length == 0) {
    var emptyIndicator = $(document.createTextNode('No function variables')).appendTo(newFrame.find('.function-vars'));
  }

  currentFrame = {
    dom: newFrame,
    vars: vars,
    prev: currentFrame,
  }
}

function onFnEnd(name, ret) {
  currentFrame.dom.remove();
  currentFrame = currentFrame.prev;
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
  // $('#editor').css('height', editing ? '90%' : '62.5%');
  // $('#editor').css('width', !editing ? 'calc(50% - 10px)' : 'calc(100% - 10px)');
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
  if(program.position == undefined) {
    return;
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

var interval = 500;
var running = false;
function run() {
  running = !running;
  console.log(this);
  $('#run').html(running ? 'Pause' : 'Run');
  if(running) {
    (function stepInterval() {
      if(running) {
        if(step()) {
          setTimeout(stepInterval, interval);
        }
      }
    })();
  }
}

function updateAnimationSpeed(value) {
  interval = (10000 - (value * value)) / 10;
}

function init() {
  updateAnimationSpeed($('#animationSpeed').val());
  $('#compile').click();
}

init();
