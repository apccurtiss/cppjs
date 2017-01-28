var editor = ace.edit("editor");
var canvas = new CanvasState(document.getElementById('canvas'));
// editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/c_cpp");
editor.setShowPrintMargin(false);

var editing = true;
var displayCanvas = true;
var program = new c_program();
$('#hide').click(function(){
  displayCanvas = !displayCanvas;
  $('#hide').html(displayCanvas ? 'Hide Data Structure' : 'Show Data Structure');
  $('#editor').css('width', displayCanvas ? 'calc(50% - 10px)' : 'calc(100% - 10px)');
  $('#canvas').css('display', displayCanvas ? '' : 'none');
});

$('#run').click(function(){
  editing = !editing;
  editor.setReadOnly(!editing);
  editor.setHighlightActiveLine(editing);
  $('#run').html(editing ? 'Run' : 'Edit');
  $('#step').css('display', editing ? 'none' : '');
  $('#reset').css('display', editing ? 'none' : '');
  $('#output').css('display', editing ? 'none' : '');
  $('#hide').css('display', editing ? 'none' : '');
  $('#editor').css('height', editing ? '90%' : '62.5%');
  $('#editor').css('width', !editing && displayCanvas ? 'calc(50% - 10px)' : 'calc(100% - 10px)');
  $('#canvas').css('display', !editing && displayCanvas ? '' : 'none');
  if(!editing) {
    program.load(editor.getValue());
  }
});

function drawDataStructure() {
  var ds = program.identifyDataStructure();
  // canvas.setEdges(ds.edges.map((e) => new Edge(e.start, e.end)))
  // canvas.setNodes(ds.nodes.map((n) => new Node(200 * Math.random(), 200 * Math.random(), n.name)))
  canvas.clearNodes();
  canvas.clearEdges();
  for(var i = 0; i < ds.nodes.length; i++) {
    canvas.addNode(new Node(100 + 100 * i, 100, ds.nodes[i].name));
  }
  for(var i = 0; i < ds.edges.length; i++) {
    canvas.addEdge(new Edge(ds.edges[i].start, ds.edges[i].end));
  }
  // console.log(ds);
}

function prettyPrintVars() {
  var str = "Variables:<br/>";
  var stack = program.dumpStack();
  for(var i = 0; i < stack.length; i++) {
    for(var j in stack[i]) {
      str += Array(i*2).join(' ') + `${j}: ` + JSON.stringify(stack[i][j]) + '<br/>';
    }
  }
  return str;
}

var markerPos = undefined;
var Range = ace.require('ace/range').Range;
$('#step').click(function(){
  var newPos = program.step();
  $('#stack').html(prettyPrintVars);
  // console.log("On:");
  // console.log(newPos.ast);
  editor.session.removeMarker(markerPos);
  markerPos = editor.session.addMarker(new Range(newPos.start.lineNum-1, newPos.start.lineIndex-1, newPos.end.lineNum-1, newPos.end.lineIndex-1), "ace_active-line", "word"
  );
  drawDataStructure();
});

$('#reset').click(function(){
  program.reset;
});

editing = !editing;
editor.setReadOnly(true);
editor.setHighlightActiveLine(editing);
document.getElementById("canvas").height = window.innerHeight * 0.625;
document.getElementById("canvas").width = window.innerWidth * 0.5 - 10.0;
canvas.resize(window.innerWidth * 0.5 - 10.0, window.innerHeight * 0.625)
$('#run').html(editing ? 'Run' : 'Edit');
$('#step').css('display', editing ? 'none' : '');
$('#reset').css('display', editing ? 'none' : '');
$('#output').css('display', editing ? 'none' : '');
$('#hide').css('display', editing ? 'none' : '');
$('#editor').css('height', editing ? '90%' : '62.5%');
$('#editor').css('width', displayCanvas ? 'calc(50% - 10px)' : 'calc(100% - 10px)');
program.load(editor.getValue());
