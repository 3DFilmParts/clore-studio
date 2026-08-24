/* Export logic checks for CLORE Studio.
 *
 *   node test/export-logic.test.js
 *
 * These do not reimplement anything. Each function is lifted out of the shipped
 * index.html and run as it stands, so if a check fails the app is wrong, not the
 * test. Rendering needs a canvas and is not covered here; what is covered is the
 * arithmetic that decides how many files a run makes, which photo leads each of
 * them, what they are called and which ones are ticked.
 */
const fs=require('fs');
const path=require("path");
const src=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");

// Pull the real function source out of the shipped file. No reimplementation:
// if these do not behave, the app does not behave.
function grab(name){
  const i=src.indexOf("function "+name+"(");
  if(i<0) throw new Error("not found: "+name);
  let d=0,started=false;
  for(let j=i;j<src.length;j++){
    if(src[j]==='{'){d++;started=true;}
    else if(src[j]==='}'){d--; if(started&&d===0) return src.slice(i,j+1);}
  }
  throw new Error("unbalanced: "+name);
}
const names=["allStillFormats","clean","sentences","systemsIn","bestSentences","autoSub","itemFor","subPool","subLineFor","wordsFor","photoWordsEdited","imagesFor","heroCountFor","postList","postOn","selectedPosts","totalPosts","fileName","stillFormats","outputFormats"];
const code=names.map(grab).join("\n");

// stubs
var S={ownImages:[],picked:[],items:{},export:{perPhoto:true},exOff:{},intents:['post']};
var INTENTS=[{id:'post',fmt:['portrait']}];
// the real table, lifted straight out of the shipped file
var FORMATS=(function(){
  const m=src.match(/var FORMATS = \{[\s\S]*?\n\};/);
  if(!m) throw new Error("FORMATS not found");
  return eval("("+m[0].replace(/^var FORMATS = /,"").replace(/;$/,"")+")");
})();
var CATALOG={
  snapmark:{handle:'snapmark',title:'Snapmark',type:'Clapper',price:'$79',tags:[],facts:[],sents:[],
            images:['a1','a2','a3','a4','a5','a6','a7','a8','a9','a10','a11','a12']},
  tmarker :{handle:'tmarker', title:'T Marker',type:'Marker',price:'$6.50',tags:[],facts:[],sents:[],
            images:['b1','b2','b3']},
  onepic  :{handle:'onepic',  title:'One Pic',type:'Other',price:'$1',tags:[],facts:[],sents:[],
            images:['c1']}
};
function productByHandle(h){ return CATALOG[h]||null; }
var SUB_MAX=92;
var SYSTEMS=(function(){
  const m=src.match(/var SYSTEMS = \[[\s\S]*?\n\];/);
  return eval("("+m[0].replace(/^var SYSTEMS = /,"").replace(/;$/,"")+")");
})();
function slug(x){ return String(x).toLowerCase().replace(/[^a-z0-9]+/g,'-'); }
eval(code);

let fail=0;
function eq(got,want,label){
  const g=JSON.stringify(got), w=JSON.stringify(want);
  if(g!==w){ fail++; console.log("FAIL "+label+"\n  got  "+g+"\n  want "+w); }
  else console.log("pass  "+label);
}

// 1. hero rotation keeps order and wraps
eq(imagesFor(itemFor('tmarker'),0),['b1','b2','b3'],"hero 0 is the natural order");
eq(imagesFor(itemFor('tmarker'),1),['b2','b3','b1'],"hero 1 leads, rest wrap");
eq(imagesFor(itemFor('tmarker'),2),['b3','b1','b2'],"hero 2 leads, rest wrap");
eq(imagesFor(itemFor('tmarker'),9),['b1','b2','b3'],"out of range hero is ignored, not blank");

