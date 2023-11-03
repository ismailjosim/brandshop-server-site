require('colors')
const express = require('express')
require('dotenv').config()
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

const app = express()

const port = process.env.PORT || 5000
const jwtSecret = process.env.ACCESS_TOKEN_SECRET

app.use(
    cors({
        origin: ['http://localhost:5173', 'https://enmmedia-19300.web.app'],
        credentials: true,
    }),
)
// app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json())
app.use(cookieParser())

// middleware
const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token

    if (!token) {
        return res.status(401).send('Unauthorized access')
    }
    jwt.verify(token, jwtSecret, (error, decoded) => {
        if (error) {
            return res.status(403).send({
                message: 'forbidden access',
            })
        }
        req.decoded = decoded
        next()
    })
}

const uri = `mongodb+srv://${ process.env.DB_USER }:${ process.env.DB_PASS }@cluster0.s9x13go.mongodb.net/?retryWrites=true&w=majority`

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
})

const dbConnect = async () => {
    try {
        client.connect()
        console.log('DB Connected Successfully✅')
    } catch (error) {
        console.log(error.name, error.message)
    }
}
dbConnect()

// all database collection
const db = client.db('movieDB')
const brandsCollection = db.collection('brands')
const moviesCollection = db.collection('movies')
const cartCollection = db.collection('cart')
const userCollection = db.collection('user')

// default route
app.get('/', (req, res) => {
    res.send(
        "<h2 style='text-align: center; margin-top: 1rem;'>MovieDB Server Running 🚩</h2>",
    )
})

// auth jwt info
app.post('/jwt', async (req, res) => {
    try {
        const user = req.body
        // console.log(user)
        const token = jwt.sign(user, jwtSecret, {
            expiresIn: '1d',
        })
        res
            .cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Set to true in production
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // Adjust based on your requirements
                // maxAge: // how much time the cookie will exist
            })
            .send({
                status: true,
            })
    } catch (error) {
        res.send({
            status: true,
            error: error.message,
        })
    }
})

app.post('/logout', async (req, res) => {
    const user = req.body
    res.clearCookie(
        "token",
        {
            maxAge: 0,
            secure: process.env.NODE_ENV === "production" ? true : false,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        }
    )
        .send({ status: true })
})

/* Brands Route */
app.get('/brands', async (req, res) => {
    try {
        const brands = await brandsCollection.find({}).toArray()
        res.send({
            status: true,
            data: brands,
        })
    } catch (error) {
        res.send({
            status: true,
            error: error.message,
        })
    }
})

/* Movies Routes goes here*/
app.get('/movies', async (req, res) => {
    try {
        const query = {}
        const page = parseInt(req.query.page)
        const size = parseInt(req.query.size)

        const cursor = moviesCollection.find(query)

        const movies = await cursor
            .skip(page * size)
            .limit(size)
            .toArray()

        res.send({
            status: true,
            data: movies,
        })
    } catch (error) {
        res.send({
            status: true,
            error: error.message,
        })
    }
})

app.delete('/delete_movies/:id', async (req, res) => {
    try {
        const id = req.params.id
        const query = { _id: new ObjectId(id) }
        const movie = await moviesCollection.deleteOne(query)
        res.send({
            status: true,
            data: movie,
        })
    } catch (error) {
        res.send({
            status: true,
            error: error.message,
        })
    }
})

app.get('/movies/:brand', async (req, res) => {
    try {
        const brandName = req.params.brand
        const query = { brand: brandName }
        const movies = await moviesCollection.find(query).toArray()

        res.send({
            status: true,
            data: movies,
        })
    } catch (error) {
        res.send({
            status: true,
            error: error.message,
        })
    }
})

app.get('/singleMovie/:id', async (req, res) => {
    try {
        const id = req.params.id
        const query = { _id: new ObjectId(id) }
        const singleMovie = await moviesCollection.findOne(query)

        res.send({
            status: true,
            data: singleMovie,
        })
    } catch (error) {
        res.send({
            status: true,
            error: error.message,
        })
    }
})

app.post('/add_movie', async (req, res) => {
    try {
        const movie = req.body
        const result = await moviesCollection.insertOne(movie)
        res.send({
            status: true,
            data: result,
        })
    } catch (error) {
        res.send({
            status: true,
            error: error.message,
        })
    }
})

app.put('/update_movie/:id', async (req, res) => {
    try {
        const id = req.params.id
        const movie = req.body
        const filter = { _id: new ObjectId(id) }
        const options = { upsert: true }
        const updateMovie = {
            $set: {
                name: movie.name,
                image: movie.image,
                brand: movie.brand,
                type: movie.type,
                details: movie.details,
                ticketPrice: movie.ticketPrice,
                rating: movie.rating,
            },
        }
        const result = await moviesCollection.updateOne(
            filter,
            updateMovie,
            options,
        )
        res.send({
            status: true,
            data: result,
        })
    } catch (error) {
        res.send({
            status: true,
            error: error.message,
        })
    }
})

app.post('/booking', async (req, res) => {
    try {
        const movie = req.body
        const result = await cartCollection.insertOne(movie)

        res.send({
            status: true,
            data: result,
        })
    } catch (error) {
        res.send({
            status: true,
            error: error.message,
        })
    }
})

// cart routes
app.get('/cart', verifyToken, async (req, res) => {
    try {
        // console.log("inside booking cart", req.decoded)
        const email = req.query.email
        if (!email) {
            res.send([])
        }
        // check valid user
        const decodedEmail = req.decoded.email
        if (email !== decodedEmail) {
            res.status(403).send({ message: 'Forbidden Access' })
        }
        const query = { email: email }
        const carts = await cartCollection.find(query).toArray()

        res.send({
            status: true,
            data: carts,
        })
    } catch (error) {
        res.send({
            status: true,
            error: error.message,
        })
    }
})



// Delete single Cart Item
app.delete('/delete_cart/:id', async (req, res) => {
    try {
        const id = req.params.id

        const query = { _id: new ObjectId(id) }
        const cart = await cartCollection.deleteOne(query)
        res.send({
            status: true,
            data: cart,
        })
    } catch (error) {
        res.send({
            status: true,
            error: error.message,
        })
    }
})

// users routes
app.get('/users', async (req, res) => {
    try {
        const users = await userCollection.find({}).toArray()
        res.send({
            status: true,
            data: users,
        })
    } catch (error) {
        res.send({
            status: true,
            error: error.message,
        })
    }
})


app.get('/user/:email', async (req, res) => {
    try {
        const email = req.params.email
        const query = { email: email }
        const result = await userCollection.find(query)
        res.send({
            status: true,
            data: result,
        })
    } catch (error) {
        res.send({
            status: true,
            error: error.message,
        })
    }
})


app.post('/users', async (req, res) => {
    try {
        const user = req.body
        const query = { email: user.email }

        const matchedUser = await userCollection.findOne(query)
        if (matchedUser) {
            // User with the same email already exists
            res.send({
                status: false,
                error: 'User with this email already exists',
            })
        } else {
            // User does not exist, so insert the new user
            const result = await userCollection.insertOne(user)
            res.send({
                status: true,
                data: result,
            })
        }
    } catch (error) {
        res.send({
            status: true,
            error: error.message,
        })
    }
})

app.listen(port, () => {
    console.log(`DB Server Running on Port:${ port }📥`.cyan.bold)
})
