const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a, .header-cta");
const hero = document.querySelector(".hero");
const heroLogoWrap = document.querySelector(".hero-logo-wrap");
const dragCarousels = document.querySelectorAll(".drag-carousel");
const creditCards = document.querySelectorAll(".credit-card");
const audioTracks = document.querySelectorAll(".audio-track");
const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox.querySelector("img");
const lightboxTitle = lightbox.querySelector("h3");
const lightboxRole = lightbox.querySelector("p:last-child");
const lightboxClose = document.querySelector(".lightbox-close");
let lastCarouselDragDistance = 0;
let activeAudio = null;
let activeAudioButton = null;
let activeAudioTrack = null;

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
};

navToggle.addEventListener("click", () => {
  const isOpen = header.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    header.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");

    if (link.getAttribute("href") === "#sonido") {
      event.preventDefault();
      document.querySelector("#sonido").scrollIntoView({ behavior: "smooth", block: "center" });
      history.replaceState(null, "", "#sonido");
    }
  });
});

const openLightbox = (card) => {
  const title = card.dataset.title;
  const role = card.dataset.role;
  const image = card.dataset.image;

  lightboxImage.src = image;
  lightboxImage.alt = `Póster de ${title}`;
  lightboxTitle.textContent = title;
  lightboxRole.textContent = role;
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
};

const closeLightbox = () => {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
};

const updateHeroScroll = () => {
  const heroHeight = hero.offsetHeight || 1;
  const progress = Math.min(Math.max(window.scrollY / (heroHeight * 0.72), 0), 1);

  document.documentElement.style.setProperty("--hero-scroll", progress.toFixed(3));
  document.body.classList.toggle("is-scrolled", progress > 0.22);
};

const resetHeroTilt = () => {
  document.documentElement.style.setProperty("--hero-tilt-x", "0deg");
  document.documentElement.style.setProperty("--hero-tilt-y", "0deg");
  document.documentElement.style.setProperty("--hero-shift-x", "0px");
  document.documentElement.style.setProperty("--hero-shift-y", "0px");
};

heroLogoWrap.addEventListener("pointermove", (event) => {
  const rect = heroLogoWrap.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;

  document.documentElement.style.setProperty("--hero-tilt-x", `${(x * 9).toFixed(2)}deg`);
  document.documentElement.style.setProperty("--hero-tilt-y", `${(-y * 7).toFixed(2)}deg`);
  document.documentElement.style.setProperty("--hero-shift-x", `${(x * 12).toFixed(1)}px`);
  document.documentElement.style.setProperty("--hero-shift-y", `${(y * 10).toFixed(1)}px`);
});

heroLogoWrap.addEventListener("pointerleave", resetHeroTilt);

window.addEventListener("scroll", updateHeroScroll, { passive: true });
window.addEventListener("resize", updateHeroScroll);
updateHeroScroll();

const enableDragCarousel = (carousel) => {
  let isDragging = false;
  let dragStartX = 0;
  let dragStartScrollLeft = 0;
  let dragDistance = 0;

  carousel.addEventListener("pointerdown", (event) => {
    isDragging = true;
    dragStartX = event.clientX;
    dragStartScrollLeft = carousel.scrollLeft;
    dragDistance = 0;
    lastCarouselDragDistance = 0;
    carousel.classList.add("is-dragging");
    carousel.setPointerCapture(event.pointerId);
  });

  carousel.addEventListener("pointermove", (event) => {
    if (!isDragging) {
      return;
    }

    dragDistance = event.clientX - dragStartX;
    lastCarouselDragDistance = dragDistance;
    carousel.scrollLeft = dragStartScrollLeft - dragDistance;
  });

  const endDrag = (event) => {
    if (!isDragging) {
      return;
    }

    isDragging = false;
    carousel.classList.remove("is-dragging");

    if (carousel.hasPointerCapture(event.pointerId)) {
      carousel.releasePointerCapture(event.pointerId);
    }
  };

  carousel.addEventListener("pointerup", endDrag);
  carousel.addEventListener("pointercancel", endDrag);
  carousel.addEventListener("pointerleave", endDrag);
};

dragCarousels.forEach(enableDragCarousel);

const resetAudioTrack = (track) => {
  if (!track) {
    return;
  }

  const button = track.querySelector(".audio-play");
  const progress = track.querySelector(".audio-progress");
  const time = track.querySelector("time");

  button.classList.remove("is-playing");
  button.textContent = "Play";
  progress.value = "0";
  time.textContent = "0:00";
};

audioTracks.forEach((track) => {
  const button = track.querySelector(".audio-play");
  const progress = track.querySelector(".audio-progress");
  const time = track.querySelector("time");

  button.addEventListener("click", () => {
    if (activeAudioButton === button && activeAudio && !activeAudio.paused) {
      activeAudio.pause();
      button.classList.remove("is-playing");
      button.textContent = "Play";
      return;
    }

    if (activeAudioButton === button && activeAudio && activeAudio.paused) {
      button.classList.add("is-playing");
      button.textContent = "Pause";
      activeAudio.play().catch(() => {
        resetAudioTrack(track);
        activeAudio = null;
        activeAudioButton = null;
        activeAudioTrack = null;
      });
      return;
    }

    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      resetAudioTrack(activeAudioTrack);
    }

    activeAudio = new Audio(button.dataset.audio);
    activeAudioButton = button;
    activeAudioTrack = track;
    button.classList.add("is-playing");
    button.textContent = "Pause";

    activeAudio.addEventListener("timeupdate", () => {
      if (!activeAudio || activeAudioTrack !== track || !Number.isFinite(activeAudio.duration)) {
        return;
      }

      progress.value = String((activeAudio.currentTime / activeAudio.duration) * 100);
      time.textContent = `${formatTime(activeAudio.currentTime)} / ${formatTime(activeAudio.duration)}`;
    });

    activeAudio.play().catch(() => {
      resetAudioTrack(track);
      activeAudio = null;
      activeAudioButton = null;
      activeAudioTrack = null;
    });

    activeAudio.addEventListener("ended", () => {
      resetAudioTrack(track);
      activeAudio = null;
      activeAudioButton = null;
      activeAudioTrack = null;
    });
  });

  progress.addEventListener("input", () => {
    if (!activeAudio || activeAudioTrack !== track || !Number.isFinite(activeAudio.duration)) {
      return;
    }

    activeAudio.currentTime = (Number(progress.value) / 100) * activeAudio.duration;
  });
});

creditCards.forEach((card) => {
  card.addEventListener("click", () => {
    if (Math.abs(lastCarouselDragDistance) > 8) {
      return;
    }

    openLightbox(card);
  });
});

lightboxClose.addEventListener("click", closeLightbox);

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
    closeLightbox();
  }
});
