import React, { lazy, Suspense } from "react";
import {
  Route,
  BrowserRouter as Router,
  Switch,
  Redirect,
} from "react-router-dom";

import ErrorBoundary from "./ErrorBoundary";
import { PUBLIC_ROUTE } from "./route.constants";
import Loader from "@iso/components/utility/loader";

//const Dashboard = lazy(() => import('./containers/Dashboard/Dashboard'));

const publicRoutes = [
  {
    path: PUBLIC_ROUTE.LANDING,
    exact: true,
    component: lazy(() => import("@iso/containers/A_monitor/monitorpage.js")),
    //component: lazy(() => import('@iso/containers/Pages/SignIn/SignIn')),
  },
  {
    path: PUBLIC_ROUTE.ACTIVE_DASHBOARD,
    exact: true,
    component: lazy(() => import("@iso/containers/A_monitor/activepage.js")),
  },
  {
    path: PUBLIC_ROUTE.STANDBY_DASHBOARD,
    exact: true,
    component: lazy(() => import("@iso/containers/A_monitor/standbypage.js")),
  },
  {
    path: PUBLIC_ROUTE.OTHER_DASHBOARD,
    exact: true,
    component: lazy(() => import("@iso/containers/A_monitor/otherpage.js")),
  },
  {
    path: PUBLIC_ROUTE.REPORT,
    exact: true,
    component: lazy(() => import("@iso/containers/A_monitor/report.js")),
  },
  {
    path: `${PUBLIC_ROUTE.REPORT}/:nodeAddress`,
    exact: true,
    component: lazy(() => import("@iso/containers/A_monitor/report.js")),
  },
];

export default function Routes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loader />}>
        <Router>
          <Switch>
            <Route
              path={`${PUBLIC_ROUTE.REPORT}/:nodeAddress`}
              exact
              component={lazy(() =>
                import("@iso/containers/A_monitor/report.js")
              )}
            />

            <Route
              path={PUBLIC_ROUTE.REPORT}
              exact
              render={() => <Redirect to={PUBLIC_ROUTE.LANDING} />}
            />
            {publicRoutes.map((route, index) => (
              <Route key={index} path={route.path} exact={route.exact}>
                <route.component />
              </Route>
            ))}
            {/*
            <PrivateRoute path="/dashboard">
              <Dashboard />
            </PrivateRoute>
            */}
          </Switch>
        </Router>
      </Suspense>
    </ErrorBoundary>
  );
}
