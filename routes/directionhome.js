const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const pool = require("../db");
const verifyAdmin = require('./../middleware/verify')
router.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM home");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Serverda xatolik yuz berdi" });
    }
});

router.post("/", verifyAdmin, async (req, res) => {
    try {
        const { title_uz, title_ru, title_eng, title_qq, description_uz, description_ru, description_eng, description_qq } = req.body;

        if (description_uz.length > 150 || description_ru.length > 150 || description_eng.length > 150 || description_qq.length > 150) {
            return res.status(400).json({ message: "Tavsif 150 belgidan oshmasligi kerak" });
        }

        const id = uuidv4();
        await pool.query(
            "INSERT INTO home (id, title_uz, title_ru, title_eng, title_qq, description_uz, description_ru, description_eng, description_qq) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            [id, title_uz, title_ru, title_eng, title_qq, description_uz, description_ru, description_eng, description_qq]
        );

        res.status(201).json({ message: "Yo‘nalish qo‘shildi" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Serverda xatolik yuz berdi" });
    }
});

// PUT - Adminlar uchun
router.put("/:id", verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title_uz, title_ru, title_eng, title_qq, description_uz, description_ru, description_eng, description_qq } = req.body;

        if (description_uz.length > 150 || description_ru.length > 150 || description_eng.length > 150 || description_qq.length > 150) {
            return res.status(400).json({ message: "Tavsif 150 belgidan oshmasligi kerak" });
        }

        await pool.query(
            "UPDATE home SET title_uz=$1, title_ru=$2, title_eng=$3, title_qq=$4, description_uz=$5, description_ru=$6, description_eng=$7, description_qq=$8 WHERE id=$9",
            [title_uz, title_ru, title_eng, title_qq, description_uz, description_ru, description_eng, description_qq, id]
        );

        res.json({ message: "Yo‘nalish yangilandi" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Serverda xatolik yuz berdi" });
    }
});

// DELETE - Adminlar uchun
router.delete("/:id", verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM home WHERE id=$1", [id]);
        res.json({ message: "Yo‘nalish o‘chirildi" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Serverda xatolik yuz berdi" });
    }
});

module.exports = router;
