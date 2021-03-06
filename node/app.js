/*
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* jshint node: true, devel: true */
'use strict';

const
  bodyParser = require('body-parser'),
  config = require('config'),
  crypto = require('crypto'),
  express = require('express'),
  https = require('https'),
  request = require('request'),
  parser = require('./parser'),
  idMapper = require('./recipient-mapper'),
  websiteData = require('./hackzurich-data'),
  answerGenerator = require('./random-answer-data'),
  msgProcessor = require('./processors/message'),
  debug = require('debug')('app'),
  log = require('./config/log'),
  db = require('./config/db'),
  logger = require('winston'),
  cors = require('cors'),
  _ = require('lodash'),
  GraphHandler = require('./handlers/graph');

if (process.env.NODE_ENV === 'production') {
  require('@google/cloud-trace').start();
  require('@google/cloud-debug');
}

var app = express();
log(app);
app.dataStore = db();
app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');

app.use(cors());
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(express.static('public'));

/*
 * Be sure to setup your config values before running this code. You can
 * set them using environment variables or modifying the config file in /config.
 *
 */

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
  process.env.MESSENGER_APP_SECRET :
  config.get('appSecret');

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
  (process.env.MESSENGER_VALIDATION_TOKEN) :
  config.get('validationToken');

// Generate a page access token for your page from the App Dashboard
let PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
  (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
  config.get('pageAccessToken');

// URL where the app is running (include protocol). Used to point to scripts and
// assets located at this address.
const SERVER_URL = (process.env.SERVER_URL) ?
  (process.env.SERVER_URL) :
  config.get('serverURL');

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error('Missing config values');
  process.exit(1);
}

const TELEGRAM_TOKEN = (process.env.TELEGRAM_TOKEN) ?
  (process.env.TELEGRAM_TOKEN) :
  config.get('telegramToken');

// Create GraphHandler instance with page access token
debug('Create GraphHandler instance');
let graphHandler = new GraphHandler(PAGE_ACCESS_TOKEN);

app.get('/_ah/health', (req, res, next) => {
  return res.status(200).send('PING');
});


app.get('/pages', (req, res, next) => {
  let query = req.app.dataStore.createQuery('Page').order('created');
  req.app.dataStore.runQuery(query, (err, pages) => {
    if (err) {
      return res.status(500).json({
        message: 'Pages can not be loaded',
        error: err
      })
    }
    return res.send(pages);
  });
});

app.post('/pages', (req, res, next) => {
  if (req.body === undefined) {
    return res.status(400).send('Missing body');
  } else if (!req.body.pageId) {
    return res.status(400).send('Missing "pageId"');
  } else if (!req.body.pageAccessToken) {
    return res.status(400).send('Missing "pageAccessToken"');
  }
  var pageKey = req.app.dataStore.key('Page');
  req.app.dataStore.save({
    key: pageKey,
    data: [
      {
        name: 'created',
        value: new Date().toJSON()
      },
      {
        name: 'pageId',
        value: req.body.pageId,
      },
      {
        name: 'pageAccessToken',
        value: req.body.pageAccessToken
      }
    ]
  }, function (err) {
    if (err) {
      logger.error(`Couldn't create new page`);
      return res.status(400).send(err);
    }
    var pageId = pageKey.path.pop();
    debug('Successfully created new row');
    return res.status(201).send({
      key: pageId
    });
  });
});

app.get('/_ah/health', (req, res, next) => {
  return res.status(200).send('PING');
});

app.post('/telegram/:pageID', function(req, res, next) {
  let pageID = req.params.pageID;
  let update = req.body;
  let messageText = update.message.text;
  let chatID = update.message.chat.id;
  res.sendStatus(200);

  // wit ai request - duplicate code...
  const request = require('request');
  const options = {
    url: 'https://api.wit.ai/message?v=20160917&q=' + messageText,
    headers: {
      'Authorization': 'Bearer CYMXGW3YJD5NGKXBOHWXOVAC5DBA5LMJ'
    }
  };
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.warn('Couldn\'t parse JSON response from wit.ai. ' + e);
        body = {};
      }
      let fields = parser.parseToFacebookFields(body);
      if (fields.length > 0)
        graphHandler
          .retrieveFields(pageID, fields)
          .then(checkWebsites)
          .then(msgProcessor.generate)
          .then(sendTelegramReply.bind(this, chatID))
          .catch(err => console.error(err));
      else
        sendTelegramReply(chatID, []);
    } else {
      console.error('probably fb error', error);
    }
  });
});

