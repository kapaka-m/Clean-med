(function () {
  'use strict';
  const { conditions, groups, samples, version } = CleanMedKnowledge;
  const engine = CleanMedEngine.createEngine(conditions);
  const $ = (id) => document.getElementById(id);
  const escape = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
    );
  const paths = {
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    book: '<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Z"/><path d="M12 5v15"/>',
    layers: '<path d="m12 3 10 5-10 5L2 8l10-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    sparkles:
      '<path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3ZM20 2v4M18 4h4"/>',
    'arrow-right': '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
    shield: '<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    moon: '<path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    flask: '<path d="M9 3h6m-5 0v6l-6 9a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-9V3M7 14h10"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.01"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
    crosshair:
      '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    heart:
      '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    'git-branch':
      '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M6 7v10m0-4h6a6 6 0 0 0 6-6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    x: '<path d="m6 6 12 12M6 18 18 6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  };
  const icon = (name) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.activity}</svg>`;
  document.querySelectorAll('[data-icon]').forEach((element) => {
    element.innerHTML = icon(element.dataset.icon);
  });

  const state = {
    selected: new Set(),
    category: 'All',
    results: null,
    showAll: false,
    view: 'assessment',
  };
  let toastTimer;
  function announce(message) {
    $('announcement').textContent = message;
  }
  function toast(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').hidden = false;
    toastTimer = setTimeout(() => {
      $('toast').hidden = true;
    }, 3200);
  }
  function renderFilters() {
    $('symptomFilters').innerHTML = ['All', ...Object.keys(groups)]
      .map(
        (category) =>
          `<button class="filter-button${state.category === category ? ' active' : ''}" data-category="${category}" aria-pressed="${state.category === category}">${category === 'All' ? 'All symptoms' : category}</button>`,
      )
      .join('');
  }
  function renderSymptoms() {
    const query = $('symptomSearch').value.trim().toLowerCase();
    const visible = engine.symptoms.filter(
      (symptom) =>
        (state.category === 'All' || groups[state.category].includes(symptom)) &&
        symptom.toLowerCase().includes(query),
    );
    $('symptomGrid').innerHTML = visible
      .map(
        (symptom) =>
          `<label class="symptom-option"><input type="checkbox" value="${escape(symptom)}"${state.selected.has(symptom) ? ' checked' : ''}><span>${escape(symptom)}</span></label>`,
      )
      .join('');
    $('symptomGrid').hidden = !visible.length;
    $('noSymptoms').hidden = !!visible.length;
    $('visibleCount').textContent = `${visible.length} available`;
    $('symptomListLabel').textContent =
      state.category === 'All' ? 'ALL SYMPTOMS' : state.category.toUpperCase();
  }
  function invalidateResults() {
    const hadResults = state.results !== null;
    state.results = null;
    state.showAll = false;
    $('resultsContent').hidden = true;
    $('emptyResults').hidden = false;
    $('resultStatus').classList.remove('is-complete');
    $('resultStatus').innerHTML =
      `<span></span>${hadResults ? 'Selection updated' : 'Ready when you are'}`;
    $('verificationResult').hidden = true;
  }
  function updateSelection({ rerender = true } = {}) {
    invalidateResults();
    const count = state.selected.size;
    $('selectionCount').textContent = `${count} selected`;
    $('trayCount').textContent = count;
    $('runAssessment').disabled = !count;
    $('clearSelection').disabled = !count;
    $('actionHint').textContent = count
      ? `${count} symptom${count === 1 ? '' : 's'} selected · Ready to explore`
      : 'Select at least one symptom to begin';
    $('selectedChips').innerHTML = count
      ? [...state.selected]
          .map(
            (symptom) =>
              `<span class="selected-chip">${escape(symptom)}<button type="button" data-remove="${escape(symptom)}" aria-label="Remove ${escape(symptom)}">${icon('x')}</button></span>`,
          )
          .join('')
      : '<span class="selection-placeholder">Your selected symptoms will appear here.</span>';
    if (rerender) renderSymptoms();
    announce(
      `${count} symptoms selected. ${count ? 'Explore matches to refresh the results.' : 'Selection cleared.'}`,
    );
  }
  function chipList(symptoms, matched = false) {
    return symptoms.length
      ? symptoms
          .map(
            (symptom) =>
              `<span class="evidence-chip${matched ? ' matched' : ''}">${escape(symptom)}</span>`,
          )
          .join('')
      : '<span class="evidence-chip">None</span>';
  }
  function evidence(result) {
    return `<div class="evidence-body"><div class="evidence-label">${icon('check')}Selected from this rule · ${result.matched.length}</div><div class="evidence-chips">${chipList(result.matched, true)}</div><div class="evidence-label">${icon('plus')}Not selected · ${result.missing.length}</div><div class="evidence-chips">${chipList(result.missing)}</div>${result.additional.length ? `<div class="evidence-label">${icon('layers')}Selected outside this rule · ${result.additional.length}</div><div class="evidence-chips">${chipList(result.additional)}</div>` : ''}<p class="evidence-footnote">${result.matched.length} ÷ ${result.symptoms.length} × 100 = ${result.score}% coverage. Unselected does not mean absent.${result.additional.length ? ' Additional symptoms do not change this score.' : ''}</p></div>`;
  }
  function renderResults() {
    const results = state.results;
    if (!results || !results.length) return;
    const best = results[0];
    const ties = results.filter(
      (item) => item.score === best.score && item.matched.length === best.matched.length,
    ).length;
    $('emptyResults').hidden = true;
    $('resultsContent').hidden = false;
    $('resultStatus').classList.add('is-complete');
    $('resultStatus').innerHTML = '<span></span>Assessment complete';
    $('resultsSummary').textContent =
      `${state.selected.size} symptoms explored · ${results.length} related conditions`;
    const complete = results.filter((result) => result.complete);
    $('ruleSummary').innerHTML = complete.length
      ? `<div class="rule-notice">${icon('check')} ${complete.length} complete rule match${complete.length > 1 ? 'es' : ''}: ${complete.map((result) => escape(result.name)).join(', ')}</div>`
      : '';
    $('topResult').innerHTML =
      `<article class="top-match"><div class="top-match-header"><div><div class="match-label">${ties > 1 ? `JOINT HIGHEST COVERAGE · ${ties} RULES TIED` : 'HIGHEST RULE COVERAGE'}</div><h3>${escape(best.name)}</h3><span class="category">${escape(best.category)} / Rule ${String(conditions.findIndex((item) => item.id === best.id) + 1).padStart(2, '0')}</span></div><div class="score-ring" style="--score:${best.score}" aria-label="${best.score}% rule coverage"><strong>${best.score}%</strong><span>match</span></div></div><p class="top-match-description">${escape(best.description)}</p><div class="coverage-label"><span>Symptom coverage</span><strong>${best.matched.length} of ${best.symptoms.length} selected</strong></div><div class="coverage-track" style="--score:${best.score}"></div><details class="evidence-details" open><summary>See the reasoning ${icon('chevron-down')}</summary>${evidence(best)}</details></article>`;
    const others = state.showAll ? results.slice(1) : results.slice(1, 4);
    $('rankedResults').innerHTML = others
      .map(
        (result, index) =>
          `<details class="ranked-row"><summary><span class="rank-number">${String(index + 2).padStart(2, '0')}</span><span class="ranked-name">${escape(result.name)}<small>${result.matched.length} of ${result.symptoms.length} rule symptoms selected</small></span><span class="rank-score">${result.score}%</span>${icon('chevron-down')}</summary>${evidence(result)}</details>`,
      )
      .join('');
    $('showAllResults').hidden = results.length <= 4;
    $('showAllResults').textContent = state.showAll ? 'Show fewer' : `View all ${results.length}`;
    document.querySelector('.ranked-heading').hidden = results.length <= 1;
  }
  function runAssessment() {
    if (!state.selected.size) return;
    state.results = engine.assess([...state.selected]);
    state.showAll = false;
    renderResults();
    announce(
      `Assessment complete. ${state.results.length} related conditions. Highest rule coverage: ${state.results[0].score} percent. This is not a diagnosis.`,
    );
    if (window.matchMedia('(max-width:1000px)').matches)
      $('resultsHeading').scrollIntoView({ block: 'start' });
  }
  function renderLibrary() {
    const query = $('knowledgeSearch').value.trim().toLowerCase();
    const filtered = conditions.filter((condition) =>
      [condition.name, condition.category, ...condition.symptoms].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
    $('libraryCount').textContent =
      `${filtered.length} condition${filtered.length === 1 ? '' : 's'}`;
    $('libraryGrid').innerHTML = filtered.length
      ? filtered
          .map(
            (condition) =>
              `<article class="panel library-card"><div class="library-card-top"><span class="category-pill">${escape(condition.category)}</span><span class="rule-id">RULE ${String(conditions.indexOf(condition) + 1).padStart(2, '0')}</span></div><h2>${escape(condition.name)}</h2><p>${escape(condition.description)}</p><div class="evidence-label">${condition.symptoms.length} REQUIRED SYMPTOMS</div><div class="evidence-chips">${chipList(condition.symptoms)}</div><button class="text-link" data-explore="${condition.id}">Explore this rule${icon('arrow-right')}</button></article>`,
          )
          .join('')
      : '<div class="panel library-empty">No matching conditions. Try a different name or symptom.</div>';
  }
  function closeMenu(returnFocus = false) {
    $('sidebar').classList.remove('is-open');
    $('mobileScrim').hidden = true;
    $('menuToggle').setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    if (returnFocus) $('menuToggle').focus();
  }
  function setView(view, { focus = true } = {}) {
    const labels = {
      assessment: 'Symptom assessment',
      knowledge: 'Knowledge library',
      method: 'How it works',
    };
    if (!labels[view]) return;
    state.view = view;
    Object.keys(labels).forEach((key) => {
      $(`${key}View`).hidden = key !== view;
    });
    document.querySelectorAll('[data-view]').forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    $('breadcrumbCurrent').textContent = labels[view];
    document.title = `${labels[view]} — Clean Med`;
    if (location.hash !== `#${view}`) history.replaceState(null, '', `#${view}`);
    closeMenu();
    if (focus) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      $('main').focus({ preventScroll: true });
    }
  }
  function closeSamples(returnFocus = false) {
    $('sampleMenu').hidden = true;
    $('sampleToggle').setAttribute('aria-expanded', 'false');
    if (returnFocus) $('sampleToggle').focus();
  }
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const isDark = theme === 'dark';
    $('themeToggle').innerHTML = icon(isDark ? 'sun' : 'moon');
    $('themeToggle').setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
    document.querySelector('meta[name="theme-color"]').content = isDark ? '#111e1c' : '#103e3b';
  }

  $('symptomFilters').addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    state.category = button.dataset.category;
    // Preserve focus when replacing filter controls for keyboard users.
    renderFilters();
    $('symptomFilters').querySelector(`[data-category="${state.category}"]`).focus();
    renderSymptoms();
    announce(
      `${$('visibleCount').textContent} in ${state.category === 'All' ? 'all categories' : state.category}.`,
    );
  });
  $('symptomSearch').addEventListener('input', renderSymptoms);
  $('symptomGrid').addEventListener('change', (event) => {
    if (!event.target.matches('input[type="checkbox"]')) return;
    const input = event.target;
    if (input.checked) state.selected.add(input.value);
    else state.selected.delete(input.value);
    updateSelection({ rerender: false });
  });
  $('selectedChips').addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    const nextChip =
      button.closest('.selected-chip').nextElementSibling ||
      button.closest('.selected-chip').previousElementSibling;
    const nextSymptom = nextChip?.querySelector('button')?.dataset.remove;
    state.selected.delete(button.dataset.remove);
    updateSelection();
    const nextButton = [...$('selectedChips').querySelectorAll('button')].find(
      (item) => item.dataset.remove === nextSymptom,
    );
    (nextButton || $('symptomSearch')).focus();
  });
  $('clearSelection').addEventListener('click', () => {
    state.selected.clear();
    updateSelection();
    $('symptomSearch').focus();
  });
  $('resetFilters').addEventListener('click', () => {
    state.category = 'All';
    $('symptomSearch').value = '';
    renderFilters();
    renderSymptoms();
    $('symptomSearch').focus();
  });
  $('runAssessment').addEventListener('click', runAssessment);
  $('showAllResults').addEventListener('click', () => {
    state.showAll = !state.showAll;
    // Only replace the list: retain disclosure state in the highest match.
    const topOpen = $('topResult').querySelector('details').open;
    renderResults();
    $('topResult').querySelector('details').open = topOpen;
    $('showAllResults').focus();
  });
  $('verifyCondition').addEventListener('click', () => {
    if (!state.selected.size) {
      toast('Choose at least one symptom before verifying a rule.');
      $('symptomSearch').focus();
      return;
    }
    const result = engine.verify($('conditionSelect').value, [...state.selected]);
    $('verificationResult').innerHTML =
      `<div class="verification-summary"><h3>${escape(result.name)}</h3><span class="verification-score">${result.score}% coverage</span><span class="small-label">${result.complete ? 'Complete rule match' : result.matched.length ? 'Partial rule match' : 'No matching symptoms'}</span></div>${evidence(result)}`;
    $('verificationResult').hidden = false;
    announce(
      `${result.name}: ${result.score} percent coverage. ${result.matched.length} selected and ${result.missing.length} not selected.`,
    );
  });
  $('conditionSelect').addEventListener('change', () => {
    $('verificationResult').hidden = true;
  });
  $('exportReport').addEventListener('click', () => {
    if (!state.results) return;
    const report = {
      application: 'Clean Med',
      schemaVersion: '1.0.0',
      knowledgeVersion: version,
      generatedAt: new Date().toISOString(),
      purpose: 'Educational demonstration. Not a medical diagnosis or probability estimate.',
      scoring:
        'round(selected rule symptoms / total rule symptoms * 100). Equal weights. Additional symptoms do not reduce coverage.',
      selectedSymptoms: [...state.selected],
      results: state.results.map(({ id, name, score, matched, missing, additional, complete }) => ({
        id,
        name,
        coveragePercent: score,
        matchedSymptoms: matched,
        unselectedSymptoms: missing,
        additionalSymptoms: additional,
        completeRuleMatch: complete,
      })),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `clean-med-assessment-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Assessment exported to your device.');
  });
  $('knowledgeSearch').addEventListener('input', renderLibrary);
  $('libraryGrid').addEventListener('click', (event) => {
    const button = event.target.closest('[data-explore]');
    if (!button) return;
    const condition = conditions.find((item) => item.id === button.dataset.explore);
    state.selected = new Set(condition.symptoms);
    state.category = 'All';
    $('symptomSearch').value = '';
    $('conditionSelect').value = condition.id;
    renderFilters();
    updateSelection();
    setView('assessment');
    runAssessment();
    toast(`Loaded all symptoms from the ${condition.name} rule.`);
  });
  document
    .querySelectorAll('[data-view], [data-go]')
    .forEach((button) =>
      button.addEventListener('click', () => setView(button.dataset.view || button.dataset.go)),
    );
  window.addEventListener('hashchange', () => setView(location.hash.slice(1) || 'assessment'));
  $('sampleOptions').innerHTML = samples
    .map(
      (sample) =>
        `<button class="sample-option" data-sample="${sample.id}"><span>${icon(sample.id === 'headache' ? 'sparkles' : sample.id === 'digestive' ? 'layers' : 'activity')}</span><span><strong>${escape(sample.name)}</strong><small>${escape(sample.description)}</small></span></button>`,
    )
    .join('');
  $('sampleToggle').addEventListener('click', () => {
    const shouldOpen = $('sampleMenu').hidden;
    $('sampleMenu').hidden = !shouldOpen;
    $('sampleToggle').setAttribute('aria-expanded', String(shouldOpen));
    if (shouldOpen) $('sampleOptions').querySelector('button').focus();
  });
  $('sampleOptions').addEventListener('click', (event) => {
    const button = event.target.closest('[data-sample]');
    if (!button) return;
    const sample = samples.find((item) => item.id === button.dataset.sample);
    state.selected = new Set(sample.symptoms);
    state.category = 'All';
    $('symptomSearch').value = '';
    renderFilters();
    updateSelection();
    closeSamples(true);
    runAssessment();
    toast(`Fictional sample loaded: ${sample.name.toLowerCase()}.`);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.sample-container')) closeSamples();
  });
  document.addEventListener('focusin', (event) => {
    if (!$('sampleMenu').hidden && !event.target.closest('.sample-container')) closeSamples();
  });
  $('themeToggle').addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(theme);
    try {
      localStorage.setItem('clean-med-theme', theme);
    } catch {
      /* Storage may be disabled. */
    }
  });
  $('menuToggle').addEventListener('click', () => {
    const open = !$('sidebar').classList.contains('is-open');
    $('sidebar').classList.toggle('is-open', open);
    $('mobileScrim').hidden = !open;
    $('menuToggle').setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    if (open) $('sidebar').querySelector('.nav-item.active').focus();
  });
  $('mobileScrim').addEventListener('click', () => closeMenu(true));
  window.matchMedia('(max-width:760px)').addEventListener('change', () => closeMenu());
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!$('sampleMenu').hidden) closeSamples(true);
      if ($('sidebar').classList.contains('is-open')) closeMenu(true);
    }
    if (
      event.key === '/' &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) &&
      !event.target.isContentEditable
    ) {
      event.preventDefault();
      if (state.view === 'method') setView('assessment');
      $(state.view === 'knowledge' ? 'knowledgeSearch' : 'symptomSearch').focus();
    }
    if (event.key === 'Tab' && $('sidebar').classList.contains('is-open')) {
      const focusable = [...$('sidebar').querySelectorAll('a,button')];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (
        event.shiftKey &&
        (document.activeElement === first || !$('sidebar').contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  $('conditionSelect').innerHTML = conditions
    .map((condition) => `<option value="${condition.id}">${escape(condition.name)}</option>`)
    .join('');
  renderFilters();
  renderSymptoms();
  renderLibrary();
  let initialTheme = 'light';
  try {
    initialTheme = localStorage.getItem('clean-med-theme') === 'dark' ? 'dark' : 'light';
  } catch {
    /* File and private contexts still work. */
  }
  setTheme(initialTheme);
  setView(location.hash.slice(1) || 'assessment', { focus: false });
})();
