// take note:
// that you have to validate and filter your passed value

//determine if an object has key:value
//result: obj | null
const objOrNull = (obj) => {
  return Object.keys(obj).length!==0?obj:null;
}

//{date:date} | {to:date, from:date}
//result: {date: {$gte:fromDate, $lte:toDate}} | {date: date}
const criteriaDate = (date) => {
  const keys = Object.keys(date);
  if (keys.indexOf('date')>=0) return {date: new Date(date['date'])};
  else if (keys.indexOf('to')>=0 && keys.indexOf('from')>=0) return {date: toFromDate(keys.from,keys.to)};
  else if (keys.indexOf('to')>=0) return {date: toFromDate(undefined,keys.to)};
  else if (keys.indexOf('from')>=0) return {date: toFromDate(keys.from,undefined)};
  else return null;
}

//_from => date | undefined
//_to => date | undefined
//{_from,_to}
//result: {$gte:fromDate, $lte:toDate}
const toFromDate = (_from,_to) => {
  let searchDate = {};
  if (_to!==undefined || _to!==null) searchDate['$lte'] = new Date(_to);
  if (_from!==undefined || _from!==null) searchDate['$gte'] = new Date(_from);
  return objOrNull(searchDate);
}

//sort => {field:1|-1}, {field:'asc'|'desc'}, {field:'ascending'|'descending'}
//limit => Number
//skip => Number
//{sort,limit,skip}
const queryOptions = (sort, limit, skip ) => {
  let options = {};
  if (sort!==undefined) options.sort = sort;
  if (limit!==undefined && !isNaN(limit)) options.limit = limit;
  if (skip!==undefined && !isNaN(skip)) options.skip = skip;
  return objOrNull(options);
}

//only use for multiple find and delete
//"string"
//result: /string/g
const regex = (mystring) => new RegExp(mystring,'g')
//incase sensitive
//result: /string/gi
const regexi = (mystring) => new RegExp(mystring,'gi')


module.exports = {
  criteriaDate,
  toFromDate,
  queryOptions,
  regex,
  regexi,
  objOrNull,
}
