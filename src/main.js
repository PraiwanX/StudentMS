// ==========================================
// Main Entry Point & Router
// ==========================================

import { settingsStore } from './store.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderClasses } from './pages/classes.js';
import { renderStudents } from './pages/students.js';
import { renderAttendance } from './pages/attendance.js';
import { renderGrades } from './pages/grades.js';
import { renderSettings } from './pages/settings.js';
// Phase 2
import { renderTeachers } from './pages/teachers.js';
import { renderSchedule } from './pages/schedule.js';
import { renderAnnouncements } from './pages/announcements.js';
import { renderScan } from './pages/scan.js';

// ==========================================
// Canvas Background Animation
// ==========================================

class ParticleBackground {
  constructor() {
    this.canvas = document.getElementById('bg-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.particleCount = 50;
    this.connectionDistance = 150;
    this.isDark = document.documentElement.classList.contains('dark');
    
    this.init();
    this.animate();
    this.setupEventListeners();
  }
  
  init() {
    this.resize();
    this.createParticles();
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
  }
  
  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.resize();
      this.createParticles();
    });
    
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    
    // Watch for theme changes
    const observer = new MutationObserver(() => {
      this.isDark = document.documentElement.classList.contains('dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }
  
  drawParticle(particle) {
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    
    const color = this.isDark ? `rgba(139, 92, 246, ${particle.opacity})` : `rgba(99, 102, 241, ${particle.opacity})`;
    this.ctx.fillStyle = color;
    this.ctx.fill();
  }
  
  drawConnections() {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.connectionDistance) {
          const opacity = (1 - distance / this.connectionDistance) * 0.15;
          const color = this.isDark ? `rgba(139, 92, 246, ${opacity})` : `rgba(99, 102, 241, ${opacity})`;
          
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.strokeStyle = color;
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
        }
      }
    }
  }
  
  updateParticles() {
    this.particles.forEach(particle => {
      // Mouse interaction
      const dx = this.mouseX - particle.x;
      const dy = this.mouseY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100) {
        const force = (100 - distance) / 100;
        particle.vx -= (dx / distance) * force * 0.02;
        particle.vy -= (dy / distance) * force * 0.02;
      }
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Boundary check
      if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
      
      // Damping
      particle.vx *= 0.99;
      particle.vy *= 0.99;
      
      // Min velocity
      if (Math.abs(particle.vx) < 0.1) particle.vx = (Math.random() - 0.5) * 0.3;
      if (Math.abs(particle.vy) < 0.1) particle.vy = (Math.random() - 0.5) * 0.3;
    });
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.updateParticles();
    this.drawConnections();
    this.particles.forEach(p => this.drawParticle(p));
    
    requestAnimationFrame(() => this.animate());
  }
}

// ==========================================
// Page Transition Animation
// ==========================================

function animatePageOut() {
  return new Promise(resolve => {
    const app = document.getElementById('app');
    app.classList.add('page-exit');
    setTimeout(resolve, 200);
  });
}

function animatePageIn() {
  const app = document.getElementById('app');
  app.classList.remove('page-exit');
  app.classList.add('page-enter');
  
  // Remove class after animation
  setTimeout(() => {
    app.classList.remove('page-enter');
  }, 400);
}

// ==========================================
// Theme Management
// ==========================================

function initTheme() {
  const settings = settingsStore.get();
  const html = document.documentElement;
  
  if (settings.theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.toggle('dark');
  settingsStore.set({ theme: isDark ? 'dark' : 'light' });
}

// ==========================================
// Router
// ==========================================

const routes = {
  '/': renderDashboard,
  '/classes': renderClasses,
  '/students': renderStudents,
  '/attendance': renderAttendance,
  '/grades': renderGrades,
  '/settings': renderSettings,
  // Phase 2
  '/teachers': renderTeachers,
  '/schedule': renderSchedule,
  '/announcements': renderAnnouncements,
  '/scan': renderScan
};

let currentPath = null;

function getRoute() {
  const hash = window.location.hash || '#/';
  return hash.slice(1) || '/';
}

function navigate(path) {
  window.location.hash = path;
}

function updateActiveNav() {
  const path = getRoute();
  const pageName = path === '/' ? 'dashboard' : path.slice(1);
  
  // Desktop nav
  document.querySelectorAll('[data-nav]').forEach(link => {
    const linkPage = link.getAttribute('data-page');
    link.classList.toggle('active', linkPage === pageName);
  });
  
  // Mobile menu close
  document.getElementById('mobile-menu').classList.add('hidden');
}

async function router() {
  const path = getRoute();
  const app = document.getElementById('app');
  
  // Animate out if changing pages
  if (currentPath !== null && currentPath !== path) {
    await animatePageOut();
  }
  currentPath = path;
  
  // Show loading
  app.innerHTML = `
    <div class="flex items-center justify-center min-h-[60vh]">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <span class="text-gray-500 dark:text-gray-400">กำลังโหลด...</span>
      </div>
    </div>
  `;
  
  const render = routes[path] || routes['/'];
  
  try {
    await render(app);
    animatePageIn();
  } catch (error) {
    console.error('Router error:', error);
    app.innerHTML = `
      <div class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center">
          <h2 class="text-xl font-bold text-red-500 mb-2">เกิดข้อผิดพลาด</h2>
          <p class="text-gray-500">${error.message}</p>
        </div>
      </div>
    `;
    animatePageIn();
  }
  
  updateActiveNav();
}

// ==========================================
// Mobile Menu
// ==========================================

function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  
  btn.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });
  
  // Close on nav click
  menu.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden');
    });
  });
}

// ==========================================
// Initialize App
// ==========================================

function init() {
  // Initialize theme
  initTheme();
  
  // Initialize canvas background
  new ParticleBackground();
  
  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  
  // Mobile menu
  initMobileMenu();
  
  // Router
  window.addEventListener('hashchange', router);
  router();
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for global use
window.navigate = navigate;
