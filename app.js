// ── CONFIGURACIÓN ──────────────────────────────────────────────────────────
const CONFIG = {
  clientId:  '7cd814d7-b526-4119-9b34-305e9bff216f',
  tenantId:  '93f33571-550f-43cf-b09f-cd331338d086',
  redirectUri: 'https://joaquincamarapardo.github.io/bt-capacity/',
  scopes: ['Files.Read', 'Sites.Read.All', 'User.Read'],
  siteUrl: 'https://dxcportal.sharepoint.com/sites/BT-Artemis',
  filePath: '/Shared Documents/General/Capacity_BT_2026.xlsx'
};

// ── MSAL ───────────────────────────────────────────────────────────────────
const msalConfig = {
  auth: { clientId: CONFIG.clientId, authority: `https://login.microsoftonline.com/${CONFIG.tenantId}`, redirectUri: CONFIG.redirectUri },
  cache: { cacheLocation: 'sessionStorage' }
};
const msalInstance = new msal.PublicClientApplication(msalConfig);

// ── ESTADO ─────────────────────────────────────────────────────────────────
let STATE = { account: null, data: null };
const CHARTS = {};

// ── CONSTANTES ─────────────────────────────────────────────────────────────
const MN  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MNL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TAB_ICONS   = ["❄️","🌧️","🌱","🌸","🌞","☀️","🏖️","🌻","🍂","🎃","🍂","🎄"];
const DAYS_IN_MONTH = [31,28,31,30,31,30,31,31,30,31,30,31];
const ABSENCE_CODES = new Set(['H','L','S','T','propd','M','HPY','LD']);
const CODE_NAMES  = {H:'Festivos',L:'Vacaciones',S:'Baja',T:'Formación',M:'Maternidad',propd:'Flex',LD:'Libre disp.',HPY:'Vac.ant.'};
const CODE_COLS   = {H:'#FFD700',L:'#90CAF9',S:'#FFCDD2',T:'#B2EBF2',M:'#FCE4EC',propd:'#FFF9C4',LD:'#E8F5E9',HPY:'#B3E5FC'};
const CODES = ['H','L','S','T','M','propd','LD','HPY'];
const TEAM_COLORS = ['#0D1B4B','#F26522','#1D9E75','#D85A30','#7F77DD','#BA7517','#D4537E','#378ADD','#639922','#888780'];

// ── AUTH ───────────────────────────────────────────────────────────────────
async function login() {
  try {
    document.getElementById('btn-login').disabled = true;
    document.getElementById('btn-login').textContent = 'Conectando...';
    const resp = await msalInstance.loginPopup({ scopes: CONFIG.scopes });
    STATE.account = resp.account;
    showApp();
    await loadData();
  } catch(e) {
    document.getElementById('btn-login').disabled = false;
    document.getElementById('btn-login').textContent = 'Acceder con cuenta DXC';
    showError('Error al iniciar sesión: ' + e.message);
  }
}

async function getToken() {
  const req = { scopes: CONFIG.scopes, account: STATE.account };
  try { return (await msalInstance.acquireTokenSilent(req)).accessToken; }
  catch { return (await msalInstance.acquireTokenPopup(req)).accessToken; }
}

function logout() {
  msalInstance.logoutPopup();
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  document.getElementById('app').style.flexDirection = 'column';
  const a = STATE.account;
  document.getElementById('user-name').textContent = a.name || '';
  document.getElementById('user-email').textContent = a.username || '';
}

