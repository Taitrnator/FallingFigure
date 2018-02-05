var human;

var easycam;
var phongshader;


// material defs
var matWhite  = { diff:[1   ,1   ,1   ], spec:[1,1,1], spec_exp:200.0 };
var matDark   = { diff:[0.2 ,0.3 ,0.4 ], spec:[1,1,1], spec_exp:400.0 };
var matRed    = { diff:[1   ,0.05,0.01], spec:[1,0,0], spec_exp:400.0 };
var matBlue   = { diff:[0.01,0.05,1   ], spec:[0,0,1], spec_exp:400.0 };
var matGreen  = { diff:[0.05,1   ,0.01], spec:[0,1,0], spec_exp:400.0 };
var matYellow = { diff:[1   ,1   ,0.01], spec:[1,1,0], spec_exp:400.0 };

var materials = [ matWhite, matRed, matBlue, matGreen, matYellow ];


// light defs

var ambientlight = { col : [0,0,0] };

var directlights = [
  { dir:[-1,-1,0], col:[0,0,0] },
];

var pointlights = [
  { pos:[0,0,0,1], col:[1.00, 1.00, 1.00], rad:1150 },
  { pos:[0,0,0,1], col:[1.00, 0.00, 0.40], rad:1200 },
  { pos:[0,0,0,1], col:[0.00, 0.40, 1.00], rad:400 },
  { pos:[0,0,0,1], col:[1.00, 0.40, 0.00], rad:400 },
  { pos:[0,0,0,1], col:[0.10, 0.40, 1.00], rad:400 },
];


// geometry
var torus_def = {
  r1 : 300,
  r2 : 25,
};

function preload() {
  human = loadModel('assets/FuseModel1.obj');
}

function setup() {
 pixelDensity(1);
 createCanvas(windowWidth, windowHeight, WEBGL);
 // noLoop();
 setAttributes('antialias', true);

 phongshader = new p5.Shader(this._renderer, phong_vert, phong_frag);

 // init camera
 easycam = createEasyCam({
   distance: 850,
   center: [0, 0, 0],
   rotation: [0.39487252654899657,
             -0.256575423781408,
             -0.7879772740993238,
              0.39665672210514363]

 });

 document.oncontextmenu = function() { return false; }
 document.onmousedown   = function() { return false; }


}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  easycam.setViewport([0,0,windowWidth, windowHeight]);
}

function setShader(shader){
  shader.uniforms.uUseLighting = true; // required for p5js
  this.shader(shader);
}


function setMaterial(shader, material){
  shader.setUniform('material.diff', material.diff);
  shader.setUniform('material.spec', material.spec);
  shader.setUniform('material.spec_exp', material.spec_exp);
}


function setAmbientlight(shader, ambientlight){
  shader.setUniform('ambientlight.col', ambientlight.col);
}


var m4_modelview = new p5.Matrix();
var m3_directions = new p5.Matrix('mat3');


//
// transforms a vector by a matrix (m4 or m3)
//
function mult(mat, vSrc, vDst){

  vDst = ((vDst === undefined) || (vDst.constructor !== Array)) ? [] : vDst;

  var x ,y ,z, w;

  if(vSrc instanceof p5.Vector){
    x = vSrc.x
    y = vSrc.y;
    z = vSrc.z;
    w = 1;
  } else if(vDst.constructor === Array){
    x = vSrc[0];
    y = vSrc[1];
    z = vSrc[2];
    w = vSrc[3]; w = (w === undefined) ? 1 : w;
  } else {
    console.log("vSrc must be a vector");
  }

  if(mat instanceof p5.Matrix){
    mat = mat.mat4 || mat.mat3;
  }

  if(mat.length === 16){
    vDst[0] = mat[0]*x + mat[4]*y + mat[ 8]*z + mat[12]*w,
    vDst[1] = mat[1]*x + mat[5]*y + mat[ 9]*z + mat[13]*w,
    vDst[2] = mat[2]*x + mat[6]*y + mat[10]*z + mat[14]*w;
    vDst[3] = mat[3]*x + mat[7]*y + mat[11]*z + mat[15]*w;
  }
  else if(mat.length === 9) {
    vDst[0] = mat[0]*x + mat[3]*y + mat[6]*z,
    vDst[1] = mat[1]*x + mat[4]*y + mat[7]*z,
    vDst[2] = mat[2]*x + mat[5]*y + mat[8]*z;
  }

  return vDst;
}

function addDirectlight(shader, directlights, idx){

  m4_modelview.set(easycam.renderer.uMVMatrix);
  m3_directions.inverseTranspose(m4_modelview);

  var light = directlights[idx];

  // normalize direction
  var [x,y,z] = light.dir;
  var mag = Math.sqrt(x*x + y*y + z*z); // should not be zero length
  var light_dir = [x/mag, y/mag, z/mag];

  // transform to camera-space
  light_dir = mult(m3_directions, light_dir);

  // set shader uniforms
  shader.setUniform('directlights['+idx+'].dir', light_dir);
  shader.setUniform('directlights['+idx+'].col', light.col);
}

function addPointLight(shader, pointlights, idx){

  var light = pointlights[idx];

  light.pos_cam = mult(easycam.renderer.uMVMatrix, light.pos);

  shader.setUniform('pointlights['+idx+'].pos', light.pos_cam);
  shader.setUniform('pointlights['+idx+'].col', light.col);
  shader.setUniform('pointlights['+idx+'].rad', light.rad);

  var col = light.col;

  // display it as a filled sphere
  fill(col[0]*255, col[1]*255, col[2]*255);
  sphere(4);
}


