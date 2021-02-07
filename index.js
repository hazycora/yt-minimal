const http = require("http")
const host = 'localhost'
const port = 3002

const requestListener = function (req, res) {
    res.writeHead(200)
    res.end("Site initialized!")
}

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`)
})
