const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const timerDisplay = document.getElementById("timer");
const warningText = document.getElementById("warning");

let fahhh = new Audio("fahhh.mp3");
let noice = new Audio("noice.mp3");

let endTime;
let awayFrames = 0;
let totalFrames = 0;
let focusedFrames = 0;

let model;

const STRICT_DELAY = 30;

document.getElementById("startBtn").addEventListener("click", async () => {
  await startSession();
});

async function startSession() {
  let minutes = document.getElementById("timeInput").value;

  if (!minutes || minutes <= 0) {
    alert("Enter valid time");
    return;
  }

  endTime = Date.now() + minutes * 60000;

  await loadModel();
  await startCamera();
  updateTimer();
}

// 📱 Load model
async function loadModel() {
  model = await cocoSsd.load();
  console.log("Model loaded");
}

// 🎥 Camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (err) {
    alert("Camera access denied!");
    return;
  }

  const faceMesh = new FaceMesh({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true
  });

  faceMesh.onResults(results => {
    let now = Date.now();

    if (now > endTime) {
      let score = totalFrames > 0 ? (focusedFrames / totalFrames) * 100 : 0;
      alert(`🎯 Focus Score: ${score.toFixed(1)}%`);
      noice.play();
      return;
    }

    totalFrames++;

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      awayFrames++;
      warningText.innerText = "👻 YOU VANISHED INTO SPACE";
      return;
    }

    const lm = results.multiFaceLandmarks[0];

    let nose = lm[1];
    let leftEye = lm[33];
    let rightEye = lm[263];

    let lookingAway = (nose.x < 0.4 || nose.x > 0.6);
    let eyeClosed = Math.abs(leftEye.y - rightEye.y) < 0.01;

    if (lookingAway || eyeClosed) {
      awayFrames++;
     warningText.innerText = "STAY FOCUSED 💅";

      if (awayFrames > STRICT_DELAY) {
        fahhh.play();
        awayFrames = 0;
      }
    } else {
      focusedFrames++;
      awayFrames = 0;
      warningText.innerText = "";
    }
  });

  const camera = new Camera(video, {
    onFrame: async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      await faceMesh.send({ image: video });
      await detectPhone();
    }
  });

  camera.start();
}

// 📱 Phone detection + BOX
async function detectPhone() {
  if (!model) return;

  const predictions = await model.detect(video);

  for (let p of predictions) {
    if (p.class === "cell phone" && p.score > 0.5) {

     warningText.innerText = "📱 COSMIC VIOLATION 💅";

      const [x, y, width, height] = p.bbox;

      // Draw box
      ctx.strokeStyle = "red";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = "red";
      ctx.fillText("PHONE", x, y - 10);

      fahhh.play();
      return;
    }
  }
}

// ⏱️ Timer
function updateTimer() {
  const interval = setInterval(() => {
    let remaining = endTime - Date.now();

    if (remaining <= 0) {
      clearInterval(interval);
      timerDisplay.innerText = "00:00";
      return;
    }

    let min = Math.floor(remaining / 60000);
    let sec = Math.floor((remaining % 60000) / 1000);

    timerDisplay.innerText =
      `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }, 1000);
}
const starCanvas = document.getElementById("stars");
const starCtx = starCanvas.getContext("2d");

starCanvas.width = window.innerWidth;
starCanvas.height = window.innerHeight;

let stars = [];

for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * starCanvas.width,
    y: Math.random() * starCanvas.height,
    size: Math.random() * 2,
    speed: Math.random() * 0.5
  });
}

function drawStars() {
  starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);

  starCtx.fillStyle = "white";

  stars.forEach(s => {
    starCtx.beginPath();
    starCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    starCtx.fill();

    s.y += s.speed;
    if (s.y > starCanvas.height) s.y = 0;
  });

  requestAnimationFrame(drawStars);
}

drawStars();
document.addEventListener("mousemove", e => {
  const sparkle = document.createElement("div");

  sparkle.style.position = "fixed";
  sparkle.style.left = e.clientX + "px";
  sparkle.style.top = e.clientY + "px";
  sparkle.style.width = "6px";
  sparkle.style.height = "6px";
  sparkle.style.background = "pink";
  sparkle.style.borderRadius = "50%";
  sparkle.style.pointerEvents = "none";
  sparkle.style.boxShadow = "0 0 10px pink, 0 0 20px white";

  document.body.appendChild(sparkle);

  setTimeout(() => sparkle.remove(), 300);
});