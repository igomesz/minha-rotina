import {add,days,week,scheduled} from './model.js';
export function activityLevel(completed,total){if(!total||!completed)return 'empty';if(completed===total)return 'green';return completed/total>=.5?'yellow':'red';}
export function activityDays(state,now){const first=add(now,-364);return days(week(first),add(week(now),6)).map(day=>{if(day<first||day>now)return {day,padding:true};const tasks=scheduled(state,day),completed=tasks.filter(t=>t.done).length,total=tasks.length;return {day,completed,total,level:activityLevel(completed,total),label:state.labels?.[day]||''};});}
export {validGithubUsername} from './github-username.js';
