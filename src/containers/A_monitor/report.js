import React, { Component, useState, useEffect } from "react";
import isEmpty from "lodash/isEmpty";
import { useLocation, useParams, useHistory } from "react-router-dom";

import CustomLineChart from "./CustomLineChart";
import CustomScatterChart from "./CustomScatterChart";
import loadingIcon from "@iso/assets/images/overview/loading.png";

// import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Modals from "@iso/components/Feedback/Modal";
import Popover from "@iso/components/uielements/popover";
import { getData, setCookie, getCookie } from "CommonFunctions";
import mayaLogo from "@iso/assets/images/maya_logo.png";

import { ModalContent } from "../Feedback/Modal/Modal.styles";
import {
  Layout,
  Button,
  Input,
  Breadcrumb,
  Table,
  Select,
  message,
  Card,
  Icon,
} from "antd";
import "./styles.css";
import { Link } from "react-router-dom";
import { PUBLIC_ROUTE } from "../../route.constants";
import {
  SearchOutlined,
  LeftOutlined,
  RightOutlined,
  HistoryOutlined,
  RiseOutlined,
  GiftOutlined,
  FundProjectionScreenOutlined,
  UpSquareOutlined,
  DownSquareOutlined,
  OrderedListOutlined,
  NodeExpandOutlined,
  TrophyOutlined,
} from "@ant-design/icons";

import { useTheme } from "../../ThemeContext.js";
import { ThemeContext } from "../../ThemeContext.js";
import ThemeToggleButton from "./ThemeToggleButton.js";

import githubIcon from "@iso/assets/images/overview/github_link_icon.svg";
import twitterIcon from "@iso/assets/images/overview/twitter_link_icon.svg";
import liquifyLogo from "@iso/assets/images/overview/liquify_logo.svg";
import liquifyLogoDark from "@iso/assets/images/overview/liquify_logo_darkmode.svg";

import arrowDownIcon from "@iso/assets/images/overview/arrow-down.svg";
import { node } from "prop-types";

const { Header, Footer, Content } = Layout;
const { Option } = Select;

const headerStyle = {
  cursor: "pointer",
  padding: "12px 15px",
  fontSize: 15,
  color: "#ffffff",
  backgroundColor: "rgba(24, 34, 51, 0.4)",
  height: 55,
  fontWeight: 600,
};

const ReportPage = ({ setNodeAddress }) => {
  const { nodeAddress: nodeAddressParam } = useParams();

  useEffect(() => {
    if (nodeAddressParam) {
      setNodeAddress(nodeAddressParam);
    }
  }, [nodeAddressParam, setNodeAddress]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        marginBottom: "20px",
      }}
    >
      <h1 className="report-title">
        Report for Node Address {nodeAddressParam}
      </h1>

      <h2 className="report-subtitle">
        Generate report based on the churns below
      </h2>
    </div>
  );
};

const columns = [
  {
    title: "Height",
    dataIndex: "churnHeight",
    key: "churnHeight",
  },
  {
    title: "Date",
    dataIndex: "date",
    key: "date",
  },
  {
    title: "Price",
    dataIndex: "price",
    key: "price",
  },
  {
    title: "Rewards (RUNE)",
    dataIndex: "rewards",
    key: "rewards",
  },
  {
    title: "Rewards ($)",
    dataIndex: "dollarValue",
    key: "dollarValue",
  },
];

let timer = null;

export default class extends Component {
  static contextType = ThemeContext;
  constructor(props) {
    super(props);
    this.state = {
      isPopoverOpen: false,
      chartData: [],
      data: [],
      churns: [],
      churnsTo: [],
      selectedFrom: undefined,
      selectedTo: undefined,
      loadingChurns: false,
      globalData: [],
      activeNodes: [],
      animateBlockCount: false,
      nodesFilter: {},
      loading: true,
      sortByChain: null,
      minX: null,
      maxX: null,
      bondOptions: null,
      rewardsoptions: null,
      isDataFetched: false,
    };
  }

  handlePopoverVisibility = (visible) => {
    this.setState({ isPopoverOpen: visible });
  };