// 2. imgSel is respected, and rotation happens within the picked set
S.items.snapmark={imgSel:[5,1,3]};
eq(imagesFor(itemFor('snapmark'),0),['a6','a2','a4'],"picked photos, in the order tapped");
eq(imagesFor(itemFor('snapmark'),1),['a2','a4','a6'],"rotation stays inside the picked set");

// 3. one post per photo
S.picked=['snapmark','tmarker'];
eq(postList().length,3+3,"6 posts: 3 picked photos + 3 photos");
eq(postList().map(p=>p.hero),[0,1,2,0,1,2],"every photo gets its turn as hero");

// 4. per photo off is the old behaviour, exactly
S.export.perPhoto=false;
eq(postList().length,2,"per photo off gives one post per product");
eq(postList().map(p=>p.hero),[0,0],"and each is led by its first photo");
S.export.perPhoto=true;

// 5. a single photo product does not produce a duplicate
S.picked=['onepic'];
eq(postList().length,1,"one photo, one post");

// 6. two sizes multiply, and nothing collides in the filenames
S.intents=['post']; INTENTS=[{id:'post',fmt:['portrait','story']}];
S.picked=['tmarker'];
eq(postList().length,6,"3 photos across 2 sizes is 6 files");
const names2=postList().map(p=>fileName(p.handle,p.fmt,'png',p.hero));
eq(new Set(names2).size,6,"all 6 filenames are distinct");
eq(names2[0],"tmarker_undefined_portrait.png","hero 0 keeps the original name shape");
console.log("   sample names:",names2.join(", "));

// 7. deselection
S.exOff={}; eq(selectedPosts().length,6,"everything starts ticked");
S.exOff[postList()[0].id]=1;
eq(selectedPosts().length,5,"tapping one leaves it out");
eq(totalPosts(),6,"total still counts every post, ticked or not");
// a newly added photo arrives ticked rather than silently sitting out
S.picked=['tmarker','onepic'];
eq(selectedPosts().length,5+2,"a product added later is ticked automatically");


// ---- regression: the export badge read 0 for every card ----
// postList() hands back new objects each call, so an indexOf of a selectedPosts()
// object against the grid's own allPosts array can never match.
S.intents=['post']; INTENTS=[{id:'post',fmt:['portrait']}];
S.export.fmts=null; S.exOff={}; S.picked=['tmarker'];
{
  const allPosts=postList(), selPosts=selectedPosts();
  eq(selPosts.indexOf(allPosts[0]), -1, "object identity across calls does not hold (this is why it read 0)");
  const selPos={}; selPosts.forEach((p,i)=>{ selPos[p.id]=i+1; });
  eq(allPosts.map(p=>selPos[p.id]||0), [1,2,3], "id lookup gives the real running order");
  S.exOff[allPosts[0].id]=1;
  const sel2=selectedPosts(), pos2={}; sel2.forEach((p,i)=>{ pos2[p.id]=i+1; });
  eq(allPosts.map(p=>pos2[p.id]||0), [0,1,2], "dropping the first renumbers the rest");
  S.exOff={};
}

// ---- sizes are choosable at export ----
eq(stillFormats(), ['portrait'], "with no override the intent still decides");
S.export.fmts=['square','portrait'];
eq(stillFormats(), ['square','portrait'], "an override wins");
eq(postList().length, 3*2, "3 photos across 2 chosen sizes is 6 files");
S.export.fmts=['square','reel','portrait'];
eq(stillFormats(), ['square','portrait'], "reel is never a still, even if it gets in the list");
S.export.fmts=['square','nonsense'];
eq(stillFormats(), ['square'], "an unknown size is dropped rather than crashing the run");
S.export.fmts=[];
eq(stillFormats(), ['portrait'], "an empty override falls back instead of making nothing");
S.export.fmts=null;
eq(allStillFormats().indexOf('reel'), -1, "reel is not offered as a still size");
eq(allStillFormats().length, 5, "five still sizes are offered");


