import { Response } from 'express';

import getAuth from '../configs/oAuth2Client.config';
import connection, { dbParameters } from '../configs/db.config';
import { TypedRequest } from '../types/api';
import getDegFromKm from '../utils/getDegFromKm';
import getTimeZone from '../utils/getTimeZone';
import sortEventCategories from '../utils/sortEventCategories';
import getPaymentSession from '../utils/getPaymentSession';

const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);
const google = require('googleapis');

const {
  httpStatusCode, DEFAULT_TIME_ZONE, CALENDAR_ID, eventTypes, SUCCESS_PAYMENT_STATUS,
} = require('../constants');

const convertToSQLDateTime = (date: Date) => date.toISOString().slice(0, 19).replace('T', ' ');

const handleGetAllEvents = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const dateNow = convertToSQLDateTime(new Date(Date.now()));

    const sqlQuery = `
    SELECT *
    FROM (SELECT title, eventDate, eventTime, preview, category, timeZone, id, price, currency, vipPrice,
      (@category_rank := if(@current_category = category, @category_rank + 1, 1)) as category_rank,
        @current_category:=category as current_category
      FROM ${dbParameters.NAME}.events
      CROSS JOIN (SELECT @current_category:=NULL, @category_rank:=1) as vars
      WHERE isApproved='1' and isBlocked='0' and isPublished='1' and eventDate >= '${dateNow}'
      ORDER BY category ASC
    ) category
    WHERE category_rank <= 12;
    `;

    const selectAdEvents = `
    SELECT title, eventDate, eventTime, preview, timeZone, id, price, currency, vipPrice, ${dbParameters.NAME}.events.category, frequency, currentFrequency
    FROM ${dbParameters.NAME}.events
    CROSS JOIN ${dbParameters.NAME}.advertisements
    WHERE id = eventId and advStartDate <= '${dateNow}' and advEndDate >= '${dateNow}' and currentFrequency > 0;`;

    connection.query(selectAdEvents, (err, results) => {
      const adResults = results.slice(0, 12);

      adResults.forEach((event) => {
        const updateQuery = `UPDATE ${dbParameters.NAME}.advertisements SET currentFrequency=currentFrequency-1 WHERE eventId=${event.id};`;
        connection.query(updateQuery);
      });

      const adCategories = adResults.slice(0).map((event) => event.category);

      const adEvents = sortEventCategories(adCategories, adResults);

      connection.query(sqlQuery, (error, result) => {
        const categories = result.slice(0).map((event) => event.category);

        const events = sortEventCategories(categories, result, adEvents);

        res.status(httpStatusCode.OK).send(events);
      });
    });
  } catch (error: unknown) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};


