const Discord=require('discord.js');
const bot=new Discord.Client();
const config=require('./files/config.json');
const sql = require("sqlite");
sql.open("./files/dataBase.sqlite");






bot.on('ready', () => {
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;if(mo<10){mo="0"+mo;}let da=CurrTime.getDate();if(da<10){da="0"+da;}let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();if(hr<10){hr="0"+hr;}let min=CurrTime.getMinutes();if(min<10){min="0"+min;}let sec=CurrTime.getSeconds();if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";
	console.info(timeStampSys+'-- DISCORD HELPBOT [USERS] IS READY --');console.log(console.error);
});



// ##########################################################################
// ############################## TEXT MESSAGE ##############################
// ##########################################################################
bot.on('message', message => {
	
	// STOP SCRIPT IF TEXT IS PRIVATE MESSAGE
	if(message.channel.type=="dm"){ return }
	
	
// ######################### COMMANDS #############################
	if(command==="commands" || command==="help") {
		if(args[0]==="mods") {
			if(m.roles.has(ModR.id) || m.roles.has(AdminR.id)) {
				cmds="--- ** COMMANDS FOR MODS ** ---\n"
					+"`!roles`   \\\u00BB   ROLES multiple options\n"
					+"`!role @mention <ROLE-NAME>`   \\\u00BB   to assign roles\n"
					+"`!temprole`   \\\u00BB   ROLES multiple options\n"
					+"`!temprole <ROLE-NAME> @mention <DAYS>`   \\\u00BB   to assign temporary roles\n";
				return c.send(cmds).catch(console.error);
			}
			else {
				return message.reply("you are **NOT** allowed to use this command! \ntry using: `!commads` or `!commands devs`").catch(console.error); 
			}
		}
		if(c.id!==config.botsupportChannelID){
			return message.reply("this command can only be used at: <#"+config.botsupportChannelID+">");
		}
		if(!args[0]) { 
			cmds="";
			if(config.mapMain.enabled==="yes"){ cmds+="`!map`   \\\u00BB   a link to our **Live Web Map** [much cooler]\n" }
			if(config.paypal.enabled==="yes"){ cmds+="`!subscribe`/`!paypal`   \\\u00BB   for a link to our **PayPal**\n" }
		}
		return c.send(cmds).catch(console.error);
	}

// ######################### DONATE #############################
	if(command==="paypal" || command==="subscribe") {
		if(config.paypal.enabled==="yes"){
			let embedMSG={
				'color': 0xFF0000,
				'title': '\u00BB\u00BB Click HERE to Subscribe \u00AB \u00AB',
				'url': config.paypal.url,
				'thumbnail': {'url': config.paypal.img},
				'description': '(>^.^)> .! Thank you !. <(^.^<)\nYour support is greatly appreciated'
			};
			return c.send({embed: embedMSG}).catch(console.error);
		}
	}
	
// ######################### OTHER LINKS #############################
	if(command==="map") {
		if(config.mapMain.enabled==="yes"){
			return c.send("Our official **webmap**: \n"+config.mapMain.url).catch(console.error);
		}
	}
	
	if(command==="restart"){
		if(m.id===config.ownerID){
			if(args[0]==="user"){
				message.reply("Restarting **User** (`userBot.js`) branch... please wait `5` to `10` seconds").then(()=>{ process.exit(1) }).catch(console.error);
			}
		}
	}
});

// log our bot in
bot.login(config.token);

bot.on('disconnected', function (){
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;if(mo<10){mo="0"+mo;}let da=CurrTime.getDate();if(da<10){da="0"+da;}let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();if(hr<10){hr="0"+hr;}let min=CurrTime.getMinutes();if(min<10){min="0"+min;}let sec=CurrTime.getSeconds();if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";
	console.info(timeStampSys+'-- Disconnected --');console.log(console.error);
	process.exit(1);
});
