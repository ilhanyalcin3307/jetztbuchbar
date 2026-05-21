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
files.forEach(function(f){
  var h=fs.readFileSync(f,'utf8');
  var rel=path.relative('.',f);
  if(h.indexOf('twitter:card')<0) console.log('NO TWITTER:', rel);
  if(h.indexOf('og:image')<0) console.log('NO OG:IMG:', rel);
  if((h.match(/<h1[^>]*>/gi)||[]).length===0) console.log('NO H1:', rel);
});
