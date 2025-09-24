/* publications.js — loads data/publications.bib, parses with bibtexParse, renders 3 buckets */

(function(){
  const $ = (s, r=document)=>r.querySelector(s);

  function escapeHtml(str){return String(str||'').replace(/[&<>\"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]))}
  function chip(text){return `<span class="chip">${escapeHtml(text)}</span>`}
  function copyBtn(bib){ if(!bib) return ''; const enc=btoa(unescape(encodeURIComponent(bib))); return `<button class="btn" data-bib="${enc}">Copy BibTeX</button>`}

  function toBib(entry){
    if(!entry || !entry.entryType) return '';
    const tags = entry.entryTags || {};
    const keys = Object.keys(tags);
    const inner = [entry.citationKey ? entry.citationKey + ',' : '']
      .concat(keys.map(k => `${k}={${tags[k]}}`))
      .join(',');
    return `@${entry.entryType}{${inner}}`;
  }

  function normalizeWhitespace(s){return (s||'').replace(/\s+/g,' ').trim();}

  function classify(e){
    const t = (e.entryType||'').toLowerCase();
    const lang = (e.entryTags?.language||'').toLowerCase();
    if(t === 'article') return 'journals';
    if(t === 'inproceedings') return lang.includes('french') ? 'national' : 'intl';
    return 'intl';
  }

  function norm(e){
    const t = e.entryTags || {};
    const title  = normalizeWhitespace(t.title || '');
    const authors= normalizeWhitespace(t.author || '');
    const venue  = normalizeWhitespace(t.journal || t.booktitle || '');
    const year   = parseInt(t.year,10) || undefined;
    const url    = normalizeWhitespace(t.url || '');
    let doi      = normalizeWhitespace(t.doi || '');

    // Accept both '10.1000/xyz' and 'https://doi.org/...'
    if(doi){
      if(/^https?:/i.test(doi)) {
        // keep as URL
      } else {
        doi = 'https://doi.org/' + encodeURIComponent(doi);
      }
    }

    return { title, authors, venue, year, url, doi, bibtex: toBib(e) };
  }

  function renderList(el, items){
    el.innerHTML = items.map(p=>{
      const year  = p.year ? `<span class="year">${p.year}</span>` : '';
      const venue = p.venue ? chip(p.venue) : '';
      const doi   = p.doi ? `<a href="${escapeHtml(p.doi)}" target="_blank" rel="noopener">DOI</a>` : '';
      const open  = p.url ? `<a class="btn" href="${escapeHtml(p.url)}" target="_blank" rel="noopener">Open</a>` : '';

      return `<article class="pub" style="padding:10px 12px;margin-bottom:10px">
        <div class="title" style="font-weight:600">${escapeHtml(p.title || '(untitled)')} ${year}</div>
        <div class="meta" style="font-size:14px;color:#444">${escapeHtml(p.authors || '')}</div>
        <div class="meta" style="margin-top:4px">${venue}</div>
        <div class="actions" style="margin-top:6px">
          ${copyBtn(p.bibtex)}
          ${doi ? `<span class="btn">${doi}</span>` : ''}
          ${open}
        </div>
      </article>`;
    }).join('');

    // Copy buttons
    el.querySelectorAll('button[data-bib]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const bib = decodeURIComponent(escape(atob(btn.getAttribute('data-bib'))));
        navigator.clipboard.writeText(bib).then(()=>{
          const old = btn.textContent; btn.textContent = 'Copied!';
          setTimeout(()=>btn.textContent=old, 1200);
        });
      });
    });
  }

  async function loadBibText() {
    // Primary location
    const urls = ['data/publications.bib', 'publications.bib'];
    let lastErr = null;
    for(const u of urls){
      try{
        const res = await fetch(u, {cache:'no-store'});
        if(!res.ok) throw new Error(`HTTP ${res.status} for ${u}`);
        const txt = await res.text();
        return txt;
      }catch(e){
        lastErr = e;
        console.warn('[pubs] fetch failed for', u, e);
      }
    }
    throw lastErr || new Error('No .bib file found');
  }

  function guardNodes(){
    const journalsEl = $('#list-journals');
    const intlEl     = $('#list-intl');
    const nationalEl = $('#list-national');
    if(!journalsEl || !intlEl || !nationalEl){
      throw new Error('Missing publications containers (#list-journals, #list-intl, #list-national).');
    }
    return {journalsEl, intlEl, nationalEl};
  }

  window.addEventListener('DOMContentLoaded', async ()=>{
    try{
      if(typeof bibtexParse === 'undefined'){
        throw new Error('bibtexParse is not defined. Ensure data/bibtexParse.js is loaded BEFORE data/publications.js');
      }

      const {journalsEl, intlEl, nationalEl} = guardNodes();
      const bibText = await loadBibText();

      // Parse with bibtexParse
      let entries = [];
      try{
        entries = bibtexParse.toJSON(bibText) || [];
      }catch(parseErr){
        console.warn('[pubs] Strict parse failed, trying fallback cleanup.', parseErr);
        const cleaned = bibText
          .replace(/=\s*https?:\/\/\S+/g, m => m.replace(/=/,'= {').concat('}')) // wrap bare URL values
          .replace(/doi\s*=\s*{\s*https?:\/\/doi\.org\//gi, 'doi = {');          // normalize doi prefix
        entries = bibtexParse.toJSON(cleaned) || [];
      }

      // Classify & normalize
      const buckets = {journals:[], intl:[], national:[]};
      entries.filter(e => e && e.entryType && e.entryTags).forEach(e=>{
        const bucket = classify(e);
        buckets[bucket].push(norm(e));
      });

      const byYear = (a,b)=> (b.year||0)-(a.year||0) || (a.title||'').localeCompare(b.title||'');
      buckets.journals.sort(byYear);
      buckets.intl.sort(byYear);
      buckets.national.sort(byYear);

      renderList(journalsEl, buckets.journals);
      renderList(intlEl,     buckets.intl);
      renderList(nationalEl, buckets.national);

      console.log(`[pubs] Rendered: J=${buckets.journals.length}, I=${buckets.intl.length}, N=${buckets.national.length}`);
    }catch(err){
      console.error('[pubs] Failed to load publications:', err);
      const pubWrap = document.querySelector('#publications .pub-wrap');
      if(pubWrap){
        const note = document.createElement('div');
        note.className = 'meta';
        note.style.color = '#b91c1c';
        note.style.padding = '8px 12px';
        note.style.border = '1px solid #fecaca';
        note.style.background = '#fef2f2';
        note.style.borderRadius = '8px';
        note.textContent = 'Failed to load publications. Ensure data/publications.bib exists and scripts are included in the correct order.';
        pubWrap.prepend(note);
      }
    }
  });
})();
