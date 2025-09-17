import { useListManager } from './ListManager.jsx';
import { useState } from 'react';

export function ListSelection({ id, onRemove }) {
  const { lists } = useListManager();
  const [label, setLabel] = useState(`List ${id}`);
  const [showButtons, setShowButtons] = useState(false);
  const [showListsModal, setShowListsModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);

  const handleListSelect = (list) => {
    setSelectedList(list);
    setShowListsModal(false);
    setSelectedOptions([]);
  };

  const handleOptionToggle = (option) => {
    setSelectedOptions((opts) =>
      opts.includes(option)
        ? opts.filter((o) => o !== option)
        : [...opts, option]
    );
  };

  return (
    <div
      className="selection-component"
      tabIndex={0}
      onClick={() => setShowButtons(true)}
      style={{ display: 'inline-block', border: '1.5px solid #646cff', borderRadius: 6, padding: '0.3em 0.8em', margin: '0.3em', background: '#23272f', color: '#fff', minWidth: 60 }}
    >
      {label}
      {showButtons && (
        <span style={{ marginLeft: 8 }}>
          <button className="selection-btn" onClick={e => { e.stopPropagation(); setLabel(prompt('Set label:', label) || label); }}>Label</button>
          <button className="selection-btn" onClick={e => { e.stopPropagation(); setShowListsModal(true); }}>Lists</button>
          <button className="selection-btn" onClick={e => { e.stopPropagation(); setShowOptionsModal(true); }} disabled={!selectedList}>Options</button>
          <button className="selection-btn" onClick={e => { e.stopPropagation(); onRemove(id); }}>Remove</button>
        </span>
      )}
      {/* Lists Modal */}
      {showListsModal && (
        <div className="modal-bg" onClick={() => setShowListsModal(false)}>
          <div className="modal-menu" onClick={e => e.stopPropagation()}>
            <h4>Select List</h4>
            {lists.map((list, idx) => (
              <div key={idx}>
                <button className="modal-list-btn" onClick={() => handleListSelect(list)}>{list.title}</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Options Modal */}
      {showOptionsModal && selectedList && (
        <div className="modal-bg" onClick={() => setShowOptionsModal(false)}>
          <div className="modal-menu" onClick={e => e.stopPropagation()}>
            <h4>Select Options</h4>
            {selectedList.items.map((option, idx) => (
              <label key={idx} style={{ display: 'block', textAlign: 'left' }}>
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  onChange={() => handleOptionToggle(option)}
                  style={{ marginRight: 8 }}
                />
                {option}
              </label>
            ))}
            <button className="modal-list-btn" onClick={() => setShowOptionsModal(false)} style={{ marginTop: 10 }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
