/**
 * What To Wear — Card Deck Swapping Carousel & Text Sync
 * Slide transition: Top card shifts to left and neatly tucks behind the back of the stack!
 */

const HEADERS_CONFIG = [
  {
    title: "Organize Your Closet with fluid speed",
    subtitle: "Pinch to zoom between 3 levels - Google Photos style",
    images: [
      "Home_page.webp"
    ]
  },
  {
    title: "Bulk Select & tag in second",
    subtitle: "Multi-select outfits directly from gallery",
    images: [
      "Multi-select.webp"
    ]
  },
  {
    title: "On-Device AI/ML color detection",
    subtitle: "Auto-detect dominant color & fabric hex code",
    images: [
      "color-detection.webp"
    ]
  },
  {
    title: "Filter Instantly by color & tag",
    subtitle: "One tap to show Black Casual or Pink Forest",
    images: [
      "Sort-by-color-1.webp",
      "Sorty-by-tag-1.webp",
      "sort-by-tag-color.webp"
    ]
  },
  {
    title: "Custom wardrobe tags & palettes",
    subtitle: "Add custom tags, color & remain anytime",
    images: [
      "custom-tag.webp",
      "custom-color.webp"
    ]
  },
  {
    title: "Separate Closets For Partner / Kids",
    subtitle: "Switch profiles without mixing closets",
    images: [
      "Multiple Profile-1.webp",
      "Multiple-profile-2.webp",
      "multi-profile-home-page.webp",
      "multi-profile-sort-by-color.webp",
      "multi-profile-sort-by-tag.webp",
      "multi-profile-sort-by-tag-and-color-1.webp"
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

    const isHero = idx === 0;
    const isNext = idx === 1 || idx === 2;

    card.innerHTML = `
      <div class="camera-punch-hole"></div>
      <div class="screen-content">
        <img 
          src="${encodeURI(slide.image)}" 
          alt="${slide.headerTitle}" 
          loading="${isHero || isNext ? 'eager' : 'lazy'}"
          decoding="async"
          ${isHero ? 'fetchpriority="high"' : ''}
          width="640"
          height="1331"
        >
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
  preloadRemainingImages();
}

// Preload remaining deck images in background so transitions never lag
function preloadRemainingImages() {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      SLIDES.slice(3).forEach(slide => {
        const img = new Image();
        img.src = encodeURI(slide.image);
      });
    });
  } else {
    setTimeout(() => {
      SLIDES.slice(3).forEach(slide => {
        const img = new Image();
        img.src = encodeURI(slide.image);
      });
    }, 1200);
  }
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
  setupCheckoutHandler();
});

/* ==========================================================================
   RAZORPAY IN-PAGE CHECKOUT & SECURE EXPIRING DOWNLOAD MODAL
   ========================================================================== */
function setupCheckoutHandler() {
  const buyBtn = document.getElementById('buyApkBtn');
  const btnIcon = document.getElementById('btnIcon');
  const btnMainLabel = document.getElementById('btnMainLabel');
  const btnSubLabel = document.getElementById('btnSubLabel');

  const downloadModal = document.getElementById('downloadModal');
  const modalDownloadBtn = document.getElementById('modalDownloadBtn');
  const timerCountdown = document.getElementById('timerCountdown');

  if (!buyBtn) return;

  buyBtn.addEventListener('click', async () => {
    // 1. Loading State on Button
    buyBtn.disabled = true;
    const origIconClass = btnIcon.className;
    btnIcon.className = 'ph-bold ph-spinner ph-spin btn-wa-icon';
    btnMainLabel.textContent = 'Opening Secure Checkout...';
    btnSubLabel.textContent = 'Please wait a moment';

    try {
      // 2. Request new order from Netlify serverless function
      const orderRes = await fetch('/.netlify/functions/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!orderRes.ok) {
        throw new Error('Unable to create order. Please try again.');
      }

      const orderData = await orderRes.json();

      // 3. Configure Razorpay Standard Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'What To Wear',
        description: 'Smart Wardrobe & Outfit Organizer APK',
        image: 'https://whattowear-closet.netlify.app/app-logo.png',
        order_id: orderData.orderId,
        theme: {
          color: '#10B981'
        },
        modal: {
          ondismiss: function () {
            resetButtonState();
          }
        },
        handler: async function (response) {
          // 4. Payment Completed -> Verify & deliver APK
          btnMainLabel.textContent = 'Verifying Payment...';
          btnSubLabel.textContent = 'Preparing secure download link';

          try {
            const verifyRes = await fetch('/.netlify/functions/verify-and-download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.downloadUrl) {
              // 5. Open In-Page Download Screen & Auto-start Download
              openDownloadModal(verifyData.downloadUrl, verifyData.expiresInMinutes || 45);
            } else {
              alert('Payment received, but failed to generate download link: ' + (verifyData.error || 'Unknown error'));
            }
          } catch (err) {
            console.error('Verification error:', err);
            alert('Verification encountered an issue. Please contact support via WhatsApp with your Payment ID: ' + response.razorpay_payment_id);
          } finally {
            resetButtonState();
          }
        }
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (failRes) {
        resetButtonState();
        alert('Payment was not completed: ' + (failRes.error.description || 'Cancelled'));
      });

      rzp.open();
    } catch (err) {
      console.error('Checkout error:', err);
      // Fallback: If server function isn't configured yet, redirect to WhatsApp fallback
      if (confirm('Direct checkout is being finalized. Would you like to buy directly via WhatsApp for ₹49?')) {
        window.open('https://wa.me/919028873186?text=Hi%20Navid%2C%20I%20want%20to%20get%20the%20What%20To%20Wear%20app%20(%E2%82%B949)!', '_blank');
      }
      resetButtonState();
    }
  });

  function resetButtonState() {
    buyBtn.disabled = false;
    btnIcon.className = 'ph-bold ph-lightning btn-wa-icon';
    btnMainLabel.textContent = 'Get What To Wear';
    btnSubLabel.textContent = 'Instant Download • Pay via UPI';
  }

  // Handle Download Modal & Countdown Timer
  let countdownInterval = null;
  function openDownloadModal(url, minutes) {
    downloadModal.style.display = 'flex';
    modalDownloadBtn.href = url;

    // Trigger immediate automatic browser download
    const autoLink = document.createElement('a');
    autoLink.href = url;
    autoLink.download = 'WhatToWear.apk';
    document.body.appendChild(autoLink);
    autoLink.click();
    document.body.removeChild(autoLink);

    // 45:00 countdown timer
    let totalSeconds = minutes * 60;
    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      totalSeconds--;
      if (totalSeconds <= 0) {
        clearInterval(countdownInterval);
        timerCountdown.textContent = 'Expired';
        modalDownloadBtn.classList.add('disabled');
        modalDownloadBtn.removeAttribute('href');
        modalDownloadBtn.innerHTML = '<i class="ph-bold ph-x-circle"></i><span>Download Link Expired</span>';
        return;
      }

      const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
      const s = (totalSeconds % 60).toString().padStart(2, '0');
      timerCountdown.textContent = `${m}:${s}`;
    }, 1000);
  }
}
