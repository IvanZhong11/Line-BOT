require("webduino-js");
require("webduino-blockly");
var linebot = require('linebot');
var express = require('express');
var path = require('path');
var db = require('./sqlite.js');
var getJSON = require('get-json');
var io = require('socket.io');

var bot = linebot({
   channelId: '1537892579',
   channelSecret: 'ece60c99ed04ccb2044288fb54c31bf5',
   channelAccessToken: '1nOCreXkDv6X2uHk4+nbhHvGqPIhovsOM3QoKlkTIv97gk+YVkchdDjb3RMr8dQPf+h/eAFD6hZkBsJ4oA5UqP/B9rnYGdkRDsCT79O9M9B9vJg8sYPdo1/NjqcH3gGcn1eR5N88/mfkHSP7PAfGWAdB04t89/1O/w1cDnyilFU='
});

var id;
var timer;
var UVI = [];
var PM = [] ;
var Wiki = [];
var wt = [];
var a = '';
var aa = '';
var aaa = '';
var b = '';
var title = '';
let user = '';
let ledoff = 'lights off';
let ledon = 'lights on';
var usd = '';
var eur = '';
var first = "";
var dht;
var vcc;
var rgbled;
var toggle = true;
var clientSocket = {};
var users = [];
var temp='';
_bot();
_getUVI();
_getAQI();
_getWeather();

const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({extended: true}));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/views', express.static(path.join(__dirname, 'views')));
app.post('/', linebotParser);
app.use('/setting', require('./setting.js'));

boardReady({device: 'nPVBQ'}, function(board){
	board.systemReset();
	board.samplingInterval = 250;
    dht = getDht(board, 11);
    vcc = getPin(board, 6);
	rgbled = getRGBLed(board, 7, 8, 9);
	dht.read(function(evt){
      console.log('Temperature: '+dht.temperature);
	  console.log(vcc.value);
        if(dht.temperature > 0){
          temp = '溫度= '+ dht.temperature + '度';
		}
    }, 3000);
});