function sendTelegramReply(chatID, messageText) {
  let reply = {};
  reply.chat_id = chatID;

  if (typeof messageText === 'string')
    messageText = [ messageText ];

  if (messageText.length === 0)
    messageText.push('We could not understand your question. Sorry :(');

  messageText.forEach(function(message) {
    reply.text = message;
    const request = require('request');
    //Lets configure and request
    request({
      url: 'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/sendMessage',
        method: 'POST',
        //Lets post the following key/values as form
        json: reply
      }, function(error, response, body){
          if (error) {
              console.error('telegram');
          }
      });
  });
}

/*
 * Use your own validation token. Check that the token used in the Webhook
 * setup is the same token used here.
 *
 */
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    logger.info('Validating webhook');
    res.status(200).send(req.query['hub.challenge']);
  } else {
    logger.error('Failed validation. Make sure the validation tokens match.');
    res.sendStatus(403);
  }
});


/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      let pageID = pageEntry.id;
      let timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach((messagingEvent) => {
        const app = req.app;
        const recipientId = messagingEvent.recipient.id;
        let query = req.app.dataStore.createQuery('Page').filter('pageId', '=', recipientId);
        req.app.dataStore.runQuery(query, (err, pages) => {
          if (err) {
            return logger.error(`Execution of query failed`);
          } else if (pages.length === 0) {
            return logger.warn(`Couldn't find page with pageId = ${recipientId}`);
          }
          let page = pages[0];
          PAGE_ACCESS_TOKEN = page.data.pageAccessToken;
          if (messagingEvent.optin) {
            receivedAuthentication(messagingEvent);
          } else if (messagingEvent.message) {
            receivedMessage(messagingEvent);
          } else if (messagingEvent.delivery) {
            receivedDeliveryConfirmation(messagingEvent);
          } else if (messagingEvent.postback) {
            receivedPostback(messagingEvent);
          } else if (messagingEvent.read) {
            receivedMessageRead(messagingEvent);
          } else if (messagingEvent.account_linking) {
            receivedAccountLink(messagingEvent);
          } else {
            logger.error('Webhook received unknown messagingEvent: ', messagingEvent);
          }
        });
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL.
 *
 */
app.get('/authorize', function(req, res) {
  var accountLinkingToken = req.query.account_linking_token;
  var redirectURI = req.query.redirect_uri;

  // Authorization Code should be generated per user by the developer. This will
  // be passed to the Account Linking callback.
  var authCode = '1234567890';

  // Redirect users to this URI on successful login
  var redirectURISuccess = redirectURI + '&authorization_code=' + authCode;

  res.render('authorize', {
    accountLinkingToken: accountLinkingToken,
    redirectURI: redirectURI,
    redirectURISuccess: redirectURISuccess
  });
});

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers['x-hub-signature'];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    console.error('Couldn\'t validate the signature.');
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error('Couldn\'t validate the request signature.');
    }
  }
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the 'Send to
 * Messenger' plugin, it is the 'data-ref' field. Read more at
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfAuth = event.timestamp;
  console.log(senderID);
  console.log(recipientID);

  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
  // The developer can set this to an arbitrary value to associate the
  // authentication callback with the 'Send to Messenger' click event. This is
  // a way to do account linking when the user clicks the 'Send to Messenger'
  // plugin.
  var passThroughParam = event.optin.ref;

  logger.info('Received authentication for user %d and page %d with pass ' +
  'through param %s at %d', senderID, recipientID, passThroughParam, timeOfAuth);

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  sendTextMessage(senderID, 'Authentication successful');
}

/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message'
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've
 * created. If we receive a message with an attachment (image, video, audio),
 * then we'll simply confirm that we've received the attachment.
 *
 */
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  logger.info('Received message for user %d and page %d at %d with message:',
    senderID, recipientID, timeOfMessage);
  logger.info(JSON.stringify(message));

  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  if (isEcho) {
    // Just logging message echoes to console
    logger.info('Received echo for message %s and app %d with metadata %s',
      messageId, appId, metadata);
    return;
  } else if (quickReply) {
    var quickReplyPayload = quickReply.payload;
    logger.info('Quick reply for message %s with payload %s',
      messageId, quickReplyPayload);

    sendTextMessage(senderID, 'Quick reply tapped');
    return;
  }

  if (messageText) {
    // wit ai request
    const request = require('request');
    const options = {
      url: 'https://api.wit.ai/message?v=20160917&q=' + messageText,
      headers: {
        'Authorization': 'Bearer CYMXGW3YJD5NGKXBOHWXOVAC5DBA5LMJ'
      }
    };
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        try {
          body = JSON.parse(body);
        } catch (e) {
          console.error('Couldn\'t parse JSON response from wit.ai. ' + e);
          body = {};
        }
        let fields = parser.parseToBotFields(body);
        if (fields.length > 0) {
          const messages = msgProcessor.generateBotMsg(fields);
          sendMessage(senderID, messages);
        } else {
          fields = parser.parseToFacebookFields(body);
          logger.info(fields);
          if (fields.length > 0 )
            graphHandler
              .retrieveFields(recipientID, fields)
              .then(checkWebsites)
              .then(msgProcessor.generate)
              .then(sendMessage.bind(this, senderID))
              .catch(err => console.error(err));
          else
            sendMessage(senderID, []);
        }
      } else {
        // TODO send error
        console.error(error);
      }
    })
  } else if (messageAttachments) {
    sendTextMessage(senderID, 'Message with attachment received');
  }
}

