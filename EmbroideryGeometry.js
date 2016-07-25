// Copyright 2016 Gracious Eloise, Inc. All rights reserved.

function partitionStrokeData(strokeData) {
  
  var strokeVertexArrays = [];
  var currentStrokeVertexArray = {
    length: 0.0,
    vertices: []
  };
  var prevPos;
  //generate one large partition for now
  for (var i = 0; i < strokeData.length-3; i += 4) {
    var x1 = strokeData[i];
    var y1 = strokeData[i+1];
    var t1 = strokeData[i+2];
    var deltaZ1 = strokeData[i+3];

    var vertex = {
      position: new THREE.Vector3(x1, y1, 0),
      time: t1,
    }
    
    if(currentStrokeVertexArray.length == 0.0) {
      prevPos = vertex.position;
    }
    
    currentStrokeVertexArray.vertices.push(vertex);
  }
  strokeVertexArrays.push(currentStrokeVertexArray);
  
  return strokeVertexArrays;
}

/*
* Represents a point along the stroke curve. This object can be used to
* calculate the position and tex coords of vertices.
*/
var StrokePoint = function() {
  this.dir = new THREE.Vector3();
  this.leftPosition = new THREE.Vector3();
  this.rightPosition = new THREE.Vector3();
  this.left = new THREE.Vector3();
  this.leftUV = new THREE.Vector2();
  this.rightUV = new THREE.Vector2();
  this.start = 0.0;
  this.end = 0.0;
}
StrokePoint.prototype.set = function(curr, next, lineWidthHalf) {
  this.dir.subVectors(next, curr);
  this.dir.normalize();
  this.left.set(-this.dir.y, this.dir.x, 0);
  
  this.leftPosition.copy(this.left);
  this.leftPosition.multiplyScalar(lineWidthHalf);
  this.rightPosition.copy(this.leftPosition);
  this.rightPosition.negate();
  
  this.leftPosition.add(curr);
  this.rightPosition.add(curr);
}
StrokePoint.prototype.advance = function(next) {
  this.dir.copy(next.dir);
  this.leftPosition.copy(next.leftPosition);
  this.rightPosition.copy(next.rightPosition);
  this.left.copy(next.left);
  this.leftUV.copy(next.leftUV);
  next.leftUV.x += 1.0;
  this.rightUV.copy(next.rightUV);
  next.rightUV.x += 1.0;
  this.start = next.start;
  this.end = next.end;
}

var EmbroideryGeometry = function(options) {
  var strokeData = options.strokeData;
  var lineWidth = options.lineWidth;
  var lineWidthHalf = lineWidth * 0.5;
  
  //partition stroke data into continuous stroke segments
  var strokes = partitionStrokeData(strokeData);
  
  //vertex attribute arrays
  var positions = [];
  var paths = [];
  var starts = [];
  var ends = [];
  var uvs = [];
  
  function pushVertex(position, path, start, end, uv) {
    positions.push(position.x, position.y, position.z);
    paths.push(path.x, path.y, path.z);
    starts.push(start);
    ends.push(end);
    uvs.push(uv.x, uv.y);
  }
  
  for (stroke of strokes) {
    
    //variables we will use to construct the quads of our mesh
    curr = new StrokePoint();
    curr.leftUV.set(0.0, 1.0);
    curr.rightUV.set(0.0, 0.0);
    prev = new StrokePoint();
    
    function pushQuad(){
      //create a quad using our four vertices
      pushVertex(prev.rightPosition, prev.left, prev.start, prev.end, prev.rightUV);
      pushVertex(prev.leftPosition, prev.left, prev.start, prev.end, prev.leftUV);
      pushVertex(curr.leftPosition, curr.left, curr.start, curr.end, curr.leftUV);
      
      pushVertex(prev.rightPosition, prev.left, prev.start, prev.end, prev.rightUV);
      pushVertex(curr.leftPosition, curr.left, curr.start, curr.end, curr.leftUV);
      pushVertex(curr.rightPosition, curr.left, curr.start, curr.end, curr.rightUV);
    }
    
    for(var i = 0; i < stroke.vertices.length - 2; i++) {
      
      curr.set(stroke.vertices[i+1].position, stroke.vertices[i].position, lineWidthHalf);
      
      if(i > 0) {
        pushQuad();
      }
      
      prev.advance(curr);
      
    }
  }
  
  THREE.BufferGeometry.call(this);
  this.addAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  this.addAttribute("path", new THREE.BufferAttribute(new Float32Array(paths), 3));
  this.addAttribute("start", new THREE.BufferAttribute(new Float32Array(starts), 1));
  this.addAttribute("end", new THREE.BufferAttribute(new Float32Array(ends), 1));
  this.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
}

EmbroideryGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
