// 全局变量
let currentSlide = 0;
let newsData = [];
let teamData = [];
let worksData = [];
let currentPage = 1;
const itemsPerPage = 6;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    initSoundwaveBackground();
    initScrollAnimations();
});

// 声波背景动画
function initSoundwaveBackground() {
    // 创建动态声波装饰元素
    const soundwave = document.createElement('div');
    soundwave.className = 'soundwave-decoration';
    soundwave.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 120px;
        pointer-events: none;
        z-index: 0;
        opacity: 0.08;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23d4af37' fill-opacity='0.4' d='M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E") bottom center no-repeat;
        background-size: cover;
        animation: soundwaveFloat 8s ease-in-out infinite;
    `;
    document.body.appendChild(soundwave);

    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes soundwaveFloat {
            0%, 100% { transform: translateY(0); opacity: 0.08; }
            50% { transform: translateY(-10px); opacity: 0.12; }
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glowPulse {
            0%, 100% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.2); }
            50% { box-shadow: 0 0 40px rgba(212, 175, 55, 0.4); }
        }
        .animate-in {
            animation: fadeInUp 0.8s ease forwards;
        }
        .glow-effect {
            animation: glowPulse 3s ease-in-out infinite;
        }
    `;
    document.head.appendChild(style);
}

// 滚动动画
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 观察所有卡片元素
    const cards = document.querySelectorAll('.service-card, .news-card, .work-card, .team-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.animationDelay = `${index * 0.1}s`;
        observer.observe(card);
    });
}

// 初始化应用
async function initApp() {
    initNavigation();
    initBannerSlider();
    
    // 根据页面加载对应数据
    const page = getCurrentPage();
    
    switch(page) {
        case 'index':
            await loadNewsPreview();
            await loadWorksPreview();
            await loadTeamPreview();
            break;
        case 'news':
            await loadNewsList();
            initFilter('news');
            break;
        case 'team':
            await loadTeamList();
            initFilter('team');
            initAudioPlayer();
            break;
        case 'works':
            await loadWorksList();
            initFilter('works');
            initAudioPlayer();
            break;
        case 'submit':
            initAuthForms();
            initUploadForm();
            break;
    }
}

// 获取当前页面
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('news')) return 'news';
    if (path.includes('team')) return 'team';
    if (path.includes('works')) return 'works';
    if (path.includes('submit')) return 'submit';
    return 'index';
}

// 导航栏功能
function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (navToggle) {
        navToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navLinks.classList.toggle('active');
        });
    }
    
    // 点击导航链接后关闭移动端菜单，并确保链接正常跳转
    if (navLinks) {
        navLinks.addEventListener('click', function(e) {
            // 使用 closest() 查找最近的 A 标签，处理点击链接内任意元素的情况
            const link = e.target.closest('a');
            if (link) {
                navLinks.classList.remove('active');
                // 确保链接默认行为能正常工作（不在 JS 中阻止）
            }
        });
    }
    
    // 确保页面上所有锚点链接都能正常工作
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href').slice(1);
            if (targetId) {
                const target = document.getElementById(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

// Banner轮播
function initBannerSlider() {
    const slides = document.querySelectorAll('.banner-slide');
    const dotsContainer = document.querySelector('.banner-dots');
    const prevBtn = document.querySelector('.banner-prev');
    const nextBtn = document.querySelector('.banner-next');
    
    if (!slides.length) return;
    
    // 创建指示点
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'banner-dot' + (index === 0 ? ' active' : '');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });
    
    // 上一张/下一张按钮
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            goToSlide(currentSlide - 1 < 0 ? slides.length - 1 : currentSlide - 1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            goToSlide((currentSlide + 1) % slides.length);
        });
    }
    
    // 自动轮播
    setInterval(() => {
        goToSlide((currentSlide + 1) % slides.length);
    }, 5000);
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.banner-dot');
    
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    
    currentSlide = index;
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

// 加载资讯预览（首页）
async function loadNewsPreview() {
    try {
        const res = await fetch('http://localhost:3000/api/news');
        const data = await res.json();

        if (data.success && data.data.length > 0) {
            // 取最新3条
            newsData = data.data.slice(0, 3);
        } else {
            newsData = [];
        }

        const container = document.getElementById('news-preview');
        if (!container) return;

        if (newsData.length === 0) {
            container.innerHTML = '<div class="news-card" style="grid-column:1/-1;text-align:center;padding:40px;color:#999;"><i class="fas fa-newspaper" style="font-size:36px;opacity:0.3;margin-bottom:12px;display:block;"></i><p>暂无资讯</p></div>';
            return;
        }

        container.innerHTML = newsData.map(news => createNewsCard(news)).join('');
    } catch (error) {
        console.error('加载资讯预览失败:', error);
    }
}

