import {loadData} from '../services/data-service.js';
export async function getAppData(){const result=await loadData();const settings=Object.fromEntries((result.data.Settings||[]).map(x=>[x.key,x.value]));return{...result,updated:settings.content_updated_at||'17 Juli 2026'}}
