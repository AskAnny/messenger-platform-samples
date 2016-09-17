import React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import FacebookLogin from 'react-facebook-login';

let fullWidth = true;
let primary = true;
let inlineStyle = {
  float: 'right'
};

class PageInputComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputText: ''
    };
  }
  responseFacebook(response) {
    console.log(response);
  }
  componentClicked() {
    console.log('foo');
  }
  render() {
    return (
      <div>
        <form>
          <TextField
            hintText="Link to your Facebook Page" fullWidth={fullWidth}
            value={this.state.inputText}
            onChange={(e) => this.setState({inputText: e.target.value})} />
          <RaisedButton
            label="Let's do it!" primary={primary} style={inlineStyle}
            onClick={() => console.log(this.state.inputText)}
          />
        </form>
        <FacebookLogin
          appId="729885603830764"
          fields="name,email,picture"
          onClick={() => this.componentClicked}
          scope="public_profile,user_friends,user_actions.books"
          callback={() => this.responseFacebook} />
      </div>
    );
  }
}

export default PageInputComponent;
