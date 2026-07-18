export const APP = {
  name: 'PEPK Workspace',
  version: '0.1.0',
  sheetId: '1X3xW2pxmaoPiLX4nHVYVG8sinsUNpXlT8rk6HTtwSrk',
  fetchTimeoutMs: 8000,
  sheets: ['Resources','Workspaces','Quick_Access','Information','Synonyms','Settings']
};
export const SHEET_COLUMNS = {
  Resources:['id','title','description','type','workspace_id','url','keywords','aliases','icon','open_mode','sort_order','is_active'],
  Workspaces:['id','title','description','icon','sort_order','is_active'],
  Quick_Access:['resource_id','sort_order','is_active'],
  Information:['id','title','summary','content','sort_order','is_active'],
  Synonyms:['term','synonyms','is_active'],
  Settings:['key','value']
};
