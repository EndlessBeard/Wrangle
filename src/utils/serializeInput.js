// Helpers to serialize/deserialize the Input content (text runs + List+ components)
export function serializeInputNode(rootNode) {
  const segments = [];
  function walk(node) {
    if (!node) return;
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent) segments.push({ type: 'text', text: node.textContent });
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node;
      if (el.tagName === 'BR') {
        segments.push({ type: 'text', text: '\n' });
        return;
      }
      // Detect List+ spans by data-listid attribute
      if (el.getAttribute && el.getAttribute('data-listid')) {
        const id = el.getAttribute('data-listid');
        const label = el.textContent || '';
        const listTitle = el.getAttribute('data-listtitle') || null;
        const opts = (el.getAttribute('data-selected-options') || '').split(',').map(s => s.trim()).filter(Boolean);
        segments.push({ type: 'list', id, label, listTitle, selectedOptions: opts });
        return;
      }
      // Otherwise recurse
      Array.from(el.childNodes).forEach(walk);
      if (['DIV','P'].includes(el.tagName)) segments.push({ type: 'text', text: '\n' });
    }
  }
  walk(rootNode);
  return segments;
}

export function deserializeToFragment(segments) {
  const frag = document.createDocumentFragment();
  for (const seg of segments) {
    if (seg.type === 'text') {
      frag.appendChild(document.createTextNode(seg.text));
    } else if (seg.type === 'list') {
      const span = document.createElement('span');
      span.className = 'inline-selection-component';
      if (seg.id) span.setAttribute('data-listid', seg.id);
      if (seg.listTitle) span.setAttribute('data-listtitle', seg.listTitle);
      if (Array.isArray(seg.selectedOptions) && seg.selectedOptions.length) span.setAttribute('data-selected-options', seg.selectedOptions.join(','));
      span.textContent = seg.label || `List`;
      span.contentEditable = false;
      span.style.cssText = 'display: inline-block; border: 1.5px solid #646cff; border-radius: 6px; padding: 0.3em 0.8em; margin: 0 0.2em; background: #23272f; color: #fff; cursor: pointer;';
      frag.appendChild(span);
    }
  }
  return frag;
}
