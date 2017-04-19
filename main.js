var fs = require('fs');
var youtubedl = require('youtube-dl');
var ffmpeg = require('fluent-ffmpeg');
var bodyParser = require('body-parser');
var express = require('express');
var isWin = /^win/.test(process.platform);
var isLin = /^linux/.test(process.platform);
var timeout = require('connect-timeout');
var child_process = require('child_process');

if (isWin) {
    ffmpeg.setFfmpegPath('bins/ffmpeg.exe');
} else if (isLin) {
    // Ensure chmod
    fs.chmodSync('bins/ffmpeg', 0755);
    ffmpeg.setFfmpegPath('bins/ffmpeg');
} //Heroku would need this tbh

var app = express();

app.use(express.static('static'));

app.use(timeout('2m'));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.post('/trimVideo', function (req, res) {
    var url = req.body.element_1; // Doit être correctement formatée
    var timecode = req.body.element_2_1 + ':' + req.body.element_2_2 + ':' + req.body.element_2_3; // Format xx:yy:zz
    var duration = (req.body.element_3_1 - req.body.element_2_1) * 3600 + (req.body.element_3_2 - req.body.element_2_2) * 60 + (req.body.element_3_3 - req.body.element_2_3); //En secondes
    console.log(url);
    console.log(timecode);
    console.log(duration);
    var video = youtubedl(url,
        ['--format=43'],
        { cwd: __dirname });

    video.on('info', function (info) {
        console.log('Download started');
        console.log('Filename: ' + info._filename);
        console.log('Size: ' + info.size);
    });
    res.writeHead(200,{
        'Content-Type':'application/force-download',
        "Content-Transfer-Encoding": "binary",
        'Content-Disposition': 'attachment; filename="video-finale.mp4"'
    })
    var vidname = 'vids/temp-' + Math.floor(Math.random() * (9999 - 1) + 1).toString() + '.flv';
    var stream = video.pipe(fs.createWriteStream(vidname));
    
    stream.on('finish', () => {
        console.log('Download Complete ');

        ffmpeg(vidname)
            .setStartTime(timecode)
            .setDuration(duration)
            .format('avi')
            .on('end', function (err) {
                if (!err) {
                    console.log('Trim done');
                    res.end;
                } else {
                    res.send(500);
                }
            })
            .on('error', function (err) {
                console.log('error: ', +err);
                res.status(500).send();

            }).pipe(res, {end:true});
    });
});



app.listen(process.env.PORT || 80);
