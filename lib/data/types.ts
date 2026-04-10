
export type OperationStatus = "idle" | "loading" | "success" | "error"

export interface OperationState {
  status: OperationStatus
  error?: string
  timestamp: number
}
