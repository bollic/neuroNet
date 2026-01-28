// services/planService.js
const PointModel = require("../models/Point");
const ParcelleModel = require("../models/Parcelle");
const Group = require("../models/Group");

const PLANS = require("../config/plans");
// services/planService.js
function buildPlanUX(planCheck) {
  return {
    used: planCheck.totalUsed,
    limit: planCheck.planLimit,
    remaining: planCheck.planLimit - planCheck.totalUsed,
    blocked: !planCheck.allowed,
    percent: Math.round(
      (planCheck.totalUsed / planCheck.planLimit) * 100
    )
  };
}

async function checkPlanLimit(userId, groupId, toAdd = 1) {
  const group = await Group.findOne({ groupId });
  if (!group) {
    throw new Error("Gruppo non trovato");
  }
  if (group.planExpiresAt && group.planExpiresAt < new Date()) {
  group.plan = 'free';
  group.planExpiresAt = null;
  group.planSource = 'expired';
  await group.save();
}

    const plan = group.plan;

  const planConfig = PLANS[plan];
  if (!planConfig) {
    throw new Error(`Piano non valido: ${plan}`);
  }

  const planLimit = planConfig.maxPoints;
  
  const {
    pointsCount,
    parcellePointsCount,
    totalUsed
  } = await countUsedPointsByUser(userId);

  const totalAfter = totalUsed + toAdd;

  return {
    allowed: totalAfter <= planLimit,
    plan,
    planLimit,
    pointsCount,
    parcellePointsCount,
    totalUsed: totalAfter
  };
}

async function countUsedPointsByUser(userId) {
  // 🔹 punti normali
  const pointsCount = await PointModel.countDocuments({
    user: userId,
    isAnon: { $ne: true }
  });

  // 🔹 parcelle
  const parcelles = await ParcelleModel.find({ user: userId });

  let parcellePointsCount = 0;
  parcelles.forEach(p => {
    const coords = p.geometry?.coordinates?.[0] || [];
    parcellePointsCount += coords.length;
  });

  return {
    pointsCount,
    parcellePointsCount,
    totalUsed: pointsCount + parcellePointsCount
  };
}

module.exports = {

  checkPlanLimit,
  countUsedPointsByUser,
  buildPlanUX
};
