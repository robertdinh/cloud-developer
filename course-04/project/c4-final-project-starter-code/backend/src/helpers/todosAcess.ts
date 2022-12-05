import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

export class TodosAccess {

    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE) {
    }

    async createTodo(todo: TodoItem): Promise<TodoItem> {
        logger.info('CreateTodo');
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todo
        }).promise()
        logger.info('Todo item: ', todo);
        return todo
    }

    async getTodosPerUser(userId: string): Promise<TodoItem[]> {
        logger.info('GetTodosPerUser');

        const params = {
            TableName: this.todosTable,
            KeyConditionExpression: "#DYNOBASE_userId = :pkey",
            ExpressionAttributeValues: {
              ":pkey": userId
            },  
            ExpressionAttributeNames: {
              "#DYNOBASE_userId": "userId"
            },
            ScanIndexForward: true
          };
          
        const result = await this.docClient.query(params).promise();
          
        const items = result.Items
        logger.info('Todo list: ', items);
        return items as TodoItem[]
    }

    async updateTodo(userId: string, todoId: string, todoUpdate: TodoUpdate): Promise<TodoUpdate> {
        logger.info('UpdateTodo');
        var params = {
            TableName: this.todosTable,
            Key: {
                userId: userId,
                todoId: todoId
            },
            UpdateExpression: 'set #dynobase_name = :name, dueDate = :dueDate, done = :done',
            ExpressionAttributeValues: {
                ':name': todoUpdate.name,
                ':dueDate': todoUpdate.dueDate,
                ':done': todoUpdate.done,
            },
            ExpressionAttributeNames: { "#dynobase_name": "name" }
        };

        await this.docClient.update(params, function (err, data) {
            if (err) logger.console.error(err);
            else logger.log(data);
        }).promise()
        logger.info('Updated item: ', todoUpdate);
        return todoUpdate
    }

    async updateAttachmentUrl(userId: string, todoId: string, uploadUrl: string): Promise<string> {
        logger.info('updateAttachmentUrl ', uploadUrl);
        var params = {
            TableName: this.todosTable,
            Key: {
                userId: userId,
                todoId: todoId
            },
            UpdateExpression: 'set attachmentUrl = :attachmentUrl',
            ExpressionAttributeValues: {
                ':attachmentUrl': uploadUrl.split("?")[0]
            }
        };

        await this.docClient.update(params, function (err, data) {
            if (err) logger.console.error(err);
            else logger.log(data);
        }).promise()
        logger.info('updated url: ', uploadUrl);
        return uploadUrl
    }

    async deleteTodo(userId: string, todoId: string) {
        logger.info('DeleteTodo');
        var params = {
            TableName: this.todosTable,
            Key: {
                userId: userId,
                todoId: todoId
            }
        };

        await this.docClient.delete(params, function (err, data) {
            if (err) logger.console.error(err);
            else logger.log(data);
        })
        logger.info('deleted item id: ', todoId);
    }
}
