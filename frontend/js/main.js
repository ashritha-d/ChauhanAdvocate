/* ============================================================
   Advocate Chauhan - Main Frontend JS
   ============================================================ */

const API_BASE = 'https://chauhanadvocate.onrender.com/api';

// ─── INIT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  AOS.init({ duration: 800, once: true, offset: 60 });
  initNavbar();
  initBackToTop();
  initParticles();
  setYear();
  setMinDate();

  // Load all dynamic content
  await loadSiteSettings();
  await Promise.all([
    loadServices(),
    loadTestimonials(),
    loadBlogs(),
    loadFAQs(),
    loadYouTubeVideos(),
    loadFacebookPosts(),
    loadBooks(),
    loadDrafts(),
    loadMagazines(),
    loadLatestUpdates(),
  ]);

  initTestimonialSlider();
  initForms();
  initBlogLoadMore();
});

// ─── NAVBAR ─────────────────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('mainNavbar');

  function updateScrollPadding() {
    const topBarH = document.querySelector('.top-bar')?.offsetHeight || 0;
    const navbarH = navbar?.offsetHeight || 0;
    const total = topBarH + navbarH;
    document.documentElement.style.setProperty('--header-h', total + 'px');
    document.documentElement.style.scrollPaddingTop = total + 'px';
  }
  updateScrollPadding();
  window.addEventListener('resize', updateScrollPadding, { passive: true });

  const handleScroll = () => {
    const wasScrolled = navbar.classList.contains('scrolled');
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    if (navbar.classList.contains('scrolled') !== wasScrolled) updateScrollPadding();
  };
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Active nav link on scroll
  const sections = document.querySelectorAll('section[id]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-link[href="#${e.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => observer.observe(s));

  // Close mobile menu on link click
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const collapse = document.getElementById('navMenu');
      const bsCollapse = bootstrap.Collapse.getInstance(collapse);
      if (bsCollapse) bsCollapse.hide();
    });
  });
}

// ─── BACK TO TOP ─────────────────────────────────────────────
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 400), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ─── PARTICLES ───────────────────────────────────────────────
function initParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    const size = Math.random() * 4 + 2;
    Object.assign(p.style, {
      position: 'absolute',
      width: size + 'px', height: size + 'px',
      borderRadius: '50%',
      background: `rgba(201,168,76,${Math.random() * 0.3 + 0.05})`,
      top: Math.random() * 100 + '%',
      left: Math.random() * 100 + '%',
      animation: `floatParticle ${Math.random() * 8 + 4}s ease-in-out infinite`,
      animationDelay: Math.random() * 5 + 's'
    });
    container.appendChild(p);
  }
  const style = document.createElement('style');
  style.textContent = `@keyframes floatParticle { 0%,100%{transform:translateY(0) rotate(0deg);opacity:.5} 50%{transform:translateY(-30px) rotate(180deg);opacity:1} }`;
  document.head.appendChild(style);
}

// ─── YEAR ────────────────────────────────────────────────────
function setYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

// ─── MIN DATE ────────────────────────────────────────────────
function setMinDate() {
  const dateInput = document.getElementById('appt-date');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
  }
}

// ─── SITE SETTINGS ───────────────────────────────────────────
async function loadSiteSettings() {
  try {
    const data = await apiFetch('/site-settings');
    if (!data.success) return;
    const s = data.data;

    // Update text content
    setTexts({
      'nav-site-name': s.site_name,
      'nav-tagline': s.site_tagline,
      'hero-title': null, // handled below
      'hero-subtitle': s.hero_subtitle,
      'hero-badge-text': s.advocate_experience ? `Trusted Legal Partner Since 2009` : null,
      'stat-cases': s.stats_cases,
      'stat-clients': s.stats_clients,
      'stat-years': s.stats_years,
      'stat-courts': s.stats_courts,
      'appt-phone': s.contact_phone,
      'appt-address': s.contact_address,
      'footer-site-name': s.site_name,
      'footer-tagline': s.site_tagline,
      'footer-about': s.about_content ? s.about_content.substring(0, 120) + '...' : null
    });

    // Hero title
    const heroTitle = document.getElementById('hero-title');
    if (heroTitle && s.hero_title) {
      heroTitle.innerHTML = s.hero_title.replace(/Your Trusted/i, 'Your Trusted') + ' <span class="text-gold">Legal Advocate</span>';
    }

    // Images
    if (s.advocate_photo) {
      ['hero-advocate-photo'].forEach(id => {
        const el = document.getElementById(id);
        if (el && s.advocate_photo) el.src = API_BASE.replace('/api', '') + s.advocate_photo;
      });
    }

    // Contact info with links
    updateContactLinks(s);

    // WhatsApp button — pre-filled professional greeting
    const wa = document.getElementById('whatsappBtn');
    if (wa && s.contact_whatsapp) {
      const waNum = s.contact_whatsapp.replace(/\D/g, '');
      const waMsg = `Hi Mr. Chauhan,\nCan I get more details regarding the appointment process, consultation, and available timings?`;
      wa.href = `https://wa.me/${waNum}?text=${encodeURIComponent(waMsg)}`;
    }

    // Social links
    buildSocialLinks(s);

    // SEO
    if (s.seo_title) document.title = s.seo_title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && s.seo_description) metaDesc.content = s.seo_description;

  } catch (err) {
    console.warn('Could not load site settings:', err.message);
  }
}

