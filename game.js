'use strict';
const $=id=>document.getElementById(id);
const LABEL={symptoms:'Symptoms & Relapses',diagnosis:'MS Diagnosis',work:'Work, Work Adjustment, Termination/Resignation',support:'Engaging with or becoming a member of (nonprofit) support organizations (e.g., the Swiss MS Society)',fatigue:'Tiredness, Exhaustion, Fatigue',mental:'Mental Distress: Depression, Anxiety, Loneliness, Difficulty Coping',tests:'Neurologist contacts, Diagnostic Procedures (MRI, Lumbar Puncture, etc.)',relationships:'Interpersonal Relationships (Family, Partner, Friends)',treatment:'Disease Modifying Treatment & Side Effects',leisure:'Leisure, Hobbies, and Sports (Engaging, Giving Up, or Adapting)',future:'Future, Future Anxiety, Future Outlook',positive:'Mental Health: Self-Confidence, Trust, Hope, Relief, Contentment',hospital:'Hospital, Rehab, Hospitalization',daily:'Impact and/or changes in daily life due to MS'};
const TASKS=['Decode','Predict','Tell the story'];
const FINDINGS=[['Language → events','Category labels structure a story, while leaving some detail behind.'],['Prediction → evidence','The next event may be different from what we expect.'],['Events → narrative','A synthetic continuation should preserve the predicted categories and their order.']];
const DECODE=STUDY_EXAMPLES.decode;
const ROUNDS=STUDY_EXAMPLES.rounds;
const CONTINUATION=STUDY_EXAMPLES.continuation;
let state,activePuzzle=null,lastFocus=null;
function shuffled(items){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
function newState(){
 const sentences=shuffled(DECODE.map((_,i)=>i)),categories=shuffled(DECODE.map((_,i)=>i));
 if(categories.every((value,i)=>value===sentences[i]))categories.push(categories.shift());
 return {points:0,done:[false,false,false],matched:[],selectedCard:null,round:0,prediction:{choice:null,revealed:false},predictions:[],storySolved:false,storyTried:[],playing:true,mood:'neutral',sentenceOrder:sentences,decodeOrder:categories,predictionOrders:ROUNDS.map(r=>shuffled(r.choices.map((_,i)=>i))),storyOrder:shuffled(CONTINUATION.options.map((_,i)=>i)),justMatched:null};
}
function motionAllowed(){return !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;}
function react(mood){
 state.mood=mood;
 document.querySelectorAll('img[alt="Your duck avatar"]').forEach(img=>{
  img.setAttribute('src',mood==='neutral'?'duck.svg?v=20261112-6':`duck-${mood}.svg?v=20261112-6`);
  if(motionAllowed())img.animate?.([{transform:'translateY(0)'},{transform:mood==='celebrate'?'translateY(-7px) rotate(-5deg)':'translateY(-3px)'},{transform:'translateY(0)'}],{duration:450,easing:'ease-out'});
 });
}
function awardPoints(amount,anchor){
 state.points+=amount;updatePoints();
 if(!motionAllowed())return;
 const target=$('task-points').getBoundingClientRect?.(),source=anchor?.getBoundingClientRect?.();if(!target)return;
 const from=source||target,token=element('span','score-flight '+(amount<0?'negative':''),(amount>0?'+':'')+amount);
 token.style.left=`${from.left+from.width/2}px`;token.style.top=`${from.top+from.height/2}px`;$('reward-layer').append(token);
 const animation=token.animate?.([{opacity:0,transform:'translate(-50%,-50%) scale(.8)'},{opacity:1,offset:.15,transform:'translate(-50%,-100%) scale(1.1)'},{opacity:0,transform:`translate(calc(-50% + ${target.left+target.width/2-from.left-from.width/2}px),calc(-50% + ${target.top-from.top-from.height/2}px)) scale(.75)`}],{duration:850,easing:'ease-in-out'});
 if(animation)animation.finished.then(()=>token.remove()).catch(()=>token.remove());else token.remove();
}
function matchPositions(){const positions=new Map();if(motionAllowed())$('puzzle').querySelectorAll('[data-match-id]').forEach(card=>positions.set(card.getAttribute('data-match-id'),card.getBoundingClientRect()));return positions;}
function animateMatches(before){
 if(!motionAllowed())return;
 $('puzzle').querySelectorAll('[data-match-id]').forEach(card=>{const old=before.get(card.getAttribute('data-match-id'));if(!old)return;const now=card.getBoundingClientRect();const dy=old.top-now.top;if(dy)card.animate?.([{transform:`translateY(${dy}px)`},{transform:'translateY(0)'}],{duration:350,easing:'ease-out'});});
 if(state.justMatched!==null){const link=$('puzzle').querySelector(`[data-link-id="${state.justMatched}"] .connection-line`);link?.animate?.([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:350,easing:'ease-out'});state.justMatched=null;}
}
function renderTaskTrack(){
 const track=$('task-progress');track.replaceChildren();
 const list=element('ol');TASKS.forEach((task,i)=>{const active=typeof activePuzzle==='number'?activePuzzle===i:currentMission()===i;const item=element('li',state.done[i]?'track-complete':active?'track-active':'');if(active)item.setAttribute('aria-current','step');const main=element('div','task-track-main');main.append(element('span','track-dot',state.done[i]?'✓':String(i+1)),element('span','',task));item.append(main);list.append(item);});track.append(list);
 if(activePuzzle===1){
  const examples=element('ol','example-track');examples.setAttribute('aria-label','Task 2 example progress');
  ROUNDS.forEach((round,i)=>{
   const current=i===state.round&&!state.done[1],completed=state.done[1]||i<state.round||(i===state.round&&state.prediction.revealed);
   const step=element('li','example-step '+(current?'example-current':completed?'example-complete':''));
   if(current)step.setAttribute('aria-current','step');
   step.append(element('span','example-dot',completed?'✓':String(i+1)));
   const label=element('span','example-label',`Example ${i+1}`);
   label.append(element('small','',current?(state.prediction.revealed?'Results':'Your turn'):completed?'Complete':'Up next'));
   step.append(label);examples.append(step);
  });
  list.children[1].append(examples);
 }
}
function element(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
function button(text,handler,cls='card'){const el=element('button',cls,text);el.addEventListener('click',event=>{const selection=document.getSelection?.();if(selection&&!selection.isCollapsed&&(el.contains(selection.anchorNode)||el.contains(selection.focusNode)))return;handler(event);});return el;}
function currentMission(){return state.done.findIndex(done=>!done);}
function isUnlocked(i){return i===0||state.done[i-1];}
function updatePoints(){$('points').textContent=state.points;$('task-points').textContent=state.points;}
function renderPlayer(){
 ['player-badges','task-badges','end-badges'].forEach(id=>{
  const badges=$(id);badges.replaceChildren();
  TASKS.forEach((task,i)=>{const earned=state.done[i];const badge=element('span','player-badge '+(earned?'earned':''),earned?'✓':String(i+1));badge.setAttribute('title',task+(earned?' badge earned':' badge not yet earned'));badge.setAttribute('aria-label',task+(earned?' badge earned':' badge not yet earned'));badges.append(badge);});
 });
}
function renderProgress(){
 renderPlayer();renderTaskTrack();
 const completed=state.done.filter(Boolean).length;
 $('restored').textContent=`${completed} / 3`;updatePoints();$('finding-count').textContent=`${completed} / 3`;
 TASKS.forEach((name,i)=>{const level=$('level-'+i);level.disabled=!isUnlocked(i);level.className='level-button '+(state.done[i]?'complete':isUnlocked(i)?'available':'');$('level-state-'+i).textContent=state.done[i]?'Review ✓':isUnlocked(i)?'Play →':'Locked';});
 $('results-button').hidden=completed!==3;
}
function openModal(kind,title,kicker){
 updatePoints();lastFocus=document.activeElement;activePuzzle=kind;renderTaskTrack();$('modal').hidden=false;document.body.style.overflow='hidden';$('play-screen').inert=true;$('modal-title').textContent=title;$('modal-kicker').textContent=kicker;$('puzzle').replaceChildren();$('puzzle-feedback').textContent='';$('puzzle-done').hidden=true;$('puzzle-done').textContent='Back to tasks →';$('modal-title').focus({preventScroll:true});$('modal').scrollTop=0;$('task-panel').scrollTop=0;
}
function closeModal(){if(activePuzzle===null)return;activePuzzle=null;$('modal').hidden=true;document.body.style.overflow='';$('play-screen').inert=false;renderProgress();if(lastFocus&&lastFocus.isConnected&&typeof lastFocus.focus==='function')lastFocus.focus();else $('level-'+Math.max(0,currentMission())).focus();}
function instruction(text){$('puzzle').append(element('p','puzzle-instruction',text));}
function feedback(text){$('puzzle-feedback').textContent=text;$('puzzle-feedback').classList.toggle('feedback-negative',/^[−-]/.test(text));updatePoints();}
function completeMission(index){if(state.done[index])return;state.done[index]=true;renderProgress();react('celebrate');$('puzzle-done').textContent=index<2?'Continue to '+TASKS[index+1]+' →':'See your results →';$('puzzle-done').hidden=false;}
function openTerminal(index){
 if(activePuzzle!==null)return;
 if(state.done[index]){openModal('review',TASKS[index]+' complete','TASK COMPLETE');instruction(FINDINGS[index][1]);if(index===0)appendClassifierInvite();$('puzzle-done').hidden=false;return;}
 if(!isUnlocked(index))return;
 openModal(index, ['Reconnect the fragments.','Predict the next event.','Which continuation fits?'][index],`TASK ${index+1} / ${TASKS[index].toUpperCase()}`);
 [renderDecode,renderPredict,renderStory][index]();
}
function appendClassifierInvite(){
 const invitation=element('section','classifier-invite');invitation.setAttribute('aria-label','Try the phrase classifier');
 const copy=element('div','classifier-invite-copy');copy.append(element('p','overline','TRY THE CLASSIFIER (OPTIONAL)'),element('h3','','You matched the sentences. Now let the classifier try.'),element('p','','Explore how the classifier assigns event categories to text.'));
 const link=element('a','button outline','Open phrase classifier ↗');link.setAttribute('href','https://huggingface.co/spaces/cookienter/ms-phrase-classifier');link.setAttribute('target','_blank');link.setAttribute('rel','noopener noreferrer');
 const actions=element('div','classifier-invite-actions');actions.append(link,element('small','','Opens on Hugging Face in a new tab. Your game stays here.'));
 invitation.append(copy,actions);$('puzzle').append(invitation);
}
function renderDecode(){
 const previousPositions=matchPositions();$('puzzle').replaceChildren();instruction('Match a category with its corresponding sentence. Match: +2; wrong pair: −1.');
 const headings=element('div','match-headings');headings.append(element('span','','CATEGORY CARDS'),element('span','','STORY FRAGMENTS'));$('puzzle').append(headings);
 const grid=element('div','puzzle-grid match-grid'),left=element('div','card-column'),right=element('div','card-column');
 const order=[...state.decodeOrder];state.matched.forEach(i=>{const row=state.sentenceOrder.indexOf(i),old=order.indexOf(i);[order[row],order[old]]=[order[old],order[row]];});
 const arrows=element('div','match-links');arrows.setAttribute('aria-hidden','true');
 state.sentenceOrder.forEach(i=>{const row=element('div','match-link '+(state.matched.includes(i)?'connected match-'+i:''));row.setAttribute('data-link-id',String(i));row.append(element('span','connection-line'));arrows.append(row);});
 order.forEach(i=>{const card=button((state.matched.includes(i)?'✓ ':'')+DECODE[i].label,()=>{if(state.matched.includes(i))return;state.selectedCard=i;renderDecode();feedback('Now tap the sentence that matches this category.');});card.className='card '+(state.matched.includes(i)?'matched match-'+i:state.selectedCard===i?'selected':'');card.setAttribute('aria-disabled',String(state.matched.includes(i)));card.setAttribute('aria-pressed',String(state.selectedCard===i));card.setAttribute('data-match-id',String(i));left.append(card);});
 state.sentenceOrder.forEach(i=>{const data=DECODE[i];const slot=button('',()=>{
 if(state.matched.includes(i))return;if(state.selectedCard===null){feedback('Choose a category card first.');return;}
 if(state.selectedCard!==i){awardPoints(-1,slot);react('thinking');state.selectedCard=null;renderDecode();feedback('That connection does not fit. −1 point. Try another pairing.');return;}
 state.matched.push(i);state.justMatched=i;state.selectedCard=null;awardPoints(2,slot);react('happy');renderDecode();feedback(`+2 points. ${state.matched.length} / 3 connections restored.`);
 if(state.matched.length===3){completeMission(0);feedback('All three matched. Try the classifier, or continue to Predict.');}
 },'card slot '+(state.matched.includes(i)?'matched match-'+i:''));slot.setAttribute('aria-disabled',String(state.matched.includes(i)));slot.append(element('span','quote',data.text));if(state.matched.includes(i))slot.setAttribute('aria-label',data.text+'. Matched to '+DECODE[i].label);right.append(slot);});
 grid.append(left,arrows,right);$('puzzle').append(grid);if(state.matched.length===DECODE.length)appendClassifierInvite();animateMatches(previousPositions);
}
function renderPredict(){
 renderTaskTrack();$('puzzle').replaceChildren();const r=ROUNDS[state.round],p=state.prediction;
 $('modal-title').textContent=`Predict the next event: Example ${state.round+1} of ${ROUNDS.length}`;
 if(p.revealed){renderPredictionReveal();return;}
 instruction('Choose the next recorded event. Match: +2; wrong choice: −1. Then compare with the saved model prediction.');
 $('puzzle').append(element('p','history-heading','OBSERVED EVENTS IN ORDER'));const trail=element('div','trail observed-events');r.history.forEach(label=>trail.append(element('span','',label)));trail.append(element('span','unknown-event','Next event?'));$('puzzle').append(trail);
 const routes=element('div','routes');state.predictionOrders[state.round].forEach(i=>{const label=r.choices[i];const card=button('',()=>{p.choice=i;react('thinking');renderPredict();});card.setAttribute('data-choice-index',String(i));card.className='card '+(p.choice===i?'selected':'');card.setAttribute('aria-pressed',String(p.choice===i));card.append(element('span','',label));routes.append(card);});$('puzzle').append(routes);
 const actions=element('div','puzzle-actions');const lock=button('Open the chapter →',revealPrediction,'button bright');lock.disabled=p.choice===null;actions.append(lock);
 $('puzzle').append(actions);
}
function revealPrediction(){
 const p=state.prediction;if(p.revealed||p.choice===null)return;
 const r=ROUNDS[state.round],correct=p.choice===r.actual,earned=correct?2:-1;
 $('modal').scrollTop=0;$('task-panel').scrollTop=0;p.revealed=true;awardPoints(earned,$('puzzle').querySelector('.routes .selected'));react(correct?'happy':'thinking');state.predictions.push({correct,earned});renderPredict();feedback(`${earned>0?'+':''}${earned} prediction points.`);
}
function renderPredictionReveal(){
 const r=ROUNDS[state.round],p=state.prediction;$('modal-title').textContent=`Results for Task 2: Example ${state.round+1} of ${ROUNDS.length}`;
 $('puzzle').append(element('p','prediction-outcome',p.choice===r.actual?'Your prediction matched the recorded event.':'Your prediction did not match the recorded event.'));
 $('puzzle').append(element('p','history-heading','NEXT RECORDED EVENT'),element('h3','recorded-event',r.next));const results=element('div','reveal-grid prediction-comparison');
 [['Your prediction',r.choices[p.choice]],['Recorded event',r.choices[r.actual]],[r.method+' prediction',r.choices[r.computer]]].forEach(([label,value],index)=>{const correct=index===0?p.choice===r.actual:index===2?r.computer===r.actual:null;const box=element('div',index===0?(correct?'answer-correct':'answer-incorrect'):'');box.append(element('small','',label),element('strong','',value));if(correct!==null)box.append(element('span','result-status '+(correct?'status-correct':'status-incorrect'),correct?'✓ Correct':'× Incorrect'));results.append(box);});$('puzzle').append(results);
 instruction(state.round===0?'One matching event is only a start, so researchers check predictions across many patient journeys.':'The next event may be different from what we expect.');
 $('puzzle').append(button(state.round<ROUNDS.length-1?`Try example ${state.round+2} of ${ROUNDS.length} →`:'Finish Task 2 →',()=>{
 if(!state.prediction.revealed)return;
 if(state.round<2){$('modal').scrollTop=0;$('task-panel').scrollTop=0;state.round++;state.prediction={choice:null,revealed:false};feedback('');renderPredict();}
 else{completeMission(1);$('puzzle').replaceChildren();$('modal-title').textContent='Prediction task complete.';feedback('Task 2 complete.');}
 },'button bright'));
}
function renderStory(){
 $('puzzle').replaceChildren();
 instruction('Choose the text that preserves all three predicted categories in order. Correct choice: +4; wrong choice: −1.');

 const heading=element('p','history-heading','PREDICTED EVENTS IN ORDER');
 const trail=element('ol','continuation-events');CONTINUATION.events.forEach(label=>trail.append(element('li','',label)));
 $('puzzle').append(heading,trail,element('p','synthetic-label','SYNTHETIC TEXT OPTIONS: Written for this game, not patient quotations or outputs from the narrative-generation model.'));
 const options=element('div','story-options');
 state.storyOrder.forEach((i,position)=>{const option=CONTINUATION.options[i];
  const tried=state.storyTried.includes(i);const card=button('',()=>{
   if(state.storySolved||state.storyTried.includes(i))return;
   state.storyTried.push(i);
   if(option.correct){state.storySolved=true;awardPoints(4,card);react('happy');completeMission(2);renderStory();feedback('+4 points. A faithful story can still describe a forecast that turns out to be wrong.');}
   else{awardPoints(-1,card);react('thinking');renderStory();feedback('−1 point. Try another continuation.');}
  },'card story-option '+(tried?(option.correct?'matched':'wrong'):''));
  card.setAttribute('data-story-index',String(i));card.setAttribute('aria-disabled',String(state.storySolved||tried));
  card.append(element('span','option-letter',String.fromCharCode(65+position)),element('span','continuation-text',option.text));
  if(tried&&option.reason)card.append(element('small','option-reason',option.reason));
  options.append(card);
 });
 $('puzzle').append(options);
 if(state.storySolved)$('puzzle-done').hidden=false;
}
function openNotebook(){
 if(!state?.playing||activePuzzle!==null)return;openModal('notebook','Your findings','RESEARCH NOTES');
 FINDINGS.forEach(([title,text],i)=>{const item=element('div','finding');item.append(element('strong','',state.done[i]?'✓ '+title:'Locked: '+TASKS[i]),element('span','',state.done[i]?text:'Complete this task to unlock the finding.'));$('puzzle').append(item);});$('puzzle-done').hidden=false;
}
function finish(){
 if(!state.done.every(Boolean)||!state.playing)return;state.playing=false;activePuzzle=null;$('modal').hidden=true;document.body.style.overflow='';$('play-screen').inert=false;$('play-screen').hidden=true;$('end-screen').hidden=false;
 react('celebrate');$('end-score').textContent=state.points;
 $('end-findings').replaceChildren();FINDINGS.forEach(([title,text])=>{const item=element('div','finding');item.append(element('strong','',title),element('span','',text));$('end-findings').append(item);});$('restart').focus();
}
function start(){state=newState();activePuzzle=null;$('modal').hidden=true;document.body.style.overflow='';$('play-screen').inert=false;$('title-screen').hidden=true;$('end-screen').hidden=true;$('play-screen').hidden=false;renderProgress();react('neutral');openTerminal(0);}
$('start').addEventListener('click',start);$('restart').addEventListener('click',start);$('notebook-button').addEventListener('click',openNotebook);$('close-modal').addEventListener('click',closeModal);
$('puzzle-done').addEventListener('click',()=>{const completed=activePuzzle;closeModal();if(typeof completed==='number'&&state.done[completed]){if(completed<2)openTerminal(completed+1);else finish();}});
$('results-button').addEventListener('click',finish);
TASKS.forEach((name,i)=>$('level-'+i).addEventListener('click',()=>{if(state?.playing)openTerminal(i);}));
document.addEventListener('keydown',event=>{
 if(activePuzzle!==null){if(event.key==='Escape'){event.preventDefault();closeModal();return;}if(event.key==='Tab'){const focusable=[...$('modal').querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')].filter(el=>!el.hidden);if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&(document.activeElement===first||document.activeElement===$('modal-title'))){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}return;}
});
