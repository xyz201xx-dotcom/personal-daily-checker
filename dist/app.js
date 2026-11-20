'use strict';
const KEY='hitotsu-v1';
const $=id=>document.getElementById(id);
const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today=()=>dateKey(new Date());
const parse=s=>new Date(s+'T12:00:00');
const display=s=>parse(s).toLocaleDateString('ja-JP',{year:'numeric',month:'long',day:'numeric'});
const duration=(a,b)=>Math.round((Date.UTC(...a.split('-').map((v,i)=>i===1?Number(v)-1:Number(v)))-Date.UTC(...b.split('-').map((v,i)=>i===1?Number(v)-1:Number(v))))/86400000)+1;
let state={active:null,history:[]},view=new Date();
try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved&&Array.isArray(saved.history)&&(saved.active===null||valid(saved.active))&&saved.history.every(valid))state=saved;}catch(e){$('notice').textContent='保存済みの記録を読み込めませんでした。ブラウザーの設定を確認してください。';}
function valid(s){return s&&typeof s.message==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s.start)&&Array.isArray(s.checks)&&s.checks.every(x=>/^\d{4}-\d{2}-\d{2}$/.test(x));}
function commit(next){try{localStorage.setItem(KEY,JSON.stringify(next));state=next;$('notice').textContent='';render();return true;}catch(e){$('notice').textContent='記録を保存できません。ブラウザーの保存設定や空き容量を確認してください。';return false;}}
function render(){const a=state.active;$('setup').hidden=!!a;$('tracker').hidden=!a;$('start-date').max=today();if(!$('start-date').value)$('start-date').value=today();if(a){$('promise-text').textContent=a.message;$('period').textContent=`${display(a.start)}から${a.end?' · '+display(a.end)+'に終了':''}`;const checked=a.checks.includes(today());$('today-label').textContent=display(today());$('today-title').textContent=a.end?'この約束は終了しました':a.start>today()?'始める日を待っています':checked?'今日も、ひとつできた。':'今日の約束は守れた？';$('today-check').classList.toggle('checked',checked);$('today-check').setAttribute('aria-pressed',checked);$('today-check').disabled=!!a.end||a.start>today();$('finish').hidden=!!a.end;$('restart').hidden=!a.end;$('total').textContent=a.checks.length;$('elapsed').textContent=Math.max(0,duration(a.end||today(),a.start));renderCalendar(a);}renderHistory();}
function renderCalendar(a){const y=view.getFullYear(),m=view.getMonth();$('month-label').textContent=`${y}年 ${m+1}月`;$('days').replaceChildren();const offset=(new Date(y,m,1).getDay()+6)%7;for(let i=0;i<offset;i++)$('days').append(document.createElement('span'));for(let d=1;d<=new Date(y,m+1,0).getDate();d++){const key=dateKey(new Date(y,m,d)),checked=a.checks.includes(key),b=document.createElement('button');b.className='day'+(checked?' checked':'')+(key===today()?' today':'');b.disabled=!!a.end||key<a.start||key>today();b.setAttribute('aria-label',`${display(key)}、${checked?'チェック済み':'チェックなし'}`);b.setAttribute('aria-pressed',checked);if(key===today())b.setAttribute('aria-current','date');const n=document.createElement('span');n.textContent=d;const tick=document.createElement('span');tick.className='tick';tick.textContent=checked?'✓':key>=a.start&&key<=today()?'·':'';b.append(n,tick);b.onclick=()=>toggle(key);$('days').append(b);}}
function toggle(key){const a=state.active;if(!a||a.end||key<a.start||key>today())return;const checks=a.checks.includes(key)?a.checks.filter(x=>x!==key):[...a.checks,key].sort();commit({...state,active:{...a,checks}});}
function renderHistory(){$('history-wrap').hidden=!state.history.length;$('history').replaceChildren();for(const a of [...state.history].reverse()){const item=document.createElement('article');item.className='history-item';const p=document.createElement('p');p.textContent=a.message;const meta=document.createElement('small');meta.textContent=`${display(a.start)} 〜 ${display(a.end)} · ${a.checks.length}日チェック`;item.append(p,meta);$('history').append(item);}}
$('start-form').onsubmit=e=>{e.preventDefault();const message=$('message').value.trim(),start=$('start-date').value;if(!message){$('message').setCustomValidity('言葉を入力してください。');$('message').reportValidity();return;}if(!start||start>today())return;const history=state.active?.end?[...state.history,state.active]:state.history;if(commit({active:{message,start,checks:[],end:null},history})){view=parse(start);render();window.scrollTo({top:0,behavior:'smooth'});}};
$('message').oninput=()=> $('message').setCustomValidity('');
$('today-check').onclick=()=>toggle(today());
$('previous').onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);render();};
$('next').onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);render();};
$('current').onclick=()=>{view=new Date();render();};
$('finish').onclick=()=>$('finish-dialog').showModal();
$('finish-dialog').addEventListener('close',()=>{if($('finish-dialog').returnValue==='finish'&&state.active&&!state.active.end)commit({...state,active:{...state.active,end:today()}});});
$('restart').onclick=()=>{const a=state.active;if(a?.end&&commit({active:null,history:[...state.history,a]})){$('message').value='';$('start-date').value=today();$('message').focus();}};
window.addEventListener('storage',e=>{if(e.key===KEY)location.reload();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
render();
