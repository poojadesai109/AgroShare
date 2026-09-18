
const express = require("express");
const router = express.Router();

const Equipment = require("../models/Equipment");


// =====================================================
// GET EQUIPMENT RECOMMENDATIONS
// =====================================================

router.post("/", async (req, res) => {

    try {

        const {
            crop,
            landSize,
            equipmentType,
            location,
            budget
        } = req.body;


        // Validate required fields
        if (
            !crop ||
            !landSize ||
            !equipmentType ||
            !location ||
            !budget
        ) {

            return res.status(400).json({
                message: "All recommendation fields are required"
            });

        }


        const budgetNumber = Number(budget);


        if (isNaN(budgetNumber) || budgetNumber <= 0) {

            return res.status(400).json({
                message: "Budget must be a valid positive number"
            });

        }


        // =====================================================
        // FIND AVAILABLE EQUIPMENT
        // =====================================================

        const equipment = await Equipment.find({

            availability: true,

            type: {
                $regex: `^${equipmentType}$`,
                $options: "i"
            },

            pricePerDay: {
                $lte: budgetNumber
            }

        });


        // =====================================================
        // RANK EQUIPMENT
        // =====================================================

        const rankedEquipment = equipment.map((item) => {

            let score = 0;


            // Location match
            if (
                item.location &&
                item.location.toLowerCase() ===
                location.toLowerCase()
            ) {

                score += 3;

            }


            // Partial location match
            else if (
                item.location &&
                (
                    item.location
                        .toLowerCase()
                        .includes(location.toLowerCase()) ||

                    location
                        .toLowerCase()
                        .includes(item.location.toLowerCase())
                )
            ) {

                score += 2;

            }


            // Lower price gets a small advantage
            if (item.pricePerDay <= budgetNumber) {

                score += 1;

            }


            return {
                ...item.toObject(),
                recommendationScore: score
            };

        });


        // Highest score first
        rankedEquipment.sort(
            (a, b) =>
                b.recommendationScore -
                a.recommendationScore
        );


        res.json({

            message: "Recommendations generated successfully",

            searchCriteria: {
                crop,
                landSize,
                equipmentType,
                location,
                budget: budgetNumber
            },

            recommendations: rankedEquipment

        });


    } catch (error) {

        console.error(
            "Recommendation error:",
            error
        );


        res.status(500).json({

            message: "Failed to generate recommendations",

            error: error.message

        });

    }

});


module.exports = router;