<script>
(function(){
function initLogo(canvas,size,speed,mono){
if(!canvas||canvas.dataset.z6)return;canvas.dataset.z6='1';
const ctx=canvas.getContext('2d',{alpha:true});let width=size,height=size;let cx=width/2,cy=height/2;let dotSize=1.0;
function initCanvas(){const dpr=window.devicePixelRatio||1;canvas.width=width*dpr;canvas.height=height*dpr;ctx.scale(dpr,dpr);dotSize=Math.max(1.0,1.5/dpr)}initCanvas();
let pDrive=2.0,pZoom=1.1,baseGamma=1.0,targetGamma=1.0,pGamma=1.0,baseUpdate=1.0,targetUpdate=1.0,pUpdate=1.0;
let lastMouse={x:window.innerWidth/2,y:window.innerHeight/2};
window.addEventListener('mousemove',e=>{const dx=e.clientX-lastMouse.x;const dy=e.clientY-lastMouse.y;const dist=Math.sqrt(dx*dx+dy*dy);targetUpdate=baseUpdate+Math.min(dist*0.05,6.0);targetGamma=baseGamma+Math.min(dist*0.005,0.4);lastMouse.x=e.clientX;lastMouse.y=e.clientY});
window.addEventListener('keydown',()=>{targetGamma=Math.min(targetGamma+0.15,1.6);targetUpdate=Math.min(targetUpdate+3.0,10.0)});
const POINTS_COUNT=6000,NODE_COUNT=3,GOLDEN_ANGLE=2.39996;
const baseR=new Float32Array(POINTS_COUNT),baseX=new Float32Array(POINTS_COUNT),baseY=new Float32Array(POINTS_COUNT);
const nodeX=new Float32Array(NODE_COUNT),nodeY=new Float32Array(NODE_COUNT);
for(let i=0;i<POINTS_COUNT;i++){const theta=i*GOLDEN_ANGLE;const rNorm=Math.sqrt(i)/Math.sqrt(POINTS_COUNT);baseR[i]=rNorm;baseX[i]=Math.cos(theta)*rNorm;baseY[i]=Math.sin(theta)*rNorm}
let localStep=0;
function renderLogo(){requestAnimationFrame(renderLogo);
pGamma+=(targetGamma-pGamma)*0.05;pUpdate+=(targetUpdate-pUpdate)*0.05;
targetGamma+=(baseGamma-targetGamma)*0.02;targetUpdate+=(baseUpdate-targetUpdate)*0.02;
localStep+=pUpdate*speed;
const t=localStep*pDrive;
if(mono){ctx.clearRect(0,0,width,height)}else{ctx.fillStyle='rgba(1,1,2,0.15)';ctx.fillRect(0,0,width,height)}
const maxRadius=(width/2)*pZoom;const angleOffset=t*0.003;
for(let n=0;n<NODE_COUNT;n++){const angle=angleOffset+(n*Math.PI*2)/NODE_COUNT;const nodeR=maxRadius*0.45*Math.sin(t*0.0006+n);nodeX[n]=Math.cos(angle)*nodeR;nodeY[n]=Math.sin(angle)*nodeR}
const driveFactor=0.05*pDrive;const tOffsetBase=t*0.03;const nodeDriveFactor=0.12*pDrive;const nodeTOffset=t*0.06;
const gammaScale=pGamma*2.5;const normBase=4+2*NODE_COUNT*pGamma;const normOffset=2+NODE_COUNT*pGamma;
for(let i=0;i<POINTS_COUNT;i++){
const pxRel=baseX[i]*maxRadius,pyRel=baseY[i]*maxRadius,r=baseR[i]*maxRadius;
let totalPhase=Math.sin(r*driveFactor-tOffsetBase);
for(let n=0;n<NODE_COUNT;n++){const dx=pxRel-nodeX[n],dy=pyRel-nodeY[n];totalPhase+=gammaScale*Math.sin(Math.sqrt(dx*dx+dy*dy)*nodeDriveFactor-nodeTOffset)}
if(Math.sin(totalPhase*2.0)>0.15){
const norm=(totalPhase+normOffset)/normBase;const rawAlpha=0.6+norm*0.4;
const alpha=rawAlpha>1?1:rawAlpha<0?0:rawAlpha.toFixed(2);
let paint=false;
if(mono){if(norm>0.90){ctx.fillStyle='hsla(290,100%,75%,0.16)';paint=true}}
else{const hue=(265+norm*55)|0,lit=(42+norm*35)|0;ctx.fillStyle='hsla('+hue+',88%,'+lit+'%,'+alpha+')';paint=true}
if(paint)ctx.fillRect(cx+pxRel,cy+pyRel,dotSize,dotSize)}}}
renderLogo();}
initLogo(document.getElementById('logo'),75,1.0,false);
})();
</script>