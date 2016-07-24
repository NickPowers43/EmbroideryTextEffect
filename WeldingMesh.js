// Copyright 2016 Gracious Eloise, Inc. All rights reserved.

var WeldingMesh = function(options) {
  var strokeData = options.strokeData;
  var lineWidth = options.lineWidth;

  // The following options are exposed so that they can be adjusted from the
  // testbed. Most callers probably don't want to change these.
  var speed = options.speed || 2;
  var glowDuration = options.glowDuration || 0.5;
  var maxTTL = options.maxTTL || 0.8;
  var density = options.density || 10;
  var maxVelocity = options.maxVelocity || 100;
  var gravity = options.gravity || 350;

  var internalClock = new THREE.Clock(false);

  // TODO: this emitter is mostly a duplication of the spark emitter in ParticleManager.

  var emitterGeometry = new THREE.BufferGeometry();
  var positions = [];
  var velocities = [];
  var ttls = [];
  var spawn_delays = [];

  for (var i = 0; i < strokeData.length-3; i+=4) {
    var x = strokeData[i];
    var y = strokeData[i+1];
    var t = strokeData[i+2];
    var deltaZ = strokeData[i+3]; // TODO: use this

    for (var j = 0; j < density; j++) {
      positions.push(x, y, 0);

      var theta = 2 *  Math.PI * Math.random() // angle from x-axis towards y-axis
      var phi = Math.PI * Math.random() // angle from z-axis towards y-axis
      var vel = new THREE.Vector3(
        Math.cos(theta) * Math.sin(phi),
        Math.sin(theta) * Math.sin(phi),
        Math.cos(phi)
      ).multiplyScalar(Math.random() * maxVelocity);
      velocities.push(vel.x, vel.y, vel.z);

      ttls.push(Math.random() * maxTTL);
      spawn_delays.push(t);
    }
  }

  // Normalize spawn_delays
  var maxSpawnDelay = spawn_delays.reduce(function(t, max) {
    if (t > max) { return t; }
    return max;
  });
  spawn_delays = spawn_delays.map(function(t) { return t / maxSpawnDelay / speed});
  maxSpawnDelay = 1.0 / speed;

  emitterGeometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  emitterGeometry.addAttribute("velocity", new THREE.BufferAttribute(new Float32Array(velocities), 3));
  emitterGeometry.addAttribute("ttl", new THREE.BufferAttribute(new Float32Array(ttls), 1));
  emitterGeometry.addAttribute("spawn_delay", new THREE.BufferAttribute(new Float32Array(spawn_delays), 1));

  var lifetime = maxSpawnDelay + Math.max(glowDuration / speed, maxTTL);

  var emitterMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    defines: {
      PI: Math.PI
    },
    uniforms: {
      clock: {value: 0.0},
      size: {value: 5.0},
      dpr: {value: window.devicePixelRatio},
      gravity: {value: new THREE.Vector3(0, -1, 0).multiplyScalar(gravity)}
    },
    vertexShader: `
      // no idea why this is necessary, but it makes the size uniform roughly
      // correspond to pixel sizes on screen:
      const float scalingFactor = 150.0;
      const vec3 unitVector = vec3(0.57735, 0.57735, 0.57735);
      uniform float clock;
      uniform vec3 gravity;
      uniform float size;
      uniform float dpr;
      attribute vec3 velocity;
      attribute float ttl;
      attribute float spawn_delay;
      varying float fractionalAge; // from 0 to 1 over its lifetime
      void main() {
        float age = clock - spawn_delay;
        fractionalAge = age / ttl;
        vec3 new_pos = position + velocity * age + gravity * pow(age, 2.0) / 2.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(new_pos, 1.0);
        // Manually apply scaling factors to size:
        vec4 upperRight = projectionMatrix * modelViewMatrix * vec4(new_pos + unitVector, 1.0);
        vec4 lowerLeft = projectionMatrix * modelViewMatrix * vec4(new_pos - unitVector, 1.0);
        gl_PointSize = distance(lowerLeft.xyz, upperRight.xyz);
        gl_PointSize *= size * dpr * scalingFactor;
        gl_PointSize *= 1.0 - smoothstep(0.6, 1.0, fractionalAge);
        gl_PointSize /= gl_Position.w; // apply perspective
      }`,
    fragmentShader: `
      const vec2 center = vec2(0.5, 0.5);
      uniform float clock;
      uniform vec3 gravity;
      varying float fractionalAge;
      void main() {
        float t = fractionalAge; // shorter alias
        gl_FragColor.r = 1.0 - 0.8 * smoothstep(0.8, 1.0, t);
        gl_FragColor.g = 1.0 - smoothstep(0.4, 1.0, t) + 0.8 * smoothstep(0.8, 1.0, t);
        gl_FragColor.b = 1.0 - smoothstep(0.0, 0.1, t) + 0.8 * smoothstep(0.8, 1.0, t);
        gl_FragColor.a = step(0.0, t) - smoothstep(0.9, 1.0, t);
        gl_FragColor.a *= 0.8;

        // circular gradient:
        gl_FragColor.a *= 1.0 - 2.0 * distance(gl_PointCoord, center);
      }`,
  });

  var emitter = new THREE.Points(emitterGeometry, emitterMaterial);

  emitter.update = function() {
    emitter.material.uniforms.clock.value = internalClock.getElapsedTime();
    if (emitter.material.uniforms.clock.value < lifetime) {
      window.requestAnimationFrame(emitter.update);
    } else {
      console.log("animation finished");
      emitter.parent.remove(emitter);
    }
  }

  var geometry = new RoundTipGeometry({
    strokeData: strokeData,
    lineWidth: lineWidth,
  });
  geometry.computeBoundingBox();
  var minX = geometry.boundingBox.min.x,
      minY = geometry.boundingBox.min.y;
  geometry.translate(-minX, -minY, 0);
  emitterGeometry.translate(-minX, -minY, 0);

  var material = new THREE.ShaderMaterial({
    uniforms: {
      glowDuration: { value: glowDuration },
      speed: { value : speed },
      clock: { value: 0.0 },
    },
    vertexShader: `
      attribute float time;
      uniform float speed;
      uniform float clock;
      varying float age;
      void main() {
        age = clock * speed - time;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform float glowDuration;
      varying float age;
      void main() {
        float t = age / glowDuration;
        gl_FragColor.r = 1.0 - 0.8 * smoothstep(0.8, 1.0, t);
        gl_FragColor.g = 1.0 - smoothstep(0.4, 1.0, t) + 0.8 * smoothstep(0.8, 1.0, t);
        gl_FragColor.b = 1.0 - smoothstep(0.0, 0.1, t) + 0.8 * smoothstep(0.8, 1.0, t);
        gl_FragColor.a = 0.0;
        if (age > 0.0) {
          gl_FragColor.a = 1.0;
        }
      }`,
    transparent: true,
  });
  var mesh = new THREE.Mesh(geometry, material);
  mesh.update = function() {
    mesh.material.uniforms.clock.value = internalClock.getElapsedTime();
    if (mesh.material.uniforms.clock.value < lifetime) {
      window.requestAnimationFrame(mesh.update);
    }
  }

  THREE.Group.call(this);
  this.add(emitter);
  this.add(mesh);
  // Set this so that callers can use it, without needing to peek down into the
  // geometry:
  this.boundingBox = geometry.boundingBox;

  this.start = function() {
    internalClock.elapsedTime = 0; // reset this so that start always starts the animation at the beginning
    internalClock.start();
    requestAnimationFrame(emitter.update);
    requestAnimationFrame(mesh.update);
  }
}

WeldingMesh.prototype = Object.create(THREE.Group.prototype);
