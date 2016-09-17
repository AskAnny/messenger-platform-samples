import React from 'react';
import './app.css';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import PageInputComponent from 'components/PageInputComponent';

class AppComponent extends React.Component {

  render() {
    return (
      <MuiThemeProvider>
        <div className="centered">
          <h1 className="page-title">Ask Anny</h1>
          <PageInputComponent />
        </div>
      </MuiThemeProvider>
    );
  }
}

AppComponent.defaultProps = {
};

export default AppComponent;
