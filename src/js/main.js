var notification = (function () {
	var opened = [],
		lastTop = 0,
		animationPrefix = (function () {
			var t,
			el = document.createElement("fakeelement");
			var transitions = {
				"WebkitTransition": "webkitAnimationEnd",
				"OTransition": "oAnimationEnd",
				"MozTransition": "animationend",
				"transition": "animationend"
			};
			for (t in transitions) {

				if (el.style[t] !== undefined) {

					return transitions[t];

				}

			}
		})();

	options = {
		'notificationClass': 'notification',
		'marginTop': 10,
		'timeout': 10000
	};

	var plg = {
		show: function ( text, cls, selector ) {
			var $notification, $parent;

			if (!(typeof text === 'string' && text.length > 1)) return false;

			$notification = plg.create( text, cls );

			if (selector) {
				$parent = $( selector );
			} else {
				$parent = $('body');
			}
			if ($parent.length < 1) $parent = $('body');
			$notification
				.appendTo( $parent )
				.one( animationPrefix, function () {
					plg.hide( $notification );
				});

			setTimeout(function() {
				plg.hide( $notification );
			}, options.timeout);

		},
		hide: function ($notification) {

			for ( var y = 0; y < opened.length; y++ ) {

				if ($notification === opened[y]) {
					opened.splice(y, 1);
					$notification.remove();
				}

			}

			if (opened.length === 0) {
				lastTop = 0;
			}

		},
		calculateTop: function () {
			var top = 0;
			for (var i = 0; i < opened.length; i++) {
				top += opened[i].prop('scrollHeight') + options.marginTop;
			}
			return top;
		},
		create: function (text, cls) {
			var top = lastTop + options.marginTop;
			$notification = $('<div>')
				.addClass(options.notificationClass)
				.css({
					'top': top
				})
				.html( text );
			if (cls && typeof cls === 'string') {
				$notification.addClass(cls);
			}
			setTimeout(function() {
				lastTop = top + $notification.prop('scrollHeight');
				opened.push($notification);
			}, 1);
			return $notification;
		}

	};

	return plg.show;
})();

var X = XLSX;
var XWbk = {
	/* worker message */
	msg: 'xlsx',
	/* worker scripts */
	rABS: '../external/js-xlsx/xlsxworker2.js',
	norABS: '../external/js-xlsx/xlsxworker1.js',
	noxfer: '../external/js-xlsx/xlsxworker.js'
};
var XW = {
	/* worker message */
	msg: 'xlsx',
	/* worker scripts */
	rABS: 'http://pogorelov.cc.ua/intersalez/external/js-xlsx/xlsxworker2.js',
	norABS: 'http://pogorelov.cc.ua/intersalez/external/js-xlsx/xlsxworker1.js',
	noxfer: 'http://pogorelov.cc.ua/intersalez/external/js-xlsx/xlsxworker.js'
};

function fixdata(data) {
	var o = "", l = 0, w = 10240;
	for(; l<data.byteLength/w; ++l) o+=String.fromCharCode.apply(null,new Uint8Array(data.slice(l*w,l*w+w)));
	o+=String.fromCharCode.apply(null, new Uint8Array(data.slice(l*w)));
	return o;
}

function ab2str(data) {
	var o = "", l = 0, w = 10240;
	for(; l<data.byteLength/w; ++l) o+=String.fromCharCode.apply(null,new Uint16Array(data.slice(l*w,l*w+w)));
	o+=String.fromCharCode.apply(null, new Uint16Array(data.slice(l*w)));
	return o;
}

function s2ab(s) {
	var b = new ArrayBuffer(s.length*2), v = new Uint16Array(b);
	for (var i=0; i != s.length; ++i) v[i] = s.charCodeAt(i);
	return [v, b];
}

function xw_xfer(data, cb) {
	var worker;
	try {
		worker = new Worker(XW.rABS);
	} catch (e) {
		XW = XWbk;
		worker = new Worker(XW.rABS);
	}
	worker.onmessage = function(e) {
		console.log(e.data.t);
		switch(e.data.t) {
			case 'ready': break;
			case 'e': console.error(e.data.d); break;
			default: xx=ab2str(e.data).replace(/\n/g,"\\n").replace(/\r/g,"\\r"); console.log("done"); cb(JSON.parse(xx)); break;
		}
	};
	worker.onerror = function(e) {
		console.log(e);
	};
	var val = s2ab(data);
	worker.postMessage(val[1], [val[1]]);
}

function to_json(workbook) {
	var result = {};
	workbook.SheetNames.forEach(function(sheetName) {
		var roa = X.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
		if(roa.length > 0){
			result[sheetName] = roa;
		}
	});
	return result;
}


function process_wb(wb) {
	generateUsersTable( to_json(wb) );
	hideFileForm();
	return;
}


var xlf = document.getElementById('xlf');
function handleFile(e) {
	var files = e.target.files;
	var f = files[0];
	var reader = new FileReader();
	var name = f.name;
	xlf.className = 'disabled';
	if (f.name.search('.txt') > 0) {
		reader.onload = function(e) {
			var data = e.target.result,
				restored;
			restored = restoreSentEmails(data);
			xlf.value = null;
			xlf.className = '';
			if (restored > 0) {
				notification('file loaded');
			} else {
				notification('file loaded', 'error');
			}
		};
		reader.readAsBinaryString(f);
	} else {
		reader.onload = function(e) {
			if(typeof console !== 'undefined') console.log("onload", new Date(), true, true);
			var data = e.target.result;
			xw_xfer(data, process_wb);
		};
		reader.readAsBinaryString(f);
	}
}
if(xlf.addEventListener) xlf.addEventListener('change', handleFile, false);