const handleGetCategoryOfEvents = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const numPerPage = 2;
    const skip = (+req.query.page - 1) * numPerPage;
    const limit = `${skip},${numPerPage}`;

    const sqlGetEventsCountQuery = `SELECT count(*) as eventsCount FROM ${dbParameters.NAME}.events WHERE category='${req.query.category}'`;

    connection.query(sqlGetEventsCountQuery, (err, results) => {
      const numRows = results[0].eventsCount;
      const numPages = Math.ceil(numRows / numPerPage);

      const sqlQuery = `SELECT * from ${dbParameters.NAME}.events WHERE category='${req.query.category}' LIMIT ${limit}`;
      connection.query(sqlQuery, (error, rows) => res.send({
        events: rows,
        pageCount: numPages,
      }));
    });
  } catch (error) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleGetEventsByTitle = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const numPerPage = 2;
    const skip = (+req.query.page - 1) * numPerPage;
    const limit = `${skip},${numPerPage}`;

    const sqlGetEventsCountQuery = `SELECT count(*) as eventsCount FROM ${dbParameters.NAME}.events WHERE title LIKE '%${req.query.title}%'`;

    connection.query(sqlGetEventsCountQuery, (err, results) => {
      const numRows = results[0].eventsCount;
      const numPages = Math.ceil(numRows / numPerPage);

      const sqlQuery = `SELECT * from ${dbParameters.NAME}.events WHERE title LIKE '%${req.query.title}%' LIMIT ${limit}`;
      connection.query(sqlQuery, (error, rows) => res.send({
        events: rows,
        pageCount: numPages,
      }));
    });
  } catch (error) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleGetMapEvents = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const lat = +req.query.lat;
    const lng = +req.query.lng;
    const radius = +req.query.radius;

    const radiusInDeg = getDegFromKm(radius);

    const sqlQueryRadiusEvents = `
    SELECT id, title, address, lng, lat from ${dbParameters.NAME}.events 
    WHERE lng BETWEEN ${lng - radiusInDeg} AND ${lng + radiusInDeg} AND lat BETWEEN ${lat - radiusInDeg} AND ${lat + radiusInDeg}
    `;

    connection.query(sqlQueryRadiusEvents, (err, results) => res.send(results));
  } catch (error) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleGetEvent = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const sqlQuery = `
    SELECT id, title, description, eventDate, eventTime, organizerId, category, preview, address, lng, lat, timeZone, price, isApproved, eventEndDate, contactPerson, contactOption, currency, vipPrice
    from ${dbParameters.NAME}.events WHERE id='${req.query.event_id}'`;

    connection.query(sqlQuery, (err, results) => res.status(httpStatusCode.OK).send(results[0]));
  } catch (error) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleCreateEvent = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const oauth2Client = getAuth();
    const { code, user_id } = req.body;
    const { tokens } = await oauth2Client.getToken(code);
    const sqlQuery = `
    SELECT title, address, description, eventDate, eventTime 
    from ${dbParameters.NAME}.events WHERE id='${user_id}'`;

    connection.query(sqlQuery, async (err, results) => {
      const {
        title, address, description, eventDate,
      } = results[0];

      const startDate = new Date(eventDate);
      const endDate = new Date(startDate.setMilliseconds(2 * 60 * 60 * 1000));

      const event = {
        summary: title,
        location: address,
        description,
        start: {
          dateTime: startDate,
          timeZone: DEFAULT_TIME_ZONE,
        },
        end: {
          dateTime: endDate,
          timeZone: DEFAULT_TIME_ZONE,
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 },
          ],
        },
      };

      oauth2Client.setCredentials({ refresh_token: tokens.refresh_token });
      const calendar = google.calendar('v3');
      await calendar.events.insert({
        auth: oauth2Client,
        calendarId: CALENDAR_ID,
        resource: event,
      });

      return res.send(req.t('event.addInCalendar.success'));
    });
  } catch (error) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleAddEvent = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const { data } = req.body;
    const dateTime = new Date(data.date).toISOString().slice(0, 19).replace('T', ' ');
    const date = dateTime.split(' ')[0];
    const time = dateTime.split(' ')[1];

    const queryAddEvent = `
    INSERT INTO ${dbParameters.NAME}.events (title, address, lng, lat, category, eventDate, eventTime, description, organizerId) 
    VALUES ('${data.title}', '${data.address}', '${data.longtitude}', '${data.latitude}', '${data.category}', '${date}', '${time}', '${data.description}', '${req.tokenData.userId}');
    `;

    connection.query(queryAddEvent, (err) => {
      if (err) {
        return res.status(httpStatusCode.BAD_REQUEST).send({
          message: req.t('event.add.error'),
        });
      }
      return res.status(httpStatusCode.OK).send({
        message: req.t('event.add.success'),
      });
    });
  } catch (e) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleProfileEvents = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const { eventsType } = req.query;
    if (eventsType === eventTypes.ORGANIZED) {
      const queryFindOrganizedEvents = `SELECT preview, eventDate, eventTime, title, timeZone, id from ${dbParameters.NAME}.events WHERE organizerId='${req.tokenData.userId}'`;
      connection.query(queryFindOrganizedEvents, (err, result) => {
        if (result.length === 0) {
          return res.status(httpStatusCode.BAD_REQUEST).send({
            message: req.t('event.getOrganized.noEvents'),
          });
        }
        res.send({
          type: eventsType,
          events: result,
        });
      });
    }
  } catch (e) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleClientEvents = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const { eventsType, user_id } = req.query;
    if (eventsType === eventTypes.ORGANIZED) {
      const queryFindOrganizedEvents = `SELECT preview, eventDate, eventTime, title, timeZone, id from ${dbParameters.NAME}.events WHERE organizerId='${user_id}'`;
      connection.query(queryFindOrganizedEvents, (err, result) => {
        if (result.length === 0) {
          return res.status(httpStatusCode.BAD_REQUEST).send({
            message: req.t('event.getOrganized.noEvents'),
          });
        }
        res.send({
          type: eventsType,
          events: result,
        });
      });
    }
  } catch (e) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleEditEvent = (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const { data } = req.body;
    const eventId = req.query.event_id;
    const dateTime = new Date(data.date).toISOString().slice(0, 19).replace('T', ' ');
    const timeZone = getTimeZone(new Date(data.date).getTimezoneOffset());
    const date = dateTime.split(' ')[0];
    const time = dateTime.split(' ')[1];

    const queryFindOrganizer = `SELECT organizerId FROM ${dbParameters.NAME}.events where id='${eventId}'`;

    connection.query(queryFindOrganizer, (err, result) => {
      if (result[0].organizerId !== req.tokenData.userId) {
        return res.status(httpStatusCode.BAD_REQUEST).send({
          message: req.t('event.edit.noPermission'),
        });
      }

      const queryEditEvent = `
      UPDATE ${dbParameters.NAME}.events SET 
      title='${data.title}',
      address='${data.address}',
      lng='${data.longtitude}',
      lat='${data.latitude}',
      category='${data.category}',
      eventDate='${date}',
      eventTime='${time}',
      description='${data.description}',
      preview='${data.preview}',
      price='${data.price}',
      timeZone='${timeZone}'
      WHERE id='${eventId}';
      `;

      connection.query(queryEditEvent, (error) => {
        if (error) {
          return res.status(httpStatusCode.BAD_REQUEST).send({
            message: req.t('event.edit.error'),
          });
        }
        return res.status(httpStatusCode.OK).send({
          message: req.t('event.edit.success'),
        });
      });
    });
  } catch (e) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleBookUserEvent = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const {
      paymenthMethod, paymentData, currency, successRoute, cancelRoute,
    } = req.body;

    const sqlQuery = `
    INSERT INTO ${dbParameters.NAME}.user_events (user_id, event_id) 
    VALUES (${req.tokenData.userId}, ${req.body.event_id})`;

    connection.query(sqlQuery, async () => {
      const session = await getPaymentSession(
        paymenthMethod, paymentData, currency, successRoute, cancelRoute,
      );

      return res.status(httpStatusCode.OK).send({
        url: session.url,
        session_id: session.id,
      });
    });
  } catch (error) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleConfirmBookedUserEvent = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.body.session_id);
    if (session.payment_status !== SUCCESS_PAYMENT_STATUS) {
      return res.status(httpStatusCode.BAD_REQUEST).send({ message: req.t('event.confirmBooking.error') });
    }

    const sqlQuery = `
    UPDATE ${dbParameters.NAME}.user_events 
    SET isConfirmed = '1' 
    WHERE user_id = '${req.tokenData.userId}' AND event_id = '${req.body.event_id}';`;

    connection.query(sqlQuery, () => res.status(httpStatusCode.OK).send({ message: req.t('event.confirmBooking.success') }));
  } catch (error) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleGetBookedUserEvents = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const currentDate = new Date(Date.now()).toISOString();
    const sqlQuery = `
    SELECT title 
    FROM ${dbParameters.NAME}.events e 
    JOIN ${dbParameters.NAME}.user_events ue 
    ON e.id = ue.event_id 
    WHERE eventDate >= '${currentDate}' 
    AND user_id = '${req.tokenData.userId}' AND isConfirmed = '1';`;

    connection.query(sqlQuery, (err, results) => res.status(httpStatusCode.OK).send(results));
  } catch (error) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleGetHistoryUserEvents = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const currentDate = new Date(Date.now()).toISOString();
    const sqlQuery = `
    SELECT title 
    FROM ${dbParameters.NAME}.events e 
    JOIN ${dbParameters.NAME}.user_events ue 
    ON e.id = ue.event_id 
    WHERE eventDate < '${currentDate}' 
    AND user_id = '${req.tokenData.userId}' AND isConfirmed = '1';`;

    connection.query(sqlQuery, (err, results) => res.status(httpStatusCode.OK).send(results));
  } catch (error) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleGetUnapprovedEvents = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const sqlQuery = `
    SELECT id, title, eventDate, eventTime, preview, timeZone
    from ${dbParameters.NAME}.events WHERE isApproved='0'`;

    connection.query(sqlQuery, (err, results) => res.status(httpStatusCode.OK).send(results));
  } catch (e) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handlePublishEvent = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const sqlQuery = `UPDATE ${dbParameters.NAME}.events SET isPublished='1' WHERE id='${req.tokenData.userId}';`;

    connection.query(sqlQuery, () => res.status(httpStatusCode.OK).send({
      message: req.t('event.publish.success'),
    }));
  } catch (e) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleApproveEvent = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const sqlQuery = `UPDATE ${dbParameters.NAME}.events SET isApproved='1' WHERE id='${req.body.event_id}';`;

    connection.query(sqlQuery, () => res.status(httpStatusCode.OK).send({
      message: req.t('event.approve.success'),
    }));
  } catch (e) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

const handleBlockEvent = async (
  req: TypedRequest,
  res: Response,
) => {
  try {
    const sqlQuery = `UPDATE ${dbParameters.NAME}.events SET isBlocked='1' WHERE id='${req.body.event_id}';`;

    connection.query(sqlQuery, () => res.status(httpStatusCode.OK).send({
      message: req.t('event.block.success'),
    }));
  } catch (e) {
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).send({
      message: req.t('requestError.message'),
    });
  }
};

module.exports = {
  handleGetAllEvents,
  handleGetCategoryOfEvents,
  handleGetEventsByTitle,
  handleGetMapEvents,
  handleGetEvent,
  handleCreateEvent,
  handleAddEvent,
  handleProfileEvents,
  handleEditEvent,
  handleBookUserEvent,
  handleConfirmBookedUserEvent,
  handleGetBookedUserEvents,
  handleGetHistoryUserEvents,
  handleGetUnapprovedEvents,
  handlePublishEvent,
  handleApproveEvent,
  handleBlockEvent,
  handleClientEvents,
};
