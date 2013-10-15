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