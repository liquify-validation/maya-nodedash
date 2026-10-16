// Image URLs, grouped by where they're used. Vite fingerprints and serves them under /assets.
import mayaLogo from "./icons/maya_logo.png";
import heartBlank from "./icons/heart-blank.png";
import heartWhite from "./icons/heart-white.png";
import heartFull from "./icons/heart-full.png";

import dash from "./chains/dash-d-circle-250.png";
import bitcoin from "./chains/bitcoin.png";
import eth from "./chains/eth.png";
import thor from "./chains/thorchain-logo.png";
import kuji from "./chains/kuji.png";
import arb from "./chains/arb.png";
import radix from "./chains/radix.svg";
import zcash from "./chains/zec_icon.png";

import aws from "./isp/aws.png";
import awsDark from "./isp/aws-white-logo.png";
import digitalOcean from "./isp/do.png";
import gcp from "./isp/gcp.png";
import azure from "./isp/azure.png";
import hetzner from "./isp/hetzner.png";
import vultr from "./isp/vultr.png";
import leaseweb from "./isp/leaseweb.png";
import datacamp from "./isp/datacamp.png";
import comcast from "./isp/comcast.png";
import choopa from "./isp/choopa.png";
import charter from "./isp/chartercoms.png";
import atandt from "./isp/atandt.png";
import zenlayer from "./isp/zenlayer.png";
import aljeel from "./isp/Aljeel.png";
import hostinger from "./isp/Hostinger.png";

import blockIcon from "./overview/block_icon.svg";
import blockIconDark from "./overview/block_icon_darkmode.svg";
import highIcon from "./overview/24high_trading.svg";
import highIconDark from "./overview/24high_trading_darkmode.svg";
import lowIcon from "./overview/24low_trading.svg";
import lowIconDark from "./overview/24low_trading_darkmode.svg";
import bondIcon from "./overview/Bond_icon.svg";
import bondIconDark from "./overview/Bond_icon_darkmode.svg";
import chartLineIcon from "./overview/chartLineIcon.svg";
import chartLineIconDark from "./overview/chartLineIcon_darkmode.svg";
import churnsIcon from "./overview/churns_icon.svg";
import churnsIconDark from "./overview/churns_icon_darkmode.svg";
import priceIcon from "./overview/price_light.svg";
import priceIconDark from "./overview/price_dark.svg";
import timeIcon from "./overview/time_icon.svg";
import timeIconDark from "./overview/time_icon_darkmode.svg";
import totalSupplyIcon from "./overview/total_supply.svg";
import totalSupplyIconDark from "./overview/total_supply_darkmode.svg";
import jailIcon from "./overview/jail_icon.svg";
import jailIconDark from "./overview/jail_icon_darkmode.svg";
import filterIcon from "./overview/filter.svg";
import globeIcon from "./overview/globe_icon.svg";
import versionIcon from "./overview/version_icon.svg";
import loadingIcon from "./overview/loading.png";
import githubIcon from "./overview/github_link_icon.svg";
import twitterIcon from "./overview/twitter_link_icon.svg";
import liquifyLogo from "./overview/liquify_logo.svg";
import liquifyLogoDark from "./overview/liquify_logo_darkmode.svg";
import threeDotsIcon from "./overview/dots_three_circle.svg";
import powerIcon from "./overview/power.svg";
import activeIcon from "./overview/active_icon.svg";
import arrowDownIcon from "./overview/arrow-down.svg";
import lightModeIcon from "./overview/light_mode_icon.svg";
import darkModeIcon from "./overview/dark_mode_icon.svg";
import type { Chain } from "../types";

/** [light, dark] pairs for themed icons. */
export const themed = {
  block: [blockIcon, blockIconDark],
  high: [highIcon, highIconDark],
  low: [lowIcon, lowIconDark],
  bond: [bondIcon, bondIconDark],
  chartLine: [chartLineIcon, chartLineIconDark],
  churns: [churnsIcon, churnsIconDark],
  price: [priceIcon, priceIconDark],
  time: [timeIcon, timeIconDark],
  totalSupply: [totalSupplyIcon, totalSupplyIconDark],
  jail: [jailIcon, jailIconDark],
  liquify: [liquifyLogo, liquifyLogoDark],
  heartBlank: [heartBlank, heartWhite],
  aws: [aws, awsDark],
} as const satisfies Record<string, readonly [string, string]>;

export const icons = {
  mayaLogo,
  heartFull,
  filterIcon,
  globeIcon,
  versionIcon,
  loadingIcon,
  githubIcon,
  twitterIcon,
  threeDotsIcon,
  powerIcon,
  activeIcon,
  arrowDownIcon,
  lightModeIcon,
  darkModeIcon,
};

export const chainIcons: Record<Chain, string> = {
  DASH: dash,
  BTC: bitcoin,
  ETH: eth,
  THOR: thor,
  KUJI: kuji,
  ARB: arb,
  XRD: radix,
  ZEC: zcash,
};

/** ISP name (as reported by the API) -> logo. "aws" is themed and handled by the caller. */
export const ispLogos: Record<string, string> = {
  "Amazon.com, Inc.": "aws",
  "Amazon Technologies Inc.": "aws",
  "Amazon.com": "aws",
  "DigitalOcean, LLC": digitalOcean,
  DigitalOcean: digitalOcean,
  "Google LLC": gcp,
  "Microsoft Corporation": azure,
  "Hetzner Online GmbH": hetzner,
  "The Constant Company": vultr,
  "The Constant Company, LLC": vultr,
  "Leaseweb UK Limited": leaseweb,
  "Leaseweb USA, Inc.": leaseweb,
  "Datacamp Limited": datacamp,
  "Comcast Cable Communications, LLC": comcast,
  Choopa: choopa,
  "Charter Communications Inc": charter,
  "AT&T Services, Inc.": atandt,
  "Zenlayer Inc": zenlayer,
  "Aljeel Aljadeed For Technology": aljeel,
  "Hostinger International Limited": hostinger,
};
