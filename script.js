/* script.js (final)
   NOTE: only JS changed — HTML/CSS left identical.
   Changes:
   - Mousemove handled via requestAnimationFrame for performance
   - Cached bounding rect to avoid frequent layout reads
   - "Thickening" effect applied when hovered and moving
   - Default export pixelRatio lowered to 2 for lighter export (adjustable)
   - After download: copy text + image to clipboard if supported, try navigator.share, open X compose intent with text prefilled
   - Original preview popup code preserved (unmodified)
*/

/* -------------------------
   Theme definitions
   ------------------------- */
const themes = {
  cosmic: {
    name: 'Cosmic',
    background: 'linear-gradient(135deg, #42444aff 0%, #764ba2 50%, #f093fb 100%)',
    accent: '#f093fb',
    textColor: 'light',
    hologram: 'cosmic'
  },
  neon: {
    name: 'Neon Cyber',
    background: 'linear-gradient(135deg, #ffffffff 0%, #16213e 50%, #081d36ff 100%)',
    accent: '#00d9ff',
    textColor: 'light',
    hologram: 'neon'
  },
  ocean: {
    name: 'Ocean Depths',
    background: 'linear-gradient(135deg, #667db6  0%, #00deb1ff 50%, #ffd500ff 100%)',
    accent: '#00ff9f',
    textColor: 'light',
    hologram: 'ocean'
  },
  fire: {
    name: 'Flame Core',
    background: 'linear-gradient(135deg, #fff5f6ff 0%, #ff6a88 50%, #ff416c 100%)',
    accent: '#ff6a88',
    textColor: 'light',
    hologram: 'fire'
  },
  sunset: {
    name: 'Sunset Glow',
    background: 'linear-gradient(135deg, #ff6e7f 0%, #60c7ffff 50%, #a23ddcff 100%)',
    accent: '#a23ddc',
    textColor: 'light',
    hologram: 'sunset'
  },
  midnight: {
    name: 'Midnight',
    background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #0084ffff 100%)',
    accent: '#3498db',
    textColor: 'light',
    hologram: 'midnight'
  },
  royal: {
    name: 'Royal Purple',
    background: 'linear-gradient(135deg, #8e2de2 0%, #00ffda 50%, #b721ff 100%)',
    accent: '#b721ff',
    textColor: 'light',
    hologram: 'royal'
  },
  azure: {
    name: 'Azure Sky',
    background: 'linear-gradient(135deg, #df510fff 0%, #464646ff 50%, #ffd900ff 100%)',
    accent: '#0084ff',
    textColor: 'light',
    hologram: 'azure'
  }
};

/* -------------------------
   State & Cached DOM
   ------------------------- */
let currentTheme = 'cosmic';
let mouseX = 50;
let mouseY = 50;

// DOM Elements (cached)
const nftCard = document.getElementById('nftCard');
const cardTitle = document.getElementById('cardTitle');
const cardDescription = document.getElementById('cardDescription');
const cardRarity = document.getElementById('cardRarity');
const cardNumber = document.getElementById('cardNumber');
const cardOwner = document.getElementById('cardOwner');
const themeSelect = document.getElementById('themeSelect');
const fontSelect = document.getElementById('fontSelect');
const downloadBtn = document.getElementById('downloadBtn');
const themeGrid = document.getElementById('themeGrid');

const displayTitle = document.getElementById('displayTitle');
const displayDescription = document.getElementById('displayDescription');
const displayRarity = document.getElementById('displayRarity');
const displayNumber = document.getElementById('displayNumber');
const displayOwner = document.getElementById('displayOwner');

const spotlightEffect = document.querySelector('.spotlight-effect');
const glowEffect = document.querySelector('.glow-effect');
const hologramOverlay = document.querySelector('.hologram-overlay');
const textureOverlay = document.querySelector('.texture-overlay');
const lightStrip = document.querySelector('.light-strip');

/* cache theme keys */
const themeKeys = Object.keys(themes);

/* -------------------------
   Initialize theme buttons & UI
   ------------------------- */
function initThemeButtons() {
  Object.entries(themes).forEach(([key, theme]) => {
    const btn = document.createElement('button');
    btn.className = `theme-btn ${key === currentTheme ? 'active' : ''}`;
    btn.style.background = theme.background;
    btn.innerHTML = `<span>${theme.name}</span>`;
    btn.onclick = () => changeTheme(key);
    themeGrid.appendChild(btn);
  });
}

