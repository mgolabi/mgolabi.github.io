
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

// Footer year and back-to-top
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
const btt = $('#backToTop');
window.addEventListener('scroll', () => { if (btt) btt.style.display = window.scrollY > 500 ? 'block' : 'none'; });

// Publications
let PUBS = [];
document.addEventListener('DOMContentLoaded', async () => {
  await loadPublications();
  setupPubControls();
});

async function loadPublications(){
  try {
    const res = await fetch('data/publications.json', {cache:'no-store'});
    if(res.ok){ const data = await res.json(); PUBS = normalizePubs(data.publications || data); }
    else { useEmbedded(); }
  } catch(e){ useEmbedded(); }
  renderPublications(PUBS);
  populateFilters(PUBS);
}

function useEmbedded(){
  PUBS = normalizePubs([
    {
      id: "doe2024",
      type: "article",
      title: "Learning-Augmented Large Neighborhood Search for the Capacitated VRP",
      authors: ["John Doe", "Jane Smith"],
      year: 2024,
      venue: "European Journal of Operational Research",
      doi: "10.1016/j.ejor.2024.01.001",
      url: "#",
      abstract: "We integrate policy learning into LNS for VRP to improve solution quality and runtime.",
      bibtex: "@article{doe2024learning, title={Learning-Augmented Large Neighborhood Search for the Capacitated VRP}, author={Doe, John and Smith, Jane}, journal={EJOR}, year={2024}, doi={10.1016/j.ejor.2024.01.001}}"
    },
    {
      id: "doe2023",
      type: "inproceedings",
      title: "Neural Diving Heuristics for Mixed-Integer Programming",
      authors: ["John Doe", "Alex Roe"],
      year: 2023,
      venue: "NeurIPS",
      url: "#"
    }
  ]);
}

function normalizePubs(list){
  return (list || []).map(p => ({
    id: p.id || crypto.randomUUID(),
    type: (p.type||'misc').toLowerCase(),
    title: p.title || '(untitled)',
    authors: Array.isArray(p.authors) ? p.authors : (p.authors ? String(p.authors).split(/\s*;\s*|\s*,\s*/).filter(Boolean) : []),
    year: Number(p.year)||'',
    venue: p.venue || p.journal || p.booktitle || '',
    publisher: p.publisher || '',
    volume: p.volume || '',
    number: p.number || '',
    pages: p.pages || '',
    doi: p.doi || '',
    url: p.url || '',
    abstract: p.abstract || '',
    bibtex: p.bibtex || makeMinimalBibtex(p)
  })).sort((a,b)=> (b.year||0)-(a.year||0));
}

function makeMinimalBibtex(p){
  const key = (p.id || ((p.authors && p.authors[0] || 'key').split(' ')[0].toLowerCase()+ (p.year||'')));
  const authors = Array.isArray(p.authors) ? p.authors.join(' and ') : '';
  const venueField = p.journal ? `journal={${p.journal}}` : (p.venue? `booktitle={${p.venue}}` : '');
  return `@${(p.type||'misc')}{${key},
  title={${p.title||''}},
  author={${authors}},
  year={${p.year||''}},
  ${venueField}${p.doi?`,\n  doi={${p.doi}}`:''}
}`;
}

function renderPublications(list){
  const container = $('#pub-list');
  if(!container) return;
  container.innerHTML = '';
  if(!list.length){ container.innerHTML = '<p class="muted">No publications found.</p>'; return; }
  list.forEach(p => {
    const el = document.createElement('article');
    el.className = 'pub';
    const authors = p.authors.join(', ');
    const venue = [p.venue, p.publisher].filter(Boolean).join(' — ');
    const titleLink = p.url ? `<a href="${escapeHtml(p.url)}" target="_blank" rel="noopener" class="title">${escapeHtml(p.title)}</a>` : `<span class="title">${escapeHtml(p.title)}</span>`;
    el.innerHTML = `
      <div>${titleLink}<span class="year-badge" title="Year">${escapeHtml(String(p.year))}</span></div>
      <div class="meta">${escapeHtml(authors)}${venue?` · ${escapeHtml(venue)}`:''}${p.doi?` · DOI: <a href="https://doi.org/${encodeURIComponent(p.doi)}" target="_blank" rel="noopener">${escapeHtml(p.doi)}</a>`:''}</div>
      ${p.abstract?`<details><summary class="muted">Abstract</summary><p>${escapeHtml(p.abstract)}</p></details>`:''}
      <div class="actions">
        <button class="btn" data-bib='${btoa(unescape(encodeURIComponent(p.bibtex)))}'>Copy BibTeX</button>
        ${p.url?`<a class="btn" href="${escapeHtml(p.url)}" target="_blank" rel="noopener">Open</a>`:''}
      </div>
    `;
    const copyBtn = el.querySelector('button[data-bib]');
    copyBtn.addEventListener('click', () => {
      const bib = decodeURIComponent(escape(atob(copyBtn.getAttribute('data-bib'))));
      navigator.clipboard.writeText(bib).then(()=> {
        copyBtn.textContent = 'Copied!';
        setTimeout(()=> copyBtn.textContent = 'Copy BibTeX', 1200);
      });
    });
    container.appendChild(el);
  });
}

function populateFilters(list){
  const years = Array.from(new Set(list.map(p => p.year).filter(Boolean))).sort((a,b)=>b-a);
  const yearSel = $('#pub-year');
  if (yearSel) yearSel.innerHTML = '<option value=\"\">All years</option>' + years.map(y=>`<option>${y}</option>`).join('');
}

function setupPubControls(){
  const search = $('#pub-search');
  const yearSel = $('#pub-year');
  const typeSel = $('#pub-type');
  const apply = () => {
    const q = (search?.value || '').trim().toLowerCase();
    const y = yearSel?.value || '';
    const t = (typeSel?.value || '').trim().toLowerCase();
    const filtered = PUBS.filter(p => {
      const inQ = !q || [p.title, p.venue, p.publisher, p.doi, ...(p.authors||[])].join(' ').toLowerCase().includes(q);
      const inY = !y || String(p.year) === y;
      const inT = !t || p.type === t;
      return inQ && inY && inT;
    });
    renderPublications(filtered);
  };
  [search, yearSel, typeSel].forEach(el => el && el.addEventListener('input', apply));
}

function escapeHtml(str){
  return String(str).replace(/[&<>\"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\\'':'&#39;'}[s]));
}
