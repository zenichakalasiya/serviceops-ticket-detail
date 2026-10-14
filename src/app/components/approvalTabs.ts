/* The tab set a record shows when it is opened from My Approvals.

   An approver is not here to administer the record — they are here to read the
   thread, see where the decision stands and check what the record touches. Every
   detail page rendered through `ApprovalDrawer` collapses to these three, in this
   order, whatever module it belongs to. Typed as plain `string[]` so a drawer can
   test its own narrow tab union against it. */
export const APPROVAL_TAB_IDS: string[] = ['conversation', 'approvals', 'relations'];
