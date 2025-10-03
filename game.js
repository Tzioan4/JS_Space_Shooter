// CANVAS SETUP
var c = document.getElementById("canv"); // get canvas element
var ct = c.getContext("2d"); // get 2D context

// EVENT LISTENERS
c.addEventListener("click", canvasclicked); // click event on canvas
window.addEventListener("keydown", spaceshipmove); // key press
window.addEventListener("keyup", spaceshipstop); // key release

// AUDIO SETUP
var audioexplode = [];
audioexplode[0] = new Audio("sounds/success.mp3");
audioexplode[1] = new Audio("sounds/success.mp3");
audioexplode[2] = new Audio("sounds/success.mp3");
var audioexplodeIndex = 0;

var audioloose = new Audio("sounds/loose.mp3"); // spaceship destroyed sound

// GAME STATE VARIABLES
var GAME_PAUSED = false;
var moveLeft = false;
var moveRight = false;

var SCORE = 0;
var pointsM = 1;

var LIVES = 3;

var BULLET_LIMIT = 6;
var CREATE_METEO_PROPABILITY = 0.03;
var TouchProx = 10; // collision threshold

// IMAGES AND ASSETS
var bulletimg = "imgs/bullet.png";
var bulletspeed = -8;

var imgpath = "imgs/meteorite1.png";

var speedy = 5;
var speedx_start = -4;
var speedx_end = 4;

var img1 = new Image(c.width, c.height);
img1.src = "imgs/stars1.jpg";

var img2 = new Image(70, 66);
img2.src = "imgs/meteorite1.png";

var spship = new Image(44, 84);
spship.src = "imgs/spaceship2.png";

var spship_x = c.width / 2 - spship.width / 2;
var spship_y = c.height - spship.height - 20;

// LEVEL SETUP
class Pista {
  // level image, meteor probability, speed, score
  constructor(imgsrc, pmeteo, meteospeed, score) {
    this.img = new Image(c.width, c.height);
    this.img.src = imgsrc;
    this.pmeteo = pmeteo;
    this.meteospeed = meteospeed;
    this.score = score;
  }
}

var pistes = [];
pistes[0] = new Pista("imgs/stars1.jpg", 0.03, 5, 0);
pistes[1] = new Pista("imgs/stars2.jpg", 0.06, 8, 10);
pistes[2] = new Pista("imgs/stars3.jpg", 0.1, 12, 20);

var currentPista = 0; // current level
var maxPista = 2; // max level

// EXPLOSIONS
class Explosion {
  constructor(x, y, cont2d) {
    this.w = 100;
    this.h = 100;
    this.img = new Image(this.w, this.h);
    this.img.src = "imgs/explosion2fixed.png";
    this.x = x;
    this.y = y;
    this.ct = cont2d;
    this.framenum = 4;
  }

  draw() {
    this.ct.drawImage(
      this.img,
      this.x - 25,
      this.y - 25,
      this.img.width,
      this.img.height
    );
    this.framenum -= 1;
  }
}

var explosions = [];

// METEORITE CLASS
class Meteorite {
  constructor(imgpath, x, y, cont2d, s_x, s_y) {
    this.w = 50;
    this.h = 50;
    this.img = new Image(this.w, this.h);
    this.img.src = imgpath;
    this.x = x;
    this.y = y;
    this.ct = cont2d;
    this.step_x = s_x;
    this.step_y = s_y;
  }

  draw() {
    this.ct.drawImage(
      this.img,
      this.x,
      this.y,
      this.img.width,
      this.img.height
    );
    this.x += this.step_x;
    this.y += this.step_y;
  }

  checkCollisionWithShip() {
    return (
      spship_x < this.x + this.w - TouchProx &&
      spship_x > this.x - spship.width + TouchProx &&
      spship_y < this.y + this.h - TouchProx &&
      spship_y > this.y - spship.height + TouchProx
    );
  }
}

// BULLET CLASS
class Bullet {
  constructor(imgpath, x, y, cont2d, s_y) {
    this.w = 20;
    this.h = 20;
    this.img = new Image(this.w, this.h);
    this.img.src = imgpath;
    this.x = x;
    this.y = y;
    this.ct = cont2d;
    this.step_y = s_y;
  }

  draw() {
    this.ct.drawImage(
      this.img,
      this.x,
      this.y,
      this.img.width,
      this.img.height
    );
    this.y += this.step_y;
  }

  checkCollisionWithMeteos(m) {
    for (var i = 0; i < m.length; ++i) {
      if (
        this.x < m[i].x + m[i].w - TouchProx &&
        this.x > m[i].x - this.w + TouchProx &&
        this.y < m[i].y + m[i].h - TouchProx &&
        this.y > m[i].y - this.h + TouchProx
      )
        return i;
    }
    return -1;
  }
}

// GAME OBJECT ARRAYS
var meteos = [];
var bullets = [];

// HELPER FUNCTIONS
function windowToCanvas(canvas, x, y) {
  var bbox = canvas.getBoundingClientRect();
  return {
    x: x - bbox.left * (canvas.width / bbox.width),
    y: y - bbox.top * (canvas.height / bbox.height),
  };
}

function canvasclicked(e) {}

