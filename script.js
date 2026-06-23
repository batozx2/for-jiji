/*
  For Soujoud ❤️
  Plain JavaScript only: countdown, swipe gallery, lightbox, music,
  scroll reveal, ambient particles, confetti, and final redirect.
*/

(() => {
  "use strict";

  const sinceDate = new Date(2026, 5, 18, 0, 0, 0);
  const redirectUrl = "https://wa.me/212694249976";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Countdown ----------
  const countdownEls = {
    days: document.getElementById("days"),
    hours: document.getElementById("hours"),
    minutes: document.getElementById("minutes"),
    seconds: document.getElementById("seconds"),
  };

  function padTime(value) {
    return String(value).padStart(2, "0");
  }

  function updateCountdown() {
    const diff = Math.max(0, Date.now() - sinceDate.getTime());
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    countdownEls.days.textContent = String(days);
    countdownEls.hours.textContent = padTime(hours);
    countdownEls.minutes.textContent = padTime(minutes);
    countdownEls.seconds.textContent = padTime(seconds);
  }

  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  // ---------- Scroll reveal ----------
  const revealItems = document.querySelectorAll(".reveal-on-scroll");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  // ---------- Ambient hearts, roses, lilies, and sparkles ----------
  const ambientLayer = document.getElementById("ambient-layer");
  const ambientSymbols = [
    { text: "❤️", className: "is-heart", min: 18, max: 30 },
    { text: "♡", className: "is-heart", min: 18, max: 32 },
    { text: "🌹", className: "is-flower", min: 17, max: 27 },
    { text: "⚜", className: "is-flower", min: 17, max: 26 },
    { text: "✦", className: "is-sparkle", min: 13, max: 20 },
  ];

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createAmbientParticle() {
    if (!ambientLayer || reducedMotion) return;

    const symbol = ambientSymbols[Math.floor(Math.random() * ambientSymbols.length)];
    const particle = document.createElement("span");
    const duration = randomBetween(8, 15);
    const drift = randomBetween(-80, 80);
    const spin = randomBetween(-120, 120);

    particle.className = `ambient-particle ${symbol.className}`;
    particle.textContent = symbol.text;
    particle.style.setProperty("--x", `${randomBetween(0, 100)}vw`);
    particle.style.setProperty("--drift", `${drift}px`);
    particle.style.setProperty("--spin", `${spin}deg`);
    particle.style.setProperty("--opacity", String(randomBetween(0.48, 0.9)));
    particle.style.fontSize = `${randomBetween(symbol.min, symbol.max)}px`;
    particle.style.animationDuration = `${duration}s`;

    ambientLayer.appendChild(particle);
    window.setTimeout(() => particle.remove(), duration * 1000 + 250);
  }

  if (!reducedMotion) {
    for (let i = 0; i < 16; i += 1) {
      window.setTimeout(createAmbientParticle, i * 180);
    }
    window.setInterval(createAmbientParticle, 520);
  }

  // ---------- Music control ----------
  const music = document.getElementById("bg-music");
  const musicToggle = document.getElementById("music-toggle");
  const musicState = document.getElementById("music-state");
  let fallbackAudioContext = null;
  let fallbackNodes = [];
  let fallbackPlaying = false;

  function setMusicUi(isPlaying, label) {
    musicToggle.classList.toggle("is-playing", isPlaying);
    musicToggle.setAttribute("aria-label", isPlaying ? "Pause music" : "Play music");
    musicToggle.querySelector(".music-icon").textContent = isPlaying ? "Ⅱ" : "♪";
    musicState.textContent = label;
  }

  function stopFallbackPad() {
    fallbackNodes.forEach((node) => {
      try {
        node.stop();
      } catch {
        // Oscillators may already be stopped.
      }
    });
    fallbackNodes = [];
    fallbackPlaying = false;
  }

  async function startFallbackPad() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;

    if (!fallbackAudioContext) {
      fallbackAudioContext = new AudioContextClass();
    }

    if (fallbackAudioContext.state === "suspended") {
      await fallbackAudioContext.resume();
    }

    stopFallbackPad();

    const master = fallbackAudioContext.createGain();
    master.gain.setValueAtTime(0.0001, fallbackAudioContext.currentTime);
    master.gain.exponentialRampToValueAtTime(0.055, fallbackAudioContext.currentTime + 0.8);
    master.connect(fallbackAudioContext.destination);

    [261.63, 329.63, 392.0].forEach((frequency, index) => {
      const oscillator = fallbackAudioContext.createOscillator();
      const gain = fallbackAudioContext.createGain();
      oscillator.type = index === 1 ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.32;
      oscillator.connect(gain).connect(master);
      oscillator.start();
      fallbackNodes.push(oscillator);
    });

    fallbackPlaying = true;
    return true;
  }

  async function playMusic(options = {}) {
    const { allowFallback = true } = options;
    stopFallbackPad();

    try {
      await music.play();
      setMusicUi(true, "Playing");
      return;
    } catch {
      if (!allowFallback) {
        setMusicUi(false, "Tap to play");
        return;
      }
      const startedFallback = await startFallbackPad();
      setMusicUi(startedFallback, startedFallback ? "Playing preview" : "Tap to play");
    }
  }

  function pauseMusic() {
    music.pause();
    stopFallbackPad();
    setMusicUi(false, "Paused");
  }

  musicToggle.addEventListener("click", () => {
    if (!music.paused || fallbackPlaying) {
      pauseMusic();
      return;
    }
    playMusic();
  });

  music.addEventListener("play", () => setMusicUi(true, "Playing"));
  music.addEventListener("pause", () => {
    if (!fallbackPlaying) setMusicUi(false, "Paused");
  });
  music.addEventListener("error", () => setMusicUi(false, "Tap to play"));

  // Mobile browsers often allow autoplay only after a gesture; this retries once on first touch.
  window.addEventListener("load", () => {
    music.volume = 0.7;
    playMusic({ allowFallback: false });
  });

  window.addEventListener(
    "pointerdown",
    () => {
      if (music.paused && !fallbackPlaying) {
        playMusic();
      }
    },
    { once: true, passive: true }
  );

  // ---------- Swipe gallery and lightbox ----------
  const galleryFrame = document.getElementById("gallery-frame");
  const galleryTrack = document.getElementById("gallery-track");
  const slides = Array.from(document.querySelectorAll(".memory-slide"));
  const prevButton = document.querySelector(".gallery-prev");
  const nextButton = document.querySelector(".gallery-next");
  const dotsWrap = document.getElementById("gallery-dots");
  const imageModal = document.getElementById("image-modal");
  const modalImage = document.getElementById("modal-image");
  const modalClose = document.getElementById("modal-close");
  let currentSlide = 0;
  let startX = 0;
  let dragX = 0;
  let isDragging = false;
  let didDrag = false;

  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = "gallery-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Show photo ${index + 1}`);
    dot.addEventListener("click", () => showSlide(index));
    dotsWrap.appendChild(dot);
  });

  const dots = Array.from(dotsWrap.children);

  function showSlide(index, withTransition = true) {
    currentSlide = (index + slides.length) % slides.length;
    galleryTrack.style.transition = withTransition
      ? "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)"
      : "none";
    galleryTrack.style.transform = `translate3d(${-currentSlide * 100}%, 0, 0)`;

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === currentSlide);
      dot.setAttribute("aria-current", dotIndex === currentSlide ? "true" : "false");
    });
  }

  function endGalleryDrag() {
    if (!isDragging) return;

    const threshold = Math.min(80, galleryFrame.clientWidth * 0.18);
    isDragging = false;
    galleryTrack.style.transition = "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)";

    if (Math.abs(dragX) > threshold) {
      showSlide(currentSlide + (dragX < 0 ? 1 : -1));
    } else {
      showSlide(currentSlide);
    }

    window.setTimeout(() => {
      didDrag = false;
    }, 80);
  }

  galleryFrame.addEventListener("pointerdown", (event) => {
    isDragging = true;
    didDrag = false;
    startX = event.clientX;
    dragX = 0;
    galleryTrack.style.transition = "none";
  });

  galleryFrame.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    dragX = event.clientX - startX;
    if (Math.abs(dragX) > 8) didDrag = true;
    const percent = (dragX / galleryFrame.clientWidth) * 100;
    galleryTrack.style.transform = `translate3d(calc(${-currentSlide * 100}% + ${percent}%), 0, 0)`;
  });

  galleryFrame.addEventListener("pointerup", endGalleryDrag);
  galleryFrame.addEventListener("pointercancel", endGalleryDrag);
  prevButton.addEventListener("click", () => showSlide(currentSlide - 1));
  nextButton.addEventListener("click", () => showSlide(currentSlide + 1));

  document.querySelectorAll(".memory-tile").forEach((tile) => {
    tile.addEventListener("click", (event) => {
      if (didDrag) {
        event.preventDefault();
        return;
      }
      const image = tile.querySelector("img");
      modalImage.src = image.currentSrc || image.src;
      modalImage.alt = image.alt;
      imageModal.hidden = false;
      document.body.style.overflow = "hidden";
    });
  });

  function closeModal() {
    imageModal.hidden = true;
    modalImage.src = "";
    document.body.style.overflow = "";
  }

  modalClose.addEventListener("click", closeModal);
  imageModal.addEventListener("click", (event) => {
    if (event.target === imageModal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !imageModal.hidden) closeModal();
  });

  showSlide(0, false);

  // ---------- Confetti ----------
  const confettiCanvas = document.getElementById("confetti-canvas");
  const confettiContext = confettiCanvas.getContext("2d");
  let confettiPieces = [];
  let confettiAnimation = null;

  function resizeConfettiCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    confettiCanvas.width = Math.floor(window.innerWidth * ratio);
    confettiCanvas.height = Math.floor(window.innerHeight * ratio);
    confettiCanvas.style.width = `${window.innerWidth}px`;
    confettiCanvas.style.height = `${window.innerHeight}px`;
    confettiContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function makeConfettiPiece(originX, originY) {
    const colors = ["#ffffff", "#f9a8d4", "#c4b5fd", "#ddd6fe", "#fde68a", "#fb7185"];
    const angle = randomBetween(-Math.PI, 0);
    const speed = randomBetween(4, 13);

    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - randomBetween(2, 8),
      size: randomBetween(5, 10),
      rotation: randomBetween(0, Math.PI * 2),
      rotationSpeed: randomBetween(-0.24, 0.24),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      maxLife: randomBetween(80, 135),
    };
  }

  function drawConfetti() {
    confettiContext.clearRect(0, 0, window.innerWidth, window.innerHeight);

    confettiPieces = confettiPieces.filter((piece) => piece.life < piece.maxLife);
    confettiPieces.forEach((piece) => {
      piece.life += 1;
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.vy += 0.18;
      piece.vx *= 0.988;
      piece.rotation += piece.rotationSpeed;

      const alpha = 1 - piece.life / piece.maxLife;
      confettiContext.save();
      confettiContext.globalAlpha = Math.max(alpha, 0);
      confettiContext.translate(piece.x, piece.y);
      confettiContext.rotate(piece.rotation);
      confettiContext.fillStyle = piece.color;
      confettiContext.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.62);
      confettiContext.restore();
    });

    if (confettiPieces.length > 0) {
      confettiAnimation = window.requestAnimationFrame(drawConfetti);
    } else {
      confettiAnimation = null;
      confettiContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  function launchConfetti(amount = 190) {
    if (reducedMotion) return;
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight * 0.72;

    for (let i = 0; i < amount; i += 1) {
      confettiPieces.push(makeConfettiPiece(originX, originY));
    }

    if (!confettiAnimation) {
      confettiAnimation = window.requestAnimationFrame(drawConfetti);
    }
  }

  resizeConfettiCanvas();
  window.addEventListener("resize", resizeConfettiCanvas, { passive: true });

  // ---------- Final YES / NO interaction ----------
  const proposalCard = document.getElementById("proposal-card");
  const loveQuestion = document.getElementById("love-question");
  const choiceRow = document.getElementById("choice-row");
  const yesMessage = document.getElementById("yes-message");
  let noClicks = 0;
  let accepted = false;

  function turnNoIntoYes() {
    const buttons = choiceRow.querySelectorAll(".choice-button");
    buttons.forEach((button) => {
      button.textContent = "YES ❤️";
      button.dataset.choice = "yes";
      button.classList.remove("no-button");
      button.classList.add("yes-button");
      button.removeAttribute("id");
      button.setAttribute("aria-label", "Yes");
    });
    proposalCard.dataset.noClicks = "5";
  }

  function burstHearts() {
    if (reducedMotion) return;
    for (let i = 0; i < 34; i += 1) {
      window.setTimeout(() => {
        const heart = document.createElement("span");
        heart.className = "ambient-particle is-heart";
        heart.textContent = i % 3 === 0 ? "❤️" : "♡";
        heart.style.setProperty("--x", `${randomBetween(12, 88)}vw`);
        heart.style.setProperty("--drift", `${randomBetween(-110, 110)}px`);
        heart.style.setProperty("--spin", `${randomBetween(-160, 160)}deg`);
        heart.style.setProperty("--opacity", "0.95");
        heart.style.fontSize = `${randomBetween(24, 42)}px`;
        heart.style.animationDuration = `${randomBetween(3.8, 6.5)}s`;
        ambientLayer.appendChild(heart);
        window.setTimeout(() => heart.remove(), 6800);
      }, i * 45);
    }
  }

  function acceptLove() {
    if (accepted) return;
    accepted = true;
    yesMessage.hidden = false;
    document.body.classList.add("celebrating");
    launchConfetti(260);
    burstHearts();
    playMusic();

    window.setTimeout(() => {
      window.location.assign(redirectUrl);
    }, 2000);
  }

  choiceRow.addEventListener("click", (event) => {
    const button = event.target.closest(".choice-button");
    if (!button) return;

    if (button.dataset.choice === "yes") {
      acceptLove();
      return;
    }

    noClicks += 1;
    proposalCard.dataset.noClicks = String(Math.min(noClicks, 5));

    if (noClicks === 1) {
      loveQuestion.textContent = "Do you love me? ❤️";
    }

    if (noClicks >= 5) {
      turnNoIntoYes();
    }
  });
})();
