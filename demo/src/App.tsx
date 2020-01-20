import React from 'react';
import { Grommet } from 'grommet';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import { Login } from './pages/login';
import { Home } from './pages/home';
import { SSO } from './pages/sso';

const theme = {
  global: {
    font: {
      family: 'Roboto',
      size: '18px',
      height: '20px',
    },
  },
};

const App: React.FC = () => {
  return (
    <Grommet theme={theme}>
      <Router>

        <Switch>
          <Route path="/login">
            <Login />
          </Route>
          <Route path="/sso">
            <SSO />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>

      </Router>

    </Grommet>
  );
}

export default App;
