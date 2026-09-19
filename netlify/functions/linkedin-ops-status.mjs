import { listQueue } from "./_shared/linkedin-automation.mjs";

function pacificDate(date=new Date()){
  return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
}
function json(body,status=200){
  return new Response(JSON.stringify(body),{status,headers:{
    "content-type":"application/json; charset=utf-8",
    "cache-control":"no-store",
    "access-control-allow-origin":"https://bdms.aproposgroupllc.com",
    "access-control-allow-methods":"GET, OPTIONS",
    "access-control-allow-headers":"content-type"
  }});
}
export default async (request)=>{
  if(request.method==="OPTIONS") return json({ok:true});
  if(request.method!=="GET") return json({ok:false,error:"method_not_allowed"},405);
  try{
    const posts=await listQueue();
    const today=pacificDate();
    const sameDay=p=>pacificDate(new Date(p.scheduledFor))===today;
    const current=posts.find(sameDay) || posts.filter(p=>p.status==="published").sort((a,b)=>String(b.publishedAt||"").localeCompare(String(a.publishedAt||"")))[0] || posts.find(p=>new Date(p.scheduledFor)>new Date()) || null;
    const next=posts.find(p=>new Date(p.scheduledFor)>new Date() && p.status!=="published")||null;
    const normalize=p=>p?{
      id:p.id,text:p.text||"",scheduledFor:p.scheduledFor||null,status:p.status||"unknown",
      publishedAt:p.publishedAt||null,lastError:p.lastError||null,postId:p.postId||null
    }:null;
    return json({ok:true,generated_at:new Date().toISOString(),today,current:normalize(current),next:normalize(next)});
  }catch(error){
    return json({ok:false,error:error?.message||"linkedin_status_unavailable"},500);
  }
};
