import {add,days,week,scheduled,labelsForDay} from './model.js';
export function activityLevel(completed,total){if(!total||!completed)return 'empty';const completion=completed/total;return completion===1?'green':completion>=.5?'gold':'red';}
export function activityDays(state,now){const first=add(now,-364);return days(week(first),add(week(now),6)).map(day=>{if(day<first||day>now)return {day,padding:true};const tasks=scheduled(state,day),completed=tasks.filter(t=>t.done).length,total=tasks.length,label=labelsForDay(state,day).map(item=>`${item.time?`${item.time} `:''}${item.text}`).join(' · ');return {day,completed,total,level:activityLevel(completed,total),label};});}
export {validGithubUsername} from './github-username.js';
