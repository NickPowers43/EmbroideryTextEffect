// Copyright 2016 Gracious Eloise, Inc. All rights reserved.

function partitionStrokeData(strokeData) {
	alert("partitionStrokeData not implemented");
}

var EmbroideryGeometry = function(options) {
  var strokeData = options.strokeData;
  var lineWidth = options.lineWidth;
  
  alert("EmbroideryGeometry constructor not implemented");

  //partition stroke data into continuous stroke segments
  var strokes = partitionStrokeData(strokeData);
  
  THREE.BufferGeometry.call(this);
}

EmbroideryGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