// 加载作品预览（首页）
async function loadWorksPreview() {
    try {
        const res = await fetch('http://localhost:3000/api/works');
        const data = await res.json();

        if (data.success && data.data.length > 0) {
            const preview = data.data.slice(0, 3);
            const container = document.getElementById('works-preview');
            if (!container) return;
            container.innerHTML = preview.map(work => createWorkCard(work)).join('');
        }
    } catch (error) {
        console.error('加载作品预览失败:', error);
    }
}

// 加载团队预览（首页）
async function loadTeamPreview() {
    try {
        const res = await fetch('http://localhost:3000/api/team');
        const data = await res.json();

        if (data.success && data.data.length > 0) {
            // 取最新4条
            const preview = data.data.slice(0, 4);
            const container = document.getElementById('team-preview');
            if (!container) return;
            container.innerHTML = preview.map(member => createTeamCard(member)).join('');
        }
    } catch (error) {
        console.error('加载团队预览失败:', error);
    }
}

// 加载资讯列表（资讯页）
async function loadNewsList() {
    try {
        const res = await fetch('http://localhost:3000/api/news');
        const data = await res.json();

        if (data.success && data.data.length > 0) {
            newsData = data.data;
        } else {
            newsData = [];
        }

        displayNewsPage(1);
    } catch (error) {
        console.error('加载资讯列表失败:', error);
        newsData = [];
        displayNewsPage(1);
    }
}

// 显示资讯分页
function displayNewsPage(page) {
    const container = document.getElementById('news-container');
    if (!container) return;
    
    const filteredNews = getFilteredData(newsData, 'news');
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredNews.slice(start, end);
    
    container.innerHTML = pageData.map(news => createNewsCard(news)).join('');
    updatePagination('news', filteredNews.length, page);
}

// 加载团队列表
async function loadTeamList() {
    try {
        const res = await fetch('http://localhost:3000/api/team');
        const data = await res.json();

        if (data.success && data.data.length > 0) {
            teamData = data.data;
        } else {
            teamData = [];
        }

        displayTeamGrid(teamData);
    } catch (error) {
        console.error('加载团队列表失败:', error);
        teamData = [];
        displayTeamGrid([]);
    }
}

// 显示团队网格
function displayTeamGrid(data) {
    const container = document.getElementById('team-container');
    if (!container) return;
    
    const filteredData = getFilteredData(data, 'team');
    container.innerHTML = filteredData.map(member => createTeamCard(member)).join('');
}

// 加载作品列表（从API获取已审核通过的作品）
async function loadWorksList() {
    try {
        // 从API获取已审核通过的作品
        const res = await fetch('http://localhost:3000/api/works?status=approved');
        const data = await res.json();

        if (data.success && data.data.length > 0) {
            // 转换数据格式以匹配现有UI
            worksData = data.data.map(work => ({
                id: work.id,
                title: work.title,
                type: work.type,
                summary: work.summary || '',
                cover: work.cover || '',
                audioUrl: work.audioUrl || '',
                contentHtml: work.contentHtml || work.content || ''
            }));
        } else {
            worksData = [];
        }

        displayWorksGrid(worksData);
    } catch (error) {
        console.error('加载作品列表失败:', error);
        // API失败时使用空数据，不显示假数据
        worksData = [];
        displayWorksGrid([]);
    }
}

// 显示作品网格
function displayWorksGrid(data) {
    const container = document.getElementById('works-container');
    if (!container) return;

    const filteredData = getFilteredData(data, 'works');

    if (filteredData.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#999;width:100%;"><i class="fas fa-folder-open" style="font-size:48px;margin-bottom:16px;opacity:0.3;"></i><p>暂无作品</p></div>';
        return;
    }

    container.innerHTML = filteredData.map(work => createWorkCard(work)).join('');
}

// 创建资讯卡片HTML
function createNewsCard(news) {
    return `
        <div class="news-card">
            <div class="news-image" style="background-image: url('${news.image || "assets/images/default-news.jpg"}')"></div>
            <div class="news-content">
                <div class="news-meta">
                    <span class="news-category">${getCategoryText(news.category)}</span>
                    <span class="news-date">${news.date}</span>
                </div>
                <h3>${news.title}</h3>
                <p class="news-summary">${news.summary}</p>
                <a href="#" class="read-more">阅读详情 →</a>
            </div>
        </div>
    `;
}

