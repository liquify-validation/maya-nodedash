import React, { Component } from "react";
import { Chart } from "chart.js";
import { Switch } from "antd";

class CustomLineChart extends Component {
  chartRef = React.createRef();
  chartInstance = null;
  state = {
    activeDatasetIndex: 0,
  };

  componentDidMount() {
    this.createChart();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.activeDatasetIndex !== this.state.activeDatasetIndex) {
      this.updateChart();
    }
  }

  componentWillUnmount() {
    this.destroyChart();
  }

  handleToggleChange = (checked) => {
    let currentLabel =
      this.chartInstance.options.scales.yAxes[0].scaleLabel.labelString;
    let newLabel;

    if (
      currentLabel === "Reward Amount (CACAO)" ||
      currentLabel === "Average (CACAO) per 100 Blocks"
    ) {
      newLabel = checked
        ? "Average (CACAO) per 100 Blocks"
        : "Reward Amount (CACAO)";
    } else if (
      currentLabel === "Slashes Value" ||
      currentLabel === "Average slashes per 100 Blocks"
    ) {
      newLabel = checked ? "Average slashes per 100 Blocks" : "Slashes Value";
    } else {
      console.error("Unhandled label case in toggle change:", currentLabel);
      return;
    }

    this.setState({ activeDatasetIndex: checked ? 1 : 0 }, () => {
      this.updateYAxisLabel(newLabel);
    });
  };

  updateYAxisLabel(newLabel) {
    if (
      this.chartInstance &&
      this.chartInstance.options.scales.yAxes[0].scaleLabel
    ) {
      this.chartInstance.options.scales.yAxes[0].scaleLabel.labelString =
        newLabel;
      this.chartInstance.update();
    }
  }

  createChart() {
    const { data, options } = this.props;
    const { activeDatasetIndex } = this.state;
    const dataset = data.datasets[activeDatasetIndex] || data.datasets[0];

    this.chartInstance = new Chart(this.chartRef.current, {
      type: "line",
      data: { datasets: [dataset] },
      options,
    });
  }

  updateChart() {
    const { data, options } = this.props;
    const { activeDatasetIndex } = this.state;
    const dataset = data.datasets[activeDatasetIndex] || data.datasets[0];

    if (this.chartInstance) {
      this.chartInstance.data = { datasets: [dataset] };
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
    const { data } = this.props;
    const { activeDatasetIndex } = this.state;
    const multipleDatasets = data.datasets && data.datasets.length > 1;

    return (
      <div className="custom-line-chart" style={{ textAlign: "center" }}>
        {multipleDatasets && (
          <div
            style={{
              alignItems: "center",
              textAlign: "center",
              marginBottom: "10px",
            }}
          >
            <Switch
              onChange={this.handleToggleChange}
              className="custom-switch"
            />
            <span style={{ marginLeft: "10px", fontSize: "14px" }}>
              Average / 100 Blocks
            </span>
          </div>
        )}
        <canvas ref={this.chartRef} />
      </div>
    );
  }
}

export default CustomLineChart;
