const mario = document.getElementById("mario");
const luigi = document.getElementById("luigi");
const pipe1 = document.getElementById("pipe-1");
const pipe2 = document.getElementById("pipe-2");
const board1 = document.getElementById("board-1");
const board2 = document.getElementById("board-2");
const gameContainer = document.getElementById("game-container");
const darknessOverlay = document.getElementById("darkness-overlay");
const circlingWinner = document.getElementById("circling-winner");

const startScreen = document.getElementById("start-screen");
const endScreen = document.getElementById("end-screen");
const playBtn = document.getElementById("play-btn");
const restartBtn = document.getElementById("restart-btn");
const winnerText = document.getElementById("winner-text");

const gameOverMarioSnd = new Audio("snd/game-over-mario.mp3");
const gameOverLuigiSnd = new Audio("snd/game-over-luigi.mp3");

let isGameStarted = false;
let isGameOver = false;
let cloudSpawnerTimer;
let loop;
let currentPipeDuration = 1.7;
let dangerOpacity = 0;
let darknessOpacity = 0;
let shakeDistance = 0;
let mountainBrightness = 1;
let bobAmplitude = 0;
let pipeCount = 0;
let redAmount = 0;
let smileOpacity = 0;

let audioCtx;
let currentFrequency = 300;
let noiseSource;
let noiseGainNode;

const startNoise = () => {
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
  noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 800;
  noiseGainNode = audioCtx.createGain();
  noiseGainNode.gain.value = 0;
  noiseSource.connect(filter);
  filter.connect(noiseGainNode);
  noiseGainNode.connect(audioCtx.destination);
  noiseSource.start();
};

const jump = (character) => {
  if (!isGameStarted || isGameOver) return;
  if (character.classList.contains("jump")) return;
  const jumpSnd = new Audio("snd/jump.mp3");
  jumpSnd.play();
  character.classList.add("jump");
  setTimeout(() => { character.classList.remove("jump"); }, 550);
};

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") jump(mario);
  if (e.code === "ArrowUp") jump(luigi);
});