var defaults = {
	subject: 'Intertech',
	mailbody: 'This is test EMAIL!'
};
var usersTable = document.getElementById('usersTable');
var usersLength = 0;
var mailbody = null;

function generateMailBody (data) {
	if (data) return data;
	return mailbody || defaults.mailbody;
}

function closestTag (el, tag) {
	var current = el;
	if (typeof el !== "object" && typeof tag !== "string") return;
	if (!current.tagName) return;
	while (current.parentNode) {
		current = current.parentNode;
		if (current.tagName.toLowerCase() === tag.toLowerCase()) {
			return current;
		}
	}
	return el;
}
document.getElementById('addCustomMail').addEventListener('click', function () {
	var parentNode, form;
	parentNode = this.parentNode;
	form = parentNode.getElementsByTagName('form');
	form[0].className = '';
	parentNode.removeChild(this);
}, false);
function hideFileForm () {
	var formSection, customEmailBody, customEmailBodySection, fixedControls;
	formSection = document.getElementById('input-data-block');
	formSection.className = 'hidden';
	formSection.innerHTML = '';
	customEmailBody = document.getElementById('customEmailBody');
	customEmailBodySection = closestTag(customEmailBody, 'section');
	customEmailBodySection.className = 'customEmailBody';
	customEmailBody.className = '';
	fixedControls = document.getElementById('fixed-controls');
	fixedControls.className = 'fixed-controls';
	customEmailBody.addEventListener('change', function (e) {
		if (this.value) {
			mailbody = this.value;
		}
	}, false);
}
function replaceTemplate (text, object) {
	if (typeof object !== 'object' || typeof text !== 'string' || text.length < 5) return text;
	var prop, expr;
	for (prop in object) {
		expr = new RegExp('{{' + prop + '}}', 'g');
		text = text.replace(expr, object[prop]);
		return text;
	}
}
function generateUsersTable (data) {
	var i, clients, page;
	if (typeof data !== "object") return;
	for (page in data) {
		clients = data[page];
		break;
	}
	for (i = 0; i < clients.length; i++) {
		renderUser(clients[i]);
	}
}
function renderUser (user) {
	var element, i, id, email, name, subject, text, checkboxCell, checkbox, emailCell, nameCell;
	i = 0;
	// console.log( user );
	email = user.email;
	subject = user.subject || defaults.subject;
	try {
		name = user.name ? ', ' + name.replace('%', '') : '';
	} catch (e) {
		name = user.name;
	}

	text = user.text || false;
	try {
		id = email.substr(0,4) + (Math.random()*10000) + new Date().getTime().toString().substr(-8,8) + usersLength++;
	} catch (e) {
		id = parseInt(Math.random()*10000) + new Date().getTime().toString().substr(-8,8) + usersLength++;
	}
	element = document.createElement('tr');
	element.id = id;

	checkboxCell = document.createElement('td');
	emailCell = document.createElement('td');
	nameCell = document.createElement('td');

	checkbox = document.createElement('input');
	checkbox.type = "checkbox";
	checkboxCell.appendChild( checkbox );
	emailCell.appendChild( createMailLink(email, subject, generateMailBody(text)) );
	nameCell.innerHTML = '<span>' + name + '</span>';

	element.appendChild(checkboxCell);
	element.appendChild(emailCell);
	element.appendChild(nameCell);

	if (localStorage.getItem(email)) {
		checkbox.checked = true;
		element.className = 'disabled';
	}

	usersTable.appendChild(element);
	element.addEventListener('click', function (e) {
		var link;
		if (e.target.tagName.toLowerCase() === 'input' && e.target.type === 'checkbox' && !e.target.checked) {
			element.className = '';
			e.target.checked = false;
			localStorage.removeItem(email);
		} else {
			link = createMailLink(email, subject, generateMailBody( replaceTemplate(text, {
				name: name
			}) ));
			link.click();
			link = null;
			checkbox.checked = true;
			element.className = 'disabled';
			localStorage.setItem(email, true);
		}
	}, false);
}
function createMailLink (email, subject, text) {
	var link = document.createElement('a');
	link.target = '_blank';
	link.innerHTML = email;
	if (!text) {
		text = mailbody;
	}
	link.href = 'mailto:' +
		email +
		'?subject=' +
		subject +
		'&body=' +
		text;
	return link;
}
function saveSentEmails () {
	var array = [];
	for (var i = 0; i < localStorage.length; i++) {
		array.push(localStorage.key(i));
	}
	saveFile( array.toString() );
}
function restoreSentEmails (data) {
	var i;
	data = data.split(',');
	for (i = 0; i < data.length; i++) {
		localStorage.setItem(data[i], true);
	}
	return i;
}
function saveFile (string) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(string));
	element.setAttribute('download', "emails.txt");
	element.click();
	element = null;
}
function autoSend () {
	var rows = document.getElementsByTagName('tr');
	for (var i = 0; i < rows.length; i++) {
		if (rows[i].className !== "disabled") {
			rows[i].click();
			return;
		}
	}
}

window.addEventListener('keydown', function (e) {
	if (e.ctrlKey && e.keyCode == 13) {
		autoSend();
	}
}, false);
