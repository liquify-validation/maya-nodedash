import Chart from "chart.js";

Chart.Legend.prototype.afterFit = function () {
  this.height = this.height + 20;
};
