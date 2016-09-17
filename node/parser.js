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
          break;

        case "phone_number":
          fields.push("phone");
          break;

        case "contact":
          if (fields.indexOf("emails") === -1)
            fields.push("emails");
          if (fields.indexOf("phone") === -1)
            fields.push("phone");
          if (fields.indexOf("location") === -1)
            fields.push("location");
          break;

        case "description":
          fields.push("description");
          break;

        case "homepage":
          fields.push("website");
          break;
    
        case "pictures":
          fields.push("pictures");
          break;

        default:
          debug("No entity was extracted from wit ai ");
      }
    }
    return fields;
  },

  parseToBotFields: function(message) {
    let fields = [];
    if (message && messae["entities"] && message["entities"]["intent"]) {
      switch(message["entities"]["intent"][0]["value"]) {
        case "bot_personality":
          fields.push("bot_personalities");
          break;
        case "bot_health":
          fields.push("bot_health");
      }
    }
    return fields;
  }
}
