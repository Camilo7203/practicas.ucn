export interface ITemplateStatusResponse {
  id: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DISABLED';
  quality_score?: {
    score: string;
    date: string;
  };
  name: string;
  category: string;
}