// ── CARGA DE DATOS ─────────────────────────────────────────────────────────
async function loadData() {
  showLoading('Conectando con SharePoint...');
  hideError();
  document.getElementById('btn-refresh').disabled = true;

  try {
    const token = await getToken();

    // Obtener site ID
    setLoadingText('Localizando archivo...');
    const siteResp = await fetch(
      `https://graph.microsoft.com/v1.0/sites/dxcportal.sharepoint.com:/sites/BT-Artemis`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if(!siteResp.ok) throw new Error('No se pudo acceder al sitio SharePoint. Verifica los permisos.');
    const site = await siteResp.json();

    // Obtener el archivo
    setLoadingText('Descargando Capacity_BT_2026.xlsx...');
    const fileResp = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${site.id}/drives`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const drives = await fileResp.json();
    const docsDrive = drives.value.find(d => d.name === 'Documents' || d.name === 'Documentos') || drives.value[0];

    const itemResp = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${site.id}/drives/${docsDrive.id}/root:/General/Capacity_BT_2026.xlsx:/content`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if(!itemResp.ok) throw new Error('No se encontró el archivo Capacity_BT_2026.xlsx en SharePoint.');

    setLoadingText('Procesando datos del Excel...');
    const arrayBuffer = await itemResp.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

    setLoadingText('Calculando métricas...');
    STATE.data = processWorkbook(workbook);

    hideLoading();
    document.getElementById('btn-refresh').disabled = false;
    document.getElementById('last-update').textContent =
      '↻ ' + new Date().toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'});

    renderAll();
  } catch(e) {
    hideLoading();
    document.getElementById('btn-refresh').disabled = false;
    showError('Error al cargar datos: ' + e.message);
  }
}

// ── PROCESADO DEL EXCEL ────────────────────────────────────────────────────
function processWorkbook(wb) {
  const YEAR = 2026;

  // Leer Roster
  const wsRoster = wb.Sheets['👤 Team Roster'];
  if(!wsRoster) throw new Error('No se encontró la pestaña Team Roster.');
  const rosterRaw = XLSX.utils.sheet_to_json(wsRoster, { header: 1, defval: null });

  const roster = {};
  for(let i = 9; i < rosterRaw.length; i++) {
    const row = rosterRaw[i];
    const name = row[2], mode = row[6];
    if(!name || !mode || typeof name !== 'string') continue;
    const hrs = [];
    for(let m = 0; m < 12; m++) hrs.push(parseInt(row[11+m]) || (mode==='Onsite'?8:9));
    const startRaw = row[8], endRaw = row[9];
    const start = startRaw ? new Date(startRaw) : new Date(2026,0,1);
    const end   = endRaw   ? new Date(endRaw)   : null;
    roster[name.trim()] = { mode, team: (row[5]||'BT').trim(), hrs, start, end };
  }

  // Leer cada mes
  const people   = {};  // name → {mode, team, hrs_by_month, months:{}}
  const annual   = [];
  const teamData = {}; // team → {month → {avail, abs, count, people}}

  for(let mi = 0; mi < 12; mi++) {
    const sheetName = `${TAB_ICONS[mi]} ${MONTHS_FULL[mi]}`;
    const ws = wb.Sheets[sheetName];
    if(!ws) { annual.push({month:MN[mi],total_hrs:0,abs_hrs:0,on_avail:0,off_avail:0,on_abs:0,off_abs:0,on_hc:0,off_hc:0,abs_by_type:{}}); continue; }

    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    const n_days = DAYS_IN_MONTH[mi];
    const month_num = mi + 1;
    const fw = new Date(YEAR, mi, 1).getDay(); // 0=Dom
    const fwMon = (fw + 6) % 7; // convertir a lunes=0

    // Mapear día → col desde fila 7 (idx 6)
    const dayToCol = {};
    const headerRow = raw[6] || [];
    for(let c = 0; c < headerRow.length; c++) {
      const v = headerRow[c];
      if(typeof v === 'number' && v >= 1 && v <= 31) dayToCol[v] = c;
    }

    // Mapear nombre → equipo desde col E (idx 4)
    const nameToTeam = {};

    let totAvail=0, totAbs=0, onAvail=0, offAvail=0, onAbs=0, offAbs=0;
    const absType = {};
    let onHC=0, offHC=0;

    for(let r = 8; r < raw.length; r++) {
      const row = raw[r];
      const bVal = row[1];
      if(!bVal || typeof bVal !== 'string') continue;
      if(['ONSITE','OFFSHORE','TOTAL','🏢','🌏'].some(x => bVal.includes(x))) continue;

      const name = bVal.trim();
      const teamCell = (row[4] || 'BT').toString().trim();
      nameToTeam[name] = teamCell;

      const rp = roster[name];
      const mode = rp ? rp.mode : (name in people ? people[name].mode : '?');
      const hd   = rp ? rp.hrs[mi] : 8;

      if(!people[name]) people[name] = { mode, team: teamCell, hrs_by_month: rp?rp.hrs:[...Array(12)].fill(hd), months: {} };
      people[name].team = teamCell; // actualizar con valor del mes actual

      let avail = 0;
      const absCodes = {};
      for(let d = 1; d <= n_days; d++) {
        const col = dayToCol[d];
        if(col === undefined) continue;
        const wd = (fwMon + d - 1) % 7;
        if(wd >= 5) continue; // fin de semana
        const v = row[col];
        if(typeof v === 'string' && ABSENCE_CODES.has(v)) {
          absCodes[v] = (absCodes[v]||0) + 1;
        } else if(typeof v === 'number' && v > 0) {
          avail += v;
        }
      }

      const absHrs = Object.entries(absCodes).reduce((s,[,n]) => s + n*hd, 0);
      people[name].months[MN[mi]] = { avail, abs: absHrs, codes: absCodes };

      totAvail += avail; totAbs += absHrs;
      if(mode === 'Onsite')  { onAvail += avail; onAbs += absHrs; onHC++; }
      if(mode === 'Offshore'){ offAvail += avail; offAbs += absHrs; offHC++; }

      for(const [c, n] of Object.entries(absCodes)) absType[c] = (absType[c]||0) + n*hd;

      // Equipo
      if(!teamData[teamCell]) teamData[teamCell] = {};
      if(!teamData[teamCell][MN[mi]]) teamData[teamCell][MN[mi]] = { avail:0, abs:0, count:0, people:[] };
      teamData[teamCell][MN[mi]].avail += avail;
      teamData[teamCell][MN[mi]].abs   += absHrs;
      teamData[teamCell][MN[mi]].count++;
      teamData[teamCell][MN[mi]].people.push({ name, mode, avail, abs: absHrs, codes: absCodes });
    }

    annual.push({ month:MN[mi], total_hrs:totAvail, abs_hrs:totAbs,
      on_avail:onAvail, off_avail:offAvail, on_abs:onAbs, off_abs:offAbs,
      on_hc:onHC, off_hc:offHC, abs_by_type:absType });
  }

  // Construir lista de personas
  const peopleList = Object.entries(people)
    .map(([name, p]) => {
      const totalAvail = Object.values(p.months).reduce((s,m) => s+(m.avail||0), 0);
      const totalAbs   = Object.values(p.months).reduce((s,m) => s+(m.abs||0), 0);
      const absByCode  = {};
      Object.values(p.months).forEach(m => Object.entries(m.codes||{}).forEach(([c,n]) => { absByCode[c]=(absByCode[c]||0)+n; }));
      return { name, mode:p.mode, team:p.team, avail:totalAvail, abs:totalAbs, codes:absByCode, months:p.months };
    })
    .sort((a,b) => a.name.localeCompare(b.name));

  const teams = Object.keys(teamData).sort();

  return { annual, people: peopleList, teamData, teams };
}

// ── RENDER ─────────────────────────────────────────────────────────────────
function renderAll() {
  renderOverview();
  renderByMode();
  renderByTeam();
  renderMonthly();
  renderPerson();
  renderCharts();
}

// Helpers
function pct(a,b){ return b>0 ? Math.round(a/b*100) : 0; }
function fmt(n){ return n>=1000 ? (n/1000).toFixed(1)+'k' : String(Math.round(n)); }
function delt(v){ return v>0?`<span class="dp">▲${fmt(v)}</span>`:v<0?`<span class="dn">▼${fmt(Math.abs(v))}</span>`:`<span class="dz">—</span>`; }
function pill(codes,c){ const n=codes[c]||0; return n?`<td><span class="pill" style="background:${CODE_COLS[c]}">${n}</span></td>`:`<td class="zero">—</td>`; }
function badge(m){ return m==='Onsite'?`<span class="badge-on">Onsite</span>`:`<span class="badge-off">Offshore</span>`; }
function card(l,v,s,accent){ return `<div class="card${accent?' card-accent':''}"><div class="card-label">${l}</div><div class="card-value">${v}</div><div class="card-sub">${s}</div></div>`; }
function mkChart(id,type,data,opts){
  const ctx = document.getElementById(id);
  if(!ctx) return;
  if(CHARTS[id]) CHARTS[id].destroy();
  CHARTS[id] = new Chart(ctx, { type, data, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, ...opts }});
}
function tblWrap(html){ return `<div class="table-card"><div class="table-wrap"><table>${html}</table></div></div>`; }

