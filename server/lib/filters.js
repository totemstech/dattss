/*
 * DaTtSs: alerts.js
 *
 * (c) Copyright Teleportd Labs 2013. All rights reserved.
 *
 * @author: n1t0
 *
 * @log:
 * 2013-09-12 n1t0     Creation
 */

//
// ### typeName
//
exports.typeName = function(type) {
  switch(type) {
    case 'c' : return 'Counter';
    case 'g' : return 'Gauge';
    case 'ms': return 'Timer';
  };
};

//
// ### keyName
//
exports.keyName = function(key) {
  switch(key) {
    case 'sum': return 'Total';
    case 'avg': return 'Average';
    case 'lst': return 'Last value';
    case 'max': return 'Maximum';
    case 'min': return 'Minimum';
  };
};

//
// ### operatorName
//
exports.operatorName = function(operator) {
  switch(operator) {
    case '<': return 'is smaller than';
    case '>': return 'is greater than';
    case '=': return 'equals to';
  };
};

//
// ### cssStyle
//
exports.cssStyle = function(type) {
  switch(type) {
    case 'email_td': return 'border: 1px solid #000; padding: 5px;';
  };
}

//
// ### number
//
exports.number = function(number, fractionLen) {
  var groupSep = ',';
  var decimalSep = '.';
  var lgroup = 3;
  var group = 3;
  var fractionLen
  if (isNaN(number) || !isFinite(number)) return '';

  var isNegative = number < 0;
  number = Math.abs(number);
  var numStr = number + '',
      formatedText = '',
      parts = [];

  var fraction = ('' + number).split('.');
  var whole = fraction[0];
  fraction = fraction[1] || '';

  var pos = 0;

  if (whole.length >= (lgroup + group)) {
    pos = whole.length - lgroup;
    for (var i = 0; i < pos; i++) {
      if ((pos - i)%group === 0 && i !== 0) {
        formatedText += groupSep;
      }
      formatedText += whole.charAt(i);
    }
  }

  for (i = pos; i < whole.length; i++) {
    if ((whole.length - i)%lgroup === 0 && i !== 0) {
      formatedText += groupSep;
    }
    formatedText += whole.charAt(i);
  }

  if(isNegative) {
    parts.push('-');
  }
  parts.push(formatedText);
  if(fractionLen && fraction !== '') {
    parts.push(decimalSep);
    parts.push(fraction.slice(0, fractionLen));
  }
  return parts.join('');
};
