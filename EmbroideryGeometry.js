// Copyright 2016 Gracious Eloise, Inc. All rights reserved.

function partitionStrokeData(strokeData) {
	//alert("partitionStrokeData not implemented");
}

var EmbroideryGeometry = function(options) {
  var strokeData = options.strokeData;
  var lineWidth = options.lineWidth;
  
  //alert("EmbroideryGeometry constructor not implemented");

  //partition stroke data into continuous stroke segments
  var strokes = partitionStrokeData(strokeData);
  
  var positions = [0, 0, 0, 1, 0, 0, 1, 1, 0];
  
  THREE.BufferGeometry.call(this);
  this.addAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
}

EmbroideryGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
