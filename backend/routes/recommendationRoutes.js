const express = require("express");
const router = express.Router();

const Equipment = require("../models/Equipment");

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

        // Map Decision Support types to actual equipment types
        const typeMap = {
            Tractor: ["Tractor"],
            Harvester: ["Harvester"],
            Tillage: ["Tillage", "Tillage Equipment", "Rotavator"],
            Irrigation: ["Irrigation", "Irrigation Equipment"]
        };

        const matchingTypes = typeMap[equipmentType] || [equipmentType];

        // Find available equipment within budget
        const equipment = await Equipment.find({
            availability: true,

            type: {
                $in: matchingTypes.map(
                    type => new RegExp(`^${type}$`, "i")
                )
            },

            pricePerDay: {
                $lte: budgetNumber
            }
        });

        // Rank equipment
        const rankedEquipment = equipment.map((item) => {

            let score = 0;

            // Exact location match
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

            // Within budget
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

        console.error("Recommendation error:", error);

        res.status(500).json({
            message: "Failed to generate recommendations",
            error: error.message
        });
    }
});

module.exports = router;