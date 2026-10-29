/* Static preview helper: step through multi-page Gravity Forms in the browser
   and block real submissions, since there is no WordPress server behind this preview. */
(function () {
  function toast(msg) {
    var t = document.getElementById('gnr-preview-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'gnr-preview-toast';
      t.setAttribute('role', 'status');
      t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;max-width:calc(100% - 32px);' +
        'background:#a00000;color:#fff;padding:14px 20px;border-radius:6px;font:500 15px/1.4 Mulish,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.4);text-align:center';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.display = 'block';
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.style.display = 'none'; }, 5000);
  }

  // Pages hidden by Gravity Forms conditional logic (e.g. models for brands not chosen)
  function isSkipped(p) { return p.getAttribute('data-conditional-logic') === 'hidden'; }

  function currentPage(pages) {
    var cur = pages.findIndex(function (p) { return p.style.display !== 'none' && getComputedStyle(p).display !== 'none'; });
    return cur < 0 ? 0 : cur;
  }

  function syncSteps(form, active) {
    var pages = [].slice.call(form.querySelectorAll('.gform_page'));
    if (!pages.length) return;
    if (active === undefined) active = currentPage(pages);
    var steps = [].slice.call(form.parentNode.querySelectorAll('.gf_step'));
    var n = 0;
    steps.forEach(function (s, i) {
      var skip = pages[i] && isSkipped(pages[i]);
      s.classList.toggle('gf_step_hidden', !!skip);
      s.style.display = skip ? 'none' : '';
      if (!skip) { n++; var num = s.querySelector('.gf_step_number'); if (num) num.textContent = n; }
      s.classList.toggle('gf_step_active', i === active);
      s.classList.toggle('gf_step_completed', i < active);
      s.classList.toggle('gf_step_pending', i > active);
    });
  }

  function goToPage(form, dir) {
    var pages = [].slice.call(form.querySelectorAll('.gform_page'));
    var cur = currentPage(pages);
    var next = cur + dir;
    while (next > 0 && next < pages.length - 1 && isSkipped(pages[next])) next += dir;
    next = Math.max(0, Math.min(pages.length - 1, next));
    if (isSkipped(pages[next])) next = cur;
    pages.forEach(function (p, i) { p.style.display = i === next ? '' : 'none'; });
    syncSteps(form, next);
    var bar = form.parentNode.querySelector('.gf_progressbar_percentage');
    if (bar && pages.length) {
      var pct = Math.round(((next + 1) / pages.length) * 100);
      bar.style.width = pct + '%';
      var sp = bar.querySelector('span'); if (sp) sp.textContent = pct + '%';
    }
    var top = form.closest('.gform_wrapper') || form;
    window.scrollTo({ top: top.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.gform_next_button, .gform_previous_button, .gform_button, [data-submission-type]');
    if (!b) return;
    var form = b.closest('form');
    if (!form) return;
    var type = b.getAttribute('data-submission-type') || (b.classList.contains('gform_previous_button') ? 'previous' : b.classList.contains('gform_next_button') ? 'next' : 'submit');
    e.preventDefault();
    e.stopImmediatePropagation();
    if (type === 'next') goToPage(form, 1);
    else if (type === 'previous') goToPage(form, -1);
    else toast('Preview only: form submissions are turned off on this preview site.');
  }, true);

  function syncAll() {
    [].forEach.call(document.querySelectorAll('form[id^="gform_"]'), function (f) { syncSteps(f); });
  }
  document.addEventListener('change', function () { setTimeout(syncAll, 50); });
  window.addEventListener('load', function () { setTimeout(syncAll, 300); });

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.classList && f.classList.contains('search-form-popup')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    toast('Preview only: form submissions are turned off on this preview site.');
  }, true);
})();
