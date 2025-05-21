let video;
let videoBuffer;
let glowBuffer;
let grainBuffer;
// glow settings
const defaultGlowWeight = 26;
const defaultBlurLevel = 122;
// grain overlay settings

function preload() {
  // Replace 'path/to/video.mp4' with your video file or URL
  video = createVideo(['facepunch.mov']);
  // volume off
  video.volume(0);
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // hide the default video element
  video.hide();
  video.loop();

  // prepare buffers
  videoBuffer = createGraphics(windowWidth, windowHeight);
  videoBuffer.pixelDensity(1);

  glowBuffer = createGraphics(windowWidth, windowHeight);
  glowBuffer.noFill();
  glowBuffer.pixelDensity(1);

  regenerateGrain();
}

function draw() {
  background(0);

  // draw current video frame to buffer and posterize to B/W
  videoBuffer.image(video, 0, 0, width, height);
  videoBuffer.filter(GRAY);
  videoBuffer.filter(THRESHOLD, 0.5);

  // draw glow only where videoBuffer is white
  glow(g => {
    g.image(videoBuffer, 0, 0);
  });

  push();
  blendMode(ADD);
  image(videoBuffer, 0, 0);
  pop();


  // static grain overlay
  image(grainBuffer, 0, 0);
}

// helper to perform a vertical-only blur by compositing multiple passes
function verticalBlur(src, dest, blurY = 400, steps = 200, sigma = 0.9) {
  dest.clear();
  let temp = createGraphics(src.width, src.height);
  temp.pixelDensity(1);
  temp.image(src, 0, 0);

  // build & normalize Gaussian kernel
  let kernel = [];
  let sum = 0;
  for (let i = 0; i < steps; i++) {
    let x = map(i, 0, steps-1, -1, 1);
    let w = Math.exp(-0.5 * (x*x)/(sigma*sigma));
    kernel[i] = w;
    sum += w;
  }
  for (let i = 0; i < steps; i++) {
    kernel[i] /= sum;
  }

  // composite
  for (let i = 0; i < steps; i++) {
    let t    = i/(steps-1);
    let offY = lerp(-blurY, blurY, t);
    let α    = kernel[i];

    dest.push();
      dest.tint(255, α * 255);
      dest.translate(0, offY);
      dest.image(temp, 0, 0);
    dest.pop();
  }
  dest.tint(255);
}


function glow(drawFn, {
  color,
  weight = defaultGlowWeight,
  blurLevel = defaultBlurLevel
} = {}) {
  // draw thick outline into a small buffer
  glowBuffer.clear();
  glowBuffer.push();
    glowBuffer.noFill();
    glowBuffer.stroke(color || drawingContext.strokeStyle);
    glowBuffer.strokeWeight(weight);
    drawFn(glowBuffer);
  glowBuffer.pop();

  // now apply vertical-only blur into a second buffer
  let blurred = createGraphics(width, height);
  blurred.pixelDensity(1);
  verticalBlur(glowBuffer, blurred, blurLevel, 64);

  // composite additively
  push();
    blendMode(ADD);
    image(blurred, 0, 0);
  pop();
}


function regenerateGrain() {
  grainBuffer = createGraphics(windowWidth, windowHeight);
  grainBuffer.loadPixels();
  for (let i = 0; i < grainBuffer.pixels.length; i += 4) {
    let v = random(255);
    grainBuffer.pixels[i] = v;
    grainBuffer.pixels[i + 1] = v;
    grainBuffer.pixels[i + 2] = v;
    grainBuffer.pixels[i + 3] = random(10, 100);
  }
  grainBuffer.updatePixels();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  videoBuffer.resizeCanvas(windowWidth, windowHeight);
  glowBuffer.resizeCanvas(windowWidth, windowHeight);
  regenerateGrain();
}
