export interface QueueDto {
  queueId: number;
  queueName: string;
  description: string;
  isActive: boolean;
  createdBy: string;
  createdDate: string;
  modifiedBy?: string | null;
}

export interface UpdateQueueRequest {
  queueId: number;
  queueName: string;
  description: string;
  isActive: boolean;
  modifiedBy: string;
}
