// Copyright 2016 Gracious Eloise, Inc. All rights reserved.

var textureLoader = new THREE.TextureLoader();
var threadTexture = textureLoader.load("textures/thread.png");
threadTexture.wrapS = threadTexture.wrapT = THREE.RepeatWrapping;

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
      time: {
        value: 0.0
      },
      texture: {
        type: "t",
        value: threadTexture
      }
    },
    vertexShader: `
      uniform float time;
      
      attribute float start;
      attribute float end;
      attribute vec3 path;
      attribute float intensity;
      
      varying vec2 uv_;
      varying float intensity_;
      
      void main() {
        
        intensity_ = intensity;
        uv_ = vec2(uv.x, time + uv.y);
        
        vec3 offset = path;//abs(sin(uv.y)) * path;//(time > start && end > time) ? path : vec3(0,0,0);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position + offset, 1.0);
      }`,
    fragmentShader: `
      uniform sampler2D texture;
      
      varying vec2 uv_;
      varying float intensity_;
      
      void main() {
        vec4 color = texture2D(texture, uv_);
        color *= intensity_;
        color.w = 1.0;
        gl_FragColor = color;
      }`,
    transparent: true,
  });

  var geometry = new EmbroideryGeometry({
    strokeData: strokeData,
    lineWidth: lineWidth,
    speed: speed,
    thickness: thickness,
  });
  
  var lifetime = 10.0;
  
  var mesh = new THREE.Mesh(geometry, material);
  mesh.update = function() {
    mesh.material.uniforms.time.value = internalClock.getElapsedTime();
    if (mesh.material.uniforms.time.value < lifetime) {
      window.requestAnimationFrame(mesh.update);
    }
  }
  
  THREE.Group.call(this);
  this.add(mesh);
  
  this.start = function() {
    internalClock.elapsedTime = 0; // reset this so that start always starts the animation at the beginning
    internalClock.start();
    requestAnimationFrame(mesh.update);
  }
}

EmbroideryMesh.prototype = Object.create(THREE.Group.prototype);
