// ===================================
// Configuration
// ===================================

const CONFIG = {
    // API Configuration - REAL CREDENTIALS
    API_BASE_URL: 'https://app.japan-ai.co.jp/api/v1',
    AGENT_ID: '4f71d829-1a5a-47c9-aeb5-6a317a690fe5',
    API_KEY: '154bdc69-027d-43bf-8404-5bed36a8e1aa',
    PROJECT_ID: 'b2b64bed-50d6-475f-8a4e-aedd51b4c55d',
    MODEL: 'claude-3-5-sonnet',
    
    // File Settings
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_TYPES: ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg', 'audio/x-m4a'],
    
    // Processing Settings
    POLL_INTERVAL: 3000,
    MAX_POLL_ATTEMPTS: 100,
    
    // Storage Keys
    HISTORY_KEY: 'conference_transcription_history',
    THEME_KEY: 'conference_ai_theme'
};

// ===================================
// State Management
// ===================================

const state = {
    currentFile: null,
    isProcessing: false,
    results: null,
    history: [],
    currentPage: 'home',
    theme: 'dark',
    currentRunId: null
};

// ===================================
// DOM Elements
// ===================================

const elements = {
    // Theme
    themeToggle: document.getElementById('themeToggle'),
    body: document.body,
    
    // Pages
    pages: {
        home: document.getElementById('homePage'),
        history: document.getElementById('historyPage'),
        about: document.getElementById('aboutPage')
    },
    
    // Navigation
    navLinks: document.querySelectorAll('.nav-link'),
    
    // Upload
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    browseBtn: document.getElementById('browseBtn'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    removeFileBtn: document.getElementById('removeFileBtn'),
    processBtn: document.getElementById('processBtn'),
    
    // Sections
    uploadSection: document.querySelector('.upload-section'),
    processingSection: document.getElementById('processingSection'),
    resultsSection: document.getElementById('resultsSection'),
    
    // Processing
    processingStatus: document.getElementById('processingStatus'),
    progressFill: document.getElementById('progressFill'),
    progressPercent: document.getElementById('progressPercent'),
    step1: document.getElementById('step1'),
    step2: document.getElementById('step2'),
    step3: document.getElementById('step3'),
    step4: document.getElementById('step4'),
    
    // Results
    transcriptionContent: document.getElementById('transcriptionContent'),
    translationContent: document.getElementById('translationContent'),
    summaryContent: document.getElementById('summaryContent'),
    keypointsContent: document.getElementById('keypointsContent'),
    downloadBtn: document.getElementById('downloadBtn'),
    newFileBtn: document.getElementById('newFileBtn'),
    
    // History
    historyGrid: document.getElementById('historyGrid'),
    emptyState: document.getElementById('emptyState'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    goToHomeBtn: document.getElementById('goToHomeBtn'),
    
    // Modal
    historyModal: document.getElementById('historyModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    
    // Toast
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

// ===================================
// Initialization
// ===================================

function init() {
    initTheme();
    initEventListeners();
    loadHistory();
    console.log('🚀 ConferenceAI initialized');
    console.log('📡 Connected to Japan AI Studio Agent:', CONFIG.AGENT_ID);
}

// ===================================
// Theme Management
// ===================================

function initTheme() {
    const savedTheme = localStorage.getItem(CONFIG.THEME_KEY) || 'dark';
    state.theme = savedTheme;
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    elements.body.classList.remove('dark-theme', 'light-theme');
    elements.body.classList.add(`${theme}-theme`);
    state.theme = theme;
    localStorage.setItem(CONFIG.THEME_KEY, theme);
}

function toggleTheme() {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    showToast(`Switched to ${newTheme} mode`);
}

// ===================================
// Event Listeners
// ===================================

function initEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Navigation
    elements.navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // File upload
    elements.browseBtn.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.removeFileBtn.addEventListener('click', removeFile);
    elements.processBtn.addEventListener('click', processAudio);
    
    // Drag and drop
    elements.uploadArea.addEventListener('dragover', handleDragOver);
    elements.uploadArea.addEventListener('dragleave', handleDragLeave);
    elements.uploadArea.addEventListener('drop', handleDrop);
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    
    // Results actions
    elements.downloadBtn.addEventListener('click', downloadResults);
    elements.newFileBtn.addEventListener('click', resetToUpload);
    
    // Copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', handleCopy);
    });
    
    // History
    elements.clearHistoryBtn.addEventListener('click', clearHistory);
    elements.goToHomeBtn.addEventListener('click', () => navigateToPage('home'));
    
    // Modal
    elements.closeModalBtn.addEventListener('click', closeModal);
    elements.historyModal.querySelector('.modal-overlay').addEventListener('click', closeModal);
}

// ===================================
// Navigation
// ===================================

function handleNavigation(event) {
    event.preventDefault();
    const page = event.currentTarget.dataset.page;
    navigateToPage(page);
}

function navigateToPage(page) {
    elements.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
    
    Object.keys(elements.pages).forEach(key => {
        elements.pages[key].classList.remove('active');
    });
    elements.pages[page].classList.add('active');
    
    state.currentPage = page;
    
    if (page === 'history') {
        renderHistory();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===================================
// File Handling
// ===================================

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        validateAndSetFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    elements.uploadArea.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.preventDefault();
    elements.uploadArea.classList.remove('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    elements.uploadArea.classList.remove('drag-over');
    
    const file = event.dataTransfer.files[0];
    if (file) {
        validateAndSetFile(file);
    }
}

function validateAndSetFile(file) {
    if (!CONFIG.ALLOWED_TYPES.includes(file.type)) {
        showToast('Please upload an audio file (MP3, WAV, or M4A)', 'error');
        return;
    }
    
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        showToast('File size must be less than 50MB', 'error');
        return;
    }
    
    state.currentFile = file;
    displayFileInfo(file);
}

function displayFileInfo(file) {
    elements.fileName.textContent = file.name;
    elements.fileSize.textContent = formatFileSize(file.size);
    elements.fileInfo.style.display = 'block';
    elements.uploadArea.style.display = 'none';
}

function removeFile() {
    state.currentFile = null;
    elements.fileInput.value = '';
    elements.fileInfo.style.display = 'none';
    elements.uploadArea.style.display = 'block';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ===================================
// Audio Processing - REAL API CALLS
// ===================================

async function processAudio() {
    if (!state.currentFile) {
        showToast('Please select a file first', 'error');
        return;
    }
    
    if (state.isProcessing) {
        return;
    }
    
    state.isProcessing = true;
    showProcessingSection();
    
    try {
        // Step 1: Convert to base64
        updateProcessingStatus('Preparing audio file...', 10, 1);
        const base64Audio = await fileToBase64(state.currentFile);
        
        // Step 2: Call Japan AI Studio Agent
        updateProcessingStatus('Sending to AI agent...', 30, 2);
        await sleep(500);
        
        const runId = await startAgentRun(base64Audio, state.currentFile.name);
        state.currentRunId = runId;
        
        // Step 3: Poll for results
        updateProcessingStatus('Transcribing Japanese audio...', 50, 2);
        const results = await pollForResults(runId);
        
        // Step 4: Process results
        updateProcessingStatus('Generating summary and key points...', 90, 4);
        await sleep(500);
        
        // Finalize
        updateProcessingStatus('Complete!', 100, 4);
        await sleep(500);
        
        // Save to history
        saveToHistory(state.currentFile.name, results);
        
        // Display results
        displayResults(results);
        showResultsSection();
        
        showToast('Conference transcription complete!');
        
    } catch (error) {
        console.error('Processing error:', error);
        showToast('Error: ' + error.message, 'error');
        resetToUpload();
    } finally {
        state.isProcessing = false;
        state.currentRunId = null;
    }
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Start agent run
async function startAgentRun(base64Audio, fileName) {
    const response = await fetch(`${CONFIG.API_BASE_URL}/agents/${CONFIG.AGENT_ID}/runs`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CONFIG.API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            input: {
                audio_file: base64Audio,
                file_name: fileName,
                source_language: 'Japanese',
                target_language: 'English'
            }
        })
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Agent start failed: ${error}`);
    }
    
    const data = await response.json();
    return data.run_id || data.id;
}

// Poll for results
async function pollForResults(runId) {
    for (let i = 0; i < CONFIG.MAX_POLL_ATTEMPTS; i++) {
        await sleep(CONFIG.POLL_INTERVAL);
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/agents/${CONFIG.AGENT_ID}/runs/${runId}`, {
            headers: {
                'Authorization': `Bearer ${CONFIG.API_KEY}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to check status');
        }
        
        const status = await response.json();
        
        // Update progress based on status
        if (status.state === 'running' || status.state === 'processing') {
            const progress = Math.min(50 + (i * 2), 85);
            updateProcessingStatus('Processing audio...', progress, 3);
        }
        
        if (status.state === 'completed' || status.status === 'completed') {
            return parseResults(status.output || status.result);
        }
        
        if (status.state === 'failed' || status.status === 'failed') {
            throw new Error(status.error || 'Agent processing failed');
        }
    }
    
    throw new Error('Processing timeout - please try again');
}

// Parse results from agent output
function parseResults(output) {
    // Handle different output formats
    if (typeof output === 'string') {
        try {
            output = JSON.parse(output);
        } catch (e) {
            // If it's plain text, create structured output
            return {
                transcription: output,
                translation: output,
                summary: 'Audio processed successfully.',
                keypoints: ['Audio transcription completed']
            };
        }
    }
    
    return {
        transcription: output.transcription || output.japanese_text || 'Transcription completed',
        translation: output.translation || output.english_text || output.transcription || 'Translation completed',
        summary: output.summary || output.summary_text || 'Summary generated from audio content.',
        keypoints: output.keypoints || output.key_points || ['Key point 1', 'Key point 2', 'Key point 3']
    };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===================================
// UI Updates
// ===================================

function showProcessingSection() {
    elements.uploadSection.style.display = 'none';
    elements.resultsSection.style.display = 'none';
    elements.processingSection.style.display = 'block';
    
    [elements.step1, elements.step2, elements.step3, elements.step4].forEach(step => {
        step.classList.remove('active', 'completed');
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showResultsSection() {
    elements.uploadSection.style.display = 'none';
    elements.processingSection.style.display = 'none';
    elements.resultsSection.style.display = 'block';
    
    setTimeout(() => {
        elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function resetToUpload() {
    elements.uploadSection.style.display = 'block';
    elements.processingSection.style.display = 'none';
    elements.resultsSection.style.display = 'none';
    removeFile();
    state.results = null;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProcessingStatus(message, progress, step) {
    elements.processingStatus.textContent = message;
    elements.progressFill.style.width = progress + '%';
    elements.progressPercent.textContent = progress + '%';
    
    const steps = [elements.step1, elements.step2, elements.step3, elements.step4];
    
    steps.forEach((stepEl, index) => {
        if (index < step - 1) {
            stepEl.classList.remove('active');
            stepEl.classList.add('completed');
        } else if (index === step - 1) {
            stepEl.classList.add('active');
            stepEl.classList.remove('completed');
        } else {
            stepEl.classList.remove('active', 'completed');
        }
    });
}

function displayResults(results) {
    state.results = results;
    
    elements.transcriptionContent.innerHTML = `<p class="result-text">${escapeHtml(results.transcription)}</p>`;
    elements.translationContent.innerHTML = `<p class="result-text">${escapeHtml(results.translation)}</p>`;
    elements.summaryContent.innerHTML = `<p class="result-text">${escapeHtml(results.summary)}</p>`;
    
    if (results.keypoints && results.keypoints.length > 0) {
        const keypointsHtml = results.keypoints
            .map(point => `<li>${escapeHtml(point)}</li>`)
            .join('');
        elements.keypointsContent.innerHTML = `<ul class="keypoints-list">${keypointsHtml}</ul>`;
    }
}

// ===================================
// History Management
// ===================================

function loadHistory() {
    try {
        const stored = localStorage.getItem(CONFIG.HISTORY_KEY);
        state.history = stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading history:', error);
        state.history = [];
    }
}

function saveHistory() {
    try {
        localStorage.setItem(CONFIG.HISTORY_KEY, JSON.stringify(state.history));
    } catch (error) {
        console.error('Error saving history:', error);
    }
}

function saveToHistory(fileName, results) {
    const historyItem = {
        id: Date.now(),
        fileName: fileName,
        date: new Date().toISOString(),
        results: results
    };
    
    state.history.unshift(historyItem);
    
    if (state.history.length > 50) {
        state.history = state.history.slice(0, 50);
    }
    
    saveHistory();
}

function renderHistory() {
    if (state.history.length === 0) {
        elements.historyGrid.style.display = 'none';
        elements.emptyState.style.display = 'block';
        return;
    }
    
    elements.historyGrid.style.display = 'grid';
    elements.emptyState.style.display = 'none';
    
    elements.historyGrid.innerHTML = state.history.map(item => {
        const date = new Date(item.date);
        const formattedDate = formatDate(date);
        const preview = item.results.summary.substring(0, 150) + '...';
        
        return `
            <div class="history-item glass-card" data-id="${item.id}">
                <div class="card-glow"></div>
                <div class="history-header">
                    <div class="history-file-info">
                        <p class="history-file-name">${escapeHtml(item.fileName)}</p>
                        <p class="history-date">${formattedDate}</p>
                    </div>
                    <div class="history-actions">
                        <button class="btn-icon-modern view-history-btn" data-id="${item.id}" title="View details">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                            </svg>
                        </button>
                        <button class="btn-icon-modern delete-history-btn" data-id="${item.id}" title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <p class="history-preview">${escapeHtml(preview)}</p>
                <div class="history-tags">
                    <span class="history-tag">🇯🇵 Japanese</span>
                    <span class="history-tag">🇬🇧 English</span>
                    <span class="history-tag">📝 Summary</span>
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.view-history-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            viewHistoryItem(parseInt(btn.dataset.id));
        });
    });
    
    document.querySelectorAll('.delete-history-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteHistoryItem(parseInt(btn.dataset.id));
        });
    });
    
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            viewHistoryItem(parseInt(item.dataset.id));
        });
    });
}

