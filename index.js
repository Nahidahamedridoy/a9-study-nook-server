const express = require('express');
const cors = require("cors");
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
const uri = process.env.DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS = createRemoteJWKSet(
  new URL("http://localhost:3000/api/auth/jwks")
)

const verifyToken = async(req, res, next) => {
  const authHeader = req?.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: "unauthorized" });
  }
  // console.log(authHeader);
  const token = authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS)
    console.log({payload});
    next()
  } catch (error) {
    console.log(error);
    return res.status(403).json({message:"Forbidden"});
  }

};

async function server() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const db = client.db("study-nook");
    const detailsCollection = db.collection("details")
    const bookingCollection = db.collection("bookings")


    //search
    app.get("/details", async (req, res) => {

      const search = req.query.search;

      const amenities = req.query.amenities;

      const minPrice = parseInt(req.query.minPrice);

      const maxPrice = parseInt(req.query.maxPrice);

      const limit = parseInt(req.query.limit);

      let query = {};

      // Search
      if (search) {

        query.roomName = {
          $regex: search,
          $options: "i",
        };

      }

      // Amenities
      if (amenities) {

        query.amenities = {
          $in: amenities.split(","),
        };

      }

      // Price Range
      if (minPrice || maxPrice) {

        query.hourlyRate = {};

        if (minPrice) {
          query.hourlyRate.$gte = minPrice;
        }

        if (maxPrice) {
          query.hourlyRate.$lte = maxPrice;
        }

      }

      // Mongo Query
      let cursor = detailsCollection
        .find(query)
        .sort({ _id: -1 });

      // Limit
      if (limit) {

        cursor = cursor.limit(limit);

      }

      const result = await cursor.toArray();

      res.send(result);
    });

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

    //middleWare
    app.get("/details/:detailId", verifyToken, async (req, res) => {
      const detailId = req.params.detailId;

      const query = { _id: new ObjectId(detailId) }
      // console.log(query);

      const result = await detailsCollection.findOne(query);
      // console.log(result);
      res.send(result)
    });

    app.post("/details",  async (req, res) => {
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

    app.delete("/details/:detailId", verifyToken, async (req, res) => {
      const detailId = req.params.detailId;
      // console.log(detailId);
      const query = { _id: new ObjectId(detailId) };
      const result = await detailsCollection.deleteOne(query);
      // console.log(result);
      res.send(result);
    });

    app.get("/booking/:userId", async (req, res) => {
      const { userId } = req.params

      const result = await bookingCollection.find({ userId: userId }).toArray();
      res.json(result)
    })

    app.post("/booking", async (req, res) => {
      try {
        const bookingData = req.body;

        const existingBooking = await bookingCollection.findOne({
          roomId: bookingData.roomId,
          bookingDate: bookingData.bookingDate,
          bookingTime: bookingData.bookingTime,
        });

        if (existingBooking) {
          return res.status(409).json({
            success: false,
            message: "this room are already booked",
          });
        }

        const result = await bookingCollection.insertOne(bookingData);

        res.status(201).json({
          success: true,
          message: "booking successful",
          insertedId: result.insertedId,
        });

      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    });

    app.delete("/booking/:bookingId", async (req, res) => {
      const { bookingId } = req.params;
      const result = await bookingCollection.deleteOne({ _id: new ObjectId(bookingId) })

      res.json(result)
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