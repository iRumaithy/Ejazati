const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../public/ejazati-core.js');
const backup=()=>({format:'ejazati-backup-v1',settings:{base_balance:30,carried_balance:5,carry_expiry:null,weekend_days:[6,0],balance_year:2026,year_opening_balance:35,balance_adjustment:0},leaves:[],holidays:[]});
test('Dubai date rolls over independently of the device timezone',()=>{
 assert.equal(core.dubaiToday(new Date('2026-12-31T20:00:00Z')),'2027-01-01');
 assert.equal(core.dubaiToday(new Date('2026-12-31T19:59:59Z')),'2026-12-31');
});
test('date validation rejects rollover dates and accepts leap days',()=>{
 assert.equal(core.validDate('2026-02-31'),false);assert.equal(core.validDate('2026-02-29'),false);assert.equal(core.validDate('2028-02-29'),true);
 assert.equal(core.validDate('2026-2-01'),false);assert.equal(core.daySpan('2026-12-31','2027-01-01'),2);
 assert.throws(()=>core.daySpan('bad','2026-01-01'));
});
test('workdays count holidays once and honour customised weekends',()=>{
 assert.equal(core.workdays('2026-10-19','2026-10-25',[0,6],['2026-10-20','2026-10-20','2026-10-24']),4);
 assert.equal(core.workdays('2026-10-19','2026-10-25',[5,6]),5);
 assert.equal(core.workdays('2026-10-19','2026-10-25',[]),7);
 assert.equal(core.workdays('2026-10-19','2026-10-25',[0,1,2,3,4,5,6]),0);
 assert.equal(core.workdays('2026-10-25','2026-10-19'),0);
});
test('overlapping deductions count each working date once; non-deducting missions do not consume balance',()=>{
 const leaves=[{start_date:'2026-10-19',end_date:'2026-10-21',deduct_from_balance:true},{start_date:'2026-10-20',end_date:'2026-10-23',deduct_from_balance:true},{start_date:'2026-10-01',end_date:'2026-10-31',deduct_from_balance:false}];
 assert.deepEqual(core.consumption(leaves,'2026-10-21',[0,6],['2026-10-20']),{used:1,reserved:3});
});
test('leave across New Year only consumes the part in the current year',()=>{
 assert.deepEqual(core.consumption([{start_date:'2025-12-29',end_date:'2026-01-02',deduct_from_balance:true}],'2026-01-02',[0,6]),{used:1,reserved:1});
});
test('backup normalization strips identity and role fields and preserves custom holidays and overrides',()=>{
 const x=backup();x.settings.user_id='someone-else';x.settings.role='owner';x.holidays=[{id:'old',user_id:'someone-else',holiday_date:'2026-11-01',name:'عطلة خاصة'}];x.holiday_overrides=[{official_holiday_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',override_date:'2026-11-02',override_name:'موعد خاص',is_disabled:false,user_id:'other'}];
 const normalized=core.backupPayload(x);assert.equal(JSON.stringify(normalized).includes('someone-else'),false);assert.equal(JSON.stringify(normalized).includes('owner'),false);assert.equal(normalized.holidays.length,1);assert.equal(normalized.holiday_overrides.length,1);
});
test('malformed backup data cannot reach destructive restore',()=>{
 for(const change of [x=>delete x.holidays,x=>x.leaves.push({start_date:'2026-02-31'}),x=>x.settings.base_balance=-1,x=>x.settings.base_balance=1.5,x=>x.settings.weekend_days=[0,0],x=>x.holidays.push({official:true,name:'عطلة رسمية',holiday_date:'2026-10-20'})]){const x=backup();change(x);assert.throws(()=>core.backupPayload(x));}
 const old=backup();assert.equal(Object.hasOwn(core.backupPayload(old),'holiday_overrides'),false);
});
