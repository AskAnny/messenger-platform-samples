import React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import FacebookLogin from 'react-facebook-login';

import 'whatwg-fetch';


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

  registerWithApp(pageID, pageToken) {
    fetch("https://www.graph.facebook.com/v2.7/" + pageID + "/subscribed_apps?access_token=" + pageToken, {method: "POST"}).then((resp) => {console.log(resp)});
    // call to server to register there
    // call to server to establish startpage and so on
  }

  getPageToken(manageToken) {
    fetch("https://www.graph.facebook.com/v2.7/me/accounts?access_token=" + manageToken).then(function(response) {
      response.data.forEach(function(page) {
        if (page.id === this.state.inputText) {
          console.log("starting to register page: " + page.name);
          let pageToken = page.access_token;
          let pageID = page.id;
          registerWithApp(pageID, pageToken);
        }
      })
    });
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
          scope="manage_pages,pages_messaging"
          callback={(response) => this.getPageToken(response.access_token)}
          size="small"
          icon="fa-facebook"/>
        </div>
    );
  }
}

export default PageInputComponent;
