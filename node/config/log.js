'use strict';

const expressWinston = require('express-winston');
const winston = require('winston');

module.exports = function(app) {
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
