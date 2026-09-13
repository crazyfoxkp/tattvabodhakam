/*\
title: $:/plugins/jerojasro/copyhtml/copyhtmlwidget.js
type: application/javascript
module-type: widget
Action widget to allow copying the HTML contents of a tiddler.
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var CopyHTMLWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
CopyHTMLWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
CopyHTMLWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
};

CopyHTMLWidget.prototype.execute = function(){
	this.tiddlerTitle = this.getAttribute("tiddler","");
	this.command = this.getAttribute("command","");
}

/*
Refresh the widget by ensuring our attributes are up to date
*/
CopyHTMLWidget.prototype.refresh = function(changedTiddlers) {
	this.refreshSelf();
	return true;
};

CopyHTMLWidget.prototype.copy = function() {
     console.log("click from tiddler: ");
     console.log(this.tiddlerTitle);

     var textToCopy = document.querySelector('[data-tiddler-title="' + this.tiddlerTitle + '"] .tc-tiddler-body');
 
     //check and see if the user had a text selection range
     var currentRange;
     if(document.getSelection().rangeCount > 0)
     {
          //the user has a text selection range, store it
          currentRange = document.getSelection().getRangeAt(0);
          //remove the current selection
          window.getSelection().removeRange(currentRange);
     }
     else
     {
          //they didn't have anything selected
          currentRange = false;
     }
 
     //create a selection range
     var CopyRange = document.createRange();
     //choose the element we want to select the text of
     CopyRange.selectNode(textToCopy);
     //select the text inside the range
     window.getSelection().addRange(CopyRange);
     //copy the text to the clipboard
     document.execCommand("copy");
 
     //remove our selection range
     window.getSelection().removeRange(CopyRange);
 
     //return the old selection range
     if(currentRange)
     {
          window.getSelection().addRange(currentRange);
     }

};

var availableCommands = ["copy"];

/*
Invoke the action associated with this widget
*/
CopyHTMLWidget.prototype.invokeAction = function(triggeringWidget,event) {
	if (!availableCommands.includes(this.command)) {
		console.log("invalid command: " + this.command);
		return true;
	}
	this[this.command]();
	return true; // Action was invoked
};

exports["action-copyhtml"] = CopyHTMLWidget;

})();
