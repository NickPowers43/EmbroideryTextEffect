// Copyright 2016 Gracious Eloise, Inc. All rights reserved.

var RoundTipGeometry = function(options) {
  var strokeData = options.strokeData;
  var lineWidth = options.lineWidth;

  // TODO: make this actually trace out a round tip geometry. For now, it's
  // drawing a series of straight line segments which might look good enough as
  // long as the line width is kept very small and no one looks closely.

  var positions = [];
  var times = [];

  for (var i = 0; i < strokeData.length-7; i += 4) {
    var x1 = strokeData[i];
    var y1 = strokeData[i+1];
    var t1 = strokeData[i+2];
    var deltaZ1 = strokeData[i+3];

    var x2 = strokeData[i+4];
    var y2 = strokeData[i+5];
    var t2 = strokeData[i+6];
    var deltaZ2 = strokeData[i+7];

    // We are "in the gap" between strokes if the pen lifted before this and
    // dropped after this.
    if (deltaZ1 > 0 && deltaZ2 < 0) {
      continue;
    }

    var v1 = new THREE.Vector3(x1, y1, 0);
    var v2 = new THREE.Vector3(x2, y2, 0);
    var normal = new THREE.Vector3(y2-y1, x1-x2, 0);
    normal.normalize();
    normal.multiplyScalar(lineWidth/2);

    var up1 = v1.clone();
    up1.add(normal);
    var down1 = v1.clone();
    down1.sub(normal);

    var up2 = v2.clone();
    up2.add(normal);
    var down2 = v2.clone();
    down2.sub(normal);

    positions.push(down1.x, down1.y, down1.z);
    times.push(t1);
    positions.push(up1.x, up1.y, up1.z);
    times.push(t1);
    positions.push(down2.x, down2.y, down2.z);
    times.push(t2);

    positions.push(up1.x, up1.y, up1.z);
    times.push(t1);
    positions.push(up2.x, up2.y, up2.z);
    times.push(t2);
    positions.push(down2.x, down2.y, down2.z);
    times.push(t2);
  }

  // Normalize time
  var maxTime = times.reduce(function(t, max) {
    if (t > max) { return t; }
    return max;
  })
  times = times.map(function(t) { return t / maxTime });
  this.maxTime = 1.0;

  THREE.BufferGeometry.call(this);
  this.addAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  this.addAttribute("time", new THREE.BufferAttribute(new Float32Array(times), 1));

}
RoundTipGeometry.prototype = Object.create(THREE.BufferGeometry.prototype);
