// Run with: node convert-server.js
// Receives WebM blobs from the capture page, converts to MP4 via ffmpeg, returns MP4.
const http  = require('http');
const { execFile } = require('child_process');
const fs    = require('fs');
const path  = require('path');
const os    = require('os');

const PORT  = 9001;
const FFMPEG = '/opt/homebrew/bin/ffmpeg';

const server = http.createServer(function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Filename');

  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (req.method !== 'POST' || req.url !== '/convert') {
    res.writeHead(404); return res.end('not found');
  }

  var filename = (req.headers['x-filename'] || 'session.webm').replace(/[^a-z0-9._-]/gi, '_');
  var outName  = filename.replace(/\.webm$/i, '.mp4');
  var tmpIn    = path.join(os.tmpdir(), filename);
  var tmpOut   = path.join(os.tmpdir(), outName);
  var chunks   = [];

  req.on('data', function (chunk) { chunks.push(chunk); });
  req.on('end', function () {
    fs.writeFileSync(tmpIn, Buffer.concat(chunks));
    execFile(FFMPEG, [
      '-y', '-i', tmpIn,
      '-c:v', 'libx264', '-preset', 'fast',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      tmpOut
    ], function (err, stdout, stderr) {
      fs.unlinkSync(tmpIn);
      if (err) {
        console.error('ffmpeg error:', stderr);
        res.writeHead(500); return res.end('ffmpeg failed: ' + stderr);
      }
      var mp4 = fs.readFileSync(tmpOut);
      fs.unlinkSync(tmpOut);
      res.writeHead(200, {
        'Content-Type':        'video/mp4',
        'Content-Disposition': 'attachment; filename="' + outName + '"',
        'Content-Length':      mp4.length
      });
      res.end(mp4);
      console.log('Converted → ' + outName + ' (' + (mp4.length / 1024 / 1024).toFixed(1) + ' MB)');
    });
  });
});

server.listen(PORT, function () {
  console.log('Converter ready at http://localhost:' + PORT);
  console.log('Open http://localhost:8080/lab/open-capture/ and click Record All');
});
