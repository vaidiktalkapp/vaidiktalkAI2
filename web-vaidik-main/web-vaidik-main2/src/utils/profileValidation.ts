// src/utils/profileValidation.ts
import { User } from '../lib/types';

export const isProfileComplete = (user: User | null): boolean => {
  if (!user) return false;

  // Fields required by the VaidikTalk app logic
  const requiredFields = [
    'name',
    'gender',
    'dateOfBirth',
    'timeOfBirth',
    'placeOfBirth',
  ];

  // Check if every required field exists and is not empty
  return requiredFields.every(field => {
    const value = (user as any)[field];
    return value && value.toString().trim().length > 0;
  });
};