// 创建作品卡片HTML
function createWorkCard(work) {
    var typeMap = { '剧本': '广播剧', '广播剧': '广播剧', '有声书': '有声书', '短剧': '短剧', 'PIA剧': 'PIA剧' };
    var typeText = typeMap[work.type] || work.type || '剧本';

    return `
        <div class="work-card">
            <div class="work-cover" style="background-image: url('${work.cover || "assets/images/default-work.jpg"}')"></div>
            <div class="work-info">
                <h3>${work.title}</h3>
                <span class="work-type">${typeText}</span>
                <p class="work-summary">${work.summary}</p>
                <div class="work-actions">
                    ${work.audioUrl ? `<button class="btn-play" onclick="playAudio('${work.audioUrl}', '${work.title}')">
                        <i class="fas fa-play"></i> 试听
                    </button>` : ''}
                    <a href="work-detail.html?id=${work.id}" class="btn-detail">
                        <i class="fas fa-book-open"></i> 详情
                    </a>
                </div>
            </div>
        </div>
    `;
}

// 创建团队卡片HTML
function createTeamCard(member) {
    return `
        <div class="team-card" data-category="${member.category}">
            <div class="team-avatar" style="background-image: url('${member.avatar || "assets/images/default-avatar.jpg"}')"></div>
            <div class="team-info">
                <h3>${member.name}</h3>
                <p class="team-position">${member.position}</p>
                <p class="team-bio">${member.bio || ''}</p>
                <div class="team-actions">
                    ${member.voiceDemo ? `<button class="btn-play-demo" onclick="playAudio('${member.voiceDemo}', '${member.name}的Demo')">
                        <i class="fas fa-play"></i> 试听Demo
                    </button>` : ''}
                    <a href="#" class="btn-view-works">
                        <i class="fas fa-book"></i> 查看作品
                    </a>
                </div>
            </div>
        </div>
    `;
}

// 筛选功能
function initFilter(type) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 更新活跃按钮
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // 重新显示数据
            if (type === 'news') {
                displayNewsPage(1);
            } else if (type === 'team') {
                const category = this.dataset.filter;
                const filtered = category === 'all' ? teamData : teamData.filter(m => m.category === category);
                displayTeamGrid(filtered);
            } else if (type === 'works') {
                const category = this.dataset.filter;
                const filtered = category === 'all' ? worksData : worksData.filter(w => w.type === category);
                displayWorksGrid(filtered);
            }
        });
    });
}

// 获取筛选后的数据
function getFilteredData(data, type) {
    const activeFilter = document.querySelector('.filter-btn.active');
    if (!activeFilter || activeFilter.dataset.filter === 'all') return data;

    const category = activeFilter.dataset.filter;

    if (type === 'news') {
        return data.filter(item => item.category === category);
    } else if (type === 'team') {
        return data.filter(item => item.category === category);
    } else if (type === 'works') {
        // 类型映射：过滤器用英文，内部用中文
        const typeMap = {
            'drama': ['广播剧', '剧本'],
            'audiobook': ['有声书'],
            'shortplay': ['短剧'],
            'pia': ['PIA剧']
        };
        const allowedTypes = typeMap[category] || [category];
        return data.filter(item => allowedTypes.includes(item.type));
    }

    return data;
}

// 更新分页
function updatePagination(type, totalItems, currentPage) {
    const pagination = document.getElementById(type === 'news' ? 'pagination' : 'works-pagination');
    if (!pagination) return;
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pageNumbers = pagination.querySelector('.page-numbers');
    
    let pagesHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        pagesHTML += `<div class="page-number ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</div>`;
    }
    
    pageNumbers.innerHTML = pagesHTML;
    
    // 绑定分页事件
    pageNumbers.querySelectorAll('.page-number').forEach(pageBtn => {
        pageBtn.addEventListener('click', function() {
            const page = parseInt(this.dataset.page);
            if (type === 'news') {
                displayNewsPage(page);
            }
        });
    });
    
    // 更新上一页/下一页按钮状态
    const prevBtn = pagination.querySelector('.prev');
    const nextBtn = pagination.querySelector('.next');
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;
}

// 音频播放器
function initAudioPlayer() {
    // 已在HTML中创建播放器
}

function playAudio(url, title) {
    const player = document.getElementById('audio-player');
    const audio = document.getElementById('player-audio');
    const titleEl = document.getElementById('player-title');
    
    if (!player || !audio) return;
    
    titleEl.textContent = `正在播放：${title}`;
    audio.src = url;
    player.style.display = 'block';
    
    // 关闭按钮
    const closeBtn = player.querySelector('.player-close');
    if (closeBtn) {
        closeBtn.onclick = function() {
            player.style.display = 'none';
            audio.pause();
        };
    }
}

