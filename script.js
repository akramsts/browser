// ============================================
// STORAGE WRAPPER (with error handling)
// ============================================
const storage = {
    get: (key) => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.error('localStorage get error:', e);
            return null;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error('localStorage set error:', e);
        }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('localStorage remove error:', e);
        }
    }
};

// ============================================
// DOM ELEMENTS
// ============================================
const searchInput = document.getElementById("searchInput");
const micIcon = document.querySelector(".mic-icon");
const clearBtn = document.getElementById("clearBtn");
const historyDropdown = document.getElementById("historyDropdown");
const searchBox = document.querySelector(".search-box");
const searchContainer = document.querySelector(".search-container");

searchBox.addEventListener("click", function () {
    if (isVoiceActive && recognition) {
        isVoiceActive = false;
        clearTimeout(voiceTimeout);
        clearTimeout(messageTimeout);
        if (micIcon) micIcon.classList.remove("listening");
        try { recognition.stop(); } catch (e) { }
    }

    if (searchInput.placeholder !== DEFAULT_PLACEHOLDER) {
        searchInput.placeholder = DEFAULT_PLACEHOLDER;
        clearTimeout(messageTimeout);
    }
    searchInput.focus();
});

// ============================================
// CONSTANTS
// ============================================
const DEFAULT_PLACEHOLDER = "Search anything or type a URL";
const VOICE_MSG_TIMEOUT = 3000;

// ============================================
// STATE
// ============================================
let recognition = null;
let isVoiceActive = false;
let isRecognitionRunning = false;
let selectedHistoryIndex = -1;
let originalQuery = "";
let voiceTimeout = null;
let messageTimeout = null;
let cachedHistory = null;

// ============================================
// SEARCH HISTORY MANAGEMENT
// ============================================
function getSearchHistory() {
    const history = storage.get('searchHistory');
    if (!history) return [];
    try {
        const parsed = JSON.parse(history);

        if (!Array.isArray(parsed)) return [];

        if (parsed.length > 0 && typeof parsed[0] === 'string') {
            return [];
        }
        return parsed;
    } catch (e) {
        return [];
    }
}

function saveSearchHistory(query) {
    if (!query || query.trim().length === 0) return;

    let history = getSearchHistory();
    const timestamp = Date.now();
    const normalizedQuery = query.trim().toLowerCase();

    // Fix: Remove existing exact matches to prevent local storage duplication
    history = history.filter(item => item.query.toLowerCase() !== normalizedQuery);

    const newEntry = {
        id: timestamp,
        query: query.trim(),
        time: timestamp,
        engine: getSearchEngine()
    };

    history.unshift(newEntry);

    const MAX_HISTORY = 500;
    if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
    }

    storage.set('searchHistory', JSON.stringify(history));
    cachedHistory = history;
}

function deleteHistoryItem(id) {
    let history = getSearchHistory();
    history = history.filter(item => String(item.id) !== String(id));
    storage.set('searchHistory', JSON.stringify(history));

    cachedHistory = history;

    const text = searchInput.value.trim();
    if (history.length === 0) {
        hideHistoryDropdown();
        historyDropdown.innerHTML = "";
        return;
    }
    renderHistoryDropdown(text);
}

function renderHistoryDropdown(inputText = "") {
    const history = cachedHistory !== null ? cachedHistory : getSearchHistory();

    if (history.length === 0) {
        hideHistoryDropdown();
        return;
    }

    const uniqueHistory = [];
    const seenQueries = new Set();

    for (let item of history) {
        const lowerQuery = item.query.toLowerCase();
        if (!seenQueries.has(lowerQuery)) {
            seenQueries.add(lowerQuery);
            uniqueHistory.push(item);
        }
    }

    const text = inputText.trim().toLowerCase();
    let visibleList = [];

    if (text === "") {
        visibleList = uniqueHistory.slice(0, 5);
    } else {
        let exactMatches = [];
        let startsWithMatches = [];
        let includesMatches = [];

        uniqueHistory.forEach(item => {
            const lowerItem = item.query.toLowerCase();
            if (lowerItem === text) exactMatches.push(item);
            else if (lowerItem.startsWith(text)) startsWithMatches.push(item);
            else if (lowerItem.includes(text)) includesMatches.push(item);
        });

        let combined = [...exactMatches, ...startsWithMatches, ...includesMatches];
        visibleList = combined.slice(0, 5);
    }

    if (visibleList.length === 0) {
        hideHistoryDropdown();
        historyDropdown.innerHTML = "";
        return;
    }

    renderHistoryHTML(visibleList, text);
    historyDropdown.classList.add('show');
    searchContainer.classList.add('history-open');
}

