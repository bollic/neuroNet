const Group = require('../models/Group');
const User = require('../models/users');
const PointModel = require('../models/Point');

async function getGroupById(groupId) {
 let group = await Group.findOne({ groupId });

  if (!group) {
    group = await Group.create({
      groupId,
      name: `Groupe ${groupId}`
    });
  }
  return group;
}

async function buildGroupsPreview() {
  const groupIds = await User.distinct("groupId", { groupId: { $ne: null } });
  const groupsPreview = [];

  for (const groupId of groupIds) {
    const members = await User.find({ groupId }).select("email role").lean();
    const pointsCount = await PointModel.countDocuments({ groupId });
    const lastPoint = await PointModel
      .findOne({ groupId })
      .sort({ createdAt: -1 })
      .select("createdAt name");

    let group = await Group.findOne({ groupId }).lean();
    if (!group) {
      group = {
        groupId,
        name: `Groupe ${groupId}`,
        description: "Aucune description pour le moment.",
        keywords: []
      };
    }

    groupsPreview.push({
      groupId,
      name: group.name,
      description: group.description,
      keywords: group.keywords,
      totalMembers: members.length,
      pointsCount,
      lastPoint,
      membersPreview: members.slice(0, 5)
    });
  }

  groupsPreview.sort((a, b) => b.pointsCount - a.pointsCount);
  return groupsPreview;
}

module.exports = {
  getGroupById,
  buildGroupsPreview
};
