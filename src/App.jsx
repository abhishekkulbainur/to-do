import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  CheckCircle2, Circle, Plus, Trash2, BookOpen, 
  Sparkles, GraduationCap, Search, X
} from 'lucide-react';
import { getScheduleForDay, getDayIndex, dateToKey, START_ISO, END_ISO, findDateForBook, getAllBooks } from './utils/bibleEngine';
import './App.css';

const App = () => {
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const start = new Date(START_ISO);
    const end = new Date(END_ISO);
    if (today < start) return start;
    if (today > end) return end;
    return today;
  });

  const [data, setData] = useState({
    bible: {},
    spiritual: { prayer: false, declaration: false, custom: [] },
    studies: []
  });

  const [spiritualInput, setSpiritualInput] = useState('');
  const [studyInput, setStudyInput] = useState('');

  const dayIndex = useMemo(() => getDayIndex(currentDate), [currentDate]);
  const chapters = useMemo(() => getScheduleForDay(dayIndex), [dayIndex]);
  const dateKey = useMemo(() => dateToKey(currentDate), [currentDate]);

  // Load persistence
  useEffect(() => {
    const saved = localStorage.getItem(dateKey);
    if (saved) {
      setData(JSON.parse(saved));
    } else {
      setData({
        bible: {},
        spiritual: { prayer: false, declaration: false, custom: [] },
        studies: []
      });
    }
  }, [dateKey]);

  // Save persistence
  const updateData = (newData) => {
    setData(newData);
    localStorage.setItem(dateKey, JSON.stringify(newData));
  };

  const toggleBible = (chapter) => {
    const newData = { ...data, bible: { ...data.bible, [chapter]: !data.bible[chapter] } };
    updateData(newData);
  };

  const toggleSpiritual = (field) => {
    const newData = { ...data, spiritual: { ...data.spiritual, [field]: !data.spiritual[field] } };
    updateData(newData);
  };

  const addCustomTask = (type) => {
    const text = type === 'spiritual' ? spiritualInput : studyInput;
    if (!text.trim()) return;
    
    const newTask = { text: text.trim(), checked: false };
    const newData = { ...data };
    if (type === 'spiritual') {
      newData.spiritual.custom = [...newData.spiritual.custom, newTask];
      setSpiritualInput('');
    } else {
      newData.studies = [...newData.studies, newTask];
      setStudyInput('');
    }
    updateData(newData);
  };

  const removeTask = (type, index) => {
    const newData = { ...data };
    if (type === 'spiritual') {
      newData.spiritual.custom = newData.spiritual.custom.filter((_, i) => i !== index);
    } else {
      newData.studies = newData.studies.filter((_, i) => i !== index);
    }
    updateData(newData);
  };

  const toggleTask = (type, index) => {
    const newData = { ...data };
    if (type === 'spiritual') {
      newData.spiritual.custom = newData.spiritual.custom.map((t, i) => i === index ? { ...t, checked: !t.checked } : t);
    } else {
      newData.studies = newData.studies.map((t, i) => i === index ? { ...t, checked: !t.checked } : t);
    }
    updateData(newData);
  };

  const changeDate = (offset) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + offset);
    const start = new Date(START_ISO);
    const end = new Date(END_ISO);
    if (next >= start && next <= end) {
      setCurrentDate(next);
    }
  };

  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const allBooks = useMemo(() => getAllBooks(), []);
  const filteredBooks = allBooks.filter(b => b.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleJump = (book) => {
    const date = findDateForBook(book);
    if (date) {
      setCurrentDate(date);
      setShowSearch(false);
      setSearchTerm('');
    }
  };

  // Progress Calculation
  const dailyProgress = useMemo(() => {
    const bibleTasks = chapters;
    const spiritualStatic = ['prayer', 'declaration'];
    const spiritualCustom = data.spiritual?.custom || [];
    const studyTasks = data.studies || [];

    const totalCount = bibleTasks.length + spiritualStatic.length + spiritualCustom.length + studyTasks.length;
    if (totalCount === 0) return 0;

    const checkedCount = 
      bibleTasks.filter(ch => data.bible?.[ch]).length +
      (data.spiritual?.prayer ? 1 : 0) +
      (data.spiritual?.declaration ? 1 : 0) +
      spiritualCustom.filter(t => t.checked).length +
      studyTasks.filter(t => t.checked).length;

    return Math.round((checkedCount / totalCount) * 100);
  }, [chapters, data]);

  return (
    <div className="container">
      {showSearch && (
        <div className="modal-overlay" onClick={() => setShowSearch(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Jump to Book</h3>
              <button onClick={() => setShowSearch(false)}><X size={20}/></button>
            </div>
            <div className="search-bar">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search Bible book..." 
                autoFocus 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="search-results">
              {filteredBooks.map(b => (
                <button key={b} onClick={() => handleJump(b)} className="result-item">
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <header className="glass-header">
        <div className="header-top">
          <h1>AK Daily Tracker</h1>
          <div className="header-actions">
            <button className="icon-btn" title="Search" onClick={() => setShowSearch(true)}>
              <Search size={20} />
            </button>
          </div>
        </div>
        
        <div className="date-nav">
          <button onClick={() => changeDate(-1)} disabled={dateKey === START_ISO}>
            <ChevronLeft size={24} />
          </button>
          <div className="date-display">
            <h2>{currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</h2>
            <p>{currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</p>
          </div>
          <button onClick={() => changeDate(1)} disabled={dateKey === END_ISO}>
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="calendar-picker">
          <CalendarIcon size={18} />
          <input 
            type="date" 
            value={dateKey} 
            min={START_ISO} 
            max={END_ISO}
            onChange={(e) => {
              if (e.target.value) setCurrentDate(new Date(e.target.value));
            }}
          />
        </div>
      </header>

      <main className="content">
        {/* Progress Summary */}
        <div className="glass-card progress-card">
            <div className="progress-info">
                <span>Total Daily Progress</span>
                <span className="percentage">{dailyProgress}%</span>
            </div>
            <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${dailyProgress}%` }}></div>
            </div>
        </div>

        {/* Bible Section */}
        <Section title="Bible Reading" icon={<BookOpen className="icon-bible" />}>
          <div className="task-grid">
            {chapters.map((ch) => (
              <TaskItem 
                key={ch} 
                text={ch} 
                checked={!!data.bible?.[ch]} 
                onToggle={() => toggleBible(ch)} 
              />
            ))}
          </div>
        </Section>

        {/* Spiritual Section */}
        <Section title="Spiritual Life" icon={<Sparkles className="icon-spirit" />}>
          <div className="static-tasks">
            <TaskItem 
              text="Morning Prayer (30 min)" 
              checked={!!data.spiritual?.prayer} 
              onToggle={() => toggleSpiritual('prayer')} 
            />
            <TaskItem 
              text="Word Declaration" 
              checked={!!data.spiritual?.declaration} 
              onToggle={() => toggleSpiritual('declaration')} 
            />
          </div>
          <div className="divider" />
          <TaskList 
            tasks={data.spiritual?.custom || []} 
            onToggle={(i) => toggleTask('spiritual', i)}
            onRemove={(i) => removeTask('spiritual', i)}
            onAdd={() => addCustomTask('spiritual')}
            id="spiritual"
            value={spiritualInput}
            onChange={setSpiritualInput}
            placeholder="Add special spiritual goal..."
          />
        </Section>

        {/* Studies Section */}
        <Section title="Academy & Studies" icon={<GraduationCap className="icon-study" />}>
           <TaskList 
            tasks={data.studies || []} 
            onToggle={(i) => toggleTask('studies', i)}
            onRemove={(i) => removeTask('studies', i)}
            onAdd={() => addCustomTask('studies')}
            id="study"
            value={studyInput}
            onChange={setStudyInput}
            placeholder="Enter study topic for today..."
          />
        </Section>
      </main>
      
      <footer className="footer">
        <p>© 2026 AK Daily Tracker</p>
      </footer>
    </div>
  );
};

const Section = ({ title, icon, children }) => (
  <section className="section-glass">
    <div className="card-header">
      {icon}
      <h3>{title}</h3>
    </div>
    <div className="card-body">
      {children}
    </div>
  </section>
);

const TaskItem = ({ text, checked, onToggle, showDelete, onDelete }) => (
  <div className={`task-row ${checked ? 'completed' : ''}`} onClick={onToggle}>
    <div className="checkbox">
      {checked ? <CheckCircle2 className="checked" size={20} /> : <Circle className="unchecked" size={20} />}
    </div>
    <span className="task-text">{text}</span>
    {showDelete && (
      <button className="delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
        <Trash2 size={16} />
      </button>
    )}
  </div>
);

const TaskList = ({ tasks, onToggle, onRemove, onAdd, id, value, onChange, placeholder }) => (
  <div className="task-list">
    {tasks.map((task, i) => (
      <TaskItem 
        key={i} 
        text={task.text} 
        checked={task.checked} 
        onToggle={() => onToggle(i)}
        showDelete 
        onDelete={() => onRemove(i)}
      />
    ))}
    <div className="add-row">
      <input 
        id={`${id}-input`} 
        type="text" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyPress={(e) => e.key === 'Enter' && onAdd()}
      />
      <button className="add-btn" onClick={onAdd}><Plus size={20} /></button>
    </div>
  </div>
);

export default App;