  setNodeAddress = (nodeAddress) => {
    this.setState({ nodeAddress });
  };

  exportPDF = () => {
    const unit = "pt";
    const size = "A4";
    const orientation = "landscape";

    const doc = new jsPDF(orientation, unit, size);

    doc.setFontSize(10);

    const title = "Report";
    const headers = [
      ["Height", "Date", "Price", "Rewards (RUNE)", "Rewards ($)"],
    ];

    const data = this.state.tableData.map((elt) => [
      elt.churnHeight,
      elt.date,
      elt.price,
      elt.rewards,
      elt.dollarValue,
    ]);

    let content = {
      startY: 50,
      head: headers,
      body: data,
    };

    doc.text(title, 40, 40);
    autoTable(doc, content);
    doc.save("report.pdf");
  };

  async refreshData() {
    if (this.state.loading) {
      this.setState({ loading: false });
    }
  }

  exportCSV = () => {
    const headers = [
      "Height",
      "Date",
      "Price",
      "Rewards (CACAO)",
      "Rewards ($)",
    ];
    const data = this.state.tableData.map((row) => [
      row.churnHeight,
      row.date,
      row.price,
      row.rewards,
      row.dollarValue,
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      data.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "report.csv");
    document.body.appendChild(link);

    link.click();
  };

  componentDidMount() {
    this.fetchChurns();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.nodeAddress !== this.state.nodeAddress) {
      this.fetchChurns();
    }
  }

  fetchChurns = async () => {
    const { nodeAddress } = this.state;

    if (!nodeAddress) {
      this.setState({ loading: false });
      return;
    }

    try {
      this.setState({ loadingChurns: true, loading: true });
      const response = await fetch(
        `https://maya-api.liquify.com/maya/api/grabChurnsForNode=${nodeAddress}`
      );
      const data = await response.json();

      if (data.length === 0) {
        message.error("No data returned from the API");
        this.setState({ loading: false });
      } else {
        const formattedData = data.map((item) => ({
          key: item.churnHeight,
          value: `${item.churnHeight} (${item.date})`,
        }));
        this.setState({ churns: formattedData, loading: false });
      }
    } catch (error) {
      message.error("Failed to fetch data");
      console.error("Error:", error);
      this.setState({ loading: false });
    } finally {
      this.setState({ loadingChurns: false });
    }
  };

  handleFromChange = (value) => {
    const { churns } = this.state;
    const filteredChurnsTo = churns.filter((churn) => churn.key > value);
    this.setState({ selectedFrom: value, churnsTo: filteredChurnsTo });
  };

  handleToChange = (value) => {
    this.setState({ selectedTo: value });
  };

  componentWillUnmount() {
    clearInterval(timer);
  }

  processChartData = (graphData) => {
    if (!graphData || !graphData.Xticks) {
      this.setState({
        maxData: null,
        positionData: null,
        bondData: null,
        rewardsData: null,
      });
      return;
    }

    const maxData = graphData.Xticks.map((x, index) => ({
      x,
      y: graphData.maxPosition[index],
    }));

    const positionData = graphData.Xticks.map((x, index) => ({
      x,
      y: graphData.position[index],
    }));

    const bondData = graphData.Xticks.map((x, index) => ({
      x: Number(x),
      y: Math.round(graphData.bond[index] / 100000000),
    }));

    const rewardsData = graphData.Xticks.map((x, index) => ({
      x: Number(x),
      y: Math.round(graphData.rewards[index] / 100000000),
    }));

    const minX = Math.min(...graphData.Xticks);
    const maxX = Math.max(...graphData.Xticks);

    this.setState({ maxData, positionData, bondData, rewardsData, minX, maxX });
  };

