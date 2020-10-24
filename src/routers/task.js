const express = require("express");
const auth = require('../middleware/auth')
const Task = require("../models/task");

const app = new express.Router();

app.post("/tasks", auth, async (req, res) => {

  const task = new Task({
    ...req.body,
    owner: req.user._id
  })

  try {
    await task.save();
    res.send(task);
  } catch (e) {
    res.status(400).send();
  }
});

// GET /tasks?completed=true
app.get("/tasks", auth, async (req, res) => {

  const match = {}

  const sort = {}

  if(req.query.completed){
    match.completed = req.query.completed === 'true'
  }

  if(req.query.sortBy){
    const part = req.query.sortBy.split(':')
    sort[part[0]] = part[1] === 'desc' ? -1 : 1
  }

  try {
    await req.user.populate({
      path: 'tasks',
      match,
      options:{
        limit:parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate()
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send();
  }
});

app.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({_id, owner:req.user._id});
    res.send(task);
  } catch (e) {
    res.status(500).send();
  }
});

app.patch("/tasks/:id",auth,async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedTasks = ["description", "completed"];

  const isValid = updates.every((task) => allowedTasks.includes(task));

  if (!isValid) {
    return res
      .status(400)
      .send({ error: "The specified object is not allowed to update" });
  }

  try {
    const task = await Task.findOne({_id:req.params.id,owner:req.user._id});

    if (!task) {
      return res.status(400).send();
    }

    updates.forEach((update) => (task[update] = req.body[update]));
    task.save();

    res.send(task);
  } catch (e) {
    res.status(400).send();
  }
});

app.delete("/tasks/:id",auth,async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOneAndDelete({_id,owner: req.user._id});
    if (!task) {
      res.status(404).send();
    }
    res.send(task);
  } catch (e) {
    res.status(500).send;
  }
});

module.exports = app;
