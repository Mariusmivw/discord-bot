const dotenv = require("dotenv/config");

const Discord = require("discord.js");
const bot = new Discord.Client();
const prefix = "/";
var privateChannels = {};

/*bot.login*/console.log(process.env.TOKEN);

bot.on("ready", function(){
  console.log(`Logged in as ${bot.user.tag}!`);
  bot.user.setGame("/halp");
  var keepActive = setInterval(function(){console.log("I don't want to go to bed!!!");}, 1000 * 60 * 90); //keep from idle on c9.io
});

bot.on("channelDelete", function(channel){
  if (privateChannels[channel] !== undefined && privateChannels[channel] !== null) {
    clearInterval(privateChannels[channel].timer);
    privateChannels[channel].creator.privatesLeft += 1;
  }
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
        createPrivate(txt);
        break;

      case "delete":
        if (txt == channel.name) {
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
    command = txt.slice(0, Math.abs(txt.includes(" ")-1) * txt.length + txt.indexOf(" ") * txt.includes(" "));
    args = txt.slice(command.length + 1).split(" ");
    console.log(`txt = >${txt}<\ncommand = >${command}<\nargs = >${args}<\nargsLength = ${args.length}`);

    switch (command) {
      case "ping":
        msg.reply("Pong!");
        break;

	  case "stop":
	    bot.user.setStatus("invisible")
  		  .then(bot.destroy(function(err){console.log(err)})
          .then(setTimeout(function(){process.exit();},500)));
  		break;

      default:
        if (public){
          publicCommands(`${prefix}${txt}`);
        }
        break;
    }
  }

  function publicCommands(txt){
    txt = txt.slice(prefix.length);
    command = txt.slice(0, Math.abs(txt.includes(" ")-1) * txt.length + txt.indexOf(" ") * txt.includes(" "));
    args = txt.slice(command.length + 1).split(" ");
    console.log(`txt = >${txt}<\ncommand = >${command}<\nargs = >${args}<\nargsLength = ${args.length}`);

    switch (command) {
      case "create":
        if (author.privatesLeft > 0) {
          if (args[0].length == 0){
            channel.send("Please enter a name for the channel")
              .then(author.isResponding = true)
              .then(author.respondTo = txt)
              .then(author.respondIn = channel)
              .catch(console.error);
          }
          else {
            createPrivate(args.join(" "));
          }
        }
        else {
          channel.send("You are at your maximum amount of private channels.");
        }
        break;
    }
  }

  function privateCommands(){
    txt = txt.slice(prefix.length);
    command = txt.slice(0, Math.abs(txt.includes(" ")-1) * txt.length + txt.indexOf(" ") * txt.includes(" "));
    args = txt.slice(command.length + 1).split(" ");
    console.log(`txt = >${txt}<\ncommand = >${command}<\nargs = >${args}<\nargsLength = ${args.length}`);

    switch (command) {
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

  function createPrivate(name){
    guild.createChannel(name.replace(" ", "-"), 'text')
    .then(console.log(`${author} (${aId}) tried to make a private channel`))
    .then(channel => setTimeout(function(){
      console.log(`Created new channel ${channel} at ${channel.createdAt}`);
      author.privatesLeft -= 1;

      var notifyInterval = 15;
      privateChannels[channel] = {};
      privateChannels[channel].channel = channel;
      privateChannels[channel].creator = author;
      privateChannels[channel].creation = channel.createdAt;
      privateChannels[channel].roomTime = 60;
      privateChannels[channel].extendTime = 30;
      privateChannels[channel].extendsLeft = 2;


      var room = privateChannels[channel]

      channel.send(`This channel will be deleted after ${room.roomTime} minutes, you can extend this by ${room.extendTime} minutes ${room.extendsLeft} times.`)
        .then(message => setTimeout(function(){
          room.timer = setInterval(function(){
            privateChannels[channel].timeLeft = room.creation.getTime() + room.roomTime * 60 * 1000 - Date.now();
            message.edit(`This channel will be deleted after ${Math.floor(room.timeLeft / 1000 / 60)} minute${"s".repeat(Math.abs((Math.floor(room.timeLeft / 1000 / 60)==1)-1))} and ${Math.floor((room.timeLeft - Math.floor(room.timeLeft / 1000 / 60) * 1000 * 60) / 1000)} second${"s".repeat(Math.abs((Math.floor((room.timeLeft - Math.floor(room.timeLeft / 1000 / 60) * 1000 * 60) / 1000)==1)-1))}, you can extend this by ${room.extendTime} minutes ${room.extendsLeft} times.`);
          }, 1000);
        }))
        .catch(console.error);
    }))
    .catch(console.error);
  }
});
