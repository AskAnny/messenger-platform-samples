'use strict';

const debug = require('debug')('message');
const _ = require('lodash');
const sentences = require('../random-answer-data');

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
  const days = _.chain(hours)
                .keys()
                .groupBy(key => key.substring(0, 3))
                .value()
  let results = ['Here are my opening hours during the week:'];
  for (let day in days) {
    let key = day + '_1_';
    results.push(`${dayNames.get(day)}: ${hours[key + 'open']}-${hours[key + 'close']}`);
  }
  return generateText(results.join('\n'));
}


function generatePictureMsg(pictureUrl, pictureName) {
  if (pictureName)
    return {
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [
              {
                title : pictureName,
                image_url : pictureUrl
              }
            ]
          }
        }
      }
    };
  else
    return {
      message: {
        attachment: {
          type: "image",
          payload: {
            url: pictureUrl 
          }
        }
      }
    };
}

function generateAddress(address) {
  if (address.latitude && address.longitude) {
    const lat = address.latitude;
    const long = address.longitude;

    return { "message": {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": {
                    "element": {
                        "title": "You'll find us here: " + formatAddress(address) + "!",
                        "image_url": "https:\/\/maps.googleapis.com\/maps\/api\/staticmap?size=764x400&center="+lat+","+long+"&zoom=18&markers="+lat+","+long,
                        "item_url": "http:\/\/maps.apple.com\/maps?q="+lat+","+long+"&z=16"
                    }
                }
            }
        }
      }
    };
  }
  else
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
            title: link,
            webview_height_ratio: "compact"
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
      result.push(generateLinkButton("You should definitely try ", response.website));
    }

    if ("albums" in response) {
      response.albums.data.forEach(function (album) {
        album.photos.data.forEach(function (image) {
          result.push(generatePictureMsg(image.source, image.name));
        });
      });
    }


    if (result.length === 0 && response.req.fields.length > 0) {
      let list = response.req.fields[0];
      for (let i = 1; i < response.req.fields.length; i++)
        list += ", " + response.req.fields[i];
      result.push(generateText("Sorry, we did not found information to: " + list + "."));
    }
    return result;
  },

  generateBotMsg: fields => {
    let result = [];
    if (fields.indexOf("bot_personalities") !== -1) {
      result.push(generateText(sentences.getRandomPersonal()));
    }

    if (fields.indexOf("bot_health") !== -1) {
      result.push(generateText(sentences.getRandomHealth()));
    }

    if (fields.indexOf("thanks") !== -1) {
      result.push(generateText(sentences.getRandomThanks()));
    }

    if (fields.indexOf("weather") !== -1) {
      result.push(generateText(sentences.getRandomWeather()));
    }

    if (fields.indexOf("hobbies") !== -1) {
      result.push(generateText(sentences.getRandomHobbies())); 
    }

    if (fields.indexOf("sports") !== -1) {
      result.push(generateText(sentences.getRandomSports()));
    }
  
    return result;
  }

};
