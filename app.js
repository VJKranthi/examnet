/* app.js
 * - Single-file front-end app combining routing and quiz logic
 * - Includes added functions for responsive navigation bar control
 * - Assumes the quiz page uses 'quiz.html?subject=physics'
 * - The main page uses hash routing: #/home, #/mocktests, #/admin
 * - Questions are loaded from data/quizzes.json
 */

/* --------- Utility helpers & DOM Element Selection --------- */
// --- NAVBAR TOGGLE LOGIC (Assuming you use this) ---
// --- NAVBAR TOGGLE LOGIC (Assuming you use this) ---
// --- NAVBAR AND MENU TOGGLE LOGIC ---

function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
}

function closeMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
    }
}

// --- ACCESS CONTROL AND MODAL LOGIC ---

document.addEventListener('DOMContentLoaded', () => {
    const modalOverlay = document.getElementById('registration-modal-overlay');
    const mainContent = document.querySelector('.main-content-wrapper');
    const adminLinkNav = document.getElementById('admin-link-nav');

    // 1. Check if the user has registered
    if (localStorage.getItem('userRegistered') === 'true') {
        // If registered, show the main content and hide the modal
        if (modalOverlay) modalOverlay.style.display = 'none';
        if (mainContent) mainContent.classList.remove('hidden');
    } else {
        // If not registered, show the modal and hide the main content
        if (modalOverlay) modalOverlay.style.display = 'flex';
        if (mainContent) mainContent.classList.add('hidden');
    }

    // 2. Check if admin is logged in to show the Admin Portal link
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        if (adminLinkNav) {
            adminLinkNav.style.display = 'block';
        }
    } else {
         // Hide the Admin Portal link by default if not logged in
        if (adminLinkNav) {
            adminLinkNav.style.display = 'none';
        }
    }
    
    // 3. Attach event listener for the registration form (only if it exists)
    const registrationForm = document.getElementById('registration-form');
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistration);
    }
});


// --- REGISTRATION AND DATA STORAGE LOGIC ---

function handleRegistration(e) {
    e.preventDefault();

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const level = document.getElementById('reg-level').value;
    const message = document.getElementById('registration-message');
    
    message.style.display = 'none';
    message.classList.remove('success');
    message.classList.add('error-message');

    if (!name || !email || !level) {
        message.textContent = "Please fill in all fields.";
        message.style.display = 'block';
        return;
    }

    // Prepare user data
    const userData = {
        name: name,
        email: email,
        level: level,
        date: new Date().toLocaleDateString('en-GB')
    };

    // 1. Get existing registrations or initialize an empty array
    let registrations = JSON.parse(localStorage.getItem('userRegistrations') || '[]');

    // 2. Add new user registration
    registrations.push(userData);

    // 3. Save the updated array back to Local Storage
    localStorage.setItem('userRegistrations', JSON.stringify(registrations));
    
    // 4. Set a flag indicating the current user has registered
    localStorage.setItem('userRegistered', 'true');

    // 5. Success message and hiding the modal
    message.classList.remove('error-message');
    message.classList.add('success');
    message.textContent = `Success! Welcome, ${name}. Accessing content...`;
    message.style.display = 'block';

    // Hide the modal and show main content after a short delay
    setTimeout(() => {
        document.getElementById('registration-modal-overlay').style.display = 'none';
        document.querySelector('.main-content-wrapper').classList.remove('hidden');
        document.body.style.overflow = 'auto'; // Re-enable scrolling
    }, 1000);
}
const $ = sel => document.querySelector(sel);
const container = $('#app');

// Global DOM elements (Will be initialized on DOMContentLoaded)
let quizRegistration;
let registrationForm;
let quizWrapper;

// Function to safely select DOM elements after the page is loaded
function initDomElements() {
    // These elements must exist in your HTML for the registration logic to work
    quizRegistration = document.getElementById('quiz-registration-form');
    registrationForm = document.getElementById('registration-form-wrapper');
    quizWrapper = document.getElementById('quiz-main-wrapper'); 

    // Add listeners only if elements are present (i.e., on the correct page)
    if (quizRegistration) {
        quizRegistration.addEventListener('submit', handleRegistrationSubmit);
    }
}


// --- QUIZ.HTML GLOBAL STATE (Keeping this section) ---
let quizQuestions = [];
let userAnswers = {}; 
let currentQuestionIndex = 0;
let timerInterval;
const TIME_LIMIT = 1200; // 20 minutes
let timeLeft = TIME_LIMIT;
let quizSubject = '';
const SESSION_START_INDEX = 20; // CHANGE THE VALUE HERE
const SESSION_SIZE = 20;
// -----------------------------

