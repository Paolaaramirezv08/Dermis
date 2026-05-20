// ============================================================
// DERMIS STUDIO - PREMIUM DERMATOLOGY CLINIC
// Complete JavaScript | Login | Admin Dashboard | Booking | Theme
// ============================================================
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";
  import firebaseConfig from "./firebase-config";
// ============================================================
// CONFIGURATION & STATE
// ============================================================

const CONFIG = {
  workHours: { start: 9, end: 18 },
  slotDuration: 30,
  appointmentsKey: 'dermisstudio_appointments',
  usersKey: 'dermisstudio_users',
  currentUserKey: 'dermisstudio_current_user',
  themeKey: 'dermisstudio_theme'
};

let currentUser = null;
let currentDate = new Date();
let selectedDate = null;
let testimonialInterval = null;
let activeTestimonial = 0;

// ============================================================
// TESTIMONIALS DATA
// ============================================================

const testimonialItems = [
  {
    quote: 'The team helped me feel confident again. My skin has never looked better, and every visit felt carefully personalized.',
    name: 'Olivia Martin',
    role: 'Marketing Director',
    initials: 'OM'
  },
  {
    quote: 'I loved how streamlined the appointment process was. The doctor was attentive and explained every step clearly.',
    name: 'Jason Lee',
    role: 'Entrepreneur',
    initials: 'JL'
  },
  {
    quote: 'Beautiful clinic, luxurious atmosphere, and an exceptional treatment plan for my acne concerns. Highly recommend.',
    name: 'Emma Parker',
    role: 'Product Designer',
    initials: 'EP'
  }
];

// ============================================================
// THEME MANAGEMENT
// ============================================================

function initializeTheme() {
  const savedTheme = localStorage.getItem(CONFIG.themeKey) || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeToggle();
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(CONFIG.themeKey, newTheme);
  updateThemeToggle();
}

function updateThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  const currentTheme = document.documentElement.getAttribute('data-theme');
  themeToggle.textContent = currentTheme === 'light' ? '🌙' : '☀️';
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOutToast 0.3s var(--transition)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================
// LOCAL STORAGE UTILITIES
// ============================================================

function getAppointments() {
  const data = localStorage.getItem(CONFIG.appointmentsKey);
  return data ? JSON.parse(data) : [];
}

function saveAppointments(appointments) {
  localStorage.setItem(CONFIG.appointmentsKey, JSON.stringify(appointments));
}

function getUsers() {
  const data = localStorage.getItem(CONFIG.usersKey);
  return data ? JSON.parse(data) : [];
}

function saveUsers(users) {
  localStorage.setItem(CONFIG.usersKey, JSON.stringify(users));
}

function getCurrentUser() {
  const data = localStorage.getItem(CONFIG.currentUserKey);
  return data ? JSON.parse(data) : null;
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(CONFIG.currentUserKey, JSON.stringify(user));
    currentUser = user;
  } else {
    localStorage.removeItem(CONFIG.currentUserKey);
    currentUser = null;
  }
}

// ============================================================
// LOGIN SYSTEM
// ============================================================

