const Discord = require("discord.js");
const bot = new Discord.Client();
const prefix = "";
var privateChannels = {};

bot.login(process.env.TOKEN); //"MzkyNjU3MzA4NTg2MzQ0NDU5.DRqaMA.ZcrlbfL6FzKJEQSUsrufPbIGX8U"

bot.on("ready", function(){
  console.log(`Logged in as ${bot.user.tag}!`);
});

bot.on("message", function(msg){

  var guild = msg.guild;
  var channel = msg.channel;
  var txt = msg.content;
  var author = msg.author;
  var aId = author.id;

  if (author.privatesLeft == undefined || author.privatesLeft == null) {
    author.privatesLeft = 1;
  }

  if (author.isResponding && author.respondIn == channel) {
    switch (author.respondTo) {
      case "create":
        guild.createChannel(txt.replace(" ", "-"), 'text')
        .then(console.log(`${author} (${aId}) tried to make a private channel`))
        .then(channel => setTimeout(function(){
          console.log(`Created new channel ${channel} at ${channel.createdAt}`);
          author.privatesLeft -= 1;

          var notifyInterval = 15;
          privateChannels[channel] = {};
          privateChannels[channel].creator = author;
          privateChannels[channel].channel = channel;
          privateChannels[channel].roomTime = 60;
          privateChannels[channel].extendTime = 30;
          privateChannels[channel].extendsLeft = 2;

          channel.send(`This channel will be deleted after ${privateChannels[channel].roomTime} minutes, you can extend this by ${privateChannels[channel].extendTime} minutes ${privateChannels[channel].extendsLeft} times.`);

          privateChannels[channel].interval = setInterval(function(){
            privateChannels[channel].roomTime -= notifyInterval;
            channel.send(`${privateChannels[channel].roomTime} minutes and ${privateChannels[channel].extendsLeft} time-extender(s) left`);
          }, (1000 * 60 * notifyInterval));

        }))
        .catch(console.error);
        break;

      case "delete":
        if (txt == channel.name) {
          clearInterval(privateChannels[`<#${channel.id}>`].interval);
          delete privateChannels[`<#${channel.id}>`];
          privateChannels[`<#${channel.id}>`].creator.privatesLeft += 1;
          channel.delete();
        }
        break;
    }
    if (channel == author.respondIn){
      delete author.isResponding;
      delete author.respondTo;
      delete author.respondIn;
    }
  }
  else if (txt.startsWith(prefix)){
    if (privateChannels[`<#${channel.id}>`] !== undefined && privateChannels[`<#${channel.id}>`] !== null){
      privateCommands();
    }
    else{
      commands();
    }
  }




  //      ______                 __  _
  //     / ____/_  ______  _____/ /_(_)___  ____  _____
  //    / /_  / / / / __ \/ ___/ __/ / __ \/ __ \/ ___/
  //   / __/ / /_/ / / / / /__/ /_/ / /_/ / / / (__  )
  //  /_/    \__,_/_/ /_/\___/\__/_/\____/_/ /_/____/
  //


  function commands(public = true){
    txt = txt.slice(prefix.length);
    switch (txt) {
      case "ping":
        msg.reply("Pong!");
        break;

      default:
        if (public){
          publicCommands();
        }
        break;
    }
  }

  function publicCommands(){
    txt = txt.slice(prefix.length);
    switch (txt) {
      case "create":
        if (author.privatesLeft > 0) {
          channel.send("Please enter a name for the channel")
          .then(author.isResponding = true)
          .then(author.respondTo = txt)
          .then(author.respondIn = channel)
          .catch(console.error);
        }
        break;
    }
  }

  function privateCommands(){
    txt = txt.slice(prefix.length);
    switch (txt) {
      case "extend":
        if (privateChannels[`<#${channel.id}>`].extendsLeft > 0){
          privateChannels[`<#${channel.id}>`].roomTime += privateChannels[`<#${channel.id}>`].extendTime;
          privateChannels[`<#${channel.id}>`].extendsLeft -= 1;
          channel.send(`You've delayed the deletion of ***${channel.name}*** by ${privateChannels[`<#${channel.id}>`].extendTime} minutes to ${privateChannels[`<#${channel.id}>`].roomTime} minutes, you have ${privateChannels[`<#${channel.id}>`].extendsLeft} time-extender(s) left`)
        }
        else{
          channel.send(`It looks like you've used all of your time-extenders, ***${channel.name}*** will be deleted in ${privateChannels[`<#${channel.id}>`].roomTime}`);
        }
      break;

      case "delete":
        channel.send(`Are you sure you want to delete ***${channel.name}***? Type '${channel.name}' to confirm deletion.`);
        author.isResponding = true;
        author.respondTo = txt;
        author.respondIn = channel;
        break;

      default:
        commands(false);
        break;
    }
  }
});
