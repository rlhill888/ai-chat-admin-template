import * as Sentry from "@sentry/nextjs";
import { dynamoDB } from "../dynamodb";
import User from "../dynamoDbSchemaInterfaces/user";
import { GetCommand, PutCommand, PutCommandOutput, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";

export class UserAlreadyExistsError extends Error {
    constructor() {
        super("User already exists");
        this.name = "UserAlreadyExistsError";
    }
}

export async function createUser(user: User): Promise<PutCommandOutput> {
    try {
        const newUser: User = {
            ...user,
            password: "",
        };
        const command = new PutCommand({
            TableName: process.env.USERS_DYNAMODB_TABLE_NAME!,
            Item: newUser,
            ConditionExpression: "attribute_not_exists(email)",
        });
        const response = await dynamoDB.send(command);
        return response
    } catch (error: any) {
        console.log(error)
        if (error.name === "ConditionalCheckFailedException") {
            throw new UserAlreadyExistsError();
        } else {
            Sentry.captureException(error);
            console.error("Error creating user:", error);

            throw error;
        }
    }
}

export async function registerUser(
  email: string,
  password: string,
  phoneNumber: string,
  active: boolean
) {
  try {
    const hashedPassword = await bcrypt.hash(password, Number(process.env.SALT!));
    const command = new UpdateCommand({
      TableName: process.env.USERS_DYNAMODB_TABLE_NAME!,
      Key: {
        email,
      },
      UpdateExpression:
        "SET #password = :password, #phoneNumber = :phoneNumber, #active = :active REMOVE #registrationLink",
      ExpressionAttributeNames: {
        "#password": "password",
        "#phoneNumber": "phoneNumber",
        "#active": "active",
        "#registrationLink": "registrationLink",
      },
      ExpressionAttributeValues: {
        ":password": hashedPassword,
        ":phoneNumber": phoneNumber,
        ":active": true,
      },
      ReturnValues: "ALL_NEW",
      ConditionExpression: "attribute_exists(email)",
    });

    const response = await dynamoDB.send(command);

    return response;
  } catch (error: any) {
    console.log(error);

    if (error.name === "ConditionalCheckFailedException") {
      throw new Error("User does not exist");
    } else {
      Sentry.captureException(error);
      console.error("Error updating user:", error);
      throw error;
    }
  }
}

export async function getUserByRegistrationLink(registrationLink: string) {
    if (!registrationLink) {
      throw new Error("registrationLink is required");
    }
  
    const params = {
      TableName: process.env.USERS_DYNAMODB_TABLE_NAME!,
      FilterExpression: "registrationLink = :link",
      ExpressionAttributeValues: {
        ":link": registrationLink,
      },
    };
  
    try {
      const result = await dynamoDB.send(new ScanCommand(params));
  
      return result.Items?.[0] || null;
    } catch (error) {
        Sentry.captureException(error, {
          extra: {
            registrationLink,
            tableName: "Users",
            operation: "ScanCommand",
          },
        });
        console.error("Error fetching user by registrationLink:", error);
    
        throw error; 
      }
}

export async function getAllUsers() {
  const params = {
    TableName: process.env.USERS_DYNAMODB_TABLE_NAME!,
  };

  try {
    const result = await dynamoDB.send(new ScanCommand(params));

    return result.Items || [];
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        tableName: "Users",
        operation: "ScanCommand - getAllUsers",
      },
    });

    console.error("Error fetching all users:", error);

    throw error;
  }
}

export async function setUserStatus(email: string, active: boolean) {
  try {
    const command = new UpdateCommand({
      TableName: process.env.USERS_DYNAMODB_TABLE_NAME!,
      Key: { email },
      UpdateExpression: active
        ? "SET #active = :active REMOVE #statusSetToOff"
        : "SET #active = :active, #statusSetToOff = :statusSetToOff",
      ExpressionAttributeNames: {
        "#active": "active",
        "#statusSetToOff": "statusSetToOff",
      },
      ExpressionAttributeValues: active
        ? { ":active": true }
        : { ":active": false, ":statusSetToOff": true },
      ConditionExpression: "attribute_exists(email)",
      ReturnValues: "ALL_NEW",
    });

    return await dynamoDB.send(command);
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      throw new Error("User does not exist");
    }
    Sentry.captureException(error, {
      extra: { email, active, operation: "UpdateCommand - setUserStatus" },
    });
    console.error("Error setting user status:", error);
    throw error;
  }
}

export async function setUserAdmin(email: string, admin: boolean) {
  try {
    const command = new UpdateCommand({
      TableName: process.env.USERS_DYNAMODB_TABLE_NAME!,
      Key: { email },
      UpdateExpression: "SET #admin = :admin",
      ExpressionAttributeNames: { "#admin": "admin" },
      ExpressionAttributeValues: { ":admin": admin },
      ConditionExpression: "attribute_exists(email)",
      ReturnValues: "ALL_NEW",
    });

    const response = await dynamoDB.send(command);
    return response;
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      throw new Error("User does not exist");
    }
    Sentry.captureException(error, {
      extra: { email, admin, operation: "UpdateCommand - setUserAdmin" },
    });
    console.error("Error setting user admin:", error);
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  try{
    const result = await dynamoDB.send(
      new GetCommand({
        TableName: process.env.USERS_DYNAMODB_TABLE_NAME as string,
        Key: {
          email,
        },
      })
    );
    return result.Item ?? null;

  }catch(error){
    {
      Sentry.captureException(error, {
        extra: {
          email,
          tableName: process.env.USERS_TABLE,
          operation: "GetCommand",
          function: "getUserByEmail",
        },
      });
  
      console.error("Error fetching user by email:", error);
  
      throw error;
    }
  
  }
}