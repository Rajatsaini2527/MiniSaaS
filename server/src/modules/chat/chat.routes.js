'use strict';

const { Router } = require('express');
const controller = require('./chat.controller');
const authenticate = require('../../middlewares/authenticate.middleware');

const router = Router();
router.use(authenticate);

router.get('/:workspaceId/messages', controller.getMessages);
router.delete('/messages/:id', controller.deleteMessage);

module.exports = router;
