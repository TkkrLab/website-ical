"use strict";
var ical = require('ical');
var RRule = require('rrule').RRule;
var RRuleSet = require('rrule').RRuleSet;
var rrulestr = require('rrule').rrulestr;

var url = "https://calendar.google.com/calendar/ical/ij2r5jaqg6l2bdt5uv6ltngfq0%40group.calendar.google.com/public/basic.ics";

var DUTCH = {
	dayNames: [
	'zondag', 'maandag', 'dinsdag', 'woensdag',
	'donderdag', 'vrijdag', 'zaterdag'
	],
	monthNames: [
	'januari', 'februari', 'maart', 'april', 'mei',
	'juni', 'juli', 'augustus', 'september', 'oktober',
	'november', 'december'
	],
	tokens: {
	'every': 'iedere',
	'day(s)': 'dagen',
	'day': 'dag',
	'month': 'maand',
	'on': 'op',
	'at': 'om',
	'the': 'de',
	'first': 'eerste',
	'second': 'tweede',
	'third': 'derde',
	'nth': 'e',
	'last': 'laatste',
	'for': '(',
	'time(s)': 'keren',
	'until': 'tot',
	'on the': 'op de',
	'and': 'en',
	'times': 'keer )',
	'rd': 'e',
	'months': 'maanden',
	'days': 'dagen'
	}
}

function getText(token) {
	var result = token;
	if (typeof DUTCH.tokens[token] !== "undefined") {
		result = DUTCH.tokens[token];
	}
	//console.log("getText",token,result);
	return result;
}

function dwt(a) {
    var d = new Date(a);
    d.setHours(0, 0, 0, 0);
    return d;
}

function date2text(date) {
  var day = date.getDate();
  if (day<10) day = "0"+day;
  var month = date.getMonth()+1;
  if (month<10) month = "0"+month;
  var year = date.getYear()+1900;
  var hour = date.getHours();
  if (hour<10) hour = "0"+hour;
  var minute = date.getMinutes();
  if (minute<10) minute = "0"+minute;
  return day+"-"+month+"-"+year+" "+hour+":"+minute;
}

var now = new Date();

ical.fromURL(url, {}, (err, data) => {
  var events = [];

  for (var k in data){
    if (data.hasOwnProperty(k)) {
      var ev = data[k];
      if (typeof ev.start !== "undefined") {
        var sev = {"summary":ev.summary,"start":ev.start,"end":ev.end,"description":ev.description,"location":ev.location,"recurring":null};
        if (typeof ev.rrule !== "undefined") {
          var rule = new RRule(ev.rrule.origOptions);
          var next = rule.after(now);
          if (next !== null) {
            sev.recurring = rule;
            var duration = ev.end.getTime() - ev.start.getTime();
            sev.start = next;
            sev.end = new Date(next.getTime() + duration); 
            events.push(sev);
          }
        } else {
          if (dwt(ev.start) >= dwt(now)) events.push(sev);
        }
      }
    }
  }

  //Sort em!
  events.sort(function(o1,o2) {
    return o1.start - o2.start;
  });

  //Now we can parse!
  var output = "---\n";
  output += "title: Agenda\n";
  output += "nodateline: true\n";
  output += "noprevnext: true\n";
  output += "disable_comments: true\n";
  output += "menu:\n";
  output += "  main:\n";
  output += "    weight: 6\n";
  output += "---\n\n";
  output += "Zie ook onze [wiki](https://tkkrlab.nl/wiki/TkkrLab:Current_events) voor meer informatie.\n";
  output += '<hr />\n\n';
  for (var k in events) {
    var ev = events[k];
    //console.log(ev);
    var start = date2text(ev.start);
    var end = date2text(ev.end);
    output += "## "+ev.summary+"\n";
    output += ev.description+"\\\n\n";
    output += "*Van "+start+" tot en met "+end+"*\\\n";
    if (ev.location.length>0) output += "*Locatie: "+ev.location+"*\\\n";
    if (ev.recurring!==null) output += "*Herhaalt zich "+ev.recurring.toText(getText,DUTCH)+"*\\\n";
    output += "\n";
  }
  console.log(output);
});
