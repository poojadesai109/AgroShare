
const express = require("express");
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Booking = require("../models/Booking");

const router = express.Router();

// Add a review for an approved and paid booking.
// A booking can receive only one review.
router.post("/", async (req, res) => {
    try {
        const {
            bookingId,
            farmerId,
            farmerName,
            rating,
            comment
        } = req.body;

        if (
            !bookingId ||
            !farmerId ||
            !farmerName ||
            rating === undefined ||
            !comment
        ) {
            return res.status(400).json({
                message: "Please provide all review details."
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(bookingId) ||
            !mongoose.Types.ObjectId.isValid(farmerId)
        ) {
            return res.status(400).json({
                message: "Invalid booking or farmer ID."
            });
        }

        const numericRating = Number(rating);
        const reviewComment = String(comment).trim();

        if (
            !Number.isInteger(numericRating) ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return res.status(400).json({
                message: "Rating must be a whole number from 1 to 5."
            });
        }

        if (reviewComment.length < 3 || reviewComment.length > 1000) {
            return res.status(400).json({
                message: "Review must contain 3 to 1000 characters."
            });
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found."
            });
        }

        if (String(booking.farmerId) !== String(farmerId)) {
            return res.status(403).json({
                message: "You cannot review another farmer's booking."
            });
        }

        if (booking.status !== "Approved") {
            return res.status(400).json({
                message: "Only approved bookings can be reviewed."
            });
        }

        if (booking.paymentStatus !== "Paid") {
            return res.status(400).json({
                message: "Please complete payment before reviewing."
            });
        }

        const existingReview = await Review.findOne({ bookingId });

        if (existingReview) {
            return res.status(409).json({
                message: "You have already reviewed this booking."
            });
        }

        const review = await Review.create({
            equipmentId: booking.equipmentId,
            bookingId: booking._id,
            farmerId: String(booking.farmerId),
            farmerName: String(booking.farmerName),
            rating: numericRating,
            comment: reviewComment
        });

        return res.status(201).json({
            message: "Review submitted successfully.",
            review
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "This booking has already been reviewed."
            });
        }

        console.error("Create review error:", error);

        return res.status(500).json({
            message: "Failed to submit review."
        });
    }
});

// Get reviews and average rating for one equipment item.
router.get("/equipment/:equipmentId", async (req, res) => {
    try {
        const { equipmentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
            return res.status(400).json({
                message: "Invalid equipment ID."
            });
        }

        const reviews = await Review.find({ equipmentId })
            .sort({ createdAt: -1 })
            .lean();

        const totalReviews = reviews.length;

        const averageRating = totalReviews
            ? Number(
                (
                    reviews.reduce((sum, review) => sum + review.rating, 0) /
                    totalReviews
                ).toFixed(1)
            )
            : 0;

        return res.json({
            equipmentId,
            averageRating,
            totalReviews,
            reviews
        });
    } catch (error) {
        console.error("Get reviews error:", error);

        return res.status(500).json({
            message: "Failed to fetch reviews."
        });
    }
});

module.exports = router;
