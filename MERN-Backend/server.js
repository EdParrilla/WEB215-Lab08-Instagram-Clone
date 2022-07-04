import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import Pusher from 'pusher';
import dbModel from './dbModel.js';

// App config
const app = express();
const port = process.env.PORT || 8080;

const pusher = new Pusher({
  appId: "1431711",
  key: "ebd8905848b54f16d86d",
  secret: "7959ebc32d960e162c9f",
  cluster: "us2",
  useTLS: true
});

//middleware
app.use(express.json());
app.use(cors());

// DB config
const connection_url = 'mongodb+srv://eparrillaDB:Ba53DataMDB@cluster0.zkfonbn.mongodb.net/instaDB?retryWrites=true&w=majority';
mongoose.connect(connection_url,{
    useNewUrlParser: true
    //useCreateIndex: true,
    //useUniviedTopology: true
});

mongoose.connection.once('open', () => {
    console.log('DB connected');

    const changeStream = mongoose.connection.collection('posts').watch();

    changeStream.on('change', (change) => {
        console.log('Change  Triggered  pusher ..');
        console.log(change);
        console.log('End of change');

        if (change.operationType ===  'insert') {
            console.log('Triggering Pusher *** IMG Upload ***');

            const postDetails = change.fullDocument;
            pusher.trigger('posts', 'inserted', {
                user: postDetails.user,
                caption:  postDetails.caption,
                image: postDetails.image,
            } );
        } else {
            console.log('Uknonw  triggering from Pusher');
        }
    });

});

// api routes
app.get('/', (req, res) => res.status(200).send('Hello World'));

app.post('/upload', (req, res) => {
    const body = req.body;

    dbModel.create(body, (err, data) => {
        if(err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    });
});

app.get('/sync', (req, res) => {
    dbModel.find((err, data) => {
        if(err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});

// listener
app.listen(port, () => console.log(`listening on localhost:${port}`));
