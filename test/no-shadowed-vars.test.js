/* Guards against the bug that blanked every canvas in the app.
 *
 *   node test/no-shadowed-vars.test.js
 *
 * renderTo() holds the canvas width in W. A later edit declared a second
 * `var W` in the same function for something else entirely. JavaScript allows
 * it without a murmur, var is function scoped, so W became an object, every
 * layout number turned into NaN and every picture came out empty. Nothing
 * threw, so nothing was caught until it was looked at on a phone.
 *
 * This flags any function that declares the same var name twice. Loop counters
 * are skipped, and anything already known and harmless is listed below.
 */
const fs=require('fs'), path=require('path');
/* argv[2] lets you point it at any build, which is how it was proved to
   fail on the version that carried the bug. */
const FILE=process.argv[2]||path.join(__dirname,'..','index.html');
const src=fs.readFileSync(FILE,'utf8');

/* Already there, already checked: two separate branches of drawBadge, each
   using px and py only within its own branch. */
const ALLOWED=new Set(['drawBadge:px']);

function strip(t){
  return t.replace(/\/\*[\s\S]*?\*\//g,' ')
          .replace(/(^|[^:])\/\/[^\n]*/g,'$1 ')
          .replace(/'(\\.|[^'\\])*'/g,"''")
          .replace(/"(\\.|[^"\\])*"/g,'""');
}
function bodies(t){
  const out=[], re=/function\s+([A-Za-z_$][\w$]*)\s*\(/g; let m;
  while((m=re.exec(t))){
    const i=t.indexOf('{',m.index); if(i<0) continue;
    let d=0;
    for(let j=i;j<t.length;j++){
      if(t[j]==='{') d++;
      else if(t[j]==='}'){ d--; if(d===0){ out.push([m[1],t.slice(i,j+1)]); break; } }
    }
  }
  return out;
}
function removeNested(body){
  let out=body, prev;
  do { prev=out; out=out.replace(/function\s*[A-Za-z_$\w]*\s*\([^)]*\)\s*\{[^{}]*\}/g,' '); }
  while(out!==prev);
  return out;
}

const hits=[];
for(const [name,raw] of bodies(strip(src))){
  const body=removeNested(raw), counts={};
  const re=/(^|[^.\w$])var\s+([A-Za-z_$][\w$]*)/g; let m;
  while((m=re.exec(body))){
    if(/for\s*\($/.test(body.slice(Math.max(0,m.index-5), m.index)+m[1])) continue;
    counts[m[2]]=(counts[m[2]]||0)+1;
  }
  for(const k in counts){
    if(counts[k]>1 && !ALLOWED.has(name+':'+k))
      hits.push('  '+name+'() declares var '+k+' '+counts[k]+' times');
  }
}

if(hits.length){
  console.log('Redeclared vars, one of these will be silently overwriting the other:\n'+hits.join('\n'));
  process.exit(1);
}
console.log('no redeclared vars');
