import React from 'react';
import './app.css';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import PageInputComponent from 'components/PageInputComponent';
import {Card} from 'material-ui/Card';
import Paper from 'material-ui/Paper';

const styles = {
  title: {
    cursor: 'pointer',
  }
};

class AppComponent extends React.Component {

  render() {
    return (
      <MuiThemeProvider>
        <div>
          <h1 className="page-title">Ask Anny</h1>
          <h3 className="page-description">Stay intouch with all your customers</h3>
          <Card className="centered main-ctn">
          <PageInputComponent />
          </Card>
          <Paper className="centered main-ctn" zDepth={2}>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </Paper>
        </div>
      </MuiThemeProvider>
    );
  }
}

AppComponent.defaultProps = {
};

export default AppComponent;
