
import React, { useRef, useState, useEffect } from 'react';
import './App.css';
import { ListSelection } from './ListSelection.jsx';
import { useListManager } from './ListManager.jsx';

function CollapsibleTextField({ label, defaultOpen = false, children, showButtons, onListPlus, onUndo, onRedo, onOpen, onClose }) {
  const [open, setOpen] = useState(defaultOpen);

  const handleToggle = () => {
    const newOpen = !open;
    setOpen(newOpen);
    if (newOpen && onOpen) {
      // Call onOpen when field becomes visible
      setTimeout(() => onOpen(), 0);
    } else if (!newOpen && onClose) {
      // Call onClose when field is collapsed
      onClose();
    }
  };
   
  return (
    <div className="collapsible-container">
      <button className="collapsible-header" onClick={handleToggle}>
        <span>{label}</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          <div className="collapsible-content">
            {children}
          </div>
          {showButtons && (
            <div style={{ textAlign: 'right', padding: '0.5rem 1.5rem 1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              {onListPlus && <button className="list-plus-btn" onClick={onListPlus}>List+</button>}
              <button className="undo-btn" onClick={onUndo}>Undo</button>
              <button className="redo-btn" onClick={onRedo}>Redo</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function App() {
  // Editable state for Input only
  const [inputText, setInputText] = useState('Lorem ipsum dolor sit amet, consectetur adipiscing elit.\nSed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.');
  const outputText = `Output will appear here.\nThis field is also scrollable and collapsible.`;
  const textRef = useRef();
  const { lists, addList, updateList } = useListManager();
  // List+ mechanic state for Input
  const [selections, setSelections] = useState([]); // {id, label}
  const nextId = useRef(1);
  const inputRef = useRef();
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeSelection, setActiveSelection] = useState(null); // Track which selection is active
  const [inputHTML, setInputHTML] = useState(''); // Store the actual HTML content
  const [showListsModal, setShowListsModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedListForComponent, setSelectedListForComponent] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [labelInput, setLabelInput] = useState(''); // For label editing
  const [isEditingLabel, setIsEditingLabel] = useState(false); // Track if label is being edited
  const [currentMenuTitle, setCurrentMenuTitle] = useState(''); // Track current menu title
  const [showAddListModal, setShowAddListModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListItemsText, setNewListItemsText] = useState('');
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [showEditListModal, setShowEditListModal] = useState(false);
  const [editListIndex, setEditListIndex] = useState(0);
  const [editListItemsText, setEditListItemsText] = useState('');
  const [convertedOutput, setConvertedOutput] = useState('');
   

  // Initialize content once
  React.useEffect(() => {
    if (inputRef.current && !isInitialized) {
      inputRef.current.textContent = inputText;
      setInputHTML(inputRef.current.innerHTML);
      setIsInitialized(true);
    }
  }, [inputText, isInitialized]);

  // Negative field state (mirror of Input)
  const [negText, setNegText] = useState('');
  const negRef = useRef();
  const [negSelections, setNegSelections] = useState([]); // {id, label}
  const negNextId = useRef(1);
  const [negIsInitialized, setNegIsInitialized] = useState(false);
  const [negActiveSelection, setNegActiveSelection] = useState(null);
  const [negHTML, setNegHTML] = useState('');
  const [negShowListsModal, setNegShowListsModal] = useState(false);
  const [negShowOptionsModal, setNegShowOptionsModal] = useState(false);
  const [negSelectedListForComponent, setNegSelectedListForComponent] = useState(null);
  const [negSelectedOptions, setNegSelectedOptions] = useState([]);
  const [negLabelInput, setNegLabelInput] = useState('');
  const [negIsEditingLabel, setNegIsEditingLabel] = useState(false);
  const [negCurrentMenuTitle, setNegCurrentMenuTitle] = useState('');


  // Restore content when field becomes visible
  React.useEffect(() => {
    if (inputRef.current && inputHTML && isInitialized) {
      // Only restore if content is different
      if (inputRef.current.innerHTML !== inputHTML) {
        inputRef.current.innerHTML = inputHTML;
      }
    }
  });

  // Convert contenteditable DOM to output string, replacing selection components
  const nodeToOutputText = (node) => {
    if (!node) return '';
    const NODE_TYPE = node.nodeType;
    if (NODE_TYPE === Node.TEXT_NODE) {
      return node.nodeValue || '';
    }
    if (NODE_TYPE === Node.ELEMENT_NODE) {
      const el = node;
      const tag = el.tagName;
      if (tag === 'BR') return '\n';
      // If this element represents a selection component (has data-listid)
      if (el.getAttribute && el.getAttribute('data-listid')) {
        const optsAttr = el.getAttribute('data-selected-options') || '';
        const items = optsAttr.split(',').map(s => s.trim()).filter(Boolean);
        if (items.length) {
          // join with | inside braces
          return `{${items.map(s => s.replace(/([{}])/g,'\\$1')).join('|')}}`;
        }
        // fallback: use displayed label
        const label = el.textContent || '';
        return `{${label}}`;
      }
      // Otherwise recursively process children
      let out = '';
      el.childNodes.forEach((child) => {
        out += nodeToOutputText(child);
      });
      // Treat block elements as having a newline after
      if (['DIV', 'P'].includes(tag)) out += '\n';
      return out;
    }
    return '';
  };

  // Update convertedOutput whenever the input HTML changes
  React.useEffect(() => {
    try {
      if (!inputRef.current) {
        setConvertedOutput('');
        return;
      }
      const result = nodeToOutputText(inputRef.current).replace(/\u00A0/g, ' ');
      setConvertedOutput(result);
    } catch (e) {
      setConvertedOutput('');
    }
  }, [inputHTML]);

  // Insert label at caret position in contenteditable div
  const handleAddSelection = () => {
    if (!inputRef.current) return;
    const sel = window.getSelection();
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
    const label = `[[List${nextId.current}]]`;
    
    if (range && inputRef.current.contains(range.startContainer)) {
      // Insert a span element as the selection component
      const span = document.createElement('span');
      span.className = 'inline-selection-component';
      span.setAttribute('data-listid', nextId.current);
      span.contentEditable = false;
      span.textContent = `List${nextId.current}`;
      span.style.cssText = 'display: inline-block; border: 1.5px solid #646cff; border-radius: 6px; padding: 0.3em 0.8em; margin: 0 0.2em; background: #23272f; color: #fff; cursor: pointer;';
      
      range.insertNode(span);
      range.setStartAfter(span);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      
      setInputText(inputRef.current.textContent || '');
      setInputHTML(inputRef.current.innerHTML);
    } else {
      // Fallback: append to end
      const span = document.createElement('span');
      span.className = 'inline-selection-component';
      span.setAttribute('data-listid', nextId.current);
      span.contentEditable = false;
      span.textContent = `List${nextId.current}`;
      span.style.cssText = 'display: inline-block; border: 1.5px solid #646cff; border-radius: 6px; padding: 0.3em 0.8em; margin: 0 0.2em; background: #23272f; color: #fff; cursor: pointer;';
      inputRef.current.appendChild(span);
      setInputText(inputRef.current.textContent || '');
      setInputHTML(inputRef.current.innerHTML);
    }
    setSelections((prev) => [...prev, { id: nextId.current, label }]);
    nextId.current++;
  };
  const handleRemoveSelection = (id) => {
    const sel = selections.find(s => s.id === id);
    if (!sel) return;
    // Remove label from text
    setInputText((txt) => txt.replace(sel.label, ''));
  };

  // Negative field selection handlers (mirror Input handlers)
  const negHandleAddSelection = () => {
    if (!negRef.current) return;
    const sel = window.getSelection();
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
    const label = `[[List${negNextId.current}]]`;
    
    if (range && negRef.current.contains(range.startContainer)) {
      const span = document.createElement('span');
      span.className = 'inline-selection-component';
      span.setAttribute('data-listid', negNextId.current);
      span.contentEditable = false;
      span.textContent = `List${negNextId.current}`;
      span.style.cssText = 'display: inline-block; border: 1.5px solid #646cff; border-radius: 6px; padding: 0.3em 0.8em; margin: 0 0.2em; background: #23272f; color: #fff; cursor: pointer;';
      
      range.insertNode(span);
      range.setStartAfter(span);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      
      setNegText(negRef.current.textContent || '');
      setNegHTML(negRef.current.innerHTML);
    } else {
      const span = document.createElement('span');
      span.className = 'inline-selection-component';
      span.setAttribute('data-listid', negNextId.current);
      span.contentEditable = false;
      span.textContent = `List${negNextId.current}`;
      span.style.cssText = 'display: inline-block; border: 1.5px solid #646cff; border-radius: 6px; padding: 0.3em 0.8em; margin: 0 0.2em; background: #23272f; color: #fff; cursor: pointer;';
      negRef.current.appendChild(span);
      setNegText(negRef.current.textContent || '');
      setNegHTML(negRef.current.innerHTML);
    }
    setNegSelections((prev) => [...prev, { id: negNextId.current, label }]);
    negNextId.current++;
  };

  const negHandleRemoveSelection = (id) => {
    const sel = negSelections.find(s => s.id === id);
    if (!sel) return;
    setNegText((txt) => txt.replace(sel.label, ''));
    setSelections((prev) => prev.filter(sel => sel.id !== id));
  };

  // Undo/Redo for Input (simple stack)
  const [inputHistory, setInputHistory] = useState([]);
  const [inputFuture, setInputFuture] = useState([]);
  const handleInputChange = (val) => {
    setInputHistory((h) => [...h, inputText]);
    setInputText(val);
    setInputFuture([]);
  };
  const handleInputUndo = () => {
    setInputFuture((f) => [inputText, ...f]);
    setInputText((prev) => {
      const last = inputHistory[inputHistory.length - 1];
      setInputHistory((h) => h.slice(0, -1));
      return last || prev;
    });
  };
  const handleInputRedo = () => {
    setInputHistory((h) => [...h, inputText]);
    setInputText((prev) => {
      const next = inputFuture[0];
      setInputFuture((f) => f.slice(1));
      return next || prev;
    });
  };


  const handleCopy = () => {
    if (textRef.current) {
      navigator.clipboard.writeText(textRef.current.innerText);
    }
  };

  // Render input text with Selection components inline (for contenteditable)
  function renderInputWithSelectionsHTML() {
    if (selections.length === 0) return inputText.replace(/\n/g, '<br/>');
    let html = inputText;
    selections.forEach((sel) => {
      // Replace label with a span with a unique data attribute
      html = html.replaceAll(sel.label, `<span data-listid="${sel.id}" class="inline-selection">${sel.label}</span>`);
    });
    return html.replace(/\n/g, '<br/>');
  }

  return (
    <div className="main-wrapper">
      <header className="title-bar">
        <button className="menu-btn" aria-label="Open menu" onClick={() => setShowAddListModal(true)}>
          <span className="menu-bar"></span>
          <span className="menu-bar"></span>
          <span className="menu-bar"></span>
        </button>
        <h1 className="app-title">Boilerplate Page</h1>
        <button className="copy-btn" onClick={handleCopy}>COPY</button>
      </header>
      <div className="fields-container">
        <div ref={textRef} className="copy-source">
          <CollapsibleTextField
            label="Input"
            defaultOpen={true}
            showButtons={true}
            onListPlus={handleAddSelection}
            onUndo={handleInputUndo}
            onRedo={handleInputRedo}
            onOpen={() => {
              // Restore content when field opens
              if (inputRef.current && inputHTML) {
                inputRef.current.innerHTML = inputHTML;
              }
            }}
            onClose={() => {
              // Close selection menu and modals when field is collapsed
              setActiveSelection(null);
              setIsEditingLabel(false);
              setShowListsModal(false);
              setShowOptionsModal(false);
            }}
          >
            {/* Contenteditable div for Input field */}
            <div
              ref={inputRef}
              className="editable-textarea contenteditable-input"
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              style={{ minHeight: 80, width: '100%', outline: 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'inherit', color: 'inherit', border: 'none', borderRadius: 6, fontSize: '1rem', fontFamily: 'inherit', marginBottom: 8, padding: '0.5em 0.7em' }}
              onInput={e => {
                setInputText(e.currentTarget.textContent || '');
                setInputHTML(e.currentTarget.innerHTML);
              }}
              onBlur={() => {
                // Save content when field loses focus
                if (inputRef.current) {
                  setInputText(inputRef.current.textContent || '');
                  setInputHTML(inputRef.current.innerHTML);
                }
              }}
              onClick={e => {
                // Handle clicks on selection components
                if (e.target.classList.contains('inline-selection-component')) {
                  e.preventDefault();
                  e.stopPropagation();
                  const listId = parseInt(e.target.getAttribute('data-listid'));
                  const isTogglingOff = activeSelection === listId;
                  setActiveSelection(isTogglingOff ? null : listId);
                  
                  // Set the initial menu title when opening
                  if (!isTogglingOff) {
                    const span = document.querySelector(`[data-listid="${listId}"]`);
                    const currentLabel = span ? span.textContent : `List${listId}`;
                    setCurrentMenuTitle(currentLabel);
                  }
                } else {
                  // Click elsewhere closes the menu
                  setActiveSelection(null);
                  setIsEditingLabel(false);
                }
              }}
            />
          </CollapsibleTextField>
          
          {/* Negative field - duplicate of Input */}
          <CollapsibleTextField
            label="Negative"
            defaultOpen={true}
            showButtons={true}
            onListPlus={negHandleAddSelection}
            onUndo={() => { /* TODO: implement undo for negative */ }}
            onRedo={() => { /* TODO: implement redo for negative */ }}
            onOpen={() => {
              if (negRef.current && negHTML) {
                negRef.current.innerHTML = negHTML;
              }
            }}
            onClose={() => {
              // Close negative selection menu and modals when field is collapsed
              setNegActiveSelection(null);
              setNegIsEditingLabel(false);
              setNegShowListsModal(false);
              setNegShowOptionsModal(false);
            }}
          >
            {/* Contenteditable div for Negative field */}
            <div
              ref={negRef}
              className="editable-textarea contenteditable-input"
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              style={{ minHeight: 80, width: '100%', outline: 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'inherit', color: 'inherit', border: 'none', borderRadius: 6, fontSize: '1rem', fontFamily: 'inherit', marginBottom: 8, padding: '0.5em 0.7em' }}
              onInput={e => {
                setNegText(e.currentTarget.textContent || '');
                setNegHTML(e.currentTarget.innerHTML);
              }}
              onBlur={() => {
                if (negRef.current) {
                  setNegText(negRef.current.textContent || '');
                  setNegHTML(negRef.current.innerHTML);
                }
              }}
              onClick={e => {
                // Handle clicks on negative selection components
                if (e.target.classList.contains('inline-selection-component')) {
                  e.preventDefault();
                  e.stopPropagation();
                  const listId = parseInt(e.target.getAttribute('data-listid'));
                    const isTogglingOff = negActiveSelection === listId;
                    setNegActiveSelection(isTogglingOff ? null : listId);
                    if (!isTogglingOff) {
                      const span = document.querySelector(`[data-listid="${listId}"]`);
                      const currentLabel = span ? span.textContent : `List${listId}`;
                      setNegCurrentMenuTitle(currentLabel);
                    }
                } else {
                  // Click elsewhere closes the negative menu
                  setNegActiveSelection(null);
                }
              }}
            />
          </CollapsibleTextField>

          {/* Selection component menu */}
          {activeSelection && (
            <div className="selection-menu" style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              background: '#23272f', 
              border: '1px solid #646cff', 
              borderRadius: 8, 
              padding: '1rem',
              zIndex: 1000,
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#fff' }}>
                {currentMenuTitle}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {!isEditingLabel ? (
                  <button 
                    className="selection-menu-btn"
                    onClick={() => {
                      const span = document.querySelector(`[data-listid="${activeSelection}"]`);
                      const currentText = span ? span.textContent : `List${activeSelection}`;
                      setLabelInput(currentText);
                      setIsEditingLabel(true);
                    }}
                  >
                    Label
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={labelInput}
                      onChange={(e) => {
                        setLabelInput(e.target.value);
                        setCurrentMenuTitle(e.target.value); // Update title in real-time
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          // Update the span element's text
                          const span = document.querySelector(`[data-listid="${activeSelection}"]`);
                          if (span) span.textContent = labelInput;
                          // Update the selections state with new label
                          setSelections(prev => prev.map(sel => 
                            sel.id === activeSelection ? { ...sel, label: labelInput } : sel
                          ));
                          setInputText(inputRef.current.textContent || '');
                          setInputHTML(inputRef.current.innerHTML); // Save HTML changes
                          setIsEditingLabel(false);
                          setActiveSelection(null);
                        } else if (e.key === 'Escape') {
                          // Restore original title
                          const span = document.querySelector(`[data-listid="${activeSelection}"]`);
                          const originalText = span ? span.textContent : `List${activeSelection}`;
                          setCurrentMenuTitle(originalText);
                          setIsEditingLabel(false);
                        }
                      }}
                      onBlur={() => {
                        // Update the span element's text on blur
                        const span = document.querySelector(`[data-listid="${activeSelection}"]`);
                        if (span) span.textContent = labelInput;
                        // Update the selections state with new label
                        setSelections(prev => prev.map(sel => 
                          sel.id === activeSelection ? { ...sel, label: labelInput } : sel
                        ));
                        setInputText(inputRef.current.textContent || '');
                        setInputHTML(inputRef.current.innerHTML); // Save HTML changes
                        setIsEditingLabel(false);
                      }}
                      autoFocus
                      style={{
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #646cff',
                        background: '#1a1a1a',
                        color: '#fff',
                        fontSize: '14px'
                      }}
                      placeholder="Enter label name"
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '12px', color: '#888' }}>
                      <span>Press Enter to save, Esc to cancel</span>
                    </div>
                  </div>
                )}
                <button 
                  className="selection-menu-btn"
                  onClick={() => {
                    setShowListsModal(true);
                  }}
                >
                  Lists
                </button>
                <button 
                  className="selection-menu-btn"
                  onClick={() => {
                    if (selectedListForComponent) {
                      setShowOptionsModal(true);
                    } else {
                      alert('Please select a list first');
                    }
                  }}
                >
                  Options
                </button>
              </div>
            </div>
          )}
          
          {/* Lists Modal */}
          {showListsModal && (
            <div className="modal-bg" onClick={() => setShowListsModal(false)}>
              <div className="modal-menu" onClick={e => e.stopPropagation()}>
                <h4>Select List</h4>
                {lists.map((list, idx) => (
                  <button 
                    key={idx}
                    className="modal-list-btn" 
                    onClick={() => {
                      setSelectedListForComponent(list);
                      setSelectedOptions([]); // Reset options when list changes
                      setShowListsModal(false);
                      setShowOptionsModal(true); // Automatically open Options modal
                      // Keep activeSelection open so user can continue with options
                    }}
                  >
                    {list.title}
                  </button>
                ))}
                <button className="modal-list-btn" onClick={() => setShowListsModal(false)} style={{ marginTop: 10 }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Options Modal */}
          {showOptionsModal && selectedListForComponent && (
            <div className="modal-bg" onClick={() => setShowOptionsModal(false)}>
              <div className="modal-menu" onClick={e => e.stopPropagation()}>
                <h4>Select Options from {selectedListForComponent.title}</h4>
                <div style={{ maxHeight: 300, overflowY: 'auto', margin: '1rem 0' }}>
                  {selectedListForComponent.items.map((option, idx) => (
                    <label key={idx} style={{ display: 'block', textAlign: 'left', margin: '0.5rem 0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedOptions.includes(option)}
                        onChange={() => {
                          setSelectedOptions(prev => 
                            prev.includes(option)
                              ? prev.filter(o => o !== option)
                              : [...prev, option]
                          );
                        }}
                        style={{ marginRight: 8 }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="modal-list-btn" 
                    onClick={() => {
                      // Store selected options but keep the label name visible
                      const span = document.querySelector(`[data-listid="${activeSelection}"]`);
                      if (span && selectedOptions.length > 0) {
                        // Store the selected options as a data attribute instead of changing the display text
                        span.setAttribute('data-selected-options', selectedOptions.join(','));
                        // Keep the display text as the label name (don't change span.textContent)
                        setInputText(inputRef.current.textContent || '');
                        setInputHTML(inputRef.current.innerHTML);
                      }
                      setShowOptionsModal(false);
                      setActiveSelection(null); // This closes the Selection Component menu
                      setIsEditingLabel(false); // Ensure label editing is also closed
                    }}
                    style={{ flex: 1 }}
                  >
                    Apply Selected ({selectedOptions.length})
                  </button>
                  <button 
                    className="modal-list-btn" 
                    onClick={() => setShowOptionsModal(false)}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add List Modal (from hamburger) */}
          {showAddListModal && (
            <div className="modal-bg" onClick={() => setShowAddListModal(false)}>
              <div className="modal-menu" onClick={e => e.stopPropagation()}>
                <h4>Add New List</h4>
                <label style={{ display: 'block', textAlign: 'left', marginTop: 8 }}>Title</label>
                <input value={newListTitle} onChange={e => setNewListTitle(e.target.value)} style={{ width: '100%', padding: '0.5rem', marginTop: 4 }} />
                <label style={{ display: 'block', textAlign: 'left', marginTop: 8 }}>Items (comma separated)</label>
                <textarea value={newListItemsText} onChange={e => setNewListItemsText(e.target.value)} style={{ width: '100%', minHeight: 120, padding: '0.5rem', marginTop: 4 }} />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 10 }}>
                  <button className="modal-list-btn" onClick={() => {
                    // Parse items and add
                    const title = newListTitle.trim();
                    if (!title) { alert('Please enter a title'); return; }
                    const items = newListItemsText.split(',').map(s => s.trim()).filter(Boolean);
                    addList({ title, items });
                    setNewListTitle(''); setNewListItemsText('');
                    setShowAddListModal(false);
                  }}>Save</button>
                  <button className="modal-list-btn" onClick={() => setShowAddListModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          
            {/* Negative Selection component menu */}
            {negActiveSelection && (
              <div className="selection-menu" style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)',
                background: '#23272f', 
                border: '1px solid #646cff', 
                borderRadius: 8, 
                padding: '1rem',
                zIndex: 1000,
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
              }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#fff' }}>
                  {negCurrentMenuTitle || (() => {
                    const span = document.querySelector(`[data-listid="${negActiveSelection}"]`);
                    return span ? span.textContent : `List${negActiveSelection}`;
                  })()}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {!negIsEditingLabel ? (
                    <button 
                      className="selection-menu-btn"
                      onClick={() => {
                        const span = document.querySelector(`[data-listid="${negActiveSelection}"]`);
                        const currentText = span ? span.textContent : `List${negActiveSelection}`;
                        setNegLabelInput(currentText);
                        setNegIsEditingLabel(true);
                        setNegCurrentMenuTitle(currentText);
                      }}
                    >
                      Label
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={negLabelInput}
                        onChange={(e) => {
                          setNegLabelInput(e.target.value);
                          setNegCurrentMenuTitle(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const span = document.querySelector(`[data-listid="${negActiveSelection}"]`);
                            if (span) span.textContent = negLabelInput;
                            setNegSelections(prev => prev.map(sel => 
                              sel.id === negActiveSelection ? { ...sel, label: negLabelInput } : sel
                            ));
                            setNegText(negRef.current.textContent || '');
                            setNegHTML(negRef.current.innerHTML);
                            setNegIsEditingLabel(false);
                            setNegActiveSelection(null);
                          } else if (e.key === 'Escape') {
                            const span = document.querySelector(`[data-listid="${negActiveSelection}"]`);
                            const originalText = span ? span.textContent : `List${negActiveSelection}`;
                            setNegCurrentMenuTitle(originalText);
                            setNegIsEditingLabel(false);
                          }
                        }}
                        onBlur={() => {
                          const span = document.querySelector(`[data-listid="${negActiveSelection}"]`);
                          if (span) span.textContent = negLabelInput;
                          setNegSelections(prev => prev.map(sel => 
                            sel.id === negActiveSelection ? { ...sel, label: negLabelInput } : sel
                          ));
                          setNegText(negRef.current.textContent || '');
                          setNegHTML(negRef.current.innerHTML);
                          setNegIsEditingLabel(false);
                        }}
                        autoFocus
                        style={{
                          padding: '0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #646cff',
                          background: '#1a1a1a',
                          color: '#fff',
                          fontSize: '14px'
                        }}
                        placeholder="Enter label name"
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '12px', color: '#888' }}>
                        <span>Press Enter to save, Esc to cancel</span>
                      </div>
                    </div>
                  )}
                  <button 
                    className="selection-menu-btn"
                    onClick={() => {
                      setNegShowListsModal(true);
                    }}
                  >
                    Lists
                  </button>
                  <button 
                    className="selection-menu-btn"
                    onClick={() => {
                      if (negSelectedListForComponent) {
                        setNegShowOptionsModal(true);
                      } else {
                        alert('Please select a list first');
                      }
                    }}
                  >
                    Options
                  </button>
                </div>
              </div>
            )}

            {/* Negative Lists Modal */}
            {negShowListsModal && (
              <div className="modal-bg" onClick={() => setNegShowListsModal(false)}>
                <div className="modal-menu" onClick={e => e.stopPropagation()}>
                  <h4>Select List</h4>
                  {lists.map((list, idx) => (
                    <button 
                      key={idx}
                      className="modal-list-btn" 
                      onClick={() => {
                        setNegSelectedListForComponent(list);
                        setNegSelectedOptions([]); // Reset options when list changes
                        setNegShowListsModal(false);
                        setNegShowOptionsModal(true); // Automatically open Options modal
                      }}
                    >
                      {list.title}
                    </button>
                  ))}
                  <button className="modal-list-btn" onClick={() => setNegShowListsModal(false)} style={{ marginTop: 10 }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Negative Options Modal */}
            {negShowOptionsModal && negSelectedListForComponent && (
              <div className="modal-bg" onClick={() => setNegShowOptionsModal(false)}>
                <div className="modal-menu" onClick={e => e.stopPropagation()}>
                  <h4>Select Options from {negSelectedListForComponent.title}</h4>
                  <div style={{ maxHeight: 300, overflowY: 'auto', margin: '1rem 0' }}>
                    {negSelectedListForComponent.items.map((option, idx) => (
                      <label key={idx} style={{ display: 'block', textAlign: 'left', margin: '0.5rem 0', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={negSelectedOptions.includes(option)}
                          onChange={() => {
                            setNegSelectedOptions(prev => 
                              prev.includes(option)
                                ? prev.filter(o => o !== option)
                                : [...prev, option]
                            );
                          }}
                          style={{ marginRight: 8 }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="modal-list-btn" 
                      onClick={() => {
                        // Store selected options but keep the label name visible
                        const span = document.querySelector(`[data-listid="${negActiveSelection}"]`);
                        if (span && negSelectedOptions.length > 0) {
                          span.setAttribute('data-selected-options', negSelectedOptions.join(','));
                          setNegText(negRef.current.textContent || '');
                          setNegHTML(negRef.current.innerHTML);
                        }
                        setNegShowOptionsModal(false);
                        setNegActiveSelection(null);
                      }}
                      style={{ flex: 1 }}
                    >
                      Apply Selected ({negSelectedOptions.length})
                    </button>
                    <button 
                      className="modal-list-btn" 
                      onClick={() => setNegShowOptionsModal(false)}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          
          <CollapsibleTextField label="Output">
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{convertedOutput || outputText}</pre>
          </CollapsibleTextField>
        </div>
      </div>
    </div>
  );
}

export default App;