function showHistoryDropdown() {
    const history = getSearchHistory();
    if (history.length === 0) return;
    renderHistoryDropdown(searchInput.value);
}

function hideHistoryDropdown() {
    historyDropdown.classList.remove('show');
    searchContainer.classList.remove('history-open');
}

function renderHistoryHTML(list, query = "") {
    let html = "";
    selectedHistoryIndex = -1;

    list.forEach(item => {
        const queryText = item.query;
        let displayHTML = escapeHTML(queryText);

        if (query) {
            const lowerItem = queryText.toLowerCase();
            const lowerQuery = query.toLowerCase();
            const index = lowerItem.indexOf(lowerQuery);

            if (index !== -1) {
                const before = escapeHTML(queryText.substring(0, index));
                const match = escapeHTML(queryText.substring(index, index + query.length));
                const after = escapeHTML(queryText.substring(index + query.length));
                displayHTML = `${before}<b>${match}</b>${after}`;
            }
        }

        html += `
            <div class="history-item" role="menuitem">
                <div class="history-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24"
                         fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                </div>

                <div class="history-text" data-query="${escapeHTML(queryText)}">
                    ${displayHTML}
                </div>

                <button class="history-delete"
                        data-id="${item.id}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
        `;
    });

    historyDropdown.innerHTML = html;
}

// ============================================
// SEARCH ENGINE MANAGEMENT
// ============================================
function getSearchEngine() {
    const engine = storage.get('searchEngine');
    const validEngines = ['google', 'duckduckgo', 'bing', 'brave', 'yahoo', 'startpage', 'ecosia'];
    return validEngines.includes(engine) ? engine : 'duckduckgo';
}

function buildSearchUrl(query) {
    const engine = getSearchEngine();
    const encoded = encodeURIComponent(query);

    switch (engine) {
        case 'duckduckgo': return "https://duckduckgo.com/?q=" + encoded;
        case 'bing': return "https://www.bing.com/search?q=" + encoded;
        case 'brave': return "https://search.brave.com/search?q=" + encoded;
        case 'yahoo': return "https://search.yahoo.com/search?p=" + encoded;
        case 'startpage': return "https://www.startpage.com/do/search?q=" + encoded;
        case 'ecosia': return "https://www.ecosia.org/search?q=" + encoded;
        default: return "https://www.google.com/search?q=" + encoded;
    }
}

