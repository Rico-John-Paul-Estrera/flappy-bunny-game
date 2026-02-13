// ============================================================
//  BACKGROUND MUSIC
// ============================================================
const backgroundMusic = document.getElementById("backgroundMusic");
const gameoverSound = document.getElementById("gameoverSound");
const jumpSound = document.getElementById("jumpSound");
let musicInitialized = false;

// Attempt to play music on page load (may be blocked by browser)
function playBackgroundMusic() {
  if (backgroundMusic && !musicInitialized) {
    backgroundMusic.volume = 1.0; // Set volume to 100%
    const playPromise = backgroundMusic.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log("Autoplay blocked. Music will play on first user interaction.");
      });
    }
    musicInitialized = true;
  }
}

// Stop background music and play game over sound
function playGameOverSound() {
  if (backgroundMusic) {
    backgroundMusic.pause();
  }
  if (gameoverSound) {
    gameoverSound.volume = 1.0;
    gameoverSound.currentTime = 0; // Reset to start
    gameoverSound.play().catch((error) => {
      console.log("Game over sound playback failed:", error);
    });
  }
}

// Resume background music
function resumeBackgroundMusic() {
  if (gameoverSound) {
    gameoverSound.pause();
    gameoverSound.currentTime = 0;
  }
  if (backgroundMusic) {
    backgroundMusic.volume = 1.0; // Ensure full volume
    backgroundMusic.currentTime = 0; // Restart from beginning
    backgroundMusic.play().catch((error) => {
      console.log("Background music playback failed:", error);
    });
  }
}

// Play jump sound
function playJumpSound() {
  if (jumpSound) {
    jumpSound.pause(); // Pause if already playing
    jumpSound.currentTime = 0; // Reset to start
    jumpSound.volume = 0.3; // Set volume to 40%
    jumpSound.play().catch((error) => {
      console.log("Jump sound playback failed:", error);
    });
  }
}

// Play music on first user interaction (more reliable)
document.addEventListener("click", playBackgroundMusic, { once: true });
document.addEventListener("keydown", playBackgroundMusic, { once: true });
document.addEventListener("touchstart", playBackgroundMusic, { once: true });

// ============================================================
//  FLAPPY BUD BUNNY – Glitchy Edition Inspired by @404bunnies
// ============================================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ----- Constants -----
const W = canvas.width;
const H = canvas.height;
const GRAVITY = 0.12;
const FLAP_FORCE = -4.2;
const PIPE_WIDTH = 60;
const PIPE_GAP = 220;
const PIPE_SPEED = 0.8;
const PIPE_INTERVAL = 2800; // ms

// ----- Game State -----
let bunny, pipes, score, bestScore, gameState, pipeTimer, frameId;
let particles = [];
let waveOffset = 0;
let cloudOffset = 0;
let glitchTimer = 0; // New: for glitch effects
bestScore = parseInt(localStorage.getItem("flappyBunnyBest") || "0");

// ----- Helper -----
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// New: Glitch effect function (RGB shift, scanlines)
function applyGlitch(intensity = 0.5) {
  const imageData = ctx.getImageData(0, 0, W, H);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < intensity) {
      data[i] = data[i + 4]; // Red shift
      data[i + 1] = data[i + 8]; // Green shift
      data[i + 2] = data[i + 12]; // Blue shift
    }
  }
  ctx.putImageData(imageData, rand(-2, 2), rand(-2, 2)); // Slight offset
  // Scanlines
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  for (let y = 0; y < H; y += 2) {
    if (Math.random() < intensity) ctx.fillRect(0, y, W, 1);
  }
}