function _bot(){
  bot.on('message', function(event){
    var msg = event.message.text;
    var replyMsg = '';
	var con = db.getConnect();
    event.source.profile().then(function(profile){
	  user = profile.displayName;
    if(event.message.type == 'text'){
	  if(msg == 'help' || msg == 'Help' || msg == '功能列表'){
        replyMsg = '\t' + '功能列表 :' + '\n' + '1. 查看紫外線 (範例: 臺北紫外線)' + '\n'+'2. 查看空氣品質 (範例: 新店空氣品質)' + '\n'+'3. 查看天氣狀況 (範例: 臺北天氣)' + '\n' + '4. 查看(美/歐/日)匯率 (範例: 美元 匯率)' + '\n' + '5. 計算(美/歐/日)匯率 (範例: 200日圓多少台幣)' + '\n' + '6. 使用維基百科搜尋 (範例: 臺北 wiki)' + '\n' + '7. 使用 Google 搜尋 (範例: 奧巴馬 google)' + '\n' + '8. 使用 Google 翻譯 (英翻中) (範例: Technology 中文)' + '\n' + '9. 使用 Google 翻譯 (中翻英) (範例: 科技 英文)'+ '\n' + '10. 使用 Google 搜尋位置 (範例: 臺北101在哪裡)';
        if (replyMsg == ''){
          replyMsg = '請輸入 help 或 功能列表';
        }
      }
	  
	  else if(msg.indexOf('紫外線') != -1 || msg.indexOf('空氣品質') != -1 || msg.indexOf('天氣') != -1){
		if(msg.indexOf('紫外線') != -1){
		con.queryMessageByRequest(msg, function(err, response){
        con.close(function(){
          var message;
		  type:'imagemap'
            if(!err){
                if(response){
                  message = response.RESPONSE;
                }else{
					UVI.forEach(function(e, i){
					if(msg.indexOf(e[0]) != -1){
					  replyMsg = e[0]+' 紫外線'+'\n'+'UVI : '+e[1];
					event.reply({
						type:'template',
						altText:replyMsg.toString(),
						template:{
						  type:'buttons',
						  thumbnailImageUrl:'https://qph.ec.quoracdn.net/main-qimg-c453e2bd972343606008e65efec6cf72',
						  title:e[0].toString(),
						  text:'UVI : '+e[1].toString(),
						  actions:[{
							type:'uri',
							label:'瀏覽',
							uri:'http://www.cwb.gov.tw/V7e/observe/UVI/UVI.htm'
						  }]
						}
						});
					}
					});
				}
				if(replyMsg == ''){
				  replyMsg = '抱歉, 找不到這個地點, 請輸入其它地點';
				  event.reply(replyMsg);
				}
			}
			bot.reply(event.replyToken, message);
			});
		});
		}
		if(msg.indexOf('空氣品質') != -1){
		con.queryMessageByRequest(msg, function(err, response){
        con.close(function(){
          var message;
		  type:'imagemap'
            if(!err){
                if(response){
                  message = response.RESPONSE;
                }else{
					PM.forEach(function(e, i){
					if(msg.indexOf(e[0]) != -1){
					  replyMsg = e[0]+' 空氣品質'+'\n'+'空氣狀態 : '+e[1]+'\n'+'空氣指標 : '+e[2]+'\n'+'PM2.5 : '+e[4]+' μg/m3'+'\n'+'PM10 : '+e[3]+' μg/m3'+'\n'+'更新時間 : '+e[5];
					  a = '空氣狀態 : '+e[1]+'\n'+'空氣指標 : '+e[2];
					  aa = 'PM2.5 : '+e[4]+' μg/m3'+'\n'+'PM10 : '+e[3]+' μg/m3';
					event.reply({
						type:'template',
						altText:replyMsg.toString(),
						template:{
						  type:'carousel',
						  columns:[{
							thumbnailImageUrl:'https://static.businessinsider.com/image/5617e62fdd0895d22b8b4672/image.jpg',
							title:e[0].toString()+' AQI',
							text:a.toString(),
							actions:[{
								type:'uri',
								label:'瀏覽',
								uri:'https://taqm.epa.gov.tw/taqm/en/AqiMap.aspx'
							}]
						  },
						  {
							thumbnailImageUrl:'https://cc.tvbs.com.tw/img/upload/2016/11/16/20161116155240-8426ec1f.jpg',
							title:e[0].toString()+' PM',
							text:aa.toString(),
							actions:[{
								type:'uri',
								label:'瀏覽',
								uri:'https://taqm.epa.gov.tw/pm25/en/PM25A.aspx'
							}]
						  }]
						}
						});
					}
					});
				}
				if(replyMsg == ''){
				  replyMsg = '抱歉, 找不到這個地點, 請輸入其它地點';
				  event.reply(replyMsg);
				}
			}
			bot.reply(event.replyToken, message);
			});
		});
	    }
	    if(msg.indexOf('天氣') != -1){
        wt.forEach(function(e, i){
          if(msg.indexOf(e[0]) != -1){
			replyMsg = e[0]+' 天氣'+'\n'+'天氣狀況 : '+e[1]+'\n'+'溫度 : '+e[2]+' °C'+'\n'+'能見度 : '+e[3]+' 公里'+'\n'+'海平面氣壓 : '+e[4]+' mbar'+'\n'+'風速 : '+e[5]+' 公尺/秒'+'\n'+'風向 : '+e[6]+'\n'+'日累積雨量 : '+e[7]+' 毫米'+'\n'+'更新時間 : '+e[8];
		  }
        });
        if(replyMsg == ''){
          replyMsg = '抱歉, 找不到這個地點, 請輸入其它地點';
        }
        }
      }
	  
	  else if(msg.indexOf('wiki') != -1 || msg.indexOf('google') != -1 || msg.indexOf('在哪裡') != -1){
		if(msg.indexOf('wiki') != -1){
		first = msg.substring(0, msg.indexOf('wiki')).split(' ').join('_');
		replyMsg = 'https://zh.wikipedia.org/wiki/'+first;
		    if(first == ''){
			  replyMsg = '請輸入你要查詢的字, 後面加上 wiki';
			}
		}
		if(msg.indexOf('google') != -1){
		first = msg.slice(0, msg.indexOf('google')).split(' ').join('+');
		replyMsg = 'https://www.google.com.tw/search?dcr=0&q='+first;
		    if(first == ''){
			  replyMsg = '請輸入你要查詢的字, 後面加上 google';
			}
		}
		if(msg.indexOf('在哪裡') != -1){
		first = msg.slice(0, msg.indexOf('在哪裡')).split(' ').join('+');
		replyMsg = 'https://www.google.com.tw/maps/search/'+first;
		    if(first == ''){
			  replyMsg = '請輸入你要查詢的位置, 後面加上 在哪裡';
			}
		}
	  }
	  
	  else if(msg.indexOf('中文') != -1 || msg.indexOf('英文') != -1){
		if(msg.indexOf('中文') != -1){
		first = msg.slice(0, msg.indexOf('中文')).split(' ').join('+');
		replyMsg = 'https://translate.google.com.tw/?hl=zh-TW#en/zh-TW/'+first;
		    if(first == ''){
			  replyMsg = '請輸入你要翻譯的字, 後面加上 中文';
			}
		}else{
		first = msg.substring(0, msg.indexOf('英文')).split(' ').join('+');
		replyMsg = 'https://translate.google.com.tw/?hl=zh-TW#zh-CN/en/'+first;
		    if(first == ''){
			  replyMsg = '請輸入你要翻譯的字, 後面加上 英文';
			}
		}
	  }
	  
	  else if(msg.indexOf('匯率') != -1 || msg.indexOf('多少台幣') != -1 || msg.indexOf('多少臺幣') != -1){
		if(msg.indexOf('匯率') != -1){
		  first = msg.substring(0, msg.indexOf("匯率"));
		  if(first == 'USD' || first == 'USD ' || first == '美元' || first == '美元 '){
			a = '美元';
			getJSON('http://free.currencyconverterapi.com/api/v5/convert?q=USD_TWD&compact=ultra', function(error, response){
			aa = (response.USD_TWD).toFixed(2);
			title = 'USD <=> TWD';
			replyMsg = '1 '+a+' = '+aa+' 台幣';
			event.reply({
				type:'template',
				altText:replyMsg.toString(),
				template:{
				type:'buttons',
				thumbnailImageUrl:'https://maxcdn.icons8.com/Share/icon/Business//currency_exchange1600.png',
				title:title.toString(),
				text:replyMsg.toString(),
				actions:[{
					type:'uri',
					label:'瀏覽',
					uri:'http://portal.sw.nat.gov.tw/APGQ/GC331'
					}]
				}
			});
			});
		  }else if(first == 'EUR' || first == 'EUR ' || first == '歐元' || first == '歐元 '){
			a = '歐元';
			getJSON('http://free.currencyconverterapi.com/api/v5/convert?q=EUR_TWD&compact=ultra', function(error, response){
			aa = (response.EUR_TWD).toFixed(2);
			title = 'EUR <=> TWD';
			replyMsg = '1 '+a+' = '+aa+' 台幣';
			event.reply({
				type:'template',
				altText:replyMsg.toString(),
				template:{
				type:'buttons',
				thumbnailImageUrl:'https://maxcdn.icons8.com/Share/icon/Business//currency_exchange1600.png',
				title:title.toString(),
				text:replyMsg.toString(),
				actions:[{
					type:'uri',
					label:'瀏覽',
					uri:'http://portal.sw.nat.gov.tw/APGQ/GC331'
					}]
				}
			});
			});
		  }else if(first == 'JPY' || first == 'JPY ' || first == '日圓' || first == '日圓 '){
			a = '日圓';
			getJSON('http://free.currencyconverterapi.com/api/v5/convert?q=JPY_TWD&compact=ultra', function(error, response){
			aa = (response.JPY_TWD).toFixed(2);
			title = 'JPY <=> TWD';
			replyMsg = '1 '+a+' = '+aa+' 台幣';
			event.reply({
				type:'template',
				altText:replyMsg.toString(),
				template:{
				type:'buttons',
				thumbnailImageUrl:'https://maxcdn.icons8.com/Share/icon/Business//currency_exchange1600.png',
				title:title.toString(),
				text:replyMsg.toString(),
				actions:[{
					type:'uri',
					label:'瀏覽',
					uri:'http://portal.sw.nat.gov.tw/APGQ/GC331'
					}]
				}
			});
			});
		  }else{
			replyMsg = '抱歉, 目前功能只有 美元, 歐元, 日圓 匯率';
		  }
		}
		else if(msg.indexOf('多少台幣') != -1 || msg.indexOf('多少臺幣') != -1){
		  if(msg.indexOf('USD') != -1 || msg.indexOf('美元') != -1){
			a = '美元';
			b = msg.match(/\d/g);
			b = b.join("");
			getJSON('http://free.currencyconverterapi.com/api/v5/convert?q=USD_TWD&compact=ultra', function(error, response){
			aa = response.USD_TWD;
			aaa = (aa * b).toFixed(2);
			title = 'USD <=> TWD';
			replyMsg = b+' '+a+' = '+aaa+' 台幣';
			event.reply({
				type:'template',
				altText:replyMsg.toString(),
				template:{
				type:'buttons',
				thumbnailImageUrl:'https://maxcdn.icons8.com/Share/icon/Business//currency_exchange1600.png',
				title:title.toString(),
				text:replyMsg.toString(),
				actions:[{
					type:'uri',
					label:'瀏覽',
					uri:'http://portal.sw.nat.gov.tw/APGQ/GC331'
					}]
				}
			});
			});
		  }else if(msg.indexOf('EUR') != -1 || msg.indexOf('歐元') != -1){
			a = '歐元';
			b = msg.match(/\d/g);
			b = b.join("");
			getJSON('http://free.currencyconverterapi.com/api/v5/convert?q=EUR_TWD&compact=ultra', function(error, response){
			aa = response.EUR_TWD;
			aaa = (aa * b).toFixed(2);
			title = 'EUR <=> TWD';
			replyMsg = b+' '+a+' = '+aaa+' 台幣';
			event.reply({
				type:'template',
				altText:replyMsg.toString(),
				template:{
				type:'buttons',
				thumbnailImageUrl:'https://maxcdn.icons8.com/Share/icon/Business//currency_exchange1600.png',
				title:title.toString(),
				text:replyMsg.toString(),
				actions:[{
					type:'uri',
					label:'瀏覽',
					uri:'http://portal.sw.nat.gov.tw/APGQ/GC331'
					}]
				}
			});
			});
		  }else if(msg.indexOf('JPY') != -1 || msg.indexOf('日圓') != -1){
			a = '日圓';
			b = msg.match(/\d/g);
			b = b.join("");
			getJSON('http://free.currencyconverterapi.com/api/v5/convert?q=JPY_TWD&compact=ultra', function(error, response){
			aa = response.JPY_TWD;
			aaa = (aa * b).toFixed(2);
			title = 'JPY <=> TWD';
			replyMsg = b+' '+a+' = '+aaa+' 台幣';
			event.reply({
				type:'template',
				altText:replyMsg.toString(),
				template:{
				type:'buttons',
				thumbnailImageUrl:'https://maxcdn.icons8.com/Share/icon/Business//currency_exchange1600.png',
				title:title.toString(),
				text:replyMsg.toString(),
				actions:[{
					type:'uri',
					label:'瀏覽',
					uri:'http://portal.sw.nat.gov.tw/APGQ/GC331'
					}]
				}
			});
			});
		  }else{
			replyMsg = '抱歉, 目前功能只有 美元, 歐元, 日圓 匯率';
		  }
		}
	  }
	  
	  else if(msg == '關燈' || msg == '開燈'){
		if(msg == '關燈'){
		  if(toggle){
			rgbled.setColor('#00ff00');
		  }else{
			rgbled.setColor('#0000ff');
		  }
		  toggle = !toggle;
		  vcc.write(0);
		  replyMsg = 'Lights OFF';
		}else{
		  vcc.write(1);
		  replyMsg = 'Lights ON';
		}
	  }
	  
	  else if(msg == 'Hi'||msg == 'hi'||msg == 'Hey'||msg == 'hey'||msg == 'Hello'||msg == 'hello'||msg == '嗨'||msg == '嘿'||msg == '哈囉'||msg == '安安'){
		con.queryMessageByRequest(msg, function(err, response){
        con.close(function(){
			var message;
			type:'image'
            if (!err){
              if (response){
                message = response.RESPONSE;
              }else{
				replyMsg = getRandomInt(0,3);
				switch(replyMsg){
					case 1: event.reply({
								type:'sticker',
								packageId:'4',
								stickerId:'607'
							});
							break;
					case 2: event.reply({
								type:'image',
								originalContentUrl:'https://www.thegadgettechie.com/wp-content/uploads/2016/08/hello-1.jpg',
								previewImageUrl:'https://www.thegadgettechie.com/wp-content/uploads/2016/08/hello-1.jpg'
							});
							break;
					case 3: event.reply({
								type:'image',
								originalContentUrl:'https://croozefm.com/wp-content/uploads/2016/11/Whats-Up-Note.jpg',
								previewImageUrl:'https://croozefm.com/wp-content/uploads/2016/11/Whats-Up-Note.jpg'
							});
							break;
					default: event.reply({
								type:'image',
								originalContentUrl:'https://previews.123rf.com/images/vladvm/vladvm1511/vladvm151100167/47687636-The-hi-icon-Greet-and-hello-symbol-Flat-Vector-illustration-Stock-Vector.jpg',
								  previewImageUrl:'https://previews.123rf.com/images/vladvm/vladvm1511/vladvm151100167/47687636-The-hi-icon-Greet-and-hello-symbol-Flat-Vector-illustration-Stock-Vector.jpg'
							});
							break;
					}
				}
			}
			bot.reply(event.replyToken, message);
			});
		});
	  }
	  
	  else if(msg == '不要'){
		event.reply({
		  type: 'sticker',
		  packageId: '2',
		  stickerId: '18'
		});
	  }
	  
	  else if(msg.indexOf('插座溫度') != -1){
		  replyMsg = temp;
	  }
	  
	  else if(replyMsg == ''){
		con.queryMessageByRequest(msg, function (err, respone) {
        con.close(function(){
            var message;
			type:'sticker'
            if(!err){
                if(respone){
                    message = respone.RESPONE;
                }else{
				  event.reply({
					type: 'sticker',
					packageId: '2',
					stickerId: getRandomInt(21,47).toString()
				  });
                }
            }
            bot.reply(event.replyToken, message);
        });
	  });
      }
	  
	  else{
		event.reply({
			type: 'sticker',
			packageId: '2',
			stickerId: getRandomInt(21,47).toString()
		});
      }
	}
	else{
		event.reply({
			type: 'sticker',
			packageId: '2',
			stickerId: getRandomInt(21,47).toString()
		});
    }
    event.reply(replyMsg).then(function(data){
		con.queryMessageByRequest(msg, function(err, response){
        con.close(function(){
			for(var id in clientSocket){
			  clientSocket[id].emit('message', {'message': user + '說' + msg});
			}
		  });
		});
		console.log(user +' 說 '+msg);
		console.log(replyMsg);
      }).catch(function(error){
        console.log('error');
      });
	});
  });
  
  bot.on('follow', function(event){
    if(users.indexOf(event.source.userId) < 0){
        users.push(event.source.userId);
    }
    event.source.profile().then(function(profile){
		user = profile.displayName;
        for(var id in clientSocket){
          clientSocket[id].emit('message', {'message': user+' 加入好友!'});
        }
		console.log(user+' 加入好友');
    });
	event.reply({
		type: 'template',
		altText: 'Hello',
		template:{
		  type: 'confirm',
		  text: '要看 功能列表 嗎?',
		  actions:[{
			type: 'message',
			label: '要',
			text: '功能列表'
			},{
			type: 'message',
			label: '不要',
			text: '不要'
			}]
		}
	});
  });
}

