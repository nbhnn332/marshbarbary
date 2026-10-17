/**
 * MARSH BARBARY - CAMPAIGN VIDEO MODAL
 */

document.addEventListener('DOMContentLoaded', () => {
  const playBtn = document.querySelector('.campaign-play-btn');
  const videoOverlay = document.querySelector('.video-modal-overlay');
  const closeBtn = document.querySelector('.video-modal-close');

  function openVideoModal() {
    videoOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeVideoModal() {
    videoOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  playBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openVideoModal();
  });

  closeBtn?.addEventListener('click', closeVideoModal);
  videoOverlay?.addEventListener('click', (e) => {
    if (e.target === videoOverlay) closeVideoModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && videoOverlay?.classList.contains('active')) {
      closeVideoModal();
    }
  });
});
