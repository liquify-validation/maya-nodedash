import React from "react";
import { useTheme } from "../../ThemeContext.js";
import light_mode_icon from "@iso/assets/images/overview/light_mode_icon.svg";
import dark_mode_icon from "@iso/assets/images/overview/dark_mode_icon.svg";

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        cursor: "pointer",
      }}
      onClick={() => {
        setTheme(theme === "light" ? "dark" : "light");
      }}
    >
      <img
        src={theme === "light" ? dark_mode_icon : light_mode_icon}
        alt="Theme Toggle"
        style={{
          width: "appropriate size here",
          height: "appropriate size here",
        }}
      />
    </button>
  );
}

export default ThemeToggleButton;
