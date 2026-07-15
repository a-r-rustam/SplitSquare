function calculateEqualSplit(amount, memberIds) {
  const totalCents = Math.round(amount * 100);
  const numMembers = memberIds.length;
  const baseShare = Math.floor(totalCents / numMembers);
  const remainder = totalCents - baseShare * numMembers;

  return memberIds.map((userId, index) => {
    const shareCents = index < remainder ? baseShare + 1 : baseShare;
    return {
      user: userId,
      amountOwed: shareCents / 100,
    };
  });
}

function validateCustomSplit(amount, splits) {
  const sum = splits.reduce((acc, s) => acc + s.amountOwed, 0);
  const difference = Math.abs(sum - amount);
  return difference < 0.01;
}

module.exports = { calculateEqualSplit, validateCustomSplit };