function initializeLoginSystem() {
  const loginModal = document.getElementById('loginModal');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const userButton = document.getElementById('userButton');
  const userMenu = document.getElementById('userMenu');
  const userDropdown = document.getElementById('userDropdown');
  const userInfo = document.getElementById('userInfo');
  const userName = document.getElementById('userName');
  const userRole = document.getElementById('userRole');
  const logoutBtn = document.getElementById('logoutBtn');
  const closeLoginModal = document.getElementById('closeLoginModal');
  const adminDashBtn = document.getElementById('adminDashBtn');

  // Check if user is already logged in
  currentUser = getCurrentUser();
  if (currentUser) {
    updateUserUI();
  } else {
    loginModal.classList.add('active');
  }

  // Open/close modals and dropdowns
  userButton.addEventListener('click', () => {
    userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!userMenu.contains(e.target)) {
      userDropdown.style.display = 'none';
    }
  });

  closeLoginModal.addEventListener('click', () => {
    if (currentUser) loginModal.classList.remove('active');
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginError.textContent = '';

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
      loginError.textContent = 'Please fill in all fields';
      return;
    }

    if (!validateEmail(email)) {
      loginError.textContent = 'Please enter a valid email';
      return;
    }

    // Determine user role
    const isAdmin = email.endsWith('@colegiomanoamiga.edu.ar');
    const role = isAdmin ? 'admin' : 'user';

    // Create or get user
    const users = getUsers();
    let user = users.find(u => u.email === email);
    
    if (!user) {
      user = {
        id: Date.now(),
        email,
        role,
        createdAt: new Date().toISOString()
      };
      users.push(user);
      saveUsers(users);
    }

    setCurrentUser(user);
    loginModal.classList.remove('active');
    updateUserUI();
    showToast(`Welcome ${email}!`, 'success');
  });

  logoutBtn.addEventListener('click', () => {
    setCurrentUser(null);
    userDropdown.style.display = 'none';
    loginModal.classList.add('active');
    loginForm.reset();
    showToast('Logged out successfully', 'success');
  });

  adminDashBtn.addEventListener('click', () => {
    openAdminDashboard();
    userDropdown.style.display = 'none';
  });

  // Booking button requires login
  document.getElementById('bookHeroBtn').addEventListener('click', () => {
    if (!currentUser) {
      loginModal.classList.add('active');
      showToast('Please log in to book an appointment', 'warning');
    }
  });

  function updateUserUI() {
    userButton.textContent = currentUser.email;
    userName.textContent = currentUser.email;
    userRole.textContent = currentUser.role.toUpperCase();
    userRole.style.display = 'inline-block';
    userInfo.style.display = 'block';
    logoutBtn.style.display = 'block';
    adminDashBtn.style.display = currentUser.role === 'admin' ? 'block' : 'none';
  }
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================

function openAdminDashboard() {
  const adminModal = document.getElementById('adminModal');
  adminModal.classList.add('active');
  loadAdminData();
  setupAdminControls();
}

function closeAdminDashboard() {
  const adminModal = document.getElementById('adminModal');
  adminModal.classList.remove('active');
}

function loadAdminData() {
  const appointments = getAppointments();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalAppointments = appointments.length;
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date + 'T00:00:00');
    return aptDate.getTime() === today.getTime();
  }).length;
  
  const uniquePatients = new Set(appointments.map(apt => apt.email)).size;

  document.getElementById('totalAppointments').textContent = totalAppointments;
  document.getElementById('todayAppointments').textContent = todayAppointments;
  document.getElementById('totalPatients').textContent = uniquePatients;

  displayAppointmentsTable(appointments);
}

function displayAppointmentsTable(appointments) {
  const tbody = document.getElementById('appointmentsTableBody');
  tbody.innerHTML = '';

  if (appointments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No appointments yet</td></tr>';
    return;
  }

  appointments.forEach((apt, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${apt.name}</td>
      <td>${apt.email}</td>
      <td>${apt.phone}</td>
      <td>${formatDateDisplay(apt.date)}</td>
      <td>${formatTimeDisplay(apt.time)}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn" onclick="editAdminAppointment(${apt.id})">Edit</button>
          <button class="action-btn delete" onclick="deleteAdminAppointment(${apt.id})">Delete</button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function setupAdminControls() {
  const searchInput = document.getElementById('adminSearch');
  const filterSelect = document.getElementById('adminFilter');
  const appointments = getAppointments();

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const filtered = appointments.filter(apt => 
      apt.name.toLowerCase().includes(query) ||
      apt.email.toLowerCase().includes(query) ||
      apt.phone.includes(query)
    );
    displayAppointmentsTable(filtered);
  });

  filterSelect.addEventListener('change', () => {
    const filter = filterSelect.value;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filtered = appointments;
    if (filter === 'today') {
      filtered = appointments.filter(apt => {
        const aptDate = new Date(apt.date + 'T00:00:00');
        return aptDate.getTime() === today.getTime();
      });
    } else if (filter === 'upcoming') {
      filtered = appointments.filter(apt => {
        const aptDate = new Date(apt.date + 'T00:00:00');
        return aptDate >= today;
      });
    } else if (filter === 'past') {
      filtered = appointments.filter(apt => {
        const aptDate = new Date(apt.date + 'T00:00:00');
        return aptDate < today;
      });
    }
    displayAppointmentsTable(filtered);
  });
}

function deleteAdminAppointment(id) {
  if (confirm('Are you sure you want to delete this appointment?')) {
    let appointments = getAppointments();
    appointments = appointments.filter(apt => apt.id !== id);
    saveAppointments(appointments);
    loadAdminData();
    showToast('Appointment deleted', 'success');
  }
}

function editAdminAppointment(id) {
  showToast('Edit functionality coming soon', 'warning');
}

// ============================================================
// VALIDATION UTILITIES
// ============================================================

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^\+?[0-9\s\-()]{7,20}$/.test(phone);
}


