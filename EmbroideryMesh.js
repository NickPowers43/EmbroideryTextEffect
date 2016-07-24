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
  
  var material = new THREE.ShaderMaterial({
    uniforms: {
      
    },
    vertexShader: `
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      void main() {
		gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }`,
    transparent: true,
  });

  var geometry = new EmbroideryGeometry({
    strokeData: strokeData,
    lineWidth: lineWidth,
  });
  
}

EmbroideryMesh.prototype = Object.create(THREE.Group.prototype);
