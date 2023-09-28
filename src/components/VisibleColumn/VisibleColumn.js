import React, { useState } from "react";
import { Modal, Button, Switch } from "antd";
import globe_icon from "@iso/assets/images/overview/globe_icon.svg";
import version_icon from "@iso/assets/images/overview/version_icon.svg";
import CustomPieChart from "@iso/containers/A_monitor/CustomPieChart.js";
import useApiData from "@iso/containers/A_monitor/useApiData.js";
import { useTheme } from "../../ThemeContext.js";

import filterIcon from "@iso/assets/images/overview/filter.svg";
import "@iso/containers/A_monitor/chartjs-plugin";

function VisibleColumn({ initialConfig, onConfigUpdate }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [config, setConfig] = useState({
    ...initialConfig,
  });
  const { theme } = useTheme();

  const {
    data: locationData,
    loading: locationLoading,
    error: locationError,
  } = useApiData("https://maya-api.liquify.com/maya/api/locations");

  const {
    data: versionData,
    loading: versionLoading,
    error: versionError,
  } = useApiData("https://maya-api.liquify.com/maya/api/versions");

  if (locationLoading || versionLoading) return <p>Loading...</p>;
  if (locationError || versionError) return <p>Error loading data</p>;

  const locationPieChartData = {
    labels: Object.keys(locationData),
    datasets: [
      {
        data: Object.values(locationData),
        backgroundColor: [
          "#003f5c",
          "#2f4b7c",
          "#665191",
          "#a05195",
          "#d45087",
          "#f95d6a",
          "#ff7c43",
          "#ffa600",
          "#00876c",
          "#439981",
          "#6aaa96",
          "#8cbcac",
          "#aecdc2",
          "#cfdfd9",
          "#ee7d4f",
          "#f1d4d4",
          "#f0b8b8",
          "#ec9c9d",
          "#e67f83",
          "#de6069",
          "#633EBB",
        ],
      },
    ],
  };

  const versionPieChartData = {
    labels: Object.keys(versionData),
    datasets: [
      {
        data: Object.values(versionData),
        backgroundColor: ["#FD4E5D", "#B3CEE2", "#1C39BB"],
      },
    ],
  };

  const chartOptions = {
    fullSize: true,
    responsive: true,
    legend: {
      display: true,
      labels: {
        fontColor: theme === "light" ? "black" : "white",
        padding: 10,
      },
    },
    tooltips: {
      enabled: true,
    },
    animation: {
      animateScale: true,
      animateRotate: true,
    },
  };

  const handleConfigChange = (key, value) => {
    setConfig((prevConfig) => ({ ...prevConfig, [key]: value }));
  };

  const handleOk = () => {
    setIsModalVisible(false);
    console.log("Updated config:", config);
    if (onConfigUpdate) {
      onConfigUpdate(config);
    }
  };

  const handleCancel = () => {
    setIsModalVisible("");
  };

  const handleOpenModal = (modalType) => {
    setIsModalVisible(modalType);
  };

  return (
    <div>
      <Button
        type="secondary"
        onClick={() => handleOpenModal("filter")}
        className="button-filter"
      >
        <img src={filterIcon} />
      </Button>

      <Button
        type="secondary"
        onClick={() => handleOpenModal("pieChart")}
        className="button-filter"
      >
        <img src={globe_icon} />
      </Button>
      <Button
        type="secondary"
        onClick={() => handleOpenModal("version")}
        className="button-filter"
      >
        <img src={version_icon} />
      </Button>
      <Modal
        title="VISIBLE COLUMNS"
        okText="Confirm"
        visible={isModalVisible === "filter"}
        onOk={handleOk}
        onCancel={handleCancel}
        wrapClassName="filter-modal"
        closable={false}
      >
        <div className="filter-list">
          <div className="filter-item">
            <span>Nodes</span>
            <Switch
              checked={config.nodes}
              onChange={(checked) => handleConfigChange("nodes", checked)}
            />
          </div>
          <div className="filter-item">
            <span>Age</span>
            <Switch
              checked={config.age}
              onChange={(checked) => handleConfigChange("age", checked)}
            />
          </div>
          <div className="filter-item">
            <span>Action</span>
            <Switch
              checked={config.action}
              onChange={(checked) => handleConfigChange("action", checked)}
            />
          </div>
          <div className="filter-item">
            <span>ISP</span>
            <Switch
              checked={config.isp}
              onChange={(checked) => handleConfigChange("isp", checked)}
            />
          </div>
          <div className="filter-item">
            <span>Bond</span>
            <Switch
              checked={config.bond}
              onChange={(checked) => handleConfigChange("bond", checked)}
            />
          </div>
          <div className="filter-item">
            <span>Providers</span>
            <Switch
              checked={config.providers}
              onChange={(checked) => handleConfigChange("providers", checked)}
            />
          </div>
          <div className="filter-item">
            <span>Rewards</span>
            <Switch
              checked={config.rewards}
              onChange={(checked) => handleConfigChange("rewards", checked)}
            />
          </div>
          <div className="filter-item">
            <span>APY</span>
            <Switch
              checked={config.apy}
              onChange={(checked) => handleConfigChange("apy", checked)}
            />
          </div>
          <div className="filter-item">
            <span>Slashes</span>
            <Switch
              checked={config.slashes}
              onChange={(checked) => handleConfigChange("slashes", checked)}
            />
          </div>
          <div className="filter-item">
            <span>Score</span>
            <Switch
              checked={config.score}
              onChange={(checked) => handleConfigChange("score", checked)}
            />
          </div>
          <div className="filter-item">
            <span>Version</span>
            <Switch
              checked={config.version}
              onChange={(checked) => handleConfigChange("version", checked)}
            />
          </div>
          <div className="filter-item">
            <span>RPC</span>
            <Switch
              checked={config.rpc}
              onChange={(checked) => handleConfigChange("rpc", checked)}
            />
          </div>
          <div className="filter-item">
            <span>BFR</span>
            <Switch
              checked={config.bfr}
              onChange={(checked) => handleConfigChange("bfr", checked)}
            />
          </div>
        </div>
      </Modal>
      <Modal
        title="Locations"
        okText="Close"
        visible={isModalVisible === "pieChart"}
        onOk={handleCancel}
        onCancel={handleCancel}
        wrapClassName="pie-modal"
        closable={false}
        footer={[
          <Button key="submit" type="default" onClick={handleCancel}>
            Close
          </Button>,
        ]}
      >
        <CustomPieChart key={theme} data={locationPieChartData} options={chartOptions} />
      </Modal>

      <Modal
        title="Versions"
        okText="Close"
        visible={isModalVisible === "version"}
        onOk={handleCancel}
        onCancel={handleCancel}
        wrapClassName="pie-modal"
        closable={false}
        footer={[
          <Button key="submit" type="default" onClick={handleCancel}>
            Close
          </Button>,
        ]}
      >
        <CustomPieChart key={theme} data={versionPieChartData} options={chartOptions} />
      </Modal>
    </div>
  );
}

export default VisibleColumn;
