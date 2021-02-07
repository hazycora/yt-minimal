const http = require('http')
const url = require('url')
const ytdl = require('ytdl-core')

http.createServer(function (req, res) {
  const queryObject = url.parse(req.url,true).query
  console.log("Request for: \n"+JSON.stringify(queryObject, null, 2))

  if(queryObject.v==undefined) {
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.end('UNFINISHED!!')
  }else{
    ytdl.getInfo(queryObject.v).then(info => {
      const json = JSON.stringify(info, null, 2)
      console.log(json)
      res.writeHead(200, {'Content-Type': 'text/html'})
      res.end(info.videoDetails.title)
    })
  }
}).listen(3002)