// ============================================
// URL DETECTION
// ============================================
function escapeHTML(str) {
    if (!str) return "";
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function isLikelyUrl(text) {
    try {
        const input = text.trim();
        if (!input || /\s/.test(input)) return false;
        if (!input.includes(".") && !input.includes(":")) return false;

        const url = input.includes("://") ? input : "https://" + input;
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

function buildUrl(text) {
    let query = (text || "").trim();
    if (!query) return null;

    if (isLikelyUrl(query)) {
        if (!query.startsWith("http://") && !query.startsWith("https://")) {
            query = "https://" + query;
        }
        return query;
    }
    return buildSearchUrl(query);
}

// ============================================
// SEARCH EXECUTION
// ============================================
function executeSearch(query, openInNewTab = false) {
    query = (query || "").replace(/[\r\n]+/g, ' ').trim();
    if (!query) return;

    const url = buildUrl(query);
    if (!url) return;

    saveSearchHistory(query);

    if (openInNewTab) {
        window.open(url, "_blank");
    } else {
        window.location.href = url;
    }
}

// ============================================
// VOICE RECOGNITION SETUP
// ============================================
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = function () {
        isRecognitionRunning = true;

        // Fix: Start the 10-second timeout ONLY after mic permission is granted and recording starts
        clearTimeout(voiceTimeout);
        voiceTimeout = setTimeout(() => {
            if (isVoiceActive || isRecognitionRunning) {
                isVoiceActive = false;
                if (micIcon) micIcon.classList.remove("listening");
                searchInput.placeholder = "Didn't catch that";
                try { recognition.stop(); } catch (e) { }
                clearTimeout(messageTimeout);
                messageTimeout = setTimeout(() => {
                    if (searchInput.placeholder === "Didn't catch that" && searchInput.value.trim().length === 0) searchInput.placeholder = DEFAULT_PLACEHOLDER;
                }, VOICE_MSG_TIMEOUT);
            }
        }, 10000);
    };

    recognition.onresult = function (event) {
        clearTimeout(voiceTimeout);

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        const currentText = finalTranscript + interimTranscript;
        searchInput.value = currentText;
        searchInput.scrollLeft = searchInput.scrollWidth;

        if (currentText.trim().length > 0) clearBtn.classList.add('visible');
        else if (document.activeElement !== searchInput) clearBtn.classList.remove('visible');

        voiceTimeout = setTimeout(() => {
            if (isVoiceActive) {
                isVoiceActive = false;
                isRecognitionRunning = false;
                if (micIcon) micIcon.classList.remove("listening");
                try { recognition.stop(); } catch (e) { }

                const query = searchInput.value.trim();
                if (query.length > 0) {
                    searchInput.placeholder = DEFAULT_PLACEHOLDER;
                    executeSearch(query, false);
                } else {
                    searchInput.placeholder = "Didn't catch that";
                    clearTimeout(messageTimeout);
                    messageTimeout = setTimeout(() => {
                        if (searchInput.placeholder === "Didn't catch that" && searchInput.value.trim().length === 0) searchInput.placeholder = DEFAULT_PLACEHOLDER;
                    }, VOICE_MSG_TIMEOUT);
                }
            }
        }, 2000);
    };

    recognition.onend = function () {
        clearTimeout(voiceTimeout);
        isRecognitionRunning = false;

        if (isVoiceActive) {
            isVoiceActive = false;
            if (micIcon) micIcon.classList.remove("listening");

            const query = searchInput.value.trim();
            if (query.length > 0 && searchInput.placeholder !== "Didn't catch that") {
                searchInput.placeholder = DEFAULT_PLACEHOLDER;
                executeSearch(query, false);
                return;
            }
        }

        if (searchInput.placeholder === "Listening...") {
            searchInput.placeholder = "Didn't catch that";
            clearTimeout(messageTimeout);
            messageTimeout = setTimeout(() => {
                if (searchInput.placeholder === "Didn't catch that" && searchInput.value.trim().length === 0) {
                    searchInput.placeholder = DEFAULT_PLACEHOLDER;
                }
            }, VOICE_MSG_TIMEOUT);
        }

        if (searchInput.value.trim().length > 0) clearBtn.classList.add('visible');
        else if (document.activeElement !== searchInput) clearBtn.classList.remove('visible');
    };

    recognition.onerror = function (event) {
        clearTimeout(voiceTimeout);
        isVoiceActive = false;
        isRecognitionRunning = false;

        if (micIcon) micIcon.classList.remove("listening");
        searchInput.placeholder = "Voice access unavailable";

        clearTimeout(messageTimeout);
        messageTimeout = setTimeout(() => {
            if (searchInput.placeholder === "Voice access unavailable" && searchInput.value.trim().length === 0) {
                searchInput.placeholder = DEFAULT_PLACEHOLDER;
                if (document.activeElement !== searchInput) clearBtn.classList.remove('visible');
            }
        }, VOICE_MSG_TIMEOUT);
    };
}

function startVoice() {
    if (!recognition) {
        alert("Voice search is not supported in your browser.");
        return;
    }

    if (isVoiceActive || isRecognitionRunning) {
        isVoiceActive = false;
        clearTimeout(voiceTimeout);
        clearTimeout(messageTimeout);

        if (micIcon) micIcon.classList.remove("listening");
        if (searchInput.placeholder === "Listening...") searchInput.placeholder = DEFAULT_PLACEHOLDER;

        try { recognition.stop(); } catch (e) { }

        const query = searchInput.value.trim();
        if (query.length > 0) executeSearch(query, false);
        return;
    }

    isVoiceActive = true;
    if (micIcon) micIcon.classList.add("listening");

    searchInput.value = "";
    clearTimeout(messageTimeout);
    clearBtn.classList.remove("visible");
    searchInput.placeholder = "Listening...";
    hideHistoryDropdown();

    try { recognition.stop(); } catch (e) { }

    try {
        recognition.start();
    } catch (err) {
        isVoiceActive = false;
        if (micIcon) micIcon.classList.remove("listening");
        searchInput.placeholder = "Voice start failed";

        clearTimeout(messageTimeout);
        messageTimeout = setTimeout(() => {
            if (searchInput.placeholder === "Voice start failed" && searchInput.value.trim().length === 0) {
                searchInput.placeholder = DEFAULT_PLACEHOLDER;
            }
        }, VOICE_MSG_TIMEOUT);
    }
}

// ============================================
// CLEAR BUTTON LOGIC
// ============================================
function handleClear() {
    searchInput.value = "";
    originalQuery = "";
    selectedHistoryIndex = -1;
    searchInput.placeholder = DEFAULT_PLACEHOLDER;
    clearBtn.classList.remove('visible');

    if (isVoiceActive && recognition) {
        isVoiceActive = false;
        isRecognitionRunning = false;
        clearTimeout(voiceTimeout);
        clearTimeout(messageTimeout);

        if (micIcon) micIcon.classList.remove("listening");
        try { recognition.stop(); } catch (e) { }
    }

    searchInput.focus();
    renderHistoryDropdown("");
}

// ============================================
// EVENT LISTENERS
// ============================================

searchInput.addEventListener("focus", function () {
    if (searchBox) searchBox.classList.add("focused");
    if (searchInput.placeholder !== DEFAULT_PLACEHOLDER) {
        searchInput.placeholder = DEFAULT_PLACEHOLDER;
        clearTimeout(messageTimeout);
    }

    cachedHistory = getSearchHistory();

    originalQuery = searchInput.value;
    selectedHistoryIndex = -1;

    if (searchInput.value.trim().length > 0) clearBtn.classList.add("visible");
    showHistoryDropdown();
});

searchInput.addEventListener("blur", function () {
    if (searchBox) searchBox.classList.remove("focused");
    setTimeout(() => {
        if (document.activeElement === searchInput) return;
        if (isVoiceActive) return;

        if (searchInput.value.trim().length === 0) {
            clearBtn.classList.remove("visible");
        }
    }, 250);

    setTimeout(() => {
        if (historyDropdown.contains(document.activeElement)) return;
        hideHistoryDropdown();
    }, 300);
});

searchInput.addEventListener("input", function () {
    const text = this.value;
    originalQuery = text;
    selectedHistoryIndex = -1;

    const trimmedText = text.trim();
    if (trimmedText.length > 0) clearBtn.classList.add("visible");
    else clearBtn.classList.remove("visible");

    renderHistoryDropdown(trimmedText);

    if (isVoiceActive && recognition) {
        try { recognition.stop(); } catch (e) { }
        clearTimeout(voiceTimeout);
        clearTimeout(messageTimeout);
        micIcon.classList.remove("listening");
        isVoiceActive = false;
        isRecognitionRunning = false;
        searchInput.placeholder = DEFAULT_PLACEHOLDER;
    }
});

function updateHistorySelection(items) {
    let hasSelection = false;
    items.forEach((item, index) => {
        if (index === selectedHistoryIndex) {
            item.classList.add('selected');
            const query = item.querySelector('.history-text').getAttribute('data-query');
            if (query) searchInput.value = query;
            hasSelection = true;

            // Modern native scroll logic
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        } else {
            item.classList.remove('selected');
        }
    });

    if (!hasSelection && selectedHistoryIndex === -1) searchInput.value = originalQuery;
}

searchInput.addEventListener("keydown", function (e) {
    const isDropdownVisible = historyDropdown.classList.contains('show');
    const items = historyDropdown.querySelectorAll('.history-item');

    if (isDropdownVisible && items.length > 0) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedHistoryIndex++;
            if (selectedHistoryIndex >= items.length) selectedHistoryIndex = -1;
            updateHistorySelection(items);
            return;
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedHistoryIndex--;
            if (selectedHistoryIndex < -1) selectedHistoryIndex = items.length - 1;
            updateHistorySelection(items);
            return;
        }
    }

    if (e.key === "Enter" || e.keyCode === 13) {
        let query = searchInput.value.trim();
        if (!query) return;

        if (e.shiftKey) {
            executeSearch(query, true);
            return;
        }
        executeSearch(query, false);
    }
});

