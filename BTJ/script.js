const menuToggle = document.getElementById('menuToggle');
const menu = document.getElementById('menu');
const navLinks = document.querySelectorAll('.menu a');

menuToggle.addEventListener('click', () => {
    menu.classList.toggle('open');
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        menu.classList.remove('open');
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const name = data.get('name') || 'ลูกค้า';
    alert(`ขอบคุณ ${name} สำหรับการติดต่อ ทีมงานจะประสานกลับโดยเร็วที่สุด`);
    e.target.reset();
});

const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 120;
        if (scrollY >= sectionTop) current = section.getAttribute('id');
    });
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
});