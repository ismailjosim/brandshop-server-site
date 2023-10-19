require('colors');
require('dotenv').config()
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');


const app = express();
const cors = require('cors');

const port = process.env.PORT || 5000;



app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${ process.env.DB_USER }:${ process.env.DB_PASS }@cluster0.s9x13go.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const dbConnect = async () => {
    try {
        client.connect();
        console.log("MovieDB Connected Successfully✅".red.bold);

    } catch (error) {
        console.log(error.name, error.message);
    }
}
dbConnect();


// all database collection
const db = client.db("movieDB");
const moviesCollection = db.collection('movies');

// default route
app.get('/', (req, res) => {
    res.send("<h2 style='text-align: center; margin-top: 1rem;'>MovieDB Server Running 🚩</h2>");
});

/* Movies Routes goes here*/

// Get All Movies
app.get("/movies", async (_, res) => {
    try {

        const movies = await moviesCollection.find({}).toArray();
        res.send({
            status: true,
            data: movies
        })

    } catch (error) {
        res.send({
            status: true,
            error: error.message
        })
    }
})




app.listen(port, () => {
    console.log(`DB Server Running on Port:${ port }📥`.cyan.bold);
},)

