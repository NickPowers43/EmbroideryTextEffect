// Copyright 2016 Gracious Eloise, Inc. All rights reserved.

var Stroke = function() {
  this.length = 0.0;
  this.vertices = [];
  this.duration = 0.0;
}

function partitionStrokeData(strokeData, speed) {
  
  var strokeArray = [];
  var currentStroke = new Stroke();
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
    
    if(deltaZ1 > 0) {
      
      if(currentStroke.vertices.length > 1) {
        currentStroke.duration = currentStroke.length / speed;
        strokeArray.push(currentStroke);
      }
      currentStroke = new Stroke();
    }
  }
  currentStroke.duration = currentStroke.length / speed;
  strokeArray.push(currentStroke);
  
  return strokeArray;
}

/*
* Represents a point along the stroke curve. This object can be used to
* calculate the position and tex coords of vertices.
*/
var StrokePoint = function(start, end) {
  
  this.origin = new THREE.Vector3();
  this.origin.copy(start);
  
  this.dir = new THREE.Vector3();
  this.dir.subVectors(end, this.origin);
  this.dir.normalize();
  
  this.leftPath = new THREE.Vector3();
  this.rightPath = new THREE.Vector3();
  this.leftUV = new THREE.Vector2(0.0, 0.0);
  this.rightUV = new THREE.Vector2(1.0, 0.0);
  this.start = 0.0;
  this.end = 0.0;
  this.intensity = 0.0;
}
StrokePoint.prototype.setThickness = function(thickness) {
  this.leftPath.set(-this.dir.y, this.dir.x, 0);
  this.leftPath.multiplyScalar(thickness);
  this.rightPath.copy(this.leftPath);
  this.rightPath.multiplyScalar(-1.0);
}
StrokePoint.prototype.copy = function(src) {
  this.origin.copy(src.origin);
  this.dir.copy(src.dir);
  this.leftPath.copy(src.leftPath);
  this.rightPath.copy(src.rightPath);
  this.leftUV.copy(src.leftUV);
  this.rightUV.copy(src.rightUV);
  this.start = src.start;
  this.end = src.end;
  this.intensity = src.intensity;
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
  var intensities = [];
  
  function pushVertex(position, path, start, end, uv, intensity) {
    positions.push(position.x, position.y, position.z);
    paths.push(path.x, path.y, path.z);
    starts.push(start);
    ends.push(end);
    uvs.push(uv.x, uv.y);
    intensities.push(intensity);
  }
  function pushLeftVertexOfStrokePoint(strokePoint) {
      pushVertex(strokePoint.origin, strokePoint.leftPath, strokePoint.start, strokePoint.end, strokePoint.leftUV, strokePoint.intensity);
  }
  function pushRightVertexOfStrokePoint(strokePoint) {
      pushVertex(strokePoint.origin, strokePoint.rightPath, strokePoint.start, strokePoint.end, strokePoint.rightUV, strokePoint.intensity);
  }
  
  var divisions = 4;
  
  /*
  * Creates a mesh that form a piece of exposed
  * thread starting at "start" and ending at "end".
  */
  function makeStitch(start, end) {
    
    var inc = 1.0 / divisions;
    
    var incV = new THREE.Vector3();
    incV.subVectors(end, start);
    incV.multiplyScalar(inc);
    
    function width(v) {
      return 0.2 + (Math.sin(v * Math.PI) * 0.3);
    }
    
    function intensity(v) {
      return 0.5 + (Math.sin(v * Math.PI) * 0.5);
    }
    
    var curr = new StrokePoint(start, end);
    var prev = new StrokePoint(start, end);
    
    function pushQuad(){
      pushLeftVertexOfStrokePoint(prev);
      pushRightVertexOfStrokePoint(prev);
      pushLeftVertexOfStrokePoint(curr);
      
      pushRightVertexOfStrokePoint(prev);
      pushRightVertexOfStrokePoint(curr);
      pushLeftVertexOfStrokePoint(curr);
    }
    
    var v = 0.0;
    for(var i = 0; i < (divisions+1); i++) {
      
      curr.setThickness(width(v));
      curr.intensity = intensity(v);
      
      if(i > 0) {
        pushQuad();
      }
      
      v += inc;
      prev.copy(curr);
      curr.leftUV.y += inc;
      curr.rightUV.y += inc;
      curr.origin.add(incV);
    }
    
  }
  
  makeStitch(new THREE.Vector3(0,0,0), new THREE.Vector3(2, 0, 0));
  
  var stitchLength = 2.0;
  //samples to take for each stroke path segment
  var samples = 100;
  var stitchLengthSqr = stitchLength * stitchLength;
  
  for (stroke of strokes) {
    
    if(stroke.vertices.length > 1) {
      
      var flip = true;
      
      var origin = new THREE.Vector3();
      var prevPoint = new THREE.Vector3();
      var inc = new THREE.Vector3();
      var samplePoint = new THREE.Vector3();
      var diff = new THREE.Vector3();
      
      origin.copy(stroke.vertices[0].position);
      
      prevPoint.copy(origin);
      
      inc.subVectors(stroke.vertices[1].position, origin);
      inc.multiplyScalar(1.0 / sampleCount);
      
      samplePoint.copy(prevPoint);
      
      var vertexI = 0;
      while(vertexI < stroke.vertices.length - 2) {
        
        var sampleCount = 0;
        while(sampleCount < samples) {
          
          diff.subVectors(samplePoint, prevPoint);
          
          if(diff.lengthSq() >= stitchLengthSqr) {
            
            if(flip) {
              //make a stitch.
              makeStitch(prevPoint, samplePoint);
            }
            
            flip = !flip;
            
            prevPoint.copy(samplePoint);
          }
          
          samplePoint.add(inc);
          sampleCount += 1;
        }
        vertexI += 1;
        
        origin.copy(stroke.vertices[vertexI].position);
        inc.subVectors(stroke.vertices[vertexI+1].position, origin);
        inc.multiplyScalar(1.0 / sampleCount);
        samplePoint.copy(origin);
      }
    }
  }
  
  THREE.BufferGeometry.call(this);
  this.addAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  this.addAttribute("path", new THREE.BufferAttribute(new Float32Array(paths), 3));
  this.addAttribute("start", new THREE.BufferAttribute(new Float32Array(starts), 1));
  this.addAttribute("end", new THREE.BufferAttribute(new Float32Array(ends), 1));
  this.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
  this.addAttribute("intensity", new THREE.BufferAttribute(new Float32Array(intensities), 1));
}

EmbroideryGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
