
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.querySelector('.theme-toggle');
  let isDark = false;

  themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌓';
  });

  // Ajout d'animation sur les boutons
  document.querySelectorAll('.nav-btn').forEach(button => {
    button.addEventListener('click', () => {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = '';
      }, 100);
      
      if (button.classList.contains('contact-btn')) {
        window.location.href = '/contact';
      }
    });
  });
});
