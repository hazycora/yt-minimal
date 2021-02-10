const express = require('express')
const app = express()
const url = require('url')
const got = require('got');
const ytdl = require('ytdl-core')
const fs = require('fs')
var stream = ytdl(url);
let httpPort = port = 25550
console.log("==============================")
console.log("Minimalist YouTube Player")
console.log("Made by HazyCora")
app.get('/api/proxy', function (req, res) {
  if (queryObject.url) {
    var d = Buffer.from(queryObject.url, "base64").toString();
    try {
      got.stream(d).on("error", function() {
        res.send();
      }).on("close", function() {
        res.send();
      }).pipe(res);
    } catch (error) {
      res.send(error.message);
    }
  } else {
    var d = JSON.stringify({
      "err": "noUrl"
    })
    res.send(d);
  }
})
app.get('/static/:filename', function (req, res) {
  fs.readFile(__dirname+"/static/"+req.params.filename, function (err,data) {
    if (err) {
      res.send(JSON.stringify(err))
    }
    res.send(data)
  });
})
app.get('/favicon.ico', function (req, res) {
  res.send('no lol')
})
app.get('/:id', function (req, res) {
  console.log(req.params.id)
  let id = req.params.id
  ytdl.getInfo(id).then(info => {
    const json = JSON.stringify(info, null, 2)
    let obj = {
      video: true,
      info: info,
      description: wrapURLs(info.videoDetails.description)
    }
    res.send(writeViewer(obj))
  }).catch(err => {
    console.log("its all fucked up oh no lol")
    res.send(err)
  });
})
app.get('/', function (req, res) {
  const queryObject = url.parse(req.url,true).query
  res.send(writeHome())
})
app.listen(httpPort)
console.log("Listening on http://localhost:"+httpPort)
console.log("==============================")
stream.on('error', function(err) {
  if (JSON.stringify(err)!="{}") {
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
          let goTo = "/"+ele.value
          if (ele.value.startsWith("https://youtu.be/")) {
            goTo = "/"+ele.value.substring(17)
          }
          if (ele.value.startsWith("https://www.youtube.com/watch?v=")) {
            goTo = "/"+ele.value.substring(32)
          }
          window.location.href = goTo
        }
      }
      function search() {
        let ele = document.getElementById('linkInput');
        let goTo = "/"+ele.value
        if (ele.value.startsWith("https://youtu.be/")) {
          goTo = "/"+ele.value.substring(17)
        }
        if (ele.value.startsWith("https://www.youtube.com/watch?v=")) {
          goTo = "/"+ele.value.substring(32)
        }
        window.location.href = goTo
      }
    </script>
  </body>`
  return html
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
  html += `<p id="title">${data.info.videoDetails.title}</p>
           <p id="desc">${data.description}</p>
           </div>`

  data.info.related_videos.forEach(function(item, i) {
    let thumb = data.info.related_videos[i].thumbnails[data.info.related_videos[i].thumbnails.length-1].url
    html += `
      <a href="../pLZq3jgE6qA" class="vidBlobLink">
        <div class="vidBlob">
          <img id="thumb" src="${thumb}">
          <div id="metadata">
            <p id="title">${data.info.related_videos[i].title}</p>
            <p id="author">${data.info.related_videos[i].author.name}</p>
          </div>
        </div>
      </a>
    `
  });

  return html
}
