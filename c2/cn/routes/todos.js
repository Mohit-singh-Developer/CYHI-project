// Add todo
router.post('/', async (req, res) => {
  try {
    const todo = new Todo({
      text: req.body.text,
      deadline: req.body.deadline,   // ✅ allow setting deadline
      user: req.user.id
    });
    const saved = await todo.save();
    res.status(201).json(saved);
  } catch {
    res.status(400).json({ error: 'Failed to add todo' });
  }
});

// Update todo
router.put('/:id', async (req, res) => {
  try {
    const updated = await Todo.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        text: req.body.text,
        completed: req.body.completed,
        deadline: req.body.deadline   // ✅ allow updating deadline
      },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Todo not found' });
    res.json(updated);
  } catch {
    res.status(400).json({ error: 'Failed to update todo' });
  }
});
