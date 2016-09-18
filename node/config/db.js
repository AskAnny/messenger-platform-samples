'use strict';

const bigtable = require('@google-cloud/bigtable');
const config = require('config');
const debug = require('debug')('db');
const logger = require('winston');
const path = require('path');

function createTable(instance, tableName) {
  instance.createTable(tableName, (err, table) => {
    if (err) {
      return logger.error(`Couldn't create table "${tableName}"`, err);
    }
    debug(`Created "${tableName}" table`)
  });
}

module.exports = function() {
  let projectId = process.env.GCLOUD_PROJECT || config.get('projectId');
  let instanceName = 'bigtable';

  let bigtableClient = bigtable({
    projectId: projectId,
    keyFilename: path.join(__dirname, 'keyfile.json')
  });

  debug('Create BigTable instance.');
  let dbInstance = bigtableClient.instance(instanceName);

  let recipients = dbInstance.table('pages');
  recipients.exists((err, exists) => {
    if (err) {
      return logger.error('Could check if pages table exists', err);
    } else if (exists) {
      debug('"Pages" table already exists');
    } else {
      debug('Create "pages" table');
      createTable(dbInstance, 'pages');
    }
  });
  return dbInstance;
}
