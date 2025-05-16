const fs = require("fs");
const http = require("http");
const path = require("path");

const port = 3000;

const server = http.createServer((req, res) => {
  if (req.url !== "/video") {
    const pageNotFound = path.join(__dirname, "not-found.html");

    fs.readFile(pageNotFound, (error, data) => {
      if (error) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("File not found");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
    return;
  }

  const videoPath = path.join(__dirname, "public/video.mp4");

  if (!fs.existsSync(videoPath)) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Video not found");
    return;
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (!range) {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(videoPath).pipe(res);
    return;
  }

  const parts = range.replace(/bytes=/, "").split("-");
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

  if (start >= fileSize || end >= fileSize) {
    res.writeHead(416, {
      "Content-Range": `bytes */${fileSize}`,
    });
    res.end();
    return;
  }

  const chunkSize = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunkSize,
    "Content-Type": "video/mp4",
  };

  res.writeHead(206, headers);
  const videoStream = fs.createReadStream(videoPath, { start, end });
  videoStream.pipe(res);
});

server.listen(port, () => console.log(`Server running on port: ${port}`));
