import * as THREE from "three";
let scene, camera, renderer;
let polyhedronMesh = null;

// Constants and variables for animation
const polyScale = 0.3;
let velX = 20;
let velY = 20;
let velZ = 20;
let polySize = 30;
let colorR = 127,
  colorG = 127,
  colorB = 255;
let currentSides = 6;

// Animation state
let isAnimating = true;
let wasAnimating = false;
let isMouseDown = false;
let isTouchDrag = false;

// Mouse tracking for manual rotation
let lastMouseX = 0;
let lastMouseY = 0;

init();
animate();

function init() {
  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 100;

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 10, 10);
  scene.add(dirLight);

  // Create initial polyhedron mesh
  createPolyhedronMesh(currentSides);
  setupEventListeners();
  adjustMeshPositionForMobile();

  // Manual Rotation
  renderer.domElement.addEventListener("mousedown", onMouseDown, false);
  renderer.domElement.addEventListener("mousemove", onMouseMove, false);
  renderer.domElement.addEventListener("mouseup", onMouseUp, false);

  renderer.domElement.addEventListener("touchstart", onTouchStart, false);
  renderer.domElement.addEventListener("touchmove", onTouchMove, false);
  renderer.domElement.addEventListener("touchend", onTouchEnd, false);

  window.addEventListener("resize", onWindowResize, false);
}

function createPolyhedronMesh(numFaces) {
  let oldRotation = new THREE.Euler(0, 0, 0);
  if (polyhedronMesh) {
    oldRotation.copy(polyhedronMesh.rotation);
    scene.remove(polyhedronMesh);

    polyhedronMesh.geometry.dispose();
    polyhedronMesh.material.dispose();
    polyhedronMesh = null;
  }

  const geometry = getGeometry(numFaces);

  const material = new THREE.MeshPhongMaterial({
    color: new THREE.Color(colorR / 255, colorG / 255, colorB / 255),
    shininess: 50,
  });

  polyhedronMesh = new THREE.Mesh(geometry, material);

  const s = polySize * polyScale;
  polyhedronMesh.scale.set(s, s, s);

  polyhedronMesh.rotation.copy(oldRotation);

  scene.add(polyhedronMesh);
}

function getGeometry(numFaces) {
  switch (numFaces) {
    case 4:
      return new THREE.TetrahedronGeometry(1, 0);
    case 6:
      return new THREE.BoxGeometry(1, 1, 1);
    case 8:
      return new THREE.OctahedronGeometry(1, 0);
    case 10:
      let vertices = [0, 0, 1, 0, 0, -1];
      let pentagonCount = 5;
      for (let i = 0; i < pentagonCount; i++) {
        let angle = (2 * Math.PI * i) / pentagonCount;
        let x = Math.cos(angle);
        let y = Math.sin(angle);
        vertices.push(x, y, 0);
      }
      let indices = [
        0, 2, 3, 0, 3, 4, 0, 4, 5, 0, 5, 6, 0, 6, 2, 1, 4, 3, 1, 5, 4, 1, 6, 5,
        1, 2, 6, 1, 3, 2,
      ];
      return new THREE.PolyhedronGeometry(vertices, indices, 1, 0);
    case 12:
      return new THREE.DodecahedronGeometry(1, 0);
    case 20:
      return new THREE.IcosahedronGeometry(1, 0);
    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

function setupEventListeners() {
  const playPauseBtn = document.getElementById("playPauseBtn");
  playPauseBtn.addEventListener("click", toggleAnimation);

  // Radio buttons for polyhedron faces
  const radios = document.querySelectorAll('input[name="sides"]');
  radios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      currentSides = parseInt(e.target.value);
      createPolyhedronMesh(currentSides);
    });
  });

  const sidesSelect = document.getElementById("sidesSelect");
  sidesSelect.addEventListener("change", (e) => {
    currentSides = parseInt(e.target.value);
    createPolyhedronMesh(currentSides);
  });

  // Sliders
  const sliderVelX = document.getElementById("velX");
  const sliderVelY = document.getElementById("velY");
  const sliderSize = document.getElementById("size");
  const sliderR = document.getElementById("red");
  const sliderG = document.getElementById("green");
  const sliderB = document.getElementById("blue");
  const sliderVelZ = document.getElementById("velZ");

  sliderVelX.addEventListener("input", () => {
    velX = parseFloat(sliderVelX.value);
    document.getElementById("velXVal").textContent = velX;
  });

  sliderVelY.addEventListener("input", () => {
    velY = parseFloat(sliderVelY.value);
    document.getElementById("velYVal").textContent = velY;
  });

  sliderVelZ.addEventListener("input", () => {
    velZ = parseFloat(sliderVelZ.value);
    document.getElementById("velZVal").textContent = velZ;
  });

  sliderSize.addEventListener("input", () => {
    polySize = parseFloat(sliderSize.value);
    document.getElementById("sizeVal").textContent = polySize;
    if (polyhedronMesh) {
      const s = polySize * polyScale;
      polyhedronMesh.scale.set(s, s, s);
    }
  });

  sliderR.addEventListener("input", () => {
    colorR = parseInt(sliderR.value);
    document.getElementById("redVal").textContent = colorR;
    updateColor();
  });

  sliderG.addEventListener("input", () => {
    colorG = parseInt(sliderG.value);
    document.getElementById("greenVal").textContent = colorG;
    updateColor();
  });

  sliderB.addEventListener("input", () => {
    colorB = parseInt(sliderB.value);
    document.getElementById("blueVal").textContent = colorB;
    updateColor();
  });

  // Expand/Collapse functionality
  const controlHeader = document.getElementById("controlHeader");
  const expandCollapseBtn = document.getElementById("expandCollapseBtn");
  const controlsContent = document.getElementById("controlsContent");

  controlHeader.addEventListener("click", () => {
    if (controlsContent.style.display === "none") {
      // Expand
      controlsContent.style.display = "block";
      expandCollapseBtn.textContent = "–";
    } else {
      // Collapse
      controlsContent.style.display = "none";
      expandCollapseBtn.textContent = "+";
    }
    adjustMeshPositionForMobile(); // Added to reposition after toggle
  });

  // Spacebar toggles play/pause
  window.addEventListener("keydown", (e) => {
    // e.code === 'Space' works in most modern browsers
    if (e.code === "Space") {
      e.preventDefault();
      toggleAnimation();
    }
  });
}

