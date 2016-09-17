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
  return "We are at " + formatAddress(address) + " ;)"
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
    return "Sorry, we were not able to configure an email address. We are noobs.."
  else if (emails.length === 1)
    return "You can send us an email to " + emails[0] + ".";
  else {
    let list = emails[0];
    for (let i = 1; i < emails.length; i++)
      emails += ", " + emails[i];
    return "You can send an email to one of the follwoing addresses: " + list + ".";
  }
}

function generatePhone(phone) {
  return "We would be happy if you'd call us at " + phone + ".";
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

  return res; 
}

function generateWebsite(website) {
  return "Try " + website + " :)";
}

module.exports = {
  /**
   * Generate an answer from information retrieved
   * @param  {Object} response Object with request params and result of Graph Call
   * @return {String}             Message to send
   */
  generate: response => {
    let result = [];

    let contactData = ('emails' in response) + ('phone' in response) 
                        + ('location' in response);
    if ('hours' in response) {
      result.push(generateSchedule(response.hours));
    }

    // Creating 'contact' if at least two of three contact information is
    // available
    if ('location' in response && contactData < 2) {
      result.push(generateAddress(response.location));
    } 

    if ('emails' in response && contactData < 2) {
      result.push(generateEmails(response.emails));
    }

    if ('phone' in response && contactData < 2) {
      result.push(generatePhone(response.phone));
    }

    if ("description" in response) {
      result.push(response.description);
    }

    if (contactData > 1) {
      result.push(generateContact(response.location, response.emails, response.phone));
    }

    if ("website" in response) {
      result.push(generateWebsite(response.website));
    }
    return result;
  }

};
