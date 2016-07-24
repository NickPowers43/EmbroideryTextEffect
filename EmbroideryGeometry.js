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
    }
    
    if(currentStrokeVertexArray.length == 0.0) {
      prevPos = vertex.position;
    }
    
    currentStrokeVertexArray.vertices.push(vertex);
  }
  strokeVertexArrays.push(currentStrokeVertexArray);
  
  return strokeVertexArrays;
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
  
  function pushVertex(position, path, start, end) {
    positions.push(position.x, position.y, position.z);
    paths.push(path.x, path.y, path.z);
    starts.push(start);
    ends.push(end);
  }
  
  for (stroke of strokes) {
    
    //variables we will use to construct the mesh
    var currDir = new THREE.Vector3();
    var currLeftVertex = new THREE.Vector3();
    var currRightVertex = new THREE.Vector3();
    var currLeft = new THREE.Vector3();
    var prevDir = new THREE.Vector3();
    var prevLeftVertex = new THREE.Vector3();
    var prevRightVertex = new THREE.Vector3();
    var prevLeft = new THREE.Vector3();
    
    //start the mesh for this stroke
    for(var i = 0; i < stroke.vertices.length - 2; i++) {
      
      currDir.subVectors(stroke.vertices[i+1].position, stroke.vertices[i].position);
      currDir.normalize();
      currLeft.set(-currDir.y, currDir.x, 0);
      
      currLeftVertex.copy(currLeft);
      currLeftVertex.multiplyScalar(lineWidthHalf);
      currRightVertex.copy(currLeftVertex);
      currRightVertex.negate();
      
      currLeftVertex.add(stroke.vertices[i].position);
      currRightVertex.add(stroke.vertices[i].position);
      
      if(i > 0) {
        //create a quad using our four vertices
        pushVertex(prevRightVertex, prevLeft, 0.0, 0.0);
        pushVertex(currLeftVertex, currLeft, 0.0, 0.0);
        pushVertex(prevLeftVertex, prevLeft, 0.0, 0.0);
        
        pushVertex(prevRightVertex, prevLeft, 0.0, 0.0);
        pushVertex(currRightVertex, currLeft, 0.0, 0.0);
        pushVertex(currLeftVertex, currLeft, 0.0, 0.0);
      }
      
      prevDir.copy(currDir);
      prevLeftVertex.copy(currLeftVertex);
      prevRightVertex.copy(currRightVertex);
      prevLeft.copy(currLeft);
    }
  }
  
  THREE.BufferGeometry.call(this);
  this.addAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  this.addAttribute("path", new THREE.BufferAttribute(new Float32Array(paths), 3));
  this.addAttribute("start", new THREE.BufferAttribute(new Float32Array(starts), 1));
  this.addAttribute("end", new THREE.BufferAttribute(new Float32Array(ends), 1));
}

EmbroideryGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
