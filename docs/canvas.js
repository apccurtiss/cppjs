function Node(x, y, label) {
  this.r = 30;
  this.x = x || 0;
  this.y = y || 0;
  this.label = label || '';
}

function Edge(n1, n2, label) {
  this.n1 = n1;
  this.n2 = n2;
  this.label = label || '';
}

// Draws this node to a given context
Node.prototype.draw = function(ctx) {
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
  ctx.fillStyle = 'grey';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#003300';
  ctx.stroke();
  ctx.font = "20px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline="middle";
  ctx.fillText(this.label, this.x, this.y);
}

Edge.prototype.draw = function(ctx, nodes) {
  ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 5;
  var n1 = nodes[this.n1];
  var n2 = nodes[this.n2];
  if(n1 == undefined || n2 == undefined) {
    return;
  }
  var slope = (n1.y - n2.y)/(n1.x - n2.x);
  var theta = Math.atan(slope);
  var arrowEnd = n1.x < n2.x ? -(n2.r + 5) : (n2.r + 5);
  var arrowLen = n1.x < n2.x ? -50 : 50;
  ctx.moveTo(n1.x, n1.y);
  ctx.lineTo(n2.x + Math.cos(theta) * arrowEnd, n2.y + Math.sin(theta) * arrowEnd);
  ctx.lineTo(n2.x - Math.cos(theta - 2.9) * arrowLen, n2.y - Math.sin(theta - 2.9) * arrowLen);
  ctx.moveTo(n2.x + Math.cos(theta) * arrowEnd, n2.y + Math.sin(theta) * arrowEnd);
  ctx.lineTo(n2.x - Math.cos(theta + 2.9) * arrowLen, n2.y - Math.sin(theta + 2.9) * arrowLen);
  ctx.stroke();
}

Node.prototype.contains = function(mx, my) {
  return  this.r >= Math.sqrt(Math.pow(this.x - mx, 2) + Math.pow(this.y - my, 2));
}

function CanvasState(canvas) {
  // **** First some setup! ****

  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.ctx = canvas.getContext('2d');
  // This complicates things a little but but fixes mouse co-ordinate problems
  // when there's a border or padding. See getMouse for more detail
  var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
  if (document.defaultView && document.defaultView.getComputedStyle) {
    this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
    this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
    this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
    this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  }
  // Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
  // They will mess up mouse coordinates and this fixes that
  var html = document.body.parentNode;
  this.htmlTop = html.offsetTop;
  this.htmlLeft = html.offsetLeft;

  // **** Keep track of state! ****

  this.valid = false; // when set to false, the canvas will redraw everything
  this.nodes = [];  // the collection of things to be drawn
  this.edges = [];  // the collection of things to be drawn
  this.dragging = false; // Keep track of when we are dragging
  // the current selected object. In the future we could turn this into an array for multiple selection
  this.selection = null;
  this.dragoffx = 0; // See mousedown and mousemove events for explanation
  this.dragoffy = 0;

  // **** Then events! ****

  // This is an example of a closure!
  // Right here "this" means the CanvasState. But we are making events on the Canvas itself,
  // and when the events are fired on the canvas the variable "this" is going to mean the canvas!
  // Since we still want to use this particular CanvasState in the events we have to save a reference to it.
  // This is our reference!
  var myState = this;

  //fixes a problem where double clicking causes text to get selected on the canvas
  canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
  // Up, down, and move are for dragging
  canvas.addEventListener('mousedown', function(e) {
    var mouse = myState.getMouse(e);
    var mx = mouse.x;
    var my = mouse.y;
    var nodes = myState.nodes;
    var l = nodes.length;
    for (var i = l-1; i >= 0; i--) {
      if (nodes[i].contains(mx, my)) {
        var mySel = nodes[i];
        // Keep track of where in the object we clicked
        // so we can move it smoothly (see mousemove)
        myState.dragoffx = mx - mySel.x;
        myState.dragoffy = my - mySel.y;
        myState.dragging = true;
        myState.selection = mySel;
        myState.valid = false;
        return;
      }
    }
    // havent returned means we have failed to select anything.
    // If there was an object selected, we deselect it
    if (myState.selection) {
      myState.selection = null;
      myState.valid = false; // Need to clear the old selection border
    }
  }, true);
  canvas.addEventListener('mousemove', function(e) {
    if (myState.dragging){
      var mouse = myState.getMouse(e);
      // We don't want to drag the object by its top-left corner, we want to drag it
      // from where we clicked. Thats why we saved the offset and use it here
      myState.selection.x = mouse.x - myState.dragoffx;
      myState.selection.y = mouse.y - myState.dragoffy;
      myState.valid = false; // Something's dragging so we must redraw
    }
  }, true);
  canvas.addEventListener('mouseup', function(e) {
    myState.dragging = false;
  }, true);
  // double click for making new nodes
  // canvas.addEventListener('dblclick', function(e) {
  //   var mouse = myState.getMouse(e);
  //   myState.addNode(new Node(mouse.x - 10, mouse.y - 10, 20, 20, 'rgba(0,255,0,.6)'));
  // }, true);

  // **** Options! ****

  this.selectionColor = '#CC0000';
  this.selectionWidth = 2;
  this.interval = 30;
  setInterval(function() { myState.draw(); }, myState.interval);
}

