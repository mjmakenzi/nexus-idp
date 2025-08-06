import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Custom validation decorator for phone number format
 * Validates that the phone number is 8-15 digits and starts with a valid digit
 */
export function IsValidPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          // Remove all non-digit characters
          const digitsOnly = value.replace(/\D/g, '');

          // Check if it's a valid phone number (8-15 digits)
          if (digitsOnly.length < 8 || digitsOnly.length > 15) return false;

          // Check if it starts with a valid digit
          if (!/^[0-9]/.test(digitsOnly)) return false;

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid phone number`;
        },
      },
    });
  };
}

/**
 * Custom validation decorator for country code
 * Validates that the country code is 1-5 digits, optionally starting with +
 */
export function IsValidCountryCode(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidCountryCode',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          // Remove + if present and check if it's all digits
          const cleanValue = value.replace(/^\+/, '');

          // Check if it's 1-5 digits
          if (!/^[0-9]{1,5}$/.test(cleanValue)) return false;

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid country code (1-5 digits, optionally starting with +)`;
        },
      },
    });
  };
}

/**
 * Custom validation decorator for OTP code
 * Validates that the OTP is 4-6 digits
 */
export function IsValidOtpCode(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidOtpCode',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          // Check if it's 4-6 digits
          if (!/^[0-9]{4,6}$/.test(value)) return false;

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid OTP code with 4-6 digits`;
        },
      },
    });
  };
}

/**
 * Custom validation decorator for email format
 * Validates that the email follows a proper format
 */
export function IsValidEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidEmail',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          // Basic email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid email address`;
        },
      },
    });
  };
}

/**
 * Custom validation decorator for IP address format
 * Validates IPv4 and IPv6 addresses
 */
export function IsValidIpAddress(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidIpAddress',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          // IPv4 regex
          const ipv4Regex =
            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

          // IPv6 regex (simplified)
          const ipv6Regex =
            /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

          return ipv4Regex.test(value) || ipv6Regex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid IP address`;
        },
      },
    });
  };
}
