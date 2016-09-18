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
          Generates an intelligent bot system for every possible website on the net. It will answer all users' questions about its content.

The 'ask anny' system enables you to generate a bot from a any website available
on the net. With intelligent natural language processing is it capable of under
standing the user's questions and preparing a fitting answer.
          </Paper>
        </div>
      </MuiThemeProvider>
    );
  }
}

AppComponent.defaultProps = {
};

export default AppComponent;
