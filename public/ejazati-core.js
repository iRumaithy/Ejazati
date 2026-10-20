(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EjazatiCore=api;})(globalThis,function(){
  'use strict';
  const VERSION='1.2.13',DAY=86400000;
  const TYPES=new Set(['annual','sick','emergency','unpaid','mission','other']);
  function validDate(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    const [y,m,d]=value.split('-').map(Number),date=new Date(0);
    date.setUTCFullYear(y,m-1,d);date.setUTCHours(0,0,0,0);
    return y>=100&&date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d;
  }
  function stamp(value){if(!validDate(value))throw new Error('تحقق من التواريخ');return Date.parse(value+'T00:00:00Z');}
  function dubaiToday(now=new Date()){
    const parts={};new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).forEach(p=>{parts[p.type]=p.value;});
    return parts.year+'-'+parts.month+'-'+parts.day;
  }
  function daySpan(a,b){return Math.max(0,(stamp(b)-stamp(a))/DAY+1);}
  function weekdays(value=[6,0]){
    if(!Array.isArray(value)||value.some(n=>!Number.isInteger(n)||n<0||n>6)||new Set(value).size!==value.length)throw new Error('تحقق من أيام نهاية الأسبوع');
    return value;
  }
  function workdays(a,b,weekend=[6,0],holidays=[]){
    const start=stamp(a),end=stamp(b);if(end<start)return 0;
    const off=new Set(weekdays(weekend)),days=(end-start)/DAY+1;
    let count=Math.floor(days/7)*(7-off.size);
    for(let n=0;n<days%7;n++)if(!off.has(new Date(start+n*DAY).getUTCDay()))count++;
    const unique=new Set(holidays.map(h=>typeof h==='string'?h:h.holiday_date).filter(validDate));
    for(const date of unique){const at=stamp(date);if(at>=start&&at<=end&&!off.has(new Date(at).getUTCDay()))count--;}
    return count;
  }
  function consumption(leaves,today,weekend=[6,0],holidays=[]){
    const year=String(today).slice(0,4),first=year+'-01-01',last=year+'-12-31',days=new Set();
    stamp(today);
    for(const leave of leaves){
      if(!leave.deduct_from_balance||!validDate(leave.start_date)||!validDate(leave.end_date))continue;
      const a=leave.start_date<first?first:leave.start_date,b=leave.end_date>last?last:leave.end_date;
      if(b<a)continue;
      for(let at=stamp(a),end=stamp(b);at<=end;at+=DAY)days.add(new Date(at).toISOString().slice(0,10));
    }
    let used=0,reserved=0;
    for(const date of days)if(workdays(date,date,weekend,holidays)){if(date<today)used++;else reserved++;}
    return {used,reserved};
  }
  function integer(value,min=0,max=100000){
    if(typeof value!=='number'||!Number.isSafeInteger(value)||value<min||value>max)throw new Error('الرصيد يجب أن يكون عددًا صحيحًا ضمن الحدود المسموحة');return value;
  }
  function backupPayload(value){
    if(!value||value.format!=='ejazati-backup-v1'||!value.settings||!Array.isArray(value.leaves)||!Array.isArray(value.holidays))throw new Error('ملف النسخة غير مكتمل');
    if(value.leaves.length>5000||value.holidays.length>5000)throw new Error('ملف النسخة كبير جدًا');
    const s=value.settings;
    const settings={base_balance:integer(s.base_balance),carried_balance:integer(s.carried_balance),carry_expiry:s.carry_expiry||null,weekend_days:weekdays(s.weekend_days)};
    if(settings.carry_expiry&&!validDate(settings.carry_expiry))throw new Error('تاريخ انتهاء المرحّل غير صالح');
    if(s.balance_year!=null)settings.balance_year=integer(s.balance_year,1900,9999);
    if(s.year_opening_balance!=null)settings.year_opening_balance=integer(s.year_opening_balance);
    if(s.balance_adjustment!=null)settings.balance_adjustment=integer(s.balance_adjustment,-100000);
    const text=(v,max,required=false)=>{if(v==null&&!required)return null;if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw new Error('بيانات النسخة غير صالحة');return v;};
    const leaves=value.leaves.map(l=>{
      if(!l||!TYPES.has(l.leave_type)||!validDate(l.start_date)||!validDate(l.end_date)||l.end_date<l.start_date||typeof l.deduct_from_balance!=='boolean')throw new Error('توجد إجازة غير صالحة في النسخة');
      return {leave_type:l.leave_type,title:text(l.title,300),start_date:l.start_date,end_date:l.end_date,deduct_from_balance:l.deduct_from_balance};
    });
    const holidays=value.holidays.map(h=>{
      if(!h||h.official===true||!validDate(h.holiday_date))throw new Error('توجد عطلة غير صالحة في النسخة');
      return {holiday_date:h.holiday_date,name:text(h.name,300,true)};
    });
    const payload={format:'ejazati-backup-v1',settings,leaves,holidays};
    if(Object.hasOwn(value,'holiday_overrides')){
      if(!Array.isArray(value.holiday_overrides)||value.holiday_overrides.length>5000)throw new Error('تعديلات العطل غير صالحة');
      payload.holiday_overrides=value.holiday_overrides.map(h=>{
        if(!h||typeof h.official_holiday_id!=='string'||!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(h.official_holiday_id))throw new Error('مرجع العطلة غير صالح');
        if(Object.hasOwn(h,'is_disabled')&&typeof h.is_disabled!=='boolean')throw new Error('حالة العطلة غير صالحة');
        if(h.override_date&&!validDate(h.override_date))throw new Error('تاريخ العطلة غير صالح');
        return {official_holiday_id:h.official_holiday_id,override_name:text(h.override_name,300),override_date:h.override_date||null,is_disabled:h.is_disabled===true};
      });
    }
    return payload;
  }
  return {VERSION,validDate,dubaiToday,daySpan,weekdays,workdays,consumption,backupPayload};
});
