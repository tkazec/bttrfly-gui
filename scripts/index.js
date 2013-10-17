var ff = require("ff");
var fs = require("fs");
var gui = require("nw.gui");
var jade = require("jade");
var less = require("less");

var f = ff(function () {
	fs.readFile("views/index.jade", "utf8", f.slot());
	fs.readFile("styles/index.less", "utf8", f.slot());
}, function (view, style) {
	f.pass(jade.compile(view));
	less.render(style, f.slot());
}, function (tmpl, style) {
	document.getElementById("root").innerHTML = tmpl();
	document.getElementById("less").textContent = style;
}).onError(function (err) {
	console.log(err);
}).onComplete(function (err) {
	gui.Window.get().show();
});

window.addEventListener("dragover", function (evt) {
	evt.preventDefault();
}, false);

window.addEventListener("drop", function (evt) {
	evt.preventDefault();
	
	Array.prototype.slice.call(evt.dataTransfer.files).forEach(function (v) {
		openDirectory(v.path);
	});
}, false);

document.getElementById("file").addEventListener("change", function (evt) {
	openDirectory(this.value);
}, false);

document.getElementById("root").addEventListener("click", function handle (evt) {
	var elem = evt._target || evt.target;
	var orig = evt.target;
	
	if (elem.id === "directory-open") {
		document.getElementById("file").click();
	} else if (elem.classList.contains("directory-item")) {
		if (orig.classList.contains("close")) {
			deleteDirectory(elem.dataset.directory);
		} else {
			openDirectory(elem.dataset.directory);
		}
	} else {
		if ((evt._target = cur.parentNode) !== this) {
			handle(evt);
		}
	}
}, false);