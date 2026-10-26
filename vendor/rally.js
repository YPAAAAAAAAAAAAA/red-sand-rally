/* Original procedural perspective racer. No external assets or dependencies. */
(()=>{'use strict';
const canvas=document.querySelector('#stage'),ctx=canvas.getContext('2d',{alpha:false});
const panel=document.querySelector('#panel'),toggle=document.querySelector('#toggle'),stats=document.querySelector('#stats');
let w=390,h=844,dpr=1,last=0,time=0,ready=false,drag=null,lastTap=0;
const keys={}, colors=['#54a9ad','#e8b74f','#b56183'];
let run, rivals=[], sparks=[],pulse=0,notice='',noticeTime=0;
function reset(){run={distance:0,x:0,speed:145,health:100,nitro:100,cool:0,active:false,done:false,score:0,inv:0,boost:0,elapsed:0};rivals=Array.from({length:9},(_,i)=>({z:420+i*260,x:Math.sin(i*8.7)*.68,color:colors[i%3],hit:false}));sparks=[];notice='';pulse=0;}
reset();
function resize(){w=canvas.clientWidth;h=canvas.clientHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function poly(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);ctx.fill();}
function curve(z){return Math.sin((run.distance+z)/1350)*.4+Math.sin((run.distance+z)/520)*.1;}
function point(z,x=0){const p=130/(z+130),y=h*.35+(h*.7)*p;return {x:w*.5+(curve(z)-curve(0))*(1-p)*w*.8-run.x*w*.36*p+x*w*.82*p,y,p,r:w*.82*p};}
function car(x,y,s,color,lean=0,player=false){ctx.save();ctx.translate(x,y);ctx.rotate(lean);ellipse(0,4*s,39*s,12*s,'#271e2b66');
if(player){for(let j=0;j<2;j++){const a=j?1:-1;poly([[a*19*s,2*s],[a*26*s,45*s],[a*7*s,31*s]],run.boost>0?'#79f4edaa':'#e5a16b44');}}
ctx.fillStyle='#201e2a';ctx.fillRect(-34*s,-31*s,12*s,35*s);ctx.fillRect(22*s,-31*s,12*s,35*s);
poly([[-27*s,0],[-29*s,-26*s],[-20*s,-57*s],[20*s,-57*s],[29*s,-26*s],[27*s,0]],color);
poly([[-20*s,-57*s],[-14*s,-72*s],[14*s,-72*s],[20*s,-57*s]],'#f2c7a5');
poly([[-20*s,-49*s],[-13*s,-66*s],[13*s,-66*s],[20*s,-49*s]],'#223c4c');
poly([[-18*s,-44*s],[18*s,-44*s],[23*s,-17*s],[-23*s,-17*s]],color);
ctx.fillStyle='#ffe2b4';ctx.fillRect(-4*s,-44*s,8*s,33*s);ctx.fillStyle='#292636';ctx.fillRect(-32*s,-12*s,64*s,6*s);ctx.fillRect(-22*s,-5*s,44*s,7*s);
ctx.fillStyle='#ff7059';ctx.fillRect(-23*s,-9*s,11*s,4*s);ctx.fillRect(12*s,-9*s,11*s,4*s);
if(player){ctx.fillStyle='#f6d39e';ctx.fillRect(-19*s,-34*s,38*s,3*s);ctx.fillStyle='#312631';ctx.font=`bold ${12*s}px monospace`;ctx.textAlign='center';ctx.fillText('07',0,-21*s);}
ctx.restore();}
function backdrop(){let g=ctx.createLinearGradient(0,0,0,h*.64);g.addColorStop(0,'#3b344e');g.addColorStop(.42,'#ad6674');g.addColorStop(.8,'#ffc18d');g.addColorStop(1,'#e7a068');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
const sy=h*.21,sx=w*.72,sr=w*.13;ellipse(sx,sy,sr,sr,'#ffd8a0');
ctx.fillStyle='#c17b8055';for(let i=0;i<4;i++)ctx.fillRect(sx-sr,sy+sr*.25+i*sr*.2,sr*2,2+i);
for(let layer=0;layer<3;layer++){const base=h*(.32+layer*.025),pts=[[0,h*.47]];for(let i=0;i<=18;i++){const x=i*w/18;const peak=(Math.sin(i*2.3+layer*4)*.5+.5)*w*(.09+layer*.025);pts.push([x,base-peak]);}pts.push([w,h*.47]);poly(pts,['#8c6172','#a2636b','#b76b62'][layer]);}
ctx.fillStyle='#bb7355';ctx.fillRect(0,h*.37,w,h*.63);}
function draw(){if(!w||!h)return;backdrop();
// Road strips are projected in depth, preserving the proportions of every vehicle.
for(let i=95;i>=0;i--){let z1=i*22,z2=(i+1)*22,a=point(z1),b=point(z2);const stripe=Math.floor((run.distance+z1)/110)%2;poly([[0,a.y],[w,a.y],[w,b.y],[0,b.y]],stripe?'#bd7652':'#c47e56');poly([[a.x-a.r*1.12,a.y],[a.x+a.r*1.12,a.y],[b.x+b.r*1.12,b.y],[b.x-b.r*1.12,b.y]],stripe?'#eeb681':'#9d5b4b');poly([[a.x-a.r,a.y],[a.x+a.r,a.y],[b.x+b.r,b.y],[b.x-b.r,b.y]],stripe?'#734e46':'#785149');
if(Math.floor((run.distance+z1)/65)%3!==0){for(const lane of [-.33,.33])poly([[a.x+a.r*(lane-.008),a.y],[a.x+a.r*(lane+.008),a.y],[b.x+b.r*(lane+.008),b.y],[b.x+b.r*(lane-.008),b.y]],'#d9a67c88');}}
// Rock spires and route markers, all generated from numeric shapes.
const objects=[];for(let i=0;i<32;i++){let z=((i*109-run.distance*.9)%3400+3400)%3400;objects.push({type:'rock',z,i});}for(const r of rivals)if(r.z>12&&r.z<2600&&!r.hit)objects.push({type:'car',z:r.z,r});objects.sort((a,b)=>b.z-a.z);
for(const obj of objects){if(obj.type==='car'){let p=point(obj.z,obj.r.x);car(p.x,p.y,w/390*p.p*1.7,obj.r.color);continue;}const i=obj.i,p=point(obj.z,(i%2?1:-1)*(1.28+(i%3)*.23)),s=p.p*w/390,rockH=(70+(i%5)*26)*s,rockW=(22+i%4*10)*s;
poly([[p.x-rockW,p.y],[p.x-rockW*.8,p.y-rockH*.74],[p.x-rockW*.25,p.y-rockH],[p.x+rockW*.65,p.y-rockH*.92],[p.x+rockW,p.y]],'#8c4b49');poly([[p.x-rockW*.25,p.y-rockH],[p.x+rockW*.2,p.y-rockH*.4],[p.x+rockW,p.y],[p.x+rockW*.65,p.y-rockH*.92]],'#a85b4c');
if(i%3===0){ctx.fillStyle='#e8b58a';ctx.fillRect(p.x-2*s,p.y-43*s,4*s,43*s);ctx.fillStyle='#3f4c50';ctx.fillRect(p.x-9*s,p.y-43*s,18*s,12*s);}}
const px=w*.5+run.x*w*.13,py=h*.83,scale=Math.min(w/390,h/468)*1.15;
for(let i=0;i<20;i++){const age=((time*1.4+i*.17)%1),side=i%2?1:-1;ellipse(px+side*(23+age*52)*scale-Math.sin(time+i)*8,py+age*75*scale,(5+age*19)*scale,(3+age*8)*scale,`rgba(236,166,103,${(1-age)*.13})`);}
if(pulse>0){ctx.strokeStyle=`rgba(139,255,225,${pulse})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(px,py-15,(1-pulse)*w*.9+20,(1-pulse)*h*.35+10,0,0,Math.PI*2);ctx.stroke();}
if(run.inv<=0||Math.floor(time*14)%2===0)car(px,py,scale,'#e88943',(keys.left?-1:keys.right?1:0)*(keys.drift?.13:.04),true);
for(const s of sparks){ellipse(s.x,s.y,s.life*4,s.life*4,'#ffe6a0');}
if(run.boost>0){ctx.strokeStyle='#ffe6a055';ctx.lineWidth=2;for(let i=0;i<16;i++){let x=(i*83%w),y=(time*700+i*137)%h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(x-w/2)*.06,y+25);ctx.stroke();}}
if(noticeTime>0){ctx.textAlign='center';ctx.font='700 16px system-ui';ctx.fillStyle='#fff0ce';ctx.shadowColor='#352032';ctx.shadowBlur=8;ctx.fillText(notice,w/2,h*.55);ctx.shadowBlur=0;}
if(run.done){ctx.fillStyle='#251e2cbb';ctx.fillRect(w*.1,h*.41,w*.8,76);ctx.fillStyle='#ffe2b4';ctx.textAlign='center';ctx.font='700 21px system-ui';ctx.fillText(run.health>0?'OUTPOST REACHED':'WRECKED',w/2,h*.41+29);ctx.font='12px system-ui';ctx.fillText('Open ☰ → NEW RUN',w/2,h*.41+54);}
}
function announce(s){notice=s;noticeTime=1.6;}
function activate(){if(!run.active){run.distance=0;run.active=true;}}
function boost(){if(run.nitro>=22&&!run.done){run.boost=1.1;run.nitro-=22;announce('NITRO');}}
function fire(){if(run.cool>0||run.done)return;run.cool=3;pulse=1;let hits=0;for(const r of rivals){if(r.z<700&&Math.abs(r.x-run.x)<.46&&!r.hit){r.hit=true;run.score+=150;hits++;}}announce(hits?'PULSE  +'+hits*150:'PULSE');}
function step(dt){time+=dt;noticeTime-=dt;pulse=Math.max(0,pulse-dt*1.8);run.inv-=dt;run.cool=Math.max(0,run.cool-dt);run.boost=Math.max(0,run.boost-dt);run.nitro=Math.min(100,run.nitro+dt*5);
if(!run.done){const target=keys.brake?70:run.boost>0?265:keys.drift?125:160;run.speed+=(target-run.speed)*dt*3;
if(run.active){run.elapsed+=dt;let steer=(keys.right?1:0)-(keys.left?1:0);run.x+=steer*dt*(keys.drift?1.5:.95);if(keys.drift&&steer)run.nitro=Math.min(100,run.nitro+dt*10);if(drag)run.x+=(drag.target-run.x)*Math.min(1,dt*9);run.x-=Math.cos(run.distance/1350)*dt*.08*(run.speed/160);run.x=clamp(run.x,-1.2,1.2);if(Math.abs(run.x)>1){run.speed*=1-dt*.8;run.health-=dt*5;}run.distance+=run.speed*dt;}
else{run.distance+=run.speed*dt*.55;run.x=Math.sin(time*.4)*.12;}
for(const r of rivals){r.z-=run.speed*dt*(run.active?.72:.4);if(run.active&&r.z<80&&r.z>0&&!r.hit&&Math.abs(r.x-run.x)<.24&&run.inv<=0){run.health-=22;run.inv=1.5;run.speed=65;r.hit=true;announce('IMPACT  −22');for(let i=0;i<14;i++)sparks.push({x:w/2,y:h*.78,vx:(Math.random()-.5)*200,vy:-Math.random()*170,life:1});}if(r.z< -60){if(!r.hit&&run.active)run.score+=50;r.z=2400+Math.random()*400;r.x=(Math.random()-.5)*1.5;r.hit=false;}}
if(run.active&&(run.distance>=9000||run.health<=0)){run.done=true;run.health=Math.max(0,run.health);}}
for(const s of sparks){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=dt*250;}sparks=sparks.filter(s=>s.life>0);
stats.textContent=`${Math.round(run.speed)} km/h · ♥ ${Math.ceil(run.health)} · N ${Math.floor(run.nitro)}%`;
document.querySelector('[data-key="pulse"]').textContent=run.cool>0?run.cool.toFixed(1)+'s':'PULSE';
document.querySelector('#hint').innerHTML=run.active?`${Math.min(100,Math.floor(run.distance/90))}% to outpost · ${run.score} points · ${run.elapsed.toFixed(0)}s<br>Drag to steer · double tap for nitro · hold drift to recharge`:'Drag to steer · double tap for nitro. Auto throttle.<br>Reach the outpost. Dodge rivals; pulse clears your lane.';
}
function frame(t){const dt=Math.min(.034,(t-last)/1000||.016);last=t;step(dt);draw();if(!ready&&window.__gbSandbox){window.__gbSandbox.ready();ready=true;}requestAnimationFrame(frame);}
toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));toggle.setAttribute('aria-label',panel.hidden?'Show controls and instructions':'Hide controls and instructions');});
for(const el of [panel,toggle])for(const event of ['pointerdown','pointerup','pointermove','touchstart','touchend','click'])el.addEventListener(event,e=>e.stopPropagation());
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);activate();keys[b.dataset.key]=true;b.classList.add('held');if(b.dataset.key==='nitro')boost();if(b.dataset.key==='pulse')fire();});const up=()=>{keys[b.dataset.key]=false;b.classList.remove('held');};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);});
canvas.addEventListener('pointerdown',e=>{activate();canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,start:e.clientX,base:run.x,target:run.x};if(performance.now()-lastTap<300)boost();lastTap=performance.now();});
canvas.addEventListener('pointermove',e=>{if(drag&&drag.id===e.pointerId)drag.target=clamp(drag.base+(e.clientX-drag.start)/w*2.8,-1.2,1.2);});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,e=>{if(drag?.id===e.pointerId)drag=null;});
const mapping={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowDown:'brake',s:'brake',Shift:'drift',n:'nitro',' ':'pulse'};
window.addEventListener('keydown',e=>{if(mapping[e.key]){e.preventDefault();activate();keys[mapping[e.key]]=true;if(!e.repeat){if(e.key==='n')boost();if(e.key===' ')fire();}}});window.addEventListener('keyup',e=>{keys[mapping[e.key]]=false;});
window.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);drag=null;});
document.querySelector('#restart').addEventListener('click',()=>{reset();activate();});window.addEventListener('resize',resize);resize();requestAnimationFrame(frame);
})();
