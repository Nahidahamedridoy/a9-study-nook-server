const express = require('express');
const cors = require("cors");
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const products = [
  { id: 1, name: "laptop", price: 100 },
  { id: 2, name: "phone", price: 500 },
  { id: 3, name: "MacBook", price: 1500 },
]



// app.get('/products' , (req, res) =>{
//     res.send(products)
// })


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function server() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const db = client.db("study-nook");
    const detailsCollection = db.collection("details")

    app.get("/details", async (req, res) => {
      const cursor = detailsCollection.find();
      const result = await cursor.toArray();
      // console.log(result);

      res.send(result);
    });

    app.get("/details/:detailId", async (req, res) => {
      const detailId = req.params.detailId;

      const query = { _id: new ObjectId(detailId) }
      // console.log(query);

      const result = await detailsCollection.findOne(query);
      // console.log(result);
      res.send(result)
    });

    app.post("/details", async (req, res) => {
      // add details
      // console.log(req.body , "form body");
      const newDetails = req.body;
      const result = await detailsCollection.insertOne(newDetails);
      res.send(result)
      console.log(result);
    });

    app.delete("/details/:detailId", async(req, res) => {
        const detailId = req.params.detailId;
        // console.log(detailId);
        const query = { _id: new ObjectId(detailId) };
        const result = await detailsCollection.deleteOne(query);
        // console.log(result);
        res.send(result);
    })

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
server().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello , this is my first server!');
});

app.listen(port, () => {
  console.log(`server is running on ${port}`);
});