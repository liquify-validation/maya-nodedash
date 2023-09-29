import React from "react";
import { ThemeContext } from "./ThemeContext";

const withTheme = (Component) => {
  return (props) => (
    <ThemeContext.Consumer>
      {({ theme, setTheme }) => (
        <Component {...props} theme={theme} setTheme={setTheme} />
      )}
    </ThemeContext.Consumer>
  );
};

export default withTheme;