function setTexts(map) {
  Object.entries(map).forEach(([id, val]) => {
    if (!val) return;
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

function updateContactLinks(s) {
  const phone = s.contact_phone || '';
  const email = s.contact_email || '';
  const address = s.contact_address || '';

  if (phone) {
    ['contact-phone-link', 'footer-phone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.href = `tel:${phone.replace(/\s/g, '')}`; el.textContent = phone; }
    });
    const phoneBtn = document.getElementById('phoneBtn');
    if (phoneBtn) phoneBtn.href = `tel:${phone.replace(/\s/g, '')}`;
  }
  if (email) {
    ['contact-email-link', 'footer-email'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.href = `mailto:${email}`; el.textContent = email; }
    });
  }
  if (address) {
    ['contact-address', 'footer-address'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = address;
    });
  }
}

function buildSocialLinks(s) {
  const socials = [
    { key: 'social_facebook', icon: 'fab fa-facebook-f', label: 'Facebook' },
    { key: 'social_twitter', icon: 'fab fa-twitter', label: 'Twitter' },
    { key: 'social_linkedin', icon: 'fab fa-linkedin-in', label: 'LinkedIn' },
    { key: 'social_instagram', icon: 'fab fa-instagram', label: 'Instagram' }
  ];
  const html = socials
    .filter(soc => s[soc.key])
    .map(soc => `<a href="${s[soc.key]}" class="social-link" target="_blank" title="${soc.label}"><i class="${soc.icon}"></i></a>`)
    .join('');

  ['footer-social', 'footer-social-links'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

// ─── SERVICES ────────────────────────────────────────────────
async function loadServices() {
  const grid = document.getElementById('servicesGrid');
  const apptSelect = document.getElementById('appt-service');
  try {
    const data = await apiFetch('/services');
    if (!data.success || !data.data.length) {
      grid.innerHTML = renderFallbackServices();
      populateServiceSelect(apptSelect, getFallbackServices());
      return;
    }
    grid.innerHTML = data.data.map((s, i) => `
      <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="${i * 80}">
        <div class="service-card">
          <div class="service-icon"><i class="${s.icon || 'fas fa-balance-scale'}"></i></div>
          <h5>${s.title}</h5>
          <p>${s.shortDescription || s.description.substring(0, 120)}...</p>
          ${s.features && s.features.length ? `
            <ul class="service-features mt-3">
              ${s.features.slice(0, 4).map(f => `<li>${f}</li>`).join('')}
            </ul>` : ''}
        </div>
      </div>
    `).join('');
    populateServiceSelect(apptSelect, data.data);
    updateFooterServices(data.data);
  } catch {
    grid.innerHTML = renderFallbackServices();
    populateServiceSelect(apptSelect, getFallbackServices());
  }
}

function getFallbackServices() {
  return [
    { _id: '1', title: 'Criminal Law', icon: 'fas fa-gavel', shortDescription: 'Expert defense in criminal cases, bail applications, and trial representation.' },
    { _id: '2', title: 'Civil Litigation', icon: 'fas fa-balance-scale', shortDescription: 'Resolving civil disputes, property matters, and contract enforcement.' },
    { _id: '3', title: 'Family Law', icon: 'fas fa-heart', shortDescription: 'Divorce, custody, maintenance, and matrimonial dispute resolution.' },
    { _id: '4', title: 'Corporate Law', icon: 'fas fa-building', shortDescription: 'Business formation, contracts, compliance, and corporate disputes.' },
    { _id: '5', title: 'Property Law', icon: 'fas fa-home', shortDescription: 'Property transactions, title disputes, and real estate litigation.' },
    { _id: '6', title: 'Constitutional Law', icon: 'fas fa-scroll', shortDescription: 'Fundamental rights, PIL, and constitutional matters.' }
  ];
}

function renderFallbackServices() {
  return getFallbackServices().map((s, i) => `
    <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="${i * 80}">
      <div class="service-card">
        <div class="service-icon"><i class="${s.icon}"></i></div>
        <h5>${s.title}</h5>
        <p>${s.shortDescription}</p>
      </div>
    </div>
  `).join('');
}

function populateServiceSelect(select, services) {
  if (!select) return;
  services.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.title;
    opt.textContent = s.title;
    select.appendChild(opt);
  });
}

function updateFooterServices(services) {
  const list = document.getElementById('footer-services-list');
  if (!list) return;
  list.innerHTML = services.slice(0, 6).map(s =>
    `<li><a href="#services">${s.title}</a></li>`
  ).join('');
}

// ─── TESTIMONIALS ─────────────────────────────────────────────
let testimonials = [];
let currentSlide = 0;
let slidesPerView = 3;

async function loadTestimonials() {
  const container = document.getElementById('testimonialsContainer');
  try {
    const data = await apiFetch('/testimonials');
    testimonials = data.success && data.data.length ? data.data : getFallbackTestimonials();
  } catch {
    testimonials = getFallbackTestimonials();
  }
  renderTestimonials(container);
}

