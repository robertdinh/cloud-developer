export interface TodoItem {
  userId: string
  todoId: string
  createdAt: string
  name: string
  detail: string
  dueDate: string
  done: boolean
  attachmentUrl?: string
}
