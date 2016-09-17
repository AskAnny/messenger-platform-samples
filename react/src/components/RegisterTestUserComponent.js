import React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

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

  registerWithAnny(facebookUrl) {
    // get id from url
    // register id with app
    console.log(facebookUrl);
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
              onClick={() => registerWithAnny(this.state.inputText)}
            />
          </form>
        </MuiThemeProvider>
      </div>
    );
  }
}

export default RegisterTestUserComponent;
