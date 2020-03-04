import React from 'react';
import { Grommet, Box, ThemeType } from 'grommet';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { Login } from './pages/login';
import { Home } from './pages/home';
import { useAmbientUser } from './util/user';
import { PulseLoader } from 'react-spinners';
import { Teams } from './pages/teams';
import { Layout } from './pages/layout'
import { grommet } from "grommet/themes";
import { register } from '../../lib';


const theme: ThemeType = {
  global: {
    colors: {
      text: "rgb(68, 68, 68)",
    },
    font: {
      family: 'Roboto',
      size: '18px',
      height: '20px',
    },
  },
};

// A wrapper for <Route> that redirects to the login
// screen if you're not yet authenticated.
function AuthenticatedRoute({ children, ...rest }: any) {

  const { loading, user } = useAmbientUser()

  if (loading) {
    return (
      <Box fill justify="center" align="center">
        <PulseLoader />
      </Box>
    )
  }

  return (
    <Route
      {...rest}
      render={({ location }) =>
        user ? (
          children
        ) : (
            <Redirect
              to={{
                pathname: "/login",
                state: { from: location }
              }}
            />
          )
      }
    />
  );
}


const App: React.FC = () => {
  return (
    <Grommet theme={grommet}>
      <Router>
        <Layout>
          <Switch>
            <Route path="/login">
              <Login />
            </Route>
            <AuthenticatedRoute path="/teams/:teamName">
              <Home />
            </AuthenticatedRoute>
            <AuthenticatedRoute path="/">
              <Teams />
            </AuthenticatedRoute>
          </Switch>
        </Layout>

      </Router>
    </Grommet>
  );
}

export default App;
