async function getExpenseDetails(expenseId: string) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      paidBy: true,
      participants: {
        include: {
          user: true
        }
      },
      category: true,
      group: {
        include: {
          members: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });

  if (!expense) {
    throw new Error("Expense not found");
  }

  // Get all participants for this expense, including both registered and invited users
  const participants = await Promise.all(
    expense.participants.map(async p => {
      // Check if this is an invited user
      const isInvitedUser = await prisma.invitedUser.findUnique({
        where: { id: p.user.id }
      });

      return {
        id: p.user.id,
        name: p.user.name,
        email: p.user.email,
        share: p.share,
        paid: p.paid,
        type: isInvitedUser ? "invited" : "registered"
      };
    })
  );

  // Calculate total amount and shares
  const totalAmount = expense.amount;
  const totalShares = participants.reduce((sum, p) => sum + p.share, 0);
  const shareValue = totalAmount / totalShares;

  // Calculate balances for each participant
  const balances = participants.map(p => {
    const expectedAmount = p.share * shareValue;
    const paidAmount = p.paid;
    return {
      userId: p.id,
      name: p.name,
      email: p.email,
      share: p.share,
      expectedAmount,
      paidAmount,
      balance: paidAmount - expectedAmount,
      type: p.type
    };
  });

  return {
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    date: expense.date,
    category: expense.category,
    paidBy: expense.paidBy,
    participants: balances,
    group: expense.group,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt
  };
}
