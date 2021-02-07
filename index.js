const http = require('http')
const url = require('url')
const ytdl = require('ytdl-core')
const fs = require('fs')
const pug = require('pug')

http.createServer(function (req, res) {
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
    const queryObject = url.parse(req.url,true).query
    console.log("Request for: \n"+JSON.stringify(queryObject, null, 2))

    if(queryObject.v==undefined) {
      res.writeHead(200, {'Content-Type': 'text/html'})
      res.end('UNFINISHED!!')
    }else{
      ytdl.getInfo(queryObject.v).then(info => {
        const json = JSON.stringify(info, null, 2)

        let format = ytdl.chooseFormat(info.formats, { quality: '18' })
        console.log('Format found!')

        res.writeHead(200, {'Content-Type': 'text/html'})

        let html = pug.renderFile('player.pug', {
          format: format,
          info: info,
          query: queryObject
        })
        res.end(html)
      })
    }
  }
}).listen(3002)