function updateCard() {
  displayTitle.textContent = cardTitle.value;
  displayDescription.textContent = cardDescription.value;
  displayRarity.textContent = cardRarity.value;
  displayNumber.textContent = cardNumber.value;
  displayOwner.textContent = cardOwner.value;
  displayOwner.style.display = cardOwner.value ? 'block' : 'none';
}

function changeTheme(themeKey) {
  currentTheme = themeKey;
  const theme = themes[themeKey];

  nftCard.style.background = theme.background;
  nftCard.style.boxShadow = `0 25px 50px -12px ${theme.accent}80, 0 20px 40px -10px ${theme.accent}60, 0 15px 30px -8px ${theme.accent}40`;

  // dynamic glow (inline)
  glowEffect.style.background = `
  radial-gradient(circle at 30% 20%, ${theme.accent}33 0%, transparent 50%),
  radial-gradient(circle at 70% 80%, ${theme.accent}22 0%, transparent 60%)
`;

  const rarityBadge = document.getElementById('displayRarity');
  rarityBadge.style.background = `${theme.accent}40`;
  rarityBadge.style.borderColor = `${theme.accent}60`;

  // Update theme buttons (use cached keys)
  document.querySelectorAll('.theme-btn').forEach((btn, index) => {
    const key = themeKeys[index];
    btn.classList.toggle('active', key === themeKey);
  });

  updateHologramOverlay(theme.hologram);
  updateTextureOverlay(themeKey);
}

function updateHologramOverlay(hologramType) {
  const gradients = {
    cosmic: 'linear-gradient(45deg, rgba(255,0,150,0.2) 0%, rgba(0,255,255,0.2) 25%, rgba(255,255,0,0.2) 50%, rgba(255,0,150,0.2) 75%, rgba(0,255,255,0.2) 100%)',
    neon: 'linear-gradient(45deg, rgba(0,217,255,0.3) 0%, rgba(0,150,255,0.2) 25%, rgba(0,255,200,0.3) 50%, rgba(0,150,255,0.2) 75%, rgba(0,217,255,0.3) 100%)',
    ocean: 'linear-gradient(45deg, rgba(0,255,159,0.3) 0%, rgba(0,150,255,0.3) 50%, rgba(0,255,159,0.3) 100%)',
    fire: 'linear-gradient(45deg, rgba(255,69,0,0.3) 0%, rgba(255,215,0,0.3) 50%, rgba(255,69,0,0.3) 100%)',
    sunset: 'linear-gradient(45deg, rgba(255,110,127,0.3) 0%, rgba(255,160,122,0.3) 50%, rgba(255,110,127,0.3) 100%)',
    midnight: 'linear-gradient(45deg, rgba(52,152,219,0.3) 0%, rgba(155,89,182,0.3) 50%, rgba(52,152,219,0.3) 100%)',
    royal: 'linear-gradient(45deg, rgba(255,215,0,0.3) 0%, rgba(183,33,255,0.3) 50%, rgba(255,215,0,0.3) 100%)',
    azure: 'linear-gradient(45deg, rgba(77,168,218,0.3) 0%, rgba(3,64,120,0.3) 50%, rgba(10,17,40,0.3) 100%)'
  };
  hologramOverlay.style.background = gradients[hologramType] || gradients.cosmic;
}