clearBtn.addEventListener("click", handleClear);

if (micIcon) {
    micIcon.addEventListener("click", function (e) {
        e.stopPropagation();
        startVoice();
    });

    micIcon.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            startVoice();
        }
    });
}

clearBtn.addEventListener("mousedown", function (e) { e.preventDefault(); });
clearBtn.addEventListener("touchstart", function (e) {
    e.preventDefault();
    handleClear();
});

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        const menu = document.getElementById("menu");
        if (menu && menu.classList.contains("show")) {
            menu.classList.remove("show");
            return;
        }
        handleClear();
        return;
    }

    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInput.focus();
        return;
    }

    if (mod && e.key && e.key.toLowerCase() === "l") {
        e.preventDefault();
        searchInput.focus();
        setTimeout(() => searchInput.select(), 0);
        return;
    }
});

if (historyDropdown) {
    historyDropdown.addEventListener("mousedown", function (e) { e.preventDefault(); });

    historyDropdown.addEventListener("mousemove", function () {
        if (selectedHistoryIndex !== -1) {
            const items = historyDropdown.querySelectorAll('.history-item');
            items.forEach(item => item.classList.remove('selected'));
            selectedHistoryIndex = -1;
            searchInput.value = originalQuery;
        }
    });

    historyDropdown.addEventListener('click', function (e) {
        const deleteBtn = e.target.closest('.history-delete');
        if (deleteBtn) {
            e.stopPropagation();
            const id = deleteBtn.getAttribute('data-id');
            if (id) deleteHistoryItem(id);
            return;
        }

        const historyItem = e.target.closest('.history-item');
        if (historyItem) {
            const query = historyItem.querySelector('.history-text').getAttribute('data-query');
            if (query) {
                searchInput.value = query;
                executeSearch(query, false);
            }
        }
    });
}