/* -------------------------------------- */
/* --- RESPONSIVE NAVBAR FUNCTIONS (NEW) --- */
/* -------------------------------------- */

// Function to open/close the mobile navigation menu (Exposed to global window for inline HTML onclick)
window.toggleMenu = () => {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        // Toggles the 'active-menu' class on the <ul> element
        navMenu.classList.toggle('active-menu');
    }
}

// Function to explicitly close the mobile menu (called by link clicks) (Exposed to global window for inline HTML onclick)
window.closeMenu = () => {
    const navMenu = document.getElementById('navMenu');
    if (navMenu && navMenu.classList.contains('active-menu')) {
        navMenu.classList.remove('active-menu');
    }
}


/* -------------------------------------- */
/* --- REGISTRATION & QUIZ INIT LOGIC --- */
/* -------------------------------------- */

// Consolidated registration handler
function handleRegistrationSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const level = document.getElementById('level').value;

    // 🌟 LOGIC TO SAVE REGISTRATION DATA TO LOCAL STORAGE 🌟
    const newRegistration = {
        name: name,
        email: email,
        level: level,
        date: new Date().toLocaleDateString()
    };
    
    // Get existing registrations or initialize an empty array
    const existingRegistrations = JSON.parse(localStorage.getItem('quizRegistrations') || '[]');
    
    // Add the new registration
    existingRegistrations.push(newRegistration);
    
    // Save the updated list back to Local Storage
    localStorage.setItem('quizRegistrations', JSON.stringify(existingRegistrations));
    console.log(`Registration Data Saved: Name: ${name}, Email: ${email}, Level: ${level}`);
    // 🌟 END STORAGE LOGIC 🌟

    // Hide registration and show quiz
    if (registrationForm) registrationForm.classList.add('hidden');
    if (quizWrapper) quizWrapper.classList.remove('hidden');

    // Initialize the quiz after registration
    initQuiz();
}

// Function to load questions and initialize quiz elements
async function initQuiz() {
    const urlParams = new URLSearchParams(window.location.search);
    quizSubject = urlParams.get('subject') || 'physics'; // Default to physics

    // Load questions from JSON
    try {
        const data = await loadJSON('data/quizzes.json');
        
        if (!data) {
            document.getElementById('question-card').innerHTML = "<h3>Error loading quiz data. Please check data/quizzes.json or file path.</h3>";
            return;
        }

        // Check if the subject exists and get the desired session slice
        const allQuestions = data[quizSubject] || [];
        // Use slice(start, start + size) for session logic
        quizQuestions = allQuestions.slice(SESSION_START_INDEX, SESSION_START_INDEX + SESSION_SIZE); 

        if (quizQuestions.length > 0) {
            const subjectTitle = quizSubject.charAt(0).toUpperCase() + quizSubject.slice(1);
            const quizTitleElement = document.getElementById('quizTitle');
            const currentQuizNameElement = document.getElementById('current-quiz-name');
            
            if (quizTitleElement) quizTitleElement.textContent = `${subjectTitle} Mock Test`;
            if (currentQuizNameElement) currentQuizNameElement.textContent = `${subjectTitle} Mock Test (${quizQuestions.length} Qs)`;
            
            initializeQuiz(); // The core setup function
        } else {
            document.getElementById('question-card').innerHTML = "<h3>No questions found for this subject or session range is invalid.</h3>";
        }
    } catch (error) {
        console.error('Error handling quiz data:', error);
        document.getElementById('question-card').innerHTML = "<h3>Error processing quiz data.</h3>";
    }
}


/* --------- Utility helpers (Existing) --------- */
// Function to safely load JSON data (handles file paths and local storage overrides)
async function loadJSON(path) {
    try {
        const res = await fetch(path, { cache: "no-cache" });
        if (!res.ok) throw new Error('Failed to load ' + path);
        return await res.json();
    } catch (err) {
        console.error('Error loading JSON from:', path, err);
        // Fallback for file:// protocol on some browsers
        if (window.location.protocol === 'file:') {
            console.warn("If this fails, please run a local server (like live-server) for file loading.");
        }
        return null;
    }
}

