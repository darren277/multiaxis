const infoOverlay = document.getElementById('info-overlay')
const overlayContent = document.getElementById('overlay-content')
const closeButton = document.getElementById('overlay-close-button')

/**
 * Populates the overlay with HTML content and makes it visible.
 * @param {string} html - The HTML string to display.
 */
export function showOverlay(html: string) {
    if (!infoOverlay || !overlayContent) return

    overlayContent.innerHTML = html
    infoOverlay.style.display = 'block'

    // Tiny timeout to allow the browser to apply the 'display: block' before starting the transition.
    setTimeout(() => {
        infoOverlay.style.opacity = '1'
        infoOverlay.style.transform = 'scale(1)'
    }, 10)
}

/**
 * Hides the overlay with a fade-out effect.
 */
export function hideOverlay() {
    if (!infoOverlay) return

    infoOverlay.style.opacity = '0'
    infoOverlay.style.transform = 'scale(0.95)'

    // Wait for the transition to finish before setting display to none
    setTimeout(() => {
        infoOverlay.style.display = 'none'
    }, 200) // 200ms matches the CSS transition time
}

closeButton?.addEventListener('click', hideOverlay)

// Optional: Allow closing the overlay with the 'Escape' key
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        hideOverlay()
    }
})
