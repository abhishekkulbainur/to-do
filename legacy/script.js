// Bible Data
const OT_BOOKS = [
    { name: "Genesis", ch: 50 }, { name: "Exodus", ch: 40 }, { name: "Leviticus", ch: 27 },
    { name: "Numbers", ch: 36 }, { name: "Deuteronomy", ch: 34 }, { name: "Joshua", ch: 24 },
    { name: "Judges", ch: 21 }, { name: "Ruth", ch: 4 }, { name: "1 Samuel", ch: 31 },
    { name: "2 Samuel", ch: 24 }, { name: "1 Kings", ch: 22 }, { name: "2 Kings", ch: 25 },
    { name: "1 Chronicles", ch: 29 }, { name: "2 Chronicles", ch: 36 }, { name: "Ezra", ch: 10 },
    { name: "Nehemiah", ch: 13 }, { name: "Esther", ch: 10 }, { name: "Job", ch: 42 },
    { name: "Ecclesiastes", ch: 12 }, { name: "Song of Solomon", ch: 8 }, { name: "Isaiah", ch: 66 },
    { name: "Jeremiah", ch: 52 }, { name: "Lamentations", ch: 5 }, { name: "Ezekiel", ch: 48 },
    { name: "Daniel", ch: 12 }, { name: "Hosea", ch: 14 }, { name: "Joel", ch: 3 },
    { name: "Amos", ch: 9 }, { name: "Obadiah", ch: 1 }, { name: "Jonah", ch: 4 },
    { name: "Micah", ch: 7 }, { name: "Nahum", ch: 3 }, { name: "Habakkuk", ch: 3 },
    { name: "Zephaniah", ch: 3 }, { name: "Haggai", ch: 2 }, { name: "Zechariah", ch: 14 },
    { name: "Malachi", ch: 4 }
];
const PP_BOOKS = [
    { name: "Psalms", ch: 150 }, { name: "Proverbs", ch: 31 }
];
const NT_BOOKS = [
    { name: "Matthew", ch: 28 }, { name: "Mark", ch: 16 }, { name: "Luke", ch: 24 },
    { name: "John", ch: 21 }, { name: "Acts", ch: 28 }, { name: "Romans", ch: 16 },
    { name: "1 Corinthians", ch: 16 }, { name: "2 Corinthians", ch: 13 }, { name: "Galatians", ch: 6 },
    { name: "Ephesians", ch: 6 }, { name: "Philippians", ch: 4 }, { name: "Colossians", ch: 4 },
    { name: "1 Thessalonians", ch: 5 }, { name: "2 Thessalonians", ch: 3 }, { name: "1 Timothy", ch: 6 },
    { name: "2 Timothy", ch: 4 }, { name: "Titus", ch: 3 }, { name: "Philemon", ch: 1 },
    { name: "Hebrews", ch: 13 }, { name: "James", ch: 5 }, { name: "1 Peter", ch: 5 },
    { name: "2 Peter", ch: 3 }, { name: "1 John", ch: 5 }, { name: "2 John", ch: 1 },
    { name: "3 John", ch: 1 }, { name: "Jude", ch: 1 }, { name: "Revelation", ch: 22 }
];

// Configuration
const START_DATE = new Date("2026-03-23");
const END_DATE = new Date("2026-12-31");
const TOTAL_DAYS = 284; // Pre-calculated

// Flatten chapters for easy distribution
function flatten(books) {
    const list = [];
    books.forEach(b => {
        for (let i = 1; i <= b.ch; i++) {
            list.push(`${b.name} ${i}`);
        }
    });
    return list;
}

const otFlat = flatten(OT_BOOKS);
const ntFlat = flatten(NT_BOOKS);
const ppFlat = flatten(PP_BOOKS);

// State
let currentDate = new Date(START_DATE);

// Initialize DOM elements
const displayDate = document.getElementById('display-date');
const bibleTasks = document.getElementById('bible-tasks');
const prayerCheck = document.getElementById('prayer-checkbox');
const declarationCheck = document.getElementById('declaration-checkbox');
const customTasksList = document.getElementById('custom-tasks');
const studyTasksList = document.getElementById('study-tasks');
const datePicker = document.getElementById('date-picker');

// Format date to string key
function dateToKey(date) {
    return date.toISOString().split('T')[0];
}

// Generate schedule for a specific day index (0-283)
function getScheduleForDay(dayIndex) {
    if (dayIndex < 0 || dayIndex >= TOTAL_DAYS) return [];

    const getSegment = (arr, index, total) => {
        const start = Math.floor(index * arr.length / total);
        const end = Math.floor((index + 1) * arr.length / total);
        return arr.slice(start, end);
    };

    const ot = getSegment(otFlat, dayIndex, TOTAL_DAYS);
    const nt = getSegment(ntFlat, dayIndex, TOTAL_DAYS);
    const pp = getSegment(ppFlat, dayIndex, TOTAL_DAYS);

    return [...ot, ...nt, ...pp];
}

