import React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

// import Request from 'react-http-request';
// const request = require('request');
// import fetch from 'node-fetch';
import 'whatwg-fetch';

let fullWidth = true;
let primary = true;
let inlineStyle = {
  float: 'right'
};
class RegisterTestUserComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputText: ''
    };
  }

  registerWithAnny(facebookName) {
    // get id from url
    // register id with app
    // request(url: facebookUrl, function(error, response, body) {
    //   if (error) {
    //     console.log('error');
    //   } else {
    //     console.log(body);
    //   }
    // });
    fetch('https://graph.facebook.com/' + facebookName).then(function(response) {
      console.log(response);
    })
  }

  render() {
    return (
      <div className="centered">
        <MuiThemeProvider>
          <form>
            <TextField
              hintText="Link to your Facebook Account" fullWidth={fullWidth}
              value={this.state.inputText}
              onChange={(e) => this.setState({inputText: e.target.value})} />
            <RaisedButton
              label="Let's do it!" primary={primary} style={inlineStyle}
              onClick={() => this.registerWithAnny(this.state.inputText)}
            />
          </form>
        </MuiThemeProvider>
      </div>
    );
  }
}

export default RegisterTestUserComponent;
