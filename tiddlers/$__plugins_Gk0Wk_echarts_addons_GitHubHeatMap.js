/*\
title: $:/plugins/Gk0Wk/echarts/addons/GitHubHeatMap.js
type: application/javascript
module-type: library
\*/

(function(){
"use strict";
exports.default = {
  onMount: function(chart, attr) {
    return { filter: attr.subfilter || "[all[tiddlers]!is[shadow]!is[system]]" };
  },
  onUpdate: function(instance, attr, element) {
    // Query the wiki using the subfilter provided in the widget
    var titles = $tw.wiki.filterTiddlers(instance.filter);
    var dateCounts = {};
    
    titles.forEach(function(title) {
      var tiddler = $tw.wiki.getTiddler(title);
      if (tiddler && tiddler.fields && tiddler.fields.created) {
        // Convert TiddlyWiki timestamp (YYYYMMDD...) to YYYY-MM-DD
        var created = tiddler.fields.created.toString();
        var year = created.substr(0, 4);
        var month = created.substr(4, 2);
        var day = created.substr(6, 2);
        var dateStr = year + "-" + month + "-" + day;
        
        dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
      }
    });
    
    var chartData = [];
    for (var date in dateCounts) {
      chartData.push([date, dateCounts[date]]);
    }

    instance.setOption({
      title: { text: "Tiddler Activity", left: "center", top: 0 },
      tooltip: { position: "top" },
      visualMap: { min: 0, max: 10, calculable: true, orient: "horizontal", left: "center", bottom: 0 },
      calendar: { top: 40, left: 30, right: 30, range: attr.year || "2026", cellSize: 15 },
      series: {
        type: "heatmap",
        coordinateSystem: "calendar",
        data: chartData
      }
    });
  }
};
})();