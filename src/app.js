import React from "react";
import { Provider } from "react-redux";
import GlobalStyles from "@iso/assets/styles/globalStyle";
import { store } from "./redux/store";
import Boot from "./redux/boot";
import Routes from "./router";
import AppProvider from "./AppProvider";
import { CookiesProvider } from "react-cookie";
import { ThemeProvider } from "./ThemeContext";

const App = () => (
  <CookiesProvider>
    <Provider store={store}>
      <AppProvider>
        <ThemeProvider>
          <>
            <GlobalStyles />
            <Routes />
          </>
        </ThemeProvider>
      </AppProvider>
    </Provider>
  </CookiesProvider>
);

Boot()
  .then(() => App())
  .catch((error) => console.error(error));

export default App;
