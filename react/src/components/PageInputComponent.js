import React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import FacebookLogin from 'react-facebook-login';

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
  render() {
    return (
      <div>
        <form>
          <TextField
            hintText="URL to your Facebook Page" fullWidth={true}
            value={this.state.inputText}
            onChange={(e) => this.setState({inputText: e.target.value})} />
          <RaisedButton
            label="Let's do it!" primary={true} style={inlineStyle}
            onClick={() => console.log(this.state.inputText)}
          />
        </form>
        <FacebookLogin
          appId="729885603830764"
          autoLoad
          scope="public_profile,manage_pages, pages_messaging"
          callback={(response) => console.log(response)}
          size="small"
          icon="fa-facebook"/>
        </div>
    );
  }
}

export default PageInputComponent;
