const CACHE_MS = 2 * 60 * 60 * 1000;
const SOURCES = [
  { key:'satellite', label:'Active satellites', url:'https://celestrak.org/NORAD/elements/gp.php?GROUP=ACTIVE&FORMAT=TLE' },
  { key:'debris', label:'Fengyun-1C debris', url:'https://celestrak.org/NORAD/elements/gp.php?GROUP=FENGYUN-1C-DEBRIS&FORMAT=TLE' },
  { key:'debris', label:'Iridium 33 debris', url:'https://celestrak.org/NORAD/elements/gp.php?GROUP=IRIDIUM-33-DEBRIS&FORMAT=TLE' },
  { key:'debris', label:'Cosmos 2251 debris', url:'https://celestrak.org/NORAD/elements/gp.php?GROUP=COSMOS-2251-DEBRIS&FORMAT=TLE' },
  { key:'debris', label:'General debris', url:'https://celestrak.org/NORAD/elements/gp.php?NAME=DEB&FORMAT=TLE' },
  { key:'rocket', label:'Rocket bodies', url:'https://celestrak.org/NORAD/elements/gp.php?NAME=R%2FB&FORMAT=TLE' },
  { key:'rocket', label:'Rocket stages', url:'https://celestrak.org/NORAD/elements/gp.php?NAME=STAGE&FORMAT=TLE' },
  { key:'rocket', label:'Rocket tanks', url:'https://celestrak.org/NORAD/elements/gp.php?NAME=TANK&FORMAT=TLE' }
];
const CAPS={satellite:10000,debris:7000,rocket:2500};
let cache=null;
function parseTLE(text){const l=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),o=[];for(let i=0;i<l.length;){if(l[i].startsWith('1 ')&&l[i+1]?.startsWith('2 ')){o.push({name:'UNNAMED',l1:l[i],l2:l[i+1]});i+=2}else if(l[i+1]?.startsWith('1 ')&&l[i+2]?.startsWith('2 ')){o.push({name:l[i],l1:l[i+1],l2:l[i+2]});i+=3}else i++}return o}
function id(o){return (o.l1.match(/^1\s+(\d{1,9})/)||[])[1]||o.l1}
async function source(s){const c=new AbortController(),t=setTimeout(()=>c.abort(),45000);try{const r=await fetch(s.url,{headers:{'User-Agent':'Orbital-Watch/1.0 cached catalogue'},signal:c.signal});if(!r.ok)throw Error(s.label+' HTTP '+r.status);const x=parseTLE(await r.text());if(!x.length)throw Error(s.label+' returned no TLE');return x.map(v=>({...v,category:s.key,source:s.label}))}finally{clearTimeout(t)}}
async function refresh(){const settled=await Promise.allSettled(SOURCES.map(source)),all=[],errors=[];settled.forEach((r,i)=>r.status==='fulfilled'?all.push(...r.value):errors.push({source:SOURCES[i].label,error:String(r.reason?.message||r.reason)}));const d=new Map;for(const o of all){const k=id(o),p=d.get(k);if(!p||o.category==='debris'||o.category==='rocket')d.set(k,o)}const c={satellite:[],debris:[],rocket:[]};for(const o of d.values())if(c[o.category])c[o.category].push(o);for(const k of Object.keys(c))c[k].sort((a,b)=>a.name.localeCompare(b.name));const objects=[...c.satellite.slice(0,CAPS.satellite),...c.debris.slice(0,CAPS.debris),...c.rocket.slice(0,CAPS.rocket)];if(!objects.length)throw Error('No real GP records available');cache={objects,counts:Object.fromEntries(Object.entries(c).map(([k,v])=>[k,Math.min(v.length,CAPS[k])])),sourceUpdatedAt:new Date().toISOString(),errors};return cache}
export async function onRequestGet(){try{const age=cache?Date.now()-Date.parse(cache.sourceUpdatedAt):Infinity;if(!cache||age>CACHE_MS)await refresh();return Response.json({...cache,cached:age<=CACHE_MS},{headers:{'Cache-Control':'public, max-age=300'}})}catch(e){if(cache)return Response.json({...cache,cached:true,stale:true,refreshError:String(e.message||e)});return Response.json({error:'LIVE_CATALOGUE_UNAVAILABLE',message:String(e.message||e)},{status:503})}}