function getFallbackTestimonials() {
  return [
    { name: 'Ramesh Kumar', designation: 'Business Owner', rating: 5, message: 'Advocate Chauhan handled my property dispute with utmost professionalism. Highly recommend!' },
    { name: 'Priya Sharma', designation: 'Teacher', rating: 5, message: 'Got a fair settlement in my divorce case thanks to the expert guidance. Very supportive team.' },
    { name: 'Anil Verma', designation: 'Engineer', rating: 5, message: 'The criminal defense was handled expertly. My case was dismissed in just 3 hearings!' },
    { name: 'Sunita Devi', designation: 'Homemaker', rating: 5, message: 'Best advocate for family matters. Resolved our custody issue sensitively and quickly.' },
    { name: 'Deepak Mehta', designation: 'Businessman', rating: 5, message: 'Corporate legal advice was invaluable. Saved our company from a major contractual dispute.' },
    { name: 'Kavita Singh', designation: 'Doctor', rating: 5, message: 'Very thorough and knowledgeable. Explained everything clearly throughout the process.' }
  ];
}

function renderTestimonials(container) {
  container.innerHTML = `
    <div class="testimonials-track" id="testimonialsTrack">
      ${testimonials.map(t => `
        <div class="testimonial-slide">
          <div class="testimonial-card">
            <div class="testimonial-rating">${'★'.repeat(t.rating || 5)}${'☆'.repeat(5 - (t.rating || 5))}</div>
            <p class="testimonial-text">"${t.message}"</p>
            <div class="testimonial-author">
              <div class="author-avatar">
                ${t.avatar ? `<img src="${API_BASE.replace('/api', '') + t.avatar}" alt="${t.name}" onerror="this.style.display='none';this.parentNode.textContent='${t.name.charAt(0)}'">` : t.name.charAt(0)}
              </div>
              <div>
                <div class="author-name">${t.name}</div>
                <div class="author-designation">${t.designation || 'Client'}</div>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  buildDots();
  updateSlider();
}

function initTestimonialSlider() {
  const prev = document.getElementById('prevTestimonial');
  const next = document.getElementById('nextTestimonial');

  const updateSPV = () => {
    slidesPerView = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
    updateSlider();
  };
  updateSPV();
  window.addEventListener('resize', updateSPV, { passive: true });

  prev?.addEventListener('click', () => { currentSlide = Math.max(0, currentSlide - 1); updateSlider(); });
  next?.addEventListener('click', () => {
    const max = Math.max(0, testimonials.length - slidesPerView);
    currentSlide = Math.min(max, currentSlide + 1);
    updateSlider();
  });

  // Auto-play
  setInterval(() => {
    const max = Math.max(0, testimonials.length - slidesPerView);
    currentSlide = currentSlide >= max ? 0 : currentSlide + 1;
    updateSlider();
  }, 4000);
}

function buildDots() {
  const dotsContainer = document.getElementById('testimonialDots');
  if (!dotsContainer) return;
  dotsContainer.innerHTML = testimonials.map((_, i) =>
    `<div class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`
  ).join('');
  dotsContainer.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('click', () => { currentSlide = parseInt(dot.dataset.index); updateSlider(); });
  });
}

function updateSlider() {
  const track = document.getElementById('testimonialsTrack');
  if (!track) return;
  const slideWidth = 100 / slidesPerView;
  track.querySelectorAll('.testimonial-slide').forEach(slide => {
    slide.style.flex = `0 0 ${slideWidth}%`;
  });
  track.style.transform = `translateX(-${currentSlide * slideWidth}%)`;
  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}

// ─── BLOGS ───────────────────────────────────────────────────
let blogPage = 1;
let blogTotalPages = 1;

async function loadBlogs() {
  const grid = document.getElementById('blogGrid');
  try {
    const data = await apiFetch(`/blogs?page=1&limit=6`);
    if (!data.success || !data.data.length) {
      grid.innerHTML = renderFallbackBlogs();
      return;
    }
    blogTotalPages = data.pages || 1;
    renderBlogCards(grid, data.data);
    const loadMoreBtn = document.getElementById('loadMoreBlogsBtn');
    if (loadMoreBtn) loadMoreBtn.style.display = data.pages > 1 ? 'inline-block' : 'none';
  } catch {
    grid.innerHTML = renderFallbackBlogs();
  }
}

