/** Internal-only — never rendered on any public-facing page or API response. */
export type LeadNote = {
  id: string;
  leadId: string;
  authorId?: string;
  authorName: string;
  note: string;
  createdAt: Date;
};
