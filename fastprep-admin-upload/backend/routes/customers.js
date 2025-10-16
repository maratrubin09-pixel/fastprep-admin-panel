const express = require('express');
const router = express.Router();

// Placeholder routes for customers
router.get('/', (req, res) => res.json({ message: 'Customers endpoint - coming soon' }));
router.post('/', (req, res) => res.json({ message: 'Create customer - coming soon' }));
router.get('/:id', (req, res) => res.json({ message: 'Get customer - coming soon' }));
router.put('/:id', (req, res) => res.json({ message: 'Update customer - coming soon' }));
router.delete('/:id', (req, res) => res.json({ message: 'Delete customer - coming soon' }));

module.exports = router;