// ============================================================
// DATE & TIME FORMATTING
// ============================================================

function formatDateISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

function formatTimeDisplay(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// ============================================================
// CALENDAR & APPOINTMENT FUNCTIONS
// ============================================================

function generateTimeSlots(dateString) {
  const slots = [];
  const selectedDay = new Date(dateString + 'T00:00:00').getDay();

  if (selectedDay === 0 || selectedDay === 6) return slots;

  for (let hour = CONFIG.workHours.start; hour < CONFIG.workHours.end; hour++) {
    for (let minute = 0; minute < 60; minute += CONFIG.slotDuration) {
      const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
}

function hasAvailableSlots(dateString) {
  const slots = generateTimeSlots(dateString);
  if (slots.length === 0) return false;

  const appointments = getAppointments();
  const bookedSlots = appointments
    .filter(apt => apt.date === dateString)
    .map(apt => apt.time);

  return bookedSlots.length < slots.length;
}

function getBookedSlotsForDate(dateString) {
  const appointments = getAppointments();
  return appointments
    .filter(apt => apt.date === dateString)
    .map(apt => apt.time);
}

function isSlotBooked(dateString, timeString) {
  const appointments = getAppointments();
  return appointments.some(apt => apt.date === dateString && apt.time === timeString);
}

function renderCalendar() {
  const calendarMonthYear = document.getElementById('calendar-month-year');
  const calendarDays = document.getElementById('calendar-days');
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  calendarMonthYear.textContent = monthName;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  calendarDays.innerHTML = '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day other-month';
    dayEl.textContent = day;
    calendarDays.appendChild(dayEl);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateISO = formatDateISO(date);
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.textContent = day;

    if (date < today) {
      dayEl.classList.add('disabled');
    } else {
      if (!hasAvailableSlots(dateISO)) {
        dayEl.classList.add('booked');
      }
      dayEl.addEventListener('click', () => selectDate(dateISO, dayEl));
    }

    if (selectedDate === dateISO) {
      dayEl.classList.add('selected');
    }

    calendarDays.appendChild(dayEl);
  }

  const totalCells = firstDay + daysInMonth;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let day = 1; day <= remainingCells; day++) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day other-month';
    dayEl.textContent = day;
    calendarDays.appendChild(dayEl);
  }
}

function selectDate(dateISO, dayEl) {
  document.querySelectorAll('.calendar-day.selected').forEach(el => {
    el.classList.remove('selected');
  });

  dayEl.classList.add('selected');
  selectedDate = dateISO;
  populateTimeSlots(dateISO);
}

function populateTimeSlots(dateISO) {
  const bookTimeSelect = document.getElementById('book-time');
  bookTimeSelect.innerHTML = '<option value="" disabled selected>Select time</option>';

  const slots = generateTimeSlots(dateISO);
  if (slots.length === 0) {
    const option = document.createElement('option');
    option.disabled = true;
    option.textContent = 'No slots available (weekend)';
    bookTimeSelect.appendChild(option);
    return;
  }

  const bookedSlots = getBookedSlotsForDate(dateISO);

  slots.forEach(slot => {
    const option = document.createElement('option');
    option.value = slot;
    option.textContent = formatTimeDisplay(slot);

    if (bookedSlots.includes(slot)) {
      option.disabled = true;
      option.textContent += ' (Booked)';
    }

    bookTimeSelect.appendChild(option);
  });
}

// ============================================================
// BOOKING FORM
// ============================================================

