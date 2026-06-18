export interface WorkflowState {
  edgeOrderStateId: number;
  orderSeq: number;
  currentQueueId: number;
  queueName: string;
  isAcquired: boolean;
  acquiredBy: string | null;
  acquiredByName: string | null;
  stageChangeDate: string | null;
  completionDate: string | null;
  createdDate: string;
  startedOn: string;
}

export interface WorkflowHistoryItem {
  activityName: string;
  comments: string;
  userName: string;
  timestamp: string;
  eventType: string;
  orderStatus: string | null;
}

export interface WorkflowActionResult {
  success: boolean;
  message: string;
}

export interface BulkAcquireItemResult {
  orderSeq: number;
  status: 'acquired' | 'already_acquired' | 'no_queue' | 'error';
  message: string;
}

export interface BulkAcquireResult {
  totalRequested: number;
  acquiredCount: number;
  alreadyAcquiredCount: number;
  noQueueCount: number;
  errorCount: number;
  items: BulkAcquireItemResult[];
}