// Load and Render
function loadPage() {
    const key = dateToKey(currentDate);
    displayDate.innerText = currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    datePicker.value = key;

    // Load from localStorage
    const savedData = JSON.parse(localStorage.getItem(key)) || {
        bible: {},
        spiritual: { prayer: false, declaration: false, custom: [] },
        studies: []
    };

    renderBibleReading(savedData, dayIndexFromDate(currentDate));
    renderSpiritual(savedData);
    renderStudies(savedData);
}

function dayIndexFromDate(date) {
    const diffTime = Math.abs(date - START_DATE);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function renderBibleReading(data, dayIndex) {
    const chapters = getScheduleForDay(dayIndex);
    bibleTasks.innerHTML = '';
    chapters.forEach(ch => {
        const item = createTaskItem(ch, data.bible[ch], (checked) => {
            data.bible[ch] = checked;
            save(data);
        });
        bibleTasks.appendChild(item);
    });
}

function renderSpiritual(data) {
    prayerCheck.checked = data.spiritual.prayer;
    declarationCheck.checked = data.spiritual.declaration;

    prayerCheck.onchange = (e) => { data.spiritual.prayer = e.target.checked; save(data); };
    declarationCheck.onchange = (e) => { data.spiritual.declaration = e.target.checked; save(data); };

    customTasksList.innerHTML = '';
    data.spiritual.custom.forEach((task, index) => {
        const item = createTaskWithDelete(task.text, task.checked, (checked) => {
            task.checked = checked;
            save(data);
        }, () => {
            data.spiritual.custom.splice(index, 1);
            save(data);
            renderSpiritual(data);
        });
        customTasksList.appendChild(item);
    });
}

function renderStudies(data) {
    studyTasksList.innerHTML = '';
    data.studies.forEach((task, index) => {
        const item = createTaskWithDelete(task.text, task.checked, (checked) => {
            task.checked = checked;
            save(data);
        }, () => {
            data.studies.splice(index, 1);
            save(data);
            renderStudies(data);
        });
        studyTasksList.appendChild(item);
    });
}

function createTaskItem(text, checked, onChange) {
    const label = document.createElement('label');
    label.className = 'task-item';
    label.innerHTML = `
        <input type="checkbox" ${checked ? 'checked' : ''}>
        <span class="checkmark"></span>
        <span class="task-text">${text}</span>
    `;
    label.querySelector('input').onchange = (e) => {
        onChange(e.target.checked);
    };
    return label;
}

function createTaskWithDelete(text, checked, onChange, onDelete) {
    const label = document.createElement('label');
    label.className = 'task-item';
    label.innerHTML = `
        <input type="checkbox" ${checked ? 'checked' : ''}>
        <span class="checkmark"></span>
        <span class="task-text">${text}</span>
        <button class="btn-delete">×</button>
    `;
    label.querySelector('input').onchange = (e) => {
        onChange(e.target.checked);
    };
    label.querySelector('.btn-delete').onclick = (e) => {
        e.preventDefault();
        onDelete();
    };
    return label;
}

function save(data) {
    const key = dateToKey(currentDate);
    localStorage.setItem(key, JSON.stringify(data));
}

// Navigation
document.getElementById('prev-day').onclick = () => {
    let prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    if (prev >= START_DATE) {
        currentDate = prev;
        loadPage();
    }
};

document.getElementById('next-day').onclick = () => {
    let next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    if (next <= END_DATE) {
        currentDate = next;
        loadPage();
    }
};

document.getElementById('today-btn').onclick = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    if (today >= START_DATE && today <= END_DATE) {
        currentDate = today;
    } else if (today < START_DATE) {
        currentDate = new Date(START_DATE);
    } else {
        currentDate = new Date(END_DATE);
    }
    loadPage();
};

datePicker.onchange = (e) => {
    const newDate = new Date(e.target.value);
    newDate.setHours(0,0,0,0);
    if (newDate >= START_DATE && newDate <= END_DATE) {
        currentDate = newDate;
        loadPage();
    }
};

// Add Task Logic
function handleAddCustomTask() {
    const input = document.getElementById('custom-task-input');
    if (!input.value.trim()) return;
    const key = dateToKey(currentDate);
    const data = JSON.parse(localStorage.getItem(key)) || {
        bible: {}, spiritual: { prayer: false, declaration: false, custom: [] }, studies: []
    };
    data.spiritual.custom.push({ text: input.value, checked: false });
    save(data);
    input.value = '';
    renderSpiritual(data);
}

function handleAddStudyTask() {
    const input = document.getElementById('study-task-input');
    if (!input.value.trim()) return;
    const key = dateToKey(currentDate);
    const data = JSON.parse(localStorage.getItem(key)) || {
        bible: {}, spiritual: { prayer: false, declaration: false, custom: [] }, studies: []
    };
    data.studies.push({ text: input.value, checked: false });
    save(data);
    input.value = '';
    renderStudies(data);
}

document.getElementById('add-custom-task').onclick = handleAddCustomTask;
document.getElementById('custom-task-input').onkeypress = (e) => {
    if (e.key === 'Enter') handleAddCustomTask();
};

document.getElementById('add-study-task').onclick = handleAddStudyTask;
document.getElementById('study-task-input').onkeypress = (e) => {
    if (e.key === 'Enter') handleAddStudyTask();
};

// Initial Load
loadPage();