// function drawSecondBody() {
//   scale(0.8);
//   rotateY(-PI/2.5);
//   rotateZ(PI);
//   translate(-200, -500, 100);
//   stroke(120, 120, 120, 0.2);
//   noFill();
//
//   beginShape();
//   let newHuman = model(human);
//   let numVertices = newHuman.getVertexCount();
//     for(let j = 0; j < numVertices; j++){
//       vertex( v2.getVertexX(j), v2.getVertexY(j), v2.getVertexZ(j));
//     }
//   endShape();
// }



function draw() {
  background(0);

  setAmbientlight(phongshader, ambientlight);
  addDirectlight(phongshader, directlights, 0);

  // projection
  perspective(60 * PI/180, width/height, 1, 20000);


  var m4_torus = new p5.Matrix();

  // add pointlights
  // 2 are place somewhere free in space
  // 3 are moving along the torus surface
  // add pointlights
  // 2 are place somewhere free in space
  // 3 are moving along the torus surface
  push();
  {

    var ang1 = map(mouseX, 0, width, -1, 1);
    var ang = sin(frameCount * 0.01) * 0.2;
    var ty = torus_def.r1 * 2 + (1-abs(ang)) * 100;
    for(var i = 0; i < 5; i++){
      push();
      var tx = random(-1, 1) * 300;
      var ty = random(-1, 1) * 300;
      var tz = random( -1, 1) * 300;
      var rad = random(5, 15);
      translate(tx, tz + rad + 5);
      addPointLight(phongshader, pointlights, 1);
      // sphere(rad);
      pop();
    }
    for(var i = 0; i < 60; i++){
      push();
      var tx = random(-1, 1) * 400;
      var ty = random(-1, 1) * 400;
      var tz = random( -1, 1) * 400;
      var rad = random(5, 15);
      translate(tx, ty-100, tz + rad + 5);
      addPointLight(phongshader, pointlights, 0);
      // sphere(rad);
      pop();
    }


    // torus transformations + surface-pointlights
    push();
      rotateX(PI/2);
      translate(0,torus_def.r1,0);


      var rad1 = torus_def.r1;
      var rad2 = torus_def.r2 + 5; // offset from torus surface

      for(var i = 0; i < 5; i++){
        push();
        // rotateX(0 * TWO_PI / 3 + frameCount * 0.01);
        rotateY((frameCount * 0.001) * TWO_PI);
        var tx = random(-1, 1) * 200;
        var ty = random(-1, 1) * 200;
        var tz = random( -1, 1) * 200;
        var rad = random(5, 15);
        ambientLight(49, 33, 255);
        translate(tx -100, ty -100, tz + rad + 5);
        addPointLight(phongshader, pointlights, 2);
        // sphere(rad);
        pop();
      }
      for(var i = 0; i < 5; i++){
      push();
        var tx = random(-1, 1) * 200;
        var ty = random(-1, 1) * 200;
        var tz = random( -1, 1) * 200;
        var rad = random(5, 15);
        rotateZ((frameCount * 0.02));
        translate(tx, ty, tz + rad + 2);
        addPointLight(phongshader, pointlights, 3);

      pop();
     }
     for(var i = 0; i < 3; i++){
      push();
        var tx = random(-1, 1) * 50;
        var ty = random(-1, 1) * 50;
        var tz = random( -1, 1) * 50;
        rotateZ(PI/2);
        translate(rad1, 0, 0);
        rotateY(PI/2);
        translate(tx -100, ty, tz - 100);
        addPointLight(phongshader, pointlights, 1);
      pop();
    }

      push();
        rotateY(+PI/2 + sin(frameCount * 0.01) * 2 * PI/3);
        translate(rad1, 0, 0);
        rotateY(frameCount * 0.1);
        translate(rad2, 0, 0);
        addPointLight(phongshader, pointlights, 1);
      pop();

      m4_torus.set(this._renderer.uMVMatrix);

    pop();
  }
  pop();



  //////////////////////////////////////////////////////////////////////////////
  //
  // scene, material-uniforms
  //
  //////////////////////////////////////////////////////////////////////////////

  // reset shader, after fill() was used previously
  setShader(phongshader);
  // ground

  push();
  // var dirY = 0.4285714285714286;
  // var dirX = -0.6619718309859155;
  // directionalLight(49, 233, 255, dirY, -dirX, 0.25);
  // directionalLight(250, 49, 224, dirX, dirY, 0.25);
  scale(0.3);
  rotateY(-PI/2.5);
  rotateZ(PI);
  specularMaterial(255);
  stroke(0);
  noStroke();
  translate(0, -1000, 0);
  model(human);
  pop();

  push();
  stroke(255);
  // sphere(300);
  pop();
  // torus
  // push();
  // this._renderer.uMVMatrix.set(human);
  // setMaterial(phongshader, matWhite);
  // translate(0, -200, 0);
  // torus(torus_def.r1, torus_def.r2, 100, 25);
  // pop();

  // random spheres
  randomSeed(2);
  stroke(0);
  noStroke();
  setMaterial(phongshader, matWhite);
  addDirectlight(phongshader, directlights, 0);
  for(var i = 0; i < 20; i++){
    push();
    var tx = random(-1, 1) * 300;
    var ty = random(-1, 1) * 300;
    var tz = random( -1, 1) * 300;
    var rad = random(5, 15);
    ambientLight(49, 33, 255);
    translate(tx, ty, tz + rad + 5);
    sphere(rad);
    pop();
  }
}
