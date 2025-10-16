const express = require('express');
const router = express.Router();

// Placeholder routes for tasks
router.get('/', (req, res) => res.json({ message: 'Tasks endpoint - coming soon' }));
router.post('/', (req, res) => res.json({ message: 'Create task - coming soon' }));
router.get('/:id', (req, res) => res.json({ message: 'Get task - coming soon' }));
router.put('/:id', (req, res) => res.json({ message: 'Update task - coming soon' }));
router.delete('/:id', (req, res) => res.json({ message: 'Delete task - coming soon' }));

module.exports = router;
