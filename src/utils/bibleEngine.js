// Bible Data & Constants
export const START_ISO = "2026-03-26";
export const END_ISO = "2026-12-31";

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

const TOTAL_DAYS = 281;

function flatten(books) {
    const list = [];
    books.forEach(b => {
        for (let i = 1; i <= b.ch; i++) {
            list.push(`${b.name} ${i}`);
        }
    });
    return list;
}

const tracks = {
    ot: flatten(OT_BOOKS),
    nt: flatten(NT_BOOKS),
    pp: flatten(PP_BOOKS)
};

import { BIBLE_PLAN } from './readingData';

/**
 * Gets the schedule for a given day index (0-indexed from START_ISO)
 * Checks the custom BIBLE_PLAN first, then falls back to sequential distribution.
 */
export const getScheduleForDay = (dayIndex) => {
    if (dayIndex < 0 || dayIndex >= TOTAL_DAYS) return [];

    const date = new Date(START_ISO);
    date.setDate(date.getDate() + dayIndex);
    const key = dateToKey(date);

    if (BIBLE_PLAN[key]) {
        return BIBLE_PLAN[key];
    }

    // Fallback logic
    const getSegment = (arr, index) => {
        const start = Math.floor(index * arr.length / TOTAL_DAYS);
        const end = Math.floor((index + 1) * arr.length / TOTAL_DAYS);
        return arr.slice(start, end);
    };

    return [
        ...getSegment(tracks.ot, dayIndex),
        ...getSegment(tracks.nt, dayIndex),
        ...getSegment(tracks.pp, dayIndex)
    ];
};

export const getDayIndex = (date) => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    const start = new Date(START_ISO);
    start.setHours(0,0,0,0);
    const diff = d - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const findDateForBook = (bookName) => {
    for (let i = 0; i < TOTAL_DAYS; i++) {
        const schedule = getScheduleForDay(i);
        if (schedule.some(s => s.startsWith(bookName))) {
            const date = new Date(START_ISO);
            date.setDate(date.getDate() + i);
            return date;
        }
    }
    return null;
};

export const getAllBooks = () => {
    return [...OT_BOOKS, ...NT_BOOKS, ...PP_BOOKS].map(b => b.name);
};

export const calculateStreak = () => {
    let streak = 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Iterate backwards from yesterday
    for (let i = 1; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (d < new Date(START_ISO)) break;
        
        const key = dateToKey(d);
        const saved = localStorage.getItem(key);
        if (!saved) break;
        
        const data = JSON.parse(saved);
        const dayIdx = getDayIndex(d);
        const chapters = getScheduleForDay(dayIdx);
        
        const allChecked = chapters.length > 0 && chapters.every(ch => data.bible?.[ch]);
        if (allChecked) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
};

export const dateToKey = (date) => {
    return date.toISOString().split('T')[0];
};
