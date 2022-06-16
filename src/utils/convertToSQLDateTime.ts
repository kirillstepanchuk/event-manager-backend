const convertToSQLDateTime = (date: Date) => date.toISOString().slice(0, 19).replace('T', ' ');

module.exports = { convertToSQLDateTime };
