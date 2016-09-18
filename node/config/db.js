'use strict';

const datastore = require('@google-cloud/datastore');
const config = require('config');
const debug = require('debug')('db');
const logger = require('winston');
const path = require('path');

module.exports = function() {
  let projectId = process.env.GCLOUD_PROJECT || config.get('projectId');
  return datastore({
    projectId: projectId,
    keyFilename: path.join(__dirname, 'keyfile.json')
  });
}
