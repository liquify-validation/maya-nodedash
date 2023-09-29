import React, { Component } from "react";
import { Chart } from "chart.js";

class CustomScatterChart extends Component {
  chartRef = React.createRef();
  chartInstance = null;

  componentDidMount() {
    this.createChart();
  }

  shouldComponentUpdate(nextProps) {
    const { data } = this.props;
    const nextData = nextProps.data;

    if (!data || !nextData) return true; // Added this to handle undefined or null data

    if (!data.datasets || !nextData.datasets) return true; // Handle the case where datasets might be undefined or not an array

    if (data.datasets.length !== nextData.datasets.length) return true;

    for (let i = 0; i < data.datasets.length; i++) {
      if (data.datasets[i].data !== nextData.datasets[i].data) return true;
    }

    return false;
  }

  componentDidUpdate() {
    this.updateChart();
  }

  componentWillUnmount() {
    this.destroyChart();
  }

  createChart() {
    const { data, options } = this.props;
    this.chartInstance = new Chart(this.chartRef.current, {
      type: "scatter",
      data,
      options,
    });
  }

  updateChart() {
    const { data, options } = this.props;
    if (this.chartInstance) {
      this.chartInstance.data = data;
      this.chartInstance.options = options;
      this.chartInstance.update();
    }
  }

  destroyChart() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  render() {
    return (
      <div className="custom-scatter-chart">
        <canvas ref={this.chartRef} />
      </div>
    );
  }
}

export default CustomScatterChart;
