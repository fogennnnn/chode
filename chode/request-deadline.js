'use strict';
function createDeadline(milliseconds,onExpire){let remaining=milliseconds,timer=null,started=0,done=false;function pause(){if(timer){clearTimeout(timer);timer=null;remaining=Math.max(0,remaining-(Date.now()-started));}}function resume(){if(done||timer)return;started=Date.now();timer=setTimeout(()=>{timer=null;done=true;onExpire();},remaining);}function cancel(){pause();done=true;}resume();return {pause,resume,cancel};}
module.exports={createDeadline};
