import React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';

let fullWidth = true;
let primary = true;
let inlineStyle = {
  float: 'right'
};

const PageInputComponent = () => (
  <form>
    <TextField hintText="Link to your Facebook Page" fullWidth={fullWidth}/>
    <RaisedButton label="Let's do it!" primary={primary} style={inlineStyle}/>
  </form>
);

export default PageInputComponent;