function getRandomInt(min, max){
  min = Math.floor(min);
  max = Math.floor(max);
  return Math.ceil(Math.random() * (max - min)) + min;
}

function _getUVI(){
  clearTimeout(timer);
  //https://data.gov.tw/dataset/6076
  getJSON('http://opendata2.epa.gov.tw/UV/UV.json?$format=json', function(error, response){
    response.forEach(function(e, i){
      UVI[i] = [];
      UVI[i][0] = e.SiteName;
      UVI[i][1] = e['UVI'];
    });
  });
  timer = setInterval(_getUVI, 3600000);
}

function _getAQI(){
  clearTimeout(timer);
  //https://data.gov.tw/dataset/40448
  getJSON('http://opendata2.epa.gov.tw/AQI.json?$format=json', function(error, response){
    response.forEach(function(e, i){
      PM[i] = [];
      PM[i][0] = e.SiteName;
      PM[i][1] = e['Status'];
	  PM[i][2] = e['AQI'];
	  PM[i][3] = e['PM10'];
	  PM[i][4] = e['PM2.5'];
	  PM[i][5] = e['PublishTime'];
    });
  });
  timer = setInterval(_getAQI, 3600000);
}

function _getWeather(){
  clearTimeout(timer);
  //https://data.gov.tw/dataset/45131
  getJSON('http://opendata.epa.gov.tw/ws/Data/ATM00698/?$format=json', function(error, response){
    response.forEach(function(e, i){
      wt[i] = [];
      wt[i][0] = e.SiteName;
      wt[i][1] = e['Weather'];
	  wt[i][2] = e['Temperature'];
	  wt[i][3] = e['Visibility'];
	  wt[i][4] = e['AtmosphericPressure'];
	  wt[i][5] = e['WindPower'];
	  wt[i][6] = e['WindDirection'];
	  wt[i][7] = e['Rainfall1day'];
	  wt[i][8] = e['DataCreationDate'];
    });
  });
  timer = setInterval(_getWeather, 3600000);
}

var server = app.listen(process.env.PORT || 8080, function(){
  var port = server.address().port;
  console.log("App now running on port", port);
});

var serv_io = io.listen(server);

serv_io.sockets.on('connection', function(socket){
    clientSocket[socket.id] = socket;
    console.log('connection: '+socket.id);
    socket.on('disconnect', function(){
      console.log('disconnect: '+socket.id);
      delete clientSocket[socket.id];
    });
});