function initializeBookingForm() {
  const bookingForm = document.getElementById('booking-form');
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  const bookingError = document.getElementById('booking-error');
  const bookingSuccess = document.getElementById('booking-success');

  prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    bookingError.textContent = '';
    bookingSuccess.textContent = '';

    if (!currentUser) {
      bookingError.textContent = 'Please log in to book an appointment';
      return;
    }

    const name = document.getElementById('book-name').value.trim();
    const email = document.getElementById('book-email').value.trim();
    const phone = document.getElementById('book-phone').value.trim();
    const bookTimeSelect = document.getElementById('book-time');
    const time = bookTimeSelect.value;

    if (!name || !email || !phone || !selectedDate || !time) {
      bookingError.textContent = 'Please complete all fields.';
      return;
    }

    if (!validateEmail(email)) {
      bookingError.textContent = 'Please enter a valid email address.';
      return;
    }

    if (!validatePhone(phone)) {
      bookingError.textContent = 'Please enter a valid phone number.';
      return;
    }

    if (isSlotBooked(selectedDate, time)) {
      bookingError.textContent = 'This time slot is no longer available.';
      return;
    }

    const appointment = {
      id: Date.now(),
      name,
      email,
      phone,
      date: selectedDate,
      time,
      bookedAt: new Date().toISOString()
    };

    const appointments = getAppointments();
    appointments.push(appointment);
    saveAppointments(appointments);

    bookingSuccess.textContent = `✓ Appointment booked for ${formatDateDisplay(selectedDate)} at ${formatTimeDisplay(time)}`;
    showToast('Appointment booked successfully!', 'success');

    bookingForm.reset();
    bookTimeSelect.innerHTML = '<option value="" disabled selected>Select time</option>';
    renderCalendar();

    setTimeout(() => {
      selectedDate = null;
      renderCalendar();
    }, 2000);
  });

  renderCalendar();
}

// ============================================================
// TESTIMONIALS
// ============================================================

function initializeTestimonials() {
  const prevBtn = document.getElementById('testimonial-prev');
  const nextBtn = document.getElementById('testimonial-next');

  function setActiveTestimonial(index) {
    activeTestimonial = (index + testimonialItems.length) % testimonialItems.length;
    updateTestimonial();
    updateDots();
  }

  function updateTestimonial() {
    const quoteEl = document.getElementById('testimonial-quote');
    const nameEl = document.getElementById('testimonial-name');
    const roleEl = document.getElementById('testimonial-role');
    const avatarEl = document.getElementById('testimonial-avatar');

    const testimonial = testimonialItems[activeTestimonial];
    quoteEl.textContent = testimonial.quote;
    nameEl.textContent = testimonial.name;
    roleEl.textContent = testimonial.role;
    avatarEl.textContent = testimonial.initials;
  }

  function updateDots() {
    document.querySelectorAll('.dot').forEach((dot, index) => {
      dot.classList.toggle('active', index === activeTestimonial);
    });
  }

  prevBtn.addEventListener('click', () => {
    setActiveTestimonial(activeTestimonial - 1);
    clearInterval(testimonialInterval);
    startTestimonialAutoplay();
  });

  nextBtn.addEventListener('click', () => {
    setActiveTestimonial(activeTestimonial + 1);
    clearInterval(testimonialInterval);
    startTestimonialAutoplay();
  });

  document.querySelectorAll('.dot').forEach((dot, index) => {
    dot.addEventListener('click', () => {
      setActiveTestimonial(index);
      clearInterval(testimonialInterval);
      startTestimonialAutoplay();
    });
  });

  function startTestimonialAutoplay() {
    testimonialInterval = setInterval(() => {
      setActiveTestimonial(activeTestimonial + 1);
    }, 8000);
  }

  updateTestimonial();
  updateDots();
  startTestimonialAutoplay();
}

// ============================================================
// SCROLL ANIMATIONS
// ============================================================

function initializeScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-slide').forEach(el => observer.observe(el));
}

// ============================================================
// FLOATING BUTTONS
// ============================================================

function initializeFloatingButtons() {
  const stickyBook = document.getElementById('sticky-book');
  const scrollToTop = document.getElementById('scrollToTop');
  const quickBooking = document.getElementById('quickBooking');

  stickyBook.addEventListener('click', () => {
    if (!currentUser) {
      document.getElementById('loginModal').classList.add('active');
      showToast('Please log in first', 'warning');
      return;
    }
    quickBooking.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  scrollToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      stickyBook.classList.add('visible');
      scrollToTop.classList.add('visible');
    } else {
      stickyBook.classList.remove('visible');
      scrollToTop.classList.remove('visible');
    }
  });
}

// ============================================================
// SMOOTH NAVIGATION
// ============================================================

function initializeSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ============================================================
// INITIALIZATION
// ============================================================

function init() {
  initializeTheme();
  initializeLoginSystem();
  initializeBookingForm();
  initializeTestimonials();
  initializeScrollAnimations();
  initializeFloatingButtons();
  initializeSmoothScroll();

  // Hide loader
  const loader = document.getElementById('loaderOverlay');
  setTimeout(() => {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 300);
  }, 2000);
}

// Run on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
