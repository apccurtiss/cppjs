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

 var nodes = new vis.DataSet();
 // nodes.add([
 //   {id: 1, label: 'a'},
 //   {id: 2, label: 'b', cid: 1},
 //   {id: 3, label: 'c', cid: 1}
 // ]);

var edges = new vis.DataSet();
 // var edges = [
//   {from: 1, to: 2},
//   {from: 1, to: 3},
//   {from: 2, to: 3}
// ];

var data = { nodes: nodes, edges: edges };

var container = document.getElementById('heap');

var options = {
  physics: {
    // enabled: false,
    maxVelocity: 10,
    minVelocity: 1,
    stabilization: {
      iterations: 100,
    },
  },
}

var heap = new vis.Network(container, data, options);

// var join_options = {
//   joinCondition:function(nodeOptions) {
//     return nodeOptions.cid === 1;
//   }
// }

// heap.clustering.cluster(join_options);

/*
 *  C-learn.js init
 */

var runtime = require('runtime');
var currentFrame = undefined;

function onAssign(v, val) {
  console.log(v)
  if(v instanceof runtime.ast.MemberAccess && v.field == 'next') {
    edges.add({from: v.e1.val, to: val, arrows:'to'})
  }
  else if(v instanceof runtime.ast.Var) {
    currentFrame.vars[v.name].find('.function-var-value')[0].innerHTML = val;
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
    newVar.find('.function-var-type')[0].innerHTML = frame[v].toString();
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
  nodes.add({ id: loc, label: String(loc) } );
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