function resetCanvas() {
  ct.clearRect(0, 0, c.width, c.height);
}

function imgclick(im) {
  imgpath = im.src;
}

// GAME LOOP SETUP
var prevtime = new Date().getTime();
var FPS = 60;
requestAnimationFrame(move);

// GAME LOOP
function move() {
  var i;
  var time = new Date().getTime();

  // LEVEL CHANGE
  if (currentPista < maxPista) {
    if (SCORE >= pistes[currentPista + 1].score) currentPista++;
  }

  // GAME OVER
  if (LIVES <= 0) {
    ct.font = "bold 60px Arial";
    ct.fillStyle = "#ffffff";
    ct.fillText("GAME OVER", c.width / 4, c.height / 2);
    return;
  }

  // PAUSED
  if (GAME_PAUSED) {
    ct.font = "bold 60px Arial";
    ct.fillStyle = "#ffffff";
    ct.fillText("GAME PAUSED", c.width / 4, c.height / 2);
    requestAnimationFrame(move);
    return;
  }

  // FRAME LIMIT
  if (time - prevtime < 1000 / FPS) {
    requestAnimationFrame(move);
    return;
  }
  prevtime = time;

  // CLEAR CANVAS
  ct.clearRect(0, 0, c.width, c.height);

  // DRAW BACKGROUND
  ct.drawImage(
    pistes[currentPista].img,
    0,
    0,
    pistes[currentPista].img.width,
    pistes[currentPista].img.height
  );

  // CREATE METEOR
  if (Math.random() <= pistes[currentPista].pmeteo) {
    var x = Math.floor(Math.random() * 580 + 10);
    var sx = Math.floor(
      Math.random() * (speedx_end - speedx_start + 1) + speedx_start
    );
    meteos.push(
      new Meteorite(imgpath, x, -80, ct, sx, pistes[currentPista].meteospeed)
    );
  }

  // BULLET COLLISIONS
  for (i = 0; i < bullets.length; ++i) {
    index = bullets[i].checkCollisionWithMeteos(meteos);
    if (index >= 0) {
      audioexplode[audioexplodeIndex].play();
      audioexplodeIndex = (audioexplodeIndex + 1) % 3;
      explosions.push(new Explosion(meteos[index].x, meteos[index].y, ct));
      meteos.splice(index, 1);
      bullets.splice(i, 1);
      SCORE += pointsM;
      break;
    }
  }

  // METEOR COLLISIONS WITH SHIP
  for (i = 0; i < meteos.length; ++i) {
    if (meteos[i].checkCollisionWithShip()) {
      audioloose.play();
      meteos.splice(i, 1);
      LIVES -= 1;
    }
  }

  // REMOVE OFFSCREEN METEORS
  for (i = 0; i < meteos.length; ++i) {
    if (meteos[i].y > c.height) meteos.splice(i, 1);
  }

  // DRAW METEORS
  for (i = 0; i < meteos.length; ++i) {
    meteos[i].draw();
  }

  // REMOVE OFFSCREEN BULLETS
  for (i = 0; i < bullets.length; ++i) {
    if (bullets[i].y < -20) bullets.splice(i, 1);
  }

  // DRAW BULLETS
  for (i = 0; i < bullets.length; ++i) {
    bullets[i].draw();
  }

  // DRAW EXPLOSIONS
  for (i = 0; i < explosions.length; ++i) {
    explosions[i].draw();
    if (explosions[i].framenum == 0) explosions.splice(i, 1);
  }

  // DRAW SPACESHIP
  ct.drawImage(spship, spship_x, spship_y, spship.width, spship.height);

  // DRAW HUD
  ct.font = "bold 30px Arial";
  ct.fillStyle = "#6B9C5C";
  ct.fillText("Lives: " + LIVES, c.width - 130, 30);
  ct.fillStyle = "#ff0000ff";
  ct.fillText("Score: " + SCORE, 5, 30);

  // MOVE SPACESHIP
  if (moveRight) spship_x += 5;
  if (moveLeft) spship_x -= 5;

  requestAnimationFrame(move);
}

// SPACESHIP MOVEMENT HANDLERS
function spaceshipstop(e) {
  if (e.key == "ArrowRight") moveRight = false;
  else if (e.key == "ArrowLeft") moveLeft = false;
}

function spaceshipmove(e) {
  if (e.key == "r" || e.key == "R") {
    LIVES = 3;
    SCORE = 0;
    meteos = [];
    bullets = [];
    explosions = [];
    spship_x = c.width / 2 - spship.width / 2;
    spship_y = c.height - spship.height - 20;
  }

  if (e.key == "ArrowRight") moveRight = true;
  else if (e.key == "ArrowLeft") moveLeft = true;

  if (e.key == "ArrowUp") spship_y -= 5;
  else if (e.key == "ArrowDown") spship_y += 5;

  if (e.key == " ") {
    if (bullets.length < BULLET_LIMIT)
      bullets.push(
        new Bullet(
          bulletimg,
          spship_x + spship.width / 2 - 10,
          spship_y,
          ct,
          bulletspeed
        )
      );
  }

  if (e.key == "P" || e.key == "p") GAME_PAUSED = !GAME_PAUSED;
}
