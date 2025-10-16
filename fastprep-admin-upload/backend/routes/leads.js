const express = require('express');
const router = express.Router();

// Placeholder routes for leads
router.get('/', (req, res) => res.json({ message: 'Leads endpoint - coming soon' }));
router.post('/', (req, res) => res.json({ message: 'Create lead - coming soon' }));
router.get('/:id', (req, res) => res.json({ message: 'Get lead - coming soon' }));
router.put('/:id', (req, res) => res.json({ message: 'Update lead - coming soon' }));
router.delete('/:id', (req, res) => res.json({ message: 'Delete lead - coming soon' }));

module.exports = router;
