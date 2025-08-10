const { useState, useEffect, useMemo, useCallback } = React;
    const { createRoot } = ReactDOM;

    // --- UTILITY FUNCTIONS ---
    const shuffleArray = (array) => {
      return [...array].sort(() => Math.random() - 0.5);
    };
    
    const getRating = (percentage) => {
        if (percentage === 100) return "Perfekt! ✨";
        if (percentage >= 90) return "Hervorragend!";
        if (percentage >= 75) return "Sehr gut!";
        if (percentage >= 50) return "Gut gemacht, weiter so!";
        if (percentage >= 25) return "Da geht noch was!";
        return "Übung macht den Meister!";
    };

    // --- HOOKS ---
    const useLocalStorage = (key, initialValue) => {
      const [storedValue, setStoredValue] = useState(() => {
        try {
          const item = window.localStorage.getItem(key);
          return item ? JSON.parse(item) : initialValue;
        } catch (error) {
          console.error(error);
          return initialValue;
        }
      });

      const setValue = (value) => {
        try {
          const valueToStore = value instanceof Function ? value(storedValue) : value;
          setStoredValue(valueToStore);
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
          console.error(error);
        }
      };

      return [storedValue, setValue];
    };


    // --- UI COMPONENTS ---
    const ThemeToggle = ({ theme, onToggle }) => {
        return (
            <button onClick={onToggle} className="btn" aria-label="Toggle theme">
                {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
        );
    };

    const Modal = ({ isOpen, onClose, children }) => {
      if (!isOpen) return null;

      return (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={onClose} aria-label="Schließen">&times;</button>
            {children}
          </div>
        </div>
      );
    };
    
    const ResultsChart = ({ percentage }) => {
        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        const [offset, setOffset] = useState(circumference);
        const [displayPercentage, setDisplayPercentage] = useState(0);

        useEffect(() => {
            // Animate the circle
            const progressOffset = circumference - (percentage / 100) * circumference;
            setTimeout(() => setOffset(progressOffset), 100);

            // Animate the text
            const end = Math.round(percentage);
            if (end === 0) {
                setDisplayPercentage(0);
                return;
            }

            const duration = 1000;
            const stepTime = duration / end; // time per percentage point
            let current = 0;

            const timer = setInterval(() => {
                current += 1;
                setDisplayPercentage(current);
                if (current === end) {
                    clearInterval(timer);
                }
            }, stepTime);

            return () => clearInterval(timer);
        }, [percentage, circumference]);


        return (
            <div className="results-chart-container">
                <svg className="results-chart" viewBox="0 0 100 100">
                    <circle className="chart-circle chart-background" cx="50" cy="50" r={radius}></circle>
                    <circle
                        className="chart-circle chart-progress"
                        cx="50"
                        cy="50"
                        r={radius}
                        strokeDasharray={circumference}
                        style={{ strokeDashoffset: offset }}
                    ></circle>
                </svg>
                <span className="chart-text">{displayPercentage}%</span>
            </div>
        );
    };

    const AddSectionModal = ({ isOpen, onClose, onAdd }) => {
      const [name, setName] = useState('');

      const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
          onAdd(name.trim());
          setName('');
          onClose();
        }
      };

      return (
        <Modal isOpen={isOpen} onClose={onClose}>
          <form onSubmit={handleSubmit}>
            <h2>Neuen Abschnitt erstellen</h2>
            <div className="form-group">
              <label htmlFor="section-name">Name des Abschnitts</label>
              <input
                id="section-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Englisch Lektion 1"
                autoFocus
              />
            </div>
            <div className="modal-actions">
                <button type="button" onClick={onClose} className="btn">Abbrechen</button>
                <button type="submit" className="btn btn-primary">Erstellen</button>
            </div>
          </form>
        </Modal>
      );
    };

    const AddWordModal = ({ isOpen, onClose, onAdd }) => {
      const [original, setOriginal] = useState('');
      const [translation, setTranslation] = useState('');

      const handleSubmit = (e) => {
        e.preventDefault();
        if (original.trim() && translation.trim()) {
          onAdd(original.trim(), translation.trim());
          setOriginal('');
          setTranslation('');
          onClose();
        }
      };
      
      return (
        <Modal isOpen={isOpen} onClose={onClose}>
          <form onSubmit={handleSubmit}>
            <h2>Neues Wort hinzufügen</h2>
            <div className="form-group">
              <label htmlFor="original-word">Wort</label>
              <input id="original-word" type="text" value={original} onChange={(e) => setOriginal(e.target.value)} placeholder="z.B. hello" autoFocus />
            </div>
            <div className="form-group">
              <label htmlFor="translated-word">Übersetzung</label>
              <input id="translated-word" type="text" value={translation} onChange={(e) => setTranslation(e.target.value)} placeholder="z.B. hallo" />
            </div>
            <div className="modal-actions">
                <button type="button" onClick={onClose} className="btn">Abbrechen</button>
                <button type="submit" className="btn btn-primary">Hinzufügen</button>
            </div>
          </form>
        </Modal>
      );
    };
    
    const EditWordModal = ({ isOpen, onClose, onSave, word }) => {
        const [original, setOriginal] = useState('');
        const [translation, setTranslation] = useState('');

        useEffect(() => {
            if (word) {
                setOriginal(word.original);
                setTranslation(word.translation);
            }
        }, [word]);

        const handleSubmit = (e) => {
            e.preventDefault();
            if (original.trim() && translation.trim()) {
                onSave(word.id, original.trim(), translation.trim());
                onClose();
            }
        };

        if (!word) return null;

        return (
            <Modal isOpen={isOpen} onClose={onClose}>
                <form onSubmit={handleSubmit}>
                    <h2>Wort bearbeiten</h2>
                    <div className="form-group">
                        <label htmlFor="edit-original-word">Wort</label>
                        <input id="edit-original-word" type="text" value={original} onChange={(e) => setOriginal(e.target.value)} autoFocus />
                    </div>
                    <div className="form-group">
                        <label htmlFor="edit-translated-word">Übersetzung</label>
                        <input id="edit-translated-word" type="text" value={translation} onChange={(e) => setTranslation(e.target.value)} />
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn">Abbrechen</button>
                        <button type="submit" className="btn btn-primary">Speichern</button>
                    </div>
                </form>
            </Modal>
        );
    };

    const ShareModal = ({ section, onClose }) => {
        const [copied, setCopied] = useState(false);

        const generateShareText = useCallback((sec) => {
            const header = "[Vokabeltrainer Abschnitt]";
            const name = `Name: ${sec.name}`;
            const separator = "---";
            const wordLines = sec.words.map(w => `${w.original} | ${w.translation}`).join('\n');
            return [header, name, separator, wordLines].join('\n');
        }, []);

        if (!section) return null;

        const shareText = generateShareText(section);

        const handleCopy = () => {
            navigator.clipboard.writeText(shareText).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
            });
        };

        return (
            <Modal isOpen={!!section} onClose={onClose}>
                <h2>Abschnitt "{section.name}" teilen</h2>
                <p>Kopiere den folgenden Text und sende ihn an einen Freund.</p>
                <div className="form-group">
                    <textarea readOnly value={shareText} onClick={(e) => e.target.select()} aria-label="Text zum Teilen" />
                </div>
                <div className="modal-actions">
                    <button onClick={handleCopy} className="btn btn-primary">
                        {copied ? 'Kopiert!' : 'Text kopieren'}
                    </button>
                </div>
                <p className="modal-info">Dein Freund kann diesen Text in der App importieren, um eine Kopie deines Abschnitts zu erstellen.</p>
            </Modal>
        );
    };

    const ImportModal = ({ isOpen, onClose, onImport }) => {
        const [text, setText] = useState('');

        const handleImportClick = () => {
            if (text.trim()) {
                onImport(text.trim());
                setText('');
                onClose();
            }
        };

        return (
            <Modal isOpen={isOpen} onClose={onClose}>
                <h2>Abschnitt importieren</h2>
                <div className="form-group">
                    <label htmlFor="import-text">Geteilten Text hier einfügen</label>
                    <textarea
                        id="import-text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Füge den kopierten Text aus einem geteilten Abschnitt hier ein..."
                        autoFocus
                    />
                </div>
                <div className="modal-actions">
                    <button type="button" onClick={onClose} className="btn">Abbrechen</button>
                    <button onClick={handleImportClick} className="btn btn-primary">Importieren</button>
                </div>
            </Modal>
        );
    };

    // --- LEARNING MODE COMPONENTS ---
    const WordList = ({ section, deleteWord, onEditWord }) => {
        const [hideOriginals, setHideOriginals] = useState(false);
        const [hideTranslations, setHideTranslations] = useState(false);

        return (
            <div className="word-list-container fade-in">
                <div className="word-list-header">
                    <h3>
                        <button onClick={() => setHideOriginals(prev => !prev)} className="btn-icon btn-toggle-vis" aria-label="Alle Wörter anzeigen/verbergen">
                            {hideOriginals ? '👁️' : '🙈'}
                        </button>
                        Wort
                    </h3>
                    <h3>
                         <button onClick={() => setHideTranslations(prev => !prev)} className="btn-icon btn-toggle-vis" aria-label="Alle Übersetzungen anzeigen/verbergen">
                            {hideTranslations ? '👁️' : '🙈'}
                        </button>
                        Übersetzung
                    </h3>
                    <h3>Aktionen</h3>
                </div>
                <ul className="word-list">
                    {section.words.map(word => (
                        <li key={word.id} className="word-item">
                            <span className={`word-text ${hideOriginals ? 'hidden' : ''}`}>
                                {hideOriginals ? '...' : word.original}
                            </span>
                            <span className={`word-text ${hideTranslations ? 'hidden' : ''}`}>
                                {hideTranslations ? '...' : word.translation}
                            </span>
                            <div className="word-actions">
                                <button onClick={() => onEditWord(word)} className="btn-icon btn-edit" aria-label="Wort bearbeiten">
                                    ✏️
                                </button>
                                <button onClick={() => deleteWord(word.id)} className="btn-icon btn-delete" aria-label="Wort löschen">
                                    &#x1F5D1;
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const Flashcards = ({ words }) => {
      const [currentIndex, setCurrentIndex] = useState(0);
      const [isFlipped, setIsFlipped] = useState(false);
      const [isNavigating, setIsNavigating] = useState(false);

      const navigate = (direction) => {
          if (isNavigating) return;

          setIsNavigating(true);
          if (isFlipped) {
            setIsFlipped(false);
          }

          setTimeout(() => {
              setCurrentIndex(prev => {
                  if (direction === 'next') {
                      return (prev + 1) % words.length;
                  } else {
                      return (prev - 1 + words.length) % words.length;
                  }
              });
              setIsNavigating(false);
          }, 300);
      };

      const currentWord = words[currentIndex];

      return (
        <div className="flashcard-container fade-in">
          <div className="flashcard-deck">
              <div 
                  className={`flashcard ${isFlipped ? 'is-flipped' : ''} ${isNavigating ? 'is-navigating' : ''}`} 
                  onClick={() => !isNavigating && setIsFlipped(!isFlipped)}
              >
                <div className="flashcard-face flashcard-front">{currentWord.original}</div>
                <div className="flashcard-face flashcard-back">{currentWord.translation}</div>
              </div>
          </div>
          <div className="flashcard-progress">{currentIndex + 1} / {words.length}</div>
          <div className="flashcard-nav">
            <button onClick={() => navigate('prev')} className="btn">Zurück</button>
            <button onClick={() => navigate('next')} className="btn">Weiter</button>
          </div>
        </div>
      );
    };


    const Quiz = ({ words, onFinish }) => {
        const questions = useMemo(() => {
            if (words.length < 4) return [];
            return shuffleArray(words).map((word) => {
                const wrongOptions = shuffleArray(words.filter((w) => w.id !== word.id)).slice(0, 3).map((w) => w.translation);
                const options = shuffleArray([word.translation, ...wrongOptions]);
                return {
                    question: word.original,
                    correctAnswer: word.translation,
                    options
                };
            });
        }, [words]);

        const [currentQ, setCurrentQ] = useState(0);
        const [score, setScore] = useState(0);
        const [selected, setSelected] = useState(null);
        const [isCorrect, setIsCorrect] = useState(null);

        const handleAnswer = (answer) => {
            if(selected) return;
            setSelected(answer);
            if (answer === questions[currentQ].correctAnswer) {
                setScore(s => s + 1);
                setIsCorrect(true);
            } else {
                setIsCorrect(false);
            }
            setTimeout(() => {
                setSelected(null);
                setIsCorrect(null);
                setCurrentQ(q => q + 1);
            }, 1500);
        };

        if (words.length < 4) {
            return <div className="centered-message">Füge mindestens 4 Wörter hinzu, um das Quiz zu starten.</div>;
        }

        if (currentQ >= questions.length) {
            const percentage = questions.length > 0 ? (score / questions.length) * 100 : 0;
            const rating = getRating(percentage);
            return (
                <div className="results-screen fade-in">
                    <h2 className="results-rating">{rating}</h2>
                    <ResultsChart percentage={percentage} />
                    <p className="final-score">Dein Ergebnis: {score} von {questions.length}</p>
                    <button onClick={onFinish} className="btn btn-primary">Zurück zum Abschnitt</button>
                </div>
            );
        }
        
        const { question, options, correctAnswer } = questions[currentQ];

        return (
            <div className="quiz-container fade-in">
                <div className="quiz-progress-bar" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}></div>
                <div className="quiz-header">
                    <p>Frage {currentQ + 1} von {questions.length}</p>
                    <p>Punkte: {score}</p>
                </div>
                <h2 className="quiz-question">{question}</h2>
                <div className="quiz-options">
                    {options.map((option, index) => (
                        <button 
                            key={`${option}-${index}`} 
                            onClick={() => handleAnswer(option)}
                            className={`btn option-btn 
                                ${selected && option === correctAnswer ? 'correct' : ''}
                                ${selected && option !== correctAnswer && option === selected ? 'incorrect' : ''}
                                ${selected && option !== correctAnswer && option === correctAnswer ? 'was-correct' : ''}
                            `}
                            disabled={!!selected}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const Test = ({ words, onFinish }) => {
        const questions = useMemo(() => shuffleArray(words), [words]);
        const [currentQ, setCurrentQ] = useState(0);
        const [userAnswers, setUserAnswers] = useState([]);
        const [currentAnswer, setCurrentAnswer] = useState('');
        const [isFinished, setIsFinished] = useState(false);

        const handleSubmit = (e) => {
            e.preventDefault();
            const newAnswers = [...userAnswers, currentAnswer];
            setUserAnswers(newAnswers);
            setCurrentAnswer('');

            if (currentQ < questions.length - 1) {
                setCurrentQ(q => q + 1);
            } else {
                setIsFinished(true);
            }
        };
        
        if (isFinished) {
            const results = questions.map((q, i) => ({
                question: q.original,
                correctAnswer: q.translation,
                userAnswer: userAnswers[i],
                isCorrect: userAnswers[i].toLowerCase().trim() === q.translation.toLowerCase().trim()
            }));
            const incorrectAnswers = results.filter(r => !r.isCorrect);
            const correctCount = results.length - incorrectAnswers.length;
            const percentage = results.length > 0 ? (correctCount / results.length) * 100 : 0;
            const rating = getRating(percentage);

            return (
                <div className="test-results fade-in">
                    <h2 className="results-rating">{rating}</h2>
                    <ResultsChart percentage={percentage} />
                    <p className="final-score">Du hast {correctCount} von {results.length} richtig beantwortet.</p>
                    {incorrectAnswers.length > 0 && <h3>Deine Fehler:</h3>}
                    <ul className="results-list">
                        {incorrectAnswers.map((res, i) => (
                            <li key={i} className="result-item incorrect">
                                <strong>{res.question}</strong>
                                <div>Deine Antwort: <span className="user-answer">{res.userAnswer || 'Keine Angabe'}</span></div>
                                <div>Richtige Antwort: <span className="correct-answer">{res.correctAnswer}</span></div>
                            </li>
                        ))}
                    </ul>
                    <button onClick={onFinish} className="btn btn-primary">Zurück zum Abschnitt</button>
                </div>
            );
        }

        return (
            <div className="test-container fade-in">
                 <div className="quiz-progress-bar" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}></div>
                 <p className="test-progress">Frage {currentQ + 1} von {questions.length}</p>
                 <h2 className="test-question">{questions[currentQ].original}</h2>
                 <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input 
                            type="text" 
                            value={currentAnswer} 
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            placeholder="Gib die Übersetzung ein..."
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="btn">Nächste Frage</button>
                 </form>
            </div>
        );
    };

    // --- VIEW COMPONENTS ---
    const Sidebar = ({ sections, activeSectionId, onSelectSection, onAddSectionClick, onImportSectionClick, theme, onToggleTheme }) => {
        return (
            <div className="sidebar">
                <div className="sidebar-header">
                    <h1>Vokabel-Pro</h1>
                </div>
                <ul className="sidebar-section-list">
                    {sections.map(section => (
                        <li
                            key={section.id}
                            className={`sidebar-section-item ${section.id === activeSectionId ? 'active' : ''}`}
                            onClick={() => onSelectSection(section.id)}
                        >
                            {section.name}
                        </li>
                    ))}
                </ul>
                <div className="sidebar-actions">
                    <button onClick={onAddSectionClick} className="btn btn-primary">+ Neuer Abschnitt</button>
                    <button onClick={onImportSectionClick} className="btn">Importieren</button>
                    <ThemeToggle theme={theme} onToggle={onToggleTheme} />
                </div>
            </div>
        );
    };

    const SectionView = ({ section, onAddWord, onDeleteWord, onEditWord, onShare, className }) => {
        const [mode, setMode] = useState('list');

        const renderLearningMode = () => {
            if (!section || section.words.length === 0) {
                return (
                    <div className="empty-state">
                        <p>Dieser Abschnitt hat noch keine Wörter.</p>
                        <p>Füge dein erstes Wort hinzu!</p>
                    </div>
                );
            }

            switch (mode) {
                case 'list': return <WordList section={section} deleteWord={onDeleteWord} onEditWord={onEditWord} />;
                case 'flashcards': return <Flashcards words={section.words} />;
                case 'quiz': return <Quiz words={section.words} onFinish={() => setMode('list')} />;
                case 'test': return <Test words={section.words} onFinish={() => setMode('list')} />;
                default: return null;
            }
        };
        
        return (
            <div className={`section-view ${className || ''}`}>
                <div className="section-view-header">
                    <h1 className="section-view-title">{section.name}</h1>
                    <div className="section-header-actions">
                        <button onClick={onAddWord} className="btn btn-primary">+ Wort</button>
                        <button onClick={onShare} className="btn">Teilen</button>
                    </div>
                </div>
                <div className="mode-selection">
                    <button onClick={() => setMode('list')} className={`btn-mode ${mode === 'list' ? 'active' : ''}`}>Liste</button>
                    <button onClick={() => setMode('flashcards')} className={`btn-mode ${mode === 'flashcards' ? 'active' : ''}`} disabled={section.words.length === 0}>Karteikarten</button>
                    <button onClick={() => setMode('quiz')} className={`btn-mode ${mode === 'quiz' ? 'active' : ''}`} disabled={section.words.length < 4}>Quiz</button>
                    <button onClick={() => setMode('test')} className={`btn-mode ${mode === 'test' ? 'active' : ''}`} disabled={section.words.length === 0}>Test</button>
                </div>
                <div className="learning-content">
                    {renderLearningMode()}
                </div>
            </div>
        );
    };


    // --- MAIN APP COMPONENT ---
    const App = () => {
        const [sections, setSections] = useLocalStorage('vocab-sections', []);
        const [activeSectionId, setActiveSectionId] = useState(null);
        const [theme, setTheme] = useLocalStorage('vocab-theme', 'light');

        useEffect(() => {
            document.body.setAttribute('data-theme', theme);
        }, [theme]);

        const toggleTheme = () => {
            setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
        };

        // Modal states
        const [isAddSectionModalOpen, setAddSectionModalOpen] = useState(false);
        const [isAddWordModalOpen, setAddWordModalOpen] = useState(false);
        const [isEditModalOpen, setEditModalOpen] = useState(false);
        const [wordToEdit, setWordToEdit] = useState(null);
        const [isImportModalOpen, setImportModalOpen] = useState(false);
        const [sectionToShare, setSectionToShare] = useState(null);

        const activeSection = useMemo(() => sections.find(s => s.id === activeSectionId), [sections, activeSectionId]);

        const handleAddSection = (name) => {
            const newSection = { id: crypto.randomUUID(), name, words: [] };
            setSections(prev => [...prev, newSection]);
            setActiveSectionId(newSection.id); // Select the new section immediately
        };

        const handleDeleteSection = (id) => {
            if (window.confirm("Bist du sicher, dass du diesen Abschnitt und alle darin enthaltenen Wörter löschen möchtest?")) {
                if (id === activeSectionId) {
                    setActiveSectionId(null); // Deselect if active
                }
                setSections(prev => prev.filter(s => s.id !== id));
            }
        };

        const handleAddWord = (original, translation) => {
            if (!activeSectionId) return;
            const newWord = { id: crypto.randomUUID(), original, translation };
            setSections(prev => prev.map(s => 
                s.id === activeSectionId ? { ...s, words: [...s.words, newWord] } : s
            ));
        };
            
        const handleDeleteWord = (wordId) => {
            if (!activeSectionId) return;
            setSections(prev => prev.map(s => 
                s.id === activeSectionId 
                ? { ...s, words: s.words.filter(w => w.id !== wordId) } 
                : s
            ));
        };
        
        const handleOpenEditModal = (word) => {
            setWordToEdit(word);
            setEditModalOpen(true);
        };
        
        const handleSaveEditedWord = (wordId, newOriginal, newTranslation) => {
            if (!activeSectionId) return;
            setSections(prev => prev.map(s => {
                if (s.id !== activeSectionId) return s;
                const updatedWords = s.words.map(w => 
                    w.id === wordId ? { ...w, original: newOriginal, translation: newTranslation } : w
                );
                return { ...s, words: updatedWords };
            }));
        };

        const handleImportFromText = (text) => {
            try {
                const lines = text.trim().split(/\r?\n/);
                if (lines.length < 3) throw new Error("Text ist zu kurz oder hat ein falsches Format.");
                
                if (lines[0].trim() !== "[Vokabeltrainer Abschnitt]") throw new Error("Keine gültigen Import-Daten (falscher Header).");
                
                const nameLine = lines[1];
                if (!nameLine || !nameLine.startsWith('Name: ')) throw new Error("Abschnittsname nicht gefunden.");
                const name = nameLine.substring(6).trim();

                if (lines[2].trim() !== '---') throw new Error("Trennlinie nicht gefunden.");
                
                if (!name) throw new Error("Abschnittsname ist leer.");

                const wordLines = lines.slice(3);
                
                const words = wordLines.map(line => {
                    if (line.trim() === '') return null;
                    const parts = line.split(' | ');
                    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
                        console.warn(`Skipping invalid word line: "${line}"`);
                        return null;
                    }
                    return { original: parts[0].trim(), translation: parts[1].trim() };
                }).filter(Boolean);

                const newSection = {
                    id: crypto.randomUUID(),
                    name: name,
                    words: words.map(w => ({ ...w, id: crypto.randomUUID() }))
                };

                setSections(prev => [...prev, newSection]);
                alert(`Der Abschnitt "${name}" wurde erfolgreich importiert!`);
                setActiveSectionId(newSection.id); // Select the new section

            } catch (error) {
                console.error("Fehler beim Import:", error);
                alert(`Import fehlgeschlagen: ${error.message}`);
            }
        };

        const handleSelectSection = (id) => {
            setActiveSectionId(id);
        };

        return (
            <div className="app-layout">
                <div className="container">
                    <Sidebar
                        sections={sections}
                    activeSectionId={activeSectionId}
                    onSelectSection={handleSelectSection}
                    onAddSectionClick={() => setAddSectionModalOpen(true)}
                    onImportSectionClick={() => setImportModalOpen(true)}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                />

                <div className="content-area">
                    <AddSectionModal
                        isOpen={isAddSectionModalOpen}
                        onClose={() => setAddSectionModalOpen(false)}
                        onAdd={handleAddSection}
                    />
                    <ImportModal
                        isOpen={isImportModalOpen}
                        onClose={() => setImportModalOpen(false)}
                        onImport={handleImportFromText}
                    />
                    <EditWordModal
                        isOpen={isEditModalOpen}
                        onClose={() => setEditModalOpen(false)}
                        onSave={handleSaveEditedWord}
                        word={wordToEdit}
                    />
                    {activeSection && (
                        <AddWordModal
                            isOpen={isAddWordModalOpen}
                            onClose={() => setAddWordModalOpen(false)}
                            onAdd={handleAddWord}
                        />
                    )}
                    <ShareModal
                        section={sectionToShare}
                        onClose={() => setSectionToShare(null)}
                    />

                    {activeSection ? (
                        <SectionView
                            key={activeSection.id} // Add key to force re-mount on section change
                            section={activeSection}
                            onAddWord={() => setAddWordModalOpen(true)}
                            onDeleteWord={handleDeleteWord}
                            onEditWord={handleOpenEditModal}
                            onShare={() => setSectionToShare(activeSection)}
                            className={'view-enter'}
                        />
                    ) : (
                       <div className="empty-state view-enter">
                           <h2>Willkommen bei Vokabel-Pro!</h2>
                           <p>Wähle einen Abschnitt aus der Seitenleiste aus oder erstelle einen neuen, um zu beginnen.</p>
                       </div>
                    )}
                </div>
                </div>
            </div>
        );
    };

    const rootElement = document.getElementById('root');
    if (rootElement) {
      const root = createRoot(rootElement);
      root.render(<App />);
    }