// 认证表单（创作者中心）
function initAuthForms() {
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const userPanel = document.getElementById('user-panel');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    // 检查登录状态
    checkLoginStatus();

    // 切换到注册
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (loginSection) loginSection.style.display = 'none';
            if (registerSection) registerSection.style.display = 'block';
        });
    }

    // 切换到登录
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (registerSection) registerSection.style.display = 'none';
            if (loginSection) loginSection.style.display = 'block';
        });
    }

    // 登录表单提交
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            if (!username || !password) {
                alert('请填写用户名和密码');
                return;
            }

            // 模拟登录成功（实际应调用后端API）
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            // 生成或获取用户ID
            if (!localStorage.getItem('userId')) {
                localStorage.setItem('userId', 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5));
            }
            updateUserUI(username);
            loginForm.reset();
            alert('登录成功！');
            // 刷新页面以加载我的作品
            if (typeof loadMyWorks === 'function') loadMyWorks();
            if (typeof checkNotifications === 'function') checkNotifications();
        });
    }

    // 注册表单提交
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;

            if (!username || !email || !password) {
                alert('请填写所有必填项');
                return;
            }

            if (password.length < 6) {
                alert('密码长度不能少于6位');
                return;
            }

            // 模拟注册成功并登录
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            // 为新用户生成用户ID
            localStorage.setItem('userId', 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5));
            updateUserUI(username);
            registerForm.reset();
            alert('注册成功！欢迎加入肆顾门！');
            // 刷新页面以加载我的作品
            if (typeof loadMyWorks === 'function') loadMyWorks();
        });
    }

    // 退出登录
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            // 不删除userId，保持用户身份
            checkLoginStatus();
            alert('已退出登录');
            // 清空我的作品显示
            const container = document.getElementById('my-works-container');
            if (container) container.innerHTML = '<p class="no-works" style="text-align:center;padding:40px;color:#999;">请先登录查看作品</p>';
        });
    }
}

// 更新用户界面
function updateUserUI(username) {
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const userPanel = document.getElementById('user-panel');
    const currentUsername = document.getElementById('current-username');

    if (loginSection) loginSection.style.display = 'none';
    if (registerSection) registerSection.style.display = 'none';
    if (userPanel) userPanel.style.display = 'block';
    if (currentUsername) currentUsername.textContent = username;
}

// 检查登录状态
function checkLoginStatus() {
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const userPanel = document.getElementById('user-panel');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username');

    if (isLoggedIn && username) {
        updateUserUI(username);
    } else {
        if (loginSection) loginSection.style.display = 'block';
        if (registerSection) registerSection.style.display = 'none';
        if (userPanel) userPanel.style.display = 'none';
    }
}

// 上传表单
function initUploadForm() {
    const uploadForm = document.getElementById('upload-form');
    if (!uploadForm) return;
    
    // 封面图预览
    const coverInput = document.getElementById('work-cover');
    if (coverInput) {
        coverInput.addEventListener('change', function(e) {
            previewImage(e.target, 'cover-preview');
        });
    }
    
    // 配图预览
    const imagesInput = document.getElementById('work-images');
    if (imagesInput) {
        imagesInput.addEventListener('change', function(e) {
            previewImages(e.target, 'images-preview');
        });
    }
    
    // BGM预览
    const bgmInput = document.getElementById('work-bgm');
    if (bgmInput) {
        bgmInput.addEventListener('change', function(e) {
            previewAudio(e.target, 'bgm-preview');
        });
    }
    
    // 表单提交
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const progressBar = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        // 显示进度条
        progressBar.style.display = 'block';
        
        // 模拟上传进度
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressFill.style.width = progress + '%';
            progressText.textContent = `上传中... ${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                progressText.textContent = '上传成功！等待审核...';
                alert('作品已提交，等待管理员审核');
                uploadForm.reset();
                progressBar.style.display = 'none';
                progressFill.style.width = '0%';
            }
        }, 300);
    });
}

// 预览图片（单张）
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    if (!preview) return;
    
    preview.innerHTML = '';
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            preview.appendChild(img);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// 预览图片（多张）
function previewImages(input, previewId) {
    const preview = document.getElementById(previewId);
    if (!preview) return;
    
    preview.innerHTML = '';
    
    if (input.files) {
        Array.from(input.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }
}

// 预览音频
function previewAudio(input, previewId) {
    const preview = document.getElementById(previewId);
    if (!preview) return;
    
    preview.innerHTML = '';
    
    if (input.files && input.files[0]) {
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.src = URL.createObjectURL(input.files[0]);
        preview.appendChild(audio);
    }
}

// 工具函数：获取分类文本
function getCategoryText(category) {
    const map = {
        'industry': '行业动态',
        'technology': '技术前沿',
        'company': '公司新闻',
        '创业投资': '创业投资',
        '数字工具': '数字工具',
        '商业科技': '商业科技',
        '综合热点': '综合热点'
    };
    return map[category] || category;
}

// 工具函数：获取类型文本
function getTypeText(type) {
    const map = {
        'drama': '广播剧',
        'audiobook': '有声书',
        'shortplay': '短剧',
        'pia': 'PIA剧'
    };
    return map[type] || type;
}