function escapeHtml(text) {
    if (!text && text !== 0) return '';
    return String(text)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

/* -------------------------------------- */
/* --- QUIZ PAGE (quiz.html) FUNCTIONS --- */
/* -------------------------------------- */

function initializeQuiz() {
    // Set up the answer map
    quizQuestions.forEach((q, index) => userAnswers[index] = null);

    // Start Timer
    startTimer();

    // Setup Navigator and first question
    renderQuestion(0);
    renderNavigator();
}

function startTimer() {
    // Clear any existing timer to prevent duplicates
    clearInterval(timerInterval); 
    
    timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        const timerElement = document.getElementById('quiz-timer');
        if (timerElement) {
            timerElement.textContent =
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Time's up! Submitting your test.");
            submitQuiz();
        }
    }, 1000);
}

function renderQuestion(index) {
    currentQuestionIndex = index;
    const questionData = quizQuestions[index];
    const card = document.getElementById('question-card');

    if (!card || !questionData) return;

    // Update question counter and progress bar
    const totalQs = quizQuestions.length;
    const qCounter = document.getElementById('question-counter');
    const qProgress = document.getElementById('quiz-progress');
    
    if (qCounter) qCounter.textContent = `Question ${index + 1} of ${totalQs}`;
    if (qProgress) qProgress.style.width = `${((index + 1) / totalQs) * 100}%`;

    // Render the question card
    card.innerHTML = `<h3>${index + 1}. ${escapeHtml(questionData.question)}</h3><div id="options-container"></div>`;

    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer) {
        questionData.options.forEach((option, optionIndex) => {
            const optionHTML = document.createElement('label');
            optionHTML.className = 'option';
            // Use 'escapeHtml' for question and options text
            optionHTML.innerHTML = `
                <input type="radio" 
                    name="question-${index}" 
                    value="${optionIndex}"
                    ${userAnswers[index] === optionIndex ? 'checked' : ''}
                    onchange="saveAnswer(${index}, ${optionIndex})">
                ${String.fromCharCode(65 + optionIndex)}. ${escapeHtml(option)}
            `;
            optionsContainer.appendChild(optionHTML);
        });
    }

    // Update navigation buttons visibility
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (prevBtn) prevBtn.style.display = index === 0 ? 'none' : 'inline-block';
    if (nextBtn) {
        nextBtn.textContent = index === totalQs - 1 ? 'Review & Submit' : 'Next →';
        // Assign the correct function to the button
        nextBtn.onclick = index === totalQs - 1 ? submitQuiz : () => window.showQuestion('next');
    }

    // Update navigator button active state
    renderNavigator();
}

// Make saveAnswer, showQuestion, and submitQuiz globally accessible for inline handlers
window.saveAnswer = (qIndex, oIndex) => {
    userAnswers[qIndex] = oIndex;
    renderNavigator(); // Update the navigator button color immediately
};

window.showQuestion = (direction) => {
    let nextIndex = currentQuestionIndex;
    if (direction === 'next' && currentQuestionIndex < quizQuestions.length - 1) {
        nextIndex++;
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
        nextIndex--;
    }
    renderQuestion(nextIndex);
};

function renderNavigator() {
    const navigator = document.getElementById('question-navigator');
    if (!navigator) return;

    navigator.innerHTML = ''; // Clear previous buttons

    quizQuestions.forEach((q, index) => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.textContent = index + 1;
        btn.onclick = () => renderQuestion(index);

        if (index === currentQuestionIndex) {
            btn.classList.add('active');
        }
        if (userAnswers[index] !== null) {
            btn.classList.add('answered');
        }

        navigator.appendChild(btn);
    });
}

window.submitQuiz = () => {
    clearInterval(timerInterval); // Stop the timer

    let correctCount = 0;
    let wrongCount = 0;

    const totalQuestions = quizQuestions.length;

    // Calculate score
    quizQuestions.forEach((q, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === q.answer;

        if (isCorrect) {
            correctCount++;
        } else if (userAnswer !== null) {
            wrongCount++;
        }
    });
    
    // Display score summary
    document.getElementById('correct-count').textContent = correctCount;
    document.getElementById('wrong-count').textContent = wrongCount;
    document.getElementById('final-score').textContent = correctCount;
    document.getElementById('total-questions').textContent = totalQuestions;

    // Hide question elements
    if (document.getElementById('question-card')) document.getElementById('question-card').style.display = 'none';
    if (document.getElementById('prev-btn')) document.getElementById('prev-btn').style.display = 'none';
    if (document.getElementById('next-btn')) document.getElementById('next-btn').style.display = 'none';
    if (document.querySelector('.progress-bar-container')) document.querySelector('.progress-bar-container').style.display = 'none';
    if (document.querySelector('.timer-box')) document.querySelector('.timer-box').style.display = 'none';

    // Show result sidebar and review section
    if (document.getElementById('quiz-summary-box')) document.getElementById('quiz-summary-box').style.display = 'block';
    if (document.querySelector('.submit-btn')) document.querySelector('.submit-btn').style.display = 'none';
    if (document.querySelector('.navigator-box')) document.querySelector('.navigator-box').style.display = 'none';

    // RENDER THE FULL REVIEW
    renderReviewMode(totalQuestions, correctCount, wrongCount);

    alert(`Quiz Submitted! Score: ${correctCount}/${totalQuestions}`);
};


