export const fallbackData = {
 Resources:[
  {id:'sipd-ri',title:'SIPD Republik Indonesia',description:'Akses perencanaan, penganggaran, dan pelaporan daerah.',type:'application',workspace_id:'perencanaan',url:'https://sipd-ri.kemendagri.go.id',keywords:'sipd anggaran perencanaan',aliases:'sipd ri',icon:'monitor',open_mode:'new_tab',sort_order:1,is_active:true},
  {id:'drive-dpa',title:'Dokumen DPA Dinas Kesehatan',description:'Kumpulan DPA dan dokumen pendukung pelaksanaan anggaran.',type:'document',workspace_id:'keuangan',url:'https://drive.google.com',keywords:'dpa anggaran dokumen',aliases:'dokumen pelaksanaan anggaran',icon:'folder',open_mode:'new_tab',sort_order:2,is_active:true},
  {id:'esakip',title:'e-SAKIP Kabupaten Kudus',description:'Akses penyusunan dan pemantauan dokumen akuntabilitas kinerja.',type:'application',workspace_id:'pelaporan',url:'https://esakip.kuduskab.go.id',keywords:'sakip kinerja laporan',aliases:'esakip',icon:'chart',open_mode:'new_tab',sort_order:3,is_active:true},
  {id:'standar-harga',title:'Standar Harga Satuan',description:'Referensi standar biaya dan harga satuan kegiatan.',type:'reference',workspace_id:'keuangan',url:'https://drive.google.com',keywords:'standar harga biaya shs',aliases:'shs',icon:'book',open_mode:'new_tab',sort_order:4,is_active:true},
  {id:'template-laporan',title:'Template Laporan Berkala',description:'Format laporan bulanan, triwulan, dan tahunan.',type:'document',workspace_id:'pelaporan',url:'https://drive.google.com',keywords:'template laporan bulanan triwulan',aliases:'format laporan',icon:'file',open_mode:'new_tab',sort_order:5,is_active:true},
  {id:'evaluasi-program',title:'Matriks Evaluasi Program',description:'Dokumen kerja evaluasi capaian program dan kegiatan.',type:'document',workspace_id:'evaluasi',url:'https://drive.google.com',keywords:'evaluasi program capaian kegiatan',aliases:'matriks evaluasi',icon:'check',open_mode:'new_tab',sort_order:6,is_active:true}
 ],
 Workspaces:[
  {id:'perencanaan',title:'Perencanaan',description:'Dokumen, aplikasi, dan referensi penyusunan rencana kerja.',icon:'calendar',sort_order:1,is_active:true},
  {id:'evaluasi',title:'Evaluasi',description:'Pemantauan dan evaluasi capaian program serta kegiatan.',icon:'check',sort_order:2,is_active:true},
  {id:'pelaporan',title:'Pelaporan',description:'Template dan aplikasi penyusunan laporan kinerja.',icon:'chart',sort_order:3,is_active:true},
  {id:'keuangan',title:'Keuangan',description:'Dokumen dan aplikasi pengelolaan keuangan.',icon:'wallet',sort_order:4,is_active:true}
 ],
 Quick_Access:[
  {resource_id:'sipd-ri',sort_order:1,is_active:true},{resource_id:'drive-dpa',sort_order:2,is_active:true},{resource_id:'esakip',sort_order:3,is_active:true},{resource_id:'template-laporan',sort_order:4,is_active:true}
 ],
 Information:[
  {id:'pemutakhiran-data',title:'Pemutakhiran Data Workspace',summary:'Data resource akan diperbarui secara berkala oleh pengelola PEPK.',content:'Pastikan tautan dan dokumen yang digunakan merupakan versi terbaru.',sort_order:1,is_active:true},
  {id:'akses-drive',title:'Akses Dokumen Google Drive',summary:'Beberapa dokumen membutuhkan akun resmi Dinas Kesehatan Kabupaten Kudus.',content:'Hubungi pengelola apabila akses dokumen ditolak.',sort_order:2,is_active:true}
 ], Synonyms:[{term:'anggaran',synonyms:'dpa,keuangan,biaya',is_active:true}], Settings:[{key:'content_updated_at',value:'17 Juli 2026'}]
};
