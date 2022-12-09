import { TodosAccess } from '../helpers/todosAcess'
// import { createAttachmentPresignedUrl } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'

const logger = createLogger('todos')

const todosAccess = new TodosAccess()


export async function createTodo(userId: string, newTodo: CreateTodoRequest): Promise<TodoItem> {
  const createdAt = new Date().toISOString()  
  const todoId = uuid.v4()
  let newItem: TodoItem = {
    userId,
    todoId,
    createdAt,
    done: false,
    ...newTodo,
    attachmentUrl: ''
  }
  logger.info('Create Todo Item: ', newItem);
  return await todosAccess.createTodo(newItem)
}

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
  logger.info('UserId: ', userId);
  return todosAccess.getTodosPerUser(userId)
}
  
export async function updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest): Promise<TodoUpdate> {
  let todoUpdate: TodoUpdate = {
    ...updatedTodo
  }
  logger.info('Update detail: ', {"userId": userId, "todoId": todoId, "todoUpdate": todoUpdate});
  return todosAccess.updateTodo(userId, todoId, todoUpdate)
}

export async function updateAttachmentUrl(userId: string, todoId: string, attachmentUrl: string): Promise<string> {
  logger.info('Update Attach: ', {"userId": userId, "todoId": todoId, "attachmentUrl": attachmentUrl});
  return todosAccess.updateAttachmentUrl(userId, todoId, attachmentUrl)
}

  export async function deleteTodo(userId: string, todoId: string) {
    logger.info('Delete Todo: ', { "todoId": todoId, "userId": userId });
    return todosAccess.deleteTodo(userId, todoId)
    
  }
