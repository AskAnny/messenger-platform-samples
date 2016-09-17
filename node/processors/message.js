'use strict';

const debug = require('debug')('message');
const _ = require('lodash');

const dayNames = new Map([
  ['mon', 'Monday'],
  ['tue', 'Tuesday'],
  ['wed', 'Wednesday'],
  ['thu', 'Thursday'],
  ['fri', 'Friday'],
  ['sat', 'Saturday'],
  ['sun', 'Sundays']
]);

function generateSchedule(hours) {
  return _.chain(hours)
          .map((value, key) => {
            const split = key.split('_');
            return `${dayNames.get(split[0])}s ${split[2]} at ${value}`;
          })
          .value()
          .join(',\n')
          .substring(0, 319);
}

function generateAddress(address) {
  return generateText("We are at " + formatAddress(address) + " ;)");
}

function formatAddress(address) {
  let location = "";
  if (address.street)
    location += address.street;
  if (address.city && address.street)
    location += " in ";
  if (address.city)
    location += address.city;
  if (address.city && address.country)
    location += ", ";
  if (address.country)
    location += address.country;

  return location;
}

function generateEmails(emails) {
  if (emails.length === 0)
    return generateText("Sorry, we were not able to configure an email address. We are noobs..");
  else if (emails.length === 1)
    return generateText("Send us an email to " + emails[0] + " :)");
  else {
    let list = emails[0];
    for (let i = 1; i < emails.length; i++)
      emails += ", " + emails[i];
    return generateText("You can send an email to one of the follwoing addresses: " + list + ".");
  }
}

function generatePhone(phone) {
  return {
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Maybe try that link:",
          buttons: [ {
            type: "phone_number",
            title: phone,
            payload: phone
          }]
        }
      } 
    }
  };
}

function generateContact(location, emails, phone) {
  let res = "";
  if (emails && emails.length > 0 && phone) 
    res += "Call us at " + phone + " or write to " + emails[0] + ".";
  else if (emails && emails.length > 0)
    res += generateEmails(emails);
  else
    res += generatePhone(phone);

  if (location)
    res += "Visit us at " + formatAddress(location);

  return generateText(res); 
}

function generateLinkButton(caption, link) {
  return {
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: caption,
          buttons: [ {
            type: "web_url",
            url: link,
            title: link
          }]
        }
      } 
    }
  };
}

function generateText(string) {
  return { 
    message: {
      text: string,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };
}

module.exports = {
  /**
   * Generate an answer from information retrieved
   * @param  {Object} response Object with request params and result of Graph Call
   * @return {String}             Message to send
   */
  generate: response => {
    let result = [];

    if ('hours' in response) {
      result.push(generateSchedule(response.hours));
    }

    // Creating 'contact' if at least two of three contact information is
    // available
    if ('location' in response) {
      result.push(generateAddress(response.location));
    } 

    if ('emails' in response) {
      result.push(generateEmails(response.emails));
    }

    if ('phone' in response) {
      result.push(generatePhone(response.phone));
    }

    if ("description" in response) {
      result.push(generateText(response.description));
    }

    if ("website" in response) {
      result.push(generateLinkButton("Maybe try that link:", response.website));
    }
    return result;
  }

};
