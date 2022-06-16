const { KM_IN_DEG } = require('../constants');

const getDegFromKm = (km: number) => km / KM_IN_DEG;

export default getDegFromKm;