function checkWebsites(res) {
  // Checking whether all fields could be retrieved
  if (res.req && res.req.params && res.req.params.fields) {
    const requestedFields = res.req.fields;
    var missingFields = [];
    requestedFields.forEach(function(entry) {
      if (!requestedFields[entry]
          || (entry === "pictures" && !requestedFields["albums"]))
        missingFields.push(entry);
    });

    // Iterating through webpages if exists
    if (idMapper.recipientMapper[res.req.pageID]) {
      idMapper.recipientMapper[res.req.pageID].forEach(function(entry) {
        const webpage = websiteData[entry];
        if (webpage) {
          missingFields.forEach(function(field) {
          if (webpage[field]) {
            information.field = webpage[field];
          }
          });
        }
      });
    }
  }
  return res;
}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function(messageID) {
      logger.info('Received delivery confirmation for message ID: %s',
        messageID);
    });
  }

  logger.info('All message before %d were delivered.', watermark);
}


const STARTUP_HOURS = "STARTUP_HOURS";
const STARTUP_LOCATION = "STARTUP_LOCATION";
const STARTUP_IMPRESSIONS = "STARTUP_IMPRESSIONS";
const STARTUP_BUTTON = "STARTUP_BUTTON";
/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload;

  logger.info('Received postback for user %d and page %d with payload %s ' +
    'at %d', senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  let fields = [];
  switch (payload) {
    case STARTUP_BUTTON:
      sendStartupCard(senderID, payload);
      break;
    case STARTUP_LOCATION:
      fields.push("location");
      break;
    case STARTUP_IMPRESSIONS:
      fields.push("pictures");
      break;
    case STARTUP_HOURS:
      fields.push("hours");
      break;
    default:
      sendTextMessage(senderID, 'Sorry I don\'t know what to do :(');
  }

  if (payload !== STARTUP_BUTTON) {
    graphHandler
      .retrieveFields(recipientID, fields)
      .then(checkWebsites)
      .then(msgProcessor.generate)
      .then(sendMessage.bind(this, senderID))
      .catch(err => console.error(err));
  }
}

function sendStartupCard(senderID, payload) {
  // took out image here. See https://developers.facebook.com/docs/messenger-platform/send-api-reference/postback-button if you want to add one
  let messageData =
  {
    "recipient":{
      "id":senderID
    },
    "message":{
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"generic",
          "elements":[
            {
              "title":"Hi there, I'm Anny!",
              "subtitle":"Here are some of the things I know. Just click one or ask me something else.",
              "buttons":[
                {
                  "type":"postback",
                  "title":"When are we open",
                  "payload": STARTUP_HOURS
                },
                {
                  "type":"postback",
                  "title":"Where to find us",
                  "payload": STARTUP_LOCATION
                },
                {
                  "type":"postback",
                  "title":"Some impressions",
                  "payload": STARTUP_IMPRESSIONS
                }
              ]
            }
          ]
        }
      }
    }
  }

  callSendAPI(messageData);
}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
function receivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;

  logger.info('Received message read event for watermark %d and sequence ' +
    'number %d', watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 *
 */
function receivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  logger.info('Received account link event with for user %d with status %s ' +
    'and auth code %s ', senderID, status, authCode);
}


function sendMessage(recipientId, messageDatas) {
  if (!messageDatas || messageDatas.length === 0) {
    messageDatas.push({
      message: {
        text: answerGenerator.getFailSentence(),
        metadata: "DEVELOPER_DEFINED_METADATA"
      }
    });

    messageDatas.push({
      message: {
        attachment: {
          type: 'image',
          payload: {
            url: answerGenerator.getGif()
          }
        }
      }
    });
  }

  messageDatas.forEach(function (messageData) {
    messageData.recipient = { id : recipientId };
    callSendAPI(messageData);
  });

}