// ── OVERVIEW ────────────────────────────────────────────────────────────────
function renderOverview() {
  const d = STATE.data;
  const totA = d.annual.reduce((s,a)=>s+a.total_hrs,0);
  const totB = d.annual.reduce((s,a)=>s+a.abs_hrs,0);
  const maxM = d.annual.reduce((a,b)=>a.total_hrs>b.total_hrs?a:b);
  const maxAM= d.annual.reduce((a,b)=>a.abs_hrs>b.abs_hrs?a:b);
  const nOn  = d.people.filter(p=>p.mode==='Onsite').length;
  const nOff = d.people.filter(p=>p.mode==='Offshore').length;

  let html = `<div class="cards">
    ${card('Total horas disponibles',fmt(totA)+'h',`${totA.toLocaleString()} h en 2026`,true)}
    ${card('Total horas ausencia',fmt(totB)+'h',`${pct(totB,totA+totB)}% sobre capacidad bruta`)}
    ${card('Personas en equipo',d.people.length,`${nOn} Onsite · ${nOff} Offshore`)}
    ${card('Mes más productivo',maxM.month,`${maxM.total_hrs.toLocaleString()} h disponibles`)}
    ${card('Mes más ausencias',maxAM.month,`${maxAM.abs_hrs.toLocaleString()} h ausencia`)}
  </div>`;

  html += `<div class="grid2">
    <div class="chart-card">
      <h3>Horas disponibles vs ausencias por mes</h3>
      <div class="legend"><span><i style="background:#0D1B4B"></i>Disponibles</span><span><i style="background:#F26522"></i>Ausencia</span></div>
      <div class="chart-wrap" style="height:200px"><canvas id="ch-ov1"></canvas></div>
    </div>
    <div class="chart-card">
      <h3>Headcount por mes</h3>
      <div class="legend"><span><i style="background:#0D1B4B"></i>Onsite</span><span><i style="background:#F26522"></i>Offshore</span></div>
      <div class="chart-wrap" style="height:200px"><canvas id="ch-ov2"></canvas></div>
    </div>
  </div>`;

  html += `<div class="section-title">Resumen por persona — tabla anual</div>
  <div class="filters">
    <label>Modo:</label>
    <select id="fov-mode" onchange="filterOverviewTable()"><option value="">Todos</option><option>Onsite</option><option>Offshore</option></select>
    <label>Buscar:</label>
    <input id="fov-name" placeholder="Nombre..." oninput="filterOverviewTable()" style="width:160px">
  </div>`;

  html += tblWrap(`<thead><tr>
    <th class="l" style="min-width:160px">Persona</th><th class="l">Modo</th><th class="l">Equipo</th>
    <th>H disp.</th><th>H aus.</th><th>% disp.</th>
    ${CODES.map(c=>`<th>${c}</th>`).join('')}
  </tr></thead><tbody id="tbody-overview"></tbody>`);

  document.getElementById('tab-overview').innerHTML = html;

  // Charts
  setTimeout(() => {
    mkChart('ch-ov1','bar',{labels:MNL,datasets:[
      {label:'Disp.',data:d.annual.map(a=>a.total_hrs),backgroundColor:'#0D1B4B'},
      {label:'Aus.',data:d.annual.map(a=>a.abs_hrs),backgroundColor:'#F26522'}
    ]},{scales:{x:{ticks:{autoSkip:false,font:{size:10}}},y:{ticks:{callback:v=>fmt(v)}}}});
    mkChart('ch-ov2','line',{labels:MNL,datasets:[
      {label:'On',data:d.annual.map(a=>a.on_hc),borderColor:'#0D1B4B',backgroundColor:'#0D1B4B',tension:.3,pointRadius:4},
      {label:'Off',data:d.annual.map(a=>a.off_hc),borderColor:'#F26522',backgroundColor:'#F26522',tension:.3,pointRadius:4,borderDash:[4,2]}
    ]},{scales:{x:{ticks:{autoSkip:false,font:{size:10}}},y:{min:0}}});
    filterOverviewTable();
  }, 50);
}

