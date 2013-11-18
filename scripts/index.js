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
	directories: {},
	template: null,
	directory: null,
	sending: false
};

var f = ff(function () {
	fs.readFile("views/index.jade", "utf8", f.slot());
	
	fs.readFile("styles/index.less", "utf8", f.slot());
}, function (template, style) {
	f.pass(jade.compile(template, {
		compileDebug: false
	}));
	
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
state.showView = function (view, opts, data) {
	gui.Window.get().title = opts.title;
	
	document.getElementById("root").innerHTML = state.template({
		view: view,
		opts: opts,
		data: data
	});
};

state.loadDirectories = function () {
	var directories = JSON.parse(localStorage.directories || "[]");
	var passwords = JSON.parse(localStorage.passwords || "[]");
	
	directories.forEach(function (val, key) {
		state.directories[val] = {
			file: val,
			name: path.basename(val, path.extname(val)),
			path: path.dirname(val),
			pass: passwords[key]
		};
	});
};

state.saveDirectories = function () {
	var directories = Object.keys(state.directories);
	var passwords = directories.map(function (val) {
		return state.directories[val].pass;
	});
	
	localStorage.directories = JSON.stringify(directories);
	localStorage.passwords = JSON.stringify(passwords);
	
	state.loadDirectories();
};

state.showDirectories = function () {
	state.showView("list", {
		title: "bttrfly"
	}, state.directories);
};

state.createDirectory = function (path) {
	var f = ff(function () {
		fs.writeFile(path, "{\"contacts\":[]}", f.wait());
	}).onSuccess(function () {
		state.openDirectory(path);
	}).onError(function (err) {
		document.getElementById("file-create").click();
	});
};

state.openDirectory = function (path) {
	var f = ff(function () {
		fs.readFile(path, "utf8", f.slot());
	}, function (directory) {
		directory = JSON.parse(directory);
		
		if (typeof directory === "object" && Array.isArray(directory.contacts)) {
			f.pass(directory);
		} else {
			f.fail();
		}
	}).onSuccess(function (directory) {
		state.directories[path] = state.directories[path] || true;
		state.saveDirectories();
		
		state.directory = state.directories[path];
		state.directory.data = directory;
		
		state.showView("item", {
			title: state.directory.name,
			file: state.directory
		}, directory);
	}).onError(function (err) {
		delete state.directories[path];
		state.saveDirectories();
		state.showDirectories();
		document.getElementById("file-browse").click();
	});
};

state.saveDirectory = function () {
	var f = ff(function () {
		fs.writeFile(state.directory.file, JSON.stringify(state.directory.data, null, "\t"), f.wait());
	}).onError(function (err) {
		console.log(err);
	});
};

state.removeDirectory = function (path) {
	if (window.confirm("Are you sure you want to remove \"" + state.directories[path].name + "\"?")) {
		delete state.directories[path];
		state.saveDirectories();
		state.showDirectories();
	}
};

state.sendMessage = function (test) {
	var options = {
		user: state.directory.data.user,
		pass: document.getElementById("item-pass").value,
		tokens: state.directory.data.tokens,
		contacts: state.directory.data.contacts,
		message: document.getElementById("item-compose-text").value,
		dry: test
	};
	
	if (!options.user || !options.pass || !options.contacts || !options.message) {
		return;
	}
	
	var count = 0;
	var total = state.directory.data.contacts.reduce(function (pre, cur) {
		return pre + !cur.skip;
	}, 0);
	
	state.sending = true;
	
	document.getElementById("root").insertAdjacentHTML("beforeend", state.template({
		view: "send",
		total: total
	}));
	
	var cur = document.getElementById("send-count");
	var bar = document.getElementById("send-bar").children[0];
	var log = document.getElementById("send-log");
	
	bttrfly(options, function (err, contact) {
		if (!state.sending) {
			return false;
		}
		
		cur.textContent = ++count;
		bar.style.width = ((count / total) * 100) + "%";
		log.textContent += err
			? (test ? "Would text " : "Error texting ") + contact.phone + ": " + err + "\n"
			: "Texted " + contact.phone + "\n";
		log.scrollTop = log.scrollHeight;
	}, function (err, tokens) {
		if (err) {
			log.textContent += "Error: " + err + ".\n";
		}
		
		if (!test) {
			state.directory.data.tokens = tokens;
		}
		
		document.getElementById("send-stop").textContent = "Close";
		log.textContent += test ? "Texts simulated!" : "Texts sent!";
		log.scrollTop = log.scrollHeight;
	});
};

state.stopMessage = function () {
	state.sending = false;
	
	document.getElementsByClassName("modal")[0].remove();
	document.getElementsByClassName("modal-backdrop")[0].remove();
};


///////////////////////////////////////////////////////////////////////////////
// events
///////////////////////////////////////////////////////////////////////////////
window.addEventListener("dragover", function (evt) {
	evt.preventDefault();
}, false);

window.addEventListener("drop", function (evt) {
	evt.preventDefault();
	
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
	
	if (elem.id === "list-create") {
		document.getElementById("file-create").click();
	} else if (elem.id === "list-browse") {
		document.getElementById("file-browse").click();
	} else if (elem.id === "item-back") {
		state.saveDirectories();
		state.showDirectories();
	} else if (elem.id === "item-send") {
		state.sendMessage(false);
	} else if (elem.id === "item-test") {
		state.sendMessage(true);
	} else if (elem.id === "send-stop") {
		state.stopMessage();
	} else if (elem.classList.contains("list-item")) {
		if (orig.classList.contains("close")) {
			state.removeDirectory(elem.dataset.file);
		} else {
			state.openDirectory(elem.dataset.file);
		}
	} else {
		if (elem !== this) {
			evt._target = elem.parentNode;
			handle.call(this, evt);
		}
	}
}, false);

document.getElementById("root").addEventListener("change", function handle (evt) {
	var elem = evt.target;
	
	if (elem.id === "item-user" || elem.id === "item-pass" || elem.id === "item-pass-save") {
		var user = document.getElementById("item-user").value;
		var pass = document.getElementById("item-pass").value;
		var save = document.getElementById("item-pass-save").checked;
		
		state.directory.data.user = user;
		state.directory.pass = save ? pass : null;
		
		state.saveDirectory();
	}
}, false);

document.getElementById("root").addEventListener("input", function handle (evt) {
	var elem = evt.target;
	
	if (elem.id === "item-compose-text") {
		document.getElementById("item-compose-count").textContent = 160 - elem.value.length;
	}
}, false);