/**
 * Renders the detailed review section
 */
function renderReviewMode(totalQs, correctQs, wrongQs) {
    const reviewContainer = document.getElementById('result-review');
    if (!reviewContainer) return;

    reviewContainer.style.display = 'block';

    let reviewHTML = `<h2>Quiz Review: ${correctQs} Correct out of ${totalQs}</h2>`;

    quizQuestions.forEach((question, qIndex) => {
        const userAnswerIndex = userAnswers[qIndex];
        const isCorrect = userAnswerIndex === question.answer;
        const statusClass = isCorrect ? 'correct' : (userAnswerIndex !== null ? 'wrong' : 'unattempted');

        reviewHTML += `
            <div class="result-item ${statusClass}">
                <h4>Q${qIndex + 1}: ${escapeHtml(question.question)}</h4>

                <div class="options-review">
                    ${question.options.map((optionText, oIndex) => {
                        let optionClass = '';
                        let statusMarker = '';
                        const isCorrectOption = oIndex === question.answer;
                        const isUserAnswer = oIndex === userAnswerIndex;

                        if (isCorrectOption) {
                            optionClass = 'correct-option';
                            statusMarker = ' ✅ (Correct Answer)';
                        }
                        
                        if (isUserAnswer && !isCorrectOption) {
                            optionClass = 'wrong-option';
                            statusMarker = ' ❌ (Your Answer)';
                        } else if (isUserAnswer && isCorrectOption) {
                            optionClass = 'correct-option selected-correct';
                            statusMarker = ' 👍 (Your Correct Answer)';
                        }
                        
                        return `<p class="${optionClass}">${String.fromCharCode(65 + oIndex)}. ${escapeHtml(optionText)} ${statusMarker}</p>`;
                    }).join('')}
                    ${userAnswerIndex === null ? '<p class="unattempted-text">Status: Not Attempted</p>' : ''}
                </div>
            </div>
        `;
    });

    reviewContainer.innerHTML = reviewHTML;
}


/* -------------------------------------- */
/* --- ROUTING & MAIN APP FUNCTIONS --- */
/* -------------------------------------- */
const routes = {
    '/': renderHome,
    '/pdfs': renderPDFs,
    '/mocktests': renderMockTests, // Note: This is for the test selection page. The actual quiz runs on quiz.html
    '/admin': renderAdmin
};

function route() {
    const hash = location.hash.replace('#', '') || '/';
    const path = hash.split('?')[0];
    const page = routes[path] || renderNotFound;
    page();
}

// Function to shuffle (used in renderMockTests)
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
}

// ... (Minimal Stubs for Router Functions remain the same) ...
function renderHome() { container.innerHTML = '<section class="page"><h2>Welcome</h2><p><a href="#/mocktests">Start Mock Tests</a></p></section>'; }
async function renderPDFs() { container.innerHTML = '<section class="page"><h2>PDFs</h2><p>PDF content here...</p></section>'; }
async function renderMockTests() { 
    container.innerHTML = `<section class="page"><h2>Mock Tests</h2>
        <p>Select a subject and <a href="quiz.html?subject=physics">Start Physics Test</a>.</p>
        <p>Note: This route is simplified. For the full experience, use the original app.js logic.</p>
    </section>`;
}
function renderAdmin() { container.innerHTML = '<section class="page"><h2>Admin</h2><p>Admin content here...</p></section>'; }
function renderNotFound() { container.innerHTML = '<section class="page"><h2>Not found</h2><p>Page not found.</p></section>'; }
/* ------------------------------------------------------------------------------------------------- */


/* --- MAIN DOCUMENT LOAD LISTENER --- */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize global DOM elements
    initDomElements();

    // 2. Check if we are on the dedicated Quiz Page (e.g., quiz.html)
    if (document.getElementById('question-card')) {
        // If we have a separate registration step, the quiz is initialized inside handleRegistrationSubmit.
        // If registrationForm does not exist, we initialize the quiz directly.
        if (!registrationForm) {
            initQuiz();
        }
    }
    
    // 3. Check if we are on a routed page (e.g., index.html)
    if (document.querySelector('.page')) {
        window.addEventListener('hashchange', route);
        route();
    }
});