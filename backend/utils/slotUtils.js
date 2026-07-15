const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');

// Cache replica-set check result — only probe once per process lifetime
let replicaSetAvailable = null;

async function checkReplicaSet() {
  if (replicaSetAvailable !== null) return replicaSetAvailable;
  try {
    const info = await mongoose.connection.db.admin().command({ hello: 1 });
    replicaSetAvailable = !!(info.setName || info.hosts);
  } catch {
    replicaSetAvailable = false;
  }
  return replicaSetAvailable;
}

async function isSlotTaken(date, time, session = null) {
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);
  const query = {
    date: { $gte: dayStart, $lte: dayEnd },
    time,
    status: { $nin: ['cancelled'] },
  };
  const opts = session ? { session } : {};
  return !!(await Appointment.findOne(query, null, opts).lean());
}

// Runs fn(session) inside a MongoDB transaction when a replica set is available.
// Falls back to fn(null) on Atlas M0 / standalone MongoDB (no transactions).
async function withOptionalTransaction(fn) {
  const hasReplicaSet = await checkReplicaSet();
  if (!hasReplicaSet) return fn(null);

  const dbSession = await mongoose.startSession();
  try {
    let result;
    await dbSession.withTransaction(async () => { result = await fn(dbSession); });
    return result;
  } finally {
    await dbSession.endSession();
  }
}

module.exports = { isSlotTaken, withOptionalTransaction };