  handleSubmit = async () => {
    const { selectedFrom, selectedTo, nodeAddress } = this.state;

    if (!selectedFrom || !selectedTo || !nodeAddress) {
      message.error(
        "Please select both start and end values and provide a node address."
      );
      return;
    }

    try {
      const response = await fetch(
        "https://maya-api.liquify.com/maya/api/generateReport",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            start: selectedFrom,
            end: selectedTo,
            node: nodeAddress,
          }),
        }
      );

      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(
          `HTTP error! Status: ${response.status}, Detail: ${errorDetail}`
        );
      }

      const data = await response.json();

      const tableData = data.tableData.churnHeight.map((height, index) => {
        return {
          key: index,
          churnHeight: height,
          date: data.tableData.date[index],
          price: parseFloat(data.tableData.price[index]).toFixed(2),
          rewards: parseFloat(data.tableData.rewards[index]).toFixed(2),
          dollarValue: parseFloat(data.tableData.dollarValue[index]).toFixed(2),
        };
      });

      this.setState({ apiResponse: data, tableData });

      message.success("Report generated successfully");
      this.setState({ apiResponse: data, tableData, isDataFetched: true });
      this.processChartData(data.graphData);
    } catch (error) {
      message.error(`Failed to generate report: ${error.message}`);
      console.error("Error details:", error);
    }
  };

  displayApiResponse = (data) => {
    if (!data) return null;

    const {
      startBlock,
      endBlock,
      startBond,
      endBond,
      BondIncrease,
      position,
      maxPosition,
      totalRewards,
      graphData,
      maxPositionChartDataConfig,
      chartDataConfig,
      rewardsChartDataConfig,
      maxPositionOptions,
      bondOptions,
      rewardsOptions,
    } = data;

    const { nodeAddress } = this.state;

    return (
      <>
        <div className="overview-item">
          <UpSquareOutlined style={{ fontSize: "20px" }} />
          <div className="overview-item__value">
            <div className="overview-item__value-title">Start Block</div>
            <div className="overview-item__value-value">{startBlock}</div>
          </div>
        </div>
        <div className="overview-item">
          <DownSquareOutlined style={{ fontSize: "20px" }} />
          <div className="overview-item__value">
            <div className="overview-item__value-title">End Block</div>
            <div className="overview-item__value-value">{endBlock}</div>
          </div>
        </div>
        <div className="overview-item">
          <NodeExpandOutlined style={{ fontSize: "20px" }} />
          <div className="overview-item__value">
            <div className="overview-item__value-title">Start Bond</div>
            <div className="overview-item__value-value">
              ᚱ{Math.round(startBond / 100000000).toFixed(2)}
            </div>
          </div>
        </div>
        <div className="overview-item">
          <TrophyOutlined style={{ fontSize: "20px" }} />
          <div className="overview-item__value">
            <div className="overview-item__value-title">End Bond</div>
            <div className="overview-item__value-value">
              ᚱ{Math.round(endBond / 100000000).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="overview-item">
          <FundProjectionScreenOutlined style={{ fontSize: "20px" }} />
          <div className="overview-item__value">
            <div className="overview-item__value-title">Bond Increase</div>
            <div className="overview-item__value-value">
              ᚱ{Math.round(BondIncrease / 100000000).toFixed(2)}
            </div>
          </div>
        </div>
        <div className="overview-item">
          <OrderedListOutlined style={{ fontSize: "20px" }} />
          <div className="overview-item__value">
            <div className="overview-item__value-title">Position (Average)</div>
            <div className="overview-item__value-value">{position}</div>
          </div>
        </div>
        <div className="overview-item">
          <RiseOutlined style={{ fontSize: "20px" }} />
          <div className="overview-item__value">
            <div className="overview-item__value-title">
              Max Position (Average)
            </div>
            <div className="overview-item__value-value">{maxPosition}</div>
          </div>
        </div>
        <div className="overview-item">
          <GiftOutlined style={{ fontSize: "20px" }} />
          <div className="overview-item__value">
            <div className="overview-item__value-title">Total Rewards</div>
            <div className="overview-item__value-value">
              ᚱ{Math.round(totalRewards / 100000000).toFixed(2)}
            </div>
          </div>
        </div>
      </>
    );
  };

  render() {
    const { theme } = this.context;
    const {
      churns,
      apiResponse,
      isDataFetched,
      selectedFrom,
      selectedTo,
      loadingChurns,
      loading,
      tableData,
      data,
      nodesFilter,
      visibleColumns,
      activeNodes,
      standByNodes,
      whitelistedNodes,
      maxData,
      positionData,
      bondData,
      rewardsData,
      minX,
      maxX,
      generatePDF,
    } = this.state;

    const bondOptions = this.state.bondData
      ? {
          scales: {
            xAxes: [
              {
                type: "linear",
                position: "bottom",
                gridLines: {
                  color:
                    this.context.theme === "light"
                      ? "#E0E0E0"
                      : "rgba(255, 255, 255, 0.1)",
                },
                scaleLabel: {
                  display: true,
                  labelString: "Block Height",
                  fontColor: this.context.theme === "light" ? "black" : "white",
                },
                ticks: {
                  autoSkip: true,
                  maxTicksLimit: 10,
                  min: Math.min(...this.state.bondData.map((data) => data.x)),
                  stepSize: 2000,
                  callback: function (value, index, values) {
                    return value;
                  },
                  fontColor: this.context.theme === "light" ? "black" : "white",
                },
              },
            ],
            yAxes: [
              {
                gridLines: {
                  color:
                    this.context.theme === "light"
                      ? "#E0E0E0"
                      : "rgba(255, 255, 255, 0.1)",
                },
                scaleLabel: {
                  display: true,
                  labelString: "Bond Amount (ᚱ)",
                  fontColor: this.context.theme === "light" ? "black" : "white",
                },
                ticks: {
                  fontColor: this.context.theme === "light" ? "black" : "white",
                },
              },
            ],
          },
        }
      : {};

    const maxPositionChartDataConfig =
      this.state.maxData && this.state.positionData
        ? {
            datasets: [
              {
                label: "Max",
                data: this.state.maxData,
                backgroundColor: "blue",
                pointRadius: 5,
              },
              {
                label: "Position",
                data: this.state.positionData,
                backgroundColor: "orange",
                pointRadius: 5,
              },
            ],
          }
        : {};

    const chartDataConfig = this.state.bondData
      ? {
          datasets: [
            {
              label: "Value",
              data: this.state.bondData,
              fill: false,
              backgroundColor: "rgb(28, 57, 182)",
              borderColor: "rgba(28, 57, 187, 0.2)",
              tension: 0,
            },
          ],
        }
      : {};

    const rewardsChartDataConfig = this.state.rewardsData
      ? {
          datasets: [
            {
              label: "Value",
              data: this.state.rewardsData,
              fill: false,
              backgroundColor: "rgb(28, 57, 182)",
              borderColor: "rgba(28, 57, 187, 0.2)",
              tension: 0,
            },
          ],
        }
      : {};

    const maxPositionOptions = this.state.chartData
      ? {
          scales: {
            xAxes: [
              {
                type: "linear",
                position: "bottom",
                gridLines: {
                  color:
                    this.context.theme === "light"
                      ? "#E0E0E0"
                      : "rgba(255, 255, 255, 0.1)",
                },
                scaleLabel: {
                  display: true,
                  labelString: "Block Height",
                  fontColor: this.context.theme === "light" ? "black" : "white",
                },
                ticks: {
                  autoSkip: true,
                  maxTicksLimit: 10,
                  min: this.state.minX,
                  max: this.state.maxX,
                  stepSize: 20000,
                  callback: function (value) {
                    return value;
                  },
                  fontColor: this.context.theme === "light" ? "black" : "white",
                },
              },
            ],
            yAxes: [
              {
                gridLines: {
                  color:
                    this.context.theme === "light"
                      ? "#E0E0E0"
                      : "rgba(255, 255, 255, 0.1)",
                },
                scaleLabel: {
                  display: true,
                  labelString: "Position",
                  fontColor: this.context.theme === "light" ? "black" : "white",
                },
                ticks: {
                  min: 0,
                  max: 120,
                  fontColor: this.context.theme === "light" ? "black" : "white",
                },
              },
            ],
          },
        }
      : {};

    const rewardsOptions = this.state.rewardsData
      ? {
          scales: {
            xAxes: [
              {
                type: "linear",
                position: "bottom",
                gridLines: {
                  color:
                    this.context.theme === "light"
                      ? "#E0E0E0"
                      : "rgba(255, 255, 255, 0.1)",
                },
                scaleLabel: {
                  display: true,
                  labelString: "Block Height",
                  fontColor: this.context.theme === "light" ? "black" : "white",
                },
                ticks: {
                  callback: function (value, index, values) {
                    return value;
                  },
                  fontColor: this.context.theme === "light" ? "black" : "white",
                },
              },
            ],
            yAxes: [
              {
                gridLines: {
                  color:
                    this.context.theme === "light"
                      ? "#E0E0E0"
                      : "rgba(255, 255, 255, 0.1)",
                },
                scaleLabel: {
                  display: true,
                  labelString: "Reward Amount (ᚱ)",
                  fontColor: this.context.theme === "light" ? "black" : "white",
                },
                ticks: {
                  fontColor: this.context.theme === "light" ? "black" : "white",
                },
              },
            ],
          },
        }
      : {};

    return (
      <Layout style={{ width: "100vw" }}>
        <Header
          style={{
            color: "white",
            fontSize: 25,
            fontWeight: 700,
            minWidth: "100vw",
            height: 110,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div className="header-left">
            <Link
              to={PUBLIC_ROUTE.LANDING}
              style={{ color: "white", textDecoration: "none" }}
            >
              <img
                alt="#"
                src={mayaLogo}
                style={{
                  width: 180,
                  margin: "auto 10px auto 0",
                  verticalAlign: "middle",
                }}
              />
              <span
                style={{
                  color: "white",
                  verticalAlign: "middle",
                  marginTop: "25px",
                }}
              >
                Monitor
              </span>
            </Link>
          </div>
          <div className="header-right"></div>
        </Header>
        <Content style={{ padding: "40px", backgroundColor: "white" }}>
          {loading && (
            <div className="loading">
              <img src={loadingIcon} className="loading_icon" />
            </div>
          )}

          {!loading && (
            <>
              <div className="layout-content-wrapper">
                <Breadcrumb separator={<RightOutlined />}>
                  <Breadcrumb.Item href="/">Dashboard</Breadcrumb.Item>
                  <Breadcrumb.Item className="current">Report</Breadcrumb.Item>
                </Breadcrumb>
                <ReportPage setNodeAddress={this.setNodeAddress} />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "20px",
                  paddingLeft: "70px",
                }}
              >
                <div style={{ marginRight: "20px" }}>
                  <label
                    htmlFor="churnsFrom"
                    style={{ marginRight: "10px", fontWeight: 500 }}
                  >
                    Churns From:
                  </label>
                  <Select
                    id="churnsFrom"
                    value={selectedFrom}
                    onChange={this.handleFromChange}
                    placeholder="Select From"
                    loading={loadingChurns}
                    style={{ width: 200 }}
                    className="custom-select"
                  >
                    {churns.map((churn) => (
                      <Option key={churn.key} value={churn.key}>
                        {churn.value}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div style={{ marginRight: "20px" }}>
                  <label
                    htmlFor="churnsTo"
                    style={{ marginRight: "10px", fontWeight: 500 }}
                  >
                    Churns To:
                  </label>
                  <Select
                    id="churnsTo"
                    value={selectedTo}
                    onChange={this.handleToChange}
                    placeholder="Select To"
                    loading={loadingChurns}
                    style={{ width: 200 }}
                    className="custom-select"
                  >
                    {this.state.churnsTo.map((churn) => (
                      <Option key={churn.key} value={churn.key}>
                        {churn.value}
                      </Option>
                    ))}
                  </Select>
                </div>

                <Button type="primary" onClick={this.handleSubmit}>
                  Submit
                </Button>
              </div>

              {isDataFetched && (
                <div className="overview-list-report">
                  {this.displayApiResponse(apiResponse)}
                </div>
              )}

              {isDataFetched && (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: "20px",
                      marginTop: "40px",
                    }}
                  >
                    <Table
                      className="table-report"
                      columns={columns}
                      dataSource={this.state.tableData}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <Button
                      type="primary"
                      onClick={this.exportPDF}
                      style={{
                        width: "20%",
                        padding: "0 20px",
                        marginRight: "10px",
                      }}
                    >
                      Download as PDF
                    </Button>
                    <Button
                      type="primary"
                      onClick={this.exportCSV}
                      style={{ width: "20%", padding: "0 20px" }}
                    >
                      Download as CSV
                    </Button>
                  </div>
                </>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: "20px",
                  marginTop: "20px",
                }}
              >
                {this.state.bondData && (
                  <Card
                    title={
                      <span
                        style={{
                          color:
                            this.context.theme === "light" ? "black" : "white",
                        }}
                      >
                        Bond Value Over Time for {this.state.nodeAddress}
                      </span>
                    }
                    bordered={false}
                    style={{
                      borderRadius: "10px",
                      overflow: "hidden",
                      background:
                        this.context.theme === "light" ? "white" : "#151515",
                      boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    <CustomLineChart
                      data={{
                        datasets: [
                          {
                            label: "Bond Value",
                            data: this.state.bondData,
                            backgroundColor: "rgb(28, 57, 182)",
                            borderColor: "rgba(28, 57, 187, 0.2)",
                            fill: false,
                            tension: 0,
                          },
                        ],
                      }}
                      options={bondOptions}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </Card>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: "20px",
                  width: "100%",
                }}
              >
                {this.state.maxData && this.state.positionData && (
                  <Card
                    bordered={false}
                    title={
                      <span
                        style={{
                          color:
                            this.context.theme === "light" ? "black" : "white",
                        }}
                      >
                        Performance Over Time for {this.state.nodeAddress}
                      </span>
                    }
                    style={{
                      borderRadius: "10px",
                      overflow: "hidden",
                      background:
                        this.context.theme === "light" ? "white" : "#151515",
                      boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    <CustomScatterChart
                      data={{
                        datasets: [
                          {
                            label: "Max Position",
                            data: this.state.maxData,
                            backgroundColor: "blue",
                            pointRadius: 5,
                          },
                          {
                            label: "Position",
                            data: this.state.positionData,
                            backgroundColor: "orange",
                            pointRadius: 5,
                          },
                        ],
                      }}
                      options={maxPositionOptions}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </Card>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                {this.state.rewardsData && (
                  <Card
                    title={
                      <span
                        style={{
                          color:
                            this.context.theme === "light" ? "black" : "white",
                        }}
                      >
                        Reward Value Over Time for {this.state.nodeAddress}
                      </span>
                    }
                    bordered={false}
                    style={{
                      borderRadius: "10px",
                      overflow: "hidden",
                      background:
                        this.context.theme === "light" ? "white" : "#151515",
                      boxShadow: "0 4px 8px 0 rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    <CustomLineChart
                      data={{
                        datasets: [
                          {
                            label: "Rewards Value",
                            data: this.state.rewardsData,
                            backgroundColor: "rgb(28, 57, 182)",
                            borderColor: "rgba(28, 57, 187, 0.2)",
                            fill: false,
                            tension: 0,
                          },
                        ],
                      }}
                      options={rewardsOptions}
                      style={{ width: "100%", height: "100%" }}
                    />
                  </Card>
                )}
              </div>
            </>
          )}
        </Content>

        <Footer>
          <a
            href="https://github.com/liquify-validation"
            target="_blank"
            className="link"
          >
            <img alt="#" src={githubIcon} className="overview-item__icon" />
          </a>
          <a
            href="https://twitter.com/Liquify_ltd"
            target="_blank"
            className="link"
          >
            <img alt="#" src={twitterIcon} className="overview-item__icon" />
          </a>
          <div className="logo-wrapper">
            <span>Built by:</span>
            <a href="https://liquify.io" target="_blank">
              <img
                alt="#"
                src={
                  this.context.theme === "light" ? liquifyLogo : liquifyLogoDark
                }
                className="overview-item__icon"
              />
            </a>
          </div>
        </Footer>
      </Layout>
    );
  }
}
