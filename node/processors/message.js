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

module.exports = {
  /**
   * Generate an answer from information retrieved
   * @param  {Object} response Object with request params and result of Graph Call
   * @return {String}             Message to send
   */
  generate: response => {
    if ('hours' in response) {
      return generateSchedule(response.hours)
    } else {
      return response.id;
    }
  }

};
