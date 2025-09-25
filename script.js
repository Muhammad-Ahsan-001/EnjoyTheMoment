// script.js
const startBtn = document.getElementById('startBtn');
const message = document.getElementById('message');
const flames = document.querySelectorAll('.flame');
const audio = document.getElementById('happyAudio');

let listening = false;
let audioCtx, analyser, dataArray, sourceNode;
let lastBlowTime = 0;

startBtn.addEventListener('click', async () => {
  if (listening) return;
  try {
    await initMic();
    startBtn.textContent = 'Listening... Blow to extinguish!';
  } catch (err) {
    message.textContent = 'Mic access failed. Check permissions.';
    console.error(err);
  }
});

async function initMic(){
  // user gesture happened (click), which helps browsers allow audio
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  sourceNode = audioCtx.createMediaStreamSource(stream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  sourceNode.connect(analyser);
  dataArray = new Uint8Array(analyser.fftSize);
  listening = true;
  message.textContent = 'Blow into your mic now!';
  window.requestAnimationFrame(checkBlow);
}

function computeRMS(buf){
  let sum = 0;
  for (let i=0;i<buf.length;i++){
    const v = (buf[i] - 128) / 128;
    sum += v*v;
  }
  return Math.sqrt(sum / buf.length);
}

function checkBlow(){
  analyser.getByteTimeDomainData(dataArray);
  const rms = computeRMS(dataArray); // ~0.01 quiet, >0.15 loud
  // threshold tuned to typical phone blow; tweak if needed
  const THRESHOLD = 0.17;
  if (rms > THRESHOLD && (Date.now() - lastBlowTime > 1200)) {
    lastBlowTime = Date.now();
    onBlowDetected();
  }
  window.requestAnimationFrame(checkBlow);
}

function onBlowDetected(){
  message.textContent = 'Nice! Candles blown 🎉';
  extinguishCandles();
  launchConfetti();
  playHappyAudio();
}

function extinguishCandles(){
  flames.forEach(f => {
    f.classList.add('out');
  });
}

function launchConfetti(){
  if (window.confetti) {
    confetti({
      particleCount: 140,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

function playHappyAudio(){
  // some browsers block autoplay — try to play, or show message if blocked
  if (!audio) return;
  audio.play().catch(()=> {
    // blocked by autoplay policies. show hint
    message.textContent = 'Tap Play to hear the song';
    // add a play button below
    addManualPlay();
  });
}

function addManualPlay(){
  if (document.getElementById('playManual')) return;
  const btn = document.createElement('button');
  btn.id = 'playManual';
  btn.className = 'btn';
  btn.textContent = 'Play song';
  btn.style.marginTop = '12px';
  btn.onclick = ()=> {
    audio.play();
    btn.remove();
  };
  document.querySelector('.card').appendChild(btn);
}