function updateTextureOverlay(themeKey) {
  const textures = {
    cosmic: `
            radial-gradient(circle at 30% 20%, rgba(102,126,234,0.15) 0%, transparent 40%),
            radial-gradient(circle at 70% 60%, rgba(118,75,162,0.15) 0%, transparent 40%),
            radial-gradient(circle at 50% 90%, rgba(240,147,251,0.1) 0%, transparent 50%),
            repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,255,255,0.02) 30px, rgba(255,255,255,0.02) 60px)
        `,
    neon: `
            radial-gradient(ellipse at 0% 0%, rgba(0,217,255,0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 100% 100%, rgba(0,217,255,0.1) 0%, transparent 50%),
            repeating-linear-gradient(0deg, transparent 0px, transparent 40px, rgba(0,217,255,0.03) 40px, rgba(0,217,255,0.03) 41px)
        `,
    ocean: `
            repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,255,159,0.03) 10px, rgba(0,255,159,0.03) 20px),
            repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(0,150,255,0.03) 10px, rgba(0,150,255,0.03) 20px)
        `,
    fire: `
            repeating-linear-gradient(120deg, transparent, transparent 5px, rgba(255,215,0,0.05) 5px, rgba(255,215,0,0.05) 10px),
            repeating-linear-gradient(240deg, transparent, transparent 5px, rgba(255,69,0,0.05) 5px, rgba(255,69,0,0.05) 10px)
        `,
    sunset: `
            linear-gradient(135deg, rgba(255,110,127,0.05) 0%, transparent 50%, rgba(255,160,122,0.05) 100%),
            repeating-radial-gradient(circle at 30% 30%, transparent 0px, transparent 20px, rgba(255,255,255,0.02) 20px, rgba(255,255,255,0.02) 40px)
        `,
    midnight: `
            repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(52,152,219,0.08) 15px, rgba(52,152,219,0.08) 30px),
            repeating-linear-gradient(-45deg, transparent, transparent 15px, rgba(155,89,182,0.06) 15px, rgba(155,89,182,0.06) 30px)
        `,
    royal: `
            repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 10deg, rgba(255,215,0,0.03) 10deg, rgba(255,215,0,0.03) 20deg),
            radial-gradient(circle at 50% 50%, rgba(183,33,255,0.05) 0%, transparent 60%)
        `,
    azure: `
            repeating-linear-gradient(60deg, transparent, transparent 8px, rgba(77,168,218,0.04) 8px, rgba(77,168,218,0.04) 16px),
            repeating-linear-gradient(-60deg, transparent, transparent 8px, rgba(3,64,120,0.04) 8px, rgba(3,64,120,0.04) 16px)
        `
  };
  textureOverlay.style.background = textures[themeKey] || textures.cosmic;
}

function changeFont(font) {
  const fonts = {
    orbitron: 'Orbitron, monospace',
    cyberpunk: '"Courier New", monospace',
    futura: '"Helvetica Neue", sans-serif',
    quantum: '"Arial Black", sans-serif',
    audiowide: '"Audiowide", cursive',
    spacegrotesk: '"Space Grotesk", sans-serif',
    vt323: '"VT323", monospace',
    bebasneue: '"Bebas Neue", sans-serif',
    rajdhani: '"Rajdhani", sans-serif'
  };
  nftCard.style.fontFamily = fonts[font] || fonts.orbitron;
}

/* -------------------------
   Performance-optimized mousemove handling + thickening effect
   ------------------------- */
/* CHANGED: cache rect, use requestAnimationFrame, apply thickening when hovered */
let cachedRect = null;
let rafId = null;
let target = { mouseX: 50, mouseY: 50 };
let isThick = false;

function updateRect() {
  cachedRect = nftCard.getBoundingClientRect();
}

function scheduleTransformUpdate() {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    applyTransform();
  });
}

function applyTransform() {
  if (!cachedRect) updateRect();

  const centerX = cachedRect.width / 2;
  const centerY = cachedRect.height / 2;
  const mouseXPos = (target.mouseX / 100) * cachedRect.width;
  const mouseYPos = (target.mouseY / 100) * cachedRect.height;
  const rotateX = ((mouseYPos - centerY) / centerY) * 8; // tuned
  const rotateY = ((centerX - mouseXPos) / centerX) * 8;

  const theme = themes[currentTheme];
  spotlightEffect.style.background = `radial-gradient(circle 220px at ${target.mouseX}% ${target.mouseY}%, ${theme.accent}2f 0%, transparent 70%)`;

  // apply transform
  let transformStr = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;

  if (isThick) {
    // stronger shadow + border + slight z-translate for depth
    nftCard.style.boxShadow = `0 45px 90px -18px ${theme.accent}aa, 0 30px 60px -30px ${theme.accent}88, 0 28px 56px -40px rgba(0,0,0,0.6)`;
    //nftCard.style.border = `3px solid rgba(255,255,255,0.06)`;
    transformStr += ' translateZ(8px)';
  }

  nftCard.style.transform = transformStr;
}

