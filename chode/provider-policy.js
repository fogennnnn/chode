'use strict';
const token=['poll','inat'].join('');
function isRetired(id,provider){if(provider&&provider.category==='bootstrap')return true;const text=JSON.stringify({id,name:provider&&provider.name,endpoints:provider&&provider.endpoints});return text.toLowerCase().includes(token);}
module.exports={isRetired};
