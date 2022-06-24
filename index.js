const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9febz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const simpleCollection = client.db("database").collection("simple");

        // get items
        app.get('/simple', async (req, res) => {
            const simple = await simpleCollection.find().toArray();
            res.send(simple)
        })
    }
    catch (error) {
        console.log(error);
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello from CoinKinbo!')
})

app.listen(port, () => {
    console.log(`CoinKinbo is listening on port ${port}`)
})