/* Event listeners for card movement */
nftCard.addEventListener('mousemove', (e) => {
    if (!cachedRect) updateRect();
    const rect = cachedRect;
    const newMouseX = ((e.clientX - rect.left) / rect.width) * 100;
    const newMouseY = ((e.clientY - rect.top) / rect.height) * 100;
    target.mouseX = Math.max(0, Math.min(100, newMouseX));
    target.mouseY = Math.max(50, Math.min(100, newMouseY));
    scheduleTransformUpdate();
});

// === 3D Depth Effect start ===
let depthLayer = null;
let isDepthActive = false;

nftCard.addEventListener('mouseenter', () => {
    const theme = themes[currentTheme];
    if (!depthLayer) {
        depthLayer = document.createElement('div');
        depthLayer.className = 'card-depth';
        depthLayer.style.position = 'absolute';
        depthLayer.style.inset = '0';
        depthLayer.style.borderRadius = 'inherit';
        /*depthLayer.style.background = `${theme.accent}55`;*/
        depthLayer.style.boxShadow = `0 0 10px 2px rgba(41, 40, 40, 0.5)`; /* soft white glow edge */
        depthLayer.style.transition = 'transform 0.08s ease-out';
        depthLayer.style.zIndex = '0';
        nftCard.appendChild(depthLayer);
    }
    isDepthActive = true;
});

nftCard.addEventListener('mouseleave', () => {
    isDepthActive = false;
    if (!depthLayer) {
        depthLayer = document.createElement('div');
        depthLayer.className = 'card-depth';
        depthLayer.style.position = 'absolute';
        depthLayer.style.inset = '0';
        depthLayer.style.borderRadius = 'inherit';
        /*depthLayer.style.background = `${theme.accent}55`;*/
        depthLayer.style.boxShadow = `0 0 10px 2px rgba(43, 43, 43, 0.5)`; /* soft white glow edge */
        depthLayer.style.transition = 'transform 0.08s ease-out';
        depthLayer.style.zIndex = '0';
        nftCard.appendChild(depthLayer);
    }
    isDepthActive = true;
});

const _origApplyTransform = applyTransform;
applyTransform = function() {
    _origApplyTransform();
    if (isDepthActive && depthLayer) {
        const theme = themes[currentTheme];
        const offsetX = ((target.mouseX - 50) / 50) * -4;
        const offsetY = ((target.mouseY - 50) / 50) * -4;
        depthLayer.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        /*depthLayer.style.background = `linear-gradient(${180 + offsetY * 2}deg, ${theme.accent}99 0%, ${theme.accent}33 100%)`;*/
    }
};
// === 3D Depth Effect end ===


/* -------------------------
   Clipboard helpers & preview popup (preserved original)
   ------------------------- */
async function copyImageToClipboard(blob) {
  try {
    if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);
      return true;
    } else {
      console.warn('Clipboard image write not supported in this browser.');
      return false;
    }
  } catch (err) {
    console.error('Failed to copy image to clipboard:', err);
    return false;
  }
}

