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

        default:
          debug("No entity was extracted from wit ai ");
      }
    }
    return fields;
  }
}
