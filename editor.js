var editor = ace.edit("editor");
// editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/c_cpp");
// var nodes = ["a", "b", "c"];
// var edges = [["a","b"], ["b","c"]];
// function draw() {
//   var canvas = document.getElementById('canvas');
//     var ctx = canvas.getContext('2d');
//     ctx.beginPath();
//     ctx.arc(75,75,50,0,Math.PI*2,true); // Outer circle
//     ctx.closePath();
//     ctx.stroke();
//     ctx.fillStyle = "black"; // font color to write the text with
//     ctx.font = "bold 20px serif";
//     ctx.textBaseline = "top";
//     ctx.fillText("test", 10 ,10);
// }
// draw();

var editing = true;
var program = new c_program();
$('#run').click(function(){
  editing = !editing;
  editor.setReadOnly(!editing);
  editor.setHighlightActiveLine(editing);
  $('#run').html(editing ? 'Run' : 'Edit');
  $('#step').css('display', editing ? 'none' : '');
  $('#reset').css('display', editing ? 'none' : '');
  $('#output').css('display', editing ? 'none' : '');
  $('#editor').css('height', editing ? '90%' : '62.5%');
  if(!editing) {
    program.load(editor.getValue());
  }
});

var markerPos = undefined;
$('#step').click(function(){
  var position = program.step();
  console.log(position);
  var Range = ace.require('ace/range').Range;
  if(position.start && position.end) {
    console.log("removing marker:" + markerPos)
    editor.session.removeMarker(markerPos);
    markerPos = editor.session.addMarker(
      new Range(position.start.lineNum-1, position.start.lineIndex-1, position.end.lineNum-1, position.end.lineIndex-1), "ace_active-line", "word"
    );
  }
  // $('#stack').html(program.dumpGlobals());
});

$('#reset').click(function(){
  program.reset;
});

editing = !editing;
// editor.setReadOnly(true);
editor.setHighlightActiveLine(editing);
$('#run').html(editing ? 'Run' : 'Edit');
$('#step').css('display', editing ? 'none' : '');
$('#reset').css('display', editing ? 'none' : '');
$('#output').css('display', editing ? 'none' : '');
$('#editor').css('height', editing ? '90%' : '62.5%');
