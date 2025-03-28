// 滚动显示动画
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// 观察所有 section 元素
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// 导航栏滚动效果
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        navbar.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    }
    
    lastScroll = currentScroll;
});

// 技能进度条动画
function animateSkills() {
    const skillItems = document.querySelectorAll('.skill-item');
    
    skillItems.forEach(item => {
        const progressBar = item.querySelector('.skill-progress');
        const progress = progressBar.getAttribute('data-progress');
        progressBar.style.setProperty('--progress', `${progress}%`);
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    item.classList.add('animate');
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(item);
    });
}

// 页面加载完成后初始化技能动画
document.addEventListener('DOMContentLoaded', () => {
    animateSkills();
});

// 滚动到项目区域
function scrollToProjects() {
    const projectsSection = document.getElementById('projects');
    projectsSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// 滚动到联系区域
function scrollToContact() {
    const contactSection = document.getElementById('contact');
    contactSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// 添加按钮点击效果
document.querySelectorAll('.cta-button').forEach(button => {
    button.addEventListener('click', function() {
        // 添加点击波纹效果
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        this.appendChild(ripple);
        
        // 设置波纹位置
        const rect = this.getBoundingClientRect();
        ripple.style.left = event.clientX - rect.left + 'px';
        ripple.style.top = event.clientY - rect.top + 'px';
        
        // 移除波纹效果
        setTimeout(() => {
            ripple.remove();
        }, 1000);
    });
});

// 移动端菜单交互
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    menuToggle.querySelector('i').classList.toggle('fa-bars');
    menuToggle.querySelector('i').classList.toggle('fa-times');
});

// 点击导航链接时关闭菜单
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuToggle.querySelector('i').classList.add('fa-bars');
        menuToggle.querySelector('i').classList.remove('fa-times');
    });
});

// 点击页面其他区域时关闭菜单
document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
        navLinks.classList.remove('active');
        menuToggle.querySelector('i').classList.add('fa-bars');
        menuToggle.querySelector('i').classList.remove('fa-times');
    }
}); 