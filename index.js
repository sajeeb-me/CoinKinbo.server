const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9febz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    // console.log(authHeader);
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    // console.log('token', token);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            // console.log(err)
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next()
    })
}

async function run() {
    try {
        await client.connect();
        const orderCollection = client.db("database").collection("orders");
        const userCollection = client.db("database").collection("users");

        // verifyAdmin 
        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester })
            if (requesterAccount.role === 'admin') {
                next();
            }
            else {
                res.status(403).send({ message: 'Forbidden access' })
            }
        }

        // get
        app.get('/order', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const query = { email }
            const order = (await orderCollection.find(query).toArray()).reverse();
            res.send(order)
        })

        app.get('/all-order', verifyJWT, verifyAdmin, async (req, res) => {
            const simple = await orderCollection.find().toArray();
            res.send(simple)
        })

        app.get('/user', verifyJWT, verifyAdmin, async (req, res) => {
            const user = await userCollection.find().toArray()
            res.send(user)
        })

        app.get('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params;
            const user = await userCollection.findOne(email);
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })

        // post
        app.post('/order', verifyJWT, async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result)
        })

        app.post("/create-payment-intent", verifyJWT, async (req, res) => {
            const { price } = req.body;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card']
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })

        // put
        app.put('/user/:email', async (req, res) => {
            const filter = req.params;
            const user = req.body;
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const secretToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '6h' });
            res.send({ result, secretToken })
        })

        // patch
        app.patch('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
            const filter = req.params;
            const updateDoc = {
                $set: { role: 'admin' }
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result)
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