function viewHistoryItem(id) {
    const item = state.history.find(h => h.id === id);
    if (!item) return;
    
    const date = new Date(item.date);
    const formattedDate = formatDate(date);
    
    elements.modalTitle.textContent = item.fileName;
    elements.modalBody.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
            <p style="color: var(--text-tertiary); font-size: 0.875rem;">${formattedDate}</p>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                <span style="font-size: 1.5rem;">🇯🇵</span>
                <h4 style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">Transcription (Japanese)</h4>
            </div>
            <p style="color: var(--text-secondary); line-height: 1.8; white-space: pre-wrap;">${escapeHtml(item.results.transcription)}</p>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                <span style="font-size: 1.5rem;">🇬🇧</span>
                <h4 style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">Translation (English)</h4>
            </div>
            <p style="color: var(--text-secondary); line-height: 1.8; white-space: pre-wrap;">${escapeHtml(item.results.translation)}</p>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                <span style="font-size: 1.5rem;">📝</span>
                <h4 style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">Summary</h4>
            </div>
            <p style="color: var(--text-secondary); line-height: 1.8;">${escapeHtml(item.results.summary)}</p>
        </div>
        
        <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                <span style="font-size: 1.5rem;">🔑</span>
                <h4 style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">Key Points</h4>
            </div>
            <ul style="list-style: none; padding: 0;">
                ${item.results.keypoints.map(point => `
                    <li style="padding: 0.5rem 0; padding-left: 1.5rem; position: relative; color: var(--text-secondary);">
                        <span style="position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 8px; height: 8px; background: linear-gradient(135deg, var(--primary-start), var(--accent-pink)); border-radius: 50%;"></span>
                        ${escapeHtml(point)}
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
    
    openModal();
}

function deleteHistoryItem(id) {
    if (!confirm('Are you sure you want to delete this conference recording?')) {
        return;
    }
    
    state.history = state.history.filter(h => h.id !== id);
    saveHistory();
    renderHistory();
    showToast('Recording deleted');
}

function clearHistory() {
    if (!confirm('Are you sure you want to clear all conference history? This cannot be undone.')) {
        return;
    }
    
    state.history = [];
    saveHistory();
    renderHistory();
    showToast('History cleared');
}

function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ===================================
// Modal
// ===================================

function openModal() {
    elements.historyModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    elements.historyModal.classList.remove('active');
    document.body.style.overflow = '';
}

// ===================================
// Actions
// ===================================

function handleCopy(event) {
    const target = event.currentTarget.dataset.target;
    let text = '';
    
    switch(target) {
        case 'transcription':
            text = state.results.transcription;
            break;
        case 'translation':
            text = state.results.translation;
            break;
        case 'summary':
            text = state.results.summary;
            break;
        case 'keypoints':
            text = state.results.keypoints.join('\n');
            break;
    }
    
    copyToClipboard(text);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!');
    }).catch(err => {
        console.error('Copy failed:', err);
        showToast('Failed to copy', 'error');
    });
}

function downloadResults() {
    if (!state.results) return;
    
    const content = `
CONFERENCE TRANSCRIPTION RESULTS
Generated: ${new Date().toLocaleString()}
File: ${state.currentFile.name}

========================================
TRANSCRIPTION (JAPANESE)
========================================

${state.results.transcription}

========================================
TRANSLATION (ENGLISH)
========================================

${state.results.translation}

========================================
SUMMARY
========================================

${state.results.summary}

========================================
KEY POINTS
========================================

${state.results.keypoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

========================================
Powered by ConferenceAI
Breaking Language Barriers in International Conferences
========================================
    `.trim();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conference_transcription_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Results downloaded!');
}

// ===================================
// Toast Notifications
// ===================================

function showToast(message, type = 'success') {
    elements.toastMessage.textContent = message;
    elements.toast.classList.add('show');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// ===================================
// Utilities
// ===================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================================
// Initialize on DOM Load
// ===================================

document.addEventListener('DOMContentLoaded', init);