function filterOverviewTable() {
  const mode = document.getElementById('fov-mode')?.value || '';
  const name = (document.getElementById('fov-name')?.value || '').toLowerCase();
  const filtered = STATE.data.people.filter(p =>
    (!mode || p.mode===mode) && (!name || p.name.toLowerCase().includes(name))
  ).sort((a,b)=>b.avail-a.avail);
  const tbody = document.getElementById('tbody-overview');
  if(!tbody) return;
  tbody.innerHTML = filtered.map(p => {
    const t = p.avail+p.abs||1;
    return `<tr><td class="l">${p.name}</td><td class="l">${badge(p.mode)}</td><td class="l">${p.team}</td>
      <td>${p.avail.toLocaleString()}</td><td>${p.abs.toLocaleString()}</td><td>${pct(p.avail,t)}%</td>
      ${CODES.map(c=>pill(p.codes,c)).join('')}</tr>`;
  }).join('');
}
window.filterOverviewTable = filterOverviewTable;

// ── BY MODE ─────────────────────────────────────────────────────────────────
function renderByMode() {
  const d = STATE.data;
  const onA  = d.annual.map(a=>a.on_avail),  offA = d.annual.map(a=>a.off_avail);
  const onAb = d.annual.map(a=>a.on_abs),    offAb= d.annual.map(a=>a.off_abs);
  const totOn  = onA.reduce((s,v)=>s+v,0),   totOff  = offA.reduce((s,v)=>s+v,0);
  const totOnB = onAb.reduce((s,v)=>s+v,0),  totOffB = offAb.reduce((s,v)=>s+v,0);

  const onP  = d.people.filter(p=>p.mode==='Onsite');
  const offP = d.people.filter(p=>p.mode==='Offshore');

  let html = `<div class="cards">
    ${card('Horas Onsite',fmt(totOn)+'h',`${totOn.toLocaleString()} h · ${pct(totOn,totOn+totOnB)}% disp.`,true)}
    ${card('Horas Offshore',fmt(totOff)+'h',`${totOff.toLocaleString()} h · ${pct(totOff,totOff+totOffB)}% disp.`)}
    ${card('Tasa ausencia Onsite',pct(totOnB,totOn+totOnB)+'%',`${totOnB.toLocaleString()} h ausencia`)}
    ${card('Tasa ausencia Offshore',pct(totOffB,totOff+totOffB)+'%',`${totOffB.toLocaleString()} h ausencia`)}
  </div>`;

  html += `<div class="grid2">
    <div class="chart-card">
      <h3>Horas disponibles — Onsite vs Offshore</h3>
      <div class="legend"><span><i style="background:#0D1B4B"></i>Onsite</span><span><i style="background:#F26522"></i>Offshore</span></div>
      <div class="chart-wrap" style="height:200px"><canvas id="ch-bm1"></canvas></div>
    </div>
    <div class="chart-card">
      <h3>Tasa de ausencias %</h3>
      <div class="legend"><span><i style="background:#0D1B4B"></i>% Onsite</span><span><i style="background:#F26522"></i>% Offshore</span></div>
      <div class="chart-wrap" style="height:200px"><canvas id="ch-bm2"></canvas></div>
    </div>
  </div>`;

  html += `<div class="section-title">Tabla Onsite vs Offshore por mes</div>`;
  let rows='', soa=0,sob=0,sfa=0,sfb=0;
  MN.forEach((mk,i)=>{
    const oa=onA[i],ob=onAb[i],fa=offA[i],fb=offAb[i];
    soa+=oa;sob+=ob;sfa+=fa;sfb+=fb;
    rows+=`<tr><td class="l">${MNL[i]}</td>
      <td>${oa.toLocaleString()}</td><td>${ob.toLocaleString()}</td><td>${pct(oa,oa+ob)}%</td>
      <td>${fa.toLocaleString()}</td><td>${fb.toLocaleString()}</td><td>${pct(fa,fa+fb)}%</td>
      <td>${(oa+fa).toLocaleString()}</td></tr>`;
  });
  html += tblWrap(`<thead><tr>
    <th class="l">Mes</th>
    <th>On disp.</th><th>On aus.</th><th>% On</th>
    <th>Off disp.</th><th>Off aus.</th><th>% Off</th>
    <th>Total disp.</th>
  </tr></thead><tbody>${rows}</tbody>
  <tfoot><tr><td class="l">TOTAL AÑO</td>
    <td>${soa.toLocaleString()}</td><td>${sob.toLocaleString()}</td><td>${pct(soa,soa+sob)}%</td>
    <td>${sfa.toLocaleString()}</td><td>${sfb.toLocaleString()}</td><td>${pct(sfa,sfa+sfb)}%</td>
    <td>${(soa+sfa).toLocaleString()}</td>
  </tr></tfoot>`);

  document.getElementById('tab-bymode').innerHTML = html;

  setTimeout(() => {
    mkChart('ch-bm1','bar',{labels:MNL,datasets:[
      {label:'Onsite',data:onA,backgroundColor:'#0D1B4B'},
      {label:'Offshore',data:offA,backgroundColor:'#F26522'}
    ]},{scales:{x:{ticks:{autoSkip:false,font:{size:10}}},y:{ticks:{callback:v=>fmt(v)}}}});
    const rOn  = onA.map((v,i)=>pct(onAb[i],v+onAb[i]));
    const rOff = offA.map((v,i)=>pct(offAb[i],v+offAb[i]));
    mkChart('ch-bm2','line',{labels:MNL,datasets:[
      {label:'%On',data:rOn,borderColor:'#0D1B4B',backgroundColor:'#0D1B4B',tension:.3,pointRadius:4},
      {label:'%Off',data:rOff,borderColor:'#F26522',backgroundColor:'#F26522',tension:.3,pointRadius:4,borderDash:[4,2]}
    ]},{scales:{x:{ticks:{autoSkip:false,font:{size:10}}},y:{min:0,ticks:{callback:v=>v+'%'}}}});
  }, 50);
}

