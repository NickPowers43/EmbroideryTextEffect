// Copyright 2016 Gracious Eloise, Inc. All rights reserved.

function partitionStrokeData(strokeData) {
	//alert("partitionStrokeData not implemented");
  
  var strokeVertexArrays = [];
  var currentStrokeVertexArray = {
    length: 0.0,
    vertices: []
  };
  //generate one large partition for now
  for (var i = 0; i < strokeData.length-3; i += 4) {
    var x1 = strokeData[i];
    var y1 = strokeData[i+1];
    var t1 = strokeData[i+2];
    var deltaZ1 = strokeData[i+3];

    var vertex = {
      position: new THREE.Vector3(x1, y1, 0),
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
  
  
  //alert("EmbroideryGeometry constructor not implemented");

  //partition stroke data into continuous stroke segments
  var strokes = partitionStrokeData(strokeData);
  
  var positions = [];
  
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
        positions.push(prevRightVertex.x, prevRightVertex.y, prevRightVertex.z);
        positions.push(currLeftVertex.x, currLeftVertex.y, currLeftVertex.z);
        positions.push(prevLeftVertex.x, prevLeftVertex.y, prevLeftVertex.z);
        
        positions.push(prevRightVertex.x, prevRightVertex.y, prevRightVertex.z);
        positions.push(currRightVertex.x, currRightVertex.y, currRightVertex.z);
        positions.push(currLeftVertex.x, currLeftVertex.y, currLeftVertex.z);
      }
      
      prevDir.copy(currDir);
      prevLeftVertex.copy(currLeftVertex);
      prevRightVertex.copy(currRightVertex);
      prevLeft.copy(currLeft);
    }
  }
  
  THREE.BufferGeometry.call(this);
  this.addAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
}

EmbroideryGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
