var fs=require('fs'),path=require('path');
function getHtml(dir,files){
  files=files||[];
  fs.readdirSync(dir).forEach(function(f){
    var full=path.join(dir,f),st=fs.statSync(full);
    if(st.isDirectory()&&f[0]!=='.'&&f!=='node_modules'&&f!=='content-engine')getHtml(full,files);
    else if(f.endsWith('.html'))files.push(full);
  });
  return files;
}
var files=getHtml('.');
var noCanon=0,noTwit=0,noSchema=0,noOgImg=0,noH1=0,badJson=0;
var noCanonList=[],noTwitList=[],noH1List=[];
files.forEach(function(f){
  var h=fs.readFileSync(f,'utf8');
  var rel=path.relative('.',f);
  if(h.indexOf('rel="canonical"')<0){noCanon++;noCanonList.push(rel);}
  if(h.indexOf('twitter:card')<0){noTwit++;noTwitList.push(rel);}
  if(h.indexOf('application/ld+json')<0)noSchema++;
  if(h.indexOf('og:image')<0)noOgImg++;
  if((h.match(/<h1[^>]*>/gi)||[]).length===0){noH1++;noH1List.push(rel);}
  var re=/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  var m;
  while((m=re.exec(h))!==null){
    try{JSON.parse(m[1]);}catch(e){badJson++;console.log('INVALID JSON',rel,e.message);}
  }
});
console.log('\n=== FINALER SEO-AUDIT ===');
console.log('Total Dateien      :', files.length);
console.log('Canonical fehlt    :', noCanon, noCanonList.length?'('+noCanonList.join(', ')+')'  :'');
console.log('Twitter fehlt      :', noTwit,  noTwitList.length?'('+noTwitList.join(', ')+')'    :'');
console.log('Schema fehlt       :', noSchema);
console.log('og:image fehlt     :', noOgImg);
console.log('H1 fehlt           :', noH1,    noH1List.length?'('+noH1List.join(', ')+')'        :'');
console.log('Ungültiges JSON-LD :', badJson);
if(noCanon+noTwit+noSchema+noOgImg+noH1+badJson===0)console.log('\n✅ Alles sauber!');