// ── BY TEAM ─────────────────────────────────────────────────────────────────
function renderByTeam() {
  const d = STATE.data;
  const teams = d.teams;
  const tColors = {};
  teams.forEach((t,i) => tColors[t] = TEAM_COLORS[i % TEAM_COLORS.length]);

  const teamAvail = t => MN.reduce((s,mk)=>s+(d.teamData[t]&&d.teamData[t][mk]?d.teamData[t][mk].avail:0),0);
  const teamAbs   = t => MN.reduce((s,mk)=>s+(d.teamData[t]&&d.teamData[t][mk]?d.teamData[t][mk].abs:0),0);
  const teamPpl   = t => Math.max(...MN.map(mk=>d.teamData[t]&&d.teamData[t][mk]?d.teamData[t][mk].count:0));

  const sorted = [...teams].sort((a,b)=>teamAvail(b)-teamAvail(a));

  let html = `<div class="filters">
    <label>Vista:</label>
    <select id="fbt-view" onchange="renderByTeamView()">
      <option value="annual">Resumen anual</option>
      <option value="month">Por mes</option>
    </select>
    <span id="fbt-mes-wrap" style="display:none">
      <label>Mes:</label>
      <select id="fbt-mes" onchange="renderByTeamView()">
        ${MNL.map((m,i)=>`<option value="${i}">${m}</option>`).join('')}
      </select>
    </span>
  </div>
  <div id="byteam-content"></div>`;

  document.getElementById('tab-byteam').innerHTML = html;

  // guardar colores en state para reutilizar
  STATE.teamColors = tColors;
  STATE.teamSorted = sorted;
  renderByTeamView();
}

