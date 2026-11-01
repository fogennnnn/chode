'use strict';
function wrap(aiCall,budget){if(aiCall._chodeBudget===budget)return aiCall;const bounded=async(...args)=>{if(budget.calls>=budget.limit){budget.exhausted=true;return null;}budget.calls++;return aiCall(...args);};bounded._chodeBudget=budget;return bounded;}
function create(limit){const n=Number(limit);return {calls:0,limit:Number.isInteger(n)&&n>0?Math.min(n,1000):30,exhausted:false};}
module.exports={wrap,create};
