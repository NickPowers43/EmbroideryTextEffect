// Copyright 2016 Gracious Eloise, Inc. All rights reserved.

var EmbroideryMesh = function(options) {
  var strokeData = options.strokeData;
  var lineWidth = options.lineWidth;

  // The following options are exposed so that they can be adjusted from the
  // testbed. Most callers probably don't want to change these.
  var speed = options.speed || 2;
  var spacing = options.spacing || 0.5;
  var thickness = options.thickness || 0.8;

  var internalClock = new THREE.Clock(false);
  
  
}

EmbroideryMesh.prototype = Object.create(THREE.Group.prototype);