function renderByTeamView() {
  const view = document.getElementById('fbt-view').value;
  document.getElementById('fbt-mes-wrap').style.display = view==='month'?'':'none';
  const d = STATE.data;
  const tColors = STATE.teamColors;
  const sorted  = STATE.teamSorted;
  const teamAvail = t => MN.reduce((s,mk)=>s+(d.teamData[t]&&d.teamData[t][mk]?d.teamData[t][mk].avail:0),0);
  const teamAbs   = t => MN.reduce((s,mk)=>s+(d.teamData[t]&&d.teamData[t][mk]?d.teamData[t][mk].abs:0),0);
  const teamPpl   = t => Math.max(...MN.map(mk=>d.teamData[t]&&d.teamData[t][mk]?d.teamData[t][mk].count:0));

  let html = '';

  if(view==='annual') {
    html += `<div class="chart-card"><h3>Horas disponibles por equipo — 2026</h3>
      <div class="chart-wrap" style="height:220px"><canvas id="ch-bt1"></canvas></div></div>`;
    let rows='', sumA=0, sumB=0;
    sorted.forEach(t => {
      const a=teamAvail(t),b=teamAbs(t),p=teamPpl(t);
      sumA+=a;sumB+=b;
      rows+=`<tr><td class="l"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${tColors[t]};margin-right:6px;vertical-align:middle"></span>${t}</td>
        <td>${a.toLocaleString()}</td><td>${b.toLocaleString()}</td><td>${pct(a,a+b)}%</td><td>${p}</td><td>${p?Math.round(a/p):0}</td></tr>`;
    });
    html += `<div class="section-title">Tabla anual por equipo</div>`;
    html += tblWrap(`<thead><tr><th class="l">Equipo</th><th>H disponibles</th><th>H ausencia</th><th>% disp.</th><th>Personas</th><th>Media h/p</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td class="l">TOTAL</td><td>${sumA.toLocaleString()}</td><td>${sumB.toLocaleString()}</td><td>${pct(sumA,sumA+sumB)}%</td><td>—</td><td>—</td></tr></tfoot>`);

    document.getElementById('byteam-content').innerHTML = html;
    setTimeout(() => {
      mkChart('ch-bt1','bar',{labels:sorted,datasets:[
        {label:'Disp.',data:sorted.map(teamAvail),backgroundColor:sorted.map(t=>tColors[t])},
        {label:'Aus.',data:sorted.map(teamAbs),backgroundColor:sorted.map(t=>tColors[t]+'88')}
      ]},{scales:{x:{ticks:{autoSkip:false,font:{size:11}}},y:{ticks:{callback:v=>fmt(v)}}}});
    }, 50);

  } else {
    const mi = parseInt(document.getElementById('fbt-mes').value);
    const mk = MN[mi];
    const active = sorted.filter(t=>d.teamData[t]&&d.teamData[t][mk]);

    html += `<div class="chart-card"><h3>Horas disponibles por equipo — ${MNL[mi]}</h3>
      <div class="chart-wrap" style="height:200px"><canvas id="ch-bt2"></canvas></div></div>`;

    let rows='', totA=0, totB=0;
    active.forEach(t=>{
      const td=d.teamData[t][mk];
      totA+=td.avail;totB+=td.abs;
      rows+=`<tr><td class="l"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${tColors[t]};margin-right:6px;vertical-align:middle"></span>${t}</td>
        <td>${td.avail.toLocaleString()}</td><td>${td.abs.toLocaleString()}</td><td>${pct(td.avail,td.avail+td.abs)}%</td><td>${td.count}</td><td>${td.count?Math.round(td.avail/td.count):0}</td></tr>`;
    });
    html += `<div class="section-title">Tabla ${MNL[mi]} por equipo</div>`;
    html += tblWrap(`<thead><tr><th class="l">Equipo</th><th>H disponibles</th><th>H ausencia</th><th>% disp.</th><th>Personas</th><th>Media h/p</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td class="l">TOTAL</td><td>${totA.toLocaleString()}</td><td>${totB.toLocaleString()}</td><td>${pct(totA,totA+totB)}%</td><td>—</td><td>—</td></tr></tfoot>`);

    // Personas
    let pRows='';
    active.forEach(t=>{
      const td=d.teamData[t][mk];
      td.people.sort((a,b)=>b.avail-a.avail).forEach(p=>{
        pRows+=`<tr>
          <td class="l"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${tColors[t]};margin-right:4px;vertical-align:middle"></span>${t}</td>
          <td class="l">${p.name}</td><td class="l">${badge(p.mode)}</td>
          <td>${p.avail}</td><td>${p.abs}</td><td>${pct(p.avail,p.avail+p.abs||1)}%</td></tr>`;
      });
    });
    html += `<div class="section-title">Personas por equipo — ${MNL[mi]}</div>`;
    html += tblWrap(`<thead><tr><th class="l">Equipo</th><th class="l">Persona</th><th class="l">Modo</th><th>H disp.</th><th>H aus.</th><th>% disp.</th></tr></thead><tbody>${pRows}</tbody>`);

    document.getElementById('byteam-content').innerHTML = html;
    setTimeout(() => {
      mkChart('ch-bt2','bar',{labels:active,datasets:[
        {label:'Disp.',data:active.map(t=>d.teamData[t][mk].avail),backgroundColor:active.map(t=>tColors[t])},
        {label:'Aus.',data:active.map(t=>d.teamData[t][mk].abs),backgroundColor:active.map(t=>tColors[t]+'88')}
      ]},{scales:{x:{ticks:{autoSkip:false,font:{size:11}}},y:{ticks:{callback:v=>fmt(v)}}}});
    }, 50);
  }
}
window.renderByTeamView = renderByTeamView;

// ── MONTHLY ─────────────────────────────────────────────────────────────────
function renderMonthly() {
  const html = `<div class="filters">
    <label>Mes:</label>
    <select id="fm-mes" onchange="filterMonthly()">
      ${MNL.map((m,i)=>`<option value="${i}">${m}</option>`).join('')}
    </select>
    <label>Modo:</label>
    <select id="fm-mode" onchange="filterMonthly()"><option value="">Todos</option><option>Onsite</option><option>Offshore</option></select>
    <label>Buscar:</label>
    <input id="fm-name" placeholder="Nombre..." oninput="filterMonthly()" style="width:150px">
  </div>
  <div class="cards" id="c-monthly"></div>
  ${tblWrap(`<thead><tr>
    <th class="l" style="min-width:150px">Persona</th><th class="l">Modo</th><th class="l">Equipo</th>
    <th>H disp.</th><th>H aus.</th><th>% disp.</th>
    ${CODES.map(c=>`<th>${c}</th>`).join('')}
  </tr></thead><tbody id="tbody-monthly"></tbody>`)}`;

  document.getElementById('tab-monthly').innerHTML = html;
  filterMonthly();
}

