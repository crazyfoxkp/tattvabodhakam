/*\
title: $:/my/widgets/action-open-vscode-file.js
type: application/javascript
module-type: widget

Action widget handling system prefixes, .js, .css, .json, and .tid file extensions for VS Code launcher.
\*/
(function(){
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var OpenVSCodeFileWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

OpenVSCodeFileWidget.prototype = new Widget();

OpenVSCodeFileWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

OpenVSCodeFileWidget.prototype.execute = function() {
	this.basePath = this.getAttribute("$basePath");
	this.tiddlerTitle = this.getAttribute("$title");
};

OpenVSCodeFileWidget.prototype.invokeAction = function(triggeringWidget,event) {
	if (!this.basePath || !this.tiddlerTitle) return true;

	var basePathClean = this.basePath.replace(/^file:\/\//, "");
	if (!basePathClean.endsWith("/")) {
		basePathClean += "/";
	}

	var tiddler = $tw.wiki.getTiddler(this.tiddlerTitle);
	var fileExt = ".tid";
	var titleWorking = this.tiddlerTitle;

	if (tiddler) {
		var type = tiddler.fields.type || "";

		// 1. Map explicit MIME types to physical extensions
		if (type === "application/javascript") {
			fileExt = ".js";
		} else if (type === "text/css") {
			fileExt = ".css";
		} else if (type === "application/json") {
			fileExt = ".json";
		} else if (type === "text/html") {
			fileExt = ".html";
		} else {
			// 2. Check for multi-line fields forcing .json
			var fields = tiddler.fields;
			for (var fieldName in fields) {
				if (Object.prototype.hasOwnProperty.call(fields, fieldName)) {
					if (fieldName === "text") continue;

					var fieldValue = fields[fieldName];
					if (typeof fieldValue === "string" && /[\r\n]/.test(fieldValue)) {
						fileExt = ".json";
						break;
					}
				}
			}
		}
	}

	// 3. Strip extension if already present in title (e.g. .js)
	var extRegex = new RegExp("\\" + fileExt + "$", "i");
	if (extRegex.test(titleWorking)) {
		titleWorking = titleWorking.replace(extRegex, "");
	}

	// 4. Sanitize title
	var sanitizedTitle = "";
	
	// System tiddlers or code/module tiddlers convert / and : directly to _
	if (titleWorking.startsWith("$:/") || fileExt === ".js" || fileExt === ".css" || fileExt === ".html") {
		sanitizedTitle = titleWorking.replace(/[/:]/g, "_");
	} else {
		// Non-system standard content tiddlers use " _ " replacement
		sanitizedTitle = titleWorking.replace(/[/:]/g, "_");
	}

	// 5. Construct and launch file:// URI
	var fullFilePath = basePathClean + sanitizedTitle + fileExt;
	var targetUrl = "file://" + encodeURI(fullFilePath);

	try {
		window.open(targetUrl, "_blank");
	} catch (e) {
		console.error("Failed to open file URL:", e);
	}

	return true;
};

exports["action-open-vscode-file"] = OpenVSCodeFileWidget;

})();