const xl = require('excel4node');
const db = require('../config/database');

async function generateAbsensiExcel(options = {}) {
  const { tahun_ajaran_id, kelas_id, siswa_id } = options;
  const wb = new xl.Workbook();

  // === STYLES ===
  const sHeader = wb.createStyle({
    font: { bold: true, color: '#FFFFFF', size: 11 },
    fill: { type: 'pattern', patternType: 'solid', fgColor: '#1e3a8a' },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: { left:{style:'thin'}, right:{style:'thin'}, top:{style:'thin'}, bottom:{style:'thin'} }
  });
  const sSubHeader = wb.createStyle({
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', patternType: 'solid', fgColor: '#dbeafe' },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: { left:{style:'thin'}, right:{style:'thin'}, top:{style:'thin'}, bottom:{style:'thin'} }
  });
  const sCell = wb.createStyle({
    font: { size: 10 },
    alignment: { vertical: 'center' },
    border: { left:{style:'thin',color:'#e2e8f0'}, right:{style:'thin',color:'#e2e8f0'}, top:{style:'thin',color:'#e2e8f0'}, bottom:{style:'thin',color:'#e2e8f0'} }
  });
  const sCellCenter = wb.createStyle({
    font: { size: 10 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: { left:{style:'thin',color:'#e2e8f0'}, right:{style:'thin',color:'#e2e8f0'}, top:{style:'thin',color:'#e2e8f0'}, bottom:{style:'thin',color:'#e2e8f0'} }
  });
  const sHadir = wb.createStyle({ font:{size:10,bold:true,color:'#166534'}, fill:{type:'pattern',patternType:'solid',fgColor:'#dcfce7'}, alignment:{horizontal:'center',vertical:'center'}, border:{left:{style:'thin',color:'#e2e8f0'},right:{style:'thin',color:'#e2e8f0'},top:{style:'thin',color:'#e2e8f0'},bottom:{style:'thin',color:'#e2e8f0'}} });
  const sSakit = wb.createStyle({ font:{size:10,bold:true,color:'#1e40af'}, fill:{type:'pattern',patternType:'solid',fgColor:'#dbeafe'}, alignment:{horizontal:'center',vertical:'center'}, border:{left:{style:'thin',color:'#e2e8f0'},right:{style:'thin',color:'#e2e8f0'},top:{style:'thin',color:'#e2e8f0'},bottom:{style:'thin',color:'#e2e8f0'}} });
  const sIzin  = wb.createStyle({ font:{size:10,bold:true,color:'#92400e'}, fill:{type:'pattern',patternType:'solid',fgColor:'#fef3c7'}, alignment:{horizontal:'center',vertical:'center'}, border:{left:{style:'thin',color:'#e2e8f0'},right:{style:'thin',color:'#e2e8f0'},top:{style:'thin',color:'#e2e8f0'},bottom:{style:'thin',color:'#e2e8f0'}} });
  const sAlpha = wb.createStyle({ font:{size:10,bold:true,color:'#991b1b'}, fill:{type:'pattern',patternType:'solid',fgColor:'#fee2e2'}, alignment:{horizontal:'center',vertical:'center'}, border:{left:{style:'thin',color:'#e2e8f0'},right:{style:'thin',color:'#e2e8f0'},top:{style:'thin',color:'#e2e8f0'},bottom:{style:'thin',color:'#e2e8f0'}} });
  const sTitle = wb.createStyle({ font:{bold:true,size:14,color:'#1e3a8a'}, alignment:{horizontal:'center',vertical:'center'} });
  const sPctGood = wb.createStyle({ font:{size:10,bold:true,color:'#166534'}, fill:{type:'pattern',patternType:'solid',fgColor:'#dcfce7'}, alignment:{horizontal:'center',vertical:'center'}, border:{left:{style:'thin'},right:{style:'thin'},top:{style:'thin'},bottom:{style:'thin'}} });
  const sPctWarn = wb.createStyle({ font:{size:10,bold:true,color:'#92400e'}, fill:{type:'pattern',patternType:'solid',fgColor:'#fef3c7'}, alignment:{horizontal:'center',vertical:'center'}, border:{left:{style:'thin'},right:{style:'thin'},top:{style:'thin'},bottom:{style:'thin'}} });
  const sPctBad  = wb.createStyle({ font:{size:10,bold:true,color:'#991b1b'}, fill:{type:'pattern',patternType:'solid',fgColor:'#fee2e2'}, alignment:{horizontal:'center',vertical:'center'}, border:{left:{style:'thin'},right:{style:'thin'},top:{style:'thin'},bottom:{style:'thin'}} });

  // Meta info
  let taInfo = 'Semua Semester', kelasInfo = 'Semua Kelas';
  if (tahun_ajaran_id) {
    const [ta] = await db.query('SELECT nama, semester FROM tahun_ajaran WHERE id = ?', [tahun_ajaran_id]);
    if (ta.length) taInfo = `${ta[0].nama} - ${ta[0].semester.toUpperCase()}`;
  }
  if (kelas_id) {
    const [kl] = await db.query('SELECT k.nama, j.nama as jurusan FROM kelas k JOIN jurusan j ON k.jurusan_id = j.id WHERE k.id = ?', [kelas_id]);
    if (kl.length) kelasInfo = `${kl[0].nama} (${kl[0].jurusan})`;
  }

  // Query data
  const where = ['1=1'], params = [];
  if (tahun_ajaran_id) { where.push('ah.tahun_ajaran_id = ?'); params.push(tahun_ajaran_id); }
  if (kelas_id)        { where.push('ah.kelas_id = ?');        params.push(kelas_id); }
  if (siswa_id)        { where.push('ah.siswa_id = ?');        params.push(siswa_id); }

  const [rows] = await db.query(`
    SELECT u.nama, s.nis, k.nama as kelas, j.nama as jurusan, j.kode as jurusan_kode,
           k.tingkat, ta.nama as tahun_ajaran, ta.semester,
           ah.tanggal, ah.status, ah.keterangan
    FROM absensi_harian ah
    JOIN siswa s ON ah.siswa_id = s.id
    JOIN users u ON s.user_id = u.id
    JOIN kelas k ON ah.kelas_id = k.id
    JOIN jurusan j ON k.jurusan_id = j.id
    JOIN tahun_ajaran ta ON ah.tahun_ajaran_id = ta.id
    WHERE ${where.join(' AND ')}
    ORDER BY j.nama, k.tingkat, k.nama, u.nama, ah.tanggal`, params);

  const printDate = new Date().toLocaleDateString('id-ID', {day:'2-digit',month:'long',year:'numeric'});

  // ===================== SHEET 1: REKAP PER SISWA =====================
  const wsRekap = wb.addWorksheet('Rekap Absensi');
  [30,20,5].forEach((h,i) => wsRekap.row(i+1).setHeight(h));
  wsRekap.cell(1,1,1,11,true).string(`REKAP ABSENSI - ${taInfo}`).style(sTitle);
  wsRekap.cell(2,1,2,11,true).string(`Kelas: ${kelasInfo} | Dicetak: ${printDate}`).style(sSubHeader);

  const rHdrs = ['No','NIS','Nama Siswa','Jurusan','Kelas','Hadir','Sakit','Izin','Alpha','Total','% Hadir'];
  const rWidths = [5,12,28,18,12,8,8,8,8,8,10];
  rHdrs.forEach((h,i) => { wsRekap.cell(4,i+1).string(h).style(sHeader); wsRekap.column(i+1).setWidth(rWidths[i]); });
  wsRekap.row(4).setHeight(25);

  const rekapMap = {};
  for (const row of rows) {
    const key = row.nis + '_' + row.kelas;
    if (!rekapMap[key]) rekapMap[key] = { nama:row.nama, nis:row.nis, kelas:row.kelas, jurusan:row.jurusan, hadir:0, sakit:0, izin:0, alpha:0, total:0 };
    rekapMap[key][row.status]++;
    rekapMap[key].total++;
  }
  Object.values(rekapMap).forEach((r,ri) => {
    const row = ri+5, pct = r.total ? Math.round((r.hadir/r.total)*100) : 0;
    const pStyle = pct >= 80 ? sPctGood : pct >= 60 ? sPctWarn : sPctBad;
    wsRekap.row(row).setHeight(20);
    wsRekap.cell(row,1).number(ri+1).style(sCellCenter);
    wsRekap.cell(row,2).string(r.nis||'').style(sCellCenter);
    wsRekap.cell(row,3).string(r.nama||'').style(sCell);
    wsRekap.cell(row,4).string(r.jurusan||'').style(sCell);
    wsRekap.cell(row,5).string(r.kelas||'').style(sCellCenter);
    wsRekap.cell(row,6).number(r.hadir).style(sHadir);
    wsRekap.cell(row,7).number(r.sakit).style(sSakit);
    wsRekap.cell(row,8).number(r.izin).style(sIzin);
    wsRekap.cell(row,9).number(r.alpha).style(sAlpha);
    wsRekap.cell(row,10).number(r.total).style(sCellCenter);
    wsRekap.cell(row,11).string(pct+'%').style(pStyle);
  });

  // ===================== SHEET 2: DATA HARIAN DETAIL =====================
  const wsDetail = wb.addWorksheet('Data Harian Detail');
  wsDetail.row(1).setHeight(30);
  wsDetail.cell(1,1,1,8,true).string(`DATA ABSENSI HARIAN DETAIL - ${taInfo}`).style(sTitle);
  const dHdrs = ['No','Nama Siswa','NIS','Kelas','Jurusan','Tanggal','Status','Keterangan'];
  const dWidths = [5,28,12,14,18,14,10,24];
  dHdrs.forEach((h,i) => { wsDetail.cell(2,i+1).string(h).style(sHeader); wsDetail.column(i+1).setWidth(dWidths[i]); });
  wsDetail.row(2).setHeight(25);
  rows.forEach((row,ri) => {
    const r = ri+3;
    const stStyle = row.status==='hadir'?sHadir:row.status==='sakit'?sSakit:row.status==='izin'?sIzin:sAlpha;
    wsDetail.row(r).setHeight(18);
    wsDetail.cell(r,1).number(ri+1).style(sCellCenter);
    wsDetail.cell(r,2).string(row.nama||'').style(sCell);
    wsDetail.cell(r,3).string(row.nis||'').style(sCellCenter);
    wsDetail.cell(r,4).string(row.kelas||'').style(sCellCenter);
    wsDetail.cell(r,5).string(row.jurusan||'').style(sCell);
    wsDetail.cell(r,6).string(String(row.tanggal||'').slice(0,10)).style(sCellCenter);
    wsDetail.cell(r,7).string(row.status||'').style(stStyle);
    wsDetail.cell(r,8).string(row.keterangan||'—').style(sCell);
  });

  // ===================== SHEET 3: STATISTIK PER JURUSAN =====================
  const wsJur = wb.addWorksheet('Statistik Jurusan');
  wsJur.row(1).setHeight(30);
  wsJur.cell(1,1,1,8,true).string(`STATISTIK ABSENSI PER JURUSAN - ${taInfo}`).style(sTitle);
  ['No','Jurusan','Tingkat','Total Siswa','Hadir','Sakit','Izin','Alpha'].forEach((h,i) => {
    wsJur.cell(2,i+1).string(h).style(sHeader);
    wsJur.column(i+1).setWidth(i===1?22:12);
  });
  wsJur.row(2).setHeight(25);
  const jMap = {};
  for (const row of rows) {
    const key = row.jurusan + '_' + row.tingkat;
    if (!jMap[key]) jMap[key] = { jurusan:row.jurusan, tingkat:row.tingkat, siswaSet:new Set(), hadir:0, sakit:0, izin:0, alpha:0 };
    jMap[key].siswaSet.add(row.nis);
    jMap[key][row.status]++;
  }
  Object.values(jMap).forEach((j,ji) => {
    const row = ji+3;
    wsJur.row(row).setHeight(20);
    wsJur.cell(row,1).number(ji+1).style(sCellCenter);
    wsJur.cell(row,2).string(j.jurusan).style(sCell);
    wsJur.cell(row,3).string(j.tingkat||'').style(sCellCenter);
    wsJur.cell(row,4).number(j.siswaSet.size).style(sCellCenter);
    wsJur.cell(row,5).number(j.hadir).style(sHadir);
    wsJur.cell(row,6).number(j.sakit).style(sSakit);
    wsJur.cell(row,7).number(j.izin).style(sIzin);
    wsJur.cell(row,8).number(j.alpha).style(sAlpha);
  });

  return wb;
}

module.exports = { generateAbsensiExcel };
