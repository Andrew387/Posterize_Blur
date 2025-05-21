let glowBuffer;
let grainBuffer;
const baseRadius = 100;
const noiseScale = 0.001;
const noiseSpeed = 0.002;
const wobbleAmount = 30;
const baseWeight = 4;
const defaultGlowWeight = 36;
const defaultBlurLevel = 32;
const numPoints = 100;

function setup() {
  createCanvas(windowWidth, windowHeight);
  noCursor();

  // prepare glow buffer
  glowBuffer = createGraphics(windowWidth, windowHeight);
  glowBuffer.noFill();
  glowBuffer.pixelDensity(1);

  // prepare static grain buffer
  regenerateGrain();
}

function draw() {
  background(10);
  
  let center = createVector(width * 0.5, height * 0.5);
  
  // Draw wobbly circle with glow
  glow(g => {
    drawWobblyCircle(g, center, defaultGlowWeight);
  });
  
  // Draw crisp core
  drawWobblyCircle(this, center, baseWeight);

  // static grain overlay
  image(grainBuffer, 0, 0);
}

function drawWobblyCircle(context, center, weight) {
  context.push();
  context.stroke(255);
  context.noFill();
  context.strokeWeight(weight);
  context.beginShape();
  
  for (let i = 0; i <= numPoints; i++) {
    let angle = map(i, 0, numPoints, 0, TWO_PI);
    // Use different noise coordinates for each point
    let time = frameCount * noiseSpeed;
    let xOff = cos(angle) + time;
    let yOff = sin(angle) + time;
    let zOff = time * 0.5;
    
    // Create different noise values for x and y displacement
    let noiseX = noise(xOff, yOff, zOff);
    let noiseY = noise(yOff, zOff, xOff);
    
    // Apply noise to both radius and angle for more organic movement
    let r = baseRadius + map(noiseX, 0, 1, -wobbleAmount, wobbleAmount);
    let angleOffset = map(noiseY, 0, 1, -0.1, 0.1);
    
    let x = center.x + cos(angle + angleOffset) * r;
    let y = center.y + sin(angle + angleOffset) * r;
    context.curveVertex(x, y);
  }
  
  context.endShape(CLOSE);
  context.pop();
}

function glow(drawFn, {
  color,
  weight = defaultGlowWeight,
  blurLevel = defaultBlurLevel
} = {}) {
  // clear previous glow
  glowBuffer.clear();

  // set up glowBuffer to draw in the right color
  glowBuffer.push();
    glowBuffer.noFill();
    glowBuffer.stroke(color || drawingContext.strokeStyle); 
    glowBuffer.strokeWeight(weight);
    // let the user’s drawFn render into glowBuffer
    drawFn(glowBuffer);
  glowBuffer.pop();

  // blur it
  glowBuffer.filter(BLUR, blurLevel);

  // composite additively on the main canvas
  push();
    blendMode(ADD);
    image(glowBuffer, 0, 0);
  pop();
}

function regenerateGrain() {
  grainBuffer = createGraphics(windowWidth, windowHeight);
  grainBuffer.loadPixels();
  for (let i = 0; i < grainBuffer.pixels.length; i += 4) {
    let v = random(255);
    grainBuffer.pixels[i    ] = v;
    grainBuffer.pixels[i + 1] = v;
    grainBuffer.pixels[i + 2] = v;
    grainBuffer.pixels[i + 3] = random(30, 60);
  }
  grainBuffer.updatePixels();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  glowBuffer.resizeCanvas(windowWidth, windowHeight);
  glowBuffer.pixelDensity(1);
  regenerateGrain();
}
