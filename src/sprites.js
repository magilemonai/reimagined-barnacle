(function(){
var P=window.C;
function dp(x,rows,pal,ox,oy){
for(var r=0;r<rows.length;r++)for(var c=0;c<rows[r].length;c++){
var ch=rows[r][c];if(ch==='.'||!pal[ch])continue;
x.fillStyle=pal[ch];x.fillRect(ox+c,oy+r,1,1);}}
function rn(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
window.Sprites={
cache:{},
create(key,w,h,fn){var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');fn(x);this.cache[key]=c;return c;},
get(key){return this.cache[key];},
draw(ctx,key,x,y,flip){var s=this.cache[key];if(!s){ctx.fillStyle='#ff00ff';ctx.fillRect(x,y,16,16);return;}
if(flip){ctx.save();ctx.scale(-1,1);ctx.drawImage(s,-x-s.width,y);ctx.restore();}else{ctx.drawImage(s,x,y);}},
init(){
var S=this;
// Characters - build frames from parts
function makeChar(name,pl){
var hd=['....hhhh....','...hhhhhh...'],
fd=hd.concat(['...skhskh...','...ssssss...']),
fu=hd.concat(['...hhhhhh...','...hhhhhh...']),
fr=['....hhhh....','...hhhhhs...','...hhkhss...','...ssssss...'],
body=['..aabbbbaa..','..aabbbbaa..','..aabbbbaa..','...bbbbbb...'],
bR=['..aabbbbss..','..aabbbb....','..aabbbb....','...bbbbb....'],
l0=['...dd..dd...','...dd..dd...','...oo..oo...','...oo..oo...'],
l1=['..dd....dd..','..dd....dd..','..oo....oo..','..oo....oo..'],
lR0=['...dd.dd....','...dd.dd....','...oo.oo....','...oo.oo....'],
lR1=['..dd..dd....','..dd...dd...','..oo...oo...','..oo...oo...'],
atk='wwwwwwwwwwww',
rtW=['..aabbbb.w..','...bbbbb.w..','...dd.dd.w..','...dd.dd....','...oo.oo....','...oo.oo....'];
var F={};
F.down_0=fd.concat(body,l0);F.down_1=fd.concat(body,l1);
F.down_atk=fd.concat(body,l0.slice(0,3).concat([atk]));
F.up_0=fu.concat(body,l0);F.up_1=fu.concat(body,l1);
F.up_atk=fu.concat(body,l0.slice(0,3).concat([atk]));
F.right_0=fr.concat(bR,lR0);F.right_1=fr.concat(bR,lR1);
F.right_atk=fr.concat(['..aabbbbss..','..aabbbb....'].concat(rtW));
for(var k in F)S.create(name+'_'+k,16,24,function(f){return function(x){dp(x,f,pl,2,0);};}(F[k]));}
makeChar('daxon',{h:P.tan,a:P.gray,b:P.blue,d:P.darkGray,o:P.brown,s:P.skin,k:P.darkGray,w:P.lightGray});
makeChar('luigi',{h:P.black,a:P.darkPurple,b:P.purple,d:P.darkGray,o:P.darkBrown,s:P.paleSkin,k:P.teal,w:P.teal});
makeChar('lirielle',{h:P.lightGray,a:P.green,b:P.brown,d:P.darkGray,o:P.darkBrown,s:P.paleSkin,k:P.darkGreen,w:P.lightBrown});

// NPCs
function makeNPC(n,rows,pal){S.create(n,16,24,function(x){dp(x,rows,pal,0,0);});}
makeNPC('npc_fawks',['......hhhh..','.....hhhhhh.','....ssksskh.','....ssssss..','...oowwwwoo.','...oowwwwoo.','...oowwwwoo.','....wwwwww..','....dd..dd..','....dd..dd..','....bb..bb..','....bb..bb..'],{h:P.brown,s:P.skin,k:P.darkGray,o:P.gold,w:P.white,d:P.darkGray,b:P.darkBrown});
makeNPC('npc_soren',['....gggggg..','...gggggggg.','...gkgkgg...','...ggsggg...','..rrbbbbbb..','..rrbbbbbb..','..rrbbbbbb..','...bbbbbb...','.....dd.dd..','....dd..dd..','....bb..bb..','....bb..bb..'],{g:P.gray,k:P.darkYellow,s:P.pink,r:P.brown,b:P.brown,d:P.darkBrown});
makeNPC('npc_braxon',['....bbbbbb..','...bbbbbbbb.','...ssksskb..','...ssssss..','..llssssssll','..llssssll..','..llssssll..','...ssssss...','...dd..dd...','...dd..dd...','...bb..bb...','...bb..bb...'],{b:P.brown,s:P.skin,k:P.darkGray,l:P.lightBrown,d:P.darkGray});
makeNPC('npc_helena',['............','............','............','............','....bbbb....','...bbbbbb...','...skskbb...','...ssssb....','..uuuuuuuu..','..uuuuuuuu..','...uuuuuu..','...dd..dd...'],{b:P.lightBrown,s:P.skin,k:P.darkGray,u:P.blue,d:P.darkBrown});
makeNPC('npc_querubra',['..gggggggg..','..gggggggg..','.ggggggggg..','.ggggggggg..','...bbbbbb...','...bybbby...','...bbbbbb...','...bbmbbb...','...bbbbbb...','...bbbbbb...','....bbbb....','....bbbb....'],{g:P.green,b:P.brown,y:P.gold,m:P.darkBrown});
makeNPC('npc_rorik',['....aaaa....','...aaaaaa...','...sksk.a...','...ssss.....','...rrrrrr..','..aarrrrraa.','..aaaaaaaa..','..aaaaaaaa..','...dd..dd...','...dd..dd...','..bbb..bbb..','..bbb..bbb..'],{a:P.gray,s:P.skin,k:P.darkGray,r:P.red,d:P.darkGray,b:P.darkBrown});
makeNPC('npc_elira',['....hhhhh...','...hhhhhhhh.','...skskh....','...ssssh....','..aauuuuaa..','..aauuuuaa..','..aauuuuaa..','...uuuuuu..','...dd..dd...','...dd..dd...','...aa..aa...','...aa..aa...'],{h:P.brown,s:P.skin,k:P.darkGray,a:P.gray,u:P.blue,d:P.darkGray});

// NPC aliases (maps reference these names)
S.cache['npc_elira_voss']=S.cache['npc_elira'];
S.cache['npc_brother_soren']=S.cache['npc_soren'];
S.cache['npc_mayor_helena']=S.cache['npc_helena'];

// Enemies
var gB=['....gggg....','...gggggg...','...grrg.g...','...gggg.....','..bbggggbb..','..bbgggg.b..','...gggggg...'];
var gP={g:P.green,G:P.darkGreen,r:P.red,b:P.brown,B:P.darkBrown,k:P.black};
function gob(n,legs,wpY,wpH){S.create(n,16,16,function(x){dp(x,gB.concat(legs),gP,0,0);x.fillStyle=P.brown;x.fillRect(12,wpY,2,wpH);});}
gob('goblin_0',['...gg..gg...','...gg..gg...','...BB..BB...'],3,7);
gob('goblin_1',['..gg....gg..','..gg....gg..','..BB....BB..'],3,7);
gob('goblin_atk',['...gg..gg...','...gg..gg...','...BB..BB...'],0,10);
var sB=['....gggg....','...gggggg...','...grrg.g...','..wgggggw...','..kbggggbk..','..kbgggg.k..','...gggggg...'];
var sP={g:P.darkGreen,r:P.red,b:P.darkBrown,w:P.white,k:P.darkGray};
function sc(n,legs,blX,blY,blW,blH){S.create(n,16,16,function(x){dp(x,sB.concat(legs),sP,0,0);x.fillStyle=P.lightGray;x.fillRect(blX,blY,blW,blH);});}
sc('spinecleaver_0',['...gg..gg...','...gg..gg...','...kk..kk...'],13,1,2,9);
sc('spinecleaver_1',['..gg....gg..','..gg....gg..','..kk....kk..'],13,1,2,9);
S.create('spinecleaver_atk',16,16,function(x){dp(x,sB.concat(['...gg..gg...','...gg..gg...','...kk..kk...']),sP,0,0);x.fillStyle=P.lightGray;x.fillRect(13,0,3,5);x.fillStyle=P.white;x.fillRect(14,0,1,4);});

// Boss
var bP={g:P.darkGreen,G:P.black,r:P.red,R:P.darkRed,c:P.gray,i:P.lightGray,w:P.white,k:P.darkGray};
var bD=['........cccccccc........','......cciicciicc........','......gggggggggggg......','.....gggggggggggggg.....','.....gGrrGggGrrGgg.....','....gggggggggggggggg....','....ggggggwwgggggg.....','...RRRRggggggggRRRR....','...RRkRRRRRRRRRkRR....','...RRkRRRRRRRRRkRR....','...RRRRRRRRRRRRRkRR...','....RRRRRRRRRRRRRR.....','....RRRRRRRRRRRRRR.....','....RRRRRRRRRRRR.......','....gggg....gggg........','....gggg....gggg........','....kkkk....kkkk........'];
function boss(n,fn){S.create(n,32,32,function(x){dp(x,bD,bP,4,2);fn(x);});}
boss('bargnot_0',function(x){x.fillStyle=P.red;x.fillRect(26,8,2,14);x.fillStyle=P.gold;x.fillRect(25,6,4,3);});
boss('bargnot_1',function(x){x.fillStyle=P.red;x.fillRect(26,8,2,14);x.fillStyle=P.gold;x.fillRect(25,6,4,3);x.fillStyle=P.darkGreen;x.fillRect(8,28,4,4);x.fillRect(18,28,4,4);});
boss('bargnot_atk',function(x){x.fillStyle=P.red;x.fillRect(26,2,2,18);x.fillStyle=P.gold;x.fillRect(25,0,4,3);x.globalAlpha=0.5;x.fillStyle=P.red;x.fillRect(23,0,8,5);x.globalAlpha=1;});
boss('bargnot_rage',function(x){x.fillStyle=P.red;x.fillRect(26,8,2,14);x.fillStyle=P.gold;x.fillRect(25,6,4,3);for(var i=0;i<20;i++){x.fillStyle=i%2?P.red:P.gold;x.fillRect(rn(0,31),rn(0,31),2,2);}});
S.create('bargnot_shadow',32,32,function(x){var sp=Object.assign({},bP,{r:P.purple,R:P.darkPurple,g:P.darkPurple,G:P.black});dp(x,bD,sp,4,2);x.fillStyle=P.purple;x.fillRect(26,8,2,14);for(var i=0;i<12;i++){x.fillStyle=P.lightPurple;x.globalAlpha=0.4+Math.random()*0.4;x.fillRect(rn(0,31),rn(0,31),2,3);}x.globalAlpha=1;});

// Tiles
function mt(n,fn){S.create('tile_'+n,16,16,fn);}
function dots(x,col,n){x.fillStyle=col;for(var i=0;i<n;i++)x.fillRect(rn(0,15),rn(0,15),1,1);}
function fill(x,c){x.fillStyle=c;x.fillRect(0,0,16,16);}
function circ(x,cx,cy,r,c){x.fillStyle=c;x.beginPath();x.arc(cx,cy,r,0,Math.PI*2);x.fill();}
mt('grass_light',function(x){fill(x,P.lightGreen);dots(x,P.green,12);});
mt('grass_dark',function(x){fill(x,P.green);dots(x,P.darkGreen,12);});
mt('path',function(x){fill(x,P.tan);dots(x,P.lightBrown,10);});
mt('water',function(x){fill(x,P.blue);dots(x,P.lightBlue,8);dots(x,P.white,3);});
mt('water_1',function(x){fill(x,P.blue);dots(x,P.lightBlue,10);x.fillStyle=P.white;x.fillRect(rn(1,12),rn(1,12),2,1);x.fillRect(rn(1,12),rn(1,12),1,2);x.fillRect(rn(1,12),rn(1,12),2,1);});
mt('tree',function(x){fill(x,P.lightGreen);dots(x,P.green,8);x.fillStyle=P.brown;x.fillRect(6,10,4,6);circ(x,8,7,6,P.darkGreen);circ(x,7,6,4,P.green);});
mt('bush',function(x){fill(x,P.lightGreen);circ(x,8,10,6,P.darkGreen);circ(x,7,9,5,P.green);});
mt('flowers',function(x){fill(x,P.lightGreen);dots(x,P.green,8);var fc=[P.red,P.yellow,P.pink,P.lightPurple,P.white];for(var i=0;i<7;i++){x.fillStyle=fc[i%5];x.fillRect(rn(1,14),rn(1,14),2,2);}});
mt('wood_wall',function(x){fill(x,P.brown);x.fillStyle=P.darkBrown;for(var i=0;i<16;i+=4)x.fillRect(0,i,16,1);});
mt('wood_floor',function(x){fill(x,P.lightBrown);x.fillStyle=P.tan;for(var i=0;i<16;i+=4)x.fillRect(0,i,16,1);dots(x,P.brown,6);});
mt('wood_door',function(x){fill(x,P.darkBrown);x.fillStyle=P.brown;x.fillRect(2,1,12,15);x.fillStyle=P.gold;x.fillRect(10,8,2,2);});
mt('stone_wall',function(x){fill(x,P.gray);x.fillStyle=P.darkGray;for(var r=0;r<4;r++){var y=r*4;x.fillRect(0,y,16,1);for(var c=r%2?4:0;c<16;c+=8)x.fillRect(c,y,1,4);}});
mt('stone_floor',function(x){fill(x,P.lightGray);x.fillStyle=P.gray;x.fillRect(0,0,16,1);x.fillRect(0,8,16,1);x.fillRect(0,0,1,16);x.fillRect(8,0,1,16);});
mt('fence',function(x){fill(x,P.lightGreen);x.fillStyle=P.brown;x.fillRect(1,4,2,12);x.fillRect(13,4,2,12);x.fillRect(0,6,16,2);x.fillRect(0,11,16,2);});
mt('well',function(x){fill(x,P.lightGreen);circ(x,8,8,5,P.gray);circ(x,8,8,3,P.darkGray);circ(x,8,8,2,P.black);});
mt('market_stall',function(x){fill(x,P.lightBrown);for(var i=0;i<4;i++){x.fillStyle=i%2?P.white:P.red;x.fillRect(i*4,0,4,6);}x.fillStyle=P.brown;x.fillRect(0,6,16,2);});
mt('temple_wall',function(x){fill(x,P.darkStone);x.fillStyle=P.black;for(var r=0;r<4;r++){var y=r*4;x.fillRect(0,y,16,1);for(var c=r%2?4:0;c<16;c+=8)x.fillRect(c,y,1,4);}});
mt('temple_floor',function(x){fill(x,P.stone);x.fillStyle=P.darkStone;x.fillRect(0,0,16,1);x.fillRect(0,8,16,1);x.fillRect(0,0,1,16);x.fillRect(8,0,1,16);dots(x,P.lightStone,4);});
mt('temple_door',function(x){fill(x,P.darkGray);x.fillStyle=P.black;x.fillRect(2,0,12,16);x.fillStyle=P.gray;x.fillRect(2,4,12,1);x.fillRect(2,10,12,1);x.fillRect(7,0,2,16);});
mt('altar',function(x){fill(x,P.stone);x.fillStyle=P.darkStone;x.fillRect(3,4,10,8);x.fillStyle=P.lightStone;x.fillRect(4,5,8,6);x.fillStyle=P.darkPurple;x.fillRect(6,6,1,1);x.fillRect(9,6,1,1);x.fillRect(7,8,2,1);});
mt('pillar',function(x){fill(x,P.stone);circ(x,8,8,5,P.gray);circ(x,7,7,3,P.lightGray);});
mt('torch',function(x){fill(x,P.darkStone);x.fillStyle=P.darkGray;for(var r=0;r<4;r++)x.fillRect(0,r*4,16,1);x.fillStyle=P.brown;x.fillRect(7,6,2,8);x.fillStyle=P.gold;x.fillRect(6,3,4,4);x.fillStyle=P.yellow;x.fillRect(7,2,2,3);});
mt('chest',function(x){fill(x,P.stone);x.fillStyle=P.brown;x.fillRect(3,6,10,8);x.fillStyle=P.darkBrown;x.fillRect(3,6,10,1);x.fillRect(3,9,10,1);x.fillStyle=P.gold;x.fillRect(7,8,2,2);});
mt('statue',function(x){fill(x,P.stone);x.fillStyle=P.gray;x.fillRect(6,2,4,4);x.fillRect(5,6,6,6);x.fillRect(6,12,4,3);x.fillStyle=P.lightGray;x.fillRect(7,3,2,2);});
mt('bridge',function(x){fill(x,P.blue);x.fillStyle=P.lightBrown;for(var i=0;i<4;i++)x.fillRect(0,i*4,16,3);x.fillStyle=P.darkBrown;for(var i=0;i<4;i++)x.fillRect(0,i*4+3,16,1);});
mt('roof',function(x){fill(x,P.darkRed);for(var r=0;r<8;r++){x.fillStyle=P.brown;x.fillRect(0,r*2,16,1);x.fillStyle=P.darkBrown;for(var c=r%2?2:0;c<16;c+=4)x.fillRect(c,r*2,1,2);}});
mt('sign',function(x){fill(x,P.lightGreen);dots(x,P.green,6);x.fillStyle=P.brown;x.fillRect(7,8,2,8);x.fillStyle=P.tan;x.fillRect(3,3,10,6);x.fillStyle=P.darkBrown;x.strokeStyle=P.darkBrown;x.lineWidth=1;x.strokeRect(3.5,3.5,9,5);});
mt('carpet',function(x){fill(x,P.darkRed);x.fillStyle=P.gold;[0,15].forEach(function(v){x.fillRect(0,v,16,1);x.fillRect(v,0,1,16);});x.fillRect(2,2,12,1);x.fillRect(2,13,12,1);x.fillRect(2,2,1,12);x.fillRect(13,2,1,12);});
mt('dark',function(x){fill(x,P.black);});

// Items
function mi(n,fn){S.create('item_'+n,16,16,fn);}
function hrt(x,cx,cy,r,c){x.fillStyle=c;x.beginPath();x.moveTo(cx,cy+r);x.bezierCurveTo(cx-r,cy+r*0.4,cx-r,cy-r*0.6,cx-r*0.4,cy-r*0.6);x.bezierCurveTo(cx-r*0.1,cy-r,cx,cy-r*0.4,cx,cy-r*0.1);x.bezierCurveTo(cx,cy-r*0.4,cx+r*0.1,cy-r,cx+r*0.4,cy-r*0.6);x.bezierCurveTo(cx+r,cy-r*0.6,cx+r,cy+r*0.4,cx,cy+r);x.fill();}
mi('heart',function(x){hrt(x,8,8,6,P.red);});
mi('heart_half',function(x){hrt(x,8,8,6,P.red);x.fillStyle=P.gray;x.fillRect(8,0,8,16);hrt(x,8,8,6,P.red);x.save();x.beginPath();x.rect(8,0,8,16);x.clip();hrt(x,8,8,6,P.gray);x.restore();});
mi('heart_empty',function(x){x.strokeStyle=P.gray;x.lineWidth=1.5;x.beginPath();x.moveTo(8,14);x.bezierCurveTo(1,10,1,3,5,3);x.bezierCurveTo(7,1,8,3,8,5);x.bezierCurveTo(8,3,9,1,11,3);x.bezierCurveTo(15,3,15,10,8,14);x.stroke();});
mi('eldertech',function(x){circ(x,8,8,6,P.darkTeal);circ(x,8,8,4,P.teal);circ(x,7,6,2,P.paleGreen);});
mi('crown',function(x){x.fillStyle=P.gold;x.fillRect(3,8,10,5);x.fillRect(3,5,2,3);x.fillRect(7,4,2,4);x.fillRect(11,5,2,3);x.fillStyle=P.red;x.fillRect(7,9,2,2);});
mi('cape',function(x){x.fillStyle=P.purple;x.fillRect(4,2,8,12);x.fillRect(3,4,10,8);x.fillStyle=P.darkPurple;x.fillRect(5,3,6,2);x.fillStyle=P.red;x.fillRect(5,12,6,2);});
mi('scepter',function(x){x.fillStyle=P.gold;x.fillRect(7,4,2,10);x.fillRect(5,2,6,3);x.fillStyle=P.blue;x.fillRect(7,2,2,2);x.fillStyle=P.lightBlue;x.fillRect(7,2,1,1);});
mi('potion',function(x){x.fillStyle=P.gray;x.fillRect(6,2,4,3);x.fillStyle=P.red;x.fillRect(5,5,6,8);x.fillRect(4,7,8,4);x.fillStyle=P.lightRed;x.fillRect(6,6,2,3);});
mi('silencestone',function(x){circ(x,8,8,6,P.darkGray);circ(x,8,8,4,P.black);var ic=[P.lightPurple,P.lightBlue,P.paleGreen];for(var i=0;i<8;i++){x.fillStyle=ic[i%3];x.fillRect(rn(4,11),rn(4,11),1,1);}});
mi('key',function(x){x.fillStyle=P.gold;x.fillRect(5,3,2,10);x.fillRect(7,11,4,1);x.fillRect(7,9,3,1);circ(x,6,4,2.5,P.darkYellow);circ(x,6,4,1.5,P.gold);});
}};
})();
