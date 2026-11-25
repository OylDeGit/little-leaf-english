// One cancellable countdown; both scheduling and firing check the live question.
export function canAutoAdvance({enabled,mode,session,playing,blocked,hidden}) {
  return enabled===true && mode==='listen' && session?.type==='listen' &&
    session.answered===true && session.lastCorrect===true &&
    session.position>=0 && session.position<session.queue.length &&
    !playing && !blocked && !hidden;
}
export function createAutoAdvance({read,advance,setTimer=setTimeout,clearTimer=clearTimeout,delay=1500}) {
  let timer=null,generation=0;
  function cancel(){generation++;if(timer!==null)clearTimer(timer);timer=null;}
  function schedule(){
    cancel();const before=read();if(!canAutoAdvance(before))return;
    const question=before.session,position=question.position,ticket=generation;
    timer=setTimer(()=>{
      if(ticket!==generation)return;
      timer=null;const current=read();
      if(current.session===question&&current.session.position===position&&canAutoAdvance(current))advance();
    },delay);
  }
  return {schedule,cancel};
}
