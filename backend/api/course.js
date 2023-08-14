const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const courseModel = require("../db/scoreSchema");
const router = express.Router();

//get course detail from api cpe
router.get("/", async (req, res) => {
  try {
    const token = req.cookies.token;
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err)
        return res.status(401).send({ ok: false, message: "Invalid token" });
      else if (!user.cmuAccount)
        return res.status(403).send({ ok: false, message: "Invalid token" });
    });

    const response = await axios.get(
      `${process.env.URL_PATH_CPE}/course/detail`,
      {
        headers: { Authorization: "Bearer " + process.env.TOKEN_API_CPE },
      }
    );

    res.send(response.data);
  } catch (err) {
    return err;
  }
});

//add course & score
router.post("/add", async (req, res) => {
  try {
    const token = req.cookies.token;
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err)
        return res.status(401).send({ ok: false, message: "Invalid token" });
      else if (!user.cmuAccount)
        return res.status(403).send({ ok: false, message: "Invalid token" });
    });
    const decoded = jwt.decode(token);

    // find duplicated course
    const course = await courseModel.findOne({
      courseNo: req.body.courseNo,
      year: req.body.year,
      semaster: req.body.semaster,
    });

    const section = await courseModel.findOne({
      courseNo: req.body.courseNo,
      year: req.body.year,
      semaster: req.body.semaster,
      "sections.section": req.body.sections[0].section
    })

    // if(req.body.courseNo.substring(0, 3) === "261" && decoded.cmuAccount === "dome.potikanond@cmu.ac.th")

    // add new course
    if (!section) {
      // add new score
      // course.sections.push(req.body.sections[0]);
      // await course.save();
      // return res.send(course);

      // add new section
      course.sections.push(req.body.sections[0])
      await course.save();
      console.log(course);
      return res.send(course);
    } else if (!course) {
      const newCourse = await courseModel.create({
        courseNo: req.body.courseNo,
        year: req.body.year,
        semaster: req.body.semaster,
      });
      newCourse.save();
      return res.send(newCourse);
    }
      
    return res.send({
      message: "You Cannot Add This Course..",
    });
  } catch (err) {
    return err;
  }
});

//add owner of course
router.put("/owner", async (req, res) => {
  try {
    const token = req.cookies.token;
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err)
        return res.status(401).send({ ok: false, message: "Invalid token" });
      else if (!user.cmuAccount)
        return res.status(403).send({ ok: false, message: "Invalid token" });
    });

    const course = await courseModel.findOne({
      courseNo: req.query.courseNo,
      section: req.query.section,
      year: req.query.year,
      semaster: req.query.semaster,
    });

    course.courseOwner.push(req.query.owner);
    await course.save();
    return res.send(course);
  } catch (err) {
    return err;
  }
});

module.exports = router;
