require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Equipment = require("./models/Equipment");
const User = require("./models/User");
const Booking = require("./models/Booking");
const recommendationRoutes = require("./routes/recommendationRoutes");
const multer = require("multer");
const cloudinary = require("./config/cloudinary");

const app = express();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use("/api/recommendations", recommendationRoutes);

// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {
    res.send("Smart Agricultural Equipment Sharing System Backend is running!");
});


// =====================================================
// EQUIPMENT
// =====================================================

// Add new equipment
app.post("/api/equipment", upload.single("image"), async (req, res) => {
    try {

        let imageUrl = "";

        if (req.file) {

            const result = await new Promise((resolve, reject) => {

                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "agroshare-equipment"
                    },
                    (error, result) => {

                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }

                    }
                );

                stream.end(req.file.buffer);

            });

            imageUrl = result.secure_url;
        }

        const equipment = new Equipment({
            name: req.body.name,
            type: req.body.type,
            description: req.body.description,
            owner: req.body.owner,
            location: req.body.location,
            pricePerDay: req.body.pricePerDay,
            availability: req.body.availability,
            imageUrl: imageUrl
        });

        const savedEquipment = await equipment.save();

        res.status(201).json(savedEquipment);

    } catch (error) {

        console.error("Equipment upload error:", error);

        res.status(400).json({
            message: "Failed to add equipment",
            error: error.message
        });

    }
});
// Get all equipment
app.get("/api/equipment", async (req, res) => {
    try {

        const equipment = await Equipment.find();

        res.json(equipment);

    } catch (error) {

        res.status(500).json({
            message: "Failed to fetch equipment",
            error: error.message
        });

    }
});


// Get equipment count for a farmer
app.get("/api/equipment/count/:owner", async (req, res) => {
    try {

        const owner = req.params.owner;

        const count = await Equipment.countDocuments({
            owner: owner
        });

        res.json({
            count: count
        });

    } catch (error) {

        res.status(500).json({
            message: "Failed to fetch equipment count",
            error: error.message
        });

    }
});


// =====================================================
// USER REGISTRATION
// =====================================================

// Register new user
app.post("/api/register", async (req, res) => {
    try {

        const {
            name,
            email,
            phone,
            location,
            password
        } = req.body;


        if (
            !name ||
            !email ||
            !phone ||
            !location ||
            !password
        ) {

            return res.status(400).json({
                message: "All fields are required"
            });

        }


        const existingUser = await User.findOne({
            email: email
        });


        if (existingUser) {

            return res.status(400).json({
                message: "User with this email already exists"
            });

        }


        const user = new User({
            name,
            email,
            phone,
            location,
            password
        });


        const savedUser = await user.save();


        res.status(201).json({

            message: "Registration successful",

            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
                phone: savedUser.phone,
                location: savedUser.location
            }

        });


    } catch (error) {

        console.error("Registration error:", error);

        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });

    }
});


// =====================================================
// USER LOGIN
// =====================================================

// Login user
app.post("/api/login", async (req, res) => {
    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({
                message: "Email and password are required"
            });

        }


        const user = await User.findOne({
            email: email
        });


        if (!user) {

            return res.status(401).json({
                message: "Invalid email or password"
            });

        }


        if (user.password !== password) {

            return res.status(401).json({
                message: "Invalid email or password"
            });

        }


        res.json({

            message: "Login successful",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                location: user.location
            }

        });


    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            message: "Login failed",
            error: error.message
        });

    }
});


// =====================================================
// BOOKINGS
// =====================================================


// Create new booking
app.post("/api/bookings", async (req, res) => {

    try {

        const {
            equipmentId,
            equipmentName,
            farmerId,
            farmerName,
            owner,
            location,
            date,
            pricePerDay
        } = req.body;


        if (
            !equipmentId ||
            !farmerId ||
            !farmerName ||
            !equipmentName ||
            !owner ||
            !location ||
            !date ||
            pricePerDay === undefined
        ) {

            return res.status(400).json({
                message: "All booking details are required"
            });

        }


        const booking = new Booking({

            equipmentId,
            equipmentName,
            farmerId,
            farmerName,
            owner,
            location,
            date,
            pricePerDay,

            status: "Pending"

        });


        const savedBooking = await booking.save();


        res.status(201).json({

            message: "Booking request sent successfully",

            booking: savedBooking

        });


    } catch (error) {

        console.error("Booking error:", error);

        res.status(500).json({

            message: "Failed to create booking",

            error: error.message

        });

    }

});


