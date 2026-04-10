/* ========================================
   KALYANAM — Generalized Visual Editor
   ========================================
   - Click any text to select & edit (color, font, size)
   - Drag selected text to reposition
   - Tagline: resizable box + auto-contrast color
   - Images: drag top/bottom edges to crop
   - Copy All CSS exports every change
   ======================================== */

(function () {
  'use strict';

  const FONTS = [
    { label: 'Tangerine', value: "'Tangerine', cursive" },
    { label: 'Great Vibes', value: "'Great Vibes', cursive" },
    { label: 'Sacramento', value: "'Sacramento', cursive" },
    { label: 'Cinzel', value: "'Cinzel', serif" },
    { label: 'Lato Light Italic', value: "'Lato', sans-serif", weight: '300', style: 'italic' },
    { label: 'EB Garamond', value: "'EB Garamond', Georgia, serif" },
    { label: 'Inter', value: "'Inter', sans-serif" },
    { label: 'Georgia', value: "Georgia, serif" },
    { label: 'Arial', value: "Arial, sans-serif" },
    { label: 'Times New Roman', value: "'Times New Roman', serif" },
  ];

  // Text selectors that the editor can act on
  const TEXT_SELECTOR = [
    '.hero__title', '.hero__tagline', '.hero__name', '.hero__ampersand', '.hero__motif',
    '.bios__name', '.bios__desc',
    '.countdown__heading', '.countdown__number', '.countdown__label',
    '.event__heading', '.event__venue', '.event__date', '.event__time',
    '.closing__text',
    '.ac-letter',
  ].join(',');
  const DRAG_DEFAULT_ENABLED = true;

  let active = false;
  let selected = null;        // currently selected text element
  let dragState = null;        // drag-to-move state
  let imgDragState = null;     // image crop drag state
  let toolbarDragState = null; // toolbar drag state
  let toolbarManualPos = null; // user-placed toolbar position
  let autoContrastEls = new Set(); // elements with auto-contrast enabled
  let heroCanvas = null;
  let heroCtx = null;
  let heroImgLoaded = false;
  const changes = new Map();   // element -> { props changed }

  // ---- DOM refs ----
  const toolbar = document.getElementById('ed-toolbar');
  const fontSel = document.getElementById('ed-font');
  const sizeIn = document.getElementById('ed-size');
  const colorIn = document.getElementById('ed-color');
  const boldBtn = document.getElementById('ed-bold');
  const italicBtn = document.getElementById('ed-italic');
  const autoCb = document.getElementById('ed-autocolor');
  const dragCb = document.getElementById('ed-draggable');
  const undoBtn = document.getElementById('ed-undo');
  const redoBtn = document.getElementById('ed-redo');
  const copyBtn = document.getElementById('ed-copy-all');
  const copyFullBtn = document.getElementById('ed-copy-full');
  const alignCenterBtn = document.getElementById('ed-align-center');
  const alignLeftHalfBtn = document.getElementById('ed-align-left-half');
  const alignRightHalfBtn = document.getElementById('ed-align-right-half');
  const alignMiddleBtn = document.getElementById('ed-align-middle');
  const textLeftBtn = document.getElementById('ed-text-left');
  const textCenterBtn = document.getElementById('ed-text-center');
  const textRightBtn = document.getElementById('ed-text-right');
  const toggleBtn = document.getElementById('editor-toggle');
  const canvas = document.getElementById('ed-canvas');

  let isApplyingHistory = false;
  const undoStack = [];
  const redoStack = [];

  // ---- Populate font dropdown ----
  FONTS.forEach((f) => {
    const o = document.createElement('option');
    o.value = f.value;
    o.textContent = f.label;
    o.style.fontFamily = f.value;
    if (f.weight) o.dataset.weight = f.weight;
    if (f.style) o.dataset.style = f.style;
    fontSel.appendChild(o);
  });

  function uniqueElements(elements) {
    const seen = new Set();
    const out = [];
    (elements || []).forEach((el) => {
      if (!el || seen.has(el)) return;
      seen.add(el);
      out.push(el);
    });
    return out;
  }

  function captureState(el) {
    return {
      el,
      style: el.getAttribute('style'),
      className: el.className,
      dataset: { ...el.dataset },
    };
  }

  function captureStates(elements) {
    return uniqueElements(elements).map((el) => captureState(el));
  }

  function restoreState(state) {
    const { el, style, className, dataset } = state;
    if (!el || !el.isConnected) return;
    if (style == null) {
      el.removeAttribute('style');
    } else {
      el.setAttribute('style', style);
    }
    el.className = className;

    Object.keys(el.dataset).forEach((k) => delete el.dataset[k]);
    Object.entries(dataset || {}).forEach(([k, v]) => {
      el.dataset[k] = v;
    });
  }

  function stateKey(state) {
    return [
      state.style == null ? '' : state.style,
      state.className || '',
      JSON.stringify(state.dataset || {}),
    ].join('||');
  }

  function statesChanged(before, after) {
    if (before.length !== after.length) return true;
    for (let i = 0; i < before.length; i++) {
      if (before[i].el !== after[i].el) return true;
      if (stateKey(before[i]) !== stateKey(after[i])) return true;
    }
    return false;
  }

  function setsEqual(a, b) {
    if (a.size !== b.size) return false;
    for (const v of a) {
      if (!b.has(v)) return false;
    }
    return true;
  }

  function updateHistoryButtons() {
    undoBtn.disabled = undoStack.length === 0;
    redoBtn.disabled = redoStack.length === 0;
  }

  function refreshSelectedToolbar() {
    if (!selected || !selected.isConnected) {
      deselectAll();
      return;
    }
    selectElement(selected);
  }

  function pushHistoryEntry(before, after, beforeAuto, afterAuto) {
    if (isApplyingHistory) return;
    const domChanged = statesChanged(before, after);
    const autoChanged = !setsEqual(beforeAuto, afterAuto);
    if (!domChanged && !autoChanged) return;
    undoStack.push({ before, after, beforeAuto, afterAuto });
    redoStack.length = 0;
    updateHistoryButtons();
  }

  function beginHistory(elements) {
    return {
      states: captureStates(elements),
      autoContrast: new Set(autoContrastEls),
    };
  }

  function endHistory(beforeCtx) {
    if (!beforeCtx) return;
    const beforeStates = beforeCtx.states || [];
    const afterStates = beforeStates.map((s) => captureState(s.el));
    const beforeAuto = beforeCtx.autoContrast || new Set();
    const afterAuto = new Set(autoContrastEls);
    pushHistoryEntry(beforeStates, afterStates, beforeAuto, afterAuto);
  }

  function runWithHistory(elements, fn) {
    const before = beginHistory(elements);
    fn();
    endHistory(before);
  }

  function undo() {
    const entry = undoStack.pop();
    if (!entry) return;
    isApplyingHistory = true;
    entry.before.forEach(restoreState);
    autoContrastEls = new Set(entry.beforeAuto || []);
    isApplyingHistory = false;
    redoStack.push(entry);
    updateHistoryButtons();
    refreshSelectedToolbar();
  }

  function redo() {
    const entry = redoStack.pop();
    if (!entry) return;
    isApplyingHistory = true;
    entry.after.forEach(restoreState);
    autoContrastEls = new Set(entry.afterAuto || []);
    isApplyingHistory = false;
    undoStack.push(entry);
    updateHistoryButtons();
    refreshSelectedToolbar();
  }

  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);
  updateHistoryButtons();

  function enableDragForAll() {
    const seen = new Set();
    document.querySelectorAll(TEXT_SELECTOR).forEach((node) => {
      const el = normalizeEditableTarget(node);
      if (!el || seen.has(el)) return;
      seen.add(el);
      el.classList.add('ed-drag-enabled');
    });
  }

  // ---- Toggle editor on/off ----
  toggleBtn.addEventListener('click', () => {
    active = !active;
    document.body.classList.toggle('ed-active', active);
    if (!active) {
      deselectAll();
      toolbar.hidden = true;
      toolbarManualPos = null;
      toolbarDragState = null;
      removeAllImageHandles();
    } else {
      if (DRAG_DEFAULT_ENABLED) enableDragForAll();
      addImageHandles();
      prepareHeroCanvas();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!active) return;
    const target = e.target;
    if (target && (target.closest('input, textarea, select') || target.isContentEditable)) return;

    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    const key = (e.key || '').toLowerCase();

    if (key === 'z' && e.shiftKey) {
      e.preventDefault();
      redo();
      return;
    }
    if (key === 'z') {
      e.preventDefault();
      undo();
      return;
    }
    if (key === 'y') {
      e.preventDefault();
      redo();
    }
  });

  // ---- Click to select text ----
  document.addEventListener('click', (e) => {
    if (!active) return;
    // Ignore clicks on editor UI
    if (e.target.closest('.ed-toolbar, .editor-toggle, .music-toggle, .ed-img-handle')) return;

    const textEl = e.target.closest(TEXT_SELECTOR);
    if (textEl) {
      e.preventDefault();
      e.stopPropagation();
      selectElement(normalizeEditableTarget(textEl));
    } else {
      deselectAll();
    }
  }, true);

  toolbar.addEventListener('mousedown', (e) => {
    if (!active || toolbar.hidden) return;
    if (e.target.closest('button, input, select, label, textarea')) return;
    e.preventDefault();
    startToolbarDrag(e.clientX, e.clientY);
  });
  toolbar.addEventListener('touchstart', (e) => {
    if (!active || toolbar.hidden) return;
    if (e.target.closest('button, input, select, label, textarea')) return;
    e.preventDefault();
    startToolbarDrag(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });
  toolbar.addEventListener('dblclick', (e) => {
    if (!active) return;
    if (e.target.closest('button, input, select, label, textarea')) return;
    toolbarManualPos = null;
    if (selected) positionToolbar(selected);
  });

  function normalizeEditableTarget(el) {
    if (!el) return null;
    // Auto-contrast letters are internal spans. Editing/dragging should target
    // the tagline container so drag behavior is predictable.
    if (el.classList && el.classList.contains('ac-letter')) {
      const tagline = el.closest('.hero__tagline');
      if (tagline) return tagline;
    }
    return el;
  }

  function selectElement(el) {
    deselectAll();
    selected = el;
    el.classList.add('ed-selected');

    // Read current styles into toolbar
    const cs = getComputedStyle(el);
    colorIn.value = rgbToHex(cs.color);
    sizeIn.value = Math.round(parseFloat(cs.fontSize));

    // Match font in dropdown
    const ff = cs.fontFamily;
    let matched = false;
    for (const opt of fontSel.options) {
      // Rough match: check if first font name appears
      const first = opt.value.split(',')[0].replace(/'/g, '').trim().toLowerCase();
      if (ff.toLowerCase().includes(first)) {
        fontSel.value = opt.value;
        matched = true;
        break;
      }
    }
    if (!matched) fontSel.selectedIndex = 0;

    boldBtn.classList.toggle('ed-toolbar__btn--active',
      parseInt(cs.fontWeight) >= 700);
    italicBtn.classList.toggle('ed-toolbar__btn--active',
      cs.fontStyle === 'italic');
    setTextAlignButtons(cs.textAlign || 'left');

    // Auto-contrast checkbox
    autoCb.checked = autoContrastEls.has(el);
    // Show auto-contrast only for hero text
    const inHero = !!el.closest('.hero');
    const supportsAutoContrast = inHero && !el.classList.contains('hero__motif');
    autoCb.parentElement.style.display = supportsAutoContrast ? '' : 'none';

    // Drag checkbox
    if (DRAG_DEFAULT_ENABLED && !el.classList.contains('ed-drag-enabled')) {
      el.classList.add('ed-drag-enabled');
    }
    dragCb.checked = el.classList.contains('ed-drag-enabled');

    // Position toolbar near element
    positionToolbar(el);
    toolbar.hidden = false;

    // Add resize handles for tagline
    if (el.closest('.hero__tagline')) {
      addTaglineResize(el.closest('.hero__tagline'));
    } else {
      removeTaglineResize();
    }
  }

  function deselectAll() {
    if (selected) selected.classList.remove('ed-selected');
    selected = null;
    toolbar.hidden = true;
    removeTaglineResize();
  }

  function positionToolbar(el) {
    if (toolbarManualPos) {
      const pinned = setToolbarPosition(toolbarManualPos.left, toolbarManualPos.top);
      toolbarManualPos = pinned;
      return;
    }

    const r = el.getBoundingClientRect();
    const tw = 320;
    let left = Math.max(4, Math.min(r.left, window.innerWidth - tw - 4));
    let top = r.top - 80;
    if (top < 4) top = r.bottom + 8;
    setToolbarPosition(left, top + window.scrollY);
  }

  function setToolbarPosition(left, top) {
    const margin = 4;
    const maxLeft = Math.max(margin, window.innerWidth - toolbar.offsetWidth - margin);
    const clampedLeft = Math.max(margin, Math.min(left, maxLeft));
    const minTop = window.scrollY + margin;
    const maxTop = Math.max(minTop, window.scrollY + window.innerHeight - toolbar.offsetHeight - margin);
    const clampedTop = Math.max(minTop, Math.min(top, maxTop));
    toolbar.style.left = clampedLeft + 'px';
    toolbar.style.top = clampedTop + 'px';
    return { left: clampedLeft, top: clampedTop };
  }

  function startToolbarDrag(cx, cy) {
    const r = toolbar.getBoundingClientRect();
    toolbarDragState = {
      startX: cx,
      startY: cy,
      origLeft: parseFloat(toolbar.style.left) || r.left,
      origTop: parseFloat(toolbar.style.top) || (r.top + window.scrollY),
    };
    toolbar.classList.add('ed-toolbar--dragging');
    document.body.classList.add('ed-no-select');
  }

  function moveToolbarDrag(cx, cy) {
    if (!toolbarDragState) return;
    const dx = cx - toolbarDragState.startX;
    const dy = cy - toolbarDragState.startY;
    const pos = setToolbarPosition(toolbarDragState.origLeft + dx, toolbarDragState.origTop + dy);
    toolbarManualPos = pos;
  }

  // ---- Toolbar controls ----
  fontSel.addEventListener('change', () => {
    if (!selected) return;
    runWithHistory([selected], () => {
      selected.style.fontFamily = fontSel.value;
      record(selected, 'font-family', fontSel.value);
      const selectedOpt = fontSel.options[fontSel.selectedIndex];
      if (selectedOpt && selectedOpt.dataset.weight) {
        selected.style.fontWeight = selectedOpt.dataset.weight;
        record(selected, 'font-weight', selectedOpt.dataset.weight);
      }
      if (selectedOpt && selectedOpt.dataset.style) {
        selected.style.fontStyle = selectedOpt.dataset.style;
        record(selected, 'font-style', selectedOpt.dataset.style);
      }
      const cs = getComputedStyle(selected);
      boldBtn.classList.toggle('ed-toolbar__btn--active', parseInt(cs.fontWeight) >= 700);
      italicBtn.classList.toggle('ed-toolbar__btn--active', cs.fontStyle === 'italic');
    });
  });

  sizeIn.addEventListener('input', () => {
    if (!selected) return;
    runWithHistory([selected], () => {
      selected.style.fontSize = sizeIn.value + 'px';
      record(selected, 'font-size', sizeIn.value + 'px');
    });
  });

  colorIn.addEventListener('input', () => {
    if (!selected) return;
    runWithHistory([selected], () => {
      selected.style.color = colorIn.value;
      record(selected, 'color', colorIn.value);
      autoContrastEls.delete(selected);
      autoCb.checked = false;
    });
  });

  boldBtn.addEventListener('click', () => {
    if (!selected) return;
    runWithHistory([selected], () => {
      const isBold = parseInt(getComputedStyle(selected).fontWeight) >= 700;
      selected.style.fontWeight = isBold ? '400' : '700';
      boldBtn.classList.toggle('ed-toolbar__btn--active', !isBold);
      record(selected, 'font-weight', isBold ? '400' : '700');
    });
  });

  italicBtn.addEventListener('click', () => {
    if (!selected) return;
    runWithHistory([selected], () => {
      const isItalic = getComputedStyle(selected).fontStyle === 'italic';
      selected.style.fontStyle = isItalic ? 'normal' : 'italic';
      italicBtn.classList.toggle('ed-toolbar__btn--active', !isItalic);
      record(selected, 'font-style', isItalic ? 'normal' : 'italic');
    });
  });

  function setTextAlignButtons(align) {
    const norm = align === 'start' ? 'left' : align === 'end' ? 'right' : align;
    textLeftBtn.classList.toggle('ed-toolbar__btn--active', norm === 'left');
    textCenterBtn.classList.toggle('ed-toolbar__btn--active', norm === 'center');
    textRightBtn.classList.toggle('ed-toolbar__btn--active', norm === 'right');
  }

  function applyTextAlign(align) {
    if (!selected) return;
    runWithHistory([selected], () => {
      selected.style.textAlign = align;
      record(selected, 'text-align', align);
      setTextAlignButtons(align);
    });
  }

  textLeftBtn.addEventListener('click', () => applyTextAlign('left'));
  textCenterBtn.addEventListener('click', () => applyTextAlign('center'));
  textRightBtn.addEventListener('click', () => applyTextAlign('right'));

  // ---- Auto-contrast for hero text ----
  autoCb.addEventListener('change', () => {
    if (!selected) return;
    runWithHistory([selected], () => {
      if (autoCb.checked) {
        autoContrastEls.add(selected);
        updateAutoContrast(selected);
      } else {
        autoContrastEls.delete(selected);
      }
    });
  });

  function prepareHeroCanvas() {
    const heroImg = document.querySelector('.hero__photo img');
    if (!heroImg || heroImgLoaded) return;
    heroCanvas = canvas;
    heroCtx = canvas.getContext('2d', { willReadFrequently: true });
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      heroCtx.drawImage(img, 0, 0);
      heroImgLoaded = true;
      // Run initial auto-contrast
      autoContrastEls.forEach(updateAutoContrast);
    };
    img.src = heroImg.src;
  }

  function updateAutoContrast(el) {
    if (!heroImgLoaded || !heroCtx) return;
    const hero = document.querySelector('.hero');
    const heroRect = hero.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    // Map element center to canvas coords
    const cx = ((elRect.left + elRect.width / 2 - heroRect.left) / heroRect.width) * canvas.width;
    const cy = ((elRect.top + elRect.height / 2 - heroRect.top) / heroRect.height) * canvas.height;

    const sampleSize = 20;
    const sx = Math.max(0, Math.floor(cx - sampleSize / 2));
    const sy = Math.max(0, Math.floor(cy - sampleSize / 2));
    const sw = Math.min(sampleSize, canvas.width - sx);
    const sh = Math.min(sampleSize, canvas.height - sy);

    if (sw <= 0 || sh <= 0) return;

    const data = heroCtx.getImageData(sx, sy, sw, sh).data;
    let rSum = 0, gSum = 0, bSum = 0;
    const count = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      rSum += data[i]; gSum += data[i + 1]; bSum += data[i + 2];
    }
    const avgR = rSum / count, avgG = gSum / count, avgB = bSum / count;
    // Also account for green overlay
    const luminance = (0.299 * avgR + 0.587 * avgG + 0.114 * avgB) / 255;

    // Pick contrast color
    const textColor = luminance > 0.45 ? '#1a1a1a' : '#ffffff';
    el.style.color = textColor;
    record(el, 'color', textColor);
    if (el === selected) colorIn.value = textColor;
  }

  // ---- Drag to reposition ----
  function getDragContainer(el) {
    if (!el) return null;
    return el.parentElement || el.offsetParent || document.body;
  }

  function ensureAbsolutePosition(el) {
    if (!el) return;
    if (getComputedStyle(el).position === 'absolute') return;

    const parent = getDragContainer(el);
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const r = el.getBoundingClientRect();

    el.style.position = 'absolute';
    el.style.left = (r.left - parentRect.left) + 'px';
    el.style.top = (r.top - parentRect.top) + 'px';
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }
  }

  function ensureDraggablePosition(el) {
    if (!el) return;
    const pos = getComputedStyle(el).position;
    if (pos === 'static') {
      el.style.position = 'relative';
      if (!el.style.left) el.style.left = '0px';
      if (!el.style.top) el.style.top = '0px';
    }
  }

  dragCb.addEventListener('change', () => {
    if (!selected) return;
    runWithHistory([selected], () => {
      selected.classList.toggle('ed-drag-enabled', dragCb.checked);
      if (dragCb.checked) {
        ensureDraggablePosition(selected);
      }
    });
  });

  function alignSelected(mode) {
    if (!selected) return;

    runWithHistory([selected], () => {
      ensureAbsolutePosition(selected);
      selected.classList.add('ed-drag-enabled');
      dragCb.checked = true;

      const parent = getDragContainer(selected);
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      const r = selected.getBoundingClientRect();

      let left = parseFloat(selected.style.left);
      let top = parseFloat(selected.style.top);
      if (Number.isNaN(left)) left = r.left - parentRect.left;
      if (Number.isNaN(top)) top = r.top - parentRect.top;

      if (mode === 'center') {
        left = parentRect.width * 0.5 - r.width * 0.5;
      } else if (mode === 'left-half') {
        left = parentRect.width * 0.25 - r.width * 0.5;
      } else if (mode === 'right-half') {
        left = parentRect.width * 0.75 - r.width * 0.5;
      } else if (mode === 'middle') {
        top = parentRect.height * 0.5 - r.height * 0.5;
      }

      selected.style.left = left + 'px';
      selected.style.top = top + 'px';
      record(selected, 'position', 'absolute');
      record(selected, 'left', selected.style.left);
      record(selected, 'top', selected.style.top);
      positionToolbar(selected);
    });
  }

  alignCenterBtn.addEventListener('click', () => alignSelected('center'));
  alignLeftHalfBtn.addEventListener('click', () => alignSelected('left-half'));
  alignRightHalfBtn.addEventListener('click', () => alignSelected('right-half'));
  alignMiddleBtn.addEventListener('click', () => alignSelected('middle'));

  document.addEventListener('mousedown', (e) => {
    if (!active) return;
    const el = normalizeEditableTarget(e.target.closest('.ed-drag-enabled') || e.target.closest(TEXT_SELECTOR));
    if (el) {
      if (!el.classList.contains('ed-drag-enabled')) return;
      e.preventDefault();
      startTextDrag(el, e.clientX, e.clientY);
    }
  });
  document.addEventListener('touchstart', (e) => {
    if (!active) return;
    const el = normalizeEditableTarget(e.target.closest('.ed-drag-enabled') || e.target.closest(TEXT_SELECTOR));
    if (el) {
      if (!el.classList.contains('ed-drag-enabled')) return;
      e.preventDefault();
      startTextDrag(el, e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  function startTextDrag(el, cx, cy) {
    ensureDraggablePosition(el);
    const parent = getDragContainer(el);
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const r = el.getBoundingClientRect();

    const parsedLeft = parseFloat(el.style.left);
    const parsedTop = parseFloat(el.style.top);
    const origLeft = Number.isNaN(parsedLeft) ? 0 : parsedLeft;
    const origTop = Number.isNaN(parsedTop) ? 0 : parsedTop;

    dragState = {
      el,
      parent,
      startX: cx, startY: cy,
      origLeft,
      origTop,
      historyStart: beginHistory([el]),
    };
    el.classList.add('ed-dragging');
    document.body.classList.add('ed-no-select');
  }

  document.addEventListener('mousemove', (e) => {
    if (dragState) moveTextDrag(e.clientX, e.clientY);
    if (imgDragState) moveImgDrag(e.clientX, e.clientY);
    if (toolbarDragState) moveToolbarDrag(e.clientX, e.clientY);
  });
  document.addEventListener('touchmove', (e) => {
    if (dragState) { e.preventDefault(); moveTextDrag(e.touches[0].clientX, e.touches[0].clientY); }
    if (imgDragState) { e.preventDefault(); moveImgDrag(e.touches[0].clientX, e.touches[0].clientY); }
    if (toolbarDragState) { e.preventDefault(); moveToolbarDrag(e.touches[0].clientX, e.touches[0].clientY); }
  }, { passive: false });
  document.addEventListener('mouseup', endAllDrags);
  document.addEventListener('touchend', endAllDrags);

  function moveTextDrag(cx, cy) {
    if (!dragState) return;
    const dx = cx - dragState.startX;
    const dy = cy - dragState.startY;
    const nextLeft = dragState.origLeft + dx;
    const nextTop = dragState.origTop + dy;
    dragState.el.style.left = nextLeft + 'px';
    dragState.el.style.top = nextTop + 'px';

    // Update auto-contrast if applicable
    if (autoContrastEls.has(dragState.el)) {
      updateAutoContrast(dragState.el);
    }
  }

  function endAllDrags() {
    if (dragState) {
      const el = dragState.el;
      el.classList.remove('ed-dragging');
      record(el, 'position', el.style.position || getComputedStyle(el).position);
      record(el, 'left', el.style.left);
      record(el, 'top', el.style.top);
      endHistory(dragState.historyStart);
      // Reposition toolbar
      if (el === selected) positionToolbar(el);
    }
    dragState = null;

    if (imgDragState) {
      const { img, handle, container, historyStart } = imgDragState;
      handle.classList.remove('ed-img-handle--active');
      record(img, 'height', img.style.height);
      record(img, 'min-height', '0');
      if (img.style.transform) {
        record(img, 'transform', img.style.transform);
      }
      if (img.style.objectPosition) {
        record(img, 'object-position', img.style.objectPosition);
      }
      if (container && container.style.height) {
        record(container, 'height', container.style.height);
        record(container, 'overflow', 'hidden');
      }
      endHistory(historyStart);
    }
    imgDragState = null;

    if (toolbarDragState) {
      toolbar.classList.remove('ed-toolbar--dragging');
      toolbarManualPos = {
        left: parseFloat(toolbar.style.left) || 4,
        top: parseFloat(toolbar.style.top) || (window.scrollY + 4),
      };
    }
    toolbarDragState = null;

    if (!dragState && !imgDragState && !toolbarDragState) {
      document.body.classList.remove('ed-no-select');
    }
  }

  // ---- Tagline resize handles ----
  let taglineResizer = null;

  function addTaglineResize(tagline) {
    removeTaglineResize();
    taglineResizer = document.createElement('div');
    taglineResizer.className = 'ed-tagline-resize';
    // East handle (width)
    const eHandle = document.createElement('div');
    eHandle.className = 'ed-tagline-resize__handle ed-tagline-resize__handle--e';
    taglineResizer.appendChild(eHandle);
    // Keep existing absolute positioning if the tagline was dragged.
    if (getComputedStyle(tagline).position === 'static') {
      tagline.style.position = 'relative';
    }
    tagline.appendChild(taglineResizer);

    let resizing = false, startX = 0, startW = 0;
    let resizeHistoryStart = null;

    function onDown(e) {
      e.preventDefault(); e.stopPropagation();
      resizing = true;
      resizeHistoryStart = beginHistory([tagline]);
      startX = e.clientX || e.touches[0].clientX;
      startW = tagline.offsetWidth;
    }
    eHandle.addEventListener('mousedown', onDown);
    eHandle.addEventListener('touchstart', onDown, { passive: false });

    const onMove = (e) => {
      if (!resizing) return;
      const cx = e.clientX || (e.touches && e.touches[0].clientX);
      if (cx == null) return;
      const dx = cx - startX;
      const newW = Math.max(120, startW + dx);
      tagline.style.maxWidth = newW + 'px';
      tagline.style.width = newW + 'px';
      record(tagline, 'max-width', newW + 'px');
      record(tagline, 'width', newW + 'px');
    };
    const onUp = () => {
      if (!resizing) return;
      resizing = false;
      endHistory(resizeHistoryStart);
      resizeHistoryStart = null;
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
  }

  function removeTaglineResize() {
    if (taglineResizer && taglineResizer.parentElement) {
      taglineResizer.parentElement.removeChild(taglineResizer);
    }
    taglineResizer = null;
  }

  // ---- Image crop handles ----
  function addImageHandles() {
    document.querySelectorAll('[data-ed-img]').forEach((img) => {
      const wrapper = img.parentElement;
      wrapper.style.position = 'relative';
      wrapper.style.overflow = 'hidden';

      if (!img.dataset.baseH) img.dataset.baseH = String(img.offsetHeight);
      if (!img.dataset.cropH) img.dataset.cropH = String(img.offsetHeight);
      if (!img.dataset.cropOffsetY) img.dataset.cropOffsetY = '0';
      if (!img.dataset.cropScale) img.dataset.cropScale = '1';

      // Top handle
      const topH = document.createElement('div');
      topH.className = 'ed-img-handle ed-img-handle--top';
      topH.dataset.edge = 'top';
      topH.dataset.for = img.dataset.edImg;
      wrapper.appendChild(topH);

      // Bottom handle
      const botH = document.createElement('div');
      botH.className = 'ed-img-handle ed-img-handle--bottom';
      botH.dataset.edge = 'bottom';
      botH.dataset.for = img.dataset.edImg;
      wrapper.appendChild(botH);

      // Center move handle (reposition visible crop area)
      const moveH = document.createElement('div');
      moveH.className = 'ed-img-handle ed-img-handle--move';
      moveH.dataset.edge = 'move';
      moveH.dataset.for = img.dataset.edImg;
      moveH.title = 'Move visible crop area';
      wrapper.appendChild(moveH);

      // Zoom handle (drag up/down to zoom)
      const zoomH = document.createElement('div');
      zoomH.className = 'ed-img-handle ed-img-handle--zoom';
      zoomH.dataset.edge = 'zoom';
      zoomH.dataset.for = img.dataset.edImg;
      zoomH.title = 'Zoom image';
      wrapper.appendChild(zoomH);

      // Drag events
      [topH, botH, moveH, zoomH].forEach((handle) => {
        handle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          startImgDrag(handle, img, wrapper, e.clientX, e.clientY);
        });
        handle.addEventListener('touchstart', (e) => {
          e.preventDefault();
          startImgDrag(handle, img, wrapper, e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
      });
    });
  }

  function removeAllImageHandles() {
    document.querySelectorAll('.ed-img-handle').forEach((h) => h.remove());
  }

  function parseObjectPosition(pos) {
    const parts = (pos || '50% 50%').trim().split(/\s+/);
    const toPercent = (v) => {
      if (!v) return 50;
      if (v.endsWith('%')) return parseFloat(v);
      if (v === 'left' || v === 'top') return 0;
      if (v === 'right' || v === 'bottom') return 100;
      if (v === 'center') return 50;
      const n = parseFloat(v);
      return Number.isNaN(n) ? 50 : n;
    };
    const x = toPercent(parts[0] || '50%');
    const y = toPercent(parts[1] || '50%');
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  }

  function applyImageCropState(img, wrapper, syncRow = false) {
    const baseH = parseFloat(img.dataset.baseH || img.offsetHeight) || img.offsetHeight;
    const cropH = Math.max(80, parseFloat(img.dataset.cropH || img.offsetHeight) || img.offsetHeight);
    const scale = Math.max(0.6, Math.min(3, parseFloat(img.dataset.cropScale || '1') || 1));
    const imgH = Math.max(baseH, cropH);
    const scaledH = imgH * scale;
    let offsetY = parseFloat(img.dataset.cropOffsetY || '0') || 0;

    const minOffset = Math.min(0, cropH - scaledH);
    offsetY = Math.max(minOffset, Math.min(0, offsetY));

    img.dataset.cropH = String(cropH);
    img.dataset.cropOffsetY = String(offsetY);
    img.dataset.cropScale = String(scale);

    wrapper.style.height = cropH + 'px';
    wrapper.style.overflow = 'hidden';
    img.style.minHeight = '0';
    img.style.height = imgH + 'px';
    img.style.transform = 'translateY(' + offsetY + 'px) scale(' + scale + ')';
    img.style.transformOrigin = '50% 50%';

    if (syncRow) syncRowHeight(img, cropH);
  }

  function getImageHistoryElements(img, wrapper) {
    const elements = [img, wrapper];
    const row = img.closest('.bios__row, .event__row');
    if (row) elements.push(row);
    const textPanel = row ? row.querySelector('.bios__text, .event__details') : null;
    if (textPanel) elements.push(textPanel);
    return elements;
  }

  function startImgDrag(handle, img, wrapper, startX, startY) {
    const edge = handle.dataset.edge;
    const currentH = parseFloat(img.dataset.cropH || wrapper.offsetHeight || img.offsetHeight);
    const currentW = img.offsetWidth;
    const cs = getComputedStyle(img);
    const objPos = parseObjectPosition(cs.objectPosition);
    const currentOffsetY = parseFloat(img.dataset.cropOffsetY || '0') || 0;
    const currentScale = Math.max(0.6, Math.min(3, parseFloat(img.dataset.cropScale || '1') || 1));

    imgDragState = {
      handle, img, container: wrapper, edge, startX, startY,
      origWidth: currentW,
      origHeight: currentH,
      origXPos: objPos.x,
      origYPos: objPos.y,
      origOffsetY: currentOffsetY,
      origScale: currentScale,
      historyStart: beginHistory(getImageHistoryElements(img, wrapper)),
    };
    handle.classList.add('ed-img-handle--active');
  }

  function moveImgDrag(clientX, clientY) {
    if (!imgDragState) return;
    const { edge, startX, startY, origWidth, origHeight, origXPos, origYPos, origOffsetY, origScale, img, container } = imgDragState;
    const dx = clientX - startX;
    const dy = clientY - startY;

    if (edge === 'top' || edge === 'bottom') {
      // True crop: change viewport height (wrapper), keep image larger and clipped.
      const newH = Math.max(80, edge === 'bottom' ? origHeight + dy : origHeight - dy);
      img.dataset.cropH = String(newH);
      if (edge === 'top') {
        // Trim from top by moving image up as viewport shrinks.
        img.dataset.cropOffsetY = String(origOffsetY - dy);
      }
      applyImageCropState(img, container, true);
      return;
    }

    if (edge === 'move') {
      // Reposition crop framing: horizontal via object-position, vertical via translateY.
      const shiftX = origWidth > 0 ? (dx / origWidth) * 100 : 0;
      const newXPos = Math.max(0, Math.min(100, origXPos + shiftX));
      img.style.objectPosition = newXPos + '% ' + origYPos + '%';
      img.dataset.cropOffsetY = String(origOffsetY + dy);
      applyImageCropState(img, container, false);
      return;
    }

    if (edge === 'zoom') {
      // Drag up to zoom in, down to zoom out.
      const newScale = Math.max(0.6, Math.min(3, origScale - dy * 0.004));
      img.dataset.cropScale = String(newScale);
      applyImageCropState(img, container, false);
    }
  }

  function syncRowHeight(img, newH) {
    const row = img.closest('.bios__row, .event__row');
    if (!row) return;

    row.style.minHeight = '0';
    row.style.height = newH + 'px';
    record(row, 'min-height', '0');
    record(row, 'height', newH + 'px');

    const textPanel = row.querySelector('.bios__text, .event__details');
    if (textPanel) {
      textPanel.style.minHeight = '0';
      textPanel.style.height = '100%';
      textPanel.style.overflow = 'auto';
      record(textPanel, 'min-height', '0');
      record(textPanel, 'height', '100%');
      record(textPanel, 'overflow', 'auto');
    }
  }

  // ---- Record changes for CSS export ----
  function record(el, prop, value) {
    if (!changes.has(el)) changes.set(el, {});
    changes.get(el)[prop] = value;
  }

  function getClassSelector(el) {
    if (!el.classList || el.classList.length === 0) return '';
    return Array.from(el.classList)
      .filter((c) => !c.startsWith('ed-') && c !== 'animate-on-scroll' && c !== 'is-visible')
      .map((c) => '.' + c)
      .join('');
  }

  function isUniqueSelector(selector, el) {
    if (!selector) return false;
    try {
      const matches = document.querySelectorAll(selector);
      return matches.length === 1 && matches[0] === el;
    } catch (_) {
      return false;
    }
  }

  function escapeCssIdent(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') {
      return window.CSS.escape(value);
    }
    return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function getSelector(el) {
    if (el.id) {
      const idSel = '#' + escapeCssIdent(el.id);
      if (isUniqueSelector(idSel, el)) return idSel;
    }

    const cls = getClassSelector(el);
    if (cls && isUniqueSelector(cls, el)) return cls;

    const tag = el.tagName.toLowerCase();
    const parent = el.parentElement;
    if (!parent) {
      return cls ? tag + cls : tag;
    }

    // Structural selector to keep edits scoped to the specific element.
    const parentSel = getSelector(parent);
    const idx = Array.from(parent.children).indexOf(el) + 1;
    const candidateWithClass = parentSel + ' > ' + tag + cls + ':nth-child(' + idx + ')';
    if (cls && isUniqueSelector(candidateWithClass, el)) return candidateWithClass;
    return parentSel + ' > ' + tag + ':nth-child(' + idx + ')';
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();

      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (err) {
        document.body.removeChild(ta);
        reject(err);
        return;
      }
      document.body.removeChild(ta);

      if (ok) {
        resolve();
      } else {
        reject(new Error('Clipboard copy failed'));
      }
    });
  }

  function buildChangesCss(includeNoChangesNote = true) {
    let css = '/* === Kalyanam Visual Editor Export ===\n   Paste into css/style.css to apply. === */\n\n';

    changes.forEach((props, el) => {
      const sel = getSelector(el);
      css += sel + ' {\n';
      Object.entries(props).forEach(([p, v]) => {
        css += '  ' + p + ': ' + v + ';\n';
      });
      css += '}\n\n';
    });

    if (includeNoChangesNote && !css.includes('{')) {
      css += '/* No changes recorded yet. Select and modify elements first. */\n';
    }
    return css;
  }

  async function getBaseCssText() {
    const link = document.querySelector('link[href*="css/style.css"]');
    if (link) {
      try {
        const res = await fetch(link.href, { cache: 'no-store' });
        if (res.ok) return await res.text();
      } catch (_) {
        // fall through to stylesheet rules fallback
      }
    }

    try {
      const sheets = Array.from(document.styleSheets);
      const sheet = sheets.find((s) => s.href && s.href.includes('css/style.css'));
      if (sheet && sheet.cssRules) {
        return Array.from(sheet.cssRules).map((r) => r.cssText).join('\n');
      }
    } catch (_) {
      // unavailable due browser restrictions
    }

    throw new Error('Unable to load base css file');
  }

  // ---- Copy All CSS ----
  copyBtn.addEventListener('click', () => {
    const css = buildChangesCss(true);
    copyToClipboard(css).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy All CSS'; }, 2000);
    }).catch(() => {
      copyBtn.textContent = 'Copy failed';
      setTimeout(() => { copyBtn.textContent = 'Copy All CSS'; }, 2000);
    });
  });

  // ---- Copy Full CSS (base file + editor changes) ----
  copyFullBtn.addEventListener('click', async () => {
    const deltaCss = buildChangesCss(false);
    const hasChanges = changes.size > 0;
    try {
      const baseCss = await getBaseCssText();
      const fullCss = hasChanges
        ? baseCss.trimEnd() + '\n\n' + deltaCss
        : baseCss;
      await copyToClipboard(fullCss);
      copyFullBtn.textContent = 'Copied!';
      setTimeout(() => { copyFullBtn.textContent = 'Copy Full CSS'; }, 2000);
    } catch (_) {
      // Fallback to changes-only if base stylesheet cannot be read.
      const fallbackCss = buildChangesCss(true);
      copyToClipboard(fallbackCss).then(() => {
        copyFullBtn.textContent = 'Copied (changes)';
        setTimeout(() => { copyFullBtn.textContent = 'Copy Full CSS'; }, 2000);
      }).catch(() => {
        copyFullBtn.textContent = 'Copy failed';
        setTimeout(() => { copyFullBtn.textContent = 'Copy Full CSS'; }, 2000);
      });
    }
  });

  // ---- Helpers ----
  function rgbToHex(rgb) {
    const m = rgb.match(/(\d+)/g);
    if (!m || m.length < 3) return '#ffffff';
    return '#' + m.slice(0, 3).map((v) => parseInt(v).toString(16).padStart(2, '0')).join('');
  }
})();
