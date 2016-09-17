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

  return "We are at " + location + " ;)"
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

    if ('location' in response) {
      result.push(generateAddress(response.location));
    } 
    return result;
  }

};
