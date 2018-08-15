var compiler = require('compiler');
var ast = compiler.ast;
var initMemory = compiler.initMemory;

function MemDrawing(canvas) {
  const draw = SVG(canvas),
        globalBackground = draw.rect('100%', '100%').fill('#222'),
        edgeSVG = draw.group(),
        options = {
          restingDistance: 20,
          forceConstant: 0.4,
          minLabelWidth: 30,
          baseWidth: 50,
          baseHeight: 30,
        };

  var timer = undefined,
      dragging = undefined,
      nodes = {},
      edges = [];

  function Node(component, loc) {
    var addr = draw.text('0x' + loc.toString(16)).font({anchor: 'left', family: 'monospace'}).fill('#fff').move(5, 0).opacity(0);
    var componentSVG = component.svg.move(0, addr.bbox().height).opacity(0)
    var background = draw.rect(50, 1).radius(10).attr({ fill: '#1b8db2' });
    var expandIcon = undefined;

    var svg = draw.group().add(background).add(addr).add(componentSVG).style('cursor', 'pointer');
    background.animate(200, '>', 0).size(50, 50);
    addr.animate(200, '>', 0).opacity(1);

    function onMouseDown() { dragging = this; }
    function onMouseUp() { dragging = undefined; }
    function onMouseMove(e) {
      if(dragging) {
        dragging.dx(e.movementX);
        dragging.dy(e.movementY);
        startForce();
      }
    }
    var toggleCollapsed = () => {
      this.collapsed = !this.collapsed;
      if(this.collapsed) {
        componentSVG.animate(200, '>', 0).opacity(0)
        background.animate(200, '>', 200).size(50, 50)
      }
      else {
        background.animate(200, '<', 0).size(componentSVG.bbox().width, componentSVG.bbox().height)
        componentSVG.animate(200, '<', 200).opacity(1)
      }
      // Update the edges for the ~0.4 seconds of animation
      var timesRun = 0;
      var interval = setInterval(function(){
        if(timesRun++ == 24) clearInterval(interval);
        updateEdges();
      }, 17);
    }
    this.component = component;
    this.background = background;
    this.collapsed = true;
    this.edges = [];
    this.svg = svg
      .on('mousedown', onMouseDown)
      .on('dblclick', toggleCollapsed)
      .on('mouseup', onMouseUp)
      .on('mouseleave', onMouseUp)
      .on('mousemove', onMouseMove);

    toggleCollapsed();
  }

  function getColor(node) {
    if (node instanceof ast.TypBase)
      return '#1b8db2';
    else if(node instanceof ast.TypPtr)
      return '#005774';
    else if(node instanceof ast.TypArr || node instanceof ast.TypObj)
      return '#233237';
  }

  function verticalCenterOffset(text, container) {
    return (container.bbox().height / 2) - (text.bbox().height / 2);
  }

  function horizontalCenterOffset(text, container) {
    return (container.bbox().width / 2) - (text.bbox().width / 2);
  }

  function makeLabel(text) {
    var padding = 4;
    var label = draw.text(text).font({anchor: 'left', family: 'sans', size: 12})
      .fill('#fff').move(padding, padding);
    var labelBox = label.bbox();
    var background = draw.rect(
      Math.max(labelBox.width, options.minLabelWidth) + 2 * padding,
      labelBox.height + 2 * padding)
      .stroke('#fff').radius(padding).attr({ fill: '#1b8db2' });
    return draw.group().add(background).add(label);
  }

  function buildComponent(typ) {
    var baseBorder = 7;

    if (typ instanceof ast.TypBase || typ instanceof ast.TypPtr) {
      var newComponent = draw.rect(options.baseWidth, options.baseHeight).radius(10).attr({ fill: getColor(typ) });
      var text = draw.text('???').font({anchor: 'middle', family: 'monospace'}).fill('#fff');
      var text_offset = verticalCenterOffset(text, newComponent);
      return {
        typ: typ,
        line: undefined,
        svg: draw.group().add(newComponent)
          .add(text.move(options.baseWidth/2, text_offset))
          .remember('text', text),
      }
    }
    else if(typ instanceof ast.TypArr) {
      var borderWidth = 5,
          innerspacing = 5,
          ret = draw.group(), w = borderWidth;

      var children = [];
      for(var i = 0; i < typ.size; i++) {
        var newComponent = buildComponent(typ.typ);
        var componentBox = newComponent.svg.bbox();
        // var label = makeLabel(String(i)).move(w, componentBox.height - borderWidth);
        newComponent.svg.move(w, borderWidth);
        w += componentBox.width + innerspacing;
        // ret.add(draw.group().add(newComponent.svg).add(label));
        ret.add(newComponent.svg);
        children.push(newComponent);
      }

      var h = newComponent.svg.bbox().height;
      var background = draw.rect(w + borderWidth - innerspacing, h + 2 * borderWidth).stroke('#1b8db2').radius(10).attr({ fill: getColor(typ) });
      ret.add(background);
      background.back();
      return {
        typ: typ,
        svg: ret,
        children: children,
      }
    }
    else if (typ instanceof ast.TypObj) {
      var borderWidth = 10,
          spacing = 5,
          ret = draw.group(),
          maxTextSize = 0,
          maxWidth = 0, h = borderWidth,
          children = {};
      for(field of typ.fields) {
        var text = makeLabel(field.name);//draw.text(field.name + ': ').font({anchor: 'left', family: 'sans'}).fill('#fff');
        maxTextSize = text.bbox().width > maxTextSize ? text.bbox().width : maxTextSize;
        var newComponent = buildComponent(field.typ);
        var newField = draw.group()
          .add(newComponent.svg.move(spacing, text.bbox().height - baseBorder))
          .add(text)
          .move(borderWidth, h);
        var bbox = newField.bbox();
        h += bbox.height + spacing;
        maxWidth = bbox.width > maxWidth ? bbox.width : maxWidth;
        ret.add(newField);
        children[field.name] = newComponent;
      }
      var background = draw.rect(maxWidth + 2 * borderWidth, h + borderWidth).stroke('#1b8db2').radius(10).attr({ fill: getColor(typ) });
      ret.add(background);
      background.back();
      return {
        typ: typ,
        svg: ret,
        children: children,
      }
    }
    else {
      throw Error('Unknown type: ' + typ.constructor.name)
    }
  }

  function containingNodeLookup(lVal) {
    if(lVal instanceof ast.Deref) {
      if(lVal.e1 instanceof ast.Lit) {
        return nodes[lVal.e1.val];
      }
      return containingNodeLookup(lVal.e1);
    }
    else if(lVal instanceof ast.MemberAccess) {
      return containingNodeLookup(lVal.e1);
    }
    else if(lVal instanceof ast.IndexAccess) {
      return containingNodeLookup(lVal.e1);
    }
    else {
      throw Error('Location was not valid lvalue. Must be a dereference, member access, or index access.')
    }
  }

  function componentLookup(lVal) {
    if(lVal instanceof ast.Deref) {
      if(lVal.e1 instanceof ast.Lit) {
        return nodes[lVal.e1.val].component;
      }
      return componentLookup(lVal.e1);
    }
    else if(lVal instanceof ast.MemberAccess) {
      return componentLookup(lVal.e1).children[lVal.field];
    }
    else if(lVal instanceof ast.IndexAccess) {
      return componentLookup(lVal.e1).children[lVal.index.val];
    }
    else {
      throw Error('Location was not valid lvalue. Must be a dereference, member access, or index access.')
    }
  }

  function svgLookup(loc) {
    return componentLookup(loc).svg;
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

  var lastAdded = null;
  function addNode(loc, typ) {
    var component = buildComponent(typ);
    var node = new Node(component, loc);
    if(lastAdded) node.svg.move(lastAdded.svg.x() + lastAdded.svg.bbox().width + options.restingDistance, lastAdded.svg.y());
    else node.svg.move(40, 40);
    nodes[loc] = lastAdded = node;
    startForce();
    return node;
  }

  function deleteNode() {
    throw Error('deleteNode unimplemented')
  }

  function applyForce(source, target) {
    const sBackground = nodes[source].background,
          tBackground = nodes[target].background,
          sContents = nodes[source].svg,
          tContents = nodes[target].svg,
          maxW = document.getElementById('heap-canvas').clientWidth,
          maxH = document.getElementById('heap-canvas').clientHeight;

    var sx = sContents.x() + sBackground.cx(), sy = sContents.y() + sBackground.cy();
    var tx = tContents.x() + tBackground.cx(), ty = tContents.y() + tBackground.cy();
    var w = (sBackground.bbox().width + tBackground.bbox().width) / 2;
    var h = (sBackground.bbox().height + tBackground.bbox().height) / 2;

    var vDist = Math.abs(sy - ty), minVDist = h + options.restingDistance;
    var hDist = Math.abs(sx - tx), minHDist = w + options.restingDistance;

    var hforce = vforce = 0;

    function move(e, fx, fy) {
      var x = e.x(), y = e.y();
      var box = e.bbox();
      if(x + fx < 0) e.x(0)
      else if(x + fx + box.width > maxW) e.x(maxW - box.width)
      else e.dx(fx)

      if(y + fy < 0) e.y(0)
      else if(y + fy + box.height > maxH) e.y(maxH - box.height)
      else e.dy(fy);
    }

    if(hDist < minHDist && vDist < minVDist && vDist < h) {
      hforce = (minHDist - hDist) * options.forceConstant * (sx > tx ? 1 : -1);
    }
    else if(vDist < minVDist && hDist < minHDist && hDist < w) {
      vforce = (minVDist - vDist) * options.forceConstant * (sy > ty ? 1 : -1);
    }


    if(sContents != dragging) {
      move(sContents, hforce, vforce)
    }
    if(tContents != dragging) {
      move(tContents, -hforce, -vforce)
    }

    return Math.max(Math.abs(hforce), Math.abs(vforce));
  }

  function closestPointOnBBoxEdge(sx, sy, tx, ty, tBox, dist) {
    const slope = (ty - sy) / (tx - sx),
          theta = Math.atan(slope),
          boxW = dist + tBox.width / 2,
          boxH = dist + tBox.height / 2,
          distX = Math.abs(tx - sx),
          distY = Math.abs(ty - sy);
          cornerCorrection = Math.sin(Math.PI/4);

    if(distX > distY) {
      var dx = sx > tx ? boxW : -boxW,
          dy = (sx > tx ? boxH : -boxH) * Math.sin(theta) / cornerCorrection;
    }
    else {
      var dx = (sx > tx ? boxW : -boxW) * Math.cos(theta) / cornerCorrection,
          dy = sy > ty ? boxH : -boxH;
    }

    const endX = tx + dx,
          endY = ty + dy,
          arrowBaseX = endX + Math.cos(theta) * (sx > tx ? 10 : -10),
          arrowBaseY = endY + Math.sin(theta) * (sx > tx ? 10 : -10),
          arrowPerpAngle = theta - Math.PI/2;
          arrowLegsDx = Math.cos(arrowPerpAngle) * 5,
          arrowLegsDy = Math.sin(arrowPerpAngle) * 5;
          // arrowCornerDx =


    return {
      x: (endX + arrowBaseX) / 2,
      y: (endY + arrowBaseY) / 2,
      arrow: {
        xt: endX,
        yt: endY,
        xl: arrowBaseX - arrowLegsDx,
        yl: arrowBaseY - arrowLegsDy,
        xr: arrowBaseX + arrowLegsDx,
        yr: arrowBaseY + arrowLegsDy,
      },
    }
  }

  function drawLine(sourceSVG, targetSVG) {
    var lineStart = getGlobalPosition(sourceSVG);
    var targetCenter = getGlobalPosition(targetSVG);
    var lineEnd = closestPointOnBBoxEdge(lineStart.x, lineStart.y, targetCenter.x, targetCenter.y, targetSVG.bbox(), 5);
    var line = draw.line(lineStart.x, lineStart.y, lineEnd.x, lineEnd.y).stroke({ color: '#fff', width: 2 });
    var arrow = draw.polygon([[lineEnd.arrow.xt, lineEnd.arrow.yt], [lineEnd.arrow.xr, lineEnd.arrow.yr], [lineEnd.arrow.xl, lineEnd.arrow.yl]]).fill('#fff');
    var ret = draw.group().add(line).add(arrow);
    edgeSVG.add(ret);
    return ret;
  }

  function connect(source, target) {
    var sourceComponent = componentLookup(source);
    var sourceNode = containingNodeLookup(source);
    // console.log(source, sourceNode)
    // console.log(target, targetNode)
    var targetNode = containingNodeLookup(target);

    if(sourceComponent.line) {
      sourceComponent.line.remove();
    }

    var line = drawLine(sourceNode.background, targetNode.background);
    edges.push({
      source: sourceNode.background,
      target: targetNode.background,
      svg: line,
    });
    startForce();
  }

  function updateNode(lVal, val) {
    // console.log('Updating', lVal, 'with', val)
    var component = componentLookup(lVal);
    var text = component.typ instanceof ast.TypPtr ? '0x' + val.toString(16) : String(val);
    component.svg.remember('text').text(text);
    if(component.typ instanceof ast.TypPtr && val != 0) {
      connect(lVal, new ast.Deref(new ast.Lit(new ast.TypPtr(component.typ), val), component.typ));
    }
  }

  function updateNodes() {
    var max = 0;
    for(var i in nodes) {
      for(var j in nodes) {
        if(i < j) {
          var force = applyForce(i, j);
          max = Math.max(force, max);
        }
      }
    }
    return max;
  }

  function updateEdges() {
    for(var e of edges) {
      e.svg.remove();
      e.svg = drawLine(e.source, e.target);
    }
  }

  function startForce() {
    const stopthreshold = 2;
    if(!timer) {
      timer = setInterval(function(){
        var max = updateNodes();
        updateEdges();
        if(max < stopthreshold) {
          clearInterval(timer);
          timer = undefined;
        }
      }, 16);
    };
  }

  function clear() {
    draw.clear();
    edges = [];
    nodes = [];
    lastAdded = undefined;
  }

  this.clear = clear;
  this.addNode = addNode;
  this.deleteNode = deleteNode;
  this.updateNode = updateNode;
}
