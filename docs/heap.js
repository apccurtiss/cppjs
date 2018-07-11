var ast = require('runtime').ast;

function MemDrawing(canvas) {
  var draw = SVG(canvas),
      timer = undefined;

  function getColor(node) {
    if (node instanceof ast.TypBase) {
      switch(node.typ) {
        case 'int':
          return '#66f';
        default:
          return '#555'
      }
    }
    else if(node instanceof ast.TypArr) {
      return '#ddd';
    }
    else if(node instanceof ast.TypPtr) {
      return '#948';
    }
    else if(node instanceof ast.TypObj) {
      return '#359';
    }
  }

  function generateBaseNode(typ, x, y, size) {
    var newNode = draw.circle(size).attr({ fill: getColor(typ) });
    var text = draw.text('Unset').font({anchor: 'middle', family: 'monospace'}).fill('#fff');
    var text_offset = verticalCenterOffset(text, newNode);
    return {
      typ: typ,
      svg: draw.group().add(newNode)
        .add(text.move(size/2, text_offset))
        .remember('text', text)
        .move(x, y),
    }
  }

  function generateArr(typ, x, y) {
    var borderWidth = 5,
        innerspacing = 5,
        ret = draw.group(), w = borderWidth;

    var newNode, children = [];
    for(var i = 0; i < typ.size; i++) {
      newNode = generateNode(typ.typ, w, borderWidth);
      w += newNode.bbox().width + innerspacing;
      ret.add(newNode.svg);
      children.push(newNode);
    }

    var h = newNode.bbox().height;
    var background = draw.rect(w + borderWidth - innerspacing, h + 2 * borderWidth).radius(10).attr({ fill: getColor(typ) });
    ret.add(background);
    background.back();
    return {
      typ: typ,
      svg: ret.move(x, y),
      children: children,
    }
  }

  function verticalCenterOffset(text, container) {
    return (container.bbox().height / 2) - (text.bbox().height / 2);
  }

  function generateObj(typ, x, y) {
    var borderWidth = 10,
        ret = draw.group(),
        w = 0, h = borderWidth,
        children = {};
    for(field in typ.fields) {
      var text = draw.text(field + ': ').font({anchor: 'left', family: 'sans'}).fill('#fff');
      var newNode = generateNode(typ.fields[field], text.bbox().width + borderWidth, 0);
      var text_offset = verticalCenterOffset(text, newNode.svg);
      var newField = draw.group()
        .add(text.move(0, text_offset))
        .add(newNode.svg)
        .move(borderWidth, h);
      var bbox = newField.bbox();
      h += bbox.height;
      w = bbox.width > w ? bbox.width : w;
      ret.add(newField);
      children[field] = newNode;
    }
    var background = draw.rect(w + 2 * borderWidth, h + borderWidth).radius(10).attr({ fill: getColor(typ) });
    ret.add(background);
    background.back();
    return {
      typ: typ,
      svg: ret.move(x, y),
      children: children,
    }
  }

  function generateNode(typ, x, y) {
    x = x || 0, y = y || 0;
    var baseSize = 50;
    if (typ instanceof ast.TypBase) {
      return generateBaseNode(typ, x, y, baseSize);
    }
    if (typ instanceof ast.TypPtr) {
      return generateBaseNode(typ, x, y, baseSize);
    }
    else if(typ instanceof ast.TypArr) {
      return generateArr(typ, x, y);
    }
    else if (typ instanceof ast.TypObj) {
      return generateObj(typ, x, y);
    }
    else {
      throw Error('Unknown type: ' + typ.constructor.name)
    }
  }

  var nodes = {};
  edgeSVG = draw.group();
  var edges = [];

  function nodeLookup(loc) {
    if(loc instanceof ast.Lit) {
      return nodes[loc.val];
    }
    if(loc instanceof ast.Deref) {
      return nodeLookup(loc.e1);
    }
    else if(loc instanceof ast.MemberAccess) {
      return nodeLookup(loc.e1).children[loc.field];
    }
    else if(loc instanceof ast.IndexAccess) {
      return nodeLookup(loc.e1).children[loc.index.val];
    }
    return nodes[loc];
  }

  function svgLookup(loc) {
    return nodeLookup(loc).svg;
  }

  function getGlobalPosition(node) {
    var x = node.cx(), y = node.cy();
    node = node.parent();
    while(node.type != 'svg') {
      x += node.x();
      y += node.y();
      node = node.parent();
    }
    return {
      x: x,
      y: y,
    }
  }

  dragging = undefined;
  function addNode(loc, typ) {
    function onMouseDown() {
      dragging = this;
    }
    function onMouseUp() {
      dragging = undefined;
    }
    function onMouseMove(e) {
      if(dragging) {
        dragging.dx(e.movementX);
        dragging.dy(e.movementY);
        startForce();
      }
    }
    nodes[loc] = generateNode(typ, 100, 100);
    nodes[loc].svg
      .on('mousedown', onMouseDown)
      .on('dblclick', onMouseDown)
      .on('mouseup', onMouseUp)
      .on('mouseleave', onMouseUp)
      .on('mousemove', onMouseMove)
    startForce();
  }

  function deleteNode() {
    throw Error('deleteNode unimplemented')
  }

  function applyForce(source, target) {
    const resting = 50;
    const forceconstant = 0.04;

    var s = svgLookup(source);
    var t = svgLookup(target);

    var sx = s.cx(), sy = s.cy();
    var tx = t.cx(), ty = t.cy();
    var w = (s.bbox().width + t.bbox().width) / 2;
    var h = (s.bbox().height + t.bbox().height) / 2;

    var vdist = Math.abs(sy - ty);
    var hdist = Math.abs(sx - tx);

    var hforce = vforce = 0;

    if(vdist < h + resting && hdist < w + resting && hdist < w) {
      vforce = (h + resting - vdist) * forceconstant * (sy > ty ? 1 : -1);
    }

    if(hdist < w + resting && vdist < h + resting && vdist < h) {
      hforce = (w + resting - hdist) * forceconstant * (sx > tx ? 1 : -1);
    }

    if(s != dragging) {
      s.dx(hforce).dy(vforce);
    }
    t.dx(-hforce).dy(-vforce);

    return Math.max(Math.abs(hforce), Math.abs(vforce));
  }

  function connect(source, target) {
    disconnect(source);
    var s = getGlobalPosition(svgLookup(source));
    var t = getGlobalPosition(svgLookup(target));
    var line = draw.line(s.x, s.y, t.x, t.y).stroke({ color: '#fff', width: 5 });
    edgeSVG.add(line);
    edges.push({
      source: source,
      target: target,
      svg: line,
    });
    svgLookup(source).remember('ptr', line);
    svgLookup(source).remember('target', svgLookup(target));
    startForce();
  }

  function disconnect(source) {
    var connection = svgLookup(source).remember('ptr');
    if(!connection) return;
    connection.remove();
    svgLookup(source).forget('ptr');
    svgLookup(source).forget('target');
  }

  function updateNode(loc, val) {
    console.log('Updating', loc, 'with', val)
    var node = nodeLookup(loc);
    node.svg.remember('text').text(String(val));
    if(node.typ instanceof ast.TypPtr && val != 0) {
      connect(loc, new ast.Lit(new ast.TypPtr(node.typ), val));
    }
  }

  function startForce() {
    const stopthreshold = 2;
    if(!timer) {
      timer = setInterval(function(){
        var max = 0;//applyForce(i, j);
        for(i in nodes) {
          for(j in nodes) {
            if(i > j) {
              var force = applyForce(i, j);
              max = force > max ? force : max;
            }
          }
        }
        for(edge of edges) {
          var sc = getGlobalPosition(svgLookup(edge.source));
              tc = getGlobalPosition(svgLookup(edge.target));
          edge.svg.attr('x1', (sc.x))
                  .attr('y1', (sc.y))
                  .attr('x2', (tc.x))
                  .attr('y2', (tc.y));
        }
        if(max < stopthreshold) {
          clearInterval(timer);
          timer = undefined;
        }
      }, 16);
    };
  }

  this.addNode = addNode;
  this.deleteNode = deleteNode;
  this.updateNode = updateNode;
}