function filterMonthly() {
  const mi   = parseInt(document.getElementById('fm-mes')?.value||0);
  const mk   = MN[mi];
  const mode = document.getElementById('fm-mode')?.value||'';
  const name = (document.getElementById('fm-name')?.value||'').toLowerCase();
  const d    = STATE.data;

  const filtered = d.people
    .filter(p=>p.months[mk]&&(p.months[mk].avail||p.months[mk].abs))
    .filter(p=>(!mode||p.mode===mode)&&(!name||p.name.toLowerCase().includes(name)))
    .map(p=>({...p,m:p.months[mk]}))
    .sort((a,b)=>(b.m.avail||0)-(a.m.avail||0));

  const ta=filtered.reduce((s,p)=>s+(p.m.avail||0),0);
  const tb=filtered.reduce((s,p)=>s+(p.m.abs||0),0);

  document.getElementById('c-monthly').innerHTML =
    card('Personas activas',filtered.length,`${filtered.filter(p=>p.mode==='Onsite').length} on · ${filtered.filter(p=>p.mode==='Offshore').length} off`,true)+
    card('H disponibles',ta.toLocaleString(),`en ${MNL[mi]}`)+
    card('H ausencia',tb.toLocaleString(),`${pct(tb,ta+tb)}% del total`)+
    card('Media h/persona',filtered.length?Math.round(ta/filtered.length):0,'h disponibles');

  const tbody = document.getElementById('tbody-monthly');
  if(tbody) tbody.innerHTML = filtered.map(p=>{
    const t=(p.m.avail||0)+(p.m.abs||0)||1;
    return `<tr><td class="l">${p.name}</td><td class="l">${badge(p.mode)}</td><td class="l">${p.team}</td>
      <td>${p.m.avail||0}</td><td>${p.m.abs||0}</td><td>${pct(p.m.avail||0,t)}%</td>
      ${CODES.map(c=>pill(p.m.codes||{},c)).join('')}</tr>`;
  }).join('');
}
window.filterMonthly = filterMonthly;

// ── PERSON ──────────────────────────────────────────────────────────────────
function renderPerson() {
  const d = STATE.data;
  const opts = d.people.map(p=>`<option value="${p.name}">${p.name} (${p.mode})</option>`).join('');
  document.getElementById('tab-person').innerHTML = `
    <div class="filters"><label>Persona:</label><select id="fp-sel" onchange="filterPerson()" style="width:280px">${opts}</select></div>
    <div id="person-content"></div>`;
  filterPerson();
}

function filterPerson() {
  const nm = document.getElementById('fp-sel')?.value;
  const p  = STATE.data.people.find(x=>x.name===nm);
  if(!p) return;
  const t = p.avail+p.abs||1;
  const cpills = Object.entries(p.codes)
    .map(([c,n])=>`<span class="pill" style="background:${CODE_COLS[c]||'#eee'};padding:3px 9px;font-size:12px">${CODE_NAMES[c]||c}: ${n} días</span>`)
    .join(' ');

  const rows = MN.map((mk,i)=>{
    const m=p.months[mk]||{};const a=m.avail||0,b=m.abs||0;
    if(!a&&!b) return `<tr><td>${MNL[i]}</td><td colspan="${3+CODES.length}" class="zero" style="text-align:center">— inactivo —</td></tr>`;
    return `<tr><td>${MNL[i]}</td><td>${a}</td><td>${b}</td><td>${pct(a,a+b||1)}%</td>${CODES.map(c=>pill(m.codes||{},c)).join('')}</tr>`;
  }).join('');

  document.getElementById('person-content').innerHTML = `
    <div class="cards">
      ${card('Horas disponibles 2026',p.avail.toLocaleString()+'h',`${pct(p.avail,t)}% de disponibilidad`,true)}
      ${card('Horas ausencia',p.abs.toLocaleString()+'h',`${pct(p.abs,t)}% del total`)}
      ${card('Modo',p.mode,`Equipo: ${p.team}`)}
    </div>
    ${cpills?`<div style="margin-bottom:1rem;display:flex;flex-wrap:wrap;gap:6px">${cpills}</div>`:''}
    ${tblWrap(`<thead><tr><th class="l">Mes</th><th>H disp.</th><th>H aus.</th><th>% disp.</th>${CODES.map(c=>`<th>${c}</th>`).join('')}</tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td class="l">TOTAL AÑO</td><td>${p.avail.toLocaleString()}</td><td>${p.abs.toLocaleString()}</td><td>${pct(p.avail,t)}%</td>
    ${CODES.map(c=>`<td>${p.codes[c]||'—'}</td>`).join('')}</tr></tfoot>`)}`;
}
window.filterPerson = filterPerson;

