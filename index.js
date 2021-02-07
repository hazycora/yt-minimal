const http = require('http')
const url = require('url')
const ytdl = require('ytdl-core')
const fs = require('fs')
const pug = require('pug')
var stream = ytdl(url);
let httpPort = 3002;
console.log("==============================")
console.log("Minimalist YouTube Player")
console.log("Made by HazyCora")
http.createServer(function (req, res) {
  const queryObject = url.parse(req.url,true).query
  if(req.url.startsWith("/static/")) {
    fs.readFile(__dirname+req.url, function (err,data) {
      if (err) {
        res.writeHead(404)
        res.end(JSON.stringify(err))
        return
      }
      res.writeHead(200)
      res.end(data)
      return
    });
  }else {
    if(queryObject.v==undefined) {
      res.writeHead(200, {'Content-Type': 'text/html'})
      let html = pug.renderFile('home.pug', {})
      res.end(html)
      return
    }else{
      let id
      if (ytdl.validateID(queryObject.v)) {
        id = queryObject.v;
      } else {
        if (ytdl.validateURL(queryObject.v)) {
          id = ytdl.getURLVideoID(queryObject.v);
        } else {
          var d = JSON.stringify({
            "err": "invalidData"
          })
          res.writeHead(404, {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": 'text/html'
          });
          let html = pug.renderFile('player.pug', {
            video: false,
            info: {videoDetails: {title: "This video is not available."}},
            description: "For some reason, this video is not available.",
            query: queryObject
          })
          res.end(html);
          return;
        }
      }
      ytdl.getInfo(id).then(info => {
        const json = JSON.stringify(info, null, 2)
        let format = ytdl.chooseFormat(info.formats, {})
        res.writeHead(200, {'Content-Type': 'text/html'})
        let html = pug.renderFile('player.pug', {
          video: true,
          format: format,
          info: info,
          description: wrapURLs(info.videoDetails.description),
          query: queryObject
        })
        res.end(html)
        return
      }).catch(function (err) {
        res.writeHead(404, {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": 'text/html'
        });
        let html = pug.renderFile('player.pug', {
          video: false,
          info: {videoDetails: {title: "This video is not available."}},
          description: "For some reason, this video is not available.",
          query: queryObject
        })
        res.end(html);
      });
    }
  }
}).listen(httpPort)
console.log("Listening on http://localhost:"+httpPort)
console.log("==============================")
stream.on('error', function(err) {
  if(JSON.stringify(err)!="{}") {
    console.log("WHAT?? AN ERROR????? "+JSON.stringify(err));
  }
});
function wrapURLs(text, new_window) {
  var url_pattern = /(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\x{00a1}\-\x{ffff}0-9]+-?)*[a-z\x{00a1}\-\x{ffff}0-9]+)(?:\.(?:[a-z\x{00a1}\-\x{ffff}0-9]+-?)*[a-z\x{00a1}\-\x{ffff}0-9]+)*(?:\.(?:[a-z\x{00a1}\-\x{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?/ig
  var target = (new_window === true || new_window == null) ? '_blank' : ''

  return text.replace(url_pattern, function (url) {
    var protocol_pattern = /^(?:(?:https?|ftp):\/\/)/i
    var href = protocol_pattern.test(url) ? url : 'http://' + url
    return '<a href="' + href + '" target="' + target + '">' + url + '</a>'
  })
}