// -----------------------------------------------------
// IMPORTANT:
// Specific booking routes MUST come before :farmerId
// -----------------------------------------------------


// Get booking requests for equipment owner
app.get("/api/bookings/owner/:owner", async (req, res) => {

    try {

        const bookings = await Booking.find({

            owner: req.params.owner

        }).sort({
            _id: -1
        });


        res.json(bookings);


    } catch (error) {

        res.status(500).json({

            message: "Failed to fetch owner booking requests",

            error: error.message

        });

    }

});


// Get total bookings count for a farmer
app.get("/api/bookings/count/:farmerId", async (req, res) => {

    try {

        const count = await Booking.countDocuments({

            farmerId: req.params.farmerId

        });


        res.json({

            count: count

        });


    } catch (error) {

        res.status(500).json({

            message: "Failed to fetch booking count",

            error: error.message

        });

    }

});


// Get pending booking requests count for equipment owner
app.get("/api/bookings/pending-count/:owner", async (req, res) => {

    try {

        const count = await Booking.countDocuments({

            owner: req.params.owner,

            status: "Pending"

        });


        res.json({

            count: count

        });


    } catch (error) {

        console.error(
            "Pending count error:",
            error
        );


        res.status(500).json({

            message:
                "Failed to fetch pending requests count",

            error: error.message

        });

    }

});


// Update booking status
// Accept or Reject
app.put("/api/bookings/:bookingId/status", async (req, res) => {

    try {

        const {
            status
        } = req.body;


        if (
            !["Approved", "Rejected"].includes(status)
        ) {

            return res.status(400).json({

                message: "Invalid booking status"

            });

        }


        const booking =
            await Booking.findByIdAndUpdate(

                req.params.bookingId,

                {
                    status: status
                },

                {
                    new: true
                }

            );


        if (!booking) {

            return res.status(404).json({

                message: "Booking not found"

            });

        }


        res.json({

            message:
                `Booking ${status.toLowerCase()} successfully`,

            booking: booking

        });


    } catch (error) {

        console.error(
            "Booking status error:",
            error
        );


        res.status(500).json({

            message:
                "Failed to update booking status",

            error: error.message

        });

    }

});


// Get bookings of a farmer
// THIS MUST BE LAST
app.get("/api/bookings/:farmerId", async (req, res) => {

    try {

        const bookings = await Booking.find({

            farmerId: req.params.farmerId

        }).sort({
            _id: -1
        });


        res.json(bookings);


    } catch (error) {

        res.status(500).json({

            message:
                "Failed to fetch bookings",

            error: error.message

        });

    }

});
// Get total earnings from approved bookings for equipment owner
app.get("/api/bookings/earnings/:owner", async (req, res) => {
    try {

        const result = await Booking.aggregate([
            {
                $match: {
                    owner: req.params.owner,
                    status: "Approved"
                }
            },
            {
                $group: {
                    _id: null,
                    totalEarnings: {
                        $sum: "$pricePerDay"
                    }
                }
            }
        ]);

        const totalEarnings =
            result.length > 0
                ? result[0].totalEarnings
                : 0;

        res.json({
            totalEarnings: totalEarnings
        });

    } catch (error) {

        console.error("Earnings error:", error);

        res.status(500).json({
            message: "Failed to calculate earnings",
            error: error.message
        });

    }
});


// =====================================================
// CONNECT TO MONGODB
// =====================================================

mongoose.connect(process.env.MONGO_URI)

    .then(() => {

        console.log(
            "MongoDB connected successfully"
        );


        app.listen(PORT, () => {

            console.log(
                `Server running on http://localhost:${PORT}`
            );

        });

    })

    .catch((error) => {

        console.error(
            "MongoDB connection failed:",
            error
        );

    });