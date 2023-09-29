import React, { Component } from "react";
import { Chart } from "chart.js";

class CustomPieChart extends Component {
  chartRef = React.createRef();
  chartInstance = null;

  componentDidMount() {
    this.createChart();
  }

  shouldComponentUpdate(nextProps) {
    const { data: currentData } = this.props;
    const nextData = nextProps.data;

    if (currentData.datasets.length !== nextData.datasets.length) return true;

    for (let i = 0; i < currentData.datasets.length; i++) {
      if (
        JSON.stringify(currentData.datasets[i].data) !==
        JSON.stringify(nextData.datasets[i].data)
      )
        return true;
    }

    return false;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.isModalOpen && !this.props.isModalOpen) {
      this.updateChart();
    }
  }

  componentWillUnmount() {
    this.destroyChart();
  }

  createChart() {
    const { data, options } = this.props;
    this.chartInstance = new Chart(this.chartRef.current, {
      type: "doughnut",
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
      <div className="custom-pie-chart">
        <canvas ref={this.chartRef} />
      </div>
    );
  }
}

export default CustomPieChart;
