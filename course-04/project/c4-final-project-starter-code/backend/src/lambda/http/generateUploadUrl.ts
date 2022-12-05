import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { v4 as uuidv4 } from 'uuid'
import { updateAttachmentUrl } from '../../businessLogic/todos'
import { getUserId } from '../utils'
import { AttachmentUtils } from '../../helpers/attachmentUtils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)
    const attachmentId = uuidv4()
    const attachmentUtils = new AttachmentUtils()
    let uploadUrl = await attachmentUtils.createAttachmentUrl(attachmentId);
    const attachmentUrl = await attachmentUtils.getAttachmentUrl(attachmentId)
    await updateAttachmentUrl(userId, todoId, attachmentUrl)
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        uploadUrl
      })
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
