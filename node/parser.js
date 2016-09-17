const debug = require('debug')('parser');

module.exports = {
  parseToFacebookFields: function (message) {
    let fields = [];
    if (message && message["entities"] && message["entities"]["intent"]) {
      switch(message["entities"]["intent"][0]["value"]) {
        case "opening_hours":
          fields.push("hours");
          break;
        case "address":
          fields.push("location");
          break;
        case "email":
          fields.push("emails");
        case "phone_number":
          fields.push("phone");
        case "contact":
          fields.push("emails");
          fields.push("phone");
          fields.push("location");
        case "description":
          fields.push("description");
        case "homepage":
          fields.push("website");
        default:
          debug("No entity was extracted from wit ai ");
      }
    }
    return fields;
  }
}