function toggleAnimation() {
  if (isMouseDown) return; // Don’t interrupt a manual rotate
  console.log(
    `Toggled from ${isAnimating ? "playing" : "paused"} to ${
      !isAnimating ? "playing" : "paused"
    }`
  );
  isAnimating = !isAnimating;
  document.getElementById("playPauseBtn").textContent = isAnimating
    ? "Pause"
    : "Play";
}

function updateColor() {
  if (polyhedronMesh && polyhedronMesh.material) {
    polyhedronMesh.material.color.setRGB(
      colorR / 255,
      colorG / 255,
      colorB / 255
    );
  }
}

function onMouseDown(event) {
  if (event.button !== 0) return;
  isMouseDown = true;

  // If it was animating, pause during drag
  wasAnimating = isAnimating;
  if (wasAnimating) {
    isAnimating = false;
  }
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
}

function onMouseMove(event) {
  if (!isMouseDown) return;

  const deltaX = event.clientX - lastMouseX;
  const deltaY = event.clientY - lastMouseY;

  if (polyhedronMesh) {
    polyhedronMesh.rotation.x += deltaY * 0.005;
    polyhedronMesh.rotateOnWorldAxis(
      new THREE.Vector3(0, 1, 0),
      deltaX * 0.005
    );
  }

  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
}

function onMouseUp(event) {
  if (event.button !== 0) return;
  isMouseDown = false;

  // If it was animating prior to drag, resume
  if (wasAnimating) {
    isAnimating = true;
  }
}

function onTouchStart(event) {
  if (event.touches.length === 1) {
    event.preventDefault();
    isMouseDown = true;
    isTouchDrag = false;
    wasAnimating = isAnimating;
    if (wasAnimating) {
      isAnimating = false;
    }
    lastMouseX = event.touches[0].clientX;
    lastMouseY = event.touches[0].clientY;
  }
}

function onTouchMove(event) {
  if (!isMouseDown || event.touches.length !== 1) return;
  const deltaX = event.touches[0].clientX - lastMouseX;
  const deltaY = event.touches[0].clientY - lastMouseY;

  // Lowered threshold to reduce accidental drags
  if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
    isTouchDrag = true;
  }
  if (polyhedronMesh) {
    polyhedronMesh.rotation.x += deltaY * 0.005;
    polyhedronMesh.rotateOnWorldAxis(
      new THREE.Vector3(0, 1, 0),
      deltaX * 0.005
    );
  }
  lastMouseX = event.touches[0].clientX;
  lastMouseY = event.touches[0].clientY;
}

function onTouchEnd(event) {
  if (event.touches.length > 0) return;
  event.preventDefault();
  isMouseDown = false;

  // Tap toggles animation, drag resumes if it was animating
  if (!isTouchDrag) {
    isAnimating = !wasAnimating;
  } else if (wasAnimating) {
    isAnimating = true;
  }
  isTouchDrag = false;
}

function animate() {
  requestAnimationFrame(animate);

  if (polyhedronMesh && isAnimating) {
    // Multiply by small factor for smooth rotation
    polyhedronMesh.rotation.x += velY * 0.001;
    polyhedronMesh.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), velX * 0.001);
    polyhedronMesh.rotateOnWorldAxis(new THREE.Vector3(0, 0, -1), velZ * 0.001);
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  adjustMeshPositionForMobile();
}

function adjustMeshPositionForMobile() {
  if (window.innerWidth <= 600) {
    const controlsContent = document.getElementById("controlsContent");
    if (controlsContent.style.display !== "none") {
      polyhedronMesh.position.y = 15; // Only shift if control panel is open
    } else {
      polyhedronMesh.position.y = 0;
    }
  } else {
    polyhedronMesh.position.y = 0;
  }
}
