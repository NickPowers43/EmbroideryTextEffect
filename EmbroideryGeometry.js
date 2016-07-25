// Copyright 2016 Gracious Eloise, Inc. All rights reserved.

function partitionStrokeData(strokeData, speed) {
  
  var strokeArray = [];
  var currentStroke = {
    length: 0.0,
    vertices: [],
    duration: 0.0,
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
    
    if(currentStroke.length == 0.0) {
      prevPos = vertex.position;
    } else {
      var difference = new THREE.Vector3();
      difference.subVectors(vertex.position, prevPos);
      currentStroke.length += difference.length();
      prevPos = vertex.position;
    }
    
    currentStroke.vertices.push(vertex);
  }
  currentStroke.duration = currentStroke.length / speed;
  strokeArray.push(currentStroke);
  
  return strokeArray;
}

/*
* Represents a point along the stroke curve. This object can be used to
* calculate the position and tex coords of vertices.
*/
var StrokePoint = function() {
  this.dir = new THREE.Vector3();
  this.origin = new THREE.Vector3();
  this.leftPath = new THREE.Vector3();
  this.rightPath = new THREE.Vector3();
  this.leftUV = new THREE.Vector2();
  this.rightUV = new THREE.Vector2();
  this.start = 0.0;
  this.end = 0.0;
}
StrokePoint.prototype.set = function(curr, next, thicknessHalf) {
  
  this.origin.copy(curr);
  
  this.dir.subVectors(next, this.origin);
  this.dir.normalize();
  
  this.leftPath.set(-this.dir.y, this.dir.x, 0);
  this.leftPath.multiplyScalar(thicknessHalf);
  this.rightPath.copy(this.leftPath);
  this.rightPath.multiplyScalar(-1.0);
}
StrokePoint.prototype.advance = function(next) {
  this.origin.copy(next.origin);
  this.dir.copy(next.dir);
  this.leftPath.copy(next.leftPath);
  this.rightPath.copy(next.rightPath);
  this.leftUV.copy(next.leftUV);
  next.leftUV.x += 1.0;
  this.rightUV.copy(next.rightUV);
  next.rightUV.x += 1.0;
  this.start = next.start;
  this.end = next.end;
}

var EmbroideryGeometry = function(options) {
  var strokeData = options.strokeData;
  var thickness = options.thickness;
  var thicknessHalf = thickness * 0.5;
  var speed = options.speed;
  
  //partition stroke data into continuous stroke segments
  var strokes = partitionStrokeData(strokeData, speed);
  
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
    var curr = new StrokePoint();
    var prev = new StrokePoint();
    
    curr.end = 100.0;
    curr.leftUV.set(0.0, 1.0);
    curr.rightUV.set(0.0, 0.0);
    
    function pushQuad(){
      //create a quad using our four vertices
      pushVertex(prev.origin, prev.leftPath, prev.start, prev.end, prev.leftUV);
      pushVertex(curr.origin, curr.leftPath, curr.start, curr.end, curr.leftUV);
      pushVertex(prev.origin, prev.rightPath, prev.start, prev.end, prev.rightUV);
      
      pushVertex(prev.origin, prev.rightPath, prev.start, prev.end, prev.rightUV);
      pushVertex(curr.origin, curr.leftPath, curr.start, curr.end, curr.leftUV);
      pushVertex(curr.origin, curr.rightPath, curr.start, curr.end, curr.rightUV);
    }
    
    for(var i = 0; i < stroke.vertices.length - 2; i++) {
      
      curr.set(stroke.vertices[i+1].position, stroke.vertices[i].position, thicknessHalf);
      
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
