import React from 'react';
import { Grommet, Box } from 'grommet';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { Login } from './pages/login';
import { Team } from './pages/team';
import { useAmbientUser } from './util/user';
import { PulseLoader } from 'react-spinners';
import { Teams } from './pages/teams';
import { Layout } from './pages/layout'
import { grommet } from "grommet/themes";

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
              <Team />
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