document.addEventListener("click", function (e) {
    if (!searchContainer.contains(e.target)) hideHistoryDropdown();

    if (isVoiceActive && recognition) {
        if (!micIcon.contains(e.target)) {
            isVoiceActive = false;
            clearTimeout(voiceTimeout);
            clearTimeout(messageTimeout);
            if (micIcon) micIcon.classList.remove("listening");
            if (searchInput.placeholder === "Listening...") searchInput.placeholder = DEFAULT_PLACEHOLDER;
            try { recognition.stop(); } catch (e) { }
        }
    }
});

// ============================================
// MENU FUNCTIONALITY
// ============================================
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");
const topMenu = menuBtn ? menuBtn.closest(".top-menu") : null;

if (topMenu && menuBtn && menu) {
    menuBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        menu.classList.toggle("show");
        hideHistoryDropdown();
    });

    menuBtn.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            menu.classList.toggle("show");
            hideHistoryDropdown();
        }
    });

    const menuItems = menu.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            menu.classList.remove('show');
        });
    });

    document.addEventListener("click", function (e) {
        if (!topMenu.contains(e.target)) menu.classList.remove("show");
    });
}

// ============================================
// CROSS-TAB SYNCHRONIZATION
// ============================================
window.addEventListener('storage', (e) => {
    // Agar kisi aur tab mein history modify hoti hai, toh cache update kar lo
    if (e.key === 'searchHistory') {
        cachedHistory = getSearchHistory();
    }
});

// ============================================
// PWA SERVICE WORKER REGISTRATION
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./browser-sw.js')
            .then(reg => console.log('Browser PWA Service Worker Registered!'))
            .catch(err => console.log('Service Worker Registration Failed:', err));
    });
}