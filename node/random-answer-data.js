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

const botPersonal = [
  "Hi, I am Anny the universal Bot. ;)",
  "Hi, my name is Anny. Nice to meet you! :)",
  "Hey, I am Anny, a bot to answer all your questions to websites ;)",
  "Hey, nice to meet you. I am Anny :)",
  "I am the one and only great Anny! It's a shame you never heard about me..."
];

const botHealth = [
  "I am fine. Thanks for asking.",
  "Nice you are asking. I feel pretty useful today. Maybe I can help you, too.",
  "Answering all these questions is quiete exhausting. But for you, I'll do my best",
  "Very well! I saw a lot of hard working people creating awesome projects in the last two days :)",
  "Thanks for asking. I am fine. Are you nervious about the pitches?"
];

const botThanks = [
  "It was a pleasure answering you're questions.",
  "Let's be honest, you're questions were not to hard. 😂",
  "You are welcome! :)",
  "Sure, no problem. I love helping people.",
  "No big deal! ;)"
];

const botWeather = [
  "You really want to talk about the weather? Please stop it.",
  "Used to be better some days ago. Perfect for coding. ;)",
  "Since when do you IT-guys think about the weather?"
];

const botHobbies = [
  "Like you noticed, I don't have a body.. Not much left I guess :D",
  "Quizduell is definitely my favorite game!",
  "I love cooking. At least it is funny if things go wrong. :D"
];

const botSports = [
  "I am quiete good at chess. But besides that, I suck at sports :P",
  "Don't really like it, actually."
];

module.exports = {
  getGif : () => {
    return gifUrls[Math.floor((Math.random() * gifUrls.length))];
  },

  getFailSentence : () => {
    return failSentences[Math.floor((Math.random() * failSentences.length))];
  },
  
  getRandomPersonal: () => {
    return botPersonal[Math.floor((Math.random() * botPersonal.length))];
  },
  
  getRandomHealth: () => {
    return botHealth[Math.floor((Math.random() * botHealth.length))];
  },

  getRandomThanks: () => {
    return botThanks[Math.floor((Math.random() * botThanks.length))];
  },

  getRandomWeather: () => {
    return botWeather[Math.floor((Math.random() * botWeather.length))];
  },

  getRandomHobbies: () => {
    return botHobbies[Math.floor((Math.random() * botHobbies.length))];
  },

  getRandomSports: () => {
    return botSports[Math.floor((Math.random() * botSports.length))];
  }

};
