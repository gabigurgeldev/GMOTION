/**
 * Asset browser dev-only (fora da composição — nada disso entra no render):
 *   pnpm --filter @gmotion/asset-library run browse -- --manifest ../../asset-manifest.json [--port 4567]
 * Busca por tag/tipo + grid de thumbnails + clique copia id/path.
 */
import {createServer} from 'node:http';
import {readFileSync, existsSync, createReadStream} from 'node:fs';
import {resolve, normalize, extname, sep} from 'node:path';
import process from 'node:process';
import type {AssetManifest} from './types.ts';

const args = process.argv.slice(2);
const flagValue = (name: string): string | undefined => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
};

const manifestPath = resolve(flagValue('manifest') ?? 'asset-manifest.json');
const port = Number(flagValue('port') ?? 4567);

if (!existsSync(manifestPath)) {
  console.error(`Manifesto não encontrado: ${manifestPath} — rode o indexador antes.`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as AssetManifest;
const root = resolve(manifest.root);

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4',
  '.mov': 'video/quicktime', '.webm': 'video/webm', '.mp3': 'audio/mpeg',
};

const PAGE = `<!doctype html><meta charset="utf-8"><title>gmotion assets</title>
<style>
body{font:14px system-ui;margin:0;background:#0b0b12;color:#dde}
header{position:sticky;top:0;background:#14141f;padding:12px;display:flex;gap:8px}
input,select{padding:8px;border-radius:6px;border:1px solid #334;background:#1c1c2a;color:#dde;font-size:14px}
input{flex:1}
#grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;padding:12px}
.card{background:#14141f;border-radius:8px;overflow:hidden;cursor:pointer;border:1px solid #223}
.card img{width:100%;height:110px;object-fit:cover;display:block;background:#000}
.card .meta{padding:6px 8px;font-size:11px;color:#99a}
.card .id{color:#dde;word-break:break-all}
.card:hover{border-color:#66f}
#count{padding:0 12px;color:#778}
</style>
<header><input id="q" placeholder="tags separadas por espaço (ex: 3d emoji)" autofocus>
<select id="type"><option value="">todos</option><option>video</option><option>image</option><option>lottie</option><option>audio</option></select>
<label style="align-self:center"><input type="checkbox" id="alpha" style="width:auto"> só alpha</label></header>
<div id="count"></div><div id="grid"></div>
<script>
let entries=[];
const q=document.getElementById('q'),type=document.getElementById('type'),alpha=document.getElementById('alpha');
const render=()=>{
  const tags=q.value.toLowerCase().split(/\\s+/).filter(Boolean);
  const hits=entries.filter(e=>
    (!type.value||e.type===type.value)&&
    (!alpha.checked||e.hasAlpha)&&
    tags.every(t=>e.tags.some(x=>x.startsWith(t))));
  document.getElementById('count').textContent=hits.length+' assets';
  document.getElementById('grid').innerHTML=hits.slice(0,200).map(e=>
    '<div class="card" data-id="'+e.id+'" data-path="'+e.path+'">'+
    (e.thumbnailPath?'<img loading="lazy" src="/file/'+encodeURIComponent(e.thumbnailPath)+'">':'<div style="height:110px"></div>')+
    '<div class="meta"><div class="id">'+e.id+'</div>'+e.type+(e.duration?' · '+e.duration.toFixed(1)+'s':'')+(e.hasAlpha?' · alpha':'')+'</div></div>').join('');
};
document.getElementById('grid').addEventListener('click',ev=>{
  const card=ev.target.closest('.card'); if(!card)return;
  navigator.clipboard.writeText(card.dataset.path);
  card.style.borderColor='#4f4';
  setTimeout(()=>card.style.borderColor='',400);
});
q.oninput=render; type.onchange=render; alpha.onchange=render;
fetch('/manifest').then(r=>r.json()).then(m=>{entries=m.entries;render();});
</script>`;

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);
  if (url.pathname === '/') {
    res.writeHead(200, {'content-type': 'text/html; charset=utf-8'}).end(PAGE);
    return;
  }
  if (url.pathname === '/manifest') {
    res.writeHead(200, {'content-type': 'application/json'}).end(JSON.stringify(manifest));
    return;
  }
  if (url.pathname.startsWith('/file/')) {
    const rel = decodeURIComponent(url.pathname.slice('/file/'.length));
    const abs = normalize(resolve(root, rel));
    if (!abs.startsWith(root + sep) || !existsSync(abs)) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, {'content-type': MIME[extname(abs).toLowerCase()] ?? 'application/octet-stream'});
    createReadStream(abs).pipe(res);
    return;
  }
  res.writeHead(404).end('not found');
});

server.listen(port, () => {
  console.log(`Asset browser: http://localhost:${port} (${manifest.entries.length} assets)`);
});