CanvasState.prototype.addNode = function(node) {
  this.nodes.push(node);
  this.valid = false;
}

CanvasState.prototype.addEdge = function(edge) {
  this.edges.push(edge);
  this.valid = false;
}

CanvasState.prototype.clearNodes = function() {
  this.nodes = [];
  this.valid = false;
}

CanvasState.prototype.clearEdges = function() {
  this.edges = [];
  this.valid = false;
}

CanvasState.prototype.setNodes = function(nodes) {
  this.nodes = nodes;
  this.valid = false;
}

CanvasState.prototype.setEdges = function(edges) {
  this.edges = edges;
  this.valid = false;
}

CanvasState.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
}

CanvasState.prototype.resize = function(w, h) {
  this.width = w; this.height = h;
}

// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
CanvasState.prototype.draw = function() {
  // if our state is invalid, redraw and validate!
  if (!this.valid) {
    var ctx = this.ctx;
    var nodes = this.nodes;
    var edges = this.edges;
    this.clear();

    // draw all edges
    var l = edges.length;
    for (var i = 0; i < l; i++) {
      edges[i].draw(ctx, nodes);
    }

    // draw all nodes
    l = nodes.length;
    for (var i = 0; i < l; i++) {
      var node = nodes[i];
      // We can skip the drawing of elements that have moved off the screen:
      if (node.x - node.r > this.width || node.y - node.r > this.height ||
          node.x + node.r < 0          || node.y + node.r < 0) continue;
      nodes[i].draw(ctx);
    }

    // draw selection
    // right now this is just a stroke along the edge of the selected Node
    if (this.selection != null) {
      ctx.strokeStyle = this.selectionColor;
      ctx.lineWidth = this.selectionWidth;
      var mySel = this.selection;
      ctx.beginPath();
      ctx.arc(mySel.x, mySel.y, mySel.r, 0, 2 * Math.PI, false);
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#AA0000';
      ctx.stroke();
      // ctx.endPath();
    }

    // ** Add stuff you want drawn on top all the time here **

    this.valid = true;
  }
}


// Creates an object with x and y defined, set to the mouse position relative to the state's canvas
// If you wanna be super-correct this can be tricky, we have to worry about padding and borders
CanvasState.prototype.getMouse = function(e) {
  var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;

  // Compute the total offset
  if (element.offsetParent !== undefined) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
    } while ((element = element.offsetParent));
  }

  // Add padding and border style widths to offset
  // Also add the <html> offsets in case there's a position:fixed bar
  offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
  offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

  mx = e.pageX - offsetX;
  my = e.pageY - offsetY;

  // We return a simple javascript object (a hash) with x and y defined
  return {x: mx, y: my};
}
