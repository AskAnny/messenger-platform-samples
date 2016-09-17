const gifUrls = [
  "http://media0.giphy.com/media/1CLBGBQ1lM3QI/200.gif",
  "http://media0.giphy.com/media/TidtDukYTD0lO/200.gif",
  "http://media0.giphy.com/media/dxBGTgjp8vSx2/200.gif",
  "http://media0.giphy.com/media/14aUO0Mf7dWDXW/200.gif",
  "http://media0.giphy.com/media/1BXa2alBjrCXC/200.gif",
  "http://media0.giphy.com/media/ROLJoqJ4tUd44/200.gif",
  "http://media0.giphy.com/media/SUSIEwRmnFblm/200.gif",
  "http://media0.giphy.com/media/xTiTnHXbRoaZ1B1Mo8/200.gif",
  "http://media0.giphy.com/media/czSJ0WINlfODe/200.gif"
];

const failSentences = [
  "We could not find anything. So sorry.. :/",
  "You trusted us. And we failed you :'(",
  "What?! :o",
  "We really tried. Like with all our power. Sorry..",
  "What are you talking about?",
  "Is this a serious question?",
  "Sorry. No idea.."
];

module.exports = {
  getGif : () => {
    return gifUrls[Math.floor((Math.random() * gifUrls.length))];
  },

  getFailSentence : () => {
    return failSentences[Math.floor((Math.random() * failSentences.length))];
  }

}