// ============================================================
//  DRAW THE BUNNY CHARACTER (nautical base with glitch inspo)
// ============================================================
function drawBunny(x, y, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const s = 0.42; // scale
  ctx.scale(s, s);

  // Glitch shift on bunny (subtle)
  if (Math.random() < 0.1) {
    ctx.translate(rand(-2, 2), rand(-2, 2));
  }

  // ---- Shadow under bunny ----
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.beginPath();
  ctx.ellipse(0, 50, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // ---- Body / Sailor Outfit ----
  // Navy jacket (edgy tint inspired by red jackets in posts)
  ctx.fillStyle = "#1e3a5f";
  ctx.beginPath();
  ctx.roundRect(-30, 15, 60, 50, 8);
  ctx.fill();

  // Collar (white sailor collar)
  ctx.fillStyle = "#f0ece4";
  ctx.beginPath();
  ctx.moveTo(-28, 18);
  ctx.lineTo(0, 42);
  ctx.lineTo(28, 18);
  ctx.lineTo(20, 18);
  ctx.lineTo(0, 34);
  ctx.lineTo(-20, 18);
  ctx.closePath();
  ctx.fill();

  // Collar stripes
  ctx.strokeStyle = "#1e3a5f";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-22, 21);
  ctx.lineTo(0, 37);
  ctx.lineTo(22, 21);
  ctx.stroke();

  // Tie knot
  ctx.fillStyle = "#c8c0b4";
  ctx.beginPath();
  ctx.arc(0, 30, 4, 0, Math.PI * 2);
  ctx.fill();

  // ---- Head ----
  ctx.fillStyle = "#f5f0ea";
  ctx.beginPath();
  ctx.ellipse(0, -8, 32, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  // Slight head shading
  ctx.fillStyle = "rgba(200,195,190,0.15)";
  ctx.beginPath();
  ctx.ellipse(5, -4, 24, 22, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // ---- Ears ----
  // Left ear (add glitch line sometimes)
  ctx.fillStyle = "#f5f0ea";
  ctx.beginPath();
  ctx.ellipse(-14, -55, 12, 28, -0.15, 0, Math.PI * 2);
  ctx.fill();
  if (Math.random() < 0.05) {
    ctx.strokeStyle = "rgba(255,0,0,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-14, -55);
    ctx.lineTo(-14, -80);
    ctx.stroke();
  }
  // Inner ear
  ctx.fillStyle = "#f0dce0";
  ctx.beginPath();
  ctx.ellipse(-14, -52, 6, 18, -0.15, 0, Math.PI * 2);
  ctx.fill();

  // Right ear
  ctx.fillStyle = "#f5f0ea";
  ctx.beginPath();
  ctx.ellipse(14, -55, 12, 28, 0.15, 0, Math.PI * 2);
  ctx.fill();
  // Inner ear
  ctx.fillStyle = "#f0dce0";
  ctx.beginPath();
  ctx.ellipse(14, -52, 6, 18, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // ---- Sailor Hat ----
  // Hat brim
  ctx.fillStyle = "#f0ece4";
  ctx.beginPath();
  ctx.ellipse(0, -35, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hat top
  ctx.fillStyle = "#f0ece4";
  ctx.beginPath();
  ctx.ellipse(0, -42, 22, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hat band
  ctx.fillStyle = "#1e3a5f";
  ctx.fillRect(-22, -38, 44, 6);

  // Sailboat emblem on hat
  ctx.fillStyle = "#1e3a5f";
  ctx.beginPath();
  ctx.moveTo(0, -50);
  ctx.lineTo(-6, -42);
  ctx.lineTo(6, -42);
  ctx.closePath();
  ctx.fill();
  // Boat hull
  ctx.beginPath();
  ctx.moveTo(-7, -42);
  ctx.lineTo(7, -42);
  ctx.lineTo(5, -40);
  ctx.lineTo(-5, -40);
  ctx.closePath();
  ctx.fill();

  // ---- Teddy Bear on hat (cute inspo from profile) ----
  ctx.fillStyle = "#c8976c";
  // Bear body
  ctx.beginPath();
  ctx.ellipse(0, -56, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Bear head
  ctx.beginPath();
  ctx.arc(0, -63, 5, 0, Math.PI * 2);
  ctx.fill();
  // Bear ears
  ctx.beginPath();
  ctx.arc(-4, -67, 2.5, 0, Math.PI * 2);
  ctx.arc(4, -67, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Bear inner ears
  ctx.fillStyle = "#a87550";
  ctx.beginPath();
  ctx.arc(-4, -67, 1.5, 0, Math.PI * 2);
  ctx.arc(4, -67, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Bear face
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(-2, -63, 0.8, 0, Math.PI * 2);
  ctx.arc(2, -63, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3d2b1f";
  ctx.beginPath();
  ctx.arc(0, -61.5, 1, 0, Math.PI * 2);
  ctx.fill();

  // ---- Eyes (big, expressive like in posts) ----
  // Left eye white
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(-12, -10, 10, 11, -0.05, 0, Math.PI * 2);
  ctx.fill();
  // Left eye iris
  ctx.fillStyle = "#8898b0";
  ctx.beginPath();
  ctx.ellipse(-12, -9, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Left eye pupil
  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.ellipse(-12, -8, 4.5, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Left eye highlight
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(-14, -12, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-10, -6, 1.2, 0, Math.PI * 2);
  ctx.fill();
  // Left eyelid line
  ctx.strokeStyle = "#2a2a3a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(-12, -10, 10.5, 11.5, -0.05, Math.PI + 0.5, Math.PI * 2 - 0.5);
  ctx.stroke();

  // Right eye white
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(12, -10, 10, 11, 0.05, 0, Math.PI * 2);
  ctx.fill();
  // Right eye iris
  ctx.fillStyle = "#8898b0";
  ctx.beginPath();
  ctx.ellipse(12, -9, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Right eye pupil
  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.ellipse(12, -8, 4.5, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Right eye highlight
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(10, -12, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(14, -6, 1.2, 0, Math.PI * 2);
  ctx.fill();
  // Right eyelid line
  ctx.strokeStyle = "#2a2a3a";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(12, -10, 10.5, 11.5, 0.05, Math.PI + 0.5, Math.PI * 2 - 0.5);
  ctx.stroke();

  // ---- Nose ----
  ctx.fillStyle = "#e8788a";
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.bezierCurveTo(-3, -1, -3, -1, 0, -2);
  ctx.bezierCurveTo(3, -1, 3, -1, 0, 2);
  ctx.fill();

  // ---- Mouth ----
  ctx.strokeStyle = "#c06070";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, 3);
  ctx.quadraticCurveTo(0, 8, 0, 7);
  ctx.stroke();

  // ---- Life Preserver Ring (around left arm area) ----
  ctx.strokeStyle = "#f0ece4";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(28, 30, 12, 0, Math.PI * 2);
  ctx.stroke();
  // Red stripe on ring (edgy red from devil bunny inspo)
  ctx.strokeStyle = "#cc3333";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(28, 30, 12, -0.5, 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(28, 30, 12, Math.PI - 0.5, Math.PI + 0.5);
  ctx.stroke();

  ctx.restore();
}

// ============================================================
//  BACKGROUND – Ocean + Sky + Clouds with Glitch + Rainbow Inspo
// ============================================================
function drawBackground() {
  // Sky gradient (pastel blues with rainbow tint)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, "#1a3355");
  skyGrad.addColorStop(0.3, "#ff69b4"); // Pink rainbow accent
  skyGrad.addColorStop(0.4, "#2a4a72");
  skyGrad.addColorStop(0.7, "#1d3a60");
  skyGrad.addColorStop(1, "#0f2440");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Clouds (with occasional glitch distortion)
  cloudOffset -= 0.3;
  for (let i = 0; i < 5; i++) {
    const cx =
      ((i * 120 + cloudOffset) % (W + 100)) -
      50 +
      (Math.random() < 0.05 ? rand(-5, 5) : 0); // Glitch offset
    const cy = 40 + i * 55 + Math.sin(i * 2.3) * 20;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 50 + i * 5, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 25, cy - 5, 30, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ocean waves at bottom (with glitch waves)
  waveOffset += 0.02;
  for (let layer = 0; layer < 3; layer++) {
    ctx.fillStyle = `rgba(15, 40, 75, ${0.5 + layer * 0.15})`;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 5) {
      const y =
        H -
        30 +
        layer * 12 +
        Math.sin(x * 0.02 + waveOffset + layer * 1.5) * (6 - layer * 1.5) +
        (Math.random() < 0.02 ? rand(-10, 10) : 0); // Glitch jiggle
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }

  // Wave foam (glitchy pixels)
  ctx.fillStyle = "rgba(200, 220, 240, 0.08)";
  for (let x = 0; x <= W; x += 5) {
    const y = H - 30 + Math.sin(x * 0.02 + waveOffset) * 6;
    ctx.beginPath();
    if (Math.random() < 0.1) {
      ctx.rect(x, y, 4, 4); // Pixel glitch instead of arc
    } else {
      ctx.arc(x, y, 2, 0, Math.PI * 2);
    }
    ctx.fill();
  }
}

// ============================================================
//  PIPES – Glitchy Dock Pilings Style
// ============================================================
function drawPipe(pipe) {
  const topH = pipe.topHeight;
  const bottomY = topH + PIPE_GAP;

  // Top pillar (gradient with glitch lines)
  const tGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
  tGrad.addColorStop(0, "#1a3a5c");
  tGrad.addColorStop(0.3, "#2a5a8a");
  tGrad.addColorStop(0.7, "#2a5a8a");
  tGrad.addColorStop(1, "#14304e");
  ctx.fillStyle = tGrad;
  ctx.fillRect(pipe.x, 0, PIPE_WIDTH, topH);

  // Top cap
  ctx.fillStyle = "#0f2a48";
  ctx.fillRect(pipe.x - 5, topH - 20, PIPE_WIDTH + 10, 20);
  // Rope accent (edgy gold)
  ctx.strokeStyle = "#c8a86e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pipe.x - 3, topH - 10);
  ctx.lineTo(pipe.x + PIPE_WIDTH + 3, topH - 10);
  ctx.stroke();
  // Barnacles (pixel-like for glitch)
  ctx.fillStyle = "#8a9aaa";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    if (Math.random() < 0.1) {
      ctx.rect(pipe.x + 10 + i * 18, topH - 25, 3, 3); // Pixel glitch
    } else {
      ctx.arc(pipe.x + 10 + i * 18, topH - 25, 3, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  // Bottom pillar
  ctx.fillStyle = tGrad;
  ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, H - bottomY);

  // Bottom cap
  ctx.fillStyle = "#0f2a48";
  ctx.fillRect(pipe.x - 5, bottomY, PIPE_WIDTH + 10, 20);
  // Rope accent
  ctx.strokeStyle = "#c8a86e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pipe.x - 3, bottomY + 10);
  ctx.lineTo(pipe.x + PIPE_WIDTH + 3, bottomY + 10);
  ctx.stroke();

  // Vertical wood-grain lines (with glitch flicker)
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const lx = pipe.x + 12 + i * 16 + (Math.random() < 0.05 ? rand(-2, 2) : 0);
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, topH - 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx, bottomY + 20);
    ctx.lineTo(lx, H);
    ctx.stroke();
  }
}

// ============================================================
//  PARTICLES (bubbles with glitch)
// ============================================================
function spawnBubbles(x, y) {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: x + rand(-8, 8),
      y: y + rand(-8, 8),
      vx: rand(-1.5, 1.5),
      vy: rand(-3, -1),
      life: 1,
      decay: rand(0.02, 0.05),
      r: rand(2, 5),
      glitch: Math.random() < 0.2, // Chance to glitch
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.fillStyle = `rgba(180, 210, 240, ${p.life * 0.6})`;
    ctx.beginPath();
    if (p.glitch) {
      ctx.rect(p.x, p.y, p.r * 2, p.r * 2); // Square glitch
    } else {
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
    }
    ctx.fill();
    // Bubble highlight
    ctx.fillStyle = `rgba(255, 255, 255, ${p.life * 0.3})`;
    ctx.beginPath();
    ctx.arc(
      p.x - p.r * 0.3,
      p.y - p.r * 0.3,
      p.r * 0.3 * p.life,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

// ============================================================
//  SCORE / UI (playful fonts with glitch)
// ============================================================
function drawScore() {
  // Score
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.font = 'bold 48px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(score, W / 2 + 2 + rand(-1, 1), 62); // Glitch jiggle
  ctx.fillStyle = "#fff";
  ctx.fillText(score, W / 2, 60);
  ctx.restore();
}

function drawStartScreen() {
  drawBackground();

  // Title (edgy glitch)
  ctx.save();
  ctx.textAlign = "center";

  // Title shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
  ctx.fillText("GLITCHY BUNNIES", W / 2 + 2, 102);
  ctx.fillStyle = "#fff";
  ctx.fillText("GLITCHY BUNNIES", W / 2 + rand(-2, 2), 100); // Glitch

  // Subtitle
  ctx.font = '16px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = "rgba(180, 210, 240, 0.8)";
  ctx.fillText("~ Things Are About To Get Weird ~", W / 2, 130); // Inspo from posts

  // Draw bunny preview (bobbing with glitch)
  const bobY = Math.sin(Date.now() * 0.003) * 10;
  drawBunny(W / 2, H / 2 - 30 + bobY, Math.sin(Date.now() * 0.002) * 0.08);

  // Instruction
  ctx.font = '18px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = "#fff";
  const pulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
  ctx.globalAlpha = 0.5 + pulse * 0.5;
  ctx.fillText("Click or press Space to start", W / 2, H / 2 + 80);
  ctx.globalAlpha = 1;

  // Best score
  if (bestScore > 0) {
    ctx.font = '14px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = "#c8a86e";
    ctx.fillText(`Best: ${bestScore}`, W / 2, H / 2 + 110);
  }

  ctx.restore();
}

function drawGameOver() {
  // Overlay (glitchy)
  ctx.fillStyle = "rgba(5, 15, 35, 0.65)";
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.textAlign = "center";

  // Game Over text (edgy red)
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.font = 'bold 40px "Segoe UI", Arial, sans-serif';
  ctx.fillText("GAME OVER", W / 2 + 2, H / 2 - 90);
  ctx.fillStyle = "#e84057";
  ctx.fillText("GAME OVER", W / 2 + rand(-2, 2), H / 2 - 88); // Glitch

  // Score rating text (below GAME OVER)
  let ratingText = "";
  if (score >= 20) {
    ratingText = "BUNNY.EXE (BIG DICK)";
    ctx.fillStyle = "#ff69b4";
  } else if (score >= 10) {
    ratingText = "LOW IQ (GUD BUNNY)";
    ctx.fillStyle = "#ffd700";
  } else {
    ratingText = "HIGH IQ (LOSER BUNNY)";
    ctx.fillStyle = "#888";
  }
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
  ctx.fillText(ratingText, W / 2, H / 2 - 60);

  // Score card
  ctx.fillStyle = "rgba(15, 30, 55, 0.85)";
  ctx.beginPath();
  ctx.roundRect(W / 2 - 100, H / 2 - 40, 200, 110, 12);
  ctx.fill();
  ctx.strokeStyle = "#2a5a8a";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = '16px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = "#8aa8c8";
  ctx.fillText("Score", W / 2, H / 2 - 15);
  ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = "#fff";
  ctx.fillText(score, W / 2, H / 2 + 18);

  ctx.font = '14px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = "#c8a86e";
  ctx.fillText(`Best: ${bestScore}`, W / 2, H / 2 + 50);

  // Restart prompt (weird inspo)
  ctx.font = '16px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = "#fff";
  const pulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
  ctx.globalAlpha = 0.5 + pulse * 0.5;
  ctx.fillText("Click or Space to retry... or get weird", W / 2, H / 2 + 100);
  ctx.globalAlpha = 1;

  ctx.restore();
}

// ============================================================
//  COLLISION DETECTION
// ============================================================
function checkCollision() {
  const bx = bunny.x;
  const by = bunny.y;
  const br = 16; // bunny hitbox radius

  // Floor/ceiling
  if (by - br < 0 || by + br > H - 25) return true;

  // Pipes
  for (const pipe of pipes) {
    const topH = pipe.topHeight;
    const bottomY = topH + PIPE_GAP;

    // Horizontal overlap
    if (bx + br > pipe.x - 5 && bx - br < pipe.x + PIPE_WIDTH + 5) {
      // Top pipe
      if (by - br < topH) return true;
      // Bottom pipe
      if (by + br > bottomY) return true;
    }
  }
  return false;
}

// ============================================================
//  GAME LOOP
// ============================================================
function resetGame() {
  bunny = { x: 80, y: H / 2, vy: 0, rotation: 0 };
  pipes = [];
  particles = [];
  score = 0;
  pipeTimer = 0;
  glitchTimer = 0;
}

// Bunny hand mashing effect (only the hand moves)
const bunnyHandImg = document.getElementById("bunnyHand");
let mashTimeout = null;
function triggerMash() {
  bunnyHandImg.classList.add("pressing");
  if (mashTimeout) clearTimeout(mashTimeout);
  mashTimeout = setTimeout(() => {
    bunnyHandImg.classList.remove("pressing");
  }, 100);
}

function flap() {
  triggerMash();
  if (gameState === "start") {
    playJumpSound(); // Play sound when starting game
    gameState = "playing";
    resetGame();
    bunny.vy = FLAP_FORCE;
    spawnBubbles(bunny.x, bunny.y + 15);
    resumeBackgroundMusic(); // Resume music when starting game
  } else if (gameState === "playing") {
    playJumpSound(); // Play sound during gameplay
    bunny.vy = FLAP_FORCE;
    spawnBubbles(bunny.x, bunny.y + 15);
    glitchTimer = 10; // Brief glitch on flap
  } else if (gameState === "dead") {
    // Don't play sound when dead, just restart game state
    gameState = "start";
  }
}

let lastTime = 0;
function gameLoop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  if (gameState === "start") {
    drawStartScreen();
    frameId = requestAnimationFrame(gameLoop);
    return;
  }

  if (gameState === "playing") {
    // Spawn pipes
    pipeTimer += dt;
    if (pipeTimer >= PIPE_INTERVAL) {
      pipeTimer = 0;
      const minTop = 60;
      const maxTop = H - PIPE_GAP - 80;
      pipes.push({
        x: W,
        topHeight: rand(minTop, maxTop),
        scored: false,
      });
    }

    // Update bunny
    bunny.vy += GRAVITY;
    bunny.y += bunny.vy;
    bunny.rotation = Math.max(-0.5, Math.min(bunny.vy * 0.06, 1.2));

    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
      pipes[i].x -= PIPE_SPEED;

      // Score
      if (!pipes[i].scored && pipes[i].x + PIPE_WIDTH < bunny.x) {
        pipes[i].scored = true;
        score++;
      }

      // Remove off-screen
      if (pipes[i].x + PIPE_WIDTH < -10) {
        pipes.splice(i, 1);
      }
    }

    // Particles
    updateParticles();

    // Collision (trigger big glitch on death)
    if (checkCollision()) {
      gameState = "dead";
      playGameOverSound(); // Play game over sound and stop music
      if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("flappyBunnyBest", bestScore.toString());
      }
      // Death bubbles with glitch
      for (let i = 0; i < 15; i++) {
        particles.push({
          x: bunny.x + rand(-15, 15),
          y: bunny.y + rand(-15, 15),
          vx: rand(-3, 3),
          vy: rand(-4, 0),
          life: 1,
          decay: rand(0.01, 0.03),
          r: rand(3, 7),
          glitch: true,
        });
      }
      glitchTimer = 30; // Longer glitch on death
    }
  }

  // ---- Draw ----
  drawBackground();

  // Pipes
  for (const pipe of pipes) {
    drawPipe(pipe);
  }

  // Particles
  drawParticles();

  // Bunny
  if (gameState !== "start") {
    drawBunny(bunny.x, bunny.y, bunny.rotation);
  }

  // Score
  if (gameState === "playing") {
    drawScore();
  }

  // Game over overlay
  if (gameState === "dead") {
    drawGameOver();
  }

  // Apply global glitch if timer active
  if (glitchTimer > 0) {
    applyGlitch(0.3);
    glitchTimer--;
  } else if (Math.random() < 0.01) {
    // Random rare glitch
    applyGlitch(0.1);
  }

  frameId = requestAnimationFrame(gameLoop);
}

// ============================================================
//  INPUT
// ============================================================
canvas.addEventListener("click", flap);
canvas.addEventListener(
  "touchstart",
  (e) => {
    e.preventDefault();
    flap();
  },
  { passive: false },
);
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    flap();
  }
});

// ============================================================
//  HDMI CORD POSITIONING
// ============================================================
function positionHdmiCord() {
  const canvasRect = canvas.getBoundingClientRect();
  const bunnyWrap = document.getElementById("bunnyDeskWrap");
  const bunnyRect = bunnyWrap.getBoundingClientRect();

  // Source point: right-center of bunny image
  const srcX = bunnyRect.right - 10;
  const srcY = bunnyRect.top + bunnyRect.height * 0.45;

  // Destination point: left-center of game canvas
  const dstX = canvasRect.left + -5;
  const dstY = canvasRect.top + canvasRect.height * 0.55;

  // Midpoint for curve control points
  const midX = (srcX + dstX) / 2;
  const sag = 20; // cable sag amount

  // SVG cable path (catenary-like curve)
  const pathD = `M ${srcX} ${srcY} C ${srcX + 60} ${srcY + sag}, ${dstX - 60} ${dstY + sag}, ${dstX} ${dstY}`;
  document.getElementById("cablePath").setAttribute("d", pathD);
  document.getElementById("cableHighlight").setAttribute("d", pathD);

  // Position plugs
  const plugSrc = document.getElementById("hdmiPlugSrc");
  plugSrc.style.left = srcX - 15 + "px";
  plugSrc.style.top = srcY - 8 + "px";
  plugSrc.style.transform = "rotate(90deg)";

  const plugDst = document.getElementById("hdmiPlugDst");
  plugDst.style.left = dstX - 15 + "px";
  plugDst.style.top = dstY - 8 + "px";
  plugDst.style.transform = "rotate(-90deg)";

  // Position HDMI tag label near middle of cable
  const tagX = midX - 20;
  const tagY = (srcY + dstY) / 2 + sag - 5;
  const tag = document.getElementById("hdmiTag");
  tag.style.left = tagX + "px";
  tag.style.top = tagY + "px";
}

window.addEventListener("resize", positionHdmiCord);
setTimeout(positionHdmiCord, 100);

// ============================================================
//  START
// ============================================================
gameState = "start";
resetGame();
requestAnimationFrame(gameLoop);
