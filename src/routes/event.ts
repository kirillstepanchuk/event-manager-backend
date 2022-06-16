import express from 'express';

import validate from '../middleware/validate';
import verifyToken from '../middleware/verifyToken';
import {
  addEventInCalSchema,
  eventSchema,
  bookEventSchema,
  confirnBookingSchema,
  approveEventSchema,
  blockEventSchema,
} from './validationSchemas/event';

const {
  handleGetAllEvents,
  handleGetCategoryOfEvents,
  handleGetEventsByTitle,
  handleGetMapEvents,
  handleGetEvent,
  handleCreateEvent,
  handleAddEvent,
  handleProfileEvents,
  handleEditEvent,
  handleGetUnapprovedEvents,
  handleApproveEvent,
  handleBlockEvent,
  handleClientEvents,
  handleBookUserEvent,
  handleGetBookedUserEvents,
  handleGetHistoryUserEvents,
  handlePublishEvent,
  handleConfirmBookedUserEvent,
} = require('../controllers/event');

const rbac = require('../middleware/rbac');
const { roles } = require('../constants');

const router = express();

router.get('/get-events', handleGetAllEvents);
router.get('/get-events-category', handleGetCategoryOfEvents);
router.get('/get-searched-events', handleGetEventsByTitle);
router.get('/get-map-events', handleGetMapEvents);
router.post('/add-event', validate(eventSchema), verifyToken, handleAddEvent);
router.get('/get-profile-events', verifyToken, handleProfileEvents);
router.get('/get-unapproved-events', verifyToken, rbac([roles.ADMIN, roles.SUPER_ADMIN]), handleGetUnapprovedEvents);
router.get('/get-event', handleGetEvent);
router.post('/book-user-event', validate(bookEventSchema), verifyToken, handleBookUserEvent);
router.post('/confirm-booked-user-event', validate(confirnBookingSchema), verifyToken, handleConfirmBookedUserEvent);
router.get('/get-booked-user-events', verifyToken, handleGetBookedUserEvents);
router.get('/get-history-user-events', verifyToken, handleGetHistoryUserEvents);
router.post('/create-event-in-cal', validate(addEventInCalSchema), handleCreateEvent);
router.post('/edit-event', validate(eventSchema), verifyToken, handleEditEvent);
router.post('/publish-event', verifyToken, handlePublishEvent);
router.post('/approve-event', validate(approveEventSchema), verifyToken, rbac([roles.ADMIN]), handleApproveEvent);
router.post('/delete-event', validate(blockEventSchema), verifyToken, rbac([roles.ADMIN]), handleBlockEvent);
router.get('/get-client-events', verifyToken, rbac([roles.SUPER_ADMIN]), handleClientEvents);

export default router;