// ---- the line that sits inside the artwork ----
CATALOG.blurb={
  handle:'blurb', title:'Tilta Boulder Film Cart Tumbler Holder', type:'Tumbler', price:'$49',
  tags:['Tilta','made in melbourne'],
  facts:['Holds a 32oz bottle.','Bolts on with two 1/4-20 screws.'],
  sents:[
    "Keep your drink secure and within arm's reach on even the busiest productions.",
    "It bolts straight onto the Tilta Boulder cart without any drilling.",
    "Short.",
    "This is a deliberately very long sentence written so that it comfortably exceeds the ninety two character ceiling that the artwork line has to respect."
  ]
};
S.items={}; S.picked=['blurb'];
{
  const pool=subPool('blurb');
  eq(pool.every(l=>l.length<=SUB_MAX), true, "no candidate is too long for the artwork line");
  eq(pool.every(l=>l.length>=8), true, "and none is a stray fragment");
  eq(pool.some(l=>/\.\.\.|\u2026/.test(l)), false, "nothing was trimmed with an ellipsis");
  eq(pool.includes("Short."), false, "the too short line is left out");
  eq(pool.some(l=>l.length>SUB_MAX), false, "the too long line is left out rather than cut");
  eq(new Set(pool).size, pool.length, "no duplicates in the pool");
  eq(pool.includes("Fits Tilta."), true, "a system named in the title becomes a candidate");
  eq(pool.includes("Made in Melbourne."), true, "the made in tag becomes a candidate");
  eq(pool.length>=4, true, "there is something to shuffle through");

  // cycling, never the same twice running
  const seq=[0,1,2,3,4,5].map(i=>subLineFor('blurb',i));
  eq(seq.every((v,i)=> i===0 || v!==seq[i-1]), true, "consecutive shuffles never repeat");
}

// ---- per photo words ----
S.items.blurb={imgSel:[0,1,2]};
{
  const a=wordsFor('blurb',0), b=wordsFor('blurb',1), c=wordsFor('blurb',2);
  eq(a.sub!==b.sub && b.sub!==c.sub, true, "each photo gets a different line by default");
  eq(a.headline, CATALOG.blurb.title, "the headline defaults to the product title");

  // a line written for the product applies to every photo
  S.items.blurb.sub="One line for all of them.";
  eq([0,1,2].map(i=>wordsFor('blurb',i).sub),
     ["One line for all of them.","One line for all of them.","One line for all of them."],
     "a line typed for the product wins on every photo");

  // a line written for one photo beats that
  S.items.blurb.words={1:{sub:"Just this one."}};
  eq(wordsFor('blurb',1).sub, "Just this one.", "a line typed for one photo wins over the product line");
  eq(wordsFor('blurb',0).sub, "One line for all of them.", "and leaves the other photos alone");
  eq(photoWordsEdited('blurb',1), true, "the edited photo is marked");
  eq(photoWordsEdited('blurb',0), false, "an untouched photo is not");

  S.items.blurb.words[2]={headline:"A different title"};
  eq(wordsFor('blurb',2).headline, "A different title", "a headline can differ per photo");
  eq(wordsFor('blurb',0).headline, CATALOG.blurb.title, "without touching the others");

  // clearing a photo returns it to the shared line
  delete S.items.blurb.words[1];
  eq(wordsFor('blurb',1).sub, "One line for all of them.", "clearing a photo falls back to the product line");
  delete S.items.blurb.sub;
  eq(wordsFor('blurb',1).sub!==wordsFor('blurb',0).sub, true, "and clearing that returns it to cycling");
}

// a product with no usable copy must not throw
CATALOG.bare={handle:'bare',title:'Bare',type:'',price:'',tags:[],facts:[],sents:[]};
eq(subPool('bare'), [], "a product with no copy gives an empty pool");
eq(subLineFor('bare',3), "", "and shuffling it is harmless");
eq(typeof wordsFor('bare',2).headline, "string", "words still resolve for it");

console.log(fail? "\n"+fail+" FAILED" : "\nall green");
process.exit(fail?1:0);
