const http = require('http')
const url = require('url')
const got = require('got');
const ytdl = require('ytdl-core')
const fs = require('fs')
var stream = ytdl(url);
let httpPort = port = process.env.PORT || 3002
console.log("==============================")
console.log("Minimalist YouTube Player")
console.log("Made by HazyCora")
http.createServer(function (req, res) {
  const queryObject = url.parse(req.url,true).query
  if (req.url.startsWith("/api/proxy")) {
   if (queryObject.url) {
     var d = Buffer.from(queryObject.url, "base64").toString();
     try {
       got.stream(d).on("error", function() {
         res.end();
       }).on("close", function() {
         res.end();
       }).pipe(res);
     } catch (error) {
       res.end(error.message);
     }
   } else {
     var d = JSON.stringify({
       "err": "noUrl"
     })
     res.writeHead(404, {
       "Access-Control-Allow-Origin": "*",
       "Content-Type": "application/json"
     });
     res.end(d);
   }
 }else {
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
  } else {
    if(queryObject.v==undefined) {
      res.writeHead(200, {'Content-Type': 'text/html'})
      res.end(writeHome())
      return
    }else{
      let id
      if (ytdl.validateID(queryObject.v)) {
        id = queryObject.v;
      } else {
        if (ytdl.validateURL(queryObject.v)) {
          id = ytdl.getURLVideoID(queryObject.v);
        } else {
          if (queryObject.v.startsWith("https://youtu.be/")) {
            id = queryObject.v.substring(17)
          } else {
            var d = JSON.stringify({
              "err": "invalidData"
            })
            res.writeHead(404, {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": 'text/html'
            });
            let html = writeViewer({
              video: false,
              info: {videoDetails: {title: "This video is not available."}},
              description: "For some reason, this video is not available.",
              query: queryObject
            })
            res.end(html);
            return;
          }
        }
      }
      ytdl.getInfo(id).then(info => {
        const json = JSON.stringify(info, null, 2)
        let format = ytdl.chooseFormat(info.formats, {})
        res.writeHead(200, {'Content-Type': 'text/html'})
        let obj = {
          video: true,
          format: format,
          info: info,
          description: wrapURLs(info.videoDetails.description),
          query: queryObject
        }
        let html = writeViewer(obj)
        return res.end(html)
      })
    }
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
function writeViewer(data) {
  let s = {err: "No subtitles"}
  if (data.info
    .player_response.captions != undefined) {
        s = data.info
          .player_response.captions
          .playerCaptionsTracklistRenderer.captionTracks
  }
  let html = `
  <head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="static/style.css">
    <title>${data.info.videoDetails.title} - Minimal YouTube Player</title>
    <meta name="viewport" content="width=device-width, user-scalable=no">
  </head>
  <body>
    <div id="videoContainer">`
  if (data.video) {
    html += `<video controls id="video" poster=${data.info.videoDetails.thumbnails[data.info.videoDetails.thumbnails.length-1].url}>`
    data.info.formats.forEach(function(item, i) {
      html += `<source src=${data.info.formats[i].url} type=${data.info.formats[i].mimeType}>`
    })
    if(Array.isArray(s)) {
      s.forEach(function(item, i) {
        let proxyURL = "api/proxy/?url="+Buffer.from(s[i].baseUrl+"&fmt=vtt", 'binary').toString('base64')
        let subtitle = `<track kind="captions" srclang="${s[i].languageCode}" src ="${proxyURL}" label="${s[i].name.simpleText}">`
        html += subtitle
      });
    }
    html += `</video>`
  }
  html += `<p id="title">${data.info.videoDetails.title}</p>`
  html += `<p id="desc">${data.description}</p>`
  return html
}
function writeHome(data) {
  let html = `
  <head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="static/style.css">
    <title>Minimal YouTube Player</title>
    <meta name="viewport" content="width=device-width, user-scalable=no">
  </head>
  <body>
    <p id="siteTitle">Minimal YouTube Player</p>
    <div id="inputs">
      <input id="linkInput" onkeydown="onKey()" placeholder="Paste a YouTube link!" />
      <button type="button" onclick="search()" id="buttonInput">Search</button>
    </div>
    <script>
      function onKey() {
        let ele = document.getElementById('linkInput');
        if(event.key === 'Enter') {
          let goTo = "/?v="+ele.value
          if (ele.value.startsWith("https://youtu.be/")) {
            goTo = "/?v="+ele.value.substring(17)
          }
          if (ele.value.startsWith("https://www.youtube.com/watch?v=")) {
            goTo = "/?v="+ele.value.substring(32)
          }
          window.location.href = goTo
        }
      }
      function search() {
        let ele = document.getElementById('linkInput');
        let goTo = "/?v="+ele.value
        if (ele.value.startsWith("https://youtu.be/")) {
          goTo = "/?v="+ele.value.substring(17)
        }
        if (ele.value.startsWith("https://www.youtube.com/watch?v=")) {
          goTo = "/?v="+ele.value.substring(32)
        }
        window.location.href = goTo
      }
    </script>
  </body>`
  return html
}