function renderBlogCards(container, blogs, append = false) {
  const html = blogs.map((b, i) => `
    <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="${(i % 3) * 80}">
      <div class="blog-card">
        <div class="blog-image">
          ${b.coverImage
            ? `<img src="${API_BASE.replace('/api', '') + b.coverImage}" alt="${b.title}" onerror="this.style.display='none'">`
            : `<div class="blog-image-placeholder"><i class="fas fa-newspaper"></i></div>`}
        </div>
        <div class="blog-content">
          <span class="blog-category">${b.category || 'Legal'}</span>
          <h5 class="blog-title">${b.title}</h5>
          <p class="blog-excerpt">${b.excerpt || b.content.replace(/<[^>]*>/g, '').substring(0, 120)}...</p>
          <div class="blog-meta">
            <span><i class="fas fa-user me-1"></i>${b.author || 'Advocate Chauhan'}</span>
            <span><i class="fas fa-calendar me-1"></i>${formatDate(b.publishedAt || b.createdAt)}</span>
            <span><i class="fas fa-eye me-1"></i>${b.views || 0}</span>
          </div>
          <button class="blog-read-btn" onclick="openBlogModal('${b._id}')">
            Read More <i class="fas fa-arrow-right ms-1"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  if (append) container.insertAdjacentHTML('beforeend', html);
  else container.innerHTML = html;
}

function renderFallbackBlogs() {
  const fallback = [
    { title: 'Know Your Rights: A Guide to Criminal Law', category: 'Criminal Law', excerpt: 'Understanding your fundamental rights when accused of a crime is essential. Here is what every citizen should know...', icon: 'fas fa-gavel' },
    { title: 'Property Registration: Common Mistakes to Avoid', category: 'Property Law', excerpt: 'Many property buyers make critical errors during registration. Learn the top mistakes and how to prevent them...', icon: 'fas fa-home' },
    { title: 'Divorce Law in India: A Complete Guide', category: 'Family Law', excerpt: 'Navigating divorce proceedings can be complex. This guide covers grounds, procedures, and what to expect...', icon: 'fas fa-heart-broken' }
  ];
  return fallback.map((b, i) => `
    <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="${i * 80}">
      <div class="blog-card">
        <div class="blog-image"><div class="blog-image-placeholder"><i class="${b.icon}"></i></div></div>
        <div class="blog-content">
          <span class="blog-category">${b.category}</span>
          <h5 class="blog-title">${b.title}</h5>
          <p class="blog-excerpt">${b.excerpt}</p>
          <div class="blog-meta"><span><i class="fas fa-user me-1"></i>Advocate Chauhan</span></div>
        </div>
      </div>
    </div>
  `).join('');
}

function initBlogLoadMore() {
  const btn = document.getElementById('loadMoreBlogsBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    blogPage++;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Loading...';
    try {
      const data = await apiFetch(`/blogs?page=${blogPage}&limit=6`);
      if (data.success && data.data.length) {
        renderBlogCards(document.getElementById('blogGrid'), data.data, true);
        if (blogPage >= blogTotalPages) btn.style.display = 'none';
      }
    } catch {}
    btn.innerHTML = '<i class="fas fa-plus me-2"></i> Load More Articles';
  });
}

async function openBlogModal(id) {
  const modal = new bootstrap.Modal(document.getElementById('blogModal'));
  document.getElementById('blogModalTitle').textContent = 'Loading...';
  document.getElementById('blogModalBody').innerHTML = '<div class="text-center py-5"><div class="spinner-border text-secondary"></div></div>';
  modal.show();
  try {
    const data = await apiFetch(`/blogs/${id}`);
    if (data.success) {
      document.getElementById('blogModalTitle').textContent = data.data.title;
      document.getElementById('blogModalBody').innerHTML = `
        ${data.data.coverImage ? `<img src="${API_BASE.replace('/api', '') + data.data.coverImage}" class="img-fluid rounded mb-4" alt="${data.data.title}">` : ''}
        <div class="d-flex gap-3 mb-3 text-muted small">
          <span><i class="fas fa-user me-1"></i>${data.data.author}</span>
          <span><i class="fas fa-calendar me-1"></i>${formatDate(data.data.publishedAt)}</span>
          <span><i class="fas fa-tag me-1"></i>${data.data.category}</span>
        </div>
        <div class="blog-full-content">${data.data.content}</div>
      `;
    }
  } catch {
    document.getElementById('blogModalBody').innerHTML = '<p class="text-danger">Failed to load article.</p>';
  }
}

// ─── FAQs ────────────────────────────────────────────────────
async function loadFAQs() {
  const accordion = document.getElementById('faqAccordion');
  try {
    const data = await apiFetch('/faqs');
    const faqs = data.success && data.data.length ? data.data : getFallbackFAQs();
    accordion.innerHTML = faqs.map((f, i) => `
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button ${i !== 0 ? 'collapsed' : ''}" type="button"
            data-bs-toggle="collapse" data-bs-target="#faq${i}">
            ${f.question}
          </button>
        </h2>
        <div id="faq${i}" class="accordion-collapse collapse ${i === 0 ? 'show' : ''}">
          <div class="accordion-body">${f.answer}</div>
        </div>
      </div>
    `).join('');
  } catch {
    const faqs = getFallbackFAQs();
    accordion.innerHTML = faqs.map((f, i) => `
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button ${i !== 0 ? 'collapsed' : ''}" type="button"
            data-bs-toggle="collapse" data-bs-target="#faq${i}">
            ${f.question}
          </button>
        </h2>
        <div id="faq${i}" class="accordion-collapse collapse ${i === 0 ? 'show' : ''}">
          <div class="accordion-body">${f.answer}</div>
        </div>
      </div>
    `).join('');
  }
}

function getFallbackFAQs() {
  return [
    { question: 'What areas of law do you specialize in?', answer: 'We specialize in criminal law, civil litigation, family law, property law, and corporate law. Our experienced team handles matters across all major courts in India.' },
    { question: 'How can I book a consultation?', answer: 'You can book a free consultation through our website\'s appointment form, by calling us directly, or by visiting our office during business hours (Mon-Sat, 9AM-7PM).' },
    { question: 'What documents should I bring for my first consultation?', answer: 'Please bring any relevant documents related to your case such as FIR copies, property documents, marriage certificate, court notices, contracts, or any other paperwork related to your legal matter.' },
    { question: 'How long will my case take?', answer: 'Case duration depends on the type and complexity of your matter. Simple matters may resolve in weeks, while complex litigation can take months or years. We will give you a realistic timeline after reviewing your case.' },
    { question: 'What are your fees?', answer: 'Our fees vary based on case complexity. We offer a free initial consultation. After reviewing your case, we provide transparent fee structures with no hidden charges. We also offer flexible payment options.' },
    { question: 'Do you handle cases outside Delhi?', answer: 'Yes, we handle cases in High Courts across India and the Supreme Court. For district-level cases outside our primary jurisdiction, we have an extensive network of associate advocates.' }
  ];
}

// ─── FORMS ───────────────────────────────────────────────────
function initForms() {
  // Appointment Form
  const apptForm = document.getElementById('appointmentForm');
  apptForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('apptSubmitBtn');
    const alert = document.getElementById('apptAlert');

    if (!apptForm.checkValidity()) {
      apptForm.classList.add('was-validated');
      return;
    }

    setButtonLoading(btn, true, 'Booking...');
    try {
      const payload = getFormData(apptForm);
      const data = await apiFetch('/appointments', 'POST', payload);
      if (data.success) {
        showAlert(alert, 'success', '<i class="fas fa-check-circle me-2"></i>' + data.message);
        apptForm.reset();
        apptForm.classList.remove('was-validated');
        showToast('Appointment booked successfully!', 'success');
      } else {
        showAlert(alert, 'danger', data.message || 'Something went wrong.');
      }
    } catch (err) {
      showAlert(alert, 'danger', 'Server error. Please try again later or call us directly.');
    }
    setButtonLoading(btn, false, '<i class="fas fa-calendar-check me-2"></i> Confirm Appointment');
  });

  // Contact Form
  const contactForm = document.getElementById('contactForm');
  contactForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('contactSubmitBtn');
    const alert = document.getElementById('contactAlert');

    if (!contactForm.checkValidity()) {
      contactForm.classList.add('was-validated');
      return;
    }

    setButtonLoading(btn, true, 'Sending...');
    try {
      const payload = getFormData(contactForm);
      const data = await apiFetch('/contacts', 'POST', payload);
      if (data.success) {
        showAlert(alert, 'success', '<i class="fas fa-check-circle me-2"></i>' + data.message);
        contactForm.reset();
        contactForm.classList.remove('was-validated');
        showToast('Message sent successfully!', 'success');
      } else {
        showAlert(alert, 'danger', data.message || 'Something went wrong.');
      }
    } catch (err) {
      showAlert(alert, 'danger', 'Server error. Please try again later.');
    }
    setButtonLoading(btn, false, '<i class="fas fa-paper-plane me-2"></i> Send Message');
  });

  // Order Details Form
  const orderForm = document.getElementById('orderForm');
  orderForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('orderSubmitBtn');
    const alert = document.getElementById('orderAlert');

    if (!orderForm.checkValidity()) {
      orderForm.classList.add('was-validated');
      return;
    }

    setButtonLoading(btn, true, 'Submitting...');
    try {
      const formData = new FormData(orderForm);
      const res = await fetch(API_BASE + '/orders', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        showAlert(alert, 'success', '<i class="fas fa-check-circle me-2"></i>' + data.message);
        orderForm.reset();
        orderForm.classList.remove('was-validated');
        showToast('Case details submitted successfully!', 'success');
      } else {
        showAlert(alert, 'danger', data.message || 'Something went wrong.');
      }
    } catch (err) {
      showAlert(alert, 'danger', 'Server error. Please try again later or call us directly.');
    }
    setButtonLoading(btn, false, '<i class="fas fa-paper-plane me-2"></i> Submit Case Details');
  });

  // Jr. Advocate Application Modal Form
  const jrForm = document.getElementById('jrForm');
  jrForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = jrForm.querySelector('[type="submit"]');
    const modalBody = document.getElementById('jrModalBody');

    if (!jrForm.checkValidity()) {
      jrForm.classList.add('was-validated');
      return;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...'; }
    try {
      const formData = new FormData(jrForm);
      const res = await fetch(API_BASE + '/jr-advocates', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        modalBody.innerHTML = '<div class="text-center py-4"><i class="fas fa-check-circle fa-3x text-success mb-3"></i><p class="fw-bold fs-5">Application Submitted!</p><p class="text-muted">We have received your application. Our team will review it and get back to you shortly.</p></div>';
      } else {
        if (btn) { btn.disabled = false; btn.innerHTML = 'Submit Application'; }
        showToast(data.message || 'Submission failed. Please try again.', 'danger');
      }
    } catch (err) {
      if (btn) { btn.disabled = false; btn.innerHTML = 'Submit Application'; }
      showToast('Server error. Please try again later.', 'danger');
    }
  });


  // Book Order Form (inside modal)
  const bookOrderForm = document.getElementById('bookOrderForm');
  bookOrderForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('bookOrderSubmitBtn');
    const alert = document.getElementById('bookOrderAlert');

    if (!bookOrderForm.checkValidity()) {
      bookOrderForm.classList.add('was-validated');
      return;
    }

    setButtonLoading(btn, true, 'Placing order...');
    try {
      const payload = getFormData(bookOrderForm);
      const data = await apiFetch('/book-orders', 'POST', payload);
      if (data.success) {
        document.getElementById('bookOrderFormWrap').style.display = 'none';
        document.getElementById('bookOrderSuccess').style.display = 'block';
      } else {
        showAlert(alert, 'danger', data.message || 'Something went wrong.');
        setButtonLoading(btn, false, '<i class="fas fa-shopping-cart me-2"></i> Place Order');
      }
    } catch (err) {
      showAlert(alert, 'danger', 'Server error. Please try again later.');
      setButtonLoading(btn, false, '<i class="fas fa-shopping-cart me-2"></i> Place Order');
    }
  });
}

// ─── BOOK ORDER MODAL OPENER ─────────────────────────────────
function openBookOrder(title, price) {
  // Reset to form state (hide success, show form)
  document.getElementById('bookOrderSuccess').style.display = 'none';
  document.getElementById('bookOrderFormWrap').style.display = 'block';
  document.getElementById('bookOrderModalTitle').textContent = title;
  document.getElementById('bookOrderSummary').innerHTML =
    '<i class="fas fa-book me-2"></i><strong>' + title + '</strong> &nbsp;|&nbsp; Price: <strong>' + price + '</strong>';
  const form = document.getElementById('bookOrderForm');
  form.reset();
  document.getElementById('bo-book-title').value = title;
  document.getElementById('bo-book-price').value = price;
  document.getElementById('bo-quantity').value = 1;
  form.classList.remove('was-validated');
  document.getElementById('bookOrderAlert').innerHTML = '';
  const btn = document.getElementById('bookOrderSubmitBtn');
  setButtonLoading(btn, false, '<i class="fas fa-shopping-cart me-2"></i> Place Order');
  bootstrap.Modal.getOrCreateInstance(document.getElementById('bookOrderModal')).show();
}

// ─── UTILITIES ───────────────────────────────────────────────
async function apiFetch(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(API_BASE + endpoint, options);
  return res.json();
}

function getFormData(form) {
  const data = {};
  new FormData(form).forEach((v, k) => { data[k] = v; });
  return data;
}

function setButtonLoading(btn, loading, label) {
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<i class="fas fa-spinner fa-spin me-2"></i>' + label
    : label;
}

function showAlert(container, type, message) {
  container.innerHTML = `<div class="alert alert-${type} fade show">${message}</div>`;
  setTimeout(() => {
    const alertEl = container.querySelector('.alert');
    if (alertEl) alertEl.classList.remove('show');
    setTimeout(() => container.innerHTML = '', 300);
  }, 5000);
}

function showToast(message, type = 'success') {
  const toastEl = document.getElementById('mainToast');
  const toastMsg = document.getElementById('toastMessage');
  if (!toastEl || !toastMsg) return;
  toastEl.className = `toast align-items-center border-0 text-white bg-${type === 'success' ? 'success' : 'danger'}`;
  toastMsg.textContent = message;
  const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
  toast.show();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── YOUTUBE VIDEOS ──────────────────────────────────────────
const FALLBACK_YOUTUBE = [
  { videoId: 'kH4PwBezGzU', title: 'Civil Litigation Basics' },
  { videoId: 'zlVD_L9OEmY', title: 'Legal Rights & Awareness' },
  { videoId: 'eUk-hRPpV3k', title: 'Family Law Essentials' },
  { videoId: 'Yw6Ojzot9K0', title: 'Criminal Defense Strategies' },
];

async function loadYouTubeVideos() {
  const track = document.getElementById('youtube-track');
  if (!track) return;
  try {
    const data = await apiFetch('/youtube-videos');
    const videos = (data.success && data.data.length) ? data.data : FALLBACK_YOUTUBE;
    track.innerHTML = videos.map((v, i) => `
      <a href="https://youtu.be/${v.videoId}" target="_blank" rel="noopener noreferrer" class="video-card" data-aos="fade-up" data-aos-delay="${i * 70}">
        <div class="video-card-thumb">
          <img src="https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg" alt="${v.title}"
               onerror="this.src='https://placehold.co/320x180/1a1a2e/c9a84c?text=Video'" />
          <div class="video-play-overlay"><div class="video-play-btn">&#9654;</div></div>
        </div>
        <div class="video-card-title">${v.title}</div>
      </a>
    `).join('');
  } catch { /* keep existing hardcoded content */ }
}

// ─── FACEBOOK POSTS ──────────────────────────────────────────
const FALLBACK_FB = [
  { facebookUrl: 'https://www.facebook.com/share/v/18zpWrGinF/', title: 'Civil Law Updates',   thumbnail: '' },
  { facebookUrl: 'https://www.facebook.com/share/v/1Fv7UYc1if/', title: 'Criminal Law Basics', thumbnail: '' },
  { facebookUrl: 'https://www.facebook.com/share/v/1JFJmEPkA7/', title: 'Family Law Tips',     thumbnail: '' },
  { facebookUrl: 'https://www.facebook.com/share/v/1Fv7UYc1if/', title: 'Legal Updates',       thumbnail: '' },
];
const FB_THUMB = 'https://placehold.co/320x180/1877f2/ffffff?text=Facebook+Post';

async function loadFacebookPosts() {
  const track = document.getElementById('facebook-track');
  if (!track) return;
  const MEDIA_BASE = API_BASE.replace('/api', '');
  try {
    const data = await apiFetch('/facebook-posts');
    const posts = (data.success && data.data.length) ? data.data : FALLBACK_FB;
    track.innerHTML = posts.map((p, i) => {
      const thumb = p.thumbnail ? MEDIA_BASE + p.thumbnail : FB_THUMB;
      return `
        <a href="${p.facebookUrl || '#'}" target="_blank" rel="noopener noreferrer" class="video-card" data-aos="fade-up" data-aos-delay="${i * 70}">
          <div class="video-card-thumb">
            <img src="${thumb}" alt="${p.title}" onerror="this.src='${FB_THUMB}'" />
            <div class="video-play-overlay"><div class="video-play-btn">&#9654;</div></div>
          </div>
          <div class="video-card-title">${p.title}</div>
        </a>
      `;
    }).join('');
  } catch { /* keep existing hardcoded content */ }
}

// ─── BOOKS ───────────────────────────────────────────────────
async function loadBooks() {
  const track = document.getElementById('books-track');
  if (!track) return;
  const MEDIA_BASE = API_BASE.replace('/api', '');
  try {
    const data = await apiFetch('/books');
    if (!data.success || !data.data.length) return;
    track.innerHTML = data.data.map((b, i) => {
      const img = b.image
        ? MEDIA_BASE + b.image
        : `https://placehold.co/280x160/1a1a2e/c9a84c?text=${encodeURIComponent(b.name)}`;
      const price = `&#8377;${b.price}`;
      const outOfStock = b.stockStatus === 'out_of_stock';
      return `
        <div class="book-card" data-aos="fade-up" data-aos-delay="${Math.min(i * 60, 300)}">
          <div class="book-card-img">
            <img src="${img}" alt="${b.name}" onerror="this.src='https://placehold.co/280x160/1a1a2e/c9a84c?text=Book'" />
          </div>
          <div class="book-card-body">
            <div class="book-title">${b.name}</div>
            ${b.author ? `<div class="book-author">by ${b.author}</div>` : ''}
            <p class="book-desc">${b.description || ''}</p>
            <div class="book-price">${price}</div>
            ${outOfStock
              ? `<button class="btn btn-secondary btn-sm mt-auto" disabled>Out of Stock</button>`
              : `<button class="btn btn-gold btn-sm mt-auto" onclick="openBookOrder('${b.name.replace(/'/g, "\\'")}','${price}')">Order Now</button>`}
          </div>
        </div>
      `;
    }).join('');
  } catch {}
}

// ─── DRAFTS ──────────────────────────────────────────────────
async function loadDrafts() {
  const track = document.getElementById('drafts-track');
  if (!track) return;
  const MEDIA_BASE = API_BASE.replace('/api', '');
  try {
    const data = await apiFetch('/drafts');
    if (!data.success || !data.data.length) return;
    track.innerHTML = data.data.map((d, i) => `
      <div class="book-card" data-aos="fade-up" data-aos-delay="${Math.min(i * 60, 300)}">
        <div class="book-card-img">
          <img src="https://placehold.co/280x160/1a1a2e/c9a84c?text=Legal+Draft" alt="${d.title}" />
        </div>
        <div class="book-card-body">
          <div class="book-title">${d.title}</div>
          ${d.category ? `<div class="book-author">${d.category}</div>` : ''}
          <p class="book-desc">${d.description || ''}</p>
          ${d.file
            ? `<a href="${MEDIA_BASE + d.file}" target="_blank" rel="noopener noreferrer" class="btn btn-gold btn-sm mt-auto">Download PDF</a>`
            : `<span class="btn btn-outline-secondary btn-sm mt-auto disabled">No File</span>`}
        </div>
      </div>
    `).join('');
  } catch {}
}

// ─── MAGAZINES ───────────────────────────────────────────────
async function loadMagazines() {
  const track = document.getElementById('magazines-track');
  if (!track) return;
  const MEDIA_BASE = API_BASE.replace('/api', '');
  try {
    const data = await apiFetch('/magazines');
    if (!data.success || !data.data.length) return;
    track.innerHTML = data.data.map((m, i) => {
      const img = m.coverImage
        ? MEDIA_BASE + m.coverImage
        : 'https://placehold.co/280x160/1a1a2e/c9a84c?text=Magazine';
      const pdf = m.pdfFile ? MEDIA_BASE + m.pdfFile : '#';
      return `
        <div class="book-card" data-aos="fade-up" data-aos-delay="${Math.min(i * 60, 300)}">
          <div class="book-card-img">
            <img src="${img}" alt="${m.title}" onerror="this.src='https://placehold.co/280x160/1a1a2e/c9a84c?text=Magazine'" />
          </div>
          <div class="book-card-body">
            <div class="book-title">${m.title}</div>
            <p class="book-desc">${m.description || ''}</p>
            <a href="${pdf}" target="_blank" rel="noopener noreferrer" class="btn btn-gold btn-sm mt-auto">View PDF</a>
          </div>
        </div>
      `;
    }).join('');
  } catch {}
}

// ─── LATEST UPDATES ──────────────────────────────────────────
const TYPE_CONFIG = {
  youtube:  { label: 'YouTube',  color: '#ff0000', btnText: 'Watch',    icon: 'fab fa-youtube' },
  facebook: { label: 'Facebook', color: '#1877f2', btnText: 'View Post', icon: 'fab fa-facebook' },
  magazine: { label: 'Magazine', color: '#8B0000', btnText: 'View PDF',  icon: 'fas fa-book-open' },
  draft:    { label: 'Draft',    color: '#2c5f2e', btnText: 'Download',  icon: 'fas fa-file-alt' },
  book:     { label: 'Book',     color: '#a8893a', btnText: 'Order Now', icon: 'fas fa-book' },
};

async function loadLatestUpdates() {
  const track   = document.getElementById('latest-track');
  const spinner = document.getElementById('latestLoadingSpinner');
  const outer   = document.getElementById('latestSliderOuter');
  const section = document.getElementById('latest-updates');
  if (!track) return;

  const MEDIA_BASE = API_BASE.replace('/api', '');

  try {
    const [yt, fb, mag, dr, bk] = await Promise.allSettled([
      apiFetch('/youtube-videos'),
      apiFetch('/facebook-posts'),
      apiFetch('/magazines'),
      apiFetch('/drafts'),
      apiFetch('/books'),
    ]);

    const all = [];

    if (yt.status === 'fulfilled' && yt.value?.success)
      yt.value.data.slice(0, 6).forEach(v => all.push({
        type: 'youtube', title: v.title,
        thumb: `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`,
        href: `https://youtu.be/${v.videoId}`,
        date: v.createdAt,
      }));

    if (fb.status === 'fulfilled' && fb.value?.success)
      fb.value.data.slice(0, 6).forEach(p => all.push({
        type: 'facebook', title: p.title,
        thumb: p.thumbnail ? MEDIA_BASE + p.thumbnail : 'https://placehold.co/300x170/1877f2/ffffff?text=Facebook',
        href: p.facebookUrl || '#',
        date: p.date || p.createdAt,
      }));

    if (mag.status === 'fulfilled' && mag.value?.success)
      mag.value.data.slice(0, 6).forEach(m => all.push({
        type: 'magazine', title: m.title,
        thumb: m.coverImage ? MEDIA_BASE + m.coverImage : 'https://placehold.co/300x170/1a1a2e/c9a84c?text=Magazine',
        href: m.pdfFile ? MEDIA_BASE + m.pdfFile : '#',
        date: m.publishedDate || m.createdAt,
      }));

    if (dr.status === 'fulfilled' && dr.value?.success)
      dr.value.data.slice(0, 6).forEach(d => all.push({
        type: 'draft', title: d.title,
        thumb: 'https://placehold.co/300x170/1a1a2e/c9a84c?text=Legal+Draft',
        href: d.file ? MEDIA_BASE + d.file : '#',
        date: d.date || d.createdAt,
        sub: d.category,
      }));

    if (bk.status === 'fulfilled' && bk.value?.success)
      bk.value.data.slice(0, 6).forEach(b => all.push({
        type: 'book', title: b.name,
        thumb: b.image ? MEDIA_BASE + b.image : 'https://placehold.co/300x170/1a1a2e/c9a84c?text=Book',
        href: '#books',
        date: b.createdAt,
        price: `&#8377;${b.price}`,
        sub: b.author,
      }));

    all.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (spinner) spinner.style.display = 'none';

    if (!all.length) {
      if (section) section.style.display = 'none';
      return;
    }

    track.innerHTML = all.map((item, i) => {
      const cfg = TYPE_CONFIG[item.type];
      const isVideo = item.type === 'youtube' || item.type === 'facebook';
      return `
        <div class="latest-card" data-aos="fade-up" data-aos-delay="${Math.min(i * 40, 200)}">
          <div class="latest-card-img">
            <img src="${item.thumb}" alt="${item.title}"
                 onerror="this.src='https://placehold.co/300x170/1a1a2e/c9a84c?text=${encodeURIComponent(cfg.label)}'" />
            <span class="latest-type-pill" style="background:${cfg.color}">
              <i class="${cfg.icon} me-1"></i>${cfg.label}
            </span>
            ${isVideo ? '<div class="video-play-overlay"><div class="video-play-btn">&#9654;</div></div>' : ''}
          </div>
          <div class="latest-card-body">
            <div class="latest-card-title" title="${item.title}">${item.title}</div>
            ${item.sub   ? `<div class="latest-card-meta">${item.sub}</div>` : ''}
            ${item.price ? `<div class="latest-card-price">${item.price}</div>` : ''}
            <div class="latest-card-date"><i class="fas fa-calendar-alt me-1"></i>${formatDate(item.date)}</div>
            <a href="${item.href}"
               ${item.type !== 'book' ? 'target="_blank" rel="noopener noreferrer"' : ''}
               class="btn btn-gold btn-sm w-100 mt-auto">
              ${cfg.btnText} <i class="fas fa-arrow-right ms-1"></i>
            </a>
          </div>
        </div>
      `;
    }).join('');

    if (outer) outer.style.display = 'flex';

  } catch {
    if (spinner) spinner.style.display = 'none';
    if (section) section.style.display = 'none';
  }
}
