import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

const jwksUrl = 'https://dev-p801c3gm.us.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {

  const token = getToken(authHeader)
  logger.info('Token: ', token)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  verify(token, populateKey, { algorithms: ['RS256'] }, function (err, decodeed: object) {
    if (err) {
      console.log('Error: ', err)
      logger.error('Error: ', err)
      throw new Error('Invalid JWT token!')
    }
    const jwtPayload = jwt.payload
    if (decodeed['sub'] !== jwt.payload.sub || decodeed['exp'] !== jwtPayload.exp) {
      logger.error('Incorrect JWT token!')
      throw new Error('Incorrect JWT token!')
    }
    
    return jwtPayload
  })

  const jwtPayload = jwt.payload
  // return Token here
  return jwtPayload
}


function populateKey(header, callback) {
  // Required rsa key
  const jwksClient = require('jwks-rsa');
  const client = jwksClient({ jwksUri: jwksUrl })

  // Get signing key value
  client.getSigningKey(header.pid, function (err, key) {
    if (err) { logger.error('Error: ', err) }
    const signing_key = key.publicKey || key.rsaPublicKey;
    callback(null, signing_key);
  });
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}