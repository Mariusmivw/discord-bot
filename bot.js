/* server Test */
const http = require("http");
const port = 80;

const requestHandler = (request, response) => {
	console.log(request.url);
	response.end("Hello Node.js Server!");
}

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
	if (err) {
		console.log("Something bad happened", err);
	}
	
	console.log(`Server is listening on ${port}`);
});




const dotenv = require("dotenv/config");
const Discord = require("discord.js");
const bot = new Discord.Client();
const prefix = "$";
var privateChannels = {};
var start;

bot.login(process.env.TOKEN);

bot.on("ready", function(){
  console.log(`Logged in as ${bot.user.tag}!`);
  var start = Date().getHours();
  console.log(start);
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
  
  if (guild.privateCategory == undefined || guild.privateCategory == null) {
	guild.privateCategory = guild.channels.findAll("name", "Private Channels").find(function(el){return el.name == "Private Channels";});
  }

  if (author.privatesLeft == undefined || author.privatesLeft == null) {
    author.privatesLeft = 1;
  }

  if (author.isResponding && author.respondIn == channel) {
    var respondTo = author.respondTo;
    var respondNeeds = author.respondNeeds;
    delete author.isResponding;
    delete author.respondTo;
    delete author.respondIn;
    delete author.respondNeeds;
    
    if (txt != `${prefix}cancel`){
        switch (respondTo) {
          case "discrim":
            if (respondNeeds.name){txt = txt.replace("#", "")}
            
            var memberArr = [];
            guild.members.array().forEach(function(item, index){
                if (`${item.user.username}#${item.user.discriminator}` == `${respondNeeds.name}#${txt}` || `${item.nickname}#${item.user.discriminator}` == `${respondNeeds.name}#${txt}` || `${item.user.username}#${item.user.discriminator}` == `${txt}#${respondNeeds.discrim}`){
                    memberArr.push(item);
                }
            });
            if (memberArr.length > 1){
                channel.send("What is their real discord name (i.e. not nickname)");
                author.isResponding = true;
                author.respondIn = channel;
                author.respondTo = respondTo;
                author.respondNeeds = {"discrim": txt};
            }
            else if (memberArr.length == 0){
                channel.send(`***${txt.charAt(0).toUpperCase()}${txt.slice(1)}*** is not a member of ***${guild.name.charAt(0).toUpperCase()}${guild.name.slice(1)}***`);
            }
            else {
                if (channel.permissionsFor(memberArr[0]).has("VIEW_CHANNEL")){
                    channel.send(`${`${respondNeeds.name}#${txt}`.repeat(respondNeeds.name !== null && respondNeeds.name !== undefined)}${`${txt}#${respondNeeds.discrim}`.repeat(respondNeeds.name === null || respondNeeds.name === undefined)} was already invited to this channel`);
                }
                else{
                    channel.overwritePermissions(memberArr[0], {VIEW_CHANNEL: true})
                        .then(channel.send(`<@${memberArr[0].user.id}> has been invited`));
                }
            }
            break;
          case "invite":
            var member = guild.members.find(guildMember => `${guildMember.user.username}#${guildMember.user.discriminator}`.toLowerCase() === txt.toLowerCase());
            if (member) {
                channel.overwritePermissions(member, {VIEW_CHANNEL: true})
                    .then(channel.send(`<@${member.user.id}> has been invited`));
            }
            else {
                var members = [];
                guild.members.array().forEach(function(item, index){
                    if (item.user.username.toLowerCase() == txt.toLowerCase() || item.nickname.toLowerCase() == txt.toLowerCase() || `${item.nickname}#${item.user.discriminator}`.toLowerCase() == txt.toLowerCase()){
                        members.push(item);
                    }
                });
                if (members.length > 1){
                    channel.send(`What is their discriminator?`);
                    author.isResponding = true;
                    author.respondTo = "discrim";
                    author.respondIn = channel;
                    author.respondNeeds = {"name": txt};
                }
                else if (members.length == 0){
                    channel.send(`***${txt.charAt(0).toUpperCase()}${txt.slice(1)}*** is not a member of ***${guild.name.charAt(0).toUpperCase()}${guild.name.slice(1)}***`);
                }
                else {
                    if (channel.permissionsFor(members[0]).has("VIEW_CHANNEL")){
                        channel.send(`***${txt}*** was already invited to this channel`);
                    }
                    else{
                        channel.overwritePermissions(members[0], {VIEW_CHANNEL: true})
                            .then(channel.send(`<@${members[0].user.id}> has been invited`));
                    }
                }
            }
            break;
            
          case "create":
            createPrivate(txt);
            break;
    
          case "delete":
            if (txt == channel.name) {
              clearInterval(privateChannels[channel].timer);
              channel.delete();
            }
            break;
        }
      }
      respondTo = undefined;
      respondNeeds = undefined;
  }
  else if (txt.startsWith(prefix)){
    if (privateChannels[`<#${channel.id}>`] !== undefined && privateChannels[`<#${channel.id}>`] !== null){
      privateCommands();
    }
    else{
      commands(txt);
    }
  }




  //      ______                 __  _
  //     / ____/_  ______  _____/ /_(_)___  ____  _____
  //    / /_  / / / / __ \/ ___/ __/ / __ \/ __ \/ ___/
  //   / __/ / /_/ / / / / /__/ /_/ / /_/ / / / (__  )
  //  /_/    \__,_/_/ /_/\___/\__/_/\____/_/ /_/____/
  //


  function commands(public = true){
    var command = txt.slice(prefix.length, Math.abs(txt.includes(" ")-1) * txt.length + txt.indexOf(" ") * txt.includes(" "));
    var args = txt.slice(command.length + prefix.length + 1).split(" ");
    //console.log(`txt = >${txt}<\ncommand = >${command}<\nargs = >${args}<\nargsLength = ${args.length}`);

    switch (command) {
      case "ping":
        msg.reply("Pong!");
        break;

	  case "stop":
	    bot.user.setStatus("invisible")
  		  .then(bot.destroy(err => console.log(err))
          .then(setTimeout(function(){process.exit();},500)));
  		break;

      default:
        if (public){
          publicCommands();
        }
        break;
    }
  }

  function publicCommands(){
    var command = txt.slice(prefix.length, Math.abs(txt.includes(" ")-1) * txt.length + txt.indexOf(" ") * txt.includes(" "));
    var args = txt.slice(command.length + prefix.length + 1).split(" ");
    //console.log(`txt = >${txt}<\ncommand = >${command}<\nargs = >${args}<\nargsLength = ${args.length}`);

    switch (command) {
      case "create":
        if (author.privatesLeft > 0) {
          if (args[0].length == 0){
            channel.send("Please enter a name for the channel")
              .then(author.isResponding = true)
              .then(author.respondTo = command)
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
    var command = txt.slice(prefix.length, Math.abs(txt.includes(" ")-1) * txt.length + txt.indexOf(" ") * txt.includes(" "));
    var args = txt.slice(command.length + prefix.length + 1).split(" ");
    //console.log(`txt = >${txt}<\ncommand = >${command}<\nargs = >${args}<\nargsLength = ${args.length}`);

    switch (command) {
      case "invite":
        if (args[0].length == 0){
          channel.send(`Please send the username of the person you want to invite (including the discriminator) e.g.: ${author.tag}`);
          author.isResponding = true;
          author.respondTo = command;
          author.respondIn = channel;
        }
        else{
            var member = guild.members.find(guildMember => `${guildMember.user.username}#${guildMember.user.discriminator}` === args.join(` `));
            if (member) {
                channel.overwritePermissions(member, {VIEW_CHANNEL: true})
                    .then(channel.send(`<@${member.user.id}> has been invited`));
            }
            else {
                console.log(args[0]);
                var members = [];
                guild.members.array().forEach(function(item, index){
                    if (item.user.username == args.join(` `) || item.nickname == args.join(` `) || `${item.nickname}#${item.user.discriminator}` == args.join(` `)){
                        members.push(item);
                    }
                });
                console.log(members);
                if (members.length > 1){
                    channel.send(`What is their discriminator?`);
                    author.isResponding = true;
                    author.respondTo = "discrim";
                    author.respondIn = channel;
                    author.respondNeeds = {"name": args.join(` `)};
                }
                else if (members.length == 0){
                    channel.send(`***${args[0].charAt(0).toUpperCase()}${args.join(` `).slice(1)}*** is not a member of ***${guild.name.charAt(0).toUpperCase()}${guild.name.slice(1)}***`);
                }
                else {
                    if (channel.permissionsFor(members[0]).has("VIEW_CHANNEL")){
                        channel.send(`***${args[0]}*** was already invited to this channel`);
                    }
                    else{
                        channel.overwritePermissions(members[0], {VIEW_CHANNEL: true})
                            .then(channel.send(`<@${members[0].user.id}> has been invited`));
                    }
                }
            }
        }
        break;
      case "extend":
        if (privateChannels[`<#${channel.id}>`].extendsLeft > 0){
          privateChannels[`<#${channel.id}>`].roomTime += privateChannels[`<#${channel.id}>`].extendTime;
          privateChannels[`<#${channel.id}>`].extendsLeft -= 1;
          privateChannels[channel].timeLeft = privateChannels[`<#${channel.id}>`].creation.getTime() + privateChannels[`<#${channel.id}>`].roomTime * 60 * 1000 - Date.now();
          channel.send(`You've delayed the deletion of ***${channel.name}*** by ${privateChannels[`<#${channel.id}>`].extendTime} minutes to ${Math.floor(privateChannels[`<#${channel.id}>`].timeLeft / 1000 / 60)} minute${"s".repeat(Math.abs((Math.floor(privateChannels[`<#${channel.id}>`].timeLeft / 1000 / 60)==1)-1))} and ${Math.floor((privateChannels[`<#${channel.id}>`].timeLeft - Math.floor(privateChannels[`<#${channel.id}>`].timeLeft / 1000 / 60) * 1000 * 60) / 1000)} second${"s".repeat(Math.abs((Math.floor((privateChannels[`<#${channel.id}>`].timeLeft - Math.floor(privateChannels[`<#${channel.id}>`].timeLeft / 1000 / 60) * 1000 * 60) / 1000)==1)-1))}, you have ${privateChannels[`<#${channel.id}>`].extendsLeft} time-extender${"s".repeat(privateChannels[`<#${channel.id}>`].extendsLeft != 1)} left.`);
        }
        else{
          channel.send(`It looks like you've used all of your time-extenders, ***${channel.name}*** will be deleted in ${privateChannels[`<#${channel.id}>`].roomTime}`);
        }
        break;
      
      case "time":
        privateChannels[channel].timeLeft = privateChannels[`<#${channel.id}>`].creation.getTime() + privateChannels[`<#${channel.id}>`].roomTime * 60 * 1000 - Date.now();
        channel.send(`You have ${`${Math.floor(privateChannels[channel].timeLeft / 1000 / 60)} minute${"s".repeat(Math.floor(privateChannels[channel].timeLeft / 1000 / 60)!=1)} and `.repeat(Math.floor(privateChannels[channel].timeLeft / 1000 / 60) > 0)}${"***".repeat(Math.floor(privateChannels[channel].timeLeft / 1000 / 60) < 1)}${Math.floor((privateChannels[channel].timeLeft - Math.floor(privateChannels[channel].timeLeft / 1000 / 60) * 1000 * 60) / 1000)} second${"s".repeat(Math.floor((privateChannels[channel].timeLeft - Math.floor(privateChannels[channel].timeLeft / 1000 / 60) * 1000 * 60) / 1000)!=1)}${"***".repeat(Math.floor(privateChannels[channel].timeLeft / 1000 / 60) < 1)} left before ***${channel.name}*** will be deleted, you have ${privateChannels[`<#${channel.id}>`].extendsLeft} time-extenders left to delay the deletion of ***${channel.name}*** by ${privateChannels[`<#${channel.id}>`].extendTime} minutes`);
        break;

      case "delete":
        channel.send(`Are you sure you want to delete ***${channel.name}***? Type '${channel.name}' to confirm deletion.`);
        author.isResponding = true;
        author.respondTo = command;
        author.respondIn = channel;
        break;

      default:
        commands(false);
        break;
    }
  }

  function createPrivate(name){
    var options = {
        type: 'text',
        parent: guild.privateCategory,
        overwrites: [
            {
                id: guild.roles.array().find(function(el){return el.name == "@everyone"}),
                deny: ["VIEW_CHANNEL"]
            },
            {
                id: author,
                allow: ["VIEW_CHANNEL"]
            },
            {
                id: bot.user,
                allow: ["VIEW_CHANNEL", "ADMINISTRATOR"]
            }
        ]
    };
    guild.channels.create(name.replace(" ", "-"), options)
    .then(console.log(`${author} (${aId}) tried to make a private channel`))
    .then(channel => setTimeout(function(){
      console.log(`Created new channel ${channel} at ${channel.createdAt}`);
      author.privatesLeft -= 1;
      
      privateChannels[channel] = {};
      privateChannels[channel].channel = channel;
      privateChannels[channel].creator = author;
      privateChannels[channel].creation = channel.createdAt;
      privateChannels[channel].roomTime = 60;
      privateChannels[channel].extendTime = 30;
      privateChannels[channel].extendsLeft = 5;


      var room = privateChannels[channel];

      privateChannels[channel].timeLeft = room.creation.getTime() + room.roomTime * 60 * 1000 - Date.now();
      channel.send(`***${channel.name.charAt(0).toUpperCase()}${channel.name.slice(1)}*** will be deleted after ${`${Math.floor(room.timeLeft / 1000 / 60)} minute${"s".repeat(Math.floor(room.timeLeft / 1000 / 60)!=1)} and `.repeat(Math.floor(room.timeLeft / 1000 / 60) > 0)}${"***".repeat(Math.floor(room.timeLeft / 1000 / 60) < 1)}${Math.floor((room.timeLeft - Math.floor(room.timeLeft / 1000 / 60) * 1000 * 60) / 1000)} second${"s".repeat(Math.floor((room.timeLeft - Math.floor(room.timeLeft / 1000 / 60) * 1000 * 60) / 1000)!=1)}${"***".repeat(Math.floor(room.timeLeft / 1000 / 60) < 1)}${`, you can extend this by ${room.extendTime} minutes ${room.extendsLeft} more time${"s".repeat(room.extendsLeft != 1)}.`.repeat(room.extendsLeft > 0)}`)
        .then(message => setTimeout(function(){
          privateChannels[channel].timeLeft = room.creation.getTime() + room.roomTime * 60 * 1000 - Date.now();
          message.edit(`***${channel.name.charAt(0).toUpperCase()}${channel.name.slice(1)}*** will be deleted after ${`${Math.floor(room.timeLeft / 1000 / 60)} minute${"s".repeat(Math.floor(room.timeLeft / 1000 / 60)!=1)} and `.repeat(Math.floor(room.timeLeft / 1000 / 60) > 0)}${"***".repeat(Math.floor(room.timeLeft / 1000 / 60) < 1)}${Math.floor((room.timeLeft - Math.floor(room.timeLeft / 1000 / 60) * 1000 * 60) / 1000)} second${"s".repeat(Math.floor((room.timeLeft - Math.floor(room.timeLeft / 1000 / 60) * 1000 * 60) / 1000)!=1)}${"***".repeat(Math.floor(room.timeLeft / 1000 / 60) < 1)}${`, you can extend this by ${room.extendTime} minutes ${room.extendsLeft} more time${"s".repeat(room.extendsLeft != 1)}.`.repeat(room.extendsLeft > 0)}`);
          
          message.pin();
          room.timer = setInterval(function(){
            privateChannels[channel].timeLeft = room.creation.getTime() + room.roomTime * 60 * 1000 - Date.now();
            if (privateChannels[channel].timeLeft < 0){
              channel.delete();
            }
            else{
              message.edit(`***${channel.name.charAt(0).toUpperCase()}${channel.name.slice(1)}*** will be deleted after ${`${Math.floor(room.timeLeft / 1000 / 60)} minute${"s".repeat(Math.floor(room.timeLeft / 1000 / 60)!=1)} and `.repeat(Math.floor(room.timeLeft / 1000 / 60) > 0)}${"***".repeat(Math.floor(room.timeLeft / 1000 / 60) < 1)}${Math.floor((room.timeLeft - Math.floor(room.timeLeft / 1000 / 60) * 1000 * 60) / 1000)} second${"s".repeat(Math.floor((room.timeLeft - Math.floor(room.timeLeft / 1000 / 60) * 1000 * 60) / 1000)!=1)}${"***".repeat(Math.floor(room.timeLeft / 1000 / 60) < 1)}${`, you can extend this by ${room.extendTime} minutes ${room.extendsLeft} more time${"s".repeat(room.extendsLeft != 1)}.`.repeat(room.extendsLeft > 0)}`);
            }
          }, 5000);
        }, 4000))
        .catch(console.error);
    }))
    .catch(console.error);
  }
});
