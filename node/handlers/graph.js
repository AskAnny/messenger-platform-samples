'use strict';

const fbgraph = require('fbgraph');
const debug = require('debug')('GraphHandler');
const _ = require('lodash');
/**
 * Interface to Facebook Graph API
 */
class GraphHandler {

  constructor(token, options) {
    if (!token) {
      throw new Error('Please specify access token.');
    }
    options = _.defaultsDeep(options || {}, {
      timeout: 3000,
      pool: {
        maxSockets: Infinity
      },
      headers: {
        connection:  'keep-alive'
      }
    });

    debug('Set access token')
    fbgraph.setAccessToken(token);

    debug('Set default options');
    fbgraph.setOptions(options);

    debug('Set graph version');
    fbgraph.setVersion('2.4');
  }

  /**
   * Make a request to the Facebook Graph API for the defined page and return
   * the response through a Promise
   *
   * @param  {String} pageID of the Page
   * @param  {Array} fields to retrieve
   * @return {Promise}  Resolves with response or throws an error
   */
  retrieveFields(pageID, fields) {
    debug(`Retrieve fields (${fields}) from ${pageID}`);
    const params = {
      fields: fields
    };
    return new Promise((resolve, reject) => {
      fbgraph.get(pageID, params, (err, res) => err ? reject(err) : resolve(res));
    });
  }
}

module.exports = GraphHandler;
