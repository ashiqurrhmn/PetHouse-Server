const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const cors = require('cors');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');

dotenv.config();
const app = express()
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;



const uri = process.env.MONGO_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS = createRemoteJWKSet(new URL("http://localhost:3000/api/auth/jwks"));

const verifyToken = async (req, res, next) => {
    const authHeader = req?.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }

    try{
      const {payload} = await jwtVerify(token, JWKS )
    console.log(payload);
    next();
    }
    catch(error){
        return res.status(401).send({ message: 'Unauthorized access' });
    }
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const db = client.db('pethouse');
    const petsCollection = db.collection('animals');

    app.get('/pets', async (req, res) => {
        const cursor = petsCollection.find();
        const result = await cursor.toArray();
        res.send(result);

    });

    app.get('/pets/:petId', verifyToken, async (req, res) => {
         const {petId} = req.params;
        const query = { _id: new ObjectId(petId)};
        const result = await petsCollection.findOne(query);
        res.send(result);
    });

    app.get('/featured', async (req, res) => {
        const cursor = petsCollection.find().limit(6);
        const result = await cursor.toArray();
        res.send(result);

    });

    app.post('/pets', async (req, res) => {
        const pet = req.body;
        const result = await petsCollection.insertOne(pet);
        res.json(result);
    });




    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
