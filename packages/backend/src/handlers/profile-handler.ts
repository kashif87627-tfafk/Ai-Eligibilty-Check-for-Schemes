/**
 * Lambda Handler for User Profile CRUD Operations
 * 
 * Endpoints:
 * - POST /profiles - Create new user profile
 * - GET /profiles/{userId} - Get user profile by ID
 * - PUT /profiles/{userId} - Update user profile
 * - DELETE /profiles/{userId} - Delete user profile
 * - GET /profiles/phone/{phoneNumber} - Get user profile by phone number
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UserProfileRepository } from '../repositories/user-profile-repository';
import { validateCreateUserProfile, validateUpdateUserProfile } from '../utils/validation';
import { CreateUserProfileInput, UpdateUserProfileInput } from '../types/user-profile';

const repository = new UserProfileRepository();

function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  };
}

function createErrorResponse(statusCode: number, message: string, errors?: any): APIGatewayProxyResult {
  return createResponse(statusCode, {
    error: message,
    ...(errors && { details: errors }),
  });
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Event:', JSON.stringify(event, null, 2));

  const httpMethod = event.httpMethod;
  const path = event.path;
  const pathParameters = event.pathParameters || {};

  try {
    // POST /profiles - Create new profile
    if (httpMethod === 'POST' && path.endsWith('/profiles')) {
      return await handleCreateProfile(event);
    }

    // GET /profiles/{userId} - Get profile by ID
    if (httpMethod === 'GET' && pathParameters.userId && !path.includes('/phone/')) {
      return await handleGetProfile(pathParameters.userId);
    }

    // GET /profiles/phone/{phoneNumber} - Get profile by phone number
    if (httpMethod === 'GET' && path.includes('/phone/') && pathParameters.phoneNumber) {
      return await handleGetProfileByPhone(pathParameters.phoneNumber);
    }

    // PUT /profiles/{userId} - Update profile
    if (httpMethod === 'PUT' && pathParameters.userId) {
      return await handleUpdateProfile(event, pathParameters.userId);
    }

    // DELETE /profiles/{userId} - Delete profile
    if (httpMethod === 'DELETE' && pathParameters.userId) {
      return await handleDeleteProfile(pathParameters.userId);
    }

    return createErrorResponse(404, 'Not Found');
  } catch (error) {
    console.error('Error:', error);
    return createErrorResponse(500, 'Internal Server Error', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function handleCreateProfile(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return createErrorResponse(400, 'Request body is required');
  }

  let input: CreateUserProfileInput;
  try {
    input = JSON.parse(event.body);
  } catch (error) {
    return createErrorResponse(400, 'Invalid JSON in request body');
  }

  // Validate input
  const validation = validateCreateUserProfile(input);
  if (!validation.isValid) {
    return createErrorResponse(400, 'Validation failed', validation.errors);
  }

  // Check if phone number already exists
  const existingProfile = await repository.getByPhoneNumber(input.phoneNumber);
  if (existingProfile) {
    return createErrorResponse(409, 'A profile with this phone number already exists', {
      existingUserId: existingProfile.id,
    });
  }

  // Create profile
  const profile = await repository.create(input);

  return createResponse(201, {
    message: 'Profile created successfully',
    profile,
  });
}

async function handleGetProfile(userId: string): Promise<APIGatewayProxyResult> {
  const profile = await repository.getById(userId);

  if (!profile) {
    return createErrorResponse(404, 'Profile not found');
  }

  return createResponse(200, {
    profile,
  });
}

async function handleGetProfileByPhone(phoneNumber: string): Promise<APIGatewayProxyResult> {
  // Decode phone number from URL encoding
  const decodedPhoneNumber = decodeURIComponent(phoneNumber);
  
  const profile = await repository.getByPhoneNumber(decodedPhoneNumber);

  if (!profile) {
    return createErrorResponse(404, 'Profile not found');
  }

  return createResponse(200, {
    profile,
  });
}

async function handleUpdateProfile(event: APIGatewayProxyEvent, userId: string): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return createErrorResponse(400, 'Request body is required');
  }

  let input: Partial<UpdateUserProfileInput>;
  try {
    input = JSON.parse(event.body);
  } catch (error) {
    return createErrorResponse(400, 'Invalid JSON in request body');
  }

  // Add userId to input
  const updateInput: UpdateUserProfileInput = {
    ...input,
    id: userId,
  };

  // Validate input
  const validation = validateUpdateUserProfile(updateInput);
  if (!validation.isValid) {
    return createErrorResponse(400, 'Validation failed', validation.errors);
  }

  // Update profile
  const profile = await repository.update(updateInput);

  if (!profile) {
    return createErrorResponse(404, 'Profile not found');
  }

  return createResponse(200, {
    message: 'Profile updated successfully',
    profile,
  });
}

async function handleDeleteProfile(userId: string): Promise<APIGatewayProxyResult> {
  const success = await repository.delete(userId);

  if (!success) {
    return createErrorResponse(404, 'Profile not found or could not be deleted');
  }

  return createResponse(200, {
    message: 'Profile deleted successfully',
  });
}
