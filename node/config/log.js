'use strict';

const winston = require('winston');
const expressWinston = require('express-winston');

module.exports = function(app) {

    if (process.env.NODE_ENV === 'production') {
        require('@google/cloud-trace').start();
        require('@google/cloud-debug');
    }
    app.use(expressWinston.logger({
        transports: [
            new winston.transports.Console({
                json: false,
                colorize: true
            })
        ],
        expressFormat: true,
        meta: false
    }))

    app.use(expressWinston.errorLogger({
        transports: [
            new winston.transports.Console({
                json: true,
                colorize: true
            })
        ]
    }));

};
