// Theme toggle, mobile menu, smooth scroll, contact form handler
(function(){
  const themeToggle = document.getElementById('theme-toggle');
  const menuToggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-nav');
  const yearEl = document.getElementById('year');
  const form = document.getElementById('contact-form');

  // Set year
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Theme (light/dark) using localStorage
  const theme = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light':'dark');
  if(theme === 'light') document.documentElement.style.setProperty('--bg','#f7fbff');

  themeToggle && themeToggle.addEventListener('click', ()=>{
    const isLight = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() === '#f7fbff';
    if(isLight){
      document.documentElement.style.removeProperty('--bg');
      localStorage.setItem('theme','dark');
      themeToggle.textContent = '🌙';
    } else {
      document.documentElement.style.setProperty('--bg','#f7fbff');
      localStorage.setItem('theme','light');
      themeToggle.textContent = '☀️';
    }
  });

  // Mobile menu
  menuToggle && menuToggle.addEventListener('click', ()=>{
    nav.classList.toggle('open');
  });

  // Smooth scroll for in-page links
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', function(e){
      const href = this.getAttribute('href');
      if(href === '#') return;
      const el = document.querySelector(href);
      if(el){
        e.preventDefault();
        el.scrollIntoView({behavior:'smooth',block:'start'});
        if(nav.classList) nav.classList.remove('open');
      }
    });
  });

  // Open external links in a new tab safely (whatsapp/github/linkedin targets already set in markup)
  document.querySelectorAll('a[target="_blank"]').forEach(a=>{
    a.setAttribute('rel','noopener');
  });

  // Contact form (client-side only)
  form && form.addEventListener('submit', function(e){
    e.preventDefault();
    const status = document.getElementById('form-status');
    status.textContent = 'Sending message…';
    setTimeout(()=>{
      status.textContent = 'Thanks — message sent (demo only).';
      form.reset();
    },800);
  });
})();
