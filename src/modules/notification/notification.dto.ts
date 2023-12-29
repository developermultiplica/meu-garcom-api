/* eslint-disable prettier/prettier */
import { IsString } from 'class-validator';

export class NotificationDto {
    @IsString()
    title: string;

    @IsString()
    message: string;
}
