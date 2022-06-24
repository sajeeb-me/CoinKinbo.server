const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
        const paymentCollection = client.db("database").collection("payments");
        const userCollection = client.db("database").collection("users");

        // get
        app.get('/simple', async (req, res) => {
            const simple = await simpleCollection.find().toArray();
            res.send(simple)
        })



        //put
        app.put('/user/:email', async (req, res) => {
            const filter = req.params;
            const user = req.body;
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const secretToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '6h' });
            res.send({ result, secretToken })
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