/**
 * What To Wear — Card Deck Swapping Carousel & Text Sync
 * Slide transition: Top card shifts to left and neatly tucks behind the back of the stack!
 */

const HEADERS_CONFIG = [
  {
    title: "Organize Your Closet with fluid speed",
    subtitle: "Pinch to zoom between 3 levels - Google Photos style",
    images: [
      "Home_page.jpg"
    ]
  },
  {
    title: "Bulk Select & tag in second",
    subtitle: "Multi-select outfits directly from gallery",
    images: [
      "Multi-select.jpg"
    ]
  },
  {
    title: "On-Device AI/ML color detection",
    subtitle: "Auto-detect dominant color & fabric hex code",
    images: [
      "color-detection.jpg"
    ]
  },
  {
    title: "Filter Instantly by color & tag",
    subtitle: "One tap to show Black Casual or Pink Forest",
    images: [
      "Sort-by-color-1.jpg",
      "Sorty-by-tag-1.jpg",
      "sort-by-tag-color.jpg"
    ]
  },
  {
    title: "Custom wardrobe tags & palettes",
    subtitle: "Add custom tags, color & remain anytime",
    images: [
      "custom-tag.jpg",
      "custom-color.jpg"
    ]
  },
  {
    title: "Separate Closets For Partner / Kids",
    subtitle: "Switch profiles without mixing closets",
    images: [
      "Multiple Profile-1.jpg",
      "Multiple-profile-2.jpg",
      "multi-profile-home-page.jpg",
      "multi-profile-sort-by-color.jpg",
      "multi-profile-sort-by-tag.jpg",
      "multi-profile-sort-by-tag-and-color-1.jpg"
    ]
  }
];

// Flatten all items into unified sequence with header reference
const SLIDES = [];
HEADERS_CONFIG.forEach((section, sIdx) => {
  section.images.forEach((imgFile, imgIdx) => {
    SLIDES.push({
      headerTitle: section.title,
      headerSubtitle: section.subtitle,
      image: imgFile,
      sectionIndex: sIdx,
      isFirstOfSection: imgIdx === 0
    });
  });
});

let currentSlideIdx = 0;
let isFlipping = false;
let autoCycleTimer = null;

// DOM Elements
const headerTitle = document.getElementById('headerTitle');
const headerSubtitle = document.getElementById('headerSubtitle');
const deckWrapper = document.getElementById('deckWrapper');

// Build initial 3D deck
function initDeck() {
  deckWrapper.innerHTML = '';

  SLIDES.forEach((slide, idx) => {
    const card = document.createElement('div');
    card.className = 'phone-mockup-card';
    card.dataset.index = idx;

    card.innerHTML = `
      <div class="camera-punch-hole"></div>
      <div class="screen-content">
        <img src="${encodeURI(slide.image)}" alt="${slide.headerTitle}" loading="${idx < 3 ? 'eager' : 'lazy'}">
      </div>
    `;

    // Click card to swap/flip to next
    card.addEventListener('click', () => {
      if (!isFlipping) {
        swapToNextCard();
        resetTimer();
      }
    });

    deckWrapper.appendChild(card);
  });

  updateStackPositions();
  updateHeaderText(0, true);
}

// Update card positions in the 3D stack
function updateStackPositions() {
  const cards = deckWrapper.querySelectorAll('.phone-mockup-card');
  const total = SLIDES.length;

  cards.forEach((card, idx) => {
    const relativePos = (idx - currentSlideIdx + total) % total;

    card.classList.remove('stack-top', 'stack-second', 'stack-third', 'stack-hidden', 'card-sliding-to-back');

    if (relativePos === 0) {
      card.classList.add('stack-top');
    } else if (relativePos === 1) {
      card.classList.add('stack-second');
    } else if (relativePos === 2) {
      card.classList.add('stack-third');
    } else {
      card.classList.add('stack-hidden');
    }
  });
}

// Update Header Text with quick fade animation
function updateHeaderText(targetSlideIdx, immediate = false) {
  const target = SLIDES[targetSlideIdx];
  const currentTitle = headerTitle.textContent;

  if (!immediate && currentTitle === target.headerTitle) {
    return;
  }

  if (immediate) {
    headerTitle.textContent = target.headerTitle;
    headerSubtitle.textContent = target.headerSubtitle;
    headerTitle.style.opacity = '1';
    headerSubtitle.style.opacity = '1';
    return;
  }

  // Quick fade
  headerTitle.style.opacity = '0';
  headerTitle.style.transform = 'translateY(-2px)';
  headerSubtitle.style.opacity = '0';
  headerSubtitle.style.transform = 'translateY(2px)';

  setTimeout(() => {
    headerTitle.textContent = target.headerTitle;
    headerSubtitle.textContent = target.headerSubtitle;

    headerTitle.style.opacity = '1';
    headerTitle.style.transform = 'translateY(0)';
    headerSubtitle.style.opacity = '1';
    headerSubtitle.style.transform = 'translateY(0)';
  }, 140);
}

// Perform deck card swap: pulls out slightly left, dives down in Z-index, and tucks right behind the stack
function swapToNextCard() {
  if (isFlipping) return;
  isFlipping = true;

  const topCard = deckWrapper.querySelector(`.phone-mockup-card[data-index="${currentSlideIdx}"]`);
  if (topCard) {
    topCard.classList.add('card-sliding-to-back');
  }

  const nextSlideIdx = (currentSlideIdx + 1) % SLIDES.length;
  updateHeaderText(nextSlideIdx);

  // Fast, crisp 260ms tuck before organizing next stack
  setTimeout(() => {
    currentSlideIdx = nextSlideIdx;
    updateStackPositions();
    isFlipping = false;
  }, 260);
}

// Previous card (reverse swap)
function swapToPrevCard() {
  if (isFlipping) return;
  isFlipping = true;

  currentSlideIdx = (currentSlideIdx - 1 + SLIDES.length) % SLIDES.length;
  updateHeaderText(currentSlideIdx);
  updateStackPositions();

  setTimeout(() => {
    isFlipping = false;
  }, 240);
}

// Auto Cycle Loop (Swaps card smoothly every 3.8s)
function startAutoCycle() {
  stopAutoCycle();
  autoCycleTimer = setInterval(swapToNextCard, 3800);
}

function stopAutoCycle() {
  if (autoCycleTimer) {
    clearInterval(autoCycleTimer);
    autoCycleTimer = null;
  }
}

function resetTimer() {
  stopAutoCycle();
  startAutoCycle();
}

// Touch swipe gestures
let startX = 0;
let startY = 0;

deckWrapper.addEventListener('touchstart', (e) => {
  startX = e.changedTouches[0].screenX;
  startY = e.changedTouches[0].screenY;
  stopAutoCycle();
}, { passive: true });

deckWrapper.addEventListener('touchend', (e) => {
  const diffX = e.changedTouches[0].screenX - startX;
  const diffY = e.changedTouches[0].screenY - startY;

  if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX < 0) {
      swapToNextCard(); // Swipe left -> advance
    } else {
      swapToPrevCard(); // Swipe right -> back
    }
  }
  startAutoCycle();
}, { passive: true });

// Keyboard arrows support
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') {
    swapToNextCard();
    resetTimer();
  } else if (e.key === 'ArrowLeft') {
    swapToPrevCard();
    resetTimer();
  }
});

// Pause on mouse hover over mockup
deckWrapper.addEventListener('mouseenter', stopAutoCycle);
deckWrapper.addEventListener('mouseleave', startAutoCycle);

// Initialize when ready
document.addEventListener('DOMContentLoaded', () => {
  initDeck();
  startAutoCycle();
});
