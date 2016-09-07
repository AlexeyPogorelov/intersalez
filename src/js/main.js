

var X = XLSX;
var XW = {
	/* worker message */
	msg: 'xlsx',
	/* worker scripts */
	rABS: '../external/js-xlsx/xlsxworker2.js',
	norABS: '../external/js-xlsx/xlsxworker1.js',
	noxfer: '../external/js-xlsx/xlsxworker.js'
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
	var worker = new Worker(true ? XW.rABS : XW.norABS);
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
	var output = "";
	output = JSON.stringify(to_json(wb), 2, 2);
	if(out.innerText === undefined) out.textContent = output;
	else out.innerText = output;
	if(typeof console !== 'undefined') console.log("output", new Date());
}


var xlf = document.getElementById('xlf');
function handleFile(e) {
	rABS = true;
	xlf.className = 'disabled';
	use_worker = true;
	var files = e.target.files;
	var f = files[0];
	{
		var reader = new FileReader();
		var name = f.name;
		reader.onload = function(e) {
			if(typeof console !== 'undefined') console.log("onload", new Date(), rABS, use_worker);
			var data = e.target.result;
			xw_xfer(data, process_wb);
		};
		if(rABS) reader.readAsBinaryString(f);
		else reader.readAsArrayBuffer(f);
	}
}
if(xlf.addEventListener) xlf.addEventListener('change', handleFile, false);

var defaults = {
	subject: 'Intertech',
	mailbody: 'This is test EMAIL!'
}
var usersTable = document.getElementById('usersTable');

function closestTag (el, tag) {
	var current = el;
	if (typeof el !== "object") return;
	if (!current.tagName) return;
	while (current.parentNode) {
		current = current.parentNode;
		if (current.tagName === tag) {
			return current;
			break;
		}
	}
	return el;
}
function hideFileForm () {
	var formSection, customEmailBody, customEmailBodySection;
	formSection = document.getElementById('input-data-block');
	formSection.className = 'hidden';
	formSection.innerHTML = '';
	customEmailBody = document.getElementById('customEmailBody');
	customEmailBodySection = closestTag(customEmailBody, 'section');
	customEmailBodySection.className = '';
	// console.log(customEmailBodySection);
	customEmailBody.className = '';
}
function generateUsersTable (data) {
	var i, clients;
	if (typeof data !== "object") return;
	for (page in data) {
		clients = data[page];
		break;
	}
	for (i = 0; i < clients.length; i++) {
		renderUser(clients[i]);
		console.log(clients[i]);
	}
}
function renderUser (user) {
	var element, i, email, name, subject, text, checkboxCell, emailCell, nameCell;
	email = user.email;
	subject = user.subject || defaults.subject;
	name = user.name ? ', ' + name.replace('%', '') : '';
	text = user.text || false;
	element = document.createElement('tr');

	checkboxCell = document.createElement('td');
	emailCell = document.createElement('td');
	nameCell = document.createElement('td');

	checkboxCell.innerHTML = '<input type="checkbox">';
	emailCell.appendChild( createMailLink(email, subject, generateMailBody(text)) );
	nameCell.innerHTML = '<span>' + name + '</span>';

	element.appendChild(checkboxCell);
	element.appendChild(emailCell);
	element.appendChild(nameCell);

	usersTable.appendChild(element);
}
function createMailLink (email, subject, text) {
	var link = document.createElement('a');
	link.innerHTML = email;
	link.href = 'mailto:' +
		email +
		'?subject=' +
		subject +
		'&body=' +
		text;
	return link;
}
function generateMailBody(data) {
	if (data) return data;
	return defaults.mailbody;
}