pipe1.addEventListener("animationiteration", () => {
  if (!isGameOver) {
    pipeCount++;
    currentPipeDuration /= 1.03;
    dangerOpacity += 0.04;
    if (dangerOpacity > 1) dangerOpacity = 1;
    darknessOpacity += 0.02;
    if (darknessOpacity > 0.45) darknessOpacity = 0.45;
    shakeDistance += 0.2;
    if (shakeDistance > 4) shakeDistance = 4;
    if (pipeCount > 10) {
      mountainBrightness -= 0.05;
      if (mountainBrightness < 0) mountainBrightness = 0;
      bobAmplitude += 5;
      if (bobAmplitude > 80) bobAmplitude = 80;
      redAmount += 0.05;
      if (redAmount > 1) redAmount = 1;
    }
    if (pipeCount > 15) {
      smileOpacity += 0.05;
      if (smileOpacity > 0.85) smileOpacity = 0.85;
      gameContainer.style.setProperty("--smile-opacity", smileOpacity);
    }
    board1.style.setProperty("--danger-opacity", dangerOpacity);
    board2.style.setProperty("--danger-opacity", dangerOpacity);
    darknessOverlay.style.opacity = darknessOpacity;
    gameContainer.style.setProperty("--shake-dist", `${shakeDistance}px`);
    gameContainer.style.setProperty("--mountain-brightness", mountainBrightness);
    gameContainer.style.setProperty("--cloud-filter", `brightness(${mountainBrightness}) sepia(${redAmount}) saturate(${redAmount * 5 + 1}) hue-rotate(-30deg)`);
    pipe1.style.animation = "none";
    pipe2.style.animation = "none";
    pipe1.offsetHeight;
    pipe1.style.animation = `pipe-animation ${currentPipeDuration}s infinite linear`;
    pipe2.style.animation = `pipe-animation ${currentPipeDuration}s infinite linear`;
    if (audioCtx) {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(currentFrequency, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
      currentFrequency *= 1.05;
      if (noiseGainNode && noiseGainNode.gain.value < 0.6) noiseGainNode.gain.value += 0.03;
    }
  }
});

const createCloud = (board) => {
  const cloud = document.createElement("img");
  cloud.src = "images/clouds.png";
  cloud.classList.add("cloud");
  const size = Math.random() * (300 - 100) + 100;
  const topPosition = Math.random() * (board.offsetHeight * 0.3) + 60;
  let duration = Math.random() * (25 - 10) + 10;
  if (isGameOver) duration *= 6;
  const opacity = Math.random() * (0.9 - 0.4) + 0.4;
  cloud.style.width = `${size}px`;
  cloud.style.top = `${topPosition}px`;
  cloud.style.opacity = opacity;
  cloud.style.animation = `cloud-animation ${duration}s linear`;
  board.appendChild(cloud);
  cloud.addEventListener("animationend", () => cloud.remove());
};

const spawnCloudsRandomly = () => {
  createCloud(board1);
  createCloud(board2);
  let nextSpawnTime = Math.random() * (4000 - 1500) + 1500;
  if (isGameOver) nextSpawnTime *= 6;
  cloudSpawnerTimer = setTimeout(spawnCloudsRandomly, nextSpawnTime);
};

const stopAnimations = () => {
  const animatedElements = document.querySelectorAll(".pipe, .mountain-far-bg, .mountain-fg, .mountain-bg, .character");
  animatedElements.forEach((el) => { el.style.animationPlayState = "paused"; });
  const clouds = document.querySelectorAll(".cloud");
  clouds.forEach((cloud) => {
    cloud.getAnimations().forEach((anim) => { anim.playbackRate = 0.15; });
  });
};

const startAnimations = () => {
  const animatedElements = document.querySelectorAll(".pipe, .mountain-far-bg, .mountain-fg, .mountain-bg, .character");
  animatedElements.forEach((el) => { el.style.animationPlayState = "running"; });
};

const handleDeath = (loser, loserPipe, imgOver, winnerName, isMario) => {
  isGameOver = true;
  clearInterval(loop);
  stopAnimations();
  darknessOverlay.style.opacity = 0;
  gameContainer.classList.remove("shake-effect");
  if (noiseSource) noiseSource.stop();
  if (isMario) { gameOverMarioSnd.play(); } else { gameOverLuigiSnd.play(); }
  const pipePosition = loserPipe.offsetLeft;
  const loserPosition = +window.getComputedStyle(loser).bottom.replace("px", "");
  loserPipe.style.animation = "none";
  loserPipe.style.left = `${pipePosition}px`;
  loser.style.animation = "none";
  loser.style.bottom = `${loserPosition}px`;
  loser.src = `images/${imgOver}`;
  loser.style.width = "75px";
  loser.style.marginLeft = "50px";
  loser.style.transformOrigin = "center center";
  loser.style.animation = "death-animation 0.5s forwards linear";
  loser.style.animationPlayState = "running";

  loser.addEventListener("animationend", () => {
    gameContainer.classList.add("game-over-dim");
    winnerText.innerText = `${winnerName} VENCEU!`;
    endScreen.style.display = "flex";
    circlingWinner.src = isMario ? "images/luigi.gif" : "images/mario.gif";
    circlingWinner.classList.add("animate-winner");
  }, { once: true });
};

const startGame = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    startNoise();
  }
  startScreen.style.display = "none";
  isGameStarted = true;
  startAnimations();
  spawnCloudsRandomly();
  gameContainer.classList.add("shake-effect");
  pipe1.style.animationDuration = `${currentPipeDuration}s`;
  pipe2.style.animationDuration = `${currentPipeDuration}s`;
  loop = setInterval(() => {
    const pipe1Position = pipe1.offsetLeft;
    const marioPosition = +window.getComputedStyle(mario).bottom.replace("px", "");
    const pipe2Position = pipe2.offsetLeft;
    const luigiPosition = +window.getComputedStyle(luigi).bottom.replace("px", "");
    if (pipeCount > 10) {
      const bobValueFast = Math.abs(Math.sin(Date.now() / 250)) * bobAmplitude;
      const bobValueSlow = Math.abs(Math.sin(Date.now() / 350)) * (bobAmplitude * 0.4);
      gameContainer.style.setProperty("--bob-dist-fast", `-${bobValueFast}px`);
      gameContainer.style.setProperty("--bob-dist-slow", `-${bobValueSlow}px`);
    }
    if (pipe1Position <= 120 && pipe1Position > 0 && marioPosition < 80) {
      handleDeath(mario, pipe1, "game-over.png", "JOGADOR 2 (LUIGI)", true);
    } else if (pipe2Position <= 120 && pipe2Position > 0 && luigiPosition < 80) {
      handleDeath(luigi, pipe2, "game-over-luigi.png", "JOGADOR 1 (MARIO)", false);
    }
  }, 10);
};

playBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", () => { location.reload(); });
