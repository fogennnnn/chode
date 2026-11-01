'use strict';
function classify(status,data={}){const raw=data?.error?.code||data?.code||'',code=typeof raw==='string'&&/^[a-z0-9_.-]{1,100}$/i.test(raw)?raw:'',hint=String(code+' '+(data?.error?.type||''));let category='request',message='The provider rejected the request. Check the selected model and API settings.';
 if(status===401){category='auth';message='The provider rejected this API key. Check the credential and account access.';}
 else if(status===402||/quota|credit|balance|payment|resource_exhausted/i.test(hint)){category='quota';message='This account has insufficient quota or credits for the selected model. The key may still be valid. Check account limits or choose an accessible model.';}
 else if(status===403){category='permission';message='This account cannot access the selected model. Check model permissions and subscription access.';}
 else if(status===429){category='rate';message='The provider is rate limited. Wait for its retry window; changing keys does not reset account limits.';}
 else if(status===404){category='model';message='The endpoint or selected model was not found. Refresh models and check the API base URL.';}
 else if(status>=500){category='unavailable';message='The provider is temporarily unavailable. Retry later.';}
 return {status,code,category,message};}
function error(status,data){const failure=classify(status,data);return Error((failure.category==='quota'?'payment_required':failure.category==='auth'?'auth_failed':status+'_access_denied')+': '+(failure.code?failure.code+'; ':'')+failure.message+' (HTTP '+status+')');}
module.exports={classify,error};