/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'image',
        payload: {
          url: SERVER_URL + '/assets/rift.png'
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a Gif using the Send API.
 *
 */
function sendGifMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'image',
        payload: {
          url: SERVER_URL + '/assets/instagram_logo.gif'
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send audio using the Send API.
 *
 */
function sendAudioMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'audio',
        payload: {
          url: SERVER_URL + '/assets/sample.mp3'
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 *
 */
function sendVideoMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'video',
        payload: {
          url: SERVER_URL + '/assets/allofus480.mov'
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a file using the Send API.
 *
 */
function sendFileMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'file',
        payload: {
          url: SERVER_URL + '/assets/test.txt'
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText) {
  if (typeof messageText === 'string')
    messageText = [ messageText ];

  if (messageText.length === 0)
    messageText.push('We could not understand your question. Sorry :(');

  messageText.forEach(function(message) {
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        text: message,
        metadata: 'DEVELOPER_DEFINED_METADATA'
      }
    };

    logger.info(messageData);
    callSendAPI(messageData);
  });
}

/*
 * Send a button message using the Send API.
 *
 */
function sendButtonMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: 'This is test text',
          buttons:[{
            type: 'web_url',
            url: 'https://www.oculus.com/en-us/rift/',
            title: 'Open Web URL'
          }, {
            type: 'postback',
            title: 'Trigger Postback',
            payload: 'DEVELOPED_DEFINED_PAYLOAD'
          }, {
            type: 'phone_number',
            title: 'Call Phone Number',
            payload: '+16505551234'
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a Structured Message (Generic Message type) using the Send API.
 *
 */
function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [{
            title: 'rift',
            subtitle: 'Next-generation virtual reality',
            item_url: 'https://www.oculus.com/en-us/rift/',
            image_url: SERVER_URL + '/assets/rift.png',
            buttons: [{
              type: 'web_url',
              url: 'https://www.oculus.com/en-us/rift/',
              title: 'Open Web URL'
            }, {
              type: 'postback',
              title: 'Call Postback',
              payload: 'Payload for first bubble',
            }],
          }, {
            title: 'touch',
            subtitle: 'Your Hands, Now in VR',
            item_url: 'https://www.oculus.com/en-us/touch/',
            image_url: SERVER_URL + '/assets/touch.png',
            buttons: [{
              type: 'web_url',
              url: 'https://www.oculus.com/en-us/touch/',
              title: 'Open Web URL'
            }, {
              type: 'postback',
              title: 'Call Postback',
              payload: 'Payload for second bubble',
            }]
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a receipt message using the Send API.
 *
 */
function sendReceiptMessage(recipientId) {
  // Generate a random receipt ID as the API requires a unique ID
  var receiptId = 'order' + Math.floor(Math.random()*1000);

  var messageData = {
    recipient: {
      id: recipientId
    },
    message:{
      attachment: {
        type: 'template',
        payload: {
          template_type: 'receipt',
          recipient_name: 'Peter Chang',
          order_number: receiptId,
          currency: 'USD',
          payment_method: 'Visa 1234',
          timestamp: '1428444852',
          elements: [{
            title: 'Oculus Rift',
            subtitle: 'Includes: headset, sensor, remote',
            quantity: 1,
            price: 599.00,
            currency: 'USD',
            image_url: SERVER_URL + '/assets/riftsq.png'
          }, {
            title: 'Samsung Gear VR',
            subtitle: 'Frost White',
            quantity: 1,
            price: 99.99,
            currency: 'USD',
            image_url: SERVER_URL + '/assets/gearvrsq.png'
          }],
          address: {
            street_1: '1 Hacker Way',
            street_2: '',
            city: 'Menlo Park',
            postal_code: '94025',
            state: 'CA',
            country: 'US'
          },
          summary: {
            subtotal: 698.99,
            shipping_cost: 20.00,
            total_tax: 57.67,
            total_cost: 626.66
          },
          adjustments: [{
            name: 'New Customer Discount',
            amount: -50
          }, {
            name: '$100 Off Coupon',
            amount: -100
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "What's your favorite movie genre?",
      quick_replies: [
        {
          'content_type':'text',
          'title':'Action',
          'payload':'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION'
        },
        {
          'content_type':'text',
          'title':'Comedy',
          'payload':'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY'
        },
        {
          'content_type':'text',
          'title':'Drama',
          'payload':'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA'
        }
      ]
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {
  logger.info('Sending a read receipt to mark message as seen');

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: 'mark_seen'
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {
  logger.info('Turning typing indicator on');

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: 'typing_on'
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {
  logger.info('Turning typing indicator off');

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: 'typing_off'
  };

  callSendAPI(messageData);
}

/*
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: 'Welcome. Link your account.',
          buttons:[{
            type: 'account_link',
            url: SERVER_URL + '/authorize'
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    logger.info(body);
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        logger.info('Successfully sent message with id %s to recipient %s',
          messageId, recipientId);
      } else {
      logger.info('Successfully called Send API for recipient %s',
        recipientId);
      }
    } else {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });
}

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen(app.get('port'), function() {
  logger.info('Node app is running on port', app.get('port'));
});

module.exports = app;
