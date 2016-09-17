const debug = require('debug')('parser');

module.exports = {
  parseToFacebookFields: function (message) {
    let fields = [];
    if (message && message["entities"] && message["entities"]["intent"]) {
      switch(message["entities"]["intent"][0]["value"]) {
        case "opening_hours":
          fields.push("hours");
          break;
        case "location":
          fields.push("location")
          break;
        default:
          debug("No entity was extracted from wit ai ");
      }
    }
    return fields;
  }
}
