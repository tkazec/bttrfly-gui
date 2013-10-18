///////////////////////////////////////////////////////////////////////////////
// initializers
///////////////////////////////////////////////////////////////////////////////
var bttrfly = require("bttrfly");
var ff = require("ff");
var fs = require("fs");
var gui = require("nw.gui");
var jade = require("jade");
var less = require("less");
var path = require("path");

var state = {
	directories: {}
};

var f = ff(function () {
	fs.readFile("views/index.jade", "utf8", f.slot());
	
	fs.readFile("styles/index.less", "utf8", f.slot());
}, function (template, style) {
	f.pass(jade.compile(template));
	
	less.render(style, f.slot());
}, function (template, style) {
	state.template = template;
	state.loadDirectories();
	state.showDirectories();
	
	document.getElementById("less").textContent = style;
}).onError(function (err) {
	console.log(err);
}).onComplete(function (err) {
	gui.Window.get().show();
});


///////////////////////////////////////////////////////////////////////////////
// helpers
///////////////////////////////////////////////////////////////////////////////
state.showView = function (view, title, data) {
	gui.Window.get().title = title;
	
	document.getElementById("root").innerHTML = state.template({
		view: view,
		title: title,
		data: data
	});
};

state.loadDirectories = function () {
	JSON.parse(localStorage.directories || "[]").forEach(function (val) {
		state.directories[val] = {
			file: val,
			name: path.basename(val, path.extname(val)),
			path: path.dirname(val)
		};
	});
};

state.saveDirectories = function () {
	localStorage.directories = JSON.stringify(Object.keys(state.directories));
	state.loadDirectories();
};

state.showDirectories = function () {
	state.showView("list", "bttrfly", state.directories);
};

state.createDirectory = function (path) {
	var f = ff(function () {
		fs.writeFile(path, "{}", f.wait());
	}).onSuccess(function () {
		state.openDirectory(path);
	}).onError(function () {
		document.getElementById("file-create").click();
	});
};

state.openDirectory = function (path) {
	var f = ff(function () {
		fs.readFile(path, "utf8", f.slot());
	}, function (directory) {
		f.pass(JSON.parse(directory));
	}).onSuccess(function (directory) {
		state.directories[path] = true;
		state.saveDirectories();
		
		state.showView("item", state.directories[path].name, directory);
	}).onError(function (err) {
		delete state.directories[path];
		state.saveDirectories();
		state.showDirectories();
		document.getElementById("file-browse").click();
	});
};

state.removeDirectory = function (path) {
	if (window.confirm("Are you sure you want to remove \"" + state.directories[path].name + "\"?")) {
		delete state.directories[path];
		state.saveDirectories();
		state.showDirectories();
	}
};


///////////////////////////////////////////////////////////////////////////////
// events
///////////////////////////////////////////////////////////////////////////////
window.addEventListener("dragover", function (evt) {
	evt.preventDefault();
}, false);

window.addEventListener("drop", function (evt) {
	evt.preventDefault();
	
	for (var i = evt.dataTransfer.files.length; i--;) {
		state.directories[evt.dataTransfer.files[i].path] = true;
	}
	
	state.saveDirectories();
	state.openDirectory(evt.dataTransfer.files[0].path);
}, false);

document.getElementById("file-create").addEventListener("change", function (evt) {
	state.createDirectory(this.value);
}, false);

document.getElementById("file-browse").addEventListener("change", function (evt) {
	state.openDirectory(this.value);
}, false);

document.getElementById("root").addEventListener("click", function handle (evt) {
	var elem = evt._target || evt.target;
	var orig = evt.target;
	
	if (elem.id === "directory-create") {
		document.getElementById("file-create").click();
	} else if (elem.id === "directory-browse") {
		document.getElementById("file-browse").click();
	} else if (elem.id === "directory-back") {
		state.showDirectories();
	} else if (elem.classList.contains("directory-item")) {
		if (orig.classList.contains("close")) {
			state.removeDirectory(elem.dataset.directory);
		} else {
			state.openDirectory(elem.dataset.directory);
		}
	} else {
		if (elem !== this) {
			evt._target = elem.parentNode;
			handle(evt);
		}
	}
}, false);