/* Original showPreviewPopup preserved (function body same as original file) */
function showPreviewPopup(imageDataUrl, fileName, imageBlob) {
  // Create popup overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
  `;

  // Create popup container
  const popup = document.createElement('div');
  popup.style.cssText = `
    background: var(--bg-secondary);
    border-radius: 1rem;
    padding: 2rem;
    max-width: 90%;
    max-height: 90%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    border: 1px solid var(--border-color);
    animation: slideIn 0.3s ease;
  `;

  // Create preview image
  const img = document.createElement('img');
  img.src = imageDataUrl;
  img.style.cssText = `
    max-width: 100%;
    max-height: 60vh;
    border-radius: 0.5rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  `;

  // Create instruction text
  const instructionText = document.createElement('p');
  instructionText.style.cssText = `
    color: #a0a0a0;
    font-size: 0.9rem;
    text-align: center;
    margin: 0;
  `;
  instructionText.textContent = 'The image has been downloaded! Click "Copy & Share to X" to copy the image to the clipboard, then paste it into X/Twitter.';

  // Create buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.cssText = `
    display: flex;
    gap: 1rem;
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  `;

  // Create share to X button with copy
  const shareBtn = document.createElement('button');
  shareBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style="vertical-align: middle; margin-right: 8px;">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
    Copy & Share to X
  `;
  shareBtn.style.cssText = `
    padding: 0.875rem 2rem;
    background: #1DA1F2;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  shareBtn.onmouseover = () => {
    shareBtn.style.background = '#1a8cd8';
    shareBtn.style.transform = 'translateY(-2px)';
  };
  shareBtn.onmouseout = () => {
    shareBtn.style.background = '#1DA1F2';
    shareBtn.style.transform = 'translateY(0)';
  };
  shareBtn.onclick = async () => {
    // Copy image to clipboard
    const copied = await copyImageToClipboard(imageBlob);
    
    if (copied) {
      // Show success message
      shareBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style="vertical-align: middle; margin-right: 8px;">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        Copied! Opening X...
      `;
      shareBtn.style.background = '#10b981';
      
      // Wait a bit then open X
      setTimeout(() => {
        const tweetText = `Check out my NFT Card: ${cardTitle.value}!\n\n✨ Created with NFT Card Generator`;
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(tweetUrl, '_blank');
        
        // Reset button after 2 seconds
        setTimeout(() => {
          shareBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style="vertical-align: middle; margin-right: 8px;">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Copy & Share to X
          `;
          shareBtn.style.background = '#1DA1F2';
        }, 2000);
      }, 500);
    } else {
      // Show error message
      shareBtn.innerHTML = `❌ Copy Failed - Try Manual`;
      shareBtn.style.background = '#ef4444';
      setTimeout(() => {
        shareBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style="vertical-align: middle; margin-right: 8px;">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Copy & Share to X
        `;
        shareBtn.style.background = '#1DA1F2';
      }, 2000);
    }
  };

  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.cssText = `
    padding: 0.875rem 2rem;
    background: var(--bg-primary);
    color: white;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  `;
  closeBtn.onmouseover = () => {
    closeBtn.style.background = '#374151';
    closeBtn.style.transform = 'translateY(-2px)';
  };
  closeBtn.onmouseout = () => {
    closeBtn.style.background = 'var(--bg-primary)';
    closeBtn.style.transform = 'translateY(0)';
  };
  closeBtn.onclick = () => {
    document.body.removeChild(overlay);
  };

  // Assemble popup
  buttonsContainer.appendChild(shareBtn);
  buttonsContainer.appendChild(closeBtn);
  popup.appendChild(img);
  popup.appendChild(instructionText);
  popup.appendChild(buttonsContainer);
  overlay.appendChild(popup);

  // Add animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideIn {
      from { transform: translateY(-50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  };

  // Append to body
  document.body.appendChild(overlay);
}

/* -------------------------
   Download / Export logic (changed: lighter defaults + post flow)
   ------------------------- */
const downloadSelect = document.getElementById('downloadSelect');

downloadBtn.addEventListener('click', async () => {
  downloadBtn.textContent = 'Rendering...';
  downloadBtn.disabled = true;

          // === Reset 3D depth before export ===
nftCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
  if (depthLayer) { nftCard.removeChild(depthLayer); depthLayer = null; isDepthActive = false; }
           // Pastikan semua elemen di dalam kartu sudah balik ke posisi semula sebelum export
        nftCard.style.transition = 'none'; // cegah animasi rotasi balik
        void nftCard.offsetHeight; // paksa repaint/reflow (browser flush posisi anak termasuk gambar)
        nftCard.style.transition = ''; // kembalikan transition normal

  try {
    // DEFAULT pixelRatio set to 2 for performance (change if you need higher quality)
    const scale = 2;
    const rect = nftCard.getBoundingClientRect();
    const fixedWidth = Math.round(rect.width);
    const fixedHeight = Math.round(rect.height);

    // Create a fixed-size wrapper element
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.width = `${fixedWidth}px`;
    wrapper.style.height = `${fixedHeight}px`;
    wrapper.style.overflow = 'hidden';
    wrapper.style.opacity = '0';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.zIndex = '-9999';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
   

    // Clone the NFT card with all its children
    const clone = nftCard.cloneNode(true);

    // Set fixed dimensions on clone to prevent layout shifts
    clone.style.width = `${fixedWidth}px`;
    clone.style.height = `${fixedHeight}px`;
    clone.style.maxWidth = `${fixedWidth}px`;
    clone.style.maxHeight = `${fixedHeight}px`;
    clone.style.aspectRatio = 'unset';
    clone.style.transform = 'none';
    clone.style.transition = 'none';

    // Remove size constraints from all child elements and freeze animations
    clone.querySelectorAll('*').forEach(el => {
      el.style.maxWidth = 'unset';
      el.style.maxHeight = 'unset';
      el.style.aspectRatio = 'unset';
      el.style.animation = 'none';
      el.style.transition = 'none';
    });

    // Append clone to wrapper and wrapper to document
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // Wait a small amount for fonts and styles to fully load
    await new Promise(resolve => setTimeout(resolve, 150));

    // Preserve image aspect ratios and sizing from original card
    clone.querySelectorAll('img').forEach(img => {
      const originalImg = nftCard.querySelector(`img[src="${img.getAttribute('src')}"]`);
      if (originalImg) {
        const cs = window.getComputedStyle(originalImg);
        img.style.objectFit = cs.objectFit;
        img.style.width = cs.width;
        img.style.height = cs.height;
      }
    });

    // Fix gradient text rendering issues
    clone.querySelectorAll('.card-title, .card-number').forEach(el => {
      el.style.background = 'none';
      el.style.webkitBackgroundClip = 'unset';
      el.style.backgroundClip = 'unset';
      el.style.webkitTextFillColor = '#ffffff';
      el.style.color = '#ffffff';
    });

    // Position the light strip effect at center
    const cloneLightStrip = clone.querySelector('.light-strip');
    if (cloneLightStrip) {
      cloneLightStrip.style.animation = 'none';
      cloneLightStrip.style.transition = 'none';
      cloneLightStrip.style.backgroundPosition = '30% 0';
    }

    // Render the clone to canvas with settings
    const canvas = await htmlToImage.toCanvas(clone, {
      pixelRatio: scale,
      backgroundColor: null,
      cacheBust: true,
      quality: 1.0
    });
    

    // Convert canvas to PNG data URL and blob
    const imageDataUrl = canvas.toDataURL('image/png');
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

    // Create download link and trigger download
    const fileName = `nft-card-${cardTitle.value.replace(/\s+/g, '-').toLowerCase()}.png`;
    const link = document.createElement('a');
    link.download = fileName;
    link.href = imageDataUrl;
    link.click();

    // Remove wrapper from DOM
    document.body.removeChild(wrapper);

    // AFTER download: copy image + text to clipboard and open X compose
    const tweetText = `Check out my NFT Card: ${cardTitle.value}!\n\n✨ Created with NFT Card Generator\n\n#NFT #Card`;

    // copy text
    try {
      await navigator.clipboard.writeText(tweetText);
    } catch (err) {
      console.warn('Failed to copy text to clipboard:', err);
    }

    // copy image blob if possible
    const copied = await copyImageToClipboard(blob);

    // Try Web Share API as an extra option (will open native share sheet on supporting devices)
    let sharedViaNavigatorShare = true;
   
    // Show preview popup (original behavior) — include blob
     showPreviewPopup(imageDataUrl, fileName, blob);

    // If Web Share didn't run, open X / Twitter compose intent with prefilled text.
    // NOTE: You cannot attach image via intent; user must paste (Ctrl+V) to attach image from clipboard manually.
    if (!sharedViaNavigatorShare) {
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
      window.open(tweetUrl, '_blank');
    }

  } catch (err) {
    console.error('Render Error:', err);
    alert('Failed to generate image: ' + (err && err.message ? err.message : err));
  } finally {
    downloadBtn.textContent = 'Generate';
    downloadBtn.disabled = false;
  }
});

/* -------------------------
   Event listeners & init
   ------------------------- */
cardTitle.addEventListener('input', updateCard);
cardDescription.addEventListener('input', updateCard);
cardRarity.addEventListener('input', updateCard);
cardNumber.addEventListener('input', updateCard);
cardOwner.addEventListener('input', updateCard);
themeSelect.addEventListener('change', (e) => changeTheme(e.target.value));
fontSelect.addEventListener('change', (e) => changeFont(e.target.value));

// ensure rect updated on window resize so hotspot remains correct
window.addEventListener('resize', () => {
  if (document.activeElement === nftCard || nftCard.matches(':hover')) updateRect();
});

// Initialize
initThemeButtons();
updateCard();
changeTheme(currentTheme);

/* End of script.js */
