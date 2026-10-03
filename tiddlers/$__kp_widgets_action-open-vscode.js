/*\
title: $:/kp/widgets/action-open-vscode.js
type: application/javascript
module-type: widget

Action widget handling system prefixes, custom field detection (.json), and .tid/.js file extensions for VS Code launcher.
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

	var basePathClean = this.basePath.replace(/^file:\/\//, "").replace(/^["']|["']$/g, "").trim();
	if (!basePathClean.endsWith("/")) {
		basePathClean += "/";
	}

	var rawTitle = this.tiddlerTitle.replace(/^["']|["']$/g, "").trim();
	var tiddler = $tw.wiki.getTiddler(rawTitle);
	
	var fileExt = ".tid";
	var titleWorking = rawTitle;

	if (tiddler) {
		var type = (tiddler.fields.type || "").toLowerCase().trim();

		// 1. Explicit MIME Types
		if (type === "application/javascript") {
			fileExt = ".js";
		} else if (type === "text/css") {
			fileExt = ".css";
		} else if (type === "application/json") {
			fileExt = ".json";
		} else if (type === "text/html") {
			fileExt = ".html";
		} else {
			// 2. Custom field presence forces .json extension on disk
			var standardFields = [
				"title", "text", "type", "tags", "list", "created", 
				"modified", "modifier", "creator", "draft.of", "draft.title",
				"caption", "icon", "color", "description", "revision", "bag"
			];

			var fields = tiddler.fields;
			for (var fieldName in fields) {
				if (Object.prototype.hasOwnProperty.call(fields, fieldName)) {
					// Custom non-standard field detected -> .json
					if (standardFields.indexOf(fieldName) === -1) {
						fileExt = ".json";
						break;
					}

					if (fieldName === "text") continue;

					var fieldValue = fields[fieldName];
					if (typeof fieldValue === "string" && /[\r\n]/.test(fieldValue)) {
						fileExt = ".json";
						break;
					}
				}
			}
		}
	} else if (rawTitle.toLowerCase().endsWith(".json")) {
		fileExt = ".json";
	}

	// 3. Strip extension if already present in title
	var extRegex = new RegExp("\\" + fileExt + "$", "i");
	if (extRegex.test(titleWorking)) {
		titleWorking = titleWorking.replace(extRegex, "");
	}

	// 4. TidGi System Prefix conversion ($:/ -> $__)
	if (titleWorking.startsWith("$:/")) {
		titleWorking = "$__" + titleWorking.substring(3);
	}

	// 5. Universal path replacement (/ and : to _)
	var sanitizedTitle = titleWorking.replace(/[/:]/g, "_");

	// 6. Path normalization (NFD) and open file URL
	var fullFilePath = basePathClean + sanitizedTitle + fileExt;
	var normalizedPath = fullFilePath.normalize("NFD");
	var targetUrl = "file://" + encodeURI(normalizedPath);

	try {
		window.open(targetUrl, "_blank");
	} catch (e) {
		console.error("Failed to open file URL:", e);
	}

	return true;
};

// Ensure widget export matches the name called by your action widget tag in ViewToolbar
exports["action-open-vscode-file"] = OpenVSCodeFileWidget;
exports["action-open-vscode"] = OpenVSCodeFileWidget;

})();