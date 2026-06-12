export interface QueryResponse {
  question: string;
  correctedQuestion?: string;
  sql: string;
  data: any[];
}