// ── CHARTS ──────────────────────────────────────────────────────────────────
function renderCharts() {
  const d = STATE.data;
  const dOn  = d.annual.map((a,i)=>i===0?0:a.on_avail-d.annual[i-1].on_avail);
  const dOff = d.annual.map((a,i)=>i===0?0:a.off_avail-d.annual[i-1].off_avail);
  const usedCodes = CODES.filter(c=>d.annual.some(a=>(a.abs_by_type[c]||0)>0));

  let html = `
    <div class="grid2">
      <div class="chart-card"><h3>Horas totales disponibles por mes</h3>
        <div class="chart-wrap" style="height:200px"><canvas id="ch-c1"></canvas></div></div>
      <div class="chart-card"><h3>Ausencias por tipo acumuladas</h3>
        <div class="chart-wrap" style="height:200px"><canvas id="ch-c2"></canvas></div></div>
    </div>
    <div class="chart-card"><h3>Variación mensual Δ vs mes anterior (Onsite / Offshore)</h3>
      <div class="legend"><span><i style="background:#0D1B4B"></i>Δ Onsite</span><span><i style="background:#F26522"></i>Δ Offshore</span></div>
      <div class="chart-wrap" style="height:200px"><canvas id="ch-c3"></canvas></div>
    </div>
    <div class="section-title">Tabla variaciones mensuales</div>`;

  let rows='';
  MN.forEach((mk,i)=>{
    const oa=d.annual[i].on_avail, fa=d.annual[i].off_avail;
    const doa=i>0?oa-d.annual[i-1].on_avail:0, dfa=i>0?fa-d.annual[i-1].off_avail:0;
    rows+=`<tr><td class="l">${MNL[i]}</td><td>${oa.toLocaleString()}</td><td>${delt(doa)}</td><td>${fa.toLocaleString()}</td><td>${delt(dfa)}</td><td>${(oa+fa).toLocaleString()}</td><td>${delt(doa+dfa)}</td></tr>`;
  });
  html += tblWrap(`<thead><tr><th class="l">Mes</th><th>On disp.</th><th>Δ On</th><th>Off disp.</th><th>Δ Off</th><th>Total disp.</th><th>Δ Total</th></tr></thead><tbody>${rows}</tbody>`);

  document.getElementById('tab-charts').innerHTML = html;

  setTimeout(() => {
    mkChart('ch-c1','bar',{labels:MNL,datasets:[{
      label:'Total',data:d.annual.map(a=>a.total_hrs),
      backgroundColor:d.annual.map((_,i)=>i===7?'#F26522':'#0D1B4B')
    }]},{scales:{x:{ticks:{autoSkip:false,font:{size:10}}},y:{ticks:{callback:v=>fmt(v)}}}});

    mkChart('ch-c2','bar',{labels:MNL,datasets:usedCodes.map(c=>({
      label:CODE_NAMES[c],data:d.annual.map(a=>a.abs_by_type[c]||0),
      backgroundColor:CODE_COLS[c],borderColor:'rgba(0,0,0,0.08)',borderWidth:1
    }))},{scales:{x:{stacked:true,ticks:{autoSkip:false,font:{size:10}}},y:{stacked:true,ticks:{callback:v=>fmt(v)}}}});

    mkChart('ch-c3','bar',{labels:MNL,datasets:[
      {label:'ΔOn',data:dOn,backgroundColor:dOn.map(v=>v>=0?'#0D1B4B':'#EF4444')},
      {label:'ΔOff',data:dOff,backgroundColor:dOff.map(v=>v>=0?'#F26522':'#FCA5A5')}
    ]},{scales:{x:{ticks:{autoSkip:false,font:{size:10}}},y:{ticks:{callback:v=>(v>=0?'+':'')+fmt(v)}}}});
  }, 50);
}

// ── UI HELPERS ─────────────────────────────────────────────────────────────
function showTab(id, btn) {
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b=>b.classList.remove('active'));
  document.getElementById('tab-'+id).classList.add('active');
  btn.classList.add('active');
}
window.showTab = showTab;

function showLoading(msg) {
  document.getElementById('content').style.display='none';
  document.getElementById('loading').style.display='flex';
  document.getElementById('loading-text').textContent = msg||'Cargando...';
}
function hideLoading() {
  document.getElementById('loading').style.display='none';
  document.getElementById('content').style.display='block';
}
function setLoadingText(t){ document.getElementById('loading-text').textContent=t; }
function showError(msg){ const e=document.getElementById('error-msg'); e.style.display='block'; e.textContent=msg; }
function hideError(){ document.getElementById('error-msg').style.display='none'; }
window.login=login; window.logout=logout; window.loadData=loadData;

// ── INIT ───────────────────────────────────────────────────────────────────
(async () => {
  await msalInstance.initialize();
  const resp = await msalInstance.handleRedirectPromise();
  const accounts = msalInstance.getAllAccounts();
  if(accounts.length > 0) {
    STATE.account = resp?.account || accounts[0];
    showApp();
    await loadData();
  }
})();
