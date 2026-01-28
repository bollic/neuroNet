const User = require('../models/users');
const PointModel = require('../models/Point');

async function getUserById(userId) {
  return await User.findById(userId);
}
async function getOfficeByGroupId(groupId) {
  return await User.findOne({ role: "office", groupId });
}

async function incrementXP(userId, xpToAdd = 1) {
  const user = await User.findById(userId);
  if (!user) throw new Error('Utente non trovato');

  user.xp = (user.xp || 0) + xpToAdd;

  // Esempio badge
  let newBadge = null;
  if (user.xp === 2) {
    user.badges.push({ name: "Beginner", date: new Date() });
    newBadge = "Beginner";
  }

  await user.save();
  return { user, newBadge };
}

async function updateCategories(userId, categories) {
  const user = await User.findById(userId);
  if (!user) throw new Error("Utente non trovato");

  user.categories = categories;
  await user.save();
  return user.categories;
}

async function getFieldUsersByGroup(groupId) {
  return await User.find({ role: 'field', groupId });
}

module.exports = {
  getUserById,
  getOfficeByGroupId,
  incrementXP,
  updateCategories,
  getFieldUsersByGroup
};
