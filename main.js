var fs = require('fs');
var youtubedl = require('youtube-dl');
var ffmpeg = require('fluent-ffmpeg');
var bodyParser = require('body-parser');
var express = require('express');
var isWin = /^win/.test(process.platform);
var isLin = /^linux/.test(process.platform);

if (isWin) {
    ffmpeg.setFfmpegPath('bins/ffmpeg.exe');
} else if (isLin) {
    ffmpeg.setFfmpegPath('bins/ffmpeg');
}

var app = express();

app.use(express.static('static'));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.post('/trimVideo', function (req, res) {
    var url = req.body.element_1; // Doit être correctement formatée
    var timecode = req.body.element_2_1 + ':' + req.body.element_2_2 + ':' + req.body.element_2_3; // Format xx:yy:zz
    var duration = req.body.element_3; // En secondes
    console.log(url);
    console.log(timecode);
    console.log(duration);
    var video = youtubedl(url,
        ['--format=18'],
        { cwd: __dirname });

    video.on('info', function (info) {
        console.log('Download started');
        console.log('Filename: ' + info._filename);
        console.log('Size: ' + info.size);
    });
    var vidname = 'vids/temp-' + Math.floor(Math.random() * (9999 - 1) + 1).toString() + '.mp4';
    var stream = video.pipe(fs.createWriteStream(vidname));
    var name = 'vids/' + Math.floor(Math.random() * (9999 - 1) + 1).toString() + '.mp4';

    stream.on('finish', () => {
        console.log('Download Complete ');

        ffmpeg(vidname)
            .setStartTime(timecode)
            .setDuration(duration)
            .output(name)

            .on('end', function (err) {
                if (!err) {
                    console.log('Trim done');
                    res.download(name, 'video-finale.mp4');
                }

            })
            .on('error', function (err) {
                console.log('error: ', +err);
                res.status(500).send();

            }).run();
    });
});

app.listen(80);