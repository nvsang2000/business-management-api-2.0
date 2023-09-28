export class PaginationMetaParams {
  totalDocs?: number;
  totalPages?: number;

  constructor() {
    this.totalDocs = +this.totalDocs || 0;
    this.totalPages = +this.totalPages || 0;
  }
}
