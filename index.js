const express = require('express');
const cors = require("cors");
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());


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

    // app.get("/details", async (req, res) => {
    //   const cursor = detailsCollection.find();
    //   const result = await cursor.toArray();
    //   // console.log(result);

    //   res.send(result);
    // });

    // //  sorting 
    app.get("/details", async (req, res) => {
      const limit = parseInt(req.query.limit);

      let query = detailsCollection.find().sort({ _id: -1 });
      if (limit) {
        query = query.limit(limit);
      }
      const result = await query.toArray();
      console.log(result);
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

    app.patch("/details/:detailId", async (req, res) => {
      const { detailId } = req.params;
      const updatedData = req.body;
      // console.log(detailId , updatedData);
      const filter = { _id: new ObjectId(detailId) };
      const updatedDoc = {
        $set: {
          ...updatedData
        },
      };
      const result = await detailsCollection.updateOne(filter, updatedDoc);
      res.send(result);
      console.log(result);
    });

    app.delete("/details/:detailId", async (req, res) => {
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