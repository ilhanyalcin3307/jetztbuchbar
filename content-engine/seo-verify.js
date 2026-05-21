const fs=require('fs'),path=require('path');
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
var noCanon=0,noTwit=0,noSchema=0,noOgImg=0,noH1=0;
files.forEach(function(f){
  var h=fs.readFileSync(f,'utf8');
  if(h.indexOf('rel="canonical"')<0)noCanon++;
  if(h.indexOf('twitter:card')<0)noTwit++;
  if(h.indexOf('application/ld+json')<0)noSchema++;
  if(h.indexOf('og:image')<0)noOgImg++;
  if((h.match(/<h1[^>]*>/gi)||[]).length===0)noH1++;
});
console.log('Nach SEO-Inject:');
console.log('Canonical fehlt noch:', noCanon);
console.log('Twitter fehlt noch:', noTwit);
console.log('Schema fehlt noch:', noSchema);
console.log('og:image fehlt noch:', noOgImg);
console.log('H1 fehlt noch:', noH1);
console.log('Total Dateien:', files.length);
